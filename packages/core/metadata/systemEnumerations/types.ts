// #region SystemEnumerations

export const DynamicListSearchStringViewModeToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
  ShowOnUsingFullTextSearch: "ОтображатьПриИспользованииПолнотекстовогоПоиска",
} as const

export const DynamicListSearchStringViewModeFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
  ОтображатьПриИспользованииПолнотекстовогоПоиска: "ShowOnUsingFullTextSearch",
} as const

export type DynamicListSearchStringViewMode = keyof typeof DynamicListSearchStringViewModeToYAML
export type DynamicListSearchStringViewModeYAML = keyof typeof DynamicListSearchStringViewModeFromYAML

export const XDTOFacetTypeToYAML = {
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

export const XDTOFacetTypeFromYAML = {
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

export type XDTOFacetType = keyof typeof XDTOFacetTypeToYAML
export type XDTOFacetTypeYAML = keyof typeof XDTOFacetTypeFromYAML

export const XMLFormToYAML = {
  Attribute: "Атрибут",
  Text: "Текст",
  Element: "Элемент",
} as const

export const XMLFormFromYAML = {
  Атрибут: "Attribute",
  Текст: "Text",
  Элемент: "Element",
} as const

export type XMLForm = keyof typeof XMLFormToYAML
export type XMLFormYAML = keyof typeof XMLFormFromYAML

export const WSParameterDirectionToYAML = {
  In: "Входной",
  InOut: "ВходнойВыходной",
  Out: "Выходной",
} as const

export const WSParameterDirectionFromYAML = {
  Входной: "In",
  ВходнойВыходной: "InOut",
  Выходной: "Out",
} as const

export type WSParameterDirection = keyof typeof WSParameterDirectionToYAML
export type WSParameterDirectionYAML = keyof typeof WSParameterDirectionFromYAML

export const DOMBuilderActionToYAML = {
  InsertBefore: "ВставитьПеред",
  InsertAfter: "ВставитьПосле",
  AppendAsChildren: "ДобавитьКакДочерние",
  Replace: "Заменить",
  ReplaceChildren: "ЗаменитьДочерние",
} as const

export const DOMBuilderActionFromYAML = {
  ВставитьПеред: "InsertBefore",
  ВставитьПосле: "InsertAfter",
  ДобавитьКакДочерние: "AppendAsChildren",
  Заменить: "Replace",
  ЗаменитьДочерние: "ReplaceChildren",
} as const

export type DOMBuilderAction = keyof typeof DOMBuilderActionToYAML
export type DOMBuilderActionYAML = keyof typeof DOMBuilderActionFromYAML

export const DOMDocumentPositionToYAML = {
  ImplementationSpecific: "ЗависитОтРеализации",
  Disconnected: "Отсоединен",
  Preceding: "Предшествует",
  Following: "Следует",
  Contains: "Содержит",
  ContainedBy: "Содержится",
} as const

export const DOMDocumentPositionFromYAML = {
  ЗависитОтРеализации: "ImplementationSpecific",
  Отсоединен: "Disconnected",
  Предшествует: "Preceding",
  Следует: "Following",
  Содержит: "Contains",
  Содержится: "ContainedBy",
} as const

export type DOMDocumentPosition = keyof typeof DOMDocumentPositionToYAML
export type DOMDocumentPositionYAML = keyof typeof DOMDocumentPositionFromYAML

export const DOMNodeFilterParametersToYAML = {
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

export const DOMNodeFilterParametersFromYAML = {
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

export type DOMNodeFilterParameters = keyof typeof DOMNodeFilterParametersToYAML
export type DOMNodeFilterParametersYAML = keyof typeof DOMNodeFilterParametersFromYAML

export const DOMNodeTypeToYAML = {
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

export const DOMNodeTypeFromYAML = {
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

export type DOMNodeType = keyof typeof DOMNodeTypeToYAML
export type DOMNodeTypeYAML = keyof typeof DOMNodeTypeFromYAML

export const DOMXPathResultTypeToYAML = {
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

export const DOMXPathResultTypeFromYAML = {
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

export type DOMXPathResultType = keyof typeof DOMXPathResultTypeToYAML
export type DOMXPathResultTypeYAML = keyof typeof DOMXPathResultTypeFromYAML

export const HTMLContentCategoryToYAML = {
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

export const HTMLContentCategoryFromYAML = {
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

export type HTMLContentCategory = keyof typeof HTMLContentCategoryToYAML
export type HTMLContentCategoryYAML = keyof typeof HTMLContentCategoryFromYAML

export const DataCompositionAccountingBalanceTypeToYAML = {
  Debit: "Дебет",
  Credit: "Кредит",
  None: "Нет",
} as const

export const DataCompositionAccountingBalanceTypeFromYAML = {
  Дебет: "Debit",
  Кредит: "Credit",
  Нет: "None",
} as const

export type DataCompositionAccountingBalanceType = keyof typeof DataCompositionAccountingBalanceTypeToYAML
export type DataCompositionAccountingBalanceTypeYAML = keyof typeof DataCompositionAccountingBalanceTypeFromYAML

export const DataCompositionAreaTemplateTypeToYAML = {
  Header: "Заголовок",
  HierarchicalHeader: "ЗаголовокИерархии",
  OverallHeader: "ОбщийИтогЗаголовок",
  OverallFooter: "ОбщийИтогПодвал",
  Footer: "Подвал",
  HierarchicalFooter: "ПодвалИерархии",
} as const

export const DataCompositionAreaTemplateTypeFromYAML = {
  Заголовок: "Header",
  ЗаголовокИерархии: "HierarchicalHeader",
  ОбщийИтогЗаголовок: "OverallHeader",
  ОбщийИтогПодвал: "OverallFooter",
  Подвал: "Footer",
  ПодвалИерархии: "HierarchicalFooter",
} as const

export type DataCompositionAreaTemplateType = keyof typeof DataCompositionAreaTemplateTypeToYAML
export type DataCompositionAreaTemplateTypeYAML = keyof typeof DataCompositionAreaTemplateTypeFromYAML

export const DataCompositionAttributesPlacementToYAML = {
  Together: "Вместе",
  WithOwnerField: "ВместеСВладельцем",
  SpecialPosition: "ВСпециальнойПозиции",
  Separately: "Отдельно",
} as const

export const DataCompositionAttributesPlacementFromYAML = {
  Вместе: "Together",
  ВместеСВладельцем: "WithOwnerField",
  ВСпециальнойПозиции: "SpecialPosition",
  Отдельно: "Separately",
} as const

export type DataCompositionAttributesPlacement = keyof typeof DataCompositionAttributesPlacementToYAML
export type DataCompositionAttributesPlacementYAML = keyof typeof DataCompositionAttributesPlacementFromYAML

export const DataCompositionBalanceTypeToYAML = {
  ClosingBalance: "КонечныйОстаток",
  OpeningBalance: "НачальныйОстаток",
  None: "Нет",
} as const

export const DataCompositionBalanceTypeFromYAML = {
  КонечныйОстаток: "ClosingBalance",
  НачальныйОстаток: "OpeningBalance",
  Нет: "None",
} as const

export type DataCompositionBalanceType = keyof typeof DataCompositionBalanceTypeToYAML
export type DataCompositionBalanceTypeYAML = keyof typeof DataCompositionBalanceTypeFromYAML

export const DataCompositionChartLegendPlacementToYAML = {
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const DataCompositionChartLegendPlacementFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type DataCompositionChartLegendPlacement = keyof typeof DataCompositionChartLegendPlacementToYAML
export type DataCompositionChartLegendPlacementYAML = keyof typeof DataCompositionChartLegendPlacementFromYAML

export const DataCompositionComparisonTypeToYAML = {
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

export const DataCompositionComparisonTypeFromYAML = {
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

export type DataCompositionComparisonType = keyof typeof DataCompositionComparisonTypeToYAML
export type DataCompositionComparisonTypeYAML = keyof typeof DataCompositionComparisonTypeFromYAML

export const DataCompositionConditionalAppearanceUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DataCompositionConditionalAppearanceUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DataCompositionConditionalAppearanceUse = keyof typeof DataCompositionConditionalAppearanceUseToYAML
export type DataCompositionConditionalAppearanceUseYAML = keyof typeof DataCompositionConditionalAppearanceUseFromYAML

export const DataCompositionDataSetsLinkTypeToYAML = {
  Outer: "Внешняя",
  Inner: "Внутренняя",
} as const

export const DataCompositionDataSetsLinkTypeFromYAML = {
  Внешняя: "Outer",
  Внутренняя: "Inner",
} as const

export type DataCompositionDataSetsLinkType = keyof typeof DataCompositionDataSetsLinkTypeToYAML
export type DataCompositionDataSetsLinkTypeYAML = keyof typeof DataCompositionDataSetsLinkTypeFromYAML

export const DataCompositionDetailsProcessingActionToYAML = {
  None: "Нет",
  OpenValue: "ОткрытьЗначение",
  Filter: "Отфильтровать",
  ApplyAppearance: "Оформить",
  DrillDown: "Расшифровать",
  Group: "Сгруппировать",
  Order: "Упорядочить",
} as const

export const DataCompositionDetailsProcessingActionFromYAML = {
  Нет: "None",
  ОткрытьЗначение: "OpenValue",
  Отфильтровать: "Filter",
  Оформить: "ApplyAppearance",
  Расшифровать: "DrillDown",
  Сгруппировать: "Group",
  Упорядочить: "Order",
} as const

export type DataCompositionDetailsProcessingAction = keyof typeof DataCompositionDetailsProcessingActionToYAML
export type DataCompositionDetailsProcessingActionYAML = keyof typeof DataCompositionDetailsProcessingActionFromYAML

export const DataCompositionFieldPlacementToYAML = {
  Auto: "Авто",
  Vertically: "Вертикально",
  Together: "Вместе",
  Horizontally: "Горизонтально",
  SpecialColumn: "ОтдельнаяКолонка",
} as const

export const DataCompositionFieldPlacementFromYAML = {
  Авто: "Auto",
  Вертикально: "Vertically",
  Вместе: "Together",
  Горизонтально: "Horizontally",
  ОтдельнаяКолонка: "SpecialColumn",
} as const

export type DataCompositionFieldPlacement = keyof typeof DataCompositionFieldPlacementToYAML
export type DataCompositionFieldPlacementYAML = keyof typeof DataCompositionFieldPlacementFromYAML

export const DataCompositionFieldsTitleTypeToYAML = {
  Auto: "Авто",
  Short: "Краткий",
  Full: "Полный",
} as const

export const DataCompositionFieldsTitleTypeFromYAML = {
  Авто: "Auto",
  Краткий: "Short",
  Полный: "Full",
} as const

export type DataCompositionFieldsTitleType = keyof typeof DataCompositionFieldsTitleTypeToYAML
export type DataCompositionFieldsTitleTypeYAML = keyof typeof DataCompositionFieldsTitleTypeFromYAML

export const DataCompositionFilterApplicationTypeToYAML = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const DataCompositionFilterApplicationTypeFromYAML = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type DataCompositionFilterApplicationType = keyof typeof DataCompositionFilterApplicationTypeToYAML
export type DataCompositionFilterApplicationTypeYAML = keyof typeof DataCompositionFilterApplicationTypeFromYAML

export const DataCompositionFilterItemsGroupTypeToYAML = {
  AndGroup: "ГруппаИ",
  OrGroup: "ГруппаИли",
  NotGroup: "ГруппаНе",
} as const

export const DataCompositionFilterItemsGroupTypeFromYAML = {
  ГруппаИ: "AndGroup",
  ГруппаИли: "OrGroup",
  ГруппаНе: "NotGroup",
} as const

export type DataCompositionFilterItemsGroupType = keyof typeof DataCompositionFilterItemsGroupTypeToYAML
export type DataCompositionFilterItemsGroupTypeYAML = keyof typeof DataCompositionFilterItemsGroupTypeFromYAML

export const DataCompositionFixationToYAML = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const DataCompositionFixationFromYAML = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type DataCompositionFixation = keyof typeof DataCompositionFixationToYAML
export type DataCompositionFixationYAML = keyof typeof DataCompositionFixationFromYAML

export const DataCompositionGroupFieldsPlacementToYAML = {
  Together: "Вместе",
  Separately: "Отдельно",
  SeparatelyAndInTotalsOnly: "ОтдельноИТолькоВИтогах",
} as const

export const DataCompositionGroupFieldsPlacementFromYAML = {
  Вместе: "Together",
  Отдельно: "Separately",
  ОтдельноИТолькоВИтогах: "SeparatelyAndInTotalsOnly",
} as const

export type DataCompositionGroupFieldsPlacement = keyof typeof DataCompositionGroupFieldsPlacementToYAML
export type DataCompositionGroupFieldsPlacementYAML = keyof typeof DataCompositionGroupFieldsPlacementFromYAML

export const DataCompositionGroupPlacementToYAML = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
  None: "Нет",
} as const

export const DataCompositionGroupPlacementFromYAML = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
  Нет: "None",
} as const

export type DataCompositionGroupPlacement = keyof typeof DataCompositionGroupPlacementToYAML
export type DataCompositionGroupPlacementYAML = keyof typeof DataCompositionGroupPlacementFromYAML

export const DataCompositionGroupTemplateTypeToYAML = {
  Auto: "Авто",
  Vertical: "Вертикальный",
  Horizontal: "Горизонтальный",
} as const

export const DataCompositionGroupTemplateTypeFromYAML = {
  Авто: "Auto",
  Вертикальный: "Vertical",
  Горизонтальный: "Horizontal",
} as const

export type DataCompositionGroupTemplateType = keyof typeof DataCompositionGroupTemplateTypeToYAML
export type DataCompositionGroupTemplateTypeYAML = keyof typeof DataCompositionGroupTemplateTypeFromYAML

export const DataCompositionGroupTypeToYAML = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const DataCompositionGroupTypeFromYAML = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type DataCompositionGroupType = keyof typeof DataCompositionGroupTypeToYAML
export type DataCompositionGroupTypeYAML = keyof typeof DataCompositionGroupTypeFromYAML

export const DataCompositionGroupUseVariantToYAML = {
  Auto: "Авто",
  AdditionalInformation: "ДополнительнаяИнформация",
} as const

export const DataCompositionGroupUseVariantFromYAML = {
  Авто: "Auto",
  ДополнительнаяИнформация: "AdditionalInformation",
} as const

export type DataCompositionGroupUseVariant = keyof typeof DataCompositionGroupUseVariantToYAML
export type DataCompositionGroupUseVariantYAML = keyof typeof DataCompositionGroupUseVariantFromYAML

export const DataCompositionParameterUseToYAML = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const DataCompositionParameterUseFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type DataCompositionParameterUse = keyof typeof DataCompositionParameterUseToYAML
export type DataCompositionParameterUseYAML = keyof typeof DataCompositionParameterUseFromYAML

export const DataCompositionPeriodAdditionTypeToYAML = {
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

export const DataCompositionPeriodAdditionTypeFromYAML = {
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

export type DataCompositionPeriodAdditionType = keyof typeof DataCompositionPeriodAdditionTypeToYAML
export type DataCompositionPeriodAdditionTypeYAML = keyof typeof DataCompositionPeriodAdditionTypeFromYAML

export const DataCompositionPeriodTypeToYAML = {
  Additional: "Дополнительный",
  Main: "Основной",
} as const

export const DataCompositionPeriodTypeFromYAML = {
  Дополнительный: "Additional",
  Основной: "Main",
} as const

export type DataCompositionPeriodType = keyof typeof DataCompositionPeriodTypeToYAML
export type DataCompositionPeriodTypeYAML = keyof typeof DataCompositionPeriodTypeFromYAML

export const DataCompositionPictureOutputTypeToYAML = {
  Auto: "Авто",
  OutputByValue: "ВыводитьПоЗначению",
  OutputByRef: "ВыводитьПоСсылке",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionPictureOutputTypeFromYAML = {
  Авто: "Auto",
  ВыводитьПоЗначению: "OutputByValue",
  ВыводитьПоСсылке: "OutputByRef",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionPictureOutputType = keyof typeof DataCompositionPictureOutputTypeToYAML
export type DataCompositionPictureOutputTypeYAML = keyof typeof DataCompositionPictureOutputTypeFromYAML

export const DataCompositionResourcesAutoPositionToYAML = {
  DontUse: "НеИспользовать",
  AfterAllFields: "ПослеВсехПолей",
} as const

export const DataCompositionResourcesAutoPositionFromYAML = {
  НеИспользовать: "DontUse",
  ПослеВсехПолей: "AfterAllFields",
} as const

export type DataCompositionResourcesAutoPosition = keyof typeof DataCompositionResourcesAutoPositionToYAML
export type DataCompositionResourcesAutoPositionYAML = keyof typeof DataCompositionResourcesAutoPositionFromYAML

export const DataCompositionResourcesPlacementToYAML = {
  Vertically: "Вертикально",
  Horizontally: "Горизонтально",
} as const

export const DataCompositionResourcesPlacementFromYAML = {
  Вертикально: "Vertically",
  Горизонтально: "Horizontally",
} as const

export type DataCompositionResourcesPlacement = keyof typeof DataCompositionResourcesPlacementToYAML
export type DataCompositionResourcesPlacementYAML = keyof typeof DataCompositionResourcesPlacementFromYAML

export const DataCompositionResourcesPlacementInChartToYAML = {
  Auto: "Авто",
  Series: "Серии",
  Points: "Точки",
} as const

export const DataCompositionResourcesPlacementInChartFromYAML = {
  Авто: "Auto",
  Серии: "Series",
  Точки: "Points",
} as const

export type DataCompositionResourcesPlacementInChart = keyof typeof DataCompositionResourcesPlacementInChartToYAML
export type DataCompositionResourcesPlacementInChartYAML = keyof typeof DataCompositionResourcesPlacementInChartFromYAML

export const DataCompositionResultItemTypeToYAML = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
} as const

export const DataCompositionResultItemTypeFromYAML = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
} as const

export type DataCompositionResultItemType = keyof typeof DataCompositionResultItemTypeToYAML
export type DataCompositionResultItemTypeYAML = keyof typeof DataCompositionResultItemTypeFromYAML

export const DataCompositionResultNestedItemsLayoutToYAML = {
  Vertically: "Вертикально",
  Horizontally: "Горизонтально",
} as const

export const DataCompositionResultNestedItemsLayoutFromYAML = {
  Вертикально: "Vertically",
  Горизонтально: "Horizontally",
} as const

export type DataCompositionResultNestedItemsLayout = keyof typeof DataCompositionResultNestedItemsLayoutToYAML
export type DataCompositionResultNestedItemsLayoutYAML = keyof typeof DataCompositionResultNestedItemsLayoutFromYAML

export const DataCompositionSettingsItemStateToYAML = {
  Enabled: "Включен",
  Disabled: "Отключен",
  DeletedByUser: "УдаленПользователем",
} as const

export const DataCompositionSettingsItemStateFromYAML = {
  Включен: "Enabled",
  Отключен: "Disabled",
  УдаленПользователем: "DeletedByUser",
} as const

export type DataCompositionSettingsItemState = keyof typeof DataCompositionSettingsItemStateToYAML
export type DataCompositionSettingsItemStateYAML = keyof typeof DataCompositionSettingsItemStateFromYAML

export const DataCompositionSettingsItemViewModeToYAML = {
  Auto: "Авто",
  QuickAccess: "БыстрыйДоступ",
  Inaccessible: "Недоступный",
  Normal: "Обычный",
} as const

export const DataCompositionSettingsItemViewModeFromYAML = {
  Авто: "Auto",
  БыстрыйДоступ: "QuickAccess",
  Недоступный: "Inaccessible",
  Обычный: "Normal",
} as const

export type DataCompositionSettingsItemViewMode = keyof typeof DataCompositionSettingsItemViewModeToYAML
export type DataCompositionSettingsItemViewModeYAML = keyof typeof DataCompositionSettingsItemViewModeFromYAML

export const DataCompositionSettingsRefreshMethodToYAML = {
  Full: "Полное",
  CheckAvailability: "ПроверятьДоступность",
} as const

export const DataCompositionSettingsRefreshMethodFromYAML = {
  Полное: "Full",
  ПроверятьДоступность: "CheckAvailability",
} as const

export type DataCompositionSettingsRefreshMethod = keyof typeof DataCompositionSettingsRefreshMethodToYAML
export type DataCompositionSettingsRefreshMethodYAML = keyof typeof DataCompositionSettingsRefreshMethodFromYAML

export const DataCompositionSettingsViewModeToYAML = {
  QuickAccess: "БыстрыйДоступ",
  All: "Все",
} as const

export const DataCompositionSettingsViewModeFromYAML = {
  БыстрыйДоступ: "QuickAccess",
  Все: "All",
} as const

export type DataCompositionSettingsViewMode = keyof typeof DataCompositionSettingsViewModeToYAML
export type DataCompositionSettingsViewModeYAML = keyof typeof DataCompositionSettingsViewModeFromYAML

export const DataCompositionSortDirectionToYAML = {
  Asc: "Возр",
  Desc: "Убыв",
} as const

export const DataCompositionSortDirectionFromYAML = {
  Возр: "Asc",
  Убыв: "Desc",
} as const

export type DataCompositionSortDirection = keyof typeof DataCompositionSortDirectionToYAML
export type DataCompositionSortDirectionYAML = keyof typeof DataCompositionSortDirectionFromYAML

export const DataCompositionTextOutputTypeToYAML = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionTextOutputTypeFromYAML = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionTextOutputType = keyof typeof DataCompositionTextOutputTypeToYAML
export type DataCompositionTextOutputTypeYAML = keyof typeof DataCompositionTextOutputTypeFromYAML

export const DataCompositionTextPlacementTypeToYAML = {
  Overflow: "Выступать",
  Block: "Забивать",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const DataCompositionTextPlacementTypeFromYAML = {
  Выступать: "Overflow",
  Забивать: "Block",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type DataCompositionTextPlacementType = keyof typeof DataCompositionTextPlacementTypeToYAML
export type DataCompositionTextPlacementTypeYAML = keyof typeof DataCompositionTextPlacementTypeFromYAML

export const DataCompositionTotalPlacementToYAML = {
  Auto: "Авто",
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
  None: "Нет",
} as const

export const DataCompositionTotalPlacementFromYAML = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
  Нет: "None",
} as const

export type DataCompositionTotalPlacement = keyof typeof DataCompositionTotalPlacementToYAML
export type DataCompositionTotalPlacementYAML = keyof typeof DataCompositionTotalPlacementFromYAML

export const OnUnavailabilityDataCompositionSettingsActionToYAML = {
  DisableControl: "ИзменятьДоступностьПоля",
  HidePage: "СкрыватьСтраницу",
} as const

export const OnUnavailabilityDataCompositionSettingsActionFromYAML = {
  ИзменятьДоступностьПоля: "DisableControl",
  СкрыватьСтраницу: "HidePage",
} as const

export type OnUnavailabilityDataCompositionSettingsAction =
  keyof typeof OnUnavailabilityDataCompositionSettingsActionToYAML
export type OnUnavailabilityDataCompositionSettingsActionYAML =
  keyof typeof OnUnavailabilityDataCompositionSettingsActionFromYAML

export const ResultCompositionModeToYAML = {
  Auto: "Авто",
  Directly: "Непосредственно",
  Background: "Фоновый",
} as const

export const ResultCompositionModeFromYAML = {
  Авто: "Auto",
  Непосредственно: "Directly",
  Фоновый: "Background",
} as const

export type ResultCompositionMode = keyof typeof ResultCompositionModeToYAML
export type ResultCompositionModeYAML = keyof typeof ResultCompositionModeFromYAML

export const SaveDataCompositionAppearanceToYAML = {
  Auto: "Авто",
  ForUser: "ДляПользователя",
  ForCurrentResult: "ДляТекущегоРезультата",
  DontUse: "НеИспользовать",
  ByKeyForUser: "ПоКлючуДляПользователя",
} as const

export const SaveDataCompositionAppearanceFromYAML = {
  Авто: "Auto",
  ДляПользователя: "ForUser",
  ДляТекущегоРезультата: "ForCurrentResult",
  НеИспользовать: "DontUse",
  ПоКлючуДляПользователя: "ByKeyForUser",
} as const

export type SaveDataCompositionAppearance = keyof typeof SaveDataCompositionAppearanceToYAML
export type SaveDataCompositionAppearanceYAML = keyof typeof SaveDataCompositionAppearanceFromYAML

export const XSAttributeUseCategoryToYAML = {
  Prohibited: "Запрещено",
  Optional: "Необязательно",
  Required: "Обязательно",
} as const

export const XSAttributeUseCategoryFromYAML = {
  Запрещено: "Prohibited",
  Необязательно: "Optional",
  Обязательно: "Required",
} as const

export type XSAttributeUseCategory = keyof typeof XSAttributeUseCategoryToYAML
export type XSAttributeUseCategoryYAML = keyof typeof XSAttributeUseCategoryFromYAML

export const XSComplexFinalToYAML = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSComplexFinalFromYAML = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSComplexFinal = keyof typeof XSComplexFinalToYAML
export type XSComplexFinalYAML = keyof typeof XSComplexFinalFromYAML

export const XSComponentTypeToYAML = {
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

export const XSComponentTypeFromYAML = {
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

export type XSComponentType = keyof typeof XSComponentTypeToYAML
export type XSComponentTypeYAML = keyof typeof XSComponentTypeFromYAML

export const XSCompositorToYAML = {
  All: "Все",
  Choice: "Выбор",
  Sequence: "Последовательность",
} as const

export const XSCompositorFromYAML = {
  Все: "All",
  Выбор: "Choice",
  Последовательность: "Sequence",
} as const

export type XSCompositor = keyof typeof XSCompositorToYAML
export type XSCompositorYAML = keyof typeof XSCompositorFromYAML

export const XSConstraintToYAML = {
  Default: "ПоУмолчанию",
  Fixed: "Фиксированное",
} as const

export const XSConstraintFromYAML = {
  ПоУмолчанию: "Default",
  Фиксированное: "Fixed",
} as const

export type XSConstraint = keyof typeof XSConstraintToYAML
export type XSConstraintYAML = keyof typeof XSConstraintFromYAML

export const XSContentModelToYAML = {
  Simple: "Простая",
  Complex: "Составная",
} as const

export const XSContentModelFromYAML = {
  Простая: "Simple",
  Составная: "Complex",
} as const

export type XSContentModel = keyof typeof XSContentModelToYAML
export type XSContentModelYAML = keyof typeof XSContentModelFromYAML

export const XSDerivationMethodToYAML = {
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSDerivationMethodFromYAML = {
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSDerivationMethod = keyof typeof XSDerivationMethodToYAML
export type XSDerivationMethodYAML = keyof typeof XSDerivationMethodFromYAML

export const XSDisallowedSubstitutionsToYAML = {
  All: "Все",
  Restriction: "Ограничение",
  Substitution: "Подстановка",
  Extension: "Расширение",
} as const

export const XSDisallowedSubstitutionsFromYAML = {
  Все: "All",
  Ограничение: "Restriction",
  Подстановка: "Substitution",
  Расширение: "Extension",
} as const

export type XSDisallowedSubstitutions = keyof typeof XSDisallowedSubstitutionsToYAML
export type XSDisallowedSubstitutionsYAML = keyof typeof XSDisallowedSubstitutionsFromYAML

export const XSFormToYAML = {
  Qualified: "Квалифицированная",
  Unqualified: "Неквалифицированная",
} as const

export const XSFormFromYAML = {
  Квалифицированная: "Qualified",
  Неквалифицированная: "Unqualified",
} as const

export type XSForm = keyof typeof XSFormToYAML
export type XSFormYAML = keyof typeof XSFormFromYAML

export const XSIdentityConstraintCategoryToYAML = {
  Key: "Ключ",
  KeyRef: "СсылкаНаКлюч",
  Unique: "Уникальность",
} as const

export const XSIdentityConstraintCategoryFromYAML = {
  Ключ: "Key",
  СсылкаНаКлюч: "KeyRef",
  Уникальность: "Unique",
} as const

export type XSIdentityConstraintCategory = keyof typeof XSIdentityConstraintCategoryToYAML
export type XSIdentityConstraintCategoryYAML = keyof typeof XSIdentityConstraintCategoryFromYAML

export const XSNamespaceConstraintCategoryToYAML = {
  Not: "Кроме",
  Any: "Любое",
  Set: "Набор",
} as const

export const XSNamespaceConstraintCategoryFromYAML = {
  Кроме: "Not",
  Любое: "Any",
  Набор: "Set",
} as const

export type XSNamespaceConstraintCategory = keyof typeof XSNamespaceConstraintCategoryToYAML
export type XSNamespaceConstraintCategoryYAML = keyof typeof XSNamespaceConstraintCategoryFromYAML

export const XSProcessContentsToYAML = {
  Skip: "Пропустить",
  Lax: "Слабая",
  Strict: "Строгая",
} as const

export const XSProcessContentsFromYAML = {
  Пропустить: "Skip",
  Слабая: "Lax",
  Строгая: "Strict",
} as const

export type XSProcessContents = keyof typeof XSProcessContentsToYAML
export type XSProcessContentsYAML = keyof typeof XSProcessContentsFromYAML

export const XSProhibitedSubstitutionsToYAML = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSProhibitedSubstitutionsFromYAML = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSProhibitedSubstitutions = keyof typeof XSProhibitedSubstitutionsToYAML
export type XSProhibitedSubstitutionsYAML = keyof typeof XSProhibitedSubstitutionsFromYAML

export const XSSchemaFinalToYAML = {
  All: "Все",
  Union: "Объединение",
  Restriction: "Ограничение",
  Extension: "Расширение",
  List: "Список",
} as const

export const XSSchemaFinalFromYAML = {
  Все: "All",
  Объединение: "Union",
  Ограничение: "Restriction",
  Расширение: "Extension",
  Список: "List",
} as const

export type XSSchemaFinal = keyof typeof XSSchemaFinalToYAML
export type XSSchemaFinalYAML = keyof typeof XSSchemaFinalFromYAML

export const XSSimpleFinalToYAML = {
  All: "Все",
  Union: "Объединение",
  Restriction: "Ограничение",
  List: "Список",
} as const

export const XSSimpleFinalFromYAML = {
  Все: "All",
  Объединение: "Union",
  Ограничение: "Restriction",
  Список: "List",
} as const

export type XSSimpleFinal = keyof typeof XSSimpleFinalToYAML
export type XSSimpleFinalYAML = keyof typeof XSSimpleFinalFromYAML

export const XSSimpleTypeVarietyToYAML = {
  Atomic: "Атомарная",
  Union: "Объединение",
  List: "Список",
} as const

export const XSSimpleTypeVarietyFromYAML = {
  Атомарная: "Atomic",
  Объединение: "Union",
  Список: "List",
} as const

export type XSSimpleTypeVariety = keyof typeof XSSimpleTypeVarietyToYAML
export type XSSimpleTypeVarietyYAML = keyof typeof XSSimpleTypeVarietyFromYAML

export const XSSubstitutionGroupExclusionsToYAML = {
  All: "Все",
  Restriction: "Ограничение",
  Extension: "Расширение",
} as const

export const XSSubstitutionGroupExclusionsFromYAML = {
  Все: "All",
  Ограничение: "Restriction",
  Расширение: "Extension",
} as const

export type XSSubstitutionGroupExclusions = keyof typeof XSSubstitutionGroupExclusionsToYAML
export type XSSubstitutionGroupExclusionsYAML = keyof typeof XSSubstitutionGroupExclusionsFromYAML

export const XSWhitespaceHandlingToYAML = {
  Replace: "Заменять",
  Collapse: "Сворачивать",
  Preserve: "Сохранять",
} as const

export const XSWhitespaceHandlingFromYAML = {
  Заменять: "Replace",
  Сворачивать: "Collapse",
  Сохранять: "Preserve",
} as const

export type XSWhitespaceHandling = keyof typeof XSWhitespaceHandlingToYAML
export type XSWhitespaceHandlingYAML = keyof typeof XSWhitespaceHandlingFromYAML

export const XSXPathVarietyToYAML = {
  Field: "Поле",
  Selector: "Селектор",
} as const

export const XSXPathVarietyFromYAML = {
  Поле: "Field",
  Селектор: "Selector",
} as const

export type XSXPathVariety = keyof typeof XSXPathVarietyToYAML
export type XSXPathVarietyYAML = keyof typeof XSXPathVarietyFromYAML

export const EventLogDataStorageSplitPeriodToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Week: "Неделя",
  DontUse: "НеИспользовать",
  Hour: "Час",
} as const

export const EventLogDataStorageSplitPeriodFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Неделя: "Week",
  НеИспользовать: "DontUse",
  Час: "Hour",
} as const

export type EventLogDataStorageSplitPeriod = keyof typeof EventLogDataStorageSplitPeriodToYAML
export type EventLogDataStorageSplitPeriodYAML = keyof typeof EventLogDataStorageSplitPeriodFromYAML

export const EventLogEntryTransactionModeToYAML = {
  Independent: "Независимая",
  Transactional: "Транзакционная",
} as const

export const EventLogEntryTransactionModeFromYAML = {
  Независимая: "Independent",
  Транзакционная: "Transactional",
} as const

export type EventLogEntryTransactionMode = keyof typeof EventLogEntryTransactionModeToYAML
export type EventLogEntryTransactionModeYAML = keyof typeof EventLogEntryTransactionModeFromYAML

export const EventLogEntryTransactionStatusToYAML = {
  Committed: "Зафиксирована",
  Unfinished: "НеЗавершена",
  NotApplicable: "НетТранзакции",
  RolledBack: "Отменена",
} as const

export const EventLogEntryTransactionStatusFromYAML = {
  Зафиксирована: "Committed",
  НеЗавершена: "Unfinished",
  НетТранзакции: "NotApplicable",
  Отменена: "RolledBack",
} as const

export type EventLogEntryTransactionStatus = keyof typeof EventLogEntryTransactionStatusToYAML
export type EventLogEntryTransactionStatusYAML = keyof typeof EventLogEntryTransactionStatusFromYAML

export const EventLogLevelToYAML = {
  Information: "Информация",
  Error: "Ошибка",
  Warning: "Предупреждение",
  Note: "Примечание",
} as const

export const EventLogLevelFromYAML = {
  Информация: "Information",
  Ошибка: "Error",
  Предупреждение: "Warning",
  Примечание: "Note",
} as const

export type EventLogLevel = keyof typeof EventLogLevelToYAML
export type EventLogLevelYAML = keyof typeof EventLogLevelFromYAML

export const DataLockControlModeToYAML = {
  Automatic: "Автоматический",
  Managed: "Управляемый",
} as const

export const DataLockControlModeFromYAML = {
  Автоматический: "Automatic",
  Управляемый: "Managed",
} as const

export type DataLockControlMode = keyof typeof DataLockControlModeToYAML
export type DataLockControlModeYAML = keyof typeof DataLockControlModeFromYAML

export const DataLockModeToYAML = {
  Exclusive: "Исключительный",
  Shared: "Разделяемый",
} as const

export const DataLockModeFromYAML = {
  Исключительный: "Exclusive",
  Разделяемый: "Shared",
} as const

export type DataLockMode = keyof typeof DataLockModeToYAML
export type DataLockModeYAML = keyof typeof DataLockModeFromYAML

export const AccountTypeToYAML = {
  ActivePassive: "АктивноПассивный",
  Active: "Активный",
  Passive: "Пассивный",
} as const

export const AccountTypeFromYAML = {
  АктивноПассивный: "ActivePassive",
  Активный: "Active",
  Пассивный: "Passive",
} as const

export type AccountType = keyof typeof AccountTypeToYAML
export type AccountTypeYAML = keyof typeof AccountTypeFromYAML

export const AccountingRecordTypeToYAML = {
  Debit: "Дебет",
  Credit: "Кредит",
} as const

export const AccountingRecordTypeFromYAML = {
  Дебет: "Debit",
  Кредит: "Credit",
} as const

export type AccountingRecordType = keyof typeof AccountingRecordTypeToYAML
export type AccountingRecordTypeYAML = keyof typeof AccountingRecordTypeFromYAML

export const AccumulationRecordTypeToYAML = {
  Receipt: "Приход",
  Expense: "Расход",
} as const

export const AccumulationRecordTypeFromYAML = {
  Приход: "Receipt",
  Расход: "Expense",
} as const

export type AccumulationRecordType = keyof typeof AccumulationRecordTypeToYAML
export type AccumulationRecordTypeYAML = keyof typeof AccumulationRecordTypeFromYAML

export const AccumulationRegisterAggregatePeriodicityToYAML = {
  Auto: "Авто",
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
  HalfYear: "Полугодие",
} as const

export const AccumulationRegisterAggregatePeriodicityFromYAML = {
  Авто: "Auto",
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
  Полугодие: "HalfYear",
} as const

export type AccumulationRegisterAggregatePeriodicity = keyof typeof AccumulationRegisterAggregatePeriodicityToYAML
export type AccumulationRegisterAggregatePeriodicityYAML = keyof typeof AccumulationRegisterAggregatePeriodicityFromYAML

export const AccumulationRegisterAggregateUseToYAML = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const AccumulationRegisterAggregateUseFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type AccumulationRegisterAggregateUse = keyof typeof AccumulationRegisterAggregateUseToYAML
export type AccumulationRegisterAggregateUseYAML = keyof typeof AccumulationRegisterAggregateUseFromYAML

export const AutoTimeModeToYAML = {
  DontUse: "НеИспользовать",
  First: "Первым",
  Last: "Последним",
  CurrentOrFirst: "ТекущееИлиПервым",
  CurrentOrLast: "ТекущееИлиПоследним",
} as const

export const AutoTimeModeFromYAML = {
  НеИспользовать: "DontUse",
  Первым: "First",
  Последним: "Last",
  ТекущееИлиПервым: "CurrentOrFirst",
  ТекущееИлиПоследним: "CurrentOrLast",
} as const

export type AutoTimeMode = keyof typeof AutoTimeModeToYAML
export type AutoTimeModeYAML = keyof typeof AutoTimeModeFromYAML

export const BusinessProcessRoutePointTypeToYAML = {
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

export const BusinessProcessRoutePointTypeFromYAML = {
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

export type BusinessProcessRoutePointType = keyof typeof BusinessProcessRoutePointTypeToYAML
export type BusinessProcessRoutePointTypeYAML = keyof typeof BusinessProcessRoutePointTypeFromYAML

export const CalculationRegisterPeriodTypeToYAML = {
  BasePeriod: "БазовыйПериод",
  ActionPeriod: "ПериодДействия",
  RegistrationPeriod: "ПериодРегистрации",
  ActualActionPeriod: "ФактическийПериодДействия",
} as const

export const CalculationRegisterPeriodTypeFromYAML = {
  БазовыйПериод: "BasePeriod",
  ПериодДействия: "ActionPeriod",
  ПериодРегистрации: "RegistrationPeriod",
  ФактическийПериодДействия: "ActualActionPeriod",
} as const

export type CalculationRegisterPeriodType = keyof typeof CalculationRegisterPeriodTypeToYAML
export type CalculationRegisterPeriodTypeYAML = keyof typeof CalculationRegisterPeriodTypeFromYAML

export const DocumentPostingModeToYAML = {
  Regular: "Неоперативный",
  RealTime: "Оперативный",
} as const

export const DocumentPostingModeFromYAML = {
  Неоперативный: "Regular",
  Оперативный: "RealTime",
} as const

export type DocumentPostingMode = keyof typeof DocumentPostingModeToYAML
export type DocumentPostingModeYAML = keyof typeof DocumentPostingModeFromYAML

export const DocumentWriteModeToYAML = {
  Write: "Запись",
  UndoPosting: "ОтменаПроведения",
  Posting: "Проведение",
} as const

export const DocumentWriteModeFromYAML = {
  Запись: "Write",
  ОтменаПроведения: "UndoPosting",
  Проведение: "Posting",
} as const

export type DocumentWriteMode = keyof typeof DocumentWriteModeToYAML
export type DocumentWriteModeYAML = keyof typeof DocumentWriteModeFromYAML

export const FoldersAndItemsUseToYAML = {
  Folders: "Группы",
  FoldersAndItems: "ГруппыИЭлементы",
  Items: "Элементы",
} as const

export const FoldersAndItemsUseFromYAML = {
  Группы: "Folders",
  ГруппыИЭлементы: "FoldersAndItems",
  Элементы: "Items",
} as const

export type FoldersAndItemsUse = keyof typeof FoldersAndItemsUseToYAML
export type FoldersAndItemsUseYAML = keyof typeof FoldersAndItemsUseFromYAML

export const PostingModeUseToYAML = {
  Auto: "Авто",
  Regular: "Неоперативный",
  RealTime: "Оперативный",
} as const

export const PostingModeUseFromYAML = {
  Авто: "Auto",
  Неоперативный: "Regular",
  Оперативный: "RealTime",
} as const

export type PostingModeUse = keyof typeof PostingModeUseToYAML
export type PostingModeUseYAML = keyof typeof PostingModeUseFromYAML

export const SliceUseToYAML = {
  DontUse: "НеИспользовать",
  First: "Первые",
  Last: "Последние",
} as const

export const SliceUseFromYAML = {
  НеИспользовать: "DontUse",
  Первые: "First",
  Последние: "Last",
} as const

export type SliceUse = keyof typeof SliceUseToYAML
export type SliceUseYAML = keyof typeof SliceUseFromYAML

export const BackgroundJobStateToYAML = {
  Active: "Активно",
  Completed: "Завершено",
  Failed: "ЗавершеноАварийно",
  Canceled: "Отменено",
} as const

export const BackgroundJobStateFromYAML = {
  Активно: "Active",
  Завершено: "Completed",
  ЗавершеноАварийно: "Failed",
  Отменено: "Canceled",
} as const

export type BackgroundJobState = keyof typeof BackgroundJobStateToYAML
export type BackgroundJobStateYAML = keyof typeof BackgroundJobStateFromYAML

export const CryptoCertificateCheckModeToYAML = {
  IgnoreTimeValidity: "ИгнорироватьВремяДействия",
  IgnoreSignatureValidity: "ИгнорироватьДействительностьПодписи",
  IgnoreCertificateRevocationStatus: "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов",
  AllowTestCertificates: "РазрешитьТестовыеСертификаты",
} as const

export const CryptoCertificateCheckModeFromYAML = {
  ИгнорироватьВремяДействия: "IgnoreTimeValidity",
  ИгнорироватьДействительностьПодписи: "IgnoreSignatureValidity",
  ИгнорироватьПроверкуВСпискеОтозванныхСертификатов: "IgnoreCertificateRevocationStatus",
  РазрешитьТестовыеСертификаты: "AllowTestCertificates",
} as const

export type CryptoCertificateCheckMode = keyof typeof CryptoCertificateCheckModeToYAML
export type CryptoCertificateCheckModeYAML = keyof typeof CryptoCertificateCheckModeFromYAML

export const CryptoCertificateIncludeModeToYAML = {
  IncludeWholeChain: "ВключатьПолнуюЦепочку",
  IncludeSubjectCertificate: "ВключатьСертификатСубъекта",
  IncludeChainWithoutRoot: "ВключатьЦепочкуБезКорневого",
  DontInclude: "НеВключать",
} as const

export const CryptoCertificateIncludeModeFromYAML = {
  ВключатьПолнуюЦепочку: "IncludeWholeChain",
  ВключатьСертификатСубъекта: "IncludeSubjectCertificate",
  ВключатьЦепочкуБезКорневого: "IncludeChainWithoutRoot",
  НеВключать: "DontInclude",
} as const

export type CryptoCertificateIncludeMode = keyof typeof CryptoCertificateIncludeModeToYAML
export type CryptoCertificateIncludeModeYAML = keyof typeof CryptoCertificateIncludeModeFromYAML

export const CryptoCertificateStorePlacementToYAML = {
  ComputerData: "ДанныеКомпьютера",
  OSUserData: "ДанныеПользователяОС",
  ApplicationData: "ДанныеПриложения",
} as const

export const CryptoCertificateStorePlacementFromYAML = {
  ДанныеКомпьютера: "ComputerData",
  ДанныеПользователяОС: "OSUserData",
  ДанныеПриложения: "ApplicationData",
} as const

export type CryptoCertificateStorePlacement = keyof typeof CryptoCertificateStorePlacementToYAML
export type CryptoCertificateStorePlacementYAML = keyof typeof CryptoCertificateStorePlacementFromYAML

export const CryptoCertificateStoreTypeToYAML = {
  RootCertificates: "КорневыеСертификаты",
  PersonalCertificates: "ПерсональныеСертификаты",
  RecipientCertificates: "СертификатыПолучателей",
  CertificationAuthorityCertificates: "СертификатыУдостоверяющихЦентров",
} as const

export const CryptoCertificateStoreTypeFromYAML = {
  КорневыеСертификаты: "RootCertificates",
  ПерсональныеСертификаты: "PersonalCertificates",
  СертификатыПолучателей: "RecipientCertificates",
  СертификатыУдостоверяющихЦентров: "CertificationAuthorityCertificates",
} as const

export type CryptoCertificateStoreType = keyof typeof CryptoCertificateStoreTypeToYAML
export type CryptoCertificateStoreTypeYAML = keyof typeof CryptoCertificateStoreTypeFromYAML

export const CryptoInteractiveModeUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CryptoInteractiveModeUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CryptoInteractiveModeUse = keyof typeof CryptoInteractiveModeUseToYAML
export type CryptoInteractiveModeUseYAML = keyof typeof CryptoInteractiveModeUseFromYAML

export const FormattedDocumentFileTypeToYAML = {
  ANSITXT: "ANSITXT",
  HTML: "HTML",
  PDF: "PDF",
  TXT: "TXT",
} as const

export const FormattedDocumentFileTypeFromYAML = {
  ANSITXT: "ANSITXT",
  HTML: "HTML",
  PDF: "PDF",
  TXT: "TXT",
} as const

export type FormattedDocumentFileType = keyof typeof FormattedDocumentFileTypeToYAML
export type FormattedDocumentFileTypeYAML = keyof typeof FormattedDocumentFileTypeFromYAML

export const FormattedDocumentParagraphTypeToYAML = {
  BulletedList: "МаркированныйСписок",
  NumberedList: "НумерованныйСписок",
  Usual: "Обычный",
} as const

export const FormattedDocumentParagraphTypeFromYAML = {
  МаркированныйСписок: "BulletedList",
  НумерованныйСписок: "NumberedList",
  Обычный: "Usual",
} as const

export type FormattedDocumentParagraphType = keyof typeof FormattedDocumentParagraphTypeToYAML
export type FormattedDocumentParagraphTypeYAML = keyof typeof FormattedDocumentParagraphTypeFromYAML

export const RowGotoDirectionToYAML = {
  Up: "Вверх",
  Down: "Вниз",
} as const

export const RowGotoDirectionFromYAML = {
  Вверх: "Up",
  Вниз: "Down",
} as const

export type RowGotoDirection = keyof typeof RowGotoDirectionToYAML
export type RowGotoDirectionYAML = keyof typeof RowGotoDirectionFromYAML

export const InternetMailAttachmentEncodingModeToYAML = {
  MIME: "MIME",
  UUEncode: "UUEncode",
} as const

export const InternetMailAttachmentEncodingModeFromYAML = {
  MIME: "MIME",
  UUEncode: "UUEncode",
} as const

export type InternetMailAttachmentEncodingMode = keyof typeof InternetMailAttachmentEncodingModeToYAML
export type InternetMailAttachmentEncodingModeYAML = keyof typeof InternetMailAttachmentEncodingModeFromYAML

export const InternetMailMessageImportanceToYAML = {
  High: "Высокая",
  Highest: "Наивысшая",
  Lowest: "Наименьшая",
  Low: "Низкая",
  Normal: "Обычная",
} as const

export const InternetMailMessageImportanceFromYAML = {
  Высокая: "High",
  Наивысшая: "Highest",
  Наименьшая: "Lowest",
  Низкая: "Low",
  Обычная: "Normal",
} as const

export type InternetMailMessageImportance = keyof typeof InternetMailMessageImportanceToYAML
export type InternetMailMessageImportanceYAML = keyof typeof InternetMailMessageImportanceFromYAML

export const InternetMailMessageNonASCIISymbolsEncodingModeToYAML = {
  MIME: "MIME",
  QuotedPrintable: "QuotedPrintable",
  None: "БезКодирования",
} as const

export const InternetMailMessageNonASCIISymbolsEncodingModeFromYAML = {
  MIME: "MIME",
  QuotedPrintable: "QuotedPrintable",
  БезКодирования: "None",
} as const

export type InternetMailMessageNonASCIISymbolsEncodingMode =
  keyof typeof InternetMailMessageNonASCIISymbolsEncodingModeToYAML
export type InternetMailMessageNonASCIISymbolsEncodingModeYAML =
  keyof typeof InternetMailMessageNonASCIISymbolsEncodingModeFromYAML

export const InternetMailMessageParseStatusToYAML = {
  ErrorsDetected: "ОбнаруженыОшибки",
  ErrorsNotDetected: "ОшибокНеОбнаружено",
} as const

export const InternetMailMessageParseStatusFromYAML = {
  ОбнаруженыОшибки: "ErrorsDetected",
  ОшибокНеОбнаружено: "ErrorsNotDetected",
} as const

export type InternetMailMessageParseStatus = keyof typeof InternetMailMessageParseStatusToYAML
export type InternetMailMessageParseStatusYAML = keyof typeof InternetMailMessageParseStatusFromYAML

export const InternetMailProtocolToYAML = {
  IMAP: "IMAP",
  POP3: "POP3",
  SMTP: "SMTP",
} as const

export const InternetMailProtocolFromYAML = {
  IMAP: "IMAP",
  POP3: "POP3",
  SMTP: "SMTP",
} as const

export type InternetMailProtocol = keyof typeof InternetMailProtocolToYAML
export type InternetMailProtocolYAML = keyof typeof InternetMailProtocolFromYAML

export const InternetMailTextProcessingToYAML = {
  DontProcess: "НеОбрабатывать",
  Process: "Обрабатывать",
} as const

export const InternetMailTextProcessingFromYAML = {
  НеОбрабатывать: "DontProcess",
  Обрабатывать: "Process",
} as const

export type InternetMailTextProcessing = keyof typeof InternetMailTextProcessingToYAML
export type InternetMailTextProcessingYAML = keyof typeof InternetMailTextProcessingFromYAML

export const InternetMailTextTypeToYAML = {
  HTML: "HTML",
  CustomText: "ПроизвольныйТекст",
  PlainText: "ПростойТекст",
  RichText: "РазмеченныйТекст",
} as const

export const InternetMailTextTypeFromYAML = {
  HTML: "HTML",
  ПроизвольныйТекст: "CustomText",
  ПростойТекст: "PlainText",
  РазмеченныйТекст: "RichText",
} as const

export type InternetMailTextType = keyof typeof InternetMailTextTypeToYAML
export type InternetMailTextTypeYAML = keyof typeof InternetMailTextTypeFromYAML

export const POP3AuthenticationModeToYAML = {
  APOP: "APOP",
  CramMD5: "CramMD5",
  General: "Обычная",
} as const

export const POP3AuthenticationModeFromYAML = {
  APOP: "APOP",
  CramMD5: "CramMD5",
  Обычная: "General",
} as const

export type POP3AuthenticationMode = keyof typeof POP3AuthenticationModeToYAML
export type POP3AuthenticationModeYAML = keyof typeof POP3AuthenticationModeFromYAML

export const SMTPAuthenticationModeToYAML = {
  CramMD5: "CramMD5",
  Login: "Login",
  Plain: "Plain",
  None: "БезАутентификации",
  Default: "ПоУмолчанию",
} as const

export const SMTPAuthenticationModeFromYAML = {
  CramMD5: "CramMD5",
  Login: "Login",
  Plain: "Plain",
  БезАутентификации: "None",
  ПоУмолчанию: "Default",
} as const

export type SMTPAuthenticationMode = keyof typeof SMTPAuthenticationModeToYAML
export type SMTPAuthenticationModeYAML = keyof typeof SMTPAuthenticationModeFromYAML

export const UseInternetMailTokenAuthenticationToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseInternetMailTokenAuthenticationFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseInternetMailTokenAuthentication = keyof typeof UseInternetMailTokenAuthenticationToYAML
export type UseInternetMailTokenAuthenticationYAML = keyof typeof UseInternetMailTokenAuthenticationFromYAML

export const QueryBuilderDimensionTypeToYAML = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const QueryBuilderDimensionTypeFromYAML = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type QueryBuilderDimensionType = keyof typeof QueryBuilderDimensionTypeToYAML
export type QueryBuilderDimensionTypeYAML = keyof typeof QueryBuilderDimensionTypeFromYAML

export const AddInConnectionTypeToYAML = {
  Isolated: "Изолированно",
  NotIsolated: "НеИзолированно",
} as const

export const AddInConnectionTypeFromYAML = {
  Изолированно: "Isolated",
  НеИзолированно: "NotIsolated",
} as const

export type AddInConnectionType = keyof typeof AddInConnectionTypeToYAML
export type AddInConnectionTypeYAML = keyof typeof AddInConnectionTypeFromYAML

export const AddInTypeToYAML = {
  COM: "COM",
  Native: "Native",
} as const

export const AddInTypeFromYAML = {
  COM: "COM",
  Native: "Native",
} as const

export type AddInType = keyof typeof AddInTypeToYAML
export type AddInTypeYAML = keyof typeof AddInTypeFromYAML

export const AllowedLengthToYAML = {
  Variable: "Переменная",
  Fixed: "Фиксированная",
} as const

export const AllowedLengthFromYAML = {
  Переменная: "Variable",
  Фиксированная: "Fixed",
} as const

export type AllowedLength = keyof typeof AllowedLengthToYAML
export type AllowedLengthYAML = keyof typeof AllowedLengthFromYAML

export const AllowedSignToYAML = {
  Any: "Любой",
  Nonnegative: "Неотрицательный",
} as const

export const AllowedSignFromYAML = {
  Любой: "Any",
  Неотрицательный: "Nonnegative",
} as const

export type AllowedSign = keyof typeof AllowedSignToYAML
export type AllowedSignYAML = keyof typeof AllowedSignFromYAML

export const ApplicationFormsOpenningModeToYAML = {
  Tabs: "Закладки",
  SingleWindows: "ОтдельныеОкна",
} as const

export const ApplicationFormsOpenningModeFromYAML = {
  Закладки: "Tabs",
  ОтдельныеОкна: "SingleWindows",
} as const

export type ApplicationFormsOpenningMode = keyof typeof ApplicationFormsOpenningModeToYAML
export type ApplicationFormsOpenningModeYAML = keyof typeof ApplicationFormsOpenningModeFromYAML

export const BorderTypeToYAML = {
  Absolute: "Абсолютная",
  StyleItem: "ЭлементСтиля",
} as const

export const BorderTypeFromYAML = {
  Абсолютная: "Absolute",
  ЭлементСтиля: "StyleItem",
} as const

export type BorderType = keyof typeof BorderTypeToYAML
export type BorderTypeYAML = keyof typeof BorderTypeFromYAML

export const BoundaryTypeToYAML = {
  Including: "Включая",
  Excluding: "Исключая",
} as const

export const BoundaryTypeFromYAML = {
  Включая: "Including",
  Исключая: "Excluding",
} as const

export type BoundaryType = keyof typeof BoundaryTypeToYAML
export type BoundaryTypeYAML = keyof typeof BoundaryTypeFromYAML

export const ByteOrderMarkUseToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ByteOrderMarkUseFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ByteOrderMarkUse = keyof typeof ByteOrderMarkUseToYAML
export type ByteOrderMarkUseYAML = keyof typeof ByteOrderMarkUseFromYAML

export const ClientApplicationBaseFontVariantToYAML = {
  Large: "Крупный",
  Normal: "Обычный",
} as const

export const ClientApplicationBaseFontVariantFromYAML = {
  Крупный: "Large",
  Обычный: "Normal",
} as const

export type ClientApplicationBaseFontVariant = keyof typeof ClientApplicationBaseFontVariantToYAML
export type ClientApplicationBaseFontVariantYAML = keyof typeof ClientApplicationBaseFontVariantFromYAML

export const ClientApplicationFormScaleVariantToYAML = {
  Auto: "Авто",
  Compact: "Компактный",
  Normal: "Обычный",
} as const

export const ClientApplicationFormScaleVariantFromYAML = {
  Авто: "Auto",
  Компактный: "Compact",
  Обычный: "Normal",
} as const

export type ClientApplicationFormScaleVariant = keyof typeof ClientApplicationFormScaleVariantToYAML
export type ClientApplicationFormScaleVariantYAML = keyof typeof ClientApplicationFormScaleVariantFromYAML

export const ClientApplicationInterfaceVariantToYAML = {
  Version8_2: "Версия8_2",
  Taxi: "Такси",
} as const

export const ClientApplicationInterfaceVariantFromYAML = {
  Версия8_2: "Version8_2",
  Такси: "Taxi",
} as const

export type ClientApplicationInterfaceVariant = keyof typeof ClientApplicationInterfaceVariantToYAML
export type ClientApplicationInterfaceVariantYAML = keyof typeof ClientApplicationInterfaceVariantFromYAML

export const ClientApplicationTypeToYAML = {
  WebClient: "ВебКлиент",
  ExternalConnection: "ВнешнееСоединение",
  MobileAppClient: "МобильноеПриложениеКлиент",
  MobileClient: "МобильныйКлиент",
  ThickClient: "ТолстыйКлиент",
  ThinClient: "ТонкийКлиент",
} as const

export const ClientApplicationTypeFromYAML = {
  ВебКлиент: "WebClient",
  ВнешнееСоединение: "ExternalConnection",
  МобильноеПриложениеКлиент: "MobileAppClient",
  МобильныйКлиент: "MobileClient",
  ТолстыйКлиент: "ThickClient",
  ТонкийКлиент: "ThinClient",
} as const

export type ClientApplicationType = keyof typeof ClientApplicationTypeToYAML
export type ClientApplicationTypeYAML = keyof typeof ClientApplicationTypeFromYAML

export const ClientConnectionSpeedToYAML = {
  Low: "Низкая",
  Normal: "Обычная",
} as const

export const ClientConnectionSpeedFromYAML = {
  Низкая: "Low",
  Обычная: "Normal",
} as const

export type ClientConnectionSpeed = keyof typeof ClientConnectionSpeedToYAML
export type ClientConnectionSpeedYAML = keyof typeof ClientConnectionSpeedFromYAML

export const ClientRunModeToYAML = {
  Auto: "Авто",
  OrdinaryApplication: "ОбычноеПриложение",
  ManagedApplication: "УправляемоеПриложение",
} as const

export const ClientRunModeFromYAML = {
  Авто: "Auto",
  ОбычноеПриложение: "OrdinaryApplication",
  УправляемоеПриложение: "ManagedApplication",
} as const

export type ClientRunMode = keyof typeof ClientRunModeToYAML
export type ClientRunModeYAML = keyof typeof ClientRunModeFromYAML

export const ColorTypeToYAML = {
  WebColor: "WebЦвет",
  WindowsColor: "WindowsЦвет",
  Absolute: "Абсолютный",
  AutoColor: "АвтоЦвет",
  StyleItem: "ЭлементСтиля",
} as const

export const ColorTypeFromYAML = {
  WebЦвет: "WebColor",
  WindowsЦвет: "WindowsColor",
  Абсолютный: "Absolute",
  АвтоЦвет: "AutoColor",
  ЭлементСтиля: "StyleItem",
} as const

export type ColorType = keyof typeof ColorTypeToYAML
export type ColorTypeYAML = keyof typeof ColorTypeFromYAML

export const ComparisonTypeToYAML = {
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

export const ComparisonTypeFromYAML = {
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

export type ComparisonType = keyof typeof ComparisonTypeToYAML
export type ComparisonTypeYAML = keyof typeof ComparisonTypeFromYAML

export const CompositeWordsSeparationModeToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CompositeWordsSeparationModeFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CompositeWordsSeparationMode = keyof typeof CompositeWordsSeparationModeToYAML
export type CompositeWordsSeparationModeYAML = keyof typeof CompositeWordsSeparationModeFromYAML

export const ConfigurationExtensionApplicationIssueSeverityToYAML = {
  Critical: "Критичная",
  Low: "Низкая",
  Moderate: "Обычная",
} as const

export const ConfigurationExtensionApplicationIssueSeverityFromYAML = {
  Критичная: "Critical",
  Низкая: "Low",
  Обычная: "Moderate",
} as const

export type ConfigurationExtensionApplicationIssueSeverity =
  keyof typeof ConfigurationExtensionApplicationIssueSeverityToYAML
export type ConfigurationExtensionApplicationIssueSeverityYAML =
  keyof typeof ConfigurationExtensionApplicationIssueSeverityFromYAML

export const ConfigurationExtensionScopeToYAML = {
  InfoBase: "ИнформационнаяБаза",
  DataSeparation: "РазделениеДанных",
} as const

export const ConfigurationExtensionScopeFromYAML = {
  ИнформационнаяБаза: "InfoBase",
  РазделениеДанных: "DataSeparation",
} as const

export type ConfigurationExtensionScope = keyof typeof ConfigurationExtensionScopeToYAML
export type ConfigurationExtensionScopeYAML = keyof typeof ConfigurationExtensionScopeFromYAML

export const ConfigurationExtensionsSourceToYAML = {
  Database: "БазаДанных",
  SessionApplied: "СеансАктивные",
  SessionDisabled: "СеансОтключенные",
} as const

export const ConfigurationExtensionsSourceFromYAML = {
  БазаДанных: "Database",
  СеансАктивные: "SessionApplied",
  СеансОтключенные: "SessionDisabled",
} as const

export type ConfigurationExtensionsSource = keyof typeof ConfigurationExtensionsSourceToYAML
export type ConfigurationExtensionsSourceYAML = keyof typeof ConfigurationExtensionsSourceFromYAML

export const DataBaseConfigurationUpdateExecutionInformationItemTypeToYAML = {
  Information: "Информация",
  Error: "Ошибка",
  Warning: "Предупреждение",
} as const

export const DataBaseConfigurationUpdateExecutionInformationItemTypeFromYAML = {
  Информация: "Information",
  Ошибка: "Error",
  Предупреждение: "Warning",
} as const

export type DataBaseConfigurationUpdateExecutionInformationItemType =
  keyof typeof DataBaseConfigurationUpdateExecutionInformationItemTypeToYAML
export type DataBaseConfigurationUpdateExecutionInformationItemTypeYAML =
  keyof typeof DataBaseConfigurationUpdateExecutionInformationItemTypeFromYAML

export const DataBaseConfigurationUpdateStateToYAML = {
  RefreshInProgress: "ВыполняетсяАктуализация",
  ProcessingInProgress: "ВыполняетсяОбработка",
  NotActive: "Неактивно",
} as const

export const DataBaseConfigurationUpdateStateFromYAML = {
  ВыполняетсяАктуализация: "RefreshInProgress",
  ВыполняетсяОбработка: "ProcessingInProgress",
  Неактивно: "NotActive",
} as const

export type DataBaseConfigurationUpdateState = keyof typeof DataBaseConfigurationUpdateStateToYAML
export type DataBaseConfigurationUpdateStateYAML = keyof typeof DataBaseConfigurationUpdateStateFromYAML

export const DatabaseTablespacesUseModeToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DatabaseTablespacesUseModeFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DatabaseTablespacesUseMode = keyof typeof DatabaseTablespacesUseModeToYAML
export type DatabaseTablespacesUseModeYAML = keyof typeof DatabaseTablespacesUseModeFromYAML

export const DateFractionsToYAML = {
  Time: "Время",
  Date: "Дата",
  DateTime: "ДатаВремя",
} as const

export const DateFractionsFromYAML = {
  Время: "Time",
  Дата: "Date",
  ДатаВремя: "DateTime",
} as const

export type DateFractions = keyof typeof DateFractionsToYAML
export type DateFractionsYAML = keyof typeof DateFractionsFromYAML

export const DialogReturnCodeToYAML = {
  Yes: "Да",
  No: "Нет",
  OK: "ОК",
  Cancel: "Отмена",
  Retry: "Повторить",
  Abort: "Прервать",
  Ignore: "Пропустить",
  Timeout: "Таймаут",
} as const

export const DialogReturnCodeFromYAML = {
  Да: "Yes",
  Нет: "No",
  ОК: "OK",
  Отмена: "Cancel",
  Повторить: "Retry",
  Прервать: "Abort",
  Пропустить: "Ignore",
  Таймаут: "Timeout",
} as const

export type DialogReturnCode = keyof typeof DialogReturnCodeToYAML
export type DialogReturnCodeYAML = keyof typeof DialogReturnCodeFromYAML

export const DynamicListKeyTypeToYAML = {
  Auto: "Авто",
  FieldValue: "ЗначениеПоля",
  RowKey: "КлючСтроки",
  RowNumber: "НомерСтроки",
} as const

export const DynamicListKeyTypeFromYAML = {
  Авто: "Auto",
  ЗначениеПоля: "FieldValue",
  КлючСтроки: "RowKey",
  НомерСтроки: "RowNumber",
} as const

export type DynamicListKeyType = keyof typeof DynamicListKeyTypeToYAML
export type DynamicListKeyTypeYAML = keyof typeof DynamicListKeyTypeFromYAML

export const EnterKeyBehaviorTypeToYAML = {
  DefaultButton: "КнопкаПоУмолчанию",
  ControlNavigation: "ПереходПоЭлементамФормы",
} as const

export const EnterKeyBehaviorTypeFromYAML = {
  КнопкаПоУмолчанию: "DefaultButton",
  ПереходПоЭлементамФормы: "ControlNavigation",
} as const

export type EnterKeyBehaviorType = keyof typeof EnterKeyBehaviorTypeToYAML
export type EnterKeyBehaviorTypeYAML = keyof typeof EnterKeyBehaviorTypeFromYAML

export const ExternalDataSourceStateToYAML = {
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const ExternalDataSourceStateFromYAML = {
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type ExternalDataSourceState = keyof typeof ExternalDataSourceStateToYAML
export type ExternalDataSourceStateYAML = keyof typeof ExternalDataSourceStateFromYAML

export const FillCheckingToYAML = {
  ShowError: "ВыдаватьОшибку",
  DontCheck: "НеПроверять",
} as const

export const FillCheckingFromYAML = {
  ВыдаватьОшибку: "ShowError",
  НеПроверять: "DontCheck",
} as const

export type FillChecking = keyof typeof FillCheckingToYAML
export type FillCheckingYAML = keyof typeof FillCheckingFromYAML

export const FontTypeToYAML = {
  WindowsFont: "WindowsШрифт",
  Absolute: "Абсолютный",
  AutoFont: "АвтоШрифт",
  StyleItem: "ЭлементСтиля",
} as const

export const FontTypeFromYAML = {
  WindowsШрифт: "WindowsFont",
  Абсолютный: "Absolute",
  АвтоШрифт: "AutoFont",
  ЭлементСтиля: "StyleItem",
} as const

export type FontType = keyof typeof FontTypeToYAML
export type FontTypeYAML = keyof typeof FontTypeFromYAML

export const FullTextSearchMetadataUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const FullTextSearchMetadataUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type FullTextSearchMetadataUse = keyof typeof FullTextSearchMetadataUseToYAML
export type FullTextSearchMetadataUseYAML = keyof typeof FullTextSearchMetadataUseFromYAML

export const FullTextSearchModeToYAML = {
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const FullTextSearchModeFromYAML = {
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type FullTextSearchMode = keyof typeof FullTextSearchModeToYAML
export type FullTextSearchModeYAML = keyof typeof FullTextSearchModeFromYAML

export const FullTextSearchRepresentationTypeToYAML = {
  HTMLText: "HTMLТекст",
  XML: "XML",
} as const

export const FullTextSearchRepresentationTypeFromYAML = {
  HTMLТекст: "HTMLText",
  XML: "XML",
} as const

export type FullTextSearchRepresentationType = keyof typeof FullTextSearchRepresentationTypeToYAML
export type FullTextSearchRepresentationTypeYAML = keyof typeof FullTextSearchRepresentationTypeFromYAML

export const FullTextSearchVersionToYAML = {
  Version1: "Версия1",
  Version2: "Версия2",
} as const

export const FullTextSearchVersionFromYAML = {
  Версия1: "Version1",
  Версия2: "Version2",
} as const

export type FullTextSearchVersion = keyof typeof FullTextSearchVersionToYAML
export type FullTextSearchVersionYAML = keyof typeof FullTextSearchVersionFromYAML

export const HashFunctionToYAML = {
  CRC32: "CRC32",
  MD5: "MD5",
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export const HashFunctionFromYAML = {
  CRC32: "CRC32",
  MD5: "MD5",
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export type HashFunction = keyof typeof HashFunctionToYAML
export type HashFunctionYAML = keyof typeof HashFunctionFromYAML

export const InterfaceCompatibilityModeToYAML = {
  Version8_2: "Версия8_2",
  Version8_2EnableTaxi: "Версия8_2РазрешитьТакси",
  Taxi: "Такси",
  TaxiEnableVersion8_2: "ТаксиРазрешитьВерсия8_2",
} as const

export const InterfaceCompatibilityModeFromYAML = {
  Версия8_2: "Version8_2",
  Версия8_2РазрешитьТакси: "Version8_2EnableTaxi",
  Такси: "Taxi",
  ТаксиРазрешитьВерсия8_2: "TaxiEnableVersion8_2",
} as const

export type InterfaceCompatibilityMode = keyof typeof InterfaceCompatibilityModeToYAML
export type InterfaceCompatibilityModeYAML = keyof typeof InterfaceCompatibilityModeFromYAML

export const IntervalBoundVariantToYAML = {
  WithoutRestriction: "БезОграничения",
  Year: "Год",
  Quarter: "Квартал",
  SpecificDate: "КонкретнаяДата",
  Month: "Месяц",
  Week: "Неделя",
  WorkingDate: "РабочаяДата",
  BeforeAfter: "Смещение",
} as const

export const IntervalBoundVariantFromYAML = {
  БезОграничения: "WithoutRestriction",
  Год: "Year",
  Квартал: "Quarter",
  КонкретнаяДата: "SpecificDate",
  Месяц: "Month",
  Неделя: "Week",
  РабочаяДата: "WorkingDate",
  Смещение: "BeforeAfter",
} as const

export type IntervalBoundVariant = keyof typeof IntervalBoundVariantToYAML
export type IntervalBoundVariantYAML = keyof typeof IntervalBoundVariantFromYAML

export const KeyToYAML = {
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

export const KeyFromYAML = {
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

export type Key = keyof typeof KeyToYAML
export type KeyYAML = keyof typeof KeyFromYAML

export const LocationRelativeToGeofenceToYAML = {
  Inside: "Внутри",
  Outside: "Снаружи",
} as const

export const LocationRelativeToGeofenceFromYAML = {
  Внутри: "Inside",
  Снаружи: "Outside",
} as const

export type LocationRelativeToGeofence = keyof typeof LocationRelativeToGeofenceToYAML
export type LocationRelativeToGeofenceYAML = keyof typeof LocationRelativeToGeofenceFromYAML

export const MessageStatusToYAML = {
  WithoutStatus: "БезСтатуса",
  Important: "Важное",
  Attention: "Внимание",
  Information: "Информация",
  Ordinary: "Обычное",
  VeryImportant: "ОченьВажное",
} as const

export const MessageStatusFromYAML = {
  БезСтатуса: "WithoutStatus",
  Важное: "Important",
  Внимание: "Attention",
  Информация: "Information",
  Обычное: "Ordinary",
  ОченьВажное: "VeryImportant",
} as const

export type MessageStatus = keyof typeof MessageStatusToYAML
export type MessageStatusYAML = keyof typeof MessageStatusFromYAML

export const MobileApplicationFunctionalitiesToYAML = {
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

export const MobileApplicationFunctionalitiesFromYAML = {
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

export type MobileApplicationFunctionalities = keyof typeof MobileApplicationFunctionalitiesToYAML
export type MobileApplicationFunctionalitiesYAML = keyof typeof MobileApplicationFunctionalitiesFromYAML

export const NumericValueTypeToYAML = {
  Cardinal: "Количественное",
  Ordinal: "Порядковое",
} as const

export const NumericValueTypeFromYAML = {
  Количественное: "Cardinal",
  Порядковое: "Ordinal",
} as const

export type NumericValueType = keyof typeof NumericValueTypeToYAML
export type NumericValueTypeYAML = keyof typeof NumericValueTypeFromYAML

export const PasswordPolicyComplianceCheckResultToYAML = {
  DoesNotSatisfyMinLengthRequirements: "НеСоответствуетТребованиямМинимальнойДлины",
  DoesNotSatisfyReuseLimitRequirements: "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних",
  DoesNotSatisfyCompromiseCheckRequirements: "НеСоответствуетТребованиямПроверкиРаскрытия",
  DoesNotSatisfyComplexityRequirements: "НеСоответствуетТребованиямСложности",
} as const

export const PasswordPolicyComplianceCheckResultFromYAML = {
  НеСоответствуетТребованиямМинимальнойДлины: "DoesNotSatisfyMinLengthRequirements",
  НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних: "DoesNotSatisfyReuseLimitRequirements",
  НеСоответствуетТребованиямПроверкиРаскрытия: "DoesNotSatisfyCompromiseCheckRequirements",
  НеСоответствуетТребованиямСложности: "DoesNotSatisfyComplexityRequirements",
} as const

export type PasswordPolicyComplianceCheckResult = keyof typeof PasswordPolicyComplianceCheckResultToYAML
export type PasswordPolicyComplianceCheckResultYAML = keyof typeof PasswordPolicyComplianceCheckResultFromYAML

export const PeriodSettingsVariantToYAML = {
  Interval: "Интервал",
  Period: "Период",
} as const

export const PeriodSettingsVariantFromYAML = {
  Интервал: "Interval",
  Период: "Period",
} as const

export type PeriodSettingsVariant = keyof typeof PeriodSettingsVariantToYAML
export type PeriodSettingsVariantYAML = keyof typeof PeriodSettingsVariantFromYAML

export const PeriodVariantToYAML = {
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

export const PeriodVariantFromYAML = {
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

export type PeriodVariant = keyof typeof PeriodVariantToYAML
export type PeriodVariantYAML = keyof typeof PeriodVariantFromYAML

export const PictureTypeToYAML = {
  Absolute: "Абсолютная",
  FromLib: "ИзБиблиотеки",
  Empty: "Пустая",
} as const

export const PictureTypeFromYAML = {
  Абсолютная: "Absolute",
  ИзБиблиотеки: "FromLib",
  Пустая: "Empty",
} as const

export type PictureType = keyof typeof PictureTypeToYAML
export type PictureTypeYAML = keyof typeof PictureTypeFromYAML

export const PlatformTypeToYAML = {
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

export const PlatformTypeFromYAML = {
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

export type PlatformType = keyof typeof PlatformTypeToYAML
export type PlatformTypeYAML = keyof typeof PlatformTypeFromYAML

export const PredefinedDataUpdateToYAML = {
  Auto: "Авто",
  DontAutoUpdate: "НеОбновлятьАвтоматически",
  AutoUpdate: "ОбновлятьАвтоматически",
} as const

export const PredefinedDataUpdateFromYAML = {
  Авто: "Auto",
  НеОбновлятьАвтоматически: "DontAutoUpdate",
  ОбновлятьАвтоматически: "AutoUpdate",
} as const

export type PredefinedDataUpdate = keyof typeof PredefinedDataUpdateToYAML
export type PredefinedDataUpdateYAML = keyof typeof PredefinedDataUpdateFromYAML

export const QuestionDialogModeToYAML = {
  YesNo: "ДаНет",
  YesNoCancel: "ДаНетОтмена",
  OK: "ОК",
  OKCancel: "ОКОтмена",
  RetryCancel: "ПовторитьОтмена",
  AbortRetryIgnore: "ПрерватьПовторитьПропустить",
} as const

export const QuestionDialogModeFromYAML = {
  ДаНет: "YesNo",
  ДаНетОтмена: "YesNoCancel",
  ОК: "OK",
  ОКОтмена: "OKCancel",
  ПовторитьОтмена: "RetryCancel",
  ПрерватьПовторитьПропустить: "AbortRetryIgnore",
} as const

export type QuestionDialogMode = keyof typeof QuestionDialogModeToYAML
export type QuestionDialogModeYAML = keyof typeof QuestionDialogModeFromYAML

export const ReplacementModeToYAML = {
  Append: "Добавление",
  Replace: "Замещение",
  Update: "Обновление",
  Merge: "Слияние",
  Delete: "Удаление",
} as const

export const ReplacementModeFromYAML = {
  Добавление: "Append",
  Замещение: "Replace",
  Обновление: "Update",
  Слияние: "Merge",
  Удаление: "Delete",
} as const

export type ReplacementMode = keyof typeof ReplacementModeToYAML
export type ReplacementModeYAML = keyof typeof ReplacementModeFromYAML

export const RoundModeToYAML = {
  Round15as10: "Окр15как10",
  Round15as20: "Окр15как20",
} as const

export const RoundModeFromYAML = {
  Окр15как10: "Round15as10",
  Окр15как20: "Round15as20",
} as const

export type RoundMode = keyof typeof RoundModeToYAML
export type RoundModeYAML = keyof typeof RoundModeFromYAML

export const SearchDirectionToYAML = {
  FromEnd: "СКонца",
  FromBegin: "СНачала",
} as const

export const SearchDirectionFromYAML = {
  СКонца: "FromEnd",
  СНачала: "FromBegin",
} as const

export type SearchDirection = keyof typeof SearchDirectionToYAML
export type SearchDirectionYAML = keyof typeof SearchDirectionFromYAML

export const SectionsPanelRepresentationToYAML = {
  Picture: "Картинка",
  PictureAndText: "КартинкаИТекст",
  PictureOnTopAndText: "КартинкаСверхуИТекст",
  PictureOnLeftAndText: "КартинкаСлеваИТекст",
  Text: "Текст",
} as const

export const SectionsPanelRepresentationFromYAML = {
  Картинка: "Picture",
  КартинкаИТекст: "PictureAndText",
  КартинкаСверхуИТекст: "PictureOnTopAndText",
  КартинкаСлеваИТекст: "PictureOnLeftAndText",
  Текст: "Text",
} as const

export type SectionsPanelRepresentation = keyof typeof SectionsPanelRepresentationToYAML
export type SectionsPanelRepresentationYAML = keyof typeof SectionsPanelRepresentationFromYAML

export const SortDirectionToYAML = {
  Asc: "Возр",
  Desc: "Убыв",
} as const

export const SortDirectionFromYAML = {
  Возр: "Asc",
  Убыв: "Desc",
} as const

export type SortDirection = keyof typeof SortDirectionToYAML
export type SortDirectionYAML = keyof typeof SortDirectionFromYAML

export const StandardBeginningDateVariantToYAML = {
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

export const StandardBeginningDateVariantFromYAML = {
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

export type StandardBeginningDateVariant = keyof typeof StandardBeginningDateVariantToYAML
export type StandardBeginningDateVariantYAML = keyof typeof StandardBeginningDateVariantFromYAML

export const StandardGlobalSearchTypeToYAML = {
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

export const StandardGlobalSearchTypeFromYAML = {
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

export type StandardGlobalSearchType = keyof typeof StandardGlobalSearchTypeToYAML
export type StandardGlobalSearchTypeYAML = keyof typeof StandardGlobalSearchTypeFromYAML

export const StandardPeriodVariantToYAML = {
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

export const StandardPeriodVariantFromYAML = {
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

export type StandardPeriodVariant = keyof typeof StandardPeriodVariantToYAML
export type StandardPeriodVariantYAML = keyof typeof StandardPeriodVariantFromYAML

export const StringEncodingMethodToYAML = {
  URLInURLEncoding: "URLВКодировкеURL",
  URLEncoding: "КодировкаURL",
} as const

export const StringEncodingMethodFromYAML = {
  URLВКодировкеURL: "URLInURLEncoding",
  КодировкаURL: "URLEncoding",
} as const

export type StringEncodingMethod = keyof typeof StringEncodingMethodToYAML
export type StringEncodingMethodYAML = keyof typeof StringEncodingMethodFromYAML

export const TextEncodingToYAML = {
  ANSI: "ANSI",
  OEM: "OEM",
  UTF16: "UTF16",
  UTF8: "UTF8",
  System: "Системная",
} as const

export const TextEncodingFromYAML = {
  ANSI: "ANSI",
  OEM: "OEM",
  UTF16: "UTF16",
  UTF8: "UTF8",
  Системная: "System",
} as const

export type TextEncoding = keyof typeof TextEncodingToYAML
export type TextEncodingYAML = keyof typeof TextEncodingFromYAML

export const TransactionsIsolationLevelToYAML = {
  Auto: "Авто",
  RepeatableRead: "ПовторяемоеЧтение",
  Serializable: "Упорядочиваемость",
  ReadCommitted: "ЧтениеЗафиксированных",
  ReadUncommitted: "ЧтениеНезафиксированных",
} as const

export const TransactionsIsolationLevelFromYAML = {
  Авто: "Auto",
  ПовторяемоеЧтение: "RepeatableRead",
  Упорядочиваемость: "Serializable",
  ЧтениеЗафиксированных: "ReadCommitted",
  ЧтениеНезафиксированных: "ReadUncommitted",
} as const

export type TransactionsIsolationLevel = keyof typeof TransactionsIsolationLevelToYAML
export type TransactionsIsolationLevelYAML = keyof typeof TransactionsIsolationLevelFromYAML

export const UUIDVersionToYAML = {
  Version1: "Версия1",
  Version3: "Версия3",
  Version4: "Версия4",
  Version5: "Версия5",
} as const

export const UUIDVersionFromYAML = {
  Версия1: "Version1",
  Версия3: "Version3",
  Версия4: "Version4",
  Версия5: "Version5",
} as const

export type UUIDVersion = keyof typeof UUIDVersionToYAML
export type UUIDVersionYAML = keyof typeof UUIDVersionFromYAML

export const UpdateOnDataChangeToYAML = {
  Auto: "Авто",
  DontUpdate: "НеОбновлять",
} as const

export const UpdateOnDataChangeFromYAML = {
  Авто: "Auto",
  НеОбновлять: "DontUpdate",
} as const

export type UpdateOnDataChange = keyof typeof UpdateOnDataChangeToYAML
export type UpdateOnDataChangeYAML = keyof typeof UpdateOnDataChangeFromYAML

export const UserPasswordHashAlgorithmTypeToYAML = {
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export const UserPasswordHashAlgorithmTypeFromYAML = {
  PBKDF2SHA256: "PBKDF2SHA256",
  SHA1: "SHA1",
  SHA256: "SHA256",
  SHA512: "SHA512",
} as const

export type UserPasswordHashAlgorithmType = keyof typeof UserPasswordHashAlgorithmTypeToYAML
export type UserPasswordHashAlgorithmTypeYAML = keyof typeof UserPasswordHashAlgorithmTypeFromYAML

export const WorkingDateModeToYAML = {
  UseCurrentDate: "ИспользоватьТекущуюДату",
  Assign: "Назначать",
} as const

export const WorkingDateModeFromYAML = {
  ИспользоватьТекущуюДату: "UseCurrentDate",
  Назначать: "Assign",
} as const

export type WorkingDateMode = keyof typeof WorkingDateModeToYAML
export type WorkingDateModeYAML = keyof typeof WorkingDateModeFromYAML

export const XBaseEncodingToYAML = {
  ANSI: "ANSI",
  OEM: "OEM",
} as const

export const XBaseEncodingFromYAML = {
  ANSI: "ANSI",
  OEM: "OEM",
} as const

export type XBaseEncoding = keyof typeof XBaseEncodingToYAML
export type XBaseEncodingYAML = keyof typeof XBaseEncodingFromYAML

export const CalendarEventRecurrenceToYAML = {
  Weekly: "КаждуюНеделю",
  Yearly: "КаждыйГод",
  Daily: "КаждыйДень",
  Monthly: "КаждыйМесяц",
  Once: "ОдинРаз",
} as const

export const CalendarEventRecurrenceFromYAML = {
  КаждуюНеделю: "Weekly",
  КаждыйГод: "Yearly",
  КаждыйДень: "Daily",
  КаждыйМесяц: "Monthly",
  ОдинРаз: "Once",
} as const

export type CalendarEventRecurrence = keyof typeof CalendarEventRecurrenceToYAML
export type CalendarEventRecurrenceYAML = keyof typeof CalendarEventRecurrenceFromYAML

export const ContactDataAddressTypeToYAML = {
  Home: "Домашний",
  Other: "Другой",
  Work: "Рабочий",
} as const

export const ContactDataAddressTypeFromYAML = {
  Домашний: "Home",
  Другой: "Other",
  Рабочий: "Work",
} as const

export type ContactDataAddressType = keyof typeof ContactDataAddressTypeToYAML
export type ContactDataAddressTypeYAML = keyof typeof ContactDataAddressTypeFromYAML

export const ContactDataEmailAddressTypeToYAML = {
  Home: "Домашний",
  Other: "Другой",
  Mobile: "Мобильный",
  Work: "Рабочий",
} as const

export const ContactDataEmailAddressTypeFromYAML = {
  Домашний: "Home",
  Другой: "Other",
  Мобильный: "Mobile",
  Рабочий: "Work",
} as const

export type ContactDataEmailAddressType = keyof typeof ContactDataEmailAddressTypeToYAML
export type ContactDataEmailAddressTypeYAML = keyof typeof ContactDataEmailAddressTypeFromYAML

export const ContactDataInstantMessagingAddressTypeToYAML = {
  Home: "Домашний",
  Other: "Другой",
  Work: "Рабочий",
} as const

export const ContactDataInstantMessagingAddressTypeFromYAML = {
  Домашний: "Home",
  Другой: "Other",
  Рабочий: "Work",
} as const

export type ContactDataInstantMessagingAddressType = keyof typeof ContactDataInstantMessagingAddressTypeToYAML
export type ContactDataInstantMessagingAddressTypeYAML = keyof typeof ContactDataInstantMessagingAddressTypeFromYAML

export const ContactDataPhoneNumberTypeToYAML = {
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

export const ContactDataPhoneNumberTypeFromYAML = {
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

export type ContactDataPhoneNumberType = keyof typeof ContactDataPhoneNumberTypeToYAML
export type ContactDataPhoneNumberTypeYAML = keyof typeof ContactDataPhoneNumberTypeFromYAML

export const ContactDataRelationshipTypeToYAML = {
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

export const ContactDataRelationshipTypeFromYAML = {
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

export type ContactDataRelationshipType = keyof typeof ContactDataRelationshipTypeToYAML
export type ContactDataRelationshipTypeYAML = keyof typeof ContactDataRelationshipTypeFromYAML

export const ContactDataURLTypeToYAML = {
  FTP: "FTP",
  Blog: "Блог",
  Home: "Домашний",
  HomePage: "ДомашняяСтраница",
  Other: "Другой",
  Profile: "Профиль",
  Work: "Рабочий",
} as const

export const ContactDataURLTypeFromYAML = {
  FTP: "FTP",
  Блог: "Blog",
  Домашний: "Home",
  ДомашняяСтраница: "HomePage",
  Другой: "Other",
  Профиль: "Profile",
  Рабочий: "Work",
} as const

export type ContactDataURLType = keyof typeof ContactDataURLTypeToYAML
export type ContactDataURLTypeYAML = keyof typeof ContactDataURLTypeFromYAML

export const CallLogCallTypeToYAML = {
  Incoming: "Входящий",
  Outgoing: "Исходящий",
  Missed: "Пропущенный",
} as const

export const CallLogCallTypeFromYAML = {
  Входящий: "Incoming",
  Исходящий: "Outgoing",
  Пропущенный: "Missed",
} as const

export type CallLogCallType = keyof typeof CallLogCallTypeToYAML
export type CallLogCallTypeYAML = keyof typeof CallLogCallTypeFromYAML

export const TelephonyToolsCallEventVariantToYAML = {
  EndIncoming: "ЗавершениеВходящего",
  EndOutgoing: "ЗавершениеИсходящего",
  StartIncoming: "НачалоВходящего",
  StartOutgoing: "НачалоИсходящего",
  StartIncomingRinging: "НачалоСигналаВходящего",
} as const

export const TelephonyToolsCallEventVariantFromYAML = {
  ЗавершениеВходящего: "EndIncoming",
  ЗавершениеИсходящего: "EndOutgoing",
  НачалоВходящего: "StartIncoming",
  НачалоИсходящего: "StartOutgoing",
  НачалоСигналаВходящего: "StartIncomingRinging",
} as const

export type TelephonyToolsCallEventVariant = keyof typeof TelephonyToolsCallEventVariantToYAML
export type TelephonyToolsCallEventVariantYAML = keyof typeof TelephonyToolsCallEventVariantFromYAML

export const TelephonyToolsSMSTypeToYAML = {
  Queued: "ВОчереди",
  Incoming: "Входящее",
  Outgoing: "Исходящее",
  Sent: "Отправленное",
  Failed: "ОшибкаОтправки",
  Draft: "Черновик",
} as const

export const TelephonyToolsSMSTypeFromYAML = {
  ВОчереди: "Queued",
  Входящее: "Incoming",
  Исходящее: "Outgoing",
  Отправленное: "Sent",
  ОшибкаОтправки: "Failed",
  Черновик: "Draft",
} as const

export type TelephonyToolsSMSType = keyof typeof TelephonyToolsSMSTypeToYAML
export type TelephonyToolsSMSTypeYAML = keyof typeof TelephonyToolsSMSTypeFromYAML

export const AudioRecordingChannelUseToYAML = {
  Mono: "Моно",
  Stereo: "Стерео",
} as const

export const AudioRecordingChannelUseFromYAML = {
  Моно: "Mono",
  Стерео: "Stereo",
} as const

export type AudioRecordingChannelUse = keyof typeof AudioRecordingChannelUseToYAML
export type AudioRecordingChannelUseYAML = keyof typeof AudioRecordingChannelUseFromYAML

export const AudioRecordingFormatToYAML = {
  Mpeg4AAC: "Mpeg4AAC",
  WavPCM16bit: "WavPCM16bit",
} as const

export const AudioRecordingFormatFromYAML = {
  Mpeg4AAC: "Mpeg4AAC",
  WavPCM16bit: "WavPCM16bit",
} as const

export type AudioRecordingFormat = keyof typeof AudioRecordingFormatToYAML
export type AudioRecordingFormatYAML = keyof typeof AudioRecordingFormatFromYAML

export const BarcodeTypeToYAML = {
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

export const BarcodeTypeFromYAML = {
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

export type BarcodeType = keyof typeof BarcodeTypeToYAML
export type BarcodeTypeYAML = keyof typeof BarcodeTypeFromYAML

export const CameraLightingTypeToYAML = {
  Auto: "Авто",
  Enable: "Включена",
  Disable: "Выключена",
} as const

export const CameraLightingTypeFromYAML = {
  Авто: "Auto",
  Включена: "Enable",
  Выключена: "Disable",
} as const

export type CameraLightingType = keyof typeof CameraLightingTypeToYAML
export type CameraLightingTypeYAML = keyof typeof CameraLightingTypeFromYAML

export const DeviceCameraTypeToYAML = {
  Auto: "Авто",
  Rear: "Задняя",
  Front: "Передняя",
} as const

export const DeviceCameraTypeFromYAML = {
  Авто: "Auto",
  Задняя: "Rear",
  Передняя: "Front",
} as const

export type DeviceCameraType = keyof typeof DeviceCameraTypeToYAML
export type DeviceCameraTypeYAML = keyof typeof DeviceCameraTypeFromYAML

export const DocumentScanningCheckingQualityToYAML = {
  DontCheck: "НеПроверять",
  WarnBelowHigh: "ПредупреждатьНижеВысокого",
  WarnBelowMedium: "ПредупреждатьНижеСреднего",
  RequireHigh: "ТребоватьВысокое",
  RequireMediumWarnBelowHigh: "ТребоватьСреднееПредупреждатьНижеВысокого",
} as const

export const DocumentScanningCheckingQualityFromYAML = {
  НеПроверять: "DontCheck",
  ПредупреждатьНижеВысокого: "WarnBelowHigh",
  ПредупреждатьНижеСреднего: "WarnBelowMedium",
  ТребоватьВысокое: "RequireHigh",
  ТребоватьСреднееПредупреждатьНижеВысокого: "RequireMediumWarnBelowHigh",
} as const

export type DocumentScanningCheckingQuality = keyof typeof DocumentScanningCheckingQualityToYAML
export type DocumentScanningCheckingQualityYAML = keyof typeof DocumentScanningCheckingQualityFromYAML

export const DocumentScanningOrientationDetectionModeToYAML = {
  Landscape: "Ландшафт",
  ByHorizontalTextLines: "ПоГоризонтальнымСтрокамТекста",
  ByFirstPageInSeries: "ПоПервойСтраницеСерии",
  ByDocumentPosition: "ПоРасположениюДокумента",
  Portrait: "Портрет",
} as const

export const DocumentScanningOrientationDetectionModeFromYAML = {
  Ландшафт: "Landscape",
  ПоГоризонтальнымСтрокамТекста: "ByHorizontalTextLines",
  ПоПервойСтраницеСерии: "ByFirstPageInSeries",
  ПоРасположениюДокумента: "ByDocumentPosition",
  Портрет: "Portrait",
} as const

export type DocumentScanningOrientationDetectionMode = keyof typeof DocumentScanningOrientationDetectionModeToYAML
export type DocumentScanningOrientationDetectionModeYAML = keyof typeof DocumentScanningOrientationDetectionModeFromYAML

export const DocumentScanningProcessingFilterToYAML = {
  None: "Нет",
  Text: "Текст",
  TextWithPictures: "ТекстСКартинками",
} as const

export const DocumentScanningProcessingFilterFromYAML = {
  Нет: "None",
  Текст: "Text",
  ТекстСКартинками: "TextWithPictures",
} as const

export type DocumentScanningProcessingFilter = keyof typeof DocumentScanningProcessingFilterToYAML
export type DocumentScanningProcessingFilterYAML = keyof typeof DocumentScanningProcessingFilterFromYAML

export const MultimediaRecordingStopButtonPlacementToYAML = {
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

export const MultimediaRecordingStopButtonPlacementFromYAML = {
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

export type MultimediaRecordingStopButtonPlacement = keyof typeof MultimediaRecordingStopButtonPlacementToYAML
export type MultimediaRecordingStopButtonPlacementYAML = keyof typeof MultimediaRecordingStopButtonPlacementFromYAML

export const VideoQualityToYAML = {
  Auto: "Авто",
  High: "Высокое",
  Low: "Низкое",
} as const

export const VideoQualityFromYAML = {
  Авто: "Auto",
  Высокое: "High",
  Низкое: "Low",
} as const

export type VideoQuality = keyof typeof VideoQualityToYAML
export type VideoQualityYAML = keyof typeof VideoQualityFromYAML

export const QuerySchemaAvailableTableParameterTypeToYAML = {
  Variant: "Вариант",
  Value: "Значение",
  Array: "Массив",
  Order: "Порядок",
  FieldList: "СписокПолей",
  Where: "Условие",
} as const

export const QuerySchemaAvailableTableParameterTypeFromYAML = {
  Вариант: "Variant",
  Значение: "Value",
  Массив: "Array",
  Порядок: "Order",
  СписокПолей: "FieldList",
  Условие: "Where",
} as const

export type QuerySchemaAvailableTableParameterType = keyof typeof QuerySchemaAvailableTableParameterTypeToYAML
export type QuerySchemaAvailableTableParameterTypeYAML = keyof typeof QuerySchemaAvailableTableParameterTypeFromYAML

export const QuerySchemaJoinTypeToYAML = {
  Inner: "Внутреннее",
  LeftOuter: "ЛевоеВнешнее",
  FullOuter: "ПолноеВнешнее",
  RightOuter: "ПравоеВнешнее",
} as const

export const QuerySchemaJoinTypeFromYAML = {
  Внутреннее: "Inner",
  ЛевоеВнешнее: "LeftOuter",
  ПолноеВнешнее: "FullOuter",
  ПравоеВнешнее: "RightOuter",
} as const

export type QuerySchemaJoinType = keyof typeof QuerySchemaJoinTypeToYAML
export type QuerySchemaJoinTypeYAML = keyof typeof QuerySchemaJoinTypeFromYAML

export const QuerySchemaOrderDirectionToYAML = {
  Ascending: "ПоВозрастанию",
  HierarchyAscending: "ПоВозрастаниюИерархии",
  Descending: "ПоУбыванию",
  HierarchyDescending: "ПоУбываниюИерархии",
} as const

export const QuerySchemaOrderDirectionFromYAML = {
  ПоВозрастанию: "Ascending",
  ПоВозрастаниюИерархии: "HierarchyAscending",
  ПоУбыванию: "Descending",
  ПоУбываниюИерархии: "HierarchyDescending",
} as const

export type QuerySchemaOrderDirection = keyof typeof QuerySchemaOrderDirectionToYAML
export type QuerySchemaOrderDirectionYAML = keyof typeof QuerySchemaOrderDirectionFromYAML

export const QuerySchemaPeriodAdditionTypeToYAML = {
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

export const QuerySchemaPeriodAdditionTypeFromYAML = {
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

export type QuerySchemaPeriodAdditionType = keyof typeof QuerySchemaPeriodAdditionTypeToYAML
export type QuerySchemaPeriodAdditionTypeYAML = keyof typeof QuerySchemaPeriodAdditionTypeFromYAML

export const QuerySchemaTotalCalculationFieldTypeToYAML = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const QuerySchemaTotalCalculationFieldTypeFromYAML = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type QuerySchemaTotalCalculationFieldType = keyof typeof QuerySchemaTotalCalculationFieldTypeToYAML
export type QuerySchemaTotalCalculationFieldTypeYAML = keyof typeof QuerySchemaTotalCalculationFieldTypeFromYAML

export const QuerySchemaUnionTypeToYAML = {
  Union: "Объединить",
  UnionAll: "ОбъединитьВсе",
} as const

export const QuerySchemaUnionTypeFromYAML = {
  Объединить: "Union",
  ОбъединитьВсе: "UnionAll",
} as const

export type QuerySchemaUnionType = keyof typeof QuerySchemaUnionTypeToYAML
export type QuerySchemaUnionTypeYAML = keyof typeof QuerySchemaUnionTypeFromYAML

export const NewPlannerItemsTextTypeToYAML = {
  String: "Строка",
  FormattedString: "ФорматированнаяСтрока",
} as const

export const NewPlannerItemsTextTypeFromYAML = {
  Строка: "String",
  ФорматированнаяСтрока: "FormattedString",
} as const

export type NewPlannerItemsTextType = keyof typeof NewPlannerItemsTextTypeToYAML
export type NewPlannerItemsTextTypeYAML = keyof typeof NewPlannerItemsTextTypeFromYAML

export const PlannerCommandSourceToYAML = {
  Action: "Действие",
  URL: "НавигационнаяСсылка",
  WrappedTimeScaleHeaderArea: "ОбластьПеренесенногоЗаголовкаШкалыВремени",
  EmptyItemsArea: "ПустаяОбластьЭлементов",
  DimensionItem: "ЭлементИзмерения",
  TimeScaleItem: "ЭлементШкалыВремени",
  Items: "Элементы",
} as const

export const PlannerCommandSourceFromYAML = {
  Действие: "Action",
  НавигационнаяСсылка: "URL",
  ОбластьПеренесенногоЗаголовкаШкалыВремени: "WrappedTimeScaleHeaderArea",
  ПустаяОбластьЭлементов: "EmptyItemsArea",
  ЭлементИзмерения: "DimensionItem",
  ЭлементШкалыВремени: "TimeScaleItem",
  Элементы: "Items",
} as const

export type PlannerCommandSource = keyof typeof PlannerCommandSourceToYAML
export type PlannerCommandSourceYAML = keyof typeof PlannerCommandSourceFromYAML

export const PlannerInsideDragActionToYAML = {
  Select: "Выделение",
  Copy: "Копирование",
  Edit: "Редактирование",
  Create: "Создание",
} as const

export const PlannerInsideDragActionFromYAML = {
  Выделение: "Select",
  Копирование: "Copy",
  Редактирование: "Edit",
  Создание: "Create",
} as const

export type PlannerInsideDragAction = keyof typeof PlannerInsideDragActionToYAML
export type PlannerInsideDragActionYAML = keyof typeof PlannerInsideDragActionFromYAML

export const PlannerInsideDragBoundaryChangeVariantToYAML = {
  End: "Конец",
  Begin: "Начало",
  BeginAndEnd: "НачалоИКонец",
} as const

export const PlannerInsideDragBoundaryChangeVariantFromYAML = {
  Конец: "End",
  Начало: "Begin",
  НачалоИКонец: "BeginAndEnd",
} as const

export type PlannerInsideDragBoundaryChangeVariant = keyof typeof PlannerInsideDragBoundaryChangeVariantToYAML
export type PlannerInsideDragBoundaryChangeVariantYAML = keyof typeof PlannerInsideDragBoundaryChangeVariantFromYAML

export const PlannerItemActionLocationToYAML = {
  EndOfItem: "ВКонцеЭлемента",
  EndOfText: "ПослеТекста",
} as const

export const PlannerItemActionLocationFromYAML = {
  ВКонцеЭлемента: "EndOfItem",
  ПослеТекста: "EndOfText",
} as const

export type PlannerItemActionLocation = keyof typeof PlannerItemActionLocationToYAML
export type PlannerItemActionLocationYAML = keyof typeof PlannerItemActionLocationFromYAML

export const PlannerItemEnableEditModeToYAML = {
  DisableDragAndStretch: "ЗапретитьПеретаскиваниеИРастягивание",
  DisableStretch: "ЗапретитьРастягивание",
  DisableEdit: "ЗапретитьРедактирование",
  EnableEdit: "РазрешитьРедактирование",
} as const

export const PlannerItemEnableEditModeFromYAML = {
  ЗапретитьПеретаскиваниеИРастягивание: "DisableDragAndStretch",
  ЗапретитьРастягивание: "DisableStretch",
  ЗапретитьРедактирование: "DisableEdit",
  РазрешитьРедактирование: "EnableEdit",
} as const

export type PlannerItemEnableEditMode = keyof typeof PlannerItemEnableEditModeToYAML
export type PlannerItemEnableEditModeYAML = keyof typeof PlannerItemEnableEditModeFromYAML

export const PlannerItemsBehaviorOnLackOfSpaceToYAML = {
  ShowAllItems: "ОтображатьВсеЭлементы",
  CollapseItems: "СворачиватьЭлементы",
} as const

export const PlannerItemsBehaviorOnLackOfSpaceFromYAML = {
  ОтображатьВсеЭлементы: "ShowAllItems",
  СворачиватьЭлементы: "CollapseItems",
} as const

export type PlannerItemsBehaviorOnLackOfSpace = keyof typeof PlannerItemsBehaviorOnLackOfSpaceToYAML
export type PlannerItemsBehaviorOnLackOfSpaceYAML = keyof typeof PlannerItemsBehaviorOnLackOfSpaceFromYAML

export const PlannerItemsTimeRepresentationToYAML = {
  BeginTime: "ВремяНачала",
  BeginAndEndTime: "ВремяНачалаИКонца",
  DontDisplay: "НеОтображать",
} as const

export const PlannerItemsTimeRepresentationFromYAML = {
  ВремяНачала: "BeginTime",
  ВремяНачалаИКонца: "BeginAndEndTime",
  НеОтображать: "DontDisplay",
} as const

export type PlannerItemsTimeRepresentation = keyof typeof PlannerItemsTimeRepresentationToYAML
export type PlannerItemsTimeRepresentationYAML = keyof typeof PlannerItemsTimeRepresentationFromYAML

export const PlannerStandardCommandToYAML = {
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

export const PlannerStandardCommandFromYAML = {
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

export type PlannerStandardCommand = keyof typeof PlannerStandardCommandToYAML
export type PlannerStandardCommandYAML = keyof typeof PlannerStandardCommandFromYAML

export const JSONCharactersEscapeModeToYAML = {
  None: "Нет",
  NotASCIISymbols: "СимволыВнеASCII",
  SymbolsNotInBMP: "СимволыВнеBMP",
} as const

export const JSONCharactersEscapeModeFromYAML = {
  Нет: "None",
  СимволыВнеASCII: "NotASCIISymbols",
  СимволыВнеBMP: "SymbolsNotInBMP",
} as const

export type JSONCharactersEscapeMode = keyof typeof JSONCharactersEscapeModeToYAML
export type JSONCharactersEscapeModeYAML = keyof typeof JSONCharactersEscapeModeFromYAML

export const JSONDateFormatToYAML = {
  ISO: "ISO",
  JavaScript: "JavaScript",
  Microsoft: "Microsoft",
} as const

export const JSONDateFormatFromYAML = {
  ISO: "ISO",
  JavaScript: "JavaScript",
  Microsoft: "Microsoft",
} as const

export type JSONDateFormat = keyof typeof JSONDateFormatToYAML
export type JSONDateFormatYAML = keyof typeof JSONDateFormatFromYAML

export const JSONDateWritingVariantToYAML = {
  LocalDate: "ЛокальнаяДата",
  LocalDateWithOffset: "ЛокальнаяДатаСоСмещением",
  UniversalDate: "УниверсальнаяДата",
} as const

export const JSONDateWritingVariantFromYAML = {
  ЛокальнаяДата: "LocalDate",
  ЛокальнаяДатаСоСмещением: "LocalDateWithOffset",
  УниверсальнаяДата: "UniversalDate",
} as const

export type JSONDateWritingVariant = keyof typeof JSONDateWritingVariantToYAML
export type JSONDateWritingVariantYAML = keyof typeof JSONDateWritingVariantFromYAML

export const JSONLineBreakToYAML = {
  Unix: "Unix",
  Windows: "Windows",
  Auto: "Авто",
  None: "Нет",
} as const

export const JSONLineBreakFromYAML = {
  Unix: "Unix",
  Windows: "Windows",
  Авто: "Auto",
  Нет: "None",
} as const

export type JSONLineBreak = keyof typeof JSONLineBreakToYAML
export type JSONLineBreakYAML = keyof typeof JSONLineBreakFromYAML

export const JSONValueTypeToYAML = {
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

export const JSONValueTypeFromYAML = {
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

export type JSONValueType = keyof typeof JSONValueTypeToYAML
export type JSONValueTypeYAML = keyof typeof JSONValueTypeFromYAML

export const DeliverableNotificationSendErrorTypeToYAML = {
  UnknownError: "НеизвестнаяОшибка",
  AuthenticationDataError: "ОшибкаДанныхАутентификации",
  SubscriberIDError: "ОшибкаИдентификатораПодписчика",
  DeliverableNotificationServiceConnectionError: "ОшибкаПодключенияКСервисуДоставляемыхУведомлений",
  DeliverableNotificationServiceError: "ОшибкаСервисаДоставляемыхУведомлений",
  NotificationBodyError: "ОшибкаТелаУведомления",
  NotificationsLimitExceeded: "ПревышенЛимитОтправкиУведомлений",
} as const

export const DeliverableNotificationSendErrorTypeFromYAML = {
  НеизвестнаяОшибка: "UnknownError",
  ОшибкаДанныхАутентификации: "AuthenticationDataError",
  ОшибкаИдентификатораПодписчика: "SubscriberIDError",
  ОшибкаПодключенияКСервисуДоставляемыхУведомлений: "DeliverableNotificationServiceConnectionError",
  ОшибкаСервисаДоставляемыхУведомлений: "DeliverableNotificationServiceError",
  ОшибкаТелаУведомления: "NotificationBodyError",
  ПревышенЛимитОтправкиУведомлений: "NotificationsLimitExceeded",
} as const

export type DeliverableNotificationSendErrorType = keyof typeof DeliverableNotificationSendErrorTypeToYAML
export type DeliverableNotificationSendErrorTypeYAML = keyof typeof DeliverableNotificationSendErrorTypeFromYAML

export const DeliverableNotificationSubscriberTypeToYAML = {
  APNS: "APNS",
  FCM: "FCM",
  GCM: "GCM",
  HPK: "HPK",
  RMS: "RMS",
  WNS: "WNS",
} as const

export const DeliverableNotificationSubscriberTypeFromYAML = {
  APNS: "APNS",
  FCM: "FCM",
  GCM: "GCM",
  HPK: "HPK",
  RMS: "RMS",
  WNS: "WNS",
} as const

export type DeliverableNotificationSubscriberType = keyof typeof DeliverableNotificationSubscriberTypeToYAML
export type DeliverableNotificationSubscriberTypeYAML = keyof typeof DeliverableNotificationSubscriberTypeFromYAML

export const SoundAlertToYAML = {
  None: "Нет",
  Default: "ПоУмолчанию",
} as const

export const SoundAlertFromYAML = {
  Нет: "None",
  ПоУмолчанию: "Default",
} as const

export type SoundAlert = keyof typeof SoundAlertToYAML
export type SoundAlertYAML = keyof typeof SoundAlertFromYAML

export const InAppPurchaseServiceToYAML = {
  AppleInAppPurchase: "AppleInAppPurchase",
  GooglePlayInAppBilling: "GooglePlayInAppBilling",
  HuaweiInAppPurchase: "HuaweiInAppPurchase",
  RuStoreInAppPurchase: "RuStoreInAppPurchase",
  WindowsInAppPurchase: "WindowsInAppPurchase",
} as const

export const InAppPurchaseServiceFromYAML = {
  AppleInAppPurchase: "AppleInAppPurchase",
  GooglePlayInAppBilling: "GooglePlayInAppBilling",
  HuaweiInAppPurchase: "HuaweiInAppPurchase",
  RuStoreInAppPurchase: "RuStoreInAppPurchase",
  WindowsInAppPurchase: "WindowsInAppPurchase",
} as const

export type InAppPurchaseService = keyof typeof InAppPurchaseServiceToYAML
export type InAppPurchaseServiceYAML = keyof typeof InAppPurchaseServiceFromYAML

export const InAppPurchaseTypeToYAML = {
  ContentForSale: "КонтентДляПродажи",
  Subscription: "Подписка",
} as const

export const InAppPurchaseTypeFromYAML = {
  КонтентДляПродажи: "ContentForSale",
  Подписка: "Subscription",
} as const

export type InAppPurchaseType = keyof typeof InAppPurchaseTypeToYAML
export type InAppPurchaseTypeYAML = keyof typeof InAppPurchaseTypeFromYAML

export const FTPSecureConnectionUsageLevelToYAML = {
  Auto: "Авто",
  UseIfPossible: "ИспользоватьЕслиВозможно",
  DontUse: "НеИспользовать",
  Require: "Требовать",
  RequireForControl: "ТребоватьДляУправления",
} as const

export const FTPSecureConnectionUsageLevelFromYAML = {
  Авто: "Auto",
  ИспользоватьЕслиВозможно: "UseIfPossible",
  НеИспользовать: "DontUse",
  Требовать: "Require",
  ТребоватьДляУправления: "RequireForControl",
} as const

export type FTPSecureConnectionUsageLevel = keyof typeof FTPSecureConnectionUsageLevelToYAML
export type FTPSecureConnectionUsageLevelYAML = keyof typeof FTPSecureConnectionUsageLevelFromYAML

export const InternetConnectionTypeToYAML = {
  WiFi: "WiFi",
  LAN: "ЛокальнаяСеть",
  NoConnection: "НетСоединения",
  CellularData: "СотовыеДанные",
} as const

export const InternetConnectionTypeFromYAML = {
  WiFi: "WiFi",
  ЛокальнаяСеть: "LAN",
  НетСоединения: "NoConnection",
  СотовыеДанные: "CellularData",
} as const

export type InternetConnectionType = keyof typeof InternetConnectionTypeToYAML
export type InternetConnectionTypeYAML = keyof typeof InternetConnectionTypeFromYAML

export const MacOSCertificateSelectModeToYAML = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const MacOSCertificateSelectModeFromYAML = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type MacOSCertificateSelectMode = keyof typeof MacOSCertificateSelectModeToYAML
export type MacOSCertificateSelectModeYAML = keyof typeof MacOSCertificateSelectModeFromYAML

export const OSCertificateSelectModeToYAML = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const OSCertificateSelectModeFromYAML = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type OSCertificateSelectMode = keyof typeof OSCertificateSelectModeToYAML
export type OSCertificateSelectModeYAML = keyof typeof OSCertificateSelectModeFromYAML

export const RoamingUsageToYAML = {
  Used: "Используется",
  Unknown: "Неизвестно",
  NotUsed: "НеИспользуется",
} as const

export const RoamingUsageFromYAML = {
  Используется: "Used",
  Неизвестно: "Unknown",
  НеИспользуется: "NotUsed",
} as const

export type RoamingUsage = keyof typeof RoamingUsageToYAML
export type RoamingUsageYAML = keyof typeof RoamingUsageFromYAML

export const ServerTLSCertificateRevocationCheckModeToYAML = {
  Auto: "Авто",
  DontCheck: "НеПроверять",
  SoftFail: "Нестрогий",
  Strict: "Строгий",
} as const

export const ServerTLSCertificateRevocationCheckModeFromYAML = {
  Авто: "Auto",
  НеПроверять: "DontCheck",
  Нестрогий: "SoftFail",
  Строгий: "Strict",
} as const

export type ServerTLSCertificateRevocationCheckMode = keyof typeof ServerTLSCertificateRevocationCheckModeToYAML
export type ServerTLSCertificateRevocationCheckModeYAML = keyof typeof ServerTLSCertificateRevocationCheckModeFromYAML

export const WindowsCertificateSelectModeToYAML = {
  Auto: "Авто",
  Choose: "Выбирать",
} as const

export const WindowsCertificateSelectModeFromYAML = {
  Авто: "Auto",
  Выбирать: "Choose",
} as const

export type WindowsCertificateSelectMode = keyof typeof WindowsCertificateSelectModeToYAML
export type WindowsCertificateSelectModeYAML = keyof typeof WindowsCertificateSelectModeFromYAML

export const ByteOrderToYAML = {
  BigEndian: "BigEndian",
  LittleEndian: "LittleEndian",
} as const

export const ByteOrderFromYAML = {
  BigEndian: "BigEndian",
  LittleEndian: "LittleEndian",
} as const

export type ByteOrder = keyof typeof ByteOrderToYAML
export type ByteOrderYAML = keyof typeof ByteOrderFromYAML

export const PositionInStreamToYAML = {
  End: "Конец",
  Begin: "Начало",
  Current: "Текущая",
} as const

export const PositionInStreamFromYAML = {
  Конец: "End",
  Начало: "Begin",
  Текущая: "Current",
} as const

export type PositionInStream = keyof typeof PositionInStreamToYAML
export type PositionInStreamYAML = keyof typeof PositionInStreamFromYAML

export const AdBannerRepresentationToYAML = {
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const AdBannerRepresentationFromYAML = {
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type AdBannerRepresentation = keyof typeof AdBannerRepresentationToYAML
export type AdBannerRepresentationYAML = keyof typeof AdBannerRepresentationFromYAML

export const AdStatusToYAML = {
  ReadyToDisplay: "ГотоваКОтображению",
  Downloading: "Загружается",
  NotDownloaded: "НеЗагружена",
  Displayed: "Отображается",
} as const

export const AdStatusFromYAML = {
  ГотоваКОтображению: "ReadyToDisplay",
  Загружается: "Downloading",
  НеЗагружена: "NotDownloaded",
  Отображается: "Displayed",
} as const

export type AdStatus = keyof typeof AdStatusToYAML
export type AdStatusYAML = keyof typeof AdStatusFromYAML

export const DataLineChangeTypeToYAML = {
  Add: "Добавление",
  Update: "Изменение",
  Move: "Перемещение",
  Delete: "Удаление",
} as const

export const DataLineChangeTypeFromYAML = {
  Добавление: "Add",
  Изменение: "Update",
  Перемещение: "Move",
  Удаление: "Delete",
} as const

export type DataLineChangeType = keyof typeof DataLineChangeTypeToYAML
export type DataLineChangeTypeYAML = keyof typeof DataLineChangeTypeFromYAML

export const RepresentableDocumentBatchFileTypeToYAML = {
  DOCX: "DOCX",
  HTML4: "HTML4",
  HTML5: "HTML5",
  ODS: "ODS",
  PDF: "PDF",
  TXT: "TXT",
  XLS: "XLS",
  XLSX: "XLSX",
} as const

export const RepresentableDocumentBatchFileTypeFromYAML = {
  DOCX: "DOCX",
  HTML4: "HTML4",
  HTML5: "HTML5",
  ODS: "ODS",
  PDF: "PDF",
  TXT: "TXT",
  XLS: "XLS",
  XLSX: "XLSX",
} as const

export type RepresentableDocumentBatchFileType = keyof typeof RepresentableDocumentBatchFileTypeToYAML
export type RepresentableDocumentBatchFileTypeYAML = keyof typeof RepresentableDocumentBatchFileTypeFromYAML

export const ClientApplicationAgentStateToYAML = {
  NotStarted: "НеЗапущен",
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const ClientApplicationAgentStateFromYAML = {
  НеЗапущен: "NotStarted",
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type ClientApplicationAgentState = keyof typeof ClientApplicationAgentStateToYAML
export type ClientApplicationAgentStateYAML = keyof typeof ClientApplicationAgentStateFromYAML

export const DataCompositionDataRelevanceOutputTypeToYAML = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionDataRelevanceOutputTypeFromYAML = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionDataRelevanceOutputType = keyof typeof DataCompositionDataRelevanceOutputTypeToYAML
export type DataCompositionDataRelevanceOutputTypeYAML = keyof typeof DataCompositionDataRelevanceOutputTypeFromYAML

export const DataCompositionDatabaseCopyOutputTypeToYAML = {
  Auto: "Авто",
  Output: "Выводить",
  DontOutput: "НеВыводить",
} as const

export const DataCompositionDatabaseCopyOutputTypeFromYAML = {
  Авто: "Auto",
  Выводить: "Output",
  НеВыводить: "DontOutput",
} as const

export type DataCompositionDatabaseCopyOutputType = keyof typeof DataCompositionDatabaseCopyOutputTypeToYAML
export type DataCompositionDatabaseCopyOutputTypeYAML = keyof typeof DataCompositionDatabaseCopyOutputTypeFromYAML

export const DatabaseCopiesStandardReplicationVersionToYAML = {
  Version1: "Версия1",
  Version2: "Версия2",
} as const

export const DatabaseCopiesStandardReplicationVersionFromYAML = {
  Версия1: "Version1",
  Версия2: "Version2",
} as const

export type DatabaseCopiesStandardReplicationVersion = keyof typeof DatabaseCopiesStandardReplicationVersionToYAML
export type DatabaseCopiesStandardReplicationVersionYAML = keyof typeof DatabaseCopiesStandardReplicationVersionFromYAML

export const DatabaseCopiesUseToYAML = {
  Auto: "Авто",
  PreferUseCopies: "ИспользоватьПреимущественноКопии",
  UseCopiesOnly: "ИспользоватьТолькоКопии",
  DontUseCopies: "НеИспользоватьКопии",
} as const

export const DatabaseCopiesUseFromYAML = {
  Авто: "Auto",
  ИспользоватьПреимущественноКопии: "PreferUseCopies",
  ИспользоватьТолькоКопии: "UseCopiesOnly",
  НеИспользоватьКопии: "DontUseCopies",
} as const

export type DatabaseCopiesUse = keyof typeof DatabaseCopiesUseToYAML
export type DatabaseCopiesUseYAML = keyof typeof DatabaseCopiesUseFromYAML

export const DatabaseCopyContentItemFieldUseToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DatabaseCopyContentItemFieldUseFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DatabaseCopyContentItemFieldUse = keyof typeof DatabaseCopyContentItemFieldUseToYAML
export type DatabaseCopyContentItemFieldUseYAML = keyof typeof DatabaseCopyContentItemFieldUseFromYAML

export const DatabaseCopyDBMSTypeToYAML = {
  MSSQLServer: "MSSQLServer",
  OracleDatabase: "OracleDatabase",
  PostgreSQL: "PostgreSQL",
} as const

export const DatabaseCopyDBMSTypeFromYAML = {
  MSSQLServer: "MSSQLServer",
  OracleDatabase: "OracleDatabase",
  PostgreSQL: "PostgreSQL",
} as const

export type DatabaseCopyDBMSType = keyof typeof DatabaseCopyDBMSTypeToYAML
export type DatabaseCopyDBMSTypeYAML = keyof typeof DatabaseCopyDBMSTypeFromYAML

export const DatabaseCopyReplicationTypeToYAML = {
  External: "Внешняя",
  Standard: "Стандартная",
} as const

export const DatabaseCopyReplicationTypeFromYAML = {
  Внешняя: "External",
  Стандартная: "Standard",
} as const

export type DatabaseCopyReplicationType = keyof typeof DatabaseCopyReplicationTypeToYAML
export type DatabaseCopyReplicationTypeYAML = keyof typeof DatabaseCopyReplicationTypeFromYAML

export const DatabaseCopyStateToYAML = {
  TurnedOn: "Включена",
  TemporarilyTurnedOff: "ВременноОтключена",
  TurnedOff: "Отключена",
} as const

export const DatabaseCopyStateFromYAML = {
  Включена: "TurnedOn",
  ВременноОтключена: "TemporarilyTurnedOff",
  Отключена: "TurnedOff",
} as const

export type DatabaseCopyState = keyof typeof DatabaseCopyStateToYAML
export type DatabaseCopyStateYAML = keyof typeof DatabaseCopyStateFromYAML

export const DatabaseCopyTurnedOffReasonToYAML = {
  InvalidCopyDatabaseUseVariant: "НедопустимыйВариантИспользованияБазыДанныхКопии",
  DataInconsistency: "НесоответствиеДанных",
  QueryExecutionError: "ОшибкаВыполненияЗапроса",
  DatabaseConnectionError: "ОшибкаСоединенияСБазойДанных",
} as const

export const DatabaseCopyTurnedOffReasonFromYAML = {
  НедопустимыйВариантИспользованияБазыДанныхКопии: "InvalidCopyDatabaseUseVariant",
  НесоответствиеДанных: "DataInconsistency",
  ОшибкаВыполненияЗапроса: "QueryExecutionError",
  ОшибкаСоединенияСБазойДанных: "DatabaseConnectionError",
} as const

export type DatabaseCopyTurnedOffReason = keyof typeof DatabaseCopyTurnedOffReasonToYAML
export type DatabaseCopyTurnedOffReasonYAML = keyof typeof DatabaseCopyTurnedOffReasonFromYAML

export const DatabaseCopyUpdateStateToYAML = {
  InitialUpdateInProgress: "ВыполняетсяНачальноеОбновление",
  CurrentUpdateInProgress: "ВыполняетсяТекущееОбновление",
  PortionUpdateCompletedSuccessfully: "ЗавершеноОбновлениеПорцииУспешно",
  CompletedWithError: "ЗавершеноСОшибкой",
  CompletedSuccessfully: "ЗавершеноУспешно",
  Inactive: "Неактивно",
} as const

export const DatabaseCopyUpdateStateFromYAML = {
  ВыполняетсяНачальноеОбновление: "InitialUpdateInProgress",
  ВыполняетсяТекущееОбновление: "CurrentUpdateInProgress",
  ЗавершеноОбновлениеПорцииУспешно: "PortionUpdateCompletedSuccessfully",
  ЗавершеноСОшибкой: "CompletedWithError",
  ЗавершеноУспешно: "CompletedSuccessfully",
  Неактивно: "Inactive",
} as const

export type DatabaseCopyUpdateState = keyof typeof DatabaseCopyUpdateStateToYAML
export type DatabaseCopyUpdateStateYAML = keyof typeof DatabaseCopyUpdateStateFromYAML

export const RequiredDataRelevanceToYAML = {
  Auto: "Авто",
  Relevant: "Актуальные",
  Any: "Любые",
} as const

export const RequiredDataRelevanceFromYAML = {
  Авто: "Auto",
  Актуальные: "Relevant",
  Любые: "Any",
} as const

export type RequiredDataRelevance = keyof typeof RequiredDataRelevanceToYAML
export type RequiredDataRelevanceYAML = keyof typeof RequiredDataRelevanceFromYAML

export const CollaborationSystemCommandSourceToYAML = {
  Attachment: "Вложение",
  Action: "Действие",
  URL: "НавигационнаяСсылка",
  CurrentPageURL: "НавигационнаяСсылкаТекущейСтраницы",
  User: "Пользователь",
  Message: "Сообщение",
} as const

export const CollaborationSystemCommandSourceFromYAML = {
  Вложение: "Attachment",
  Действие: "Action",
  НавигационнаяСсылка: "URL",
  НавигационнаяСсылкаТекущейСтраницы: "CurrentPageURL",
  Пользователь: "User",
  Сообщение: "Message",
} as const

export type CollaborationSystemCommandSource = keyof typeof CollaborationSystemCommandSourceToYAML
export type CollaborationSystemCommandSourceYAML = keyof typeof CollaborationSystemCommandSourceFromYAML

export const CollaborationSystemDataDumpStatusToYAML = {
  Restoring: "Восстановление",
  Done: "Готово",
  Loading: "Загрузка",
  Error: "Ошибка",
  Creating: "Создание",
} as const

export const CollaborationSystemDataDumpStatusFromYAML = {
  Восстановление: "Restoring",
  Готово: "Done",
  Загрузка: "Loading",
  Ошибка: "Error",
  Создание: "Creating",
} as const

export type CollaborationSystemDataDumpStatus = keyof typeof CollaborationSystemDataDumpStatusToYAML
export type CollaborationSystemDataDumpStatusYAML = keyof typeof CollaborationSystemDataDumpStatusFromYAML

export const CollaborationSystemFromDataDumpRestoreStatusToYAML = {
  Error: "Ошибка",
  Success: "Успешно",
} as const

export const CollaborationSystemFromDataDumpRestoreStatusFromYAML = {
  Ошибка: "Error",
  Успешно: "Success",
} as const

export type CollaborationSystemFromDataDumpRestoreStatus =
  keyof typeof CollaborationSystemFromDataDumpRestoreStatusToYAML
export type CollaborationSystemFromDataDumpRestoreStatusYAML =
  keyof typeof CollaborationSystemFromDataDumpRestoreStatusFromYAML

export const CollaborationSystemMessageButtonPanelButtonActionToYAML = {
  RequestLocation: "ЗапроситьМестоположение",
  RequestPhone: "ЗапроситьТелефон",
  ProcessByBot: "ОбработатьБотом",
  ProcessOnClient: "ОбработатьНаКлиенте",
  SendMessage: "ОтправитьСообщение",
  SendMessageWithData: "ОтправитьСообщениеСДанными",
  GotoURL: "ПерейтиПоНавигационнойСсылке",
} as const

export const CollaborationSystemMessageButtonPanelButtonActionFromYAML = {
  ЗапроситьМестоположение: "RequestLocation",
  ЗапроситьТелефон: "RequestPhone",
  ОбработатьБотом: "ProcessByBot",
  ОбработатьНаКлиенте: "ProcessOnClient",
  ОтправитьСообщение: "SendMessage",
  ОтправитьСообщениеСДанными: "SendMessageWithData",
  ПерейтиПоНавигационнойСсылке: "GotoURL",
} as const

export type CollaborationSystemMessageButtonPanelButtonAction =
  keyof typeof CollaborationSystemMessageButtonPanelButtonActionToYAML
export type CollaborationSystemMessageButtonPanelButtonActionYAML =
  keyof typeof CollaborationSystemMessageButtonPanelButtonActionFromYAML

export const CollaborationSystemMessageButtonPanelButtonTypeToYAML = {
  Hyperlink: "Гиперссылка",
  UsualButton: "ОбычнаяКнопка",
} as const

export const CollaborationSystemMessageButtonPanelButtonTypeFromYAML = {
  Гиперссылка: "Hyperlink",
  ОбычнаяКнопка: "UsualButton",
} as const

export type CollaborationSystemMessageButtonPanelButtonType =
  keyof typeof CollaborationSystemMessageButtonPanelButtonTypeToYAML
export type CollaborationSystemMessageButtonPanelButtonTypeYAML =
  keyof typeof CollaborationSystemMessageButtonPanelButtonTypeFromYAML

export const CollaborationSystemNotificationRepresentationToYAML = {
  DontDisturb: "НеБеспокоить",
  Normal: "Обычное",
} as const

export const CollaborationSystemNotificationRepresentationFromYAML = {
  НеБеспокоить: "DontDisturb",
  Обычное: "Normal",
} as const

export type CollaborationSystemNotificationRepresentation =
  keyof typeof CollaborationSystemNotificationRepresentationToYAML
export type CollaborationSystemNotificationRepresentationYAML =
  keyof typeof CollaborationSystemNotificationRepresentationFromYAML

export const CollaborationSystemStandardCommandToYAML = {
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

export const CollaborationSystemStandardCommandFromYAML = {
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

export type CollaborationSystemStandardCommand = keyof typeof CollaborationSystemStandardCommandToYAML
export type CollaborationSystemStandardCommandYAML = keyof typeof CollaborationSystemStandardCommandFromYAML

export const CollaborationSystemUsersChoicePurposeToYAML = {
  MessageRecipient: "ПолучательСообщения",
  VideoconferenceParticipant: "УчастникВидеоконференции",
  ConversationMember: "УчастникОбсуждения",
} as const

export const CollaborationSystemUsersChoicePurposeFromYAML = {
  ПолучательСообщения: "MessageRecipient",
  УчастникВидеоконференции: "VideoconferenceParticipant",
  УчастникОбсуждения: "ConversationMember",
} as const

export type CollaborationSystemUsersChoicePurpose = keyof typeof CollaborationSystemUsersChoicePurposeToYAML
export type CollaborationSystemUsersChoicePurposeYAML = keyof typeof CollaborationSystemUsersChoicePurposeFromYAML

export const AdministrationActionOnResourceConsumptionLimitExcessToYAML = {
  TerminateSession: "ЗавершитьСеанс",
  None: "Нет",
  InterruptCurrentServerCall: "ПрерватьТекущийСерверныйВызов",
  SetThreadLowPriority: "УстановитьНизкийПриоритетПотока",
} as const

export const AdministrationActionOnResourceConsumptionLimitExcessFromYAML = {
  ЗавершитьСеанс: "TerminateSession",
  Нет: "None",
  ПрерватьТекущийСерверныйВызов: "InterruptCurrentServerCall",
  УстановитьНизкийПриоритетПотока: "SetThreadLowPriority",
} as const

export type AdministrationActionOnResourceConsumptionLimitExcess =
  keyof typeof AdministrationActionOnResourceConsumptionLimitExcessToYAML
export type AdministrationActionOnResourceConsumptionLimitExcessYAML =
  keyof typeof AdministrationActionOnResourceConsumptionLimitExcessFromYAML

export const AdministrationAssignmentRuleTypeToYAML = {
  Auto: "Авто",
  Assign: "Назначать",
  DontAssign: "НеНазначать",
} as const

export const AdministrationAssignmentRuleTypeFromYAML = {
  Авто: "Auto",
  Назначать: "Assign",
  НеНазначать: "DontAssign",
} as const

export type AdministrationAssignmentRuleType = keyof typeof AdministrationAssignmentRuleTypeToYAML
export type AdministrationAssignmentRuleTypeYAML = keyof typeof AdministrationAssignmentRuleTypeFromYAML

export const AdministrationConnectionSecurityLevelToYAML = {
  Secure: "Защищенное",
  SecureOnConnect: "ЗащищенноеПриУстановкеСоединения",
  Unsecure: "Незащищенное",
} as const

export const AdministrationConnectionSecurityLevelFromYAML = {
  Защищенное: "Secure",
  ЗащищенноеПриУстановкеСоединения: "SecureOnConnect",
  Незащищенное: "Unsecure",
} as const

export type AdministrationConnectionSecurityLevel = keyof typeof AdministrationConnectionSecurityLevelToYAML
export type AdministrationConnectionSecurityLevelYAML = keyof typeof AdministrationConnectionSecurityLevelFromYAML

export const AdministrationInfoBaseDeletionModeToYAML = {
  DontPerformActionsWithDatabase: "НеВыполнятьДействийСБазойДанных",
  ClearDatabase: "ОчиститьБазуДанных",
  DeleteDatabase: "УдалитьБазуДанных",
} as const

export const AdministrationInfoBaseDeletionModeFromYAML = {
  НеВыполнятьДействийСБазойДанных: "DontPerformActionsWithDatabase",
  ОчиститьБазуДанных: "ClearDatabase",
  УдалитьБазуДанных: "DeleteDatabase",
} as const

export type AdministrationInfoBaseDeletionMode = keyof typeof AdministrationInfoBaseDeletionModeToYAML
export type AdministrationInfoBaseDeletionModeYAML = keyof typeof AdministrationInfoBaseDeletionModeFromYAML

export const AdministrationProcessChoicePriorityToYAML = {
  ByMemory: "ПоПамяти",
  ByPerformance: "ПоПроизводительности",
} as const

export const AdministrationProcessChoicePriorityFromYAML = {
  ПоПамяти: "ByMemory",
  ПоПроизводительности: "ByPerformance",
} as const

export type AdministrationProcessChoicePriority = keyof typeof AdministrationProcessChoicePriorityToYAML
export type AdministrationProcessChoicePriorityYAML = keyof typeof AdministrationProcessChoicePriorityFromYAML

export const AdministrationResourceConsumptionCounterFilterTypeToYAML = {
  All: "Все",
  AllSelected: "ВсеВыбранные",
  AllButSelected: "ВсеКромеВыбранных",
} as const

export const AdministrationResourceConsumptionCounterFilterTypeFromYAML = {
  Все: "All",
  ВсеВыбранные: "AllSelected",
  ВсеКромеВыбранных: "AllButSelected",
} as const

export type AdministrationResourceConsumptionCounterFilterType =
  keyof typeof AdministrationResourceConsumptionCounterFilterTypeToYAML
export type AdministrationResourceConsumptionCounterFilterTypeYAML =
  keyof typeof AdministrationResourceConsumptionCounterFilterTypeFromYAML

export const AdministrationResourceConsumptionCounterGroupTypeToYAML = {
  Users: "Пользователи",
  DataSeparation: "РазделениеДанных",
} as const

export const AdministrationResourceConsumptionCounterGroupTypeFromYAML = {
  Пользователи: "Users",
  РазделениеДанных: "DataSeparation",
} as const

export type AdministrationResourceConsumptionCounterGroupType =
  keyof typeof AdministrationResourceConsumptionCounterGroupTypeToYAML
export type AdministrationResourceConsumptionCounterGroupTypeYAML =
  keyof typeof AdministrationResourceConsumptionCounterGroupTypeFromYAML

export const AdministrationWorkProcessStatusToYAML = {
  Used: "Используется",
  NotUsed: "НеИспользуется",
  Reserve: "Резервный",
} as const

export const AdministrationWorkProcessStatusFromYAML = {
  Используется: "Used",
  НеИспользуется: "NotUsed",
  Резервный: "Reserve",
} as const

export type AdministrationWorkProcessStatus = keyof typeof AdministrationWorkProcessStatusToYAML
export type AdministrationWorkProcessStatusYAML = keyof typeof AdministrationWorkProcessStatusFromYAML

export const DuplexPrintingTypeToYAML = {
  UsePrinterSettings: "ИспользоватьНастройкиПринтера",
  None: "Нет",
  FlipPagesUp: "ПереворотВверх",
  FlipPagesLeft: "ПереворотВлево",
} as const

export const DuplexPrintingTypeFromYAML = {
  ИспользоватьНастройкиПринтера: "UsePrinterSettings",
  Нет: "None",
  ПереворотВверх: "FlipPagesUp",
  ПереворотВлево: "FlipPagesLeft",
} as const

export type DuplexPrintingType = keyof typeof DuplexPrintingTypeToYAML
export type DuplexPrintingTypeYAML = keyof typeof DuplexPrintingTypeFromYAML

export const PageOrientationToYAML = {
  Landscape: "Ландшафт",
  Portrait: "Портрет",
} as const

export const PageOrientationFromYAML = {
  Ландшафт: "Landscape",
  Портрет: "Portrait",
} as const

export type PageOrientation = keyof typeof PageOrientationToYAML
export type PageOrientationYAML = keyof typeof PageOrientationFromYAML

export const PagePlacementAlternationToYAML = {
  Auto: "Авто",
  MirrorOnTop: "ЗеркальноСверху",
  MirrorOnLeft: "ЗеркальноСлева",
  DontUse: "НеИспользовать",
} as const

export const PagePlacementAlternationFromYAML = {
  Авто: "Auto",
  ЗеркальноСверху: "MirrorOnTop",
  ЗеркальноСлева: "MirrorOnLeft",
  НеИспользовать: "DontUse",
} as const

export type PagePlacementAlternation = keyof typeof PagePlacementAlternationToYAML
export type PagePlacementAlternationYAML = keyof typeof PagePlacementAlternationFromYAML

export const PrintAccuracyToYAML = {
  Auto: "Авто",
  Accurate: "Точная",
} as const

export const PrintAccuracyFromYAML = {
  Авто: "Auto",
  Точная: "Accurate",
} as const

export type PrintAccuracy = keyof typeof PrintAccuracyToYAML
export type PrintAccuracyYAML = keyof typeof PrintAccuracyFromYAML

export const SpreadsheetDocumentAreaFillTypeToYAML = {
  Parameter: "Параметр",
  Text: "Текст",
  Template: "Шаблон",
} as const

export const SpreadsheetDocumentAreaFillTypeFromYAML = {
  Параметр: "Parameter",
  Текст: "Text",
  Шаблон: "Template",
} as const

export type SpreadsheetDocumentAreaFillType = keyof typeof SpreadsheetDocumentAreaFillTypeToYAML
export type SpreadsheetDocumentAreaFillTypeYAML = keyof typeof SpreadsheetDocumentAreaFillTypeFromYAML

export const SpreadsheetDocumentCellAreaTypeToYAML = {
  Columns: "Колонки",
  Rectangle: "Прямоугольник",
  Rows: "Строки",
  Table: "Таблица",
} as const

export const SpreadsheetDocumentCellAreaTypeFromYAML = {
  Колонки: "Columns",
  Прямоугольник: "Rectangle",
  Строки: "Rows",
  Таблица: "Table",
} as const

export type SpreadsheetDocumentCellAreaType = keyof typeof SpreadsheetDocumentCellAreaTypeToYAML
export type SpreadsheetDocumentCellAreaTypeYAML = keyof typeof SpreadsheetDocumentCellAreaTypeFromYAML

export const SpreadsheetDocumentCellLineTypeToYAML = {
  LargeDashed: "БольшойПунктир",
  Double: "Двойная",
  None: "НетЛинии",
  ThinDashed: "РедкийПунктир",
  Solid: "Сплошная",
  Dotted: "Точечная",
  ThickDashed: "ЧастыйПунктир",
} as const

export const SpreadsheetDocumentCellLineTypeFromYAML = {
  БольшойПунктир: "LargeDashed",
  Двойная: "Double",
  НетЛинии: "None",
  РедкийПунктир: "ThinDashed",
  Сплошная: "Solid",
  Точечная: "Dotted",
  ЧастыйПунктир: "ThickDashed",
} as const

export type SpreadsheetDocumentCellLineType = keyof typeof SpreadsheetDocumentCellLineTypeToYAML
export type SpreadsheetDocumentCellLineTypeYAML = keyof typeof SpreadsheetDocumentCellLineTypeFromYAML

export const SpreadsheetDocumentDetailUseToYAML = {
  WithoutProcessing: "БезОбработки",
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const SpreadsheetDocumentDetailUseFromYAML = {
  БезОбработки: "WithoutProcessing",
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type SpreadsheetDocumentDetailUse = keyof typeof SpreadsheetDocumentDetailUseToYAML
export type SpreadsheetDocumentDetailUseYAML = keyof typeof SpreadsheetDocumentDetailUseFromYAML

export const SpreadsheetDocumentDrawingLineTypeToYAML = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const SpreadsheetDocumentDrawingLineTypeFromYAML = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type SpreadsheetDocumentDrawingLineType = keyof typeof SpreadsheetDocumentDrawingLineTypeToYAML
export type SpreadsheetDocumentDrawingLineTypeYAML = keyof typeof SpreadsheetDocumentDrawingLineTypeFromYAML

export const SpreadsheetDocumentDrawingTypeToYAML = {
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

export const SpreadsheetDocumentDrawingTypeFromYAML = {
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

export type SpreadsheetDocumentDrawingType = keyof typeof SpreadsheetDocumentDrawingTypeToYAML
export type SpreadsheetDocumentDrawingTypeYAML = keyof typeof SpreadsheetDocumentDrawingTypeFromYAML

export const SpreadsheetDocumentFileTypeToYAML = {
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

export const SpreadsheetDocumentFileTypeFromYAML = {
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

export type SpreadsheetDocumentFileType = keyof typeof SpreadsheetDocumentFileTypeToYAML
export type SpreadsheetDocumentFileTypeYAML = keyof typeof SpreadsheetDocumentFileTypeFromYAML

export const SpreadsheetDocumentGroupHeaderPlacementToYAML = {
  Auto: "Авто",
  End: "Конец",
  Begin: "Начало",
} as const

export const SpreadsheetDocumentGroupHeaderPlacementFromYAML = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Begin",
} as const

export type SpreadsheetDocumentGroupHeaderPlacement = keyof typeof SpreadsheetDocumentGroupHeaderPlacementToYAML
export type SpreadsheetDocumentGroupHeaderPlacementYAML = keyof typeof SpreadsheetDocumentGroupHeaderPlacementFromYAML

export const SpreadsheetDocumentPatternTypeToYAML = {
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

export const SpreadsheetDocumentPatternTypeFromYAML = {
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

export type SpreadsheetDocumentPatternType = keyof typeof SpreadsheetDocumentPatternTypeToYAML
export type SpreadsheetDocumentPatternTypeYAML = keyof typeof SpreadsheetDocumentPatternTypeFromYAML

export const SpreadsheetDocumentPointerTypeToYAML = {
  Regular: "Обычные",
  Special: "Специальные",
} as const

export const SpreadsheetDocumentPointerTypeFromYAML = {
  Обычные: "Regular",
  Специальные: "Special",
} as const

export type SpreadsheetDocumentPointerType = keyof typeof SpreadsheetDocumentPointerTypeToYAML
export type SpreadsheetDocumentPointerTypeYAML = keyof typeof SpreadsheetDocumentPointerTypeFromYAML

export const SpreadsheetDocumentSavedPicturesDensityToYAML = {
  High: "Высокая",
  Original: "Исходная",
  Low: "Низкая",
  Medium: "Средняя",
} as const

export const SpreadsheetDocumentSavedPicturesDensityFromYAML = {
  Высокая: "High",
  Исходная: "Original",
  Низкая: "Low",
  Средняя: "Medium",
} as const

export type SpreadsheetDocumentSavedPicturesDensity = keyof typeof SpreadsheetDocumentSavedPicturesDensityToYAML
export type SpreadsheetDocumentSavedPicturesDensityYAML = keyof typeof SpreadsheetDocumentSavedPicturesDensityFromYAML

export const SpreadsheetDocumentSelectionShowModeTypeToYAML = {
  Always: "Всегда",
  WhenActive: "ПриАктивности",
} as const

export const SpreadsheetDocumentSelectionShowModeTypeFromYAML = {
  Всегда: "Always",
  ПриАктивности: "WhenActive",
} as const

export type SpreadsheetDocumentSelectionShowModeType = keyof typeof SpreadsheetDocumentSelectionShowModeTypeToYAML
export type SpreadsheetDocumentSelectionShowModeTypeYAML = keyof typeof SpreadsheetDocumentSelectionShowModeTypeFromYAML

export const SpreadsheetDocumentShiftTypeToYAML = {
  WithoutShift: "БезСмещения",
  Vertical: "ПоВертикали",
  Horizontal: "ПоГоризонтали",
} as const

export const SpreadsheetDocumentShiftTypeFromYAML = {
  БезСмещения: "WithoutShift",
  ПоВертикали: "Vertical",
  ПоГоризонтали: "Horizontal",
} as const

export type SpreadsheetDocumentShiftType = keyof typeof SpreadsheetDocumentShiftTypeToYAML
export type SpreadsheetDocumentShiftTypeYAML = keyof typeof SpreadsheetDocumentShiftTypeFromYAML

export const SpreadsheetDocumentStepDirectionTypeToYAML = {
  WithoutMove: "БезПерехода",
  ByColumns: "ПоКолонкам",
  ByRows: "ПоСтрокам",
} as const

export const SpreadsheetDocumentStepDirectionTypeFromYAML = {
  БезПерехода: "WithoutMove",
  ПоКолонкам: "ByColumns",
  ПоСтрокам: "ByRows",
} as const

export type SpreadsheetDocumentStepDirectionType = keyof typeof SpreadsheetDocumentStepDirectionTypeToYAML
export type SpreadsheetDocumentStepDirectionTypeYAML = keyof typeof SpreadsheetDocumentStepDirectionTypeFromYAML

export const SpreadsheetDocumentTextPlacementTypeToYAML = {
  Auto: "Авто",
  Block: "Забивать",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const SpreadsheetDocumentTextPlacementTypeFromYAML = {
  Авто: "Auto",
  Забивать: "Block",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type SpreadsheetDocumentTextPlacementType = keyof typeof SpreadsheetDocumentTextPlacementTypeToYAML
export type SpreadsheetDocumentTextPlacementTypeYAML = keyof typeof SpreadsheetDocumentTextPlacementTypeFromYAML

export const SpreadsheetDocumentValuesReadingModeToYAML = {
  Value: "Значение",
  Text: "Текст",
} as const

export const SpreadsheetDocumentValuesReadingModeFromYAML = {
  Значение: "Value",
  Текст: "Text",
} as const

export type SpreadsheetDocumentValuesReadingMode = keyof typeof SpreadsheetDocumentValuesReadingModeToYAML
export type SpreadsheetDocumentValuesReadingModeYAML = keyof typeof SpreadsheetDocumentValuesReadingModeFromYAML

export const TextPositionRelativeToPictureToYAML = {
  Auto: "Авто",
  OnTop: "Поверх",
  Top: "Сверху",
  Left: "Слева",
  Bottom: "Снизу",
  Right: "Справа",
} as const

export const TextPositionRelativeToPictureFromYAML = {
  Авто: "Auto",
  Поверх: "OnTop",
  Сверху: "Top",
  Слева: "Left",
  Снизу: "Bottom",
  Справа: "Right",
} as const

export type TextPositionRelativeToPicture = keyof typeof TextPositionRelativeToPictureToYAML
export type TextPositionRelativeToPictureYAML = keyof typeof TextPositionRelativeToPictureFromYAML

export const UseSpreadsheetDocumentWidthReductionToYAML = {
  Auto: "Авто",
  DoNotReduceOnExcess: "ПриПревышенииНеСжимать",
  ReduceToMinimumOnExcess: "ПриПревышенииСжиматьДоМинимума",
  ReduceAlways: "СжиматьВсегда",
} as const

export const UseSpreadsheetDocumentWidthReductionFromYAML = {
  Авто: "Auto",
  ПриПревышенииНеСжимать: "DoNotReduceOnExcess",
  ПриПревышенииСжиматьДоМинимума: "ReduceToMinimumOnExcess",
  СжиматьВсегда: "ReduceAlways",
} as const

export type UseSpreadsheetDocumentWidthReduction = keyof typeof UseSpreadsheetDocumentWidthReductionToYAML
export type UseSpreadsheetDocumentWidthReductionYAML = keyof typeof UseSpreadsheetDocumentWidthReductionFromYAML

export const PivotTableColumnTotalPositionToYAML = {
  Left: "Лево",
  Right: "Право",
} as const

export const PivotTableColumnTotalPositionFromYAML = {
  Лево: "Left",
  Право: "Right",
} as const

export type PivotTableColumnTotalPosition = keyof typeof PivotTableColumnTotalPositionToYAML
export type PivotTableColumnTotalPositionYAML = keyof typeof PivotTableColumnTotalPositionFromYAML

export const PivotTableLinesShowTypeToYAML = {
  Auto: "Авто",
  Always: "Всегда",
} as const

export const PivotTableLinesShowTypeFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
} as const

export type PivotTableLinesShowType = keyof typeof PivotTableLinesShowTypeToYAML
export type PivotTableLinesShowTypeYAML = keyof typeof PivotTableLinesShowTypeFromYAML

export const PivotTableRowTotalPositionToYAML = {
  Top: "Верх",
  Bottom: "Низ",
} as const

export const PivotTableRowTotalPositionFromYAML = {
  Верх: "Top",
  Низ: "Bottom",
} as const

export type PivotTableRowTotalPosition = keyof typeof PivotTableRowTotalPositionToYAML
export type PivotTableRowTotalPositionYAML = keyof typeof PivotTableRowTotalPositionFromYAML

export const QueryRecordTypeToYAML = {
  DetailRecord: "ДетальнаяЗапись",
  GroupTotal: "ИтогПоГруппировке",
  TotalByHierarchy: "ИтогПоИерархии",
  Overall: "ОбщийИтог",
} as const

export const QueryRecordTypeFromYAML = {
  ДетальнаяЗапись: "DetailRecord",
  ИтогПоГруппировке: "GroupTotal",
  ИтогПоИерархии: "TotalByHierarchy",
  ОбщийИтог: "Overall",
} as const

export type QueryRecordType = keyof typeof QueryRecordTypeToYAML
export type QueryRecordTypeYAML = keyof typeof QueryRecordTypeFromYAML

export const QueryResultIterationToYAML = {
  ByGroups: "ПоГруппировкам",
  ByGroupsWithHierarchy: "ПоГруппировкамСИерархией",
  Linear: "Прямой",
} as const

export const QueryResultIterationFromYAML = {
  ПоГруппировкам: "ByGroups",
  ПоГруппировкамСИерархией: "ByGroupsWithHierarchy",
  Прямой: "Linear",
} as const

export type QueryResultIteration = keyof typeof QueryResultIterationToYAML
export type QueryResultIterationYAML = keyof typeof QueryResultIterationFromYAML

export const ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodToYAML = {
  StronglyConnectedComponents: "КомпонентыСильнойСвязности",
  StronglyConnectedComponentsWithNoInnerConnectionRequired:
    "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент",
  WeaklyConnectedComponents: "КомпонентыСлабойСвязности",
} as const

export const ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodFromYAML = {
  КомпонентыСильнойСвязности: "StronglyConnectedComponents",
  КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент:
    "StronglyConnectedComponentsWithNoInnerConnectionRequired",
  КомпонентыСлабойСвязности: "WeaklyConnectedComponents",
} as const

export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod =
  keyof typeof ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodToYAML
export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodYAML =
  keyof typeof ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodFromYAML

export const AdditionalUserVerificationMethodToYAML = {
  BiometricsOrPassword: "БиометрическаяИлиВводПароля",
  BiometricsOnly: "ТолькоБиометрическая",
} as const

export const AdditionalUserVerificationMethodFromYAML = {
  БиометрическаяИлиВводПароля: "BiometricsOrPassword",
  ТолькоБиометрическая: "BiometricsOnly",
} as const

export type AdditionalUserVerificationMethod = keyof typeof AdditionalUserVerificationMethodToYAML
export type AdditionalUserVerificationMethodYAML = keyof typeof AdditionalUserVerificationMethodFromYAML

export const BiometricVerificationMethodToYAML = {
  None: "Нет",
  FaceRecognition: "РаспознаваниеЛица",
  FingerprintRecognition: "РаспознаваниеОтпечаткаПальца",
  IrisRecognition: "РаспознаваниеРадужнойОболочкиГлаза",
} as const

export const BiometricVerificationMethodFromYAML = {
  Нет: "None",
  РаспознаваниеЛица: "FaceRecognition",
  РаспознаваниеОтпечаткаПальца: "FingerprintRecognition",
  РаспознаваниеРадужнойОболочкиГлаза: "IrisRecognition",
} as const

export type BiometricVerificationMethod = keyof typeof BiometricVerificationMethodToYAML
export type BiometricVerificationMethodYAML = keyof typeof BiometricVerificationMethodFromYAML

export const SecureStorageAccessProtectionMethodToYAML = {
  None: "Нет",
  AdditionalUserVerificationRequired: "ТребуетсяДополнительнаяПроверкаПользователя",
  ScreenUnlockRequired: "ТребуетсяРазблокировкаЭкрана",
} as const

export const SecureStorageAccessProtectionMethodFromYAML = {
  Нет: "None",
  ТребуетсяДополнительнаяПроверкаПользователя: "AdditionalUserVerificationRequired",
  ТребуетсяРазблокировкаЭкрана: "ScreenUnlockRequired",
} as const

export type SecureStorageAccessProtectionMethod = keyof typeof SecureStorageAccessProtectionMethodToYAML
export type SecureStorageAccessProtectionMethodYAML = keyof typeof SecureStorageAccessProtectionMethodFromYAML

export const ErrorCategoryToYAML = {
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

export const ErrorCategoryFromYAML = {
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

export type ErrorCategory = keyof typeof ErrorCategoryToYAML
export type ErrorCategoryYAML = keyof typeof ErrorCategoryFromYAML

export const ErrorMessageDisplayVariantToYAML = {
  Auto: "Авто",
  BriefErrorDescription: "КраткоеПредставлениеОшибки",
  DetailErrorDescription: "ПодробноеПредставлениеОшибки",
  ErrorMessageForUser: "СообщениеОбОшибкеДляПользователя",
} as const

export const ErrorMessageDisplayVariantFromYAML = {
  Авто: "Auto",
  КраткоеПредставлениеОшибки: "BriefErrorDescription",
  ПодробноеПредставлениеОшибки: "DetailErrorDescription",
  СообщениеОбОшибкеДляПользователя: "ErrorMessageForUser",
} as const

export type ErrorMessageDisplayVariant = keyof typeof ErrorMessageDisplayVariantToYAML
export type ErrorMessageDisplayVariantYAML = keyof typeof ErrorMessageDisplayVariantFromYAML

export const ErrorReportingModeToYAML = {
  Auto: "Авто",
  DontSend: "НеОтправлять",
  Send: "Отправлять",
  AskUser: "СпрашиватьПользователя",
} as const

export const ErrorReportingModeFromYAML = {
  Авто: "Auto",
  НеОтправлять: "DontSend",
  Отправлять: "Send",
  СпрашиватьПользователя: "AskUser",
} as const

export type ErrorReportingMode = keyof typeof ErrorReportingModeToYAML
export type ErrorReportingModeYAML = keyof typeof ErrorReportingModeFromYAML

export const MobileClientSignatureVerificationMethodToYAML = {
  DoNotVerifySignature: "НеВыполнятьПроверкуПодписи",
  CheckMobileClientUsageAbility: "ПроверятьВозможностьИспользованияМобильногоКлиента",
  CheckConfigurationSignatureForExactMatch: "ПроверятьТочноеСоответствиеПодписиКонфигурации",
} as const

export const MobileClientSignatureVerificationMethodFromYAML = {
  НеВыполнятьПроверкуПодписи: "DoNotVerifySignature",
  ПроверятьВозможностьИспользованияМобильногоКлиента: "CheckMobileClientUsageAbility",
  ПроверятьТочноеСоответствиеПодписиКонфигурации: "CheckConfigurationSignatureForExactMatch",
} as const

export type MobileClientSignatureVerificationMethod = keyof typeof MobileClientSignatureVerificationMethodToYAML
export type MobileClientSignatureVerificationMethodYAML = keyof typeof MobileClientSignatureVerificationMethodFromYAML

export const OnMainServerUnavalableBehaviorToYAML = {
  Auto: "Авто",
  DontChangeBehavior: "НеИзменятьПоведение",
  MakeDisable: "ОтключитьДоступность",
} as const

export const OnMainServerUnavalableBehaviorFromYAML = {
  Авто: "Auto",
  НеИзменятьПоведение: "DontChangeBehavior",
  ОтключитьДоступность: "MakeDisable",
} as const

export type OnMainServerUnavalableBehavior = keyof typeof OnMainServerUnavalableBehaviorToYAML
export type OnMainServerUnavalableBehaviorYAML = keyof typeof OnMainServerUnavalableBehaviorFromYAML

export const UsedServerToYAML = {
  Standalone: "Автономный",
  Main: "Основной",
} as const

export const UsedServerFromYAML = {
  Автономный: "Standalone",
  Основной: "Main",
} as const

export type UsedServer = keyof typeof UsedServerToYAML
export type UsedServerYAML = keyof typeof UsedServerFromYAML

export const PDFAttachmentRelationshipTypeToYAML = {
  Alternative: "Альтернатива",
  Data: "Данные",
  Supplement: "Дополнение",
  Source: "Источник",
  Unspecified: "НеУстановлено",
} as const

export const PDFAttachmentRelationshipTypeFromYAML = {
  Альтернатива: "Alternative",
  Данные: "Data",
  Дополнение: "Supplement",
  Источник: "Source",
  НеУстановлено: "Unspecified",
} as const

export type PDFAttachmentRelationshipType = keyof typeof PDFAttachmentRelationshipTypeToYAML
export type PDFAttachmentRelationshipTypeYAML = keyof typeof PDFAttachmentRelationshipTypeFromYAML

export const PDFDocumentFileTypeToYAML = {
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
} as const

export const PDFDocumentFileTypeFromYAML = {
  PDF: "PDF",
  PDF_A_1: "PDF_A_1",
  PDF_A_2: "PDF_A_2",
  PDF_A_3: "PDF_A_3",
} as const

export type PDFDocumentFileType = keyof typeof PDFDocumentFileTypeToYAML
export type PDFDocumentFileTypeYAML = keyof typeof PDFDocumentFileTypeFromYAML

export const PDFModificationAccessPermissionsToYAML = {
  FillingSigning: "ЗаполнениеПодписание",
  FillingSigningAnnotation: "ЗаполнениеПодписаниеАннотирование",
  None: "Нет",
} as const

export const PDFModificationAccessPermissionsFromYAML = {
  ЗаполнениеПодписание: "FillingSigning",
  ЗаполнениеПодписаниеАннотирование: "FillingSigningAnnotation",
  Нет: "None",
} as const

export type PDFModificationAccessPermissions = keyof typeof PDFModificationAccessPermissionsToYAML
export type PDFModificationAccessPermissionsYAML = keyof typeof PDFModificationAccessPermissionsFromYAML

export const PDFSignatureTypeToYAML = {
  Certifying: "Сертифицирующая",
  Approving: "Утверждающая",
} as const

export const PDFSignatureTypeFromYAML = {
  Сертифицирующая: "Certifying",
  Утверждающая: "Approving",
} as const

export type PDFSignatureType = keyof typeof PDFSignatureTypeToYAML
export type PDFSignatureTypeYAML = keyof typeof PDFSignatureTypeFromYAML

export const ProgressiveWebApplicationModeToYAML = {
  InBrowserWindow: "ВОкнеБраузера",
  InStandaloneWindow: "ВОтдельномОкне",
} as const

export const ProgressiveWebApplicationModeFromYAML = {
  ВОкнеБраузера: "InBrowserWindow",
  ВОтдельномОкне: "InStandaloneWindow",
} as const

export type ProgressiveWebApplicationMode = keyof typeof ProgressiveWebApplicationModeToYAML
export type ProgressiveWebApplicationModeYAML = keyof typeof ProgressiveWebApplicationModeFromYAML

export const AdditionalShowModeToYAML = {
  Irrelevance: "Неактуальность",
  DontUse: "НеИспользовать",
} as const

export const AdditionalShowModeFromYAML = {
  Неактуальность: "Irrelevance",
  НеИспользовать: "DontUse",
} as const

export type AdditionalShowMode = keyof typeof AdditionalShowModeToYAML
export type AdditionalShowModeYAML = keyof typeof AdditionalShowModeFromYAML

export const AppearanceAreaTypeToYAML = {
  Group: "Группировка",
  Field: "Поле",
} as const

export const AppearanceAreaTypeFromYAML = {
  Группировка: "Group",
  Поле: "Field",
} as const

export type AppearanceAreaType = keyof typeof AppearanceAreaTypeToYAML
export type AppearanceAreaTypeYAML = keyof typeof AppearanceAreaTypeFromYAML

export const ArrowStyleToYAML = {
  Filled: "Заполненная",
  Blank: "Незаполненная",
  None: "Нет",
} as const

export const ArrowStyleFromYAML = {
  Заполненная: "Filled",
  Незаполненная: "Blank",
  Нет: "None",
} as const

export type ArrowStyle = keyof typeof ArrowStyleToYAML
export type ArrowStyleYAML = keyof typeof ArrowStyleFromYAML

export const AutoCapitalizationOnTextInputToYAML = {
  Auto: "Авто",
  AllCharacters: "ВсеСимволы",
  None: "Нет",
  Sentences: "Предложения",
  Words: "Слова",
} as const

export const AutoCapitalizationOnTextInputFromYAML = {
  Авто: "Auto",
  ВсеСимволы: "AllCharacters",
  Нет: "None",
  Предложения: "Sentences",
  Слова: "Words",
} as const

export type AutoCapitalizationOnTextInput = keyof typeof AutoCapitalizationOnTextInputToYAML
export type AutoCapitalizationOnTextInputYAML = keyof typeof AutoCapitalizationOnTextInputFromYAML

export const AutoCorrectionOnTextInputToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const AutoCorrectionOnTextInputFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type AutoCorrectionOnTextInput = keyof typeof AutoCorrectionOnTextInputToYAML
export type AutoCorrectionOnTextInputYAML = keyof typeof AutoCorrectionOnTextInputFromYAML

export const AutoSaveFormDataInSettingsToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const AutoSaveFormDataInSettingsFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type AutoSaveFormDataInSettings = keyof typeof AutoSaveFormDataInSettingsToYAML
export type AutoSaveFormDataInSettingsYAML = keyof typeof AutoSaveFormDataInSettingsFromYAML

export const AutoShowClearButtonModeToYAML = {
  Auto: "Авто",
  Always: "Всегда",
  FilledOnly: "ТолькоДляЗаполненного",
} as const

export const AutoShowClearButtonModeFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
  ТолькоДляЗаполненного: "FilledOnly",
} as const

export type AutoShowClearButtonMode = keyof typeof AutoShowClearButtonModeToYAML
export type AutoShowClearButtonModeYAML = keyof typeof AutoShowClearButtonModeFromYAML

export const AutoShowOpenButtonModeToYAML = {
  Auto: "Авто",
  Always: "Всегда",
  FilledOnly: "ТолькоДляЗаполненного",
} as const

export const AutoShowOpenButtonModeFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
  ТолькоДляЗаполненного: "FilledOnly",
} as const

export type AutoShowOpenButtonMode = keyof typeof AutoShowOpenButtonModeToYAML
export type AutoShowOpenButtonModeYAML = keyof typeof AutoShowOpenButtonModeFromYAML

export const AutoShowStateModeToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
  ShowOnComposition: "ОтображатьПриФормировании",
} as const

export const AutoShowStateModeFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
  ОтображатьПриФормировании: "ShowOnComposition",
} as const

export type AutoShowStateMode = keyof typeof AutoShowStateModeToYAML
export type AutoShowStateModeYAML = keyof typeof AutoShowStateModeFromYAML

export const AutonumerationInFormToYAML = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const AutonumerationInFormFromYAML = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type AutonumerationInForm = keyof typeof AutonumerationInFormToYAML
export type AutonumerationInFormYAML = keyof typeof AutonumerationInFormFromYAML

export const ButtonGroupRepresentationToYAML = {
  Auto: "Авто",
  Compact: "Компактное",
  Usual: "Обычное",
} as const

export const ButtonGroupRepresentationFromYAML = {
  Авто: "Auto",
  Компактное: "Compact",
  Обычное: "Usual",
} as const

export type ButtonGroupRepresentation = keyof typeof ButtonGroupRepresentationToYAML
export type ButtonGroupRepresentationYAML = keyof typeof ButtonGroupRepresentationFromYAML

export const ButtonLocationInCommandBarToYAML = {
  Auto: "Авто",
  InAdditionalSubmenu: "ВДополнительномПодменю",
  InCommandBar: "ВКоманднойПанели",
  InCommandBarAndInAdditionalSubmenu: "ВКоманднойПанелиИВДополнительномПодменю",
} as const

export const ButtonLocationInCommandBarFromYAML = {
  Авто: "Auto",
  ВДополнительномПодменю: "InAdditionalSubmenu",
  ВКоманднойПанели: "InCommandBar",
  ВКоманднойПанелиИВДополнительномПодменю: "InCommandBarAndInAdditionalSubmenu",
} as const

export type ButtonLocationInCommandBar = keyof typeof ButtonLocationInCommandBarToYAML
export type ButtonLocationInCommandBarYAML = keyof typeof ButtonLocationInCommandBarFromYAML

export const ButtonPictureLocationToYAML = {
  Left: "Лево",
  Right: "Право",
} as const

export const ButtonPictureLocationFromYAML = {
  Лево: "Left",
  Право: "Right",
} as const

export type ButtonPictureLocation = keyof typeof ButtonPictureLocationToYAML
export type ButtonPictureLocationYAML = keyof typeof ButtonPictureLocationFromYAML

export const ButtonRepresentationToYAML = {
  Auto: "Авто",
  Picture: "Картинка",
  PictureAndText: "КартинкаИТекст",
  Text: "Текст",
} as const

export const ButtonRepresentationFromYAML = {
  Авто: "Auto",
  Картинка: "Picture",
  КартинкаИТекст: "PictureAndText",
  Текст: "Text",
} as const

export type ButtonRepresentation = keyof typeof ButtonRepresentationToYAML
export type ButtonRepresentationYAML = keyof typeof ButtonRepresentationFromYAML

export const ButtonShapeToYAML = {
  Auto: "Авто",
  Usual: "Обычная",
  Oval: "Овал",
} as const

export const ButtonShapeFromYAML = {
  Авто: "Auto",
  Обычная: "Usual",
  Овал: "Oval",
} as const

export type ButtonShape = keyof typeof ButtonShapeToYAML
export type ButtonShapeYAML = keyof typeof ButtonShapeFromYAML

export const ButtonShapeRepresentationToYAML = {
  Auto: "Авто",
  Always: "Всегда",
  None: "Нет",
  WhenActive: "ПриАктивности",
} as const

export const ButtonShapeRepresentationFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
  Нет: "None",
  ПриАктивности: "WhenActive",
} as const

export type ButtonShapeRepresentation = keyof typeof ButtonShapeRepresentationToYAML
export type ButtonShapeRepresentationYAML = keyof typeof ButtonShapeRepresentationFromYAML

export const CheckBoxTypeToYAML = {
  Auto: "Авто",
  Switch: "Выключатель",
  Tumbler: "Тумблер",
  CheckBox: "Флажок",
} as const

export const CheckBoxTypeFromYAML = {
  Авто: "Auto",
  Выключатель: "Switch",
  Тумблер: "Tumbler",
  Флажок: "CheckBox",
} as const

export type CheckBoxType = keyof typeof CheckBoxTypeToYAML
export type CheckBoxTypeYAML = keyof typeof CheckBoxTypeFromYAML

export const ChildFormItemsGroupToYAML = {
  Vertical: "Вертикальная",
  Horizontal: "Горизонтальная",
  AlwaysHorizontal: "ГоризонтальнаяВсегда",
  HorizontalIfPossible: "ГоризонтальнаяЕслиВозможно",
} as const

export const ChildFormItemsGroupFromYAML = {
  Вертикальная: "Vertical",
  Горизонтальная: "Horizontal",
  ГоризонтальнаяВсегда: "AlwaysHorizontal",
  ГоризонтальнаяЕслиВозможно: "HorizontalIfPossible",
} as const

export type ChildFormItemsGroup = keyof typeof ChildFormItemsGroupToYAML
export type ChildFormItemsGroupYAML = keyof typeof ChildFormItemsGroupFromYAML

export const ChildFormItemsWidthToYAML = {
  Auto: "Авто",
  LeftNarrowest: "ЛевыйОченьУзкий",
  LeftWidest: "ЛевыйОченьШирокий",
  LeftNarrow: "ЛевыйУзкий",
  LeftWide: "ЛевыйШирокий",
  Equal: "Одинаковая",
} as const

export const ChildFormItemsWidthFromYAML = {
  Авто: "Auto",
  ЛевыйОченьУзкий: "LeftNarrowest",
  ЛевыйОченьШирокий: "LeftWidest",
  ЛевыйУзкий: "LeftNarrow",
  ЛевыйШирокий: "LeftWide",
  Одинаковая: "Equal",
} as const

export type ChildFormItemsWidth = keyof typeof ChildFormItemsWidthToYAML
export type ChildFormItemsWidthYAML = keyof typeof ChildFormItemsWidthFromYAML

export const ChoiceButtonRepresentationToYAML = {
  Auto: "Авто",
  ShowInDropList: "ОтображатьВВыпадающемСписке",
  ShowInDropListAndInInputField: "ОтображатьВВыпадающемСпискеИВПолеВвода",
  ShowInInputField: "ОтображатьВПолеВвода",
} as const

export const ChoiceButtonRepresentationFromYAML = {
  Авто: "Auto",
  ОтображатьВВыпадающемСписке: "ShowInDropList",
  ОтображатьВВыпадающемСпискеИВПолеВвода: "ShowInDropListAndInInputField",
  ОтображатьВПолеВвода: "ShowInInputField",
} as const

export type ChoiceButtonRepresentation = keyof typeof ChoiceButtonRepresentationToYAML
export type ChoiceButtonRepresentationYAML = keyof typeof ChoiceButtonRepresentationFromYAML

export const ChoiceHistoryOnInputToYAML = {
  Auto: "Авто",
  DontUse: "НеИспользовать",
} as const

export const ChoiceHistoryOnInputFromYAML = {
  Авто: "Auto",
  НеИспользовать: "DontUse",
} as const

export type ChoiceHistoryOnInput = keyof typeof ChoiceHistoryOnInputToYAML
export type ChoiceHistoryOnInputYAML = keyof typeof ChoiceHistoryOnInputFromYAML

export const ClipboardDataStandardFormatToYAML = {
  HTML: "HTML",
  Picture: "Картинка",
  Text: "Текст",
} as const

export const ClipboardDataStandardFormatFromYAML = {
  HTML: "HTML",
  Картинка: "Picture",
  Текст: "Text",
} as const

export type ClipboardDataStandardFormat = keyof typeof ClipboardDataStandardFormatToYAML
export type ClipboardDataStandardFormatYAML = keyof typeof ClipboardDataStandardFormatFromYAML

export const CollapseFormItemsByImportanceToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CollapseFormItemsByImportanceFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CollapseFormItemsByImportance = keyof typeof CollapseFormItemsByImportanceToYAML
export type CollapseFormItemsByImportanceYAML = keyof typeof CollapseFormItemsByImportanceFromYAML

export const ColorDepthToYAML = {
  BitPerPixel1: "БитНаПиксел1",
  BitPerPixel24: "БитНаПиксел24",
  BitPerPixel32: "БитНаПиксел32",
  BitPerPixel4: "БитНаПиксел4",
  BitPerPixel8: "БитНаПиксел8",
} as const

export const ColorDepthFromYAML = {
  БитНаПиксел1: "BitPerPixel1",
  БитНаПиксел24: "BitPerPixel24",
  БитНаПиксел32: "BitPerPixel32",
  БитНаПиксел4: "BitPerPixel4",
  БитНаПиксел8: "BitPerPixel8",
} as const

export type ColorDepth = keyof typeof ColorDepthToYAML
export type ColorDepthYAML = keyof typeof ColorDepthFromYAML

export const ColumnEditModeToYAML = {
  Enter: "Вход",
  EnterOnInput: "ВходПриВводе",
  Directly: "Непосредственно",
} as const

export const ColumnEditModeFromYAML = {
  Вход: "Enter",
  ВходПриВводе: "EnterOnInput",
  Непосредственно: "Directly",
} as const

export type ColumnEditMode = keyof typeof ColumnEditModeToYAML
export type ColumnEditModeYAML = keyof typeof ColumnEditModeFromYAML

export const ColumnLocationToYAML = {
  SameColumn: "ВТойЖеКолонке",
  OnNextRow: "НаСледующейСтроке",
  NewColumn: "НоваяКолонка",
} as const

export const ColumnLocationFromYAML = {
  ВТойЖеКолонке: "SameColumn",
  НаСледующейСтроке: "OnNextRow",
  НоваяКолонка: "NewColumn",
} as const

export type ColumnLocation = keyof typeof ColumnLocationToYAML
export type ColumnLocationYAML = keyof typeof ColumnLocationFromYAML

export const ColumnSizeChangeToYAML = {
  Change: "Изменять",
  DontChange: "НеИзменять",
} as const

export const ColumnSizeChangeFromYAML = {
  Изменять: "Change",
  НеИзменять: "DontChange",
} as const

export type ColumnSizeChange = keyof typeof ColumnSizeChangeToYAML
export type ColumnSizeChangeYAML = keyof typeof ColumnSizeChangeFromYAML

export const ColumnsGroupToYAML = {
  Vertical: "Вертикальная",
  InCell: "ВЯчейке",
  Horizontal: "Горизонтальная",
} as const

export const ColumnsGroupFromYAML = {
  Вертикальная: "Vertical",
  ВЯчейке: "InCell",
  Горизонтальная: "Horizontal",
} as const

export type ColumnsGroup = keyof typeof ColumnsGroupToYAML
export type ColumnsGroupYAML = keyof typeof ColumnsGroupFromYAML

export const CommandBarButtonAlignmentToYAML = {
  Left: "Лево",
  Right: "Право",
  Center: "Центр",
} as const

export const CommandBarButtonAlignmentFromYAML = {
  Лево: "Left",
  Право: "Right",
  Центр: "Center",
} as const

export type CommandBarButtonAlignment = keyof typeof CommandBarButtonAlignmentToYAML
export type CommandBarButtonAlignmentYAML = keyof typeof CommandBarButtonAlignmentFromYAML

export const CommandBarButtonOrderToYAML = {
  Asc: "Возр",
  DontOrder: "НеУпорядочивать",
  Desc: "Убыв",
} as const

export const CommandBarButtonOrderFromYAML = {
  Возр: "Asc",
  НеУпорядочивать: "DontOrder",
  Убыв: "Desc",
} as const

export type CommandBarButtonOrder = keyof typeof CommandBarButtonOrderToYAML
export type CommandBarButtonOrderYAML = keyof typeof CommandBarButtonOrderFromYAML

export const CommandBarButtonRepresentationToYAML = {
  Auto: "Авто",
  Picture: "Картинка",
  Text: "Надпись",
  PictureText: "НадписьКартинка",
} as const

export const CommandBarButtonRepresentationFromYAML = {
  Авто: "Auto",
  Картинка: "Picture",
  Надпись: "Text",
  НадписьКартинка: "PictureText",
} as const

export type CommandBarButtonRepresentation = keyof typeof CommandBarButtonRepresentationToYAML
export type CommandBarButtonRepresentationYAML = keyof typeof CommandBarButtonRepresentationFromYAML

export const CommandBarButtonTypeToYAML = {
  Action: "Действие",
  Popup: "Подменю",
  Separator: "Разделитель",
} as const

export const CommandBarButtonTypeFromYAML = {
  Действие: "Action",
  Подменю: "Popup",
  Разделитель: "Separator",
} as const

export type CommandBarButtonType = keyof typeof CommandBarButtonTypeToYAML
export type CommandBarButtonTypeYAML = keyof typeof CommandBarButtonTypeFromYAML

export const CommandGroupCategoryToYAML = {
  FormCommandBar: "КоманднаяПанельФормы",
  ActionsPanel: "ПанельДействий",
  NavigationPanel: "ПанельНавигации",
  FormNavigationPanel: "ПанельНавигацииФормы",
} as const

export const CommandGroupCategoryFromYAML = {
  КоманднаяПанельФормы: "FormCommandBar",
  ПанельДействий: "ActionsPanel",
  ПанельНавигации: "NavigationPanel",
  ПанельНавигацииФормы: "FormNavigationPanel",
} as const

export type CommandGroupCategory = keyof typeof CommandGroupCategoryToYAML
export type CommandGroupCategoryYAML = keyof typeof CommandGroupCategoryFromYAML

export const CommandParameterUseModeToYAML = {
  Multiple: "Множественный",
  Single: "Одиночный",
} as const

export const CommandParameterUseModeFromYAML = {
  Множественный: "Multiple",
  Одиночный: "Single",
} as const

export type CommandParameterUseMode = keyof typeof CommandParameterUseModeToYAML
export type CommandParameterUseModeYAML = keyof typeof CommandParameterUseModeFromYAML

export const ConnectorLineTypeToYAML = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const ConnectorLineTypeFromYAML = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type ConnectorLineType = keyof typeof ConnectorLineTypeToYAML
export type ConnectorLineTypeYAML = keyof typeof ConnectorLineTypeFromYAML

export const ConnectorTextLocationToYAML = {
  FirstSegment: "ПервыйСегмент",
  Middle: "СерединаЛинии",
} as const

export const ConnectorTextLocationFromYAML = {
  ПервыйСегмент: "FirstSegment",
  СерединаЛинии: "Middle",
} as const

export type ConnectorTextLocation = keyof typeof ConnectorTextLocationToYAML
export type ConnectorTextLocationYAML = keyof typeof ConnectorTextLocationFromYAML

export const ControlBorderTypeToYAML = {
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

export const ControlBorderTypeFromYAML = {
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

export type ControlBorderType = keyof typeof ControlBorderTypeToYAML
export type ControlBorderTypeYAML = keyof typeof ControlBorderTypeFromYAML

export const ControlCollapseModeToYAML = {
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const ControlCollapseModeFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type ControlCollapseMode = keyof typeof ControlCollapseModeToYAML
export type ControlCollapseModeYAML = keyof typeof ControlCollapseModeFromYAML

export const ControlEdgeToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const ControlEdgeFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type ControlEdge = keyof typeof ControlEdgeToYAML
export type ControlEdgeYAML = keyof typeof ControlEdgeFromYAML

export const CurrentRowUseToYAML = {
  Auto: "Авто",
  Use: "Использует",
  DontUse: "НеИспользует",
} as const

export const CurrentRowUseFromYAML = {
  Авто: "Auto",
  Использует: "Use",
  НеИспользует: "DontUse",
} as const

export type CurrentRowUse = keyof typeof CurrentRowUseToYAML
export type CurrentRowUseYAML = keyof typeof CurrentRowUseFromYAML

export const DataChangeTypeToYAML = {
  Create: "Добавление",
  Update: "Изменение",
  Delete: "Удаление",
} as const

export const DataChangeTypeFromYAML = {
  Добавление: "Create",
  Изменение: "Update",
  Удаление: "Delete",
} as const

export type DataChangeType = keyof typeof DataChangeTypeToYAML
export type DataChangeTypeYAML = keyof typeof DataChangeTypeFromYAML

export const DateSelectionModeToYAML = {
  Interval: "Интервал",
  Multiple: "Множественный",
  Single: "Одиночный",
} as const

export const DateSelectionModeFromYAML = {
  Интервал: "Interval",
  Множественный: "Multiple",
  Одиночный: "Single",
} as const

export type DateSelectionMode = keyof typeof DateSelectionModeToYAML
export type DateSelectionModeYAML = keyof typeof DateSelectionModeFromYAML

export const DimensionAttributePlacementTypeToYAML = {
  Together: "Вместе",
  WithDimensions: "ВместеСИзмерениями",
  Separately: "Отдельно",
} as const

export const DimensionAttributePlacementTypeFromYAML = {
  Вместе: "Together",
  ВместеСИзмерениями: "WithDimensions",
  Отдельно: "Separately",
} as const

export type DimensionAttributePlacementType = keyof typeof DimensionAttributePlacementTypeToYAML
export type DimensionAttributePlacementTypeYAML = keyof typeof DimensionAttributePlacementTypeFromYAML

export const DimensionPlacementTypeToYAML = {
  Together: "Вместе",
  Separately: "Отдельно",
  SeparatelyAndInTotalsOnly: "ОтдельноИТолькоВИтогах",
} as const

export const DimensionPlacementTypeFromYAML = {
  Вместе: "Together",
  Отдельно: "Separately",
  ОтдельноИТолькоВИтогах: "SeparatelyAndInTotalsOnly",
} as const

export type DimensionPlacementType = keyof typeof DimensionPlacementTypeToYAML
export type DimensionPlacementTypeYAML = keyof typeof DimensionPlacementTypeFromYAML

export const DisplayImportanceToYAML = {
  Auto: "Авто",
  High: "Высокая",
  Low: "Низкая",
  Usual: "Обычная",
  VeryHigh: "ОченьВысокая",
  VeryLow: "ОченьНизкая",
} as const

export const DisplayImportanceFromYAML = {
  Авто: "Auto",
  Высокая: "High",
  Низкая: "Low",
  Обычная: "Usual",
  ОченьВысокая: "VeryHigh",
  ОченьНизкая: "VeryLow",
} as const

export type DisplayImportance = keyof typeof DisplayImportanceToYAML
export type DisplayImportanceYAML = keyof typeof DisplayImportanceFromYAML

export const DragActionToYAML = {
  Choice: "Выбор",
  Copy: "Копирование",
  Cancel: "Отмена",
  Move: "Перемещение",
} as const

export const DragActionFromYAML = {
  Выбор: "Choice",
  Копирование: "Copy",
  Отмена: "Cancel",
  Перемещение: "Move",
} as const

export type DragAction = keyof typeof DragActionToYAML
export type DragActionYAML = keyof typeof DragActionFromYAML

export const DragAllowedActionsToYAML = {
  Copy: "Копирование",
  CopyAndMove: "КопированиеИПеремещение",
  DontProcess: "НеОбрабатывать",
  Move: "Перемещение",
} as const

export const DragAllowedActionsFromYAML = {
  Копирование: "Copy",
  КопированиеИПеремещение: "CopyAndMove",
  НеОбрабатывать: "DontProcess",
  Перемещение: "Move",
} as const

export type DragAllowedActions = keyof typeof DragAllowedActionsToYAML
export type DragAllowedActionsYAML = keyof typeof DragAllowedActionsFromYAML

export const DrawingSelectionShowModeToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const DrawingSelectionShowModeFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type DrawingSelectionShowMode = keyof typeof DrawingSelectionShowModeToYAML
export type DrawingSelectionShowModeYAML = keyof typeof DrawingSelectionShowModeFromYAML

export const EditTextUpdateToYAML = {
  Auto: "Авто",
  Always: "Всегда",
  DontUse: "НеИспользовать",
  OnValueChange: "ПриИзмененииЗначения",
} as const

export const EditTextUpdateFromYAML = {
  Авто: "Auto",
  Всегда: "Always",
  НеИспользовать: "DontUse",
  ПриИзмененииЗначения: "OnValueChange",
} as const

export type EditTextUpdate = keyof typeof EditTextUpdateToYAML
export type EditTextUpdateYAML = keyof typeof EditTextUpdateFromYAML

export const FitPageModeToYAML = {
  Auto: "Авто",
  PageWidth: "ПоШиринеСтраницы",
  Proportionally: "Пропорционально",
} as const

export const FitPageModeFromYAML = {
  Авто: "Auto",
  ПоШиринеСтраницы: "PageWidth",
  Пропорционально: "Proportionally",
} as const

export type FitPageMode = keyof typeof FitPageModeToYAML
export type FitPageModeYAML = keyof typeof FitPageModeFromYAML

export const FixingInTableToYAML = {
  Left: "Лево",
  None: "Нет",
  Right: "Право",
} as const

export const FixingInTableFromYAML = {
  Лево: "Left",
  Нет: "None",
  Право: "Right",
} as const

export type FixingInTable = keyof typeof FixingInTableToYAML
export type FixingInTableYAML = keyof typeof FixingInTableFromYAML

export const FoldersAndItemsToYAML = {
  Auto: "Авто",
  Folders: "Группы",
  FoldersAndItems: "ГруппыИЭлементы",
  Items: "Элементы",
} as const

export const FoldersAndItemsFromYAML = {
  Авто: "Auto",
  Группы: "Folders",
  ГруппыИЭлементы: "FoldersAndItems",
  Элементы: "Items",
} as const

export type FoldersAndItems = keyof typeof FoldersAndItemsToYAML
export type FoldersAndItemsYAML = keyof typeof FoldersAndItemsFromYAML

export const FormButtonPictureLocationToYAML = {
  Auto: "Авто",
  Left: "Лево",
  Right: "Право",
} as const

export const FormButtonPictureLocationFromYAML = {
  Авто: "Auto",
  Лево: "Left",
  Право: "Right",
} as const

export type FormButtonPictureLocation = keyof typeof FormButtonPictureLocationToYAML
export type FormButtonPictureLocationYAML = keyof typeof FormButtonPictureLocationFromYAML

export const FormButtonTypeToYAML = {
  Hyperlink: "Гиперссылка",
  CommandBarHyperlink: "ГиперссылкаКоманднойПанели",
  CommandBarButton: "КнопкаКоманднойПанели",
  UsualButton: "ОбычнаяКнопка",
} as const

export const FormButtonTypeFromYAML = {
  Гиперссылка: "Hyperlink",
  ГиперссылкаКоманднойПанели: "CommandBarHyperlink",
  КнопкаКоманднойПанели: "CommandBarButton",
  ОбычнаяКнопка: "UsualButton",
} as const

export type FormButtonType = keyof typeof FormButtonTypeToYAML
export type FormButtonTypeYAML = keyof typeof FormButtonTypeFromYAML

export const FormCommandBarLabelLocationToYAML = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const FormCommandBarLabelLocationFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type FormCommandBarLabelLocation = keyof typeof FormCommandBarLabelLocationToYAML
export type FormCommandBarLabelLocationYAML = keyof typeof FormCommandBarLabelLocationFromYAML

export const FormConversationsRepresentationToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const FormConversationsRepresentationFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type FormConversationsRepresentation = keyof typeof FormConversationsRepresentationToYAML
export type FormConversationsRepresentationYAML = keyof typeof FormConversationsRepresentationFromYAML

export const FormDecorationTypeToYAML = {
  Picture: "Картинка",
  Label: "Надпись",
} as const

export const FormDecorationTypeFromYAML = {
  Картинка: "Picture",
  Надпись: "Label",
} as const

export type FormDecorationType = keyof typeof FormDecorationTypeToYAML
export type FormDecorationTypeYAML = keyof typeof FormDecorationTypeFromYAML

export const FormFieldTypeToYAML = {
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

export const FormFieldTypeFromYAML = {
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

export type FormFieldType = keyof typeof FormFieldTypeToYAML
export type FormFieldTypeYAML = keyof typeof FormFieldTypeFromYAML

export const FormGroupTypeToYAML = {
  ButtonGroup: "ГруппаКнопок",
  ColumnGroup: "ГруппаКолонок",
  CommandBar: "КоманднаяПанель",
  ContextMenu: "КонтекстноеМеню",
  UsualGroup: "ОбычнаяГруппа",
  Popup: "Подменю",
  Page: "Страница",
  Pages: "Страницы",
} as const

export const FormGroupTypeFromYAML = {
  ГруппаКнопок: "ButtonGroup",
  ГруппаКолонок: "ColumnGroup",
  КоманднаяПанель: "CommandBar",
  КонтекстноеМеню: "ContextMenu",
  ОбычнаяГруппа: "UsualGroup",
  Подменю: "Popup",
  Страница: "Page",
  Страницы: "Pages",
} as const

export type FormGroupType = keyof typeof FormGroupTypeToYAML
export type FormGroupTypeYAML = keyof typeof FormGroupTypeFromYAML

export const FormItemAdditionTypeToYAML = {
  ViewStatusRepresentation: "ОтображениеСостоянияПросмотра",
  SearchStringRepresentation: "ОтображениеСтрокиПоиска",
  SearchControl: "УправлениеПоиском",
} as const

export const FormItemAdditionTypeFromYAML = {
  ОтображениеСостоянияПросмотра: "ViewStatusRepresentation",
  ОтображениеСтрокиПоиска: "SearchStringRepresentation",
  УправлениеПоиском: "SearchControl",
} as const

export type FormItemAdditionType = keyof typeof FormItemAdditionTypeToYAML
export type FormItemAdditionTypeYAML = keyof typeof FormItemAdditionTypeFromYAML

export const FormItemCommandBarLabelLocationToYAML = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const FormItemCommandBarLabelLocationFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type FormItemCommandBarLabelLocation = keyof typeof FormItemCommandBarLabelLocationToYAML
export type FormItemCommandBarLabelLocationYAML = keyof typeof FormItemCommandBarLabelLocationFromYAML

export const FormItemOrientationToYAML = {
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
} as const

export const FormItemOrientationFromYAML = {
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
} as const

export type FormItemOrientation = keyof typeof FormItemOrientationToYAML
export type FormItemOrientationYAML = keyof typeof FormItemOrientationFromYAML

export const FormItemSpacingToYAML = {
  Auto: "Авто",
  Double: "Двойной",
  None: "Нет",
  Single: "Одинарный",
  Half: "Половинный",
  OneAndHalf: "Полуторный",
} as const

export const FormItemSpacingFromYAML = {
  Авто: "Auto",
  Двойной: "Double",
  Нет: "None",
  Одинарный: "Single",
  Половинный: "Half",
  Полуторный: "OneAndHalf",
} as const

export type FormItemSpacing = keyof typeof FormItemSpacingToYAML
export type FormItemSpacingYAML = keyof typeof FormItemSpacingFromYAML

export const FormItemTitleLocationToYAML = {
  Auto: "Авто",
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
} as const

export const FormItemTitleLocationFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
} as const

export type FormItemTitleLocation = keyof typeof FormItemTitleLocationToYAML
export type FormItemTitleLocationYAML = keyof typeof FormItemTitleLocationFromYAML

export const FormPagesRepresentationToYAML = {
  Auto: "Авто",
  TabsOnTop: "ЗакладкиСверху",
  TabsOnLeftHorizontal: "ЗакладкиСлеваГоризонтально",
  TabsOnBottom: "ЗакладкиСнизу",
  TabsOnRightHorizontal: "ЗакладкиСправаГоризонтально",
  None: "Нет",
  Swipe: "Пролистывание",
} as const

export const FormPagesRepresentationFromYAML = {
  Авто: "Auto",
  ЗакладкиСверху: "TabsOnTop",
  ЗакладкиСлеваГоризонтально: "TabsOnLeftHorizontal",
  ЗакладкиСнизу: "TabsOnBottom",
  ЗакладкиСправаГоризонтально: "TabsOnRightHorizontal",
  Нет: "None",
  Пролистывание: "Swipe",
} as const

export type FormPagesRepresentation = keyof typeof FormPagesRepresentationToYAML
export type FormPagesRepresentationYAML = keyof typeof FormPagesRepresentationFromYAML

export const FormPagesStateToYAML = {
  Titles: "Заголовки",
  TitlesAndCurrentPage: "ЗаголовкиИТекущаяСтраница",
  CurrentPage: "ТекущаяСтраница",
} as const

export const FormPagesStateFromYAML = {
  Заголовки: "Titles",
  ЗаголовкиИТекущаяСтраница: "TitlesAndCurrentPage",
  ТекущаяСтраница: "CurrentPage",
} as const

export type FormPagesState = keyof typeof FormPagesStateToYAML
export type FormPagesStateYAML = keyof typeof FormPagesStateFromYAML

export const FormStandardURLVariantToYAML = {
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

export const FormStandardURLVariantFromYAML = {
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

export type FormStandardURLVariant = keyof typeof FormStandardURLVariantToYAML
export type FormStandardURLVariantYAML = keyof typeof FormStandardURLVariantFromYAML

export const FormWindowOpeningModeToYAML = {
  LockWholeInterface: "БлокироватьВесьИнтерфейс",
  LockOwnerWindow: "БлокироватьОкноВладельца",
  DontBlock: "НеБлокировать",
} as const

export const FormWindowOpeningModeFromYAML = {
  БлокироватьВесьИнтерфейс: "LockWholeInterface",
  БлокироватьОкноВладельца: "LockOwnerWindow",
  НеБлокировать: "DontBlock",
} as const

export type FormWindowOpeningMode = keyof typeof FormWindowOpeningModeToYAML
export type FormWindowOpeningModeYAML = keyof typeof FormWindowOpeningModeFromYAML

export const GraphicalSchemaGridDrawModeToYAML = {
  Lines: "Линии",
  None: "НеРисовать",
  Dots: "Точки",
  Chess: "ШахматнаяСетка",
} as const

export const GraphicalSchemaGridDrawModeFromYAML = {
  Линии: "Lines",
  НеРисовать: "None",
  Точки: "Dots",
  ШахматнаяСетка: "Chess",
} as const

export type GraphicalSchemaGridDrawMode = keyof typeof GraphicalSchemaGridDrawModeToYAML
export type GraphicalSchemaGridDrawModeYAML = keyof typeof GraphicalSchemaGridDrawModeFromYAML

export const GraphicalSchemaItemPictureLocationToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const GraphicalSchemaItemPictureLocationFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type GraphicalSchemaItemPictureLocation = keyof typeof GraphicalSchemaItemPictureLocationToYAML
export type GraphicalSchemaItemPictureLocationYAML = keyof typeof GraphicalSchemaItemPictureLocationFromYAML

export const GraphicalSchemaShapesToYAML = {
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

export const GraphicalSchemaShapesFromYAML = {
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

export type GraphicalSchemaShapes = keyof typeof GraphicalSchemaShapesToYAML
export type GraphicalSchemaShapesYAML = keyof typeof GraphicalSchemaShapesFromYAML

export const GraphicalSchemeElementSideTypeToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const GraphicalSchemeElementSideTypeFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type GraphicalSchemeElementSideType = keyof typeof GraphicalSchemeElementSideTypeToYAML
export type GraphicalSchemeElementSideTypeYAML = keyof typeof GraphicalSchemeElementSideTypeFromYAML

export const HTMLDocumentFieldModeToYAML = {
  Browse: "Просмотр",
  Design: "Редактирование",
} as const

export const HTMLDocumentFieldModeFromYAML = {
  Просмотр: "Browse",
  Редактирование: "Design",
} as const

export type HTMLDocumentFieldMode = keyof typeof HTMLDocumentFieldModeToYAML
export type HTMLDocumentFieldModeYAML = keyof typeof HTMLDocumentFieldModeFromYAML

export const HorizontalAlignToYAML = {
  Auto: "Авто",
  Left: "Лево",
  Justify: "ПоШирине",
  Right: "Право",
  Center: "Центр",
} as const

export const HorizontalAlignFromYAML = {
  Авто: "Auto",
  Лево: "Left",
  ПоШирине: "Justify",
  Право: "Right",
  Центр: "Center",
} as const

export type HorizontalAlign = keyof typeof HorizontalAlignToYAML
export type HorizontalAlignYAML = keyof typeof HorizontalAlignFromYAML

export const IncompleteChoiceModeToYAML = {
  OnActivate: "ПриАктивизации",
  OnEnterPressed: "ПриНажатииEnter",
} as const

export const IncompleteChoiceModeFromYAML = {
  ПриАктивизации: "OnActivate",
  ПриНажатииEnter: "OnEnterPressed",
} as const

export type IncompleteChoiceMode = keyof typeof IncompleteChoiceModeToYAML
export type IncompleteChoiceModeYAML = keyof typeof IncompleteChoiceModeFromYAML

export const InitialListViewToYAML = {
  Auto: "Авто",
  End: "Конец",
  Beginning: "Начало",
} as const

export const InitialListViewFromYAML = {
  Авто: "Auto",
  Конец: "End",
  Начало: "Beginning",
} as const

export type InitialListView = keyof typeof InitialListViewToYAML
export type InitialListViewYAML = keyof typeof InitialListViewFromYAML

export const InitialTreeViewToYAML = {
  NoExpand: "НеРаскрывать",
  ExpandTopLevel: "РаскрыватьВерхнийУровень",
  ExpandAllLevels: "РаскрыватьВсеУровни",
} as const

export const InitialTreeViewFromYAML = {
  НеРаскрывать: "NoExpand",
  РаскрыватьВерхнийУровень: "ExpandTopLevel",
  РаскрыватьВсеУровни: "ExpandAllLevels",
} as const

export type InitialTreeView = keyof typeof InitialTreeViewToYAML
export type InitialTreeViewYAML = keyof typeof InitialTreeViewFromYAML

export const InputFieldAutofillHintToYAML = {
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

export const InputFieldAutofillHintFromYAML = {
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

export type InputFieldAutofillHint = keyof typeof InputFieldAutofillHintToYAML
export type InputFieldAutofillHintYAML = keyof typeof InputFieldAutofillHintFromYAML

export const InputFieldCommandSourceToYAML = {
  MultipleValue: "МножественноеЗначение",
  InputArea: "ОбластьВвода",
} as const

export const InputFieldCommandSourceFromYAML = {
  МножественноеЗначение: "MultipleValue",
  ОбластьВвода: "InputArea",
} as const

export type InputFieldCommandSource = keyof typeof InputFieldCommandSourceToYAML
export type InputFieldCommandSourceYAML = keyof typeof InputFieldCommandSourceFromYAML

export const InputFieldMultipleValuePictureShapeToYAML = {
  Auto: "Авто",
  Rect: "Квадрат",
  Circle: "Круг",
} as const

export const InputFieldMultipleValuePictureShapeFromYAML = {
  Авто: "Auto",
  Квадрат: "Rect",
  Круг: "Circle",
} as const

export type InputFieldMultipleValuePictureShape = keyof typeof InputFieldMultipleValuePictureShapeToYAML
export type InputFieldMultipleValuePictureShapeYAML = keyof typeof InputFieldMultipleValuePictureShapeFromYAML

export const InputFieldMultipleValuePictureSizeToYAML = {
  Auto: "Авто",
  Large: "Крупный",
  Small: "Маленький",
  Medium: "Средний",
} as const

export const InputFieldMultipleValuePictureSizeFromYAML = {
  Авто: "Auto",
  Крупный: "Large",
  Маленький: "Small",
  Средний: "Medium",
} as const

export type InputFieldMultipleValuePictureSize = keyof typeof InputFieldMultipleValuePictureSizeToYAML
export type InputFieldMultipleValuePictureSizeYAML = keyof typeof InputFieldMultipleValuePictureSizeFromYAML

export const InputFieldStandardCommandToYAML = {
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

export const InputFieldStandardCommandFromYAML = {
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

export type InputFieldStandardCommand = keyof typeof InputFieldStandardCommandToYAML
export type InputFieldStandardCommandYAML = keyof typeof InputFieldStandardCommandFromYAML

export const ItemHeightControlVariantToYAML = {
  Auto: "Авто",
  UseHeightInFormRows: "ВСтрокахФормы",
  UseContentHeight: "ПоСодержимому",
} as const

export const ItemHeightControlVariantFromYAML = {
  Авто: "Auto",
  ВСтрокахФормы: "UseHeightInFormRows",
  ПоСодержимому: "UseContentHeight",
} as const

export type ItemHeightControlVariant = keyof typeof ItemHeightControlVariantToYAML
export type ItemHeightControlVariantYAML = keyof typeof ItemHeightControlVariantFromYAML

export const ItemHorizontalLocationToYAML = {
  Auto: "Авто",
  Left: "Лево",
  Right: "Право",
  Center: "Центр",
} as const

export const ItemHorizontalLocationFromYAML = {
  Авто: "Auto",
  Лево: "Left",
  Право: "Right",
  Центр: "Center",
} as const

export type ItemHorizontalLocation = keyof typeof ItemHorizontalLocationToYAML
export type ItemHorizontalLocationYAML = keyof typeof ItemHorizontalLocationFromYAML

export const ItemVerticalAlignToYAML = {
  Auto: "Авто",
  Top: "Верх",
  Bottom: "Низ",
  Center: "Центр",
} as const

export const ItemVerticalAlignFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Низ: "Bottom",
  Центр: "Center",
} as const

export type ItemVerticalAlign = keyof typeof ItemVerticalAlignToYAML
export type ItemVerticalAlignYAML = keyof typeof ItemVerticalAlignFromYAML

export const ItemsAndTitlesAlignVariantToYAML = {
  Auto: "Авто",
  None: "Нет",
  ItemsLeftTitlesLeft: "ЭлементыЛевоЗаголовкиЛево",
  ItemsLeftTitlesRight: "ЭлементыЛевоЗаголовкиПраво",
  ItemsRightTitlesLeft: "ЭлементыПравоЗаголовкиЛево",
  ItemsRightTitlesRight: "ЭлементыПравоЗаголовкиПраво",
} as const

export const ItemsAndTitlesAlignVariantFromYAML = {
  Авто: "Auto",
  Нет: "None",
  ЭлементыЛевоЗаголовкиЛево: "ItemsLeftTitlesLeft",
  ЭлементыЛевоЗаголовкиПраво: "ItemsLeftTitlesRight",
  ЭлементыПравоЗаголовкиЛево: "ItemsRightTitlesLeft",
  ЭлементыПравоЗаголовкиПраво: "ItemsRightTitlesRight",
} as const

export type ItemsAndTitlesAlignVariant = keyof typeof ItemsAndTitlesAlignVariantToYAML
export type ItemsAndTitlesAlignVariantYAML = keyof typeof ItemsAndTitlesAlignVariantFromYAML

export const LabelPictureLocationToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const LabelPictureLocationFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type LabelPictureLocation = keyof typeof LabelPictureLocationToYAML
export type LabelPictureLocationYAML = keyof typeof LabelPictureLocationFromYAML

export const LinkedValueChangeModeToYAML = {
  DontChange: "НеИзменять",
  Clear: "Очищать",
} as const

export const LinkedValueChangeModeFromYAML = {
  НеИзменять: "DontChange",
  Очищать: "Clear",
} as const

export type LinkedValueChangeMode = keyof typeof LinkedValueChangeModeToYAML
export type LinkedValueChangeModeYAML = keyof typeof LinkedValueChangeModeFromYAML

export const ListEditModeToYAML = {
  InDialog: "ВДиалоге",
  InList: "ВСписке",
} as const

export const ListEditModeFromYAML = {
  ВДиалоге: "InDialog",
  ВСписке: "InList",
} as const

export type ListEditMode = keyof typeof ListEditModeToYAML
export type ListEditModeYAML = keyof typeof ListEditModeFromYAML

export const MainClientApplicationWindowModeToYAML = {
  EmbeddedWorkplace: "ВстроенноеРабочееМесто",
  Kiosk: "Киоск",
  Normal: "Обычный",
  FullscreenWorkplace: "ПолноэкранноеРабочееМесто",
  Workplace: "РабочееМесто",
} as const

export const MainClientApplicationWindowModeFromYAML = {
  ВстроенноеРабочееМесто: "EmbeddedWorkplace",
  Киоск: "Kiosk",
  Обычный: "Normal",
  ПолноэкранноеРабочееМесто: "FullscreenWorkplace",
  РабочееМесто: "Workplace",
} as const

export type MainClientApplicationWindowMode = keyof typeof MainClientApplicationWindowModeToYAML
export type MainClientApplicationWindowModeYAML = keyof typeof MainClientApplicationWindowModeFromYAML

export const NewRowShowCheckVariantToYAML = {
  DontCheck: "НеПроверять",
  FilterMismatchMessage: "СообщатьОНесоответствииОтбору",
} as const

export const NewRowShowCheckVariantFromYAML = {
  НеПроверять: "DontCheck",
  СообщатьОНесоответствииОтбору: "FilterMismatchMessage",
} as const

export type NewRowShowCheckVariant = keyof typeof NewRowShowCheckVariantToYAML
export type NewRowShowCheckVariantYAML = keyof typeof NewRowShowCheckVariantFromYAML

export const OnScreenKeyboardReturnKeyTextToYAML = {
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

export const OnScreenKeyboardReturnKeyTextFromYAML = {
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

export type OnScreenKeyboardReturnKeyText = keyof typeof OnScreenKeyboardReturnKeyTextToYAML
export type OnScreenKeyboardReturnKeyTextYAML = keyof typeof OnScreenKeyboardReturnKeyTextFromYAML

export const OrientationToYAML = {
  Auto: "Авто",
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
} as const

export const OrientationFromYAML = {
  Авто: "Auto",
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
} as const

export type Orientation = keyof typeof OrientationToYAML
export type OrientationYAML = keyof typeof OrientationFromYAML

export const PanelPictureLocationToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
  Center: "Центр",
} as const

export const PanelPictureLocationFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
  Центр: "Center",
} as const

export type PanelPictureLocation = keyof typeof PanelPictureLocationToYAML
export type PanelPictureLocationYAML = keyof typeof PanelPictureLocationFromYAML

export const PictureFormatToYAML = {
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

export const PictureFormatFromYAML = {
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

export type PictureFormat = keyof typeof PictureFormatToYAML
export type PictureFormatYAML = keyof typeof PictureFormatFromYAML

export const PictureSizeToYAML = {
  AutoSize: "АвтоРазмер",
  AutoSizeIgnoreScale: "АвтоРазмерБезУчетаМасштаба",
  ByFontSize: "ПоРазмеруШрифта",
  Proportionally: "Пропорционально",
  Stretch: "Растянуть",
  RealSize: "РеальныйРазмер",
  RealSizeIgnoreScale: "РеальныйРазмерБезУчетаМасштаба",
  Tile: "Черепица",
} as const

export const PictureSizeFromYAML = {
  АвтоРазмер: "AutoSize",
  АвтоРазмерБезУчетаМасштаба: "AutoSizeIgnoreScale",
  ПоРазмеруШрифта: "ByFontSize",
  Пропорционально: "Proportionally",
  Растянуть: "Stretch",
  РеальныйРазмер: "RealSize",
  РеальныйРазмерБезУчетаМасштаба: "RealSizeIgnoreScale",
  Черепица: "Tile",
} as const

export type PictureSize = keyof typeof PictureSizeToYAML
export type PictureSizeYAML = keyof typeof PictureSizeFromYAML

export const PrintDialogUseModeToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const PrintDialogUseModeFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type PrintDialogUseMode = keyof typeof PrintDialogUseModeToYAML
export type PrintDialogUseModeYAML = keyof typeof PrintDialogUseModeFromYAML

export const ProgressBarSmoothingModeToYAML = {
  Smooth: "Плавный",
  Broken: "Прерывистый",
  BrokenTilt: "ПрерывистыйНаклонный",
} as const

export const ProgressBarSmoothingModeFromYAML = {
  Плавный: "Smooth",
  Прерывистый: "Broken",
  ПрерывистыйНаклонный: "BrokenTilt",
} as const

export type ProgressBarSmoothingMode = keyof typeof ProgressBarSmoothingModeToYAML
export type ProgressBarSmoothingModeYAML = keyof typeof ProgressBarSmoothingModeFromYAML

export const RadioButtonTypeToYAML = {
  Auto: "Авто",
  RadioButton: "Переключатель",
  Tumbler: "Тумблер",
} as const

export const RadioButtonTypeFromYAML = {
  Авто: "Auto",
  Переключатель: "RadioButton",
  Тумблер: "Tumbler",
} as const

export type RadioButtonType = keyof typeof RadioButtonTypeToYAML
export type RadioButtonTypeYAML = keyof typeof RadioButtonTypeFromYAML

export const RefreshRequestMethodToYAML = {
  None: "Нет",
  PullFromTop: "ПотянутьСверху",
  PullFromTopOrBottom: "ПотянутьСверхуИлиСнизу",
  PullFromBottom: "ПотянутьСнизу",
} as const

export const RefreshRequestMethodFromYAML = {
  Нет: "None",
  ПотянутьСверху: "PullFromTop",
  ПотянутьСверхуИлиСнизу: "PullFromTopOrBottom",
  ПотянутьСнизу: "PullFromBottom",
} as const

export type RefreshRequestMethod = keyof typeof RefreshRequestMethodToYAML
export type RefreshRequestMethodYAML = keyof typeof RefreshRequestMethodFromYAML

export const ReportFormTypeToYAML = {
  Variant: "Вариант",
  Settings: "Настройка",
  Main: "Основная",
} as const

export const ReportFormTypeFromYAML = {
  Вариант: "Variant",
  Настройка: "Settings",
  Основная: "Main",
} as const

export type ReportFormType = keyof typeof ReportFormTypeToYAML
export type ReportFormTypeYAML = keyof typeof ReportFormTypeFromYAML

export const ReportResultViewModeToYAML = {
  Auto: "Авто",
  Compact: "Компактный",
  Default: "Обычный",
} as const

export const ReportResultViewModeFromYAML = {
  Авто: "Auto",
  Компактный: "Compact",
  Обычный: "Default",
} as const

export type ReportResultViewMode = keyof typeof ReportResultViewModeToYAML
export type ReportResultViewModeYAML = keyof typeof ReportResultViewModeFromYAML

export const SaveFormDataInSettingsToYAML = {
  UseList: "ИспользоватьСписок",
  DontUse: "НеИспользовать",
} as const

export const SaveFormDataInSettingsFromYAML = {
  ИспользоватьСписок: "UseList",
  НеИспользовать: "DontUse",
} as const

export type SaveFormDataInSettings = keyof typeof SaveFormDataInSettingsToYAML
export type SaveFormDataInSettingsYAML = keyof typeof SaveFormDataInSettingsFromYAML

export const ScrollBarUseToYAML = {
  AutoUse: "ИспользоватьАвтоматически",
  UseAlways: "ИспользоватьВсегда",
  DontUse: "НеИспользовать",
} as const

export const ScrollBarUseFromYAML = {
  ИспользоватьАвтоматически: "AutoUse",
  ИспользоватьВсегда: "UseAlways",
  НеИспользовать: "DontUse",
} as const

export type ScrollBarUse = keyof typeof ScrollBarUseToYAML
export type ScrollBarUseYAML = keyof typeof ScrollBarUseFromYAML

export const ScrollingTextModeToYAML = {
  Fast: "Быстро",
  Slow: "Медленно",
  DontUse: "НеИспользовать",
  Normal: "Нормально",
  VeryFast: "ОченьБыстро",
  VerySlow: "ОченьМедленно",
} as const

export const ScrollingTextModeFromYAML = {
  Быстро: "Fast",
  Медленно: "Slow",
  НеИспользовать: "DontUse",
  Нормально: "Normal",
  ОченьБыстро: "VeryFast",
  ОченьМедленно: "VerySlow",
} as const

export type ScrollingTextMode = keyof typeof ScrollingTextModeToYAML
export type ScrollingTextModeYAML = keyof typeof ScrollingTextModeFromYAML

export const SearchControlLocationToYAML = {
  Auto: "Авто",
  CommandBar: "КоманднаяПанель",
  None: "Нет",
} as const

export const SearchControlLocationFromYAML = {
  Авто: "Auto",
  КоманднаяПанель: "CommandBar",
  Нет: "None",
} as const

export type SearchControlLocation = keyof typeof SearchControlLocationToYAML
export type SearchControlLocationYAML = keyof typeof SearchControlLocationFromYAML

export const SearchInTableOnInputToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const SearchInTableOnInputFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type SearchInTableOnInput = keyof typeof SearchInTableOnInputToYAML
export type SearchInTableOnInputYAML = keyof typeof SearchInTableOnInputFromYAML

export const SearchStringLocationToYAML = {
  Auto: "Авто",
  Top: "Верх",
  FormCaption: "ЗаголовокФормы",
  CommandBar: "КоманднаяПанель",
  Bottom: "Низ",
  PullFromTop: "ПотянутьСверху",
  None: "Нет",
} as const

export const SearchStringLocationFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  ЗаголовокФормы: "FormCaption",
  КоманднаяПанель: "CommandBar",
  Низ: "Bottom",
  ПотянутьСверху: "PullFromTop",
  Нет: "None",
} as const

export type SearchStringLocation = keyof typeof SearchStringLocationToYAML
export type SearchStringLocationYAML = keyof typeof SearchStringLocationFromYAML

export const SelectionShowModeToYAML = {
  Always: "Всегда",
  DontShow: "НеОтображать",
  WhenActive: "ПриАктивности",
  WhenMultipleCellsSelected: "ПриВыделенииНесколькихЯчеек",
  WhenMultipleCellsSelectedWhenActive: "ПриВыделенииНесколькихЯчеекПриАктивности",
} as const

export const SelectionShowModeFromYAML = {
  Всегда: "Always",
  НеОтображать: "DontShow",
  ПриАктивности: "WhenActive",
  ПриВыделенииНесколькихЯчеек: "WhenMultipleCellsSelected",
  ПриВыделенииНесколькихЯчеекПриАктивности: "WhenMultipleCellsSelectedWhenActive",
} as const

export type SelectionShowMode = keyof typeof SelectionShowModeToYAML
export type SelectionShowModeYAML = keyof typeof SelectionShowModeFromYAML

export const ShowTabsToYAML = {
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

export const ShowTabsFromYAML = {
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

export type ShowTabs = keyof typeof ShowTabsToYAML
export type ShowTabsYAML = keyof typeof ShowTabsFromYAML

export const SizeChangeModeToYAML = {
  QuickChange: "БыстроеИзменение",
  Normal: "Обычный",
} as const

export const SizeChangeModeFromYAML = {
  БыстроеИзменение: "QuickChange",
  Обычный: "Normal",
} as const

export type SizeChangeMode = keyof typeof SizeChangeModeToYAML
export type SizeChangeModeYAML = keyof typeof SizeChangeModeFromYAML

export const SpecialTextInputModeToYAML = {
  Email: "Email",
  URL: "URL",
  Auto: "Авто",
  None: "Нет",
  PhoneNumber: "НомерТелефона",
  Digits: "Цифры",
  DigitsAndPunctuation: "ЦифрыИПунктуация",
} as const

export const SpecialTextInputModeFromYAML = {
  Email: "Email",
  URL: "URL",
  Авто: "Auto",
  Нет: "None",
  НомерТелефона: "PhoneNumber",
  Цифры: "Digits",
  ЦифрыИПунктуация: "DigitsAndPunctuation",
} as const

export type SpecialTextInputMode = keyof typeof SpecialTextInputModeToYAML
export type SpecialTextInputModeYAML = keyof typeof SpecialTextInputModeFromYAML

export const SpellCheckingOnTextInputToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const SpellCheckingOnTextInputFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type SpellCheckingOnTextInput = keyof typeof SpellCheckingOnTextInputToYAML
export type SpellCheckingOnTextInputYAML = keyof typeof SpellCheckingOnTextInputFromYAML

export const StandardAppearanceToYAML = {
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

export const StandardAppearanceFromYAML = {
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

export type StandardAppearance = keyof typeof StandardAppearanceToYAML
export type StandardAppearanceYAML = keyof typeof StandardAppearanceFromYAML

export const StandardCommandsGroupToYAML = {
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

export const StandardCommandsGroupFromYAML = {
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

export type StandardCommandsGroup = keyof typeof StandardCommandsGroupToYAML
export type StandardCommandsGroupYAML = keyof typeof StandardCommandsGroupFromYAML

export const TableBehaviorOnHorizontalCompressionToYAML = {
  Auto: "Авто",
  MoveItemsByImportance: "ПереноситьЭлементыПоВажности",
  HideItemsByImportance: "СкрыватьЭлементыПоВажности",
} as const

export const TableBehaviorOnHorizontalCompressionFromYAML = {
  Авто: "Auto",
  ПереноситьЭлементыПоВажности: "MoveItemsByImportance",
  СкрыватьЭлементыПоВажности: "HideItemsByImportance",
} as const

export type TableBehaviorOnHorizontalCompression = keyof typeof TableBehaviorOnHorizontalCompressionToYAML
export type TableBehaviorOnHorizontalCompressionYAML = keyof typeof TableBehaviorOnHorizontalCompressionFromYAML

export const TableBoxRowInputModeToYAML = {
  EndOfWindow: "ВКонецОкна",
  EndOfList: "ВКонецСписка",
  BeforeCurrentRow: "ПередТекущейСтрокой",
  AfterCurrentRow: "ПослеТекущейСтроки",
} as const

export const TableBoxRowInputModeFromYAML = {
  ВКонецОкна: "EndOfWindow",
  ВКонецСписка: "EndOfList",
  ПередТекущейСтрокой: "BeforeCurrentRow",
  ПослеТекущейСтроки: "AfterCurrentRow",
} as const

export type TableBoxRowInputMode = keyof typeof TableBoxRowInputModeToYAML
export type TableBoxRowInputModeYAML = keyof typeof TableBoxRowInputModeFromYAML

export const TableBoxRowSelectionModeToYAML = {
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const TableBoxRowSelectionModeFromYAML = {
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type TableBoxRowSelectionMode = keyof typeof TableBoxRowSelectionModeToYAML
export type TableBoxRowSelectionModeYAML = keyof typeof TableBoxRowSelectionModeFromYAML

export const TableBoxSelectionModeToYAML = {
  MultiLine: "Множественный",
  SingleLine: "Одиночный",
} as const

export const TableBoxSelectionModeFromYAML = {
  Множественный: "MultiLine",
  Одиночный: "SingleLine",
} as const

export type TableBoxSelectionMode = keyof typeof TableBoxSelectionModeToYAML
export type TableBoxSelectionModeYAML = keyof typeof TableBoxSelectionModeFromYAML

export const TableCurrentRowUseToYAML = {
  Auto: "Авто",
  Choice: "Выбор",
  SelectionPresentation: "ОтображениеВыделения",
  SelectionPresentationAndChoice: "ОтображениеВыделенияИВыбор",
} as const

export const TableCurrentRowUseFromYAML = {
  Авто: "Auto",
  Выбор: "Choice",
  ОтображениеВыделения: "SelectionPresentation",
  ОтображениеВыделенияИВыбор: "SelectionPresentationAndChoice",
} as const

export type TableCurrentRowUse = keyof typeof TableCurrentRowUseToYAML
export type TableCurrentRowUseYAML = keyof typeof TableCurrentRowUseFromYAML

export const TableHeightControlVariantToYAML = {
  Auto: "Авто",
  UseHeightInTableRows: "ВСтрокахТаблицы",
  UseHeightInFormRows: "ВСтрокахФормы",
  UseContentHeight: "ПоСодержимому",
} as const

export const TableHeightControlVariantFromYAML = {
  Авто: "Auto",
  ВСтрокахТаблицы: "UseHeightInTableRows",
  ВСтрокахФормы: "UseHeightInFormRows",
  ПоСодержимому: "UseContentHeight",
} as const

export type TableHeightControlVariant = keyof typeof TableHeightControlVariantToYAML
export type TableHeightControlVariantYAML = keyof typeof TableHeightControlVariantFromYAML

export const TableRepresentationToYAML = {
  Tree: "Дерево",
  HierarchicalList: "ИерархическийСписок",
  List: "Список",
} as const

export const TableRepresentationFromYAML = {
  Дерево: "Tree",
  ИерархическийСписок: "HierarchicalList",
  Список: "List",
} as const

export type TableRepresentation = keyof typeof TableRepresentationToYAML
export type TableRepresentationYAML = keyof typeof TableRepresentationFromYAML

export const TableRowInputModeToYAML = {
  EndOfWindow: "ВКонецОкна",
  EndOfList: "ВКонецСписка",
  BeforeCurrentRow: "ПередТекущейСтрокой",
  AfterCurrentRow: "ПослеТекущейСтроки",
} as const

export const TableRowInputModeFromYAML = {
  ВКонецОкна: "EndOfWindow",
  ВКонецСписка: "EndOfList",
  ПередТекущейСтрокой: "BeforeCurrentRow",
  ПослеТекущейСтроки: "AfterCurrentRow",
} as const

export type TableRowInputMode = keyof typeof TableRowInputModeToYAML
export type TableRowInputModeYAML = keyof typeof TableRowInputModeFromYAML

export const TableRowSelectionModeToYAML = {
  Row: "Строка",
  Cell: "Ячейка",
} as const

export const TableRowSelectionModeFromYAML = {
  Строка: "Row",
  Ячейка: "Cell",
} as const

export type TableRowSelectionMode = keyof typeof TableRowSelectionModeToYAML
export type TableRowSelectionModeYAML = keyof typeof TableRowSelectionModeFromYAML

export const TableSelectionModeToYAML = {
  MultiRow: "Множественный",
  SingleRow: "Одиночный",
} as const

export const TableSelectionModeFromYAML = {
  Множественный: "MultiRow",
  Одиночный: "SingleRow",
} as const

export type TableSelectionMode = keyof typeof TableSelectionModeToYAML
export type TableSelectionModeYAML = keyof typeof TableSelectionModeFromYAML

export const TaskListModeToYAML = {
  AllTasks: "ВсеЗадачи",
  ByPerformer: "ПоИсполнителю",
} as const

export const TaskListModeFromYAML = {
  ВсеЗадачи: "AllTasks",
  ПоИсполнителю: "ByPerformer",
} as const

export type TaskListMode = keyof typeof TaskListModeToYAML
export type TaskListModeYAML = keyof typeof TaskListModeFromYAML

export const TextDirectionToYAML = {
  LeftToRight: "СлеваНаправо",
  RightToLeft: "СправаНалево",
} as const

export const TextDirectionFromYAML = {
  СлеваНаправо: "LeftToRight",
  СправаНалево: "RightToLeft",
} as const

export type TextDirection = keyof typeof TextDirectionToYAML
export type TextDirectionYAML = keyof typeof TextDirectionFromYAML

export const ThroughAlignToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ThroughAlignFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ThroughAlign = keyof typeof ThroughAlignToYAML
export type ThroughAlignYAML = keyof typeof ThroughAlignFromYAML

export const TimeScalePositionToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const TimeScalePositionFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type TimeScalePosition = keyof typeof TimeScalePositionToYAML
export type TimeScalePositionYAML = keyof typeof TimeScalePositionFromYAML

export const TitleLocationToYAML = {
  TitleLeft: "ЗаголовокСлева",
  TitleRight: "ЗаголовокСправа",
} as const

export const TitleLocationFromYAML = {
  ЗаголовокСлева: "TitleLeft",
  ЗаголовокСправа: "TitleRight",
} as const

export type TitleLocation = keyof typeof TitleLocationToYAML
export type TitleLocationYAML = keyof typeof TitleLocationFromYAML

export const ToolTipRepresentationToYAML = {
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

export const ToolTipRepresentationFromYAML = {
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

export type ToolTipRepresentation = keyof typeof ToolTipRepresentationToYAML
export type ToolTipRepresentationYAML = keyof typeof ToolTipRepresentationFromYAML

export const TrackBarMarkingAppearanceToYAML = {
  DontShow: "НеОтображать",
  TopLeft: "СверхуИлиСлева",
  BottomRight: "СнизуИлиСправа",
  BothSides: "СОбоихСторон",
} as const

export const TrackBarMarkingAppearanceFromYAML = {
  НеОтображать: "DontShow",
  СверхуИлиСлева: "TopLeft",
  СнизуИлиСправа: "BottomRight",
  СОбоихСторон: "BothSides",
} as const

export type TrackBarMarkingAppearance = keyof typeof TrackBarMarkingAppearanceToYAML
export type TrackBarMarkingAppearanceYAML = keyof typeof TrackBarMarkingAppearanceFromYAML

export const UseMenuModeToYAML = {
  Use: "Использовать",
  UseExtra: "ИспользоватьДополнительно",
  DontUse: "НеИспользовать",
} as const

export const UseMenuModeFromYAML = {
  Использовать: "Use",
  ИспользоватьДополнительно: "UseExtra",
  НеИспользовать: "DontUse",
} as const

export type UseMenuMode = keyof typeof UseMenuModeToYAML
export type UseMenuModeYAML = keyof typeof UseMenuModeFromYAML

export const UseOutputToYAML = {
  Auto: "Авто",
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const UseOutputFromYAML = {
  Авто: "Auto",
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type UseOutput = keyof typeof UseOutputToYAML
export type UseOutputYAML = keyof typeof UseOutputFromYAML

export const UserNotificationStatusToYAML = {
  Important: "Важное",
  Information: "Информация",
} as const

export const UserNotificationStatusFromYAML = {
  Важное: "Important",
  Информация: "Information",
} as const

export type UserNotificationStatus = keyof typeof UserNotificationStatusToYAML
export type UserNotificationStatusYAML = keyof typeof UserNotificationStatusFromYAML

export const UsualGroupBehaviorToYAML = {
  Auto: "Авто",
  PopUp: "Всплывающая",
  Usual: "Обычное",
  Collapsible: "Свертываемая",
} as const

export const UsualGroupBehaviorFromYAML = {
  Авто: "Auto",
  Всплывающая: "PopUp",
  Обычное: "Usual",
  Свертываемая: "Collapsible",
} as const

export type UsualGroupBehavior = keyof typeof UsualGroupBehaviorToYAML
export type UsualGroupBehaviorYAML = keyof typeof UsualGroupBehaviorFromYAML

export const UsualGroupControlRepresentationToYAML = {
  TitleHyperlink: "ГиперссылкаЗаголовка",
  Picture: "Картинка",
} as const

export const UsualGroupControlRepresentationFromYAML = {
  ГиперссылкаЗаголовка: "TitleHyperlink",
  Картинка: "Picture",
} as const

export type UsualGroupControlRepresentation = keyof typeof UsualGroupControlRepresentationToYAML
export type UsualGroupControlRepresentationYAML = keyof typeof UsualGroupControlRepresentationFromYAML

export const UsualGroupRepresentationToYAML = {
  None: "Нет",
  NormalSeparation: "ОбычноеВыделение",
  StrongSeparation: "СильноеВыделение",
  WeakSeparation: "СлабоеВыделение",
} as const

export const UsualGroupRepresentationFromYAML = {
  Нет: "None",
  ОбычноеВыделение: "NormalSeparation",
  СильноеВыделение: "StrongSeparation",
  СлабоеВыделение: "WeakSeparation",
} as const

export type UsualGroupRepresentation = keyof typeof UsualGroupRepresentationToYAML
export type UsualGroupRepresentationYAML = keyof typeof UsualGroupRepresentationFromYAML

export const VerticalAlignToYAML = {
  Top: "Верх",
  Bottom: "Низ",
  Center: "Центр",
} as const

export const VerticalAlignFromYAML = {
  Верх: "Top",
  Низ: "Bottom",
  Центр: "Center",
} as const

export type VerticalAlign = keyof typeof VerticalAlignToYAML
export type VerticalAlignYAML = keyof typeof VerticalAlignFromYAML

export const VerticalFormScrollToYAML = {
  auto: "Авто",
  use: "Использовать",
  useWithoutStretch: "ИспользоватьБезРастягивания",
  useIfNecessary: "ИспользоватьПриНеобходимости",
} as const

export const VerticalFormScrollFromYAML = {
  Авто: "auto",
  Использовать: "use",
  ИспользоватьБезРастягивания: "useWithoutStretch",
  ИспользоватьПриНеобходимости: "useIfNecessary",
} as const

export type VerticalFormScroll = keyof typeof VerticalFormScrollToYAML
export type VerticalFormScrollYAML = keyof typeof VerticalFormScrollFromYAML

export const ViewModeApplicationOnSetReportResultToYAML = {
  Auto: "Авто",
  DontApply: "НеПрименять",
  Apply: "Применять",
} as const

export const ViewModeApplicationOnSetReportResultFromYAML = {
  Авто: "Auto",
  НеПрименять: "DontApply",
  Применять: "Apply",
} as const

export type ViewModeApplicationOnSetReportResult = keyof typeof ViewModeApplicationOnSetReportResultToYAML
export type ViewModeApplicationOnSetReportResultYAML = keyof typeof ViewModeApplicationOnSetReportResultFromYAML

export const ViewScalingModeToYAML = {
  Auto: "Авто",
  Large: "Крупный",
  Normal: "Обычный",
} as const

export const ViewScalingModeFromYAML = {
  Авто: "Auto",
  Крупный: "Large",
  Обычный: "Normal",
} as const

export type ViewScalingMode = keyof typeof ViewScalingModeToYAML
export type ViewScalingModeYAML = keyof typeof ViewScalingModeFromYAML

export const ViewStatusLocationToYAML = {
  Auto: "Авто",
  Top: "Верх",
  None: "Нет",
  Bottom: "Низ",
} as const

export const ViewStatusLocationFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Нет: "None",
  Низ: "Bottom",
} as const

export type ViewStatusLocation = keyof typeof ViewStatusLocationToYAML
export type ViewStatusLocationYAML = keyof typeof ViewStatusLocationFromYAML

export const WarningOnEditRepresentationToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const WarningOnEditRepresentationFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type WarningOnEditRepresentation = keyof typeof WarningOnEditRepresentationToYAML
export type WarningOnEditRepresentationYAML = keyof typeof WarningOnEditRepresentationFromYAML

export const WindowAppearanceModeChangeToYAML = {
  Auto: "Авто",
  Disable: "Запретить",
  Enable: "Разрешить",
} as const

export const WindowAppearanceModeChangeFromYAML = {
  Авто: "Auto",
  Запретить: "Disable",
  Разрешить: "Enable",
} as const

export type WindowAppearanceModeChange = keyof typeof WindowAppearanceModeChangeToYAML
export type WindowAppearanceModeChangeYAML = keyof typeof WindowAppearanceModeChangeFromYAML

export const WindowAppearanceModeVariantToYAML = {
  Maximized: "Максимизированное",
  Minimized: "Минимизированное",
  Normal: "Нормальное",
} as const

export const WindowAppearanceModeVariantFromYAML = {
  Максимизированное: "Maximized",
  Минимизированное: "Minimized",
  Нормальное: "Normal",
} as const

export type WindowAppearanceModeVariant = keyof typeof WindowAppearanceModeVariantToYAML
export type WindowAppearanceModeVariantYAML = keyof typeof WindowAppearanceModeVariantFromYAML

export const WindowDockVariantToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const WindowDockVariantFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type WindowDockVariant = keyof typeof WindowDockVariantToYAML
export type WindowDockVariantYAML = keyof typeof WindowDockVariantFromYAML

export const WindowLocationVariantToYAML = {
  Auto: "Авто",
  DontOverlapOwner: "НеПерекрыватьВладельца",
  Center: "Центрировать",
} as const

export const WindowLocationVariantFromYAML = {
  Авто: "Auto",
  НеПерекрыватьВладельца: "DontOverlapOwner",
  Центрировать: "Center",
} as const

export type WindowLocationVariant = keyof typeof WindowLocationVariantToYAML
export type WindowLocationVariantYAML = keyof typeof WindowLocationVariantFromYAML

export const WindowSizeChangeToYAML = {
  Change: "Изменять",
  DontChange: "НеИзменять",
} as const

export const WindowSizeChangeFromYAML = {
  Изменять: "Change",
  НеИзменять: "DontChange",
} as const

export type WindowSizeChange = keyof typeof WindowSizeChangeToYAML
export type WindowSizeChangeYAML = keyof typeof WindowSizeChangeFromYAML

export const WindowStateVariantToYAML = {
  Normal: "Обычное",
  Docked: "Прикрепленное",
  Autohide: "Прячущееся",
  Float: "Свободное",
} as const

export const WindowStateVariantFromYAML = {
  Обычное: "Normal",
  Прикрепленное: "Docked",
  Прячущееся: "Autohide",
  Свободное: "Float",
} as const

export type WindowStateVariant = keyof typeof WindowStateVariantToYAML
export type WindowStateVariantYAML = keyof typeof WindowStateVariantFromYAML

export const AutoSeriesSeparationToYAML = {
  All: "Все",
  Maximum: "Максимум",
  Minimum: "Минимум",
  None: "Нет",
} as const

export const AutoSeriesSeparationFromYAML = {
  Все: "All",
  Максимум: "Maximum",
  Минимум: "Minimum",
  Нет: "None",
} as const

export type AutoSeriesSeparation = keyof typeof AutoSeriesSeparationToYAML
export type AutoSeriesSeparationYAML = keyof typeof AutoSeriesSeparationFromYAML

export const BarChartPointsOrderToYAML = {
  Auto: "Авто",
  TopToBottom: "СверхуВниз",
  BottomToTop: "СнизуВверх",
} as const

export const BarChartPointsOrderFromYAML = {
  Авто: "Auto",
  СверхуВниз: "TopToBottom",
  СнизуВверх: "BottomToTop",
} as const

export type BarChartPointsOrder = keyof typeof BarChartPointsOrderToYAML
export type BarChartPointsOrderYAML = keyof typeof BarChartPointsOrderFromYAML

export const BubbleChartNegativeValuesShowModeToYAML = {
  InvertedBackColor: "ИнвертированныйЦветФона",
  DontShow: "НеОтображать",
  Abs: "ПоМодулю",
  Transparent: "ПрозрачныйФон",
} as const

export const BubbleChartNegativeValuesShowModeFromYAML = {
  ИнвертированныйЦветФона: "InvertedBackColor",
  НеОтображать: "DontShow",
  ПоМодулю: "Abs",
  ПрозрачныйФон: "Transparent",
} as const

export type BubbleChartNegativeValuesShowMode = keyof typeof BubbleChartNegativeValuesShowModeToYAML
export type BubbleChartNegativeValuesShowModeYAML = keyof typeof BubbleChartNegativeValuesShowModeFromYAML

export const ChartAnimationToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartAnimationFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartAnimation = keyof typeof ChartAnimationToYAML
export type ChartAnimationYAML = keyof typeof ChartAnimationFromYAML

export const ChartBoundaryDetectionMethodToYAML = {
  AutoDetect: "АвтоОпределение",
  UseValue: "ИспользоватьЗначение",
  UseValueWithLimitations: "ИспользоватьЗначениеСОграничением",
} as const

export const ChartBoundaryDetectionMethodFromYAML = {
  АвтоОпределение: "AutoDetect",
  ИспользоватьЗначение: "UseValue",
  ИспользоватьЗначениеСОграничением: "UseValueWithLimitations",
} as const

export type ChartBoundaryDetectionMethod = keyof typeof ChartBoundaryDetectionMethodToYAML
export type ChartBoundaryDetectionMethodYAML = keyof typeof ChartBoundaryDetectionMethodFromYAML

export const ChartBubbleSizeValueSourceToYAML = {
  None: "Нет",
  CommonSeries: "ОбщаяСерия",
  NextSeries: "СледующаяСерия",
} as const

export const ChartBubbleSizeValueSourceFromYAML = {
  Нет: "None",
  ОбщаяСерия: "CommonSeries",
  СледующаяСерия: "NextSeries",
} as const

export type ChartBubbleSizeValueSource = keyof typeof ChartBubbleSizeValueSourceToYAML
export type ChartBubbleSizeValueSourceYAML = keyof typeof ChartBubbleSizeValueSourceFromYAML

export const ChartBubbleSizingToYAML = {
  IncreaseDiameter: "УвеличениеДиаметра",
  IncreaseArea: "УвеличениеПлощади",
  DecreaseDiameter: "УменьшениеДиаметра",
  DecreaseArea: "УменьшениеПлощади",
} as const

export const ChartBubbleSizingFromYAML = {
  УвеличениеДиаметра: "IncreaseDiameter",
  УвеличениеПлощади: "IncreaseArea",
  УменьшениеДиаметра: "DecreaseDiameter",
  УменьшениеПлощади: "DecreaseArea",
} as const

export type ChartBubbleSizing = keyof typeof ChartBubbleSizingToYAML
export type ChartBubbleSizingYAML = keyof typeof ChartBubbleSizingFromYAML

export const ChartColorPaletteToYAML = {
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

export const ChartColorPaletteFromYAML = {
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

export type ChartColorPalette = keyof typeof ChartColorPaletteToYAML
export type ChartColorPaletteYAML = keyof typeof ChartColorPaletteFromYAML

export const ChartGridLinesShowModeToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ChartGridLinesShowModeFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ChartGridLinesShowMode = keyof typeof ChartGridLinesShowModeToYAML
export type ChartGridLinesShowModeYAML = keyof typeof ChartGridLinesShowModeFromYAML

export const ChartLabelLocationToYAML = {
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

export const ChartLabelLocationFromYAML = {
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

export type ChartLabelLocation = keyof typeof ChartLabelLocationToYAML
export type ChartLabelLocationYAML = keyof typeof ChartLabelLocationFromYAML

export const ChartLabelTypeToYAML = {
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

export const ChartLabelTypeFromYAML = {
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

export type ChartLabelType = keyof typeof ChartLabelTypeToYAML
export type ChartLabelTypeYAML = keyof typeof ChartLabelTypeFromYAML

export const ChartLabelsOrientationToYAML = {
  Auto: "Авто",
  Vertical: "Вертикально",
  Horizontal: "Горизонтально",
  CustomAngle: "ПроизвольныйУголНаклона",
} as const

export const ChartLabelsOrientationFromYAML = {
  Авто: "Auto",
  Вертикально: "Vertical",
  Горизонтально: "Horizontal",
  ПроизвольныйУголНаклона: "CustomAngle",
} as const

export type ChartLabelsOrientation = keyof typeof ChartLabelsOrientationToYAML
export type ChartLabelsOrientationYAML = keyof typeof ChartLabelsOrientationFromYAML

export const ChartLegendPlacementToYAML = {
  Auto: "Авто",
  Top: "Верх",
  Left: "Лево",
  None: "Нет",
  Bottom: "Низ",
  Right: "Право",
  UseCoordinates: "УказываетсяРасположение",
} as const

export const ChartLegendPlacementFromYAML = {
  Авто: "Auto",
  Верх: "Top",
  Лево: "Left",
  Нет: "None",
  Низ: "Bottom",
  Право: "Right",
  УказываетсяРасположение: "UseCoordinates",
} as const

export type ChartLegendPlacement = keyof typeof ChartLegendPlacementToYAML
export type ChartLegendPlacementYAML = keyof typeof ChartLegendPlacementFromYAML

export const ChartLineTypeToYAML = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const ChartLineTypeFromYAML = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type ChartLineType = keyof typeof ChartLineTypeToYAML
export type ChartLineTypeYAML = keyof typeof ChartLineTypeFromYAML

export const ChartMarkerTypeToYAML = {
  Auto: "Авто",
  Rect: "Квадрат",
  Circle: "Круг",
  None: "Нет",
  Rhomb: "Ромб",
  Alternation: "Чередование",
} as const

export const ChartMarkerTypeFromYAML = {
  Авто: "Auto",
  Квадрат: "Rect",
  Круг: "Circle",
  Нет: "None",
  Ромб: "Rhomb",
  Чередование: "Alternation",
} as const

export type ChartMarkerType = keyof typeof ChartMarkerTypeToYAML
export type ChartMarkerTypeYAML = keyof typeof ChartMarkerTypeFromYAML

export const ChartOrientationToYAML = {
  SouthEast: "ЮгВосток",
  SouthWest: "ЮгЗапад",
} as const

export const ChartOrientationFromYAML = {
  ЮгВосток: "SouthEast",
  ЮгЗапад: "SouthWest",
} as const

export type ChartOrientation = keyof typeof ChartOrientationToYAML
export type ChartOrientationYAML = keyof typeof ChartOrientationFromYAML

export const ChartPlotAreaPlacementToYAML = {
  Auto: "Авто",
  EmptySpace: "СвободноеМесто",
  UseCoordinates: "УказываетсяРасположение",
} as const

export const ChartPlotAreaPlacementFromYAML = {
  Авто: "Auto",
  СвободноеМесто: "EmptySpace",
  УказываетсяРасположение: "UseCoordinates",
} as const

export type ChartPlotAreaPlacement = keyof typeof ChartPlotAreaPlacementToYAML
export type ChartPlotAreaPlacementYAML = keyof typeof ChartPlotAreaPlacementFromYAML

export const ChartPointsAxisValuesSourceToYAML = {
  Auto: "Авто",
  Series: "Серия",
  Points: "Точки",
} as const

export const ChartPointsAxisValuesSourceFromYAML = {
  Авто: "Auto",
  Серия: "Series",
  Точки: "Points",
} as const

export type ChartPointsAxisValuesSource = keyof typeof ChartPointsAxisValuesSourceToYAML
export type ChartPointsAxisValuesSourceYAML = keyof typeof ChartPointsAxisValuesSourceFromYAML

export const ChartPointsConnectionTypeToYAML = {
  Auto: "Авто",
  DontConnect: "НеСоединять",
  Connect: "Соединять",
} as const

export const ChartPointsConnectionTypeFromYAML = {
  Авто: "Auto",
  НеСоединять: "DontConnect",
  Соединять: "Connect",
} as const

export type ChartPointsConnectionType = keyof typeof ChartPointsConnectionTypeToYAML
export type ChartPointsConnectionTypeYAML = keyof typeof ChartPointsConnectionTypeFromYAML

export const ChartReferenceBandBorderPositionToYAML = {
  Auto: "Авто",
  OnValue: "ВЗначении",
  BetweenValues: "МеждуЗначениями",
} as const

export const ChartReferenceBandBorderPositionFromYAML = {
  Авто: "Auto",
  ВЗначении: "OnValue",
  МеждуЗначениями: "BetweenValues",
} as const

export type ChartReferenceBandBorderPosition = keyof typeof ChartReferenceBandBorderPositionToYAML
export type ChartReferenceBandBorderPositionYAML = keyof typeof ChartReferenceBandBorderPositionFromYAML

export const ChartReferenceLinePositionToYAML = {
  Auto: "Авто",
  OnValue: "ВЗначении",
  BetweenValues: "МеждуЗначениями",
} as const

export const ChartReferenceLinePositionFromYAML = {
  Авто: "Auto",
  ВЗначении: "OnValue",
  МеждуЗначениями: "BetweenValues",
} as const

export type ChartReferenceLinePosition = keyof typeof ChartReferenceLinePositionToYAML
export type ChartReferenceLinePositionYAML = keyof typeof ChartReferenceLinePositionFromYAML

export const ChartScaleLabelLocationToYAML = {
  Auto: "Авто",
  Inside: "Внутри",
  None: "Нет",
  Outside: "Снаружи",
} as const

export const ChartScaleLabelLocationFromYAML = {
  Авто: "Auto",
  Внутри: "Inside",
  Нет: "None",
  Снаружи: "Outside",
} as const

export type ChartScaleLabelLocation = keyof typeof ChartScaleLabelLocationToYAML
export type ChartScaleLabelLocationYAML = keyof typeof ChartScaleLabelLocationFromYAML

export const ChartScaleLocationToYAML = {
  Auto: "Авто",
  BaseValue: "БазовоеЗначение",
  Edge: "Край",
} as const

export const ChartScaleLocationFromYAML = {
  Авто: "Auto",
  БазовоеЗначение: "BaseValue",
  Край: "Edge",
} as const

export type ChartScaleLocation = keyof typeof ChartScaleLocationToYAML
export type ChartScaleLocationYAML = keyof typeof ChartScaleLocationFromYAML

export const ChartScaleMarkLocationToYAML = {
  Auto: "Авто",
  Inside: "Внутри",
  None: "Нет",
  Outside: "Снаружи",
  Center: "Центр",
} as const

export const ChartScaleMarkLocationFromYAML = {
  Авто: "Auto",
  Внутри: "Inside",
  Нет: "None",
  Снаружи: "Outside",
  Центр: "Center",
} as const

export type ChartScaleMarkLocation = keyof typeof ChartScaleMarkLocationToYAML
export type ChartScaleMarkLocationYAML = keyof typeof ChartScaleMarkLocationFromYAML

export const ChartScaleTitlePlacementToYAML = {
  SpecialArea: "ВВыделеннойОбласти",
  PlotArea: "ВОбластиПостроения",
  WithAxis: "РядомСОсью",
} as const

export const ChartScaleTitlePlacementFromYAML = {
  ВВыделеннойОбласти: "SpecialArea",
  ВОбластиПостроения: "PlotArea",
  РядомСОсью: "WithAxis",
} as const

export type ChartScaleTitlePlacement = keyof typeof ChartScaleTitlePlacementToYAML
export type ChartScaleTitlePlacementYAML = keyof typeof ChartScaleTitlePlacementFromYAML

export const ChartScaleTitleTextSourceToYAML = {
  Auto: "Авто",
  AutoText: "АвтоТекст",
  UseText: "ИспользоватьТекст",
} as const

export const ChartScaleTitleTextSourceFromYAML = {
  Авто: "Auto",
  АвтоТекст: "AutoText",
  ИспользоватьТекст: "UseText",
} as const

export type ChartScaleTitleTextSource = keyof typeof ChartScaleTitleTextSourceToYAML
export type ChartScaleTitleTextSourceYAML = keyof typeof ChartScaleTitleTextSourceFromYAML

export const ChartSelectionModeToYAML = {
  Auto: "Авто",
  ValuesSelection: "ВыделениеЗначений",
  PointsSelection: "ВыделениеТочек",
  None: "Нет",
} as const

export const ChartSelectionModeFromYAML = {
  Авто: "Auto",
  ВыделениеЗначений: "ValuesSelection",
  ВыделениеТочек: "PointsSelection",
  Нет: "None",
} as const

export type ChartSelectionMode = keyof typeof ChartSelectionModeToYAML
export type ChartSelectionModeYAML = keyof typeof ChartSelectionModeFromYAML

export const ChartSemitransparencyModeToYAML = {
  Auto: "Авто",
  AutoCalculate: "АвтоматическийРасчет",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartSemitransparencyModeFromYAML = {
  Авто: "Auto",
  АвтоматическийРасчет: "AutoCalculate",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartSemitransparencyMode = keyof typeof ChartSemitransparencyModeToYAML
export type ChartSemitransparencyModeYAML = keyof typeof ChartSemitransparencyModeFromYAML

export const ChartSeriesGraphicalRepresentationTypeToYAML = {
  Auto: "Авто",
  Column: "Гистограмма",
  Column3D: "ГистограммаОбъемная",
  Line: "График",
  Step: "ГрафикПоШагам",
  Area: "ГрафикСОбластями",
} as const

export const ChartSeriesGraphicalRepresentationTypeFromYAML = {
  Авто: "Auto",
  Гистограмма: "Column",
  ГистограммаОбъемная: "Column3D",
  График: "Line",
  ГрафикПоШагам: "Step",
  ГрафикСОбластями: "Area",
} as const

export type ChartSeriesGraphicalRepresentationType = keyof typeof ChartSeriesGraphicalRepresentationTypeToYAML
export type ChartSeriesGraphicalRepresentationTypeYAML = keyof typeof ChartSeriesGraphicalRepresentationTypeFromYAML

export const ChartSeriesOrderInLegendToYAML = {
  Auto: "Авто",
  Reverse: "Обратный",
  Direct: "Прямой",
} as const

export const ChartSeriesOrderInLegendFromYAML = {
  Авто: "Auto",
  Обратный: "Reverse",
  Прямой: "Direct",
} as const

export type ChartSeriesOrderInLegend = keyof typeof ChartSeriesOrderInLegendToYAML
export type ChartSeriesOrderInLegendYAML = keyof typeof ChartSeriesOrderInLegendFromYAML

export const ChartSeriesStackTypeToYAML = {
  Auto: "Авто",
  Unstacked: "БезНакопления",
  Stacked: "СНакоплением",
  StackedNormalized: "СНакоплениемНормированная",
} as const

export const ChartSeriesStackTypeFromYAML = {
  Авто: "Auto",
  БезНакопления: "Unstacked",
  СНакоплением: "Stacked",
  СНакоплениемНормированная: "StackedNormalized",
} as const

export type ChartSeriesStackType = keyof typeof ChartSeriesStackTypeToYAML
export type ChartSeriesStackTypeYAML = keyof typeof ChartSeriesStackTypeFromYAML

export const ChartSpaceModeToYAML = {
  None: "Нет",
  Full: "ПолнаяШирина",
  Half: "ПоловинаШирины",
} as const

export const ChartSpaceModeFromYAML = {
  Нет: "None",
  ПолнаяШирина: "Full",
  ПоловинаШирины: "Half",
} as const

export type ChartSpaceMode = keyof typeof ChartSpaceModeToYAML
export type ChartSpaceModeYAML = keyof typeof ChartSpaceModeFromYAML

export const ChartSplineModeToYAML = {
  SmoothCurve: "ГладкаяКривая",
  None: "Нет",
} as const

export const ChartSplineModeFromYAML = {
  ГладкаяКривая: "SmoothCurve",
  Нет: "None",
} as const

export type ChartSplineMode = keyof typeof ChartSplineModeToYAML
export type ChartSplineModeYAML = keyof typeof ChartSplineModeFromYAML

export const ChartTitleAreaPlacementToYAML = {
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

export const ChartTitleAreaPlacementFromYAML = {
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

export type ChartTitleAreaPlacement = keyof typeof ChartTitleAreaPlacementToYAML
export type ChartTitleAreaPlacementYAML = keyof typeof ChartTitleAreaPlacementFromYAML

export const ChartTrendlineApproximationTypeToYAML = {
  Linear: "Линейный",
  Logarithmic: "Логарифмический",
  Polynomial: "Полиномиальный",
  Power: "Степенной",
  Exponential: "Экспоненциальный",
} as const

export const ChartTrendlineApproximationTypeFromYAML = {
  Линейный: "Linear",
  Логарифмический: "Logarithmic",
  Полиномиальный: "Polynomial",
  Степенной: "Power",
  Экспоненциальный: "Exponential",
} as const

export type ChartTrendlineApproximationType = keyof typeof ChartTrendlineApproximationTypeToYAML
export type ChartTrendlineApproximationTypeYAML = keyof typeof ChartTrendlineApproximationTypeFromYAML

export const ChartTrendlineFactorToYAML = {
  Auto: "Авто",
  PointValue: "ЗначениеТочки",
  PointNumber: "НомерТочки",
} as const

export const ChartTrendlineFactorFromYAML = {
  Авто: "Auto",
  ЗначениеТочки: "PointValue",
  НомерТочки: "PointNumber",
} as const

export type ChartTrendlineFactor = keyof typeof ChartTrendlineFactorToYAML
export type ChartTrendlineFactorYAML = keyof typeof ChartTrendlineFactorFromYAML

export const ChartTypeToYAML = {
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

export const ChartTypeFromYAML = {
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

export type ChartType = keyof typeof ChartTypeToYAML
export type ChartTypeYAML = keyof typeof ChartTypeFromYAML

export const ChartValueEditStateToYAML = {
  Finished: "Завершено",
  NotFinished: "НеЗавершено",
  Canceled: "Отменено",
} as const

export const ChartValueEditStateFromYAML = {
  Завершено: "Finished",
  НеЗавершено: "NotFinished",
  Отменено: "Canceled",
} as const

export type ChartValueEditState = keyof typeof ChartValueEditStateToYAML
export type ChartValueEditStateYAML = keyof typeof ChartValueEditStateFromYAML

export const ChartValuesBySeriesConnectionTypeToYAML = {
  None: "Нет",
  EdgesConnection: "СоединениеКраев",
} as const

export const ChartValuesBySeriesConnectionTypeFromYAML = {
  Нет: "None",
  СоединениеКраев: "EdgesConnection",
} as const

export type ChartValuesBySeriesConnectionType = keyof typeof ChartValuesBySeriesConnectionTypeToYAML
export type ChartValuesBySeriesConnectionTypeYAML = keyof typeof ChartValuesBySeriesConnectionTypeFromYAML

export const ChartValuesEditModeToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const ChartValuesEditModeFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type ChartValuesEditMode = keyof typeof ChartValuesEditModeToYAML
export type ChartValuesEditModeYAML = keyof typeof ChartValuesEditModeFromYAML

export const ChartValuesToolTipFillTypeToYAML = {
  Auto: "Авто",
  AllPointValues: "ВсеЗначенияТочки",
  SingleValue: "ОдноЗначение",
} as const

export const ChartValuesToolTipFillTypeFromYAML = {
  Авто: "Auto",
  ВсеЗначенияТочки: "AllPointValues",
  ОдноЗначение: "SingleValue",
} as const

export type ChartValuesToolTipFillType = keyof typeof ChartValuesToolTipFillTypeToYAML
export type ChartValuesToolTipFillTypeYAML = keyof typeof ChartValuesToolTipFillTypeFromYAML

export const ChartValuesToolTipShowModeToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  ShowForNearestValue: "ОтображатьДляБлижайшего",
  ShowOnHover: "ОтображатьПриНаведении",
} as const

export const ChartValuesToolTipShowModeFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  ОтображатьДляБлижайшего: "ShowForNearestValue",
  ОтображатьПриНаведении: "ShowOnHover",
} as const

export type ChartValuesToolTipShowMode = keyof typeof ChartValuesToolTipShowModeToYAML
export type ChartValuesToolTipShowModeYAML = keyof typeof ChartValuesToolTipShowModeFromYAML

export const GaugeChartValueRepresentationToYAML = {
  Sector: "Сектор",
  Needle: "Стрелка",
} as const

export const GaugeChartValueRepresentationFromYAML = {
  Сектор: "Sector",
  Стрелка: "Needle",
} as const

export type GaugeChartValueRepresentation = keyof typeof GaugeChartValueRepresentationToYAML
export type GaugeChartValueRepresentationYAML = keyof typeof GaugeChartValueRepresentationFromYAML

export const GaugeChartValuesScaleLabelsLocationToYAML = {
  InsideScale: "ВнутриШкалы",
  AtScale: "НаШкале",
} as const

export const GaugeChartValuesScaleLabelsLocationFromYAML = {
  ВнутриШкалы: "InsideScale",
  НаШкале: "AtScale",
} as const

export type GaugeChartValuesScaleLabelsLocation = keyof typeof GaugeChartValuesScaleLabelsLocationToYAML
export type GaugeChartValuesScaleLabelsLocationYAML = keyof typeof GaugeChartValuesScaleLabelsLocationFromYAML

export const MaxSeriesToYAML = {
  NotDefined: "НеЗадано",
  Limited: "Ограничено",
  Percent: "Процент",
} as const

export const MaxSeriesFromYAML = {
  НеЗадано: "NotDefined",
  Ограничено: "Limited",
  Процент: "Percent",
} as const

export type MaxSeries = keyof typeof MaxSeriesToYAML
export type MaxSeriesYAML = keyof typeof MaxSeriesFromYAML

export const NonnumericChartValueUseToYAML = {
  Auto: "Авто",
  AsZero: "КакНоль",
  Skip: "Пропускать",
} as const

export const NonnumericChartValueUseFromYAML = {
  Авто: "Auto",
  КакНоль: "AsZero",
  Пропускать: "Skip",
} as const

export type NonnumericChartValueUse = keyof typeof NonnumericChartValueUseToYAML
export type NonnumericChartValueUseYAML = keyof typeof NonnumericChartValueUseFromYAML

export const PointsConnectionAcrossSkippedChartValuesTypeToYAML = {
  Auto: "Авто",
  None: "Нет",
  ConnectUnskippedValues: "СоединениеНеПропущенных",
  ConnectWithBaseValue: "СоединениеСБазовымЗначением",
} as const

export const PointsConnectionAcrossSkippedChartValuesTypeFromYAML = {
  Авто: "Auto",
  Нет: "None",
  СоединениеНеПропущенных: "ConnectUnskippedValues",
  СоединениеСБазовымЗначением: "ConnectWithBaseValue",
} as const

export type PointsConnectionAcrossSkippedChartValuesType =
  keyof typeof PointsConnectionAcrossSkippedChartValuesTypeToYAML
export type PointsConnectionAcrossSkippedChartValuesTypeYAML =
  keyof typeof PointsConnectionAcrossSkippedChartValuesTypeFromYAML

export const RadarChartScaleTypeToYAML = {
  Circle: "Окружность",
  Polygon: "Полигон",
} as const

export const RadarChartScaleTypeFromYAML = {
  Окружность: "Circle",
  Полигон: "Polygon",
} as const

export type RadarChartScaleType = keyof typeof RadarChartScaleTypeToYAML
export type RadarChartScaleTypeYAML = keyof typeof RadarChartScaleTypeFromYAML

export const ShowChartPopupReferenceLineToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowChartPopupReferenceLineFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowChartPopupReferenceLine = keyof typeof ShowChartPopupReferenceLineToYAML
export type ShowChartPopupReferenceLineYAML = keyof typeof ShowChartPopupReferenceLineFromYAML

export const ShowChartScaleTitleToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowChartScaleTitleFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowChartScaleTitle = keyof typeof ShowChartScaleTitleToYAML
export type ShowChartScaleTitleYAML = keyof typeof ShowChartScaleTitleFromYAML

export const ShowInChartToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInChartFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInChart = keyof typeof ShowInChartToYAML
export type ShowInChartYAML = keyof typeof ShowInChartFromYAML

export const ShowInChartLegendToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInChartLegendFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInChartLegend = keyof typeof ShowInChartLegendToYAML
export type ShowInChartLegendYAML = keyof typeof ShowInChartLegendFromYAML

export const StockChartUsedPointValueToYAML = {
  Close: "Закрытие",
  High: "Максимальное",
  Low: "Минимальное",
  Open: "Открытие",
  OpenCloseAverage: "СреднееОткрытияИЗакрытия",
} as const

export const StockChartUsedPointValueFromYAML = {
  Закрытие: "Close",
  Максимальное: "High",
  Минимальное: "Low",
  Открытие: "Open",
  СреднееОткрытияИЗакрытия: "OpenCloseAverage",
} as const

export type StockChartUsedPointValue = keyof typeof StockChartUsedPointValueToYAML
export type StockChartUsedPointValueYAML = keyof typeof StockChartUsedPointValueFromYAML

export const UsedChartValuesAxisToYAML = {
  Auto: "Авто",
  Additional: "Дополнительная",
  Main: "Основная",
} as const

export const UsedChartValuesAxisFromYAML = {
  Авто: "Auto",
  Дополнительная: "Additional",
  Основная: "Main",
} as const

export type UsedChartValuesAxis = keyof typeof UsedChartValuesAxisToYAML
export type UsedChartValuesAxisYAML = keyof typeof UsedChartValuesAxisFromYAML

export const GanttChartIntervalRepresentationToYAML = {
  Gradient: "Градиент",
  ThreeDimensional: "Объемный",
  Flat: "Плоский",
  Rhomb: "Ромб",
} as const

export const GanttChartIntervalRepresentationFromYAML = {
  Градиент: "Gradient",
  Объемный: "ThreeDimensional",
  Плоский: "Flat",
  Ромб: "Rhomb",
} as const

export type GanttChartIntervalRepresentation = keyof typeof GanttChartIntervalRepresentationToYAML
export type GanttChartIntervalRepresentationYAML = keyof typeof GanttChartIntervalRepresentationFromYAML

export const GanttChartIntervalTextRepresentationToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const GanttChartIntervalTextRepresentationFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type GanttChartIntervalTextRepresentation = keyof typeof GanttChartIntervalTextRepresentationToYAML
export type GanttChartIntervalTextRepresentationYAML = keyof typeof GanttChartIntervalTextRepresentationFromYAML

export const GanttChartIntervalsSelectionModeToYAML = {
  Auto: "Авто",
  Multiple: "Множественный",
  None: "Нет",
  Single: "Одиночный",
} as const

export const GanttChartIntervalsSelectionModeFromYAML = {
  Авто: "Auto",
  Множественный: "Multiple",
  Нет: "None",
  Одиночный: "Single",
} as const

export type GanttChartIntervalsSelectionMode = keyof typeof GanttChartIntervalsSelectionModeToYAML
export type GanttChartIntervalsSelectionModeYAML = keyof typeof GanttChartIntervalsSelectionModeFromYAML

export const GanttChartLinkTypeToYAML = {
  EndEnd: "КонецКонец",
  EndBegin: "КонецНачало",
  BeginEnd: "НачалоКонец",
  BeginBegin: "НачалоНачало",
} as const

export const GanttChartLinkTypeFromYAML = {
  КонецКонец: "EndEnd",
  КонецНачало: "EndBegin",
  НачалоКонец: "BeginEnd",
  НачалоНачало: "BeginBegin",
} as const

export type GanttChartLinkType = keyof typeof GanttChartLinkTypeToYAML
export type GanttChartLinkTypeYAML = keyof typeof GanttChartLinkTypeFromYAML

export const GanttChartScaleKeepingToYAML = {
  Auto: "Авто",
  AllData: "ВсеДанные",
  Period: "Период",
  Fixed: "Фиксированная",
} as const

export const GanttChartScaleKeepingFromYAML = {
  Авто: "Auto",
  ВсеДанные: "AllData",
  Период: "Period",
  Фиксированная: "Fixed",
} as const

export type GanttChartScaleKeeping = keyof typeof GanttChartScaleKeepingToYAML
export type GanttChartScaleKeepingYAML = keyof typeof GanttChartScaleKeepingFromYAML

export const GanttChartTableLocationToYAML = {
  Auto: "Авто",
  Left: "Лево",
  None: "Нет",
  Right: "Право",
} as const

export const GanttChartTableLocationFromYAML = {
  Авто: "Auto",
  Лево: "Left",
  Нет: "None",
  Право: "Right",
} as const

export type GanttChartTableLocation = keyof typeof GanttChartTableLocationToYAML
export type GanttChartTableLocationYAML = keyof typeof GanttChartTableLocationFromYAML

export const GanttChartTextPlacementTypeToYAML = {
  Auto: "Авто",
  Cut: "Обрезать",
  Wrap: "Переносить",
} as const

export const GanttChartTextPlacementTypeFromYAML = {
  Авто: "Auto",
  Обрезать: "Cut",
  Переносить: "Wrap",
} as const

export type GanttChartTextPlacementType = keyof typeof GanttChartTextPlacementTypeToYAML
export type GanttChartTextPlacementTypeYAML = keyof typeof GanttChartTextPlacementTypeFromYAML

export const GanttChartValueTextRepresentationToYAML = {
  None: "НеОтображать",
  Right: "Право",
} as const

export const GanttChartValueTextRepresentationFromYAML = {
  НеОтображать: "None",
  Право: "Right",
} as const

export type GanttChartValueTextRepresentation = keyof typeof GanttChartValueTextRepresentationToYAML
export type GanttChartValueTextRepresentationYAML = keyof typeof GanttChartValueTextRepresentationFromYAML

export const GanttChartValuesSelectionModeToYAML = {
  Auto: "Авто",
  Multiple: "Множественный",
  None: "Нет",
  Single: "Одиночный",
} as const

export const GanttChartValuesSelectionModeFromYAML = {
  Авто: "Auto",
  Множественный: "Multiple",
  Нет: "None",
  Одиночный: "Single",
} as const

export type GanttChartValuesSelectionMode = keyof typeof GanttChartValuesSelectionModeToYAML
export type GanttChartValuesSelectionModeYAML = keyof typeof GanttChartValuesSelectionModeFromYAML

export const GanttChartVerticalStretchToYAML = {
  None: "НеРастягивать",
  StretchRows: "РастягиватьСтроки",
  StretchRowsAndData: "РастягиватьСтрокиИДанные",
} as const

export const GanttChartVerticalStretchFromYAML = {
  НеРастягивать: "None",
  РастягиватьСтроки: "StretchRows",
  РастягиватьСтрокиИДанные: "StretchRowsAndData",
} as const

export type GanttChartVerticalStretch = keyof typeof GanttChartVerticalStretchToYAML
export type GanttChartVerticalStretchYAML = keyof typeof GanttChartVerticalStretchFromYAML

export const ShowInGanttChartToYAML = {
  Auto: "Авто",
  DontShow: "НеОтображать",
  Show: "Отображать",
} as const

export const ShowInGanttChartFromYAML = {
  Авто: "Auto",
  НеОтображать: "DontShow",
  Отображать: "Show",
} as const

export type ShowInGanttChart = keyof typeof ShowInGanttChartToYAML
export type ShowInGanttChartYAML = keyof typeof ShowInGanttChartFromYAML

export const TimeScaleDayFormatToYAML = {
  MonthDay: "ДеньМесяца",
  MonthDayWeekDay: "ДеньМесяцаДеньНедели",
  WeekDay: "ДеньНедели",
  WeekDayMonthDay: "ДеньНеделиДеньМесяца",
} as const

export const TimeScaleDayFormatFromYAML = {
  ДеньМесяца: "MonthDay",
  ДеньМесяцаДеньНедели: "MonthDayWeekDay",
  ДеньНедели: "WeekDay",
  ДеньНеделиДеньМесяца: "WeekDayMonthDay",
} as const

export type TimeScaleDayFormat = keyof typeof TimeScaleDayFormatToYAML
export type TimeScaleDayFormatYAML = keyof typeof TimeScaleDayFormatFromYAML

export const TimeScaleUnitTypeToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Minute: "Минута",
  Week: "Неделя",
  Second: "Секунда",
  Hour: "Час",
} as const

export const TimeScaleUnitTypeFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Минута: "Minute",
  Неделя: "Week",
  Секунда: "Second",
  Час: "Hour",
} as const

export type TimeScaleUnitType = keyof typeof TimeScaleUnitTypeToYAML
export type TimeScaleUnitTypeYAML = keyof typeof TimeScaleUnitTypeFromYAML

export const PivotChartLabelsOrientationToYAML = {
  TopLevelsVertical: "ВерхниеУровниВертикально",
  AllLevelsVertical: "ВсеУровниВертикально",
  AllLevelsHorizontal: "ВсеУровниГоризонтально",
} as const

export const PivotChartLabelsOrientationFromYAML = {
  ВерхниеУровниВертикально: "TopLevelsVertical",
  ВсеУровниВертикально: "AllLevelsVertical",
  ВсеУровниГоризонтально: "AllLevelsHorizontal",
} as const

export type PivotChartLabelsOrientation = keyof typeof PivotChartLabelsOrientationToYAML
export type PivotChartLabelsOrientationYAML = keyof typeof PivotChartLabelsOrientationFromYAML

export const PivotChartScaleKeepingToYAML = {
  AllValues: "ВсеЗначения",
  ValuesCount: "КоличествоЗначений",
  MinimumWidth: "МинимальнаяШирина",
} as const

export const PivotChartScaleKeepingFromYAML = {
  ВсеЗначения: "AllValues",
  КоличествоЗначений: "ValuesCount",
  МинимальнаяШирина: "MinimumWidth",
} as const

export type PivotChartScaleKeeping = keyof typeof PivotChartScaleKeepingToYAML
export type PivotChartScaleKeepingYAML = keyof typeof PivotChartScaleKeepingFromYAML

export const PivotChartTypeToYAML = {
  Column: "Гистограмма",
  Column3D: "ГистограммаОбъемная",
} as const

export const PivotChartTypeFromYAML = {
  Гистограмма: "Column",
  ГистограммаОбъемная: "Column3D",
} as const

export type PivotChartType = keyof typeof PivotChartTypeToYAML
export type PivotChartTypeYAML = keyof typeof PivotChartTypeFromYAML

export const PivotChartValuesShowModeToYAML = {
  AllValues: "ВсеЗначения",
  LastLevelValues: "ЗначенияПоследнегоУровня",
} as const

export const PivotChartValuesShowModeFromYAML = {
  ВсеЗначения: "AllValues",
  ЗначенияПоследнегоУровня: "LastLevelValues",
} as const

export type PivotChartValuesShowMode = keyof typeof PivotChartValuesShowModeToYAML
export type PivotChartValuesShowModeYAML = keyof typeof PivotChartValuesShowModeFromYAML

export const DendrogramOrientationToYAML = {
  Top: "Верх",
  Left: "Лево",
  Bottom: "Низ",
  Right: "Право",
} as const

export const DendrogramOrientationFromYAML = {
  Верх: "Top",
  Лево: "Left",
  Низ: "Bottom",
  Право: "Right",
} as const

export type DendrogramOrientation = keyof typeof DendrogramOrientationToYAML
export type DendrogramOrientationYAML = keyof typeof DendrogramOrientationFromYAML

export const DendrogramScaleKeepingToYAML = {
  AllItems: "ВсеЭлементы",
  ItemCount: "КоличествоЭлементов",
  MinimumWidth: "МинимальнаяШирина",
} as const

export const DendrogramScaleKeepingFromYAML = {
  ВсеЭлементы: "AllItems",
  КоличествоЭлементов: "ItemCount",
  МинимальнаяШирина: "MinimumWidth",
} as const

export type DendrogramScaleKeeping = keyof typeof DendrogramScaleKeepingToYAML
export type DendrogramScaleKeepingYAML = keyof typeof DendrogramScaleKeepingFromYAML

export const GeographicalSchemaDataSourceOrganizationTypeToYAML = {
  AtRow: "ВСтроке",
  AtIntersection: "НаПересечении",
} as const

export const GeographicalSchemaDataSourceOrganizationTypeFromYAML = {
  ВСтроке: "AtRow",
  НаПересечении: "AtIntersection",
} as const

export type GeographicalSchemaDataSourceOrganizationType =
  keyof typeof GeographicalSchemaDataSourceOrganizationTypeToYAML
export type GeographicalSchemaDataSourceOrganizationTypeYAML =
  keyof typeof GeographicalSchemaDataSourceOrganizationTypeFromYAML

export const GeographicalSchemaLayerSeriesImportModeTypeToYAML = {
  ImportAll: "ИмпортироватьВсе",
  DontImport: "НеИмпортировать",
} as const

export const GeographicalSchemaLayerSeriesImportModeTypeFromYAML = {
  ИмпортироватьВсе: "ImportAll",
  НеИмпортировать: "DontImport",
} as const

export type GeographicalSchemaLayerSeriesImportModeType = keyof typeof GeographicalSchemaLayerSeriesImportModeTypeToYAML
export type GeographicalSchemaLayerSeriesImportModeTypeYAML =
  keyof typeof GeographicalSchemaLayerSeriesImportModeTypeFromYAML

export const GeographicalSchemaLayerSeriesShowModeToYAML = {
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

export const GeographicalSchemaLayerSeriesShowModeFromYAML = {
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

export type GeographicalSchemaLayerSeriesShowMode = keyof typeof GeographicalSchemaLayerSeriesShowModeToYAML
export type GeographicalSchemaLayerSeriesShowModeYAML = keyof typeof GeographicalSchemaLayerSeriesShowModeFromYAML

export const GeographicalSchemaLegendItemShowScaleTypeToYAML = {
  DontShow: "НеОтображать",
  ShowByValues: "ОтображатьПоЗначениям",
} as const

export const GeographicalSchemaLegendItemShowScaleTypeFromYAML = {
  НеОтображать: "DontShow",
  ОтображатьПоЗначениям: "ShowByValues",
} as const

export type GeographicalSchemaLegendItemShowScaleType = keyof typeof GeographicalSchemaLegendItemShowScaleTypeToYAML
export type GeographicalSchemaLegendItemShowScaleTypeYAML =
  keyof typeof GeographicalSchemaLegendItemShowScaleTypeFromYAML

export const GeographicalSchemaLineTypeToYAML = {
  None: "НетЛинии",
  Dashed: "Пунктир",
  DashDotted: "ПунктирТочка",
  DashDottedDotted: "ПунктирТочкаТочка",
  Solid: "Сплошная",
  Dotted: "Точечная",
} as const

export const GeographicalSchemaLineTypeFromYAML = {
  НетЛинии: "None",
  Пунктир: "Dashed",
  ПунктирТочка: "DashDotted",
  ПунктирТочкаТочка: "DashDottedDotted",
  Сплошная: "Solid",
  Точечная: "Dotted",
} as const

export type GeographicalSchemaLineType = keyof typeof GeographicalSchemaLineTypeToYAML
export type GeographicalSchemaLineTypeYAML = keyof typeof GeographicalSchemaLineTypeFromYAML

export const GeographicalSchemaMarkerTypeToYAML = {
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

export const GeographicalSchemaMarkerTypeFromYAML = {
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

export type GeographicalSchemaMarkerType = keyof typeof GeographicalSchemaMarkerTypeToYAML
export type GeographicalSchemaMarkerTypeYAML = keyof typeof GeographicalSchemaMarkerTypeFromYAML

export const GeographicalSchemaObjectFindTypeToYAML = {
  Included: "Включает",
  IncludedWholly: "ВключаетПолностью",
  Includes: "Включают",
  IncludesWholly: "ВключаютПолностью",
} as const

export const GeographicalSchemaObjectFindTypeFromYAML = {
  Включает: "Included",
  ВключаетПолностью: "IncludedWholly",
  Включают: "Includes",
  ВключаютПолностью: "IncludesWholly",
} as const

export type GeographicalSchemaObjectFindType = keyof typeof GeographicalSchemaObjectFindTypeToYAML
export type GeographicalSchemaObjectFindTypeYAML = keyof typeof GeographicalSchemaObjectFindTypeFromYAML

export const GeographicalSchemaPointObjectDrawingTypeToYAML = {
  Picture: "Картинка",
  Marker: "Маркер",
  Char: "Символ",
} as const

export const GeographicalSchemaPointObjectDrawingTypeFromYAML = {
  Картинка: "Picture",
  Маркер: "Marker",
  Символ: "Char",
} as const

export type GeographicalSchemaPointObjectDrawingType = keyof typeof GeographicalSchemaPointObjectDrawingTypeToYAML
export type GeographicalSchemaPointObjectDrawingTypeYAML = keyof typeof GeographicalSchemaPointObjectDrawingTypeFromYAML

export const GeographicalSchemaProjectionToYAML = {
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

export const GeographicalSchemaProjectionFromYAML = {
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

export type GeographicalSchemaProjection = keyof typeof GeographicalSchemaProjectionToYAML
export type GeographicalSchemaProjectionYAML = keyof typeof GeographicalSchemaProjectionFromYAML

export const GeographicalSchemaShowModeToYAML = {
  AllData: "ВсеДанные",
  ScaleDefined: "ЗадаетсяМасштабом",
  SpecifiedArea: "ЗаданнаяОбласть",
} as const

export const GeographicalSchemaShowModeFromYAML = {
  ВсеДанные: "AllData",
  ЗадаетсяМасштабом: "ScaleDefined",
  ЗаданнаяОбласть: "SpecifiedArea",
} as const

export type GeographicalSchemaShowMode = keyof typeof GeographicalSchemaShowModeToYAML
export type GeographicalSchemaShowModeYAML = keyof typeof GeographicalSchemaShowModeFromYAML

export const PaintingReferencePointPositionToYAML = {
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

export const PaintingReferencePointPositionFromYAML = {
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

export type PaintingReferencePointPosition = keyof typeof PaintingReferencePointPositionToYAML
export type PaintingReferencePointPositionYAML = keyof typeof PaintingReferencePointPositionFromYAML

export const SeriesValuesDrawingModeToYAML = {
  ShowAsPart: "ОтображатьКакДолю",
  ShowAsValue: "ОтображатьКакЗначение",
} as const

export const SeriesValuesDrawingModeFromYAML = {
  ОтображатьКакДолю: "ShowAsPart",
  ОтображатьКакЗначение: "ShowAsValue",
} as const

export type SeriesValuesDrawingMode = keyof typeof SeriesValuesDrawingModeToYAML
export type SeriesValuesDrawingModeYAML = keyof typeof SeriesValuesDrawingModeFromYAML

export const IntegrationServiceChannelStateToYAML = {
  Disconnected: "Отключен",
  Connected: "Подключен",
} as const

export const IntegrationServiceChannelStateFromYAML = {
  Отключен: "Disconnected",
  Подключен: "Connected",
} as const

export type IntegrationServiceChannelState = keyof typeof IntegrationServiceChannelStateToYAML
export type IntegrationServiceChannelStateYAML = keyof typeof IntegrationServiceChannelStateFromYAML

export const ArchiveFileCompressionLevelToYAML = {
  Maximum: "Максимальный",
  Minimum: "Минимальный",
  Optimal: "Оптимальный",
} as const

export const ArchiveFileCompressionLevelFromYAML = {
  Максимальный: "Maximum",
  Минимальный: "Minimum",
  Оптимальный: "Optimal",
} as const

export type ArchiveFileCompressionLevel = keyof typeof ArchiveFileCompressionLevelToYAML
export type ArchiveFileCompressionLevelYAML = keyof typeof ArchiveFileCompressionLevelFromYAML

export const ArchiveFileCompressionMethodToYAML = {
  BZIP2: "BZIP2",
  Copy: "Копирование",
  Deflate: "Сжатие",
} as const

export const ArchiveFileCompressionMethodFromYAML = {
  BZIP2: "BZIP2",
  Копирование: "Copy",
  Сжатие: "Deflate",
} as const

export type ArchiveFileCompressionMethod = keyof typeof ArchiveFileCompressionMethodToYAML
export type ArchiveFileCompressionMethodYAML = keyof typeof ArchiveFileCompressionMethodFromYAML

export const ArchiveFileEncryptionMethodToYAML = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export const ArchiveFileEncryptionMethodFromYAML = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export type ArchiveFileEncryptionMethod = keyof typeof ArchiveFileEncryptionMethodToYAML
export type ArchiveFileEncryptionMethodYAML = keyof typeof ArchiveFileEncryptionMethodFromYAML

export const ArchiveFileRestoreFilePathsModeToYAML = {
  Restore: "Восстанавливать",
  DontRestore: "НеВосстанавливать",
} as const

export const ArchiveFileRestoreFilePathsModeFromYAML = {
  Восстанавливать: "Restore",
  НеВосстанавливать: "DontRestore",
} as const

export type ArchiveFileRestoreFilePathsMode = keyof typeof ArchiveFileRestoreFilePathsModeToYAML
export type ArchiveFileRestoreFilePathsModeYAML = keyof typeof ArchiveFileRestoreFilePathsModeFromYAML

export const ArchiveFileStorePathModeToYAML = {
  DontStorePath: "НеСохранятьПути",
  StoreRelativePath: "СохранятьОтносительныеПути",
  StoreFullPath: "СохранятьПолныеПути",
} as const

export const ArchiveFileStorePathModeFromYAML = {
  НеСохранятьПути: "DontStorePath",
  СохранятьОтносительныеПути: "StoreRelativePath",
  СохранятьПолныеПути: "StoreFullPath",
} as const

export type ArchiveFileStorePathMode = keyof typeof ArchiveFileStorePathModeToYAML
export type ArchiveFileStorePathModeYAML = keyof typeof ArchiveFileStorePathModeFromYAML

export const ArchiveFileSubDirProcessingModeToYAML = {
  DontProcess: "НеОбрабатывать",
  ProcessRecursively: "ОбрабатыватьРекурсивно",
} as const

export const ArchiveFileSubDirProcessingModeFromYAML = {
  НеОбрабатывать: "DontProcess",
  ОбрабатыватьРекурсивно: "ProcessRecursively",
} as const

export type ArchiveFileSubDirProcessingMode = keyof typeof ArchiveFileSubDirProcessingModeToYAML
export type ArchiveFileSubDirProcessingModeYAML = keyof typeof ArchiveFileSubDirProcessingModeFromYAML

export const ArchiveFileTypeToYAML = {
  BZIP2: "BZIP2",
  GZIP: "GZIP",
  RAR: "RAR",
  SevenZIP: "SevenZIP",
  TAR: "TAR",
  XZ: "XZ",
  ZIP: "ZIP",
} as const

export const ArchiveFileTypeFromYAML = {
  BZIP2: "BZIP2",
  GZIP: "GZIP",
  RAR: "RAR",
  SevenZIP: "SevenZIP",
  TAR: "TAR",
  XZ: "XZ",
  ZIP: "ZIP",
} as const

export type ArchiveFileType = keyof typeof ArchiveFileTypeToYAML
export type ArchiveFileTypeYAML = keyof typeof ArchiveFileTypeFromYAML

export const FileNamesEncodingInArchiveFileToYAML = {
  UTF8: "UTF8",
  Auto: "Авто",
  OSEncodingWithUTF8: "КодировкаОСДополнительноUTF8",
} as const

export const FileNamesEncodingInArchiveFileFromYAML = {
  UTF8: "UTF8",
  Авто: "Auto",
  КодировкаОСДополнительноUTF8: "OSEncodingWithUTF8",
} as const

export type FileNamesEncodingInArchiveFile = keyof typeof FileNamesEncodingInArchiveFileToYAML
export type FileNamesEncodingInArchiveFileYAML = keyof typeof FileNamesEncodingInArchiveFileFromYAML

export const FileAccessToYAML = {
  Write: "Запись",
  Read: "Чтение",
  ReadAndWrite: "ЧтениеИЗапись",
} as const

export const FileAccessFromYAML = {
  Запись: "Write",
  Чтение: "Read",
  ЧтениеИЗапись: "ReadAndWrite",
} as const

export type FileAccess = keyof typeof FileAccessToYAML
export type FileAccessYAML = keyof typeof FileAccessFromYAML

export const FileCompareMethodToYAML = {
  Binary: "Двоичное",
  SpreadsheetDocument: "ТабличныйДокумент",
  TextDocument: "ТекстовыйДокумент",
} as const

export const FileCompareMethodFromYAML = {
  Двоичное: "Binary",
  ТабличныйДокумент: "SpreadsheetDocument",
  ТекстовыйДокумент: "TextDocument",
} as const

export type FileCompareMethod = keyof typeof FileCompareMethodToYAML
export type FileCompareMethodYAML = keyof typeof FileCompareMethodFromYAML

export const FileDialogModeToYAML = {
  ChooseDirectory: "ВыборКаталога",
  Open: "Открытие",
  Save: "Сохранение",
} as const

export const FileDialogModeFromYAML = {
  ВыборКаталога: "ChooseDirectory",
  Открытие: "Open",
  Сохранение: "Save",
} as const

export type FileDialogMode = keyof typeof FileDialogModeToYAML
export type FileDialogModeYAML = keyof typeof FileDialogModeFromYAML

export const FileDialogSectionToYAML = {
  Audio: "Аудио",
  Gallery: "Галерея",
  Documents: "Документы",
  Recent: "Недавние",
  Files: "Файлы",
} as const

export const FileDialogSectionFromYAML = {
  Аудио: "Audio",
  Галерея: "Gallery",
  Документы: "Documents",
  Недавние: "Recent",
  Файлы: "Files",
} as const

export type FileDialogSection = keyof typeof FileDialogSectionToYAML
export type FileDialogSectionYAML = keyof typeof FileDialogSectionFromYAML

export const FileDragModeToYAML = {
  AsFileRef: "КакСсылкаНаФайл",
  AsFile: "КакФайл",
} as const

export const FileDragModeFromYAML = {
  КакСсылкаНаФайл: "AsFileRef",
  КакФайл: "AsFile",
} as const

export type FileDragMode = keyof typeof FileDragModeToYAML
export type FileDragModeYAML = keyof typeof FileDragModeFromYAML

export const FileOpenModeToYAML = {
  Append: "Дописать",
  Truncate: "Обрезать",
  Open: "Открыть",
  OpenOrCreate: "ОткрытьИлиСоздать",
  Create: "Создать",
  CreateNew: "СоздатьНовый",
} as const

export const FileOpenModeFromYAML = {
  Дописать: "Append",
  Обрезать: "Truncate",
  Открыть: "Open",
  ОткрытьИлиСоздать: "OpenOrCreate",
  Создать: "Create",
  СоздатьНовый: "CreateNew",
} as const

export type FileOpenMode = keyof typeof FileOpenModeToYAML
export type FileOpenModeYAML = keyof typeof FileOpenModeFromYAML

export const GetFilesArchiveModeToYAML = {
  GetArchiveAlways: "ПолучатьАрхивВсегда",
  GetArchiveWhenRequired: "ПолучатьАрхивПриНеобходимости",
} as const

export const GetFilesArchiveModeFromYAML = {
  ПолучатьАрхивВсегда: "GetArchiveAlways",
  ПолучатьАрхивПриНеобходимости: "GetArchiveWhenRequired",
} as const

export type GetFilesArchiveMode = keyof typeof GetFilesArchiveModeToYAML
export type GetFilesArchiveModeYAML = keyof typeof GetFilesArchiveModeFromYAML

export const IncomingShareRequestStandardCommandToYAML = {
  CopyToClipboard: "КопироватьВБуферОбмена",
  ShareInConversation: "ПоделитьсяВОбсуждении",
  Show: "Показать",
  Save: "Сохранить",
} as const

export const IncomingShareRequestStandardCommandFromYAML = {
  КопироватьВБуферОбмена: "CopyToClipboard",
  ПоделитьсяВОбсуждении: "ShareInConversation",
  Показать: "Show",
  Сохранить: "Save",
} as const

export type IncomingShareRequestStandardCommand = keyof typeof IncomingShareRequestStandardCommandToYAML
export type IncomingShareRequestStandardCommandYAML = keyof typeof IncomingShareRequestStandardCommandFromYAML

export const MobileDeviceLibraryDirTypeToYAML = {
  Audio: "Аудио",
  Video: "Видео",
  Pictures: "Картинки",
} as const

export const MobileDeviceLibraryDirTypeFromYAML = {
  Аудио: "Audio",
  Видео: "Video",
  Картинки: "Pictures",
} as const

export type MobileDeviceLibraryDirType = keyof typeof MobileDeviceLibraryDirTypeToYAML
export type MobileDeviceLibraryDirTypeYAML = keyof typeof MobileDeviceLibraryDirTypeFromYAML

export const ShareRequestDataProcessingVariantToYAML = {
  View: "Просмотр",
  Edit: "Редактирование",
} as const

export const ShareRequestDataProcessingVariantFromYAML = {
  Просмотр: "View",
  Редактирование: "Edit",
} as const

export type ShareRequestDataProcessingVariant = keyof typeof ShareRequestDataProcessingVariantToYAML
export type ShareRequestDataProcessingVariantYAML = keyof typeof ShareRequestDataProcessingVariantFromYAML

export const AccountMainPresentationToYAML = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const AccountMainPresentationFromYAML = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type AccountMainPresentation = keyof typeof AccountMainPresentationToYAML
export type AccountMainPresentationYAML = keyof typeof AccountMainPresentationFromYAML

export const AccumulationRegisterTypeToYAML = {
  Turnovers: "Обороты",
  Balance: "Остатки",
} as const

export const AccumulationRegisterTypeFromYAML = {
  Обороты: "Turnovers",
  Остатки: "Balance",
} as const

export type AccumulationRegisterType = keyof typeof AccumulationRegisterTypeToYAML
export type AccumulationRegisterTypeYAML = keyof typeof AccumulationRegisterTypeFromYAML

export const AttributeUseToYAML = {
  ForFolder: "ДляГруппы",
  ForFolderAndItem: "ДляГруппыИЭлемента",
  ForItem: "ДляЭлемента",
} as const

export const AttributeUseFromYAML = {
  ДляГруппы: "ForFolder",
  ДляГруппыИЭлемента: "ForFolderAndItem",
  ДляЭлемента: "ForItem",
} as const

export type AttributeUse = keyof typeof AttributeUseToYAML
export type AttributeUseYAML = keyof typeof AttributeUseFromYAML

export const BinaryDataBlockStorageUseModeToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataBlockStorageUseModeFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataBlockStorageUseMode = keyof typeof BinaryDataBlockStorageUseModeToYAML
export type BinaryDataBlockStorageUseModeYAML = keyof typeof BinaryDataBlockStorageUseModeFromYAML

export const BinaryDataStorageModeToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataStorageModeFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataStorageMode = keyof typeof BinaryDataStorageModeToYAML
export type BinaryDataStorageModeYAML = keyof typeof BinaryDataStorageModeFromYAML

export const BusinessProcessNumberPeriodicityToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
} as const

export const BusinessProcessNumberPeriodicityFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
} as const

export type BusinessProcessNumberPeriodicity = keyof typeof BusinessProcessNumberPeriodicityToYAML
export type BusinessProcessNumberPeriodicityYAML = keyof typeof BusinessProcessNumberPeriodicityFromYAML

export const BusinessProcessNumberTypeToYAML = {
  String: "Строка",
  Number: "Число",
} as const

export const BusinessProcessNumberTypeFromYAML = {
  Строка: "String",
  Число: "Number",
} as const

export type BusinessProcessNumberType = keyof typeof BusinessProcessNumberTypeToYAML
export type BusinessProcessNumberTypeYAML = keyof typeof BusinessProcessNumberTypeFromYAML

export const CalculationRegisterPeriodicityToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
} as const

export const CalculationRegisterPeriodicityFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
} as const

export type CalculationRegisterPeriodicity = keyof typeof CalculationRegisterPeriodicityToYAML
export type CalculationRegisterPeriodicityYAML = keyof typeof CalculationRegisterPeriodicityFromYAML

export const CalculationTypeMainPresentationToYAML = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CalculationTypeMainPresentationFromYAML = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CalculationTypeMainPresentation = keyof typeof CalculationTypeMainPresentationToYAML
export type CalculationTypeMainPresentationYAML = keyof typeof CalculationTypeMainPresentationFromYAML

export const CatalogCodeTypeToYAML = {
  String: "Строка",
  Number: "Число",
} as const

export const CatalogCodeTypeFromYAML = {
  Строка: "String",
  Число: "Number",
} as const

export type CatalogCodeType = keyof typeof CatalogCodeTypeToYAML
export type CatalogCodeTypeYAML = keyof typeof CatalogCodeTypeFromYAML

export const CatalogCodesSeriesToYAML = {
  WholeCatalog: "ВоВсемСправочнике",
  WithinSubordination: "ВПределахПодчинения",
  WithinOwnerSubordination: "ВПределахПодчиненияВладельцу",
} as const

export const CatalogCodesSeriesFromYAML = {
  ВоВсемСправочнике: "WholeCatalog",
  ВПределахПодчинения: "WithinSubordination",
  ВПределахПодчиненияВладельцу: "WithinOwnerSubordination",
} as const

export type CatalogCodesSeries = keyof typeof CatalogCodesSeriesToYAML
export type CatalogCodesSeriesYAML = keyof typeof CatalogCodesSeriesFromYAML

export const CatalogMainPresentationToYAML = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CatalogMainPresentationFromYAML = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CatalogMainPresentation = keyof typeof CatalogMainPresentationToYAML
export type CatalogMainPresentationYAML = keyof typeof CatalogMainPresentationFromYAML

export const CharOfAccountCodeSeriesToYAML = {
  WholeChartOfAccounts: "ВоВсемПланеСчетов",
  WithinSubordination: "ВПределахПодчинения",
} as const

export const CharOfAccountCodeSeriesFromYAML = {
  ВоВсемПланеСчетов: "WholeChartOfAccounts",
  ВПределахПодчинения: "WithinSubordination",
} as const

export type CharOfAccountCodeSeries = keyof typeof CharOfAccountCodeSeriesToYAML
export type CharOfAccountCodeSeriesYAML = keyof typeof CharOfAccountCodeSeriesFromYAML

export const CharacteristicKindCodesSeriesToYAML = {
  WholeCharacteristicKind: "ВоВсемПланеВидовХарактеристик",
  WithinSubordination: "ВПределахПодчинения",
} as const

export const CharacteristicKindCodesSeriesFromYAML = {
  ВоВсемПланеВидовХарактеристик: "WholeCharacteristicKind",
  ВПределахПодчинения: "WithinSubordination",
} as const

export type CharacteristicKindCodesSeries = keyof typeof CharacteristicKindCodesSeriesToYAML
export type CharacteristicKindCodesSeriesYAML = keyof typeof CharacteristicKindCodesSeriesFromYAML

export const CharacteristicTypeMainPresentationToYAML = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const CharacteristicTypeMainPresentationFromYAML = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type CharacteristicTypeMainPresentation = keyof typeof CharacteristicTypeMainPresentationToYAML
export type CharacteristicTypeMainPresentationYAML = keyof typeof CharacteristicTypeMainPresentationFromYAML

export const ChartOfCalculationTypesBaseUseToYAML = {
  DontUse: "НеИспользовать",
  OnActionPeriod: "ПоПериодуДействия",
  OnRegistrationPeriod: "ПоПериодуРегистрации",
} as const

export const ChartOfCalculationTypesBaseUseFromYAML = {
  НеИспользовать: "DontUse",
  ПоПериодуДействия: "OnActionPeriod",
  ПоПериодуРегистрации: "OnRegistrationPeriod",
} as const

export type ChartOfCalculationTypesBaseUse = keyof typeof ChartOfCalculationTypesBaseUseToYAML
export type ChartOfCalculationTypesBaseUseYAML = keyof typeof ChartOfCalculationTypesBaseUseFromYAML

export const ChartOfCalculationTypesCodeTypeToYAML = {
  String: "Строка",
  Number: "Число",
} as const

export const ChartOfCalculationTypesCodeTypeFromYAML = {
  Строка: "String",
  Число: "Number",
} as const

export type ChartOfCalculationTypesCodeType = keyof typeof ChartOfCalculationTypesCodeTypeToYAML
export type ChartOfCalculationTypesCodeTypeYAML = keyof typeof ChartOfCalculationTypesCodeTypeFromYAML

export const ChoiceDataGetModeOnInputByStringToYAML = {
  Directly: "Непосредственно",
  Background: "Фоновый",
} as const

export const ChoiceDataGetModeOnInputByStringFromYAML = {
  Непосредственно: "Directly",
  Фоновый: "Background",
} as const

export type ChoiceDataGetModeOnInputByString = keyof typeof ChoiceDataGetModeOnInputByStringToYAML
export type ChoiceDataGetModeOnInputByStringYAML = keyof typeof ChoiceDataGetModeOnInputByStringFromYAML

export const ChoiceModeToYAML = {
  QuickChoice: "БыстрыйВыбор",
  FromForm: "ИзФормы",
  BothWays: "ОбоимиСпособами",
} as const

export const ChoiceModeFromYAML = {
  БыстрыйВыбор: "QuickChoice",
  ИзФормы: "FromForm",
  ОбоимиСпособами: "BothWays",
} as const

export type ChoiceMode = keyof typeof ChoiceModeToYAML
export type ChoiceModeYAML = keyof typeof ChoiceModeFromYAML

export const CommonAttributeAuthenticationSeparationToYAML = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeAuthenticationSeparationFromYAML = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeAuthenticationSeparation = keyof typeof CommonAttributeAuthenticationSeparationToYAML
export type CommonAttributeAuthenticationSeparationYAML = keyof typeof CommonAttributeAuthenticationSeparationFromYAML

export const CommonAttributeAutoUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CommonAttributeAutoUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CommonAttributeAutoUse = keyof typeof CommonAttributeAutoUseToYAML
export type CommonAttributeAutoUseYAML = keyof typeof CommonAttributeAutoUseFromYAML

export const CommonAttributeConfigurationExtensionsSeparationToYAML = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeConfigurationExtensionsSeparationFromYAML = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeConfigurationExtensionsSeparation =
  keyof typeof CommonAttributeConfigurationExtensionsSeparationToYAML
export type CommonAttributeConfigurationExtensionsSeparationYAML =
  keyof typeof CommonAttributeConfigurationExtensionsSeparationFromYAML

export const CommonAttributeDataSeparationToYAML = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeDataSeparationFromYAML = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeDataSeparation = keyof typeof CommonAttributeDataSeparationToYAML
export type CommonAttributeDataSeparationYAML = keyof typeof CommonAttributeDataSeparationFromYAML

export const CommonAttributeSeparatedDataUseToYAML = {
  Independently: "Независимо",
  IndependentlyAndSimultaneously: "НезависимоИСовместно",
} as const

export const CommonAttributeSeparatedDataUseFromYAML = {
  Независимо: "Independently",
  НезависимоИСовместно: "IndependentlyAndSimultaneously",
} as const

export type CommonAttributeSeparatedDataUse = keyof typeof CommonAttributeSeparatedDataUseToYAML
export type CommonAttributeSeparatedDataUseYAML = keyof typeof CommonAttributeSeparatedDataUseFromYAML

export const CommonAttributeUseToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CommonAttributeUseFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CommonAttributeUse = keyof typeof CommonAttributeUseToYAML
export type CommonAttributeUseYAML = keyof typeof CommonAttributeUseFromYAML

export const CommonAttributeUsersSeparationToYAML = {
  DontUse: "НеИспользовать",
  Separate: "Разделять",
} as const

export const CommonAttributeUsersSeparationFromYAML = {
  НеИспользовать: "DontUse",
  Разделять: "Separate",
} as const

export type CommonAttributeUsersSeparation = keyof typeof CommonAttributeUsersSeparationToYAML
export type CommonAttributeUsersSeparationYAML = keyof typeof CommonAttributeUsersSeparationFromYAML

export const CompatibilityModeToYAML = {
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

export const CompatibilityModeFromYAML = {
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

export type CompatibilityMode = keyof typeof CompatibilityModeToYAML
export type CompatibilityModeYAML = keyof typeof CompatibilityModeFromYAML

export const ConfigurationExtensionPurposeToYAML = {
  Customization: "Адаптация",
  AddOn: "Дополнение",
  Patch: "Исправление",
} as const

export const ConfigurationExtensionPurposeFromYAML = {
  Адаптация: "Customization",
  Дополнение: "AddOn",
  Исправление: "Patch",
} as const

export type ConfigurationExtensionPurpose = keyof typeof ConfigurationExtensionPurposeToYAML
export type ConfigurationExtensionPurposeYAML = keyof typeof ConfigurationExtensionPurposeFromYAML

export const CreateOnInputToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const CreateOnInputFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type CreateOnInput = keyof typeof CreateOnInputToYAML
export type CreateOnInputYAML = keyof typeof CreateOnInputFromYAML

export const DataExchangeMainPresentationToYAML = {
  AsCode: "ВВидеКода",
  AsDescription: "ВВидеНаименования",
} as const

export const DataExchangeMainPresentationFromYAML = {
  ВВидеКода: "AsCode",
  ВВидеНаименования: "AsDescription",
} as const

export type DataExchangeMainPresentation = keyof typeof DataExchangeMainPresentationToYAML
export type DataExchangeMainPresentationYAML = keyof typeof DataExchangeMainPresentationFromYAML

export const DataHistoryUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const DataHistoryUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type DataHistoryUse = keyof typeof DataHistoryUseToYAML
export type DataHistoryUseYAML = keyof typeof DataHistoryUseFromYAML

export const DefaultDataLockControlModeToYAML = {
  Automatic: "Автоматический",
  AutomaticAndManaged: "АвтоматическийИУправляемый",
  Managed: "Управляемый",
} as const

export const DefaultDataLockControlModeFromYAML = {
  Автоматический: "Automatic",
  АвтоматическийИУправляемый: "AutomaticAndManaged",
  Управляемый: "Managed",
} as const

export type DefaultDataLockControlMode = keyof typeof DefaultDataLockControlModeToYAML
export type DefaultDataLockControlModeYAML = keyof typeof DefaultDataLockControlModeFromYAML

export const DocumentNumberPeriodicityToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
} as const

export const DocumentNumberPeriodicityFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
} as const

export type DocumentNumberPeriodicity = keyof typeof DocumentNumberPeriodicityToYAML
export type DocumentNumberPeriodicityYAML = keyof typeof DocumentNumberPeriodicityFromYAML

export const DocumentNumberTypeToYAML = {
  String: "Строка",
  Number: "Число",
} as const

export const DocumentNumberTypeFromYAML = {
  Строка: "String",
  Число: "Number",
} as const

export type DocumentNumberType = keyof typeof DocumentNumberTypeToYAML
export type DocumentNumberTypeYAML = keyof typeof DocumentNumberTypeFromYAML

export const EditTypeToYAML = {
  InDialog: "ВДиалоге",
  InList: "ВСписке",
  BothWays: "ОбоимиСпособами",
} as const

export const EditTypeFromYAML = {
  ВДиалоге: "InDialog",
  ВСписке: "InList",
  ОбоимиСпособами: "BothWays",
} as const

export type EditType = keyof typeof EditTypeToYAML
export type EditTypeYAML = keyof typeof EditTypeFromYAML

export const ExternalDataSourceTableDataTypeToYAML = {
  NonobjectData: "НеобъектныеДанные",
  ObjectData: "ОбъектныеДанные",
} as const

export const ExternalDataSourceTableDataTypeFromYAML = {
  НеобъектныеДанные: "NonobjectData",
  ОбъектныеДанные: "ObjectData",
} as const

export type ExternalDataSourceTableDataType = keyof typeof ExternalDataSourceTableDataTypeToYAML
export type ExternalDataSourceTableDataTypeYAML = keyof typeof ExternalDataSourceTableDataTypeFromYAML

export const ExternalDataSourceTableTypeToYAML = {
  Expression: "Выражение",
  Table: "Таблица",
} as const

export const ExternalDataSourceTableTypeFromYAML = {
  Выражение: "Expression",
  Таблица: "Table",
} as const

export type ExternalDataSourceTableType = keyof typeof ExternalDataSourceTableTypeToYAML
export type ExternalDataSourceTableTypeYAML = keyof typeof ExternalDataSourceTableTypeFromYAML

export const FormTypeToYAML = {
  Ordinary: "Обычная",
  Managed: "Управляемая",
} as const

export const FormTypeFromYAML = {
  Обычная: "Ordinary",
  Управляемая: "Managed",
} as const

export type FormType = keyof typeof FormTypeToYAML
export type FormTypeYAML = keyof typeof FormTypeFromYAML

export const FullTextSearchOnInputByStringToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const FullTextSearchOnInputByStringFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type FullTextSearchOnInputByString = keyof typeof FullTextSearchOnInputByStringToYAML
export type FullTextSearchOnInputByStringYAML = keyof typeof FullTextSearchOnInputByStringFromYAML

export const HTTPMethodToYAML = {
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

export const HTTPMethodFromYAML = {
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

export type HTTPMethod = keyof typeof HTTPMethodToYAML
export type HTTPMethodYAML = keyof typeof HTTPMethodFromYAML

export const HierarchyTypeToYAML = {
  HierarchyFoldersAndItems: "ИерархияГруппИЭлементов",
  HierarchyOfItems: "ИерархияЭлементов",
} as const

export const HierarchyTypeFromYAML = {
  ИерархияГруппИЭлементов: "HierarchyFoldersAndItems",
  ИерархияЭлементов: "HierarchyOfItems",
} as const

export type HierarchyType = keyof typeof HierarchyTypeToYAML
export type HierarchyTypeYAML = keyof typeof HierarchyTypeFromYAML

export const IndexingToYAML = {
  Index: "Индексировать",
  IndexWithAdditionalOrder: "ИндексироватьСДопУпорядочиванием",
  DontIndex: "НеИндексировать",
} as const

export const IndexingFromYAML = {
  Индексировать: "Index",
  ИндексироватьСДопУпорядочиванием: "IndexWithAdditionalOrder",
  НеИндексировать: "DontIndex",
} as const

export type Indexing = keyof typeof IndexingToYAML
export type IndexingYAML = keyof typeof IndexingFromYAML

export const InformationRegisterPeriodicityToYAML = {
  Year: "Год",
  Day: "День",
  Quarter: "Квартал",
  Month: "Месяц",
  Nonperiodical: "Непериодический",
  RecorderPosition: "ПозицияРегистратора",
  Second: "Секунда",
} as const

export const InformationRegisterPeriodicityFromYAML = {
  Год: "Year",
  День: "Day",
  Квартал: "Quarter",
  Месяц: "Month",
  Непериодический: "Nonperiodical",
  ПозицияРегистратора: "RecorderPosition",
  Секунда: "Second",
} as const

export type InformationRegisterPeriodicity = keyof typeof InformationRegisterPeriodicityToYAML
export type InformationRegisterPeriodicityYAML = keyof typeof InformationRegisterPeriodicityFromYAML

export const IntegrationServiceChannelMessageDirectionToYAML = {
  Send: "Отправка",
  Receive: "Получение",
} as const

export const IntegrationServiceChannelMessageDirectionFromYAML = {
  Отправка: "Send",
  Получение: "Receive",
} as const

export type IntegrationServiceChannelMessageDirection = keyof typeof IntegrationServiceChannelMessageDirectionToYAML
export type IntegrationServiceChannelMessageDirectionYAML =
  keyof typeof IntegrationServiceChannelMessageDirectionFromYAML

export const ModalityUseModeToYAML = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const ModalityUseModeFromYAML = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type ModalityUseMode = keyof typeof ModalityUseModeToYAML
export type ModalityUseModeYAML = keyof typeof ModalityUseModeFromYAML

export const MoveBoundaryOnPostingToYAML = {
  DontMove: "НеПеремещать",
  Move: "Перемещать",
} as const

export const MoveBoundaryOnPostingFromYAML = {
  НеПеремещать: "DontMove",
  Перемещать: "Move",
} as const

export type MoveBoundaryOnPosting = keyof typeof MoveBoundaryOnPostingToYAML
export type MoveBoundaryOnPostingYAML = keyof typeof MoveBoundaryOnPostingFromYAML

export const ObjectAutonumerationModeToYAML = {
  NotAutoFree: "НеОсвобождатьАвтоматически",
  AutoFree: "ОсвобождатьАвтоматически",
} as const

export const ObjectAutonumerationModeFromYAML = {
  НеОсвобождатьАвтоматически: "NotAutoFree",
  ОсвобождатьАвтоматически: "AutoFree",
} as const

export type ObjectAutonumerationMode = keyof typeof ObjectAutonumerationModeToYAML
export type ObjectAutonumerationModeYAML = keyof typeof ObjectAutonumerationModeFromYAML

export const ObjectBelongingToYAML = {
  Adopted: "Заимствованный",
  Native: "Собственный",
} as const

export const ObjectBelongingFromYAML = {
  Заимствованный: "Adopted",
  Собственный: "Native",
} as const

export type ObjectBelonging = keyof typeof ObjectBelongingToYAML
export type ObjectBelongingYAML = keyof typeof ObjectBelongingFromYAML

export const PostingToYAML = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const PostingFromYAML = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type Posting = keyof typeof PostingToYAML
export type PostingYAML = keyof typeof PostingFromYAML

export const RealTimePostingToYAML = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const RealTimePostingFromYAML = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type RealTimePosting = keyof typeof RealTimePostingToYAML
export type RealTimePostingYAML = keyof typeof RealTimePostingFromYAML

export const RegisterRecordsDeletionToYAML = {
  AutoDeleteOff: "НеУдалятьАвтоматически",
  AutoDelete: "УдалятьАвтоматически",
  AutoDeleteOnUnpost: "УдалятьАвтоматическиПриОтменеПроведения",
} as const

export const RegisterRecordsDeletionFromYAML = {
  НеУдалятьАвтоматически: "AutoDeleteOff",
  УдалятьАвтоматически: "AutoDelete",
  УдалятьАвтоматическиПриОтменеПроведения: "AutoDeleteOnUnpost",
} as const

export type RegisterRecordsDeletion = keyof typeof RegisterRecordsDeletionToYAML
export type RegisterRecordsDeletionYAML = keyof typeof RegisterRecordsDeletionFromYAML

export const RegisterRecordsWritingOnPostToYAML = {
  WriteSelected: "ЗаписыватьВыбранные",
  WriteModified: "ЗаписыватьМодифицированные",
} as const

export const RegisterRecordsWritingOnPostFromYAML = {
  ЗаписыватьВыбранные: "WriteSelected",
  ЗаписыватьМодифицированные: "WriteModified",
} as const

export type RegisterRecordsWritingOnPost = keyof typeof RegisterRecordsWritingOnPostToYAML
export type RegisterRecordsWritingOnPostYAML = keyof typeof RegisterRecordsWritingOnPostFromYAML

export const RegisterWriteModeToYAML = {
  Independent: "Независимый",
  RecorderSubordinate: "ПодчинениеРегистратору",
} as const

export const RegisterWriteModeFromYAML = {
  Независимый: "Independent",
  ПодчинениеРегистратору: "RecorderSubordinate",
} as const

export type RegisterWriteMode = keyof typeof RegisterWriteModeToYAML
export type RegisterWriteModeYAML = keyof typeof RegisterWriteModeFromYAML

export const ReturnValuesReuseToYAML = {
  DuringRequest: "НаВремяВызова",
  DuringSession: "НаВремяСеанса",
  DontUse: "НеИспользовать",
} as const

export const ReturnValuesReuseFromYAML = {
  НаВремяВызова: "DuringRequest",
  НаВремяСеанса: "DuringSession",
  НеИспользовать: "DontUse",
} as const

export type ReturnValuesReuse = keyof typeof ReturnValuesReuseToYAML
export type ReturnValuesReuseYAML = keyof typeof ReturnValuesReuseFromYAML

export const ScriptVariantToYAML = {
  English: "Английский",
  Russian: "Русский",
} as const

export const ScriptVariantFromYAML = {
  Английский: "English",
  Русский: "Russian",
} as const

export type ScriptVariant = keyof typeof ScriptVariantToYAML
export type ScriptVariantYAML = keyof typeof ScriptVariantFromYAML

export const SearchStringModeOnInputByStringToYAML = {
  AnyPart: "ЛюбаяЧасть",
  Begin: "Начало",
} as const

export const SearchStringModeOnInputByStringFromYAML = {
  ЛюбаяЧасть: "AnyPart",
  Начало: "Begin",
} as const

export type SearchStringModeOnInputByString = keyof typeof SearchStringModeOnInputByStringToYAML
export type SearchStringModeOnInputByStringYAML = keyof typeof SearchStringModeOnInputByStringFromYAML

export const SequenceFillingToYAML = {
  AutoFill: "ЗаполнятьАвтоматически",
  AutoFillOff: "НеЗаполнятьАвтоматически",
} as const

export const SequenceFillingFromYAML = {
  ЗаполнятьАвтоматически: "AutoFill",
  НеЗаполнятьАвтоматически: "AutoFillOff",
} as const

export type SequenceFilling = keyof typeof SequenceFillingToYAML
export type SequenceFillingYAML = keyof typeof SequenceFillingFromYAML

export const SessionReuseModeToYAML = {
  Use: "Использовать",
  AutoUse: "ИспользоватьАвтоматически",
  DontUse: "НеИспользовать",
} as const

export const SessionReuseModeFromYAML = {
  Использовать: "Use",
  ИспользоватьАвтоматически: "AutoUse",
  НеИспользовать: "DontUse",
} as const

export type SessionReuseMode = keyof typeof SessionReuseModeToYAML
export type SessionReuseModeYAML = keyof typeof SessionReuseModeFromYAML

export const StyleElementTypeToYAML = {
  Border: "Рамка",
  Color: "Цвет",
  Font: "Шрифт",
} as const

export const StyleElementTypeFromYAML = {
  Рамка: "Border",
  Цвет: "Color",
  Шрифт: "Font",
} as const

export type StyleElementType = keyof typeof StyleElementTypeToYAML
export type StyleElementTypeYAML = keyof typeof StyleElementTypeFromYAML

export const SubordinationUseToYAML = {
  ToFolders: "Группам",
  ToFoldersAndItems: "ГруппамИЭлементам",
  ToItems: "Элементам",
} as const

export const SubordinationUseFromYAML = {
  Группам: "ToFolders",
  ГруппамИЭлементам: "ToFoldersAndItems",
  Элементам: "ToItems",
} as const

export type SubordinationUse = keyof typeof SubordinationUseToYAML
export type SubordinationUseYAML = keyof typeof SubordinationUseFromYAML

export const SynchronousExtensionAndAddInCallUseModeToYAML = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const SynchronousExtensionAndAddInCallUseModeFromYAML = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type SynchronousExtensionAndAddInCallUseMode = keyof typeof SynchronousExtensionAndAddInCallUseModeToYAML
export type SynchronousExtensionAndAddInCallUseModeYAML = keyof typeof SynchronousExtensionAndAddInCallUseModeFromYAML

export const SynchronousPlatformExtensionAndAddInCallUseModeToYAML = {
  Use: "Использовать",
  UseWithWarnings: "ИспользоватьСПредупреждениями",
  DontUse: "НеИспользовать",
} as const

export const SynchronousPlatformExtensionAndAddInCallUseModeFromYAML = {
  Использовать: "Use",
  ИспользоватьСПредупреждениями: "UseWithWarnings",
  НеИспользовать: "DontUse",
} as const

export type SynchronousPlatformExtensionAndAddInCallUseMode =
  keyof typeof SynchronousPlatformExtensionAndAddInCallUseModeToYAML
export type SynchronousPlatformExtensionAndAddInCallUseModeYAML =
  keyof typeof SynchronousPlatformExtensionAndAddInCallUseModeFromYAML

export const TaskMainPresentationToYAML = {
  AsDescription: "ВВидеНаименования",
  AsNumber: "ВВидеНомера",
} as const

export const TaskMainPresentationFromYAML = {
  ВВидеНаименования: "AsDescription",
  ВВидеНомера: "AsNumber",
} as const

export type TaskMainPresentation = keyof typeof TaskMainPresentationToYAML
export type TaskMainPresentationYAML = keyof typeof TaskMainPresentationFromYAML

export const TaskNumberAutoPrefixToYAML = {
  DontUse: "НеИспользовать",
  BusinessProcessNumber: "НомерБизнесПроцесса",
} as const

export const TaskNumberAutoPrefixFromYAML = {
  НеИспользовать: "DontUse",
  НомерБизнесПроцесса: "BusinessProcessNumber",
} as const

export type TaskNumberAutoPrefix = keyof typeof TaskNumberAutoPrefixToYAML
export type TaskNumberAutoPrefixYAML = keyof typeof TaskNumberAutoPrefixFromYAML

export const TaskNumberTypeToYAML = {
  String: "Строка",
  Number: "Число",
} as const

export const TaskNumberTypeFromYAML = {
  Строка: "String",
  Число: "Number",
} as const

export type TaskNumberType = keyof typeof TaskNumberTypeToYAML
export type TaskNumberTypeYAML = keyof typeof TaskNumberTypeFromYAML

export const TemplateTypeToYAML = {
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

export const TemplateTypeFromYAML = {
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

export type TemplateType = keyof typeof TemplateTypeToYAML
export type TemplateTypeYAML = keyof typeof TemplateTypeFromYAML

export const TransferDirectionToYAML = {
  In: "Входной",
  InOut: "ВходнойВыходной",
  Out: "Выходной",
} as const

export const TransferDirectionFromYAML = {
  Входной: "In",
  ВходнойВыходной: "InOut",
  Выходной: "Out",
} as const

export type TransferDirection = keyof typeof TransferDirectionToYAML
export type TransferDirectionYAML = keyof typeof TransferDirectionFromYAML

export const TypeReductionModeToYAML = {
  Deny: "Запрещать",
  TransformValues: "ПреобразовыватьЗначения",
  DeleteData: "УдалятьДанные",
} as const

export const TypeReductionModeFromYAML = {
  Запрещать: "Deny",
  ПреобразовыватьЗначения: "TransformValues",
  УдалятьДанные: "DeleteData",
} as const

export type TypeReductionMode = keyof typeof TypeReductionModeToYAML
export type TypeReductionModeYAML = keyof typeof TypeReductionModeFromYAML

export const UseFullTextSearchToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseFullTextSearchFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseFullTextSearch = keyof typeof UseFullTextSearchToYAML
export type UseFullTextSearchYAML = keyof typeof UseFullTextSearchFromYAML

export const UseQuickChoiceToYAML = {
  Auto: "Авто",
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const UseQuickChoiceFromYAML = {
  Авто: "Auto",
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type UseQuickChoice = keyof typeof UseQuickChoiceToYAML
export type UseQuickChoiceYAML = keyof typeof UseQuickChoiceFromYAML

export const PresentationAdditionTypeToYAML = {
  Add: "Добавлять",
  DontAdd: "НеДобавлять",
} as const

export const PresentationAdditionTypeFromYAML = {
  Добавлять: "Add",
  НеДобавлять: "DontAdd",
} as const

export type PresentationAdditionType = keyof typeof PresentationAdditionTypeToYAML
export type PresentationAdditionTypeYAML = keyof typeof PresentationAdditionTypeFromYAML

export const ReportBuilderDetailsFillTypeToYAML = {
  GroupValues: "ЗначенияГруппировок",
  DontFill: "НеЗаполнять",
  Details: "Расшифровка",
} as const

export const ReportBuilderDetailsFillTypeFromYAML = {
  ЗначенияГруппировок: "GroupValues",
  НеЗаполнять: "DontFill",
  Расшифровка: "Details",
} as const

export type ReportBuilderDetailsFillType = keyof typeof ReportBuilderDetailsFillTypeToYAML
export type ReportBuilderDetailsFillTypeYAML = keyof typeof ReportBuilderDetailsFillTypeFromYAML

export const ReportBuilderDimensionTypeToYAML = {
  Hierarchy: "Иерархия",
  HierarchyOnly: "ТолькоИерархия",
  Items: "Элементы",
} as const

export const ReportBuilderDimensionTypeFromYAML = {
  Иерархия: "Hierarchy",
  ТолькоИерархия: "HierarchyOnly",
  Элементы: "Items",
} as const

export type ReportBuilderDimensionType = keyof typeof ReportBuilderDimensionTypeToYAML
export type ReportBuilderDimensionTypeYAML = keyof typeof ReportBuilderDimensionTypeFromYAML

export const TotalPlacementTypeToYAML = {
  Header: "Заголовок",
  HeaderAndFooter: "ЗаголовокИПодвал",
  Footer: "Подвал",
  FooterOnly: "ТолькоПодвал",
} as const

export const TotalPlacementTypeFromYAML = {
  Заголовок: "Header",
  ЗаголовокИПодвал: "HeaderAndFooter",
  Подвал: "Footer",
  ТолькоПодвал: "FooterOnly",
} as const

export type TotalPlacementType = keyof typeof TotalPlacementTypeToYAML
export type TotalPlacementTypeYAML = keyof typeof TotalPlacementTypeFromYAML

export const XMLAttributeTypeToYAML = {
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

export const XMLAttributeTypeFromYAML = {
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

export type XMLAttributeType = keyof typeof XMLAttributeTypeToYAML
export type XMLAttributeTypeYAML = keyof typeof XMLAttributeTypeFromYAML

export const XMLCanonicalizationTypeToYAML = {
  XMLExclusiveCanonicalization: "ИсключающийКаноническийXML",
  XMLExclusiveCanonicalizationWithComments: "ИсключающийКаноническийXMLСКомментариями",
  XMLCanonicalization: "КаноническийXML",
  XMLCanonicalization1_1: "КаноническийXML1_1",
  XMLCanonicalization1_1WithComments: "КаноническийXML1_1СКомментариями",
  XMLCanonicalizationWithComments: "КаноническийXMLСКомментариями",
} as const

export const XMLCanonicalizationTypeFromYAML = {
  ИсключающийКаноническийXML: "XMLExclusiveCanonicalization",
  ИсключающийКаноническийXMLСКомментариями: "XMLExclusiveCanonicalizationWithComments",
  КаноническийXML: "XMLCanonicalization",
  КаноническийXML1_1: "XMLCanonicalization1_1",
  КаноническийXML1_1СКомментариями: "XMLCanonicalization1_1WithComments",
  КаноническийXMLСКомментариями: "XMLCanonicalizationWithComments",
} as const

export type XMLCanonicalizationType = keyof typeof XMLCanonicalizationTypeToYAML
export type XMLCanonicalizationTypeYAML = keyof typeof XMLCanonicalizationTypeFromYAML

export const XMLNodeTypeToYAML = {
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

export const XMLNodeTypeFromYAML = {
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

export type XMLNodeType = keyof typeof XMLNodeTypeToYAML
export type XMLNodeTypeYAML = keyof typeof XMLNodeTypeFromYAML

export const XMLSpaceToYAML = {
  Default: "ПоУмолчанию",
  Preserve: "Сохранять",
} as const

export const XMLSpaceFromYAML = {
  ПоУмолчанию: "Default",
  Сохранять: "Preserve",
} as const

export type XMLSpace = keyof typeof XMLSpaceToYAML
export type XMLSpaceYAML = keyof typeof XMLSpaceFromYAML

export const XMLTypeAssignmentToYAML = {
  Implicit: "Неявное",
  Explicit: "Явное",
} as const

export const XMLTypeAssignmentFromYAML = {
  Неявное: "Implicit",
  Явное: "Explicit",
} as const

export type XMLTypeAssignment = keyof typeof XMLTypeAssignmentToYAML
export type XMLTypeAssignmentYAML = keyof typeof XMLTypeAssignmentFromYAML

export const XMLValidationTypeToYAML = {
  NoValidate: "НетПроверки",
  DocumentTypeDefinition: "ОпределениеТипаДокумента",
  XMLSchema: "СхемаXML",
} as const

export const XMLValidationTypeFromYAML = {
  НетПроверки: "NoValidate",
  ОпределениеТипаДокумента: "DocumentTypeDefinition",
  СхемаXML: "XMLSchema",
} as const

export type XMLValidationType = keyof typeof XMLValidationTypeToYAML
export type XMLValidationTypeYAML = keyof typeof XMLValidationTypeFromYAML

export const AllowedMessageNoToYAML = {
  Greater: "Больший",
  Any: "Любой",
  Next: "Очередной",
} as const

export const AllowedMessageNoFromYAML = {
  Больший: "Greater",
  Любой: "Any",
  Очередной: "Next",
} as const

export type AllowedMessageNo = keyof typeof AllowedMessageNoToYAML
export type AllowedMessageNoYAML = keyof typeof AllowedMessageNoFromYAML

export const AutoChangeRecordToYAML = {
  Deny: "Запретить",
  Allow: "Разрешить",
} as const

export const AutoChangeRecordFromYAML = {
  Запретить: "Deny",
  Разрешить: "Allow",
} as const

export type AutoChangeRecord = keyof typeof AutoChangeRecordToYAML
export type AutoChangeRecordYAML = keyof typeof AutoChangeRecordFromYAML

export const DataItemReceiveToYAML = {
  Auto: "Авто",
  Ignore: "Игнорировать",
  Accept: "Принять",
} as const

export const DataItemReceiveFromYAML = {
  Авто: "Auto",
  Игнорировать: "Ignore",
  Принять: "Accept",
} as const

export type DataItemReceive = keyof typeof DataItemReceiveToYAML
export type DataItemReceiveYAML = keyof typeof DataItemReceiveFromYAML

export const DataItemSendToYAML = {
  Auto: "Авто",
  Ignore: "Игнорировать",
  Delete: "Удалить",
} as const

export const DataItemSendFromYAML = {
  Авто: "Auto",
  Игнорировать: "Ignore",
  Удалить: "Delete",
} as const

export type DataItemSend = keyof typeof DataItemSendToYAML
export type DataItemSendYAML = keyof typeof DataItemSendFromYAML

export const AnalysisDataTypeToYAML = {
  Discrete: "Дискретные",
  Contiguous: "Непрерывные",
} as const

export const AnalysisDataTypeFromYAML = {
  Дискретные: "Discrete",
  Непрерывные: "Contiguous",
} as const

export type AnalysisDataType = keyof typeof AnalysisDataTypeToYAML
export type AnalysisDataTypeYAML = keyof typeof AnalysisDataTypeFromYAML

export const AssociationRulesDataSourceTypeToYAML = {
  Object: "Объектный",
  Event: "Событийный",
} as const

export const AssociationRulesDataSourceTypeFromYAML = {
  Объектный: "Object",
  Событийный: "Event",
} as const

export type AssociationRulesDataSourceType = keyof typeof AssociationRulesDataSourceTypeToYAML
export type AssociationRulesDataSourceTypeYAML = keyof typeof AssociationRulesDataSourceTypeFromYAML

export const AssociationRulesPruneTypeToYAML = {
  Redundant: "Избыточные",
  Covered: "Покрытые",
} as const

export const AssociationRulesPruneTypeFromYAML = {
  Избыточные: "Redundant",
  Покрытые: "Covered",
} as const

export type AssociationRulesPruneType = keyof typeof AssociationRulesPruneTypeToYAML
export type AssociationRulesPruneTypeYAML = keyof typeof AssociationRulesPruneTypeFromYAML

export const ClusterizationMethodToYAML = {
  NearestNeighbor: "БлижняяСвязь",
  FurthestNeighbor: "ДальняяСвязь",
  KMeans: "КСредних",
  Centroid: "ЦентрТяжести",
} as const

export const ClusterizationMethodFromYAML = {
  БлижняяСвязь: "NearestNeighbor",
  ДальняяСвязь: "FurthestNeighbor",
  КСредних: "KMeans",
  ЦентрТяжести: "Centroid",
} as const

export type ClusterizationMethod = keyof typeof ClusterizationMethodToYAML
export type ClusterizationMethodYAML = keyof typeof ClusterizationMethodFromYAML

export const DataAnalysisAssociationRulesOrderTypeToYAML = {
  ByConfidence: "ПоДостоверности",
  ByImportance: "ПоЗначимости",
  BySupport: "ПоКоличествуСлучаев",
} as const

export const DataAnalysisAssociationRulesOrderTypeFromYAML = {
  ПоДостоверности: "ByConfidence",
  ПоЗначимости: "ByImportance",
  ПоКоличествуСлучаев: "BySupport",
} as const

export type DataAnalysisAssociationRulesOrderType = keyof typeof DataAnalysisAssociationRulesOrderTypeToYAML
export type DataAnalysisAssociationRulesOrderTypeYAML = keyof typeof DataAnalysisAssociationRulesOrderTypeFromYAML

export const DataAnalysisColumnTypeAssociationRulesToYAML = {
  NotUsed: "НеИспользуемая",
  Object: "Объект",
  Item: "Элемент",
} as const

export const DataAnalysisColumnTypeAssociationRulesFromYAML = {
  НеИспользуемая: "NotUsed",
  Объект: "Object",
  Элемент: "Item",
} as const

export type DataAnalysisColumnTypeAssociationRules = keyof typeof DataAnalysisColumnTypeAssociationRulesToYAML
export type DataAnalysisColumnTypeAssociationRulesYAML = keyof typeof DataAnalysisColumnTypeAssociationRulesFromYAML

export const DataAnalysisColumnTypeClusterizationToYAML = {
  Input: "Входная",
  InputAndPredictable: "ВходнаяИПрогнозируемая",
  Key: "Ключ",
  NotUsed: "НеИспользуемая",
  Predictable: "Прогнозируемая",
} as const

export const DataAnalysisColumnTypeClusterizationFromYAML = {
  Входная: "Input",
  ВходнаяИПрогнозируемая: "InputAndPredictable",
  Ключ: "Key",
  НеИспользуемая: "NotUsed",
  Прогнозируемая: "Predictable",
} as const

export type DataAnalysisColumnTypeClusterization = keyof typeof DataAnalysisColumnTypeClusterizationToYAML
export type DataAnalysisColumnTypeClusterizationYAML = keyof typeof DataAnalysisColumnTypeClusterizationFromYAML

export const DataAnalysisColumnTypeDecisionTreeToYAML = {
  Input: "Входная",
  NotUsed: "НеИспользуемая",
  Predictable: "Прогнозируемая",
} as const

export const DataAnalysisColumnTypeDecisionTreeFromYAML = {
  Входная: "Input",
  НеИспользуемая: "NotUsed",
  Прогнозируемая: "Predictable",
} as const

export type DataAnalysisColumnTypeDecisionTree = keyof typeof DataAnalysisColumnTypeDecisionTreeToYAML
export type DataAnalysisColumnTypeDecisionTreeYAML = keyof typeof DataAnalysisColumnTypeDecisionTreeFromYAML

export const DataAnalysisColumnTypeSequentialPatternsToYAML = {
  Time: "Время",
  NotUsed: "НеИспользуемая",
  Sequence: "Последовательность",
  Item: "Элемент",
} as const

export const DataAnalysisColumnTypeSequentialPatternsFromYAML = {
  Время: "Time",
  НеИспользуемая: "NotUsed",
  Последовательность: "Sequence",
  Элемент: "Item",
} as const

export type DataAnalysisColumnTypeSequentialPatterns = keyof typeof DataAnalysisColumnTypeSequentialPatternsToYAML
export type DataAnalysisColumnTypeSequentialPatternsYAML = keyof typeof DataAnalysisColumnTypeSequentialPatternsFromYAML

export const DataAnalysisColumnTypeSummaryStatisticsToYAML = {
  Input: "Входная",
  NotUsed: "НеИспользуемая",
} as const

export const DataAnalysisColumnTypeSummaryStatisticsFromYAML = {
  Входная: "Input",
  НеИспользуемая: "NotUsed",
} as const

export type DataAnalysisColumnTypeSummaryStatistics = keyof typeof DataAnalysisColumnTypeSummaryStatisticsToYAML
export type DataAnalysisColumnTypeSummaryStatisticsYAML = keyof typeof DataAnalysisColumnTypeSummaryStatisticsFromYAML

export const DataAnalysisDistanceMetricTypeToYAML = {
  Euclidean: "ЕвклидоваМетрика",
  SquaredEuclidean: "ЕвклидоваМетрикаВКвадрате",
  CityBlock: "МетрикаГорода",
  Maximum: "МетрикаДоминирования",
} as const

export const DataAnalysisDistanceMetricTypeFromYAML = {
  ЕвклидоваМетрика: "Euclidean",
  ЕвклидоваМетрикаВКвадрате: "SquaredEuclidean",
  МетрикаГорода: "CityBlock",
  МетрикаДоминирования: "Maximum",
} as const

export type DataAnalysisDistanceMetricType = keyof typeof DataAnalysisDistanceMetricTypeToYAML
export type DataAnalysisDistanceMetricTypeYAML = keyof typeof DataAnalysisDistanceMetricTypeFromYAML

export const DataAnalysisFieldTypeToYAML = {
  DataAnalysisObject: "ОбъектАнализаДанных",
  Field: "Поле",
} as const

export const DataAnalysisFieldTypeFromYAML = {
  ОбъектАнализаДанных: "DataAnalysisObject",
  Поле: "Field",
} as const

export type DataAnalysisFieldType = keyof typeof DataAnalysisFieldTypeToYAML
export type DataAnalysisFieldTypeYAML = keyof typeof DataAnalysisFieldTypeFromYAML

export const DataAnalysisNumericValueUseTypeToYAML = {
  AsBoolean: "КакБулево",
  AsNumeric: "КакЧисло",
} as const

export const DataAnalysisNumericValueUseTypeFromYAML = {
  КакБулево: "AsBoolean",
  КакЧисло: "AsNumeric",
} as const

export type DataAnalysisNumericValueUseType = keyof typeof DataAnalysisNumericValueUseTypeToYAML
export type DataAnalysisNumericValueUseTypeYAML = keyof typeof DataAnalysisNumericValueUseTypeFromYAML

export const DataAnalysisResultTableFillTypeToYAML = {
  AllFields: "ВсеПоля",
  UsedFields: "ИспользуемыеПоля",
  KeyFields: "КлючевыеПоля",
  DontFill: "НеЗаполнять",
} as const

export const DataAnalysisResultTableFillTypeFromYAML = {
  ВсеПоля: "AllFields",
  ИспользуемыеПоля: "UsedFields",
  КлючевыеПоля: "KeyFields",
  НеЗаполнять: "DontFill",
} as const

export type DataAnalysisResultTableFillType = keyof typeof DataAnalysisResultTableFillTypeToYAML
export type DataAnalysisResultTableFillTypeYAML = keyof typeof DataAnalysisResultTableFillTypeFromYAML

export const DataAnalysisSequentialPatternsOrderTypeToYAML = {
  ByLength: "ПоДлине",
  BySupport: "ПоКоличествуСлучаев",
} as const

export const DataAnalysisSequentialPatternsOrderTypeFromYAML = {
  ПоДлине: "ByLength",
  ПоКоличествуСлучаев: "BySupport",
} as const

export type DataAnalysisSequentialPatternsOrderType = keyof typeof DataAnalysisSequentialPatternsOrderTypeToYAML
export type DataAnalysisSequentialPatternsOrderTypeYAML = keyof typeof DataAnalysisSequentialPatternsOrderTypeFromYAML

export const DataAnalysisStandardizationTypeToYAML = {
  DontStandardize: "НеСтандартизировать",
  Standardize: "Стандартизировать",
} as const

export const DataAnalysisStandardizationTypeFromYAML = {
  НеСтандартизировать: "DontStandardize",
  Стандартизировать: "Standardize",
} as const

export type DataAnalysisStandardizationType = keyof typeof DataAnalysisStandardizationTypeToYAML
export type DataAnalysisStandardizationTypeYAML = keyof typeof DataAnalysisStandardizationTypeFromYAML

export const DataAnalysisTimeIntervalUnitTypeToYAML = {
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

export const DataAnalysisTimeIntervalUnitTypeFromYAML = {
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

export type DataAnalysisTimeIntervalUnitType = keyof typeof DataAnalysisTimeIntervalUnitTypeToYAML
export type DataAnalysisTimeIntervalUnitTypeYAML = keyof typeof DataAnalysisTimeIntervalUnitTypeFromYAML

export const DecisionTreeSimplificationTypeToYAML = {
  DontSimplify: "НеУпрощать",
  Simplify: "Упрощать",
} as const

export const DecisionTreeSimplificationTypeFromYAML = {
  НеУпрощать: "DontSimplify",
  Упрощать: "Simplify",
} as const

export type DecisionTreeSimplificationType = keyof typeof DecisionTreeSimplificationTypeToYAML
export type DecisionTreeSimplificationTypeYAML = keyof typeof DecisionTreeSimplificationTypeFromYAML

export const PredictionModelColumnTypeToYAML = {
  Input: "Входная",
  DataSourceColumn: "КолонкаИсточникаДанных",
  Predictable: "Прогнозируемая",
} as const

export const PredictionModelColumnTypeFromYAML = {
  Входная: "Input",
  КолонкаИсточникаДанных: "DataSourceColumn",
  Прогнозируемая: "Predictable",
} as const

export type PredictionModelColumnType = keyof typeof PredictionModelColumnTypeToYAML
export type PredictionModelColumnTypeYAML = keyof typeof PredictionModelColumnTypeFromYAML

export const FileNamesEncodingInZipFileToYAML = {
  UTF8: "UTF8",
  Auto: "Авто",
  OSEncodingWithUTF8: "КодировкаОСДополнительноUTF8",
} as const

export const FileNamesEncodingInZipFileFromYAML = {
  UTF8: "UTF8",
  Авто: "Auto",
  КодировкаОСДополнительноUTF8: "OSEncodingWithUTF8",
} as const

export type FileNamesEncodingInZipFile = keyof typeof FileNamesEncodingInZipFileToYAML
export type FileNamesEncodingInZipFileYAML = keyof typeof FileNamesEncodingInZipFileFromYAML

export const ZIPCompressionLevelToYAML = {
  Maximum: "Максимальный",
  Minimum: "Минимальный",
  Optimal: "Оптимальный",
} as const

export const ZIPCompressionLevelFromYAML = {
  Максимальный: "Maximum",
  Минимальный: "Minimum",
  Оптимальный: "Optimal",
} as const

export type ZIPCompressionLevel = keyof typeof ZIPCompressionLevelToYAML
export type ZIPCompressionLevelYAML = keyof typeof ZIPCompressionLevelFromYAML

export const ZIPCompressionMethodToYAML = {
  BZIP2: "BZIP2",
  Copy: "Копирование",
  Deflate: "Сжатие",
} as const

export const ZIPCompressionMethodFromYAML = {
  BZIP2: "BZIP2",
  Копирование: "Copy",
  Сжатие: "Deflate",
} as const

export type ZIPCompressionMethod = keyof typeof ZIPCompressionMethodToYAML
export type ZIPCompressionMethodYAML = keyof typeof ZIPCompressionMethodFromYAML

export const ZIPEncryptionMethodToYAML = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export const ZIPEncryptionMethodFromYAML = {
  AES128: "AES128",
  AES192: "AES192",
  AES256: "AES256",
  Zip20: "Zip20",
} as const

export type ZIPEncryptionMethod = keyof typeof ZIPEncryptionMethodToYAML
export type ZIPEncryptionMethodYAML = keyof typeof ZIPEncryptionMethodFromYAML

export const ZIPRestoreFilePathsModeToYAML = {
  Restore: "Восстанавливать",
  DontRestore: "НеВосстанавливать",
} as const

export const ZIPRestoreFilePathsModeFromYAML = {
  Восстанавливать: "Restore",
  НеВосстанавливать: "DontRestore",
} as const

export type ZIPRestoreFilePathsMode = keyof typeof ZIPRestoreFilePathsModeToYAML
export type ZIPRestoreFilePathsModeYAML = keyof typeof ZIPRestoreFilePathsModeFromYAML

export const ZIPStorePathModeToYAML = {
  DontStorePath: "НеСохранятьПути",
  StoreRelativePath: "СохранятьОтносительныеПути",
  StoreFullPath: "СохранятьПолныеПути",
} as const

export const ZIPStorePathModeFromYAML = {
  НеСохранятьПути: "DontStorePath",
  СохранятьОтносительныеПути: "StoreRelativePath",
  СохранятьПолныеПути: "StoreFullPath",
} as const

export type ZIPStorePathMode = keyof typeof ZIPStorePathModeToYAML
export type ZIPStorePathModeYAML = keyof typeof ZIPStorePathModeFromYAML

export const ZIPSubDirProcessingModeToYAML = {
  DontProcess: "НеОбрабатывать",
  ProcessRecursively: "ОбрабатыватьРекурсивно",
} as const

export const ZIPSubDirProcessingModeFromYAML = {
  НеОбрабатывать: "DontProcess",
  ОбрабатыватьРекурсивно: "ProcessRecursively",
} as const

export type ZIPSubDirProcessingMode = keyof typeof ZIPSubDirProcessingModeToYAML
export type ZIPSubDirProcessingModeYAML = keyof typeof ZIPSubDirProcessingModeFromYAML

// #endregion SystemEnumerations

// #region SystemSets

export const CharsToYAML = {
  CR: "ВК",
  VTab: "ВТаб",
  NBSp: "НПП",
  LF: "ПС",
  FF: "ПФ",
  Tab: "Таб",
} as const

export const CharsFromYAML = {
  ВК: "CR",
  ВТаб: "VTab",
  НПП: "NBSp",
  ПС: "LF",
  ПФ: "FF",
  Таб: "Tab",
} as const

export type Chars = keyof typeof CharsToYAML
export type CharsYAML = keyof typeof CharsFromYAML

export const PictureLibToYAML = {
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

export const PictureLibFromYAML = {
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

export type PictureLib = keyof typeof PictureLibToYAML
export type PictureLibYAML = keyof typeof PictureLibFromYAML

export const StyleBordersToYAML = {
  ControlBorder: "РамкаЭлементаУправления",
} as const

export const StyleBordersFromYAML = {
  РамкаЭлементаУправления: "ControlBorder",
} as const

export type StyleBorders = keyof typeof StyleBordersToYAML
export type StyleBordersYAML = keyof typeof StyleBordersFromYAML

export const StyleColorsToYAML = {
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

export const StyleColorsFromYAML = {
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

export type StyleColors = keyof typeof StyleColorsToYAML
export type StyleColorsYAML = keyof typeof StyleColorsFromYAML

export const StyleFontsToYAML = {
  LargeTextFont: "КрупныйШрифтТекста",
  SmallTextFont: "МелкийШрифтТекста",
  NormalTextFont: "ОбычныйШрифтТекста",
  ExtraLargeTextFont: "ОченьКрупныйШрифтТекста",
  TextFont: "ШрифтТекста",
} as const

export const StyleFontsFromYAML = {
  КрупныйШрифтТекста: "LargeTextFont",
  МелкийШрифтТекста: "SmallTextFont",
  ОбычныйШрифтТекста: "NormalTextFont",
  ОченьКрупныйШрифтТекста: "ExtraLargeTextFont",
  ШрифтТекста: "TextFont",
} as const

export type StyleFonts = keyof typeof StyleFontsToYAML
export type StyleFontsYAML = keyof typeof StyleFontsFromYAML

export const WebColorsToYAML = {
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

export const WebColorsFromYAML = {
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

export type WebColors = keyof typeof WebColorsToYAML
export type WebColorsYAML = keyof typeof WebColorsFromYAML

export const WindowsColorsToYAML = {
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

export const WindowsColorsFromYAML = {
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

export type WindowsColors = keyof typeof WindowsColorsToYAML
export type WindowsColorsYAML = keyof typeof WindowsColorsFromYAML

export const WindowsFontsToYAML = {
  ANSIFixedFont: "ANSIШрифтМоноширинный",
  ANSIVariableFont: "ANSIШрифтПропорциональный",
  OEMFixedFont: "OEMШрифтМоноширинный",
  SystemFont: "СистемныйШрифт",
  DefaultGUIFont: "ШрифтДиалоговИМеню",
} as const

export const WindowsFontsFromYAML = {
  ANSIШрифтМоноширинный: "ANSIFixedFont",
  ANSIШрифтПропорциональный: "ANSIVariableFont",
  OEMШрифтМоноширинный: "OEMFixedFont",
  СистемныйШрифт: "SystemFont",
  ШрифтДиалоговИМеню: "DefaultGUIFont",
} as const

export type WindowsFonts = keyof typeof WindowsFontsToYAML
export type WindowsFontsYAML = keyof typeof WindowsFontsFromYAML

// #endregion SystemSets

// #region BinaryDataStorageLocationUse

export const BinaryDataStorageLocationUseToYAML = {
  Use: "Использовать",
  DontUse: "НеИспользовать",
} as const

export const BinaryDataStorageLocationUseFromYAML = {
  Использовать: "Use",
  НеИспользовать: "DontUse",
} as const

export type BinaryDataStorageLocationUse = keyof typeof BinaryDataStorageLocationUseToYAML
export type BinaryDataStorageLocationUseYAML = keyof typeof BinaryDataStorageLocationUseFromYAML

// #endregion BinaryDataStorageLocationUse

// #region StatePresentation

export const StatePresentationToYAML = {
  Visible: "Видимость",
  AdditionalShowMode: "ДополнительныйРежимОтображения",
  Picture: "Картинка",
  Text: "Текст",
} as const

export const StatePresentationFromYAML = {
  Видимость: "Visible",
  ДополнительныйРежимОтображения: "AdditionalShowMode",
  Картинка: "Picture",
  Текст: "Text",
} as const

export type StatePresentation = keyof typeof StatePresentationToYAML
export type StatePresentationYAML = keyof typeof StatePresentationFromYAML

// #endregion StatePresentation

export interface SystemEnumerationEnterprise {
  Type: "SystemEnumeration"
  Value: string
}

export const ButtonLocationInContextMenuToYAML = {
  None: "Нет",
  AdditionalInContextMenu: "ДополнительноВКонтекстномМеню",
  OnlyInContextMenu: "ТолькоВКонтекстномМеню",
  Auto: "Авто",
} as const

export const ButtonLocationInContextMenuFromYAML = {
  Нет: "None",
  ДополнительноВКонтекстномМеню: "AdditionalInContextMenu",
  ТолькоВКонтекстномМеню: "OnlyInContextMenu",
  Авто: "Auto",
} as const

export type ButtonLocationInContextMenu = keyof typeof ButtonLocationInContextMenuToYAML
export type ButtonLocationInContextMenuYAML = keyof typeof ButtonLocationInContextMenuFromYAML
