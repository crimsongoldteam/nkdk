import type { MetadataFieldKind, MetadataMemberKind, MetadataObjectPathKind, MetadataRootName } from "./types"

export const METADATA_NAME_PATTERN = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"

export const rootToYAML = {
  Constant: "Константа",
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  DefinedType: "ОпределяемыйТип",
  Characteristic: "Характеристика",
  CommandGroup: "ГруппаКоманд",
  Role: "Роль",
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
  DocumentNumerator: "НумераторДокументов",
  CommonCommand: "ОбщаяКоманда",
  CommonPicture: "ОбщаяКартинка",
  CommonTemplate: "ОбщийМакет",
  CommonModule: "ОбщийМодуль",
  CommonAttribute: "ОбщийРеквизит",
  CommonForm: "ОбщаяФорма",
  FilterCriterion: "КритерийОтбора",
  ScheduledJob: "РегламентноеЗадание",
  IntegrationService: "СервисИнтеграции",
  Language: "Язык",
  Style: "Стиль",
  StyleItem: "ЭлементСтиля",
  FunctionalOption: "ФункциональнаяОпция",
  FunctionalOptionsParameter: "ПараметрФункциональныхОпций",
  DocumentJournal: "ЖурналДокументов",
  HTTPService: "HTTPСервис",
  WebSocketClient: "WebSocketКлиент",
  WebService: "WebСервис",
  Bot: "Бот",
  ExternalDataSource: "ВнешнийИсточникДанных",
  EventSubscription: "ПодпискаНаСобытие",
  XDTOPackage: "ПакетXDTO",
  WSReference: "WSСсылка",
  SessionParameter: "ПараметрСеанса",
  SettingsStorage: "ХранилищеНастроек",
  Subsystem: "Подсистема",
  Sequence: "Последовательность",
} as const satisfies Record<MetadataRootName, string>

export const rootFromYAML = Object.fromEntries(
  Object.entries(rootToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, MetadataRootName>>

export const memberKindToYAML = {
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
  Form: "Форма",
  Template: "Макет",
  Command: "Команда",
  AccountingFlag: "ПризнакУчета",
  ExtDimensionAccountingFlag: "ПризнакУчетаСубконто",
  AddressingAttribute: "РеквизитАдресации",
  Field: "Поле",
} as const satisfies Record<MetadataMemberKind, string>

export const memberKindFromYAML = Object.fromEntries(
  Object.entries(memberKindToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, MetadataMemberKind>>

export const fieldKindToYAML = {
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
  AddressingAttribute: "РеквизитАдресации",
} as const satisfies Record<MetadataFieldKind, string>

export const fieldKindFromYAML = Object.fromEntries(
  Object.entries(fieldKindToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, MetadataFieldKind>>

export const standardAttributeToYAML: Readonly<Record<string, string>> = {
  Ref: "Ссылка",
  LineNumber: "НомерСтроки",
  Account: "Счет",
  Owner: "Владелец",
  Description: "Наименование",
  Code: "Код",
  DeletionMark: "ПометкаУдаления",
  IsFolder: "ЭтоГруппа",
  Parent: "Родитель",
  Predefined: "Предопределенный",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Active: "Активность",
  Recorder: "Регистратор",
  Period: "Период",
  Number: "Номер",
  Date: "Дата",
  Posted: "Проведен",
} as const satisfies Record<string, string>

export const standardAttributeFromYAML = Object.fromEntries(
  Object.entries(standardAttributeToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, string>>

export function isMetadataRootName(value: string): value is MetadataRootName {
  return Object.prototype.hasOwnProperty.call(rootToYAML, value)
}

export const objectPathKindToYAML = {
  Table: "Таблица",
  Cube: "Куб",
  DimensionTable: "ТаблицаИзмерения",
  Function: "Функция",
} as const satisfies Record<MetadataObjectPathKind, string>

export const objectPathKindFromYAML = Object.fromEntries(
  Object.entries(objectPathKindToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, MetadataObjectPathKind>>

export function isMetadataObjectPathKind(value: string): value is MetadataObjectPathKind {
  return Object.prototype.hasOwnProperty.call(objectPathKindToYAML, value)
}
