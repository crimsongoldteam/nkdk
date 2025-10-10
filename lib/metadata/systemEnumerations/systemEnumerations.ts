import { z } from "zod"

export const ZButtonRepresentation = z.enum(["Auto", "Picture", "PictureAndText", "Text"])
export const ZButtonRepresentationEnterprise = z.enum(["Авто", "Картинка", "КартинкаИТекст", "Текст"])
export const ZCurrentRowUse = z.enum(["Use", "DontUse"])

export enum XDTOFacetType {
  Length = "Длина",
  MaxInclusive = "МаксВключающее",
  MaxLength = "МаксДлина",
  MaxExclusive = "МаксИсключающее",
  MinInclusive = "МинВключающее",
  MinLength = "МинДлина",
  MinExclusive = "МинИсключающее",
  Pattern = "Образец",
  Enumeration = "Перечисление",
  Whitespace = "ПробельныеСимволы",
  TotalDigits = "РазрядовВсего",
  FractionDigits = "РазрядовДробнойЧасти",
}

export enum XMLForm {
  Attribute = "Атрибут",
  Text = "Текст",
  Element = "Элемент",
}

export enum WSParameterDirection {
  In = "Входной",
  InOut = "ВходнойВыходной",
  Out = "Выходной",
}

export enum DOMBuilderAction {
  InsertBefore = "ВставитьПеред",
  InsertAfter = "ВставитьПосле",
  AppendAsChildren = "ДобавитьКакДочерние",
  Replace = "Заменить",
  ReplaceChildren = "ЗаменитьДочерние",
}

export enum DOMDocumentPosition {
  ImplementationSpecific = "ЗависитОтРеализации",
  Disconnected = "Отсоединен",
  Preceding = "Предшествует",
  Following = "Следует",
  Contains = "Содержит",
  ContainedBy = "Содержится",
}

export enum DOMNodeFilterParameters {
  ShowAttribute = "ОтображатьАтрибут",
  ShowAll = "ОтображатьВсе",
  ShowDocument = "ОтображатьДокумент",
  ShowProcessingInstruction = "ОтображатьИнструкциюОбработки",
  ShowComment = "ОтображатьКомментарий",
  ShowNotation = "ОтображатьНотацию",
  ShowDocumentType = "ОтображатьОпределениеТипаДокумента",
  ShowCDATASection = "ОтображатьСекцииCDATA",
  ShowEntityReference = "ОтображатьСсылкуНаСущность",
  ShowEntity = "ОтображатьСущность",
  ShowText = "ОтображатьТекст",
  ShowDocumentFragment = "ОтображатьФрагментДокумента",
  ShowElement = "ОтображатьЭлемент",
}

export enum DOMNodeType {
  Attribute = "Атрибут",
  Document = "Документ",
  ProcessingInstruction = "ИнструкцияОбработки",
  Comment = "Комментарий",
  Notation = "Нотация",
  DocumentType = "ОпределениеТипаДокумента",
  XPathNamespace = "ПространствоИменXPath",
  CDATASection = "СекцияCDATA",
  EntityReference = "СсылкаНаСущность",
  Entity = "Сущность",
  Text = "Текст",
  DocumentFragment = "ФрагментДокумента",
  Element = "Элемент",
}

export enum DOMXPathResultType {
  Boolean = "Булево",
  Any = "Любой",
  AnyUnorderedNode = "ЛюбойНеупорядоченныйУзел",
  UnorderedNodeIterator = "НеупорядоченныйИтераторУзлов",
  UnorderedNodeSnapshot = "НеупорядоченныйСнимокУзлов",
  FirstOrderedNode = "ПервыйУпорядоченныйУзел",
  String = "Строка",
  OrderedNodeIterator = "УпорядоченныйИтераторУзлов",
  OrderedNodeSnapshot = "УпорядоченныйСнимокУзлов",
  Number = "Число",
}

export enum HTMLContentCategory {
  AppletTags = "AppletТеги",
  AreaTags = "AreaТеги",
  EmbedTags = "EmbedТеги",
  FrameTags = "FrameТеги",
  IframeTags = "IframeТеги",
  ImportAttributes = "ImportАтрибуты",
  JavaScriptTags = "JavaScriptТеги",
  LinkTags = "LinkТеги",
  NoembedTags = "NoembedТеги",
  ObjectTags = "ObjectТеги",
  SourceTags = "SourceТеги",
  StyleTags = "StyleТеги",
  W3IncludeAttributes = "W3IncludeАтрибуты",
  All = "Все",
  EventsHandlers = "ОбработчикиСобытий",
}

export enum DataCompositionAccountingBalanceType {
  Debit = "Дебет",
  Credit = "Кредит",
  None = "Нет",
}

export enum DataCompositionAreaTemplateType {
  Header = "Заголовок",
  HierarchicalHeader = "ЗаголовокИерархии",
  OverallHeader = "ОбщийИтогЗаголовок",
  OverallFooter = "ОбщийИтогПодвал",
  Footer = "Подвал",
  HierarchicalFooter = "ПодвалИерархии",
}

export enum DataCompositionAttributesPlacement {
  Together = "Вместе",
  WithOwnerField = "ВместеСВладельцем",
  SpecialPosition = "ВСпециальнойПозиции",
  Separately = "Отдельно",
}

export enum DataCompositionBalanceType {
  ClosingBalance = "КонечныйОстаток",
  OpeningBalance = "НачальныйОстаток",
  None = "Нет",
}

export enum DataCompositionChartLegendPlacement {
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export enum DataCompositionComparisonType {
  Greater = "Больше",
  GreaterOrEqual = "БольшеИлиРавно",
  InHierarchy = "ВИерархии",
  InList = "ВСписке",
  InListByHierarchy = "ВСпискеПоИерархии",
  Filled = "Заполнено",
  Less = "Меньше",
  LessOrEqual = "МеньшеИлиРавно",
  BeginsWith = "НачинаетсяС",
  NotInHierarchy = "НеВИерархии",
  NotInList = "НеВСписке",
  NotInListByHierarchy = "НеВСпискеПоИерархии",
  NotFilled = "НеЗаполнено",
  NotBeginsWith = "НеНачинаетсяС",
  NotLike = "НеПодобно",
  NotEqual = "НеРавно",
  NotContains = "НеСодержит",
  Like = "Подобно",
  Equal = "Равно",
  Contains = "Содержит",
}

export enum DataCompositionConditionalAppearanceUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum DataCompositionDataSetsLinkType {
  Outer = "Внешняя",
  Inner = "Внутренняя",
}

export enum DataCompositionDetailsProcessingAction {
  None = "Нет",
  OpenValue = "ОткрытьЗначение",
  Filter = "Отфильтровать",
  ApplyAppearance = "Оформить",
  DrillDown = "Расшифровать",
  Group = "Сгруппировать",
  Order = "Упорядочить",
}

export enum DataCompositionFieldPlacement {
  Auto = "Авто",
  Vertically = "Вертикально",
  Together = "Вместе",
  Horizontally = "Горизонтально",
  SpecialColumn = "ОтдельнаяКолонка",
}

export enum DataCompositionFieldsTitleType {
  Auto = "Авто",
  Short = "Краткий",
  Full = "Полный",
}

export enum DataCompositionFilterApplicationType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export enum DataCompositionFilterItemsGroupType {
  AndGroup = "ГруппаИ",
  OrGroup = "ГруппаИли",
  NotGroup = "ГруппаНе",
}

export enum DataCompositionFixation {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export enum DataCompositionGroupFieldsPlacement {
  Together = "Вместе",
  Separately = "Отдельно",
  SeparatelyAndInTotalsOnly = "ОтдельноИТолькоВИтогах",
}

export enum DataCompositionGroupPlacement {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
  None = "Нет",
}

export enum DataCompositionGroupTemplateType {
  Auto = "Авто",
  Vertical = "Вертикальный",
  Horizontal = "Горизонтальный",
}

export enum DataCompositionGroupType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export enum DataCompositionGroupUseVariant {
  Auto = "Авто",
  AdditionalInformation = "ДополнительнаяИнформация",
}

export enum DataCompositionParameterUse {
  Auto = "Авто",
  Always = "Всегда",
}

export enum DataCompositionPeriodAdditionType {
  None = "БезДополнения",
  Year = "Год",
  YearSinceBeginOfPeriod = "ГодОтНачалаПериода",
  YearSinceBeginOfPeriod445 = "ГодОтНачалаПериода445",
  TenDays = "Декада",
  Day = "День",
  DaySinceBeginOfPeriod = "ДеньОтНачалаПериода",
  Quarter = "Квартал",
  QuarterSinceBeginOfPeriod = "КварталОтНачалаПериода",
  QuarterSinceBeginOfPeriod445 = "КварталОтНачалаПериода445",
  Month = "Месяц",
  MonthSinceBeginOfPeriod = "МесяцОтНачалаПериода",
  MonthSinceBeginOfPeriod445 = "МесяцОтНачалаПериода445",
  Minute = "Минута",
  MinuteSinceBeginOfPeriod = "МинутаОтНачалаПериода",
  Week = "Неделя",
  WeekSinceBeginOfPeriod = "НеделяОтНачалаПериода",
  HalfYear = "Полугодие",
  HalfYearSinceBeginOfPeriod = "ПолугодиеОтНачалаПериода",
  HalfYearSinceBeginOfPeriod445 = "ПолугодиеОтНачалаПериода445",
  Second = "Секунда",
  Hour = "Час",
  HourSinceBeginOfPeriod = "ЧасОтНачалаПериода",
}

export enum DataCompositionPeriodType {
  Additional = "Дополнительный",
  Main = "Основной",
}

export enum DataCompositionPictureOutputType {
  Auto = "Авто",
  OutputByValue = "ВыводитьПоЗначению",
  OutputByRef = "ВыводитьПоСсылке",
  DontOutput = "НеВыводить",
}

export enum DataCompositionResourcesAutoPosition {
  DontUse = "НеИспользовать",
  AfterAllFields = "ПослеВсехПолей",
}

export enum DataCompositionResourcesPlacement {
  Vertically = "Вертикально",
  Horizontally = "Горизонтально",
}

export enum DataCompositionResourcesPlacementInChart {
  Auto = "Авто",
  Series = "Серии",
  Points = "Точки",
}

export enum DataCompositionResultItemType {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
}

export enum DataCompositionResultNestedItemsLayout {
  Vertically = "Вертикально",
  Horizontally = "Горизонтально",
}

export enum DataCompositionSettingsItemState {
  Enabled = "Включен",
  Disabled = "Отключен",
  DeletedByUser = "УдаленПользователем",
}

export enum DataCompositionSettingsItemViewMode {
  Auto = "Авто",
  QuickAccess = "БыстрыйДоступ",
  Inaccessible = "Недоступный",
  Normal = "Обычный",
}

export enum DataCompositionSettingsRefreshMethod {
  Full = "Полное",
  CheckAvailability = "ПроверятьДоступность",
}

export enum DataCompositionSettingsViewMode {
  QuickAccess = "БыстрыйДоступ",
  All = "Все",
}

export enum DataCompositionSortDirection {
  Asc = "Возр",
  Desc = "Убыв",
}

export enum DataCompositionTextOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export enum DataCompositionTextPlacementType {
  Overflow = "Выступать",
  Block = "Забивать",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export enum DataCompositionTotalPlacement {
  Auto = "Авто",
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
  None = "Нет",
}

export enum OnUnavailabilityDataCompositionSettingsAction {
  DisableControl = "ИзменятьДоступностьПоля",
  HidePage = "СкрыватьСтраницу",
}

export enum ResultCompositionMode {
  Auto = "Авто",
  Directly = "Непосредственно",
  Background = "Фоновый",
}

export enum SaveDataCompositionAppearance {
  Auto = "Авто",
  ForUser = "ДляПользователя",
  ForCurrentResult = "ДляТекущегоРезультата",
  DontUse = "НеИспользовать",
  ByKeyForUser = "ПоКлючуДляПользователя",
}

export enum XSAttributeUseCategory {
  Prohibited = "Запрещено",
  Optional = "Необязательно",
  Required = "Обязательно",
}

export enum XSComplexFinal {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export enum XSComponentType {
  Annotation = "Аннотация",
  Include = "Включение",
  ModelGroup = "ГруппаМодели",
  Documentation = "Документация",
  Import = "Импорт",
  AppInfo = "ИнформацияПриложения",
  AttributeUse = "ИспользованиеАтрибута",
  MaxInclusiveFacet = "МаксимальноВключающийФасет",
  MaxExclusiveFacet = "МаксимальноИсключающийФасет",
  Wildcard = "Маска",
  MinInclusiveFacet = "МинимальноВключающийФасет",
  MinExclusiveFacet = "МинимальноИсключающийФасет",
  AttributeDeclaration = "ОбъявлениеАтрибута",
  NotationDeclaration = "ОбъявлениеНотации",
  ElementDeclaration = "ОбъявлениеЭлемента",
  XPathDefinition = "ОпределениеXPath",
  AttributeGroupDefinition = "ОпределениеГруппыАтрибутов",
  ModelGroupDefinition = "ОпределениеГруппыМодели",
  IdentityConstraintDefinition = "ОпределениеОграниченияИдентичности",
  SimpleTypeDefinition = "ОпределениеПростогоТипа",
  ComplexTypeDefinition = "ОпределениеСоставногоТипа",
  Redefine = "Переопределение",
  Schema = "Схема",
  LengthFacet = "ФасетДлины",
  FractionDigitsFacet = "ФасетКоличестваРазрядовДробнойЧасти",
  MaxLengthFacet = "ФасетМаксимальнойДлины",
  MinLengthFacet = "ФасетМинимальнойДлины",
  PatternFacet = "ФасетОбразца",
  TotalDigitsFacet = "ФасетОбщегоКоличестваРазрядов",
  EnumerationFacet = "ФасетПеречисления",
  WhitespaceFacet = "ФасетПробельныхСимволов",
  Particle = "Фрагмент",
}

export enum XSCompositor {
  All = "Все",
  Choice = "Выбор",
  Sequence = "Последовательность",
}

export enum XSConstraint {
  Default = "ПоУмолчанию",
  Fixed = "Фиксированное",
}

export enum XSContentModel {
  Simple = "Простая",
  Complex = "Составная",
}

export enum XSDerivationMethod {
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export enum XSDisallowedSubstitutions {
  All = "Все",
  Restriction = "Ограничение",
  Substitution = "Подстановка",
  Extension = "Расширение",
}

export enum XSForm {
  Qualified = "Квалифицированная",
  Unqualified = "Неквалифицированная",
}

export enum XSIdentityConstraintCategory {
  Key = "Ключ",
  KeyRef = "СсылкаНаКлюч",
  Unique = "Уникальность",
}

export enum XSNamespaceConstraintCategory {
  Not = "Кроме",
  Any = "Любое",
  Set = "Набор",
}

export enum XSProcessContents {
  Skip = "Пропустить",
  Lax = "Слабая",
  Strict = "Строгая",
}

export enum XSProhibitedSubstitutions {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export enum XSSchemaFinal {
  All = "Все",
  Union = "Объединение",
  Restriction = "Ограничение",
  Extension = "Расширение",
  List = "Список",
}

export enum XSSimpleFinal {
  All = "Все",
  Union = "Объединение",
  Restriction = "Ограничение",
  List = "Список",
}

export enum XSSimpleTypeVariety {
  Atomic = "Атомарная",
  Union = "Объединение",
  List = "Список",
}

export enum XSSubstitutionGroupExclusions {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export enum XSWhitespaceHandling {
  Replace = "Заменять",
  Collapse = "Сворачивать",
  Preserve = "Сохранять",
}

export enum XSXPathVariety {
  Field = "Поле",
  Selector = "Селектор",
}

export enum EventLogDataStorageSplitPeriod {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Week = "Неделя",
  DontUse = "НеИспользовать",
  Hour = "Час",
}

export enum EventLogEntryTransactionMode {
  Independent = "Независимая",
  Transactional = "Транзакционная",
}

export enum EventLogEntryTransactionStatus {
  Committed = "Зафиксирована",
  Unfinished = "НеЗавершена",
  NotApplicable = "НетТранзакции",
  RolledBack = "Отменена",
}

export enum EventLogLevel {
  Information = "Информация",
  Error = "Ошибка",
  Warning = "Предупреждение",
  Note = "Примечание",
}

export enum DataLockControlMode {
  Automatic = "Автоматический",
  Managed = "Управляемый",
}

export enum DataLockMode {
  Exclusive = "Исключительный",
  Shared = "Разделяемый",
}

export enum AccountingRecordType {
  Debit = "Дебет",
  Credit = "Кредит",
}

export enum AccountType {
  ActivePassive = "АктивноПассивный",
  Active = "Активный",
  Passive = "Пассивный",
}

export enum AccumulationRecordType {
  Receipt = "Приход",
  Expense = "Расход",
}

export enum AccumulationRegisterAggregatePeriodicity {
  Auto = "Авто",
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
  HalfYear = "Полугодие",
}

export enum AccumulationRegisterAggregateUse {
  Auto = "Авто",
  Always = "Всегда",
}

export enum AutoTimeMode {
  DontUse = "НеИспользовать",
  First = "Первым",
  Last = "Последним",
  CurrentOrFirst = "ТекущееИлиПервым",
  CurrentOrLast = "ТекущееИлиПоследним",
}

export enum BusinessProcessRoutePointType {
  SubBusinessProcess = "ВложенныйБизнесПроцесс",
  Switch = "ВыборВарианта",
  Activity = "Действие",
  End = "Завершение",
  Processing = "Обработка",
  Split = "Разделение",
  Join = "Слияние",
  Start = "Старт",
  Condition = "Условие",
}

export enum CalculationRegisterPeriodType {
  BasePeriod = "БазовыйПериод",
  ActionPeriod = "ПериодДействия",
  RegistrationPeriod = "ПериодРегистрации",
  ActualActionPeriod = "ФактическийПериодДействия",
}

export enum DocumentPostingMode {
  Regular = "Неоперативный",
  RealTime = "Оперативный",
}

export enum DocumentWriteMode {
  Write = "Запись",
  UndoPosting = "ОтменаПроведения",
  Posting = "Проведение",
}

export enum FoldersAndItemsUse {
  Folders = "Группы",
  FoldersAndItems = "ГруппыИЭлементы",
  Items = "Элементы",
}

export enum PostingModeUse {
  Auto = "Авто",
  Regular = "Неоперативный",
  RealTime = "Оперативный",
}

export enum SliceUse {
  DontUse = "НеИспользовать",
  First = "Первые",
  Last = "Последние",
}

export enum BackgroundJobState {
  Active = "Активно",
  Completed = "Завершено",
  Failed = "ЗавершеноАварийно",
  Canceled = "Отменено",
}

export enum CryptoCertificateCheckMode {
  IgnoreTimeValidity = "ИгнорироватьВремяДействия",
  IgnoreSignatureValidity = "ИгнорироватьДействительностьПодписи",
  IgnoreCertificateRevocationStatus = "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов",
  AllowTestCertificates = "РазрешитьТестовыеСертификаты",
}

export enum CryptoCertificateIncludeMode {
  IncludeWholeChain = "ВключатьПолнуюЦепочку",
  IncludeSubjectCertificate = "ВключатьСертификатСубъекта",
  IncludeChainWithoutRoot = "ВключатьЦепочкуБезКорневого",
  DontInclude = "НеВключать",
}

export enum CryptoCertificateStorePlacement {
  ComputerData = "ДанныеКомпьютера",
  OSUserData = "ДанныеПользователяОС",
  ApplicationData = "ДанныеПриложения",
}

export enum CryptoCertificateStoreType {
  RootCertificates = "КорневыеСертификаты",
  PersonalCertificates = "ПерсональныеСертификаты",
  RecipientCertificates = "СертификатыПолучателей",
  CertificationAuthorityCertificates = "СертификатыУдостоверяющихЦентров",
}

export enum CryptoInteractiveModeUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum FormattedDocumentFileType {
  ANSITXT = "ANSITXT",
  HTML = "HTML",
  PDF = "PDF",
  TXT = "TXT",
}

export enum FormattedDocumentParagraphType {
  BulletedList = "МаркированныйСписок",
  NumberedList = "НумерованныйСписок",
  Usual = "Обычный",
}

export enum RowGotoDirection {
  Up = "Вверх",
  Down = "Вниз",
}

export enum InternetMailAttachmentEncodingMode {
  MIME = "MIME",
  UUEncode = "UUEncode",
}

export enum InternetMailMessageImportance {
  High = "Высокая",
  Highest = "Наивысшая",
  Lowest = "Наименьшая",
  Low = "Низкая",
  Normal = "Обычная",
}

export enum InternetMailMessageNonASCIISymbolsEncodingMode {
  MIME = "MIME",
  QuotedPrintable = "QuotedPrintable",
  None = "БезКодирования",
}

export enum InternetMailMessageParseStatus {
  ErrorsDetected = "ОбнаруженыОшибки",
  ErrorsNotDetected = "ОшибокНеОбнаружено",
}

export enum InternetMailProtocol {
  IMAP = "IMAP",
  POP3 = "POP3",
  SMTP = "SMTP",
}

export enum InternetMailTextProcessing {
  DontProcess = "НеОбрабатывать",
  Process = "Обрабатывать",
}

export enum InternetMailTextType {
  HTML = "HTML",
  CustomText = "ПроизвольныйТекст",
  PlainText = "ПростойТекст",
  RichText = "РазмеченныйТекст",
}

export enum POP3AuthenticationMode {
  APOP = "APOP",
  CramMD5 = "CramMD5",
  General = "Обычная",
}

export enum SMTPAuthenticationMode {
  CramMD5 = "CramMD5",
  Login = "Login",
  Plain = "Plain",
  None = "БезАутентификации",
  Default = "ПоУмолчанию",
}

export enum UseInternetMailTokenAuthentication {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum QueryBuilderDimensionType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export enum AddInConnectionType {
  Isolated = "Изолированно",
  NotIsolated = "НеИзолированно",
}

export enum AddInType {
  COM = "COM",
  Native = "Native",
}

export enum AllowedLength {
  Variable = "Переменная",
  Fixed = "Фиксированная",
}

export enum AllowedSign {
  Any = "Любой",
  Nonnegative = "Неотрицательный",
}

export enum ApplicationFormsOpenningMode {
  Tabs = "Закладки",
  SingleWindows = "ОтдельныеОкна",
}

export enum BorderType {
  Absolute = "Абсолютная",
  StyleItem = "ЭлементСтиля",
}

export enum BoundaryType {
  Including = "Включая",
  Excluding = "Исключая",
}

export enum ByteOrderMarkUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ClientApplicationBaseFontVariant {
  Large = "Крупный",
  Normal = "Обычный",
}

export enum ClientApplicationFormScaleVariant {
  Auto = "Авто",
  Compact = "Компактный",
  Normal = "Обычный",
}

export enum ClientApplicationInterfaceVariant {
  Version8_2 = "Версия8_2",
  Taxi = "Такси",
}

export enum ClientApplicationType {
  WebClient = "ВебКлиент",
  ExternalConnection = "ВнешнееСоединение",
  MobileAppClient = "МобильноеПриложениеКлиент",
  MobileClient = "МобильныйКлиент",
  ThickClient = "ТолстыйКлиент",
  ThinClient = "ТонкийКлиент",
}

export enum ClientConnectionSpeed {
  Low = "Низкая",
  Normal = "Обычная",
}

export enum ClientRunMode {
  Auto = "Авто",
  OrdinaryApplication = "ОбычноеПриложение",
  ManagedApplication = "УправляемоеПриложение",
}

export enum ColorType {
  WebColor = "WebЦвет",
  WindowsColor = "WindowsЦвет",
  Absolute = "Абсолютный",
  AutoColor = "АвтоЦвет",
  StyleItem = "ЭлементСтиля",
}

export enum ComparisonType {
  Greater = "Больше",
  GreaterOrEqual = "БольшеИлиРавно",
  InHierarchy = "ВИерархии",
  InList = "ВСписке",
  InListByHierarchy = "ВСпискеПоИерархии",
  Interval = "Интервал",
  IntervalIncludingBounds = "ИнтервалВключаяГраницы",
  IntervalIncludingLowerBound = "ИнтервалВключаяНачало",
  IntervalIncludingUpperBound = "ИнтервалВключаяОкончание",
  Less = "Меньше",
  LessOrEqual = "МеньшеИлиРавно",
  NotInHierarchy = "НеВИерархии",
  NotInList = "НеВСписке",
  NotInListByHierarchy = "НеВСпискеПоИерархии",
  NotEqual = "НеРавно",
  NotContains = "НеСодержит",
  Equal = "Равно",
  Contains = "Содержит",
}

export enum CompositeWordsSeparationMode {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ConfigurationExtensionApplicationIssueSeverity {
  Critical = "Критичная",
  Low = "Низкая",
  Moderate = "Обычная",
}

export enum ConfigurationExtensionScope {
  InfoBase = "ИнформационнаяБаза",
  DataSeparation = "РазделениеДанных",
}

export enum ConfigurationExtensionsSource {
  Database = "БазаДанных",
  SessionApplied = "СеансАктивные",
  SessionDisabled = "СеансОтключенные",
}

export enum DataBaseConfigurationUpdateExecutionInformationItemType {
  Information = "Информация",
  Error = "Ошибка",
  Warning = "Предупреждение",
}

export enum DataBaseConfigurationUpdateState {
  RefreshInProgress = "ВыполняетсяАктуализация",
  ProcessingInProgress = "ВыполняетсяОбработка",
  NotActive = "Неактивно",
}

export enum DatabaseTablespacesUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum DateFractions {
  Time = "Время",
  Date = "Дата",
  DateTime = "ДатаВремя",
}

export enum DialogReturnCode {
  Yes = "Да",
  No = "Нет",
  OK = "ОК",
  Cancel = "Отмена",
  Retry = "Повторить",
  Abort = "Прервать",
  Ignore = "Пропустить",
  Timeout = "Таймаут",
}

export enum DynamicListKeyType {
  Auto = "Авто",
  FieldValue = "ЗначениеПоля",
  RowKey = "КлючСтроки",
  RowNumber = "НомерСтроки",
}

export enum EnterKeyBehaviorType {
  DefaultButton = "КнопкаПоУмолчанию",
  ControlNavigation = "ПереходПоЭлементамФормы",
}

export enum ExternalDataSourceState {
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export enum FillChecking {
  ShowError = "ВыдаватьОшибку",
  DontCheck = "НеПроверять",
}

export enum FontType {
  WindowsFont = "WindowsШрифт",
  Absolute = "Абсолютный",
  AutoFont = "АвтоШрифт",
  StyleItem = "ЭлементСтиля",
}

export enum FullTextSearchMetadataUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum FullTextSearchMode {
  Disable = "Запретить",
  Enable = "Разрешить",
}

export enum FullTextSearchRepresentationType {
  HTMLText = "HTMLТекст",
  XML = "XML",
}

export enum FullTextSearchVersion {
  Version1 = "Версия1",
  Version2 = "Версия2",
}

export enum HashFunction {
  CRC32 = "CRC32",
  MD5 = "MD5",
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum InterfaceCompatibilityMode {
  Version8_2 = "Версия8_2",
  Version8_2EnableTaxi = "Версия8_2РазрешитьТакси",
  Taxi = "Такси",
  TaxiEnableVersion8_2 = "ТаксиРазрешитьВерсия8_2",
}

export enum IntervalBoundVariant {
  WithoutRestriction = "БезОграничения",
  Year = "Год",
  Quarter = "Квартал",
  SpecificDate = "КонкретнаяДата",
  Month = "Месяц",
  Week = "Неделя",
  WorkingDate = "РабочаяДата",
  BeforeAfter = "Смещение",
}

export enum LocationRelativeToGeofence {
  Inside = "Внутри",
  Outside = "Снаружи",
}

export enum MessageStatus {
  WithoutStatus = "БезСтатуса",
  Important = "Важное",
  Attention = "Внимание",
  Information = "Информация",
  Ordinary = "Обычное",
  VeryImportant = "ОченьВажное",
}

export enum MobileApplicationFunctionalities {
  BluetoothPrinters = "BluetoothПринтеры",
  NFC = "NFC",
  PushNotifications = "PushУведомления",
  WiFiPrinters = "WiFiПринтеры",
  AutoSendSMS = "АвтоматическаяОтправкаSMSСообщений",
  MusicLibrary = "БиблиотекаМузыки",
  PictureAndVideoLibraries = "БиблиотекиКартинокИВидео",
  Biometrics = "Биометрия",
  Videoconferences = "Видеоконференции",
  AudioPlaybackAndVibration = "ВоспроизведениеАудиоИВибрация",
  BackgroundAudioPlaybackAndVibration = "ВоспроизведениеАудиоИВибрацияВФоновомРежиме",
  InAppPurchases = "ВстроенныеПокупки",
  IncomingShareRequests = "ВходящиеЗапросыПоделиться",
  Geofences = "Геозоны",
  Location = "Геопозиционирование",
  BackgroundLocation = "ГеопозиционированиеВФоновомРежиме",
  AllFilesAccess = "ДоступКоВсемФайлам",
  SMSLog = "ЖурналSMS",
  CallLog = "ЖурналЗвонков",
  BackgroundAudioRecording = "ЗаписьАудиоВФоновомРежиме",
  Calendars = "Календари",
  Camera = "Камера",
  Contacts = "Контакты",
  LocalNotifications = "ЛокальныеУведомления",
  Microphone = "Микрофон",
  NumberDialing = "НаборНомера",
  PersonalComputerFileExchange = "ОбменФайламиСПерсональнымКомпьютером",
  AllIncomingShareRequestsTypesProcessing = "ОбработкаВсехТиповВходящихЗапросовПоделиться",
  CallProcessing = "ОбработкаЗвонков",
  ReceiveSMS = "ПолучениеSMS",
  SpeechToText = "РаспознаваниеРечи",
  OSBackup = "РезервноеКопированиеСредствамиОС",
  Ads = "Реклама",
  TextToSpeech = "СинтезРечи",
  DocumentScanning = "СканированиеДокументов",
  BarcodeScanning = "СканированиеШтрихКодов",
  ApplicationUsageStatistics = "СтатистикаИспользованияПриложения",
  InstallPackages = "УстановкаПриложений",
}

export enum NumericValueType {
  Cardinal = "Количественное",
  Ordinal = "Порядковое",
}

export enum PasswordPolicyComplianceCheckResult {
  DoesNotSatisfyMinLengthRequirements = "НеСоответствуетТребованиямМинимальнойДлины",
  DoesNotSatisfyReuseLimitRequirements = "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних",
  DoesNotSatisfyCompromiseCheckRequirements = "НеСоответствуетТребованиямПроверкиРаскрытия",
  DoesNotSatisfyComplexityRequirements = "НеСоответствуетТребованиямСложности",
}

export enum PeriodSettingsVariant {
  Interval = "Интервал",
  Period = "Период",
}

export enum PeriodVariant {
  Year = "Год",
  Day = "День",
  DayFromBegOfYear = "ДеньСНачалаГода",
  DayFromBegOfQuarter = "ДеньСНачалаКвартала",
  DayFromBegOfMonth = "ДеньСНачалаМесяца",
  Quarter = "Квартал",
  QuarterFromBegOfYear = "КварталСНачалаГода",
  Month = "Месяц",
  MonthFromBegOfYear = "МесяцСНачалаГода",
  MonthFromBegOfQuarter = "МесяцСНачалаКвартала",
  AnyInterval = "ПроизвольныйИнтервал",
}

export enum PictureType {
  Absolute = "Абсолютная",
  FromLib = "ИзБиблиотеки",
  Empty = "Пустая",
}

export enum PlatformType {
  Android_ARM = "Android_ARM",
  Android_ARM_64 = "Android_ARM_64",
  Android_x86 = "Android_x86",
  Android_x86_64 = "Android_x86_64",
  iOS_ARM = "iOS_ARM",
  iOS_ARM_64 = "iOS_ARM_64",
  Linux_ARM64 = "Linux_ARM64",
  Linux_E2K = "Linux_E2K",
  Linux_x86 = "Linux_x86",
  Linux_x86_64 = "Linux_x86_64",
  MacOS_x86 = "MacOS_x86",
  MacOS_x86_64 = "MacOS_x86_64",
  Windows_x86 = "Windows_x86",
  Windows_x86_64 = "Windows_x86_64",
  WinRT_ARM = "WinRT_ARM",
  WinRT_x86 = "WinRT_x86",
  WinRT_x86_64 = "WinRT_x86_64",
}

export enum QuestionDialogMode {
  YesNo = "ДаНет",
  YesNoCancel = "ДаНетОтмена",
  OK = "ОК",
  OKCancel = "ОКОтмена",
  RetryCancel = "ПовторитьОтмена",
  AbortRetryIgnore = "ПрерватьПовторитьПропустить",
}

export enum ReplacementMode {
  Append = "Добавление",
  Replace = "Замещение",
  Update = "Обновление",
  Merge = "Слияние",
  Delete = "Удаление",
}

export enum RoundMode {
  Round15as10 = "Окр15как10",
  Round15as20 = "Окр15как20",
}

export enum SearchDirection {
  FromEnd = "СКонца",
  FromBegin = "СНачала",
}

export enum SectionsPanelRepresentation {
  Picture = "Картинка",
  PictureAndText = "КартинкаИТекст",
  PictureOnTopAndText = "КартинкаСверхуИТекст",
  PictureOnLeftAndText = "КартинкаСлеваИТекст",
  Text = "Текст",
}

export enum SortDirection {
  Asc = "Возр",
  Desc = "Убыв",
}

export enum StandardBeginningDateVariant {
  BeginningOfLastYear = "НачалоПрошлогоГода",
  BeginningOfLastDay = "НачалоПрошлогоДня",
  BeginningOfLastQuarter = "НачалоПрошлогоКвартала",
  BeginningOfLastMonth = "НачалоПрошлогоМесяца",
  BeginningOfLastHalfYear = "НачалоПрошлогоПолугодия",
  BeginningOfLastTenDays = "НачалоПрошлойДекады",
  BeginningOfLastWeek = "НачалоПрошлойНедели",
  BeginningOfNextYear = "НачалоСледующегоГода",
  BeginningOfNextDay = "НачалоСледующегоДня",
  BeginningOfNextQuarter = "НачалоСледующегоКвартала",
  BeginningOfNextMonth = "НачалоСледующегоМесяца",
  BeginningOfNextHalfYear = "НачалоСледующегоПолугодия",
  BeginningOfNextTenDays = "НачалоСледующейДекады",
  BeginningOfNextWeek = "НачалоСледующейНедели",
  BeginningOfThisYear = "НачалоЭтогоГода",
  BeginningOfThisDay = "НачалоЭтогоДня",
  BeginningOfThisQuarter = "НачалоЭтогоКвартала",
  BeginningOfThisMonth = "НачалоЭтогоМесяца",
  BeginningOfThisHalfYear = "НачалоЭтогоПолугодия",
  BeginningOfThisTenDays = "НачалоЭтойДекады",
  BeginningOfThisWeek = "НачалоЭтойНедели",
  Custom = "ПроизвольнаяДата",
}

export enum StandardGlobalSearchType {
  AllFunctions = "ВсеФункции",
  Expression = "Выражение",
  GlobalStandardCommands = "ГлобальныеСтандартныеКоманды",
  Data = "Данные",
  UserWorkFavorites = "ИзбранноеРаботыПользователя",
  UserWorkHistory = "ИсторияРаботыПользователя",
  FunctionMenu = "МенюФункций",
  URL = "НавигационнаяСсылка",
  CollaborationSystemConversations = "ОбсужденияСистемыВзаимодействия",
  CollaborationSystemMessages = "СообщенияСистемыВзаимодействия",
  Help = "Справка",
  FunctionsForTechnicalSpecialist = "ФункцииДляТехническогоСпециалиста",
}

export enum StandardPeriodVariant {
  Yesterday = "Вчера",
  TillEndOfThisYear = "ДоКонцаЭтогоГода",
  TillEndOfThisQuarter = "ДоКонцаЭтогоКвартала",
  TillEndOfThisMonth = "ДоКонцаЭтогоМесяца",
  TillEndOfThisHalfYear = "ДоКонцаЭтогоПолугодия",
  TillEndOfThisTenDays = "ДоКонцаЭтойДекады",
  TillEndOfThisWeek = "ДоКонцаЭтойНедели",
  Tomorrow = "Завтра",
  Month = "Месяц",
  Last7Days = "Последние7Дней",
  Custom = "ПроизвольныйПериод",
  LastTenDays = "ПрошлаяДекада",
  LastTenDaysTillSameDayNumber = "ПрошлаяДекадаДоТакогоЖеНомераДня",
  LastWeek = "ПрошлаяНеделя",
  LastWeekTillSameWeekDay = "ПрошлаяНеделяДоТакогоЖеДняНедели",
  LastHalfYear = "ПрошлоеПолугодие",
  LastHalfYearTillSameDate = "ПрошлоеПолугодиеДоТакойЖеДаты",
  LastYear = "ПрошлыйГод",
  LastYearTillSameDate = "ПрошлыйГодДоТакойЖеДаты",
  LastQuarter = "ПрошлыйКвартал",
  LastQuarterTillSameDate = "ПрошлыйКварталДоТакойЖеДаты",
  LastMonth = "ПрошлыйМесяц",
  LastMonthTillSameDate = "ПрошлыйМесяцДоТакойЖеДаты",
  Today = "Сегодня",
  NextTenDays = "СледующаяДекада",
  NextTenDaysTillSameDayNumber = "СледующаяДекадаДоТакогоЖеНомераДня",
  NextWeek = "СледующаяНеделя",
  NextWeekTillSameWeekDay = "СледующаяНеделяДоТакогоЖеДняНедели",
  NextHalfYear = "СледующееПолугодие",
  NextHalfYearTillSameDate = "СледующееПолугодиеДоТакойЖеДаты",
  Next7Days = "Следующие7Дней",
  NextYear = "СледующийГод",
  NextYearTillSameDate = "СледующийГодДоТакойЖеДаты",
  NextQuarter = "СледующийКвартал",
  NextQuarterTillSameDate = "СледующийКварталДоТакойЖеДаты",
  NextMonth = "СледующийМесяц",
  NextMonthTillSameDate = "СледующийМесяцДоТакойЖеДаты",
  FromBeginningOfThisYear = "СНачалаЭтогоГода",
  FromBeginningOfThisQuarter = "СНачалаЭтогоКвартала",
  FromBeginningOfThisMonth = "СНачалаЭтогоМесяца",
  FromBeginningOfThisHalfYear = "СНачалаЭтогоПолугодия",
  FromBeginningOfThisTenDays = "СНачалаЭтойДекады",
  FromBeginningOfThisWeek = "СНачалаЭтойНедели",
  ThisTenDays = "ЭтаДекада",
  ThisWeek = "ЭтаНеделя",
  ThisHalfYear = "ЭтоПолугодие",
  ThisYear = "ЭтотГод",
  ThisQuarter = "ЭтотКвартал",
  ThisMonth = "ЭтотМесяц",
}

export enum StringEncodingMethod {
  URLInURLEncoding = "URLВКодировкеURL",
  URLEncoding = "КодировкаURL",
}

export enum TextEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
  UTF16 = "UTF16",
  UTF8 = "UTF8",
  System = "Системная",
}

export enum TransactionsIsolationLevel {
  Auto = "Авто",
  RepeatableRead = "ПовторяемоеЧтение",
  Serializable = "Упорядочиваемость",
  ReadCommitted = "ЧтениеЗафиксированных",
  ReadUncommitted = "ЧтениеНезафиксированных",
}

export enum UpdateOnDataChange {
  Auto = "Авто",
  DontUpdate = "НеОбновлять",
}

export enum UserPasswordHashAlgorithmType {
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum UUIDVersion {
  Version1 = "Версия1",
  Version3 = "Версия3",
  Version4 = "Версия4",
  Version5 = "Версия5",
}

export enum WorkingDateMode {
  UseCurrentDate = "ИспользоватьТекущуюДату",
  Assign = "Назначать",
}

export enum XBaseEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
}

export enum CalendarEventRecurrence {
  Weekly = "КаждуюНеделю",
  Yearly = "КаждыйГод",
  Daily = "КаждыйДень",
  Monthly = "КаждыйМесяц",
  Once = "ОдинРаз",
}

export enum ContactDataAddressType {
  Home = "Домашний",
  Other = "Другой",
  Work = "Рабочий",
}

export enum ContactDataEmailAddressType {
  Home = "Домашний",
  Other = "Другой",
  Mobile = "Мобильный",
  Work = "Рабочий",
}

export enum ContactDataInstantMessagingAddressType {
  Home = "Домашний",
  Other = "Другой",
  Work = "Рабочий",
}

export enum ContactDataPhoneNumberType {
  iPhone = "iPhone",
  Home = "Домашний",
  HomeFax = "ДомашнийФакс",
  Other = "Другой",
  OtherFax = "ДругойФакс",
  Mobile = "Мобильный",
  Main = "Основной",
  Work = "Рабочий",
  WorkMobile = "РабочийМобильный",
  WorkFax = "РабочийФакс",
}

export enum ContactDataRelationshipType {
  Brother = "Брат",
  DomesticPartner = "ГражданскийСупруг",
  Friend = "Друг",
  Other = "Другой",
  Mother = "Мать",
  Father = "Отец",
  Partner = "Партнер",
  Assistant = "Помощник",
  Child = "Ребенок",
  Parent = "Родитель",
  Relative = "Родственник",
  Manager = "Руководитель",
  Sister = "Сестра",
  Spouse = "Супруг",
}

export enum ContactDataURLType {
  FTP = "FTP",
  Blog = "Блог",
  Home = "Домашний",
  HomePage = "ДомашняяСтраница",
  Other = "Другой",
  Profile = "Профиль",
  Work = "Рабочий",
}

export enum CallLogCallType {
  Incoming = "Входящий",
  Outgoing = "Исходящий",
  Missed = "Пропущенный",
}

export enum TelephonyToolsCallEventVariant {
  EndIncoming = "ЗавершениеВходящего",
  EndOutgoing = "ЗавершениеИсходящего",
  StartIncoming = "НачалоВходящего",
  StartOutgoing = "НачалоИсходящего",
  StartIncomingRinging = "НачалоСигналаВходящего",
}

export enum TelephonyToolsSMSType {
  Queued = "ВОчереди",
  Incoming = "Входящее",
  Outgoing = "Исходящее",
  Sent = "Отправленное",
  Failed = "ОшибкаОтправки",
  Draft = "Черновик",
}

export enum AudioRecordingChannelUse {
  Mono = "Моно",
  Stereo = "Стерео",
}

export enum AudioRecordingFormat {
  Mpeg4AAC = "Mpeg4AAC",
  WavPCM16bit = "WavPCM16bit",
}

export enum BarcodeType {
  Aztec = "Aztec",
  Codabar = "Codabar",
  Code128 = "Code128",
  Code39 = "Code39",
  Code93 = "Code93",
  DataMatrix = "DataMatrix",
  EAN13 = "EAN13",
  EAN8 = "EAN8",
  ITF = "ITF",
  MaxiCode = "MaxiCode",
  PDF417 = "PDF417",
  QRCode = "QRCode",
  RSS14 = "RSS14",
  RSSExpanded = "RSSExpanded",
  UPCA = "UPCA",
  UPCE = "UPCE",
  All = "Все",
  Matrix = "Двухмерный",
  Linear = "Линейный",
}

export enum CameraLightingType {
  Auto = "Авто",
  Enable = "Включена",
  Disable = "Выключена",
}

export enum DeviceCameraType {
  Auto = "Авто",
  Rear = "Задняя",
  Front = "Передняя",
}

export enum DocumentScanningCheckingQuality {
  DontCheck = "НеПроверять",
  WarnBelowHigh = "ПредупреждатьНижеВысокого",
  WarnBelowMedium = "ПредупреждатьНижеСреднего",
  RequireHigh = "ТребоватьВысокое",
  RequireMediumWarnBelowHigh = "ТребоватьСреднееПредупреждатьНижеВысокого",
}

export enum DocumentScanningOrientationDetectionMode {
  Landscape = "Ландшафт",
  ByHorizontalTextLines = "ПоГоризонтальнымСтрокамТекста",
  ByFirstPageInSeries = "ПоПервойСтраницеСерии",
  ByDocumentPosition = "ПоРасположениюДокумента",
  Portrait = "Портрет",
}

export enum DocumentScanningProcessingFilter {
  None = "Нет",
  Text = "Текст",
  TextWithPictures = "ТекстСКартинками",
}

export enum MultimediaRecordingStopButtonPlacement {
  Auto = "Авто",
  Top = "Верх",
  Left = "Лево",
  LeftTop = "ЛевоВерх",
  LeftBottom = "ЛевоНиз",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
  RightTop = "ПравоВерх",
  RightBottom = "ПравоНиз",
}

export enum VideoQuality {
  Auto = "Авто",
  High = "Высокое",
  Low = "Низкое",
}

export enum QuerySchemaAvailableTableParameterType {
  Variant = "Вариант",
  Value = "Значение",
  Array = "Массив",
  Order = "Порядок",
  FieldList = "СписокПолей",
  Where = "Условие",
}

export enum QuerySchemaJoinType {
  Inner = "Внутреннее",
  LeftOuter = "ЛевоеВнешнее",
  FullOuter = "ПолноеВнешнее",
  RightOuter = "ПравоеВнешнее",
}

export enum QuerySchemaOrderDirection {
  Ascending = "ПоВозрастанию",
  HierarchyAscending = "ПоВозрастаниюИерархии",
  Descending = "ПоУбыванию",
  HierarchyDescending = "ПоУбываниюИерархии",
}

export enum QuerySchemaPeriodAdditionType {
  NoAddition = "БезДополнения",
  Year = "Год",
  TenDays = "Декада",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Minute = "Минута",
  Week = "Неделя",
  HalfYear = "Полугодие",
  Second = "Секунда",
  Hour = "Час",
}

export enum QuerySchemaTotalCalculationFieldType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export enum QuerySchemaUnionType {
  Union = "Объединить",
  UnionAll = "ОбъединитьВсе",
}

export enum NewPlannerItemsTextType {
  String = "Строка",
  FormattedString = "ФорматированнаяСтрока",
}

export enum PlannerCommandSource {
  Action = "Действие",
  URL = "НавигационнаяСсылка",
  WrappedTimeScaleHeaderArea = "ОбластьПеренесенногоЗаголовкаШкалыВремени",
  EmptyItemsArea = "ПустаяОбластьЭлементов",
  DimensionItem = "ЭлементИзмерения",
  TimeScaleItem = "ЭлементШкалыВремени",
  Items = "Элементы",
}

export enum PlannerInsideDragAction {
  Select = "Выделение",
  Copy = "Копирование",
  Edit = "Редактирование",
  Create = "Создание",
}

export enum PlannerInsideDragBoundaryChangeVariant {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
}

export enum PlannerItemActionLocation {
  EndOfItem = "ВКонцеЭлемента",
  EndOfText = "ПослеТекста",
}

export enum PlannerItemEnableEditMode {
  DisableDragAndStretch = "ЗапретитьПеретаскиваниеИРастягивание",
  DisableStretch = "ЗапретитьРастягивание",
  DisableEdit = "ЗапретитьРедактирование",
  EnableEdit = "РазрешитьРедактирование",
}

export enum PlannerItemsBehaviorOnLackOfSpace {
  ShowAllItems = "ОтображатьВсеЭлементы",
  CollapseItems = "СворачиватьЭлементы",
}

export enum PlannerItemsTimeRepresentation {
  BeginTime = "ВремяНачала",
  BeginAndEndTime = "ВремяНачалаИКонца",
  DontDisplay = "НеОтображать",
}

export enum PlannerStandardCommand {
  QuickEditItem = "БыстроРедактироватьЭлемент",
  SelectWrappedTimeScaleHeader = "ВыбратьПеренесенныйЗаголовокШкалыВремени",
  SelectDimensionItem = "ВыбратьЭлементИзмерения",
  SelectTimeScaleItem = "ВыбратьЭлементШкалыВремени",
  ExecuteAction = "ВыполнитьДействие",
  CopyURL = "КопироватьНавигационнуюСсылку",
  GotoURL = "ПерейтиПоНавигационнойСсылке",
  EditItem = "РедактироватьЭлемент",
  CreateItem = "СоздатьЭлемент",
  DeleteItems = "УдалитьЭлементы",
}

export enum JSONCharactersEscapeMode {
  None = "Нет",
  NotASCIISymbols = "СимволыВнеASCII",
  SymbolsNotInBMP = "СимволыВнеBMP",
}

export enum JSONDateFormat {
  ISO = "ISO",
  JavaScript = "JavaScript",
  Microsoft = "Microsoft",
}

export enum JSONDateWritingVariant {
  LocalDate = "ЛокальнаяДата",
  LocalDateWithOffset = "ЛокальнаяДатаСоСмещением",
  UniversalDate = "УниверсальнаяДата",
}

export enum JSONLineBreak {
  Unix = "Unix",
  Windows = "Windows",
  Auto = "Авто",
  None = "Нет",
}

export enum JSONValueType {
  Null = "Null",
  Boolean = "Булево",
  PropertyName = "ИмяСвойства",
  Comment = "Комментарий",
  ArrayEnd = "КонецМассива",
  ObjectEnd = "КонецОбъекта",
  ArrayStart = "НачалоМассива",
  ObjectStart = "НачалоОбъекта",
  None = "Ничего",
  String = "Строка",
  Number = "Число",
}

export enum DeliverableNotificationSendErrorType {
  UnknownError = "НеизвестнаяОшибка",
  AuthenticationDataError = "ОшибкаДанныхАутентификации",
  SubscriberIDError = "ОшибкаИдентификатораПодписчика",
  DeliverableNotificationServiceConnectionError = "ОшибкаПодключенияКСервисуДоставляемыхУведомлений",
  DeliverableNotificationServiceError = "ОшибкаСервисаДоставляемыхУведомлений",
  NotificationBodyError = "ОшибкаТелаУведомления",
  NotificationsLimitExceeded = "ПревышенЛимитОтправкиУведомлений",
}

export enum DeliverableNotificationSubscriberType {
  APNS = "APNS",
  FCM = "FCM",
  GCM = "GCM",
  HPK = "HPK",
  RMS = "RMS",
  WNS = "WNS",
}

export enum SoundAlert {
  None = "Нет",
  Default = "ПоУмолчанию",
}

export enum InAppPurchaseService {
  AppleInAppPurchase = "AppleInAppPurchase",
  GooglePlayInAppBilling = "GooglePlayInAppBilling",
  HuaweiInAppPurchase = "HuaweiInAppPurchase",
  RuStoreInAppPurchase = "RuStoreInAppPurchase",
  WindowsInAppPurchase = "WindowsInAppPurchase",
}

export enum InAppPurchaseType {
  ContentForSale = "КонтентДляПродажи",
  Subscription = "Подписка",
}

export enum FTPSecureConnectionUsageLevel {
  Auto = "Авто",
  UseIfPossible = "ИспользоватьЕслиВозможно",
  DontUse = "НеИспользовать",
  Require = "Требовать",
  RequireForControl = "ТребоватьДляУправления",
}

export enum InternetConnectionType {
  WiFi = "WiFi",
  LAN = "ЛокальнаяСеть",
  NoConnection = "НетСоединения",
  CellularData = "СотовыеДанные",
}

export enum MacOSCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export enum OSCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export enum RoamingUsage {
  Used = "Используется",
  Unknown = "Неизвестно",
  NotUsed = "НеИспользуется",
}

export enum ServerTLSCertificateRevocationCheckMode {
  Auto = "Авто",
  DontCheck = "НеПроверять",
  SoftFail = "Нестрогий",
  Strict = "Строгий",
}

export enum WindowsCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export enum ByteOrder {
  BigEndian = "BigEndian",
  LittleEndian = "LittleEndian",
}

export enum PositionInStream {
  End = "Конец",
  Begin = "Начало",
  Current = "Текущая",
}

export enum AdBannerRepresentation {
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export enum AdStatus {
  ReadyToDisplay = "ГотоваКОтображению",
  Downloading = "Загружается",
  NotDownloaded = "НеЗагружена",
  Displayed = "Отображается",
}

export enum DataLineChangeType {
  Add = "Добавление",
  Update = "Изменение",
  Move = "Перемещение",
  Delete = "Удаление",
}

export enum RepresentableDocumentBatchFileType {
  DOCX = "DOCX",
  HTML4 = "HTML4",
  HTML5 = "HTML5",
  ODS = "ODS",
  PDF = "PDF",
  TXT = "TXT",
  XLS = "XLS",
  XLSX = "XLSX",
}

export enum ClientApplicationAgentState {
  NotStarted = "НеЗапущен",
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export enum DatabaseCopiesStandardReplicationVersion {
  Version1 = "Версия1",
  Version2 = "Версия2",
}

export enum DatabaseCopiesUse {
  Auto = "Авто",
  PreferUseCopies = "ИспользоватьПреимущественноКопии",
  UseCopiesOnly = "ИспользоватьТолькоКопии",
  DontUseCopies = "НеИспользоватьКопии",
}

export enum DatabaseCopyContentItemFieldUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum DatabaseCopyDBMSType {
  MSSQLServer = "MSSQLServer",
  OracleDatabase = "OracleDatabase",
  PostgreSQL = "PostgreSQL",
}

export enum DatabaseCopyReplicationType {
  External = "Внешняя",
  Standard = "Стандартная",
}

export enum DatabaseCopyState {
  TurnedOn = "Включена",
  TemporarilyTurnedOff = "ВременноОтключена",
  TurnedOff = "Отключена",
}

export enum DatabaseCopyTurnedOffReason {
  InvalidCopyDatabaseUseVariant = "НедопустимыйВариантИспользованияБазыДанныхКопии",
  DataInconsistency = "НесоответствиеДанных",
  QueryExecutionError = "ОшибкаВыполненияЗапроса",
  DatabaseConnectionError = "ОшибкаСоединенияСБазойДанных",
}

export enum DatabaseCopyUpdateState {
  InitialUpdateInProgress = "ВыполняетсяНачальноеОбновление",
  CurrentUpdateInProgress = "ВыполняетсяТекущееОбновление",
  PortionUpdateCompletedSuccessfully = "ЗавершеноОбновлениеПорцииУспешно",
  CompletedWithError = "ЗавершеноСОшибкой",
  CompletedSuccessfully = "ЗавершеноУспешно",
  Inactive = "Неактивно",
}

export enum DataCompositionDatabaseCopyOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export enum DataCompositionDataRelevanceOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export enum RequiredDataRelevance {
  Auto = "Авто",
  Relevant = "Актуальные",
  Any = "Любые",
}

export enum CollaborationSystemCommandSource {
  Attachment = "Вложение",
  Action = "Действие",
  URL = "НавигационнаяСсылка",
  CurrentPageURL = "НавигационнаяСсылкаТекущейСтраницы",
  User = "Пользователь",
  Message = "Сообщение",
}

export enum CollaborationSystemDataDumpStatus {
  Restoring = "Восстановление",
  Done = "Готово",
  Loading = "Загрузка",
  Error = "Ошибка",
  Creating = "Создание",
}

export enum CollaborationSystemFromDataDumpRestoreStatus {
  Error = "Ошибка",
  Success = "Успешно",
}

export enum CollaborationSystemMessageButtonPanelButtonAction {
  RequestLocation = "ЗапроситьМестоположение",
  RequestPhone = "ЗапроситьТелефон",
  ProcessByBot = "ОбработатьБотом",
  ProcessOnClient = "ОбработатьНаКлиенте",
  SendMessage = "ОтправитьСообщение",
  SendMessageWithData = "ОтправитьСообщениеСДанными",
  GotoURL = "ПерейтиПоНавигационнойСсылке",
}

export enum CollaborationSystemMessageButtonPanelButtonType {
  Hyperlink = "Гиперссылка",
  UsualButton = "ОбычнаяКнопка",
}

export enum CollaborationSystemNotificationRepresentation {
  DontDisturb = "НеБеспокоить",
  Normal = "Обычное",
}

export enum CollaborationSystemStandardCommand {
  ExecuteAction = "ВыполнитьДействие",
  CopyAttachment = "КопироватьВложение",
  CopyURL = "КопироватьНавигационнуюСсылку",
  CopyMessage = "КопироватьСообщение",
  OpenAttachment = "ОткрытьВложение",
  GotoURL = "ПерейтиПоНавигационнойСсылке",
  ShareAttachment = "ПоделитьсяВложением",
  ShareMessage = "ПоделитьсяСообщением",
  ShowUserInfo = "ПоказатьИнформациюОПользователе",
  GetMessageURL = "ПолучитьНавигационнуюСсылкуСообщения",
  EditMessage = "РедактироватьСообщение",
  SaveAttachment = "СохранитьВложение",
  DeleteMessage = "УдалитьСообщение",
  QuoteMessage = "ЦитироватьСообщение",
}

export enum CollaborationSystemUsersChoicePurpose {
  MessageRecipient = "ПолучательСообщения",
  VideoconferenceParticipant = "УчастникВидеоконференции",
  ConversationMember = "УчастникОбсуждения",
}

export enum AdministrationActionOnResourceConsumptionLimitExcess {
  TerminateSession = "ЗавершитьСеанс",
  None = "Нет",
  InterruptCurrentServerCall = "ПрерватьТекущийСерверныйВызов",
  SetThreadLowPriority = "УстановитьНизкийПриоритетПотока",
}

export enum AdministrationAssignmentRuleType {
  Auto = "Авто",
  Assign = "Назначать",
  DontAssign = "НеНазначать",
}

export enum AdministrationConnectionSecurityLevel {
  Secure = "Защищенное",
  SecureOnConnect = "ЗащищенноеПриУстановкеСоединения",
  Unsecure = "Незащищенное",
}

export enum AdministrationInfoBaseDeletionMode {
  DontPerformActionsWithDatabase = "НеВыполнятьДействийСБазойДанных",
  ClearDatabase = "ОчиститьБазуДанных",
  DeleteDatabase = "УдалитьБазуДанных",
}

export enum AdministrationProcessChoicePriority {
  ByMemory = "ПоПамяти",
  ByPerformance = "ПоПроизводительности",
}

export enum AdministrationResourceConsumptionCounterFilterType {
  All = "Все",
  AllSelected = "ВсеВыбранные",
  AllButSelected = "ВсеКромеВыбранных",
}

export enum AdministrationResourceConsumptionCounterGroupType {
  Users = "Пользователи",
  DataSeparation = "РазделениеДанных",
}

export enum AdministrationWorkProcessStatus {
  Used = "Используется",
  NotUsed = "НеИспользуется",
  Reserve = "Резервный",
}

export enum PivotTableColumnTotalPosition {
  Left = "Лево",
  Right = "Право",
}

export enum PivotTableLinesShowType {
  Auto = "Авто",
  Always = "Всегда",
}

export enum PivotTableRowTotalPosition {
  Top = "Верх",
  Bottom = "Низ",
}

export enum DuplexPrintingType {
  UsePrinterSettings = "ИспользоватьНастройкиПринтера",
  None = "Нет",
  FlipPagesUp = "ПереворотВверх",
  FlipPagesLeft = "ПереворотВлево",
}

export enum PageOrientation {
  Landscape = "Ландшафт",
  Portrait = "Портрет",
}

export enum PagePlacementAlternation {
  Auto = "Авто",
  MirrorOnTop = "ЗеркальноСверху",
  MirrorOnLeft = "ЗеркальноСлева",
  DontUse = "НеИспользовать",
}

export enum PrintAccuracy {
  Auto = "Авто",
  Accurate = "Точная",
}

export enum SpreadsheetDocumentAreaFillType {
  Parameter = "Параметр",
  Text = "Текст",
  Template = "Шаблон",
}

export enum SpreadsheetDocumentCellAreaType {
  Columns = "Колонки",
  Rectangle = "Прямоугольник",
  Rows = "Строки",
  Table = "Таблица",
}

export enum SpreadsheetDocumentCellLineType {
  LargeDashed = "БольшойПунктир",
  Double = "Двойная",
  None = "НетЛинии",
  ThinDashed = "РедкийПунктир",
  Solid = "Сплошная",
  Dotted = "Точечная",
  ThickDashed = "ЧастыйПунктир",
}

export enum SpreadsheetDocumentDetailUse {
  WithoutProcessing = "БезОбработки",
  Row = "Строка",
  Cell = "Ячейка",
}

export enum SpreadsheetDocumentDrawingLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export enum SpreadsheetDocumentDrawingType {
  GeographicalSchema = "ГеографическаяСхема",
  Group = "Группа",
  Dendrogram = "Дендрограмма",
  Chart = "Диаграмма",
  GanttChart = "ДиаграммаГанта",
  Picture = "Картинка",
  Object = "Объект",
  Comment = "Примечание",
  Line = "Прямая",
  Rectangle = "Прямоугольник",
  PivotChart = "СводнаяДиаграмма",
  Text = "Текст",
  Ellipse = "Эллипс",
}

export enum SpreadsheetDocumentFileType {
  ANSITXT = "ANSITXT",
  DOCX = "DOCX",
  HTML = "HTML",
  HTML3 = "HTML3",
  HTML4 = "HTML4",
  HTML5 = "HTML5",
  MXL = "MXL",
  MXL7 = "MXL7",
  ODS = "ODS",
  PDF = "PDF",
  PDF_A_1 = "PDF_A_1",
  PDF_A_2 = "PDF_A_2",
  PDF_A_3 = "PDF_A_3",
  TXT = "TXT",
  XLS = "XLS",
  XLS95 = "XLS95",
  XLS97 = "XLS97",
  XLSX = "XLSX",
}

export enum SpreadsheetDocumentGroupHeaderPlacement {
  Auto = "Авто",
  End = "Конец",
  Begin = "Начало",
}

export enum SpreadsheetDocumentPatternType {
  WithoutPattern = "БезУзора",
  Solid = "Сплошной",
  Pattern1 = "Узор1",
  Pattern10 = "Узор10",
  Pattern11 = "Узор11",
  Pattern12 = "Узор12",
  Pattern13 = "Узор13",
  Pattern14 = "Узор14",
  Pattern15 = "Узор15",
  Pattern16 = "Узор16",
  Pattern17 = "Узор17",
  Pattern2 = "Узор2",
  Pattern3 = "Узор3",
  Pattern4 = "Узор4",
  Pattern5 = "Узор5",
  Pattern6 = "Узор6",
  Pattern7 = "Узор7",
  Pattern8 = "Узор8",
  Pattern9 = "Узор9",
}

export enum SpreadsheetDocumentPointerType {
  Regular = "Обычные",
  Special = "Специальные",
}

export enum SpreadsheetDocumentSavedPicturesDensity {
  High = "Высокая",
  Original = "Исходная",
  Low = "Низкая",
  Medium = "Средняя",
}

export enum SpreadsheetDocumentSelectionShowModeType {
  Always = "Всегда",
  WhenActive = "ПриАктивности",
}

export enum SpreadsheetDocumentShiftType {
  WithoutShift = "БезСмещения",
  Vertical = "ПоВертикали",
  Horizontal = "ПоГоризонтали",
}

export enum SpreadsheetDocumentStepDirectionType {
  WithoutMove = "БезПерехода",
  ByColumns = "ПоКолонкам",
  ByRows = "ПоСтрокам",
}

export enum SpreadsheetDocumentTextPlacementType {
  Auto = "Авто",
  Block = "Забивать",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export enum SpreadsheetDocumentValuesReadingMode {
  Value = "Значение",
  Text = "Текст",
}

export enum TextPositionRelativeToPicture {
  Auto = "Авто",
  OnTop = "Поверх",
  Top = "Сверху",
  Left = "Слева",
  Bottom = "Снизу",
  Right = "Справа",
}

export enum UseSpreadsheetDocumentWidthReduction {
  Auto = "Авто",
  DoNotReduceOnExcess = "ПриПревышенииНеСжимать",
  ReduceToMinimumOnExcess = "ПриПревышенииСжиматьДоМинимума",
  ReduceAlways = "СжиматьВсегда",
}

export enum QueryRecordType {
  DetailRecord = "ДетальнаяЗапись",
  GroupTotal = "ИтогПоГруппировке",
  TotalByHierarchy = "ИтогПоИерархии",
  Overall = "ОбщийИтог",
}

export enum QueryResultIteration {
  ByGroups = "ПоГруппировкам",
  ByGroupsWithHierarchy = "ПоГруппировкамСИерархией",
  Linear = "Прямой",
}

export enum ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod {
  StronglyConnectedComponents = "КомпонентыСильнойСвязности",
  StronglyConnectedComponentsWithNoInnerConnectionRequired = "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент",
  WeaklyConnectedComponents = "КомпонентыСлабойСвязности",
}

export enum AdditionalUserVerificationMethod {
  BiometricsOrPassword = "БиометрическаяИлиВводПароля",
  BiometricsOnly = "ТолькоБиометрическая",
}

export enum BiometricVerificationMethod {
  None = "Нет",
  FaceRecognition = "РаспознаваниеЛица",
  FingerprintRecognition = "РаспознаваниеОтпечаткаПальца",
  IrisRecognition = "РаспознаваниеРадужнойОболочкиГлаза",
}

export enum SecureStorageAccessProtectionMethod {
  None = "Нет",
  AdditionalUserVerificationRequired = "ТребуетсяДополнительнаяПроверкаПользователя",
  ScreenUnlockRequired = "ТребуетсяРазблокировкаЭкрана",
}

export enum ErrorCategory {
  AllErrors = "ВсеОшибки",
  ExceptionRaisedFromScript = "ИсключениеВызванноеИзВстроенногоЯзыка",
  AccessViolation = "НарушениеПравДоступа",
  UnsupportedFormat = "НеподдерживаемыйФормат",
  InvalidPassword = "НеправильныйПароль",
  NoPermissionToUseFunctionality = "ОтсутствиеРазрешенияДляИспользованияФункциональности",
  ExternalDataSourceError = "ОшибкаВнешнегоИсточникаДанных",
  ScriptRuntimeError = "ОшибкаВоВремяВыполненияВстроенногоЯзыка",
  LocalFileAccessError = "ОшибкаДоступаКЛокальномуФайлу",
  ScriptUseError = "ОшибкаИспользованияВстроенногоЯзыка",
  ScriptCompileError = "ОшибкаКомпиляцииВстроенногоЯзыка",
  ConfigurationError = "ОшибкаКонфигурации",
  DatabaseCopyError = "ОшибкаКопииБазыДанных",
  DataCompositionSettingsError = "ОшибкаНастроекКомпоновкиДанных",
  GotoURLError = "ОшибкаПереходаПоНавигационнойСсылке",
  FullTextSearchError = "ОшибкаПолнотекстовогоПоиска",
  DocumentConversionError = "ОшибкаПреобразованияДокумента",
  SignatureVerificationError = "ОшибкаПроверкиПодписи",
  PrinterError = "ОшибкаРаботыСПринтером",
  SpeechProcessingError = "ОшибкаРаботыСРечью",
  SessionError = "ОшибкаСеанса",
  NetworkError = "ОшибкаСети",
  CollaborationSystemError = "ОшибкаСистемыВзаимодействия",
  MultimediaToolsError = "ОшибкаСредствМультимедиа",
  DatabaseTablespaceError = "ОшибкаТабличногоПространстваБазыДанных",
  StoredDataError = "ОшибкаХранимыхДанных",
  ForcedShutdown = "ПринудительноеЗавершениеРаботы",
  OtherError = "ПрочаяОшибка",
}

export enum ErrorMessageDisplayVariant {
  Auto = "Авто",
  BriefErrorDescription = "КраткоеПредставлениеОшибки",
  DetailErrorDescription = "ПодробноеПредставлениеОшибки",
  ErrorMessageForUser = "СообщениеОбОшибкеДляПользователя",
}

export enum ErrorReportingMode {
  Auto = "Авто",
  DontSend = "НеОтправлять",
  Send = "Отправлять",
  AskUser = "СпрашиватьПользователя",
}

export enum MobileClientSignatureVerificationMethod {
  DoNotVerifySignature = "НеВыполнятьПроверкуПодписи",
  CheckMobileClientUsageAbility = "ПроверятьВозможностьИспользованияМобильногоКлиента",
  CheckConfigurationSignatureForExactMatch = "ПроверятьТочноеСоответствиеПодписиКонфигурации",
}

export enum OnMainServerUnavalableBehavior {
  Auto = "Авто",
  DontChangeBehavior = "НеИзменятьПоведение",
  MakeDisable = "ОтключитьДоступность",
}

export enum UsedServer {
  Standalone = "Автономный",
  Main = "Основной",
}

export enum PDFAttachmentRelationshipType {
  Alternative = "Альтернатива",
  Data = "Данные",
  Supplement = "Дополнение",
  Source = "Источник",
  Unspecified = "НеУстановлено",
}

export enum PDFDocumentFileType {
  PDF = "PDF",
  PDF_A_1 = "PDF_A_1",
  PDF_A_2 = "PDF_A_2",
  PDF_A_3 = "PDF_A_3",
}

export enum PDFModificationAccessPermissions {
  FillingSigning = "ЗаполнениеПодписание",
  FillingSigningAnnotation = "ЗаполнениеПодписаниеАннотирование",
  None = "Нет",
}

export enum PDFSignatureType {
  Certifying = "Сертифицирующая",
  Approving = "Утверждающая",
}

export enum ProgressiveWebApplicationMode {
  InBrowserWindow = "ВОкнеБраузера",
  InStandaloneWindow = "ВОтдельномОкне",
}

export enum AdditionalShowMode {
  Irrelevance = "Неактуальность",
  DontUse = "НеИспользовать",
}

export enum AppearanceAreaType {
  Group = "Группировка",
  Field = "Поле",
}

export enum ArrowStyle {
  Filled = "Заполненная",
  Blank = "Незаполненная",
  None = "Нет",
}

export enum AutoCapitalizationOnTextInput {
  Auto = "Авто",
  AllCharacters = "ВсеСимволы",
  None = "Нет",
  Sentences = "Предложения",
  Words = "Слова",
}

export enum AutoCorrectionOnTextInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum AutonumerationInForm {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export enum AutoSaveFormDataInSettings {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum AutoShowClearButtonMode {
  Auto = "Авто",
  Always = "Всегда",
  FilledOnly = "ТолькоДляЗаполненного",
}

export enum AutoShowOpenButtonMode {
  Auto = "Авто",
  Always = "Всегда",
  FilledOnly = "ТолькоДляЗаполненного",
}

export enum AutoShowStateMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
  ShowOnComposition = "ОтображатьПриФормировании",
}

export enum ButtonGroupRepresentation {
  Auto = "Авто",
  Compact = "Компактное",
  Usual = "Обычное",
}

export enum ButtonLocationInCommandBar {
  Auto = "Авто",
  InAdditionalSubmenu = "ВДополнительномПодменю",
  InCommandBar = "ВКоманднойПанели",
  InCommandBarAndInAdditionalSubmenu = "ВКоманднойПанелиИВДополнительномПодменю",
}

export enum ButtonPictureLocation {
  Left = "Лево",
  Right = "Право",
}

export enum ButtonRepresentation {
  Auto = "Авто",
  Picture = "Картинка",
  PictureAndText = "КартинкаИТекст",
  Text = "Текст",
}

export enum ButtonShape {
  Auto = "Авто",
  Usual = "Обычная",
  Oval = "Овал",
}

export enum ButtonShapeRepresentation {
  Auto = "Авто",
  Always = "Всегда",
  None = "Нет",
  WhenActive = "ПриАктивности",
}

export enum AutoSeriesSeparation {
  All = "Все",
  Maximum = "Максимум",
  Minimum = "Минимум",
  None = "Нет",
}

export enum BarChartPointsOrder {
  Auto = "Авто",
  TopToBottom = "СверхуВниз",
  BottomToTop = "СнизуВверх",
}

export enum BubbleChartNegativeValuesShowMode {
  InvertedBackColor = "ИнвертированныйЦветФона",
  DontShow = "НеОтображать",
  Abs = "ПоМодулю",
  Transparent = "ПрозрачныйФон",
}

export enum ChartAnimation {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ChartBoundaryDetectionMethod {
  AutoDetect = "АвтоОпределение",
  UseValue = "ИспользоватьЗначение",
  UseValueWithLimitations = "ИспользоватьЗначениеСОграничением",
}

export enum ChartBubbleSizeValueSource {
  None = "Нет",
  CommonSeries = "ОбщаяСерия",
  NextSeries = "СледующаяСерия",
}

export enum ChartBubbleSizing {
  IncreaseDiameter = "УвеличениеДиаметра",
  IncreaseArea = "УвеличениеПлощади",
  DecreaseDiameter = "УменьшениеДиаметра",
  DecreaseArea = "УменьшениеПлощади",
}

export enum ChartColorPalette {
  Auto = "Авто",
  Gradient = "Градиентная",
  Yellow = "Желтая",
  Green = "Зеленая",
  Soft = "Мягкая",
  SoftAdaptive = "МягкаяАдаптивная",
  Orange = "Оранжевая",
  Palette32 = "Палитра32",
  Palette8 = "Палитра8",
  Pastel = "Пастельная",
  Custom = "Произвольная",
  Gray = "Серая",
  Blue = "Синяя",
  Warm = "Теплая",
  Cold = "Холодная",
  Bright = "Яркая",
}

export enum ChartGridLinesShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum ChartLabelLocation {
  Auto = "Авто",
  Edge = "Край",
  EdgeAuto = "КрайАвто",
  EdgeInside = "КрайВнутри",
  TopLeft = "ЛевоВерх",
  BottomLeft = "ЛевоНиз",
  TopRight = "ПравоВерх",
  BottomRight = "ПравоНиз",
  EmptySpace = "СвободноеМесто",
  TopAndLeftSpecified = "УказываетсяЛевоИВерх",
  Center = "Центр",
}

export enum ChartLabelsOrientation {
  Auto = "Авто",
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
  CustomAngle = "ПроизвольныйУголНаклона",
}

export enum ChartLabelType {
  Value = "Значение",
  ValuePercent = "ЗначениеПроцент",
  ValueSize = "ЗначениеРазмер",
  None = "Нет",
  Percent = "Процент",
  Series = "Серия",
  SeriesValue = "СерияЗначение",
  SeriesValuePercent = "СерияЗначениеПроцент",
  SeriesValueSize = "СерияЗначениеРазмер",
  SeriesPercent = "СерияПроцент",
  SeriesSize = "СерияРазмер",
  SeriesPoint = "СерияТочка",
  SeriesPointValue = "СерияТочкаЗначение",
  SeriesPointValuePercent = "СерияТочкаЗначениеПроцент",
  SeriesPointValueSize = "СерияТочкаЗначениеРазмер",
  SeriesPointPercent = "СерияТочкаПроцент",
  SeriesPointSize = "СерияТочкаРазмер",
  Point = "Точка",
  PointValue = "ТочкаЗначение",
  PointValuePercent = "ТочкаЗначениеПроцент",
  PointValueSize = "ТочкаЗначениеРазмер",
  PointPercent = "ТочкаПроцент",
  PointSize = "ТочкаРазмер",
}

export enum ChartLegendPlacement {
  Auto = "Авто",
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
  UseCoordinates = "УказываетсяРасположение",
}

export enum ChartLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export enum ChartMarkerType {
  Auto = "Авто",
  Rect = "Квадрат",
  Circle = "Круг",
  None = "Нет",
  Rhomb = "Ромб",
  Alternation = "Чередование",
}

export enum ChartOrientation {
  SouthEast = "ЮгВосток",
  SouthWest = "ЮгЗапад",
}

export enum ChartPlotAreaPlacement {
  Auto = "Авто",
  EmptySpace = "СвободноеМесто",
  UseCoordinates = "УказываетсяРасположение",
}

export enum ChartPointsAxisValuesSource {
  Auto = "Авто",
  Series = "Серия",
  Points = "Точки",
}

export enum ChartPointsConnectionType {
  Auto = "Авто",
  DontConnect = "НеСоединять",
  Connect = "Соединять",
}

export enum ChartReferenceBandBorderPosition {
  Auto = "Авто",
  OnValue = "ВЗначении",
  BetweenValues = "МеждуЗначениями",
}

export enum ChartReferenceLinePosition {
  Auto = "Авто",
  OnValue = "ВЗначении",
  BetweenValues = "МеждуЗначениями",
}

export enum ChartScaleLabelLocation {
  Auto = "Авто",
  Inside = "Внутри",
  None = "Нет",
  Outside = "Снаружи",
}

export enum ChartScaleLocation {
  Auto = "Авто",
  BaseValue = "БазовоеЗначение",
  Edge = "Край",
}

export enum ChartScaleMarkLocation {
  Auto = "Авто",
  Inside = "Внутри",
  None = "Нет",
  Outside = "Снаружи",
  Center = "Центр",
}

export enum ChartScaleTitlePlacement {
  SpecialArea = "ВВыделеннойОбласти",
  PlotArea = "ВОбластиПостроения",
  WithAxis = "РядомСОсью",
}

export enum ChartScaleTitleTextSource {
  Auto = "Авто",
  AutoText = "АвтоТекст",
  UseText = "ИспользоватьТекст",
}

export enum ChartSelectionMode {
  Auto = "Авто",
  ValuesSelection = "ВыделениеЗначений",
  PointsSelection = "ВыделениеТочек",
  None = "Нет",
}

export enum ChartSemitransparencyMode {
  Auto = "Авто",
  AutoCalculate = "АвтоматическийРасчет",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ChartSeriesGraphicalRepresentationType {
  Auto = "Авто",
  Column = "Гистограмма",
  Column3D = "ГистограммаОбъемная",
  Line = "График",
  Step = "ГрафикПоШагам",
  Area = "ГрафикСОбластями",
}

export enum ChartSeriesOrderInLegend {
  Auto = "Авто",
  Reverse = "Обратный",
  Direct = "Прямой",
}

export enum ChartSeriesStackType {
  Auto = "Авто",
  Unstacked = "БезНакопления",
  Stacked = "СНакоплением",
  StackedNormalized = "СНакоплениемНормированная",
}

export enum ChartSpaceMode {
  None = "Нет",
  Full = "ПолнаяШирина",
  Half = "ПоловинаШирины",
}

export enum ChartSplineMode {
  SmoothCurve = "ГладкаяКривая",
  None = "Нет",
}

export enum ChartTitleAreaPlacement {
  Auto = "Авто",
  Top = "Верх",
  LeftTop = "ЛевоВерх",
  LeftBottom = "ЛевоНиз",
  None = "Нет",
  Bottom = "Низ",
  RightTop = "ПравоВерх",
  RightBottom = "ПравоНиз",
  UseCoordinates = "УказываетсяРасположение",
}

export enum ChartTrendlineApproximationType {
  Linear = "Линейный",
  Logarithmic = "Логарифмический",
  Polynomial = "Полиномиальный",
  Power = "Степенной",
  Exponential = "Экспоненциальный",
}

export enum ChartTrendlineFactor {
  Auto = "Авто",
  PointValue = "ЗначениеТочки",
  PointNumber = "НомерТочки",
}

export enum ChartType {
  Stock = "Биржевая",
  OpenHighLowClose = "БиржеваяСвеча",
  ConcaveSurface = "ВогнутаяПоверхность",
  Waterfall = "Водопад",
  Funnel = "Воронка",
  NormalizedFunnel = "ВоронкаНормированная",
  NormalizedFunnel3D = "ВоронкаНормированнаяОбъемная",
  Funnel3D = "ВоронкаОбъемная",
  ConvexSurface = "ВыпуклаяПоверхность",
  Column = "Гистограмма",
  Bar = "ГистограммаГоризонтальная",
  Bar3D = "ГистограммаГоризонтальнаяОбъемная",
  NormalizedColumn = "ГистограммаНормированная",
  NormalizedBar = "ГистограммаНормированнаяГоризонтальная",
  NormalizedBar3D = "ГистограммаНормированнаяГоризонтальнаяОбъемная",
  NormalizedColumn3D = "ГистограммаНормированнаяОбъемная",
  Column3D = "ГистограммаОбъемная",
  StackedColumn = "ГистограммаСНакоплением",
  StackedBar = "ГистограммаСНакоплениемГоризонтальная",
  StackedBar3D = "ГистограммаСНакоплениемГоризонтальнаяОбъемная",
  StackedColumn3D = "ГистограммаСНакоплениемОбъемная",
  Line = "График",
  Step = "ГрафикПоШагам",
  StackedLine = "ГрафикСНакоплением",
  Area = "ГрафикСОбластями",
  StackedArea = "ГрафикСОбластямиИНакоплением",
  NormalizedArea = "ГрафикСОбластямиНормированный",
  ShadedSurface = "ЗатененнаяПоверхность",
  Gauge = "Измерительная",
  BarGraph = "Изометрическая",
  TapeGraph = "ИзометрическаяЛента",
  CeilGraph = "ИзометрическаяНепрерывная",
  PyramidGraph = "ИзометрическаяПирамида",
  WireframeSurface = "КаркаснаяПоверхность",
  Donut = "Кольцевая",
  Donut3D = "КольцеваяОбъемная",
  Pie = "Круговая",
  Pie3D = "КруговаяОбъемная",
  Surface = "Поверхность",
  Bubble = "Пузырьковая",
  RadarLine = "РадарныйГрафик",
  RadarStackedLine = "РадарныйГрафикСНакоплением",
  RadarArea = "РадарныйГрафикСОбластями",
  RadarStackedArea = "РадарныйГрафикСОбластямиИНакоплением",
  RadarNormalizedArea = "РадарныйГрафикСОбластямиНормированный",
  Honeycomb = "Сотовая",
  Scatter = "Точечная",
}

export enum ChartValueEditState {
  Finished = "Завершено",
  NotFinished = "НеЗавершено",
  Canceled = "Отменено",
}

export enum ChartValuesBySeriesConnectionType {
  None = "Нет",
  EdgesConnection = "СоединениеКраев",
}

export enum ChartValuesEditMode {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ChartValuesToolTipFillType {
  Auto = "Авто",
  AllPointValues = "ВсеЗначенияТочки",
  SingleValue = "ОдноЗначение",
}

export enum ChartValuesToolTipShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  ShowForNearestValue = "ОтображатьДляБлижайшего",
  ShowOnHover = "ОтображатьПриНаведении",
}

export enum GaugeChartValueRepresentation {
  Sector = "Сектор",
  Needle = "Стрелка",
}

export enum GaugeChartValuesScaleLabelsLocation {
  InsideScale = "ВнутриШкалы",
  AtScale = "НаШкале",
}

export enum MaxSeries {
  NotDefined = "НеЗадано",
  Limited = "Ограничено",
  Percent = "Процент",
}

export enum NonnumericChartValueUse {
  Auto = "Авто",
  AsZero = "КакНоль",
  Skip = "Пропускать",
}

export enum PointsConnectionAcrossSkippedChartValuesType {
  Auto = "Авто",
  None = "Нет",
  ConnectUnskippedValues = "СоединениеНеПропущенных",
  ConnectWithBaseValue = "СоединениеСБазовымЗначением",
}

export enum RadarChartScaleType {
  Circle = "Окружность",
  Polygon = "Полигон",
}

export enum ShowChartPopupReferenceLine {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum ShowChartScaleTitle {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum ShowInChart {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum ShowInChartLegend {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum StockChartUsedPointValue {
  Close = "Закрытие",
  High = "Максимальное",
  Low = "Минимальное",
  Open = "Открытие",
  OpenCloseAverage = "СреднееОткрытияИЗакрытия",
}

export enum UsedChartValuesAxis {
  Auto = "Авто",
  Additional = "Дополнительная",
  Main = "Основная",
}

export enum GanttChartIntervalRepresentation {
  Gradient = "Градиент",
  ThreeDimensional = "Объемный",
  Flat = "Плоский",
  Rhomb = "Ромб",
}

export enum GanttChartIntervalsSelectionMode {
  Auto = "Авто",
  Multiple = "Множественный",
  None = "Нет",
  Single = "Одиночный",
}

export enum GanttChartIntervalTextRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum GanttChartLinkType {
  EndEnd = "КонецКонец",
  EndBegin = "КонецНачало",
  BeginEnd = "НачалоКонец",
  BeginBegin = "НачалоНачало",
}

export enum GanttChartScaleKeeping {
  Auto = "Авто",
  AllData = "ВсеДанные",
  Period = "Период",
  Fixed = "Фиксированная",
}

export enum GanttChartTableLocation {
  Auto = "Авто",
  Left = "Лево",
  None = "Нет",
  Right = "Право",
}

export enum GanttChartTextPlacementType {
  Auto = "Авто",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export enum GanttChartValuesSelectionMode {
  Auto = "Авто",
  Multiple = "Множественный",
  None = "Нет",
  Single = "Одиночный",
}

export enum GanttChartValueTextRepresentation {
  None = "НеОтображать",
  Right = "Право",
}

export enum GanttChartVerticalStretch {
  None = "НеРастягивать",
  StretchRows = "РастягиватьСтроки",
  StretchRowsAndData = "РастягиватьСтрокиИДанные",
}

export enum ShowInGanttChart {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum TimeScaleDayFormat {
  MonthDay = "ДеньМесяца",
  MonthDayWeekDay = "ДеньМесяцаДеньНедели",
  WeekDay = "ДеньНедели",
  WeekDayMonthDay = "ДеньНеделиДеньМесяца",
}

export enum TimeScaleUnitType {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Minute = "Минута",
  Week = "Неделя",
  Second = "Секунда",
  Hour = "Час",
}

export enum PivotChartLabelsOrientation {
  TopLevelsVertical = "ВерхниеУровниВертикально",
  AllLevelsVertical = "ВсеУровниВертикально",
  AllLevelsHorizontal = "ВсеУровниГоризонтально",
}

export enum PivotChartScaleKeeping {
  AllValues = "ВсеЗначения",
  ValuesCount = "КоличествоЗначений",
  MinimumWidth = "МинимальнаяШирина",
}

export enum PivotChartType {
  Column = "Гистограмма",
  Column3D = "ГистограммаОбъемная",
}

export enum PivotChartValuesShowMode {
  AllValues = "ВсеЗначения",
  LastLevelValues = "ЗначенияПоследнегоУровня",
}

export enum DendrogramOrientation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export enum DendrogramScaleKeeping {
  AllItems = "ВсеЭлементы",
  ItemCount = "КоличествоЭлементов",
  MinimumWidth = "МинимальнаяШирина",
}

export enum GeographicalSchemaDataSourceOrganizationType {
  AtRow = "ВСтроке",
  AtIntersection = "НаПересечении",
}

export enum GeographicalSchemaLayerSeriesImportModeType {
  ImportAll = "ИмпортироватьВсе",
  DontImport = "НеИмпортировать",
}

export enum GeographicalSchemaLayerSeriesShowMode {
  Column = "Гистограмма",
  Picture = "Картинка",
  Pie = "Круговая",
  SizedPie = "КруговаяСРазмером",
  DontShow = "НеОтображать",
  ShapeColorHue = "ОттенокЦветаФигуры",
  ShapeSize = "РазмерФигуры",
  Text = "Текст",
  ShapeColor = "ЦветФигуры",
}

export enum GeographicalSchemaLegendItemShowScaleType {
  DontShow = "НеОтображать",
  ShowByValues = "ОтображатьПоЗначениям",
}

export enum GeographicalSchemaLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export enum GeographicalSchemaMarkerType {
  BigSquare = "БольшойКвадрат",
  BigCircle = "БольшойКруг",
  BigTriangle = "БольшойТреугольник",
  ExclamationPoint = "ВосклицательныйЗнак",
  Darts = "Дартс",
  QuestionMark = "ЗнакВопроса",
  Pin = "Кнопка",
  LittleSquare = "МаленькийКвадрат",
  LittleCircle = "МаленькийКруг",
  LittleTriangle = "МаленькийТреугольник",
  None = "Нет",
}

export enum GeographicalSchemaObjectFindType {
  Included = "Включает",
  IncludedWholly = "ВключаетПолностью",
  Includes = "Включают",
  IncludesWholly = "ВключаютПолностью",
}

export enum GeographicalSchemaPointObjectDrawingType {
  Picture = "Картинка",
  Marker = "Маркер",
  Char = "Символ",
}

export enum GeographicalSchemaProjection {
  AzimuthalAitoffProjection = "АзимутальнаяПроекцияАитофа",
  AzimuthalWagner7Projection = "АзимутальнаяПроекцияВагнера7",
  AzimuthalWinkelTripelProjection = "АзимутальнаяПроекцияВинкеляТрипеля",
  AzimuthalLambertEqualAreaProjection = "АзимутальнаяПроекцияРавныхПлощадейЛамберта",
  AzimuthalHammerProjection = "АзимутальнаяПроекцияХамера",
  AzimuthalEquidistantProjection = "АзимутальнаяРавноудаленнаяПроекция",
  ConicLambertEqualAreaProjection = "КоническаяПроекцияРавныхПлощадейЛамберта",
  MiscellaneousOrteliusOvalProjection = "ПрочаяОвальнаяПроекцияОртелиуса",
  MiscellaneousVanDerGrinten1Projection = "ПрочаяПроекцияВанДерГринтена1",
  MiscellaneousVanDerGrinten2Projection = "ПрочаяПроекцияВанДерГринтена2",
  MiscellaneousVanDerGrinten3Projection = "ПрочаяПроекцияВанДерГринтена3",
  MiscellaneousApianGlobular1Projection = "ПрочаяСотоваяШаровая1Проекция",
  MiscellaneousBaconGlobularProjection = "ПрочаяШароваяПроекцияБекона",
  MiscellaneousNicolosiGlobularProjection = "ПрочаяШароваяПроекцияНиколоси",
  MiscellaneousAugustEpicycloidalProjection = "ПрочаяЭпициклоидальнаяПроекцияАвгуста",
  PseudoCylindricalBoggsEumorphicProjection = "ПсевдоцилиндрическаяНормальнаяПроекцияБоггса",
  PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection = "ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса",
  PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection = "ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса",
  PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection = "ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса",
  PseudoCylindricalWinkel1Projection = "ПсевдоцилиндрическаяПроекцияВинкеля1",
  PseudoCylindricalLoximutalProjection = "ПсевдоцилиндрическаяПроекцияЛоксимутала",
  PseudoCylindricalMollweideProjection = "ПсевдоцилиндрическаяПроекцияМолвейда",
  PseudoCylindricalHatanoAsymetricalEqualAreaProjection = "ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано",
  PseudoCylindricalPutninP2Projection = "ПсевдоцилиндрическаяПроекцияПутнинаP2",
  PseudoCylindricalPutninP5Projection = "ПсевдоцилиндрическаяПроекцияПутнинаP5",
  PseudoCylindricalRobinsonProjection = "ПсевдоцилиндрическаяПроекцияРобинсона",
  PseudoCylindricalEckert1Projection = "ПсевдоцилиндрическаяПроекцияЭкерта1",
  PseudoCylindricalEckert2Projection = "ПсевдоцилиндрическаяПроекцияЭкерта2",
  PseudoCylindricalEckert3Projection = "ПсевдоцилиндрическаяПроекцияЭкерта3",
  PseudoCylindricalEckert4Projection = "ПсевдоцилиндрическаяПроекцияЭкерта4",
  PseudoCylindricalEckert5Projection = "ПсевдоцилиндрическаяПроекцияЭкерта5",
  PseudoCylindricalEckert6Projection = "ПсевдоцилиндрическаяПроекцияЭкерта6",
  PseudoCylindricalSinusoidalProjection = "ПсевдоцилиндрическаяСинусоидальнаяПроекция",
  CylindricalMillerProjection = "ЦилиндрическаяПроекцияМиллера",
  CylindricalLambertEqualAreaProjection = "ЦилиндрическаяПроекцияРавныхОбластейЛамберта",
  CylindricalEquidistantProjection = "ЦилиндрическаяРавноудаленнаяПроекция",
  CylindricalGallStereographicProjection = "ЦилиндрическаяСтереографическаяПроекцияГалла",
}

export enum GeographicalSchemaShowMode {
  AllData = "ВсеДанные",
  ScaleDefined = "ЗадаетсяМасштабом",
  SpecifiedArea = "ЗаданнаяОбласть",
}

export enum PaintingReferencePointPosition {
  LeftTop = "ЛевоВерх",
  LeftBottom = "ЛевоНиз",
  LeftCenter = "ЛевоЦентр",
  RightTop = "ПравоВерх",
  RightBottom = "ПравоНиз",
  RightCenter = "ПравоЦентр",
  Center = "Центр",
  CenterTop = "ЦентрВерх",
  CenterBottom = "ЦентрНиз",
}

export enum SeriesValuesDrawingMode {
  ShowAsPart = "ОтображатьКакДолю",
  ShowAsValue = "ОтображатьКакЗначение",
}

export enum CheckBoxType {
  Auto = "Авто",
  Switch = "Выключатель",
  Tumbler = "Тумблер",
  CheckBox = "Флажок",
}

export enum ChildFormItemsGroup {
  Vertical = "Вертикальная",
  Horizontal = "Горизонтальная",
  AlwaysHorizontal = "ГоризонтальнаяВсегда",
  HorizontalIfPossible = "ГоризонтальнаяЕслиВозможно",
}

export enum ChildFormItemsWidth {
  Auto = "Авто",
  LeftNarrowest = "ЛевыйОченьУзкий",
  LeftWidest = "ЛевыйОченьШирокий",
  LeftNarrow = "ЛевыйУзкий",
  LeftWide = "ЛевыйШирокий",
  Equal = "Одинаковая",
}

export enum ChoiceButtonRepresentation {
  Auto = "Авто",
  ShowInDropList = "ОтображатьВВыпадающемСписке",
  ShowInDropListAndInInputField = "ОтображатьВВыпадающемСпискеИВПолеВвода",
  ShowInInputField = "ОтображатьВПолеВвода",
}

export enum ChoiceHistoryOnInput {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export enum ClipboardDataStandardFormat {
  HTML = "HTML",
  Picture = "Картинка",
  Text = "Текст",
}

export enum CollapseFormItemsByImportance {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ColorDepth {
  BitPerPixel1 = "БитНаПиксел1",
  BitPerPixel24 = "БитНаПиксел24",
  BitPerPixel32 = "БитНаПиксел32",
  BitPerPixel4 = "БитНаПиксел4",
  BitPerPixel8 = "БитНаПиксел8",
}

export enum ColumnEditMode {
  Enter = "Вход",
  EnterOnInput = "ВходПриВводе",
  Directly = "Непосредственно",
}

export enum ColumnLocation {
  SameColumn = "ВТойЖеКолонке",
  OnNextRow = "НаСледующейСтроке",
  NewColumn = "НоваяКолонка",
}

export enum ColumnsGroup {
  Vertical = "Вертикальная",
  InCell = "ВЯчейке",
  Horizontal = "Горизонтальная",
}

export enum ColumnSizeChange {
  Change = "Изменять",
  DontChange = "НеИзменять",
}

export enum CommandBarButtonAlignment {
  Left = "Лево",
  Right = "Право",
  Center = "Центр",
}

export enum CommandBarButtonOrder {
  Asc = "Возр",
  DontOrder = "НеУпорядочивать",
  Desc = "Убыв",
}

export enum CommandBarButtonRepresentation {
  Auto = "Авто",
  Picture = "Картинка",
  Text = "Надпись",
  PictureText = "НадписьКартинка",
}

export enum CommandBarButtonType {
  Action = "Действие",
  Popup = "Подменю",
  Separator = "Разделитель",
}

export enum CommandGroupCategory {
  FormCommandBar = "КоманднаяПанельФормы",
  ActionsPanel = "ПанельДействий",
  NavigationPanel = "ПанельНавигации",
  FormNavigationPanel = "ПанельНавигацииФормы",
}

export enum CommandParameterUseMode {
  Multiple = "Множественный",
  Single = "Одиночный",
}

export enum ConnectorLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export enum ConnectorTextLocation {
  FirstSegment = "ПервыйСегмент",
  Middle = "СерединаЛинии",
}

export enum ControlBorderType {
  WithoutBorder = "БезРамки",
  Indented = "Вдавленная",
  Embossed = "Выпуклая",
  Double = "Двойная",
  DoubleUnderline = "ДвойноеПодчеркивание",
  Single = "Одинарная",
  Underline = "Подчеркивание",
  Rounded = "Скругленная",
  Overline = "ЧертаСверху",
}

export enum ControlCollapseMode {
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export enum ControlEdge {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export enum CurrentRowUse {
  Auto = "Авто",
  Use = "Использует",
  DontUse = "НеИспользует",
}

export enum DataChangeType {
  Create = "Добавление",
  Update = "Изменение",
  Delete = "Удаление",
}

export enum DateSelectionMode {
  Interval = "Интервал",
  Multiple = "Множественный",
  Single = "Одиночный",
}

export enum DimensionAttributePlacementType {
  Together = "Вместе",
  WithDimensions = "ВместеСИзмерениями",
  Separately = "Отдельно",
}

export enum DimensionPlacementType {
  Together = "Вместе",
  Separately = "Отдельно",
  SeparatelyAndInTotalsOnly = "ОтдельноИТолькоВИтогах",
}

export enum DisplayImportance {
  Auto = "Авто",
  High = "Высокая",
  Low = "Низкая",
  Usual = "Обычная",
  VeryHigh = "ОченьВысокая",
  VeryLow = "ОченьНизкая",
}

export enum DragAction {
  Choice = "Выбор",
  Copy = "Копирование",
  Cancel = "Отмена",
  Move = "Перемещение",
}

export enum DragAllowedActions {
  Copy = "Копирование",
  CopyAndMove = "КопированиеИПеремещение",
  DontProcess = "НеОбрабатывать",
  Move = "Перемещение",
}

export enum DrawingSelectionShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum EditTextUpdate {
  Auto = "Авто",
  Always = "Всегда",
  DontUse = "НеИспользовать",
  OnValueChange = "ПриИзмененииЗначения",
}

export enum FitPageMode {
  Auto = "Авто",
  PageWidth = "ПоШиринеСтраницы",
  Proportionally = "Пропорционально",
}

export enum FixingInTable {
  Left = "Лево",
  None = "Нет",
  Right = "Право",
}

export enum FoldersAndItems {
  Auto = "Авто",
  Folders = "Группы",
  FoldersAndItems = "ГруппыИЭлементы",
  Items = "Элементы",
}

export enum FormButtonPictureLocation {
  Auto = "Авто",
  Left = "Лево",
  Right = "Право",
}

export enum FormButtonType {
  Hyperlink = "Гиперссылка",
  CommandBarHyperlink = "ГиперссылкаКоманднойПанели",
  CommandBarButton = "КнопкаКоманднойПанели",
  UsualButton = "ОбычнаяКнопка",
}

export enum FormCommandBarLabelLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export enum FormConversationsRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum FormDecorationType {
  Picture = "Картинка",
  Label = "Надпись",
}

export enum FormFieldType {
  HTMLDocumentField = "ПолеHTMLДокумента",
  PDFDocumentField = "ПолеPDFДокумента",
  InputField = "ПолеВвода",
  GeographicalSchemaField = "ПолеГеографическойСхемы",
  GraphicalSchemaField = "ПолеГрафическойСхемы",
  DendrogramField = "ПолеДендрограммы",
  ChartField = "ПолеДиаграммы",
  GanttChartField = "ПолеДиаграммыГанта",
  ProgressBarField = "ПолеИндикатора",
  CalendarField = "ПолеКалендаря",
  PictureField = "ПолеКартинки",
  LabelField = "ПолеНадписи",
  RadioButtonField = "ПолеПереключателя",
  PeriodField = "ПолеПериода",
  PlannerField = "ПолеПланировщика",
  TrackBarField = "ПолеПолосыРегулирования",
  SpreadsheetDocumentField = "ПолеТабличногоДокумента",
  TextDocumentField = "ПолеТекстовогоДокумента",
  CheckBoxField = "ПолеФлажка",
  FormattedDocumentField = "ПолеФорматированногоДокумента",
}

export enum FormGroupType {
  ButtonGroup = "ГруппаКнопок",
  ColumnGroup = "ГруппаКолонок",
  CommandBar = "КоманднаяПанель",
  ContextMenu = "КонтекстноеМеню",
  UsualGroup = "ОбычнаяГруппа",
  Popup = "Подменю",
  Page = "Страница",
  Pages = "Страницы",
}

export enum FormItemAdditionType {
  ViewStatusRepresentation = "ОтображениеСостоянияПросмотра",
  SearchStringRepresentation = "ОтображениеСтрокиПоиска",
  SearchControl = "УправлениеПоиском",
}

export enum FormItemCommandBarLabelLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export enum FormItemOrientation {
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
}

export enum FormItemSpacing {
  Auto = "Авто",
  Double = "Двойной",
  None = "Нет",
  Single = "Одинарный",
  Half = "Половинный",
  OneAndHalf = "Полуторный",
}

export enum FormItemTitleLocation {
  Auto = "Авто",
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export enum FormPagesRepresentation {
  Auto = "Авто",
  TabsOnTop = "ЗакладкиСверху",
  TabsOnLeftHorizontal = "ЗакладкиСлеваГоризонтально",
  TabsOnBottom = "ЗакладкиСнизу",
  TabsOnRightHorizontal = "ЗакладкиСправаГоризонтально",
  None = "Нет",
  Swipe = "Пролистывание",
}

export enum FormPagesState {
  Titles = "Заголовки",
  TitlesAndCurrentPage = "ЗаголовкиИТекущаяСтраница",
  CurrentPage = "ТекущаяСтраница",
}

export enum FormStandardURLVariant {
  ReportVariant = "ВариантОтчета",
  Record = "Запись",
  ListCurrentRowRecord = "ЗаписьТекущейСтрокиСписка",
  Object = "Объект",
  ListCurrentRowObject = "ОбъектТекущейСтрокиСписка",
  Report = "Отчет",
  ReportWithCurrentSettings = "ОтчетСТекущимиНастройками",
  List = "Список",
  ListWithCurrentSettings = "СписокСТекущимиНастройками",
  ListWithCurrentSettingsAndRow = "СписокСТекущимиНастройкамиИСтрокой",
}

export enum FormWindowOpeningMode {
  LockWholeInterface = "БлокироватьВесьИнтерфейс",
  LockOwnerWindow = "БлокироватьОкноВладельца",
  DontBlock = "НеБлокировать",
}

export enum GraphicalSchemaGridDrawMode {
  Lines = "Линии",
  None = "НеРисовать",
  Dots = "Точки",
  Chess = "ШахматнаяСетка",
}

export enum GraphicalSchemaItemPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export enum GraphicalSchemaShapes {
  Block = "Блок",
  Document = "Документ",
  None = "Нет",
  Folder = "Папка",
  VerticalBrackets = "СкобкиВертикальные",
  HorizontalBrackets = "СкобкиГоризонтальные",
  UpArrow = "СтрелкаВверх",
  UpDownArrow = "СтрелкаВверхВниз",
  LeftArrow = "СтрелкаВлево",
  LeftRightArrow = "СтрелкаВлевоВправо",
  DownArrow = "СтрелкаВниз",
  RightArrow = "СтрелкаВправо",
  File = "Файл",
  Ellipse = "Эллипс",
}

export enum GraphicalSchemeElementSideType {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export enum HorizontalAlign {
  Auto = "Авто",
  Left = "Лево",
  Justify = "ПоШирине",
  Right = "Право",
  Center = "Центр",
}

export enum HTMLDocumentFieldMode {
  Browse = "Просмотр",
  Design = "Редактирование",
}

export enum IncompleteChoiceMode {
  OnActivate = "ПриАктивизации",
  OnEnterPressed = "ПриНажатииEnter",
}

export enum InitialListView {
  Auto = "Авто",
  End = "Конец",
  Beginning = "Начало",
}

export enum InitialTreeView {
  NoExpand = "НеРаскрывать",
  ExpandTopLevel = "РаскрыватьВерхнийУровень",
  ExpandAllLevels = "РаскрыватьВсеУровни",
}

export enum InputFieldAutofillHint {
  Email = "Email",
  City = "Город",
  GivenName = "Имя",
  UserName = "ИмяПользователя",
  PostalCode = "Индекс",
  DontUse = "НеИспользовать",
  NewPassword = "НовыйПароль",
  CreditCardNumber = "НомерБанковскойКарты",
  PhoneNumber = "НомерТелефона",
  OneTimeCode = "ОдноразовыйПароль",
  MiddleName = "Отчество",
  Password = "Пароль",
  FullName = "ПолноеИмя",
  NamePrefix = "ПрефиксИмени",
  Region = "Регион",
  Country = "Страна",
  NameSuffix = "СуффиксИмени",
  Street = "Улица",
  FamilyName = "Фамилия",
}

export enum InputFieldCommandSource {
  MultipleValue = "МножественноеЗначение",
  InputArea = "ОбластьВвода",
}

export enum InputFieldMultipleValuePictureShape {
  Auto = "Авто",
  Rect = "Квадрат",
  Circle = "Круг",
}

export enum InputFieldMultipleValuePictureSize {
  Auto = "Авто",
  Large = "Крупный",
  Small = "Маленький",
  Medium = "Средний",
}

export enum InputFieldStandardCommand {
  Paste = "Вставить",
  Choose = "Выбрать",
  SelectAll = "ВыделитьВсе",
  Cut = "Вырезать",
  AddEmptyValue = "ДобавитьПустоеЗначение",
  Copy = "Копировать",
  SearchEverywhere = "НайтиВезде",
  Open = "Открыть",
  Clear = "Очистить",
  Create = "Создать",
  Delete = "Удалить",
}

export enum ItemHeightControlVariant {
  Auto = "Авто",
  UseHeightInFormRows = "ВСтрокахФормы",
  UseContentHeight = "ПоСодержимому",
}

export enum ItemHorizontalLocation {
  Auto = "Авто",
  Left = "Лево",
  Right = "Право",
  Center = "Центр",
}

export enum ItemsAndTitlesAlignVariant {
  Auto = "Авто",
  None = "Нет",
  ItemsLeftTitlesLeft = "ЭлементыЛевоЗаголовкиЛево",
  ItemsLeftTitlesRight = "ЭлементыЛевоЗаголовкиПраво",
  ItemsRightTitlesLeft = "ЭлементыПравоЗаголовкиЛево",
  ItemsRightTitlesRight = "ЭлементыПравоЗаголовкиПраво",
}

export enum ItemVerticalAlign {
  Auto = "Авто",
  Top = "Верх",
  Bottom = "Низ",
  Center = "Центр",
}

export enum LabelPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export enum LinkedValueChangeMode {
  DontChange = "НеИзменять",
  Clear = "Очищать",
}

export enum ListEditMode {
  InDialog = "ВДиалоге",
  InList = "ВСписке",
}

export enum MainClientApplicationWindowMode {
  EmbeddedWorkplace = "ВстроенноеРабочееМесто",
  Kiosk = "Киоск",
  Normal = "Обычный",
  FullscreenWorkplace = "ПолноэкранноеРабочееМесто",
  Workplace = "РабочееМесто",
}

export enum NewRowShowCheckVariant {
  DontCheck = "НеПроверять",
  FilterMismatchMessage = "СообщатьОНесоответствииОтбору",
}

export enum OnScreenKeyboardReturnKeyText {
  Auto = "Авто",
  Return = "Ввод",
  Done = "Готово",
  Next = "Далее",
  Search = "Найти",
  Send = "Отправить",
  Go = "Перейти",
  Join = "Подключиться",
  Continue = "Продолжить",
}

export enum Orientation {
  Auto = "Авто",
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
}

export enum PanelPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export enum PictureFormat {
  BMP = "BMP",
  EMF = "EMF",
  GIF = "GIF",
  Icon = "Icon",
  JPEG = "JPEG",
  PNG = "PNG",
  SVG = "SVG",
  TIFF = "TIFF",
  WMF = "WMF",
  UnknownFormat = "НеизвестныйФормат",
}

export enum PictureSize {
  AutoSize = "АвтоРазмер",
  AutoSizeIgnoreScale = "АвтоРазмерБезУчетаМасштаба",
  ByFontSize = "ПоРазмеруШрифта",
  Proportionally = "Пропорционально",
  Stretch = "Растянуть",
  RealSize = "РеальныйРазмер",
  RealSizeIgnoreScale = "РеальныйРазмерБезУчетаМасштаба",
  Tile = "Черепица",
}

export enum PrintDialogUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum ProgressBarSmoothingMode {
  Smooth = "Плавный",
  Broken = "Прерывистый",
  BrokenTilt = "ПрерывистыйНаклонный",
}

export enum RadioButtonType {
  Auto = "Авто",
  RadioButton = "Переключатель",
  Tumbler = "Тумблер",
}

export enum RefreshRequestMethod {
  None = "Нет",
  PullFromTop = "ПотянутьСверху",
  PullFromTopOrBottom = "ПотянутьСверхуИлиСнизу",
  PullFromBottom = "ПотянутьСнизу",
}

export enum ReportFormType {
  Variant = "Вариант",
  Settings = "Настройка",
  Main = "Основная",
}

export enum ReportResultViewMode {
  Auto = "Авто",
  Compact = "Компактный",
  Default = "Обычный",
}

export enum SaveFormDataInSettings {
  UseList = "ИспользоватьСписок",
  DontUse = "НеИспользовать",
}

export enum ScrollBarUse {
  AutoUse = "ИспользоватьАвтоматически",
  UseAlways = "ИспользоватьВсегда",
  DontUse = "НеИспользовать",
}

export enum ScrollingTextMode {
  Fast = "Быстро",
  Slow = "Медленно",
  DontUse = "НеИспользовать",
  Normal = "Нормально",
  VeryFast = "ОченьБыстро",
  VerySlow = "ОченьМедленно",
}

export enum SearchControlLocation {
  Auto = "Авто",
  CommandBar = "КоманднаяПанель",
  None = "Нет",
}

export enum SearchInTableOnInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum SearchStringLocation {
  Auto = "Авто",
  Top = "Верх",
  FormCaption = "ЗаголовокФормы",
  CommandBar = "КоманднаяПанель",
  Bottom = "Низ",
  PullFromTop = "ПотянутьСверху",
}

export enum SelectionShowMode {
  Always = "Всегда",
  DontShow = "НеОтображать",
  WhenActive = "ПриАктивности",
  WhenMultipleCellsSelected = "ПриВыделенииНесколькихЯчеек",
  WhenMultipleCellsSelectedWhenActive = "ПриВыделенииНесколькихЯчеекПриАктивности",
}

export enum ShowTabs {
  DontUse = "НеИспользовать",
  Top = "Сверху",
  TopMultiLine = "СверхуМногострочный",
  TopMultilineTransposition = "СверхуМногострочныйСПерестановкой",
  TopScrolling = "СверхуСПрокруткой",
  LeftVertical = "СлеваВертикально",
  LeftHorizontal = "СлеваГоризонтально",
  Bottom = "Снизу",
  BottomMultiLine = "СнизуМногострочный",
  BottomMultilineTransposition = "СнизуМногострочныйСПерестановкой",
  BottomScrolling = "СнизуСПрокруткой",
  RightVertical = "СправаВертикально",
  RightHorizontal = "СправаГоризонтально",
}

export enum SizeChangeMode {
  QuickChange = "БыстроеИзменение",
  Normal = "Обычный",
}

export enum SpecialTextInputMode {
  Email = "Email",
  URL = "URL",
  Auto = "Авто",
  None = "Нет",
  PhoneNumber = "НомерТелефона",
  Digits = "Цифры",
  DigitsAndPunctuation = "ЦифрыИПунктуация",
}

export enum SpellCheckingOnTextInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum StandardAppearance {
  Orange = "Апельсин",
  Asphalt = "Асфальт",
  None = "БезОформления",
  Turquoise = "Бирюза",
  Bronze = "Бронза",
  Spring = "Весна",
  Wood = "Дерево",
  Winter = "Зима",
  Interface = "Интерфейс",
  Stone = "Камень",
  Classic = "Классика",
  Classic2 = "Классика2",
  Classic3 = "Классика3",
  Ice = "Лед",
  Summer = "Лето",
  Copper = "Медь",
  Autumn = "Осень",
  Sand = "Песок",
  Platinum = "Платина",
  Silver = "Серебро",
  Textile = "Текстиль",
  Grass = "Трава",
}

export enum StandardCommandsGroup {
  FormCommandBarImportant = "КоманднаяПанельФормыВажное",
  FormCommandBarCreateBasedOn = "КоманднаяПанельФормыСоздатьНаОсновании",
  ActionsPanelReports = "ПанельДействийОтчеты",
  ActionsPanelTools = "ПанельДействийСервис",
  ActionsPanelCreate = "ПанельДействийСоздать",
  NavigationPanelImportant = "ПанельНавигацииВажное",
  NavigationPanelOrdinary = "ПанельНавигацииОбычное",
  NavigationPanelSeeAlso = "ПанельНавигацииСмТакже",
  FormNavigationPanelImportant = "ПанельНавигацииФормыВажное",
  FormNavigationPanelGoTo = "ПанельНавигацииФормыПерейти",
  FormNavigationPanelSeeAlso = "ПанельНавигацииФормыСмТакже",
}

export enum TableBehaviorOnHorizontalCompression {
  Auto = "Авто",
  MoveItemsByImportance = "ПереноситьЭлементыПоВажности",
  HideItemsByImportance = "СкрыватьЭлементыПоВажности",
}

export enum TableBoxRowInputMode {
  EndOfWindow = "ВКонецОкна",
  EndOfList = "ВКонецСписка",
  BeforeCurrentRow = "ПередТекущейСтрокой",
  AfterCurrentRow = "ПослеТекущейСтроки",
}

export enum TableBoxRowSelectionMode {
  Row = "Строка",
  Cell = "Ячейка",
}

export enum TableBoxSelectionMode {
  MultiLine = "Множественный",
  SingleLine = "Одиночный",
}

export enum TableCurrentRowUse {
  Auto = "Авто",
  Choice = "Выбор",
  SelectionPresentation = "ОтображениеВыделения",
  SelectionPresentationAndChoice = "ОтображениеВыделенияИВыбор",
}

export enum TableHeightControlVariant {
  Auto = "Авто",
  UseHeightInTableRows = "ВСтрокахТаблицы",
  UseHeightInFormRows = "ВСтрокахФормы",
  UseContentHeight = "ПоСодержимому",
}

export enum TableRepresentation {
  Tree = "Дерево",
  HierarchicalList = "ИерархическийСписок",
  List = "Список",
}

export enum TableRowInputMode {
  EndOfWindow = "ВКонецОкна",
  EndOfList = "ВКонецСписка",
  BeforeCurrentRow = "ПередТекущейСтрокой",
  AfterCurrentRow = "ПослеТекущейСтроки",
}

export enum TableRowSelectionMode {
  Row = "Строка",
  Cell = "Ячейка",
}

export enum TableSelectionMode {
  MultiRow = "Множественный",
  SingleRow = "Одиночный",
}

export enum TaskListMode {
  AllTasks = "ВсеЗадачи",
  ByPerformer = "ПоИсполнителю",
}

export enum TextDirection {
  LeftToRight = "СлеваНаправо",
  RightToLeft = "СправаНалево",
}

export enum ThroughAlign {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum TimeScalePosition {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export enum TitleLocation {
  TitleLeft = "ЗаголовокСлева",
  TitleRight = "ЗаголовокСправа",
}

export enum ToolTipRepresentation {
  Auto = "Авто",
  Balloon = "Всплывающая",
  Button = "Кнопка",
  None = "Нет",
  ShowAuto = "ОтображатьАвто",
  ShowTop = "ОтображатьСверху",
  ShowLeft = "ОтображатьСлева",
  ShowBottom = "ОтображатьСнизу",
  ShowRight = "ОтображатьСправа",
}

export enum TrackBarMarkingAppearance {
  DontShow = "НеОтображать",
  TopLeft = "СверхуИлиСлева",
  BottomRight = "СнизуИлиСправа",
  BothSides = "СОбоихСторон",
}

export enum UseMenuMode {
  Use = "Использовать",
  UseExtra = "ИспользоватьДополнительно",
  DontUse = "НеИспользовать",
}

export enum UseOutput {
  Auto = "Авто",
  Disable = "Запретить",
  Enable = "Разрешить",
}

export enum UserNotificationStatus {
  Important = "Важное",
  Information = "Информация",
}

export enum UsualGroupBehavior {
  Auto = "Авто",
  PopUp = "Всплывающая",
  Usual = "Обычное",
  Collapsible = "Свертываемая",
}

export enum UsualGroupControlRepresentation {
  TitleHyperlink = "ГиперссылкаЗаголовка",
  Picture = "Картинка",
}

export enum UsualGroupRepresentation {
  None = "Нет",
  NormalSeparation = "ОбычноеВыделение",
  StrongSeparation = "СильноеВыделение",
  WeakSeparation = "СлабоеВыделение",
}

export enum VerticalAlign {
  Auto = "Авто",
  Top = "Верх",
  Bottom = "Низ",
  Center = "Центр",
}

export enum VerticalFormScroll {
  Auto = "Авто",
  Use = "Использовать",
  UseWithoutStretch = "ИспользоватьБезРастягивания",
  UseIfNecessary = "ИспользоватьПриНеобходимости",
}

export enum ViewModeApplicationOnSetReportResult {
  Auto = "Авто",
  DontApply = "НеПрименять",
  Apply = "Применять",
}

export enum ViewScalingMode {
  Auto = "Авто",
  Large = "Крупный",
  Normal = "Обычный",
}

export enum ViewStatusLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export enum WarningOnEditRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export enum WindowAppearanceModeChange {
  Auto = "Авто",
  Disable = "Запретить",
  Enable = "Разрешить",
}

export enum WindowAppearanceModeVariant {
  Maximized = "Максимизированное",
  Minimized = "Минимизированное",
  Normal = "Нормальное",
}

export enum WindowDockVariant {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export enum WindowLocationVariant {
  Auto = "Авто",
  DontOverlapOwner = "НеПерекрыватьВладельца",
  Center = "Центрировать",
}

export enum WindowSizeChange {
  Change = "Изменять",
  DontChange = "НеИзменять",
}

export enum WindowStateVariant {
  Normal = "Обычное",
  Docked = "Прикрепленное",
  Autohide = "Прячущееся",
  Float = "Свободное",
}

export enum IntegrationServiceChannelState {
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export enum ArchiveFileCompressionLevel {
  Maximum = "Максимальный",
  Minimum = "Минимальный",
  Optimal = "Оптимальный",
}

export enum ArchiveFileCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Копирование",
  Deflate = "Сжатие",
}

export enum ArchiveFileEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ArchiveFileRestoreFilePathsMode {
  Restore = "Восстанавливать",
  DontRestore = "НеВосстанавливать",
}

export enum ArchiveFileStorePathMode {
  DontStorePath = "НеСохранятьПути",
  StoreRelativePath = "СохранятьОтносительныеПути",
  StoreFullPath = "СохранятьПолныеПути",
}

export enum ArchiveFileSubDirProcessingMode {
  DontProcess = "НеОбрабатывать",
  ProcessRecursively = "ОбрабатыватьРекурсивно",
}

export enum ArchiveFileType {
  BZIP2 = "BZIP2",
  GZIP = "GZIP",
  RAR = "RAR",
  SevenZIP = "SevenZIP",
  TAR = "TAR",
  XZ = "XZ",
  ZIP = "ZIP",
}

export enum FileNamesEncodingInArchiveFile {
  UTF8 = "UTF8",
  Auto = "Авто",
  OSEncodingWithUTF8 = "КодировкаОСДополнительноUTF8",
}

export enum FileAccess {
  Write = "Запись",
  Read = "Чтение",
  ReadAndWrite = "ЧтениеИЗапись",
}

export enum FileCompareMethod {
  Binary = "Двоичное",
  SpreadsheetDocument = "ТабличныйДокумент",
  TextDocument = "ТекстовыйДокумент",
}

export enum FileDialogMode {
  ChooseDirectory = "ВыборКаталога",
  Open = "Открытие",
  Save = "Сохранение",
}

export enum FileDialogSection {
  Audio = "Аудио",
  Gallery = "Галерея",
  Documents = "Документы",
  Recent = "Недавние",
  Files = "Файлы",
}

export enum FileDragMode {
  AsFileRef = "КакСсылкаНаФайл",
  AsFile = "КакФайл",
}

export enum FileOpenMode {
  Append = "Дописать",
  Truncate = "Обрезать",
  Open = "Открыть",
  OpenOrCreate = "ОткрытьИлиСоздать",
  Create = "Создать",
  CreateNew = "СоздатьНовый",
}

export enum GetFilesArchiveMode {
  GetArchiveAlways = "ПолучатьАрхивВсегда",
  GetArchiveWhenRequired = "ПолучатьАрхивПриНеобходимости",
}

export enum IncomingShareRequestStandardCommand {
  CopyToClipboard = "КопироватьВБуферОбмена",
  ShareInConversation = "ПоделитьсяВОбсуждении",
  Show = "Показать",
  Save = "Сохранить",
}

export enum MobileDeviceLibraryDirType {
  Audio = "Аудио",
  Video = "Видео",
  Pictures = "Картинки",
}

export enum ShareRequestDataProcessingVariant {
  View = "Просмотр",
  Edit = "Редактирование",
}

export enum AccountMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export enum AccumulationRegisterType {
  Turnovers = "Обороты",
  Balance = "Остатки",
}

export enum AttributeUse {
  ForFolder = "ДляГруппы",
  ForFolderAndItem = "ДляГруппыИЭлемента",
  ForItem = "ДляЭлемента",
}

export enum BinaryDataBlockStorageUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum BinaryDataStorageMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum BusinessProcessNumberPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
}

export enum BusinessProcessNumberType {
  String = "Строка",
  Number = "Число",
}

export enum CalculationRegisterPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
}

export enum CalculationTypeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export enum CharacteristicKindCodesSeries {
  WholeCharacteristicKind = "ВоВсемПланеВидовХарактеристик",
  WithinSubordination = "ВПределахПодчинения",
}

export enum CharacteristicTypeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export enum CharOfAccountCodeSeries {
  WholeChartOfAccounts = "ВоВсемПланеСчетов",
  WithinSubordination = "ВПределахПодчинения",
}

export enum ChartOfCalculationTypesBaseUse {
  DontUse = "НеИспользовать",
  OnActionPeriod = "ПоПериодуДействия",
  OnRegistrationPeriod = "ПоПериодуРегистрации",
}

export enum ChartOfCalculationTypesCodeType {
  String = "Строка",
  Number = "Число",
}

export enum ChoiceDataGetModeOnInputByString {
  Directly = "Непосредственно",
  Background = "Фоновый",
}

export enum ChoiceMode {
  QuickChoice = "БыстрыйВыбор",
  FromForm = "ИзФормы",
  BothWays = "ОбоимиСпособами",
}

export enum CommonAttributeAuthenticationSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export enum CommonAttributeAutoUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum CommonAttributeConfigurationExtensionsSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export enum CommonAttributeDataSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export enum CommonAttributeSeparatedDataUse {
  Independently = "Независимо",
  IndependentlyAndSimultaneously = "НезависимоИСовместно",
}

export enum CommonAttributeUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum CommonAttributeUsersSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export enum CompatibilityMode {
  Version8_1 = "Версия8_1",
  Version8_2_13 = "Версия8_2_13",
  Version8_2_16 = "Версия8_2_16",
  Version8_3_1 = "Версия8_3_1",
  Version8_3_10 = "Версия8_3_10",
  Version8_3_11 = "Версия8_3_11",
  Version8_3_12 = "Версия8_3_12",
  Version8_3_13 = "Версия8_3_13",
  Version8_3_14 = "Версия8_3_14",
  Version8_3_15 = "Версия8_3_15",
  Version8_3_16 = "Версия8_3_16",
  Version8_3_17 = "Версия8_3_17",
  Version8_3_18 = "Версия8_3_18",
  Version8_3_19 = "Версия8_3_19",
  Version8_3_2 = "Версия8_3_2",
  Version8_3_20 = "Версия8_3_20",
  Version8_3_21 = "Версия8_3_21",
  Version8_3_22 = "Версия8_3_22",
  Version8_3_23 = "Версия8_3_23",
  Version8_3_24 = "Версия8_3_24",
  Version8_3_25 = "Версия8_3_25",
  Version8_3_26 = "Версия8_3_26",
  Version8_3_3 = "Версия8_3_3",
  Version8_3_4 = "Версия8_3_4",
  Version8_3_5 = "Версия8_3_5",
  Version8_3_6 = "Версия8_3_6",
  Version8_3_7 = "Версия8_3_7",
  Version8_3_8 = "Версия8_3_8",
  Version8_3_9 = "Версия8_3_9",
  DontUse = "НеИспользовать",
}

export enum ConfigurationExtensionPurpose {
  Customization = "Адаптация",
  AddOn = "Дополнение",
  Patch = "Исправление",
}

export enum CreateOnInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum DataExchangeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export enum DataHistoryUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum DefaultDataLockControlMode {
  Automatic = "Автоматический",
  AutomaticAndManaged = "АвтоматическийИУправляемый",
  Managed = "Управляемый",
}

export enum DocumentNumberPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
}

export enum DocumentNumberType {
  String = "Строка",
  Number = "Число",
}

export enum EditType {
  InDialog = "ВДиалоге",
  InList = "ВСписке",
  BothWays = "ОбоимиСпособами",
}

export enum ExternalDataSourceTableDataType {
  NonobjectData = "НеобъектныеДанные",
  ObjectData = "ОбъектныеДанные",
}

export enum ExternalDataSourceTableType {
  Expression = "Выражение",
  Table = "Таблица",
}

export enum FormType {
  Ordinary = "Обычная",
  Managed = "Управляемая",
}

export enum FullTextSearchOnInputByString {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum HierarchyType {
  HierarchyFoldersAndItems = "ИерархияГруппИЭлементов",
  HierarchyOfItems = "ИерархияЭлементов",
}

export enum HTTPMethod {
  CONNECT = "CONNECT",
  COPY = "COPY",
  DELETE = "DELETE",
  GET = "GET",
  HEAD = "HEAD",
  LOCK = "LOCK",
  MERGE = "MERGE",
  MKCOL = "MKCOL",
  MOVE = "MOVE",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
  POST = "POST",
  PROPFIND = "PROPFIND",
  PROPPATCH = "PROPPATCH",
  PUT = "PUT",
  TRACE = "TRACE",
  UNLOCK = "UNLOCK",
  Any = "Любой",
}

export enum Indexing {
  Index = "Индексировать",
  IndexWithAdditionalOrder = "ИндексироватьСДопУпорядочиванием",
  DontIndex = "НеИндексировать",
}

export enum InformationRegisterPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
  RecorderPosition = "ПозицияРегистратора",
  Second = "Секунда",
}

export enum IntegrationServiceChannelMessageDirection {
  Send = "Отправка",
  Receive = "Получение",
}

export enum ModalityUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export enum MoveBoundaryOnPosting {
  DontMove = "НеПеремещать",
  Move = "Перемещать",
}

export enum ObjectAutonumerationMode {
  NotAutoFree = "НеОсвобождатьАвтоматически",
  AutoFree = "ОсвобождатьАвтоматически",
}

export enum ObjectBelonging {
  Adopted = "Заимствованный",
  Native = "Собственный",
}

export enum Posting {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export enum PredefinedDataUpdate {
  Auto = "Авто",
  DontAutoUpdate = "НеОбновлятьАвтоматически",
  AutoUpdate = "ОбновлятьАвтоматически",
}

export enum RealTimePosting {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export enum RegisterRecordsDeletion {
  AutoDeleteOff = "НеУдалятьАвтоматически",
  AutoDelete = "УдалятьАвтоматически",
  AutoDeleteOnUnpost = "УдалятьАвтоматическиПриОтменеПроведения",
}

export enum RegisterRecordsWritingOnPost {
  WriteSelected = "ЗаписыватьВыбранные",
  WriteModified = "ЗаписыватьМодифицированные",
}

export enum RegisterWriteMode {
  Independent = "Независимый",
  RecorderSubordinate = "ПодчинениеРегистратору",
}

export enum ReturnValuesReuse {
  DuringRequest = "НаВремяВызова",
  DuringSession = "НаВремяСеанса",
  DontUse = "НеИспользовать",
}

export enum ScriptVariant {
  English = "Английский",
  Russian = "Русский",
}

export enum SearchStringModeOnInputByString {
  AnyPart = "ЛюбаяЧасть",
  Begin = "Начало",
}

export enum SequenceFilling {
  AutoFill = "ЗаполнятьАвтоматически",
  AutoFillOff = "НеЗаполнятьАвтоматически",
}

export enum SessionReuseMode {
  Use = "Использовать",
  AutoUse = "ИспользоватьАвтоматически",
  DontUse = "НеИспользовать",
}

export enum StyleElementType {
  Border = "Рамка",
  Color = "Цвет",
  Font = "Шрифт",
}

export enum SubordinationUse {
  ToFolders = "Группам",
  ToFoldersAndItems = "ГруппамИЭлементам",
  ToItems = "Элементам",
}

export enum SynchronousExtensionAndAddInCallUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export enum SynchronousPlatformExtensionAndAddInCallUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export enum TaskMainPresentation {
  AsDescription = "ВВидеНаименования",
  AsNumber = "ВВидеНомера",
}

export enum TaskNumberAutoPrefix {
  DontUse = "НеИспользовать",
  BusinessProcessNumber = "НомерБизнесПроцесса",
}

export enum TaskNumberType {
  String = "Строка",
  Number = "Число",
}

export enum TemplateType {
  ActiveDocument = "ActiveDocument",
  HTMLDocument = "HTMLДокумент",
  AddIn = "ВнешняяКомпонента",
  GeographicalSchema = "ГеографическаяСхема",
  GraphicalSchema = "ГрафическаяСхема",
  BinaryData = "ДвоичныеДанные",
  DataCompositionAppearanceTemplate = "МакетОформленияКомпоновкиДанных",
  DataCompositionSchema = "СхемаКомпоновкиДанных",
  SpreadsheetDocument = "ТабличныйДокумент",
  TextDocument = "ТекстовыйДокумент",
}

export enum TransferDirection {
  In = "Входной",
  InOut = "ВходнойВыходной",
  Out = "Выходной",
}

export enum TypeReductionMode {
  Deny = "Запрещать",
  TransformValues = "ПреобразовыватьЗначения",
  DeleteData = "УдалятьДанные",
}

export enum UseFullTextSearch {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum UseQuickChoice {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export enum PresentationAdditionType {
  Add = "Добавлять",
  DontAdd = "НеДобавлять",
}

export enum ReportBuilderDetailsFillType {
  GroupValues = "ЗначенияГруппировок",
  DontFill = "НеЗаполнять",
  Details = "Расшифровка",
}

export enum ReportBuilderDimensionType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export enum TotalPlacementType {
  Header = "Заголовок",
  HeaderAndFooter = "ЗаголовокИПодвал",
  Footer = "Подвал",
  FooterOnly = "ТолькоПодвал",
}

export enum XMLAttributeType {
  CDATA = "CDATA",
  ENTITIES = "ENTITIES",
  ENTITY = "ENTITY",
  ENUMERATION = "ENUMERATION",
  ID = "ID",
  IDREF = "IDREF",
  IDREFS = "IDREFS",
  NMTOKEN = "NMTOKEN",
  NMTOKENS = "NMTOKENS",
  NOTATION = "NOTATION",
}

export enum XMLCanonicalizationType {
  XMLExclusiveCanonicalization = "ИсключающийКаноническийXML",
  XMLExclusiveCanonicalizationWithComments = "ИсключающийКаноническийXMLСКомментариями",
  XMLCanonicalization = "КаноническийXML",
  XMLCanonicalization1_1 = "КаноническийXML1_1",
  XMLCanonicalization1_1WithComments = "КаноническийXML1_1СКомментариями",
  XMLCanonicalizationWithComments = "КаноническийXMLСКомментариями",
}

export enum XMLNodeType {
  Attribute = "Атрибут",
  ProcessingInstruction = "ИнструкцияОбработки",
  Comment = "Комментарий",
  EndEntity = "КонецСущности",
  EndElement = "КонецЭлемента",
  StartElement = "НачалоЭлемента",
  None = "Ничего",
  Notation = "Нотация",
  XMLDeclaration = "ОбъявлениеXML",
  DocumentTypeDefinition = "ОпределениеТипаДокумента",
  Whitespace = "ПробельныеСимволы",
  CDATASection = "СекцияCDATA",
  EntityReference = "СсылкаНаСущность",
  Entity = "Сущность",
  Text = "Текст",
}

export enum XMLSpace {
  Default = "ПоУмолчанию",
  Preserve = "Сохранять",
}

export enum XMLTypeAssignment {
  Implicit = "Неявное",
  Explicit = "Явное",
}

export enum XMLValidationType {
  NoValidate = "НетПроверки",
  DocumentTypeDefinition = "ОпределениеТипаДокумента",
  XMLSchema = "СхемаXML",
}

export enum AllowedMessageNo {
  Greater = "Больший",
  Any = "Любой",
  Next = "Очередной",
}

export enum AutoChangeRecord {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export enum DataItemReceive {
  Auto = "Авто",
  Ignore = "Игнорировать",
  Accept = "Принять",
}

export enum DataItemSend {
  Auto = "Авто",
  Ignore = "Игнорировать",
  Delete = "Удалить",
}

export enum AnalysisDataType {
  Discrete = "Дискретные",
  Contiguous = "Непрерывные",
}

export enum AssociationRulesDataSourceType {
  Object = "Объектный",
  Event = "Событийный",
}

export enum AssociationRulesPruneType {
  Redundant = "Избыточные",
  Covered = "Покрытые",
}

export enum ClusterizationMethod {
  NearestNeighbor = "БлижняяСвязь",
  FurthestNeighbor = "ДальняяСвязь",
  KMeans = "КСредних",
  Centroid = "ЦентрТяжести",
}

export enum DataAnalysisAssociationRulesOrderType {
  ByConfidence = "ПоДостоверности",
  ByImportance = "ПоЗначимости",
  BySupport = "ПоКоличествуСлучаев",
}

export enum DataAnalysisColumnTypeAssociationRules {
  NotUsed = "НеИспользуемая",
  Object = "Объект",
  Item = "Элемент",
}

export enum DataAnalysisColumnTypeClusterization {
  Input = "Входная",
  InputAndPredictable = "ВходнаяИПрогнозируемая",
  Key = "Ключ",
  NotUsed = "НеИспользуемая",
  Predictable = "Прогнозируемая",
}

export enum DataAnalysisColumnTypeDecisionTree {
  Input = "Входная",
  NotUsed = "НеИспользуемая",
  Predictable = "Прогнозируемая",
}

export enum DataAnalysisColumnTypeSequentialPatterns {
  Time = "Время",
  NotUsed = "НеИспользуемая",
  Sequence = "Последовательность",
  Item = "Элемент",
}

export enum DataAnalysisColumnTypeSummaryStatistics {
  Input = "Входная",
  NotUsed = "НеИспользуемая",
}

export enum DataAnalysisDistanceMetricType {
  Euclidean = "ЕвклидоваМетрика",
  SquaredEuclidean = "ЕвклидоваМетрикаВКвадрате",
  CityBlock = "МетрикаГорода",
  Maximum = "МетрикаДоминирования",
}

export enum DataAnalysisFieldType {
  DataAnalysisObject = "ОбъектАнализаДанных",
  Field = "Поле",
}

export enum DataAnalysisNumericValueUseType {
  AsBoolean = "КакБулево",
  AsNumeric = "КакЧисло",
}

export enum DataAnalysisResultTableFillType {
  AllFields = "ВсеПоля",
  UsedFields = "ИспользуемыеПоля",
  KeyFields = "КлючевыеПоля",
  DontFill = "НеЗаполнять",
}

export enum DataAnalysisSequentialPatternsOrderType {
  ByLength = "ПоДлине",
  BySupport = "ПоКоличествуСлучаев",
}

export enum DataAnalysisStandardizationType {
  DontStandardize = "НеСтандартизировать",
  Standardize = "Стандартизировать",
}

export enum DataAnalysisTimeIntervalUnitType {
  Year = "Год",
  TenDays = "Декада",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Minute = "Минута",
  Week = "Неделя",
  HalfYear = "Полугодие",
  Second = "Секунда",
  CurrentTenDays = "ТекущаяДекада",
  CurrentMinute = "ТекущаяМинута",
  CurrentWeek = "ТекущаяНеделя",
  CurrentHalfYear = "ТекущееПолугодие",
  CurrentYear = "ТекущийГод",
  CurrentDay = "ТекущийДень",
  CurrentQuarter = "ТекущийКвартал",
  CurrentMonth = "ТекущийМесяц",
  CurrentHour = "ТекущийЧас",
  Hour = "Час",
}

export enum DecisionTreeSimplificationType {
  DontSimplify = "НеУпрощать",
  Simplify = "Упрощать",
}

export enum PredictionModelColumnType {
  Input = "Входная",
  DataSourceColumn = "КолонкаИсточникаДанных",
  Predictable = "Прогнозируемая",
}

export enum FileNamesEncodingInZipFile {
  UTF8 = "UTF8",
  Auto = "Авто",
  OSEncodingWithUTF8 = "КодировкаОСДополнительноUTF8",
}

export enum ZIPCompressionLevel {
  Maximum = "Максимальный",
  Minimum = "Минимальный",
  Optimal = "Оптимальный",
}

export enum ZIPCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Копирование",
  Deflate = "Сжатие",
}

export enum ZIPEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ZIPRestoreFilePathsMode {
  Restore = "Восстанавливать",
  DontRestore = "НеВосстанавливать",
}

export enum ZIPStorePathMode {
  DontStorePath = "НеСохранятьПути",
  StoreRelativePath = "СохранятьОтносительныеПути",
  StoreFullPath = "СохранятьПолныеПути",
}

export enum ZIPSubDirProcessingMode {
  DontProcess = "НеОбрабатывать",
  ProcessRecursively = "ОбрабатыватьРекурсивно",
}

export enum DynamicListSearchStringViewMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
  ShowOnUsingFullTextSearch = "ОтображатьПриИспользованииПолнотекстовогоПоиска",
}

// export const metaObjects = {
//   metaObjects.XDTOFacetType = "ВидФасетаXDTO";
//   metaObjects.XMLForm = "ФормаXML";
//   metaObjects.WSParameterDirection = "WSНаправлениеПараметра";
//   metaObjects.DOMBuilderAction = "ДействиеПостроителяDOM";
//   metaObjects.DOMDocumentPosition = "ПозицияВДокументеDOM";
//   metaObjects.DOMNodeFilterParameters = "ПараметрыОтбораУзловDOM";
//   metaObjects.DOMNodeType = "ТипУзлаDOM";
//   metaObjects.DOMXPathResultType = "ТипРезультатаDOMXPath";
//   metaObjects.HTMLContentCategory = "КатегорияСодержимогоHTML";
//   metaObjects.DataCompositionAccountingBalanceType = "ТипБухгалтерскогоОстаткаКомпоновкиДанных";
//   metaObjects.DataCompositionAreaTemplateType = "ТипМакетаОбластиКомпоновкиДанных";
//   metaObjects.DataCompositionAttributesPlacement = "РасположениеРеквизитовКомпоновкиДанных";
//   metaObjects.DataCompositionBalanceType = "ТипОстаткаКомпоновкиДанных";
//   metaObjects.DataCompositionChartLegendPlacement = "РасположениеЛегендыДиаграммыКомпоновкиДанных";
//   metaObjects.DataCompositionComparisonType = "ВидСравненияКомпоновкиДанных";
//   metaObjects.DataCompositionConditionalAppearanceUse = "ИспользованиеУсловногоОформленияКомпоновкиДанных";
//   metaObjects.DataCompositionDataSetsLinkType = "ТипСвязиНаборовДанныхКомпоновкиДанных";
//   metaObjects.DataCompositionDetailsProcessingAction = "ДействиеОбработкиРасшифровкиКомпоновкиДанных";
//   metaObjects.DataCompositionFieldPlacement = "РасположениеПоляКомпоновкиДанных";
//   metaObjects.DataCompositionFieldsTitleType = "ТипЗаголовкаПолейКомпоновкиДанных";
//   metaObjects.DataCompositionFilterApplicationType = "ТипПримененияОтбораКомпоновкиДанных";
//   metaObjects.DataCompositionFilterItemsGroupType = "ТипГруппыЭлементовОтбораКомпоновкиДанных";
//   metaObjects.DataCompositionFixation = "ФиксацияКомпоновкиДанных";
//   metaObjects.DataCompositionGroupFieldsPlacement = "РасположениеПолейГруппировкиКомпоновкиДанных";
//   metaObjects.DataCompositionGroupPlacement = "РасположениеГруппировкиКомпоновкиДанных";
//   metaObjects.DataCompositionGroupTemplateType = "ТипМакетаГруппировкиКомпоновкиДанных";
//   metaObjects.DataCompositionGroupType = "ТипГруппировкиКомпоновкиДанных";
//   metaObjects.DataCompositionGroupUseVariant = "ВариантИспользованияГруппировкиКомпоновкиДанных";
//   metaObjects.DataCompositionParameterUse = "ИспользованиеПараметраКомпоновкиДанных";
//   metaObjects.DataCompositionPeriodAdditionType = "ТипДополненияПериодаКомпоновкиДанных";
//   metaObjects.DataCompositionPeriodType = "ТипПериодаКомпоновкиДанных";
//   metaObjects.DataCompositionPictureOutputType = "ТипВыводаКартинкиКомпоновкиДанных";
//   metaObjects.DataCompositionResourcesAutoPosition = "АвтоПозицияРесурсовКомпоновкиДанных";
//   metaObjects.DataCompositionResourcesPlacement = "РасположениеРесурсовКомпоновкиДанных";
//   metaObjects.DataCompositionResourcesPlacementInChart = "РасположениеРесурсовВДиаграммеКомпоновкиДанных";
//   metaObjects.DataCompositionResultItemType = "ТипЭлементаРезультатаКомпоновкиДанных";
//   metaObjects.DataCompositionResultNestedItemsLayout = "РасположениеВложенныхЭлементовРезультатаКомпоновкиДанных";
//   metaObjects.DataCompositionSettingsItemState = "СостояниеЭлементаНастройкиКомпоновкиДанных";
//   metaObjects.DataCompositionSettingsItemViewMode = "РежимОтображенияЭлементаНастройкиКомпоновкиДанных";
//   metaObjects.DataCompositionSettingsRefreshMethod = "СпособВосстановленияНастроекКомпоновкиДанных";
//   metaObjects.DataCompositionSettingsViewMode = "РежимОтображенияНастроекКомпоновкиДанных";
//   metaObjects.DataCompositionSortDirection = "НаправлениеСортировкиКомпоновкиДанных";
//   metaObjects.DataCompositionTextOutputType = "ТипВыводаТекстаКомпоновкиДанных";
//   metaObjects.DataCompositionTextPlacementType = "ТипРазмещенияТекстаКомпоновкиДанных";
//   metaObjects.DataCompositionTotalPlacement = "РасположениеИтоговКомпоновкиДанных";
//   metaObjects.OnUnavailabilityDataCompositionSettingsAction = "ДействиеПриНедоступностиНастроекКомпоновкиДанных";
//   metaObjects.ResultCompositionMode = "РежимКомпоновкиРезультата";
//   metaObjects.SaveDataCompositionAppearance = "СохранениеОформленияКомпоновкиДанных";
//   metaObjects.XSAttributeUseCategory = "КатегорияИспользованияАтрибутаXS";
//   metaObjects.XSComplexFinal = "ЗавершенностьСоставногоТипаXS";
//   metaObjects.XSComponentType = "ТипКомпонентыXS";
//   metaObjects.XSCompositor = "ВидГруппыМоделиXS";
//   metaObjects.XSConstraint = "ОграничениеЗначенияXS";
//   metaObjects.XSContentModel = "МодельСодержимогоXS";
//   metaObjects.XSDerivationMethod = "МетодНаследованияXS";
//   metaObjects.XSDisallowedSubstitutions = "НедопустимыеПодстановкиXS";
//   metaObjects.XSForm = "ФормаПредставленияXS";
//   metaObjects.XSIdentityConstraintCategory = "КатегорияОграниченияИдентичностиXS";
//   metaObjects.XSNamespaceConstraintCategory = "КатегорияОграниченияПространствИменXS";
//   metaObjects.XSProcessContents = "ОбработкаСодержимогоXS";
//   metaObjects.XSProhibitedSubstitutions = "ЗапрещенныеПодстановкиXS";
//   metaObjects.XSSchemaFinal = "ЗавершенностьСхемыXS";
//   metaObjects.XSSimpleFinal = "ЗавершенностьПростогоТипаXS";
//   metaObjects.XSSimpleTypeVariety = "ВариантПростогоТипаXS";
//   metaObjects.XSSubstitutionGroupExclusions = "ИсключенияГруппПодстановкиXS";
//   metaObjects.XSWhitespaceHandling = "ОбработкаПробельныхСимволовXS";
//   metaObjects.XSXPathVariety = "ВариантXPathXS";
//   metaObjects.EventLogDataStorageSplitPeriod = "ПериодРазделенияХраненияДанныхЖурналаРегистрации";
//   metaObjects.EventLogEntryTransactionMode = "РежимТранзакцииЗаписиЖурналаРегистрации";
//   metaObjects.EventLogEntryTransactionStatus = "СтатусТранзакцииЗаписиЖурналаРегистрации";
//   metaObjects.EventLogLevel = "УровеньЖурналаРегистрации";
//   metaObjects.DataLockControlMode = "РежимУправленияБлокировкойДанных";
//   metaObjects.DataLockMode = "РежимБлокировкиДанных";
//   metaObjects.AccountingRecordType = "ВидДвиженияБухгалтерии";
//   metaObjects.AccountType = "ВидСчета";
//   metaObjects.AccumulationRecordType = "ВидДвиженияНакопления";
//   metaObjects.AccumulationRegisterAggregatePeriodicity = "ПериодичностьАгрегатаРегистраНакопления";
//   metaObjects.AccumulationRegisterAggregateUse = "ИспользованиеАгрегатаРегистраНакопления";
//   metaObjects.AutoTimeMode = "РежимАвтоВремя";
//   metaObjects.BusinessProcessRoutePointType = "ВидТочкиМаршрутаБизнесПроцесса";
//   metaObjects.CalculationRegisterPeriodType = "ВидПериодаРегистраРасчета";
//   metaObjects.DocumentPostingMode = "РежимПроведенияДокумента";
//   metaObjects.DocumentWriteMode = "РежимЗаписиДокумента";
//   metaObjects.FoldersAndItemsUse = "ИспользованиеГруппИЭлементов";
//   metaObjects.PostingModeUse = "ИспользованиеРежимаПроведения";
//   metaObjects.SliceUse = "ИспользованиеСреза";
//   metaObjects.BackgroundJobState = "СостояниеФоновогоЗадания";
//   metaObjects.CryptoCertificateCheckMode = "РежимПроверкиСертификатаКриптографии";
//   metaObjects.CryptoCertificateIncludeMode = "РежимВключенияСертификатовКриптографии";
//   metaObjects.CryptoCertificateStorePlacement = "РасположениеХранилищаСертификатовКриптографии";
//   metaObjects.CryptoCertificateStoreType = "ТипХранилищаСертификатовКриптографии";
//   metaObjects.CryptoInteractiveModeUse = "ИспользованиеИнтерактивногоРежимаКриптографии";
//   metaObjects.FormattedDocumentFileType = "ТипФайлаФорматированногоДокумента";
//   metaObjects.FormattedDocumentParagraphType = "ТипПараграфаФорматированногоДокумента";
//   metaObjects.RowGotoDirection = "НаправлениеПереходаКСтроке";
//   metaObjects.InternetMailAttachmentEncodingMode = "СпособКодированияИнтернетПочтовогоВложения";
//   metaObjects.InternetMailMessageImportance = "ВажностьИнтернетПочтовогоСообщения";
//   metaObjects.InternetMailMessageNonASCIISymbolsEncodingMode = "СпособКодированияНеASCIIСимволовИнтернетПочтовогоСообщения";
//   metaObjects.InternetMailMessageParseStatus = "СтатусРазбораИнтернетПочтовогоСообщения";
//   metaObjects.InternetMailProtocol = "ПротоколИнтернетПочты";
//   metaObjects.InternetMailTextProcessing = "ОбработкаТекстаИнтернетПочтовогоСообщения";
//   metaObjects.InternetMailTextType = "ТипТекстаПочтовогоСообщения";
//   metaObjects.POP3AuthenticationMode = "СпособPOP3Аутентификации";
//   metaObjects.SMTPAuthenticationMode = "СпособSMTPАутентификации";
//   metaObjects.UseInternetMailTokenAuthentication = "ИспользованиеАутентификацииИнтернетПочтыПоТокену";
//   metaObjects.QueryBuilderDimensionType = "ТипИзмеренияПостроителяЗапроса";
//   metaObjects.AddInConnectionType = "ТипПодключенияВнешнейКомпоненты";
//   metaObjects.AddInType = "ТипВнешнейКомпоненты";
//   metaObjects.AllowedLength = "ДопустимаяДлина";
//   metaObjects.AllowedSign = "ДопустимыйЗнак";
//   metaObjects.ApplicationFormsOpenningMode = "РежимОткрытияФормПриложения";
//   metaObjects.BorderType = "ВидРамки";
//   metaObjects.BoundaryType = "ВидГраницы";
//   metaObjects.ByteOrderMarkUse = "ИспользованиеByteOrderMark";
//   metaObjects.ClientApplicationBaseFontVariant = "ВариантОсновногоШрифтаКлиентскогоПриложения";
//   metaObjects.ClientApplicationFormScaleVariant = "ВариантМасштабаФормКлиентскогоПриложения";
//   metaObjects.ClientApplicationInterfaceVariant = "ВариантИнтерфейсаКлиентскогоПриложения";
//   metaObjects.ClientApplicationType = "ТипКлиентскогоПриложения";
//   metaObjects.ClientConnectionSpeed = "СкоростьКлиентскогоСоединения";
//   metaObjects.ClientRunMode = "РежимЗапускаКлиентскогоПриложения";
//   metaObjects.ColorType = "ВидЦвета";
//   metaObjects.ComparisonType = "ВидСравнения";
//   metaObjects.CompositeWordsSeparationMode = "РежимРазделенияСоставныхСлов";
//   metaObjects.ConfigurationExtensionApplicationIssueSeverity = "ВажностьПроблемыПримененияРасширенияКонфигурации";
//   metaObjects.ConfigurationExtensionScope = "ОбластьДействияРасширенияКонфигурации";
//   metaObjects.ConfigurationExtensionsSource = "ИсточникРасширенийКонфигурации";
//   metaObjects.DataBaseConfigurationUpdateExecutionInformationItemType = "ТипЭлементаИнформацииОВыполненииОбновленияКонфигурацииБазыДанных";
//   metaObjects.DataBaseConfigurationUpdateState = "СостояниеОбновленияКонфигурацииБазыДанных";
//   metaObjects.DatabaseTablespacesUseMode = "РежимИспользованияТабличныхПространствБазыДанных";
//   metaObjects.DateFractions = "ЧастиДаты";
//   metaObjects.DialogReturnCode = "КодВозвратаДиалога";
//   metaObjects.DynamicListKeyType = "ВидКлючаДинамическогоСписка";
//   metaObjects.EnterKeyBehaviorType = "ТипПоведенияКлавишиEnter";
//   metaObjects.ExternalDataSourceState = "СостояниеВнешнегоИсточникаДанных";
//   metaObjects.FillChecking = "ПроверкаЗаполнения";
//   metaObjects.FontType = "ВидШрифта";
//   metaObjects.FullTextSearchMetadataUse = "ИспользованиеМетаданныхПолнотекстовогоПоиска";
//   metaObjects.FullTextSearchMode = "РежимПолнотекстовогоПоиска";
//   metaObjects.FullTextSearchRepresentationType = "ВидОтображенияПолнотекстовогоПоиска";
//   metaObjects.FullTextSearchVersion = "ВерсияПолнотекстовогоПоиска";
//   metaObjects.HashFunction = "ХешФункция";
//   metaObjects.InterfaceCompatibilityMode = "РежимСовместимостиИнтерфейса";
//   metaObjects.IntervalBoundVariant = "ВариантГраницыИнтервала";
//   metaObjects.Key = "Клавиша";
//   metaObjects.LocationRelativeToGeofence = "ПоложениеОтносительноГеозоны";
//   metaObjects.MessageStatus = "СтатусСообщения";
//   metaObjects.MobileApplicationFunctionalities = "ФункциональностьМобильногоПриложения";
//   metaObjects.NumericValueType = "ВидЧисловогоЗначения";
//   metaObjects.PasswordPolicyComplianceCheckResult = "РезультатПроверкиСоответствияПароляПолитике";
//   metaObjects.PeriodSettingsVariant = "ВариантНастройкиПериода";
//   metaObjects.PeriodVariant = "ВариантПериода";
//   metaObjects.PictureType = "ВидКартинки";
//   metaObjects.PlatformType = "ТипПлатформы";
//   metaObjects.PredefinedDataUpdate = "ОбновлениеПредопределенныхДанных";
//   metaObjects.QuestionDialogMode = "РежимДиалогаВопрос";
//   metaObjects.ReplacementMode = "РежимЗамещения";
//   metaObjects.RoundMode = "РежимОкругления";
//   metaObjects.SearchDirection = "НаправлениеПоиска";
//   metaObjects.SectionsPanelRepresentation = "ОтображениеПанелиРазделов";
//   metaObjects.SortDirection = "НаправлениеСортировки";
//   metaObjects.StandardBeginningDateVariant = "ВариантСтандартнойДатыНачала";
//   metaObjects.StandardGlobalSearchType = "СтандартныйВидГлобальногоПоиска";
//   metaObjects.StandardPeriodVariant = "ВариантСтандартногоПериода";
//   metaObjects.StringEncodingMethod = "СпособКодированияСтроки";
//   metaObjects.TextEncoding = "КодировкаТекста";
//   metaObjects.TransactionsIsolationLevel = "УровеньИзоляцииТранзакций";
//   metaObjects.UpdateOnDataChange = "ОбновлениеПриИзмененииДанных";
//   metaObjects.UserPasswordHashAlgorithmType = "ТипАлгоритмаХешированияПаролейПользователей";
//   metaObjects.UUIDVersion = "ВерсияУникальногоИдентификатора";
//   metaObjects.WorkingDateMode = "РежимРабочейДаты";
//   metaObjects.XBaseEncoding = "КодировкаXBase";
//   metaObjects.CalendarEventRecurrence = "ПовторениеСобытияКалендаря";
//   metaObjects.ContactDataAddressType = "ТипАдресаДанныхКонтакта";
//   metaObjects.ContactDataEmailAddressType = "ТипАдресаЭлектроннойПочтыДанныхКонтакта";
//   metaObjects.ContactDataInstantMessagingAddressType = "ТипАдресаМгновенныхСообщенийДанныхКонтакта";
//   metaObjects.ContactDataPhoneNumberType = "ТипНомераТелефонаДанныхКонтакта";
//   metaObjects.ContactDataRelationshipType = "ТипОтношенийДанныхКонтакта";
//   metaObjects.ContactDataURLType = "ТипВебАдресаДанныхКонтакта";
//   metaObjects.CallLogCallType = "ТипЗвонкаЖурналаЗвонков";
//   metaObjects.TelephonyToolsCallEventVariant = "ВариантСобытияЗвонкаСредствТелефонии";
//   metaObjects.TelephonyToolsCallType = "ТипЗвонкаСредствТелефонии";
//   metaObjects.TelephonyToolsSMSType = "ТипSMSСредствТелефонии";
//   metaObjects.AudioRecordingChannelUse = "ИспользованиеКаналовАудиозаписи";
//   metaObjects.AudioRecordingFormat = "ФорматАудиозаписи";
//   metaObjects.BarcodeType = "ТипШтрихКода";
//   metaObjects.CameraLightingType = "ТипПодсветкиКамеры";
//   metaObjects.DeviceCameraType = "ТипКамерыУстройства";
//   metaObjects.DocumentScanningCheckingQuality = "ПроверкаКачестваСканированияДокументов";
//   metaObjects.DocumentScanningOrientationDetectionMode = "РежимОпределенияОриентацииСканированияДокументов";
//   metaObjects.DocumentScanningProcessingFilter = "ФильтрОбработкиСканированияДокументов";
//   metaObjects.MultimediaRecordingStopButtonPlacement = "РасположениеКнопкиОстановкиЗаписиМультимедиа";
//   metaObjects.VideoQuality = "КачествоВидеозаписи";
//   metaObjects.QuerySchemaAvailableTableParameterType = "ТипПараметраДоступнойТаблицыСхемыЗапроса";
//   metaObjects.QuerySchemaJoinType = "ТипСоединенияСхемыЗапроса";
//   metaObjects.QuerySchemaOrderDirection = "НаправлениеПорядкаСхемыЗапроса";
//   metaObjects.QuerySchemaPeriodAdditionType = "ТипДополненияПериодамиСхемыЗапроса";
//   metaObjects.QuerySchemaTotalCalculationFieldType = "ТипКонтрольнойТочкиСхемыЗапроса";
//   metaObjects.QuerySchemaUnionType = "ТипОбъединенияСхемыЗапроса";
//   metaObjects.NewPlannerItemsTextType = "ТипТекстаНовыхЭлементовПланировщика";
//   metaObjects.PlannerCommandSource = "ИсточникКомандПоляПланировщика";
//   metaObjects.PlannerInsideDragAction = "ДействиеПеретаскиванияВнутриПланировщика";
//   metaObjects.PlannerInsideDragBoundaryChangeVariant = "ВариантИзмененияГраницПеретаскиванияВнутриПланировщика";
//   metaObjects.PlannerItemActionLocation = "ПоложениеДействияЭлементаПланировщика";
//   metaObjects.PlannerItemEnableEditMode = "РежимРазрешенияРедактированияЭлементаПланировщика";
//   metaObjects.PlannerItemsBehaviorOnLackOfSpace = "ПоведениеЭлементовПланировщикаПриНедостаткеМеста";
//   metaObjects.PlannerItemsTimeRepresentation = "ОтображениеВремениЭлементовПланировщика";
//   metaObjects.PlannerStandardCommand = "СтандартнаяКомандаПоляПланировщика";
//   metaObjects.JSONCharactersEscapeMode = "ЭкранированиеСимволовJSON";
//   metaObjects.JSONDateFormat = "ФорматДатыJSON";
//   metaObjects.JSONDateWritingVariant = "ВариантЗаписиДатыJSON";
//   metaObjects.JSONLineBreak = "ПереносСтрокJSON";
//   metaObjects.JSONValueType = "ТипЗначенияJSON";
//   metaObjects.DeliverableNotificationSendErrorType = "ТипОшибкиОтправкиДоставляемогоУведомления";
//   metaObjects.DeliverableNotificationSubscriberType = "ТипПодписчикаДоставляемыхУведомлений";
//   metaObjects.SoundAlert = "ЗвуковоеОповещение";
//   metaObjects.InAppPurchaseService = "СервисВстроенныхПокупок";
//   metaObjects.InAppPurchaseType = "ТипВстроеннойПокупки";
//   metaObjects.FTPSecureConnectionUsageLevel = "УровеньИспользованияЗащищенногоСоединенияFTP";
//   metaObjects.InternetConnectionType = "ТипИнтернетСоединения";
//   metaObjects.MacOSCertificateSelectMode = "СпособВыбораСертификатаMacOS";
//   metaObjects.OSCertificateSelectMode = "СпособВыбораСертификатаОС";
//   metaObjects.RoamingUsage = "ИспользованиеРоуминга";
//   metaObjects.ServerTLSCertificateRevocationCheckMode = "РежимПроверкиОтзываTLSСертификатаСервера";
//   metaObjects.WindowsCertificateSelectMode = "СпособВыбораСертификатаWindows";
//   metaObjects.ByteOrder = "ПорядокБайтов";
//   metaObjects.PositionInStream = "ПозицияВПотоке";
//   metaObjects.AdBannerRepresentation = "ОтображениеРекламногоБаннера";
//   metaObjects.AdStatus = "СтатусРекламы";
//   metaObjects.DataLineChangeType = "ВидИзмененияСтрокиДанных";
//   metaObjects.RepresentableDocumentBatchFileType = "ТипФайлаПакетаОтображаемыхДокументов";
//   metaObjects.ClientApplicationAgentState = "СостояниеАгентаКлиентскогоПриложения";
//   metaObjects.DatabaseCopiesStandardReplicationVersion = "ВерсияСтандартнойРепликацииКопийБазыДанных";
//   metaObjects.DatabaseCopiesUse = "ИспользованиеКопийБазыДанных";
//   metaObjects.DatabaseCopyContentItemFieldUse = "ИспользованиеПоляЭлементаСоставаКопииБазыДанных";
//   metaObjects.DatabaseCopyDBMSType = "ТипСУБДКопииБазыДанных";
//   metaObjects.DatabaseCopyReplicationType = "ТипРепликацииКопииБазыДанных";
//   metaObjects.DatabaseCopyState = "СостояниеКопииБазыДанных";
//   metaObjects.DatabaseCopyTurnedOffReason = "ПричинаОтключенияКопииБазыДанных";
//   metaObjects.DatabaseCopyUpdateState = "СостояниеОбновленияКопииБазыДанных";
//   metaObjects.DataCompositionDatabaseCopyOutputType = "ТипВыводаКопииБазыДанныхКомпоновкиДанных";
//   metaObjects.DataCompositionDataRelevanceOutputType = "ТипВыводаАктуальностиДанныхКомпоновкиДанных";
//   metaObjects.RequiredDataRelevance = "ТребуемаяАктуальностьДанных";
//   metaObjects.CollaborationSystemCommandSource = "ИсточникКомандСистемыВзаимодействия";
//   metaObjects.CollaborationSystemDataDumpStatus = "СтатусВыгрузкиДанныхСистемыВзаимодействия";
//   metaObjects.CollaborationSystemFromDataDumpRestoreStatus = "СтатусВосстановленияИзВыгрузкиДанныхСистемыВзаимодействия";
//   metaObjects.CollaborationSystemMessageButtonPanelButtonAction = "ДействиеКнопкиПанелиКнопокСообщенияСистемыВзаимодействия";
//   metaObjects.CollaborationSystemMessageButtonPanelButtonType = "ВидКнопкиПанелиКнопокСообщенияСистемыВзаимодействия";
//   metaObjects.CollaborationSystemNotificationRepresentation = "ОтображениеОповещенийСистемыВзаимодействия";
//   metaObjects.CollaborationSystemStandardCommand = "СтандартнаяКомандаСистемыВзаимодействия";
//   metaObjects.CollaborationSystemUsersChoicePurpose = "НазначениеВыбораПользователейСистемыВзаимодействия";
//   metaObjects.AdministrationActionOnResourceConsumptionLimitExcess = "АдминистрированиеДействиеПриПревышенииОграниченияПотребленияРесурсов";
//   metaObjects.AdministrationAssignmentRuleType = "АдминистрированиеТипТребованияНазначения";
//   metaObjects.AdministrationConnectionSecurityLevel = "АдминистрированиеУровеньБезопасностиСоединений";
//   metaObjects.AdministrationInfoBaseDeletionMode = "АдминистрированиеРежимУдаленияИнформационнойБазы";
//   metaObjects.AdministrationProcessChoicePriority = "АдминистрированиеПриоритетВыбораПроцесса";
//   metaObjects.AdministrationResourceConsumptionCounterFilterType = "АдминистрированиеТипОтбораСчетчикаПотребленияРесурсов";
//   metaObjects.AdministrationResourceConsumptionCounterGroupType = "АдминистрированиеТипГруппировкиСчетчикаПотребленияРесурсов";
//   metaObjects.AdministrationWorkProcessStatus = "АдминистрированиеСостояниеРабочегоПроцесса";
//   metaObjects.PivotTableColumnTotalPosition = "ПоложениеИтоговКолонокСводнойТаблицы";
//   metaObjects.PivotTableLinesShowType = "ТипОтображенияЛинийСводнойТаблицы";
//   metaObjects.PivotTableRowTotalPosition = "ПоложениеИтоговСтрокСводнойТаблицы";
//   metaObjects.DuplexPrintingType = "ТипДвустороннейПечати";
//   metaObjects.PageOrientation = "ОриентацияСтраницы";
//   metaObjects.PagePlacementAlternation = "ЧередованиеРасположенияСтраниц";
//   metaObjects.PrintAccuracy = "ТочностьПечати";
//   metaObjects.SpreadsheetDocumentAreaFillType = "ТипЗаполненияОбластиТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentCellAreaType = "ТипОбластиЯчеекТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentCellLineType = "ТипЛинииЯчейкиТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentDetailUse = "ИспользованиеРасшифровкиТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentDrawingLineType = "ТипЛинииРисункаТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentDrawingType = "ТипРисункаТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentFileType = "ТипФайлаТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentGroupHeaderPlacement = "РасположениеЗаголовкаГруппировкиТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentPatternType = "ТипУзораТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentPointerType = "ТипКурсоровТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentSavedPicturesDensity = "ПлотностьСохраняемыхКартинокТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentSelectionShowModeType = "ТипОтображенияВыделенияТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentShiftType = "ТипСмещенияТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentStepDirectionType = "ТипНаправленияПереходаТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentTextPlacementType = "ТипРазмещенияТекстаТабличногоДокумента";
//   metaObjects.SpreadsheetDocumentValuesReadingMode = "СпособЧтенияЗначенийТабличногоДокумента";
//   metaObjects.TextPositionRelativeToPicture = "ПоложениеТекстаОтносительноКартинки";
//   metaObjects.UseSpreadsheetDocumentWidthReduction = "ИспользованиеШириныСжатияТабличногоДокумента";
//   metaObjects.QueryRecordType = "ТипЗаписиЗапроса";
//   metaObjects.QueryResultIteration = "ОбходРезультатаЗапроса";
//   metaObjects.ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod = "СпособПолученияКомпонентСвязностиРасчетаСистемЛинейныхУравнений";
//   metaObjects.AdditionalUserVerificationMethod = "СпособДополнительнойПроверкиПользователя";
//   metaObjects.BiometricVerificationMethod = "СпособБиометрическойПроверки";
//   metaObjects.SecureStorageAccessProtectionMethod = "СпособЗащитыДоступаБезопасногоХранилища";
//   metaObjects.ActionOnThePasswordRequirementsViolationOnAuthentication = "ДействиеПриНесоответствииПароляТребованиямПриАутентификации";
//   metaObjects.EmailAuthenticationMethod = "СпособАутентификацииЧерезЭлектроннуюПочту";
//   metaObjects.InfoBaseUserAuthenticationMethod = "СпособАутентификацииПользователяИнформационнойБазы";
//   metaObjects.SecondAuthenticationFactorSettingsProcessingType = "ТипОбработкиНастроекВторогоФактораАутентификации";
//   metaObjects.ErrorCategory = "КатегорияОшибки";
//   metaObjects.ErrorMessageDisplayVariant = "ВариантОтображенияСообщенияОбОшибке";
//   metaObjects.ErrorReportingMode = "РежимОтправкиИнформацииОбОшибке";
//   metaObjects.MobileClientSignatureVerificationMethod = "СпособПроверкиПодписиМобильногоКлиента";
//   metaObjects.OnMainServerUnavalableBehavior = "ПоведениеПриНедоступностиОсновногоСервера";
//   metaObjects.UsedServer = "ИспользуемыйСервер";
//   metaObjects.PDFAttachmentRelationshipType = "ТипСвязиВложенияPDF";
//   metaObjects.PDFDocumentFileType = "ТипФайлаДокументаPDF";
//   metaObjects.PDFModificationAccessPermissions = "РазрешенияДоступаИзмененияPDF";
//   metaObjects.PDFSignatureType = "ТипПодписиPDF";
//   metaObjects.ProgressiveWebApplicationMode = "РежимПрогрессивногоВебПриложения";
//   metaObjects.AdditionalShowMode = "ДополнительныйРежимОтображения";
//   metaObjects.AppearanceAreaType = "ТипОбластиОформления";
//   metaObjects.ArrowStyle = "СтильСтрелки";
//   metaObjects.AutoCapitalizationOnTextInput = "АвтоИзменениеРегистраПриВводеТекста";
//   metaObjects.AutoCorrectionOnTextInput = "АвтоИсправлениеПриВводеТекста";
//   metaObjects.AutonumerationInForm = "АвтонумерацияВФорме";
//   metaObjects.AutoSaveFormDataInSettings = "АвтоматическоеСохранениеДанныхФормыВНастройках";
//   metaObjects.AutoShowClearButtonMode = "РежимАвтоОтображенияКнопкиОчистки";
//   metaObjects.AutoShowOpenButtonMode = "РежимАвтоОтображенияКнопкиОткрытия";
//   metaObjects.AutoShowStateMode = "РежимАвтоОтображенияСостояния";
//   metaObjects.ButtonGroupRepresentation = "ОтображениеГруппыКнопок";
//   metaObjects.ButtonLocationInCommandBar = "ПоложениеКнопкиВКоманднойПанели";
//   metaObjects.ButtonPictureLocation = "ПоложениеКартинкиКнопки";
//   metaObjects.ButtonRepresentation = "ОтображениеКнопки";
//   metaObjects.ButtonShape = "ФигураКнопки";
//   metaObjects.ButtonShapeRepresentation = "ОтображениеФигурыКнопки";
//   metaObjects.AutoSeriesSeparation = "АвтоРаздвижениеСерий";
//   metaObjects.BarChartPointsOrder = "ПорядокОтображенияТочекГоризонтальнойГистограммы";
//   metaObjects.BubbleChartNegativeValuesShowMode = "ОтображениеОтрицательныхЗначенийПузырьковойДиаграммы";
//   metaObjects.ChartAnimation = "АнимацияДиаграммы";
//   metaObjects.ChartBoundaryDetectionMethod = "СпособОпределенияОграничивающегоЗначенияДиаграммы";
//   metaObjects.ChartBubbleSizeValueSource = "ИсточникЗначенияРазмераПузырькаДиаграммы";
//   metaObjects.ChartBubbleSizing = "ВлияниеРазмераНаПузырекДиаграммы";
//   metaObjects.ChartColorPalette = "ПалитраЦветовДиаграммы";
//   metaObjects.ChartGridLinesShowMode = "ОтображениеЛинийСеткиДиаграммы";
//   metaObjects.ChartLabelLocation = "ПоложениеПодписейКДиаграмме";
//   metaObjects.ChartLabelsOrientation = "ОриентацияПодписейДиаграммы";
//   metaObjects.ChartLabelType = "ВидПодписейКДиаграмме";
//   metaObjects.ChartLegendPlacement = "РасположениеЛегендыДиаграммы";
//   metaObjects.ChartLineType = "ТипЛинииДиаграммы";
//   metaObjects.ChartMarkerType = "ТипМаркераДиаграммы";
//   metaObjects.ChartOrientation = "ОриентацияДиаграммы";
//   metaObjects.ChartPlotAreaPlacement = "РасположениеОбластиПостроенияДиаграммы";
//   metaObjects.ChartPointsAxisValuesSource = "ИсточникЗначенийОсиТочекДиаграммы";
//   metaObjects.ChartPointsConnectionType = "ТипСоединенияТочекДиаграммы";
//   metaObjects.ChartReferenceBandBorderPosition = "ПоложениеГраницыИнформационногоИнтервалаДиаграммы";
//   metaObjects.ChartReferenceLinePosition = "ПоложениеИнформационнойЛинииДиаграммы";
//   metaObjects.ChartScaleLabelLocation = "ПоложениеПодписейШкалыДиаграммы";
//   metaObjects.ChartScaleLocation = "ПоложениеШкалыДиаграммы";
//   metaObjects.ChartScaleMarkLocation = "ПоложениеОтметокШкалыДиаграммы";
//   metaObjects.ChartScaleTitlePlacement = "РасположениеЗаголовкаШкалыДиаграммы";
//   metaObjects.ChartScaleTitleTextSource = "СпособЗаполненияТекстаЗаголовкаШкалыДиаграммы";
//   metaObjects.ChartSelectionMode = "РежимВыделенияДиаграммы";
//   metaObjects.ChartSemitransparencyMode = "РежимПолупрозрачностиДиаграммы";
//   metaObjects.ChartSeriesGraphicalRepresentationType = "ТипГрафическогоПредставленияСерииДиаграммы";
//   metaObjects.ChartSeriesOrderInLegend = "ПорядокСерийВЛегендеДиаграммы";
//   metaObjects.ChartSeriesStackType = "ТипНакопленияСерииДиаграммы";
//   metaObjects.ChartSpaceMode = "РежимПробеловДиаграммы";
//   metaObjects.ChartSplineMode = "РежимСглаживанияДиаграммы";
//   metaObjects.ChartTitleAreaPlacement = "РасположениеОбластиЗаголовкаДиаграммы";
//   metaObjects.ChartTrendlineApproximationType = "ТипАппроксимацииЛинииТрендаДиаграммы";
//   metaObjects.ChartTrendlineFactor = "ФакторЛинииТрендаДиаграммы";
//   metaObjects.ChartType = "ТипДиаграммы";
//   metaObjects.ChartValueEditState = "СостояниеРедактированияЗначенияДиаграммы";
//   metaObjects.ChartValuesBySeriesConnectionType = "ТипСоединенияЗначенийПоСериямДиаграммы";
//   metaObjects.ChartValuesEditMode = "РежимРедактированияЗначенийДиаграммы";
//   metaObjects.ChartValuesToolTipFillType = "ЗаполнениеПодсказкиЗначенийДиаграммы";
//   metaObjects.ChartValuesToolTipShowMode = "ОтображениеПодсказкиЗначенийДиаграммы";
//   metaObjects.GaugeChartValueRepresentation = "ОтображениеЗначенияИзмерительнойДиаграммы";
//   metaObjects.GaugeChartValuesScaleLabelsLocation = "ПоложениеПодписейШкалыЗначенийИзмерительнойДиаграммы";
//   metaObjects.MaxSeries = "МаксимумСерий";
//   metaObjects.NonnumericChartValueUse = "ИспользованиеНечисловыхЗначенийДиаграммы";
//   metaObjects.PointsConnectionAcrossSkippedChartValuesType = "ТипСоединенияТочекПриПропущенныхЗначенияхДиаграммы";
//   metaObjects.RadarChartScaleType = "ТипШкалыРадарнойДиаграммы";
//   metaObjects.ShowChartPopupReferenceLine = "ОтображатьВсплывающуюИнформационнуюЛиниюДиаграммы";
//   metaObjects.ShowChartScaleTitle = "ОтображениеЗаголовкаШкалыДиаграммы";
//   metaObjects.ShowInChart = "ОтображениеВДиаграмме";
//   metaObjects.ShowInChartLegend = "ОтображениеВЛегендеДиаграммы";
//   metaObjects.StockChartUsedPointValue = "ИспользуемоеЗначениеТочкиБиржевойДиаграммы";
//   metaObjects.UsedChartValuesAxis = "ИспользуемаяОсьЗначенийДиаграммы";
//   metaObjects.GanttChartIntervalRepresentation = "ОтображениеИнтервалаДиаграммыГанта";
//   metaObjects.GanttChartIntervalsSelectionMode = "РежимВыделенияИнтерваловДиаграммыГанта";
//   metaObjects.GanttChartIntervalTextRepresentation = "ОтображениеТекстаИнтервалаДиаграммыГанта";
//   metaObjects.GanttChartLinkType = "ТипСвязиДиаграммыГанта";
//   metaObjects.GanttChartScaleKeeping = "ПоддержкаМасштабаДиаграммыГанта";
//   metaObjects.GanttChartTableLocation = "ПоложениеТаблицыДиаграммыГанта";
//   metaObjects.GanttChartTextPlacementType = "ТипРазмещенияТекстаДиаграммыГанта";
//   metaObjects.GanttChartValuesSelectionMode = "РежимВыделенияЗначенийДиаграммыГанта";
//   metaObjects.GanttChartValueTextRepresentation = "ОтображениеТекстаЗначенияДиаграммыГанта";
//   metaObjects.GanttChartVerticalStretch = "РастягиваниеПоВертикалиДиаграммыГанта";
//   metaObjects.ShowInGanttChart = "ОтображениеВДиаграммеГанта";
//   metaObjects.TimeScaleDayFormat = "ФорматДняШкалыВремени";
//   metaObjects.TimeScaleUnitType = "ТипЕдиницыШкалыВремени";
//   metaObjects.PivotChartLabelsOrientation = "ОриентацияМетокСводнойДиаграммы";
//   metaObjects.PivotChartScaleKeeping = "ПоддержкаМасштабаСводнойДиаграммы";
//   metaObjects.PivotChartType = "ТипСводнойДиаграммы";
//   metaObjects.PivotChartValuesShowMode = "ОтображениеЗначенийСводнойДиаграммы";
//   metaObjects.DendrogramOrientation = "ОриентацияДендрограммы";
//   metaObjects.DendrogramScaleKeeping = "ПоддержкаМасштабаДендрограммы";
//   metaObjects.GeographicalSchemaDataSourceOrganizationType = "ТипОрганизацииИсточникаДанныхГеографическойСхемы";
//   metaObjects.GeographicalSchemaLayerSeriesImportModeType = "ТипИмпортаСерийСлояГеографическойСхемы";
//   metaObjects.GeographicalSchemaLayerSeriesShowMode = "ТипОтображенияСерииСлояГеографическойСхемы";
//   metaObjects.GeographicalSchemaLegendItemShowScaleType = "ТипОтображенияШкалыЭлементаЛегендыГеографическойСхемы";
//   metaObjects.GeographicalSchemaLineType = "ТипЛинииГеографическойСхемы";
//   metaObjects.GeographicalSchemaMarkerType = "ТипМаркераГеографическойСхемы";
//   metaObjects.GeographicalSchemaObjectFindType = "ТипПоискаОбъектовГеографическойСхемы";
//   metaObjects.GeographicalSchemaPointObjectDrawingType = "ТипОтображенияТочечногоОбъектаГеографическойСхемы";
//   metaObjects.GeographicalSchemaProjection = "ТипПроекцииГеографическойСхемы";
//   metaObjects.GeographicalSchemaShowMode = "РежимОтображенияГеографическойСхемы";
//   metaObjects.PaintingReferencePointPosition = "ПоложениеОпорнойТочкиОтрисовки";
//   metaObjects.SeriesValuesDrawingMode = "РежимОтображенияЗначенийСерии";
//   metaObjects.CheckBoxType = "ВидФлажка";
//   metaObjects.ChildFormItemsGroup = "ГруппировкаПодчиненныхЭлементовФормы";
//   metaObjects.ChildFormItemsWidth = "ШиринаПодчиненныхЭлементовФормы";
//   metaObjects.ChoiceButtonRepresentation = "ОтображениеКнопкиВыбора";
//   metaObjects.ChoiceHistoryOnInput = "ИсторияВыбораПриВводе";
//   metaObjects.ClipboardDataStandardFormat = "СтандартныйФорматДанныхБуфераОбмена";
//   metaObjects.CollapseFormItemsByImportance = "СворачиваниеЭлементовФормыПоВажности";
//   metaObjects.ColorDepth = "ГлубинаЦвета";
//   metaObjects.ColumnEditMode = "РежимРедактированияКолонки";
//   metaObjects.ColumnLocation = "ПоложениеКолонки";
//   metaObjects.ColumnsGroup = "ГруппировкаКолонок";
//   metaObjects.ColumnSizeChange = "ИзменениеРазмераКолонки";
//   metaObjects.CommandBarButtonAlignment = "ВыравниваниеКнопокКоманднойПанели";
//   metaObjects.CommandBarButtonOrder = "ПорядокКнопокКоманднойПанели";
//   metaObjects.CommandBarButtonRepresentation = "ОтображениеКнопкиКоманднойПанели";
//   metaObjects.CommandBarButtonType = "ТипКнопкиКоманднойПанели";
//   metaObjects.CommandGroupCategory = "КатегорияГруппыКоманд";
//   metaObjects.CommandParameterUseMode = "РежимИспользованияПараметраКоманды";
//   metaObjects.ConnectorLineType = "ТипСоединительнойЛинии";
//   metaObjects.ConnectorTextLocation = "ПоложениеТекстаСоединительнойЛинии";
//   metaObjects.ControlBorderType = "ТипРамкиЭлементаУправления";
//   metaObjects.ControlCollapseMode = "РежимСверткиЭлементаУправления";
//   metaObjects.ControlEdge = "ГраницаЭлементаУправления";
//   metaObjects.CurrentRowUse = "ИспользованиеТекущейСтроки";
//   metaObjects.DataChangeType = "ВидИзмененияДанных";
//   metaObjects.DateSelectionMode = "РежимВыделенияДаты";
//   metaObjects.DimensionAttributePlacementType = "ТипРазмещенияРеквизитовИзмерений";
//   metaObjects.DimensionPlacementType = "ТипРазмещенияИзмерений";
//   metaObjects.DisplayImportance = "ВажностьПриОтображении";
//   metaObjects.DragAction = "ДействиеПеретаскивания";
//   metaObjects.DragAllowedActions = "ДопустимыеДействияПеретаскивания";
//   metaObjects.DrawingSelectionShowMode = "РежимОтображенияВыделенияРисунков";
//   metaObjects.EditTextUpdate = "ОбновлениеТекстаРедактирования";
//   metaObjects.FitPageMode = "РежимРазмещенияНаСтранице";
//   metaObjects.FixingInTable = "ФиксацияВТаблице";
//   metaObjects.FoldersAndItems = "ГруппыИЭлементы";
//   metaObjects.FormButtonPictureLocation = "ПоложениеКартинкиКнопкиФормы";
//   metaObjects.FormButtonType = "ВидКнопкиФормы";
//   metaObjects.FormCommandBarLabelLocation = "ПоложениеКоманднойПанелиФормы";
//   metaObjects.FormConversationsRepresentation = "ОтображениеОбсужденийФормы";
//   metaObjects.FormDecorationType = "ВидДекорацииФормы";
//   metaObjects.FormFieldType = "ВидПоляФормы";
//   metaObjects.FormGroupType = "ВидГруппыФормы";
//   metaObjects.FormItemAdditionType = "ВидДополненияЭлементаФормы";
//   metaObjects.FormItemCommandBarLabelLocation = "ПоложениеКоманднойПанелиЭлементаФормы";
//   metaObjects.FormItemOrientation = "ОриентацияЭлементаФормы";
//   metaObjects.FormItemSpacing = "ИнтервалМеждуЭлементамиФормы";
//   metaObjects.FormItemTitleLocation = "ПоложениеЗаголовкаЭлементаФормы";
//   metaObjects.FormPagesRepresentation = "ОтображениеСтраницФормы";
//   metaObjects.FormPagesState = "СостояниеСтраницФормы";
//   metaObjects.FormStandardURLVariant = "ВариантСтандартнойНавигационнойСсылкиФормы";
//   metaObjects.FormWindowOpeningMode = "РежимОткрытияОкнаФормы";
//   metaObjects.GraphicalSchemaGridDrawMode = "РежимОтрисовкиСеткиГрафическойСхемы";
//   metaObjects.GraphicalSchemaItemPictureLocation = "ПоложениеКартинкиЭлементаГрафическойСхемы";
//   metaObjects.GraphicalSchemaShapes = "ФигурыГрафическойСхемы";
//   metaObjects.GraphicalSchemeElementSideType = "ТипСтороныЭлементаГрафическойСхемы";
//   metaObjects.HorizontalAlign = "ГоризонтальноеПоложение";
//   metaObjects.HTMLDocumentFieldMode = "РежимПоляHTMLДокумента";
//   metaObjects.IncompleteChoiceMode = "РежимВыбораНезаполненного";
//   metaObjects.InitialListView = "НачальноеОтображениеСписка";
//   metaObjects.InitialTreeView = "НачальноеОтображениеДерева";
//   metaObjects.InputFieldAutofillHint = "ПодсказкаАвтозаполненияПоляВвода";
//   metaObjects.InputFieldCommandSource = "ИсточникКомандПоляВвода";
//   metaObjects.InputFieldMultipleValuePictureShape = "ФигураКартинкиМножественногоЗначенияПоляВвода";
//   metaObjects.InputFieldMultipleValuePictureSize = "РазмерКартинкиМножественногоЗначенияПоляВвода";
//   metaObjects.InputFieldStandardCommand = "СтандартнаяКомандаПоляВвода";
//   metaObjects.ItemHeightControlVariant = "ВариантУправленияВысотойЭлемента";
//   metaObjects.ItemHorizontalLocation = "ГоризонтальноеПоложениеЭлемента";
//   metaObjects.ItemsAndTitlesAlignVariant = "ВариантВыравниванияЭлементовИЗаголовков";
//   metaObjects.ItemVerticalAlign = "ВертикальноеПоложениеЭлемента";
//   metaObjects.LabelPictureLocation = "ПоложениеКартинкиНадписи";
//   metaObjects.LinkedValueChangeMode = "РежимИзмененияСвязанногоЗначения";
//   metaObjects.ListEditMode = "СпособРедактированияСписка";
//   metaObjects.MainClientApplicationWindowMode = "РежимОсновногоОкнаКлиентскогоПриложения";
//   metaObjects.NewRowShowCheckVariant = "ВариантПроверкиОтображенияНовойСтроки";
//   metaObjects.OnScreenKeyboardReturnKeyText = "ТекстКнопкиВводаЭкраннойКлавиатуры";
//   metaObjects.Orientation = "Ориентация";
//   metaObjects.PanelPictureLocation = "ПоложениеКартинкиПанели";
//   metaObjects.PictureFormat = "ФорматКартинки";
//   metaObjects.PictureSize = "РазмерКартинки";
//   metaObjects.PrintDialogUseMode = "РежимИспользованияДиалогаПечати";
//   metaObjects.ProgressBarSmoothingMode = "РежимСглаживанияИндикатора";
//   metaObjects.RadioButtonType = "ВидПереключателя";
//   metaObjects.RefreshRequestMethod = "СпособЗапросаОбновления";
//   metaObjects.ReportFormType = "ТипФормыОтчета";
//   metaObjects.ReportResultViewMode = "РежимОтображенияРезультатаОтчета";
//   metaObjects.SaveFormDataInSettings = "СохранениеДанныхФормыВНастройках";
//   metaObjects.ScrollBarUse = "ИспользованиеПолосыПрокрутки";
//   metaObjects.ScrollingTextMode = "РежимБегущейСтроки";
//   metaObjects.SearchControlLocation = "ПоложениеУправленияПоиском";
//   metaObjects.SearchInTableOnInput = "ПоискВТаблицеПриВводе";
//   metaObjects.SearchStringLocation = "ПоложениеСтрокиПоиска";
//   metaObjects.SelectionShowMode = "РежимОтображенияВыделения";
//   metaObjects.ShowTabs = "ОтображениеЗакладок";
//   metaObjects.SizeChangeMode = "РежимИзмененияРазмера";
//   metaObjects.SpecialTextInputMode = "СпециальныйРежимВводаТекста";
//   metaObjects.SpellCheckingOnTextInput = "ПроверкаПравописанияПриВводеТекста";
//   metaObjects.StandardAppearance = "СтандартноеОформление";
//   metaObjects.StandardCommandsGroup = "СтандартнаяГруппаКоманд";
//   metaObjects.TableBehaviorOnHorizontalCompression = "ПоведениеТаблицыПриСжатииПоГоризонтали";
//   metaObjects.TableBoxRowInputMode = "РежимВводаСтрокТабличногоПоля";
//   metaObjects.TableBoxRowSelectionMode = "РежимВыделенияСтрокиТабличногоПоля";
//   metaObjects.TableBoxSelectionMode = "РежимВыделенияТабличногоПоля";
//   metaObjects.TableCurrentRowUse = "ИспользованиеТекущейСтрокиТаблицы";
//   metaObjects.TableHeightControlVariant = "ВариантУправленияВысотойТаблицы";
//   metaObjects.TableRepresentation = "ОтображениеТаблицы";
//   metaObjects.TableRowInputMode = "РежимВводаСтрокТаблицы";
//   metaObjects.TableRowSelectionMode = "РежимВыделенияСтрокиТаблицы";
//   metaObjects.TableSelectionMode = "РежимВыделенияТаблицы";
//   metaObjects.TaskListMode = "РежимСпискаЗадач";
//   metaObjects.TextDirection = "НаправлениеТекста";
//   metaObjects.ThroughAlign = "СквозноеВыравнивание";
//   metaObjects.TimeScalePosition = "ПоложениеШкалыВремени";
//   metaObjects.TitleLocation = "ПоложениеЗаголовка";
//   metaObjects.ToolTipRepresentation = "ОтображениеПодсказки";
//   metaObjects.TrackBarMarkingAppearance = "ОтображениеРазметкиПолосыРегулирования";
//   metaObjects.UseMenuMode = "ИспользованиеРежимаМеню";
//   metaObjects.UseOutput = "ИспользованиеВывода";
//   metaObjects.UserNotificationStatus = "СтатусОповещенияПользователя";
//   metaObjects.UsualGroupBehavior = "ПоведениеОбычнойГруппы";
//   metaObjects.UsualGroupControlRepresentation = "ОтображениеУправленияОбычнойГруппы";
//   metaObjects.UsualGroupRepresentation = "ОтображениеОбычнойГруппы";
//   metaObjects.VerticalAlign = "ВертикальноеПоложение";
//   metaObjects.VerticalFormScroll = "ВертикальнаяПрокруткаФормы";
//   metaObjects.ViewModeApplicationOnSetReportResult = "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета";
//   metaObjects.ViewScalingMode = "РежимМасштабированияПросмотра";
//   metaObjects.ViewStatusLocation = "ПоложениеСостоянияПросмотра";
//   metaObjects.WarningOnEditRepresentation = "ОтображениеПредупрежденияПриРедактировании";
//   metaObjects.WindowAppearanceModeChange = "ИзменениеСпособаОтображенияОкна";
//   metaObjects.WindowAppearanceModeVariant = "ВариантСпособаОтображенияОкна";
//   metaObjects.WindowDockVariant = "ВариантПрикрепленияОкна";
//   metaObjects.WindowLocationVariant = "ВариантПоложенияОкна";
//   metaObjects.WindowSizeChange = "ИзменениеРазмераОкна";
//   metaObjects.WindowStateVariant = "ВариантСостоянияОкна";
//   metaObjects.IntegrationServiceChannelState = "СостояниеКаналаСервисаИнтеграции";
//   metaObjects.AccessTokenSignAlgorithm = "АлгоритмПодписиТокенаДоступа";
//   metaObjects.ArchiveFileCompressionLevel = "УровеньСжатияФайлаАрхива";
//   metaObjects.ArchiveFileCompressionMethod = "МетодСжатияФайлаАрхива";
//   metaObjects.ArchiveFileEncryptionMethod = "МетодШифрованияФайлаАрхива";
//   metaObjects.ArchiveFileRestoreFilePathsMode = "РежимВосстановленияПутейФайлаАрхива";
//   metaObjects.ArchiveFileStorePathMode = "РежимСохраненияПутейФайлаАрхива";
//   metaObjects.ArchiveFileSubDirProcessingMode = "РежимОбработкиПодкаталоговФайлаАрхива";
//   metaObjects.ArchiveFileType = "ТипФайлаАрхива";
//   metaObjects.FileNamesEncodingInArchiveFile = "КодировкаИменФайловВФайлеАрхива";
//   metaObjects.FileAccess = "ДоступКФайлу";
//   metaObjects.FileCompareMethod = "СпособСравненияФайлов";
//   metaObjects.FileDialogMode = "РежимДиалогаВыбораФайла";
//   metaObjects.FileDialogSection = "РазделДиалогаВыбораФайла";
//   metaObjects.FileDragMode = "СпособПеретаскиванияФайлов";
//   metaObjects.FileOpenMode = "РежимОткрытияФайла";
//   metaObjects.GetFilesArchiveMode = "РежимПолученияАрхиваФайлов";
//   metaObjects.IncomingShareRequestStandardCommand = "СтандартнаяКомандаВходящегоЗапросаПоделиться";
//   metaObjects.MobileDeviceLibraryDirType = "ТипКаталогаБиблиотекиМобильногоУстройства";
//   metaObjects.ShareRequestDataProcessingVariant = "ВариантОбработкиДанныхЗапросаПоделиться";
//   metaObjects.AccountMainPresentation = "ОсновноеПредставлениеСчета";
//   metaObjects.AccumulationRegisterType = "ВидРегистраНакопления";
//   metaObjects.AttributeUse = "ИспользованиеРеквизита";
//   metaObjects.BinaryDataBlockStorageUseMode = "РежимИспользованияБлочногоХраненияДвоичныхДанных";
//   metaObjects.BinaryDataStorageMode = "РежимХранилищаДвоичныхДанных";
//   metaObjects.BusinessProcessNumberPeriodicity = "ПериодичностьНомераБизнесПроцесса";
//   metaObjects.BusinessProcessNumberType = "ТипНомераБизнесПроцесса";
//   metaObjects.CalculationRegisterPeriodicity = "ПериодичностьРегистраРасчета";
//   metaObjects.CalculationTypeMainPresentation = "ОсновноеПредставлениеВидаРасчета";
//   metaObjects.CharacteristicKindCodesSeries = "СерииКодовПланаВидовХарактеристик";
//   metaObjects.CharacteristicTypeMainPresentation = "ОсновноеПредставлениеВидаХарактеристики";
//   metaObjects.CharOfAccountCodeSeries = "СерииКодовПланаСчетов";
//   metaObjects.ChartOfCalculationTypesBaseUse = "ИспользованиеБазыПланаВидовРасчета";
//   metaObjects.ChartOfCalculationTypesCodeType = "ТипКодаПланаВидовРасчета";
//   metaObjects.ChoiceDataGetModeOnInputByString = "РежимПолученияДанныхВыбораПриВводеПоСтроке";
//   metaObjects.ChoiceMode = "СпособВыбора";
//   metaObjects.CommonAttributeAuthenticationSeparation = "РазделениеАутентификацииОбщегоРеквизита";
//   metaObjects.CommonAttributeAutoUse = "АвтоИспользованиеОбщегоРеквизита";
//   metaObjects.CommonAttributeConfigurationExtensionsSeparation = "РазделениеРасширенийКонфигурацииОбщегоРеквизита";
//   metaObjects.CommonAttributeDataSeparation = "РазделениеДанныхОбщегоРеквизита";
//   metaObjects.CommonAttributeSeparatedDataUse = "ИспользованиеРазделяемыхДанныхОбщегоРеквизита";
//   metaObjects.CommonAttributeUse = "ИспользованиеОбщегоРеквизита";
//   metaObjects.CommonAttributeUsersSeparation = "РазделениеПользователейОбщегоРеквизита";
//   metaObjects.CompatibilityMode = "РежимСовместимости";
//   metaObjects.ConfigurationExtensionPurpose = "НазначениеРасширенияКонфигурации";
//   metaObjects.CreateOnInput = "СозданиеПриВводе";
//   metaObjects.DataExchangeMainPresentation = "ОсновноеПредставлениеПланаОбмена";
//   metaObjects.DataHistoryUse = "ИспользованиеИсторииДанных";
//   metaObjects.DefaultDataLockControlMode = "РежимУправленияБлокировкойДанныхПоУмолчанию";
//   metaObjects.DocumentNumberPeriodicity = "ПериодичностьНомераДокумента";
//   metaObjects.DocumentNumberType = "ТипНомераДокумента";
//   metaObjects.EditType = "СпособРедактирования";
//   metaObjects.ExternalDataSourceTableDataType = "ТипДанныхТаблицыВнешнегоИсточникаДанных";
//   metaObjects.ExternalDataSourceTableType = "ВидТаблицыВнешнегоИсточникаДанных";
//   metaObjects.FormType = "ТипФормы";
//   metaObjects.FullTextSearchOnInputByString = "ПолнотекстовыйПоискПриВводеПоСтроке";
//   metaObjects.HierarchyType = "ВидИерархии";
//   metaObjects.HTTPMethod = "HTTPМетод";
//   metaObjects.Indexing = "Индексирование";
//   metaObjects.InformationRegisterPeriodicity = "ПериодичностьРегистраСведений";
//   metaObjects.IntegrationServiceChannelMessageDirection = "НаправлениеСообщенияКаналаСервисаИнтеграции";
//   metaObjects.ModalityUseMode = "РежимИспользованияМодальности";
//   metaObjects.MoveBoundaryOnPosting = "ПеремещениеГраницыПриПроведении";
//   metaObjects.ObjectAutonumerationMode = "РежимАвтонумерацииОбъектов";
//   metaObjects.ObjectBelonging = "ПринадлежностьОбъекта";
//   metaObjects.Posting = "Проведение";
//   metaObjects.PredefinedDataUpdate = "ОбновлениеПредопределенныхДанных";
//   metaObjects.RealTimePosting = "ОперативноеПроведение";
//   metaObjects.RegisterRecordsDeletion = "УдалениеДвижений";
//   metaObjects.RegisterRecordsWritingOnPost = "ЗаписьДвиженийПриПроведении";
//   metaObjects.RegisterWriteMode = "РежимЗаписиРегистра";
//   metaObjects.ReturnValuesReuse = "ПовторноеИспользованиеВозвращаемыхЗначений";
//   metaObjects.ScriptVariant = "ВариантВстроенногоЯзыка";
//   metaObjects.SearchStringModeOnInputByString = "СпособПоискаСтрокиПриВводеПоСтроке";
//   metaObjects.SequenceFilling = "ЗаполнениеПоследовательностей";
//   metaObjects.SessionReuseMode = "РежимПовторногоИспользованияСеансов";
//   metaObjects.StyleElementType = "ВидЭлементаСтиля";
//   metaObjects.SubordinationUse = "ИспользованиеПодчинения";
//   metaObjects.SynchronousExtensionAndAddInCallUseMode = "РежимИспользованияСинхронныхВызововРасширенийИВнешнихКомпонент";
//   metaObjects.SynchronousPlatformExtensionAndAddInCallUseMode = "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент";
//   metaObjects.TaskMainPresentation = "ОсновноеПредставлениеЗадачи";
//   metaObjects.TaskNumberAutoPrefix = "АвтоПрефиксНомераЗадачи";
//   metaObjects.TaskNumberType = "ТипНомераЗадачи";
//   metaObjects.TemplateType = "ТипМакета";
//   metaObjects.TransferDirection = "НаправлениеПередачи";
//   metaObjects.TypeReductionMode = "РежимСокращенияТипа";
//   metaObjects.UseFullTextSearch = "ИспользованиеПолнотекстовогоПоиска";
//   metaObjects.UseQuickChoice = "ИспользованиеБыстрогоВыбора";
//   metaObjects.PresentationAdditionType = "ТипДобавленияПредставлений";
//   metaObjects.ReportBuilderDetailsFillType = "ВидЗаполненияРасшифровкиПостроителяОтчета";
//   metaObjects.ReportBuilderDimensionType = "ТипИзмеренияПостроителяОтчета";
//   metaObjects.TotalPlacementType = "ТипРазмещенияИтогов";
//   metaObjects.XMLAttributeType = "ТипАтрибутаXML";
//   metaObjects.XMLCanonicalizationType = "ТипКаноническогоXML";
//   metaObjects.XMLNodeType = "ТипУзлаXML";
//   metaObjects.XMLSpace = "ПробельныеСимволыXML";
//   metaObjects.XMLTypeAssignment = "НазначениеТипаXML";
//   metaObjects.XMLValidationType = "ТипПроверкиXML";
//   metaObjects.AllowedMessageNo = "ДопустимыйНомерСообщения";
//   metaObjects.AutoChangeRecord = "АвтоРегистрацияИзменений";
//   metaObjects.DataItemReceive = "ПолучениеЭлементаДанных";
//   metaObjects.DataItemSend = "ОтправкаЭлементаДанных";
//   metaObjects.AnalysisDataType = "ВидДанныхАнализа";
//   metaObjects.AssociationRulesDataSourceType = "ТипИсточникаДанныхПоискаАссоциаций";
//   metaObjects.AssociationRulesPruneType = "ТипОтсеченияПравилАссоциации";
//   metaObjects.ClusterizationMethod = "МетодКластеризации";
//   metaObjects.DataAnalysisAssociationRulesOrderType = "ТипУпорядочиванияПравилАссоциацииАнализаДанных";
//   metaObjects.DataAnalysisColumnTypeAssociationRules = "ТипКолонкиАнализаДанныхПоискАссоциаций";
//   metaObjects.DataAnalysisColumnTypeClusterization = "ТипКолонкиАнализаДанныхКластеризация";
//   metaObjects.DataAnalysisColumnTypeDecisionTree = "ТипКолонкиАнализаДанныхДеревоРешений";
//   metaObjects.DataAnalysisColumnTypeSequentialPatterns = "ТипКолонкиАнализаДанныхПоискПоследовательностей";
//   metaObjects.DataAnalysisColumnTypeSummaryStatistics = "ТипКолонкиАнализаДанныхОбщаяСтатистика";
//   metaObjects.DataAnalysisDistanceMetricType = "ТипМерыРасстоянияАнализаДанных";
//   metaObjects.DataAnalysisFieldType = "ТипПоляАнализаДанных";
//   metaObjects.DataAnalysisNumericValueUseType = "ТипИспользованияЧисловыхЗначенийАнализаДанных";
//   metaObjects.DataAnalysisResultTableFillType = "ТипЗаполненияТаблицыРезультатаАнализаДанных";
//   metaObjects.DataAnalysisSequentialPatternsOrderType = "ТипУпорядочиванияШаблоновПоследовательностейАнализаДанных";
//   metaObjects.DataAnalysisStandardizationType = "ТипСтандартизацииАнализаДанных";
//   metaObjects.DataAnalysisTimeIntervalUnitType = "ТипЕдиницыИнтервалаВремениАнализаДанных";
//   metaObjects.DecisionTreeSimplificationType = "ТипУпрощенияДереваРешений";
//   metaObjects.PredictionModelColumnType = "ТипКолонкиМоделиПрогноза";
//   metaObjects.FileNamesEncodingInZipFile = "КодировкаИменФайловВZipФайле";
//   metaObjects.ZIPCompressionLevel = "УровеньСжатияZIP";
//   metaObjects.ZIPCompressionMethod = "МетодСжатияZIP";
//   metaObjects.ZIPEncryptionMethod = "МетодШифрованияZIP";
//   metaObjects.ZIPRestoreFilePathsMode = "РежимВосстановленияПутейФайловZIP";
//   metaObjects.ZIPStorePathMode = "РежимСохраненияПутейZIP";
//   metaObjects.ZIPSubDirProcessingMode = "РежимОбработкиПодкаталоговZIP";
//   metaObjects.DynamicListSearchStringViewMode = "РежимОтображенияСтрокиПоискаДинамическогоСписка";
// }
