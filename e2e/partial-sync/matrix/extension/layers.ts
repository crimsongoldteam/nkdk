import type { ScenarioLayer, ScenarioOperation } from "../types"
import { extensionConfigurationOperations, extensionConfigurationRestoreOperations } from "./configuration"
import { ownExtensionOperations } from "./own"

const componentPath = "cfe/Расширение_All" as const

export function createExtensionLayers(
  borrowedOperations: readonly ScenarioOperation[] = [],
): readonly ScenarioLayer[] {
  return [
    ...extensionConfigurationOperations.map(singleOperationLayer),
    ...ownExtensionOperations.map(singleOperationLayer),
    ...borrowedOperations.map(singleOperationLayer),
    ...extensionConfigurationRestoreOperations.map(singleOperationLayer),
  ]
}

function singleOperationLayer(operation: ScenarioOperation): ScenarioLayer {
  return { key: operation.key, componentPath, probeOperationKey: operation.key, operations: [operation] }
}
