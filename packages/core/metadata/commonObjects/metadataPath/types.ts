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

export const MetatatTypeToEnterprise = {
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

export const MetadataTypeFromEnterprise = (name: string): MetadataType => {
  return Object.keys(MetatatTypeToEnterprise).find(
    (key) => MetatatTypeToEnterprise[key as MetadataType] === name
  ) as MetadataType
}

export type MetadataType = keyof typeof MetatatTypeToEnterprise
export type MetadataTypeEnterprise = (typeof MetatatTypeToEnterprise)[keyof typeof MetatatTypeToEnterprise]
