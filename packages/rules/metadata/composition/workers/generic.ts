import { metadataRules } from "../metadataRules"
import { createRuleRegistrySet } from "../../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../../validation/validationRegistrySet"
import { createMetadataWorkerPersistentState } from "../../workerPool/workerState"
import { createOperationRegistrySet } from "../../operations/operationRegistrySet"
import { withMetadataExecutionRegistrySets } from "../metadataExecutionContext"
import { createPropertyStateCapabilityRegistry } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"

const [{ createMetadataWorkerCommandHandler }, { createMetadataWorkerOperations }] = await Promise.all([
  import("../../workerPool/worker"),
  import("../workerOperations"),
])
const rules = createRuleRegistrySet(metadataRules)
const propertyStates = createPropertyStateCapabilityRegistry(metadataRules.propertyStateCapabilities)
const validation = createValidationRegistrySet(metadataRules, rules, propertyStates)
const registries = { rules, validation, operations: createOperationRegistrySet(metadataRules, propertyStates) }

const worker = createMetadataWorkerCommandHandler({
  operations: createMetadataWorkerOperations(),
  createState: (params) => createMetadataWorkerPersistentState(params, { validationRuntime: validation }),
})

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
