import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath, type YamlPath } from "../yamlLocations"
import { getKnownPlatformFormSource, type FormDataPathIndex } from "./formIndex"
import {
  resolveObjectFieldSegment,
  standardAttributeAliasToYAML,
  type ObjectFieldTableSource,
} from "./objectFields"
import type { OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type {
  DataPathTypeInfo,
  FormDataPathSource,
  FormDataPathTableSource,
  OwnerTypeRef,
} from "./types"

export interface ResolveDataPathParams {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  value: string
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export interface TableContext {
  dataPath: string
}

export interface ResolvedDataPathTarget {
  value: string
  segments: readonly string[]
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
}

export type ResolvedDataPathTargetSource =
  | { kind: "formAttribute"; name: string }
  | { kind: "tableColumn"; table: string; name: string }
  | { kind: "objectField"; owner: OwnerTypeRef; name: string }
  | { kind: "constant"; name: string }

export type ResolveDataPathResult =
  | { status: "ok"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "warning"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "error"; diagnostics: Diagnostic[] }

interface TraversalState {
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
  tableSource?: FormDataPathTableSource | ObjectFieldTableSource
}

interface TableColumnSource {
  name: string
  typeInfo: DataPathTypeInfo
}

export function resolveDataPath(params: ResolveDataPathParams): ResolveDataPathResult {
  const { value } = params
  if (value.trim().length === 0) return { status: "ok", diagnostics: [] }

  const segments = value.split(".")

  if (isCurrentDataPath(segments)) {
    return warning(params, `ПутьКДанным "${value}": CurrentData пока не проверяется`)
  }

  if (isTildeVariantPath(value)) {
    return { status: "ok", diagnostics: [] }
  }

  const platformSource = getKnownPlatformFormSource(value)
  if (platformSource !== undefined) {
    return warning(params, `ПутьКДанным "${value}": платформенный источник пока не проверяется`)
  }

  const tableContextError = validateTableContext(params)
  if (tableContextError !== undefined) return { status: "error", diagnostics: [tableContextError] }

  const rootName = segments[0] ?? ""
  const root = params.index.getRoot(rootName)
  if (root === undefined) {
    return error(params, `ПутьКДанным "${value}": неизвестный корень "${rootName}"`)
  }

  let state: TraversalState = stateFromRoot(root)
  if (segments.length === 1) return okTarget({ value, segments, state })

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index] ?? ""
    const isLast = index === segments.length - 1

    const intermediateError = validateIntermediateType({ params, value, segment: segments[index - 1] ?? "", state })
    if (intermediateError !== undefined) return { status: "error", diagnostics: [intermediateError] }

    if (state.tableSource !== undefined) {
      const tableResult = resolveTableColumn({ params, value, segments, state, segment, isLast })
      if (tableResult.status !== "continue") return tableResult.result
      state = tableResult.state
      continue
    }

    if (state.typeInfo.kinds.includes("constantSet")) {
      const constantResult = resolveConstantSetItem({ params, segment })
      if (constantResult.status !== "ok") return ownerError(constantResult)

      state = {
        typeInfo: constantResult.typeInfo,
        source: { kind: "constant", name: segment },
      }

      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    if (state.typeInfo.kinds.includes("platformSource")) {
      return warning(params, `ПутьКДанным "${value}": платформенный источник пока не проверяется`)
    }

    const ownerResult = params.ownerCache.get(state.typeInfo.nextTypes[0] as OwnerTypeRef)
    if (ownerResult.status !== "ok") return ownerError(ownerResult)

    const field = resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment })
    if (field === undefined) {
      return error(params, `ПутьКДанным "${value}": неизвестный реквизит "${segment}"`)
    }

    state = {
      typeInfo: field.typeInfo,
      source: { kind: "objectField", owner: ownerResult.owner.ref, name: field.name },
      ...(field.tableSource !== undefined ? { tableSource: field.tableSource } : {}),
    }

    if (isLast) return okTarget({ value, segments, state })
  }

  return okTarget({ value, segments, state })
}

function resolveConstantSetItem(params: {
  params: ResolveDataPathParams
  segment: string
}):
  | { status: "ok"; typeInfo: DataPathTypeInfo }
  | Exclude<OwnerMetadataResult, { status: "ok" }> {
  const ownerResult = params.params.ownerCache.get({ kind: "Константа", name: params.segment })
  if (ownerResult.status !== "ok") return ownerResult

  const type = constantType(ownerResult.owner.model)
  return {
    status: "ok",
    typeInfo: typeDescriptionToDataPathTypeInfo(type),
  }
}

function constantType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof model !== "object" || model === null || !("type" in model)) return undefined
  return model.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function validateTableContext(params: ResolveDataPathParams): Diagnostic | undefined {
  const dataPath = params.tableContext?.dataPath
  if (dataPath === undefined) return undefined

  const prefix = `${dataPath}.`
  if (params.value.startsWith(prefix)) return undefined

  return diagnostic(params, "error", `ПутьКДанным "${params.value}": путь колонки должен начинаться с "${prefix}"`)
}

function isCurrentDataPath(segments: readonly string[]): boolean {
  return segments.length >= 4 && segments[0] === "Items" && segments[2] === "CurrentData"
}

function isTildeVariantPath(value: string): boolean {
  return value.includes("~")
}

function stateFromRoot(root: FormDataPathSource): TraversalState {
  return {
    typeInfo: root.typeInfo,
    source: { kind: "formAttribute", name: root.name },
    ...(root.tableSource !== undefined ? { tableSource: root.tableSource } : {}),
  }
}

function resolveTableColumn(params: {
  params: ResolveDataPathParams
  value: string
  segments: readonly string[]
  state: TraversalState
  segment: string
  isLast: boolean
}):
  | { status: "continue"; state: TraversalState }
  | { status: "done"; result: ResolveDataPathResult } {
  const { tableSource } = params.state
  if (tableSource === undefined) return { status: "continue", state: params.state }

  if (tableSource.table.kind === "DynamicList") {
    return {
      status: "done",
      result: warning(params.params, `ПутьКДанным "${params.value}": колонки динамического списка пока не проверяются`),
    }
  }

  const tablePath = params.segments.slice(0, -1).join(".")
  const column =
    resolveTableColumnSource({ columns: tableSource.columns, segment: params.segment }) ??
    resolveTableColumnSource({
      columns: params.params.index.additionalColumnsByTablePath.get(tablePath),
      segment: params.segment,
    }) ??
    virtualTableColumn({ yamlPath: params.params.yamlPath, segment: params.segment })
  if (column === undefined) {
    if (tableSource.hasColumns) {
      return {
        status: "done",
        result: error(params.params, `ПутьКДанным "${params.value}": неизвестная колонка "${params.segment}"`),
      }
    }

    return {
      status: "done",
      result: warning(params.params, `ПутьКДанным "${params.value}": колонки таблицы пока не известны`),
    }
  }

  const tableName = tableSource.table.kind === "TabularSection" ? tableSource.table.name : params.segments[0] ?? ""
  const state: TraversalState = stateFromTableColumn({ tableName, column })
  if (params.isLast) return { status: "done", result: okTarget({ value: params.value, segments: params.segments, state }) }

  return { status: "continue", state }
}

function resolveTableColumnSource(params: {
  columns: FormDataPathTableSource["columns"] | ObjectFieldTableSource["columns"] | undefined
  segment: string
}): TableColumnSource | undefined {
  if (params.columns === undefined) return undefined

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.columns.get(alias) ?? params.columns.get(params.segment)
  return params.columns.get(params.segment)
}

function virtualTableColumn(params: { yamlPath: YamlPath; segment: string }): TableColumnSource | undefined {
  const propertyName = params.yamlPath[params.yamlPath.length - 1]
  if (propertyName === "ПутьКДаннымЗаголовка" && params.segment === "RowsCount") {
    return {
      name: params.segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "RowsCount" },
    }
  }

  if (propertyName === "ПутьКДаннымПодвала" && params.segment.startsWith("Total")) {
    return {
      name: params.segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "Total" },
    }
  }

  return undefined
}

function stateFromTableColumn(params: { tableName: string; column: TableColumnSource }): TraversalState {
  return {
    typeInfo: params.column.typeInfo,
    source: { kind: "tableColumn", table: params.tableName, name: params.column.name },
  }
}

function validateIntermediateType(params: {
  params: ResolveDataPathParams
  value: string
  segment: string
  state: TraversalState
}): Diagnostic | undefined {
  const typeInfo = params.state.typeInfo
  if (typeInfo.isComposite === true || typeInfo.nextTypes.length > 1) {
    return diagnostic(
      params.params,
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет составной тип`,
    )
  }

  if (params.state.tableSource !== undefined) return undefined
  if (typeInfo.kinds.includes("constantSet")) return undefined
  if (typeInfo.kinds.includes("platformSource")) return undefined

  if (typeInfo.kinds.includes("unknown") || typeInfo.kinds.includes("any") || typeInfo.nextTypes.length === 0) {
    if (typeInfo.kinds.includes("unsupportedIntermediate")) {
      return diagnostic(
        params.params,
        "error",
        `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неподдерживаемый тип`,
      )
    }

    if (typeInfo.kinds.some(isScalarTerminalKind)) {
      return diagnostic(
        params.params,
        "error",
        `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" не является объектом`,
      )
    }

    return diagnostic(
      params.params,
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неизвестный тип`,
    )
  }

  if (typeInfo.kinds.includes("unsupportedIntermediate")) {
    return diagnostic(
      params.params,
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неподдерживаемый тип`,
    )
  }

  return undefined
}

function isScalarTerminalKind(kind: string): boolean {
  return kind === "boolean" || kind === "dateTime" || kind === "Picture" || kind === "scalar"
}

function ownerError(result: Exclude<OwnerMetadataResult, { status: "ok" }>): ResolveDataPathResult {
  return { status: "error", diagnostics: result.diagnostics }
}

function okTarget(params: {
  value: string
  segments: readonly string[]
  state: TraversalState
}): ResolveDataPathResult {
  return {
    status: "ok",
    diagnostics: [],
    target: {
      value: params.value,
      segments: params.segments,
      typeInfo: params.state.typeInfo,
      source: params.state.source,
    },
  }
}

function warning(params: ResolveDataPathParams, message: string): ResolveDataPathResult {
  return {
    status: "warning",
    diagnostics: [diagnostic(params, "warning", message)],
  }
}

function error(params: ResolveDataPathParams, message: string): ResolveDataPathResult {
  return {
    status: "error",
    diagnostics: [diagnostic(params, "error", message)],
  }
}

function diagnostic(
  params: ResolveDataPathParams,
  severity: Diagnostic["severity"],
  message: string,
): Diagnostic {
  return diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed,
    path: params.yamlPath,
    severity,
    source: "structure",
    message,
  })
}
