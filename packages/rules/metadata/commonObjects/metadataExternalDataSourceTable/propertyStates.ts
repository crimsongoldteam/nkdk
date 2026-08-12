import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceTableRules } from "./rules"

export const metadataExternalDataSourceTablePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceTableRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("tableType"),
    ...allPropertyStateModes("nameInDataSource", "keyFields", "readOnly"),
  },
})
