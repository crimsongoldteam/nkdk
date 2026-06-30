import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { createProjectSchemaExporter } from "~/metadata/project/projectSpecHelpers"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { MetadataCatalogRules } from "./rules"
import { exportMetadataCatalogToJSONSchema } from "./toJSONSchema"

registerProjectJSONSchema("MetadataCatalog", ({ context }) => exportMetadataCatalogToJSONSchema({ context }))

registerProjectSpec({
  kind: "catalog",
  dir: "Справочник",
  rule: MetadataCatalogRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataCatalogToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) => importMetadataCatalogFromYAML(context, parsed.data, name),
})
