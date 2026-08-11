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

const rules = createRuleRegistrySet(metadataRules)
const validation = createValidationRegistrySet(metadataRules, rules)
const registries = { rules, validation, operations: createOperationRegistrySet(metadataRules) }
const worker = createPreparedYamlProjectWorkerEntryPoint(validation)

export default function preparedYamlProjectEntry(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  return withMetadataExecutionRegistrySets(registries, () => worker(message))
}
