

export enum DynamicListSearchStringViewMode {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
  ShowOnUsingFullTextSearch = "ShowOnUsingFullTextSearch",
}

export enum DynamicListSearchStringViewModeEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
  ОтображатьПриИспользованииПолнотекстовогоПоиска = "ОтображатьПриИспользованииПолнотекстовогоПоиска",
}

export enum XDTOFacetType {
  Length = "Length",
  MaxInclusive = "MaxInclusive",
  MaxLength = "MaxLength",
  MaxExclusive = "MaxExclusive",
  MinInclusive = "MinInclusive",
  MinLength = "MinLength",
  MinExclusive = "MinExclusive",
  Pattern = "Pattern",
  Enumeration = "Enumeration",
  Whitespace = "Whitespace",
  TotalDigits = "TotalDigits",
  FractionDigits = "FractionDigits",
}

export enum XDTOFacetTypeEnterprise {
  Длина = "Длина",
  МаксВключающее = "МаксВключающее",
  МаксДлина = "МаксДлина",
  МаксИсключающее = "МаксИсключающее",
  МинВключающее = "МинВключающее",
  МинДлина = "МинДлина",
  МинИсключающее = "МинИсключающее",
  Образец = "Образец",
  Перечисление = "Перечисление",
  ПробельныеСимволы = "ПробельныеСимволы",
  РазрядовВсего = "РазрядовВсего",
  РазрядовДробнойЧасти = "РазрядовДробнойЧасти",
}

export enum XMLForm {
  Attribute = "Attribute",
  Text = "Text",
  Element = "Element",
}

export enum XMLFormEnterprise {
  Атрибут = "Атрибут",
  Текст = "Текст",
  Элемент = "Элемент",
}

export enum WSParameterDirection {
  In = "In",
  InOut = "InOut",
  Out = "Out",
}

export enum WSParameterDirectionEnterprise {
  Входной = "Входной",
  ВходнойВыходной = "ВходнойВыходной",
  Выходной = "Выходной",
}

export enum DOMBuilderAction {
  InsertBefore = "InsertBefore",
  InsertAfter = "InsertAfter",
  AppendAsChildren = "AppendAsChildren",
  Replace = "Replace",
  ReplaceChildren = "ReplaceChildren",
}

export enum DOMBuilderActionEnterprise {
  ВставитьПеред = "ВставитьПеред",
  ВставитьПосле = "ВставитьПосле",
  ДобавитьКакДочерние = "ДобавитьКакДочерние",
  Заменить = "Заменить",
  ЗаменитьДочерние = "ЗаменитьДочерние",
}

export enum DOMDocumentPosition {
  ImplementationSpecific = "ImplementationSpecific",
  Disconnected = "Disconnected",
  Preceding = "Preceding",
  Following = "Following",
  Contains = "Contains",
  ContainedBy = "ContainedBy",
}

export enum DOMDocumentPositionEnterprise {
  ЗависитОтРеализации = "ЗависитОтРеализации",
  Отсоединен = "Отсоединен",
  Предшествует = "Предшествует",
  Следует = "Следует",
  Содержит = "Содержит",
  Содержится = "Содержится",
}

export enum DOMNodeFilterParameters {
  ShowAttribute = "ShowAttribute",
  ShowAll = "ShowAll",
  ShowDocument = "ShowDocument",
  ShowProcessingInstruction = "ShowProcessingInstruction",
  ShowComment = "ShowComment",
  ShowNotation = "ShowNotation",
  ShowDocumentType = "ShowDocumentType",
  ShowCDATASection = "ShowCDATASection",
  ShowEntityReference = "ShowEntityReference",
  ShowEntity = "ShowEntity",
  ShowText = "ShowText",
  ShowDocumentFragment = "ShowDocumentFragment",
  ShowElement = "ShowElement",
}

export enum DOMNodeFilterParametersEnterprise {
  ОтображатьАтрибут = "ОтображатьАтрибут",
  ОтображатьВсе = "ОтображатьВсе",
  ОтображатьДокумент = "ОтображатьДокумент",
  ОтображатьИнструкциюОбработки = "ОтображатьИнструкциюОбработки",
  ОтображатьКомментарий = "ОтображатьКомментарий",
  ОтображатьНотацию = "ОтображатьНотацию",
  ОтображатьОпределениеТипаДокумента = "ОтображатьОпределениеТипаДокумента",
  ОтображатьСекцииCDATA = "ОтображатьСекцииCDATA",
  ОтображатьСсылкуНаСущность = "ОтображатьСсылкуНаСущность",
  ОтображатьСущность = "ОтображатьСущность",
  ОтображатьТекст = "ОтображатьТекст",
  ОтображатьФрагментДокумента = "ОтображатьФрагментДокумента",
  ОтображатьЭлемент = "ОтображатьЭлемент",
}

export enum DOMNodeType {
  Attribute = "Attribute",
  Document = "Document",
  ProcessingInstruction = "ProcessingInstruction",
  Comment = "Comment",
  Notation = "Notation",
  DocumentType = "DocumentType",
  XPathNamespace = "XPathNamespace",
  CDATASection = "CDATASection",
  EntityReference = "EntityReference",
  Entity = "Entity",
  Text = "Text",
  DocumentFragment = "DocumentFragment",
  Element = "Element",
}

export enum DOMNodeTypeEnterprise {
  Атрибут = "Атрибут",
  Документ = "Документ",
  ИнструкцияОбработки = "ИнструкцияОбработки",
  Комментарий = "Комментарий",
  Нотация = "Нотация",
  ОпределениеТипаДокумента = "ОпределениеТипаДокумента",
  ПространствоИменXPath = "ПространствоИменXPath",
  СекцияCDATA = "СекцияCDATA",
  СсылкаНаСущность = "СсылкаНаСущность",
  Сущность = "Сущность",
  Текст = "Текст",
  ФрагментДокумента = "ФрагментДокумента",
  Элемент = "Элемент",
}

export enum DOMXPathResultType {
  Boolean = "Boolean",
  Any = "Any",
  AnyUnorderedNode = "AnyUnorderedNode",
  UnorderedNodeIterator = "UnorderedNodeIterator",
  UnorderedNodeSnapshot = "UnorderedNodeSnapshot",
  FirstOrderedNode = "FirstOrderedNode",
  String = "String",
  OrderedNodeIterator = "OrderedNodeIterator",
  OrderedNodeSnapshot = "OrderedNodeSnapshot",
  Number = "Number",
}

export enum DOMXPathResultTypeEnterprise {
  Булево = "Булево",
  Любой = "Любой",
  ЛюбойНеупорядоченныйУзел = "ЛюбойНеупорядоченныйУзел",
  НеупорядоченныйИтераторУзлов = "НеупорядоченныйИтераторУзлов",
  НеупорядоченныйСнимокУзлов = "НеупорядоченныйСнимокУзлов",
  ПервыйУпорядоченныйУзел = "ПервыйУпорядоченныйУзел",
  Строка = "Строка",
  УпорядоченныйИтераторУзлов = "УпорядоченныйИтераторУзлов",
  УпорядоченныйСнимокУзлов = "УпорядоченныйСнимокУзлов",
  Число = "Число",
}

export enum HTMLContentCategory {
  AppletTags = "AppletTags",
  AreaTags = "AreaTags",
  EmbedTags = "EmbedTags",
  FrameTags = "FrameTags",
  IframeTags = "IframeTags",
  ImportAttributes = "ImportAttributes",
  JavaScriptTags = "JavaScriptTags",
  LinkTags = "LinkTags",
  NoembedTags = "NoembedTags",
  ObjectTags = "ObjectTags",
  SourceTags = "SourceTags",
  StyleTags = "StyleTags",
  W3IncludeAttributes = "W3IncludeAttributes",
  All = "All",
  EventsHandlers = "EventsHandlers",
}

export enum HTMLContentCategoryEnterprise {
  AppletТеги = "AppletТеги",
  AreaТеги = "AreaТеги",
  EmbedТеги = "EmbedТеги",
  FrameТеги = "FrameТеги",
  IframeТеги = "IframeТеги",
  ImportАтрибуты = "ImportАтрибуты",
  JavaScriptТеги = "JavaScriptТеги",
  LinkТеги = "LinkТеги",
  NoembedТеги = "NoembedТеги",
  ObjectТеги = "ObjectТеги",
  SourceТеги = "SourceТеги",
  StyleТеги = "StyleТеги",
  W3IncludeАтрибуты = "W3IncludeАтрибуты",
  Все = "Все",
  ОбработчикиСобытий = "ОбработчикиСобытий",
}

export enum DataCompositionAccountingBalanceType {
  Debit = "Debit",
  Credit = "Credit",
  None = "None",
}

export enum DataCompositionAccountingBalanceTypeEnterprise {
  Дебет = "Дебет",
  Кредит = "Кредит",
  Нет = "Нет",
}

export enum DataCompositionAreaTemplateType {
  Header = "Header",
  HierarchicalHeader = "HierarchicalHeader",
  OverallHeader = "OverallHeader",
  OverallFooter = "OverallFooter",
  Footer = "Footer",
  HierarchicalFooter = "HierarchicalFooter",
}

export enum DataCompositionAreaTemplateTypeEnterprise {
  Заголовок = "Заголовок",
  ЗаголовокИерархии = "ЗаголовокИерархии",
  ОбщийИтогЗаголовок = "ОбщийИтогЗаголовок",
  ОбщийИтогПодвал = "ОбщийИтогПодвал",
  Подвал = "Подвал",
  ПодвалИерархии = "ПодвалИерархии",
}

export enum DataCompositionAttributesPlacement {
  Together = "Together",
  WithOwnerField = "WithOwnerField",
  SpecialPosition = "SpecialPosition",
  Separately = "Separately",
}

export enum DataCompositionAttributesPlacementEnterprise {
  Вместе = "Вместе",
  ВместеСВладельцем = "ВместеСВладельцем",
  ВСпециальнойПозиции = "ВСпециальнойПозиции",
  Отдельно = "Отдельно",
}

export enum DataCompositionBalanceType {
  ClosingBalance = "ClosingBalance",
  OpeningBalance = "OpeningBalance",
  None = "None",
}

export enum DataCompositionBalanceTypeEnterprise {
  КонечныйОстаток = "КонечныйОстаток",
  НачальныйОстаток = "НачальныйОстаток",
  Нет = "Нет",
}

export enum DataCompositionChartLegendPlacement {
  Top = "Top",
  Left = "Left",
  None = "None",
  Bottom = "Bottom",
  Right = "Right",
}

export enum DataCompositionChartLegendPlacementEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Нет = "Нет",
  Низ = "Низ",
  Право = "Право",
}

export enum DataCompositionComparisonType {
  Greater = "Greater",
  GreaterOrEqual = "GreaterOrEqual",
  InHierarchy = "InHierarchy",
  InList = "InList",
  InListByHierarchy = "InListByHierarchy",
  Filled = "Filled",
  Less = "Less",
  LessOrEqual = "LessOrEqual",
  BeginsWith = "BeginsWith",
  NotInHierarchy = "NotInHierarchy",
  NotInList = "NotInList",
  NotInListByHierarchy = "NotInListByHierarchy",
  NotFilled = "NotFilled",
  NotBeginsWith = "NotBeginsWith",
  NotLike = "NotLike",
  NotEqual = "NotEqual",
  NotContains = "NotContains",
  Like = "Like",
  Equal = "Equal",
  Contains = "Contains",
}

export enum DataCompositionComparisonTypeEnterprise {
  Больше = "Больше",
  БольшеИлиРавно = "БольшеИлиРавно",
  ВИерархии = "ВИерархии",
  ВСписке = "ВСписке",
  ВСпискеПоИерархии = "ВСпискеПоИерархии",
  Заполнено = "Заполнено",
  Меньше = "Меньше",
  МеньшеИлиРавно = "МеньшеИлиРавно",
  НачинаетсяС = "НачинаетсяС",
  НеВИерархии = "НеВИерархии",
  НеВСписке = "НеВСписке",
  НеВСпискеПоИерархии = "НеВСпискеПоИерархии",
  НеЗаполнено = "НеЗаполнено",
  НеНачинаетсяС = "НеНачинаетсяС",
  НеПодобно = "НеПодобно",
  НеРавно = "НеРавно",
  НеСодержит = "НеСодержит",
  Подобно = "Подобно",
  Равно = "Равно",
  Содержит = "Содержит",
}

export enum DataCompositionConditionalAppearanceUse {
  Use = "Use",
  DontUse = "DontUse",
}

export enum DataCompositionConditionalAppearanceUseEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum DataCompositionDataSetsLinkType {
  Outer = "Outer",
  Inner = "Inner",
}

export enum DataCompositionDataSetsLinkTypeEnterprise {
  Внешняя = "Внешняя",
  Внутренняя = "Внутренняя",
}

export enum DataCompositionDetailsProcessingAction {
  None = "None",
  OpenValue = "OpenValue",
  Filter = "Filter",
  ApplyAppearance = "ApplyAppearance",
  DrillDown = "DrillDown",
  Group = "Group",
  Order = "Order",
}

export enum DataCompositionDetailsProcessingActionEnterprise {
  Нет = "Нет",
  ОткрытьЗначение = "ОткрытьЗначение",
  Отфильтровать = "Отфильтровать",
  Оформить = "Оформить",
  Расшифровать = "Расшифровать",
  Сгруппировать = "Сгруппировать",
  Упорядочить = "Упорядочить",
}

export enum DataCompositionFieldPlacement {
  Auto = "Auto",
  Vertically = "Vertically",
  Together = "Together",
  Horizontally = "Horizontally",
  SpecialColumn = "SpecialColumn",
}

export enum DataCompositionFieldPlacementEnterprise {
  Авто = "Авто",
  Вертикально = "Вертикально",
  Вместе = "Вместе",
  Горизонтально = "Горизонтально",
  ОтдельнаяКолонка = "ОтдельнаяКолонка",
}

export enum DataCompositionFieldsTitleType {
  Auto = "Auto",
  Short = "Short",
  Full = "Full",
}

export enum DataCompositionFieldsTitleTypeEnterprise {
  Авто = "Авто",
  Краткий = "Краткий",
  Полный = "Полный",
}

export enum DataCompositionFilterApplicationType {
  Hierarchy = "Hierarchy",
  HierarchyOnly = "HierarchyOnly",
  Items = "Items",
}

export enum DataCompositionFilterApplicationTypeEnterprise {
  Иерархия = "Иерархия",
  ТолькоИерархия = "ТолькоИерархия",
  Элементы = "Элементы",
}

export enum DataCompositionFilterItemsGroupType {
  AndGroup = "AndGroup",
  OrGroup = "OrGroup",
  NotGroup = "NotGroup",
}

export enum DataCompositionFilterItemsGroupTypeEnterprise {
  ГруппаИ = "ГруппаИ",
  ГруппаИли = "ГруппаИли",
  ГруппаНе = "ГруппаНе",
}

export enum DataCompositionFixation {
  Auto = "Auto",
  DontUse = "DontUse",
}

export enum DataCompositionFixationEnterprise {
  Авто = "Авто",
  НеИспользовать = "НеИспользовать",
}

export enum DataCompositionGroupFieldsPlacement {
  Together = "Together",
  Separately = "Separately",
  SeparatelyAndInTotalsOnly = "SeparatelyAndInTotalsOnly",
}

export enum DataCompositionGroupFieldsPlacementEnterprise {
  Вместе = "Вместе",
  Отдельно = "Отдельно",
  ОтдельноИТолькоВИтогах = "ОтдельноИТолькоВИтогах",
}

export enum DataCompositionGroupPlacement {
  End = "End",
  Begin = "Begin",
  BeginAndEnd = "BeginAndEnd",
  None = "None",
}

export enum DataCompositionGroupPlacementEnterprise {
  Конец = "Конец",
  Начало = "Начало",
  НачалоИКонец = "НачалоИКонец",
  Нет = "Нет",
}

export enum DataCompositionGroupTemplateType {
  Auto = "Auto",
  Vertical = "Vertical",
  Horizontal = "Horizontal",
}

export enum DataCompositionGroupTemplateTypeEnterprise {
  Авто = "Авто",
  Вертикальный = "Вертикальный",
  Горизонтальный = "Горизонтальный",
}

export enum DataCompositionGroupType {
  Hierarchy = "Hierarchy",
  HierarchyOnly = "HierarchyOnly",
  Items = "Items",
}

export enum DataCompositionGroupTypeEnterprise {
  Иерархия = "Иерархия",
  ТолькоИерархия = "ТолькоИерархия",
  Элементы = "Элементы",
}

export enum DataCompositionGroupUseVariant {
  Auto = "Auto",
  AdditionalInformation = "AdditionalInformation",
}

export enum DataCompositionGroupUseVariantEnterprise {
  Авто = "Авто",
  ДополнительнаяИнформация = "ДополнительнаяИнформация",
}

export enum DataCompositionParameterUse {
  Auto = "Auto",
  Always = "Always",
}

export enum DataCompositionParameterUseEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
}

export enum DataCompositionPeriodAdditionType {
  None = "None",
  Year = "Year",
  YearSinceBeginOfPeriod = "YearSinceBeginOfPeriod",
  YearSinceBeginOfPeriod445 = "YearSinceBeginOfPeriod445",
  TenDays = "TenDays",
  Day = "Day",
  DaySinceBeginOfPeriod = "DaySinceBeginOfPeriod",
  Quarter = "Quarter",
  QuarterSinceBeginOfPeriod = "QuarterSinceBeginOfPeriod",
  QuarterSinceBeginOfPeriod445 = "QuarterSinceBeginOfPeriod445",
  Month = "Month",
  MonthSinceBeginOfPeriod = "MonthSinceBeginOfPeriod",
  MonthSinceBeginOfPeriod445 = "MonthSinceBeginOfPeriod445",
  Minute = "Minute",
  MinuteSinceBeginOfPeriod = "MinuteSinceBeginOfPeriod",
  Week = "Week",
  WeekSinceBeginOfPeriod = "WeekSinceBeginOfPeriod",
  HalfYear = "HalfYear",
  HalfYearSinceBeginOfPeriod = "HalfYearSinceBeginOfPeriod",
  HalfYearSinceBeginOfPeriod445 = "HalfYearSinceBeginOfPeriod445",
  Second = "Second",
  Hour = "Hour",
  HourSinceBeginOfPeriod = "HourSinceBeginOfPeriod",
}

export enum DataCompositionPeriodAdditionTypeEnterprise {
  БезДополнения = "БезДополнения",
  Год = "Год",
  ГодОтНачалаПериода = "ГодОтНачалаПериода",
  ГодОтНачалаПериода445 = "ГодОтНачалаПериода445",
  Декада = "Декада",
  День = "День",
  ДеньОтНачалаПериода = "ДеньОтНачалаПериода",
  Квартал = "Квартал",
  КварталОтНачалаПериода = "КварталОтНачалаПериода",
  КварталОтНачалаПериода445 = "КварталОтНачалаПериода445",
  Месяц = "Месяц",
  МесяцОтНачалаПериода = "МесяцОтНачалаПериода",
  МесяцОтНачалаПериода445 = "МесяцОтНачалаПериода445",
  Минута = "Минута",
  МинутаОтНачалаПериода = "МинутаОтНачалаПериода",
  Неделя = "Неделя",
  НеделяОтНачалаПериода = "НеделяОтНачалаПериода",
  Полугодие = "Полугодие",
  ПолугодиеОтНачалаПериода = "ПолугодиеОтНачалаПериода",
  ПолугодиеОтНачалаПериода445 = "ПолугодиеОтНачалаПериода445",
  Секунда = "Секунда",
  Час = "Час",
  ЧасОтНачалаПериода = "ЧасОтНачалаПериода",
}

export enum DataCompositionPeriodType {
  Additional = "Additional",
  Main = "Main",
}

export enum DataCompositionPeriodTypeEnterprise {
  Дополнительный = "Дополнительный",
  Основной = "Основной",
}

export enum DataCompositionPictureOutputType {
  Auto = "Auto",
  OutputByValue = "OutputByValue",
  OutputByRef = "OutputByRef",
  DontOutput = "DontOutput",
}

export enum DataCompositionPictureOutputTypeEnterprise {
  Авто = "Авто",
  ВыводитьПоЗначению = "ВыводитьПоЗначению",
  ВыводитьПоСсылке = "ВыводитьПоСсылке",
  НеВыводить = "НеВыводить",
}

export enum DataCompositionResourcesAutoPosition {
  DontUse = "DontUse",
  AfterAllFields = "AfterAllFields",
}

export enum DataCompositionResourcesAutoPositionEnterprise {
  НеИспользовать = "НеИспользовать",
  ПослеВсехПолей = "ПослеВсехПолей",
}

export enum DataCompositionResourcesPlacement {
  Vertically = "Vertically",
  Horizontally = "Horizontally",
}

export enum DataCompositionResourcesPlacementEnterprise {
  Вертикально = "Вертикально",
  Горизонтально = "Горизонтально",
}

export enum DataCompositionResourcesPlacementInChart {
  Auto = "Auto",
  Series = "Series",
  Points = "Points",
}

export enum DataCompositionResourcesPlacementInChartEnterprise {
  Авто = "Авто",
  Серии = "Серии",
  Точки = "Точки",
}

export enum DataCompositionResultItemType {
  End = "End",
  Begin = "Begin",
  BeginAndEnd = "BeginAndEnd",
}

export enum DataCompositionResultItemTypeEnterprise {
  Конец = "Конец",
  Начало = "Начало",
  НачалоИКонец = "НачалоИКонец",
}

export enum DataCompositionResultNestedItemsLayout {
  Vertically = "Vertically",
  Horizontally = "Horizontally",
}

export enum DataCompositionResultNestedItemsLayoutEnterprise {
  Вертикально = "Вертикально",
  Горизонтально = "Горизонтально",
}

export enum DataCompositionSettingsItemState {
  Enabled = "Enabled",
  Disabled = "Disabled",
  DeletedByUser = "DeletedByUser",
}

export enum DataCompositionSettingsItemStateEnterprise {
  Включен = "Включен",
  Отключен = "Отключен",
  УдаленПользователем = "УдаленПользователем",
}

export enum DataCompositionSettingsItemViewMode {
  Auto = "Auto",
  QuickAccess = "QuickAccess",
  Inaccessible = "Inaccessible",
  Normal = "Normal",
}

export enum DataCompositionSettingsItemViewModeEnterprise {
  Авто = "Авто",
  БыстрыйДоступ = "БыстрыйДоступ",
  Недоступный = "Недоступный",
  Обычный = "Обычный",
}

export enum DataCompositionSettingsRefreshMethod {
  Full = "Full",
  CheckAvailability = "CheckAvailability",
}

export enum DataCompositionSettingsRefreshMethodEnterprise {
  Полное = "Полное",
  ПроверятьДоступность = "ПроверятьДоступность",
}

export enum DataCompositionSettingsViewMode {
  QuickAccess = "QuickAccess",
  All = "All",
}

export enum DataCompositionSettingsViewModeEnterprise {
  БыстрыйДоступ = "БыстрыйДоступ",
  Все = "Все",
}

export enum DataCompositionSortDirection {
  Asc = "Asc",
  Desc = "Desc",
}

export enum DataCompositionSortDirectionEnterprise {
  Возр = "Возр",
  Убыв = "Убыв",
}

export enum DataCompositionTextOutputType {
  Auto = "Auto",
  Output = "Output",
  DontOutput = "DontOutput",
}

export enum DataCompositionTextOutputTypeEnterprise {
  Авто = "Авто",
  Выводить = "Выводить",
  НеВыводить = "НеВыводить",
}

export enum DataCompositionTextPlacementType {
  Overflow = "Overflow",
  Block = "Block",
  Cut = "Cut",
  Wrap = "Wrap",
}

export enum DataCompositionTextPlacementTypeEnterprise {
  Выступать = "Выступать",
  Забивать = "Забивать",
  Обрезать = "Обрезать",
  Переносить = "Переносить",
}

export enum DataCompositionTotalPlacement {
  Auto = "Auto",
  End = "End",
  Begin = "Begin",
  BeginAndEnd = "BeginAndEnd",
  None = "None",
}

export enum DataCompositionTotalPlacementEnterprise {
  Авто = "Авто",
  Конец = "Конец",
  Начало = "Начало",
  НачалоИКонец = "НачалоИКонец",
  Нет = "Нет",
}

export enum OnUnavailabilityDataCompositionSettingsAction {
  DisableControl = "DisableControl",
  HidePage = "HidePage",
}

export enum OnUnavailabilityDataCompositionSettingsActionEnterprise {
  ИзменятьДоступностьПоля = "ИзменятьДоступностьПоля",
  СкрыватьСтраницу = "СкрыватьСтраницу",
}

export enum ResultCompositionMode {
  Auto = "Auto",
  Directly = "Directly",
  Background = "Background",
}

export enum ResultCompositionModeEnterprise {
  Авто = "Авто",
  Непосредственно = "Непосредственно",
  Фоновый = "Фоновый",
}

export enum SaveDataCompositionAppearance {
  Auto = "Auto",
  ForUser = "ForUser",
  ForCurrentResult = "ForCurrentResult",
  DontUse = "DontUse",
  ByKeyForUser = "ByKeyForUser",
}

export enum SaveDataCompositionAppearanceEnterprise {
  Авто = "Авто",
  ДляПользователя = "ДляПользователя",
  ДляТекущегоРезультата = "ДляТекущегоРезультата",
  НеИспользовать = "НеИспользовать",
  ПоКлючуДляПользователя = "ПоКлючуДляПользователя",
}

export enum XSAttributeUseCategory {
  Prohibited = "Prohibited",
  Optional = "Optional",
  Required = "Required",
}

export enum XSAttributeUseCategoryEnterprise {
  Запрещено = "Запрещено",
  Необязательно = "Необязательно",
  Обязательно = "Обязательно",
}

export enum XSComplexFinal {
  All = "All",
  Restriction = "Restriction",
  Extension = "Extension",
}

export enum XSComplexFinalEnterprise {
  Все = "Все",
  Ограничение = "Ограничение",
  Расширение = "Расширение",
}

export enum XSComponentType {
  Annotation = "Annotation",
  Include = "Include",
  ModelGroup = "ModelGroup",
  Documentation = "Documentation",
  Import = "Import",
  AppInfo = "AppInfo",
  AttributeUse = "AttributeUse",
  MaxInclusiveFacet = "MaxInclusiveFacet",
  MaxExclusiveFacet = "MaxExclusiveFacet",
  Wildcard = "Wildcard",
  MinInclusiveFacet = "MinInclusiveFacet",
  MinExclusiveFacet = "MinExclusiveFacet",
  AttributeDeclaration = "AttributeDeclaration",
  NotationDeclaration = "NotationDeclaration",
  ElementDeclaration = "ElementDeclaration",
  XPathDefinition = "XPathDefinition",
  AttributeGroupDefinition = "AttributeGroupDefinition",
  ModelGroupDefinition = "ModelGroupDefinition",
  IdentityConstraintDefinition = "IdentityConstraintDefinition",
  SimpleTypeDefinition = "SimpleTypeDefinition",
  ComplexTypeDefinition = "ComplexTypeDefinition",
  Redefine = "Redefine",
  Schema = "Schema",
  LengthFacet = "LengthFacet",
  FractionDigitsFacet = "FractionDigitsFacet",
  MaxLengthFacet = "MaxLengthFacet",
  MinLengthFacet = "MinLengthFacet",
  PatternFacet = "PatternFacet",
  TotalDigitsFacet = "TotalDigitsFacet",
  EnumerationFacet = "EnumerationFacet",
  WhitespaceFacet = "WhitespaceFacet",
  Particle = "Particle",
}

export enum XSComponentTypeEnterprise {
  Аннотация = "Аннотация",
  Включение = "Включение",
  ГруппаМодели = "ГруппаМодели",
  Документация = "Документация",
  Импорт = "Импорт",
  ИнформацияПриложения = "ИнформацияПриложения",
  ИспользованиеАтрибута = "ИспользованиеАтрибута",
  МаксимальноВключающийФасет = "МаксимальноВключающийФасет",
  МаксимальноИсключающийФасет = "МаксимальноИсключающийФасет",
  Маска = "Маска",
  МинимальноВключающийФасет = "МинимальноВключающийФасет",
  МинимальноИсключающийФасет = "МинимальноИсключающийФасет",
  ОбъявлениеАтрибута = "ОбъявлениеАтрибута",
  ОбъявлениеНотации = "ОбъявлениеНотации",
  ОбъявлениеЭлемента = "ОбъявлениеЭлемента",
  ОпределениеXPath = "ОпределениеXPath",
  ОпределениеГруппыАтрибутов = "ОпределениеГруппыАтрибутов",
  ОпределениеГруппыМодели = "ОпределениеГруппыМодели",
  ОпределениеОграниченияИдентичности = "ОпределениеОграниченияИдентичности",
  ОпределениеПростогоТипа = "ОпределениеПростогоТипа",
  ОпределениеСоставногоТипа = "ОпределениеСоставногоТипа",
  Переопределение = "Переопределение",
  Схема = "Схема",
  ФасетДлины = "ФасетДлины",
  ФасетКоличестваРазрядовДробнойЧасти = "ФасетКоличестваРазрядовДробнойЧасти",
  ФасетМаксимальнойДлины = "ФасетМаксимальнойДлины",
  ФасетМинимальнойДлины = "ФасетМинимальнойДлины",
  ФасетОбразца = "ФасетОбразца",
  ФасетОбщегоКоличестваРазрядов = "ФасетОбщегоКоличестваРазрядов",
  ФасетПеречисления = "ФасетПеречисления",
  ФасетПробельныхСимволов = "ФасетПробельныхСимволов",
  Фрагмент = "Фрагмент",
}

export enum XSCompositor {
  All = "All",
  Choice = "Choice",
  Sequence = "Sequence",
}

export enum XSCompositorEnterprise {
  Все = "Все",
  Выбор = "Выбор",
  Последовательность = "Последовательность",
}

export enum XSConstraint {
  Default = "Default",
  Fixed = "Fixed",
}

export enum XSConstraintEnterprise {
  ПоУмолчанию = "ПоУмолчанию",
  Фиксированное = "Фиксированное",
}

export enum XSContentModel {
  Simple = "Simple",
  Complex = "Complex",
}

export enum XSContentModelEnterprise {
  Простая = "Простая",
  Составная = "Составная",
}

export enum XSDerivationMethod {
  Restriction = "Restriction",
  Extension = "Extension",
}

export enum XSDerivationMethodEnterprise {
  Ограничение = "Ограничение",
  Расширение = "Расширение",
}

export enum XSDisallowedSubstitutions {
  All = "All",
  Restriction = "Restriction",
  Substitution = "Substitution",
  Extension = "Extension",
}

export enum XSDisallowedSubstitutionsEnterprise {
  Все = "Все",
  Ограничение = "Ограничение",
  Подстановка = "Подстановка",
  Расширение = "Расширение",
}

export enum XSForm {
  Qualified = "Qualified",
  Unqualified = "Unqualified",
}

export enum XSFormEnterprise {
  Квалифицированная = "Квалифицированная",
  Неквалифицированная = "Неквалифицированная",
}

export enum XSIdentityConstraintCategory {
  Key = "Key",
  KeyRef = "KeyRef",
  Unique = "Unique",
}

export enum XSIdentityConstraintCategoryEnterprise {
  Ключ = "Ключ",
  СсылкаНаКлюч = "СсылкаНаКлюч",
  Уникальность = "Уникальность",
}

export enum XSNamespaceConstraintCategory {
  Not = "Not",
  Any = "Any",
  Set = "Set",
}

export enum XSNamespaceConstraintCategoryEnterprise {
  Кроме = "Кроме",
  Любое = "Любое",
  Набор = "Набор",
}

export enum XSProcessContents {
  Skip = "Skip",
  Lax = "Lax",
  Strict = "Strict",
}

export enum XSProcessContentsEnterprise {
  Пропустить = "Пропустить",
  Слабая = "Слабая",
  Строгая = "Строгая",
}

export enum XSProhibitedSubstitutions {
  All = "All",
  Restriction = "Restriction",
  Extension = "Extension",
}

export enum XSProhibitedSubstitutionsEnterprise {
  Все = "Все",
  Ограничение = "Ограничение",
  Расширение = "Расширение",
}

export enum XSSchemaFinal {
  All = "All",
  Union = "Union",
  Restriction = "Restriction",
  Extension = "Extension",
  List = "List",
}

export enum XSSchemaFinalEnterprise {
  Все = "Все",
  Объединение = "Объединение",
  Ограничение = "Ограничение",
  Расширение = "Расширение",
  Список = "Список",
}

export enum XSSimpleFinal {
  All = "All",
  Union = "Union",
  Restriction = "Restriction",
  List = "List",
}

export enum XSSimpleFinalEnterprise {
  Все = "Все",
  Объединение = "Объединение",
  Ограничение = "Ограничение",
  Список = "Список",
}

export enum XSSimpleTypeVariety {
  Atomic = "Atomic",
  Union = "Union",
  List = "List",
}

export enum XSSimpleTypeVarietyEnterprise {
  Атомарная = "Атомарная",
  Объединение = "Объединение",
  Список = "Список",
}

export enum XSSubstitutionGroupExclusions {
  All = "All",
  Restriction = "Restriction",
  Extension = "Extension",
}

export enum XSSubstitutionGroupExclusionsEnterprise {
  Все = "Все",
  Ограничение = "Ограничение",
  Расширение = "Расширение",
}

export enum XSWhitespaceHandling {
  Replace = "Replace",
  Collapse = "Collapse",
  Preserve = "Preserve",
}

export enum XSWhitespaceHandlingEnterprise {
  Заменять = "Заменять",
  Сворачивать = "Сворачивать",
  Сохранять = "Сохранять",
}

export enum XSXPathVariety {
  Field = "Field",
  Selector = "Selector",
}

export enum XSXPathVarietyEnterprise {
  Поле = "Поле",
  Селектор = "Селектор",
}

export enum EventLogDataStorageSplitPeriod {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Week = "Week",
  DontUse = "DontUse",
  Hour = "Hour",
}

export enum EventLogDataStorageSplitPeriodEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Неделя = "Неделя",
  НеИспользовать = "НеИспользовать",
  Час = "Час",
}

export enum EventLogEntryTransactionMode {
  Independent = "Independent",
  Transactional = "Transactional",
}

export enum EventLogEntryTransactionModeEnterprise {
  Независимая = "Независимая",
  Транзакционная = "Транзакционная",
}

export enum EventLogEntryTransactionStatus {
  Committed = "Committed",
  Unfinished = "Unfinished",
  NotApplicable = "NotApplicable",
  RolledBack = "RolledBack",
}

export enum EventLogEntryTransactionStatusEnterprise {
  Зафиксирована = "Зафиксирована",
  НеЗавершена = "НеЗавершена",
  НетТранзакции = "НетТранзакции",
  Отменена = "Отменена",
}

export enum EventLogLevel {
  Information = "Information",
  Error = "Error",
  Warning = "Warning",
  Note = "Note",
}

export enum EventLogLevelEnterprise {
  Информация = "Информация",
  Ошибка = "Ошибка",
  Предупреждение = "Предупреждение",
  Примечание = "Примечание",
}

export enum DataLockControlMode {
  Automatic = "Automatic",
  Managed = "Managed",
}

export enum DataLockControlModeEnterprise {
  Автоматический = "Автоматический",
  Управляемый = "Управляемый",
}

export enum DataLockMode {
  Exclusive = "Exclusive",
  Shared = "Shared",
}

export enum DataLockModeEnterprise {
  Исключительный = "Исключительный",
  Разделяемый = "Разделяемый",
}

export enum AccountType {
  ActivePassive = "ActivePassive",
  Active = "Active",
  Passive = "Passive",
}

export enum AccountTypeEnterprise {
  АктивноПассивный = "АктивноПассивный",
  Активный = "Активный",
  Пассивный = "Пассивный",
}

export enum AccountingRecordType {
  Debit = "Debit",
  Credit = "Credit",
}

export enum AccountingRecordTypeEnterprise {
  Дебет = "Дебет",
  Кредит = "Кредит",
}

export enum AccumulationRecordType {
  Receipt = "Receipt",
  Expense = "Expense",
}

export enum AccumulationRecordTypeEnterprise {
  Приход = "Приход",
  Расход = "Расход",
}

export enum AccumulationRegisterAggregatePeriodicity {
  Auto = "Auto",
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Nonperiodical = "Nonperiodical",
  HalfYear = "HalfYear",
}

export enum AccumulationRegisterAggregatePeriodicityEnterprise {
  Авто = "Авто",
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Непериодический = "Непериодический",
  Полугодие = "Полугодие",
}

export enum AccumulationRegisterAggregateUse {
  Auto = "Auto",
  Always = "Always",
}

export enum AccumulationRegisterAggregateUseEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
}

export enum AutoTimeMode {
  DontUse = "DontUse",
  First = "First",
  Last = "Last",
  CurrentOrFirst = "CurrentOrFirst",
  CurrentOrLast = "CurrentOrLast",
}

export enum AutoTimeModeEnterprise {
  НеИспользовать = "НеИспользовать",
  Первым = "Первым",
  Последним = "Последним",
  ТекущееИлиПервым = "ТекущееИлиПервым",
  ТекущееИлиПоследним = "ТекущееИлиПоследним",
}

export enum BusinessProcessRoutePointType {
  SubBusinessProcess = "SubBusinessProcess",
  Switch = "Switch",
  Activity = "Activity",
  End = "End",
  Processing = "Processing",
  Split = "Split",
  Join = "Join",
  Start = "Start",
  Condition = "Condition",
}

export enum BusinessProcessRoutePointTypeEnterprise {
  ВложенныйБизнесПроцесс = "ВложенныйБизнесПроцесс",
  ВыборВарианта = "ВыборВарианта",
  Действие = "Действие",
  Завершение = "Завершение",
  Обработка = "Обработка",
  Разделение = "Разделение",
  Слияние = "Слияние",
  Старт = "Старт",
  Условие = "Условие",
}

export enum CalculationRegisterPeriodType {
  BasePeriod = "BasePeriod",
  ActionPeriod = "ActionPeriod",
  RegistrationPeriod = "RegistrationPeriod",
  ActualActionPeriod = "ActualActionPeriod",
}

export enum CalculationRegisterPeriodTypeEnterprise {
  БазовыйПериод = "БазовыйПериод",
  ПериодДействия = "ПериодДействия",
  ПериодРегистрации = "ПериодРегистрации",
  ФактическийПериодДействия = "ФактическийПериодДействия",
}

export enum DocumentPostingMode {
  Regular = "Regular",
  RealTime = "RealTime",
}

export enum DocumentPostingModeEnterprise {
  Неоперативный = "Неоперативный",
  Оперативный = "Оперативный",
}

export enum DocumentWriteMode {
  Write = "Write",
  UndoPosting = "UndoPosting",
  Posting = "Posting",
}

export enum DocumentWriteModeEnterprise {
  Запись = "Запись",
  ОтменаПроведения = "ОтменаПроведения",
  Проведение = "Проведение",
}

export enum FoldersAndItemsUse {
  Folders = "Folders",
  FoldersAndItems = "FoldersAndItems",
  Items = "Items",
}

export enum FoldersAndItemsUseEnterprise {
  Группы = "Группы",
  ГруппыИЭлементы = "ГруппыИЭлементы",
  Элементы = "Элементы",
}

export enum PostingModeUse {
  Auto = "Auto",
  Regular = "Regular",
  RealTime = "RealTime",
}

export enum PostingModeUseEnterprise {
  Авто = "Авто",
  Неоперативный = "Неоперативный",
  Оперативный = "Оперативный",
}

export enum SliceUse {
  DontUse = "DontUse",
  First = "First",
  Last = "Last",
}

export enum SliceUseEnterprise {
  НеИспользовать = "НеИспользовать",
  Первые = "Первые",
  Последние = "Последние",
}

export enum BackgroundJobState {
  Active = "Active",
  Completed = "Completed",
  Failed = "Failed",
  Canceled = "Canceled",
}

export enum BackgroundJobStateEnterprise {
  Активно = "Активно",
  Завершено = "Завершено",
  ЗавершеноАварийно = "ЗавершеноАварийно",
  Отменено = "Отменено",
}

export enum CryptoCertificateCheckMode {
  IgnoreTimeValidity = "IgnoreTimeValidity",
  IgnoreSignatureValidity = "IgnoreSignatureValidity",
  IgnoreCertificateRevocationStatus = "IgnoreCertificateRevocationStatus",
  AllowTestCertificates = "AllowTestCertificates",
}

export enum CryptoCertificateCheckModeEnterprise {
  ИгнорироватьВремяДействия = "ИгнорироватьВремяДействия",
  ИгнорироватьДействительностьПодписи = "ИгнорироватьДействительностьПодписи",
  ИгнорироватьПроверкуВСпискеОтозванныхСертификатов = "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов",
  РазрешитьТестовыеСертификаты = "РазрешитьТестовыеСертификаты",
}

export enum CryptoCertificateIncludeMode {
  IncludeWholeChain = "IncludeWholeChain",
  IncludeSubjectCertificate = "IncludeSubjectCertificate",
  IncludeChainWithoutRoot = "IncludeChainWithoutRoot",
  DontInclude = "DontInclude",
}

export enum CryptoCertificateIncludeModeEnterprise {
  ВключатьПолнуюЦепочку = "ВключатьПолнуюЦепочку",
  ВключатьСертификатСубъекта = "ВключатьСертификатСубъекта",
  ВключатьЦепочкуБезКорневого = "ВключатьЦепочкуБезКорневого",
  НеВключать = "НеВключать",
}

export enum CryptoCertificateStorePlacement {
  ComputerData = "ComputerData",
  OSUserData = "OSUserData",
  ApplicationData = "ApplicationData",
}

export enum CryptoCertificateStorePlacementEnterprise {
  ДанныеКомпьютера = "ДанныеКомпьютера",
  ДанныеПользователяОС = "ДанныеПользователяОС",
  ДанныеПриложения = "ДанныеПриложения",
}

export enum CryptoCertificateStoreType {
  RootCertificates = "RootCertificates",
  PersonalCertificates = "PersonalCertificates",
  RecipientCertificates = "RecipientCertificates",
  CertificationAuthorityCertificates = "CertificationAuthorityCertificates",
}

export enum CryptoCertificateStoreTypeEnterprise {
  КорневыеСертификаты = "КорневыеСертификаты",
  ПерсональныеСертификаты = "ПерсональныеСертификаты",
  СертификатыПолучателей = "СертификатыПолучателей",
  СертификатыУдостоверяющихЦентров = "СертификатыУдостоверяющихЦентров",
}

export enum CryptoInteractiveModeUse {
  Use = "Use",
  DontUse = "DontUse",
}

export enum CryptoInteractiveModeUseEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum FormattedDocumentFileType {
  ANSITXT = "ANSITXT",
  HTML = "HTML",
  PDF = "PDF",
  TXT = "TXT",
}

export enum FormattedDocumentFileTypeEnterprise {
  ANSITXT = "ANSITXT",
  HTML = "HTML",
  PDF = "PDF",
  TXT = "TXT",
}

export enum FormattedDocumentParagraphType {
  BulletedList = "BulletedList",
  NumberedList = "NumberedList",
  Usual = "Usual",
}

export enum FormattedDocumentParagraphTypeEnterprise {
  МаркированныйСписок = "МаркированныйСписок",
  НумерованныйСписок = "НумерованныйСписок",
  Обычный = "Обычный",
}

export enum RowGotoDirection {
  Up = "Up",
  Down = "Down",
}

export enum RowGotoDirectionEnterprise {
  Вверх = "Вверх",
  Вниз = "Вниз",
}

export enum InternetMailAttachmentEncodingMode {
  MIME = "MIME",
  UUEncode = "UUEncode",
}

export enum InternetMailAttachmentEncodingModeEnterprise {
  MIME = "MIME",
  UUEncode = "UUEncode",
}

export enum InternetMailMessageImportance {
  High = "High",
  Highest = "Highest",
  Lowest = "Lowest",
  Low = "Low",
  Normal = "Normal",
}

export enum InternetMailMessageImportanceEnterprise {
  Высокая = "Высокая",
  Наивысшая = "Наивысшая",
  Наименьшая = "Наименьшая",
  Низкая = "Низкая",
  Обычная = "Обычная",
}

export enum InternetMailMessageNonASCIISymbolsEncodingMode {
  MIME = "MIME",
  QuotedPrintable = "QuotedPrintable",
  None = "None",
}

export enum InternetMailMessageNonASCIISymbolsEncodingModeEnterprise {
  MIME = "MIME",
  QuotedPrintable = "QuotedPrintable",
  БезКодирования = "БезКодирования",
}

export enum InternetMailMessageParseStatus {
  ErrorsDetected = "ErrorsDetected",
  ErrorsNotDetected = "ErrorsNotDetected",
}

export enum InternetMailMessageParseStatusEnterprise {
  ОбнаруженыОшибки = "ОбнаруженыОшибки",
  ОшибокНеОбнаружено = "ОшибокНеОбнаружено",
}

export enum InternetMailProtocol {
  IMAP = "IMAP",
  POP3 = "POP3",
  SMTP = "SMTP",
}

export enum InternetMailProtocolEnterprise {
  IMAP = "IMAP",
  POP3 = "POP3",
  SMTP = "SMTP",
}

export enum InternetMailTextProcessing {
  DontProcess = "DontProcess",
  Process = "Process",
}

export enum InternetMailTextProcessingEnterprise {
  НеОбрабатывать = "НеОбрабатывать",
  Обрабатывать = "Обрабатывать",
}

export enum InternetMailTextType {
  HTML = "HTML",
  CustomText = "CustomText",
  PlainText = "PlainText",
  RichText = "RichText",
}

export enum InternetMailTextTypeEnterprise {
  HTML = "HTML",
  ПроизвольныйТекст = "ПроизвольныйТекст",
  ПростойТекст = "ПростойТекст",
  РазмеченныйТекст = "РазмеченныйТекст",
}

export enum POP3AuthenticationMode {
  APOP = "APOP",
  CramMD5 = "CramMD5",
  General = "General",
}

export enum POP3AuthenticationModeEnterprise {
  APOP = "APOP",
  CramMD5 = "CramMD5",
  Обычная = "Обычная",
}

export enum SMTPAuthenticationMode {
  CramMD5 = "CramMD5",
  Login = "Login",
  Plain = "Plain",
  None = "None",
  Default = "Default",
}

export enum SMTPAuthenticationModeEnterprise {
  CramMD5 = "CramMD5",
  Login = "Login",
  Plain = "Plain",
  БезАутентификации = "БезАутентификации",
  ПоУмолчанию = "ПоУмолчанию",
}

export enum UseInternetMailTokenAuthentication {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum UseInternetMailTokenAuthenticationEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum QueryBuilderDimensionType {
  Hierarchy = "Hierarchy",
  HierarchyOnly = "HierarchyOnly",
  Items = "Items",
}

export enum QueryBuilderDimensionTypeEnterprise {
  Иерархия = "Иерархия",
  ТолькоИерархия = "ТолькоИерархия",
  Элементы = "Элементы",
}

export enum AddInConnectionType {
  Isolated = "Isolated",
  NotIsolated = "NotIsolated",
}

export enum AddInConnectionTypeEnterprise {
  Изолированно = "Изолированно",
  НеИзолированно = "НеИзолированно",
}

export enum AddInType {
  COM = "COM",
  Native = "Native",
}

export enum AddInTypeEnterprise {
  COM = "COM",
  Native = "Native",
}

export enum AllowedLength {
  Variable = "Variable",
  Fixed = "Fixed",
}

export enum AllowedLengthEnterprise {
  Переменная = "Переменная",
  Фиксированная = "Фиксированная",
}

export enum AllowedSign {
  Any = "Any",
  Nonnegative = "Nonnegative",
}

export enum AllowedSignEnterprise {
  Любой = "Любой",
  Неотрицательный = "Неотрицательный",
}

export enum ApplicationFormsOpenningMode {
  Tabs = "Tabs",
  SingleWindows = "SingleWindows",
}

export enum ApplicationFormsOpenningModeEnterprise {
  Закладки = "Закладки",
  ОтдельныеОкна = "ОтдельныеОкна",
}

export enum BorderType {
  Absolute = "Absolute",
  StyleItem = "StyleItem",
}

export enum BorderTypeEnterprise {
  Абсолютная = "Абсолютная",
  ЭлементСтиля = "ЭлементСтиля",
}

export enum BoundaryType {
  Including = "Including",
  Excluding = "Excluding",
}

export enum BoundaryTypeEnterprise {
  Включая = "Включая",
  Исключая = "Исключая",
}

export enum ByteOrderMarkUse {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum ByteOrderMarkUseEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ClientApplicationBaseFontVariant {
  Large = "Large",
  Normal = "Normal",
}

export enum ClientApplicationBaseFontVariantEnterprise {
  Крупный = "Крупный",
  Обычный = "Обычный",
}

export enum ClientApplicationFormScaleVariant {
  Auto = "Auto",
  Compact = "Compact",
  Normal = "Normal",
}

export enum ClientApplicationFormScaleVariantEnterprise {
  Авто = "Авто",
  Компактный = "Компактный",
  Обычный = "Обычный",
}

export enum ClientApplicationInterfaceVariant {
  Version8_2 = "Version8_2",
  Taxi = "Taxi",
}

export enum ClientApplicationInterfaceVariantEnterprise {
  Версия8_2 = "Версия8_2",
  Такси = "Такси",
}

export enum ClientApplicationType {
  WebClient = "WebClient",
  ExternalConnection = "ExternalConnection",
  MobileAppClient = "MobileAppClient",
  MobileClient = "MobileClient",
  ThickClient = "ThickClient",
  ThinClient = "ThinClient",
}

export enum ClientApplicationTypeEnterprise {
  ВебКлиент = "ВебКлиент",
  ВнешнееСоединение = "ВнешнееСоединение",
  МобильноеПриложениеКлиент = "МобильноеПриложениеКлиент",
  МобильныйКлиент = "МобильныйКлиент",
  ТолстыйКлиент = "ТолстыйКлиент",
  ТонкийКлиент = "ТонкийКлиент",
}

export enum ClientConnectionSpeed {
  Low = "Low",
  Normal = "Normal",
}

export enum ClientConnectionSpeedEnterprise {
  Низкая = "Низкая",
  Обычная = "Обычная",
}

export enum ClientRunMode {
  Auto = "Auto",
  OrdinaryApplication = "OrdinaryApplication",
  ManagedApplication = "ManagedApplication",
}

export enum ClientRunModeEnterprise {
  Авто = "Авто",
  ОбычноеПриложение = "ОбычноеПриложение",
  УправляемоеПриложение = "УправляемоеПриложение",
}

export enum ColorType {
  WebColor = "WebColor",
  WindowsColor = "WindowsColor",
  Absolute = "Absolute",
  AutoColor = "AutoColor",
  StyleItem = "StyleItem",
}

export enum ColorTypeEnterprise {
  WebЦвет = "WebЦвет",
  WindowsЦвет = "WindowsЦвет",
  Абсолютный = "Абсолютный",
  АвтоЦвет = "АвтоЦвет",
  ЭлементСтиля = "ЭлементСтиля",
}

export enum ComparisonType {
  Greater = "Greater",
  GreaterOrEqual = "GreaterOrEqual",
  InHierarchy = "InHierarchy",
  InList = "InList",
  InListByHierarchy = "InListByHierarchy",
  Interval = "Interval",
  IntervalIncludingBounds = "IntervalIncludingBounds",
  IntervalIncludingLowerBound = "IntervalIncludingLowerBound",
  IntervalIncludingUpperBound = "IntervalIncludingUpperBound",
  Less = "Less",
  LessOrEqual = "LessOrEqual",
  NotInHierarchy = "NotInHierarchy",
  NotInList = "NotInList",
  NotInListByHierarchy = "NotInListByHierarchy",
  NotEqual = "NotEqual",
  NotContains = "NotContains",
  Equal = "Equal",
  Contains = "Contains",
}

export enum ComparisonTypeEnterprise {
  Больше = "Больше",
  БольшеИлиРавно = "БольшеИлиРавно",
  ВИерархии = "ВИерархии",
  ВСписке = "ВСписке",
  ВСпискеПоИерархии = "ВСпискеПоИерархии",
  Интервал = "Интервал",
  ИнтервалВключаяГраницы = "ИнтервалВключаяГраницы",
  ИнтервалВключаяНачало = "ИнтервалВключаяНачало",
  ИнтервалВключаяОкончание = "ИнтервалВключаяОкончание",
  Меньше = "Меньше",
  МеньшеИлиРавно = "МеньшеИлиРавно",
  НеВИерархии = "НеВИерархии",
  НеВСписке = "НеВСписке",
  НеВСпискеПоИерархии = "НеВСпискеПоИерархии",
  НеРавно = "НеРавно",
  НеСодержит = "НеСодержит",
  Равно = "Равно",
  Содержит = "Содержит",
}

export enum CompositeWordsSeparationMode {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum CompositeWordsSeparationModeEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ConfigurationExtensionApplicationIssueSeverity {
  Critical = "Critical",
  Low = "Low",
  Moderate = "Moderate",
}

export enum ConfigurationExtensionApplicationIssueSeverityEnterprise {
  Критичная = "Критичная",
  Низкая = "Низкая",
  Обычная = "Обычная",
}

export enum ConfigurationExtensionScope {
  InfoBase = "InfoBase",
  DataSeparation = "DataSeparation",
}

export enum ConfigurationExtensionScopeEnterprise {
  ИнформационнаяБаза = "ИнформационнаяБаза",
  РазделениеДанных = "РазделениеДанных",
}

export enum ConfigurationExtensionsSource {
  Database = "Database",
  SessionApplied = "SessionApplied",
  SessionDisabled = "SessionDisabled",
}

export enum ConfigurationExtensionsSourceEnterprise {
  БазаДанных = "БазаДанных",
  СеансАктивные = "СеансАктивные",
  СеансОтключенные = "СеансОтключенные",
}

export enum DataBaseConfigurationUpdateExecutionInformationItemType {
  Information = "Information",
  Error = "Error",
  Warning = "Warning",
}

export enum DataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise {
  Информация = "Информация",
  Ошибка = "Ошибка",
  Предупреждение = "Предупреждение",
}

export enum DataBaseConfigurationUpdateState {
  RefreshInProgress = "RefreshInProgress",
  ProcessingInProgress = "ProcessingInProgress",
  NotActive = "NotActive",
}

export enum DataBaseConfigurationUpdateStateEnterprise {
  ВыполняетсяАктуализация = "ВыполняетсяАктуализация",
  ВыполняетсяОбработка = "ВыполняетсяОбработка",
  Неактивно = "Неактивно",
}

export enum DatabaseTablespacesUseMode {
  Use = "Use",
  DontUse = "DontUse",
}

export enum DatabaseTablespacesUseModeEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum DateFractions {
  Time = "Time",
  Date = "Date",
  DateTime = "DateTime",
}

export enum DateFractionsEnterprise {
  Время = "Время",
  Дата = "Дата",
  ДатаВремя = "ДатаВремя",
}

export enum DialogReturnCode {
  Yes = "Yes",
  No = "No",
  OK = "OK",
  Cancel = "Cancel",
  Retry = "Retry",
  Abort = "Abort",
  Ignore = "Ignore",
  Timeout = "Timeout",
}

export enum DialogReturnCodeEnterprise {
  Да = "Да",
  Нет = "Нет",
  ОК = "ОК",
  Отмена = "Отмена",
  Повторить = "Повторить",
  Прервать = "Прервать",
  Пропустить = "Пропустить",
  Таймаут = "Таймаут",
}

export enum DynamicListKeyType {
  Auto = "Auto",
  FieldValue = "FieldValue",
  RowKey = "RowKey",
  RowNumber = "RowNumber",
}

export enum DynamicListKeyTypeEnterprise {
  Авто = "Авто",
  ЗначениеПоля = "ЗначениеПоля",
  КлючСтроки = "КлючСтроки",
  НомерСтроки = "НомерСтроки",
}

export enum EnterKeyBehaviorType {
  DefaultButton = "DefaultButton",
  ControlNavigation = "ControlNavigation",
}

export enum EnterKeyBehaviorTypeEnterprise {
  КнопкаПоУмолчанию = "КнопкаПоУмолчанию",
  ПереходПоЭлементамФормы = "ПереходПоЭлементамФормы",
}

export enum ExternalDataSourceState {
  Disconnected = "Disconnected",
  Connected = "Connected",
}

export enum ExternalDataSourceStateEnterprise {
  Отключен = "Отключен",
  Подключен = "Подключен",
}

export enum FillChecking {
  ShowError = "ShowError",
  DontCheck = "DontCheck",
}

export enum FillCheckingEnterprise {
  ВыдаватьОшибку = "ВыдаватьОшибку",
  НеПроверять = "НеПроверять",
}

export enum FontType {
  WindowsFont = "WindowsFont",
  Absolute = "Absolute",
  AutoFont = "AutoFont",
  StyleItem = "StyleItem",
}

export enum FontTypeEnterprise {
  WindowsШрифт = "WindowsШрифт",
  Абсолютный = "Абсолютный",
  АвтоШрифт = "АвтоШрифт",
  ЭлементСтиля = "ЭлементСтиля",
}

export enum FullTextSearchMetadataUse {
  Use = "Use",
  DontUse = "DontUse",
}

export enum FullTextSearchMetadataUseEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum FullTextSearchMode {
  Disable = "Disable",
  Enable = "Enable",
}

export enum FullTextSearchModeEnterprise {
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum FullTextSearchRepresentationType {
  HTMLText = "HTMLText",
  XML = "XML",
}

export enum FullTextSearchRepresentationTypeEnterprise {
  HTMLТекст = "HTMLТекст",
  XML = "XML",
}

export enum FullTextSearchVersion {
  Version1 = "Version1",
  Version2 = "Version2",
}

export enum FullTextSearchVersionEnterprise {
  Версия1 = "Версия1",
  Версия2 = "Версия2",
}

export enum HashFunction {
  CRC32 = "CRC32",
  MD5 = "MD5",
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum HashFunctionEnterprise {
  CRC32 = "CRC32",
  MD5 = "MD5",
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum InterfaceCompatibilityMode {
  Version8_2 = "Version8_2",
  Version8_2EnableTaxi = "Version8_2EnableTaxi",
  Taxi = "Taxi",
  TaxiEnableVersion8_2 = "TaxiEnableVersion8_2",
}

export enum InterfaceCompatibilityModeEnterprise {
  Версия8_2 = "Версия8_2",
  Версия8_2РазрешитьТакси = "Версия8_2РазрешитьТакси",
  Такси = "Такси",
  ТаксиРазрешитьВерсия8_2 = "ТаксиРазрешитьВерсия8_2",
}

export enum IntervalBoundVariant {
  WithoutRestriction = "WithoutRestriction",
  Year = "Year",
  Quarter = "Quarter",
  SpecificDate = "SpecificDate",
  Month = "Month",
  Week = "Week",
  WorkingDate = "WorkingDate",
  BeforeAfter = "BeforeAfter",
}

export enum IntervalBoundVariantEnterprise {
  БезОграничения = "БезОграничения",
  Год = "Год",
  Квартал = "Квартал",
  КонкретнаяДата = "КонкретнаяДата",
  Месяц = "Месяц",
  Неделя = "Неделя",
  РабочаяДата = "РабочаяДата",
  Смещение = "Смещение",
}

export enum Key {
  BackSpace = "BackSpace",
  Break = "Break",
  NumAdd = "NumAdd",
  NumDecimal = "NumDecimal",
  NumDivide = "NumDivide",
  NumMultiply = "NumMultiply",
  NumSubtract = "NumSubtract",
  Space = "Space",
  None = "None",
}

export enum KeyEnterprise {
  BackSpace = "BackSpace",
  Break = "Break",
  NumAdd = "NumAdd",
  NumDecimal = "NumDecimal",
  NumDivide = "NumDivide",
  NumMultiply = "NumMultiply",
  NumSubtract = "NumSubtract",
  Space = "Space",
  Нет = "Нет",
}

export enum LocationRelativeToGeofence {
  Inside = "Inside",
  Outside = "Outside",
}

export enum LocationRelativeToGeofenceEnterprise {
  Внутри = "Внутри",
  Снаружи = "Снаружи",
}

export enum MessageStatus {
  WithoutStatus = "WithoutStatus",
  Important = "Important",
  Attention = "Attention",
  Information = "Information",
  Ordinary = "Ordinary",
  VeryImportant = "VeryImportant",
}

export enum MessageStatusEnterprise {
  БезСтатуса = "БезСтатуса",
  Важное = "Важное",
  Внимание = "Внимание",
  Информация = "Информация",
  Обычное = "Обычное",
  ОченьВажное = "ОченьВажное",
}

export enum MobileApplicationFunctionalities {
  BluetoothPrinters = "BluetoothPrinters",
  NFC = "NFC",
  PushNotifications = "PushNotifications",
  WiFiPrinters = "WiFiPrinters",
  AutoSendSMS = "AutoSendSMS",
  MusicLibrary = "MusicLibrary",
  PictureAndVideoLibraries = "PictureAndVideoLibraries",
  Biometrics = "Biometrics",
  Videoconferences = "Videoconferences",
  AudioPlaybackAndVibration = "AudioPlaybackAndVibration",
  BackgroundAudioPlaybackAndVibration = "BackgroundAudioPlaybackAndVibration",
  InAppPurchases = "InAppPurchases",
  IncomingShareRequests = "IncomingShareRequests",
  Geofences = "Geofences",
  Location = "Location",
  BackgroundLocation = "BackgroundLocation",
  AllFilesAccess = "AllFilesAccess",
  SMSLog = "SMSLog",
  CallLog = "CallLog",
  BackgroundAudioRecording = "BackgroundAudioRecording",
  Calendars = "Calendars",
  Camera = "Camera",
  Contacts = "Contacts",
  LocalNotifications = "LocalNotifications",
  Microphone = "Microphone",
  NumberDialing = "NumberDialing",
  PersonalComputerFileExchange = "PersonalComputerFileExchange",
  AllIncomingShareRequestsTypesProcessing = "AllIncomingShareRequestsTypesProcessing",
  CallProcessing = "CallProcessing",
  ReceiveSMS = "ReceiveSMS",
  SpeechToText = "SpeechToText",
  OSBackup = "OSBackup",
  Ads = "Ads",
  TextToSpeech = "TextToSpeech",
  DocumentScanning = "DocumentScanning",
  BarcodeScanning = "BarcodeScanning",
  ApplicationUsageStatistics = "ApplicationUsageStatistics",
  InstallPackages = "InstallPackages",
}

export enum MobileApplicationFunctionalitiesEnterprise {
  BluetoothПринтеры = "BluetoothПринтеры",
  NFC = "NFC",
  PushУведомления = "PushУведомления",
  WiFiПринтеры = "WiFiПринтеры",
  АвтоматическаяОтправкаSMSСообщений = "АвтоматическаяОтправкаSMSСообщений",
  БиблиотекаМузыки = "БиблиотекаМузыки",
  БиблиотекиКартинокИВидео = "БиблиотекиКартинокИВидео",
  Биометрия = "Биометрия",
  Видеоконференции = "Видеоконференции",
  ВоспроизведениеАудиоИВибрация = "ВоспроизведениеАудиоИВибрация",
  ВоспроизведениеАудиоИВибрацияВФоновомРежиме = "ВоспроизведениеАудиоИВибрацияВФоновомРежиме",
  ВстроенныеПокупки = "ВстроенныеПокупки",
  ВходящиеЗапросыПоделиться = "ВходящиеЗапросыПоделиться",
  Геозоны = "Геозоны",
  Геопозиционирование = "Геопозиционирование",
  ГеопозиционированиеВФоновомРежиме = "ГеопозиционированиеВФоновомРежиме",
  ДоступКоВсемФайлам = "ДоступКоВсемФайлам",
  ЖурналSMS = "ЖурналSMS",
  ЖурналЗвонков = "ЖурналЗвонков",
  ЗаписьАудиоВФоновомРежиме = "ЗаписьАудиоВФоновомРежиме",
  Календари = "Календари",
  Камера = "Камера",
  Контакты = "Контакты",
  ЛокальныеУведомления = "ЛокальныеУведомления",
  Микрофон = "Микрофон",
  НаборНомера = "НаборНомера",
  ОбменФайламиСПерсональнымКомпьютером = "ОбменФайламиСПерсональнымКомпьютером",
  ОбработкаВсехТиповВходящихЗапросовПоделиться = "ОбработкаВсехТиповВходящихЗапросовПоделиться",
  ОбработкаЗвонков = "ОбработкаЗвонков",
  ПолучениеSMS = "ПолучениеSMS",
  РаспознаваниеРечи = "РаспознаваниеРечи",
  РезервноеКопированиеСредствамиОС = "РезервноеКопированиеСредствамиОС",
  Реклама = "Реклама",
  СинтезРечи = "СинтезРечи",
  СканированиеДокументов = "СканированиеДокументов",
  СканированиеШтрихКодов = "СканированиеШтрихКодов",
  СтатистикаИспользованияПриложения = "СтатистикаИспользованияПриложения",
  УстановкаПриложений = "УстановкаПриложений",
}

export enum NumericValueType {
  Cardinal = "Cardinal",
  Ordinal = "Ordinal",
}

export enum NumericValueTypeEnterprise {
  Количественное = "Количественное",
  Порядковое = "Порядковое",
}

export enum PasswordPolicyComplianceCheckResult {
  DoesNotSatisfyMinLengthRequirements = "DoesNotSatisfyMinLengthRequirements",
  DoesNotSatisfyReuseLimitRequirements = "DoesNotSatisfyReuseLimitRequirements",
  DoesNotSatisfyCompromiseCheckRequirements = "DoesNotSatisfyCompromiseCheckRequirements",
  DoesNotSatisfyComplexityRequirements = "DoesNotSatisfyComplexityRequirements",
}

export enum PasswordPolicyComplianceCheckResultEnterprise {
  НеСоответствуетТребованиямМинимальнойДлины = "НеСоответствуетТребованиямМинимальнойДлины",
  НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних = "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних",
  НеСоответствуетТребованиямПроверкиРаскрытия = "НеСоответствуетТребованиямПроверкиРаскрытия",
  НеСоответствуетТребованиямСложности = "НеСоответствуетТребованиямСложности",
}

export enum PeriodSettingsVariant {
  Interval = "Interval",
  Period = "Period",
}

export enum PeriodSettingsVariantEnterprise {
  Интервал = "Интервал",
  Период = "Период",
}

export enum PeriodVariant {
  Year = "Year",
  Day = "Day",
  DayFromBegOfYear = "DayFromBegOfYear",
  DayFromBegOfQuarter = "DayFromBegOfQuarter",
  DayFromBegOfMonth = "DayFromBegOfMonth",
  Quarter = "Quarter",
  QuarterFromBegOfYear = "QuarterFromBegOfYear",
  Month = "Month",
  MonthFromBegOfYear = "MonthFromBegOfYear",
  MonthFromBegOfQuarter = "MonthFromBegOfQuarter",
  AnyInterval = "AnyInterval",
}

export enum PeriodVariantEnterprise {
  Год = "Год",
  День = "День",
  ДеньСНачалаГода = "ДеньСНачалаГода",
  ДеньСНачалаКвартала = "ДеньСНачалаКвартала",
  ДеньСНачалаМесяца = "ДеньСНачалаМесяца",
  Квартал = "Квартал",
  КварталСНачалаГода = "КварталСНачалаГода",
  Месяц = "Месяц",
  МесяцСНачалаГода = "МесяцСНачалаГода",
  МесяцСНачалаКвартала = "МесяцСНачалаКвартала",
  ПроизвольныйИнтервал = "ПроизвольныйИнтервал",
}

export enum PictureType {
  Absolute = "Absolute",
  FromLib = "FromLib",
  Empty = "Empty",
}

export enum PictureTypeEnterprise {
  Абсолютная = "Абсолютная",
  ИзБиблиотеки = "ИзБиблиотеки",
  Пустая = "Пустая",
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

export enum PlatformTypeEnterprise {
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
  YesNo = "YesNo",
  YesNoCancel = "YesNoCancel",
  OK = "OK",
  OKCancel = "OKCancel",
  RetryCancel = "RetryCancel",
  AbortRetryIgnore = "AbortRetryIgnore",
}

export enum QuestionDialogModeEnterprise {
  ДаНет = "ДаНет",
  ДаНетОтмена = "ДаНетОтмена",
  ОК = "ОК",
  ОКОтмена = "ОКОтмена",
  ПовторитьОтмена = "ПовторитьОтмена",
  ПрерватьПовторитьПропустить = "ПрерватьПовторитьПропустить",
}

export enum ReplacementMode {
  Append = "Append",
  Replace = "Replace",
  Update = "Update",
  Merge = "Merge",
  Delete = "Delete",
}

export enum ReplacementModeEnterprise {
  Добавление = "Добавление",
  Замещение = "Замещение",
  Обновление = "Обновление",
  Слияние = "Слияние",
  Удаление = "Удаление",
}

export enum RoundMode {
  Round15as10 = "Round15as10",
  Round15as20 = "Round15as20",
}

export enum RoundModeEnterprise {
  Окр15как10 = "Окр15как10",
  Окр15как20 = "Окр15как20",
}

export enum SearchDirection {
  FromEnd = "FromEnd",
  FromBegin = "FromBegin",
}

export enum SearchDirectionEnterprise {
  СКонца = "СКонца",
  СНачала = "СНачала",
}

export enum SectionsPanelRepresentation {
  Picture = "Picture",
  PictureAndText = "PictureAndText",
  PictureOnTopAndText = "PictureOnTopAndText",
  PictureOnLeftAndText = "PictureOnLeftAndText",
  Text = "Text",
}

export enum SectionsPanelRepresentationEnterprise {
  Картинка = "Картинка",
  КартинкаИТекст = "КартинкаИТекст",
  КартинкаСверхуИТекст = "КартинкаСверхуИТекст",
  КартинкаСлеваИТекст = "КартинкаСлеваИТекст",
  Текст = "Текст",
}

export enum SortDirection {
  Asc = "Asc",
  Desc = "Desc",
}

export enum SortDirectionEnterprise {
  Возр = "Возр",
  Убыв = "Убыв",
}

export enum StandardBeginningDateVariant {
  BeginningOfLastYear = "BeginningOfLastYear",
  BeginningOfLastDay = "BeginningOfLastDay",
  BeginningOfLastQuarter = "BeginningOfLastQuarter",
  BeginningOfLastMonth = "BeginningOfLastMonth",
  BeginningOfLastHalfYear = "BeginningOfLastHalfYear",
  BeginningOfLastTenDays = "BeginningOfLastTenDays",
  BeginningOfLastWeek = "BeginningOfLastWeek",
  BeginningOfNextYear = "BeginningOfNextYear",
  BeginningOfNextDay = "BeginningOfNextDay",
  BeginningOfNextQuarter = "BeginningOfNextQuarter",
  BeginningOfNextMonth = "BeginningOfNextMonth",
  BeginningOfNextHalfYear = "BeginningOfNextHalfYear",
  BeginningOfNextTenDays = "BeginningOfNextTenDays",
  BeginningOfNextWeek = "BeginningOfNextWeek",
  BeginningOfThisYear = "BeginningOfThisYear",
  BeginningOfThisDay = "BeginningOfThisDay",
  BeginningOfThisQuarter = "BeginningOfThisQuarter",
  BeginningOfThisMonth = "BeginningOfThisMonth",
  BeginningOfThisHalfYear = "BeginningOfThisHalfYear",
  BeginningOfThisTenDays = "BeginningOfThisTenDays",
  BeginningOfThisWeek = "BeginningOfThisWeek",
  Custom = "Custom",
}

export enum StandardBeginningDateVariantEnterprise {
  НачалоПрошлогоГода = "НачалоПрошлогоГода",
  НачалоПрошлогоДня = "НачалоПрошлогоДня",
  НачалоПрошлогоКвартала = "НачалоПрошлогоКвартала",
  НачалоПрошлогоМесяца = "НачалоПрошлогоМесяца",
  НачалоПрошлогоПолугодия = "НачалоПрошлогоПолугодия",
  НачалоПрошлойДекады = "НачалоПрошлойДекады",
  НачалоПрошлойНедели = "НачалоПрошлойНедели",
  НачалоСледующегоГода = "НачалоСледующегоГода",
  НачалоСледующегоДня = "НачалоСледующегоДня",
  НачалоСледующегоКвартала = "НачалоСледующегоКвартала",
  НачалоСледующегоМесяца = "НачалоСледующегоМесяца",
  НачалоСледующегоПолугодия = "НачалоСледующегоПолугодия",
  НачалоСледующейДекады = "НачалоСледующейДекады",
  НачалоСледующейНедели = "НачалоСледующейНедели",
  НачалоЭтогоГода = "НачалоЭтогоГода",
  НачалоЭтогоДня = "НачалоЭтогоДня",
  НачалоЭтогоКвартала = "НачалоЭтогоКвартала",
  НачалоЭтогоМесяца = "НачалоЭтогоМесяца",
  НачалоЭтогоПолугодия = "НачалоЭтогоПолугодия",
  НачалоЭтойДекады = "НачалоЭтойДекады",
  НачалоЭтойНедели = "НачалоЭтойНедели",
  ПроизвольнаяДата = "ПроизвольнаяДата",
}

export enum StandardGlobalSearchType {
  AllFunctions = "AllFunctions",
  Expression = "Expression",
  GlobalStandardCommands = "GlobalStandardCommands",
  Data = "Data",
  UserWorkFavorites = "UserWorkFavorites",
  UserWorkHistory = "UserWorkHistory",
  FunctionMenu = "FunctionMenu",
  URL = "URL",
  CollaborationSystemConversations = "CollaborationSystemConversations",
  CollaborationSystemMessages = "CollaborationSystemMessages",
  Help = "Help",
  FunctionsForTechnicalSpecialist = "FunctionsForTechnicalSpecialist",
}

export enum StandardGlobalSearchTypeEnterprise {
  ВсеФункции = "ВсеФункции",
  Выражение = "Выражение",
  ГлобальныеСтандартныеКоманды = "ГлобальныеСтандартныеКоманды",
  Данные = "Данные",
  ИзбранноеРаботыПользователя = "ИзбранноеРаботыПользователя",
  ИсторияРаботыПользователя = "ИсторияРаботыПользователя",
  МенюФункций = "МенюФункций",
  НавигационнаяСсылка = "НавигационнаяСсылка",
  ОбсужденияСистемыВзаимодействия = "ОбсужденияСистемыВзаимодействия",
  СообщенияСистемыВзаимодействия = "СообщенияСистемыВзаимодействия",
  Справка = "Справка",
  ФункцииДляТехническогоСпециалиста = "ФункцииДляТехническогоСпециалиста",
}

export enum StandardPeriodVariant {
  Yesterday = "Yesterday",
  TillEndOfThisYear = "TillEndOfThisYear",
  TillEndOfThisQuarter = "TillEndOfThisQuarter",
  TillEndOfThisMonth = "TillEndOfThisMonth",
  TillEndOfThisHalfYear = "TillEndOfThisHalfYear",
  TillEndOfThisTenDays = "TillEndOfThisTenDays",
  TillEndOfThisWeek = "TillEndOfThisWeek",
  Tomorrow = "Tomorrow",
  Month = "Month",
  Last7Days = "Last7Days",
  Custom = "Custom",
  LastTenDays = "LastTenDays",
  LastTenDaysTillSameDayNumber = "LastTenDaysTillSameDayNumber",
  LastWeek = "LastWeek",
  LastWeekTillSameWeekDay = "LastWeekTillSameWeekDay",
  LastHalfYear = "LastHalfYear",
  LastHalfYearTillSameDate = "LastHalfYearTillSameDate",
  LastYear = "LastYear",
  LastYearTillSameDate = "LastYearTillSameDate",
  LastQuarter = "LastQuarter",
  LastQuarterTillSameDate = "LastQuarterTillSameDate",
  LastMonth = "LastMonth",
  LastMonthTillSameDate = "LastMonthTillSameDate",
  Today = "Today",
  NextTenDays = "NextTenDays",
  NextTenDaysTillSameDayNumber = "NextTenDaysTillSameDayNumber",
  NextWeek = "NextWeek",
  NextWeekTillSameWeekDay = "NextWeekTillSameWeekDay",
  NextHalfYear = "NextHalfYear",
  NextHalfYearTillSameDate = "NextHalfYearTillSameDate",
  Next7Days = "Next7Days",
  NextYear = "NextYear",
  NextYearTillSameDate = "NextYearTillSameDate",
  NextQuarter = "NextQuarter",
  NextQuarterTillSameDate = "NextQuarterTillSameDate",
  NextMonth = "NextMonth",
  NextMonthTillSameDate = "NextMonthTillSameDate",
  FromBeginningOfThisYear = "FromBeginningOfThisYear",
  FromBeginningOfThisQuarter = "FromBeginningOfThisQuarter",
  FromBeginningOfThisMonth = "FromBeginningOfThisMonth",
  FromBeginningOfThisHalfYear = "FromBeginningOfThisHalfYear",
  FromBeginningOfThisTenDays = "FromBeginningOfThisTenDays",
  FromBeginningOfThisWeek = "FromBeginningOfThisWeek",
  ThisTenDays = "ThisTenDays",
  ThisWeek = "ThisWeek",
  ThisHalfYear = "ThisHalfYear",
  ThisYear = "ThisYear",
  ThisQuarter = "ThisQuarter",
  ThisMonth = "ThisMonth",
}

export enum StandardPeriodVariantEnterprise {
  Вчера = "Вчера",
  ДоКонцаЭтогоГода = "ДоКонцаЭтогоГода",
  ДоКонцаЭтогоКвартала = "ДоКонцаЭтогоКвартала",
  ДоКонцаЭтогоМесяца = "ДоКонцаЭтогоМесяца",
  ДоКонцаЭтогоПолугодия = "ДоКонцаЭтогоПолугодия",
  ДоКонцаЭтойДекады = "ДоКонцаЭтойДекады",
  ДоКонцаЭтойНедели = "ДоКонцаЭтойНедели",
  Завтра = "Завтра",
  Месяц = "Месяц",
  Последние7Дней = "Последние7Дней",
  ПроизвольныйПериод = "ПроизвольныйПериод",
  ПрошлаяДекада = "ПрошлаяДекада",
  ПрошлаяДекадаДоТакогоЖеНомераДня = "ПрошлаяДекадаДоТакогоЖеНомераДня",
  ПрошлаяНеделя = "ПрошлаяНеделя",
  ПрошлаяНеделяДоТакогоЖеДняНедели = "ПрошлаяНеделяДоТакогоЖеДняНедели",
  ПрошлоеПолугодие = "ПрошлоеПолугодие",
  ПрошлоеПолугодиеДоТакойЖеДаты = "ПрошлоеПолугодиеДоТакойЖеДаты",
  ПрошлыйГод = "ПрошлыйГод",
  ПрошлыйГодДоТакойЖеДаты = "ПрошлыйГодДоТакойЖеДаты",
  ПрошлыйКвартал = "ПрошлыйКвартал",
  ПрошлыйКварталДоТакойЖеДаты = "ПрошлыйКварталДоТакойЖеДаты",
  ПрошлыйМесяц = "ПрошлыйМесяц",
  ПрошлыйМесяцДоТакойЖеДаты = "ПрошлыйМесяцДоТакойЖеДаты",
  Сегодня = "Сегодня",
  СледующаяДекада = "СледующаяДекада",
  СледующаяДекадаДоТакогоЖеНомераДня = "СледующаяДекадаДоТакогоЖеНомераДня",
  СледующаяНеделя = "СледующаяНеделя",
  СледующаяНеделяДоТакогоЖеДняНедели = "СледующаяНеделяДоТакогоЖеДняНедели",
  СледующееПолугодие = "СледующееПолугодие",
  СледующееПолугодиеДоТакойЖеДаты = "СледующееПолугодиеДоТакойЖеДаты",
  Следующие7Дней = "Следующие7Дней",
  СледующийГод = "СледующийГод",
  СледующийГодДоТакойЖеДаты = "СледующийГодДоТакойЖеДаты",
  СледующийКвартал = "СледующийКвартал",
  СледующийКварталДоТакойЖеДаты = "СледующийКварталДоТакойЖеДаты",
  СледующийМесяц = "СледующийМесяц",
  СледующийМесяцДоТакойЖеДаты = "СледующийМесяцДоТакойЖеДаты",
  СНачалаЭтогоГода = "СНачалаЭтогоГода",
  СНачалаЭтогоКвартала = "СНачалаЭтогоКвартала",
  СНачалаЭтогоМесяца = "СНачалаЭтогоМесяца",
  СНачалаЭтогоПолугодия = "СНачалаЭтогоПолугодия",
  СНачалаЭтойДекады = "СНачалаЭтойДекады",
  СНачалаЭтойНедели = "СНачалаЭтойНедели",
  ЭтаДекада = "ЭтаДекада",
  ЭтаНеделя = "ЭтаНеделя",
  ЭтоПолугодие = "ЭтоПолугодие",
  ЭтотГод = "ЭтотГод",
  ЭтотКвартал = "ЭтотКвартал",
  ЭтотМесяц = "ЭтотМесяц",
}

export enum StringEncodingMethod {
  URLInURLEncoding = "URLInURLEncoding",
  URLEncoding = "URLEncoding",
}

export enum StringEncodingMethodEnterprise {
  URLВКодировкеURL = "URLВКодировкеURL",
  КодировкаURL = "КодировкаURL",
}

export enum TextEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
  UTF16 = "UTF16",
  UTF8 = "UTF8",
  System = "System",
}

export enum TextEncodingEnterprise {
  ANSI = "ANSI",
  OEM = "OEM",
  UTF16 = "UTF16",
  UTF8 = "UTF8",
  Системная = "Системная",
}

export enum TransactionsIsolationLevel {
  Auto = "Auto",
  RepeatableRead = "RepeatableRead",
  Serializable = "Serializable",
  ReadCommitted = "ReadCommitted",
  ReadUncommitted = "ReadUncommitted",
}

export enum TransactionsIsolationLevelEnterprise {
  Авто = "Авто",
  ПовторяемоеЧтение = "ПовторяемоеЧтение",
  Упорядочиваемость = "Упорядочиваемость",
  ЧтениеЗафиксированных = "ЧтениеЗафиксированных",
  ЧтениеНезафиксированных = "ЧтениеНезафиксированных",
}

export enum UUIDVersion {
  Version1 = "Version1",
  Version3 = "Version3",
  Version4 = "Version4",
  Version5 = "Version5",
}

export enum UUIDVersionEnterprise {
  Версия1 = "Версия1",
  Версия3 = "Версия3",
  Версия4 = "Версия4",
  Версия5 = "Версия5",
}

export enum UpdateOnDataChange {
  Auto = "Auto",
  DontUpdate = "DontUpdate",
}

export enum UpdateOnDataChangeEnterprise {
  Авто = "Авто",
  НеОбновлять = "НеОбновлять",
}

export enum UserPasswordHashAlgorithmType {
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum UserPasswordHashAlgorithmTypeEnterprise {
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export enum WorkingDateMode {
  UseCurrentDate = "UseCurrentDate",
  Assign = "Assign",
}

export enum WorkingDateModeEnterprise {
  ИспользоватьТекущуюДату = "ИспользоватьТекущуюДату",
  Назначать = "Назначать",
}

export enum XBaseEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
}

export enum XBaseEncodingEnterprise {
  ANSI = "ANSI",
  OEM = "OEM",
}

export enum CalendarEventRecurrence {
  Weekly = "Weekly",
  Yearly = "Yearly",
  Daily = "Daily",
  Monthly = "Monthly",
  Once = "Once",
}

export enum CalendarEventRecurrenceEnterprise {
  КаждуюНеделю = "КаждуюНеделю",
  КаждыйГод = "КаждыйГод",
  КаждыйДень = "КаждыйДень",
  КаждыйМесяц = "КаждыйМесяц",
  ОдинРаз = "ОдинРаз",
}

export enum ContactDataAddressType {
  Home = "Home",
  Other = "Other",
  Work = "Work",
}

export enum ContactDataAddressTypeEnterprise {
  Домашний = "Домашний",
  Другой = "Другой",
  Рабочий = "Рабочий",
}

export enum ContactDataEmailAddressType {
  Home = "Home",
  Other = "Other",
  Mobile = "Mobile",
  Work = "Work",
}

export enum ContactDataEmailAddressTypeEnterprise {
  Домашний = "Домашний",
  Другой = "Другой",
  Мобильный = "Мобильный",
  Рабочий = "Рабочий",
}

export enum ContactDataInstantMessagingAddressType {
  Home = "Home",
  Other = "Other",
  Work = "Work",
}

export enum ContactDataInstantMessagingAddressTypeEnterprise {
  Домашний = "Домашний",
  Другой = "Другой",
  Рабочий = "Рабочий",
}

export enum ContactDataPhoneNumberType {
  iPhone = "iPhone",
  Home = "Home",
  HomeFax = "HomeFax",
  Other = "Other",
  OtherFax = "OtherFax",
  Mobile = "Mobile",
  Main = "Main",
  Work = "Work",
  WorkMobile = "WorkMobile",
  WorkFax = "WorkFax",
}

export enum ContactDataPhoneNumberTypeEnterprise {
  iPhone = "iPhone",
  Домашний = "Домашний",
  ДомашнийФакс = "ДомашнийФакс",
  Другой = "Другой",
  ДругойФакс = "ДругойФакс",
  Мобильный = "Мобильный",
  Основной = "Основной",
  Рабочий = "Рабочий",
  РабочийМобильный = "РабочийМобильный",
  РабочийФакс = "РабочийФакс",
}

export enum ContactDataRelationshipType {
  Brother = "Brother",
  DomesticPartner = "DomesticPartner",
  Friend = "Friend",
  Other = "Other",
  Mother = "Mother",
  Father = "Father",
  Partner = "Partner",
  Assistant = "Assistant",
  Child = "Child",
  Parent = "Parent",
  Relative = "Relative",
  Manager = "Manager",
  Sister = "Sister",
  Spouse = "Spouse",
}

export enum ContactDataRelationshipTypeEnterprise {
  Брат = "Брат",
  ГражданскийСупруг = "ГражданскийСупруг",
  Друг = "Друг",
  Другой = "Другой",
  Мать = "Мать",
  Отец = "Отец",
  Партнер = "Партнер",
  Помощник = "Помощник",
  Ребенок = "Ребенок",
  Родитель = "Родитель",
  Родственник = "Родственник",
  Руководитель = "Руководитель",
  Сестра = "Сестра",
  Супруг = "Супруг",
}

export enum ContactDataURLType {
  FTP = "FTP",
  Blog = "Blog",
  Home = "Home",
  HomePage = "HomePage",
  Other = "Other",
  Profile = "Profile",
  Work = "Work",
}

export enum ContactDataURLTypeEnterprise {
  FTP = "FTP",
  Блог = "Блог",
  Домашний = "Домашний",
  ДомашняяСтраница = "ДомашняяСтраница",
  Другой = "Другой",
  Профиль = "Профиль",
  Рабочий = "Рабочий",
}

export enum CallLogCallType {
  Incoming = "Incoming",
  Outgoing = "Outgoing",
  Missed = "Missed",
}

export enum CallLogCallTypeEnterprise {
  Входящий = "Входящий",
  Исходящий = "Исходящий",
  Пропущенный = "Пропущенный",
}

export enum TelephonyToolsCallEventVariant {
  EndIncoming = "EndIncoming",
  EndOutgoing = "EndOutgoing",
  StartIncoming = "StartIncoming",
  StartOutgoing = "StartOutgoing",
  StartIncomingRinging = "StartIncomingRinging",
}

export enum TelephonyToolsCallEventVariantEnterprise {
  ЗавершениеВходящего = "ЗавершениеВходящего",
  ЗавершениеИсходящего = "ЗавершениеИсходящего",
  НачалоВходящего = "НачалоВходящего",
  НачалоИсходящего = "НачалоИсходящего",
  НачалоСигналаВходящего = "НачалоСигналаВходящего",
}

export enum TelephonyToolsSMSType {
  Queued = "Queued",
  Incoming = "Incoming",
  Outgoing = "Outgoing",
  Sent = "Sent",
  Failed = "Failed",
  Draft = "Draft",
}

export enum TelephonyToolsSMSTypeEnterprise {
  ВОчереди = "ВОчереди",
  Входящее = "Входящее",
  Исходящее = "Исходящее",
  Отправленное = "Отправленное",
  ОшибкаОтправки = "ОшибкаОтправки",
  Черновик = "Черновик",
}

export enum AudioRecordingChannelUse {
  Mono = "Mono",
  Stereo = "Stereo",
}

export enum AudioRecordingChannelUseEnterprise {
  Моно = "Моно",
  Стерео = "Стерео",
}

export enum AudioRecordingFormat {
  Mpeg4AAC = "Mpeg4AAC",
  WavPCM16bit = "WavPCM16bit",
}

export enum AudioRecordingFormatEnterprise {
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
  All = "All",
  Matrix = "Matrix",
  Linear = "Linear",
}

export enum BarcodeTypeEnterprise {
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
  Все = "Все",
  Двухмерный = "Двухмерный",
  Линейный = "Линейный",
}

export enum CameraLightingType {
  Auto = "Auto",
  Enable = "Enable",
  Disable = "Disable",
}

export enum CameraLightingTypeEnterprise {
  Авто = "Авто",
  Включена = "Включена",
  Выключена = "Выключена",
}

export enum DeviceCameraType {
  Auto = "Auto",
  Rear = "Rear",
  Front = "Front",
}

export enum DeviceCameraTypeEnterprise {
  Авто = "Авто",
  Задняя = "Задняя",
  Передняя = "Передняя",
}

export enum DocumentScanningCheckingQuality {
  DontCheck = "DontCheck",
  WarnBelowHigh = "WarnBelowHigh",
  WarnBelowMedium = "WarnBelowMedium",
  RequireHigh = "RequireHigh",
  RequireMediumWarnBelowHigh = "RequireMediumWarnBelowHigh",
}

export enum DocumentScanningCheckingQualityEnterprise {
  НеПроверять = "НеПроверять",
  ПредупреждатьНижеВысокого = "ПредупреждатьНижеВысокого",
  ПредупреждатьНижеСреднего = "ПредупреждатьНижеСреднего",
  ТребоватьВысокое = "ТребоватьВысокое",
  ТребоватьСреднееПредупреждатьНижеВысокого = "ТребоватьСреднееПредупреждатьНижеВысокого",
}

export enum DocumentScanningOrientationDetectionMode {
  Landscape = "Landscape",
  ByHorizontalTextLines = "ByHorizontalTextLines",
  ByFirstPageInSeries = "ByFirstPageInSeries",
  ByDocumentPosition = "ByDocumentPosition",
  Portrait = "Portrait",
}

export enum DocumentScanningOrientationDetectionModeEnterprise {
  Ландшафт = "Ландшафт",
  ПоГоризонтальнымСтрокамТекста = "ПоГоризонтальнымСтрокамТекста",
  ПоПервойСтраницеСерии = "ПоПервойСтраницеСерии",
  ПоРасположениюДокумента = "ПоРасположениюДокумента",
  Портрет = "Портрет",
}

export enum DocumentScanningProcessingFilter {
  None = "None",
  Text = "Text",
  TextWithPictures = "TextWithPictures",
}

export enum DocumentScanningProcessingFilterEnterprise {
  Нет = "Нет",
  Текст = "Текст",
  ТекстСКартинками = "ТекстСКартинками",
}

export enum MultimediaRecordingStopButtonPlacement {
  Auto = "Auto",
  Top = "Top",
  Left = "Left",
  LeftTop = "LeftTop",
  LeftBottom = "LeftBottom",
  None = "None",
  Bottom = "Bottom",
  Right = "Right",
  RightTop = "RightTop",
  RightBottom = "RightBottom",
}

export enum MultimediaRecordingStopButtonPlacementEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Лево = "Лево",
  ЛевоВерх = "ЛевоВерх",
  ЛевоНиз = "ЛевоНиз",
  Нет = "Нет",
  Низ = "Низ",
  Право = "Право",
  ПравоВерх = "ПравоВерх",
  ПравоНиз = "ПравоНиз",
}

export enum VideoQuality {
  Auto = "Auto",
  High = "High",
  Low = "Low",
}

export enum VideoQualityEnterprise {
  Авто = "Авто",
  Высокое = "Высокое",
  Низкое = "Низкое",
}

export enum QuerySchemaAvailableTableParameterType {
  Variant = "Variant",
  Value = "Value",
  Array = "Array",
  Order = "Order",
  FieldList = "FieldList",
  Where = "Where",
}

export enum QuerySchemaAvailableTableParameterTypeEnterprise {
  Вариант = "Вариант",
  Значение = "Значение",
  Массив = "Массив",
  Порядок = "Порядок",
  СписокПолей = "СписокПолей",
  Условие = "Условие",
}

export enum QuerySchemaJoinType {
  Inner = "Inner",
  LeftOuter = "LeftOuter",
  FullOuter = "FullOuter",
  RightOuter = "RightOuter",
}

export enum QuerySchemaJoinTypeEnterprise {
  Внутреннее = "Внутреннее",
  ЛевоеВнешнее = "ЛевоеВнешнее",
  ПолноеВнешнее = "ПолноеВнешнее",
  ПравоеВнешнее = "ПравоеВнешнее",
}

export enum QuerySchemaOrderDirection {
  Ascending = "Ascending",
  HierarchyAscending = "HierarchyAscending",
  Descending = "Descending",
  HierarchyDescending = "HierarchyDescending",
}

export enum QuerySchemaOrderDirectionEnterprise {
  ПоВозрастанию = "ПоВозрастанию",
  ПоВозрастаниюИерархии = "ПоВозрастаниюИерархии",
  ПоУбыванию = "ПоУбыванию",
  ПоУбываниюИерархии = "ПоУбываниюИерархии",
}

export enum QuerySchemaPeriodAdditionType {
  NoAddition = "NoAddition",
  Year = "Year",
  TenDays = "TenDays",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Minute = "Minute",
  Week = "Week",
  HalfYear = "HalfYear",
  Second = "Second",
  Hour = "Hour",
}

export enum QuerySchemaPeriodAdditionTypeEnterprise {
  БезДополнения = "БезДополнения",
  Год = "Год",
  Декада = "Декада",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Минута = "Минута",
  Неделя = "Неделя",
  Полугодие = "Полугодие",
  Секунда = "Секунда",
  Час = "Час",
}

export enum QuerySchemaTotalCalculationFieldType {
  Hierarchy = "Hierarchy",
  HierarchyOnly = "HierarchyOnly",
  Items = "Items",
}

export enum QuerySchemaTotalCalculationFieldTypeEnterprise {
  Иерархия = "Иерархия",
  ТолькоИерархия = "ТолькоИерархия",
  Элементы = "Элементы",
}

export enum QuerySchemaUnionType {
  Union = "Union",
  UnionAll = "UnionAll",
}

export enum QuerySchemaUnionTypeEnterprise {
  Объединить = "Объединить",
  ОбъединитьВсе = "ОбъединитьВсе",
}

export enum NewPlannerItemsTextType {
  String = "String",
  FormattedString = "FormattedString",
}

export enum NewPlannerItemsTextTypeEnterprise {
  Строка = "Строка",
  ФорматированнаяСтрока = "ФорматированнаяСтрока",
}

export enum PlannerCommandSource {
  Action = "Action",
  URL = "URL",
  WrappedTimeScaleHeaderArea = "WrappedTimeScaleHeaderArea",
  EmptyItemsArea = "EmptyItemsArea",
  DimensionItem = "DimensionItem",
  TimeScaleItem = "TimeScaleItem",
  Items = "Items",
}

export enum PlannerCommandSourceEnterprise {
  Действие = "Действие",
  НавигационнаяСсылка = "НавигационнаяСсылка",
  ОбластьПеренесенногоЗаголовкаШкалыВремени = "ОбластьПеренесенногоЗаголовкаШкалыВремени",
  ПустаяОбластьЭлементов = "ПустаяОбластьЭлементов",
  ЭлементИзмерения = "ЭлементИзмерения",
  ЭлементШкалыВремени = "ЭлементШкалыВремени",
  Элементы = "Элементы",
}

export enum PlannerInsideDragAction {
  Select = "Select",
  Copy = "Copy",
  Edit = "Edit",
  Create = "Create",
}

export enum PlannerInsideDragActionEnterprise {
  Выделение = "Выделение",
  Копирование = "Копирование",
  Редактирование = "Редактирование",
  Создание = "Создание",
}

export enum PlannerInsideDragBoundaryChangeVariant {
  End = "End",
  Begin = "Begin",
  BeginAndEnd = "BeginAndEnd",
}

export enum PlannerInsideDragBoundaryChangeVariantEnterprise {
  Конец = "Конец",
  Начало = "Начало",
  НачалоИКонец = "НачалоИКонец",
}

export enum PlannerItemActionLocation {
  EndOfItem = "EndOfItem",
  EndOfText = "EndOfText",
}

export enum PlannerItemActionLocationEnterprise {
  ВКонцеЭлемента = "ВКонцеЭлемента",
  ПослеТекста = "ПослеТекста",
}

export enum PlannerItemEnableEditMode {
  DisableDragAndStretch = "DisableDragAndStretch",
  DisableStretch = "DisableStretch",
  DisableEdit = "DisableEdit",
  EnableEdit = "EnableEdit",
}

export enum PlannerItemEnableEditModeEnterprise {
  ЗапретитьПеретаскиваниеИРастягивание = "ЗапретитьПеретаскиваниеИРастягивание",
  ЗапретитьРастягивание = "ЗапретитьРастягивание",
  ЗапретитьРедактирование = "ЗапретитьРедактирование",
  РазрешитьРедактирование = "РазрешитьРедактирование",
}

export enum PlannerItemsBehaviorOnLackOfSpace {
  ShowAllItems = "ShowAllItems",
  CollapseItems = "CollapseItems",
}

export enum PlannerItemsBehaviorOnLackOfSpaceEnterprise {
  ОтображатьВсеЭлементы = "ОтображатьВсеЭлементы",
  СворачиватьЭлементы = "СворачиватьЭлементы",
}

export enum PlannerItemsTimeRepresentation {
  BeginTime = "BeginTime",
  BeginAndEndTime = "BeginAndEndTime",
  DontDisplay = "DontDisplay",
}

export enum PlannerItemsTimeRepresentationEnterprise {
  ВремяНачала = "ВремяНачала",
  ВремяНачалаИКонца = "ВремяНачалаИКонца",
  НеОтображать = "НеОтображать",
}

export enum PlannerStandardCommand {
  QuickEditItem = "QuickEditItem",
  SelectWrappedTimeScaleHeader = "SelectWrappedTimeScaleHeader",
  SelectDimensionItem = "SelectDimensionItem",
  SelectTimeScaleItem = "SelectTimeScaleItem",
  ExecuteAction = "ExecuteAction",
  CopyURL = "CopyURL",
  GotoURL = "GotoURL",
  EditItem = "EditItem",
  CreateItem = "CreateItem",
  DeleteItems = "DeleteItems",
}

export enum PlannerStandardCommandEnterprise {
  БыстроРедактироватьЭлемент = "БыстроРедактироватьЭлемент",
  ВыбратьПеренесенныйЗаголовокШкалыВремени = "ВыбратьПеренесенныйЗаголовокШкалыВремени",
  ВыбратьЭлементИзмерения = "ВыбратьЭлементИзмерения",
  ВыбратьЭлементШкалыВремени = "ВыбратьЭлементШкалыВремени",
  ВыполнитьДействие = "ВыполнитьДействие",
  КопироватьНавигационнуюСсылку = "КопироватьНавигационнуюСсылку",
  ПерейтиПоНавигационнойСсылке = "ПерейтиПоНавигационнойСсылке",
  РедактироватьЭлемент = "РедактироватьЭлемент",
  СоздатьЭлемент = "СоздатьЭлемент",
  УдалитьЭлементы = "УдалитьЭлементы",
}

export enum JSONCharactersEscapeMode {
  None = "None",
  NotASCIISymbols = "NotASCIISymbols",
  SymbolsNotInBMP = "SymbolsNotInBMP",
}

export enum JSONCharactersEscapeModeEnterprise {
  Нет = "Нет",
  СимволыВнеASCII = "СимволыВнеASCII",
  СимволыВнеBMP = "СимволыВнеBMP",
}

export enum JSONDateFormat {
  ISO = "ISO",
  JavaScript = "JavaScript",
  Microsoft = "Microsoft",
}

export enum JSONDateFormatEnterprise {
  ISO = "ISO",
  JavaScript = "JavaScript",
  Microsoft = "Microsoft",
}

export enum JSONDateWritingVariant {
  LocalDate = "LocalDate",
  LocalDateWithOffset = "LocalDateWithOffset",
  UniversalDate = "UniversalDate",
}

export enum JSONDateWritingVariantEnterprise {
  ЛокальнаяДата = "ЛокальнаяДата",
  ЛокальнаяДатаСоСмещением = "ЛокальнаяДатаСоСмещением",
  УниверсальнаяДата = "УниверсальнаяДата",
}

export enum JSONLineBreak {
  Unix = "Unix",
  Windows = "Windows",
  Auto = "Auto",
  None = "None",
}

export enum JSONLineBreakEnterprise {
  Unix = "Unix",
  Windows = "Windows",
  Авто = "Авто",
  Нет = "Нет",
}

export enum JSONValueType {
  Null = "Null",
  Boolean = "Boolean",
  PropertyName = "PropertyName",
  Comment = "Comment",
  ArrayEnd = "ArrayEnd",
  ObjectEnd = "ObjectEnd",
  ArrayStart = "ArrayStart",
  ObjectStart = "ObjectStart",
  None = "None",
  String = "String",
  Number = "Number",
}

export enum JSONValueTypeEnterprise {
  Null = "Null",
  Булево = "Булево",
  ИмяСвойства = "ИмяСвойства",
  Комментарий = "Комментарий",
  КонецМассива = "КонецМассива",
  КонецОбъекта = "КонецОбъекта",
  НачалоМассива = "НачалоМассива",
  НачалоОбъекта = "НачалоОбъекта",
  Ничего = "Ничего",
  Строка = "Строка",
  Число = "Число",
}

export enum DeliverableNotificationSendErrorType {
  UnknownError = "UnknownError",
  AuthenticationDataError = "AuthenticationDataError",
  SubscriberIDError = "SubscriberIDError",
  DeliverableNotificationServiceConnectionError = "DeliverableNotificationServiceConnectionError",
  DeliverableNotificationServiceError = "DeliverableNotificationServiceError",
  NotificationBodyError = "NotificationBodyError",
  NotificationsLimitExceeded = "NotificationsLimitExceeded",
}

export enum DeliverableNotificationSendErrorTypeEnterprise {
  НеизвестнаяОшибка = "НеизвестнаяОшибка",
  ОшибкаДанныхАутентификации = "ОшибкаДанныхАутентификации",
  ОшибкаИдентификатораПодписчика = "ОшибкаИдентификатораПодписчика",
  ОшибкаПодключенияКСервисуДоставляемыхУведомлений = "ОшибкаПодключенияКСервисуДоставляемыхУведомлений",
  ОшибкаСервисаДоставляемыхУведомлений = "ОшибкаСервисаДоставляемыхУведомлений",
  ОшибкаТелаУведомления = "ОшибкаТелаУведомления",
  ПревышенЛимитОтправкиУведомлений = "ПревышенЛимитОтправкиУведомлений",
}

export enum DeliverableNotificationSubscriberType {
  APNS = "APNS",
  FCM = "FCM",
  GCM = "GCM",
  HPK = "HPK",
  RMS = "RMS",
  WNS = "WNS",
}

export enum DeliverableNotificationSubscriberTypeEnterprise {
  APNS = "APNS",
  FCM = "FCM",
  GCM = "GCM",
  HPK = "HPK",
  RMS = "RMS",
  WNS = "WNS",
}

export enum SoundAlert {
  None = "None",
  Default = "Default",
}

export enum SoundAlertEnterprise {
  Нет = "Нет",
  ПоУмолчанию = "ПоУмолчанию",
}

export enum InAppPurchaseService {
  AppleInAppPurchase = "AppleInAppPurchase",
  GooglePlayInAppBilling = "GooglePlayInAppBilling",
  HuaweiInAppPurchase = "HuaweiInAppPurchase",
  RuStoreInAppPurchase = "RuStoreInAppPurchase",
  WindowsInAppPurchase = "WindowsInAppPurchase",
}

export enum InAppPurchaseServiceEnterprise {
  AppleInAppPurchase = "AppleInAppPurchase",
  GooglePlayInAppBilling = "GooglePlayInAppBilling",
  HuaweiInAppPurchase = "HuaweiInAppPurchase",
  RuStoreInAppPurchase = "RuStoreInAppPurchase",
  WindowsInAppPurchase = "WindowsInAppPurchase",
}

export enum InAppPurchaseType {
  ContentForSale = "ContentForSale",
  Subscription = "Subscription",
}

export enum InAppPurchaseTypeEnterprise {
  КонтентДляПродажи = "КонтентДляПродажи",
  Подписка = "Подписка",
}

export enum FTPSecureConnectionUsageLevel {
  Auto = "Auto",
  UseIfPossible = "UseIfPossible",
  DontUse = "DontUse",
  Require = "Require",
  RequireForControl = "RequireForControl",
}

export enum FTPSecureConnectionUsageLevelEnterprise {
  Авто = "Авто",
  ИспользоватьЕслиВозможно = "ИспользоватьЕслиВозможно",
  НеИспользовать = "НеИспользовать",
  Требовать = "Требовать",
  ТребоватьДляУправления = "ТребоватьДляУправления",
}

export enum InternetConnectionType {
  WiFi = "WiFi",
  LAN = "LAN",
  NoConnection = "NoConnection",
  CellularData = "CellularData",
}

export enum InternetConnectionTypeEnterprise {
  WiFi = "WiFi",
  ЛокальнаяСеть = "ЛокальнаяСеть",
  НетСоединения = "НетСоединения",
  СотовыеДанные = "СотовыеДанные",
}

export enum MacOSCertificateSelectMode {
  Auto = "Auto",
  Choose = "Choose",
}

export enum MacOSCertificateSelectModeEnterprise {
  Авто = "Авто",
  Выбирать = "Выбирать",
}

export enum OSCertificateSelectMode {
  Auto = "Auto",
  Choose = "Choose",
}

export enum OSCertificateSelectModeEnterprise {
  Авто = "Авто",
  Выбирать = "Выбирать",
}

export enum RoamingUsage {
  Used = "Used",
  Unknown = "Unknown",
  NotUsed = "NotUsed",
}

export enum RoamingUsageEnterprise {
  Используется = "Используется",
  Неизвестно = "Неизвестно",
  НеИспользуется = "НеИспользуется",
}

export enum ServerTLSCertificateRevocationCheckMode {
  Auto = "Auto",
  DontCheck = "DontCheck",
  SoftFail = "SoftFail",
  Strict = "Strict",
}

export enum ServerTLSCertificateRevocationCheckModeEnterprise {
  Авто = "Авто",
  НеПроверять = "НеПроверять",
  Нестрогий = "Нестрогий",
  Строгий = "Строгий",
}

export enum WindowsCertificateSelectMode {
  Auto = "Auto",
  Choose = "Choose",
}

export enum WindowsCertificateSelectModeEnterprise {
  Авто = "Авто",
  Выбирать = "Выбирать",
}

export enum ByteOrder {
  BigEndian = "BigEndian",
  LittleEndian = "LittleEndian",
}

export enum ByteOrderEnterprise {
  BigEndian = "BigEndian",
  LittleEndian = "LittleEndian",
}

export enum PositionInStream {
  End = "End",
  Begin = "Begin",
  Current = "Current",
}

export enum PositionInStreamEnterprise {
  Конец = "Конец",
  Начало = "Начало",
  Текущая = "Текущая",
}

export enum AdBannerRepresentation {
  Top = "Top",
  None = "None",
  Bottom = "Bottom",
}

export enum AdBannerRepresentationEnterprise {
  Верх = "Верх",
  Нет = "Нет",
  Низ = "Низ",
}

export enum AdStatus {
  ReadyToDisplay = "ReadyToDisplay",
  Downloading = "Downloading",
  NotDownloaded = "NotDownloaded",
  Displayed = "Displayed",
}

export enum AdStatusEnterprise {
  ГотоваКОтображению = "ГотоваКОтображению",
  Загружается = "Загружается",
  НеЗагружена = "НеЗагружена",
  Отображается = "Отображается",
}

export enum DataLineChangeType {
  Add = "Add",
  Update = "Update",
  Move = "Move",
  Delete = "Delete",
}

export enum DataLineChangeTypeEnterprise {
  Добавление = "Добавление",
  Изменение = "Изменение",
  Перемещение = "Перемещение",
  Удаление = "Удаление",
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

export enum RepresentableDocumentBatchFileTypeEnterprise {
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
  NotStarted = "NotStarted",
  Disconnected = "Disconnected",
  Connected = "Connected",
}

export enum ClientApplicationAgentStateEnterprise {
  НеЗапущен = "НеЗапущен",
  Отключен = "Отключен",
  Подключен = "Подключен",
}

export enum DataCompositionDataRelevanceOutputType {
  Auto = "Auto",
  Output = "Output",
  DontOutput = "DontOutput",
}

export enum DataCompositionDataRelevanceOutputTypeEnterprise {
  Авто = "Авто",
  Выводить = "Выводить",
  НеВыводить = "НеВыводить",
}

export enum DataCompositionDatabaseCopyOutputType {
  Auto = "Auto",
  Output = "Output",
  DontOutput = "DontOutput",
}

export enum DataCompositionDatabaseCopyOutputTypeEnterprise {
  Авто = "Авто",
  Выводить = "Выводить",
  НеВыводить = "НеВыводить",
}

export enum DatabaseCopiesStandardReplicationVersion {
  Version1 = "Version1",
  Version2 = "Version2",
}

export enum DatabaseCopiesStandardReplicationVersionEnterprise {
  Версия1 = "Версия1",
  Версия2 = "Версия2",
}

export enum DatabaseCopiesUse {
  Auto = "Auto",
  PreferUseCopies = "PreferUseCopies",
  UseCopiesOnly = "UseCopiesOnly",
  DontUseCopies = "DontUseCopies",
}

export enum DatabaseCopiesUseEnterprise {
  Авто = "Авто",
  ИспользоватьПреимущественноКопии = "ИспользоватьПреимущественноКопии",
  ИспользоватьТолькоКопии = "ИспользоватьТолькоКопии",
  НеИспользоватьКопии = "НеИспользоватьКопии",
}

export enum DatabaseCopyContentItemFieldUse {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum DatabaseCopyContentItemFieldUseEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum DatabaseCopyDBMSType {
  MSSQLServer = "MSSQLServer",
  OracleDatabase = "OracleDatabase",
  PostgreSQL = "PostgreSQL",
}

export enum DatabaseCopyDBMSTypeEnterprise {
  MSSQLServer = "MSSQLServer",
  OracleDatabase = "OracleDatabase",
  PostgreSQL = "PostgreSQL",
}

export enum DatabaseCopyReplicationType {
  External = "External",
  Standard = "Standard",
}

export enum DatabaseCopyReplicationTypeEnterprise {
  Внешняя = "Внешняя",
  Стандартная = "Стандартная",
}

export enum DatabaseCopyState {
  TurnedOn = "TurnedOn",
  TemporarilyTurnedOff = "TemporarilyTurnedOff",
  TurnedOff = "TurnedOff",
}

export enum DatabaseCopyStateEnterprise {
  Включена = "Включена",
  ВременноОтключена = "ВременноОтключена",
  Отключена = "Отключена",
}

export enum DatabaseCopyTurnedOffReason {
  InvalidCopyDatabaseUseVariant = "InvalidCopyDatabaseUseVariant",
  DataInconsistency = "DataInconsistency",
  QueryExecutionError = "QueryExecutionError",
  DatabaseConnectionError = "DatabaseConnectionError",
}

export enum DatabaseCopyTurnedOffReasonEnterprise {
  НедопустимыйВариантИспользованияБазыДанныхКопии = "НедопустимыйВариантИспользованияБазыДанныхКопии",
  НесоответствиеДанных = "НесоответствиеДанных",
  ОшибкаВыполненияЗапроса = "ОшибкаВыполненияЗапроса",
  ОшибкаСоединенияСБазойДанных = "ОшибкаСоединенияСБазойДанных",
}

export enum DatabaseCopyUpdateState {
  InitialUpdateInProgress = "InitialUpdateInProgress",
  CurrentUpdateInProgress = "CurrentUpdateInProgress",
  PortionUpdateCompletedSuccessfully = "PortionUpdateCompletedSuccessfully",
  CompletedWithError = "CompletedWithError",
  CompletedSuccessfully = "CompletedSuccessfully",
  Inactive = "Inactive",
}

export enum DatabaseCopyUpdateStateEnterprise {
  ВыполняетсяНачальноеОбновление = "ВыполняетсяНачальноеОбновление",
  ВыполняетсяТекущееОбновление = "ВыполняетсяТекущееОбновление",
  ЗавершеноОбновлениеПорцииУспешно = "ЗавершеноОбновлениеПорцииУспешно",
  ЗавершеноСОшибкой = "ЗавершеноСОшибкой",
  ЗавершеноУспешно = "ЗавершеноУспешно",
  Неактивно = "Неактивно",
}

export enum RequiredDataRelevance {
  Auto = "Auto",
  Relevant = "Relevant",
  Any = "Any",
}

export enum RequiredDataRelevanceEnterprise {
  Авто = "Авто",
  Актуальные = "Актуальные",
  Любые = "Любые",
}

export enum CollaborationSystemCommandSource {
  Attachment = "Attachment",
  Action = "Action",
  URL = "URL",
  CurrentPageURL = "CurrentPageURL",
  User = "User",
  Message = "Message",
}

export enum CollaborationSystemCommandSourceEnterprise {
  Вложение = "Вложение",
  Действие = "Действие",
  НавигационнаяСсылка = "НавигационнаяСсылка",
  НавигационнаяСсылкаТекущейСтраницы = "НавигационнаяСсылкаТекущейСтраницы",
  Пользователь = "Пользователь",
  Сообщение = "Сообщение",
}

export enum CollaborationSystemDataDumpStatus {
  Restoring = "Restoring",
  Done = "Done",
  Loading = "Loading",
  Error = "Error",
  Creating = "Creating",
}

export enum CollaborationSystemDataDumpStatusEnterprise {
  Восстановление = "Восстановление",
  Готово = "Готово",
  Загрузка = "Загрузка",
  Ошибка = "Ошибка",
  Создание = "Создание",
}

export enum CollaborationSystemFromDataDumpRestoreStatus {
  Error = "Error",
  Success = "Success",
}

export enum CollaborationSystemFromDataDumpRestoreStatusEnterprise {
  Ошибка = "Ошибка",
  Успешно = "Успешно",
}

export enum CollaborationSystemMessageButtonPanelButtonAction {
  RequestLocation = "RequestLocation",
  RequestPhone = "RequestPhone",
  ProcessByBot = "ProcessByBot",
  ProcessOnClient = "ProcessOnClient",
  SendMessage = "SendMessage",
  SendMessageWithData = "SendMessageWithData",
  GotoURL = "GotoURL",
}

export enum CollaborationSystemMessageButtonPanelButtonActionEnterprise {
  ЗапроситьМестоположение = "ЗапроситьМестоположение",
  ЗапроситьТелефон = "ЗапроситьТелефон",
  ОбработатьБотом = "ОбработатьБотом",
  ОбработатьНаКлиенте = "ОбработатьНаКлиенте",
  ОтправитьСообщение = "ОтправитьСообщение",
  ОтправитьСообщениеСДанными = "ОтправитьСообщениеСДанными",
  ПерейтиПоНавигационнойСсылке = "ПерейтиПоНавигационнойСсылке",
}

export enum CollaborationSystemMessageButtonPanelButtonType {
  Hyperlink = "Hyperlink",
  UsualButton = "UsualButton",
}

export enum CollaborationSystemMessageButtonPanelButtonTypeEnterprise {
  Гиперссылка = "Гиперссылка",
  ОбычнаяКнопка = "ОбычнаяКнопка",
}

export enum CollaborationSystemNotificationRepresentation {
  DontDisturb = "DontDisturb",
  Normal = "Normal",
}

export enum CollaborationSystemNotificationRepresentationEnterprise {
  НеБеспокоить = "НеБеспокоить",
  Обычное = "Обычное",
}

export enum CollaborationSystemStandardCommand {
  ExecuteAction = "ExecuteAction",
  CopyAttachment = "CopyAttachment",
  CopyURL = "CopyURL",
  CopyMessage = "CopyMessage",
  OpenAttachment = "OpenAttachment",
  GotoURL = "GotoURL",
  ShareAttachment = "ShareAttachment",
  ShareMessage = "ShareMessage",
  ShowUserInfo = "ShowUserInfo",
  GetMessageURL = "GetMessageURL",
  EditMessage = "EditMessage",
  SaveAttachment = "SaveAttachment",
  DeleteMessage = "DeleteMessage",
  QuoteMessage = "QuoteMessage",
}

export enum CollaborationSystemStandardCommandEnterprise {
  ВыполнитьДействие = "ВыполнитьДействие",
  КопироватьВложение = "КопироватьВложение",
  КопироватьНавигационнуюСсылку = "КопироватьНавигационнуюСсылку",
  КопироватьСообщение = "КопироватьСообщение",
  ОткрытьВложение = "ОткрытьВложение",
  ПерейтиПоНавигационнойСсылке = "ПерейтиПоНавигационнойСсылке",
  ПоделитьсяВложением = "ПоделитьсяВложением",
  ПоделитьсяСообщением = "ПоделитьсяСообщением",
  ПоказатьИнформациюОПользователе = "ПоказатьИнформациюОПользователе",
  ПолучитьНавигационнуюСсылкуСообщения = "ПолучитьНавигационнуюСсылкуСообщения",
  РедактироватьСообщение = "РедактироватьСообщение",
  СохранитьВложение = "СохранитьВложение",
  УдалитьСообщение = "УдалитьСообщение",
  ЦитироватьСообщение = "ЦитироватьСообщение",
}

export enum CollaborationSystemUsersChoicePurpose {
  MessageRecipient = "MessageRecipient",
  VideoconferenceParticipant = "VideoconferenceParticipant",
  ConversationMember = "ConversationMember",
}

export enum CollaborationSystemUsersChoicePurposeEnterprise {
  ПолучательСообщения = "ПолучательСообщения",
  УчастникВидеоконференции = "УчастникВидеоконференции",
  УчастникОбсуждения = "УчастникОбсуждения",
}

export enum AdministrationActionOnResourceConsumptionLimitExcess {
  TerminateSession = "TerminateSession",
  None = "None",
  InterruptCurrentServerCall = "InterruptCurrentServerCall",
  SetThreadLowPriority = "SetThreadLowPriority",
}

export enum AdministrationActionOnResourceConsumptionLimitExcessEnterprise {
  ЗавершитьСеанс = "ЗавершитьСеанс",
  Нет = "Нет",
  ПрерватьТекущийСерверныйВызов = "ПрерватьТекущийСерверныйВызов",
  УстановитьНизкийПриоритетПотока = "УстановитьНизкийПриоритетПотока",
}

export enum AdministrationAssignmentRuleType {
  Auto = "Auto",
  Assign = "Assign",
  DontAssign = "DontAssign",
}

export enum AdministrationAssignmentRuleTypeEnterprise {
  Авто = "Авто",
  Назначать = "Назначать",
  НеНазначать = "НеНазначать",
}

export enum AdministrationConnectionSecurityLevel {
  Secure = "Secure",
  SecureOnConnect = "SecureOnConnect",
  Unsecure = "Unsecure",
}

export enum AdministrationConnectionSecurityLevelEnterprise {
  Защищенное = "Защищенное",
  ЗащищенноеПриУстановкеСоединения = "ЗащищенноеПриУстановкеСоединения",
  Незащищенное = "Незащищенное",
}

export enum AdministrationInfoBaseDeletionMode {
  DontPerformActionsWithDatabase = "DontPerformActionsWithDatabase",
  ClearDatabase = "ClearDatabase",
  DeleteDatabase = "DeleteDatabase",
}

export enum AdministrationInfoBaseDeletionModeEnterprise {
  НеВыполнятьДействийСБазойДанных = "НеВыполнятьДействийСБазойДанных",
  ОчиститьБазуДанных = "ОчиститьБазуДанных",
  УдалитьБазуДанных = "УдалитьБазуДанных",
}

export enum AdministrationProcessChoicePriority {
  ByMemory = "ByMemory",
  ByPerformance = "ByPerformance",
}

export enum AdministrationProcessChoicePriorityEnterprise {
  ПоПамяти = "ПоПамяти",
  ПоПроизводительности = "ПоПроизводительности",
}

export enum AdministrationResourceConsumptionCounterFilterType {
  All = "All",
  AllSelected = "AllSelected",
  AllButSelected = "AllButSelected",
}

export enum AdministrationResourceConsumptionCounterFilterTypeEnterprise {
  Все = "Все",
  ВсеВыбранные = "ВсеВыбранные",
  ВсеКромеВыбранных = "ВсеКромеВыбранных",
}

export enum AdministrationResourceConsumptionCounterGroupType {
  Users = "Users",
  DataSeparation = "DataSeparation",
}

export enum AdministrationResourceConsumptionCounterGroupTypeEnterprise {
  Пользователи = "Пользователи",
  РазделениеДанных = "РазделениеДанных",
}

export enum AdministrationWorkProcessStatus {
  Used = "Used",
  NotUsed = "NotUsed",
  Reserve = "Reserve",
}

export enum AdministrationWorkProcessStatusEnterprise {
  Используется = "Используется",
  НеИспользуется = "НеИспользуется",
  Резервный = "Резервный",
}

export enum DuplexPrintingType {
  UsePrinterSettings = "UsePrinterSettings",
  None = "None",
  FlipPagesUp = "FlipPagesUp",
  FlipPagesLeft = "FlipPagesLeft",
}

export enum DuplexPrintingTypeEnterprise {
  ИспользоватьНастройкиПринтера = "ИспользоватьНастройкиПринтера",
  Нет = "Нет",
  ПереворотВверх = "ПереворотВверх",
  ПереворотВлево = "ПереворотВлево",
}

export enum PageOrientation {
  Landscape = "Landscape",
  Portrait = "Portrait",
}

export enum PageOrientationEnterprise {
  Ландшафт = "Ландшафт",
  Портрет = "Портрет",
}

export enum PagePlacementAlternation {
  Auto = "Auto",
  MirrorOnTop = "MirrorOnTop",
  MirrorOnLeft = "MirrorOnLeft",
  DontUse = "DontUse",
}

export enum PagePlacementAlternationEnterprise {
  Авто = "Авто",
  ЗеркальноСверху = "ЗеркальноСверху",
  ЗеркальноСлева = "ЗеркальноСлева",
  НеИспользовать = "НеИспользовать",
}

export enum PrintAccuracy {
  Auto = "Auto",
  Accurate = "Accurate",
}

export enum PrintAccuracyEnterprise {
  Авто = "Авто",
  Точная = "Точная",
}

export enum SpreadsheetDocumentAreaFillType {
  Parameter = "Parameter",
  Text = "Text",
  Template = "Template",
}

export enum SpreadsheetDocumentAreaFillTypeEnterprise {
  Параметр = "Параметр",
  Текст = "Текст",
  Шаблон = "Шаблон",
}

export enum SpreadsheetDocumentCellAreaType {
  Columns = "Columns",
  Rectangle = "Rectangle",
  Rows = "Rows",
  Table = "Table",
}

export enum SpreadsheetDocumentCellAreaTypeEnterprise {
  Колонки = "Колонки",
  Прямоугольник = "Прямоугольник",
  Строки = "Строки",
  Таблица = "Таблица",
}

export enum SpreadsheetDocumentCellLineType {
  LargeDashed = "LargeDashed",
  Double = "Double",
  None = "None",
  ThinDashed = "ThinDashed",
  Solid = "Solid",
  Dotted = "Dotted",
  ThickDashed = "ThickDashed",
}

export enum SpreadsheetDocumentCellLineTypeEnterprise {
  БольшойПунктир = "БольшойПунктир",
  Двойная = "Двойная",
  НетЛинии = "НетЛинии",
  РедкийПунктир = "РедкийПунктир",
  Сплошная = "Сплошная",
  Точечная = "Точечная",
  ЧастыйПунктир = "ЧастыйПунктир",
}

export enum SpreadsheetDocumentDetailUse {
  WithoutProcessing = "WithoutProcessing",
  Row = "Row",
  Cell = "Cell",
}

export enum SpreadsheetDocumentDetailUseEnterprise {
  БезОбработки = "БезОбработки",
  Строка = "Строка",
  Ячейка = "Ячейка",
}

export enum SpreadsheetDocumentDrawingLineType {
  None = "None",
  Dashed = "Dashed",
  DashDotted = "DashDotted",
  DashDottedDotted = "DashDottedDotted",
  Solid = "Solid",
  Dotted = "Dotted",
}

export enum SpreadsheetDocumentDrawingLineTypeEnterprise {
  НетЛинии = "НетЛинии",
  Пунктир = "Пунктир",
  ПунктирТочка = "ПунктирТочка",
  ПунктирТочкаТочка = "ПунктирТочкаТочка",
  Сплошная = "Сплошная",
  Точечная = "Точечная",
}

export enum SpreadsheetDocumentDrawingType {
  GeographicalSchema = "GeographicalSchema",
  Group = "Group",
  Dendrogram = "Dendrogram",
  Chart = "Chart",
  GanttChart = "GanttChart",
  Picture = "Picture",
  Object = "Object",
  Comment = "Comment",
  Line = "Line",
  Rectangle = "Rectangle",
  PivotChart = "PivotChart",
  Text = "Text",
  Ellipse = "Ellipse",
}

export enum SpreadsheetDocumentDrawingTypeEnterprise {
  ГеографическаяСхема = "ГеографическаяСхема",
  Группа = "Группа",
  Дендрограмма = "Дендрограмма",
  Диаграмма = "Диаграмма",
  ДиаграммаГанта = "ДиаграммаГанта",
  Картинка = "Картинка",
  Объект = "Объект",
  Примечание = "Примечание",
  Прямая = "Прямая",
  Прямоугольник = "Прямоугольник",
  СводнаяДиаграмма = "СводнаяДиаграмма",
  Текст = "Текст",
  Эллипс = "Эллипс",
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

export enum SpreadsheetDocumentFileTypeEnterprise {
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
  Auto = "Auto",
  End = "End",
  Begin = "Begin",
}

export enum SpreadsheetDocumentGroupHeaderPlacementEnterprise {
  Авто = "Авто",
  Конец = "Конец",
  Начало = "Начало",
}

export enum SpreadsheetDocumentPatternType {
  WithoutPattern = "WithoutPattern",
  Solid = "Solid",
  Pattern1 = "Pattern1",
  Pattern10 = "Pattern10",
  Pattern11 = "Pattern11",
  Pattern12 = "Pattern12",
  Pattern13 = "Pattern13",
  Pattern14 = "Pattern14",
  Pattern15 = "Pattern15",
  Pattern16 = "Pattern16",
  Pattern17 = "Pattern17",
  Pattern2 = "Pattern2",
  Pattern3 = "Pattern3",
  Pattern4 = "Pattern4",
  Pattern5 = "Pattern5",
  Pattern6 = "Pattern6",
  Pattern7 = "Pattern7",
  Pattern8 = "Pattern8",
  Pattern9 = "Pattern9",
}

export enum SpreadsheetDocumentPatternTypeEnterprise {
  БезУзора = "БезУзора",
  Сплошной = "Сплошной",
  Узор1 = "Узор1",
  Узор10 = "Узор10",
  Узор11 = "Узор11",
  Узор12 = "Узор12",
  Узор13 = "Узор13",
  Узор14 = "Узор14",
  Узор15 = "Узор15",
  Узор16 = "Узор16",
  Узор17 = "Узор17",
  Узор2 = "Узор2",
  Узор3 = "Узор3",
  Узор4 = "Узор4",
  Узор5 = "Узор5",
  Узор6 = "Узор6",
  Узор7 = "Узор7",
  Узор8 = "Узор8",
  Узор9 = "Узор9",
}

export enum SpreadsheetDocumentPointerType {
  Regular = "Regular",
  Special = "Special",
}

export enum SpreadsheetDocumentPointerTypeEnterprise {
  Обычные = "Обычные",
  Специальные = "Специальные",
}

export enum SpreadsheetDocumentSavedPicturesDensity {
  High = "High",
  Original = "Original",
  Low = "Low",
  Medium = "Medium",
}

export enum SpreadsheetDocumentSavedPicturesDensityEnterprise {
  Высокая = "Высокая",
  Исходная = "Исходная",
  Низкая = "Низкая",
  Средняя = "Средняя",
}

export enum SpreadsheetDocumentSelectionShowModeType {
  Always = "Always",
  WhenActive = "WhenActive",
}

export enum SpreadsheetDocumentSelectionShowModeTypeEnterprise {
  Всегда = "Всегда",
  ПриАктивности = "ПриАктивности",
}

export enum SpreadsheetDocumentShiftType {
  WithoutShift = "WithoutShift",
  Vertical = "Vertical",
  Horizontal = "Horizontal",
}

export enum SpreadsheetDocumentShiftTypeEnterprise {
  БезСмещения = "БезСмещения",
  ПоВертикали = "ПоВертикали",
  ПоГоризонтали = "ПоГоризонтали",
}

export enum SpreadsheetDocumentStepDirectionType {
  WithoutMove = "WithoutMove",
  ByColumns = "ByColumns",
  ByRows = "ByRows",
}

export enum SpreadsheetDocumentStepDirectionTypeEnterprise {
  БезПерехода = "БезПерехода",
  ПоКолонкам = "ПоКолонкам",
  ПоСтрокам = "ПоСтрокам",
}

export enum SpreadsheetDocumentTextPlacementType {
  Auto = "Auto",
  Block = "Block",
  Cut = "Cut",
  Wrap = "Wrap",
}

export enum SpreadsheetDocumentTextPlacementTypeEnterprise {
  Авто = "Авто",
  Забивать = "Забивать",
  Обрезать = "Обрезать",
  Переносить = "Переносить",
}

export enum SpreadsheetDocumentValuesReadingMode {
  Value = "Value",
  Text = "Text",
}

export enum SpreadsheetDocumentValuesReadingModeEnterprise {
  Значение = "Значение",
  Текст = "Текст",
}

export enum TextPositionRelativeToPicture {
  Auto = "Auto",
  OnTop = "OnTop",
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
}

export enum TextPositionRelativeToPictureEnterprise {
  Авто = "Авто",
  Поверх = "Поверх",
  Сверху = "Сверху",
  Слева = "Слева",
  Снизу = "Снизу",
  Справа = "Справа",
}

export enum UseSpreadsheetDocumentWidthReduction {
  Auto = "Auto",
  DoNotReduceOnExcess = "DoNotReduceOnExcess",
  ReduceToMinimumOnExcess = "ReduceToMinimumOnExcess",
  ReduceAlways = "ReduceAlways",
}

export enum UseSpreadsheetDocumentWidthReductionEnterprise {
  Авто = "Авто",
  ПриПревышенииНеСжимать = "ПриПревышенииНеСжимать",
  ПриПревышенииСжиматьДоМинимума = "ПриПревышенииСжиматьДоМинимума",
  СжиматьВсегда = "СжиматьВсегда",
}

export enum PivotTableColumnTotalPosition {
  Left = "Left",
  Right = "Right",
}

export enum PivotTableColumnTotalPositionEnterprise {
  Лево = "Лево",
  Право = "Право",
}

export enum PivotTableLinesShowType {
  Auto = "Auto",
  Always = "Always",
}

export enum PivotTableLinesShowTypeEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
}

export enum PivotTableRowTotalPosition {
  Top = "Top",
  Bottom = "Bottom",
}

export enum PivotTableRowTotalPositionEnterprise {
  Верх = "Верх",
  Низ = "Низ",
}

export enum QueryRecordType {
  DetailRecord = "DetailRecord",
  GroupTotal = "GroupTotal",
  TotalByHierarchy = "TotalByHierarchy",
  Overall = "Overall",
}

export enum QueryRecordTypeEnterprise {
  ДетальнаяЗапись = "ДетальнаяЗапись",
  ИтогПоГруппировке = "ИтогПоГруппировке",
  ИтогПоИерархии = "ИтогПоИерархии",
  ОбщийИтог = "ОбщийИтог",
}

export enum QueryResultIteration {
  ByGroups = "ByGroups",
  ByGroupsWithHierarchy = "ByGroupsWithHierarchy",
  Linear = "Linear",
}

export enum QueryResultIterationEnterprise {
  ПоГруппировкам = "ПоГруппировкам",
  ПоГруппировкамСИерархией = "ПоГруппировкамСИерархией",
  Прямой = "Прямой",
}

export enum ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod {
  StronglyConnectedComponents = "StronglyConnectedComponents",
  StronglyConnectedComponentsWithNoInnerConnectionRequired = "StronglyConnectedComponentsWithNoInnerConnectionRequired",
  WeaklyConnectedComponents = "WeaklyConnectedComponents",
}

export enum ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise {
  КомпонентыСильнойСвязности = "КомпонентыСильнойСвязности",
  КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент = "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент",
  КомпонентыСлабойСвязности = "КомпонентыСлабойСвязности",
}

export enum AdditionalUserVerificationMethod {
  BiometricsOrPassword = "BiometricsOrPassword",
  BiometricsOnly = "BiometricsOnly",
}

export enum AdditionalUserVerificationMethodEnterprise {
  БиометрическаяИлиВводПароля = "БиометрическаяИлиВводПароля",
  ТолькоБиометрическая = "ТолькоБиометрическая",
}

export enum BiometricVerificationMethod {
  None = "None",
  FaceRecognition = "FaceRecognition",
  FingerprintRecognition = "FingerprintRecognition",
  IrisRecognition = "IrisRecognition",
}

export enum BiometricVerificationMethodEnterprise {
  Нет = "Нет",
  РаспознаваниеЛица = "РаспознаваниеЛица",
  РаспознаваниеОтпечаткаПальца = "РаспознаваниеОтпечаткаПальца",
  РаспознаваниеРадужнойОболочкиГлаза = "РаспознаваниеРадужнойОболочкиГлаза",
}

export enum SecureStorageAccessProtectionMethod {
  None = "None",
  AdditionalUserVerificationRequired = "AdditionalUserVerificationRequired",
  ScreenUnlockRequired = "ScreenUnlockRequired",
}

export enum SecureStorageAccessProtectionMethodEnterprise {
  Нет = "Нет",
  ТребуетсяДополнительнаяПроверкаПользователя = "ТребуетсяДополнительнаяПроверкаПользователя",
  ТребуетсяРазблокировкаЭкрана = "ТребуетсяРазблокировкаЭкрана",
}

export enum ErrorCategory {
  AllErrors = "AllErrors",
  ExceptionRaisedFromScript = "ExceptionRaisedFromScript",
  AccessViolation = "AccessViolation",
  UnsupportedFormat = "UnsupportedFormat",
  InvalidPassword = "InvalidPassword",
  NoPermissionToUseFunctionality = "NoPermissionToUseFunctionality",
  ExternalDataSourceError = "ExternalDataSourceError",
  ScriptRuntimeError = "ScriptRuntimeError",
  LocalFileAccessError = "LocalFileAccessError",
  ScriptUseError = "ScriptUseError",
  ScriptCompileError = "ScriptCompileError",
  ConfigurationError = "ConfigurationError",
  DatabaseCopyError = "DatabaseCopyError",
  DataCompositionSettingsError = "DataCompositionSettingsError",
  GotoURLError = "GotoURLError",
  FullTextSearchError = "FullTextSearchError",
  DocumentConversionError = "DocumentConversionError",
  SignatureVerificationError = "SignatureVerificationError",
  PrinterError = "PrinterError",
  SpeechProcessingError = "SpeechProcessingError",
  SessionError = "SessionError",
  NetworkError = "NetworkError",
  CollaborationSystemError = "CollaborationSystemError",
  MultimediaToolsError = "MultimediaToolsError",
  DatabaseTablespaceError = "DatabaseTablespaceError",
  StoredDataError = "StoredDataError",
  ForcedShutdown = "ForcedShutdown",
  OtherError = "OtherError",
}

export enum ErrorCategoryEnterprise {
  ВсеОшибки = "ВсеОшибки",
  ИсключениеВызванноеИзВстроенногоЯзыка = "ИсключениеВызванноеИзВстроенногоЯзыка",
  НарушениеПравДоступа = "НарушениеПравДоступа",
  НеподдерживаемыйФормат = "НеподдерживаемыйФормат",
  НеправильныйПароль = "НеправильныйПароль",
  ОтсутствиеРазрешенияДляИспользованияФункциональности = "ОтсутствиеРазрешенияДляИспользованияФункциональности",
  ОшибкаВнешнегоИсточникаДанных = "ОшибкаВнешнегоИсточникаДанных",
  ОшибкаВоВремяВыполненияВстроенногоЯзыка = "ОшибкаВоВремяВыполненияВстроенногоЯзыка",
  ОшибкаДоступаКЛокальномуФайлу = "ОшибкаДоступаКЛокальномуФайлу",
  ОшибкаИспользованияВстроенногоЯзыка = "ОшибкаИспользованияВстроенногоЯзыка",
  ОшибкаКомпиляцииВстроенногоЯзыка = "ОшибкаКомпиляцииВстроенногоЯзыка",
  ОшибкаКонфигурации = "ОшибкаКонфигурации",
  ОшибкаКопииБазыДанных = "ОшибкаКопииБазыДанных",
  ОшибкаНастроекКомпоновкиДанных = "ОшибкаНастроекКомпоновкиДанных",
  ОшибкаПереходаПоНавигационнойСсылке = "ОшибкаПереходаПоНавигационнойСсылке",
  ОшибкаПолнотекстовогоПоиска = "ОшибкаПолнотекстовогоПоиска",
  ОшибкаПреобразованияДокумента = "ОшибкаПреобразованияДокумента",
  ОшибкаПроверкиПодписи = "ОшибкаПроверкиПодписи",
  ОшибкаРаботыСПринтером = "ОшибкаРаботыСПринтером",
  ОшибкаРаботыСРечью = "ОшибкаРаботыСРечью",
  ОшибкаСеанса = "ОшибкаСеанса",
  ОшибкаСети = "ОшибкаСети",
  ОшибкаСистемыВзаимодействия = "ОшибкаСистемыВзаимодействия",
  ОшибкаСредствМультимедиа = "ОшибкаСредствМультимедиа",
  ОшибкаТабличногоПространстваБазыДанных = "ОшибкаТабличногоПространстваБазыДанных",
  ОшибкаХранимыхДанных = "ОшибкаХранимыхДанных",
  ПринудительноеЗавершениеРаботы = "ПринудительноеЗавершениеРаботы",
  ПрочаяОшибка = "ПрочаяОшибка",
}

export enum ErrorMessageDisplayVariant {
  Auto = "Auto",
  BriefErrorDescription = "BriefErrorDescription",
  DetailErrorDescription = "DetailErrorDescription",
  ErrorMessageForUser = "ErrorMessageForUser",
}

export enum ErrorMessageDisplayVariantEnterprise {
  Авто = "Авто",
  КраткоеПредставлениеОшибки = "КраткоеПредставлениеОшибки",
  ПодробноеПредставлениеОшибки = "ПодробноеПредставлениеОшибки",
  СообщениеОбОшибкеДляПользователя = "СообщениеОбОшибкеДляПользователя",
}

export enum ErrorReportingMode {
  Auto = "Auto",
  DontSend = "DontSend",
  Send = "Send",
  AskUser = "AskUser",
}

export enum ErrorReportingModeEnterprise {
  Авто = "Авто",
  НеОтправлять = "НеОтправлять",
  Отправлять = "Отправлять",
  СпрашиватьПользователя = "СпрашиватьПользователя",
}

export enum MobileClientSignatureVerificationMethod {
  DoNotVerifySignature = "DoNotVerifySignature",
  CheckMobileClientUsageAbility = "CheckMobileClientUsageAbility",
  CheckConfigurationSignatureForExactMatch = "CheckConfigurationSignatureForExactMatch",
}

export enum MobileClientSignatureVerificationMethodEnterprise {
  НеВыполнятьПроверкуПодписи = "НеВыполнятьПроверкуПодписи",
  ПроверятьВозможностьИспользованияМобильногоКлиента = "ПроверятьВозможностьИспользованияМобильногоКлиента",
  ПроверятьТочноеСоответствиеПодписиКонфигурации = "ПроверятьТочноеСоответствиеПодписиКонфигурации",
}

export enum OnMainServerUnavalableBehavior {
  Auto = "Auto",
  DontChangeBehavior = "DontChangeBehavior",
  MakeDisable = "MakeDisable",
}

export enum OnMainServerUnavalableBehaviorEnterprise {
  Авто = "Авто",
  НеИзменятьПоведение = "НеИзменятьПоведение",
  ОтключитьДоступность = "ОтключитьДоступность",
}

export enum UsedServer {
  Standalone = "Standalone",
  Main = "Main",
}

export enum UsedServerEnterprise {
  Автономный = "Автономный",
  Основной = "Основной",
}

export enum PDFAttachmentRelationshipType {
  Alternative = "Alternative",
  Data = "Data",
  Supplement = "Supplement",
  Source = "Source",
  Unspecified = "Unspecified",
}

export enum PDFAttachmentRelationshipTypeEnterprise {
  Альтернатива = "Альтернатива",
  Данные = "Данные",
  Дополнение = "Дополнение",
  Источник = "Источник",
  НеУстановлено = "НеУстановлено",
}

export enum PDFDocumentFileType {
  PDF = "PDF",
  PDF_A_1 = "PDF_A_1",
  PDF_A_2 = "PDF_A_2",
  PDF_A_3 = "PDF_A_3",
}

export enum PDFDocumentFileTypeEnterprise {
  PDF = "PDF",
  PDF_A_1 = "PDF_A_1",
  PDF_A_2 = "PDF_A_2",
  PDF_A_3 = "PDF_A_3",
}

export enum PDFModificationAccessPermissions {
  FillingSigning = "FillingSigning",
  FillingSigningAnnotation = "FillingSigningAnnotation",
  None = "None",
}

export enum PDFModificationAccessPermissionsEnterprise {
  ЗаполнениеПодписание = "ЗаполнениеПодписание",
  ЗаполнениеПодписаниеАннотирование = "ЗаполнениеПодписаниеАннотирование",
  Нет = "Нет",
}

export enum PDFSignatureType {
  Certifying = "Certifying",
  Approving = "Approving",
}

export enum PDFSignatureTypeEnterprise {
  Сертифицирующая = "Сертифицирующая",
  Утверждающая = "Утверждающая",
}

export enum ProgressiveWebApplicationMode {
  InBrowserWindow = "InBrowserWindow",
  InStandaloneWindow = "InStandaloneWindow",
}

export enum ProgressiveWebApplicationModeEnterprise {
  ВОкнеБраузера = "ВОкнеБраузера",
  ВОтдельномОкне = "ВОтдельномОкне",
}

export enum AdditionalShowMode {
  Irrelevance = "Irrelevance",
  DontUse = "DontUse",
}

export enum AdditionalShowModeEnterprise {
  Неактуальность = "Неактуальность",
  НеИспользовать = "НеИспользовать",
}

export enum AppearanceAreaType {
  Group = "Group",
  Field = "Field",
}

export enum AppearanceAreaTypeEnterprise {
  Группировка = "Группировка",
  Поле = "Поле",
}

export enum ArrowStyle {
  Filled = "Filled",
  Blank = "Blank",
  None = "None",
}

export enum ArrowStyleEnterprise {
  Заполненная = "Заполненная",
  Незаполненная = "Незаполненная",
  Нет = "Нет",
}

export enum AutoCapitalizationOnTextInput {
  Auto = "Auto",
  AllCharacters = "AllCharacters",
  None = "None",
  Sentences = "Sentences",
  Words = "Words",
}

export enum AutoCapitalizationOnTextInputEnterprise {
  Авто = "Авто",
  ВсеСимволы = "ВсеСимволы",
  Нет = "Нет",
  Предложения = "Предложения",
  Слова = "Слова",
}

export enum AutoCorrectionOnTextInput {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum AutoCorrectionOnTextInputEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum AutoSaveFormDataInSettings {
  Use = "Use",
  DontUse = "DontUse",
}

export enum AutoSaveFormDataInSettingsEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum AutoShowClearButtonMode {
  Auto = "Auto",
  Always = "Always",
  FilledOnly = "FilledOnly",
}

export enum AutoShowClearButtonModeEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
  ТолькоДляЗаполненного = "ТолькоДляЗаполненного",
}

export enum AutoShowOpenButtonMode {
  Auto = "Auto",
  Always = "Always",
  FilledOnly = "FilledOnly",
}

export enum AutoShowOpenButtonModeEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
  ТолькоДляЗаполненного = "ТолькоДляЗаполненного",
}

export enum AutoShowStateMode {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
  ShowOnComposition = "ShowOnComposition",
}

export enum AutoShowStateModeEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
  ОтображатьПриФормировании = "ОтображатьПриФормировании",
}

export enum AutonumerationInForm {
  Auto = "Auto",
  DontUse = "DontUse",
}

export enum AutonumerationInFormEnterprise {
  Авто = "Авто",
  НеИспользовать = "НеИспользовать",
}

export enum ButtonGroupRepresentation {
  Auto = "Auto",
  Compact = "Compact",
  Usual = "Usual",
}

export enum ButtonGroupRepresentationEnterprise {
  Авто = "Авто",
  Компактное = "Компактное",
  Обычное = "Обычное",
}

export enum ButtonLocationInCommandBar {
  Auto = "Auto",
  InAdditionalSubmenu = "InAdditionalSubmenu",
  InCommandBar = "InCommandBar",
  InCommandBarAndInAdditionalSubmenu = "InCommandBarAndInAdditionalSubmenu",
}

export enum ButtonLocationInCommandBarEnterprise {
  Авто = "Авто",
  ВДополнительномПодменю = "ВДополнительномПодменю",
  ВКоманднойПанели = "ВКоманднойПанели",
  ВКоманднойПанелиИВДополнительномПодменю = "ВКоманднойПанелиИВДополнительномПодменю",
}

export enum ButtonPictureLocation {
  Left = "Left",
  Right = "Right",
}

export enum ButtonPictureLocationEnterprise {
  Лево = "Лево",
  Право = "Право",
}

export enum ButtonRepresentation {
  Auto = "Auto",
  Picture = "Picture",
  PictureAndText = "PictureAndText",
  Text = "Text",
}

export enum ButtonRepresentationEnterprise {
  Авто = "Авто",
  Картинка = "Картинка",
  КартинкаИТекст = "КартинкаИТекст",
  Текст = "Текст",
}

export enum ButtonShape {
  Auto = "Auto",
  Usual = "Usual",
  Oval = "Oval",
}

export enum ButtonShapeEnterprise {
  Авто = "Авто",
  Обычная = "Обычная",
  Овал = "Овал",
}

export enum ButtonShapeRepresentation {
  Auto = "Auto",
  Always = "Always",
  None = "None",
  WhenActive = "WhenActive",
}

export enum ButtonShapeRepresentationEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
  Нет = "Нет",
  ПриАктивности = "ПриАктивности",
}

export enum CheckBoxType {
  Auto = "Auto",
  Switch = "Switch",
  Tumbler = "Tumbler",
  CheckBox = "CheckBox",
}

export enum CheckBoxTypeEnterprise {
  Авто = "Авто",
  Выключатель = "Выключатель",
  Тумблер = "Тумблер",
  Флажок = "Флажок",
}

export enum ChildFormItemsGroup {
  Vertical = "Vertical",
  Horizontal = "Horizontal",
  AlwaysHorizontal = "AlwaysHorizontal",
  HorizontalIfPossible = "HorizontalIfPossible",
}

export enum ChildFormItemsGroupEnterprise {
  Вертикальная = "Вертикальная",
  Горизонтальная = "Горизонтальная",
  ГоризонтальнаяВсегда = "ГоризонтальнаяВсегда",
  ГоризонтальнаяЕслиВозможно = "ГоризонтальнаяЕслиВозможно",
}

export enum ChildFormItemsWidth {
  Auto = "Auto",
  LeftNarrowest = "LeftNarrowest",
  LeftWidest = "LeftWidest",
  LeftNarrow = "LeftNarrow",
  LeftWide = "LeftWide",
  Equal = "Equal",
}

export enum ChildFormItemsWidthEnterprise {
  Авто = "Авто",
  ЛевыйОченьУзкий = "ЛевыйОченьУзкий",
  ЛевыйОченьШирокий = "ЛевыйОченьШирокий",
  ЛевыйУзкий = "ЛевыйУзкий",
  ЛевыйШирокий = "ЛевыйШирокий",
  Одинаковая = "Одинаковая",
}

export enum ChoiceButtonRepresentation {
  Auto = "Auto",
  ShowInDropList = "ShowInDropList",
  ShowInDropListAndInInputField = "ShowInDropListAndInInputField",
  ShowInInputField = "ShowInInputField",
}

export enum ChoiceButtonRepresentationEnterprise {
  Авто = "Авто",
  ОтображатьВВыпадающемСписке = "ОтображатьВВыпадающемСписке",
  ОтображатьВВыпадающемСпискеИВПолеВвода = "ОтображатьВВыпадающемСпискеИВПолеВвода",
  ОтображатьВПолеВвода = "ОтображатьВПолеВвода",
}

export enum ChoiceHistoryOnInput {
  Auto = "Auto",
  DontUse = "DontUse",
}

export enum ChoiceHistoryOnInputEnterprise {
  Авто = "Авто",
  НеИспользовать = "НеИспользовать",
}

export enum ClipboardDataStandardFormat {
  HTML = "HTML",
  Picture = "Picture",
  Text = "Text",
}

export enum ClipboardDataStandardFormatEnterprise {
  HTML = "HTML",
  Картинка = "Картинка",
  Текст = "Текст",
}

export enum CollapseFormItemsByImportance {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum CollapseFormItemsByImportanceEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ColorDepth {
  BitPerPixel1 = "BitPerPixel1",
  BitPerPixel24 = "BitPerPixel24",
  BitPerPixel32 = "BitPerPixel32",
  BitPerPixel4 = "BitPerPixel4",
  BitPerPixel8 = "BitPerPixel8",
}

export enum ColorDepthEnterprise {
  БитНаПиксел1 = "БитНаПиксел1",
  БитНаПиксел24 = "БитНаПиксел24",
  БитНаПиксел32 = "БитНаПиксел32",
  БитНаПиксел4 = "БитНаПиксел4",
  БитНаПиксел8 = "БитНаПиксел8",
}

export enum ColumnEditMode {
  Enter = "Enter",
  EnterOnInput = "EnterOnInput",
  Directly = "Directly",
}

export enum ColumnEditModeEnterprise {
  Вход = "Вход",
  ВходПриВводе = "ВходПриВводе",
  Непосредственно = "Непосредственно",
}

export enum ColumnLocation {
  SameColumn = "SameColumn",
  OnNextRow = "OnNextRow",
  NewColumn = "NewColumn",
}

export enum ColumnLocationEnterprise {
  ВТойЖеКолонке = "ВТойЖеКолонке",
  НаСледующейСтроке = "НаСледующейСтроке",
  НоваяКолонка = "НоваяКолонка",
}

export enum ColumnSizeChange {
  Change = "Change",
  DontChange = "DontChange",
}

export enum ColumnSizeChangeEnterprise {
  Изменять = "Изменять",
  НеИзменять = "НеИзменять",
}

export enum ColumnsGroup {
  Vertical = "Vertical",
  InCell = "InCell",
  Horizontal = "Horizontal",
}

export enum ColumnsGroupEnterprise {
  Вертикальная = "Вертикальная",
  ВЯчейке = "ВЯчейке",
  Горизонтальная = "Горизонтальная",
}

export enum CommandBarButtonAlignment {
  Left = "Left",
  Right = "Right",
  Center = "Center",
}

export enum CommandBarButtonAlignmentEnterprise {
  Лево = "Лево",
  Право = "Право",
  Центр = "Центр",
}

export enum CommandBarButtonOrder {
  Asc = "Asc",
  DontOrder = "DontOrder",
  Desc = "Desc",
}

export enum CommandBarButtonOrderEnterprise {
  Возр = "Возр",
  НеУпорядочивать = "НеУпорядочивать",
  Убыв = "Убыв",
}

export enum CommandBarButtonRepresentation {
  Auto = "Auto",
  Picture = "Picture",
  Text = "Text",
  PictureText = "PictureText",
}

export enum CommandBarButtonRepresentationEnterprise {
  Авто = "Авто",
  Картинка = "Картинка",
  Надпись = "Надпись",
  НадписьКартинка = "НадписьКартинка",
}

export enum CommandBarButtonType {
  Action = "Action",
  Popup = "Popup",
  Separator = "Separator",
}

export enum CommandBarButtonTypeEnterprise {
  Действие = "Действие",
  Подменю = "Подменю",
  Разделитель = "Разделитель",
}

export enum CommandGroupCategory {
  FormCommandBar = "FormCommandBar",
  ActionsPanel = "ActionsPanel",
  NavigationPanel = "NavigationPanel",
  FormNavigationPanel = "FormNavigationPanel",
}

export enum CommandGroupCategoryEnterprise {
  КоманднаяПанельФормы = "КоманднаяПанельФормы",
  ПанельДействий = "ПанельДействий",
  ПанельНавигации = "ПанельНавигации",
  ПанельНавигацииФормы = "ПанельНавигацииФормы",
}

export enum CommandParameterUseMode {
  Multiple = "Multiple",
  Single = "Single",
}

export enum CommandParameterUseModeEnterprise {
  Множественный = "Множественный",
  Одиночный = "Одиночный",
}

export enum ConnectorLineType {
  None = "None",
  Dashed = "Dashed",
  DashDotted = "DashDotted",
  DashDottedDotted = "DashDottedDotted",
  Solid = "Solid",
  Dotted = "Dotted",
}

export enum ConnectorLineTypeEnterprise {
  НетЛинии = "НетЛинии",
  Пунктир = "Пунктир",
  ПунктирТочка = "ПунктирТочка",
  ПунктирТочкаТочка = "ПунктирТочкаТочка",
  Сплошная = "Сплошная",
  Точечная = "Точечная",
}

export enum ConnectorTextLocation {
  FirstSegment = "FirstSegment",
  Middle = "Middle",
}

export enum ConnectorTextLocationEnterprise {
  ПервыйСегмент = "ПервыйСегмент",
  СерединаЛинии = "СерединаЛинии",
}

export enum ControlBorderType {
  WithoutBorder = "WithoutBorder",
  Indented = "Indented",
  Embossed = "Embossed",
  Double = "Double",
  DoubleUnderline = "DoubleUnderline",
  Single = "Single",
  Underline = "Underline",
  Rounded = "Rounded",
  Overline = "Overline",
}

export enum ControlBorderTypeEnterprise {
  БезРамки = "БезРамки",
  Вдавленная = "Вдавленная",
  Выпуклая = "Выпуклая",
  Двойная = "Двойная",
  ДвойноеПодчеркивание = "ДвойноеПодчеркивание",
  Одинарная = "Одинарная",
  Подчеркивание = "Подчеркивание",
  Скругленная = "Скругленная",
  ЧертаСверху = "ЧертаСверху",
}

export enum ControlCollapseMode {
  Top = "Top",
  Left = "Left",
  None = "None",
  Bottom = "Bottom",
  Right = "Right",
}

export enum ControlCollapseModeEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Нет = "Нет",
  Низ = "Низ",
  Право = "Право",
}

export enum ControlEdge {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
  Center = "Center",
}

export enum ControlEdgeEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
  Центр = "Центр",
}

export enum CurrentRowUse {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum CurrentRowUseEnterprise {
  Авто = "Авто",
  Использует = "Использует",
  НеИспользует = "НеИспользует",
}

export enum DataChangeType {
  Create = "Create",
  Update = "Update",
  Delete = "Delete",
}

export enum DataChangeTypeEnterprise {
  Добавление = "Добавление",
  Изменение = "Изменение",
  Удаление = "Удаление",
}

export enum DateSelectionMode {
  Interval = "Interval",
  Multiple = "Multiple",
  Single = "Single",
}

export enum DateSelectionModeEnterprise {
  Интервал = "Интервал",
  Множественный = "Множественный",
  Одиночный = "Одиночный",
}

export enum DimensionAttributePlacementType {
  Together = "Together",
  WithDimensions = "WithDimensions",
  Separately = "Separately",
}

export enum DimensionAttributePlacementTypeEnterprise {
  Вместе = "Вместе",
  ВместеСИзмерениями = "ВместеСИзмерениями",
  Отдельно = "Отдельно",
}

export enum DimensionPlacementType {
  Together = "Together",
  Separately = "Separately",
  SeparatelyAndInTotalsOnly = "SeparatelyAndInTotalsOnly",
}

export enum DimensionPlacementTypeEnterprise {
  Вместе = "Вместе",
  Отдельно = "Отдельно",
  ОтдельноИТолькоВИтогах = "ОтдельноИТолькоВИтогах",
}

export enum DisplayImportance {
  Auto = "Auto",
  High = "High",
  Low = "Low",
  Usual = "Usual",
  VeryHigh = "VeryHigh",
  VeryLow = "VeryLow",
}

export enum DisplayImportanceEnterprise {
  Авто = "Авто",
  Высокая = "Высокая",
  Низкая = "Низкая",
  Обычная = "Обычная",
  ОченьВысокая = "ОченьВысокая",
  ОченьНизкая = "ОченьНизкая",
}

export enum DragAction {
  Choice = "Choice",
  Copy = "Copy",
  Cancel = "Cancel",
  Move = "Move",
}

export enum DragActionEnterprise {
  Выбор = "Выбор",
  Копирование = "Копирование",
  Отмена = "Отмена",
  Перемещение = "Перемещение",
}

export enum DragAllowedActions {
  Copy = "Copy",
  CopyAndMove = "CopyAndMove",
  DontProcess = "DontProcess",
  Move = "Move",
}

export enum DragAllowedActionsEnterprise {
  Копирование = "Копирование",
  КопированиеИПеремещение = "КопированиеИПеремещение",
  НеОбрабатывать = "НеОбрабатывать",
  Перемещение = "Перемещение",
}

export enum DrawingSelectionShowMode {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum DrawingSelectionShowModeEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum EditTextUpdate {
  Auto = "Auto",
  Always = "Always",
  DontUse = "DontUse",
  OnValueChange = "OnValueChange",
}

export enum EditTextUpdateEnterprise {
  Авто = "Авто",
  Всегда = "Всегда",
  НеИспользовать = "НеИспользовать",
  ПриИзмененииЗначения = "ПриИзмененииЗначения",
}

export enum FitPageMode {
  Auto = "Auto",
  PageWidth = "PageWidth",
  Proportionally = "Proportionally",
}

export enum FitPageModeEnterprise {
  Авто = "Авто",
  ПоШиринеСтраницы = "ПоШиринеСтраницы",
  Пропорционально = "Пропорционально",
}

export enum FixingInTable {
  Left = "Left",
  None = "None",
  Right = "Right",
}

export enum FixingInTableEnterprise {
  Лево = "Лево",
  Нет = "Нет",
  Право = "Право",
}

export enum FoldersAndItems {
  Auto = "Auto",
  Folders = "Folders",
  FoldersAndItems = "FoldersAndItems",
  Items = "Items",
}

export enum FoldersAndItemsEnterprise {
  Авто = "Авто",
  Группы = "Группы",
  ГруппыИЭлементы = "ГруппыИЭлементы",
  Элементы = "Элементы",
}

export enum FormButtonPictureLocation {
  Auto = "Auto",
  Left = "Left",
  Right = "Right",
}

export enum FormButtonPictureLocationEnterprise {
  Авто = "Авто",
  Лево = "Лево",
  Право = "Право",
}

export enum FormButtonType {
  Hyperlink = "Hyperlink",
  CommandBarHyperlink = "CommandBarHyperlink",
  CommandBarButton = "CommandBarButton",
  UsualButton = "UsualButton",
}

export enum FormButtonTypeEnterprise {
  Гиперссылка = "Гиперссылка",
  ГиперссылкаКоманднойПанели = "ГиперссылкаКоманднойПанели",
  КнопкаКоманднойПанели = "КнопкаКоманднойПанели",
  ОбычнаяКнопка = "ОбычнаяКнопка",
}

export enum FormCommandBarLabelLocation {
  Auto = "Auto",
  Top = "Top",
  None = "None",
  Bottom = "Bottom",
}

export enum FormCommandBarLabelLocationEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Нет = "Нет",
  Низ = "Низ",
}

export enum FormConversationsRepresentation {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum FormConversationsRepresentationEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum FormDecorationType {
  Picture = "Picture",
  Label = "Label",
}

export enum FormDecorationTypeEnterprise {
  Картинка = "Картинка",
  Надпись = "Надпись",
}

export enum FormFieldType {
  HTMLDocumentField = "HTMLDocumentField",
  PDFDocumentField = "PDFDocumentField",
  InputField = "InputField",
  GeographicalSchemaField = "GeographicalSchemaField",
  GraphicalSchemaField = "GraphicalSchemaField",
  DendrogramField = "DendrogramField",
  ChartField = "ChartField",
  GanttChartField = "GanttChartField",
  ProgressBarField = "ProgressBarField",
  CalendarField = "CalendarField",
  PictureField = "PictureField",
  LabelField = "LabelField",
  RadioButtonField = "RadioButtonField",
  PeriodField = "PeriodField",
  PlannerField = "PlannerField",
  TrackBarField = "TrackBarField",
  SpreadsheetDocumentField = "SpreadsheetDocumentField",
  TextDocumentField = "TextDocumentField",
  CheckBoxField = "CheckBoxField",
  FormattedDocumentField = "FormattedDocumentField",
}

export enum FormFieldTypeEnterprise {
  ПолеHTMLДокумента = "ПолеHTMLДокумента",
  ПолеPDFДокумента = "ПолеPDFДокумента",
  ПолеВвода = "ПолеВвода",
  ПолеГеографическойСхемы = "ПолеГеографическойСхемы",
  ПолеГрафическойСхемы = "ПолеГрафическойСхемы",
  ПолеДендрограммы = "ПолеДендрограммы",
  ПолеДиаграммы = "ПолеДиаграммы",
  ПолеДиаграммыГанта = "ПолеДиаграммыГанта",
  ПолеИндикатора = "ПолеИндикатора",
  ПолеКалендаря = "ПолеКалендаря",
  ПолеКартинки = "ПолеКартинки",
  ПолеНадписи = "ПолеНадписи",
  ПолеПереключателя = "ПолеПереключателя",
  ПолеПериода = "ПолеПериода",
  ПолеПланировщика = "ПолеПланировщика",
  ПолеПолосыРегулирования = "ПолеПолосыРегулирования",
  ПолеТабличногоДокумента = "ПолеТабличногоДокумента",
  ПолеТекстовогоДокумента = "ПолеТекстовогоДокумента",
  ПолеФлажка = "ПолеФлажка",
  ПолеФорматированногоДокумента = "ПолеФорматированногоДокумента",
}

export enum FormGroupType {
  ButtonGroup = "ButtonGroup",
  ColumnGroup = "ColumnGroup",
  CommandBar = "CommandBar",
  ContextMenu = "ContextMenu",
  UsualGroup = "UsualGroup",
  Popup = "Popup",
  Page = "Page",
  Pages = "Pages",
}

export enum FormGroupTypeEnterprise {
  ГруппаКнопок = "ГруппаКнопок",
  ГруппаКолонок = "ГруппаКолонок",
  КоманднаяПанель = "КоманднаяПанель",
  КонтекстноеМеню = "КонтекстноеМеню",
  ОбычнаяГруппа = "ОбычнаяГруппа",
  Подменю = "Подменю",
  Страница = "Страница",
  Страницы = "Страницы",
}

export enum FormItemAdditionType {
  ViewStatusRepresentation = "ViewStatusRepresentation",
  SearchStringRepresentation = "SearchStringRepresentation",
  SearchControl = "SearchControl",
}

export enum FormItemAdditionTypeEnterprise {
  ОтображениеСостоянияПросмотра = "ОтображениеСостоянияПросмотра",
  ОтображениеСтрокиПоиска = "ОтображениеСтрокиПоиска",
  УправлениеПоиском = "УправлениеПоиском",
}

export enum FormItemCommandBarLabelLocation {
  Auto = "Auto",
  Top = "Top",
  None = "None",
  Bottom = "Bottom",
}

export enum FormItemCommandBarLabelLocationEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Нет = "Нет",
  Низ = "Низ",
}

export enum FormItemOrientation {
  Vertical = "Vertical",
  Horizontal = "Horizontal",
}

export enum FormItemOrientationEnterprise {
  Вертикально = "Вертикально",
  Горизонтально = "Горизонтально",
}

export enum FormItemSpacing {
  Auto = "Auto",
  Double = "Double",
  None = "None",
  Single = "Single",
  Half = "Half",
  OneAndHalf = "OneAndHalf",
}

export enum FormItemSpacingEnterprise {
  Авто = "Авто",
  Двойной = "Двойной",
  Нет = "Нет",
  Одинарный = "Одинарный",
  Половинный = "Половинный",
  Полуторный = "Полуторный",
}

export enum FormItemTitleLocation {
  Auto = "Auto",
  Top = "Top",
  Left = "Left",
  None = "None",
  Bottom = "Bottom",
  Right = "Right",
}

export enum FormItemTitleLocationEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Лево = "Лево",
  Нет = "Нет",
  Низ = "Низ",
  Право = "Право",
}

export enum FormPagesRepresentation {
  Auto = "Auto",
  TabsOnTop = "TabsOnTop",
  TabsOnLeftHorizontal = "TabsOnLeftHorizontal",
  TabsOnBottom = "TabsOnBottom",
  TabsOnRightHorizontal = "TabsOnRightHorizontal",
  None = "None",
  Swipe = "Swipe",
}

export enum FormPagesRepresentationEnterprise {
  Авто = "Авто",
  ЗакладкиСверху = "ЗакладкиСверху",
  ЗакладкиСлеваГоризонтально = "ЗакладкиСлеваГоризонтально",
  ЗакладкиСнизу = "ЗакладкиСнизу",
  ЗакладкиСправаГоризонтально = "ЗакладкиСправаГоризонтально",
  Нет = "Нет",
  Пролистывание = "Пролистывание",
}

export enum FormPagesState {
  Titles = "Titles",
  TitlesAndCurrentPage = "TitlesAndCurrentPage",
  CurrentPage = "CurrentPage",
}

export enum FormPagesStateEnterprise {
  Заголовки = "Заголовки",
  ЗаголовкиИТекущаяСтраница = "ЗаголовкиИТекущаяСтраница",
  ТекущаяСтраница = "ТекущаяСтраница",
}

export enum FormStandardURLVariant {
  ReportVariant = "ReportVariant",
  Record = "Record",
  ListCurrentRowRecord = "ListCurrentRowRecord",
  Object = "Object",
  ListCurrentRowObject = "ListCurrentRowObject",
  Report = "Report",
  ReportWithCurrentSettings = "ReportWithCurrentSettings",
  List = "List",
  ListWithCurrentSettings = "ListWithCurrentSettings",
  ListWithCurrentSettingsAndRow = "ListWithCurrentSettingsAndRow",
}

export enum FormStandardURLVariantEnterprise {
  ВариантОтчета = "ВариантОтчета",
  Запись = "Запись",
  ЗаписьТекущейСтрокиСписка = "ЗаписьТекущейСтрокиСписка",
  Объект = "Объект",
  ОбъектТекущейСтрокиСписка = "ОбъектТекущейСтрокиСписка",
  Отчет = "Отчет",
  ОтчетСТекущимиНастройками = "ОтчетСТекущимиНастройками",
  Список = "Список",
  СписокСТекущимиНастройками = "СписокСТекущимиНастройками",
  СписокСТекущимиНастройкамиИСтрокой = "СписокСТекущимиНастройкамиИСтрокой",
}

export enum FormWindowOpeningMode {
  LockWholeInterface = "LockWholeInterface",
  LockOwnerWindow = "LockOwnerWindow",
  DontBlock = "DontBlock",
}

export enum FormWindowOpeningModeEnterprise {
  БлокироватьВесьИнтерфейс = "БлокироватьВесьИнтерфейс",
  БлокироватьОкноВладельца = "БлокироватьОкноВладельца",
  НеБлокировать = "НеБлокировать",
}

export enum GraphicalSchemaGridDrawMode {
  Lines = "Lines",
  None = "None",
  Dots = "Dots",
  Chess = "Chess",
}

export enum GraphicalSchemaGridDrawModeEnterprise {
  Линии = "Линии",
  НеРисовать = "НеРисовать",
  Точки = "Точки",
  ШахматнаяСетка = "ШахматнаяСетка",
}

export enum GraphicalSchemaItemPictureLocation {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
  Center = "Center",
}

export enum GraphicalSchemaItemPictureLocationEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
  Центр = "Центр",
}

export enum GraphicalSchemaShapes {
  Block = "Block",
  Document = "Document",
  None = "None",
  Folder = "Folder",
  VerticalBrackets = "VerticalBrackets",
  HorizontalBrackets = "HorizontalBrackets",
  UpArrow = "UpArrow",
  UpDownArrow = "UpDownArrow",
  LeftArrow = "LeftArrow",
  LeftRightArrow = "LeftRightArrow",
  DownArrow = "DownArrow",
  RightArrow = "RightArrow",
  File = "File",
  Ellipse = "Ellipse",
}

export enum GraphicalSchemaShapesEnterprise {
  Блок = "Блок",
  Документ = "Документ",
  Нет = "Нет",
  Папка = "Папка",
  СкобкиВертикальные = "СкобкиВертикальные",
  СкобкиГоризонтальные = "СкобкиГоризонтальные",
  СтрелкаВверх = "СтрелкаВверх",
  СтрелкаВверхВниз = "СтрелкаВверхВниз",
  СтрелкаВлево = "СтрелкаВлево",
  СтрелкаВлевоВправо = "СтрелкаВлевоВправо",
  СтрелкаВниз = "СтрелкаВниз",
  СтрелкаВправо = "СтрелкаВправо",
  Файл = "Файл",
  Эллипс = "Эллипс",
}

export enum GraphicalSchemeElementSideType {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
  Center = "Center",
}

export enum GraphicalSchemeElementSideTypeEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
  Центр = "Центр",
}

export enum HTMLDocumentFieldMode {
  Browse = "Browse",
  Design = "Design",
}

export enum HTMLDocumentFieldModeEnterprise {
  Просмотр = "Просмотр",
  Редактирование = "Редактирование",
}

export enum HorizontalAlign {
  Auto = "Auto",
  Left = "Left",
  Justify = "Justify",
  Right = "Right",
  Center = "Center",
}

export enum HorizontalAlignEnterprise {
  Авто = "Авто",
  Лево = "Лево",
  ПоШирине = "ПоШирине",
  Право = "Право",
  Центр = "Центр",
}

export enum IncompleteChoiceMode {
  OnActivate = "OnActivate",
  OnEnterPressed = "OnEnterPressed",
}

export enum IncompleteChoiceModeEnterprise {
  ПриАктивизации = "ПриАктивизации",
  ПриНажатииEnter = "ПриНажатииEnter",
}

export enum InitialListView {
  Auto = "Auto",
  End = "End",
  Beginning = "Beginning",
}

export enum InitialListViewEnterprise {
  Авто = "Авто",
  Конец = "Конец",
  Начало = "Начало",
}

export enum InitialTreeView {
  NoExpand = "NoExpand",
  ExpandTopLevel = "ExpandTopLevel",
  ExpandAllLevels = "ExpandAllLevels",
}

export enum InitialTreeViewEnterprise {
  НеРаскрывать = "НеРаскрывать",
  РаскрыватьВерхнийУровень = "РаскрыватьВерхнийУровень",
  РаскрыватьВсеУровни = "РаскрыватьВсеУровни",
}

export enum InputFieldAutofillHint {
  Email = "Email",
  City = "City",
  GivenName = "GivenName",
  UserName = "UserName",
  PostalCode = "PostalCode",
  DontUse = "DontUse",
  NewPassword = "NewPassword",
  CreditCardNumber = "CreditCardNumber",
  PhoneNumber = "PhoneNumber",
  OneTimeCode = "OneTimeCode",
  MiddleName = "MiddleName",
  Password = "Password",
  FullName = "FullName",
  NamePrefix = "NamePrefix",
  Region = "Region",
  Country = "Country",
  NameSuffix = "NameSuffix",
  Street = "Street",
  FamilyName = "FamilyName",
}

export enum InputFieldAutofillHintEnterprise {
  Email = "Email",
  Город = "Город",
  Имя = "Имя",
  ИмяПользователя = "ИмяПользователя",
  Индекс = "Индекс",
  НеИспользовать = "НеИспользовать",
  НовыйПароль = "НовыйПароль",
  НомерБанковскойКарты = "НомерБанковскойКарты",
  НомерТелефона = "НомерТелефона",
  ОдноразовыйПароль = "ОдноразовыйПароль",
  Отчество = "Отчество",
  Пароль = "Пароль",
  ПолноеИмя = "ПолноеИмя",
  ПрефиксИмени = "ПрефиксИмени",
  Регион = "Регион",
  Страна = "Страна",
  СуффиксИмени = "СуффиксИмени",
  Улица = "Улица",
  Фамилия = "Фамилия",
}

export enum InputFieldCommandSource {
  MultipleValue = "MultipleValue",
  InputArea = "InputArea",
}

export enum InputFieldCommandSourceEnterprise {
  МножественноеЗначение = "МножественноеЗначение",
  ОбластьВвода = "ОбластьВвода",
}

export enum InputFieldMultipleValuePictureShape {
  Auto = "Auto",
  Rect = "Rect",
  Circle = "Circle",
}

export enum InputFieldMultipleValuePictureShapeEnterprise {
  Авто = "Авто",
  Квадрат = "Квадрат",
  Круг = "Круг",
}

export enum InputFieldMultipleValuePictureSize {
  Auto = "Auto",
  Large = "Large",
  Small = "Small",
  Medium = "Medium",
}

export enum InputFieldMultipleValuePictureSizeEnterprise {
  Авто = "Авто",
  Крупный = "Крупный",
  Маленький = "Маленький",
  Средний = "Средний",
}

export enum InputFieldStandardCommand {
  Paste = "Paste",
  Choose = "Choose",
  SelectAll = "SelectAll",
  Cut = "Cut",
  AddEmptyValue = "AddEmptyValue",
  Copy = "Copy",
  SearchEverywhere = "SearchEverywhere",
  Open = "Open",
  Clear = "Clear",
  Create = "Create",
  Delete = "Delete",
}

export enum InputFieldStandardCommandEnterprise {
  Вставить = "Вставить",
  Выбрать = "Выбрать",
  ВыделитьВсе = "ВыделитьВсе",
  Вырезать = "Вырезать",
  ДобавитьПустоеЗначение = "ДобавитьПустоеЗначение",
  Копировать = "Копировать",
  НайтиВезде = "НайтиВезде",
  Открыть = "Открыть",
  Очистить = "Очистить",
  Создать = "Создать",
  Удалить = "Удалить",
}

export enum ItemHeightControlVariant {
  Auto = "Auto",
  UseHeightInFormRows = "UseHeightInFormRows",
  UseContentHeight = "UseContentHeight",
}

export enum ItemHeightControlVariantEnterprise {
  Авто = "Авто",
  ВСтрокахФормы = "ВСтрокахФормы",
  ПоСодержимому = "ПоСодержимому",
}

export enum ItemHorizontalLocation {
  Auto = "Auto",
  Left = "Left",
  Right = "Right",
  Center = "Center",
}

export enum ItemHorizontalLocationEnterprise {
  Авто = "Авто",
  Лево = "Лево",
  Право = "Право",
  Центр = "Центр",
}

export enum ItemVerticalAlign {
  Auto = "Auto",
  Top = "Top",
  Bottom = "Bottom",
  Center = "Center",
}

export enum ItemVerticalAlignEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Низ = "Низ",
  Центр = "Центр",
}

export enum ItemsAndTitlesAlignVariant {
  Auto = "Auto",
  None = "None",
  ItemsLeftTitlesLeft = "ItemsLeftTitlesLeft",
  ItemsLeftTitlesRight = "ItemsLeftTitlesRight",
  ItemsRightTitlesLeft = "ItemsRightTitlesLeft",
  ItemsRightTitlesRight = "ItemsRightTitlesRight",
}

export enum ItemsAndTitlesAlignVariantEnterprise {
  Авто = "Авто",
  Нет = "Нет",
  ЭлементыЛевоЗаголовкиЛево = "ЭлементыЛевоЗаголовкиЛево",
  ЭлементыЛевоЗаголовкиПраво = "ЭлементыЛевоЗаголовкиПраво",
  ЭлементыПравоЗаголовкиЛево = "ЭлементыПравоЗаголовкиЛево",
  ЭлементыПравоЗаголовкиПраво = "ЭлементыПравоЗаголовкиПраво",
}

export enum LabelPictureLocation {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
  Center = "Center",
}

export enum LabelPictureLocationEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
  Центр = "Центр",
}

export enum LinkedValueChangeMode {
  DontChange = "DontChange",
  Clear = "Clear",
}

export enum LinkedValueChangeModeEnterprise {
  НеИзменять = "НеИзменять",
  Очищать = "Очищать",
}

export enum ListEditMode {
  InDialog = "InDialog",
  InList = "InList",
}

export enum ListEditModeEnterprise {
  ВДиалоге = "ВДиалоге",
  ВСписке = "ВСписке",
}

export enum MainClientApplicationWindowMode {
  EmbeddedWorkplace = "EmbeddedWorkplace",
  Kiosk = "Kiosk",
  Normal = "Normal",
  FullscreenWorkplace = "FullscreenWorkplace",
  Workplace = "Workplace",
}

export enum MainClientApplicationWindowModeEnterprise {
  ВстроенноеРабочееМесто = "ВстроенноеРабочееМесто",
  Киоск = "Киоск",
  Обычный = "Обычный",
  ПолноэкранноеРабочееМесто = "ПолноэкранноеРабочееМесто",
  РабочееМесто = "РабочееМесто",
}

export enum NewRowShowCheckVariant {
  DontCheck = "DontCheck",
  FilterMismatchMessage = "FilterMismatchMessage",
}

export enum NewRowShowCheckVariantEnterprise {
  НеПроверять = "НеПроверять",
  СообщатьОНесоответствииОтбору = "СообщатьОНесоответствииОтбору",
}

export enum OnScreenKeyboardReturnKeyText {
  Auto = "Auto",
  Return = "Return",
  Done = "Done",
  Next = "Next",
  Search = "Search",
  Send = "Send",
  Go = "Go",
  Join = "Join",
  Continue = "Continue",
}

export enum OnScreenKeyboardReturnKeyTextEnterprise {
  Авто = "Авто",
  Ввод = "Ввод",
  Готово = "Готово",
  Далее = "Далее",
  Найти = "Найти",
  Отправить = "Отправить",
  Перейти = "Перейти",
  Подключиться = "Подключиться",
  Продолжить = "Продолжить",
}

export enum Orientation {
  Auto = "Auto",
  Vertical = "Vertical",
  Horizontal = "Horizontal",
}

export enum OrientationEnterprise {
  Авто = "Авто",
  Вертикально = "Вертикально",
  Горизонтально = "Горизонтально",
}

export enum PanelPictureLocation {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
  Center = "Center",
}

export enum PanelPictureLocationEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
  Центр = "Центр",
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
  UnknownFormat = "UnknownFormat",
}

export enum PictureFormatEnterprise {
  BMP = "BMP",
  EMF = "EMF",
  GIF = "GIF",
  Icon = "Icon",
  JPEG = "JPEG",
  PNG = "PNG",
  SVG = "SVG",
  TIFF = "TIFF",
  WMF = "WMF",
  НеизвестныйФормат = "НеизвестныйФормат",
}

export enum PictureSize {
  AutoSize = "AutoSize",
  AutoSizeIgnoreScale = "AutoSizeIgnoreScale",
  ByFontSize = "ByFontSize",
  Proportionally = "Proportionally",
  Stretch = "Stretch",
  RealSize = "RealSize",
  RealSizeIgnoreScale = "RealSizeIgnoreScale",
  Tile = "Tile",
}

export enum PictureSizeEnterprise {
  АвтоРазмер = "АвтоРазмер",
  АвтоРазмерБезУчетаМасштаба = "АвтоРазмерБезУчетаМасштаба",
  ПоРазмеруШрифта = "ПоРазмеруШрифта",
  Пропорционально = "Пропорционально",
  Растянуть = "Растянуть",
  РеальныйРазмер = "РеальныйРазмер",
  РеальныйРазмерБезУчетаМасштаба = "РеальныйРазмерБезУчетаМасштаба",
  Черепица = "Черепица",
}

export enum PrintDialogUseMode {
  Use = "Use",
  DontUse = "DontUse",
}

export enum PrintDialogUseModeEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ProgressBarSmoothingMode {
  Smooth = "Smooth",
  Broken = "Broken",
  BrokenTilt = "BrokenTilt",
}

export enum ProgressBarSmoothingModeEnterprise {
  Плавный = "Плавный",
  Прерывистый = "Прерывистый",
  ПрерывистыйНаклонный = "ПрерывистыйНаклонный",
}

export enum RadioButtonType {
  Auto = "Auto",
  RadioButton = "RadioButton",
  Tumbler = "Tumbler",
}

export enum RadioButtonTypeEnterprise {
  Авто = "Авто",
  Переключатель = "Переключатель",
  Тумблер = "Тумблер",
}

export enum RefreshRequestMethod {
  None = "None",
  PullFromTop = "PullFromTop",
  PullFromTopOrBottom = "PullFromTopOrBottom",
  PullFromBottom = "PullFromBottom",
}

export enum RefreshRequestMethodEnterprise {
  Нет = "Нет",
  ПотянутьСверху = "ПотянутьСверху",
  ПотянутьСверхуИлиСнизу = "ПотянутьСверхуИлиСнизу",
  ПотянутьСнизу = "ПотянутьСнизу",
}

export enum ReportFormType {
  Variant = "Variant",
  Settings = "Settings",
  Main = "Main",
}

export enum ReportFormTypeEnterprise {
  Вариант = "Вариант",
  Настройка = "Настройка",
  Основная = "Основная",
}

export enum ReportResultViewMode {
  Auto = "Auto",
  Compact = "Compact",
  Default = "Default",
}

export enum ReportResultViewModeEnterprise {
  Авто = "Авто",
  Компактный = "Компактный",
  Обычный = "Обычный",
}

export enum SaveFormDataInSettings {
  UseList = "UseList",
  DontUse = "DontUse",
}

export enum SaveFormDataInSettingsEnterprise {
  ИспользоватьСписок = "ИспользоватьСписок",
  НеИспользовать = "НеИспользовать",
}

export enum ScrollBarUse {
  AutoUse = "AutoUse",
  UseAlways = "UseAlways",
  DontUse = "DontUse",
}

export enum ScrollBarUseEnterprise {
  ИспользоватьАвтоматически = "ИспользоватьАвтоматически",
  ИспользоватьВсегда = "ИспользоватьВсегда",
  НеИспользовать = "НеИспользовать",
}

export enum ScrollingTextMode {
  Fast = "Fast",
  Slow = "Slow",
  DontUse = "DontUse",
  Normal = "Normal",
  VeryFast = "VeryFast",
  VerySlow = "VerySlow",
}

export enum ScrollingTextModeEnterprise {
  Быстро = "Быстро",
  Медленно = "Медленно",
  НеИспользовать = "НеИспользовать",
  Нормально = "Нормально",
  ОченьБыстро = "ОченьБыстро",
  ОченьМедленно = "ОченьМедленно",
}

export enum SearchControlLocation {
  Auto = "Auto",
  CommandBar = "CommandBar",
  None = "None",
}

export enum SearchControlLocationEnterprise {
  Авто = "Авто",
  КоманднаяПанель = "КоманднаяПанель",
  Нет = "Нет",
}

export enum SearchInTableOnInput {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum SearchInTableOnInputEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum SearchStringLocation {
  Auto = "Auto",
  Top = "Top",
  FormCaption = "FormCaption",
  CommandBar = "CommandBar",
  Bottom = "Bottom",
  PullFromTop = "PullFromTop",
  None = "None",
}

export enum SearchStringLocationEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  ЗаголовокФормы = "ЗаголовокФормы",
  КоманднаяПанель = "КоманднаяПанель",
  Низ = "Низ",
  ПотянутьСверху = "ПотянутьСверху",
  Нет = "Нет",
}

export enum SelectionShowMode {
  Always = "Always",
  DontShow = "DontShow",
  WhenActive = "WhenActive",
  WhenMultipleCellsSelected = "WhenMultipleCellsSelected",
  WhenMultipleCellsSelectedWhenActive = "WhenMultipleCellsSelectedWhenActive",
}

export enum SelectionShowModeEnterprise {
  Всегда = "Всегда",
  НеОтображать = "НеОтображать",
  ПриАктивности = "ПриАктивности",
  ПриВыделенииНесколькихЯчеек = "ПриВыделенииНесколькихЯчеек",
  ПриВыделенииНесколькихЯчеекПриАктивности = "ПриВыделенииНесколькихЯчеекПриАктивности",
}

export enum ShowTabs {
  DontUse = "DontUse",
  Top = "Top",
  TopMultiLine = "TopMultiLine",
  TopMultilineTransposition = "TopMultilineTransposition",
  TopScrolling = "TopScrolling",
  LeftVertical = "LeftVertical",
  LeftHorizontal = "LeftHorizontal",
  Bottom = "Bottom",
  BottomMultiLine = "BottomMultiLine",
  BottomMultilineTransposition = "BottomMultilineTransposition",
  BottomScrolling = "BottomScrolling",
  RightVertical = "RightVertical",
  RightHorizontal = "RightHorizontal",
}

export enum ShowTabsEnterprise {
  НеИспользовать = "НеИспользовать",
  Сверху = "Сверху",
  СверхуМногострочный = "СверхуМногострочный",
  СверхуМногострочныйСПерестановкой = "СверхуМногострочныйСПерестановкой",
  СверхуСПрокруткой = "СверхуСПрокруткой",
  СлеваВертикально = "СлеваВертикально",
  СлеваГоризонтально = "СлеваГоризонтально",
  Снизу = "Снизу",
  СнизуМногострочный = "СнизуМногострочный",
  СнизуМногострочныйСПерестановкой = "СнизуМногострочныйСПерестановкой",
  СнизуСПрокруткой = "СнизуСПрокруткой",
  СправаВертикально = "СправаВертикально",
  СправаГоризонтально = "СправаГоризонтально",
}

export enum SizeChangeMode {
  QuickChange = "QuickChange",
  Normal = "Normal",
}

export enum SizeChangeModeEnterprise {
  БыстроеИзменение = "БыстроеИзменение",
  Обычный = "Обычный",
}

export enum SpecialTextInputMode {
  Email = "Email",
  URL = "URL",
  Auto = "Auto",
  None = "None",
  PhoneNumber = "PhoneNumber",
  Digits = "Digits",
  DigitsAndPunctuation = "DigitsAndPunctuation",
}

export enum SpecialTextInputModeEnterprise {
  Email = "Email",
  URL = "URL",
  Авто = "Авто",
  Нет = "Нет",
  НомерТелефона = "НомерТелефона",
  Цифры = "Цифры",
  ЦифрыИПунктуация = "ЦифрыИПунктуация",
}

export enum SpellCheckingOnTextInput {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum SpellCheckingOnTextInputEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum StandardAppearance {
  Orange = "Orange",
  Asphalt = "Asphalt",
  None = "None",
  Turquoise = "Turquoise",
  Bronze = "Bronze",
  Spring = "Spring",
  Wood = "Wood",
  Winter = "Winter",
  Interface = "Interface",
  Stone = "Stone",
  Classic = "Classic",
  Classic2 = "Classic2",
  Classic3 = "Classic3",
  Ice = "Ice",
  Summer = "Summer",
  Copper = "Copper",
  Autumn = "Autumn",
  Sand = "Sand",
  Platinum = "Platinum",
  Silver = "Silver",
  Textile = "Textile",
  Grass = "Grass",
}

export enum StandardAppearanceEnterprise {
  Апельсин = "Апельсин",
  Асфальт = "Асфальт",
  БезОформления = "БезОформления",
  Бирюза = "Бирюза",
  Бронза = "Бронза",
  Весна = "Весна",
  Дерево = "Дерево",
  Зима = "Зима",
  Интерфейс = "Интерфейс",
  Камень = "Камень",
  Классика = "Классика",
  Классика2 = "Классика2",
  Классика3 = "Классика3",
  Лед = "Лед",
  Лето = "Лето",
  Медь = "Медь",
  Осень = "Осень",
  Песок = "Песок",
  Платина = "Платина",
  Серебро = "Серебро",
  Текстиль = "Текстиль",
  Трава = "Трава",
}

export enum StandardCommandsGroup {
  FormCommandBarImportant = "FormCommandBarImportant",
  FormCommandBarCreateBasedOn = "FormCommandBarCreateBasedOn",
  ActionsPanelReports = "ActionsPanelReports",
  ActionsPanelTools = "ActionsPanelTools",
  ActionsPanelCreate = "ActionsPanelCreate",
  NavigationPanelImportant = "NavigationPanelImportant",
  NavigationPanelOrdinary = "NavigationPanelOrdinary",
  NavigationPanelSeeAlso = "NavigationPanelSeeAlso",
  FormNavigationPanelImportant = "FormNavigationPanelImportant",
  FormNavigationPanelGoTo = "FormNavigationPanelGoTo",
  FormNavigationPanelSeeAlso = "FormNavigationPanelSeeAlso",
}

export enum StandardCommandsGroupEnterprise {
  КоманднаяПанельФормыВажное = "КоманднаяПанельФормыВажное",
  КоманднаяПанельФормыСоздатьНаОсновании = "КоманднаяПанельФормыСоздатьНаОсновании",
  ПанельДействийОтчеты = "ПанельДействийОтчеты",
  ПанельДействийСервис = "ПанельДействийСервис",
  ПанельДействийСоздать = "ПанельДействийСоздать",
  ПанельНавигацииВажное = "ПанельНавигацииВажное",
  ПанельНавигацииОбычное = "ПанельНавигацииОбычное",
  ПанельНавигацииСмТакже = "ПанельНавигацииСмТакже",
  ПанельНавигацииФормыВажное = "ПанельНавигацииФормыВажное",
  ПанельНавигацииФормыПерейти = "ПанельНавигацииФормыПерейти",
  ПанельНавигацииФормыСмТакже = "ПанельНавигацииФормыСмТакже",
}

export enum TableBehaviorOnHorizontalCompression {
  Auto = "Auto",
  MoveItemsByImportance = "MoveItemsByImportance",
  HideItemsByImportance = "HideItemsByImportance",
}

export enum TableBehaviorOnHorizontalCompressionEnterprise {
  Авто = "Авто",
  ПереноситьЭлементыПоВажности = "ПереноситьЭлементыПоВажности",
  СкрыватьЭлементыПоВажности = "СкрыватьЭлементыПоВажности",
}

export enum TableBoxRowInputMode {
  EndOfWindow = "EndOfWindow",
  EndOfList = "EndOfList",
  BeforeCurrentRow = "BeforeCurrentRow",
  AfterCurrentRow = "AfterCurrentRow",
}

export enum TableBoxRowInputModeEnterprise {
  ВКонецОкна = "ВКонецОкна",
  ВКонецСписка = "ВКонецСписка",
  ПередТекущейСтрокой = "ПередТекущейСтрокой",
  ПослеТекущейСтроки = "ПослеТекущейСтроки",
}

export enum TableBoxRowSelectionMode {
  Row = "Row",
  Cell = "Cell",
}

export enum TableBoxRowSelectionModeEnterprise {
  Строка = "Строка",
  Ячейка = "Ячейка",
}

export enum TableBoxSelectionMode {
  MultiLine = "MultiLine",
  SingleLine = "SingleLine",
}

export enum TableBoxSelectionModeEnterprise {
  Множественный = "Множественный",
  Одиночный = "Одиночный",
}

export enum TableCurrentRowUse {
  Auto = "Auto",
  Choice = "Choice",
  SelectionPresentation = "SelectionPresentation",
  SelectionPresentationAndChoice = "SelectionPresentationAndChoice",
}

export enum TableCurrentRowUseEnterprise {
  Авто = "Авто",
  Выбор = "Выбор",
  ОтображениеВыделения = "ОтображениеВыделения",
  ОтображениеВыделенияИВыбор = "ОтображениеВыделенияИВыбор",
}

export enum TableHeightControlVariant {
  Auto = "Auto",
  UseHeightInTableRows = "UseHeightInTableRows",
  UseHeightInFormRows = "UseHeightInFormRows",
  UseContentHeight = "UseContentHeight",
}

export enum TableHeightControlVariantEnterprise {
  Авто = "Авто",
  ВСтрокахТаблицы = "ВСтрокахТаблицы",
  ВСтрокахФормы = "ВСтрокахФормы",
  ПоСодержимому = "ПоСодержимому",
}

export enum TableRepresentation {
  Tree = "Tree",
  HierarchicalList = "HierarchicalList",
  List = "List",
}

export enum TableRepresentationEnterprise {
  Дерево = "Дерево",
  ИерархическийСписок = "ИерархическийСписок",
  Список = "Список",
}

export enum TableRowInputMode {
  EndOfWindow = "EndOfWindow",
  EndOfList = "EndOfList",
  BeforeCurrentRow = "BeforeCurrentRow",
  AfterCurrentRow = "AfterCurrentRow",
}

export enum TableRowInputModeEnterprise {
  ВКонецОкна = "ВКонецОкна",
  ВКонецСписка = "ВКонецСписка",
  ПередТекущейСтрокой = "ПередТекущейСтрокой",
  ПослеТекущейСтроки = "ПослеТекущейСтроки",
}

export enum TableRowSelectionMode {
  Row = "Row",
  Cell = "Cell",
}

export enum TableRowSelectionModeEnterprise {
  Строка = "Строка",
  Ячейка = "Ячейка",
}

export enum TableSelectionMode {
  MultiRow = "MultiRow",
  SingleRow = "SingleRow",
}

export enum TableSelectionModeEnterprise {
  Множественный = "Множественный",
  Одиночный = "Одиночный",
}

export enum TaskListMode {
  AllTasks = "AllTasks",
  ByPerformer = "ByPerformer",
}

export enum TaskListModeEnterprise {
  ВсеЗадачи = "ВсеЗадачи",
  ПоИсполнителю = "ПоИсполнителю",
}

export enum TextDirection {
  LeftToRight = "LeftToRight",
  RightToLeft = "RightToLeft",
}

export enum TextDirectionEnterprise {
  СлеваНаправо = "СлеваНаправо",
  СправаНалево = "СправаНалево",
}

export enum ThroughAlign {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum ThroughAlignEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum TimeScalePosition {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
}

export enum TimeScalePositionEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
}

export enum TitleLocation {
  TitleLeft = "TitleLeft",
  TitleRight = "TitleRight",
}

export enum TitleLocationEnterprise {
  ЗаголовокСлева = "ЗаголовокСлева",
  ЗаголовокСправа = "ЗаголовокСправа",
}

export enum ToolTipRepresentation {
  Auto = "Auto",
  Balloon = "Balloon",
  Button = "Button",
  None = "None",
  ShowAuto = "ShowAuto",
  ShowTop = "ShowTop",
  ShowLeft = "ShowLeft",
  ShowBottom = "ShowBottom",
  ShowRight = "ShowRight",
}

export enum ToolTipRepresentationEnterprise {
  Авто = "Авто",
  Всплывающая = "Всплывающая",
  Кнопка = "Кнопка",
  Нет = "Нет",
  ОтображатьАвто = "ОтображатьАвто",
  ОтображатьСверху = "ОтображатьСверху",
  ОтображатьСлева = "ОтображатьСлева",
  ОтображатьСнизу = "ОтображатьСнизу",
  ОтображатьСправа = "ОтображатьСправа",
}

export enum TrackBarMarkingAppearance {
  DontShow = "DontShow",
  TopLeft = "TopLeft",
  BottomRight = "BottomRight",
  BothSides = "BothSides",
}

export enum TrackBarMarkingAppearanceEnterprise {
  НеОтображать = "НеОтображать",
  СверхуИлиСлева = "СверхуИлиСлева",
  СнизуИлиСправа = "СнизуИлиСправа",
  СОбоихСторон = "СОбоихСторон",
}

export enum UseMenuMode {
  Use = "Use",
  UseExtra = "UseExtra",
  DontUse = "DontUse",
}

export enum UseMenuModeEnterprise {
  Использовать = "Использовать",
  ИспользоватьДополнительно = "ИспользоватьДополнительно",
  НеИспользовать = "НеИспользовать",
}

export enum UseOutput {
  Auto = "Auto",
  Disable = "Disable",
  Enable = "Enable",
}

export enum UseOutputEnterprise {
  Авто = "Авто",
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum UserNotificationStatus {
  Important = "Important",
  Information = "Information",
}

export enum UserNotificationStatusEnterprise {
  Важное = "Важное",
  Информация = "Информация",
}

export enum UsualGroupBehavior {
  Auto = "Auto",
  PopUp = "PopUp",
  Usual = "Usual",
  Collapsible = "Collapsible",
}

export enum UsualGroupBehaviorEnterprise {
  Авто = "Авто",
  Всплывающая = "Всплывающая",
  Обычное = "Обычное",
  Свертываемая = "Свертываемая",
}

export enum UsualGroupControlRepresentation {
  TitleHyperlink = "TitleHyperlink",
  Picture = "Picture",
}

export enum UsualGroupControlRepresentationEnterprise {
  ГиперссылкаЗаголовка = "ГиперссылкаЗаголовка",
  Картинка = "Картинка",
}

export enum UsualGroupRepresentation {
  None = "None",
  NormalSeparation = "NormalSeparation",
  StrongSeparation = "StrongSeparation",
  WeakSeparation = "WeakSeparation",
}

export enum UsualGroupRepresentationEnterprise {
  Нет = "Нет",
  ОбычноеВыделение = "ОбычноеВыделение",
  СильноеВыделение = "СильноеВыделение",
  СлабоеВыделение = "СлабоеВыделение",
}

export enum VerticalAlign {
  Top = "Top",
  Bottom = "Bottom",
  Center = "Center",
}

export enum VerticalAlignEnterprise {
  Верх = "Верх",
  Низ = "Низ",
  Центр = "Центр",
}

export enum VerticalFormScroll {
  Auto = "Auto",
  Use = "Use",
  UseWithoutStretch = "UseWithoutStretch",
  UseIfNecessary = "UseIfNecessary",
}

export enum VerticalFormScrollEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  ИспользоватьБезРастягивания = "ИспользоватьБезРастягивания",
  ИспользоватьПриНеобходимости = "ИспользоватьПриНеобходимости",
}

export enum ViewModeApplicationOnSetReportResult {
  Auto = "Auto",
  DontApply = "DontApply",
  Apply = "Apply",
}

export enum ViewModeApplicationOnSetReportResultEnterprise {
  Авто = "Авто",
  НеПрименять = "НеПрименять",
  Применять = "Применять",
}

export enum ViewScalingMode {
  Auto = "Auto",
  Large = "Large",
  Normal = "Normal",
}

export enum ViewScalingModeEnterprise {
  Авто = "Авто",
  Крупный = "Крупный",
  Обычный = "Обычный",
}

export enum ViewStatusLocation {
  Auto = "Auto",
  Top = "Top",
  None = "None",
  Bottom = "Bottom",
}

export enum ViewStatusLocationEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Нет = "Нет",
  Низ = "Низ",
}

export enum WarningOnEditRepresentation {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum WarningOnEditRepresentationEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum WindowAppearanceModeChange {
  Auto = "Auto",
  Disable = "Disable",
  Enable = "Enable",
}

export enum WindowAppearanceModeChangeEnterprise {
  Авто = "Авто",
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum WindowAppearanceModeVariant {
  Maximized = "Maximized",
  Minimized = "Minimized",
  Normal = "Normal",
}

export enum WindowAppearanceModeVariantEnterprise {
  Максимизированное = "Максимизированное",
  Минимизированное = "Минимизированное",
  Нормальное = "Нормальное",
}

export enum WindowDockVariant {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
}

export enum WindowDockVariantEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
}

export enum WindowLocationVariant {
  Auto = "Auto",
  DontOverlapOwner = "DontOverlapOwner",
  Center = "Center",
}

export enum WindowLocationVariantEnterprise {
  Авто = "Авто",
  НеПерекрыватьВладельца = "НеПерекрыватьВладельца",
  Центрировать = "Центрировать",
}

export enum WindowSizeChange {
  Change = "Change",
  DontChange = "DontChange",
}

export enum WindowSizeChangeEnterprise {
  Изменять = "Изменять",
  НеИзменять = "НеИзменять",
}

export enum WindowStateVariant {
  Normal = "Normal",
  Docked = "Docked",
  Autohide = "Autohide",
  Float = "Float",
}

export enum WindowStateVariantEnterprise {
  Обычное = "Обычное",
  Прикрепленное = "Прикрепленное",
  Прячущееся = "Прячущееся",
  Свободное = "Свободное",
}

export enum AutoSeriesSeparation {
  All = "All",
  Maximum = "Maximum",
  Minimum = "Minimum",
  None = "None",
}

export enum AutoSeriesSeparationEnterprise {
  Все = "Все",
  Максимум = "Максимум",
  Минимум = "Минимум",
  Нет = "Нет",
}

export enum BarChartPointsOrder {
  Auto = "Auto",
  TopToBottom = "TopToBottom",
  BottomToTop = "BottomToTop",
}

export enum BarChartPointsOrderEnterprise {
  Авто = "Авто",
  СверхуВниз = "СверхуВниз",
  СнизуВверх = "СнизуВверх",
}

export enum BubbleChartNegativeValuesShowMode {
  InvertedBackColor = "InvertedBackColor",
  DontShow = "DontShow",
  Abs = "Abs",
  Transparent = "Transparent",
}

export enum BubbleChartNegativeValuesShowModeEnterprise {
  ИнвертированныйЦветФона = "ИнвертированныйЦветФона",
  НеОтображать = "НеОтображать",
  ПоМодулю = "ПоМодулю",
  ПрозрачныйФон = "ПрозрачныйФон",
}

export enum ChartAnimation {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum ChartAnimationEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ChartBoundaryDetectionMethod {
  AutoDetect = "AutoDetect",
  UseValue = "UseValue",
  UseValueWithLimitations = "UseValueWithLimitations",
}

export enum ChartBoundaryDetectionMethodEnterprise {
  АвтоОпределение = "АвтоОпределение",
  ИспользоватьЗначение = "ИспользоватьЗначение",
  ИспользоватьЗначениеСОграничением = "ИспользоватьЗначениеСОграничением",
}

export enum ChartBubbleSizeValueSource {
  None = "None",
  CommonSeries = "CommonSeries",
  NextSeries = "NextSeries",
}

export enum ChartBubbleSizeValueSourceEnterprise {
  Нет = "Нет",
  ОбщаяСерия = "ОбщаяСерия",
  СледующаяСерия = "СледующаяСерия",
}

export enum ChartBubbleSizing {
  IncreaseDiameter = "IncreaseDiameter",
  IncreaseArea = "IncreaseArea",
  DecreaseDiameter = "DecreaseDiameter",
  DecreaseArea = "DecreaseArea",
}

export enum ChartBubbleSizingEnterprise {
  УвеличениеДиаметра = "УвеличениеДиаметра",
  УвеличениеПлощади = "УвеличениеПлощади",
  УменьшениеДиаметра = "УменьшениеДиаметра",
  УменьшениеПлощади = "УменьшениеПлощади",
}

export enum ChartColorPalette {
  Auto = "Auto",
  Gradient = "Gradient",
  Yellow = "Yellow",
  Green = "Green",
  Soft = "Soft",
  SoftAdaptive = "SoftAdaptive",
  Orange = "Orange",
  Palette32 = "Palette32",
  Palette8 = "Palette8",
  Pastel = "Pastel",
  Custom = "Custom",
  Gray = "Gray",
  Blue = "Blue",
  Warm = "Warm",
  Cold = "Cold",
  Bright = "Bright",
}

export enum ChartColorPaletteEnterprise {
  Авто = "Авто",
  Градиентная = "Градиентная",
  Желтая = "Желтая",
  Зеленая = "Зеленая",
  Мягкая = "Мягкая",
  МягкаяАдаптивная = "МягкаяАдаптивная",
  Оранжевая = "Оранжевая",
  Палитра32 = "Палитра32",
  Палитра8 = "Палитра8",
  Пастельная = "Пастельная",
  Произвольная = "Произвольная",
  Серая = "Серая",
  Синяя = "Синяя",
  Теплая = "Теплая",
  Холодная = "Холодная",
  Яркая = "Яркая",
}

export enum ChartGridLinesShowMode {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ChartGridLinesShowModeEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum ChartLabelLocation {
  Auto = "Auto",
  Edge = "Edge",
  EdgeAuto = "EdgeAuto",
  EdgeInside = "EdgeInside",
  TopLeft = "TopLeft",
  BottomLeft = "BottomLeft",
  TopRight = "TopRight",
  BottomRight = "BottomRight",
  EmptySpace = "EmptySpace",
  TopAndLeftSpecified = "TopAndLeftSpecified",
  Center = "Center",
}

export enum ChartLabelLocationEnterprise {
  Авто = "Авто",
  Край = "Край",
  КрайАвто = "КрайАвто",
  КрайВнутри = "КрайВнутри",
  ЛевоВерх = "ЛевоВерх",
  ЛевоНиз = "ЛевоНиз",
  ПравоВерх = "ПравоВерх",
  ПравоНиз = "ПравоНиз",
  СвободноеМесто = "СвободноеМесто",
  УказываетсяЛевоИВерх = "УказываетсяЛевоИВерх",
  Центр = "Центр",
}

export enum ChartLabelType {
  Value = "Value",
  ValuePercent = "ValuePercent",
  ValueSize = "ValueSize",
  None = "None",
  Percent = "Percent",
  Series = "Series",
  SeriesValue = "SeriesValue",
  SeriesValuePercent = "SeriesValuePercent",
  SeriesValueSize = "SeriesValueSize",
  SeriesPercent = "SeriesPercent",
  SeriesSize = "SeriesSize",
  SeriesPoint = "SeriesPoint",
  SeriesPointValue = "SeriesPointValue",
  SeriesPointValuePercent = "SeriesPointValuePercent",
  SeriesPointValueSize = "SeriesPointValueSize",
  SeriesPointPercent = "SeriesPointPercent",
  SeriesPointSize = "SeriesPointSize",
  Point = "Point",
  PointValue = "PointValue",
  PointValuePercent = "PointValuePercent",
  PointValueSize = "PointValueSize",
  PointPercent = "PointPercent",
  PointSize = "PointSize",
}

export enum ChartLabelTypeEnterprise {
  Значение = "Значение",
  ЗначениеПроцент = "ЗначениеПроцент",
  ЗначениеРазмер = "ЗначениеРазмер",
  Нет = "Нет",
  Процент = "Процент",
  Серия = "Серия",
  СерияЗначение = "СерияЗначение",
  СерияЗначениеПроцент = "СерияЗначениеПроцент",
  СерияЗначениеРазмер = "СерияЗначениеРазмер",
  СерияПроцент = "СерияПроцент",
  СерияРазмер = "СерияРазмер",
  СерияТочка = "СерияТочка",
  СерияТочкаЗначение = "СерияТочкаЗначение",
  СерияТочкаЗначениеПроцент = "СерияТочкаЗначениеПроцент",
  СерияТочкаЗначениеРазмер = "СерияТочкаЗначениеРазмер",
  СерияТочкаПроцент = "СерияТочкаПроцент",
  СерияТочкаРазмер = "СерияТочкаРазмер",
  Точка = "Точка",
  ТочкаЗначение = "ТочкаЗначение",
  ТочкаЗначениеПроцент = "ТочкаЗначениеПроцент",
  ТочкаЗначениеРазмер = "ТочкаЗначениеРазмер",
  ТочкаПроцент = "ТочкаПроцент",
  ТочкаРазмер = "ТочкаРазмер",
}

export enum ChartLabelsOrientation {
  Auto = "Auto",
  Vertical = "Vertical",
  Horizontal = "Horizontal",
  CustomAngle = "CustomAngle",
}

export enum ChartLabelsOrientationEnterprise {
  Авто = "Авто",
  Вертикально = "Вертикально",
  Горизонтально = "Горизонтально",
  ПроизвольныйУголНаклона = "ПроизвольныйУголНаклона",
}

export enum ChartLegendPlacement {
  Auto = "Auto",
  Top = "Top",
  Left = "Left",
  None = "None",
  Bottom = "Bottom",
  Right = "Right",
  UseCoordinates = "UseCoordinates",
}

export enum ChartLegendPlacementEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  Лево = "Лево",
  Нет = "Нет",
  Низ = "Низ",
  Право = "Право",
  УказываетсяРасположение = "УказываетсяРасположение",
}

export enum ChartLineType {
  None = "None",
  Dashed = "Dashed",
  DashDotted = "DashDotted",
  DashDottedDotted = "DashDottedDotted",
  Solid = "Solid",
  Dotted = "Dotted",
}

export enum ChartLineTypeEnterprise {
  НетЛинии = "НетЛинии",
  Пунктир = "Пунктир",
  ПунктирТочка = "ПунктирТочка",
  ПунктирТочкаТочка = "ПунктирТочкаТочка",
  Сплошная = "Сплошная",
  Точечная = "Точечная",
}

export enum ChartMarkerType {
  Auto = "Auto",
  Rect = "Rect",
  Circle = "Circle",
  None = "None",
  Rhomb = "Rhomb",
  Alternation = "Alternation",
}

export enum ChartMarkerTypeEnterprise {
  Авто = "Авто",
  Квадрат = "Квадрат",
  Круг = "Круг",
  Нет = "Нет",
  Ромб = "Ромб",
  Чередование = "Чередование",
}

export enum ChartOrientation {
  SouthEast = "SouthEast",
  SouthWest = "SouthWest",
}

export enum ChartOrientationEnterprise {
  ЮгВосток = "ЮгВосток",
  ЮгЗапад = "ЮгЗапад",
}

export enum ChartPlotAreaPlacement {
  Auto = "Auto",
  EmptySpace = "EmptySpace",
  UseCoordinates = "UseCoordinates",
}

export enum ChartPlotAreaPlacementEnterprise {
  Авто = "Авто",
  СвободноеМесто = "СвободноеМесто",
  УказываетсяРасположение = "УказываетсяРасположение",
}

export enum ChartPointsAxisValuesSource {
  Auto = "Auto",
  Series = "Series",
  Points = "Points",
}

export enum ChartPointsAxisValuesSourceEnterprise {
  Авто = "Авто",
  Серия = "Серия",
  Точки = "Точки",
}

export enum ChartPointsConnectionType {
  Auto = "Auto",
  DontConnect = "DontConnect",
  Connect = "Connect",
}

export enum ChartPointsConnectionTypeEnterprise {
  Авто = "Авто",
  НеСоединять = "НеСоединять",
  Соединять = "Соединять",
}

export enum ChartReferenceBandBorderPosition {
  Auto = "Auto",
  OnValue = "OnValue",
  BetweenValues = "BetweenValues",
}

export enum ChartReferenceBandBorderPositionEnterprise {
  Авто = "Авто",
  ВЗначении = "ВЗначении",
  МеждуЗначениями = "МеждуЗначениями",
}

export enum ChartReferenceLinePosition {
  Auto = "Auto",
  OnValue = "OnValue",
  BetweenValues = "BetweenValues",
}

export enum ChartReferenceLinePositionEnterprise {
  Авто = "Авто",
  ВЗначении = "ВЗначении",
  МеждуЗначениями = "МеждуЗначениями",
}

export enum ChartScaleLabelLocation {
  Auto = "Auto",
  Inside = "Inside",
  None = "None",
  Outside = "Outside",
}

export enum ChartScaleLabelLocationEnterprise {
  Авто = "Авто",
  Внутри = "Внутри",
  Нет = "Нет",
  Снаружи = "Снаружи",
}

export enum ChartScaleLocation {
  Auto = "Auto",
  BaseValue = "BaseValue",
  Edge = "Edge",
}

export enum ChartScaleLocationEnterprise {
  Авто = "Авто",
  БазовоеЗначение = "БазовоеЗначение",
  Край = "Край",
}

export enum ChartScaleMarkLocation {
  Auto = "Auto",
  Inside = "Inside",
  None = "None",
  Outside = "Outside",
  Center = "Center",
}

export enum ChartScaleMarkLocationEnterprise {
  Авто = "Авто",
  Внутри = "Внутри",
  Нет = "Нет",
  Снаружи = "Снаружи",
  Центр = "Центр",
}

export enum ChartScaleTitlePlacement {
  SpecialArea = "SpecialArea",
  PlotArea = "PlotArea",
  WithAxis = "WithAxis",
}

export enum ChartScaleTitlePlacementEnterprise {
  ВВыделеннойОбласти = "ВВыделеннойОбласти",
  ВОбластиПостроения = "ВОбластиПостроения",
  РядомСОсью = "РядомСОсью",
}

export enum ChartScaleTitleTextSource {
  Auto = "Auto",
  AutoText = "AutoText",
  UseText = "UseText",
}

export enum ChartScaleTitleTextSourceEnterprise {
  Авто = "Авто",
  АвтоТекст = "АвтоТекст",
  ИспользоватьТекст = "ИспользоватьТекст",
}

export enum ChartSelectionMode {
  Auto = "Auto",
  ValuesSelection = "ValuesSelection",
  PointsSelection = "PointsSelection",
  None = "None",
}

export enum ChartSelectionModeEnterprise {
  Авто = "Авто",
  ВыделениеЗначений = "ВыделениеЗначений",
  ВыделениеТочек = "ВыделениеТочек",
  Нет = "Нет",
}

export enum ChartSemitransparencyMode {
  Auto = "Auto",
  AutoCalculate = "AutoCalculate",
  Use = "Use",
  DontUse = "DontUse",
}

export enum ChartSemitransparencyModeEnterprise {
  Авто = "Авто",
  АвтоматическийРасчет = "АвтоматическийРасчет",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ChartSeriesGraphicalRepresentationType {
  Auto = "Auto",
  Column = "Column",
  Column3D = "Column3D",
  Line = "Line",
  Step = "Step",
  Area = "Area",
}

export enum ChartSeriesGraphicalRepresentationTypeEnterprise {
  Авто = "Авто",
  Гистограмма = "Гистограмма",
  ГистограммаОбъемная = "ГистограммаОбъемная",
  График = "График",
  ГрафикПоШагам = "ГрафикПоШагам",
  ГрафикСОбластями = "ГрафикСОбластями",
}

export enum ChartSeriesOrderInLegend {
  Auto = "Auto",
  Reverse = "Reverse",
  Direct = "Direct",
}

export enum ChartSeriesOrderInLegendEnterprise {
  Авто = "Авто",
  Обратный = "Обратный",
  Прямой = "Прямой",
}

export enum ChartSeriesStackType {
  Auto = "Auto",
  Unstacked = "Unstacked",
  Stacked = "Stacked",
  StackedNormalized = "StackedNormalized",
}

export enum ChartSeriesStackTypeEnterprise {
  Авто = "Авто",
  БезНакопления = "БезНакопления",
  СНакоплением = "СНакоплением",
  СНакоплениемНормированная = "СНакоплениемНормированная",
}

export enum ChartSpaceMode {
  None = "None",
  Full = "Full",
  Half = "Half",
}

export enum ChartSpaceModeEnterprise {
  Нет = "Нет",
  ПолнаяШирина = "ПолнаяШирина",
  ПоловинаШирины = "ПоловинаШирины",
}

export enum ChartSplineMode {
  SmoothCurve = "SmoothCurve",
  None = "None",
}

export enum ChartSplineModeEnterprise {
  ГладкаяКривая = "ГладкаяКривая",
  Нет = "Нет",
}

export enum ChartTitleAreaPlacement {
  Auto = "Auto",
  Top = "Top",
  LeftTop = "LeftTop",
  LeftBottom = "LeftBottom",
  None = "None",
  Bottom = "Bottom",
  RightTop = "RightTop",
  RightBottom = "RightBottom",
  UseCoordinates = "UseCoordinates",
}

export enum ChartTitleAreaPlacementEnterprise {
  Авто = "Авто",
  Верх = "Верх",
  ЛевоВерх = "ЛевоВерх",
  ЛевоНиз = "ЛевоНиз",
  Нет = "Нет",
  Низ = "Низ",
  ПравоВерх = "ПравоВерх",
  ПравоНиз = "ПравоНиз",
  УказываетсяРасположение = "УказываетсяРасположение",
}

export enum ChartTrendlineApproximationType {
  Linear = "Linear",
  Logarithmic = "Logarithmic",
  Polynomial = "Polynomial",
  Power = "Power",
  Exponential = "Exponential",
}

export enum ChartTrendlineApproximationTypeEnterprise {
  Линейный = "Линейный",
  Логарифмический = "Логарифмический",
  Полиномиальный = "Полиномиальный",
  Степенной = "Степенной",
  Экспоненциальный = "Экспоненциальный",
}

export enum ChartTrendlineFactor {
  Auto = "Auto",
  PointValue = "PointValue",
  PointNumber = "PointNumber",
}

export enum ChartTrendlineFactorEnterprise {
  Авто = "Авто",
  ЗначениеТочки = "ЗначениеТочки",
  НомерТочки = "НомерТочки",
}

export enum ChartType {
  Stock = "Stock",
  OpenHighLowClose = "OpenHighLowClose",
  ConcaveSurface = "ConcaveSurface",
  Waterfall = "Waterfall",
  Funnel = "Funnel",
  NormalizedFunnel = "NormalizedFunnel",
  NormalizedFunnel3D = "NormalizedFunnel3D",
  Funnel3D = "Funnel3D",
  ConvexSurface = "ConvexSurface",
  Column = "Column",
  Bar = "Bar",
  Bar3D = "Bar3D",
  NormalizedColumn = "NormalizedColumn",
  NormalizedBar = "NormalizedBar",
  NormalizedBar3D = "NormalizedBar3D",
  NormalizedColumn3D = "NormalizedColumn3D",
  Column3D = "Column3D",
  StackedColumn = "StackedColumn",
  StackedBar = "StackedBar",
  StackedBar3D = "StackedBar3D",
  StackedColumn3D = "StackedColumn3D",
  Line = "Line",
  Step = "Step",
  StackedLine = "StackedLine",
  Area = "Area",
  StackedArea = "StackedArea",
  NormalizedArea = "NormalizedArea",
  ShadedSurface = "ShadedSurface",
  Gauge = "Gauge",
  BarGraph = "BarGraph",
  TapeGraph = "TapeGraph",
  CeilGraph = "CeilGraph",
  PyramidGraph = "PyramidGraph",
  WireframeSurface = "WireframeSurface",
  Donut = "Donut",
  Donut3D = "Donut3D",
  Pie = "Pie",
  Pie3D = "Pie3D",
  Surface = "Surface",
  Bubble = "Bubble",
  RadarLine = "RadarLine",
  RadarStackedLine = "RadarStackedLine",
  RadarArea = "RadarArea",
  RadarStackedArea = "RadarStackedArea",
  RadarNormalizedArea = "RadarNormalizedArea",
  Honeycomb = "Honeycomb",
  Scatter = "Scatter",
}

export enum ChartTypeEnterprise {
  Биржевая = "Биржевая",
  БиржеваяСвеча = "БиржеваяСвеча",
  ВогнутаяПоверхность = "ВогнутаяПоверхность",
  Водопад = "Водопад",
  Воронка = "Воронка",
  ВоронкаНормированная = "ВоронкаНормированная",
  ВоронкаНормированнаяОбъемная = "ВоронкаНормированнаяОбъемная",
  ВоронкаОбъемная = "ВоронкаОбъемная",
  ВыпуклаяПоверхность = "ВыпуклаяПоверхность",
  Гистограмма = "Гистограмма",
  ГистограммаГоризонтальная = "ГистограммаГоризонтальная",
  ГистограммаГоризонтальнаяОбъемная = "ГистограммаГоризонтальнаяОбъемная",
  ГистограммаНормированная = "ГистограммаНормированная",
  ГистограммаНормированнаяГоризонтальная = "ГистограммаНормированнаяГоризонтальная",
  ГистограммаНормированнаяГоризонтальнаяОбъемная = "ГистограммаНормированнаяГоризонтальнаяОбъемная",
  ГистограммаНормированнаяОбъемная = "ГистограммаНормированнаяОбъемная",
  ГистограммаОбъемная = "ГистограммаОбъемная",
  ГистограммаСНакоплением = "ГистограммаСНакоплением",
  ГистограммаСНакоплениемГоризонтальная = "ГистограммаСНакоплениемГоризонтальная",
  ГистограммаСНакоплениемГоризонтальнаяОбъемная = "ГистограммаСНакоплениемГоризонтальнаяОбъемная",
  ГистограммаСНакоплениемОбъемная = "ГистограммаСНакоплениемОбъемная",
  График = "График",
  ГрафикПоШагам = "ГрафикПоШагам",
  ГрафикСНакоплением = "ГрафикСНакоплением",
  ГрафикСОбластями = "ГрафикСОбластями",
  ГрафикСОбластямиИНакоплением = "ГрафикСОбластямиИНакоплением",
  ГрафикСОбластямиНормированный = "ГрафикСОбластямиНормированный",
  ЗатененнаяПоверхность = "ЗатененнаяПоверхность",
  Измерительная = "Измерительная",
  Изометрическая = "Изометрическая",
  ИзометрическаяЛента = "ИзометрическаяЛента",
  ИзометрическаяНепрерывная = "ИзометрическаяНепрерывная",
  ИзометрическаяПирамида = "ИзометрическаяПирамида",
  КаркаснаяПоверхность = "КаркаснаяПоверхность",
  Кольцевая = "Кольцевая",
  КольцеваяОбъемная = "КольцеваяОбъемная",
  Круговая = "Круговая",
  КруговаяОбъемная = "КруговаяОбъемная",
  Поверхность = "Поверхность",
  Пузырьковая = "Пузырьковая",
  РадарныйГрафик = "РадарныйГрафик",
  РадарныйГрафикСНакоплением = "РадарныйГрафикСНакоплением",
  РадарныйГрафикСОбластями = "РадарныйГрафикСОбластями",
  РадарныйГрафикСОбластямиИНакоплением = "РадарныйГрафикСОбластямиИНакоплением",
  РадарныйГрафикСОбластямиНормированный = "РадарныйГрафикСОбластямиНормированный",
  Сотовая = "Сотовая",
  Точечная = "Точечная",
}

export enum ChartValueEditState {
  Finished = "Finished",
  NotFinished = "NotFinished",
  Canceled = "Canceled",
}

export enum ChartValueEditStateEnterprise {
  Завершено = "Завершено",
  НеЗавершено = "НеЗавершено",
  Отменено = "Отменено",
}

export enum ChartValuesBySeriesConnectionType {
  None = "None",
  EdgesConnection = "EdgesConnection",
}

export enum ChartValuesBySeriesConnectionTypeEnterprise {
  Нет = "Нет",
  СоединениеКраев = "СоединениеКраев",
}

export enum ChartValuesEditMode {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum ChartValuesEditModeEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum ChartValuesToolTipFillType {
  Auto = "Auto",
  AllPointValues = "AllPointValues",
  SingleValue = "SingleValue",
}

export enum ChartValuesToolTipFillTypeEnterprise {
  Авто = "Авто",
  ВсеЗначенияТочки = "ВсеЗначенияТочки",
  ОдноЗначение = "ОдноЗначение",
}

export enum ChartValuesToolTipShowMode {
  Auto = "Auto",
  DontShow = "DontShow",
  ShowForNearestValue = "ShowForNearestValue",
  ShowOnHover = "ShowOnHover",
}

export enum ChartValuesToolTipShowModeEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  ОтображатьДляБлижайшего = "ОтображатьДляБлижайшего",
  ОтображатьПриНаведении = "ОтображатьПриНаведении",
}

export enum GaugeChartValueRepresentation {
  Sector = "Sector",
  Needle = "Needle",
}

export enum GaugeChartValueRepresentationEnterprise {
  Сектор = "Сектор",
  Стрелка = "Стрелка",
}

export enum GaugeChartValuesScaleLabelsLocation {
  InsideScale = "InsideScale",
  AtScale = "AtScale",
}

export enum GaugeChartValuesScaleLabelsLocationEnterprise {
  ВнутриШкалы = "ВнутриШкалы",
  НаШкале = "НаШкале",
}

export enum MaxSeries {
  NotDefined = "NotDefined",
  Limited = "Limited",
  Percent = "Percent",
}

export enum MaxSeriesEnterprise {
  НеЗадано = "НеЗадано",
  Ограничено = "Ограничено",
  Процент = "Процент",
}

export enum NonnumericChartValueUse {
  Auto = "Auto",
  AsZero = "AsZero",
  Skip = "Skip",
}

export enum NonnumericChartValueUseEnterprise {
  Авто = "Авто",
  КакНоль = "КакНоль",
  Пропускать = "Пропускать",
}

export enum PointsConnectionAcrossSkippedChartValuesType {
  Auto = "Auto",
  None = "None",
  ConnectUnskippedValues = "ConnectUnskippedValues",
  ConnectWithBaseValue = "ConnectWithBaseValue",
}

export enum PointsConnectionAcrossSkippedChartValuesTypeEnterprise {
  Авто = "Авто",
  Нет = "Нет",
  СоединениеНеПропущенных = "СоединениеНеПропущенных",
  СоединениеСБазовымЗначением = "СоединениеСБазовымЗначением",
}

export enum RadarChartScaleType {
  Circle = "Circle",
  Polygon = "Polygon",
}

export enum RadarChartScaleTypeEnterprise {
  Окружность = "Окружность",
  Полигон = "Полигон",
}

export enum ShowChartPopupReferenceLine {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ShowChartPopupReferenceLineEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum ShowChartScaleTitle {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ShowChartScaleTitleEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum ShowInChart {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ShowInChartEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum ShowInChartLegend {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ShowInChartLegendEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum StockChartUsedPointValue {
  Close = "Close",
  High = "High",
  Low = "Low",
  Open = "Open",
  OpenCloseAverage = "OpenCloseAverage",
}

export enum StockChartUsedPointValueEnterprise {
  Закрытие = "Закрытие",
  Максимальное = "Максимальное",
  Минимальное = "Минимальное",
  Открытие = "Открытие",
  СреднееОткрытияИЗакрытия = "СреднееОткрытияИЗакрытия",
}

export enum UsedChartValuesAxis {
  Auto = "Auto",
  Additional = "Additional",
  Main = "Main",
}

export enum UsedChartValuesAxisEnterprise {
  Авто = "Авто",
  Дополнительная = "Дополнительная",
  Основная = "Основная",
}

export enum GanttChartIntervalRepresentation {
  Gradient = "Gradient",
  ThreeDimensional = "ThreeDimensional",
  Flat = "Flat",
  Rhomb = "Rhomb",
}

export enum GanttChartIntervalRepresentationEnterprise {
  Градиент = "Градиент",
  Объемный = "Объемный",
  Плоский = "Плоский",
  Ромб = "Ромб",
}

export enum GanttChartIntervalTextRepresentation {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum GanttChartIntervalTextRepresentationEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum GanttChartIntervalsSelectionMode {
  Auto = "Auto",
  Multiple = "Multiple",
  None = "None",
  Single = "Single",
}

export enum GanttChartIntervalsSelectionModeEnterprise {
  Авто = "Авто",
  Множественный = "Множественный",
  Нет = "Нет",
  Одиночный = "Одиночный",
}

export enum GanttChartLinkType {
  EndEnd = "EndEnd",
  EndBegin = "EndBegin",
  BeginEnd = "BeginEnd",
  BeginBegin = "BeginBegin",
}

export enum GanttChartLinkTypeEnterprise {
  КонецКонец = "КонецКонец",
  КонецНачало = "КонецНачало",
  НачалоКонец = "НачалоКонец",
  НачалоНачало = "НачалоНачало",
}

export enum GanttChartScaleKeeping {
  Auto = "Auto",
  AllData = "AllData",
  Period = "Period",
  Fixed = "Fixed",
}

export enum GanttChartScaleKeepingEnterprise {
  Авто = "Авто",
  ВсеДанные = "ВсеДанные",
  Период = "Период",
  Фиксированная = "Фиксированная",
}

export enum GanttChartTableLocation {
  Auto = "Auto",
  Left = "Left",
  None = "None",
  Right = "Right",
}

export enum GanttChartTableLocationEnterprise {
  Авто = "Авто",
  Лево = "Лево",
  Нет = "Нет",
  Право = "Право",
}

export enum GanttChartTextPlacementType {
  Auto = "Auto",
  Cut = "Cut",
  Wrap = "Wrap",
}

export enum GanttChartTextPlacementTypeEnterprise {
  Авто = "Авто",
  Обрезать = "Обрезать",
  Переносить = "Переносить",
}

export enum GanttChartValueTextRepresentation {
  None = "None",
  Right = "Right",
}

export enum GanttChartValueTextRepresentationEnterprise {
  НеОтображать = "НеОтображать",
  Право = "Право",
}

export enum GanttChartValuesSelectionMode {
  Auto = "Auto",
  Multiple = "Multiple",
  None = "None",
  Single = "Single",
}

export enum GanttChartValuesSelectionModeEnterprise {
  Авто = "Авто",
  Множественный = "Множественный",
  Нет = "Нет",
  Одиночный = "Одиночный",
}

export enum GanttChartVerticalStretch {
  None = "None",
  StretchRows = "StretchRows",
  StretchRowsAndData = "StretchRowsAndData",
}

export enum GanttChartVerticalStretchEnterprise {
  НеРастягивать = "НеРастягивать",
  РастягиватьСтроки = "РастягиватьСтроки",
  РастягиватьСтрокиИДанные = "РастягиватьСтрокиИДанные",
}

export enum ShowInGanttChart {
  Auto = "Auto",
  DontShow = "DontShow",
  Show = "Show",
}

export enum ShowInGanttChartEnterprise {
  Авто = "Авто",
  НеОтображать = "НеОтображать",
  Отображать = "Отображать",
}

export enum TimeScaleDayFormat {
  MonthDay = "MonthDay",
  MonthDayWeekDay = "MonthDayWeekDay",
  WeekDay = "WeekDay",
  WeekDayMonthDay = "WeekDayMonthDay",
}

export enum TimeScaleDayFormatEnterprise {
  ДеньМесяца = "ДеньМесяца",
  ДеньМесяцаДеньНедели = "ДеньМесяцаДеньНедели",
  ДеньНедели = "ДеньНедели",
  ДеньНеделиДеньМесяца = "ДеньНеделиДеньМесяца",
}

export enum TimeScaleUnitType {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Minute = "Minute",
  Week = "Week",
  Second = "Second",
  Hour = "Hour",
}

export enum TimeScaleUnitTypeEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Минута = "Минута",
  Неделя = "Неделя",
  Секунда = "Секунда",
  Час = "Час",
}

export enum PivotChartLabelsOrientation {
  TopLevelsVertical = "TopLevelsVertical",
  AllLevelsVertical = "AllLevelsVertical",
  AllLevelsHorizontal = "AllLevelsHorizontal",
}

export enum PivotChartLabelsOrientationEnterprise {
  ВерхниеУровниВертикально = "ВерхниеУровниВертикально",
  ВсеУровниВертикально = "ВсеУровниВертикально",
  ВсеУровниГоризонтально = "ВсеУровниГоризонтально",
}

export enum PivotChartScaleKeeping {
  AllValues = "AllValues",
  ValuesCount = "ValuesCount",
  MinimumWidth = "MinimumWidth",
}

export enum PivotChartScaleKeepingEnterprise {
  ВсеЗначения = "ВсеЗначения",
  КоличествоЗначений = "КоличествоЗначений",
  МинимальнаяШирина = "МинимальнаяШирина",
}

export enum PivotChartType {
  Column = "Column",
  Column3D = "Column3D",
}

export enum PivotChartTypeEnterprise {
  Гистограмма = "Гистограмма",
  ГистограммаОбъемная = "ГистограммаОбъемная",
}

export enum PivotChartValuesShowMode {
  AllValues = "AllValues",
  LastLevelValues = "LastLevelValues",
}

export enum PivotChartValuesShowModeEnterprise {
  ВсеЗначения = "ВсеЗначения",
  ЗначенияПоследнегоУровня = "ЗначенияПоследнегоУровня",
}

export enum DendrogramOrientation {
  Top = "Top",
  Left = "Left",
  Bottom = "Bottom",
  Right = "Right",
}

export enum DendrogramOrientationEnterprise {
  Верх = "Верх",
  Лево = "Лево",
  Низ = "Низ",
  Право = "Право",
}

export enum DendrogramScaleKeeping {
  AllItems = "AllItems",
  ItemCount = "ItemCount",
  MinimumWidth = "MinimumWidth",
}

export enum DendrogramScaleKeepingEnterprise {
  ВсеЭлементы = "ВсеЭлементы",
  КоличествоЭлементов = "КоличествоЭлементов",
  МинимальнаяШирина = "МинимальнаяШирина",
}

export enum GeographicalSchemaDataSourceOrganizationType {
  AtRow = "AtRow",
  AtIntersection = "AtIntersection",
}

export enum GeographicalSchemaDataSourceOrganizationTypeEnterprise {
  ВСтроке = "ВСтроке",
  НаПересечении = "НаПересечении",
}

export enum GeographicalSchemaLayerSeriesImportModeType {
  ImportAll = "ImportAll",
  DontImport = "DontImport",
}

export enum GeographicalSchemaLayerSeriesImportModeTypeEnterprise {
  ИмпортироватьВсе = "ИмпортироватьВсе",
  НеИмпортировать = "НеИмпортировать",
}

export enum GeographicalSchemaLayerSeriesShowMode {
  Column = "Column",
  Picture = "Picture",
  Pie = "Pie",
  SizedPie = "SizedPie",
  DontShow = "DontShow",
  ShapeColorHue = "ShapeColorHue",
  ShapeSize = "ShapeSize",
  Text = "Text",
  ShapeColor = "ShapeColor",
}

export enum GeographicalSchemaLayerSeriesShowModeEnterprise {
  Гистограмма = "Гистограмма",
  Картинка = "Картинка",
  Круговая = "Круговая",
  КруговаяСРазмером = "КруговаяСРазмером",
  НеОтображать = "НеОтображать",
  ОттенокЦветаФигуры = "ОттенокЦветаФигуры",
  РазмерФигуры = "РазмерФигуры",
  Текст = "Текст",
  ЦветФигуры = "ЦветФигуры",
}

export enum GeographicalSchemaLegendItemShowScaleType {
  DontShow = "DontShow",
  ShowByValues = "ShowByValues",
}

export enum GeographicalSchemaLegendItemShowScaleTypeEnterprise {
  НеОтображать = "НеОтображать",
  ОтображатьПоЗначениям = "ОтображатьПоЗначениям",
}

export enum GeographicalSchemaLineType {
  None = "None",
  Dashed = "Dashed",
  DashDotted = "DashDotted",
  DashDottedDotted = "DashDottedDotted",
  Solid = "Solid",
  Dotted = "Dotted",
}

export enum GeographicalSchemaLineTypeEnterprise {
  НетЛинии = "НетЛинии",
  Пунктир = "Пунктир",
  ПунктирТочка = "ПунктирТочка",
  ПунктирТочкаТочка = "ПунктирТочкаТочка",
  Сплошная = "Сплошная",
  Точечная = "Точечная",
}

export enum GeographicalSchemaMarkerType {
  BigSquare = "BigSquare",
  BigCircle = "BigCircle",
  BigTriangle = "BigTriangle",
  ExclamationPoint = "ExclamationPoint",
  Darts = "Darts",
  QuestionMark = "QuestionMark",
  Pin = "Pin",
  LittleSquare = "LittleSquare",
  LittleCircle = "LittleCircle",
  LittleTriangle = "LittleTriangle",
  None = "None",
}

export enum GeographicalSchemaMarkerTypeEnterprise {
  БольшойКвадрат = "БольшойКвадрат",
  БольшойКруг = "БольшойКруг",
  БольшойТреугольник = "БольшойТреугольник",
  ВосклицательныйЗнак = "ВосклицательныйЗнак",
  Дартс = "Дартс",
  ЗнакВопроса = "ЗнакВопроса",
  Кнопка = "Кнопка",
  МаленькийКвадрат = "МаленькийКвадрат",
  МаленькийКруг = "МаленькийКруг",
  МаленькийТреугольник = "МаленькийТреугольник",
  Нет = "Нет",
}

export enum GeographicalSchemaObjectFindType {
  Included = "Included",
  IncludedWholly = "IncludedWholly",
  Includes = "Includes",
  IncludesWholly = "IncludesWholly",
}

export enum GeographicalSchemaObjectFindTypeEnterprise {
  Включает = "Включает",
  ВключаетПолностью = "ВключаетПолностью",
  Включают = "Включают",
  ВключаютПолностью = "ВключаютПолностью",
}

export enum GeographicalSchemaPointObjectDrawingType {
  Picture = "Picture",
  Marker = "Marker",
  Char = "Char",
}

export enum GeographicalSchemaPointObjectDrawingTypeEnterprise {
  Картинка = "Картинка",
  Маркер = "Маркер",
  Символ = "Символ",
}

export enum GeographicalSchemaProjection {
  AzimuthalAitoffProjection = "AzimuthalAitoffProjection",
  AzimuthalWagner7Projection = "AzimuthalWagner7Projection",
  AzimuthalWinkelTripelProjection = "AzimuthalWinkelTripelProjection",
  AzimuthalLambertEqualAreaProjection = "AzimuthalLambertEqualAreaProjection",
  AzimuthalHammerProjection = "AzimuthalHammerProjection",
  AzimuthalEquidistantProjection = "AzimuthalEquidistantProjection",
  ConicLambertEqualAreaProjection = "ConicLambertEqualAreaProjection",
  MiscellaneousOrteliusOvalProjection = "MiscellaneousOrteliusOvalProjection",
  MiscellaneousVanDerGrinten1Projection = "MiscellaneousVanDerGrinten1Projection",
  MiscellaneousVanDerGrinten2Projection = "MiscellaneousVanDerGrinten2Projection",
  MiscellaneousVanDerGrinten3Projection = "MiscellaneousVanDerGrinten3Projection",
  MiscellaneousApianGlobular1Projection = "MiscellaneousApianGlobular1Projection",
  MiscellaneousBaconGlobularProjection = "MiscellaneousBaconGlobularProjection",
  MiscellaneousNicolosiGlobularProjection = "MiscellaneousNicolosiGlobularProjection",
  MiscellaneousAugustEpicycloidalProjection = "MiscellaneousAugustEpicycloidalProjection",
  PseudoCylindricalBoggsEumorphicProjection = "PseudoCylindricalBoggsEumorphicProjection",
  PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection = "PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection",
  PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection = "PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection",
  PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection = "PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection",
  PseudoCylindricalWinkel1Projection = "PseudoCylindricalWinkel1Projection",
  PseudoCylindricalLoximutalProjection = "PseudoCylindricalLoximutalProjection",
  PseudoCylindricalMollweideProjection = "PseudoCylindricalMollweideProjection",
  PseudoCylindricalHatanoAsymetricalEqualAreaProjection = "PseudoCylindricalHatanoAsymetricalEqualAreaProjection",
  PseudoCylindricalPutninP2Projection = "PseudoCylindricalPutninP2Projection",
  PseudoCylindricalPutninP5Projection = "PseudoCylindricalPutninP5Projection",
  PseudoCylindricalRobinsonProjection = "PseudoCylindricalRobinsonProjection",
  PseudoCylindricalEckert1Projection = "PseudoCylindricalEckert1Projection",
  PseudoCylindricalEckert2Projection = "PseudoCylindricalEckert2Projection",
  PseudoCylindricalEckert3Projection = "PseudoCylindricalEckert3Projection",
  PseudoCylindricalEckert4Projection = "PseudoCylindricalEckert4Projection",
  PseudoCylindricalEckert5Projection = "PseudoCylindricalEckert5Projection",
  PseudoCylindricalEckert6Projection = "PseudoCylindricalEckert6Projection",
  PseudoCylindricalSinusoidalProjection = "PseudoCylindricalSinusoidalProjection",
  CylindricalMillerProjection = "CylindricalMillerProjection",
  CylindricalLambertEqualAreaProjection = "CylindricalLambertEqualAreaProjection",
  CylindricalEquidistantProjection = "CylindricalEquidistantProjection",
  CylindricalGallStereographicProjection = "CylindricalGallStereographicProjection",
}

export enum GeographicalSchemaProjectionEnterprise {
  АзимутальнаяПроекцияАитофа = "АзимутальнаяПроекцияАитофа",
  АзимутальнаяПроекцияВагнера7 = "АзимутальнаяПроекцияВагнера7",
  АзимутальнаяПроекцияВинкеляТрипеля = "АзимутальнаяПроекцияВинкеляТрипеля",
  АзимутальнаяПроекцияРавныхПлощадейЛамберта = "АзимутальнаяПроекцияРавныхПлощадейЛамберта",
  АзимутальнаяПроекцияХамера = "АзимутальнаяПроекцияХамера",
  АзимутальнаяРавноудаленнаяПроекция = "АзимутальнаяРавноудаленнаяПроекция",
  КоническаяПроекцияРавныхПлощадейЛамберта = "КоническаяПроекцияРавныхПлощадейЛамберта",
  ПрочаяОвальнаяПроекцияОртелиуса = "ПрочаяОвальнаяПроекцияОртелиуса",
  ПрочаяПроекцияВанДерГринтена1 = "ПрочаяПроекцияВанДерГринтена1",
  ПрочаяПроекцияВанДерГринтена2 = "ПрочаяПроекцияВанДерГринтена2",
  ПрочаяПроекцияВанДерГринтена3 = "ПрочаяПроекцияВанДерГринтена3",
  ПрочаяСотоваяШаровая1Проекция = "ПрочаяСотоваяШаровая1Проекция",
  ПрочаяШароваяПроекцияБекона = "ПрочаяШароваяПроекцияБекона",
  ПрочаяШароваяПроекцияНиколоси = "ПрочаяШароваяПроекцияНиколоси",
  ПрочаяЭпициклоидальнаяПроекцияАвгуста = "ПрочаяЭпициклоидальнаяПроекцияАвгуста",
  ПсевдоцилиндрическаяНормальнаяПроекцияБоггса = "ПсевдоцилиндрическаяНормальнаяПроекцияБоггса",
  ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса = "ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса",
  ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса = "ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса",
  ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса = "ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса",
  ПсевдоцилиндрическаяПроекцияВинкеля1 = "ПсевдоцилиндрическаяПроекцияВинкеля1",
  ПсевдоцилиндрическаяПроекцияЛоксимутала = "ПсевдоцилиндрическаяПроекцияЛоксимутала",
  ПсевдоцилиндрическаяПроекцияМолвейда = "ПсевдоцилиндрическаяПроекцияМолвейда",
  ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано = "ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано",
  ПсевдоцилиндрическаяПроекцияПутнинаP2 = "ПсевдоцилиндрическаяПроекцияПутнинаP2",
  ПсевдоцилиндрическаяПроекцияПутнинаP5 = "ПсевдоцилиндрическаяПроекцияПутнинаP5",
  ПсевдоцилиндрическаяПроекцияРобинсона = "ПсевдоцилиндрическаяПроекцияРобинсона",
  ПсевдоцилиндрическаяПроекцияЭкерта1 = "ПсевдоцилиндрическаяПроекцияЭкерта1",
  ПсевдоцилиндрическаяПроекцияЭкерта2 = "ПсевдоцилиндрическаяПроекцияЭкерта2",
  ПсевдоцилиндрическаяПроекцияЭкерта3 = "ПсевдоцилиндрическаяПроекцияЭкерта3",
  ПсевдоцилиндрическаяПроекцияЭкерта4 = "ПсевдоцилиндрическаяПроекцияЭкерта4",
  ПсевдоцилиндрическаяПроекцияЭкерта5 = "ПсевдоцилиндрическаяПроекцияЭкерта5",
  ПсевдоцилиндрическаяПроекцияЭкерта6 = "ПсевдоцилиндрическаяПроекцияЭкерта6",
  ПсевдоцилиндрическаяСинусоидальнаяПроекция = "ПсевдоцилиндрическаяСинусоидальнаяПроекция",
  ЦилиндрическаяПроекцияМиллера = "ЦилиндрическаяПроекцияМиллера",
  ЦилиндрическаяПроекцияРавныхОбластейЛамберта = "ЦилиндрическаяПроекцияРавныхОбластейЛамберта",
  ЦилиндрическаяРавноудаленнаяПроекция = "ЦилиндрическаяРавноудаленнаяПроекция",
  ЦилиндрическаяСтереографическаяПроекцияГалла = "ЦилиндрическаяСтереографическаяПроекцияГалла",
}

export enum GeographicalSchemaShowMode {
  AllData = "AllData",
  ScaleDefined = "ScaleDefined",
  SpecifiedArea = "SpecifiedArea",
}

export enum GeographicalSchemaShowModeEnterprise {
  ВсеДанные = "ВсеДанные",
  ЗадаетсяМасштабом = "ЗадаетсяМасштабом",
  ЗаданнаяОбласть = "ЗаданнаяОбласть",
}

export enum PaintingReferencePointPosition {
  LeftTop = "LeftTop",
  LeftBottom = "LeftBottom",
  LeftCenter = "LeftCenter",
  RightTop = "RightTop",
  RightBottom = "RightBottom",
  RightCenter = "RightCenter",
  Center = "Center",
  CenterTop = "CenterTop",
  CenterBottom = "CenterBottom",
}

export enum PaintingReferencePointPositionEnterprise {
  ЛевоВерх = "ЛевоВерх",
  ЛевоНиз = "ЛевоНиз",
  ЛевоЦентр = "ЛевоЦентр",
  ПравоВерх = "ПравоВерх",
  ПравоНиз = "ПравоНиз",
  ПравоЦентр = "ПравоЦентр",
  Центр = "Центр",
  ЦентрВерх = "ЦентрВерх",
  ЦентрНиз = "ЦентрНиз",
}

export enum SeriesValuesDrawingMode {
  ShowAsPart = "ShowAsPart",
  ShowAsValue = "ShowAsValue",
}

export enum SeriesValuesDrawingModeEnterprise {
  ОтображатьКакДолю = "ОтображатьКакДолю",
  ОтображатьКакЗначение = "ОтображатьКакЗначение",
}

export enum IntegrationServiceChannelState {
  Disconnected = "Disconnected",
  Connected = "Connected",
}

export enum IntegrationServiceChannelStateEnterprise {
  Отключен = "Отключен",
  Подключен = "Подключен",
}

export enum ArchiveFileCompressionLevel {
  Maximum = "Maximum",
  Minimum = "Minimum",
  Optimal = "Optimal",
}

export enum ArchiveFileCompressionLevelEnterprise {
  Максимальный = "Максимальный",
  Минимальный = "Минимальный",
  Оптимальный = "Оптимальный",
}

export enum ArchiveFileCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Copy",
  Deflate = "Deflate",
}

export enum ArchiveFileCompressionMethodEnterprise {
  BZIP2 = "BZIP2",
  Копирование = "Копирование",
  Сжатие = "Сжатие",
}

export enum ArchiveFileEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ArchiveFileEncryptionMethodEnterprise {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ArchiveFileRestoreFilePathsMode {
  Restore = "Restore",
  DontRestore = "DontRestore",
}

export enum ArchiveFileRestoreFilePathsModeEnterprise {
  Восстанавливать = "Восстанавливать",
  НеВосстанавливать = "НеВосстанавливать",
}

export enum ArchiveFileStorePathMode {
  DontStorePath = "DontStorePath",
  StoreRelativePath = "StoreRelativePath",
  StoreFullPath = "StoreFullPath",
}

export enum ArchiveFileStorePathModeEnterprise {
  НеСохранятьПути = "НеСохранятьПути",
  СохранятьОтносительныеПути = "СохранятьОтносительныеПути",
  СохранятьПолныеПути = "СохранятьПолныеПути",
}

export enum ArchiveFileSubDirProcessingMode {
  DontProcess = "DontProcess",
  ProcessRecursively = "ProcessRecursively",
}

export enum ArchiveFileSubDirProcessingModeEnterprise {
  НеОбрабатывать = "НеОбрабатывать",
  ОбрабатыватьРекурсивно = "ОбрабатыватьРекурсивно",
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

export enum ArchiveFileTypeEnterprise {
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
  Auto = "Auto",
  OSEncodingWithUTF8 = "OSEncodingWithUTF8",
}

export enum FileNamesEncodingInArchiveFileEnterprise {
  UTF8 = "UTF8",
  Авто = "Авто",
  КодировкаОСДополнительноUTF8 = "КодировкаОСДополнительноUTF8",
}

export enum FileAccess {
  Write = "Write",
  Read = "Read",
  ReadAndWrite = "ReadAndWrite",
}

export enum FileAccessEnterprise {
  Запись = "Запись",
  Чтение = "Чтение",
  ЧтениеИЗапись = "ЧтениеИЗапись",
}

export enum FileCompareMethod {
  Binary = "Binary",
  SpreadsheetDocument = "SpreadsheetDocument",
  TextDocument = "TextDocument",
}

export enum FileCompareMethodEnterprise {
  Двоичное = "Двоичное",
  ТабличныйДокумент = "ТабличныйДокумент",
  ТекстовыйДокумент = "ТекстовыйДокумент",
}

export enum FileDialogMode {
  ChooseDirectory = "ChooseDirectory",
  Open = "Open",
  Save = "Save",
}

export enum FileDialogModeEnterprise {
  ВыборКаталога = "ВыборКаталога",
  Открытие = "Открытие",
  Сохранение = "Сохранение",
}

export enum FileDialogSection {
  Audio = "Audio",
  Gallery = "Gallery",
  Documents = "Documents",
  Recent = "Recent",
  Files = "Files",
}

export enum FileDialogSectionEnterprise {
  Аудио = "Аудио",
  Галерея = "Галерея",
  Документы = "Документы",
  Недавние = "Недавние",
  Файлы = "Файлы",
}

export enum FileDragMode {
  AsFileRef = "AsFileRef",
  AsFile = "AsFile",
}

export enum FileDragModeEnterprise {
  КакСсылкаНаФайл = "КакСсылкаНаФайл",
  КакФайл = "КакФайл",
}

export enum FileOpenMode {
  Append = "Append",
  Truncate = "Truncate",
  Open = "Open",
  OpenOrCreate = "OpenOrCreate",
  Create = "Create",
  CreateNew = "CreateNew",
}

export enum FileOpenModeEnterprise {
  Дописать = "Дописать",
  Обрезать = "Обрезать",
  Открыть = "Открыть",
  ОткрытьИлиСоздать = "ОткрытьИлиСоздать",
  Создать = "Создать",
  СоздатьНовый = "СоздатьНовый",
}

export enum GetFilesArchiveMode {
  GetArchiveAlways = "GetArchiveAlways",
  GetArchiveWhenRequired = "GetArchiveWhenRequired",
}

export enum GetFilesArchiveModeEnterprise {
  ПолучатьАрхивВсегда = "ПолучатьАрхивВсегда",
  ПолучатьАрхивПриНеобходимости = "ПолучатьАрхивПриНеобходимости",
}

export enum IncomingShareRequestStandardCommand {
  CopyToClipboard = "CopyToClipboard",
  ShareInConversation = "ShareInConversation",
  Show = "Show",
  Save = "Save",
}

export enum IncomingShareRequestStandardCommandEnterprise {
  КопироватьВБуферОбмена = "КопироватьВБуферОбмена",
  ПоделитьсяВОбсуждении = "ПоделитьсяВОбсуждении",
  Показать = "Показать",
  Сохранить = "Сохранить",
}

export enum MobileDeviceLibraryDirType {
  Audio = "Audio",
  Video = "Video",
  Pictures = "Pictures",
}

export enum MobileDeviceLibraryDirTypeEnterprise {
  Аудио = "Аудио",
  Видео = "Видео",
  Картинки = "Картинки",
}

export enum ShareRequestDataProcessingVariant {
  View = "View",
  Edit = "Edit",
}

export enum ShareRequestDataProcessingVariantEnterprise {
  Просмотр = "Просмотр",
  Редактирование = "Редактирование",
}

export enum AccountMainPresentation {
  AsCode = "AsCode",
  AsDescription = "AsDescription",
}

export enum AccountMainPresentationEnterprise {
  ВВидеКода = "ВВидеКода",
  ВВидеНаименования = "ВВидеНаименования",
}

export enum AccumulationRegisterType {
  Turnovers = "Turnovers",
  Balance = "Balance",
}

export enum AccumulationRegisterTypeEnterprise {
  Обороты = "Обороты",
  Остатки = "Остатки",
}

export enum AttributeUse {
  ForFolder = "ForFolder",
  ForFolderAndItem = "ForFolderAndItem",
  ForItem = "ForItem",
}

export enum AttributeUseEnterprise {
  ДляГруппы = "ДляГруппы",
  ДляГруппыИЭлемента = "ДляГруппыИЭлемента",
  ДляЭлемента = "ДляЭлемента",
}

export enum BinaryDataBlockStorageUseMode {
  Use = "Use",
  DontUse = "DontUse",
}

export enum BinaryDataBlockStorageUseModeEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum BinaryDataStorageMode {
  Use = "Use",
  DontUse = "DontUse",
}

export enum BinaryDataStorageModeEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum BusinessProcessNumberPeriodicity {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Nonperiodical = "Nonperiodical",
}

export enum BusinessProcessNumberPeriodicityEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Непериодический = "Непериодический",
}

export enum BusinessProcessNumberType {
  String = "String",
  Number = "Number",
}

export enum BusinessProcessNumberTypeEnterprise {
  Строка = "Строка",
  Число = "Число",
}

export enum CalculationRegisterPeriodicity {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
}

export enum CalculationRegisterPeriodicityEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
}

export enum CalculationTypeMainPresentation {
  AsCode = "AsCode",
  AsDescription = "AsDescription",
}

export enum CalculationTypeMainPresentationEnterprise {
  ВВидеКода = "ВВидеКода",
  ВВидеНаименования = "ВВидеНаименования",
}

export enum CharOfAccountCodeSeries {
  WholeChartOfAccounts = "WholeChartOfAccounts",
  WithinSubordination = "WithinSubordination",
}

export enum CharOfAccountCodeSeriesEnterprise {
  ВоВсемПланеСчетов = "ВоВсемПланеСчетов",
  ВПределахПодчинения = "ВПределахПодчинения",
}

export enum CharacteristicKindCodesSeries {
  WholeCharacteristicKind = "WholeCharacteristicKind",
  WithinSubordination = "WithinSubordination",
}

export enum CharacteristicKindCodesSeriesEnterprise {
  ВоВсемПланеВидовХарактеристик = "ВоВсемПланеВидовХарактеристик",
  ВПределахПодчинения = "ВПределахПодчинения",
}

export enum CharacteristicTypeMainPresentation {
  AsCode = "AsCode",
  AsDescription = "AsDescription",
}

export enum CharacteristicTypeMainPresentationEnterprise {
  ВВидеКода = "ВВидеКода",
  ВВидеНаименования = "ВВидеНаименования",
}

export enum ChartOfCalculationTypesBaseUse {
  DontUse = "DontUse",
  OnActionPeriod = "OnActionPeriod",
  OnRegistrationPeriod = "OnRegistrationPeriod",
}

export enum ChartOfCalculationTypesBaseUseEnterprise {
  НеИспользовать = "НеИспользовать",
  ПоПериодуДействия = "ПоПериодуДействия",
  ПоПериодуРегистрации = "ПоПериодуРегистрации",
}

export enum ChartOfCalculationTypesCodeType {
  String = "String",
  Number = "Number",
}

export enum ChartOfCalculationTypesCodeTypeEnterprise {
  Строка = "Строка",
  Число = "Число",
}

export enum ChoiceDataGetModeOnInputByString {
  Directly = "Directly",
  Background = "Background",
}

export enum ChoiceDataGetModeOnInputByStringEnterprise {
  Непосредственно = "Непосредственно",
  Фоновый = "Фоновый",
}

export enum ChoiceMode {
  QuickChoice = "QuickChoice",
  FromForm = "FromForm",
  BothWays = "BothWays",
}

export enum ChoiceModeEnterprise {
  БыстрыйВыбор = "БыстрыйВыбор",
  ИзФормы = "ИзФормы",
  ОбоимиСпособами = "ОбоимиСпособами",
}

export enum CommonAttributeAuthenticationSeparation {
  DontUse = "DontUse",
  Separate = "Separate",
}

export enum CommonAttributeAuthenticationSeparationEnterprise {
  НеИспользовать = "НеИспользовать",
  Разделять = "Разделять",
}

export enum CommonAttributeAutoUse {
  Use = "Use",
  DontUse = "DontUse",
}

export enum CommonAttributeAutoUseEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum CommonAttributeConfigurationExtensionsSeparation {
  DontUse = "DontUse",
  Separate = "Separate",
}

export enum CommonAttributeConfigurationExtensionsSeparationEnterprise {
  НеИспользовать = "НеИспользовать",
  Разделять = "Разделять",
}

export enum CommonAttributeDataSeparation {
  DontUse = "DontUse",
  Separate = "Separate",
}

export enum CommonAttributeDataSeparationEnterprise {
  НеИспользовать = "НеИспользовать",
  Разделять = "Разделять",
}

export enum CommonAttributeSeparatedDataUse {
  Independently = "Independently",
  IndependentlyAndSimultaneously = "IndependentlyAndSimultaneously",
}

export enum CommonAttributeSeparatedDataUseEnterprise {
  Независимо = "Независимо",
  НезависимоИСовместно = "НезависимоИСовместно",
}

export enum CommonAttributeUse {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum CommonAttributeUseEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum CommonAttributeUsersSeparation {
  DontUse = "DontUse",
  Separate = "Separate",
}

export enum CommonAttributeUsersSeparationEnterprise {
  НеИспользовать = "НеИспользовать",
  Разделять = "Разделять",
}

export enum CompatibilityMode {
  Version8_1 = "Version8_1",
  Version8_2_13 = "Version8_2_13",
  Version8_2_16 = "Version8_2_16",
  Version8_3_1 = "Version8_3_1",
  Version8_3_10 = "Version8_3_10",
  Version8_3_11 = "Version8_3_11",
  Version8_3_12 = "Version8_3_12",
  Version8_3_13 = "Version8_3_13",
  Version8_3_14 = "Version8_3_14",
  Version8_3_15 = "Version8_3_15",
  Version8_3_16 = "Version8_3_16",
  Version8_3_17 = "Version8_3_17",
  Version8_3_18 = "Version8_3_18",
  Version8_3_19 = "Version8_3_19",
  Version8_3_2 = "Version8_3_2",
  Version8_3_20 = "Version8_3_20",
  Version8_3_21 = "Version8_3_21",
  Version8_3_22 = "Version8_3_22",
  Version8_3_23 = "Version8_3_23",
  Version8_3_24 = "Version8_3_24",
  Version8_3_25 = "Version8_3_25",
  Version8_3_26 = "Version8_3_26",
  Version8_3_3 = "Version8_3_3",
  Version8_3_4 = "Version8_3_4",
  Version8_3_5 = "Version8_3_5",
  Version8_3_6 = "Version8_3_6",
  Version8_3_7 = "Version8_3_7",
  Version8_3_8 = "Version8_3_8",
  Version8_3_9 = "Version8_3_9",
  DontUse = "DontUse",
}

export enum CompatibilityModeEnterprise {
  Версия8_1 = "Версия8_1",
  Версия8_2_13 = "Версия8_2_13",
  Версия8_2_16 = "Версия8_2_16",
  Версия8_3_1 = "Версия8_3_1",
  Версия8_3_10 = "Версия8_3_10",
  Версия8_3_11 = "Версия8_3_11",
  Версия8_3_12 = "Версия8_3_12",
  Версия8_3_13 = "Версия8_3_13",
  Версия8_3_14 = "Версия8_3_14",
  Версия8_3_15 = "Версия8_3_15",
  Версия8_3_16 = "Версия8_3_16",
  Версия8_3_17 = "Версия8_3_17",
  Версия8_3_18 = "Версия8_3_18",
  Версия8_3_19 = "Версия8_3_19",
  Версия8_3_2 = "Версия8_3_2",
  Версия8_3_20 = "Версия8_3_20",
  Версия8_3_21 = "Версия8_3_21",
  Версия8_3_22 = "Версия8_3_22",
  Версия8_3_23 = "Версия8_3_23",
  Версия8_3_24 = "Версия8_3_24",
  Версия8_3_25 = "Версия8_3_25",
  Версия8_3_26 = "Версия8_3_26",
  Версия8_3_3 = "Версия8_3_3",
  Версия8_3_4 = "Версия8_3_4",
  Версия8_3_5 = "Версия8_3_5",
  Версия8_3_6 = "Версия8_3_6",
  Версия8_3_7 = "Версия8_3_7",
  Версия8_3_8 = "Версия8_3_8",
  Версия8_3_9 = "Версия8_3_9",
  НеИспользовать = "НеИспользовать",
}

export enum ConfigurationExtensionPurpose {
  Customization = "Customization",
  AddOn = "AddOn",
  Patch = "Patch",
}

export enum ConfigurationExtensionPurposeEnterprise {
  Адаптация = "Адаптация",
  Дополнение = "Дополнение",
  Исправление = "Исправление",
}

export enum CreateOnInput {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum CreateOnInputEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum DataExchangeMainPresentation {
  AsCode = "AsCode",
  AsDescription = "AsDescription",
}

export enum DataExchangeMainPresentationEnterprise {
  ВВидеКода = "ВВидеКода",
  ВВидеНаименования = "ВВидеНаименования",
}

export enum DataHistoryUse {
  Use = "Use",
  DontUse = "DontUse",
}

export enum DataHistoryUseEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum DefaultDataLockControlMode {
  Automatic = "Automatic",
  AutomaticAndManaged = "AutomaticAndManaged",
  Managed = "Managed",
}

export enum DefaultDataLockControlModeEnterprise {
  Автоматический = "Автоматический",
  АвтоматическийИУправляемый = "АвтоматическийИУправляемый",
  Управляемый = "Управляемый",
}

export enum DocumentNumberPeriodicity {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Nonperiodical = "Nonperiodical",
}

export enum DocumentNumberPeriodicityEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Непериодический = "Непериодический",
}

export enum DocumentNumberType {
  String = "String",
  Number = "Number",
}

export enum DocumentNumberTypeEnterprise {
  Строка = "Строка",
  Число = "Число",
}

export enum EditType {
  InDialog = "InDialog",
  InList = "InList",
  BothWays = "BothWays",
}

export enum EditTypeEnterprise {
  ВДиалоге = "ВДиалоге",
  ВСписке = "ВСписке",
  ОбоимиСпособами = "ОбоимиСпособами",
}

export enum ExternalDataSourceTableDataType {
  NonobjectData = "NonobjectData",
  ObjectData = "ObjectData",
}

export enum ExternalDataSourceTableDataTypeEnterprise {
  НеобъектныеДанные = "НеобъектныеДанные",
  ОбъектныеДанные = "ОбъектныеДанные",
}

export enum ExternalDataSourceTableType {
  Expression = "Expression",
  Table = "Table",
}

export enum ExternalDataSourceTableTypeEnterprise {
  Выражение = "Выражение",
  Таблица = "Таблица",
}

export enum FormType {
  Ordinary = "Ordinary",
  Managed = "Managed",
}

export enum FormTypeEnterprise {
  Обычная = "Обычная",
  Управляемая = "Управляемая",
}

export enum FullTextSearchOnInputByString {
  Use = "Use",
  DontUse = "DontUse",
}

export enum FullTextSearchOnInputByStringEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
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
  Any = "Any",
}

export enum HTTPMethodEnterprise {
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
  Любой = "Любой",
}

export enum HierarchyType {
  HierarchyFoldersAndItems = "HierarchyFoldersAndItems",
  HierarchyOfItems = "HierarchyOfItems",
}

export enum HierarchyTypeEnterprise {
  ИерархияГруппИЭлементов = "ИерархияГруппИЭлементов",
  ИерархияЭлементов = "ИерархияЭлементов",
}

export enum Indexing {
  Index = "Index",
  IndexWithAdditionalOrder = "IndexWithAdditionalOrder",
  DontIndex = "DontIndex",
}

export enum IndexingEnterprise {
  Индексировать = "Индексировать",
  ИндексироватьСДопУпорядочиванием = "ИндексироватьСДопУпорядочиванием",
  НеИндексировать = "НеИндексировать",
}

export enum InformationRegisterPeriodicity {
  Year = "Year",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Nonperiodical = "Nonperiodical",
  RecorderPosition = "RecorderPosition",
  Second = "Second",
}

export enum InformationRegisterPeriodicityEnterprise {
  Год = "Год",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Непериодический = "Непериодический",
  ПозицияРегистратора = "ПозицияРегистратора",
  Секунда = "Секунда",
}

export enum IntegrationServiceChannelMessageDirection {
  Send = "Send",
  Receive = "Receive",
}

export enum IntegrationServiceChannelMessageDirectionEnterprise {
  Отправка = "Отправка",
  Получение = "Получение",
}

export enum ModalityUseMode {
  Use = "Use",
  UseWithWarnings = "UseWithWarnings",
  DontUse = "DontUse",
}

export enum ModalityUseModeEnterprise {
  Использовать = "Использовать",
  ИспользоватьСПредупреждениями = "ИспользоватьСПредупреждениями",
  НеИспользовать = "НеИспользовать",
}

export enum MoveBoundaryOnPosting {
  DontMove = "DontMove",
  Move = "Move",
}

export enum MoveBoundaryOnPostingEnterprise {
  НеПеремещать = "НеПеремещать",
  Перемещать = "Перемещать",
}

export enum ObjectAutonumerationMode {
  NotAutoFree = "NotAutoFree",
  AutoFree = "AutoFree",
}

export enum ObjectAutonumerationModeEnterprise {
  НеОсвобождатьАвтоматически = "НеОсвобождатьАвтоматически",
  ОсвобождатьАвтоматически = "ОсвобождатьАвтоматически",
}

export enum ObjectBelonging {
  Adopted = "Adopted",
  Native = "Native",
}

export enum ObjectBelongingEnterprise {
  Заимствованный = "Заимствованный",
  Собственный = "Собственный",
}

export enum Posting {
  Deny = "Deny",
  Allow = "Allow",
}

export enum PostingEnterprise {
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum RealTimePosting {
  Deny = "Deny",
  Allow = "Allow",
}

export enum RealTimePostingEnterprise {
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum RegisterRecordsDeletion {
  AutoDeleteOff = "AutoDeleteOff",
  AutoDelete = "AutoDelete",
  AutoDeleteOnUnpost = "AutoDeleteOnUnpost",
}

export enum RegisterRecordsDeletionEnterprise {
  НеУдалятьАвтоматически = "НеУдалятьАвтоматически",
  УдалятьАвтоматически = "УдалятьАвтоматически",
  УдалятьАвтоматическиПриОтменеПроведения = "УдалятьАвтоматическиПриОтменеПроведения",
}

export enum RegisterRecordsWritingOnPost {
  WriteSelected = "WriteSelected",
  WriteModified = "WriteModified",
}

export enum RegisterRecordsWritingOnPostEnterprise {
  ЗаписыватьВыбранные = "ЗаписыватьВыбранные",
  ЗаписыватьМодифицированные = "ЗаписыватьМодифицированные",
}

export enum RegisterWriteMode {
  Independent = "Independent",
  RecorderSubordinate = "RecorderSubordinate",
}

export enum RegisterWriteModeEnterprise {
  Независимый = "Независимый",
  ПодчинениеРегистратору = "ПодчинениеРегистратору",
}

export enum ReturnValuesReuse {
  DuringRequest = "DuringRequest",
  DuringSession = "DuringSession",
  DontUse = "DontUse",
}

export enum ReturnValuesReuseEnterprise {
  НаВремяВызова = "НаВремяВызова",
  НаВремяСеанса = "НаВремяСеанса",
  НеИспользовать = "НеИспользовать",
}

export enum ScriptVariant {
  English = "English",
  Russian = "Russian",
}

export enum ScriptVariantEnterprise {
  Английский = "Английский",
  Русский = "Русский",
}

export enum SearchStringModeOnInputByString {
  AnyPart = "AnyPart",
  Begin = "Begin",
}

export enum SearchStringModeOnInputByStringEnterprise {
  ЛюбаяЧасть = "ЛюбаяЧасть",
  Начало = "Начало",
}

export enum SequenceFilling {
  AutoFill = "AutoFill",
  AutoFillOff = "AutoFillOff",
}

export enum SequenceFillingEnterprise {
  ЗаполнятьАвтоматически = "ЗаполнятьАвтоматически",
  НеЗаполнятьАвтоматически = "НеЗаполнятьАвтоматически",
}

export enum SessionReuseMode {
  Use = "Use",
  AutoUse = "AutoUse",
  DontUse = "DontUse",
}

export enum SessionReuseModeEnterprise {
  Использовать = "Использовать",
  ИспользоватьАвтоматически = "ИспользоватьАвтоматически",
  НеИспользовать = "НеИспользовать",
}

export enum StyleElementType {
  Border = "Border",
  Color = "Color",
  Font = "Font",
}

export enum StyleElementTypeEnterprise {
  Рамка = "Рамка",
  Цвет = "Цвет",
  Шрифт = "Шрифт",
}

export enum SubordinationUse {
  ToFolders = "ToFolders",
  ToFoldersAndItems = "ToFoldersAndItems",
  ToItems = "ToItems",
}

export enum SubordinationUseEnterprise {
  Группам = "Группам",
  ГруппамИЭлементам = "ГруппамИЭлементам",
  Элементам = "Элементам",
}

export enum SynchronousExtensionAndAddInCallUseMode {
  Use = "Use",
  UseWithWarnings = "UseWithWarnings",
  DontUse = "DontUse",
}

export enum SynchronousExtensionAndAddInCallUseModeEnterprise {
  Использовать = "Использовать",
  ИспользоватьСПредупреждениями = "ИспользоватьСПредупреждениями",
  НеИспользовать = "НеИспользовать",
}

export enum SynchronousPlatformExtensionAndAddInCallUseMode {
  Use = "Use",
  UseWithWarnings = "UseWithWarnings",
  DontUse = "DontUse",
}

export enum SynchronousPlatformExtensionAndAddInCallUseModeEnterprise {
  Использовать = "Использовать",
  ИспользоватьСПредупреждениями = "ИспользоватьСПредупреждениями",
  НеИспользовать = "НеИспользовать",
}

export enum TaskMainPresentation {
  AsDescription = "AsDescription",
  AsNumber = "AsNumber",
}

export enum TaskMainPresentationEnterprise {
  ВВидеНаименования = "ВВидеНаименования",
  ВВидеНомера = "ВВидеНомера",
}

export enum TaskNumberAutoPrefix {
  DontUse = "DontUse",
  BusinessProcessNumber = "BusinessProcessNumber",
}

export enum TaskNumberAutoPrefixEnterprise {
  НеИспользовать = "НеИспользовать",
  НомерБизнесПроцесса = "НомерБизнесПроцесса",
}

export enum TaskNumberType {
  String = "String",
  Number = "Number",
}

export enum TaskNumberTypeEnterprise {
  Строка = "Строка",
  Число = "Число",
}

export enum TemplateType {
  ActiveDocument = "ActiveDocument",
  HTMLDocument = "HTMLDocument",
  AddIn = "AddIn",
  GeographicalSchema = "GeographicalSchema",
  GraphicalSchema = "GraphicalSchema",
  BinaryData = "BinaryData",
  DataCompositionAppearanceTemplate = "DataCompositionAppearanceTemplate",
  DataCompositionSchema = "DataCompositionSchema",
  SpreadsheetDocument = "SpreadsheetDocument",
  TextDocument = "TextDocument",
}

export enum TemplateTypeEnterprise {
  ActiveDocument = "ActiveDocument",
  HTMLДокумент = "HTMLДокумент",
  ВнешняяКомпонента = "ВнешняяКомпонента",
  ГеографическаяСхема = "ГеографическаяСхема",
  ГрафическаяСхема = "ГрафическаяСхема",
  ДвоичныеДанные = "ДвоичныеДанные",
  МакетОформленияКомпоновкиДанных = "МакетОформленияКомпоновкиДанных",
  СхемаКомпоновкиДанных = "СхемаКомпоновкиДанных",
  ТабличныйДокумент = "ТабличныйДокумент",
  ТекстовыйДокумент = "ТекстовыйДокумент",
}

export enum TransferDirection {
  In = "In",
  InOut = "InOut",
  Out = "Out",
}

export enum TransferDirectionEnterprise {
  Входной = "Входной",
  ВходнойВыходной = "ВходнойВыходной",
  Выходной = "Выходной",
}

export enum TypeReductionMode {
  Deny = "Deny",
  TransformValues = "TransformValues",
  DeleteData = "DeleteData",
}

export enum TypeReductionModeEnterprise {
  Запрещать = "Запрещать",
  ПреобразовыватьЗначения = "ПреобразовыватьЗначения",
  УдалятьДанные = "УдалятьДанные",
}

export enum UseFullTextSearch {
  Use = "Use",
  DontUse = "DontUse",
}

export enum UseFullTextSearchEnterprise {
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum UseQuickChoice {
  Auto = "Auto",
  Use = "Use",
  DontUse = "DontUse",
}

export enum UseQuickChoiceEnterprise {
  Авто = "Авто",
  Использовать = "Использовать",
  НеИспользовать = "НеИспользовать",
}

export enum PresentationAdditionType {
  Add = "Add",
  DontAdd = "DontAdd",
}

export enum PresentationAdditionTypeEnterprise {
  Добавлять = "Добавлять",
  НеДобавлять = "НеДобавлять",
}

export enum ReportBuilderDetailsFillType {
  GroupValues = "GroupValues",
  DontFill = "DontFill",
  Details = "Details",
}

export enum ReportBuilderDetailsFillTypeEnterprise {
  ЗначенияГруппировок = "ЗначенияГруппировок",
  НеЗаполнять = "НеЗаполнять",
  Расшифровка = "Расшифровка",
}

export enum ReportBuilderDimensionType {
  Hierarchy = "Hierarchy",
  HierarchyOnly = "HierarchyOnly",
  Items = "Items",
}

export enum ReportBuilderDimensionTypeEnterprise {
  Иерархия = "Иерархия",
  ТолькоИерархия = "ТолькоИерархия",
  Элементы = "Элементы",
}

export enum TotalPlacementType {
  Header = "Header",
  HeaderAndFooter = "HeaderAndFooter",
  Footer = "Footer",
  FooterOnly = "FooterOnly",
}

export enum TotalPlacementTypeEnterprise {
  Заголовок = "Заголовок",
  ЗаголовокИПодвал = "ЗаголовокИПодвал",
  Подвал = "Подвал",
  ТолькоПодвал = "ТолькоПодвал",
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

export enum XMLAttributeTypeEnterprise {
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
  XMLExclusiveCanonicalization = "XMLExclusiveCanonicalization",
  XMLExclusiveCanonicalizationWithComments = "XMLExclusiveCanonicalizationWithComments",
  XMLCanonicalization = "XMLCanonicalization",
  XMLCanonicalization1_1 = "XMLCanonicalization1_1",
  XMLCanonicalization1_1WithComments = "XMLCanonicalization1_1WithComments",
  XMLCanonicalizationWithComments = "XMLCanonicalizationWithComments",
}

export enum XMLCanonicalizationTypeEnterprise {
  ИсключающийКаноническийXML = "ИсключающийКаноническийXML",
  ИсключающийКаноническийXMLСКомментариями = "ИсключающийКаноническийXMLСКомментариями",
  КаноническийXML = "КаноническийXML",
  КаноническийXML1_1 = "КаноническийXML1_1",
  КаноническийXML1_1СКомментариями = "КаноническийXML1_1СКомментариями",
  КаноническийXMLСКомментариями = "КаноническийXMLСКомментариями",
}

export enum XMLNodeType {
  Attribute = "Attribute",
  ProcessingInstruction = "ProcessingInstruction",
  Comment = "Comment",
  EndEntity = "EndEntity",
  EndElement = "EndElement",
  StartElement = "StartElement",
  None = "None",
  Notation = "Notation",
  XMLDeclaration = "XMLDeclaration",
  DocumentTypeDefinition = "DocumentTypeDefinition",
  Whitespace = "Whitespace",
  CDATASection = "CDATASection",
  EntityReference = "EntityReference",
  Entity = "Entity",
  Text = "Text",
}

export enum XMLNodeTypeEnterprise {
  Атрибут = "Атрибут",
  ИнструкцияОбработки = "ИнструкцияОбработки",
  Комментарий = "Комментарий",
  КонецСущности = "КонецСущности",
  КонецЭлемента = "КонецЭлемента",
  НачалоЭлемента = "НачалоЭлемента",
  Ничего = "Ничего",
  Нотация = "Нотация",
  ОбъявлениеXML = "ОбъявлениеXML",
  ОпределениеТипаДокумента = "ОпределениеТипаДокумента",
  ПробельныеСимволы = "ПробельныеСимволы",
  СекцияCDATA = "СекцияCDATA",
  СсылкаНаСущность = "СсылкаНаСущность",
  Сущность = "Сущность",
  Текст = "Текст",
}

export enum XMLSpace {
  Default = "Default",
  Preserve = "Preserve",
}

export enum XMLSpaceEnterprise {
  ПоУмолчанию = "ПоУмолчанию",
  Сохранять = "Сохранять",
}

export enum XMLTypeAssignment {
  Implicit = "Implicit",
  Explicit = "Explicit",
}

export enum XMLTypeAssignmentEnterprise {
  Неявное = "Неявное",
  Явное = "Явное",
}

export enum XMLValidationType {
  NoValidate = "NoValidate",
  DocumentTypeDefinition = "DocumentTypeDefinition",
  XMLSchema = "XMLSchema",
}

export enum XMLValidationTypeEnterprise {
  НетПроверки = "НетПроверки",
  ОпределениеТипаДокумента = "ОпределениеТипаДокумента",
  СхемаXML = "СхемаXML",
}

export enum AllowedMessageNo {
  Greater = "Greater",
  Any = "Any",
  Next = "Next",
}

export enum AllowedMessageNoEnterprise {
  Больший = "Больший",
  Любой = "Любой",
  Очередной = "Очередной",
}

export enum AutoChangeRecord {
  Deny = "Deny",
  Allow = "Allow",
}

export enum AutoChangeRecordEnterprise {
  Запретить = "Запретить",
  Разрешить = "Разрешить",
}

export enum DataItemReceive {
  Auto = "Auto",
  Ignore = "Ignore",
  Accept = "Accept",
}

export enum DataItemReceiveEnterprise {
  Авто = "Авто",
  Игнорировать = "Игнорировать",
  Принять = "Принять",
}

export enum DataItemSend {
  Auto = "Auto",
  Ignore = "Ignore",
  Delete = "Delete",
}

export enum DataItemSendEnterprise {
  Авто = "Авто",
  Игнорировать = "Игнорировать",
  Удалить = "Удалить",
}

export enum AnalysisDataType {
  Discrete = "Discrete",
  Contiguous = "Contiguous",
}

export enum AnalysisDataTypeEnterprise {
  Дискретные = "Дискретные",
  Непрерывные = "Непрерывные",
}

export enum AssociationRulesDataSourceType {
  Object = "Object",
  Event = "Event",
}

export enum AssociationRulesDataSourceTypeEnterprise {
  Объектный = "Объектный",
  Событийный = "Событийный",
}

export enum AssociationRulesPruneType {
  Redundant = "Redundant",
  Covered = "Covered",
}

export enum AssociationRulesPruneTypeEnterprise {
  Избыточные = "Избыточные",
  Покрытые = "Покрытые",
}

export enum ClusterizationMethod {
  NearestNeighbor = "NearestNeighbor",
  FurthestNeighbor = "FurthestNeighbor",
  KMeans = "KMeans",
  Centroid = "Centroid",
}

export enum ClusterizationMethodEnterprise {
  БлижняяСвязь = "БлижняяСвязь",
  ДальняяСвязь = "ДальняяСвязь",
  КСредних = "КСредних",
  ЦентрТяжести = "ЦентрТяжести",
}

export enum DataAnalysisAssociationRulesOrderType {
  ByConfidence = "ByConfidence",
  ByImportance = "ByImportance",
  BySupport = "BySupport",
}

export enum DataAnalysisAssociationRulesOrderTypeEnterprise {
  ПоДостоверности = "ПоДостоверности",
  ПоЗначимости = "ПоЗначимости",
  ПоКоличествуСлучаев = "ПоКоличествуСлучаев",
}

export enum DataAnalysisColumnTypeAssociationRules {
  NotUsed = "NotUsed",
  Object = "Object",
  Item = "Item",
}

export enum DataAnalysisColumnTypeAssociationRulesEnterprise {
  НеИспользуемая = "НеИспользуемая",
  Объект = "Объект",
  Элемент = "Элемент",
}

export enum DataAnalysisColumnTypeClusterization {
  Input = "Input",
  InputAndPredictable = "InputAndPredictable",
  Key = "Key",
  NotUsed = "NotUsed",
  Predictable = "Predictable",
}

export enum DataAnalysisColumnTypeClusterizationEnterprise {
  Входная = "Входная",
  ВходнаяИПрогнозируемая = "ВходнаяИПрогнозируемая",
  Ключ = "Ключ",
  НеИспользуемая = "НеИспользуемая",
  Прогнозируемая = "Прогнозируемая",
}

export enum DataAnalysisColumnTypeDecisionTree {
  Input = "Input",
  NotUsed = "NotUsed",
  Predictable = "Predictable",
}

export enum DataAnalysisColumnTypeDecisionTreeEnterprise {
  Входная = "Входная",
  НеИспользуемая = "НеИспользуемая",
  Прогнозируемая = "Прогнозируемая",
}

export enum DataAnalysisColumnTypeSequentialPatterns {
  Time = "Time",
  NotUsed = "NotUsed",
  Sequence = "Sequence",
  Item = "Item",
}

export enum DataAnalysisColumnTypeSequentialPatternsEnterprise {
  Время = "Время",
  НеИспользуемая = "НеИспользуемая",
  Последовательность = "Последовательность",
  Элемент = "Элемент",
}

export enum DataAnalysisColumnTypeSummaryStatistics {
  Input = "Input",
  NotUsed = "NotUsed",
}

export enum DataAnalysisColumnTypeSummaryStatisticsEnterprise {
  Входная = "Входная",
  НеИспользуемая = "НеИспользуемая",
}

export enum DataAnalysisDistanceMetricType {
  Euclidean = "Euclidean",
  SquaredEuclidean = "SquaredEuclidean",
  CityBlock = "CityBlock",
  Maximum = "Maximum",
}

export enum DataAnalysisDistanceMetricTypeEnterprise {
  ЕвклидоваМетрика = "ЕвклидоваМетрика",
  ЕвклидоваМетрикаВКвадрате = "ЕвклидоваМетрикаВКвадрате",
  МетрикаГорода = "МетрикаГорода",
  МетрикаДоминирования = "МетрикаДоминирования",
}

export enum DataAnalysisFieldType {
  DataAnalysisObject = "DataAnalysisObject",
  Field = "Field",
}

export enum DataAnalysisFieldTypeEnterprise {
  ОбъектАнализаДанных = "ОбъектАнализаДанных",
  Поле = "Поле",
}

export enum DataAnalysisNumericValueUseType {
  AsBoolean = "AsBoolean",
  AsNumeric = "AsNumeric",
}

export enum DataAnalysisNumericValueUseTypeEnterprise {
  КакБулево = "КакБулево",
  КакЧисло = "КакЧисло",
}

export enum DataAnalysisResultTableFillType {
  AllFields = "AllFields",
  UsedFields = "UsedFields",
  KeyFields = "KeyFields",
  DontFill = "DontFill",
}

export enum DataAnalysisResultTableFillTypeEnterprise {
  ВсеПоля = "ВсеПоля",
  ИспользуемыеПоля = "ИспользуемыеПоля",
  КлючевыеПоля = "КлючевыеПоля",
  НеЗаполнять = "НеЗаполнять",
}

export enum DataAnalysisSequentialPatternsOrderType {
  ByLength = "ByLength",
  BySupport = "BySupport",
}

export enum DataAnalysisSequentialPatternsOrderTypeEnterprise {
  ПоДлине = "ПоДлине",
  ПоКоличествуСлучаев = "ПоКоличествуСлучаев",
}

export enum DataAnalysisStandardizationType {
  DontStandardize = "DontStandardize",
  Standardize = "Standardize",
}

export enum DataAnalysisStandardizationTypeEnterprise {
  НеСтандартизировать = "НеСтандартизировать",
  Стандартизировать = "Стандартизировать",
}

export enum DataAnalysisTimeIntervalUnitType {
  Year = "Year",
  TenDays = "TenDays",
  Day = "Day",
  Quarter = "Quarter",
  Month = "Month",
  Minute = "Minute",
  Week = "Week",
  HalfYear = "HalfYear",
  Second = "Second",
  CurrentTenDays = "CurrentTenDays",
  CurrentMinute = "CurrentMinute",
  CurrentWeek = "CurrentWeek",
  CurrentHalfYear = "CurrentHalfYear",
  CurrentYear = "CurrentYear",
  CurrentDay = "CurrentDay",
  CurrentQuarter = "CurrentQuarter",
  CurrentMonth = "CurrentMonth",
  CurrentHour = "CurrentHour",
  Hour = "Hour",
}

export enum DataAnalysisTimeIntervalUnitTypeEnterprise {
  Год = "Год",
  Декада = "Декада",
  День = "День",
  Квартал = "Квартал",
  Месяц = "Месяц",
  Минута = "Минута",
  Неделя = "Неделя",
  Полугодие = "Полугодие",
  Секунда = "Секунда",
  ТекущаяДекада = "ТекущаяДекада",
  ТекущаяМинута = "ТекущаяМинута",
  ТекущаяНеделя = "ТекущаяНеделя",
  ТекущееПолугодие = "ТекущееПолугодие",
  ТекущийГод = "ТекущийГод",
  ТекущийДень = "ТекущийДень",
  ТекущийКвартал = "ТекущийКвартал",
  ТекущийМесяц = "ТекущийМесяц",
  ТекущийЧас = "ТекущийЧас",
  Час = "Час",
}

export enum DecisionTreeSimplificationType {
  DontSimplify = "DontSimplify",
  Simplify = "Simplify",
}

export enum DecisionTreeSimplificationTypeEnterprise {
  НеУпрощать = "НеУпрощать",
  Упрощать = "Упрощать",
}

export enum PredictionModelColumnType {
  Input = "Input",
  DataSourceColumn = "DataSourceColumn",
  Predictable = "Predictable",
}

export enum PredictionModelColumnTypeEnterprise {
  Входная = "Входная",
  КолонкаИсточникаДанных = "КолонкаИсточникаДанных",
  Прогнозируемая = "Прогнозируемая",
}

export enum FileNamesEncodingInZipFile {
  UTF8 = "UTF8",
  Auto = "Auto",
  OSEncodingWithUTF8 = "OSEncodingWithUTF8",
}

export enum FileNamesEncodingInZipFileEnterprise {
  UTF8 = "UTF8",
  Авто = "Авто",
  КодировкаОСДополнительноUTF8 = "КодировкаОСДополнительноUTF8",
}

export enum ZIPCompressionLevel {
  Maximum = "Maximum",
  Minimum = "Minimum",
  Optimal = "Optimal",
}

export enum ZIPCompressionLevelEnterprise {
  Максимальный = "Максимальный",
  Минимальный = "Минимальный",
  Оптимальный = "Оптимальный",
}

export enum ZIPCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Copy",
  Deflate = "Deflate",
}

export enum ZIPCompressionMethodEnterprise {
  BZIP2 = "BZIP2",
  Копирование = "Копирование",
  Сжатие = "Сжатие",
}

export enum ZIPEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ZIPEncryptionMethodEnterprise {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export enum ZIPRestoreFilePathsMode {
  Restore = "Restore",
  DontRestore = "DontRestore",
}

export enum ZIPRestoreFilePathsModeEnterprise {
  Восстанавливать = "Восстанавливать",
  НеВосстанавливать = "НеВосстанавливать",
}

export enum ZIPStorePathMode {
  DontStorePath = "DontStorePath",
  StoreRelativePath = "StoreRelativePath",
  StoreFullPath = "StoreFullPath",
}

export enum ZIPStorePathModeEnterprise {
  НеСохранятьПути = "НеСохранятьПути",
  СохранятьОтносительныеПути = "СохранятьОтносительныеПути",
  СохранятьПолныеПути = "СохранятьПолныеПути",
}

export enum ZIPSubDirProcessingMode {
  DontProcess = "DontProcess",
  ProcessRecursively = "ProcessRecursively",
}

export enum ZIPSubDirProcessingModeEnterprise {
  НеОбрабатывать = "НеОбрабатывать",
  ОбрабатыватьРекурсивно = "ОбрабатыватьРекурсивно",
}

export enum StatePresentation {
  Visible = "Visible",
  AdditionalShowMode = "AdditionalShowMode",
  Picture = "Picture",
  Text = "Text",
}

export enum StatePresentationEnterprise {
  Видимость = "Видимость",
  ДополнительныйРежимОтображения = "ДополнительныйРежимОтображения",
  Картинка = "Картинка",
  Текст = "Текст",
}
