# Извлечение свойств и сравнение с собранными TS-правилами

Команда: `pnpm migration:extract`. База Git: `3ed62e9ecbe0089dcf625e1f190ad2688477f666`.
Машинный результат: [rules-extraction.json](../../../tests/migration/rules-extraction.json).
Статический анализ не исполняет TS. Отдельный процесс Node/tsx загружает
локальные модули для независимого чтения ключей properties, itemType и
регистрации состояний расширения; преобразования,
callbacks и операции проекта не вызываются. Импорт выполняет обычную
инициализацию модулей. Процесс ограничен 60 секундами и 8 МиБ вывода;
ошибка процесса или загрузки не считается совпадением.

## Результат

Исследовано 225 объявлений переменных с окончанием Rules в
rules.ts и childRules.ts из снимка инвентаризации. Это не весь возможный каталог регистраций:
построители и объявления в других файлах доступны как зависимости, но не
являются самостоятельными целями этого сравнения.

- **keys-match: 224**
- **fragment-without-properties: 1**

keys-match означает совпадение полного известного списка ключей и порядка
Object.keys(properties). Явный xmlOrder отдельно сравнивается с собранным TS
в поле xmlOrderMatches; это не проверка поведения конвертера.
blocked означает нераскрытую форму; известные свойства сохраняются вместе с
причиной блокировки. not-exported — внутреннее объявление: статические
сведения извлечены, но прямой доступ через экспорт отсутствует; его нужно
проверить через собранного владельца. fragment-without-properties — общий
набор параметров, не самостоятельный владелец.

## Состояния расширений

Для 135 объявлений автоматически найден
дополнительный договор PropertyState. Он сохранён в propertyStates каждого
объявления: исходные профили, регистрация типа и только относящиеся к нему
изменения по версиям, в исходном порядке. Режим совместимости не выбирается
при извлечении; ограничения ранних версий не теряются.

Это входные данные переноса, а не исполняемый обработчик Rust. Генератор
коллекций блокирует полную приёмку элемента до подключения этой сборки;
обычные проекции свойств остаются доступными. Пустой список означает отсутствие
регистрации, null — отсутствие подтверждённых сведений.

## Что реализовано

- Разрешение импортов и переименований, ссылок на свойства и общие константы.
- Литералы, массивы, композиция объектов, происхождение полей и переопределения.
- Статический разбор простых функций-построителей: параметры, значения по
  умолчанию, локальные const, возврат выражения, известные условия.
- Object.freeze, Object.keys, Object.entries, Object.fromEntries , map, indexOf и slice для известных значений без подмены Object; функции map разбираются статически.
- Деструктуризация объектов, namespace-импорты и проверяемая композиция фрагментов.
- Доступ к локальным правилам через экспортированного владельца без вызова getters.
- Проверенное соответствие metadataRuleFragment с проверкой полного хеша
  исходного файла и сохранением ограничения точного списка ключей. Изменение
  реализации или неверный список блокирует соответствие.
- Произвольные функции и неподдержанные операции не исполняются. Причины
  сохраняются по цепочке зависимостей; циклы и бюджет вычисления ограничены.
- Каждый известный параметр либо извлечён, либо содержит явное неразобранное
  выражение. Ничего не заменено пустым значением или аномалией.

## Оставшиеся группы конструкций



Весь состав свойств текущих целей раскрыт. Неразобранными могут оставаться
отдельные параметры и функции преобразования; они перечислены у свойств в
машинном результате. Совпадение ключей не подтверждает их семантику.

## Все проверенные объявления

«Статические параметры» не означает готовность YAML или Rust. Для остальных
свойств сохранены выражения/блокировки, например функции значений по умолчанию.
Числа у blocked — только известная часть, а не доказанный итоговый состав.

| Объявление | Известные свойства | Статические параметры | Сравнение |
|---|---:|---:|---|
| MetadataConfigurationRules | 73 | 73 | keys-match |
| MetadataConfigurationExtensionRules | 49 | 48 | keys-match |
| dataPathCommonRules | 0 | 0 | fragment-without-properties |
| MetadataAccountingRegisterAttributeRules | 28 | 27 | keys-match |
| MetadataAccountingRegisterDimensionRules | 38 | 29 | keys-match |
| MetadataAccountingRegisterResourceRules | 31 | 27 | keys-match |
| MetadataAccountingRegisterCommandRules | 15 | 14 | keys-match |
| MetadataAccountingRegisterRules | 32 | 27 | keys-match |
| MetadataAccumulationRegisterAttributeRules | 28 | 27 | keys-match |
| MetadataAccumulationRegisterDimensionRules | 38 | 29 | keys-match |
| MetadataAccumulationRegisterResourceRules | 28 | 27 | keys-match |
| MetadataAccumulationRegisterCommandRules | 15 | 14 | keys-match |
| MetadataAccumulationRegisterRules | 31 | 26 | keys-match |
| MetadataBotRules | 10 | 10 | keys-match |
| MetadataBusinessProcessAttributeRules | 30 | 29 | keys-match |
| MetadataBusinessProcessTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataBusinessProcessTabularSectionRules | 11 | 8 | keys-match |
| MetadataBusinessProcessRules | 55 | 50 | keys-match |
| MetadataCalculationRegisterAttributeRules | 29 | 28 | keys-match |
| MetadataCalculationRegisterDimensionRules | 38 | 29 | keys-match |
| MetadataCalculationRegisterResourceRules | 28 | 27 | keys-match |
| MetadataCalculationRegisterRecalculationDimensionRules | 8 | 6 | keys-match |
| RecalculationRules | 11 | 9 | keys-match |
| MetadataCalculationRegisterCommandRules | 15 | 14 | keys-match |
| MetadataCalculationRegisterRules | 36 | 32 | keys-match |
| MetadataCatalogAttributeRules | 33 | 32 | keys-match |
| MetadataCatalogTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataCatalogTabularSectionRules | 12 | 9 | keys-match |
| MetadataCatalogRules | 69 | 63 | keys-match |
| MetadataChartOfAccountsAttributeRules | 30 | 29 | keys-match |
| MetadataChartOfAccountsTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataChartOfAccountsTabularSectionRules | 11 | 8 | keys-match |
| PredefinedAccountingFlagRules | 2 | 2 | keys-match |
| PredefinedExtDimensionTypeRules | 3 | 3 | keys-match |
| ChartOfAccountsPredefinedItemRules | 13 | 12 | keys-match |
| ChartOfAccountsPredefinedRules | 2 | 1 | keys-match |
| MetadataChartOfAccountsCommandRules | 15 | 14 | keys-match |
| MetadataChartOfAccountsRules | 63 | 58 | keys-match |
| MetadataChartOfCalculationTypesAttributeRules | 30 | 29 | keys-match |
| MetadataChartOfCalculationTypesTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataChartOfCalculationTypesTabularSectionRules | 11 | 8 | keys-match |
| MetadataChartOfCalculationTypesCommandRules | 15 | 14 | keys-match |
| MetadataChartOfCalculationTypesRules | 59 | 54 | keys-match |
| MetadataChartOfCharacteristicTypesAttributeRules | 31 | 30 | keys-match |
| MetadataChartOfCharacteristicTypesTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataChartOfCharacteristicTypesTabularSectionRules | 12 | 9 | keys-match |
| MetadataChartOfCharacteristicTypesCommandRules | 15 | 14 | keys-match |
| MetadataChartOfCharacteristicTypesRules | 65 | 61 | keys-match |
| MetadataCommandGroupRules | 11 | 11 | keys-match |
| MetadataCommonAttributeRules | 42 | 42 | keys-match |
| MetadataCommonCommandRules | 18 | 18 | keys-match |
| MetadataCommonFormRules | 16 | 16 | keys-match |
| MetadataCommonModuleRules | 16 | 16 | keys-match |
| MetadataCommonPictureRules | 10 | 10 | keys-match |
| MetadataCommonTemplateRules | 9 | 9 | keys-match |
| MetadataConstantRules | 37 | 37 | keys-match |
| MetadataDataProcessorAttributeRules | 25 | 24 | keys-match |
| MetadataDataProcessorTabularSectionAttributeRules | 27 | 26 | keys-match |
| MetadataDataProcessorTabularSectionRules | 10 | 7 | keys-match |
| MetadataDataProcessorCommandRules | 15 | 14 | keys-match |
| MetadataDataProcessorRules | 22 | 15 | keys-match |
| MetadataDefinedTypeRules | 9 | 9 | keys-match |
| MetadataDocumentAttributeRules | 31 | 30 | keys-match |
| MetadataDocumentTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataDocumentTabularSectionRules | 11 | 8 | keys-match |
| MetadataDocumentCommandRules | 15 | 14 | keys-match |
| MetadataDocumentRules | 59 | 55 | keys-match |
| MetadataDocumentJournalCommandRules | 15 | 14 | keys-match |
| MetadataDocumentJournalRules | 24 | 23 | keys-match |
| MetadataDocumentNumeratorRules | 12 | 12 | keys-match |
| MetadataEnumerationValueRules | 6 | 6 | keys-match |
| MetadataEnumerationRules | 26 | 26 | keys-match |
| MetadataEventSubscriptionRules | 10 | 10 | keys-match |
| MetadataExchangePlanAttributeRules | 31 | 30 | keys-match |
| MetadataExchangePlanTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataExchangePlanTabularSectionRules | 11 | 8 | keys-match |
| MetadataExchangePlanCommandRules | 15 | 14 | keys-match |
| MetadataExchangePlanRules | 55 | 51 | keys-match |
| MetadataExternalDataSourceRules | 12 | 12 | keys-match |
| MetadataFilterCriterionRules | 19 | 18 | keys-match |
| MetadataFunctionalOptionRules | 10 | 10 | keys-match |
| MetadataFunctionalOptionsParameterRules | 8 | 8 | keys-match |
| MetadataHTTPServiceRules | 12 | 11 | keys-match |
| MetadataInformationRegisterAttributeRules | 32 | 31 | keys-match |
| MetadataInformationRegisterDimensionRules | 41 | 32 | keys-match |
| MetadataInformationRegisterResourceRules | 32 | 31 | keys-match |
| MetadataInformationRegisterCommandRules | 15 | 14 | keys-match |
| MetadataInformationRegisterRules | 41 | 37 | keys-match |
| MetadataIntegrationServiceRules | 11 | 10 | keys-match |
| MetadataInterfaceRules | 9 | 8 | keys-match |
| MetadataLanguageRules | 8 | 7 | keys-match |
| MetadataReportAttributeRules | 25 | 24 | keys-match |
| MetadataReportTabularSectionAttributeRules | 27 | 26 | keys-match |
| MetadataReportTabularSectionRules | 10 | 7 | keys-match |
| MetadataReportCommandRules | 15 | 14 | keys-match |
| MetadataReportRules | 28 | 21 | keys-match |
| MetadataRoleRules | 8 | 8 | keys-match |
| MetadataScheduledJobRules | 15 | 15 | keys-match |
| MetadataSequenceRules | 15 | 15 | keys-match |
| MetadataSessionParameterRules | 8 | 8 | keys-match |
| MetadataSettingsStorageRules | 15 | 15 | keys-match |
| MetadataStyleRules | 8 | 8 | keys-match |
| MetadataStyleItemRules | 9 | 8 | keys-match |
| MetadataSubsystemRules | 16 | 15 | keys-match |
| MetadataTaskAttributeRules | 30 | 29 | keys-match |
| MetadataTaskTabularSectionAttributeRules | 28 | 27 | keys-match |
| MetadataTaskTabularSectionRules | 11 | 8 | keys-match |
| MetadataTaskRules | 58 | 54 | keys-match |
| MetadataWebServiceRules | 14 | 13 | keys-match |
| MetadataWebSocketClientRules | 17 | 17 | keys-match |
| MetadataWSReferenceRules | 11 | 11 | keys-match |
| MetadataXDTOPackageRules | 9 | 9 | keys-match |
| AccountingFlagRules | 33 | 30 | keys-match |
| ExtDimensionAccountingFlagRules | 33 | 30 | keys-match |
| AccumulationRegisterAggregateRules | 4 | 4 | keys-match |
| AccumulationRegisterAggregatesRules | 2 | 2 | keys-match |
| AdditionalIndexItemRules | 5 | 5 | keys-match |
| AdditionalIndexRules | 2 | 2 | keys-match |
| CharacteristicsDescriptionRules | 12 | 12 | keys-match |
| ClientApplicationInterfaceRules | 7 | 7 | keys-match |
| AppearanceFieldsRules | 12 | 12 | keys-match |
| CalculatedFieldRules | 9 | 9 | keys-match |
| CalculatedFieldOrderExpressionRules | 3 | 3 | keys-match |
| CalculatedFieldUseRestrictionRules | 4 | 4 | keys-match |
| ConditionalAppearanceRules | 4 | 4 | keys-match |
| ConditionalAppearanceItemRules | 18 | 18 | keys-match |
| DataCompositionSchemaDataSetFieldRules | 15 | 2 | keys-match |
| DCSParameterRules | 12 | 12 | keys-match |
| FilterRules | 5 | 5 | keys-match |
| FilterItemComparisonRules | 10 | 10 | keys-match |
| FilterItemGroupRules | 8 | 8 | keys-match |
| OrderRules | 4 | 4 | keys-match |
| OrderItemFieldRules | 4 | 4 | keys-match |
| GroupItemAutoRules | 1 | 1 | keys-match |
| GroupItemFieldRules | 6 | 6 | keys-match |
| StructureItemGroupRules | 2 | 2 | keys-match |
| ExchangePlanContentItemRules | 3 | 2 | keys-match |
| ExchangePlanExtensionPropertyItemRules | 2 | 2 | keys-match |
| ExchangePlanContentRules | 3 | 3 | keys-match |
| HomePageWorkAreaRules | 6 | 6 | keys-match |
| MetadataAttributeRules | 33 | 32 | keys-match |
| MetadataCommandRules | 15 | 14 | keys-match |
| MetadataDocumentJournalColumnRules | 8 | 8 | keys-match |
| MetadataExternalDataSourceCubeCommandRules | 15 | 14 | keys-match |
| MetadataExternalDataSourceCubeRules | 27 | 26 | keys-match |
| MetadataExternalDataSourceCubeCollectionRules | 26 | 25 | keys-match |
| MetadataExternalDataSourceCubeDimensionRules | 44 | 28 | keys-match |
| MetadataExternalDataSourceCubeResourceRules | 37 | 21 | keys-match |
| MetadataExternalDataSourceDimensionTableCommandRules | 15 | 14 | keys-match |
| MetadataExternalDataSourceDimensionTableRules | 31 | 30 | keys-match |
| MetadataExternalDataSourceDimensionTableCollectionRules | 30 | 29 | keys-match |
| MetadataExternalDataSourceFieldRules | 29 | 29 | keys-match |
| MetadataExternalDataSourceFunctionRules | 9 | 9 | keys-match |
| MetadataExternalDataSourceTableCommandRules | 15 | 14 | keys-match |
| MetadataExternalDataSourceTableRules | 51 | 49 | keys-match |
| MetadataExternalDataSourceTableCollectionRules | 50 | 48 | keys-match |
| MetadataHTTPServiceMethodRules | 8 | 8 | keys-match |
| MetadataHTTPServiceURLTemplateRules | 8 | 8 | keys-match |
| MetadataIntegrationServiceChannelRules | 11 | 10 | keys-match |
| MetadataRegisterAttributeRules | 33 | 32 | keys-match |
| MetadataRegisterDimensionRules | 42 | 33 | keys-match |
| MetadataRegisterResourceRules | 36 | 32 | keys-match |
| MetadataSequenceDimensionRules | 7 | 7 | keys-match |
| MetadataTabularSectionRules | 12 | 10 | keys-match |
| MetadataTaskAddressingAttributeRules | 31 | 30 | keys-match |
| MetadataWebServiceParameterRules | 9 | 9 | keys-match |
| MetadataWebServiceOperationRules | 12 | 12 | keys-match |
| PredefinedRules | 2 | 1 | keys-match |
| PredefinedItemRules | 8 | 7 | keys-match |
| RootCommandInterfaceRules | 7 | 7 | keys-match |
| StandardAttributeDescriptionRules | 27 | 25 | keys-match |
| StandardTabularSectionDescriptionRules | 6 | 6 | keys-match |
| ClientApplicationFormRules | 76 | 67 | keys-match |
| ClientApplicationFormWithExtendedPresentationRules | 77 | 68 | keys-match |
| DynamicListRules | 22 | 22 | keys-match |
| FormAttributeRules | 21 | 19 | keys-match |
| FormAttributeColumnRules | 8 | 7 | keys-match |
| FormAttributeAdditionalColumnRules | 2 | 2 | keys-match |
| FormCommandRules | 13 | 12 | keys-match |
| FormParameterRules | 3 | 3 | keys-match |
| AutoCommandBarRules | 5 | 5 | keys-match |
| ButtonRules | 41 | 41 | keys-match |
| CommandBarButtonRules | 41 | 41 | keys-match |
| ButtonGroupRules | 25 | 25 | keys-match |
| CalendarFieldRules | 66 | 66 | keys-match |
| ChartFieldRules | 49 | 49 | keys-match |
| CheckBoxFieldRules | 52 | 51 | keys-match |
| TableCheckBoxFieldRules | 56 | 55 | keys-match |
| ColumnGroupRules | 32 | 32 | keys-match |
| CommandBarRules | 26 | 26 | keys-match |
| ContextMenuRules | 4 | 4 | keys-match |
| DendrogramFieldRules | 53 | 53 | keys-match |
| ExtendedTooltipRules | 31 | 31 | keys-match |
| FormattedDocumentFieldRules | 56 | 56 | keys-match |
| GanttChartFieldRules | 55 | 55 | keys-match |
| GeographicalSchemaFieldRules | 51 | 51 | keys-match |
| GraphicalSchemaFieldRules | 57 | 57 | keys-match |
| HTMLDocumentFieldRules | 56 | 56 | keys-match |
| InputFieldRules | 115 | 115 | keys-match |
| TableInputFieldRules | 119 | 119 | keys-match |
| LabelDecorationRules | 34 | 34 | keys-match |
| LabelFieldRules | 58 | 58 | keys-match |
| TableLabelFieldRules | 62 | 62 | keys-match |
| PageRules | 38 | 38 | keys-match |
| PagesRules | 28 | 28 | keys-match |
| PDFDocumentFieldRules | 54 | 54 | keys-match |
| PeriodFieldRules | 56 | 56 | keys-match |
| PictureDecorationRules | 38 | 38 | keys-match |
| PictureFieldRules | 62 | 62 | keys-match |
| TablePictureFieldRules | 66 | 66 | keys-match |
| PlannerFieldRules | 59 | 59 | keys-match |
| PopupRules | 30 | 30 | keys-match |
| ProgressBarFieldRules | 59 | 59 | keys-match |
| RadioButtonFieldRules | 56 | 56 | keys-match |
| SingleSearchControlAdditionRules | 21 | 21 | keys-match |
| SearchControlAdditionRules | 22 | 22 | keys-match |
| SingleSearchStringAdditionRules | 20 | 20 | keys-match |
| SearchStringAdditionRules | 21 | 21 | keys-match |
| SpreadSheetDocumentFieldRules | 74 | 74 | keys-match |
| TableRules | 96 | 85 | keys-match |
| TextDocumentFieldRules | 59 | 59 | keys-match |
| TrackBarFieldRules | 60 | 60 | keys-match |
| UsualGroupRules | 45 | 45 | keys-match |
| SingleViewStatusAdditionRules | 22 | 22 | keys-match |
| ViewStatusAdditionRules | 23 | 23 | keys-match |

## Приёмка этапа и дальнейшие действия

Матрица проверяет приоритеты, происхождение, неизвестные вызовы, циклы,
запрет пропуска операторов с побочными эффектами, ошибку загрузки и
несовпадение ключей, а также изменение проверенного построителя фрагментов.
Старые тесты, XML-фикстуры, YAML-декларации и флажки объектов не менялись.

Следующий этап — генерация кандидатов для исследованных конструкций.
Сначала сопоставить частые построители готовым common и сохранить общие
фрагменты; неизвестные выражения и локальные объявления без подтверждения
не подключать автоматически к рабочему каталогу. Семантическое сравнение
параметров, XML/YAML, аномалий и внешних файлов остаётся обязательным условием
переноса объекта и не заменяется выполненной проверкой ключей.
