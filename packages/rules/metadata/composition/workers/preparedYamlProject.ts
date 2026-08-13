import { metadataRules } from "../metadataRules"
import { createRuleRegistrySet } from "../../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../../validation/validationRegistrySet"
import { createOperationRegistrySet } from "../../operations/operationRegistrySet"
import { withMetadataExecutionRegistrySets } from "../metadataExecutionContext"
import { createPropertyStateCapabilityRegistry } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"

const rules = createRuleRegistrySet(metadataRules)
const propertyStates = createPropertyStateCapabilityRegistry(metadataRules.propertyStateCapabilities)
const validation = createValidationRegistrySet(metadataRules, rules, propertyStates)
const registries = { rules, validation, operations: createOperationRegistrySet(metadataRules, propertyStates) }
const { createPreparedYamlProjectWorkerEntryPoint } = await import("../../project/preparedYamlProjectWorker")
const worker = createPreparedYamlProjectWorkerEntryPoint(validation)

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
