import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { recordOfSchemaRef } from "~/metadata/orchestration/jsonSchemaRefs"
import {
  registerProjectJSONSchema,
  registerProjectJSONSchemaPropertyRef,
  registerProjectJSONSchemaPropertyRefFactory,
} from "~/metadata/project/schemaRegistry"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
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

registerProjectJSONSchemaPropertyRef("MetadataCatalogAttributes", "MetadataCatalogAttribute")
registerProjectJSONSchemaPropertyRef("MetadataDocumentAttributes", "MetadataDocumentAttribute")
registerProjectJSONSchemaPropertyRef("MetadataAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataRegisterAttributes", "MetadataRegisterAttribute")
registerProjectJSONSchemaPropertyRef("MetadataReportAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataTaskAddressingAttributes", "MetadataTaskAddressingAttribute")
registerProjectJSONSchemaPropertyRefFactory("MetadataTabularSectionAttributes", () =>
  recordOfSchemaRef("MetadataTabularSectionAttribute")
)
registerProjectJSONSchemaPropertyRefFactory("MetadataCommands", () => recordOfSchemaRef("MetadataCommand"))

for (const type of [
  "MetadataTabularSections",
  "MetadataDocumentTabularSections",
  "MetadataTaskTabularSections",
  "MetadataBusinessProcessTabularSections",
  "MetadataDataProcessorTabularSections",
  "MetadataReportTabularSections",
  "MetadataExchangePlanTabularSections",
  "MetadataChartOfAccountsTabularSections",
  "MetadataChartOfCalculationTypesTabularSections",
  "MetadataChartOfCharacteristicTypesTabularSections",
] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () => recordOfSchemaRef("MetadataTabularSection"))
}
