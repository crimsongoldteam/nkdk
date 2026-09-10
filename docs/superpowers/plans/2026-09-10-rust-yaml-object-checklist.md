# Чеклист перехода объектов на YAML-декларации и Rust

Дата сверки: 2026-09-10. [Главный план](2026-09-10-rust-yaml-declarations.md) · [Журнал проверок](../reports/2026-09-10-rust-yaml-progress.md).

## Как читать

- `[x]` — объект полностью перенесён и проверен по условиям ниже.
- `[ ]` — объект не завершён. Промежуточные результаты учитываются только в журнале.
- Служебные каталоги включены, чтобы не потерять их обязанности. Для них завершение означает перенос ответственности в общий Rust-механизм, а не обязательное создание отдельной YAML-декларации.

Приняты 9 common-объектов: двусторонние интерфейсы I8nText, FormattedI8nText, MetadataName, StringOrNumber, PredefinedCode, MinMaxValue, boolean, number и dateTime (XML ↔ YAML, валидация и структурная схема). Enterprise исключён из реализации и условий готовности по решению пользователя. Наличие общего компилятора, синтетического примера или успешного теста отдельного свойства не означает завершение всего объекта. В частности, `common.code-type` — синтетический пример, а не перенесённое системное перечисление.

## Когда ставить галочку

Для предметного объекта должны быть выполнены все условия:

1. Полный договор выражен YAML-декларацией: оба преобразования, проверки, состояния и возможные аномалии. Нет отдельных предметных функций преобразования на Rust или TS.
2. Декларация подключена к рабочему Rust-каталогу и используется владельцами объекта; нет вызова TypeScript для его выполнения.
3. Проверены XML → YAML, YAML → XML, round-trip, ошибки и аномалии, применимые профили и вложенные части на существующих неизменённых XML-фикстурах. Согласованные отличия от TS записаны.
4. Пройдены необходимые проверки слоя, включая `pnpm duplicates -- --base <commit>` для TypeScript, JavaScript и Rust; в строке указаны ссылки на декларацию, проверочные случаи/отчёт и дата приёмки. Машинный реестр покрытия приведён в соответствие.

Общая цель 10× по времени и памяти проверяется отдельно на e2e; галочка отдельного объекта её не подтверждает. Окончательное удаление TS относится к заключительному этапу проекта.

Работы группируются по [механизмам и семействам](2026-09-10-rust-yaml-catalog.md#перенос-семействами-рабочая-карта-механизмов). Общий механизм сам по себе не даёт галочку его потребителям.

## Правило обновления для исполнителя

После завершения каждого объекта, в той же порции изменений, обновить его строку, ссылки на доказательства и сводку; согласовать запись с `tests/migration/coverage.json`, если объект входит в этот реестр, и журналом. Не откладывать обновление до конца всего этапа. Промежуточные результаты записывать только в журнале; в чеклисте оставлять пустой флажок. При найденном несоответствии снять галочку и записать причину. Новые объекты и вложенные части добавлять при их обнаружении. Общую инфраструктуру не засчитывать вместо объектов.

## Сводка

| Группа | Записей | Полностью завершено |
|---|---:|---:|
| Общие объекты (common) | 90 | 9 |
| Вложенные части общих объектов | 27 | 0 |
| Прикладные объекты и их вложенные части | 56 | 0 |
| Формы, элементы и общие части форм | 66 | 0 |
| Системные перечисления (весь каталог) | 1 | 0 |

Список составлен по существующим каталогам с исходниками (тестовые каталоги исключены), реестру 90 common-каталогов и именам таблиц `*ToYAML` системных перечислений. Вложенные части перечислены отдельно: готовность родителя требует готовности его частей. Это количество единиц учёта, а не число независимых типов метаданных.

## Общие объекты (common)

- [ ] [commonObjects/accountingFlag](../../../packages/rules/metadata/commonObjects/accountingFlag)
- [ ] [commonObjects/accumulationRegisterAggregates](../../../packages/rules/metadata/commonObjects/accumulationRegisterAggregates)
- [ ] [commonObjects/additionalIndex](../../../packages/rules/metadata/commonObjects/additionalIndex)
- [x] [commonObjects/boolean](../../../packages/rules/metadata/commonObjects/boolean) — 2026-09-10: [декларация](../../../rust/declarations/common/boolean.yaml), [default без сокращения](../../../rust/declarations/probes/boolean-preserved-default.yaml), [общие проверки](../../../rust/crates/compiled-rules/tests/scalars.rs), [e2e](../../../tests/migration/scalar-value-e2e.json). Оба значения, отсутствие, сокращение и сохранение явного default.
- [ ] [commonObjects/border](../../../packages/rules/metadata/commonObjects/border)
- [ ] [commonObjects/characteristicsDescription](../../../packages/rules/metadata/commonObjects/characteristicsDescription)
- [ ] [commonObjects/childFileItemNames](../../../packages/rules/metadata/commonObjects/childFileItemNames)
- [ ] [commonObjects/childFormNames](../../../packages/rules/metadata/commonObjects/childFormNames)
- [ ] [commonObjects/childSubsystemNames](../../../packages/rules/metadata/commonObjects/childSubsystemNames)
- [ ] [commonObjects/childTemplateNames](../../../packages/rules/metadata/commonObjects/childTemplateNames)
- [ ] [commonObjects/choiceForm](../../../packages/rules/metadata/commonObjects/choiceForm)
- [ ] [commonObjects/choiceList](../../../packages/rules/metadata/commonObjects/choiceList)
- [ ] [commonObjects/clientApplicationInterface](../../../packages/rules/metadata/commonObjects/clientApplicationInterface)
- [ ] [commonObjects/color](../../../packages/rules/metadata/commonObjects/color)
- [ ] [commonObjects/commonAttributeContent](../../../packages/rules/metadata/commonObjects/commonAttributeContent)
- [ ] [commonObjects/dataCompositionSystem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem)
- [x] [commonObjects/dateTime](../../../packages/rules/metadata/commonObjects/dateTime) — 2026-09-10: [дата](../../../rust/declarations/common/date-time.yaml), [типизированная дата](../../../rust/declarations/common/typed-date-time.yaml), [default](../../../rust/declarations/probes/date-time-default.yaml), [26 календарных свойств e2e](../../../tests/migration/calendar-profile-e2e.json). Время как записано, константа при сборке, сокращение и схема.
- [ ] [commonObjects/exchangePlanContent](../../../packages/rules/metadata/commonObjects/exchangePlanContent)
- [ ] [commonObjects/externalFile](../../../packages/rules/metadata/commonObjects/externalFile)
- [ ] [commonObjects/externalPicture](../../../packages/rules/metadata/commonObjects/externalPicture)
- [ ] [commonObjects/fieldsList](../../../packages/rules/metadata/commonObjects/fieldsList)
- [ ] [commonObjects/fillValue](../../../packages/rules/metadata/commonObjects/fillValue)
- [ ] [commonObjects/font](../../../packages/rules/metadata/commonObjects/font)
- [x] [commonObjects/formattedI8nText](../../../packages/rules/metadata/commonObjects/formattedI8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/formatted-i8n-text.yaml), [приёмка](../reports/2026-09-10-formatted-i8n-acceptance.md).
- [ ] [commonObjects/functionalOptionsProperty](../../../packages/rules/metadata/commonObjects/functionalOptionsProperty)
- [ ] [commonObjects/help](../../../packages/rules/metadata/commonObjects/help)
- [ ] [commonObjects/homePageWorkArea](../../../packages/rules/metadata/commonObjects/homePageWorkArea)
- [x] [commonObjects/i8nText](../../../packages/rules/metadata/commonObjects/i8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/i8n-text.yaml), [приёмка и проверки](../reports/2026-09-10-i8n-acceptance.md).
- [ ] [commonObjects/indexField](../../../packages/rules/metadata/commonObjects/indexField)
- [ ] [commonObjects/inputByStringFields](../../../packages/rules/metadata/commonObjects/inputByStringFields)
- [ ] [commonObjects/internalInfo](../../../packages/rules/metadata/commonObjects/internalInfo)
- [ ] [commonObjects/metadataAttribute](../../../packages/rules/metadata/commonObjects/metadataAttribute)
- [ ] [commonObjects/metadataCommand](../../../packages/rules/metadata/commonObjects/metadataCommand)
- [ ] [commonObjects/metadataCommandGroup](../../../packages/rules/metadata/commonObjects/metadataCommandGroup)
- [ ] [commonObjects/metadataDocumentJournalColumn](../../../packages/rules/metadata/commonObjects/metadataDocumentJournalColumn)
- [ ] [commonObjects/metadataExternalDataSourceCube](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCube)
- [ ] [commonObjects/metadataExternalDataSourceCubeDimension](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeDimension)
- [ ] [commonObjects/metadataExternalDataSourceCubeResource](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeResource)
- [ ] [commonObjects/metadataExternalDataSourceDimensionTable](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceDimensionTable)
- [ ] [commonObjects/metadataExternalDataSourceField](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceField)
- [ ] [commonObjects/metadataExternalDataSourceFunction](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceFunction)
- [ ] [commonObjects/metadataExternalDataSourceTable](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceTable)
- [ ] [commonObjects/metadataField](../../../packages/rules/metadata/commonObjects/metadataField)
- [ ] [commonObjects/metadataHTTPServiceMethod](../../../packages/rules/metadata/commonObjects/metadataHTTPServiceMethod)
- [ ] [commonObjects/metadataHTTPServiceURLTemplate](../../../packages/rules/metadata/commonObjects/metadataHTTPServiceURLTemplate)
- [ ] [commonObjects/metadataIntegrationServiceChannel](../../../packages/rules/metadata/commonObjects/metadataIntegrationServiceChannel)
- [x] [commonObjects/metadataName](../../../packages/rules/metadata/commonObjects/metadataName) — 2026-09-10: [декларация](../../../rust/declarations/common/metadata-name.yaml), [773 имени e2e](../../../tests/migration/metadata-name-e2e.json), [проверки аномалий](../../../rust/crates/compiled-rules/tests/scalars.rs), [структурная схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [ ] [commonObjects/metadataObjectRefCollection](../../../packages/rules/metadata/commonObjects/metadataObjectRefCollection)
- [ ] [commonObjects/metadataPath](../../../packages/rules/metadata/commonObjects/metadataPath)
- [ ] [commonObjects/metadataRef](../../../packages/rules/metadata/commonObjects/metadataRef)
- [ ] [commonObjects/metadataRegisterAttribute](../../../packages/rules/metadata/commonObjects/metadataRegisterAttribute)
- [ ] [commonObjects/metadataRegisterDimension](../../../packages/rules/metadata/commonObjects/metadataRegisterDimension)
- [ ] [commonObjects/metadataRegisterField](../../../packages/rules/metadata/commonObjects/metadataRegisterField)
- [ ] [commonObjects/metadataRegisterResource](../../../packages/rules/metadata/commonObjects/metadataRegisterResource)
- [ ] [commonObjects/metadataSequenceDimension](../../../packages/rules/metadata/commonObjects/metadataSequenceDimension)
- [ ] [commonObjects/metadataTabularSection](../../../packages/rules/metadata/commonObjects/metadataTabularSection)
- [ ] [commonObjects/metadataTargetProjectResolvers](../../../packages/rules/metadata/commonObjects/metadataTargetProjectResolvers)
- [ ] [commonObjects/metadataTargets](../../../packages/rules/metadata/commonObjects/metadataTargets)
- [ ] [commonObjects/metadataTaskAddressingAttribute](../../../packages/rules/metadata/commonObjects/metadataTaskAddressingAttribute)
- [ ] [commonObjects/metadataValue](../../../packages/rules/metadata/commonObjects/metadataValue)
- [ ] [commonObjects/metadataWebServiceOperation](../../../packages/rules/metadata/commonObjects/metadataWebServiceOperation)
- [x] [commonObjects/minMaxValue](../../../packages/rules/metadata/commonObjects/minMaxValue) — 2026-09-10: [decimal](../../../rust/declarations/common/min-max-value.yaml), [строковый XML с запятой](../../../rust/declarations/common/min-max-value-text.yaml), [проверки профилей](../../../rust/crates/compiled-rules/tests/scalars.rs), [1934 свойства e2e](../../../tests/migration/min-max-value-e2e.json). Пустой nil владельца и отсутствие различаются; числа точные.
- [ ] [commonObjects/mobileDeviceCommandBarContent](../../../packages/rules/metadata/commonObjects/mobileDeviceCommandBarContent)
- [ ] [commonObjects/module](../../../packages/rules/metadata/commonObjects/module)
- [x] [commonObjects/number](../../../packages/rules/metadata/commonObjects/number) — 2026-09-10: [точное число](../../../rust/declarations/common/number.yaml), [тип decimal](../../../rust/declarations/common/typed-number.yaml), [тип string с точкой](../../../rust/declarations/common/number-as-text.yaml), [границы](../../../rust/declarations/probes/numeric-bound.yaml), [общие проверки](../../../rust/crates/compiled-rules/tests/scalars.rs), [e2e](../../../tests/migration/typed-scalar-value-e2e.json). Ограничения, условный максимум, default и исходная лексика.
- [ ] [commonObjects/picture](../../../packages/rules/metadata/commonObjects/picture)
- [ ] [commonObjects/predefined](../../../packages/rules/metadata/commonObjects/predefined)
- [x] [commonObjects/predefinedCode](../../../packages/rules/metadata/commonObjects/predefinedCode) — 2026-09-10: [декларация](../../../rust/declarations/common/predefined-code.yaml), [e2e семейства](../../../tests/migration/scalar-choice-e2e.json), [оба профиля и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [ ] [commonObjects/predefinedItem](../../../packages/rules/metadata/commonObjects/predefinedItem)
- [ ] [commonObjects/rootCommandInterface](../../../packages/rules/metadata/commonObjects/rootCommandInterface)
- [ ] [commonObjects/standardAttributeDescription](../../../packages/rules/metadata/commonObjects/standardAttributeDescription)
- [ ] [commonObjects/standardPeriod](../../../packages/rules/metadata/commonObjects/standardPeriod)
- [ ] [commonObjects/standardTabularSectionDescription](../../../packages/rules/metadata/commonObjects/standardTabularSectionDescription)
- [ ] [commonObjects/standartBeginningDate](../../../packages/rules/metadata/commonObjects/standartBeginningDate)
- [ ] [commonObjects/string](../../../packages/rules/metadata/commonObjects/string)
- [x] [commonObjects/stringOrNumber](../../../packages/rules/metadata/commonObjects/stringOrNumber) — 2026-09-10: [декларация](../../../rust/declarations/common/string-or-number.yaml), [e2e семейства](../../../tests/migration/scalar-choice-e2e.json), [оба профиля и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [ ] [commonObjects/styleItemValue](../../../packages/rules/metadata/commonObjects/styleItemValue)
- [ ] [commonObjects/typeDescription](../../../packages/rules/metadata/commonObjects/typeDescription)
- [ ] [commonObjects/typeLink](../../../packages/rules/metadata/commonObjects/typeLink)
- [ ] [commonObjects/usePurposes](../../../packages/rules/metadata/commonObjects/usePurposes)
- [ ] [commonObjects/userSettingsID](../../../packages/rules/metadata/commonObjects/userSettingsID)
- [ ] [commonObjects/userVisible](../../../packages/rules/metadata/commonObjects/userVisible)
- [ ] [commonObjects/uuid](../../../packages/rules/metadata/commonObjects/uuid)
- [ ] [commonObjects/webSocketClientHeaders](../../../packages/rules/metadata/commonObjects/webSocketClientHeaders)
- [ ] [commonObjects/wsDefinitionSchemas](../../../packages/rules/metadata/commonObjects/wsDefinitionSchemas)
- [ ] [commonObjects/xDTOPackages](../../../packages/rules/metadata/commonObjects/xDTOPackages)
- [ ] [commonObjects/xdtoTypeName](../../../packages/rules/metadata/commonObjects/xdtoTypeName)
- [ ] [commonObjects/xmlRoot](../../../packages/rules/metadata/commonObjects/xmlRoot)
- [ ] [commonObjects/сhoiceParameterLinks](../../../packages/rules/metadata/commonObjects/сhoiceParameterLinks)
- [ ] [commonObjects/сhoiceParameters](../../../packages/rules/metadata/commonObjects/сhoiceParameters)

## Вложенные части общих объектов

- [ ] [commonObjects/dataCompositionSystem/appearanceFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields)
- [ ] [commonObjects/dataCompositionSystem/availableFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields)
- [ ] [commonObjects/dataCompositionSystem/availableValues](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues)
- [ ] [commonObjects/dataCompositionSystem/calculatedField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedField)
- [ ] [commonObjects/dataCompositionSystem/calculatedFieldOrderExpression](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression)
- [ ] [commonObjects/dataCompositionSystem/calculatedFieldUseRestriction](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFieldUseRestriction)
- [ ] [commonObjects/dataCompositionSystem/calculatedFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFields)
- [ ] [commonObjects/dataCompositionSystem/conditionalAppearance](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearance)
- [ ] [commonObjects/dataCompositionSystem/conditionalAppearanceItem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem)
- [ ] [commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField)
- [ ] [commonObjects/dataCompositionSystem/dcsLocalStringType](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType)
- [ ] [commonObjects/dataCompositionSystem/dcsMetadataValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue)
- [ ] [commonObjects/dataCompositionSystem/dcsParameter](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter)
- [ ] [commonObjects/dataCompositionSystem/dscMetadataTypedValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue)
- [ ] [commonObjects/dataCompositionSystem/filter](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filter)
- [ ] [commonObjects/dataCompositionSystem/filterItem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem)
- [ ] [commonObjects/dataCompositionSystem/filterItem/fields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fields)
- [ ] [commonObjects/dataCompositionSystem/order](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/order)
- [ ] [commonObjects/dataCompositionSystem/orderItemFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/orderItemFields)
- [ ] [commonObjects/dataCompositionSystem/parameterValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/parameterValue)
- [ ] [commonObjects/dataCompositionSystem/settingsParameterValueCollection](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection)
- [ ] [commonObjects/dataCompositionSystem/structureItemGroup](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup)
- [ ] [commonObjects/dataCompositionSystem/structureItemGroup/collection](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection)
- [ ] [commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto)
- [ ] [commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField)
- [ ] [commonObjects/metadataValue/fixedArray](../../../packages/rules/metadata/commonObjects/metadataValue/fixedArray)
- [ ] [commonObjects/metadataValue/formChoiceList](../../../packages/rules/metadata/commonObjects/metadataValue/formChoiceList)

## Прикладные объекты и их вложенные части

- [ ] [appliedObjects/configuration](../../../packages/rules/metadata/appliedObjects/configuration)
- [ ] [appliedObjects/configuration/migrations](../../../packages/rules/metadata/appliedObjects/configuration/migrations)
- [ ] [appliedObjects/configurationExtension](../../../packages/rules/metadata/appliedObjects/configurationExtension)
- [ ] [appliedObjects/dataPathCommon](../../../packages/rules/metadata/appliedObjects/dataPathCommon)
- [ ] [appliedObjects/metadataAccountingRegister](../../../packages/rules/metadata/appliedObjects/metadataAccountingRegister)
- [ ] [appliedObjects/metadataAccumulationRegister](../../../packages/rules/metadata/appliedObjects/metadataAccumulationRegister)
- [ ] [appliedObjects/metadataBot](../../../packages/rules/metadata/appliedObjects/metadataBot)
- [ ] [appliedObjects/metadataBusinessProcess](../../../packages/rules/metadata/appliedObjects/metadataBusinessProcess)
- [ ] [appliedObjects/metadataCalculationRegister](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister)
- [ ] [appliedObjects/metadataCalculationRegister/recalculation](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation)
- [ ] [appliedObjects/metadataCalculationRegister/recalculation/dimension](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension)
- [ ] [appliedObjects/metadataCatalog](../../../packages/rules/metadata/appliedObjects/metadataCatalog)
- [ ] [appliedObjects/metadataChartOfAccounts](../../../packages/rules/metadata/appliedObjects/metadataChartOfAccounts)
- [ ] [appliedObjects/metadataChartOfAccounts/predefined](../../../packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined)
- [ ] [appliedObjects/metadataChartOfCalculationTypes](../../../packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes)
- [ ] [appliedObjects/metadataChartOfCharacteristicTypes](../../../packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes)
- [ ] [appliedObjects/metadataCommand](../../../packages/rules/metadata/appliedObjects/metadataCommand)
- [ ] [appliedObjects/metadataCommandGroup](../../../packages/rules/metadata/appliedObjects/metadataCommandGroup)
- [ ] [appliedObjects/metadataCommonAttribute](../../../packages/rules/metadata/appliedObjects/metadataCommonAttribute)
- [ ] [appliedObjects/metadataCommonCommand](../../../packages/rules/metadata/appliedObjects/metadataCommonCommand)
- [ ] [appliedObjects/metadataCommonForm](../../../packages/rules/metadata/appliedObjects/metadataCommonForm)
- [ ] [appliedObjects/metadataCommonModule](../../../packages/rules/metadata/appliedObjects/metadataCommonModule)
- [ ] [appliedObjects/metadataCommonPicture](../../../packages/rules/metadata/appliedObjects/metadataCommonPicture)
- [ ] [appliedObjects/metadataCommonTemplate](../../../packages/rules/metadata/appliedObjects/metadataCommonTemplate)
- [ ] [appliedObjects/metadataConstant](../../../packages/rules/metadata/appliedObjects/metadataConstant)
- [ ] [appliedObjects/metadataDataProcessor](../../../packages/rules/metadata/appliedObjects/metadataDataProcessor)
- [ ] [appliedObjects/metadataDefinedType](../../../packages/rules/metadata/appliedObjects/metadataDefinedType)
- [ ] [appliedObjects/metadataDocument](../../../packages/rules/metadata/appliedObjects/metadataDocument)
- [ ] [appliedObjects/metadataDocumentJournal](../../../packages/rules/metadata/appliedObjects/metadataDocumentJournal)
- [ ] [appliedObjects/metadataDocumentNumerator](../../../packages/rules/metadata/appliedObjects/metadataDocumentNumerator)
- [ ] [appliedObjects/metadataEnumeration](../../../packages/rules/metadata/appliedObjects/metadataEnumeration)
- [ ] [appliedObjects/metadataEventSubscription](../../../packages/rules/metadata/appliedObjects/metadataEventSubscription)
- [ ] [appliedObjects/metadataExchangePlan](../../../packages/rules/metadata/appliedObjects/metadataExchangePlan)
- [ ] [appliedObjects/metadataExternalDataSource](../../../packages/rules/metadata/appliedObjects/metadataExternalDataSource)
- [ ] [appliedObjects/metadataFilterCriterion](../../../packages/rules/metadata/appliedObjects/metadataFilterCriterion)
- [ ] [appliedObjects/metadataFunctionalOption](../../../packages/rules/metadata/appliedObjects/metadataFunctionalOption)
- [ ] [appliedObjects/metadataFunctionalOptionsParameter](../../../packages/rules/metadata/appliedObjects/metadataFunctionalOptionsParameter)
- [ ] [appliedObjects/metadataHTTPService](../../../packages/rules/metadata/appliedObjects/metadataHTTPService)
- [ ] [appliedObjects/metadataInformationRegister](../../../packages/rules/metadata/appliedObjects/metadataInformationRegister)
- [ ] [appliedObjects/metadataIntegrationService](../../../packages/rules/metadata/appliedObjects/metadataIntegrationService)
- [ ] [appliedObjects/metadataInterface](../../../packages/rules/metadata/appliedObjects/metadataInterface)
- [ ] [appliedObjects/metadataLanguage](../../../packages/rules/metadata/appliedObjects/metadataLanguage)
- [ ] [appliedObjects/metadataReport](../../../packages/rules/metadata/appliedObjects/metadataReport)
- [ ] [appliedObjects/metadataRole](../../../packages/rules/metadata/appliedObjects/metadataRole)
- [ ] [appliedObjects/metadataScheduledJob](../../../packages/rules/metadata/appliedObjects/metadataScheduledJob)
- [ ] [appliedObjects/metadataSequence](../../../packages/rules/metadata/appliedObjects/metadataSequence)
- [ ] [appliedObjects/metadataSessionParameter](../../../packages/rules/metadata/appliedObjects/metadataSessionParameter)
- [ ] [appliedObjects/metadataSettingsStorage](../../../packages/rules/metadata/appliedObjects/metadataSettingsStorage)
- [ ] [appliedObjects/metadataStyle](../../../packages/rules/metadata/appliedObjects/metadataStyle)
- [ ] [appliedObjects/metadataStyleItem](../../../packages/rules/metadata/appliedObjects/metadataStyleItem)
- [ ] [appliedObjects/metadataSubsystem](../../../packages/rules/metadata/appliedObjects/metadataSubsystem)
- [ ] [appliedObjects/metadataTask](../../../packages/rules/metadata/appliedObjects/metadataTask)
- [ ] [appliedObjects/metadataWSReference](../../../packages/rules/metadata/appliedObjects/metadataWSReference)
- [ ] [appliedObjects/metadataWebService](../../../packages/rules/metadata/appliedObjects/metadataWebService)
- [ ] [appliedObjects/metadataWebSocketClient](../../../packages/rules/metadata/appliedObjects/metadataWebSocketClient)
- [ ] [appliedObjects/metadataXDTOPackage](../../../packages/rules/metadata/appliedObjects/metadataXDTOPackage)

## Формы, элементы и общие части форм

- [ ] [forms/clientApplicationForm](../../../packages/rules/metadata/forms/clientApplicationForm)
- [ ] [forms/commonObjects](../../../packages/rules/metadata/forms/commonObjects)
- [ ] [forms/commonObjects/chart](../../../packages/rules/metadata/forms/commonObjects/chart)
- [ ] [forms/commonObjects/childItems](../../../packages/rules/metadata/forms/commonObjects/childItems)
- [ ] [forms/commonObjects/commandInterface](../../../packages/rules/metadata/forms/commonObjects/commandInterface)
- [ ] [forms/commonObjects/commandName](../../../packages/rules/metadata/forms/commonObjects/commandName)
- [ ] [forms/commonObjects/commandSet](../../../packages/rules/metadata/forms/commonObjects/commandSet)
- [ ] [forms/commonObjects/dataPath](../../../packages/rules/metadata/forms/commonObjects/dataPath)
- [ ] [forms/commonObjects/dynamicList](../../../packages/rules/metadata/forms/commonObjects/dynamicList)
- [ ] [forms/commonObjects/event](../../../packages/rules/metadata/forms/commonObjects/event)
- [ ] [forms/commonObjects/flowchartContext](../../../packages/rules/metadata/forms/commonObjects/flowchartContext)
- [ ] [forms/commonObjects/formAttribute](../../../packages/rules/metadata/forms/commonObjects/formAttribute)
- [ ] [forms/commonObjects/formCommand](../../../packages/rules/metadata/forms/commonObjects/formCommand)
- [ ] [forms/commonObjects/formParameter](../../../packages/rules/metadata/forms/commonObjects/formParameter)
- [ ] [forms/commonObjects/ganttChart](../../../packages/rules/metadata/forms/commonObjects/ganttChart)
- [ ] [forms/commonObjects/ganttChartFieldTable](../../../packages/rules/metadata/forms/commonObjects/ganttChartFieldTable)
- [ ] [forms/commonObjects/planner](../../../packages/rules/metadata/forms/commonObjects/planner)
- [ ] [forms/commonObjects/scrollBarUse](../../../packages/rules/metadata/forms/commonObjects/scrollBarUse)
- [ ] [forms/commonObjects/settingsFragment](../../../packages/rules/metadata/forms/commonObjects/settingsFragment)
- [ ] [forms/commonObjects/spreadsheetDocument](../../../packages/rules/metadata/forms/commonObjects/spreadsheetDocument)
- [ ] [forms/commonObjects/tableAdditionalSource](../../../packages/rules/metadata/forms/commonObjects/tableAdditionalSource)
- [ ] [forms/elements](../../../packages/rules/metadata/forms/elements)
- [ ] [forms/elements/autoCommandBar](../../../packages/rules/metadata/forms/elements/autoCommandBar)
- [ ] [forms/elements/baseElement](../../../packages/rules/metadata/forms/elements/baseElement)
- [ ] [forms/elements/button](../../../packages/rules/metadata/forms/elements/button)
- [ ] [forms/elements/buttonGroup](../../../packages/rules/metadata/forms/elements/buttonGroup)
- [ ] [forms/elements/calendarField](../../../packages/rules/metadata/forms/elements/calendarField)
- [ ] [forms/elements/chartField](../../../packages/rules/metadata/forms/elements/chartField)
- [ ] [forms/elements/checkBoxField](../../../packages/rules/metadata/forms/elements/checkBoxField)
- [ ] [forms/elements/columnGroup](../../../packages/rules/metadata/forms/elements/columnGroup)
- [ ] [forms/elements/commandBar](../../../packages/rules/metadata/forms/elements/commandBar)
- [ ] [forms/elements/contextMenu](../../../packages/rules/metadata/forms/elements/contextMenu)
- [ ] [forms/elements/dendrogramField](../../../packages/rules/metadata/forms/elements/dendrogramField)
- [ ] [forms/elements/extendedTooltip](../../../packages/rules/metadata/forms/elements/extendedTooltip)
- [ ] [forms/elements/formDecoration](../../../packages/rules/metadata/forms/elements/formDecoration)
- [ ] [forms/elements/formField](../../../packages/rules/metadata/forms/elements/formField)
- [ ] [forms/elements/formGroup](../../../packages/rules/metadata/forms/elements/formGroup)
- [ ] [forms/elements/formattedDocumentField](../../../packages/rules/metadata/forms/elements/formattedDocumentField)
- [ ] [forms/elements/ganttChartField](../../../packages/rules/metadata/forms/elements/ganttChartField)
- [ ] [forms/elements/geographicalSchemaField](../../../packages/rules/metadata/forms/elements/geographicalSchemaField)
- [ ] [forms/elements/graphicalSchemaField](../../../packages/rules/metadata/forms/elements/graphicalSchemaField)
- [ ] [forms/elements/htmlDocumentField](../../../packages/rules/metadata/forms/elements/htmlDocumentField)
- [ ] [forms/elements/inputField](../../../packages/rules/metadata/forms/elements/inputField)
- [ ] [forms/elements/labelDecoration](../../../packages/rules/metadata/forms/elements/labelDecoration)
- [ ] [forms/elements/labelField](../../../packages/rules/metadata/forms/elements/labelField)
- [ ] [forms/elements/page](../../../packages/rules/metadata/forms/elements/page)
- [ ] [forms/elements/pages](../../../packages/rules/metadata/forms/elements/pages)
- [ ] [forms/elements/pdfDocumentField](../../../packages/rules/metadata/forms/elements/pdfDocumentField)
- [ ] [forms/elements/periodField](../../../packages/rules/metadata/forms/elements/periodField)
- [ ] [forms/elements/pictureDecoration](../../../packages/rules/metadata/forms/elements/pictureDecoration)
- [ ] [forms/elements/pictureField](../../../packages/rules/metadata/forms/elements/pictureField)
- [ ] [forms/elements/plannerField](../../../packages/rules/metadata/forms/elements/plannerField)
- [ ] [forms/elements/popup](../../../packages/rules/metadata/forms/elements/popup)
- [ ] [forms/elements/progressBarField](../../../packages/rules/metadata/forms/elements/progressBarField)
- [ ] [forms/elements/radioButtonField](../../../packages/rules/metadata/forms/elements/radioButtonField)
- [ ] [forms/elements/ruleRuntime](../../../packages/rules/metadata/forms/elements/ruleRuntime)
- [ ] [forms/elements/searchControlAddition](../../../packages/rules/metadata/forms/elements/searchControlAddition)
- [ ] [forms/elements/searchStringAddition](../../../packages/rules/metadata/forms/elements/searchStringAddition)
- [ ] [forms/elements/spreadSheetDocumentField](../../../packages/rules/metadata/forms/elements/spreadSheetDocumentField)
- [ ] [forms/elements/table](../../../packages/rules/metadata/forms/elements/table)
- [ ] [forms/elements/textDocumentField](../../../packages/rules/metadata/forms/elements/textDocumentField)
- [ ] [forms/elements/trackBarField](../../../packages/rules/metadata/forms/elements/trackBarField)
- [ ] [forms/elements/usualGroup](../../../packages/rules/metadata/forms/elements/usualGroup)
- [ ] [forms/elements/viewStatusAddition](../../../packages/rules/metadata/forms/elements/viewStatusAddition)
- [ ] [forms/helpers](../../../packages/rules/metadata/forms/helpers)
- [ ] [forms/settingsComposer](../../../packages/rules/metadata/forms/settingsComposer)

## Системные перечисления

- [ ] **Весь каталог системных перечислений** — пакетный перенос 675 пар таблиц через общий механизм; проверка полноты имён и значений, обоих преобразований, ошибок, представления DCS и мобильных разрешений. [Таблицы](../../../packages/rules/metadata/systemEnumerations/types.ts) · [Текущая регистрация](../../../packages/rules/metadata/systemEnumerations/metadataRules.ts).

Таблицы переносятся автоматически всем каталогом, без ручной реализации отдельного преобразователя для каждого перечисления. Галочка ставится после проверки всего каталога.

## Общие механизмы вне счётчика объектов

- [x] Созданы компилятор деклараций, типизация и генерация базовых преобразований и проверок Rust. Это работающая основа, а не поддержка всех конструкций и объектов.
- [x] Реализованы точные десятичные числа в общем механизме.
- [ ] Завершить все формы коллекций, состояний и аномалий, необходимые каталогу.
- [ ] Внедрить согласованную краткую запись деклараций без повторения подразумеваемых частей.
- [ ] Перенести регистрации, композицию, стандартные члены и подготовку фактов для объектов.
- [ ] Перенести обработку ресурсов, файлов и проектных операций по [плану приложения](2026-09-10-rust-yaml-application.md).
- [ ] Завершить CLI/MCP, сборку и проверки без TypeScript/Node.js.
- [ ] Проверить цели 10× на согласованном e2e-наборе и удалить TypeScript.

Подробные проверенные результаты основы приведены в журнале. Последние изменения аномалий и сохранения XML ещё находятся в рабочей копии; галочек объектам они не добавляют.
