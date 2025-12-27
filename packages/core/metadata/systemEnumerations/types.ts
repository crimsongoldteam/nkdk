// #region SystemEnumerations

export const DynamicListSearchStringViewModeToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
  ShowOnUsingFullTextSearch: "ОтображатьПриИспользованииПолнотекстовогоПоиска",
} as const

export const DynamicListSearchStringViewModeFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
  ОтображатьПриИспользованииПолнотекстовогоПоиска: "ShowOnUsingFullTextSearch",
} as const

export type DynamicListSearchStringViewMode = keyof typeof DynamicListSearchStringViewModeToEnterprise
export type DynamicListSearchStringViewModeEnterprise = keyof typeof DynamicListSearchStringViewModeFromEnterprise

export const XDTOFacetTypeToEnterprise = {
  Length: "Длина",
  MaxInclusive: "МаксВключающее",
  MaxLength: "МаксДлина",
  MaxExclusive: "МаксИсключающее",
  MinInclusive: "МинВключающее",
  MinLength: "МинДлина",
  MinExclusive: "МинИсключающее",
  Pattern: "Образец",
  Enumeration: "Перечисление",
  Whitespace: "ПробельныеСимволы",
  TotalDigits: "РазрядовВсего",
  FractionDigits: "РазрядовДробнойЧасти",
} as const

export const XDTOFacetTypeFromEnterprise = {
  Длина: "Length",
  МаксВключающее: "MaxInclusive",
  МаксДлина: "MaxLength",
  МаксИсключающее: "MaxExclusive",
  МинВключающее: "MinInclusive",
  МинДлина: "MinLength",
  МинИсключающее: "MinExclusive",
  Образец: "Pattern",
  Перечисление: "Enumeration",
  ПробельныеСимволы: "Whitespace",
  РазрядовВсего: "TotalDigits",
  РазрядовДробнойЧасти: "FractionDigits",
} as const

export type XDTOFacetType = keyof typeof XDTOFacetTypeToEnterprise
export type XDTOFacetTypeEnterprise = keyof typeof XDTOFacetTypeFromEnterprise

export const XMLFormToEnterprise = {
  Attribute: "Атрибут",
  Text: "Текст",
  Element: "Элемент",
} as const

export const XMLFormFromEnterprise = {
  Атрибут: "Attribute",
  Текст: "Text",
  Элемент: "Element",
} as const

export type XMLForm = keyof typeof XMLFormToEnterprise
export type XMLFormEnterprise = keyof typeof XMLFormFromEnterprise

export const WSParameterDirectionToEnterprise = {
  In: "Входной",
  InOut: "ВходнойВыходной",
  Out: "Выходной",
} as const

export const WSParameterDirectionFromEnterprise = {
  Входной: "In",
  ВходнойВыходной: "InOut",
  Выходной: "Out",
} as const

export type WSParameterDirection = keyof typeof WSParameterDirectionToEnterprise
export type WSParameterDirectionEnterprise = keyof typeof WSParameterDirectionFromEnterprise

export const DOMBuilderActionToEnterprise = {
  InsertBefore: "ВставитьПеред",
  InsertAfter: "ВставитьПосле",
  AppendAsChildren: "ДобавитьКакДочерние",
  Replace: "Заменить",
  ReplaceChildren: "ЗаменитьДочерние",
} as const

export const DOMBuilderActionFromEnterprise = {
  ВставитьПеред: "InsertBefore",
  ВставитьПосле: "InsertAfter",
  ДобавитьКакДочерние: "AppendAsChildren",
  Заменить: "Replace",
  ЗаменитьДочерние: "ReplaceChildren",
} as const

export type DOMBuilderAction = keyof typeof DOMBuilderActionToEnterprise
export type DOMBuilderActionEnterprise = keyof typeof DOMBuilderActionFromEnterprise

export const DOMDocumentPositionToEnterprise = {
  ImplementationSpecific: "ЗависитОтРеализации",
  Disconnected: "Отсоединен",
  Preceding: "Предшествует",
  Following: "Следует",
  Contains: "Содержит",
  ContainedBy: "Содержится",
} as const

export const DOMDocumentPositionFromEnterprise = {
  ЗависитОтРеализации: "ImplementationSpecific",
  Отсоединен: "Disconnected",
  Предшествует: "Preceding",
  Следует: "Following",
  Содержит: "Contains",
  Содержится: "ContainedBy",
} as const

export type DOMDocumentPosition = keyof typeof DOMDocumentPositionToEnterprise
export type DOMDocumentPositionEnterprise = keyof typeof DOMDocumentPositionFromEnterprise

export const DOMNodeFilterParametersToEnterprise = {
  ShowAttribute: "ОтображатьАтрибут",
  ShowAll: "ОтображатьВсе",
  ShowDocument: "ОтображатьДокумент",
  ShowProcessingInstruction: "ОтображатьИнструкциюОбработки",
  ShowComment: "ОтображатьКомментарий",
  ShowNotation: "ОтображатьНотацию",
  ShowDocumentType: "ОтображатьОпределениеТипаДокумента",
  ShowCDATASection: "ОтображатьСекцииCDATA",
  ShowEntityReference: "ОтображатьСсылкуНаСущность",
  ShowEntity: "ОтображатьСущность",
  ShowText: "ОтображатьТекст",
  ShowDocumentFragment: "ОтображатьФрагментДокумента",
  ShowElement: "ОтображатьЭлемент",
} as const

export const DOMNodeFilterParametersFromEnterprise = {
  ОтображатьАтрибут: "ShowAttribute",
  ОтображатьВсе: "ShowAll",
  ОтображатьДокумент: "ShowDocument",
  ОтображатьИнструкциюОбработки: "ShowProcessingInstruction",
  ОтображатьКомментарий: "ShowComment",
  ОтображатьНотацию: "ShowNotation",
  ОтображатьОпределениеТипаДокумента: "ShowDocumentType",
  ОтображатьСекцииCDATA: "ShowCDATASection",
  ОтображатьСсылкуНаСущность: "ShowEntityReference",
  ОтображатьСущность: "ShowEntity",
  ОтображатьТекст: "ShowText",
  ОтображатьФрагментДокумента: "ShowDocumentFragment",
  ОтображатьЭлемент: "ShowElement",
} as const

export type DOMNodeFilterParameters = keyof typeof DOMNodeFilterParametersToEnterprise
export type DOMNodeFilterParametersEnterprise = keyof typeof DOMNodeFilterParametersFromEnterprise

export const DOMNodeTypeToEnterprise = {
  Attribute: "Атрибут",
  Document: "Документ",
  ProcessingInstruction: "ИнструкцияОбработки",
  Comment: "Комментарий",
  Notation: "Нотация",
  DocumentType: "ОпределениеТипаДокумента",
  XPathNamespace: "ПространствоИменXPath",
  CDATASection: "СекцияCDATA",
  EntityReference: "СсылкаНаСущность",
  Entity: "Сущность",
  Text: "Текст",
  DocumentFragment: "ФрагментДокумента",
  Element: "Элемент",
} as const

export const DOMNodeTypeFromEnterprise = {
  Атрибут: "Attribute",
  Документ: "Document",
  ИнструкцияОбработки: "ProcessingInstruction",
  Комментарий: "Comment",
  Нотация: "Notation",
  ОпределениеТипаДокумента: "DocumentType",
  ПространствоИменXPath: "XPathNamespace",
  СекцияCDATA: "CDATASection",
  СсылкаНаСущность: "EntityReference",
  Сущность: "Entity",
  Текст: "Text",
  ФрагментДокумента: "DocumentFragment",
  Элемент: "Element",
} as const

export type DOMNodeType = keyof typeof DOMNodeTypeToEnterprise
export type DOMNodeTypeEnterprise = keyof typeof DOMNodeTypeFromEnterprise

export const DOMXPathResultTypeToEnterprise = {
  Boolean: "Булево",
  Any: "Любой",
  AnyUnorderedNode: "ЛюбойНеупорядоченныйУзел",
  UnorderedNodeIterator: "НеупорядоченныйИтераторУзлов",
  UnorderedNodeSnapshot: "НеупорядоченныйСнимокУзлов",
  FirstOrderedNode: "ПервыйУпорядоченныйУзел",
  String: "Строка",
  OrderedNodeIterator: "УпорядоченныйИтераторУзлов",
  OrderedNodeSnapshot: "УпорядоченныйСнимокУзлов",
  Number: "Число",
} as const

export const DOMXPathResultTypeFromEnterprise = {
  Булево: "Boolean",
  Любой: "Any",
  ЛюбойНеупорядоченныйУзел: "AnyUnorderedNode",
  НеупорядоченныйИтераторУзлов: "UnorderedNodeIterator",
  НеупорядоченныйСнимокУзлов: "UnorderedNodeSnapshot",
  ПервыйУпорядоченныйУзел: "FirstOrderedNode",
  Строка: "String",
  УпорядоченныйИтераторУзлов: "OrderedNodeIterator",
  УпорядоченныйСнимокУзлов: "OrderedNodeSnapshot",
  Число: "Number",
} as const

export type DOMXPathResultType = keyof typeof DOMXPathResultTypeToEnterprise
export type DOMXPathResultTypeEnterprise = keyof typeof DOMXPathResultTypeFromEnterprise

export const HTMLContentCategoryToEnterprise = {
  AppletTags: "AppletТеги",
  AreaTags: "AreaТеги",
  EmbedTags: "EmbedТеги",
  FrameTags: "FrameТеги",
  IframeTags: "IframeТеги",
  ImportAttributes: "ImportАтрибуты",
  JavaScriptTags: "JavaScriptТеги",
  LinkTags: "LinkТеги",
  NoembedTags: "NoembedТеги",
  ObjectTags: "ObjectТеги",
  SourceTags: "SourceТеги",
  StyleTags: "StyleТеги",
  W3IncludeAttributes: "W3IncludeАтрибуты",
  All: "Все",
  EventsHandlers: "ОбработчикиСобытий",
} as const

export const HTMLContentCategoryFromEnterprise = {
  AppletТеги: "AppletTags",
  AreaТеги: "AreaTags",
  EmbedТеги: "EmbedTags",
  FrameТеги: "FrameTags",
  IframeТеги: "IframeTags",
  ImportАтрибуты: "ImportAttributes",
  JavaScriptТеги: "JavaScriptTags",
  LinkТеги: "LinkTags",
  NoembedТеги: "NoembedTags",
  ObjectТеги: "ObjectTags",
  SourceТеги: "SourceTags",
  StyleТеги: "StyleTags",
  W3IncludeАтрибуты: "W3IncludeAttributes",
  Все: "All",
  ОбработчикиСобытий: "EventsHandlers",
} as const

export type HTMLContentCategory = keyof typeof HTMLContentCategoryToEnterprise
export type HTMLContentCategoryEnterprise = keyof typeof HTMLContentCategoryFromEnterprise

export const DataCompositionAccountingBalanceTypeToEnterprise = {
  Debit: "Дебет",
  Credit: "Кредит",
  None: "Нет",
} as const

export const DataCompositionAccountingBalanceTypeFromEnterprise = {
  Дебет: "Debit",
  Кредит: "Credit",
  Нет: "None",
} as const

export type DataCompositionAccountingBalanceType = keyof typeof DataCompositionAccountingBalanceTypeToEnterprise
export type DataCompositionAccountingBalanceTypeEnterprise =
  keyof typeof DataCompositionAccountingBalanceTypeFromEnterprise

export const DataCompositionAreaTemplateTypeToEnterprise = {
  Header: "Заголовок",
  HierarchicalHeader: "ЗаголовокИерархии",
  OverallHeader: "ОбщийИтогЗаголовок",
  OverallFooter: "ОбщийИтогПодвал",
  Footer: "Подвал",
  HierarchicalFooter: "ПодвалИерархии",
} as const

export const DataCompositionAreaTemplateTypeFromEnterprise = {
  Заголовок: "Header",
  ЗаголовокИерархии: "HierarchicalHeader",
  ОбщийИтогЗаголовок: "OverallHeader",
  ОбщийИтогПодвал: "OverallFooter",
  Подвал: "Footer",
  ПодвалИерархии: "HierarchicalFooter",
} as const

export type DataCompositionAreaTemplateType = keyof typeof DataCompositionAreaTemplateTypeToEnterprise
export type DataCompositionAreaTemplateTypeEnterprise = keyof typeof DataCompositionAreaTemplateTypeFromEnterprise

export const DataCompositionAttributesPlacementToEnterprise = {
  Together: "Вместе",
  WithOwnerField: "ВместеСВладельцем",
  SpecialPosition: "ВСпециальнойПозиции",
  Separately: "Отдельно",
} as const

export const DataCompositionAttributesPlacementFromEnterprise = {
  Вместе: "Together",
  ВместеСВладельцем: "WithOwnerField",
  ВСпециальнойПозиции: "SpecialPosition",
  Отдельно: "Separately",
} as const

export type DataCompositionAttributesPlacement = keyof typeof DataCompositionAttributesPlacementToEnterprise
export type DataCompositionAttributesPlacementEnterprise = keyof typeof DataCompositionAttributesPlacementFromEnterprise

export const DataCompositionBalanceTypeToEnterprise = {
  ClosingBalance: "КонечныйОстаток",
  OpeningBalance: "НачальныйОстаток",
  None: "Нет",
} as const

export const DataCompositionBalanceTypeFromEnterprise = {
  КонечныйОстаток: "ClosingBalance",
  НачальныйОстаток: "OpeningBalance",
  Нет: "None",
} as const

export type DataCompositionBalanceType = keyof typeof DataCompositionBalanceTypeToEnterprise
export type DataCompositionBalanceTypeEnterprise = keyof typeof DataCompositionBalanceTypeFromEnterprise

export const DataCompositionChartLegendPlacementToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const DataCompositionChartLegendPlacementFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type DataCompositionChartLegendPlacement = keyof typeof DataCompositionChartLegendPlacementToEnterprise
export type DataCompositionChartLegendPlacementEnterprise =
  keyof typeof DataCompositionChartLegendPlacementFromEnterprise

export const DataCompositionComparisonTypeToEnterprise = {
  Greater: "Больше",
  GreaterOrEqual: "БольшеИлиРавно",
  InHierarchy: "ВИерархии",
  InList: "ВСписке",
  InListByHierarchy: "ВСпискеПоИерархии",
  Filled: "Заполнено",
  Less: "Меньше",
  LessOrEqual: "МеньшеИлиРавно",
  BeginsWith: "НачинаетсяС",
  NotInHierarchy: "НеВИерархии",
  NotInList: "НеВСписке",
  NotInListByHierarchy: "НеВСпискеПоИерархии",
  NotFilled: "НеЗаполнено",
  NotBeginsWith: "НеНачинаетсяС",
  NotLike: "НеПодобно",
  NotEqual: "НеРавно",
  NotContains: "НеСодержит",
  Like: "Подобно",
  Equal: "Равно",
  Contains: "Содержит",
} as const

export const DataCompositionComparisonTypeFromEnterprise = {
  Больше: "Greater",
  БольшеИлиРавно: "GreaterOrEqual",
  ВИерархии: "InHierarchy",
  ВСписке: "InList",
  ВСпискеПоИерархии: "InListByHierarchy",
  Заполнено: "Filled",
  Меньше: "Less",
  МеньшеИлиРавно: "LessOrEqual",
  НачинаетсяС: "BeginsWith",
  НеВИерархии: "NotInHierarchy",
  НеВСписке: "NotInList",
  НеВСпискеПоИерархии: "NotInListByHierarchy",
  НеЗаполнено: "NotFilled",
  НеНачинаетсяС: "NotBeginsWith",
  НеПодобно: "NotLike",
  НеРавно: "NotEqual",
  НеСодержит: "NotContains",
  Подобно: "Like",
  Равно: "Equal",
  Содержит: "Contains",
} as const

export type DataCompositionComparisonType = keyof typeof DataCompositionComparisonTypeToEnterprise
export type DataCompositionComparisonTypeEnterprise = keyof typeof DataCompositionComparisonTypeFromEnterprise

export const DataCompositionConditionalAppearanceUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DataCompositionConditionalAppearanceUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DataCompositionConditionalAppearanceUse = keyof typeof DataCompositionConditionalAppearanceUseToEnterprise
export type DataCompositionConditionalAppearanceUseEnterprise =
  keyof typeof DataCompositionConditionalAppearanceUseFromEnterprise

export const DataCompositionDataSetsLinkTypeToEnterprise = {
  Outer: "Внешняя",
  Inner: "Внутренняя",
} as const

export const DataCompositionDataSetsLinkTypeFromEnterprise = {
  Внешняя: "Outer",
  Внутренняя: "Inner",
} as const

export type DataCompositionDataSetsLinkType = keyof typeof DataCompositionDataSetsLinkTypeToEnterprise
export type DataCompositionDataSetsLinkTypeEnterprise = keyof typeof DataCompositionDataSetsLinkTypeFromEnterprise

export const DataCompositionDetailsProcessingActionToEnterprise = {
  None: "Нет",
  OpenValue: "ОткрытьЗначение",
  Filter: "Отфильтровать",
  ApplyAppearance: "Оформить",
  DrillDown: "Расшифровать",
  Group: "Сгруппировать",
  Order: "Упорядочить",
} as const

export const DataCompositionDetailsProcessingActionFromEnterprise = {
  Нет: "None",
  ОткрытьЗначение: "OpenValue",
  Отфильтровать: "Filter",
  Оформить: "ApplyAppearance",
  Расшифровать: "DrillDown",
  Сгруппировать: "Group",
  Упорядочить: "Order",
} as const

export type DataCompositionDetailsProcessingAction = keyof typeof DataCompositionDetailsProcessingActionToEnterprise
export type DataCompositionDetailsProcessingActionEnterprise =
  keyof typeof DataCompositionDetailsProcessingActionFromEnterprise

export const DataCompositionFieldPlacementToEnterprise = {
  Auto: "Авто",
  Vertically: "Вертикально",
  Together: "Вместе",
  Horizontally: "Горизонтально",
  SpecialColumn: "ОтдельнаяКолонка",
} as const

export const DataCompositionFieldPlacementFromEnterprise = {
  Авто: "Auto",
  Вертикально: "Vertically",
  Вместе: "Together",
  Горизонтально: "Horizontally",
  ОтдельнаяКолонка: "SpecialColumn",
} as const

export type DataCompositionFieldPlacement = keyof typeof DataCompositionFieldPlacementToEnterprise
export type DataCompositionFieldPlacementEnterprise = keyof typeof DataCompositionFieldPlacementFromEnterprise

export const DataCompositionFieldsTitleTypeToEnterprise = {
  Auto: "Авто",
  Short: "Краткий",
  Full: "Полный",
} as const

export const DataCompositionFieldsTitleTypeFromEnterprise = {
  Авто: "Auto",
  Краткий: "Short",
  Полный: "Full",
} as const

export type DataCompositionFieldsTitleType = keyof typeof DataCompositionFieldsTitleTypeToEnterprise
export type DataCompositionFieldsTitleTypeEnterprise = keyof typeof DataCompositionFieldsTitleTypeFromEnterprise

export const DataCompositionFilterApplicationTypeToEnterprise = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const DataCompositionFilterApplicationTypeFromEnterprise = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type DataCompositionFilterApplicationType = keyof typeof DataCompositionFilterApplicationTypeToEnterprise
export type DataCompositionFilterApplicationTypeEnterprise =
  keyof typeof DataCompositionFilterApplicationTypeFromEnterprise

export const DataCompositionFilterItemsGroupTypeToEnterprise = {
  AndGroup: "ГруппаИ",
  OrGroup: "ГруппаИли",
  NotGroup: "ГруппаНе",
} as const

export const DataCompositionFilterItemsGroupTypeFromEnterprise = {
  ГруппаИ: "AndGroup",
  ГруппаИли: "OrGroup",
  ГруппаНе: "NotGroup",
} as const

export type DataCompositionFilterItemsGroupType = keyof typeof DataCompositionFilterItemsGroupTypeToEnterprise
export type DataCompositionFilterItemsGroupTypeEnterprise =
  keyof typeof DataCompositionFilterItemsGroupTypeFromEnterprise

export const DataCompositionFixationToEnterprise = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const DataCompositionFixationFromEnterprise = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type DataCompositionFixation = keyof typeof DataCompositionFixationToEnterprise
export type DataCompositionFixationEnterprise = keyof typeof DataCompositionFixationFromEnterprise

export const DataCompositionGroupFieldsPlacementToEnterprise = {
  Together: "Вместе",
  Separately: "Отдельно",
  SeparatelyAndInTotalsOnly: "ОтдельноИТолькоВИтогах",
} as const

export const DataCompositionGroupFieldsPlacementFromEnterprise = {
  Вместе: "Together",
  Отдельно: "Separately",
  ОтдельноИТолькоВИтогах: "SeparatelyAndInTotalsOnly",
} as const

export type DataCompositionGroupFieldsPlacement = keyof typeof DataCompositionGroupFieldsPlacementToEnterprise
export type DataCompositionGroupFieldsPlacementEnterprise =
  keyof typeof DataCompositionGroupFieldsPlacementFromEnterprise

export const DataCompositionGroupPlacementToEnterprise = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
  None: "Нет",
} as const

export const DataCompositionGroupPlacementFromEnterprise = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
  Нет: "None",
} as const

export type DataCompositionGroupPlacement = keyof typeof DataCompositionGroupPlacementToEnterprise
export type DataCompositionGroupPlacementEnterprise = keyof typeof DataCompositionGroupPlacementFromEnterprise

export const DataCompositionGroupTemplateTypeToEnterprise = {
  Auto: "Авто",
  Vertical: "Вертикальный",
  Horizontal: "Горизонтальный",
} as const

export const DataCompositionGroupTemplateTypeFromEnterprise = {
  Авто: "Auto",
  Вертикальный: "Vertical",
  Горизонтальный: "Horizontal",
} as const

export type DataCompositionGroupTemplateType = keyof typeof DataCompositionGroupTemplateTypeToEnterprise
export type DataCompositionGroupTemplateTypeEnterprise = keyof typeof DataCompositionGroupTemplateTypeFromEnterprise

export const DataCompositionGroupTypeToEnterprise = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const DataCompositionGroupTypeFromEnterprise = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type DataCompositionGroupType = keyof typeof DataCompositionGroupTypeToEnterprise
export type DataCompositionGroupTypeEnterprise = keyof typeof DataCompositionGroupTypeFromEnterprise

export const DataCompositionGroupUseVariantToEnterprise = {
  Auto: "Авто",
  AdditionalInformation: "ДополнительнаяИнформация",
} as const

export const DataCompositionGroupUseVariantFromEnterprise = {
  Авто: "Auto",
  ДополнительнаяИнформация: "AdditionalInformation",
} as const

export type DataCompositionGroupUseVariant = keyof typeof DataCompositionGroupUseVariantToEnterprise
export type DataCompositionGroupUseVariantEnterprise = keyof typeof DataCompositionGroupUseVariantFromEnterprise

export const DataCompositionParameterUseToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const DataCompositionParameterUseFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type DataCompositionParameterUse = keyof typeof DataCompositionParameterUseToEnterprise
export type DataCompositionParameterUseEnterprise = keyof typeof DataCompositionParameterUseFromEnterprise

export const DataCompositionPeriodAdditionTypeToEnterprise = {
  None: "БезДополнения",
  Year: "Год",
  YearSinceBeginOfPeriod: "ГодОтНачалаПериода",
  YearSinceBeginOfPeriod445: "ГодОтНачалаПериода445",
  TenDays: "Декада",
  Day: "День",
  DaySinceBeginOfPeriod: "ДеньОтНачалаПериода",
  Quarter: "Квартал",
  QuarterSinceBeginOfPeriod: "КварталОтНачалаПериода",
  QuarterSinceBeginOfPeriod445: "КварталОтНачалаПериода445",
  Month: "Месяц",
  MonthSinceBeginOfPeriod: "МесяцОтНачалаПериода",
  MonthSinceBeginOfPeriod445: "МесяцОтНачалаПериода445",
  Minute: "Минута",
  MinuteSinceBeginOfPeriod: "МинутаОтНачалаПериода",
  Week: "Неделя",
  WeekSinceBeginOfPeriod: "НеделяОтНачалаПериода",
  HalfYear: "Полугодие",
  HalfYearSinceBeginOfPeriod: "ПолугодиеОтНачалаПериода",
  HalfYearSinceBeginOfPeriod445: "ПолугодиеОтНачалаПериода445",
  Second: "Секунда",
  Hour: "Час",
  HourSinceBeginOfPeriod: "ЧасОтНачалаПериода",
} as const

export const DataCompositionPeriodAdditionTypeFromEnterprise = {
  БезДополнения: "None",
  Год: "Year",
  ГодОтНачалаПериода: "YearSinceBeginOfPeriod",
  ГодОтНачалаПериода445: "YearSinceBeginOfPeriod445",
  Декада: "TenDays",
  День: "Day",
  ДеньОтНачалаПериода: "DaySinceBeginOfPeriod",
  Квартал: "Quarter",
  КварталОтНачалаПериода: "QuarterSinceBeginOfPeriod",
  КварталОтНачалаПериода445: "QuarterSinceBeginOfPeriod445",
  Месяц: "Month",
  МесяцОтНачалаПериода: "MonthSinceBeginOfPeriod",
  МесяцОтНачалаПериода445: "MonthSinceBeginOfPeriod445",
  Минута: "Minute",
  МинутаОтНачалаПериода: "MinuteSinceBeginOfPeriod",
  Неделя: "Week",
  НеделяОтНачалаПериода: "WeekSinceBeginOfPeriod",
  Полугодие: "HalfYear",
  ПолугодиеОтНачалаПериода: "HalfYearSinceBeginOfPeriod",
  ПолугодиеОтНачалаПериода445: "HalfYearSinceBeginOfPeriod445",
  Секунда: "Second",
  Час: "Hour",
  ЧасОтНачалаПериода: "HourSinceBeginOfPeriod",
} as const

export type DataCompositionPeriodAdditionType = keyof typeof DataCompositionPeriodAdditionTypeToEnterprise
export type DataCompositionPeriodAdditionTypeEnterprise = keyof typeof DataCompositionPeriodAdditionTypeFromEnterprise

export const DataCompositionPeriodTypeToEnterprise = {
  Additional: "Дополнительный",
  Main: "Основной",
} as const

export const DataCompositionPeriodTypeFromEnterprise = {
  Дополнительный: "Additional",
  Основной: "Main",
} as const

export type DataCompositionPeriodType = keyof typeof DataCompositionPeriodTypeToEnterprise
export type DataCompositionPeriodTypeEnterprise = keyof typeof DataCompositionPeriodTypeFromEnterprise

export const DataCompositionPictureOutputTypeToEnterprise = {
  Auto: "Авто",
  OutputByValue: "ВыводитьПоЗначению",
  OutputByRef: "ВыводитьПоСсылке",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionPictureOutputTypeFromEnterprise = {
  Авто: "Auto",
  ВыводитьПоЗначению: "OutputByValue",
  ВыводитьПоСсылке: "OutputByRef",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionPictureOutputType = keyof typeof DataCompositionPictureOutputTypeToEnterprise
export type DataCompositionPictureOutputTypeEnterprise = keyof typeof DataCompositionPictureOutputTypeFromEnterprise

export const DataCompositionResourcesAutoPositionToEnterprise = {
  DontUse: "НеИспользовать",
  AfterAllFields: "ПослеВсехПолей",
} as const

export const DataCompositionResourcesAutoPositionFromEnterprise = {
  НеИспользовать: "DontUse",
  ПослеВсехПолей: "AfterAllFields",
} as const

export type DataCompositionResourcesAutoPosition = keyof typeof DataCompositionResourcesAutoPositionToEnterprise
export type DataCompositionResourcesAutoPositionEnterprise =
  keyof typeof DataCompositionResourcesAutoPositionFromEnterprise

export const DataCompositionResourcesPlacementToEnterprise = {
  Vertically: "Вертикально",
  Horizontally: "Горизонтально",
} as const

export const DataCompositionResourcesPlacementFromEnterprise = {
  Вертикально: "Vertically",
  Горизонтально: "Horizontally",
} as const

export type DataCompositionResourcesPlacement = keyof typeof DataCompositionResourcesPlacementToEnterprise
export type DataCompositionResourcesPlacementEnterprise = keyof typeof DataCompositionResourcesPlacementFromEnterprise

export const DataCompositionResourcesPlacementInChartToEnterprise = {
  Auto: "Авто",
  Series: "Серии",
  Points: "Точки",
} as const

export const DataCompositionResourcesPlacementInChartFromEnterprise = {
  Авто: "Auto",
  Серии: "Series",
  Точки: "Points",
} as const

export type DataCompositionResourcesPlacementInChart = keyof typeof DataCompositionResourcesPlacementInChartToEnterprise
export type DataCompositionResourcesPlacementInChartEnterprise =
  keyof typeof DataCompositionResourcesPlacementInChartFromEnterprise

export const DataCompositionResultItemTypeToEnterprise = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
} as const

export const DataCompositionResultItemTypeFromEnterprise = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
} as const

export type DataCompositionResultItemType = keyof typeof DataCompositionResultItemTypeToEnterprise
export type DataCompositionResultItemTypeEnterprise = keyof typeof DataCompositionResultItemTypeFromEnterprise

export const DataCompositionResultNestedItemsLayoutToEnterprise = {
  Vertically: "Вертикально",
  Horizontally: "Горизонтально",
} as const

export const DataCompositionResultNestedItemsLayoutFromEnterprise = {
  Вертикально: "Vertically",
  Горизонтально: "Horizontally",
} as const

export type DataCompositionResultNestedItemsLayout = keyof typeof DataCompositionResultNestedItemsLayoutToEnterprise
export type DataCompositionResultNestedItemsLayoutEnterprise =
  keyof typeof DataCompositionResultNestedItemsLayoutFromEnterprise

export const DataCompositionSettingsItemStateToEnterprise = {
  Enabled: "Включен",
  Disabled: "Отключен",
  DeletedByUser: "УдаленПользователем",
} as const

export const DataCompositionSettingsItemStateFromEnterprise = {
  Включен: "Enabled",
  Отключен: "Disabled",
  УдаленПользователем: "DeletedByUser",
} as const

export type DataCompositionSettingsItemState = keyof typeof DataCompositionSettingsItemStateToEnterprise
export type DataCompositionSettingsItemStateEnterprise = keyof typeof DataCompositionSettingsItemStateFromEnterprise

export const DataCompositionSettingsItemViewModeToEnterprise = {
  Auto: "Авто",
  QuickAccess: "БыстрыйДоступ",
  Inaccessible: "Недоступный",
  Normal: "Обычный",
} as const

export const DataCompositionSettingsItemViewModeFromEnterprise = {
  Авто: "Auto",
  БыстрыйДоступ: "QuickAccess",
  Недоступный: "Inaccessible",
  Обычный: "Normal",
} as const

export type DataCompositionSettingsItemViewMode = keyof typeof DataCompositionSettingsItemViewModeToEnterprise
export type DataCompositionSettingsItemViewModeEnterprise =
  keyof typeof DataCompositionSettingsItemViewModeFromEnterprise

export const DataCompositionSettingsRefreshMethodToEnterprise = {
  Full: "Полное",
  CheckAvailability: "ПроверятьДоступность",
} as const

export const DataCompositionSettingsRefreshMethodFromEnterprise = {
  Полное: "Full",
  ПроверятьДоступность: "CheckAvailability",
} as const

export type DataCompositionSettingsRefreshMethod = keyof typeof DataCompositionSettingsRefreshMethodToEnterprise
export type DataCompositionSettingsRefreshMethodEnterprise =
  keyof typeof DataCompositionSettingsRefreshMethodFromEnterprise

export const DataCompositionSettingsViewModeToEnterprise = {
  QuickAccess: "БыстрыйДоступ",
  All: "Все",
} as const

export const DataCompositionSettingsViewModeFromEnterprise = {
  БыстрыйДоступ: "QuickAccess",
  Все: "All",
} as const

export type DataCompositionSettingsViewMode = keyof typeof DataCompositionSettingsViewModeToEnterprise
export type DataCompositionSettingsViewModeEnterprise = keyof typeof DataCompositionSettingsViewModeFromEnterprise

export const DataCompositionSortDirectionToEnterprise = {
  Asc: "Возр",
  Desc: "Убыв",
} as const

export const DataCompositionSortDirectionFromEnterprise = {
  Возр: "Asc",
  Убыв: "Desc",
} as const

export type DataCompositionSortDirection = keyof typeof DataCompositionSortDirectionToEnterprise
export type DataCompositionSortDirectionEnterprise = keyof typeof DataCompositionSortDirectionFromEnterprise

export const DataCompositionTextOutputTypeToEnterprise = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionTextOutputTypeFromEnterprise = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionTextOutputType = keyof typeof DataCompositionTextOutputTypeToEnterprise
export type DataCompositionTextOutputTypeEnterprise = keyof typeof DataCompositionTextOutputTypeFromEnterprise

export const DataCompositionTextPlacementTypeToEnterprise = {
  Overflow: "Выступать",
  Block: "Забивать",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const DataCompositionTextPlacementTypeFromEnterprise = {
  Выступать: "Overflow",
  Забивать: "Block",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type DataCompositionTextPlacementType = keyof typeof DataCompositionTextPlacementTypeToEnterprise
export type DataCompositionTextPlacementTypeEnterprise = keyof typeof DataCompositionTextPlacementTypeFromEnterprise

export const DataCompositionTotalPlacementToEnterprise = {
  Auto: "Авто",
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
  None: "Нет",
} as const

export const DataCompositionTotalPlacementFromEnterprise = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
  Нет: "None",
} as const

export type DataCompositionTotalPlacement = keyof typeof DataCompositionTotalPlacementToEnterprise
export type DataCompositionTotalPlacementEnterprise = keyof typeof DataCompositionTotalPlacementFromEnterprise

export const OnUnavailabilityDataCompositionSettingsActionToEnterprise = {
  DisableControl: "ИзменятьДоступностьПоля",
  HidePage: "СкрыватьСтраницу",
} as const

export const OnUnavailabilityDataCompositionSettingsActionFromEnterprise = {
  ИзменятьДоступностьПоля: "DisableControl",
  СкрыватьСтраницу: "HidePage",
} as const

export type OnUnavailabilityDataCompositionSettingsAction =
  keyof typeof OnUnavailabilityDataCompositionSettingsActionToEnterprise
export type OnUnavailabilityDataCompositionSettingsActionEnterprise =
  keyof typeof OnUnavailabilityDataCompositionSettingsActionFromEnterprise

export const ResultCompositionModeToEnterprise = {
  Auto: "Авто",
  Directly: "Непосредственно",
  Background: "Фоновый",
} as const

export const ResultCompositionModeFromEnterprise = {
  Авто: "Auto",
  Непосредственно: "Directly",
  Фоновый: "Background",
} as const

export type ResultCompositionMode = keyof typeof ResultCompositionModeToEnterprise
export type ResultCompositionModeEnterprise = keyof typeof ResultCompositionModeFromEnterprise

export const SaveDataCompositionAppearanceToEnterprise = {
  Auto: "Авто",
  ForUser: "ДляПользователя",
  ForCurrentResult: "ДляТекущегоРезультата",
  DontUse: "НеИспользовать",
  ByKeyForUser: "ПоКлючуДляПользователя",
} as const

export const SaveDataCompositionAppearanceFromEnterprise = {
  Авто: "Auto",
  ДляПользователя: "ForUser",
  ДляТекущегоРезультата: "ForCurrentResult",
  НеИспользовать: "DontUse",
  ПоКлючуДляПользователя: "ByKeyForUser",
} as const

export type SaveDataCompositionAppearance = keyof typeof SaveDataCompositionAppearanceToEnterprise
export type SaveDataCompositionAppearanceEnterprise = keyof typeof SaveDataCompositionAppearanceFromEnterprise

export const XSAttributeUseCategoryToEnterprise = {
  Prohibited: "Запрещено",
  Optional: "Необязательно",
  Required: "Обязательно",
} as const

export const XSAttributeUseCategoryFromEnterprise = {
  Запрещено: "Prohibited",
  Необязательно: "Optional",
  Обязательно: "Required",
} as const

export type XSAttributeUseCategory = keyof typeof XSAttributeUseCategoryToEnterprise
export type XSAttributeUseCategoryEnterprise = keyof typeof XSAttributeUseCategoryFromEnterprise

export const XSComplexFinalToEnterprise = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSComplexFinalFromEnterprise = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSComplexFinal = keyof typeof XSComplexFinalToEnterprise
export type XSComplexFinalEnterprise = keyof typeof XSComplexFinalFromEnterprise

export const XSComponentTypeToEnterprise = {
  Annotation: "Аннотация",
  Include: "Включение",
  ModelGroup: "ГруппаМодели",
  Documentation: "Документация",
  Import: "Импорт",
  AppInfo: "ИнформацияПриложения",
  AttributeUse: "ИспользованиеАтрибута",
  MaxInclusiveFacet: "МаксимальноВключающийФасет",
  MaxExclusiveFacet: "МаксимальноИсключающийФасет",
  Wildcard: "Маска",
  MinInclusiveFacet: "МинимальноВключающийФасет",
  MinExclusiveFacet: "МинимальноИсключающийФасет",
  AttributeDeclaration: "ОбъявлениеАтрибута",
  NotationDeclaration: "ОбъявлениеНотации",
  ElementDeclaration: "ОбъявлениеЭлемента",
  XPathDefinition: "ОпределениеXPath",
  AttributeGroupDefinition: "ОпределениеГруппыАтрибутов",
  ModelGroupDefinition: "ОпределениеГруппыМодели",
  IdentityConstraintDefinition: "ОпределениеОграниченияИдентичности",
  SimpleTypeDefinition: "ОпределениеПростогоТипа",
  ComplexTypeDefinition: "ОпределениеСоставногоТипа",
  Redefine: "Переопределение",
  Schema: "Схема",
  LengthFacet: "ФасетДлины",
  FractionDigitsFacet: "ФасетКоличестваРазрядовДробнойЧасти",
  MaxLengthFacet: "ФасетМаксимальнойДлины",
  MinLengthFacet: "ФасетМинимальнойДлины",
  PatternFacet: "ФасетОбразца",
  TotalDigitsFacet: "ФасетОбщегоКоличестваРазрядов",
  EnumerationFacet: "ФасетПеречисления",
  WhitespaceFacet: "ФасетПробельныхСимволов",
  Particle: "Фрагмент",
} as const

export const XSComponentTypeFromEnterprise = {
  Аннотация: "Annotation",
  Включение: "Include",
  ГруппаМодели: "ModelGroup",
  Документация: "Documentation",
  Импорт: "Import",
  ИнформацияПриложения: "AppInfo",
  ИспользованиеАтрибута: "AttributeUse",
  МаксимальноВключающийФасет: "MaxInclusiveFacet",
  МаксимальноИсключающийФасет: "MaxExclusiveFacet",
  Маска: "Wildcard",
  МинимальноВключающийФасет: "MinInclusiveFacet",
  МинимальноИсключающийФасет: "MinExclusiveFacet",
  ОбъявлениеАтрибута: "AttributeDeclaration",
  ОбъявлениеНотации: "NotationDeclaration",
  ОбъявлениеЭлемента: "ElementDeclaration",
  ОпределениеXPath: "XPathDefinition",
  ОпределениеГруппыАтрибутов: "AttributeGroupDefinition",
  ОпределениеГруппыМодели: "ModelGroupDefinition",
  ОпределениеОграниченияИдентичности: "IdentityConstraintDefinition",
  ОпределениеПростогоТипа: "SimpleTypeDefinition",
  ОпределениеСоставногоТипа: "ComplexTypeDefinition",
  Переопределение: "Redefine",
  Схема: "Schema",
  ФасетДлины: "LengthFacet",
  ФасетКоличестваРазрядовДробнойЧасти: "FractionDigitsFacet",
  ФасетМаксимальнойДлины: "MaxLengthFacet",
  ФасетМинимальнойДлины: "MinLengthFacet",
  ФасетОбразца: "PatternFacet",
  ФасетОбщегоКоличестваРазрядов: "TotalDigitsFacet",
  ФасетПеречисления: "EnumerationFacet",
  ФасетПробельныхСимволов: "WhitespaceFacet",
  Фрагмент: "Particle",
} as const

export type XSComponentType = keyof typeof XSComponentTypeToEnterprise
export type XSComponentTypeEnterprise = keyof typeof XSComponentTypeFromEnterprise

export const XSCompositorToEnterprise = {
  All: "Все",
  Choice: "Выбор",
  Sequence: "Последовательность",
} as const

export const XSCompositorFromEnterprise = {
  Все: "All",
  Выбор: "Choice",
  Последовательность: "Sequence",
} as const

export type XSCompositor = keyof typeof XSCompositorToEnterprise
export type XSCompositorEnterprise = keyof typeof XSCompositorFromEnterprise

export const XSConstraintToEnterprise = {
  Default: "ПоУмолчанию",
  Fixed: "Фиксированное",
} as const

export const XSConstraintFromEnterprise = {
  ПоУмолчанию: "Default",
  Фиксированное: "Fixed",
} as const

export type XSConstraint = keyof typeof XSConstraintToEnterprise
export type XSConstraintEnterprise = keyof typeof XSConstraintFromEnterprise

export const XSContentModelToEnterprise = {
  Simple: "Простая",
  Complex: "Составная",
} as const

export const XSContentModelFromEnterprise = {
  Простая: "Simple",
  Составная: "Complex",
} as const

export type XSContentModel = keyof typeof XSContentModelToEnterprise
export type XSContentModelEnterprise = keyof typeof XSContentModelFromEnterprise

export const XSDerivationMethodToEnterprise = {
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSDerivationMethodFromEnterprise = {
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSDerivationMethod = keyof typeof XSDerivationMethodToEnterprise
export type XSDerivationMethodEnterprise = keyof typeof XSDerivationMethodFromEnterprise

export const XSDisallowedSubstitutionsToEnterprise = {
  All: "Все",
  Restriction: "Ограничение",
  Substitution: "Подстановка",
  Extension: "Расширение",
} as const

export const XSDisallowedSubstitutionsFromEnterprise = {
  Все: "All",
  Ограничение: "Restriction",
  Подстановка: "Substitution",
  Расширение: "Extension",
} as const

export type XSDisallowedSubstitutions = keyof typeof XSDisallowedSubstitutionsToEnterprise
export type XSDisallowedSubstitutionsEnterprise = keyof typeof XSDisallowedSubstitutionsFromEnterprise

export const XSFormToEnterprise = {
  Qualified: "Квалифицированная",
  Unqualified: "Неквалифицированная",
} as const

export const XSFormFromEnterprise = {
  Квалифицированная: "Qualified",
  Неквалифицированная: "Unqualified",
} as const

export type XSForm = keyof typeof XSFormToEnterprise
export type XSFormEnterprise = keyof typeof XSFormFromEnterprise

export const XSIdentityConstraintCategoryToEnterprise = {
  Key: "Ключ",
  KeyRef: "СсылкаНаКлюч",
  Unique: "Уникальность",
} as const

export const XSIdentityConstraintCategoryFromEnterprise = {
  Ключ: "Key",
  СсылкаНаКлюч: "KeyRef",
  Уникальность: "Unique",
} as const

export type XSIdentityConstraintCategory = keyof typeof XSIdentityConstraintCategoryToEnterprise
export type XSIdentityConstraintCategoryEnterprise = keyof typeof XSIdentityConstraintCategoryFromEnterprise

export const XSNamespaceConstraintCategoryToEnterprise = {
  Not: "Кроме",
  Any: "Любое",
  Set: "Набор",
} as const

export const XSNamespaceConstraintCategoryFromEnterprise = {
  Кроме: "Not",
  Любое: "Any",
  Набор: "Set",
} as const

export type XSNamespaceConstraintCategory = keyof typeof XSNamespaceConstraintCategoryToEnterprise
export type XSNamespaceConstraintCategoryEnterprise = keyof typeof XSNamespaceConstraintCategoryFromEnterprise

export const XSProcessContentsToEnterprise = {
  Skip: "Пропустить",
  Lax: "Слабая",
  Strict: "Строгая",
} as const

export const XSProcessContentsFromEnterprise = {
  Пропустить: "Skip",
  Слабая: "Lax",
  Строгая: "Strict",
} as const

export type XSProcessContents = keyof typeof XSProcessContentsToEnterprise
export type XSProcessContentsEnterprise = keyof typeof XSProcessContentsFromEnterprise

export const XSProhibitedSubstitutionsToEnterprise = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSProhibitedSubstitutionsFromEnterprise = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSProhibitedSubstitutions = keyof typeof XSProhibitedSubstitutionsToEnterprise
export type XSProhibitedSubstitutionsEnterprise = keyof typeof XSProhibitedSubstitutionsFromEnterprise

export const XSSchemaFinalToEnterprise = {
  All: "Все",
  Union: "Объединение",
  Restriction: "Ограничение",
  Extension: "Расширение",
  List: "Список",
} as const

export const XSSchemaFinalFromEnterprise = {
  Все: "All",
  Объединение: "Union",
  Ограничение: "Restriction",
  Расширение: "Extension",
  Список: "List",
} as const

export type XSSchemaFinal = keyof typeof XSSchemaFinalToEnterprise
export type XSSchemaFinalEnterprise = keyof typeof XSSchemaFinalFromEnterprise

export const XSSimpleFinalToEnterprise = {
  All: "Все",
  Union: "Объединение",
  Restriction: "Ограничение",
  List: "Список",
} as const

export const XSSimpleFinalFromEnterprise = {
  Все: "All",
  Объединение: "Union",
  Ограничение: "Restriction",
  Список: "List",
} as const

export type XSSimpleFinal = keyof typeof XSSimpleFinalToEnterprise
export type XSSimpleFinalEnterprise = keyof typeof XSSimpleFinalFromEnterprise

export const XSSimpleTypeVarietyToEnterprise = {
  Atomic: "Атомарная",
  Union: "Объединение",
  List: "Список",
} as const

export const XSSimpleTypeVarietyFromEnterprise = {
  Атомарная: "Atomic",
  Объединение: "Union",
  Список: "List",
} as const

export type XSSimpleTypeVariety = keyof typeof XSSimpleTypeVarietyToEnterprise
export type XSSimpleTypeVarietyEnterprise = keyof typeof XSSimpleTypeVarietyFromEnterprise

export const XSSubstitutionGroupExclusionsToEnterprise = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSSubstitutionGroupExclusionsFromEnterprise = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSSubstitutionGroupExclusions = keyof typeof XSSubstitutionGroupExclusionsToEnterprise
export type XSSubstitutionGroupExclusionsEnterprise = keyof typeof XSSubstitutionGroupExclusionsFromEnterprise

export const XSWhitespaceHandlingToEnterprise = {
  Replace: "Заменять",
  Collapse: "Сворачивать",
  Preserve: "Сохранять",
} as const

export const XSWhitespaceHandlingFromEnterprise = {
  Заменять: "Replace",
  Сворачивать: "Collapse",
  Сохранять: "Preserve",
} as const

export type XSWhitespaceHandling = keyof typeof XSWhitespaceHandlingToEnterprise
export type XSWhitespaceHandlingEnterprise = keyof typeof XSWhitespaceHandlingFromEnterprise

export const XSXPathVarietyToEnterprise = {
  Field: "Поле",
  Selector: "Селектор",
} as const

export const XSXPathVarietyFromEnterprise = {
  Поле: "Field",
  Селектор: "Selector",
} as const

export type XSXPathVariety = keyof typeof XSXPathVarietyToEnterprise
export type XSXPathVarietyEnterprise = keyof typeof XSXPathVarietyFromEnterprise

export const EventLogDataStorageSplitPeriodToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Week: "Неделя",
  DontUse: "НеИспользовать",
  Hour: "Час",
} as const

export const EventLogDataStorageSplitPeriodFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Неделя: "Week",
  НеИспользовать: "DontUse",
  Час: "Hour",
} as const

export type EventLogDataStorageSplitPeriod = keyof typeof EventLogDataStorageSplitPeriodToEnterprise
export type EventLogDataStorageSplitPeriodEnterprise = keyof typeof EventLogDataStorageSplitPeriodFromEnterprise

export const EventLogEntryTransactionModeToEnterprise = {
  Independent: "Независимая",
  Transactional: "Транзакционная",
} as const

export const EventLogEntryTransactionModeFromEnterprise = {
  Независимая: "Independent",
  Транзакционная: "Transactional",
} as const

export type EventLogEntryTransactionMode = keyof typeof EventLogEntryTransactionModeToEnterprise
export type EventLogEntryTransactionModeEnterprise = keyof typeof EventLogEntryTransactionModeFromEnterprise

export const EventLogEntryTransactionStatusToEnterprise = {
  Committed: "Зафиксирована",
  Unfinished: "НеЗавершена",
  NotApplicable: "НетТранзакции",
  RolledBack: "Отменена",
} as const

export const EventLogEntryTransactionStatusFromEnterprise = {
  Зафиксирована: "Committed",
  НеЗавершена: "Unfinished",
  НетТранзакции: "NotApplicable",
  Отменена: "RolledBack",
} as const

export type EventLogEntryTransactionStatus = keyof typeof EventLogEntryTransactionStatusToEnterprise
export type EventLogEntryTransactionStatusEnterprise = keyof typeof EventLogEntryTransactionStatusFromEnterprise

export const EventLogLevelToEnterprise = {
  Information: "Информация",
  Error: "Ошибка",
  Warning: "Предупреждение",
  Note: "Примечание",
} as const

export const EventLogLevelFromEnterprise = {
  Информация: "Information",
  Ошибка: "Error",
  Предупреждение: "Warning",
  Примечание: "Note",
} as const

export type EventLogLevel = keyof typeof EventLogLevelToEnterprise
export type EventLogLevelEnterprise = keyof typeof EventLogLevelFromEnterprise

export const DataLockControlModeToEnterprise = {
  Automatic: "Автоматический",
  Managed: "Управляемый",
} as const

export const DataLockControlModeFromEnterprise = {
  Автоматический: "Automatic",
  Управляемый: "Managed",
} as const

export type DataLockControlMode = keyof typeof DataLockControlModeToEnterprise
export type DataLockControlModeEnterprise = keyof typeof DataLockControlModeFromEnterprise

export const DataLockModeToEnterprise = {
  Exclusive: "Исключительный",
  Shared: "Разделяемый",
} as const

export const DataLockModeFromEnterprise = {
  Исключительный: "Exclusive",
  Разделяемый: "Shared",
} as const

export type DataLockMode = keyof typeof DataLockModeToEnterprise
export type DataLockModeEnterprise = keyof typeof DataLockModeFromEnterprise

export const AccountTypeToEnterprise = {
  ActivePassive: "АктивноПассивный",
  Active: "Активный",
  Passive: "Пассивный",
} as const

export const AccountTypeFromEnterprise = {
  АктивноПассивный: "ActivePassive",
  Активный: "Active",
  Пассивный: "Passive",
} as const

export type AccountType = keyof typeof AccountTypeToEnterprise
export type AccountTypeEnterprise = keyof typeof AccountTypeFromEnterprise

export const AccountingRecordTypeToEnterprise = {
  Debit: "Дебет",
  Credit: "Кредит",
} as const

export const AccountingRecordTypeFromEnterprise = {
  Дебет: "Debit",
  Кредит: "Credit",
} as const

export type AccountingRecordType = keyof typeof AccountingRecordTypeToEnterprise
export type AccountingRecordTypeEnterprise = keyof typeof AccountingRecordTypeFromEnterprise

export const AccumulationRecordTypeToEnterprise = {
  Receipt: "Приход",
  Expense: "Расход",
} as const

export const AccumulationRecordTypeFromEnterprise = {
  Приход: "Receipt",
  Расход: "Expense",
} as const

export type AccumulationRecordType = keyof typeof AccumulationRecordTypeToEnterprise
export type AccumulationRecordTypeEnterprise = keyof typeof AccumulationRecordTypeFromEnterprise

export const AccumulationRegisterAggregatePeriodicityToEnterprise = {
  Auto: "Авто",
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
  HalfYear: "Полугодие",
} as const

export const AccumulationRegisterAggregatePeriodicityFromEnterprise = {
  Авто: "Auto",
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
  Полугодие: "HalfYear",
} as const

export type AccumulationRegisterAggregatePeriodicity = keyof typeof AccumulationRegisterAggregatePeriodicityToEnterprise
export type AccumulationRegisterAggregatePeriodicityEnterprise =
  keyof typeof AccumulationRegisterAggregatePeriodicityFromEnterprise

export const AccumulationRegisterAggregateUseToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const AccumulationRegisterAggregateUseFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type AccumulationRegisterAggregateUse = keyof typeof AccumulationRegisterAggregateUseToEnterprise
export type AccumulationRegisterAggregateUseEnterprise = keyof typeof AccumulationRegisterAggregateUseFromEnterprise

export const AutoTimeModeToEnterprise = {
  DontUse: "НеИспользовать",
  First: "Первым",
  Last: "Последним",
  CurrentOrFirst: "ТекущееИлиПервым",
  CurrentOrLast: "ТекущееИлиПоследним",
} as const

export const AutoTimeModeFromEnterprise = {
  НеИспользовать: "DontUse",
  Первым: "First",
  Последним: "Last",
  ТекущееИлиПервым: "CurrentOrFirst",
  ТекущееИлиПоследним: "CurrentOrLast",
} as const

export type AutoTimeMode = keyof typeof AutoTimeModeToEnterprise
export type AutoTimeModeEnterprise = keyof typeof AutoTimeModeFromEnterprise

export const BusinessProcessRoutePointTypeToEnterprise = {
  SubBusinessProcess: "ВложенныйБизнесПроцесс",
  Switch: "ВыборВарианта",
  Activity: "Действие",
  End: "Завершение",
  Processing: "Обработка",
  Split: "Разделение",
  Join: "Слияние",
  Start: "Старт",
  Condition: "Условие",
} as const

export const BusinessProcessRoutePointTypeFromEnterprise = {
  ВложенныйБизнесПроцесс: "SubBusinessProcess",
  ВыборВарианта: "Switch",
  Действие: "Activity",
  Завершение: "End",
  Обработка: "Processing",
  Разделение: "Split",
  Слияние: "Join",
  Старт: "Start",
  Условие: "Condition",
} as const

export type BusinessProcessRoutePointType = keyof typeof BusinessProcessRoutePointTypeToEnterprise
export type BusinessProcessRoutePointTypeEnterprise = keyof typeof BusinessProcessRoutePointTypeFromEnterprise

export const CalculationRegisterPeriodTypeToEnterprise = {
  BasePeriod: "БазовыйПериод",
  ActionPeriod: "ПериодДействия",
  RegistrationPeriod: "ПериодРегистрации",
  ActualActionPeriod: "ФактическийПериодДействия",
} as const

export const CalculationRegisterPeriodTypeFromEnterprise = {
  БазовыйПериод: "BasePeriod",
  ПериодДействия: "ActionPeriod",
  ПериодРегистрации: "RegistrationPeriod",
  ФактическийПериодДействия: "ActualActionPeriod",
} as const

export type CalculationRegisterPeriodType = keyof typeof CalculationRegisterPeriodTypeToEnterprise
export type CalculationRegisterPeriodTypeEnterprise = keyof typeof CalculationRegisterPeriodTypeFromEnterprise

export const DocumentPostingModeToEnterprise = {
  Regular: "Неоперативный",
  RealTime: "Оперативный",
} as const

export const DocumentPostingModeFromEnterprise = {
  Неоперативный: "Regular",
  Оперативный: "RealTime",
} as const

export type DocumentPostingMode = keyof typeof DocumentPostingModeToEnterprise
export type DocumentPostingModeEnterprise = keyof typeof DocumentPostingModeFromEnterprise

export const DocumentWriteModeToEnterprise = {
  Write: "Запись",
  UndoPosting: "ОтменаПроведения",
  Posting: "Проведение",
} as const

export const DocumentWriteModeFromEnterprise = {
  Запись: "Write",
  ОтменаПроведения: "UndoPosting",
  Проведение: "Posting",
} as const

export type DocumentWriteMode = keyof typeof DocumentWriteModeToEnterprise
export type DocumentWriteModeEnterprise = keyof typeof DocumentWriteModeFromEnterprise

export const FoldersAndItemsUseToEnterprise = {
  Folders: "Группы",
  FoldersAndItems: "ГруппыИЭлементы",
  Items: "Элементы",
} as const

export const FoldersAndItemsUseFromEnterprise = {
  Группы: "Folders",
  ГруппыИЭлементы: "FoldersAndItems",
  Элементы: "Items",
} as const

export type FoldersAndItemsUse = keyof typeof FoldersAndItemsUseToEnterprise
export type FoldersAndItemsUseEnterprise = keyof typeof FoldersAndItemsUseFromEnterprise

export const PostingModeUseToEnterprise = {
  Auto: "Авто",
  Regular: "Неоперативный",
  RealTime: "Оперативный",
} as const

export const PostingModeUseFromEnterprise = {
  Авто: "Auto",
  Неоперативный: "Regular",
  Оперативный: "RealTime",
} as const

export type PostingModeUse = keyof typeof PostingModeUseToEnterprise
export type PostingModeUseEnterprise = keyof typeof PostingModeUseFromEnterprise

export const SliceUseToEnterprise = {
  DontUse: "НеИспользовать",
  First: "Первые",
  Last: "Последние",
} as const

export const SliceUseFromEnterprise = {
  НеИспользовать: "DontUse",
  Первые: "First",
  Последние: "Last",
} as const

export type SliceUse = keyof typeof SliceUseToEnterprise
export type SliceUseEnterprise = keyof typeof SliceUseFromEnterprise

export const BackgroundJobStateToEnterprise = {
  Active: "Активно",
  Completed: "Завершено",
  Failed: "ЗавершеноАварийно",
  Canceled: "Отменено",
} as const

export const BackgroundJobStateFromEnterprise = {
  Активно: "Active",
  Завершено: "Completed",
  ЗавершеноАварийно: "Failed",
  Отменено: "Canceled",
} as const

export type BackgroundJobState = keyof typeof BackgroundJobStateToEnterprise
export type BackgroundJobStateEnterprise = keyof typeof BackgroundJobStateFromEnterprise

export const CryptoCertificateCheckModeToEnterprise = {
  IgnoreTimeValidity: "ИгнорироватьВремяДействия",
  IgnoreSignatureValidity: "ИгнорироватьДействительностьПодписи",
  IgnoreCertificateRevocationStatus: "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов",
  AllowTestCertificates: "РазрешитьТестовыеСертификаты",
} as const

export const CryptoCertificateCheckModeFromEnterprise = {
  ИгнорироватьВремяДействия: "IgnoreTimeValidity",
  ИгнорироватьДействительностьПодписи: "IgnoreSignatureValidity",
  ИгнорироватьПроверкуВСпискеОтозванныхСертификатов: "IgnoreCertificateRevocationStatus",
  РазрешитьТестовыеСертификаты: "AllowTestCertificates",
} as const

export type CryptoCertificateCheckMode = keyof typeof CryptoCertificateCheckModeToEnterprise
export type CryptoCertificateCheckModeEnterprise = keyof typeof CryptoCertificateCheckModeFromEnterprise

export const CryptoCertificateIncludeModeToEnterprise = {
  IncludeWholeChain: "ВключатьПолнуюЦепочку",
  IncludeSubjectCertificate: "ВключатьСертификатСубъекта",
  IncludeChainWithoutRoot: "ВключатьЦепочкуБезКорневого",
  DontInclude: "НеВключать",
} as const

export const CryptoCertificateIncludeModeFromEnterprise = {
  ВключатьПолнуюЦепочку: "IncludeWholeChain",
  ВключатьСертификатСубъекта: "IncludeSubjectCertificate",
  ВключатьЦепочкуБезКорневого: "IncludeChainWithoutRoot",
  НеВключать: "DontInclude",
} as const

export type CryptoCertificateIncludeMode = keyof typeof CryptoCertificateIncludeModeToEnterprise
export type CryptoCertificateIncludeModeEnterprise = keyof typeof CryptoCertificateIncludeModeFromEnterprise

export const CryptoCertificateStorePlacementToEnterprise = {
  ComputerData: "ДанныеКомпьютера",
  OSUserData: "ДанныеПользователяОС",
  ApplicationData: "ДанныеПриложения",
} as const

export const CryptoCertificateStorePlacementFromEnterprise = {
  ДанныеКомпьютера: "ComputerData",
  ДанныеПользователяОС: "OSUserData",
  ДанныеПриложения: "ApplicationData",
} as const

export type CryptoCertificateStorePlacement = keyof typeof CryptoCertificateStorePlacementToEnterprise
export type CryptoCertificateStorePlacementEnterprise = keyof typeof CryptoCertificateStorePlacementFromEnterprise

export const CryptoCertificateStoreTypeToEnterprise = {
  RootCertificates: "КорневыеСертификаты",
  PersonalCertificates: "ПерсональныеСертификаты",
  RecipientCertificates: "СертификатыПолучателей",
  CertificationAuthorityCertificates: "СертификатыУдостоверяющихЦентров",
} as const

export const CryptoCertificateStoreTypeFromEnterprise = {
  КорневыеСертификаты: "RootCertificates",
  ПерсональныеСертификаты: "PersonalCertificates",
  СертификатыПолучателей: "RecipientCertificates",
  СертификатыУдостоверяющихЦентров: "CertificationAuthorityCertificates",
} as const

export type CryptoCertificateStoreType = keyof typeof CryptoCertificateStoreTypeToEnterprise
export type CryptoCertificateStoreTypeEnterprise = keyof typeof CryptoCertificateStoreTypeFromEnterprise

export const CryptoInteractiveModeUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CryptoInteractiveModeUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CryptoInteractiveModeUse = keyof typeof CryptoInteractiveModeUseToEnterprise
export type CryptoInteractiveModeUseEnterprise = keyof typeof CryptoInteractiveModeUseFromEnterprise

export const FormattedDocumentFileTypeToEnterprise = {
  ANSITXT: "ANSITXT",
  HTML: "HTML",
  PDF: "PDF",
  TXT: "TXT",
} as const

export const FormattedDocumentFileTypeFromEnterprise = {
  ANSITXT: "ANSITXT",
  HTML: "HTML",
  PDF: "PDF",
  TXT: "TXT",
} as const

export type FormattedDocumentFileType = keyof typeof FormattedDocumentFileTypeToEnterprise
export type FormattedDocumentFileTypeEnterprise = keyof typeof FormattedDocumentFileTypeFromEnterprise

export const FormattedDocumentParagraphTypeToEnterprise = {
  BulletedList: "МаркированныйСписок",
  NumberedList: "НумерованныйСписок",
  Usual: "Обычный",
} as const

export const FormattedDocumentParagraphTypeFromEnterprise = {
  МаркированныйСписок: "BulletedList",
  НумерованныйСписок: "NumberedList",
  Обычный: "Usual",
} as const

export type FormattedDocumentParagraphType = keyof typeof FormattedDocumentParagraphTypeToEnterprise
export type FormattedDocumentParagraphTypeEnterprise = keyof typeof FormattedDocumentParagraphTypeFromEnterprise

export const RowGotoDirectionToEnterprise = {
  Up: "Вверх",
  Down: "Вниз",
} as const

export const RowGotoDirectionFromEnterprise = {
  Вверх: "Up",
  Вниз: "Down",
} as const

export type RowGotoDirection = keyof typeof RowGotoDirectionToEnterprise
export type RowGotoDirectionEnterprise = keyof typeof RowGotoDirectionFromEnterprise

export const InternetMailAttachmentEncodingModeToEnterprise = {
  MIME: "MIME",
  UUEncode: "UUEncode",
} as const

export const InternetMailAttachmentEncodingModeFromEnterprise = {
  MIME: "MIME",
  UUEncode: "UUEncode",
} as const

export type InternetMailAttachmentEncodingMode = keyof typeof InternetMailAttachmentEncodingModeToEnterprise
export type InternetMailAttachmentEncodingModeEnterprise = keyof typeof InternetMailAttachmentEncodingModeFromEnterprise

export const InternetMailMessageImportanceToEnterprise = {
  High: "Высокая",
  Highest: "Наивысшая",
  Lowest: "Наименьшая",
  Low: "Низкая",
  Normal: "Обычная",
} as const

export const InternetMailMessageImportanceFromEnterprise = {
  Высокая: "High",
  Наивысшая: "Highest",
  Наименьшая: "Lowest",
  Низкая: "Low",
  Обычная: "Normal",
} as const

export type InternetMailMessageImportance = keyof typeof InternetMailMessageImportanceToEnterprise
export type InternetMailMessageImportanceEnterprise = keyof typeof InternetMailMessageImportanceFromEnterprise

export const InternetMailMessageNonASCIISymbolsEncodingModeToEnterprise = {
  MIME: "MIME",
  QuotedPrintable: "QuotedPrintable",
  None: "БезКодирования",
} as const

export const InternetMailMessageNonASCIISymbolsEncodingModeFromEnterprise = {
  MIME: "MIME",
  QuotedPrintable: "QuotedPrintable",
  БезКодирования: "None",
} as const

export type InternetMailMessageNonASCIISymbolsEncodingMode =
  keyof typeof InternetMailMessageNonASCIISymbolsEncodingModeToEnterprise
export type InternetMailMessageNonASCIISymbolsEncodingModeEnterprise =
  keyof typeof InternetMailMessageNonASCIISymbolsEncodingModeFromEnterprise

export const InternetMailMessageParseStatusToEnterprise = {
  ErrorsDetected: "ОбнаруженыОшибки",
  ErrorsNotDetected: "ОшибокНеОбнаружено",
} as const

export const InternetMailMessageParseStatusFromEnterprise = {
  ОбнаруженыОшибки: "ErrorsDetected",
  ОшибокНеОбнаружено: "ErrorsNotDetected",
} as const

export type InternetMailMessageParseStatus = keyof typeof InternetMailMessageParseStatusToEnterprise
export type InternetMailMessageParseStatusEnterprise = keyof typeof InternetMailMessageParseStatusFromEnterprise

export const InternetMailProtocolToEnterprise = {
  IMAP: "IMAP",
  POP3: "POP3",
  SMTP: "SMTP",
} as const

export const InternetMailProtocolFromEnterprise = {
  IMAP: "IMAP",
  POP3: "POP3",
  SMTP: "SMTP",
} as const

export type InternetMailProtocol = keyof typeof InternetMailProtocolToEnterprise
export type InternetMailProtocolEnterprise = keyof typeof InternetMailProtocolFromEnterprise

export const InternetMailTextProcessingToEnterprise = {
  DontProcess: "НеОбрабатывать",
  Process: "Обрабатывать",
} as const

export const InternetMailTextProcessingFromEnterprise = {
  НеОбрабатывать: "DontProcess",
  Обрабатывать: "Process",
} as const

export type InternetMailTextProcessing = keyof typeof InternetMailTextProcessingToEnterprise
export type InternetMailTextProcessingEnterprise = keyof typeof InternetMailTextProcessingFromEnterprise

export const InternetMailTextTypeToEnterprise = {
  HTML: "HTML",
  CustomText: "ПроизвольныйТекст",
  PlainText: "ПростойТекст",
  RichText: "РазмеченныйТекст",
} as const

export const InternetMailTextTypeFromEnterprise = {
  HTML: "HTML",
  ПроизвольныйТекст: "CustomText",
  ПростойТекст: "PlainText",
  РазмеченныйТекст: "RichText",
} as const

export type InternetMailTextType = keyof typeof InternetMailTextTypeToEnterprise
export type InternetMailTextTypeEnterprise = keyof typeof InternetMailTextTypeFromEnterprise

export const POP3AuthenticationModeToEnterprise = {
  APOP: "APOP",
  CramMD5: "CramMD5",
  General: "Обычная",
} as const

export const POP3AuthenticationModeFromEnterprise = {
  APOP: "APOP",
  CramMD5: "CramMD5",
  Обычная: "General",
} as const

export type POP3AuthenticationMode = keyof typeof POP3AuthenticationModeToEnterprise
export type POP3AuthenticationModeEnterprise = keyof typeof POP3AuthenticationModeFromEnterprise

export const SMTPAuthenticationModeToEnterprise = {
  CramMD5: "CramMD5",
  Login: "Login",
  Plain: "Plain",
  None: "БезАутентификации",
  Default: "ПоУмолчанию",
} as const

export const SMTPAuthenticationModeFromEnterprise = {
  CramMD5: "CramMD5",
  Login: "Login",
  Plain: "Plain",
  БезАутентификации: "None",
  ПоУмолчанию: "Default",
} as const

export type SMTPAuthenticationMode = keyof typeof SMTPAuthenticationModeToEnterprise
export type SMTPAuthenticationModeEnterprise = keyof typeof SMTPAuthenticationModeFromEnterprise

export const UseInternetMailTokenAuthenticationToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseInternetMailTokenAuthenticationFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseInternetMailTokenAuthentication = keyof typeof UseInternetMailTokenAuthenticationToEnterprise
export type UseInternetMailTokenAuthenticationEnterprise = keyof typeof UseInternetMailTokenAuthenticationFromEnterprise

export const QueryBuilderDimensionTypeToEnterprise = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const QueryBuilderDimensionTypeFromEnterprise = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type QueryBuilderDimensionType = keyof typeof QueryBuilderDimensionTypeToEnterprise
export type QueryBuilderDimensionTypeEnterprise = keyof typeof QueryBuilderDimensionTypeFromEnterprise

export const AddInConnectionTypeToEnterprise = {
  Isolated: "Изолированно",
  NotIsolated: "НеИзолированно",
} as const

export const AddInConnectionTypeFromEnterprise = {
  Изолированно: "Isolated",
  НеИзолированно: "NotIsolated",
} as const

export type AddInConnectionType = keyof typeof AddInConnectionTypeToEnterprise
export type AddInConnectionTypeEnterprise = keyof typeof AddInConnectionTypeFromEnterprise

export const AddInTypeToEnterprise = {
  COM: "COM",
  Native: "Native",
} as const

export const AddInTypeFromEnterprise = {
  COM: "COM",
  Native: "Native",
} as const

export type AddInType = keyof typeof AddInTypeToEnterprise
export type AddInTypeEnterprise = keyof typeof AddInTypeFromEnterprise

export const AllowedLengthToEnterprise = {
  Variable: "Переменная",
  Fixed: "Фиксированная",
} as const

export const AllowedLengthFromEnterprise = {
  Переменная: "Variable",
  Фиксированная: "Fixed",
} as const

export type AllowedLength = keyof typeof AllowedLengthToEnterprise
export type AllowedLengthEnterprise = keyof typeof AllowedLengthFromEnterprise

export const AllowedSignToEnterprise = {
  Any: "Любой",
  Nonnegative: "Неотрицательный",
} as const

export const AllowedSignFromEnterprise = {
  Любой: "Any",
  Неотрицательный: "Nonnegative",
} as const

export type AllowedSign = keyof typeof AllowedSignToEnterprise
export type AllowedSignEnterprise = keyof typeof AllowedSignFromEnterprise

export const ApplicationFormsOpenningModeToEnterprise = {
  Tabs: "Закладки",
  SingleWindows: "ОтдельныеОкна",
} as const

export const ApplicationFormsOpenningModeFromEnterprise = {
  Закладки: "Tabs",
  ОтдельныеОкна: "SingleWindows",
} as const

export type ApplicationFormsOpenningMode = keyof typeof ApplicationFormsOpenningModeToEnterprise
export type ApplicationFormsOpenningModeEnterprise = keyof typeof ApplicationFormsOpenningModeFromEnterprise

export const BorderTypeToEnterprise = {
  Absolute: "Абсолютная",
  StyleItem: "ЭлементСтиля",
} as const

export const BorderTypeFromEnterprise = {
  Абсолютная: "Absolute",
  ЭлементСтиля: "StyleItem",
} as const

export type BorderType = keyof typeof BorderTypeToEnterprise
export type BorderTypeEnterprise = keyof typeof BorderTypeFromEnterprise

export const BoundaryTypeToEnterprise = {
  Including: "Включая",
  Excluding: "Исключая",
} as const

export const BoundaryTypeFromEnterprise = {
  Включая: "Including",
  Исключая: "Excluding",
} as const

export type BoundaryType = keyof typeof BoundaryTypeToEnterprise
export type BoundaryTypeEnterprise = keyof typeof BoundaryTypeFromEnterprise

export const ByteOrderMarkUseToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ByteOrderMarkUseFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ByteOrderMarkUse = keyof typeof ByteOrderMarkUseToEnterprise
export type ByteOrderMarkUseEnterprise = keyof typeof ByteOrderMarkUseFromEnterprise

export const ClientApplicationBaseFontVariantToEnterprise = {
  Large: "Крупный",
  Normal: "Обычный",
} as const

export const ClientApplicationBaseFontVariantFromEnterprise = {
  Крупный: "Large",
  Обычный: "Normal",
} as const

export type ClientApplicationBaseFontVariant = keyof typeof ClientApplicationBaseFontVariantToEnterprise
export type ClientApplicationBaseFontVariantEnterprise = keyof typeof ClientApplicationBaseFontVariantFromEnterprise

export const ClientApplicationFormScaleVariantToEnterprise = {
  Auto: "Авто",
  Compact: "Компактный",
  Normal: "Обычный",
} as const

export const ClientApplicationFormScaleVariantFromEnterprise = {
  Авто: "Auto",
  Компактный: "Compact",
  Обычный: "Normal",
} as const

export type ClientApplicationFormScaleVariant = keyof typeof ClientApplicationFormScaleVariantToEnterprise
export type ClientApplicationFormScaleVariantEnterprise = keyof typeof ClientApplicationFormScaleVariantFromEnterprise

export const ClientApplicationInterfaceVariantToEnterprise = {
  Version8_2: "Версия8_2",
  Taxi: "Такси",
} as const

export const ClientApplicationInterfaceVariantFromEnterprise = {
  Версия8_2: "Version8_2",
  Такси: "Taxi",
} as const

export type ClientApplicationInterfaceVariant = keyof typeof ClientApplicationInterfaceVariantToEnterprise
export type ClientApplicationInterfaceVariantEnterprise = keyof typeof ClientApplicationInterfaceVariantFromEnterprise

export const ClientApplicationTypeToEnterprise = {
  WebClient: "ВебКлиент",
  ExternalConnection: "ВнешнееСоединение",
  MobileAppClient: "МобильноеПриложениеКлиент",
  MobileClient: "МобильныйКлиент",
  ThickClient: "ТолстыйКлиент",
  ThinClient: "ТонкийКлиент",
} as const

export const ClientApplicationTypeFromEnterprise = {
  ВебКлиент: "WebClient",
  ВнешнееСоединение: "ExternalConnection",
  МобильноеПриложениеКлиент: "MobileAppClient",
  МобильныйКлиент: "MobileClient",
  ТолстыйКлиент: "ThickClient",
  ТонкийКлиент: "ThinClient",
} as const

export type ClientApplicationType = keyof typeof ClientApplicationTypeToEnterprise
export type ClientApplicationTypeEnterprise = keyof typeof ClientApplicationTypeFromEnterprise

export const ClientConnectionSpeedToEnterprise = {
  Low: "Низкая",
  Normal: "Обычная",
} as const

export const ClientConnectionSpeedFromEnterprise = {
  Низкая: "Low",
  Обычная: "Normal",
} as const

export type ClientConnectionSpeed = keyof typeof ClientConnectionSpeedToEnterprise
export type ClientConnectionSpeedEnterprise = keyof typeof ClientConnectionSpeedFromEnterprise

export const ClientRunModeToEnterprise = {
  Auto: "Авто",
  OrdinaryApplication: "ОбычноеПриложение",
  ManagedApplication: "УправляемоеПриложение",
} as const

export const ClientRunModeFromEnterprise = {
  Авто: "Auto",
  ОбычноеПриложение: "OrdinaryApplication",
  УправляемоеПриложение: "ManagedApplication",
} as const

export type ClientRunMode = keyof typeof ClientRunModeToEnterprise
export type ClientRunModeEnterprise = keyof typeof ClientRunModeFromEnterprise

export const ColorTypeToEnterprise = {
  WebColor: "WebЦвет",
  WindowsColor: "WindowsЦвет",
  Absolute: "Абсолютный",
  AutoColor: "АвтоЦвет",
  StyleItem: "ЭлементСтиля",
} as const

export const ColorTypeFromEnterprise = {
  WebЦвет: "WebColor",
  WindowsЦвет: "WindowsColor",
  Абсолютный: "Absolute",
  АвтоЦвет: "AutoColor",
  ЭлементСтиля: "StyleItem",
} as const

export type ColorType = keyof typeof ColorTypeToEnterprise
export type ColorTypeEnterprise = keyof typeof ColorTypeFromEnterprise

export const ComparisonTypeToEnterprise = {
  Greater: "Больше",
  GreaterOrEqual: "БольшеИлиРавно",
  InHierarchy: "ВИерархии",
  InList: "ВСписке",
  InListByHierarchy: "ВСпискеПоИерархии",
  Interval: "Интервал",
  IntervalIncludingBounds: "ИнтервалВключаяГраницы",
  IntervalIncludingLowerBound: "ИнтервалВключаяНачало",
  IntervalIncludingUpperBound: "ИнтервалВключаяОкончание",
  Less: "Меньше",
  LessOrEqual: "МеньшеИлиРавно",
  NotInHierarchy: "НеВИерархии",
  NotInList: "НеВСписке",
  NotInListByHierarchy: "НеВСпискеПоИерархии",
  NotEqual: "НеРавно",
  NotContains: "НеСодержит",
  Equal: "Равно",
  Contains: "Содержит",
} as const

export const ComparisonTypeFromEnterprise = {
  Больше: "Greater",
  БольшеИлиРавно: "GreaterOrEqual",
  ВИерархии: "InHierarchy",
  ВСписке: "InList",
  ВСпискеПоИерархии: "InListByHierarchy",
  Интервал: "Interval",
  ИнтервалВключаяГраницы: "IntervalIncludingBounds",
  ИнтервалВключаяНачало: "IntervalIncludingLowerBound",
  ИнтервалВключаяОкончание: "IntervalIncludingUpperBound",
  Меньше: "Less",
  МеньшеИлиРавно: "LessOrEqual",
  НеВИерархии: "NotInHierarchy",
  НеВСписке: "NotInList",
  НеВСпискеПоИерархии: "NotInListByHierarchy",
  НеРавно: "NotEqual",
  НеСодержит: "NotContains",
  Равно: "Equal",
  Содержит: "Contains",
} as const

export type ComparisonType = keyof typeof ComparisonTypeToEnterprise
export type ComparisonTypeEnterprise = keyof typeof ComparisonTypeFromEnterprise

export const CompositeWordsSeparationModeToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CompositeWordsSeparationModeFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CompositeWordsSeparationMode = keyof typeof CompositeWordsSeparationModeToEnterprise
export type CompositeWordsSeparationModeEnterprise = keyof typeof CompositeWordsSeparationModeFromEnterprise

export const ConfigurationExtensionApplicationIssueSeverityToEnterprise = {
  Critical: "Критичная",
  Low: "Низкая",
  Moderate: "Обычная",
} as const

export const ConfigurationExtensionApplicationIssueSeverityFromEnterprise = {
  Критичная: "Critical",
  Низкая: "Low",
  Обычная: "Moderate",
} as const

export type ConfigurationExtensionApplicationIssueSeverity =
  keyof typeof ConfigurationExtensionApplicationIssueSeverityToEnterprise
export type ConfigurationExtensionApplicationIssueSeverityEnterprise =
  keyof typeof ConfigurationExtensionApplicationIssueSeverityFromEnterprise

export const ConfigurationExtensionScopeToEnterprise = {
  InfoBase: "ИнформационнаяБаза",
  DataSeparation: "РазделениеДанных",
} as const

export const ConfigurationExtensionScopeFromEnterprise = {
  ИнформационнаяБаза: "InfoBase",
  РазделениеДанных: "DataSeparation",
} as const

export type ConfigurationExtensionScope = keyof typeof ConfigurationExtensionScopeToEnterprise
export type ConfigurationExtensionScopeEnterprise = keyof typeof ConfigurationExtensionScopeFromEnterprise

export const ConfigurationExtensionsSourceToEnterprise = {
  Database: "БазаДанных",
  SessionApplied: "СеансАктивные",
  SessionDisabled: "СеансОтключенные",
} as const

export const ConfigurationExtensionsSourceFromEnterprise = {
  БазаДанных: "Database",
  СеансАктивные: "SessionApplied",
  СеансОтключенные: "SessionDisabled",
} as const

export type ConfigurationExtensionsSource = keyof typeof ConfigurationExtensionsSourceToEnterprise
export type ConfigurationExtensionsSourceEnterprise = keyof typeof ConfigurationExtensionsSourceFromEnterprise

export const DataBaseConfigurationUpdateExecutionInformationItemTypeToEnterprise = {
  Information: "Информация",
  Error: "Ошибка",
  Warning: "Предупреждение",
} as const

export const DataBaseConfigurationUpdateExecutionInformationItemTypeFromEnterprise = {
  Информация: "Information",
  Ошибка: "Error",
  Предупреждение: "Warning",
} as const

export type DataBaseConfigurationUpdateExecutionInformationItemType =
  keyof typeof DataBaseConfigurationUpdateExecutionInformationItemTypeToEnterprise
export type DataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise =
  keyof typeof DataBaseConfigurationUpdateExecutionInformationItemTypeFromEnterprise

export const DataBaseConfigurationUpdateStateToEnterprise = {
  RefreshInProgress: "ВыполняетсяАктуализация",
  ProcessingInProgress: "ВыполняетсяОбработка",
  NotActive: "Неактивно",
} as const

export const DataBaseConfigurationUpdateStateFromEnterprise = {
  ВыполняетсяАктуализация: "RefreshInProgress",
  ВыполняетсяОбработка: "ProcessingInProgress",
  Неактивно: "NotActive",
} as const

export type DataBaseConfigurationUpdateState = keyof typeof DataBaseConfigurationUpdateStateToEnterprise
export type DataBaseConfigurationUpdateStateEnterprise = keyof typeof DataBaseConfigurationUpdateStateFromEnterprise

export const DatabaseTablespacesUseModeToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DatabaseTablespacesUseModeFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DatabaseTablespacesUseMode = keyof typeof DatabaseTablespacesUseModeToEnterprise
export type DatabaseTablespacesUseModeEnterprise = keyof typeof DatabaseTablespacesUseModeFromEnterprise

export const DateFractionsToEnterprise = {
  Time: "Время",
  Date: "Дата",
  DateTime: "ДатаВремя",
} as const

export const DateFractionsFromEnterprise = {
  Время: "Time",
  Дата: "Date",
  ДатаВремя: "DateTime",
} as const

export type DateFractions = keyof typeof DateFractionsToEnterprise
export type DateFractionsEnterprise = keyof typeof DateFractionsFromEnterprise

export const DialogReturnCodeToEnterprise = {
  Yes: "Да",
  No: "Нет",
  OK: "ОК",
  Cancel: "Отмена",
  Retry: "Повторить",
  Abort: "Прервать",
  Ignore: "Пропустить",
  Timeout: "Таймаут",
} as const

export const DialogReturnCodeFromEnterprise = {
  Да: "Yes",
  Нет: "No",
  ОК: "OK",
  Отмена: "Cancel",
  Повторить: "Retry",
  Прервать: "Abort",
  Пропустить: "Ignore",
  Таймаут: "Timeout",
} as const

export type DialogReturnCode = keyof typeof DialogReturnCodeToEnterprise
export type DialogReturnCodeEnterprise = keyof typeof DialogReturnCodeFromEnterprise

export const DynamicListKeyTypeToEnterprise = {
  Auto: "Авто",
  FieldValue: "ЗначениеПоля",
  RowKey: "КлючСтроки",
  RowNumber: "НомерСтроки",
} as const

export const DynamicListKeyTypeFromEnterprise = {
  Авто: "Auto",
  ЗначениеПоля: "FieldValue",
  КлючСтроки: "RowKey",
  НомерСтроки: "RowNumber",
} as const

export type DynamicListKeyType = keyof typeof DynamicListKeyTypeToEnterprise
export type DynamicListKeyTypeEnterprise = keyof typeof DynamicListKeyTypeFromEnterprise

export const EnterKeyBehaviorTypeToEnterprise = {
  DefaultButton: "КнопкаПоУмолчанию",
  ControlNavigation: "ПереходПоЭлементамФормы",
} as const

export const EnterKeyBehaviorTypeFromEnterprise = {
  КнопкаПоУмолчанию: "DefaultButton",
  ПереходПоЭлементамФормы: "ControlNavigation",
} as const

export type EnterKeyBehaviorType = keyof typeof EnterKeyBehaviorTypeToEnterprise
export type EnterKeyBehaviorTypeEnterprise = keyof typeof EnterKeyBehaviorTypeFromEnterprise

export const ExternalDataSourceStateToEnterprise = {
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const ExternalDataSourceStateFromEnterprise = {
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type ExternalDataSourceState = keyof typeof ExternalDataSourceStateToEnterprise
export type ExternalDataSourceStateEnterprise = keyof typeof ExternalDataSourceStateFromEnterprise

export const FillCheckingToEnterprise = {
  ShowError: "ВыдаватьОшибку",
  DontCheck: "НеПроверять",
} as const

export const FillCheckingFromEnterprise = {
  ВыдаватьОшибку: "ShowError",
  НеПроверять: "DontCheck",
} as const

export type FillChecking = keyof typeof FillCheckingToEnterprise
export type FillCheckingEnterprise = keyof typeof FillCheckingFromEnterprise

export const FontTypeToEnterprise = {
  WindowsFont: "WindowsШрифт",
  Absolute: "Абсолютный",
  AutoFont: "АвтоШрифт",
  StyleItem: "ЭлементСтиля",
} as const

export const FontTypeFromEnterprise = {
  WindowsШрифт: "WindowsFont",
  Абсолютный: "Absolute",
  АвтоШрифт: "AutoFont",
  ЭлементСтиля: "StyleItem",
} as const

export type FontType = keyof typeof FontTypeToEnterprise
export type FontTypeEnterprise = keyof typeof FontTypeFromEnterprise

export const FullTextSearchMetadataUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const FullTextSearchMetadataUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type FullTextSearchMetadataUse = keyof typeof FullTextSearchMetadataUseToEnterprise
export type FullTextSearchMetadataUseEnterprise = keyof typeof FullTextSearchMetadataUseFromEnterprise

export const FullTextSearchModeToEnterprise = {
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const FullTextSearchModeFromEnterprise = {
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type FullTextSearchMode = keyof typeof FullTextSearchModeToEnterprise
export type FullTextSearchModeEnterprise = keyof typeof FullTextSearchModeFromEnterprise

export const FullTextSearchRepresentationTypeToEnterprise = {
  HTMLText: "HTMLТекст",
  XML: "XML",
} as const

export const FullTextSearchRepresentationTypeFromEnterprise = {
  HTMLТекст: "HTMLText",
  XML: "XML",
} as const

export type FullTextSearchRepresentationType = keyof typeof FullTextSearchRepresentationTypeToEnterprise
export type FullTextSearchRepresentationTypeEnterprise = keyof typeof FullTextSearchRepresentationTypeFromEnterprise

export const FullTextSearchVersionToEnterprise = {
  Version1: "Версия1",
  Version2: "Версия2",
} as const

export const FullTextSearchVersionFromEnterprise = {
  Версия1: "Version1",
  Версия2: "Version2",
} as const

export type FullTextSearchVersion = keyof typeof FullTextSearchVersionToEnterprise
export type FullTextSearchVersionEnterprise = keyof typeof FullTextSearchVersionFromEnterprise

export const HashFunctionToEnterprise = {
  CRC32: "CRC32",
  MD5: "MD5",
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export const HashFunctionFromEnterprise = {
  CRC32: "CRC32",
  MD5: "MD5",
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export type HashFunction = keyof typeof HashFunctionToEnterprise
export type HashFunctionEnterprise = keyof typeof HashFunctionFromEnterprise

export const InterfaceCompatibilityModeToEnterprise = {
  Version8_2: "Версия8_2",
  Version8_2EnableTaxi: "Версия8_2РазрешитьТакси",
  Taxi: "Такси",
  TaxiEnableVersion8_2: "ТаксиРазрешитьВерсия8_2",
} as const

export const InterfaceCompatibilityModeFromEnterprise = {
  Версия8_2: "Version8_2",
  Версия8_2РазрешитьТакси: "Version8_2EnableTaxi",
  Такси: "Taxi",
  ТаксиРазрешитьВерсия8_2: "TaxiEnableVersion8_2",
} as const

export type InterfaceCompatibilityMode = keyof typeof InterfaceCompatibilityModeToEnterprise
export type InterfaceCompatibilityModeEnterprise = keyof typeof InterfaceCompatibilityModeFromEnterprise

export const IntervalBoundVariantToEnterprise = {
  WithoutRestriction: "БезОграничения",
  Year: "Год",
  Quarter: "Квартал",
  SpecificDate: "КонкретнаяДата",
  Month: "Месяц",
  Week: "Неделя",
  WorkingDate: "РабочаяДата",
  BeforeAfter: "Смещение",
} as const

export const IntervalBoundVariantFromEnterprise = {
  БезОграничения: "WithoutRestriction",
  Год: "Year",
  Квартал: "Quarter",
  КонкретнаяДата: "SpecificDate",
  Месяц: "Month",
  Неделя: "Week",
  РабочаяДата: "WorkingDate",
  Смещение: "BeforeAfter",
} as const

export type IntervalBoundVariant = keyof typeof IntervalBoundVariantToEnterprise
export type IntervalBoundVariantEnterprise = keyof typeof IntervalBoundVariantFromEnterprise

export const KeyToEnterprise = {
  BackSpace: "BackSpace",
  Break: "Break",
  NumAdd: "NumAdd",
  NumDecimal: "NumDecimal",
  NumDivide: "NumDivide",
  NumMultiply: "NumMultiply",
  NumSubtract: "NumSubtract",
  Space: "Space",
  None: "Нет",
} as const

export const KeyFromEnterprise = {
  BackSpace: "BackSpace",
  Break: "Break",
  NumAdd: "NumAdd",
  NumDecimal: "NumDecimal",
  NumDivide: "NumDivide",
  NumMultiply: "NumMultiply",
  NumSubtract: "NumSubtract",
  Space: "Space",
  Нет: "None",
} as const

export type Key = keyof typeof KeyToEnterprise
export type KeyEnterprise = keyof typeof KeyFromEnterprise

export const LocationRelativeToGeofenceToEnterprise = {
  Inside: "Внутри",
  Outside: "Снаружи",
} as const

export const LocationRelativeToGeofenceFromEnterprise = {
  Внутри: "Inside",
  Снаружи: "Outside",
} as const

export type LocationRelativeToGeofence = keyof typeof LocationRelativeToGeofenceToEnterprise
export type LocationRelativeToGeofenceEnterprise = keyof typeof LocationRelativeToGeofenceFromEnterprise

export const MessageStatusToEnterprise = {
  WithoutStatus: "БезСтатуса",
  Important: "Важное",
  Attention: "Внимание",
  Information: "Информация",
  Ordinary: "Обычное",
  VeryImportant: "ОченьВажное",
} as const

export const MessageStatusFromEnterprise = {
  БезСтатуса: "WithoutStatus",
  Важное: "Important",
  Внимание: "Attention",
  Информация: "Information",
  Обычное: "Ordinary",
  ОченьВажное: "VeryImportant",
} as const

export type MessageStatus = keyof typeof MessageStatusToEnterprise
export type MessageStatusEnterprise = keyof typeof MessageStatusFromEnterprise

export const MobileApplicationFunctionalitiesToEnterprise = {
  BluetoothPrinters: "BluetoothПринтеры",
  NFC: "NFC",
  PushNotifications: "PushУведомления",
  WiFiPrinters: "WiFiПринтеры",
  AutoSendSMS: "АвтоматическаяОтправкаSMSСообщений",
  MusicLibrary: "БиблиотекаМузыки",
  PictureAndVideoLibraries: "БиблиотекиКартинокИВидео",
  Biometrics: "Биометрия",
  Videoconferences: "Видеоконференции",
  AudioPlaybackAndVibration: "ВоспроизведениеАудиоИВибрация",
  BackgroundAudioPlaybackAndVibration: "ВоспроизведениеАудиоИВибрацияВФоновомРежиме",
  InAppPurchases: "ВстроенныеПокупки",
  IncomingShareRequests: "ВходящиеЗапросыПоделиться",
  Geofences: "Геозоны",
  Location: "Геопозиционирование",
  BackgroundLocation: "ГеопозиционированиеВФоновомРежиме",
  AllFilesAccess: "ДоступКоВсемФайлам",
  SMSLog: "ЖурналSMS",
  CallLog: "ЖурналЗвонков",
  BackgroundAudioRecording: "ЗаписьАудиоВФоновомРежиме",
  Calendars: "Календари",
  Camera: "Камера",
  Contacts: "Контакты",
  LocalNotifications: "ЛокальныеУведомления",
  Microphone: "Микрофон",
  NumberDialing: "НаборНомера",
  PersonalComputerFileExchange: "ОбменФайламиСПерсональнымКомпьютером",
  AllIncomingShareRequestsTypesProcessing: "ОбработкаВсехТиповВходящихЗапросовПоделиться",
  CallProcessing: "ОбработкаЗвонков",
  ReceiveSMS: "ПолучениеSMS",
  SpeechToText: "РаспознаваниеРечи",
  OSBackup: "РезервноеКопированиеСредствамиОС",
  Ads: "Реклама",
  TextToSpeech: "СинтезРечи",
  DocumentScanning: "СканированиеДокументов",
  BarcodeScanning: "СканированиеШтрихКодов",
  ApplicationUsageStatistics: "СтатистикаИспользованияПриложения",
  InstallPackages: "УстановкаПриложений",
} as const

export const MobileApplicationFunctionalitiesFromEnterprise = {
  BluetoothПринтеры: "BluetoothPrinters",
  NFC: "NFC",
  PushУведомления: "PushNotifications",
  WiFiПринтеры: "WiFiPrinters",
  АвтоматическаяОтправкаSMSСообщений: "AutoSendSMS",
  БиблиотекаМузыки: "MusicLibrary",
  БиблиотекиКартинокИВидео: "PictureAndVideoLibraries",
  Биометрия: "Biometrics",
  Видеоконференции: "Videoconferences",
  ВоспроизведениеАудиоИВибрация: "AudioPlaybackAndVibration",
  ВоспроизведениеАудиоИВибрацияВФоновомРежиме: "BackgroundAudioPlaybackAndVibration",
  ВстроенныеПокупки: "InAppPurchases",
  ВходящиеЗапросыПоделиться: "IncomingShareRequests",
  Геозоны: "Geofences",
  Геопозиционирование: "Location",
  ГеопозиционированиеВФоновомРежиме: "BackgroundLocation",
  ДоступКоВсемФайлам: "AllFilesAccess",
  ЖурналSMS: "SMSLog",
  ЖурналЗвонков: "CallLog",
  ЗаписьАудиоВФоновомРежиме: "BackgroundAudioRecording",
  Календари: "Calendars",
  Камера: "Camera",
  Контакты: "Contacts",
  ЛокальныеУведомления: "LocalNotifications",
  Микрофон: "Microphone",
  НаборНомера: "NumberDialing",
  ОбменФайламиСПерсональнымКомпьютером: "PersonalComputerFileExchange",
  ОбработкаВсехТиповВходящихЗапросовПоделиться: "AllIncomingShareRequestsTypesProcessing",
  ОбработкаЗвонков: "CallProcessing",
  ПолучениеSMS: "ReceiveSMS",
  РаспознаваниеРечи: "SpeechToText",
  РезервноеКопированиеСредствамиОС: "OSBackup",
  Реклама: "Ads",
  СинтезРечи: "TextToSpeech",
  СканированиеДокументов: "DocumentScanning",
  СканированиеШтрихКодов: "BarcodeScanning",
  СтатистикаИспользованияПриложения: "ApplicationUsageStatistics",
  УстановкаПриложений: "InstallPackages",
} as const

export type MobileApplicationFunctionalities = keyof typeof MobileApplicationFunctionalitiesToEnterprise
export type MobileApplicationFunctionalitiesEnterprise = keyof typeof MobileApplicationFunctionalitiesFromEnterprise

export const NumericValueTypeToEnterprise = {
  Cardinal: "Количественное",
  Ordinal: "Порядковое",
} as const

export const NumericValueTypeFromEnterprise = {
  Количественное: "Cardinal",
  Порядковое: "Ordinal",
} as const

export type NumericValueType = keyof typeof NumericValueTypeToEnterprise
export type NumericValueTypeEnterprise = keyof typeof NumericValueTypeFromEnterprise

export const PasswordPolicyComplianceCheckResultToEnterprise = {
  DoesNotSatisfyMinLengthRequirements: "НеСоответствуетТребованиямМинимальнойДлины",
  DoesNotSatisfyReuseLimitRequirements: "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних",
  DoesNotSatisfyCompromiseCheckRequirements: "НеСоответствуетТребованиямПроверкиРаскрытия",
  DoesNotSatisfyComplexityRequirements: "НеСоответствуетТребованиямСложности",
} as const

export const PasswordPolicyComplianceCheckResultFromEnterprise = {
  НеСоответствуетТребованиямМинимальнойДлины: "DoesNotSatisfyMinLengthRequirements",
  НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних: "DoesNotSatisfyReuseLimitRequirements",
  НеСоответствуетТребованиямПроверкиРаскрытия: "DoesNotSatisfyCompromiseCheckRequirements",
  НеСоответствуетТребованиямСложности: "DoesNotSatisfyComplexityRequirements",
} as const

export type PasswordPolicyComplianceCheckResult = keyof typeof PasswordPolicyComplianceCheckResultToEnterprise
export type PasswordPolicyComplianceCheckResultEnterprise =
  keyof typeof PasswordPolicyComplianceCheckResultFromEnterprise

export const PeriodSettingsVariantToEnterprise = {
  Interval: "Интервал",
  Period: "Период",
} as const

export const PeriodSettingsVariantFromEnterprise = {
  Интервал: "Interval",
  Период: "Period",
} as const

export type PeriodSettingsVariant = keyof typeof PeriodSettingsVariantToEnterprise
export type PeriodSettingsVariantEnterprise = keyof typeof PeriodSettingsVariantFromEnterprise

export const PeriodVariantToEnterprise = {
  Year: "Год",
  Day: "День",
  DayFromBegOfYear: "ДеньСНачалаГода",
  DayFromBegOfQuarter: "ДеньСНачалаКвартала",
  DayFromBegOfMonth: "ДеньСНачалаМесяца",
  Quarter: "Квартал",
  QuarterFromBegOfYear: "КварталСНачалаГода",
  Month: "Месяц",
  MonthFromBegOfYear: "МесяцСНачалаГода",
  MonthFromBegOfQuarter: "МесяцСНачалаКвартала",
  AnyInterval: "ПроизвольныйИнтервал",
} as const

export const PeriodVariantFromEnterprise = {
  Год: "Year",
  День: "Day",
  ДеньСНачалаГода: "DayFromBegOfYear",
  ДеньСНачалаКвартала: "DayFromBegOfQuarter",
  ДеньСНачалаМесяца: "DayFromBegOfMonth",
  Квартал: "Quarter",
  КварталСНачалаГода: "QuarterFromBegOfYear",
  Месяц: "Month",
  МесяцСНачалаГода: "MonthFromBegOfYear",
  МесяцСНачалаКвартала: "MonthFromBegOfQuarter",
  ПроизвольныйИнтервал: "AnyInterval",
} as const

export type PeriodVariant = keyof typeof PeriodVariantToEnterprise
export type PeriodVariantEnterprise = keyof typeof PeriodVariantFromEnterprise

export const PictureTypeToEnterprise = {
  Absolute: "Абсолютная",
  FromLib: "ИзБиблиотеки",
  Empty: "Пустая",
} as const

export const PictureTypeFromEnterprise = {
  Абсолютная: "Absolute",
  ИзБиблиотеки: "FromLib",
  Пустая: "Empty",
} as const

export type PictureType = keyof typeof PictureTypeToEnterprise
export type PictureTypeEnterprise = keyof typeof PictureTypeFromEnterprise

export const PlatformTypeToEnterprise = {
  Android_ARM: "Android_ARM",
  Android_ARM_64: "Android_ARM_64",
  Android_x86: "Android_x86",
  Android_x86_64: "Android_x86_64",
  iOS_ARM: "iOS_ARM",
  iOS_ARM_64: "iOS_ARM_64",
  Linux_ARM64: "Linux_ARM64",
  Linux_E2K: "Linux_E2K",
  Linux_x86: "Linux_x86",
  Linux_x86_64: "Linux_x86_64",
  MacOS_x86: "MacOS_x86",
  MacOS_x86_64: "MacOS_x86_64",
  Windows_x86: "Windows_x86",
  Windows_x86_64: "Windows_x86_64",
  WinRT_ARM: "WinRT_ARM",
  WinRT_x86: "WinRT_x86",
  WinRT_x86_64: "WinRT_x86_64",
} as const

export const PlatformTypeFromEnterprise = {
  Android_ARM: "Android_ARM",
  Android_ARM_64: "Android_ARM_64",
  Android_x86: "Android_x86",
  Android_x86_64: "Android_x86_64",
  iOS_ARM: "iOS_ARM",
  iOS_ARM_64: "iOS_ARM_64",
  Linux_ARM64: "Linux_ARM64",
  Linux_E2K: "Linux_E2K",
  Linux_x86: "Linux_x86",
  Linux_x86_64: "Linux_x86_64",
  MacOS_x86: "MacOS_x86",
  MacOS_x86_64: "MacOS_x86_64",
  Windows_x86: "Windows_x86",
  Windows_x86_64: "Windows_x86_64",
  WinRT_ARM: "WinRT_ARM",
  WinRT_x86: "WinRT_x86",
  WinRT_x86_64: "WinRT_x86_64",
} as const

export type PlatformType = keyof typeof PlatformTypeToEnterprise
export type PlatformTypeEnterprise = keyof typeof PlatformTypeFromEnterprise

export const PredefinedDataUpdateToEnterprise = {
  Auto: "Авто",
  DontAutoUpdate: "НеОбновлятьАвтоматически",
  AutoUpdate: "ОбновлятьАвтоматически",
} as const

export const PredefinedDataUpdateFromEnterprise = {
  Авто: "Auto",
  НеОбновлятьАвтоматически: "DontAutoUpdate",
  ОбновлятьАвтоматически: "AutoUpdate",
} as const

export type PredefinedDataUpdate = keyof typeof PredefinedDataUpdateToEnterprise
export type PredefinedDataUpdateEnterprise = keyof typeof PredefinedDataUpdateFromEnterprise

export const QuestionDialogModeToEnterprise = {
  YesNo: "ДаНет",
  YesNoCancel: "ДаНетОтмена",
  OK: "ОК",
  OKCancel: "ОКОтмена",
  RetryCancel: "ПовторитьОтмена",
  AbortRetryIgnore: "ПрерватьПовторитьПропустить",
} as const

export const QuestionDialogModeFromEnterprise = {
  ДаНет: "YesNo",
  ДаНетОтмена: "YesNoCancel",
  ОК: "OK",
  ОКОтмена: "OKCancel",
  ПовторитьОтмена: "RetryCancel",
  ПрерватьПовторитьПропустить: "AbortRetryIgnore",
} as const

export type QuestionDialogMode = keyof typeof QuestionDialogModeToEnterprise
export type QuestionDialogModeEnterprise = keyof typeof QuestionDialogModeFromEnterprise

export const ReplacementModeToEnterprise = {
  Append: "Добавление",
  Replace: "Замещение",
  Update: "Обновление",
  Merge: "Слияние",
  Delete: "Удаление",
} as const

export const ReplacementModeFromEnterprise = {
  Добавление: "Append",
  Замещение: "Replace",
  Обновление: "Update",
  Слияние: "Merge",
  Удаление: "Delete",
} as const

export type ReplacementMode = keyof typeof ReplacementModeToEnterprise
export type ReplacementModeEnterprise = keyof typeof ReplacementModeFromEnterprise

export const RoundModeToEnterprise = {
  Round15as10: "Окр15как10",
  Round15as20: "Окр15как20",
} as const

export const RoundModeFromEnterprise = {
  Окр15как10: "Round15as10",
  Окр15как20: "Round15as20",
} as const

export type RoundMode = keyof typeof RoundModeToEnterprise
export type RoundModeEnterprise = keyof typeof RoundModeFromEnterprise

export const SearchDirectionToEnterprise = {
  FromEnd: "СКонца",
  FromBegin: "СНачала",
} as const

export const SearchDirectionFromEnterprise = {
  СКонца: "FromEnd",
  СНачала: "FromBegin",
} as const

export type SearchDirection = keyof typeof SearchDirectionToEnterprise
export type SearchDirectionEnterprise = keyof typeof SearchDirectionFromEnterprise

export const SectionsPanelRepresentationToEnterprise = {
  Picture: "Картинка",
  PictureAndText: "КартинкаИТекст",
  PictureOnTopAndText: "КартинкаСверхуИТекст",
  PictureOnLeftAndText: "КартинкаСлеваИТекст",
  Text: "Текст",
} as const

export const SectionsPanelRepresentationFromEnterprise = {
  Картинка: "Picture",
  КартинкаИТекст: "PictureAndText",
  КартинкаСверхуИТекст: "PictureOnTopAndText",
  КартинкаСлеваИТекст: "PictureOnLeftAndText",
  Текст: "Text",
} as const

export type SectionsPanelRepresentation = keyof typeof SectionsPanelRepresentationToEnterprise
export type SectionsPanelRepresentationEnterprise = keyof typeof SectionsPanelRepresentationFromEnterprise

export const SortDirectionToEnterprise = {
  Asc: "Возр",
  Desc: "Убыв",
} as const

export const SortDirectionFromEnterprise = {
  Возр: "Asc",
  Убыв: "Desc",
} as const

export type SortDirection = keyof typeof SortDirectionToEnterprise
export type SortDirectionEnterprise = keyof typeof SortDirectionFromEnterprise

export const StandardBeginningDateVariantToEnterprise = {
  BeginningOfLastYear: "НачалоПрошлогоГода",
  BeginningOfLastDay: "НачалоПрошлогоДня",
  BeginningOfLastQuarter: "НачалоПрошлогоКвартала",
  BeginningOfLastMonth: "НачалоПрошлогоМесяца",
  BeginningOfLastHalfYear: "НачалоПрошлогоПолугодия",
  BeginningOfLastTenDays: "НачалоПрошлойДекады",
  BeginningOfLastWeek: "НачалоПрошлойНедели",
  BeginningOfNextYear: "НачалоСледующегоГода",
  BeginningOfNextDay: "НачалоСледующегоДня",
  BeginningOfNextQuarter: "НачалоСледующегоКвартала",
  BeginningOfNextMonth: "НачалоСледующегоМесяца",
  BeginningOfNextHalfYear: "НачалоСледующегоПолугодия",
  BeginningOfNextTenDays: "НачалоСледующейДекады",
  BeginningOfNextWeek: "НачалоСледующейНедели",
  BeginningOfThisYear: "НачалоЭтогоГода",
  BeginningOfThisDay: "НачалоЭтогоДня",
  BeginningOfThisQuarter: "НачалоЭтогоКвартала",
  BeginningOfThisMonth: "НачалоЭтогоМесяца",
  BeginningOfThisHalfYear: "НачалоЭтогоПолугодия",
  BeginningOfThisTenDays: "НачалоЭтойДекады",
  BeginningOfThisWeek: "НачалоЭтойНедели",
  Custom: "ПроизвольнаяДата",
} as const

export const StandardBeginningDateVariantFromEnterprise = {
  НачалоПрошлогоГода: "BeginningOfLastYear",
  НачалоПрошлогоДня: "BeginningOfLastDay",
  НачалоПрошлогоКвартала: "BeginningOfLastQuarter",
  НачалоПрошлогоМесяца: "BeginningOfLastMonth",
  НачалоПрошлогоПолугодия: "BeginningOfLastHalfYear",
  НачалоПрошлойДекады: "BeginningOfLastTenDays",
  НачалоПрошлойНедели: "BeginningOfLastWeek",
  НачалоСледующегоГода: "BeginningOfNextYear",
  НачалоСледующегоДня: "BeginningOfNextDay",
  НачалоСледующегоКвартала: "BeginningOfNextQuarter",
  НачалоСледующегоМесяца: "BeginningOfNextMonth",
  НачалоСледующегоПолугодия: "BeginningOfNextHalfYear",
  НачалоСледующейДекады: "BeginningOfNextTenDays",
  НачалоСледующейНедели: "BeginningOfNextWeek",
  НачалоЭтогоГода: "BeginningOfThisYear",
  НачалоЭтогоДня: "BeginningOfThisDay",
  НачалоЭтогоКвартала: "BeginningOfThisQuarter",
  НачалоЭтогоМесяца: "BeginningOfThisMonth",
  НачалоЭтогоПолугодия: "BeginningOfThisHalfYear",
  НачалоЭтойДекады: "BeginningOfThisTenDays",
  НачалоЭтойНедели: "BeginningOfThisWeek",
  ПроизвольнаяДата: "Custom",
} as const

export type StandardBeginningDateVariant = keyof typeof StandardBeginningDateVariantToEnterprise
export type StandardBeginningDateVariantEnterprise = keyof typeof StandardBeginningDateVariantFromEnterprise

export const StandardGlobalSearchTypeToEnterprise = {
  AllFunctions: "ВсеФункции",
  Expression: "Выражение",
  GlobalStandardCommands: "ГлобальныеСтандартныеКоманды",
  Data: "Данные",
  UserWorkFavorites: "ИзбранноеРаботыПользователя",
  UserWorkHistory: "ИсторияРаботыПользователя",
  FunctionMenu: "МенюФункций",
  URL: "НавигационнаяСсылка",
  CollaborationSystemConversations: "ОбсужденияСистемыВзаимодействия",
  CollaborationSystemMessages: "СообщенияСистемыВзаимодействия",
  Help: "Справка",
  FunctionsForTechnicalSpecialist: "ФункцииДляТехническогоСпециалиста",
} as const

export const StandardGlobalSearchTypeFromEnterprise = {
  ВсеФункции: "AllFunctions",
  Выражение: "Expression",
  ГлобальныеСтандартныеКоманды: "GlobalStandardCommands",
  Данные: "Data",
  ИзбранноеРаботыПользователя: "UserWorkFavorites",
  ИсторияРаботыПользователя: "UserWorkHistory",
  МенюФункций: "FunctionMenu",
  НавигационнаяСсылка: "URL",
  ОбсужденияСистемыВзаимодействия: "CollaborationSystemConversations",
  СообщенияСистемыВзаимодействия: "CollaborationSystemMessages",
  Справка: "Help",
  ФункцииДляТехническогоСпециалиста: "FunctionsForTechnicalSpecialist",
} as const

export type StandardGlobalSearchType = keyof typeof StandardGlobalSearchTypeToEnterprise
export type StandardGlobalSearchTypeEnterprise = keyof typeof StandardGlobalSearchTypeFromEnterprise

export const StandardPeriodVariantToEnterprise = {
  Yesterday: "Вчера",
  TillEndOfThisYear: "ДоКонцаЭтогоГода",
  TillEndOfThisQuarter: "ДоКонцаЭтогоКвартала",
  TillEndOfThisMonth: "ДоКонцаЭтогоМесяца",
  TillEndOfThisHalfYear: "ДоКонцаЭтогоПолугодия",
  TillEndOfThisTenDays: "ДоКонцаЭтойДекады",
  TillEndOfThisWeek: "ДоКонцаЭтойНедели",
  Tomorrow: "Завтра",
  Month: "Месяц",
  Last7Days: "Последние7Дней",
  Custom: "ПроизвольныйПериод",
  LastTenDays: "ПрошлаяДекада",
  LastTenDaysTillSameDayNumber: "ПрошлаяДекадаДоТакогоЖеНомераДня",
  LastWeek: "ПрошлаяНеделя",
  LastWeekTillSameWeekDay: "ПрошлаяНеделяДоТакогоЖеДняНедели",
  LastHalfYear: "ПрошлоеПолугодие",
  LastHalfYearTillSameDate: "ПрошлоеПолугодиеДоТакойЖеДаты",
  LastYear: "ПрошлыйГод",
  LastYearTillSameDate: "ПрошлыйГодДоТакойЖеДаты",
  LastQuarter: "ПрошлыйКвартал",
  LastQuarterTillSameDate: "ПрошлыйКварталДоТакойЖеДаты",
  LastMonth: "ПрошлыйМесяц",
  LastMonthTillSameDate: "ПрошлыйМесяцДоТакойЖеДаты",
  Today: "Сегодня",
  NextTenDays: "СледующаяДекада",
  NextTenDaysTillSameDayNumber: "СледующаяДекадаДоТакогоЖеНомераДня",
  NextWeek: "СледующаяНеделя",
  NextWeekTillSameWeekDay: "СледующаяНеделяДоТакогоЖеДняНедели",
  NextHalfYear: "СледующееПолугодие",
  NextHalfYearTillSameDate: "СледующееПолугодиеДоТакойЖеДаты",
  Next7Days: "Следующие7Дней",
  NextYear: "СледующийГод",
  NextYearTillSameDate: "СледующийГодДоТакойЖеДаты",
  NextQuarter: "СледующийКвартал",
  NextQuarterTillSameDate: "СледующийКварталДоТакойЖеДаты",
  NextMonth: "СледующийМесяц",
  NextMonthTillSameDate: "СледующийМесяцДоТакойЖеДаты",
  FromBeginningOfThisYear: "СНачалаЭтогоГода",
  FromBeginningOfThisQuarter: "СНачалаЭтогоКвартала",
  FromBeginningOfThisMonth: "СНачалаЭтогоМесяца",
  FromBeginningOfThisHalfYear: "СНачалаЭтогоПолугодия",
  FromBeginningOfThisTenDays: "СНачалаЭтойДекады",
  FromBeginningOfThisWeek: "СНачалаЭтойНедели",
  ThisTenDays: "ЭтаДекада",
  ThisWeek: "ЭтаНеделя",
  ThisHalfYear: "ЭтоПолугодие",
  ThisYear: "ЭтотГод",
  ThisQuarter: "ЭтотКвартал",
  ThisMonth: "ЭтотМесяц",
} as const

export const StandardPeriodVariantFromEnterprise = {
  Вчера: "Yesterday",
  ДоКонцаЭтогоГода: "TillEndOfThisYear",
  ДоКонцаЭтогоКвартала: "TillEndOfThisQuarter",
  ДоКонцаЭтогоМесяца: "TillEndOfThisMonth",
  ДоКонцаЭтогоПолугодия: "TillEndOfThisHalfYear",
  ДоКонцаЭтойДекады: "TillEndOfThisTenDays",
  ДоКонцаЭтойНедели: "TillEndOfThisWeek",
  Завтра: "Tomorrow",
  Месяц: "Month",
  Последние7Дней: "Last7Days",
  ПроизвольныйПериод: "Custom",
  ПрошлаяДекада: "LastTenDays",
  ПрошлаяДекадаДоТакогоЖеНомераДня: "LastTenDaysTillSameDayNumber",
  ПрошлаяНеделя: "LastWeek",
  ПрошлаяНеделяДоТакогоЖеДняНедели: "LastWeekTillSameWeekDay",
  ПрошлоеПолугодие: "LastHalfYear",
  ПрошлоеПолугодиеДоТакойЖеДаты: "LastHalfYearTillSameDate",
  ПрошлыйГод: "LastYear",
  ПрошлыйГодДоТакойЖеДаты: "LastYearTillSameDate",
  ПрошлыйКвартал: "LastQuarter",
  ПрошлыйКварталДоТакойЖеДаты: "LastQuarterTillSameDate",
  ПрошлыйМесяц: "LastMonth",
  ПрошлыйМесяцДоТакойЖеДаты: "LastMonthTillSameDate",
  Сегодня: "Today",
  СледующаяДекада: "NextTenDays",
  СледующаяДекадаДоТакогоЖеНомераДня: "NextTenDaysTillSameDayNumber",
  СледующаяНеделя: "NextWeek",
  СледующаяНеделяДоТакогоЖеДняНедели: "NextWeekTillSameWeekDay",
  СледующееПолугодие: "NextHalfYear",
  СледующееПолугодиеДоТакойЖеДаты: "NextHalfYearTillSameDate",
  Следующие7Дней: "Next7Days",
  СледующийГод: "NextYear",
  СледующийГодДоТакойЖеДаты: "NextYearTillSameDate",
  СледующийКвартал: "NextQuarter",
  СледующийКварталДоТакойЖеДаты: "NextQuarterTillSameDate",
  СледующийМесяц: "NextMonth",
  СледующийМесяцДоТакойЖеДаты: "NextMonthTillSameDate",
  СНачалаЭтогоГода: "FromBeginningOfThisYear",
  СНачалаЭтогоКвартала: "FromBeginningOfThisQuarter",
  СНачалаЭтогоМесяца: "FromBeginningOfThisMonth",
  СНачалаЭтогоПолугодия: "FromBeginningOfThisHalfYear",
  СНачалаЭтойДекады: "FromBeginningOfThisTenDays",
  СНачалаЭтойНедели: "FromBeginningOfThisWeek",
  ЭтаДекада: "ThisTenDays",
  ЭтаНеделя: "ThisWeek",
  ЭтоПолугодие: "ThisHalfYear",
  ЭтотГод: "ThisYear",
  ЭтотКвартал: "ThisQuarter",
  ЭтотМесяц: "ThisMonth",
} as const

export type StandardPeriodVariant = keyof typeof StandardPeriodVariantToEnterprise
export type StandardPeriodVariantEnterprise = keyof typeof StandardPeriodVariantFromEnterprise

export const StringEncodingMethodToEnterprise = {
  URLInURLEncoding: "URLВКодировкеURL",
  URLEncoding: "КодировкаURL",
} as const

export const StringEncodingMethodFromEnterprise = {
  URLВКодировкеURL: "URLInURLEncoding",
  КодировкаURL: "URLEncoding",
} as const

export type StringEncodingMethod = keyof typeof StringEncodingMethodToEnterprise
export type StringEncodingMethodEnterprise = keyof typeof StringEncodingMethodFromEnterprise

export const TextEncodingToEnterprise = {
  ANSI: "ANSI",
  OEM: "OEM",
  UTF16: "UTF16",
  UTF8: "UTF8",
  System: "Системная",
} as const

export const TextEncodingFromEnterprise = {
  ANSI: "ANSI",
  OEM: "OEM",
  UTF16: "UTF16",
  UTF8: "UTF8",
  Системная: "System",
} as const

export type TextEncoding = keyof typeof TextEncodingToEnterprise
export type TextEncodingEnterprise = keyof typeof TextEncodingFromEnterprise

export const TransactionsIsolationLevelToEnterprise = {
  Auto: "Авто",
  RepeatableRead: "ПовторяемоеЧтение",
  Serializable: "Упорядочиваемость",
  ReadCommitted: "ЧтениеЗафиксированных",
  ReadUncommitted: "ЧтениеНезафиксированных",
} as const

export const TransactionsIsolationLevelFromEnterprise = {
  Авто: "Auto",
  ПовторяемоеЧтение: "RepeatableRead",
  Упорядочиваемость: "Serializable",
  ЧтениеЗафиксированных: "ReadCommitted",
  ЧтениеНезафиксированных: "ReadUncommitted",
} as const

export type TransactionsIsolationLevel = keyof typeof TransactionsIsolationLevelToEnterprise
export type TransactionsIsolationLevelEnterprise = keyof typeof TransactionsIsolationLevelFromEnterprise

export const UUIDVersionToEnterprise = {
  Version1: "Версия1",
  Version3: "Версия3",
  Version4: "Версия4",
  Version5: "Версия5",
} as const

export const UUIDVersionFromEnterprise = {
  Версия1: "Version1",
  Версия3: "Version3",
  Версия4: "Version4",
  Версия5: "Version5",
} as const

export type UUIDVersion = keyof typeof UUIDVersionToEnterprise
export type UUIDVersionEnterprise = keyof typeof UUIDVersionFromEnterprise

export const UpdateOnDataChangeToEnterprise = {
  Auto: "Авто",
  DontUpdate: "НеОбновлять",
} as const

export const UpdateOnDataChangeFromEnterprise = {
  Авто: "Auto",
  НеОбновлять: "DontUpdate",
} as const

export type UpdateOnDataChange = keyof typeof UpdateOnDataChangeToEnterprise
export type UpdateOnDataChangeEnterprise = keyof typeof UpdateOnDataChangeFromEnterprise

export const UserPasswordHashAlgorithmTypeToEnterprise = {
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export const UserPasswordHashAlgorithmTypeFromEnterprise = {
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export type UserPasswordHashAlgorithmType = keyof typeof UserPasswordHashAlgorithmTypeToEnterprise
export type UserPasswordHashAlgorithmTypeEnterprise = keyof typeof UserPasswordHashAlgorithmTypeFromEnterprise

export const WorkingDateModeToEnterprise = {
  UseCurrentDate: "ИспользоватьТекущуюДату",
  Assign: "Назначать",
} as const

export const WorkingDateModeFromEnterprise = {
  ИспользоватьТекущуюДату: "UseCurrentDate",
  Назначать: "Assign",
} as const

export type WorkingDateMode = keyof typeof WorkingDateModeToEnterprise
export type WorkingDateModeEnterprise = keyof typeof WorkingDateModeFromEnterprise

export const XBaseEncodingToEnterprise = {
  ANSI: "ANSI",
  OEM: "OEM",
} as const

export const XBaseEncodingFromEnterprise = {
  ANSI: "ANSI",
  OEM: "OEM",
} as const

export type XBaseEncoding = keyof typeof XBaseEncodingToEnterprise
export type XBaseEncodingEnterprise = keyof typeof XBaseEncodingFromEnterprise

export const CalendarEventRecurrenceToEnterprise = {
  Weekly: "КаждуюНеделю",
  Yearly: "КаждыйГод",
  Daily: "КаждыйДень",
  Monthly: "КаждыйМесяц",
  Once: "ОдинРаз",
} as const

export const CalendarEventRecurrenceFromEnterprise = {
  КаждуюНеделю: "Weekly",
  КаждыйГод: "Yearly",
  КаждыйДень: "Daily",
  КаждыйМесяц: "Monthly",
  ОдинРаз: "Once",
} as const

export type CalendarEventRecurrence = keyof typeof CalendarEventRecurrenceToEnterprise
export type CalendarEventRecurrenceEnterprise = keyof typeof CalendarEventRecurrenceFromEnterprise

export const ContactDataAddressTypeToEnterprise = {
  Home: "Домашний",
  Other: "Другой",
  Work: "Рабочий",
} as const

export const ContactDataAddressTypeFromEnterprise = {
  Домашний: "Home",
  Другой: "Other",
  Рабочий: "Work",
} as const

export type ContactDataAddressType = keyof typeof ContactDataAddressTypeToEnterprise
export type ContactDataAddressTypeEnterprise = keyof typeof ContactDataAddressTypeFromEnterprise

export const ContactDataEmailAddressTypeToEnterprise = {
  Home: "Домашний",
  Other: "Другой",
  Mobile: "Мобильный",
  Work: "Рабочий",
} as const

export const ContactDataEmailAddressTypeFromEnterprise = {
  Домашний: "Home",
  Другой: "Other",
  Мобильный: "Mobile",
  Рабочий: "Work",
} as const

export type ContactDataEmailAddressType = keyof typeof ContactDataEmailAddressTypeToEnterprise
export type ContactDataEmailAddressTypeEnterprise = keyof typeof ContactDataEmailAddressTypeFromEnterprise

export const ContactDataInstantMessagingAddressTypeToEnterprise = {
  Home: "Домашний",
  Other: "Другой",
  Work: "Рабочий",
} as const

export const ContactDataInstantMessagingAddressTypeFromEnterprise = {
  Домашний: "Home",
  Другой: "Other",
  Рабочий: "Work",
} as const

export type ContactDataInstantMessagingAddressType = keyof typeof ContactDataInstantMessagingAddressTypeToEnterprise
export type ContactDataInstantMessagingAddressTypeEnterprise =
  keyof typeof ContactDataInstantMessagingAddressTypeFromEnterprise

export const ContactDataPhoneNumberTypeToEnterprise = {
  iPhone: "iPhone",
  Home: "Домашний",
  HomeFax: "ДомашнийФакс",
  Other: "Другой",
  OtherFax: "ДругойФакс",
  Mobile: "Мобильный",
  Main: "Основной",
  Work: "Рабочий",
  WorkMobile: "РабочийМобильный",
  WorkFax: "РабочийФакс",
} as const

export const ContactDataPhoneNumberTypeFromEnterprise = {
  iPhone: "iPhone",
  Домашний: "Home",
  ДомашнийФакс: "HomeFax",
  Другой: "Other",
  ДругойФакс: "OtherFax",
  Мобильный: "Mobile",
  Основной: "Main",
  Рабочий: "Work",
  РабочийМобильный: "WorkMobile",
  РабочийФакс: "WorkFax",
} as const

export type ContactDataPhoneNumberType = keyof typeof ContactDataPhoneNumberTypeToEnterprise
export type ContactDataPhoneNumberTypeEnterprise = keyof typeof ContactDataPhoneNumberTypeFromEnterprise

export const ContactDataRelationshipTypeToEnterprise = {
  Brother: "Брат",
  DomesticPartner: "ГражданскийСупруг",
  Friend: "Друг",
  Other: "Другой",
  Mother: "Мать",
  Father: "Отец",
  Partner: "Партнер",
  Assistant: "Помощник",
  Child: "Ребенок",
  Parent: "Родитель",
  Relative: "Родственник",
  Manager: "Руководитель",
  Sister: "Сестра",
  Spouse: "Супруг",
} as const

export const ContactDataRelationshipTypeFromEnterprise = {
  Брат: "Brother",
  ГражданскийСупруг: "DomesticPartner",
  Друг: "Friend",
  Другой: "Other",
  Мать: "Mother",
  Отец: "Father",
  Партнер: "Partner",
  Помощник: "Assistant",
  Ребенок: "Child",
  Родитель: "Parent",
  Родственник: "Relative",
  Руководитель: "Manager",
  Сестра: "Sister",
  Супруг: "Spouse",
} as const

export type ContactDataRelationshipType = keyof typeof ContactDataRelationshipTypeToEnterprise
export type ContactDataRelationshipTypeEnterprise = keyof typeof ContactDataRelationshipTypeFromEnterprise

export const ContactDataURLTypeToEnterprise = {
  FTP: "FTP",
  Blog: "Блог",
  Home: "Домашний",
  HomePage: "ДомашняяСтраница",
  Other: "Другой",
  Profile: "Профиль",
  Work: "Рабочий",
} as const

export const ContactDataURLTypeFromEnterprise = {
  FTP: "FTP",
  Блог: "Blog",
  Домашний: "Home",
  ДомашняяСтраница: "HomePage",
  Другой: "Other",
  Профиль: "Profile",
  Рабочий: "Work",
} as const

export type ContactDataURLType = keyof typeof ContactDataURLTypeToEnterprise
export type ContactDataURLTypeEnterprise = keyof typeof ContactDataURLTypeFromEnterprise

export const CallLogCallTypeToEnterprise = {
  Incoming: "Входящий",
  Outgoing: "Исходящий",
  Missed: "Пропущенный",
} as const

export const CallLogCallTypeFromEnterprise = {
  Входящий: "Incoming",
  Исходящий: "Outgoing",
  Пропущенный: "Missed",
} as const

export type CallLogCallType = keyof typeof CallLogCallTypeToEnterprise
export type CallLogCallTypeEnterprise = keyof typeof CallLogCallTypeFromEnterprise

export const TelephonyToolsCallEventVariantToEnterprise = {
  EndIncoming: "ЗавершениеВходящего",
  EndOutgoing: "ЗавершениеИсходящего",
  StartIncoming: "НачалоВходящего",
  StartOutgoing: "НачалоИсходящего",
  StartIncomingRinging: "НачалоСигналаВходящего",
} as const

export const TelephonyToolsCallEventVariantFromEnterprise = {
  ЗавершениеВходящего: "EndIncoming",
  ЗавершениеИсходящего: "EndOutgoing",
  НачалоВходящего: "StartIncoming",
  НачалоИсходящего: "StartOutgoing",
  НачалоСигналаВходящего: "StartIncomingRinging",
} as const

export type TelephonyToolsCallEventVariant = keyof typeof TelephonyToolsCallEventVariantToEnterprise
export type TelephonyToolsCallEventVariantEnterprise = keyof typeof TelephonyToolsCallEventVariantFromEnterprise

export const TelephonyToolsSMSTypeToEnterprise = {
  Queued: "ВОчереди",
  Incoming: "Входящее",
  Outgoing: "Исходящее",
  Sent: "Отправленное",
  Failed: "ОшибкаОтправки",
  Draft: "Черновик",
} as const

export const TelephonyToolsSMSTypeFromEnterprise = {
  ВОчереди: "Queued",
  Входящее: "Incoming",
  Исходящее: "Outgoing",
  Отправленное: "Sent",
  ОшибкаОтправки: "Failed",
  Черновик: "Draft",
} as const

export type TelephonyToolsSMSType = keyof typeof TelephonyToolsSMSTypeToEnterprise
export type TelephonyToolsSMSTypeEnterprise = keyof typeof TelephonyToolsSMSTypeFromEnterprise

export const AudioRecordingChannelUseToEnterprise = {
  Mono: "Моно",
  Stereo: "Стерео",
} as const

export const AudioRecordingChannelUseFromEnterprise = {
  Моно: "Mono",
  Стерео: "Stereo",
} as const

export type AudioRecordingChannelUse = keyof typeof AudioRecordingChannelUseToEnterprise
export type AudioRecordingChannelUseEnterprise = keyof typeof AudioRecordingChannelUseFromEnterprise

export const AudioRecordingFormatToEnterprise = {
  Mpeg4AAC: "Mpeg4AAC",
  WavPCM16bit: "WavPCM16bit",
} as const

export const AudioRecordingFormatFromEnterprise = {
  Mpeg4AAC: "Mpeg4AAC",
  WavPCM16bit: "WavPCM16bit",
} as const

export type AudioRecordingFormat = keyof typeof AudioRecordingFormatToEnterprise
export type AudioRecordingFormatEnterprise = keyof typeof AudioRecordingFormatFromEnterprise

export const BarcodeTypeToEnterprise = {
  Aztec: "Aztec",
  Codabar: "Codabar",
  Code128: "Code128",
  Code39: "Code39",
  Code93: "Code93",
  DataMatrix: "DataMatrix",
  EAN13: "EAN13",
  EAN8: "EAN8",
  ITF: "ITF",
  MaxiCode: "MaxiCode",
  PDF417: "PDF417",
  QRCode: "QRCode",
  RSS14: "RSS14",
  RSSExpanded: "RSSExpanded",
  UPCA: "UPCA",
  UPCE: "UPCE",
  All: "Все",
  Matrix: "Двухмерный",
  Linear: "Линейный",
} as const

export const BarcodeTypeFromEnterprise = {
  Aztec: "Aztec",
  Codabar: "Codabar",
  Code128: "Code128",
  Code39: "Code39",
  Code93: "Code93",
  DataMatrix: "DataMatrix",
  EAN13: "EAN13",
  EAN8: "EAN8",
  ITF: "ITF",
  MaxiCode: "MaxiCode",
  PDF417: "PDF417",
  QRCode: "QRCode",
  RSS14: "RSS14",
  RSSExpanded: "RSSExpanded",
  UPCA: "UPCA",
  UPCE: "UPCE",
  Все: "All",
  Двухмерный: "Matrix",
  Линейный: "Linear",
} as const

export type BarcodeType = keyof typeof BarcodeTypeToEnterprise
export type BarcodeTypeEnterprise = keyof typeof BarcodeTypeFromEnterprise

export const CameraLightingTypeToEnterprise = {
  Auto: "Авто",
  Enable: "Включена",
  Disable: "Выключена",
} as const

export const CameraLightingTypeFromEnterprise = {
  Авто: "Auto",
  Включена: "Enable",
  Выключена: "Disable",
} as const

export type CameraLightingType = keyof typeof CameraLightingTypeToEnterprise
export type CameraLightingTypeEnterprise = keyof typeof CameraLightingTypeFromEnterprise

export const DeviceCameraTypeToEnterprise = {
  Auto: "Авто",
  Rear: "Задняя",
  Front: "Передняя",
} as const

export const DeviceCameraTypeFromEnterprise = {
  Авто: "Auto",
  Задняя: "Rear",
  Передняя: "Front",
} as const

export type DeviceCameraType = keyof typeof DeviceCameraTypeToEnterprise
export type DeviceCameraTypeEnterprise = keyof typeof DeviceCameraTypeFromEnterprise

export const DocumentScanningCheckingQualityToEnterprise = {
  DontCheck: "НеПроверять",
  WarnBelowHigh: "ПредупреждатьНижеВысокого",
  WarnBelowMedium: "ПредупреждатьНижеСреднего",
  RequireHigh: "ТребоватьВысокое",
  RequireMediumWarnBelowHigh: "ТребоватьСреднееПредупреждатьНижеВысокого",
} as const

export const DocumentScanningCheckingQualityFromEnterprise = {
  НеПроверять: "DontCheck",
  ПредупреждатьНижеВысокого: "WarnBelowHigh",
  ПредупреждатьНижеСреднего: "WarnBelowMedium",
  ТребоватьВысокое: "RequireHigh",
  ТребоватьСреднееПредупреждатьНижеВысокого: "RequireMediumWarnBelowHigh",
} as const

export type DocumentScanningCheckingQuality = keyof typeof DocumentScanningCheckingQualityToEnterprise
export type DocumentScanningCheckingQualityEnterprise = keyof typeof DocumentScanningCheckingQualityFromEnterprise

export const DocumentScanningOrientationDetectionModeToEnterprise = {
  Landscape: "Ландшафт",
  ByHorizontalTextLines: "ПоГоризонтальнымСтрокамТекста",
  ByFirstPageInSeries: "ПоПервойСтраницеСерии",
  ByDocumentPosition: "ПоРасположениюДокумента",
  Portrait: "Портрет",
} as const

export const DocumentScanningOrientationDetectionModeFromEnterprise = {
  Ландшафт: "Landscape",
  ПоГоризонтальнымСтрокамТекста: "ByHorizontalTextLines",
  ПоПервойСтраницеСерии: "ByFirstPageInSeries",
  ПоРасположениюДокумента: "ByDocumentPosition",
  Портрет: "Portrait",
} as const

export type DocumentScanningOrientationDetectionMode = keyof typeof DocumentScanningOrientationDetectionModeToEnterprise
export type DocumentScanningOrientationDetectionModeEnterprise =
  keyof typeof DocumentScanningOrientationDetectionModeFromEnterprise

export const DocumentScanningProcessingFilterToEnterprise = {
  None: "Нет",
  Text: "Текст",
  TextWithPictures: "ТекстСКартинками",
} as const

export const DocumentScanningProcessingFilterFromEnterprise = {
  Нет: "None",
  Текст: "Text",
  ТекстСКартинками: "TextWithPictures",
} as const

export type DocumentScanningProcessingFilter = keyof typeof DocumentScanningProcessingFilterToEnterprise
export type DocumentScanningProcessingFilterEnterprise = keyof typeof DocumentScanningProcessingFilterFromEnterprise

export const MultimediaRecordingStopButtonPlacementToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  Left: "Лево",
  LeftTop: "ЛевоВерх",
  LeftBottom: "ЛевоНиз",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
  RightTop: "ПравоВерх",
  RightBottom: "ПравоНиз",
} as const

export const MultimediaRecordingStopButtonPlacementFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Лево: "Left",
  ЛевоВерх: "LeftTop",
  ЛевоНиз: "LeftBottom",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
  ПравоВерх: "RightTop",
  ПравоНиз: "RightBottom",
} as const

export type MultimediaRecordingStopButtonPlacement = keyof typeof MultimediaRecordingStopButtonPlacementToEnterprise
export type MultimediaRecordingStopButtonPlacementEnterprise =
  keyof typeof MultimediaRecordingStopButtonPlacementFromEnterprise

export const VideoQualityToEnterprise = {
  Auto: "Авто",
  High: "Высокое",
  Low: "Низкое",
} as const

export const VideoQualityFromEnterprise = {
  Авто: "Auto",
  Высокое: "High",
  Низкое: "Low",
} as const

export type VideoQuality = keyof typeof VideoQualityToEnterprise
export type VideoQualityEnterprise = keyof typeof VideoQualityFromEnterprise

export const QuerySchemaAvailableTableParameterTypeToEnterprise = {
  Variant: "Вариант",
  Value: "Значение",
  Array: "Массив",
  Order: "Порядок",
  FieldList: "СписокПолей",
  Where: "Условие",
} as const

export const QuerySchemaAvailableTableParameterTypeFromEnterprise = {
  Вариант: "Variant",
  Значение: "Value",
  Массив: "Array",
  Порядок: "Order",
  СписокПолей: "FieldList",
  Условие: "Where",
} as const

export type QuerySchemaAvailableTableParameterType = keyof typeof QuerySchemaAvailableTableParameterTypeToEnterprise
export type QuerySchemaAvailableTableParameterTypeEnterprise =
  keyof typeof QuerySchemaAvailableTableParameterTypeFromEnterprise

export const QuerySchemaJoinTypeToEnterprise = {
  Inner: "Внутреннее",
  LeftOuter: "ЛевоеВнешнее",
  FullOuter: "ПолноеВнешнее",
  RightOuter: "ПравоеВнешнее",
} as const

export const QuerySchemaJoinTypeFromEnterprise = {
  Внутреннее: "Inner",
  ЛевоеВнешнее: "LeftOuter",
  ПолноеВнешнее: "FullOuter",
  ПравоеВнешнее: "RightOuter",
} as const

export type QuerySchemaJoinType = keyof typeof QuerySchemaJoinTypeToEnterprise
export type QuerySchemaJoinTypeEnterprise = keyof typeof QuerySchemaJoinTypeFromEnterprise

export const QuerySchemaOrderDirectionToEnterprise = {
  Ascending: "ПоВозрастанию",
  HierarchyAscending: "ПоВозрастаниюИерархии",
  Descending: "ПоУбыванию",
  HierarchyDescending: "ПоУбываниюИерархии",
} as const

export const QuerySchemaOrderDirectionFromEnterprise = {
  ПоВозрастанию: "Ascending",
  ПоВозрастаниюИерархии: "HierarchyAscending",
  ПоУбыванию: "Descending",
  ПоУбываниюИерархии: "HierarchyDescending",
} as const

export type QuerySchemaOrderDirection = keyof typeof QuerySchemaOrderDirectionToEnterprise
export type QuerySchemaOrderDirectionEnterprise = keyof typeof QuerySchemaOrderDirectionFromEnterprise

export const QuerySchemaPeriodAdditionTypeToEnterprise = {
  NoAddition: "БезДополнения",
  Year: "Год",
  TenDays: "Декада",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Minute: "Минута",
  Week: "Неделя",
  HalfYear: "Полугодие",
  Second: "Секунда",
  Hour: "Час",
} as const

export const QuerySchemaPeriodAdditionTypeFromEnterprise = {
  БезДополнения: "NoAddition",
  Год: "Year",
  Декада: "TenDays",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Минута: "Minute",
  Неделя: "Week",
  Полугодие: "HalfYear",
  Секунда: "Second",
  Час: "Hour",
} as const

export type QuerySchemaPeriodAdditionType = keyof typeof QuerySchemaPeriodAdditionTypeToEnterprise
export type QuerySchemaPeriodAdditionTypeEnterprise = keyof typeof QuerySchemaPeriodAdditionTypeFromEnterprise

export const QuerySchemaTotalCalculationFieldTypeToEnterprise = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const QuerySchemaTotalCalculationFieldTypeFromEnterprise = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type QuerySchemaTotalCalculationFieldType = keyof typeof QuerySchemaTotalCalculationFieldTypeToEnterprise
export type QuerySchemaTotalCalculationFieldTypeEnterprise =
  keyof typeof QuerySchemaTotalCalculationFieldTypeFromEnterprise

export const QuerySchemaUnionTypeToEnterprise = {
  Union: "Объединить",
  UnionAll: "ОбъединитьВсе",
} as const

export const QuerySchemaUnionTypeFromEnterprise = {
  Объединить: "Union",
  ОбъединитьВсе: "UnionAll",
} as const

export type QuerySchemaUnionType = keyof typeof QuerySchemaUnionTypeToEnterprise
export type QuerySchemaUnionTypeEnterprise = keyof typeof QuerySchemaUnionTypeFromEnterprise

export const NewPlannerItemsTextTypeToEnterprise = {
  String: "Строка",
  FormattedString: "ФорматированнаяСтрока",
} as const

export const NewPlannerItemsTextTypeFromEnterprise = {
  Строка: "String",
  ФорматированнаяСтрока: "FormattedString",
} as const

export type NewPlannerItemsTextType = keyof typeof NewPlannerItemsTextTypeToEnterprise
export type NewPlannerItemsTextTypeEnterprise = keyof typeof NewPlannerItemsTextTypeFromEnterprise

export const PlannerCommandSourceToEnterprise = {
  Action: "Действие",
  URL: "НавигационнаяСсылка",
  WrappedTimeScaleHeaderArea: "ОбластьПеренесенногоЗаголовкаШкалыВремени",
  EmptyItemsArea: "ПустаяОбластьЭлементов",
  DimensionItem: "ЭлементИзмерения",
  TimeScaleItem: "ЭлементШкалыВремени",
  Items: "Элементы",
} as const

export const PlannerCommandSourceFromEnterprise = {
  Действие: "Action",
  НавигационнаяСсылка: "URL",
  ОбластьПеренесенногоЗаголовкаШкалыВремени: "WrappedTimeScaleHeaderArea",
  ПустаяОбластьЭлементов: "EmptyItemsArea",
  ЭлементИзмерения: "DimensionItem",
  ЭлементШкалыВремени: "TimeScaleItem",
  Элементы: "Items",
} as const

export type PlannerCommandSource = keyof typeof PlannerCommandSourceToEnterprise
export type PlannerCommandSourceEnterprise = keyof typeof PlannerCommandSourceFromEnterprise

export const PlannerInsideDragActionToEnterprise = {
  Select: "Выделение",
  Copy: "Копирование",
  Edit: "Редактирование",
  Create: "Создание",
} as const

export const PlannerInsideDragActionFromEnterprise = {
  Выделение: "Select",
  Копирование: "Copy",
  Редактирование: "Edit",
  Создание: "Create",
} as const

export type PlannerInsideDragAction = keyof typeof PlannerInsideDragActionToEnterprise
export type PlannerInsideDragActionEnterprise = keyof typeof PlannerInsideDragActionFromEnterprise

export const PlannerInsideDragBoundaryChangeVariantToEnterprise = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
} as const

export const PlannerInsideDragBoundaryChangeVariantFromEnterprise = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
} as const

export type PlannerInsideDragBoundaryChangeVariant = keyof typeof PlannerInsideDragBoundaryChangeVariantToEnterprise
export type PlannerInsideDragBoundaryChangeVariantEnterprise =
  keyof typeof PlannerInsideDragBoundaryChangeVariantFromEnterprise

export const PlannerItemActionLocationToEnterprise = {
  EndOfItem: "ВКонцеЭлемента",
  EndOfText: "ПослеТекста",
} as const

export const PlannerItemActionLocationFromEnterprise = {
  ВКонцеЭлемента: "EndOfItem",
  ПослеТекста: "EndOfText",
} as const

export type PlannerItemActionLocation = keyof typeof PlannerItemActionLocationToEnterprise
export type PlannerItemActionLocationEnterprise = keyof typeof PlannerItemActionLocationFromEnterprise

export const PlannerItemEnableEditModeToEnterprise = {
  DisableDragAndStretch: "ЗапретитьПеретаскиваниеИРастягивание",
  DisableStretch: "ЗапретитьРастягивание",
  DisableEdit: "ЗапретитьРедактирование",
  EnableEdit: "РазрешитьРедактирование",
} as const

export const PlannerItemEnableEditModeFromEnterprise = {
  ЗапретитьПеретаскиваниеИРастягивание: "DisableDragAndStretch",
  ЗапретитьРастягивание: "DisableStretch",
  ЗапретитьРедактирование: "DisableEdit",
  РазрешитьРедактирование: "EnableEdit",
} as const

export type PlannerItemEnableEditMode = keyof typeof PlannerItemEnableEditModeToEnterprise
export type PlannerItemEnableEditModeEnterprise = keyof typeof PlannerItemEnableEditModeFromEnterprise

export const PlannerItemsBehaviorOnLackOfSpaceToEnterprise = {
  ShowAllItems: "ОтображатьВсеЭлементы",
  CollapseItems: "СворачиватьЭлементы",
} as const

export const PlannerItemsBehaviorOnLackOfSpaceFromEnterprise = {
  ОтображатьВсеЭлементы: "ShowAllItems",
  СворачиватьЭлементы: "CollapseItems",
} as const

export type PlannerItemsBehaviorOnLackOfSpace = keyof typeof PlannerItemsBehaviorOnLackOfSpaceToEnterprise
export type PlannerItemsBehaviorOnLackOfSpaceEnterprise = keyof typeof PlannerItemsBehaviorOnLackOfSpaceFromEnterprise

export const PlannerItemsTimeRepresentationToEnterprise = {
  BeginTime: "ВремяНачала",
  BeginAndEndTime: "ВремяНачалаИКонца",
  DontDisplay: "НеОтображать",
} as const

export const PlannerItemsTimeRepresentationFromEnterprise = {
  ВремяНачала: "BeginTime",
  ВремяНачалаИКонца: "BeginAndEndTime",
  НеОтображать: "DontDisplay",
} as const

export type PlannerItemsTimeRepresentation = keyof typeof PlannerItemsTimeRepresentationToEnterprise
export type PlannerItemsTimeRepresentationEnterprise = keyof typeof PlannerItemsTimeRepresentationFromEnterprise

export const PlannerStandardCommandToEnterprise = {
  QuickEditItem: "БыстроРедактироватьЭлемент",
  SelectWrappedTimeScaleHeader: "ВыбратьПеренесенныйЗаголовокШкалыВремени",
  SelectDimensionItem: "ВыбратьЭлементИзмерения",
  SelectTimeScaleItem: "ВыбратьЭлементШкалыВремени",
  ExecuteAction: "ВыполнитьДействие",
  CopyURL: "КопироватьНавигационнуюСсылку",
  GotoURL: "ПерейтиПоНавигационнойСсылке",
  EditItem: "РедактироватьЭлемент",
  CreateItem: "СоздатьЭлемент",
  DeleteItems: "УдалитьЭлементы",
} as const

export const PlannerStandardCommandFromEnterprise = {
  БыстроРедактироватьЭлемент: "QuickEditItem",
  ВыбратьПеренесенныйЗаголовокШкалыВремени: "SelectWrappedTimeScaleHeader",
  ВыбратьЭлементИзмерения: "SelectDimensionItem",
  ВыбратьЭлементШкалыВремени: "SelectTimeScaleItem",
  ВыполнитьДействие: "ExecuteAction",
  КопироватьНавигационнуюСсылку: "CopyURL",
  ПерейтиПоНавигационнойСсылке: "GotoURL",
  РедактироватьЭлемент: "EditItem",
  СоздатьЭлемент: "CreateItem",
  УдалитьЭлементы: "DeleteItems",
} as const

export type PlannerStandardCommand = keyof typeof PlannerStandardCommandToEnterprise
export type PlannerStandardCommandEnterprise = keyof typeof PlannerStandardCommandFromEnterprise

export const JSONCharactersEscapeModeToEnterprise = {
  None: "Нет",
  NotASCIISymbols: "СимволыВнеASCII",
  SymbolsNotInBMP: "СимволыВнеBMP",
} as const

export const JSONCharactersEscapeModeFromEnterprise = {
  Нет: "None",
  СимволыВнеASCII: "NotASCIISymbols",
  СимволыВнеBMP: "SymbolsNotInBMP",
} as const

export type JSONCharactersEscapeMode = keyof typeof JSONCharactersEscapeModeToEnterprise
export type JSONCharactersEscapeModeEnterprise = keyof typeof JSONCharactersEscapeModeFromEnterprise

export const JSONDateFormatToEnterprise = {
  ISO: "ISO",
  JavaScript: "JavaScript",
  Microsoft: "Microsoft",
} as const

export const JSONDateFormatFromEnterprise = {
  ISO: "ISO",
  JavaScript: "JavaScript",
  Microsoft: "Microsoft",
} as const

export type JSONDateFormat = keyof typeof JSONDateFormatToEnterprise
export type JSONDateFormatEnterprise = keyof typeof JSONDateFormatFromEnterprise

export const JSONDateWritingVariantToEnterprise = {
  LocalDate: "ЛокальнаяДата",
  LocalDateWithOffset: "ЛокальнаяДатаСоСмещением",
  UniversalDate: "УниверсальнаяДата",
} as const

export const JSONDateWritingVariantFromEnterprise = {
  ЛокальнаяДата: "LocalDate",
  ЛокальнаяДатаСоСмещением: "LocalDateWithOffset",
  УниверсальнаяДата: "UniversalDate",
} as const

export type JSONDateWritingVariant = keyof typeof JSONDateWritingVariantToEnterprise
export type JSONDateWritingVariantEnterprise = keyof typeof JSONDateWritingVariantFromEnterprise

export const JSONLineBreakToEnterprise = {
  Unix: "Unix",
  Windows: "Windows",
  Auto: "Авто",
  None: "Нет",
} as const

export const JSONLineBreakFromEnterprise = {
  Unix: "Unix",
  Windows: "Windows",
  Авто: "Auto",
  Нет: "None",
} as const

export type JSONLineBreak = keyof typeof JSONLineBreakToEnterprise
export type JSONLineBreakEnterprise = keyof typeof JSONLineBreakFromEnterprise

export const JSONValueTypeToEnterprise = {
  Null: "Null",
  Boolean: "Булево",
  PropertyName: "ИмяСвойства",
  Comment: "Комментарий",
  ArrayEnd: "КонецМассива",
  ObjectEnd: "КонецОбъекта",
  ArrayStart: "НачалоМассива",
  ObjectStart: "НачалоОбъекта",
  None: "Ничего",
  String: "Строка",
  Number: "Число",
} as const

export const JSONValueTypeFromEnterprise = {
  Null: "Null",
  Булево: "Boolean",
  ИмяСвойства: "PropertyName",
  Комментарий: "Comment",
  КонецМассива: "ArrayEnd",
  КонецОбъекта: "ObjectEnd",
  НачалоМассива: "ArrayStart",
  НачалоОбъекта: "ObjectStart",
  Ничего: "None",
  Строка: "String",
  Число: "Number",
} as const

export type JSONValueType = keyof typeof JSONValueTypeToEnterprise
export type JSONValueTypeEnterprise = keyof typeof JSONValueTypeFromEnterprise

export const DeliverableNotificationSendErrorTypeToEnterprise = {
  UnknownError: "НеизвестнаяОшибка",
  AuthenticationDataError: "ОшибкаДанныхАутентификации",
  SubscriberIDError: "ОшибкаИдентификатораПодписчика",
  DeliverableNotificationServiceConnectionError: "ОшибкаПодключенияКСервисуДоставляемыхУведомлений",
  DeliverableNotificationServiceError: "ОшибкаСервисаДоставляемыхУведомлений",
  NotificationBodyError: "ОшибкаТелаУведомления",
  NotificationsLimitExceeded: "ПревышенЛимитОтправкиУведомлений",
} as const

export const DeliverableNotificationSendErrorTypeFromEnterprise = {
  НеизвестнаяОшибка: "UnknownError",
  ОшибкаДанныхАутентификации: "AuthenticationDataError",
  ОшибкаИдентификатораПодписчика: "SubscriberIDError",
  ОшибкаПодключенияКСервисуДоставляемыхУведомлений: "DeliverableNotificationServiceConnectionError",
  ОшибкаСервисаДоставляемыхУведомлений: "DeliverableNotificationServiceError",
  ОшибкаТелаУведомления: "NotificationBodyError",
  ПревышенЛимитОтправкиУведомлений: "NotificationsLimitExceeded",
} as const

export type DeliverableNotificationSendErrorType = keyof typeof DeliverableNotificationSendErrorTypeToEnterprise
export type DeliverableNotificationSendErrorTypeEnterprise =
  keyof typeof DeliverableNotificationSendErrorTypeFromEnterprise

export const DeliverableNotificationSubscriberTypeToEnterprise = {
  APNS: "APNS",
  FCM: "FCM",
  GCM: "GCM",
  HPK: "HPK",
  RMS: "RMS",
  WNS: "WNS",
} as const

export const DeliverableNotificationSubscriberTypeFromEnterprise = {
  APNS: "APNS",
  FCM: "FCM",
  GCM: "GCM",
  HPK: "HPK",
  RMS: "RMS",
  WNS: "WNS",
} as const

export type DeliverableNotificationSubscriberType = keyof typeof DeliverableNotificationSubscriberTypeToEnterprise
export type DeliverableNotificationSubscriberTypeEnterprise =
  keyof typeof DeliverableNotificationSubscriberTypeFromEnterprise

export const SoundAlertToEnterprise = {
  None: "Нет",
  Default: "ПоУмолчанию",
} as const

export const SoundAlertFromEnterprise = {
  Нет: "None",
  ПоУмолчанию: "Default",
} as const

export type SoundAlert = keyof typeof SoundAlertToEnterprise
export type SoundAlertEnterprise = keyof typeof SoundAlertFromEnterprise

export const InAppPurchaseServiceToEnterprise = {
  AppleInAppPurchase: "AppleInAppPurchase",
  GooglePlayInAppBilling: "GooglePlayInAppBilling",
  HuaweiInAppPurchase: "HuaweiInAppPurchase",
  RuStoreInAppPurchase: "RuStoreInAppPurchase",
  WindowsInAppPurchase: "WindowsInAppPurchase",
} as const

export const InAppPurchaseServiceFromEnterprise = {
  AppleInAppPurchase: "AppleInAppPurchase",
  GooglePlayInAppBilling: "GooglePlayInAppBilling",
  HuaweiInAppPurchase: "HuaweiInAppPurchase",
  RuStoreInAppPurchase: "RuStoreInAppPurchase",
  WindowsInAppPurchase: "WindowsInAppPurchase",
} as const

export type InAppPurchaseService = keyof typeof InAppPurchaseServiceToEnterprise
export type InAppPurchaseServiceEnterprise = keyof typeof InAppPurchaseServiceFromEnterprise

export const InAppPurchaseTypeToEnterprise = {
  ContentForSale: "КонтентДляПродажи",
  Subscription: "Подписка",
} as const

export const InAppPurchaseTypeFromEnterprise = {
  КонтентДляПродажи: "ContentForSale",
  Подписка: "Subscription",
} as const

export type InAppPurchaseType = keyof typeof InAppPurchaseTypeToEnterprise
export type InAppPurchaseTypeEnterprise = keyof typeof InAppPurchaseTypeFromEnterprise

export const FTPSecureConnectionUsageLevelToEnterprise = {
  Auto: "Авто",
  UseIfPossible: "ИспользоватьЕслиВозможно",
  DontUse: "НеИспользовать",
  Require: "Требовать",
  RequireForControl: "ТребоватьДляУправления",
} as const

export const FTPSecureConnectionUsageLevelFromEnterprise = {
  Авто: "Auto",
  ИспользоватьЕслиВозможно: "UseIfPossible",
  НеИспользовать: "DontUse",
  Требовать: "Require",
  ТребоватьДляУправления: "RequireForControl",
} as const

export type FTPSecureConnectionUsageLevel = keyof typeof FTPSecureConnectionUsageLevelToEnterprise
export type FTPSecureConnectionUsageLevelEnterprise = keyof typeof FTPSecureConnectionUsageLevelFromEnterprise

export const InternetConnectionTypeToEnterprise = {
  WiFi: "WiFi",
  LAN: "ЛокальнаяСеть",
  NoConnection: "НетСоединения",
  CellularData: "СотовыеДанные",
} as const

export const InternetConnectionTypeFromEnterprise = {
  WiFi: "WiFi",
  ЛокальнаяСеть: "LAN",
  НетСоединения: "NoConnection",
  СотовыеДанные: "CellularData",
} as const

export type InternetConnectionType = keyof typeof InternetConnectionTypeToEnterprise
export type InternetConnectionTypeEnterprise = keyof typeof InternetConnectionTypeFromEnterprise

export const MacOSCertificateSelectModeToEnterprise = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const MacOSCertificateSelectModeFromEnterprise = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type MacOSCertificateSelectMode = keyof typeof MacOSCertificateSelectModeToEnterprise
export type MacOSCertificateSelectModeEnterprise = keyof typeof MacOSCertificateSelectModeFromEnterprise

export const OSCertificateSelectModeToEnterprise = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const OSCertificateSelectModeFromEnterprise = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type OSCertificateSelectMode = keyof typeof OSCertificateSelectModeToEnterprise
export type OSCertificateSelectModeEnterprise = keyof typeof OSCertificateSelectModeFromEnterprise

export const RoamingUsageToEnterprise = {
  Used: "Используется",
  Unknown: "Неизвестно",
  NotUsed: "НеИспользуется",
} as const

export const RoamingUsageFromEnterprise = {
  Используется: "Used",
  Неизвестно: "Unknown",
  НеИспользуется: "NotUsed",
} as const

export type RoamingUsage = keyof typeof RoamingUsageToEnterprise
export type RoamingUsageEnterprise = keyof typeof RoamingUsageFromEnterprise

export const ServerTLSCertificateRevocationCheckModeToEnterprise = {
  Auto: "Авто",
  DontCheck: "НеПроверять",
  SoftFail: "Нестрогий",
  Strict: "Строгий",
} as const

export const ServerTLSCertificateRevocationCheckModeFromEnterprise = {
  Авто: "Auto",
  НеПроверять: "DontCheck",
  Нестрогий: "SoftFail",
  Строгий: "Strict",
} as const

export type ServerTLSCertificateRevocationCheckMode = keyof typeof ServerTLSCertificateRevocationCheckModeToEnterprise
export type ServerTLSCertificateRevocationCheckModeEnterprise =
  keyof typeof ServerTLSCertificateRevocationCheckModeFromEnterprise

export const WindowsCertificateSelectModeToEnterprise = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const WindowsCertificateSelectModeFromEnterprise = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type WindowsCertificateSelectMode = keyof typeof WindowsCertificateSelectModeToEnterprise
export type WindowsCertificateSelectModeEnterprise = keyof typeof WindowsCertificateSelectModeFromEnterprise

export const ByteOrderToEnterprise = {
  BigEndian: "BigEndian",
  LittleEndian: "LittleEndian",
} as const

export const ByteOrderFromEnterprise = {
  BigEndian: "BigEndian",
  LittleEndian: "LittleEndian",
} as const

export type ByteOrder = keyof typeof ByteOrderToEnterprise
export type ByteOrderEnterprise = keyof typeof ByteOrderFromEnterprise

export const PositionInStreamToEnterprise = {
  End: "Конец",
  Begin: "Начало",
  Current: "Текущая",
} as const

export const PositionInStreamFromEnterprise = {
  Конец: "End",
  Начало: "Begin",
  Текущая: "Current",
} as const

export type PositionInStream = keyof typeof PositionInStreamToEnterprise
export type PositionInStreamEnterprise = keyof typeof PositionInStreamFromEnterprise

export const AdBannerRepresentationToEnterprise = {
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const AdBannerRepresentationFromEnterprise = {
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type AdBannerRepresentation = keyof typeof AdBannerRepresentationToEnterprise
export type AdBannerRepresentationEnterprise = keyof typeof AdBannerRepresentationFromEnterprise

export const AdStatusToEnterprise = {
  ReadyToDisplay: "ГотоваКОтображению",
  Downloading: "Загружается",
  NotDownloaded: "НеЗагружена",
  Displayed: "Отображается",
} as const

export const AdStatusFromEnterprise = {
  ГотоваКОтображению: "ReadyToDisplay",
  Загружается: "Downloading",
  НеЗагружена: "NotDownloaded",
  Отображается: "Displayed",
} as const

export type AdStatus = keyof typeof AdStatusToEnterprise
export type AdStatusEnterprise = keyof typeof AdStatusFromEnterprise

export const DataLineChangeTypeToEnterprise = {
  Add: "Добавление",
  Update: "Изменение",
  Move: "Перемещение",
  Delete: "Удаление",
} as const

export const DataLineChangeTypeFromEnterprise = {
  Добавление: "Add",
  Изменение: "Update",
  Перемещение: "Move",
  Удаление: "Delete",
} as const

export type DataLineChangeType = keyof typeof DataLineChangeTypeToEnterprise
export type DataLineChangeTypeEnterprise = keyof typeof DataLineChangeTypeFromEnterprise

export const RepresentableDocumentBatchFileTypeToEnterprise = {
  DOCX: "DOCX",
  HTML4: "HTML4",
  HTML5: "HTML5",
  ODS: "ODS",
  PDF: "PDF",
  TXT: "TXT",
  XLS: "XLS",
  XLSX: "XLSX",
} as const

export const RepresentableDocumentBatchFileTypeFromEnterprise = {
  DOCX: "DOCX",
  HTML4: "HTML4",
  HTML5: "HTML5",
  ODS: "ODS",
  PDF: "PDF",
  TXT: "TXT",
  XLS: "XLS",
  XLSX: "XLSX",
} as const

export type RepresentableDocumentBatchFileType = keyof typeof RepresentableDocumentBatchFileTypeToEnterprise
export type RepresentableDocumentBatchFileTypeEnterprise = keyof typeof RepresentableDocumentBatchFileTypeFromEnterprise

export const ClientApplicationAgentStateToEnterprise = {
  NotStarted: "НеЗапущен",
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const ClientApplicationAgentStateFromEnterprise = {
  НеЗапущен: "NotStarted",
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type ClientApplicationAgentState = keyof typeof ClientApplicationAgentStateToEnterprise
export type ClientApplicationAgentStateEnterprise = keyof typeof ClientApplicationAgentStateFromEnterprise

export const DataCompositionDataRelevanceOutputTypeToEnterprise = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionDataRelevanceOutputTypeFromEnterprise = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionDataRelevanceOutputType = keyof typeof DataCompositionDataRelevanceOutputTypeToEnterprise
export type DataCompositionDataRelevanceOutputTypeEnterprise =
  keyof typeof DataCompositionDataRelevanceOutputTypeFromEnterprise

export const DataCompositionDatabaseCopyOutputTypeToEnterprise = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionDatabaseCopyOutputTypeFromEnterprise = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionDatabaseCopyOutputType = keyof typeof DataCompositionDatabaseCopyOutputTypeToEnterprise
export type DataCompositionDatabaseCopyOutputTypeEnterprise =
  keyof typeof DataCompositionDatabaseCopyOutputTypeFromEnterprise

export const DatabaseCopiesStandardReplicationVersionToEnterprise = {
  Version1: "Версия1",
  Version2: "Версия2",
} as const

export const DatabaseCopiesStandardReplicationVersionFromEnterprise = {
  Версия1: "Version1",
  Версия2: "Version2",
} as const

export type DatabaseCopiesStandardReplicationVersion = keyof typeof DatabaseCopiesStandardReplicationVersionToEnterprise
export type DatabaseCopiesStandardReplicationVersionEnterprise =
  keyof typeof DatabaseCopiesStandardReplicationVersionFromEnterprise

export const DatabaseCopiesUseToEnterprise = {
  Auto: "Авто",
  PreferUseCopies: "ИспользоватьПреимущественноКопии",
  UseCopiesOnly: "ИспользоватьТолькоКопии",
  DontUseCopies: "НеИспользоватьКопии",
} as const

export const DatabaseCopiesUseFromEnterprise = {
  Авто: "Auto",
  ИспользоватьПреимущественноКопии: "PreferUseCopies",
  ИспользоватьТолькоКопии: "UseCopiesOnly",
  НеИспользоватьКопии: "DontUseCopies",
} as const

export type DatabaseCopiesUse = keyof typeof DatabaseCopiesUseToEnterprise
export type DatabaseCopiesUseEnterprise = keyof typeof DatabaseCopiesUseFromEnterprise

export const DatabaseCopyContentItemFieldUseToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DatabaseCopyContentItemFieldUseFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DatabaseCopyContentItemFieldUse = keyof typeof DatabaseCopyContentItemFieldUseToEnterprise
export type DatabaseCopyContentItemFieldUseEnterprise = keyof typeof DatabaseCopyContentItemFieldUseFromEnterprise

export const DatabaseCopyDBMSTypeToEnterprise = {
  MSSQLServer: "MSSQLServer",
  OracleDatabase: "OracleDatabase",
  PostgreSQL: "PostgreSQL",
} as const

export const DatabaseCopyDBMSTypeFromEnterprise = {
  MSSQLServer: "MSSQLServer",
  OracleDatabase: "OracleDatabase",
  PostgreSQL: "PostgreSQL",
} as const

export type DatabaseCopyDBMSType = keyof typeof DatabaseCopyDBMSTypeToEnterprise
export type DatabaseCopyDBMSTypeEnterprise = keyof typeof DatabaseCopyDBMSTypeFromEnterprise

export const DatabaseCopyReplicationTypeToEnterprise = {
  External: "Внешняя",
  Standard: "Стандартная",
} as const

export const DatabaseCopyReplicationTypeFromEnterprise = {
  Внешняя: "External",
  Стандартная: "Standard",
} as const

export type DatabaseCopyReplicationType = keyof typeof DatabaseCopyReplicationTypeToEnterprise
export type DatabaseCopyReplicationTypeEnterprise = keyof typeof DatabaseCopyReplicationTypeFromEnterprise

export const DatabaseCopyStateToEnterprise = {
  TurnedOn: "Включена",
  TemporarilyTurnedOff: "ВременноОтключена",
  TurnedOff: "Отключена",
} as const

export const DatabaseCopyStateFromEnterprise = {
  Включена: "TurnedOn",
  ВременноОтключена: "TemporarilyTurnedOff",
  Отключена: "TurnedOff",
} as const

export type DatabaseCopyState = keyof typeof DatabaseCopyStateToEnterprise
export type DatabaseCopyStateEnterprise = keyof typeof DatabaseCopyStateFromEnterprise

export const DatabaseCopyTurnedOffReasonToEnterprise = {
  InvalidCopyDatabaseUseVariant: "НедопустимыйВариантИспользованияБазыДанныхКопии",
  DataInconsistency: "НесоответствиеДанных",
  QueryExecutionError: "ОшибкаВыполненияЗапроса",
  DatabaseConnectionError: "ОшибкаСоединенияСБазойДанных",
} as const

export const DatabaseCopyTurnedOffReasonFromEnterprise = {
  НедопустимыйВариантИспользованияБазыДанныхКопии: "InvalidCopyDatabaseUseVariant",
  НесоответствиеДанных: "DataInconsistency",
  ОшибкаВыполненияЗапроса: "QueryExecutionError",
  ОшибкаСоединенияСБазойДанных: "DatabaseConnectionError",
} as const

export type DatabaseCopyTurnedOffReason = keyof typeof DatabaseCopyTurnedOffReasonToEnterprise
export type DatabaseCopyTurnedOffReasonEnterprise = keyof typeof DatabaseCopyTurnedOffReasonFromEnterprise

export const DatabaseCopyUpdateStateToEnterprise = {
  InitialUpdateInProgress: "ВыполняетсяНачальноеОбновление",
  CurrentUpdateInProgress: "ВыполняетсяТекущееОбновление",
  PortionUpdateCompletedSuccessfully: "ЗавершеноОбновлениеПорцииУспешно",
  CompletedWithError: "ЗавершеноСОшибкой",
  CompletedSuccessfully: "ЗавершеноУспешно",
  Inactive: "Неактивно",
} as const

export const DatabaseCopyUpdateStateFromEnterprise = {
  ВыполняетсяНачальноеОбновление: "InitialUpdateInProgress",
  ВыполняетсяТекущееОбновление: "CurrentUpdateInProgress",
  ЗавершеноОбновлениеПорцииУспешно: "PortionUpdateCompletedSuccessfully",
  ЗавершеноСОшибкой: "CompletedWithError",
  ЗавершеноУспешно: "CompletedSuccessfully",
  Неактивно: "Inactive",
} as const

export type DatabaseCopyUpdateState = keyof typeof DatabaseCopyUpdateStateToEnterprise
export type DatabaseCopyUpdateStateEnterprise = keyof typeof DatabaseCopyUpdateStateFromEnterprise

export const RequiredDataRelevanceToEnterprise = {
  Auto: "Авто",
  Relevant: "Актуальные",
  Any: "Любые",
} as const

export const RequiredDataRelevanceFromEnterprise = {
  Авто: "Auto",
  Актуальные: "Relevant",
  Любые: "Any",
} as const

export type RequiredDataRelevance = keyof typeof RequiredDataRelevanceToEnterprise
export type RequiredDataRelevanceEnterprise = keyof typeof RequiredDataRelevanceFromEnterprise

export const CollaborationSystemCommandSourceToEnterprise = {
  Attachment: "Вложение",
  Action: "Действие",
  URL: "НавигационнаяСсылка",
  CurrentPageURL: "НавигационнаяСсылкаТекущейСтраницы",
  User: "Пользователь",
  Message: "Сообщение",
} as const

export const CollaborationSystemCommandSourceFromEnterprise = {
  Вложение: "Attachment",
  Действие: "Action",
  НавигационнаяСсылка: "URL",
  НавигационнаяСсылкаТекущейСтраницы: "CurrentPageURL",
  Пользователь: "User",
  Сообщение: "Message",
} as const

export type CollaborationSystemCommandSource = keyof typeof CollaborationSystemCommandSourceToEnterprise
export type CollaborationSystemCommandSourceEnterprise = keyof typeof CollaborationSystemCommandSourceFromEnterprise

export const CollaborationSystemDataDumpStatusToEnterprise = {
  Restoring: "Восстановление",
  Done: "Готово",
  Loading: "Загрузка",
  Error: "Ошибка",
  Creating: "Создание",
} as const

export const CollaborationSystemDataDumpStatusFromEnterprise = {
  Восстановление: "Restoring",
  Готово: "Done",
  Загрузка: "Loading",
  Ошибка: "Error",
  Создание: "Creating",
} as const

export type CollaborationSystemDataDumpStatus = keyof typeof CollaborationSystemDataDumpStatusToEnterprise
export type CollaborationSystemDataDumpStatusEnterprise = keyof typeof CollaborationSystemDataDumpStatusFromEnterprise

export const CollaborationSystemFromDataDumpRestoreStatusToEnterprise = {
  Error: "Ошибка",
  Success: "Успешно",
} as const

export const CollaborationSystemFromDataDumpRestoreStatusFromEnterprise = {
  Ошибка: "Error",
  Успешно: "Success",
} as const

export type CollaborationSystemFromDataDumpRestoreStatus =
  keyof typeof CollaborationSystemFromDataDumpRestoreStatusToEnterprise
export type CollaborationSystemFromDataDumpRestoreStatusEnterprise =
  keyof typeof CollaborationSystemFromDataDumpRestoreStatusFromEnterprise

export const CollaborationSystemMessageButtonPanelButtonActionToEnterprise = {
  RequestLocation: "ЗапроситьМестоположение",
  RequestPhone: "ЗапроситьТелефон",
  ProcessByBot: "ОбработатьБотом",
  ProcessOnClient: "ОбработатьНаКлиенте",
  SendMessage: "ОтправитьСообщение",
  SendMessageWithData: "ОтправитьСообщениеСДанными",
  GotoURL: "ПерейтиПоНавигационнойСсылке",
} as const

export const CollaborationSystemMessageButtonPanelButtonActionFromEnterprise = {
  ЗапроситьМестоположение: "RequestLocation",
  ЗапроситьТелефон: "RequestPhone",
  ОбработатьБотом: "ProcessByBot",
  ОбработатьНаКлиенте: "ProcessOnClient",
  ОтправитьСообщение: "SendMessage",
  ОтправитьСообщениеСДанными: "SendMessageWithData",
  ПерейтиПоНавигационнойСсылке: "GotoURL",
} as const

export type CollaborationSystemMessageButtonPanelButtonAction =
  keyof typeof CollaborationSystemMessageButtonPanelButtonActionToEnterprise
export type CollaborationSystemMessageButtonPanelButtonActionEnterprise =
  keyof typeof CollaborationSystemMessageButtonPanelButtonActionFromEnterprise

export const CollaborationSystemMessageButtonPanelButtonTypeToEnterprise = {
  Hyperlink: "Гиперссылка",
  UsualButton: "ОбычнаяКнопка",
} as const

export const CollaborationSystemMessageButtonPanelButtonTypeFromEnterprise = {
  Гиперссылка: "Hyperlink",
  ОбычнаяКнопка: "UsualButton",
} as const

export type CollaborationSystemMessageButtonPanelButtonType =
  keyof typeof CollaborationSystemMessageButtonPanelButtonTypeToEnterprise
export type CollaborationSystemMessageButtonPanelButtonTypeEnterprise =
  keyof typeof CollaborationSystemMessageButtonPanelButtonTypeFromEnterprise

export const CollaborationSystemNotificationRepresentationToEnterprise = {
  DontDisturb: "НеБеспокоить",
  Normal: "Обычное",
} as const

export const CollaborationSystemNotificationRepresentationFromEnterprise = {
  НеБеспокоить: "DontDisturb",
  Обычное: "Normal",
} as const

export type CollaborationSystemNotificationRepresentation =
  keyof typeof CollaborationSystemNotificationRepresentationToEnterprise
export type CollaborationSystemNotificationRepresentationEnterprise =
  keyof typeof CollaborationSystemNotificationRepresentationFromEnterprise

export const CollaborationSystemStandardCommandToEnterprise = {
  ExecuteAction: "ВыполнитьДействие",
  CopyAttachment: "КопироватьВложение",
  CopyURL: "КопироватьНавигационнуюСсылку",
  CopyMessage: "КопироватьСообщение",
  OpenAttachment: "ОткрытьВложение",
  GotoURL: "ПерейтиПоНавигационнойСсылке",
  ShareAttachment: "ПоделитьсяВложением",
  ShareMessage: "ПоделитьсяСообщением",
  ShowUserInfo: "ПоказатьИнформациюОПользователе",
  GetMessageURL: "ПолучитьНавигационнуюСсылкуСообщения",
  EditMessage: "РедактироватьСообщение",
  SaveAttachment: "СохранитьВложение",
  DeleteMessage: "УдалитьСообщение",
  QuoteMessage: "ЦитироватьСообщение",
} as const

export const CollaborationSystemStandardCommandFromEnterprise = {
  ВыполнитьДействие: "ExecuteAction",
  КопироватьВложение: "CopyAttachment",
  КопироватьНавигационнуюСсылку: "CopyURL",
  КопироватьСообщение: "CopyMessage",
  ОткрытьВложение: "OpenAttachment",
  ПерейтиПоНавигационнойСсылке: "GotoURL",
  ПоделитьсяВложением: "ShareAttachment",
  ПоделитьсяСообщением: "ShareMessage",
  ПоказатьИнформациюОПользователе: "ShowUserInfo",
  ПолучитьНавигационнуюСсылкуСообщения: "GetMessageURL",
  РедактироватьСообщение: "EditMessage",
  СохранитьВложение: "SaveAttachment",
  УдалитьСообщение: "DeleteMessage",
  ЦитироватьСообщение: "QuoteMessage",
} as const

export type CollaborationSystemStandardCommand = keyof typeof CollaborationSystemStandardCommandToEnterprise
export type CollaborationSystemStandardCommandEnterprise = keyof typeof CollaborationSystemStandardCommandFromEnterprise

export const CollaborationSystemUsersChoicePurposeToEnterprise = {
  MessageRecipient: "ПолучательСообщения",
  VideoconferenceParticipant: "УчастникВидеоконференции",
  ConversationMember: "УчастникОбсуждения",
} as const

export const CollaborationSystemUsersChoicePurposeFromEnterprise = {
  ПолучательСообщения: "MessageRecipient",
  УчастникВидеоконференции: "VideoconferenceParticipant",
  УчастникОбсуждения: "ConversationMember",
} as const

export type CollaborationSystemUsersChoicePurpose = keyof typeof CollaborationSystemUsersChoicePurposeToEnterprise
export type CollaborationSystemUsersChoicePurposeEnterprise =
  keyof typeof CollaborationSystemUsersChoicePurposeFromEnterprise

export const AdministrationActionOnResourceConsumptionLimitExcessToEnterprise = {
  TerminateSession: "ЗавершитьСеанс",
  None: "Нет",
  InterruptCurrentServerCall: "ПрерватьТекущийСерверныйВызов",
  SetThreadLowPriority: "УстановитьНизкийПриоритетПотока",
} as const

export const AdministrationActionOnResourceConsumptionLimitExcessFromEnterprise = {
  ЗавершитьСеанс: "TerminateSession",
  Нет: "None",
  ПрерватьТекущийСерверныйВызов: "InterruptCurrentServerCall",
  УстановитьНизкийПриоритетПотока: "SetThreadLowPriority",
} as const

export type AdministrationActionOnResourceConsumptionLimitExcess =
  keyof typeof AdministrationActionOnResourceConsumptionLimitExcessToEnterprise
export type AdministrationActionOnResourceConsumptionLimitExcessEnterprise =
  keyof typeof AdministrationActionOnResourceConsumptionLimitExcessFromEnterprise

export const AdministrationAssignmentRuleTypeToEnterprise = {
  Auto: "Авто",
  Assign: "Назначать",
  DontAssign: "НеНазначать",
} as const

export const AdministrationAssignmentRuleTypeFromEnterprise = {
  Авто: "Auto",
  Назначать: "Assign",
  НеНазначать: "DontAssign",
} as const

export type AdministrationAssignmentRuleType = keyof typeof AdministrationAssignmentRuleTypeToEnterprise
export type AdministrationAssignmentRuleTypeEnterprise = keyof typeof AdministrationAssignmentRuleTypeFromEnterprise

export const AdministrationConnectionSecurityLevelToEnterprise = {
  Secure: "Защищенное",
  SecureOnConnect: "ЗащищенноеПриУстановкеСоединения",
  Unsecure: "Незащищенное",
} as const

export const AdministrationConnectionSecurityLevelFromEnterprise = {
  Защищенное: "Secure",
  ЗащищенноеПриУстановкеСоединения: "SecureOnConnect",
  Незащищенное: "Unsecure",
} as const

export type AdministrationConnectionSecurityLevel = keyof typeof AdministrationConnectionSecurityLevelToEnterprise
export type AdministrationConnectionSecurityLevelEnterprise =
  keyof typeof AdministrationConnectionSecurityLevelFromEnterprise

export const AdministrationInfoBaseDeletionModeToEnterprise = {
  DontPerformActionsWithDatabase: "НеВыполнятьДействийСБазойДанных",
  ClearDatabase: "ОчиститьБазуДанных",
  DeleteDatabase: "УдалитьБазуДанных",
} as const

export const AdministrationInfoBaseDeletionModeFromEnterprise = {
  НеВыполнятьДействийСБазойДанных: "DontPerformActionsWithDatabase",
  ОчиститьБазуДанных: "ClearDatabase",
  УдалитьБазуДанных: "DeleteDatabase",
} as const

export type AdministrationInfoBaseDeletionMode = keyof typeof AdministrationInfoBaseDeletionModeToEnterprise
export type AdministrationInfoBaseDeletionModeEnterprise = keyof typeof AdministrationInfoBaseDeletionModeFromEnterprise

export const AdministrationProcessChoicePriorityToEnterprise = {
  ByMemory: "ПоПамяти",
  ByPerformance: "ПоПроизводительности",
} as const

export const AdministrationProcessChoicePriorityFromEnterprise = {
  ПоПамяти: "ByMemory",
  ПоПроизводительности: "ByPerformance",
} as const

export type AdministrationProcessChoicePriority = keyof typeof AdministrationProcessChoicePriorityToEnterprise
export type AdministrationProcessChoicePriorityEnterprise =
  keyof typeof AdministrationProcessChoicePriorityFromEnterprise

export const AdministrationResourceConsumptionCounterFilterTypeToEnterprise = {
  All: "Все",
  AllSelected: "ВсеВыбранные",
  AllButSelected: "ВсеКромеВыбранных",
} as const

export const AdministrationResourceConsumptionCounterFilterTypeFromEnterprise = {
  Все: "All",
  ВсеВыбранные: "AllSelected",
  ВсеКромеВыбранных: "AllButSelected",
} as const

export type AdministrationResourceConsumptionCounterFilterType =
  keyof typeof AdministrationResourceConsumptionCounterFilterTypeToEnterprise
export type AdministrationResourceConsumptionCounterFilterTypeEnterprise =
  keyof typeof AdministrationResourceConsumptionCounterFilterTypeFromEnterprise

export const AdministrationResourceConsumptionCounterGroupTypeToEnterprise = {
  Users: "Пользователи",
  DataSeparation: "РазделениеДанных",
} as const

export const AdministrationResourceConsumptionCounterGroupTypeFromEnterprise = {
  Пользователи: "Users",
  РазделениеДанных: "DataSeparation",
} as const

export type AdministrationResourceConsumptionCounterGroupType =
  keyof typeof AdministrationResourceConsumptionCounterGroupTypeToEnterprise
export type AdministrationResourceConsumptionCounterGroupTypeEnterprise =
  keyof typeof AdministrationResourceConsumptionCounterGroupTypeFromEnterprise

export const AdministrationWorkProcessStatusToEnterprise = {
  Used: "Используется",
  NotUsed: "НеИспользуется",
  Reserve: "Резервный",
} as const

export const AdministrationWorkProcessStatusFromEnterprise = {
  Используется: "Used",
  НеИспользуется: "NotUsed",
  Резервный: "Reserve",
} as const

export type AdministrationWorkProcessStatus = keyof typeof AdministrationWorkProcessStatusToEnterprise
export type AdministrationWorkProcessStatusEnterprise = keyof typeof AdministrationWorkProcessStatusFromEnterprise

export const DuplexPrintingTypeToEnterprise = {
  UsePrinterSettings: "ИспользоватьНастройкиПринтера",
  None: "Нет",
  FlipPagesUp: "ПереворотВверх",
  FlipPagesLeft: "ПереворотВлево",
} as const

export const DuplexPrintingTypeFromEnterprise = {
  ИспользоватьНастройкиПринтера: "UsePrinterSettings",
  Нет: "None",
  ПереворотВверх: "FlipPagesUp",
  ПереворотВлево: "FlipPagesLeft",
} as const

export type DuplexPrintingType = keyof typeof DuplexPrintingTypeToEnterprise
export type DuplexPrintingTypeEnterprise = keyof typeof DuplexPrintingTypeFromEnterprise

export const PageOrientationToEnterprise = {
  Landscape: "Ландшафт",
  Portrait: "Портрет",
} as const

export const PageOrientationFromEnterprise = {
  Ландшафт: "Landscape",
  Портрет: "Portrait",
} as const

export type PageOrientation = keyof typeof PageOrientationToEnterprise
export type PageOrientationEnterprise = keyof typeof PageOrientationFromEnterprise

export const PagePlacementAlternationToEnterprise = {
  Auto: "Авто",
  MirrorOnTop: "ЗеркальноСверху",
  MirrorOnLeft: "ЗеркальноСлева",
  DontUse: "НеИспользовать",
} as const

export const PagePlacementAlternationFromEnterprise = {
  Авто: "Auto",
  ЗеркальноСверху: "MirrorOnTop",
  ЗеркальноСлева: "MirrorOnLeft",
  НеИспользовать: "DontUse",
} as const

export type PagePlacementAlternation = keyof typeof PagePlacementAlternationToEnterprise
export type PagePlacementAlternationEnterprise = keyof typeof PagePlacementAlternationFromEnterprise

export const PrintAccuracyToEnterprise = {
  Auto: "Авто",
  Accurate: "Точная",
} as const

export const PrintAccuracyFromEnterprise = {
  Авто: "Auto",
  Точная: "Accurate",
} as const

export type PrintAccuracy = keyof typeof PrintAccuracyToEnterprise
export type PrintAccuracyEnterprise = keyof typeof PrintAccuracyFromEnterprise

export const SpreadsheetDocumentAreaFillTypeToEnterprise = {
  Parameter: "Параметр",
  Text: "Текст",
  Template: "Шаблон",
} as const

export const SpreadsheetDocumentAreaFillTypeFromEnterprise = {
  Параметр: "Parameter",
  Текст: "Text",
  Шаблон: "Template",
} as const

export type SpreadsheetDocumentAreaFillType = keyof typeof SpreadsheetDocumentAreaFillTypeToEnterprise
export type SpreadsheetDocumentAreaFillTypeEnterprise = keyof typeof SpreadsheetDocumentAreaFillTypeFromEnterprise

export const SpreadsheetDocumentCellAreaTypeToEnterprise = {
  Columns: "Колонки",
  Rectangle: "Прямоугольник",
  Rows: "Строки",
  Table: "Таблица",
} as const

export const SpreadsheetDocumentCellAreaTypeFromEnterprise = {
  Колонки: "Columns",
  Прямоугольник: "Rectangle",
  Строки: "Rows",
  Таблица: "Table",
} as const

export type SpreadsheetDocumentCellAreaType = keyof typeof SpreadsheetDocumentCellAreaTypeToEnterprise
export type SpreadsheetDocumentCellAreaTypeEnterprise = keyof typeof SpreadsheetDocumentCellAreaTypeFromEnterprise

export const SpreadsheetDocumentCellLineTypeToEnterprise = {
  LargeDashed: "БольшойПунктир",
  Double: "Двойная",
  None: "НетЛинии",
  ThinDashed: "РедкийПунктир",
  Solid: "Сплошная",
  Dotted: "Точечная",
  ThickDashed: "ЧастыйПунктир",
} as const

export const SpreadsheetDocumentCellLineTypeFromEnterprise = {
  БольшойПунктир: "LargeDashed",
  Двойная: "Double",
  НетЛинии: "None",
  РедкийПунктир: "ThinDashed",
  Сплошная: "Solid",
  Точечная: "Dotted",
  ЧастыйПунктир: "ThickDashed",
} as const

export type SpreadsheetDocumentCellLineType = keyof typeof SpreadsheetDocumentCellLineTypeToEnterprise
export type SpreadsheetDocumentCellLineTypeEnterprise = keyof typeof SpreadsheetDocumentCellLineTypeFromEnterprise

export const SpreadsheetDocumentDetailUseToEnterprise = {
  WithoutProcessing: "БезОбработки",
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const SpreadsheetDocumentDetailUseFromEnterprise = {
  БезОбработки: "WithoutProcessing",
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type SpreadsheetDocumentDetailUse = keyof typeof SpreadsheetDocumentDetailUseToEnterprise
export type SpreadsheetDocumentDetailUseEnterprise = keyof typeof SpreadsheetDocumentDetailUseFromEnterprise

export const SpreadsheetDocumentDrawingLineTypeToEnterprise = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const SpreadsheetDocumentDrawingLineTypeFromEnterprise = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type SpreadsheetDocumentDrawingLineType = keyof typeof SpreadsheetDocumentDrawingLineTypeToEnterprise
export type SpreadsheetDocumentDrawingLineTypeEnterprise = keyof typeof SpreadsheetDocumentDrawingLineTypeFromEnterprise

export const SpreadsheetDocumentDrawingTypeToEnterprise = {
  GeographicalSchema: "ГеографическаяСхема",
  Group: "Группа",
  Dendrogram: "Дендрограмма",
  Chart: "Диаграмма",
  GanttChart: "ДиаграммаГанта",
  Picture: "Картинка",
  Object: "Объект",
  Comment: "Примечание",
  Line: "Прямая",
  Rectangle: "Прямоугольник",
  PivotChart: "СводнаяДиаграмма",
  Text: "Текст",
  Ellipse: "Эллипс",
} as const

export const SpreadsheetDocumentDrawingTypeFromEnterprise = {
  ГеографическаяСхема: "GeographicalSchema",
  Группа: "Group",
  Дендрограмма: "Dendrogram",
  Диаграмма: "Chart",
  ДиаграммаГанта: "GanttChart",
  Картинка: "Picture",
  Объект: "Object",
  Примечание: "Comment",
  Прямая: "Line",
  Прямоугольник: "Rectangle",
  СводнаяДиаграмма: "PivotChart",
  Текст: "Text",
  Эллипс: "Ellipse",
} as const

export type SpreadsheetDocumentDrawingType = keyof typeof SpreadsheetDocumentDrawingTypeToEnterprise
export type SpreadsheetDocumentDrawingTypeEnterprise = keyof typeof SpreadsheetDocumentDrawingTypeFromEnterprise

export const SpreadsheetDocumentFileTypeToEnterprise = {
  ANSITXT: "ANSITXT",
  DOCX: "DOCX",
  HTML: "HTML",
  HTML3: "HTML3",
  HTML4: "HTML4",
  HTML5: "HTML5",
  MXL: "MXL",
  MXL7: "MXL7",
  ODS: "ODS",
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
  TXT: "TXT",
  XLS: "XLS",
  XLS95: "XLS95",
  XLS97: "XLS97",
  XLSX: "XLSX",
} as const

export const SpreadsheetDocumentFileTypeFromEnterprise = {
  ANSITXT: "ANSITXT",
  DOCX: "DOCX",
  HTML: "HTML",
  HTML3: "HTML3",
  HTML4: "HTML4",
  HTML5: "HTML5",
  MXL: "MXL",
  MXL7: "MXL7",
  ODS: "ODS",
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
  TXT: "TXT",
  XLS: "XLS",
  XLS95: "XLS95",
  XLS97: "XLS97",
  XLSX: "XLSX",
} as const

export type SpreadsheetDocumentFileType = keyof typeof SpreadsheetDocumentFileTypeToEnterprise
export type SpreadsheetDocumentFileTypeEnterprise = keyof typeof SpreadsheetDocumentFileTypeFromEnterprise

export const SpreadsheetDocumentGroupHeaderPlacementToEnterprise = {
  Auto: "Авто",
  End: "Конец",
  Begin: "Начало",
} as const

export const SpreadsheetDocumentGroupHeaderPlacementFromEnterprise = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Begin",
} as const

export type SpreadsheetDocumentGroupHeaderPlacement = keyof typeof SpreadsheetDocumentGroupHeaderPlacementToEnterprise
export type SpreadsheetDocumentGroupHeaderPlacementEnterprise =
  keyof typeof SpreadsheetDocumentGroupHeaderPlacementFromEnterprise

export const SpreadsheetDocumentPatternTypeToEnterprise = {
  WithoutPattern: "БезУзора",
  Solid: "Сплошной",
  Pattern1: "Узор1",
  Pattern10: "Узор10",
  Pattern11: "Узор11",
  Pattern12: "Узор12",
  Pattern13: "Узор13",
  Pattern14: "Узор14",
  Pattern15: "Узор15",
  Pattern16: "Узор16",
  Pattern17: "Узор17",
  Pattern2: "Узор2",
  Pattern3: "Узор3",
  Pattern4: "Узор4",
  Pattern5: "Узор5",
  Pattern6: "Узор6",
  Pattern7: "Узор7",
  Pattern8: "Узор8",
  Pattern9: "Узор9",
} as const

export const SpreadsheetDocumentPatternTypeFromEnterprise = {
  БезУзора: "WithoutPattern",
  Сплошной: "Solid",
  Узор1: "Pattern1",
  Узор10: "Pattern10",
  Узор11: "Pattern11",
  Узор12: "Pattern12",
  Узор13: "Pattern13",
  Узор14: "Pattern14",
  Узор15: "Pattern15",
  Узор16: "Pattern16",
  Узор17: "Pattern17",
  Узор2: "Pattern2",
  Узор3: "Pattern3",
  Узор4: "Pattern4",
  Узор5: "Pattern5",
  Узор6: "Pattern6",
  Узор7: "Pattern7",
  Узор8: "Pattern8",
  Узор9: "Pattern9",
} as const

export type SpreadsheetDocumentPatternType = keyof typeof SpreadsheetDocumentPatternTypeToEnterprise
export type SpreadsheetDocumentPatternTypeEnterprise = keyof typeof SpreadsheetDocumentPatternTypeFromEnterprise

export const SpreadsheetDocumentPointerTypeToEnterprise = {
  Regular: "Обычные",
  Special: "Специальные",
} as const

export const SpreadsheetDocumentPointerTypeFromEnterprise = {
  Обычные: "Regular",
  Специальные: "Special",
} as const

export type SpreadsheetDocumentPointerType = keyof typeof SpreadsheetDocumentPointerTypeToEnterprise
export type SpreadsheetDocumentPointerTypeEnterprise = keyof typeof SpreadsheetDocumentPointerTypeFromEnterprise

export const SpreadsheetDocumentSavedPicturesDensityToEnterprise = {
  High: "Высокая",
  Original: "Исходная",
  Low: "Низкая",
  Medium: "Средняя",
} as const

export const SpreadsheetDocumentSavedPicturesDensityFromEnterprise = {
  Высокая: "High",
  Исходная: "Original",
  Низкая: "Low",
  Средняя: "Medium",
} as const

export type SpreadsheetDocumentSavedPicturesDensity = keyof typeof SpreadsheetDocumentSavedPicturesDensityToEnterprise
export type SpreadsheetDocumentSavedPicturesDensityEnterprise =
  keyof typeof SpreadsheetDocumentSavedPicturesDensityFromEnterprise

export const SpreadsheetDocumentSelectionShowModeTypeToEnterprise = {
  Always: "Всегда",
  WhenActive: "ПриАктивности",
} as const

export const SpreadsheetDocumentSelectionShowModeTypeFromEnterprise = {
  Всегда: "Always",
  ПриАктивности: "WhenActive",
} as const

export type SpreadsheetDocumentSelectionShowModeType = keyof typeof SpreadsheetDocumentSelectionShowModeTypeToEnterprise
export type SpreadsheetDocumentSelectionShowModeTypeEnterprise =
  keyof typeof SpreadsheetDocumentSelectionShowModeTypeFromEnterprise

export const SpreadsheetDocumentShiftTypeToEnterprise = {
  WithoutShift: "БезСмещения",
  Vertical: "ПоВертикали",
  Horizontal: "ПоГоризонтали",
} as const

export const SpreadsheetDocumentShiftTypeFromEnterprise = {
  БезСмещения: "WithoutShift",
  ПоВертикали: "Vertical",
  ПоГоризонтали: "Horizontal",
} as const

export type SpreadsheetDocumentShiftType = keyof typeof SpreadsheetDocumentShiftTypeToEnterprise
export type SpreadsheetDocumentShiftTypeEnterprise = keyof typeof SpreadsheetDocumentShiftTypeFromEnterprise

export const SpreadsheetDocumentStepDirectionTypeToEnterprise = {
  WithoutMove: "БезПерехода",
  ByColumns: "ПоКолонкам",
  ByRows: "ПоСтрокам",
} as const

export const SpreadsheetDocumentStepDirectionTypeFromEnterprise = {
  БезПерехода: "WithoutMove",
  ПоКолонкам: "ByColumns",
  ПоСтрокам: "ByRows",
} as const

export type SpreadsheetDocumentStepDirectionType = keyof typeof SpreadsheetDocumentStepDirectionTypeToEnterprise
export type SpreadsheetDocumentStepDirectionTypeEnterprise =
  keyof typeof SpreadsheetDocumentStepDirectionTypeFromEnterprise

export const SpreadsheetDocumentTextPlacementTypeToEnterprise = {
  Auto: "Авто",
  Block: "Забивать",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const SpreadsheetDocumentTextPlacementTypeFromEnterprise = {
  Авто: "Auto",
  Забивать: "Block",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type SpreadsheetDocumentTextPlacementType = keyof typeof SpreadsheetDocumentTextPlacementTypeToEnterprise
export type SpreadsheetDocumentTextPlacementTypeEnterprise =
  keyof typeof SpreadsheetDocumentTextPlacementTypeFromEnterprise

export const SpreadsheetDocumentValuesReadingModeToEnterprise = {
  Value: "Значение",
  Text: "Текст",
} as const

export const SpreadsheetDocumentValuesReadingModeFromEnterprise = {
  Значение: "Value",
  Текст: "Text",
} as const

export type SpreadsheetDocumentValuesReadingMode = keyof typeof SpreadsheetDocumentValuesReadingModeToEnterprise
export type SpreadsheetDocumentValuesReadingModeEnterprise =
  keyof typeof SpreadsheetDocumentValuesReadingModeFromEnterprise

export const TextPositionRelativeToPictureToEnterprise = {
  Auto: "Авто",
  OnTop: "Поверх",
  Top: "Сверху",
  Left: "Слева",
  Bottom: "Снизу",
  Right: "Справа",
} as const

export const TextPositionRelativeToPictureFromEnterprise = {
  Авто: "Auto",
  Поверх: "OnTop",
  Сверху: "Top",
  Слева: "Left",
  Снизу: "Bottom",
  Справа: "Right",
} as const

export type TextPositionRelativeToPicture = keyof typeof TextPositionRelativeToPictureToEnterprise
export type TextPositionRelativeToPictureEnterprise = keyof typeof TextPositionRelativeToPictureFromEnterprise

export const UseSpreadsheetDocumentWidthReductionToEnterprise = {
  Auto: "Авто",
  DoNotReduceOnExcess: "ПриПревышенииНеСжимать",
  ReduceToMinimumOnExcess: "ПриПревышенииСжиматьДоМинимума",
  ReduceAlways: "СжиматьВсегда",
} as const

export const UseSpreadsheetDocumentWidthReductionFromEnterprise = {
  Авто: "Auto",
  ПриПревышенииНеСжимать: "DoNotReduceOnExcess",
  ПриПревышенииСжиматьДоМинимума: "ReduceToMinimumOnExcess",
  СжиматьВсегда: "ReduceAlways",
} as const

export type UseSpreadsheetDocumentWidthReduction = keyof typeof UseSpreadsheetDocumentWidthReductionToEnterprise
export type UseSpreadsheetDocumentWidthReductionEnterprise =
  keyof typeof UseSpreadsheetDocumentWidthReductionFromEnterprise

export const PivotTableColumnTotalPositionToEnterprise = {
  Left: "Лево",
  Right: "Право",
} as const

export const PivotTableColumnTotalPositionFromEnterprise = {
  Лево: "Left",
  Право: "Right",
} as const

export type PivotTableColumnTotalPosition = keyof typeof PivotTableColumnTotalPositionToEnterprise
export type PivotTableColumnTotalPositionEnterprise = keyof typeof PivotTableColumnTotalPositionFromEnterprise

export const PivotTableLinesShowTypeToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const PivotTableLinesShowTypeFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type PivotTableLinesShowType = keyof typeof PivotTableLinesShowTypeToEnterprise
export type PivotTableLinesShowTypeEnterprise = keyof typeof PivotTableLinesShowTypeFromEnterprise

export const PivotTableRowTotalPositionToEnterprise = {
  Top: "Верх",
  Bottom: "Низ",
} as const

export const PivotTableRowTotalPositionFromEnterprise = {
  Верх: "Top",
  Низ: "Bottom",
} as const

export type PivotTableRowTotalPosition = keyof typeof PivotTableRowTotalPositionToEnterprise
export type PivotTableRowTotalPositionEnterprise = keyof typeof PivotTableRowTotalPositionFromEnterprise

export const QueryRecordTypeToEnterprise = {
  DetailRecord: "ДетальнаяЗапись",
  GroupTotal: "ИтогПоГруппировке",
  TotalByHierarchy: "ИтогПоИерархии",
  Overall: "ОбщийИтог",
} as const

export const QueryRecordTypeFromEnterprise = {
  ДетальнаяЗапись: "DetailRecord",
  ИтогПоГруппировке: "GroupTotal",
  ИтогПоИерархии: "TotalByHierarchy",
  ОбщийИтог: "Overall",
} as const

export type QueryRecordType = keyof typeof QueryRecordTypeToEnterprise
export type QueryRecordTypeEnterprise = keyof typeof QueryRecordTypeFromEnterprise

export const QueryResultIterationToEnterprise = {
  ByGroups: "ПоГруппировкам",
  ByGroupsWithHierarchy: "ПоГруппировкамСИерархией",
  Linear: "Прямой",
} as const

export const QueryResultIterationFromEnterprise = {
  ПоГруппировкам: "ByGroups",
  ПоГруппировкамСИерархией: "ByGroupsWithHierarchy",
  Прямой: "Linear",
} as const

export type QueryResultIteration = keyof typeof QueryResultIterationToEnterprise
export type QueryResultIterationEnterprise = keyof typeof QueryResultIterationFromEnterprise

export const ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodToEnterprise = {
  StronglyConnectedComponents: "КомпонентыСильнойСвязности",
  StronglyConnectedComponentsWithNoInnerConnectionRequired:
    "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент",
  WeaklyConnectedComponents: "КомпонентыСлабойСвязности",
} as const

export const ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodFromEnterprise = {
  КомпонентыСильнойСвязности: "StronglyConnectedComponents",
  КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент:
    "StronglyConnectedComponentsWithNoInnerConnectionRequired",
  КомпонентыСлабойСвязности: "WeaklyConnectedComponents",
} as const

export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod =
  keyof typeof ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodToEnterprise
export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise =
  keyof typeof ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodFromEnterprise

export const AdditionalUserVerificationMethodToEnterprise = {
  BiometricsOrPassword: "БиометрическаяИлиВводПароля",
  BiometricsOnly: "ТолькоБиометрическая",
} as const

export const AdditionalUserVerificationMethodFromEnterprise = {
  БиометрическаяИлиВводПароля: "BiometricsOrPassword",
  ТолькоБиометрическая: "BiometricsOnly",
} as const

export type AdditionalUserVerificationMethod = keyof typeof AdditionalUserVerificationMethodToEnterprise
export type AdditionalUserVerificationMethodEnterprise = keyof typeof AdditionalUserVerificationMethodFromEnterprise

export const BiometricVerificationMethodToEnterprise = {
  None: "Нет",
  FaceRecognition: "РаспознаваниеЛица",
  FingerprintRecognition: "РаспознаваниеОтпечаткаПальца",
  IrisRecognition: "РаспознаваниеРадужнойОболочкиГлаза",
} as const

export const BiometricVerificationMethodFromEnterprise = {
  Нет: "None",
  РаспознаваниеЛица: "FaceRecognition",
  РаспознаваниеОтпечаткаПальца: "FingerprintRecognition",
  РаспознаваниеРадужнойОболочкиГлаза: "IrisRecognition",
} as const

export type BiometricVerificationMethod = keyof typeof BiometricVerificationMethodToEnterprise
export type BiometricVerificationMethodEnterprise = keyof typeof BiometricVerificationMethodFromEnterprise

export const SecureStorageAccessProtectionMethodToEnterprise = {
  None: "Нет",
  AdditionalUserVerificationRequired: "ТребуетсяДополнительнаяПроверкаПользователя",
  ScreenUnlockRequired: "ТребуетсяРазблокировкаЭкрана",
} as const

export const SecureStorageAccessProtectionMethodFromEnterprise = {
  Нет: "None",
  ТребуетсяДополнительнаяПроверкаПользователя: "AdditionalUserVerificationRequired",
  ТребуетсяРазблокировкаЭкрана: "ScreenUnlockRequired",
} as const

export type SecureStorageAccessProtectionMethod = keyof typeof SecureStorageAccessProtectionMethodToEnterprise
export type SecureStorageAccessProtectionMethodEnterprise =
  keyof typeof SecureStorageAccessProtectionMethodFromEnterprise

export const ErrorCategoryToEnterprise = {
  AllErrors: "ВсеОшибки",
  ExceptionRaisedFromScript: "ИсключениеВызванноеИзВстроенногоЯзыка",
  AccessViolation: "НарушениеПравДоступа",
  UnsupportedFormat: "НеподдерживаемыйФормат",
  InvalidPassword: "НеправильныйПароль",
  NoPermissionToUseFunctionality: "ОтсутствиеРазрешенияДляИспользованияФункциональности",
  ExternalDataSourceError: "ОшибкаВнешнегоИсточникаДанных",
  ScriptRuntimeError: "ОшибкаВоВремяВыполненияВстроенногоЯзыка",
  LocalFileAccessError: "ОшибкаДоступаКЛокальномуФайлу",
  ScriptUseError: "ОшибкаИспользованияВстроенногоЯзыка",
  ScriptCompileError: "ОшибкаКомпиляцииВстроенногоЯзыка",
  ConfigurationError: "ОшибкаКонфигурации",
  DatabaseCopyError: "ОшибкаКопииБазыДанных",
  DataCompositionSettingsError: "ОшибкаНастроекКомпоновкиДанных",
  GotoURLError: "ОшибкаПереходаПоНавигационнойСсылке",
  FullTextSearchError: "ОшибкаПолнотекстовогоПоиска",
  DocumentConversionError: "ОшибкаПреобразованияДокумента",
  SignatureVerificationError: "ОшибкаПроверкиПодписи",
  PrinterError: "ОшибкаРаботыСПринтером",
  SpeechProcessingError: "ОшибкаРаботыСРечью",
  SessionError: "ОшибкаСеанса",
  NetworkError: "ОшибкаСети",
  CollaborationSystemError: "ОшибкаСистемыВзаимодействия",
  MultimediaToolsError: "ОшибкаСредствМультимедиа",
  DatabaseTablespaceError: "ОшибкаТабличногоПространстваБазыДанных",
  StoredDataError: "ОшибкаХранимыхДанных",
  ForcedShutdown: "ПринудительноеЗавершениеРаботы",
  OtherError: "ПрочаяОшибка",
} as const

export const ErrorCategoryFromEnterprise = {
  ВсеОшибки: "AllErrors",
  ИсключениеВызванноеИзВстроенногоЯзыка: "ExceptionRaisedFromScript",
  НарушениеПравДоступа: "AccessViolation",
  НеподдерживаемыйФормат: "UnsupportedFormat",
  НеправильныйПароль: "InvalidPassword",
  ОтсутствиеРазрешенияДляИспользованияФункциональности: "NoPermissionToUseFunctionality",
  ОшибкаВнешнегоИсточникаДанных: "ExternalDataSourceError",
  ОшибкаВоВремяВыполненияВстроенногоЯзыка: "ScriptRuntimeError",
  ОшибкаДоступаКЛокальномуФайлу: "LocalFileAccessError",
  ОшибкаИспользованияВстроенногоЯзыка: "ScriptUseError",
  ОшибкаКомпиляцииВстроенногоЯзыка: "ScriptCompileError",
  ОшибкаКонфигурации: "ConfigurationError",
  ОшибкаКопииБазыДанных: "DatabaseCopyError",
  ОшибкаНастроекКомпоновкиДанных: "DataCompositionSettingsError",
  ОшибкаПереходаПоНавигационнойСсылке: "GotoURLError",
  ОшибкаПолнотекстовогоПоиска: "FullTextSearchError",
  ОшибкаПреобразованияДокумента: "DocumentConversionError",
  ОшибкаПроверкиПодписи: "SignatureVerificationError",
  ОшибкаРаботыСПринтером: "PrinterError",
  ОшибкаРаботыСРечью: "SpeechProcessingError",
  ОшибкаСеанса: "SessionError",
  ОшибкаСети: "NetworkError",
  ОшибкаСистемыВзаимодействия: "CollaborationSystemError",
  ОшибкаСредствМультимедиа: "MultimediaToolsError",
  ОшибкаТабличногоПространстваБазыДанных: "DatabaseTablespaceError",
  ОшибкаХранимыхДанных: "StoredDataError",
  ПринудительноеЗавершениеРаботы: "ForcedShutdown",
  ПрочаяОшибка: "OtherError",
} as const

export type ErrorCategory = keyof typeof ErrorCategoryToEnterprise
export type ErrorCategoryEnterprise = keyof typeof ErrorCategoryFromEnterprise

export const ErrorMessageDisplayVariantToEnterprise = {
  Auto: "Авто",
  BriefErrorDescription: "КраткоеПредставлениеОшибки",
  DetailErrorDescription: "ПодробноеПредставлениеОшибки",
  ErrorMessageForUser: "СообщениеОбОшибкеДляПользователя",
} as const

export const ErrorMessageDisplayVariantFromEnterprise = {
  Авто: "Auto",
  КраткоеПредставлениеОшибки: "BriefErrorDescription",
  ПодробноеПредставлениеОшибки: "DetailErrorDescription",
  СообщениеОбОшибкеДляПользователя: "ErrorMessageForUser",
} as const

export type ErrorMessageDisplayVariant = keyof typeof ErrorMessageDisplayVariantToEnterprise
export type ErrorMessageDisplayVariantEnterprise = keyof typeof ErrorMessageDisplayVariantFromEnterprise

export const ErrorReportingModeToEnterprise = {
  Auto: "Авто",
  DontSend: "НеОтправлять",
  Send: "Отправлять",
  AskUser: "СпрашиватьПользователя",
} as const

export const ErrorReportingModeFromEnterprise = {
  Авто: "Auto",
  НеОтправлять: "DontSend",
  Отправлять: "Send",
  СпрашиватьПользователя: "AskUser",
} as const

export type ErrorReportingMode = keyof typeof ErrorReportingModeToEnterprise
export type ErrorReportingModeEnterprise = keyof typeof ErrorReportingModeFromEnterprise

export const MobileClientSignatureVerificationMethodToEnterprise = {
  DoNotVerifySignature: "НеВыполнятьПроверкуПодписи",
  CheckMobileClientUsageAbility: "ПроверятьВозможностьИспользованияМобильногоКлиента",
  CheckConfigurationSignatureForExactMatch: "ПроверятьТочноеСоответствиеПодписиКонфигурации",
} as const

export const MobileClientSignatureVerificationMethodFromEnterprise = {
  НеВыполнятьПроверкуПодписи: "DoNotVerifySignature",
  ПроверятьВозможностьИспользованияМобильногоКлиента: "CheckMobileClientUsageAbility",
  ПроверятьТочноеСоответствиеПодписиКонфигурации: "CheckConfigurationSignatureForExactMatch",
} as const

export type MobileClientSignatureVerificationMethod = keyof typeof MobileClientSignatureVerificationMethodToEnterprise
export type MobileClientSignatureVerificationMethodEnterprise =
  keyof typeof MobileClientSignatureVerificationMethodFromEnterprise

export const OnMainServerUnavalableBehaviorToEnterprise = {
  Auto: "Авто",
  DontChangeBehavior: "НеИзменятьПоведение",
  MakeDisable: "ОтключитьДоступность",
} as const

export const OnMainServerUnavalableBehaviorFromEnterprise = {
  Авто: "Auto",
  НеИзменятьПоведение: "DontChangeBehavior",
  ОтключитьДоступность: "MakeDisable",
} as const

export type OnMainServerUnavalableBehavior = keyof typeof OnMainServerUnavalableBehaviorToEnterprise
export type OnMainServerUnavalableBehaviorEnterprise = keyof typeof OnMainServerUnavalableBehaviorFromEnterprise

export const UsedServerToEnterprise = {
  Standalone: "Автономный",
  Main: "Основной",
} as const

export const UsedServerFromEnterprise = {
  Автономный: "Standalone",
  Основной: "Main",
} as const

export type UsedServer = keyof typeof UsedServerToEnterprise
export type UsedServerEnterprise = keyof typeof UsedServerFromEnterprise

export const PDFAttachmentRelationshipTypeToEnterprise = {
  Alternative: "Альтернатива",
  Data: "Данные",
  Supplement: "Дополнение",
  Source: "Источник",
  Unspecified: "НеУстановлено",
} as const

export const PDFAttachmentRelationshipTypeFromEnterprise = {
  Альтернатива: "Alternative",
  Данные: "Data",
  Дополнение: "Supplement",
  Источник: "Source",
  НеУстановлено: "Unspecified",
} as const

export type PDFAttachmentRelationshipType = keyof typeof PDFAttachmentRelationshipTypeToEnterprise
export type PDFAttachmentRelationshipTypeEnterprise = keyof typeof PDFAttachmentRelationshipTypeFromEnterprise

export const PDFDocumentFileTypeToEnterprise = {
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
} as const

export const PDFDocumentFileTypeFromEnterprise = {
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
} as const

export type PDFDocumentFileType = keyof typeof PDFDocumentFileTypeToEnterprise
export type PDFDocumentFileTypeEnterprise = keyof typeof PDFDocumentFileTypeFromEnterprise

export const PDFModificationAccessPermissionsToEnterprise = {
  FillingSigning: "ЗаполнениеПодписание",
  FillingSigningAnnotation: "ЗаполнениеПодписаниеАннотирование",
  None: "Нет",
} as const

export const PDFModificationAccessPermissionsFromEnterprise = {
  ЗаполнениеПодписание: "FillingSigning",
  ЗаполнениеПодписаниеАннотирование: "FillingSigningAnnotation",
  Нет: "None",
} as const

export type PDFModificationAccessPermissions = keyof typeof PDFModificationAccessPermissionsToEnterprise
export type PDFModificationAccessPermissionsEnterprise = keyof typeof PDFModificationAccessPermissionsFromEnterprise

export const PDFSignatureTypeToEnterprise = {
  Certifying: "Сертифицирующая",
  Approving: "Утверждающая",
} as const

export const PDFSignatureTypeFromEnterprise = {
  Сертифицирующая: "Certifying",
  Утверждающая: "Approving",
} as const

export type PDFSignatureType = keyof typeof PDFSignatureTypeToEnterprise
export type PDFSignatureTypeEnterprise = keyof typeof PDFSignatureTypeFromEnterprise

export const ProgressiveWebApplicationModeToEnterprise = {
  InBrowserWindow: "ВОкнеБраузера",
  InStandaloneWindow: "ВОтдельномОкне",
} as const

export const ProgressiveWebApplicationModeFromEnterprise = {
  ВОкнеБраузера: "InBrowserWindow",
  ВОтдельномОкне: "InStandaloneWindow",
} as const

export type ProgressiveWebApplicationMode = keyof typeof ProgressiveWebApplicationModeToEnterprise
export type ProgressiveWebApplicationModeEnterprise = keyof typeof ProgressiveWebApplicationModeFromEnterprise

export const AdditionalShowModeToEnterprise = {
  Irrelevance: "Неактуальность",
  DontUse: "НеИспользовать",
} as const

export const AdditionalShowModeFromEnterprise = {
  Неактуальность: "Irrelevance",
  НеИспользовать: "DontUse",
} as const

export type AdditionalShowMode = keyof typeof AdditionalShowModeToEnterprise
export type AdditionalShowModeEnterprise = keyof typeof AdditionalShowModeFromEnterprise

export const AppearanceAreaTypeToEnterprise = {
  Group: "Группировка",
  Field: "Поле",
} as const

export const AppearanceAreaTypeFromEnterprise = {
  Группировка: "Group",
  Поле: "Field",
} as const

export type AppearanceAreaType = keyof typeof AppearanceAreaTypeToEnterprise
export type AppearanceAreaTypeEnterprise = keyof typeof AppearanceAreaTypeFromEnterprise

export const ArrowStyleToEnterprise = {
  Filled: "Заполненная",
  Blank: "Незаполненная",
  None: "Нет",
} as const

export const ArrowStyleFromEnterprise = {
  Заполненная: "Filled",
  Незаполненная: "Blank",
  Нет: "None",
} as const

export type ArrowStyle = keyof typeof ArrowStyleToEnterprise
export type ArrowStyleEnterprise = keyof typeof ArrowStyleFromEnterprise

export const AutoCapitalizationOnTextInputToEnterprise = {
  Auto: "Авто",
  AllCharacters: "ВсеСимволы",
  None: "Нет",
  Sentences: "Предложения",
  Words: "Слова",
} as const

export const AutoCapitalizationOnTextInputFromEnterprise = {
  Авто: "Auto",
  ВсеСимволы: "AllCharacters",
  Нет: "None",
  Предложения: "Sentences",
  Слова: "Words",
} as const

export type AutoCapitalizationOnTextInput = keyof typeof AutoCapitalizationOnTextInputToEnterprise
export type AutoCapitalizationOnTextInputEnterprise = keyof typeof AutoCapitalizationOnTextInputFromEnterprise

export const AutoCorrectionOnTextInputToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const AutoCorrectionOnTextInputFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type AutoCorrectionOnTextInput = keyof typeof AutoCorrectionOnTextInputToEnterprise
export type AutoCorrectionOnTextInputEnterprise = keyof typeof AutoCorrectionOnTextInputFromEnterprise

export const AutoSaveFormDataInSettingsToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const AutoSaveFormDataInSettingsFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type AutoSaveFormDataInSettings = keyof typeof AutoSaveFormDataInSettingsToEnterprise
export type AutoSaveFormDataInSettingsEnterprise = keyof typeof AutoSaveFormDataInSettingsFromEnterprise

export const AutoShowClearButtonModeToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
  FilledOnly: "ТолькоДляЗаполненного",
} as const

export const AutoShowClearButtonModeFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
  ТолькоДляЗаполненного: "FilledOnly",
} as const

export type AutoShowClearButtonMode = keyof typeof AutoShowClearButtonModeToEnterprise
export type AutoShowClearButtonModeEnterprise = keyof typeof AutoShowClearButtonModeFromEnterprise

export const AutoShowOpenButtonModeToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
  FilledOnly: "ТолькоДляЗаполненного",
} as const

export const AutoShowOpenButtonModeFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
  ТолькоДляЗаполненного: "FilledOnly",
} as const

export type AutoShowOpenButtonMode = keyof typeof AutoShowOpenButtonModeToEnterprise
export type AutoShowOpenButtonModeEnterprise = keyof typeof AutoShowOpenButtonModeFromEnterprise

export const AutoShowStateModeToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
  ShowOnComposition: "ОтображатьПриФормировании",
} as const

export const AutoShowStateModeFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
  ОтображатьПриФормировании: "ShowOnComposition",
} as const

export type AutoShowStateMode = keyof typeof AutoShowStateModeToEnterprise
export type AutoShowStateModeEnterprise = keyof typeof AutoShowStateModeFromEnterprise

export const AutonumerationInFormToEnterprise = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const AutonumerationInFormFromEnterprise = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type AutonumerationInForm = keyof typeof AutonumerationInFormToEnterprise
export type AutonumerationInFormEnterprise = keyof typeof AutonumerationInFormFromEnterprise

export const ButtonGroupRepresentationToEnterprise = {
  Auto: "Авто",
  Compact: "Компактное",
  Usual: "Обычное",
} as const

export const ButtonGroupRepresentationFromEnterprise = {
  Авто: "Auto",
  Компактное: "Compact",
  Обычное: "Usual",
} as const

export type ButtonGroupRepresentation = keyof typeof ButtonGroupRepresentationToEnterprise
export type ButtonGroupRepresentationEnterprise = keyof typeof ButtonGroupRepresentationFromEnterprise

export const ButtonLocationInCommandBarToEnterprise = {
  Auto: "Авто",
  InAdditionalSubmenu: "ВДополнительномПодменю",
  InCommandBar: "ВКоманднойПанели",
  InCommandBarAndInAdditionalSubmenu: "ВКоманднойПанелиИВДополнительномПодменю",
} as const

export const ButtonLocationInCommandBarFromEnterprise = {
  Авто: "Auto",
  ВДополнительномПодменю: "InAdditionalSubmenu",
  ВКоманднойПанели: "InCommandBar",
  ВКоманднойПанелиИВДополнительномПодменю: "InCommandBarAndInAdditionalSubmenu",
} as const

export type ButtonLocationInCommandBar = keyof typeof ButtonLocationInCommandBarToEnterprise
export type ButtonLocationInCommandBarEnterprise = keyof typeof ButtonLocationInCommandBarFromEnterprise

export const ButtonPictureLocationToEnterprise = {
  Left: "Лево",
  Right: "Право",
} as const

export const ButtonPictureLocationFromEnterprise = {
  Лево: "Left",
  Право: "Right",
} as const

export type ButtonPictureLocation = keyof typeof ButtonPictureLocationToEnterprise
export type ButtonPictureLocationEnterprise = keyof typeof ButtonPictureLocationFromEnterprise

export const ButtonRepresentationToEnterprise = {
  Auto: "Авто",
  Picture: "Картинка",
  PictureAndText: "КартинкаИТекст",
  Text: "Текст",
} as const

export const ButtonRepresentationFromEnterprise = {
  Авто: "Auto",
  Картинка: "Picture",
  КартинкаИТекст: "PictureAndText",
  Текст: "Text",
} as const

export type ButtonRepresentation = keyof typeof ButtonRepresentationToEnterprise
export type ButtonRepresentationEnterprise = keyof typeof ButtonRepresentationFromEnterprise

export const ButtonShapeToEnterprise = {
  Auto: "Авто",
  Usual: "Обычная",
  Oval: "Овал",
} as const

export const ButtonShapeFromEnterprise = {
  Авто: "Auto",
  Обычная: "Usual",
  Овал: "Oval",
} as const

export type ButtonShape = keyof typeof ButtonShapeToEnterprise
export type ButtonShapeEnterprise = keyof typeof ButtonShapeFromEnterprise

export const ButtonShapeRepresentationToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
  None: "Нет",
  WhenActive: "ПриАктивности",
} as const

export const ButtonShapeRepresentationFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
  Нет: "None",
  ПриАктивности: "WhenActive",
} as const

export type ButtonShapeRepresentation = keyof typeof ButtonShapeRepresentationToEnterprise
export type ButtonShapeRepresentationEnterprise = keyof typeof ButtonShapeRepresentationFromEnterprise

export const CheckBoxTypeToEnterprise = {
  Auto: "Авто",
  Switch: "Выключатель",
  Tumbler: "Тумблер",
  CheckBox: "Флажок",
} as const

export const CheckBoxTypeFromEnterprise = {
  Авто: "Auto",
  Выключатель: "Switch",
  Тумблер: "Tumbler",
  Флажок: "CheckBox",
} as const

export type CheckBoxType = keyof typeof CheckBoxTypeToEnterprise
export type CheckBoxTypeEnterprise = keyof typeof CheckBoxTypeFromEnterprise

export const ChildFormItemsGroupToEnterprise = {
  Vertical: "Вертикальная",
  Horizontal: "Горизонтальная",
  AlwaysHorizontal: "ГоризонтальнаяВсегда",
  HorizontalIfPossible: "ГоризонтальнаяЕслиВозможно",
} as const

export const ChildFormItemsGroupFromEnterprise = {
  Вертикальная: "Vertical",
  Горизонтальная: "Horizontal",
  ГоризонтальнаяВсегда: "AlwaysHorizontal",
  ГоризонтальнаяЕслиВозможно: "HorizontalIfPossible",
} as const

export type ChildFormItemsGroup = keyof typeof ChildFormItemsGroupToEnterprise
export type ChildFormItemsGroupEnterprise = keyof typeof ChildFormItemsGroupFromEnterprise

export const ChildFormItemsWidthToEnterprise = {
  Auto: "Авто",
  LeftNarrowest: "ЛевыйОченьУзкий",
  LeftWidest: "ЛевыйОченьШирокий",
  LeftNarrow: "ЛевыйУзкий",
  LeftWide: "ЛевыйШирокий",
  Equal: "Одинаковая",
} as const

export const ChildFormItemsWidthFromEnterprise = {
  Авто: "Auto",
  ЛевыйОченьУзкий: "LeftNarrowest",
  ЛевыйОченьШирокий: "LeftWidest",
  ЛевыйУзкий: "LeftNarrow",
  ЛевыйШирокий: "LeftWide",
  Одинаковая: "Equal",
} as const

export type ChildFormItemsWidth = keyof typeof ChildFormItemsWidthToEnterprise
export type ChildFormItemsWidthEnterprise = keyof typeof ChildFormItemsWidthFromEnterprise

export const ChoiceButtonRepresentationToEnterprise = {
  Auto: "Авто",
  ShowInDropList: "ОтображатьВВыпадающемСписке",
  ShowInDropListAndInInputField: "ОтображатьВВыпадающемСпискеИВПолеВвода",
  ShowInInputField: "ОтображатьВПолеВвода",
} as const

export const ChoiceButtonRepresentationFromEnterprise = {
  Авто: "Auto",
  ОтображатьВВыпадающемСписке: "ShowInDropList",
  ОтображатьВВыпадающемСпискеИВПолеВвода: "ShowInDropListAndInInputField",
  ОтображатьВПолеВвода: "ShowInInputField",
} as const

export type ChoiceButtonRepresentation = keyof typeof ChoiceButtonRepresentationToEnterprise
export type ChoiceButtonRepresentationEnterprise = keyof typeof ChoiceButtonRepresentationFromEnterprise

export const ChoiceHistoryOnInputToEnterprise = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const ChoiceHistoryOnInputFromEnterprise = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type ChoiceHistoryOnInput = keyof typeof ChoiceHistoryOnInputToEnterprise
export type ChoiceHistoryOnInputEnterprise = keyof typeof ChoiceHistoryOnInputFromEnterprise

export const ClipboardDataStandardFormatToEnterprise = {
  HTML: "HTML",
  Picture: "Картинка",
  Text: "Текст",
} as const

export const ClipboardDataStandardFormatFromEnterprise = {
  HTML: "HTML",
  Картинка: "Picture",
  Текст: "Text",
} as const

export type ClipboardDataStandardFormat = keyof typeof ClipboardDataStandardFormatToEnterprise
export type ClipboardDataStandardFormatEnterprise = keyof typeof ClipboardDataStandardFormatFromEnterprise

export const CollapseFormItemsByImportanceToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CollapseFormItemsByImportanceFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CollapseFormItemsByImportance = keyof typeof CollapseFormItemsByImportanceToEnterprise
export type CollapseFormItemsByImportanceEnterprise = keyof typeof CollapseFormItemsByImportanceFromEnterprise

export const ColorDepthToEnterprise = {
  BitPerPixel1: "БитНаПиксел1",
  BitPerPixel24: "БитНаПиксел24",
  BitPerPixel32: "БитНаПиксел32",
  BitPerPixel4: "БитНаПиксел4",
  BitPerPixel8: "БитНаПиксел8",
} as const

export const ColorDepthFromEnterprise = {
  БитНаПиксел1: "BitPerPixel1",
  БитНаПиксел24: "BitPerPixel24",
  БитНаПиксел32: "BitPerPixel32",
  БитНаПиксел4: "BitPerPixel4",
  БитНаПиксел8: "BitPerPixel8",
} as const

export type ColorDepth = keyof typeof ColorDepthToEnterprise
export type ColorDepthEnterprise = keyof typeof ColorDepthFromEnterprise

export const ColumnEditModeToEnterprise = {
  Enter: "Вход",
  EnterOnInput: "ВходПриВводе",
  Directly: "Непосредственно",
} as const

export const ColumnEditModeFromEnterprise = {
  Вход: "Enter",
  ВходПриВводе: "EnterOnInput",
  Непосредственно: "Directly",
} as const

export type ColumnEditMode = keyof typeof ColumnEditModeToEnterprise
export type ColumnEditModeEnterprise = keyof typeof ColumnEditModeFromEnterprise

export const ColumnLocationToEnterprise = {
  SameColumn: "ВТойЖеКолонке",
  OnNextRow: "НаСледующейСтроке",
  NewColumn: "НоваяКолонка",
} as const

export const ColumnLocationFromEnterprise = {
  ВТойЖеКолонке: "SameColumn",
  НаСледующейСтроке: "OnNextRow",
  НоваяКолонка: "NewColumn",
} as const

export type ColumnLocation = keyof typeof ColumnLocationToEnterprise
export type ColumnLocationEnterprise = keyof typeof ColumnLocationFromEnterprise

export const ColumnSizeChangeToEnterprise = {
  Change: "Изменять",
  DontChange: "НеИзменять",
} as const

export const ColumnSizeChangeFromEnterprise = {
  Изменять: "Change",
  НеИзменять: "DontChange",
} as const

export type ColumnSizeChange = keyof typeof ColumnSizeChangeToEnterprise
export type ColumnSizeChangeEnterprise = keyof typeof ColumnSizeChangeFromEnterprise

export const ColumnsGroupToEnterprise = {
  Vertical: "Вертикальная",
  InCell: "ВЯчейке",
  Horizontal: "Горизонтальная",
} as const

export const ColumnsGroupFromEnterprise = {
  Вертикальная: "Vertical",
  ВЯчейке: "InCell",
  Горизонтальная: "Horizontal",
} as const

export type ColumnsGroup = keyof typeof ColumnsGroupToEnterprise
export type ColumnsGroupEnterprise = keyof typeof ColumnsGroupFromEnterprise

export const CommandBarButtonAlignmentToEnterprise = {
  Left: "Лево",
  Right: "Право",
  Center: "Центр",
} as const

export const CommandBarButtonAlignmentFromEnterprise = {
  Лево: "Left",
  Право: "Right",
  Центр: "Center",
} as const

export type CommandBarButtonAlignment = keyof typeof CommandBarButtonAlignmentToEnterprise
export type CommandBarButtonAlignmentEnterprise = keyof typeof CommandBarButtonAlignmentFromEnterprise

export const CommandBarButtonOrderToEnterprise = {
  Asc: "Возр",
  DontOrder: "НеУпорядочивать",
  Desc: "Убыв",
} as const

export const CommandBarButtonOrderFromEnterprise = {
  Возр: "Asc",
  НеУпорядочивать: "DontOrder",
  Убыв: "Desc",
} as const

export type CommandBarButtonOrder = keyof typeof CommandBarButtonOrderToEnterprise
export type CommandBarButtonOrderEnterprise = keyof typeof CommandBarButtonOrderFromEnterprise

export const CommandBarButtonRepresentationToEnterprise = {
  Auto: "Авто",
  Picture: "Картинка",
  Text: "Надпись",
  PictureText: "НадписьКартинка",
} as const

export const CommandBarButtonRepresentationFromEnterprise = {
  Авто: "Auto",
  Картинка: "Picture",
  Надпись: "Text",
  НадписьКартинка: "PictureText",
} as const

export type CommandBarButtonRepresentation = keyof typeof CommandBarButtonRepresentationToEnterprise
export type CommandBarButtonRepresentationEnterprise = keyof typeof CommandBarButtonRepresentationFromEnterprise

export const CommandBarButtonTypeToEnterprise = {
  Action: "Действие",
  Popup: "Подменю",
  Separator: "Разделитель",
} as const

export const CommandBarButtonTypeFromEnterprise = {
  Действие: "Action",
  Подменю: "Popup",
  Разделитель: "Separator",
} as const

export type CommandBarButtonType = keyof typeof CommandBarButtonTypeToEnterprise
export type CommandBarButtonTypeEnterprise = keyof typeof CommandBarButtonTypeFromEnterprise

export const CommandGroupCategoryToEnterprise = {
  FormCommandBar: "КоманднаяПанельФормы",
  ActionsPanel: "ПанельДействий",
  NavigationPanel: "ПанельНавигации",
  FormNavigationPanel: "ПанельНавигацииФормы",
} as const

export const CommandGroupCategoryFromEnterprise = {
  КоманднаяПанельФормы: "FormCommandBar",
  ПанельДействий: "ActionsPanel",
  ПанельНавигации: "NavigationPanel",
  ПанельНавигацииФормы: "FormNavigationPanel",
} as const

export type CommandGroupCategory = keyof typeof CommandGroupCategoryToEnterprise
export type CommandGroupCategoryEnterprise = keyof typeof CommandGroupCategoryFromEnterprise

export const CommandParameterUseModeToEnterprise = {
  Multiple: "Множественный",
  Single: "Одиночный",
} as const

export const CommandParameterUseModeFromEnterprise = {
  Множественный: "Multiple",
  Одиночный: "Single",
} as const

export type CommandParameterUseMode = keyof typeof CommandParameterUseModeToEnterprise
export type CommandParameterUseModeEnterprise = keyof typeof CommandParameterUseModeFromEnterprise

export const ConnectorLineTypeToEnterprise = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const ConnectorLineTypeFromEnterprise = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type ConnectorLineType = keyof typeof ConnectorLineTypeToEnterprise
export type ConnectorLineTypeEnterprise = keyof typeof ConnectorLineTypeFromEnterprise

export const ConnectorTextLocationToEnterprise = {
  FirstSegment: "ПервыйСегмент",
  Middle: "СерединаЛинии",
} as const

export const ConnectorTextLocationFromEnterprise = {
  ПервыйСегмент: "FirstSegment",
  СерединаЛинии: "Middle",
} as const

export type ConnectorTextLocation = keyof typeof ConnectorTextLocationToEnterprise
export type ConnectorTextLocationEnterprise = keyof typeof ConnectorTextLocationFromEnterprise

export const ControlBorderTypeToEnterprise = {
  WithoutBorder: "БезРамки",
  Indented: "Вдавленная",
  Embossed: "Выпуклая",
  Double: "Двойная",
  DoubleUnderline: "ДвойноеПодчеркивание",
  Single: "Одинарная",
  Underline: "Подчеркивание",
  Rounded: "Скругленная",
  Overline: "ЧертаСверху",
} as const

export const ControlBorderTypeFromEnterprise = {
  БезРамки: "WithoutBorder",
  Вдавленная: "Indented",
  Выпуклая: "Embossed",
  Двойная: "Double",
  ДвойноеПодчеркивание: "DoubleUnderline",
  Одинарная: "Single",
  Подчеркивание: "Underline",
  Скругленная: "Rounded",
  ЧертаСверху: "Overline",
} as const

export type ControlBorderType = keyof typeof ControlBorderTypeToEnterprise
export type ControlBorderTypeEnterprise = keyof typeof ControlBorderTypeFromEnterprise

export const ControlCollapseModeToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const ControlCollapseModeFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type ControlCollapseMode = keyof typeof ControlCollapseModeToEnterprise
export type ControlCollapseModeEnterprise = keyof typeof ControlCollapseModeFromEnterprise

export const ControlEdgeToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const ControlEdgeFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type ControlEdge = keyof typeof ControlEdgeToEnterprise
export type ControlEdgeEnterprise = keyof typeof ControlEdgeFromEnterprise

export const CurrentRowUseToEnterprise = {
  Auto: "Авто",
  Use: "Использует",
  DontUse: "НеИспользует",
} as const

export const CurrentRowUseFromEnterprise = {
  Авто: "Auto",
  Использует: "Use",
  НеИспользует: "DontUse",
} as const

export type CurrentRowUse = keyof typeof CurrentRowUseToEnterprise
export type CurrentRowUseEnterprise = keyof typeof CurrentRowUseFromEnterprise

export const DataChangeTypeToEnterprise = {
  Create: "Добавление",
  Update: "Изменение",
  Delete: "Удаление",
} as const

export const DataChangeTypeFromEnterprise = {
  Добавление: "Create",
  Изменение: "Update",
  Удаление: "Delete",
} as const

export type DataChangeType = keyof typeof DataChangeTypeToEnterprise
export type DataChangeTypeEnterprise = keyof typeof DataChangeTypeFromEnterprise

export const DateSelectionModeToEnterprise = {
  Interval: "Интервал",
  Multiple: "Множественный",
  Single: "Одиночный",
} as const

export const DateSelectionModeFromEnterprise = {
  Интервал: "Interval",
  Множественный: "Multiple",
  Одиночный: "Single",
} as const

export type DateSelectionMode = keyof typeof DateSelectionModeToEnterprise
export type DateSelectionModeEnterprise = keyof typeof DateSelectionModeFromEnterprise

export const DimensionAttributePlacementTypeToEnterprise = {
  Together: "Вместе",
  WithDimensions: "ВместеСИзмерениями",
  Separately: "Отдельно",
} as const

export const DimensionAttributePlacementTypeFromEnterprise = {
  Вместе: "Together",
  ВместеСИзмерениями: "WithDimensions",
  Отдельно: "Separately",
} as const

export type DimensionAttributePlacementType = keyof typeof DimensionAttributePlacementTypeToEnterprise
export type DimensionAttributePlacementTypeEnterprise = keyof typeof DimensionAttributePlacementTypeFromEnterprise

export const DimensionPlacementTypeToEnterprise = {
  Together: "Вместе",
  Separately: "Отдельно",
  SeparatelyAndInTotalsOnly: "ОтдельноИТолькоВИтогах",
} as const

export const DimensionPlacementTypeFromEnterprise = {
  Вместе: "Together",
  Отдельно: "Separately",
  ОтдельноИТолькоВИтогах: "SeparatelyAndInTotalsOnly",
} as const

export type DimensionPlacementType = keyof typeof DimensionPlacementTypeToEnterprise
export type DimensionPlacementTypeEnterprise = keyof typeof DimensionPlacementTypeFromEnterprise

export const DisplayImportanceToEnterprise = {
  Auto: "Авто",
  High: "Высокая",
  Low: "Низкая",
  Usual: "Обычная",
  VeryHigh: "ОченьВысокая",
  VeryLow: "ОченьНизкая",
} as const

export const DisplayImportanceFromEnterprise = {
  Авто: "Auto",
  Высокая: "High",
  Низкая: "Low",
  Обычная: "Usual",
  ОченьВысокая: "VeryHigh",
  ОченьНизкая: "VeryLow",
} as const

export type DisplayImportance = keyof typeof DisplayImportanceToEnterprise
export type DisplayImportanceEnterprise = keyof typeof DisplayImportanceFromEnterprise

export const DragActionToEnterprise = {
  Choice: "Выбор",
  Copy: "Копирование",
  Cancel: "Отмена",
  Move: "Перемещение",
} as const

export const DragActionFromEnterprise = {
  Выбор: "Choice",
  Копирование: "Copy",
  Отмена: "Cancel",
  Перемещение: "Move",
} as const

export type DragAction = keyof typeof DragActionToEnterprise
export type DragActionEnterprise = keyof typeof DragActionFromEnterprise

export const DragAllowedActionsToEnterprise = {
  Copy: "Копирование",
  CopyAndMove: "КопированиеИПеремещение",
  DontProcess: "НеОбрабатывать",
  Move: "Перемещение",
} as const

export const DragAllowedActionsFromEnterprise = {
  Копирование: "Copy",
  КопированиеИПеремещение: "CopyAndMove",
  НеОбрабатывать: "DontProcess",
  Перемещение: "Move",
} as const

export type DragAllowedActions = keyof typeof DragAllowedActionsToEnterprise
export type DragAllowedActionsEnterprise = keyof typeof DragAllowedActionsFromEnterprise

export const DrawingSelectionShowModeToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const DrawingSelectionShowModeFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type DrawingSelectionShowMode = keyof typeof DrawingSelectionShowModeToEnterprise
export type DrawingSelectionShowModeEnterprise = keyof typeof DrawingSelectionShowModeFromEnterprise

export const EditTextUpdateToEnterprise = {
  Auto: "Авто",
  Always: "Всегда",
  DontUse: "НеИспользовать",
  OnValueChange: "ПриИзмененииЗначения",
} as const

export const EditTextUpdateFromEnterprise = {
  Авто: "Auto",
  Всегда: "Always",
  НеИспользовать: "DontUse",
  ПриИзмененииЗначения: "OnValueChange",
} as const

export type EditTextUpdate = keyof typeof EditTextUpdateToEnterprise
export type EditTextUpdateEnterprise = keyof typeof EditTextUpdateFromEnterprise

export const FitPageModeToEnterprise = {
  Auto: "Авто",
  PageWidth: "ПоШиринеСтраницы",
  Proportionally: "Пропорционально",
} as const

export const FitPageModeFromEnterprise = {
  Авто: "Auto",
  ПоШиринеСтраницы: "PageWidth",
  Пропорционально: "Proportionally",
} as const

export type FitPageMode = keyof typeof FitPageModeToEnterprise
export type FitPageModeEnterprise = keyof typeof FitPageModeFromEnterprise

export const FixingInTableToEnterprise = {
  Left: "Лево",
  None: "Нет",
  Right: "Право",
} as const

export const FixingInTableFromEnterprise = {
  Лево: "Left",
  Нет: "None",
  Право: "Right",
} as const

export type FixingInTable = keyof typeof FixingInTableToEnterprise
export type FixingInTableEnterprise = keyof typeof FixingInTableFromEnterprise

export const FoldersAndItemsToEnterprise = {
  Auto: "Авто",
  Folders: "Группы",
  FoldersAndItems: "ГруппыИЭлементы",
  Items: "Элементы",
} as const

export const FoldersAndItemsFromEnterprise = {
  Авто: "Auto",
  Группы: "Folders",
  ГруппыИЭлементы: "FoldersAndItems",
  Элементы: "Items",
} as const

export type FoldersAndItems = keyof typeof FoldersAndItemsToEnterprise
export type FoldersAndItemsEnterprise = keyof typeof FoldersAndItemsFromEnterprise

export const FormButtonPictureLocationToEnterprise = {
  Auto: "Авто",
  Left: "Лево",
  Right: "Право",
} as const

export const FormButtonPictureLocationFromEnterprise = {
  Авто: "Auto",
  Лево: "Left",
  Право: "Right",
} as const

export type FormButtonPictureLocation = keyof typeof FormButtonPictureLocationToEnterprise
export type FormButtonPictureLocationEnterprise = keyof typeof FormButtonPictureLocationFromEnterprise

export const FormButtonTypeToEnterprise = {
  Hyperlink: "Гиперссылка",
  CommandBarHyperlink: "ГиперссылкаКоманднойПанели",
  CommandBarButton: "КнопкаКоманднойПанели",
  UsualButton: "ОбычнаяКнопка",
} as const

export const FormButtonTypeFromEnterprise = {
  Гиперссылка: "Hyperlink",
  ГиперссылкаКоманднойПанели: "CommandBarHyperlink",
  КнопкаКоманднойПанели: "CommandBarButton",
  ОбычнаяКнопка: "UsualButton",
} as const

export type FormButtonType = keyof typeof FormButtonTypeToEnterprise
export type FormButtonTypeEnterprise = keyof typeof FormButtonTypeFromEnterprise

export const FormCommandBarLabelLocationToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const FormCommandBarLabelLocationFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type FormCommandBarLabelLocation = keyof typeof FormCommandBarLabelLocationToEnterprise
export type FormCommandBarLabelLocationEnterprise = keyof typeof FormCommandBarLabelLocationFromEnterprise

export const FormConversationsRepresentationToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const FormConversationsRepresentationFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type FormConversationsRepresentation = keyof typeof FormConversationsRepresentationToEnterprise
export type FormConversationsRepresentationEnterprise = keyof typeof FormConversationsRepresentationFromEnterprise

export const FormDecorationTypeToEnterprise = {
  Picture: "Картинка",
  Label: "Надпись",
} as const

export const FormDecorationTypeFromEnterprise = {
  Картинка: "Picture",
  Надпись: "Label",
} as const

export type FormDecorationType = keyof typeof FormDecorationTypeToEnterprise
export type FormDecorationTypeEnterprise = keyof typeof FormDecorationTypeFromEnterprise

export const FormFieldTypeToEnterprise = {
  HTMLDocumentField: "ПолеHTMLДокумента",
  PDFDocumentField: "ПолеPDFДокумента",
  InputField: "ПолеВвода",
  GeographicalSchemaField: "ПолеГеографическойСхемы",
  GraphicalSchemaField: "ПолеГрафическойСхемы",
  DendrogramField: "ПолеДендрограммы",
  ChartField: "ПолеДиаграммы",
  GanttChartField: "ПолеДиаграммыГанта",
  ProgressBarField: "ПолеИндикатора",
  CalendarField: "ПолеКалендаря",
  PictureField: "ПолеКартинки",
  LabelField: "ПолеНадписи",
  RadioButtonField: "ПолеПереключателя",
  PeriodField: "ПолеПериода",
  PlannerField: "ПолеПланировщика",
  TrackBarField: "ПолеПолосыРегулирования",
  SpreadsheetDocumentField: "ПолеТабличногоДокумента",
  TextDocumentField: "ПолеТекстовогоДокумента",
  CheckBoxField: "ПолеФлажка",
  FormattedDocumentField: "ПолеФорматированногоДокумента",
} as const

export const FormFieldTypeFromEnterprise = {
  ПолеHTMLДокумента: "HTMLDocumentField",
  ПолеPDFДокумента: "PDFDocumentField",
  ПолеВвода: "InputField",
  ПолеГеографическойСхемы: "GeographicalSchemaField",
  ПолеГрафическойСхемы: "GraphicalSchemaField",
  ПолеДендрограммы: "DendrogramField",
  ПолеДиаграммы: "ChartField",
  ПолеДиаграммыГанта: "GanttChartField",
  ПолеИндикатора: "ProgressBarField",
  ПолеКалендаря: "CalendarField",
  ПолеКартинки: "PictureField",
  ПолеНадписи: "LabelField",
  ПолеПереключателя: "RadioButtonField",
  ПолеПериода: "PeriodField",
  ПолеПланировщика: "PlannerField",
  ПолеПолосыРегулирования: "TrackBarField",
  ПолеТабличногоДокумента: "SpreadsheetDocumentField",
  ПолеТекстовогоДокумента: "TextDocumentField",
  ПолеФлажка: "CheckBoxField",
  ПолеФорматированногоДокумента: "FormattedDocumentField",
} as const

export type FormFieldType = keyof typeof FormFieldTypeToEnterprise
export type FormFieldTypeEnterprise = keyof typeof FormFieldTypeFromEnterprise

export const FormGroupTypeToEnterprise = {
  ButtonGroup: "ГруппаКнопок",
  ColumnGroup: "ГруппаКолонок",
  CommandBar: "КоманднаяПанель",
  ContextMenu: "КонтекстноеМеню",
  UsualGroup: "ОбычнаяГруппа",
  Popup: "Подменю",
  Page: "Страница",
  Pages: "Страницы",
} as const

export const FormGroupTypeFromEnterprise = {
  ГруппаКнопок: "ButtonGroup",
  ГруппаКолонок: "ColumnGroup",
  КоманднаяПанель: "CommandBar",
  КонтекстноеМеню: "ContextMenu",
  ОбычнаяГруппа: "UsualGroup",
  Подменю: "Popup",
  Страница: "Page",
  Страницы: "Pages",
} as const

export type FormGroupType = keyof typeof FormGroupTypeToEnterprise
export type FormGroupTypeEnterprise = keyof typeof FormGroupTypeFromEnterprise

export const FormItemAdditionTypeToEnterprise = {
  ViewStatusRepresentation: "ОтображениеСостоянияПросмотра",
  SearchStringRepresentation: "ОтображениеСтрокиПоиска",
  SearchControl: "УправлениеПоиском",
} as const

export const FormItemAdditionTypeFromEnterprise = {
  ОтображениеСостоянияПросмотра: "ViewStatusRepresentation",
  ОтображениеСтрокиПоиска: "SearchStringRepresentation",
  УправлениеПоиском: "SearchControl",
} as const

export type FormItemAdditionType = keyof typeof FormItemAdditionTypeToEnterprise
export type FormItemAdditionTypeEnterprise = keyof typeof FormItemAdditionTypeFromEnterprise

export const FormItemCommandBarLabelLocationToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const FormItemCommandBarLabelLocationFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type FormItemCommandBarLabelLocation = keyof typeof FormItemCommandBarLabelLocationToEnterprise
export type FormItemCommandBarLabelLocationEnterprise = keyof typeof FormItemCommandBarLabelLocationFromEnterprise

export const FormItemOrientationToEnterprise = {
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
} as const

export const FormItemOrientationFromEnterprise = {
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
} as const

export type FormItemOrientation = keyof typeof FormItemOrientationToEnterprise
export type FormItemOrientationEnterprise = keyof typeof FormItemOrientationFromEnterprise

export const FormItemSpacingToEnterprise = {
  Auto: "Авто",
  Double: "Двойной",
  None: "Нет",
  Single: "Одинарный",
  Half: "Половинный",
  OneAndHalf: "Полуторный",
} as const

export const FormItemSpacingFromEnterprise = {
  Авто: "Auto",
  Двойной: "Double",
  Нет: "None",
  Одинарный: "Single",
  Половинный: "Half",
  Полуторный: "OneAndHalf",
} as const

export type FormItemSpacing = keyof typeof FormItemSpacingToEnterprise
export type FormItemSpacingEnterprise = keyof typeof FormItemSpacingFromEnterprise

export const FormItemTitleLocationToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const FormItemTitleLocationFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type FormItemTitleLocation = keyof typeof FormItemTitleLocationToEnterprise
export type FormItemTitleLocationEnterprise = keyof typeof FormItemTitleLocationFromEnterprise

export const FormPagesRepresentationToEnterprise = {
  Auto: "Авто",
  TabsOnTop: "ЗакладкиСверху",
  TabsOnLeftHorizontal: "ЗакладкиСлеваГоризонтально",
  TabsOnBottom: "ЗакладкиСнизу",
  TabsOnRightHorizontal: "ЗакладкиСправаГоризонтально",
  None: "Нет",
  Swipe: "Пролистывание",
} as const

export const FormPagesRepresentationFromEnterprise = {
  Авто: "Auto",
  ЗакладкиСверху: "TabsOnTop",
  ЗакладкиСлеваГоризонтально: "TabsOnLeftHorizontal",
  ЗакладкиСнизу: "TabsOnBottom",
  ЗакладкиСправаГоризонтально: "TabsOnRightHorizontal",
  Нет: "None",
  Пролистывание: "Swipe",
} as const

export type FormPagesRepresentation = keyof typeof FormPagesRepresentationToEnterprise
export type FormPagesRepresentationEnterprise = keyof typeof FormPagesRepresentationFromEnterprise

export const FormPagesStateToEnterprise = {
  Titles: "Заголовки",
  TitlesAndCurrentPage: "ЗаголовкиИТекущаяСтраница",
  CurrentPage: "ТекущаяСтраница",
} as const

export const FormPagesStateFromEnterprise = {
  Заголовки: "Titles",
  ЗаголовкиИТекущаяСтраница: "TitlesAndCurrentPage",
  ТекущаяСтраница: "CurrentPage",
} as const

export type FormPagesState = keyof typeof FormPagesStateToEnterprise
export type FormPagesStateEnterprise = keyof typeof FormPagesStateFromEnterprise

export const FormStandardURLVariantToEnterprise = {
  ReportVariant: "ВариантОтчета",
  Record: "Запись",
  ListCurrentRowRecord: "ЗаписьТекущейСтрокиСписка",
  Object: "Объект",
  ListCurrentRowObject: "ОбъектТекущейСтрокиСписка",
  Report: "Отчет",
  ReportWithCurrentSettings: "ОтчетСТекущимиНастройками",
  List: "Список",
  ListWithCurrentSettings: "СписокСТекущимиНастройками",
  ListWithCurrentSettingsAndRow: "СписокСТекущимиНастройкамиИСтрокой",
} as const

export const FormStandardURLVariantFromEnterprise = {
  ВариантОтчета: "ReportVariant",
  Запись: "Record",
  ЗаписьТекущейСтрокиСписка: "ListCurrentRowRecord",
  Объект: "Object",
  ОбъектТекущейСтрокиСписка: "ListCurrentRowObject",
  Отчет: "Report",
  ОтчетСТекущимиНастройками: "ReportWithCurrentSettings",
  Список: "List",
  СписокСТекущимиНастройками: "ListWithCurrentSettings",
  СписокСТекущимиНастройкамиИСтрокой: "ListWithCurrentSettingsAndRow",
} as const

export type FormStandardURLVariant = keyof typeof FormStandardURLVariantToEnterprise
export type FormStandardURLVariantEnterprise = keyof typeof FormStandardURLVariantFromEnterprise

export const FormWindowOpeningModeToEnterprise = {
  LockWholeInterface: "БлокироватьВесьИнтерфейс",
  LockOwnerWindow: "БлокироватьОкноВладельца",
  DontBlock: "НеБлокировать",
} as const

export const FormWindowOpeningModeFromEnterprise = {
  БлокироватьВесьИнтерфейс: "LockWholeInterface",
  БлокироватьОкноВладельца: "LockOwnerWindow",
  НеБлокировать: "DontBlock",
} as const

export type FormWindowOpeningMode = keyof typeof FormWindowOpeningModeToEnterprise
export type FormWindowOpeningModeEnterprise = keyof typeof FormWindowOpeningModeFromEnterprise

export const GraphicalSchemaGridDrawModeToEnterprise = {
  Lines: "Линии",
  None: "НеРисовать",
  Dots: "Точки",
  Chess: "ШахматнаяСетка",
} as const

export const GraphicalSchemaGridDrawModeFromEnterprise = {
  Линии: "Lines",
  НеРисовать: "None",
  Точки: "Dots",
  ШахматнаяСетка: "Chess",
} as const

export type GraphicalSchemaGridDrawMode = keyof typeof GraphicalSchemaGridDrawModeToEnterprise
export type GraphicalSchemaGridDrawModeEnterprise = keyof typeof GraphicalSchemaGridDrawModeFromEnterprise

export const GraphicalSchemaItemPictureLocationToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const GraphicalSchemaItemPictureLocationFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type GraphicalSchemaItemPictureLocation = keyof typeof GraphicalSchemaItemPictureLocationToEnterprise
export type GraphicalSchemaItemPictureLocationEnterprise = keyof typeof GraphicalSchemaItemPictureLocationFromEnterprise

export const GraphicalSchemaShapesToEnterprise = {
  Block: "Блок",
  Document: "Документ",
  None: "Нет",
  Folder: "Папка",
  VerticalBrackets: "СкобкиВертикальные",
  HorizontalBrackets: "СкобкиГоризонтальные",
  UpArrow: "СтрелкаВверх",
  UpDownArrow: "СтрелкаВверхВниз",
  LeftArrow: "СтрелкаВлево",
  LeftRightArrow: "СтрелкаВлевоВправо",
  DownArrow: "СтрелкаВниз",
  RightArrow: "СтрелкаВправо",
  File: "Файл",
  Ellipse: "Эллипс",
} as const

export const GraphicalSchemaShapesFromEnterprise = {
  Блок: "Block",
  Документ: "Document",
  Нет: "None",
  Папка: "Folder",
  СкобкиВертикальные: "VerticalBrackets",
  СкобкиГоризонтальные: "HorizontalBrackets",
  СтрелкаВверх: "UpArrow",
  СтрелкаВверхВниз: "UpDownArrow",
  СтрелкаВлево: "LeftArrow",
  СтрелкаВлевоВправо: "LeftRightArrow",
  СтрелкаВниз: "DownArrow",
  СтрелкаВправо: "RightArrow",
  Файл: "File",
  Эллипс: "Ellipse",
} as const

export type GraphicalSchemaShapes = keyof typeof GraphicalSchemaShapesToEnterprise
export type GraphicalSchemaShapesEnterprise = keyof typeof GraphicalSchemaShapesFromEnterprise

export const GraphicalSchemeElementSideTypeToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const GraphicalSchemeElementSideTypeFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type GraphicalSchemeElementSideType = keyof typeof GraphicalSchemeElementSideTypeToEnterprise
export type GraphicalSchemeElementSideTypeEnterprise = keyof typeof GraphicalSchemeElementSideTypeFromEnterprise

export const HTMLDocumentFieldModeToEnterprise = {
  Browse: "Просмотр",
  Design: "Редактирование",
} as const

export const HTMLDocumentFieldModeFromEnterprise = {
  Просмотр: "Browse",
  Редактирование: "Design",
} as const

export type HTMLDocumentFieldMode = keyof typeof HTMLDocumentFieldModeToEnterprise
export type HTMLDocumentFieldModeEnterprise = keyof typeof HTMLDocumentFieldModeFromEnterprise

export const HorizontalAlignToEnterprise = {
  Auto: "Авто",
  Left: "Лево",
  Justify: "ПоШирине",
  Right: "Право",
  Center: "Центр",
} as const

export const HorizontalAlignFromEnterprise = {
  Авто: "Auto",
  Лево: "Left",
  ПоШирине: "Justify",
  Право: "Right",
  Центр: "Center",
} as const

export type HorizontalAlign = keyof typeof HorizontalAlignToEnterprise
export type HorizontalAlignEnterprise = keyof typeof HorizontalAlignFromEnterprise

export const IncompleteChoiceModeToEnterprise = {
  OnActivate: "ПриАктивизации",
  OnEnterPressed: "ПриНажатииEnter",
} as const

export const IncompleteChoiceModeFromEnterprise = {
  ПриАктивизации: "OnActivate",
  ПриНажатииEnter: "OnEnterPressed",
} as const

export type IncompleteChoiceMode = keyof typeof IncompleteChoiceModeToEnterprise
export type IncompleteChoiceModeEnterprise = keyof typeof IncompleteChoiceModeFromEnterprise

export const InitialListViewToEnterprise = {
  Auto: "Авто",
  End: "Конец",
  Beginning: "Начало",
} as const

export const InitialListViewFromEnterprise = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Beginning",
} as const

export type InitialListView = keyof typeof InitialListViewToEnterprise
export type InitialListViewEnterprise = keyof typeof InitialListViewFromEnterprise

export const InitialTreeViewToEnterprise = {
  NoExpand: "НеРаскрывать",
  ExpandTopLevel: "РаскрыватьВерхнийУровень",
  ExpandAllLevels: "РаскрыватьВсеУровни",
} as const

export const InitialTreeViewFromEnterprise = {
  НеРаскрывать: "NoExpand",
  РаскрыватьВерхнийУровень: "ExpandTopLevel",
  РаскрыватьВсеУровни: "ExpandAllLevels",
} as const

export type InitialTreeView = keyof typeof InitialTreeViewToEnterprise
export type InitialTreeViewEnterprise = keyof typeof InitialTreeViewFromEnterprise

export const InputFieldAutofillHintToEnterprise = {
  Email: "Email",
  City: "Город",
  GivenName: "Имя",
  UserName: "ИмяПользователя",
  PostalCode: "Индекс",
  DontUse: "НеИспользовать",
  NewPassword: "НовыйПароль",
  CreditCardNumber: "НомерБанковскойКарты",
  PhoneNumber: "НомерТелефона",
  OneTimeCode: "ОдноразовыйПароль",
  MiddleName: "Отчество",
  Password: "Пароль",
  FullName: "ПолноеИмя",
  NamePrefix: "ПрефиксИмени",
  Region: "Регион",
  Country: "Страна",
  NameSuffix: "СуффиксИмени",
  Street: "Улица",
  FamilyName: "Фамилия",
} as const

export const InputFieldAutofillHintFromEnterprise = {
  Email: "Email",
  Город: "City",
  Имя: "GivenName",
  ИмяПользователя: "UserName",
  Индекс: "PostalCode",
  НеИспользовать: "DontUse",
  НовыйПароль: "NewPassword",
  НомерБанковскойКарты: "CreditCardNumber",
  НомерТелефона: "PhoneNumber",
  ОдноразовыйПароль: "OneTimeCode",
  Отчество: "MiddleName",
  Пароль: "Password",
  ПолноеИмя: "FullName",
  ПрефиксИмени: "NamePrefix",
  Регион: "Region",
  Страна: "Country",
  СуффиксИмени: "NameSuffix",
  Улица: "Street",
  Фамилия: "FamilyName",
} as const

export type InputFieldAutofillHint = keyof typeof InputFieldAutofillHintToEnterprise
export type InputFieldAutofillHintEnterprise = keyof typeof InputFieldAutofillHintFromEnterprise

export const InputFieldCommandSourceToEnterprise = {
  MultipleValue: "МножественноеЗначение",
  InputArea: "ОбластьВвода",
} as const

export const InputFieldCommandSourceFromEnterprise = {
  МножественноеЗначение: "MultipleValue",
  ОбластьВвода: "InputArea",
} as const

export type InputFieldCommandSource = keyof typeof InputFieldCommandSourceToEnterprise
export type InputFieldCommandSourceEnterprise = keyof typeof InputFieldCommandSourceFromEnterprise

export const InputFieldMultipleValuePictureShapeToEnterprise = {
  Auto: "Авто",
  Rect: "Квадрат",
  Circle: "Круг",
} as const

export const InputFieldMultipleValuePictureShapeFromEnterprise = {
  Авто: "Auto",
  Квадрат: "Rect",
  Круг: "Circle",
} as const

export type InputFieldMultipleValuePictureShape = keyof typeof InputFieldMultipleValuePictureShapeToEnterprise
export type InputFieldMultipleValuePictureShapeEnterprise =
  keyof typeof InputFieldMultipleValuePictureShapeFromEnterprise

export const InputFieldMultipleValuePictureSizeToEnterprise = {
  Auto: "Авто",
  Large: "Крупный",
  Small: "Маленький",
  Medium: "Средний",
} as const

export const InputFieldMultipleValuePictureSizeFromEnterprise = {
  Авто: "Auto",
  Крупный: "Large",
  Маленький: "Small",
  Средний: "Medium",
} as const

export type InputFieldMultipleValuePictureSize = keyof typeof InputFieldMultipleValuePictureSizeToEnterprise
export type InputFieldMultipleValuePictureSizeEnterprise = keyof typeof InputFieldMultipleValuePictureSizeFromEnterprise

export const InputFieldStandardCommandToEnterprise = {
  Paste: "Вставить",
  Choose: "Выбрать",
  SelectAll: "ВыделитьВсе",
  Cut: "Вырезать",
  AddEmptyValue: "ДобавитьПустоеЗначение",
  Copy: "Копировать",
  SearchEverywhere: "НайтиВезде",
  Open: "Открыть",
  Clear: "Очистить",
  Create: "Создать",
  Delete: "Удалить",
} as const

export const InputFieldStandardCommandFromEnterprise = {
  Вставить: "Paste",
  Выбрать: "Choose",
  ВыделитьВсе: "SelectAll",
  Вырезать: "Cut",
  ДобавитьПустоеЗначение: "AddEmptyValue",
  Копировать: "Copy",
  НайтиВезде: "SearchEverywhere",
  Открыть: "Open",
  Очистить: "Clear",
  Создать: "Create",
  Удалить: "Delete",
} as const

export type InputFieldStandardCommand = keyof typeof InputFieldStandardCommandToEnterprise
export type InputFieldStandardCommandEnterprise = keyof typeof InputFieldStandardCommandFromEnterprise

export const ItemHeightControlVariantToEnterprise = {
  Auto: "Авто",
  UseHeightInFormRows: "ВСтрокахФормы",
  UseContentHeight: "ПоСодержимому",
} as const

export const ItemHeightControlVariantFromEnterprise = {
  Авто: "Auto",
  ВСтрокахФормы: "UseHeightInFormRows",
  ПоСодержимому: "UseContentHeight",
} as const

export type ItemHeightControlVariant = keyof typeof ItemHeightControlVariantToEnterprise
export type ItemHeightControlVariantEnterprise = keyof typeof ItemHeightControlVariantFromEnterprise

export const ItemHorizontalLocationToEnterprise = {
  Auto: "Авто",
  Left: "Лево",
  Right: "Право",
  Center: "Центр",
} as const

export const ItemHorizontalLocationFromEnterprise = {
  Авто: "Auto",
  Лево: "Left",
  Право: "Right",
  Центр: "Center",
} as const

export type ItemHorizontalLocation = keyof typeof ItemHorizontalLocationToEnterprise
export type ItemHorizontalLocationEnterprise = keyof typeof ItemHorizontalLocationFromEnterprise

export const ItemVerticalAlignToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  Bottom: "Низ",
  Center: "Центр",
} as const

export const ItemVerticalAlignFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Низ: "Bottom",
  Центр: "Center",
} as const

export type ItemVerticalAlign = keyof typeof ItemVerticalAlignToEnterprise
export type ItemVerticalAlignEnterprise = keyof typeof ItemVerticalAlignFromEnterprise

export const ItemsAndTitlesAlignVariantToEnterprise = {
  Auto: "Авто",
  None: "Нет",
  ItemsLeftTitlesLeft: "ЭлементыЛевоЗаголовкиЛево",
  ItemsLeftTitlesRight: "ЭлементыЛевоЗаголовкиПраво",
  ItemsRightTitlesLeft: "ЭлементыПравоЗаголовкиЛево",
  ItemsRightTitlesRight: "ЭлементыПравоЗаголовкиПраво",
} as const

export const ItemsAndTitlesAlignVariantFromEnterprise = {
  Авто: "Auto",
  Нет: "None",
  ЭлементыЛевоЗаголовкиЛево: "ItemsLeftTitlesLeft",
  ЭлементыЛевоЗаголовкиПраво: "ItemsLeftTitlesRight",
  ЭлементыПравоЗаголовкиЛево: "ItemsRightTitlesLeft",
  ЭлементыПравоЗаголовкиПраво: "ItemsRightTitlesRight",
} as const

export type ItemsAndTitlesAlignVariant = keyof typeof ItemsAndTitlesAlignVariantToEnterprise
export type ItemsAndTitlesAlignVariantEnterprise = keyof typeof ItemsAndTitlesAlignVariantFromEnterprise

export const LabelPictureLocationToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const LabelPictureLocationFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type LabelPictureLocation = keyof typeof LabelPictureLocationToEnterprise
export type LabelPictureLocationEnterprise = keyof typeof LabelPictureLocationFromEnterprise

export const LinkedValueChangeModeToEnterprise = {
  DontChange: "НеИзменять",
  Clear: "Очищать",
} as const

export const LinkedValueChangeModeFromEnterprise = {
  НеИзменять: "DontChange",
  Очищать: "Clear",
} as const

export type LinkedValueChangeMode = keyof typeof LinkedValueChangeModeToEnterprise
export type LinkedValueChangeModeEnterprise = keyof typeof LinkedValueChangeModeFromEnterprise

export const ListEditModeToEnterprise = {
  InDialog: "ВДиалоге",
  InList: "ВСписке",
} as const

export const ListEditModeFromEnterprise = {
  ВДиалоге: "InDialog",
  ВСписке: "InList",
} as const

export type ListEditMode = keyof typeof ListEditModeToEnterprise
export type ListEditModeEnterprise = keyof typeof ListEditModeFromEnterprise

export const MainClientApplicationWindowModeToEnterprise = {
  EmbeddedWorkplace: "ВстроенноеРабочееМесто",
  Kiosk: "Киоск",
  Normal: "Обычный",
  FullscreenWorkplace: "ПолноэкранноеРабочееМесто",
  Workplace: "РабочееМесто",
} as const

export const MainClientApplicationWindowModeFromEnterprise = {
  ВстроенноеРабочееМесто: "EmbeddedWorkplace",
  Киоск: "Kiosk",
  Обычный: "Normal",
  ПолноэкранноеРабочееМесто: "FullscreenWorkplace",
  РабочееМесто: "Workplace",
} as const

export type MainClientApplicationWindowMode = keyof typeof MainClientApplicationWindowModeToEnterprise
export type MainClientApplicationWindowModeEnterprise = keyof typeof MainClientApplicationWindowModeFromEnterprise

export const NewRowShowCheckVariantToEnterprise = {
  DontCheck: "НеПроверять",
  FilterMismatchMessage: "СообщатьОНесоответствииОтбору",
} as const

export const NewRowShowCheckVariantFromEnterprise = {
  НеПроверять: "DontCheck",
  СообщатьОНесоответствииОтбору: "FilterMismatchMessage",
} as const

export type NewRowShowCheckVariant = keyof typeof NewRowShowCheckVariantToEnterprise
export type NewRowShowCheckVariantEnterprise = keyof typeof NewRowShowCheckVariantFromEnterprise

export const OnScreenKeyboardReturnKeyTextToEnterprise = {
  Auto: "Авто",
  Return: "Ввод",
  Done: "Готово",
  Next: "Далее",
  Search: "Найти",
  Send: "Отправить",
  Go: "Перейти",
  Join: "Подключиться",
  Continue: "Продолжить",
} as const

export const OnScreenKeyboardReturnKeyTextFromEnterprise = {
  Авто: "Auto",
  Ввод: "Return",
  Готово: "Done",
  Далее: "Next",
  Найти: "Search",
  Отправить: "Send",
  Перейти: "Go",
  Подключиться: "Join",
  Продолжить: "Continue",
} as const

export type OnScreenKeyboardReturnKeyText = keyof typeof OnScreenKeyboardReturnKeyTextToEnterprise
export type OnScreenKeyboardReturnKeyTextEnterprise = keyof typeof OnScreenKeyboardReturnKeyTextFromEnterprise

export const OrientationToEnterprise = {
  Auto: "Авто",
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
} as const

export const OrientationFromEnterprise = {
  Авто: "Auto",
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
} as const

export type Orientation = keyof typeof OrientationToEnterprise
export type OrientationEnterprise = keyof typeof OrientationFromEnterprise

export const PanelPictureLocationToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const PanelPictureLocationFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type PanelPictureLocation = keyof typeof PanelPictureLocationToEnterprise
export type PanelPictureLocationEnterprise = keyof typeof PanelPictureLocationFromEnterprise

export const PictureFormatToEnterprise = {
  BMP: "BMP",
  EMF: "EMF",
  GIF: "GIF",
  Icon: "Icon",
  JPEG: "JPEG",
  PNG: "PNG",
  SVG: "SVG",
  TIFF: "TIFF",
  WMF: "WMF",
  UnknownFormat: "НеизвестныйФормат",
} as const

export const PictureFormatFromEnterprise = {
  BMP: "BMP",
  EMF: "EMF",
  GIF: "GIF",
  Icon: "Icon",
  JPEG: "JPEG",
  PNG: "PNG",
  SVG: "SVG",
  TIFF: "TIFF",
  WMF: "WMF",
  НеизвестныйФормат: "UnknownFormat",
} as const

export type PictureFormat = keyof typeof PictureFormatToEnterprise
export type PictureFormatEnterprise = keyof typeof PictureFormatFromEnterprise

export const PictureSizeToEnterprise = {
  AutoSize: "АвтоРазмер",
  AutoSizeIgnoreScale: "АвтоРазмерБезУчетаМасштаба",
  ByFontSize: "ПоРазмеруШрифта",
  Proportionally: "Пропорционально",
  Stretch: "Растянуть",
  RealSize: "РеальныйРазмер",
  RealSizeIgnoreScale: "РеальныйРазмерБезУчетаМасштаба",
  Tile: "Черепица",
} as const

export const PictureSizeFromEnterprise = {
  АвтоРазмер: "AutoSize",
  АвтоРазмерБезУчетаМасштаба: "AutoSizeIgnoreScale",
  ПоРазмеруШрифта: "ByFontSize",
  Пропорционально: "Proportionally",
  Растянуть: "Stretch",
  РеальныйРазмер: "RealSize",
  РеальныйРазмерБезУчетаМасштаба: "RealSizeIgnoreScale",
  Черепица: "Tile",
} as const

export type PictureSize = keyof typeof PictureSizeToEnterprise
export type PictureSizeEnterprise = keyof typeof PictureSizeFromEnterprise

export const PrintDialogUseModeToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const PrintDialogUseModeFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type PrintDialogUseMode = keyof typeof PrintDialogUseModeToEnterprise
export type PrintDialogUseModeEnterprise = keyof typeof PrintDialogUseModeFromEnterprise

export const ProgressBarSmoothingModeToEnterprise = {
  Smooth: "Плавный",
  Broken: "Прерывистый",
  BrokenTilt: "ПрерывистыйНаклонный",
} as const

export const ProgressBarSmoothingModeFromEnterprise = {
  Плавный: "Smooth",
  Прерывистый: "Broken",
  ПрерывистыйНаклонный: "BrokenTilt",
} as const

export type ProgressBarSmoothingMode = keyof typeof ProgressBarSmoothingModeToEnterprise
export type ProgressBarSmoothingModeEnterprise = keyof typeof ProgressBarSmoothingModeFromEnterprise

export const RadioButtonTypeToEnterprise = {
  Auto: "Авто",
  RadioButton: "Переключатель",
  Tumbler: "Тумблер",
} as const

export const RadioButtonTypeFromEnterprise = {
  Авто: "Auto",
  Переключатель: "RadioButton",
  Тумблер: "Tumbler",
} as const

export type RadioButtonType = keyof typeof RadioButtonTypeToEnterprise
export type RadioButtonTypeEnterprise = keyof typeof RadioButtonTypeFromEnterprise

export const RefreshRequestMethodToEnterprise = {
  None: "Нет",
  PullFromTop: "ПотянутьСверху",
  PullFromTopOrBottom: "ПотянутьСверхуИлиСнизу",
  PullFromBottom: "ПотянутьСнизу",
} as const

export const RefreshRequestMethodFromEnterprise = {
  Нет: "None",
  ПотянутьСверху: "PullFromTop",
  ПотянутьСверхуИлиСнизу: "PullFromTopOrBottom",
  ПотянутьСнизу: "PullFromBottom",
} as const

export type RefreshRequestMethod = keyof typeof RefreshRequestMethodToEnterprise
export type RefreshRequestMethodEnterprise = keyof typeof RefreshRequestMethodFromEnterprise

export const ReportFormTypeToEnterprise = {
  Variant: "Вариант",
  Settings: "Настройка",
  Main: "Основная",
} as const

export const ReportFormTypeFromEnterprise = {
  Вариант: "Variant",
  Настройка: "Settings",
  Основная: "Main",
} as const

export type ReportFormType = keyof typeof ReportFormTypeToEnterprise
export type ReportFormTypeEnterprise = keyof typeof ReportFormTypeFromEnterprise

export const ReportResultViewModeToEnterprise = {
  Auto: "Авто",
  Compact: "Компактный",
  Default: "Обычный",
} as const

export const ReportResultViewModeFromEnterprise = {
  Авто: "Auto",
  Компактный: "Compact",
  Обычный: "Default",
} as const

export type ReportResultViewMode = keyof typeof ReportResultViewModeToEnterprise
export type ReportResultViewModeEnterprise = keyof typeof ReportResultViewModeFromEnterprise

export const SaveFormDataInSettingsToEnterprise = {
  UseList: "ИспользоватьСписок",
  DontUse: "НеИспользовать",
} as const

export const SaveFormDataInSettingsFromEnterprise = {
  ИспользоватьСписок: "UseList",
  НеИспользовать: "DontUse",
} as const

export type SaveFormDataInSettings = keyof typeof SaveFormDataInSettingsToEnterprise
export type SaveFormDataInSettingsEnterprise = keyof typeof SaveFormDataInSettingsFromEnterprise

export const ScrollBarUseToEnterprise = {
  AutoUse: "ИспользоватьАвтоматически",
  UseAlways: "ИспользоватьВсегда",
  DontUse: "НеИспользовать",
} as const

export const ScrollBarUseFromEnterprise = {
  ИспользоватьАвтоматически: "AutoUse",
  ИспользоватьВсегда: "UseAlways",
  НеИспользовать: "DontUse",
} as const

export type ScrollBarUse = keyof typeof ScrollBarUseToEnterprise
export type ScrollBarUseEnterprise = keyof typeof ScrollBarUseFromEnterprise

export const ScrollingTextModeToEnterprise = {
  Fast: "Быстро",
  Slow: "Медленно",
  DontUse: "НеИспользовать",
  Normal: "Нормально",
  VeryFast: "ОченьБыстро",
  VerySlow: "ОченьМедленно",
} as const

export const ScrollingTextModeFromEnterprise = {
  Быстро: "Fast",
  Медленно: "Slow",
  НеИспользовать: "DontUse",
  Нормально: "Normal",
  ОченьБыстро: "VeryFast",
  ОченьМедленно: "VerySlow",
} as const

export type ScrollingTextMode = keyof typeof ScrollingTextModeToEnterprise
export type ScrollingTextModeEnterprise = keyof typeof ScrollingTextModeFromEnterprise

export const SearchControlLocationToEnterprise = {
  Auto: "Авто",
  CommandBar: "КоманднаяПанель",
  None: "Нет",
} as const

export const SearchControlLocationFromEnterprise = {
  Авто: "Auto",
  КоманднаяПанель: "CommandBar",
  Нет: "None",
} as const

export type SearchControlLocation = keyof typeof SearchControlLocationToEnterprise
export type SearchControlLocationEnterprise = keyof typeof SearchControlLocationFromEnterprise

export const SearchInTableOnInputToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const SearchInTableOnInputFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type SearchInTableOnInput = keyof typeof SearchInTableOnInputToEnterprise
export type SearchInTableOnInputEnterprise = keyof typeof SearchInTableOnInputFromEnterprise

export const SearchStringLocationToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  FormCaption: "ЗаголовокФормы",
  CommandBar: "КоманднаяПанель",
  Bottom: "Низ",
  PullFromTop: "ПотянутьСверху",
  None: "Нет",
} as const

export const SearchStringLocationFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  ЗаголовокФормы: "FormCaption",
  КоманднаяПанель: "CommandBar",
  Низ: "Bottom",
  ПотянутьСверху: "PullFromTop",
  Нет: "None",
} as const

export type SearchStringLocation = keyof typeof SearchStringLocationToEnterprise
export type SearchStringLocationEnterprise = keyof typeof SearchStringLocationFromEnterprise

export const SelectionShowModeToEnterprise = {
  Always: "Всегда",
  DontShow: "НеОтображать",
  WhenActive: "ПриАктивности",
  WhenMultipleCellsSelected: "ПриВыделенииНесколькихЯчеек",
  WhenMultipleCellsSelectedWhenActive: "ПриВыделенииНесколькихЯчеекПриАктивности",
} as const

export const SelectionShowModeFromEnterprise = {
  Всегда: "Always",
  НеОтображать: "DontShow",
  ПриАктивности: "WhenActive",
  ПриВыделенииНесколькихЯчеек: "WhenMultipleCellsSelected",
  ПриВыделенииНесколькихЯчеекПриАктивности: "WhenMultipleCellsSelectedWhenActive",
} as const

export type SelectionShowMode = keyof typeof SelectionShowModeToEnterprise
export type SelectionShowModeEnterprise = keyof typeof SelectionShowModeFromEnterprise

export const ShowTabsToEnterprise = {
  DontUse: "НеИспользовать",
  Top: "Сверху",
  TopMultiLine: "СверхуМногострочный",
  TopMultilineTransposition: "СверхуМногострочныйСПерестановкой",
  TopScrolling: "СверхуСПрокруткой",
  LeftVertical: "СлеваВертикально",
  LeftHorizontal: "СлеваГоризонтально",
  Bottom: "Снизу",
  BottomMultiLine: "СнизуМногострочный",
  BottomMultilineTransposition: "СнизуМногострочныйСПерестановкой",
  BottomScrolling: "СнизуСПрокруткой",
  RightVertical: "СправаВертикально",
  RightHorizontal: "СправаГоризонтально",
} as const

export const ShowTabsFromEnterprise = {
  НеИспользовать: "DontUse",
  Сверху: "Top",
  СверхуМногострочный: "TopMultiLine",
  СверхуМногострочныйСПерестановкой: "TopMultilineTransposition",
  СверхуСПрокруткой: "TopScrolling",
  СлеваВертикально: "LeftVertical",
  СлеваГоризонтально: "LeftHorizontal",
  Снизу: "Bottom",
  СнизуМногострочный: "BottomMultiLine",
  СнизуМногострочныйСПерестановкой: "BottomMultilineTransposition",
  СнизуСПрокруткой: "BottomScrolling",
  СправаВертикально: "RightVertical",
  СправаГоризонтально: "RightHorizontal",
} as const

export type ShowTabs = keyof typeof ShowTabsToEnterprise
export type ShowTabsEnterprise = keyof typeof ShowTabsFromEnterprise

export const SizeChangeModeToEnterprise = {
  QuickChange: "БыстроеИзменение",
  Normal: "Обычный",
} as const

export const SizeChangeModeFromEnterprise = {
  БыстроеИзменение: "QuickChange",
  Обычный: "Normal",
} as const

export type SizeChangeMode = keyof typeof SizeChangeModeToEnterprise
export type SizeChangeModeEnterprise = keyof typeof SizeChangeModeFromEnterprise

export const SpecialTextInputModeToEnterprise = {
  Email: "Email",
  URL: "URL",
  Auto: "Авто",
  None: "Нет",
  PhoneNumber: "НомерТелефона",
  Digits: "Цифры",
  DigitsAndPunctuation: "ЦифрыИПунктуация",
} as const

export const SpecialTextInputModeFromEnterprise = {
  Email: "Email",
  URL: "URL",
  Авто: "Auto",
  Нет: "None",
  НомерТелефона: "PhoneNumber",
  Цифры: "Digits",
  ЦифрыИПунктуация: "DigitsAndPunctuation",
} as const

export type SpecialTextInputMode = keyof typeof SpecialTextInputModeToEnterprise
export type SpecialTextInputModeEnterprise = keyof typeof SpecialTextInputModeFromEnterprise

export const SpellCheckingOnTextInputToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const SpellCheckingOnTextInputFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type SpellCheckingOnTextInput = keyof typeof SpellCheckingOnTextInputToEnterprise
export type SpellCheckingOnTextInputEnterprise = keyof typeof SpellCheckingOnTextInputFromEnterprise

export const StandardAppearanceToEnterprise = {
  Orange: "Апельсин",
  Asphalt: "Асфальт",
  None: "БезОформления",
  Turquoise: "Бирюза",
  Bronze: "Бронза",
  Spring: "Весна",
  Wood: "Дерево",
  Winter: "Зима",
  Interface: "Интерфейс",
  Stone: "Камень",
  Classic: "Классика",
  Classic2: "Классика2",
  Classic3: "Классика3",
  Ice: "Лед",
  Summer: "Лето",
  Copper: "Медь",
  Autumn: "Осень",
  Sand: "Песок",
  Platinum: "Платина",
  Silver: "Серебро",
  Textile: "Текстиль",
  Grass: "Трава",
} as const

export const StandardAppearanceFromEnterprise = {
  Апельсин: "Orange",
  Асфальт: "Asphalt",
  БезОформления: "None",
  Бирюза: "Turquoise",
  Бронза: "Bronze",
  Весна: "Spring",
  Дерево: "Wood",
  Зима: "Winter",
  Интерфейс: "Interface",
  Камень: "Stone",
  Классика: "Classic",
  Классика2: "Classic2",
  Классика3: "Classic3",
  Лед: "Ice",
  Лето: "Summer",
  Медь: "Copper",
  Осень: "Autumn",
  Песок: "Sand",
  Платина: "Platinum",
  Серебро: "Silver",
  Текстиль: "Textile",
  Трава: "Grass",
} as const

export type StandardAppearance = keyof typeof StandardAppearanceToEnterprise
export type StandardAppearanceEnterprise = keyof typeof StandardAppearanceFromEnterprise

export const StandardCommandsGroupToEnterprise = {
  FormCommandBarImportant: "КоманднаяПанельФормыВажное",
  FormCommandBarCreateBasedOn: "КоманднаяПанельФормыСоздатьНаОсновании",
  ActionsPanelReports: "ПанельДействийОтчеты",
  ActionsPanelTools: "ПанельДействийСервис",
  ActionsPanelCreate: "ПанельДействийСоздать",
  NavigationPanelImportant: "ПанельНавигацииВажное",
  NavigationPanelOrdinary: "ПанельНавигацииОбычное",
  NavigationPanelSeeAlso: "ПанельНавигацииСмТакже",
  FormNavigationPanelImportant: "ПанельНавигацииФормыВажное",
  FormNavigationPanelGoTo: "ПанельНавигацииФормыПерейти",
  FormNavigationPanelSeeAlso: "ПанельНавигацииФормыСмТакже",
} as const

export const StandardCommandsGroupFromEnterprise = {
  КоманднаяПанельФормыВажное: "FormCommandBarImportant",
  КоманднаяПанельФормыСоздатьНаОсновании: "FormCommandBarCreateBasedOn",
  ПанельДействийОтчеты: "ActionsPanelReports",
  ПанельДействийСервис: "ActionsPanelTools",
  ПанельДействийСоздать: "ActionsPanelCreate",
  ПанельНавигацииВажное: "NavigationPanelImportant",
  ПанельНавигацииОбычное: "NavigationPanelOrdinary",
  ПанельНавигацииСмТакже: "NavigationPanelSeeAlso",
  ПанельНавигацииФормыВажное: "FormNavigationPanelImportant",
  ПанельНавигацииФормыПерейти: "FormNavigationPanelGoTo",
  ПанельНавигацииФормыСмТакже: "FormNavigationPanelSeeAlso",
} as const

export type StandardCommandsGroup = keyof typeof StandardCommandsGroupToEnterprise
export type StandardCommandsGroupEnterprise = keyof typeof StandardCommandsGroupFromEnterprise

export const TableBehaviorOnHorizontalCompressionToEnterprise = {
  Auto: "Авто",
  MoveItemsByImportance: "ПереноситьЭлементыПоВажности",
  HideItemsByImportance: "СкрыватьЭлементыПоВажности",
} as const

export const TableBehaviorOnHorizontalCompressionFromEnterprise = {
  Авто: "Auto",
  ПереноситьЭлементыПоВажности: "MoveItemsByImportance",
  СкрыватьЭлементыПоВажности: "HideItemsByImportance",
} as const

export type TableBehaviorOnHorizontalCompression = keyof typeof TableBehaviorOnHorizontalCompressionToEnterprise
export type TableBehaviorOnHorizontalCompressionEnterprise =
  keyof typeof TableBehaviorOnHorizontalCompressionFromEnterprise

export const TableBoxRowInputModeToEnterprise = {
  EndOfWindow: "ВКонецОкна",
  EndOfList: "ВКонецСписка",
  BeforeCurrentRow: "ПередТекущейСтрокой",
  AfterCurrentRow: "ПослеТекущейСтроки",
} as const

export const TableBoxRowInputModeFromEnterprise = {
  ВКонецОкна: "EndOfWindow",
  ВКонецСписка: "EndOfList",
  ПередТекущейСтрокой: "BeforeCurrentRow",
  ПослеТекущейСтроки: "AfterCurrentRow",
} as const

export type TableBoxRowInputMode = keyof typeof TableBoxRowInputModeToEnterprise
export type TableBoxRowInputModeEnterprise = keyof typeof TableBoxRowInputModeFromEnterprise

export const TableBoxRowSelectionModeToEnterprise = {
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const TableBoxRowSelectionModeFromEnterprise = {
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type TableBoxRowSelectionMode = keyof typeof TableBoxRowSelectionModeToEnterprise
export type TableBoxRowSelectionModeEnterprise = keyof typeof TableBoxRowSelectionModeFromEnterprise

export const TableBoxSelectionModeToEnterprise = {
  MultiLine: "Множественный",
  SingleLine: "Одиночный",
} as const

export const TableBoxSelectionModeFromEnterprise = {
  Множественный: "MultiLine",
  Одиночный: "SingleLine",
} as const

export type TableBoxSelectionMode = keyof typeof TableBoxSelectionModeToEnterprise
export type TableBoxSelectionModeEnterprise = keyof typeof TableBoxSelectionModeFromEnterprise

export const TableCurrentRowUseToEnterprise = {
  Auto: "Авто",
  Choice: "Выбор",
  SelectionPresentation: "ОтображениеВыделения",
  SelectionPresentationAndChoice: "ОтображениеВыделенияИВыбор",
} as const

export const TableCurrentRowUseFromEnterprise = {
  Авто: "Auto",
  Выбор: "Choice",
  ОтображениеВыделения: "SelectionPresentation",
  ОтображениеВыделенияИВыбор: "SelectionPresentationAndChoice",
} as const

export type TableCurrentRowUse = keyof typeof TableCurrentRowUseToEnterprise
export type TableCurrentRowUseEnterprise = keyof typeof TableCurrentRowUseFromEnterprise

export const TableHeightControlVariantToEnterprise = {
  Auto: "Авто",
  UseHeightInTableRows: "ВСтрокахТаблицы",
  UseHeightInFormRows: "ВСтрокахФормы",
  UseContentHeight: "ПоСодержимому",
} as const

export const TableHeightControlVariantFromEnterprise = {
  Авто: "Auto",
  ВСтрокахТаблицы: "UseHeightInTableRows",
  ВСтрокахФормы: "UseHeightInFormRows",
  ПоСодержимому: "UseContentHeight",
} as const

export type TableHeightControlVariant = keyof typeof TableHeightControlVariantToEnterprise
export type TableHeightControlVariantEnterprise = keyof typeof TableHeightControlVariantFromEnterprise

export const TableRepresentationToEnterprise = {
  Tree: "Дерево",
  HierarchicalList: "ИерархическийСписок",
  List: "Список",
} as const

export const TableRepresentationFromEnterprise = {
  Дерево: "Tree",
  ИерархическийСписок: "HierarchicalList",
  Список: "List",
} as const

export type TableRepresentation = keyof typeof TableRepresentationToEnterprise
export type TableRepresentationEnterprise = keyof typeof TableRepresentationFromEnterprise

export const TableRowInputModeToEnterprise = {
  EndOfWindow: "ВКонецОкна",
  EndOfList: "ВКонецСписка",
  BeforeCurrentRow: "ПередТекущейСтрокой",
  AfterCurrentRow: "ПослеТекущейСтроки",
} as const

export const TableRowInputModeFromEnterprise = {
  ВКонецОкна: "EndOfWindow",
  ВКонецСписка: "EndOfList",
  ПередТекущейСтрокой: "BeforeCurrentRow",
  ПослеТекущейСтроки: "AfterCurrentRow",
} as const

export type TableRowInputMode = keyof typeof TableRowInputModeToEnterprise
export type TableRowInputModeEnterprise = keyof typeof TableRowInputModeFromEnterprise

export const TableRowSelectionModeToEnterprise = {
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const TableRowSelectionModeFromEnterprise = {
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type TableRowSelectionMode = keyof typeof TableRowSelectionModeToEnterprise
export type TableRowSelectionModeEnterprise = keyof typeof TableRowSelectionModeFromEnterprise

export const TableSelectionModeToEnterprise = {
  MultiRow: "Множественный",
  SingleRow: "Одиночный",
} as const

export const TableSelectionModeFromEnterprise = {
  Множественный: "MultiRow",
  Одиночный: "SingleRow",
} as const

export type TableSelectionMode = keyof typeof TableSelectionModeToEnterprise
export type TableSelectionModeEnterprise = keyof typeof TableSelectionModeFromEnterprise

export const TaskListModeToEnterprise = {
  AllTasks: "ВсеЗадачи",
  ByPerformer: "ПоИсполнителю",
} as const

export const TaskListModeFromEnterprise = {
  ВсеЗадачи: "AllTasks",
  ПоИсполнителю: "ByPerformer",
} as const

export type TaskListMode = keyof typeof TaskListModeToEnterprise
export type TaskListModeEnterprise = keyof typeof TaskListModeFromEnterprise

export const TextDirectionToEnterprise = {
  LeftToRight: "СлеваНаправо",
  RightToLeft: "СправаНалево",
} as const

export const TextDirectionFromEnterprise = {
  СлеваНаправо: "LeftToRight",
  СправаНалево: "RightToLeft",
} as const

export type TextDirection = keyof typeof TextDirectionToEnterprise
export type TextDirectionEnterprise = keyof typeof TextDirectionFromEnterprise

export const ThroughAlignToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ThroughAlignFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ThroughAlign = keyof typeof ThroughAlignToEnterprise
export type ThroughAlignEnterprise = keyof typeof ThroughAlignFromEnterprise

export const TimeScalePositionToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const TimeScalePositionFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type TimeScalePosition = keyof typeof TimeScalePositionToEnterprise
export type TimeScalePositionEnterprise = keyof typeof TimeScalePositionFromEnterprise

export const TitleLocationToEnterprise = {
  TitleLeft: "ЗаголовокСлева",
  TitleRight: "ЗаголовокСправа",
} as const

export const TitleLocationFromEnterprise = {
  ЗаголовокСлева: "TitleLeft",
  ЗаголовокСправа: "TitleRight",
} as const

export type TitleLocation = keyof typeof TitleLocationToEnterprise
export type TitleLocationEnterprise = keyof typeof TitleLocationFromEnterprise

export const ToolTipRepresentationToEnterprise = {
  Auto: "Авто",
  Balloon: "Всплывающая",
  Button: "Кнопка",
  None: "Нет",
  ShowAuto: "ОтображатьАвто",
  ShowTop: "ОтображатьСверху",
  ShowLeft: "ОтображатьСлева",
  ShowBottom: "ОтображатьСнизу",
  ShowRight: "ОтображатьСправа",
} as const

export const ToolTipRepresentationFromEnterprise = {
  Авто: "Auto",
  Всплывающая: "Balloon",
  Кнопка: "Button",
  Нет: "None",
  ОтображатьАвто: "ShowAuto",
  ОтображатьСверху: "ShowTop",
  ОтображатьСлева: "ShowLeft",
  ОтображатьСнизу: "ShowBottom",
  ОтображатьСправа: "ShowRight",
} as const

export type ToolTipRepresentation = keyof typeof ToolTipRepresentationToEnterprise
export type ToolTipRepresentationEnterprise = keyof typeof ToolTipRepresentationFromEnterprise

export const TrackBarMarkingAppearanceToEnterprise = {
  DontShow: "НеОтображать",
  TopLeft: "СверхуИлиСлева",
  BottomRight: "СнизуИлиСправа",
  BothSides: "СОбоихСторон",
} as const

export const TrackBarMarkingAppearanceFromEnterprise = {
  НеОтображать: "DontShow",
  СверхуИлиСлева: "TopLeft",
  СнизуИлиСправа: "BottomRight",
  СОбоихСторон: "BothSides",
} as const

export type TrackBarMarkingAppearance = keyof typeof TrackBarMarkingAppearanceToEnterprise
export type TrackBarMarkingAppearanceEnterprise = keyof typeof TrackBarMarkingAppearanceFromEnterprise

export const UseMenuModeToEnterprise = {
  Use: "Использовать",
  UseExtra: "ИспользоватьДополнительно",
  DontUse: "НеИспользовать",
} as const

export const UseMenuModeFromEnterprise = {
  Использовать: "Use",
  ИспользоватьДополнительно: "UseExtra",
  НеИспользовать: "DontUse",
} as const

export type UseMenuMode = keyof typeof UseMenuModeToEnterprise
export type UseMenuModeEnterprise = keyof typeof UseMenuModeFromEnterprise

export const UseOutputToEnterprise = {
  Auto: "Авто",
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const UseOutputFromEnterprise = {
  Авто: "Auto",
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type UseOutput = keyof typeof UseOutputToEnterprise
export type UseOutputEnterprise = keyof typeof UseOutputFromEnterprise

export const UserNotificationStatusToEnterprise = {
  Important: "Важное",
  Information: "Информация",
} as const

export const UserNotificationStatusFromEnterprise = {
  Важное: "Important",
  Информация: "Information",
} as const

export type UserNotificationStatus = keyof typeof UserNotificationStatusToEnterprise
export type UserNotificationStatusEnterprise = keyof typeof UserNotificationStatusFromEnterprise

export const UsualGroupBehaviorToEnterprise = {
  Auto: "Авто",
  PopUp: "Всплывающая",
  Usual: "Обычное",
  Collapsible: "Свертываемая",
} as const

export const UsualGroupBehaviorFromEnterprise = {
  Авто: "Auto",
  Всплывающая: "PopUp",
  Обычное: "Usual",
  Свертываемая: "Collapsible",
} as const

export type UsualGroupBehavior = keyof typeof UsualGroupBehaviorToEnterprise
export type UsualGroupBehaviorEnterprise = keyof typeof UsualGroupBehaviorFromEnterprise

export const UsualGroupControlRepresentationToEnterprise = {
  TitleHyperlink: "ГиперссылкаЗаголовка",
  Picture: "Картинка",
} as const

export const UsualGroupControlRepresentationFromEnterprise = {
  ГиперссылкаЗаголовка: "TitleHyperlink",
  Картинка: "Picture",
} as const

export type UsualGroupControlRepresentation = keyof typeof UsualGroupControlRepresentationToEnterprise
export type UsualGroupControlRepresentationEnterprise = keyof typeof UsualGroupControlRepresentationFromEnterprise

export const UsualGroupRepresentationToEnterprise = {
  None: "Нет",
  NormalSeparation: "ОбычноеВыделение",
  StrongSeparation: "СильноеВыделение",
  WeakSeparation: "СлабоеВыделение",
} as const

export const UsualGroupRepresentationFromEnterprise = {
  Нет: "None",
  ОбычноеВыделение: "NormalSeparation",
  СильноеВыделение: "StrongSeparation",
  СлабоеВыделение: "WeakSeparation",
} as const

export type UsualGroupRepresentation = keyof typeof UsualGroupRepresentationToEnterprise
export type UsualGroupRepresentationEnterprise = keyof typeof UsualGroupRepresentationFromEnterprise

export const VerticalAlignToEnterprise = {
  Top: "Верх",
  Bottom: "Низ",
  Center: "Центр",
} as const

export const VerticalAlignFromEnterprise = {
  Верх: "Top",
  Низ: "Bottom",
  Центр: "Center",
} as const

export type VerticalAlign = keyof typeof VerticalAlignToEnterprise
export type VerticalAlignEnterprise = keyof typeof VerticalAlignFromEnterprise

export const VerticalFormScrollToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  UseWithoutStretch: "ИспользоватьБезРастягивания",
  UseIfNecessary: "ИспользоватьПриНеобходимости",
} as const

export const VerticalFormScrollFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  ИспользоватьБезРастягивания: "UseWithoutStretch",
  ИспользоватьПриНеобходимости: "UseIfNecessary",
} as const

export type VerticalFormScroll = keyof typeof VerticalFormScrollToEnterprise
export type VerticalFormScrollEnterprise = keyof typeof VerticalFormScrollFromEnterprise

export const ViewModeApplicationOnSetReportResultToEnterprise = {
  Auto: "Авто",
  DontApply: "НеПрименять",
  Apply: "Применять",
} as const

export const ViewModeApplicationOnSetReportResultFromEnterprise = {
  Авто: "Auto",
  НеПрименять: "DontApply",
  Применять: "Apply",
} as const

export type ViewModeApplicationOnSetReportResult = keyof typeof ViewModeApplicationOnSetReportResultToEnterprise
export type ViewModeApplicationOnSetReportResultEnterprise =
  keyof typeof ViewModeApplicationOnSetReportResultFromEnterprise

export const ViewScalingModeToEnterprise = {
  Auto: "Авто",
  Large: "Крупный",
  Normal: "Обычный",
} as const

export const ViewScalingModeFromEnterprise = {
  Авто: "Auto",
  Крупный: "Large",
  Обычный: "Normal",
} as const

export type ViewScalingMode = keyof typeof ViewScalingModeToEnterprise
export type ViewScalingModeEnterprise = keyof typeof ViewScalingModeFromEnterprise

export const ViewStatusLocationToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const ViewStatusLocationFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type ViewStatusLocation = keyof typeof ViewStatusLocationToEnterprise
export type ViewStatusLocationEnterprise = keyof typeof ViewStatusLocationFromEnterprise

export const WarningOnEditRepresentationToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const WarningOnEditRepresentationFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type WarningOnEditRepresentation = keyof typeof WarningOnEditRepresentationToEnterprise
export type WarningOnEditRepresentationEnterprise = keyof typeof WarningOnEditRepresentationFromEnterprise

export const WindowAppearanceModeChangeToEnterprise = {
  Auto: "Авто",
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const WindowAppearanceModeChangeFromEnterprise = {
  Авто: "Auto",
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type WindowAppearanceModeChange = keyof typeof WindowAppearanceModeChangeToEnterprise
export type WindowAppearanceModeChangeEnterprise = keyof typeof WindowAppearanceModeChangeFromEnterprise

export const WindowAppearanceModeVariantToEnterprise = {
  Maximized: "Максимизированное",
  Minimized: "Минимизированное",
  Normal: "Нормальное",
} as const

export const WindowAppearanceModeVariantFromEnterprise = {
  Максимизированное: "Maximized",
  Минимизированное: "Minimized",
  Нормальное: "Normal",
} as const

export type WindowAppearanceModeVariant = keyof typeof WindowAppearanceModeVariantToEnterprise
export type WindowAppearanceModeVariantEnterprise = keyof typeof WindowAppearanceModeVariantFromEnterprise

export const WindowDockVariantToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const WindowDockVariantFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type WindowDockVariant = keyof typeof WindowDockVariantToEnterprise
export type WindowDockVariantEnterprise = keyof typeof WindowDockVariantFromEnterprise

export const WindowLocationVariantToEnterprise = {
  Auto: "Авто",
  DontOverlapOwner: "НеПерекрыватьВладельца",
  Center: "Центрировать",
} as const

export const WindowLocationVariantFromEnterprise = {
  Авто: "Auto",
  НеПерекрыватьВладельца: "DontOverlapOwner",
  Центрировать: "Center",
} as const

export type WindowLocationVariant = keyof typeof WindowLocationVariantToEnterprise
export type WindowLocationVariantEnterprise = keyof typeof WindowLocationVariantFromEnterprise

export const WindowSizeChangeToEnterprise = {
  Change: "Изменять",
  DontChange: "НеИзменять",
} as const

export const WindowSizeChangeFromEnterprise = {
  Изменять: "Change",
  НеИзменять: "DontChange",
} as const

export type WindowSizeChange = keyof typeof WindowSizeChangeToEnterprise
export type WindowSizeChangeEnterprise = keyof typeof WindowSizeChangeFromEnterprise

export const WindowStateVariantToEnterprise = {
  Normal: "Обычное",
  Docked: "Прикрепленное",
  Autohide: "Прячущееся",
  Float: "Свободное",
} as const

export const WindowStateVariantFromEnterprise = {
  Обычное: "Normal",
  Прикрепленное: "Docked",
  Прячущееся: "Autohide",
  Свободное: "Float",
} as const

export type WindowStateVariant = keyof typeof WindowStateVariantToEnterprise
export type WindowStateVariantEnterprise = keyof typeof WindowStateVariantFromEnterprise

export const AutoSeriesSeparationToEnterprise = {
  All: "Все",
  Maximum: "Максимум",
  Minimum: "Минимум",
  None: "Нет",
} as const

export const AutoSeriesSeparationFromEnterprise = {
  Все: "All",
  Максимум: "Maximum",
  Минимум: "Minimum",
  Нет: "None",
} as const

export type AutoSeriesSeparation = keyof typeof AutoSeriesSeparationToEnterprise
export type AutoSeriesSeparationEnterprise = keyof typeof AutoSeriesSeparationFromEnterprise

export const BarChartPointsOrderToEnterprise = {
  Auto: "Авто",
  TopToBottom: "СверхуВниз",
  BottomToTop: "СнизуВверх",
} as const

export const BarChartPointsOrderFromEnterprise = {
  Авто: "Auto",
  СверхуВниз: "TopToBottom",
  СнизуВверх: "BottomToTop",
} as const

export type BarChartPointsOrder = keyof typeof BarChartPointsOrderToEnterprise
export type BarChartPointsOrderEnterprise = keyof typeof BarChartPointsOrderFromEnterprise

export const BubbleChartNegativeValuesShowModeToEnterprise = {
  InvertedBackColor: "ИнвертированныйЦветФона",
  DontShow: "НеОтображать",
  Abs: "ПоМодулю",
  Transparent: "ПрозрачныйФон",
} as const

export const BubbleChartNegativeValuesShowModeFromEnterprise = {
  ИнвертированныйЦветФона: "InvertedBackColor",
  НеОтображать: "DontShow",
  ПоМодулю: "Abs",
  ПрозрачныйФон: "Transparent",
} as const

export type BubbleChartNegativeValuesShowMode = keyof typeof BubbleChartNegativeValuesShowModeToEnterprise
export type BubbleChartNegativeValuesShowModeEnterprise = keyof typeof BubbleChartNegativeValuesShowModeFromEnterprise

export const ChartAnimationToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartAnimationFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartAnimation = keyof typeof ChartAnimationToEnterprise
export type ChartAnimationEnterprise = keyof typeof ChartAnimationFromEnterprise

export const ChartBoundaryDetectionMethodToEnterprise = {
  AutoDetect: "АвтоОпределение",
  UseValue: "ИспользоватьЗначение",
  UseValueWithLimitations: "ИспользоватьЗначениеСОграничением",
} as const

export const ChartBoundaryDetectionMethodFromEnterprise = {
  АвтоОпределение: "AutoDetect",
  ИспользоватьЗначение: "UseValue",
  ИспользоватьЗначениеСОграничением: "UseValueWithLimitations",
} as const

export type ChartBoundaryDetectionMethod = keyof typeof ChartBoundaryDetectionMethodToEnterprise
export type ChartBoundaryDetectionMethodEnterprise = keyof typeof ChartBoundaryDetectionMethodFromEnterprise

export const ChartBubbleSizeValueSourceToEnterprise = {
  None: "Нет",
  CommonSeries: "ОбщаяСерия",
  NextSeries: "СледующаяСерия",
} as const

export const ChartBubbleSizeValueSourceFromEnterprise = {
  Нет: "None",
  ОбщаяСерия: "CommonSeries",
  СледующаяСерия: "NextSeries",
} as const

export type ChartBubbleSizeValueSource = keyof typeof ChartBubbleSizeValueSourceToEnterprise
export type ChartBubbleSizeValueSourceEnterprise = keyof typeof ChartBubbleSizeValueSourceFromEnterprise

export const ChartBubbleSizingToEnterprise = {
  IncreaseDiameter: "УвеличениеДиаметра",
  IncreaseArea: "УвеличениеПлощади",
  DecreaseDiameter: "УменьшениеДиаметра",
  DecreaseArea: "УменьшениеПлощади",
} as const

export const ChartBubbleSizingFromEnterprise = {
  УвеличениеДиаметра: "IncreaseDiameter",
  УвеличениеПлощади: "IncreaseArea",
  УменьшениеДиаметра: "DecreaseDiameter",
  УменьшениеПлощади: "DecreaseArea",
} as const

export type ChartBubbleSizing = keyof typeof ChartBubbleSizingToEnterprise
export type ChartBubbleSizingEnterprise = keyof typeof ChartBubbleSizingFromEnterprise

export const ChartColorPaletteToEnterprise = {
  Auto: "Авто",
  Gradient: "Градиентная",
  Yellow: "Желтая",
  Green: "Зеленая",
  Soft: "Мягкая",
  SoftAdaptive: "МягкаяАдаптивная",
  Orange: "Оранжевая",
  Palette32: "Палитра32",
  Palette8: "Палитра8",
  Pastel: "Пастельная",
  Custom: "Произвольная",
  Gray: "Серая",
  Blue: "Синяя",
  Warm: "Теплая",
  Cold: "Холодная",
  Bright: "Яркая",
} as const

export const ChartColorPaletteFromEnterprise = {
  Авто: "Auto",
  Градиентная: "Gradient",
  Желтая: "Yellow",
  Зеленая: "Green",
  Мягкая: "Soft",
  МягкаяАдаптивная: "SoftAdaptive",
  Оранжевая: "Orange",
  Палитра32: "Palette32",
  Палитра8: "Palette8",
  Пастельная: "Pastel",
  Произвольная: "Custom",
  Серая: "Gray",
  Синяя: "Blue",
  Теплая: "Warm",
  Холодная: "Cold",
  Яркая: "Bright",
} as const

export type ChartColorPalette = keyof typeof ChartColorPaletteToEnterprise
export type ChartColorPaletteEnterprise = keyof typeof ChartColorPaletteFromEnterprise

export const ChartGridLinesShowModeToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ChartGridLinesShowModeFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ChartGridLinesShowMode = keyof typeof ChartGridLinesShowModeToEnterprise
export type ChartGridLinesShowModeEnterprise = keyof typeof ChartGridLinesShowModeFromEnterprise

export const ChartLabelLocationToEnterprise = {
  Auto: "Авто",
  Edge: "Край",
  EdgeAuto: "КрайАвто",
  EdgeInside: "КрайВнутри",
  TopLeft: "ЛевоВерх",
  BottomLeft: "ЛевоНиз",
  TopRight: "ПравоВерх",
  BottomRight: "ПравоНиз",
  EmptySpace: "СвободноеМесто",
  TopAndLeftSpecified: "УказываетсяЛевоИВерх",
  Center: "Центр",
} as const

export const ChartLabelLocationFromEnterprise = {
  Авто: "Auto",
  Край: "Edge",
  КрайАвто: "EdgeAuto",
  КрайВнутри: "EdgeInside",
  ЛевоВерх: "TopLeft",
  ЛевоНиз: "BottomLeft",
  ПравоВерх: "TopRight",
  ПравоНиз: "BottomRight",
  СвободноеМесто: "EmptySpace",
  УказываетсяЛевоИВерх: "TopAndLeftSpecified",
  Центр: "Center",
} as const

export type ChartLabelLocation = keyof typeof ChartLabelLocationToEnterprise
export type ChartLabelLocationEnterprise = keyof typeof ChartLabelLocationFromEnterprise

export const ChartLabelTypeToEnterprise = {
  Value: "Значение",
  ValuePercent: "ЗначениеПроцент",
  ValueSize: "ЗначениеРазмер",
  None: "Нет",
  Percent: "Процент",
  Series: "Серия",
  SeriesValue: "СерияЗначение",
  SeriesValuePercent: "СерияЗначениеПроцент",
  SeriesValueSize: "СерияЗначениеРазмер",
  SeriesPercent: "СерияПроцент",
  SeriesSize: "СерияРазмер",
  SeriesPoint: "СерияТочка",
  SeriesPointValue: "СерияТочкаЗначение",
  SeriesPointValuePercent: "СерияТочкаЗначениеПроцент",
  SeriesPointValueSize: "СерияТочкаЗначениеРазмер",
  SeriesPointPercent: "СерияТочкаПроцент",
  SeriesPointSize: "СерияТочкаРазмер",
  Point: "Точка",
  PointValue: "ТочкаЗначение",
  PointValuePercent: "ТочкаЗначениеПроцент",
  PointValueSize: "ТочкаЗначениеРазмер",
  PointPercent: "ТочкаПроцент",
  PointSize: "ТочкаРазмер",
} as const

export const ChartLabelTypeFromEnterprise = {
  Значение: "Value",
  ЗначениеПроцент: "ValuePercent",
  ЗначениеРазмер: "ValueSize",
  Нет: "None",
  Процент: "Percent",
  Серия: "Series",
  СерияЗначение: "SeriesValue",
  СерияЗначениеПроцент: "SeriesValuePercent",
  СерияЗначениеРазмер: "SeriesValueSize",
  СерияПроцент: "SeriesPercent",
  СерияРазмер: "SeriesSize",
  СерияТочка: "SeriesPoint",
  СерияТочкаЗначение: "SeriesPointValue",
  СерияТочкаЗначениеПроцент: "SeriesPointValuePercent",
  СерияТочкаЗначениеРазмер: "SeriesPointValueSize",
  СерияТочкаПроцент: "SeriesPointPercent",
  СерияТочкаРазмер: "SeriesPointSize",
  Точка: "Point",
  ТочкаЗначение: "PointValue",
  ТочкаЗначениеПроцент: "PointValuePercent",
  ТочкаЗначениеРазмер: "PointValueSize",
  ТочкаПроцент: "PointPercent",
  ТочкаРазмер: "PointSize",
} as const

export type ChartLabelType = keyof typeof ChartLabelTypeToEnterprise
export type ChartLabelTypeEnterprise = keyof typeof ChartLabelTypeFromEnterprise

export const ChartLabelsOrientationToEnterprise = {
  Auto: "Авто",
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
  CustomAngle: "ПроизвольныйУголНаклона",
} as const

export const ChartLabelsOrientationFromEnterprise = {
  Авто: "Auto",
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
  ПроизвольныйУголНаклона: "CustomAngle",
} as const

export type ChartLabelsOrientation = keyof typeof ChartLabelsOrientationToEnterprise
export type ChartLabelsOrientationEnterprise = keyof typeof ChartLabelsOrientationFromEnterprise

export const ChartLegendPlacementToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
  UseCoordinates: "УказываетсяРасположение",
} as const

export const ChartLegendPlacementFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
  УказываетсяРасположение: "UseCoordinates",
} as const

export type ChartLegendPlacement = keyof typeof ChartLegendPlacementToEnterprise
export type ChartLegendPlacementEnterprise = keyof typeof ChartLegendPlacementFromEnterprise

export const ChartLineTypeToEnterprise = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const ChartLineTypeFromEnterprise = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type ChartLineType = keyof typeof ChartLineTypeToEnterprise
export type ChartLineTypeEnterprise = keyof typeof ChartLineTypeFromEnterprise

export const ChartMarkerTypeToEnterprise = {
  Auto: "Авто",
  Rect: "Квадрат",
  Circle: "Круг",
  None: "Нет",
  Rhomb: "Ромб",
  Alternation: "Чередование",
} as const

export const ChartMarkerTypeFromEnterprise = {
  Авто: "Auto",
  Квадрат: "Rect",
  Круг: "Circle",
  Нет: "None",
  Ромб: "Rhomb",
  Чередование: "Alternation",
} as const

export type ChartMarkerType = keyof typeof ChartMarkerTypeToEnterprise
export type ChartMarkerTypeEnterprise = keyof typeof ChartMarkerTypeFromEnterprise

export const ChartOrientationToEnterprise = {
  SouthEast: "ЮгВосток",
  SouthWest: "ЮгЗапад",
} as const

export const ChartOrientationFromEnterprise = {
  ЮгВосток: "SouthEast",
  ЮгЗапад: "SouthWest",
} as const

export type ChartOrientation = keyof typeof ChartOrientationToEnterprise
export type ChartOrientationEnterprise = keyof typeof ChartOrientationFromEnterprise

export const ChartPlotAreaPlacementToEnterprise = {
  Auto: "Авто",
  EmptySpace: "СвободноеМесто",
  UseCoordinates: "УказываетсяРасположение",
} as const

export const ChartPlotAreaPlacementFromEnterprise = {
  Авто: "Auto",
  СвободноеМесто: "EmptySpace",
  УказываетсяРасположение: "UseCoordinates",
} as const

export type ChartPlotAreaPlacement = keyof typeof ChartPlotAreaPlacementToEnterprise
export type ChartPlotAreaPlacementEnterprise = keyof typeof ChartPlotAreaPlacementFromEnterprise

export const ChartPointsAxisValuesSourceToEnterprise = {
  Auto: "Авто",
  Series: "Серия",
  Points: "Точки",
} as const

export const ChartPointsAxisValuesSourceFromEnterprise = {
  Авто: "Auto",
  Серия: "Series",
  Точки: "Points",
} as const

export type ChartPointsAxisValuesSource = keyof typeof ChartPointsAxisValuesSourceToEnterprise
export type ChartPointsAxisValuesSourceEnterprise = keyof typeof ChartPointsAxisValuesSourceFromEnterprise

export const ChartPointsConnectionTypeToEnterprise = {
  Auto: "Авто",
  DontConnect: "НеСоединять",
  Connect: "Соединять",
} as const

export const ChartPointsConnectionTypeFromEnterprise = {
  Авто: "Auto",
  НеСоединять: "DontConnect",
  Соединять: "Connect",
} as const

export type ChartPointsConnectionType = keyof typeof ChartPointsConnectionTypeToEnterprise
export type ChartPointsConnectionTypeEnterprise = keyof typeof ChartPointsConnectionTypeFromEnterprise

export const ChartReferenceBandBorderPositionToEnterprise = {
  Auto: "Авто",
  OnValue: "ВЗначении",
  BetweenValues: "МеждуЗначениями",
} as const

export const ChartReferenceBandBorderPositionFromEnterprise = {
  Авто: "Auto",
  ВЗначении: "OnValue",
  МеждуЗначениями: "BetweenValues",
} as const

export type ChartReferenceBandBorderPosition = keyof typeof ChartReferenceBandBorderPositionToEnterprise
export type ChartReferenceBandBorderPositionEnterprise = keyof typeof ChartReferenceBandBorderPositionFromEnterprise

export const ChartReferenceLinePositionToEnterprise = {
  Auto: "Авто",
  OnValue: "ВЗначении",
  BetweenValues: "МеждуЗначениями",
} as const

export const ChartReferenceLinePositionFromEnterprise = {
  Авто: "Auto",
  ВЗначении: "OnValue",
  МеждуЗначениями: "BetweenValues",
} as const

export type ChartReferenceLinePosition = keyof typeof ChartReferenceLinePositionToEnterprise
export type ChartReferenceLinePositionEnterprise = keyof typeof ChartReferenceLinePositionFromEnterprise

export const ChartScaleLabelLocationToEnterprise = {
  Auto: "Авто",
  Inside: "Внутри",
  None: "Нет",
  Outside: "Снаружи",
} as const

export const ChartScaleLabelLocationFromEnterprise = {
  Авто: "Auto",
  Внутри: "Inside",
  Нет: "None",
  Снаружи: "Outside",
} as const

export type ChartScaleLabelLocation = keyof typeof ChartScaleLabelLocationToEnterprise
export type ChartScaleLabelLocationEnterprise = keyof typeof ChartScaleLabelLocationFromEnterprise

export const ChartScaleLocationToEnterprise = {
  Auto: "Авто",
  BaseValue: "БазовоеЗначение",
  Edge: "Край",
} as const

export const ChartScaleLocationFromEnterprise = {
  Авто: "Auto",
  БазовоеЗначение: "BaseValue",
  Край: "Edge",
} as const

export type ChartScaleLocation = keyof typeof ChartScaleLocationToEnterprise
export type ChartScaleLocationEnterprise = keyof typeof ChartScaleLocationFromEnterprise

export const ChartScaleMarkLocationToEnterprise = {
  Auto: "Авто",
  Inside: "Внутри",
  None: "Нет",
  Outside: "Снаружи",
  Center: "Центр",
} as const

export const ChartScaleMarkLocationFromEnterprise = {
  Авто: "Auto",
  Внутри: "Inside",
  Нет: "None",
  Снаружи: "Outside",
  Центр: "Center",
} as const

export type ChartScaleMarkLocation = keyof typeof ChartScaleMarkLocationToEnterprise
export type ChartScaleMarkLocationEnterprise = keyof typeof ChartScaleMarkLocationFromEnterprise

export const ChartScaleTitlePlacementToEnterprise = {
  SpecialArea: "ВВыделеннойОбласти",
  PlotArea: "ВОбластиПостроения",
  WithAxis: "РядомСОсью",
} as const

export const ChartScaleTitlePlacementFromEnterprise = {
  ВВыделеннойОбласти: "SpecialArea",
  ВОбластиПостроения: "PlotArea",
  РядомСОсью: "WithAxis",
} as const

export type ChartScaleTitlePlacement = keyof typeof ChartScaleTitlePlacementToEnterprise
export type ChartScaleTitlePlacementEnterprise = keyof typeof ChartScaleTitlePlacementFromEnterprise

export const ChartScaleTitleTextSourceToEnterprise = {
  Auto: "Авто",
  AutoText: "АвтоТекст",
  UseText: "ИспользоватьТекст",
} as const

export const ChartScaleTitleTextSourceFromEnterprise = {
  Авто: "Auto",
  АвтоТекст: "AutoText",
  ИспользоватьТекст: "UseText",
} as const

export type ChartScaleTitleTextSource = keyof typeof ChartScaleTitleTextSourceToEnterprise
export type ChartScaleTitleTextSourceEnterprise = keyof typeof ChartScaleTitleTextSourceFromEnterprise

export const ChartSelectionModeToEnterprise = {
  Auto: "Авто",
  ValuesSelection: "ВыделениеЗначений",
  PointsSelection: "ВыделениеТочек",
  None: "Нет",
} as const

export const ChartSelectionModeFromEnterprise = {
  Авто: "Auto",
  ВыделениеЗначений: "ValuesSelection",
  ВыделениеТочек: "PointsSelection",
  Нет: "None",
} as const

export type ChartSelectionMode = keyof typeof ChartSelectionModeToEnterprise
export type ChartSelectionModeEnterprise = keyof typeof ChartSelectionModeFromEnterprise

export const ChartSemitransparencyModeToEnterprise = {
  Auto: "Авто",
  AutoCalculate: "АвтоматическийРасчет",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartSemitransparencyModeFromEnterprise = {
  Авто: "Auto",
  АвтоматическийРасчет: "AutoCalculate",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartSemitransparencyMode = keyof typeof ChartSemitransparencyModeToEnterprise
export type ChartSemitransparencyModeEnterprise = keyof typeof ChartSemitransparencyModeFromEnterprise

export const ChartSeriesGraphicalRepresentationTypeToEnterprise = {
  Auto: "Авто",
  Column: "Гистограмма",
  Column3D: "ГистограммаОбъемная",
  Line: "График",
  Step: "ГрафикПоШагам",
  Area: "ГрафикСОбластями",
} as const

export const ChartSeriesGraphicalRepresentationTypeFromEnterprise = {
  Авто: "Auto",
  Гистограмма: "Column",
  ГистограммаОбъемная: "Column3D",
  График: "Line",
  ГрафикПоШагам: "Step",
  ГрафикСОбластями: "Area",
} as const

export type ChartSeriesGraphicalRepresentationType = keyof typeof ChartSeriesGraphicalRepresentationTypeToEnterprise
export type ChartSeriesGraphicalRepresentationTypeEnterprise =
  keyof typeof ChartSeriesGraphicalRepresentationTypeFromEnterprise

export const ChartSeriesOrderInLegendToEnterprise = {
  Auto: "Авто",
  Reverse: "Обратный",
  Direct: "Прямой",
} as const

export const ChartSeriesOrderInLegendFromEnterprise = {
  Авто: "Auto",
  Обратный: "Reverse",
  Прямой: "Direct",
} as const

export type ChartSeriesOrderInLegend = keyof typeof ChartSeriesOrderInLegendToEnterprise
export type ChartSeriesOrderInLegendEnterprise = keyof typeof ChartSeriesOrderInLegendFromEnterprise

export const ChartSeriesStackTypeToEnterprise = {
  Auto: "Авто",
  Unstacked: "БезНакопления",
  Stacked: "СНакоплением",
  StackedNormalized: "СНакоплениемНормированная",
} as const

export const ChartSeriesStackTypeFromEnterprise = {
  Авто: "Auto",
  БезНакопления: "Unstacked",
  СНакоплением: "Stacked",
  СНакоплениемНормированная: "StackedNormalized",
} as const

export type ChartSeriesStackType = keyof typeof ChartSeriesStackTypeToEnterprise
export type ChartSeriesStackTypeEnterprise = keyof typeof ChartSeriesStackTypeFromEnterprise

export const ChartSpaceModeToEnterprise = {
  None: "Нет",
  Full: "ПолнаяШирина",
  Half: "ПоловинаШирины",
} as const

export const ChartSpaceModeFromEnterprise = {
  Нет: "None",
  ПолнаяШирина: "Full",
  ПоловинаШирины: "Half",
} as const

export type ChartSpaceMode = keyof typeof ChartSpaceModeToEnterprise
export type ChartSpaceModeEnterprise = keyof typeof ChartSpaceModeFromEnterprise

export const ChartSplineModeToEnterprise = {
  SmoothCurve: "ГладкаяКривая",
  None: "Нет",
} as const

export const ChartSplineModeFromEnterprise = {
  ГладкаяКривая: "SmoothCurve",
  Нет: "None",
} as const

export type ChartSplineMode = keyof typeof ChartSplineModeToEnterprise
export type ChartSplineModeEnterprise = keyof typeof ChartSplineModeFromEnterprise

export const ChartTitleAreaPlacementToEnterprise = {
  Auto: "Авто",
  Top: "Верх",
  LeftTop: "ЛевоВерх",
  LeftBottom: "ЛевоНиз",
  None: "Нет",
  Bottom: "Низ",
  RightTop: "ПравоВерх",
  RightBottom: "ПравоНиз",
  UseCoordinates: "УказываетсяРасположение",
} as const

export const ChartTitleAreaPlacementFromEnterprise = {
  Авто: "Auto",
  Верх: "Top",
  ЛевоВерх: "LeftTop",
  ЛевоНиз: "LeftBottom",
  Нет: "None",
  Низ: "Bottom",
  ПравоВерх: "RightTop",
  ПравоНиз: "RightBottom",
  УказываетсяРасположение: "UseCoordinates",
} as const

export type ChartTitleAreaPlacement = keyof typeof ChartTitleAreaPlacementToEnterprise
export type ChartTitleAreaPlacementEnterprise = keyof typeof ChartTitleAreaPlacementFromEnterprise

export const ChartTrendlineApproximationTypeToEnterprise = {
  Linear: "Линейный",
  Logarithmic: "Логарифмический",
  Polynomial: "Полиномиальный",
  Power: "Степенной",
  Exponential: "Экспоненциальный",
} as const

export const ChartTrendlineApproximationTypeFromEnterprise = {
  Линейный: "Linear",
  Логарифмический: "Logarithmic",
  Полиномиальный: "Polynomial",
  Степенной: "Power",
  Экспоненциальный: "Exponential",
} as const

export type ChartTrendlineApproximationType = keyof typeof ChartTrendlineApproximationTypeToEnterprise
export type ChartTrendlineApproximationTypeEnterprise = keyof typeof ChartTrendlineApproximationTypeFromEnterprise

export const ChartTrendlineFactorToEnterprise = {
  Auto: "Авто",
  PointValue: "ЗначениеТочки",
  PointNumber: "НомерТочки",
} as const

export const ChartTrendlineFactorFromEnterprise = {
  Авто: "Auto",
  ЗначениеТочки: "PointValue",
  НомерТочки: "PointNumber",
} as const

export type ChartTrendlineFactor = keyof typeof ChartTrendlineFactorToEnterprise
export type ChartTrendlineFactorEnterprise = keyof typeof ChartTrendlineFactorFromEnterprise

export const ChartTypeToEnterprise = {
  Stock: "Биржевая",
  OpenHighLowClose: "БиржеваяСвеча",
  ConcaveSurface: "ВогнутаяПоверхность",
  Waterfall: "Водопад",
  Funnel: "Воронка",
  NormalizedFunnel: "ВоронкаНормированная",
  NormalizedFunnel3D: "ВоронкаНормированнаяОбъемная",
  Funnel3D: "ВоронкаОбъемная",
  ConvexSurface: "ВыпуклаяПоверхность",
  Column: "Гистограмма",
  Bar: "ГистограммаГоризонтальная",
  Bar3D: "ГистограммаГоризонтальнаяОбъемная",
  NormalizedColumn: "ГистограммаНормированная",
  NormalizedBar: "ГистограммаНормированнаяГоризонтальная",
  NormalizedBar3D: "ГистограммаНормированнаяГоризонтальнаяОбъемная",
  NormalizedColumn3D: "ГистограммаНормированнаяОбъемная",
  Column3D: "ГистограммаОбъемная",
  StackedColumn: "ГистограммаСНакоплением",
  StackedBar: "ГистограммаСНакоплениемГоризонтальная",
  StackedBar3D: "ГистограммаСНакоплениемГоризонтальнаяОбъемная",
  StackedColumn3D: "ГистограммаСНакоплениемОбъемная",
  Line: "График",
  Step: "ГрафикПоШагам",
  StackedLine: "ГрафикСНакоплением",
  Area: "ГрафикСОбластями",
  StackedArea: "ГрафикСОбластямиИНакоплением",
  NormalizedArea: "ГрафикСОбластямиНормированный",
  ShadedSurface: "ЗатененнаяПоверхность",
  Gauge: "Измерительная",
  BarGraph: "Изометрическая",
  TapeGraph: "ИзометрическаяЛента",
  CeilGraph: "ИзометрическаяНепрерывная",
  PyramidGraph: "ИзометрическаяПирамида",
  WireframeSurface: "КаркаснаяПоверхность",
  Donut: "Кольцевая",
  Donut3D: "КольцеваяОбъемная",
  Pie: "Круговая",
  Pie3D: "КруговаяОбъемная",
  Surface: "Поверхность",
  Bubble: "Пузырьковая",
  RadarLine: "РадарныйГрафик",
  RadarStackedLine: "РадарныйГрафикСНакоплением",
  RadarArea: "РадарныйГрафикСОбластями",
  RadarStackedArea: "РадарныйГрафикСОбластямиИНакоплением",
  RadarNormalizedArea: "РадарныйГрафикСОбластямиНормированный",
  Honeycomb: "Сотовая",
  Scatter: "Точечная",
} as const

export const ChartTypeFromEnterprise = {
  Биржевая: "Stock",
  БиржеваяСвеча: "OpenHighLowClose",
  ВогнутаяПоверхность: "ConcaveSurface",
  Водопад: "Waterfall",
  Воронка: "Funnel",
  ВоронкаНормированная: "NormalizedFunnel",
  ВоронкаНормированнаяОбъемная: "NormalizedFunnel3D",
  ВоронкаОбъемная: "Funnel3D",
  ВыпуклаяПоверхность: "ConvexSurface",
  Гистограмма: "Column",
  ГистограммаГоризонтальная: "Bar",
  ГистограммаГоризонтальнаяОбъемная: "Bar3D",
  ГистограммаНормированная: "NormalizedColumn",
  ГистограммаНормированнаяГоризонтальная: "NormalizedBar",
  ГистограммаНормированнаяГоризонтальнаяОбъемная: "NormalizedBar3D",
  ГистограммаНормированнаяОбъемная: "NormalizedColumn3D",
  ГистограммаОбъемная: "Column3D",
  ГистограммаСНакоплением: "StackedColumn",
  ГистограммаСНакоплениемГоризонтальная: "StackedBar",
  ГистограммаСНакоплениемГоризонтальнаяОбъемная: "StackedBar3D",
  ГистограммаСНакоплениемОбъемная: "StackedColumn3D",
  График: "Line",
  ГрафикПоШагам: "Step",
  ГрафикСНакоплением: "StackedLine",
  ГрафикСОбластями: "Area",
  ГрафикСОбластямиИНакоплением: "StackedArea",
  ГрафикСОбластямиНормированный: "NormalizedArea",
  ЗатененнаяПоверхность: "ShadedSurface",
  Измерительная: "Gauge",
  Изометрическая: "BarGraph",
  ИзометрическаяЛента: "TapeGraph",
  ИзометрическаяНепрерывная: "CeilGraph",
  ИзометрическаяПирамида: "PyramidGraph",
  КаркаснаяПоверхность: "WireframeSurface",
  Кольцевая: "Donut",
  КольцеваяОбъемная: "Donut3D",
  Круговая: "Pie",
  КруговаяОбъемная: "Pie3D",
  Поверхность: "Surface",
  Пузырьковая: "Bubble",
  РадарныйГрафик: "RadarLine",
  РадарныйГрафикСНакоплением: "RadarStackedLine",
  РадарныйГрафикСОбластями: "RadarArea",
  РадарныйГрафикСОбластямиИНакоплением: "RadarStackedArea",
  РадарныйГрафикСОбластямиНормированный: "RadarNormalizedArea",
  Сотовая: "Honeycomb",
  Точечная: "Scatter",
} as const

export type ChartType = keyof typeof ChartTypeToEnterprise
export type ChartTypeEnterprise = keyof typeof ChartTypeFromEnterprise

export const ChartValueEditStateToEnterprise = {
  Finished: "Завершено",
  NotFinished: "НеЗавершено",
  Canceled: "Отменено",
} as const

export const ChartValueEditStateFromEnterprise = {
  Завершено: "Finished",
  НеЗавершено: "NotFinished",
  Отменено: "Canceled",
} as const

export type ChartValueEditState = keyof typeof ChartValueEditStateToEnterprise
export type ChartValueEditStateEnterprise = keyof typeof ChartValueEditStateFromEnterprise

export const ChartValuesBySeriesConnectionTypeToEnterprise = {
  None: "Нет",
  EdgesConnection: "СоединениеКраев",
} as const

export const ChartValuesBySeriesConnectionTypeFromEnterprise = {
  Нет: "None",
  СоединениеКраев: "EdgesConnection",
} as const

export type ChartValuesBySeriesConnectionType = keyof typeof ChartValuesBySeriesConnectionTypeToEnterprise
export type ChartValuesBySeriesConnectionTypeEnterprise = keyof typeof ChartValuesBySeriesConnectionTypeFromEnterprise

export const ChartValuesEditModeToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartValuesEditModeFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartValuesEditMode = keyof typeof ChartValuesEditModeToEnterprise
export type ChartValuesEditModeEnterprise = keyof typeof ChartValuesEditModeFromEnterprise

export const ChartValuesToolTipFillTypeToEnterprise = {
  Auto: "Авто",
  AllPointValues: "ВсеЗначенияТочки",
  SingleValue: "ОдноЗначение",
} as const

export const ChartValuesToolTipFillTypeFromEnterprise = {
  Авто: "Auto",
  ВсеЗначенияТочки: "AllPointValues",
  ОдноЗначение: "SingleValue",
} as const

export type ChartValuesToolTipFillType = keyof typeof ChartValuesToolTipFillTypeToEnterprise
export type ChartValuesToolTipFillTypeEnterprise = keyof typeof ChartValuesToolTipFillTypeFromEnterprise

export const ChartValuesToolTipShowModeToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  ShowForNearestValue: "ОтображатьДляБлижайшего",
  ShowOnHover: "ОтображатьПриНаведении",
} as const

export const ChartValuesToolTipShowModeFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  ОтображатьДляБлижайшего: "ShowForNearestValue",
  ОтображатьПриНаведении: "ShowOnHover",
} as const

export type ChartValuesToolTipShowMode = keyof typeof ChartValuesToolTipShowModeToEnterprise
export type ChartValuesToolTipShowModeEnterprise = keyof typeof ChartValuesToolTipShowModeFromEnterprise

export const GaugeChartValueRepresentationToEnterprise = {
  Sector: "Сектор",
  Needle: "Стрелка",
} as const

export const GaugeChartValueRepresentationFromEnterprise = {
  Сектор: "Sector",
  Стрелка: "Needle",
} as const

export type GaugeChartValueRepresentation = keyof typeof GaugeChartValueRepresentationToEnterprise
export type GaugeChartValueRepresentationEnterprise = keyof typeof GaugeChartValueRepresentationFromEnterprise

export const GaugeChartValuesScaleLabelsLocationToEnterprise = {
  InsideScale: "ВнутриШкалы",
  AtScale: "НаШкале",
} as const

export const GaugeChartValuesScaleLabelsLocationFromEnterprise = {
  ВнутриШкалы: "InsideScale",
  НаШкале: "AtScale",
} as const

export type GaugeChartValuesScaleLabelsLocation = keyof typeof GaugeChartValuesScaleLabelsLocationToEnterprise
export type GaugeChartValuesScaleLabelsLocationEnterprise =
  keyof typeof GaugeChartValuesScaleLabelsLocationFromEnterprise

export const MaxSeriesToEnterprise = {
  NotDefined: "НеЗадано",
  Limited: "Ограничено",
  Percent: "Процент",
} as const

export const MaxSeriesFromEnterprise = {
  НеЗадано: "NotDefined",
  Ограничено: "Limited",
  Процент: "Percent",
} as const

export type MaxSeries = keyof typeof MaxSeriesToEnterprise
export type MaxSeriesEnterprise = keyof typeof MaxSeriesFromEnterprise

export const NonnumericChartValueUseToEnterprise = {
  Auto: "Авто",
  AsZero: "КакНоль",
  Skip: "Пропускать",
} as const

export const NonnumericChartValueUseFromEnterprise = {
  Авто: "Auto",
  КакНоль: "AsZero",
  Пропускать: "Skip",
} as const

export type NonnumericChartValueUse = keyof typeof NonnumericChartValueUseToEnterprise
export type NonnumericChartValueUseEnterprise = keyof typeof NonnumericChartValueUseFromEnterprise

export const PointsConnectionAcrossSkippedChartValuesTypeToEnterprise = {
  Auto: "Авто",
  None: "Нет",
  ConnectUnskippedValues: "СоединениеНеПропущенных",
  ConnectWithBaseValue: "СоединениеСБазовымЗначением",
} as const

export const PointsConnectionAcrossSkippedChartValuesTypeFromEnterprise = {
  Авто: "Auto",
  Нет: "None",
  СоединениеНеПропущенных: "ConnectUnskippedValues",
  СоединениеСБазовымЗначением: "ConnectWithBaseValue",
} as const

export type PointsConnectionAcrossSkippedChartValuesType =
  keyof typeof PointsConnectionAcrossSkippedChartValuesTypeToEnterprise
export type PointsConnectionAcrossSkippedChartValuesTypeEnterprise =
  keyof typeof PointsConnectionAcrossSkippedChartValuesTypeFromEnterprise

export const RadarChartScaleTypeToEnterprise = {
  Circle: "Окружность",
  Polygon: "Полигон",
} as const

export const RadarChartScaleTypeFromEnterprise = {
  Окружность: "Circle",
  Полигон: "Polygon",
} as const

export type RadarChartScaleType = keyof typeof RadarChartScaleTypeToEnterprise
export type RadarChartScaleTypeEnterprise = keyof typeof RadarChartScaleTypeFromEnterprise

export const ShowChartPopupReferenceLineToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowChartPopupReferenceLineFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowChartPopupReferenceLine = keyof typeof ShowChartPopupReferenceLineToEnterprise
export type ShowChartPopupReferenceLineEnterprise = keyof typeof ShowChartPopupReferenceLineFromEnterprise

export const ShowChartScaleTitleToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowChartScaleTitleFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowChartScaleTitle = keyof typeof ShowChartScaleTitleToEnterprise
export type ShowChartScaleTitleEnterprise = keyof typeof ShowChartScaleTitleFromEnterprise

export const ShowInChartToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInChartFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInChart = keyof typeof ShowInChartToEnterprise
export type ShowInChartEnterprise = keyof typeof ShowInChartFromEnterprise

export const ShowInChartLegendToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInChartLegendFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInChartLegend = keyof typeof ShowInChartLegendToEnterprise
export type ShowInChartLegendEnterprise = keyof typeof ShowInChartLegendFromEnterprise

export const StockChartUsedPointValueToEnterprise = {
  Close: "Закрытие",
  High: "Максимальное",
  Low: "Минимальное",
  Open: "Открытие",
  OpenCloseAverage: "СреднееОткрытияИЗакрытия",
} as const

export const StockChartUsedPointValueFromEnterprise = {
  Закрытие: "Close",
  Максимальное: "High",
  Минимальное: "Low",
  Открытие: "Open",
  СреднееОткрытияИЗакрытия: "OpenCloseAverage",
} as const

export type StockChartUsedPointValue = keyof typeof StockChartUsedPointValueToEnterprise
export type StockChartUsedPointValueEnterprise = keyof typeof StockChartUsedPointValueFromEnterprise

export const UsedChartValuesAxisToEnterprise = {
  Auto: "Авто",
  Additional: "Дополнительная",
  Main: "Основная",
} as const

export const UsedChartValuesAxisFromEnterprise = {
  Авто: "Auto",
  Дополнительная: "Additional",
  Основная: "Main",
} as const

export type UsedChartValuesAxis = keyof typeof UsedChartValuesAxisToEnterprise
export type UsedChartValuesAxisEnterprise = keyof typeof UsedChartValuesAxisFromEnterprise

export const GanttChartIntervalRepresentationToEnterprise = {
  Gradient: "Градиент",
  ThreeDimensional: "Объемный",
  Flat: "Плоский",
  Rhomb: "Ромб",
} as const

export const GanttChartIntervalRepresentationFromEnterprise = {
  Градиент: "Gradient",
  Объемный: "ThreeDimensional",
  Плоский: "Flat",
  Ромб: "Rhomb",
} as const

export type GanttChartIntervalRepresentation = keyof typeof GanttChartIntervalRepresentationToEnterprise
export type GanttChartIntervalRepresentationEnterprise = keyof typeof GanttChartIntervalRepresentationFromEnterprise

export const GanttChartIntervalTextRepresentationToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const GanttChartIntervalTextRepresentationFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type GanttChartIntervalTextRepresentation = keyof typeof GanttChartIntervalTextRepresentationToEnterprise
export type GanttChartIntervalTextRepresentationEnterprise =
  keyof typeof GanttChartIntervalTextRepresentationFromEnterprise

export const GanttChartIntervalsSelectionModeToEnterprise = {
  Auto: "Авто",
  Multiple: "Множественный",
  None: "Нет",
  Single: "Одиночный",
} as const

export const GanttChartIntervalsSelectionModeFromEnterprise = {
  Авто: "Auto",
  Множественный: "Multiple",
  Нет: "None",
  Одиночный: "Single",
} as const

export type GanttChartIntervalsSelectionMode = keyof typeof GanttChartIntervalsSelectionModeToEnterprise
export type GanttChartIntervalsSelectionModeEnterprise = keyof typeof GanttChartIntervalsSelectionModeFromEnterprise

export const GanttChartLinkTypeToEnterprise = {
  EndEnd: "КонецКонец",
  EndBegin: "КонецНачало",
  BeginEnd: "НачалоКонец",
  BeginBegin: "НачалоНачало",
} as const

export const GanttChartLinkTypeFromEnterprise = {
  КонецКонец: "EndEnd",
  КонецНачало: "EndBegin",
  НачалоКонец: "BeginEnd",
  НачалоНачало: "BeginBegin",
} as const

export type GanttChartLinkType = keyof typeof GanttChartLinkTypeToEnterprise
export type GanttChartLinkTypeEnterprise = keyof typeof GanttChartLinkTypeFromEnterprise

export const GanttChartScaleKeepingToEnterprise = {
  Auto: "Авто",
  AllData: "ВсеДанные",
  Period: "Период",
  Fixed: "Фиксированная",
} as const

export const GanttChartScaleKeepingFromEnterprise = {
  Авто: "Auto",
  ВсеДанные: "AllData",
  Период: "Period",
  Фиксированная: "Fixed",
} as const

export type GanttChartScaleKeeping = keyof typeof GanttChartScaleKeepingToEnterprise
export type GanttChartScaleKeepingEnterprise = keyof typeof GanttChartScaleKeepingFromEnterprise

export const GanttChartTableLocationToEnterprise = {
  Auto: "Авто",
  Left: "Лево",
  None: "Нет",
  Right: "Право",
} as const

export const GanttChartTableLocationFromEnterprise = {
  Авто: "Auto",
  Лево: "Left",
  Нет: "None",
  Право: "Right",
} as const

export type GanttChartTableLocation = keyof typeof GanttChartTableLocationToEnterprise
export type GanttChartTableLocationEnterprise = keyof typeof GanttChartTableLocationFromEnterprise

export const GanttChartTextPlacementTypeToEnterprise = {
  Auto: "Авто",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const GanttChartTextPlacementTypeFromEnterprise = {
  Авто: "Auto",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type GanttChartTextPlacementType = keyof typeof GanttChartTextPlacementTypeToEnterprise
export type GanttChartTextPlacementTypeEnterprise = keyof typeof GanttChartTextPlacementTypeFromEnterprise

export const GanttChartValueTextRepresentationToEnterprise = {
  None: "НеОтображать",
  Right: "Право",
} as const

export const GanttChartValueTextRepresentationFromEnterprise = {
  НеОтображать: "None",
  Право: "Right",
} as const

export type GanttChartValueTextRepresentation = keyof typeof GanttChartValueTextRepresentationToEnterprise
export type GanttChartValueTextRepresentationEnterprise = keyof typeof GanttChartValueTextRepresentationFromEnterprise

export const GanttChartValuesSelectionModeToEnterprise = {
  Auto: "Авто",
  Multiple: "Множественный",
  None: "Нет",
  Single: "Одиночный",
} as const

export const GanttChartValuesSelectionModeFromEnterprise = {
  Авто: "Auto",
  Множественный: "Multiple",
  Нет: "None",
  Одиночный: "Single",
} as const

export type GanttChartValuesSelectionMode = keyof typeof GanttChartValuesSelectionModeToEnterprise
export type GanttChartValuesSelectionModeEnterprise = keyof typeof GanttChartValuesSelectionModeFromEnterprise

export const GanttChartVerticalStretchToEnterprise = {
  None: "НеРастягивать",
  StretchRows: "РастягиватьСтроки",
  StretchRowsAndData: "РастягиватьСтрокиИДанные",
} as const

export const GanttChartVerticalStretchFromEnterprise = {
  НеРастягивать: "None",
  РастягиватьСтроки: "StretchRows",
  РастягиватьСтрокиИДанные: "StretchRowsAndData",
} as const

export type GanttChartVerticalStretch = keyof typeof GanttChartVerticalStretchToEnterprise
export type GanttChartVerticalStretchEnterprise = keyof typeof GanttChartVerticalStretchFromEnterprise

export const ShowInGanttChartToEnterprise = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInGanttChartFromEnterprise = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInGanttChart = keyof typeof ShowInGanttChartToEnterprise
export type ShowInGanttChartEnterprise = keyof typeof ShowInGanttChartFromEnterprise

export const TimeScaleDayFormatToEnterprise = {
  MonthDay: "ДеньМесяца",
  MonthDayWeekDay: "ДеньМесяцаДеньНедели",
  WeekDay: "ДеньНедели",
  WeekDayMonthDay: "ДеньНеделиДеньМесяца",
} as const

export const TimeScaleDayFormatFromEnterprise = {
  ДеньМесяца: "MonthDay",
  ДеньМесяцаДеньНедели: "MonthDayWeekDay",
  ДеньНедели: "WeekDay",
  ДеньНеделиДеньМесяца: "WeekDayMonthDay",
} as const

export type TimeScaleDayFormat = keyof typeof TimeScaleDayFormatToEnterprise
export type TimeScaleDayFormatEnterprise = keyof typeof TimeScaleDayFormatFromEnterprise

export const TimeScaleUnitTypeToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Minute: "Минута",
  Week: "Неделя",
  Second: "Секунда",
  Hour: "Час",
} as const

export const TimeScaleUnitTypeFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Минута: "Minute",
  Неделя: "Week",
  Секунда: "Second",
  Час: "Hour",
} as const

export type TimeScaleUnitType = keyof typeof TimeScaleUnitTypeToEnterprise
export type TimeScaleUnitTypeEnterprise = keyof typeof TimeScaleUnitTypeFromEnterprise

export const PivotChartLabelsOrientationToEnterprise = {
  TopLevelsVertical: "ВерхниеУровниВертикально",
  AllLevelsVertical: "ВсеУровниВертикально",
  AllLevelsHorizontal: "ВсеУровниГоризонтально",
} as const

export const PivotChartLabelsOrientationFromEnterprise = {
  ВерхниеУровниВертикально: "TopLevelsVertical",
  ВсеУровниВертикально: "AllLevelsVertical",
  ВсеУровниГоризонтально: "AllLevelsHorizontal",
} as const

export type PivotChartLabelsOrientation = keyof typeof PivotChartLabelsOrientationToEnterprise
export type PivotChartLabelsOrientationEnterprise = keyof typeof PivotChartLabelsOrientationFromEnterprise

export const PivotChartScaleKeepingToEnterprise = {
  AllValues: "ВсеЗначения",
  ValuesCount: "КоличествоЗначений",
  MinimumWidth: "МинимальнаяШирина",
} as const

export const PivotChartScaleKeepingFromEnterprise = {
  ВсеЗначения: "AllValues",
  КоличествоЗначений: "ValuesCount",
  МинимальнаяШирина: "MinimumWidth",
} as const

export type PivotChartScaleKeeping = keyof typeof PivotChartScaleKeepingToEnterprise
export type PivotChartScaleKeepingEnterprise = keyof typeof PivotChartScaleKeepingFromEnterprise

export const PivotChartTypeToEnterprise = {
  Column: "Гистограмма",
  Column3D: "ГистограммаОбъемная",
} as const

export const PivotChartTypeFromEnterprise = {
  Гистограмма: "Column",
  ГистограммаОбъемная: "Column3D",
} as const

export type PivotChartType = keyof typeof PivotChartTypeToEnterprise
export type PivotChartTypeEnterprise = keyof typeof PivotChartTypeFromEnterprise

export const PivotChartValuesShowModeToEnterprise = {
  AllValues: "ВсеЗначения",
  LastLevelValues: "ЗначенияПоследнегоУровня",
} as const

export const PivotChartValuesShowModeFromEnterprise = {
  ВсеЗначения: "AllValues",
  ЗначенияПоследнегоУровня: "LastLevelValues",
} as const

export type PivotChartValuesShowMode = keyof typeof PivotChartValuesShowModeToEnterprise
export type PivotChartValuesShowModeEnterprise = keyof typeof PivotChartValuesShowModeFromEnterprise

export const DendrogramOrientationToEnterprise = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const DendrogramOrientationFromEnterprise = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type DendrogramOrientation = keyof typeof DendrogramOrientationToEnterprise
export type DendrogramOrientationEnterprise = keyof typeof DendrogramOrientationFromEnterprise

export const DendrogramScaleKeepingToEnterprise = {
  AllItems: "ВсеЭлементы",
  ItemCount: "КоличествоЭлементов",
  MinimumWidth: "МинимальнаяШирина",
} as const

export const DendrogramScaleKeepingFromEnterprise = {
  ВсеЭлементы: "AllItems",
  КоличествоЭлементов: "ItemCount",
  МинимальнаяШирина: "MinimumWidth",
} as const

export type DendrogramScaleKeeping = keyof typeof DendrogramScaleKeepingToEnterprise
export type DendrogramScaleKeepingEnterprise = keyof typeof DendrogramScaleKeepingFromEnterprise

export const GeographicalSchemaDataSourceOrganizationTypeToEnterprise = {
  AtRow: "ВСтроке",
  AtIntersection: "НаПересечении",
} as const

export const GeographicalSchemaDataSourceOrganizationTypeFromEnterprise = {
  ВСтроке: "AtRow",
  НаПересечении: "AtIntersection",
} as const

export type GeographicalSchemaDataSourceOrganizationType =
  keyof typeof GeographicalSchemaDataSourceOrganizationTypeToEnterprise
export type GeographicalSchemaDataSourceOrganizationTypeEnterprise =
  keyof typeof GeographicalSchemaDataSourceOrganizationTypeFromEnterprise

export const GeographicalSchemaLayerSeriesImportModeTypeToEnterprise = {
  ImportAll: "ИмпортироватьВсе",
  DontImport: "НеИмпортировать",
} as const

export const GeographicalSchemaLayerSeriesImportModeTypeFromEnterprise = {
  ИмпортироватьВсе: "ImportAll",
  НеИмпортировать: "DontImport",
} as const

export type GeographicalSchemaLayerSeriesImportModeType =
  keyof typeof GeographicalSchemaLayerSeriesImportModeTypeToEnterprise
export type GeographicalSchemaLayerSeriesImportModeTypeEnterprise =
  keyof typeof GeographicalSchemaLayerSeriesImportModeTypeFromEnterprise

export const GeographicalSchemaLayerSeriesShowModeToEnterprise = {
  Column: "Гистограмма",
  Picture: "Картинка",
  Pie: "Круговая",
  SizedPie: "КруговаяСРазмером",
  DontShow: "НеОтображать",
  ShapeColorHue: "ОттенокЦветаФигуры",
  ShapeSize: "РазмерФигуры",
  Text: "Текст",
  ShapeColor: "ЦветФигуры",
} as const

export const GeographicalSchemaLayerSeriesShowModeFromEnterprise = {
  Гистограмма: "Column",
  Картинка: "Picture",
  Круговая: "Pie",
  КруговаяСРазмером: "SizedPie",
  НеОтображать: "DontShow",
  ОттенокЦветаФигуры: "ShapeColorHue",
  РазмерФигуры: "ShapeSize",
  Текст: "Text",
  ЦветФигуры: "ShapeColor",
} as const

export type GeographicalSchemaLayerSeriesShowMode = keyof typeof GeographicalSchemaLayerSeriesShowModeToEnterprise
export type GeographicalSchemaLayerSeriesShowModeEnterprise =
  keyof typeof GeographicalSchemaLayerSeriesShowModeFromEnterprise

export const GeographicalSchemaLegendItemShowScaleTypeToEnterprise = {
  DontShow: "НеОтображать",
  ShowByValues: "ОтображатьПоЗначениям",
} as const

export const GeographicalSchemaLegendItemShowScaleTypeFromEnterprise = {
  НеОтображать: "DontShow",
  ОтображатьПоЗначениям: "ShowByValues",
} as const

export type GeographicalSchemaLegendItemShowScaleType =
  keyof typeof GeographicalSchemaLegendItemShowScaleTypeToEnterprise
export type GeographicalSchemaLegendItemShowScaleTypeEnterprise =
  keyof typeof GeographicalSchemaLegendItemShowScaleTypeFromEnterprise

export const GeographicalSchemaLineTypeToEnterprise = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const GeographicalSchemaLineTypeFromEnterprise = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type GeographicalSchemaLineType = keyof typeof GeographicalSchemaLineTypeToEnterprise
export type GeographicalSchemaLineTypeEnterprise = keyof typeof GeographicalSchemaLineTypeFromEnterprise

export const GeographicalSchemaMarkerTypeToEnterprise = {
  BigSquare: "БольшойКвадрат",
  BigCircle: "БольшойКруг",
  BigTriangle: "БольшойТреугольник",
  ExclamationPoint: "ВосклицательныйЗнак",
  Darts: "Дартс",
  QuestionMark: "ЗнакВопроса",
  Pin: "Кнопка",
  LittleSquare: "МаленькийКвадрат",
  LittleCircle: "МаленькийКруг",
  LittleTriangle: "МаленькийТреугольник",
  None: "Нет",
} as const

export const GeographicalSchemaMarkerTypeFromEnterprise = {
  БольшойКвадрат: "BigSquare",
  БольшойКруг: "BigCircle",
  БольшойТреугольник: "BigTriangle",
  ВосклицательныйЗнак: "ExclamationPoint",
  Дартс: "Darts",
  ЗнакВопроса: "QuestionMark",
  Кнопка: "Pin",
  МаленькийКвадрат: "LittleSquare",
  МаленькийКруг: "LittleCircle",
  МаленькийТреугольник: "LittleTriangle",
  Нет: "None",
} as const

export type GeographicalSchemaMarkerType = keyof typeof GeographicalSchemaMarkerTypeToEnterprise
export type GeographicalSchemaMarkerTypeEnterprise = keyof typeof GeographicalSchemaMarkerTypeFromEnterprise

export const GeographicalSchemaObjectFindTypeToEnterprise = {
  Included: "Включает",
  IncludedWholly: "ВключаетПолностью",
  Includes: "Включают",
  IncludesWholly: "ВключаютПолностью",
} as const

export const GeographicalSchemaObjectFindTypeFromEnterprise = {
  Включает: "Included",
  ВключаетПолностью: "IncludedWholly",
  Включают: "Includes",
  ВключаютПолностью: "IncludesWholly",
} as const

export type GeographicalSchemaObjectFindType = keyof typeof GeographicalSchemaObjectFindTypeToEnterprise
export type GeographicalSchemaObjectFindTypeEnterprise = keyof typeof GeographicalSchemaObjectFindTypeFromEnterprise

export const GeographicalSchemaPointObjectDrawingTypeToEnterprise = {
  Picture: "Картинка",
  Marker: "Маркер",
  Char: "Символ",
} as const

export const GeographicalSchemaPointObjectDrawingTypeFromEnterprise = {
  Картинка: "Picture",
  Маркер: "Marker",
  Символ: "Char",
} as const

export type GeographicalSchemaPointObjectDrawingType = keyof typeof GeographicalSchemaPointObjectDrawingTypeToEnterprise
export type GeographicalSchemaPointObjectDrawingTypeEnterprise =
  keyof typeof GeographicalSchemaPointObjectDrawingTypeFromEnterprise

export const GeographicalSchemaProjectionToEnterprise = {
  AzimuthalAitoffProjection: "АзимутальнаяПроекцияАитофа",
  AzimuthalWagner7Projection: "АзимутальнаяПроекцияВагнера7",
  AzimuthalWinkelTripelProjection: "АзимутальнаяПроекцияВинкеляТрипеля",
  AzimuthalLambertEqualAreaProjection: "АзимутальнаяПроекцияРавныхПлощадейЛамберта",
  AzimuthalHammerProjection: "АзимутальнаяПроекцияХамера",
  AzimuthalEquidistantProjection: "АзимутальнаяРавноудаленнаяПроекция",
  ConicLambertEqualAreaProjection: "КоническаяПроекцияРавныхПлощадейЛамберта",
  MiscellaneousOrteliusOvalProjection: "ПрочаяОвальнаяПроекцияОртелиуса",
  MiscellaneousVanDerGrinten1Projection: "ПрочаяПроекцияВанДерГринтена1",
  MiscellaneousVanDerGrinten2Projection: "ПрочаяПроекцияВанДерГринтена2",
  MiscellaneousVanDerGrinten3Projection: "ПрочаяПроекцияВанДерГринтена3",
  MiscellaneousApianGlobular1Projection: "ПрочаяСотоваяШаровая1Проекция",
  MiscellaneousBaconGlobularProjection: "ПрочаяШароваяПроекцияБекона",
  MiscellaneousNicolosiGlobularProjection: "ПрочаяШароваяПроекцияНиколоси",
  MiscellaneousAugustEpicycloidalProjection: "ПрочаяЭпициклоидальнаяПроекцияАвгуста",
  PseudoCylindricalBoggsEumorphicProjection: "ПсевдоцилиндрическаяНормальнаяПроекцияБоггса",
  PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection:
    "ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса",
  PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection:
    "ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса",
  PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection:
    "ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса",
  PseudoCylindricalWinkel1Projection: "ПсевдоцилиндрическаяПроекцияВинкеля1",
  PseudoCylindricalLoximutalProjection: "ПсевдоцилиндрическаяПроекцияЛоксимутала",
  PseudoCylindricalMollweideProjection: "ПсевдоцилиндрическаяПроекцияМолвейда",
  PseudoCylindricalHatanoAsymetricalEqualAreaProjection:
    "ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано",
  PseudoCylindricalPutninP2Projection: "ПсевдоцилиндрическаяПроекцияПутнинаP2",
  PseudoCylindricalPutninP5Projection: "ПсевдоцилиндрическаяПроекцияПутнинаP5",
  PseudoCylindricalRobinsonProjection: "ПсевдоцилиндрическаяПроекцияРобинсона",
  PseudoCylindricalEckert1Projection: "ПсевдоцилиндрическаяПроекцияЭкерта1",
  PseudoCylindricalEckert2Projection: "ПсевдоцилиндрическаяПроекцияЭкерта2",
  PseudoCylindricalEckert3Projection: "ПсевдоцилиндрическаяПроекцияЭкерта3",
  PseudoCylindricalEckert4Projection: "ПсевдоцилиндрическаяПроекцияЭкерта4",
  PseudoCylindricalEckert5Projection: "ПсевдоцилиндрическаяПроекцияЭкерта5",
  PseudoCylindricalEckert6Projection: "ПсевдоцилиндрическаяПроекцияЭкерта6",
  PseudoCylindricalSinusoidalProjection: "ПсевдоцилиндрическаяСинусоидальнаяПроекция",
  CylindricalMillerProjection: "ЦилиндрическаяПроекцияМиллера",
  CylindricalLambertEqualAreaProjection: "ЦилиндрическаяПроекцияРавныхОбластейЛамберта",
  CylindricalEquidistantProjection: "ЦилиндрическаяРавноудаленнаяПроекция",
  CylindricalGallStereographicProjection: "ЦилиндрическаяСтереографическаяПроекцияГалла",
} as const

export const GeographicalSchemaProjectionFromEnterprise = {
  АзимутальнаяПроекцияАитофа: "AzimuthalAitoffProjection",
  АзимутальнаяПроекцияВагнера7: "AzimuthalWagner7Projection",
  АзимутальнаяПроекцияВинкеляТрипеля: "AzimuthalWinkelTripelProjection",
  АзимутальнаяПроекцияРавныхПлощадейЛамберта: "AzimuthalLambertEqualAreaProjection",
  АзимутальнаяПроекцияХамера: "AzimuthalHammerProjection",
  АзимутальнаяРавноудаленнаяПроекция: "AzimuthalEquidistantProjection",
  КоническаяПроекцияРавныхПлощадейЛамберта: "ConicLambertEqualAreaProjection",
  ПрочаяОвальнаяПроекцияОртелиуса: "MiscellaneousOrteliusOvalProjection",
  ПрочаяПроекцияВанДерГринтена1: "MiscellaneousVanDerGrinten1Projection",
  ПрочаяПроекцияВанДерГринтена2: "MiscellaneousVanDerGrinten2Projection",
  ПрочаяПроекцияВанДерГринтена3: "MiscellaneousVanDerGrinten3Projection",
  ПрочаяСотоваяШаровая1Проекция: "MiscellaneousApianGlobular1Projection",
  ПрочаяШароваяПроекцияБекона: "MiscellaneousBaconGlobularProjection",
  ПрочаяШароваяПроекцияНиколоси: "MiscellaneousNicolosiGlobularProjection",
  ПрочаяЭпициклоидальнаяПроекцияАвгуста: "MiscellaneousAugustEpicycloidalProjection",
  ПсевдоцилиндрическаяНормальнаяПроекцияБоггса: "PseudoCylindricalBoggsEumorphicProjection",
  ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса:
    "PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection",
  ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса:
    "PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection",
  ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса:
    "PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection",
  ПсевдоцилиндрическаяПроекцияВинкеля1: "PseudoCylindricalWinkel1Projection",
  ПсевдоцилиндрическаяПроекцияЛоксимутала: "PseudoCylindricalLoximutalProjection",
  ПсевдоцилиндрическаяПроекцияМолвейда: "PseudoCylindricalMollweideProjection",
  ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано:
    "PseudoCylindricalHatanoAsymetricalEqualAreaProjection",
  ПсевдоцилиндрическаяПроекцияПутнинаP2: "PseudoCylindricalPutninP2Projection",
  ПсевдоцилиндрическаяПроекцияПутнинаP5: "PseudoCylindricalPutninP5Projection",
  ПсевдоцилиндрическаяПроекцияРобинсона: "PseudoCylindricalRobinsonProjection",
  ПсевдоцилиндрическаяПроекцияЭкерта1: "PseudoCylindricalEckert1Projection",
  ПсевдоцилиндрическаяПроекцияЭкерта2: "PseudoCylindricalEckert2Projection",
  ПсевдоцилиндрическаяПроекцияЭкерта3: "PseudoCylindricalEckert3Projection",
  ПсевдоцилиндрическаяПроекцияЭкерта4: "PseudoCylindricalEckert4Projection",
  ПсевдоцилиндрическаяПроекцияЭкерта5: "PseudoCylindricalEckert5Projection",
  ПсевдоцилиндрическаяПроекцияЭкерта6: "PseudoCylindricalEckert6Projection",
  ПсевдоцилиндрическаяСинусоидальнаяПроекция: "PseudoCylindricalSinusoidalProjection",
  ЦилиндрическаяПроекцияМиллера: "CylindricalMillerProjection",
  ЦилиндрическаяПроекцияРавныхОбластейЛамберта: "CylindricalLambertEqualAreaProjection",
  ЦилиндрическаяРавноудаленнаяПроекция: "CylindricalEquidistantProjection",
  ЦилиндрическаяСтереографическаяПроекцияГалла: "CylindricalGallStereographicProjection",
} as const

export type GeographicalSchemaProjection = keyof typeof GeographicalSchemaProjectionToEnterprise
export type GeographicalSchemaProjectionEnterprise = keyof typeof GeographicalSchemaProjectionFromEnterprise

export const GeographicalSchemaShowModeToEnterprise = {
  AllData: "ВсеДанные",
  ScaleDefined: "ЗадаетсяМасштабом",
  SpecifiedArea: "ЗаданнаяОбласть",
} as const

export const GeographicalSchemaShowModeFromEnterprise = {
  ВсеДанные: "AllData",
  ЗадаетсяМасштабом: "ScaleDefined",
  ЗаданнаяОбласть: "SpecifiedArea",
} as const

export type GeographicalSchemaShowMode = keyof typeof GeographicalSchemaShowModeToEnterprise
export type GeographicalSchemaShowModeEnterprise = keyof typeof GeographicalSchemaShowModeFromEnterprise

export const PaintingReferencePointPositionToEnterprise = {
  LeftTop: "ЛевоВерх",
  LeftBottom: "ЛевоНиз",
  LeftCenter: "ЛевоЦентр",
  RightTop: "ПравоВерх",
  RightBottom: "ПравоНиз",
  RightCenter: "ПравоЦентр",
  Center: "Центр",
  CenterTop: "ЦентрВерх",
  CenterBottom: "ЦентрНиз",
} as const

export const PaintingReferencePointPositionFromEnterprise = {
  ЛевоВерх: "LeftTop",
  ЛевоНиз: "LeftBottom",
  ЛевоЦентр: "LeftCenter",
  ПравоВерх: "RightTop",
  ПравоНиз: "RightBottom",
  ПравоЦентр: "RightCenter",
  Центр: "Center",
  ЦентрВерх: "CenterTop",
  ЦентрНиз: "CenterBottom",
} as const

export type PaintingReferencePointPosition = keyof typeof PaintingReferencePointPositionToEnterprise
export type PaintingReferencePointPositionEnterprise = keyof typeof PaintingReferencePointPositionFromEnterprise

export const SeriesValuesDrawingModeToEnterprise = {
  ShowAsPart: "ОтображатьКакДолю",
  ShowAsValue: "ОтображатьКакЗначение",
} as const

export const SeriesValuesDrawingModeFromEnterprise = {
  ОтображатьКакДолю: "ShowAsPart",
  ОтображатьКакЗначение: "ShowAsValue",
} as const

export type SeriesValuesDrawingMode = keyof typeof SeriesValuesDrawingModeToEnterprise
export type SeriesValuesDrawingModeEnterprise = keyof typeof SeriesValuesDrawingModeFromEnterprise

export const IntegrationServiceChannelStateToEnterprise = {
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const IntegrationServiceChannelStateFromEnterprise = {
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type IntegrationServiceChannelState = keyof typeof IntegrationServiceChannelStateToEnterprise
export type IntegrationServiceChannelStateEnterprise = keyof typeof IntegrationServiceChannelStateFromEnterprise

export const ArchiveFileCompressionLevelToEnterprise = {
  Maximum: "Максимальный",
  Minimum: "Минимальный",
  Optimal: "Оптимальный",
} as const

export const ArchiveFileCompressionLevelFromEnterprise = {
  Максимальный: "Maximum",
  Минимальный: "Minimum",
  Оптимальный: "Optimal",
} as const

export type ArchiveFileCompressionLevel = keyof typeof ArchiveFileCompressionLevelToEnterprise
export type ArchiveFileCompressionLevelEnterprise = keyof typeof ArchiveFileCompressionLevelFromEnterprise

export const ArchiveFileCompressionMethodToEnterprise = {
  BZIP2: "BZIP2",
  Copy: "Копирование",
  Deflate: "Сжатие",
} as const

export const ArchiveFileCompressionMethodFromEnterprise = {
  BZIP2: "BZIP2",
  Копирование: "Copy",
  Сжатие: "Deflate",
} as const

export type ArchiveFileCompressionMethod = keyof typeof ArchiveFileCompressionMethodToEnterprise
export type ArchiveFileCompressionMethodEnterprise = keyof typeof ArchiveFileCompressionMethodFromEnterprise

export const ArchiveFileEncryptionMethodToEnterprise = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export const ArchiveFileEncryptionMethodFromEnterprise = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export type ArchiveFileEncryptionMethod = keyof typeof ArchiveFileEncryptionMethodToEnterprise
export type ArchiveFileEncryptionMethodEnterprise = keyof typeof ArchiveFileEncryptionMethodFromEnterprise

export const ArchiveFileRestoreFilePathsModeToEnterprise = {
  Restore: "Восстанавливать",
  DontRestore: "НеВосстанавливать",
} as const

export const ArchiveFileRestoreFilePathsModeFromEnterprise = {
  Восстанавливать: "Restore",
  НеВосстанавливать: "DontRestore",
} as const

export type ArchiveFileRestoreFilePathsMode = keyof typeof ArchiveFileRestoreFilePathsModeToEnterprise
export type ArchiveFileRestoreFilePathsModeEnterprise = keyof typeof ArchiveFileRestoreFilePathsModeFromEnterprise

export const ArchiveFileStorePathModeToEnterprise = {
  DontStorePath: "НеСохранятьПути",
  StoreRelativePath: "СохранятьОтносительныеПути",
  StoreFullPath: "СохранятьПолныеПути",
} as const

export const ArchiveFileStorePathModeFromEnterprise = {
  НеСохранятьПути: "DontStorePath",
  СохранятьОтносительныеПути: "StoreRelativePath",
  СохранятьПолныеПути: "StoreFullPath",
} as const

export type ArchiveFileStorePathMode = keyof typeof ArchiveFileStorePathModeToEnterprise
export type ArchiveFileStorePathModeEnterprise = keyof typeof ArchiveFileStorePathModeFromEnterprise

export const ArchiveFileSubDirProcessingModeToEnterprise = {
  DontProcess: "НеОбрабатывать",
  ProcessRecursively: "ОбрабатыватьРекурсивно",
} as const

export const ArchiveFileSubDirProcessingModeFromEnterprise = {
  НеОбрабатывать: "DontProcess",
  ОбрабатыватьРекурсивно: "ProcessRecursively",
} as const

export type ArchiveFileSubDirProcessingMode = keyof typeof ArchiveFileSubDirProcessingModeToEnterprise
export type ArchiveFileSubDirProcessingModeEnterprise = keyof typeof ArchiveFileSubDirProcessingModeFromEnterprise

export const ArchiveFileTypeToEnterprise = {
  BZIP2: "BZIP2",
  GZIP: "GZIP",
  RAR: "RAR",
  SevenZIP: "SevenZIP",
  TAR: "TAR",
  XZ: "XZ",
  ZIP: "ZIP",
} as const

export const ArchiveFileTypeFromEnterprise = {
  BZIP2: "BZIP2",
  GZIP: "GZIP",
  RAR: "RAR",
  SevenZIP: "SevenZIP",
  TAR: "TAR",
  XZ: "XZ",
  ZIP: "ZIP",
} as const

export type ArchiveFileType = keyof typeof ArchiveFileTypeToEnterprise
export type ArchiveFileTypeEnterprise = keyof typeof ArchiveFileTypeFromEnterprise

export const FileNamesEncodingInArchiveFileToEnterprise = {
  UTF8: "UTF8",
  Auto: "Авто",
  OSEncodingWithUTF8: "КодировкаОСДополнительноUTF8",
} as const

export const FileNamesEncodingInArchiveFileFromEnterprise = {
  UTF8: "UTF8",
  Авто: "Auto",
  КодировкаОСДополнительноUTF8: "OSEncodingWithUTF8",
} as const

export type FileNamesEncodingInArchiveFile = keyof typeof FileNamesEncodingInArchiveFileToEnterprise
export type FileNamesEncodingInArchiveFileEnterprise = keyof typeof FileNamesEncodingInArchiveFileFromEnterprise

export const FileAccessToEnterprise = {
  Write: "Запись",
  Read: "Чтение",
  ReadAndWrite: "ЧтениеИЗапись",
} as const

export const FileAccessFromEnterprise = {
  Запись: "Write",
  Чтение: "Read",
  ЧтениеИЗапись: "ReadAndWrite",
} as const

export type FileAccess = keyof typeof FileAccessToEnterprise
export type FileAccessEnterprise = keyof typeof FileAccessFromEnterprise

export const FileCompareMethodToEnterprise = {
  Binary: "Двоичное",
  SpreadsheetDocument: "ТабличныйДокумент",
  TextDocument: "ТекстовыйДокумент",
} as const

export const FileCompareMethodFromEnterprise = {
  Двоичное: "Binary",
  ТабличныйДокумент: "SpreadsheetDocument",
  ТекстовыйДокумент: "TextDocument",
} as const

export type FileCompareMethod = keyof typeof FileCompareMethodToEnterprise
export type FileCompareMethodEnterprise = keyof typeof FileCompareMethodFromEnterprise

export const FileDialogModeToEnterprise = {
  ChooseDirectory: "ВыборКаталога",
  Open: "Открытие",
  Save: "Сохранение",
} as const

export const FileDialogModeFromEnterprise = {
  ВыборКаталога: "ChooseDirectory",
  Открытие: "Open",
  Сохранение: "Save",
} as const

export type FileDialogMode = keyof typeof FileDialogModeToEnterprise
export type FileDialogModeEnterprise = keyof typeof FileDialogModeFromEnterprise

export const FileDialogSectionToEnterprise = {
  Audio: "Аудио",
  Gallery: "Галерея",
  Documents: "Документы",
  Recent: "Недавние",
  Files: "Файлы",
} as const

export const FileDialogSectionFromEnterprise = {
  Аудио: "Audio",
  Галерея: "Gallery",
  Документы: "Documents",
  Недавние: "Recent",
  Файлы: "Files",
} as const

export type FileDialogSection = keyof typeof FileDialogSectionToEnterprise
export type FileDialogSectionEnterprise = keyof typeof FileDialogSectionFromEnterprise

export const FileDragModeToEnterprise = {
  AsFileRef: "КакСсылкаНаФайл",
  AsFile: "КакФайл",
} as const

export const FileDragModeFromEnterprise = {
  КакСсылкаНаФайл: "AsFileRef",
  КакФайл: "AsFile",
} as const

export type FileDragMode = keyof typeof FileDragModeToEnterprise
export type FileDragModeEnterprise = keyof typeof FileDragModeFromEnterprise

export const FileOpenModeToEnterprise = {
  Append: "Дописать",
  Truncate: "Обрезать",
  Open: "Открыть",
  OpenOrCreate: "ОткрытьИлиСоздать",
  Create: "Создать",
  CreateNew: "СоздатьНовый",
} as const

export const FileOpenModeFromEnterprise = {
  Дописать: "Append",
  Обрезать: "Truncate",
  Открыть: "Open",
  ОткрытьИлиСоздать: "OpenOrCreate",
  Создать: "Create",
  СоздатьНовый: "CreateNew",
} as const

export type FileOpenMode = keyof typeof FileOpenModeToEnterprise
export type FileOpenModeEnterprise = keyof typeof FileOpenModeFromEnterprise

export const GetFilesArchiveModeToEnterprise = {
  GetArchiveAlways: "ПолучатьАрхивВсегда",
  GetArchiveWhenRequired: "ПолучатьАрхивПриНеобходимости",
} as const

export const GetFilesArchiveModeFromEnterprise = {
  ПолучатьАрхивВсегда: "GetArchiveAlways",
  ПолучатьАрхивПриНеобходимости: "GetArchiveWhenRequired",
} as const

export type GetFilesArchiveMode = keyof typeof GetFilesArchiveModeToEnterprise
export type GetFilesArchiveModeEnterprise = keyof typeof GetFilesArchiveModeFromEnterprise

export const IncomingShareRequestStandardCommandToEnterprise = {
  CopyToClipboard: "КопироватьВБуферОбмена",
  ShareInConversation: "ПоделитьсяВОбсуждении",
  Show: "Показать",
  Save: "Сохранить",
} as const

export const IncomingShareRequestStandardCommandFromEnterprise = {
  КопироватьВБуферОбмена: "CopyToClipboard",
  ПоделитьсяВОбсуждении: "ShareInConversation",
  Показать: "Show",
  Сохранить: "Save",
} as const

export type IncomingShareRequestStandardCommand = keyof typeof IncomingShareRequestStandardCommandToEnterprise
export type IncomingShareRequestStandardCommandEnterprise =
  keyof typeof IncomingShareRequestStandardCommandFromEnterprise

export const MobileDeviceLibraryDirTypeToEnterprise = {
  Audio: "Аудио",
  Video: "Видео",
  Pictures: "Картинки",
} as const

export const MobileDeviceLibraryDirTypeFromEnterprise = {
  Аудио: "Audio",
  Видео: "Video",
  Картинки: "Pictures",
} as const

export type MobileDeviceLibraryDirType = keyof typeof MobileDeviceLibraryDirTypeToEnterprise
export type MobileDeviceLibraryDirTypeEnterprise = keyof typeof MobileDeviceLibraryDirTypeFromEnterprise

export const ShareRequestDataProcessingVariantToEnterprise = {
  View: "Просмотр",
  Edit: "Редактирование",
} as const

export const ShareRequestDataProcessingVariantFromEnterprise = {
  Просмотр: "View",
  Редактирование: "Edit",
} as const

export type ShareRequestDataProcessingVariant = keyof typeof ShareRequestDataProcessingVariantToEnterprise
export type ShareRequestDataProcessingVariantEnterprise = keyof typeof ShareRequestDataProcessingVariantFromEnterprise

export const AccountMainPresentationToEnterprise = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const AccountMainPresentationFromEnterprise = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type AccountMainPresentation = keyof typeof AccountMainPresentationToEnterprise
export type AccountMainPresentationEnterprise = keyof typeof AccountMainPresentationFromEnterprise

export const AccumulationRegisterTypeToEnterprise = {
  Turnovers: "Обороты",
  Balance: "Остатки",
} as const

export const AccumulationRegisterTypeFromEnterprise = {
  Обороты: "Turnovers",
  Остатки: "Balance",
} as const

export type AccumulationRegisterType = keyof typeof AccumulationRegisterTypeToEnterprise
export type AccumulationRegisterTypeEnterprise = keyof typeof AccumulationRegisterTypeFromEnterprise

export const AttributeUseToEnterprise = {
  ForFolder: "ДляГруппы",
  ForFolderAndItem: "ДляГруппыИЭлемента",
  ForItem: "ДляЭлемента",
} as const

export const AttributeUseFromEnterprise = {
  ДляГруппы: "ForFolder",
  ДляГруппыИЭлемента: "ForFolderAndItem",
  ДляЭлемента: "ForItem",
} as const

export type AttributeUse = keyof typeof AttributeUseToEnterprise
export type AttributeUseEnterprise = keyof typeof AttributeUseFromEnterprise

export const BinaryDataBlockStorageUseModeToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataBlockStorageUseModeFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataBlockStorageUseMode = keyof typeof BinaryDataBlockStorageUseModeToEnterprise
export type BinaryDataBlockStorageUseModeEnterprise = keyof typeof BinaryDataBlockStorageUseModeFromEnterprise

export const BinaryDataStorageModeToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataStorageModeFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataStorageMode = keyof typeof BinaryDataStorageModeToEnterprise
export type BinaryDataStorageModeEnterprise = keyof typeof BinaryDataStorageModeFromEnterprise

export const BusinessProcessNumberPeriodicityToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
} as const

export const BusinessProcessNumberPeriodicityFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
} as const

export type BusinessProcessNumberPeriodicity = keyof typeof BusinessProcessNumberPeriodicityToEnterprise
export type BusinessProcessNumberPeriodicityEnterprise = keyof typeof BusinessProcessNumberPeriodicityFromEnterprise

export const BusinessProcessNumberTypeToEnterprise = {
  String: "Строка",
  Number: "Число",
} as const

export const BusinessProcessNumberTypeFromEnterprise = {
  Строка: "String",
  Число: "Number",
} as const

export type BusinessProcessNumberType = keyof typeof BusinessProcessNumberTypeToEnterprise
export type BusinessProcessNumberTypeEnterprise = keyof typeof BusinessProcessNumberTypeFromEnterprise

export const CalculationRegisterPeriodicityToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
} as const

export const CalculationRegisterPeriodicityFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
} as const

export type CalculationRegisterPeriodicity = keyof typeof CalculationRegisterPeriodicityToEnterprise
export type CalculationRegisterPeriodicityEnterprise = keyof typeof CalculationRegisterPeriodicityFromEnterprise

export const CalculationTypeMainPresentationToEnterprise = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CalculationTypeMainPresentationFromEnterprise = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CalculationTypeMainPresentation = keyof typeof CalculationTypeMainPresentationToEnterprise
export type CalculationTypeMainPresentationEnterprise = keyof typeof CalculationTypeMainPresentationFromEnterprise

export const CatalogCodeTypeToEnterprise = {
  String: "Строка",
  Number: "Число",
} as const

export const CatalogCodeTypeFromEnterprise = {
  Строка: "String",
  Число: "Number",
} as const

export type CatalogCodeType = keyof typeof CatalogCodeTypeToEnterprise
export type CatalogCodeTypeEnterprise = keyof typeof CatalogCodeTypeFromEnterprise

export const CatalogCodesSeriesToEnterprise = {
  WholeCatalog: "ВоВсемСправочнике",
  WithinSubordination: "ВПределахПодчинения",
  WithinOwnerSubordination: "ВПределахПодчиненияВладельцу",
} as const

export const CatalogCodesSeriesFromEnterprise = {
  ВоВсемСправочнике: "WholeCatalog",
  ВПределахПодчинения: "WithinSubordination",
  ВПределахПодчиненияВладельцу: "WithinOwnerSubordination",
} as const

export type CatalogCodesSeries = keyof typeof CatalogCodesSeriesToEnterprise
export type CatalogCodesSeriesEnterprise = keyof typeof CatalogCodesSeriesFromEnterprise

export const CatalogMainPresentationToEnterprise = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CatalogMainPresentationFromEnterprise = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CatalogMainPresentation = keyof typeof CatalogMainPresentationToEnterprise
export type CatalogMainPresentationEnterprise = keyof typeof CatalogMainPresentationFromEnterprise

export const CharOfAccountCodeSeriesToEnterprise = {
  WholeChartOfAccounts: "ВоВсемПланеСчетов",
  WithinSubordination: "ВПределахПодчинения",
} as const

export const CharOfAccountCodeSeriesFromEnterprise = {
  ВоВсемПланеСчетов: "WholeChartOfAccounts",
  ВПределахПодчинения: "WithinSubordination",
} as const

export type CharOfAccountCodeSeries = keyof typeof CharOfAccountCodeSeriesToEnterprise
export type CharOfAccountCodeSeriesEnterprise = keyof typeof CharOfAccountCodeSeriesFromEnterprise

export const CharacteristicKindCodesSeriesToEnterprise = {
  WholeCharacteristicKind: "ВоВсемПланеВидовХарактеристик",
  WithinSubordination: "ВПределахПодчинения",
} as const

export const CharacteristicKindCodesSeriesFromEnterprise = {
  ВоВсемПланеВидовХарактеристик: "WholeCharacteristicKind",
  ВПределахПодчинения: "WithinSubordination",
} as const

export type CharacteristicKindCodesSeries = keyof typeof CharacteristicKindCodesSeriesToEnterprise
export type CharacteristicKindCodesSeriesEnterprise = keyof typeof CharacteristicKindCodesSeriesFromEnterprise

export const CharacteristicTypeMainPresentationToEnterprise = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CharacteristicTypeMainPresentationFromEnterprise = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CharacteristicTypeMainPresentation = keyof typeof CharacteristicTypeMainPresentationToEnterprise
export type CharacteristicTypeMainPresentationEnterprise = keyof typeof CharacteristicTypeMainPresentationFromEnterprise

export const ChartOfCalculationTypesBaseUseToEnterprise = {
  DontUse: "НеИспользовать",
  OnActionPeriod: "ПоПериодуДействия",
  OnRegistrationPeriod: "ПоПериодуРегистрации",
} as const

export const ChartOfCalculationTypesBaseUseFromEnterprise = {
  НеИспользовать: "DontUse",
  ПоПериодуДействия: "OnActionPeriod",
  ПоПериодуРегистрации: "OnRegistrationPeriod",
} as const

export type ChartOfCalculationTypesBaseUse = keyof typeof ChartOfCalculationTypesBaseUseToEnterprise
export type ChartOfCalculationTypesBaseUseEnterprise = keyof typeof ChartOfCalculationTypesBaseUseFromEnterprise

export const ChartOfCalculationTypesCodeTypeToEnterprise = {
  String: "Строка",
  Number: "Число",
} as const

export const ChartOfCalculationTypesCodeTypeFromEnterprise = {
  Строка: "String",
  Число: "Number",
} as const

export type ChartOfCalculationTypesCodeType = keyof typeof ChartOfCalculationTypesCodeTypeToEnterprise
export type ChartOfCalculationTypesCodeTypeEnterprise = keyof typeof ChartOfCalculationTypesCodeTypeFromEnterprise

export const ChoiceDataGetModeOnInputByStringToEnterprise = {
  Directly: "Непосредственно",
  Background: "Фоновый",
} as const

export const ChoiceDataGetModeOnInputByStringFromEnterprise = {
  Непосредственно: "Directly",
  Фоновый: "Background",
} as const

export type ChoiceDataGetModeOnInputByString = keyof typeof ChoiceDataGetModeOnInputByStringToEnterprise
export type ChoiceDataGetModeOnInputByStringEnterprise = keyof typeof ChoiceDataGetModeOnInputByStringFromEnterprise

export const ChoiceModeToEnterprise = {
  QuickChoice: "БыстрыйВыбор",
  FromForm: "ИзФормы",
  BothWays: "ОбоимиСпособами",
} as const

export const ChoiceModeFromEnterprise = {
  БыстрыйВыбор: "QuickChoice",
  ИзФормы: "FromForm",
  ОбоимиСпособами: "BothWays",
} as const

export type ChoiceMode = keyof typeof ChoiceModeToEnterprise
export type ChoiceModeEnterprise = keyof typeof ChoiceModeFromEnterprise

export const CommonAttributeAuthenticationSeparationToEnterprise = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeAuthenticationSeparationFromEnterprise = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeAuthenticationSeparation = keyof typeof CommonAttributeAuthenticationSeparationToEnterprise
export type CommonAttributeAuthenticationSeparationEnterprise =
  keyof typeof CommonAttributeAuthenticationSeparationFromEnterprise

export const CommonAttributeAutoUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CommonAttributeAutoUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CommonAttributeAutoUse = keyof typeof CommonAttributeAutoUseToEnterprise
export type CommonAttributeAutoUseEnterprise = keyof typeof CommonAttributeAutoUseFromEnterprise

export const CommonAttributeConfigurationExtensionsSeparationToEnterprise = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeConfigurationExtensionsSeparationFromEnterprise = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeConfigurationExtensionsSeparation =
  keyof typeof CommonAttributeConfigurationExtensionsSeparationToEnterprise
export type CommonAttributeConfigurationExtensionsSeparationEnterprise =
  keyof typeof CommonAttributeConfigurationExtensionsSeparationFromEnterprise

export const CommonAttributeDataSeparationToEnterprise = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeDataSeparationFromEnterprise = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeDataSeparation = keyof typeof CommonAttributeDataSeparationToEnterprise
export type CommonAttributeDataSeparationEnterprise = keyof typeof CommonAttributeDataSeparationFromEnterprise

export const CommonAttributeSeparatedDataUseToEnterprise = {
  Independently: "Независимо",
  IndependentlyAndSimultaneously: "НезависимоИСовместно",
} as const

export const CommonAttributeSeparatedDataUseFromEnterprise = {
  Независимо: "Independently",
  НезависимоИСовместно: "IndependentlyAndSimultaneously",
} as const

export type CommonAttributeSeparatedDataUse = keyof typeof CommonAttributeSeparatedDataUseToEnterprise
export type CommonAttributeSeparatedDataUseEnterprise = keyof typeof CommonAttributeSeparatedDataUseFromEnterprise

export const CommonAttributeUseToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CommonAttributeUseFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CommonAttributeUse = keyof typeof CommonAttributeUseToEnterprise
export type CommonAttributeUseEnterprise = keyof typeof CommonAttributeUseFromEnterprise

export const CommonAttributeUsersSeparationToEnterprise = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeUsersSeparationFromEnterprise = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeUsersSeparation = keyof typeof CommonAttributeUsersSeparationToEnterprise
export type CommonAttributeUsersSeparationEnterprise = keyof typeof CommonAttributeUsersSeparationFromEnterprise

export const CompatibilityModeToEnterprise = {
  Version8_1: "Версия8_1",
  Version8_2_13: "Версия8_2_13",
  Version8_2_16: "Версия8_2_16",
  Version8_3_1: "Версия8_3_1",
  Version8_3_10: "Версия8_3_10",
  Version8_3_11: "Версия8_3_11",
  Version8_3_12: "Версия8_3_12",
  Version8_3_13: "Версия8_3_13",
  Version8_3_14: "Версия8_3_14",
  Version8_3_15: "Версия8_3_15",
  Version8_3_16: "Версия8_3_16",
  Version8_3_17: "Версия8_3_17",
  Version8_3_18: "Версия8_3_18",
  Version8_3_19: "Версия8_3_19",
  Version8_3_2: "Версия8_3_2",
  Version8_3_20: "Версия8_3_20",
  Version8_3_21: "Версия8_3_21",
  Version8_3_22: "Версия8_3_22",
  Version8_3_23: "Версия8_3_23",
  Version8_3_24: "Версия8_3_24",
  Version8_3_25: "Версия8_3_25",
  Version8_3_26: "Версия8_3_26",
  Version8_3_3: "Версия8_3_3",
  Version8_3_4: "Версия8_3_4",
  Version8_3_5: "Версия8_3_5",
  Version8_3_6: "Версия8_3_6",
  Version8_3_7: "Версия8_3_7",
  Version8_3_8: "Версия8_3_8",
  Version8_3_9: "Версия8_3_9",
  DontUse: "НеИспользовать",
} as const

export const CompatibilityModeFromEnterprise = {
  Версия8_1: "Version8_1",
  Версия8_2_13: "Version8_2_13",
  Версия8_2_16: "Version8_2_16",
  Версия8_3_1: "Version8_3_1",
  Версия8_3_10: "Version8_3_10",
  Версия8_3_11: "Version8_3_11",
  Версия8_3_12: "Version8_3_12",
  Версия8_3_13: "Version8_3_13",
  Версия8_3_14: "Version8_3_14",
  Версия8_3_15: "Version8_3_15",
  Версия8_3_16: "Version8_3_16",
  Версия8_3_17: "Version8_3_17",
  Версия8_3_18: "Version8_3_18",
  Версия8_3_19: "Version8_3_19",
  Версия8_3_2: "Version8_3_2",
  Версия8_3_20: "Version8_3_20",
  Версия8_3_21: "Version8_3_21",
  Версия8_3_22: "Version8_3_22",
  Версия8_3_23: "Version8_3_23",
  Версия8_3_24: "Version8_3_24",
  Версия8_3_25: "Version8_3_25",
  Версия8_3_26: "Version8_3_26",
  Версия8_3_3: "Version8_3_3",
  Версия8_3_4: "Version8_3_4",
  Версия8_3_5: "Version8_3_5",
  Версия8_3_6: "Version8_3_6",
  Версия8_3_7: "Version8_3_7",
  Версия8_3_8: "Version8_3_8",
  Версия8_3_9: "Version8_3_9",
  НеИспользовать: "DontUse",
} as const

export type CompatibilityMode = keyof typeof CompatibilityModeToEnterprise
export type CompatibilityModeEnterprise = keyof typeof CompatibilityModeFromEnterprise

export const ConfigurationExtensionPurposeToEnterprise = {
  Customization: "Адаптация",
  AddOn: "Дополнение",
  Patch: "Исправление",
} as const

export const ConfigurationExtensionPurposeFromEnterprise = {
  Адаптация: "Customization",
  Дополнение: "AddOn",
  Исправление: "Patch",
} as const

export type ConfigurationExtensionPurpose = keyof typeof ConfigurationExtensionPurposeToEnterprise
export type ConfigurationExtensionPurposeEnterprise = keyof typeof ConfigurationExtensionPurposeFromEnterprise

export const CreateOnInputToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CreateOnInputFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CreateOnInput = keyof typeof CreateOnInputToEnterprise
export type CreateOnInputEnterprise = keyof typeof CreateOnInputFromEnterprise

export const DataExchangeMainPresentationToEnterprise = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const DataExchangeMainPresentationFromEnterprise = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type DataExchangeMainPresentation = keyof typeof DataExchangeMainPresentationToEnterprise
export type DataExchangeMainPresentationEnterprise = keyof typeof DataExchangeMainPresentationFromEnterprise

export const DataHistoryUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DataHistoryUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DataHistoryUse = keyof typeof DataHistoryUseToEnterprise
export type DataHistoryUseEnterprise = keyof typeof DataHistoryUseFromEnterprise

export const DefaultDataLockControlModeToEnterprise = {
  Automatic: "Автоматический",
  AutomaticAndManaged: "АвтоматическийИУправляемый",
  Managed: "Управляемый",
} as const

export const DefaultDataLockControlModeFromEnterprise = {
  Автоматический: "Automatic",
  АвтоматическийИУправляемый: "AutomaticAndManaged",
  Управляемый: "Managed",
} as const

export type DefaultDataLockControlMode = keyof typeof DefaultDataLockControlModeToEnterprise
export type DefaultDataLockControlModeEnterprise = keyof typeof DefaultDataLockControlModeFromEnterprise

export const DocumentNumberPeriodicityToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
} as const

export const DocumentNumberPeriodicityFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
} as const

export type DocumentNumberPeriodicity = keyof typeof DocumentNumberPeriodicityToEnterprise
export type DocumentNumberPeriodicityEnterprise = keyof typeof DocumentNumberPeriodicityFromEnterprise

export const DocumentNumberTypeToEnterprise = {
  String: "Строка",
  Number: "Число",
} as const

export const DocumentNumberTypeFromEnterprise = {
  Строка: "String",
  Число: "Number",
} as const

export type DocumentNumberType = keyof typeof DocumentNumberTypeToEnterprise
export type DocumentNumberTypeEnterprise = keyof typeof DocumentNumberTypeFromEnterprise

export const EditTypeToEnterprise = {
  InDialog: "ВДиалоге",
  InList: "ВСписке",
  BothWays: "ОбоимиСпособами",
} as const

export const EditTypeFromEnterprise = {
  ВДиалоге: "InDialog",
  ВСписке: "InList",
  ОбоимиСпособами: "BothWays",
} as const

export type EditType = keyof typeof EditTypeToEnterprise
export type EditTypeEnterprise = keyof typeof EditTypeFromEnterprise

export const ExternalDataSourceTableDataTypeToEnterprise = {
  NonobjectData: "НеобъектныеДанные",
  ObjectData: "ОбъектныеДанные",
} as const

export const ExternalDataSourceTableDataTypeFromEnterprise = {
  НеобъектныеДанные: "NonobjectData",
  ОбъектныеДанные: "ObjectData",
} as const

export type ExternalDataSourceTableDataType = keyof typeof ExternalDataSourceTableDataTypeToEnterprise
export type ExternalDataSourceTableDataTypeEnterprise = keyof typeof ExternalDataSourceTableDataTypeFromEnterprise

export const ExternalDataSourceTableTypeToEnterprise = {
  Expression: "Выражение",
  Table: "Таблица",
} as const

export const ExternalDataSourceTableTypeFromEnterprise = {
  Выражение: "Expression",
  Таблица: "Table",
} as const

export type ExternalDataSourceTableType = keyof typeof ExternalDataSourceTableTypeToEnterprise
export type ExternalDataSourceTableTypeEnterprise = keyof typeof ExternalDataSourceTableTypeFromEnterprise

export const FormTypeToEnterprise = {
  Ordinary: "Обычная",
  Managed: "Управляемая",
} as const

export const FormTypeFromEnterprise = {
  Обычная: "Ordinary",
  Управляемая: "Managed",
} as const

export type FormType = keyof typeof FormTypeToEnterprise
export type FormTypeEnterprise = keyof typeof FormTypeFromEnterprise

export const FullTextSearchOnInputByStringToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const FullTextSearchOnInputByStringFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type FullTextSearchOnInputByString = keyof typeof FullTextSearchOnInputByStringToEnterprise
export type FullTextSearchOnInputByStringEnterprise = keyof typeof FullTextSearchOnInputByStringFromEnterprise

export const HTTPMethodToEnterprise = {
  CONNECT: "CONNECT",
  COPY: "COPY",
  DELETE: "DELETE",
  GET: "GET",
  HEAD: "HEAD",
  LOCK: "LOCK",
  MERGE: "MERGE",
  MKCOL: "MKCOL",
  MOVE: "MOVE",
  OPTIONS: "OPTIONS",
  PATCH: "PATCH",
  POST: "POST",
  PROPFIND: "PROPFIND",
  PROPPATCH: "PROPPATCH",
  PUT: "PUT",
  TRACE: "TRACE",
  UNLOCK: "UNLOCK",
  Any: "Любой",
} as const

export const HTTPMethodFromEnterprise = {
  CONNECT: "CONNECT",
  COPY: "COPY",
  DELETE: "DELETE",
  GET: "GET",
  HEAD: "HEAD",
  LOCK: "LOCK",
  MERGE: "MERGE",
  MKCOL: "MKCOL",
  MOVE: "MOVE",
  OPTIONS: "OPTIONS",
  PATCH: "PATCH",
  POST: "POST",
  PROPFIND: "PROPFIND",
  PROPPATCH: "PROPPATCH",
  PUT: "PUT",
  TRACE: "TRACE",
  UNLOCK: "UNLOCK",
  Любой: "Any",
} as const

export type HTTPMethod = keyof typeof HTTPMethodToEnterprise
export type HTTPMethodEnterprise = keyof typeof HTTPMethodFromEnterprise

export const HierarchyTypeToEnterprise = {
  HierarchyFoldersAndItems: "ИерархияГруппИЭлементов",
  HierarchyOfItems: "ИерархияЭлементов",
} as const

export const HierarchyTypeFromEnterprise = {
  ИерархияГруппИЭлементов: "HierarchyFoldersAndItems",
  ИерархияЭлементов: "HierarchyOfItems",
} as const

export type HierarchyType = keyof typeof HierarchyTypeToEnterprise
export type HierarchyTypeEnterprise = keyof typeof HierarchyTypeFromEnterprise

export const IndexingToEnterprise = {
  Index: "Индексировать",
  IndexWithAdditionalOrder: "ИндексироватьСДопУпорядочиванием",
  DontIndex: "НеИндексировать",
} as const

export const IndexingFromEnterprise = {
  Индексировать: "Index",
  ИндексироватьСДопУпорядочиванием: "IndexWithAdditionalOrder",
  НеИндексировать: "DontIndex",
} as const

export type Indexing = keyof typeof IndexingToEnterprise
export type IndexingEnterprise = keyof typeof IndexingFromEnterprise

export const InformationRegisterPeriodicityToEnterprise = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
  RecorderPosition: "ПозицияРегистратора",
  Second: "Секунда",
} as const

export const InformationRegisterPeriodicityFromEnterprise = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
  ПозицияРегистратора: "RecorderPosition",
  Секунда: "Second",
} as const

export type InformationRegisterPeriodicity = keyof typeof InformationRegisterPeriodicityToEnterprise
export type InformationRegisterPeriodicityEnterprise = keyof typeof InformationRegisterPeriodicityFromEnterprise

export const IntegrationServiceChannelMessageDirectionToEnterprise = {
  Send: "Отправка",
  Receive: "Получение",
} as const

export const IntegrationServiceChannelMessageDirectionFromEnterprise = {
  Отправка: "Send",
  Получение: "Receive",
} as const

export type IntegrationServiceChannelMessageDirection =
  keyof typeof IntegrationServiceChannelMessageDirectionToEnterprise
export type IntegrationServiceChannelMessageDirectionEnterprise =
  keyof typeof IntegrationServiceChannelMessageDirectionFromEnterprise

export const ModalityUseModeToEnterprise = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const ModalityUseModeFromEnterprise = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type ModalityUseMode = keyof typeof ModalityUseModeToEnterprise
export type ModalityUseModeEnterprise = keyof typeof ModalityUseModeFromEnterprise

export const MoveBoundaryOnPostingToEnterprise = {
  DontMove: "НеПеремещать",
  Move: "Перемещать",
} as const

export const MoveBoundaryOnPostingFromEnterprise = {
  НеПеремещать: "DontMove",
  Перемещать: "Move",
} as const

export type MoveBoundaryOnPosting = keyof typeof MoveBoundaryOnPostingToEnterprise
export type MoveBoundaryOnPostingEnterprise = keyof typeof MoveBoundaryOnPostingFromEnterprise

export const ObjectAutonumerationModeToEnterprise = {
  NotAutoFree: "НеОсвобождатьАвтоматически",
  AutoFree: "ОсвобождатьАвтоматически",
} as const

export const ObjectAutonumerationModeFromEnterprise = {
  НеОсвобождатьАвтоматически: "NotAutoFree",
  ОсвобождатьАвтоматически: "AutoFree",
} as const

export type ObjectAutonumerationMode = keyof typeof ObjectAutonumerationModeToEnterprise
export type ObjectAutonumerationModeEnterprise = keyof typeof ObjectAutonumerationModeFromEnterprise

export const ObjectBelongingToEnterprise = {
  Adopted: "Заимствованный",
  Native: "Собственный",
} as const

export const ObjectBelongingFromEnterprise = {
  Заимствованный: "Adopted",
  Собственный: "Native",
} as const

export type ObjectBelonging = keyof typeof ObjectBelongingToEnterprise
export type ObjectBelongingEnterprise = keyof typeof ObjectBelongingFromEnterprise

export const PostingToEnterprise = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const PostingFromEnterprise = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type Posting = keyof typeof PostingToEnterprise
export type PostingEnterprise = keyof typeof PostingFromEnterprise

export const RealTimePostingToEnterprise = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const RealTimePostingFromEnterprise = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type RealTimePosting = keyof typeof RealTimePostingToEnterprise
export type RealTimePostingEnterprise = keyof typeof RealTimePostingFromEnterprise

export const RegisterRecordsDeletionToEnterprise = {
  AutoDeleteOff: "НеУдалятьАвтоматически",
  AutoDelete: "УдалятьАвтоматически",
  AutoDeleteOnUnpost: "УдалятьАвтоматическиПриОтменеПроведения",
} as const

export const RegisterRecordsDeletionFromEnterprise = {
  НеУдалятьАвтоматически: "AutoDeleteOff",
  УдалятьАвтоматически: "AutoDelete",
  УдалятьАвтоматическиПриОтменеПроведения: "AutoDeleteOnUnpost",
} as const

export type RegisterRecordsDeletion = keyof typeof RegisterRecordsDeletionToEnterprise
export type RegisterRecordsDeletionEnterprise = keyof typeof RegisterRecordsDeletionFromEnterprise

export const RegisterRecordsWritingOnPostToEnterprise = {
  WriteSelected: "ЗаписыватьВыбранные",
  WriteModified: "ЗаписыватьМодифицированные",
} as const

export const RegisterRecordsWritingOnPostFromEnterprise = {
  ЗаписыватьВыбранные: "WriteSelected",
  ЗаписыватьМодифицированные: "WriteModified",
} as const

export type RegisterRecordsWritingOnPost = keyof typeof RegisterRecordsWritingOnPostToEnterprise
export type RegisterRecordsWritingOnPostEnterprise = keyof typeof RegisterRecordsWritingOnPostFromEnterprise

export const RegisterWriteModeToEnterprise = {
  Independent: "Независимый",
  RecorderSubordinate: "ПодчинениеРегистратору",
} as const

export const RegisterWriteModeFromEnterprise = {
  Независимый: "Independent",
  ПодчинениеРегистратору: "RecorderSubordinate",
} as const

export type RegisterWriteMode = keyof typeof RegisterWriteModeToEnterprise
export type RegisterWriteModeEnterprise = keyof typeof RegisterWriteModeFromEnterprise

export const ReturnValuesReuseToEnterprise = {
  DuringRequest: "НаВремяВызова",
  DuringSession: "НаВремяСеанса",
  DontUse: "НеИспользовать",
} as const

export const ReturnValuesReuseFromEnterprise = {
  НаВремяВызова: "DuringRequest",
  НаВремяСеанса: "DuringSession",
  НеИспользовать: "DontUse",
} as const

export type ReturnValuesReuse = keyof typeof ReturnValuesReuseToEnterprise
export type ReturnValuesReuseEnterprise = keyof typeof ReturnValuesReuseFromEnterprise

export const ScriptVariantToEnterprise = {
  English: "Английский",
  Russian: "Русский",
} as const

export const ScriptVariantFromEnterprise = {
  Английский: "English",
  Русский: "Russian",
} as const

export type ScriptVariant = keyof typeof ScriptVariantToEnterprise
export type ScriptVariantEnterprise = keyof typeof ScriptVariantFromEnterprise

export const SearchStringModeOnInputByStringToEnterprise = {
  AnyPart: "ЛюбаяЧасть",
  Begin: "Начало",
} as const

export const SearchStringModeOnInputByStringFromEnterprise = {
  ЛюбаяЧасть: "AnyPart",
  Начало: "Begin",
} as const

export type SearchStringModeOnInputByString = keyof typeof SearchStringModeOnInputByStringToEnterprise
export type SearchStringModeOnInputByStringEnterprise = keyof typeof SearchStringModeOnInputByStringFromEnterprise

export const SequenceFillingToEnterprise = {
  AutoFill: "ЗаполнятьАвтоматически",
  AutoFillOff: "НеЗаполнятьАвтоматически",
} as const

export const SequenceFillingFromEnterprise = {
  ЗаполнятьАвтоматически: "AutoFill",
  НеЗаполнятьАвтоматически: "AutoFillOff",
} as const

export type SequenceFilling = keyof typeof SequenceFillingToEnterprise
export type SequenceFillingEnterprise = keyof typeof SequenceFillingFromEnterprise

export const SessionReuseModeToEnterprise = {
  Use: "Использовать",
  AutoUse: "ИспользоватьАвтоматически",
  DontUse: "НеИспользовать",
} as const

export const SessionReuseModeFromEnterprise = {
  Использовать: "Use",
  ИспользоватьАвтоматически: "AutoUse",
  НеИспользовать: "DontUse",
} as const

export type SessionReuseMode = keyof typeof SessionReuseModeToEnterprise
export type SessionReuseModeEnterprise = keyof typeof SessionReuseModeFromEnterprise

export const StyleElementTypeToEnterprise = {
  Border: "Рамка",
  Color: "Цвет",
  Font: "Шрифт",
} as const

export const StyleElementTypeFromEnterprise = {
  Рамка: "Border",
  Цвет: "Color",
  Шрифт: "Font",
} as const

export type StyleElementType = keyof typeof StyleElementTypeToEnterprise
export type StyleElementTypeEnterprise = keyof typeof StyleElementTypeFromEnterprise

export const SubordinationUseToEnterprise = {
  ToFolders: "Группам",
  ToFoldersAndItems: "ГруппамИЭлементам",
  ToItems: "Элементам",
} as const

export const SubordinationUseFromEnterprise = {
  Группам: "ToFolders",
  ГруппамИЭлементам: "ToFoldersAndItems",
  Элементам: "ToItems",
} as const

export type SubordinationUse = keyof typeof SubordinationUseToEnterprise
export type SubordinationUseEnterprise = keyof typeof SubordinationUseFromEnterprise

export const SynchronousExtensionAndAddInCallUseModeToEnterprise = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const SynchronousExtensionAndAddInCallUseModeFromEnterprise = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type SynchronousExtensionAndAddInCallUseMode = keyof typeof SynchronousExtensionAndAddInCallUseModeToEnterprise
export type SynchronousExtensionAndAddInCallUseModeEnterprise =
  keyof typeof SynchronousExtensionAndAddInCallUseModeFromEnterprise

export const SynchronousPlatformExtensionAndAddInCallUseModeToEnterprise = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const SynchronousPlatformExtensionAndAddInCallUseModeFromEnterprise = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type SynchronousPlatformExtensionAndAddInCallUseMode =
  keyof typeof SynchronousPlatformExtensionAndAddInCallUseModeToEnterprise
export type SynchronousPlatformExtensionAndAddInCallUseModeEnterprise =
  keyof typeof SynchronousPlatformExtensionAndAddInCallUseModeFromEnterprise

export const TaskMainPresentationToEnterprise = {
  AsDescription: "ВВидеНаименования",
  AsNumber: "ВВидеНомера",
} as const

export const TaskMainPresentationFromEnterprise = {
  ВВидеНаименования: "AsDescription",
  ВВидеНомера: "AsNumber",
} as const

export type TaskMainPresentation = keyof typeof TaskMainPresentationToEnterprise
export type TaskMainPresentationEnterprise = keyof typeof TaskMainPresentationFromEnterprise

export const TaskNumberAutoPrefixToEnterprise = {
  DontUse: "НеИспользовать",
  BusinessProcessNumber: "НомерБизнесПроцесса",
} as const

export const TaskNumberAutoPrefixFromEnterprise = {
  НеИспользовать: "DontUse",
  НомерБизнесПроцесса: "BusinessProcessNumber",
} as const

export type TaskNumberAutoPrefix = keyof typeof TaskNumberAutoPrefixToEnterprise
export type TaskNumberAutoPrefixEnterprise = keyof typeof TaskNumberAutoPrefixFromEnterprise

export const TaskNumberTypeToEnterprise = {
  String: "Строка",
  Number: "Число",
} as const

export const TaskNumberTypeFromEnterprise = {
  Строка: "String",
  Число: "Number",
} as const

export type TaskNumberType = keyof typeof TaskNumberTypeToEnterprise
export type TaskNumberTypeEnterprise = keyof typeof TaskNumberTypeFromEnterprise

export const TemplateTypeToEnterprise = {
  ActiveDocument: "ActiveDocument",
  HTMLDocument: "HTMLДокумент",
  AddIn: "ВнешняяКомпонента",
  GeographicalSchema: "ГеографическаяСхема",
  GraphicalSchema: "ГрафическаяСхема",
  BinaryData: "ДвоичныеДанные",
  DataCompositionAppearanceTemplate: "МакетОформленияКомпоновкиДанных",
  DataCompositionSchema: "СхемаКомпоновкиДанных",
  SpreadsheetDocument: "ТабличныйДокумент",
  TextDocument: "ТекстовыйДокумент",
} as const

export const TemplateTypeFromEnterprise = {
  ActiveDocument: "ActiveDocument",
  HTMLДокумент: "HTMLDocument",
  ВнешняяКомпонента: "AddIn",
  ГеографическаяСхема: "GeographicalSchema",
  ГрафическаяСхема: "GraphicalSchema",
  ДвоичныеДанные: "BinaryData",
  МакетОформленияКомпоновкиДанных: "DataCompositionAppearanceTemplate",
  СхемаКомпоновкиДанных: "DataCompositionSchema",
  ТабличныйДокумент: "SpreadsheetDocument",
  ТекстовыйДокумент: "TextDocument",
} as const

export type TemplateType = keyof typeof TemplateTypeToEnterprise
export type TemplateTypeEnterprise = keyof typeof TemplateTypeFromEnterprise

export const TransferDirectionToEnterprise = {
  In: "Входной",
  InOut: "ВходнойВыходной",
  Out: "Выходной",
} as const

export const TransferDirectionFromEnterprise = {
  Входной: "In",
  ВходнойВыходной: "InOut",
  Выходной: "Out",
} as const

export type TransferDirection = keyof typeof TransferDirectionToEnterprise
export type TransferDirectionEnterprise = keyof typeof TransferDirectionFromEnterprise

export const TypeReductionModeToEnterprise = {
  Deny: "Запрещать",
  TransformValues: "ПреобразовыватьЗначения",
  DeleteData: "УдалятьДанные",
} as const

export const TypeReductionModeFromEnterprise = {
  Запрещать: "Deny",
  ПреобразовыватьЗначения: "TransformValues",
  УдалятьДанные: "DeleteData",
} as const

export type TypeReductionMode = keyof typeof TypeReductionModeToEnterprise
export type TypeReductionModeEnterprise = keyof typeof TypeReductionModeFromEnterprise

export const UseFullTextSearchToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseFullTextSearchFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseFullTextSearch = keyof typeof UseFullTextSearchToEnterprise
export type UseFullTextSearchEnterprise = keyof typeof UseFullTextSearchFromEnterprise

export const UseQuickChoiceToEnterprise = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseQuickChoiceFromEnterprise = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseQuickChoice = keyof typeof UseQuickChoiceToEnterprise
export type UseQuickChoiceEnterprise = keyof typeof UseQuickChoiceFromEnterprise

export const PresentationAdditionTypeToEnterprise = {
  Add: "Добавлять",
  DontAdd: "НеДобавлять",
} as const

export const PresentationAdditionTypeFromEnterprise = {
  Добавлять: "Add",
  НеДобавлять: "DontAdd",
} as const

export type PresentationAdditionType = keyof typeof PresentationAdditionTypeToEnterprise
export type PresentationAdditionTypeEnterprise = keyof typeof PresentationAdditionTypeFromEnterprise

export const ReportBuilderDetailsFillTypeToEnterprise = {
  GroupValues: "ЗначенияГруппировок",
  DontFill: "НеЗаполнять",
  Details: "Расшифровка",
} as const

export const ReportBuilderDetailsFillTypeFromEnterprise = {
  ЗначенияГруппировок: "GroupValues",
  НеЗаполнять: "DontFill",
  Расшифровка: "Details",
} as const

export type ReportBuilderDetailsFillType = keyof typeof ReportBuilderDetailsFillTypeToEnterprise
export type ReportBuilderDetailsFillTypeEnterprise = keyof typeof ReportBuilderDetailsFillTypeFromEnterprise

export const ReportBuilderDimensionTypeToEnterprise = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const ReportBuilderDimensionTypeFromEnterprise = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type ReportBuilderDimensionType = keyof typeof ReportBuilderDimensionTypeToEnterprise
export type ReportBuilderDimensionTypeEnterprise = keyof typeof ReportBuilderDimensionTypeFromEnterprise

export const TotalPlacementTypeToEnterprise = {
  Header: "Заголовок",
  HeaderAndFooter: "ЗаголовокИПодвал",
  Footer: "Подвал",
  FooterOnly: "ТолькоПодвал",
} as const

export const TotalPlacementTypeFromEnterprise = {
  Заголовок: "Header",
  ЗаголовокИПодвал: "HeaderAndFooter",
  Подвал: "Footer",
  ТолькоПодвал: "FooterOnly",
} as const

export type TotalPlacementType = keyof typeof TotalPlacementTypeToEnterprise
export type TotalPlacementTypeEnterprise = keyof typeof TotalPlacementTypeFromEnterprise

export const XMLAttributeTypeToEnterprise = {
  CDATA: "CDATA",
  ENTITIES: "ENTITIES",
  ENTITY: "ENTITY",
  ENUMERATION: "ENUMERATION",
  ID: "ID",
  IDREF: "IDREF",
  IDREFS: "IDREFS",
  NMTOKEN: "NMTOKEN",
  NMTOKENS: "NMTOKENS",
  NOTATION: "NOTATION",
} as const

export const XMLAttributeTypeFromEnterprise = {
  CDATA: "CDATA",
  ENTITIES: "ENTITIES",
  ENTITY: "ENTITY",
  ENUMERATION: "ENUMERATION",
  ID: "ID",
  IDREF: "IDREF",
  IDREFS: "IDREFS",
  NMTOKEN: "NMTOKEN",
  NMTOKENS: "NMTOKENS",
  NOTATION: "NOTATION",
} as const

export type XMLAttributeType = keyof typeof XMLAttributeTypeToEnterprise
export type XMLAttributeTypeEnterprise = keyof typeof XMLAttributeTypeFromEnterprise

export const XMLCanonicalizationTypeToEnterprise = {
  XMLExclusiveCanonicalization: "ИсключающийКаноническийXML",
  XMLExclusiveCanonicalizationWithComments: "ИсключающийКаноническийXMLСКомментариями",
  XMLCanonicalization: "КаноническийXML",
  XMLCanonicalization1_1: "КаноническийXML1_1",
  XMLCanonicalization1_1WithComments: "КаноническийXML1_1СКомментариями",
  XMLCanonicalizationWithComments: "КаноническийXMLСКомментариями",
} as const

export const XMLCanonicalizationTypeFromEnterprise = {
  ИсключающийКаноническийXML: "XMLExclusiveCanonicalization",
  ИсключающийКаноническийXMLСКомментариями: "XMLExclusiveCanonicalizationWithComments",
  КаноническийXML: "XMLCanonicalization",
  КаноническийXML1_1: "XMLCanonicalization1_1",
  КаноническийXML1_1СКомментариями: "XMLCanonicalization1_1WithComments",
  КаноническийXMLСКомментариями: "XMLCanonicalizationWithComments",
} as const

export type XMLCanonicalizationType = keyof typeof XMLCanonicalizationTypeToEnterprise
export type XMLCanonicalizationTypeEnterprise = keyof typeof XMLCanonicalizationTypeFromEnterprise

export const XMLNodeTypeToEnterprise = {
  Attribute: "Атрибут",
  ProcessingInstruction: "ИнструкцияОбработки",
  Comment: "Комментарий",
  EndEntity: "КонецСущности",
  EndElement: "КонецЭлемента",
  StartElement: "НачалоЭлемента",
  None: "Ничего",
  Notation: "Нотация",
  XMLDeclaration: "ОбъявлениеXML",
  DocumentTypeDefinition: "ОпределениеТипаДокумента",
  Whitespace: "ПробельныеСимволы",
  CDATASection: "СекцияCDATA",
  EntityReference: "СсылкаНаСущность",
  Entity: "Сущность",
  Text: "Текст",
} as const

export const XMLNodeTypeFromEnterprise = {
  Атрибут: "Attribute",
  ИнструкцияОбработки: "ProcessingInstruction",
  Комментарий: "Comment",
  КонецСущности: "EndEntity",
  КонецЭлемента: "EndElement",
  НачалоЭлемента: "StartElement",
  Ничего: "None",
  Нотация: "Notation",
  ОбъявлениеXML: "XMLDeclaration",
  ОпределениеТипаДокумента: "DocumentTypeDefinition",
  ПробельныеСимволы: "Whitespace",
  СекцияCDATA: "CDATASection",
  СсылкаНаСущность: "EntityReference",
  Сущность: "Entity",
  Текст: "Text",
} as const

export type XMLNodeType = keyof typeof XMLNodeTypeToEnterprise
export type XMLNodeTypeEnterprise = keyof typeof XMLNodeTypeFromEnterprise

export const XMLSpaceToEnterprise = {
  Default: "ПоУмолчанию",
  Preserve: "Сохранять",
} as const

export const XMLSpaceFromEnterprise = {
  ПоУмолчанию: "Default",
  Сохранять: "Preserve",
} as const

export type XMLSpace = keyof typeof XMLSpaceToEnterprise
export type XMLSpaceEnterprise = keyof typeof XMLSpaceFromEnterprise

export const XMLTypeAssignmentToEnterprise = {
  Implicit: "Неявное",
  Explicit: "Явное",
} as const

export const XMLTypeAssignmentFromEnterprise = {
  Неявное: "Implicit",
  Явное: "Explicit",
} as const

export type XMLTypeAssignment = keyof typeof XMLTypeAssignmentToEnterprise
export type XMLTypeAssignmentEnterprise = keyof typeof XMLTypeAssignmentFromEnterprise

export const XMLValidationTypeToEnterprise = {
  NoValidate: "НетПроверки",
  DocumentTypeDefinition: "ОпределениеТипаДокумента",
  XMLSchema: "СхемаXML",
} as const

export const XMLValidationTypeFromEnterprise = {
  НетПроверки: "NoValidate",
  ОпределениеТипаДокумента: "DocumentTypeDefinition",
  СхемаXML: "XMLSchema",
} as const

export type XMLValidationType = keyof typeof XMLValidationTypeToEnterprise
export type XMLValidationTypeEnterprise = keyof typeof XMLValidationTypeFromEnterprise

export const AllowedMessageNoToEnterprise = {
  Greater: "Больший",
  Any: "Любой",
  Next: "Очередной",
} as const

export const AllowedMessageNoFromEnterprise = {
  Больший: "Greater",
  Любой: "Any",
  Очередной: "Next",
} as const

export type AllowedMessageNo = keyof typeof AllowedMessageNoToEnterprise
export type AllowedMessageNoEnterprise = keyof typeof AllowedMessageNoFromEnterprise

export const AutoChangeRecordToEnterprise = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const AutoChangeRecordFromEnterprise = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type AutoChangeRecord = keyof typeof AutoChangeRecordToEnterprise
export type AutoChangeRecordEnterprise = keyof typeof AutoChangeRecordFromEnterprise

export const DataItemReceiveToEnterprise = {
  Auto: "Авто",
  Ignore: "Игнорировать",
  Accept: "Принять",
} as const

export const DataItemReceiveFromEnterprise = {
  Авто: "Auto",
  Игнорировать: "Ignore",
  Принять: "Accept",
} as const

export type DataItemReceive = keyof typeof DataItemReceiveToEnterprise
export type DataItemReceiveEnterprise = keyof typeof DataItemReceiveFromEnterprise

export const DataItemSendToEnterprise = {
  Auto: "Авто",
  Ignore: "Игнорировать",
  Delete: "Удалить",
} as const

export const DataItemSendFromEnterprise = {
  Авто: "Auto",
  Игнорировать: "Ignore",
  Удалить: "Delete",
} as const

export type DataItemSend = keyof typeof DataItemSendToEnterprise
export type DataItemSendEnterprise = keyof typeof DataItemSendFromEnterprise

export const AnalysisDataTypeToEnterprise = {
  Discrete: "Дискретные",
  Contiguous: "Непрерывные",
} as const

export const AnalysisDataTypeFromEnterprise = {
  Дискретные: "Discrete",
  Непрерывные: "Contiguous",
} as const

export type AnalysisDataType = keyof typeof AnalysisDataTypeToEnterprise
export type AnalysisDataTypeEnterprise = keyof typeof AnalysisDataTypeFromEnterprise

export const AssociationRulesDataSourceTypeToEnterprise = {
  Object: "Объектный",
  Event: "Событийный",
} as const

export const AssociationRulesDataSourceTypeFromEnterprise = {
  Объектный: "Object",
  Событийный: "Event",
} as const

export type AssociationRulesDataSourceType = keyof typeof AssociationRulesDataSourceTypeToEnterprise
export type AssociationRulesDataSourceTypeEnterprise = keyof typeof AssociationRulesDataSourceTypeFromEnterprise

export const AssociationRulesPruneTypeToEnterprise = {
  Redundant: "Избыточные",
  Covered: "Покрытые",
} as const

export const AssociationRulesPruneTypeFromEnterprise = {
  Избыточные: "Redundant",
  Покрытые: "Covered",
} as const

export type AssociationRulesPruneType = keyof typeof AssociationRulesPruneTypeToEnterprise
export type AssociationRulesPruneTypeEnterprise = keyof typeof AssociationRulesPruneTypeFromEnterprise

export const ClusterizationMethodToEnterprise = {
  NearestNeighbor: "БлижняяСвязь",
  FurthestNeighbor: "ДальняяСвязь",
  KMeans: "КСредних",
  Centroid: "ЦентрТяжести",
} as const

export const ClusterizationMethodFromEnterprise = {
  БлижняяСвязь: "NearestNeighbor",
  ДальняяСвязь: "FurthestNeighbor",
  КСредних: "KMeans",
  ЦентрТяжести: "Centroid",
} as const

export type ClusterizationMethod = keyof typeof ClusterizationMethodToEnterprise
export type ClusterizationMethodEnterprise = keyof typeof ClusterizationMethodFromEnterprise

export const DataAnalysisAssociationRulesOrderTypeToEnterprise = {
  ByConfidence: "ПоДостоверности",
  ByImportance: "ПоЗначимости",
  BySupport: "ПоКоличествуСлучаев",
} as const

export const DataAnalysisAssociationRulesOrderTypeFromEnterprise = {
  ПоДостоверности: "ByConfidence",
  ПоЗначимости: "ByImportance",
  ПоКоличествуСлучаев: "BySupport",
} as const

export type DataAnalysisAssociationRulesOrderType = keyof typeof DataAnalysisAssociationRulesOrderTypeToEnterprise
export type DataAnalysisAssociationRulesOrderTypeEnterprise =
  keyof typeof DataAnalysisAssociationRulesOrderTypeFromEnterprise

export const DataAnalysisColumnTypeAssociationRulesToEnterprise = {
  NotUsed: "НеИспользуемая",
  Object: "Объект",
  Item: "Элемент",
} as const

export const DataAnalysisColumnTypeAssociationRulesFromEnterprise = {
  НеИспользуемая: "NotUsed",
  Объект: "Object",
  Элемент: "Item",
} as const

export type DataAnalysisColumnTypeAssociationRules = keyof typeof DataAnalysisColumnTypeAssociationRulesToEnterprise
export type DataAnalysisColumnTypeAssociationRulesEnterprise =
  keyof typeof DataAnalysisColumnTypeAssociationRulesFromEnterprise

export const DataAnalysisColumnTypeClusterizationToEnterprise = {
  Input: "Входная",
  InputAndPredictable: "ВходнаяИПрогнозируемая",
  Key: "Ключ",
  NotUsed: "НеИспользуемая",
  Predictable: "Прогнозируемая",
} as const

export const DataAnalysisColumnTypeClusterizationFromEnterprise = {
  Входная: "Input",
  ВходнаяИПрогнозируемая: "InputAndPredictable",
  Ключ: "Key",
  НеИспользуемая: "NotUsed",
  Прогнозируемая: "Predictable",
} as const

export type DataAnalysisColumnTypeClusterization = keyof typeof DataAnalysisColumnTypeClusterizationToEnterprise
export type DataAnalysisColumnTypeClusterizationEnterprise =
  keyof typeof DataAnalysisColumnTypeClusterizationFromEnterprise

export const DataAnalysisColumnTypeDecisionTreeToEnterprise = {
  Input: "Входная",
  NotUsed: "НеИспользуемая",
  Predictable: "Прогнозируемая",
} as const

export const DataAnalysisColumnTypeDecisionTreeFromEnterprise = {
  Входная: "Input",
  НеИспользуемая: "NotUsed",
  Прогнозируемая: "Predictable",
} as const

export type DataAnalysisColumnTypeDecisionTree = keyof typeof DataAnalysisColumnTypeDecisionTreeToEnterprise
export type DataAnalysisColumnTypeDecisionTreeEnterprise = keyof typeof DataAnalysisColumnTypeDecisionTreeFromEnterprise

export const DataAnalysisColumnTypeSequentialPatternsToEnterprise = {
  Time: "Время",
  NotUsed: "НеИспользуемая",
  Sequence: "Последовательность",
  Item: "Элемент",
} as const

export const DataAnalysisColumnTypeSequentialPatternsFromEnterprise = {
  Время: "Time",
  НеИспользуемая: "NotUsed",
  Последовательность: "Sequence",
  Элемент: "Item",
} as const

export type DataAnalysisColumnTypeSequentialPatterns = keyof typeof DataAnalysisColumnTypeSequentialPatternsToEnterprise
export type DataAnalysisColumnTypeSequentialPatternsEnterprise =
  keyof typeof DataAnalysisColumnTypeSequentialPatternsFromEnterprise

export const DataAnalysisColumnTypeSummaryStatisticsToEnterprise = {
  Input: "Входная",
  NotUsed: "НеИспользуемая",
} as const

export const DataAnalysisColumnTypeSummaryStatisticsFromEnterprise = {
  Входная: "Input",
  НеИспользуемая: "NotUsed",
} as const

export type DataAnalysisColumnTypeSummaryStatistics = keyof typeof DataAnalysisColumnTypeSummaryStatisticsToEnterprise
export type DataAnalysisColumnTypeSummaryStatisticsEnterprise =
  keyof typeof DataAnalysisColumnTypeSummaryStatisticsFromEnterprise

export const DataAnalysisDistanceMetricTypeToEnterprise = {
  Euclidean: "ЕвклидоваМетрика",
  SquaredEuclidean: "ЕвклидоваМетрикаВКвадрате",
  CityBlock: "МетрикаГорода",
  Maximum: "МетрикаДоминирования",
} as const

export const DataAnalysisDistanceMetricTypeFromEnterprise = {
  ЕвклидоваМетрика: "Euclidean",
  ЕвклидоваМетрикаВКвадрате: "SquaredEuclidean",
  МетрикаГорода: "CityBlock",
  МетрикаДоминирования: "Maximum",
} as const

export type DataAnalysisDistanceMetricType = keyof typeof DataAnalysisDistanceMetricTypeToEnterprise
export type DataAnalysisDistanceMetricTypeEnterprise = keyof typeof DataAnalysisDistanceMetricTypeFromEnterprise

export const DataAnalysisFieldTypeToEnterprise = {
  DataAnalysisObject: "ОбъектАнализаДанных",
  Field: "Поле",
} as const

export const DataAnalysisFieldTypeFromEnterprise = {
  ОбъектАнализаДанных: "DataAnalysisObject",
  Поле: "Field",
} as const

export type DataAnalysisFieldType = keyof typeof DataAnalysisFieldTypeToEnterprise
export type DataAnalysisFieldTypeEnterprise = keyof typeof DataAnalysisFieldTypeFromEnterprise

export const DataAnalysisNumericValueUseTypeToEnterprise = {
  AsBoolean: "КакБулево",
  AsNumeric: "КакЧисло",
} as const

export const DataAnalysisNumericValueUseTypeFromEnterprise = {
  КакБулево: "AsBoolean",
  КакЧисло: "AsNumeric",
} as const

export type DataAnalysisNumericValueUseType = keyof typeof DataAnalysisNumericValueUseTypeToEnterprise
export type DataAnalysisNumericValueUseTypeEnterprise = keyof typeof DataAnalysisNumericValueUseTypeFromEnterprise

export const DataAnalysisResultTableFillTypeToEnterprise = {
  AllFields: "ВсеПоля",
  UsedFields: "ИспользуемыеПоля",
  KeyFields: "КлючевыеПоля",
  DontFill: "НеЗаполнять",
} as const

export const DataAnalysisResultTableFillTypeFromEnterprise = {
  ВсеПоля: "AllFields",
  ИспользуемыеПоля: "UsedFields",
  КлючевыеПоля: "KeyFields",
  НеЗаполнять: "DontFill",
} as const

export type DataAnalysisResultTableFillType = keyof typeof DataAnalysisResultTableFillTypeToEnterprise
export type DataAnalysisResultTableFillTypeEnterprise = keyof typeof DataAnalysisResultTableFillTypeFromEnterprise

export const DataAnalysisSequentialPatternsOrderTypeToEnterprise = {
  ByLength: "ПоДлине",
  BySupport: "ПоКоличествуСлучаев",
} as const

export const DataAnalysisSequentialPatternsOrderTypeFromEnterprise = {
  ПоДлине: "ByLength",
  ПоКоличествуСлучаев: "BySupport",
} as const

export type DataAnalysisSequentialPatternsOrderType = keyof typeof DataAnalysisSequentialPatternsOrderTypeToEnterprise
export type DataAnalysisSequentialPatternsOrderTypeEnterprise =
  keyof typeof DataAnalysisSequentialPatternsOrderTypeFromEnterprise

export const DataAnalysisStandardizationTypeToEnterprise = {
  DontStandardize: "НеСтандартизировать",
  Standardize: "Стандартизировать",
} as const

export const DataAnalysisStandardizationTypeFromEnterprise = {
  НеСтандартизировать: "DontStandardize",
  Стандартизировать: "Standardize",
} as const

export type DataAnalysisStandardizationType = keyof typeof DataAnalysisStandardizationTypeToEnterprise
export type DataAnalysisStandardizationTypeEnterprise = keyof typeof DataAnalysisStandardizationTypeFromEnterprise

export const DataAnalysisTimeIntervalUnitTypeToEnterprise = {
  Year: "Год",
  TenDays: "Декада",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Minute: "Минута",
  Week: "Неделя",
  HalfYear: "Полугодие",
  Second: "Секунда",
  CurrentTenDays: "ТекущаяДекада",
  CurrentMinute: "ТекущаяМинута",
  CurrentWeek: "ТекущаяНеделя",
  CurrentHalfYear: "ТекущееПолугодие",
  CurrentYear: "ТекущийГод",
  CurrentDay: "ТекущийДень",
  CurrentQuarter: "ТекущийКвартал",
  CurrentMonth: "ТекущийМесяц",
  CurrentHour: "ТекущийЧас",
  Hour: "Час",
} as const

export const DataAnalysisTimeIntervalUnitTypeFromEnterprise = {
  Год: "Year",
  Декада: "TenDays",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Минута: "Minute",
  Неделя: "Week",
  Полугодие: "HalfYear",
  Секунда: "Second",
  ТекущаяДекада: "CurrentTenDays",
  ТекущаяМинута: "CurrentMinute",
  ТекущаяНеделя: "CurrentWeek",
  ТекущееПолугодие: "CurrentHalfYear",
  ТекущийГод: "CurrentYear",
  ТекущийДень: "CurrentDay",
  ТекущийКвартал: "CurrentQuarter",
  ТекущийМесяц: "CurrentMonth",
  ТекущийЧас: "CurrentHour",
  Час: "Hour",
} as const

export type DataAnalysisTimeIntervalUnitType = keyof typeof DataAnalysisTimeIntervalUnitTypeToEnterprise
export type DataAnalysisTimeIntervalUnitTypeEnterprise = keyof typeof DataAnalysisTimeIntervalUnitTypeFromEnterprise

export const DecisionTreeSimplificationTypeToEnterprise = {
  DontSimplify: "НеУпрощать",
  Simplify: "Упрощать",
} as const

export const DecisionTreeSimplificationTypeFromEnterprise = {
  НеУпрощать: "DontSimplify",
  Упрощать: "Simplify",
} as const

export type DecisionTreeSimplificationType = keyof typeof DecisionTreeSimplificationTypeToEnterprise
export type DecisionTreeSimplificationTypeEnterprise = keyof typeof DecisionTreeSimplificationTypeFromEnterprise

export const PredictionModelColumnTypeToEnterprise = {
  Input: "Входная",
  DataSourceColumn: "КолонкаИсточникаДанных",
  Predictable: "Прогнозируемая",
} as const

export const PredictionModelColumnTypeFromEnterprise = {
  Входная: "Input",
  КолонкаИсточникаДанных: "DataSourceColumn",
  Прогнозируемая: "Predictable",
} as const

export type PredictionModelColumnType = keyof typeof PredictionModelColumnTypeToEnterprise
export type PredictionModelColumnTypeEnterprise = keyof typeof PredictionModelColumnTypeFromEnterprise

export const FileNamesEncodingInZipFileToEnterprise = {
  UTF8: "UTF8",
  Auto: "Авто",
  OSEncodingWithUTF8: "КодировкаОСДополнительноUTF8",
} as const

export const FileNamesEncodingInZipFileFromEnterprise = {
  UTF8: "UTF8",
  Авто: "Auto",
  КодировкаОСДополнительноUTF8: "OSEncodingWithUTF8",
} as const

export type FileNamesEncodingInZipFile = keyof typeof FileNamesEncodingInZipFileToEnterprise
export type FileNamesEncodingInZipFileEnterprise = keyof typeof FileNamesEncodingInZipFileFromEnterprise

export const ZIPCompressionLevelToEnterprise = {
  Maximum: "Максимальный",
  Minimum: "Минимальный",
  Optimal: "Оптимальный",
} as const

export const ZIPCompressionLevelFromEnterprise = {
  Максимальный: "Maximum",
  Минимальный: "Minimum",
  Оптимальный: "Optimal",
} as const

export type ZIPCompressionLevel = keyof typeof ZIPCompressionLevelToEnterprise
export type ZIPCompressionLevelEnterprise = keyof typeof ZIPCompressionLevelFromEnterprise

export const ZIPCompressionMethodToEnterprise = {
  BZIP2: "BZIP2",
  Copy: "Копирование",
  Deflate: "Сжатие",
} as const

export const ZIPCompressionMethodFromEnterprise = {
  BZIP2: "BZIP2",
  Копирование: "Copy",
  Сжатие: "Deflate",
} as const

export type ZIPCompressionMethod = keyof typeof ZIPCompressionMethodToEnterprise
export type ZIPCompressionMethodEnterprise = keyof typeof ZIPCompressionMethodFromEnterprise

export const ZIPEncryptionMethodToEnterprise = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export const ZIPEncryptionMethodFromEnterprise = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export type ZIPEncryptionMethod = keyof typeof ZIPEncryptionMethodToEnterprise
export type ZIPEncryptionMethodEnterprise = keyof typeof ZIPEncryptionMethodFromEnterprise

export const ZIPRestoreFilePathsModeToEnterprise = {
  Restore: "Восстанавливать",
  DontRestore: "НеВосстанавливать",
} as const

export const ZIPRestoreFilePathsModeFromEnterprise = {
  Восстанавливать: "Restore",
  НеВосстанавливать: "DontRestore",
} as const

export type ZIPRestoreFilePathsMode = keyof typeof ZIPRestoreFilePathsModeToEnterprise
export type ZIPRestoreFilePathsModeEnterprise = keyof typeof ZIPRestoreFilePathsModeFromEnterprise

export const ZIPStorePathModeToEnterprise = {
  DontStorePath: "НеСохранятьПути",
  StoreRelativePath: "СохранятьОтносительныеПути",
  StoreFullPath: "СохранятьПолныеПути",
} as const

export const ZIPStorePathModeFromEnterprise = {
  НеСохранятьПути: "DontStorePath",
  СохранятьОтносительныеПути: "StoreRelativePath",
  СохранятьПолныеПути: "StoreFullPath",
} as const

export type ZIPStorePathMode = keyof typeof ZIPStorePathModeToEnterprise
export type ZIPStorePathModeEnterprise = keyof typeof ZIPStorePathModeFromEnterprise

export const ZIPSubDirProcessingModeToEnterprise = {
  DontProcess: "НеОбрабатывать",
  ProcessRecursively: "ОбрабатыватьРекурсивно",
} as const

export const ZIPSubDirProcessingModeFromEnterprise = {
  НеОбрабатывать: "DontProcess",
  ОбрабатыватьРекурсивно: "ProcessRecursively",
} as const

export type ZIPSubDirProcessingMode = keyof typeof ZIPSubDirProcessingModeToEnterprise
export type ZIPSubDirProcessingModeEnterprise = keyof typeof ZIPSubDirProcessingModeFromEnterprise

// #endregion SystemEnumerations

// #region SystemSets

export const CharsToEnterprise = {
  CR: "ВК",
  VTab: "ВТаб",
  NBSp: "НПП",
  LF: "ПС",
  FF: "ПФ",
  Tab: "Таб",
} as const

export const CharsFromEnterprise = {
  ВК: "CR",
  ВТаб: "VTab",
  НПП: "NBSp",
  ПС: "LF",
  ПФ: "FF",
  Таб: "Tab",
} as const

export type Chars = keyof typeof CharsToEnterprise
export type CharsEnterprise = keyof typeof CharsFromEnterprise

export const PictureLibToEnterprise = {
  ActivateTask: "АктивироватьЗадачу",
  ActiveUsers: "АктивныеПользователи",
  BusinessProcess: "БизнесПроцесс",
  BusinessProcessObject: "БизнесПроцессОбъект",
  InputOnBasis: "ВводНаОсновании",
  CalculationType: "ВидРасчета",
  NestedTable: "ВложеннаяТаблица",
  ExternalDataSource: "ВнешнийИсточникДанных",
  ExternalDataSourceCube: "ВнешнийИсточникДанныхКуб",
  ExternalDataSourceCubeDimensionTable: "ВнешнийИсточникДанныхКубТаблицаИзмерения",
  ExternalDataSourceTable: "ВнешнийИсточникДанныхТаблица",
  ExternalDataSourceFunction: "ВнешнийИсточникДанныхФункция",
  CollaborationSystemExternalUser: "ВнешнийПользовательСистемыВзаимодействия",
  RestoreValues: "ВосстановитьЗначения",
  Forward: "Вперед",
  DataCompositionSelection: "ВыборКомпоновкиДанных",
  DataCompositionSelectionDisabled: "ВыборКомпоновкиДанныхНедоступный",
  Select: "Выбрать",
  ChooseTopLevel: "ВыбратьВерхнийУровень",
  ChooseValue: "ВыбратьЗначение",
  ChooseFromList: "ВыбратьИзСписка",
  ChooseType: "ВыбратьТип",
  OutputList: "ВывестиСписок",
  ExecuteTask: "ВыполнитьЗадачу",
  GeographicalSchema: "ГеографическаяСхема",
  GraphicalSchema: "ГрафическаяСхема",
  GroupConversation: "ГрупповоеОбсуждение",
  Debit: "Дебет",
  DebitCredit: "ДебетКредит",
  Dendrogram: "Дендрограмма",
  Chart: "Диаграмма",
  GanttChart: "ДиаграммаГанта",
  DialogQuestion: "ДиалогВопрос",
  DialogExclamation: "ДиалогВосклицание",
  DialogInformation: "ДиалогИнформация",
  DialogStop: "ДиалогСтоп",
  AddToFavorites: "ДобавитьВИзбранное",
  AddListItem: "ДобавитьЭлементСписка",
  Document: "Документ",
  DocumentObject: "ДокументОбъект",
  DocumentJournal: "ЖурналДокументов",
  EventLog: "ЖурналРегистрации",
  EventLogByUser: "ЖурналРегистрацииПоПользователю",
  LoadReportSettings: "ЗагрузитьНастройкиОтчета",
  Task: "Задача",
  TaskObject: "ЗадачаОбъект",
  EndEdit: "ЗакончитьРедактирование",
  Close: "Закрыть",
  Replace: "Заменить",
  Write: "Записать",
  WriteAndClose: "ЗаписатьИЗакрыть",
  WriteChanges: "ЗаписатьИзменения",
  GrayedAll: "ЗатенитьФлажки",
  FixTable: "ЗафиксироватьТаблицу",
  HierarchicalView: "ИерархическийПросмотр",
  Favorites: "Избранное",
  Change: "Изменить",
  Zoom: "ИзменитьМасштаб",
  CustomizeForm: "ИзменитьФорму",
  ChangeListItem: "ИзменитьЭлементСписка",
  Dimension: "Измерение",
  Information: "Информация",
  History: "История",
  DataHistory: "ИсторияДанных",
  FilterHistory: "ИсторияОтборов",
  MessageHistory: "ИсторияСообщений",
  Calendar: "Календарь",
  Calculator: "Калькулятор",
  Picture: "Картинка",
  FunctionMenuCommand: "КомандаМенюФункций",
  Constant: "Константа",
  QueryWizard: "КонструкторЗапроса",
  QueryWizardNestedQuery: "КонструкторЗапросаВложенныйЗапрос",
  QueryWizardTempTable: "КонструкторЗапросаВременнаяТаблица",
  QueryWizardTempTablesGroup: "КонструкторЗапросаГруппаВременныхТаблиц",
  QueryWizardReplaceTable: "КонструкторЗапросаЗаменитьТаблицу",
  QueryWizardTempTableDescription: "КонструкторЗапросаОписаниеВременнойТаблицы",
  QueryWizardShowChangesTables: "КонструкторЗапросаОтображатьТаблицыИзменений",
  QueryWizardTableParameters: "КонструкторЗапросаПараметрыТаблицы",
  QueryWizardCreateNestedQuery: "КонструкторЗапросаСоздатьВложенныйЗапрос",
  QueryWizardCreateTempTableDropQuery: "КонструкторЗапросаСоздатьЗапросУничтоженияВременнойТаблицы",
  QueryWizardCreateTempTableDescription: "КонструкторЗапросаСоздатьОписаниеВременнойТаблицы",
  DataCompositionSettingsWizard: "КонструкторНастроекКомпоновкиДанных",
  Credit: "Кредит",
  FilterCriterion: "КритерийОтбора",
  Magnifier: "Лупа",
  Back: "Назад",
  Find: "Найти",
  FindInTree: "НайтиВДереве",
  SyncContents: "НайтиВСодержании",
  FindInList: "НайтиВСписке",
  FindByNumber: "НайтиПоНомеру",
  FindPrevious: "НайтиПредыдущий",
  FindNext: "НайтиСледующий",
  CustomizeList: "НастроитьСписок",
  Setting: "Настройка",
  ListSettings: "НастройкаСписка",
  ReportSettings: "НастройкиОтчета",
  StartVideoconference: "НачатьВидеоконференцию",
  DontDisturb: "НеБеспокоить",
  DontNotify: "НеОповещать",
  DataCompositionNewNestedScheme: "НоваяВложеннаяСхемаКомпоновкиДанных",
  NewFolder: "НоваяГруппа",
  DataCompositionNewGroup: "НоваяГруппировкаКомпоновкиДанных",
  DataCompositionNewChart: "НоваяДиаграммаКомпоновкиДанных",
  DataCompositionNewTable: "НоваяТаблицаКомпоновкиДанных",
  NewConversation: "НовоеОбсуждение",
  NewWindow: "НовоеОкно",
  Refresh: "Обновить",
  DataProcessor: "Обработка",
  Conversations: "Обсуждения",
  Notify: "Оповещать",
  Notifications: "Оповещения",
  Stop: "Остановить",
  FilterAndSort: "ОтборИСортировка",
  DataCompositionFilter: "ОтборКомпоновкиДанных",
  DataCompositionFilterDisabled: "ОтборКомпоновкиДанныхНедоступный",
  FilterByType: "ОтборПоВиду",
  FilterByCurrentValue: "ОтборПоТекущемуЗначению",
  ClearFilter: "ОтключитьОтбор",
  OpenFromStandaloneServer: "ОткрытьСАвтономногоСервера",
  OpenFromMainServer: "ОткрытьСОсновногоСервера",
  OpenFile: "ОткрытьФайл",
  UndoPosting: "ОтменаПроведения",
  CancelSearch: "ОтменитьПоиск",
  SendMessage: "ОтправитьСообщение",
  Report: "Отчет",
  AppearanceExclamationMark: "ОформлениеВосклицательныйЗнак",
  AppearanceDashYellow: "ОформлениеДефисЖелтый",
  AppearanceStarFilled: "ОформлениеЗвездаЗаполненная",
  AppearanceStarHalfFilled: "ОформлениеЗвездаЗаполненнаяНаполовину",
  AppearanceStarEmpty: "ОформлениеЗвездаПустая",
  AppearanceExclamationMarkIcon: "ОформлениеЗнакВосклицательныйЗнак",
  AppearanceCrossIcon: "ОформлениеЗнакКрест",
  AppearanceCheckIcon: "ОформлениеЗнакФлажок",
  AppearanceBoxesFilled: "ОформлениеКвадратыЗаполненные",
  AppearanceBoxesTwoFilled: "ОформлениеКвадратыЗаполненныеДва",
  AppearanceBoxesOneFilled: "ОформлениеКвадратыЗаполненныеОдин",
  AppearanceBoxesThreeFilled: "ОформлениеКвадратыЗаполненныеТри",
  AppearanceBoxesEmpty: "ОформлениеКвадратыПустые",
  AppearanceCross: "ОформлениеКрест",
  AppearanceCircleYellow: "ОформлениеКругЖелтый",
  AppearanceCircleFilled: "ОформлениеКругЗаполненный",
  AppearanceCircleTwoFourthFilled: "ОформлениеКругЗаполненныйНаДвеЧетверти",
  AppearanceCircleOneFourthFilled: "ОформлениеКругЗаполненныйНаОднуЧетверть",
  AppearanceCircleThreeFourthFilled: "ОформлениеКругЗаполненныйНаТриЧетверти",
  AppearanceCircleGreen: "ОформлениеКругЗеленый",
  AppearanceCircleRed: "ОформлениеКругКрасный",
  AppearanceCircleEmpty: "ОформлениеКругПустой",
  AppearanceCircleBlack: "ОформлениеКругЧерный",
  AppearanceUpArrowGreen: "ОформлениеСтрелкаВверхЗеленая",
  AppearanceUpArrowGray: "ОформлениеСтрелкаВверхСерая",
  AppearanceDownArrowRed: "ОформлениеСтрелкаВнизКрасная",
  AppearanceDownArrowGray: "ОформлениеСтрелкаВнизСерая",
  AppearanceRightArrowYellow: "ОформлениеСтрелкаВправоЖелтая",
  AppearanceRightArrowGray: "ОформлениеСтрелкаВправоСерая",
  AppearanceUpInclineArrowYellow: "ОформлениеСтрелкаНаклоннаяВверхЖелтая",
  AppearanceUpInclineArrowGreen: "ОформлениеСтрелкаНаклоннаяВверхЗеленая",
  AppearanceUpInclineArrowGray: "ОформлениеСтрелкаНаклоннаяВверхСерая",
  AppearanceDownInclineArrowYellow: "ОформлениеСтрелкаНаклоннаяВнизЖелтая",
  AppearanceDownInclineArrowRed: "ОформлениеСтрелкаНаклоннаяВнизКрасная",
  AppearanceDownInclineArrowGray: "ОформлениеСтрелкаНаклоннаяВнизСерая",
  AppearanceUpTriangleGreen: "ОформлениеТреугольникВверхЗеленый",
  AppearanceDownTriangleRed: "ОформлениеТреугольникВнизКрасный",
  AppearanceFlagYellow: "ОформлениеФлагЖелтый",
  AppearanceFlagGreen: "ОформлениеФлагЗеленый",
  AppearanceFlagRed: "ОформлениеФлагКрасный",
  AppearanceCheckBox: "ОформлениеФлажок",
  Clear: "Очистить",
  Parameters: "Параметры",
  DataCompositionOutputParameters: "ПараметрыВыводаКомпоновкиДанных",
  DataCompositionOutputParametersDisabled: "ПараметрыВыводаКомпоновкиДанныхНедоступные",
  DataCompositionDataParameters: "ПараметрыДанныхКомпоновкиДанных",
  Rename: "Переименовать",
  GoForward: "ПерейтиВперед",
  GoToEnd: "ПерейтиККонцу",
  GoToBegin: "ПерейтиКНачалу",
  GoBack: "ПерейтиНазад",
  GotoExternalURL: "ПерейтиПоВнешнейНавигационнойСсылке",
  GotoURL: "ПерейтиПоНавигационнойСсылке",
  SwitchActivity: "ПереключитьАктивность",
  MoveUp: "ПереместитьВверх",
  MoveLeft: "ПереместитьВлево",
  MoveDown: "ПереместитьВниз",
  MoveRight: "ПереместитьВправо",
  MoveItem: "ПеренестиЭлемент",
  Enum: "Перечисление",
  Reread: "Перечитать",
  Print: "Печать",
  PrintImmediately: "ПечатьСразу",
  ChartOfCalculationTypes: "ПланВидовРасчета",
  ChartOfCalculationTypesObject: "ПланВидовРасчетаОбъект",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик",
  ChartOfCharacteristicTypesObject: "ПланВидовХарактеристикОбъект",
  ExchangePlan: "ПланОбмена",
  ExchangePlanObject: "ПланОбменаОбъект",
  ChartOfAccounts: "ПланСчетов",
  ChartOfAccountsObject: "ПланСчетовОбъект",
  RotateClockwise: "ПовернутьПоЧасовойСтрелке",
  RotateCounterclockwise: "ПовернутьПротивЧасовойСтрелки",
  DataSearch: "ПоискДанных",
  ShowInList: "ПоказатьВСписке",
  ShowData: "ПоказатьДанные",
  ShowPassword: "ПоказатьПароль",
  InputFieldSelect: "ПолеВводаВыбрать",
  InputFieldChooseType: "ПолеВводаВыбратьТип",
  InputFieldCalendar: "ПолеВводаКалендарь",
  InputFieldCalculator: "ПолеВводаКалькулятор",
  InputFieldOpen: "ПолеВводаОткрыть",
  InputFieldClear: "ПолеВводаОчистить",
  GetURL: "ПолучитьНавигационнуюСсылку",
  User: "Пользователь",
  UserWithoutNecessaryProperties: "ПользовательБезНеобходимыхСвойств",
  CollaborationSystemIntegrationUser: "ПользовательИнтеграцииСистемыВзаимодействия",
  UserWithAuthentication: "ПользовательСАутентификацией",
  CollaborationSystemUser: "ПользовательСистемыВзаимодействия",
  DataCompositionUserFields: "ПользовательскиеПоляКомпоновкиДанных",
  DataCompositionGroupFields: "ПоляГруппировкиКомпоновкиДанных",
  DataCompositionGroupFieldsDisabled: "ПоляГруппировкиКомпоновкиДанныхНедоступные",
  MarkToDelete: "ПометитьНаУдаление",
  DataCompositionOrder: "ПорядокКомпоновкиДанных",
  DataCompositionOrderDisabled: "ПорядокКомпоновкиДанныхНедоступный",
  Previous: "Предыдущий",
  Attach: "Прикрепить",
  Post: "Провести",
  CustomExpression: "ПроизвольноеВыражение",
  ViewByOwner: "ПросмотрПоВладельцу",
  ReadChanges: "ПрочитатьИзменения",
  ExpandAll: "РазвернутьВсе",
  AccountingRegister: "РегистрБухгалтерии",
  AccumulationRegister: "РегистрНакопления",
  CalculationRegister: "РегистрРасчета",
  InformationRegister: "РегистрСведений",
  InformationRegisterRecord: "РегистрСведенийЗапись",
  ScheduledJob: "РегламентноеЗадание",
  ScheduledJobs: "РегламентныеЗадания",
  EditInDialog: "РедактироватьВДиалоге",
  ListViewMode: "РежимПросмотраСписка",
  ListViewModeTree: "РежимПросмотраСпискаДерево",
  ListViewModeHierarchicalList: "РежимПросмотраСпискаИерархическийСписок",
  ListViewModeList: "РежимПросмотраСпискаСписок",
  Attribute: "Реквизит",
  Resource: "Ресурс",
  CollapseAll: "СвернутьВсе",
  PivotChart: "СводнаяДиаграмма",
  Properties: "Свойства",
  Today: "Сегодня",
  Char: "Символ",
  CheckSyntax: "СинтаксическийКонтроль",
  CloneObject: "СкопироватьОбъект",
  CloneListItem: "СкопироватьЭлементСписка",
  HidePassword: "СкрытьПароль",
  Next: "Следующий",
  UncheckAll: "СнятьФлажки",
  CreateFolder: "СоздатьГруппу",
  CreateInitialImage: "СоздатьНачальныйОбраз",
  CreateListItem: "СоздатьЭлементСписка",
  Message: "Сообщение",
  SortList: "СортироватьСписок",
  SortListAsc: "СортироватьСписокПоВозрастанию",
  SortListDesc: "СортироватьСписокПоУбыванию",
  Sort: "Сортировка",
  SaveValues: "СохранитьЗначения",
  SaveReportSettings: "СохранитьНастройкиОтчета",
  SaveFile: "СохранитьФайл",
  Help: "Справка",
  FormHelp: "СправкаФормы",
  Catalog: "Справочник",
  CatalogObject: "СправочникОбъект",
  DataCompositionStandardSettings: "СтандартнаяНастройкаКомпоновкиДанных",
  BusinessProcessStart: "СтартБизнесПроцесса",
  GenerateReport: "СформироватьОтчет",
  SpreadsheetInsertComment: "ТабличныйДокументВставитьПримечание",
  SpreadsheetInsertPageBreak: "ТабличныйДокументВставитьРазрывСтраницы",
  SpreadsheetShowGroups: "ТабличныйДокументОтображатьГруппировки",
  SpreadsheetShowHeaders: "ТабличныйДокументОтображатьЗаголовки",
  SpreadsheetShowComments: "ТабличныйДокументОтображатьПримечания",
  SpreadsheetShowGrid: "ТабличныйДокументОтображатьСетку",
  SpreadsheetReadOnly: "ТабличныйДокументТолькоПросмотр",
  SpreadsheetDeleteComment: "ТабличныйДокументУдалитьПримечание",
  SpreadsheetDeletePageBreak: "ТабличныйДокументУдалитьРазрывСтраницы",
  ZoomIn: "УвеличитьМасштаб",
  Delete: "Удалить",
  DeleteDirectly: "УдалитьНепосредственно",
  DeleteListItem: "УдалитьЭлементСписка",
  DeleteListItemDirectly: "УдалитьЭлементСпискаНепосредственно",
  ZoomOut: "УменьшитьМасштаб",
  SearchControl: "УправлениеПоиском",
  LevelUp: "УровеньВверх",
  LevelDown: "УровеньВниз",
  DataCompositionConditionalAppearance: "УсловноеОформлениеКомпоновкиДанных",
  DataCompositionConditionalAppearanceDisabled: "УсловноеОформлениеКомпоновкиДанныхНедоступное",
  SetTime: "УстановитьВремя",
  SetDateInterval: "УстановитьИнтервал",
  SetListItemDeletionMark: "УстановитьПометкуУдаленияЭлементаСписка",
  CheckAll: "УстановитьФлажки",
  Form: "Форма",
  FormattedString: "ФорматированнаяСтрока",
  SettingsStorage: "ХранилищеНастроек",
} as const

export const PictureLibFromEnterprise = {
  АктивироватьЗадачу: "ActivateTask",
  АктивныеПользователи: "ActiveUsers",
  БизнесПроцесс: "BusinessProcess",
  БизнесПроцессОбъект: "BusinessProcessObject",
  ВводНаОсновании: "InputOnBasis",
  ВидРасчета: "CalculationType",
  ВложеннаяТаблица: "NestedTable",
  ВнешнийИсточникДанных: "ExternalDataSource",
  ВнешнийИсточникДанныхКуб: "ExternalDataSourceCube",
  ВнешнийИсточникДанныхКубТаблицаИзмерения: "ExternalDataSourceCubeDimensionTable",
  ВнешнийИсточникДанныхТаблица: "ExternalDataSourceTable",
  ВнешнийИсточникДанныхФункция: "ExternalDataSourceFunction",
  ВнешнийПользовательСистемыВзаимодействия: "CollaborationSystemExternalUser",
  ВосстановитьЗначения: "RestoreValues",
  Вперед: "Forward",
  ВыборКомпоновкиДанных: "DataCompositionSelection",
  ВыборКомпоновкиДанныхНедоступный: "DataCompositionSelectionDisabled",
  Выбрать: "Select",
  ВыбратьВерхнийУровень: "ChooseTopLevel",
  ВыбратьЗначение: "ChooseValue",
  ВыбратьИзСписка: "ChooseFromList",
  ВыбратьТип: "ChooseType",
  ВывестиСписок: "OutputList",
  ВыполнитьЗадачу: "ExecuteTask",
  ГеографическаяСхема: "GeographicalSchema",
  ГрафическаяСхема: "GraphicalSchema",
  ГрупповоеОбсуждение: "GroupConversation",
  Дебет: "Debit",
  ДебетКредит: "DebitCredit",
  Дендрограмма: "Dendrogram",
  Диаграмма: "Chart",
  ДиаграммаГанта: "GanttChart",
  ДиалогВопрос: "DialogQuestion",
  ДиалогВосклицание: "DialogExclamation",
  ДиалогИнформация: "DialogInformation",
  ДиалогСтоп: "DialogStop",
  ДобавитьВИзбранное: "AddToFavorites",
  ДобавитьЭлементСписка: "AddListItem",
  Документ: "Document",
  ДокументОбъект: "DocumentObject",
  ЖурналДокументов: "DocumentJournal",
  ЖурналРегистрации: "EventLog",
  ЖурналРегистрацииПоПользователю: "EventLogByUser",
  ЗагрузитьНастройкиОтчета: "LoadReportSettings",
  Задача: "Task",
  ЗадачаОбъект: "TaskObject",
  ЗакончитьРедактирование: "EndEdit",
  Закрыть: "Close",
  Заменить: "Replace",
  Записать: "Write",
  ЗаписатьИЗакрыть: "WriteAndClose",
  ЗаписатьИзменения: "WriteChanges",
  ЗатенитьФлажки: "GrayedAll",
  ЗафиксироватьТаблицу: "FixTable",
  ИерархическийПросмотр: "HierarchicalView",
  Избранное: "Favorites",
  Изменить: "Change",
  ИзменитьМасштаб: "Zoom",
  ИзменитьФорму: "CustomizeForm",
  ИзменитьЭлементСписка: "ChangeListItem",
  Измерение: "Dimension",
  Информация: "Information",
  История: "History",
  ИсторияДанных: "DataHistory",
  ИсторияОтборов: "FilterHistory",
  ИсторияСообщений: "MessageHistory",
  Календарь: "Calendar",
  Калькулятор: "Calculator",
  Картинка: "Picture",
  КомандаМенюФункций: "FunctionMenuCommand",
  Константа: "Constant",
  КонструкторЗапроса: "QueryWizard",
  КонструкторЗапросаВложенныйЗапрос: "QueryWizardNestedQuery",
  КонструкторЗапросаВременнаяТаблица: "QueryWizardTempTable",
  КонструкторЗапросаГруппаВременныхТаблиц: "QueryWizardTempTablesGroup",
  КонструкторЗапросаЗаменитьТаблицу: "QueryWizardReplaceTable",
  КонструкторЗапросаОписаниеВременнойТаблицы: "QueryWizardTempTableDescription",
  КонструкторЗапросаОтображатьТаблицыИзменений: "QueryWizardShowChangesTables",
  КонструкторЗапросаПараметрыТаблицы: "QueryWizardTableParameters",
  КонструкторЗапросаСоздатьВложенныйЗапрос: "QueryWizardCreateNestedQuery",
  КонструкторЗапросаСоздатьЗапросУничтоженияВременнойТаблицы: "QueryWizardCreateTempTableDropQuery",
  КонструкторЗапросаСоздатьОписаниеВременнойТаблицы: "QueryWizardCreateTempTableDescription",
  КонструкторНастроекКомпоновкиДанных: "DataCompositionSettingsWizard",
  Кредит: "Credit",
  КритерийОтбора: "FilterCriterion",
  Лупа: "Magnifier",
  Назад: "Back",
  Найти: "Find",
  НайтиВДереве: "FindInTree",
  НайтиВСодержании: "SyncContents",
  НайтиВСписке: "FindInList",
  НайтиПоНомеру: "FindByNumber",
  НайтиПредыдущий: "FindPrevious",
  НайтиСледующий: "FindNext",
  НастроитьСписок: "CustomizeList",
  Настройка: "Setting",
  НастройкаСписка: "ListSettings",
  НастройкиОтчета: "ReportSettings",
  НачатьВидеоконференцию: "StartVideoconference",
  НеБеспокоить: "DontDisturb",
  НеОповещать: "DontNotify",
  НоваяВложеннаяСхемаКомпоновкиДанных: "DataCompositionNewNestedScheme",
  НоваяГруппа: "NewFolder",
  НоваяГруппировкаКомпоновкиДанных: "DataCompositionNewGroup",
  НоваяДиаграммаКомпоновкиДанных: "DataCompositionNewChart",
  НоваяТаблицаКомпоновкиДанных: "DataCompositionNewTable",
  НовоеОбсуждение: "NewConversation",
  НовоеОкно: "NewWindow",
  Обновить: "Refresh",
  Обработка: "DataProcessor",
  Обсуждения: "Conversations",
  Оповещать: "Notify",
  Оповещения: "Notifications",
  Остановить: "Stop",
  ОтборИСортировка: "FilterAndSort",
  ОтборКомпоновкиДанных: "DataCompositionFilter",
  ОтборКомпоновкиДанныхНедоступный: "DataCompositionFilterDisabled",
  ОтборПоВиду: "FilterByType",
  ОтборПоТекущемуЗначению: "FilterByCurrentValue",
  ОтключитьОтбор: "ClearFilter",
  ОткрытьСАвтономногоСервера: "OpenFromStandaloneServer",
  ОткрытьСОсновногоСервера: "OpenFromMainServer",
  ОткрытьФайл: "OpenFile",
  ОтменаПроведения: "UndoPosting",
  ОтменитьПоиск: "CancelSearch",
  ОтправитьСообщение: "SendMessage",
  Отчет: "Report",
  ОформлениеВосклицательныйЗнак: "AppearanceExclamationMark",
  ОформлениеДефисЖелтый: "AppearanceDashYellow",
  ОформлениеЗвездаЗаполненная: "AppearanceStarFilled",
  ОформлениеЗвездаЗаполненнаяНаполовину: "AppearanceStarHalfFilled",
  ОформлениеЗвездаПустая: "AppearanceStarEmpty",
  ОформлениеЗнакВосклицательныйЗнак: "AppearanceExclamationMarkIcon",
  ОформлениеЗнакКрест: "AppearanceCrossIcon",
  ОформлениеЗнакФлажок: "AppearanceCheckIcon",
  ОформлениеКвадратыЗаполненные: "AppearanceBoxesFilled",
  ОформлениеКвадратыЗаполненныеДва: "AppearanceBoxesTwoFilled",
  ОформлениеКвадратыЗаполненныеОдин: "AppearanceBoxesOneFilled",
  ОформлениеКвадратыЗаполненныеТри: "AppearanceBoxesThreeFilled",
  ОформлениеКвадратыПустые: "AppearanceBoxesEmpty",
  ОформлениеКрест: "AppearanceCross",
  ОформлениеКругЖелтый: "AppearanceCircleYellow",
  ОформлениеКругЗаполненный: "AppearanceCircleFilled",
  ОформлениеКругЗаполненныйНаДвеЧетверти: "AppearanceCircleTwoFourthFilled",
  ОформлениеКругЗаполненныйНаОднуЧетверть: "AppearanceCircleOneFourthFilled",
  ОформлениеКругЗаполненныйНаТриЧетверти: "AppearanceCircleThreeFourthFilled",
  ОформлениеКругЗеленый: "AppearanceCircleGreen",
  ОформлениеКругКрасный: "AppearanceCircleRed",
  ОформлениеКругПустой: "AppearanceCircleEmpty",
  ОформлениеКругЧерный: "AppearanceCircleBlack",
  ОформлениеСтрелкаВверхЗеленая: "AppearanceUpArrowGreen",
  ОформлениеСтрелкаВверхСерая: "AppearanceUpArrowGray",
  ОформлениеСтрелкаВнизКрасная: "AppearanceDownArrowRed",
  ОформлениеСтрелкаВнизСерая: "AppearanceDownArrowGray",
  ОформлениеСтрелкаВправоЖелтая: "AppearanceRightArrowYellow",
  ОформлениеСтрелкаВправоСерая: "AppearanceRightArrowGray",
  ОформлениеСтрелкаНаклоннаяВверхЖелтая: "AppearanceUpInclineArrowYellow",
  ОформлениеСтрелкаНаклоннаяВверхЗеленая: "AppearanceUpInclineArrowGreen",
  ОформлениеСтрелкаНаклоннаяВверхСерая: "AppearanceUpInclineArrowGray",
  ОформлениеСтрелкаНаклоннаяВнизЖелтая: "AppearanceDownInclineArrowYellow",
  ОформлениеСтрелкаНаклоннаяВнизКрасная: "AppearanceDownInclineArrowRed",
  ОформлениеСтрелкаНаклоннаяВнизСерая: "AppearanceDownInclineArrowGray",
  ОформлениеТреугольникВверхЗеленый: "AppearanceUpTriangleGreen",
  ОформлениеТреугольникВнизКрасный: "AppearanceDownTriangleRed",
  ОформлениеФлагЖелтый: "AppearanceFlagYellow",
  ОформлениеФлагЗеленый: "AppearanceFlagGreen",
  ОформлениеФлагКрасный: "AppearanceFlagRed",
  ОформлениеФлажок: "AppearanceCheckBox",
  Очистить: "Clear",
  Параметры: "Parameters",
  ПараметрыВыводаКомпоновкиДанных: "DataCompositionOutputParameters",
  ПараметрыВыводаКомпоновкиДанныхНедоступные: "DataCompositionOutputParametersDisabled",
  ПараметрыДанныхКомпоновкиДанных: "DataCompositionDataParameters",
  Переименовать: "Rename",
  ПерейтиВперед: "GoForward",
  ПерейтиККонцу: "GoToEnd",
  ПерейтиКНачалу: "GoToBegin",
  ПерейтиНазад: "GoBack",
  ПерейтиПоВнешнейНавигационнойСсылке: "GotoExternalURL",
  ПерейтиПоНавигационнойСсылке: "GotoURL",
  ПереключитьАктивность: "SwitchActivity",
  ПереместитьВверх: "MoveUp",
  ПереместитьВлево: "MoveLeft",
  ПереместитьВниз: "MoveDown",
  ПереместитьВправо: "MoveRight",
  ПеренестиЭлемент: "MoveItem",
  Перечисление: "Enum",
  Перечитать: "Reread",
  Печать: "Print",
  ПечатьСразу: "PrintImmediately",
  ПланВидовРасчета: "ChartOfCalculationTypes",
  ПланВидовРасчетаОбъект: "ChartOfCalculationTypesObject",
  ПланВидовХарактеристик: "ChartOfCharacteristicTypes",
  ПланВидовХарактеристикОбъект: "ChartOfCharacteristicTypesObject",
  ПланОбмена: "ExchangePlan",
  ПланОбменаОбъект: "ExchangePlanObject",
  ПланСчетов: "ChartOfAccounts",
  ПланСчетовОбъект: "ChartOfAccountsObject",
  ПовернутьПоЧасовойСтрелке: "RotateClockwise",
  ПовернутьПротивЧасовойСтрелки: "RotateCounterclockwise",
  ПоискДанных: "DataSearch",
  ПоказатьВСписке: "ShowInList",
  ПоказатьДанные: "ShowData",
  ПоказатьПароль: "ShowPassword",
  ПолеВводаВыбрать: "InputFieldSelect",
  ПолеВводаВыбратьТип: "InputFieldChooseType",
  ПолеВводаКалендарь: "InputFieldCalendar",
  ПолеВводаКалькулятор: "InputFieldCalculator",
  ПолеВводаОткрыть: "InputFieldOpen",
  ПолеВводаОчистить: "InputFieldClear",
  ПолучитьНавигационнуюСсылку: "GetURL",
  Пользователь: "User",
  ПользовательБезНеобходимыхСвойств: "UserWithoutNecessaryProperties",
  ПользовательИнтеграцииСистемыВзаимодействия: "CollaborationSystemIntegrationUser",
  ПользовательСАутентификацией: "UserWithAuthentication",
  ПользовательСистемыВзаимодействия: "CollaborationSystemUser",
  ПользовательскиеПоляКомпоновкиДанных: "DataCompositionUserFields",
  ПоляГруппировкиКомпоновкиДанных: "DataCompositionGroupFields",
  ПоляГруппировкиКомпоновкиДанныхНедоступные: "DataCompositionGroupFieldsDisabled",
  ПометитьНаУдаление: "MarkToDelete",
  ПорядокКомпоновкиДанных: "DataCompositionOrder",
  ПорядокКомпоновкиДанныхНедоступный: "DataCompositionOrderDisabled",
  Предыдущий: "Previous",
  Прикрепить: "Attach",
  Провести: "Post",
  ПроизвольноеВыражение: "CustomExpression",
  ПросмотрПоВладельцу: "ViewByOwner",
  ПрочитатьИзменения: "ReadChanges",
  РазвернутьВсе: "ExpandAll",
  РегистрБухгалтерии: "AccountingRegister",
  РегистрНакопления: "AccumulationRegister",
  РегистрРасчета: "CalculationRegister",
  РегистрСведений: "InformationRegister",
  РегистрСведенийЗапись: "InformationRegisterRecord",
  РегламентноеЗадание: "ScheduledJob",
  РегламентныеЗадания: "ScheduledJobs",
  РедактироватьВДиалоге: "EditInDialog",
  РежимПросмотраСписка: "ListViewMode",
  РежимПросмотраСпискаДерево: "ListViewModeTree",
  РежимПросмотраСпискаИерархическийСписок: "ListViewModeHierarchicalList",
  РежимПросмотраСпискаСписок: "ListViewModeList",
  Реквизит: "Attribute",
  Ресурс: "Resource",
  СвернутьВсе: "CollapseAll",
  СводнаяДиаграмма: "PivotChart",
  Свойства: "Properties",
  Сегодня: "Today",
  Символ: "Char",
  СинтаксическийКонтроль: "CheckSyntax",
  СкопироватьОбъект: "CloneObject",
  СкопироватьЭлементСписка: "CloneListItem",
  СкрытьПароль: "HidePassword",
  Следующий: "Next",
  СнятьФлажки: "UncheckAll",
  СоздатьГруппу: "CreateFolder",
  СоздатьНачальныйОбраз: "CreateInitialImage",
  СоздатьЭлементСписка: "CreateListItem",
  Сообщение: "Message",
  СортироватьСписок: "SortList",
  СортироватьСписокПоВозрастанию: "SortListAsc",
  СортироватьСписокПоУбыванию: "SortListDesc",
  Сортировка: "Sort",
  СохранитьЗначения: "SaveValues",
  СохранитьНастройкиОтчета: "SaveReportSettings",
  СохранитьФайл: "SaveFile",
  Справка: "Help",
  СправкаФормы: "FormHelp",
  Справочник: "Catalog",
  СправочникОбъект: "CatalogObject",
  СтандартнаяНастройкаКомпоновкиДанных: "DataCompositionStandardSettings",
  СтартБизнесПроцесса: "BusinessProcessStart",
  СформироватьОтчет: "GenerateReport",
  ТабличныйДокументВставитьПримечание: "SpreadsheetInsertComment",
  ТабличныйДокументВставитьРазрывСтраницы: "SpreadsheetInsertPageBreak",
  ТабличныйДокументОтображатьГруппировки: "SpreadsheetShowGroups",
  ТабличныйДокументОтображатьЗаголовки: "SpreadsheetShowHeaders",
  ТабличныйДокументОтображатьПримечания: "SpreadsheetShowComments",
  ТабличныйДокументОтображатьСетку: "SpreadsheetShowGrid",
  ТабличныйДокументТолькоПросмотр: "SpreadsheetReadOnly",
  ТабличныйДокументУдалитьПримечание: "SpreadsheetDeleteComment",
  ТабличныйДокументУдалитьРазрывСтраницы: "SpreadsheetDeletePageBreak",
  УвеличитьМасштаб: "ZoomIn",
  Удалить: "Delete",
  УдалитьНепосредственно: "DeleteDirectly",
  УдалитьЭлементСписка: "DeleteListItem",
  УдалитьЭлементСпискаНепосредственно: "DeleteListItemDirectly",
  УменьшитьМасштаб: "ZoomOut",
  УправлениеПоиском: "SearchControl",
  УровеньВверх: "LevelUp",
  УровеньВниз: "LevelDown",
  УсловноеОформлениеКомпоновкиДанных: "DataCompositionConditionalAppearance",
  УсловноеОформлениеКомпоновкиДанныхНедоступное: "DataCompositionConditionalAppearanceDisabled",
  УстановитьВремя: "SetTime",
  УстановитьИнтервал: "SetDateInterval",
  УстановитьПометкуУдаленияЭлементаСписка: "SetListItemDeletionMark",
  УстановитьФлажки: "CheckAll",
  Форма: "Form",
  ФорматированнаяСтрока: "FormattedString",
  ХранилищеНастроек: "SettingsStorage",
} as const

export type PictureLib = keyof typeof PictureLibToEnterprise
export type PictureLibEnterprise = keyof typeof PictureLibFromEnterprise

export const StyleBordersToEnterprise = {
  ControlBorder: "РамкаЭлементаУправления",
} as const

export const StyleBordersFromEnterprise = {
  РамкаЭлементаУправления: "ControlBorder",
} as const

export type StyleBorders = keyof typeof StyleBordersToEnterprise
export type StyleBordersEnterprise = keyof typeof StyleBordersFromEnterprise

export const StyleColorsToEnterprise = {
  FieldAlternativeBackColor: "АльтернативныйЦветФонаПоля",
  ActivityColor: "ЦветАктивности",
  AccentColor: "ЦветАкцента",
  ImportantColor: "ЦветВажного",
  AuxiliaryNavigationColor: "ЦветДополнительнойНавигации",
  ReportLineColor: "ЦветЛинииОтчета",
  NavigationColor: "ЦветНавигации",
  SpecialTextColor: "ЦветОсобогоТекста",
  NegativeTextColor: "ЦветОтрицательногоЧисла",
  BorderColor: "ЦветРамки",
  ButtonBorderColor: "ЦветРамкиКнопки",
  FieldSelectedTextColor: "ЦветТекстаВыделенияПоля",
  ButtonTextColor: "ЦветТекстаКнопки",
  TableFooterTextColor: "ЦветТекстаПодвалаТаблицы",
  ToolTipTextColor: "ЦветТекстаПодсказки",
  FieldTextColor: "ЦветТекстаПоля",
  FormTextColor: "ЦветТекстаФормы",
  TableHeaderTextColor: "ЦветТекстаШапкиТаблицы",
  FieldSelectionBackColor: "ЦветФонаВыделенияПоля",
  ReportGroup1BackColor: "ЦветФонаГруппировкиОтчета1",
  ReportGroup2BackColor: "ЦветФонаГруппировкиОтчета2",
  ButtonBackColor: "ЦветФонаКнопки",
  TableFooterBackColor: "ЦветФонаПодвалаТаблицы",
  ToolTipBackColor: "ЦветФонаПодсказки",
  FieldBackColor: "ЦветФонаПоля",
  FormBackColor: "ЦветФонаФормы",
  ReportHeaderBackColor: "ЦветФонаШапкиОтчета",
  TableHeaderBackColor: "ЦветФонаШапкиТаблицы",
} as const

export const StyleColorsFromEnterprise = {
  АльтернативныйЦветФонаПоля: "FieldAlternativeBackColor",
  ЦветАктивности: "ActivityColor",
  ЦветАкцента: "AccentColor",
  ЦветВажного: "ImportantColor",
  ЦветДополнительнойНавигации: "AuxiliaryNavigationColor",
  ЦветЛинииОтчета: "ReportLineColor",
  ЦветНавигации: "NavigationColor",
  ЦветОсобогоТекста: "SpecialTextColor",
  ЦветОтрицательногоЧисла: "NegativeTextColor",
  ЦветРамки: "BorderColor",
  ЦветРамкиКнопки: "ButtonBorderColor",
  ЦветТекстаВыделенияПоля: "FieldSelectedTextColor",
  ЦветТекстаКнопки: "ButtonTextColor",
  ЦветТекстаПодвалаТаблицы: "TableFooterTextColor",
  ЦветТекстаПодсказки: "ToolTipTextColor",
  ЦветТекстаПоля: "FieldTextColor",
  ЦветТекстаФормы: "FormTextColor",
  ЦветТекстаШапкиТаблицы: "TableHeaderTextColor",
  ЦветФонаВыделенияПоля: "FieldSelectionBackColor",
  ЦветФонаГруппировкиОтчета1: "ReportGroup1BackColor",
  ЦветФонаГруппировкиОтчета2: "ReportGroup2BackColor",
  ЦветФонаКнопки: "ButtonBackColor",
  ЦветФонаПодвалаТаблицы: "TableFooterBackColor",
  ЦветФонаПодсказки: "ToolTipBackColor",
  ЦветФонаПоля: "FieldBackColor",
  ЦветФонаФормы: "FormBackColor",
  ЦветФонаШапкиОтчета: "ReportHeaderBackColor",
  ЦветФонаШапкиТаблицы: "TableHeaderBackColor",
} as const

export type StyleColors = keyof typeof StyleColorsToEnterprise
export type StyleColorsEnterprise = keyof typeof StyleColorsFromEnterprise

export const StyleFontsToEnterprise = {
  LargeTextFont: "КрупныйШрифтТекста",
  SmallTextFont: "МелкийШрифтТекста",
  NormalTextFont: "ОбычныйШрифтТекста",
  ExtraLargeTextFont: "ОченьКрупныйШрифтТекста",
  TextFont: "ШрифтТекста",
} as const

export const StyleFontsFromEnterprise = {
  КрупныйШрифтТекста: "LargeTextFont",
  МелкийШрифтТекста: "SmallTextFont",
  ОбычныйШрифтТекста: "NormalTextFont",
  ОченьКрупныйШрифтТекста: "ExtraLargeTextFont",
  ШрифтТекста: "TextFont",
} as const

export type StyleFonts = keyof typeof StyleFontsToEnterprise
export type StyleFontsEnterprise = keyof typeof StyleFontsFromEnterprise

export const WebColorsToEnterprise = {
  Aquamarine: "Аквамарин",
  AliceBlue: "АкварельноСиний",
  AntiqueWhite: "АнтикБелый",
  Beige: "Бежевый",
  Snow: "Белоснежный",
  White: "Белый",
  Turquoise: "Бирюзовый",
  PaleTurquoise: "БледноБирюзовый",
  PaleGreen: "БледноЗеленый",
  PaleGoldenrod: "БледноЗолотистый",
  PaleVioletRed: "БледноКрасноФиолетовый",
  Lavender: "БледноЛиловый",
  BlanchedAlmond: "БледноМиндальный",
  Thistle: "БледноСиреневый",
  CornFlowerBlue: "Васильковый",
  SpringGreen: "ВесеннеЗеленый",
  LightBlue: "Голубой",
  LavenderBlush: "ГолубойСКраснымОттенком",
  LightSteelBlue: "ГолубойСоСтальнымОттенком",
  SlateGray: "ГрифельноСерый",
  SlateBlue: "ГрифельноСиний",
  BurlyWood: "Древесный",
  WhiteSmoke: "ДымчатоБелый",
  YellowGreen: "ЖелтоЗеленый",
  Yellow: "Желтый",
  Moccasin: "ЗамшаСветлый",
  LawnGreen: "ЗеленаяЛужайка",
  Chartreuse: "ЗеленоватоЖелтый",
  Lime: "ЗеленоватоЛимонный",
  GreenYellow: "ЗеленоЖелтый",
  Green: "Зеленый",
  ForestGreen: "ЗеленыйЛес",
  Goldenrod: "Золотистый",
  Gold: "Золотой",
  Indigo: "Индиго",
  IndianRed: "Киноварь",
  FireBrick: "Кирпичный",
  SaddleBrown: "КожаноКоричневый",
  Coral: "Коралловый",
  Brown: "Коричневый",
  RoyalBlue: "КоролевскиГолубой",
  VioletRed: "КрасноФиолетовый",
  Red: "Красный",
  Cream: "Кремовый",
  Azure: "Лазурный",
  LimeGreen: "ЛимонноЗеленый",
  LemonChiffon: "Лимонный",
  Salmon: "Лосось",
  LightSalmon: "ЛососьСветлый",
  DarkSalmon: "ЛососьТемный",
  Linen: "Льняной",
  Crimson: "Малиновый",
  MintCream: "МятныйКрем",
  NavajoWhite: "НавахоБелый",
  DeepSkyBlue: "НасыщенноНебесноГолубой",
  DeepPink: "НасыщенноРозовый",
  SkyBlue: "НебесноГолубой",
  MediumAquaMarine: "НейтральноАквамариновый",
  MediumTurquoise: "НейтральноБирюзовый",
  MediumSpringGreen: "НейтральноВесеннеЗеленый",
  MediumSlateBlue: "НейтральноГрифельноСиний",
  MediumGreen: "НейтральноЗеленый",
  Peru: "НейтральноКоричневый",
  MediumPurple: "НейтральноПурпурный",
  MediumGray: "НейтральноСерый",
  MediumBlue: "НейтральноСиний",
  MediumVioletRed: "НейтральноФиолетовоКрасный",
  Olive: "Оливковый",
  OrangeRed: "ОранжевоКрасный",
  Orange: "Оранжевый",
  Orchid: "Орхидея",
  MediumOrchid: "ОрхидеяНейтральный",
  DarkOrchid: "ОрхидеяТемный",
  Sienna: "Охра",
  SeaShell: "Перламутровый",
  PeachPuff: "Персиковый",
  SandyBrown: "ПесочноКоричневый",
  MidnightBlue: "ПолночноСиний",
  GhostWhite: "ПризрачноБелый",
  Purple: "Пурпурный",
  Wheat: "Пшеничный",
  RosyBrown: "РозовоКоричневый",
  Pink: "Розовый",
  HoneyDew: "Роса",
  Tan: "РыжеватоКоричневый",
  LightSlateGray: "СветлоГрифельноСерый",
  LightSlateBlue: "СветлоГрифельноСиний",
  LightYellow: "СветлоЖелтый",
  LightGoldenRodYellow: "СветлоЖелтыйЗолотистый",
  LightGreen: "СветлоЗеленый",
  LightGoldenRod: "СветлоЗолотистый",
  LightCoral: "СветлоКоралловый",
  Bisque: "СветлоКоричневый",
  LightSkyBlue: "СветлоНебесноГолубой",
  LightPink: "СветлоРозовый",
  LightGray: "СветлоСерый",
  Gainsboro: "СеребристоСерый",
  Silver: "Серебряный",
  CadetBlue: "СероСиний",
  Gray: "Серый",
  DodgerBlue: "СинеСерый",
  BlueViolet: "СинеФиолетовый",
  Blue: "Синий",
  SteelBlue: "СинийСоСтальнымОттенком",
  PowderBlue: "СинийСПороховымОттенком",
  Plum: "Сливовый",
  Ivory: "СлоноваяКость",
  OldLace: "СтароеКружево",
  DarkTurquoise: "ТемноБирюзовый",
  Maroon: "ТемноБордовый",
  DarkSlateGray: "ТемноГрифельноСерый",
  DarkSlateBlue: "ТемноГрифельноСиний",
  DarkGreen: "ТемноЗеленый",
  DarkGoldenRod: "ТемноЗолотистый",
  DarkRed: "ТемноКрасный",
  DarkOliveGreen: "ТемноОливковоЗеленый",
  DarkOrange: "ТемноОранжевый",
  DarkGray: "ТемноСерый",
  DarkBlue: "ТемноСиний",
  DarkViolet: "ТемноФиолетовый",
  HotPink: "ТеплоРозовый",
  Tomato: "Томатный",
  PapayaWhip: "ТопленоеМолоко",
  Olivedrab: "ТусклоОливковый",
  MistyRose: "ТусклоРозовый",
  DimGray: "ТусклоСерый",
  Navy: "Ультрамарин",
  Violet: "Фиолетовый",
  Magenta: "Фуксин",
  DarkMagenta: "ФуксинТемный",
  Fuchsia: "Фуксия",
  Khaki: "Хаки",
  DarkKhaki: "ХакиТемный",
  Seagreen: "ЦветМорскойВолны",
  MediumSeaGreen: "ЦветМорскойВолныНейтральный",
  LightSeaGreen: "ЦветМорскойВолныСветлый",
  DarkSeaGreen: "ЦветМорскойВолныТемный",
  FloralWhite: "ЦветокБелый",
  Cyan: "Циан",
  Aqua: "ЦианАкварельный",
  Teal: "ЦианНейтральный",
  LightCyan: "ЦианСветлый",
  DarkCyan: "ЦианТемный",
  Black: "Черный",
  CornSilk: "ШелковыйОттенок",
  Chocolate: "Шоколадный",
} as const

export const WebColorsFromEnterprise = {
  Аквамарин: "Aquamarine",
  АкварельноСиний: "AliceBlue",
  АнтикБелый: "AntiqueWhite",
  Бежевый: "Beige",
  Белоснежный: "Snow",
  Белый: "White",
  Бирюзовый: "Turquoise",
  БледноБирюзовый: "PaleTurquoise",
  БледноЗеленый: "PaleGreen",
  БледноЗолотистый: "PaleGoldenrod",
  БледноКрасноФиолетовый: "PaleVioletRed",
  БледноЛиловый: "Lavender",
  БледноМиндальный: "BlanchedAlmond",
  БледноСиреневый: "Thistle",
  Васильковый: "CornFlowerBlue",
  ВесеннеЗеленый: "SpringGreen",
  Голубой: "LightBlue",
  ГолубойСКраснымОттенком: "LavenderBlush",
  ГолубойСоСтальнымОттенком: "LightSteelBlue",
  ГрифельноСерый: "SlateGray",
  ГрифельноСиний: "SlateBlue",
  Древесный: "BurlyWood",
  ДымчатоБелый: "WhiteSmoke",
  ЖелтоЗеленый: "YellowGreen",
  Желтый: "Yellow",
  ЗамшаСветлый: "Moccasin",
  ЗеленаяЛужайка: "LawnGreen",
  ЗеленоватоЖелтый: "Chartreuse",
  ЗеленоватоЛимонный: "Lime",
  ЗеленоЖелтый: "GreenYellow",
  Зеленый: "Green",
  ЗеленыйЛес: "ForestGreen",
  Золотистый: "Goldenrod",
  Золотой: "Gold",
  Индиго: "Indigo",
  Киноварь: "IndianRed",
  Кирпичный: "FireBrick",
  КожаноКоричневый: "SaddleBrown",
  Коралловый: "Coral",
  Коричневый: "Brown",
  КоролевскиГолубой: "RoyalBlue",
  КрасноФиолетовый: "VioletRed",
  Красный: "Red",
  Кремовый: "Cream",
  Лазурный: "Azure",
  ЛимонноЗеленый: "LimeGreen",
  Лимонный: "LemonChiffon",
  Лосось: "Salmon",
  ЛососьСветлый: "LightSalmon",
  ЛососьТемный: "DarkSalmon",
  Льняной: "Linen",
  Малиновый: "Crimson",
  МятныйКрем: "MintCream",
  НавахоБелый: "NavajoWhite",
  НасыщенноНебесноГолубой: "DeepSkyBlue",
  НасыщенноРозовый: "DeepPink",
  НебесноГолубой: "SkyBlue",
  НейтральноАквамариновый: "MediumAquaMarine",
  НейтральноБирюзовый: "MediumTurquoise",
  НейтральноВесеннеЗеленый: "MediumSpringGreen",
  НейтральноГрифельноСиний: "MediumSlateBlue",
  НейтральноЗеленый: "MediumGreen",
  НейтральноКоричневый: "Peru",
  НейтральноПурпурный: "MediumPurple",
  НейтральноСерый: "MediumGray",
  НейтральноСиний: "MediumBlue",
  НейтральноФиолетовоКрасный: "MediumVioletRed",
  Оливковый: "Olive",
  ОранжевоКрасный: "OrangeRed",
  Оранжевый: "Orange",
  Орхидея: "Orchid",
  ОрхидеяНейтральный: "MediumOrchid",
  ОрхидеяТемный: "DarkOrchid",
  Охра: "Sienna",
  Перламутровый: "SeaShell",
  Персиковый: "PeachPuff",
  ПесочноКоричневый: "SandyBrown",
  ПолночноСиний: "MidnightBlue",
  ПризрачноБелый: "GhostWhite",
  Пурпурный: "Purple",
  Пшеничный: "Wheat",
  РозовоКоричневый: "RosyBrown",
  Розовый: "Pink",
  Роса: "HoneyDew",
  РыжеватоКоричневый: "Tan",
  СветлоГрифельноСерый: "LightSlateGray",
  СветлоГрифельноСиний: "LightSlateBlue",
  СветлоЖелтый: "LightYellow",
  СветлоЖелтыйЗолотистый: "LightGoldenRodYellow",
  СветлоЗеленый: "LightGreen",
  СветлоЗолотистый: "LightGoldenRod",
  СветлоКоралловый: "LightCoral",
  СветлоКоричневый: "Bisque",
  СветлоНебесноГолубой: "LightSkyBlue",
  СветлоРозовый: "LightPink",
  СветлоСерый: "LightGray",
  СеребристоСерый: "Gainsboro",
  Серебряный: "Silver",
  СероСиний: "CadetBlue",
  Серый: "Gray",
  СинеСерый: "DodgerBlue",
  СинеФиолетовый: "BlueViolet",
  Синий: "Blue",
  СинийСоСтальнымОттенком: "SteelBlue",
  СинийСПороховымОттенком: "PowderBlue",
  Сливовый: "Plum",
  СлоноваяКость: "Ivory",
  СтароеКружево: "OldLace",
  ТемноБирюзовый: "DarkTurquoise",
  ТемноБордовый: "Maroon",
  ТемноГрифельноСерый: "DarkSlateGray",
  ТемноГрифельноСиний: "DarkSlateBlue",
  ТемноЗеленый: "DarkGreen",
  ТемноЗолотистый: "DarkGoldenRod",
  ТемноКрасный: "DarkRed",
  ТемноОливковоЗеленый: "DarkOliveGreen",
  ТемноОранжевый: "DarkOrange",
  ТемноСерый: "DarkGray",
  ТемноСиний: "DarkBlue",
  ТемноФиолетовый: "DarkViolet",
  ТеплоРозовый: "HotPink",
  Томатный: "Tomato",
  ТопленоеМолоко: "PapayaWhip",
  ТусклоОливковый: "Olivedrab",
  ТусклоРозовый: "MistyRose",
  ТусклоСерый: "DimGray",
  Ультрамарин: "Navy",
  Фиолетовый: "Violet",
  Фуксин: "Magenta",
  ФуксинТемный: "DarkMagenta",
  Фуксия: "Fuchsia",
  Хаки: "Khaki",
  ХакиТемный: "DarkKhaki",
  ЦветМорскойВолны: "Seagreen",
  ЦветМорскойВолныНейтральный: "MediumSeaGreen",
  ЦветМорскойВолныСветлый: "LightSeaGreen",
  ЦветМорскойВолныТемный: "DarkSeaGreen",
  ЦветокБелый: "FloralWhite",
  Циан: "Cyan",
  ЦианАкварельный: "Aqua",
  ЦианНейтральный: "Teal",
  ЦианСветлый: "LightCyan",
  ЦианТемный: "DarkCyan",
  Черный: "Black",
  ШелковыйОттенок: "CornSilk",
  Шоколадный: "Chocolate",
} as const

export type WebColors = keyof typeof WebColorsToEnterprise
export type WebColorsEnterprise = keyof typeof WebColorsFromEnterprise

export const WindowsColorsToEnterprise = {
  ActiveBorder: "ГраницаАктивногоОкна",
  InactiveBorder: "ГраницаНеактивногоОкна",
  ActiveTitleBar: "ЗаголовокАктивногоОкна",
  InactiveTitleBar: "ЗаголовокНеактивногоОкна",
  ButtonFace: "Кнопка",
  ButtonHighlight: "КнопкаПодсвеченная",
  Highlight: "Подсвеченный",
  ToolTip: "Подсказка",
  ScrollBar: "ПолосаПрокрутки",
  ApplicationWorkspace: "РабочаяОбластьПриложения",
  Desktop: "РабочийСтол",
  WindowFrame: "РамкаОкна",
  MenuBar: "СтрокаМеню",
  ActiveTitleBarText: "ТекстЗаголовкаАктивногоОкна",
  InactiveTitleBarText: "ТекстЗаголовкаНеактивногоОкна",
  ButtonText: "ТекстКнопки",
  DisabledText: "ТекстНедоступный",
  WindowText: "ТекстОкна",
  HighlightText: "ТекстПодсвеченный",
  ToolTipText: "ТекстПодсказки",
  MenuItemText: "ТекстПунктаМеню",
  ButtonShadow: "ТеньКнопки",
  ButtonLightShadow: "ТеньКнопкиСветлая",
  ButtonDarkShadow: "ТеньКнопкиТемная",
  WindowBackground: "ФонОкна",
} as const

export const WindowsColorsFromEnterprise = {
  ГраницаАктивногоОкна: "ActiveBorder",
  ГраницаНеактивногоОкна: "InactiveBorder",
  ЗаголовокАктивногоОкна: "ActiveTitleBar",
  ЗаголовокНеактивногоОкна: "InactiveTitleBar",
  Кнопка: "ButtonFace",
  КнопкаПодсвеченная: "ButtonHighlight",
  Подсвеченный: "Highlight",
  Подсказка: "ToolTip",
  ПолосаПрокрутки: "ScrollBar",
  РабочаяОбластьПриложения: "ApplicationWorkspace",
  РабочийСтол: "Desktop",
  РамкаОкна: "WindowFrame",
  СтрокаМеню: "MenuBar",
  ТекстЗаголовкаАктивногоОкна: "ActiveTitleBarText",
  ТекстЗаголовкаНеактивногоОкна: "InactiveTitleBarText",
  ТекстКнопки: "ButtonText",
  ТекстНедоступный: "DisabledText",
  ТекстОкна: "WindowText",
  ТекстПодсвеченный: "HighlightText",
  ТекстПодсказки: "ToolTipText",
  ТекстПунктаМеню: "MenuItemText",
  ТеньКнопки: "ButtonShadow",
  ТеньКнопкиСветлая: "ButtonLightShadow",
  ТеньКнопкиТемная: "ButtonDarkShadow",
  ФонОкна: "WindowBackground",
} as const

export type WindowsColors = keyof typeof WindowsColorsToEnterprise
export type WindowsColorsEnterprise = keyof typeof WindowsColorsFromEnterprise

export const WindowsFontsToEnterprise = {
  ANSIFixedFont: "ANSIШрифтМоноширинный",
  ANSIVariableFont: "ANSIШрифтПропорциональный",
  OEMFixedFont: "OEMШрифтМоноширинный",
  SystemFont: "СистемныйШрифт",
  DefaultGUIFont: "ШрифтДиалоговИМеню",
} as const

export const WindowsFontsFromEnterprise = {
  ANSIШрифтМоноширинный: "ANSIFixedFont",
  ANSIШрифтПропорциональный: "ANSIVariableFont",
  OEMШрифтМоноширинный: "OEMFixedFont",
  СистемныйШрифт: "SystemFont",
  ШрифтДиалоговИМеню: "DefaultGUIFont",
} as const

export type WindowsFonts = keyof typeof WindowsFontsToEnterprise
export type WindowsFontsEnterprise = keyof typeof WindowsFontsFromEnterprise

// #endregion SystemSets

// #region BinaryDataStorageLocationUse

export const BinaryDataStorageLocationUseToEnterprise = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataStorageLocationUseFromEnterprise = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataStorageLocationUse = keyof typeof BinaryDataStorageLocationUseToEnterprise
export type BinaryDataStorageLocationUseEnterprise = keyof typeof BinaryDataStorageLocationUseFromEnterprise

// #endregion BinaryDataStorageLocationUse

// #region StatePresentation

export const StatePresentationToEnterprise = {
  Visible: "Видимость",
  AdditionalShowMode: "ДополнительныйРежимОтображения",
  Picture: "Картинка",
  Text: "Текст",
} as const

export const StatePresentationFromEnterprise = {
  Видимость: "Visible",
  ДополнительныйРежимОтображения: "AdditionalShowMode",
  Картинка: "Picture",
  Текст: "Text",
} as const

export type StatePresentation = keyof typeof StatePresentationToEnterprise
export type StatePresentationEnterprise = keyof typeof StatePresentationFromEnterprise

// #endregion StatePresentation
