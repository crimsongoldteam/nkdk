import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { analyzeRecalculationDimensionLinks } from "./validation"

export const metadataRuleLayer000 = defineMetadataRules({
  ...emptyMetadataRules,
  dependentItems: {
    MetadataCalculationRegisterRecalculationDimension: {
      yaml: analyzeRecalculationDimensionLinks,
    },
  },
})
