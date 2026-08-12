import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataExternalDataSourceDimensionTableRules } from "./rules"

export const metadataExternalDataSourceDimensionTablePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceDimensionTableRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("nameInDataSource", "presentationField"),
})
