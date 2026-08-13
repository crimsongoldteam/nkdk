import { dataTableCanonical, type MetadataFieldKind, type MetadataRootName, type ParsedDataTableTarget } from "@nkdk/runtime/rule-kit"
import type { ObjectField, ValidationNamedTypeItems, ValidationOwnerFacts } from "../validation/dataPath/contracts"
import type { DataTableDeclaration, DataTableDeclarationContribution, DataTableFieldDeclaration } from "../validation/dataTables"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"

const PHYSICAL_TABLE_ROOTS = new Set<MetadataRootName>([
  "FilterCriterion",
  "ExchangePlan",
  "Constant",
  "Catalog",
  "Document",
  "DocumentJournal",
  "Enum",
  "ChartOfCharacteristicTypes",
  "ChartOfAccounts",
  "ChartOfCalculationTypes",
  "InformationRegister",
  "AccumulationRegister",
  "AccountingRegister",
  "CalculationRegister",
  "BusinessProcess",
  "Task",
])

const FIELD_KINDS: Readonly<Record<ObjectField["kind"], MetadataFieldKind>> = {
  attribute: "Attribute",
  standardAttribute: "StandardAttribute",
  tabularSection: "TabularSection",
  dimension: "Dimension",
  resource: "Resource",
  addressingAttribute: "AddressingAttribute",
}

export const appliedObjectDataTableRules: readonly DataTableDeclarationContribution[] = [
  { kind: "dataTableDeclarations", contributor: collectAppliedObjectDataTables },
]

export function collectAppliedObjectDataTables(
  records: readonly ValidationObjectRecord[],
): Iterable<DataTableDeclaration> {
  const byCanonical = objectRecordsByCanonical(records)
  const result: DataTableDeclaration[] = []

  for (const record of records) {
    const object = primaryObjectEntry(record)
    if (object === undefined) continue
    const target = object.target

    if (target.root === "ExternalDataSource") {
      if (isExternalDataSourceTable(target)) result.push(table(record, object.result, dataTableTarget(target)))
      continue
    }
    if (!PHYSICAL_TABLE_ROOTS.has(target.root) || target.segments !== undefined) continue

    const physical = dataTableTarget(target)
    result.push(table(record, object.result, physical))
    result.push(...tabularSectionTables(record, object.result, physical))
    result.push(...virtualTables(record, physical, records, byCanonical))
  }

  return result
}

function virtualTables(
  record: ValidationObjectRecord,
  physical: ParsedDataTableTarget,
  records: readonly ValidationObjectRecord[],
  byCanonical: ReadonlyMap<string, ValidationObjectRecord>,
): DataTableDeclaration[] {
  const facts = record.ownerFacts
  if (facts === undefined) return []
  const names: string[] = []

  if (physical.root === "InformationRegister" && !isNonperiodical(facts.periodicity)) {
    names.push("SliceFirst", "SliceLast")
  } else if (physical.root === "AccumulationRegister") {
    if (isBalanceRegister(facts.registerType)) names.push("Balance", "Turnovers", "BalanceAndTurnovers")
    else if (isTurnoversRegister(facts.registerType)) names.push("Turnovers")
  } else if (physical.root === "AccountingRegister") {
    names.push("Balance", "Turnovers", "BalanceAndTurnovers")
    if (isTrue(facts.correspondence)) names.push("DrCrTurnovers")
    const chart = facts.chartOfAccounts === undefined ? undefined : byCanonical.get(facts.chartOfAccounts)
    if (Number(chart?.ownerFacts?.maxExtDimensionCount ?? 0) > 0) {
      names.push("RecordsWithExtDimensions", "ExtDimensions")
    }
  } else if (physical.root === "CalculationRegister") {
    names.push(...baseTableNames(record, records, byCanonical))
    if (hasScheduleData(facts, byCanonical)) names.push("ScheduleData")
    if (isTrue(facts.actionPeriod)) names.push("ActualActionPeriod")
  } else if (physical.root === "BusinessProcess") {
    names.push("Points")
  }

  return names.map((virtualTable) => table(record, { ok: true, filePath: record.filePath }, {
    ...physical,
    virtualTable,
  }))
}

function baseTableNames(
  main: ValidationObjectRecord,
  records: readonly ValidationObjectRecord[],
  byCanonical: ReadonlyMap<string, ValidationObjectRecord>,
): string[] {
  const facts = main.ownerFacts
  if (facts === undefined || !isTrue(facts.basePeriod) || facts.chartOfCalculationTypes === undefined) return []
  const plan = byCanonical.get(facts.chartOfCalculationTypes)?.ownerFacts
  if (plan === undefined || isDontUse(plan.dependenceOnCalculationTypes)) return []
  const basePlans = new Set(plan.baseCalculationTypes ?? [])

  return records.flatMap((candidate) => {
    const object = primaryObjectEntry(candidate)
    if (object?.target.root !== "CalculationRegister" || object.target.segments !== undefined) return []
    const basePlan = candidate.ownerFacts?.chartOfCalculationTypes
    return basePlan !== undefined && basePlans.has(basePlan) ? [`Base${object.target.objectName}`] : []
  })
}

function hasScheduleData(
  facts: ValidationOwnerFacts,
  byCanonical: ReadonlyMap<string, ValidationObjectRecord>,
): boolean {
  if (!isTrue(facts.actionPeriod) || facts.schedule === undefined || facts.scheduleDate === undefined || facts.scheduleValue === undefined) {
    return false
  }
  const schedule = byCanonical.get(facts.schedule)?.ownerFacts
  if (schedule === undefined || !isNonperiodical(schedule.periodicity)) return false
  const dateName = referencedMemberName(facts.scheduleDate, facts.schedule, "Dimension")
  const valueName = referencedMemberName(facts.scheduleValue, facts.schedule, "Resource")
  return hasPrimitive(schedule.dimensions, dateName, "dateTime") && hasPrimitive(schedule.resources, valueName, "decimal")
}

function hasPrimitive(items: ValidationNamedTypeItems | undefined, name: string | undefined, primitive: string): boolean {
  return name !== undefined && items?.some((item) => item.name === name && item.type?.type?.includes(primitive)) === true
}

function referencedMemberName(
  canonical: string,
  ownerCanonical: string,
  kind: MetadataFieldKind,
): string | undefined {
  const prefix = `${ownerCanonical}.${kind}.`
  return canonical.startsWith(prefix) ? canonical.slice(prefix.length) : undefined
}

function tabularSectionTables(
  record: ValidationObjectRecord,
  result: DataTableDeclaration["result"],
  physical: ParsedDataTableTarget,
): DataTableDeclaration[] {
  const indexed = [...(record.fieldIndex?.fields.values() ?? [])]
    .filter((field) => field.kind === "tabularSection")
    .map((field) => ({ name: field.targetName ?? field.name, columns: field.tableSource?.columns }))
  const names = new Set(indexed.map(({ name }) => name))
  for (const section of record.ownerFacts?.tabularSections ?? []) names.add(section.name)

  return [...names].map((name) => {
    const columns = indexed.find((item) => item.name === name)?.columns
    return table(record, result, {
      ...physical,
      tableSegments: [{ kind: "TabularSection", name }],
    }, columns)
  })
}

function table(
  record: ValidationObjectRecord,
  result: DataTableDeclaration["result"],
  target: ParsedDataTableTarget,
  explicitFields?: ReadonlyMap<string, ObjectField>,
): DataTableDeclaration {
  const canonical = dataTableCanonical(target)
  const sourceFields = explicitFields ?? record.fieldIndex?.fields
  return {
    canonical,
    target,
    result,
    fields: sourceFields === undefined ? [] : fieldDeclarations(canonical, sourceFields),
  }
}

function fieldDeclarations(tableCanonical: string, fields: ReadonlyMap<string, ObjectField>): DataTableFieldDeclaration[] {
  return [...fields.values()].flatMap((field) => {
    if (field.kind === "tabularSection") return []
    const fieldName = field.targetName ?? field.name
    return [{
      canonical: `${tableCanonical}.${FIELD_KINDS[field.kind]}.${fieldName}`,
      target: { kind: "dataTableField", fieldName },
      result: { ok: true, details: field },
    }]
  })
}

function objectRecordsByCanonical(records: readonly ValidationObjectRecord[]): Map<string, ValidationObjectRecord> {
  const result = new Map<string, ValidationObjectRecord>()
  for (const record of records) {
    for (const entry of record.objectIndexEntries ?? []) result.set(entry.canonical, record)
  }
  return result
}

function primaryObjectEntry(record: ValidationObjectRecord) {
  return record.objectIndexEntries?.find((entry) => entry.result.ok)
}

function dataTableTarget(
  target: NonNullable<ReturnType<typeof primaryObjectEntry>>["target"],
): ParsedDataTableTarget {
  return {
    kind: "dataTable",
    root: target.root,
    objectName: target.objectName,
    ...(target.segments === undefined ? {} : { objectSegments: target.segments }),
  }
}

function isExternalDataSourceTable(
  target: NonNullable<ReturnType<typeof primaryObjectEntry>>["target"],
): boolean {
  const segments = target.segments ?? []
  if (segments.length === 0) return false
  if (segments.length === 1) return segments[0]?.kind === "Cube" || segments[0]?.kind === "Table"
  return segments.length === 2 && segments[0]?.kind === "Cube" && segments[1]?.kind === "DimensionTable"
}

function isNonperiodical(value: string | undefined): boolean {
  return value === undefined || value === "Nonperiodical" || value === "Непериодический"
}

function isBalanceRegister(value: string | undefined): boolean {
  return value === undefined || value === "Balance" || value === "Остатки"
}

function isTurnoversRegister(value: string | undefined): boolean {
  return value === "Turnovers" || value === "Обороты"
}

function isDontUse(value: string | undefined): boolean {
  return value === undefined || value === "DontUse" || value === "НеИспользовать"
}

function isTrue(value: string | undefined): boolean {
  return value === "true" || value === "Истина"
}
