import {
  publishCheckpoint,
  restoreCheckpoint,
  type CheckpointPublication,
} from "./checkpoints"
import type { ScenarioOperation } from "./matrix/types"
import type { PartialSyncSteps } from "./steps"
import { readState, type ScenarioState, type ScenarioWorkspace } from "./workspace"

export type RunPartialSyncScenarioParams = {
  readonly workspace: ScenarioWorkspace
  readonly plan: readonly ScenarioOperation[]
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

  const completedIndex = state.completedOperation === null
    ? -1
    : plan.findIndex(({ key }) => key === state.completedOperation)
  if (state.completedOperation !== null && completedIndex < 0) {
    throw new Error(`Неизвестный ключ завершённой операции: ${state.completedOperation}`)
  }
  if (state.checkpoint === null && state.completedOperation !== null) {
    throw new Error("Состояние завершённой операции не содержит контрольную копию")
  }

  if (state.checkpoint === null) {
    await steps.prepareBaseline()
    state = await dependencies.publishCheckpoint(workspace, {
      completedOperation: null,
      planHash,
    })
  } else {
    await dependencies.restoreCheckpoint(workspace, state)
  }

  for (let index = completedIndex + 1; index < plan.length; index += 1) {
    const operation = plan[index]
    await steps.executeOperation(operation, { index: index + 1, total: plan.length })
    state = await dependencies.publishCheckpoint(workspace, {
      completedOperation: operation.key,
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
