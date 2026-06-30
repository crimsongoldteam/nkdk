import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { createProjectSchemaExporter } from "~/metadata/project/projectSpecHelpers"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"

registerMetadataItemRule({
  propertyType: "MetadataEnumeration",
  itemRule: MetadataEnumerationRules,
})

registerProjectJSONSchema("MetadataEnumeration", ({ context }) => exportMetadataEnumerationToJSONSchema({ context }))

registerProjectSpec({
  kind: "enumeration",
  dir: "Перечисление",
  rule: MetadataEnumerationRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataEnumerationToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
})
