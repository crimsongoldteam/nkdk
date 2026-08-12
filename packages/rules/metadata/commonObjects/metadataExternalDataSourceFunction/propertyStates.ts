import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceFunctionRules } from "./rules"

export const metadataExternalDataSourceFunctionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceFunctionRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("returnValue", "expressionInDataSource"),
})
