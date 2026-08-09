import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { registerProjectJSONSchema } from "../project/schemaRegistry"
import { MetadataCommandRules } from "../appliedObjects/metadataCommand/rules"
import { MetadataTaskAddressingAttributeRules } from "./metadataTaskAddressingAttribute/rules"

registerProjectJSONSchema("MetadataTaskAddressingAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataTaskAddressingAttributeRules })
)
registerProjectJSONSchema("MetadataCommand", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataCommandRules })
)
