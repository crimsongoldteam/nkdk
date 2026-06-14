import type { MetadataFieldKind, MetadataRootName } from "./types"

export const METADATA_NAME_PATTERN = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"

export const rootToYAML = {
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  InformationRegister: "РегистрСведений",
  AccumulationRegister: "РегистрНакопления",
  AccountingRegister: "РегистрБухгалтерии",
  CalculationRegister: "РегистрРасчета",
  ExchangePlan: "ПланОбмена",
  ChartOfAccounts: "ПланСчетов",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик",
  ChartOfCalculationTypes: "ПланВидовРасчета",
  BusinessProcess: "БизнесПроцесс",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса",
  Task: "Задача",
  DataProcessor: "Обработка",
  Report: "Отчет",
  CommonPicture: "ОбщаяКартинка",
  StyleItem: "ЭлементСтиля",
} as const satisfies Record<MetadataRootName, string>

export const rootFromYAML = Object.fromEntries(
  Object.entries(rootToYAML).map(([model, yaml]) => [yaml, model])
) as Record<string, MetadataRootName>

export const fieldKindToYAML = {
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
} as const satisfies Record<MetadataFieldKind, string>

export const fieldKindFromYAML = Object.fromEntries(
  Object.entries(fieldKindToYAML).map(([model, yaml]) => [yaml, model])
) as Record<string, MetadataFieldKind>

export function isMetadataRootName(value: string): value is MetadataRootName {
  return Object.prototype.hasOwnProperty.call(rootToYAML, value)
}
