import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  writeFile,
} from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"

export const stageIds = ["01-baseline", "02-catalog", "03-attribute"] as const
export type StageId = (typeof stageIds)[number]

export type ScenarioState = {
  readonly version: 1
  readonly scenario: "partial-sync-catalog-attribute"
  readonly completedStage: StageId | null
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

const initialState: ScenarioState = {
  version: 1,
  scenario: "partial-sync-catalog-attribute",
  completedStage: null,
  checkpoint: null,
}

const managedDirectoryNames = [
  "base",
  "data",
  "project",
  "checkpoints",
  "verification",
  "logs",
] as const

export async function openScenarioWorkspace(root: string): Promise<ScenarioWorkspace> {
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
  if (existing === "other") {
    throw new Error(`Каталог сценария не является каталогом: ${requestedRoot}`)
  }
  if (existing === "missing") await mkdir(requestedRoot, { recursive: true })

  const canonicalRoot = await realpath(requestedRoot)
  const repositoryRoot = await realpath(resolve(import.meta.dirname, "../.."))
  if (canonicalRoot === repositoryRoot) {
    throw new Error("Корень репозитория нельзя использовать как каталог сценария")
  }

  const entries = await readdir(canonicalRoot)
  const statePath = join(canonicalRoot, "state.json")
  if (entries.length > 0 && !entries.includes("state.json")) {
    throw new Error(`Каталог не принадлежит сценарию: ${canonicalRoot}`)
  }

  if (entries.includes("state.json")) {
    await readState(canonicalRoot)
  } else {
    await writeState(statePath, initialState)
  }

  for (const name of managedDirectoryNames) {
    const path = join(canonicalRoot, name)
    const kind = await pathKind(path)
    if (kind === "symlink") {
      throw new Error(`Управляемый путь не может быть символической ссылкой: ${path}`)
    }
    if (kind === "other") throw new Error(`Управляемый путь не является каталогом: ${path}`)
    if (kind === "missing") await mkdir(path)
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
  const parsed: unknown = JSON.parse(await readFile(statePath, "utf8"))
  if (!isScenarioState(parsed)) throw new Error(`Повреждено состояние сценария: ${statePath}`)
  return parsed
}

export async function writeScenarioState(
  workspace: Pick<ScenarioWorkspace, "statePath">,
  state: ScenarioState
): Promise<void> {
  await writeState(workspace.statePath, state)
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
  const completedStage = state["completedStage"]
  const checkpoint = state["checkpoint"]
  return state["version"] === 1 &&
    state["scenario"] === "partial-sync-catalog-attribute" &&
    (completedStage === null || stageIds.includes(completedStage as StageId)) &&
    (checkpoint === null ||
      (typeof checkpoint === "string" && /^checkpoints\/(01-baseline|02-catalog|03-attribute)$/u.test(checkpoint)))
}

async function pathKind(path: string): Promise<"missing" | "directory" | "symlink" | "other"> {
  try {
    const stats = await lstat(path)
    if (stats.isSymbolicLink()) return "symlink"
    if (stats.isDirectory()) return "directory"
    return "other"
  } catch (caught) {
    if (isNodeError(caught) && caught.code === "ENOENT") return "missing"
    throw caught
  }
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return value instanceof Error && "code" in value
}
