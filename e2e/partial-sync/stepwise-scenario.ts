import type { BaselineReference } from "./baseline"
import type { PlatformMode } from "./concurrency"
import {
  publishStepCheckpoint,
  restoreStepCheckpoint,
  type StepCheckpointDependencies,
} from "./stepwise-checkpoint"
import type { StepExecutionResult } from "./stepwise-steps"
import type { StepwiseScenarioState } from "./stepwise-state"
import type { ScenarioStep } from "./stepwise-plan"
import type { ScenarioRunWorkspace } from "./stepwise-workspace"

export type FailureCategory =
  | "validation"
  | "platform"
  | "verification-diff"
  | "mcp-transport"
  | "infrastructure"

export type ScenarioResult = {
  readonly id: string
  readonly mode: PlatformMode
  readonly status: "succeeded" | "failed" | "interrupted"
  readonly completedSteps: number
  readonly totalSteps: number
  readonly durationMs: number
  readonly attempt: number
  readonly steps: readonly StepExecutionResult[]
  readonly failure?: { readonly category: FailureCategory; readonly message: string }
}

export type StepwiseScenarioParams = {
  readonly id: string
  readonly mode: PlatformMode
  readonly workspace: ScenarioRunWorkspace
  readonly baseline: BaselineReference
  readonly state: StepwiseScenarioState
  readonly steps: readonly ScenarioStep[]
}

export type StepwiseScenarioDependencies = {
  now(): number
  restore(params: Parameters<typeof restoreStepCheckpoint>[0]): Promise<void>
  execute(step: ScenarioStep, progress: { readonly index: number; readonly total: number }): Promise<StepExecutionResult>
  publish(params: Parameters<typeof publishStepCheckpoint>[0]): Promise<StepwiseScenarioState>
}

export async function runStepwiseScenario(
  params: StepwiseScenarioParams,
  dependencies: StepwiseScenarioDependencies,
): Promise<ScenarioResult> {
  const startedAt = dependencies.now()
  let state = params.state
  const results: StepExecutionResult[] = []
  try {
    await dependencies.restore({
      workspace: params.workspace,
      baseline: params.baseline,
      state,
      steps: params.steps,
      mode: params.mode,
    })
    for (let index = state.completedStepIndex + 1; index < params.steps.length; index += 1) {
      const step = params.steps[index]
      const result = await dependencies.execute(step, { index: index + 1, total: params.steps.length })
      results.push(result)
      state = await dependencies.publish({ workspace: params.workspace, state, step, stepIndex: index, steps: params.steps })
    }
    return result(params, state, results, "succeeded", dependencies.now() - startedAt)
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error(String(caught))
    return result(params, state, results, "failed", dependencies.now() - startedAt, {
      category: classifyFailure(error),
      message: error.message,
    })
  }
}

function result(
  params: StepwiseScenarioParams,
  state: StepwiseScenarioState,
  steps: readonly StepExecutionResult[],
  status: ScenarioResult["status"],
  durationMs: number,
  failure?: ScenarioResult["failure"],
): ScenarioResult {
  return {
    id: params.id,
    mode: params.mode,
    status,
    completedSteps: state.completedStepIndex + 1,
    totalSteps: params.steps.length,
    durationMs,
    attempt: state.attempt,
    steps,
    ...(failure === undefined ? {} : { failure }),
  }
}

function classifyFailure(error: Error): FailureCategory {
  const message = `${error.message} ${(error.cause instanceof Error ? error.cause.message : "")}`.toLowerCase()
  if (message.includes("validation") || message.includes("валидац")) return "validation"
  if (message.includes("сравнен") || message.includes("compare") || message.includes("различ")) return "verification-diff"
  if (message.includes("mcp") || message.includes("stdio") || message.includes("transport")) return "mcp-transport"
  if (message.includes("1с") || message.includes("платформ") || message.includes("designer") || message.includes("ibcmd")) return "platform"
  return "infrastructure"
}

export function bindStepwiseCheckpointDependencies(
  dependencies: StepCheckpointDependencies,
): Pick<StepwiseScenarioDependencies, "restore" | "publish"> {
  return {
    restore: (params) => restoreStepCheckpoint(params, dependencies),
    publish: (params) => publishStepCheckpoint(params, dependencies),
  }
}
