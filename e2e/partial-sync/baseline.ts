import { createHash, randomUUID } from "node:crypto"
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { findPlatform } from "@nkdk/platform"
import type { PlatformMode } from "./concurrency"
import {
  createInfobaseArchiveStore,
  type InfobaseArchiveStore,
} from "./infobase-archive"
import { openScenarioMcpSession, type ScenarioMcpSession } from "./mcp-session"
import { prepareInfobaseFixture } from "./platform-fixture"
import { writeProjectSettings } from "./project-settings"

export type PrepareBaselineParams = {
  readonly baselineDir: string
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly extensionName: string
  readonly mode: PlatformMode
  readonly nkdkBuildId: string
}

export type BaselineManifest = {
  readonly version: 1
  readonly compatibilityHash: string
  readonly fixtureHashes: { readonly cf: string; readonly cfe: string }
  readonly platformVersion: string
  readonly nkdkBuildId: string
  readonly archiveSha256: string
  readonly projectSha256: string
}

export type BaselineReference = {
  readonly archivePath: string
  readonly projectDir: string
  readonly manifest: BaselineManifest
}

type BuildPaths = {
  readonly baseDir: string
  readonly dataDir: string
  readonly projectDir: string
  readonly logsDir: string
  readonly cfXmlDir: string
  readonly extensionXmlDir: string
  readonly extensionName: string
}

export type BaselineDependencies = {
  platformVersion(): Promise<string>
  prepareInfobase(paths: BuildPaths): Promise<void>
  writeProjectSettings(projectDir: string, baseDir: string, mode: PlatformMode): Promise<void>
  openSession(params: { readonly attemptLogDir: string }): Promise<ScenarioMcpSession>
  createArchiveStore(closeConnection: () => Promise<void>): InfobaseArchiveStore
  operationId(): string
}

export async function prepareOrReuseBaseline(
  params: PrepareBaselineParams,
  dependencies: BaselineDependencies = nodeDependencies,
): Promise<BaselineReference> {
  const platformVersion = await dependencies.platformVersion()
  const fixtureHashes = {
    cf: await hashTree(params.cfXmlDir),
    cfe: await hashTree(params.extensionXmlDir),
  }
  const compatibilityHash = sha256(Buffer.from(JSON.stringify({
    version: 1,
    fixtureHashes,
    platformVersion,
    nkdkBuildId: params.nkdkBuildId,
  })))
  const currentDir = join(params.baselineDir, "current")
  const reusable = await readValidBaseline(currentDir, compatibilityHash)
  if (reusable !== undefined) return reusable

  const temporaryDir = join(params.baselineDir, `.current-${dependencies.operationId()}.tmp`)
  const previousDir = join(params.baselineDir, `.current-${dependencies.operationId()}.previous`)
  await rm(temporaryDir, { recursive: true, force: true })
  await mkdir(temporaryDir, { recursive: true })
  const paths = {
    baseDir: join(temporaryDir, "base"),
    dataDir: join(temporaryDir, "data"),
    projectDir: join(temporaryDir, "project"),
    logsDir: join(temporaryDir, "logs"),
    cfXmlDir: params.cfXmlDir,
    extensionXmlDir: params.extensionXmlDir,
    extensionName: params.extensionName,
  }
  const archivePath = join(temporaryDir, "baseline.dt")
  try {
    await dependencies.prepareInfobase(paths)
    await dependencies.writeProjectSettings(paths.projectDir, paths.baseDir, params.mode)
    const session = await dependencies.openSession({ attemptLogDir: paths.logsDir })
    try {
      await expectSuccessfulCall(session, "nkdk.import_from_infobase", {
        projectDir: paths.projectDir, componentPath: "cf", allowWrite: true,
      })
      await expectSuccessfulCall(session, "nkdk.import_from_infobase", {
        projectDir: paths.projectDir,
        componentPath: `cfe/${params.extensionName}`,
        allowWrite: true,
      })
      await expectSuccessfulCall(session, "nkdk.validate_project", { projectDir: paths.projectDir })
    } finally {
      await session.close()
    }
    await dependencies.createArchiveStore(async () => undefined).dump({
      baseDir: paths.baseDir,
      dataDir: paths.dataDir,
      archivePath,
      logPath: join(paths.logsDir, "baseline-dump.log"),
    })
    await sanitizeProject(paths.projectDir)
    await rm(paths.baseDir, { recursive: true, force: true })
    await rm(paths.dataDir, { recursive: true, force: true })
    const manifest: BaselineManifest = {
      version: 1,
      compatibilityHash,
      fixtureHashes,
      platformVersion,
      nkdkBuildId: params.nkdkBuildId,
      archiveSha256: sha256(await readFile(archivePath)),
      projectSha256: await hashTree(paths.projectDir),
    }
    await writeFile(join(temporaryDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    await readValidBaseline(temporaryDir, compatibilityHash, true)

    await rm(previousDir, { recursive: true, force: true })
    if (await pathExists(currentDir)) await rename(currentDir, previousDir)
    try {
      await rename(temporaryDir, currentDir)
    } catch (caught) {
      if (await pathExists(previousDir)) await rename(previousDir, currentDir)
      throw caught
    }
    await rm(previousDir, { recursive: true, force: true })
    return (await readValidBaseline(currentDir, compatibilityHash, true))!
  } finally {
    await rm(temporaryDir, { recursive: true, force: true })
  }
}

async function expectSuccessfulCall(
  session: ScenarioMcpSession,
  name: string,
  input: unknown,
): Promise<void> {
  const payload = await session.call<Record<string, unknown>>(name, input)
  if (payload["ok"] !== true || (Array.isArray(payload["failed"]) && payload["failed"].length > 0)) {
    throw new Error(`Подготовка эталона: ${name} завершился с ошибкой`)
  }
  const summary = payload["summary"]
  if (typeof summary === "object" && summary !== null && Number(Reflect.get(summary, "errors")) > 0) {
    throw new Error(`Подготовка эталона: ${name} вернул ошибки валидации`)
  }
}

async function readValidBaseline(
  directory: string,
  compatibilityHash: string,
  required = false,
): Promise<BaselineReference | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"))
    if (!isBaselineManifest(parsed) || parsed.compatibilityHash !== compatibilityHash) {
      if (required) throw new Error(`Несовместимый manifest эталона: ${directory}`)
      return undefined
    }
    const archivePath = join(directory, "baseline.dt")
    const projectDir = join(directory, "project")
    if (sha256(await readFile(archivePath)) !== parsed.archiveSha256 ||
      await hashTree(projectDir) !== parsed.projectSha256) {
      if (required) throw new Error(`Проверка хэшей эталона не пройдена: ${directory}`)
      return undefined
    }
    return { archivePath, projectDir, manifest: parsed }
  } catch (caught) {
    if (!required && caught instanceof Error && "code" in caught && caught.code === "ENOENT") return undefined
    if (!required && caught instanceof SyntaxError) return undefined
    throw caught
  }
}

function isBaselineManifest(value: unknown): value is BaselineManifest {
  if (typeof value !== "object" || value === null) return false
  const manifest = value as Record<string, unknown>
  const hashes = manifest["fixtureHashes"]
  return manifest["version"] === 1 &&
    isHash(manifest["compatibilityHash"]) &&
    typeof manifest["platformVersion"] === "string" &&
    typeof manifest["nkdkBuildId"] === "string" &&
    isHash(manifest["archiveSha256"]) &&
    isHash(manifest["projectSha256"]) &&
    typeof hashes === "object" && hashes !== null &&
    isHash(Reflect.get(hashes, "cf")) && isHash(Reflect.get(hashes, "cfe"))
}

async function sanitizeProject(projectDir: string): Promise<void> {
  for (const path of [
    [".nkdk", "platform-sessions"],
    [".nkdk", "tmp"],
    [".nkdk", "operations"],
  ]) {
    await rm(join(projectDir, ...path), { recursive: true, force: true })
  }
}

async function hashTree(root: string): Promise<string> {
  const hash = createHash("sha256")
  for (const path of await listFiles(root)) {
    hash.update(relative(root, path).split(sep).join("/"))
    hash.update("\0")
    hash.update(await readFile(path))
    hash.update("\0")
  }
  return hash.digest("hex")
}

async function listFiles(root: string): Promise<string[]> {
  const result: string[] = []
  const entries = (await readdir(root, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name))
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Символические ссылки запрещены в эталоне: ${path}`)
    if (entry.isDirectory()) result.push(...await listFiles(path))
    else if (entry.isFile()) result.push(path)
    else throw new Error(`Неподдерживаемый файл эталона: ${path}`)
  }
  return result
}

function sha256(contents: Buffer): string {
  return createHash("sha256").update(contents).digest("hex")
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value)
}

async function pathExists(path: string): Promise<boolean> {
  try { await lstat(path); return true }
  catch (caught) {
    if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") return false
    throw caught
  }
}

const nodeDependencies: BaselineDependencies = {
  async platformVersion() {
    const platform = await findPlatform()
    if (platform === undefined) throw new Error("Не найдена платформа 1С")
    return platform.version
  },
  async prepareInfobase(paths) {
    await prepareInfobaseFixture({
      baseDir: paths.baseDir,
      dataDir: paths.dataDir,
      logsDir: paths.logsDir,
      cfXmlDir: paths.cfXmlDir,
      extensionXmlDir: paths.extensionXmlDir,
      extensionName: paths.extensionName,
    })
  },
  writeProjectSettings,
  openSession: openScenarioMcpSession,
  createArchiveStore: createInfobaseArchiveStore,
  operationId: randomUUID,
}
