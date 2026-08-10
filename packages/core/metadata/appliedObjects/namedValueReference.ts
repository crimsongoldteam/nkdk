import type { ProjectReferenceValueContributor } from "../validation/projectReferenceIndexRegistry"

export function createNamedValueReference(factsProperty: string): ProjectReferenceValueContributor {
  return ({ owner, target }) => {
    if (target.valueKind === "emptyRef") return undefined
    const values = metadataRecord(owner.facts)[factsProperty]
    return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
  }
}

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNamedItem(item, name))
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  if (record.name === name || Object.prototype.hasOwnProperty.call(record, name)) return true
  return hasNamedItem(record.items, name) || hasNamedItem(record.childItems, name) || hasNamedItem(record.enumValues, name)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
