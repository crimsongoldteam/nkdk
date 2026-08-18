import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const conditionalAppearanceExplicitXMLRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    conditionalAppearanceLeftField: {
      action: "transportScalar",
      itemType: "FilterItemComparison",
      propertyKey: "leftValue",
      transformPayload: (payload) => `.${payload}`,
    },
    conditionalAppearanceRightField: {
      action: "transportScalar",
      itemType: "FilterItemComparison",
      propertyKey: "rightValue",
      transformPayload: (payload) => `.${payload}`,
    },
  },
})
