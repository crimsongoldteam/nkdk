import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataExternalDataSourceTableRules } from "./rules"

export const metadataExternalDataSourceTablePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceTableRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("tableType"),
    ...allPropertyStateModes("nameInDataSource", "keyFields", "readOnly"),
  },
})
