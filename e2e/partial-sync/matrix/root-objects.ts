import type {
  RootObjectDeclaration,
  ScenarioFileChange,
} from "./types"

const prefix = "ПроверкаЧастичнойСинхронизации"

export const matrixObjectNames = {
  businessProcess: `${prefix}БизнесПроцесс`,
  calculationRegister: `Я${prefix}РегистрРасчета`,
  catalog: `${prefix}Справочник`,
  chartOfCalculationTypes: `${prefix}ПланВидовРасчета`,
  commonModule: `${prefix}ОбщийМодуль`,
  constant: `${prefix}Константа`,
  document: `${prefix}Документ`,
  task: `${prefix}Задача`,
} as const

export const matrixChildInsertionAnchors: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "object:catalog": {
    Предопределенные: "Реквизиты",
  },
  "object:chart-of-accounts": {
    Предопределенные: "Реквизиты",
  },
  "object:chart-of-calculation-types": {
    Предопределенные: "Реквизиты",
  },
  "object:chart-of-characteristic-types": {
    Реквизиты: "ТипЗначения",
    ТабличныеЧасти: "ТипЗначения",
    Предопределенные: "Реквизиты",
  },
  "object:task": {
    РеквизитыАдресации: "ТабличныеЧасти",
  },
  "object:document-journal": {
    Графы: "РегистрируемыеДокументы",
  },
  "object:information-register": registerFieldInsertionAnchors(),
  "object:accumulation-register": registerFieldInsertionAnchors(),
  "object:accounting-register": registerFieldInsertionAnchors(),
  "object:calculation-register": {
    Измерения: "ПланВидовРасчета",
    Реквизиты: "Ресурсы",
  },
}

export const rootObjectDeclarations = [
  directoryRoot("object:catalog", "MetadataCatalog", "Справочник", "Справочник"),
  directoryRoot(
    "object:document",
    "MetadataDocument",
    "Документ",
    "Документ",
    "КонтрольУникальности: Истина\nПериодичностьНомера: Непериодический\n",
  ),
  directoryRoot("object:data-processor", "MetadataDataProcessor", "Обработка", "Обработка"),
  directoryRoot(
    "object:report",
    "MetadataReport",
    "Отчет",
    "Отчет",
    "ВключатьСправкуВСодержание: Ложь\nИспользоватьСтандартныеКоманды: Истина\n",
  ),
  directoryRoot(
    "object:document-journal",
    "MetadataDocumentJournal",
    "ЖурналДокументов",
    "ЖурналДокументов",
    `РегистрируемыеДокументы:\n  - ${matrixObjectNames.document}\n`,
    ["object:document"],
  ),
  directoryRoot(
    "object:http-service",
    "MetadataHTTPService",
    "HTTPСервис",
    "HTTPСервис",
    "КорневойURL: partial-sync\n",
  ),
  directoryRoot(
    "object:information-register",
    "MetadataInformationRegister",
    "РегистрСведений",
    "РегистрСведений",
  ),
  directoryRoot(
    "object:accumulation-register",
    "MetadataAccumulationRegister",
    "РегистрНакопления",
    "РегистрНакопления",
  ),
  directoryRoot("object:exchange-plan", "MetadataExchangePlan", "ПланОбмена", "ПланОбмена"),
  fileRoot(
    "object:document-numerator",
    "MetadataDocumentNumerator",
    "Нумератор",
    "Нумератор",
    "КонтрольУникальности: Истина\nПериодичностьНомера: Непериодический\n",
  ),
  directoryRoot("object:enumeration", "MetadataEnumeration", "Перечисление", "Перечисление"),
  directoryRoot(
    "object:sequence",
    "MetadataSequence",
    "Последовательность",
    "Последовательность",
    `Документы:\n  - Документ.${matrixObjectNames.document}\n`,
    ["object:document"],
  ),
  fileRoot(
    "object:defined-type",
    "MetadataDefinedType",
    "ОпределяемыйТип",
    "ОпределяемыйТип",
    "Тип: Строка(10)\n",
  ),
  fileRoot(
    "object:session-parameter",
    "MetadataSessionParameter",
    "ПараметрСеанса",
    "ПараметрСеанса",
    "Тип: Строка(10)\n",
  ),
  fileRoot(
    "object:event-subscription",
    "MetadataEventSubscription",
    "ПодпискаНаСобытие",
    "ПодпискаНаСобытие",
    [
      `Источник: СправочникОбъект.${matrixObjectNames.catalog}`,
      `Обработчик: CommonModule.${matrixObjectNames.commonModule}.ОбработатьСобытие`,
      "Событие: OnSetNewCode",
      "",
    ].join("\n"),
    ["object:catalog", "object:common-module"],
  ),
  directoryRoot("object:filter-criterion", "MetadataFilterCriterion", "КритерийОтбора", "КритерийОтбора"),
  fileRoot(
    "object:functional-option",
    "MetadataFunctionalOption",
    "ФункциональнаяОпция",
    "ФункциональнаяОпция",
    `Размещение: Константа.${matrixObjectNames.constant}\n`,
    ["object:constant"],
  ),
  fileRoot(
    "object:functional-options-parameter",
    "MetadataFunctionalOptionsParameter",
    "ПараметрФункциональныхОпций",
    "ПараметрФункциональныхОпций",
    `Использование:\n  - Справочник.${matrixObjectNames.catalog}\n`,
    ["object:catalog"],
  ),
  directoryRoot("object:role", "MetadataRole", "Роль", "Роль", "", [], [{
    path: "Rights.xml",
    contents: minimalRights(),
  }]),
  directoryRoot(
    "object:scheduled-job",
    "MetadataScheduledJob",
    "РегламентноеЗадание",
    "РегламентноеЗадание",
    `ИмяМетода: CommonModule.${matrixObjectNames.commonModule}.ВыполнитьРегламентноеЗадание\n`,
    ["object:common-module"],
  ),
  fileRoot("object:language", "MetadataLanguage", "Язык", "Язык", "КодЯзыка: zz\n"),
  directoryRoot("object:common-template", "MetadataCommonTemplate", "ОбщийМакет", "ОбщийМакет"),
  directoryRoot(
    "object:common-module",
    "MetadataCommonModule",
    "ОбщийМодуль",
    "ОбщийМодуль",
    "ПовторноеИспользованиеВозвращаемыхЗначений: НеИспользовать\n",
    [],
    [{ path: "Модуль.bsl", contents: commonModuleSource() }],
  ),
  directoryRoot(
    "object:xdto-package",
    "MetadataXDTOPackage",
    "ПакетXDTO",
    "ПакетXDTO",
    "ПространствоИмен: http://example.org/partial-sync/xdto\n",
  ),
  directoryRoot("object:websocket-client", "MetadataWebSocketClient", "WebSocketКлиент", "WebSocketКлиент"),
  directoryRoot(
    "object:external-data-source",
    "MetadataExternalDataSource",
    "ВнешнийИсточникДанных",
    "ВнешнийИсточникДанных",
  ),
  directoryRoot(
    "object:common-form",
    "MetadataCommonForm",
    "ОбщаяФорма",
    "ОбщаяФорма",
    "НазначенияИспользования: ПлатформаИМобильноеПриложение\n",
  ),
  directoryRoot("object:common-picture", "MetadataCommonPicture", "ОбщаяКартинка", "ОбщаяКартинка"),
  directoryRoot("object:style", "MetadataStyle", "Стиль", "Стиль"),
  directoryRoot(
    "object:common-command",
    "MetadataCommonCommand",
    "ОбщаяКоманда",
    "ОбщаяКоманда",
    "Группа: КоманднаяПанельФормыВажное\n",
    [],
    [{ path: "Модуль.bsl", contents: commonCommandSource() }],
  ),
  fileRoot("object:command-group", "MetadataCommandGroup", "ГруппаКоманд", "ГруппаКоманд"),
  directoryRoot(
    "object:constant",
    "MetadataConstant",
    "Константа",
    "Константа",
    "Тип: Булево\n",
  ),
  directoryRoot("object:subsystem", "MetadataSubsystem", "Подсистема", "Подсистема"),
  directoryRoot(
    "object:accounting-register",
    "MetadataAccountingRegister",
    "РегистрБухгалтерии",
    "РегистрБухгалтерии",
  ),
  directoryRoot("object:settings-storage", "MetadataSettingsStorage", "ХранилищеНастроек", "ХранилищеНастроек"),
  fileRoot(
    "object:style-item",
    "MetadataStyleItem",
    "ЭлементСтиля",
    "ЭлементСтиля",
    "Тип: Цвет\nЗначение:\n  Вид: Цвет\n  Значение: \"#345678\"\n",
  ),
  fileRoot(
    "object:common-attribute",
    "MetadataCommonAttribute",
    "ОбщийРеквизит",
    "ОбщийРеквизит",
    "Тип: Строка(10)\nЗначениеЗаполнения: \"\"\nРазделениеДанных: НеИспользовать\n",
  ),
  directoryRoot(
    "object:business-process",
    "MetadataBusinessProcess",
    "БизнесПроцесс",
    "БизнесПроцесс",
    `Задача: ${matrixObjectNames.task}\n`,
    ["object:task"],
  ),
  directoryRoot(
    "object:calculation-register",
    "MetadataCalculationRegister",
    "РегистрРасчета",
    "РегистрРасчета",
    `ПланВидовРасчета: ChartOfCalculationTypes.${matrixObjectNames.chartOfCalculationTypes}\n`,
    ["object:chart-of-calculation-types"],
    [],
    matrixObjectNames.calculationRegister,
  ),
  directoryRoot("object:chart-of-accounts", "MetadataChartOfAccounts", "ПланСчетов", "ПланСчетов"),
  directoryRoot(
    "object:chart-of-calculation-types",
    "MetadataChartOfCalculationTypes",
    "ПланВидовРасчета",
    "ПланВидовРасчета",
  ),
  directoryRoot(
    "object:chart-of-characteristic-types",
    "MetadataChartOfCharacteristicTypes",
    "ПланВидовХарактеристик",
    "ПланВидовХарактеристик",
    "ТипЗначения: Строка(10)\n",
  ),
  directoryRoot("object:bot", "MetadataBot", "Бот", "Бот"),
  directoryRoot("object:integration-service", "MetadataIntegrationService", "СервисИнтеграции", "СервисИнтеграции"),
  directoryRoot(
    "object:task",
    "MetadataTask",
    "Задача",
    "Задача",
    "КонтрольУникальности: Истина\n",
  ),
  directoryRoot(
    "object:web-service",
    "MetadataWebService",
    "WebСервис",
    "WebСервис",
    "ИмяФайлаДескриптора: partial-sync.1cws\nПространствоИмен: http://example.org/partial-sync/ws\n",
  ),
  directoryRoot(
    "object:ws-reference",
    "MetadataWSReference",
    "WSСсылка",
    "WSСсылка",
    "URL: http://example.org/partial-sync/service?wsdl\n",
    [],
    [{ path: "WSDefinition.xml", contents: minimalWsdl() }],
  ),
] satisfies readonly RootObjectDeclaration[]

type ExtraFile = { readonly path: string; readonly contents: string | Uint8Array }

function directoryRoot(
  key: string,
  itemType: string,
  segment: string,
  suffix: string,
  properties = "",
  dependsOn: readonly string[] = [],
  extraFiles: readonly ExtraFile[] = [],
  explicitName?: string,
): RootObjectDeclaration {
  const name = explicitName ?? `${prefix}${suffix}`
  const root = `${segment}/${name}`
  return {
    key,
    itemType,
    name,
    dependsOn,
    changes: [
      createFile(`${root}/Свойства.yaml`, properties),
      ...extraFiles.map(({ path, contents }) => createFile(`${root}/${path}`, contents)),
    ],
  }
}

function fileRoot(
  key: string,
  itemType: string,
  segment: string,
  suffix: string,
  properties = "",
  dependsOn: readonly string[] = [],
): RootObjectDeclaration {
  const name = `${prefix}${suffix}`
  return {
    key,
    itemType,
    name,
    dependsOn,
    changes: [createFile(`${segment}/${name}.yaml`, properties)],
  }
}

function createFile(path: string, after: string | Uint8Array): ScenarioFileChange {
  return { path, before: null, after }
}

function commonModuleSource(): string {
  return `Процедура ОбработатьСобытие(Источник) Экспорт
КонецПроцедуры

Процедура ВыполнитьРегламентноеЗадание() Экспорт
КонецПроцедуры
`
}

function commonCommandSource(): string {
  return `&НаКлиенте
Процедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)
КонецПроцедуры
`
}

function minimalRights(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Rights xmlns="http://v8.1c.ru/8.2/roles" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Rights" version="2.20">
  <setForNewObjects>false</setForNewObjects>
  <setForAttributesByDefault>true</setForAttributesByDefault>
  <independentRightsOfChildObjects>false</independentRightsOfChildObjects>
</Rights>
`
}

function minimalWsdl(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap12bind="http://schemas.xmlsoap.org/wsdl/soap12/"
  xmlns:soapbind="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://example.org/partial-sync"
  xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"
  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsd1="http://example.org/partial-sync"
  targetNamespace="http://example.org/partial-sync">
  <types>
    <xsd:schema xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" targetNamespace="http://example.org/partial-sync" />
  </types>
  <portType name="PartialSyncPort" />
  <binding name="PartialSyncBinding" type="tns:PartialSyncPort">
    <soapbind:binding style="document" transport="http://schemas.xmlsoap.org/soap/http" />
  </binding>
  <service name="PartialSyncService">
    <port name="PartialSyncPort" binding="tns:PartialSyncBinding">
      <soapbind:address location="http://example.org/partial-sync" />
    </port>
  </service>
</definitions>
`
}

function registerFieldInsertionAnchors(): Readonly<Record<string, string>> {
  return {
    Измерения: "Ресурсы",
    Реквизиты: "Ресурсы",
  }
}
