const OtherTypeToEnterprise = {
  Characteristic: "Характеристика",

  DefinedType: "ОпределяемыйТип",

  CommandGroup: "ГруппаКоманд",

  InformationRegister: "РегистрСведений",

  Role: "Роль",

  Report: "Отчет",

  DocumentNumerator: "НумераторДокументов",

  DataProcessor: "Обработка",
  CommonPicture: "ОбщаяКартинка",
  CommonCommand: "ОбщаяКоманда",
  CommonTemplate: "ОбщийМакет",
  CommonModule: "ОбщийМодуль",
  CommonAttribute: "ОбщийРеквизит",
  CommonForm: "ОбщаяФорма",
  FilterCriterion: "КритерийОтбора",
  AccountingRegister: "РегистрБухгалтерии",
  AccumulationRegister: "РегистрНакопления",
  CalculationRegister: "РегистрРасчета",
  ScheduledJob: "РегламентноеЗадание",
  IntegrationService: "СервисИнтеграции",
  StyleItem: "ЭлементСтиля",
  Language: "Язык",
  Style: "Стиль",
  FunctionalOption: "ФункциональнаяОпция",
  DocumentJournal: "ЖурналДокументов",
  HTTPService: "HTTPСервис",
  WebSocketClient: "WebSocketКлиент",
  WebService: "WebСервис",
  Bot: "Бот",
  ExternalDataSource: "ВнешнийИсточникДанных",
  SessionParameter: "ПараметрСеанса",
  FunctionalOptionParameter: "ПараметрФункциональныхОпций",
} as const

export const MetadataTypeToEnterprise = {
  Constant: "Константа",

  CatalogObject: "СправочникОбъект",
  CatalogRef: "Справочник",

  DocumentObject: "ДокументОбъект",
  DocumentRef: "Документ",

  EnumRef: "Перечисление",

  ChartOfAccountObject: "ПланСчетовОбъект",
  ChartOfAccountsRef: "ПланСчетов",

  ChartOfCharacteristicTypesObject: "ПланВидовХарактеристикОбъект",
  ChartOfCharacteristicTypesRef: "ПланВидовХарактеристик",

  ChartOfCalculationTypesObject: "ПланВидовРасчетаОбъект",
  ChartOfCalculationTypesRef: "ПланВидовРасчета",

  ExchangePlanObject: "ПланОбменаОбъект",
  ExchangePlanRef: "ПланОбмена",

  BusinessProcessRef: "БизнесПроцесс",
  BusinessProcessObject: "БизнесПроцессОбъект",

  BusinessProcessRoutePointObject: "ТочкаМаршрутаБизнесПроцессаОбъект",
  BusinessProcessRoutePointRef: "ТочкаМаршрутаБизнесПроцесса",

  TaskRef: "Задача",
  TaskObject: "ЗадачаОбъект",

  ...OtherTypeToEnterprise,
} as const

export const MetadataTypeFromEnterprise = Object.fromEntries(
  Object.entries(MetadataTypeToEnterprise).map(([key, value]) => [value, key])
) as Record<
  (typeof MetadataTypeToEnterprise)[keyof typeof MetadataTypeToEnterprise],
  keyof typeof MetadataTypeToEnterprise
>

export type MetadataType = keyof typeof MetadataTypeToEnterprise
export type MetadataTypeEnterprise = (typeof MetadataTypeToEnterprise)[keyof typeof MetadataTypeToEnterprise]

export const MetadataFieldTypeToEnterprise = {
  Constant: "Константа",
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  BusinessProcess: "БизнесПроцесс",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса",
  Task: "Задача",
  ...OtherTypeToEnterprise,
}

export const MetadataFieldTypeFromEnterprise = Object.fromEntries(
  Object.entries(MetadataFieldTypeToEnterprise).map(([key, value]) => [value, key])
) as Record<
  (typeof MetadataFieldTypeToEnterprise)[keyof typeof MetadataFieldTypeToEnterprise],
  keyof typeof MetadataFieldTypeToEnterprise
>

export type MetadataFieldType = keyof typeof MetadataFieldTypeToEnterprise
export type MetadataFieldTypeEnterprise =
  (typeof MetadataFieldTypeToEnterprise)[keyof typeof MetadataFieldTypeToEnterprise]

// export type MetadataFieldType = keyof typeof MetadataFieldTypeToEnterprise
// export type MetadataFieldTypeEnterprise =
//   (typeof MetadataFieldTypeToEnterprise)[keyof typeof MetadataFieldTypeToEnterprise]
// export const MetadataFieldsMap = {
//   Catalog: {
//     enterprise: "Справочник",
//     hasObject: true,
//     fields: {
//       Attribute: "Реквизит",
//       TabularSection: {
//         enterprise: "ТабличнаяЧасть",
//         fields: {
//           Attribute: "Реквизит",
//           StandardAttribute: { enterprise: "СтандартныйРеквизит", values: ["lineNumber"] },
//         },
//       },
//       StandardAttribute: "СтандартныйРеквизит",
//     },
//   },
//   Enum: {
//     enterprise: "Перечисление",
//     fields: {
//       EnumValue: true,
//     },
//   },
// } as const
