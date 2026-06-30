import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { createGenericProjectImportModel, createProjectSchemaExporter } from "~/metadata/project/projectSpecHelpers"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { MetadataDocumentRules } from "./rules"
import { exportMetadataDocumentToJSONSchema } from "./toJSONSchema"

registerProjectJSONSchema("MetadataDocument", ({ context }) => exportMetadataDocumentToJSONSchema({ context }))

registerProjectSpec({
  kind: "document",
  dir: "Документ",
  rule: MetadataDocumentRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataDocumentToJSONSchema({ context })),
  importModel: createGenericProjectImportModel(MetadataDocumentRules),
})
