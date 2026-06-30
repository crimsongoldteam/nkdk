import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { createProjectSchemaExporter } from "~/metadata/project/projectSpecHelpers"
import { registerProjectJSONSchema } from "~/metadata/project/schemaRegistry"
import { join } from "path"
import {
  registerProjectObjectPathResolver,
  registerProjectValueResolver,
} from "~/metadata/validation/projectMetadataResolverRegistry"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"

registerMetadataItemRule({
  propertyType: "MetadataEnumeration",
  itemRule: MetadataEnumerationRules,
})

registerProjectJSONSchema("MetadataEnumeration", ({ context }) => exportMetadataEnumerationToJSONSchema({ context }))
registerProjectObjectPathResolver("Enum", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Перечисление", target.objectName, "Свойства.yaml"),
}))
registerProjectValueResolver("Enum", ({ owner, target }) => {
  if (target.valueKind === "emptyRef") return undefined
  const values = metadataRecord(owner.model).enumValues
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
})

registerProjectSpec({
  kind: "enumeration",
  dir: "Перечисление",
  rule: MetadataEnumerationRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataEnumerationToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
})

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (record.name === name) return true
  if (Object.prototype.hasOwnProperty.call(record, name)) return true

  return hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
