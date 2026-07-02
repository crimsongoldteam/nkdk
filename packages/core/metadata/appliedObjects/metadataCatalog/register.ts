import { registerProjectSpec } from "../../project/projectSpecRegistry"
import { createProjectSchemaExporter } from "../../project/projectSpecHelpers"
import { registerProjectJSONSchema } from "../../project/schemaRegistry"
import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import {
  registerProjectReferenceObjectPathContributor,
  registerProjectReferenceValueContributor,
} from "../../validation/projectMetadataResolverRegistry"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { MetadataCatalogRules } from "./rules"
import { exportMetadataCatalogToJSONSchema } from "./toJSONSchema"
import type { MetadataCatalogYAML } from "./types"

registerDataPathOwnerKind({
  kind: "Справочник",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogRef"],
  metadataLinkPrefixes: ["Catalog"],
  aliases: ["СправочникОбъект"],
})
registerDataPathOwnerKind({
  kind: "СправочникОбъект",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogObject"],
  metadataLinkPrefixes: ["Catalog"],
})

registerProjectJSONSchema("MetadataCatalog", ({ context }) => exportMetadataCatalogToJSONSchema({ context }))
registerProjectReferenceObjectPathContributor("Catalog", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Справочник", target.objectName, "Свойства.yaml"),
}))
registerProjectReferenceValueContributor("Catalog", ({ owner, target }) => {
  if (target.valueKind === "emptyRef") return undefined
  const values = metadataRecord(owner.model).predefined
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
})

registerProjectSpec({
  kind: "catalog",
  dir: "Справочник",
  rule: MetadataCatalogRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataCatalogToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) =>
    importMetadataCatalogFromYAML(context, parsed.data as MetadataCatalogYAML | undefined, name),
})

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false

  const record = value as Record<string, unknown>
  if (record.name === name) return true
  if (Object.prototype.hasOwnProperty.call(record, name)) return true

  return (
    hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
  )
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
