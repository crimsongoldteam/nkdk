# Таблица стандартных реквизитов для DataPath

## Цель

Собрать текущие стандартные реквизиты в одну рабочую таблицу и постепенно описывать для них декларативные правила типов. Таблица нужна для резолвера `DataPath`, валидации и перевода путей между внутренним представлением и YAML.

## Общее правило

Если тип стандартного реквизита явно описан декларацией или задан явным `Тип` в описании реквизита, переводчик `DataPath` может опираться на него, переводить имя сегмента и продолжать разбор пути.

Если тип не определен, переводчик останавливается на этом сегменте и оставляет остаток пути без изменений. Валидатор на первом этапе не выдает ошибок по дальнейшему пути после такого реквизита.

## Таблица

| Объект | Внутреннее имя | YAML | Источник сейчас | Правило типа | Приоритет |
| --- | --- | --- | --- | --- | --- |
| Общие объектные | Ref | Ссылка | `dataPathCommon` | текущий объект | первая волна |
| Общие объектные | Parent | Родитель | `dataPathCommon` | текущий объект | первая волна |
| Общие объектные | Owner | Владелец | `dataPathCommon` | ссылки из свойства `owners`, составной тип при нескольких владельцах | первая волна |
| Общие объектные | DeletionMark | ПометкаУдаления | `dataPathCommon` | булево | первая волна |
| Общие объектные | Predefined | Предопределенный | `dataPathCommon` | булево | первая волна |
| Общие объектные | PredefinedDataName | ИмяПредопределенныхДанных | имена в rules | резервное поведение | позже |
| Общие объектные | Description | Наименование / Описание | имена в rules | строка или явный `Тип` | первая волна для встречающихся путей |
| Общие объектные | Code | Код | имена в rules | зависит от свойства владельца (`codeType` и аналоги) | первая волна для справочника |
| Общие объектные | IsFolder | ЭтоГруппа | имена в rules | булево | первая волна |
| Общие объектные | Date | Дата | имена в rules | дата | первая волна |
| Общие объектные | Number | Номер | имена в rules | строка/число по свойствам нумерации владельца | позже |
| Общие объектные | Posted | Проведен | `dataPathCommon` | булево | первая волна |
| Табличная часть | LineNumber | НомерСтроки | `metadataTabularSection`, `dataPathCommon` | число | первая волна |
| Справочник | Ref | Ссылка | `MetadataCatalogStandardAttributeNames` | текущий объект | первая волна |
| Справочник | Owner | Владелец | `MetadataCatalogStandardAttributeNames` | `owners` | первая волна |
| Справочник | Code | Код | `MetadataCatalogStandardAttributeNames` | `codeType` | первая волна |
| Справочник | Description | Наименование | `MetadataCatalogStandardAttributeNames` | строка | первая волна |
| Справочник | Parent | Родитель | `MetadataCatalogStandardAttributeNames` | текущий объект | первая волна |
| Справочник | IsFolder | ЭтоГруппа | `MetadataCatalogStandardAttributeNames` | булево | первая волна |
| Справочник | DeletionMark | ПометкаУдаления | `MetadataCatalogStandardAttributeNames` | булево | первая волна |
| Справочник | Predefined | Предопределенный | `MetadataCatalogStandardAttributeNames` | булево | первая волна |
| Справочник | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataCatalogStandardAttributeNames` | резервное поведение | позже |
| Документ | Ref | Ссылка | `MetadataDocumentStandardAttributeNames` | текущий объект | первая волна |
| Документ | Date | Дата | `MetadataDocumentStandardAttributeNames` | дата | первая волна |
| Документ | Number | Номер | `MetadataDocumentStandardAttributeNames` | по свойствам нумерации документа | позже |
| Документ | Posted | Проведен | `MetadataDocumentStandardAttributeNames` | булево | первая волна |
| Документ | DeletionMark | ПометкаУдаления | `MetadataDocumentStandardAttributeNames` | булево | первая волна |
| Перечисление | Ref | Ссылка | `MetadataEnumerationStandardAttributeNames` | текущий объект | позже |
| Перечисление | Order | Порядок | `MetadataEnumerationStandardAttributeNames` | число | позже |
| План счетов | Ref | Ссылка | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект | позже |
| План счетов | Code | Код | `MetadataChartOfAccountsStandardAttributeNames` | по свойствам кода | позже |
| План счетов | Description | Наименование | `MetadataChartOfAccountsStandardAttributeNames` | строка | позже |
| План счетов | Parent | Родитель | `MetadataChartOfAccountsStandardAttributeNames` | текущий объект | позже |
| План счетов | Type | Вид | `MetadataChartOfAccountsStandardAttributeNames` | резервное поведение | позже |
| План счетов | OffBalance | Забалансовый | `MetadataChartOfAccountsStandardAttributeNames` | булево | позже |
| План счетов | Order | Порядок | `MetadataChartOfAccountsStandardAttributeNames` | число | позже |
| План счетов | DeletionMark | ПометкаУдаления | `MetadataChartOfAccountsStandardAttributeNames` | булево | позже |
| План счетов | Predefined | Предопределенный | `MetadataChartOfAccountsStandardAttributeNames` | булево | позже |
| План счетов | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfAccountsStandardAttributeNames` | резервное поведение | позже |
| План видов характеристик | Ref | Ссылка | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект | позже |
| План видов характеристик | ValueType | ТипЗначения | `dataPathCommon` | описание типа | позже |
| План видов характеристик | Code | Код | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | по свойствам кода | позже |
| План видов характеристик | Description | Наименование | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | строка | позже |
| План видов характеристик | Parent | Родитель | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | текущий объект | позже |
| План видов характеристик | IsFolder | ЭтоГруппа | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | позже |
| План видов характеристик | DeletionMark | ПометкаУдаления | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | позже |
| План видов характеристик | Predefined | Предопределенный | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | булево | позже |
| План видов характеристик | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCharacteristicTypesStandardAttributeNames` | резервное поведение | позже |
| План видов расчета | Ref | Ссылка | `MetadataChartOfCalculationTypesStandardAttributeNames` | текущий объект | позже |
| План видов расчета | Code | Код | `MetadataChartOfCalculationTypesStandardAttributeNames` | по свойствам кода | позже |
| План видов расчета | Description | Наименование | `MetadataChartOfCalculationTypesStandardAttributeNames` | строка | позже |
| План видов расчета | ActionPeriodIsBasic | ПериодДействияБазовый | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | позже |
| План видов расчета | DeletionMark | ПометкаУдаления | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | позже |
| План видов расчета | Predefined | Предопределенный | `MetadataChartOfCalculationTypesStandardAttributeNames` | булево | позже |
| План видов расчета | PredefinedDataName | ИмяПредопределенныхДанных | `MetadataChartOfCalculationTypesStandardAttributeNames` | резервное поведение | позже |
| План обмена | Ref | Ссылка | `MetadataExchangePlanStandardAttributeNames` | текущий объект | позже |
| План обмена | Code | Код | `MetadataExchangePlanStandardAttributeNames` | по свойствам кода | позже |
| План обмена | Description | Наименование | `MetadataExchangePlanStandardAttributeNames` | строка | позже |
| План обмена | ThisNode | ЭтотУзел | `MetadataExchangePlanStandardAttributeNames` | текущий объект / узел плана обмена | позже |
| План обмена | ExchangeDate | ДатаОбмена | `MetadataExchangePlanStandardAttributeNames` | дата | позже |
| План обмена | SentNo | НомерОтправленного | `dataPathCommon` | скаляр | позже |
| План обмена | ReceivedNo | НомерПринятого | `dataPathCommon` | скаляр | позже |
| План обмена | DeletionMark | ПометкаУдаления | `MetadataExchangePlanStandardAttributeNames` | булево | позже |
| Журнал документов | Ref | Ссылка | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | позже |
| Журнал документов | Type | Тип | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | позже |
| Журнал документов | Date | Дата | `MetadataDocumentJournalStandardAttributeNames` | дата | позже |
| Журнал документов | Number | Номер | `MetadataDocumentJournalStandardAttributeNames` | резервное поведение | позже |
| Журнал документов | Posted | Проведен | `MetadataDocumentJournalStandardAttributeNames` | булево | позже |
| Журнал документов | DeletionMark | ПометкаУдаления | `MetadataDocumentJournalStandardAttributeNames` | булево | позже |
| Бизнес-процесс | Ref | Ссылка | `MetadataBusinessProcessStandardAttributeNames` | текущий объект | позже |
| Бизнес-процесс | Date | Дата | `MetadataBusinessProcessStandardAttributeNames` | дата | позже |
| Бизнес-процесс | Number | Номер | `MetadataBusinessProcessStandardAttributeNames` | резервное поведение | позже |
| Бизнес-процесс | Started | Стартован | `dataPathCommon` | булево | позже |
| Бизнес-процесс | Completed | Завершен | `dataPathCommon` | булево | позже |
| Бизнес-процесс | HeadTask | ГоловнаяЗадача | `MetadataBusinessProcessStandardAttributeNames` | задача | позже |
| Бизнес-процесс | DeletionMark | ПометкаУдаления | `MetadataBusinessProcessStandardAttributeNames` | булево | позже |
| Задача | Ref | Ссылка | `MetadataTaskStandardAttributeNames` | текущий объект | позже |
| Задача | Date | Дата | `MetadataTaskStandardAttributeNames` | дата | позже |
| Задача | Number | Номер | `MetadataTaskStandardAttributeNames` | резервное поведение | позже |
| Задача | Executed | Выполнена | `dataPathCommon` | булево | позже |
| Задача | BusinessProcess | БизнесПроцесс | `metadataTask/register.ts` | бизнес-процесс | позже |
| Задача | RoutePoint | ТочкаМаршрута | `metadataTask/register.ts` | точка маршрута бизнес-процесса | позже |
| Задача | Description | Описание | `MetadataTaskStandardAttributeNames` | строка | позже |
| Задача | DeletionMark | ПометкаУдаления | `MetadataTaskStandardAttributeNames` | булево | позже |
| Регистр сведений | Active | Активность | `MetadataInformationRegisterStandardAttributeNames` | булево | позже |
| Регистр сведений | LineNumber | НомерСтроки | `MetadataInformationRegisterStandardAttributeNames` | число | позже |
| Регистр сведений | Recorder | Регистратор | `MetadataInformationRegisterStandardAttributeNames` | регистратор | позже |
| Регистр сведений | Period | Период | `MetadataInformationRegisterStandardAttributeNames` | дата | позже |
| Регистр накопления | RecordType | ВидДвижения | `MetadataAccumulationRegisterStandardAttributeNames` | резервное поведение | позже |
| Регистр накопления | Active | Активность | `MetadataAccumulationRegisterStandardAttributeNames` | булево | позже |
| Регистр накопления | LineNumber | НомерСтроки | `MetadataAccumulationRegisterStandardAttributeNames` | число | позже |
| Регистр накопления | Recorder | Регистратор | `MetadataAccumulationRegisterStandardAttributeNames` | регистратор | позже |
| Регистр накопления | Period | Период | `MetadataAccumulationRegisterStandardAttributeNames` | дата | позже |
| Регистр накопления оборотов | Active | Активность | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | булево | позже |
| Регистр накопления оборотов | LineNumber | НомерСтроки | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | число | позже |
| Регистр накопления оборотов | Recorder | Регистратор | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | регистратор | позже |
| Регистр накопления оборотов | Period | Период | `MetadataAccumulationRegisterTurnoverStandardAttributeNames` | дата | позже |
| Регистр бухгалтерии | PeriodAdjustment | УточнениеПериода | `MetadataAccountingRegisterStandardAttributeNames` | резервное поведение | позже |
| Регистр бухгалтерии | Account | Счет | `MetadataAccountingRegisterStandardAttributeNames` | план счетов | позже |
| Регистр бухгалтерии | Active | Активность | `MetadataAccountingRegisterStandardAttributeNames` | булево | позже |
| Регистр бухгалтерии | LineNumber | НомерСтроки | `MetadataAccountingRegisterStandardAttributeNames` | число | позже |
| Регистр бухгалтерии | Recorder | Регистратор | `MetadataAccountingRegisterStandardAttributeNames` | регистратор | позже |
| Регистр бухгалтерии | Period | Период | `MetadataAccountingRegisterStandardAttributeNames` | дата | позже |
| Регистр бухгалтерии | ExtDimension1..50 | Субконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора | динамический набор |
| Регистр бухгалтерии | ExtDimensionType1..50 | ВидСубконто1..50 | `MetadataAccountingRegisterStandardAttributeNamesXML` | зависит от плана счетов и явного XML-набора | динамический набор |
| Регистр расчета | RegistrationPeriod | ПериодРегистрации | `MetadataCalculationRegisterStandardAttributeNames` | дата | позже |
| Регистр расчета | ReversingEntry | Сторно | `MetadataCalculationRegisterStandardAttributeNames` | булево | позже |
| Регистр расчета | Active | Активность | `MetadataCalculationRegisterStandardAttributeNames` | булево | позже |
| Регистр расчета | BegOfActionPeriod | НачалоПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | позже |
| Регистр расчета | EndOfActionPeriod | КонецПериодаДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата | позже |
| Регистр расчета | ActionPeriod | ПериодДействия | `MetadataCalculationRegisterStandardAttributeNames` | дата/период | позже |
| Регистр расчета | BegOfBasePeriod | НачалоБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | позже |
| Регистр расчета | EndOfBasePeriod | КонецБазовогоПериода | `MetadataCalculationRegisterStandardAttributeNames` | дата | позже |
| Регистр расчета | CalculationType | ВидРасчета | `MetadataCalculationRegisterStandardAttributeNames` | план видов расчета | позже |
| Регистр расчета | LineNumber | НомерСтроки | `MetadataCalculationRegisterStandardAttributeNames` | число | позже |
| Регистр расчета | Recorder | Регистратор | `MetadataCalculationRegisterStandardAttributeNames` | регистратор | позже |

## Первая волна

Первая реализация должна покрыть минимальный набор для задачи с `Owner`:

- `Ref`: тип текущего объекта.
- `Owner`: типы из свойства `owners`, с `isComposite` при нескольких владельцах.
- `Code`: для справочника через `codeType`.
- `Description`: строка для справочника.
- `IsFolder`, `DeletionMark`, `Predefined`, `Posted`: булевы.
- `Date`: дата.
- `LineNumber`: число.

Все остальные строки остаются в таблице как очередь на описание и используют безопасное резервное поведение.
