import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceFunctionRules } from "./rules"

export const metadataExternalDataSourceFunctionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceFunctionRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    type: { availability: "own", modes: [] },
    ...allPropertyStateModes("returnValue", "expressionInDataSource"),
  },
})
