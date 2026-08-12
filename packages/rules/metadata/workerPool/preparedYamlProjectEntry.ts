import {
  createPreparedYamlProjectWorkerEntryPoint,
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "../project/preparedYamlProjectWorker"
import { metadataRules } from "../composition/metadataRules"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"
import { createOperationRegistrySet } from "../operations/operationRegistrySet"
import { withMetadataExecutionRegistrySets } from "../composition/metadataExecutionContext"
import { createPropertyStateCapabilityRegistry } from "../appliedObjects/configurationExtension/propertyStateCapabilities"

const rules = createRuleRegistrySet(metadataRules)
const propertyStates = createPropertyStateCapabilityRegistry(metadataRules.propertyStateCapabilities)
const validation = createValidationRegistrySet(metadataRules, rules, propertyStates)
const registries = { rules, validation, operations: createOperationRegistrySet(metadataRules, propertyStates) }
const worker = createPreparedYamlProjectWorkerEntryPoint(validation)

export default function preparedYamlProjectEntry(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  return withMetadataExecutionRegistrySets(registries, () => worker(message))
}
