import {
  unresolvedProjectReferenceResult,
  type PendingMetadataTargetReference,
  type ProjectReferenceIndexResult,
} from "../projectReferenceIndex"
import type {
  DataTableDeclaration,
  DataTableDeclarationContributor,
  DataTableFieldDeclaration,
  DataTableIndex,
} from "./contracts"
import type { ValidationObjectRecord } from "../projectValidationTypes"

export * from "./contracts"

export function createDataTableIndex(params: {
  readonly records: readonly ValidationObjectRecord[]
  readonly contributors?: readonly DataTableDeclarationContributor[]
  readonly declarations?: readonly DataTableDeclaration[]
}): DataTableIndex {
  const declarations = [
    ...(params.declarations ?? []),
    ...(params.contributors ?? []).flatMap((contributor) => [...contributor(params.records)]),
  ]
  const tables = uniqueByCanonical(declarations)
  const fields = uniqueByCanonical(declarations.flatMap((table) => table.fields))
  const localFields = localFieldsByTable(declarations)

  return {
    resolve(reference, context) {
      if (reference.target.kind === "dataTable") {
        return resolveEntry(reference, tables.get(reference.canonical))
      }
      if (reference.target.kind !== "dataTableField") {
        return { ok: false, reason: "unsupported", diagnostics: [] }
      }
      const qualified = fields.get(reference.canonical)
      if (qualified !== undefined) return resolveEntry(reference, qualified)
      const tableCanonical = context?.tableCanonical
      if (tableCanonical === undefined) return unresolvedProjectReferenceResult(reference, "missing")
      return resolveEntry(reference, localFields.get(tableCanonical)?.get(reference.target.fieldName))
    },
  }
}

type IndexedEntry = DataTableDeclaration | DataTableFieldDeclaration | { readonly conflict: true }

function resolveEntry(
  reference: PendingMetadataTargetReference,
  entry: IndexedEntry | undefined,
): ProjectReferenceIndexResult {
  if (entry === undefined) return unresolvedProjectReferenceResult(reference, "missing")
  if ("conflict" in entry) return unresolvedProjectReferenceResult(reference, "ambiguous")
  if (!entry.result.ok) return { ok: false, reason: "notFound", diagnostics: entry.result.diagnostics }
  return { ok: true }
}

function uniqueByCanonical<Entry extends { readonly canonical: string }>(
  entries: readonly Entry[],
): Map<string, Entry | { readonly conflict: true }> {
  const result = new Map<string, Entry | { readonly conflict: true }>()
  for (const entry of entries) {
    result.set(entry.canonical, result.has(entry.canonical) ? { conflict: true } : entry)
  }
  return result
}

function localFieldsByTable(
  tables: readonly DataTableDeclaration[],
): Map<string, Map<string, DataTableFieldDeclaration | { readonly conflict: true }>> {
  const result = new Map<string, Map<string, DataTableFieldDeclaration | { readonly conflict: true }>>()
  for (const table of tables) {
    let fields = result.get(table.canonical)
    if (fields === undefined) {
      fields = new Map()
      result.set(table.canonical, fields)
    }
    for (const field of table.fields) {
      const name = field.target.fieldName
      fields.set(name, fields.has(name) ? { conflict: true } : field)
    }
  }
  return result
}
