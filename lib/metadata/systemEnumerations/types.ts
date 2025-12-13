export type DynamicListSearchStringViewMode = "Auto" | "DontShow" | "Show" | "ShowOnUsingFullTextSearch"

export type DynamicListSearchStringViewModeEnterprise =
  | "Авто"
  | "НеОтображать"
  | "Отображать"
  | "ОтображатьПриИспользованииПолнотекстовогоПоиска"

export type XDTOFacetType =
  | "Length"
  | "MaxInclusive"
  | "MaxLength"
  | "MaxExclusive"
  | "MinInclusive"
  | "MinLength"
  | "MinExclusive"
  | "Pattern"
  | "Enumeration"
  | "Whitespace"
  | "TotalDigits"
  | "FractionDigits"

export type XDTOFacetTypeEnterprise =
  | "Длина"
  | "МаксВключающее"
  | "МаксДлина"
  | "МаксИсключающее"
  | "МинВключающее"
  | "МинДлина"
  | "МинИсключающее"
  | "Образец"
  | "Перечисление"
  | "ПробельныеСимволы"
  | "РазрядовВсего"
  | "РазрядовДробнойЧасти"

export type XMLForm = "Attribute" | "Text" | "Element"

export type XMLFormEnterprise = "Атрибут" | "Текст" | "Элемент"

export type WSParameterDirection = "In" | "InOut" | "Out"

export type WSParameterDirectionEnterprise = "Входной" | "ВходнойВыходной" | "Выходной"

export type DOMBuilderAction = "InsertBefore" | "InsertAfter" | "AppendAsChildren" | "Replace" | "ReplaceChildren"

export type DOMBuilderActionEnterprise =
  | "ВставитьПеред"
  | "ВставитьПосле"
  | "ДобавитьКакДочерние"
  | "Заменить"
  | "ЗаменитьДочерние"

export type DOMDocumentPosition =
  | "ImplementationSpecific"
  | "Disconnected"
  | "Preceding"
  | "Following"
  | "Contains"
  | "ContainedBy"

export type DOMDocumentPositionEnterprise =
  | "ЗависитОтРеализации"
  | "Отсоединен"
  | "Предшествует"
  | "Следует"
  | "Содержит"
  | "Содержится"

export type DOMNodeFilterParameters =
  | "ShowAttribute"
  | "ShowAll"
  | "ShowDocument"
  | "ShowProcessingInstruction"
  | "ShowComment"
  | "ShowNotation"
  | "ShowDocumentType"
  | "ShowCDATASection"
  | "ShowEntityReference"
  | "ShowEntity"
  | "ShowText"
  | "ShowDocumentFragment"
  | "ShowElement"

export type DOMNodeFilterParametersEnterprise =
  | "ОтображатьАтрибут"
  | "ОтображатьВсе"
  | "ОтображатьДокумент"
  | "ОтображатьИнструкциюОбработки"
  | "ОтображатьКомментарий"
  | "ОтображатьНотацию"
  | "ОтображатьОпределениеТипаДокумента"
  | "ОтображатьСекцииCDATA"
  | "ОтображатьСсылкуНаСущность"
  | "ОтображатьСущность"
  | "ОтображатьТекст"
  | "ОтображатьФрагментДокумента"
  | "ОтображатьЭлемент"

export type DOMNodeType =
  | "Attribute"
  | "Document"
  | "ProcessingInstruction"
  | "Comment"
  | "Notation"
  | "DocumentType"
  | "XPathNamespace"
  | "CDATASection"
  | "EntityReference"
  | "Entity"
  | "Text"
  | "DocumentFragment"
  | "Element"

export type DOMNodeTypeEnterprise =
  | "Атрибут"
  | "Документ"
  | "ИнструкцияОбработки"
  | "Комментарий"
  | "Нотация"
  | "ОпределениеТипаДокумента"
  | "ПространствоИменXPath"
  | "СекцияCDATA"
  | "СсылкаНаСущность"
  | "Сущность"
  | "Текст"
  | "ФрагментДокумента"
  | "Элемент"

export type DOMXPathResultType =
  | "Boolean"
  | "Any"
  | "AnyUnorderedNode"
  | "UnorderedNodeIterator"
  | "UnorderedNodeSnapshot"
  | "FirstOrderedNode"
  | "String"
  | "OrderedNodeIterator"
  | "OrderedNodeSnapshot"
  | "Number"

export type DOMXPathResultTypeEnterprise =
  | "Булево"
  | "Любой"
  | "ЛюбойНеупорядоченныйУзел"
  | "НеупорядоченныйИтераторУзлов"
  | "НеупорядоченныйСнимокУзлов"
  | "ПервыйУпорядоченныйУзел"
  | "Строка"
  | "УпорядоченныйИтераторУзлов"
  | "УпорядоченныйСнимокУзлов"
  | "Число"

export type HTMLContentCategory =
  | "AppletTags"
  | "AreaTags"
  | "EmbedTags"
  | "FrameTags"
  | "IframeTags"
  | "ImportAttributes"
  | "JavaScriptTags"
  | "LinkTags"
  | "NoembedTags"
  | "ObjectTags"
  | "SourceTags"
  | "StyleTags"
  | "W3IncludeAttributes"
  | "All"
  | "EventsHandlers"

export type HTMLContentCategoryEnterprise =
  | "AppletТеги"
  | "AreaТеги"
  | "EmbedТеги"
  | "FrameТеги"
  | "IframeТеги"
  | "ImportАтрибуты"
  | "JavaScriptТеги"
  | "LinkТеги"
  | "NoembedТеги"
  | "ObjectТеги"
  | "SourceТеги"
  | "StyleТеги"
  | "W3IncludeАтрибуты"
  | "Все"
  | "ОбработчикиСобытий"

export type DataCompositionAccountingBalanceType = "Debit" | "Credit" | "None"

export type DataCompositionAccountingBalanceTypeEnterprise = "Дебет" | "Кредит" | "Нет"

export type DataCompositionAreaTemplateType =
  | "Header"
  | "HierarchicalHeader"
  | "OverallHeader"
  | "OverallFooter"
  | "Footer"
  | "HierarchicalFooter"

export type DataCompositionAreaTemplateTypeEnterprise =
  | "Заголовок"
  | "ЗаголовокИерархии"
  | "ОбщийИтогЗаголовок"
  | "ОбщийИтогПодвал"
  | "Подвал"
  | "ПодвалИерархии"

export type DataCompositionAttributesPlacement = "Together" | "WithOwnerField" | "SpecialPosition" | "Separately"

export type DataCompositionAttributesPlacementEnterprise =
  | "Вместе"
  | "ВместеСВладельцем"
  | "ВСпециальнойПозиции"
  | "Отдельно"

export type DataCompositionBalanceType = "ClosingBalance" | "OpeningBalance" | "None"

export type DataCompositionBalanceTypeEnterprise = "КонечныйОстаток" | "НачальныйОстаток" | "Нет"

export type DataCompositionChartLegendPlacement = "Top" | "Left" | "None" | "Bottom" | "Right"

export type DataCompositionChartLegendPlacementEnterprise = "Верх" | "Лево" | "Нет" | "Низ" | "Право"

export type DataCompositionComparisonType =
  | "Greater"
  | "GreaterOrEqual"
  | "InHierarchy"
  | "InList"
  | "InListByHierarchy"
  | "Filled"
  | "Less"
  | "LessOrEqual"
  | "BeginsWith"
  | "NotInHierarchy"
  | "NotInList"
  | "NotInListByHierarchy"
  | "NotFilled"
  | "NotBeginsWith"
  | "NotLike"
  | "NotEqual"
  | "NotContains"
  | "Like"
  | "Equal"
  | "Contains"

export type DataCompositionComparisonTypeEnterprise =
  | "Больше"
  | "БольшеИлиРавно"
  | "ВИерархии"
  | "ВСписке"
  | "ВСпискеПоИерархии"
  | "Заполнено"
  | "Меньше"
  | "МеньшеИлиРавно"
  | "НачинаетсяС"
  | "НеВИерархии"
  | "НеВСписке"
  | "НеВСпискеПоИерархии"
  | "НеЗаполнено"
  | "НеНачинаетсяС"
  | "НеПодобно"
  | "НеРавно"
  | "НеСодержит"
  | "Подобно"
  | "Равно"
  | "Содержит"

export type DataCompositionConditionalAppearanceUse = "Use" | "DontUse"

export type DataCompositionConditionalAppearanceUseEnterprise = "Использовать" | "НеИспользовать"

export type DataCompositionDataSetsLinkType = "Outer" | "Inner"

export type DataCompositionDataSetsLinkTypeEnterprise = "Внешняя" | "Внутренняя"

export type DataCompositionDetailsProcessingAction =
  | "None"
  | "OpenValue"
  | "Filter"
  | "ApplyAppearance"
  | "DrillDown"
  | "Group"
  | "Order"

export type DataCompositionDetailsProcessingActionEnterprise =
  | "Нет"
  | "ОткрытьЗначение"
  | "Отфильтровать"
  | "Оформить"
  | "Расшифровать"
  | "Сгруппировать"
  | "Упорядочить"

export type DataCompositionFieldPlacement = "Auto" | "Vertically" | "Together" | "Horizontally" | "SpecialColumn"

export type DataCompositionFieldPlacementEnterprise =
  | "Авто"
  | "Вертикально"
  | "Вместе"
  | "Горизонтально"
  | "ОтдельнаяКолонка"

export type DataCompositionFieldsTitleType = "Auto" | "Short" | "Full"

export type DataCompositionFieldsTitleTypeEnterprise = "Авто" | "Краткий" | "Полный"

export type DataCompositionFilterApplicationType = "Hierarchy" | "HierarchyOnly" | "Items"

export type DataCompositionFilterApplicationTypeEnterprise = "Иерархия" | "ТолькоИерархия" | "Элементы"

export type DataCompositionFilterItemsGroupType = "AndGroup" | "OrGroup" | "NotGroup"

export type DataCompositionFilterItemsGroupTypeEnterprise = "ГруппаИ" | "ГруппаИли" | "ГруппаНе"

export type DataCompositionFixation = "Auto" | "DontUse"

export type DataCompositionFixationEnterprise = "Авто" | "НеИспользовать"

export type DataCompositionGroupFieldsPlacement = "Together" | "Separately" | "SeparatelyAndInTotalsOnly"

export type DataCompositionGroupFieldsPlacementEnterprise = "Вместе" | "Отдельно" | "ОтдельноИТолькоВИтогах"

export type DataCompositionGroupPlacement = "End" | "Begin" | "BeginAndEnd" | "None"

export type DataCompositionGroupPlacementEnterprise = "Конец" | "Начало" | "НачалоИКонец" | "Нет"

export type DataCompositionGroupTemplateType = "Auto" | "Vertical" | "Horizontal"

export type DataCompositionGroupTemplateTypeEnterprise = "Авто" | "Вертикальный" | "Горизонтальный"

export type DataCompositionGroupType = "Hierarchy" | "HierarchyOnly" | "Items"

export type DataCompositionGroupTypeEnterprise = "Иерархия" | "ТолькоИерархия" | "Элементы"

export type DataCompositionGroupUseVariant = "Auto" | "AdditionalInformation"

export type DataCompositionGroupUseVariantEnterprise = "Авто" | "ДополнительнаяИнформация"

export type DataCompositionParameterUse = "Auto" | "Always"

export type DataCompositionParameterUseEnterprise = "Авто" | "Всегда"

export type DataCompositionPeriodAdditionType =
  | "None"
  | "Year"
  | "YearSinceBeginOfPeriod"
  | "YearSinceBeginOfPeriod445"
  | "TenDays"
  | "Day"
  | "DaySinceBeginOfPeriod"
  | "Quarter"
  | "QuarterSinceBeginOfPeriod"
  | "QuarterSinceBeginOfPeriod445"
  | "Month"
  | "MonthSinceBeginOfPeriod"
  | "MonthSinceBeginOfPeriod445"
  | "Minute"
  | "MinuteSinceBeginOfPeriod"
  | "Week"
  | "WeekSinceBeginOfPeriod"
  | "HalfYear"
  | "HalfYearSinceBeginOfPeriod"
  | "HalfYearSinceBeginOfPeriod445"
  | "Second"
  | "Hour"
  | "HourSinceBeginOfPeriod"

export type DataCompositionPeriodAdditionTypeEnterprise =
  | "БезДополнения"
  | "Год"
  | "ГодОтНачалаПериода"
  | "ГодОтНачалаПериода445"
  | "Декада"
  | "День"
  | "ДеньОтНачалаПериода"
  | "Квартал"
  | "КварталОтНачалаПериода"
  | "КварталОтНачалаПериода445"
  | "Месяц"
  | "МесяцОтНачалаПериода"
  | "МесяцОтНачалаПериода445"
  | "Минута"
  | "МинутаОтНачалаПериода"
  | "Неделя"
  | "НеделяОтНачалаПериода"
  | "Полугодие"
  | "ПолугодиеОтНачалаПериода"
  | "ПолугодиеОтНачалаПериода445"
  | "Секунда"
  | "Час"
  | "ЧасОтНачалаПериода"

export type DataCompositionPeriodType = "Additional" | "Main"

export type DataCompositionPeriodTypeEnterprise = "Дополнительный" | "Основной"

export type DataCompositionPictureOutputType = "Auto" | "OutputByValue" | "OutputByRef" | "DontOutput"

export type DataCompositionPictureOutputTypeEnterprise =
  | "Авто"
  | "ВыводитьПоЗначению"
  | "ВыводитьПоСсылке"
  | "НеВыводить"

export type DataCompositionResourcesAutoPosition = "DontUse" | "AfterAllFields"

export type DataCompositionResourcesAutoPositionEnterprise = "НеИспользовать" | "ПослеВсехПолей"

export type DataCompositionResourcesPlacement = "Vertically" | "Horizontally"

export type DataCompositionResourcesPlacementEnterprise = "Вертикально" | "Горизонтально"

export type DataCompositionResourcesPlacementInChart = "Auto" | "Series" | "Points"

export type DataCompositionResourcesPlacementInChartEnterprise = "Авто" | "Серии" | "Точки"

export type DataCompositionResultItemType = "End" | "Begin" | "BeginAndEnd"

export type DataCompositionResultItemTypeEnterprise = "Конец" | "Начало" | "НачалоИКонец"

export type DataCompositionResultNestedItemsLayout = "Vertically" | "Horizontally"

export type DataCompositionResultNestedItemsLayoutEnterprise = "Вертикально" | "Горизонтально"

export type DataCompositionSettingsItemState = "Enabled" | "Disabled" | "DeletedByUser"

export type DataCompositionSettingsItemStateEnterprise = "Включен" | "Отключен" | "УдаленПользователем"

export type DataCompositionSettingsItemViewMode = "Auto" | "QuickAccess" | "Inaccessible" | "Normal"

export type DataCompositionSettingsItemViewModeEnterprise = "Авто" | "БыстрыйДоступ" | "Недоступный" | "Обычный"

export type DataCompositionSettingsRefreshMethod = "Full" | "CheckAvailability"

export type DataCompositionSettingsRefreshMethodEnterprise = "Полное" | "ПроверятьДоступность"

export type DataCompositionSettingsViewMode = "QuickAccess" | "All"

export type DataCompositionSettingsViewModeEnterprise = "БыстрыйДоступ" | "Все"

export type DataCompositionSortDirection = "Asc" | "Desc"

export type DataCompositionSortDirectionEnterprise = "Возр" | "Убыв"

export type DataCompositionTextOutputType = "Auto" | "Output" | "DontOutput"

export type DataCompositionTextOutputTypeEnterprise = "Авто" | "Выводить" | "НеВыводить"

export type DataCompositionTextPlacementType = "Overflow" | "Block" | "Cut" | "Wrap"

export type DataCompositionTextPlacementTypeEnterprise = "Выступать" | "Забивать" | "Обрезать" | "Переносить"

export type DataCompositionTotalPlacement = "Auto" | "End" | "Begin" | "BeginAndEnd" | "None"

export type DataCompositionTotalPlacementEnterprise = "Авто" | "Конец" | "Начало" | "НачалоИКонец" | "Нет"

export type OnUnavailabilityDataCompositionSettingsAction = "DisableControl" | "HidePage"

export type OnUnavailabilityDataCompositionSettingsActionEnterprise = "ИзменятьДоступностьПоля" | "СкрыватьСтраницу"

export type ResultCompositionMode = "Auto" | "Directly" | "Background"

export type ResultCompositionModeEnterprise = "Авто" | "Непосредственно" | "Фоновый"

export type SaveDataCompositionAppearance = "Auto" | "ForUser" | "ForCurrentResult" | "DontUse" | "ByKeyForUser"

export type SaveDataCompositionAppearanceEnterprise =
  | "Авто"
  | "ДляПользователя"
  | "ДляТекущегоРезультата"
  | "НеИспользовать"
  | "ПоКлючуДляПользователя"

export type XSAttributeUseCategory = "Prohibited" | "Optional" | "Required"

export type XSAttributeUseCategoryEnterprise = "Запрещено" | "Необязательно" | "Обязательно"

export type XSComplexFinal = "All" | "Restriction" | "Extension"

export type XSComplexFinalEnterprise = "Все" | "Ограничение" | "Расширение"

export type XSComponentType =
  | "Annotation"
  | "Include"
  | "ModelGroup"
  | "Documentation"
  | "Import"
  | "AppInfo"
  | "AttributeUse"
  | "MaxInclusiveFacet"
  | "MaxExclusiveFacet"
  | "Wildcard"
  | "MinInclusiveFacet"
  | "MinExclusiveFacet"
  | "AttributeDeclaration"
  | "NotationDeclaration"
  | "ElementDeclaration"
  | "XPathDefinition"
  | "AttributeGroupDefinition"
  | "ModelGroupDefinition"
  | "IdentityConstraintDefinition"
  | "SimpleTypeDefinition"
  | "ComplexTypeDefinition"
  | "Redefine"
  | "Schema"
  | "LengthFacet"
  | "FractionDigitsFacet"
  | "MaxLengthFacet"
  | "MinLengthFacet"
  | "PatternFacet"
  | "TotalDigitsFacet"
  | "EnumerationFacet"
  | "WhitespaceFacet"
  | "Particle"

export type XSComponentTypeEnterprise =
  | "Аннотация"
  | "Включение"
  | "ГруппаМодели"
  | "Документация"
  | "Импорт"
  | "ИнформацияПриложения"
  | "ИспользованиеАтрибута"
  | "МаксимальноВключающийФасет"
  | "МаксимальноИсключающийФасет"
  | "Маска"
  | "МинимальноВключающийФасет"
  | "МинимальноИсключающийФасет"
  | "ОбъявлениеАтрибута"
  | "ОбъявлениеНотации"
  | "ОбъявлениеЭлемента"
  | "ОпределениеXPath"
  | "ОпределениеГруппыАтрибутов"
  | "ОпределениеГруппыМодели"
  | "ОпределениеОграниченияИдентичности"
  | "ОпределениеПростогоТипа"
  | "ОпределениеСоставногоТипа"
  | "Переопределение"
  | "Схема"
  | "ФасетДлины"
  | "ФасетКоличестваРазрядовДробнойЧасти"
  | "ФасетМаксимальнойДлины"
  | "ФасетМинимальнойДлины"
  | "ФасетОбразца"
  | "ФасетОбщегоКоличестваРазрядов"
  | "ФасетПеречисления"
  | "ФасетПробельныхСимволов"
  | "Фрагмент"

export type XSCompositor = "All" | "Choice" | "Sequence"

export type XSCompositorEnterprise = "Все" | "Выбор" | "Последовательность"

export type XSConstraint = "Default" | "Fixed"

export type XSConstraintEnterprise = "ПоУмолчанию" | "Фиксированное"

export type XSContentModel = "Simple" | "Complex"

export type XSContentModelEnterprise = "Простая" | "Составная"

export type XSDerivationMethod = "Restriction" | "Extension"

export type XSDerivationMethodEnterprise = "Ограничение" | "Расширение"

export type XSDisallowedSubstitutions = "All" | "Restriction" | "Substitution" | "Extension"

export type XSDisallowedSubstitutionsEnterprise = "Все" | "Ограничение" | "Подстановка" | "Расширение"

export type XSForm = "Qualified" | "Unqualified"

export type XSFormEnterprise = "Квалифицированная" | "Неквалифицированная"

export type XSIdentityConstraintCategory = "Key" | "KeyRef" | "Unique"

export type XSIdentityConstraintCategoryEnterprise = "Ключ" | "СсылкаНаКлюч" | "Уникальность"

export type XSNamespaceConstraintCategory = "Not" | "Any" | "Set"

export type XSNamespaceConstraintCategoryEnterprise = "Кроме" | "Любое" | "Набор"

export type XSProcessContents = "Skip" | "Lax" | "Strict"

export type XSProcessContentsEnterprise = "Пропустить" | "Слабая" | "Строгая"

export type XSProhibitedSubstitutions = "All" | "Restriction" | "Extension"

export type XSProhibitedSubstitutionsEnterprise = "Все" | "Ограничение" | "Расширение"

export type XSSchemaFinal = "All" | "Union" | "Restriction" | "Extension" | "List"

export type XSSchemaFinalEnterprise = "Все" | "Объединение" | "Ограничение" | "Расширение" | "Список"

export type XSSimpleFinal = "All" | "Union" | "Restriction" | "List"

export type XSSimpleFinalEnterprise = "Все" | "Объединение" | "Ограничение" | "Список"

export type XSSimpleTypeVariety = "Atomic" | "Union" | "List"

export type XSSimpleTypeVarietyEnterprise = "Атомарная" | "Объединение" | "Список"

export type XSSubstitutionGroupExclusions = "All" | "Restriction" | "Extension"

export type XSSubstitutionGroupExclusionsEnterprise = "Все" | "Ограничение" | "Расширение"

export type XSWhitespaceHandling = "Replace" | "Collapse" | "Preserve"

export type XSWhitespaceHandlingEnterprise = "Заменять" | "Сворачивать" | "Сохранять"

export type XSXPathVariety = "Field" | "Selector"

export type XSXPathVarietyEnterprise = "Поле" | "Селектор"

export type EventLogDataStorageSplitPeriod = "Year" | "Day" | "Quarter" | "Month" | "Week" | "DontUse" | "Hour"

export type EventLogDataStorageSplitPeriodEnterprise =
  | "Год"
  | "День"
  | "Квартал"
  | "Месяц"
  | "Неделя"
  | "НеИспользовать"
  | "Час"

export type EventLogEntryTransactionMode = "Independent" | "Transactional"

export type EventLogEntryTransactionModeEnterprise = "Независимая" | "Транзакционная"

export type EventLogEntryTransactionStatus = "Committed" | "Unfinished" | "NotApplicable" | "RolledBack"

export type EventLogEntryTransactionStatusEnterprise = "Зафиксирована" | "НеЗавершена" | "НетТранзакции" | "Отменена"

export type EventLogLevel = "Information" | "Error" | "Warning" | "Note"

export type EventLogLevelEnterprise = "Информация" | "Ошибка" | "Предупреждение" | "Примечание"

export type DataLockControlMode = "Automatic" | "Managed"

export type DataLockControlModeEnterprise = "Автоматический" | "Управляемый"

export type DataLockMode = "Exclusive" | "Shared"

export type DataLockModeEnterprise = "Исключительный" | "Разделяемый"

export type AccountType = "ActivePassive" | "Active" | "Passive"

export type AccountTypeEnterprise = "АктивноПассивный" | "Активный" | "Пассивный"

export type AccountingRecordType = "Debit" | "Credit"

export type AccountingRecordTypeEnterprise = "Дебет" | "Кредит"

export type AccumulationRecordType = "Receipt" | "Expense"

export type AccumulationRecordTypeEnterprise = "Приход" | "Расход"

export type AccumulationRegisterAggregatePeriodicity =
  | "Auto"
  | "Year"
  | "Day"
  | "Quarter"
  | "Month"
  | "Nonperiodical"
  | "HalfYear"

export type AccumulationRegisterAggregatePeriodicityEnterprise =
  | "Авто"
  | "Год"
  | "День"
  | "Квартал"
  | "Месяц"
  | "Непериодический"
  | "Полугодие"

export type AccumulationRegisterAggregateUse = "Auto" | "Always"

export type AccumulationRegisterAggregateUseEnterprise = "Авто" | "Всегда"

export type AutoTimeMode = "DontUse" | "First" | "Last" | "CurrentOrFirst" | "CurrentOrLast"

export type AutoTimeModeEnterprise =
  | "НеИспользовать"
  | "Первым"
  | "Последним"
  | "ТекущееИлиПервым"
  | "ТекущееИлиПоследним"

export type BusinessProcessRoutePointType =
  | "SubBusinessProcess"
  | "Switch"
  | "Activity"
  | "End"
  | "Processing"
  | "Split"
  | "Join"
  | "Start"
  | "Condition"

export type BusinessProcessRoutePointTypeEnterprise =
  | "ВложенныйБизнесПроцесс"
  | "ВыборВарианта"
  | "Действие"
  | "Завершение"
  | "Обработка"
  | "Разделение"
  | "Слияние"
  | "Старт"
  | "Условие"

export type CalculationRegisterPeriodType = "BasePeriod" | "ActionPeriod" | "RegistrationPeriod" | "ActualActionPeriod"

export type CalculationRegisterPeriodTypeEnterprise =
  | "БазовыйПериод"
  | "ПериодДействия"
  | "ПериодРегистрации"
  | "ФактическийПериодДействия"

export type DocumentPostingMode = "Regular" | "RealTime"

export type DocumentPostingModeEnterprise = "Неоперативный" | "Оперативный"

export type DocumentWriteMode = "Write" | "UndoPosting" | "Posting"

export type DocumentWriteModeEnterprise = "Запись" | "ОтменаПроведения" | "Проведение"

export type FoldersAndItemsUse = "Folders" | "FoldersAndItems" | "Items"

export type FoldersAndItemsUseEnterprise = "Группы" | "ГруппыИЭлементы" | "Элементы"

export type PostingModeUse = "Auto" | "Regular" | "RealTime"

export type PostingModeUseEnterprise = "Авто" | "Неоперативный" | "Оперативный"

export type SliceUse = "DontUse" | "First" | "Last"

export type SliceUseEnterprise = "НеИспользовать" | "Первые" | "Последние"

export type BackgroundJobState = "Active" | "Completed" | "Failed" | "Canceled"

export type BackgroundJobStateEnterprise = "Активно" | "Завершено" | "ЗавершеноАварийно" | "Отменено"

export type CryptoCertificateCheckMode =
  | "IgnoreTimeValidity"
  | "IgnoreSignatureValidity"
  | "IgnoreCertificateRevocationStatus"
  | "AllowTestCertificates"

export type CryptoCertificateCheckModeEnterprise =
  | "ИгнорироватьВремяДействия"
  | "ИгнорироватьДействительностьПодписи"
  | "ИгнорироватьПроверкуВСпискеОтозванныхСертификатов"
  | "РазрешитьТестовыеСертификаты"

export type CryptoCertificateIncludeMode =
  | "IncludeWholeChain"
  | "IncludeSubjectCertificate"
  | "IncludeChainWithoutRoot"
  | "DontInclude"

export type CryptoCertificateIncludeModeEnterprise =
  | "ВключатьПолнуюЦепочку"
  | "ВключатьСертификатСубъекта"
  | "ВключатьЦепочкуБезКорневого"
  | "НеВключать"

export type CryptoCertificateStorePlacement = "ComputerData" | "OSUserData" | "ApplicationData"

export type CryptoCertificateStorePlacementEnterprise = "ДанныеКомпьютера" | "ДанныеПользователяОС" | "ДанныеПриложения"

export type CryptoCertificateStoreType =
  | "RootCertificates"
  | "PersonalCertificates"
  | "RecipientCertificates"
  | "CertificationAuthorityCertificates"

export type CryptoCertificateStoreTypeEnterprise =
  | "КорневыеСертификаты"
  | "ПерсональныеСертификаты"
  | "СертификатыПолучателей"
  | "СертификатыУдостоверяющихЦентров"

export type CryptoInteractiveModeUse = "Use" | "DontUse"

export type CryptoInteractiveModeUseEnterprise = "Использовать" | "НеИспользовать"

export type FormattedDocumentFileType = "ANSITXT" | "HTML" | "PDF" | "TXT"

export type FormattedDocumentFileTypeEnterprise = "ANSITXT" | "HTML" | "PDF" | "TXT"

export type FormattedDocumentParagraphType = "BulletedList" | "NumberedList" | "Usual"

export type FormattedDocumentParagraphTypeEnterprise = "МаркированныйСписок" | "НумерованныйСписок" | "Обычный"

export type RowGotoDirection = "Up" | "Down"

export type RowGotoDirectionEnterprise = "Вверх" | "Вниз"

export type InternetMailAttachmentEncodingMode = "MIME" | "UUEncode"

export type InternetMailAttachmentEncodingModeEnterprise = "MIME" | "UUEncode"

export type InternetMailMessageImportance = "High" | "Highest" | "Lowest" | "Low" | "Normal"

export type InternetMailMessageImportanceEnterprise = "Высокая" | "Наивысшая" | "Наименьшая" | "Низкая" | "Обычная"

export type InternetMailMessageNonASCIISymbolsEncodingMode = "MIME" | "QuotedPrintable" | "None"

export type InternetMailMessageNonASCIISymbolsEncodingModeEnterprise = "MIME" | "QuotedPrintable" | "БезКодирования"

export type InternetMailMessageParseStatus = "ErrorsDetected" | "ErrorsNotDetected"

export type InternetMailMessageParseStatusEnterprise = "ОбнаруженыОшибки" | "ОшибокНеОбнаружено"

export type InternetMailProtocol = "IMAP" | "POP3" | "SMTP"

export type InternetMailProtocolEnterprise = "IMAP" | "POP3" | "SMTP"

export type InternetMailTextProcessing = "DontProcess" | "Process"

export type InternetMailTextProcessingEnterprise = "НеОбрабатывать" | "Обрабатывать"

export type InternetMailTextType = "HTML" | "CustomText" | "PlainText" | "RichText"

export type InternetMailTextTypeEnterprise = "HTML" | "ПроизвольныйТекст" | "ПростойТекст" | "РазмеченныйТекст"

export type POP3AuthenticationMode = "APOP" | "CramMD5" | "General"

export type POP3AuthenticationModeEnterprise = "APOP" | "CramMD5" | "Обычная"

export type SMTPAuthenticationMode = "CramMD5" | "Login" | "Plain" | "None" | "Default"

export type SMTPAuthenticationModeEnterprise = "CramMD5" | "Login" | "Plain" | "БезАутентификации" | "ПоУмолчанию"

export type UseInternetMailTokenAuthentication = "Auto" | "Use" | "DontUse"

export type UseInternetMailTokenAuthenticationEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type QueryBuilderDimensionType = "Hierarchy" | "HierarchyOnly" | "Items"

export type QueryBuilderDimensionTypeEnterprise = "Иерархия" | "ТолькоИерархия" | "Элементы"

export type AddInConnectionType = "Isolated" | "NotIsolated"

export type AddInConnectionTypeEnterprise = "Изолированно" | "НеИзолированно"

export type AddInType = "COM" | "Native"

export type AddInTypeEnterprise = "COM" | "Native"

export type AllowedLength = "Variable" | "Fixed"

export type AllowedLengthEnterprise = "Переменная" | "Фиксированная"

export type AllowedSign = "Any" | "Nonnegative"

export type AllowedSignEnterprise = "Любой" | "Неотрицательный"

export type ApplicationFormsOpenningMode = "Tabs" | "SingleWindows"

export type ApplicationFormsOpenningModeEnterprise = "Закладки" | "ОтдельныеОкна"

export type BorderType = "Absolute" | "StyleItem"

export type BorderTypeEnterprise = "Абсолютная" | "ЭлементСтиля"

export type BoundaryType = "Including" | "Excluding"

export type BoundaryTypeEnterprise = "Включая" | "Исключая"

export type ByteOrderMarkUse = "Auto" | "Use" | "DontUse"

export type ByteOrderMarkUseEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type ClientApplicationBaseFontVariant = "Large" | "Normal"

export type ClientApplicationBaseFontVariantEnterprise = "Крупный" | "Обычный"

export type ClientApplicationFormScaleVariant = "Auto" | "Compact" | "Normal"

export type ClientApplicationFormScaleVariantEnterprise = "Авто" | "Компактный" | "Обычный"

export type ClientApplicationInterfaceVariant = "Version8_2" | "Taxi"

export type ClientApplicationInterfaceVariantEnterprise = "Версия8_2" | "Такси"

export type ClientApplicationType =
  | "WebClient"
  | "ExternalConnection"
  | "MobileAppClient"
  | "MobileClient"
  | "ThickClient"
  | "ThinClient"

export type ClientApplicationTypeEnterprise =
  | "ВебКлиент"
  | "ВнешнееСоединение"
  | "МобильноеПриложениеКлиент"
  | "МобильныйКлиент"
  | "ТолстыйКлиент"
  | "ТонкийКлиент"

export type ClientConnectionSpeed = "Low" | "Normal"

export type ClientConnectionSpeedEnterprise = "Низкая" | "Обычная"

export type ClientRunMode = "Auto" | "OrdinaryApplication" | "ManagedApplication"

export type ClientRunModeEnterprise = "Авто" | "ОбычноеПриложение" | "УправляемоеПриложение"

export type ColorType = "WebColor" | "WindowsColor" | "Absolute" | "AutoColor" | "StyleItem"

export type ColorTypeEnterprise = "WebЦвет" | "WindowsЦвет" | "Абсолютный" | "АвтоЦвет" | "ЭлементСтиля"

export type ComparisonType =
  | "Greater"
  | "GreaterOrEqual"
  | "InHierarchy"
  | "InList"
  | "InListByHierarchy"
  | "Interval"
  | "IntervalIncludingBounds"
  | "IntervalIncludingLowerBound"
  | "IntervalIncludingUpperBound"
  | "Less"
  | "LessOrEqual"
  | "NotInHierarchy"
  | "NotInList"
  | "NotInListByHierarchy"
  | "NotEqual"
  | "NotContains"
  | "Equal"
  | "Contains"

export type ComparisonTypeEnterprise =
  | "Больше"
  | "БольшеИлиРавно"
  | "ВИерархии"
  | "ВСписке"
  | "ВСпискеПоИерархии"
  | "Интервал"
  | "ИнтервалВключаяГраницы"
  | "ИнтервалВключаяНачало"
  | "ИнтервалВключаяОкончание"
  | "Меньше"
  | "МеньшеИлиРавно"
  | "НеВИерархии"
  | "НеВСписке"
  | "НеВСпискеПоИерархии"
  | "НеРавно"
  | "НеСодержит"
  | "Равно"
  | "Содержит"

export type CompositeWordsSeparationMode = "Auto" | "Use" | "DontUse"

export type CompositeWordsSeparationModeEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type ConfigurationExtensionApplicationIssueSeverity = "Critical" | "Low" | "Moderate"

export type ConfigurationExtensionApplicationIssueSeverityEnterprise = "Критичная" | "Низкая" | "Обычная"

export type ConfigurationExtensionScope = "InfoBase" | "DataSeparation"

export type ConfigurationExtensionScopeEnterprise = "ИнформационнаяБаза" | "РазделениеДанных"

export type ConfigurationExtensionsSource = "Database" | "SessionApplied" | "SessionDisabled"

export type ConfigurationExtensionsSourceEnterprise = "БазаДанных" | "СеансАктивные" | "СеансОтключенные"

export type DataBaseConfigurationUpdateExecutionInformationItemType = "Information" | "Error" | "Warning"

export type DataBaseConfigurationUpdateExecutionInformationItemTypeEnterprise =
  | "Информация"
  | "Ошибка"
  | "Предупреждение"

export type DataBaseConfigurationUpdateState = "RefreshInProgress" | "ProcessingInProgress" | "NotActive"

export type DataBaseConfigurationUpdateStateEnterprise =
  | "ВыполняетсяАктуализация"
  | "ВыполняетсяОбработка"
  | "Неактивно"

export type DatabaseTablespacesUseMode = "Use" | "DontUse"

export type DatabaseTablespacesUseModeEnterprise = "Использовать" | "НеИспользовать"

export type DateFractions = "Time" | "Date" | "DateTime"

export type DateFractionsEnterprise = "Время" | "Дата" | "ДатаВремя"

export type DialogReturnCode = "Yes" | "No" | "OK" | "Cancel" | "Retry" | "Abort" | "Ignore" | "Timeout"

export type DialogReturnCodeEnterprise =
  | "Да"
  | "Нет"
  | "ОК"
  | "Отмена"
  | "Повторить"
  | "Прервать"
  | "Пропустить"
  | "Таймаут"

export type DynamicListKeyType = "Auto" | "FieldValue" | "RowKey" | "RowNumber"

export type DynamicListKeyTypeEnterprise = "Авто" | "ЗначениеПоля" | "КлючСтроки" | "НомерСтроки"

export type EnterKeyBehaviorType = "DefaultButton" | "ControlNavigation"

export type EnterKeyBehaviorTypeEnterprise = "КнопкаПоУмолчанию" | "ПереходПоЭлементамФормы"

export type ExternalDataSourceState = "Disconnected" | "Connected"

export type ExternalDataSourceStateEnterprise = "Отключен" | "Подключен"

export type FillChecking = "ShowError" | "DontCheck"

export type FillCheckingEnterprise = "ВыдаватьОшибку" | "НеПроверять"

export type FontType = "WindowsFont" | "Absolute" | "AutoFont" | "StyleItem"

export type FontTypeEnterprise = "WindowsШрифт" | "Абсолютный" | "АвтоШрифт" | "ЭлементСтиля"

export type FullTextSearchMetadataUse = "Use" | "DontUse"

export type FullTextSearchMetadataUseEnterprise = "Использовать" | "НеИспользовать"

export type FullTextSearchMode = "Disable" | "Enable"

export type FullTextSearchModeEnterprise = "Запретить" | "Разрешить"

export type FullTextSearchRepresentationType = "HTMLText" | "XML"

export type FullTextSearchRepresentationTypeEnterprise = "HTMLТекст" | "XML"

export type FullTextSearchVersion = "Version1" | "Version2"

export type FullTextSearchVersionEnterprise = "Версия1" | "Версия2"

export type HashFunction = "CRC32" | "MD5" | "PBKDF2SHA256" | "SHA1" | "SHA256" | "SHA512"

export type HashFunctionEnterprise = "CRC32" | "MD5" | "PBKDF2SHA256" | "SHA1" | "SHA256" | "SHA512"

export type InterfaceCompatibilityMode = "Version8_2" | "Version8_2EnableTaxi" | "Taxi" | "TaxiEnableVersion8_2"

export type InterfaceCompatibilityModeEnterprise =
  | "Версия8_2"
  | "Версия8_2РазрешитьТакси"
  | "Такси"
  | "ТаксиРазрешитьВерсия8_2"

export type IntervalBoundVariant =
  | "WithoutRestriction"
  | "Year"
  | "Quarter"
  | "SpecificDate"
  | "Month"
  | "Week"
  | "WorkingDate"
  | "BeforeAfter"

export type IntervalBoundVariantEnterprise =
  | "БезОграничения"
  | "Год"
  | "Квартал"
  | "КонкретнаяДата"
  | "Месяц"
  | "Неделя"
  | "РабочаяДата"
  | "Смещение"

export type Key =
  | "BackSpace"
  | "Break"
  | "NumAdd"
  | "NumDecimal"
  | "NumDivide"
  | "NumMultiply"
  | "NumSubtract"
  | "Space"
  | "None"

export type KeyEnterprise =
  | "BackSpace"
  | "Break"
  | "NumAdd"
  | "NumDecimal"
  | "NumDivide"
  | "NumMultiply"
  | "NumSubtract"
  | "Space"
  | "Нет"

export type LocationRelativeToGeofence = "Inside" | "Outside"

export type LocationRelativeToGeofenceEnterprise = "Внутри" | "Снаружи"

export type MessageStatus = "WithoutStatus" | "Important" | "Attention" | "Information" | "Ordinary" | "VeryImportant"

export type MessageStatusEnterprise = "БезСтатуса" | "Важное" | "Внимание" | "Информация" | "Обычное" | "ОченьВажное"

export type MobileApplicationFunctionalities =
  | "BluetoothPrinters"
  | "NFC"
  | "PushNotifications"
  | "WiFiPrinters"
  | "AutoSendSMS"
  | "MusicLibrary"
  | "PictureAndVideoLibraries"
  | "Biometrics"
  | "Videoconferences"
  | "AudioPlaybackAndVibration"
  | "BackgroundAudioPlaybackAndVibration"
  | "InAppPurchases"
  | "IncomingShareRequests"
  | "Geofences"
  | "Location"
  | "BackgroundLocation"
  | "AllFilesAccess"
  | "SMSLog"
  | "CallLog"
  | "BackgroundAudioRecording"
  | "Calendars"
  | "Camera"
  | "Contacts"
  | "LocalNotifications"
  | "Microphone"
  | "NumberDialing"
  | "PersonalComputerFileExchange"
  | "AllIncomingShareRequestsTypesProcessing"
  | "CallProcessing"
  | "ReceiveSMS"
  | "SpeechToText"
  | "OSBackup"
  | "Ads"
  | "TextToSpeech"
  | "DocumentScanning"
  | "BarcodeScanning"
  | "ApplicationUsageStatistics"
  | "InstallPackages"

export type MobileApplicationFunctionalitiesEnterprise =
  | "BluetoothПринтеры"
  | "NFC"
  | "PushУведомления"
  | "WiFiПринтеры"
  | "АвтоматическаяОтправкаSMSСообщений"
  | "БиблиотекаМузыки"
  | "БиблиотекиКартинокИВидео"
  | "Биометрия"
  | "Видеоконференции"
  | "ВоспроизведениеАудиоИВибрация"
  | "ВоспроизведениеАудиоИВибрацияВФоновомРежиме"
  | "ВстроенныеПокупки"
  | "ВходящиеЗапросыПоделиться"
  | "Геозоны"
  | "Геопозиционирование"
  | "ГеопозиционированиеВФоновомРежиме"
  | "ДоступКоВсемФайлам"
  | "ЖурналSMS"
  | "ЖурналЗвонков"
  | "ЗаписьАудиоВФоновомРежиме"
  | "Календари"
  | "Камера"
  | "Контакты"
  | "ЛокальныеУведомления"
  | "Микрофон"
  | "НаборНомера"
  | "ОбменФайламиСПерсональнымКомпьютером"
  | "ОбработкаВсехТиповВходящихЗапросовПоделиться"
  | "ОбработкаЗвонков"
  | "ПолучениеSMS"
  | "РаспознаваниеРечи"
  | "РезервноеКопированиеСредствамиОС"
  | "Реклама"
  | "СинтезРечи"
  | "СканированиеДокументов"
  | "СканированиеШтрихКодов"
  | "СтатистикаИспользованияПриложения"
  | "УстановкаПриложений"

export type NumericValueType = "Cardinal" | "Ordinal"

export type NumericValueTypeEnterprise = "Количественное" | "Порядковое"

export type PasswordPolicyComplianceCheckResult =
  | "DoesNotSatisfyMinLengthRequirements"
  | "DoesNotSatisfyReuseLimitRequirements"
  | "DoesNotSatisfyCompromiseCheckRequirements"
  | "DoesNotSatisfyComplexityRequirements"

export type PasswordPolicyComplianceCheckResultEnterprise =
  | "НеСоответствуетТребованиямМинимальнойДлины"
  | "НеСоответствуетТребованиямОграниченияПовторенияСредиПоследних"
  | "НеСоответствуетТребованиямПроверкиРаскрытия"
  | "НеСоответствуетТребованиямСложности"

export type PeriodSettingsVariant = "Interval" | "Period"

export type PeriodSettingsVariantEnterprise = "Интервал" | "Период"

export type PeriodVariant =
  | "Year"
  | "Day"
  | "DayFromBegOfYear"
  | "DayFromBegOfQuarter"
  | "DayFromBegOfMonth"
  | "Quarter"
  | "QuarterFromBegOfYear"
  | "Month"
  | "MonthFromBegOfYear"
  | "MonthFromBegOfQuarter"
  | "AnyInterval"

export type PeriodVariantEnterprise =
  | "Год"
  | "День"
  | "ДеньСНачалаГода"
  | "ДеньСНачалаКвартала"
  | "ДеньСНачалаМесяца"
  | "Квартал"
  | "КварталСНачалаГода"
  | "Месяц"
  | "МесяцСНачалаГода"
  | "МесяцСНачалаКвартала"
  | "ПроизвольныйИнтервал"

export type PictureType = "Absolute" | "FromLib" | "Empty"

export type PictureTypeEnterprise = "Абсолютная" | "ИзБиблиотеки" | "Пустая"

export type PlatformType =
  | "Android_ARM"
  | "Android_ARM_64"
  | "Android_x86"
  | "Android_x86_64"
  | "iOS_ARM"
  | "iOS_ARM_64"
  | "Linux_ARM64"
  | "Linux_E2K"
  | "Linux_x86"
  | "Linux_x86_64"
  | "MacOS_x86"
  | "MacOS_x86_64"
  | "Windows_x86"
  | "Windows_x86_64"
  | "WinRT_ARM"
  | "WinRT_x86"
  | "WinRT_x86_64"

export type PlatformTypeEnterprise =
  | "Android_ARM"
  | "Android_ARM_64"
  | "Android_x86"
  | "Android_x86_64"
  | "iOS_ARM"
  | "iOS_ARM_64"
  | "Linux_ARM64"
  | "Linux_E2K"
  | "Linux_x86"
  | "Linux_x86_64"
  | "MacOS_x86"
  | "MacOS_x86_64"
  | "Windows_x86"
  | "Windows_x86_64"
  | "WinRT_ARM"
  | "WinRT_x86"
  | "WinRT_x86_64"

export type QuestionDialogMode = "YesNo" | "YesNoCancel" | "OK" | "OKCancel" | "RetryCancel" | "AbortRetryIgnore"

export type QuestionDialogModeEnterprise =
  | "ДаНет"
  | "ДаНетОтмена"
  | "ОК"
  | "ОКОтмена"
  | "ПовторитьОтмена"
  | "ПрерватьПовторитьПропустить"

export type ReplacementMode = "Append" | "Replace" | "Update" | "Merge" | "Delete"

export type ReplacementModeEnterprise = "Добавление" | "Замещение" | "Обновление" | "Слияние" | "Удаление"

export type RoundMode = "Round15as10" | "Round15as20"

export type RoundModeEnterprise = "Окр15как10" | "Окр15как20"

export type SearchDirection = "FromEnd" | "FromBegin"

export type SearchDirectionEnterprise = "СКонца" | "СНачала"

export type SectionsPanelRepresentation =
  | "Picture"
  | "PictureAndText"
  | "PictureOnTopAndText"
  | "PictureOnLeftAndText"
  | "Text"

export type SectionsPanelRepresentationEnterprise =
  | "Картинка"
  | "КартинкаИТекст"
  | "КартинкаСверхуИТекст"
  | "КартинкаСлеваИТекст"
  | "Текст"

export type SortDirection = "Asc" | "Desc"

export type SortDirectionEnterprise = "Возр" | "Убыв"

export type StandardBeginningDateVariant =
  | "BeginningOfLastYear"
  | "BeginningOfLastDay"
  | "BeginningOfLastQuarter"
  | "BeginningOfLastMonth"
  | "BeginningOfLastHalfYear"
  | "BeginningOfLastTenDays"
  | "BeginningOfLastWeek"
  | "BeginningOfNextYear"
  | "BeginningOfNextDay"
  | "BeginningOfNextQuarter"
  | "BeginningOfNextMonth"
  | "BeginningOfNextHalfYear"
  | "BeginningOfNextTenDays"
  | "BeginningOfNextWeek"
  | "BeginningOfThisYear"
  | "BeginningOfThisDay"
  | "BeginningOfThisQuarter"
  | "BeginningOfThisMonth"
  | "BeginningOfThisHalfYear"
  | "BeginningOfThisTenDays"
  | "BeginningOfThisWeek"
  | "Custom"

export type StandardBeginningDateVariantEnterprise =
  | "НачалоПрошлогоГода"
  | "НачалоПрошлогоДня"
  | "НачалоПрошлогоКвартала"
  | "НачалоПрошлогоМесяца"
  | "НачалоПрошлогоПолугодия"
  | "НачалоПрошлойДекады"
  | "НачалоПрошлойНедели"
  | "НачалоСледующегоГода"
  | "НачалоСледующегоДня"
  | "НачалоСледующегоКвартала"
  | "НачалоСледующегоМесяца"
  | "НачалоСледующегоПолугодия"
  | "НачалоСледующейДекады"
  | "НачалоСледующейНедели"
  | "НачалоЭтогоГода"
  | "НачалоЭтогоДня"
  | "НачалоЭтогоКвартала"
  | "НачалоЭтогоМесяца"
  | "НачалоЭтогоПолугодия"
  | "НачалоЭтойДекады"
  | "НачалоЭтойНедели"
  | "ПроизвольнаяДата"

export type StandardGlobalSearchType =
  | "AllFunctions"
  | "Expression"
  | "GlobalStandardCommands"
  | "Data"
  | "UserWorkFavorites"
  | "UserWorkHistory"
  | "FunctionMenu"
  | "URL"
  | "CollaborationSystemConversations"
  | "CollaborationSystemMessages"
  | "Help"
  | "FunctionsForTechnicalSpecialist"

export type StandardGlobalSearchTypeEnterprise =
  | "ВсеФункции"
  | "Выражение"
  | "ГлобальныеСтандартныеКоманды"
  | "Данные"
  | "ИзбранноеРаботыПользователя"
  | "ИсторияРаботыПользователя"
  | "МенюФункций"
  | "НавигационнаяСсылка"
  | "ОбсужденияСистемыВзаимодействия"
  | "СообщенияСистемыВзаимодействия"
  | "Справка"
  | "ФункцииДляТехническогоСпециалиста"

export type StandardPeriodVariant =
  | "Yesterday"
  | "TillEndOfThisYear"
  | "TillEndOfThisQuarter"
  | "TillEndOfThisMonth"
  | "TillEndOfThisHalfYear"
  | "TillEndOfThisTenDays"
  | "TillEndOfThisWeek"
  | "Tomorrow"
  | "Month"
  | "Last7Days"
  | "Custom"
  | "LastTenDays"
  | "LastTenDaysTillSameDayNumber"
  | "LastWeek"
  | "LastWeekTillSameWeekDay"
  | "LastHalfYear"
  | "LastHalfYearTillSameDate"
  | "LastYear"
  | "LastYearTillSameDate"
  | "LastQuarter"
  | "LastQuarterTillSameDate"
  | "LastMonth"
  | "LastMonthTillSameDate"
  | "Today"
  | "NextTenDays"
  | "NextTenDaysTillSameDayNumber"
  | "NextWeek"
  | "NextWeekTillSameWeekDay"
  | "NextHalfYear"
  | "NextHalfYearTillSameDate"
  | "Next7Days"
  | "NextYear"
  | "NextYearTillSameDate"
  | "NextQuarter"
  | "NextQuarterTillSameDate"
  | "NextMonth"
  | "NextMonthTillSameDate"
  | "FromBeginningOfThisYear"
  | "FromBeginningOfThisQuarter"
  | "FromBeginningOfThisMonth"
  | "FromBeginningOfThisHalfYear"
  | "FromBeginningOfThisTenDays"
  | "FromBeginningOfThisWeek"
  | "ThisTenDays"
  | "ThisWeek"
  | "ThisHalfYear"
  | "ThisYear"
  | "ThisQuarter"
  | "ThisMonth"

export type StandardPeriodVariantEnterprise =
  | "Вчера"
  | "ДоКонцаЭтогоГода"
  | "ДоКонцаЭтогоКвартала"
  | "ДоКонцаЭтогоМесяца"
  | "ДоКонцаЭтогоПолугодия"
  | "ДоКонцаЭтойДекады"
  | "ДоКонцаЭтойНедели"
  | "Завтра"
  | "Месяц"
  | "Последние7Дней"
  | "ПроизвольныйПериод"
  | "ПрошлаяДекада"
  | "ПрошлаяДекадаДоТакогоЖеНомераДня"
  | "ПрошлаяНеделя"
  | "ПрошлаяНеделяДоТакогоЖеДняНедели"
  | "ПрошлоеПолугодие"
  | "ПрошлоеПолугодиеДоТакойЖеДаты"
  | "ПрошлыйГод"
  | "ПрошлыйГодДоТакойЖеДаты"
  | "ПрошлыйКвартал"
  | "ПрошлыйКварталДоТакойЖеДаты"
  | "ПрошлыйМесяц"
  | "ПрошлыйМесяцДоТакойЖеДаты"
  | "Сегодня"
  | "СледующаяДекада"
  | "СледующаяДекадаДоТакогоЖеНомераДня"
  | "СледующаяНеделя"
  | "СледующаяНеделяДоТакогоЖеДняНедели"
  | "СледующееПолугодие"
  | "СледующееПолугодиеДоТакойЖеДаты"
  | "Следующие7Дней"
  | "СледующийГод"
  | "СледующийГодДоТакойЖеДаты"
  | "СледующийКвартал"
  | "СледующийКварталДоТакойЖеДаты"
  | "СледующийМесяц"
  | "СледующийМесяцДоТакойЖеДаты"
  | "СНачалаЭтогоГода"
  | "СНачалаЭтогоКвартала"
  | "СНачалаЭтогоМесяца"
  | "СНачалаЭтогоПолугодия"
  | "СНачалаЭтойДекады"
  | "СНачалаЭтойНедели"
  | "ЭтаДекада"
  | "ЭтаНеделя"
  | "ЭтоПолугодие"
  | "ЭтотГод"
  | "ЭтотКвартал"
  | "ЭтотМесяц"

export type StringEncodingMethod = "URLInURLEncoding" | "URLEncoding"

export type StringEncodingMethodEnterprise = "URLВКодировкеURL" | "КодировкаURL"

export type TextEncoding = "ANSI" | "OEM" | "UTF16" | "UTF8" | "System"

export type TextEncodingEnterprise = "ANSI" | "OEM" | "UTF16" | "UTF8" | "Системная"

export type TransactionsIsolationLevel =
  | "Auto"
  | "RepeatableRead"
  | "Serializable"
  | "ReadCommitted"
  | "ReadUncommitted"

export type TransactionsIsolationLevelEnterprise =
  | "Авто"
  | "ПовторяемоеЧтение"
  | "Упорядочиваемость"
  | "ЧтениеЗафиксированных"
  | "ЧтениеНезафиксированных"

export type UUIDVersion = "Version1" | "Version3" | "Version4" | "Version5"

export type UUIDVersionEnterprise = "Версия1" | "Версия3" | "Версия4" | "Версия5"

export type UpdateOnDataChange = "Auto" | "DontUpdate"

export type UpdateOnDataChangeEnterprise = "Авто" | "НеОбновлять"

export type UserPasswordHashAlgorithmType = "PBKDF2SHA256" | "SHA1" | "SHA256" | "SHA512"

export type UserPasswordHashAlgorithmTypeEnterprise = "PBKDF2SHA256" | "SHA1" | "SHA256" | "SHA512"

export type WorkingDateMode = "UseCurrentDate" | "Assign"

export type WorkingDateModeEnterprise = "ИспользоватьТекущуюДату" | "Назначать"

export type XBaseEncoding = "ANSI" | "OEM"

export type XBaseEncodingEnterprise = "ANSI" | "OEM"

export type CalendarEventRecurrence = "Weekly" | "Yearly" | "Daily" | "Monthly" | "Once"

export type CalendarEventRecurrenceEnterprise = "КаждуюНеделю" | "КаждыйГод" | "КаждыйДень" | "КаждыйМесяц" | "ОдинРаз"

export type ContactDataAddressType = "Home" | "Other" | "Work"

export type ContactDataAddressTypeEnterprise = "Домашний" | "Другой" | "Рабочий"

export type ContactDataEmailAddressType = "Home" | "Other" | "Mobile" | "Work"

export type ContactDataEmailAddressTypeEnterprise = "Домашний" | "Другой" | "Мобильный" | "Рабочий"

export type ContactDataInstantMessagingAddressType = "Home" | "Other" | "Work"

export type ContactDataInstantMessagingAddressTypeEnterprise = "Домашний" | "Другой" | "Рабочий"

export type ContactDataPhoneNumberType =
  | "iPhone"
  | "Home"
  | "HomeFax"
  | "Other"
  | "OtherFax"
  | "Mobile"
  | "Main"
  | "Work"
  | "WorkMobile"
  | "WorkFax"

export type ContactDataPhoneNumberTypeEnterprise =
  | "iPhone"
  | "Домашний"
  | "ДомашнийФакс"
  | "Другой"
  | "ДругойФакс"
  | "Мобильный"
  | "Основной"
  | "Рабочий"
  | "РабочийМобильный"
  | "РабочийФакс"

export type ContactDataRelationshipType =
  | "Brother"
  | "DomesticPartner"
  | "Friend"
  | "Other"
  | "Mother"
  | "Father"
  | "Partner"
  | "Assistant"
  | "Child"
  | "Parent"
  | "Relative"
  | "Manager"
  | "Sister"
  | "Spouse"

export type ContactDataRelationshipTypeEnterprise =
  | "Брат"
  | "ГражданскийСупруг"
  | "Друг"
  | "Другой"
  | "Мать"
  | "Отец"
  | "Партнер"
  | "Помощник"
  | "Ребенок"
  | "Родитель"
  | "Родственник"
  | "Руководитель"
  | "Сестра"
  | "Супруг"

export type ContactDataURLType = "FTP" | "Blog" | "Home" | "HomePage" | "Other" | "Profile" | "Work"

export type ContactDataURLTypeEnterprise =
  | "FTP"
  | "Блог"
  | "Домашний"
  | "ДомашняяСтраница"
  | "Другой"
  | "Профиль"
  | "Рабочий"

export type CallLogCallType = "Incoming" | "Outgoing" | "Missed"

export type CallLogCallTypeEnterprise = "Входящий" | "Исходящий" | "Пропущенный"

export type TelephonyToolsCallEventVariant =
  | "EndIncoming"
  | "EndOutgoing"
  | "StartIncoming"
  | "StartOutgoing"
  | "StartIncomingRinging"

export type TelephonyToolsCallEventVariantEnterprise =
  | "ЗавершениеВходящего"
  | "ЗавершениеИсходящего"
  | "НачалоВходящего"
  | "НачалоИсходящего"
  | "НачалоСигналаВходящего"

export type TelephonyToolsSMSType = "Queued" | "Incoming" | "Outgoing" | "Sent" | "Failed" | "Draft"

export type TelephonyToolsSMSTypeEnterprise =
  | "ВОчереди"
  | "Входящее"
  | "Исходящее"
  | "Отправленное"
  | "ОшибкаОтправки"
  | "Черновик"

export type AudioRecordingChannelUse = "Mono" | "Stereo"

export type AudioRecordingChannelUseEnterprise = "Моно" | "Стерео"

export type AudioRecordingFormat = "Mpeg4AAC" | "WavPCM16bit"

export type AudioRecordingFormatEnterprise = "Mpeg4AAC" | "WavPCM16bit"

export type BarcodeType =
  | "Aztec"
  | "Codabar"
  | "Code128"
  | "Code39"
  | "Code93"
  | "DataMatrix"
  | "EAN13"
  | "EAN8"
  | "ITF"
  | "MaxiCode"
  | "PDF417"
  | "QRCode"
  | "RSS14"
  | "RSSExpanded"
  | "UPCA"
  | "UPCE"
  | "All"
  | "Matrix"
  | "Linear"

export type BarcodeTypeEnterprise =
  | "Aztec"
  | "Codabar"
  | "Code128"
  | "Code39"
  | "Code93"
  | "DataMatrix"
  | "EAN13"
  | "EAN8"
  | "ITF"
  | "MaxiCode"
  | "PDF417"
  | "QRCode"
  | "RSS14"
  | "RSSExpanded"
  | "UPCA"
  | "UPCE"
  | "Все"
  | "Двухмерный"
  | "Линейный"

export type CameraLightingType = "Auto" | "Enable" | "Disable"

export type CameraLightingTypeEnterprise = "Авто" | "Включена" | "Выключена"

export type DeviceCameraType = "Auto" | "Rear" | "Front"

export type DeviceCameraTypeEnterprise = "Авто" | "Задняя" | "Передняя"

export type DocumentScanningCheckingQuality =
  | "DontCheck"
  | "WarnBelowHigh"
  | "WarnBelowMedium"
  | "RequireHigh"
  | "RequireMediumWarnBelowHigh"

export type DocumentScanningCheckingQualityEnterprise =
  | "НеПроверять"
  | "ПредупреждатьНижеВысокого"
  | "ПредупреждатьНижеСреднего"
  | "ТребоватьВысокое"
  | "ТребоватьСреднееПредупреждатьНижеВысокого"

export type DocumentScanningOrientationDetectionMode =
  | "Landscape"
  | "ByHorizontalTextLines"
  | "ByFirstPageInSeries"
  | "ByDocumentPosition"
  | "Portrait"

export type DocumentScanningOrientationDetectionModeEnterprise =
  | "Ландшафт"
  | "ПоГоризонтальнымСтрокамТекста"
  | "ПоПервойСтраницеСерии"
  | "ПоРасположениюДокумента"
  | "Портрет"

export type DocumentScanningProcessingFilter = "None" | "Text" | "TextWithPictures"

export type DocumentScanningProcessingFilterEnterprise = "Нет" | "Текст" | "ТекстСКартинками"

export type MultimediaRecordingStopButtonPlacement =
  | "Auto"
  | "Top"
  | "Left"
  | "LeftTop"
  | "LeftBottom"
  | "None"
  | "Bottom"
  | "Right"
  | "RightTop"
  | "RightBottom"

export type MultimediaRecordingStopButtonPlacementEnterprise =
  | "Авто"
  | "Верх"
  | "Лево"
  | "ЛевоВерх"
  | "ЛевоНиз"
  | "Нет"
  | "Низ"
  | "Право"
  | "ПравоВерх"
  | "ПравоНиз"

export type VideoQuality = "Auto" | "High" | "Low"

export type VideoQualityEnterprise = "Авто" | "Высокое" | "Низкое"

export type QuerySchemaAvailableTableParameterType = "Variant" | "Value" | "Array" | "Order" | "FieldList" | "Where"

export type QuerySchemaAvailableTableParameterTypeEnterprise =
  | "Вариант"
  | "Значение"
  | "Массив"
  | "Порядок"
  | "СписокПолей"
  | "Условие"

export type QuerySchemaJoinType = "Inner" | "LeftOuter" | "FullOuter" | "RightOuter"

export type QuerySchemaJoinTypeEnterprise = "Внутреннее" | "ЛевоеВнешнее" | "ПолноеВнешнее" | "ПравоеВнешнее"

export type QuerySchemaOrderDirection = "Ascending" | "HierarchyAscending" | "Descending" | "HierarchyDescending"

export type QuerySchemaOrderDirectionEnterprise =
  | "ПоВозрастанию"
  | "ПоВозрастаниюИерархии"
  | "ПоУбыванию"
  | "ПоУбываниюИерархии"

export type QuerySchemaPeriodAdditionType =
  | "NoAddition"
  | "Year"
  | "TenDays"
  | "Day"
  | "Quarter"
  | "Month"
  | "Minute"
  | "Week"
  | "HalfYear"
  | "Second"
  | "Hour"

export type QuerySchemaPeriodAdditionTypeEnterprise =
  | "БезДополнения"
  | "Год"
  | "Декада"
  | "День"
  | "Квартал"
  | "Месяц"
  | "Минута"
  | "Неделя"
  | "Полугодие"
  | "Секунда"
  | "Час"

export type QuerySchemaTotalCalculationFieldType = "Hierarchy" | "HierarchyOnly" | "Items"

export type QuerySchemaTotalCalculationFieldTypeEnterprise = "Иерархия" | "ТолькоИерархия" | "Элементы"

export type QuerySchemaUnionType = "Union" | "UnionAll"

export type QuerySchemaUnionTypeEnterprise = "Объединить" | "ОбъединитьВсе"

export type NewPlannerItemsTextType = "String" | "FormattedString"

export type NewPlannerItemsTextTypeEnterprise = "Строка" | "ФорматированнаяСтрока"

export type PlannerCommandSource =
  | "Action"
  | "URL"
  | "WrappedTimeScaleHeaderArea"
  | "EmptyItemsArea"
  | "DimensionItem"
  | "TimeScaleItem"
  | "Items"

export type PlannerCommandSourceEnterprise =
  | "Действие"
  | "НавигационнаяСсылка"
  | "ОбластьПеренесенногоЗаголовкаШкалыВремени"
  | "ПустаяОбластьЭлементов"
  | "ЭлементИзмерения"
  | "ЭлементШкалыВремени"
  | "Элементы"

export type PlannerInsideDragAction = "Select" | "Copy" | "Edit" | "Create"

export type PlannerInsideDragActionEnterprise = "Выделение" | "Копирование" | "Редактирование" | "Создание"

export type PlannerInsideDragBoundaryChangeVariant = "End" | "Begin" | "BeginAndEnd"

export type PlannerInsideDragBoundaryChangeVariantEnterprise = "Конец" | "Начало" | "НачалоИКонец"

export type PlannerItemActionLocation = "EndOfItem" | "EndOfText"

export type PlannerItemActionLocationEnterprise = "ВКонцеЭлемента" | "ПослеТекста"

export type PlannerItemEnableEditMode = "DisableDragAndStretch" | "DisableStretch" | "DisableEdit" | "EnableEdit"

export type PlannerItemEnableEditModeEnterprise =
  | "ЗапретитьПеретаскиваниеИРастягивание"
  | "ЗапретитьРастягивание"
  | "ЗапретитьРедактирование"
  | "РазрешитьРедактирование"

export type PlannerItemsBehaviorOnLackOfSpace = "ShowAllItems" | "CollapseItems"

export type PlannerItemsBehaviorOnLackOfSpaceEnterprise = "ОтображатьВсеЭлементы" | "СворачиватьЭлементы"

export type PlannerItemsTimeRepresentation = "BeginTime" | "BeginAndEndTime" | "DontDisplay"

export type PlannerItemsTimeRepresentationEnterprise = "ВремяНачала" | "ВремяНачалаИКонца" | "НеОтображать"

export type PlannerStandardCommand =
  | "QuickEditItem"
  | "SelectWrappedTimeScaleHeader"
  | "SelectDimensionItem"
  | "SelectTimeScaleItem"
  | "ExecuteAction"
  | "CopyURL"
  | "GotoURL"
  | "EditItem"
  | "CreateItem"
  | "DeleteItems"

export type PlannerStandardCommandEnterprise =
  | "БыстроРедактироватьЭлемент"
  | "ВыбратьПеренесенныйЗаголовокШкалыВремени"
  | "ВыбратьЭлементИзмерения"
  | "ВыбратьЭлементШкалыВремени"
  | "ВыполнитьДействие"
  | "КопироватьНавигационнуюСсылку"
  | "ПерейтиПоНавигационнойСсылке"
  | "РедактироватьЭлемент"
  | "СоздатьЭлемент"
  | "УдалитьЭлементы"

export type JSONCharactersEscapeMode = "None" | "NotASCIISymbols" | "SymbolsNotInBMP"

export type JSONCharactersEscapeModeEnterprise = "Нет" | "СимволыВнеASCII" | "СимволыВнеBMP"

export type JSONDateFormat = "ISO" | "JavaScript" | "Microsoft"

export type JSONDateFormatEnterprise = "ISO" | "JavaScript" | "Microsoft"

export type JSONDateWritingVariant = "LocalDate" | "LocalDateWithOffset" | "UniversalDate"

export type JSONDateWritingVariantEnterprise = "ЛокальнаяДата" | "ЛокальнаяДатаСоСмещением" | "УниверсальнаяДата"

export type JSONLineBreak = "Unix" | "Windows" | "Auto" | "None"

export type JSONLineBreakEnterprise = "Unix" | "Windows" | "Авто" | "Нет"

export type JSONValueType =
  | "Null"
  | "Boolean"
  | "PropertyName"
  | "Comment"
  | "ArrayEnd"
  | "ObjectEnd"
  | "ArrayStart"
  | "ObjectStart"
  | "None"
  | "String"
  | "Number"

export type JSONValueTypeEnterprise =
  | "Null"
  | "Булево"
  | "ИмяСвойства"
  | "Комментарий"
  | "КонецМассива"
  | "КонецОбъекта"
  | "НачалоМассива"
  | "НачалоОбъекта"
  | "Ничего"
  | "Строка"
  | "Число"

export type DeliverableNotificationSendErrorType =
  | "UnknownError"
  | "AuthenticationDataError"
  | "SubscriberIDError"
  | "DeliverableNotificationServiceConnectionError"
  | "DeliverableNotificationServiceError"
  | "NotificationBodyError"
  | "NotificationsLimitExceeded"

export type DeliverableNotificationSendErrorTypeEnterprise =
  | "НеизвестнаяОшибка"
  | "ОшибкаДанныхАутентификации"
  | "ОшибкаИдентификатораПодписчика"
  | "ОшибкаПодключенияКСервисуДоставляемыхУведомлений"
  | "ОшибкаСервисаДоставляемыхУведомлений"
  | "ОшибкаТелаУведомления"
  | "ПревышенЛимитОтправкиУведомлений"

export type DeliverableNotificationSubscriberType = "APNS" | "FCM" | "GCM" | "HPK" | "RMS" | "WNS"

export type DeliverableNotificationSubscriberTypeEnterprise = "APNS" | "FCM" | "GCM" | "HPK" | "RMS" | "WNS"

export type SoundAlert = "None" | "Default"

export type SoundAlertEnterprise = "Нет" | "ПоУмолчанию"

export type InAppPurchaseService =
  | "AppleInAppPurchase"
  | "GooglePlayInAppBilling"
  | "HuaweiInAppPurchase"
  | "RuStoreInAppPurchase"
  | "WindowsInAppPurchase"

export type InAppPurchaseServiceEnterprise =
  | "AppleInAppPurchase"
  | "GooglePlayInAppBilling"
  | "HuaweiInAppPurchase"
  | "RuStoreInAppPurchase"
  | "WindowsInAppPurchase"

export type InAppPurchaseType = "ContentForSale" | "Subscription"

export type InAppPurchaseTypeEnterprise = "КонтентДляПродажи" | "Подписка"

export type FTPSecureConnectionUsageLevel = "Auto" | "UseIfPossible" | "DontUse" | "Require" | "RequireForControl"

export type FTPSecureConnectionUsageLevelEnterprise =
  | "Авто"
  | "ИспользоватьЕслиВозможно"
  | "НеИспользовать"
  | "Требовать"
  | "ТребоватьДляУправления"

export type InternetConnectionType = "WiFi" | "LAN" | "NoConnection" | "CellularData"

export type InternetConnectionTypeEnterprise = "WiFi" | "ЛокальнаяСеть" | "НетСоединения" | "СотовыеДанные"

export type MacOSCertificateSelectMode = "Auto" | "Choose"

export type MacOSCertificateSelectModeEnterprise = "Авто" | "Выбирать"

export type OSCertificateSelectMode = "Auto" | "Choose"

export type OSCertificateSelectModeEnterprise = "Авто" | "Выбирать"

export type RoamingUsage = "Used" | "Unknown" | "NotUsed"

export type RoamingUsageEnterprise = "Используется" | "Неизвестно" | "НеИспользуется"

export type ServerTLSCertificateRevocationCheckMode = "Auto" | "DontCheck" | "SoftFail" | "Strict"

export type ServerTLSCertificateRevocationCheckModeEnterprise = "Авто" | "НеПроверять" | "Нестрогий" | "Строгий"

export type WindowsCertificateSelectMode = "Auto" | "Choose"

export type WindowsCertificateSelectModeEnterprise = "Авто" | "Выбирать"

export type ByteOrder = "BigEndian" | "LittleEndian"

export type ByteOrderEnterprise = "BigEndian" | "LittleEndian"

export type PositionInStream = "End" | "Begin" | "Current"

export type PositionInStreamEnterprise = "Конец" | "Начало" | "Текущая"

export type AdBannerRepresentation = "Top" | "None" | "Bottom"

export type AdBannerRepresentationEnterprise = "Верх" | "Нет" | "Низ"

export type AdStatus = "ReadyToDisplay" | "Downloading" | "NotDownloaded" | "Displayed"

export type AdStatusEnterprise = "ГотоваКОтображению" | "Загружается" | "НеЗагружена" | "Отображается"

export type DataLineChangeType = "Add" | "Update" | "Move" | "Delete"

export type DataLineChangeTypeEnterprise = "Добавление" | "Изменение" | "Перемещение" | "Удаление"

export type RepresentableDocumentBatchFileType = "DOCX" | "HTML4" | "HTML5" | "ODS" | "PDF" | "TXT" | "XLS" | "XLSX"

export type RepresentableDocumentBatchFileTypeEnterprise =
  | "DOCX"
  | "HTML4"
  | "HTML5"
  | "ODS"
  | "PDF"
  | "TXT"
  | "XLS"
  | "XLSX"

export type ClientApplicationAgentState = "NotStarted" | "Disconnected" | "Connected"

export type ClientApplicationAgentStateEnterprise = "НеЗапущен" | "Отключен" | "Подключен"

export type DataCompositionDataRelevanceOutputType = "Auto" | "Output" | "DontOutput"

export type DataCompositionDataRelevanceOutputTypeEnterprise = "Авто" | "Выводить" | "НеВыводить"

export type DataCompositionDatabaseCopyOutputType = "Auto" | "Output" | "DontOutput"

export type DataCompositionDatabaseCopyOutputTypeEnterprise = "Авто" | "Выводить" | "НеВыводить"

export type DatabaseCopiesStandardReplicationVersion = "Version1" | "Version2"

export type DatabaseCopiesStandardReplicationVersionEnterprise = "Версия1" | "Версия2"

export type DatabaseCopiesUse = "Auto" | "PreferUseCopies" | "UseCopiesOnly" | "DontUseCopies"

export type DatabaseCopiesUseEnterprise =
  | "Авто"
  | "ИспользоватьПреимущественноКопии"
  | "ИспользоватьТолькоКопии"
  | "НеИспользоватьКопии"

export type DatabaseCopyContentItemFieldUse = "Auto" | "Use" | "DontUse"

export type DatabaseCopyContentItemFieldUseEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type DatabaseCopyDBMSType = "MSSQLServer" | "OracleDatabase" | "PostgreSQL"

export type DatabaseCopyDBMSTypeEnterprise = "MSSQLServer" | "OracleDatabase" | "PostgreSQL"

export type DatabaseCopyReplicationType = "External" | "Standard"

export type DatabaseCopyReplicationTypeEnterprise = "Внешняя" | "Стандартная"

export type DatabaseCopyState = "TurnedOn" | "TemporarilyTurnedOff" | "TurnedOff"

export type DatabaseCopyStateEnterprise = "Включена" | "ВременноОтключена" | "Отключена"

export type DatabaseCopyTurnedOffReason =
  | "InvalidCopyDatabaseUseVariant"
  | "DataInconsistency"
  | "QueryExecutionError"
  | "DatabaseConnectionError"

export type DatabaseCopyTurnedOffReasonEnterprise =
  | "НедопустимыйВариантИспользованияБазыДанныхКопии"
  | "НесоответствиеДанных"
  | "ОшибкаВыполненияЗапроса"
  | "ОшибкаСоединенияСБазойДанных"

export type DatabaseCopyUpdateState =
  | "InitialUpdateInProgress"
  | "CurrentUpdateInProgress"
  | "PortionUpdateCompletedSuccessfully"
  | "CompletedWithError"
  | "CompletedSuccessfully"
  | "Inactive"

export type DatabaseCopyUpdateStateEnterprise =
  | "ВыполняетсяНачальноеОбновление"
  | "ВыполняетсяТекущееОбновление"
  | "ЗавершеноОбновлениеПорцииУспешно"
  | "ЗавершеноСОшибкой"
  | "ЗавершеноУспешно"
  | "Неактивно"

export type RequiredDataRelevance = "Auto" | "Relevant" | "Any"

export type RequiredDataRelevanceEnterprise = "Авто" | "Актуальные" | "Любые"

export type CollaborationSystemCommandSource = "Attachment" | "Action" | "URL" | "CurrentPageURL" | "User" | "Message"

export type CollaborationSystemCommandSourceEnterprise =
  | "Вложение"
  | "Действие"
  | "НавигационнаяСсылка"
  | "НавигационнаяСсылкаТекущейСтраницы"
  | "Пользователь"
  | "Сообщение"

export type CollaborationSystemDataDumpStatus = "Restoring" | "Done" | "Loading" | "Error" | "Creating"

export type CollaborationSystemDataDumpStatusEnterprise =
  | "Восстановление"
  | "Готово"
  | "Загрузка"
  | "Ошибка"
  | "Создание"

export type CollaborationSystemFromDataDumpRestoreStatus = "Error" | "Success"

export type CollaborationSystemFromDataDumpRestoreStatusEnterprise = "Ошибка" | "Успешно"

export type CollaborationSystemMessageButtonPanelButtonAction =
  | "RequestLocation"
  | "RequestPhone"
  | "ProcessByBot"
  | "ProcessOnClient"
  | "SendMessage"
  | "SendMessageWithData"
  | "GotoURL"

export type CollaborationSystemMessageButtonPanelButtonActionEnterprise =
  | "ЗапроситьМестоположение"
  | "ЗапроситьТелефон"
  | "ОбработатьБотом"
  | "ОбработатьНаКлиенте"
  | "ОтправитьСообщение"
  | "ОтправитьСообщениеСДанными"
  | "ПерейтиПоНавигационнойСсылке"

export type CollaborationSystemMessageButtonPanelButtonType = "Hyperlink" | "UsualButton"

export type CollaborationSystemMessageButtonPanelButtonTypeEnterprise = "Гиперссылка" | "ОбычнаяКнопка"

export type CollaborationSystemNotificationRepresentation = "DontDisturb" | "Normal"

export type CollaborationSystemNotificationRepresentationEnterprise = "НеБеспокоить" | "Обычное"

export type CollaborationSystemStandardCommand =
  | "ExecuteAction"
  | "CopyAttachment"
  | "CopyURL"
  | "CopyMessage"
  | "OpenAttachment"
  | "GotoURL"
  | "ShareAttachment"
  | "ShareMessage"
  | "ShowUserInfo"
  | "GetMessageURL"
  | "EditMessage"
  | "SaveAttachment"
  | "DeleteMessage"
  | "QuoteMessage"

export type CollaborationSystemStandardCommandEnterprise =
  | "ВыполнитьДействие"
  | "КопироватьВложение"
  | "КопироватьНавигационнуюСсылку"
  | "КопироватьСообщение"
  | "ОткрытьВложение"
  | "ПерейтиПоНавигационнойСсылке"
  | "ПоделитьсяВложением"
  | "ПоделитьсяСообщением"
  | "ПоказатьИнформациюОПользователе"
  | "ПолучитьНавигационнуюСсылкуСообщения"
  | "РедактироватьСообщение"
  | "СохранитьВложение"
  | "УдалитьСообщение"
  | "ЦитироватьСообщение"

export type CollaborationSystemUsersChoicePurpose =
  | "MessageRecipient"
  | "VideoconferenceParticipant"
  | "ConversationMember"

export type CollaborationSystemUsersChoicePurposeEnterprise =
  | "ПолучательСообщения"
  | "УчастникВидеоконференции"
  | "УчастникОбсуждения"

export type AdministrationActionOnResourceConsumptionLimitExcess =
  | "TerminateSession"
  | "None"
  | "InterruptCurrentServerCall"
  | "SetThreadLowPriority"

export type AdministrationActionOnResourceConsumptionLimitExcessEnterprise =
  | "ЗавершитьСеанс"
  | "Нет"
  | "ПрерватьТекущийСерверныйВызов"
  | "УстановитьНизкийПриоритетПотока"

export type AdministrationAssignmentRuleType = "Auto" | "Assign" | "DontAssign"

export type AdministrationAssignmentRuleTypeEnterprise = "Авто" | "Назначать" | "НеНазначать"

export type AdministrationConnectionSecurityLevel = "Secure" | "SecureOnConnect" | "Unsecure"

export type AdministrationConnectionSecurityLevelEnterprise =
  | "Защищенное"
  | "ЗащищенноеПриУстановкеСоединения"
  | "Незащищенное"

export type AdministrationInfoBaseDeletionMode = "DontPerformActionsWithDatabase" | "ClearDatabase" | "DeleteDatabase"

export type AdministrationInfoBaseDeletionModeEnterprise =
  | "НеВыполнятьДействийСБазойДанных"
  | "ОчиститьБазуДанных"
  | "УдалитьБазуДанных"

export type AdministrationProcessChoicePriority = "ByMemory" | "ByPerformance"

export type AdministrationProcessChoicePriorityEnterprise = "ПоПамяти" | "ПоПроизводительности"

export type AdministrationResourceConsumptionCounterFilterType = "All" | "AllSelected" | "AllButSelected"

export type AdministrationResourceConsumptionCounterFilterTypeEnterprise = "Все" | "ВсеВыбранные" | "ВсеКромеВыбранных"

export type AdministrationResourceConsumptionCounterGroupType = "Users" | "DataSeparation"

export type AdministrationResourceConsumptionCounterGroupTypeEnterprise = "Пользователи" | "РазделениеДанных"

export type AdministrationWorkProcessStatus = "Used" | "NotUsed" | "Reserve"

export type AdministrationWorkProcessStatusEnterprise = "Используется" | "НеИспользуется" | "Резервный"

export type DuplexPrintingType = "UsePrinterSettings" | "None" | "FlipPagesUp" | "FlipPagesLeft"

export type DuplexPrintingTypeEnterprise = "ИспользоватьНастройкиПринтера" | "Нет" | "ПереворотВверх" | "ПереворотВлево"

export type PageOrientation = "Landscape" | "Portrait"

export type PageOrientationEnterprise = "Ландшафт" | "Портрет"

export type PagePlacementAlternation = "Auto" | "MirrorOnTop" | "MirrorOnLeft" | "DontUse"

export type PagePlacementAlternationEnterprise = "Авто" | "ЗеркальноСверху" | "ЗеркальноСлева" | "НеИспользовать"

export type PrintAccuracy = "Auto" | "Accurate"

export type PrintAccuracyEnterprise = "Авто" | "Точная"

export type SpreadsheetDocumentAreaFillType = "Parameter" | "Text" | "Template"

export type SpreadsheetDocumentAreaFillTypeEnterprise = "Параметр" | "Текст" | "Шаблон"

export type SpreadsheetDocumentCellAreaType = "Columns" | "Rectangle" | "Rows" | "Table"

export type SpreadsheetDocumentCellAreaTypeEnterprise = "Колонки" | "Прямоугольник" | "Строки" | "Таблица"

export type SpreadsheetDocumentCellLineType =
  | "LargeDashed"
  | "Double"
  | "None"
  | "ThinDashed"
  | "Solid"
  | "Dotted"
  | "ThickDashed"

export type SpreadsheetDocumentCellLineTypeEnterprise =
  | "БольшойПунктир"
  | "Двойная"
  | "НетЛинии"
  | "РедкийПунктир"
  | "Сплошная"
  | "Точечная"
  | "ЧастыйПунктир"

export type SpreadsheetDocumentDetailUse = "WithoutProcessing" | "Row" | "Cell"

export type SpreadsheetDocumentDetailUseEnterprise = "БезОбработки" | "Строка" | "Ячейка"

export type SpreadsheetDocumentDrawingLineType =
  | "None"
  | "Dashed"
  | "DashDotted"
  | "DashDottedDotted"
  | "Solid"
  | "Dotted"

export type SpreadsheetDocumentDrawingLineTypeEnterprise =
  | "НетЛинии"
  | "Пунктир"
  | "ПунктирТочка"
  | "ПунктирТочкаТочка"
  | "Сплошная"
  | "Точечная"

export type SpreadsheetDocumentDrawingType =
  | "GeographicalSchema"
  | "Group"
  | "Dendrogram"
  | "Chart"
  | "GanttChart"
  | "Picture"
  | "Object"
  | "Comment"
  | "Line"
  | "Rectangle"
  | "PivotChart"
  | "Text"
  | "Ellipse"

export type SpreadsheetDocumentDrawingTypeEnterprise =
  | "ГеографическаяСхема"
  | "Группа"
  | "Дендрограмма"
  | "Диаграмма"
  | "ДиаграммаГанта"
  | "Картинка"
  | "Объект"
  | "Примечание"
  | "Прямая"
  | "Прямоугольник"
  | "СводнаяДиаграмма"
  | "Текст"
  | "Эллипс"

export type SpreadsheetDocumentFileType =
  | "ANSITXT"
  | "DOCX"
  | "HTML"
  | "HTML3"
  | "HTML4"
  | "HTML5"
  | "MXL"
  | "MXL7"
  | "ODS"
  | "PDF"
  | "PDF_A_1"
  | "PDF_A_2"
  | "PDF_A_3"
  | "TXT"
  | "XLS"
  | "XLS95"
  | "XLS97"
  | "XLSX"

export type SpreadsheetDocumentFileTypeEnterprise =
  | "ANSITXT"
  | "DOCX"
  | "HTML"
  | "HTML3"
  | "HTML4"
  | "HTML5"
  | "MXL"
  | "MXL7"
  | "ODS"
  | "PDF"
  | "PDF_A_1"
  | "PDF_A_2"
  | "PDF_A_3"
  | "TXT"
  | "XLS"
  | "XLS95"
  | "XLS97"
  | "XLSX"

export type SpreadsheetDocumentGroupHeaderPlacement = "Auto" | "End" | "Begin"

export type SpreadsheetDocumentGroupHeaderPlacementEnterprise = "Авто" | "Конец" | "Начало"

export type SpreadsheetDocumentPatternType =
  | "WithoutPattern"
  | "Solid"
  | "Pattern1"
  | "Pattern10"
  | "Pattern11"
  | "Pattern12"
  | "Pattern13"
  | "Pattern14"
  | "Pattern15"
  | "Pattern16"
  | "Pattern17"
  | "Pattern2"
  | "Pattern3"
  | "Pattern4"
  | "Pattern5"
  | "Pattern6"
  | "Pattern7"
  | "Pattern8"
  | "Pattern9"

export type SpreadsheetDocumentPatternTypeEnterprise =
  | "БезУзора"
  | "Сплошной"
  | "Узор1"
  | "Узор10"
  | "Узор11"
  | "Узор12"
  | "Узор13"
  | "Узор14"
  | "Узор15"
  | "Узор16"
  | "Узор17"
  | "Узор2"
  | "Узор3"
  | "Узор4"
  | "Узор5"
  | "Узор6"
  | "Узор7"
  | "Узор8"
  | "Узор9"

export type SpreadsheetDocumentPointerType = "Regular" | "Special"

export type SpreadsheetDocumentPointerTypeEnterprise = "Обычные" | "Специальные"

export type SpreadsheetDocumentSavedPicturesDensity = "High" | "Original" | "Low" | "Medium"

export type SpreadsheetDocumentSavedPicturesDensityEnterprise = "Высокая" | "Исходная" | "Низкая" | "Средняя"

export type SpreadsheetDocumentSelectionShowModeType = "Always" | "WhenActive"

export type SpreadsheetDocumentSelectionShowModeTypeEnterprise = "Всегда" | "ПриАктивности"

export type SpreadsheetDocumentShiftType = "WithoutShift" | "Vertical" | "Horizontal"

export type SpreadsheetDocumentShiftTypeEnterprise = "БезСмещения" | "ПоВертикали" | "ПоГоризонтали"

export type SpreadsheetDocumentStepDirectionType = "WithoutMove" | "ByColumns" | "ByRows"

export type SpreadsheetDocumentStepDirectionTypeEnterprise = "БезПерехода" | "ПоКолонкам" | "ПоСтрокам"

export type SpreadsheetDocumentTextPlacementType = "Auto" | "Block" | "Cut" | "Wrap"

export type SpreadsheetDocumentTextPlacementTypeEnterprise = "Авто" | "Забивать" | "Обрезать" | "Переносить"

export type SpreadsheetDocumentValuesReadingMode = "Value" | "Text"

export type SpreadsheetDocumentValuesReadingModeEnterprise = "Значение" | "Текст"

export type TextPositionRelativeToPicture = "Auto" | "OnTop" | "Top" | "Left" | "Bottom" | "Right"

export type TextPositionRelativeToPictureEnterprise = "Авто" | "Поверх" | "Сверху" | "Слева" | "Снизу" | "Справа"

export type UseSpreadsheetDocumentWidthReduction =
  | "Auto"
  | "DoNotReduceOnExcess"
  | "ReduceToMinimumOnExcess"
  | "ReduceAlways"

export type UseSpreadsheetDocumentWidthReductionEnterprise =
  | "Авто"
  | "ПриПревышенииНеСжимать"
  | "ПриПревышенииСжиматьДоМинимума"
  | "СжиматьВсегда"

export type PivotTableColumnTotalPosition = "Left" | "Right"

export type PivotTableColumnTotalPositionEnterprise = "Лево" | "Право"

export type PivotTableLinesShowType = "Auto" | "Always"

export type PivotTableLinesShowTypeEnterprise = "Авто" | "Всегда"

export type PivotTableRowTotalPosition = "Top" | "Bottom"

export type PivotTableRowTotalPositionEnterprise = "Верх" | "Низ"

export type QueryRecordType = "DetailRecord" | "GroupTotal" | "TotalByHierarchy" | "Overall"

export type QueryRecordTypeEnterprise = "ДетальнаяЗапись" | "ИтогПоГруппировке" | "ИтогПоИерархии" | "ОбщийИтог"

export type QueryResultIteration = "ByGroups" | "ByGroupsWithHierarchy" | "Linear"

export type QueryResultIterationEnterprise = "ПоГруппировкам" | "ПоГруппировкамСИерархией" | "Прямой"

export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod =
  | "StronglyConnectedComponents"
  | "StronglyConnectedComponentsWithNoInnerConnectionRequired"
  | "WeaklyConnectedComponents"

export type ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethodEnterprise =
  | "КомпонентыСильнойСвязности"
  | "КомпонентыСильнойСвязностиБезТребованияСвязиВнутриКомпонент"
  | "КомпонентыСлабойСвязности"

export type AdditionalUserVerificationMethod = "BiometricsOrPassword" | "BiometricsOnly"

export type AdditionalUserVerificationMethodEnterprise = "БиометрическаяИлиВводПароля" | "ТолькоБиометрическая"

export type BiometricVerificationMethod = "None" | "FaceRecognition" | "FingerprintRecognition" | "IrisRecognition"

export type BiometricVerificationMethodEnterprise =
  | "Нет"
  | "РаспознаваниеЛица"
  | "РаспознаваниеОтпечаткаПальца"
  | "РаспознаваниеРадужнойОболочкиГлаза"

export type SecureStorageAccessProtectionMethod = "None" | "AdditionalUserVerificationRequired" | "ScreenUnlockRequired"

export type SecureStorageAccessProtectionMethodEnterprise =
  | "Нет"
  | "ТребуетсяДополнительнаяПроверкаПользователя"
  | "ТребуетсяРазблокировкаЭкрана"

export type ErrorCategory =
  | "AllErrors"
  | "ExceptionRaisedFromScript"
  | "AccessViolation"
  | "UnsupportedFormat"
  | "InvalidPassword"
  | "NoPermissionToUseFunctionality"
  | "ExternalDataSourceError"
  | "ScriptRuntimeError"
  | "LocalFileAccessError"
  | "ScriptUseError"
  | "ScriptCompileError"
  | "ConfigurationError"
  | "DatabaseCopyError"
  | "DataCompositionSettingsError"
  | "GotoURLError"
  | "FullTextSearchError"
  | "DocumentConversionError"
  | "SignatureVerificationError"
  | "PrinterError"
  | "SpeechProcessingError"
  | "SessionError"
  | "NetworkError"
  | "CollaborationSystemError"
  | "MultimediaToolsError"
  | "DatabaseTablespaceError"
  | "StoredDataError"
  | "ForcedShutdown"
  | "OtherError"

export type ErrorCategoryEnterprise =
  | "ВсеОшибки"
  | "ИсключениеВызванноеИзВстроенногоЯзыка"
  | "НарушениеПравДоступа"
  | "НеподдерживаемыйФормат"
  | "НеправильныйПароль"
  | "ОтсутствиеРазрешенияДляИспользованияФункциональности"
  | "ОшибкаВнешнегоИсточникаДанных"
  | "ОшибкаВоВремяВыполненияВстроенногоЯзыка"
  | "ОшибкаДоступаКЛокальномуФайлу"
  | "ОшибкаИспользованияВстроенногоЯзыка"
  | "ОшибкаКомпиляцииВстроенногоЯзыка"
  | "ОшибкаКонфигурации"
  | "ОшибкаКопииБазыДанных"
  | "ОшибкаНастроекКомпоновкиДанных"
  | "ОшибкаПереходаПоНавигационнойСсылке"
  | "ОшибкаПолнотекстовогоПоиска"
  | "ОшибкаПреобразованияДокумента"
  | "ОшибкаПроверкиПодписи"
  | "ОшибкаРаботыСПринтером"
  | "ОшибкаРаботыСРечью"
  | "ОшибкаСеанса"
  | "ОшибкаСети"
  | "ОшибкаСистемыВзаимодействия"
  | "ОшибкаСредствМультимедиа"
  | "ОшибкаТабличногоПространстваБазыДанных"
  | "ОшибкаХранимыхДанных"
  | "ПринудительноеЗавершениеРаботы"
  | "ПрочаяОшибка"

export type ErrorMessageDisplayVariant =
  | "Auto"
  | "BriefErrorDescription"
  | "DetailErrorDescription"
  | "ErrorMessageForUser"

export type ErrorMessageDisplayVariantEnterprise =
  | "Авто"
  | "КраткоеПредставлениеОшибки"
  | "ПодробноеПредставлениеОшибки"
  | "СообщениеОбОшибкеДляПользователя"

export type ErrorReportingMode = "Auto" | "DontSend" | "Send" | "AskUser"

export type ErrorReportingModeEnterprise = "Авто" | "НеОтправлять" | "Отправлять" | "СпрашиватьПользователя"

export type MobileClientSignatureVerificationMethod =
  | "DoNotVerifySignature"
  | "CheckMobileClientUsageAbility"
  | "CheckConfigurationSignatureForExactMatch"

export type MobileClientSignatureVerificationMethodEnterprise =
  | "НеВыполнятьПроверкуПодписи"
  | "ПроверятьВозможностьИспользованияМобильногоКлиента"
  | "ПроверятьТочноеСоответствиеПодписиКонфигурации"

export type OnMainServerUnavalableBehavior = "Auto" | "DontChangeBehavior" | "MakeDisable"

export type OnMainServerUnavalableBehaviorEnterprise = "Авто" | "НеИзменятьПоведение" | "ОтключитьДоступность"

export type UsedServer = "Standalone" | "Main"

export type UsedServerEnterprise = "Автономный" | "Основной"

export type PDFAttachmentRelationshipType = "Alternative" | "Data" | "Supplement" | "Source" | "Unspecified"

export type PDFAttachmentRelationshipTypeEnterprise =
  | "Альтернатива"
  | "Данные"
  | "Дополнение"
  | "Источник"
  | "НеУстановлено"

export type PDFDocumentFileType = "PDF" | "PDF_A_1" | "PDF_A_2" | "PDF_A_3"

export type PDFDocumentFileTypeEnterprise = "PDF" | "PDF_A_1" | "PDF_A_2" | "PDF_A_3"

export type PDFModificationAccessPermissions = "FillingSigning" | "FillingSigningAnnotation" | "None"

export type PDFModificationAccessPermissionsEnterprise =
  | "ЗаполнениеПодписание"
  | "ЗаполнениеПодписаниеАннотирование"
  | "Нет"

export type PDFSignatureType = "Certifying" | "Approving"

export type PDFSignatureTypeEnterprise = "Сертифицирующая" | "Утверждающая"

export type ProgressiveWebApplicationMode = "InBrowserWindow" | "InStandaloneWindow"

export type ProgressiveWebApplicationModeEnterprise = "ВОкнеБраузера" | "ВОтдельномОкне"

export type AdditionalShowMode = "Irrelevance" | "DontUse"

export type AdditionalShowModeEnterprise = "Неактуальность" | "НеИспользовать"

export type AppearanceAreaType = "Group" | "Field"

export type AppearanceAreaTypeEnterprise = "Группировка" | "Поле"

export type ArrowStyle = "Filled" | "Blank" | "None"

export type ArrowStyleEnterprise = "Заполненная" | "Незаполненная" | "Нет"

export type AutoCapitalizationOnTextInput = "Auto" | "AllCharacters" | "None" | "Sentences" | "Words"

export type AutoCapitalizationOnTextInputEnterprise = "Авто" | "ВсеСимволы" | "Нет" | "Предложения" | "Слова"

export type AutoCorrectionOnTextInput = "Auto" | "Use" | "DontUse"

export type AutoCorrectionOnTextInputEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type AutoSaveFormDataInSettings = "Use" | "DontUse"

export type AutoSaveFormDataInSettingsEnterprise = "Использовать" | "НеИспользовать"

export type AutoShowClearButtonMode = "Auto" | "Always" | "FilledOnly"

export type AutoShowClearButtonModeEnterprise = "Авто" | "Всегда" | "ТолькоДляЗаполненного"

export type AutoShowOpenButtonMode = "Auto" | "Always" | "FilledOnly"

export type AutoShowOpenButtonModeEnterprise = "Авто" | "Всегда" | "ТолькоДляЗаполненного"

export type AutoShowStateMode = "Auto" | "DontShow" | "Show" | "ShowOnComposition"

export type AutoShowStateModeEnterprise = "Авто" | "НеОтображать" | "Отображать" | "ОтображатьПриФормировании"

export type AutonumerationInForm = "Auto" | "DontUse"

export type AutonumerationInFormEnterprise = "Авто" | "НеИспользовать"

export type ButtonGroupRepresentation = "Auto" | "Compact" | "Usual"

export type ButtonGroupRepresentationEnterprise = "Авто" | "Компактное" | "Обычное"

export type ButtonLocationInCommandBar =
  | "Auto"
  | "InAdditionalSubmenu"
  | "InCommandBar"
  | "InCommandBarAndInAdditionalSubmenu"

export type ButtonLocationInCommandBarEnterprise =
  | "Авто"
  | "ВДополнительномПодменю"
  | "ВКоманднойПанели"
  | "ВКоманднойПанелиИВДополнительномПодменю"

export type ButtonPictureLocation = "Left" | "Right"

export type ButtonPictureLocationEnterprise = "Лево" | "Право"

export type ButtonRepresentation = "Auto" | "Picture" | "PictureAndText" | "Text"

export type ButtonRepresentationEnterprise = "Авто" | "Картинка" | "КартинкаИТекст" | "Текст"

export type ButtonShape = "Auto" | "Usual" | "Oval"

export type ButtonShapeEnterprise = "Авто" | "Обычная" | "Овал"

export type ButtonShapeRepresentation = "Auto" | "Always" | "None" | "WhenActive"

export type ButtonShapeRepresentationEnterprise = "Авто" | "Всегда" | "Нет" | "ПриАктивности"

export type CheckBoxType = "Auto" | "Switch" | "Tumbler" | "CheckBox"

export type CheckBoxTypeEnterprise = "Авто" | "Выключатель" | "Тумблер" | "Флажок"

export type ChildFormItemsGroup = "Vertical" | "Horizontal" | "AlwaysHorizontal" | "HorizontalIfPossible"

export type ChildFormItemsGroupEnterprise =
  | "Вертикальная"
  | "Горизонтальная"
  | "ГоризонтальнаяВсегда"
  | "ГоризонтальнаяЕслиВозможно"

export type ChildFormItemsWidth = "Auto" | "LeftNarrowest" | "LeftWidest" | "LeftNarrow" | "LeftWide" | "Equal"

export type ChildFormItemsWidthEnterprise =
  | "Авто"
  | "ЛевыйОченьУзкий"
  | "ЛевыйОченьШирокий"
  | "ЛевыйУзкий"
  | "ЛевыйШирокий"
  | "Одинаковая"

export type ChoiceButtonRepresentation =
  | "Auto"
  | "ShowInDropList"
  | "ShowInDropListAndInInputField"
  | "ShowInInputField"

export type ChoiceButtonRepresentationEnterprise =
  | "Авто"
  | "ОтображатьВВыпадающемСписке"
  | "ОтображатьВВыпадающемСпискеИВПолеВвода"
  | "ОтображатьВПолеВвода"

export type ChoiceHistoryOnInput = "Auto" | "DontUse"

export type ChoiceHistoryOnInputEnterprise = "Авто" | "НеИспользовать"

export type ClipboardDataStandardFormat = "HTML" | "Picture" | "Text"

export type ClipboardDataStandardFormatEnterprise = "HTML" | "Картинка" | "Текст"

export type CollapseFormItemsByImportance = "Auto" | "Use" | "DontUse"

export type CollapseFormItemsByImportanceEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type ColorDepth = "BitPerPixel1" | "BitPerPixel24" | "BitPerPixel32" | "BitPerPixel4" | "BitPerPixel8"

export type ColorDepthEnterprise = "БитНаПиксел1" | "БитНаПиксел24" | "БитНаПиксел32" | "БитНаПиксел4" | "БитНаПиксел8"

export type ColumnEditMode = "Enter" | "EnterOnInput" | "Directly"

export type ColumnEditModeEnterprise = "Вход" | "ВходПриВводе" | "Непосредственно"

export type ColumnLocation = "SameColumn" | "OnNextRow" | "NewColumn"

export type ColumnLocationEnterprise = "ВТойЖеКолонке" | "НаСледующейСтроке" | "НоваяКолонка"

export type ColumnSizeChange = "Change" | "DontChange"

export type ColumnSizeChangeEnterprise = "Изменять" | "НеИзменять"

export type ColumnsGroup = "Vertical" | "InCell" | "Horizontal"

export type ColumnsGroupEnterprise = "Вертикальная" | "ВЯчейке" | "Горизонтальная"

export type CommandBarButtonAlignment = "Left" | "Right" | "Center"

export type CommandBarButtonAlignmentEnterprise = "Лево" | "Право" | "Центр"

export type CommandBarButtonOrder = "Asc" | "DontOrder" | "Desc"

export type CommandBarButtonOrderEnterprise = "Возр" | "НеУпорядочивать" | "Убыв"

export type CommandBarButtonRepresentation = "Auto" | "Picture" | "Text" | "PictureText"

export type CommandBarButtonRepresentationEnterprise = "Авто" | "Картинка" | "Надпись" | "НадписьКартинка"

export type CommandBarButtonType = "Action" | "Popup" | "Separator"

export type CommandBarButtonTypeEnterprise = "Действие" | "Подменю" | "Разделитель"

export type CommandGroupCategory = "FormCommandBar" | "ActionsPanel" | "NavigationPanel" | "FormNavigationPanel"

export type CommandGroupCategoryEnterprise =
  | "КоманднаяПанельФормы"
  | "ПанельДействий"
  | "ПанельНавигации"
  | "ПанельНавигацииФормы"

export type CommandParameterUseMode = "Multiple" | "Single"

export type CommandParameterUseModeEnterprise = "Множественный" | "Одиночный"

export type ConnectorLineType = "None" | "Dashed" | "DashDotted" | "DashDottedDotted" | "Solid" | "Dotted"

export type ConnectorLineTypeEnterprise =
  | "НетЛинии"
  | "Пунктир"
  | "ПунктирТочка"
  | "ПунктирТочкаТочка"
  | "Сплошная"
  | "Точечная"

export type ConnectorTextLocation = "FirstSegment" | "Middle"

export type ConnectorTextLocationEnterprise = "ПервыйСегмент" | "СерединаЛинии"

export type ControlBorderType =
  | "WithoutBorder"
  | "Indented"
  | "Embossed"
  | "Double"
  | "DoubleUnderline"
  | "Single"
  | "Underline"
  | "Rounded"
  | "Overline"

export type ControlBorderTypeEnterprise =
  | "БезРамки"
  | "Вдавленная"
  | "Выпуклая"
  | "Двойная"
  | "ДвойноеПодчеркивание"
  | "Одинарная"
  | "Подчеркивание"
  | "Скругленная"
  | "ЧертаСверху"

export type ControlCollapseMode = "Top" | "Left" | "None" | "Bottom" | "Right"

export type ControlCollapseModeEnterprise = "Верх" | "Лево" | "Нет" | "Низ" | "Право"

export type ControlEdge = "Top" | "Left" | "Bottom" | "Right" | "Center"

export type ControlEdgeEnterprise = "Верх" | "Лево" | "Низ" | "Право" | "Центр"

export type CurrentRowUse = "Auto" | "Use" | "DontUse"

export type CurrentRowUseEnterprise = "Авто" | "Использует" | "НеИспользует"

export type DataChangeType = "Create" | "Update" | "Delete"

export type DataChangeTypeEnterprise = "Добавление" | "Изменение" | "Удаление"

export type DateSelectionMode = "Interval" | "Multiple" | "Single"

export type DateSelectionModeEnterprise = "Интервал" | "Множественный" | "Одиночный"

export type DimensionAttributePlacementType = "Together" | "WithDimensions" | "Separately"

export type DimensionAttributePlacementTypeEnterprise = "Вместе" | "ВместеСИзмерениями" | "Отдельно"

export type DimensionPlacementType = "Together" | "Separately" | "SeparatelyAndInTotalsOnly"

export type DimensionPlacementTypeEnterprise = "Вместе" | "Отдельно" | "ОтдельноИТолькоВИтогах"

export type DisplayImportance = "Auto" | "High" | "Low" | "Usual" | "VeryHigh" | "VeryLow"

export type DisplayImportanceEnterprise = "Авто" | "Высокая" | "Низкая" | "Обычная" | "ОченьВысокая" | "ОченьНизкая"

export type DragAction = "Choice" | "Copy" | "Cancel" | "Move"

export type DragActionEnterprise = "Выбор" | "Копирование" | "Отмена" | "Перемещение"

export type DragAllowedActions = "Copy" | "CopyAndMove" | "DontProcess" | "Move"

export type DragAllowedActionsEnterprise = "Копирование" | "КопированиеИПеремещение" | "НеОбрабатывать" | "Перемещение"

export type DrawingSelectionShowMode = "Auto" | "DontShow" | "Show"

export type DrawingSelectionShowModeEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type EditTextUpdate = "Auto" | "Always" | "DontUse" | "OnValueChange"

export type EditTextUpdateEnterprise = "Авто" | "Всегда" | "НеИспользовать" | "ПриИзмененииЗначения"

export type FitPageMode = "Auto" | "PageWidth" | "Proportionally"

export type FitPageModeEnterprise = "Авто" | "ПоШиринеСтраницы" | "Пропорционально"

export type FixingInTable = "Left" | "None" | "Right"

export type FixingInTableEnterprise = "Лево" | "Нет" | "Право"

export type FoldersAndItems = "Auto" | "Folders" | "FoldersAndItems" | "Items"

export type FoldersAndItemsEnterprise = "Авто" | "Группы" | "ГруппыИЭлементы" | "Элементы"

export type FormButtonPictureLocation = "Auto" | "Left" | "Right"

export type FormButtonPictureLocationEnterprise = "Авто" | "Лево" | "Право"

export type FormButtonType = "Hyperlink" | "CommandBarHyperlink" | "CommandBarButton" | "UsualButton"

export type FormButtonTypeEnterprise =
  | "Гиперссылка"
  | "ГиперссылкаКоманднойПанели"
  | "КнопкаКоманднойПанели"
  | "ОбычнаяКнопка"

export type FormCommandBarLabelLocation = "Auto" | "Top" | "None" | "Bottom"

export type FormCommandBarLabelLocationEnterprise = "Авто" | "Верх" | "Нет" | "Низ"

export type FormConversationsRepresentation = "Auto" | "DontShow" | "Show"

export type FormConversationsRepresentationEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type FormDecorationType = "Picture" | "Label"

export type FormDecorationTypeEnterprise = "Картинка" | "Надпись"

export type FormFieldType =
  | "HTMLDocumentField"
  | "PDFDocumentField"
  | "InputField"
  | "GeographicalSchemaField"
  | "GraphicalSchemaField"
  | "DendrogramField"
  | "ChartField"
  | "GanttChartField"
  | "ProgressBarField"
  | "CalendarField"
  | "PictureField"
  | "LabelField"
  | "RadioButtonField"
  | "PeriodField"
  | "PlannerField"
  | "TrackBarField"
  | "SpreadsheetDocumentField"
  | "TextDocumentField"
  | "CheckBoxField"
  | "FormattedDocumentField"

export type FormFieldTypeEnterprise =
  | "ПолеHTMLДокумента"
  | "ПолеPDFДокумента"
  | "ПолеВвода"
  | "ПолеГеографическойСхемы"
  | "ПолеГрафическойСхемы"
  | "ПолеДендрограммы"
  | "ПолеДиаграммы"
  | "ПолеДиаграммыГанта"
  | "ПолеИндикатора"
  | "ПолеКалендаря"
  | "ПолеКартинки"
  | "ПолеНадписи"
  | "ПолеПереключателя"
  | "ПолеПериода"
  | "ПолеПланировщика"
  | "ПолеПолосыРегулирования"
  | "ПолеТабличногоДокумента"
  | "ПолеТекстовогоДокумента"
  | "ПолеФлажка"
  | "ПолеФорматированногоДокумента"

export type FormGroupType =
  | "ButtonGroup"
  | "ColumnGroup"
  | "CommandBar"
  | "ContextMenu"
  | "UsualGroup"
  | "Popup"
  | "Page"
  | "Pages"

export type FormGroupTypeEnterprise =
  | "ГруппаКнопок"
  | "ГруппаКолонок"
  | "КоманднаяПанель"
  | "КонтекстноеМеню"
  | "ОбычнаяГруппа"
  | "Подменю"
  | "Страница"
  | "Страницы"

export type FormItemAdditionType = "ViewStatusRepresentation" | "SearchStringRepresentation" | "SearchControl"

export type FormItemAdditionTypeEnterprise =
  | "ОтображениеСостоянияПросмотра"
  | "ОтображениеСтрокиПоиска"
  | "УправлениеПоиском"

export type FormItemCommandBarLabelLocation = "Auto" | "Top" | "None" | "Bottom"

export type FormItemCommandBarLabelLocationEnterprise = "Авто" | "Верх" | "Нет" | "Низ"

export type FormItemOrientation = "Vertical" | "Horizontal"

export type FormItemOrientationEnterprise = "Вертикально" | "Горизонтально"

export type FormItemSpacing = "Auto" | "Double" | "None" | "Single" | "Half" | "OneAndHalf"

export type FormItemSpacingEnterprise = "Авто" | "Двойной" | "Нет" | "Одинарный" | "Половинный" | "Полуторный"

export type FormItemTitleLocation = "Auto" | "Top" | "Left" | "None" | "Bottom" | "Right"

export type FormItemTitleLocationEnterprise = "Авто" | "Верх" | "Лево" | "Нет" | "Низ" | "Право"

export type FormPagesRepresentation =
  | "Auto"
  | "TabsOnTop"
  | "TabsOnLeftHorizontal"
  | "TabsOnBottom"
  | "TabsOnRightHorizontal"
  | "None"
  | "Swipe"

export type FormPagesRepresentationEnterprise =
  | "Авто"
  | "ЗакладкиСверху"
  | "ЗакладкиСлеваГоризонтально"
  | "ЗакладкиСнизу"
  | "ЗакладкиСправаГоризонтально"
  | "Нет"
  | "Пролистывание"

export type FormPagesState = "Titles" | "TitlesAndCurrentPage" | "CurrentPage"

export type FormPagesStateEnterprise = "Заголовки" | "ЗаголовкиИТекущаяСтраница" | "ТекущаяСтраница"

export type FormStandardURLVariant =
  | "ReportVariant"
  | "Record"
  | "ListCurrentRowRecord"
  | "Object"
  | "ListCurrentRowObject"
  | "Report"
  | "ReportWithCurrentSettings"
  | "List"
  | "ListWithCurrentSettings"
  | "ListWithCurrentSettingsAndRow"

export type FormStandardURLVariantEnterprise =
  | "ВариантОтчета"
  | "Запись"
  | "ЗаписьТекущейСтрокиСписка"
  | "Объект"
  | "ОбъектТекущейСтрокиСписка"
  | "Отчет"
  | "ОтчетСТекущимиНастройками"
  | "Список"
  | "СписокСТекущимиНастройками"
  | "СписокСТекущимиНастройкамиИСтрокой"

export type FormWindowOpeningMode = "LockWholeInterface" | "LockOwnerWindow" | "DontBlock"

export type FormWindowOpeningModeEnterprise = "БлокироватьВесьИнтерфейс" | "БлокироватьОкноВладельца" | "НеБлокировать"

export type GraphicalSchemaGridDrawMode = "Lines" | "None" | "Dots" | "Chess"

export type GraphicalSchemaGridDrawModeEnterprise = "Линии" | "НеРисовать" | "Точки" | "ШахматнаяСетка"

export type GraphicalSchemaItemPictureLocation = "Top" | "Left" | "Bottom" | "Right" | "Center"

export type GraphicalSchemaItemPictureLocationEnterprise = "Верх" | "Лево" | "Низ" | "Право" | "Центр"

export type GraphicalSchemaShapes =
  | "Block"
  | "Document"
  | "None"
  | "Folder"
  | "VerticalBrackets"
  | "HorizontalBrackets"
  | "UpArrow"
  | "UpDownArrow"
  | "LeftArrow"
  | "LeftRightArrow"
  | "DownArrow"
  | "RightArrow"
  | "File"
  | "Ellipse"

export type GraphicalSchemaShapesEnterprise =
  | "Блок"
  | "Документ"
  | "Нет"
  | "Папка"
  | "СкобкиВертикальные"
  | "СкобкиГоризонтальные"
  | "СтрелкаВверх"
  | "СтрелкаВверхВниз"
  | "СтрелкаВлево"
  | "СтрелкаВлевоВправо"
  | "СтрелкаВниз"
  | "СтрелкаВправо"
  | "Файл"
  | "Эллипс"

export type GraphicalSchemeElementSideType = "Top" | "Left" | "Bottom" | "Right" | "Center"

export type GraphicalSchemeElementSideTypeEnterprise = "Верх" | "Лево" | "Низ" | "Право" | "Центр"

export type HTMLDocumentFieldMode = "Browse" | "Design"

export type HTMLDocumentFieldModeEnterprise = "Просмотр" | "Редактирование"

export type HorizontalAlign = "Auto" | "Left" | "Justify" | "Right" | "Center"

export type HorizontalAlignEnterprise = "Авто" | "Лево" | "ПоШирине" | "Право" | "Центр"

export type IncompleteChoiceMode = "OnActivate" | "OnEnterPressed"

export type IncompleteChoiceModeEnterprise = "ПриАктивизации" | "ПриНажатииEnter"

export type InitialListView = "Auto" | "End" | "Beginning"

export type InitialListViewEnterprise = "Авто" | "Конец" | "Начало"

export type InitialTreeView = "NoExpand" | "ExpandTopLevel" | "ExpandAllLevels"

export type InitialTreeViewEnterprise = "НеРаскрывать" | "РаскрыватьВерхнийУровень" | "РаскрыватьВсеУровни"

export type InputFieldAutofillHint =
  | "Email"
  | "City"
  | "GivenName"
  | "UserName"
  | "PostalCode"
  | "DontUse"
  | "NewPassword"
  | "CreditCardNumber"
  | "PhoneNumber"
  | "OneTimeCode"
  | "MiddleName"
  | "Password"
  | "FullName"
  | "NamePrefix"
  | "Region"
  | "Country"
  | "NameSuffix"
  | "Street"
  | "FamilyName"

export type InputFieldAutofillHintEnterprise =
  | "Email"
  | "Город"
  | "Имя"
  | "ИмяПользователя"
  | "Индекс"
  | "НеИспользовать"
  | "НовыйПароль"
  | "НомерБанковскойКарты"
  | "НомерТелефона"
  | "ОдноразовыйПароль"
  | "Отчество"
  | "Пароль"
  | "ПолноеИмя"
  | "ПрефиксИмени"
  | "Регион"
  | "Страна"
  | "СуффиксИмени"
  | "Улица"
  | "Фамилия"

export type InputFieldCommandSource = "MultipleValue" | "InputArea"

export type InputFieldCommandSourceEnterprise = "МножественноеЗначение" | "ОбластьВвода"

export type InputFieldMultipleValuePictureShape = "Auto" | "Rect" | "Circle"

export type InputFieldMultipleValuePictureShapeEnterprise = "Авто" | "Квадрат" | "Круг"

export type InputFieldMultipleValuePictureSize = "Auto" | "Large" | "Small" | "Medium"

export type InputFieldMultipleValuePictureSizeEnterprise = "Авто" | "Крупный" | "Маленький" | "Средний"

export type InputFieldStandardCommand =
  | "Paste"
  | "Choose"
  | "SelectAll"
  | "Cut"
  | "AddEmptyValue"
  | "Copy"
  | "SearchEverywhere"
  | "Open"
  | "Clear"
  | "Create"
  | "Delete"

export type InputFieldStandardCommandEnterprise =
  | "Вставить"
  | "Выбрать"
  | "ВыделитьВсе"
  | "Вырезать"
  | "ДобавитьПустоеЗначение"
  | "Копировать"
  | "НайтиВезде"
  | "Открыть"
  | "Очистить"
  | "Создать"
  | "Удалить"

export type ItemHeightControlVariant = "Auto" | "UseHeightInFormRows" | "UseContentHeight"

export type ItemHeightControlVariantEnterprise = "Авто" | "ВСтрокахФормы" | "ПоСодержимому"

export type ItemHorizontalLocation = "Auto" | "Left" | "Right" | "Center"

export type ItemHorizontalLocationEnterprise = "Авто" | "Лево" | "Право" | "Центр"

export type ItemVerticalAlign = "Auto" | "Top" | "Bottom" | "Center"

export type ItemVerticalAlignEnterprise = "Авто" | "Верх" | "Низ" | "Центр"

export type ItemsAndTitlesAlignVariant =
  | "Auto"
  | "None"
  | "ItemsLeftTitlesLeft"
  | "ItemsLeftTitlesRight"
  | "ItemsRightTitlesLeft"
  | "ItemsRightTitlesRight"

export type ItemsAndTitlesAlignVariantEnterprise =
  | "Авто"
  | "Нет"
  | "ЭлементыЛевоЗаголовкиЛево"
  | "ЭлементыЛевоЗаголовкиПраво"
  | "ЭлементыПравоЗаголовкиЛево"
  | "ЭлементыПравоЗаголовкиПраво"

export type LabelPictureLocation = "Top" | "Left" | "Bottom" | "Right" | "Center"

export type LabelPictureLocationEnterprise = "Верх" | "Лево" | "Низ" | "Право" | "Центр"

export type LinkedValueChangeMode = "DontChange" | "Clear"

export type LinkedValueChangeModeEnterprise = "НеИзменять" | "Очищать"

export type ListEditMode = "InDialog" | "InList"

export type ListEditModeEnterprise = "ВДиалоге" | "ВСписке"

export type MainClientApplicationWindowMode =
  | "EmbeddedWorkplace"
  | "Kiosk"
  | "Normal"
  | "FullscreenWorkplace"
  | "Workplace"

export type MainClientApplicationWindowModeEnterprise =
  | "ВстроенноеРабочееМесто"
  | "Киоск"
  | "Обычный"
  | "ПолноэкранноеРабочееМесто"
  | "РабочееМесто"

export type NewRowShowCheckVariant = "DontCheck" | "FilterMismatchMessage"

export type NewRowShowCheckVariantEnterprise = "НеПроверять" | "СообщатьОНесоответствииОтбору"

export type OnScreenKeyboardReturnKeyText =
  | "Auto"
  | "Return"
  | "Done"
  | "Next"
  | "Search"
  | "Send"
  | "Go"
  | "Join"
  | "Continue"

export type OnScreenKeyboardReturnKeyTextEnterprise =
  | "Авто"
  | "Ввод"
  | "Готово"
  | "Далее"
  | "Найти"
  | "Отправить"
  | "Перейти"
  | "Подключиться"
  | "Продолжить"

export type Orientation = "Auto" | "Vertical" | "Horizontal"

export type OrientationEnterprise = "Авто" | "Вертикально" | "Горизонтально"

export type PanelPictureLocation = "Top" | "Left" | "Bottom" | "Right" | "Center"

export type PanelPictureLocationEnterprise = "Верх" | "Лево" | "Низ" | "Право" | "Центр"

export type PictureFormat = "BMP" | "EMF" | "GIF" | "Icon" | "JPEG" | "PNG" | "SVG" | "TIFF" | "WMF" | "UnknownFormat"

export type PictureFormatEnterprise =
  | "BMP"
  | "EMF"
  | "GIF"
  | "Icon"
  | "JPEG"
  | "PNG"
  | "SVG"
  | "TIFF"
  | "WMF"
  | "НеизвестныйФормат"

export type PictureSize =
  | "AutoSize"
  | "AutoSizeIgnoreScale"
  | "ByFontSize"
  | "Proportionally"
  | "Stretch"
  | "RealSize"
  | "RealSizeIgnoreScale"
  | "Tile"

export type PictureSizeEnterprise =
  | "АвтоРазмер"
  | "АвтоРазмерБезУчетаМасштаба"
  | "ПоРазмеруШрифта"
  | "Пропорционально"
  | "Растянуть"
  | "РеальныйРазмер"
  | "РеальныйРазмерБезУчетаМасштаба"
  | "Черепица"

export type PrintDialogUseMode = "Use" | "DontUse"

export type PrintDialogUseModeEnterprise = "Использовать" | "НеИспользовать"

export type ProgressBarSmoothingMode = "Smooth" | "Broken" | "BrokenTilt"

export type ProgressBarSmoothingModeEnterprise = "Плавный" | "Прерывистый" | "ПрерывистыйНаклонный"

export type RadioButtonType = "Auto" | "RadioButton" | "Tumbler"

export type RadioButtonTypeEnterprise = "Авто" | "Переключатель" | "Тумблер"

export type RefreshRequestMethod = "None" | "PullFromTop" | "PullFromTopOrBottom" | "PullFromBottom"

export type RefreshRequestMethodEnterprise = "Нет" | "ПотянутьСверху" | "ПотянутьСверхуИлиСнизу" | "ПотянутьСнизу"

export type ReportFormType = "Variant" | "Settings" | "Main"

export type ReportFormTypeEnterprise = "Вариант" | "Настройка" | "Основная"

export type ReportResultViewMode = "Auto" | "Compact" | "Default"

export type ReportResultViewModeEnterprise = "Авто" | "Компактный" | "Обычный"

export type SaveFormDataInSettings = "UseList" | "DontUse"

export type SaveFormDataInSettingsEnterprise = "ИспользоватьСписок" | "НеИспользовать"

export type ScrollBarUse = "AutoUse" | "UseAlways" | "DontUse"

export type ScrollBarUseEnterprise = "ИспользоватьАвтоматически" | "ИспользоватьВсегда" | "НеИспользовать"

export type ScrollingTextMode = "Fast" | "Slow" | "DontUse" | "Normal" | "VeryFast" | "VerySlow"

export type ScrollingTextModeEnterprise =
  | "Быстро"
  | "Медленно"
  | "НеИспользовать"
  | "Нормально"
  | "ОченьБыстро"
  | "ОченьМедленно"

export type SearchControlLocation = "Auto" | "CommandBar" | "None"

export type SearchControlLocationEnterprise = "Авто" | "КоманднаяПанель" | "Нет"

export type SearchInTableOnInput = "Auto" | "Use" | "DontUse"

export type SearchInTableOnInputEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type SearchStringLocation = "Auto" | "Top" | "FormCaption" | "CommandBar" | "Bottom" | "PullFromTop" | "None"

export type SearchStringLocationEnterprise =
  | "Авто"
  | "Верх"
  | "ЗаголовокФормы"
  | "КоманднаяПанель"
  | "Низ"
  | "ПотянутьСверху"
  | "Нет"

export type SelectionShowMode =
  | "Always"
  | "DontShow"
  | "WhenActive"
  | "WhenMultipleCellsSelected"
  | "WhenMultipleCellsSelectedWhenActive"

export type SelectionShowModeEnterprise =
  | "Всегда"
  | "НеОтображать"
  | "ПриАктивности"
  | "ПриВыделенииНесколькихЯчеек"
  | "ПриВыделенииНесколькихЯчеекПриАктивности"

export type ShowTabs =
  | "DontUse"
  | "Top"
  | "TopMultiLine"
  | "TopMultilineTransposition"
  | "TopScrolling"
  | "LeftVertical"
  | "LeftHorizontal"
  | "Bottom"
  | "BottomMultiLine"
  | "BottomMultilineTransposition"
  | "BottomScrolling"
  | "RightVertical"
  | "RightHorizontal"

export type ShowTabsEnterprise =
  | "НеИспользовать"
  | "Сверху"
  | "СверхуМногострочный"
  | "СверхуМногострочныйСПерестановкой"
  | "СверхуСПрокруткой"
  | "СлеваВертикально"
  | "СлеваГоризонтально"
  | "Снизу"
  | "СнизуМногострочный"
  | "СнизуМногострочныйСПерестановкой"
  | "СнизуСПрокруткой"
  | "СправаВертикально"
  | "СправаГоризонтально"

export type SizeChangeMode = "QuickChange" | "Normal"

export type SizeChangeModeEnterprise = "БыстроеИзменение" | "Обычный"

export type SpecialTextInputMode = "Email" | "URL" | "Auto" | "None" | "PhoneNumber" | "Digits" | "DigitsAndPunctuation"

export type SpecialTextInputModeEnterprise =
  | "Email"
  | "URL"
  | "Авто"
  | "Нет"
  | "НомерТелефона"
  | "Цифры"
  | "ЦифрыИПунктуация"

export type SpellCheckingOnTextInput = "Auto" | "Use" | "DontUse"

export type SpellCheckingOnTextInputEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type StandardAppearance =
  | "Orange"
  | "Asphalt"
  | "None"
  | "Turquoise"
  | "Bronze"
  | "Spring"
  | "Wood"
  | "Winter"
  | "Interface"
  | "Stone"
  | "Classic"
  | "Classic2"
  | "Classic3"
  | "Ice"
  | "Summer"
  | "Copper"
  | "Autumn"
  | "Sand"
  | "Platinum"
  | "Silver"
  | "Textile"
  | "Grass"

export type StandardAppearanceEnterprise =
  | "Апельсин"
  | "Асфальт"
  | "БезОформления"
  | "Бирюза"
  | "Бронза"
  | "Весна"
  | "Дерево"
  | "Зима"
  | "Интерфейс"
  | "Камень"
  | "Классика"
  | "Классика2"
  | "Классика3"
  | "Лед"
  | "Лето"
  | "Медь"
  | "Осень"
  | "Песок"
  | "Платина"
  | "Серебро"
  | "Текстиль"
  | "Трава"

export type StandardCommandsGroup =
  | "FormCommandBarImportant"
  | "FormCommandBarCreateBasedOn"
  | "ActionsPanelReports"
  | "ActionsPanelTools"
  | "ActionsPanelCreate"
  | "NavigationPanelImportant"
  | "NavigationPanelOrdinary"
  | "NavigationPanelSeeAlso"
  | "FormNavigationPanelImportant"
  | "FormNavigationPanelGoTo"
  | "FormNavigationPanelSeeAlso"

export type StandardCommandsGroupEnterprise =
  | "КоманднаяПанельФормыВажное"
  | "КоманднаяПанельФормыСоздатьНаОсновании"
  | "ПанельДействийОтчеты"
  | "ПанельДействийСервис"
  | "ПанельДействийСоздать"
  | "ПанельНавигацииВажное"
  | "ПанельНавигацииОбычное"
  | "ПанельНавигацииСмТакже"
  | "ПанельНавигацииФормыВажное"
  | "ПанельНавигацииФормыПерейти"
  | "ПанельНавигацииФормыСмТакже"

export type TableBehaviorOnHorizontalCompression = "Auto" | "MoveItemsByImportance" | "HideItemsByImportance"

export type TableBehaviorOnHorizontalCompressionEnterprise =
  | "Авто"
  | "ПереноситьЭлементыПоВажности"
  | "СкрыватьЭлементыПоВажности"

export type TableBoxRowInputMode = "EndOfWindow" | "EndOfList" | "BeforeCurrentRow" | "AfterCurrentRow"

export type TableBoxRowInputModeEnterprise =
  | "ВКонецОкна"
  | "ВКонецСписка"
  | "ПередТекущейСтрокой"
  | "ПослеТекущейСтроки"

export type TableBoxRowSelectionMode = "Row" | "Cell"

export type TableBoxRowSelectionModeEnterprise = "Строка" | "Ячейка"

export type TableBoxSelectionMode = "MultiLine" | "SingleLine"

export type TableBoxSelectionModeEnterprise = "Множественный" | "Одиночный"

export type TableCurrentRowUse = "Auto" | "Choice" | "SelectionPresentation" | "SelectionPresentationAndChoice"

export type TableCurrentRowUseEnterprise = "Авто" | "Выбор" | "ОтображениеВыделения" | "ОтображениеВыделенияИВыбор"

export type TableHeightControlVariant = "Auto" | "UseHeightInTableRows" | "UseHeightInFormRows" | "UseContentHeight"

export type TableHeightControlVariantEnterprise = "Авто" | "ВСтрокахТаблицы" | "ВСтрокахФормы" | "ПоСодержимому"

export type TableRepresentation = "Tree" | "HierarchicalList" | "List"

export type TableRepresentationEnterprise = "Дерево" | "ИерархическийСписок" | "Список"

export type TableRowInputMode = "EndOfWindow" | "EndOfList" | "BeforeCurrentRow" | "AfterCurrentRow"

export type TableRowInputModeEnterprise = "ВКонецОкна" | "ВКонецСписка" | "ПередТекущейСтрокой" | "ПослеТекущейСтроки"

export type TableRowSelectionMode = "Row" | "Cell"

export type TableRowSelectionModeEnterprise = "Строка" | "Ячейка"

export type TableSelectionMode = "MultiRow" | "SingleRow"

export type TableSelectionModeEnterprise = "Множественный" | "Одиночный"

export type TaskListMode = "AllTasks" | "ByPerformer"

export type TaskListModeEnterprise = "ВсеЗадачи" | "ПоИсполнителю"

export type TextDirection = "LeftToRight" | "RightToLeft"

export type TextDirectionEnterprise = "СлеваНаправо" | "СправаНалево"

export type ThroughAlign = "Auto" | "Use" | "DontUse"

export type ThroughAlignEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type TimeScalePosition = "Top" | "Left" | "Bottom" | "Right"

export type TimeScalePositionEnterprise = "Верх" | "Лево" | "Низ" | "Право"

export type TitleLocation = "TitleLeft" | "TitleRight"

export type TitleLocationEnterprise = "ЗаголовокСлева" | "ЗаголовокСправа"

export type ToolTipRepresentation =
  | "Auto"
  | "Balloon"
  | "Button"
  | "None"
  | "ShowAuto"
  | "ShowTop"
  | "ShowLeft"
  | "ShowBottom"
  | "ShowRight"

export type ToolTipRepresentationEnterprise =
  | "Авто"
  | "Всплывающая"
  | "Кнопка"
  | "Нет"
  | "ОтображатьАвто"
  | "ОтображатьСверху"
  | "ОтображатьСлева"
  | "ОтображатьСнизу"
  | "ОтображатьСправа"

export type TrackBarMarkingAppearance = "DontShow" | "TopLeft" | "BottomRight" | "BothSides"

export type TrackBarMarkingAppearanceEnterprise = "НеОтображать" | "СверхуИлиСлева" | "СнизуИлиСправа" | "СОбоихСторон"

export type UseMenuMode = "Use" | "UseExtra" | "DontUse"

export type UseMenuModeEnterprise = "Использовать" | "ИспользоватьДополнительно" | "НеИспользовать"

export type UseOutput = "Auto" | "Disable" | "Enable"

export type UseOutputEnterprise = "Авто" | "Запретить" | "Разрешить"

export type UserNotificationStatus = "Important" | "Information"

export type UserNotificationStatusEnterprise = "Важное" | "Информация"

export type UsualGroupBehavior = "Auto" | "PopUp" | "Usual" | "Collapsible"

export type UsualGroupBehaviorEnterprise = "Авто" | "Всплывающая" | "Обычное" | "Свертываемая"

export type UsualGroupControlRepresentation = "TitleHyperlink" | "Picture"

export type UsualGroupControlRepresentationEnterprise = "ГиперссылкаЗаголовка" | "Картинка"

export type UsualGroupRepresentation = "None" | "NormalSeparation" | "StrongSeparation" | "WeakSeparation"

export type UsualGroupRepresentationEnterprise = "Нет" | "ОбычноеВыделение" | "СильноеВыделение" | "СлабоеВыделение"

export type VerticalAlign = "Top" | "Bottom" | "Center"

export type VerticalAlignEnterprise = "Верх" | "Низ" | "Центр"

export type VerticalFormScroll = "Auto" | "Use" | "UseWithoutStretch" | "UseIfNecessary"

export type VerticalFormScrollEnterprise =
  | "Авто"
  | "Использовать"
  | "ИспользоватьБезРастягивания"
  | "ИспользоватьПриНеобходимости"

export type ViewModeApplicationOnSetReportResult = "Auto" | "DontApply" | "Apply"

export type ViewModeApplicationOnSetReportResultEnterprise = "Авто" | "НеПрименять" | "Применять"

export type ViewScalingMode = "Auto" | "Large" | "Normal"

export type ViewScalingModeEnterprise = "Авто" | "Крупный" | "Обычный"

export type ViewStatusLocation = "Auto" | "Top" | "None" | "Bottom"

export type ViewStatusLocationEnterprise = "Авто" | "Верх" | "Нет" | "Низ"

export type WarningOnEditRepresentation = "Auto" | "DontShow" | "Show"

export type WarningOnEditRepresentationEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type WindowAppearanceModeChange = "Auto" | "Disable" | "Enable"

export type WindowAppearanceModeChangeEnterprise = "Авто" | "Запретить" | "Разрешить"

export type WindowAppearanceModeVariant = "Maximized" | "Minimized" | "Normal"

export type WindowAppearanceModeVariantEnterprise = "Максимизированное" | "Минимизированное" | "Нормальное"

export type WindowDockVariant = "Top" | "Left" | "Bottom" | "Right"

export type WindowDockVariantEnterprise = "Верх" | "Лево" | "Низ" | "Право"

export type WindowLocationVariant = "Auto" | "DontOverlapOwner" | "Center"

export type WindowLocationVariantEnterprise = "Авто" | "НеПерекрыватьВладельца" | "Центрировать"

export type WindowSizeChange = "Change" | "DontChange"

export type WindowSizeChangeEnterprise = "Изменять" | "НеИзменять"

export type WindowStateVariant = "Normal" | "Docked" | "Autohide" | "Float"

export type WindowStateVariantEnterprise = "Обычное" | "Прикрепленное" | "Прячущееся" | "Свободное"

export type AutoSeriesSeparation = "All" | "Maximum" | "Minimum" | "None"

export type AutoSeriesSeparationEnterprise = "Все" | "Максимум" | "Минимум" | "Нет"

export type BarChartPointsOrder = "Auto" | "TopToBottom" | "BottomToTop"

export type BarChartPointsOrderEnterprise = "Авто" | "СверхуВниз" | "СнизуВверх"

export type BubbleChartNegativeValuesShowMode = "InvertedBackColor" | "DontShow" | "Abs" | "Transparent"

export type BubbleChartNegativeValuesShowModeEnterprise =
  | "ИнвертированныйЦветФона"
  | "НеОтображать"
  | "ПоМодулю"
  | "ПрозрачныйФон"

export type ChartAnimation = "Auto" | "Use" | "DontUse"

export type ChartAnimationEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type ChartBoundaryDetectionMethod = "AutoDetect" | "UseValue" | "UseValueWithLimitations"

export type ChartBoundaryDetectionMethodEnterprise =
  | "АвтоОпределение"
  | "ИспользоватьЗначение"
  | "ИспользоватьЗначениеСОграничением"

export type ChartBubbleSizeValueSource = "None" | "CommonSeries" | "NextSeries"

export type ChartBubbleSizeValueSourceEnterprise = "Нет" | "ОбщаяСерия" | "СледующаяСерия"

export type ChartBubbleSizing = "IncreaseDiameter" | "IncreaseArea" | "DecreaseDiameter" | "DecreaseArea"

export type ChartBubbleSizingEnterprise =
  | "УвеличениеДиаметра"
  | "УвеличениеПлощади"
  | "УменьшениеДиаметра"
  | "УменьшениеПлощади"

export type ChartColorPalette =
  | "Auto"
  | "Gradient"
  | "Yellow"
  | "Green"
  | "Soft"
  | "SoftAdaptive"
  | "Orange"
  | "Palette32"
  | "Palette8"
  | "Pastel"
  | "Custom"
  | "Gray"
  | "Blue"
  | "Warm"
  | "Cold"
  | "Bright"

export type ChartColorPaletteEnterprise =
  | "Авто"
  | "Градиентная"
  | "Желтая"
  | "Зеленая"
  | "Мягкая"
  | "МягкаяАдаптивная"
  | "Оранжевая"
  | "Палитра32"
  | "Палитра8"
  | "Пастельная"
  | "Произвольная"
  | "Серая"
  | "Синяя"
  | "Теплая"
  | "Холодная"
  | "Яркая"

export type ChartGridLinesShowMode = "Auto" | "DontShow" | "Show"

export type ChartGridLinesShowModeEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type ChartLabelLocation =
  | "Auto"
  | "Edge"
  | "EdgeAuto"
  | "EdgeInside"
  | "TopLeft"
  | "BottomLeft"
  | "TopRight"
  | "BottomRight"
  | "EmptySpace"
  | "TopAndLeftSpecified"
  | "Center"

export type ChartLabelLocationEnterprise =
  | "Авто"
  | "Край"
  | "КрайАвто"
  | "КрайВнутри"
  | "ЛевоВерх"
  | "ЛевоНиз"
  | "ПравоВерх"
  | "ПравоНиз"
  | "СвободноеМесто"
  | "УказываетсяЛевоИВерх"
  | "Центр"

export type ChartLabelType =
  | "Value"
  | "ValuePercent"
  | "ValueSize"
  | "None"
  | "Percent"
  | "Series"
  | "SeriesValue"
  | "SeriesValuePercent"
  | "SeriesValueSize"
  | "SeriesPercent"
  | "SeriesSize"
  | "SeriesPoint"
  | "SeriesPointValue"
  | "SeriesPointValuePercent"
  | "SeriesPointValueSize"
  | "SeriesPointPercent"
  | "SeriesPointSize"
  | "Point"
  | "PointValue"
  | "PointValuePercent"
  | "PointValueSize"
  | "PointPercent"
  | "PointSize"

export type ChartLabelTypeEnterprise =
  | "Значение"
  | "ЗначениеПроцент"
  | "ЗначениеРазмер"
  | "Нет"
  | "Процент"
  | "Серия"
  | "СерияЗначение"
  | "СерияЗначениеПроцент"
  | "СерияЗначениеРазмер"
  | "СерияПроцент"
  | "СерияРазмер"
  | "СерияТочка"
  | "СерияТочкаЗначение"
  | "СерияТочкаЗначениеПроцент"
  | "СерияТочкаЗначениеРазмер"
  | "СерияТочкаПроцент"
  | "СерияТочкаРазмер"
  | "Точка"
  | "ТочкаЗначение"
  | "ТочкаЗначениеПроцент"
  | "ТочкаЗначениеРазмер"
  | "ТочкаПроцент"
  | "ТочкаРазмер"

export type ChartLabelsOrientation = "Auto" | "Vertical" | "Horizontal" | "CustomAngle"

export type ChartLabelsOrientationEnterprise = "Авто" | "Вертикально" | "Горизонтально" | "ПроизвольныйУголНаклона"

export type ChartLegendPlacement = "Auto" | "Top" | "Left" | "None" | "Bottom" | "Right" | "UseCoordinates"

export type ChartLegendPlacementEnterprise =
  | "Авто"
  | "Верх"
  | "Лево"
  | "Нет"
  | "Низ"
  | "Право"
  | "УказываетсяРасположение"

export type ChartLineType = "None" | "Dashed" | "DashDotted" | "DashDottedDotted" | "Solid" | "Dotted"

export type ChartLineTypeEnterprise =
  | "НетЛинии"
  | "Пунктир"
  | "ПунктирТочка"
  | "ПунктирТочкаТочка"
  | "Сплошная"
  | "Точечная"

export type ChartMarkerType = "Auto" | "Rect" | "Circle" | "None" | "Rhomb" | "Alternation"

export type ChartMarkerTypeEnterprise = "Авто" | "Квадрат" | "Круг" | "Нет" | "Ромб" | "Чередование"

export type ChartOrientation = "SouthEast" | "SouthWest"

export type ChartOrientationEnterprise = "ЮгВосток" | "ЮгЗапад"

export type ChartPlotAreaPlacement = "Auto" | "EmptySpace" | "UseCoordinates"

export type ChartPlotAreaPlacementEnterprise = "Авто" | "СвободноеМесто" | "УказываетсяРасположение"

export type ChartPointsAxisValuesSource = "Auto" | "Series" | "Points"

export type ChartPointsAxisValuesSourceEnterprise = "Авто" | "Серия" | "Точки"

export type ChartPointsConnectionType = "Auto" | "DontConnect" | "Connect"

export type ChartPointsConnectionTypeEnterprise = "Авто" | "НеСоединять" | "Соединять"

export type ChartReferenceBandBorderPosition = "Auto" | "OnValue" | "BetweenValues"

export type ChartReferenceBandBorderPositionEnterprise = "Авто" | "ВЗначении" | "МеждуЗначениями"

export type ChartReferenceLinePosition = "Auto" | "OnValue" | "BetweenValues"

export type ChartReferenceLinePositionEnterprise = "Авто" | "ВЗначении" | "МеждуЗначениями"

export type ChartScaleLabelLocation = "Auto" | "Inside" | "None" | "Outside"

export type ChartScaleLabelLocationEnterprise = "Авто" | "Внутри" | "Нет" | "Снаружи"

export type ChartScaleLocation = "Auto" | "BaseValue" | "Edge"

export type ChartScaleLocationEnterprise = "Авто" | "БазовоеЗначение" | "Край"

export type ChartScaleMarkLocation = "Auto" | "Inside" | "None" | "Outside" | "Center"

export type ChartScaleMarkLocationEnterprise = "Авто" | "Внутри" | "Нет" | "Снаружи" | "Центр"

export type ChartScaleTitlePlacement = "SpecialArea" | "PlotArea" | "WithAxis"

export type ChartScaleTitlePlacementEnterprise = "ВВыделеннойОбласти" | "ВОбластиПостроения" | "РядомСОсью"

export type ChartScaleTitleTextSource = "Auto" | "AutoText" | "UseText"

export type ChartScaleTitleTextSourceEnterprise = "Авто" | "АвтоТекст" | "ИспользоватьТекст"

export type ChartSelectionMode = "Auto" | "ValuesSelection" | "PointsSelection" | "None"

export type ChartSelectionModeEnterprise = "Авто" | "ВыделениеЗначений" | "ВыделениеТочек" | "Нет"

export type ChartSemitransparencyMode = "Auto" | "AutoCalculate" | "Use" | "DontUse"

export type ChartSemitransparencyModeEnterprise = "Авто" | "АвтоматическийРасчет" | "Использовать" | "НеИспользовать"

export type ChartSeriesGraphicalRepresentationType = "Auto" | "Column" | "Column3D" | "Line" | "Step" | "Area"

export type ChartSeriesGraphicalRepresentationTypeEnterprise =
  | "Авто"
  | "Гистограмма"
  | "ГистограммаОбъемная"
  | "График"
  | "ГрафикПоШагам"
  | "ГрафикСОбластями"

export type ChartSeriesOrderInLegend = "Auto" | "Reverse" | "Direct"

export type ChartSeriesOrderInLegendEnterprise = "Авто" | "Обратный" | "Прямой"

export type ChartSeriesStackType = "Auto" | "Unstacked" | "Stacked" | "StackedNormalized"

export type ChartSeriesStackTypeEnterprise = "Авто" | "БезНакопления" | "СНакоплением" | "СНакоплениемНормированная"

export type ChartSpaceMode = "None" | "Full" | "Half"

export type ChartSpaceModeEnterprise = "Нет" | "ПолнаяШирина" | "ПоловинаШирины"

export type ChartSplineMode = "SmoothCurve" | "None"

export type ChartSplineModeEnterprise = "ГладкаяКривая" | "Нет"

export type ChartTitleAreaPlacement =
  | "Auto"
  | "Top"
  | "LeftTop"
  | "LeftBottom"
  | "None"
  | "Bottom"
  | "RightTop"
  | "RightBottom"
  | "UseCoordinates"

export type ChartTitleAreaPlacementEnterprise =
  | "Авто"
  | "Верх"
  | "ЛевоВерх"
  | "ЛевоНиз"
  | "Нет"
  | "Низ"
  | "ПравоВерх"
  | "ПравоНиз"
  | "УказываетсяРасположение"

export type ChartTrendlineApproximationType = "Linear" | "Logarithmic" | "Polynomial" | "Power" | "Exponential"

export type ChartTrendlineApproximationTypeEnterprise =
  | "Линейный"
  | "Логарифмический"
  | "Полиномиальный"
  | "Степенной"
  | "Экспоненциальный"

export type ChartTrendlineFactor = "Auto" | "PointValue" | "PointNumber"

export type ChartTrendlineFactorEnterprise = "Авто" | "ЗначениеТочки" | "НомерТочки"

export type ChartType =
  | "Stock"
  | "OpenHighLowClose"
  | "ConcaveSurface"
  | "Waterfall"
  | "Funnel"
  | "NormalizedFunnel"
  | "NormalizedFunnel3D"
  | "Funnel3D"
  | "ConvexSurface"
  | "Column"
  | "Bar"
  | "Bar3D"
  | "NormalizedColumn"
  | "NormalizedBar"
  | "NormalizedBar3D"
  | "NormalizedColumn3D"
  | "Column3D"
  | "StackedColumn"
  | "StackedBar"
  | "StackedBar3D"
  | "StackedColumn3D"
  | "Line"
  | "Step"
  | "StackedLine"
  | "Area"
  | "StackedArea"
  | "NormalizedArea"
  | "ShadedSurface"
  | "Gauge"
  | "BarGraph"
  | "TapeGraph"
  | "CeilGraph"
  | "PyramidGraph"
  | "WireframeSurface"
  | "Donut"
  | "Donut3D"
  | "Pie"
  | "Pie3D"
  | "Surface"
  | "Bubble"
  | "RadarLine"
  | "RadarStackedLine"
  | "RadarArea"
  | "RadarStackedArea"
  | "RadarNormalizedArea"
  | "Honeycomb"
  | "Scatter"

export type ChartTypeEnterprise =
  | "Биржевая"
  | "БиржеваяСвеча"
  | "ВогнутаяПоверхность"
  | "Водопад"
  | "Воронка"
  | "ВоронкаНормированная"
  | "ВоронкаНормированнаяОбъемная"
  | "ВоронкаОбъемная"
  | "ВыпуклаяПоверхность"
  | "Гистограмма"
  | "ГистограммаГоризонтальная"
  | "ГистограммаГоризонтальнаяОбъемная"
  | "ГистограммаНормированная"
  | "ГистограммаНормированнаяГоризонтальная"
  | "ГистограммаНормированнаяГоризонтальнаяОбъемная"
  | "ГистограммаНормированнаяОбъемная"
  | "ГистограммаОбъемная"
  | "ГистограммаСНакоплением"
  | "ГистограммаСНакоплениемГоризонтальная"
  | "ГистограммаСНакоплениемГоризонтальнаяОбъемная"
  | "ГистограммаСНакоплениемОбъемная"
  | "График"
  | "ГрафикПоШагам"
  | "ГрафикСНакоплением"
  | "ГрафикСОбластями"
  | "ГрафикСОбластямиИНакоплением"
  | "ГрафикСОбластямиНормированный"
  | "ЗатененнаяПоверхность"
  | "Измерительная"
  | "Изометрическая"
  | "ИзометрическаяЛента"
  | "ИзометрическаяНепрерывная"
  | "ИзометрическаяПирамида"
  | "КаркаснаяПоверхность"
  | "Кольцевая"
  | "КольцеваяОбъемная"
  | "Круговая"
  | "КруговаяОбъемная"
  | "Поверхность"
  | "Пузырьковая"
  | "РадарныйГрафик"
  | "РадарныйГрафикСНакоплением"
  | "РадарныйГрафикСОбластями"
  | "РадарныйГрафикСОбластямиИНакоплением"
  | "РадарныйГрафикСОбластямиНормированный"
  | "Сотовая"
  | "Точечная"

export type ChartValueEditState = "Finished" | "NotFinished" | "Canceled"

export type ChartValueEditStateEnterprise = "Завершено" | "НеЗавершено" | "Отменено"

export type ChartValuesBySeriesConnectionType = "None" | "EdgesConnection"

export type ChartValuesBySeriesConnectionTypeEnterprise = "Нет" | "СоединениеКраев"

export type ChartValuesEditMode = "Auto" | "Use" | "DontUse"

export type ChartValuesEditModeEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type ChartValuesToolTipFillType = "Auto" | "AllPointValues" | "SingleValue"

export type ChartValuesToolTipFillTypeEnterprise = "Авто" | "ВсеЗначенияТочки" | "ОдноЗначение"

export type ChartValuesToolTipShowMode = "Auto" | "DontShow" | "ShowForNearestValue" | "ShowOnHover"

export type ChartValuesToolTipShowModeEnterprise =
  | "Авто"
  | "НеОтображать"
  | "ОтображатьДляБлижайшего"
  | "ОтображатьПриНаведении"

export type GaugeChartValueRepresentation = "Sector" | "Needle"

export type GaugeChartValueRepresentationEnterprise = "Сектор" | "Стрелка"

export type GaugeChartValuesScaleLabelsLocation = "InsideScale" | "AtScale"

export type GaugeChartValuesScaleLabelsLocationEnterprise = "ВнутриШкалы" | "НаШкале"

export type MaxSeries = "NotDefined" | "Limited" | "Percent"

export type MaxSeriesEnterprise = "НеЗадано" | "Ограничено" | "Процент"

export type NonnumericChartValueUse = "Auto" | "AsZero" | "Skip"

export type NonnumericChartValueUseEnterprise = "Авто" | "КакНоль" | "Пропускать"

export type PointsConnectionAcrossSkippedChartValuesType =
  | "Auto"
  | "None"
  | "ConnectUnskippedValues"
  | "ConnectWithBaseValue"

export type PointsConnectionAcrossSkippedChartValuesTypeEnterprise =
  | "Авто"
  | "Нет"
  | "СоединениеНеПропущенных"
  | "СоединениеСБазовымЗначением"

export type RadarChartScaleType = "Circle" | "Polygon"

export type RadarChartScaleTypeEnterprise = "Окружность" | "Полигон"

export type ShowChartPopupReferenceLine = "Auto" | "DontShow" | "Show"

export type ShowChartPopupReferenceLineEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type ShowChartScaleTitle = "Auto" | "DontShow" | "Show"

export type ShowChartScaleTitleEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type ShowInChart = "Auto" | "DontShow" | "Show"

export type ShowInChartEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type ShowInChartLegend = "Auto" | "DontShow" | "Show"

export type ShowInChartLegendEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type StockChartUsedPointValue = "Close" | "High" | "Low" | "Open" | "OpenCloseAverage"

export type StockChartUsedPointValueEnterprise =
  | "Закрытие"
  | "Максимальное"
  | "Минимальное"
  | "Открытие"
  | "СреднееОткрытияИЗакрытия"

export type UsedChartValuesAxis = "Auto" | "Additional" | "Main"

export type UsedChartValuesAxisEnterprise = "Авто" | "Дополнительная" | "Основная"

export type GanttChartIntervalRepresentation = "Gradient" | "ThreeDimensional" | "Flat" | "Rhomb"

export type GanttChartIntervalRepresentationEnterprise = "Градиент" | "Объемный" | "Плоский" | "Ромб"

export type GanttChartIntervalTextRepresentation = "Auto" | "DontShow" | "Show"

export type GanttChartIntervalTextRepresentationEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type GanttChartIntervalsSelectionMode = "Auto" | "Multiple" | "None" | "Single"

export type GanttChartIntervalsSelectionModeEnterprise = "Авто" | "Множественный" | "Нет" | "Одиночный"

export type GanttChartLinkType = "EndEnd" | "EndBegin" | "BeginEnd" | "BeginBegin"

export type GanttChartLinkTypeEnterprise = "КонецКонец" | "КонецНачало" | "НачалоКонец" | "НачалоНачало"

export type GanttChartScaleKeeping = "Auto" | "AllData" | "Period" | "Fixed"

export type GanttChartScaleKeepingEnterprise = "Авто" | "ВсеДанные" | "Период" | "Фиксированная"

export type GanttChartTableLocation = "Auto" | "Left" | "None" | "Right"

export type GanttChartTableLocationEnterprise = "Авто" | "Лево" | "Нет" | "Право"

export type GanttChartTextPlacementType = "Auto" | "Cut" | "Wrap"

export type GanttChartTextPlacementTypeEnterprise = "Авто" | "Обрезать" | "Переносить"

export type GanttChartValueTextRepresentation = "None" | "Right"

export type GanttChartValueTextRepresentationEnterprise = "НеОтображать" | "Право"

export type GanttChartValuesSelectionMode = "Auto" | "Multiple" | "None" | "Single"

export type GanttChartValuesSelectionModeEnterprise = "Авто" | "Множественный" | "Нет" | "Одиночный"

export type GanttChartVerticalStretch = "None" | "StretchRows" | "StretchRowsAndData"

export type GanttChartVerticalStretchEnterprise = "НеРастягивать" | "РастягиватьСтроки" | "РастягиватьСтрокиИДанные"

export type ShowInGanttChart = "Auto" | "DontShow" | "Show"

export type ShowInGanttChartEnterprise = "Авто" | "НеОтображать" | "Отображать"

export type TimeScaleDayFormat = "MonthDay" | "MonthDayWeekDay" | "WeekDay" | "WeekDayMonthDay"

export type TimeScaleDayFormatEnterprise = "ДеньМесяца" | "ДеньМесяцаДеньНедели" | "ДеньНедели" | "ДеньНеделиДеньМесяца"

export type TimeScaleUnitType = "Year" | "Day" | "Quarter" | "Month" | "Minute" | "Week" | "Second" | "Hour"

export type TimeScaleUnitTypeEnterprise = "Год" | "День" | "Квартал" | "Месяц" | "Минута" | "Неделя" | "Секунда" | "Час"

export type PivotChartLabelsOrientation = "TopLevelsVertical" | "AllLevelsVertical" | "AllLevelsHorizontal"

export type PivotChartLabelsOrientationEnterprise =
  | "ВерхниеУровниВертикально"
  | "ВсеУровниВертикально"
  | "ВсеУровниГоризонтально"

export type PivotChartScaleKeeping = "AllValues" | "ValuesCount" | "MinimumWidth"

export type PivotChartScaleKeepingEnterprise = "ВсеЗначения" | "КоличествоЗначений" | "МинимальнаяШирина"

export type PivotChartType = "Column" | "Column3D"

export type PivotChartTypeEnterprise = "Гистограмма" | "ГистограммаОбъемная"

export type PivotChartValuesShowMode = "AllValues" | "LastLevelValues"

export type PivotChartValuesShowModeEnterprise = "ВсеЗначения" | "ЗначенияПоследнегоУровня"

export type DendrogramOrientation = "Top" | "Left" | "Bottom" | "Right"

export type DendrogramOrientationEnterprise = "Верх" | "Лево" | "Низ" | "Право"

export type DendrogramScaleKeeping = "AllItems" | "ItemCount" | "MinimumWidth"

export type DendrogramScaleKeepingEnterprise = "ВсеЭлементы" | "КоличествоЭлементов" | "МинимальнаяШирина"

export type GeographicalSchemaDataSourceOrganizationType = "AtRow" | "AtIntersection"

export type GeographicalSchemaDataSourceOrganizationTypeEnterprise = "ВСтроке" | "НаПересечении"

export type GeographicalSchemaLayerSeriesImportModeType = "ImportAll" | "DontImport"

export type GeographicalSchemaLayerSeriesImportModeTypeEnterprise = "ИмпортироватьВсе" | "НеИмпортировать"

export type GeographicalSchemaLayerSeriesShowMode =
  | "Column"
  | "Picture"
  | "Pie"
  | "SizedPie"
  | "DontShow"
  | "ShapeColorHue"
  | "ShapeSize"
  | "Text"
  | "ShapeColor"

export type GeographicalSchemaLayerSeriesShowModeEnterprise =
  | "Гистограмма"
  | "Картинка"
  | "Круговая"
  | "КруговаяСРазмером"
  | "НеОтображать"
  | "ОттенокЦветаФигуры"
  | "РазмерФигуры"
  | "Текст"
  | "ЦветФигуры"

export type GeographicalSchemaLegendItemShowScaleType = "DontShow" | "ShowByValues"

export type GeographicalSchemaLegendItemShowScaleTypeEnterprise = "НеОтображать" | "ОтображатьПоЗначениям"

export type GeographicalSchemaLineType = "None" | "Dashed" | "DashDotted" | "DashDottedDotted" | "Solid" | "Dotted"

export type GeographicalSchemaLineTypeEnterprise =
  | "НетЛинии"
  | "Пунктир"
  | "ПунктирТочка"
  | "ПунктирТочкаТочка"
  | "Сплошная"
  | "Точечная"

export type GeographicalSchemaMarkerType =
  | "BigSquare"
  | "BigCircle"
  | "BigTriangle"
  | "ExclamationPoint"
  | "Darts"
  | "QuestionMark"
  | "Pin"
  | "LittleSquare"
  | "LittleCircle"
  | "LittleTriangle"
  | "None"

export type GeographicalSchemaMarkerTypeEnterprise =
  | "БольшойКвадрат"
  | "БольшойКруг"
  | "БольшойТреугольник"
  | "ВосклицательныйЗнак"
  | "Дартс"
  | "ЗнакВопроса"
  | "Кнопка"
  | "МаленькийКвадрат"
  | "МаленькийКруг"
  | "МаленькийТреугольник"
  | "Нет"

export type GeographicalSchemaObjectFindType = "Included" | "IncludedWholly" | "Includes" | "IncludesWholly"

export type GeographicalSchemaObjectFindTypeEnterprise =
  | "Включает"
  | "ВключаетПолностью"
  | "Включают"
  | "ВключаютПолностью"

export type GeographicalSchemaPointObjectDrawingType = "Picture" | "Marker" | "Char"

export type GeographicalSchemaPointObjectDrawingTypeEnterprise = "Картинка" | "Маркер" | "Символ"

export type GeographicalSchemaProjection =
  | "AzimuthalAitoffProjection"
  | "AzimuthalWagner7Projection"
  | "AzimuthalWinkelTripelProjection"
  | "AzimuthalLambertEqualAreaProjection"
  | "AzimuthalHammerProjection"
  | "AzimuthalEquidistantProjection"
  | "ConicLambertEqualAreaProjection"
  | "MiscellaneousOrteliusOvalProjection"
  | "MiscellaneousVanDerGrinten1Projection"
  | "MiscellaneousVanDerGrinten2Projection"
  | "MiscellaneousVanDerGrinten3Projection"
  | "MiscellaneousApianGlobular1Projection"
  | "MiscellaneousBaconGlobularProjection"
  | "MiscellaneousNicolosiGlobularProjection"
  | "MiscellaneousAugustEpicycloidalProjection"
  | "PseudoCylindricalBoggsEumorphicProjection"
  | "PseudoCylindricalMcBrydeThomasFlatPolarParabolicProjection"
  | "PseudoCylindricalMcBrydeThomasFlatPolarQuarticProjection"
  | "PseudoCylindricalMcBrydeThomasFlatPolarSinusoidalProjection"
  | "PseudoCylindricalWinkel1Projection"
  | "PseudoCylindricalLoximutalProjection"
  | "PseudoCylindricalMollweideProjection"
  | "PseudoCylindricalHatanoAsymetricalEqualAreaProjection"
  | "PseudoCylindricalPutninP2Projection"
  | "PseudoCylindricalPutninP5Projection"
  | "PseudoCylindricalRobinsonProjection"
  | "PseudoCylindricalEckert1Projection"
  | "PseudoCylindricalEckert2Projection"
  | "PseudoCylindricalEckert3Projection"
  | "PseudoCylindricalEckert4Projection"
  | "PseudoCylindricalEckert5Projection"
  | "PseudoCylindricalEckert6Projection"
  | "PseudoCylindricalSinusoidalProjection"
  | "CylindricalMillerProjection"
  | "CylindricalLambertEqualAreaProjection"
  | "CylindricalEquidistantProjection"
  | "CylindricalGallStereographicProjection"

export type GeographicalSchemaProjectionEnterprise =
  | "АзимутальнаяПроекцияАитофа"
  | "АзимутальнаяПроекцияВагнера7"
  | "АзимутальнаяПроекцияВинкеляТрипеля"
  | "АзимутальнаяПроекцияРавныхПлощадейЛамберта"
  | "АзимутальнаяПроекцияХамера"
  | "АзимутальнаяРавноудаленнаяПроекция"
  | "КоническаяПроекцияРавныхПлощадейЛамберта"
  | "ПрочаяОвальнаяПроекцияОртелиуса"
  | "ПрочаяПроекцияВанДерГринтена1"
  | "ПрочаяПроекцияВанДерГринтена2"
  | "ПрочаяПроекцияВанДерГринтена3"
  | "ПрочаяСотоваяШаровая1Проекция"
  | "ПрочаяШароваяПроекцияБекона"
  | "ПрочаяШароваяПроекцияНиколоси"
  | "ПрочаяЭпициклоидальнаяПроекцияАвгуста"
  | "ПсевдоцилиндрическаяНормальнаяПроекцияБоггса"
  | "ПсевдоцилиндрическаяПлоскоПолярнаяПараболическаяПроекцияМакБрайдаТомаса"
  | "ПсевдоцилиндрическаяПлоскоПолярнаяПроекцияЧетвертогоПорядкаМакБрайдаТомаса"
  | "ПсевдоцилиндрическаяПлоскоПолярнаяСинусоидальнаяПроекцияМакБрайдаТомаса"
  | "ПсевдоцилиндрическаяПроекцияВинкеля1"
  | "ПсевдоцилиндрическаяПроекцияЛоксимутала"
  | "ПсевдоцилиндрическаяПроекцияМолвейда"
  | "ПсевдоцилиндрическаяПроекцияНесимметричныхРавныхОбластейХатано"
  | "ПсевдоцилиндрическаяПроекцияПутнинаP2"
  | "ПсевдоцилиндрическаяПроекцияПутнинаP5"
  | "ПсевдоцилиндрическаяПроекцияРобинсона"
  | "ПсевдоцилиндрическаяПроекцияЭкерта1"
  | "ПсевдоцилиндрическаяПроекцияЭкерта2"
  | "ПсевдоцилиндрическаяПроекцияЭкерта3"
  | "ПсевдоцилиндрическаяПроекцияЭкерта4"
  | "ПсевдоцилиндрическаяПроекцияЭкерта5"
  | "ПсевдоцилиндрическаяПроекцияЭкерта6"
  | "ПсевдоцилиндрическаяСинусоидальнаяПроекция"
  | "ЦилиндрическаяПроекцияМиллера"
  | "ЦилиндрическаяПроекцияРавныхОбластейЛамберта"
  | "ЦилиндрическаяРавноудаленнаяПроекция"
  | "ЦилиндрическаяСтереографическаяПроекцияГалла"

export type GeographicalSchemaShowMode = "AllData" | "ScaleDefined" | "SpecifiedArea"

export type GeographicalSchemaShowModeEnterprise = "ВсеДанные" | "ЗадаетсяМасштабом" | "ЗаданнаяОбласть"

export type PaintingReferencePointPosition =
  | "LeftTop"
  | "LeftBottom"
  | "LeftCenter"
  | "RightTop"
  | "RightBottom"
  | "RightCenter"
  | "Center"
  | "CenterTop"
  | "CenterBottom"

export type PaintingReferencePointPositionEnterprise =
  | "ЛевоВерх"
  | "ЛевоНиз"
  | "ЛевоЦентр"
  | "ПравоВерх"
  | "ПравоНиз"
  | "ПравоЦентр"
  | "Центр"
  | "ЦентрВерх"
  | "ЦентрНиз"

export type SeriesValuesDrawingMode = "ShowAsPart" | "ShowAsValue"

export type SeriesValuesDrawingModeEnterprise = "ОтображатьКакДолю" | "ОтображатьКакЗначение"

export type IntegrationServiceChannelState = "Disconnected" | "Connected"

export type IntegrationServiceChannelStateEnterprise = "Отключен" | "Подключен"

export type ArchiveFileCompressionLevel = "Maximum" | "Minimum" | "Optimal"

export type ArchiveFileCompressionLevelEnterprise = "Максимальный" | "Минимальный" | "Оптимальный"

export type ArchiveFileCompressionMethod = "BZIP2" | "Copy" | "Deflate"

export type ArchiveFileCompressionMethodEnterprise = "BZIP2" | "Копирование" | "Сжатие"

export type ArchiveFileEncryptionMethod = "AES128" | "AES192" | "AES256" | "Zip20"

export type ArchiveFileEncryptionMethodEnterprise = "AES128" | "AES192" | "AES256" | "Zip20"

export type ArchiveFileRestoreFilePathsMode = "Restore" | "DontRestore"

export type ArchiveFileRestoreFilePathsModeEnterprise = "Восстанавливать" | "НеВосстанавливать"

export type ArchiveFileStorePathMode = "DontStorePath" | "StoreRelativePath" | "StoreFullPath"

export type ArchiveFileStorePathModeEnterprise =
  | "НеСохранятьПути"
  | "СохранятьОтносительныеПути"
  | "СохранятьПолныеПути"

export type ArchiveFileSubDirProcessingMode = "DontProcess" | "ProcessRecursively"

export type ArchiveFileSubDirProcessingModeEnterprise = "НеОбрабатывать" | "ОбрабатыватьРекурсивно"

export type ArchiveFileType = "BZIP2" | "GZIP" | "RAR" | "SevenZIP" | "TAR" | "XZ" | "ZIP"

export type ArchiveFileTypeEnterprise = "BZIP2" | "GZIP" | "RAR" | "SevenZIP" | "TAR" | "XZ" | "ZIP"

export type FileNamesEncodingInArchiveFile = "UTF8" | "Auto" | "OSEncodingWithUTF8"

export type FileNamesEncodingInArchiveFileEnterprise = "UTF8" | "Авто" | "КодировкаОСДополнительноUTF8"

export type FileAccess = "Write" | "Read" | "ReadAndWrite"

export type FileAccessEnterprise = "Запись" | "Чтение" | "ЧтениеИЗапись"

export type FileCompareMethod = "Binary" | "SpreadsheetDocument" | "TextDocument"

export type FileCompareMethodEnterprise = "Двоичное" | "ТабличныйДокумент" | "ТекстовыйДокумент"

export type FileDialogMode = "ChooseDirectory" | "Open" | "Save"

export type FileDialogModeEnterprise = "ВыборКаталога" | "Открытие" | "Сохранение"

export type FileDialogSection = "Audio" | "Gallery" | "Documents" | "Recent" | "Files"

export type FileDialogSectionEnterprise = "Аудио" | "Галерея" | "Документы" | "Недавние" | "Файлы"

export type FileDragMode = "AsFileRef" | "AsFile"

export type FileDragModeEnterprise = "КакСсылкаНаФайл" | "КакФайл"

export type FileOpenMode = "Append" | "Truncate" | "Open" | "OpenOrCreate" | "Create" | "CreateNew"

export type FileOpenModeEnterprise =
  | "Дописать"
  | "Обрезать"
  | "Открыть"
  | "ОткрытьИлиСоздать"
  | "Создать"
  | "СоздатьНовый"

export type GetFilesArchiveMode = "GetArchiveAlways" | "GetArchiveWhenRequired"

export type GetFilesArchiveModeEnterprise = "ПолучатьАрхивВсегда" | "ПолучатьАрхивПриНеобходимости"

export type IncomingShareRequestStandardCommand = "CopyToClipboard" | "ShareInConversation" | "Show" | "Save"

export type IncomingShareRequestStandardCommandEnterprise =
  | "КопироватьВБуферОбмена"
  | "ПоделитьсяВОбсуждении"
  | "Показать"
  | "Сохранить"

export type MobileDeviceLibraryDirType = "Audio" | "Video" | "Pictures"

export type MobileDeviceLibraryDirTypeEnterprise = "Аудио" | "Видео" | "Картинки"

export type ShareRequestDataProcessingVariant = "View" | "Edit"

export type ShareRequestDataProcessingVariantEnterprise = "Просмотр" | "Редактирование"

export type AccountMainPresentation = "AsCode" | "AsDescription"

export type AccountMainPresentationEnterprise = "ВВидеКода" | "ВВидеНаименования"

export type AccumulationRegisterType = "Turnovers" | "Balance"

export type AccumulationRegisterTypeEnterprise = "Обороты" | "Остатки"

export type AttributeUse = "ForFolder" | "ForFolderAndItem" | "ForItem"

export type AttributeUseEnterprise = "ДляГруппы" | "ДляГруппыИЭлемента" | "ДляЭлемента"

export type BinaryDataBlockStorageUseMode = "Use" | "DontUse"

export type BinaryDataBlockStorageUseModeEnterprise = "Использовать" | "НеИспользовать"

export type BinaryDataStorageMode = "Use" | "DontUse"

export type BinaryDataStorageModeEnterprise = "Использовать" | "НеИспользовать"

export type BusinessProcessNumberPeriodicity = "Year" | "Day" | "Quarter" | "Month" | "Nonperiodical"

export type BusinessProcessNumberPeriodicityEnterprise = "Год" | "День" | "Квартал" | "Месяц" | "Непериодический"

export type BusinessProcessNumberType = "String" | "Number"

export type BusinessProcessNumberTypeEnterprise = "Строка" | "Число"

export type CalculationRegisterPeriodicity = "Year" | "Day" | "Quarter" | "Month"

export type CalculationRegisterPeriodicityEnterprise = "Год" | "День" | "Квартал" | "Месяц"

export type CalculationTypeMainPresentation = "AsCode" | "AsDescription"

export type CalculationTypeMainPresentationEnterprise = "ВВидеКода" | "ВВидеНаименования"

export type CharOfAccountCodeSeries = "WholeChartOfAccounts" | "WithinSubordination"

export type CharOfAccountCodeSeriesEnterprise = "ВоВсемПланеСчетов" | "ВПределахПодчинения"

export type CharacteristicKindCodesSeries = "WholeCharacteristicKind" | "WithinSubordination"

export type CharacteristicKindCodesSeriesEnterprise = "ВоВсемПланеВидовХарактеристик" | "ВПределахПодчинения"

export type CharacteristicTypeMainPresentation = "AsCode" | "AsDescription"

export type CharacteristicTypeMainPresentationEnterprise = "ВВидеКода" | "ВВидеНаименования"

export type ChartOfCalculationTypesBaseUse = "DontUse" | "OnActionPeriod" | "OnRegistrationPeriod"

export type ChartOfCalculationTypesBaseUseEnterprise = "НеИспользовать" | "ПоПериодуДействия" | "ПоПериодуРегистрации"

export type ChartOfCalculationTypesCodeType = "String" | "Number"

export type ChartOfCalculationTypesCodeTypeEnterprise = "Строка" | "Число"

export type ChoiceDataGetModeOnInputByString = "Directly" | "Background"

export type ChoiceDataGetModeOnInputByStringEnterprise = "Непосредственно" | "Фоновый"

export type ChoiceMode = "QuickChoice" | "FromForm" | "BothWays"

export type ChoiceModeEnterprise = "БыстрыйВыбор" | "ИзФормы" | "ОбоимиСпособами"

export type CommonAttributeAuthenticationSeparation = "DontUse" | "Separate"

export type CommonAttributeAuthenticationSeparationEnterprise = "НеИспользовать" | "Разделять"

export type CommonAttributeAutoUse = "Use" | "DontUse"

export type CommonAttributeAutoUseEnterprise = "Использовать" | "НеИспользовать"

export type CommonAttributeConfigurationExtensionsSeparation = "DontUse" | "Separate"

export type CommonAttributeConfigurationExtensionsSeparationEnterprise = "НеИспользовать" | "Разделять"

export type CommonAttributeDataSeparation = "DontUse" | "Separate"

export type CommonAttributeDataSeparationEnterprise = "НеИспользовать" | "Разделять"

export type CommonAttributeSeparatedDataUse = "Independently" | "IndependentlyAndSimultaneously"

export type CommonAttributeSeparatedDataUseEnterprise = "Независимо" | "НезависимоИСовместно"

export type CommonAttributeUse = "Auto" | "Use" | "DontUse"

export type CommonAttributeUseEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type CommonAttributeUsersSeparation = "DontUse" | "Separate"

export type CommonAttributeUsersSeparationEnterprise = "НеИспользовать" | "Разделять"

export type CompatibilityMode =
  | "Version8_1"
  | "Version8_2_13"
  | "Version8_2_16"
  | "Version8_3_1"
  | "Version8_3_10"
  | "Version8_3_11"
  | "Version8_3_12"
  | "Version8_3_13"
  | "Version8_3_14"
  | "Version8_3_15"
  | "Version8_3_16"
  | "Version8_3_17"
  | "Version8_3_18"
  | "Version8_3_19"
  | "Version8_3_2"
  | "Version8_3_20"
  | "Version8_3_21"
  | "Version8_3_22"
  | "Version8_3_23"
  | "Version8_3_24"
  | "Version8_3_25"
  | "Version8_3_26"
  | "Version8_3_3"
  | "Version8_3_4"
  | "Version8_3_5"
  | "Version8_3_6"
  | "Version8_3_7"
  | "Version8_3_8"
  | "Version8_3_9"
  | "DontUse"

export type CompatibilityModeEnterprise =
  | "Версия8_1"
  | "Версия8_2_13"
  | "Версия8_2_16"
  | "Версия8_3_1"
  | "Версия8_3_10"
  | "Версия8_3_11"
  | "Версия8_3_12"
  | "Версия8_3_13"
  | "Версия8_3_14"
  | "Версия8_3_15"
  | "Версия8_3_16"
  | "Версия8_3_17"
  | "Версия8_3_18"
  | "Версия8_3_19"
  | "Версия8_3_2"
  | "Версия8_3_20"
  | "Версия8_3_21"
  | "Версия8_3_22"
  | "Версия8_3_23"
  | "Версия8_3_24"
  | "Версия8_3_25"
  | "Версия8_3_26"
  | "Версия8_3_3"
  | "Версия8_3_4"
  | "Версия8_3_5"
  | "Версия8_3_6"
  | "Версия8_3_7"
  | "Версия8_3_8"
  | "Версия8_3_9"
  | "НеИспользовать"

export type ConfigurationExtensionPurpose = "Customization" | "AddOn" | "Patch"

export type ConfigurationExtensionPurposeEnterprise = "Адаптация" | "Дополнение" | "Исправление"

export type CreateOnInput = "Auto" | "Use" | "DontUse"

export type CreateOnInputEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type DataExchangeMainPresentation = "AsCode" | "AsDescription"

export type DataExchangeMainPresentationEnterprise = "ВВидеКода" | "ВВидеНаименования"

export type DataHistoryUse = "Use" | "DontUse"

export type DataHistoryUseEnterprise = "Использовать" | "НеИспользовать"

export type DefaultDataLockControlMode = "Automatic" | "AutomaticAndManaged" | "Managed"

export type DefaultDataLockControlModeEnterprise = "Автоматический" | "АвтоматическийИУправляемый" | "Управляемый"

export type DocumentNumberPeriodicity = "Year" | "Day" | "Quarter" | "Month" | "Nonperiodical"

export type DocumentNumberPeriodicityEnterprise = "Год" | "День" | "Квартал" | "Месяц" | "Непериодический"

export type DocumentNumberType = "String" | "Number"

export type DocumentNumberTypeEnterprise = "Строка" | "Число"

export type EditType = "InDialog" | "InList" | "BothWays"

export type EditTypeEnterprise = "ВДиалоге" | "ВСписке" | "ОбоимиСпособами"

export type ExternalDataSourceTableDataType = "NonobjectData" | "ObjectData"

export type ExternalDataSourceTableDataTypeEnterprise = "НеобъектныеДанные" | "ОбъектныеДанные"

export type ExternalDataSourceTableType = "Expression" | "Table"

export type ExternalDataSourceTableTypeEnterprise = "Выражение" | "Таблица"

export type FormType = "Ordinary" | "Managed"

export type FormTypeEnterprise = "Обычная" | "Управляемая"

export type FullTextSearchOnInputByString = "Use" | "DontUse"

export type FullTextSearchOnInputByStringEnterprise = "Использовать" | "НеИспользовать"

export type HTTPMethod =
  | "CONNECT"
  | "COPY"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "LOCK"
  | "MERGE"
  | "MKCOL"
  | "MOVE"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PROPFIND"
  | "PROPPATCH"
  | "PUT"
  | "TRACE"
  | "UNLOCK"
  | "Any"

export type HTTPMethodEnterprise =
  | "CONNECT"
  | "COPY"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "LOCK"
  | "MERGE"
  | "MKCOL"
  | "MOVE"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PROPFIND"
  | "PROPPATCH"
  | "PUT"
  | "TRACE"
  | "UNLOCK"
  | "Любой"

export type HierarchyType = "HierarchyFoldersAndItems" | "HierarchyOfItems"

export type HierarchyTypeEnterprise = "ИерархияГруппИЭлементов" | "ИерархияЭлементов"

export type Indexing = "Index" | "IndexWithAdditionalOrder" | "DontIndex"

export type IndexingEnterprise = "Индексировать" | "ИндексироватьСДопУпорядочиванием" | "НеИндексировать"

export type InformationRegisterPeriodicity =
  | "Year"
  | "Day"
  | "Quarter"
  | "Month"
  | "Nonperiodical"
  | "RecorderPosition"
  | "Second"

export type InformationRegisterPeriodicityEnterprise =
  | "Год"
  | "День"
  | "Квартал"
  | "Месяц"
  | "Непериодический"
  | "ПозицияРегистратора"
  | "Секунда"

export type IntegrationServiceChannelMessageDirection = "Send" | "Receive"

export type IntegrationServiceChannelMessageDirectionEnterprise = "Отправка" | "Получение"

export type ModalityUseMode = "Use" | "UseWithWarnings" | "DontUse"

export type ModalityUseModeEnterprise = "Использовать" | "ИспользоватьСПредупреждениями" | "НеИспользовать"

export type MoveBoundaryOnPosting = "DontMove" | "Move"

export type MoveBoundaryOnPostingEnterprise = "НеПеремещать" | "Перемещать"

export type ObjectAutonumerationMode = "NotAutoFree" | "AutoFree"

export type ObjectAutonumerationModeEnterprise = "НеОсвобождатьАвтоматически" | "ОсвобождатьАвтоматически"

export type ObjectBelonging = "Adopted" | "Native"

export type ObjectBelongingEnterprise = "Заимствованный" | "Собственный"

export type Posting = "Deny" | "Allow"

export type PostingEnterprise = "Запретить" | "Разрешить"

export type RealTimePosting = "Deny" | "Allow"

export type RealTimePostingEnterprise = "Запретить" | "Разрешить"

export type RegisterRecordsDeletion = "AutoDeleteOff" | "AutoDelete" | "AutoDeleteOnUnpost"

export type RegisterRecordsDeletionEnterprise =
  | "НеУдалятьАвтоматически"
  | "УдалятьАвтоматически"
  | "УдалятьАвтоматическиПриОтменеПроведения"

export type RegisterRecordsWritingOnPost = "WriteSelected" | "WriteModified"

export type RegisterRecordsWritingOnPostEnterprise = "ЗаписыватьВыбранные" | "ЗаписыватьМодифицированные"

export type RegisterWriteMode = "Independent" | "RecorderSubordinate"

export type RegisterWriteModeEnterprise = "Независимый" | "ПодчинениеРегистратору"

export type ReturnValuesReuse = "DuringRequest" | "DuringSession" | "DontUse"

export type ReturnValuesReuseEnterprise = "НаВремяВызова" | "НаВремяСеанса" | "НеИспользовать"

export type ScriptVariant = "English" | "Russian"

export type ScriptVariantEnterprise = "Английский" | "Русский"

export type SearchStringModeOnInputByString = "AnyPart" | "Begin"

export type SearchStringModeOnInputByStringEnterprise = "ЛюбаяЧасть" | "Начало"

export type SequenceFilling = "AutoFill" | "AutoFillOff"

export type SequenceFillingEnterprise = "ЗаполнятьАвтоматически" | "НеЗаполнятьАвтоматически"

export type SessionReuseMode = "Use" | "AutoUse" | "DontUse"

export type SessionReuseModeEnterprise = "Использовать" | "ИспользоватьАвтоматически" | "НеИспользовать"

export type StyleElementType = "Border" | "Color" | "Font"

export type StyleElementTypeEnterprise = "Рамка" | "Цвет" | "Шрифт"

export type SubordinationUse = "ToFolders" | "ToFoldersAndItems" | "ToItems"

export type SubordinationUseEnterprise = "Группам" | "ГруппамИЭлементам" | "Элементам"

export type SynchronousExtensionAndAddInCallUseMode = "Use" | "UseWithWarnings" | "DontUse"

export type SynchronousExtensionAndAddInCallUseModeEnterprise =
  | "Использовать"
  | "ИспользоватьСПредупреждениями"
  | "НеИспользовать"

export type SynchronousPlatformExtensionAndAddInCallUseMode = "Use" | "UseWithWarnings" | "DontUse"

export type SynchronousPlatformExtensionAndAddInCallUseModeEnterprise =
  | "Использовать"
  | "ИспользоватьСПредупреждениями"
  | "НеИспользовать"

export type TaskMainPresentation = "AsDescription" | "AsNumber"

export type TaskMainPresentationEnterprise = "ВВидеНаименования" | "ВВидеНомера"

export type TaskNumberAutoPrefix = "DontUse" | "BusinessProcessNumber"

export type TaskNumberAutoPrefixEnterprise = "НеИспользовать" | "НомерБизнесПроцесса"

export type TaskNumberType = "String" | "Number"

export type TaskNumberTypeEnterprise = "Строка" | "Число"

export type TemplateType =
  | "ActiveDocument"
  | "HTMLDocument"
  | "AddIn"
  | "GeographicalSchema"
  | "GraphicalSchema"
  | "BinaryData"
  | "DataCompositionAppearanceTemplate"
  | "DataCompositionSchema"
  | "SpreadsheetDocument"
  | "TextDocument"

export type TemplateTypeEnterprise =
  | "ActiveDocument"
  | "HTMLДокумент"
  | "ВнешняяКомпонента"
  | "ГеографическаяСхема"
  | "ГрафическаяСхема"
  | "ДвоичныеДанные"
  | "МакетОформленияКомпоновкиДанных"
  | "СхемаКомпоновкиДанных"
  | "ТабличныйДокумент"
  | "ТекстовыйДокумент"

export type TransferDirection = "In" | "InOut" | "Out"

export type TransferDirectionEnterprise = "Входной" | "ВходнойВыходной" | "Выходной"

export type TypeReductionMode = "Deny" | "TransformValues" | "DeleteData"

export type TypeReductionModeEnterprise = "Запрещать" | "ПреобразовыватьЗначения" | "УдалятьДанные"

export type UseFullTextSearch = "Use" | "DontUse"

export type UseFullTextSearchEnterprise = "Использовать" | "НеИспользовать"

export type UseQuickChoice = "Auto" | "Use" | "DontUse"

export type UseQuickChoiceEnterprise = "Авто" | "Использовать" | "НеИспользовать"

export type PresentationAdditionType = "Add" | "DontAdd"

export type PresentationAdditionTypeEnterprise = "Добавлять" | "НеДобавлять"

export type ReportBuilderDetailsFillType = "GroupValues" | "DontFill" | "Details"

export type ReportBuilderDetailsFillTypeEnterprise = "ЗначенияГруппировок" | "НеЗаполнять" | "Расшифровка"

export type ReportBuilderDimensionType = "Hierarchy" | "HierarchyOnly" | "Items"

export type ReportBuilderDimensionTypeEnterprise = "Иерархия" | "ТолькоИерархия" | "Элементы"

export type TotalPlacementType = "Header" | "HeaderAndFooter" | "Footer" | "FooterOnly"

export type TotalPlacementTypeEnterprise = "Заголовок" | "ЗаголовокИПодвал" | "Подвал" | "ТолькоПодвал"

export type XMLAttributeType =
  | "CDATA"
  | "ENTITIES"
  | "ENTITY"
  | "ENUMERATION"
  | "ID"
  | "IDREF"
  | "IDREFS"
  | "NMTOKEN"
  | "NMTOKENS"
  | "NOTATION"

export type XMLAttributeTypeEnterprise =
  | "CDATA"
  | "ENTITIES"
  | "ENTITY"
  | "ENUMERATION"
  | "ID"
  | "IDREF"
  | "IDREFS"
  | "NMTOKEN"
  | "NMTOKENS"
  | "NOTATION"

export type XMLCanonicalizationType =
  | "XMLExclusiveCanonicalization"
  | "XMLExclusiveCanonicalizationWithComments"
  | "XMLCanonicalization"
  | "XMLCanonicalization1_1"
  | "XMLCanonicalization1_1WithComments"
  | "XMLCanonicalizationWithComments"

export type XMLCanonicalizationTypeEnterprise =
  | "ИсключающийКаноническийXML"
  | "ИсключающийКаноническийXMLСКомментариями"
  | "КаноническийXML"
  | "КаноническийXML1_1"
  | "КаноническийXML1_1СКомментариями"
  | "КаноническийXMLСКомментариями"

export type XMLNodeType =
  | "Attribute"
  | "ProcessingInstruction"
  | "Comment"
  | "EndEntity"
  | "EndElement"
  | "StartElement"
  | "None"
  | "Notation"
  | "XMLDeclaration"
  | "DocumentTypeDefinition"
  | "Whitespace"
  | "CDATASection"
  | "EntityReference"
  | "Entity"
  | "Text"

export type XMLNodeTypeEnterprise =
  | "Атрибут"
  | "ИнструкцияОбработки"
  | "Комментарий"
  | "КонецСущности"
  | "КонецЭлемента"
  | "НачалоЭлемента"
  | "Ничего"
  | "Нотация"
  | "ОбъявлениеXML"
  | "ОпределениеТипаДокумента"
  | "ПробельныеСимволы"
  | "СекцияCDATA"
  | "СсылкаНаСущность"
  | "Сущность"
  | "Текст"

export type XMLSpace = "Default" | "Preserve"

export type XMLSpaceEnterprise = "ПоУмолчанию" | "Сохранять"

export type XMLTypeAssignment = "Implicit" | "Explicit"

export type XMLTypeAssignmentEnterprise = "Неявное" | "Явное"

export type XMLValidationType = "NoValidate" | "DocumentTypeDefinition" | "XMLSchema"

export type XMLValidationTypeEnterprise = "НетПроверки" | "ОпределениеТипаДокумента" | "СхемаXML"

export type AllowedMessageNo = "Greater" | "Any" | "Next"

export type AllowedMessageNoEnterprise = "Больший" | "Любой" | "Очередной"

export type AutoChangeRecord = "Deny" | "Allow"

export type AutoChangeRecordEnterprise = "Запретить" | "Разрешить"

export type DataItemReceive = "Auto" | "Ignore" | "Accept"

export type DataItemReceiveEnterprise = "Авто" | "Игнорировать" | "Принять"

export type DataItemSend = "Auto" | "Ignore" | "Delete"

export type DataItemSendEnterprise = "Авто" | "Игнорировать" | "Удалить"

export type AnalysisDataType = "Discrete" | "Contiguous"

export type AnalysisDataTypeEnterprise = "Дискретные" | "Непрерывные"

export type AssociationRulesDataSourceType = "Object" | "Event"

export type AssociationRulesDataSourceTypeEnterprise = "Объектный" | "Событийный"

export type AssociationRulesPruneType = "Redundant" | "Covered"

export type AssociationRulesPruneTypeEnterprise = "Избыточные" | "Покрытые"

export type ClusterizationMethod = "NearestNeighbor" | "FurthestNeighbor" | "KMeans" | "Centroid"

export type ClusterizationMethodEnterprise = "БлижняяСвязь" | "ДальняяСвязь" | "КСредних" | "ЦентрТяжести"

export type DataAnalysisAssociationRulesOrderType = "ByConfidence" | "ByImportance" | "BySupport"

export type DataAnalysisAssociationRulesOrderTypeEnterprise = "ПоДостоверности" | "ПоЗначимости" | "ПоКоличествуСлучаев"

export type DataAnalysisColumnTypeAssociationRules = "NotUsed" | "Object" | "Item"

export type DataAnalysisColumnTypeAssociationRulesEnterprise = "НеИспользуемая" | "Объект" | "Элемент"

export type DataAnalysisColumnTypeClusterization = "Input" | "InputAndPredictable" | "Key" | "NotUsed" | "Predictable"

export type DataAnalysisColumnTypeClusterizationEnterprise =
  | "Входная"
  | "ВходнаяИПрогнозируемая"
  | "Ключ"
  | "НеИспользуемая"
  | "Прогнозируемая"

export type DataAnalysisColumnTypeDecisionTree = "Input" | "NotUsed" | "Predictable"

export type DataAnalysisColumnTypeDecisionTreeEnterprise = "Входная" | "НеИспользуемая" | "Прогнозируемая"

export type DataAnalysisColumnTypeSequentialPatterns = "Time" | "NotUsed" | "Sequence" | "Item"

export type DataAnalysisColumnTypeSequentialPatternsEnterprise =
  | "Время"
  | "НеИспользуемая"
  | "Последовательность"
  | "Элемент"

export type DataAnalysisColumnTypeSummaryStatistics = "Input" | "NotUsed"

export type DataAnalysisColumnTypeSummaryStatisticsEnterprise = "Входная" | "НеИспользуемая"

export type DataAnalysisDistanceMetricType = "Euclidean" | "SquaredEuclidean" | "CityBlock" | "Maximum"

export type DataAnalysisDistanceMetricTypeEnterprise =
  | "ЕвклидоваМетрика"
  | "ЕвклидоваМетрикаВКвадрате"
  | "МетрикаГорода"
  | "МетрикаДоминирования"

export type DataAnalysisFieldType = "DataAnalysisObject" | "Field"

export type DataAnalysisFieldTypeEnterprise = "ОбъектАнализаДанных" | "Поле"

export type DataAnalysisNumericValueUseType = "AsBoolean" | "AsNumeric"

export type DataAnalysisNumericValueUseTypeEnterprise = "КакБулево" | "КакЧисло"

export type DataAnalysisResultTableFillType = "AllFields" | "UsedFields" | "KeyFields" | "DontFill"

export type DataAnalysisResultTableFillTypeEnterprise = "ВсеПоля" | "ИспользуемыеПоля" | "КлючевыеПоля" | "НеЗаполнять"

export type DataAnalysisSequentialPatternsOrderType = "ByLength" | "BySupport"

export type DataAnalysisSequentialPatternsOrderTypeEnterprise = "ПоДлине" | "ПоКоличествуСлучаев"

export type DataAnalysisStandardizationType = "DontStandardize" | "Standardize"

export type DataAnalysisStandardizationTypeEnterprise = "НеСтандартизировать" | "Стандартизировать"

export type DataAnalysisTimeIntervalUnitType =
  | "Year"
  | "TenDays"
  | "Day"
  | "Quarter"
  | "Month"
  | "Minute"
  | "Week"
  | "HalfYear"
  | "Second"
  | "CurrentTenDays"
  | "CurrentMinute"
  | "CurrentWeek"
  | "CurrentHalfYear"
  | "CurrentYear"
  | "CurrentDay"
  | "CurrentQuarter"
  | "CurrentMonth"
  | "CurrentHour"
  | "Hour"

export type DataAnalysisTimeIntervalUnitTypeEnterprise =
  | "Год"
  | "Декада"
  | "День"
  | "Квартал"
  | "Месяц"
  | "Минута"
  | "Неделя"
  | "Полугодие"
  | "Секунда"
  | "ТекущаяДекада"
  | "ТекущаяМинута"
  | "ТекущаяНеделя"
  | "ТекущееПолугодие"
  | "ТекущийГод"
  | "ТекущийДень"
  | "ТекущийКвартал"
  | "ТекущийМесяц"
  | "ТекущийЧас"
  | "Час"

export type DecisionTreeSimplificationType = "DontSimplify" | "Simplify"

export type DecisionTreeSimplificationTypeEnterprise = "НеУпрощать" | "Упрощать"

export type PredictionModelColumnType = "Input" | "DataSourceColumn" | "Predictable"

export type PredictionModelColumnTypeEnterprise = "Входная" | "КолонкаИсточникаДанных" | "Прогнозируемая"

export type FileNamesEncodingInZipFile = "UTF8" | "Auto" | "OSEncodingWithUTF8"

export type FileNamesEncodingInZipFileEnterprise = "UTF8" | "Авто" | "КодировкаОСДополнительноUTF8"

export type ZIPCompressionLevel = "Maximum" | "Minimum" | "Optimal"

export type ZIPCompressionLevelEnterprise = "Максимальный" | "Минимальный" | "Оптимальный"

export type ZIPCompressionMethod = "BZIP2" | "Copy" | "Deflate"

export type ZIPCompressionMethodEnterprise = "BZIP2" | "Копирование" | "Сжатие"

export type ZIPEncryptionMethod = "AES128" | "AES192" | "AES256" | "Zip20"

export type ZIPEncryptionMethodEnterprise = "AES128" | "AES192" | "AES256" | "Zip20"

export type ZIPRestoreFilePathsMode = "Restore" | "DontRestore"

export type ZIPRestoreFilePathsModeEnterprise = "Восстанавливать" | "НеВосстанавливать"

export type ZIPStorePathMode = "DontStorePath" | "StoreRelativePath" | "StoreFullPath"

export type ZIPStorePathModeEnterprise = "НеСохранятьПути" | "СохранятьОтносительныеПути" | "СохранятьПолныеПути"

export type ZIPSubDirProcessingMode = "DontProcess" | "ProcessRecursively"

export type ZIPSubDirProcessingModeEnterprise = "НеОбрабатывать" | "ОбрабатыватьРекурсивно"

export type StatePresentation = "Visible" | "AdditionalShowMode" | "Picture" | "Text"

export type StatePresentationEnterprise = "Видимость" | "ДополнительныйРежимОтображения" | "Картинка" | "Текст"
