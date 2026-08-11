import { metadataRules } from "../metadataRules"
import { createRuleRegistrySet } from "../../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../../validation/validationRegistrySet"
import { createOperationRegistrySet } from "../../operations/operationRegistrySet"
import { withMetadataExecutionRegistrySets } from "../metadataExecutionContext"

const rules = createRuleRegistrySet(metadataRules)
const validation = createValidationRegistrySet(metadataRules, rules)
const registries = { rules, validation, operations: createOperationRegistrySet(metadataRules) }
const { createPreparedYamlProjectWorkerEntryPoint } = await import("../../project/preparedYamlProjectWorker")
const worker = createPreparedYamlProjectWorkerEntryPoint(validation)

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
