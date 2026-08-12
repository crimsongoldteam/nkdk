import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataExternalDataSourceFunctionRules } from "./rules"

export const metadataExternalDataSourceFunctionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceFunctionRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("returnValue", "expressionInDataSource"),
})
