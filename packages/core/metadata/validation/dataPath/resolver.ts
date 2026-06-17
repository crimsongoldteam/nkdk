import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath, type YamlPath } from "../yamlLocations"
import { getKnownPlatformFormSource, type FormDataPathIndex } from "./formIndex"
import {
  resolveObjectFieldSegment,
  standardAttributeAliasToYAML,
  type ObjectFieldTableSource,
} from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
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
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "standardPeriodField"; name: string }

export type ResolveDataPathResult =
  | { status: "ok"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "warning"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
  | { status: "error"; diagnostics: Diagnostic[] }

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

  const rootName = segmentLookupName(segments[0] ?? "")
  const root = params.index.getRoot(rootName)
  if (root === undefined) {
    return error(params, `ПутьКДанным "${value}": неизвестный корень "${segments[0] ?? ""}"`)
  }

  let state: TraversalState = stateFromRoot(root)
  if (segments.length === 1) return okTarget({ value, segments, state })

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index] ?? ""
    const lookupSegment = segmentLookupName(segment)
    const isLast = index === segments.length - 1

    const intermediateError = validateIntermediateType({ params, value, segment: segments[index - 1] ?? "", state })
    if (intermediateError !== undefined) return { status: "error", diagnostics: [intermediateError] }

    if (state.tableSource !== undefined) {
      const tableResult = resolveTableColumn({ params, value, segments, segmentIndex: index, state, segment, isLast })
      if (tableResult.status !== "continue") return tableResult.result
      state = tableResult.state
      continue
    }

    if (state.typeInfo.kinds.includes("constantSet")) {
      const constantResult = resolveConstantSetItem({ params, segment: lookupSegment })
      if (constantResult.status !== "ok") return ownerError(constantResult)

      state = {
        typeInfo: constantResult.typeInfo,
        source: { kind: "constant", name: lookupSegment },
      }

      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    if (state.typeInfo.kinds.includes("registerRecords")) {
      const registerRecordsOwner = state.registerRecordsOwner
      if (registerRecordsOwner === undefined) {
        return error(params, `ПутьКДанным "${value}": неизвестный регистр движений "${segment}"`)
      }

      const registerResult = resolveRegisterRecordsItem({
        params,
        value,
        owner: registerRecordsOwner,
        segment: lookupSegment,
      })
      if (registerResult.status !== "ok") return registerResult.result

      state = registerResult.state
      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    if (state.typeInfo.kinds.includes("platformSource")) {
      return warning(params, `ПутьКДанным "${value}": платформенный источник пока не проверяется`)
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

      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    const ownerResult = params.ownerCache.get(state.typeInfo.nextTypes[0] as OwnerTypeRef)
    if (ownerResult.status !== "ok") return ownerError(ownerResult)

    if (isRegisterRecordsSegment(lookupSegment) && isDocumentOwner(ownerResult.owner.ref)) {
      state = {
        typeInfo: { kinds: ["registerRecords"], nextTypes: [], sourceText: lookupSegment },
        source: { kind: "registerRecords", owner: ownerResult.owner.ref, name: lookupSegment },
        registerRecordsOwner: ownerResult.owner,
      }

      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    if (isSettingsComposerSegment(lookupSegment) && isReportOwner(ownerResult.owner.ref)) {
      return warning(params, `ПутьКДанным "${value}": платформенный источник пока не проверяется`)
    }

    const field = resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment: lookupSegment })
    const virtualField = virtualOwnerField({
      owner: ownerResult.owner,
      segment: lookupSegment,
    })
    if (virtualField !== undefined) {
      state = {
        typeInfo: virtualField.typeInfo,
        source: { kind: "objectField", owner: ownerResult.owner.ref, name: virtualField.name },
        tableSource: virtualField.tableSource,
      }

      if (isLast) return okTarget({ value, segments, state })
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

      if (isLast) return okTarget({ value, segments, state })
      continue
    }

    if (field === undefined) {
      return error(params, `ПутьКДанным "${value}": неизвестный реквизит "${segment}"`)
    }

    const tableSource = tableSourceFromObjectField(field)
    state = {
      typeInfo: field.typeInfo,
      source: { kind: "objectField", owner: ownerResult.owner.ref, name: field.name },
      ...(tableSource !== undefined ? { tableSource } : {}),
    }

    if (isLast) return okTarget({ value, segments, state })
  }

  return okTarget({ value, segments, state })
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
      table.kind === "ValueList" ||
      table.kind === "GanttChart" ||
      table.kind === "RegisterRecordSet",
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

function resolveRegisterRecordsItem(params: {
  params: ResolveDataPathParams
  value: string
  owner: OwnerMetadata
  segment: string
}): { status: "ok"; state: TraversalState } | { status: "error"; result: ResolveDataPathResult } {
  const registerRef = documentRegisterRecordRefs(params.owner).find((ref) => ref.name === params.segment)
  if (registerRef === undefined) {
    return {
      status: "error",
      result: error(params.params, `ПутьКДанным "${params.value}": неизвестный регистр движений "${params.segment}"`),
    }
  }

  const table = { kind: "RegisterRecordSet" as const, owner: registerRef }
  return {
    status: "ok",
    state: {
      typeInfo: {
        kinds: ["tableSource"],
        nextTypes: [],
        table,
        sourceText: `RegisterRecords.${params.segment}`,
      },
      source: { kind: "registerRecordSet", owner: registerRef, name: params.segment },
      tableSource: {
        table,
        columns: new Map(),
        hasColumns: true,
      },
    },
  }
}

function documentRegisterRecordRefs(owner: OwnerMetadata): OwnerTypeRef[] {
  const model = owner.model as Record<string, unknown>
  const value = model.registerRecords
  if (!Array.isArray(value)) return []

  return value
    .map(registerRecordRefFromLink)
    .filter((ref): ref is OwnerTypeRef => ref !== undefined)
}

function registerRecordRefFromLink(value: unknown): OwnerTypeRef | undefined {
  if (typeof value !== "string") return undefined

  const dotIndex = value.indexOf(".")
  if (dotIndex === -1) return undefined

  const kind = registerKindByLinkPrefix[value.substring(0, dotIndex)]
  if (kind === undefined) return undefined

  const name = value.substring(dotIndex + 1)
  if (name.length === 0) return undefined

  return { kind, name }
}

const registerKindByLinkPrefix: Readonly<Record<string, OwnerTypeRef["kind"] | undefined>> = {
  InformationRegister: "РегистрСведений",
  AccumulationRegister: "РегистрНакопления",
  AccountingRegister: "РегистрБухгалтерии",
  CalculationRegister: "РегистрРасчета",
  РегистрСведений: "РегистрСведений",
  РегистрНакопления: "РегистрНакопления",
  РегистрБухгалтерии: "РегистрБухгалтерии",
  РегистрРасчета: "РегистрРасчета",
}

function constantType(model: unknown): Parameters<typeof typeDescriptionToDataPathTypeInfo>[0] {
  if (typeof model !== "object" || model === null || !("type" in model)) return undefined
  return model.type as Parameters<typeof typeDescriptionToDataPathTypeInfo>[0]
}

function validateTableContext(params: ResolveDataPathParams): Diagnostic | undefined {
  const dataPath = params.tableContext?.dataPath
  if (dataPath === undefined) return undefined

  const normalizedValue = normalizeIndexedPath(params.value)
  const normalizedDataPath = normalizeIndexedPath(dataPath)
  const prefix = `${normalizedDataPath}.`
  if (normalizedValue.startsWith(prefix)) return undefined

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
  segmentIndex: number
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

  const tablePath = params.segments.slice(0, params.segmentIndex).join(".")
  const normalizedTablePath = normalizeIndexedPath(tablePath)
  const lookupSegment = segmentLookupName(params.segment)
  const registerRecordSetColumnResult = resolveRegisterRecordSetColumn({
    params: params.params,
    tableSource,
    segment: lookupSegment,
  })
  if (registerRecordSetColumnResult.status === "error") {
    return { status: "done", result: registerRecordSetColumnResult.result }
  }

  const column =
    resolveTableColumnSource({ columns: tableSource.columns, segment: lookupSegment }) ??
    resolveTableColumnSource({
      columns: params.params.index.additionalColumnsByTablePath.get(normalizedTablePath),
      segment: lookupSegment,
    }) ??
    registerRecordSetColumnResult.column ??
    virtualTableColumn({ tableSource, segment: lookupSegment })
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
  if (params.isLast) return { status: "done", result: okTarget({ value: params.value, segments: params.segments, state }) }

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
    hasColumns: columns.size > 0 || table.kind === "ValueList" || table.kind === "GanttChart" || table.kind === "RegisterRecordSet",
  }
}

function virtualOwnerField(params: {
  owner: OwnerMetadata
  segment: string
}): { name: string; typeInfo: DataPathTypeInfo; tableSource?: FormDataPathTableSource } | undefined {
  return chartOfAccountsVirtualOwnerField(params) ?? chartOfCalculationTypesVirtualOwnerField(params)
}

function chartOfAccountsVirtualOwnerField(params: {
  owner: OwnerMetadata
  segment: string
}): { name: string; typeInfo: DataPathTypeInfo; tableSource?: FormDataPathTableSource } | undefined {
  if (!isChartOfAccountsOwner(params.owner.ref)) return undefined

  if (params.segment === "ExtDimensionTypes") return chartOfAccountsExtDimensionTypesField(params)

  const field = chartOfAccountsTerminalVirtualField(params.owner, params.segment)
  if (field === undefined) return undefined

  return {
    name: params.segment,
    typeInfo: field.typeInfo,
  }
}

function chartOfAccountsExtDimensionTypesField(params: {
  owner: OwnerMetadata
  segment: string
}): { name: string; typeInfo: DataPathTypeInfo; tableSource: FormDataPathTableSource } {
  const table = { kind: "ValueTable" as const }
  return {
    name: params.segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: "ChartOfAccounts.ExtDimensionTypes",
    },
    tableSource: {
      table,
      columns: chartOfAccountsExtDimensionTypesColumns(params.owner),
      hasColumns: true,
    },
  }
}

function chartOfAccountsTerminalVirtualField(owner: OwnerMetadata, segment: string): TableColumnSource | undefined {
  if (segment === "Order" || segment === "Type") {
    return {
      name: segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: `ChartOfAccounts.${segment}` },
    }
  }

  if (segment === "OffBalance") {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfAccounts.OffBalance" },
    }
  }

  if (chartOfAccountsAccountingFlagNames(owner.model).includes(segment)) {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfAccounts.AccountingFlag" },
    }
  }

  return undefined
}

function chartOfAccountsExtDimensionTypesColumns(owner: OwnerMetadata): FormDataPathTableSource["columns"] {
  const columns = new Map<string, TableColumnSource>()
  columns.set("ExtDimensionType", {
    name: "ExtDimensionType",
    typeInfo: chartOfAccountsExtDimensionTypeInfo(owner.model),
  })

  for (const name of ["TurnoversOnly", "ТолькоСальдо"]) {
    columns.set(name, {
      name,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: `ChartOfAccounts.ExtDimensionTypes.${name}` },
    })
  }

  for (const name of chartOfAccountsExtDimensionAccountingFlagNames(owner.model)) {
    columns.set(name, {
      name,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfAccounts.ExtDimensionAccountingFlag" },
    })
  }

  return columns
}

function chartOfAccountsExtDimensionTypeInfo(model: unknown): DataPathTypeInfo {
  const value = modelObjectValue(model, "extDimensionTypes")
  if (typeof value !== "string") return { kinds: ["unknown"], nextTypes: [], sourceText: "ChartOfAccounts.ExtDimensionTypes.ExtDimensionType" }

  const prefix = "ChartOfCharacteristicTypes."
  if (!value.startsWith(prefix)) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  const name = value.substring(prefix.length)
  if (name.length === 0) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  return {
    kinds: ["object"],
    nextTypes: [{ kind: "ПланВидовХарактеристик", name }],
    sourceText: value,
  }
}

function chartOfAccountsExtDimensionAccountingFlagNames(model: unknown): string[] {
  const flags = modelObjectValue(model, "extDimensionAccountingFlags")
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => modelObjectValue(flag, "name"))
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function chartOfAccountsAccountingFlagNames(model: unknown): string[] {
  const flags = modelObjectValue(model, "accountingFlags")
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => modelObjectValue(flag, "name"))
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function chartOfCalculationTypesVirtualOwnerField(params: {
  owner: OwnerMetadata
  segment: string
}): { name: string; typeInfo: DataPathTypeInfo; tableSource?: FormDataPathTableSource } | undefined {
  if (!isChartOfCalculationTypesOwner(params.owner.ref)) return undefined

  if (params.segment === "ActionPeriodIsBasic") {
    return {
      name: params.segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfCalculationTypes.ActionPeriodIsBasic" },
    }
  }

  if (!isCalculationTypesVirtualTableName(params.segment)) return undefined

  const table = { kind: "ValueTable" as const }
  return {
    name: params.segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `ChartOfCalculationTypes.${params.segment}`,
    },
    tableSource: {
      table,
      columns: chartOfCalculationTypesVirtualTableColumns(params.owner),
      hasColumns: true,
    },
  }
}

function chartOfCalculationTypesVirtualTableColumns(owner: OwnerMetadata): FormDataPathTableSource["columns"] {
  const columns = new Map<string, TableColumnSource>()
  columns.set("CalculationType", {
    name: "CalculationType",
    typeInfo: {
      kinds: ["object"],
      nextTypes: [owner.ref],
      sourceText: `ChartOfCalculationTypes.${owner.ref.name}`,
    },
  })
  return columns
}

function isCalculationTypesVirtualTableName(segment: string): boolean {
  return segment === "BaseCalculationTypes" ||
    segment === "LeadingCalculationTypes" ||
    segment === "DisplacingCalculationTypes"
}

function modelObjectValue(model: unknown, key: string): unknown {
  if (typeof model !== "object" || model === null) return undefined
  return (model as Record<string, unknown>)[key]
}

function resolveRegisterRecordSetColumn(params: {
  params: ResolveDataPathParams
  tableSource: FormDataPathTableSource | ObjectFieldTableSource
  segment: string
}): { status: "ok"; column?: TableColumnSource } | { status: "error"; result: ResolveDataPathResult } {
  if (params.tableSource.table.kind !== "RegisterRecordSet") return { status: "ok" }

  const ownerResult = params.params.ownerCache.get(params.tableSource.table.owner)
  if (ownerResult.status !== "ok") return { status: "error", result: ownerError(ownerResult) }

  const field = resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment: params.segment })
  const virtualStandardColumn = registerRecordSetStandardColumn(params.segment, field?.name)
  const accountingVirtualColumn = accountingRegisterRecordSetColumn({
    owner: ownerResult.owner,
    segment: params.segment,
  })
  if (field === undefined) {
    if (virtualStandardColumn !== undefined) return { status: "ok", column: virtualStandardColumn }
    if (accountingVirtualColumn !== undefined) return { status: "ok", column: accountingVirtualColumn }
    return { status: "ok" }
  }

  return {
    status: "ok",
    column: {
      name: field.name,
      typeInfo: isUnknownTypeInfo(field.typeInfo) && virtualStandardColumn !== undefined
        ? virtualStandardColumn.typeInfo
        : field.typeInfo,
    },
  }
}

function accountingRegisterRecordSetColumn(params: {
  owner: OwnerMetadata
  segment: string
}): TableColumnSource | undefined {
  if (params.owner.ref.kind !== "РегистрБухгалтерии") return undefined

  const accountColumn = accountingRegisterAccountColumn(params.owner, params.segment)
  if (accountColumn !== undefined) return accountColumn

  const extDimensionColumn = accountingRegisterExtDimensionColumn(params.segment)
  if (extDimensionColumn !== undefined) return extDimensionColumn

  return accountingRegisterDebitCreditFieldColumn(params.owner, params.segment)
}

function accountingRegisterAccountColumn(owner: OwnerMetadata, segment: string): TableColumnSource | undefined {
  if (segment !== "Account" && segment !== "AccountDr" && segment !== "AccountCr") return undefined

  const chartOfAccounts = accountingRegisterChartOfAccounts(owner.model)
  if (chartOfAccounts === undefined) return undefined

  return {
    name: segment,
    typeInfo: {
      kinds: ["object"],
      nextTypes: [chartOfAccounts],
      sourceText: `ChartOfAccounts.${chartOfAccounts.name ?? ""}`,
    },
  }
}

function accountingRegisterChartOfAccounts(model: unknown): OwnerTypeRef | undefined {
  if (typeof model !== "object" || model === null) return undefined

  const value = (model as Record<string, unknown>).chartOfAccounts
  if (typeof value !== "string") return undefined

  const prefix = "ChartOfAccounts."
  if (!value.startsWith(prefix)) return undefined

  const name = value.substring(prefix.length)
  if (name.length === 0) return undefined

  return { kind: "ПланСчетов", name }
}

function accountingRegisterExtDimensionColumn(segment: string): TableColumnSource | undefined {
  const match = /^ExtDimension(?:Dr|Cr)?(?<number>[1-9]\d?)$/.exec(segment)
  const number = match?.groups?.number
  if (number === undefined || Number(number) > 50) return undefined

  return {
    name: segment,
    typeInfo: {
      kinds: ["any"],
      nextTypes: [],
      sourceText: "AccountingRegisterRecordSet.ExtDimension",
    },
  }
}

function accountingRegisterDebitCreditFieldColumn(owner: OwnerMetadata, segment: string): TableColumnSource | undefined {
  const match = /^(?<name>.+)(?:Dr|Cr)$/.exec(segment)
  const name = match?.groups?.name
  if (name === undefined) return undefined

  const field = resolveObjectFieldSegment({ index: owner.fieldIndex, segment: name })
  if (field === undefined) return undefined

  return {
    name: segment,
    typeInfo: field.typeInfo,
  }
}

function registerRecordSetStandardColumn(segment: string, fieldName: string | undefined): TableColumnSource | undefined {
  const yamlName = fieldName ?? standardAttributeAliasToYAML(segment) ?? segment
  switch (segment) {
    case "Active":
    case "Активность":
      return {
        name: yamlName,
        typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "RegisterRecordSet.Active" },
      }
    case "Period":
    case "Период":
      return {
        name: yamlName,
        typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText: "RegisterRecordSet.Period" },
      }
    case "LineNumber":
    case "НомерСтроки":
      return {
        name: yamlName,
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "RegisterRecordSet.LineNumber" },
      }
    case "RecordType":
    case "ВидДвижения":
      return {
        name: yamlName,
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "RegisterRecordSet.RecordType" },
      }
  }

  return undefined
}

function isUnknownTypeInfo(typeInfo: DataPathTypeInfo): boolean {
  return typeInfo.kinds.length === 1 && typeInfo.kinds[0] === "unknown"
}

function tableNameForTableSource(params: {
  state: TraversalState
  segments: readonly string[]
}): string {
  const table = params.state.tableSource?.table
  if (table?.kind === "TabularSection") return table.name
  if (table?.kind === "RegisterRecordSet" && params.state.source.kind === "registerRecordSet") return params.state.source.name
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

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.columns.get(alias) ?? params.columns.get(params.segment)
  return params.columns.get(params.segment)
}

function virtualTableColumn(params: {
  tableSource: FormDataPathTableSource | ObjectFieldTableSource
  segment: string
}): TableColumnSource | undefined {
  if (params.tableSource.table.kind === "ValueList") {
    return valueListColumn(params.segment)
  }

  if (params.tableSource.table.kind === "GanttChart") {
    return ganttChartColumn(params.segment)
  }

  if (params.segment === "RowsCount") {
    return {
      name: params.segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "RowsCount" },
    }
  }

  if (params.segment.startsWith("Total")) {
    return {
      name: params.segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "Total" },
    }
  }

  return undefined
}

function ganttChartColumn(segment: string): TableColumnSource | undefined {
  switch (segment) {
    case "Point":
    case "Text":
      return {
        name: segment,
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: `GanttChart.${segment}` },
      }
  }

  return undefined
}

function valueListColumn(segment: string): TableColumnSource | undefined {
  switch (segment) {
    case "Value":
      return {
        name: segment,
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ValueList.Value" },
      }
    case "Presentation":
      return {
        name: segment,
        typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ValueList.Presentation" },
      }
    case "Check":
      return {
        name: segment,
        typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ValueList.Check" },
      }
    case "Picture":
      return {
        name: segment,
        typeInfo: { kinds: ["Picture"], nextTypes: [], sourceText: "ValueList.Picture" },
      }
  }

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
  if (typeInfo.kinds.includes("registerRecords")) return undefined
  if (typeInfo.kinds.includes("platformSource")) return undefined
  if (typeInfo.kinds.includes("standardPeriod")) return undefined

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
  return kind === "boolean" || kind === "dateTime" || kind === "Picture" || kind === "scalar" || kind === "typeDescription"
}

function isRegisterRecordsSegment(segment: string): boolean {
  return segment === "RegisterRecords" || segment === "НаборЗаписей"
}

function isDocumentOwner(ref: OwnerTypeRef): boolean {
  return ref.kind === "Документ" || ref.kind === "ДокументОбъект"
}

function isChartOfAccountsOwner(ref: OwnerTypeRef): boolean {
  return ref.kind === "ПланСчетов" || ref.kind === "ПланСчетовОбъект"
}

function isChartOfCalculationTypesOwner(ref: OwnerTypeRef): boolean {
  return ref.kind === "ПланВидовРасчета" || ref.kind === "ПланВидовРасчетаОбъект"
}

function isSettingsComposerSegment(segment: string): boolean {
  return segment === "SettingsComposer" || segment === "КомпоновщикНастроек"
}

function isReportOwner(ref: OwnerTypeRef): boolean {
  return ref.kind === "ОтчетОбъект"
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
