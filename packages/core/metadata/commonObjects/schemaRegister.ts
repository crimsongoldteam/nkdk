import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { registerProjectJSONSchema } from "../projectDefinition/schemaRegistry"
import { MetadataTaskAddressingAttributeRules } from "./metadataTaskAddressingAttribute/rules"

registerProjectJSONSchema("MetadataTaskAddressingAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataTaskAddressingAttributeRules })
)
