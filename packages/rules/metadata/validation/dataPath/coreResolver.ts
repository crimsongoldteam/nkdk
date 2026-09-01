import type { Diagnostic } from "../types"
import { getKnownPlatformFormSource, type FormDataPathIndex } from "./formIndex"
import { resolveObjectFieldSegment, standardAttributeAliasToYAML, type ObjectFieldTableSource } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import {
  getMetadataLinkPrefixesByOwnerKind,
  isOpaqueTraversal,
  resolveRegisteredTableColumn,
  resolveRegisterRecordsItem as resolveRegisteredMovementItem,
  resolveTraversalTimeStandardMember,
  resolveTraversalTransition,
  resolveOwnerKindTraversalTransition,
  resolveTypedDataPathMember,
  resolveTypedDynamicDataPathTarget,
  resolveVirtualOwnerField,
  type DataPathTraceMember,
  type ResolvedTypedDataPathMember,
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
  segmentIndex: number
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
  trace?: readonly DataPathTraceMember[]
}

export type ResolvedDataPathTargetSource =
  | { kind: "formAttribute"; name: string; origin?: "working" | "inherited" }
  | { kind: "formElement"; name: string }
  | { kind: "tableColumn"; table: string; name: string }
  | { kind: "objectField"; owner: OwnerTypeRef; name: string }
  | { kind: "constant"; name: string }
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "typedMember"; type: string; name: string }

export interface ResolvedDataPathSegmentReplacement {
  segmentIndex: number
  from: string
  to: string
  reason: "serviceRoot" | "currentRow" | "standardMember"
}

export type ResolveDataPathCoreIssueCode =
  | "current_data_unsupported"
  | "current_data_source_missing"
  | "internal_service_name_in_yaml"
  | "internal_standard_member_in_yaml"
  | "tilde_variant"
  | "platform_source"
  | "table_context_mismatch"
  | "unknown_root"
  | "unknown_column"
  | "unknown_field"
  | "unknown_type"
  | "arbitrary_intermediate"
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
      internalValue?: string
      yamlValue?: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      targets: readonly ResolvedDataPathTarget[]
      replacements: ResolvedDataPathSegmentReplacement[]
      root?: FormDataPathSource
      failedSegmentIndex?: number
      issues: []
    }
  | {
      status: "warning" | "error"
      value: string
      internalValue?: string
      yamlValue?: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      targets: readonly ResolvedDataPathTarget[]
      replacements: ResolvedDataPathSegmentReplacement[]
      root?: FormDataPathSource
      failedSegmentIndex?: number
      issues: ResolveDataPathCoreIssue[]
    }

declare module "@nkdk/runtime" {
  interface FormimportFromYAMLContext {
    readonly resolveDataPath?: (params: {
      value: string
      index: FormDataPathIndex
      ownerCache: OwnerMetadataCache
    }) => ResolveDataPathCoreResult
  }
}

interface TraversalState {
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
  tableSource?: FormDataPathTableSource | ObjectFieldTableSource
  registerRecordsOwner?: OwnerMetadata
  trace?: readonly DataPathTraceMember[]
}

interface TableColumnSource {
  name: string
  targetName?: string
  typeInfo: DataPathTypeInfo
}

export function resolveDataPathCore(params: ResolveDataPathCoreParams): ResolveDataPathCoreResult {
  const result = resolveDataPathCoreWithCurrentData(params, new Set())
  const root = params.index.getRoot(dataPathRootName(params.value))
  return {
    ...withCanonicalValues(resolveTerminalDefinedTypeTarget(params, result), params.nameMode),
    ...(root === undefined ? {} : { root }),
  }
}

export function dataPathRootName(value: string): string {
  return segmentLookupName(value.split(".")[0] ?? "")
}

function resolveTerminalDefinedTypeTarget(
  params: ResolveDataPathCoreParams,
  result: ResolveDataPathCoreResult
): ResolveDataPathCoreResult {
  if (result.target === undefined || (result.target.typeInfo.definedTypes?.length ?? 0) === 0) return result

  const resolved = resolveDefinedTypeInfo({ params, typeInfo: result.target.typeInfo })
  if (resolved.status !== "ok") {
    return ownerError(params, result.segments, result.replacements, resolved, result.segments.length - 1)
  }

  const target = { ...result.target, typeInfo: resolved.typeInfo }
  return {
    ...result,
    target,
    targets: result.targets.map((item) => (item === result.target ? target : item)),
  }
}

function withCanonicalValues(
  result: ResolveDataPathCoreResult,
  nameMode: DataPathNameMode
): ResolveDataPathCoreResult {
  const converted = applySegmentReplacements(result.value, result.replacements)
  return {
    ...result,
    internalValue: nameMode === "yaml" ? converted : result.value,
    yamlValue: nameMode === "internal" ? converted : result.value,
  }
}

function applySegmentReplacements(
  value: string,
  replacements: readonly ResolvedDataPathSegmentReplacement[]
): string {
  if (replacements.length === 0) return value
  const segments = value.split(".")
  for (const replacement of replacements) {
    const segment = segments[replacement.segmentIndex]
    if (segment === undefined) continue
    segments[replacement.segmentIndex] = `${replacement.to}${segment.slice(replacement.from.length)}`
  }
  return segments.join(".")
}

function resolveDataPathCoreWithCurrentData(
  params: ResolveDataPathCoreParams,
  currentDataElements: ReadonlySet<string>
): ResolveDataPathCoreResult {
  const { value } = params
  if (value.trim().length === 0) return okWithoutTarget({ value, segments: [] })

  const segments = value.split(".")
  const replacements: ResolvedDataPathSegmentReplacement[] = []

  if (isTildeVariantPath(value)) {
    return okWithoutTarget({ value, segments })
  }

  const platformSource = getKnownPlatformFormSource(value)
  if (platformSource !== undefined) {
    return okWithoutTarget({ value, segments })
  }

  const tableContextError = validateTableContext(params)
  if (tableContextError !== undefined) return issueResult(params, segments, tableContextError, replacements)

  const currentDataMatch = matchCurrentDataPath(params, segments)
  if (currentDataMatch.kind === "invalidInternalNames") {
    return error(
      params,
      `ПутьКДанным "${value}": в YAML используйте "${currentDataMatch.expectedRoot}" и "${currentDataMatch.expectedCurrentRow}"`,
      "internal_service_name_in_yaml"
    )
  }
  if (currentDataMatch.kind === "match") {
    return resolveCurrentDataPath({ params, segments, currentDataElements, match: currentDataMatch })
  }

  const rootName = segmentLookupName(segments[0] ?? "")
  const root = params.index.getRoot(rootName)
  if (root === undefined) {
    return error(params, `ПутьКДанным "${value}": неизвестный корень "${segments[0] ?? ""}"`, "unknown_field", 0)
  }

  let state: TraversalState = stateFromRoot(root)
  if (segments.length === 1) return okTarget({ value, segments, state, replacements })

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index] ?? ""
    const lookupSegment = segmentLookupName(segment)
    const isLast = index === segments.length - 1

    const intermediateError = validateIntermediateType({ params, value, segment: segments[index - 1] ?? "", state })
    if (intermediateError !== undefined) return issueResult(params, segments, intermediateError, replacements, index)

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
      if (constantResult.status !== "ok") return ownerError(params, segments, replacements, constantResult, index)

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
        return error(params, `ПутьКДанным "${value}": неизвестный регистр движений "${segment}"`, "unknown_field", index)
      }

      const registerResult = resolveMovementItemSegment({
        params,
        value,
        owner: registerRecordsOwner,
        segment: lookupSegment,
        failedSegmentIndex: index,
      })
      if (registerResult.status !== "ok") return registerResult.result

      state = registerResult.state
      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    if (state.typeInfo.kinds.includes("platformSource")) {
      return okWithoutTarget({ value, segments, replacements })
    }

    if (state.typeInfo.kinds.includes("structured")) {
      const structuredType = state.typeInfo.structuredType
      const member = structuredType === undefined
        ? undefined
        : resolveTypedDataPathMember({ type: structuredType, segment: lookupSegment })
      if (member === undefined) {
        return error(params, `ПутьКДанным "${value}": неизвестное свойство "${segment}"`, "unknown_field", index)
      }
      if (params.nameMode === "yaml" && lookupSegment === member.internal && member.internal !== member.yaml) {
        return error(
          params,
          `ПутьКДанным "${value}": в YAML используйте "${member.yaml}" вместо "${segment}"`,
          "internal_standard_member_in_yaml",
          index,
        )
      }

      recordStandardMemberReplacement({
        replacements,
        nameMode: params.nameMode,
        segmentIndex: index,
        input: lookupSegment,
        internalName: member.internal,
        yamlName: member.yaml,
      })
      const typedState = stateFromTypedMember(member, state.trace ?? [], params)
      if (typedState === undefined) {
        return error(
          params,
          `ПутьКДанным "${value}": не удалось разрешить динамическое свойство "${segment}"`,
          "unknown_type",
          index,
        )
      }
      state = typedState

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const definedTypeResult = resolveDefinedTypeInfo({ params, typeInfo: state.typeInfo })
    if (definedTypeResult.status !== "ok") return ownerError(params, segments, replacements, definedTypeResult, index)

    const resolvedTypeInfo = definedTypeResult.typeInfo
    const intermediateErrorAfterDefinedType = validateIntermediateType({
      params,
      value,
      segment: segments[index - 1] ?? "",
      state: { ...state, typeInfo: resolvedTypeInfo },
    })
    if (intermediateErrorAfterDefinedType !== undefined)
      return issueResult(params, segments, intermediateErrorAfterDefinedType, replacements, index)

    const nextType = resolvedTypeInfo.nextTypes[0] as OwnerTypeRef
    if (isOpaqueTraversal({ owner: nextType, segment: lookupSegment })) {
      return okWithoutTarget({ value, segments, replacements })
    }

    const ownerKindTransition = resolveOwnerKindTraversalTransition({
      owner: nextType,
      segment: lookupSegment,
    })
    if (ownerKindTransition?.kind === "warning") {
      return okWithoutTarget({ value, segments, replacements })
    }
    if (ownerKindTransition !== undefined) {
      if (ownerKindTransition.targetName !== undefined) {
        recordTableColumnStandardMemberReplacement({
          replacements,
          nameMode: params.nameMode,
          segmentIndex: index,
          input: lookupSegment,
          internalName: ownerKindTransition.targetName,
          yamlName: ownerKindTransition.sourceName,
        })
      }
      state = {
        typeInfo: ownerKindTransition.typeInfo,
        source: { kind: "objectField", owner: nextType, name: ownerKindTransition.sourceName },
        ...(ownerKindTransition.tableSource !== undefined
          ? { tableSource: ownerKindTransition.tableSource }
          : {}),
      }

      if (isLast) return okTarget({ value, segments, state, replacements })
      continue
    }

    const ownerResult = params.ownerCache.get(nextType)
    if (ownerResult.status !== "ok") return ownerError(params, segments, replacements, ownerResult, index)

    const transition = resolveTraversalTransition({
      owner: ownerResult.owner,
      segment: lookupSegment,
      ownerCache: params.ownerCache,
    })
    if (transition?.kind === "warning") {
      return okWithoutTarget({ value, segments, replacements })
    }
    if (transition !== undefined) {
      if (transition.targetName !== undefined) {
        recordTableColumnStandardMemberReplacement({
          replacements,
          nameMode: params.nameMode,
          segmentIndex: index,
          input: lookupSegment,
          internalName: transition.targetName,
          yamlName: transition.sourceName,
        })
      }
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

    const field = resolveObjectFieldSegment({
      index: ownerResult.owner.fieldIndex,
      segment: lookupSegment,
      nameMode: params.nameMode,
    })
    const standardMember = resolveTraversalTimeStandardMember({
      owner: ownerResult.owner,
      segment: lookupSegment,
      ownerCache: params.ownerCache,
    })
    if (isStandardMemberError(standardMember)) {
      return error(params, `ПутьКДанным "${value}": ${standardMember.message}`, "unknown_field", index)
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
      return error(params, `ПутьКДанным "${value}": неизвестный реквизит "${segment}"`, "unknown_field", index)
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

function resolveCurrentDataPath(params: {
  params: ResolveDataPathCoreParams
  segments: readonly string[]
  currentDataElements: ReadonlySet<string>
  match: CurrentDataPathMatch
}): ResolveDataPathCoreResult {
  const elementName = params.segments[1] ?? ""
  const tableDataPath = params.match.dataPath
  if (tableDataPath === undefined) {
    return error(
      params.params,
      `ПутьКДанным "${params.params.value}": у табличного элемента "${elementName}" не указан источник данных`,
      "current_data_source_missing"
    )
  }
  if (params.currentDataElements.has(elementName)) {
    return error(
      params.params,
      `ПутьКДанным "${params.params.value}": обнаружен цикл CurrentData для элемента "${elementName}"`,
      "current_data_unsupported"
    )
  }

  const tableDataPathSegments = tableDataPath.split(".")
  const expandedSegments = [...tableDataPathSegments, ...params.segments.slice(3)]
  const expandedValue = expandedSegments.join(".")
  const nextElements = new Set(params.currentDataElements)
  nextElements.add(elementName)
  const result = resolveDataPathCoreWithCurrentData(
    { ...params.params, value: expandedValue, tableContext: undefined },
    nextElements
  )

  return rebaseCurrentDataResult({
    result,
    originalValue: params.params.value,
    originalSegments: params.segments,
    expandedValue,
    tableDataPathSegmentCount: tableDataPathSegments.length,
    serviceReplacements: params.match.replacements,
  })
}

function rebaseCurrentDataResult(params: {
  result: ResolveDataPathCoreResult
  originalValue: string
  originalSegments: readonly string[]
  expandedValue: string
  tableDataPathSegmentCount: number
  serviceReplacements: readonly ResolvedDataPathSegmentReplacement[]
}): ResolveDataPathCoreResult {
  const replacements = [...params.serviceReplacements, ...params.result.replacements
    .filter(({ segmentIndex }) => segmentIndex >= params.tableDataPathSegmentCount)
    .map((replacement) => ({
      ...replacement,
      segmentIndex: 3 + replacement.segmentIndex - params.tableDataPathSegmentCount,
    }))]
  const target =
    params.result.target === undefined
      ? undefined
      : {
          ...params.result.target,
          value: params.originalValue,
          segments: params.originalSegments,
          segmentIndex: params.originalSegments.length - 1,
        }
  const elementTarget: ResolvedDataPathTarget = {
    value: params.originalValue,
    segments: params.originalSegments,
    segmentIndex: 1,
    typeInfo: { kinds: ["tableSource"], nextTypes: [], sourceText: "TabularFormElement" },
    source: { kind: "formElement", name: params.originalSegments[1] ?? "" },
    trace: [],
  }
  const common = {
    value: params.originalValue,
    segments: params.originalSegments,
    replacements,
    targets: [elementTarget, ...(target === undefined ? [] : [target])],
    ...(target === undefined ? {} : { target }),
  }
  if (params.result.status === "ok") {
    return { ...params.result, ...common, issues: [] }
  }
  return {
    ...params.result,
    ...common,
    issues: params.result.issues.map((issue) => ({
      ...issue,
      message: issue.message.replaceAll(`"${params.expandedValue}"`, `"${params.originalValue}"`),
    })),
  }
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
    hasColumns:
      table.kind === "Registered" || table.kind === "ValueList" || table.kind === "GanttChart" ||
      table.kind === "RegisterRecordSet",
  }
}

function resolveConstantSetItem(params: {
  params: ResolveDataPathCoreParams
  segment: string
}): { status: "ok"; typeInfo: DataPathTypeInfo } | Exclude<OwnerMetadataResult, { status: "ok" }> {
  const ownerResult = params.params.ownerCache.get({ kind: "Константа", name: params.segment })
  if (ownerResult.status !== "ok") return ownerResult

  const type = constantType(ownerResult.owner.facts)
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

    typeInfos.push(typeDescriptionToDataPathTypeInfo(definedTypeType(ownerResult.owner.facts)))
  }

  return { status: "ok", typeInfo: mergeResolvedDefinedTypeInfo(params.typeInfo, typeInfos) }
}

function mergeResolvedDefinedTypeInfo(
  source: DataPathTypeInfo,
  resolvedItems: readonly DataPathTypeInfo[]
): DataPathTypeInfo {
  const kinds = [...source.kinds]
  const nextTypes = [...source.nextTypes]
  const terminalTypes = [...(source.terminalTypes ?? [])]
  const sourceTexts = source.sourceText !== undefined ? [source.sourceText] : []
  let table = source.table

  for (const item of resolvedItems) {
    for (const kind of item.kinds) {
      if (!kinds.includes(kind)) kinds.push(kind)
    }
    for (const nextType of item.nextTypes) {
      if (!nextTypes.some((existing) => ownerRefEquals(existing, nextType))) nextTypes.push(nextType)
    }
    for (const terminalType of item.terminalTypes ?? []) {
      if (!terminalTypes.includes(terminalType)) terminalTypes.push(terminalType)
    }
    if (table === undefined && item.table !== undefined) table = item.table
    if (item.sourceText !== undefined) sourceTexts.push(item.sourceText)
  }

  return {
    kinds,
    nextTypes,
    ...(terminalTypes.length > 0 ? { terminalTypes } : {}),
    ...(source.definedTypes !== undefined ? { definedTypes: source.definedTypes } : {}),
    ...(table !== undefined ? { table } : {}),
    ...(terminalTypes.length > 1 ? { isComposite: true } : {}),
    ...(sourceTexts.length > 0 ? { sourceText: sourceTexts.join(" -> ") } : {}),
  }
}

function definedTypeType(facts: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof facts !== "object" || facts === null || !("type" in facts)) return undefined
  return facts.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function resolveCommonAttributeField(params: {
  params: ResolveDataPathCoreParams
  owner: OwnerMetadata
  segment: string
}): TableColumnSource | undefined {
  const ownerResult = params.params.ownerCache.get({ kind: "ОбщийРеквизит", name: params.segment })
  if (ownerResult.status !== "ok") return undefined
  if (!commonAttributeAppliesToOwner(ownerResult.owner.facts, params.owner.ref)) return undefined

  return {
    name: params.segment,
    typeInfo: typeDescriptionToDataPathTypeInfo(commonAttributeType(ownerResult.owner.facts)),
  }
}

function commonAttributeType(facts: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  return objectValue(facts, "type") as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function commonAttributeAppliesToOwner(facts: unknown, ownerRef: OwnerTypeRef): boolean {
  const ownerFacts = objectValue(facts, "commonAttributeOwnerLinks")
  if (!Array.isArray(ownerFacts)) return false

  const ownerLinks = ownerMetadataLinks(ownerRef)
  if (ownerLinks.length === 0) return false

  return ownerFacts.some((metadata) => typeof metadata === "string" && ownerLinks.includes(metadata))
}

function objectValue(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined
  return (value as Record<string, unknown>)[key]
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
  failedSegmentIndex: number
}): { status: "ok"; state: TraversalState } | { status: "error"; result: ResolveDataPathCoreResult } {
  const registered = resolveRegisteredMovementItem({ owner: params.owner, segment: params.segment })
  if (registered === undefined) {
    return {
      status: "error",
      result: error(
        params.params,
        `ПутьКДанным "${params.value}": неизвестный регистр движений "${params.segment}"`,
        "unknown_field",
        params.failedSegmentIndex,
      ),
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

function constantType(facts: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof facts !== "object" || facts === null || !("type" in facts)) return undefined
  return facts.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
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

interface CurrentDataPathMatch {
  readonly kind: "match"
  readonly dataPath?: string
  readonly replacements: readonly ResolvedDataPathSegmentReplacement[]
}

function matchCurrentDataPath(
  params: ResolveDataPathCoreParams,
  segments: readonly string[]
): CurrentDataPathMatch | {
  readonly kind: "invalidInternalNames"
  readonly expectedRoot: string
  readonly expectedCurrentRow: string
} | { readonly kind: "none" } {
  const dialect = params.index.dialect
  if (dialect === undefined || segments.length < 4) return { kind: "none" }

  const elementName = segments[1] ?? ""
  const declaration = params.index.tabularElementsByName.get(elementName)
  if (declaration === undefined) return { kind: "none" }

  const inputRoot = params.nameMode === "yaml" ? dialect.serviceRoot.yaml : dialect.serviceRoot.internal
  const inputCurrentRow = params.nameMode === "yaml" ? dialect.currentRow.yaml : dialect.currentRow.internal
  if (segments[0] === inputRoot && segments[2] === inputCurrentRow) {
    const outputRoot = params.nameMode === "yaml" ? dialect.serviceRoot.internal : dialect.serviceRoot.yaml
    const outputCurrentRow = params.nameMode === "yaml" ? dialect.currentRow.internal : dialect.currentRow.yaml
    return {
      kind: "match",
      dataPath: declaration.dataPath,
      replacements: [
        { segmentIndex: 0, from: inputRoot, to: outputRoot, reason: "serviceRoot" },
        { segmentIndex: 2, from: inputCurrentRow, to: outputCurrentRow, reason: "currentRow" },
      ],
    }
  }

  if (
    params.nameMode === "yaml" &&
    segments[0] === dialect.serviceRoot.internal &&
    segments[2] === dialect.currentRow.internal
  ) {
    return {
      kind: "invalidInternalNames",
      expectedRoot: dialect.serviceRoot.yaml,
      expectedCurrentRow: dialect.currentRow.yaml,
    }
  }
  return { kind: "none" }
}

function isTildeVariantPath(value: string): boolean {
  return value.includes("~")
}

function stateFromRoot(root: FormDataPathSource): TraversalState {
  return {
    typeInfo: root.typeInfo,
    source: {
      kind: "formAttribute",
      name: root.name,
      ...(root.origin === undefined ? {} : { origin: root.origin }),
    },
    ...(root.tableSource !== undefined ? { tableSource: root.tableSource } : {}),
    trace: [],
  }
}

function resolveTableColumn(params: {
  params: ResolveDataPathCoreParams
  value: string
  segments: readonly string[]
  replacements: ResolvedDataPathSegmentReplacement[]
  segmentIndex: number
  state: TraversalState
  segment: string
  isLast: boolean
}): { status: "continue"; state: TraversalState } | { status: "done"; result: ResolveDataPathCoreResult } {
  const { tableSource } = params.state
  if (tableSource === undefined) return { status: "continue", state: params.state }

  const lookupSegment = segmentLookupName(params.segment)
  const registeredColumnResult = resolveRegisteredColumn({
    params: params.params,
    tableSource,
    segment: lookupSegment,
    replacements: params.replacements,
    failedSegmentIndex: params.segmentIndex,
  })
  if (registeredColumnResult.status === "error") {
    return { status: "done", result: registeredColumnResult.result }
  }

  if (registeredColumnResult.typedMember !== undefined) {
    if (
      params.params.nameMode === "yaml" &&
      lookupSegment === registeredColumnResult.typedMember.internal &&
      registeredColumnResult.typedMember.internal !== registeredColumnResult.typedMember.yaml
    ) {
      return {
        status: "done",
        result: error(
          params.params,
          `ПутьКДанным "${params.value}": в YAML используйте "${registeredColumnResult.typedMember.yaml}" вместо "${params.segment}"`,
          "internal_standard_member_in_yaml",
          params.segmentIndex,
        ),
      }
    }
    recordStandardMemberReplacement({
      replacements: params.replacements,
      nameMode: params.params.nameMode,
      segmentIndex: params.segmentIndex,
      input: lookupSegment,
      internalName: registeredColumnResult.typedMember.internal,
      yamlName: registeredColumnResult.typedMember.yaml,
    })
    const state = stateFromTypedMember(
      registeredColumnResult.typedMember,
      params.state.trace ?? [],
      params.params,
    )
    if (state === undefined) {
      return {
        status: "done",
        result: error(
          params.params,
          `ПутьКДанным "${params.value}": не удалось разрешить динамическое свойство "${params.segment}"`,
          "unknown_type",
          params.segmentIndex,
        ),
      }
    }
    if (params.isLast) {
      return {
        status: "done",
        result: okTarget({ value: params.value, segments: params.segments, state, replacements: params.replacements }),
      }
    }
    return { status: "continue", state }
  }

  const tablePath = params.segments.slice(0, params.segmentIndex).join(".")
  const normalizedTablePath = normalizeIndexedPath(tablePath)
  const resolvedColumn =
    resolveTableColumnSource({
      columns: tableSource.columns,
      segment: lookupSegment,
      nameMode: params.params.nameMode,
    }) ??
    resolveTableColumnSource({
      columns: params.params.index.additionalColumnsByTablePath.get(normalizedTablePath),
      segment: lookupSegment,
      nameMode: params.params.nameMode,
    }) ??
    (registeredColumnResult.column !== undefined
      ? { column: registeredColumnResult.column, replacement: tableColumnReplacement(registeredColumnResult.column) }
      : undefined)
  const column = resolvedColumn?.column
  if (column === undefined) {
    if (tableSource.table.kind === "DynamicList") {
      return {
        status: "done",
        result: okWithoutTarget({ value: params.value, segments: params.segments, replacements: params.replacements }),
      }
    }
    if (tableSource.hasColumns) {
      return {
        status: "done",
        result: error(
          params.params,
          `ПутьКДанным "${params.value}": неизвестная колонка "${params.segment}"`,
          "unknown_column",
          params.segmentIndex,
        ),
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
  if (resolvedColumn?.replacement !== undefined) {
    recordTableColumnStandardMemberReplacement({
      replacements: params.replacements,
      nameMode: params.params.nameMode,
      segmentIndex: params.segmentIndex,
      input: lookupSegment,
      internalName: resolvedColumn.replacement.internalName,
      yamlName: resolvedColumn.replacement.yamlName,
    })
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
    trace: params.state.trace,
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
      table.kind === "Registered" ||
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
  failedSegmentIndex: number
}): {
  status: "ok"
  column?: TableColumnSource
  typedMember?: ResolvedTypedDataPathMember
} | { status: "error"; result: ResolveDataPathCoreResult } {
  const ownerResult =
    params.tableSource.table.kind === "RegisterRecordSet"
      ? params.params.ownerCache.get(params.tableSource.table.owner)
      : undefined
  if (ownerResult?.status !== undefined && ownerResult.status !== "ok")
    return {
      status: "error",
      result: ownerError(
        params.params,
        params.params.value.split("."),
        params.replacements,
        ownerResult,
        params.failedSegmentIndex,
      ),
    }

  const field =
    ownerResult?.status === "ok"
      ? resolveObjectFieldSegment({
          index: ownerResult.owner.fieldIndex,
          segment: params.segment,
          nameMode: params.params.nameMode,
        })
      : undefined
  const column = resolveRegisteredTableColumn({
    table: params.tableSource.table,
    segment: params.segment,
    index: params.params.index,
    ...(ownerResult?.status === "ok" ? { owner: ownerResult.owner } : {}),
    ...(field !== undefined ? { field } : {}),
  })
  const typedMember = column === undefined && params.tableSource.table.kind === "Registered"
    ? resolveTypedDataPathMember({ type: params.tableSource.table.type, segment: params.segment })
    : undefined
  if (
    params.params.nameMode === "yaml" &&
    column?.targetName === params.segment &&
    column.name !== params.segment
  ) {
    return {
      status: "error",
      result: error(
        params.params,
        `ПутьКДанным "${params.params.value}": в YAML используйте "${column.name}" вместо "${params.segment}"`,
        "internal_standard_member_in_yaml",
        params.failedSegmentIndex,
      ),
    }
  }
  return {
    status: "ok",
    ...(column !== undefined ? { column } : {}),
    ...(typedMember !== undefined ? { typedMember } : {}),
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
  nameMode: DataPathNameMode
}): { column: TableColumnSource; replacement?: { internalName: string; yamlName: string } } | undefined {
  if (params.columns === undefined) return undefined

  const direct = params.columns.get(params.segment)
  if (direct !== undefined) {
    if (params.nameMode === "yaml" && direct.targetName === params.segment && direct.name !== params.segment)
      return undefined
    return { column: direct, replacement: tableColumnReplacement(direct) }
  }
  if (params.nameMode === "yaml") return undefined

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias === undefined) return undefined
  const column = params.columns.get(alias)
  return column === undefined ? undefined : { column, replacement: { internalName: params.segment, yamlName: alias } }
}

function tableColumnReplacement(column: TableColumnSource): { internalName: string; yamlName: string } | undefined {
  return column.targetName === undefined ? undefined : { internalName: column.targetName, yamlName: column.name }
}

function recordTableColumnStandardMemberReplacement(params: {
  replacements: ResolvedDataPathSegmentReplacement[]
  nameMode: DataPathNameMode
  segmentIndex: number
  input: string
  internalName: string
  yamlName: string
}): void {
  const expectedInput = params.nameMode === "yaml" ? params.yamlName : params.internalName
  if (params.input !== expectedInput) return
  recordStandardMemberReplacement(params)
}

function stateFromTableColumn(params: {
  tableName: string
  column: TableColumnSource
  tableSource?: FormDataPathTableSource
  trace?: readonly DataPathTraceMember[]
}): TraversalState {
  return {
    typeInfo: params.column.typeInfo,
    source: { kind: "tableColumn", table: params.tableName, name: params.column.name },
    ...(params.tableSource !== undefined ? { tableSource: params.tableSource } : {}),
    ...(params.trace !== undefined ? { trace: params.trace } : {}),
  }
}

function stateFromTypedMember(
  member: ResolvedTypedDataPathMember,
  trace: readonly DataPathTraceMember[],
  params: ResolveDataPathCoreParams,
): TraversalState | undefined {
  const nextTrace = [...trace, {
    type: member.declaringType,
    internal: member.internal,
    yaml: member.yaml,
  }]
  const source = { kind: "typedMember" as const, type: member.declaringType, name: member.yaml }

  const target = resolveTypedDynamicDataPathTarget({ member, index: params.index, ownerCache: params.ownerCache })
  if (target === undefined) return undefined

  if (target.kind === "structured") {
    return {
      typeInfo: {
        kinds: ["structured"],
        nextTypes: [],
        structuredType: target.type,
        sourceText: target.type,
      },
      source,
      trace: nextTrace,
    }
  }
  if (target.kind === "collection") {
    const table = { kind: "Registered" as const, type: target.itemType }
    return {
      typeInfo: {
        kinds: ["tableSource"],
        nextTypes: [],
        terminalTypes: [target.itemType],
        table,
        sourceText: target.itemType,
      },
      source,
      tableSource: { table, columns: new Map(), hasColumns: true },
      trace: nextTrace,
    }
  }

  if (target.kind === "metadataObject") {
    const sourceText = [target.owner.kind, target.owner.name].filter(Boolean).join(".")
    return {
      typeInfo: { kinds: ["object"], nextTypes: [target.owner], sourceText },
      source,
      trace: nextTrace,
    }
  }

  const terminalTypes = [...target.terminalTypes]
  return {
    typeInfo: {
      kinds: terminalDataPathKinds(terminalTypes),
      nextTypes: [],
      terminalTypes,
      ...(terminalTypes.length > 1 ? { isComposite: true } : {}),
      sourceText: terminalTypes.join(" | "),
    },
    source,
    trace: nextTrace,
  }
}

function terminalDataPathKinds(terminalTypes: readonly string[]): DataPathTypeInfo["kinds"] {
  const kinds = terminalTypes.map((type) => {
    if (type === "boolean") return "boolean" as const
    if (type === "dateTime") return "dateTime" as const
    if (type === "Picture") return "Picture" as const
    if (type === "TypeDescription") return "typeDescription" as const
    return "scalar" as const
  })
  return [...new Set(kinds)]
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
  if (typeInfo.kinds.includes("structured")) return undefined
  if ((typeInfo.definedTypes?.length ?? 0) > 0) return undefined

  if (typeInfo.kinds.includes("any")) {
    return diagnostic(
      "error",
      `ПутьКДанным "${params.value}": промежуточный реквизит "${params.segment}" имеет произвольный тип`,
      "arbitrary_intermediate"
    )
  }

  if (typeInfo.kinds.includes("unknown") || typeInfo.nextTypes.length === 0) {
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
  result: Exclude<OwnerMetadataResult, { status: "ok" }>,
  failedSegmentIndex?: number,
): ResolveDataPathCoreResult {
  return {
    status: "error",
    value: params.value,
    segments,
    replacements: [...replacements],
    ...(failedSegmentIndex === undefined ? {} : { failedSegmentIndex }),
    targets: [],
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
  const target: ResolvedDataPathTarget = {
    value: params.value,
    segments: params.segments,
    segmentIndex: params.segments.length - 1,
    typeInfo: params.state.typeInfo,
    source: params.state.source,
    trace: params.state.trace ?? [],
  }
  return {
    status: "ok",
    value: params.value,
    segments: params.segments,
    replacements: [...(params.replacements ?? [])],
    targets: [target],
    issues: [],
    target,
  }
}

function okWithoutTarget(params: {
  value: string
  segments: readonly string[]
  replacements?: readonly ResolvedDataPathSegmentReplacement[]
}): ResolveDataPathCoreResult {
  return {
    status: "ok",
    value: params.value,
    segments: params.segments,
    replacements: [...(params.replacements ?? [])],
    targets: [],
    issues: [],
  }
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
  code: ResolveDataPathCoreIssueCode = "unknown_field",
  failedSegmentIndex?: number,
): ResolveDataPathCoreResult {
  return issueResult(params, params.value.split("."), diagnostic("error", message, code), [], failedSegmentIndex)
}

function issueResult(
  params: ResolveDataPathCoreParams,
  segments: readonly string[],
  issue: ResolveDataPathCoreIssue,
  replacements: readonly ResolvedDataPathSegmentReplacement[] = [],
  failedSegmentIndex?: number,
): ResolveDataPathCoreResult {
  return {
    status: issue.severity,
    value: params.value,
    segments,
    replacements: [...replacements],
    ...(failedSegmentIndex === undefined ? {} : { failedSegmentIndex }),
    targets: [],
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
