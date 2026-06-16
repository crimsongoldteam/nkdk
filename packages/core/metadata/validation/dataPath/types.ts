export type { DataPathAllowedKind } from "~/metadata/orchestration/property/types"

export type DataPathValueKind =
  | "unknown"
  | "any"
  | "boolean"
  | "dateTime"
  | "Picture"
  | "scalar"
  | "object"
  | "tableSource"
  | "dynamicList"
  | "constantSet"
  | "platformSource"
  | "unsupportedIntermediate"

export type KnownOwnerTypeKind =
  | "Справочник"
  | "СправочникОбъект"
  | "Документ"
  | "ДокументОбъект"
  | "Перечисление"
  | "РегистрСведений"
  | "РегистрНакопления"
  | "РегистрБухгалтерии"
  | "РегистрРасчета"
  | "ПланОбмена"
  | "ПланОбменаОбъект"
  | "ПланВидовРасчета"
  | "ПланВидовРасчетаОбъект"
  | "ПланВидовХарактеристик"
  | "ПланВидовХарактеристикОбъект"
  | "ПланСчетов"
  | "ПланСчетовОбъект"
  | "ОбработкаОбъект"
  | "ОтчетОбъект"
  | "БизнесПроцесс"
  | "БизнесПроцессОбъект"
  | "Задача"
  | "ЗадачаОбъект"
  | "Константа"

export interface OwnerTypeRef {
  kind: KnownOwnerTypeKind | (string & {})
  name?: string
}

export type DataPathTableInfo =
  | { kind: "ValueTable" }
  | { kind: "ValueTree" }
  | { kind: "DynamicList" }
  | { kind: "TabularSection"; owner: OwnerTypeRef; name: string }

export interface DataPathTypeInfo {
  kinds: readonly DataPathValueKind[]
  nextTypes: readonly OwnerTypeRef[]
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
