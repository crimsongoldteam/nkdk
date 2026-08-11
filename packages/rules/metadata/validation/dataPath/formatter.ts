import type { FormDataPathIndex } from "./formIndex"
import { resolveDataPathCore, type TableContext } from "./coreResolver"
import type { OwnerMetadataCache } from "./ownerCache"
import { requiresDataPathStandardMemberFormatting } from "./finalizationPredicate"
import type { DataPathFormatDirection } from "./formatContracts"

export type { DataPathFormatDirection } from "./formatContracts"

export interface DataPathFormatDiagnostic {
  severity: "warning"
  code: "unresolved_data_path"
  targetProjectPath: string
  value: string
  message: string
}

export interface DataPathFormatDiagnosticSink {
  readonly targetProjectPath: string
  append(diagnostic: DataPathFormatDiagnostic): void
}

declare module "@nkdk/runtime" {
  interface FormExportToYAMLContext {
    readonly dataPathDiagnosticSink?: DataPathFormatDiagnosticSink
  }
}

export interface FormatDataPathStandardMembersParams {
  value: string
  direction: DataPathFormatDirection
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
  diagnosticSink?: DataPathFormatDiagnosticSink
}

export function formatDataPathStandardMembers(params: FormatDataPathStandardMembersParams): string {
  if (
    !requiresDataPathStandardMemberFormatting(params.value, params.direction) &&
    !requiresDataPathDialectFormatting(params)
  ) return params.value
  const value = params.value
  const result = resolveDataPathCore({
    value,
    nameMode: params.direction === "yaml-to-internal" ? "yaml" : "internal",
    index: params.index,
    ownerCache: params.ownerCache,
    ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
  })

  if (result.status === "error") {
    params.diagnosticSink?.append({
      severity: "warning",
      code: "unresolved_data_path",
      targetProjectPath: params.diagnosticSink.targetProjectPath,
      value: params.value,
      message: `Не удалось преобразовать ПутьКДанным: ${params.value}`,
    })
    return params.value
  }
  const canonicalValue = params.direction === "yaml-to-internal" ? result.internalValue : result.yamlValue
  if (canonicalValue !== undefined) return canonicalValue
  if (result.replacements.length === 0) return params.value

  const segments = value.split(".")
  for (const replacement of result.replacements) {
    const segment = segments[replacement.segmentIndex]
    if (segment === undefined) continue
    const suffix = segment.slice(replacement.from.length)
    segments[replacement.segmentIndex] = `${replacement.to}${suffix}`
  }
  return segments.join(".")
}

function requiresDataPathDialectFormatting(params: FormatDataPathStandardMembersParams): boolean {
  const dialect = params.index.dialect
  if (dialect === undefined) return false
  const root = params.direction === "internal-to-yaml" ? dialect.serviceRoot.internal : dialect.serviceRoot.yaml
  const currentRow = params.direction === "internal-to-yaml" ? dialect.currentRow.internal : dialect.currentRow.yaml
  const segments = params.value.split(".")
  return segments.length >= 4 && segments[0] === root && segments[2] === currentRow
}
