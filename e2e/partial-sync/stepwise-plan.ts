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
  readonly sourceOperationKeys: readonly string[]
}

export function buildStepwisePlan(matrix: ScenarioMatrix): readonly ScenarioStep[] {
  const steps = buildScenarioPlan(matrix).flatMap((block) =>
    block.operations.map((operation) => ({
      key: `${block.layerKey}:${operation.key}`,
      layerKey: block.layerKey,
      componentPath: block.componentPath,
      operation,
      sourceOperationKeys: [operation.key],
    })))
  return bundlePlatformConsistencySteps(steps)
}

export function stepwisePlanHash(steps: readonly ScenarioStep[]): string {
  const hashInput = steps.map((step) => ({
    key: `${step.layerKey}:bulk` as const,
    layerKey: step.layerKey,
    componentPath: step.componentPath,
    operations: [step.operation],
    stepKey: step.key,
    sourceOperationKeys: step.sourceOperationKeys,
  }))
  return scenarioPlanHash(hashInput)
}

function bundlePlatformConsistencySteps(steps: readonly ScenarioStep[]): readonly ScenarioStep[] {
  let bundled = [...steps]
  for (const keys of [
    ["roots:create:object:document", "roots:create:object:accumulation-register"],
    [
      "roots:remove:remove:object:accumulation-register",
      "roots:remove:remove:object:document-journal",
      "roots:remove:remove:object:document",
    ],
  ] as const) {
    bundled = bundleSteps(bundled, keys)
  }
  return bundled
}

function bundleSteps(
  steps: readonly ScenarioStep[],
  keys: readonly string[],
): ScenarioStep[] {
  const selected = keys.map((key) => {
    const step = steps.find((candidate) => candidate.key === key)
    if (step === undefined) throw new Error(`Не найден обязательный шаг ${key}`)
    return step
  })
  const first = selected[0]
  if (selected.some((step) => step.layerKey !== first.layerKey || step.componentPath !== first.componentPath)) {
    throw new Error(`Нельзя объединить шаги разных слоёв: ${keys.join(", ")}`)
  }
  const selectedKeys = new Set(keys)
  const insertionIndex = Math.min(...keys.map((key) => steps.findIndex((step) => step.key === key)))
  const operationKey = selected.map(({ operation }) => operation.key).join("+")
  const combined: ScenarioStep = {
    key: `${first.layerKey}:${operationKey}`,
    layerKey: first.layerKey,
    componentPath: first.componentPath,
    sourceOperationKeys: selected.flatMap(({ sourceOperationKeys }) => sourceOperationKeys),
    operation: {
      key: operationKey,
      kind: first.operation.kind,
      changes: selected.flatMap(({ operation }) => operation.changes),
      dependsOn: [...new Set(selected.flatMap(({ operation }) => operation.dependsOn ?? []))],
    },
  }
  const result = steps.filter(({ key }) => !selectedKeys.has(key))
  result.splice(insertionIndex, 0, combined)
  return result
}
