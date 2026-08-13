import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceDimensionTableRules } from "./rules"

export const metadataExternalDataSourceDimensionTablePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceDimensionTableRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...allPropertyStateModes("nameInDataSource", "presentationField"),
    ...externalProperty("objectModule", "МодульОбъекта", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
  },
})
