import type { ProjectStateFieldEntry } from "../../projectState/contracts/fileUpdate"
import type { ObjectField, ObjectFieldIndex } from "./objectFields"

export function projectStateFieldIndex(
  owner: { readonly kind: string; readonly name?: string },
  entries: readonly ProjectStateFieldEntry[],
): ObjectFieldIndex {
  const ownerIdentity = projectStateOwnerIdentity(owner)
  const relevant = entries.filter((entry) => projectStateOwnerIdentity(entry.owner) === ownerIdentity)
  const columns = new Map<string, Map<string, ObjectField>>()
  for (const entry of relevant) {
    if (entry.parentName === undefined) continue
    const parentColumns = columns.get(entry.parentName) ?? new Map<string, ObjectField>()
    parentColumns.set(entry.name, projectStateObjectField(entry))
    columns.set(entry.parentName, parentColumns)
  }
  const fields = new Map<string, ObjectField>()
  const standardAttributeAliases = new Map<string, string>()
  for (const entry of relevant) {
    if (entry.parentName !== undefined) continue
    const field = projectStateObjectField(entry, columns.get(entry.name))
    fields.set(entry.name, field)
    if (entry.targetName !== undefined) {
      fields.set(entry.targetName, field)
      standardAttributeAliases.set(entry.targetName, entry.name)
    }
  }
  return { fields, standardAttributeAliases, diagnostics: [] }
}

function projectStateObjectField(
  entry: ProjectStateFieldEntry,
  columns?: Map<string, ObjectField>,
): ObjectField {
  return {
    name: entry.name,
    kind: entry.kind,
    typeInfo: entry.typeInfo,
    ...(entry.targetName === undefined ? {} : { targetName: entry.targetName }),
    ...(entry.sourceCollection === undefined ? {} : { sourceCollection: entry.sourceCollection }),
    ...(entry.table === undefined
      ? {}
      : { tableSource: { table: entry.table, columns: columns ?? new Map(), hasColumns: entry.tableHasColumns ?? false } }),
  }
}

function projectStateOwnerIdentity(owner: { readonly kind: string; readonly name?: string }): string {
  return `${owner.kind}\u0000${owner.name ?? ""}`
}
