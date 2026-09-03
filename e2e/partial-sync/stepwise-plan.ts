import type {
  ScenarioComponentPath,
  ScenarioMatrix,
  ScenarioOperation,
} from "./matrix/types"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"

export type ScenarioStep = {
  readonly key: string
  readonly layerKey: string
  readonly componentPath: ScenarioComponentPath
  readonly operation: ScenarioOperation
}

export function buildStepwisePlan(matrix: ScenarioMatrix): readonly ScenarioStep[] {
  return buildScenarioPlan(matrix).flatMap((block) =>
    block.operations.map((operation) => ({
      key: `${block.layerKey}:${operation.key}`,
      layerKey: block.layerKey,
      componentPath: block.componentPath,
      operation,
    })))
}

export function stepwisePlanHash(steps: readonly ScenarioStep[]): string {
  const hashInput = steps.map((step) => ({
    key: `${step.layerKey}:bulk` as const,
    layerKey: step.layerKey,
    componentPath: step.componentPath,
    operations: [step.operation],
    stepKey: step.key,
  }))
  return scenarioPlanHash(hashInput)
}
