import {
  createPreparedYamlProjectWorkerEntryPoint,
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "../project/preparedYamlProjectWorker"
import { metadataRules } from "../composition/metadataRules"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"

const rules = createRuleRegistrySet(metadataRules)
const worker = createPreparedYamlProjectWorkerEntryPoint(
  createValidationRegistrySet(metadataRules, rules),
)

export default function preparedYamlProjectEntry(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  return worker(message)
}
