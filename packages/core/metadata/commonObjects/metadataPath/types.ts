import { Static, Type } from "@sinclair/typebox"
import { createMetadataTypesRules, createMetadataValuesRules, swapMetadataFieldsRulesKeys } from "./helper"

const OtherTypeToYAML = {
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

export const MetadataTypeToYAML = {
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

  ...OtherTypeToYAML,
} as const

export const MetadataTypeFromYAML = Object.fromEntries(
  Object.entries(MetadataTypeToYAML).map(([key, value]) => [value, key])
) as Record<(typeof MetadataTypeToYAML)[keyof typeof MetadataTypeToYAML], keyof typeof MetadataTypeToYAML>

export type MetadataType = keyof typeof MetadataTypeToYAML
export type MetadataTypeYAML = (typeof MetadataTypeToYAML)[keyof typeof MetadataTypeToYAML]

export const MetadataFieldTypeToYAML = {
  Constant: "Константа",
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  BusinessProcess: "БизнесПроцесс",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса",
  Task: "Задача",
  ExchangePlan: "ПланОбмена",
  ...OtherTypeToYAML,
}

export const MetadataFieldTypeFromYAML = Object.fromEntries(
  Object.entries(MetadataFieldTypeToYAML).map(([key, value]) => [value, key])
) as Record<
  (typeof MetadataFieldTypeToYAML)[keyof typeof MetadataFieldTypeToYAML],
  keyof typeof MetadataFieldTypeToYAML
>

export type MetadataFieldType = keyof typeof MetadataFieldTypeToYAML
export type MetadataFieldTypeYAML = (typeof MetadataFieldTypeToYAML)[keyof typeof MetadataFieldTypeToYAML]

export type IncludeToType = "Ref" | "Both" | "Save"

export interface MetadataMapItem {
  name: string
  includeToType?: IncludeToType
  fields?: {
    [key: string]: string | MetadataMapItem
  }
}

export type MetadataFieldsRulesItem = string | MetadataMapItem

export type MetadataFieldsRules = Record<string, MetadataFieldsRulesItem>

export const MetadataFieldsRulesToYAML: MetadataFieldsRules = {
  Catalog: {
    name: "Справочник",
    includeToType: "Both",
    fields: {
      Attribute: "Реквизит",
      TabularSection: {
        name: "ТабличнаяЧасть",
        fields: {
          Attribute: "Реквизит",
          StandardAttribute: { name: "СтандартныйРеквизит", fields: { LineNumber: "НомерСтроки", Ref: "Ссылка" } },
        },
      },
      StandardAttribute: {
        name: "СтандартныйРеквизит",
        fields: {
          PredefinedDataName: "ИмяПредопределенныхДанных",
          Predefined: "Предопределенный",
          Ref: "Ссылка",
          DeletionMark: "ПометкаУдаления",
          IsFolder: "ЭтоГруппа",
          Owner: "Владелец",
          Parent: "Родитель",
          Description: "Наименование",
          Code: "Код",
        },
      },
    },
  },
  Document: {
    name: "Документ",
    includeToType: "Both",
    fields: {
      Attribute: "Реквизит",
      StandardAttribute: "СтандартныйРеквизит",
      TabularSection: {
        name: "ТабличнаяЧасть",
        fields: {
          Attribute: "Реквизит",
          StandardAttribute: { name: "СтандартныйРеквизит", fields: { LineNumber: "НомерСтроки", Ref: "Ссылка" } },
        },
      },
    },
  },
  InformationRegister: {
    name: "РегистрСведений",
    fields: {
      Attribute: "Реквизит",
      StandardAttribute: {
        name: "СтандартныйРеквизит",
        fields: { Active: "Активность", LineNumber: "НомерСтроки", Recorder: "Регистратор", Period: "Период" },
      },
      Dimension: "Измерение",
      Resource: "Ресурс",
    },
  },
  ExchangePlan: {
    name: "ПланОбмена",
    includeToType: "Both",
    fields: {
      Attribute: "Реквизит",
      StandardAttribute: { name: "СтандартныйРеквизит", fields: { LineNumber: "НомерСтроки" } },
    },
  },
  Task: {
    name: "Задача",
    includeToType: "Both",
  },
  BusinessProcess: {
    name: "БизнесПроцесс",
    includeToType: "Both",
  },
  BusinessProcessRoutePoint: {
    name: "ТочкаМаршрутаБизнесПроцесса",
    includeToType: "Both",
  },
  ChartOfAccount: {
    name: "ПланСчетов",
    includeToType: "Both",
  },
  ChartOfAccounts: {
    name: "ПланСчетов",
    includeToType: "Both",
  },
  ChartOfCharacteristicTypes: {
    name: "ПланВидовХарактеристик",
    includeToType: "Both",
    fields: {
      Attribute: "Реквизит",
      TabularSection: {
        name: "ТабличнаяЧасть",
        fields: {
          Attribute: "Реквизит",
          StandardAttribute: { name: "СтандартныйРеквизит", fields: { LineNumber: "НомерСтроки", Ref: "Ссылка" } },
        },
      },
      StandardAttribute: {
        name: "СтандартныйРеквизит",
        fields: {
          PredefinedDataName: "ИмяПредопределенныхДанных",
          Predefined: "Предопределенный",
          Ref: "Ссылка",
          DeletionMark: "ПометкаУдаления",
          IsFolder: "ЭтоГруппа",
          Owner: "Владелец",
          Parent: "Родитель",
          Description: "Наименование",
          Code: "Код",
        },
      },
    },
  },
  ChartOfCalculationTypes: {
    name: "ПланВидовРасчета",
    includeToType: "Both",
  },
  Enum: {
    name: "Перечисление",
    includeToType: "Ref",
  },
  DefinedType: {
    name: "ОпределяемыйТип",
    includeToType: "Save",
  },
  Characteristic: {
    name: "Характеристика",
    includeToType: "Save",
  },
  CommandGroup: {
    name: "ГруппаКоманд",
    includeToType: "Save",
  },
} as const

export const MetadataFieldsRulesFromYAML = swapMetadataFieldsRulesKeys(MetadataFieldsRulesToYAML)!

export const MetadataTypesRulesToYAML = createMetadataTypesRules(MetadataFieldsRulesToYAML)!
export const MetadataTypesRulesFromYAML = swapMetadataFieldsRulesKeys(MetadataTypesRulesToYAML)!

export const MetadataValuesRulesToYAML = createMetadataValuesRules(MetadataFieldsRulesToYAML)!
export const MetadataValuesRulesFromYAML = swapMetadataFieldsRulesKeys(MetadataValuesRulesToYAML)!

export const DataPathJSONSchema = Type.String()
export type DataPathYAML = Static<typeof DataPathJSONSchema>
