# Таблица стандартных реквизитов для DataPath

## Цель

Собрать текущие стандартные реквизиты в одну рабочую таблицу и постепенно описывать для них декларативные правила типов. Таблица нужна для резолвера `DataPath`, валидации и перевода путей между внутренним представлением и YAML.

## Общее правило

Если тип стандартного реквизита явно описан декларацией или задан явным `Тип` в описании реквизита, переводчик `DataPath` может опираться на него, переводить имя сегмента и продолжать разбор пути.

Если тип не определен, переводчик останавливается на этом сегменте и оставляет остаток пути без изменений. Валидатор на первом этапе не выдает ошибок по дальнейшему пути после такого реквизита.

## Таблица

| Объект | Внутреннее имя | YAML | Источник сейчас | Правило типа | Разобрано |
| --- | --- | --- | --- | --- | --- |
| Общие объектные | Ref | Ссылка | `dataPathCommon` | текущий объект | да |
| Общие объектные | Parent | Родитель | `dataPathCommon` | текущий объект | да |
| Общие объектные | Owner | Владелец | `dataPathCommon` | ссылки из свойства `owners`, составной тип при нескольких владельцах | да |
| Общие объектные | DeletionMark | ПометкаУдаления | `dataPathCommon` | булево | да |
| Общие объектные | Predefined | Предопределенный | `dataPathCommon` | булево | да |
| Общие объектные | PredefinedDataName | ИмяПредопределенныхДанных | имена в rules | резервное поведение | нет |
| Общие объектные | Description | Наименование / Описание | имена в rules | строка или явный `Тип` | да |
| Общие объектные | Code | Код | имена в rules | зависит от свойства владельца (`codeType` и аналоги) | да |
| Общие объектные | IsFolder | ЭтоГруппа | имена в rules | булево | да |
| Общие объектные | Date | Дата | имена в rules | дата | да |
| Общие объектные | Number | Номер | имена в rules | строка/число по свойствам нумерации владельца | нет |
| Общие объектные | Posted | Проведен | `dataPathCommon` | булево | да |
| Табличная часть | LineNumber | НомерСтроки | `metadataTabularSection`, `dataPathCommon` | число | да |
| Справочник | Ref | Ссылка | `MetadataCatalogStandardAttributeNames` | текущий объект | да |
| Справочник | Owner | Владелец | `MetadataCatalogStandardAttributeNames` | `owners` | да |
| Справочник | Code | Код | `MetadataCatalogStandardAttributeNames` | `codeType` | да |
| Справочник | Description | Наименование | `MetadataCatalogStandardAttributeNames` | строка | да |
| Справочник | Parent | Родитель | `MetadataCatalogStandardAttributeNames` | текущий объект | да |
| Справочник | IsFolder | ЭтоГруппа | `MetadataCatalogStandardAttributeNames` | булево | да |
| Справочник | DeletionMark | ПометкаУдаления | `MetadataCatalogStandardAttributeNames` | булево | да |
| Справочник | Predefined | Предопределенный | `MetadataCatalogStandardAttributeNames` | булево | да |
| Справочник | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataCatalogStandardAttributeNames` | резервное поведение | нет |
| Документ | Ref | Ссылка | `MetadataDocumentStandardAttributeNames` | текущий объект | да |
| Документ | Date | Дата | `MetadataDocumentStandardAttributeNames` | дата | да |
| Документ | Number | Номер | `MetadataDocumentStandardAttributeNames` | по свойствам нумерации документа | нет |
| Документ | Posted | Проведен | `MetadataDocumentStandardAttributeNames` | булево | да |
| Документ | DeletionMark | ПометкаУдаления | `MetadataDocumentStandardAttributeNames` | булево | да |
| Перечисление | Ref | Ссылка | `MetadataEnumerationStandardAttributeNames` | текущий объект | нет |
| Перечисление | Order | Порядок | `MetadataEnumerationStandardAttributeNames` | число | нет |
| План счетов | Ref | Ссылка | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект | нет |
| План счетов | Code | Код | `MetadataChartOfAccountsStandardAttributeNames` | по свойствам кода | нет |
| План счетов | Description | Наименование | `MetadataChartOfAccountsStandardAttributeNames` | строка | нет |
| План счетов | Parent | Родитель | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект | нет |
| План счетов | Type | Вид | `MetadataChartOfAccountsStandardAttributeNames` | резервное поведение | нет |
| План счетов | OffBalance | Забалансовый | `MetadataChartOfAccountsStandardAttributeNames` | булево | нет |
| План счетов | Order | Порядок | `MetadataChartOfAccountsStandardAttributeNames` | число | нет |
| План счетов | DeletionMark | ПометкаУдаления | `MetadataChartOfAccountsStandardAttributeNames` | булево | нет |
| План счетов | Predefined | Предопределенный | `MetadataChartOfAccountsStandardAttributeNames` | булево | нет |
| План счетов | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfAccountsStandardAttributeNames` | резервное поведение | нет |
| План видов характеристик | Ref | Ссылка | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект | нет |
| План видов характеристик | ValueType | ТипЗначения | `dataPathCommon` | описание типа | нет |
| План видов характеристик | Code | Код | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | по свойствам кода | нет |
| План видов характеристик | Description | Наименование | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | нет |
| План видов характеристик | Parent | Родитель | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект | нет |
| План видов характеристик | IsFolder | ЭтоГруппа | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | нет |
| План видов характеристик | DeletionMark | ПометкаУдаления | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | нет |
| План видов характеристик | Predefined | Предопределенный | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | нет |
| План видов характеристик | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | резервное поведение | нет |
| План видов расчета | Ref | Ссылка | `MetadataChartOfCalculationTypesStandardAttributeNames` | текущий объект | нет |
| План видов расчета | Code | Код | `MetadataChartOfCalculationTypesStandardAttributeNames` | по свойствам кода | нет |
| План видов расчета | Description | Наименование | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка | нет |
| План видов расчета | ActionPeriodIsBasic | ПериодДействияБазовый | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | нет |
| План видов расчета | DeletionMark | ПометкаУдаления | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | нет |
| План видов расчета | Predefined | Предопределенный | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | нет |
| План видов расчета | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCalculationTypesStandardAttributeNames` | резервное поведение | нет |
| План обмена | Ref | Ссылка | `MetadataExchangePlanStandardAttributeNames` | текущий объект | нет |
| План обмена | Code | Код | `MetadataExchangePlanStandardAttributeNames` | по свойствам кода | нет |
| План обмена | Description | Наименование | `MetadataExchangePlanStandardAttributeNames` | строка | нет |
| План обмена | ThisNode | ЭтотУзел | `MetadataExchangePlanStandardAttributeNames` | текущий объект / узел плана обмена | нет |
| План обмена | ExchangeDate | ДатаОбмена | `MetadataExchangePlanStandardAttributeNames` | дата | нет |
| План обмена | SentNo | НомерОтправленного | `dataPathCommon` | скаляр | нет |
| План обмена | ReceivedNo | НомерПринятого | `dataPathCommon` | скаляр | нет |
| План обмена | DeletionMark | ПометкаУдаления | `MetadataExchangePlanStandardAttributeNames` | булево | нет |
| Журнал документов | Ref | Ссылка | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | нет |
| Журнал документов | Type | Тип | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | нет |
| Журнал документов | Date | Дата | `MetadataDocumentJournalStandardAttributeNames` | дата | нет |
| Журнал документов | Number | Номер | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | нет |
| Журнал документов | Posted | Проведен | `MetadataDocumentJournalStandardAttributeNames` | булево | нет |
| Журнал документов | DeletionMark | ПометкаУдаления | `MetadataDocumentJournalStandardAttributeNames` | булево | нет |
| Бизнес-процесс | Ref | Ссылка | `MetadataBusinessProcessStandardAttributeNames` | текущий объект | нет |
| Бизнес-процесс | Date | Дата | `MetadataBusinessProcessStandardAttributeNames` | дата | нет |
| Бизнес-процесс | Number | Номер | `MetadataBusinessProcessStandardAttributeNames` | резервное поведение | нет |
| Бизнес-процесс | Started | Стартован | `dataPathCommon` | булево | нет |
| Бизнес-процесс | Completed | Завершен | `dataPathCommon` | булево | нет |
| Бизнес-процесс | HeadTask | ГоловнаяЗадача | `MetadataBusinessProcessStandardAttributeNames` | задача | нет |
| Бизнес-процесс | DeletionMark | ПометкаУдаления | `MetadataBusinessProcessStandardAttributeNames` | булево | нет |
| Задача | Ref | Ссылка | `MetadataTaskStandardAttributeNames` | текущий объект | нет |
| Задача | Date | Дата | `MetadataTaskStandardAttributeNames` | дата | нет |
| Задача | Number | Номер | `MetadataTaskStandardAttributeNames` | резервное поведение | нет |
| Задача | Executed | Выполнена | `dataPathCommon` | булево | нет |
| Задача | BusinessProcess | БизнесПроцесс | `metadataTask/register.ts` | бизнес-процесс | нет |
| Задача | RoutePoint | ТочкаМаршрута | `metadataTask/register.ts` | точка маршрута бизнес-процесса | нет |
| Задача | Description | Описание | `MetadataTaskStandardAttributeNames` | строка | нет |
| Задача | DeletionMark | ПометкаУдаления | `MetadataTaskStandardAttributeNames` | булево | нет |
| Регистр сведений | Active | Активность | `MetadataInformationRegisterStandardAttributeNames` | булево | нет |
| Регистр сведений | LineNumber | НомерСтроки | `MetadataInformationRegisterStandardAttributeNames` | число | нет |
| Регистр сведений | Recorder | Регистратор | `MetadataInformationRegisterStandardAttributeNames` | регистратор | нет |
| Регистр сведений | Period | Период | `MetadataInformationRegisterStandardAttributeNames` | дата | нет |
| Регистр накопления | RecordType | ВидДвижения | `MetadataAccumulationRegisterStandardAttributeNames` | резервное поведение | нет |
| Регистр накопления | Active | Активность | `MetadataAccumulationRegisterStandardAttributeNames` | булево | нет |
| Регистр накопления | LineNumber | НомерСтроки | `MetadataAccumulationRegisterStandardAttributeNames` | число | нет |
| Регистр накопления | Recorder | Регистратор | `MetadataAccumulationRegisterStandardAttributeNames` | регистратор | нет |
| Регистр накопления | Period | Период | `MetadataAccumulationRegisterStandardAttributeNames` | дата | нет |
| Регистр накопления оборотов | Active | Активность | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | булево | нет |
| Регистр накопления оборотов | LineNumber | НомерСтроки | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | число | нет |
| Регистр накопления оборотов | Recorder | Регистратор | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | регистратор | нет |
| Регистр накопления оборотов | Period | Период | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | дата | нет |
| Регистр бухгалтерии | PeriodAdjustment | УточнениеПериода | `MetadataAccountingRegisterStandardAttributeNames` | резервное поведение | нет |
| Регистр бухгалтерии | Account | Счет | `MetadataAccountingRegisterStandardAttributeNames` | план счетов | нет |
| Регистр бухгалтерии | Active | Активность | `MetadataAccountingRegisterStandardAttributeNames` | булево | нет |
| Регистр бухгалтерии | LineNumber | НомерСтроки | `MetadataAccountingRegisterStandardAttributeNames` | число | нет |
| Регистр бухгалтерии | Recorder | Регистратор | `MetadataAccountingRegisterStandardAttributeNames` | регистратор | нет |
| Регистр бухгалтерии | Period | Период | `MetadataAccountingRegisterStandardAttributeNames` | дата | нет |
| Регистр бухгалтерии | ExtDimension1..50 | Субконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора | нет |
| Регистр бухгалтерии | ExtDimensionType1..50 | ВидСубконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора | нет |
| Регистр расчета | RegistrationPeriod | ПериодРегистрации | `MetadataCalculationRegisterStandardAttributeNames` | дата | нет |
| Регистр расчета | ReversingEntry | Сторно | `MetadataCalculationRegisterStandardAttributeNames` | булево | нет |
| Регистр расчета | Active | Активность | `MetadataCalculationRegisterStandardAttributeNames` | булево | нет |
| Регистр расчета | BegOfActionPeriod | НачалоПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | нет |
| Регистр расчета | EndOfActionPeriod | КонецПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | нет |
| Регистр расчета | ActionPeriod | ПериодДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата/период | нет |
| Регистр расчета | BegOfBasePeriod | НачалоБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | нет |
| Регистр расчета | EndOfBasePeriod | КонецБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | нет |
| Регистр расчета | CalculationType | ВидРасчета | `MetadataCalculationRegisterStandardAttributeNames` | план видов расчета | нет |
| Регистр расчета | LineNumber | НомерСтроки | `MetadataCalculationRegisterStandardAttributeNames` | число | нет |
| Регистр расчета | Recorder | Регистратор | `MetadataCalculationRegisterStandardAttributeNames` | регистратор | нет |

## Разобранные правила

На текущем этапе разобраны правила, достаточные для задачи с `Owner`:

- `Ref`: тип текущего объекта.
- `Owner`: типы из свойства `owners`, с `isComposite` при нескольких владельцах.
- `Code`: для справочника через `codeType`.
- `Description`: строка для справочника.
- `IsFolder`, `DeletionMark`, `Predefined`, `Posted`: булевы.
- `Date`: дата.
- `LineNumber`: число.

Все строки с `Разобрано: нет` остаются в таблице для последующего уточнения и используют безопасное резервное поведение.
