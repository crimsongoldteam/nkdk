import { publishCheckpoint, restoreCheckpoint } from "./checkpoints"
import { readState, type ScenarioState, type ScenarioWorkspace, type StageId } from "./workspace"

export type ScenarioStages = {
  baseline(): Promise<void>
  catalog(): Promise<void>
  attribute(): Promise<void>
}

export type ScenarioDependencies = {
  readState(): Promise<ScenarioState>
  restoreCheckpoint(workspace: ScenarioWorkspace, state: ScenarioState): Promise<void>
  publishCheckpoint(workspace: ScenarioWorkspace, stage: StageId): Promise<ScenarioState>
}

export async function runPartialSyncScenario(
  workspace: ScenarioWorkspace,
  scenarioStages: ScenarioStages,
  providedDependencies?: ScenarioDependencies
): Promise<void> {
  const dependencies = providedDependencies ?? defaultDependencies(workspace)
  let state = await dependencies.readState()
  if (state.completedStage !== null) {
    await dependencies.restoreCheckpoint(workspace, state)
  }

  const stages = [
    { id: "01-baseline", run: scenarioStages.baseline },
    { id: "02-catalog", run: scenarioStages.catalog },
    { id: "03-attribute", run: scenarioStages.attribute },
  ] as const
  const completedIndex = state.completedStage === null
    ? -1
    : stages.findIndex(({ id }) => id === state.completedStage)

  for (const stage of stages.slice(completedIndex + 1)) {
    await stage.run()
    state = await dependencies.publishCheckpoint(workspace, stage.id)
  }
}

function defaultDependencies(workspace: ScenarioWorkspace): ScenarioDependencies {
  return {
    readState: () => readState(workspace.root),
    restoreCheckpoint,
    publishCheckpoint,
  }
}
