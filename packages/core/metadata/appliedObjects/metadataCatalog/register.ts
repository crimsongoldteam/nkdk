import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import {
  registerProjectReferenceObjectPathContributor,
  registerProjectReferenceValueContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { MetadataCatalogRules } from "./rules"
import "./standardMembers"

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

registerProjectReferenceObjectPathContributor("Catalog", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Справочник", target.objectName, "Свойства.yaml"),
}))
registerProjectReferenceValueContributor("Catalog", ({ owner, target }) => {
  if (target.valueKind === "emptyRef") return undefined
  const values = metadataRecord(owner.facts).predefined
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
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
