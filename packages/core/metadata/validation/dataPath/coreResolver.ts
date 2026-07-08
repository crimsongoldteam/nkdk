import type { Diagnostic } from "../types"
import { getKnownPlatformFormSource, type FormDataPathIndex } from "./formIndex"
import { resolveObjectFieldSegment, standardAttributeAliasToYAML, type ObjectFieldTableSource } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import {
  getMetadataLinkPrefixesByOwnerKind,
  resolveRegisteredTableColumn,
  resolveMovementItem as resolveRegisteredMovementItem,
  resolveTraversalTimeStandardMember,
  resolveTraversalTransition,
  resolveVirtualOwnerField,
} from "./registry"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type { DataPathTypeInfo, FormDataPathSource, FormDataPathTableSource, OwnerTypeRef } from "./types"

export interface ResolveDataPathCoreParams {
  value: string
  nameMode: DataPathNameMode
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export type DataPathNameMode = "internal" | "yaml"

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
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "standardPeriodField"; name: string }

export interface ResolvedDataPathSegmentReplacement {
  segmentIndex: number
  from: string
  to: string
  reason: "standardMember"
}

export type ResolveDataPathCoreIssueCode =
  | "current_data_unsupported"
  | "tilde_variant"
  | "platform_source"
  | "table_context_mismatch"
  | "unknown_root"
  | "unknown_column"
  | "unknown_field"
  | "unknown_type"
  | "unsupported_intermediate"
  | "scalar_intermediate"
  | "composite_intermediate"
  | "owner_error"

export interface ResolveDataPathCoreIssue {
  code: ResolveDataPathCoreIssueCode
  severity: "warning" | "error"
  message: string
  ownerDiagnostics?: Diagnostic[]
}

export type ResolveDataPathCoreResult =
  | {
      status: "ok"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: []
    }
  | {
      status: "warning" | "error"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: ResolveDataPathCoreIssue[]
    }

interface TraversalState {
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
  tableSource?: FormDataPathTableSource | ObjectFieldTableSource
  registerRecordsOwner?: OwnerMetadata
}

interface TableColumnSource {
  name: string
  typeInfo: DataPathTypeInfo
}

export function resolveDataPathCore(params: ResolveDataPathCoreParams): ResolveDataPathCoreResult {
  const { value } = params
  if (value.trim().length === 0) return okWithoutTarget({ value, segments: [] })

  const segments = value.split(".")
  const replacements: ResolvedDataPathSegmentReplacement[] = []

  if (isCurrentDataPath(segments)) {
    return warning(
      params,
      segments,
      `ПутьКДанным "${value}": CurrentData пока не проверяется`,
      "current_data_unsupported"
    )
  }

  if (isTildeVariantPath(value)) {
    return okWithoutTarget({ value, segments })
  }

  const platformSource = getKnownPlatformFormSource(value)
  if (platformSource !== undefined) {
    return warning(
      params,
      segments,
      `ПутьКДанным "${value}": платформенный источник пока не проверяется`,
      "platform_source"
    )
  }

  const tableContextError = validateTableContext(params)
  if (tableContextError !== undefined) return issueResult(params, segments, tableContextError, replacements)

  const rootName = segmentLookupName(segments[0] ?? "")
  const root = params.index.getRoot(rootName)
  if (root === undefined) {
    return error(params, `ПутьКДанным "${value}": неизвестный корень "${segments[0] ?? ""}"`)
  }

  let state: TraversalState = stateFromRoot(root)
  if (segments.length === 1) return okTarget({ value, segments, state, replacements })

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index] ?? ""
    const lookupSegment = segmentLookupName(segment)
    const isLast = index === segments.length - 1

    const intermediateError = validateIntermediateType({ params, value, segment: segments[index - 1] ?? "", state })
    if (intermediateError !== undefined) return issueResult(params, segments, intermediateError, replacements)

    if (state.tableSource !== undefined) {
      const tableResult = resolveTableColumn({
        params,
        value,
        segments,
        replacements,
        segmentIndex: index,
        state,
        segment,
        isLast,
      })
      if (tableResult.status !== "continue") return tableResult.result
      state = tableResult.state
      continue
    }

    if (state.typeInfo.kinds.includes("constantSet")) {
      const constantResult = resolveConstantSetItem({ params, segment: lookupSegment })
      if (constantResult.status !== "ok") return ownerError(params, segments, replacements, constantResult)

      state = {
        typeInfo: constantResult.typeInfo,
        source: { kind: "constant", name: lookupSegment },
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    if (state.typeInfo.kinds.includes("registerRecords")) {
      const registerRecordsOwner = state.registerRecordsOwner
      if (registerRecordsOwner === undefined) {
        return error(params, `ПутьКДанным "${value}": неизвестный регистр движений "${segment}"`)
      }

      const registerResult = resolveMovementItemSegment({
        params,
        value,
        owner: registerRecordsOwner,
        segment: lookupSegment,
      })
      if (registerResult.status !== "ok") return registerResult.result

      state = registerResult.state
      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    if (state.typeInfo.kinds.includes("platformSource")) {
      return warning(
        params,
        segments,
        `ПутьКДанным "${value}": платформенный источник пока не проверяется`,
        "platform_source"
      )
    }

    if (state.typeInfo.kinds.includes("standardPeriod")) {
      const field = standardPeriodField(lookupSegment)
      if (field === undefined) {
        return error(params, `ПутьКДанным "${value}": неизвестный реквизит "${segment}"`)
      }

      state = {
        typeInfo: field.typeInfo,
        source: { kind: "standardPeriodField", name: lookupSegment },
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const definedTypeResult = resolveDefinedTypeInfo({ params, typeInfo: state.typeInfo })
    if (definedTypeResult.status !== "ok") return ownerError(params, segments, replacements, definedTypeResult)

    const resolvedTypeInfo = definedTypeResult.typeInfo
    const intermediateErrorAfterDefinedType = validateIntermediateType({
      params,
      value,
      segment: segments[index - 1] ?? "",
      state: { ...state, typeInfo: resolvedTypeInfo },
    })
    if (intermediateErrorAfterDefinedType !== undefined)
      return issueResult(params, segments, intermediateErrorAfterDefinedType, replacements)

    const ownerResult = params.ownerCache.get(resolvedTypeInfo.nextTypes[0] as OwnerTypeRef)
    if (ownerResult.status !== "ok") return ownerError(params, segments, replacements, ownerResult)

    const transition = resolveTraversalTransition({
      owner: ownerResult.owner,
      segment: lookupSegment,
      ownerCache: params.ownerCache,
    })
    if (transition?.kind === "warning") {
      return warning(
        params,
        segments,
        `ПутьКДанным "${value}": платформенный источник пока не проверяется`,
        "platform_source"
      )
    }
    if (transition !== undefined) {
      state = {
        typeInfo: transition.typeInfo,
        source:
          transition.sourceKind === "registerRecords"
            ? { kind: "registerRecords", owner: ownerResult.owner.ref, name: transition.sourceName }
            : { kind: "objectField", owner: ownerResult.owner.ref, name: transition.sourceName },
        ...(transition.tableSource !== undefined ? { tableSource: transition.tableSource } : {}),
        ...(transition.registerRecordsOwner !== undefined
          ? { registerRecordsOwner: transition.registerRecordsOwner }
          : {}),
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const field = resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment: lookupSegment })
    const standardMember = resolveTraversalTimeStandardMember({
      owner: ownerResult.owner,
      segment: lookupSegment,
      ownerCache: params.ownerCache,
    })
    if (isStandardMemberError(standardMember)) {
      return error(params, `ПутьКДанным "${value}": ${standardMember.message}`)
    }
    if (standardMember !== undefined) {
      recordStandardMemberReplacement({
        replacements,
        nameMode: params.nameMode,
        segmentIndex: index,
        input: lookupSegment,
        internalName: standardMember.internalName,
        yamlName: standardMember.yamlName,
      })

      state = {
        typeInfo: standardMember.typeInfo,
        source: { kind: "objectField", owner: ownerResult.owner.ref, name: standardMember.name },
        ...(standardMember.tableSource !== undefined ? { tableSource: standardMember.tableSource } : {}),
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const virtualField = resolveVirtualOwnerField({
      owner: ownerResult.owner,
      segment: lookupSegment,
    })
    if (virtualField !== undefined) {
      state = {
        typeInfo: virtualField.typeInfo,
        source: { kind: "objectField", owner: ownerResult.owner.ref, name: virtualField.name },
        tableSource: virtualField.tableSource,
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const formOnlyTable = formOnlyTableFromAdditionalColumns({
      index: params.index,
      segments,
      segmentIndex: index,
      segment: lookupSegment,
    })
    if (
      formOnlyTable !== undefined &&
      (field === undefined || (field.tableSource === undefined && canUseFormOnlyTableForField(field.typeInfo)))
    ) {
      state = {
        typeInfo: formOnlyTable.typeInfo,
        source: { kind: "objectField", owner: ownerResult.owner.ref, name: formOnlyTable.name },
        tableSource: formOnlyTable.tableSource,
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const commonAttribute =
      field === undefined
        ? resolveCommonAttributeField({ params, owner: ownerResult.owner, segment: lookupSegment })
        : undefined
    if (commonAttribute !== undefined) {
      state = {
        typeInfo: commonAttribute.typeInfo,
        source: { kind: "objectField", owner: ownerResult.owner.ref, name: commonAttribute.name },
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    if (field === undefined) {
      return error(params, `ПутьКДанным "${value}": неизвестный реквизит "${segment}"`)
    }

    recordObjectFieldReplacement({
      replacements,
      nameMode: params.nameMode,
      segmentIndex: index,
      input: lookupSegment,
      field,
    })

    const tableSource = tableSourceFromObjectField(field)
    state = {
      typeInfo: field.typeInfo,
      source: { kind: "objectField", owner: ownerResult.owner.ref, name: field.name },
      ...(tableSource !== undefined ? { tableSource } : {}),
    }

    if (isLast) return okTarget({ value, segments, state, replacements })
  }

  return okTarget({ value, segments, state, replacements })
}

function canUseFormOnlyTableForField(typeInfo: DataPathTypeInfo): boolean {
  return isUnknownTypeInfo(typeInfo) || typeInfo.kinds.includes("tableSource")
}

function formOnlyTableFromAdditionalColumns(params: {
  index: FormDataPathIndex
  segments: readonly string[]
  segmentIndex: number
  segment: string
}): { name: string; typeInfo: DataPathTypeInfo; tableSource: FormDataPathTableSource } | undefined {
  const tablePath = normalizeIndexedPath(params.segments.slice(0, params.segmentIndex + 1).join("."))
  const columns = params.index.additionalColumnsByTablePath.get(tablePath)
  if (columns === undefined) return undefined

  const table = { kind: "ValueTable" as const }
  return {
    name: params.segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `AdditionalColumns.${tablePath}`,
    },
    tableSource: {
      table,
      columns,
      hasColumns: true,
    },
  }
}

function tableSourceFromObjectField(field: {
  typeInfo: DataPathTypeInfo
  tableSource?: ObjectFieldTableSource
}): ObjectFieldTableSource | undefined {
  if (field.tableSource !== undefined) return field.tableSource
  const table = field.typeInfo.table
  if (table === undefined) return undefined

  return {
    table,
    columns: new Map(),
    hasColumns: table.kind === "ValueList" || table.kind === "GanttChart" || table.kind === "RegisterRecordSet",
  }
}

function standardPeriodField(segment: string): { typeInfo: DataPathTypeInfo } | undefined {
  if (segment === "Variant") {
    return { typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "StandardPeriod.Variant" } }
  }
  if (segment === "StartDate" || segment === "EndDate") {
    return { typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText: `StandardPeriod.${segment}` } }
  }
  return undefined
}

function resolveConstantSetItem(params: {
  params: ResolveDataPathCoreParams
  segment: string
}): { status: "ok"; typeInfo: DataPathTypeInfo } | Exclude<OwnerMetadataResult, { status: "ok" }> {
  const ownerResult = params.params.ownerCache.get({ kind: "Константа", name: params.segment })
  if (ownerResult.status !== "ok") return ownerResult

  const type = constantType(ownerResult.owner.model)
  return {
    status: "ok",
    typeInfo: typeDescriptionToDataPathTypeInfo(type),
  }
}

function resolveDefinedTypeInfo(params: {
  params: ResolveDataPathCoreParams
  typeInfo: DataPathTypeInfo
}): { status: "ok"; typeInfo: DataPathTypeInfo } | Exclude<OwnerMetadataResult, { status: "ok" }> {
  const definedTypes = params.typeInfo.definedTypes ?? []
  if (definedTypes.length === 0) return { status: "ok", typeInfo: params.typeInfo }

  const typeInfos: DataPathTypeInfo[] = []
  for (const definedType of definedTypes) {
    const ownerResult = params.params.ownerCache.get({ kind: "ОпределяемыйТип", name: definedType })
    if (ownerResult.status !== "ok") return ownerResult

    typeInfos.push(typeDescriptionToDataPathTypeInfo(definedTypeType(ownerResult.owner.model)))
  }

  return { status: "ok", typeInfo: mergeResolvedDefinedTypeInfo(params.typeInfo, typeInfos) }
}

function mergeResolvedDefinedTypeInfo(
  source: DataPathTypeInfo,
  resolvedItems: readonly DataPathTypeInfo[]
): DataPathTypeInfo {
  const kinds = [...source.kinds]
  const nextTypes = [...source.nextTypes]
  const sourceTexts = source.sourceText !== undefined ? [source.sourceText] : []
  let table = source.table
  let isComposite = source.isComposite === true

  for (const item of resolvedItems) {
    for (const kind of item.kinds) {
      if (!kinds.includes(kind)) kinds.push(kind)
    }
    for (const nextType of item.nextTypes) {
      if (!nextTypes.some((existing) => ownerRefEquals(existing, nextType))) nextTypes.push(nextType)
    }
    if (table === undefined && item.table !== undefined) table = item.table
    if (item.isComposite === true) isComposite = true
    if (item.sourceText !== undefined) sourceTexts.push(item.sourceText)
  }

  return {
    kinds,
    nextTypes,
    ...(table !== undefined ? { table } : {}),
    ...(isComposite || nextTypes.length > 1 ? { isComposite: true } : {}),
    ...(sourceTexts.length > 0 ? { sourceText: sourceTexts.join(" -> ") } : {}),
  }
}

function definedTypeType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof model !== "object" || model === null || !("type" in model)) return undefined
  return model.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function resolveCommonAttributeField(params: {
  params: ResolveDataPathCoreParams
  owner: OwnerMetadata
  segment: string
}): TableColumnSource | undefined {
  const ownerResult = params.params.ownerCache.get({ kind: "ОбщийРеквизит", name: params.segment })
  if (ownerResult.status !== "ok") return undefined
  if (!commonAttributeAppliesToOwner(ownerResult.owner.model, params.owner.ref)) return undefined

  return {
    name: params.segment,
    typeInfo: typeDescriptionToDataPathTypeInfo(commonAttributeType(ownerResult.owner.model)),
  }
}

function commonAttributeType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  return modelObjectValue(model, "type") as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function commonAttributeAppliesToOwner(model: unknown, ownerRef: OwnerTypeRef): boolean {
  const content = modelObjectValue(model, "content")
  if (!Array.isArray(content)) return false

  const ownerLinks = ownerMetadataLinks(ownerRef)
  if (ownerLinks.length === 0) return false

  return content.some((item) => {
    const metadata = modelObjectValue(item, "metadata")
    const use = modelObjectValue(item, "use")
    return typeof metadata === "string" && use === "Use" && ownerLinks.includes(metadata)
  })
}

function modelObjectValue(model: unknown, key: string): unknown {
  if (typeof model !== "object" || model === null) return undefined
  return (model as Record<string, unknown>)[key]
}

function ownerMetadataLinks(ref: OwnerTypeRef): string[] {
  if (!ref.name) return []

  return getMetadataLinkPrefixesByOwnerKind(ref.kind).map((prefix) => `${prefix}.${ref.name}`)
}

function ownerRefEquals(left: OwnerTypeRef, right: OwnerTypeRef): boolean {
  return left.kind === right.kind && left.name === right.name
}

function resolveMovementItemSegment(params: {
  params: ResolveDataPathCoreParams
  value: string
  owner: OwnerMetadata
  segment: string
}): { status: "ok"; state: TraversalState } | { status: "error"; result: ResolveDataPathCoreResult } {
  const registered = resolveRegisteredMovementItem({ owner: params.owner, segment: params.segment })
  if (registered === undefined) {
    return {
      status: "error",
      result: error(params.params, `ПутьКДанным "${params.value}": неизвестный регистр движений "${params.segment}"`),
    }
  }

  return {
    status: "ok",
    state: {
      typeInfo: registered.typeInfo,
      source: { kind: "registerRecordSet", owner: registered.owner, name: params.segment },
      tableSource: registered.tableSource,
    },
  }
}

function constantType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof model !== "object" || model === null || !("type" in model)) return undefined
  return model.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function validateTableContext(params: ResolveDataPathCoreParams): ResolveDataPathCoreIssue | undefined {
  const dataPath = params.tableContext?.dataPath
  if (dataPath === undefined) return undefined

  const normalizedValue = normalizeIndexedPath(params.value)
  const normalizedDataPath = normalizeIndexedPath(dataPath)
  const prefix = `${normalizedDataPath}.`
  if (normalizedValue.startsWith(prefix)) return undefined

  return diagnostic(
    "error",
    `ПутьКДанным "${params.value}": путь колонки должен начинаться с "${prefix}"`,
    "table_context_mismatch"
  )
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
  params: ResolveDataPathCoreParams
  value: string
  segments: readonly string[]
  replacements: readonly ResolvedDataPathSegmentReplacement[]
  segmentIndex: number
  state: TraversalState
  segment: string
  isLast: boolean
}): { status: "continue"; state: TraversalState } | { status: "done"; result: ResolveDataPathCoreResult } {
  const { tableSource } = params.state
  if (tableSource === undefined) return { status: "continue", state: params.state }

  if (tableSource.table.kind === "DynamicList") {
    return {
      status: "done",
      result: okWithoutTarget({ value: params.value, segments: params.segments }),
    }
  }

  const tablePath = params.segments.slice(0, params.segmentIndex).join(".")
  const normalizedTablePath = normalizeIndexedPath(tablePath)
  const lookupSegment = segmentLookupName(params.segment)
  const registeredColumnResult = resolveRegisteredColumn({
    params: params.params,
    tableSource,
    segment: lookupSegment,
    replacements: params.replacements,
  })
  if (registeredColumnResult.status === "error") {
    return { status: "done", result: registeredColumnResult.result }
  }

  const column =
    resolveTableColumnSource({ columns: tableSource.columns, segment: lookupSegment }) ??
    resolveTableColumnSource({
      columns: params.params.index.additionalColumnsByTablePath.get(normalizedTablePath),
      segment: lookupSegment,
    }) ??
    registeredColumnResult.column
  if (column === undefined) {
    if (tableSource.hasColumns) {
      return {
        status: "done",
        result: error(params.params, `ПутьКДанным "${params.value}": неизвестная колонка "${params.segment}"`),
      }
    }

    return {
      status: "done",
      result: warning(
        params.params,
        params.segments,
        `ПутьКДанным "${params.value}": колонки таблицы пока не известны`,
        "unknown_column"
      ),
    }
  }

  const tableName = tableNameForTableSource({ state: params.state, segments: params.segments })
  const nestedTablePath = `${normalizedTablePath}.${column.name}`
  const state: TraversalState = stateFromTableColumn({
    tableName,
    column,
    tableSource: tableSourceFromColumn({
      index: params.params.index,
      column,
      tablePath: nestedTablePath,
    }),
  })
  if (params.isLast)
    return {
      status: "done",
      result: okTarget({ value: params.value, segments: params.segments, state, replacements: params.replacements }),
    }

  return { status: "continue", state }
}

function tableSourceFromColumn(params: {
  index: FormDataPathIndex
  column: TableColumnSource
  tablePath: string
}): FormDataPathTableSource | undefined {
  const table = params.column.typeInfo.table
  if (table === undefined) return undefined

  const columns = params.index.additionalColumnsByTablePath.get(params.tablePath) ?? new Map()
  return {
    table,
    columns,
    hasColumns:
      columns.size > 0 ||
      table.kind === "ValueList" ||
      table.kind === "GanttChart" ||
      table.kind === "RegisterRecordSet",
  }
}

function resolveRegisteredColumn(params: {
  params: ResolveDataPathCoreParams
  tableSource: FormDataPathTableSource | ObjectFieldTableSource
  segment: string
  replacements: readonly ResolvedDataPathSegmentReplacement[]
}): { status: "ok"; column?: TableColumnSource } | { status: "error"; result: ResolveDataPathCoreResult } {
  const ownerResult =
    params.tableSource.table.kind === "RegisterRecordSet"
      ? params.params.ownerCache.get(params.tableSource.table.owner)
      : undefined
  if (ownerResult?.status !== undefined && ownerResult.status !== "ok")
    return {
      status: "error",
      result: ownerError(params.params, params.params.value.split("."), params.replacements, ownerResult),
    }

  const field =
    ownerResult?.status === "ok"
      ? resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment: params.segment })
      : undefined
  const column = resolveRegisteredTableColumn({
    table: params.tableSource.table,
    segment: params.segment,
    index: params.params.index,
    ...(ownerResult?.status === "ok" ? { owner: ownerResult.owner } : {}),
    ...(field !== undefined ? { field } : {}),
  })
  return {
    status: "ok",
    ...(column !== undefined ? { column } : {}),
  }
}

function isUnknownTypeInfo(typeInfo: DataPathTypeInfo): boolean {
  return typeInfo.kinds.length === 1 && typeInfo.kinds[0] === "unknown"
}

function tableNameForTableSource(params: { state: TraversalState; segments: readonly string[] }): string {
  const table = params.state.tableSource?.table
  if (table?.kind === "TabularSection") return table.name
  if (table?.kind === "RegisterRecordSet" && params.state.source.kind === "registerRecordSet")
    return params.state.source.name
  if (params.state.source.kind === "tableColumn") return params.state.source.name
  if (params.state.source.kind === "objectField") return params.state.source.name
  return segmentLookupName(params.segments[0] ?? "")
}

function normalizeIndexedPath(path: string): string {
  return path.split(".").map(segmentLookupName).join(".")
}

function segmentLookupName(segment: string): string {
  const match = /^(?<name>.+)\[(?<index>\d+)\]$/.exec(segment)
  return match?.groups?.name ?? segment
}

function resolveTableColumnSource(params: {
  columns: FormDataPathTableSource["columns"] | ObjectFieldTableSource["columns"] | undefined
  segment: string
}): TableColumnSource | undefined {
  if (params.columns === undefined) return undefined

  const direct = params.columns.get(params.segment)
  if (direct !== undefined) return direct

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.columns.get(alias)
  return undefined
}

function stateFromTableColumn(params: {
  tableName: string
  column: TableColumnSource
  tableSource?: FormDataPathTableSource
}): TraversalState {
  return {
    typeInfo: params.column.typeInfo,
    source: { kind: "tableColumn", table: params.tableName, name: params.column.name },
    ...(params.tableSource !== undefined ? { tableSource: params.tableSource } : {}),
  }
}

function validateIntermediateType(params: {
  params: ResolveDataPathCoreParams
  value: string
  segment: string
  state: TraversalState
}): ResolveDataPathCoreIssue | undefined {
  const typeInfo = params.state.typeInfo
  if (typeInfo.isComposite === true || typeInfo.nextTypes.length > 1) {
    return diagnostic(
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет составной тип`,
      "composite_intermediate"
    )
  }

  if (params.state.tableSource !== undefined) return undefined
  if (typeInfo.kinds.includes("constantSet")) return undefined
  if (typeInfo.kinds.includes("registerRecords")) return undefined
  if (typeInfo.kinds.includes("platformSource")) return undefined
  if (typeInfo.kinds.includes("standardPeriod")) return undefined
  if ((typeInfo.definedTypes?.length ?? 0) > 0) return undefined

  if (typeInfo.kinds.includes("unknown") || typeInfo.kinds.includes("any") || typeInfo.nextTypes.length === 0) {
    if (typeInfo.kinds.includes("unsupportedIntermediate")) {
      return diagnostic(
        "error",
        `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неподдерживаемый тип`,
        "unsupported_intermediate"
      )
    }

    if (typeInfo.kinds.some(isScalarTerminalKind)) {
      return diagnostic(
        "error",
        `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" не является объектом`,
        "scalar_intermediate"
      )
    }

    return diagnostic(
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неизвестный тип`,
      "unknown_type"
    )
  }

  if (typeInfo.kinds.includes("unsupportedIntermediate")) {
    return diagnostic(
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет неподдерживаемый тип`,
      "unsupported_intermediate"
    )
  }

  return undefined
}

function isScalarTerminalKind(kind: string): boolean {
  return (
    kind === "boolean" || kind === "dateTime" || kind === "Picture" || kind === "scalar" || kind === "typeDescription"
  )
}

function ownerError(
  params: ResolveDataPathCoreParams,
  segments: readonly string[],
  replacements: readonly ResolvedDataPathSegmentReplacement[],
  result: Exclude<OwnerMetadataResult, { status: "ok" }>
): ResolveDataPathCoreResult {
  return {
    status: "error",
    value: params.value,
    segments,
    replacements: [...replacements],
    issues: [
      {
        code: "owner_error",
        severity: "error",
        message: "Не удалось прочитать владельца DataPath",
        ownerDiagnostics: result.diagnostics,
      },
    ],
  }
}

function okTarget(params: {
  value: string
  segments: readonly string[]
  state: TraversalState
  replacements?: readonly ResolvedDataPathSegmentReplacement[]
}): ResolveDataPathCoreResult {
  return {
    status: "ok",
    value: params.value,
    segments: params.segments,
    replacements: [...(params.replacements ?? [])],
    issues: [],
    target: {
      value: params.value,
      segments: params.segments,
      typeInfo: params.state.typeInfo,
      source: params.state.source,
    },
  }
}

function okWithoutTarget(params: { value: string; segments: readonly string[] }): ResolveDataPathCoreResult {
  return { status: "ok", value: params.value, segments: params.segments, replacements: [], issues: [] }
}

function warning(
  params: ResolveDataPathCoreParams,
  segments: readonly string[],
  message: string,
  code: ResolveDataPathCoreIssueCode
): ResolveDataPathCoreResult {
  return issueResult(params, segments, diagnostic("warning", message, code))
}

function error(
  params: ResolveDataPathCoreParams,
  message: string,
  code: ResolveDataPathCoreIssueCode = "unknown_field"
): ResolveDataPathCoreResult {
  return issueResult(params, params.value.split("."), diagnostic("error", message, code))
}

function issueResult(
  params: ResolveDataPathCoreParams,
  segments: readonly string[],
  issue: ResolveDataPathCoreIssue,
  replacements: readonly ResolvedDataPathSegmentReplacement[] = []
): ResolveDataPathCoreResult {
  return {
    status: issue.severity,
    value: params.value,
    segments,
    replacements: [...replacements],
    issues: [issue],
  }
}

function recordStandardMemberReplacement(params: {
  replacements: ResolvedDataPathSegmentReplacement[]
  nameMode: DataPathNameMode
  segmentIndex: number
  input: string
  internalName: string
  yamlName: string
}): void {
  const to = params.nameMode === "yaml" ? params.internalName : params.yamlName
  if (params.input === to) return
  params.replacements.push({
    segmentIndex: params.segmentIndex,
    from: params.input,
    to,
    reason: "standardMember",
  })
}

function recordObjectFieldReplacement(params: {
  replacements: ResolvedDataPathSegmentReplacement[]
  nameMode: DataPathNameMode
  segmentIndex: number
  input: string
  field: { name: string; targetName?: string }
}): void {
  if (params.field.targetName === undefined) return
  recordStandardMemberReplacement({
    replacements: params.replacements,
    nameMode: params.nameMode,
    segmentIndex: params.segmentIndex,
    input: params.input,
    internalName: params.field.targetName,
    yamlName: params.field.name,
  })
}

function diagnostic(
  severity: ResolveDataPathCoreIssue["severity"],
  message: string,
  code: ResolveDataPathCoreIssueCode = "unknown_field"
): ResolveDataPathCoreIssue {
  return { code, severity, message }
}

function isStandardMemberError(value: unknown): value is { kind: "error"; message: string } {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === "object" &&
    "kind" in value &&
    value.kind === "error" &&
    "message" in value &&
    typeof value.message === "string"
  )
}
