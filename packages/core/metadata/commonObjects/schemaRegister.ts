import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import { registerProjectJSONSchema } from "../project/schemaRegistry"
import { MetadataCommandRules } from "../appliedObjects/metadataCommand/rules"
import {
  MetadataAttributeRules,
  MetadataCatalogAttributeRules,
  MetadataDocumentAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "./metadataAttribute/rules"
import { MetadataRegisterAttributeRules } from "./metadataRegisterAttribute/rules"
import { MetadataTabularSectionRules } from "./metadataTabularSection/rules"
import { MetadataTaskAddressingAttributeRules } from "./metadataTaskAddressingAttribute/rules"

registerProjectJSONSchema("MetadataAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataAttributeRules })
)
registerProjectJSONSchema("MetadataCatalogAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataCatalogAttributeRules })
)
registerProjectJSONSchema("MetadataDocumentAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentAttributeRules })
)
registerProjectJSONSchema("MetadataTabularSectionAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionAttributeRules })
)
registerProjectJSONSchema("MetadataRegisterAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataRegisterAttributeRules })
)
registerProjectJSONSchema("MetadataTaskAddressingAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataTaskAddressingAttributeRules })
)
registerProjectJSONSchema("MetadataTabularSection", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionRules })
)
registerProjectJSONSchema("MetadataCommand", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataCommandRules })
)
