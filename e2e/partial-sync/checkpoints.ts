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
import type { ScenarioState, ScenarioWorkspace } from "./workspace"
import { writeScenarioState } from "./workspace"

type ManifestPath = `base/${string}` | `project/${string}`

type CheckpointManifest = {
  readonly version: 2
  readonly completedOperation: string | null
  readonly planHash: string
  readonly files: Readonly<Record<ManifestPath, string>>
}

export type CheckpointPublication = {
  readonly completedOperation: string | null
  readonly planHash: string
}

export type CheckpointDependencies = {
  copyDirectory(source: string, destination: string): Promise<void>
  operationId(): string
  writeState(workspace: ScenarioWorkspace, state: ScenarioState): Promise<void>
}

export function createCheckpointDependencies(): CheckpointDependencies {
  return {
    copyDirectory,
    operationId: randomUUID,
    writeState: writeScenarioState,
  }
}

export async function publishCheckpoint(
  workspace: ScenarioWorkspace,
  publication: CheckpointPublication,
  dependencies: CheckpointDependencies = createCheckpointDependencies(),
): Promise<ScenarioState> {
  const operationId = dependencies.operationId()
  const currentDir = join(workspace.checkpointsDir, "current")
  const temporaryDir = join(workspace.checkpointsDir, `.current-${operationId}.tmp`)
  const previousDir = join(workspace.checkpointsDir, `.current-${operationId}.previous`)
  let previousMoved = false
  let currentSwitched = false

  await mkdir(temporaryDir)
  try {
    await dependencies.copyDirectory(workspace.baseDir, join(temporaryDir, "base"))
    await dependencies.copyDirectory(workspace.projectDir, join(temporaryDir, "project"))
    const manifest = await buildManifest(temporaryDir, publication)
    await writeFile(join(temporaryDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    await verifyCheckpoint(temporaryDir, publication)

    if (await pathExists(currentDir)) {
      await verifyCheckpoint(currentDir)
      await rename(currentDir, previousDir)
      previousMoved = true
    }
    try {
      await rename(temporaryDir, currentDir)
      currentSwitched = true
      const state = checkpointState(publication)
      await dependencies.writeState(workspace, state)
      if (previousMoved) await rm(previousDir, { recursive: true })
      return state
    } catch (caught) {
      if (currentSwitched) await rm(currentDir, { recursive: true, force: true })
      if (previousMoved) await rename(previousDir, currentDir)
      throw caught
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true })
  }
}

export async function restoreCheckpoint(
  workspace: ScenarioWorkspace,
  state: ScenarioState,
  dependencies: CheckpointDependencies = createCheckpointDependencies(),
): Promise<void> {
  if (state.checkpoint === null) return
  await recoverPreviousCheckpoint(workspace, state, dependencies)
  const checkpointDir = join(workspace.checkpointsDir, "current")
  await verifyCheckpoint(checkpointDir, state)

  const operationId = dependencies.operationId()
  const temporaryBase = join(workspace.root, `.base-${operationId}.restore.tmp`)
  const temporaryProject = join(workspace.root, `.project-${operationId}.restore.tmp`)
  const previousBase = join(workspace.root, `.base-${operationId}.previous`)
  const previousProject = join(workspace.root, `.project-${operationId}.previous`)
  try {
    await dependencies.copyDirectory(join(checkpointDir, "base"), temporaryBase)
    await dependencies.copyDirectory(join(checkpointDir, "project"), temporaryProject)
    await rename(workspace.baseDir, previousBase)
    await rename(workspace.projectDir, previousProject)
    try {
      await rename(temporaryBase, workspace.baseDir)
      await rename(temporaryProject, workspace.projectDir)
    } catch (caught) {
      await rm(workspace.baseDir, { recursive: true, force: true })
      await rm(workspace.projectDir, { recursive: true, force: true })
      await rename(previousBase, workspace.baseDir)
      await rename(previousProject, workspace.projectDir)
      throw caught
    }
    await rm(previousBase, { recursive: true })
    await rm(previousProject, { recursive: true })
  } finally {
    await rm(temporaryBase, { recursive: true, force: true })
    await rm(temporaryProject, { recursive: true, force: true })
  }
}

async function recoverPreviousCheckpoint(
  workspace: ScenarioWorkspace,
  state: ScenarioState,
  dependencies: CheckpointDependencies,
): Promise<void> {
  const currentDir = join(workspace.checkpointsDir, "current")
  const currentManifest = await verifyCheckpoint(currentDir)
  if (manifestMatches(currentManifest, state)) return

  const candidates = (await readdir(workspace.checkpointsDir))
    .filter((name) => /^\.current-.+\.previous$/u.test(name))
  const matching: string[] = []
  for (const name of candidates) {
    const path = join(workspace.checkpointsDir, name)
    try {
      await verifyCheckpoint(path, state)
      matching.push(path)
    } catch {
      // An unrelated service directory is not ours to delete.
    }
  }
  if (matching.length !== 1) {
    throw new Error(`Не найдена единственная согласованная предыдущая контрольная копия для ${state.completedOperation ?? "baseline"}`)
  }

  const discarded = join(
    workspace.checkpointsDir,
    `.current-${dependencies.operationId()}.discarded.tmp`,
  )
  await rename(currentDir, discarded)
  try {
    await rename(matching[0], currentDir)
  } catch (caught) {
    await rename(discarded, currentDir)
    throw caught
  }
  await rm(discarded, { recursive: true })
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true })
  for (const entry of await sortedEntries(source)) {
    const sourcePath = join(source, entry.name)
    const destinationPath = join(destination, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(`Символические ссылки запрещены в контрольной точке: ${sourcePath}`)
    }
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath)
      continue
    }
    if (!entry.isFile()) throw new Error(`Неподдерживаемый файл: ${sourcePath}`)
    await writeFile(destinationPath, await readFile(sourcePath), { flag: "wx" })
  }
}

async function buildManifest(
  checkpointDir: string,
  publication: CheckpointPublication,
): Promise<CheckpointManifest> {
  return {
    version: 2,
    completedOperation: publication.completedOperation,
    planHash: publication.planHash,
    files: await buildFileHashes(checkpointDir),
  }
}

async function buildFileHashes(checkpointDir: string): Promise<Record<ManifestPath, string>> {
  const files: Partial<Record<ManifestPath, string>> = {}
  for (const directory of ["base", "project"] as const) {
    for (const path of await listFiles(join(checkpointDir, directory))) {
      const portablePath = relative(checkpointDir, path).split(sep).join("/") as ManifestPath
      files[portablePath] = sha256(await readFile(path))
    }
  }
  return files as Record<ManifestPath, string>
}

async function verifyCheckpoint(
  checkpointDir: string,
  expected?: Pick<CheckpointPublication, "completedOperation" | "planHash">,
): Promise<CheckpointManifest> {
  const checkpointStats = await lstat(checkpointDir)
  if (!checkpointStats.isDirectory() || checkpointStats.isSymbolicLink()) {
    throw new Error(`Контрольная точка не является обычным каталогом: ${checkpointDir}`)
  }
  const manifestPath = join(checkpointDir, "manifest.json")
  const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"))
  if (!isManifest(parsed)) throw new Error(`Повреждён manifest: ${manifestPath}`)
  if (expected !== undefined && !manifestMatches(parsed, expected)) {
    throw new Error(`Manifest не соответствует состоянию: ${manifestPath}`)
  }
  const actualEntries = Object.entries(await buildFileHashes(checkpointDir))
    .sort(([left], [right]) => left.localeCompare(right))
  const expectedEntries = Object.entries(parsed.files)
    .sort(([left], [right]) => left.localeCompare(right))
  if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(`Проверка SHA-256 контрольной точки не пройдена: ${checkpointDir}`)
  }
  return parsed
}

async function listFiles(root: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await sortedEntries(root)) {
    const path = join(root, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Символические ссылки запрещены: ${path}`)
    if (entry.isDirectory()) result.push(...await listFiles(path))
    else if (entry.isFile()) result.push(path)
    else throw new Error(`Неподдерживаемый файл: ${path}`)
  }
  return result
}

async function sortedEntries(path: string) {
  return (await readdir(path, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function isManifest(value: unknown): value is CheckpointManifest {
  if (typeof value !== "object" || value === null) return false
  const manifest = value as Record<string, unknown>
  if (manifest["version"] !== 2 ||
    (manifest["completedOperation"] !== null && typeof manifest["completedOperation"] !== "string") ||
    typeof manifest["planHash"] !== "string" || !/^[a-f0-9]{64}$/u.test(manifest["planHash"])) {
    return false
  }
  const files = manifest["files"]
  if (typeof files !== "object" || files === null || Array.isArray(files)) return false
  return Object.entries(files).every(([path, hash]) =>
    /^(base|project)\/.+/u.test(path) &&
    !path.split("/").includes("..") &&
    typeof hash === "string" &&
    /^[a-f0-9]{64}$/u.test(hash)
  )
}

function manifestMatches(
  manifest: CheckpointManifest,
  expected: Pick<CheckpointPublication, "completedOperation" | "planHash">,
): boolean {
  return manifest.completedOperation === expected.completedOperation &&
    manifest.planHash === expected.planHash
}

function checkpointState(publication: CheckpointPublication): ScenarioState {
  return {
    version: 2,
    scenario: "partial-sync-matrix",
    completedOperation: publication.completedOperation,
    checkpoint: "checkpoints/current",
    planHash: publication.planHash,
  }
}

function sha256(contents: Buffer): string {
  return createHash("sha256").update(contents).digest("hex")
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  } catch (caught) {
    if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") return false
    throw caught
  }
}
