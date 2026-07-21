import { registerMetadataItemRule } from "../../orchestration"
import { registerProjectSpec } from "../../project/projectSpecRegistry"
import { createProjectSchemaExporter } from "../../project/projectSpecHelpers"
import { registerProjectJSONSchema } from "../../project/schemaRegistry"
import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import {
  registerProjectReferenceObjectPathContributor,
  registerProjectReferenceValueContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"
import type { MetadataEnumerationYAML } from "./types"
import "./standardMembers"

registerMetadataItemRule({
  propertyType: "MetadataEnumeration",
  itemRule: MetadataEnumerationRules,
})

registerDataPathOwnerKind({
  kind: "Перечисление",
  projectDir: "Перечисление",
  rule: MetadataEnumerationRules,
  typeDescriptionBases: ["EnumRef"],
  metadataLinkPrefixes: ["Enum"],
})

registerProjectJSONSchema("MetadataEnumeration", ({ context }) => exportMetadataEnumerationToJSONSchema({ context }))
registerProjectReferenceObjectPathContributor("Enum", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Перечисление", target.objectName, "Свойства.yaml"),
}))
registerProjectReferenceValueContributor("Enum", ({ owner, target }) => {
  if (target.valueKind === "emptyRef") return undefined
  const values = metadataRecord(owner.facts).enumValues
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
})

registerProjectSpec({
  kind: "enumeration",
  dir: "Перечисление",
  rule: MetadataEnumerationRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataEnumerationToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) =>
    importMetadataEnumerationFromYAML(context, parsed.data as MetadataEnumerationYAML | undefined, name),
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
