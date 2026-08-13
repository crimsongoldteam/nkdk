import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceTableRules } from "./rules"

export const metadataExternalDataSourceTablePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceTableRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("tableType"),
    ...allPropertyStateModes("nameInDataSource", "keyFields", "readOnly"),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...externalProperty("objectModule", "МодульОбъекта", ["extend"]),
    ...externalProperty("recordSetModule", "МодульНабораЗаписей", ["extend"]),
  },
})
