import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"

export type ScenarioState = {
  readonly version: 2
  readonly scenario: "partial-sync-matrix"
  readonly completedOperation: string | null
  readonly checkpoint: "checkpoints/current" | null
  readonly planHash: string
}

type LegacyScenarioState = {
  readonly version: 1
  readonly scenario: "partial-sync-catalog-attribute"
  readonly completedStage: "01-baseline" | "02-catalog" | "03-attribute" | null
  readonly checkpoint: string | null
}

export type ScenarioWorkspace = {
  readonly root: string
  readonly baseDir: string
  readonly dataDir: string
  readonly projectDir: string
  readonly checkpointsDir: string
  readonly verificationDir: string
  readonly logsDir: string
  readonly statePath: string
}

export type OpenScenarioWorkspaceOptions = {
  readonly planHash: string
  readonly reset: boolean
}

const managedDirectoryNames = [
  "base",
  "data",
  "project",
  "checkpoints",
  "verification",
  "logs",
] as const
const resetDirectoryNames = managedDirectoryNames.filter((name) => name !== "logs")
const allowedEntryNames = new Set(["state.json", "state.json.tmp", ...managedDirectoryNames])
const ignoredEntryNames = new Set([".DS_Store"])

export async function openScenarioWorkspace(
  root: string,
  options: OpenScenarioWorkspaceOptions,
): Promise<ScenarioWorkspace> {
  assertPlanHash(options.planHash)
  if (!isAbsolute(root) || root.length === 0) {
    throw new Error("Каталог сценария должен быть задан абсолютным путём")
  }
  const requestedRoot = resolve(root)
  if (requestedRoot === resolve("/") || requestedRoot === resolve(homedir())) {
    throw new Error("Этот каталог нельзя использовать как каталог сценария")
  }

  const existing = await pathKind(requestedRoot)
  if (existing === "symlink") {
    throw new Error(`Каталог сценария не может быть символической ссылкой: ${requestedRoot}`)
  }
  if (existing !== "missing" && existing !== "directory") {
    throw new Error(`Каталог сценария не является каталогом: ${requestedRoot}`)
  }
  if (existing === "missing") await mkdir(requestedRoot, { recursive: true })

  const canonicalRoot = await realpath(requestedRoot)
  const repositoryRoot = await realpath(resolve(import.meta.dirname, "../.."))
  if (canonicalRoot === repositoryRoot) {
    throw new Error("Корень репозитория нельзя использовать как каталог сценария")
  }

  const entries = await readdir(canonicalRoot)
  const scenarioEntries = entries.filter((entry) => !ignoredEntryNames.has(entry))
  const statePath = join(canonicalRoot, "state.json")
  const temporaryStatePath = `${statePath}.tmp`
  if (scenarioEntries.length > 0 &&
    !scenarioEntries.includes("state.json") &&
    !scenarioEntries.includes("state.json.tmp")) {
    throw new Error(`Каталог не принадлежит сценарию: ${canonicalRoot}`)
  }
  const foreignEntry = scenarioEntries.find((entry) => !allowedEntryNames.has(entry))
  if (foreignEntry !== undefined) {
    throw new Error(`Каталог содержит неизвестный путь ${foreignEntry}: ${canonicalRoot}`)
  }

  if (entries.includes("state.json")) {
    const stateKind = await pathKind(statePath)
    if (stateKind === "symlink") {
      throw new Error(`Состояние сценария не может быть символической ссылкой: ${statePath}`)
    }
    if (stateKind !== "file") throw new Error(`Состояние сценария не является файлом: ${statePath}`)
  }
  if (entries.includes("state.json.tmp")) {
    const stateKind = await pathKind(temporaryStatePath)
    if (stateKind === "symlink") {
      throw new Error(`Временное состояние сценария не может быть символической ссылкой: ${temporaryStatePath}`)
    }
    if (stateKind !== "file") {
      throw new Error(`Временное состояние сценария не является файлом: ${temporaryStatePath}`)
    }
  }

  for (const name of managedDirectoryNames) {
    const path = join(canonicalRoot, name)
    const kind = await pathKind(path)
    if (kind === "symlink") {
      throw new Error(`Управляемый путь не может быть символической ссылкой: ${path}`)
    }
    if (kind !== "missing" && kind !== "directory") {
      throw new Error(`Управляемый путь не является каталогом: ${path}`)
    }
  }

  let storedState: ScenarioState | LegacyScenarioState | undefined
  if (entries.includes("state.json")) {
    storedState = await readRecognizedState(statePath)
    if (entries.includes("state.json.tmp")) await rm(temporaryStatePath)
  } else if (entries.includes("state.json.tmp")) {
    storedState = await readRecognizedState(temporaryStatePath)
    await rename(temporaryStatePath, statePath)
  }

  if (options.reset) {
    for (const name of resetDirectoryNames) {
      await rm(join(canonicalRoot, name), { recursive: true, force: true })
    }
    await rm(statePath, { force: true })
    await writeState(statePath, initialState(options.planHash))
  } else if (storedState === undefined) {
    await writeState(statePath, initialState(options.planHash))
  } else {
    if (!isScenarioState(storedState)) {
      throw new Error(`Несовместимая версия состояния сценария: ${statePath}`)
    }
    if (storedState.planHash !== options.planHash) {
      throw new Error(`Хэш плана не совпадает с состоянием сценария: ${statePath}`)
    }
  }

  for (const name of managedDirectoryNames) {
    const path = join(canonicalRoot, name)
    if (await pathKind(path) === "missing") await mkdir(path)
  }

  return {
    root: canonicalRoot,
    baseDir: join(canonicalRoot, "base"),
    dataDir: join(canonicalRoot, "data"),
    projectDir: join(canonicalRoot, "project"),
    checkpointsDir: join(canonicalRoot, "checkpoints"),
    verificationDir: join(canonicalRoot, "verification"),
    logsDir: join(canonicalRoot, "logs"),
    statePath,
  }
}

export async function readState(root: string): Promise<ScenarioState> {
  const statePath = join(root, "state.json")
  const parsed = await readRecognizedState(statePath)
  if (!isScenarioState(parsed)) throw new Error(`Несовместимая версия состояния сценария: ${statePath}`)
  return parsed
}

export async function writeScenarioState(
  workspace: Pick<ScenarioWorkspace, "statePath">,
  state: ScenarioState,
): Promise<void> {
  await writeState(workspace.statePath, state)
}

function initialState(planHash: string): ScenarioState {
  return {
    version: 2,
    scenario: "partial-sync-matrix",
    completedOperation: null,
    checkpoint: null,
    planHash,
  }
}

async function readRecognizedState(path: string): Promise<ScenarioState | LegacyScenarioState> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(path, "utf8"))
  } catch (caught) {
    throw new Error(`Повреждено состояние сценария: ${path}`, { cause: caught })
  }
  if (!isScenarioState(parsed) && !isLegacyScenarioState(parsed)) {
    throw new Error(`Повреждено или неизвестно состояние сценария: ${path}`)
  }
  return parsed
}

async function writeState(path: string, state: ScenarioState): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`)
  await rename(temporaryPath, path)
}

function isScenarioState(value: unknown): value is ScenarioState {
  if (typeof value !== "object" || value === null) return false
  const state = value as Record<string, unknown>
  return state["version"] === 2 &&
    state["scenario"] === "partial-sync-matrix" &&
    (state["completedOperation"] === null || typeof state["completedOperation"] === "string") &&
    (state["checkpoint"] === null || state["checkpoint"] === "checkpoints/current") &&
    typeof state["planHash"] === "string" && /^[a-f0-9]{64}$/u.test(state["planHash"])
}

function isLegacyScenarioState(value: unknown): value is LegacyScenarioState {
  if (typeof value !== "object" || value === null) return false
  const state = value as Record<string, unknown>
  const stages = ["01-baseline", "02-catalog", "03-attribute", null]
  return state["version"] === 1 &&
    state["scenario"] === "partial-sync-catalog-attribute" &&
    stages.includes(state["completedStage"] as string | null) &&
    (state["checkpoint"] === null ||
      (typeof state["checkpoint"] === "string" && /^checkpoints\/(01-baseline|02-catalog|03-attribute)$/u.test(state["checkpoint"])))
}

function assertPlanHash(planHash: string): void {
  if (!/^[a-f0-9]{64}$/u.test(planHash)) throw new Error("Хэш плана должен быть SHA-256")
}

async function pathKind(path: string): Promise<"missing" | "directory" | "file" | "symlink" | "other"> {
  try {
    const stats = await lstat(path)
    if (stats.isSymbolicLink()) return "symlink"
    if (stats.isDirectory()) return "directory"
    if (stats.isFile()) return "file"
    return "other"
  } catch (caught) {
    if (isNodeError(caught) && caught.code === "ENOENT") return "missing"
    throw caught
  }
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return value instanceof Error && "code" in value
}
