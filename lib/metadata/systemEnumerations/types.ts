import { z } from "zod"

enum XDTOFacetType {
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

export const ZXDTOFacetType = z.enum(Object.keys(XDTOFacetType) as [TXDTOFacetType, ...TXDTOFacetType[]])
export const ZXDTOFacetTypeEnterprise = z.enum(Object.values(XDTOFacetType) as [TXDTOFacetTypeEnterprise, ...TXDTOFacetTypeEnterprise[]])

export type TXDTOFacetType = keyof typeof XDTOFacetType
export type TXDTOFacetTypeEnterprise = `${XDTOFacetType}`

enum XMLForm {
  Attribute = "Атрибут",
  Text = "Текст",
  Element = "Элемент",
}

export const ZXMLForm = z.enum(Object.keys(XMLForm) as [TXMLForm, ...TXMLForm[]])
export const ZXMLFormEnterprise = z.enum(Object.values(XMLForm) as [TXMLFormEnterprise, ...TXMLFormEnterprise[]])

export type TXMLForm = keyof typeof XMLForm
export type TXMLFormEnterprise = `${XMLForm}`

enum WSParameterDirection {
  In = "Входной",
  InOut = "ВходнойВыходной",
  Out = "Выходной",
}

export const ZWSParameterDirection = z.enum(Object.keys(WSParameterDirection) as [TWSParameterDirection, ...TWSParameterDirection[]])
export const ZWSParameterDirectionEnterprise = z.enum(Object.values(WSParameterDirection) as [TWSParameterDirectionEnterprise, ...TWSParameterDirectionEnterprise[]])

export type TWSParameterDirection = keyof typeof WSParameterDirection
export type TWSParameterDirectionEnterprise = `${WSParameterDirection}`

enum DOMBuilderAction {
  InsertBefore = "ВставитьПеред",
  InsertAfter = "ВставитьПосле",
  AppendAsChildren = "ДобавитьКакДочерние",
  Replace = "Заменить",
  ReplaceChildren = "ЗаменитьДочерние",
}

export const ZDOMBuilderAction = z.enum(Object.keys(DOMBuilderAction) as [TDOMBuilderAction, ...TDOMBuilderAction[]])
export const ZDOMBuilderActionEnterprise = z.enum(Object.values(DOMBuilderAction) as [TDOMBuilderActionEnterprise, ...TDOMBuilderActionEnterprise[]])

export type TDOMBuilderAction = keyof typeof DOMBuilderAction
export type TDOMBuilderActionEnterprise = `${DOMBuilderAction}`

enum DOMDocumentPosition {
  ImplementationSpecific = "ЗависитОтРеализации",
  Disconnected = "Отсоединен",
  Preceding = "Предшествует",
  Following = "Следует",
  Contains = "Содержит",
  ContainedBy = "Содержится",
}

export const ZDOMDocumentPosition = z.enum(Object.keys(DOMDocumentPosition) as [TDOMDocumentPosition, ...TDOMDocumentPosition[]])
export const ZDOMDocumentPositionEnterprise = z.enum(Object.values(DOMDocumentPosition) as [TDOMDocumentPositionEnterprise, ...TDOMDocumentPositionEnterprise[]])

export type TDOMDocumentPosition = keyof typeof DOMDocumentPosition
export type TDOMDocumentPositionEnterprise = `${DOMDocumentPosition}`

enum DOMNodeFilterParameters {
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

export const ZDOMNodeFilterParameters = z.enum(Object.keys(DOMNodeFilterParameters) as [TDOMNodeFilterParameters, ...TDOMNodeFilterParameters[]])
export const ZDOMNodeFilterParametersEnterprise = z.enum(Object.values(DOMNodeFilterParameters) as [TDOMNodeFilterParametersEnterprise, ...TDOMNodeFilterParametersEnterprise[]])

export type TDOMNodeFilterParameters = keyof typeof DOMNodeFilterParameters
export type TDOMNodeFilterParametersEnterprise = `${DOMNodeFilterParameters}`

enum DOMNodeType {
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

export const ZDOMNodeType = z.enum(Object.keys(DOMNodeType) as [TDOMNodeType, ...TDOMNodeType[]])
export const ZDOMNodeTypeEnterprise = z.enum(Object.values(DOMNodeType) as [TDOMNodeTypeEnterprise, ...TDOMNodeTypeEnterprise[]])

export type TDOMNodeType = keyof typeof DOMNodeType
export type TDOMNodeTypeEnterprise = `${DOMNodeType}`

enum DOMXPathResultType {
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

export const ZDOMXPathResultType = z.enum(Object.keys(DOMXPathResultType) as [TDOMXPathResultType, ...TDOMXPathResultType[]])
export const ZDOMXPathResultTypeEnterprise = z.enum(Object.values(DOMXPathResultType) as [TDOMXPathResultTypeEnterprise, ...TDOMXPathResultTypeEnterprise[]])

export type TDOMXPathResultType = keyof typeof DOMXPathResultType
export type TDOMXPathResultTypeEnterprise = `${DOMXPathResultType}`

enum HTMLContentCategory {
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

export const ZHTMLContentCategory = z.enum(Object.keys(HTMLContentCategory) as [THTMLContentCategory, ...THTMLContentCategory[]])
export const ZHTMLContentCategoryEnterprise = z.enum(Object.values(HTMLContentCategory) as [THTMLContentCategoryEnterprise, ...THTMLContentCategoryEnterprise[]])

export type THTMLContentCategory = keyof typeof HTMLContentCategory
export type THTMLContentCategoryEnterprise = `${HTMLContentCategory}`

enum DataCompositionAccountingBalanceType {
  Debit = "Дебет",
  Credit = "Кредит",
  None = "Нет",
}

export const ZDataCompositionAccountingBalanceType = z.enum(Object.keys(DataCompositionAccountingBalanceType) as [TDataCompositionAccountingBalanceType, ...TDataCompositionAccountingBalanceType[]])
export const ZDataCompositionAccountingBalanceTypeEnterprise = z.enum(Object.values(DataCompositionAccountingBalanceType) as [TDataCompositionAccountingBalanceTypeEnterprise, ...TDataCompositionAccountingBalanceTypeEnterprise[]])

export type TDataCompositionAccountingBalanceType = keyof typeof DataCompositionAccountingBalanceType
export type TDataCompositionAccountingBalanceTypeEnterprise = `${DataCompositionAccountingBalanceType}`

enum DataCompositionAreaTemplateType {
  Header = "Заголовок",
  HierarchicalHeader = "ЗаголовокИерархии",
  OverallHeader = "ОбщийИтогЗаголовок",
  OverallFooter = "ОбщийИтогПодвал",
  Footer = "Подвал",
  HierarchicalFooter = "ПодвалИерархии",
}

export const ZDataCompositionAreaTemplateType = z.enum(Object.keys(DataCompositionAreaTemplateType) as [TDataCompositionAreaTemplateType, ...TDataCompositionAreaTemplateType[]])
export const ZDataCompositionAreaTemplateTypeEnterprise = z.enum(Object.values(DataCompositionAreaTemplateType) as [TDataCompositionAreaTemplateTypeEnterprise, ...TDataCompositionAreaTemplateTypeEnterprise[]])

export type TDataCompositionAreaTemplateType = keyof typeof DataCompositionAreaTemplateType
export type TDataCompositionAreaTemplateTypeEnterprise = `${DataCompositionAreaTemplateType}`

enum DataCompositionAttributesPlacement {
  Together = "Вместе",
  WithOwnerField = "ВместеСВладельцем",
  SpecialPosition = "ВСпециальнойПозиции",
  Separately = "Отдельно",
}

export const ZDataCompositionAttributesPlacement = z.enum(Object.keys(DataCompositionAttributesPlacement) as [TDataCompositionAttributesPlacement, ...TDataCompositionAttributesPlacement[]])
export const ZDataCompositionAttributesPlacementEnterprise = z.enum(Object.values(DataCompositionAttributesPlacement) as [TDataCompositionAttributesPlacementEnterprise, ...TDataCompositionAttributesPlacementEnterprise[]])

export type TDataCompositionAttributesPlacement = keyof typeof DataCompositionAttributesPlacement
export type TDataCompositionAttributesPlacementEnterprise = `${DataCompositionAttributesPlacement}`

enum DataCompositionBalanceType {
  ClosingBalance = "КонечныйОстаток",
  OpeningBalance = "НачальныйОстаток",
  None = "Нет",
}

export const ZDataCompositionBalanceType = z.enum(Object.keys(DataCompositionBalanceType) as [TDataCompositionBalanceType, ...TDataCompositionBalanceType[]])
export const ZDataCompositionBalanceTypeEnterprise = z.enum(Object.values(DataCompositionBalanceType) as [TDataCompositionBalanceTypeEnterprise, ...TDataCompositionBalanceTypeEnterprise[]])

export type TDataCompositionBalanceType = keyof typeof DataCompositionBalanceType
export type TDataCompositionBalanceTypeEnterprise = `${DataCompositionBalanceType}`

enum DataCompositionChartLegendPlacement {
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export const ZDataCompositionChartLegendPlacement = z.enum(Object.keys(DataCompositionChartLegendPlacement) as [TDataCompositionChartLegendPlacement, ...TDataCompositionChartLegendPlacement[]])
export const ZDataCompositionChartLegendPlacementEnterprise = z.enum(Object.values(DataCompositionChartLegendPlacement) as [TDataCompositionChartLegendPlacementEnterprise, ...TDataCompositionChartLegendPlacementEnterprise[]])

export type TDataCompositionChartLegendPlacement = keyof typeof DataCompositionChartLegendPlacement
export type TDataCompositionChartLegendPlacementEnterprise = `${DataCompositionChartLegendPlacement}`

enum DataCompositionComparisonType {
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

export const ZDataCompositionComparisonType = z.enum(Object.keys(DataCompositionComparisonType) as [TDataCompositionComparisonType, ...TDataCompositionComparisonType[]])
export const ZDataCompositionComparisonTypeEnterprise = z.enum(Object.values(DataCompositionComparisonType) as [TDataCompositionComparisonTypeEnterprise, ...TDataCompositionComparisonTypeEnterprise[]])

export type TDataCompositionComparisonType = keyof typeof DataCompositionComparisonType
export type TDataCompositionComparisonTypeEnterprise = `${DataCompositionComparisonType}`

enum DataCompositionConditionalAppearanceUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZDataCompositionConditionalAppearanceUse = z.enum(Object.keys(DataCompositionConditionalAppearanceUse) as [TDataCompositionConditionalAppearanceUse, ...TDataCompositionConditionalAppearanceUse[]])
export const ZDataCompositionConditionalAppearanceUseEnterprise = z.enum(Object.values(DataCompositionConditionalAppearanceUse) as [TDataCompositionConditionalAppearanceUseEnterprise, ...TDataCompositionConditionalAppearanceUseEnterprise[]])

export type TDataCompositionConditionalAppearanceUse = keyof typeof DataCompositionConditionalAppearanceUse
export type TDataCompositionConditionalAppearanceUseEnterprise = `${DataCompositionConditionalAppearanceUse}`

enum DataCompositionDataSetsLinkType {
  Outer = "Внешняя",
  Inner = "Внутренняя",
}

export const ZDataCompositionDataSetsLinkType = z.enum(Object.keys(DataCompositionDataSetsLinkType) as [TDataCompositionDataSetsLinkType, ...TDataCompositionDataSetsLinkType[]])
export const ZDataCompositionDataSetsLinkTypeEnterprise = z.enum(Object.values(DataCompositionDataSetsLinkType) as [TDataCompositionDataSetsLinkTypeEnterprise, ...TDataCompositionDataSetsLinkTypeEnterprise[]])

export type TDataCompositionDataSetsLinkType = keyof typeof DataCompositionDataSetsLinkType
export type TDataCompositionDataSetsLinkTypeEnterprise = `${DataCompositionDataSetsLinkType}`

enum DataCompositionDetailsProcessingAction {
  None = "Нет",
  OpenValue = "ОткрытьЗначение",
  Filter = "Отфильтровать",
  ApplyAppearance = "Оформить",
  DrillDown = "Расшифровать",
  Group = "Сгруппировать",
  Order = "Упорядочить",
}

export const ZDataCompositionDetailsProcessingAction = z.enum(Object.keys(DataCompositionDetailsProcessingAction) as [TDataCompositionDetailsProcessingAction, ...TDataCompositionDetailsProcessingAction[]])
export const ZDataCompositionDetailsProcessingActionEnterprise = z.enum(Object.values(DataCompositionDetailsProcessingAction) as [TDataCompositionDetailsProcessingActionEnterprise, ...TDataCompositionDetailsProcessingActionEnterprise[]])

export type TDataCompositionDetailsProcessingAction = keyof typeof DataCompositionDetailsProcessingAction
export type TDataCompositionDetailsProcessingActionEnterprise = `${DataCompositionDetailsProcessingAction}`

enum DataCompositionFieldPlacement {
  Auto = "Авто",
  Vertically = "Вертикально",
  Together = "Вместе",
  Horizontally = "Горизонтально",
  SpecialColumn = "ОтдельнаяКолонка",
}

export const ZDataCompositionFieldPlacement = z.enum(Object.keys(DataCompositionFieldPlacement) as [TDataCompositionFieldPlacement, ...TDataCompositionFieldPlacement[]])
export const ZDataCompositionFieldPlacementEnterprise = z.enum(Object.values(DataCompositionFieldPlacement) as [TDataCompositionFieldPlacementEnterprise, ...TDataCompositionFieldPlacementEnterprise[]])

export type TDataCompositionFieldPlacement = keyof typeof DataCompositionFieldPlacement
export type TDataCompositionFieldPlacementEnterprise = `${DataCompositionFieldPlacement}`

enum DataCompositionFieldsTitleType {
  Auto = "Авто",
  Short = "Краткий",
  Full = "Полный",
}

export const ZDataCompositionFieldsTitleType = z.enum(Object.keys(DataCompositionFieldsTitleType) as [TDataCompositionFieldsTitleType, ...TDataCompositionFieldsTitleType[]])
export const ZDataCompositionFieldsTitleTypeEnterprise = z.enum(Object.values(DataCompositionFieldsTitleType) as [TDataCompositionFieldsTitleTypeEnterprise, ...TDataCompositionFieldsTitleTypeEnterprise[]])

export type TDataCompositionFieldsTitleType = keyof typeof DataCompositionFieldsTitleType
export type TDataCompositionFieldsTitleTypeEnterprise = `${DataCompositionFieldsTitleType}`

enum DataCompositionFilterApplicationType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export const ZDataCompositionFilterApplicationType = z.enum(Object.keys(DataCompositionFilterApplicationType) as [TDataCompositionFilterApplicationType, ...TDataCompositionFilterApplicationType[]])
export const ZDataCompositionFilterApplicationTypeEnterprise = z.enum(Object.values(DataCompositionFilterApplicationType) as [TDataCompositionFilterApplicationTypeEnterprise, ...TDataCompositionFilterApplicationTypeEnterprise[]])

export type TDataCompositionFilterApplicationType = keyof typeof DataCompositionFilterApplicationType
export type TDataCompositionFilterApplicationTypeEnterprise = `${DataCompositionFilterApplicationType}`

enum DataCompositionFilterItemsGroupType {
  AndGroup = "ГруппаИ",
  OrGroup = "ГруппаИли",
  NotGroup = "ГруппаНе",
}

export const ZDataCompositionFilterItemsGroupType = z.enum(Object.keys(DataCompositionFilterItemsGroupType) as [TDataCompositionFilterItemsGroupType, ...TDataCompositionFilterItemsGroupType[]])
export const ZDataCompositionFilterItemsGroupTypeEnterprise = z.enum(Object.values(DataCompositionFilterItemsGroupType) as [TDataCompositionFilterItemsGroupTypeEnterprise, ...TDataCompositionFilterItemsGroupTypeEnterprise[]])

export type TDataCompositionFilterItemsGroupType = keyof typeof DataCompositionFilterItemsGroupType
export type TDataCompositionFilterItemsGroupTypeEnterprise = `${DataCompositionFilterItemsGroupType}`

enum DataCompositionFixation {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export const ZDataCompositionFixation = z.enum(Object.keys(DataCompositionFixation) as [TDataCompositionFixation, ...TDataCompositionFixation[]])
export const ZDataCompositionFixationEnterprise = z.enum(Object.values(DataCompositionFixation) as [TDataCompositionFixationEnterprise, ...TDataCompositionFixationEnterprise[]])

export type TDataCompositionFixation = keyof typeof DataCompositionFixation
export type TDataCompositionFixationEnterprise = `${DataCompositionFixation}`

enum DataCompositionGroupFieldsPlacement {
  Together = "Вместе",
  Separately = "Отдельно",
  SeparatelyAndInTotalsOnly = "ОтдельноИТолькоВИтогах",
}

export const ZDataCompositionGroupFieldsPlacement = z.enum(Object.keys(DataCompositionGroupFieldsPlacement) as [TDataCompositionGroupFieldsPlacement, ...TDataCompositionGroupFieldsPlacement[]])
export const ZDataCompositionGroupFieldsPlacementEnterprise = z.enum(Object.values(DataCompositionGroupFieldsPlacement) as [TDataCompositionGroupFieldsPlacementEnterprise, ...TDataCompositionGroupFieldsPlacementEnterprise[]])

export type TDataCompositionGroupFieldsPlacement = keyof typeof DataCompositionGroupFieldsPlacement
export type TDataCompositionGroupFieldsPlacementEnterprise = `${DataCompositionGroupFieldsPlacement}`

enum DataCompositionGroupPlacement {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
  None = "Нет",
}

export const ZDataCompositionGroupPlacement = z.enum(Object.keys(DataCompositionGroupPlacement) as [TDataCompositionGroupPlacement, ...TDataCompositionGroupPlacement[]])
export const ZDataCompositionGroupPlacementEnterprise = z.enum(Object.values(DataCompositionGroupPlacement) as [TDataCompositionGroupPlacementEnterprise, ...TDataCompositionGroupPlacementEnterprise[]])

export type TDataCompositionGroupPlacement = keyof typeof DataCompositionGroupPlacement
export type TDataCompositionGroupPlacementEnterprise = `${DataCompositionGroupPlacement}`

enum DataCompositionGroupTemplateType {
  Auto = "Авто",
  Vertical = "Вертикальный",
  Horizontal = "Горизонтальный",
}

export const ZDataCompositionGroupTemplateType = z.enum(Object.keys(DataCompositionGroupTemplateType) as [TDataCompositionGroupTemplateType, ...TDataCompositionGroupTemplateType[]])
export const ZDataCompositionGroupTemplateTypeEnterprise = z.enum(Object.values(DataCompositionGroupTemplateType) as [TDataCompositionGroupTemplateTypeEnterprise, ...TDataCompositionGroupTemplateTypeEnterprise[]])

export type TDataCompositionGroupTemplateType = keyof typeof DataCompositionGroupTemplateType
export type TDataCompositionGroupTemplateTypeEnterprise = `${DataCompositionGroupTemplateType}`

enum DataCompositionGroupType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export const ZDataCompositionGroupType = z.enum(Object.keys(DataCompositionGroupType) as [TDataCompositionGroupType, ...TDataCompositionGroupType[]])
export const ZDataCompositionGroupTypeEnterprise = z.enum(Object.values(DataCompositionGroupType) as [TDataCompositionGroupTypeEnterprise, ...TDataCompositionGroupTypeEnterprise[]])

export type TDataCompositionGroupType = keyof typeof DataCompositionGroupType
export type TDataCompositionGroupTypeEnterprise = `${DataCompositionGroupType}`

enum DataCompositionGroupUseVariant {
  Auto = "Авто",
  AdditionalInformation = "ДополнительнаяИнформация",
}

export const ZDataCompositionGroupUseVariant = z.enum(Object.keys(DataCompositionGroupUseVariant) as [TDataCompositionGroupUseVariant, ...TDataCompositionGroupUseVariant[]])
export const ZDataCompositionGroupUseVariantEnterprise = z.enum(Object.values(DataCompositionGroupUseVariant) as [TDataCompositionGroupUseVariantEnterprise, ...TDataCompositionGroupUseVariantEnterprise[]])

export type TDataCompositionGroupUseVariant = keyof typeof DataCompositionGroupUseVariant
export type TDataCompositionGroupUseVariantEnterprise = `${DataCompositionGroupUseVariant}`

enum DataCompositionParameterUse {
  Auto = "Авто",
  Always = "Всегда",
}

export const ZDataCompositionParameterUse = z.enum(Object.keys(DataCompositionParameterUse) as [TDataCompositionParameterUse, ...TDataCompositionParameterUse[]])
export const ZDataCompositionParameterUseEnterprise = z.enum(Object.values(DataCompositionParameterUse) as [TDataCompositionParameterUseEnterprise, ...TDataCompositionParameterUseEnterprise[]])

export type TDataCompositionParameterUse = keyof typeof DataCompositionParameterUse
export type TDataCompositionParameterUseEnterprise = `${DataCompositionParameterUse}`

enum DataCompositionPeriodAdditionType {
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

export const ZDataCompositionPeriodAdditionType = z.enum(Object.keys(DataCompositionPeriodAdditionType) as [TDataCompositionPeriodAdditionType, ...TDataCompositionPeriodAdditionType[]])
export const ZDataCompositionPeriodAdditionTypeEnterprise = z.enum(Object.values(DataCompositionPeriodAdditionType) as [TDataCompositionPeriodAdditionTypeEnterprise, ...TDataCompositionPeriodAdditionTypeEnterprise[]])

export type TDataCompositionPeriodAdditionType = keyof typeof DataCompositionPeriodAdditionType
export type TDataCompositionPeriodAdditionTypeEnterprise = `${DataCompositionPeriodAdditionType}`

enum DataCompositionPeriodType {
  Additional = "Дополнительный",
  Main = "Основной",
}

export const ZDataCompositionPeriodType = z.enum(Object.keys(DataCompositionPeriodType) as [TDataCompositionPeriodType, ...TDataCompositionPeriodType[]])
export const ZDataCompositionPeriodTypeEnterprise = z.enum(Object.values(DataCompositionPeriodType) as [TDataCompositionPeriodTypeEnterprise, ...TDataCompositionPeriodTypeEnterprise[]])

export type TDataCompositionPeriodType = keyof typeof DataCompositionPeriodType
export type TDataCompositionPeriodTypeEnterprise = `${DataCompositionPeriodType}`

enum DataCompositionPictureOutputType {
  Auto = "Авто",
  OutputByValue = "ВыводитьПоЗначению",
  OutputByRef = "ВыводитьПоСсылке",
  DontOutput = "НеВыводить",
}

export const ZDataCompositionPictureOutputType = z.enum(Object.keys(DataCompositionPictureOutputType) as [TDataCompositionPictureOutputType, ...TDataCompositionPictureOutputType[]])
export const ZDataCompositionPictureOutputTypeEnterprise = z.enum(Object.values(DataCompositionPictureOutputType) as [TDataCompositionPictureOutputTypeEnterprise, ...TDataCompositionPictureOutputTypeEnterprise[]])

export type TDataCompositionPictureOutputType = keyof typeof DataCompositionPictureOutputType
export type TDataCompositionPictureOutputTypeEnterprise = `${DataCompositionPictureOutputType}`

enum DataCompositionResourcesAutoPosition {
  DontUse = "НеИспользовать",
  AfterAllFields = "ПослеВсехПолей",
}

export const ZDataCompositionResourcesAutoPosition = z.enum(Object.keys(DataCompositionResourcesAutoPosition) as [TDataCompositionResourcesAutoPosition, ...TDataCompositionResourcesAutoPosition[]])
export const ZDataCompositionResourcesAutoPositionEnterprise = z.enum(Object.values(DataCompositionResourcesAutoPosition) as [TDataCompositionResourcesAutoPositionEnterprise, ...TDataCompositionResourcesAutoPositionEnterprise[]])

export type TDataCompositionResourcesAutoPosition = keyof typeof DataCompositionResourcesAutoPosition
export type TDataCompositionResourcesAutoPositionEnterprise = `${DataCompositionResourcesAutoPosition}`

enum DataCompositionResourcesPlacement {
  Vertically = "Вертикально",
  Horizontally = "Горизонтально",
}

export const ZDataCompositionResourcesPlacement = z.enum(Object.keys(DataCompositionResourcesPlacement) as [TDataCompositionResourcesPlacement, ...TDataCompositionResourcesPlacement[]])
export const ZDataCompositionResourcesPlacementEnterprise = z.enum(Object.values(DataCompositionResourcesPlacement) as [TDataCompositionResourcesPlacementEnterprise, ...TDataCompositionResourcesPlacementEnterprise[]])

export type TDataCompositionResourcesPlacement = keyof typeof DataCompositionResourcesPlacement
export type TDataCompositionResourcesPlacementEnterprise = `${DataCompositionResourcesPlacement}`

enum DataCompositionResourcesPlacementInChart {
  Auto = "Авто",
  Series = "Серии",
  Points = "Точки",
}

export const ZDataCompositionResourcesPlacementInChart = z.enum(Object.keys(DataCompositionResourcesPlacementInChart) as [TDataCompositionResourcesPlacementInChart, ...TDataCompositionResourcesPlacementInChart[]])
export const ZDataCompositionResourcesPlacementInChartEnterprise = z.enum(Object.values(DataCompositionResourcesPlacementInChart) as [TDataCompositionResourcesPlacementInChartEnterprise, ...TDataCompositionResourcesPlacementInChartEnterprise[]])

export type TDataCompositionResourcesPlacementInChart = keyof typeof DataCompositionResourcesPlacementInChart
export type TDataCompositionResourcesPlacementInChartEnterprise = `${DataCompositionResourcesPlacementInChart}`

enum DataCompositionResultItemType {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
}

export const ZDataCompositionResultItemType = z.enum(Object.keys(DataCompositionResultItemType) as [TDataCompositionResultItemType, ...TDataCompositionResultItemType[]])
export const ZDataCompositionResultItemTypeEnterprise = z.enum(Object.values(DataCompositionResultItemType) as [TDataCompositionResultItemTypeEnterprise, ...TDataCompositionResultItemTypeEnterprise[]])

export type TDataCompositionResultItemType = keyof typeof DataCompositionResultItemType
export type TDataCompositionResultItemTypeEnterprise = `${DataCompositionResultItemType}`

enum DataCompositionResultNestedItemsLayout {
  Vertically = "Вертикально",
  Horizontally = "Горизонтально",
}

export const ZDataCompositionResultNestedItemsLayout = z.enum(Object.keys(DataCompositionResultNestedItemsLayout) as [TDataCompositionResultNestedItemsLayout, ...TDataCompositionResultNestedItemsLayout[]])
export const ZDataCompositionResultNestedItemsLayoutEnterprise = z.enum(Object.values(DataCompositionResultNestedItemsLayout) as [TDataCompositionResultNestedItemsLayoutEnterprise, ...TDataCompositionResultNestedItemsLayoutEnterprise[]])

export type TDataCompositionResultNestedItemsLayout = keyof typeof DataCompositionResultNestedItemsLayout
export type TDataCompositionResultNestedItemsLayoutEnterprise = `${DataCompositionResultNestedItemsLayout}`

enum DataCompositionSettingsItemState {
  Enabled = "Включен",
  Disabled = "Отключен",
  DeletedByUser = "УдаленПользователем",
}

export const ZDataCompositionSettingsItemState = z.enum(Object.keys(DataCompositionSettingsItemState) as [TDataCompositionSettingsItemState, ...TDataCompositionSettingsItemState[]])
export const ZDataCompositionSettingsItemStateEnterprise = z.enum(Object.values(DataCompositionSettingsItemState) as [TDataCompositionSettingsItemStateEnterprise, ...TDataCompositionSettingsItemStateEnterprise[]])

export type TDataCompositionSettingsItemState = keyof typeof DataCompositionSettingsItemState
export type TDataCompositionSettingsItemStateEnterprise = `${DataCompositionSettingsItemState}`

enum DataCompositionSettingsItemViewMode {
  Auto = "Авто",
  QuickAccess = "БыстрыйДоступ",
  Inaccessible = "Недоступный",
  Normal = "Обычный",
}

export const ZDataCompositionSettingsItemViewMode = z.enum(Object.keys(DataCompositionSettingsItemViewMode) as [TDataCompositionSettingsItemViewMode, ...TDataCompositionSettingsItemViewMode[]])
export const ZDataCompositionSettingsItemViewModeEnterprise = z.enum(Object.values(DataCompositionSettingsItemViewMode) as [TDataCompositionSettingsItemViewModeEnterprise, ...TDataCompositionSettingsItemViewModeEnterprise[]])

export type TDataCompositionSettingsItemViewMode = keyof typeof DataCompositionSettingsItemViewMode
export type TDataCompositionSettingsItemViewModeEnterprise = `${DataCompositionSettingsItemViewMode}`

enum DataCompositionSettingsRefreshMethod {
  Full = "Полное",
  CheckAvailability = "ПроверятьДоступность",
}

export const ZDataCompositionSettingsRefreshMethod = z.enum(Object.keys(DataCompositionSettingsRefreshMethod) as [TDataCompositionSettingsRefreshMethod, ...TDataCompositionSettingsRefreshMethod[]])
export const ZDataCompositionSettingsRefreshMethodEnterprise = z.enum(Object.values(DataCompositionSettingsRefreshMethod) as [TDataCompositionSettingsRefreshMethodEnterprise, ...TDataCompositionSettingsRefreshMethodEnterprise[]])

export type TDataCompositionSettingsRefreshMethod = keyof typeof DataCompositionSettingsRefreshMethod
export type TDataCompositionSettingsRefreshMethodEnterprise = `${DataCompositionSettingsRefreshMethod}`

enum DataCompositionSettingsViewMode {
  QuickAccess = "БыстрыйДоступ",
  All = "Все",
}

export const ZDataCompositionSettingsViewMode = z.enum(Object.keys(DataCompositionSettingsViewMode) as [TDataCompositionSettingsViewMode, ...TDataCompositionSettingsViewMode[]])
export const ZDataCompositionSettingsViewModeEnterprise = z.enum(Object.values(DataCompositionSettingsViewMode) as [TDataCompositionSettingsViewModeEnterprise, ...TDataCompositionSettingsViewModeEnterprise[]])

export type TDataCompositionSettingsViewMode = keyof typeof DataCompositionSettingsViewMode
export type TDataCompositionSettingsViewModeEnterprise = `${DataCompositionSettingsViewMode}`

enum DataCompositionSortDirection {
  Asc = "Возр",
  Desc = "Убыв",
}

export const ZDataCompositionSortDirection = z.enum(Object.keys(DataCompositionSortDirection) as [TDataCompositionSortDirection, ...TDataCompositionSortDirection[]])
export const ZDataCompositionSortDirectionEnterprise = z.enum(Object.values(DataCompositionSortDirection) as [TDataCompositionSortDirectionEnterprise, ...TDataCompositionSortDirectionEnterprise[]])

export type TDataCompositionSortDirection = keyof typeof DataCompositionSortDirection
export type TDataCompositionSortDirectionEnterprise = `${DataCompositionSortDirection}`

enum DataCompositionTextOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export const ZDataCompositionTextOutputType = z.enum(Object.keys(DataCompositionTextOutputType) as [TDataCompositionTextOutputType, ...TDataCompositionTextOutputType[]])
export const ZDataCompositionTextOutputTypeEnterprise = z.enum(Object.values(DataCompositionTextOutputType) as [TDataCompositionTextOutputTypeEnterprise, ...TDataCompositionTextOutputTypeEnterprise[]])

export type TDataCompositionTextOutputType = keyof typeof DataCompositionTextOutputType
export type TDataCompositionTextOutputTypeEnterprise = `${DataCompositionTextOutputType}`

enum DataCompositionTextPlacementType {
  Overflow = "Выступать",
  Block = "Забивать",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export const ZDataCompositionTextPlacementType = z.enum(Object.keys(DataCompositionTextPlacementType) as [TDataCompositionTextPlacementType, ...TDataCompositionTextPlacementType[]])
export const ZDataCompositionTextPlacementTypeEnterprise = z.enum(Object.values(DataCompositionTextPlacementType) as [TDataCompositionTextPlacementTypeEnterprise, ...TDataCompositionTextPlacementTypeEnterprise[]])

export type TDataCompositionTextPlacementType = keyof typeof DataCompositionTextPlacementType
export type TDataCompositionTextPlacementTypeEnterprise = `${DataCompositionTextPlacementType}`

enum DataCompositionTotalPlacement {
  Auto = "Авто",
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
  None = "Нет",
}

export const ZDataCompositionTotalPlacement = z.enum(Object.keys(DataCompositionTotalPlacement) as [TDataCompositionTotalPlacement, ...TDataCompositionTotalPlacement[]])
export const ZDataCompositionTotalPlacementEnterprise = z.enum(Object.values(DataCompositionTotalPlacement) as [TDataCompositionTotalPlacementEnterprise, ...TDataCompositionTotalPlacementEnterprise[]])

export type TDataCompositionTotalPlacement = keyof typeof DataCompositionTotalPlacement
export type TDataCompositionTotalPlacementEnterprise = `${DataCompositionTotalPlacement}`

enum OnUnavailabilityDataCompositionSettingsAction {
  DisableControl = "ИзменятьДоступностьПоля",
  HidePage = "СкрыватьСтраницу",
}

export const ZOnUnavailabilityDataCompositionSettingsAction = z.enum(Object.keys(OnUnavailabilityDataCompositionSettingsAction) as [TOnUnavailabilityDataCompositionSettingsAction, ...TOnUnavailabilityDataCompositionSettingsAction[]])
export const ZOnUnavailabilityDataCompositionSettingsActionEnterprise = z.enum(Object.values(OnUnavailabilityDataCompositionSettingsAction) as [TOnUnavailabilityDataCompositionSettingsActionEnterprise, ...TOnUnavailabilityDataCompositionSettingsActionEnterprise[]])

export type TOnUnavailabilityDataCompositionSettingsAction = keyof typeof OnUnavailabilityDataCompositionSettingsAction
export type TOnUnavailabilityDataCompositionSettingsActionEnterprise = `${OnUnavailabilityDataCompositionSettingsAction}`

enum ResultCompositionMode {
  Auto = "Авто",
  Directly = "Непосредственно",
  Background = "Фоновый",
}

export const ZResultCompositionMode = z.enum(Object.keys(ResultCompositionMode) as [TResultCompositionMode, ...TResultCompositionMode[]])
export const ZResultCompositionModeEnterprise = z.enum(Object.values(ResultCompositionMode) as [TResultCompositionModeEnterprise, ...TResultCompositionModeEnterprise[]])

export type TResultCompositionMode = keyof typeof ResultCompositionMode
export type TResultCompositionModeEnterprise = `${ResultCompositionMode}`

enum SaveDataCompositionAppearance {
  Auto = "Авто",
  ForUser = "ДляПользователя",
  ForCurrentResult = "ДляТекущегоРезультата",
  DontUse = "НеИспользовать",
  ByKeyForUser = "ПоКлючуДляПользователя",
}

export const ZSaveDataCompositionAppearance = z.enum(Object.keys(SaveDataCompositionAppearance) as [TSaveDataCompositionAppearance, ...TSaveDataCompositionAppearance[]])
export const ZSaveDataCompositionAppearanceEnterprise = z.enum(Object.values(SaveDataCompositionAppearance) as [TSaveDataCompositionAppearanceEnterprise, ...TSaveDataCompositionAppearanceEnterprise[]])

export type TSaveDataCompositionAppearance = keyof typeof SaveDataCompositionAppearance
export type TSaveDataCompositionAppearanceEnterprise = `${SaveDataCompositionAppearance}`

enum XSAttributeUseCategory {
  Prohibited = "Запрещено",
  Optional = "Необязательно",
  Required = "Обязательно",
}

export const ZXSAttributeUseCategory = z.enum(Object.keys(XSAttributeUseCategory) as [TXSAttributeUseCategory, ...TXSAttributeUseCategory[]])
export const ZXSAttributeUseCategoryEnterprise = z.enum(Object.values(XSAttributeUseCategory) as [TXSAttributeUseCategoryEnterprise, ...TXSAttributeUseCategoryEnterprise[]])

export type TXSAttributeUseCategory = keyof typeof XSAttributeUseCategory
export type TXSAttributeUseCategoryEnterprise = `${XSAttributeUseCategory}`

enum XSComplexFinal {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export const ZXSComplexFinal = z.enum(Object.keys(XSComplexFinal) as [TXSComplexFinal, ...TXSComplexFinal[]])
export const ZXSComplexFinalEnterprise = z.enum(Object.values(XSComplexFinal) as [TXSComplexFinalEnterprise, ...TXSComplexFinalEnterprise[]])

export type TXSComplexFinal = keyof typeof XSComplexFinal
export type TXSComplexFinalEnterprise = `${XSComplexFinal}`

enum XSComponentType {
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

export const ZXSComponentType = z.enum(Object.keys(XSComponentType) as [TXSComponentType, ...TXSComponentType[]])
export const ZXSComponentTypeEnterprise = z.enum(Object.values(XSComponentType) as [TXSComponentTypeEnterprise, ...TXSComponentTypeEnterprise[]])

export type TXSComponentType = keyof typeof XSComponentType
export type TXSComponentTypeEnterprise = `${XSComponentType}`

enum XSCompositor {
  All = "Все",
  Choice = "Выбор",
  Sequence = "Последовательность",
}

export const ZXSCompositor = z.enum(Object.keys(XSCompositor) as [TXSCompositor, ...TXSCompositor[]])
export const ZXSCompositorEnterprise = z.enum(Object.values(XSCompositor) as [TXSCompositorEnterprise, ...TXSCompositorEnterprise[]])

export type TXSCompositor = keyof typeof XSCompositor
export type TXSCompositorEnterprise = `${XSCompositor}`

enum XSConstraint {
  Default = "ПоУмолчанию",
  Fixed = "Фиксированное",
}

export const ZXSConstraint = z.enum(Object.keys(XSConstraint) as [TXSConstraint, ...TXSConstraint[]])
export const ZXSConstraintEnterprise = z.enum(Object.values(XSConstraint) as [TXSConstraintEnterprise, ...TXSConstraintEnterprise[]])

export type TXSConstraint = keyof typeof XSConstraint
export type TXSConstraintEnterprise = `${XSConstraint}`

enum XSContentModel {
  Simple = "Простая",
  Complex = "Составная",
}

export const ZXSContentModel = z.enum(Object.keys(XSContentModel) as [TXSContentModel, ...TXSContentModel[]])
export const ZXSContentModelEnterprise = z.enum(Object.values(XSContentModel) as [TXSContentModelEnterprise, ...TXSContentModelEnterprise[]])

export type TXSContentModel = keyof typeof XSContentModel
export type TXSContentModelEnterprise = `${XSContentModel}`

enum XSDerivationMethod {
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export const ZXSDerivationMethod = z.enum(Object.keys(XSDerivationMethod) as [TXSDerivationMethod, ...TXSDerivationMethod[]])
export const ZXSDerivationMethodEnterprise = z.enum(Object.values(XSDerivationMethod) as [TXSDerivationMethodEnterprise, ...TXSDerivationMethodEnterprise[]])

export type TXSDerivationMethod = keyof typeof XSDerivationMethod
export type TXSDerivationMethodEnterprise = `${XSDerivationMethod}`

enum XSDisallowedSubstitutions {
  All = "Все",
  Restriction = "Ограничение",
  Substitution = "Подстановка",
  Extension = "Расширение",
}

export const ZXSDisallowedSubstitutions = z.enum(Object.keys(XSDisallowedSubstitutions) as [TXSDisallowedSubstitutions, ...TXSDisallowedSubstitutions[]])
export const ZXSDisallowedSubstitutionsEnterprise = z.enum(Object.values(XSDisallowedSubstitutions) as [TXSDisallowedSubstitutionsEnterprise, ...TXSDisallowedSubstitutionsEnterprise[]])

export type TXSDisallowedSubstitutions = keyof typeof XSDisallowedSubstitutions
export type TXSDisallowedSubstitutionsEnterprise = `${XSDisallowedSubstitutions}`

enum XSForm {
  Qualified = "Квалифицированная",
  Unqualified = "Неквалифицированная",
}

export const ZXSForm = z.enum(Object.keys(XSForm) as [TXSForm, ...TXSForm[]])
export const ZXSFormEnterprise = z.enum(Object.values(XSForm) as [TXSFormEnterprise, ...TXSFormEnterprise[]])

export type TXSForm = keyof typeof XSForm
export type TXSFormEnterprise = `${XSForm}`

enum XSIdentityConstraintCategory {
  Key = "Ключ",
  KeyRef = "СсылкаНаКлюч",
  Unique = "Уникальность",
}

export const ZXSIdentityConstraintCategory = z.enum(Object.keys(XSIdentityConstraintCategory) as [TXSIdentityConstraintCategory, ...TXSIdentityConstraintCategory[]])
export const ZXSIdentityConstraintCategoryEnterprise = z.enum(Object.values(XSIdentityConstraintCategory) as [TXSIdentityConstraintCategoryEnterprise, ...TXSIdentityConstraintCategoryEnterprise[]])

export type TXSIdentityConstraintCategory = keyof typeof XSIdentityConstraintCategory
export type TXSIdentityConstraintCategoryEnterprise = `${XSIdentityConstraintCategory}`

enum XSNamespaceConstraintCategory {
  Not = "Кроме",
  Any = "Любое",
  Set = "Набор",
}

export const ZXSNamespaceConstraintCategory = z.enum(Object.keys(XSNamespaceConstraintCategory) as [TXSNamespaceConstraintCategory, ...TXSNamespaceConstraintCategory[]])
export const ZXSNamespaceConstraintCategoryEnterprise = z.enum(Object.values(XSNamespaceConstraintCategory) as [TXSNamespaceConstraintCategoryEnterprise, ...TXSNamespaceConstraintCategoryEnterprise[]])

export type TXSNamespaceConstraintCategory = keyof typeof XSNamespaceConstraintCategory
export type TXSNamespaceConstraintCategoryEnterprise = `${XSNamespaceConstraintCategory}`

enum XSProcessContents {
  Skip = "Пропустить",
  Lax = "Слабая",
  Strict = "Строгая",
}

export const ZXSProcessContents = z.enum(Object.keys(XSProcessContents) as [TXSProcessContents, ...TXSProcessContents[]])
export const ZXSProcessContentsEnterprise = z.enum(Object.values(XSProcessContents) as [TXSProcessContentsEnterprise, ...TXSProcessContentsEnterprise[]])

export type TXSProcessContents = keyof typeof XSProcessContents
export type TXSProcessContentsEnterprise = `${XSProcessContents}`

enum XSProhibitedSubstitutions {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export const ZXSProhibitedSubstitutions = z.enum(Object.keys(XSProhibitedSubstitutions) as [TXSProhibitedSubstitutions, ...TXSProhibitedSubstitutions[]])
export const ZXSProhibitedSubstitutionsEnterprise = z.enum(Object.values(XSProhibitedSubstitutions) as [TXSProhibitedSubstitutionsEnterprise, ...TXSProhibitedSubstitutionsEnterprise[]])

export type TXSProhibitedSubstitutions = keyof typeof XSProhibitedSubstitutions
export type TXSProhibitedSubstitutionsEnterprise = `${XSProhibitedSubstitutions}`

enum XSSchemaFinal {
  All = "Все",
  Union = "Объединение",
  Restriction = "Ограничение",
  Extension = "Расширение",
  List = "Список",
}

export const ZXSSchemaFinal = z.enum(Object.keys(XSSchemaFinal) as [TXSSchemaFinal, ...TXSSchemaFinal[]])
export const ZXSSchemaFinalEnterprise = z.enum(Object.values(XSSchemaFinal) as [TXSSchemaFinalEnterprise, ...TXSSchemaFinalEnterprise[]])

export type TXSSchemaFinal = keyof typeof XSSchemaFinal
export type TXSSchemaFinalEnterprise = `${XSSchemaFinal}`

enum XSSimpleFinal {
  All = "Все",
  Union = "Объединение",
  Restriction = "Ограничение",
  List = "Список",
}

export const ZXSSimpleFinal = z.enum(Object.keys(XSSimpleFinal) as [TXSSimpleFinal, ...TXSSimpleFinal[]])
export const ZXSSimpleFinalEnterprise = z.enum(Object.values(XSSimpleFinal) as [TXSSimpleFinalEnterprise, ...TXSSimpleFinalEnterprise[]])

export type TXSSimpleFinal = keyof typeof XSSimpleFinal
export type TXSSimpleFinalEnterprise = `${XSSimpleFinal}`

enum XSSimpleTypeVariety {
  Atomic = "Атомарная",
  Union = "Объединение",
  List = "Список",
}

export const ZXSSimpleTypeVariety = z.enum(Object.keys(XSSimpleTypeVariety) as [TXSSimpleTypeVariety, ...TXSSimpleTypeVariety[]])
export const ZXSSimpleTypeVarietyEnterprise = z.enum(Object.values(XSSimpleTypeVariety) as [TXSSimpleTypeVarietyEnterprise, ...TXSSimpleTypeVarietyEnterprise[]])

export type TXSSimpleTypeVariety = keyof typeof XSSimpleTypeVariety
export type TXSSimpleTypeVarietyEnterprise = `${XSSimpleTypeVariety}`

enum XSSubstitutionGroupExclusions {
  All = "Все",
  Restriction = "Ограничение",
  Extension = "Расширение",
}

export const ZXSSubstitutionGroupExclusions = z.enum(Object.keys(XSSubstitutionGroupExclusions) as [TXSSubstitutionGroupExclusions, ...TXSSubstitutionGroupExclusions[]])
export const ZXSSubstitutionGroupExclusionsEnterprise = z.enum(Object.values(XSSubstitutionGroupExclusions) as [TXSSubstitutionGroupExclusionsEnterprise, ...TXSSubstitutionGroupExclusionsEnterprise[]])

export type TXSSubstitutionGroupExclusions = keyof typeof XSSubstitutionGroupExclusions
export type TXSSubstitutionGroupExclusionsEnterprise = `${XSSubstitutionGroupExclusions}`

enum XSWhitespaceHandling {
  Replace = "Заменять",
  Collapse = "Сворачивать",
  Preserve = "Сохранять",
}

export const ZXSWhitespaceHandling = z.enum(Object.keys(XSWhitespaceHandling) as [TXSWhitespaceHandling, ...TXSWhitespaceHandling[]])
export const ZXSWhitespaceHandlingEnterprise = z.enum(Object.values(XSWhitespaceHandling) as [TXSWhitespaceHandlingEnterprise, ...TXSWhitespaceHandlingEnterprise[]])

export type TXSWhitespaceHandling = keyof typeof XSWhitespaceHandling
export type TXSWhitespaceHandlingEnterprise = `${XSWhitespaceHandling}`

enum XSXPathVariety {
  Field = "Поле",
  Selector = "Селектор",
}

export const ZXSXPathVariety = z.enum(Object.keys(XSXPathVariety) as [TXSXPathVariety, ...TXSXPathVariety[]])
export const ZXSXPathVarietyEnterprise = z.enum(Object.values(XSXPathVariety) as [TXSXPathVarietyEnterprise, ...TXSXPathVarietyEnterprise[]])

export type TXSXPathVariety = keyof typeof XSXPathVariety
export type TXSXPathVarietyEnterprise = `${XSXPathVariety}`

enum EventLogDataStorageSplitPeriod {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Week = "Неделя",
  DontUse = "НеИспользовать",
  Hour = "Час",
}

export const ZEventLogDataStorageSplitPeriod = z.enum(Object.keys(EventLogDataStorageSplitPeriod) as [TEventLogDataStorageSplitPeriod, ...TEventLogDataStorageSplitPeriod[]])
export const ZEventLogDataStorageSplitPeriodEnterprise = z.enum(Object.values(EventLogDataStorageSplitPeriod) as [TEventLogDataStorageSplitPeriodEnterprise, ...TEventLogDataStorageSplitPeriodEnterprise[]])

export type TEventLogDataStorageSplitPeriod = keyof typeof EventLogDataStorageSplitPeriod
export type TEventLogDataStorageSplitPeriodEnterprise = `${EventLogDataStorageSplitPeriod}`

enum EventLogEntryTransactionMode {
  Independent = "Независимая",
  Transactional = "Транзакционная",
}

export const ZEventLogEntryTransactionMode = z.enum(Object.keys(EventLogEntryTransactionMode) as [TEventLogEntryTransactionMode, ...TEventLogEntryTransactionMode[]])
export const ZEventLogEntryTransactionModeEnterprise = z.enum(Object.values(EventLogEntryTransactionMode) as [TEventLogEntryTransactionModeEnterprise, ...TEventLogEntryTransactionModeEnterprise[]])

export type TEventLogEntryTransactionMode = keyof typeof EventLogEntryTransactionMode
export type TEventLogEntryTransactionModeEnterprise = `${EventLogEntryTransactionMode}`

enum EventLogEntryTransactionStatus {
  Committed = "Зафиксирована",
  Unfinished = "НеЗавершена",
  NotApplicable = "НетТранзакции",
  RolledBack = "Отменена",
}

export const ZEventLogEntryTransactionStatus = z.enum(Object.keys(EventLogEntryTransactionStatus) as [TEventLogEntryTransactionStatus, ...TEventLogEntryTransactionStatus[]])
export const ZEventLogEntryTransactionStatusEnterprise = z.enum(Object.values(EventLogEntryTransactionStatus) as [TEventLogEntryTransactionStatusEnterprise, ...TEventLogEntryTransactionStatusEnterprise[]])

export type TEventLogEntryTransactionStatus = keyof typeof EventLogEntryTransactionStatus
export type TEventLogEntryTransactionStatusEnterprise = `${EventLogEntryTransactionStatus}`

enum EventLogLevel {
  Information = "Информация",
  Error = "Ошибка",
  Warning = "Предупреждение",
  Note = "Примечание",
}

export const ZEventLogLevel = z.enum(Object.keys(EventLogLevel) as [TEventLogLevel, ...TEventLogLevel[]])
export const ZEventLogLevelEnterprise = z.enum(Object.values(EventLogLevel) as [TEventLogLevelEnterprise, ...TEventLogLevelEnterprise[]])

export type TEventLogLevel = keyof typeof EventLogLevel
export type TEventLogLevelEnterprise = `${EventLogLevel}`

enum DataLockControlMode {
  Automatic = "Автоматический",
  Managed = "Управляемый",
}

export const ZDataLockControlMode = z.enum(Object.keys(DataLockControlMode) as [TDataLockControlMode, ...TDataLockControlMode[]])
export const ZDataLockControlModeEnterprise = z.enum(Object.values(DataLockControlMode) as [TDataLockControlModeEnterprise, ...TDataLockControlModeEnterprise[]])

export type TDataLockControlMode = keyof typeof DataLockControlMode
export type TDataLockControlModeEnterprise = `${DataLockControlMode}`

enum DataLockMode {
  Exclusive = "Исключительный",
  Shared = "Разделяемый",
}

export const ZDataLockMode = z.enum(Object.keys(DataLockMode) as [TDataLockMode, ...TDataLockMode[]])
export const ZDataLockModeEnterprise = z.enum(Object.values(DataLockMode) as [TDataLockModeEnterprise, ...TDataLockModeEnterprise[]])

export type TDataLockMode = keyof typeof DataLockMode
export type TDataLockModeEnterprise = `${DataLockMode}`

enum AccountingRecordType {
  Debit = "Дебет",
  Credit = "Кредит",
}

export const ZAccountingRecordType = z.enum(Object.keys(AccountingRecordType) as [TAccountingRecordType, ...TAccountingRecordType[]])
export const ZAccountingRecordTypeEnterprise = z.enum(Object.values(AccountingRecordType) as [TAccountingRecordTypeEnterprise, ...TAccountingRecordTypeEnterprise[]])

export type TAccountingRecordType = keyof typeof AccountingRecordType
export type TAccountingRecordTypeEnterprise = `${AccountingRecordType}`

enum AccountType {
  ActivePassive = "АктивноПассивный",
  Active = "Активный",
  Passive = "Пассивный",
}

export const ZAccountType = z.enum(Object.keys(AccountType) as [TAccountType, ...TAccountType[]])
export const ZAccountTypeEnterprise = z.enum(Object.values(AccountType) as [TAccountTypeEnterprise, ...TAccountTypeEnterprise[]])

export type TAccountType = keyof typeof AccountType
export type TAccountTypeEnterprise = `${AccountType}`

enum AccumulationRecordType {
  Receipt = "Приход",
  Expense = "Расход",
}

export const ZAccumulationRecordType = z.enum(Object.keys(AccumulationRecordType) as [TAccumulationRecordType, ...TAccumulationRecordType[]])
export const ZAccumulationRecordTypeEnterprise = z.enum(Object.values(AccumulationRecordType) as [TAccumulationRecordTypeEnterprise, ...TAccumulationRecordTypeEnterprise[]])

export type TAccumulationRecordType = keyof typeof AccumulationRecordType
export type TAccumulationRecordTypeEnterprise = `${AccumulationRecordType}`

enum AccumulationRegisterAggregatePeriodicity {
  Auto = "Авто",
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
  HalfYear = "Полугодие",
}

export const ZAccumulationRegisterAggregatePeriodicity = z.enum(Object.keys(AccumulationRegisterAggregatePeriodicity) as [TAccumulationRegisterAggregatePeriodicity, ...TAccumulationRegisterAggregatePeriodicity[]])
export const ZAccumulationRegisterAggregatePeriodicityEnterprise = z.enum(Object.values(AccumulationRegisterAggregatePeriodicity) as [TAccumulationRegisterAggregatePeriodicityEnterprise, ...TAccumulationRegisterAggregatePeriodicityEnterprise[]])

export type TAccumulationRegisterAggregatePeriodicity = keyof typeof AccumulationRegisterAggregatePeriodicity
export type TAccumulationRegisterAggregatePeriodicityEnterprise = `${AccumulationRegisterAggregatePeriodicity}`

enum AccumulationRegisterAggregateUse {
  Auto = "Авто",
  Always = "Всегда",
}

export const ZAccumulationRegisterAggregateUse = z.enum(Object.keys(AccumulationRegisterAggregateUse) as [TAccumulationRegisterAggregateUse, ...TAccumulationRegisterAggregateUse[]])
export const ZAccumulationRegisterAggregateUseEnterprise = z.enum(Object.values(AccumulationRegisterAggregateUse) as [TAccumulationRegisterAggregateUseEnterprise, ...TAccumulationRegisterAggregateUseEnterprise[]])

export type TAccumulationRegisterAggregateUse = keyof typeof AccumulationRegisterAggregateUse
export type TAccumulationRegisterAggregateUseEnterprise = `${AccumulationRegisterAggregateUse}`

enum AutoTimeMode {
  DontUse = "НеИспользовать",
  First = "Первым",
  Last = "Последним",
  CurrentOrFirst = "ТекущееИлиПервым",
  CurrentOrLast = "ТекущееИлиПоследним",
}

export const ZAutoTimeMode = z.enum(Object.keys(AutoTimeMode) as [TAutoTimeMode, ...TAutoTimeMode[]])
export const ZAutoTimeModeEnterprise = z.enum(Object.values(AutoTimeMode) as [TAutoTimeModeEnterprise, ...TAutoTimeModeEnterprise[]])

export type TAutoTimeMode = keyof typeof AutoTimeMode
export type TAutoTimeModeEnterprise = `${AutoTimeMode}`

enum BusinessProcessRoutePointType {
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

export const ZBusinessProcessRoutePointType = z.enum(Object.keys(BusinessProcessRoutePointType) as [TBusinessProcessRoutePointType, ...TBusinessProcessRoutePointType[]])
export const ZBusinessProcessRoutePointTypeEnterprise = z.enum(Object.values(BusinessProcessRoutePointType) as [TBusinessProcessRoutePointTypeEnterprise, ...TBusinessProcessRoutePointTypeEnterprise[]])

export type TBusinessProcessRoutePointType = keyof typeof BusinessProcessRoutePointType
export type TBusinessProcessRoutePointTypeEnterprise = `${BusinessProcessRoutePointType}`

enum CalculationRegisterPeriodType {
  BasePeriod = "БазовыйПериод",
  ActionPeriod = "ПериодДействия",
  RegistrationPeriod = "ПериодРегистрации",
  ActualActionPeriod = "ФактическийПериодДействия",
}

export const ZCalculationRegisterPeriodType = z.enum(Object.keys(CalculationRegisterPeriodType) as [TCalculationRegisterPeriodType, ...TCalculationRegisterPeriodType[]])
export const ZCalculationRegisterPeriodTypeEnterprise = z.enum(Object.values(CalculationRegisterPeriodType) as [TCalculationRegisterPeriodTypeEnterprise, ...TCalculationRegisterPeriodTypeEnterprise[]])

export type TCalculationRegisterPeriodType = keyof typeof CalculationRegisterPeriodType
export type TCalculationRegisterPeriodTypeEnterprise = `${CalculationRegisterPeriodType}`

enum DocumentPostingMode {
  Regular = "Неоперативный",
  RealTime = "Оперативный",
}

export const ZDocumentPostingMode = z.enum(Object.keys(DocumentPostingMode) as [TDocumentPostingMode, ...TDocumentPostingMode[]])
export const ZDocumentPostingModeEnterprise = z.enum(Object.values(DocumentPostingMode) as [TDocumentPostingModeEnterprise, ...TDocumentPostingModeEnterprise[]])

export type TDocumentPostingMode = keyof typeof DocumentPostingMode
export type TDocumentPostingModeEnterprise = `${DocumentPostingMode}`

enum DocumentWriteMode {
  Write = "Запись",
  UndoPosting = "ОтменаПроведения",
  Posting = "Проведение",
}

export const ZDocumentWriteMode = z.enum(Object.keys(DocumentWriteMode) as [TDocumentWriteMode, ...TDocumentWriteMode[]])
export const ZDocumentWriteModeEnterprise = z.enum(Object.values(DocumentWriteMode) as [TDocumentWriteModeEnterprise, ...TDocumentWriteModeEnterprise[]])

export type TDocumentWriteMode = keyof typeof DocumentWriteMode
export type TDocumentWriteModeEnterprise = `${DocumentWriteMode}`

enum FoldersAndItemsUse {
  Folders = "Группы",
  FoldersAndItems = "ГруппыИЭлементы",
  Items = "Элементы",
}

export const ZFoldersAndItemsUse = z.enum(Object.keys(FoldersAndItemsUse) as [TFoldersAndItemsUse, ...TFoldersAndItemsUse[]])
export const ZFoldersAndItemsUseEnterprise = z.enum(Object.values(FoldersAndItemsUse) as [TFoldersAndItemsUseEnterprise, ...TFoldersAndItemsUseEnterprise[]])

export type TFoldersAndItemsUse = keyof typeof FoldersAndItemsUse
export type TFoldersAndItemsUseEnterprise = `${FoldersAndItemsUse}`

enum PostingModeUse {
  Auto = "Авто",
  Regular = "Неоперативный",
  RealTime = "Оперативный",
}

export const ZPostingModeUse = z.enum(Object.keys(PostingModeUse) as [TPostingModeUse, ...TPostingModeUse[]])
export const ZPostingModeUseEnterprise = z.enum(Object.values(PostingModeUse) as [TPostingModeUseEnterprise, ...TPostingModeUseEnterprise[]])

export type TPostingModeUse = keyof typeof PostingModeUse
export type TPostingModeUseEnterprise = `${PostingModeUse}`

enum SliceUse {
  DontUse = "НеИспользовать",
  First = "Первые",
  Last = "Последние",
}

export const ZSliceUse = z.enum(Object.keys(SliceUse) as [TSliceUse, ...TSliceUse[]])
export const ZSliceUseEnterprise = z.enum(Object.values(SliceUse) as [TSliceUseEnterprise, ...TSliceUseEnterprise[]])

export type TSliceUse = keyof typeof SliceUse
export type TSliceUseEnterprise = `${SliceUse}`

enum BackgroundJobState {
  Active = "Активно",
  Completed = "Завершено",
  Failed = "ЗавершеноАварийно",
  Canceled = "Отменено",
}

export const ZBackgroundJobState = z.enum(Object.keys(BackgroundJobState) as [TBackgroundJobState, ...TBackgroundJobState[]])
export const ZBackgroundJobStateEnterprise = z.enum(Object.values(BackgroundJobState) as [TBackgroundJobStateEnterprise, ...TBackgroundJobStateEnterprise[]])

export type TBackgroundJobState = keyof typeof BackgroundJobState
export type TBackgroundJobStateEnterprise = `${BackgroundJobState}`

enum CryptoCertificateCheckMode {
  IgnoreTimeValidity = "ИгнорироватьВремяДействия",
  IgnoreSignatureValidity = "ИгнорироватьДействительностьПодписи",
  IgnoreCertificateRevocationStatus = "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов",
  AllowTestCertificates = "РазрешитьТестовыеСертификаты",
}

export const ZCryptoCertificateCheckMode = z.enum(Object.keys(CryptoCertificateCheckMode) as [TCryptoCertificateCheckMode, ...TCryptoCertificateCheckMode[]])
export const ZCryptoCertificateCheckModeEnterprise = z.enum(Object.values(CryptoCertificateCheckMode) as [TCryptoCertificateCheckModeEnterprise, ...TCryptoCertificateCheckModeEnterprise[]])

export type TCryptoCertificateCheckMode = keyof typeof CryptoCertificateCheckMode
export type TCryptoCertificateCheckModeEnterprise = `${CryptoCertificateCheckMode}`

enum CryptoCertificateIncludeMode {
  IncludeWholeChain = "ВключатьПолнуюЦепочку",
  IncludeSubjectCertificate = "ВключатьСертификатСубъекта",
  IncludeChainWithoutRoot = "ВключатьЦепочкуБезКорневого",
  DontInclude = "НеВключать",
}

export const ZCryptoCertificateIncludeMode = z.enum(Object.keys(CryptoCertificateIncludeMode) as [TCryptoCertificateIncludeMode, ...TCryptoCertificateIncludeMode[]])
export const ZCryptoCertificateIncludeModeEnterprise = z.enum(Object.values(CryptoCertificateIncludeMode) as [TCryptoCertificateIncludeModeEnterprise, ...TCryptoCertificateIncludeModeEnterprise[]])

export type TCryptoCertificateIncludeMode = keyof typeof CryptoCertificateIncludeMode
export type TCryptoCertificateIncludeModeEnterprise = `${CryptoCertificateIncludeMode}`

enum CryptoCertificateStorePlacement {
  ComputerData = "ДанныеКомпьютера",
  OSUserData = "ДанныеПользователяОС",
  ApplicationData = "ДанныеПриложения",
}

export const ZCryptoCertificateStorePlacement = z.enum(Object.keys(CryptoCertificateStorePlacement) as [TCryptoCertificateStorePlacement, ...TCryptoCertificateStorePlacement[]])
export const ZCryptoCertificateStorePlacementEnterprise = z.enum(Object.values(CryptoCertificateStorePlacement) as [TCryptoCertificateStorePlacementEnterprise, ...TCryptoCertificateStorePlacementEnterprise[]])

export type TCryptoCertificateStorePlacement = keyof typeof CryptoCertificateStorePlacement
export type TCryptoCertificateStorePlacementEnterprise = `${CryptoCertificateStorePlacement}`

enum CryptoCertificateStoreType {
  RootCertificates = "КорневыеСертификаты",
  PersonalCertificates = "ПерсональныеСертификаты",
  RecipientCertificates = "СертификатыПолучателей",
  CertificationAuthorityCertificates = "СертификатыУдостоверяющихЦентров",
}

export const ZCryptoCertificateStoreType = z.enum(Object.keys(CryptoCertificateStoreType) as [TCryptoCertificateStoreType, ...TCryptoCertificateStoreType[]])
export const ZCryptoCertificateStoreTypeEnterprise = z.enum(Object.values(CryptoCertificateStoreType) as [TCryptoCertificateStoreTypeEnterprise, ...TCryptoCertificateStoreTypeEnterprise[]])

export type TCryptoCertificateStoreType = keyof typeof CryptoCertificateStoreType
export type TCryptoCertificateStoreTypeEnterprise = `${CryptoCertificateStoreType}`

enum CryptoInteractiveModeUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCryptoInteractiveModeUse = z.enum(Object.keys(CryptoInteractiveModeUse) as [TCryptoInteractiveModeUse, ...TCryptoInteractiveModeUse[]])
export const ZCryptoInteractiveModeUseEnterprise = z.enum(Object.values(CryptoInteractiveModeUse) as [TCryptoInteractiveModeUseEnterprise, ...TCryptoInteractiveModeUseEnterprise[]])

export type TCryptoInteractiveModeUse = keyof typeof CryptoInteractiveModeUse
export type TCryptoInteractiveModeUseEnterprise = `${CryptoInteractiveModeUse}`

enum FormattedDocumentFileType {
  ANSITXT = "ANSITXT",
  HTML = "HTML",
  PDF = "PDF",
  TXT = "TXT",
}

export const ZFormattedDocumentFileType = z.enum(Object.keys(FormattedDocumentFileType) as [TFormattedDocumentFileType, ...TFormattedDocumentFileType[]])
export const ZFormattedDocumentFileTypeEnterprise = z.enum(Object.values(FormattedDocumentFileType) as [TFormattedDocumentFileTypeEnterprise, ...TFormattedDocumentFileTypeEnterprise[]])

export type TFormattedDocumentFileType = keyof typeof FormattedDocumentFileType
export type TFormattedDocumentFileTypeEnterprise = `${FormattedDocumentFileType}`

enum FormattedDocumentParagraphType {
  BulletedList = "МаркированныйСписок",
  NumberedList = "НумерованныйСписок",
  Usual = "Обычный",
}

export const ZFormattedDocumentParagraphType = z.enum(Object.keys(FormattedDocumentParagraphType) as [TFormattedDocumentParagraphType, ...TFormattedDocumentParagraphType[]])
export const ZFormattedDocumentParagraphTypeEnterprise = z.enum(Object.values(FormattedDocumentParagraphType) as [TFormattedDocumentParagraphTypeEnterprise, ...TFormattedDocumentParagraphTypeEnterprise[]])

export type TFormattedDocumentParagraphType = keyof typeof FormattedDocumentParagraphType
export type TFormattedDocumentParagraphTypeEnterprise = `${FormattedDocumentParagraphType}`

enum RowGotoDirection {
  Up = "Вверх",
  Down = "Вниз",
}

export const ZRowGotoDirection = z.enum(Object.keys(RowGotoDirection) as [TRowGotoDirection, ...TRowGotoDirection[]])
export const ZRowGotoDirectionEnterprise = z.enum(Object.values(RowGotoDirection) as [TRowGotoDirectionEnterprise, ...TRowGotoDirectionEnterprise[]])

export type TRowGotoDirection = keyof typeof RowGotoDirection
export type TRowGotoDirectionEnterprise = `${RowGotoDirection}`

enum InternetMailAttachmentEncodingMode {
  MIME = "MIME",
  UUEncode = "UUEncode",
}

export const ZInternetMailAttachmentEncodingMode = z.enum(Object.keys(InternetMailAttachmentEncodingMode) as [TInternetMailAttachmentEncodingMode, ...TInternetMailAttachmentEncodingMode[]])
export const ZInternetMailAttachmentEncodingModeEnterprise = z.enum(Object.values(InternetMailAttachmentEncodingMode) as [TInternetMailAttachmentEncodingModeEnterprise, ...TInternetMailAttachmentEncodingModeEnterprise[]])

export type TInternetMailAttachmentEncodingMode = keyof typeof InternetMailAttachmentEncodingMode
export type TInternetMailAttachmentEncodingModeEnterprise = `${InternetMailAttachmentEncodingMode}`

enum InternetMailMessageImportance {
  High = "Высокая",
  Highest = "Наивысшая",
  Lowest = "Наименьшая",
  Low = "Низкая",
  Normal = "Обычная",
}

export const ZInternetMailMessageImportance = z.enum(Object.keys(InternetMailMessageImportance) as [TInternetMailMessageImportance, ...TInternetMailMessageImportance[]])
export const ZInternetMailMessageImportanceEnterprise = z.enum(Object.values(InternetMailMessageImportance) as [TInternetMailMessageImportanceEnterprise, ...TInternetMailMessageImportanceEnterprise[]])

export type TInternetMailMessageImportance = keyof typeof InternetMailMessageImportance
export type TInternetMailMessageImportanceEnterprise = `${InternetMailMessageImportance}`

enum InternetMailMessageNonASCIISymbolsEncodingMode {
  MIME = "MIME",
  QuotedPrintable = "QuotedPrintable",
  None = "БезКодирования",
}

export const ZInternetMailMessageNonASCIISymbolsEncodingMode = z.enum(Object.keys(InternetMailMessageNonASCIISymbolsEncodingMode) as [TInternetMailMessageNonASCIISymbolsEncodingMode, ...TInternetMailMessageNonASCIISymbolsEncodingMode[]])
export const ZInternetMailMessageNonASCIISymbolsEncodingModeEnterprise = z.enum(Object.values(InternetMailMessageNonASCIISymbolsEncodingMode) as [TInternetMailMessageNonASCIISymbolsEncodingModeEnterprise, ...TInternetMailMessageNonASCIISymbolsEncodingModeEnterprise[]])

export type TInternetMailMessageNonASCIISymbolsEncodingMode = keyof typeof InternetMailMessageNonASCIISymbolsEncodingMode
export type TInternetMailMessageNonASCIISymbolsEncodingModeEnterprise = `${InternetMailMessageNonASCIISymbolsEncodingMode}`

enum InternetMailMessageParseStatus {
  ErrorsDetected = "ОбнаруженыОшибки",
  ErrorsNotDetected = "ОшибокНеОбнаружено",
}

export const ZInternetMailMessageParseStatus = z.enum(Object.keys(InternetMailMessageParseStatus) as [TInternetMailMessageParseStatus, ...TInternetMailMessageParseStatus[]])
export const ZInternetMailMessageParseStatusEnterprise = z.enum(Object.values(InternetMailMessageParseStatus) as [TInternetMailMessageParseStatusEnterprise, ...TInternetMailMessageParseStatusEnterprise[]])

export type TInternetMailMessageParseStatus = keyof typeof InternetMailMessageParseStatus
export type TInternetMailMessageParseStatusEnterprise = `${InternetMailMessageParseStatus}`

enum InternetMailProtocol {
  IMAP = "IMAP",
  POP3 = "POP3",
  SMTP = "SMTP",
}

export const ZInternetMailProtocol = z.enum(Object.keys(InternetMailProtocol) as [TInternetMailProtocol, ...TInternetMailProtocol[]])
export const ZInternetMailProtocolEnterprise = z.enum(Object.values(InternetMailProtocol) as [TInternetMailProtocolEnterprise, ...TInternetMailProtocolEnterprise[]])

export type TInternetMailProtocol = keyof typeof InternetMailProtocol
export type TInternetMailProtocolEnterprise = `${InternetMailProtocol}`

enum InternetMailTextProcessing {
  DontProcess = "НеОбрабатывать",
  Process = "Обрабатывать",
}

export const ZInternetMailTextProcessing = z.enum(Object.keys(InternetMailTextProcessing) as [TInternetMailTextProcessing, ...TInternetMailTextProcessing[]])
export const ZInternetMailTextProcessingEnterprise = z.enum(Object.values(InternetMailTextProcessing) as [TInternetMailTextProcessingEnterprise, ...TInternetMailTextProcessingEnterprise[]])

export type TInternetMailTextProcessing = keyof typeof InternetMailTextProcessing
export type TInternetMailTextProcessingEnterprise = `${InternetMailTextProcessing}`

enum InternetMailTextType {
  HTML = "HTML",
  CustomText = "ПроизвольныйТекст",
  PlainText = "ПростойТекст",
  RichText = "РазмеченныйТекст",
}

export const ZInternetMailTextType = z.enum(Object.keys(InternetMailTextType) as [TInternetMailTextType, ...TInternetMailTextType[]])
export const ZInternetMailTextTypeEnterprise = z.enum(Object.values(InternetMailTextType) as [TInternetMailTextTypeEnterprise, ...TInternetMailTextTypeEnterprise[]])

export type TInternetMailTextType = keyof typeof InternetMailTextType
export type TInternetMailTextTypeEnterprise = `${InternetMailTextType}`

enum POP3AuthenticationMode {
  APOP = "APOP",
  CramMD5 = "CramMD5",
  General = "Обычная",
}

export const ZPOP3AuthenticationMode = z.enum(Object.keys(POP3AuthenticationMode) as [TPOP3AuthenticationMode, ...TPOP3AuthenticationMode[]])
export const ZPOP3AuthenticationModeEnterprise = z.enum(Object.values(POP3AuthenticationMode) as [TPOP3AuthenticationModeEnterprise, ...TPOP3AuthenticationModeEnterprise[]])

export type TPOP3AuthenticationMode = keyof typeof POP3AuthenticationMode
export type TPOP3AuthenticationModeEnterprise = `${POP3AuthenticationMode}`

enum SMTPAuthenticationMode {
  CramMD5 = "CramMD5",
  Login = "Login",
  Plain = "Plain",
  None = "БезАутентификации",
  Default = "ПоУмолчанию",
}

export const ZSMTPAuthenticationMode = z.enum(Object.keys(SMTPAuthenticationMode) as [TSMTPAuthenticationMode, ...TSMTPAuthenticationMode[]])
export const ZSMTPAuthenticationModeEnterprise = z.enum(Object.values(SMTPAuthenticationMode) as [TSMTPAuthenticationModeEnterprise, ...TSMTPAuthenticationModeEnterprise[]])

export type TSMTPAuthenticationMode = keyof typeof SMTPAuthenticationMode
export type TSMTPAuthenticationModeEnterprise = `${SMTPAuthenticationMode}`

enum UseInternetMailTokenAuthentication {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZUseInternetMailTokenAuthentication = z.enum(Object.keys(UseInternetMailTokenAuthentication) as [TUseInternetMailTokenAuthentication, ...TUseInternetMailTokenAuthentication[]])
export const ZUseInternetMailTokenAuthenticationEnterprise = z.enum(Object.values(UseInternetMailTokenAuthentication) as [TUseInternetMailTokenAuthenticationEnterprise, ...TUseInternetMailTokenAuthenticationEnterprise[]])

export type TUseInternetMailTokenAuthentication = keyof typeof UseInternetMailTokenAuthentication
export type TUseInternetMailTokenAuthenticationEnterprise = `${UseInternetMailTokenAuthentication}`

enum QueryBuilderDimensionType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export const ZQueryBuilderDimensionType = z.enum(Object.keys(QueryBuilderDimensionType) as [TQueryBuilderDimensionType, ...TQueryBuilderDimensionType[]])
export const ZQueryBuilderDimensionTypeEnterprise = z.enum(Object.values(QueryBuilderDimensionType) as [TQueryBuilderDimensionTypeEnterprise, ...TQueryBuilderDimensionTypeEnterprise[]])

export type TQueryBuilderDimensionType = keyof typeof QueryBuilderDimensionType
export type TQueryBuilderDimensionTypeEnterprise = `${QueryBuilderDimensionType}`

enum AddInConnectionType {
  Isolated = "Изолированно",
  NotIsolated = "НеИзолированно",
}

export const ZAddInConnectionType = z.enum(Object.keys(AddInConnectionType) as [TAddInConnectionType, ...TAddInConnectionType[]])
export const ZAddInConnectionTypeEnterprise = z.enum(Object.values(AddInConnectionType) as [TAddInConnectionTypeEnterprise, ...TAddInConnectionTypeEnterprise[]])

export type TAddInConnectionType = keyof typeof AddInConnectionType
export type TAddInConnectionTypeEnterprise = `${AddInConnectionType}`

enum AddInType {
  COM = "COM",
  Native = "Native",
}

export const ZAddInType = z.enum(Object.keys(AddInType) as [TAddInType, ...TAddInType[]])
export const ZAddInTypeEnterprise = z.enum(Object.values(AddInType) as [TAddInTypeEnterprise, ...TAddInTypeEnterprise[]])

export type TAddInType = keyof typeof AddInType
export type TAddInTypeEnterprise = `${AddInType}`

enum AllowedLength {
  Variable = "Переменная",
  Fixed = "Фиксированная",
}

export const ZAllowedLength = z.enum(Object.keys(AllowedLength) as [TAllowedLength, ...TAllowedLength[]])
export const ZAllowedLengthEnterprise = z.enum(Object.values(AllowedLength) as [TAllowedLengthEnterprise, ...TAllowedLengthEnterprise[]])

export type TAllowedLength = keyof typeof AllowedLength
export type TAllowedLengthEnterprise = `${AllowedLength}`

enum AllowedSign {
  Any = "Любой",
  Nonnegative = "Неотрицательный",
}

export const ZAllowedSign = z.enum(Object.keys(AllowedSign) as [TAllowedSign, ...TAllowedSign[]])
export const ZAllowedSignEnterprise = z.enum(Object.values(AllowedSign) as [TAllowedSignEnterprise, ...TAllowedSignEnterprise[]])

export type TAllowedSign = keyof typeof AllowedSign
export type TAllowedSignEnterprise = `${AllowedSign}`

enum ApplicationFormsOpenningMode {
  Tabs = "Закладки",
  SingleWindows = "ОтдельныеОкна",
}

export const ZApplicationFormsOpenningMode = z.enum(Object.keys(ApplicationFormsOpenningMode) as [TApplicationFormsOpenningMode, ...TApplicationFormsOpenningMode[]])
export const ZApplicationFormsOpenningModeEnterprise = z.enum(Object.values(ApplicationFormsOpenningMode) as [TApplicationFormsOpenningModeEnterprise, ...TApplicationFormsOpenningModeEnterprise[]])

export type TApplicationFormsOpenningMode = keyof typeof ApplicationFormsOpenningMode
export type TApplicationFormsOpenningModeEnterprise = `${ApplicationFormsOpenningMode}`

enum BorderType {
  Absolute = "Абсолютная",
  StyleItem = "ЭлементСтиля",
}

export const ZBorderType = z.enum(Object.keys(BorderType) as [TBorderType, ...TBorderType[]])
export const ZBorderTypeEnterprise = z.enum(Object.values(BorderType) as [TBorderTypeEnterprise, ...TBorderTypeEnterprise[]])

export type TBorderType = keyof typeof BorderType
export type TBorderTypeEnterprise = `${BorderType}`

enum BoundaryType {
  Including = "Включая",
  Excluding = "Исключая",
}

export const ZBoundaryType = z.enum(Object.keys(BoundaryType) as [TBoundaryType, ...TBoundaryType[]])
export const ZBoundaryTypeEnterprise = z.enum(Object.values(BoundaryType) as [TBoundaryTypeEnterprise, ...TBoundaryTypeEnterprise[]])

export type TBoundaryType = keyof typeof BoundaryType
export type TBoundaryTypeEnterprise = `${BoundaryType}`

enum ByteOrderMarkUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZByteOrderMarkUse = z.enum(Object.keys(ByteOrderMarkUse) as [TByteOrderMarkUse, ...TByteOrderMarkUse[]])
export const ZByteOrderMarkUseEnterprise = z.enum(Object.values(ByteOrderMarkUse) as [TByteOrderMarkUseEnterprise, ...TByteOrderMarkUseEnterprise[]])

export type TByteOrderMarkUse = keyof typeof ByteOrderMarkUse
export type TByteOrderMarkUseEnterprise = `${ByteOrderMarkUse}`

enum ClientApplicationBaseFontVariant {
  Large = "Крупный",
  Normal = "Обычный",
}

export const ZClientApplicationBaseFontVariant = z.enum(Object.keys(ClientApplicationBaseFontVariant) as [TClientApplicationBaseFontVariant, ...TClientApplicationBaseFontVariant[]])
export const ZClientApplicationBaseFontVariantEnterprise = z.enum(Object.values(ClientApplicationBaseFontVariant) as [TClientApplicationBaseFontVariantEnterprise, ...TClientApplicationBaseFontVariantEnterprise[]])

export type TClientApplicationBaseFontVariant = keyof typeof ClientApplicationBaseFontVariant
export type TClientApplicationBaseFontVariantEnterprise = `${ClientApplicationBaseFontVariant}`

enum ClientApplicationFormScaleVariant {
  Auto = "Авто",
  Compact = "Компактный",
  Normal = "Обычный",
}

export const ZClientApplicationFormScaleVariant = z.enum(Object.keys(ClientApplicationFormScaleVariant) as [TClientApplicationFormScaleVariant, ...TClientApplicationFormScaleVariant[]])
export const ZClientApplicationFormScaleVariantEnterprise = z.enum(Object.values(ClientApplicationFormScaleVariant) as [TClientApplicationFormScaleVariantEnterprise, ...TClientApplicationFormScaleVariantEnterprise[]])

export type TClientApplicationFormScaleVariant = keyof typeof ClientApplicationFormScaleVariant
export type TClientApplicationFormScaleVariantEnterprise = `${ClientApplicationFormScaleVariant}`

enum ClientApplicationInterfaceVariant {
  Version8_2 = "Версия8_2",
  Taxi = "Такси",
}

export const ZClientApplicationInterfaceVariant = z.enum(Object.keys(ClientApplicationInterfaceVariant) as [TClientApplicationInterfaceVariant, ...TClientApplicationInterfaceVariant[]])
export const ZClientApplicationInterfaceVariantEnterprise = z.enum(Object.values(ClientApplicationInterfaceVariant) as [TClientApplicationInterfaceVariantEnterprise, ...TClientApplicationInterfaceVariantEnterprise[]])

export type TClientApplicationInterfaceVariant = keyof typeof ClientApplicationInterfaceVariant
export type TClientApplicationInterfaceVariantEnterprise = `${ClientApplicationInterfaceVariant}`

enum ClientApplicationType {
  WebClient = "ВебКлиент",
  ExternalConnection = "ВнешнееСоединение",
  MobileAppClient = "МобильноеПриложениеКлиент",
  MobileClient = "МобильныйКлиент",
  ThickClient = "ТолстыйКлиент",
  ThinClient = "ТонкийКлиент",
}

export const ZClientApplicationType = z.enum(Object.keys(ClientApplicationType) as [TClientApplicationType, ...TClientApplicationType[]])
export const ZClientApplicationTypeEnterprise = z.enum(Object.values(ClientApplicationType) as [TClientApplicationTypeEnterprise, ...TClientApplicationTypeEnterprise[]])

export type TClientApplicationType = keyof typeof ClientApplicationType
export type TClientApplicationTypeEnterprise = `${ClientApplicationType}`

enum ClientConnectionSpeed {
  Low = "Низкая",
  Normal = "Обычная",
}

export const ZClientConnectionSpeed = z.enum(Object.keys(ClientConnectionSpeed) as [TClientConnectionSpeed, ...TClientConnectionSpeed[]])
export const ZClientConnectionSpeedEnterprise = z.enum(Object.values(ClientConnectionSpeed) as [TClientConnectionSpeedEnterprise, ...TClientConnectionSpeedEnterprise[]])

export type TClientConnectionSpeed = keyof typeof ClientConnectionSpeed
export type TClientConnectionSpeedEnterprise = `${ClientConnectionSpeed}`

enum ClientRunMode {
  Auto = "Авто",
  OrdinaryApplication = "ОбычноеПриложение",
  ManagedApplication = "УправляемоеПриложение",
}

export const ZClientRunMode = z.enum(Object.keys(ClientRunMode) as [TClientRunMode, ...TClientRunMode[]])
export const ZClientRunModeEnterprise = z.enum(Object.values(ClientRunMode) as [TClientRunModeEnterprise, ...TClientRunModeEnterprise[]])

export type TClientRunMode = keyof typeof ClientRunMode
export type TClientRunModeEnterprise = `${ClientRunMode}`

enum ColorType {
  WebColor = "WebЦвет",
  WindowsColor = "WindowsЦвет",
  Absolute = "Абсолютный",
  AutoColor = "АвтоЦвет",
  StyleItem = "ЭлементСтиля",
}

export const ZColorType = z.enum(Object.keys(ColorType) as [TColorType, ...TColorType[]])
export const ZColorTypeEnterprise = z.enum(Object.values(ColorType) as [TColorTypeEnterprise, ...TColorTypeEnterprise[]])

export type TColorType = keyof typeof ColorType
export type TColorTypeEnterprise = `${ColorType}`

enum ComparisonType {
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

export const ZComparisonType = z.enum(Object.keys(ComparisonType) as [TComparisonType, ...TComparisonType[]])
export const ZComparisonTypeEnterprise = z.enum(Object.values(ComparisonType) as [TComparisonTypeEnterprise, ...TComparisonTypeEnterprise[]])

export type TComparisonType = keyof typeof ComparisonType
export type TComparisonTypeEnterprise = `${ComparisonType}`

enum CompositeWordsSeparationMode {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCompositeWordsSeparationMode = z.enum(Object.keys(CompositeWordsSeparationMode) as [TCompositeWordsSeparationMode, ...TCompositeWordsSeparationMode[]])
export const ZCompositeWordsSeparationModeEnterprise = z.enum(Object.values(CompositeWordsSeparationMode) as [TCompositeWordsSeparationModeEnterprise, ...TCompositeWordsSeparationModeEnterprise[]])

export type TCompositeWordsSeparationMode = keyof typeof CompositeWordsSeparationMode
export type TCompositeWordsSeparationModeEnterprise = `${CompositeWordsSeparationMode}`

enum ConfigurationExtensionApplicationIssueSeverity {
  Critical = "Критичная",
  Low = "Низкая",
  Moderate = "Обычная",
}

export const ZConfigurationExtensionApplicationIssueSeverity = z.enum(Object.keys(ConfigurationExtensionApplicationIssueSeverity) as [TConfigurationExtensionApplicationIssueSeverity, ...TConfigurationExtensionApplicationIssueSeverity[]])
export const ZConfigurationExtensionApplicationIssueSeverityEnterprise = z.enum(Object.values(ConfigurationExtensionApplicationIssueSeverity) as [TConfigurationExtensionApplicationIssueSeverityEnterprise, ...TConfigurationExtensionApplicationIssueSeverityEnterprise[]])

export type TConfigurationExtensionApplicationIssueSeverity = keyof typeof ConfigurationExtensionApplicationIssueSeverity
export type TConfigurationExtensionApplicationIssueSeverityEnterprise = `${ConfigurationExtensionApplicationIssueSeverity}`

enum ConfigurationExtensionScope {
  InfoBase = "ИнформационнаяБаза",
  DataSeparation = "РазделениеДанных",
}

export const ZConfigurationExtensionScope = z.enum(Object.keys(ConfigurationExtensionScope) as [TConfigurationExtensionScope, ...TConfigurationExtensionScope[]])
export const ZConfigurationExtensionScopeEnterprise = z.enum(Object.values(ConfigurationExtensionScope) as [TConfigurationExtensionScopeEnterprise, ...TConfigurationExtensionScopeEnterprise[]])

export type TConfigurationExtensionScope = keyof typeof ConfigurationExtensionScope
export type TConfigurationExtensionScopeEnterprise = `${ConfigurationExtensionScope}`

enum ConfigurationExtensionsSource {
  Database = "БазаДанных",
  SessionApplied = "СеансАктивные",
  SessionDisabled = "СеансОтключенные",
}

export const ZConfigurationExtensionsSource = z.enum(Object.keys(ConfigurationExtensionsSource) as [TConfigurationExtensionsSource, ...TConfigurationExtensionsSource[]])
export const ZConfigurationExtensionsSourceEnterprise = z.enum(Object.values(ConfigurationExtensionsSource) as [TConfigurationExtensionsSourceEnterprise, ...TConfigurationExtensionsSourceEnterprise[]])

export type TConfigurationExtensionsSource = keyof typeof ConfigurationExtensionsSource
export type TConfigurationExtensionsSourceEnterprise = `${ConfigurationExtensionsSource}`

enum DataBaseConfigurationUpdateExecutionInformationItemType {
  Information = "Информация",
  Error = "Ошибка",
  Warning = "Предупреждение",
}

export const ZDataBaseConfigurationUpdateExecutionInformationItemType = z.enum(Object.keys(DataBaseConfigurationUpdateExecutionInformationItemType) as [TDataBaseConfigurationUpdateExecutionInformationItemType, ...TDataBaseConfigurationUpdateExecutionInformationItemType[]])
export const ZDataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise = z.enum(Object.values(DataBaseConfigurationUpdateExecutionInformationItemType) as [TDataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise, ...TDataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise[]])

export type TDataBaseConfigurationUpdateExecutionInformationItemType = keyof typeof DataBaseConfigurationUpdateExecutionInformationItemType
export type TDataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise = `${DataBaseConfigurationUpdateExecutionInformationItemType}`

enum DataBaseConfigurationUpdateState {
  RefreshInProgress = "ВыполняетсяАктуализация",
  ProcessingInProgress = "ВыполняетсяОбработка",
  NotActive = "Неактивно",
}

export const ZDataBaseConfigurationUpdateState = z.enum(Object.keys(DataBaseConfigurationUpdateState) as [TDataBaseConfigurationUpdateState, ...TDataBaseConfigurationUpdateState[]])
export const ZDataBaseConfigurationUpdateStateEnterprise = z.enum(Object.values(DataBaseConfigurationUpdateState) as [TDataBaseConfigurationUpdateStateEnterprise, ...TDataBaseConfigurationUpdateStateEnterprise[]])

export type TDataBaseConfigurationUpdateState = keyof typeof DataBaseConfigurationUpdateState
export type TDataBaseConfigurationUpdateStateEnterprise = `${DataBaseConfigurationUpdateState}`

enum DatabaseTablespacesUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZDatabaseTablespacesUseMode = z.enum(Object.keys(DatabaseTablespacesUseMode) as [TDatabaseTablespacesUseMode, ...TDatabaseTablespacesUseMode[]])
export const ZDatabaseTablespacesUseModeEnterprise = z.enum(Object.values(DatabaseTablespacesUseMode) as [TDatabaseTablespacesUseModeEnterprise, ...TDatabaseTablespacesUseModeEnterprise[]])

export type TDatabaseTablespacesUseMode = keyof typeof DatabaseTablespacesUseMode
export type TDatabaseTablespacesUseModeEnterprise = `${DatabaseTablespacesUseMode}`

enum DateFractions {
  Time = "Время",
  Date = "Дата",
  DateTime = "ДатаВремя",
}

export const ZDateFractions = z.enum(Object.keys(DateFractions) as [TDateFractions, ...TDateFractions[]])
export const ZDateFractionsEnterprise = z.enum(Object.values(DateFractions) as [TDateFractionsEnterprise, ...TDateFractionsEnterprise[]])

export type TDateFractions = keyof typeof DateFractions
export type TDateFractionsEnterprise = `${DateFractions}`

enum DialogReturnCode {
  Yes = "Да",
  No = "Нет",
  OK = "ОК",
  Cancel = "Отмена",
  Retry = "Повторить",
  Abort = "Прервать",
  Ignore = "Пропустить",
  Timeout = "Таймаут",
}

export const ZDialogReturnCode = z.enum(Object.keys(DialogReturnCode) as [TDialogReturnCode, ...TDialogReturnCode[]])
export const ZDialogReturnCodeEnterprise = z.enum(Object.values(DialogReturnCode) as [TDialogReturnCodeEnterprise, ...TDialogReturnCodeEnterprise[]])

export type TDialogReturnCode = keyof typeof DialogReturnCode
export type TDialogReturnCodeEnterprise = `${DialogReturnCode}`

enum DynamicListKeyType {
  Auto = "Авто",
  FieldValue = "ЗначениеПоля",
  RowKey = "КлючСтроки",
  RowNumber = "НомерСтроки",
}

export const ZDynamicListKeyType = z.enum(Object.keys(DynamicListKeyType) as [TDynamicListKeyType, ...TDynamicListKeyType[]])
export const ZDynamicListKeyTypeEnterprise = z.enum(Object.values(DynamicListKeyType) as [TDynamicListKeyTypeEnterprise, ...TDynamicListKeyTypeEnterprise[]])

export type TDynamicListKeyType = keyof typeof DynamicListKeyType
export type TDynamicListKeyTypeEnterprise = `${DynamicListKeyType}`

enum EnterKeyBehaviorType {
  DefaultButton = "КнопкаПоУмолчанию",
  ControlNavigation = "ПереходПоЭлементамФормы",
}

export const ZEnterKeyBehaviorType = z.enum(Object.keys(EnterKeyBehaviorType) as [TEnterKeyBehaviorType, ...TEnterKeyBehaviorType[]])
export const ZEnterKeyBehaviorTypeEnterprise = z.enum(Object.values(EnterKeyBehaviorType) as [TEnterKeyBehaviorTypeEnterprise, ...TEnterKeyBehaviorTypeEnterprise[]])

export type TEnterKeyBehaviorType = keyof typeof EnterKeyBehaviorType
export type TEnterKeyBehaviorTypeEnterprise = `${EnterKeyBehaviorType}`

enum ExternalDataSourceState {
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export const ZExternalDataSourceState = z.enum(Object.keys(ExternalDataSourceState) as [TExternalDataSourceState, ...TExternalDataSourceState[]])
export const ZExternalDataSourceStateEnterprise = z.enum(Object.values(ExternalDataSourceState) as [TExternalDataSourceStateEnterprise, ...TExternalDataSourceStateEnterprise[]])

export type TExternalDataSourceState = keyof typeof ExternalDataSourceState
export type TExternalDataSourceStateEnterprise = `${ExternalDataSourceState}`

enum FillChecking {
  ShowError = "ВыдаватьОшибку",
  DontCheck = "НеПроверять",
}

export const ZFillChecking = z.enum(Object.keys(FillChecking) as [TFillChecking, ...TFillChecking[]])
export const ZFillCheckingEnterprise = z.enum(Object.values(FillChecking) as [TFillCheckingEnterprise, ...TFillCheckingEnterprise[]])

export type TFillChecking = keyof typeof FillChecking
export type TFillCheckingEnterprise = `${FillChecking}`

enum FontType {
  WindowsFont = "WindowsШрифт",
  Absolute = "Абсолютный",
  AutoFont = "АвтоШрифт",
  StyleItem = "ЭлементСтиля",
}

export const ZFontType = z.enum(Object.keys(FontType) as [TFontType, ...TFontType[]])
export const ZFontTypeEnterprise = z.enum(Object.values(FontType) as [TFontTypeEnterprise, ...TFontTypeEnterprise[]])

export type TFontType = keyof typeof FontType
export type TFontTypeEnterprise = `${FontType}`

enum FullTextSearchMetadataUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZFullTextSearchMetadataUse = z.enum(Object.keys(FullTextSearchMetadataUse) as [TFullTextSearchMetadataUse, ...TFullTextSearchMetadataUse[]])
export const ZFullTextSearchMetadataUseEnterprise = z.enum(Object.values(FullTextSearchMetadataUse) as [TFullTextSearchMetadataUseEnterprise, ...TFullTextSearchMetadataUseEnterprise[]])

export type TFullTextSearchMetadataUse = keyof typeof FullTextSearchMetadataUse
export type TFullTextSearchMetadataUseEnterprise = `${FullTextSearchMetadataUse}`

enum FullTextSearchMode {
  Disable = "Запретить",
  Enable = "Разрешить",
}

export const ZFullTextSearchMode = z.enum(Object.keys(FullTextSearchMode) as [TFullTextSearchMode, ...TFullTextSearchMode[]])
export const ZFullTextSearchModeEnterprise = z.enum(Object.values(FullTextSearchMode) as [TFullTextSearchModeEnterprise, ...TFullTextSearchModeEnterprise[]])

export type TFullTextSearchMode = keyof typeof FullTextSearchMode
export type TFullTextSearchModeEnterprise = `${FullTextSearchMode}`

enum FullTextSearchRepresentationType {
  HTMLText = "HTMLТекст",
  XML = "XML",
}

export const ZFullTextSearchRepresentationType = z.enum(Object.keys(FullTextSearchRepresentationType) as [TFullTextSearchRepresentationType, ...TFullTextSearchRepresentationType[]])
export const ZFullTextSearchRepresentationTypeEnterprise = z.enum(Object.values(FullTextSearchRepresentationType) as [TFullTextSearchRepresentationTypeEnterprise, ...TFullTextSearchRepresentationTypeEnterprise[]])

export type TFullTextSearchRepresentationType = keyof typeof FullTextSearchRepresentationType
export type TFullTextSearchRepresentationTypeEnterprise = `${FullTextSearchRepresentationType}`

enum FullTextSearchVersion {
  Version1 = "Версия1",
  Version2 = "Версия2",
}

export const ZFullTextSearchVersion = z.enum(Object.keys(FullTextSearchVersion) as [TFullTextSearchVersion, ...TFullTextSearchVersion[]])
export const ZFullTextSearchVersionEnterprise = z.enum(Object.values(FullTextSearchVersion) as [TFullTextSearchVersionEnterprise, ...TFullTextSearchVersionEnterprise[]])

export type TFullTextSearchVersion = keyof typeof FullTextSearchVersion
export type TFullTextSearchVersionEnterprise = `${FullTextSearchVersion}`

enum HashFunction {
  CRC32 = "CRC32",
  MD5 = "MD5",
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export const ZHashFunction = z.enum(Object.keys(HashFunction) as [THashFunction, ...THashFunction[]])
export const ZHashFunctionEnterprise = z.enum(Object.values(HashFunction) as [THashFunctionEnterprise, ...THashFunctionEnterprise[]])

export type THashFunction = keyof typeof HashFunction
export type THashFunctionEnterprise = `${HashFunction}`

enum InterfaceCompatibilityMode {
  Version8_2 = "Версия8_2",
  Version8_2EnableTaxi = "Версия8_2РазрешитьТакси",
  Taxi = "Такси",
  TaxiEnableVersion8_2 = "ТаксиРазрешитьВерсия8_2",
}

export const ZInterfaceCompatibilityMode = z.enum(Object.keys(InterfaceCompatibilityMode) as [TInterfaceCompatibilityMode, ...TInterfaceCompatibilityMode[]])
export const ZInterfaceCompatibilityModeEnterprise = z.enum(Object.values(InterfaceCompatibilityMode) as [TInterfaceCompatibilityModeEnterprise, ...TInterfaceCompatibilityModeEnterprise[]])

export type TInterfaceCompatibilityMode = keyof typeof InterfaceCompatibilityMode
export type TInterfaceCompatibilityModeEnterprise = `${InterfaceCompatibilityMode}`

enum IntervalBoundVariant {
  WithoutRestriction = "БезОграничения",
  Year = "Год",
  Quarter = "Квартал",
  SpecificDate = "КонкретнаяДата",
  Month = "Месяц",
  Week = "Неделя",
  WorkingDate = "РабочаяДата",
  BeforeAfter = "Смещение",
}

export const ZIntervalBoundVariant = z.enum(Object.keys(IntervalBoundVariant) as [TIntervalBoundVariant, ...TIntervalBoundVariant[]])
export const ZIntervalBoundVariantEnterprise = z.enum(Object.values(IntervalBoundVariant) as [TIntervalBoundVariantEnterprise, ...TIntervalBoundVariantEnterprise[]])

export type TIntervalBoundVariant = keyof typeof IntervalBoundVariant
export type TIntervalBoundVariantEnterprise = `${IntervalBoundVariant}`

enum Key {
  BackSpace = "BackSpace",
  Break = "Break",
  NumAdd = "NumAdd",
  NumDecimal = "NumDecimal",
  NumDivide = "NumDivide",
  NumMultiply = "NumMultiply",
  NumSubtract = "NumSubtract",
  Space = "Space",
  None = "Нет",
}

export const ZKey = z.enum(Object.keys(Key) as [TKey, ...TKey[]])
export const ZKeyEnterprise = z.enum(Object.values(Key) as [TKeyEnterprise, ...TKeyEnterprise[]])

export type TKey = keyof typeof Key
export type TKeyEnterprise = `${Key}`

enum LocationRelativeToGeofence {
  Inside = "Внутри",
  Outside = "Снаружи",
}

export const ZLocationRelativeToGeofence = z.enum(Object.keys(LocationRelativeToGeofence) as [TLocationRelativeToGeofence, ...TLocationRelativeToGeofence[]])
export const ZLocationRelativeToGeofenceEnterprise = z.enum(Object.values(LocationRelativeToGeofence) as [TLocationRelativeToGeofenceEnterprise, ...TLocationRelativeToGeofenceEnterprise[]])

export type TLocationRelativeToGeofence = keyof typeof LocationRelativeToGeofence
export type TLocationRelativeToGeofenceEnterprise = `${LocationRelativeToGeofence}`

enum MessageStatus {
  WithoutStatus = "БезСтатуса",
  Important = "Важное",
  Attention = "Внимание",
  Information = "Информация",
  Ordinary = "Обычное",
  VeryImportant = "ОченьВажное",
}

export const ZMessageStatus = z.enum(Object.keys(MessageStatus) as [TMessageStatus, ...TMessageStatus[]])
export const ZMessageStatusEnterprise = z.enum(Object.values(MessageStatus) as [TMessageStatusEnterprise, ...TMessageStatusEnterprise[]])

export type TMessageStatus = keyof typeof MessageStatus
export type TMessageStatusEnterprise = `${MessageStatus}`

enum MobileApplicationFunctionalities {
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

export const ZMobileApplicationFunctionalities = z.enum(Object.keys(MobileApplicationFunctionalities) as [TMobileApplicationFunctionalities, ...TMobileApplicationFunctionalities[]])
export const ZMobileApplicationFunctionalitiesEnterprise = z.enum(Object.values(MobileApplicationFunctionalities) as [TMobileApplicationFunctionalitiesEnterprise, ...TMobileApplicationFunctionalitiesEnterprise[]])

export type TMobileApplicationFunctionalities = keyof typeof MobileApplicationFunctionalities
export type TMobileApplicationFunctionalitiesEnterprise = `${MobileApplicationFunctionalities}`

enum NumericValueType {
  Cardinal = "Количественное",
  Ordinal = "Порядковое",
}

export const ZNumericValueType = z.enum(Object.keys(NumericValueType) as [TNumericValueType, ...TNumericValueType[]])
export const ZNumericValueTypeEnterprise = z.enum(Object.values(NumericValueType) as [TNumericValueTypeEnterprise, ...TNumericValueTypeEnterprise[]])

export type TNumericValueType = keyof typeof NumericValueType
export type TNumericValueTypeEnterprise = `${NumericValueType}`

enum PasswordPolicyComplianceCheckResult {
  DoesNotSatisfyMinLengthRequirements = "НеСоответствуетТребованиямМинимальнойДлины",
  DoesNotSatisfyReuseLimitRequirements = "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних",
  DoesNotSatisfyCompromiseCheckRequirements = "НеСоответствуетТребованиямПроверкиРаскрытия",
  DoesNotSatisfyComplexityRequirements = "НеСоответствуетТребованиямСложности",
}

export const ZPasswordPolicyComplianceCheckResult = z.enum(Object.keys(PasswordPolicyComplianceCheckResult) as [TPasswordPolicyComplianceCheckResult, ...TPasswordPolicyComplianceCheckResult[]])
export const ZPasswordPolicyComplianceCheckResultEnterprise = z.enum(Object.values(PasswordPolicyComplianceCheckResult) as [TPasswordPolicyComplianceCheckResultEnterprise, ...TPasswordPolicyComplianceCheckResultEnterprise[]])

export type TPasswordPolicyComplianceCheckResult = keyof typeof PasswordPolicyComplianceCheckResult
export type TPasswordPolicyComplianceCheckResultEnterprise = `${PasswordPolicyComplianceCheckResult}`

enum PeriodSettingsVariant {
  Interval = "Интервал",
  Period = "Период",
}

export const ZPeriodSettingsVariant = z.enum(Object.keys(PeriodSettingsVariant) as [TPeriodSettingsVariant, ...TPeriodSettingsVariant[]])
export const ZPeriodSettingsVariantEnterprise = z.enum(Object.values(PeriodSettingsVariant) as [TPeriodSettingsVariantEnterprise, ...TPeriodSettingsVariantEnterprise[]])

export type TPeriodSettingsVariant = keyof typeof PeriodSettingsVariant
export type TPeriodSettingsVariantEnterprise = `${PeriodSettingsVariant}`

enum PeriodVariant {
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

export const ZPeriodVariant = z.enum(Object.keys(PeriodVariant) as [TPeriodVariant, ...TPeriodVariant[]])
export const ZPeriodVariantEnterprise = z.enum(Object.values(PeriodVariant) as [TPeriodVariantEnterprise, ...TPeriodVariantEnterprise[]])

export type TPeriodVariant = keyof typeof PeriodVariant
export type TPeriodVariantEnterprise = `${PeriodVariant}`

enum PictureType {
  Absolute = "Абсолютная",
  FromLib = "ИзБиблиотеки",
  Empty = "Пустая",
}

export const ZPictureType = z.enum(Object.keys(PictureType) as [TPictureType, ...TPictureType[]])
export const ZPictureTypeEnterprise = z.enum(Object.values(PictureType) as [TPictureTypeEnterprise, ...TPictureTypeEnterprise[]])

export type TPictureType = keyof typeof PictureType
export type TPictureTypeEnterprise = `${PictureType}`

enum PlatformType {
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

export const ZPlatformType = z.enum(Object.keys(PlatformType) as [TPlatformType, ...TPlatformType[]])
export const ZPlatformTypeEnterprise = z.enum(Object.values(PlatformType) as [TPlatformTypeEnterprise, ...TPlatformTypeEnterprise[]])

export type TPlatformType = keyof typeof PlatformType
export type TPlatformTypeEnterprise = `${PlatformType}`

enum QuestionDialogMode {
  YesNo = "ДаНет",
  YesNoCancel = "ДаНетОтмена",
  OK = "ОК",
  OKCancel = "ОКОтмена",
  RetryCancel = "ПовторитьОтмена",
  AbortRetryIgnore = "ПрерватьПовторитьПропустить",
}

export const ZQuestionDialogMode = z.enum(Object.keys(QuestionDialogMode) as [TQuestionDialogMode, ...TQuestionDialogMode[]])
export const ZQuestionDialogModeEnterprise = z.enum(Object.values(QuestionDialogMode) as [TQuestionDialogModeEnterprise, ...TQuestionDialogModeEnterprise[]])

export type TQuestionDialogMode = keyof typeof QuestionDialogMode
export type TQuestionDialogModeEnterprise = `${QuestionDialogMode}`

enum ReplacementMode {
  Append = "Добавление",
  Replace = "Замещение",
  Update = "Обновление",
  Merge = "Слияние",
  Delete = "Удаление",
}

export const ZReplacementMode = z.enum(Object.keys(ReplacementMode) as [TReplacementMode, ...TReplacementMode[]])
export const ZReplacementModeEnterprise = z.enum(Object.values(ReplacementMode) as [TReplacementModeEnterprise, ...TReplacementModeEnterprise[]])

export type TReplacementMode = keyof typeof ReplacementMode
export type TReplacementModeEnterprise = `${ReplacementMode}`

enum RoundMode {
  Round15as10 = "Окр15как10",
  Round15as20 = "Окр15как20",
}

export const ZRoundMode = z.enum(Object.keys(RoundMode) as [TRoundMode, ...TRoundMode[]])
export const ZRoundModeEnterprise = z.enum(Object.values(RoundMode) as [TRoundModeEnterprise, ...TRoundModeEnterprise[]])

export type TRoundMode = keyof typeof RoundMode
export type TRoundModeEnterprise = `${RoundMode}`

enum SearchDirection {
  FromEnd = "СКонца",
  FromBegin = "СНачала",
}

export const ZSearchDirection = z.enum(Object.keys(SearchDirection) as [TSearchDirection, ...TSearchDirection[]])
export const ZSearchDirectionEnterprise = z.enum(Object.values(SearchDirection) as [TSearchDirectionEnterprise, ...TSearchDirectionEnterprise[]])

export type TSearchDirection = keyof typeof SearchDirection
export type TSearchDirectionEnterprise = `${SearchDirection}`

enum SectionsPanelRepresentation {
  Picture = "Картинка",
  PictureAndText = "КартинкаИТекст",
  PictureOnTopAndText = "КартинкаСверхуИТекст",
  PictureOnLeftAndText = "КартинкаСлеваИТекст",
  Text = "Текст",
}

export const ZSectionsPanelRepresentation = z.enum(Object.keys(SectionsPanelRepresentation) as [TSectionsPanelRepresentation, ...TSectionsPanelRepresentation[]])
export const ZSectionsPanelRepresentationEnterprise = z.enum(Object.values(SectionsPanelRepresentation) as [TSectionsPanelRepresentationEnterprise, ...TSectionsPanelRepresentationEnterprise[]])

export type TSectionsPanelRepresentation = keyof typeof SectionsPanelRepresentation
export type TSectionsPanelRepresentationEnterprise = `${SectionsPanelRepresentation}`

enum SortDirection {
  Asc = "Возр",
  Desc = "Убыв",
}

export const ZSortDirection = z.enum(Object.keys(SortDirection) as [TSortDirection, ...TSortDirection[]])
export const ZSortDirectionEnterprise = z.enum(Object.values(SortDirection) as [TSortDirectionEnterprise, ...TSortDirectionEnterprise[]])

export type TSortDirection = keyof typeof SortDirection
export type TSortDirectionEnterprise = `${SortDirection}`

enum StandardBeginningDateVariant {
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

export const ZStandardBeginningDateVariant = z.enum(Object.keys(StandardBeginningDateVariant) as [TStandardBeginningDateVariant, ...TStandardBeginningDateVariant[]])
export const ZStandardBeginningDateVariantEnterprise = z.enum(Object.values(StandardBeginningDateVariant) as [TStandardBeginningDateVariantEnterprise, ...TStandardBeginningDateVariantEnterprise[]])

export type TStandardBeginningDateVariant = keyof typeof StandardBeginningDateVariant
export type TStandardBeginningDateVariantEnterprise = `${StandardBeginningDateVariant}`

enum StandardGlobalSearchType {
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

export const ZStandardGlobalSearchType = z.enum(Object.keys(StandardGlobalSearchType) as [TStandardGlobalSearchType, ...TStandardGlobalSearchType[]])
export const ZStandardGlobalSearchTypeEnterprise = z.enum(Object.values(StandardGlobalSearchType) as [TStandardGlobalSearchTypeEnterprise, ...TStandardGlobalSearchTypeEnterprise[]])

export type TStandardGlobalSearchType = keyof typeof StandardGlobalSearchType
export type TStandardGlobalSearchTypeEnterprise = `${StandardGlobalSearchType}`

enum StandardPeriodVariant {
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

export const ZStandardPeriodVariant = z.enum(Object.keys(StandardPeriodVariant) as [TStandardPeriodVariant, ...TStandardPeriodVariant[]])
export const ZStandardPeriodVariantEnterprise = z.enum(Object.values(StandardPeriodVariant) as [TStandardPeriodVariantEnterprise, ...TStandardPeriodVariantEnterprise[]])

export type TStandardPeriodVariant = keyof typeof StandardPeriodVariant
export type TStandardPeriodVariantEnterprise = `${StandardPeriodVariant}`

enum StringEncodingMethod {
  URLInURLEncoding = "URLВКодировкеURL",
  URLEncoding = "КодировкаURL",
}

export const ZStringEncodingMethod = z.enum(Object.keys(StringEncodingMethod) as [TStringEncodingMethod, ...TStringEncodingMethod[]])
export const ZStringEncodingMethodEnterprise = z.enum(Object.values(StringEncodingMethod) as [TStringEncodingMethodEnterprise, ...TStringEncodingMethodEnterprise[]])

export type TStringEncodingMethod = keyof typeof StringEncodingMethod
export type TStringEncodingMethodEnterprise = `${StringEncodingMethod}`

enum TextEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
  UTF16 = "UTF16",
  UTF8 = "UTF8",
  System = "Системная",
}

export const ZTextEncoding = z.enum(Object.keys(TextEncoding) as [TTextEncoding, ...TTextEncoding[]])
export const ZTextEncodingEnterprise = z.enum(Object.values(TextEncoding) as [TTextEncodingEnterprise, ...TTextEncodingEnterprise[]])

export type TTextEncoding = keyof typeof TextEncoding
export type TTextEncodingEnterprise = `${TextEncoding}`

enum TransactionsIsolationLevel {
  Auto = "Авто",
  RepeatableRead = "ПовторяемоеЧтение",
  Serializable = "Упорядочиваемость",
  ReadCommitted = "ЧтениеЗафиксированных",
  ReadUncommitted = "ЧтениеНезафиксированных",
}

export const ZTransactionsIsolationLevel = z.enum(Object.keys(TransactionsIsolationLevel) as [TTransactionsIsolationLevel, ...TTransactionsIsolationLevel[]])
export const ZTransactionsIsolationLevelEnterprise = z.enum(Object.values(TransactionsIsolationLevel) as [TTransactionsIsolationLevelEnterprise, ...TTransactionsIsolationLevelEnterprise[]])

export type TTransactionsIsolationLevel = keyof typeof TransactionsIsolationLevel
export type TTransactionsIsolationLevelEnterprise = `${TransactionsIsolationLevel}`

enum UpdateOnDataChange {
  Auto = "Авто",
  DontUpdate = "НеОбновлять",
}

export const ZUpdateOnDataChange = z.enum(Object.keys(UpdateOnDataChange) as [TUpdateOnDataChange, ...TUpdateOnDataChange[]])
export const ZUpdateOnDataChangeEnterprise = z.enum(Object.values(UpdateOnDataChange) as [TUpdateOnDataChangeEnterprise, ...TUpdateOnDataChangeEnterprise[]])

export type TUpdateOnDataChange = keyof typeof UpdateOnDataChange
export type TUpdateOnDataChangeEnterprise = `${UpdateOnDataChange}`

enum UserPasswordHashAlgorithmType {
  PBKDF2SHA256 = "PBKDF2SHA256",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export const ZUserPasswordHashAlgorithmType = z.enum(Object.keys(UserPasswordHashAlgorithmType) as [TUserPasswordHashAlgorithmType, ...TUserPasswordHashAlgorithmType[]])
export const ZUserPasswordHashAlgorithmTypeEnterprise = z.enum(Object.values(UserPasswordHashAlgorithmType) as [TUserPasswordHashAlgorithmTypeEnterprise, ...TUserPasswordHashAlgorithmTypeEnterprise[]])

export type TUserPasswordHashAlgorithmType = keyof typeof UserPasswordHashAlgorithmType
export type TUserPasswordHashAlgorithmTypeEnterprise = `${UserPasswordHashAlgorithmType}`

enum UUIDVersion {
  Version1 = "Версия1",
  Version3 = "Версия3",
  Version4 = "Версия4",
  Version5 = "Версия5",
}

export const ZUUIDVersion = z.enum(Object.keys(UUIDVersion) as [TUUIDVersion, ...TUUIDVersion[]])
export const ZUUIDVersionEnterprise = z.enum(Object.values(UUIDVersion) as [TUUIDVersionEnterprise, ...TUUIDVersionEnterprise[]])

export type TUUIDVersion = keyof typeof UUIDVersion
export type TUUIDVersionEnterprise = `${UUIDVersion}`

enum WorkingDateMode {
  UseCurrentDate = "ИспользоватьТекущуюДату",
  Assign = "Назначать",
}

export const ZWorkingDateMode = z.enum(Object.keys(WorkingDateMode) as [TWorkingDateMode, ...TWorkingDateMode[]])
export const ZWorkingDateModeEnterprise = z.enum(Object.values(WorkingDateMode) as [TWorkingDateModeEnterprise, ...TWorkingDateModeEnterprise[]])

export type TWorkingDateMode = keyof typeof WorkingDateMode
export type TWorkingDateModeEnterprise = `${WorkingDateMode}`

enum XBaseEncoding {
  ANSI = "ANSI",
  OEM = "OEM",
}

export const ZXBaseEncoding = z.enum(Object.keys(XBaseEncoding) as [TXBaseEncoding, ...TXBaseEncoding[]])
export const ZXBaseEncodingEnterprise = z.enum(Object.values(XBaseEncoding) as [TXBaseEncodingEnterprise, ...TXBaseEncodingEnterprise[]])

export type TXBaseEncoding = keyof typeof XBaseEncoding
export type TXBaseEncodingEnterprise = `${XBaseEncoding}`

enum CalendarEventRecurrence {
  Weekly = "КаждуюНеделю",
  Yearly = "КаждыйГод",
  Daily = "КаждыйДень",
  Monthly = "КаждыйМесяц",
  Once = "ОдинРаз",
}

export const ZCalendarEventRecurrence = z.enum(Object.keys(CalendarEventRecurrence) as [TCalendarEventRecurrence, ...TCalendarEventRecurrence[]])
export const ZCalendarEventRecurrenceEnterprise = z.enum(Object.values(CalendarEventRecurrence) as [TCalendarEventRecurrenceEnterprise, ...TCalendarEventRecurrenceEnterprise[]])

export type TCalendarEventRecurrence = keyof typeof CalendarEventRecurrence
export type TCalendarEventRecurrenceEnterprise = `${CalendarEventRecurrence}`

enum ContactDataAddressType {
  Home = "Домашний",
  Other = "Другой",
  Work = "Рабочий",
}

export const ZContactDataAddressType = z.enum(Object.keys(ContactDataAddressType) as [TContactDataAddressType, ...TContactDataAddressType[]])
export const ZContactDataAddressTypeEnterprise = z.enum(Object.values(ContactDataAddressType) as [TContactDataAddressTypeEnterprise, ...TContactDataAddressTypeEnterprise[]])

export type TContactDataAddressType = keyof typeof ContactDataAddressType
export type TContactDataAddressTypeEnterprise = `${ContactDataAddressType}`

enum ContactDataEmailAddressType {
  Home = "Домашний",
  Other = "Другой",
  Mobile = "Мобильный",
  Work = "Рабочий",
}

export const ZContactDataEmailAddressType = z.enum(Object.keys(ContactDataEmailAddressType) as [TContactDataEmailAddressType, ...TContactDataEmailAddressType[]])
export const ZContactDataEmailAddressTypeEnterprise = z.enum(Object.values(ContactDataEmailAddressType) as [TContactDataEmailAddressTypeEnterprise, ...TContactDataEmailAddressTypeEnterprise[]])

export type TContactDataEmailAddressType = keyof typeof ContactDataEmailAddressType
export type TContactDataEmailAddressTypeEnterprise = `${ContactDataEmailAddressType}`

enum ContactDataInstantMessagingAddressType {
  Home = "Домашний",
  Other = "Другой",
  Work = "Рабочий",
}

export const ZContactDataInstantMessagingAddressType = z.enum(Object.keys(ContactDataInstantMessagingAddressType) as [TContactDataInstantMessagingAddressType, ...TContactDataInstantMessagingAddressType[]])
export const ZContactDataInstantMessagingAddressTypeEnterprise = z.enum(Object.values(ContactDataInstantMessagingAddressType) as [TContactDataInstantMessagingAddressTypeEnterprise, ...TContactDataInstantMessagingAddressTypeEnterprise[]])

export type TContactDataInstantMessagingAddressType = keyof typeof ContactDataInstantMessagingAddressType
export type TContactDataInstantMessagingAddressTypeEnterprise = `${ContactDataInstantMessagingAddressType}`

enum ContactDataPhoneNumberType {
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

export const ZContactDataPhoneNumberType = z.enum(Object.keys(ContactDataPhoneNumberType) as [TContactDataPhoneNumberType, ...TContactDataPhoneNumberType[]])
export const ZContactDataPhoneNumberTypeEnterprise = z.enum(Object.values(ContactDataPhoneNumberType) as [TContactDataPhoneNumberTypeEnterprise, ...TContactDataPhoneNumberTypeEnterprise[]])

export type TContactDataPhoneNumberType = keyof typeof ContactDataPhoneNumberType
export type TContactDataPhoneNumberTypeEnterprise = `${ContactDataPhoneNumberType}`

enum ContactDataRelationshipType {
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

export const ZContactDataRelationshipType = z.enum(Object.keys(ContactDataRelationshipType) as [TContactDataRelationshipType, ...TContactDataRelationshipType[]])
export const ZContactDataRelationshipTypeEnterprise = z.enum(Object.values(ContactDataRelationshipType) as [TContactDataRelationshipTypeEnterprise, ...TContactDataRelationshipTypeEnterprise[]])

export type TContactDataRelationshipType = keyof typeof ContactDataRelationshipType
export type TContactDataRelationshipTypeEnterprise = `${ContactDataRelationshipType}`

enum ContactDataURLType {
  FTP = "FTP",
  Blog = "Блог",
  Home = "Домашний",
  HomePage = "ДомашняяСтраница",
  Other = "Другой",
  Profile = "Профиль",
  Work = "Рабочий",
}

export const ZContactDataURLType = z.enum(Object.keys(ContactDataURLType) as [TContactDataURLType, ...TContactDataURLType[]])
export const ZContactDataURLTypeEnterprise = z.enum(Object.values(ContactDataURLType) as [TContactDataURLTypeEnterprise, ...TContactDataURLTypeEnterprise[]])

export type TContactDataURLType = keyof typeof ContactDataURLType
export type TContactDataURLTypeEnterprise = `${ContactDataURLType}`

enum CallLogCallType {
  Incoming = "Входящий",
  Outgoing = "Исходящий",
  Missed = "Пропущенный",
}

export const ZCallLogCallType = z.enum(Object.keys(CallLogCallType) as [TCallLogCallType, ...TCallLogCallType[]])
export const ZCallLogCallTypeEnterprise = z.enum(Object.values(CallLogCallType) as [TCallLogCallTypeEnterprise, ...TCallLogCallTypeEnterprise[]])

export type TCallLogCallType = keyof typeof CallLogCallType
export type TCallLogCallTypeEnterprise = `${CallLogCallType}`

enum TelephonyToolsCallEventVariant {
  EndIncoming = "ЗавершениеВходящего",
  EndOutgoing = "ЗавершениеИсходящего",
  StartIncoming = "НачалоВходящего",
  StartOutgoing = "НачалоИсходящего",
  StartIncomingRinging = "НачалоСигналаВходящего",
}

export const ZTelephonyToolsCallEventVariant = z.enum(Object.keys(TelephonyToolsCallEventVariant) as [TTelephonyToolsCallEventVariant, ...TTelephonyToolsCallEventVariant[]])
export const ZTelephonyToolsCallEventVariantEnterprise = z.enum(Object.values(TelephonyToolsCallEventVariant) as [TTelephonyToolsCallEventVariantEnterprise, ...TTelephonyToolsCallEventVariantEnterprise[]])

export type TTelephonyToolsCallEventVariant = keyof typeof TelephonyToolsCallEventVariant
export type TTelephonyToolsCallEventVariantEnterprise = `${TelephonyToolsCallEventVariant}`

enum TelephonyToolsSMSType {
  Queued = "ВОчереди",
  Incoming = "Входящее",
  Outgoing = "Исходящее",
  Sent = "Отправленное",
  Failed = "ОшибкаОтправки",
  Draft = "Черновик",
}

export const ZTelephonyToolsSMSType = z.enum(Object.keys(TelephonyToolsSMSType) as [TTelephonyToolsSMSType, ...TTelephonyToolsSMSType[]])
export const ZTelephonyToolsSMSTypeEnterprise = z.enum(Object.values(TelephonyToolsSMSType) as [TTelephonyToolsSMSTypeEnterprise, ...TTelephonyToolsSMSTypeEnterprise[]])

export type TTelephonyToolsSMSType = keyof typeof TelephonyToolsSMSType
export type TTelephonyToolsSMSTypeEnterprise = `${TelephonyToolsSMSType}`

enum AudioRecordingChannelUse {
  Mono = "Моно",
  Stereo = "Стерео",
}

export const ZAudioRecordingChannelUse = z.enum(Object.keys(AudioRecordingChannelUse) as [TAudioRecordingChannelUse, ...TAudioRecordingChannelUse[]])
export const ZAudioRecordingChannelUseEnterprise = z.enum(Object.values(AudioRecordingChannelUse) as [TAudioRecordingChannelUseEnterprise, ...TAudioRecordingChannelUseEnterprise[]])

export type TAudioRecordingChannelUse = keyof typeof AudioRecordingChannelUse
export type TAudioRecordingChannelUseEnterprise = `${AudioRecordingChannelUse}`

enum AudioRecordingFormat {
  Mpeg4AAC = "Mpeg4AAC",
  WavPCM16bit = "WavPCM16bit",
}

export const ZAudioRecordingFormat = z.enum(Object.keys(AudioRecordingFormat) as [TAudioRecordingFormat, ...TAudioRecordingFormat[]])
export const ZAudioRecordingFormatEnterprise = z.enum(Object.values(AudioRecordingFormat) as [TAudioRecordingFormatEnterprise, ...TAudioRecordingFormatEnterprise[]])

export type TAudioRecordingFormat = keyof typeof AudioRecordingFormat
export type TAudioRecordingFormatEnterprise = `${AudioRecordingFormat}`

enum BarcodeType {
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

export const ZBarcodeType = z.enum(Object.keys(BarcodeType) as [TBarcodeType, ...TBarcodeType[]])
export const ZBarcodeTypeEnterprise = z.enum(Object.values(BarcodeType) as [TBarcodeTypeEnterprise, ...TBarcodeTypeEnterprise[]])

export type TBarcodeType = keyof typeof BarcodeType
export type TBarcodeTypeEnterprise = `${BarcodeType}`

enum CameraLightingType {
  Auto = "Авто",
  Enable = "Включена",
  Disable = "Выключена",
}

export const ZCameraLightingType = z.enum(Object.keys(CameraLightingType) as [TCameraLightingType, ...TCameraLightingType[]])
export const ZCameraLightingTypeEnterprise = z.enum(Object.values(CameraLightingType) as [TCameraLightingTypeEnterprise, ...TCameraLightingTypeEnterprise[]])

export type TCameraLightingType = keyof typeof CameraLightingType
export type TCameraLightingTypeEnterprise = `${CameraLightingType}`

enum DeviceCameraType {
  Auto = "Авто",
  Rear = "Задняя",
  Front = "Передняя",
}

export const ZDeviceCameraType = z.enum(Object.keys(DeviceCameraType) as [TDeviceCameraType, ...TDeviceCameraType[]])
export const ZDeviceCameraTypeEnterprise = z.enum(Object.values(DeviceCameraType) as [TDeviceCameraTypeEnterprise, ...TDeviceCameraTypeEnterprise[]])

export type TDeviceCameraType = keyof typeof DeviceCameraType
export type TDeviceCameraTypeEnterprise = `${DeviceCameraType}`

enum DocumentScanningCheckingQuality {
  DontCheck = "НеПроверять",
  WarnBelowHigh = "ПредупреждатьНижеВысокого",
  WarnBelowMedium = "ПредупреждатьНижеСреднего",
  RequireHigh = "ТребоватьВысокое",
  RequireMediumWarnBelowHigh = "ТребоватьСреднееПредупреждатьНижеВысокого",
}

export const ZDocumentScanningCheckingQuality = z.enum(Object.keys(DocumentScanningCheckingQuality) as [TDocumentScanningCheckingQuality, ...TDocumentScanningCheckingQuality[]])
export const ZDocumentScanningCheckingQualityEnterprise = z.enum(Object.values(DocumentScanningCheckingQuality) as [TDocumentScanningCheckingQualityEnterprise, ...TDocumentScanningCheckingQualityEnterprise[]])

export type TDocumentScanningCheckingQuality = keyof typeof DocumentScanningCheckingQuality
export type TDocumentScanningCheckingQualityEnterprise = `${DocumentScanningCheckingQuality}`

enum DocumentScanningOrientationDetectionMode {
  Landscape = "Ландшафт",
  ByHorizontalTextLines = "ПоГоризонтальнымСтрокамТекста",
  ByFirstPageInSeries = "ПоПервойСтраницеСерии",
  ByDocumentPosition = "ПоРасположениюДокумента",
  Portrait = "Портрет",
}

export const ZDocumentScanningOrientationDetectionMode = z.enum(Object.keys(DocumentScanningOrientationDetectionMode) as [TDocumentScanningOrientationDetectionMode, ...TDocumentScanningOrientationDetectionMode[]])
export const ZDocumentScanningOrientationDetectionModeEnterprise = z.enum(Object.values(DocumentScanningOrientationDetectionMode) as [TDocumentScanningOrientationDetectionModeEnterprise, ...TDocumentScanningOrientationDetectionModeEnterprise[]])

export type TDocumentScanningOrientationDetectionMode = keyof typeof DocumentScanningOrientationDetectionMode
export type TDocumentScanningOrientationDetectionModeEnterprise = `${DocumentScanningOrientationDetectionMode}`

enum DocumentScanningProcessingFilter {
  None = "Нет",
  Text = "Текст",
  TextWithPictures = "ТекстСКартинками",
}

export const ZDocumentScanningProcessingFilter = z.enum(Object.keys(DocumentScanningProcessingFilter) as [TDocumentScanningProcessingFilter, ...TDocumentScanningProcessingFilter[]])
export const ZDocumentScanningProcessingFilterEnterprise = z.enum(Object.values(DocumentScanningProcessingFilter) as [TDocumentScanningProcessingFilterEnterprise, ...TDocumentScanningProcessingFilterEnterprise[]])

export type TDocumentScanningProcessingFilter = keyof typeof DocumentScanningProcessingFilter
export type TDocumentScanningProcessingFilterEnterprise = `${DocumentScanningProcessingFilter}`

enum MultimediaRecordingStopButtonPlacement {
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

export const ZMultimediaRecordingStopButtonPlacement = z.enum(Object.keys(MultimediaRecordingStopButtonPlacement) as [TMultimediaRecordingStopButtonPlacement, ...TMultimediaRecordingStopButtonPlacement[]])
export const ZMultimediaRecordingStopButtonPlacementEnterprise = z.enum(Object.values(MultimediaRecordingStopButtonPlacement) as [TMultimediaRecordingStopButtonPlacementEnterprise, ...TMultimediaRecordingStopButtonPlacementEnterprise[]])

export type TMultimediaRecordingStopButtonPlacement = keyof typeof MultimediaRecordingStopButtonPlacement
export type TMultimediaRecordingStopButtonPlacementEnterprise = `${MultimediaRecordingStopButtonPlacement}`

enum VideoQuality {
  Auto = "Авто",
  High = "Высокое",
  Low = "Низкое",
}

export const ZVideoQuality = z.enum(Object.keys(VideoQuality) as [TVideoQuality, ...TVideoQuality[]])
export const ZVideoQualityEnterprise = z.enum(Object.values(VideoQuality) as [TVideoQualityEnterprise, ...TVideoQualityEnterprise[]])

export type TVideoQuality = keyof typeof VideoQuality
export type TVideoQualityEnterprise = `${VideoQuality}`

enum QuerySchemaAvailableTableParameterType {
  Variant = "Вариант",
  Value = "Значение",
  Array = "Массив",
  Order = "Порядок",
  FieldList = "СписокПолей",
  Where = "Условие",
}

export const ZQuerySchemaAvailableTableParameterType = z.enum(Object.keys(QuerySchemaAvailableTableParameterType) as [TQuerySchemaAvailableTableParameterType, ...TQuerySchemaAvailableTableParameterType[]])
export const ZQuerySchemaAvailableTableParameterTypeEnterprise = z.enum(Object.values(QuerySchemaAvailableTableParameterType) as [TQuerySchemaAvailableTableParameterTypeEnterprise, ...TQuerySchemaAvailableTableParameterTypeEnterprise[]])

export type TQuerySchemaAvailableTableParameterType = keyof typeof QuerySchemaAvailableTableParameterType
export type TQuerySchemaAvailableTableParameterTypeEnterprise = `${QuerySchemaAvailableTableParameterType}`

enum QuerySchemaJoinType {
  Inner = "Внутреннее",
  LeftOuter = "ЛевоеВнешнее",
  FullOuter = "ПолноеВнешнее",
  RightOuter = "ПравоеВнешнее",
}

export const ZQuerySchemaJoinType = z.enum(Object.keys(QuerySchemaJoinType) as [TQuerySchemaJoinType, ...TQuerySchemaJoinType[]])
export const ZQuerySchemaJoinTypeEnterprise = z.enum(Object.values(QuerySchemaJoinType) as [TQuerySchemaJoinTypeEnterprise, ...TQuerySchemaJoinTypeEnterprise[]])

export type TQuerySchemaJoinType = keyof typeof QuerySchemaJoinType
export type TQuerySchemaJoinTypeEnterprise = `${QuerySchemaJoinType}`

enum QuerySchemaOrderDirection {
  Ascending = "ПоВозрастанию",
  HierarchyAscending = "ПоВозрастаниюИерархии",
  Descending = "ПоУбыванию",
  HierarchyDescending = "ПоУбываниюИерархии",
}

export const ZQuerySchemaOrderDirection = z.enum(Object.keys(QuerySchemaOrderDirection) as [TQuerySchemaOrderDirection, ...TQuerySchemaOrderDirection[]])
export const ZQuerySchemaOrderDirectionEnterprise = z.enum(Object.values(QuerySchemaOrderDirection) as [TQuerySchemaOrderDirectionEnterprise, ...TQuerySchemaOrderDirectionEnterprise[]])

export type TQuerySchemaOrderDirection = keyof typeof QuerySchemaOrderDirection
export type TQuerySchemaOrderDirectionEnterprise = `${QuerySchemaOrderDirection}`

enum QuerySchemaPeriodAdditionType {
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

export const ZQuerySchemaPeriodAdditionType = z.enum(Object.keys(QuerySchemaPeriodAdditionType) as [TQuerySchemaPeriodAdditionType, ...TQuerySchemaPeriodAdditionType[]])
export const ZQuerySchemaPeriodAdditionTypeEnterprise = z.enum(Object.values(QuerySchemaPeriodAdditionType) as [TQuerySchemaPeriodAdditionTypeEnterprise, ...TQuerySchemaPeriodAdditionTypeEnterprise[]])

export type TQuerySchemaPeriodAdditionType = keyof typeof QuerySchemaPeriodAdditionType
export type TQuerySchemaPeriodAdditionTypeEnterprise = `${QuerySchemaPeriodAdditionType}`

enum QuerySchemaTotalCalculationFieldType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export const ZQuerySchemaTotalCalculationFieldType = z.enum(Object.keys(QuerySchemaTotalCalculationFieldType) as [TQuerySchemaTotalCalculationFieldType, ...TQuerySchemaTotalCalculationFieldType[]])
export const ZQuerySchemaTotalCalculationFieldTypeEnterprise = z.enum(Object.values(QuerySchemaTotalCalculationFieldType) as [TQuerySchemaTotalCalculationFieldTypeEnterprise, ...TQuerySchemaTotalCalculationFieldTypeEnterprise[]])

export type TQuerySchemaTotalCalculationFieldType = keyof typeof QuerySchemaTotalCalculationFieldType
export type TQuerySchemaTotalCalculationFieldTypeEnterprise = `${QuerySchemaTotalCalculationFieldType}`

enum QuerySchemaUnionType {
  Union = "Объединить",
  UnionAll = "ОбъединитьВсе",
}

export const ZQuerySchemaUnionType = z.enum(Object.keys(QuerySchemaUnionType) as [TQuerySchemaUnionType, ...TQuerySchemaUnionType[]])
export const ZQuerySchemaUnionTypeEnterprise = z.enum(Object.values(QuerySchemaUnionType) as [TQuerySchemaUnionTypeEnterprise, ...TQuerySchemaUnionTypeEnterprise[]])

export type TQuerySchemaUnionType = keyof typeof QuerySchemaUnionType
export type TQuerySchemaUnionTypeEnterprise = `${QuerySchemaUnionType}`

enum NewPlannerItemsTextType {
  String = "Строка",
  FormattedString = "ФорматированнаяСтрока",
}

export const ZNewPlannerItemsTextType = z.enum(Object.keys(NewPlannerItemsTextType) as [TNewPlannerItemsTextType, ...TNewPlannerItemsTextType[]])
export const ZNewPlannerItemsTextTypeEnterprise = z.enum(Object.values(NewPlannerItemsTextType) as [TNewPlannerItemsTextTypeEnterprise, ...TNewPlannerItemsTextTypeEnterprise[]])

export type TNewPlannerItemsTextType = keyof typeof NewPlannerItemsTextType
export type TNewPlannerItemsTextTypeEnterprise = `${NewPlannerItemsTextType}`

enum PlannerCommandSource {
  Action = "Действие",
  URL = "НавигационнаяСсылка",
  WrappedTimeScaleHeaderArea = "ОбластьПеренесенногоЗаголовкаШкалыВремени",
  EmptyItemsArea = "ПустаяОбластьЭлементов",
  DimensionItem = "ЭлементИзмерения",
  TimeScaleItem = "ЭлементШкалыВремени",
  Items = "Элементы",
}

export const ZPlannerCommandSource = z.enum(Object.keys(PlannerCommandSource) as [TPlannerCommandSource, ...TPlannerCommandSource[]])
export const ZPlannerCommandSourceEnterprise = z.enum(Object.values(PlannerCommandSource) as [TPlannerCommandSourceEnterprise, ...TPlannerCommandSourceEnterprise[]])

export type TPlannerCommandSource = keyof typeof PlannerCommandSource
export type TPlannerCommandSourceEnterprise = `${PlannerCommandSource}`

enum PlannerInsideDragAction {
  Select = "Выделение",
  Copy = "Копирование",
  Edit = "Редактирование",
  Create = "Создание",
}

export const ZPlannerInsideDragAction = z.enum(Object.keys(PlannerInsideDragAction) as [TPlannerInsideDragAction, ...TPlannerInsideDragAction[]])
export const ZPlannerInsideDragActionEnterprise = z.enum(Object.values(PlannerInsideDragAction) as [TPlannerInsideDragActionEnterprise, ...TPlannerInsideDragActionEnterprise[]])

export type TPlannerInsideDragAction = keyof typeof PlannerInsideDragAction
export type TPlannerInsideDragActionEnterprise = `${PlannerInsideDragAction}`

enum PlannerInsideDragBoundaryChangeVariant {
  End = "Конец",
  Begin = "Начало",
  BeginAndEnd = "НачалоИКонец",
}

export const ZPlannerInsideDragBoundaryChangeVariant = z.enum(Object.keys(PlannerInsideDragBoundaryChangeVariant) as [TPlannerInsideDragBoundaryChangeVariant, ...TPlannerInsideDragBoundaryChangeVariant[]])
export const ZPlannerInsideDragBoundaryChangeVariantEnterprise = z.enum(Object.values(PlannerInsideDragBoundaryChangeVariant) as [TPlannerInsideDragBoundaryChangeVariantEnterprise, ...TPlannerInsideDragBoundaryChangeVariantEnterprise[]])

export type TPlannerInsideDragBoundaryChangeVariant = keyof typeof PlannerInsideDragBoundaryChangeVariant
export type TPlannerInsideDragBoundaryChangeVariantEnterprise = `${PlannerInsideDragBoundaryChangeVariant}`

enum PlannerItemActionLocation {
  EndOfItem = "ВКонцеЭлемента",
  EndOfText = "ПослеТекста",
}

export const ZPlannerItemActionLocation = z.enum(Object.keys(PlannerItemActionLocation) as [TPlannerItemActionLocation, ...TPlannerItemActionLocation[]])
export const ZPlannerItemActionLocationEnterprise = z.enum(Object.values(PlannerItemActionLocation) as [TPlannerItemActionLocationEnterprise, ...TPlannerItemActionLocationEnterprise[]])

export type TPlannerItemActionLocation = keyof typeof PlannerItemActionLocation
export type TPlannerItemActionLocationEnterprise = `${PlannerItemActionLocation}`

enum PlannerItemEnableEditMode {
  DisableDragAndStretch = "ЗапретитьПеретаскиваниеИРастягивание",
  DisableStretch = "ЗапретитьРастягивание",
  DisableEdit = "ЗапретитьРедактирование",
  EnableEdit = "РазрешитьРедактирование",
}

export const ZPlannerItemEnableEditMode = z.enum(Object.keys(PlannerItemEnableEditMode) as [TPlannerItemEnableEditMode, ...TPlannerItemEnableEditMode[]])
export const ZPlannerItemEnableEditModeEnterprise = z.enum(Object.values(PlannerItemEnableEditMode) as [TPlannerItemEnableEditModeEnterprise, ...TPlannerItemEnableEditModeEnterprise[]])

export type TPlannerItemEnableEditMode = keyof typeof PlannerItemEnableEditMode
export type TPlannerItemEnableEditModeEnterprise = `${PlannerItemEnableEditMode}`

enum PlannerItemsBehaviorOnLackOfSpace {
  ShowAllItems = "ОтображатьВсеЭлементы",
  CollapseItems = "СворачиватьЭлементы",
}

export const ZPlannerItemsBehaviorOnLackOfSpace = z.enum(Object.keys(PlannerItemsBehaviorOnLackOfSpace) as [TPlannerItemsBehaviorOnLackOfSpace, ...TPlannerItemsBehaviorOnLackOfSpace[]])
export const ZPlannerItemsBehaviorOnLackOfSpaceEnterprise = z.enum(Object.values(PlannerItemsBehaviorOnLackOfSpace) as [TPlannerItemsBehaviorOnLackOfSpaceEnterprise, ...TPlannerItemsBehaviorOnLackOfSpaceEnterprise[]])

export type TPlannerItemsBehaviorOnLackOfSpace = keyof typeof PlannerItemsBehaviorOnLackOfSpace
export type TPlannerItemsBehaviorOnLackOfSpaceEnterprise = `${PlannerItemsBehaviorOnLackOfSpace}`

enum PlannerItemsTimeRepresentation {
  BeginTime = "ВремяНачала",
  BeginAndEndTime = "ВремяНачалаИКонца",
  DontDisplay = "НеОтображать",
}

export const ZPlannerItemsTimeRepresentation = z.enum(Object.keys(PlannerItemsTimeRepresentation) as [TPlannerItemsTimeRepresentation, ...TPlannerItemsTimeRepresentation[]])
export const ZPlannerItemsTimeRepresentationEnterprise = z.enum(Object.values(PlannerItemsTimeRepresentation) as [TPlannerItemsTimeRepresentationEnterprise, ...TPlannerItemsTimeRepresentationEnterprise[]])

export type TPlannerItemsTimeRepresentation = keyof typeof PlannerItemsTimeRepresentation
export type TPlannerItemsTimeRepresentationEnterprise = `${PlannerItemsTimeRepresentation}`

enum PlannerStandardCommand {
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

export const ZPlannerStandardCommand = z.enum(Object.keys(PlannerStandardCommand) as [TPlannerStandardCommand, ...TPlannerStandardCommand[]])
export const ZPlannerStandardCommandEnterprise = z.enum(Object.values(PlannerStandardCommand) as [TPlannerStandardCommandEnterprise, ...TPlannerStandardCommandEnterprise[]])

export type TPlannerStandardCommand = keyof typeof PlannerStandardCommand
export type TPlannerStandardCommandEnterprise = `${PlannerStandardCommand}`

enum JSONCharactersEscapeMode {
  None = "Нет",
  NotASCIISymbols = "СимволыВнеASCII",
  SymbolsNotInBMP = "СимволыВнеBMP",
}

export const ZJSONCharactersEscapeMode = z.enum(Object.keys(JSONCharactersEscapeMode) as [TJSONCharactersEscapeMode, ...TJSONCharactersEscapeMode[]])
export const ZJSONCharactersEscapeModeEnterprise = z.enum(Object.values(JSONCharactersEscapeMode) as [TJSONCharactersEscapeModeEnterprise, ...TJSONCharactersEscapeModeEnterprise[]])

export type TJSONCharactersEscapeMode = keyof typeof JSONCharactersEscapeMode
export type TJSONCharactersEscapeModeEnterprise = `${JSONCharactersEscapeMode}`

enum JSONDateFormat {
  ISO = "ISO",
  JavaScript = "JavaScript",
  Microsoft = "Microsoft",
}

export const ZJSONDateFormat = z.enum(Object.keys(JSONDateFormat) as [TJSONDateFormat, ...TJSONDateFormat[]])
export const ZJSONDateFormatEnterprise = z.enum(Object.values(JSONDateFormat) as [TJSONDateFormatEnterprise, ...TJSONDateFormatEnterprise[]])

export type TJSONDateFormat = keyof typeof JSONDateFormat
export type TJSONDateFormatEnterprise = `${JSONDateFormat}`

enum JSONDateWritingVariant {
  LocalDate = "ЛокальнаяДата",
  LocalDateWithOffset = "ЛокальнаяДатаСоСмещением",
  UniversalDate = "УниверсальнаяДата",
}

export const ZJSONDateWritingVariant = z.enum(Object.keys(JSONDateWritingVariant) as [TJSONDateWritingVariant, ...TJSONDateWritingVariant[]])
export const ZJSONDateWritingVariantEnterprise = z.enum(Object.values(JSONDateWritingVariant) as [TJSONDateWritingVariantEnterprise, ...TJSONDateWritingVariantEnterprise[]])

export type TJSONDateWritingVariant = keyof typeof JSONDateWritingVariant
export type TJSONDateWritingVariantEnterprise = `${JSONDateWritingVariant}`

enum JSONLineBreak {
  Unix = "Unix",
  Windows = "Windows",
  Auto = "Авто",
  None = "Нет",
}

export const ZJSONLineBreak = z.enum(Object.keys(JSONLineBreak) as [TJSONLineBreak, ...TJSONLineBreak[]])
export const ZJSONLineBreakEnterprise = z.enum(Object.values(JSONLineBreak) as [TJSONLineBreakEnterprise, ...TJSONLineBreakEnterprise[]])

export type TJSONLineBreak = keyof typeof JSONLineBreak
export type TJSONLineBreakEnterprise = `${JSONLineBreak}`

enum JSONValueType {
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

export const ZJSONValueType = z.enum(Object.keys(JSONValueType) as [TJSONValueType, ...TJSONValueType[]])
export const ZJSONValueTypeEnterprise = z.enum(Object.values(JSONValueType) as [TJSONValueTypeEnterprise, ...TJSONValueTypeEnterprise[]])

export type TJSONValueType = keyof typeof JSONValueType
export type TJSONValueTypeEnterprise = `${JSONValueType}`

enum DeliverableNotificationSendErrorType {
  UnknownError = "НеизвестнаяОшибка",
  AuthenticationDataError = "ОшибкаДанныхАутентификации",
  SubscriberIDError = "ОшибкаИдентификатораПодписчика",
  DeliverableNotificationServiceConnectionError = "ОшибкаПодключенияКСервисуДоставляемыхУведомлений",
  DeliverableNotificationServiceError = "ОшибкаСервисаДоставляемыхУведомлений",
  NotificationBodyError = "ОшибкаТелаУведомления",
  NotificationsLimitExceeded = "ПревышенЛимитОтправкиУведомлений",
}

export const ZDeliverableNotificationSendErrorType = z.enum(Object.keys(DeliverableNotificationSendErrorType) as [TDeliverableNotificationSendErrorType, ...TDeliverableNotificationSendErrorType[]])
export const ZDeliverableNotificationSendErrorTypeEnterprise = z.enum(Object.values(DeliverableNotificationSendErrorType) as [TDeliverableNotificationSendErrorTypeEnterprise, ...TDeliverableNotificationSendErrorTypeEnterprise[]])

export type TDeliverableNotificationSendErrorType = keyof typeof DeliverableNotificationSendErrorType
export type TDeliverableNotificationSendErrorTypeEnterprise = `${DeliverableNotificationSendErrorType}`

enum DeliverableNotificationSubscriberType {
  APNS = "APNS",
  FCM = "FCM",
  GCM = "GCM",
  HPK = "HPK",
  RMS = "RMS",
  WNS = "WNS",
}

export const ZDeliverableNotificationSubscriberType = z.enum(Object.keys(DeliverableNotificationSubscriberType) as [TDeliverableNotificationSubscriberType, ...TDeliverableNotificationSubscriberType[]])
export const ZDeliverableNotificationSubscriberTypeEnterprise = z.enum(Object.values(DeliverableNotificationSubscriberType) as [TDeliverableNotificationSubscriberTypeEnterprise, ...TDeliverableNotificationSubscriberTypeEnterprise[]])

export type TDeliverableNotificationSubscriberType = keyof typeof DeliverableNotificationSubscriberType
export type TDeliverableNotificationSubscriberTypeEnterprise = `${DeliverableNotificationSubscriberType}`

enum SoundAlert {
  None = "Нет",
  Default = "ПоУмолчанию",
}

export const ZSoundAlert = z.enum(Object.keys(SoundAlert) as [TSoundAlert, ...TSoundAlert[]])
export const ZSoundAlertEnterprise = z.enum(Object.values(SoundAlert) as [TSoundAlertEnterprise, ...TSoundAlertEnterprise[]])

export type TSoundAlert = keyof typeof SoundAlert
export type TSoundAlertEnterprise = `${SoundAlert}`

enum InAppPurchaseService {
  AppleInAppPurchase = "AppleInAppPurchase",
  GooglePlayInAppBilling = "GooglePlayInAppBilling",
  HuaweiInAppPurchase = "HuaweiInAppPurchase",
  RuStoreInAppPurchase = "RuStoreInAppPurchase",
  WindowsInAppPurchase = "WindowsInAppPurchase",
}

export const ZInAppPurchaseService = z.enum(Object.keys(InAppPurchaseService) as [TInAppPurchaseService, ...TInAppPurchaseService[]])
export const ZInAppPurchaseServiceEnterprise = z.enum(Object.values(InAppPurchaseService) as [TInAppPurchaseServiceEnterprise, ...TInAppPurchaseServiceEnterprise[]])

export type TInAppPurchaseService = keyof typeof InAppPurchaseService
export type TInAppPurchaseServiceEnterprise = `${InAppPurchaseService}`

enum InAppPurchaseType {
  ContentForSale = "КонтентДляПродажи",
  Subscription = "Подписка",
}

export const ZInAppPurchaseType = z.enum(Object.keys(InAppPurchaseType) as [TInAppPurchaseType, ...TInAppPurchaseType[]])
export const ZInAppPurchaseTypeEnterprise = z.enum(Object.values(InAppPurchaseType) as [TInAppPurchaseTypeEnterprise, ...TInAppPurchaseTypeEnterprise[]])

export type TInAppPurchaseType = keyof typeof InAppPurchaseType
export type TInAppPurchaseTypeEnterprise = `${InAppPurchaseType}`

enum FTPSecureConnectionUsageLevel {
  Auto = "Авто",
  UseIfPossible = "ИспользоватьЕслиВозможно",
  DontUse = "НеИспользовать",
  Require = "Требовать",
  RequireForControl = "ТребоватьДляУправления",
}

export const ZFTPSecureConnectionUsageLevel = z.enum(Object.keys(FTPSecureConnectionUsageLevel) as [TFTPSecureConnectionUsageLevel, ...TFTPSecureConnectionUsageLevel[]])
export const ZFTPSecureConnectionUsageLevelEnterprise = z.enum(Object.values(FTPSecureConnectionUsageLevel) as [TFTPSecureConnectionUsageLevelEnterprise, ...TFTPSecureConnectionUsageLevelEnterprise[]])

export type TFTPSecureConnectionUsageLevel = keyof typeof FTPSecureConnectionUsageLevel
export type TFTPSecureConnectionUsageLevelEnterprise = `${FTPSecureConnectionUsageLevel}`

enum InternetConnectionType {
  WiFi = "WiFi",
  LAN = "ЛокальнаяСеть",
  NoConnection = "НетСоединения",
  CellularData = "СотовыеДанные",
}

export const ZInternetConnectionType = z.enum(Object.keys(InternetConnectionType) as [TInternetConnectionType, ...TInternetConnectionType[]])
export const ZInternetConnectionTypeEnterprise = z.enum(Object.values(InternetConnectionType) as [TInternetConnectionTypeEnterprise, ...TInternetConnectionTypeEnterprise[]])

export type TInternetConnectionType = keyof typeof InternetConnectionType
export type TInternetConnectionTypeEnterprise = `${InternetConnectionType}`

enum MacOSCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export const ZMacOSCertificateSelectMode = z.enum(Object.keys(MacOSCertificateSelectMode) as [TMacOSCertificateSelectMode, ...TMacOSCertificateSelectMode[]])
export const ZMacOSCertificateSelectModeEnterprise = z.enum(Object.values(MacOSCertificateSelectMode) as [TMacOSCertificateSelectModeEnterprise, ...TMacOSCertificateSelectModeEnterprise[]])

export type TMacOSCertificateSelectMode = keyof typeof MacOSCertificateSelectMode
export type TMacOSCertificateSelectModeEnterprise = `${MacOSCertificateSelectMode}`

enum OSCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export const ZOSCertificateSelectMode = z.enum(Object.keys(OSCertificateSelectMode) as [TOSCertificateSelectMode, ...TOSCertificateSelectMode[]])
export const ZOSCertificateSelectModeEnterprise = z.enum(Object.values(OSCertificateSelectMode) as [TOSCertificateSelectModeEnterprise, ...TOSCertificateSelectModeEnterprise[]])

export type TOSCertificateSelectMode = keyof typeof OSCertificateSelectMode
export type TOSCertificateSelectModeEnterprise = `${OSCertificateSelectMode}`

enum RoamingUsage {
  Used = "Используется",
  Unknown = "Неизвестно",
  NotUsed = "НеИспользуется",
}

export const ZRoamingUsage = z.enum(Object.keys(RoamingUsage) as [TRoamingUsage, ...TRoamingUsage[]])
export const ZRoamingUsageEnterprise = z.enum(Object.values(RoamingUsage) as [TRoamingUsageEnterprise, ...TRoamingUsageEnterprise[]])

export type TRoamingUsage = keyof typeof RoamingUsage
export type TRoamingUsageEnterprise = `${RoamingUsage}`

enum ServerTLSCertificateRevocationCheckMode {
  Auto = "Авто",
  DontCheck = "НеПроверять",
  SoftFail = "Нестрогий",
  Strict = "Строгий",
}

export const ZServerTLSCertificateRevocationCheckMode = z.enum(Object.keys(ServerTLSCertificateRevocationCheckMode) as [TServerTLSCertificateRevocationCheckMode, ...TServerTLSCertificateRevocationCheckMode[]])
export const ZServerTLSCertificateRevocationCheckModeEnterprise = z.enum(Object.values(ServerTLSCertificateRevocationCheckMode) as [TServerTLSCertificateRevocationCheckModeEnterprise, ...TServerTLSCertificateRevocationCheckModeEnterprise[]])

export type TServerTLSCertificateRevocationCheckMode = keyof typeof ServerTLSCertificateRevocationCheckMode
export type TServerTLSCertificateRevocationCheckModeEnterprise = `${ServerTLSCertificateRevocationCheckMode}`

enum WindowsCertificateSelectMode {
  Auto = "Авто",
  Choose = "Выбирать",
}

export const ZWindowsCertificateSelectMode = z.enum(Object.keys(WindowsCertificateSelectMode) as [TWindowsCertificateSelectMode, ...TWindowsCertificateSelectMode[]])
export const ZWindowsCertificateSelectModeEnterprise = z.enum(Object.values(WindowsCertificateSelectMode) as [TWindowsCertificateSelectModeEnterprise, ...TWindowsCertificateSelectModeEnterprise[]])

export type TWindowsCertificateSelectMode = keyof typeof WindowsCertificateSelectMode
export type TWindowsCertificateSelectModeEnterprise = `${WindowsCertificateSelectMode}`

enum ByteOrder {
  BigEndian = "BigEndian",
  LittleEndian = "LittleEndian",
}

export const ZByteOrder = z.enum(Object.keys(ByteOrder) as [TByteOrder, ...TByteOrder[]])
export const ZByteOrderEnterprise = z.enum(Object.values(ByteOrder) as [TByteOrderEnterprise, ...TByteOrderEnterprise[]])

export type TByteOrder = keyof typeof ByteOrder
export type TByteOrderEnterprise = `${ByteOrder}`

enum PositionInStream {
  End = "Конец",
  Begin = "Начало",
  Current = "Текущая",
}

export const ZPositionInStream = z.enum(Object.keys(PositionInStream) as [TPositionInStream, ...TPositionInStream[]])
export const ZPositionInStreamEnterprise = z.enum(Object.values(PositionInStream) as [TPositionInStreamEnterprise, ...TPositionInStreamEnterprise[]])

export type TPositionInStream = keyof typeof PositionInStream
export type TPositionInStreamEnterprise = `${PositionInStream}`

enum AdBannerRepresentation {
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export const ZAdBannerRepresentation = z.enum(Object.keys(AdBannerRepresentation) as [TAdBannerRepresentation, ...TAdBannerRepresentation[]])
export const ZAdBannerRepresentationEnterprise = z.enum(Object.values(AdBannerRepresentation) as [TAdBannerRepresentationEnterprise, ...TAdBannerRepresentationEnterprise[]])

export type TAdBannerRepresentation = keyof typeof AdBannerRepresentation
export type TAdBannerRepresentationEnterprise = `${AdBannerRepresentation}`

enum AdStatus {
  ReadyToDisplay = "ГотоваКОтображению",
  Downloading = "Загружается",
  NotDownloaded = "НеЗагружена",
  Displayed = "Отображается",
}

export const ZAdStatus = z.enum(Object.keys(AdStatus) as [TAdStatus, ...TAdStatus[]])
export const ZAdStatusEnterprise = z.enum(Object.values(AdStatus) as [TAdStatusEnterprise, ...TAdStatusEnterprise[]])

export type TAdStatus = keyof typeof AdStatus
export type TAdStatusEnterprise = `${AdStatus}`

enum DataLineChangeType {
  Add = "Добавление",
  Update = "Изменение",
  Move = "Перемещение",
  Delete = "Удаление",
}

export const ZDataLineChangeType = z.enum(Object.keys(DataLineChangeType) as [TDataLineChangeType, ...TDataLineChangeType[]])
export const ZDataLineChangeTypeEnterprise = z.enum(Object.values(DataLineChangeType) as [TDataLineChangeTypeEnterprise, ...TDataLineChangeTypeEnterprise[]])

export type TDataLineChangeType = keyof typeof DataLineChangeType
export type TDataLineChangeTypeEnterprise = `${DataLineChangeType}`

enum RepresentableDocumentBatchFileType {
  DOCX = "DOCX",
  HTML4 = "HTML4",
  HTML5 = "HTML5",
  ODS = "ODS",
  PDF = "PDF",
  TXT = "TXT",
  XLS = "XLS",
  XLSX = "XLSX",
}

export const ZRepresentableDocumentBatchFileType = z.enum(Object.keys(RepresentableDocumentBatchFileType) as [TRepresentableDocumentBatchFileType, ...TRepresentableDocumentBatchFileType[]])
export const ZRepresentableDocumentBatchFileTypeEnterprise = z.enum(Object.values(RepresentableDocumentBatchFileType) as [TRepresentableDocumentBatchFileTypeEnterprise, ...TRepresentableDocumentBatchFileTypeEnterprise[]])

export type TRepresentableDocumentBatchFileType = keyof typeof RepresentableDocumentBatchFileType
export type TRepresentableDocumentBatchFileTypeEnterprise = `${RepresentableDocumentBatchFileType}`

enum ClientApplicationAgentState {
  NotStarted = "НеЗапущен",
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export const ZClientApplicationAgentState = z.enum(Object.keys(ClientApplicationAgentState) as [TClientApplicationAgentState, ...TClientApplicationAgentState[]])
export const ZClientApplicationAgentStateEnterprise = z.enum(Object.values(ClientApplicationAgentState) as [TClientApplicationAgentStateEnterprise, ...TClientApplicationAgentStateEnterprise[]])

export type TClientApplicationAgentState = keyof typeof ClientApplicationAgentState
export type TClientApplicationAgentStateEnterprise = `${ClientApplicationAgentState}`

enum DatabaseCopiesStandardReplicationVersion {
  Version1 = "Версия1",
  Version2 = "Версия2",
}

export const ZDatabaseCopiesStandardReplicationVersion = z.enum(Object.keys(DatabaseCopiesStandardReplicationVersion) as [TDatabaseCopiesStandardReplicationVersion, ...TDatabaseCopiesStandardReplicationVersion[]])
export const ZDatabaseCopiesStandardReplicationVersionEnterprise = z.enum(Object.values(DatabaseCopiesStandardReplicationVersion) as [TDatabaseCopiesStandardReplicationVersionEnterprise, ...TDatabaseCopiesStandardReplicationVersionEnterprise[]])

export type TDatabaseCopiesStandardReplicationVersion = keyof typeof DatabaseCopiesStandardReplicationVersion
export type TDatabaseCopiesStandardReplicationVersionEnterprise = `${DatabaseCopiesStandardReplicationVersion}`

enum DatabaseCopiesUse {
  Auto = "Авто",
  PreferUseCopies = "ИспользоватьПреимущественноКопии",
  UseCopiesOnly = "ИспользоватьТолькоКопии",
  DontUseCopies = "НеИспользоватьКопии",
}

export const ZDatabaseCopiesUse = z.enum(Object.keys(DatabaseCopiesUse) as [TDatabaseCopiesUse, ...TDatabaseCopiesUse[]])
export const ZDatabaseCopiesUseEnterprise = z.enum(Object.values(DatabaseCopiesUse) as [TDatabaseCopiesUseEnterprise, ...TDatabaseCopiesUseEnterprise[]])

export type TDatabaseCopiesUse = keyof typeof DatabaseCopiesUse
export type TDatabaseCopiesUseEnterprise = `${DatabaseCopiesUse}`

enum DatabaseCopyContentItemFieldUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZDatabaseCopyContentItemFieldUse = z.enum(Object.keys(DatabaseCopyContentItemFieldUse) as [TDatabaseCopyContentItemFieldUse, ...TDatabaseCopyContentItemFieldUse[]])
export const ZDatabaseCopyContentItemFieldUseEnterprise = z.enum(Object.values(DatabaseCopyContentItemFieldUse) as [TDatabaseCopyContentItemFieldUseEnterprise, ...TDatabaseCopyContentItemFieldUseEnterprise[]])

export type TDatabaseCopyContentItemFieldUse = keyof typeof DatabaseCopyContentItemFieldUse
export type TDatabaseCopyContentItemFieldUseEnterprise = `${DatabaseCopyContentItemFieldUse}`

enum DatabaseCopyDBMSType {
  MSSQLServer = "MSSQLServer",
  OracleDatabase = "OracleDatabase",
  PostgreSQL = "PostgreSQL",
}

export const ZDatabaseCopyDBMSType = z.enum(Object.keys(DatabaseCopyDBMSType) as [TDatabaseCopyDBMSType, ...TDatabaseCopyDBMSType[]])
export const ZDatabaseCopyDBMSTypeEnterprise = z.enum(Object.values(DatabaseCopyDBMSType) as [TDatabaseCopyDBMSTypeEnterprise, ...TDatabaseCopyDBMSTypeEnterprise[]])

export type TDatabaseCopyDBMSType = keyof typeof DatabaseCopyDBMSType
export type TDatabaseCopyDBMSTypeEnterprise = `${DatabaseCopyDBMSType}`

enum DatabaseCopyReplicationType {
  External = "Внешняя",
  Standard = "Стандартная",
}

export const ZDatabaseCopyReplicationType = z.enum(Object.keys(DatabaseCopyReplicationType) as [TDatabaseCopyReplicationType, ...TDatabaseCopyReplicationType[]])
export const ZDatabaseCopyReplicationTypeEnterprise = z.enum(Object.values(DatabaseCopyReplicationType) as [TDatabaseCopyReplicationTypeEnterprise, ...TDatabaseCopyReplicationTypeEnterprise[]])

export type TDatabaseCopyReplicationType = keyof typeof DatabaseCopyReplicationType
export type TDatabaseCopyReplicationTypeEnterprise = `${DatabaseCopyReplicationType}`

enum DatabaseCopyState {
  TurnedOn = "Включена",
  TemporarilyTurnedOff = "ВременноОтключена",
  TurnedOff = "Отключена",
}

export const ZDatabaseCopyState = z.enum(Object.keys(DatabaseCopyState) as [TDatabaseCopyState, ...TDatabaseCopyState[]])
export const ZDatabaseCopyStateEnterprise = z.enum(Object.values(DatabaseCopyState) as [TDatabaseCopyStateEnterprise, ...TDatabaseCopyStateEnterprise[]])

export type TDatabaseCopyState = keyof typeof DatabaseCopyState
export type TDatabaseCopyStateEnterprise = `${DatabaseCopyState}`

enum DatabaseCopyTurnedOffReason {
  InvalidCopyDatabaseUseVariant = "НедопустимыйВариантИспользованияБазыДанныхКопии",
  DataInconsistency = "НесоответствиеДанных",
  QueryExecutionError = "ОшибкаВыполненияЗапроса",
  DatabaseConnectionError = "ОшибкаСоединенияСБазойДанных",
}

export const ZDatabaseCopyTurnedOffReason = z.enum(Object.keys(DatabaseCopyTurnedOffReason) as [TDatabaseCopyTurnedOffReason, ...TDatabaseCopyTurnedOffReason[]])
export const ZDatabaseCopyTurnedOffReasonEnterprise = z.enum(Object.values(DatabaseCopyTurnedOffReason) as [TDatabaseCopyTurnedOffReasonEnterprise, ...TDatabaseCopyTurnedOffReasonEnterprise[]])

export type TDatabaseCopyTurnedOffReason = keyof typeof DatabaseCopyTurnedOffReason
export type TDatabaseCopyTurnedOffReasonEnterprise = `${DatabaseCopyTurnedOffReason}`

enum DatabaseCopyUpdateState {
  InitialUpdateInProgress = "ВыполняетсяНачальноеОбновление",
  CurrentUpdateInProgress = "ВыполняетсяТекущееОбновление",
  PortionUpdateCompletedSuccessfully = "ЗавершеноОбновлениеПорцииУспешно",
  CompletedWithError = "ЗавершеноСОшибкой",
  CompletedSuccessfully = "ЗавершеноУспешно",
  Inactive = "Неактивно",
}

export const ZDatabaseCopyUpdateState = z.enum(Object.keys(DatabaseCopyUpdateState) as [TDatabaseCopyUpdateState, ...TDatabaseCopyUpdateState[]])
export const ZDatabaseCopyUpdateStateEnterprise = z.enum(Object.values(DatabaseCopyUpdateState) as [TDatabaseCopyUpdateStateEnterprise, ...TDatabaseCopyUpdateStateEnterprise[]])

export type TDatabaseCopyUpdateState = keyof typeof DatabaseCopyUpdateState
export type TDatabaseCopyUpdateStateEnterprise = `${DatabaseCopyUpdateState}`

enum DataCompositionDatabaseCopyOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export const ZDataCompositionDatabaseCopyOutputType = z.enum(Object.keys(DataCompositionDatabaseCopyOutputType) as [TDataCompositionDatabaseCopyOutputType, ...TDataCompositionDatabaseCopyOutputType[]])
export const ZDataCompositionDatabaseCopyOutputTypeEnterprise = z.enum(Object.values(DataCompositionDatabaseCopyOutputType) as [TDataCompositionDatabaseCopyOutputTypeEnterprise, ...TDataCompositionDatabaseCopyOutputTypeEnterprise[]])

export type TDataCompositionDatabaseCopyOutputType = keyof typeof DataCompositionDatabaseCopyOutputType
export type TDataCompositionDatabaseCopyOutputTypeEnterprise = `${DataCompositionDatabaseCopyOutputType}`

enum DataCompositionDataRelevanceOutputType {
  Auto = "Авто",
  Output = "Выводить",
  DontOutput = "НеВыводить",
}

export const ZDataCompositionDataRelevanceOutputType = z.enum(Object.keys(DataCompositionDataRelevanceOutputType) as [TDataCompositionDataRelevanceOutputType, ...TDataCompositionDataRelevanceOutputType[]])
export const ZDataCompositionDataRelevanceOutputTypeEnterprise = z.enum(Object.values(DataCompositionDataRelevanceOutputType) as [TDataCompositionDataRelevanceOutputTypeEnterprise, ...TDataCompositionDataRelevanceOutputTypeEnterprise[]])

export type TDataCompositionDataRelevanceOutputType = keyof typeof DataCompositionDataRelevanceOutputType
export type TDataCompositionDataRelevanceOutputTypeEnterprise = `${DataCompositionDataRelevanceOutputType}`

enum RequiredDataRelevance {
  Auto = "Авто",
  Relevant = "Актуальные",
  Any = "Любые",
}

export const ZRequiredDataRelevance = z.enum(Object.keys(RequiredDataRelevance) as [TRequiredDataRelevance, ...TRequiredDataRelevance[]])
export const ZRequiredDataRelevanceEnterprise = z.enum(Object.values(RequiredDataRelevance) as [TRequiredDataRelevanceEnterprise, ...TRequiredDataRelevanceEnterprise[]])

export type TRequiredDataRelevance = keyof typeof RequiredDataRelevance
export type TRequiredDataRelevanceEnterprise = `${RequiredDataRelevance}`

enum CollaborationSystemCommandSource {
  Attachment = "Вложение",
  Action = "Действие",
  URL = "НавигационнаяСсылка",
  CurrentPageURL = "НавигационнаяСсылкаТекущейСтраницы",
  User = "Пользователь",
  Message = "Сообщение",
}

export const ZCollaborationSystemCommandSource = z.enum(Object.keys(CollaborationSystemCommandSource) as [TCollaborationSystemCommandSource, ...TCollaborationSystemCommandSource[]])
export const ZCollaborationSystemCommandSourceEnterprise = z.enum(Object.values(CollaborationSystemCommandSource) as [TCollaborationSystemCommandSourceEnterprise, ...TCollaborationSystemCommandSourceEnterprise[]])

export type TCollaborationSystemCommandSource = keyof typeof CollaborationSystemCommandSource
export type TCollaborationSystemCommandSourceEnterprise = `${CollaborationSystemCommandSource}`

enum CollaborationSystemDataDumpStatus {
  Restoring = "Восстановление",
  Done = "Готово",
  Loading = "Загрузка",
  Error = "Ошибка",
  Creating = "Создание",
}

export const ZCollaborationSystemDataDumpStatus = z.enum(Object.keys(CollaborationSystemDataDumpStatus) as [TCollaborationSystemDataDumpStatus, ...TCollaborationSystemDataDumpStatus[]])
export const ZCollaborationSystemDataDumpStatusEnterprise = z.enum(Object.values(CollaborationSystemDataDumpStatus) as [TCollaborationSystemDataDumpStatusEnterprise, ...TCollaborationSystemDataDumpStatusEnterprise[]])

export type TCollaborationSystemDataDumpStatus = keyof typeof CollaborationSystemDataDumpStatus
export type TCollaborationSystemDataDumpStatusEnterprise = `${CollaborationSystemDataDumpStatus}`

enum CollaborationSystemFromDataDumpRestoreStatus {
  Error = "Ошибка",
  Success = "Успешно",
}

export const ZCollaborationSystemFromDataDumpRestoreStatus = z.enum(Object.keys(CollaborationSystemFromDataDumpRestoreStatus) as [TCollaborationSystemFromDataDumpRestoreStatus, ...TCollaborationSystemFromDataDumpRestoreStatus[]])
export const ZCollaborationSystemFromDataDumpRestoreStatusEnterprise = z.enum(Object.values(CollaborationSystemFromDataDumpRestoreStatus) as [TCollaborationSystemFromDataDumpRestoreStatusEnterprise, ...TCollaborationSystemFromDataDumpRestoreStatusEnterprise[]])

export type TCollaborationSystemFromDataDumpRestoreStatus = keyof typeof CollaborationSystemFromDataDumpRestoreStatus
export type TCollaborationSystemFromDataDumpRestoreStatusEnterprise = `${CollaborationSystemFromDataDumpRestoreStatus}`

enum CollaborationSystemMessageButtonPanelButtonAction {
  RequestLocation = "ЗапроситьМестоположение",
  RequestPhone = "ЗапроситьТелефон",
  ProcessByBot = "ОбработатьБотом",
  ProcessOnClient = "ОбработатьНаКлиенте",
  SendMessage = "ОтправитьСообщение",
  SendMessageWithData = "ОтправитьСообщениеСДанными",
  GotoURL = "ПерейтиПоНавигационнойСсылке",
}

export const ZCollaborationSystemMessageButtonPanelButtonAction = z.enum(Object.keys(CollaborationSystemMessageButtonPanelButtonAction) as [TCollaborationSystemMessageButtonPanelButtonAction, ...TCollaborationSystemMessageButtonPanelButtonAction[]])
export const ZCollaborationSystemMessageButtonPanelButtonActionEnterprise = z.enum(Object.values(CollaborationSystemMessageButtonPanelButtonAction) as [TCollaborationSystemMessageButtonPanelButtonActionEnterprise, ...TCollaborationSystemMessageButtonPanelButtonActionEnterprise[]])

export type TCollaborationSystemMessageButtonPanelButtonAction = keyof typeof CollaborationSystemMessageButtonPanelButtonAction
export type TCollaborationSystemMessageButtonPanelButtonActionEnterprise = `${CollaborationSystemMessageButtonPanelButtonAction}`

enum CollaborationSystemMessageButtonPanelButtonType {
  Hyperlink = "Гиперссылка",
  UsualButton = "ОбычнаяКнопка",
}

export const ZCollaborationSystemMessageButtonPanelButtonType = z.enum(Object.keys(CollaborationSystemMessageButtonPanelButtonType) as [TCollaborationSystemMessageButtonPanelButtonType, ...TCollaborationSystemMessageButtonPanelButtonType[]])
export const ZCollaborationSystemMessageButtonPanelButtonTypeEnterprise = z.enum(Object.values(CollaborationSystemMessageButtonPanelButtonType) as [TCollaborationSystemMessageButtonPanelButtonTypeEnterprise, ...TCollaborationSystemMessageButtonPanelButtonTypeEnterprise[]])

export type TCollaborationSystemMessageButtonPanelButtonType = keyof typeof CollaborationSystemMessageButtonPanelButtonType
export type TCollaborationSystemMessageButtonPanelButtonTypeEnterprise = `${CollaborationSystemMessageButtonPanelButtonType}`

enum CollaborationSystemNotificationRepresentation {
  DontDisturb = "НеБеспокоить",
  Normal = "Обычное",
}

export const ZCollaborationSystemNotificationRepresentation = z.enum(Object.keys(CollaborationSystemNotificationRepresentation) as [TCollaborationSystemNotificationRepresentation, ...TCollaborationSystemNotificationRepresentation[]])
export const ZCollaborationSystemNotificationRepresentationEnterprise = z.enum(Object.values(CollaborationSystemNotificationRepresentation) as [TCollaborationSystemNotificationRepresentationEnterprise, ...TCollaborationSystemNotificationRepresentationEnterprise[]])

export type TCollaborationSystemNotificationRepresentation = keyof typeof CollaborationSystemNotificationRepresentation
export type TCollaborationSystemNotificationRepresentationEnterprise = `${CollaborationSystemNotificationRepresentation}`

enum CollaborationSystemStandardCommand {
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

export const ZCollaborationSystemStandardCommand = z.enum(Object.keys(CollaborationSystemStandardCommand) as [TCollaborationSystemStandardCommand, ...TCollaborationSystemStandardCommand[]])
export const ZCollaborationSystemStandardCommandEnterprise = z.enum(Object.values(CollaborationSystemStandardCommand) as [TCollaborationSystemStandardCommandEnterprise, ...TCollaborationSystemStandardCommandEnterprise[]])

export type TCollaborationSystemStandardCommand = keyof typeof CollaborationSystemStandardCommand
export type TCollaborationSystemStandardCommandEnterprise = `${CollaborationSystemStandardCommand}`

enum CollaborationSystemUsersChoicePurpose {
  MessageRecipient = "ПолучательСообщения",
  VideoconferenceParticipant = "УчастникВидеоконференции",
  ConversationMember = "УчастникОбсуждения",
}

export const ZCollaborationSystemUsersChoicePurpose = z.enum(Object.keys(CollaborationSystemUsersChoicePurpose) as [TCollaborationSystemUsersChoicePurpose, ...TCollaborationSystemUsersChoicePurpose[]])
export const ZCollaborationSystemUsersChoicePurposeEnterprise = z.enum(Object.values(CollaborationSystemUsersChoicePurpose) as [TCollaborationSystemUsersChoicePurposeEnterprise, ...TCollaborationSystemUsersChoicePurposeEnterprise[]])

export type TCollaborationSystemUsersChoicePurpose = keyof typeof CollaborationSystemUsersChoicePurpose
export type TCollaborationSystemUsersChoicePurposeEnterprise = `${CollaborationSystemUsersChoicePurpose}`

enum AdministrationActionOnResourceConsumptionLimitExcess {
  TerminateSession = "ЗавершитьСеанс",
  None = "Нет",
  InterruptCurrentServerCall = "ПрерватьТекущийСерверныйВызов",
  SetThreadLowPriority = "УстановитьНизкийПриоритетПотока",
}

export const ZAdministrationActionOnResourceConsumptionLimitExcess = z.enum(Object.keys(AdministrationActionOnResourceConsumptionLimitExcess) as [TAdministrationActionOnResourceConsumptionLimitExcess, ...TAdministrationActionOnResourceConsumptionLimitExcess[]])
export const ZAdministrationActionOnResourceConsumptionLimitExcessEnterprise = z.enum(Object.values(AdministrationActionOnResourceConsumptionLimitExcess) as [TAdministrationActionOnResourceConsumptionLimitExcessEnterprise, ...TAdministrationActionOnResourceConsumptionLimitExcessEnterprise[]])

export type TAdministrationActionOnResourceConsumptionLimitExcess = keyof typeof AdministrationActionOnResourceConsumptionLimitExcess
export type TAdministrationActionOnResourceConsumptionLimitExcessEnterprise = `${AdministrationActionOnResourceConsumptionLimitExcess}`

enum AdministrationAssignmentRuleType {
  Auto = "Авто",
  Assign = "Назначать",
  DontAssign = "НеНазначать",
}

export const ZAdministrationAssignmentRuleType = z.enum(Object.keys(AdministrationAssignmentRuleType) as [TAdministrationAssignmentRuleType, ...TAdministrationAssignmentRuleType[]])
export const ZAdministrationAssignmentRuleTypeEnterprise = z.enum(Object.values(AdministrationAssignmentRuleType) as [TAdministrationAssignmentRuleTypeEnterprise, ...TAdministrationAssignmentRuleTypeEnterprise[]])

export type TAdministrationAssignmentRuleType = keyof typeof AdministrationAssignmentRuleType
export type TAdministrationAssignmentRuleTypeEnterprise = `${AdministrationAssignmentRuleType}`

enum AdministrationConnectionSecurityLevel {
  Secure = "Защищенное",
  SecureOnConnect = "ЗащищенноеПриУстановкеСоединения",
  Unsecure = "Незащищенное",
}

export const ZAdministrationConnectionSecurityLevel = z.enum(Object.keys(AdministrationConnectionSecurityLevel) as [TAdministrationConnectionSecurityLevel, ...TAdministrationConnectionSecurityLevel[]])
export const ZAdministrationConnectionSecurityLevelEnterprise = z.enum(Object.values(AdministrationConnectionSecurityLevel) as [TAdministrationConnectionSecurityLevelEnterprise, ...TAdministrationConnectionSecurityLevelEnterprise[]])

export type TAdministrationConnectionSecurityLevel = keyof typeof AdministrationConnectionSecurityLevel
export type TAdministrationConnectionSecurityLevelEnterprise = `${AdministrationConnectionSecurityLevel}`

enum AdministrationInfoBaseDeletionMode {
  DontPerformActionsWithDatabase = "НеВыполнятьДействийСБазойДанных",
  ClearDatabase = "ОчиститьБазуДанных",
  DeleteDatabase = "УдалитьБазуДанных",
}

export const ZAdministrationInfoBaseDeletionMode = z.enum(Object.keys(AdministrationInfoBaseDeletionMode) as [TAdministrationInfoBaseDeletionMode, ...TAdministrationInfoBaseDeletionMode[]])
export const ZAdministrationInfoBaseDeletionModeEnterprise = z.enum(Object.values(AdministrationInfoBaseDeletionMode) as [TAdministrationInfoBaseDeletionModeEnterprise, ...TAdministrationInfoBaseDeletionModeEnterprise[]])

export type TAdministrationInfoBaseDeletionMode = keyof typeof AdministrationInfoBaseDeletionMode
export type TAdministrationInfoBaseDeletionModeEnterprise = `${AdministrationInfoBaseDeletionMode}`

enum AdministrationProcessChoicePriority {
  ByMemory = "ПоПамяти",
  ByPerformance = "ПоПроизводительности",
}

export const ZAdministrationProcessChoicePriority = z.enum(Object.keys(AdministrationProcessChoicePriority) as [TAdministrationProcessChoicePriority, ...TAdministrationProcessChoicePriority[]])
export const ZAdministrationProcessChoicePriorityEnterprise = z.enum(Object.values(AdministrationProcessChoicePriority) as [TAdministrationProcessChoicePriorityEnterprise, ...TAdministrationProcessChoicePriorityEnterprise[]])

export type TAdministrationProcessChoicePriority = keyof typeof AdministrationProcessChoicePriority
export type TAdministrationProcessChoicePriorityEnterprise = `${AdministrationProcessChoicePriority}`

enum AdministrationResourceConsumptionCounterFilterType {
  All = "Все",
  AllSelected = "ВсеВыбранные",
  AllButSelected = "ВсеКромеВыбранных",
}

export const ZAdministrationResourceConsumptionCounterFilterType = z.enum(Object.keys(AdministrationResourceConsumptionCounterFilterType) as [TAdministrationResourceConsumptionCounterFilterType, ...TAdministrationResourceConsumptionCounterFilterType[]])
export const ZAdministrationResourceConsumptionCounterFilterTypeEnterprise = z.enum(Object.values(AdministrationResourceConsumptionCounterFilterType) as [TAdministrationResourceConsumptionCounterFilterTypeEnterprise, ...TAdministrationResourceConsumptionCounterFilterTypeEnterprise[]])

export type TAdministrationResourceConsumptionCounterFilterType = keyof typeof AdministrationResourceConsumptionCounterFilterType
export type TAdministrationResourceConsumptionCounterFilterTypeEnterprise = `${AdministrationResourceConsumptionCounterFilterType}`

enum AdministrationResourceConsumptionCounterGroupType {
  Users = "Пользователи",
  DataSeparation = "РазделениеДанных",
}

export const ZAdministrationResourceConsumptionCounterGroupType = z.enum(Object.keys(AdministrationResourceConsumptionCounterGroupType) as [TAdministrationResourceConsumptionCounterGroupType, ...TAdministrationResourceConsumptionCounterGroupType[]])
export const ZAdministrationResourceConsumptionCounterGroupTypeEnterprise = z.enum(Object.values(AdministrationResourceConsumptionCounterGroupType) as [TAdministrationResourceConsumptionCounterGroupTypeEnterprise, ...TAdministrationResourceConsumptionCounterGroupTypeEnterprise[]])

export type TAdministrationResourceConsumptionCounterGroupType = keyof typeof AdministrationResourceConsumptionCounterGroupType
export type TAdministrationResourceConsumptionCounterGroupTypeEnterprise = `${AdministrationResourceConsumptionCounterGroupType}`

enum AdministrationWorkProcessStatus {
  Used = "Используется",
  NotUsed = "НеИспользуется",
  Reserve = "Резервный",
}

export const ZAdministrationWorkProcessStatus = z.enum(Object.keys(AdministrationWorkProcessStatus) as [TAdministrationWorkProcessStatus, ...TAdministrationWorkProcessStatus[]])
export const ZAdministrationWorkProcessStatusEnterprise = z.enum(Object.values(AdministrationWorkProcessStatus) as [TAdministrationWorkProcessStatusEnterprise, ...TAdministrationWorkProcessStatusEnterprise[]])

export type TAdministrationWorkProcessStatus = keyof typeof AdministrationWorkProcessStatus
export type TAdministrationWorkProcessStatusEnterprise = `${AdministrationWorkProcessStatus}`

enum PivotTableColumnTotalPosition {
  Left = "Лево",
  Right = "Право",
}

export const ZPivotTableColumnTotalPosition = z.enum(Object.keys(PivotTableColumnTotalPosition) as [TPivotTableColumnTotalPosition, ...TPivotTableColumnTotalPosition[]])
export const ZPivotTableColumnTotalPositionEnterprise = z.enum(Object.values(PivotTableColumnTotalPosition) as [TPivotTableColumnTotalPositionEnterprise, ...TPivotTableColumnTotalPositionEnterprise[]])

export type TPivotTableColumnTotalPosition = keyof typeof PivotTableColumnTotalPosition
export type TPivotTableColumnTotalPositionEnterprise = `${PivotTableColumnTotalPosition}`

enum PivotTableLinesShowType {
  Auto = "Авто",
  Always = "Всегда",
}

export const ZPivotTableLinesShowType = z.enum(Object.keys(PivotTableLinesShowType) as [TPivotTableLinesShowType, ...TPivotTableLinesShowType[]])
export const ZPivotTableLinesShowTypeEnterprise = z.enum(Object.values(PivotTableLinesShowType) as [TPivotTableLinesShowTypeEnterprise, ...TPivotTableLinesShowTypeEnterprise[]])

export type TPivotTableLinesShowType = keyof typeof PivotTableLinesShowType
export type TPivotTableLinesShowTypeEnterprise = `${PivotTableLinesShowType}`

enum PivotTableRowTotalPosition {
  Top = "Верх",
  Bottom = "Низ",
}

export const ZPivotTableRowTotalPosition = z.enum(Object.keys(PivotTableRowTotalPosition) as [TPivotTableRowTotalPosition, ...TPivotTableRowTotalPosition[]])
export const ZPivotTableRowTotalPositionEnterprise = z.enum(Object.values(PivotTableRowTotalPosition) as [TPivotTableRowTotalPositionEnterprise, ...TPivotTableRowTotalPositionEnterprise[]])

export type TPivotTableRowTotalPosition = keyof typeof PivotTableRowTotalPosition
export type TPivotTableRowTotalPositionEnterprise = `${PivotTableRowTotalPosition}`

enum DuplexPrintingType {
  UsePrinterSettings = "ИспользоватьНастройкиПринтера",
  None = "Нет",
  FlipPagesUp = "ПереворотВверх",
  FlipPagesLeft = "ПереворотВлево",
}

export const ZDuplexPrintingType = z.enum(Object.keys(DuplexPrintingType) as [TDuplexPrintingType, ...TDuplexPrintingType[]])
export const ZDuplexPrintingTypeEnterprise = z.enum(Object.values(DuplexPrintingType) as [TDuplexPrintingTypeEnterprise, ...TDuplexPrintingTypeEnterprise[]])

export type TDuplexPrintingType = keyof typeof DuplexPrintingType
export type TDuplexPrintingTypeEnterprise = `${DuplexPrintingType}`

enum PageOrientation {
  Landscape = "Ландшафт",
  Portrait = "Портрет",
}

export const ZPageOrientation = z.enum(Object.keys(PageOrientation) as [TPageOrientation, ...TPageOrientation[]])
export const ZPageOrientationEnterprise = z.enum(Object.values(PageOrientation) as [TPageOrientationEnterprise, ...TPageOrientationEnterprise[]])

export type TPageOrientation = keyof typeof PageOrientation
export type TPageOrientationEnterprise = `${PageOrientation}`

enum PagePlacementAlternation {
  Auto = "Авто",
  MirrorOnTop = "ЗеркальноСверху",
  MirrorOnLeft = "ЗеркальноСлева",
  DontUse = "НеИспользовать",
}

export const ZPagePlacementAlternation = z.enum(Object.keys(PagePlacementAlternation) as [TPagePlacementAlternation, ...TPagePlacementAlternation[]])
export const ZPagePlacementAlternationEnterprise = z.enum(Object.values(PagePlacementAlternation) as [TPagePlacementAlternationEnterprise, ...TPagePlacementAlternationEnterprise[]])

export type TPagePlacementAlternation = keyof typeof PagePlacementAlternation
export type TPagePlacementAlternationEnterprise = `${PagePlacementAlternation}`

enum PrintAccuracy {
  Auto = "Авто",
  Accurate = "Точная",
}

export const ZPrintAccuracy = z.enum(Object.keys(PrintAccuracy) as [TPrintAccuracy, ...TPrintAccuracy[]])
export const ZPrintAccuracyEnterprise = z.enum(Object.values(PrintAccuracy) as [TPrintAccuracyEnterprise, ...TPrintAccuracyEnterprise[]])

export type TPrintAccuracy = keyof typeof PrintAccuracy
export type TPrintAccuracyEnterprise = `${PrintAccuracy}`

enum SpreadsheetDocumentAreaFillType {
  Parameter = "Параметр",
  Text = "Текст",
  Template = "Шаблон",
}

export const ZSpreadsheetDocumentAreaFillType = z.enum(Object.keys(SpreadsheetDocumentAreaFillType) as [TSpreadsheetDocumentAreaFillType, ...TSpreadsheetDocumentAreaFillType[]])
export const ZSpreadsheetDocumentAreaFillTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentAreaFillType) as [TSpreadsheetDocumentAreaFillTypeEnterprise, ...TSpreadsheetDocumentAreaFillTypeEnterprise[]])

export type TSpreadsheetDocumentAreaFillType = keyof typeof SpreadsheetDocumentAreaFillType
export type TSpreadsheetDocumentAreaFillTypeEnterprise = `${SpreadsheetDocumentAreaFillType}`

enum SpreadsheetDocumentCellAreaType {
  Columns = "Колонки",
  Rectangle = "Прямоугольник",
  Rows = "Строки",
  Table = "Таблица",
}

export const ZSpreadsheetDocumentCellAreaType = z.enum(Object.keys(SpreadsheetDocumentCellAreaType) as [TSpreadsheetDocumentCellAreaType, ...TSpreadsheetDocumentCellAreaType[]])
export const ZSpreadsheetDocumentCellAreaTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentCellAreaType) as [TSpreadsheetDocumentCellAreaTypeEnterprise, ...TSpreadsheetDocumentCellAreaTypeEnterprise[]])

export type TSpreadsheetDocumentCellAreaType = keyof typeof SpreadsheetDocumentCellAreaType
export type TSpreadsheetDocumentCellAreaTypeEnterprise = `${SpreadsheetDocumentCellAreaType}`

enum SpreadsheetDocumentCellLineType {
  LargeDashed = "БольшойПунктир",
  Double = "Двойная",
  None = "НетЛинии",
  ThinDashed = "РедкийПунктир",
  Solid = "Сплошная",
  Dotted = "Точечная",
  ThickDashed = "ЧастыйПунктир",
}

export const ZSpreadsheetDocumentCellLineType = z.enum(Object.keys(SpreadsheetDocumentCellLineType) as [TSpreadsheetDocumentCellLineType, ...TSpreadsheetDocumentCellLineType[]])
export const ZSpreadsheetDocumentCellLineTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentCellLineType) as [TSpreadsheetDocumentCellLineTypeEnterprise, ...TSpreadsheetDocumentCellLineTypeEnterprise[]])

export type TSpreadsheetDocumentCellLineType = keyof typeof SpreadsheetDocumentCellLineType
export type TSpreadsheetDocumentCellLineTypeEnterprise = `${SpreadsheetDocumentCellLineType}`

enum SpreadsheetDocumentDetailUse {
  WithoutProcessing = "БезОбработки",
  Row = "Строка",
  Cell = "Ячейка",
}

export const ZSpreadsheetDocumentDetailUse = z.enum(Object.keys(SpreadsheetDocumentDetailUse) as [TSpreadsheetDocumentDetailUse, ...TSpreadsheetDocumentDetailUse[]])
export const ZSpreadsheetDocumentDetailUseEnterprise = z.enum(Object.values(SpreadsheetDocumentDetailUse) as [TSpreadsheetDocumentDetailUseEnterprise, ...TSpreadsheetDocumentDetailUseEnterprise[]])

export type TSpreadsheetDocumentDetailUse = keyof typeof SpreadsheetDocumentDetailUse
export type TSpreadsheetDocumentDetailUseEnterprise = `${SpreadsheetDocumentDetailUse}`

enum SpreadsheetDocumentDrawingLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export const ZSpreadsheetDocumentDrawingLineType = z.enum(Object.keys(SpreadsheetDocumentDrawingLineType) as [TSpreadsheetDocumentDrawingLineType, ...TSpreadsheetDocumentDrawingLineType[]])
export const ZSpreadsheetDocumentDrawingLineTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentDrawingLineType) as [TSpreadsheetDocumentDrawingLineTypeEnterprise, ...TSpreadsheetDocumentDrawingLineTypeEnterprise[]])

export type TSpreadsheetDocumentDrawingLineType = keyof typeof SpreadsheetDocumentDrawingLineType
export type TSpreadsheetDocumentDrawingLineTypeEnterprise = `${SpreadsheetDocumentDrawingLineType}`

enum SpreadsheetDocumentDrawingType {
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

export const ZSpreadsheetDocumentDrawingType = z.enum(Object.keys(SpreadsheetDocumentDrawingType) as [TSpreadsheetDocumentDrawingType, ...TSpreadsheetDocumentDrawingType[]])
export const ZSpreadsheetDocumentDrawingTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentDrawingType) as [TSpreadsheetDocumentDrawingTypeEnterprise, ...TSpreadsheetDocumentDrawingTypeEnterprise[]])

export type TSpreadsheetDocumentDrawingType = keyof typeof SpreadsheetDocumentDrawingType
export type TSpreadsheetDocumentDrawingTypeEnterprise = `${SpreadsheetDocumentDrawingType}`

enum SpreadsheetDocumentFileType {
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

export const ZSpreadsheetDocumentFileType = z.enum(Object.keys(SpreadsheetDocumentFileType) as [TSpreadsheetDocumentFileType, ...TSpreadsheetDocumentFileType[]])
export const ZSpreadsheetDocumentFileTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentFileType) as [TSpreadsheetDocumentFileTypeEnterprise, ...TSpreadsheetDocumentFileTypeEnterprise[]])

export type TSpreadsheetDocumentFileType = keyof typeof SpreadsheetDocumentFileType
export type TSpreadsheetDocumentFileTypeEnterprise = `${SpreadsheetDocumentFileType}`

enum SpreadsheetDocumentGroupHeaderPlacement {
  Auto = "Авто",
  End = "Конец",
  Begin = "Начало",
}

export const ZSpreadsheetDocumentGroupHeaderPlacement = z.enum(Object.keys(SpreadsheetDocumentGroupHeaderPlacement) as [TSpreadsheetDocumentGroupHeaderPlacement, ...TSpreadsheetDocumentGroupHeaderPlacement[]])
export const ZSpreadsheetDocumentGroupHeaderPlacementEnterprise = z.enum(Object.values(SpreadsheetDocumentGroupHeaderPlacement) as [TSpreadsheetDocumentGroupHeaderPlacementEnterprise, ...TSpreadsheetDocumentGroupHeaderPlacementEnterprise[]])

export type TSpreadsheetDocumentGroupHeaderPlacement = keyof typeof SpreadsheetDocumentGroupHeaderPlacement
export type TSpreadsheetDocumentGroupHeaderPlacementEnterprise = `${SpreadsheetDocumentGroupHeaderPlacement}`

enum SpreadsheetDocumentPatternType {
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

export const ZSpreadsheetDocumentPatternType = z.enum(Object.keys(SpreadsheetDocumentPatternType) as [TSpreadsheetDocumentPatternType, ...TSpreadsheetDocumentPatternType[]])
export const ZSpreadsheetDocumentPatternTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentPatternType) as [TSpreadsheetDocumentPatternTypeEnterprise, ...TSpreadsheetDocumentPatternTypeEnterprise[]])

export type TSpreadsheetDocumentPatternType = keyof typeof SpreadsheetDocumentPatternType
export type TSpreadsheetDocumentPatternTypeEnterprise = `${SpreadsheetDocumentPatternType}`

enum SpreadsheetDocumentPointerType {
  Regular = "Обычные",
  Special = "Специальные",
}

export const ZSpreadsheetDocumentPointerType = z.enum(Object.keys(SpreadsheetDocumentPointerType) as [TSpreadsheetDocumentPointerType, ...TSpreadsheetDocumentPointerType[]])
export const ZSpreadsheetDocumentPointerTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentPointerType) as [TSpreadsheetDocumentPointerTypeEnterprise, ...TSpreadsheetDocumentPointerTypeEnterprise[]])

export type TSpreadsheetDocumentPointerType = keyof typeof SpreadsheetDocumentPointerType
export type TSpreadsheetDocumentPointerTypeEnterprise = `${SpreadsheetDocumentPointerType}`

enum SpreadsheetDocumentSavedPicturesDensity {
  High = "Высокая",
  Original = "Исходная",
  Low = "Низкая",
  Medium = "Средняя",
}

export const ZSpreadsheetDocumentSavedPicturesDensity = z.enum(Object.keys(SpreadsheetDocumentSavedPicturesDensity) as [TSpreadsheetDocumentSavedPicturesDensity, ...TSpreadsheetDocumentSavedPicturesDensity[]])
export const ZSpreadsheetDocumentSavedPicturesDensityEnterprise = z.enum(Object.values(SpreadsheetDocumentSavedPicturesDensity) as [TSpreadsheetDocumentSavedPicturesDensityEnterprise, ...TSpreadsheetDocumentSavedPicturesDensityEnterprise[]])

export type TSpreadsheetDocumentSavedPicturesDensity = keyof typeof SpreadsheetDocumentSavedPicturesDensity
export type TSpreadsheetDocumentSavedPicturesDensityEnterprise = `${SpreadsheetDocumentSavedPicturesDensity}`

enum SpreadsheetDocumentSelectionShowModeType {
  Always = "Всегда",
  WhenActive = "ПриАктивности",
}

export const ZSpreadsheetDocumentSelectionShowModeType = z.enum(Object.keys(SpreadsheetDocumentSelectionShowModeType) as [TSpreadsheetDocumentSelectionShowModeType, ...TSpreadsheetDocumentSelectionShowModeType[]])
export const ZSpreadsheetDocumentSelectionShowModeTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentSelectionShowModeType) as [TSpreadsheetDocumentSelectionShowModeTypeEnterprise, ...TSpreadsheetDocumentSelectionShowModeTypeEnterprise[]])

export type TSpreadsheetDocumentSelectionShowModeType = keyof typeof SpreadsheetDocumentSelectionShowModeType
export type TSpreadsheetDocumentSelectionShowModeTypeEnterprise = `${SpreadsheetDocumentSelectionShowModeType}`

enum SpreadsheetDocumentShiftType {
  WithoutShift = "БезСмещения",
  Vertical = "ПоВертикали",
  Horizontal = "ПоГоризонтали",
}

export const ZSpreadsheetDocumentShiftType = z.enum(Object.keys(SpreadsheetDocumentShiftType) as [TSpreadsheetDocumentShiftType, ...TSpreadsheetDocumentShiftType[]])
export const ZSpreadsheetDocumentShiftTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentShiftType) as [TSpreadsheetDocumentShiftTypeEnterprise, ...TSpreadsheetDocumentShiftTypeEnterprise[]])

export type TSpreadsheetDocumentShiftType = keyof typeof SpreadsheetDocumentShiftType
export type TSpreadsheetDocumentShiftTypeEnterprise = `${SpreadsheetDocumentShiftType}`

enum SpreadsheetDocumentStepDirectionType {
  WithoutMove = "БезПерехода",
  ByColumns = "ПоКолонкам",
  ByRows = "ПоСтрокам",
}

export const ZSpreadsheetDocumentStepDirectionType = z.enum(Object.keys(SpreadsheetDocumentStepDirectionType) as [TSpreadsheetDocumentStepDirectionType, ...TSpreadsheetDocumentStepDirectionType[]])
export const ZSpreadsheetDocumentStepDirectionTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentStepDirectionType) as [TSpreadsheetDocumentStepDirectionTypeEnterprise, ...TSpreadsheetDocumentStepDirectionTypeEnterprise[]])

export type TSpreadsheetDocumentStepDirectionType = keyof typeof SpreadsheetDocumentStepDirectionType
export type TSpreadsheetDocumentStepDirectionTypeEnterprise = `${SpreadsheetDocumentStepDirectionType}`

enum SpreadsheetDocumentTextPlacementType {
  Auto = "Авто",
  Block = "Забивать",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export const ZSpreadsheetDocumentTextPlacementType = z.enum(Object.keys(SpreadsheetDocumentTextPlacementType) as [TSpreadsheetDocumentTextPlacementType, ...TSpreadsheetDocumentTextPlacementType[]])
export const ZSpreadsheetDocumentTextPlacementTypeEnterprise = z.enum(Object.values(SpreadsheetDocumentTextPlacementType) as [TSpreadsheetDocumentTextPlacementTypeEnterprise, ...TSpreadsheetDocumentTextPlacementTypeEnterprise[]])

export type TSpreadsheetDocumentTextPlacementType = keyof typeof SpreadsheetDocumentTextPlacementType
export type TSpreadsheetDocumentTextPlacementTypeEnterprise = `${SpreadsheetDocumentTextPlacementType}`

enum SpreadsheetDocumentValuesReadingMode {
  Value = "Значение",
  Text = "Текст",
}

export const ZSpreadsheetDocumentValuesReadingMode = z.enum(Object.keys(SpreadsheetDocumentValuesReadingMode) as [TSpreadsheetDocumentValuesReadingMode, ...TSpreadsheetDocumentValuesReadingMode[]])
export const ZSpreadsheetDocumentValuesReadingModeEnterprise = z.enum(Object.values(SpreadsheetDocumentValuesReadingMode) as [TSpreadsheetDocumentValuesReadingModeEnterprise, ...TSpreadsheetDocumentValuesReadingModeEnterprise[]])

export type TSpreadsheetDocumentValuesReadingMode = keyof typeof SpreadsheetDocumentValuesReadingMode
export type TSpreadsheetDocumentValuesReadingModeEnterprise = `${SpreadsheetDocumentValuesReadingMode}`

enum TextPositionRelativeToPicture {
  Auto = "Авто",
  OnTop = "Поверх",
  Top = "Сверху",
  Left = "Слева",
  Bottom = "Снизу",
  Right = "Справа",
}

export const ZTextPositionRelativeToPicture = z.enum(Object.keys(TextPositionRelativeToPicture) as [TTextPositionRelativeToPicture, ...TTextPositionRelativeToPicture[]])
export const ZTextPositionRelativeToPictureEnterprise = z.enum(Object.values(TextPositionRelativeToPicture) as [TTextPositionRelativeToPictureEnterprise, ...TTextPositionRelativeToPictureEnterprise[]])

export type TTextPositionRelativeToPicture = keyof typeof TextPositionRelativeToPicture
export type TTextPositionRelativeToPictureEnterprise = `${TextPositionRelativeToPicture}`

enum UseSpreadsheetDocumentWidthReduction {
  Auto = "Авто",
  DoNotReduceOnExcess = "ПриПревышенииНеСжимать",
  ReduceToMinimumOnExcess = "ПриПревышенииСжиматьДоМинимума",
  ReduceAlways = "СжиматьВсегда",
}

export const ZUseSpreadsheetDocumentWidthReduction = z.enum(Object.keys(UseSpreadsheetDocumentWidthReduction) as [TUseSpreadsheetDocumentWidthReduction, ...TUseSpreadsheetDocumentWidthReduction[]])
export const ZUseSpreadsheetDocumentWidthReductionEnterprise = z.enum(Object.values(UseSpreadsheetDocumentWidthReduction) as [TUseSpreadsheetDocumentWidthReductionEnterprise, ...TUseSpreadsheetDocumentWidthReductionEnterprise[]])

export type TUseSpreadsheetDocumentWidthReduction = keyof typeof UseSpreadsheetDocumentWidthReduction
export type TUseSpreadsheetDocumentWidthReductionEnterprise = `${UseSpreadsheetDocumentWidthReduction}`

enum QueryRecordType {
  DetailRecord = "ДетальнаяЗапись",
  GroupTotal = "ИтогПоГруппировке",
  TotalByHierarchy = "ИтогПоИерархии",
  Overall = "ОбщийИтог",
}

export const ZQueryRecordType = z.enum(Object.keys(QueryRecordType) as [TQueryRecordType, ...TQueryRecordType[]])
export const ZQueryRecordTypeEnterprise = z.enum(Object.values(QueryRecordType) as [TQueryRecordTypeEnterprise, ...TQueryRecordTypeEnterprise[]])

export type TQueryRecordType = keyof typeof QueryRecordType
export type TQueryRecordTypeEnterprise = `${QueryRecordType}`

enum QueryResultIteration {
  ByGroups = "ПоГруппировкам",
  ByGroupsWithHierarchy = "ПоГруппировкамСИерархией",
  Linear = "Прямой",
}

export const ZQueryResultIteration = z.enum(Object.keys(QueryResultIteration) as [TQueryResultIteration, ...TQueryResultIteration[]])
export const ZQueryResultIterationEnterprise = z.enum(Object.values(QueryResultIteration) as [TQueryResultIterationEnterprise, ...TQueryResultIterationEnterprise[]])

export type TQueryResultIteration = keyof typeof QueryResultIteration
export type TQueryResultIterationEnterprise = `${QueryResultIteration}`

enum ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod {
  StronglyConnectedComponents = "КомпонентыСильнойСвязности",
  StronglyConnectedComponentsWithNoInnerConnectionRequired = "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент",
  WeaklyConnectedComponents = "КомпонентыСлабойСвязности",
}

export const ZConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod = z.enum(Object.keys(ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod) as [TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod, ...TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod[]])
export const ZConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise = z.enum(Object.values(ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod) as [TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise, ...TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise[]])

export type TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod = keyof typeof ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod
export type TConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise = `${ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod}`

enum AdditionalUserVerificationMethod {
  BiometricsOrPassword = "БиометрическаяИлиВводПароля",
  BiometricsOnly = "ТолькоБиометрическая",
}

export const ZAdditionalUserVerificationMethod = z.enum(Object.keys(AdditionalUserVerificationMethod) as [TAdditionalUserVerificationMethod, ...TAdditionalUserVerificationMethod[]])
export const ZAdditionalUserVerificationMethodEnterprise = z.enum(Object.values(AdditionalUserVerificationMethod) as [TAdditionalUserVerificationMethodEnterprise, ...TAdditionalUserVerificationMethodEnterprise[]])

export type TAdditionalUserVerificationMethod = keyof typeof AdditionalUserVerificationMethod
export type TAdditionalUserVerificationMethodEnterprise = `${AdditionalUserVerificationMethod}`

enum BiometricVerificationMethod {
  None = "Нет",
  FaceRecognition = "РаспознаваниеЛица",
  FingerprintRecognition = "РаспознаваниеОтпечаткаПальца",
  IrisRecognition = "РаспознаваниеРадужнойОболочкиГлаза",
}

export const ZBiometricVerificationMethod = z.enum(Object.keys(BiometricVerificationMethod) as [TBiometricVerificationMethod, ...TBiometricVerificationMethod[]])
export const ZBiometricVerificationMethodEnterprise = z.enum(Object.values(BiometricVerificationMethod) as [TBiometricVerificationMethodEnterprise, ...TBiometricVerificationMethodEnterprise[]])

export type TBiometricVerificationMethod = keyof typeof BiometricVerificationMethod
export type TBiometricVerificationMethodEnterprise = `${BiometricVerificationMethod}`

enum SecureStorageAccessProtectionMethod {
  None = "Нет",
  AdditionalUserVerificationRequired = "ТребуетсяДополнительнаяПроверкаПользователя",
  ScreenUnlockRequired = "ТребуетсяРазблокировкаЭкрана",
}

export const ZSecureStorageAccessProtectionMethod = z.enum(Object.keys(SecureStorageAccessProtectionMethod) as [TSecureStorageAccessProtectionMethod, ...TSecureStorageAccessProtectionMethod[]])
export const ZSecureStorageAccessProtectionMethodEnterprise = z.enum(Object.values(SecureStorageAccessProtectionMethod) as [TSecureStorageAccessProtectionMethodEnterprise, ...TSecureStorageAccessProtectionMethodEnterprise[]])

export type TSecureStorageAccessProtectionMethod = keyof typeof SecureStorageAccessProtectionMethod
export type TSecureStorageAccessProtectionMethodEnterprise = `${SecureStorageAccessProtectionMethod}`

enum ErrorCategory {
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

export const ZErrorCategory = z.enum(Object.keys(ErrorCategory) as [TErrorCategory, ...TErrorCategory[]])
export const ZErrorCategoryEnterprise = z.enum(Object.values(ErrorCategory) as [TErrorCategoryEnterprise, ...TErrorCategoryEnterprise[]])

export type TErrorCategory = keyof typeof ErrorCategory
export type TErrorCategoryEnterprise = `${ErrorCategory}`

enum ErrorMessageDisplayVariant {
  Auto = "Авто",
  BriefErrorDescription = "КраткоеПредставлениеОшибки",
  DetailErrorDescription = "ПодробноеПредставлениеОшибки",
  ErrorMessageForUser = "СообщениеОбОшибкеДляПользователя",
}

export const ZErrorMessageDisplayVariant = z.enum(Object.keys(ErrorMessageDisplayVariant) as [TErrorMessageDisplayVariant, ...TErrorMessageDisplayVariant[]])
export const ZErrorMessageDisplayVariantEnterprise = z.enum(Object.values(ErrorMessageDisplayVariant) as [TErrorMessageDisplayVariantEnterprise, ...TErrorMessageDisplayVariantEnterprise[]])

export type TErrorMessageDisplayVariant = keyof typeof ErrorMessageDisplayVariant
export type TErrorMessageDisplayVariantEnterprise = `${ErrorMessageDisplayVariant}`

enum ErrorReportingMode {
  Auto = "Авто",
  DontSend = "НеОтправлять",
  Send = "Отправлять",
  AskUser = "СпрашиватьПользователя",
}

export const ZErrorReportingMode = z.enum(Object.keys(ErrorReportingMode) as [TErrorReportingMode, ...TErrorReportingMode[]])
export const ZErrorReportingModeEnterprise = z.enum(Object.values(ErrorReportingMode) as [TErrorReportingModeEnterprise, ...TErrorReportingModeEnterprise[]])

export type TErrorReportingMode = keyof typeof ErrorReportingMode
export type TErrorReportingModeEnterprise = `${ErrorReportingMode}`

enum MobileClientSignatureVerificationMethod {
  DoNotVerifySignature = "НеВыполнятьПроверкуПодписи",
  CheckMobileClientUsageAbility = "ПроверятьВозможностьИспользованияМобильногоКлиента",
  CheckConfigurationSignatureForExactMatch = "ПроверятьТочноеСоответствиеПодписиКонфигурации",
}

export const ZMobileClientSignatureVerificationMethod = z.enum(Object.keys(MobileClientSignatureVerificationMethod) as [TMobileClientSignatureVerificationMethod, ...TMobileClientSignatureVerificationMethod[]])
export const ZMobileClientSignatureVerificationMethodEnterprise = z.enum(Object.values(MobileClientSignatureVerificationMethod) as [TMobileClientSignatureVerificationMethodEnterprise, ...TMobileClientSignatureVerificationMethodEnterprise[]])

export type TMobileClientSignatureVerificationMethod = keyof typeof MobileClientSignatureVerificationMethod
export type TMobileClientSignatureVerificationMethodEnterprise = `${MobileClientSignatureVerificationMethod}`

enum OnMainServerUnavalableBehavior {
  Auto = "Авто",
  DontChangeBehavior = "НеИзменятьПоведение",
  MakeDisable = "ОтключитьДоступность",
}

export const ZOnMainServerUnavalableBehavior = z.enum(Object.keys(OnMainServerUnavalableBehavior) as [TOnMainServerUnavalableBehavior, ...TOnMainServerUnavalableBehavior[]])
export const ZOnMainServerUnavalableBehaviorEnterprise = z.enum(Object.values(OnMainServerUnavalableBehavior) as [TOnMainServerUnavalableBehaviorEnterprise, ...TOnMainServerUnavalableBehaviorEnterprise[]])

export type TOnMainServerUnavalableBehavior = keyof typeof OnMainServerUnavalableBehavior
export type TOnMainServerUnavalableBehaviorEnterprise = `${OnMainServerUnavalableBehavior}`

enum UsedServer {
  Standalone = "Автономный",
  Main = "Основной",
}

export const ZUsedServer = z.enum(Object.keys(UsedServer) as [TUsedServer, ...TUsedServer[]])
export const ZUsedServerEnterprise = z.enum(Object.values(UsedServer) as [TUsedServerEnterprise, ...TUsedServerEnterprise[]])

export type TUsedServer = keyof typeof UsedServer
export type TUsedServerEnterprise = `${UsedServer}`

enum PDFAttachmentRelationshipType {
  Alternative = "Альтернатива",
  Data = "Данные",
  Supplement = "Дополнение",
  Source = "Источник",
  Unspecified = "НеУстановлено",
}

export const ZPDFAttachmentRelationshipType = z.enum(Object.keys(PDFAttachmentRelationshipType) as [TPDFAttachmentRelationshipType, ...TPDFAttachmentRelationshipType[]])
export const ZPDFAttachmentRelationshipTypeEnterprise = z.enum(Object.values(PDFAttachmentRelationshipType) as [TPDFAttachmentRelationshipTypeEnterprise, ...TPDFAttachmentRelationshipTypeEnterprise[]])

export type TPDFAttachmentRelationshipType = keyof typeof PDFAttachmentRelationshipType
export type TPDFAttachmentRelationshipTypeEnterprise = `${PDFAttachmentRelationshipType}`

enum PDFDocumentFileType {
  PDF = "PDF",
  PDF_A_1 = "PDF_A_1",
  PDF_A_2 = "PDF_A_2",
  PDF_A_3 = "PDF_A_3",
}

export const ZPDFDocumentFileType = z.enum(Object.keys(PDFDocumentFileType) as [TPDFDocumentFileType, ...TPDFDocumentFileType[]])
export const ZPDFDocumentFileTypeEnterprise = z.enum(Object.values(PDFDocumentFileType) as [TPDFDocumentFileTypeEnterprise, ...TPDFDocumentFileTypeEnterprise[]])

export type TPDFDocumentFileType = keyof typeof PDFDocumentFileType
export type TPDFDocumentFileTypeEnterprise = `${PDFDocumentFileType}`

enum PDFModificationAccessPermissions {
  FillingSigning = "ЗаполнениеПодписание",
  FillingSigningAnnotation = "ЗаполнениеПодписаниеАннотирование",
  None = "Нет",
}

export const ZPDFModificationAccessPermissions = z.enum(Object.keys(PDFModificationAccessPermissions) as [TPDFModificationAccessPermissions, ...TPDFModificationAccessPermissions[]])
export const ZPDFModificationAccessPermissionsEnterprise = z.enum(Object.values(PDFModificationAccessPermissions) as [TPDFModificationAccessPermissionsEnterprise, ...TPDFModificationAccessPermissionsEnterprise[]])

export type TPDFModificationAccessPermissions = keyof typeof PDFModificationAccessPermissions
export type TPDFModificationAccessPermissionsEnterprise = `${PDFModificationAccessPermissions}`

enum PDFSignatureType {
  Certifying = "Сертифицирующая",
  Approving = "Утверждающая",
}

export const ZPDFSignatureType = z.enum(Object.keys(PDFSignatureType) as [TPDFSignatureType, ...TPDFSignatureType[]])
export const ZPDFSignatureTypeEnterprise = z.enum(Object.values(PDFSignatureType) as [TPDFSignatureTypeEnterprise, ...TPDFSignatureTypeEnterprise[]])

export type TPDFSignatureType = keyof typeof PDFSignatureType
export type TPDFSignatureTypeEnterprise = `${PDFSignatureType}`

enum ProgressiveWebApplicationMode {
  InBrowserWindow = "ВОкнеБраузера",
  InStandaloneWindow = "ВОтдельномОкне",
}

export const ZProgressiveWebApplicationMode = z.enum(Object.keys(ProgressiveWebApplicationMode) as [TProgressiveWebApplicationMode, ...TProgressiveWebApplicationMode[]])
export const ZProgressiveWebApplicationModeEnterprise = z.enum(Object.values(ProgressiveWebApplicationMode) as [TProgressiveWebApplicationModeEnterprise, ...TProgressiveWebApplicationModeEnterprise[]])

export type TProgressiveWebApplicationMode = keyof typeof ProgressiveWebApplicationMode
export type TProgressiveWebApplicationModeEnterprise = `${ProgressiveWebApplicationMode}`

enum AdditionalShowMode {
  Irrelevance = "Неактуальность",
  DontUse = "НеИспользовать",
}

export const ZAdditionalShowMode = z.enum(Object.keys(AdditionalShowMode) as [TAdditionalShowMode, ...TAdditionalShowMode[]])
export const ZAdditionalShowModeEnterprise = z.enum(Object.values(AdditionalShowMode) as [TAdditionalShowModeEnterprise, ...TAdditionalShowModeEnterprise[]])

export type TAdditionalShowMode = keyof typeof AdditionalShowMode
export type TAdditionalShowModeEnterprise = `${AdditionalShowMode}`

enum AppearanceAreaType {
  Group = "Группировка",
  Field = "Поле",
}

export const ZAppearanceAreaType = z.enum(Object.keys(AppearanceAreaType) as [TAppearanceAreaType, ...TAppearanceAreaType[]])
export const ZAppearanceAreaTypeEnterprise = z.enum(Object.values(AppearanceAreaType) as [TAppearanceAreaTypeEnterprise, ...TAppearanceAreaTypeEnterprise[]])

export type TAppearanceAreaType = keyof typeof AppearanceAreaType
export type TAppearanceAreaTypeEnterprise = `${AppearanceAreaType}`

enum ArrowStyle {
  Filled = "Заполненная",
  Blank = "Незаполненная",
  None = "Нет",
}

export const ZArrowStyle = z.enum(Object.keys(ArrowStyle) as [TArrowStyle, ...TArrowStyle[]])
export const ZArrowStyleEnterprise = z.enum(Object.values(ArrowStyle) as [TArrowStyleEnterprise, ...TArrowStyleEnterprise[]])

export type TArrowStyle = keyof typeof ArrowStyle
export type TArrowStyleEnterprise = `${ArrowStyle}`

enum AutoCapitalizationOnTextInput {
  Auto = "Авто",
  AllCharacters = "ВсеСимволы",
  None = "Нет",
  Sentences = "Предложения",
  Words = "Слова",
}

export const ZAutoCapitalizationOnTextInput = z.enum(Object.keys(AutoCapitalizationOnTextInput) as [TAutoCapitalizationOnTextInput, ...TAutoCapitalizationOnTextInput[]])
export const ZAutoCapitalizationOnTextInputEnterprise = z.enum(Object.values(AutoCapitalizationOnTextInput) as [TAutoCapitalizationOnTextInputEnterprise, ...TAutoCapitalizationOnTextInputEnterprise[]])

export type TAutoCapitalizationOnTextInput = keyof typeof AutoCapitalizationOnTextInput
export type TAutoCapitalizationOnTextInputEnterprise = `${AutoCapitalizationOnTextInput}`

enum AutoCorrectionOnTextInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZAutoCorrectionOnTextInput = z.enum(Object.keys(AutoCorrectionOnTextInput) as [TAutoCorrectionOnTextInput, ...TAutoCorrectionOnTextInput[]])
export const ZAutoCorrectionOnTextInputEnterprise = z.enum(Object.values(AutoCorrectionOnTextInput) as [TAutoCorrectionOnTextInputEnterprise, ...TAutoCorrectionOnTextInputEnterprise[]])

export type TAutoCorrectionOnTextInput = keyof typeof AutoCorrectionOnTextInput
export type TAutoCorrectionOnTextInputEnterprise = `${AutoCorrectionOnTextInput}`

enum AutonumerationInForm {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export const ZAutonumerationInForm = z.enum(Object.keys(AutonumerationInForm) as [TAutonumerationInForm, ...TAutonumerationInForm[]])
export const ZAutonumerationInFormEnterprise = z.enum(Object.values(AutonumerationInForm) as [TAutonumerationInFormEnterprise, ...TAutonumerationInFormEnterprise[]])

export type TAutonumerationInForm = keyof typeof AutonumerationInForm
export type TAutonumerationInFormEnterprise = `${AutonumerationInForm}`

enum AutoSaveFormDataInSettings {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZAutoSaveFormDataInSettings = z.enum(Object.keys(AutoSaveFormDataInSettings) as [TAutoSaveFormDataInSettings, ...TAutoSaveFormDataInSettings[]])
export const ZAutoSaveFormDataInSettingsEnterprise = z.enum(Object.values(AutoSaveFormDataInSettings) as [TAutoSaveFormDataInSettingsEnterprise, ...TAutoSaveFormDataInSettingsEnterprise[]])

export type TAutoSaveFormDataInSettings = keyof typeof AutoSaveFormDataInSettings
export type TAutoSaveFormDataInSettingsEnterprise = `${AutoSaveFormDataInSettings}`

enum AutoShowClearButtonMode {
  Auto = "Авто",
  Always = "Всегда",
  FilledOnly = "ТолькоДляЗаполненного",
}

export const ZAutoShowClearButtonMode = z.enum(Object.keys(AutoShowClearButtonMode) as [TAutoShowClearButtonMode, ...TAutoShowClearButtonMode[]])
export const ZAutoShowClearButtonModeEnterprise = z.enum(Object.values(AutoShowClearButtonMode) as [TAutoShowClearButtonModeEnterprise, ...TAutoShowClearButtonModeEnterprise[]])

export type TAutoShowClearButtonMode = keyof typeof AutoShowClearButtonMode
export type TAutoShowClearButtonModeEnterprise = `${AutoShowClearButtonMode}`

enum AutoShowOpenButtonMode {
  Auto = "Авто",
  Always = "Всегда",
  FilledOnly = "ТолькоДляЗаполненного",
}

export const ZAutoShowOpenButtonMode = z.enum(Object.keys(AutoShowOpenButtonMode) as [TAutoShowOpenButtonMode, ...TAutoShowOpenButtonMode[]])
export const ZAutoShowOpenButtonModeEnterprise = z.enum(Object.values(AutoShowOpenButtonMode) as [TAutoShowOpenButtonModeEnterprise, ...TAutoShowOpenButtonModeEnterprise[]])

export type TAutoShowOpenButtonMode = keyof typeof AutoShowOpenButtonMode
export type TAutoShowOpenButtonModeEnterprise = `${AutoShowOpenButtonMode}`

enum AutoShowStateMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
  ShowOnComposition = "ОтображатьПриФормировании",
}

export const ZAutoShowStateMode = z.enum(Object.keys(AutoShowStateMode) as [TAutoShowStateMode, ...TAutoShowStateMode[]])
export const ZAutoShowStateModeEnterprise = z.enum(Object.values(AutoShowStateMode) as [TAutoShowStateModeEnterprise, ...TAutoShowStateModeEnterprise[]])

export type TAutoShowStateMode = keyof typeof AutoShowStateMode
export type TAutoShowStateModeEnterprise = `${AutoShowStateMode}`

enum ButtonGroupRepresentation {
  Auto = "Авто",
  Compact = "Компактное",
  Usual = "Обычное",
}

export const ZButtonGroupRepresentation = z.enum(Object.keys(ButtonGroupRepresentation) as [TButtonGroupRepresentation, ...TButtonGroupRepresentation[]])
export const ZButtonGroupRepresentationEnterprise = z.enum(Object.values(ButtonGroupRepresentation) as [TButtonGroupRepresentationEnterprise, ...TButtonGroupRepresentationEnterprise[]])

export type TButtonGroupRepresentation = keyof typeof ButtonGroupRepresentation
export type TButtonGroupRepresentationEnterprise = `${ButtonGroupRepresentation}`

enum ButtonLocationInCommandBar {
  Auto = "Авто",
  InAdditionalSubmenu = "ВДополнительномПодменю",
  InCommandBar = "ВКоманднойПанели",
  InCommandBarAndInAdditionalSubmenu = "ВКоманднойПанелиИВДополнительномПодменю",
}

export const ZButtonLocationInCommandBar = z.enum(Object.keys(ButtonLocationInCommandBar) as [TButtonLocationInCommandBar, ...TButtonLocationInCommandBar[]])
export const ZButtonLocationInCommandBarEnterprise = z.enum(Object.values(ButtonLocationInCommandBar) as [TButtonLocationInCommandBarEnterprise, ...TButtonLocationInCommandBarEnterprise[]])

export type TButtonLocationInCommandBar = keyof typeof ButtonLocationInCommandBar
export type TButtonLocationInCommandBarEnterprise = `${ButtonLocationInCommandBar}`

enum ButtonPictureLocation {
  Left = "Лево",
  Right = "Право",
}

export const ZButtonPictureLocation = z.enum(Object.keys(ButtonPictureLocation) as [TButtonPictureLocation, ...TButtonPictureLocation[]])
export const ZButtonPictureLocationEnterprise = z.enum(Object.values(ButtonPictureLocation) as [TButtonPictureLocationEnterprise, ...TButtonPictureLocationEnterprise[]])

export type TButtonPictureLocation = keyof typeof ButtonPictureLocation
export type TButtonPictureLocationEnterprise = `${ButtonPictureLocation}`

enum ButtonRepresentation {
  Auto = "Авто",
  Picture = "Картинка",
  PictureAndText = "КартинкаИТекст",
  Text = "Текст",
}

export const ZButtonRepresentation = z.enum(Object.keys(ButtonRepresentation) as [TButtonRepresentation, ...TButtonRepresentation[]])
export const ZButtonRepresentationEnterprise = z.enum(Object.values(ButtonRepresentation) as [TButtonRepresentationEnterprise, ...TButtonRepresentationEnterprise[]])

export type TButtonRepresentation = keyof typeof ButtonRepresentation
export type TButtonRepresentationEnterprise = `${ButtonRepresentation}`

enum ButtonShape {
  Auto = "Авто",
  Usual = "Обычная",
  Oval = "Овал",
}

export const ZButtonShape = z.enum(Object.keys(ButtonShape) as [TButtonShape, ...TButtonShape[]])
export const ZButtonShapeEnterprise = z.enum(Object.values(ButtonShape) as [TButtonShapeEnterprise, ...TButtonShapeEnterprise[]])

export type TButtonShape = keyof typeof ButtonShape
export type TButtonShapeEnterprise = `${ButtonShape}`

enum ButtonShapeRepresentation {
  Auto = "Авто",
  Always = "Всегда",
  None = "Нет",
  WhenActive = "ПриАктивности",
}

export const ZButtonShapeRepresentation = z.enum(Object.keys(ButtonShapeRepresentation) as [TButtonShapeRepresentation, ...TButtonShapeRepresentation[]])
export const ZButtonShapeRepresentationEnterprise = z.enum(Object.values(ButtonShapeRepresentation) as [TButtonShapeRepresentationEnterprise, ...TButtonShapeRepresentationEnterprise[]])

export type TButtonShapeRepresentation = keyof typeof ButtonShapeRepresentation
export type TButtonShapeRepresentationEnterprise = `${ButtonShapeRepresentation}`

enum AutoSeriesSeparation {
  All = "Все",
  Maximum = "Максимум",
  Minimum = "Минимум",
  None = "Нет",
}

export const ZAutoSeriesSeparation = z.enum(Object.keys(AutoSeriesSeparation) as [TAutoSeriesSeparation, ...TAutoSeriesSeparation[]])
export const ZAutoSeriesSeparationEnterprise = z.enum(Object.values(AutoSeriesSeparation) as [TAutoSeriesSeparationEnterprise, ...TAutoSeriesSeparationEnterprise[]])

export type TAutoSeriesSeparation = keyof typeof AutoSeriesSeparation
export type TAutoSeriesSeparationEnterprise = `${AutoSeriesSeparation}`

enum BarChartPointsOrder {
  Auto = "Авто",
  TopToBottom = "СверхуВниз",
  BottomToTop = "СнизуВверх",
}

export const ZBarChartPointsOrder = z.enum(Object.keys(BarChartPointsOrder) as [TBarChartPointsOrder, ...TBarChartPointsOrder[]])
export const ZBarChartPointsOrderEnterprise = z.enum(Object.values(BarChartPointsOrder) as [TBarChartPointsOrderEnterprise, ...TBarChartPointsOrderEnterprise[]])

export type TBarChartPointsOrder = keyof typeof BarChartPointsOrder
export type TBarChartPointsOrderEnterprise = `${BarChartPointsOrder}`

enum BubbleChartNegativeValuesShowMode {
  InvertedBackColor = "ИнвертированныйЦветФона",
  DontShow = "НеОтображать",
  Abs = "ПоМодулю",
  Transparent = "ПрозрачныйФон",
}

export const ZBubbleChartNegativeValuesShowMode = z.enum(Object.keys(BubbleChartNegativeValuesShowMode) as [TBubbleChartNegativeValuesShowMode, ...TBubbleChartNegativeValuesShowMode[]])
export const ZBubbleChartNegativeValuesShowModeEnterprise = z.enum(Object.values(BubbleChartNegativeValuesShowMode) as [TBubbleChartNegativeValuesShowModeEnterprise, ...TBubbleChartNegativeValuesShowModeEnterprise[]])

export type TBubbleChartNegativeValuesShowMode = keyof typeof BubbleChartNegativeValuesShowMode
export type TBubbleChartNegativeValuesShowModeEnterprise = `${BubbleChartNegativeValuesShowMode}`

enum ChartAnimation {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZChartAnimation = z.enum(Object.keys(ChartAnimation) as [TChartAnimation, ...TChartAnimation[]])
export const ZChartAnimationEnterprise = z.enum(Object.values(ChartAnimation) as [TChartAnimationEnterprise, ...TChartAnimationEnterprise[]])

export type TChartAnimation = keyof typeof ChartAnimation
export type TChartAnimationEnterprise = `${ChartAnimation}`

enum ChartBoundaryDetectionMethod {
  AutoDetect = "АвтоОпределение",
  UseValue = "ИспользоватьЗначение",
  UseValueWithLimitations = "ИспользоватьЗначениеСОграничением",
}

export const ZChartBoundaryDetectionMethod = z.enum(Object.keys(ChartBoundaryDetectionMethod) as [TChartBoundaryDetectionMethod, ...TChartBoundaryDetectionMethod[]])
export const ZChartBoundaryDetectionMethodEnterprise = z.enum(Object.values(ChartBoundaryDetectionMethod) as [TChartBoundaryDetectionMethodEnterprise, ...TChartBoundaryDetectionMethodEnterprise[]])

export type TChartBoundaryDetectionMethod = keyof typeof ChartBoundaryDetectionMethod
export type TChartBoundaryDetectionMethodEnterprise = `${ChartBoundaryDetectionMethod}`

enum ChartBubbleSizeValueSource {
  None = "Нет",
  CommonSeries = "ОбщаяСерия",
  NextSeries = "СледующаяСерия",
}

export const ZChartBubbleSizeValueSource = z.enum(Object.keys(ChartBubbleSizeValueSource) as [TChartBubbleSizeValueSource, ...TChartBubbleSizeValueSource[]])
export const ZChartBubbleSizeValueSourceEnterprise = z.enum(Object.values(ChartBubbleSizeValueSource) as [TChartBubbleSizeValueSourceEnterprise, ...TChartBubbleSizeValueSourceEnterprise[]])

export type TChartBubbleSizeValueSource = keyof typeof ChartBubbleSizeValueSource
export type TChartBubbleSizeValueSourceEnterprise = `${ChartBubbleSizeValueSource}`

enum ChartBubbleSizing {
  IncreaseDiameter = "УвеличениеДиаметра",
  IncreaseArea = "УвеличениеПлощади",
  DecreaseDiameter = "УменьшениеДиаметра",
  DecreaseArea = "УменьшениеПлощади",
}

export const ZChartBubbleSizing = z.enum(Object.keys(ChartBubbleSizing) as [TChartBubbleSizing, ...TChartBubbleSizing[]])
export const ZChartBubbleSizingEnterprise = z.enum(Object.values(ChartBubbleSizing) as [TChartBubbleSizingEnterprise, ...TChartBubbleSizingEnterprise[]])

export type TChartBubbleSizing = keyof typeof ChartBubbleSizing
export type TChartBubbleSizingEnterprise = `${ChartBubbleSizing}`

enum ChartColorPalette {
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

export const ZChartColorPalette = z.enum(Object.keys(ChartColorPalette) as [TChartColorPalette, ...TChartColorPalette[]])
export const ZChartColorPaletteEnterprise = z.enum(Object.values(ChartColorPalette) as [TChartColorPaletteEnterprise, ...TChartColorPaletteEnterprise[]])

export type TChartColorPalette = keyof typeof ChartColorPalette
export type TChartColorPaletteEnterprise = `${ChartColorPalette}`

enum ChartGridLinesShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZChartGridLinesShowMode = z.enum(Object.keys(ChartGridLinesShowMode) as [TChartGridLinesShowMode, ...TChartGridLinesShowMode[]])
export const ZChartGridLinesShowModeEnterprise = z.enum(Object.values(ChartGridLinesShowMode) as [TChartGridLinesShowModeEnterprise, ...TChartGridLinesShowModeEnterprise[]])

export type TChartGridLinesShowMode = keyof typeof ChartGridLinesShowMode
export type TChartGridLinesShowModeEnterprise = `${ChartGridLinesShowMode}`

enum ChartLabelLocation {
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

export const ZChartLabelLocation = z.enum(Object.keys(ChartLabelLocation) as [TChartLabelLocation, ...TChartLabelLocation[]])
export const ZChartLabelLocationEnterprise = z.enum(Object.values(ChartLabelLocation) as [TChartLabelLocationEnterprise, ...TChartLabelLocationEnterprise[]])

export type TChartLabelLocation = keyof typeof ChartLabelLocation
export type TChartLabelLocationEnterprise = `${ChartLabelLocation}`

enum ChartLabelsOrientation {
  Auto = "Авто",
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
  CustomAngle = "ПроизвольныйУголНаклона",
}

export const ZChartLabelsOrientation = z.enum(Object.keys(ChartLabelsOrientation) as [TChartLabelsOrientation, ...TChartLabelsOrientation[]])
export const ZChartLabelsOrientationEnterprise = z.enum(Object.values(ChartLabelsOrientation) as [TChartLabelsOrientationEnterprise, ...TChartLabelsOrientationEnterprise[]])

export type TChartLabelsOrientation = keyof typeof ChartLabelsOrientation
export type TChartLabelsOrientationEnterprise = `${ChartLabelsOrientation}`

enum ChartLabelType {
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

export const ZChartLabelType = z.enum(Object.keys(ChartLabelType) as [TChartLabelType, ...TChartLabelType[]])
export const ZChartLabelTypeEnterprise = z.enum(Object.values(ChartLabelType) as [TChartLabelTypeEnterprise, ...TChartLabelTypeEnterprise[]])

export type TChartLabelType = keyof typeof ChartLabelType
export type TChartLabelTypeEnterprise = `${ChartLabelType}`

enum ChartLegendPlacement {
  Auto = "Авто",
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
  UseCoordinates = "УказываетсяРасположение",
}

export const ZChartLegendPlacement = z.enum(Object.keys(ChartLegendPlacement) as [TChartLegendPlacement, ...TChartLegendPlacement[]])
export const ZChartLegendPlacementEnterprise = z.enum(Object.values(ChartLegendPlacement) as [TChartLegendPlacementEnterprise, ...TChartLegendPlacementEnterprise[]])

export type TChartLegendPlacement = keyof typeof ChartLegendPlacement
export type TChartLegendPlacementEnterprise = `${ChartLegendPlacement}`

enum ChartLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export const ZChartLineType = z.enum(Object.keys(ChartLineType) as [TChartLineType, ...TChartLineType[]])
export const ZChartLineTypeEnterprise = z.enum(Object.values(ChartLineType) as [TChartLineTypeEnterprise, ...TChartLineTypeEnterprise[]])

export type TChartLineType = keyof typeof ChartLineType
export type TChartLineTypeEnterprise = `${ChartLineType}`

enum ChartMarkerType {
  Auto = "Авто",
  Rect = "Квадрат",
  Circle = "Круг",
  None = "Нет",
  Rhomb = "Ромб",
  Alternation = "Чередование",
}

export const ZChartMarkerType = z.enum(Object.keys(ChartMarkerType) as [TChartMarkerType, ...TChartMarkerType[]])
export const ZChartMarkerTypeEnterprise = z.enum(Object.values(ChartMarkerType) as [TChartMarkerTypeEnterprise, ...TChartMarkerTypeEnterprise[]])

export type TChartMarkerType = keyof typeof ChartMarkerType
export type TChartMarkerTypeEnterprise = `${ChartMarkerType}`

enum ChartOrientation {
  SouthEast = "ЮгВосток",
  SouthWest = "ЮгЗапад",
}

export const ZChartOrientation = z.enum(Object.keys(ChartOrientation) as [TChartOrientation, ...TChartOrientation[]])
export const ZChartOrientationEnterprise = z.enum(Object.values(ChartOrientation) as [TChartOrientationEnterprise, ...TChartOrientationEnterprise[]])

export type TChartOrientation = keyof typeof ChartOrientation
export type TChartOrientationEnterprise = `${ChartOrientation}`

enum ChartPlotAreaPlacement {
  Auto = "Авто",
  EmptySpace = "СвободноеМесто",
  UseCoordinates = "УказываетсяРасположение",
}

export const ZChartPlotAreaPlacement = z.enum(Object.keys(ChartPlotAreaPlacement) as [TChartPlotAreaPlacement, ...TChartPlotAreaPlacement[]])
export const ZChartPlotAreaPlacementEnterprise = z.enum(Object.values(ChartPlotAreaPlacement) as [TChartPlotAreaPlacementEnterprise, ...TChartPlotAreaPlacementEnterprise[]])

export type TChartPlotAreaPlacement = keyof typeof ChartPlotAreaPlacement
export type TChartPlotAreaPlacementEnterprise = `${ChartPlotAreaPlacement}`

enum ChartPointsAxisValuesSource {
  Auto = "Авто",
  Series = "Серия",
  Points = "Точки",
}

export const ZChartPointsAxisValuesSource = z.enum(Object.keys(ChartPointsAxisValuesSource) as [TChartPointsAxisValuesSource, ...TChartPointsAxisValuesSource[]])
export const ZChartPointsAxisValuesSourceEnterprise = z.enum(Object.values(ChartPointsAxisValuesSource) as [TChartPointsAxisValuesSourceEnterprise, ...TChartPointsAxisValuesSourceEnterprise[]])

export type TChartPointsAxisValuesSource = keyof typeof ChartPointsAxisValuesSource
export type TChartPointsAxisValuesSourceEnterprise = `${ChartPointsAxisValuesSource}`

enum ChartPointsConnectionType {
  Auto = "Авто",
  DontConnect = "НеСоединять",
  Connect = "Соединять",
}

export const ZChartPointsConnectionType = z.enum(Object.keys(ChartPointsConnectionType) as [TChartPointsConnectionType, ...TChartPointsConnectionType[]])
export const ZChartPointsConnectionTypeEnterprise = z.enum(Object.values(ChartPointsConnectionType) as [TChartPointsConnectionTypeEnterprise, ...TChartPointsConnectionTypeEnterprise[]])

export type TChartPointsConnectionType = keyof typeof ChartPointsConnectionType
export type TChartPointsConnectionTypeEnterprise = `${ChartPointsConnectionType}`

enum ChartReferenceBandBorderPosition {
  Auto = "Авто",
  OnValue = "ВЗначении",
  BetweenValues = "МеждуЗначениями",
}

export const ZChartReferenceBandBorderPosition = z.enum(Object.keys(ChartReferenceBandBorderPosition) as [TChartReferenceBandBorderPosition, ...TChartReferenceBandBorderPosition[]])
export const ZChartReferenceBandBorderPositionEnterprise = z.enum(Object.values(ChartReferenceBandBorderPosition) as [TChartReferenceBandBorderPositionEnterprise, ...TChartReferenceBandBorderPositionEnterprise[]])

export type TChartReferenceBandBorderPosition = keyof typeof ChartReferenceBandBorderPosition
export type TChartReferenceBandBorderPositionEnterprise = `${ChartReferenceBandBorderPosition}`

enum ChartReferenceLinePosition {
  Auto = "Авто",
  OnValue = "ВЗначении",
  BetweenValues = "МеждуЗначениями",
}

export const ZChartReferenceLinePosition = z.enum(Object.keys(ChartReferenceLinePosition) as [TChartReferenceLinePosition, ...TChartReferenceLinePosition[]])
export const ZChartReferenceLinePositionEnterprise = z.enum(Object.values(ChartReferenceLinePosition) as [TChartReferenceLinePositionEnterprise, ...TChartReferenceLinePositionEnterprise[]])

export type TChartReferenceLinePosition = keyof typeof ChartReferenceLinePosition
export type TChartReferenceLinePositionEnterprise = `${ChartReferenceLinePosition}`

enum ChartScaleLabelLocation {
  Auto = "Авто",
  Inside = "Внутри",
  None = "Нет",
  Outside = "Снаружи",
}

export const ZChartScaleLabelLocation = z.enum(Object.keys(ChartScaleLabelLocation) as [TChartScaleLabelLocation, ...TChartScaleLabelLocation[]])
export const ZChartScaleLabelLocationEnterprise = z.enum(Object.values(ChartScaleLabelLocation) as [TChartScaleLabelLocationEnterprise, ...TChartScaleLabelLocationEnterprise[]])

export type TChartScaleLabelLocation = keyof typeof ChartScaleLabelLocation
export type TChartScaleLabelLocationEnterprise = `${ChartScaleLabelLocation}`

enum ChartScaleLocation {
  Auto = "Авто",
  BaseValue = "БазовоеЗначение",
  Edge = "Край",
}

export const ZChartScaleLocation = z.enum(Object.keys(ChartScaleLocation) as [TChartScaleLocation, ...TChartScaleLocation[]])
export const ZChartScaleLocationEnterprise = z.enum(Object.values(ChartScaleLocation) as [TChartScaleLocationEnterprise, ...TChartScaleLocationEnterprise[]])

export type TChartScaleLocation = keyof typeof ChartScaleLocation
export type TChartScaleLocationEnterprise = `${ChartScaleLocation}`

enum ChartScaleMarkLocation {
  Auto = "Авто",
  Inside = "Внутри",
  None = "Нет",
  Outside = "Снаружи",
  Center = "Центр",
}

export const ZChartScaleMarkLocation = z.enum(Object.keys(ChartScaleMarkLocation) as [TChartScaleMarkLocation, ...TChartScaleMarkLocation[]])
export const ZChartScaleMarkLocationEnterprise = z.enum(Object.values(ChartScaleMarkLocation) as [TChartScaleMarkLocationEnterprise, ...TChartScaleMarkLocationEnterprise[]])

export type TChartScaleMarkLocation = keyof typeof ChartScaleMarkLocation
export type TChartScaleMarkLocationEnterprise = `${ChartScaleMarkLocation}`

enum ChartScaleTitlePlacement {
  SpecialArea = "ВВыделеннойОбласти",
  PlotArea = "ВОбластиПостроения",
  WithAxis = "РядомСОсью",
}

export const ZChartScaleTitlePlacement = z.enum(Object.keys(ChartScaleTitlePlacement) as [TChartScaleTitlePlacement, ...TChartScaleTitlePlacement[]])
export const ZChartScaleTitlePlacementEnterprise = z.enum(Object.values(ChartScaleTitlePlacement) as [TChartScaleTitlePlacementEnterprise, ...TChartScaleTitlePlacementEnterprise[]])

export type TChartScaleTitlePlacement = keyof typeof ChartScaleTitlePlacement
export type TChartScaleTitlePlacementEnterprise = `${ChartScaleTitlePlacement}`

enum ChartScaleTitleTextSource {
  Auto = "Авто",
  AutoText = "АвтоТекст",
  UseText = "ИспользоватьТекст",
}

export const ZChartScaleTitleTextSource = z.enum(Object.keys(ChartScaleTitleTextSource) as [TChartScaleTitleTextSource, ...TChartScaleTitleTextSource[]])
export const ZChartScaleTitleTextSourceEnterprise = z.enum(Object.values(ChartScaleTitleTextSource) as [TChartScaleTitleTextSourceEnterprise, ...TChartScaleTitleTextSourceEnterprise[]])

export type TChartScaleTitleTextSource = keyof typeof ChartScaleTitleTextSource
export type TChartScaleTitleTextSourceEnterprise = `${ChartScaleTitleTextSource}`

enum ChartSelectionMode {
  Auto = "Авто",
  ValuesSelection = "ВыделениеЗначений",
  PointsSelection = "ВыделениеТочек",
  None = "Нет",
}

export const ZChartSelectionMode = z.enum(Object.keys(ChartSelectionMode) as [TChartSelectionMode, ...TChartSelectionMode[]])
export const ZChartSelectionModeEnterprise = z.enum(Object.values(ChartSelectionMode) as [TChartSelectionModeEnterprise, ...TChartSelectionModeEnterprise[]])

export type TChartSelectionMode = keyof typeof ChartSelectionMode
export type TChartSelectionModeEnterprise = `${ChartSelectionMode}`

enum ChartSemitransparencyMode {
  Auto = "Авто",
  AutoCalculate = "АвтоматическийРасчет",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZChartSemitransparencyMode = z.enum(Object.keys(ChartSemitransparencyMode) as [TChartSemitransparencyMode, ...TChartSemitransparencyMode[]])
export const ZChartSemitransparencyModeEnterprise = z.enum(Object.values(ChartSemitransparencyMode) as [TChartSemitransparencyModeEnterprise, ...TChartSemitransparencyModeEnterprise[]])

export type TChartSemitransparencyMode = keyof typeof ChartSemitransparencyMode
export type TChartSemitransparencyModeEnterprise = `${ChartSemitransparencyMode}`

enum ChartSeriesGraphicalRepresentationType {
  Auto = "Авто",
  Column = "Гистограмма",
  Column3D = "ГистограммаОбъемная",
  Line = "График",
  Step = "ГрафикПоШагам",
  Area = "ГрафикСОбластями",
}

export const ZChartSeriesGraphicalRepresentationType = z.enum(Object.keys(ChartSeriesGraphicalRepresentationType) as [TChartSeriesGraphicalRepresentationType, ...TChartSeriesGraphicalRepresentationType[]])
export const ZChartSeriesGraphicalRepresentationTypeEnterprise = z.enum(Object.values(ChartSeriesGraphicalRepresentationType) as [TChartSeriesGraphicalRepresentationTypeEnterprise, ...TChartSeriesGraphicalRepresentationTypeEnterprise[]])

export type TChartSeriesGraphicalRepresentationType = keyof typeof ChartSeriesGraphicalRepresentationType
export type TChartSeriesGraphicalRepresentationTypeEnterprise = `${ChartSeriesGraphicalRepresentationType}`

enum ChartSeriesOrderInLegend {
  Auto = "Авто",
  Reverse = "Обратный",
  Direct = "Прямой",
}

export const ZChartSeriesOrderInLegend = z.enum(Object.keys(ChartSeriesOrderInLegend) as [TChartSeriesOrderInLegend, ...TChartSeriesOrderInLegend[]])
export const ZChartSeriesOrderInLegendEnterprise = z.enum(Object.values(ChartSeriesOrderInLegend) as [TChartSeriesOrderInLegendEnterprise, ...TChartSeriesOrderInLegendEnterprise[]])

export type TChartSeriesOrderInLegend = keyof typeof ChartSeriesOrderInLegend
export type TChartSeriesOrderInLegendEnterprise = `${ChartSeriesOrderInLegend}`

enum ChartSeriesStackType {
  Auto = "Авто",
  Unstacked = "БезНакопления",
  Stacked = "СНакоплением",
  StackedNormalized = "СНакоплениемНормированная",
}

export const ZChartSeriesStackType = z.enum(Object.keys(ChartSeriesStackType) as [TChartSeriesStackType, ...TChartSeriesStackType[]])
export const ZChartSeriesStackTypeEnterprise = z.enum(Object.values(ChartSeriesStackType) as [TChartSeriesStackTypeEnterprise, ...TChartSeriesStackTypeEnterprise[]])

export type TChartSeriesStackType = keyof typeof ChartSeriesStackType
export type TChartSeriesStackTypeEnterprise = `${ChartSeriesStackType}`

enum ChartSpaceMode {
  None = "Нет",
  Full = "ПолнаяШирина",
  Half = "ПоловинаШирины",
}

export const ZChartSpaceMode = z.enum(Object.keys(ChartSpaceMode) as [TChartSpaceMode, ...TChartSpaceMode[]])
export const ZChartSpaceModeEnterprise = z.enum(Object.values(ChartSpaceMode) as [TChartSpaceModeEnterprise, ...TChartSpaceModeEnterprise[]])

export type TChartSpaceMode = keyof typeof ChartSpaceMode
export type TChartSpaceModeEnterprise = `${ChartSpaceMode}`

enum ChartSplineMode {
  SmoothCurve = "ГладкаяКривая",
  None = "Нет",
}

export const ZChartSplineMode = z.enum(Object.keys(ChartSplineMode) as [TChartSplineMode, ...TChartSplineMode[]])
export const ZChartSplineModeEnterprise = z.enum(Object.values(ChartSplineMode) as [TChartSplineModeEnterprise, ...TChartSplineModeEnterprise[]])

export type TChartSplineMode = keyof typeof ChartSplineMode
export type TChartSplineModeEnterprise = `${ChartSplineMode}`

enum ChartTitleAreaPlacement {
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

export const ZChartTitleAreaPlacement = z.enum(Object.keys(ChartTitleAreaPlacement) as [TChartTitleAreaPlacement, ...TChartTitleAreaPlacement[]])
export const ZChartTitleAreaPlacementEnterprise = z.enum(Object.values(ChartTitleAreaPlacement) as [TChartTitleAreaPlacementEnterprise, ...TChartTitleAreaPlacementEnterprise[]])

export type TChartTitleAreaPlacement = keyof typeof ChartTitleAreaPlacement
export type TChartTitleAreaPlacementEnterprise = `${ChartTitleAreaPlacement}`

enum ChartTrendlineApproximationType {
  Linear = "Линейный",
  Logarithmic = "Логарифмический",
  Polynomial = "Полиномиальный",
  Power = "Степенной",
  Exponential = "Экспоненциальный",
}

export const ZChartTrendlineApproximationType = z.enum(Object.keys(ChartTrendlineApproximationType) as [TChartTrendlineApproximationType, ...TChartTrendlineApproximationType[]])
export const ZChartTrendlineApproximationTypeEnterprise = z.enum(Object.values(ChartTrendlineApproximationType) as [TChartTrendlineApproximationTypeEnterprise, ...TChartTrendlineApproximationTypeEnterprise[]])

export type TChartTrendlineApproximationType = keyof typeof ChartTrendlineApproximationType
export type TChartTrendlineApproximationTypeEnterprise = `${ChartTrendlineApproximationType}`

enum ChartTrendlineFactor {
  Auto = "Авто",
  PointValue = "ЗначениеТочки",
  PointNumber = "НомерТочки",
}

export const ZChartTrendlineFactor = z.enum(Object.keys(ChartTrendlineFactor) as [TChartTrendlineFactor, ...TChartTrendlineFactor[]])
export const ZChartTrendlineFactorEnterprise = z.enum(Object.values(ChartTrendlineFactor) as [TChartTrendlineFactorEnterprise, ...TChartTrendlineFactorEnterprise[]])

export type TChartTrendlineFactor = keyof typeof ChartTrendlineFactor
export type TChartTrendlineFactorEnterprise = `${ChartTrendlineFactor}`

enum ChartType {
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

export const ZChartType = z.enum(Object.keys(ChartType) as [TChartType, ...TChartType[]])
export const ZChartTypeEnterprise = z.enum(Object.values(ChartType) as [TChartTypeEnterprise, ...TChartTypeEnterprise[]])

export type TChartType = keyof typeof ChartType
export type TChartTypeEnterprise = `${ChartType}`

enum ChartValueEditState {
  Finished = "Завершено",
  NotFinished = "НеЗавершено",
  Canceled = "Отменено",
}

export const ZChartValueEditState = z.enum(Object.keys(ChartValueEditState) as [TChartValueEditState, ...TChartValueEditState[]])
export const ZChartValueEditStateEnterprise = z.enum(Object.values(ChartValueEditState) as [TChartValueEditStateEnterprise, ...TChartValueEditStateEnterprise[]])

export type TChartValueEditState = keyof typeof ChartValueEditState
export type TChartValueEditStateEnterprise = `${ChartValueEditState}`

enum ChartValuesBySeriesConnectionType {
  None = "Нет",
  EdgesConnection = "СоединениеКраев",
}

export const ZChartValuesBySeriesConnectionType = z.enum(Object.keys(ChartValuesBySeriesConnectionType) as [TChartValuesBySeriesConnectionType, ...TChartValuesBySeriesConnectionType[]])
export const ZChartValuesBySeriesConnectionTypeEnterprise = z.enum(Object.values(ChartValuesBySeriesConnectionType) as [TChartValuesBySeriesConnectionTypeEnterprise, ...TChartValuesBySeriesConnectionTypeEnterprise[]])

export type TChartValuesBySeriesConnectionType = keyof typeof ChartValuesBySeriesConnectionType
export type TChartValuesBySeriesConnectionTypeEnterprise = `${ChartValuesBySeriesConnectionType}`

enum ChartValuesEditMode {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZChartValuesEditMode = z.enum(Object.keys(ChartValuesEditMode) as [TChartValuesEditMode, ...TChartValuesEditMode[]])
export const ZChartValuesEditModeEnterprise = z.enum(Object.values(ChartValuesEditMode) as [TChartValuesEditModeEnterprise, ...TChartValuesEditModeEnterprise[]])

export type TChartValuesEditMode = keyof typeof ChartValuesEditMode
export type TChartValuesEditModeEnterprise = `${ChartValuesEditMode}`

enum ChartValuesToolTipFillType {
  Auto = "Авто",
  AllPointValues = "ВсеЗначенияТочки",
  SingleValue = "ОдноЗначение",
}

export const ZChartValuesToolTipFillType = z.enum(Object.keys(ChartValuesToolTipFillType) as [TChartValuesToolTipFillType, ...TChartValuesToolTipFillType[]])
export const ZChartValuesToolTipFillTypeEnterprise = z.enum(Object.values(ChartValuesToolTipFillType) as [TChartValuesToolTipFillTypeEnterprise, ...TChartValuesToolTipFillTypeEnterprise[]])

export type TChartValuesToolTipFillType = keyof typeof ChartValuesToolTipFillType
export type TChartValuesToolTipFillTypeEnterprise = `${ChartValuesToolTipFillType}`

enum ChartValuesToolTipShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  ShowForNearestValue = "ОтображатьДляБлижайшего",
  ShowOnHover = "ОтображатьПриНаведении",
}

export const ZChartValuesToolTipShowMode = z.enum(Object.keys(ChartValuesToolTipShowMode) as [TChartValuesToolTipShowMode, ...TChartValuesToolTipShowMode[]])
export const ZChartValuesToolTipShowModeEnterprise = z.enum(Object.values(ChartValuesToolTipShowMode) as [TChartValuesToolTipShowModeEnterprise, ...TChartValuesToolTipShowModeEnterprise[]])

export type TChartValuesToolTipShowMode = keyof typeof ChartValuesToolTipShowMode
export type TChartValuesToolTipShowModeEnterprise = `${ChartValuesToolTipShowMode}`

enum GaugeChartValueRepresentation {
  Sector = "Сектор",
  Needle = "Стрелка",
}

export const ZGaugeChartValueRepresentation = z.enum(Object.keys(GaugeChartValueRepresentation) as [TGaugeChartValueRepresentation, ...TGaugeChartValueRepresentation[]])
export const ZGaugeChartValueRepresentationEnterprise = z.enum(Object.values(GaugeChartValueRepresentation) as [TGaugeChartValueRepresentationEnterprise, ...TGaugeChartValueRepresentationEnterprise[]])

export type TGaugeChartValueRepresentation = keyof typeof GaugeChartValueRepresentation
export type TGaugeChartValueRepresentationEnterprise = `${GaugeChartValueRepresentation}`

enum GaugeChartValuesScaleLabelsLocation {
  InsideScale = "ВнутриШкалы",
  AtScale = "НаШкале",
}

export const ZGaugeChartValuesScaleLabelsLocation = z.enum(Object.keys(GaugeChartValuesScaleLabelsLocation) as [TGaugeChartValuesScaleLabelsLocation, ...TGaugeChartValuesScaleLabelsLocation[]])
export const ZGaugeChartValuesScaleLabelsLocationEnterprise = z.enum(Object.values(GaugeChartValuesScaleLabelsLocation) as [TGaugeChartValuesScaleLabelsLocationEnterprise, ...TGaugeChartValuesScaleLabelsLocationEnterprise[]])

export type TGaugeChartValuesScaleLabelsLocation = keyof typeof GaugeChartValuesScaleLabelsLocation
export type TGaugeChartValuesScaleLabelsLocationEnterprise = `${GaugeChartValuesScaleLabelsLocation}`

enum MaxSeries {
  NotDefined = "НеЗадано",
  Limited = "Ограничено",
  Percent = "Процент",
}

export const ZMaxSeries = z.enum(Object.keys(MaxSeries) as [TMaxSeries, ...TMaxSeries[]])
export const ZMaxSeriesEnterprise = z.enum(Object.values(MaxSeries) as [TMaxSeriesEnterprise, ...TMaxSeriesEnterprise[]])

export type TMaxSeries = keyof typeof MaxSeries
export type TMaxSeriesEnterprise = `${MaxSeries}`

enum NonnumericChartValueUse {
  Auto = "Авто",
  AsZero = "КакНоль",
  Skip = "Пропускать",
}

export const ZNonnumericChartValueUse = z.enum(Object.keys(NonnumericChartValueUse) as [TNonnumericChartValueUse, ...TNonnumericChartValueUse[]])
export const ZNonnumericChartValueUseEnterprise = z.enum(Object.values(NonnumericChartValueUse) as [TNonnumericChartValueUseEnterprise, ...TNonnumericChartValueUseEnterprise[]])

export type TNonnumericChartValueUse = keyof typeof NonnumericChartValueUse
export type TNonnumericChartValueUseEnterprise = `${NonnumericChartValueUse}`

enum PointsConnectionAcrossSkippedChartValuesType {
  Auto = "Авто",
  None = "Нет",
  ConnectUnskippedValues = "СоединениеНеПропущенных",
  ConnectWithBaseValue = "СоединениеСБазовымЗначением",
}

export const ZPointsConnectionAcrossSkippedChartValuesType = z.enum(Object.keys(PointsConnectionAcrossSkippedChartValuesType) as [TPointsConnectionAcrossSkippedChartValuesType, ...TPointsConnectionAcrossSkippedChartValuesType[]])
export const ZPointsConnectionAcrossSkippedChartValuesTypeEnterprise = z.enum(Object.values(PointsConnectionAcrossSkippedChartValuesType) as [TPointsConnectionAcrossSkippedChartValuesTypeEnterprise, ...TPointsConnectionAcrossSkippedChartValuesTypeEnterprise[]])

export type TPointsConnectionAcrossSkippedChartValuesType = keyof typeof PointsConnectionAcrossSkippedChartValuesType
export type TPointsConnectionAcrossSkippedChartValuesTypeEnterprise = `${PointsConnectionAcrossSkippedChartValuesType}`

enum RadarChartScaleType {
  Circle = "Окружность",
  Polygon = "Полигон",
}

export const ZRadarChartScaleType = z.enum(Object.keys(RadarChartScaleType) as [TRadarChartScaleType, ...TRadarChartScaleType[]])
export const ZRadarChartScaleTypeEnterprise = z.enum(Object.values(RadarChartScaleType) as [TRadarChartScaleTypeEnterprise, ...TRadarChartScaleTypeEnterprise[]])

export type TRadarChartScaleType = keyof typeof RadarChartScaleType
export type TRadarChartScaleTypeEnterprise = `${RadarChartScaleType}`

enum ShowChartPopupReferenceLine {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZShowChartPopupReferenceLine = z.enum(Object.keys(ShowChartPopupReferenceLine) as [TShowChartPopupReferenceLine, ...TShowChartPopupReferenceLine[]])
export const ZShowChartPopupReferenceLineEnterprise = z.enum(Object.values(ShowChartPopupReferenceLine) as [TShowChartPopupReferenceLineEnterprise, ...TShowChartPopupReferenceLineEnterprise[]])

export type TShowChartPopupReferenceLine = keyof typeof ShowChartPopupReferenceLine
export type TShowChartPopupReferenceLineEnterprise = `${ShowChartPopupReferenceLine}`

enum ShowChartScaleTitle {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZShowChartScaleTitle = z.enum(Object.keys(ShowChartScaleTitle) as [TShowChartScaleTitle, ...TShowChartScaleTitle[]])
export const ZShowChartScaleTitleEnterprise = z.enum(Object.values(ShowChartScaleTitle) as [TShowChartScaleTitleEnterprise, ...TShowChartScaleTitleEnterprise[]])

export type TShowChartScaleTitle = keyof typeof ShowChartScaleTitle
export type TShowChartScaleTitleEnterprise = `${ShowChartScaleTitle}`

enum ShowInChart {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZShowInChart = z.enum(Object.keys(ShowInChart) as [TShowInChart, ...TShowInChart[]])
export const ZShowInChartEnterprise = z.enum(Object.values(ShowInChart) as [TShowInChartEnterprise, ...TShowInChartEnterprise[]])

export type TShowInChart = keyof typeof ShowInChart
export type TShowInChartEnterprise = `${ShowInChart}`

enum ShowInChartLegend {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZShowInChartLegend = z.enum(Object.keys(ShowInChartLegend) as [TShowInChartLegend, ...TShowInChartLegend[]])
export const ZShowInChartLegendEnterprise = z.enum(Object.values(ShowInChartLegend) as [TShowInChartLegendEnterprise, ...TShowInChartLegendEnterprise[]])

export type TShowInChartLegend = keyof typeof ShowInChartLegend
export type TShowInChartLegendEnterprise = `${ShowInChartLegend}`

enum StockChartUsedPointValue {
  Close = "Закрытие",
  High = "Максимальное",
  Low = "Минимальное",
  Open = "Открытие",
  OpenCloseAverage = "СреднееОткрытияИЗакрытия",
}

export const ZStockChartUsedPointValue = z.enum(Object.keys(StockChartUsedPointValue) as [TStockChartUsedPointValue, ...TStockChartUsedPointValue[]])
export const ZStockChartUsedPointValueEnterprise = z.enum(Object.values(StockChartUsedPointValue) as [TStockChartUsedPointValueEnterprise, ...TStockChartUsedPointValueEnterprise[]])

export type TStockChartUsedPointValue = keyof typeof StockChartUsedPointValue
export type TStockChartUsedPointValueEnterprise = `${StockChartUsedPointValue}`

enum UsedChartValuesAxis {
  Auto = "Авто",
  Additional = "Дополнительная",
  Main = "Основная",
}

export const ZUsedChartValuesAxis = z.enum(Object.keys(UsedChartValuesAxis) as [TUsedChartValuesAxis, ...TUsedChartValuesAxis[]])
export const ZUsedChartValuesAxisEnterprise = z.enum(Object.values(UsedChartValuesAxis) as [TUsedChartValuesAxisEnterprise, ...TUsedChartValuesAxisEnterprise[]])

export type TUsedChartValuesAxis = keyof typeof UsedChartValuesAxis
export type TUsedChartValuesAxisEnterprise = `${UsedChartValuesAxis}`

enum GanttChartIntervalRepresentation {
  Gradient = "Градиент",
  ThreeDimensional = "Объемный",
  Flat = "Плоский",
  Rhomb = "Ромб",
}

export const ZGanttChartIntervalRepresentation = z.enum(Object.keys(GanttChartIntervalRepresentation) as [TGanttChartIntervalRepresentation, ...TGanttChartIntervalRepresentation[]])
export const ZGanttChartIntervalRepresentationEnterprise = z.enum(Object.values(GanttChartIntervalRepresentation) as [TGanttChartIntervalRepresentationEnterprise, ...TGanttChartIntervalRepresentationEnterprise[]])

export type TGanttChartIntervalRepresentation = keyof typeof GanttChartIntervalRepresentation
export type TGanttChartIntervalRepresentationEnterprise = `${GanttChartIntervalRepresentation}`

enum GanttChartIntervalsSelectionMode {
  Auto = "Авто",
  Multiple = "Множественный",
  None = "Нет",
  Single = "Одиночный",
}

export const ZGanttChartIntervalsSelectionMode = z.enum(Object.keys(GanttChartIntervalsSelectionMode) as [TGanttChartIntervalsSelectionMode, ...TGanttChartIntervalsSelectionMode[]])
export const ZGanttChartIntervalsSelectionModeEnterprise = z.enum(Object.values(GanttChartIntervalsSelectionMode) as [TGanttChartIntervalsSelectionModeEnterprise, ...TGanttChartIntervalsSelectionModeEnterprise[]])

export type TGanttChartIntervalsSelectionMode = keyof typeof GanttChartIntervalsSelectionMode
export type TGanttChartIntervalsSelectionModeEnterprise = `${GanttChartIntervalsSelectionMode}`

enum GanttChartIntervalTextRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZGanttChartIntervalTextRepresentation = z.enum(Object.keys(GanttChartIntervalTextRepresentation) as [TGanttChartIntervalTextRepresentation, ...TGanttChartIntervalTextRepresentation[]])
export const ZGanttChartIntervalTextRepresentationEnterprise = z.enum(Object.values(GanttChartIntervalTextRepresentation) as [TGanttChartIntervalTextRepresentationEnterprise, ...TGanttChartIntervalTextRepresentationEnterprise[]])

export type TGanttChartIntervalTextRepresentation = keyof typeof GanttChartIntervalTextRepresentation
export type TGanttChartIntervalTextRepresentationEnterprise = `${GanttChartIntervalTextRepresentation}`

enum GanttChartLinkType {
  EndEnd = "КонецКонец",
  EndBegin = "КонецНачало",
  BeginEnd = "НачалоКонец",
  BeginBegin = "НачалоНачало",
}

export const ZGanttChartLinkType = z.enum(Object.keys(GanttChartLinkType) as [TGanttChartLinkType, ...TGanttChartLinkType[]])
export const ZGanttChartLinkTypeEnterprise = z.enum(Object.values(GanttChartLinkType) as [TGanttChartLinkTypeEnterprise, ...TGanttChartLinkTypeEnterprise[]])

export type TGanttChartLinkType = keyof typeof GanttChartLinkType
export type TGanttChartLinkTypeEnterprise = `${GanttChartLinkType}`

enum GanttChartScaleKeeping {
  Auto = "Авто",
  AllData = "ВсеДанные",
  Period = "Период",
  Fixed = "Фиксированная",
}

export const ZGanttChartScaleKeeping = z.enum(Object.keys(GanttChartScaleKeeping) as [TGanttChartScaleKeeping, ...TGanttChartScaleKeeping[]])
export const ZGanttChartScaleKeepingEnterprise = z.enum(Object.values(GanttChartScaleKeeping) as [TGanttChartScaleKeepingEnterprise, ...TGanttChartScaleKeepingEnterprise[]])

export type TGanttChartScaleKeeping = keyof typeof GanttChartScaleKeeping
export type TGanttChartScaleKeepingEnterprise = `${GanttChartScaleKeeping}`

enum GanttChartTableLocation {
  Auto = "Авто",
  Left = "Лево",
  None = "Нет",
  Right = "Право",
}

export const ZGanttChartTableLocation = z.enum(Object.keys(GanttChartTableLocation) as [TGanttChartTableLocation, ...TGanttChartTableLocation[]])
export const ZGanttChartTableLocationEnterprise = z.enum(Object.values(GanttChartTableLocation) as [TGanttChartTableLocationEnterprise, ...TGanttChartTableLocationEnterprise[]])

export type TGanttChartTableLocation = keyof typeof GanttChartTableLocation
export type TGanttChartTableLocationEnterprise = `${GanttChartTableLocation}`

enum GanttChartTextPlacementType {
  Auto = "Авто",
  Cut = "Обрезать",
  Wrap = "Переносить",
}

export const ZGanttChartTextPlacementType = z.enum(Object.keys(GanttChartTextPlacementType) as [TGanttChartTextPlacementType, ...TGanttChartTextPlacementType[]])
export const ZGanttChartTextPlacementTypeEnterprise = z.enum(Object.values(GanttChartTextPlacementType) as [TGanttChartTextPlacementTypeEnterprise, ...TGanttChartTextPlacementTypeEnterprise[]])

export type TGanttChartTextPlacementType = keyof typeof GanttChartTextPlacementType
export type TGanttChartTextPlacementTypeEnterprise = `${GanttChartTextPlacementType}`

enum GanttChartValuesSelectionMode {
  Auto = "Авто",
  Multiple = "Множественный",
  None = "Нет",
  Single = "Одиночный",
}

export const ZGanttChartValuesSelectionMode = z.enum(Object.keys(GanttChartValuesSelectionMode) as [TGanttChartValuesSelectionMode, ...TGanttChartValuesSelectionMode[]])
export const ZGanttChartValuesSelectionModeEnterprise = z.enum(Object.values(GanttChartValuesSelectionMode) as [TGanttChartValuesSelectionModeEnterprise, ...TGanttChartValuesSelectionModeEnterprise[]])

export type TGanttChartValuesSelectionMode = keyof typeof GanttChartValuesSelectionMode
export type TGanttChartValuesSelectionModeEnterprise = `${GanttChartValuesSelectionMode}`

enum GanttChartValueTextRepresentation {
  None = "НеОтображать",
  Right = "Право",
}

export const ZGanttChartValueTextRepresentation = z.enum(Object.keys(GanttChartValueTextRepresentation) as [TGanttChartValueTextRepresentation, ...TGanttChartValueTextRepresentation[]])
export const ZGanttChartValueTextRepresentationEnterprise = z.enum(Object.values(GanttChartValueTextRepresentation) as [TGanttChartValueTextRepresentationEnterprise, ...TGanttChartValueTextRepresentationEnterprise[]])

export type TGanttChartValueTextRepresentation = keyof typeof GanttChartValueTextRepresentation
export type TGanttChartValueTextRepresentationEnterprise = `${GanttChartValueTextRepresentation}`

enum GanttChartVerticalStretch {
  None = "НеРастягивать",
  StretchRows = "РастягиватьСтроки",
  StretchRowsAndData = "РастягиватьСтрокиИДанные",
}

export const ZGanttChartVerticalStretch = z.enum(Object.keys(GanttChartVerticalStretch) as [TGanttChartVerticalStretch, ...TGanttChartVerticalStretch[]])
export const ZGanttChartVerticalStretchEnterprise = z.enum(Object.values(GanttChartVerticalStretch) as [TGanttChartVerticalStretchEnterprise, ...TGanttChartVerticalStretchEnterprise[]])

export type TGanttChartVerticalStretch = keyof typeof GanttChartVerticalStretch
export type TGanttChartVerticalStretchEnterprise = `${GanttChartVerticalStretch}`

enum ShowInGanttChart {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZShowInGanttChart = z.enum(Object.keys(ShowInGanttChart) as [TShowInGanttChart, ...TShowInGanttChart[]])
export const ZShowInGanttChartEnterprise = z.enum(Object.values(ShowInGanttChart) as [TShowInGanttChartEnterprise, ...TShowInGanttChartEnterprise[]])

export type TShowInGanttChart = keyof typeof ShowInGanttChart
export type TShowInGanttChartEnterprise = `${ShowInGanttChart}`

enum TimeScaleDayFormat {
  MonthDay = "ДеньМесяца",
  MonthDayWeekDay = "ДеньМесяцаДеньНедели",
  WeekDay = "ДеньНедели",
  WeekDayMonthDay = "ДеньНеделиДеньМесяца",
}

export const ZTimeScaleDayFormat = z.enum(Object.keys(TimeScaleDayFormat) as [TTimeScaleDayFormat, ...TTimeScaleDayFormat[]])
export const ZTimeScaleDayFormatEnterprise = z.enum(Object.values(TimeScaleDayFormat) as [TTimeScaleDayFormatEnterprise, ...TTimeScaleDayFormatEnterprise[]])

export type TTimeScaleDayFormat = keyof typeof TimeScaleDayFormat
export type TTimeScaleDayFormatEnterprise = `${TimeScaleDayFormat}`

enum TimeScaleUnitType {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Minute = "Минута",
  Week = "Неделя",
  Second = "Секунда",
  Hour = "Час",
}

export const ZTimeScaleUnitType = z.enum(Object.keys(TimeScaleUnitType) as [TTimeScaleUnitType, ...TTimeScaleUnitType[]])
export const ZTimeScaleUnitTypeEnterprise = z.enum(Object.values(TimeScaleUnitType) as [TTimeScaleUnitTypeEnterprise, ...TTimeScaleUnitTypeEnterprise[]])

export type TTimeScaleUnitType = keyof typeof TimeScaleUnitType
export type TTimeScaleUnitTypeEnterprise = `${TimeScaleUnitType}`

enum PivotChartLabelsOrientation {
  TopLevelsVertical = "ВерхниеУровниВертикально",
  AllLevelsVertical = "ВсеУровниВертикально",
  AllLevelsHorizontal = "ВсеУровниГоризонтально",
}

export const ZPivotChartLabelsOrientation = z.enum(Object.keys(PivotChartLabelsOrientation) as [TPivotChartLabelsOrientation, ...TPivotChartLabelsOrientation[]])
export const ZPivotChartLabelsOrientationEnterprise = z.enum(Object.values(PivotChartLabelsOrientation) as [TPivotChartLabelsOrientationEnterprise, ...TPivotChartLabelsOrientationEnterprise[]])

export type TPivotChartLabelsOrientation = keyof typeof PivotChartLabelsOrientation
export type TPivotChartLabelsOrientationEnterprise = `${PivotChartLabelsOrientation}`

enum PivotChartScaleKeeping {
  AllValues = "ВсеЗначения",
  ValuesCount = "КоличествоЗначений",
  MinimumWidth = "МинимальнаяШирина",
}

export const ZPivotChartScaleKeeping = z.enum(Object.keys(PivotChartScaleKeeping) as [TPivotChartScaleKeeping, ...TPivotChartScaleKeeping[]])
export const ZPivotChartScaleKeepingEnterprise = z.enum(Object.values(PivotChartScaleKeeping) as [TPivotChartScaleKeepingEnterprise, ...TPivotChartScaleKeepingEnterprise[]])

export type TPivotChartScaleKeeping = keyof typeof PivotChartScaleKeeping
export type TPivotChartScaleKeepingEnterprise = `${PivotChartScaleKeeping}`

enum PivotChartType {
  Column = "Гистограмма",
  Column3D = "ГистограммаОбъемная",
}

export const ZPivotChartType = z.enum(Object.keys(PivotChartType) as [TPivotChartType, ...TPivotChartType[]])
export const ZPivotChartTypeEnterprise = z.enum(Object.values(PivotChartType) as [TPivotChartTypeEnterprise, ...TPivotChartTypeEnterprise[]])

export type TPivotChartType = keyof typeof PivotChartType
export type TPivotChartTypeEnterprise = `${PivotChartType}`

enum PivotChartValuesShowMode {
  AllValues = "ВсеЗначения",
  LastLevelValues = "ЗначенияПоследнегоУровня",
}

export const ZPivotChartValuesShowMode = z.enum(Object.keys(PivotChartValuesShowMode) as [TPivotChartValuesShowMode, ...TPivotChartValuesShowMode[]])
export const ZPivotChartValuesShowModeEnterprise = z.enum(Object.values(PivotChartValuesShowMode) as [TPivotChartValuesShowModeEnterprise, ...TPivotChartValuesShowModeEnterprise[]])

export type TPivotChartValuesShowMode = keyof typeof PivotChartValuesShowMode
export type TPivotChartValuesShowModeEnterprise = `${PivotChartValuesShowMode}`

enum DendrogramOrientation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export const ZDendrogramOrientation = z.enum(Object.keys(DendrogramOrientation) as [TDendrogramOrientation, ...TDendrogramOrientation[]])
export const ZDendrogramOrientationEnterprise = z.enum(Object.values(DendrogramOrientation) as [TDendrogramOrientationEnterprise, ...TDendrogramOrientationEnterprise[]])

export type TDendrogramOrientation = keyof typeof DendrogramOrientation
export type TDendrogramOrientationEnterprise = `${DendrogramOrientation}`

enum DendrogramScaleKeeping {
  AllItems = "ВсеЭлементы",
  ItemCount = "КоличествоЭлементов",
  MinimumWidth = "МинимальнаяШирина",
}

export const ZDendrogramScaleKeeping = z.enum(Object.keys(DendrogramScaleKeeping) as [TDendrogramScaleKeeping, ...TDendrogramScaleKeeping[]])
export const ZDendrogramScaleKeepingEnterprise = z.enum(Object.values(DendrogramScaleKeeping) as [TDendrogramScaleKeepingEnterprise, ...TDendrogramScaleKeepingEnterprise[]])

export type TDendrogramScaleKeeping = keyof typeof DendrogramScaleKeeping
export type TDendrogramScaleKeepingEnterprise = `${DendrogramScaleKeeping}`

enum GeographicalSchemaDataSourceOrganizationType {
  AtRow = "ВСтроке",
  AtIntersection = "НаПересечении",
}

export const ZGeographicalSchemaDataSourceOrganizationType = z.enum(Object.keys(GeographicalSchemaDataSourceOrganizationType) as [TGeographicalSchemaDataSourceOrganizationType, ...TGeographicalSchemaDataSourceOrganizationType[]])
export const ZGeographicalSchemaDataSourceOrganizationTypeEnterprise = z.enum(Object.values(GeographicalSchemaDataSourceOrganizationType) as [TGeographicalSchemaDataSourceOrganizationTypeEnterprise, ...TGeographicalSchemaDataSourceOrganizationTypeEnterprise[]])

export type TGeographicalSchemaDataSourceOrganizationType = keyof typeof GeographicalSchemaDataSourceOrganizationType
export type TGeographicalSchemaDataSourceOrganizationTypeEnterprise = `${GeographicalSchemaDataSourceOrganizationType}`

enum GeographicalSchemaLayerSeriesImportModeType {
  ImportAll = "ИмпортироватьВсе",
  DontImport = "НеИмпортировать",
}

export const ZGeographicalSchemaLayerSeriesImportModeType = z.enum(Object.keys(GeographicalSchemaLayerSeriesImportModeType) as [TGeographicalSchemaLayerSeriesImportModeType, ...TGeographicalSchemaLayerSeriesImportModeType[]])
export const ZGeographicalSchemaLayerSeriesImportModeTypeEnterprise = z.enum(Object.values(GeographicalSchemaLayerSeriesImportModeType) as [TGeographicalSchemaLayerSeriesImportModeTypeEnterprise, ...TGeographicalSchemaLayerSeriesImportModeTypeEnterprise[]])

export type TGeographicalSchemaLayerSeriesImportModeType = keyof typeof GeographicalSchemaLayerSeriesImportModeType
export type TGeographicalSchemaLayerSeriesImportModeTypeEnterprise = `${GeographicalSchemaLayerSeriesImportModeType}`

enum GeographicalSchemaLayerSeriesShowMode {
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

export const ZGeographicalSchemaLayerSeriesShowMode = z.enum(Object.keys(GeographicalSchemaLayerSeriesShowMode) as [TGeographicalSchemaLayerSeriesShowMode, ...TGeographicalSchemaLayerSeriesShowMode[]])
export const ZGeographicalSchemaLayerSeriesShowModeEnterprise = z.enum(Object.values(GeographicalSchemaLayerSeriesShowMode) as [TGeographicalSchemaLayerSeriesShowModeEnterprise, ...TGeographicalSchemaLayerSeriesShowModeEnterprise[]])

export type TGeographicalSchemaLayerSeriesShowMode = keyof typeof GeographicalSchemaLayerSeriesShowMode
export type TGeographicalSchemaLayerSeriesShowModeEnterprise = `${GeographicalSchemaLayerSeriesShowMode}`

enum GeographicalSchemaLegendItemShowScaleType {
  DontShow = "НеОтображать",
  ShowByValues = "ОтображатьПоЗначениям",
}

export const ZGeographicalSchemaLegendItemShowScaleType = z.enum(Object.keys(GeographicalSchemaLegendItemShowScaleType) as [TGeographicalSchemaLegendItemShowScaleType, ...TGeographicalSchemaLegendItemShowScaleType[]])
export const ZGeographicalSchemaLegendItemShowScaleTypeEnterprise = z.enum(Object.values(GeographicalSchemaLegendItemShowScaleType) as [TGeographicalSchemaLegendItemShowScaleTypeEnterprise, ...TGeographicalSchemaLegendItemShowScaleTypeEnterprise[]])

export type TGeographicalSchemaLegendItemShowScaleType = keyof typeof GeographicalSchemaLegendItemShowScaleType
export type TGeographicalSchemaLegendItemShowScaleTypeEnterprise = `${GeographicalSchemaLegendItemShowScaleType}`

enum GeographicalSchemaLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export const ZGeographicalSchemaLineType = z.enum(Object.keys(GeographicalSchemaLineType) as [TGeographicalSchemaLineType, ...TGeographicalSchemaLineType[]])
export const ZGeographicalSchemaLineTypeEnterprise = z.enum(Object.values(GeographicalSchemaLineType) as [TGeographicalSchemaLineTypeEnterprise, ...TGeographicalSchemaLineTypeEnterprise[]])

export type TGeographicalSchemaLineType = keyof typeof GeographicalSchemaLineType
export type TGeographicalSchemaLineTypeEnterprise = `${GeographicalSchemaLineType}`

enum GeographicalSchemaMarkerType {
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

export const ZGeographicalSchemaMarkerType = z.enum(Object.keys(GeographicalSchemaMarkerType) as [TGeographicalSchemaMarkerType, ...TGeographicalSchemaMarkerType[]])
export const ZGeographicalSchemaMarkerTypeEnterprise = z.enum(Object.values(GeographicalSchemaMarkerType) as [TGeographicalSchemaMarkerTypeEnterprise, ...TGeographicalSchemaMarkerTypeEnterprise[]])

export type TGeographicalSchemaMarkerType = keyof typeof GeographicalSchemaMarkerType
export type TGeographicalSchemaMarkerTypeEnterprise = `${GeographicalSchemaMarkerType}`

enum GeographicalSchemaObjectFindType {
  Included = "Включает",
  IncludedWholly = "ВключаетПолностью",
  Includes = "Включают",
  IncludesWholly = "ВключаютПолностью",
}

export const ZGeographicalSchemaObjectFindType = z.enum(Object.keys(GeographicalSchemaObjectFindType) as [TGeographicalSchemaObjectFindType, ...TGeographicalSchemaObjectFindType[]])
export const ZGeographicalSchemaObjectFindTypeEnterprise = z.enum(Object.values(GeographicalSchemaObjectFindType) as [TGeographicalSchemaObjectFindTypeEnterprise, ...TGeographicalSchemaObjectFindTypeEnterprise[]])

export type TGeographicalSchemaObjectFindType = keyof typeof GeographicalSchemaObjectFindType
export type TGeographicalSchemaObjectFindTypeEnterprise = `${GeographicalSchemaObjectFindType}`

enum GeographicalSchemaPointObjectDrawingType {
  Picture = "Картинка",
  Marker = "Маркер",
  Char = "Символ",
}

export const ZGeographicalSchemaPointObjectDrawingType = z.enum(Object.keys(GeographicalSchemaPointObjectDrawingType) as [TGeographicalSchemaPointObjectDrawingType, ...TGeographicalSchemaPointObjectDrawingType[]])
export const ZGeographicalSchemaPointObjectDrawingTypeEnterprise = z.enum(Object.values(GeographicalSchemaPointObjectDrawingType) as [TGeographicalSchemaPointObjectDrawingTypeEnterprise, ...TGeographicalSchemaPointObjectDrawingTypeEnterprise[]])

export type TGeographicalSchemaPointObjectDrawingType = keyof typeof GeographicalSchemaPointObjectDrawingType
export type TGeographicalSchemaPointObjectDrawingTypeEnterprise = `${GeographicalSchemaPointObjectDrawingType}`

enum GeographicalSchemaProjection {
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

export const ZGeographicalSchemaProjection = z.enum(Object.keys(GeographicalSchemaProjection) as [TGeographicalSchemaProjection, ...TGeographicalSchemaProjection[]])
export const ZGeographicalSchemaProjectionEnterprise = z.enum(Object.values(GeographicalSchemaProjection) as [TGeographicalSchemaProjectionEnterprise, ...TGeographicalSchemaProjectionEnterprise[]])

export type TGeographicalSchemaProjection = keyof typeof GeographicalSchemaProjection
export type TGeographicalSchemaProjectionEnterprise = `${GeographicalSchemaProjection}`

enum GeographicalSchemaShowMode {
  AllData = "ВсеДанные",
  ScaleDefined = "ЗадаетсяМасштабом",
  SpecifiedArea = "ЗаданнаяОбласть",
}

export const ZGeographicalSchemaShowMode = z.enum(Object.keys(GeographicalSchemaShowMode) as [TGeographicalSchemaShowMode, ...TGeographicalSchemaShowMode[]])
export const ZGeographicalSchemaShowModeEnterprise = z.enum(Object.values(GeographicalSchemaShowMode) as [TGeographicalSchemaShowModeEnterprise, ...TGeographicalSchemaShowModeEnterprise[]])

export type TGeographicalSchemaShowMode = keyof typeof GeographicalSchemaShowMode
export type TGeographicalSchemaShowModeEnterprise = `${GeographicalSchemaShowMode}`

enum PaintingReferencePointPosition {
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

export const ZPaintingReferencePointPosition = z.enum(Object.keys(PaintingReferencePointPosition) as [TPaintingReferencePointPosition, ...TPaintingReferencePointPosition[]])
export const ZPaintingReferencePointPositionEnterprise = z.enum(Object.values(PaintingReferencePointPosition) as [TPaintingReferencePointPositionEnterprise, ...TPaintingReferencePointPositionEnterprise[]])

export type TPaintingReferencePointPosition = keyof typeof PaintingReferencePointPosition
export type TPaintingReferencePointPositionEnterprise = `${PaintingReferencePointPosition}`

enum SeriesValuesDrawingMode {
  ShowAsPart = "ОтображатьКакДолю",
  ShowAsValue = "ОтображатьКакЗначение",
}

export const ZSeriesValuesDrawingMode = z.enum(Object.keys(SeriesValuesDrawingMode) as [TSeriesValuesDrawingMode, ...TSeriesValuesDrawingMode[]])
export const ZSeriesValuesDrawingModeEnterprise = z.enum(Object.values(SeriesValuesDrawingMode) as [TSeriesValuesDrawingModeEnterprise, ...TSeriesValuesDrawingModeEnterprise[]])

export type TSeriesValuesDrawingMode = keyof typeof SeriesValuesDrawingMode
export type TSeriesValuesDrawingModeEnterprise = `${SeriesValuesDrawingMode}`

enum CheckBoxType {
  Auto = "Авто",
  Switch = "Выключатель",
  Tumbler = "Тумблер",
  CheckBox = "Флажок",
}

export const ZCheckBoxType = z.enum(Object.keys(CheckBoxType) as [TCheckBoxType, ...TCheckBoxType[]])
export const ZCheckBoxTypeEnterprise = z.enum(Object.values(CheckBoxType) as [TCheckBoxTypeEnterprise, ...TCheckBoxTypeEnterprise[]])

export type TCheckBoxType = keyof typeof CheckBoxType
export type TCheckBoxTypeEnterprise = `${CheckBoxType}`

enum ChildFormItemsGroup {
  Vertical = "Вертикальная",
  Horizontal = "Горизонтальная",
  AlwaysHorizontal = "ГоризонтальнаяВсегда",
  HorizontalIfPossible = "ГоризонтальнаяЕслиВозможно",
}

export const ZChildFormItemsGroup = z.enum(Object.keys(ChildFormItemsGroup) as [TChildFormItemsGroup, ...TChildFormItemsGroup[]])
export const ZChildFormItemsGroupEnterprise = z.enum(Object.values(ChildFormItemsGroup) as [TChildFormItemsGroupEnterprise, ...TChildFormItemsGroupEnterprise[]])

export type TChildFormItemsGroup = keyof typeof ChildFormItemsGroup
export type TChildFormItemsGroupEnterprise = `${ChildFormItemsGroup}`

enum ChildFormItemsWidth {
  Auto = "Авто",
  LeftNarrowest = "ЛевыйОченьУзкий",
  LeftWidest = "ЛевыйОченьШирокий",
  LeftNarrow = "ЛевыйУзкий",
  LeftWide = "ЛевыйШирокий",
  Equal = "Одинаковая",
}

export const ZChildFormItemsWidth = z.enum(Object.keys(ChildFormItemsWidth) as [TChildFormItemsWidth, ...TChildFormItemsWidth[]])
export const ZChildFormItemsWidthEnterprise = z.enum(Object.values(ChildFormItemsWidth) as [TChildFormItemsWidthEnterprise, ...TChildFormItemsWidthEnterprise[]])

export type TChildFormItemsWidth = keyof typeof ChildFormItemsWidth
export type TChildFormItemsWidthEnterprise = `${ChildFormItemsWidth}`

enum ChoiceButtonRepresentation {
  Auto = "Авто",
  ShowInDropList = "ОтображатьВВыпадающемСписке",
  ShowInDropListAndInInputField = "ОтображатьВВыпадающемСпискеИВПолеВвода",
  ShowInInputField = "ОтображатьВПолеВвода",
}

export const ZChoiceButtonRepresentation = z.enum(Object.keys(ChoiceButtonRepresentation) as [TChoiceButtonRepresentation, ...TChoiceButtonRepresentation[]])
export const ZChoiceButtonRepresentationEnterprise = z.enum(Object.values(ChoiceButtonRepresentation) as [TChoiceButtonRepresentationEnterprise, ...TChoiceButtonRepresentationEnterprise[]])

export type TChoiceButtonRepresentation = keyof typeof ChoiceButtonRepresentation
export type TChoiceButtonRepresentationEnterprise = `${ChoiceButtonRepresentation}`

enum ChoiceHistoryOnInput {
  Auto = "Авто",
  DontUse = "НеИспользовать",
}

export const ZChoiceHistoryOnInput = z.enum(Object.keys(ChoiceHistoryOnInput) as [TChoiceHistoryOnInput, ...TChoiceHistoryOnInput[]])
export const ZChoiceHistoryOnInputEnterprise = z.enum(Object.values(ChoiceHistoryOnInput) as [TChoiceHistoryOnInputEnterprise, ...TChoiceHistoryOnInputEnterprise[]])

export type TChoiceHistoryOnInput = keyof typeof ChoiceHistoryOnInput
export type TChoiceHistoryOnInputEnterprise = `${ChoiceHistoryOnInput}`

enum ClipboardDataStandardFormat {
  HTML = "HTML",
  Picture = "Картинка",
  Text = "Текст",
}

export const ZClipboardDataStandardFormat = z.enum(Object.keys(ClipboardDataStandardFormat) as [TClipboardDataStandardFormat, ...TClipboardDataStandardFormat[]])
export const ZClipboardDataStandardFormatEnterprise = z.enum(Object.values(ClipboardDataStandardFormat) as [TClipboardDataStandardFormatEnterprise, ...TClipboardDataStandardFormatEnterprise[]])

export type TClipboardDataStandardFormat = keyof typeof ClipboardDataStandardFormat
export type TClipboardDataStandardFormatEnterprise = `${ClipboardDataStandardFormat}`

enum CollapseFormItemsByImportance {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCollapseFormItemsByImportance = z.enum(Object.keys(CollapseFormItemsByImportance) as [TCollapseFormItemsByImportance, ...TCollapseFormItemsByImportance[]])
export const ZCollapseFormItemsByImportanceEnterprise = z.enum(Object.values(CollapseFormItemsByImportance) as [TCollapseFormItemsByImportanceEnterprise, ...TCollapseFormItemsByImportanceEnterprise[]])

export type TCollapseFormItemsByImportance = keyof typeof CollapseFormItemsByImportance
export type TCollapseFormItemsByImportanceEnterprise = `${CollapseFormItemsByImportance}`

enum ColorDepth {
  BitPerPixel1 = "БитНаПиксел1",
  BitPerPixel24 = "БитНаПиксел24",
  BitPerPixel32 = "БитНаПиксел32",
  BitPerPixel4 = "БитНаПиксел4",
  BitPerPixel8 = "БитНаПиксел8",
}

export const ZColorDepth = z.enum(Object.keys(ColorDepth) as [TColorDepth, ...TColorDepth[]])
export const ZColorDepthEnterprise = z.enum(Object.values(ColorDepth) as [TColorDepthEnterprise, ...TColorDepthEnterprise[]])

export type TColorDepth = keyof typeof ColorDepth
export type TColorDepthEnterprise = `${ColorDepth}`

enum ColumnEditMode {
  Enter = "Вход",
  EnterOnInput = "ВходПриВводе",
  Directly = "Непосредственно",
}

export const ZColumnEditMode = z.enum(Object.keys(ColumnEditMode) as [TColumnEditMode, ...TColumnEditMode[]])
export const ZColumnEditModeEnterprise = z.enum(Object.values(ColumnEditMode) as [TColumnEditModeEnterprise, ...TColumnEditModeEnterprise[]])

export type TColumnEditMode = keyof typeof ColumnEditMode
export type TColumnEditModeEnterprise = `${ColumnEditMode}`

enum ColumnLocation {
  SameColumn = "ВТойЖеКолонке",
  OnNextRow = "НаСледующейСтроке",
  NewColumn = "НоваяКолонка",
}

export const ZColumnLocation = z.enum(Object.keys(ColumnLocation) as [TColumnLocation, ...TColumnLocation[]])
export const ZColumnLocationEnterprise = z.enum(Object.values(ColumnLocation) as [TColumnLocationEnterprise, ...TColumnLocationEnterprise[]])

export type TColumnLocation = keyof typeof ColumnLocation
export type TColumnLocationEnterprise = `${ColumnLocation}`

enum ColumnsGroup {
  Vertical = "Вертикальная",
  InCell = "ВЯчейке",
  Horizontal = "Горизонтальная",
}

export const ZColumnsGroup = z.enum(Object.keys(ColumnsGroup) as [TColumnsGroup, ...TColumnsGroup[]])
export const ZColumnsGroupEnterprise = z.enum(Object.values(ColumnsGroup) as [TColumnsGroupEnterprise, ...TColumnsGroupEnterprise[]])

export type TColumnsGroup = keyof typeof ColumnsGroup
export type TColumnsGroupEnterprise = `${ColumnsGroup}`

enum ColumnSizeChange {
  Change = "Изменять",
  DontChange = "НеИзменять",
}

export const ZColumnSizeChange = z.enum(Object.keys(ColumnSizeChange) as [TColumnSizeChange, ...TColumnSizeChange[]])
export const ZColumnSizeChangeEnterprise = z.enum(Object.values(ColumnSizeChange) as [TColumnSizeChangeEnterprise, ...TColumnSizeChangeEnterprise[]])

export type TColumnSizeChange = keyof typeof ColumnSizeChange
export type TColumnSizeChangeEnterprise = `${ColumnSizeChange}`

enum CommandBarButtonAlignment {
  Left = "Лево",
  Right = "Право",
  Center = "Центр",
}

export const ZCommandBarButtonAlignment = z.enum(Object.keys(CommandBarButtonAlignment) as [TCommandBarButtonAlignment, ...TCommandBarButtonAlignment[]])
export const ZCommandBarButtonAlignmentEnterprise = z.enum(Object.values(CommandBarButtonAlignment) as [TCommandBarButtonAlignmentEnterprise, ...TCommandBarButtonAlignmentEnterprise[]])

export type TCommandBarButtonAlignment = keyof typeof CommandBarButtonAlignment
export type TCommandBarButtonAlignmentEnterprise = `${CommandBarButtonAlignment}`

enum CommandBarButtonOrder {
  Asc = "Возр",
  DontOrder = "НеУпорядочивать",
  Desc = "Убыв",
}

export const ZCommandBarButtonOrder = z.enum(Object.keys(CommandBarButtonOrder) as [TCommandBarButtonOrder, ...TCommandBarButtonOrder[]])
export const ZCommandBarButtonOrderEnterprise = z.enum(Object.values(CommandBarButtonOrder) as [TCommandBarButtonOrderEnterprise, ...TCommandBarButtonOrderEnterprise[]])

export type TCommandBarButtonOrder = keyof typeof CommandBarButtonOrder
export type TCommandBarButtonOrderEnterprise = `${CommandBarButtonOrder}`

enum CommandBarButtonRepresentation {
  Auto = "Авто",
  Picture = "Картинка",
  Text = "Надпись",
  PictureText = "НадписьКартинка",
}

export const ZCommandBarButtonRepresentation = z.enum(Object.keys(CommandBarButtonRepresentation) as [TCommandBarButtonRepresentation, ...TCommandBarButtonRepresentation[]])
export const ZCommandBarButtonRepresentationEnterprise = z.enum(Object.values(CommandBarButtonRepresentation) as [TCommandBarButtonRepresentationEnterprise, ...TCommandBarButtonRepresentationEnterprise[]])

export type TCommandBarButtonRepresentation = keyof typeof CommandBarButtonRepresentation
export type TCommandBarButtonRepresentationEnterprise = `${CommandBarButtonRepresentation}`

enum CommandBarButtonType {
  Action = "Действие",
  Popup = "Подменю",
  Separator = "Разделитель",
}

export const ZCommandBarButtonType = z.enum(Object.keys(CommandBarButtonType) as [TCommandBarButtonType, ...TCommandBarButtonType[]])
export const ZCommandBarButtonTypeEnterprise = z.enum(Object.values(CommandBarButtonType) as [TCommandBarButtonTypeEnterprise, ...TCommandBarButtonTypeEnterprise[]])

export type TCommandBarButtonType = keyof typeof CommandBarButtonType
export type TCommandBarButtonTypeEnterprise = `${CommandBarButtonType}`

enum CommandGroupCategory {
  FormCommandBar = "КоманднаяПанельФормы",
  ActionsPanel = "ПанельДействий",
  NavigationPanel = "ПанельНавигации",
  FormNavigationPanel = "ПанельНавигацииФормы",
}

export const ZCommandGroupCategory = z.enum(Object.keys(CommandGroupCategory) as [TCommandGroupCategory, ...TCommandGroupCategory[]])
export const ZCommandGroupCategoryEnterprise = z.enum(Object.values(CommandGroupCategory) as [TCommandGroupCategoryEnterprise, ...TCommandGroupCategoryEnterprise[]])

export type TCommandGroupCategory = keyof typeof CommandGroupCategory
export type TCommandGroupCategoryEnterprise = `${CommandGroupCategory}`

enum CommandParameterUseMode {
  Multiple = "Множественный",
  Single = "Одиночный",
}

export const ZCommandParameterUseMode = z.enum(Object.keys(CommandParameterUseMode) as [TCommandParameterUseMode, ...TCommandParameterUseMode[]])
export const ZCommandParameterUseModeEnterprise = z.enum(Object.values(CommandParameterUseMode) as [TCommandParameterUseModeEnterprise, ...TCommandParameterUseModeEnterprise[]])

export type TCommandParameterUseMode = keyof typeof CommandParameterUseMode
export type TCommandParameterUseModeEnterprise = `${CommandParameterUseMode}`

enum ConnectorLineType {
  None = "НетЛинии",
  Dashed = "Пунктир",
  DashDotted = "ПунктирТочка",
  DashDottedDotted = "ПунктирТочкаТочка",
  Solid = "Сплошная",
  Dotted = "Точечная",
}

export const ZConnectorLineType = z.enum(Object.keys(ConnectorLineType) as [TConnectorLineType, ...TConnectorLineType[]])
export const ZConnectorLineTypeEnterprise = z.enum(Object.values(ConnectorLineType) as [TConnectorLineTypeEnterprise, ...TConnectorLineTypeEnterprise[]])

export type TConnectorLineType = keyof typeof ConnectorLineType
export type TConnectorLineTypeEnterprise = `${ConnectorLineType}`

enum ConnectorTextLocation {
  FirstSegment = "ПервыйСегмент",
  Middle = "СерединаЛинии",
}

export const ZConnectorTextLocation = z.enum(Object.keys(ConnectorTextLocation) as [TConnectorTextLocation, ...TConnectorTextLocation[]])
export const ZConnectorTextLocationEnterprise = z.enum(Object.values(ConnectorTextLocation) as [TConnectorTextLocationEnterprise, ...TConnectorTextLocationEnterprise[]])

export type TConnectorTextLocation = keyof typeof ConnectorTextLocation
export type TConnectorTextLocationEnterprise = `${ConnectorTextLocation}`

enum ControlBorderType {
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

export const ZControlBorderType = z.enum(Object.keys(ControlBorderType) as [TControlBorderType, ...TControlBorderType[]])
export const ZControlBorderTypeEnterprise = z.enum(Object.values(ControlBorderType) as [TControlBorderTypeEnterprise, ...TControlBorderTypeEnterprise[]])

export type TControlBorderType = keyof typeof ControlBorderType
export type TControlBorderTypeEnterprise = `${ControlBorderType}`

enum ControlCollapseMode {
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export const ZControlCollapseMode = z.enum(Object.keys(ControlCollapseMode) as [TControlCollapseMode, ...TControlCollapseMode[]])
export const ZControlCollapseModeEnterprise = z.enum(Object.values(ControlCollapseMode) as [TControlCollapseModeEnterprise, ...TControlCollapseModeEnterprise[]])

export type TControlCollapseMode = keyof typeof ControlCollapseMode
export type TControlCollapseModeEnterprise = `${ControlCollapseMode}`

enum ControlEdge {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export const ZControlEdge = z.enum(Object.keys(ControlEdge) as [TControlEdge, ...TControlEdge[]])
export const ZControlEdgeEnterprise = z.enum(Object.values(ControlEdge) as [TControlEdgeEnterprise, ...TControlEdgeEnterprise[]])

export type TControlEdge = keyof typeof ControlEdge
export type TControlEdgeEnterprise = `${ControlEdge}`

enum CurrentRowUse {
  Auto = "Авто",
  Use = "Использует",
  DontUse = "НеИспользует",
}

export const ZCurrentRowUse = z.enum(Object.keys(CurrentRowUse) as [TCurrentRowUse, ...TCurrentRowUse[]])
export const ZCurrentRowUseEnterprise = z.enum(Object.values(CurrentRowUse) as [TCurrentRowUseEnterprise, ...TCurrentRowUseEnterprise[]])

export type TCurrentRowUse = keyof typeof CurrentRowUse
export type TCurrentRowUseEnterprise = `${CurrentRowUse}`

enum DataChangeType {
  Create = "Добавление",
  Update = "Изменение",
  Delete = "Удаление",
}

export const ZDataChangeType = z.enum(Object.keys(DataChangeType) as [TDataChangeType, ...TDataChangeType[]])
export const ZDataChangeTypeEnterprise = z.enum(Object.values(DataChangeType) as [TDataChangeTypeEnterprise, ...TDataChangeTypeEnterprise[]])

export type TDataChangeType = keyof typeof DataChangeType
export type TDataChangeTypeEnterprise = `${DataChangeType}`

enum DateSelectionMode {
  Interval = "Интервал",
  Multiple = "Множественный",
  Single = "Одиночный",
}

export const ZDateSelectionMode = z.enum(Object.keys(DateSelectionMode) as [TDateSelectionMode, ...TDateSelectionMode[]])
export const ZDateSelectionModeEnterprise = z.enum(Object.values(DateSelectionMode) as [TDateSelectionModeEnterprise, ...TDateSelectionModeEnterprise[]])

export type TDateSelectionMode = keyof typeof DateSelectionMode
export type TDateSelectionModeEnterprise = `${DateSelectionMode}`

enum DimensionAttributePlacementType {
  Together = "Вместе",
  WithDimensions = "ВместеСИзмерениями",
  Separately = "Отдельно",
}

export const ZDimensionAttributePlacementType = z.enum(Object.keys(DimensionAttributePlacementType) as [TDimensionAttributePlacementType, ...TDimensionAttributePlacementType[]])
export const ZDimensionAttributePlacementTypeEnterprise = z.enum(Object.values(DimensionAttributePlacementType) as [TDimensionAttributePlacementTypeEnterprise, ...TDimensionAttributePlacementTypeEnterprise[]])

export type TDimensionAttributePlacementType = keyof typeof DimensionAttributePlacementType
export type TDimensionAttributePlacementTypeEnterprise = `${DimensionAttributePlacementType}`

enum DimensionPlacementType {
  Together = "Вместе",
  Separately = "Отдельно",
  SeparatelyAndInTotalsOnly = "ОтдельноИТолькоВИтогах",
}

export const ZDimensionPlacementType = z.enum(Object.keys(DimensionPlacementType) as [TDimensionPlacementType, ...TDimensionPlacementType[]])
export const ZDimensionPlacementTypeEnterprise = z.enum(Object.values(DimensionPlacementType) as [TDimensionPlacementTypeEnterprise, ...TDimensionPlacementTypeEnterprise[]])

export type TDimensionPlacementType = keyof typeof DimensionPlacementType
export type TDimensionPlacementTypeEnterprise = `${DimensionPlacementType}`

enum DisplayImportance {
  Auto = "Авто",
  High = "Высокая",
  Low = "Низкая",
  Usual = "Обычная",
  VeryHigh = "ОченьВысокая",
  VeryLow = "ОченьНизкая",
}

export const ZDisplayImportance = z.enum(Object.keys(DisplayImportance) as [TDisplayImportance, ...TDisplayImportance[]])
export const ZDisplayImportanceEnterprise = z.enum(Object.values(DisplayImportance) as [TDisplayImportanceEnterprise, ...TDisplayImportanceEnterprise[]])

export type TDisplayImportance = keyof typeof DisplayImportance
export type TDisplayImportanceEnterprise = `${DisplayImportance}`

enum DragAction {
  Choice = "Выбор",
  Copy = "Копирование",
  Cancel = "Отмена",
  Move = "Перемещение",
}

export const ZDragAction = z.enum(Object.keys(DragAction) as [TDragAction, ...TDragAction[]])
export const ZDragActionEnterprise = z.enum(Object.values(DragAction) as [TDragActionEnterprise, ...TDragActionEnterprise[]])

export type TDragAction = keyof typeof DragAction
export type TDragActionEnterprise = `${DragAction}`

enum DragAllowedActions {
  Copy = "Копирование",
  CopyAndMove = "КопированиеИПеремещение",
  DontProcess = "НеОбрабатывать",
  Move = "Перемещение",
}

export const ZDragAllowedActions = z.enum(Object.keys(DragAllowedActions) as [TDragAllowedActions, ...TDragAllowedActions[]])
export const ZDragAllowedActionsEnterprise = z.enum(Object.values(DragAllowedActions) as [TDragAllowedActionsEnterprise, ...TDragAllowedActionsEnterprise[]])

export type TDragAllowedActions = keyof typeof DragAllowedActions
export type TDragAllowedActionsEnterprise = `${DragAllowedActions}`

enum DrawingSelectionShowMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZDrawingSelectionShowMode = z.enum(Object.keys(DrawingSelectionShowMode) as [TDrawingSelectionShowMode, ...TDrawingSelectionShowMode[]])
export const ZDrawingSelectionShowModeEnterprise = z.enum(Object.values(DrawingSelectionShowMode) as [TDrawingSelectionShowModeEnterprise, ...TDrawingSelectionShowModeEnterprise[]])

export type TDrawingSelectionShowMode = keyof typeof DrawingSelectionShowMode
export type TDrawingSelectionShowModeEnterprise = `${DrawingSelectionShowMode}`

enum EditTextUpdate {
  Auto = "Авто",
  Always = "Всегда",
  DontUse = "НеИспользовать",
  OnValueChange = "ПриИзмененииЗначения",
}

export const ZEditTextUpdate = z.enum(Object.keys(EditTextUpdate) as [TEditTextUpdate, ...TEditTextUpdate[]])
export const ZEditTextUpdateEnterprise = z.enum(Object.values(EditTextUpdate) as [TEditTextUpdateEnterprise, ...TEditTextUpdateEnterprise[]])

export type TEditTextUpdate = keyof typeof EditTextUpdate
export type TEditTextUpdateEnterprise = `${EditTextUpdate}`

enum FitPageMode {
  Auto = "Авто",
  PageWidth = "ПоШиринеСтраницы",
  Proportionally = "Пропорционально",
}

export const ZFitPageMode = z.enum(Object.keys(FitPageMode) as [TFitPageMode, ...TFitPageMode[]])
export const ZFitPageModeEnterprise = z.enum(Object.values(FitPageMode) as [TFitPageModeEnterprise, ...TFitPageModeEnterprise[]])

export type TFitPageMode = keyof typeof FitPageMode
export type TFitPageModeEnterprise = `${FitPageMode}`

enum FixingInTable {
  Left = "Лево",
  None = "Нет",
  Right = "Право",
}

export const ZFixingInTable = z.enum(Object.keys(FixingInTable) as [TFixingInTable, ...TFixingInTable[]])
export const ZFixingInTableEnterprise = z.enum(Object.values(FixingInTable) as [TFixingInTableEnterprise, ...TFixingInTableEnterprise[]])

export type TFixingInTable = keyof typeof FixingInTable
export type TFixingInTableEnterprise = `${FixingInTable}`

enum FoldersAndItems {
  Auto = "Авто",
  Folders = "Группы",
  FoldersAndItems = "ГруппыИЭлементы",
  Items = "Элементы",
}

export const ZFoldersAndItems = z.enum(Object.keys(FoldersAndItems) as [TFoldersAndItems, ...TFoldersAndItems[]])
export const ZFoldersAndItemsEnterprise = z.enum(Object.values(FoldersAndItems) as [TFoldersAndItemsEnterprise, ...TFoldersAndItemsEnterprise[]])

export type TFoldersAndItems = keyof typeof FoldersAndItems
export type TFoldersAndItemsEnterprise = `${FoldersAndItems}`

enum FormButtonPictureLocation {
  Auto = "Авто",
  Left = "Лево",
  Right = "Право",
}

export const ZFormButtonPictureLocation = z.enum(Object.keys(FormButtonPictureLocation) as [TFormButtonPictureLocation, ...TFormButtonPictureLocation[]])
export const ZFormButtonPictureLocationEnterprise = z.enum(Object.values(FormButtonPictureLocation) as [TFormButtonPictureLocationEnterprise, ...TFormButtonPictureLocationEnterprise[]])

export type TFormButtonPictureLocation = keyof typeof FormButtonPictureLocation
export type TFormButtonPictureLocationEnterprise = `${FormButtonPictureLocation}`

enum FormButtonType {
  Hyperlink = "Гиперссылка",
  CommandBarHyperlink = "ГиперссылкаКоманднойПанели",
  CommandBarButton = "КнопкаКоманднойПанели",
  UsualButton = "ОбычнаяКнопка",
}

export const ZFormButtonType = z.enum(Object.keys(FormButtonType) as [TFormButtonType, ...TFormButtonType[]])
export const ZFormButtonTypeEnterprise = z.enum(Object.values(FormButtonType) as [TFormButtonTypeEnterprise, ...TFormButtonTypeEnterprise[]])

export type TFormButtonType = keyof typeof FormButtonType
export type TFormButtonTypeEnterprise = `${FormButtonType}`

enum FormCommandBarLabelLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export const ZFormCommandBarLabelLocation = z.enum(Object.keys(FormCommandBarLabelLocation) as [TFormCommandBarLabelLocation, ...TFormCommandBarLabelLocation[]])
export const ZFormCommandBarLabelLocationEnterprise = z.enum(Object.values(FormCommandBarLabelLocation) as [TFormCommandBarLabelLocationEnterprise, ...TFormCommandBarLabelLocationEnterprise[]])

export type TFormCommandBarLabelLocation = keyof typeof FormCommandBarLabelLocation
export type TFormCommandBarLabelLocationEnterprise = `${FormCommandBarLabelLocation}`

enum FormConversationsRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZFormConversationsRepresentation = z.enum(Object.keys(FormConversationsRepresentation) as [TFormConversationsRepresentation, ...TFormConversationsRepresentation[]])
export const ZFormConversationsRepresentationEnterprise = z.enum(Object.values(FormConversationsRepresentation) as [TFormConversationsRepresentationEnterprise, ...TFormConversationsRepresentationEnterprise[]])

export type TFormConversationsRepresentation = keyof typeof FormConversationsRepresentation
export type TFormConversationsRepresentationEnterprise = `${FormConversationsRepresentation}`

enum FormDecorationType {
  Picture = "Картинка",
  Label = "Надпись",
}

export const ZFormDecorationType = z.enum(Object.keys(FormDecorationType) as [TFormDecorationType, ...TFormDecorationType[]])
export const ZFormDecorationTypeEnterprise = z.enum(Object.values(FormDecorationType) as [TFormDecorationTypeEnterprise, ...TFormDecorationTypeEnterprise[]])

export type TFormDecorationType = keyof typeof FormDecorationType
export type TFormDecorationTypeEnterprise = `${FormDecorationType}`

enum FormFieldType {
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

export const ZFormFieldType = z.enum(Object.keys(FormFieldType) as [TFormFieldType, ...TFormFieldType[]])
export const ZFormFieldTypeEnterprise = z.enum(Object.values(FormFieldType) as [TFormFieldTypeEnterprise, ...TFormFieldTypeEnterprise[]])

export type TFormFieldType = keyof typeof FormFieldType
export type TFormFieldTypeEnterprise = `${FormFieldType}`

enum FormGroupType {
  ButtonGroup = "ГруппаКнопок",
  ColumnGroup = "ГруппаКолонок",
  CommandBar = "КоманднаяПанель",
  ContextMenu = "КонтекстноеМеню",
  UsualGroup = "ОбычнаяГруппа",
  Popup = "Подменю",
  Page = "Страница",
  Pages = "Страницы",
}

export const ZFormGroupType = z.enum(Object.keys(FormGroupType) as [TFormGroupType, ...TFormGroupType[]])
export const ZFormGroupTypeEnterprise = z.enum(Object.values(FormGroupType) as [TFormGroupTypeEnterprise, ...TFormGroupTypeEnterprise[]])

export type TFormGroupType = keyof typeof FormGroupType
export type TFormGroupTypeEnterprise = `${FormGroupType}`

enum FormItemAdditionType {
  ViewStatusRepresentation = "ОтображениеСостоянияПросмотра",
  SearchStringRepresentation = "ОтображениеСтрокиПоиска",
  SearchControl = "УправлениеПоиском",
}

export const ZFormItemAdditionType = z.enum(Object.keys(FormItemAdditionType) as [TFormItemAdditionType, ...TFormItemAdditionType[]])
export const ZFormItemAdditionTypeEnterprise = z.enum(Object.values(FormItemAdditionType) as [TFormItemAdditionTypeEnterprise, ...TFormItemAdditionTypeEnterprise[]])

export type TFormItemAdditionType = keyof typeof FormItemAdditionType
export type TFormItemAdditionTypeEnterprise = `${FormItemAdditionType}`

enum FormItemCommandBarLabelLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export const ZFormItemCommandBarLabelLocation = z.enum(Object.keys(FormItemCommandBarLabelLocation) as [TFormItemCommandBarLabelLocation, ...TFormItemCommandBarLabelLocation[]])
export const ZFormItemCommandBarLabelLocationEnterprise = z.enum(Object.values(FormItemCommandBarLabelLocation) as [TFormItemCommandBarLabelLocationEnterprise, ...TFormItemCommandBarLabelLocationEnterprise[]])

export type TFormItemCommandBarLabelLocation = keyof typeof FormItemCommandBarLabelLocation
export type TFormItemCommandBarLabelLocationEnterprise = `${FormItemCommandBarLabelLocation}`

enum FormItemOrientation {
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
}

export const ZFormItemOrientation = z.enum(Object.keys(FormItemOrientation) as [TFormItemOrientation, ...TFormItemOrientation[]])
export const ZFormItemOrientationEnterprise = z.enum(Object.values(FormItemOrientation) as [TFormItemOrientationEnterprise, ...TFormItemOrientationEnterprise[]])

export type TFormItemOrientation = keyof typeof FormItemOrientation
export type TFormItemOrientationEnterprise = `${FormItemOrientation}`

enum FormItemSpacing {
  Auto = "Авто",
  Double = "Двойной",
  None = "Нет",
  Single = "Одинарный",
  Half = "Половинный",
  OneAndHalf = "Полуторный",
}

export const ZFormItemSpacing = z.enum(Object.keys(FormItemSpacing) as [TFormItemSpacing, ...TFormItemSpacing[]])
export const ZFormItemSpacingEnterprise = z.enum(Object.values(FormItemSpacing) as [TFormItemSpacingEnterprise, ...TFormItemSpacingEnterprise[]])

export type TFormItemSpacing = keyof typeof FormItemSpacing
export type TFormItemSpacingEnterprise = `${FormItemSpacing}`

enum FormItemTitleLocation {
  Auto = "Авто",
  Top = "Верх",
  Left = "Лево",
  None = "Нет",
  Bottom = "Низ",
  Right = "Право",
}

export const ZFormItemTitleLocation = z.enum(Object.keys(FormItemTitleLocation) as [TFormItemTitleLocation, ...TFormItemTitleLocation[]])
export const ZFormItemTitleLocationEnterprise = z.enum(Object.values(FormItemTitleLocation) as [TFormItemTitleLocationEnterprise, ...TFormItemTitleLocationEnterprise[]])

export type TFormItemTitleLocation = keyof typeof FormItemTitleLocation
export type TFormItemTitleLocationEnterprise = `${FormItemTitleLocation}`

enum FormPagesRepresentation {
  Auto = "Авто",
  TabsOnTop = "ЗакладкиСверху",
  TabsOnLeftHorizontal = "ЗакладкиСлеваГоризонтально",
  TabsOnBottom = "ЗакладкиСнизу",
  TabsOnRightHorizontal = "ЗакладкиСправаГоризонтально",
  None = "Нет",
  Swipe = "Пролистывание",
}

export const ZFormPagesRepresentation = z.enum(Object.keys(FormPagesRepresentation) as [TFormPagesRepresentation, ...TFormPagesRepresentation[]])
export const ZFormPagesRepresentationEnterprise = z.enum(Object.values(FormPagesRepresentation) as [TFormPagesRepresentationEnterprise, ...TFormPagesRepresentationEnterprise[]])

export type TFormPagesRepresentation = keyof typeof FormPagesRepresentation
export type TFormPagesRepresentationEnterprise = `${FormPagesRepresentation}`

enum FormPagesState {
  Titles = "Заголовки",
  TitlesAndCurrentPage = "ЗаголовкиИТекущаяСтраница",
  CurrentPage = "ТекущаяСтраница",
}

export const ZFormPagesState = z.enum(Object.keys(FormPagesState) as [TFormPagesState, ...TFormPagesState[]])
export const ZFormPagesStateEnterprise = z.enum(Object.values(FormPagesState) as [TFormPagesStateEnterprise, ...TFormPagesStateEnterprise[]])

export type TFormPagesState = keyof typeof FormPagesState
export type TFormPagesStateEnterprise = `${FormPagesState}`

enum FormStandardURLVariant {
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

export const ZFormStandardURLVariant = z.enum(Object.keys(FormStandardURLVariant) as [TFormStandardURLVariant, ...TFormStandardURLVariant[]])
export const ZFormStandardURLVariantEnterprise = z.enum(Object.values(FormStandardURLVariant) as [TFormStandardURLVariantEnterprise, ...TFormStandardURLVariantEnterprise[]])

export type TFormStandardURLVariant = keyof typeof FormStandardURLVariant
export type TFormStandardURLVariantEnterprise = `${FormStandardURLVariant}`

enum FormWindowOpeningMode {
  LockWholeInterface = "БлокироватьВесьИнтерфейс",
  LockOwnerWindow = "БлокироватьОкноВладельца",
  DontBlock = "НеБлокировать",
}

export const ZFormWindowOpeningMode = z.enum(Object.keys(FormWindowOpeningMode) as [TFormWindowOpeningMode, ...TFormWindowOpeningMode[]])
export const ZFormWindowOpeningModeEnterprise = z.enum(Object.values(FormWindowOpeningMode) as [TFormWindowOpeningModeEnterprise, ...TFormWindowOpeningModeEnterprise[]])

export type TFormWindowOpeningMode = keyof typeof FormWindowOpeningMode
export type TFormWindowOpeningModeEnterprise = `${FormWindowOpeningMode}`

enum GraphicalSchemaGridDrawMode {
  Lines = "Линии",
  None = "НеРисовать",
  Dots = "Точки",
  Chess = "ШахматнаяСетка",
}

export const ZGraphicalSchemaGridDrawMode = z.enum(Object.keys(GraphicalSchemaGridDrawMode) as [TGraphicalSchemaGridDrawMode, ...TGraphicalSchemaGridDrawMode[]])
export const ZGraphicalSchemaGridDrawModeEnterprise = z.enum(Object.values(GraphicalSchemaGridDrawMode) as [TGraphicalSchemaGridDrawModeEnterprise, ...TGraphicalSchemaGridDrawModeEnterprise[]])

export type TGraphicalSchemaGridDrawMode = keyof typeof GraphicalSchemaGridDrawMode
export type TGraphicalSchemaGridDrawModeEnterprise = `${GraphicalSchemaGridDrawMode}`

enum GraphicalSchemaItemPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export const ZGraphicalSchemaItemPictureLocation = z.enum(Object.keys(GraphicalSchemaItemPictureLocation) as [TGraphicalSchemaItemPictureLocation, ...TGraphicalSchemaItemPictureLocation[]])
export const ZGraphicalSchemaItemPictureLocationEnterprise = z.enum(Object.values(GraphicalSchemaItemPictureLocation) as [TGraphicalSchemaItemPictureLocationEnterprise, ...TGraphicalSchemaItemPictureLocationEnterprise[]])

export type TGraphicalSchemaItemPictureLocation = keyof typeof GraphicalSchemaItemPictureLocation
export type TGraphicalSchemaItemPictureLocationEnterprise = `${GraphicalSchemaItemPictureLocation}`

enum GraphicalSchemaShapes {
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

export const ZGraphicalSchemaShapes = z.enum(Object.keys(GraphicalSchemaShapes) as [TGraphicalSchemaShapes, ...TGraphicalSchemaShapes[]])
export const ZGraphicalSchemaShapesEnterprise = z.enum(Object.values(GraphicalSchemaShapes) as [TGraphicalSchemaShapesEnterprise, ...TGraphicalSchemaShapesEnterprise[]])

export type TGraphicalSchemaShapes = keyof typeof GraphicalSchemaShapes
export type TGraphicalSchemaShapesEnterprise = `${GraphicalSchemaShapes}`

enum GraphicalSchemeElementSideType {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export const ZGraphicalSchemeElementSideType = z.enum(Object.keys(GraphicalSchemeElementSideType) as [TGraphicalSchemeElementSideType, ...TGraphicalSchemeElementSideType[]])
export const ZGraphicalSchemeElementSideTypeEnterprise = z.enum(Object.values(GraphicalSchemeElementSideType) as [TGraphicalSchemeElementSideTypeEnterprise, ...TGraphicalSchemeElementSideTypeEnterprise[]])

export type TGraphicalSchemeElementSideType = keyof typeof GraphicalSchemeElementSideType
export type TGraphicalSchemeElementSideTypeEnterprise = `${GraphicalSchemeElementSideType}`

enum HorizontalAlign {
  Auto = "Авто",
  Left = "Лево",
  Justify = "ПоШирине",
  Right = "Право",
  Center = "Центр",
}

export const ZHorizontalAlign = z.enum(Object.keys(HorizontalAlign) as [THorizontalAlign, ...THorizontalAlign[]])
export const ZHorizontalAlignEnterprise = z.enum(Object.values(HorizontalAlign) as [THorizontalAlignEnterprise, ...THorizontalAlignEnterprise[]])

export type THorizontalAlign = keyof typeof HorizontalAlign
export type THorizontalAlignEnterprise = `${HorizontalAlign}`

enum HTMLDocumentFieldMode {
  Browse = "Просмотр",
  Design = "Редактирование",
}

export const ZHTMLDocumentFieldMode = z.enum(Object.keys(HTMLDocumentFieldMode) as [THTMLDocumentFieldMode, ...THTMLDocumentFieldMode[]])
export const ZHTMLDocumentFieldModeEnterprise = z.enum(Object.values(HTMLDocumentFieldMode) as [THTMLDocumentFieldModeEnterprise, ...THTMLDocumentFieldModeEnterprise[]])

export type THTMLDocumentFieldMode = keyof typeof HTMLDocumentFieldMode
export type THTMLDocumentFieldModeEnterprise = `${HTMLDocumentFieldMode}`

enum IncompleteChoiceMode {
  OnActivate = "ПриАктивизации",
  OnEnterPressed = "ПриНажатииEnter",
}

export const ZIncompleteChoiceMode = z.enum(Object.keys(IncompleteChoiceMode) as [TIncompleteChoiceMode, ...TIncompleteChoiceMode[]])
export const ZIncompleteChoiceModeEnterprise = z.enum(Object.values(IncompleteChoiceMode) as [TIncompleteChoiceModeEnterprise, ...TIncompleteChoiceModeEnterprise[]])

export type TIncompleteChoiceMode = keyof typeof IncompleteChoiceMode
export type TIncompleteChoiceModeEnterprise = `${IncompleteChoiceMode}`

enum InitialListView {
  Auto = "Авто",
  End = "Конец",
  Beginning = "Начало",
}

export const ZInitialListView = z.enum(Object.keys(InitialListView) as [TInitialListView, ...TInitialListView[]])
export const ZInitialListViewEnterprise = z.enum(Object.values(InitialListView) as [TInitialListViewEnterprise, ...TInitialListViewEnterprise[]])

export type TInitialListView = keyof typeof InitialListView
export type TInitialListViewEnterprise = `${InitialListView}`

enum InitialTreeView {
  NoExpand = "НеРаскрывать",
  ExpandTopLevel = "РаскрыватьВерхнийУровень",
  ExpandAllLevels = "РаскрыватьВсеУровни",
}

export const ZInitialTreeView = z.enum(Object.keys(InitialTreeView) as [TInitialTreeView, ...TInitialTreeView[]])
export const ZInitialTreeViewEnterprise = z.enum(Object.values(InitialTreeView) as [TInitialTreeViewEnterprise, ...TInitialTreeViewEnterprise[]])

export type TInitialTreeView = keyof typeof InitialTreeView
export type TInitialTreeViewEnterprise = `${InitialTreeView}`

enum InputFieldAutofillHint {
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

export const ZInputFieldAutofillHint = z.enum(Object.keys(InputFieldAutofillHint) as [TInputFieldAutofillHint, ...TInputFieldAutofillHint[]])
export const ZInputFieldAutofillHintEnterprise = z.enum(Object.values(InputFieldAutofillHint) as [TInputFieldAutofillHintEnterprise, ...TInputFieldAutofillHintEnterprise[]])

export type TInputFieldAutofillHint = keyof typeof InputFieldAutofillHint
export type TInputFieldAutofillHintEnterprise = `${InputFieldAutofillHint}`

enum InputFieldCommandSource {
  MultipleValue = "МножественноеЗначение",
  InputArea = "ОбластьВвода",
}

export const ZInputFieldCommandSource = z.enum(Object.keys(InputFieldCommandSource) as [TInputFieldCommandSource, ...TInputFieldCommandSource[]])
export const ZInputFieldCommandSourceEnterprise = z.enum(Object.values(InputFieldCommandSource) as [TInputFieldCommandSourceEnterprise, ...TInputFieldCommandSourceEnterprise[]])

export type TInputFieldCommandSource = keyof typeof InputFieldCommandSource
export type TInputFieldCommandSourceEnterprise = `${InputFieldCommandSource}`

enum InputFieldMultipleValuePictureShape {
  Auto = "Авто",
  Rect = "Квадрат",
  Circle = "Круг",
}

export const ZInputFieldMultipleValuePictureShape = z.enum(Object.keys(InputFieldMultipleValuePictureShape) as [TInputFieldMultipleValuePictureShape, ...TInputFieldMultipleValuePictureShape[]])
export const ZInputFieldMultipleValuePictureShapeEnterprise = z.enum(Object.values(InputFieldMultipleValuePictureShape) as [TInputFieldMultipleValuePictureShapeEnterprise, ...TInputFieldMultipleValuePictureShapeEnterprise[]])

export type TInputFieldMultipleValuePictureShape = keyof typeof InputFieldMultipleValuePictureShape
export type TInputFieldMultipleValuePictureShapeEnterprise = `${InputFieldMultipleValuePictureShape}`

enum InputFieldMultipleValuePictureSize {
  Auto = "Авто",
  Large = "Крупный",
  Small = "Маленький",
  Medium = "Средний",
}

export const ZInputFieldMultipleValuePictureSize = z.enum(Object.keys(InputFieldMultipleValuePictureSize) as [TInputFieldMultipleValuePictureSize, ...TInputFieldMultipleValuePictureSize[]])
export const ZInputFieldMultipleValuePictureSizeEnterprise = z.enum(Object.values(InputFieldMultipleValuePictureSize) as [TInputFieldMultipleValuePictureSizeEnterprise, ...TInputFieldMultipleValuePictureSizeEnterprise[]])

export type TInputFieldMultipleValuePictureSize = keyof typeof InputFieldMultipleValuePictureSize
export type TInputFieldMultipleValuePictureSizeEnterprise = `${InputFieldMultipleValuePictureSize}`

enum InputFieldStandardCommand {
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

export const ZInputFieldStandardCommand = z.enum(Object.keys(InputFieldStandardCommand) as [TInputFieldStandardCommand, ...TInputFieldStandardCommand[]])
export const ZInputFieldStandardCommandEnterprise = z.enum(Object.values(InputFieldStandardCommand) as [TInputFieldStandardCommandEnterprise, ...TInputFieldStandardCommandEnterprise[]])

export type TInputFieldStandardCommand = keyof typeof InputFieldStandardCommand
export type TInputFieldStandardCommandEnterprise = `${InputFieldStandardCommand}`

enum ItemHeightControlVariant {
  Auto = "Авто",
  UseHeightInFormRows = "ВСтрокахФормы",
  UseContentHeight = "ПоСодержимому",
}

export const ZItemHeightControlVariant = z.enum(Object.keys(ItemHeightControlVariant) as [TItemHeightControlVariant, ...TItemHeightControlVariant[]])
export const ZItemHeightControlVariantEnterprise = z.enum(Object.values(ItemHeightControlVariant) as [TItemHeightControlVariantEnterprise, ...TItemHeightControlVariantEnterprise[]])

export type TItemHeightControlVariant = keyof typeof ItemHeightControlVariant
export type TItemHeightControlVariantEnterprise = `${ItemHeightControlVariant}`

enum ItemHorizontalLocation {
  Auto = "Авто",
  Left = "Лево",
  Right = "Право",
  Center = "Центр",
}

export const ZItemHorizontalLocation = z.enum(Object.keys(ItemHorizontalLocation) as [TItemHorizontalLocation, ...TItemHorizontalLocation[]])
export const ZItemHorizontalLocationEnterprise = z.enum(Object.values(ItemHorizontalLocation) as [TItemHorizontalLocationEnterprise, ...TItemHorizontalLocationEnterprise[]])

export type TItemHorizontalLocation = keyof typeof ItemHorizontalLocation
export type TItemHorizontalLocationEnterprise = `${ItemHorizontalLocation}`

enum ItemsAndTitlesAlignVariant {
  Auto = "Авто",
  None = "Нет",
  ItemsLeftTitlesLeft = "ЭлементыЛевоЗаголовкиЛево",
  ItemsLeftTitlesRight = "ЭлементыЛевоЗаголовкиПраво",
  ItemsRightTitlesLeft = "ЭлементыПравоЗаголовкиЛево",
  ItemsRightTitlesRight = "ЭлементыПравоЗаголовкиПраво",
}

export const ZItemsAndTitlesAlignVariant = z.enum(Object.keys(ItemsAndTitlesAlignVariant) as [TItemsAndTitlesAlignVariant, ...TItemsAndTitlesAlignVariant[]])
export const ZItemsAndTitlesAlignVariantEnterprise = z.enum(Object.values(ItemsAndTitlesAlignVariant) as [TItemsAndTitlesAlignVariantEnterprise, ...TItemsAndTitlesAlignVariantEnterprise[]])

export type TItemsAndTitlesAlignVariant = keyof typeof ItemsAndTitlesAlignVariant
export type TItemsAndTitlesAlignVariantEnterprise = `${ItemsAndTitlesAlignVariant}`

enum ItemVerticalAlign {
  Auto = "Авто",
  Top = "Верх",
  Bottom = "Низ",
  Center = "Центр",
}

export const ZItemVerticalAlign = z.enum(Object.keys(ItemVerticalAlign) as [TItemVerticalAlign, ...TItemVerticalAlign[]])
export const ZItemVerticalAlignEnterprise = z.enum(Object.values(ItemVerticalAlign) as [TItemVerticalAlignEnterprise, ...TItemVerticalAlignEnterprise[]])

export type TItemVerticalAlign = keyof typeof ItemVerticalAlign
export type TItemVerticalAlignEnterprise = `${ItemVerticalAlign}`

enum LabelPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export const ZLabelPictureLocation = z.enum(Object.keys(LabelPictureLocation) as [TLabelPictureLocation, ...TLabelPictureLocation[]])
export const ZLabelPictureLocationEnterprise = z.enum(Object.values(LabelPictureLocation) as [TLabelPictureLocationEnterprise, ...TLabelPictureLocationEnterprise[]])

export type TLabelPictureLocation = keyof typeof LabelPictureLocation
export type TLabelPictureLocationEnterprise = `${LabelPictureLocation}`

enum LinkedValueChangeMode {
  DontChange = "НеИзменять",
  Clear = "Очищать",
}

export const ZLinkedValueChangeMode = z.enum(Object.keys(LinkedValueChangeMode) as [TLinkedValueChangeMode, ...TLinkedValueChangeMode[]])
export const ZLinkedValueChangeModeEnterprise = z.enum(Object.values(LinkedValueChangeMode) as [TLinkedValueChangeModeEnterprise, ...TLinkedValueChangeModeEnterprise[]])

export type TLinkedValueChangeMode = keyof typeof LinkedValueChangeMode
export type TLinkedValueChangeModeEnterprise = `${LinkedValueChangeMode}`

enum ListEditMode {
  InDialog = "ВДиалоге",
  InList = "ВСписке",
}

export const ZListEditMode = z.enum(Object.keys(ListEditMode) as [TListEditMode, ...TListEditMode[]])
export const ZListEditModeEnterprise = z.enum(Object.values(ListEditMode) as [TListEditModeEnterprise, ...TListEditModeEnterprise[]])

export type TListEditMode = keyof typeof ListEditMode
export type TListEditModeEnterprise = `${ListEditMode}`

enum MainClientApplicationWindowMode {
  EmbeddedWorkplace = "ВстроенноеРабочееМесто",
  Kiosk = "Киоск",
  Normal = "Обычный",
  FullscreenWorkplace = "ПолноэкранноеРабочееМесто",
  Workplace = "РабочееМесто",
}

export const ZMainClientApplicationWindowMode = z.enum(Object.keys(MainClientApplicationWindowMode) as [TMainClientApplicationWindowMode, ...TMainClientApplicationWindowMode[]])
export const ZMainClientApplicationWindowModeEnterprise = z.enum(Object.values(MainClientApplicationWindowMode) as [TMainClientApplicationWindowModeEnterprise, ...TMainClientApplicationWindowModeEnterprise[]])

export type TMainClientApplicationWindowMode = keyof typeof MainClientApplicationWindowMode
export type TMainClientApplicationWindowModeEnterprise = `${MainClientApplicationWindowMode}`

enum NewRowShowCheckVariant {
  DontCheck = "НеПроверять",
  FilterMismatchMessage = "СообщатьОНесоответствииОтбору",
}

export const ZNewRowShowCheckVariant = z.enum(Object.keys(NewRowShowCheckVariant) as [TNewRowShowCheckVariant, ...TNewRowShowCheckVariant[]])
export const ZNewRowShowCheckVariantEnterprise = z.enum(Object.values(NewRowShowCheckVariant) as [TNewRowShowCheckVariantEnterprise, ...TNewRowShowCheckVariantEnterprise[]])

export type TNewRowShowCheckVariant = keyof typeof NewRowShowCheckVariant
export type TNewRowShowCheckVariantEnterprise = `${NewRowShowCheckVariant}`

enum OnScreenKeyboardReturnKeyText {
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

export const ZOnScreenKeyboardReturnKeyText = z.enum(Object.keys(OnScreenKeyboardReturnKeyText) as [TOnScreenKeyboardReturnKeyText, ...TOnScreenKeyboardReturnKeyText[]])
export const ZOnScreenKeyboardReturnKeyTextEnterprise = z.enum(Object.values(OnScreenKeyboardReturnKeyText) as [TOnScreenKeyboardReturnKeyTextEnterprise, ...TOnScreenKeyboardReturnKeyTextEnterprise[]])

export type TOnScreenKeyboardReturnKeyText = keyof typeof OnScreenKeyboardReturnKeyText
export type TOnScreenKeyboardReturnKeyTextEnterprise = `${OnScreenKeyboardReturnKeyText}`

enum Orientation {
  Auto = "Авто",
  Vertical = "Вертикально",
  Horizontal = "Горизонтально",
}

export const ZOrientation = z.enum(Object.keys(Orientation) as [TOrientation, ...TOrientation[]])
export const ZOrientationEnterprise = z.enum(Object.values(Orientation) as [TOrientationEnterprise, ...TOrientationEnterprise[]])

export type TOrientation = keyof typeof Orientation
export type TOrientationEnterprise = `${Orientation}`

enum PanelPictureLocation {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
  Center = "Центр",
}

export const ZPanelPictureLocation = z.enum(Object.keys(PanelPictureLocation) as [TPanelPictureLocation, ...TPanelPictureLocation[]])
export const ZPanelPictureLocationEnterprise = z.enum(Object.values(PanelPictureLocation) as [TPanelPictureLocationEnterprise, ...TPanelPictureLocationEnterprise[]])

export type TPanelPictureLocation = keyof typeof PanelPictureLocation
export type TPanelPictureLocationEnterprise = `${PanelPictureLocation}`

enum PictureFormat {
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

export const ZPictureFormat = z.enum(Object.keys(PictureFormat) as [TPictureFormat, ...TPictureFormat[]])
export const ZPictureFormatEnterprise = z.enum(Object.values(PictureFormat) as [TPictureFormatEnterprise, ...TPictureFormatEnterprise[]])

export type TPictureFormat = keyof typeof PictureFormat
export type TPictureFormatEnterprise = `${PictureFormat}`

enum PictureSize {
  AutoSize = "АвтоРазмер",
  AutoSizeIgnoreScale = "АвтоРазмерБезУчетаМасштаба",
  ByFontSize = "ПоРазмеруШрифта",
  Proportionally = "Пропорционально",
  Stretch = "Растянуть",
  RealSize = "РеальныйРазмер",
  RealSizeIgnoreScale = "РеальныйРазмерБезУчетаМасштаба",
  Tile = "Черепица",
}

export const ZPictureSize = z.enum(Object.keys(PictureSize) as [TPictureSize, ...TPictureSize[]])
export const ZPictureSizeEnterprise = z.enum(Object.values(PictureSize) as [TPictureSizeEnterprise, ...TPictureSizeEnterprise[]])

export type TPictureSize = keyof typeof PictureSize
export type TPictureSizeEnterprise = `${PictureSize}`

enum PrintDialogUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZPrintDialogUseMode = z.enum(Object.keys(PrintDialogUseMode) as [TPrintDialogUseMode, ...TPrintDialogUseMode[]])
export const ZPrintDialogUseModeEnterprise = z.enum(Object.values(PrintDialogUseMode) as [TPrintDialogUseModeEnterprise, ...TPrintDialogUseModeEnterprise[]])

export type TPrintDialogUseMode = keyof typeof PrintDialogUseMode
export type TPrintDialogUseModeEnterprise = `${PrintDialogUseMode}`

enum ProgressBarSmoothingMode {
  Smooth = "Плавный",
  Broken = "Прерывистый",
  BrokenTilt = "ПрерывистыйНаклонный",
}

export const ZProgressBarSmoothingMode = z.enum(Object.keys(ProgressBarSmoothingMode) as [TProgressBarSmoothingMode, ...TProgressBarSmoothingMode[]])
export const ZProgressBarSmoothingModeEnterprise = z.enum(Object.values(ProgressBarSmoothingMode) as [TProgressBarSmoothingModeEnterprise, ...TProgressBarSmoothingModeEnterprise[]])

export type TProgressBarSmoothingMode = keyof typeof ProgressBarSmoothingMode
export type TProgressBarSmoothingModeEnterprise = `${ProgressBarSmoothingMode}`

enum RadioButtonType {
  Auto = "Авто",
  RadioButton = "Переключатель",
  Tumbler = "Тумблер",
}

export const ZRadioButtonType = z.enum(Object.keys(RadioButtonType) as [TRadioButtonType, ...TRadioButtonType[]])
export const ZRadioButtonTypeEnterprise = z.enum(Object.values(RadioButtonType) as [TRadioButtonTypeEnterprise, ...TRadioButtonTypeEnterprise[]])

export type TRadioButtonType = keyof typeof RadioButtonType
export type TRadioButtonTypeEnterprise = `${RadioButtonType}`

enum RefreshRequestMethod {
  None = "Нет",
  PullFromTop = "ПотянутьСверху",
  PullFromTopOrBottom = "ПотянутьСверхуИлиСнизу",
  PullFromBottom = "ПотянутьСнизу",
}

export const ZRefreshRequestMethod = z.enum(Object.keys(RefreshRequestMethod) as [TRefreshRequestMethod, ...TRefreshRequestMethod[]])
export const ZRefreshRequestMethodEnterprise = z.enum(Object.values(RefreshRequestMethod) as [TRefreshRequestMethodEnterprise, ...TRefreshRequestMethodEnterprise[]])

export type TRefreshRequestMethod = keyof typeof RefreshRequestMethod
export type TRefreshRequestMethodEnterprise = `${RefreshRequestMethod}`

enum ReportFormType {
  Variant = "Вариант",
  Settings = "Настройка",
  Main = "Основная",
}

export const ZReportFormType = z.enum(Object.keys(ReportFormType) as [TReportFormType, ...TReportFormType[]])
export const ZReportFormTypeEnterprise = z.enum(Object.values(ReportFormType) as [TReportFormTypeEnterprise, ...TReportFormTypeEnterprise[]])

export type TReportFormType = keyof typeof ReportFormType
export type TReportFormTypeEnterprise = `${ReportFormType}`

enum ReportResultViewMode {
  Auto = "Авто",
  Compact = "Компактный",
  Default = "Обычный",
}

export const ZReportResultViewMode = z.enum(Object.keys(ReportResultViewMode) as [TReportResultViewMode, ...TReportResultViewMode[]])
export const ZReportResultViewModeEnterprise = z.enum(Object.values(ReportResultViewMode) as [TReportResultViewModeEnterprise, ...TReportResultViewModeEnterprise[]])

export type TReportResultViewMode = keyof typeof ReportResultViewMode
export type TReportResultViewModeEnterprise = `${ReportResultViewMode}`

enum SaveFormDataInSettings {
  UseList = "ИспользоватьСписок",
  DontUse = "НеИспользовать",
}

export const ZSaveFormDataInSettings = z.enum(Object.keys(SaveFormDataInSettings) as [TSaveFormDataInSettings, ...TSaveFormDataInSettings[]])
export const ZSaveFormDataInSettingsEnterprise = z.enum(Object.values(SaveFormDataInSettings) as [TSaveFormDataInSettingsEnterprise, ...TSaveFormDataInSettingsEnterprise[]])

export type TSaveFormDataInSettings = keyof typeof SaveFormDataInSettings
export type TSaveFormDataInSettingsEnterprise = `${SaveFormDataInSettings}`

enum ScrollBarUse {
  AutoUse = "ИспользоватьАвтоматически",
  UseAlways = "ИспользоватьВсегда",
  DontUse = "НеИспользовать",
}

export const ZScrollBarUse = z.enum(Object.keys(ScrollBarUse) as [TScrollBarUse, ...TScrollBarUse[]])
export const ZScrollBarUseEnterprise = z.enum(Object.values(ScrollBarUse) as [TScrollBarUseEnterprise, ...TScrollBarUseEnterprise[]])

export type TScrollBarUse = keyof typeof ScrollBarUse
export type TScrollBarUseEnterprise = `${ScrollBarUse}`

enum ScrollingTextMode {
  Fast = "Быстро",
  Slow = "Медленно",
  DontUse = "НеИспользовать",
  Normal = "Нормально",
  VeryFast = "ОченьБыстро",
  VerySlow = "ОченьМедленно",
}

export const ZScrollingTextMode = z.enum(Object.keys(ScrollingTextMode) as [TScrollingTextMode, ...TScrollingTextMode[]])
export const ZScrollingTextModeEnterprise = z.enum(Object.values(ScrollingTextMode) as [TScrollingTextModeEnterprise, ...TScrollingTextModeEnterprise[]])

export type TScrollingTextMode = keyof typeof ScrollingTextMode
export type TScrollingTextModeEnterprise = `${ScrollingTextMode}`

enum SearchControlLocation {
  Auto = "Авто",
  CommandBar = "КоманднаяПанель",
  None = "Нет",
}

export const ZSearchControlLocation = z.enum(Object.keys(SearchControlLocation) as [TSearchControlLocation, ...TSearchControlLocation[]])
export const ZSearchControlLocationEnterprise = z.enum(Object.values(SearchControlLocation) as [TSearchControlLocationEnterprise, ...TSearchControlLocationEnterprise[]])

export type TSearchControlLocation = keyof typeof SearchControlLocation
export type TSearchControlLocationEnterprise = `${SearchControlLocation}`

enum SearchInTableOnInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZSearchInTableOnInput = z.enum(Object.keys(SearchInTableOnInput) as [TSearchInTableOnInput, ...TSearchInTableOnInput[]])
export const ZSearchInTableOnInputEnterprise = z.enum(Object.values(SearchInTableOnInput) as [TSearchInTableOnInputEnterprise, ...TSearchInTableOnInputEnterprise[]])

export type TSearchInTableOnInput = keyof typeof SearchInTableOnInput
export type TSearchInTableOnInputEnterprise = `${SearchInTableOnInput}`

enum SearchStringLocation {
  Auto = "Авто",
  Top = "Верх",
  FormCaption = "ЗаголовокФормы",
  CommandBar = "КоманднаяПанель",
  Bottom = "Низ",
  PullFromTop = "ПотянутьСверху",
}

export const ZSearchStringLocation = z.enum(Object.keys(SearchStringLocation) as [TSearchStringLocation, ...TSearchStringLocation[]])
export const ZSearchStringLocationEnterprise = z.enum(Object.values(SearchStringLocation) as [TSearchStringLocationEnterprise, ...TSearchStringLocationEnterprise[]])

export type TSearchStringLocation = keyof typeof SearchStringLocation
export type TSearchStringLocationEnterprise = `${SearchStringLocation}`

enum SelectionShowMode {
  Always = "Всегда",
  DontShow = "НеОтображать",
  WhenActive = "ПриАктивности",
  WhenMultipleCellsSelected = "ПриВыделенииНесколькихЯчеек",
  WhenMultipleCellsSelectedWhenActive = "ПриВыделенииНесколькихЯчеекПриАктивности",
}

export const ZSelectionShowMode = z.enum(Object.keys(SelectionShowMode) as [TSelectionShowMode, ...TSelectionShowMode[]])
export const ZSelectionShowModeEnterprise = z.enum(Object.values(SelectionShowMode) as [TSelectionShowModeEnterprise, ...TSelectionShowModeEnterprise[]])

export type TSelectionShowMode = keyof typeof SelectionShowMode
export type TSelectionShowModeEnterprise = `${SelectionShowMode}`

enum ShowTabs {
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

export const ZShowTabs = z.enum(Object.keys(ShowTabs) as [TShowTabs, ...TShowTabs[]])
export const ZShowTabsEnterprise = z.enum(Object.values(ShowTabs) as [TShowTabsEnterprise, ...TShowTabsEnterprise[]])

export type TShowTabs = keyof typeof ShowTabs
export type TShowTabsEnterprise = `${ShowTabs}`

enum SizeChangeMode {
  QuickChange = "БыстроеИзменение",
  Normal = "Обычный",
}

export const ZSizeChangeMode = z.enum(Object.keys(SizeChangeMode) as [TSizeChangeMode, ...TSizeChangeMode[]])
export const ZSizeChangeModeEnterprise = z.enum(Object.values(SizeChangeMode) as [TSizeChangeModeEnterprise, ...TSizeChangeModeEnterprise[]])

export type TSizeChangeMode = keyof typeof SizeChangeMode
export type TSizeChangeModeEnterprise = `${SizeChangeMode}`

enum SpecialTextInputMode {
  Email = "Email",
  URL = "URL",
  Auto = "Авто",
  None = "Нет",
  PhoneNumber = "НомерТелефона",
  Digits = "Цифры",
  DigitsAndPunctuation = "ЦифрыИПунктуация",
}

export const ZSpecialTextInputMode = z.enum(Object.keys(SpecialTextInputMode) as [TSpecialTextInputMode, ...TSpecialTextInputMode[]])
export const ZSpecialTextInputModeEnterprise = z.enum(Object.values(SpecialTextInputMode) as [TSpecialTextInputModeEnterprise, ...TSpecialTextInputModeEnterprise[]])

export type TSpecialTextInputMode = keyof typeof SpecialTextInputMode
export type TSpecialTextInputModeEnterprise = `${SpecialTextInputMode}`

enum SpellCheckingOnTextInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZSpellCheckingOnTextInput = z.enum(Object.keys(SpellCheckingOnTextInput) as [TSpellCheckingOnTextInput, ...TSpellCheckingOnTextInput[]])
export const ZSpellCheckingOnTextInputEnterprise = z.enum(Object.values(SpellCheckingOnTextInput) as [TSpellCheckingOnTextInputEnterprise, ...TSpellCheckingOnTextInputEnterprise[]])

export type TSpellCheckingOnTextInput = keyof typeof SpellCheckingOnTextInput
export type TSpellCheckingOnTextInputEnterprise = `${SpellCheckingOnTextInput}`

enum StandardAppearance {
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

export const ZStandardAppearance = z.enum(Object.keys(StandardAppearance) as [TStandardAppearance, ...TStandardAppearance[]])
export const ZStandardAppearanceEnterprise = z.enum(Object.values(StandardAppearance) as [TStandardAppearanceEnterprise, ...TStandardAppearanceEnterprise[]])

export type TStandardAppearance = keyof typeof StandardAppearance
export type TStandardAppearanceEnterprise = `${StandardAppearance}`

enum StandardCommandsGroup {
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

export const ZStandardCommandsGroup = z.enum(Object.keys(StandardCommandsGroup) as [TStandardCommandsGroup, ...TStandardCommandsGroup[]])
export const ZStandardCommandsGroupEnterprise = z.enum(Object.values(StandardCommandsGroup) as [TStandardCommandsGroupEnterprise, ...TStandardCommandsGroupEnterprise[]])

export type TStandardCommandsGroup = keyof typeof StandardCommandsGroup
export type TStandardCommandsGroupEnterprise = `${StandardCommandsGroup}`

enum TableBehaviorOnHorizontalCompression {
  Auto = "Авто",
  MoveItemsByImportance = "ПереноситьЭлементыПоВажности",
  HideItemsByImportance = "СкрыватьЭлементыПоВажности",
}

export const ZTableBehaviorOnHorizontalCompression = z.enum(Object.keys(TableBehaviorOnHorizontalCompression) as [TTableBehaviorOnHorizontalCompression, ...TTableBehaviorOnHorizontalCompression[]])
export const ZTableBehaviorOnHorizontalCompressionEnterprise = z.enum(Object.values(TableBehaviorOnHorizontalCompression) as [TTableBehaviorOnHorizontalCompressionEnterprise, ...TTableBehaviorOnHorizontalCompressionEnterprise[]])

export type TTableBehaviorOnHorizontalCompression = keyof typeof TableBehaviorOnHorizontalCompression
export type TTableBehaviorOnHorizontalCompressionEnterprise = `${TableBehaviorOnHorizontalCompression}`

enum TableBoxRowInputMode {
  EndOfWindow = "ВКонецОкна",
  EndOfList = "ВКонецСписка",
  BeforeCurrentRow = "ПередТекущейСтрокой",
  AfterCurrentRow = "ПослеТекущейСтроки",
}

export const ZTableBoxRowInputMode = z.enum(Object.keys(TableBoxRowInputMode) as [TTableBoxRowInputMode, ...TTableBoxRowInputMode[]])
export const ZTableBoxRowInputModeEnterprise = z.enum(Object.values(TableBoxRowInputMode) as [TTableBoxRowInputModeEnterprise, ...TTableBoxRowInputModeEnterprise[]])

export type TTableBoxRowInputMode = keyof typeof TableBoxRowInputMode
export type TTableBoxRowInputModeEnterprise = `${TableBoxRowInputMode}`

enum TableBoxRowSelectionMode {
  Row = "Строка",
  Cell = "Ячейка",
}

export const ZTableBoxRowSelectionMode = z.enum(Object.keys(TableBoxRowSelectionMode) as [TTableBoxRowSelectionMode, ...TTableBoxRowSelectionMode[]])
export const ZTableBoxRowSelectionModeEnterprise = z.enum(Object.values(TableBoxRowSelectionMode) as [TTableBoxRowSelectionModeEnterprise, ...TTableBoxRowSelectionModeEnterprise[]])

export type TTableBoxRowSelectionMode = keyof typeof TableBoxRowSelectionMode
export type TTableBoxRowSelectionModeEnterprise = `${TableBoxRowSelectionMode}`

enum TableBoxSelectionMode {
  MultiLine = "Множественный",
  SingleLine = "Одиночный",
}

export const ZTableBoxSelectionMode = z.enum(Object.keys(TableBoxSelectionMode) as [TTableBoxSelectionMode, ...TTableBoxSelectionMode[]])
export const ZTableBoxSelectionModeEnterprise = z.enum(Object.values(TableBoxSelectionMode) as [TTableBoxSelectionModeEnterprise, ...TTableBoxSelectionModeEnterprise[]])

export type TTableBoxSelectionMode = keyof typeof TableBoxSelectionMode
export type TTableBoxSelectionModeEnterprise = `${TableBoxSelectionMode}`

enum TableCurrentRowUse {
  Auto = "Авто",
  Choice = "Выбор",
  SelectionPresentation = "ОтображениеВыделения",
  SelectionPresentationAndChoice = "ОтображениеВыделенияИВыбор",
}

export const ZTableCurrentRowUse = z.enum(Object.keys(TableCurrentRowUse) as [TTableCurrentRowUse, ...TTableCurrentRowUse[]])
export const ZTableCurrentRowUseEnterprise = z.enum(Object.values(TableCurrentRowUse) as [TTableCurrentRowUseEnterprise, ...TTableCurrentRowUseEnterprise[]])

export type TTableCurrentRowUse = keyof typeof TableCurrentRowUse
export type TTableCurrentRowUseEnterprise = `${TableCurrentRowUse}`

enum TableHeightControlVariant {
  Auto = "Авто",
  UseHeightInTableRows = "ВСтрокахТаблицы",
  UseHeightInFormRows = "ВСтрокахФормы",
  UseContentHeight = "ПоСодержимому",
}

export const ZTableHeightControlVariant = z.enum(Object.keys(TableHeightControlVariant) as [TTableHeightControlVariant, ...TTableHeightControlVariant[]])
export const ZTableHeightControlVariantEnterprise = z.enum(Object.values(TableHeightControlVariant) as [TTableHeightControlVariantEnterprise, ...TTableHeightControlVariantEnterprise[]])

export type TTableHeightControlVariant = keyof typeof TableHeightControlVariant
export type TTableHeightControlVariantEnterprise = `${TableHeightControlVariant}`

enum TableRepresentation {
  Tree = "Дерево",
  HierarchicalList = "ИерархическийСписок",
  List = "Список",
}

export const ZTableRepresentation = z.enum(Object.keys(TableRepresentation) as [TTableRepresentation, ...TTableRepresentation[]])
export const ZTableRepresentationEnterprise = z.enum(Object.values(TableRepresentation) as [TTableRepresentationEnterprise, ...TTableRepresentationEnterprise[]])

export type TTableRepresentation = keyof typeof TableRepresentation
export type TTableRepresentationEnterprise = `${TableRepresentation}`

enum TableRowInputMode {
  EndOfWindow = "ВКонецОкна",
  EndOfList = "ВКонецСписка",
  BeforeCurrentRow = "ПередТекущейСтрокой",
  AfterCurrentRow = "ПослеТекущейСтроки",
}

export const ZTableRowInputMode = z.enum(Object.keys(TableRowInputMode) as [TTableRowInputMode, ...TTableRowInputMode[]])
export const ZTableRowInputModeEnterprise = z.enum(Object.values(TableRowInputMode) as [TTableRowInputModeEnterprise, ...TTableRowInputModeEnterprise[]])

export type TTableRowInputMode = keyof typeof TableRowInputMode
export type TTableRowInputModeEnterprise = `${TableRowInputMode}`

enum TableRowSelectionMode {
  Row = "Строка",
  Cell = "Ячейка",
}

export const ZTableRowSelectionMode = z.enum(Object.keys(TableRowSelectionMode) as [TTableRowSelectionMode, ...TTableRowSelectionMode[]])
export const ZTableRowSelectionModeEnterprise = z.enum(Object.values(TableRowSelectionMode) as [TTableRowSelectionModeEnterprise, ...TTableRowSelectionModeEnterprise[]])

export type TTableRowSelectionMode = keyof typeof TableRowSelectionMode
export type TTableRowSelectionModeEnterprise = `${TableRowSelectionMode}`

enum TableSelectionMode {
  MultiRow = "Множественный",
  SingleRow = "Одиночный",
}

export const ZTableSelectionMode = z.enum(Object.keys(TableSelectionMode) as [TTableSelectionMode, ...TTableSelectionMode[]])
export const ZTableSelectionModeEnterprise = z.enum(Object.values(TableSelectionMode) as [TTableSelectionModeEnterprise, ...TTableSelectionModeEnterprise[]])

export type TTableSelectionMode = keyof typeof TableSelectionMode
export type TTableSelectionModeEnterprise = `${TableSelectionMode}`

enum TaskListMode {
  AllTasks = "ВсеЗадачи",
  ByPerformer = "ПоИсполнителю",
}

export const ZTaskListMode = z.enum(Object.keys(TaskListMode) as [TTaskListMode, ...TTaskListMode[]])
export const ZTaskListModeEnterprise = z.enum(Object.values(TaskListMode) as [TTaskListModeEnterprise, ...TTaskListModeEnterprise[]])

export type TTaskListMode = keyof typeof TaskListMode
export type TTaskListModeEnterprise = `${TaskListMode}`

enum TextDirection {
  LeftToRight = "СлеваНаправо",
  RightToLeft = "СправаНалево",
}

export const ZTextDirection = z.enum(Object.keys(TextDirection) as [TTextDirection, ...TTextDirection[]])
export const ZTextDirectionEnterprise = z.enum(Object.values(TextDirection) as [TTextDirectionEnterprise, ...TTextDirectionEnterprise[]])

export type TTextDirection = keyof typeof TextDirection
export type TTextDirectionEnterprise = `${TextDirection}`

enum ThroughAlign {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZThroughAlign = z.enum(Object.keys(ThroughAlign) as [TThroughAlign, ...TThroughAlign[]])
export const ZThroughAlignEnterprise = z.enum(Object.values(ThroughAlign) as [TThroughAlignEnterprise, ...TThroughAlignEnterprise[]])

export type TThroughAlign = keyof typeof ThroughAlign
export type TThroughAlignEnterprise = `${ThroughAlign}`

enum TimeScalePosition {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export const ZTimeScalePosition = z.enum(Object.keys(TimeScalePosition) as [TTimeScalePosition, ...TTimeScalePosition[]])
export const ZTimeScalePositionEnterprise = z.enum(Object.values(TimeScalePosition) as [TTimeScalePositionEnterprise, ...TTimeScalePositionEnterprise[]])

export type TTimeScalePosition = keyof typeof TimeScalePosition
export type TTimeScalePositionEnterprise = `${TimeScalePosition}`

enum TitleLocation {
  TitleLeft = "ЗаголовокСлева",
  TitleRight = "ЗаголовокСправа",
}

export const ZTitleLocation = z.enum(Object.keys(TitleLocation) as [TTitleLocation, ...TTitleLocation[]])
export const ZTitleLocationEnterprise = z.enum(Object.values(TitleLocation) as [TTitleLocationEnterprise, ...TTitleLocationEnterprise[]])

export type TTitleLocation = keyof typeof TitleLocation
export type TTitleLocationEnterprise = `${TitleLocation}`

enum ToolTipRepresentation {
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

export const ZToolTipRepresentation = z.enum(Object.keys(ToolTipRepresentation) as [TToolTipRepresentation, ...TToolTipRepresentation[]])
export const ZToolTipRepresentationEnterprise = z.enum(Object.values(ToolTipRepresentation) as [TToolTipRepresentationEnterprise, ...TToolTipRepresentationEnterprise[]])

export type TToolTipRepresentation = keyof typeof ToolTipRepresentation
export type TToolTipRepresentationEnterprise = `${ToolTipRepresentation}`

enum TrackBarMarkingAppearance {
  DontShow = "НеОтображать",
  TopLeft = "СверхуИлиСлева",
  BottomRight = "СнизуИлиСправа",
  BothSides = "СОбоихСторон",
}

export const ZTrackBarMarkingAppearance = z.enum(Object.keys(TrackBarMarkingAppearance) as [TTrackBarMarkingAppearance, ...TTrackBarMarkingAppearance[]])
export const ZTrackBarMarkingAppearanceEnterprise = z.enum(Object.values(TrackBarMarkingAppearance) as [TTrackBarMarkingAppearanceEnterprise, ...TTrackBarMarkingAppearanceEnterprise[]])

export type TTrackBarMarkingAppearance = keyof typeof TrackBarMarkingAppearance
export type TTrackBarMarkingAppearanceEnterprise = `${TrackBarMarkingAppearance}`

enum UseMenuMode {
  Use = "Использовать",
  UseExtra = "ИспользоватьДополнительно",
  DontUse = "НеИспользовать",
}

export const ZUseMenuMode = z.enum(Object.keys(UseMenuMode) as [TUseMenuMode, ...TUseMenuMode[]])
export const ZUseMenuModeEnterprise = z.enum(Object.values(UseMenuMode) as [TUseMenuModeEnterprise, ...TUseMenuModeEnterprise[]])

export type TUseMenuMode = keyof typeof UseMenuMode
export type TUseMenuModeEnterprise = `${UseMenuMode}`

enum UseOutput {
  Auto = "Авто",
  Disable = "Запретить",
  Enable = "Разрешить",
}

export const ZUseOutput = z.enum(Object.keys(UseOutput) as [TUseOutput, ...TUseOutput[]])
export const ZUseOutputEnterprise = z.enum(Object.values(UseOutput) as [TUseOutputEnterprise, ...TUseOutputEnterprise[]])

export type TUseOutput = keyof typeof UseOutput
export type TUseOutputEnterprise = `${UseOutput}`

enum UserNotificationStatus {
  Important = "Важное",
  Information = "Информация",
}

export const ZUserNotificationStatus = z.enum(Object.keys(UserNotificationStatus) as [TUserNotificationStatus, ...TUserNotificationStatus[]])
export const ZUserNotificationStatusEnterprise = z.enum(Object.values(UserNotificationStatus) as [TUserNotificationStatusEnterprise, ...TUserNotificationStatusEnterprise[]])

export type TUserNotificationStatus = keyof typeof UserNotificationStatus
export type TUserNotificationStatusEnterprise = `${UserNotificationStatus}`

enum UsualGroupBehavior {
  Auto = "Авто",
  PopUp = "Всплывающая",
  Usual = "Обычное",
  Collapsible = "Свертываемая",
}

export const ZUsualGroupBehavior = z.enum(Object.keys(UsualGroupBehavior) as [TUsualGroupBehavior, ...TUsualGroupBehavior[]])
export const ZUsualGroupBehaviorEnterprise = z.enum(Object.values(UsualGroupBehavior) as [TUsualGroupBehaviorEnterprise, ...TUsualGroupBehaviorEnterprise[]])

export type TUsualGroupBehavior = keyof typeof UsualGroupBehavior
export type TUsualGroupBehaviorEnterprise = `${UsualGroupBehavior}`

enum UsualGroupControlRepresentation {
  TitleHyperlink = "ГиперссылкаЗаголовка",
  Picture = "Картинка",
}

export const ZUsualGroupControlRepresentation = z.enum(Object.keys(UsualGroupControlRepresentation) as [TUsualGroupControlRepresentation, ...TUsualGroupControlRepresentation[]])
export const ZUsualGroupControlRepresentationEnterprise = z.enum(Object.values(UsualGroupControlRepresentation) as [TUsualGroupControlRepresentationEnterprise, ...TUsualGroupControlRepresentationEnterprise[]])

export type TUsualGroupControlRepresentation = keyof typeof UsualGroupControlRepresentation
export type TUsualGroupControlRepresentationEnterprise = `${UsualGroupControlRepresentation}`

enum UsualGroupRepresentation {
  None = "Нет",
  NormalSeparation = "ОбычноеВыделение",
  StrongSeparation = "СильноеВыделение",
  WeakSeparation = "СлабоеВыделение",
}

export const ZUsualGroupRepresentation = z.enum(Object.keys(UsualGroupRepresentation) as [TUsualGroupRepresentation, ...TUsualGroupRepresentation[]])
export const ZUsualGroupRepresentationEnterprise = z.enum(Object.values(UsualGroupRepresentation) as [TUsualGroupRepresentationEnterprise, ...TUsualGroupRepresentationEnterprise[]])

export type TUsualGroupRepresentation = keyof typeof UsualGroupRepresentation
export type TUsualGroupRepresentationEnterprise = `${UsualGroupRepresentation}`

enum VerticalAlign {
  Top = "Верх",
  Bottom = "Низ",
  Center = "Центр",
}

export const ZVerticalAlign = z.enum(Object.keys(VerticalAlign) as [TVerticalAlign, ...TVerticalAlign[]])
export const ZVerticalAlignEnterprise = z.enum(Object.values(VerticalAlign) as [TVerticalAlignEnterprise, ...TVerticalAlignEnterprise[]])

export type TVerticalAlign = keyof typeof VerticalAlign
export type TVerticalAlignEnterprise = `${VerticalAlign}`

enum VerticalFormScroll {
  Auto = "Авто",
  Use = "Использовать",
  UseWithoutStretch = "ИспользоватьБезРастягивания",
  UseIfNecessary = "ИспользоватьПриНеобходимости",
}

export const ZVerticalFormScroll = z.enum(Object.keys(VerticalFormScroll) as [TVerticalFormScroll, ...TVerticalFormScroll[]])
export const ZVerticalFormScrollEnterprise = z.enum(Object.values(VerticalFormScroll) as [TVerticalFormScrollEnterprise, ...TVerticalFormScrollEnterprise[]])

export type TVerticalFormScroll = keyof typeof VerticalFormScroll
export type TVerticalFormScrollEnterprise = `${VerticalFormScroll}`

enum ViewModeApplicationOnSetReportResult {
  Auto = "Авто",
  DontApply = "НеПрименять",
  Apply = "Применять",
}

export const ZViewModeApplicationOnSetReportResult = z.enum(Object.keys(ViewModeApplicationOnSetReportResult) as [TViewModeApplicationOnSetReportResult, ...TViewModeApplicationOnSetReportResult[]])
export const ZViewModeApplicationOnSetReportResultEnterprise = z.enum(Object.values(ViewModeApplicationOnSetReportResult) as [TViewModeApplicationOnSetReportResultEnterprise, ...TViewModeApplicationOnSetReportResultEnterprise[]])

export type TViewModeApplicationOnSetReportResult = keyof typeof ViewModeApplicationOnSetReportResult
export type TViewModeApplicationOnSetReportResultEnterprise = `${ViewModeApplicationOnSetReportResult}`

enum ViewScalingMode {
  Auto = "Авто",
  Large = "Крупный",
  Normal = "Обычный",
}

export const ZViewScalingMode = z.enum(Object.keys(ViewScalingMode) as [TViewScalingMode, ...TViewScalingMode[]])
export const ZViewScalingModeEnterprise = z.enum(Object.values(ViewScalingMode) as [TViewScalingModeEnterprise, ...TViewScalingModeEnterprise[]])

export type TViewScalingMode = keyof typeof ViewScalingMode
export type TViewScalingModeEnterprise = `${ViewScalingMode}`

enum ViewStatusLocation {
  Auto = "Авто",
  Top = "Верх",
  None = "Нет",
  Bottom = "Низ",
}

export const ZViewStatusLocation = z.enum(Object.keys(ViewStatusLocation) as [TViewStatusLocation, ...TViewStatusLocation[]])
export const ZViewStatusLocationEnterprise = z.enum(Object.values(ViewStatusLocation) as [TViewStatusLocationEnterprise, ...TViewStatusLocationEnterprise[]])

export type TViewStatusLocation = keyof typeof ViewStatusLocation
export type TViewStatusLocationEnterprise = `${ViewStatusLocation}`

enum WarningOnEditRepresentation {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
}

export const ZWarningOnEditRepresentation = z.enum(Object.keys(WarningOnEditRepresentation) as [TWarningOnEditRepresentation, ...TWarningOnEditRepresentation[]])
export const ZWarningOnEditRepresentationEnterprise = z.enum(Object.values(WarningOnEditRepresentation) as [TWarningOnEditRepresentationEnterprise, ...TWarningOnEditRepresentationEnterprise[]])

export type TWarningOnEditRepresentation = keyof typeof WarningOnEditRepresentation
export type TWarningOnEditRepresentationEnterprise = `${WarningOnEditRepresentation}`

enum WindowAppearanceModeChange {
  Auto = "Авто",
  Disable = "Запретить",
  Enable = "Разрешить",
}

export const ZWindowAppearanceModeChange = z.enum(Object.keys(WindowAppearanceModeChange) as [TWindowAppearanceModeChange, ...TWindowAppearanceModeChange[]])
export const ZWindowAppearanceModeChangeEnterprise = z.enum(Object.values(WindowAppearanceModeChange) as [TWindowAppearanceModeChangeEnterprise, ...TWindowAppearanceModeChangeEnterprise[]])

export type TWindowAppearanceModeChange = keyof typeof WindowAppearanceModeChange
export type TWindowAppearanceModeChangeEnterprise = `${WindowAppearanceModeChange}`

enum WindowAppearanceModeVariant {
  Maximized = "Максимизированное",
  Minimized = "Минимизированное",
  Normal = "Нормальное",
}

export const ZWindowAppearanceModeVariant = z.enum(Object.keys(WindowAppearanceModeVariant) as [TWindowAppearanceModeVariant, ...TWindowAppearanceModeVariant[]])
export const ZWindowAppearanceModeVariantEnterprise = z.enum(Object.values(WindowAppearanceModeVariant) as [TWindowAppearanceModeVariantEnterprise, ...TWindowAppearanceModeVariantEnterprise[]])

export type TWindowAppearanceModeVariant = keyof typeof WindowAppearanceModeVariant
export type TWindowAppearanceModeVariantEnterprise = `${WindowAppearanceModeVariant}`

enum WindowDockVariant {
  Top = "Верх",
  Left = "Лево",
  Bottom = "Низ",
  Right = "Право",
}

export const ZWindowDockVariant = z.enum(Object.keys(WindowDockVariant) as [TWindowDockVariant, ...TWindowDockVariant[]])
export const ZWindowDockVariantEnterprise = z.enum(Object.values(WindowDockVariant) as [TWindowDockVariantEnterprise, ...TWindowDockVariantEnterprise[]])

export type TWindowDockVariant = keyof typeof WindowDockVariant
export type TWindowDockVariantEnterprise = `${WindowDockVariant}`

enum WindowLocationVariant {
  Auto = "Авто",
  DontOverlapOwner = "НеПерекрыватьВладельца",
  Center = "Центрировать",
}

export const ZWindowLocationVariant = z.enum(Object.keys(WindowLocationVariant) as [TWindowLocationVariant, ...TWindowLocationVariant[]])
export const ZWindowLocationVariantEnterprise = z.enum(Object.values(WindowLocationVariant) as [TWindowLocationVariantEnterprise, ...TWindowLocationVariantEnterprise[]])

export type TWindowLocationVariant = keyof typeof WindowLocationVariant
export type TWindowLocationVariantEnterprise = `${WindowLocationVariant}`

enum WindowSizeChange {
  Change = "Изменять",
  DontChange = "НеИзменять",
}

export const ZWindowSizeChange = z.enum(Object.keys(WindowSizeChange) as [TWindowSizeChange, ...TWindowSizeChange[]])
export const ZWindowSizeChangeEnterprise = z.enum(Object.values(WindowSizeChange) as [TWindowSizeChangeEnterprise, ...TWindowSizeChangeEnterprise[]])

export type TWindowSizeChange = keyof typeof WindowSizeChange
export type TWindowSizeChangeEnterprise = `${WindowSizeChange}`

enum WindowStateVariant {
  Normal = "Обычное",
  Docked = "Прикрепленное",
  Autohide = "Прячущееся",
  Float = "Свободное",
}

export const ZWindowStateVariant = z.enum(Object.keys(WindowStateVariant) as [TWindowStateVariant, ...TWindowStateVariant[]])
export const ZWindowStateVariantEnterprise = z.enum(Object.values(WindowStateVariant) as [TWindowStateVariantEnterprise, ...TWindowStateVariantEnterprise[]])

export type TWindowStateVariant = keyof typeof WindowStateVariant
export type TWindowStateVariantEnterprise = `${WindowStateVariant}`

enum IntegrationServiceChannelState {
  Disconnected = "Отключен",
  Connected = "Подключен",
}

export const ZIntegrationServiceChannelState = z.enum(Object.keys(IntegrationServiceChannelState) as [TIntegrationServiceChannelState, ...TIntegrationServiceChannelState[]])
export const ZIntegrationServiceChannelStateEnterprise = z.enum(Object.values(IntegrationServiceChannelState) as [TIntegrationServiceChannelStateEnterprise, ...TIntegrationServiceChannelStateEnterprise[]])

export type TIntegrationServiceChannelState = keyof typeof IntegrationServiceChannelState
export type TIntegrationServiceChannelStateEnterprise = `${IntegrationServiceChannelState}`

enum ArchiveFileCompressionLevel {
  Maximum = "Максимальный",
  Minimum = "Минимальный",
  Optimal = "Оптимальный",
}

export const ZArchiveFileCompressionLevel = z.enum(Object.keys(ArchiveFileCompressionLevel) as [TArchiveFileCompressionLevel, ...TArchiveFileCompressionLevel[]])
export const ZArchiveFileCompressionLevelEnterprise = z.enum(Object.values(ArchiveFileCompressionLevel) as [TArchiveFileCompressionLevelEnterprise, ...TArchiveFileCompressionLevelEnterprise[]])

export type TArchiveFileCompressionLevel = keyof typeof ArchiveFileCompressionLevel
export type TArchiveFileCompressionLevelEnterprise = `${ArchiveFileCompressionLevel}`

enum ArchiveFileCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Копирование",
  Deflate = "Сжатие",
}

export const ZArchiveFileCompressionMethod = z.enum(Object.keys(ArchiveFileCompressionMethod) as [TArchiveFileCompressionMethod, ...TArchiveFileCompressionMethod[]])
export const ZArchiveFileCompressionMethodEnterprise = z.enum(Object.values(ArchiveFileCompressionMethod) as [TArchiveFileCompressionMethodEnterprise, ...TArchiveFileCompressionMethodEnterprise[]])

export type TArchiveFileCompressionMethod = keyof typeof ArchiveFileCompressionMethod
export type TArchiveFileCompressionMethodEnterprise = `${ArchiveFileCompressionMethod}`

enum ArchiveFileEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export const ZArchiveFileEncryptionMethod = z.enum(Object.keys(ArchiveFileEncryptionMethod) as [TArchiveFileEncryptionMethod, ...TArchiveFileEncryptionMethod[]])
export const ZArchiveFileEncryptionMethodEnterprise = z.enum(Object.values(ArchiveFileEncryptionMethod) as [TArchiveFileEncryptionMethodEnterprise, ...TArchiveFileEncryptionMethodEnterprise[]])

export type TArchiveFileEncryptionMethod = keyof typeof ArchiveFileEncryptionMethod
export type TArchiveFileEncryptionMethodEnterprise = `${ArchiveFileEncryptionMethod}`

enum ArchiveFileRestoreFilePathsMode {
  Restore = "Восстанавливать",
  DontRestore = "НеВосстанавливать",
}

export const ZArchiveFileRestoreFilePathsMode = z.enum(Object.keys(ArchiveFileRestoreFilePathsMode) as [TArchiveFileRestoreFilePathsMode, ...TArchiveFileRestoreFilePathsMode[]])
export const ZArchiveFileRestoreFilePathsModeEnterprise = z.enum(Object.values(ArchiveFileRestoreFilePathsMode) as [TArchiveFileRestoreFilePathsModeEnterprise, ...TArchiveFileRestoreFilePathsModeEnterprise[]])

export type TArchiveFileRestoreFilePathsMode = keyof typeof ArchiveFileRestoreFilePathsMode
export type TArchiveFileRestoreFilePathsModeEnterprise = `${ArchiveFileRestoreFilePathsMode}`

enum ArchiveFileStorePathMode {
  DontStorePath = "НеСохранятьПути",
  StoreRelativePath = "СохранятьОтносительныеПути",
  StoreFullPath = "СохранятьПолныеПути",
}

export const ZArchiveFileStorePathMode = z.enum(Object.keys(ArchiveFileStorePathMode) as [TArchiveFileStorePathMode, ...TArchiveFileStorePathMode[]])
export const ZArchiveFileStorePathModeEnterprise = z.enum(Object.values(ArchiveFileStorePathMode) as [TArchiveFileStorePathModeEnterprise, ...TArchiveFileStorePathModeEnterprise[]])

export type TArchiveFileStorePathMode = keyof typeof ArchiveFileStorePathMode
export type TArchiveFileStorePathModeEnterprise = `${ArchiveFileStorePathMode}`

enum ArchiveFileSubDirProcessingMode {
  DontProcess = "НеОбрабатывать",
  ProcessRecursively = "ОбрабатыватьРекурсивно",
}

export const ZArchiveFileSubDirProcessingMode = z.enum(Object.keys(ArchiveFileSubDirProcessingMode) as [TArchiveFileSubDirProcessingMode, ...TArchiveFileSubDirProcessingMode[]])
export const ZArchiveFileSubDirProcessingModeEnterprise = z.enum(Object.values(ArchiveFileSubDirProcessingMode) as [TArchiveFileSubDirProcessingModeEnterprise, ...TArchiveFileSubDirProcessingModeEnterprise[]])

export type TArchiveFileSubDirProcessingMode = keyof typeof ArchiveFileSubDirProcessingMode
export type TArchiveFileSubDirProcessingModeEnterprise = `${ArchiveFileSubDirProcessingMode}`

enum ArchiveFileType {
  BZIP2 = "BZIP2",
  GZIP = "GZIP",
  RAR = "RAR",
  SevenZIP = "SevenZIP",
  TAR = "TAR",
  XZ = "XZ",
  ZIP = "ZIP",
}

export const ZArchiveFileType = z.enum(Object.keys(ArchiveFileType) as [TArchiveFileType, ...TArchiveFileType[]])
export const ZArchiveFileTypeEnterprise = z.enum(Object.values(ArchiveFileType) as [TArchiveFileTypeEnterprise, ...TArchiveFileTypeEnterprise[]])

export type TArchiveFileType = keyof typeof ArchiveFileType
export type TArchiveFileTypeEnterprise = `${ArchiveFileType}`

enum FileNamesEncodingInArchiveFile {
  UTF8 = "UTF8",
  Auto = "Авто",
  OSEncodingWithUTF8 = "КодировкаОСДополнительноUTF8",
}

export const ZFileNamesEncodingInArchiveFile = z.enum(Object.keys(FileNamesEncodingInArchiveFile) as [TFileNamesEncodingInArchiveFile, ...TFileNamesEncodingInArchiveFile[]])
export const ZFileNamesEncodingInArchiveFileEnterprise = z.enum(Object.values(FileNamesEncodingInArchiveFile) as [TFileNamesEncodingInArchiveFileEnterprise, ...TFileNamesEncodingInArchiveFileEnterprise[]])

export type TFileNamesEncodingInArchiveFile = keyof typeof FileNamesEncodingInArchiveFile
export type TFileNamesEncodingInArchiveFileEnterprise = `${FileNamesEncodingInArchiveFile}`

enum FileAccess {
  Write = "Запись",
  Read = "Чтение",
  ReadAndWrite = "ЧтениеИЗапись",
}

export const ZFileAccess = z.enum(Object.keys(FileAccess) as [TFileAccess, ...TFileAccess[]])
export const ZFileAccessEnterprise = z.enum(Object.values(FileAccess) as [TFileAccessEnterprise, ...TFileAccessEnterprise[]])

export type TFileAccess = keyof typeof FileAccess
export type TFileAccessEnterprise = `${FileAccess}`

enum FileCompareMethod {
  Binary = "Двоичное",
  SpreadsheetDocument = "ТабличныйДокумент",
  TextDocument = "ТекстовыйДокумент",
}

export const ZFileCompareMethod = z.enum(Object.keys(FileCompareMethod) as [TFileCompareMethod, ...TFileCompareMethod[]])
export const ZFileCompareMethodEnterprise = z.enum(Object.values(FileCompareMethod) as [TFileCompareMethodEnterprise, ...TFileCompareMethodEnterprise[]])

export type TFileCompareMethod = keyof typeof FileCompareMethod
export type TFileCompareMethodEnterprise = `${FileCompareMethod}`

enum FileDialogMode {
  ChooseDirectory = "ВыборКаталога",
  Open = "Открытие",
  Save = "Сохранение",
}

export const ZFileDialogMode = z.enum(Object.keys(FileDialogMode) as [TFileDialogMode, ...TFileDialogMode[]])
export const ZFileDialogModeEnterprise = z.enum(Object.values(FileDialogMode) as [TFileDialogModeEnterprise, ...TFileDialogModeEnterprise[]])

export type TFileDialogMode = keyof typeof FileDialogMode
export type TFileDialogModeEnterprise = `${FileDialogMode}`

enum FileDialogSection {
  Audio = "Аудио",
  Gallery = "Галерея",
  Documents = "Документы",
  Recent = "Недавние",
  Files = "Файлы",
}

export const ZFileDialogSection = z.enum(Object.keys(FileDialogSection) as [TFileDialogSection, ...TFileDialogSection[]])
export const ZFileDialogSectionEnterprise = z.enum(Object.values(FileDialogSection) as [TFileDialogSectionEnterprise, ...TFileDialogSectionEnterprise[]])

export type TFileDialogSection = keyof typeof FileDialogSection
export type TFileDialogSectionEnterprise = `${FileDialogSection}`

enum FileDragMode {
  AsFileRef = "КакСсылкаНаФайл",
  AsFile = "КакФайл",
}

export const ZFileDragMode = z.enum(Object.keys(FileDragMode) as [TFileDragMode, ...TFileDragMode[]])
export const ZFileDragModeEnterprise = z.enum(Object.values(FileDragMode) as [TFileDragModeEnterprise, ...TFileDragModeEnterprise[]])

export type TFileDragMode = keyof typeof FileDragMode
export type TFileDragModeEnterprise = `${FileDragMode}`

enum FileOpenMode {
  Append = "Дописать",
  Truncate = "Обрезать",
  Open = "Открыть",
  OpenOrCreate = "ОткрытьИлиСоздать",
  Create = "Создать",
  CreateNew = "СоздатьНовый",
}

export const ZFileOpenMode = z.enum(Object.keys(FileOpenMode) as [TFileOpenMode, ...TFileOpenMode[]])
export const ZFileOpenModeEnterprise = z.enum(Object.values(FileOpenMode) as [TFileOpenModeEnterprise, ...TFileOpenModeEnterprise[]])

export type TFileOpenMode = keyof typeof FileOpenMode
export type TFileOpenModeEnterprise = `${FileOpenMode}`

enum GetFilesArchiveMode {
  GetArchiveAlways = "ПолучатьАрхивВсегда",
  GetArchiveWhenRequired = "ПолучатьАрхивПриНеобходимости",
}

export const ZGetFilesArchiveMode = z.enum(Object.keys(GetFilesArchiveMode) as [TGetFilesArchiveMode, ...TGetFilesArchiveMode[]])
export const ZGetFilesArchiveModeEnterprise = z.enum(Object.values(GetFilesArchiveMode) as [TGetFilesArchiveModeEnterprise, ...TGetFilesArchiveModeEnterprise[]])

export type TGetFilesArchiveMode = keyof typeof GetFilesArchiveMode
export type TGetFilesArchiveModeEnterprise = `${GetFilesArchiveMode}`

enum IncomingShareRequestStandardCommand {
  CopyToClipboard = "КопироватьВБуферОбмена",
  ShareInConversation = "ПоделитьсяВОбсуждении",
  Show = "Показать",
  Save = "Сохранить",
}

export const ZIncomingShareRequestStandardCommand = z.enum(Object.keys(IncomingShareRequestStandardCommand) as [TIncomingShareRequestStandardCommand, ...TIncomingShareRequestStandardCommand[]])
export const ZIncomingShareRequestStandardCommandEnterprise = z.enum(Object.values(IncomingShareRequestStandardCommand) as [TIncomingShareRequestStandardCommandEnterprise, ...TIncomingShareRequestStandardCommandEnterprise[]])

export type TIncomingShareRequestStandardCommand = keyof typeof IncomingShareRequestStandardCommand
export type TIncomingShareRequestStandardCommandEnterprise = `${IncomingShareRequestStandardCommand}`

enum MobileDeviceLibraryDirType {
  Audio = "Аудио",
  Video = "Видео",
  Pictures = "Картинки",
}

export const ZMobileDeviceLibraryDirType = z.enum(Object.keys(MobileDeviceLibraryDirType) as [TMobileDeviceLibraryDirType, ...TMobileDeviceLibraryDirType[]])
export const ZMobileDeviceLibraryDirTypeEnterprise = z.enum(Object.values(MobileDeviceLibraryDirType) as [TMobileDeviceLibraryDirTypeEnterprise, ...TMobileDeviceLibraryDirTypeEnterprise[]])

export type TMobileDeviceLibraryDirType = keyof typeof MobileDeviceLibraryDirType
export type TMobileDeviceLibraryDirTypeEnterprise = `${MobileDeviceLibraryDirType}`

enum ShareRequestDataProcessingVariant {
  View = "Просмотр",
  Edit = "Редактирование",
}

export const ZShareRequestDataProcessingVariant = z.enum(Object.keys(ShareRequestDataProcessingVariant) as [TShareRequestDataProcessingVariant, ...TShareRequestDataProcessingVariant[]])
export const ZShareRequestDataProcessingVariantEnterprise = z.enum(Object.values(ShareRequestDataProcessingVariant) as [TShareRequestDataProcessingVariantEnterprise, ...TShareRequestDataProcessingVariantEnterprise[]])

export type TShareRequestDataProcessingVariant = keyof typeof ShareRequestDataProcessingVariant
export type TShareRequestDataProcessingVariantEnterprise = `${ShareRequestDataProcessingVariant}`

enum AccountMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export const ZAccountMainPresentation = z.enum(Object.keys(AccountMainPresentation) as [TAccountMainPresentation, ...TAccountMainPresentation[]])
export const ZAccountMainPresentationEnterprise = z.enum(Object.values(AccountMainPresentation) as [TAccountMainPresentationEnterprise, ...TAccountMainPresentationEnterprise[]])

export type TAccountMainPresentation = keyof typeof AccountMainPresentation
export type TAccountMainPresentationEnterprise = `${AccountMainPresentation}`

enum AccumulationRegisterType {
  Turnovers = "Обороты",
  Balance = "Остатки",
}

export const ZAccumulationRegisterType = z.enum(Object.keys(AccumulationRegisterType) as [TAccumulationRegisterType, ...TAccumulationRegisterType[]])
export const ZAccumulationRegisterTypeEnterprise = z.enum(Object.values(AccumulationRegisterType) as [TAccumulationRegisterTypeEnterprise, ...TAccumulationRegisterTypeEnterprise[]])

export type TAccumulationRegisterType = keyof typeof AccumulationRegisterType
export type TAccumulationRegisterTypeEnterprise = `${AccumulationRegisterType}`

enum AttributeUse {
  ForFolder = "ДляГруппы",
  ForFolderAndItem = "ДляГруппыИЭлемента",
  ForItem = "ДляЭлемента",
}

export const ZAttributeUse = z.enum(Object.keys(AttributeUse) as [TAttributeUse, ...TAttributeUse[]])
export const ZAttributeUseEnterprise = z.enum(Object.values(AttributeUse) as [TAttributeUseEnterprise, ...TAttributeUseEnterprise[]])

export type TAttributeUse = keyof typeof AttributeUse
export type TAttributeUseEnterprise = `${AttributeUse}`

enum BinaryDataBlockStorageUseMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZBinaryDataBlockStorageUseMode = z.enum(Object.keys(BinaryDataBlockStorageUseMode) as [TBinaryDataBlockStorageUseMode, ...TBinaryDataBlockStorageUseMode[]])
export const ZBinaryDataBlockStorageUseModeEnterprise = z.enum(Object.values(BinaryDataBlockStorageUseMode) as [TBinaryDataBlockStorageUseModeEnterprise, ...TBinaryDataBlockStorageUseModeEnterprise[]])

export type TBinaryDataBlockStorageUseMode = keyof typeof BinaryDataBlockStorageUseMode
export type TBinaryDataBlockStorageUseModeEnterprise = `${BinaryDataBlockStorageUseMode}`

enum BinaryDataStorageMode {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZBinaryDataStorageMode = z.enum(Object.keys(BinaryDataStorageMode) as [TBinaryDataStorageMode, ...TBinaryDataStorageMode[]])
export const ZBinaryDataStorageModeEnterprise = z.enum(Object.values(BinaryDataStorageMode) as [TBinaryDataStorageModeEnterprise, ...TBinaryDataStorageModeEnterprise[]])

export type TBinaryDataStorageMode = keyof typeof BinaryDataStorageMode
export type TBinaryDataStorageModeEnterprise = `${BinaryDataStorageMode}`

enum BusinessProcessNumberPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
}

export const ZBusinessProcessNumberPeriodicity = z.enum(Object.keys(BusinessProcessNumberPeriodicity) as [TBusinessProcessNumberPeriodicity, ...TBusinessProcessNumberPeriodicity[]])
export const ZBusinessProcessNumberPeriodicityEnterprise = z.enum(Object.values(BusinessProcessNumberPeriodicity) as [TBusinessProcessNumberPeriodicityEnterprise, ...TBusinessProcessNumberPeriodicityEnterprise[]])

export type TBusinessProcessNumberPeriodicity = keyof typeof BusinessProcessNumberPeriodicity
export type TBusinessProcessNumberPeriodicityEnterprise = `${BusinessProcessNumberPeriodicity}`

enum BusinessProcessNumberType {
  String = "Строка",
  Number = "Число",
}

export const ZBusinessProcessNumberType = z.enum(Object.keys(BusinessProcessNumberType) as [TBusinessProcessNumberType, ...TBusinessProcessNumberType[]])
export const ZBusinessProcessNumberTypeEnterprise = z.enum(Object.values(BusinessProcessNumberType) as [TBusinessProcessNumberTypeEnterprise, ...TBusinessProcessNumberTypeEnterprise[]])

export type TBusinessProcessNumberType = keyof typeof BusinessProcessNumberType
export type TBusinessProcessNumberTypeEnterprise = `${BusinessProcessNumberType}`

enum CalculationRegisterPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
}

export const ZCalculationRegisterPeriodicity = z.enum(Object.keys(CalculationRegisterPeriodicity) as [TCalculationRegisterPeriodicity, ...TCalculationRegisterPeriodicity[]])
export const ZCalculationRegisterPeriodicityEnterprise = z.enum(Object.values(CalculationRegisterPeriodicity) as [TCalculationRegisterPeriodicityEnterprise, ...TCalculationRegisterPeriodicityEnterprise[]])

export type TCalculationRegisterPeriodicity = keyof typeof CalculationRegisterPeriodicity
export type TCalculationRegisterPeriodicityEnterprise = `${CalculationRegisterPeriodicity}`

enum CalculationTypeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export const ZCalculationTypeMainPresentation = z.enum(Object.keys(CalculationTypeMainPresentation) as [TCalculationTypeMainPresentation, ...TCalculationTypeMainPresentation[]])
export const ZCalculationTypeMainPresentationEnterprise = z.enum(Object.values(CalculationTypeMainPresentation) as [TCalculationTypeMainPresentationEnterprise, ...TCalculationTypeMainPresentationEnterprise[]])

export type TCalculationTypeMainPresentation = keyof typeof CalculationTypeMainPresentation
export type TCalculationTypeMainPresentationEnterprise = `${CalculationTypeMainPresentation}`

enum CharacteristicKindCodesSeries {
  WholeCharacteristicKind = "ВоВсемПланеВидовХарактеристик",
  WithinSubordination = "ВПределахПодчинения",
}

export const ZCharacteristicKindCodesSeries = z.enum(Object.keys(CharacteristicKindCodesSeries) as [TCharacteristicKindCodesSeries, ...TCharacteristicKindCodesSeries[]])
export const ZCharacteristicKindCodesSeriesEnterprise = z.enum(Object.values(CharacteristicKindCodesSeries) as [TCharacteristicKindCodesSeriesEnterprise, ...TCharacteristicKindCodesSeriesEnterprise[]])

export type TCharacteristicKindCodesSeries = keyof typeof CharacteristicKindCodesSeries
export type TCharacteristicKindCodesSeriesEnterprise = `${CharacteristicKindCodesSeries}`

enum CharacteristicTypeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export const ZCharacteristicTypeMainPresentation = z.enum(Object.keys(CharacteristicTypeMainPresentation) as [TCharacteristicTypeMainPresentation, ...TCharacteristicTypeMainPresentation[]])
export const ZCharacteristicTypeMainPresentationEnterprise = z.enum(Object.values(CharacteristicTypeMainPresentation) as [TCharacteristicTypeMainPresentationEnterprise, ...TCharacteristicTypeMainPresentationEnterprise[]])

export type TCharacteristicTypeMainPresentation = keyof typeof CharacteristicTypeMainPresentation
export type TCharacteristicTypeMainPresentationEnterprise = `${CharacteristicTypeMainPresentation}`

enum CharOfAccountCodeSeries {
  WholeChartOfAccounts = "ВоВсемПланеСчетов",
  WithinSubordination = "ВПределахПодчинения",
}

export const ZCharOfAccountCodeSeries = z.enum(Object.keys(CharOfAccountCodeSeries) as [TCharOfAccountCodeSeries, ...TCharOfAccountCodeSeries[]])
export const ZCharOfAccountCodeSeriesEnterprise = z.enum(Object.values(CharOfAccountCodeSeries) as [TCharOfAccountCodeSeriesEnterprise, ...TCharOfAccountCodeSeriesEnterprise[]])

export type TCharOfAccountCodeSeries = keyof typeof CharOfAccountCodeSeries
export type TCharOfAccountCodeSeriesEnterprise = `${CharOfAccountCodeSeries}`

enum ChartOfCalculationTypesBaseUse {
  DontUse = "НеИспользовать",
  OnActionPeriod = "ПоПериодуДействия",
  OnRegistrationPeriod = "ПоПериодуРегистрации",
}

export const ZChartOfCalculationTypesBaseUse = z.enum(Object.keys(ChartOfCalculationTypesBaseUse) as [TChartOfCalculationTypesBaseUse, ...TChartOfCalculationTypesBaseUse[]])
export const ZChartOfCalculationTypesBaseUseEnterprise = z.enum(Object.values(ChartOfCalculationTypesBaseUse) as [TChartOfCalculationTypesBaseUseEnterprise, ...TChartOfCalculationTypesBaseUseEnterprise[]])

export type TChartOfCalculationTypesBaseUse = keyof typeof ChartOfCalculationTypesBaseUse
export type TChartOfCalculationTypesBaseUseEnterprise = `${ChartOfCalculationTypesBaseUse}`

enum ChartOfCalculationTypesCodeType {
  String = "Строка",
  Number = "Число",
}

export const ZChartOfCalculationTypesCodeType = z.enum(Object.keys(ChartOfCalculationTypesCodeType) as [TChartOfCalculationTypesCodeType, ...TChartOfCalculationTypesCodeType[]])
export const ZChartOfCalculationTypesCodeTypeEnterprise = z.enum(Object.values(ChartOfCalculationTypesCodeType) as [TChartOfCalculationTypesCodeTypeEnterprise, ...TChartOfCalculationTypesCodeTypeEnterprise[]])

export type TChartOfCalculationTypesCodeType = keyof typeof ChartOfCalculationTypesCodeType
export type TChartOfCalculationTypesCodeTypeEnterprise = `${ChartOfCalculationTypesCodeType}`

enum ChoiceDataGetModeOnInputByString {
  Directly = "Непосредственно",
  Background = "Фоновый",
}

export const ZChoiceDataGetModeOnInputByString = z.enum(Object.keys(ChoiceDataGetModeOnInputByString) as [TChoiceDataGetModeOnInputByString, ...TChoiceDataGetModeOnInputByString[]])
export const ZChoiceDataGetModeOnInputByStringEnterprise = z.enum(Object.values(ChoiceDataGetModeOnInputByString) as [TChoiceDataGetModeOnInputByStringEnterprise, ...TChoiceDataGetModeOnInputByStringEnterprise[]])

export type TChoiceDataGetModeOnInputByString = keyof typeof ChoiceDataGetModeOnInputByString
export type TChoiceDataGetModeOnInputByStringEnterprise = `${ChoiceDataGetModeOnInputByString}`

enum ChoiceMode {
  QuickChoice = "БыстрыйВыбор",
  FromForm = "ИзФормы",
  BothWays = "ОбоимиСпособами",
}

export const ZChoiceMode = z.enum(Object.keys(ChoiceMode) as [TChoiceMode, ...TChoiceMode[]])
export const ZChoiceModeEnterprise = z.enum(Object.values(ChoiceMode) as [TChoiceModeEnterprise, ...TChoiceModeEnterprise[]])

export type TChoiceMode = keyof typeof ChoiceMode
export type TChoiceModeEnterprise = `${ChoiceMode}`

enum CommonAttributeAuthenticationSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export const ZCommonAttributeAuthenticationSeparation = z.enum(Object.keys(CommonAttributeAuthenticationSeparation) as [TCommonAttributeAuthenticationSeparation, ...TCommonAttributeAuthenticationSeparation[]])
export const ZCommonAttributeAuthenticationSeparationEnterprise = z.enum(Object.values(CommonAttributeAuthenticationSeparation) as [TCommonAttributeAuthenticationSeparationEnterprise, ...TCommonAttributeAuthenticationSeparationEnterprise[]])

export type TCommonAttributeAuthenticationSeparation = keyof typeof CommonAttributeAuthenticationSeparation
export type TCommonAttributeAuthenticationSeparationEnterprise = `${CommonAttributeAuthenticationSeparation}`

enum CommonAttributeAutoUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCommonAttributeAutoUse = z.enum(Object.keys(CommonAttributeAutoUse) as [TCommonAttributeAutoUse, ...TCommonAttributeAutoUse[]])
export const ZCommonAttributeAutoUseEnterprise = z.enum(Object.values(CommonAttributeAutoUse) as [TCommonAttributeAutoUseEnterprise, ...TCommonAttributeAutoUseEnterprise[]])

export type TCommonAttributeAutoUse = keyof typeof CommonAttributeAutoUse
export type TCommonAttributeAutoUseEnterprise = `${CommonAttributeAutoUse}`

enum CommonAttributeConfigurationExtensionsSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export const ZCommonAttributeConfigurationExtensionsSeparation = z.enum(Object.keys(CommonAttributeConfigurationExtensionsSeparation) as [TCommonAttributeConfigurationExtensionsSeparation, ...TCommonAttributeConfigurationExtensionsSeparation[]])
export const ZCommonAttributeConfigurationExtensionsSeparationEnterprise = z.enum(Object.values(CommonAttributeConfigurationExtensionsSeparation) as [TCommonAttributeConfigurationExtensionsSeparationEnterprise, ...TCommonAttributeConfigurationExtensionsSeparationEnterprise[]])

export type TCommonAttributeConfigurationExtensionsSeparation = keyof typeof CommonAttributeConfigurationExtensionsSeparation
export type TCommonAttributeConfigurationExtensionsSeparationEnterprise = `${CommonAttributeConfigurationExtensionsSeparation}`

enum CommonAttributeDataSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export const ZCommonAttributeDataSeparation = z.enum(Object.keys(CommonAttributeDataSeparation) as [TCommonAttributeDataSeparation, ...TCommonAttributeDataSeparation[]])
export const ZCommonAttributeDataSeparationEnterprise = z.enum(Object.values(CommonAttributeDataSeparation) as [TCommonAttributeDataSeparationEnterprise, ...TCommonAttributeDataSeparationEnterprise[]])

export type TCommonAttributeDataSeparation = keyof typeof CommonAttributeDataSeparation
export type TCommonAttributeDataSeparationEnterprise = `${CommonAttributeDataSeparation}`

enum CommonAttributeSeparatedDataUse {
  Independently = "Независимо",
  IndependentlyAndSimultaneously = "НезависимоИСовместно",
}

export const ZCommonAttributeSeparatedDataUse = z.enum(Object.keys(CommonAttributeSeparatedDataUse) as [TCommonAttributeSeparatedDataUse, ...TCommonAttributeSeparatedDataUse[]])
export const ZCommonAttributeSeparatedDataUseEnterprise = z.enum(Object.values(CommonAttributeSeparatedDataUse) as [TCommonAttributeSeparatedDataUseEnterprise, ...TCommonAttributeSeparatedDataUseEnterprise[]])

export type TCommonAttributeSeparatedDataUse = keyof typeof CommonAttributeSeparatedDataUse
export type TCommonAttributeSeparatedDataUseEnterprise = `${CommonAttributeSeparatedDataUse}`

enum CommonAttributeUse {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCommonAttributeUse = z.enum(Object.keys(CommonAttributeUse) as [TCommonAttributeUse, ...TCommonAttributeUse[]])
export const ZCommonAttributeUseEnterprise = z.enum(Object.values(CommonAttributeUse) as [TCommonAttributeUseEnterprise, ...TCommonAttributeUseEnterprise[]])

export type TCommonAttributeUse = keyof typeof CommonAttributeUse
export type TCommonAttributeUseEnterprise = `${CommonAttributeUse}`

enum CommonAttributeUsersSeparation {
  DontUse = "НеИспользовать",
  Separate = "Разделять",
}

export const ZCommonAttributeUsersSeparation = z.enum(Object.keys(CommonAttributeUsersSeparation) as [TCommonAttributeUsersSeparation, ...TCommonAttributeUsersSeparation[]])
export const ZCommonAttributeUsersSeparationEnterprise = z.enum(Object.values(CommonAttributeUsersSeparation) as [TCommonAttributeUsersSeparationEnterprise, ...TCommonAttributeUsersSeparationEnterprise[]])

export type TCommonAttributeUsersSeparation = keyof typeof CommonAttributeUsersSeparation
export type TCommonAttributeUsersSeparationEnterprise = `${CommonAttributeUsersSeparation}`

enum CompatibilityMode {
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

export const ZCompatibilityMode = z.enum(Object.keys(CompatibilityMode) as [TCompatibilityMode, ...TCompatibilityMode[]])
export const ZCompatibilityModeEnterprise = z.enum(Object.values(CompatibilityMode) as [TCompatibilityModeEnterprise, ...TCompatibilityModeEnterprise[]])

export type TCompatibilityMode = keyof typeof CompatibilityMode
export type TCompatibilityModeEnterprise = `${CompatibilityMode}`

enum ConfigurationExtensionPurpose {
  Customization = "Адаптация",
  AddOn = "Дополнение",
  Patch = "Исправление",
}

export const ZConfigurationExtensionPurpose = z.enum(Object.keys(ConfigurationExtensionPurpose) as [TConfigurationExtensionPurpose, ...TConfigurationExtensionPurpose[]])
export const ZConfigurationExtensionPurposeEnterprise = z.enum(Object.values(ConfigurationExtensionPurpose) as [TConfigurationExtensionPurposeEnterprise, ...TConfigurationExtensionPurposeEnterprise[]])

export type TConfigurationExtensionPurpose = keyof typeof ConfigurationExtensionPurpose
export type TConfigurationExtensionPurposeEnterprise = `${ConfigurationExtensionPurpose}`

enum CreateOnInput {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZCreateOnInput = z.enum(Object.keys(CreateOnInput) as [TCreateOnInput, ...TCreateOnInput[]])
export const ZCreateOnInputEnterprise = z.enum(Object.values(CreateOnInput) as [TCreateOnInputEnterprise, ...TCreateOnInputEnterprise[]])

export type TCreateOnInput = keyof typeof CreateOnInput
export type TCreateOnInputEnterprise = `${CreateOnInput}`

enum DataExchangeMainPresentation {
  AsCode = "ВВидеКода",
  AsDescription = "ВВидеНаименования",
}

export const ZDataExchangeMainPresentation = z.enum(Object.keys(DataExchangeMainPresentation) as [TDataExchangeMainPresentation, ...TDataExchangeMainPresentation[]])
export const ZDataExchangeMainPresentationEnterprise = z.enum(Object.values(DataExchangeMainPresentation) as [TDataExchangeMainPresentationEnterprise, ...TDataExchangeMainPresentationEnterprise[]])

export type TDataExchangeMainPresentation = keyof typeof DataExchangeMainPresentation
export type TDataExchangeMainPresentationEnterprise = `${DataExchangeMainPresentation}`

enum DataHistoryUse {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZDataHistoryUse = z.enum(Object.keys(DataHistoryUse) as [TDataHistoryUse, ...TDataHistoryUse[]])
export const ZDataHistoryUseEnterprise = z.enum(Object.values(DataHistoryUse) as [TDataHistoryUseEnterprise, ...TDataHistoryUseEnterprise[]])

export type TDataHistoryUse = keyof typeof DataHistoryUse
export type TDataHistoryUseEnterprise = `${DataHistoryUse}`

enum DefaultDataLockControlMode {
  Automatic = "Автоматический",
  AutomaticAndManaged = "АвтоматическийИУправляемый",
  Managed = "Управляемый",
}

export const ZDefaultDataLockControlMode = z.enum(Object.keys(DefaultDataLockControlMode) as [TDefaultDataLockControlMode, ...TDefaultDataLockControlMode[]])
export const ZDefaultDataLockControlModeEnterprise = z.enum(Object.values(DefaultDataLockControlMode) as [TDefaultDataLockControlModeEnterprise, ...TDefaultDataLockControlModeEnterprise[]])

export type TDefaultDataLockControlMode = keyof typeof DefaultDataLockControlMode
export type TDefaultDataLockControlModeEnterprise = `${DefaultDataLockControlMode}`

enum DocumentNumberPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
}

export const ZDocumentNumberPeriodicity = z.enum(Object.keys(DocumentNumberPeriodicity) as [TDocumentNumberPeriodicity, ...TDocumentNumberPeriodicity[]])
export const ZDocumentNumberPeriodicityEnterprise = z.enum(Object.values(DocumentNumberPeriodicity) as [TDocumentNumberPeriodicityEnterprise, ...TDocumentNumberPeriodicityEnterprise[]])

export type TDocumentNumberPeriodicity = keyof typeof DocumentNumberPeriodicity
export type TDocumentNumberPeriodicityEnterprise = `${DocumentNumberPeriodicity}`

enum DocumentNumberType {
  String = "Строка",
  Number = "Число",
}

export const ZDocumentNumberType = z.enum(Object.keys(DocumentNumberType) as [TDocumentNumberType, ...TDocumentNumberType[]])
export const ZDocumentNumberTypeEnterprise = z.enum(Object.values(DocumentNumberType) as [TDocumentNumberTypeEnterprise, ...TDocumentNumberTypeEnterprise[]])

export type TDocumentNumberType = keyof typeof DocumentNumberType
export type TDocumentNumberTypeEnterprise = `${DocumentNumberType}`

enum EditType {
  InDialog = "ВДиалоге",
  InList = "ВСписке",
  BothWays = "ОбоимиСпособами",
}

export const ZEditType = z.enum(Object.keys(EditType) as [TEditType, ...TEditType[]])
export const ZEditTypeEnterprise = z.enum(Object.values(EditType) as [TEditTypeEnterprise, ...TEditTypeEnterprise[]])

export type TEditType = keyof typeof EditType
export type TEditTypeEnterprise = `${EditType}`

enum ExternalDataSourceTableDataType {
  NonobjectData = "НеобъектныеДанные",
  ObjectData = "ОбъектныеДанные",
}

export const ZExternalDataSourceTableDataType = z.enum(Object.keys(ExternalDataSourceTableDataType) as [TExternalDataSourceTableDataType, ...TExternalDataSourceTableDataType[]])
export const ZExternalDataSourceTableDataTypeEnterprise = z.enum(Object.values(ExternalDataSourceTableDataType) as [TExternalDataSourceTableDataTypeEnterprise, ...TExternalDataSourceTableDataTypeEnterprise[]])

export type TExternalDataSourceTableDataType = keyof typeof ExternalDataSourceTableDataType
export type TExternalDataSourceTableDataTypeEnterprise = `${ExternalDataSourceTableDataType}`

enum ExternalDataSourceTableType {
  Expression = "Выражение",
  Table = "Таблица",
}

export const ZExternalDataSourceTableType = z.enum(Object.keys(ExternalDataSourceTableType) as [TExternalDataSourceTableType, ...TExternalDataSourceTableType[]])
export const ZExternalDataSourceTableTypeEnterprise = z.enum(Object.values(ExternalDataSourceTableType) as [TExternalDataSourceTableTypeEnterprise, ...TExternalDataSourceTableTypeEnterprise[]])

export type TExternalDataSourceTableType = keyof typeof ExternalDataSourceTableType
export type TExternalDataSourceTableTypeEnterprise = `${ExternalDataSourceTableType}`

enum FormType {
  Ordinary = "Обычная",
  Managed = "Управляемая",
}

export const ZFormType = z.enum(Object.keys(FormType) as [TFormType, ...TFormType[]])
export const ZFormTypeEnterprise = z.enum(Object.values(FormType) as [TFormTypeEnterprise, ...TFormTypeEnterprise[]])

export type TFormType = keyof typeof FormType
export type TFormTypeEnterprise = `${FormType}`

enum FullTextSearchOnInputByString {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZFullTextSearchOnInputByString = z.enum(Object.keys(FullTextSearchOnInputByString) as [TFullTextSearchOnInputByString, ...TFullTextSearchOnInputByString[]])
export const ZFullTextSearchOnInputByStringEnterprise = z.enum(Object.values(FullTextSearchOnInputByString) as [TFullTextSearchOnInputByStringEnterprise, ...TFullTextSearchOnInputByStringEnterprise[]])

export type TFullTextSearchOnInputByString = keyof typeof FullTextSearchOnInputByString
export type TFullTextSearchOnInputByStringEnterprise = `${FullTextSearchOnInputByString}`

enum HierarchyType {
  HierarchyFoldersAndItems = "ИерархияГруппИЭлементов",
  HierarchyOfItems = "ИерархияЭлементов",
}

export const ZHierarchyType = z.enum(Object.keys(HierarchyType) as [THierarchyType, ...THierarchyType[]])
export const ZHierarchyTypeEnterprise = z.enum(Object.values(HierarchyType) as [THierarchyTypeEnterprise, ...THierarchyTypeEnterprise[]])

export type THierarchyType = keyof typeof HierarchyType
export type THierarchyTypeEnterprise = `${HierarchyType}`

enum HTTPMethod {
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

export const ZHTTPMethod = z.enum(Object.keys(HTTPMethod) as [THTTPMethod, ...THTTPMethod[]])
export const ZHTTPMethodEnterprise = z.enum(Object.values(HTTPMethod) as [THTTPMethodEnterprise, ...THTTPMethodEnterprise[]])

export type THTTPMethod = keyof typeof HTTPMethod
export type THTTPMethodEnterprise = `${HTTPMethod}`

enum Indexing {
  Index = "Индексировать",
  IndexWithAdditionalOrder = "ИндексироватьСДопУпорядочиванием",
  DontIndex = "НеИндексировать",
}

export const ZIndexing = z.enum(Object.keys(Indexing) as [TIndexing, ...TIndexing[]])
export const ZIndexingEnterprise = z.enum(Object.values(Indexing) as [TIndexingEnterprise, ...TIndexingEnterprise[]])

export type TIndexing = keyof typeof Indexing
export type TIndexingEnterprise = `${Indexing}`

enum InformationRegisterPeriodicity {
  Year = "Год",
  Day = "День",
  Quarter = "Квартал",
  Month = "Месяц",
  Nonperiodical = "Непериодический",
  RecorderPosition = "ПозицияРегистратора",
  Second = "Секунда",
}

export const ZInformationRegisterPeriodicity = z.enum(Object.keys(InformationRegisterPeriodicity) as [TInformationRegisterPeriodicity, ...TInformationRegisterPeriodicity[]])
export const ZInformationRegisterPeriodicityEnterprise = z.enum(Object.values(InformationRegisterPeriodicity) as [TInformationRegisterPeriodicityEnterprise, ...TInformationRegisterPeriodicityEnterprise[]])

export type TInformationRegisterPeriodicity = keyof typeof InformationRegisterPeriodicity
export type TInformationRegisterPeriodicityEnterprise = `${InformationRegisterPeriodicity}`

enum IntegrationServiceChannelMessageDirection {
  Send = "Отправка",
  Receive = "Получение",
}

export const ZIntegrationServiceChannelMessageDirection = z.enum(Object.keys(IntegrationServiceChannelMessageDirection) as [TIntegrationServiceChannelMessageDirection, ...TIntegrationServiceChannelMessageDirection[]])
export const ZIntegrationServiceChannelMessageDirectionEnterprise = z.enum(Object.values(IntegrationServiceChannelMessageDirection) as [TIntegrationServiceChannelMessageDirectionEnterprise, ...TIntegrationServiceChannelMessageDirectionEnterprise[]])

export type TIntegrationServiceChannelMessageDirection = keyof typeof IntegrationServiceChannelMessageDirection
export type TIntegrationServiceChannelMessageDirectionEnterprise = `${IntegrationServiceChannelMessageDirection}`

enum ModalityUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export const ZModalityUseMode = z.enum(Object.keys(ModalityUseMode) as [TModalityUseMode, ...TModalityUseMode[]])
export const ZModalityUseModeEnterprise = z.enum(Object.values(ModalityUseMode) as [TModalityUseModeEnterprise, ...TModalityUseModeEnterprise[]])

export type TModalityUseMode = keyof typeof ModalityUseMode
export type TModalityUseModeEnterprise = `${ModalityUseMode}`

enum MoveBoundaryOnPosting {
  DontMove = "НеПеремещать",
  Move = "Перемещать",
}

export const ZMoveBoundaryOnPosting = z.enum(Object.keys(MoveBoundaryOnPosting) as [TMoveBoundaryOnPosting, ...TMoveBoundaryOnPosting[]])
export const ZMoveBoundaryOnPostingEnterprise = z.enum(Object.values(MoveBoundaryOnPosting) as [TMoveBoundaryOnPostingEnterprise, ...TMoveBoundaryOnPostingEnterprise[]])

export type TMoveBoundaryOnPosting = keyof typeof MoveBoundaryOnPosting
export type TMoveBoundaryOnPostingEnterprise = `${MoveBoundaryOnPosting}`

enum ObjectAutonumerationMode {
  NotAutoFree = "НеОсвобождатьАвтоматически",
  AutoFree = "ОсвобождатьАвтоматически",
}

export const ZObjectAutonumerationMode = z.enum(Object.keys(ObjectAutonumerationMode) as [TObjectAutonumerationMode, ...TObjectAutonumerationMode[]])
export const ZObjectAutonumerationModeEnterprise = z.enum(Object.values(ObjectAutonumerationMode) as [TObjectAutonumerationModeEnterprise, ...TObjectAutonumerationModeEnterprise[]])

export type TObjectAutonumerationMode = keyof typeof ObjectAutonumerationMode
export type TObjectAutonumerationModeEnterprise = `${ObjectAutonumerationMode}`

enum ObjectBelonging {
  Adopted = "Заимствованный",
  Native = "Собственный",
}

export const ZObjectBelonging = z.enum(Object.keys(ObjectBelonging) as [TObjectBelonging, ...TObjectBelonging[]])
export const ZObjectBelongingEnterprise = z.enum(Object.values(ObjectBelonging) as [TObjectBelongingEnterprise, ...TObjectBelongingEnterprise[]])

export type TObjectBelonging = keyof typeof ObjectBelonging
export type TObjectBelongingEnterprise = `${ObjectBelonging}`

enum Posting {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export const ZPosting = z.enum(Object.keys(Posting) as [TPosting, ...TPosting[]])
export const ZPostingEnterprise = z.enum(Object.values(Posting) as [TPostingEnterprise, ...TPostingEnterprise[]])

export type TPosting = keyof typeof Posting
export type TPostingEnterprise = `${Posting}`

enum RealTimePosting {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export const ZRealTimePosting = z.enum(Object.keys(RealTimePosting) as [TRealTimePosting, ...TRealTimePosting[]])
export const ZRealTimePostingEnterprise = z.enum(Object.values(RealTimePosting) as [TRealTimePostingEnterprise, ...TRealTimePostingEnterprise[]])

export type TRealTimePosting = keyof typeof RealTimePosting
export type TRealTimePostingEnterprise = `${RealTimePosting}`

enum RegisterRecordsDeletion {
  AutoDeleteOff = "НеУдалятьАвтоматически",
  AutoDelete = "УдалятьАвтоматически",
  AutoDeleteOnUnpost = "УдалятьАвтоматическиПриОтменеПроведения",
}

export const ZRegisterRecordsDeletion = z.enum(Object.keys(RegisterRecordsDeletion) as [TRegisterRecordsDeletion, ...TRegisterRecordsDeletion[]])
export const ZRegisterRecordsDeletionEnterprise = z.enum(Object.values(RegisterRecordsDeletion) as [TRegisterRecordsDeletionEnterprise, ...TRegisterRecordsDeletionEnterprise[]])

export type TRegisterRecordsDeletion = keyof typeof RegisterRecordsDeletion
export type TRegisterRecordsDeletionEnterprise = `${RegisterRecordsDeletion}`

enum RegisterRecordsWritingOnPost {
  WriteSelected = "ЗаписыватьВыбранные",
  WriteModified = "ЗаписыватьМодифицированные",
}

export const ZRegisterRecordsWritingOnPost = z.enum(Object.keys(RegisterRecordsWritingOnPost) as [TRegisterRecordsWritingOnPost, ...TRegisterRecordsWritingOnPost[]])
export const ZRegisterRecordsWritingOnPostEnterprise = z.enum(Object.values(RegisterRecordsWritingOnPost) as [TRegisterRecordsWritingOnPostEnterprise, ...TRegisterRecordsWritingOnPostEnterprise[]])

export type TRegisterRecordsWritingOnPost = keyof typeof RegisterRecordsWritingOnPost
export type TRegisterRecordsWritingOnPostEnterprise = `${RegisterRecordsWritingOnPost}`

enum RegisterWriteMode {
  Independent = "Независимый",
  RecorderSubordinate = "ПодчинениеРегистратору",
}

export const ZRegisterWriteMode = z.enum(Object.keys(RegisterWriteMode) as [TRegisterWriteMode, ...TRegisterWriteMode[]])
export const ZRegisterWriteModeEnterprise = z.enum(Object.values(RegisterWriteMode) as [TRegisterWriteModeEnterprise, ...TRegisterWriteModeEnterprise[]])

export type TRegisterWriteMode = keyof typeof RegisterWriteMode
export type TRegisterWriteModeEnterprise = `${RegisterWriteMode}`

enum ReturnValuesReuse {
  DuringRequest = "НаВремяВызова",
  DuringSession = "НаВремяСеанса",
  DontUse = "НеИспользовать",
}

export const ZReturnValuesReuse = z.enum(Object.keys(ReturnValuesReuse) as [TReturnValuesReuse, ...TReturnValuesReuse[]])
export const ZReturnValuesReuseEnterprise = z.enum(Object.values(ReturnValuesReuse) as [TReturnValuesReuseEnterprise, ...TReturnValuesReuseEnterprise[]])

export type TReturnValuesReuse = keyof typeof ReturnValuesReuse
export type TReturnValuesReuseEnterprise = `${ReturnValuesReuse}`

enum ScriptVariant {
  English = "Английский",
  Russian = "Русский",
}

export const ZScriptVariant = z.enum(Object.keys(ScriptVariant) as [TScriptVariant, ...TScriptVariant[]])
export const ZScriptVariantEnterprise = z.enum(Object.values(ScriptVariant) as [TScriptVariantEnterprise, ...TScriptVariantEnterprise[]])

export type TScriptVariant = keyof typeof ScriptVariant
export type TScriptVariantEnterprise = `${ScriptVariant}`

enum SearchStringModeOnInputByString {
  AnyPart = "ЛюбаяЧасть",
  Begin = "Начало",
}

export const ZSearchStringModeOnInputByString = z.enum(Object.keys(SearchStringModeOnInputByString) as [TSearchStringModeOnInputByString, ...TSearchStringModeOnInputByString[]])
export const ZSearchStringModeOnInputByStringEnterprise = z.enum(Object.values(SearchStringModeOnInputByString) as [TSearchStringModeOnInputByStringEnterprise, ...TSearchStringModeOnInputByStringEnterprise[]])

export type TSearchStringModeOnInputByString = keyof typeof SearchStringModeOnInputByString
export type TSearchStringModeOnInputByStringEnterprise = `${SearchStringModeOnInputByString}`

enum SequenceFilling {
  AutoFill = "ЗаполнятьАвтоматически",
  AutoFillOff = "НеЗаполнятьАвтоматически",
}

export const ZSequenceFilling = z.enum(Object.keys(SequenceFilling) as [TSequenceFilling, ...TSequenceFilling[]])
export const ZSequenceFillingEnterprise = z.enum(Object.values(SequenceFilling) as [TSequenceFillingEnterprise, ...TSequenceFillingEnterprise[]])

export type TSequenceFilling = keyof typeof SequenceFilling
export type TSequenceFillingEnterprise = `${SequenceFilling}`

enum SessionReuseMode {
  Use = "Использовать",
  AutoUse = "ИспользоватьАвтоматически",
  DontUse = "НеИспользовать",
}

export const ZSessionReuseMode = z.enum(Object.keys(SessionReuseMode) as [TSessionReuseMode, ...TSessionReuseMode[]])
export const ZSessionReuseModeEnterprise = z.enum(Object.values(SessionReuseMode) as [TSessionReuseModeEnterprise, ...TSessionReuseModeEnterprise[]])

export type TSessionReuseMode = keyof typeof SessionReuseMode
export type TSessionReuseModeEnterprise = `${SessionReuseMode}`

enum StyleElementType {
  Border = "Рамка",
  Color = "Цвет",
  Font = "Шрифт",
}

export const ZStyleElementType = z.enum(Object.keys(StyleElementType) as [TStyleElementType, ...TStyleElementType[]])
export const ZStyleElementTypeEnterprise = z.enum(Object.values(StyleElementType) as [TStyleElementTypeEnterprise, ...TStyleElementTypeEnterprise[]])

export type TStyleElementType = keyof typeof StyleElementType
export type TStyleElementTypeEnterprise = `${StyleElementType}`

enum SubordinationUse {
  ToFolders = "Группам",
  ToFoldersAndItems = "ГруппамИЭлементам",
  ToItems = "Элементам",
}

export const ZSubordinationUse = z.enum(Object.keys(SubordinationUse) as [TSubordinationUse, ...TSubordinationUse[]])
export const ZSubordinationUseEnterprise = z.enum(Object.values(SubordinationUse) as [TSubordinationUseEnterprise, ...TSubordinationUseEnterprise[]])

export type TSubordinationUse = keyof typeof SubordinationUse
export type TSubordinationUseEnterprise = `${SubordinationUse}`

enum SynchronousExtensionAndAddInCallUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export const ZSynchronousExtensionAndAddInCallUseMode = z.enum(Object.keys(SynchronousExtensionAndAddInCallUseMode) as [TSynchronousExtensionAndAddInCallUseMode, ...TSynchronousExtensionAndAddInCallUseMode[]])
export const ZSynchronousExtensionAndAddInCallUseModeEnterprise = z.enum(Object.values(SynchronousExtensionAndAddInCallUseMode) as [TSynchronousExtensionAndAddInCallUseModeEnterprise, ...TSynchronousExtensionAndAddInCallUseModeEnterprise[]])

export type TSynchronousExtensionAndAddInCallUseMode = keyof typeof SynchronousExtensionAndAddInCallUseMode
export type TSynchronousExtensionAndAddInCallUseModeEnterprise = `${SynchronousExtensionAndAddInCallUseMode}`

enum SynchronousPlatformExtensionAndAddInCallUseMode {
  Use = "Использовать",
  UseWithWarnings = "ИспользоватьСПредупреждениями",
  DontUse = "НеИспользовать",
}

export const ZSynchronousPlatformExtensionAndAddInCallUseMode = z.enum(Object.keys(SynchronousPlatformExtensionAndAddInCallUseMode) as [TSynchronousPlatformExtensionAndAddInCallUseMode, ...TSynchronousPlatformExtensionAndAddInCallUseMode[]])
export const ZSynchronousPlatformExtensionAndAddInCallUseModeEnterprise = z.enum(Object.values(SynchronousPlatformExtensionAndAddInCallUseMode) as [TSynchronousPlatformExtensionAndAddInCallUseModeEnterprise, ...TSynchronousPlatformExtensionAndAddInCallUseModeEnterprise[]])

export type TSynchronousPlatformExtensionAndAddInCallUseMode = keyof typeof SynchronousPlatformExtensionAndAddInCallUseMode
export type TSynchronousPlatformExtensionAndAddInCallUseModeEnterprise = `${SynchronousPlatformExtensionAndAddInCallUseMode}`

enum TaskMainPresentation {
  AsDescription = "ВВидеНаименования",
  AsNumber = "ВВидеНомера",
}

export const ZTaskMainPresentation = z.enum(Object.keys(TaskMainPresentation) as [TTaskMainPresentation, ...TTaskMainPresentation[]])
export const ZTaskMainPresentationEnterprise = z.enum(Object.values(TaskMainPresentation) as [TTaskMainPresentationEnterprise, ...TTaskMainPresentationEnterprise[]])

export type TTaskMainPresentation = keyof typeof TaskMainPresentation
export type TTaskMainPresentationEnterprise = `${TaskMainPresentation}`

enum TaskNumberAutoPrefix {
  DontUse = "НеИспользовать",
  BusinessProcessNumber = "НомерБизнесПроцесса",
}

export const ZTaskNumberAutoPrefix = z.enum(Object.keys(TaskNumberAutoPrefix) as [TTaskNumberAutoPrefix, ...TTaskNumberAutoPrefix[]])
export const ZTaskNumberAutoPrefixEnterprise = z.enum(Object.values(TaskNumberAutoPrefix) as [TTaskNumberAutoPrefixEnterprise, ...TTaskNumberAutoPrefixEnterprise[]])

export type TTaskNumberAutoPrefix = keyof typeof TaskNumberAutoPrefix
export type TTaskNumberAutoPrefixEnterprise = `${TaskNumberAutoPrefix}`

enum TaskNumberType {
  String = "Строка",
  Number = "Число",
}

export const ZTaskNumberType = z.enum(Object.keys(TaskNumberType) as [TTaskNumberType, ...TTaskNumberType[]])
export const ZTaskNumberTypeEnterprise = z.enum(Object.values(TaskNumberType) as [TTaskNumberTypeEnterprise, ...TTaskNumberTypeEnterprise[]])

export type TTaskNumberType = keyof typeof TaskNumberType
export type TTaskNumberTypeEnterprise = `${TaskNumberType}`

enum TemplateType {
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

export const ZTemplateType = z.enum(Object.keys(TemplateType) as [TTemplateType, ...TTemplateType[]])
export const ZTemplateTypeEnterprise = z.enum(Object.values(TemplateType) as [TTemplateTypeEnterprise, ...TTemplateTypeEnterprise[]])

export type TTemplateType = keyof typeof TemplateType
export type TTemplateTypeEnterprise = `${TemplateType}`

enum TransferDirection {
  In = "Входной",
  InOut = "ВходнойВыходной",
  Out = "Выходной",
}

export const ZTransferDirection = z.enum(Object.keys(TransferDirection) as [TTransferDirection, ...TTransferDirection[]])
export const ZTransferDirectionEnterprise = z.enum(Object.values(TransferDirection) as [TTransferDirectionEnterprise, ...TTransferDirectionEnterprise[]])

export type TTransferDirection = keyof typeof TransferDirection
export type TTransferDirectionEnterprise = `${TransferDirection}`

enum TypeReductionMode {
  Deny = "Запрещать",
  TransformValues = "ПреобразовыватьЗначения",
  DeleteData = "УдалятьДанные",
}

export const ZTypeReductionMode = z.enum(Object.keys(TypeReductionMode) as [TTypeReductionMode, ...TTypeReductionMode[]])
export const ZTypeReductionModeEnterprise = z.enum(Object.values(TypeReductionMode) as [TTypeReductionModeEnterprise, ...TTypeReductionModeEnterprise[]])

export type TTypeReductionMode = keyof typeof TypeReductionMode
export type TTypeReductionModeEnterprise = `${TypeReductionMode}`

enum UseFullTextSearch {
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZUseFullTextSearch = z.enum(Object.keys(UseFullTextSearch) as [TUseFullTextSearch, ...TUseFullTextSearch[]])
export const ZUseFullTextSearchEnterprise = z.enum(Object.values(UseFullTextSearch) as [TUseFullTextSearchEnterprise, ...TUseFullTextSearchEnterprise[]])

export type TUseFullTextSearch = keyof typeof UseFullTextSearch
export type TUseFullTextSearchEnterprise = `${UseFullTextSearch}`

enum UseQuickChoice {
  Auto = "Авто",
  Use = "Использовать",
  DontUse = "НеИспользовать",
}

export const ZUseQuickChoice = z.enum(Object.keys(UseQuickChoice) as [TUseQuickChoice, ...TUseQuickChoice[]])
export const ZUseQuickChoiceEnterprise = z.enum(Object.values(UseQuickChoice) as [TUseQuickChoiceEnterprise, ...TUseQuickChoiceEnterprise[]])

export type TUseQuickChoice = keyof typeof UseQuickChoice
export type TUseQuickChoiceEnterprise = `${UseQuickChoice}`

enum PresentationAdditionType {
  Add = "Добавлять",
  DontAdd = "НеДобавлять",
}

export const ZPresentationAdditionType = z.enum(Object.keys(PresentationAdditionType) as [TPresentationAdditionType, ...TPresentationAdditionType[]])
export const ZPresentationAdditionTypeEnterprise = z.enum(Object.values(PresentationAdditionType) as [TPresentationAdditionTypeEnterprise, ...TPresentationAdditionTypeEnterprise[]])

export type TPresentationAdditionType = keyof typeof PresentationAdditionType
export type TPresentationAdditionTypeEnterprise = `${PresentationAdditionType}`

enum ReportBuilderDetailsFillType {
  GroupValues = "ЗначенияГруппировок",
  DontFill = "НеЗаполнять",
  Details = "Расшифровка",
}

export const ZReportBuilderDetailsFillType = z.enum(Object.keys(ReportBuilderDetailsFillType) as [TReportBuilderDetailsFillType, ...TReportBuilderDetailsFillType[]])
export const ZReportBuilderDetailsFillTypeEnterprise = z.enum(Object.values(ReportBuilderDetailsFillType) as [TReportBuilderDetailsFillTypeEnterprise, ...TReportBuilderDetailsFillTypeEnterprise[]])

export type TReportBuilderDetailsFillType = keyof typeof ReportBuilderDetailsFillType
export type TReportBuilderDetailsFillTypeEnterprise = `${ReportBuilderDetailsFillType}`

enum ReportBuilderDimensionType {
  Hierarchy = "Иерархия",
  HierarchyOnly = "ТолькоИерархия",
  Items = "Элементы",
}

export const ZReportBuilderDimensionType = z.enum(Object.keys(ReportBuilderDimensionType) as [TReportBuilderDimensionType, ...TReportBuilderDimensionType[]])
export const ZReportBuilderDimensionTypeEnterprise = z.enum(Object.values(ReportBuilderDimensionType) as [TReportBuilderDimensionTypeEnterprise, ...TReportBuilderDimensionTypeEnterprise[]])

export type TReportBuilderDimensionType = keyof typeof ReportBuilderDimensionType
export type TReportBuilderDimensionTypeEnterprise = `${ReportBuilderDimensionType}`

enum TotalPlacementType {
  Header = "Заголовок",
  HeaderAndFooter = "ЗаголовокИПодвал",
  Footer = "Подвал",
  FooterOnly = "ТолькоПодвал",
}

export const ZTotalPlacementType = z.enum(Object.keys(TotalPlacementType) as [TTotalPlacementType, ...TTotalPlacementType[]])
export const ZTotalPlacementTypeEnterprise = z.enum(Object.values(TotalPlacementType) as [TTotalPlacementTypeEnterprise, ...TTotalPlacementTypeEnterprise[]])

export type TTotalPlacementType = keyof typeof TotalPlacementType
export type TTotalPlacementTypeEnterprise = `${TotalPlacementType}`

enum XMLAttributeType {
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

export const ZXMLAttributeType = z.enum(Object.keys(XMLAttributeType) as [TXMLAttributeType, ...TXMLAttributeType[]])
export const ZXMLAttributeTypeEnterprise = z.enum(Object.values(XMLAttributeType) as [TXMLAttributeTypeEnterprise, ...TXMLAttributeTypeEnterprise[]])

export type TXMLAttributeType = keyof typeof XMLAttributeType
export type TXMLAttributeTypeEnterprise = `${XMLAttributeType}`

enum XMLCanonicalizationType {
  XMLExclusiveCanonicalization = "ИсключающийКаноническийXML",
  XMLExclusiveCanonicalizationWithComments = "ИсключающийКаноническийXMLСКомментариями",
  XMLCanonicalization = "КаноническийXML",
  XMLCanonicalization1_1 = "КаноническийXML1_1",
  XMLCanonicalization1_1WithComments = "КаноническийXML1_1СКомментариями",
  XMLCanonicalizationWithComments = "КаноническийXMLСКомментариями",
}

export const ZXMLCanonicalizationType = z.enum(Object.keys(XMLCanonicalizationType) as [TXMLCanonicalizationType, ...TXMLCanonicalizationType[]])
export const ZXMLCanonicalizationTypeEnterprise = z.enum(Object.values(XMLCanonicalizationType) as [TXMLCanonicalizationTypeEnterprise, ...TXMLCanonicalizationTypeEnterprise[]])

export type TXMLCanonicalizationType = keyof typeof XMLCanonicalizationType
export type TXMLCanonicalizationTypeEnterprise = `${XMLCanonicalizationType}`

enum XMLNodeType {
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

export const ZXMLNodeType = z.enum(Object.keys(XMLNodeType) as [TXMLNodeType, ...TXMLNodeType[]])
export const ZXMLNodeTypeEnterprise = z.enum(Object.values(XMLNodeType) as [TXMLNodeTypeEnterprise, ...TXMLNodeTypeEnterprise[]])

export type TXMLNodeType = keyof typeof XMLNodeType
export type TXMLNodeTypeEnterprise = `${XMLNodeType}`

enum XMLSpace {
  Default = "ПоУмолчанию",
  Preserve = "Сохранять",
}

export const ZXMLSpace = z.enum(Object.keys(XMLSpace) as [TXMLSpace, ...TXMLSpace[]])
export const ZXMLSpaceEnterprise = z.enum(Object.values(XMLSpace) as [TXMLSpaceEnterprise, ...TXMLSpaceEnterprise[]])

export type TXMLSpace = keyof typeof XMLSpace
export type TXMLSpaceEnterprise = `${XMLSpace}`

enum XMLTypeAssignment {
  Implicit = "Неявное",
  Explicit = "Явное",
}

export const ZXMLTypeAssignment = z.enum(Object.keys(XMLTypeAssignment) as [TXMLTypeAssignment, ...TXMLTypeAssignment[]])
export const ZXMLTypeAssignmentEnterprise = z.enum(Object.values(XMLTypeAssignment) as [TXMLTypeAssignmentEnterprise, ...TXMLTypeAssignmentEnterprise[]])

export type TXMLTypeAssignment = keyof typeof XMLTypeAssignment
export type TXMLTypeAssignmentEnterprise = `${XMLTypeAssignment}`

enum XMLValidationType {
  NoValidate = "НетПроверки",
  DocumentTypeDefinition = "ОпределениеТипаДокумента",
  XMLSchema = "СхемаXML",
}

export const ZXMLValidationType = z.enum(Object.keys(XMLValidationType) as [TXMLValidationType, ...TXMLValidationType[]])
export const ZXMLValidationTypeEnterprise = z.enum(Object.values(XMLValidationType) as [TXMLValidationTypeEnterprise, ...TXMLValidationTypeEnterprise[]])

export type TXMLValidationType = keyof typeof XMLValidationType
export type TXMLValidationTypeEnterprise = `${XMLValidationType}`

enum AllowedMessageNo {
  Greater = "Больший",
  Any = "Любой",
  Next = "Очередной",
}

export const ZAllowedMessageNo = z.enum(Object.keys(AllowedMessageNo) as [TAllowedMessageNo, ...TAllowedMessageNo[]])
export const ZAllowedMessageNoEnterprise = z.enum(Object.values(AllowedMessageNo) as [TAllowedMessageNoEnterprise, ...TAllowedMessageNoEnterprise[]])

export type TAllowedMessageNo = keyof typeof AllowedMessageNo
export type TAllowedMessageNoEnterprise = `${AllowedMessageNo}`

enum AutoChangeRecord {
  Deny = "Запретить",
  Allow = "Разрешить",
}

export const ZAutoChangeRecord = z.enum(Object.keys(AutoChangeRecord) as [TAutoChangeRecord, ...TAutoChangeRecord[]])
export const ZAutoChangeRecordEnterprise = z.enum(Object.values(AutoChangeRecord) as [TAutoChangeRecordEnterprise, ...TAutoChangeRecordEnterprise[]])

export type TAutoChangeRecord = keyof typeof AutoChangeRecord
export type TAutoChangeRecordEnterprise = `${AutoChangeRecord}`

enum DataItemReceive {
  Auto = "Авто",
  Ignore = "Игнорировать",
  Accept = "Принять",
}

export const ZDataItemReceive = z.enum(Object.keys(DataItemReceive) as [TDataItemReceive, ...TDataItemReceive[]])
export const ZDataItemReceiveEnterprise = z.enum(Object.values(DataItemReceive) as [TDataItemReceiveEnterprise, ...TDataItemReceiveEnterprise[]])

export type TDataItemReceive = keyof typeof DataItemReceive
export type TDataItemReceiveEnterprise = `${DataItemReceive}`

enum DataItemSend {
  Auto = "Авто",
  Ignore = "Игнорировать",
  Delete = "Удалить",
}

export const ZDataItemSend = z.enum(Object.keys(DataItemSend) as [TDataItemSend, ...TDataItemSend[]])
export const ZDataItemSendEnterprise = z.enum(Object.values(DataItemSend) as [TDataItemSendEnterprise, ...TDataItemSendEnterprise[]])

export type TDataItemSend = keyof typeof DataItemSend
export type TDataItemSendEnterprise = `${DataItemSend}`

enum AnalysisDataType {
  Discrete = "Дискретные",
  Contiguous = "Непрерывные",
}

export const ZAnalysisDataType = z.enum(Object.keys(AnalysisDataType) as [TAnalysisDataType, ...TAnalysisDataType[]])
export const ZAnalysisDataTypeEnterprise = z.enum(Object.values(AnalysisDataType) as [TAnalysisDataTypeEnterprise, ...TAnalysisDataTypeEnterprise[]])

export type TAnalysisDataType = keyof typeof AnalysisDataType
export type TAnalysisDataTypeEnterprise = `${AnalysisDataType}`

enum AssociationRulesDataSourceType {
  Object = "Объектный",
  Event = "Событийный",
}

export const ZAssociationRulesDataSourceType = z.enum(Object.keys(AssociationRulesDataSourceType) as [TAssociationRulesDataSourceType, ...TAssociationRulesDataSourceType[]])
export const ZAssociationRulesDataSourceTypeEnterprise = z.enum(Object.values(AssociationRulesDataSourceType) as [TAssociationRulesDataSourceTypeEnterprise, ...TAssociationRulesDataSourceTypeEnterprise[]])

export type TAssociationRulesDataSourceType = keyof typeof AssociationRulesDataSourceType
export type TAssociationRulesDataSourceTypeEnterprise = `${AssociationRulesDataSourceType}`

enum AssociationRulesPruneType {
  Redundant = "Избыточные",
  Covered = "Покрытые",
}

export const ZAssociationRulesPruneType = z.enum(Object.keys(AssociationRulesPruneType) as [TAssociationRulesPruneType, ...TAssociationRulesPruneType[]])
export const ZAssociationRulesPruneTypeEnterprise = z.enum(Object.values(AssociationRulesPruneType) as [TAssociationRulesPruneTypeEnterprise, ...TAssociationRulesPruneTypeEnterprise[]])

export type TAssociationRulesPruneType = keyof typeof AssociationRulesPruneType
export type TAssociationRulesPruneTypeEnterprise = `${AssociationRulesPruneType}`

enum ClusterizationMethod {
  NearestNeighbor = "БлижняяСвязь",
  FurthestNeighbor = "ДальняяСвязь",
  KMeans = "КСредних",
  Centroid = "ЦентрТяжести",
}

export const ZClusterizationMethod = z.enum(Object.keys(ClusterizationMethod) as [TClusterizationMethod, ...TClusterizationMethod[]])
export const ZClusterizationMethodEnterprise = z.enum(Object.values(ClusterizationMethod) as [TClusterizationMethodEnterprise, ...TClusterizationMethodEnterprise[]])

export type TClusterizationMethod = keyof typeof ClusterizationMethod
export type TClusterizationMethodEnterprise = `${ClusterizationMethod}`

enum DataAnalysisAssociationRulesOrderType {
  ByConfidence = "ПоДостоверности",
  ByImportance = "ПоЗначимости",
  BySupport = "ПоКоличествуСлучаев",
}

export const ZDataAnalysisAssociationRulesOrderType = z.enum(Object.keys(DataAnalysisAssociationRulesOrderType) as [TDataAnalysisAssociationRulesOrderType, ...TDataAnalysisAssociationRulesOrderType[]])
export const ZDataAnalysisAssociationRulesOrderTypeEnterprise = z.enum(Object.values(DataAnalysisAssociationRulesOrderType) as [TDataAnalysisAssociationRulesOrderTypeEnterprise, ...TDataAnalysisAssociationRulesOrderTypeEnterprise[]])

export type TDataAnalysisAssociationRulesOrderType = keyof typeof DataAnalysisAssociationRulesOrderType
export type TDataAnalysisAssociationRulesOrderTypeEnterprise = `${DataAnalysisAssociationRulesOrderType}`

enum DataAnalysisColumnTypeAssociationRules {
  NotUsed = "НеИспользуемая",
  Object = "Объект",
  Item = "Элемент",
}

export const ZDataAnalysisColumnTypeAssociationRules = z.enum(Object.keys(DataAnalysisColumnTypeAssociationRules) as [TDataAnalysisColumnTypeAssociationRules, ...TDataAnalysisColumnTypeAssociationRules[]])
export const ZDataAnalysisColumnTypeAssociationRulesEnterprise = z.enum(Object.values(DataAnalysisColumnTypeAssociationRules) as [TDataAnalysisColumnTypeAssociationRulesEnterprise, ...TDataAnalysisColumnTypeAssociationRulesEnterprise[]])

export type TDataAnalysisColumnTypeAssociationRules = keyof typeof DataAnalysisColumnTypeAssociationRules
export type TDataAnalysisColumnTypeAssociationRulesEnterprise = `${DataAnalysisColumnTypeAssociationRules}`

enum DataAnalysisColumnTypeClusterization {
  Input = "Входная",
  InputAndPredictable = "ВходнаяИПрогнозируемая",
  Key = "Ключ",
  NotUsed = "НеИспользуемая",
  Predictable = "Прогнозируемая",
}

export const ZDataAnalysisColumnTypeClusterization = z.enum(Object.keys(DataAnalysisColumnTypeClusterization) as [TDataAnalysisColumnTypeClusterization, ...TDataAnalysisColumnTypeClusterization[]])
export const ZDataAnalysisColumnTypeClusterizationEnterprise = z.enum(Object.values(DataAnalysisColumnTypeClusterization) as [TDataAnalysisColumnTypeClusterizationEnterprise, ...TDataAnalysisColumnTypeClusterizationEnterprise[]])

export type TDataAnalysisColumnTypeClusterization = keyof typeof DataAnalysisColumnTypeClusterization
export type TDataAnalysisColumnTypeClusterizationEnterprise = `${DataAnalysisColumnTypeClusterization}`

enum DataAnalysisColumnTypeDecisionTree {
  Input = "Входная",
  NotUsed = "НеИспользуемая",
  Predictable = "Прогнозируемая",
}

export const ZDataAnalysisColumnTypeDecisionTree = z.enum(Object.keys(DataAnalysisColumnTypeDecisionTree) as [TDataAnalysisColumnTypeDecisionTree, ...TDataAnalysisColumnTypeDecisionTree[]])
export const ZDataAnalysisColumnTypeDecisionTreeEnterprise = z.enum(Object.values(DataAnalysisColumnTypeDecisionTree) as [TDataAnalysisColumnTypeDecisionTreeEnterprise, ...TDataAnalysisColumnTypeDecisionTreeEnterprise[]])

export type TDataAnalysisColumnTypeDecisionTree = keyof typeof DataAnalysisColumnTypeDecisionTree
export type TDataAnalysisColumnTypeDecisionTreeEnterprise = `${DataAnalysisColumnTypeDecisionTree}`

enum DataAnalysisColumnTypeSequentialPatterns {
  Time = "Время",
  NotUsed = "НеИспользуемая",
  Sequence = "Последовательность",
  Item = "Элемент",
}

export const ZDataAnalysisColumnTypeSequentialPatterns = z.enum(Object.keys(DataAnalysisColumnTypeSequentialPatterns) as [TDataAnalysisColumnTypeSequentialPatterns, ...TDataAnalysisColumnTypeSequentialPatterns[]])
export const ZDataAnalysisColumnTypeSequentialPatternsEnterprise = z.enum(Object.values(DataAnalysisColumnTypeSequentialPatterns) as [TDataAnalysisColumnTypeSequentialPatternsEnterprise, ...TDataAnalysisColumnTypeSequentialPatternsEnterprise[]])

export type TDataAnalysisColumnTypeSequentialPatterns = keyof typeof DataAnalysisColumnTypeSequentialPatterns
export type TDataAnalysisColumnTypeSequentialPatternsEnterprise = `${DataAnalysisColumnTypeSequentialPatterns}`

enum DataAnalysisColumnTypeSummaryStatistics {
  Input = "Входная",
  NotUsed = "НеИспользуемая",
}

export const ZDataAnalysisColumnTypeSummaryStatistics = z.enum(Object.keys(DataAnalysisColumnTypeSummaryStatistics) as [TDataAnalysisColumnTypeSummaryStatistics, ...TDataAnalysisColumnTypeSummaryStatistics[]])
export const ZDataAnalysisColumnTypeSummaryStatisticsEnterprise = z.enum(Object.values(DataAnalysisColumnTypeSummaryStatistics) as [TDataAnalysisColumnTypeSummaryStatisticsEnterprise, ...TDataAnalysisColumnTypeSummaryStatisticsEnterprise[]])

export type TDataAnalysisColumnTypeSummaryStatistics = keyof typeof DataAnalysisColumnTypeSummaryStatistics
export type TDataAnalysisColumnTypeSummaryStatisticsEnterprise = `${DataAnalysisColumnTypeSummaryStatistics}`

enum DataAnalysisDistanceMetricType {
  Euclidean = "ЕвклидоваМетрика",
  SquaredEuclidean = "ЕвклидоваМетрикаВКвадрате",
  CityBlock = "МетрикаГорода",
  Maximum = "МетрикаДоминирования",
}

export const ZDataAnalysisDistanceMetricType = z.enum(Object.keys(DataAnalysisDistanceMetricType) as [TDataAnalysisDistanceMetricType, ...TDataAnalysisDistanceMetricType[]])
export const ZDataAnalysisDistanceMetricTypeEnterprise = z.enum(Object.values(DataAnalysisDistanceMetricType) as [TDataAnalysisDistanceMetricTypeEnterprise, ...TDataAnalysisDistanceMetricTypeEnterprise[]])

export type TDataAnalysisDistanceMetricType = keyof typeof DataAnalysisDistanceMetricType
export type TDataAnalysisDistanceMetricTypeEnterprise = `${DataAnalysisDistanceMetricType}`

enum DataAnalysisFieldType {
  DataAnalysisObject = "ОбъектАнализаДанных",
  Field = "Поле",
}

export const ZDataAnalysisFieldType = z.enum(Object.keys(DataAnalysisFieldType) as [TDataAnalysisFieldType, ...TDataAnalysisFieldType[]])
export const ZDataAnalysisFieldTypeEnterprise = z.enum(Object.values(DataAnalysisFieldType) as [TDataAnalysisFieldTypeEnterprise, ...TDataAnalysisFieldTypeEnterprise[]])

export type TDataAnalysisFieldType = keyof typeof DataAnalysisFieldType
export type TDataAnalysisFieldTypeEnterprise = `${DataAnalysisFieldType}`

enum DataAnalysisNumericValueUseType {
  AsBoolean = "КакБулево",
  AsNumeric = "КакЧисло",
}

export const ZDataAnalysisNumericValueUseType = z.enum(Object.keys(DataAnalysisNumericValueUseType) as [TDataAnalysisNumericValueUseType, ...TDataAnalysisNumericValueUseType[]])
export const ZDataAnalysisNumericValueUseTypeEnterprise = z.enum(Object.values(DataAnalysisNumericValueUseType) as [TDataAnalysisNumericValueUseTypeEnterprise, ...TDataAnalysisNumericValueUseTypeEnterprise[]])

export type TDataAnalysisNumericValueUseType = keyof typeof DataAnalysisNumericValueUseType
export type TDataAnalysisNumericValueUseTypeEnterprise = `${DataAnalysisNumericValueUseType}`

enum DataAnalysisResultTableFillType {
  AllFields = "ВсеПоля",
  UsedFields = "ИспользуемыеПоля",
  KeyFields = "КлючевыеПоля",
  DontFill = "НеЗаполнять",
}

export const ZDataAnalysisResultTableFillType = z.enum(Object.keys(DataAnalysisResultTableFillType) as [TDataAnalysisResultTableFillType, ...TDataAnalysisResultTableFillType[]])
export const ZDataAnalysisResultTableFillTypeEnterprise = z.enum(Object.values(DataAnalysisResultTableFillType) as [TDataAnalysisResultTableFillTypeEnterprise, ...TDataAnalysisResultTableFillTypeEnterprise[]])

export type TDataAnalysisResultTableFillType = keyof typeof DataAnalysisResultTableFillType
export type TDataAnalysisResultTableFillTypeEnterprise = `${DataAnalysisResultTableFillType}`

enum DataAnalysisSequentialPatternsOrderType {
  ByLength = "ПоДлине",
  BySupport = "ПоКоличествуСлучаев",
}

export const ZDataAnalysisSequentialPatternsOrderType = z.enum(Object.keys(DataAnalysisSequentialPatternsOrderType) as [TDataAnalysisSequentialPatternsOrderType, ...TDataAnalysisSequentialPatternsOrderType[]])
export const ZDataAnalysisSequentialPatternsOrderTypeEnterprise = z.enum(Object.values(DataAnalysisSequentialPatternsOrderType) as [TDataAnalysisSequentialPatternsOrderTypeEnterprise, ...TDataAnalysisSequentialPatternsOrderTypeEnterprise[]])

export type TDataAnalysisSequentialPatternsOrderType = keyof typeof DataAnalysisSequentialPatternsOrderType
export type TDataAnalysisSequentialPatternsOrderTypeEnterprise = `${DataAnalysisSequentialPatternsOrderType}`

enum DataAnalysisStandardizationType {
  DontStandardize = "НеСтандартизировать",
  Standardize = "Стандартизировать",
}

export const ZDataAnalysisStandardizationType = z.enum(Object.keys(DataAnalysisStandardizationType) as [TDataAnalysisStandardizationType, ...TDataAnalysisStandardizationType[]])
export const ZDataAnalysisStandardizationTypeEnterprise = z.enum(Object.values(DataAnalysisStandardizationType) as [TDataAnalysisStandardizationTypeEnterprise, ...TDataAnalysisStandardizationTypeEnterprise[]])

export type TDataAnalysisStandardizationType = keyof typeof DataAnalysisStandardizationType
export type TDataAnalysisStandardizationTypeEnterprise = `${DataAnalysisStandardizationType}`

enum DataAnalysisTimeIntervalUnitType {
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

export const ZDataAnalysisTimeIntervalUnitType = z.enum(Object.keys(DataAnalysisTimeIntervalUnitType) as [TDataAnalysisTimeIntervalUnitType, ...TDataAnalysisTimeIntervalUnitType[]])
export const ZDataAnalysisTimeIntervalUnitTypeEnterprise = z.enum(Object.values(DataAnalysisTimeIntervalUnitType) as [TDataAnalysisTimeIntervalUnitTypeEnterprise, ...TDataAnalysisTimeIntervalUnitTypeEnterprise[]])

export type TDataAnalysisTimeIntervalUnitType = keyof typeof DataAnalysisTimeIntervalUnitType
export type TDataAnalysisTimeIntervalUnitTypeEnterprise = `${DataAnalysisTimeIntervalUnitType}`

enum DecisionTreeSimplificationType {
  DontSimplify = "НеУпрощать",
  Simplify = "Упрощать",
}

export const ZDecisionTreeSimplificationType = z.enum(Object.keys(DecisionTreeSimplificationType) as [TDecisionTreeSimplificationType, ...TDecisionTreeSimplificationType[]])
export const ZDecisionTreeSimplificationTypeEnterprise = z.enum(Object.values(DecisionTreeSimplificationType) as [TDecisionTreeSimplificationTypeEnterprise, ...TDecisionTreeSimplificationTypeEnterprise[]])

export type TDecisionTreeSimplificationType = keyof typeof DecisionTreeSimplificationType
export type TDecisionTreeSimplificationTypeEnterprise = `${DecisionTreeSimplificationType}`

enum PredictionModelColumnType {
  Input = "Входная",
  DataSourceColumn = "КолонкаИсточникаДанных",
  Predictable = "Прогнозируемая",
}

export const ZPredictionModelColumnType = z.enum(Object.keys(PredictionModelColumnType) as [TPredictionModelColumnType, ...TPredictionModelColumnType[]])
export const ZPredictionModelColumnTypeEnterprise = z.enum(Object.values(PredictionModelColumnType) as [TPredictionModelColumnTypeEnterprise, ...TPredictionModelColumnTypeEnterprise[]])

export type TPredictionModelColumnType = keyof typeof PredictionModelColumnType
export type TPredictionModelColumnTypeEnterprise = `${PredictionModelColumnType}`

enum FileNamesEncodingInZipFile {
  UTF8 = "UTF8",
  Auto = "Авто",
  OSEncodingWithUTF8 = "КодировкаОСДополнительноUTF8",
}

export const ZFileNamesEncodingInZipFile = z.enum(Object.keys(FileNamesEncodingInZipFile) as [TFileNamesEncodingInZipFile, ...TFileNamesEncodingInZipFile[]])
export const ZFileNamesEncodingInZipFileEnterprise = z.enum(Object.values(FileNamesEncodingInZipFile) as [TFileNamesEncodingInZipFileEnterprise, ...TFileNamesEncodingInZipFileEnterprise[]])

export type TFileNamesEncodingInZipFile = keyof typeof FileNamesEncodingInZipFile
export type TFileNamesEncodingInZipFileEnterprise = `${FileNamesEncodingInZipFile}`

enum ZIPCompressionLevel {
  Maximum = "Максимальный",
  Minimum = "Минимальный",
  Optimal = "Оптимальный",
}

export const ZZIPCompressionLevel = z.enum(Object.keys(ZIPCompressionLevel) as [TZIPCompressionLevel, ...TZIPCompressionLevel[]])
export const ZZIPCompressionLevelEnterprise = z.enum(Object.values(ZIPCompressionLevel) as [TZIPCompressionLevelEnterprise, ...TZIPCompressionLevelEnterprise[]])

export type TZIPCompressionLevel = keyof typeof ZIPCompressionLevel
export type TZIPCompressionLevelEnterprise = `${ZIPCompressionLevel}`

enum ZIPCompressionMethod {
  BZIP2 = "BZIP2",
  Copy = "Копирование",
  Deflate = "Сжатие",
}

export const ZZIPCompressionMethod = z.enum(Object.keys(ZIPCompressionMethod) as [TZIPCompressionMethod, ...TZIPCompressionMethod[]])
export const ZZIPCompressionMethodEnterprise = z.enum(Object.values(ZIPCompressionMethod) as [TZIPCompressionMethodEnterprise, ...TZIPCompressionMethodEnterprise[]])

export type TZIPCompressionMethod = keyof typeof ZIPCompressionMethod
export type TZIPCompressionMethodEnterprise = `${ZIPCompressionMethod}`

enum ZIPEncryptionMethod {
  AES128 = "AES128",
  AES192 = "AES192",
  AES256 = "AES256",
  Zip20 = "Zip20",
}

export const ZZIPEncryptionMethod = z.enum(Object.keys(ZIPEncryptionMethod) as [TZIPEncryptionMethod, ...TZIPEncryptionMethod[]])
export const ZZIPEncryptionMethodEnterprise = z.enum(Object.values(ZIPEncryptionMethod) as [TZIPEncryptionMethodEnterprise, ...TZIPEncryptionMethodEnterprise[]])

export type TZIPEncryptionMethod = keyof typeof ZIPEncryptionMethod
export type TZIPEncryptionMethodEnterprise = `${ZIPEncryptionMethod}`

enum ZIPRestoreFilePathsMode {
  Restore = "Восстанавливать",
  DontRestore = "НеВосстанавливать",
}

export const ZZIPRestoreFilePathsMode = z.enum(Object.keys(ZIPRestoreFilePathsMode) as [TZIPRestoreFilePathsMode, ...TZIPRestoreFilePathsMode[]])
export const ZZIPRestoreFilePathsModeEnterprise = z.enum(Object.values(ZIPRestoreFilePathsMode) as [TZIPRestoreFilePathsModeEnterprise, ...TZIPRestoreFilePathsModeEnterprise[]])

export type TZIPRestoreFilePathsMode = keyof typeof ZIPRestoreFilePathsMode
export type TZIPRestoreFilePathsModeEnterprise = `${ZIPRestoreFilePathsMode}`

enum ZIPStorePathMode {
  DontStorePath = "НеСохранятьПути",
  StoreRelativePath = "СохранятьОтносительныеПути",
  StoreFullPath = "СохранятьПолныеПути",
}

export const ZZIPStorePathMode = z.enum(Object.keys(ZIPStorePathMode) as [TZIPStorePathMode, ...TZIPStorePathMode[]])
export const ZZIPStorePathModeEnterprise = z.enum(Object.values(ZIPStorePathMode) as [TZIPStorePathModeEnterprise, ...TZIPStorePathModeEnterprise[]])

export type TZIPStorePathMode = keyof typeof ZIPStorePathMode
export type TZIPStorePathModeEnterprise = `${ZIPStorePathMode}`

enum ZIPSubDirProcessingMode {
  DontProcess = "НеОбрабатывать",
  ProcessRecursively = "ОбрабатыватьРекурсивно",
}

export const ZZIPSubDirProcessingMode = z.enum(Object.keys(ZIPSubDirProcessingMode) as [TZIPSubDirProcessingMode, ...TZIPSubDirProcessingMode[]])
export const ZZIPSubDirProcessingModeEnterprise = z.enum(Object.values(ZIPSubDirProcessingMode) as [TZIPSubDirProcessingModeEnterprise, ...TZIPSubDirProcessingModeEnterprise[]])

export type TZIPSubDirProcessingMode = keyof typeof ZIPSubDirProcessingMode
export type TZIPSubDirProcessingModeEnterprise = `${ZIPSubDirProcessingMode}`

enum DynamicListSearchStringViewMode {
  Auto = "Авто",
  DontShow = "НеОтображать",
  Show = "Отображать",
  ShowOnUsingFullTextSearch = "ОтображатьПриИспользованииПолнотекстовогоПоиска",
}

export const ZDynamicListSearchStringViewMode = z.enum(Object.keys(DynamicListSearchStringViewMode) as [TDynamicListSearchStringViewMode, ...TDynamicListSearchStringViewMode[]])
export const ZDynamicListSearchStringViewModeEnterprise = z.enum(Object.values(DynamicListSearchStringViewMode) as [TDynamicListSearchStringViewModeEnterprise, ...TDynamicListSearchStringViewModeEnterprise[]])

export type TDynamicListSearchStringViewMode = keyof typeof DynamicListSearchStringViewMode
export type TDynamicListSearchStringViewModeEnterprise = `${DynamicListSearchStringViewMode}`

enum StatePresentation {
  Visible = "Видимость",
  AdditionalShowMode = "ДополнительныйРежимОтображения",
  Picture = "Картинка",
  Text = "Текст",
}

export const ZStatePresentation = z.enum(Object.keys(StatePresentation) as [TStatePresentation, ...TStatePresentation[]])
export const ZStatePresentationEnterprise = z.enum(Object.values(StatePresentation) as [TStatePresentationEnterprise, ...TStatePresentationEnterprise[]])

export type TStatePresentation = keyof typeof StatePresentation
export type TStatePresentationEnterprise = `${StatePresentation}`
