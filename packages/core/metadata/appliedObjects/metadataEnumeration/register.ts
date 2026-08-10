import { registerMetadataItemRule } from "../../ruleRuntime"
import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import {
  registerProjectReferenceObjectPathContributor,
  registerProjectReferenceValueContributor,
} from "../../validation/projectReferenceIndexRegistry"
import { MetadataEnumerationRules } from "./rules"
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

registerProjectReferenceObjectPathContributor("Enum", ({ projectDir, target }) => ({
  filePath: join(projectDir, "Перечисление", target.objectName, "Свойства.yaml"),
}))
registerProjectReferenceValueContributor("Enum", ({ owner, target }) => {
  if (target.valueKind === "emptyRef") return undefined
  const values = metadataRecord(owner.facts).enumValues
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
