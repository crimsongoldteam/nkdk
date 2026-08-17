import type { ConfigurationContext } from "@nkdk/runtime"
import type { DataPathTypeInfo } from "@nkdk/runtime/rule-kit"
import { importDcsMetadataTypedValueFromYAML } from "../../commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML"
import type {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueYAML,
} from "../../commonObjects/dataCompositionSystem/dscMetadataTypedValue/types"

export type ConditionalOperandType =
  | { readonly kind: "field"; readonly value: string }
  | { readonly kind: "typed"; readonly typeInfo: DataPathTypeInfo }
  | { readonly kind: "unknown" }

const referenceTypeByRoot: Readonly<Record<string, string>> = {
  Catalog: "CatalogRef",
  Document: "DocumentRef",
  Enum: "EnumRef",
  Task: "TaskRef",
  BusinessProcess: "BusinessProcessRef",
  BusinessProcessRoutePoint: "BusinessProcessRoutePointRef",
  ExchangePlan: "ExchangePlanRef",
  ChartOfAccounts: "ChartOfAccountsRef",
  ChartOfCharacteristicTypes: "ChartOfCharacteristicTypesRef",
  ChartOfCalculationTypes: "ChartOfCalculationTypesRef",
}

export function inferConditionalOperandType(params: {
  context: ConfigurationContext
  value: unknown
  sourceValue?: DcsMetadataTypedValue
}): ConditionalOperandType {
  let imported: DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined
  try {
    imported = importDcsMetadataTypedValueFromYAML(
      params.context,
      { type: "DcsMetadataTypedValue" },
      params.value as DcsMetadataTypedValueYAML,
      params.sourceValue,
    )
  } catch {
    return { kind: "unknown" }
  }

  if (imported === undefined || Array.isArray(imported)) return { kind: "unknown" }
  if (imported.type === "Field") return { kind: "field", value: imported.value }
  if (imported.type === "DesignTimeValue") return { kind: "unknown" }
  if (imported.type === "ref") {
    const terminalType = referenceTerminalType(imported.value)
    return terminalType === undefined ? { kind: "unknown" } : { kind: "typed", typeInfo: terminal(terminalType) }
  }

  const terminalType = {
    decimal: "decimal",
    boolean: "boolean",
    dateTime: "dateTime",
    string: "string",
    Order: "Order",
    EmptyValueList: "ValueListType",
    StandardBeginningDate: "StandardBeginningDate",
  }[imported.type]
  return terminalType === undefined
    ? { kind: "unknown" }
    : { kind: "typed", typeInfo: terminal(terminalType) }
}

function referenceTerminalType(value: string): string | undefined {
  const [root, name] = value.split(".")
  const base = root === undefined ? undefined : referenceTypeByRoot[root]
  return base === undefined || name === undefined || name.length === 0 ? undefined : `${base}.${name}`
}

function terminal(type: string): DataPathTypeInfo {
  return {
    kinds: type === "boolean" ? ["boolean"] : type === "dateTime" ? ["dateTime"] : ["scalar"],
    nextTypes: [],
    terminalTypes: [type],
    sourceText: type,
  }
}
