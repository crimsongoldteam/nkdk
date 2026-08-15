import {
  publishCheckpoint,
  restoreCheckpoint,
  type CheckpointPublication,
} from "./checkpoints"
import type { ScenarioBlock } from "./matrix/types"
import type { PartialSyncSteps } from "./steps"
import { readState, type ScenarioState, type ScenarioWorkspace } from "./workspace"

export type RunPartialSyncScenarioParams = {
  readonly workspace: ScenarioWorkspace
  readonly plan: readonly ScenarioBlock[]
  readonly planHash: string
  readonly steps: PartialSyncSteps
}

export type ScenarioDependencies = {
  readState(): Promise<ScenarioState>
  restoreCheckpoint(workspace: ScenarioWorkspace, state: ScenarioState): Promise<void>
  publishCheckpoint(
    workspace: ScenarioWorkspace,
    publication: CheckpointPublication,
  ): Promise<ScenarioState>
}

export async function runPartialSyncScenario(
  params: RunPartialSyncScenarioParams,
  providedDependencies?: ScenarioDependencies,
): Promise<void> {
  const { workspace, plan, planHash, steps } = params
  const dependencies = providedDependencies ?? defaultDependencies(workspace)
  let state = await dependencies.readState()
  if (state.planHash !== planHash) {
    throw new Error("Хэш плана не совпадает с состоянием матричного сценария")
  }

  const completedIndex = state.completedBlock === null
    ? -1
    : plan.findIndex(({ key }) => key === state.completedBlock)
  if (state.completedBlock !== null && completedIndex < 0) {
    throw new Error(`Неизвестный ключ завершённого блока: ${state.completedBlock}`)
  }
  if (state.checkpoint === null && state.completedBlock !== null) {
    throw new Error("Состояние завершённого блока не содержит контрольную копию")
  }

  if (state.checkpoint === null) {
    await steps.prepareBaseline()
    state = await dependencies.publishCheckpoint(workspace, {
      completedBlock: null,
      planHash,
    })
  } else {
    await dependencies.restoreCheckpoint(workspace, state)
  }

  for (let index = completedIndex + 1; index < plan.length; index += 1) {
    const block = plan[index]
    await steps.executeBlock(block, { index: index + 1, total: plan.length })
    state = await dependencies.publishCheckpoint(workspace, {
      completedBlock: block.key,
      planHash,
    })
  }
  await steps.verifyFinalState()
}

function defaultDependencies(workspace: ScenarioWorkspace): ScenarioDependencies {
  return {
    readState: () => readState(workspace.root),
    restoreCheckpoint,
    publishCheckpoint,
  }
}
