import { defineProjectJSONSchema } from "../../projectDefinition/schemaRegistry"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { MetadataConfigurationExtensionRules } from "./rules"

export const metadataRuleLayer000 = defineProjectJSONSchema(
  MetadataConfigurationExtensionRules.itemType,
  ({ context }) =>
    exportMetadataItemToJSONSchema({
      context,
      rule: MetadataConfigurationExtensionRules,
    }),
  MetadataConfigurationExtensionRules,
)
