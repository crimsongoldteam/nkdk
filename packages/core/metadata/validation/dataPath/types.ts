export type { DataPathAllowedKind } from "../../orchestration/property/types"

export type DataPathValueKind =
  | "unknown"
  | "any"
  | "boolean"
  | "dateTime"
  | "Picture"
  | "scalar"
  | "typeDescription"
  | "object"
  | "tableSource"
  | "dynamicList"
  | "constantSet"
  | "registerRecords"
  | "platformSource"
  | "standardPeriod"
  | "unsupportedIntermediate"

export type OwnerTypeKind = string & {}

export interface OwnerTypeRef {
  kind: OwnerTypeKind
  name?: string
}

export type DataPathTableInfo =
  | { kind: "ValueTable" }
  | { kind: "ValueTree" }
  | { kind: "ValueList" }
  | { kind: "GanttChart" }
  | { kind: "DynamicList" }
  | { kind: "RegisterRecordSet"; owner: OwnerTypeRef }
  | { kind: "TabularSection"; owner: OwnerTypeRef; name: string }

export interface DataPathTypeInfo {
  kinds: readonly DataPathValueKind[]
  nextTypes: readonly OwnerTypeRef[]
  definedTypes?: readonly string[]
  table?: DataPathTableInfo
  isComposite?: boolean
  sourceText?: string
}

export const unknownDataPathTypeInfo: DataPathTypeInfo = {
  kinds: ["unknown"],
  nextTypes: [],
}

export interface FormDataPathColumnSource {
  name: string
  typeInfo: DataPathTypeInfo
}

export interface FormDataPathTableSource {
  table: DataPathTableInfo
  columns: Map<string, FormDataPathColumnSource>
  hasColumns: boolean
}

export type FormDataPathAdditionalColumnsByTablePath = Map<string, Map<string, FormDataPathColumnSource>>

export interface FormDataPathSource {
  kind: "formAttribute"
  name: string
  typeInfo: DataPathTypeInfo
  tableSource?: FormDataPathTableSource
}
