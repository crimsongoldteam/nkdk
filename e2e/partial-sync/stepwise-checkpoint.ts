import { createHash } from "node:crypto"
import { cp, lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import {
  hashFileTree,
  hashPortableProjectTree,
  removeVolatileProjectState,
  type BaselineReference,
} from "./baseline"
import type { PlatformMode } from "./concurrency"
import type { InfobaseArchiveStore } from "./infobase-archive"
import type { ScenarioStep } from "./stepwise-plan"
import type { ScenarioRunWorkspace } from "./stepwise-workspace"
import {
  writeStepwiseState,
  type StepwiseScenarioState,
} from "./stepwise-state"

type CheckpointManifest = {
  readonly version: 2
  readonly stepKey: string
  readonly stepIndex: number
  readonly planHash: string
  readonly expectedProjectHash: string
  readonly componentStateSha256: string
  readonly archiveSha256: string
}

export type StepCheckpointDependencies = {
  readonly archiveStore: InfobaseArchiveStore
  operationId(): string
  applyStep(projectDir: string, step: ScenarioStep): Promise<void>
  writeProjectSettings(projectDir: string, baseDir: string, mode: PlatformMode): Promise<void>
}

export async function publishStepCheckpoint(params: {
  readonly workspace: ScenarioRunWorkspace
  readonly state: StepwiseScenarioState
  readonly step: ScenarioStep
  readonly stepIndex: number
  readonly steps: readonly ScenarioStep[]
}, dependencies: StepCheckpointDependencies): Promise<StepwiseScenarioState> {
  assertNextStep(params)
  const staging = `${params.workspace.checkpointDir}.${dependencies.operationId()}.tmp`
  const previous = `${params.workspace.checkpointDir}.${dependencies.operationId()}.previous`
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })
  await mkdir(params.workspace.logsDir, { recursive: true })
  const archivePath = join(staging, "current.dt")
  try {
    await dependencies.archiveStore.dump({
      baseDir: params.workspace.baseDir,
      dataDir: params.workspace.dataDir,
      archivePath,
      logPath: join(params.workspace.logsDir, `checkpoint-${params.stepIndex}.log`),
    })
    await removeVolatileProjectState(params.workspace.projectDir)
    const componentStateDir = join(staging, "components")
    await cp(
      join(params.workspace.projectDir, ".nkdk", "components"),
      componentStateDir,
      { recursive: true },
    )
    const manifest: CheckpointManifest = {
      version: 2,
      stepKey: params.step.key,
      stepIndex: params.stepIndex,
      planHash: params.state.planHash,
      expectedProjectHash: await hashPortableProjectTree(params.workspace.projectDir),
      componentStateSha256: await hashFileTree(componentStateDir),
      archiveSha256: sha256(await readFile(archivePath)),
    }
    await writeFile(join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    const next: StepwiseScenarioState = {
      ...params.state,
      completedStepKey: params.step.key,
      completedStepIndex: params.stepIndex,
      checkpoint: "checkpoint/current.dt",
    }
    await readCheckpointManifest(staging, next)

    await rm(previous, { recursive: true, force: true })
    if (await pathExists(params.workspace.checkpointDir)) {
      await rename(params.workspace.checkpointDir, previous)
    }
    try {
      await rename(staging, params.workspace.checkpointDir)
      try {
        await writeStepwiseState(params.workspace.statePath, next)
      } catch (caught) {
        await rm(params.workspace.checkpointDir, { recursive: true, force: true })
        if (await pathExists(previous)) await rename(previous, params.workspace.checkpointDir)
        throw caught
      }
      await rm(previous, { recursive: true, force: true })
      return next
    } catch (caught) {
      if (await pathExists(previous) && !await pathExists(params.workspace.checkpointDir)) {
        await rename(previous, params.workspace.checkpointDir)
      }
      throw caught
    }
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

export async function restoreStepCheckpoint(params: {
  readonly workspace: ScenarioRunWorkspace
  readonly baseline: BaselineReference
  readonly state: StepwiseScenarioState
  readonly steps: readonly ScenarioStep[]
  readonly mode: PlatformMode
}, dependencies: StepCheckpointDependencies): Promise<void> {
  assertCompatibleState(params)
  const archivePath = params.state.checkpoint === null
    ? params.baseline.archivePath
    : join(params.workspace.checkpointDir, "current.dt")
  const manifest = params.state.checkpoint === null
    ? undefined
    : await readCheckpointManifest(params.workspace.checkpointDir, params.state)

  for (const path of [params.workspace.projectDir, params.workspace.baseDir, params.workspace.dataDir]) {
    await rm(path, { recursive: true, force: true })
  }
  await mkdir(dirname(params.workspace.projectDir), { recursive: true })
  await cp(params.baseline.projectDir, params.workspace.projectDir, { recursive: true })
  for (const step of params.steps.slice(0, params.state.completedStepIndex + 1)) {
    await dependencies.applyStep(params.workspace.projectDir, step)
  }
  await dependencies.writeProjectSettings(params.workspace.projectDir, params.workspace.baseDir, params.mode)
  await removeVolatileProjectState(params.workspace.projectDir)
  if (manifest !== undefined && await hashPortableProjectTree(params.workspace.projectDir) !== manifest.expectedProjectHash) {
    throw new Error(`Воспроизведённый проект не совпадает с контрольной точкой ${manifest.stepKey}`)
  }
  if (manifest !== undefined) {
    const target = join(params.workspace.projectDir, ".nkdk", "components")
    await rm(target, { recursive: true, force: true })
    await cp(join(params.workspace.checkpointDir, "components"), target, { recursive: true })
  }
  await mkdir(params.workspace.logsDir, { recursive: true })
  await dependencies.archiveStore.create({
    baseDir: params.workspace.baseDir,
    dataDir: params.workspace.dataDir,
    archivePath,
    logPath: join(params.workspace.logsDir, "checkpoint-restore.log"),
  })
}

function assertNextStep(params: {
  readonly state: StepwiseScenarioState
  readonly step: ScenarioStep
  readonly stepIndex: number
  readonly steps: readonly ScenarioStep[]
}): void {
  if (params.stepIndex !== params.state.completedStepIndex + 1 || params.steps[params.stepIndex]?.key !== params.step.key) {
    throw new Error(`Нельзя опубликовать шаг ${params.step.key} после индекса ${params.state.completedStepIndex}`)
  }
}

function assertCompatibleState(params: {
  readonly baseline: BaselineReference
  readonly state: StepwiseScenarioState
  readonly steps: readonly ScenarioStep[]
  readonly mode: PlatformMode
}): void {
  if (params.state.mode !== params.mode || params.state.compatibilityHash !== params.baseline.manifest.compatibilityHash) {
    throw new Error("Состояние сценария несовместимо с эталоном или режимом")
  }
  if (params.state.completedStepIndex >= params.steps.length ||
    (params.state.completedStepIndex >= 0 && params.steps[params.state.completedStepIndex]?.key !== params.state.completedStepKey)) {
    throw new Error("Состояние сценария несовместимо с планом")
  }
}

async function readCheckpointManifest(
  directory: string,
  state: StepwiseScenarioState,
): Promise<CheckpointManifest> {
  const parsed: unknown = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"))
  if (!isCheckpointManifest(parsed) || parsed.planHash !== state.planHash ||
    parsed.stepKey !== state.completedStepKey || parsed.stepIndex !== state.completedStepIndex) {
    throw new Error(`Повреждён или несовместим manifest контрольной точки: ${directory}`)
  }
  const actualHash = sha256(await readFile(join(directory, "current.dt")))
  if (actualHash !== parsed.archiveSha256) throw new Error(`Повреждён архив контрольной точки: ${directory}`)
  if (await hashFileTree(join(directory, "components")) !== parsed.componentStateSha256) {
    throw new Error(`Повреждён индекс контрольной точки: ${directory}`)
  }
  return parsed
}

function isCheckpointManifest(value: unknown): value is CheckpointManifest {
  if (typeof value !== "object" || value === null) return false
  const manifest = value as Record<string, unknown>
  return manifest["version"] === 2 &&
    typeof manifest["stepKey"] === "string" && manifest["stepKey"].length > 0 &&
    Number.isInteger(manifest["stepIndex"]) && Number(manifest["stepIndex"]) >= 0 &&
    isHash(manifest["planHash"]) && isHash(manifest["expectedProjectHash"]) &&
    isHash(manifest["componentStateSha256"]) &&
    isHash(manifest["archiveSha256"])
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
