export type TypeModifier = "complex" | "typeset" | "alwaysType"

export interface TypeDescriptionRule {
  enterprise: string
  prefix: string
  namespace?: string
  modifier?: TypeModifier
  ignoreInPreview?: boolean
}

export const TypeDescriptionRules: Record<string, TypeDescriptionRule> = {
  SpreadsheetDocument: {
    enterprise: "ТабличныйДокумент",
    prefix: "mxl",
    namespace: "http://v8.1c.ru/8.2/data/spreadsheet",
  },
  // Data Analysis namespace
  AssociationRulesDataSourceType: {
    enterprise: "AssociationRulesDataSourceType",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  AnalysisDataType: {
    enterprise: "ТипИсточникаДанныхПоискаАссоциаций",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisDistanceMetricType: {
    enterprise: "ТипМерыРасстоянияАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisColumnTypeAssociationRules: {
    enterprise: "ТипКолонкиАнализаДанныхПоискАссоциаций",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisResultTableFillType: {
    enterprise: "ТипЗаполненияТаблицыРезультатаАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisNumericValueUseType: {
    enterprise: "ТипИспользованияЧисловыхЗначенийАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DecisionTreeSimplificationType: {
    enterprise: "ТипУпрощенияДереваРешений",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisColumnTypeDecisionTree: {
    enterprise: "ТипКолонкиАнализаДанныхДеревоРешений",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisSequentialPatternsOrderType: {
    enterprise: "ТипУпорядочиванияШаблоновПоследовательностейАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisTimeIntervalUnitType: {
    enterprise: "ТипЕдиницыИнтервалаВремениАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisColumnTypeSequentialPatterns: {
    enterprise: "ТипКолонкиАнализаДанныхПоискПоследовательностей",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisStandardizationType: {
    enterprise: "ТипСтандартизацииАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  PredictionModelColumnType: {
    enterprise: "ТипКолонкиМоделиПрогноза",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  ClusterizationMethod: {
    enterprise: "МетодКластеризации",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisAssociationRulesOrderType: {
    enterprise: "ТипУпорядочиванияПравилАссоциацииАнализаДанных",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisColumnTypeSummaryStatistics: {
    enterprise: "ТипКолонкиАнализаДанныхОбщаяСтатистика",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  AssociationRulesPruneType: {
    enterprise: "ТипОтсеченияПравилАссоциации",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  DataAnalysisColumnTypeClusterization: {
    enterprise: "ТипКолонкиАнализаДанныхКластеризация",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/data-analysis",
  },
  // Chart namespace
  Dendrogram: {
    enterprise: "Дендрограмма",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/chart",
  },
  Chart: {
    enterprise: "Диаграмма",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/chart",
  },
  GanttChart: {
    enterprise: "ДиаграммаГанта",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/chart",
  },
  // Graph Scheme namespace
  FlowchartContextType: {
    enterprise: "ГрафическаяСхема",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/graphscheme",
  },
  // Text Editor namespace
  TextDocument: {
    enterprise: "ТекстовыйДокумент",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.1/data/txtedt",
  },
  // Geographic namespace
  GeographicalSchema: {
    enterprise: "ГеографическаяСхема",
    prefix: "d5p1",
    namespace: "http://v8.1c.ru/8.2/data/geo",
  },
  // Formatted Document namespace
  FormattedDocument: {
    enterprise: "ФорматированныйДокумент",
    prefix: "fd",
    namespace: "http://v8.1c.ru/8.2/data/formatted-document",
  },
  // Planner namespace
  Planner: {
    enterprise: "Планировщик",
    prefix: "pl",
    namespace: "http://v8.1c.ru/8.3/data/planner",
  },
  // PDF namespace
  PDFDocument: {
    enterprise: "ДокументPDF",
    prefix: "pdfdoc",
    namespace: "http://v8.1c.ru/8.3/data/pdf",
  },
  // UI namespace (no xmlns in XML)
  FormattedString: {
    enterprise: "ФорматированнаяСтрока",
    prefix: "v8ui",
  },
  HorizontalAlign: {
    enterprise: "ГоризонтальноеПоложение",
    prefix: "v8ui",
  },
  VerticalAlign: {
    enterprise: "ВертикальноеПоложение",
    prefix: "v8ui",
  },
  SizeChangeMode: {
    enterprise: "РежимИзмененияРазмера",
    prefix: "v8ui",
  },
  Color: {
    enterprise: "Цвет",
    prefix: "v8ui",
  },
  Font: {
    enterprise: "Шрифт",
    prefix: "v8ui",
  },
  Picture: {
    enterprise: "Картинка",
    prefix: "v8ui",
  },
  // Enterprise namespace (no xmlns in XML)
  AccumulationRecordType: {
    enterprise: "ВидДвиженияНакопления",
    prefix: "ent",
  },
  AccountingRecordType: {
    enterprise: "ВидДвиженияБухгалтерии",
    prefix: "ent",
  },
  AccountType: {
    enterprise: "ВидСчета",
    prefix: "ent",
  },
  // Settings Composer namespace (no xmlns in XML)
  SettingsComposer: {
    enterprise: "КомпоновщикНастроекКомпоновкиДанных",
    prefix: "dcsset",
  },
  Filter: {
    enterprise: "Отбор",
    prefix: "dcsset",
  },
  // Primitive types
  string: {
    enterprise: "Строка",
    prefix: "xs",
  },
  decimal: {
    enterprise: "Число",
    prefix: "xs",
  },
  dateTime: {
    enterprise: "ДатаВремя",
    prefix: "xs",
  },
  date: {
    enterprise: "Дата",
    prefix: "xs",
  },
  boolean: {
    enterprise: "Булево",
    prefix: "xs",
  },
  ValueStorage: {
    enterprise: "ХранилищеЗначения",
    prefix: "v8",
  },
  Null: {
    enterprise: "Null",
    prefix: "v8",
  },
  UUID: {
    enterprise: "УникальныйИдентификатор",
    prefix: "v8",
  },
  TypeDescription: {
    enterprise: "ОписаниеТипов",
    prefix: "v8",
  },
  StandardPeriod: {
    enterprise: "СтандартныйПериод",
    prefix: "v8",
  },
  StandardBeginningDate: {
    enterprise: "СтандартнаяДатаНачала",
    prefix: "v8",
  },
  ValueTable: {
    enterprise: "ТаблицаЗначений",
    prefix: "v8",
  },
  ValueTree: {
    enterprise: "ДеревоЗначений",
    prefix: "v8",
  },
  ValueListType: {
    enterprise: "СписокЗначений",
    prefix: "v8",
  },
  DynamicList: {
    enterprise: "ДинамическийСписок",
    prefix: "cfg",
  },
  // TypeSet types (cfg: prefix)
  CatalogRef: {
    enterprise: "Справочник",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  CatalogObject: {
    enterprise: "СправочникОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  DocumentRef: {
    enterprise: "Документ",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  DocumentObject: {
    enterprise: "ДокументОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  EnumRef: {
    enterprise: "Перечисление",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  DefinedType: {
    enterprise: "ОпределяемыйТип",
    prefix: "cfg",
    modifier: "typeset",
    ignoreInPreview: true,
  },
  Characteristic: {
    enterprise: "Характеристика",
    prefix: "cfg",
    modifier: "typeset",
    ignoreInPreview: true,
  },
  ExchangePlanRef: {
    enterprise: "ПланОбмена",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ExchangePlanObject: {
    enterprise: "ПланОбменаОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  BusinessProcessRoutePointRef: {
    enterprise: "ТочкаМаршрутаБизнесПроцесса",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  BusinessProcessRoutePointObject: {
    enterprise: "ТочкаМаршрутаБизнесПроцессаОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  BusinessProcessRef: {
    enterprise: "БизнесПроцесс",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  BusinessProcessObject: {
    enterprise: "БизнесПроцессОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  AnyIBRef: {
    enterprise: "ЛюбаяСсылка",
    prefix: "cfg",
    modifier: "typeset",
  },
  ChartOfCalculationTypesRef: {
    enterprise: "ПланВидовРасчета",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ChartOfCalculationTypesObject: {
    enterprise: "ПланВидовРасчетаОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  TaskRef: {
    enterprise: "Задача",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  TaskObject: {
    enterprise: "ЗадачаОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ChartOfCharacteristicTypesRef: {
    enterprise: "ПланВидовХарактеристик",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ChartOfCharacteristicTypesObject: {
    enterprise: "ПланВидовХарактеристикОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ChartOfAccountsRef: {
    enterprise: "ПланСчетов",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ChartOfAccountObject: {
    enterprise: "ПланСчетовОбъект",
    prefix: "cfg",
    modifier: "complex",
    ignoreInPreview: true,
  },
  ReportObject: {
    enterprise: "ОтчетОбъект",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
  DataProcessorObject: {
    enterprise: "ОбработкаОбъект",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
  ConstantsSet: {
    enterprise: "КонстантыНабор",
    prefix: "cfg",
    ignoreInPreview: true,
  },
  InformationRegisterRecordSet: {
    enterprise: "РегистрСведенийНаборЗаписей",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
  InformationRegisterRecordManager: {
    enterprise: "РегистрСведенийМенеджерЗаписи",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
  AccountingRegisterRecordSet: {
    enterprise: "РегистрБухгалтерииНаборЗаписей",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
  AccountingRegisterRecordManager: {
    enterprise: "РегистрБухгалтерииМенеджерЗаписи",
    prefix: "cfg",
    modifier: "alwaysType",
    ignoreInPreview: true,
  },
} as const

export const TypeDescriptionPrefixes = Object.fromEntries(
  Object.values(TypeDescriptionRules).map((settings) => [settings.prefix, settings.prefix])
) as Record<string, string>

export const TypeDescriptionRulesFromEnterprise = Object.fromEntries(
  Object.values(TypeDescriptionRules).map((settings) => [settings.enterprise, settings])
) as Record<string, TypeDescriptionRule>

export type TypeDescriptionTypeWithNamespaceXML<TNamespace extends string = string> = {
  [K in `_xmlns:${TNamespace}`]: string
} & {
  "#text": string
}

export type TypeDescriptionXMLType = string | TypeDescriptionTypeWithNamespaceXML

export interface TypeDescriptionXMLStringQualifiers {
  "v8:Length": number
  "v8:AllowedLength": "Variable" | "Fixed"
}

export interface TypeDescriptionXMLNumberQualifiers {
  "v8:Digits": number
  "v8:FractionDigits": number
  "v8:AllowedSign": "Any" | "Nonnegative"
}

export interface TypeDescriptionXMLDateQualifiers {
  "v8:DateFractions"?: "Date" | "Time" | "DateTime"
}

export type TypeDescriptionXML = {
  "v8:Type"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:TypeSet"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:StringQualifiers"?: TypeDescriptionXMLStringQualifiers
  "v8:NumberQualifiers"?: TypeDescriptionXMLNumberQualifiers
  "v8:DateQualifiers"?: TypeDescriptionXMLDateQualifiers
}

export interface TypeDescriptionStringQualifiers {
  length: number
  allowedLength: "Variable" | "Fixed"
}

export interface TypeDescriptionNumberQualifiers {
  digits: number
  fractionDigits: number
  allowedSign: "Any" | "Nonnegative"
}

export interface TypeDescriptionDateQualifiers {
  dateFractions?: "Date" | "Time" | "DateTime"
}

export const PrimitiveTypeToEnterprise = {
  string: "Строка",
  decimal: "Число",
  date: "Дата",
  boolean: "Булево",
  ValueStorage: "ХранилищеЗначения",
} as const

export const PrimitiveTypeFromEnterprise = (name: string): PrimitiveType => {
  return Object.keys(PrimitiveTypeToEnterprise).find(
    (key) => PrimitiveTypeToEnterprise[key as keyof typeof PrimitiveTypeToEnterprise] === name
  ) as PrimitiveType
}

export type PrimitiveType = keyof typeof PrimitiveTypeToEnterprise
export type PrimitiveTypeEnterprise = (typeof PrimitiveTypeToEnterprise)[keyof typeof PrimitiveTypeToEnterprise]

export type TypeDescriptionType = string

export interface TypeDescription {
  type: TypeDescriptionType[]
  stringQualifiers?: TypeDescriptionStringQualifiers
  numberQualifiers?: TypeDescriptionNumberQualifiers
  dateQualifiers?: TypeDescriptionDateQualifiers
}

export type TypeDescriptionEnterprise = string | string[]

//#region Preview

export interface TypeDescriptionPreviewStringQualifiers {
  Length: number
  AllowedLength: "Variable" | "Fixed"
}

export interface TypeDescriptionPreviewNumberQualifiers {
  Digits: number
  FractionDigits: number
  AllowedSign: "Any" | "Nonnegative"
}

export interface TypeDescriptionPreviewDateQualifiers {
  DateFractions?: "Date" | "Time" | "DateTime"
}

export type TypeDescriptionPreviewType = string

export interface TypeDescriptionPreview {
  Type: TypeDescriptionPreviewType[]
  StringQualifiers?: TypeDescriptionPreviewStringQualifiers
  NumberQualifiers?: TypeDescriptionPreviewNumberQualifiers
  DateQualifiers?: TypeDescriptionPreviewDateQualifiers
}

//#endregion
