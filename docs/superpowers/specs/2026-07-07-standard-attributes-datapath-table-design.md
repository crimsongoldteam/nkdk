# Таблица стандартных реквизитов для DataPath

## Цель

Собрать текущие стандартные реквизиты в одну рабочую таблицу и постепенно описывать для них декларативные правила типов. Таблица нужна для резолвера `DataPath`, валидации и перевода путей между внутренним представлением и YAML.

## Общее правило

Если тип стандартного реквизита явно описан декларацией или задан явным `Тип` в описании реквизита, переводчик `DataPath` может опираться на него, переводить имя сегмента и продолжать разбор пути.

Если тип не определен, переводчик останавливается на этом сегменте и оставляет остаток пути без изменений. Валидатор на первом этапе не выдает ошибок по дальнейшему пути после такого реквизита.

## Таблица

| Объект | Внутреннее имя | YAML | Источник сейчас | Правило типа | Спецификация | Разобрано |
| --- | --- | --- | --- | --- | --- | --- |
| Общие объектные | Ref | Ссылка | `dataPathCommon` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Общие объектные | Parent | Родитель | `dataPathCommon` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Общие объектные | Owner | Владелец | `dataPathCommon` | ссылки из свойства `owners`, составной тип при нескольких владельцах | `dataPath: { family: "objectRefsFromProperty", property: "owners" }` | - [x] |
| Общие объектные | DeletionMark | ПометкаУдаления | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Общие объектные | Predefined | Предопределенный | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Общие объектные | PredefinedDataName | ИмяПредопределенныхДанных | имена в rules | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| Общие объектные | Description | Наименование / Описание | имена в rules | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| Общие объектные | Code | Код | имена в rules | зависит от свойства владельца (`codeType` и аналоги) | `dataPath: { family: "codeByProperty", property: "codeType" }` | - [x] |
| Общие объектные | IsFolder | ЭтоГруппа | имена в rules | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Общие объектные | Date | Дата | имена в rules | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Общие объектные | Posted | Проведен | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Табличная часть | LineNumber | НомерСтроки | `metadataTabularSection`, `dataPathCommon` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Справочник | Ref | Ссылка | `MetadataCatalogStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Справочник | Owner | Владелец | `MetadataCatalogStandardAttributeNames` | `owners` | `dataPath: { family: "objectRefsFromProperty", property: "owners" }` | - [x] |
| Справочник | Code | Код | `MetadataCatalogStandardAttributeNames` | `codeType` | `dataPath: { family: "codeByProperty", property: "codeType" }` | - [x] |
| Справочник | Description | Наименование | `MetadataCatalogStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| Справочник | Parent | Родитель | `MetadataCatalogStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Справочник | IsFolder | ЭтоГруппа | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Справочник | DeletionMark | ПометкаУдаления | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Справочник | Predefined | Предопределенный | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Справочник | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataCatalogStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| Документ | Ref | Ссылка | `MetadataDocumentStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Документ | Date | Дата | `MetadataDocumentStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Документ | Number | Номер | `MetadataDocumentStandardAttributeNames` | зависит от свойства `numberType` (`DocumentNumberType`) | `dataPath: { family: "numberByProperty", property: "numberType" }` | - [x] |
| Документ | Posted | Проведен | `MetadataDocumentStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Документ | DeletionMark | ПометкаУдаления | `MetadataDocumentStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Перечисление | Ref | Ссылка | `MetadataEnumerationStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Перечисление | Order | Порядок | `MetadataEnumerationStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| План счетов | Ref | Ссылка | `MetadataChartOfAccountsStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План счетов | Code | Код | `MetadataChartOfAccountsStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План счетов | Description | Наименование | `MetadataChartOfAccountsStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План счетов | Parent | Родитель | `MetadataChartOfAccountsStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План счетов | Type | Вид | `MetadataChartOfAccountsStandardAttributeNames` | стандартное перечисление `ВидСчета` | `dataPath: { family: "standardEnum", name: "AccountType" }` | - [x] |
| План счетов | OffBalance | Забалансовый | `MetadataChartOfAccountsStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | Order | Порядок | `MetadataChartOfAccountsStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План счетов | DeletionMark | ПометкаУдаления | `MetadataChartOfAccountsStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | Predefined | Предопределенный | `MetadataChartOfAccountsStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfAccountsStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План видов характеристик | Ref | Ссылка | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План видов характеристик | ValueType | ТипЗначения | `dataPathCommon` | `ОписаниеТипов` (`TypeDescription`), вложенные свойства недоступны | `dataPath: { family: "typeDescription", allowNestedProperties: false }` | - [x] |
| План видов характеристик | Code | Код | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План видов характеристик | Description | Наименование | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План видов характеристик | Parent | Родитель | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План видов характеристик | IsFolder | ЭтоГруппа | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов характеристик | DeletionMark | ПометкаУдаления | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов характеристик | Predefined | Предопределенный | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов характеристик | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План видов расчета | Ref | Ссылка | `MetadataChartOfCalculationTypesStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План видов расчета | Code | Код | `MetadataChartOfCalculationTypesStandardAttributeNames` | зависит от свойства `codeType` (`ChartOfCalculationTypesCodeType`) | `dataPath: { family: "codeByProperty", property: "codeType" }` | - [x] |
| План видов расчета | Description | Наименование | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План видов расчета | ActionPeriodIsBasic | ПериодДействияБазовый | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов расчета | DeletionMark | ПометкаУдаления | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов расчета | Predefined | Предопределенный | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План видов расчета | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План обмена | Ref | Ссылка | `MetadataExchangePlanStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| План обмена | Code | Код | `MetadataExchangePlanStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План обмена | Description | Наименование | `MetadataExchangePlanStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| План обмена | ThisNode | ЭтотУзел | `MetadataExchangePlanStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| План обмена | ExchangeDate | ДатаОбмена | `MetadataExchangePlanStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| План обмена | SentNo | НомерОтправленного | `dataPathCommon` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| План обмена | ReceivedNo | НомерПринятого | `dataPathCommon` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| План обмена | DeletionMark | ПометкаУдаления | `MetadataExchangePlanStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Журнал документов | Ref | Ссылка | `MetadataDocumentJournalStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Журнал документов | Type | Тип | `MetadataDocumentJournalStandardAttributeNames` | `Тип`, дальше не раскрывается | `dataPath: { family: "opaque", name: "Type", allowNestedProperties: false }` | - [x] |
| Журнал документов | Date | Дата | `MetadataDocumentJournalStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Журнал документов | Number | Номер | `MetadataDocumentJournalStandardAttributeNames` | на первом этапе строка без раскрытия; реально зависит от типов номеров документов, входящих в журнал | `dataPath: { family: "primitive", kind: "string", note: "realTypeDependsOnJournalDocuments", allowNestedProperties: false }` | - [x] |
| Журнал документов | Posted | Проведен | `MetadataDocumentJournalStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Журнал документов | DeletionMark | ПометкаУдаления | `MetadataDocumentJournalStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Бизнес-процесс | Ref | Ссылка | `MetadataBusinessProcessStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Бизнес-процесс | Date | Дата | `MetadataBusinessProcessStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Бизнес-процесс | Number | Номер | `MetadataBusinessProcessStandardAttributeNames` | зависит от свойства `numberType` (`BusinessProcessNumberType`) | `dataPath: { family: "numberByProperty", property: "numberType" }` | - [x] |
| Бизнес-процесс | Started | Стартован | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Бизнес-процесс | Completed | Завершен | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Бизнес-процесс | HeadTask | ГоловнаяЗадача | `MetadataBusinessProcessStandardAttributeNames` | задача из свойства `task` | `dataPath: { family: "objectRefFromProperty", property: "task" }` | - [x] |
| Бизнес-процесс | DeletionMark | ПометкаУдаления | `MetadataBusinessProcessStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Задача | Ref | Ссылка | `MetadataTaskStandardAttributeNames` | ссылка на сам объект | `dataPath: { family: "sameOwnerObject" }` | - [x] |
| Задача | Date | Дата | `MetadataTaskStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Задача | Number | Номер | `MetadataTaskStandardAttributeNames` | зависит от свойства `numberType` (`TaskNumberType`) | `dataPath: { family: "numberByProperty", property: "numberType" }` | - [x] |
| Задача | Executed | Выполнена | `dataPathCommon` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Задача | BusinessProcess | БизнесПроцесс | `metadataTask/register.ts` | бизнес-процессы, у которых в свойствах задач установлена эта задача; при нескольких значениях вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "BusinessProcess", property: "tasks", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |
| Задача | RoutePoint | ТочкаМаршрута | `metadataTask/register.ts` | `ТочкаМаршрутаБизнесПроцесса` бизнес-процессов, у которых указана эта задача; дальше не раскрывается | `dataPath: { family: "closedReverseLookup", result: "BusinessProcessRoutePoint", source: "businessProcessesByTask", empty: "error", allowNestedProperties: false }` | - [x] |
| Задача | Description | Описание | `MetadataTaskStandardAttributeNames` | строка | `dataPath: { family: "primitive", kind: "string" }` | - [x] |
| Задача | DeletionMark | ПометкаУдаления | `MetadataTaskStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр сведений | Active | Активность | `MetadataInformationRegisterStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр сведений | LineNumber | НомерСтроки | `MetadataInformationRegisterStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр сведений | Recorder | Регистратор | `MetadataInformationRegisterStandardAttributeNames` | документы, у которых в `registerRecords` есть этот регистр; при нескольких регистраторах вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "Document", property: "registerRecords", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |
| Регистр сведений | Period | Период | `MetadataInformationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр накопления | RecordType | ВидДвижения | `MetadataAccumulationRegisterStandardAttributeNames` | стандартное перечисление `ВидДвиженияНакопления` | `dataPath: { family: "standardEnum", name: "AccumulationRecordType" }` | - [x] |
| Регистр накопления | Active | Активность | `MetadataAccumulationRegisterStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр накопления | LineNumber | НомерСтроки | `MetadataAccumulationRegisterStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр накопления | Recorder | Регистратор | `MetadataAccumulationRegisterStandardAttributeNames` | документы, у которых в `registerRecords` есть этот регистр; при нескольких регистраторах вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "Document", property: "registerRecords", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |
| Регистр накопления | Period | Период | `MetadataAccumulationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр накопления оборотов | Active | Активность | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр накопления оборотов | LineNumber | НомерСтроки | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр накопления оборотов | Recorder | Регистратор | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | документы, у которых в `registerRecords` есть этот регистр; при нескольких регистраторах вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "Document", property: "registerRecords", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |
| Регистр накопления оборотов | Period | Период | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр бухгалтерии | PeriodAdjustment | УточнениеПериода | `MetadataAccountingRegisterStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр бухгалтерии | Account | Счет | `MetadataAccountingRegisterStandardAttributeNames` | счет из плана счетов, указанного в `chartOfAccounts` rules | `dataPath: { family: "objectRefFromRuleProperty", property: "chartOfAccounts" }` | - [x] |
| Регистр бухгалтерии | Active | Активность | `MetadataAccountingRegisterStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр бухгалтерии | LineNumber | НомерСтроки | `MetadataAccountingRegisterStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр бухгалтерии | Recorder | Регистратор | `MetadataAccountingRegisterStandardAttributeNames` | документы, у которых в `registerRecords` есть этот регистр; при нескольких регистраторах вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "Document", property: "registerRecords", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |
| Регистр бухгалтерии | Period | Период | `MetadataAccountingRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр бухгалтерии | ExtDimension1..50 | Субконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора; на первом этапе использование и раскрытие запрещены | `dataPath: { family: "unsupported", reason: "accountingRegisterExtDimension" }` | - [x] |
| Регистр бухгалтерии | ExtDimensionType1..50 | ВидСубконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора; на первом этапе использование и раскрытие запрещены | `dataPath: { family: "unsupported", reason: "accountingRegisterExtDimensionType" }` | - [x] |
| Регистр расчета | RegistrationPeriod | ПериодРегистрации | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | ReversingEntry | Сторно | `MetadataCalculationRegisterStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр расчета | Active | Активность | `MetadataCalculationRegisterStandardAttributeNames` | булево | `dataPath: { family: "primitive", kind: "boolean" }` | - [x] |
| Регистр расчета | BegOfActionPeriod | НачалоПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | EndOfActionPeriod | КонецПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | ActionPeriod | ПериодДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | BegOfBasePeriod | НачалоБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | EndOfBasePeriod | КонецБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | `dataPath: { family: "primitive", kind: "dateTime" }` | - [x] |
| Регистр расчета | CalculationType | ВидРасчета | `MetadataCalculationRegisterStandardAttributeNames` | вид расчета из плана видов расчета, указанного в `chartOfCalculationTypes` rules | `dataPath: { family: "objectRefFromRuleProperty", property: "chartOfCalculationTypes" }` | - [x] |
| Регистр расчета | LineNumber | НомерСтроки | `MetadataCalculationRegisterStandardAttributeNames` | число | `dataPath: { family: "primitive", kind: "number" }` | - [x] |
| Регистр расчета | Recorder | Регистратор | `MetadataCalculationRegisterStandardAttributeNames` | документы, у которых в `registerRecords` есть этот регистр; при нескольких регистраторах вложенные свойства недоступны | `dataPath: { family: "reverseLookup", target: "Document", property: "registerRecords", empty: "error", allowNestedPropertiesWhenMultiple: false }` | - [x] |

## Таблица стандартных табличных частей

Стандартные табличные части относятся к тем же платформенным членам объекта, что и стандартные реквизиты, но дают не поле значения, а `tableSource`. В rules они сейчас описаны через `standardTabularSections`, но скрыты из YAML (`toYAML: false`, `fromYAML: false`). На первом этапе они не выводятся в YAML как секции объекта и используются только для перевода и валидации `DataPath`.

| Объект | Табличная часть | YAML | Источник сейчас | Правило таблицы | Спецификация | Разобрано |
| --- | --- | --- | --- | --- | --- | --- |
| План счетов | ExtDimensionTypes | ВидыСубконто | `metadataChartOfAccounts/register.ts`, `StandardTabularSections` XML | стандартная табличная часть видов субконто | `dataPath: { memberKind: "standardTabularSection", family: "standardTable", tableKind: "ValueTable" }` | - [x] |
| План видов расчета | LeadingCalculationTypes | ВедущиеВидыРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | стандартная табличная часть ведущих видов расчета | `dataPath: { memberKind: "standardTabularSection", family: "standardTable", tableKind: "ValueTable" }` | - [x] |
| План видов расчета | DisplacingCalculationTypes | ВытесняющиеВидыРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | стандартная табличная часть вытесняющих видов расчета | `dataPath: { memberKind: "standardTabularSection", family: "standardTable", tableKind: "ValueTable" }` | - [x] |
| План видов расчета | BaseCalculationTypes | БазовыеВидыРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | стандартная табличная часть базовых видов расчета | `dataPath: { memberKind: "standardTabularSection", family: "standardTable", tableKind: "ValueTable" }` | - [x] |

## Таблица колонок стандартных табличных частей

| Объект | Табличная часть | Колонка | YAML | Источник сейчас | Правило типа | Спецификация | Разобрано |
| --- | --- | --- | --- | --- | --- | --- | --- |
| План счетов | ExtDimensionTypes | ExtDimensionType | ВидСубконто | `metadataChartOfAccounts/register.ts` | ссылка на план видов характеристик из свойства `extDimensionTypes` владельца | `dataPath: { memberKind: "standardTabularSectionColumn", family: "objectRefFromOwnerProperty", property: "extDimensionTypes" }` | - [x] |
| План счетов | ExtDimensionTypes | TurnoversOnly | ТолькоОбороты | `metadataChartOfAccounts/register.ts`, `StandardTabularSections` XML | булево | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | ExtDimensionTypes | ТолькоСальдо | ТолькоСальдо | `metadataChartOfAccounts/register.ts` | булево, русское имя используется как виртуальная колонка | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | ExtDimensionTypes | LineNumber | НомерСтроки | `StandardTabularSections` XML, общее правило табличных частей | число | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "number" }` | - [x] |
| План счетов | ExtDimensionTypes | Predefined | Предопределенный | `StandardTabularSections` XML | булево | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |
| План счетов | ExtDimensionTypes | ExtDimensionAccountingFlag.* | ПризнакУчетаСубконто.* | `metadataChartOfAccounts/register.ts`, имена из свойства `extDimensionAccountingFlags` | булево; имена колонок добавляются из коллекции признаков учета субконто | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean", discoveredFrom: "extDimensionAccountingFlags" }` | - [x] |
| План видов расчета | LeadingCalculationTypes | CalculationType | ВидРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | ссылка на тот же план видов расчета | `dataPath: { memberKind: "standardTabularSectionColumn", family: "sameOwnerObject" }` | - [x] |
| План видов расчета | LeadingCalculationTypes | LineNumber | НомерСтроки | `StandardTabularSections` XML, общее правило табличных частей | число | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "number" }` | - [x] |
| План видов расчета | LeadingCalculationTypes | Predefined | Предопределенный | `StandardTabularSections` XML | булево | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |
| План видов расчета | DisplacingCalculationTypes | CalculationType | ВидРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | ссылка на тот же план видов расчета | `dataPath: { memberKind: "standardTabularSectionColumn", family: "sameOwnerObject" }` | - [x] |
| План видов расчета | DisplacingCalculationTypes | LineNumber | НомерСтроки | `StandardTabularSections` XML, общее правило табличных частей | число | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "number" }` | - [x] |
| План видов расчета | DisplacingCalculationTypes | Predefined | Предопределенный | `StandardTabularSections` XML | булево | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |
| План видов расчета | BaseCalculationTypes | CalculationType | ВидРасчета | `metadataChartOfCalculationTypes/register.ts`, `StandardTabularSections` XML | ссылка на тот же план видов расчета | `dataPath: { memberKind: "standardTabularSectionColumn", family: "sameOwnerObject" }` | - [x] |
| План видов расчета | BaseCalculationTypes | LineNumber | НомерСтроки | `StandardTabularSections` XML, общее правило табличных частей | число | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "number" }` | - [x] |
| План видов расчета | BaseCalculationTypes | Predefined | Предопределенный | `StandardTabularSections` XML | булево | `dataPath: { memberKind: "standardTabularSectionColumn", family: "primitive", kind: "boolean" }` | - [x] |

## Уникальные группы правил

Реализация не должна плодить отдельный обработчик под каждый частный случай. Целевая модель — небольшие семейства правил с параметрами. В таблице спецификация записывается через поле `family`, чтобы сразу отражать это целевое устройство.

### Примитивы

Правило задает конечный тип без доступа к другим объектам. После такого реквизита путь дальше не разбирается.

- `primitive: "boolean"`: `DeletionMark`, `Predefined`, `Posted`, `IsFolder`, `Active`, `Started`, `Completed`, `Executed`, `ReversingEntry`, `OffBalance`, `ThisNode`, `ActionPeriodIsBasic`.
- `primitive: "string"`: `Description`, `PredefinedDataName`, строковые `Code`, `ChartOfAccounts.Order`.
- `primitive: "dateTime"`: `Date`, `Period`, `ExchangeDate`, расчетные периоды.
- `primitive: "number"`: `LineNumber`, `Enum.Order`, `SentNo`, `ReceivedNo`, `PeriodAdjustment`.

### Ссылки на объект

Правило возвращает объектный тип и может разрешать дальнейший разбор пути, если тип единственный.

- `sameOwnerObject`: `Ref`, `Parent`.
- `objectRefsFromProperty`: `Owner` через свойство `owners`; при нескольких владельцах тип составной, дальнейшее раскрытие запрещено.
- `objectRefFromProperty`: `BusinessProcess.HeadTask` через свойство `task`.
- `objectRefFromRuleProperty`: `AccountingRegister.Account` через `chartOfAccounts`, `CalculationRegister.CalculationType` через `chartOfCalculationTypes`.

### Скаляр из свойства метаданных

Правило получает тип из свойства текущего metadata-объекта или связанных metadata-объектов. Результат остается скаляром, без раскрытия вложенных свойств.

- `codeByProperty`: `Catalog.Code`, `ChartOfCalculationTypes.Code` через `codeType`.
- `numberByProperty`: `Document.Number`, `BusinessProcess.Number`, `Task.Number` через `numberType`.
- `DocumentJournal.Number`: на первом этапе строка без раскрытия; отдельно отмечаем, что реальный тип зависит от типов номеров документов, входящих в журнал.

### Стандартные перечисления

Правило возвращает значение системного перечисления 1С.

- `standardEnum`: `ChartOfAccounts.Type` -> `ВидСчета`.
- `standardEnum`: `AccumulationRegister.RecordType` -> `ВидДвиженияНакопления`.

### Обратные связи

Правило ищет владельцев через другие metadata-объекты. При нескольких найденных типах дальнейшее раскрытие запрещено.

- `reverseLookup`: `Recorder` у регистров через документы и `registerRecords`.
- `reverseLookup`: `Task.BusinessProcess` через бизнес-процессы, где задача указана в `tasks`.

Обратные связи не должны резолвиться через обычный `StandardAttributeTypeResolver`: индекс стандартных реквизитов строится по одному текущему объекту и не имеет доступа к другим объектам проекта. Для них нужен `TraversalTransitionResolver`, потому что он вызывается во время прохода по сегментам `DataPath` и получает `ownerCache`.

Правило валидации:

- если найден один тип, возвращаем `DataPathTypeInfo` с `kinds: ["object"]` и одним `nextTypes`; дальнейшее раскрытие разрешено;
- если найдено несколько типов, возвращаем `kinds: ["object"]`, все `nextTypes` и `isComposite: true`; сам сегмент валиден, но следующий сегмент даст ошибку промежуточного составного типа через существующий `validateIntermediateType`;
- если сегмент известен как обратная связь, но кандидатов не найдено, это ошибка metadata-связей, а не резервное поведение;
- если правило неприменимо к сегменту, возвращаем `undefined`, и резолвер продолжает обычный поиск реквизита;
- если сегмент известен, но по смыслу не раскрывается, возвращаем закрытый тип с `unsupportedIntermediate`, чтобы путь вида `RoutePoint.Поле` давал понятную ошибку о неподдерживаемом промежуточном типе.

### Закрытые специальные типы

Тип известен, но дальнейшее раскрытие через точку запрещено.

- `opaque`: `DocumentJournal.Type`.
- `typeDescription`: `ValueType`, то есть `ОписаниеТипов`.
- `businessProcessRoutePoint`: `Task.RoutePoint`, то есть `ТочкаМаршрутаБизнесПроцесса`.

### Неподдержанные на первом этапе

- `AccountingRegister.ExtDimension1..50`: использование и раскрытие запрещены.
- `AccountingRegister.ExtDimensionType1..50`: использование и раскрытие запрещены.

## Слой исполнения правил

Одного семейства правил недостаточно: для реализации важно, на каком этапе правило может быть исполнено и какие данные ему доступны. Поэтому каждая декларация стандартного реквизита должна дополнительно описывать фазу исполнения, область источника данных и политики поведения.

### Фазы исполнения

- `index-time`: правило вычисляется при построении `ObjectFieldIndex` текущего объекта. Ему доступны текущий metadata-объект, его `rules` и явный `Тип` стандартного реквизита.
- `traversal-time`: правило вычисляется во время прохода по сегментам `DataPath`. Ему доступен `ownerCache`, поэтому оно может смотреть другие объекты проекта.
- `deferred`: сегмент известен, но на первом этапе не раскрывается и не дает точного типа для дальнейшего пути.

### Область источника данных

- `self`: правило не читает metadata-свойства, например примитивные типы.
- `ownerModel`: правило читает свойства текущего metadata-объекта, например `owners`, `codeType`, `numberType`.
- `rules`: правило читает параметры из `rules`, например `chartOfAccounts`, `chartOfCalculationTypes`.
- `projectIndex`: правило строится по другим объектам проекта, например `registerRecords` документов или `tasks` бизнес-процессов.

### Политики поведения

- `terminal: true`: после реквизита нельзя продолжать путь через точку.
- `compositePolicy: "errorOnTraversal"`: сам реквизит валиден, но дальнейшее раскрытие при нескольких типах дает ошибку промежуточного составного типа.
- `emptyPolicy: "error"`: если известная обратная связь не нашла кандидатов, это ошибка metadata-связей.
- `aliasPolicy: "translateYaml"`: реквизит участвует в переводе внутренних имен в YAML-имена и обратно.

### Целевая форма декларации

```ts
{
  names: ["Recorder"],
  family: "reverseLookup",
  phase: "traversal-time",
  sourceScope: "projectIndex",
  emptyPolicy: "error",
  compositePolicy: "errorOnTraversal",
  aliasPolicy: "translateYaml",
}
```

Такой реестр называется `standardMembers` и должен быть единым источником для резолвера `DataPath`, валидатора и перевода `YAML <-> model`. В него входят стандартные реквизиты, стандартные табличные части и колонки стандартных табличных частей. Семейства правил остаются небольшими исполняемыми механизмами, а конкретные платформенные члены описываются декларативными записями рядом с конкретными объектами (`metadataChartOfAccounts/standardMembers.ts`, `metadataTask/standardMembers.ts` и т.п.).

## Разобранные правила

На текущем этапе разобраны правила, достаточные для задачи с `Owner`:

- `Ref`: всегда ссылка на сам объект.
- `Parent`: всегда ссылка на сам объект.
- `Owner`: типы из свойства `owners`, с `isComposite` при нескольких владельцах.
- `Code`: для справочника через `codeType`.
- `ChartOfCalculationTypes.Code`: через `codeType`.
- `ChartOfAccounts.Code`, `ChartOfCharacteristicTypes.Code`, `ExchangePlan.Code`: строка.
- `Number`: для документа через `numberType`.
- `BusinessProcess.Number`: через `numberType`.
- `Task.Number`: через `numberType`.
- `Description`: всегда строка.
- `PredefinedDataName`: строка.
- `DeletionMark`, `Predefined`: всегда булевы.
- `Active`: булево.
- `Posted`, `OffBalance`, `IsFolder`, `ActionPeriodIsBasic`, `ThisNode`: булевы.
- `Started`, `Completed`, `Executed`, `ReversingEntry`: булевы.
- `Date`: всегда дата.
- `ExchangeDate`: дата.
- `RegistrationPeriod`, `BegOfActionPeriod`, `EndOfActionPeriod`, `ActionPeriod`, `BegOfBasePeriod`, `EndOfBasePeriod`: дата.
- `Enum.Order`: число.
- `ChartOfAccounts.Order`: строка.
- `LineNumber`: число.
- `PeriodAdjustment`: число.
- `SentNo`, `ReceivedNo`: число.
- `ChartOfAccounts.Type`: стандартное перечисление `ВидСчета`.
- `ValueType`: `ОписаниеТипов` (`TypeDescription`), вложенные свойства недоступны.
- `BusinessProcess.HeadTask`: задача из свойства `task`.
- `Task.BusinessProcess`: обратный поиск бизнес-процессов по задачам; при нескольких значениях вложенные свойства недоступны.
- `Recorder`: обратный поиск документов по `registerRecords`; при нескольких регистраторах вложенные свойства недоступны.
- `DocumentJournal.Type`: `Тип`, дальше не раскрывается.
- `DocumentJournal.Number`: на первом этапе строка без раскрытия; реально зависит от типов номеров документов, входящих в журнал.
- `Task.RoutePoint`: `ТочкаМаршрутаБизнесПроцесса` бизнес-процессов, у которых указана эта задача; дальше не раскрывается.
- `AccumulationRegister.RecordType`: стандартное перечисление `ВидДвиженияНакопления`.
- `AccountingRegister.Account`: счет из плана счетов, указанного в `chartOfAccounts` rules.
- `CalculationRegister.CalculationType`: вид расчета из плана видов расчета, указанного в `chartOfCalculationTypes` rules.

Все строки с неотмеченным флажком `Разобрано` остаются в таблице для последующего уточнения и используют безопасное резервное поведение.
