import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceCubeRules } from "./rules"

export const metadataExternalDataSourceCubePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...allPropertyStateModes("nameInDataSource"),
    ...externalProperty("recordSetModule", "МодульНабораЗаписей", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
  },
})
