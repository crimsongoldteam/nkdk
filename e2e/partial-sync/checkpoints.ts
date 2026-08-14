import { createHash, randomUUID } from "node:crypto"
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { join, relative, sep } from "node:path"
import type { ScenarioState, ScenarioWorkspace, StageId } from "./workspace"
import { writeScenarioState } from "./workspace"

type ManifestPath = `base/${string}` | `project/${string}`

type CheckpointManifest = {
  readonly version: 1
  readonly stage: StageId
  readonly files: Readonly<Record<ManifestPath, string>>
}

export type CheckpointDependencies = {
  copyDirectory(source: string, destination: string): Promise<void>
  operationId(): string
}

export function createCheckpointDependencies(): CheckpointDependencies {
  return {
    copyDirectory,
    operationId: randomUUID,
  }
}

export async function publishCheckpoint(
  workspace: ScenarioWorkspace,
  stage: StageId,
  dependencies: CheckpointDependencies = createCheckpointDependencies()
): Promise<ScenarioState> {
  const temporaryDir = join(workspace.checkpointsDir, `.${stage}-${dependencies.operationId()}.tmp`)
  const checkpointDir = join(workspace.checkpointsDir, stage)
  await mkdir(temporaryDir)
  try {
    await dependencies.copyDirectory(workspace.baseDir, join(temporaryDir, "base"))
    await dependencies.copyDirectory(workspace.projectDir, join(temporaryDir, "project"))
    const manifest = await buildManifest(temporaryDir, stage)
    await writeFile(join(temporaryDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    await verifyCheckpoint(temporaryDir, stage)
    await rename(temporaryDir, checkpointDir)
    const state: ScenarioState = {
      version: 1,
      scenario: "partial-sync-catalog-attribute",
      completedStage: stage,
      checkpoint: `checkpoints/${stage}`,
    }
    await writeScenarioState(workspace, state)
    return state
  } catch (caught) {
    await rm(temporaryDir, { recursive: true, force: true })
    throw caught
  }
}

export async function restoreCheckpoint(
  workspace: ScenarioWorkspace,
  state: ScenarioState,
  dependencies: CheckpointDependencies = createCheckpointDependencies()
): Promise<void> {
  if (state.completedStage === null || state.checkpoint === null) return
  const checkpointDir = join(workspace.root, state.checkpoint)
  await verifyCheckpoint(checkpointDir, state.completedStage)

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

async function buildManifest(checkpointDir: string, stage: StageId): Promise<CheckpointManifest> {
  const files: Partial<Record<ManifestPath, string>> = {}
  for (const directory of ["base", "project"] as const) {
    for (const path of await listFiles(join(checkpointDir, directory))) {
      const portablePath = relative(checkpointDir, path).split(sep).join("/") as ManifestPath
      files[portablePath] = sha256(await readFile(path))
    }
  }
  return { version: 1, stage, files: files as Record<ManifestPath, string> }
}

async function verifyCheckpoint(checkpointDir: string, stage: StageId): Promise<void> {
  const manifestPath = join(checkpointDir, "manifest.json")
  const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"))
  if (!isManifest(parsed, stage)) throw new Error(`Повреждён manifest: ${manifestPath}`)
  const actual = await buildManifest(checkpointDir, stage)
  const expectedEntries = Object.entries(parsed.files).sort(([left], [right]) => left.localeCompare(right))
  const actualEntries = Object.entries(actual.files).sort(([left], [right]) => left.localeCompare(right))
  if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(`Проверка SHA-256 контрольной точки не пройдена: ${checkpointDir}`)
  }
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

function isManifest(value: unknown, stage: StageId): value is CheckpointManifest {
  if (typeof value !== "object" || value === null) return false
  const manifest = value as Record<string, unknown>
  if (manifest["version"] !== 1 || manifest["stage"] !== stage) return false
  const files = manifest["files"]
  if (typeof files !== "object" || files === null || Array.isArray(files)) return false
  return Object.entries(files).every(([path, hash]) =>
    /^(base|project)\/.+/u.test(path) &&
    !path.split("/").includes("..") &&
    typeof hash === "string" &&
    /^[a-f0-9]{64}$/u.test(hash)
  )
}

function sha256(contents: Buffer): string {
  return createHash("sha256").update(contents).digest("hex")
}
