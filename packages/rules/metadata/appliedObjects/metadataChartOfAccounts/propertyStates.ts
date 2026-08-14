import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfAccountsRules } from "./rules"

export const metadataChartOfAccountsPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfAccountsRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("maxExtDimensionCount"),
    ...allPropertyStateModes("codeLength", "descriptionLength"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
    ...externalProperty("objectModule", "МодульОбъекта", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...controlled("orderLength", "extDimensionTypes"),
  },
})
