import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { createGenericProjectImportModel, createProjectSchemaExporter } from "~/metadata/project/projectSpecHelpers"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { join } from "path"
import { registerProjectObjectPathResolver } from "~/metadata/validation/projectMetadataResolverRegistry"
import { MetadataDocumentRules } from "./rules"
import { exportMetadataDocumentToJSONSchema } from "./toJSONSchema"

registerProjectJSONSchema("MetadataDocument", ({ context }) => exportMetadataDocumentToJSONSchema({ context }))
registerProjectObjectPathResolver("Document", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Документ", target.objectName, "Свойства.yaml"),
}))

registerProjectSpec({
  kind: "document",
  dir: "Документ",
  rule: MetadataDocumentRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataDocumentToJSONSchema({ context })),
  importModel: createGenericProjectImportModel(MetadataDocumentRules),
})
