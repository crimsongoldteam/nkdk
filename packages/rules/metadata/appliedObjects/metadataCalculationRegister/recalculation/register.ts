import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { analyzeRecalculationDimensionLinks } from "./validation"

export const metadataRuleLayer000 = defineMetadataRules({
  ...emptyMetadataRules,
  dependentItems: {
    MetadataCalculationRegisterRecalculationDimension: {
      yaml: analyzeRecalculationDimensionLinks,
      imported: {
        propertyKeys: ["leadingRegisterData"],
        dependencies: {
          item: ["ИзмерениеРегистра", "ДанныеВедущихРегистров"],
          root: [{ collection: "Измерения", properties: ["ИзмерениеРегистра", "ДанныеВедущихРегистров"] }],
        },
        shouldRemove: () => false,
      },
    },
  },
})
