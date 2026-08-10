import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { defineProjectJSONSchema } from "../projectDefinition/schemaRegistry"
import { MetadataTaskAddressingAttributeRules } from "./metadataTaskAddressingAttribute/rules"

export const metadataRuleLayer000 = defineProjectJSONSchema(
  "MetadataTaskAddressingAttribute",
  ({ context }) =>
    exportMetadataItemToJSONSchema({
      context,
      rule: MetadataTaskAddressingAttributeRules,
    }),
  MetadataTaskAddressingAttributeRules,
)
