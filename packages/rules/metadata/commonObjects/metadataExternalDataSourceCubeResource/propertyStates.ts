import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceCubeResourceRules } from "./rules"

export const metadataExternalDataSourceCubeResourcePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeResourceRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: allPropertyStateModes("nameInDataSource"),
})
