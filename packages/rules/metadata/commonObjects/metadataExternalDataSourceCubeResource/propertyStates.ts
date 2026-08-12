import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataExternalDataSourceCubeResourceRules } from "./rules"

export const metadataExternalDataSourceCubeResourcePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeResourceRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: allPropertyStateModes("nameInDataSource"),
})
