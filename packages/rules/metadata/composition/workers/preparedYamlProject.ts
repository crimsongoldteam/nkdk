import { metadataRules } from "../metadataRules"
import { createRuleRegistrySet } from "../../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../../validation/validationRegistrySet"

const rules = createRuleRegistrySet(metadataRules)
const validation = createValidationRegistrySet(metadataRules, rules)
const { createPreparedYamlProjectWorkerEntryPoint } = await import("../../project/preparedYamlProjectWorker")

export default createPreparedYamlProjectWorkerEntryPoint(validation)
