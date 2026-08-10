import type { DataPathAllowedKind, DataPathNamedFamily } from "@nkdk/runtime/rule-kit"
import { getSystemEnumeration } from "@nkdk/runtime/rule-kit"
import type { DataPathTypeInfo } from "./types"
import { getRecordSetTypeBaseByOwnerKind, getReferenceTypeBaseByOwnerKind } from "./ownerKindRegistry"

export type NormalizedDataPathTerminalType =
  | {
      status: "resolved"
      groups: readonly DataPathAllowedKind[]
      composite: boolean
      display: string
    }
  | { status: "notResolved"; display: string }

const namedFamilies = new Set<DataPathNamedFamily>([
  "DocumentRef",
  "CatalogRef",
  "EnumRef",
  "TaskRef",
  "BusinessProcessRef",
  "ExchangePlanRef",
  "ChartOfAccountsRef",
  "ChartOfCharacteristicTypesRef",
  "ChartOfCalculationTypesRef",
  "AccumulationRegisterRef",
  "AccountingRegisterRef",
  "InformationRegisterRef",
  "CalculationRegisterRef",
  "BusinessProcessRoutePointRef",
  "Characteristic",
  "DefinedType",
  "DocumentTabularSection",
  "CatalogTabularSection",
  "DataProcessorTabularSection",
  "ReportTabularSection",
  "ExchangePlanTabularSection",
  "BusinessProcessTabularSection",
  "TaskTabularSection",
  "ChartOfAccountsTabularSection",
  "ChartOfCharacteristicTypesTabularSection",
  "ChartOfCalculationTypesTabularSection",
  "ChartOfAccountsExtDimensionTypes",
  "InformationRegisterRecordSet",
  "AccumulationRegisterRecordSet",
  "AccountingRegisterRecordSet",
  "CalculationRegisterRecordSet",
])

const exactKinds = new Set<DataPathAllowedKind>([
  "string",
  "decimal",
  "boolean",
  "dateTime",
  "UUID",
  "Null",
  "<any>",
  "Picture",
  "Color",
  "Font",
  "ValueStorage",
  "TypeDescription",
  "ValueTable",
  "ValueTree",
  "ValueListType",
  "DynamicList",
  "GanttChart",
  "FormattedString",
  "StandardPeriod",
  "StandardBeginningDate",
  "AnyIBRef",
  "SpreadsheetDocument",
  "TextDocument",
  "FormattedDocument",
  "Chart",
  "FlowchartContextType",
  "PDFDocument",
  "Planner",
  "GeographicalSchema",
  "DataCompositionComparisonType",
  "ComparisonType",
  "DataCompositionGroupType",
  "DataCompositionSortDirection",
  "DataCompositionPeriodAdditionType",
  "Field",
  "Filter",
  "HorizontalAlign",
  "VerticalAlign",
])

export function normalizeDataPathTerminalType(typeInfo: DataPathTypeInfo): NormalizedDataPathTerminalType {
  const terminalTypes = unique(typeInfo.terminalTypes ?? structuralTerminalTypes(typeInfo))
  if (terminalTypes.length === 0) {
    return { status: "notResolved", display: typeInfo.sourceText ?? typeInfo.kinds.join(" | ") }
  }

  const effectiveGroups = terminalTypes.map(normalizeTerminalType)
  if (effectiveGroups.some((group) => group === undefined)) {
    return { status: "notResolved", display: terminalTypes.join(" | ") }
  }

  const groups = unique(effectiveGroups as DataPathAllowedKind[])
  if ((typeInfo.definedTypes?.length ?? 0) > 0 && !groups.includes("DefinedType.*")) {
    groups.push("DefinedType.*")
  }

  return {
    status: "resolved",
    groups,
    composite: terminalTypes.length > 1 || typeInfo.isComposite === true,
    display: effectiveGroups.join(" | "),
  }
}

function structuralTerminalTypes(typeInfo: DataPathTypeInfo): string[] {
  if (typeInfo.table !== undefined) {
    switch (typeInfo.table.kind) {
      case "ValueTable":
        return ["ValueTable"]
      case "ValueTree":
        return ["ValueTree"]
      case "ValueList":
        return ["ValueListType"]
      case "GanttChart":
        return ["GanttChart"]
      case "DynamicList":
        return ["DynamicList"]
      case "RegisterRecordSet": {
        const base = getRecordSetTypeBaseByOwnerKind(typeInfo.table.owner.kind)
        return base === undefined ? [] : [qualifiedType(base, typeInfo.table.owner.name)]
      }
      case "TabularSection":
        return []
    }
  }

  return typeInfo.nextTypes.flatMap((owner) => {
    const base = getReferenceTypeBaseByOwnerKind(owner.kind)
    return base === undefined ? [] : [qualifiedType(base, owner.name)]
  })
}

function qualifiedType(base: string, name: string | undefined): string {
  return name === undefined || name === "" ? base : `${base}.${name}`
}

function normalizeTerminalType(type: string): DataPathAllowedKind | undefined {
  const dotIndex = type.indexOf(".")
  const base = dotIndex === -1 ? type : type.substring(0, dotIndex)
  if (namedFamilies.has(base as DataPathNamedFamily)) {
    return (dotIndex === -1 ? base : `${base}.*`) as DataPathAllowedKind
  }
  if (getSystemEnumeration(type) !== undefined) return "<standard-enum>"
  return exactKinds.has(type as DataPathAllowedKind) ? (type as DataPathAllowedKind) : undefined
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)]
}
