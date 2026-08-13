import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceCubeRules } from "./rules"
import { borrowedExternalDataSourceRecordPresentationProperties } from "../metadataExternalDataSourceShared"

export const metadataExternalDataSourceCubePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...allPropertyStateModes("nameInDataSource"),
    ...borrowedExternalDataSourceRecordPresentationProperties,
    ...externalProperty("recordSetModule", "МодульНабораЗаписей", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
  },
})
