# Таблица стандартных реквизитов для DataPath

## Цель

Собрать текущие стандартные реквизиты в одну рабочую таблицу и постепенно описывать для них декларативные правила типов. Таблица нужна для резолвера `DataPath`, валидации и перевода путей между внутренним представлением и YAML.

## Общее правило

Если тип стандартного реквизита явно описан декларацией или задан явным `Тип` в описании реквизита, переводчик `DataPath` может опираться на него, переводить имя сегмента и продолжать разбор пути.

Если тип не определен, переводчик останавливается на этом сегменте и оставляет остаток пути без изменений. Валидатор на первом этапе не выдает ошибок по дальнейшему пути после такого реквизита.

## Таблица

| Объект | Внутреннее имя | YAML | Источник сейчас | Правило типа | Спецификация | Разобрано |
| --- | --- | --- | --- | --- | --- | --- |
| Общие объектные | Ref | Ссылка | `dataPathCommon` | текущий объект | `dataPath: { type: "sameOwnerObject" }` | - [x] |
| Общие объектные | Parent | Родитель | `dataPathCommon` | текущий объект | `dataPath: { type: "sameOwnerObject" }` | - [x] |
| Общие объектные | Owner | Владелец | `dataPathCommon` | ссылки из свойства `owners`, составной тип при нескольких владельцах | `dataPath: { type: "objectRefsFromProperty", property: "owners" }` | - [x] |
| Общие объектные | DeletionMark | ПометкаУдаления | `dataPathCommon` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Общие объектные | Predefined | Предопределенный | `dataPathCommon` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Общие объектные | PredefinedDataName | ИмяПредопределенныхДанных | имена в rules | строка | `dataPath: { type: "string" }` | - [x] |
| Общие объектные | Description | Наименование / Описание | имена в rules | строка или явный `Тип` | `dataPath: { type: "string" }` | - [x] |
| Общие объектные | Code | Код | имена в rules | зависит от свойства владельца (`codeType` и аналоги) | `dataPath: { type: "catalogCode", property: "codeType" }` | - [x] |
| Общие объектные | IsFolder | ЭтоГруппа | имена в rules | булево | `dataPath: { type: "boolean" }` | - [x] |
| Общие объектные | Date | Дата | имена в rules | дата | `dataPath: { type: "dateTime" }` | - [x] |
| Общие объектные | Number | Номер | имена в rules | строка/число по свойствам нумерации владельца |  | - [ ] |
| Общие объектные | Posted | Проведен | `dataPathCommon` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Табличная часть | LineNumber | НомерСтроки | `metadataTabularSection`, `dataPathCommon` | число | `dataPath: { type: "number" }` | - [x] |
| Справочник | Ref | Ссылка | `MetadataCatalogStandardAttributeNames` | текущий объект | `dataPath: { type: "sameOwnerObject" }` | - [x] |
| Справочник | Owner | Владелец | `MetadataCatalogStandardAttributeNames` | `owners` | `dataPath: { type: "objectRefsFromProperty", property: "owners" }` | - [x] |
| Справочник | Code | Код | `MetadataCatalogStandardAttributeNames` | `codeType` | `dataPath: { type: "catalogCode", property: "codeType" }` | - [x] |
| Справочник | Description | Наименование | `MetadataCatalogStandardAttributeNames` | строка | `dataPath: { type: "string" }` | - [x] |
| Справочник | Parent | Родитель | `MetadataCatalogStandardAttributeNames` | текущий объект | `dataPath: { type: "sameOwnerObject" }` | - [x] |
| Справочник | IsFolder | ЭтоГруппа | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Справочник | DeletionMark | ПометкаУдаления | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Справочник | Predefined | Предопределенный | `MetadataCatalogStandardAttributeNames` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Справочник | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataCatalogStandardAttributeNames` | строка | `dataPath: { type: "string" }` | - [x] |
| Документ | Ref | Ссылка | `MetadataDocumentStandardAttributeNames` | текущий объект | `dataPath: { type: "sameOwnerObject" }` | - [x] |
| Документ | Date | Дата | `MetadataDocumentStandardAttributeNames` | дата | `dataPath: { type: "dateTime" }` | - [x] |
| Документ | Number | Номер | `MetadataDocumentStandardAttributeNames` | по свойствам нумерации документа |  | - [ ] |
| Документ | Posted | Проведен | `MetadataDocumentStandardAttributeNames` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Документ | DeletionMark | ПометкаУдаления | `MetadataDocumentStandardAttributeNames` | булево | `dataPath: { type: "boolean" }` | - [x] |
| Перечисление | Ref | Ссылка | `MetadataEnumerationStandardAttributeNames` | текущий объект |  | - [ ] |
| Перечисление | Order | Порядок | `MetadataEnumerationStandardAttributeNames` | число |  | - [ ] |
| План счетов | Ref | Ссылка | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект |  | - [ ] |
| План счетов | Code | Код | `MetadataChartOfAccountsStandardAttributeNames` | по свойствам кода |  | - [ ] |
| План счетов | Description | Наименование | `MetadataChartOfAccountsStandardAttributeNames` | строка |  | - [ ] |
| План счетов | Parent | Родитель | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект |  | - [ ] |
| План счетов | Type | Вид | `MetadataChartOfAccountsStandardAttributeNames` | резервное поведение |  | - [ ] |
| План счетов | OffBalance | Забалансовый | `MetadataChartOfAccountsStandardAttributeNames` | булево |  | - [ ] |
| План счетов | Order | Порядок | `MetadataChartOfAccountsStandardAttributeNames` | число |  | - [ ] |
| План счетов | DeletionMark | ПометкаУдаления | `MetadataChartOfAccountsStandardAttributeNames` | булево |  | - [ ] |
| План счетов | Predefined | Предопределенный | `MetadataChartOfAccountsStandardAttributeNames` | булево |  | - [ ] |
| План счетов | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfAccountsStandardAttributeNames` | строка | `dataPath: { type: "string" }` | - [x] |
| План видов характеристик | Ref | Ссылка | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект |  | - [ ] |
| План видов характеристик | ValueType | ТипЗначения | `dataPathCommon` | описание типа |  | - [ ] |
| План видов характеристик | Code | Код | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | по свойствам кода |  | - [ ] |
| План видов характеристик | Description | Наименование | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка |  | - [ ] |
| План видов характеристик | Parent | Родитель | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект |  | - [ ] |
| План видов характеристик | IsFolder | ЭтоГруппа | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов характеристик | DeletionMark | ПометкаУдаления | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов характеристик | Predefined | Предопределенный | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов характеристик | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | `dataPath: { type: "string" }` | - [x] |
| План видов расчета | Ref | Ссылка | `MetadataChartOfCalculationTypesStandardAttributeNames` | текущий объект |  | - [ ] |
| План видов расчета | Code | Код | `MetadataChartOfCalculationTypesStandardAttributeNames` | по свойствам кода |  | - [ ] |
| План видов расчета | Description | Наименование | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка |  | - [ ] |
| План видов расчета | ActionPeriodIsBasic | ПериодДействияБазовый | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов расчета | DeletionMark | ПометкаУдаления | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов расчета | Predefined | Предопределенный | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево |  | - [ ] |
| План видов расчета | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка | `dataPath: { type: "string" }` | - [x] |
| План обмена | Ref | Ссылка | `MetadataExchangePlanStandardAttributeNames` | текущий объект |  | - [ ] |
| План обмена | Code | Код | `MetadataExchangePlanStandardAttributeNames` | по свойствам кода |  | - [ ] |
| План обмена | Description | Наименование | `MetadataExchangePlanStandardAttributeNames` | строка |  | - [ ] |
| План обмена | ThisNode | ЭтотУзел | `MetadataExchangePlanStandardAttributeNames` | текущий объект / узел плана обмена |  | - [ ] |
| План обмена | ExchangeDate | ДатаОбмена | `MetadataExchangePlanStandardAttributeNames` | дата |  | - [ ] |
| План обмена | SentNo | НомерОтправленного | `dataPathCommon` | скаляр |  | - [ ] |
| План обмена | ReceivedNo | НомерПринятого | `dataPathCommon` | скаляр |  | - [ ] |
| План обмена | DeletionMark | ПометкаУдаления | `MetadataExchangePlanStandardAttributeNames` | булево |  | - [ ] |
| Журнал документов | Ref | Ссылка | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение |  | - [ ] |
| Журнал документов | Type | Тип | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение |  | - [ ] |
| Журнал документов | Date | Дата | `MetadataDocumentJournalStandardAttributeNames` | дата |  | - [ ] |
| Журнал документов | Number | Номер | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение |  | - [ ] |
| Журнал документов | Posted | Проведен | `MetadataDocumentJournalStandardAttributeNames` | булево |  | - [ ] |
| Журнал документов | DeletionMark | ПометкаУдаления | `MetadataDocumentJournalStandardAttributeNames` | булево |  | - [ ] |
| Бизнес-процесс | Ref | Ссылка | `MetadataBusinessProcessStandardAttributeNames` | текущий объект |  | - [ ] |
| Бизнес-процесс | Date | Дата | `MetadataBusinessProcessStandardAttributeNames` | дата |  | - [ ] |
| Бизнес-процесс | Number | Номер | `MetadataBusinessProcessStandardAttributeNames` | резервное поведение |  | - [ ] |
| Бизнес-процесс | Started | Стартован | `dataPathCommon` | булево |  | - [ ] |
| Бизнес-процесс | Completed | Завершен | `dataPathCommon` | булево |  | - [ ] |
| Бизнес-процесс | HeadTask | ГоловнаяЗадача | `MetadataBusinessProcessStandardAttributeNames` | задача |  | - [ ] |
| Бизнес-процесс | DeletionMark | ПометкаУдаления | `MetadataBusinessProcessStandardAttributeNames` | булево |  | - [ ] |
| Задача | Ref | Ссылка | `MetadataTaskStandardAttributeNames` | текущий объект |  | - [ ] |
| Задача | Date | Дата | `MetadataTaskStandardAttributeNames` | дата |  | - [ ] |
| Задача | Number | Номер | `MetadataTaskStandardAttributeNames` | резервное поведение |  | - [ ] |
| Задача | Executed | Выполнена | `dataPathCommon` | булево |  | - [ ] |
| Задача | BusinessProcess | БизнесПроцесс | `metadataTask/register.ts` | бизнес-процесс |  | - [ ] |
| Задача | RoutePoint | ТочкаМаршрута | `metadataTask/register.ts` | точка маршрута бизнес-процесса |  | - [ ] |
| Задача | Description | Описание | `MetadataTaskStandardAttributeNames` | строка |  | - [ ] |
| Задача | DeletionMark | ПометкаУдаления | `MetadataTaskStandardAttributeNames` | булево |  | - [ ] |
| Регистр сведений | Active | Активность | `MetadataInformationRegisterStandardAttributeNames` | булево |  | - [ ] |
| Регистр сведений | LineNumber | НомерСтроки | `MetadataInformationRegisterStandardAttributeNames` | число |  | - [ ] |
| Регистр сведений | Recorder | Регистратор | `MetadataInformationRegisterStandardAttributeNames` | регистратор |  | - [ ] |
| Регистр сведений | Period | Период | `MetadataInformationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр накопления | RecordType | ВидДвижения | `MetadataAccumulationRegisterStandardAttributeNames` | резервное поведение |  | - [ ] |
| Регистр накопления | Active | Активность | `MetadataAccumulationRegisterStandardAttributeNames` | булево |  | - [ ] |
| Регистр накопления | LineNumber | НомерСтроки | `MetadataAccumulationRegisterStandardAttributeNames` | число |  | - [ ] |
| Регистр накопления | Recorder | Регистратор | `MetadataAccumulationRegisterStandardAttributeNames` | регистратор |  | - [ ] |
| Регистр накопления | Period | Период | `MetadataAccumulationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр накопления оборотов | Active | Активность | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | булево |  | - [ ] |
| Регистр накопления оборотов | LineNumber | НомерСтроки | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | число |  | - [ ] |
| Регистр накопления оборотов | Recorder | Регистратор | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | регистратор |  | - [ ] |
| Регистр накопления оборотов | Period | Период | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | дата |  | - [ ] |
| Регистр бухгалтерии | PeriodAdjustment | УточнениеПериода | `MetadataAccountingRegisterStandardAttributeNames` | резервное поведение |  | - [ ] |
| Регистр бухгалтерии | Account | Счет | `MetadataAccountingRegisterStandardAttributeNames` | план счетов |  | - [ ] |
| Регистр бухгалтерии | Active | Активность | `MetadataAccountingRegisterStandardAttributeNames` | булево |  | - [ ] |
| Регистр бухгалтерии | LineNumber | НомерСтроки | `MetadataAccountingRegisterStandardAttributeNames` | число |  | - [ ] |
| Регистр бухгалтерии | Recorder | Регистратор | `MetadataAccountingRegisterStandardAttributeNames` | регистратор |  | - [ ] |
| Регистр бухгалтерии | Period | Период | `MetadataAccountingRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр бухгалтерии | ExtDimension1..50 | Субконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора |  | - [ ] |
| Регистр бухгалтерии | ExtDimensionType1..50 | ВидСубконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора |  | - [ ] |
| Регистр расчета | RegistrationPeriod | ПериодРегистрации | `MetadataCalculationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр расчета | ReversingEntry | Сторно | `MetadataCalculationRegisterStandardAttributeNames` | булево |  | - [ ] |
| Регистр расчета | Active | Активность | `MetadataCalculationRegisterStandardAttributeNames` | булево |  | - [ ] |
| Регистр расчета | BegOfActionPeriod | НачалоПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр расчета | EndOfActionPeriod | КонецПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр расчета | ActionPeriod | ПериодДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата/период |  | - [ ] |
| Регистр расчета | BegOfBasePeriod | НачалоБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр расчета | EndOfBasePeriod | КонецБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата |  | - [ ] |
| Регистр расчета | CalculationType | ВидРасчета | `MetadataCalculationRegisterStandardAttributeNames` | план видов расчета |  | - [ ] |
| Регистр расчета | LineNumber | НомерСтроки | `MetadataCalculationRegisterStandardAttributeNames` | число |  | - [ ] |
| Регистр расчета | Recorder | Регистратор | `MetadataCalculationRegisterStandardAttributeNames` | регистратор |  | - [ ] |

## Разобранные правила

На текущем этапе разобраны правила, достаточные для задачи с `Owner`:

- `Ref`: тип текущего объекта.
- `Owner`: типы из свойства `owners`, с `isComposite` при нескольких владельцах.
- `Code`: для справочника через `codeType`.
- `Description`: строка для справочника.
- `PredefinedDataName`: строка.
- `IsFolder`, `DeletionMark`, `Predefined`, `Posted`: булевы.
- `Date`: дата.
- `LineNumber`: число.

Все строки с неотмеченным флажком `Разобрано` остаются в таблице для последующего уточнения и используют безопасное резервное поведение.
