import { metadataRules } from "../metadataRules"
import { createRuleRegistrySet } from "../../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../../validation/validationRegistrySet"
import { createMetadataWorkerPersistentState } from "../../workerPool/workerState"

const [{ createMetadataWorkerCommandHandler }, { createMetadataWorkerOperations }] = await Promise.all([
  import("../../workerPool/worker"),
  import("../workerOperations"),
])
const rules = createRuleRegistrySet(metadataRules)
const validation = createValidationRegistrySet(metadataRules, rules)

export default createMetadataWorkerCommandHandler({
  operations: createMetadataWorkerOperations(),
  createState: (params) => createMetadataWorkerPersistentState(params, { validationRuntime: validation }),
})
