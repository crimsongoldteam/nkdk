import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataExternalDataSourceCubeRules } from "./rules"

export const metadataExternalDataSourceCubePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceCubeRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("nameInDataSource"),
})
