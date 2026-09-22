13 сентября: автоматизирован выпуск общих индексов, языков и собственного
имени элемента коллекции; проверен ключ словаря без явного `yaml`.
Поправки вложенного свойства и служебного атрибута локализуются внутри
элемента коллекции; проверен независимый обычный сосед.
Полные объекты ещё не приняты, флажки не меняются: **19/90 common**.

13 сентября: добавлен общий словарь полных записей `record-mapping`.
Проверены простые и составные элементы и восстановление повторных имён.
Это механизм языка: новых полностью принятых объектов нет, **19/90 common**.
Контекст элементов и служебный XML остаются в плане.
Дополнительно проверен ключ внутри группы зависимых скаляров: соседние поля
и аномалии сохраняются. Новых флажков это не добавляет.

ExternalFile принят: четыре свойства подключены к трём файловым сборкам
конфигурации, расширения и XDTO-пакета. Принято **19/90 common**.
Прошли 199 Rust-тестов, 76 сценариев кандидатов, 19 проверок инструмента
миграции, Clippy, архитектурная проверка и поиск дублей. Полные владельцы
конфигурации и XDTO ещё не приняты; [подробности](../reports/2026-09-13-external-file.md).


Завершено распознавание группы Help/AdditionalIndexes: 39/39 вхождений.
Для отчёта и обработки сохранено требование привязать source_root к каталогу
имени; Rust-групповая операция проверена на их e2e-каталогах в обе стороны.
Это не завершение полных владельцев: рабочие привязки остаются 4,
новых флажков нет, common — 18/90.

Продолжение пакета Help: распознаются 37/39 вхождений; добавлены два
составных кандидата (основные свойства конфигурации/общей формы + Help).
Проходят 72 проверки кандидатов и проверка сборок документа/журнала.
Это новые проверяемые подключения к проекциям, не полные владельцы.
Два вычисляемых пути остаются блокировками. Итог common — 18/90.

Массовый пакет Help, 13 сентября: +17 проверенных соответствий старых правил;
генератор распознаёт 36/39 вхождений. Проходят 68 проверок внешних файлов
на e2e. Рабочих привязок владельцев по-прежнему 4; новых полных объектов
нет, флажки и итог 18/90 не меняются. Оставшиеся 3 блокировки: конфигурация
без externalMetadata, вычисляемые пути обработки и отчёта.

# Чеклист перехода объектов на YAML-декларации и Rust

Следующий этап описан в [плане единого преобразования](2026-09-13-unified-conversion-plan.md).
Флажки обновляются только после полной приёмки объекта, предусмотренной этим планом.

Принято **24/90 common**. Полные Document и DocumentJournal ещё не приняты.
Общий XML-record расширен типизированными атрибутами и сохранением их исходной
записи. Это инфраструктура; дополнительных флажков объектов не устанавливает.
Правила присутствия полей вложенной скалярной записи также перенесены в общий
путь. Счётчик принятия объектов от этой подготовки не изменяется.
Подключены ограничения полей вложенной скалярной записи и полные пути их
диагностик. Это также подготовка общего механизма, без новых флажков объектов.
Составная запись больше не требует единственного булева атрибута: проверены
несколько скалярных атрибутов, поле-элемент и коллекция. Новых принятых объектов
от этого изменения нет. Следующий пакет обязательных простых свойств добавил
19 кандидатов: всего 3369; 127 независимых сценариев прошли. Флажки не меняются.
Подготовка и восстановление GeneratedType, сборка соседних коллекций, обычные свойства владельцев и команды, цепочки реквизитов и внешние формы выбора, свойства и регистрация дочерних форм, общие группы модулей и файлов макетов, декларация страниц справки и её файловые ресурсы описаны в [текущем плане](2026-09-10-rust-yaml-current.md); флажки остаются снятыми до полного переноса.
Подробности промежуточных работ — в журнале, ниже только итоговые флажки.

Коллекция со ссылкой на целую декларацию строки получила выполнение XML/YAML,
включая вложенные коллекции и аномалии отдельных вхождений. Это общий механизм;
AdditionalIndexes принят после проверки идентичностей, корневого YAML-массива
и внешнего документа. [Отчёт](../reports/2026-09-13-additional-indexes.md).

Дата сверки: 2026-09-22. [Главный план](2026-09-10-rust-yaml-declarations.md) · [Журнал проверок](../reports/2026-09-10-rust-yaml-progress.md).

## Как читать

- `[x]` — объект полностью перенесён и проверен по условиям ниже.
- `[ ]` — объект не завершён. Промежуточные результаты учитываются только в журнале.
- Служебные каталоги включены, чтобы не потерять их обязанности. Для них завершение означает перенос ответственности в общий Rust-механизм, а не обязательное создание отдельной YAML-декларации.

Приняты 24 common-объекта: двусторонние интерфейсы I8nText, FormattedI8nText, MetadataName, StringOrNumber, PredefinedCode, MinMaxValue, boolean, number, dateTime, FieldsList, IndexField, WebSocketClientHeaders, XDTOPackages, UsePurposes, XDTOTypeName, Help, AdditionalIndex, String, TypeDescription, TypeLink, MetadataValue, ChoiceParameters и ChoiceParameterLinks (XML ↔ YAML, валидация и структурная схема), а также ExternalFile (перенос непрозрачных файлов в обе стороны). Enterprise исключён из реализации и условий готовности по решению пользователя. Наличие общего компилятора, синтетического примера или успешного теста отдельного свойства не означает завершение всего объекта. В частности, `common.code-type` — синтетический пример, а не перенесённое системное перечисление.

## Когда ставить галочку

Для предметного объекта должны быть выполнены все условия:

1. Полный договор выражен YAML-декларацией: оба преобразования, проверки, состояния и возможные аномалии. Нет отдельных предметных функций преобразования на Rust или TS.
2. Декларация подключена к рабочему Rust-каталогу и используется владельцами объекта; нет вызова TypeScript для его выполнения.
3. Проверены XML → YAML, YAML → XML, round-trip, ошибки и аномалии, применимые профили и вложенные части на существующих неизменённых XML-фикстурах. Согласованные отличия от TS записаны.
4. Пройдены необходимые проверки слоя, включая `pnpm duplicates -- --base <commit>` для TypeScript, JavaScript и Rust; в строке указаны ссылки на декларацию, проверочные случаи/отчёт и дата приёмки. Машинный реестр покрытия приведён в соответствие.

Общая цель 10× по времени и памяти проверяется отдельно на e2e; галочка отдельного объекта её не подтверждает. Окончательное удаление TS относится к заключительному этапу проекта.

Работы группируются по [механизмам и семействам](2026-09-10-rust-yaml-catalog.md#перенос-семействами-рабочая-карта-механизмов). Общий механизм сам по себе не даёт галочку его потребителям.

При приёмке проверять настоящую декларативность: предметные имена, значения и исключения находятся в YAML, а общий Rust-код не содержит условий по конкретному объекту. Проверка того же механизма на независимой декларации с другими именами обязательна для нового семейства.

## Правило обновления для исполнителя

После завершения каждого объекта, в той же порции изменений, обновить его строку, ссылки на доказательства и сводку; согласовать запись с `tests/migration/coverage.json`, если объект входит в этот реестр, и журналом. Не откладывать обновление до конца всего этапа. Промежуточные результаты записывать только в журнале; в чеклисте оставлять пустой флажок. При найденном несоответствии снять галочку и записать причину. Новые объекты и вложенные части добавлять при их обнаружении. Общую инфраструктуру не засчитывать вместо объектов.

## Сводка

| Группа | Записей | Полностью завершено |
|---|---:|---:|
| Общие объекты (common) | 90 | 24 |
| Вложенные части общих объектов | 27 | 2 |
| Прикладные объекты и их вложенные части | 57 | 2 |
| Формы, элементы и общие части форм | 66 | 0 |
| Системные перечисления (весь каталог) | 1 | 1 |

Список составлен по существующим каталогам с исходниками (тестовые каталоги исключены), реестру 90 common-каталогов и именам таблиц `*ToYAML` системных перечислений. Вложенные части перечислены отдельно: готовность родителя требует готовности его частей. Это количество единиц учёта, а не число независимых типов метаданных.

## Общие объекты (common)

- [ ] [commonObjects/accountingFlag](../../../packages/rules/metadata/commonObjects/accountingFlag)
- [ ] [commonObjects/accumulationRegisterAggregates](../../../packages/rules/metadata/commonObjects/accumulationRegisterAggregates)
- [x] [commonObjects/additionalIndex](../../../packages/rules/metadata/commonObjects/additionalIndex) — 2026-09-13: [декларация](../../../rust/declarations/common/additional-indexes.yaml), [приёмка](../reports/2026-09-13-additional-indexes.md), [e2e](../../../tests/migration/additional-indexes-e2e.json).
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
- [x] [commonObjects/externalFile](../../../packages/rules/metadata/commonObjects/externalFile) — 2026-09-13: [декларация](../../../rust/declarations/common/external-file.yaml), [сборки владельцев](../../../rust/declarations/resources), [приёмка](../reports/2026-09-13-external-file.md).
- [ ] [commonObjects/externalPicture](../../../packages/rules/metadata/commonObjects/externalPicture)
- [x] [commonObjects/fieldsList](../../../packages/rules/metadata/commonObjects/fieldsList) — 2026-09-11: [декларация](../../../rust/declarations/common/fields-list.yaml), [readable](../../../rust/declarations/common/fields-list-readable.yaml), [профиль владельца](../../../rust/declarations/probes/fields-list-readable-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [ ] [commonObjects/fillValue](../../../packages/rules/metadata/commonObjects/fillValue)
- [ ] [commonObjects/font](../../../packages/rules/metadata/commonObjects/font)
- [x] [commonObjects/formattedI8nText](../../../packages/rules/metadata/commonObjects/formattedI8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/formatted-i8n-text.yaml), [приёмка](../reports/2026-09-10-formatted-i8n-acceptance.md).
- [ ] [commonObjects/functionalOptionsProperty](../../../packages/rules/metadata/commonObjects/functionalOptionsProperty)
- [x] [commonObjects/help](../../../packages/rules/metadata/commonObjects/help) — 2026-09-12: [декларация](../../../rust/declarations/fragments/help.yaml), [владельцы](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [группа файлов](../../../rust/apps/nkdk/tests/resources.rs).
- [ ] [commonObjects/homePageWorkArea](../../../packages/rules/metadata/commonObjects/homePageWorkArea)
- [x] [commonObjects/i8nText](../../../packages/rules/metadata/commonObjects/i8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/i8n-text.yaml), [приёмка и проверки](../reports/2026-09-10-i8n-acceptance.md).
- [x] [commonObjects/indexField](../../../packages/rules/metadata/commonObjects/indexField) — 2026-09-11: [декларация](../../../rust/declarations/common/index-field.yaml), [профиль AdditionalFields](../../../rust/declarations/probes/index-field-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
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
- [x] [commonObjects/metadataValue](../../../packages/rules/metadata/commonObjects/metadataValue) — 2026-09-21: [рекурсивная декларация](../../../rust/declarations/common/metadata-value.yaml), [879 неизменённых XML-вхождений и 17 выбранных скалярных/пустых случаев](../../../tests/migration/metadata-value-e2e.json), [оба направления, составы, рекурсия и аномалии](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md). Точные числа, календарные значения, ссылки, списки, FixedArray и FormChoiceList исполняются общим Rust-компилятором; неизвестная XML-форма сохраняется как выведенная аномалия.
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
- [ ] [commonObjects/standardPeriod](../../../packages/rules/metadata/commonObjects/standardPeriod) — для полной приёмки нужны пути данных М6 и реальный случай e2e; проверки преобразования записаны в журнале М3.
- [ ] [commonObjects/standardTabularSectionDescription](../../../packages/rules/metadata/commonObjects/standardTabularSectionDescription)
- [ ] [commonObjects/standartBeginningDate](../../../packages/rules/metadata/commonObjects/standartBeginningDate) — для полной приёмки нужны пути данных М6; проверки преобразования записаны в журнале М3.
- [x] [commonObjects/string](../../../packages/rules/metadata/commonObjects/string) — 2026-09-13: [декларация](../../../rust/declarations/common/string.yaml), [матрица и 51 значение e2e](../../../rust/crates/compiled-rules/tests/scalars.rs), [приёмка и границы](../reports/2026-09-13-ready-common-package.md).
- [x] [commonObjects/stringOrNumber](../../../packages/rules/metadata/commonObjects/stringOrNumber) — 2026-09-10: [декларация](../../../rust/declarations/common/string-or-number.yaml), [e2e семейства](../../../tests/migration/scalar-choice-e2e.json), [оба профиля и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [ ] [commonObjects/styleItemValue](../../../packages/rules/metadata/commonObjects/styleItemValue)
- [x] [commonObjects/typeDescription](../../../packages/rules/metadata/commonObjects/typeDescription) — 2026-09-19: [декларации](../../../rust/declarations/common/type-description.yaml), [202 уникальных случая из 1125 неизменённых XML](../../../tests/migration/type-description-e2e.json), [оба направления, ограничения, значения по умолчанию и YAML-only](../../../rust/crates/compiled-rules/tests/type_description.rs), [договор и приёмка](../reports/2026-09-14-type-description-contract.md). Переносчик распознаёт 96/96 применений; полный каталог кандидатов компилируется без предметного Rust.
- [x] [commonObjects/typeLink](../../../packages/rules/metadata/commonObjects/typeLink) — 2026-09-19: [декларация](../../../rust/declarations/common/type-link.yaml), [89 реальных путей](../../../tests/migration/type-link-e2e.json), [обычная, типизированная, пустая и DCS-формы](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [договор и приёмка](../reports/2026-09-14-type-description-contract.md). Переносчик распознаёт 46/46 применений; порядок, повторы и аномалии сохраняются общими механизмами.
- [x] [commonObjects/usePurposes](../../../packages/rules/metadata/commonObjects/usePurposes) — 2026-09-11: [декларация](../../../rust/declarations/common/use-purposes.yaml), [профиль default](../../../rust/declarations/probes/use-purposes-default.yaml), [оба направления и аномалии](../../../rust/crates/compiled-rules/tests/sequences.rs), [175 свойств e2e](../../../tests/migration/use-purposes-e2e.json). Сокращения точных списков, сохранение порядка/повторов и неизвестных значений; ограничения и аномалии без предметного Rust.
- [ ] [commonObjects/userSettingsID](../../../packages/rules/metadata/commonObjects/userSettingsID)
- [ ] [commonObjects/userVisible](../../../packages/rules/metadata/commonObjects/userVisible)
- [ ] [commonObjects/uuid](../../../packages/rules/metadata/commonObjects/uuid)
- [x] [commonObjects/webSocketClientHeaders](../../../packages/rules/metadata/commonObjects/webSocketClientHeaders) — 2026-09-10: [декларация](../../../rust/declarations/common/web-socket-client-headers.yaml), [профиль владельца](../../../rust/declarations/probes/web-socket-client-headers-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [ ] [commonObjects/wsDefinitionSchemas](../../../packages/rules/metadata/commonObjects/wsDefinitionSchemas)
- [x] [commonObjects/xDTOPackages](../../../packages/rules/metadata/commonObjects/xDTOPackages) — 2026-09-10: [декларация](../../../rust/declarations/common/xdto-packages.yaml), [профиль владельца](../../../rust/declarations/probes/xdto-packages-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [x] [commonObjects/xdtoTypeName](../../../packages/rules/metadata/commonObjects/xdtoTypeName) — декларация `common/xdto-type-name.yaml`, общий QName по URI и локальному имени; XML ↔ YAML, схема, валидация, вывод аномалий; 8 реальных свойств: `tests/migration/xdto-type-name-e2e.json`, независимые проверки QName в core/compiler/compiled-rules.
- [ ] [commonObjects/xmlRoot](../../../packages/rules/metadata/commonObjects/xmlRoot)
- [x] [commonObjects/сhoiceParameterLinks](../../../packages/rules/metadata/commonObjects/сhoiceParameterLinks) — 2026-09-21: [декларация](../../../rust/declarations/common/choice-parameter-links.yaml), [274 реальных вхождения](../../../tests/migration/choice-parameters-e2e.json), [оба направления и пустые состояния](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md).
- [x] [commonObjects/сhoiceParameters](../../../packages/rules/metadata/commonObjects/сhoiceParameters) — 2026-09-21: [декларация](../../../rust/declarations/common/choice-parameters.yaml), [281 реальное вхождение](../../../tests/migration/choice-parameters-e2e.json), [словарь значений и рекурсивный MetadataValue](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md).

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
- [x] [commonObjects/metadataValue/fixedArray](../../../packages/rules/metadata/commonObjects/metadataValue/fixedArray) — 2026-09-21: входит в [единую рекурсивную декларацию](../../../rust/declarations/common/metadata-value.yaml); один и несколько элементов, вложенные значения, `xsi:nil`, порядок и аномалии проверены в [приёмке](../reports/2026-09-20-recursive-value-runtime.md).
- [x] [commonObjects/metadataValue/formChoiceList](../../../packages/rules/metadata/commonObjects/metadataValue/formChoiceList) — 2026-09-21: входит в [единую рекурсивную декларацию](../../../rust/declarations/common/metadata-value.yaml); представление I8nText, вложенное значение, пустые состояния и обратное преобразование проверены в [приёмке](../reports/2026-09-20-recursive-value-runtime.md).

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
- [x] [appliedObjects/metadataDefinedType](../../../packages/rules/metadata/appliedObjects/metadataDefinedType) — 2026-09-22: [декларации](../../../rust/declarations/objects/defined-type.yaml), [проектные e2e-проверки](../../../rust/apps/nkdk/tests/facts.rs), [приёмка](../reports/2026-09-22-defined-type-owner.md).
- [ ] [appliedObjects/metadataDocument](../../../packages/rules/metadata/appliedObjects/metadataDocument)
- [ ] [appliedObjects/metadataDocumentJournal](../../../packages/rules/metadata/appliedObjects/metadataDocumentJournal)
- [ ] [appliedObjects/metadataDocumentNumerator](../../../packages/rules/metadata/appliedObjects/metadataDocumentNumerator)
- [ ] [appliedObjects/metadataEnumeration](../../../packages/rules/metadata/appliedObjects/metadataEnumeration) — [оставшаяся полная сборка](../reports/2026-09-14-enumeration-owner-assembly.md).
- [x] **MetadataEnumerationValueRules — значение перечисления** — 2026-09-14: полная дочерняя коллекция в рабочей операции Rust, cf/cfe, контекст владельца, режимы совместимости, аномалии и экспорт без референса. [Декларации](../../../rust/declarations/objects/enumeration-values.generated.yaml) · [Машинные случаи](../../../tests/migration/enum-values-operation.json) · [Приёмка](../reports/2026-09-14-enum-value-real.md). Родительское перечисление остаётся отдельным незавершённым объектом.
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

- [x] **Весь каталог системных перечислений** — 2026-09-10: 678 перечислений, 3501 обратимая пара, включая мобильные разрешения; обычный XML и типизированный XML DCS. Общие механизмы проверяют варианты и сохраняют неизвестные значения, отсутствие, пустоту и отличия XML-типа. [Декларации](../../../rust/declarations/common/system-enumerations.yaml) · [Полный реестр пар и исходников](../../../tests/migration/system-enumeration-tables.json) · [Единая проверка каталога](../../../rust/crates/compiled-rules/tests/system_enumerations.rs) · [95 свойств e2e](../../../tests/migration/system-enumeration-e2e.json). Особые default и подавление свойств владельцами принимаются вместе с владельцами; Enterprise исключён.

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

Подробные проверенные результаты основы приведены в журнале. Профили путей (695 корневых и 1211 путей членов из e2e) ещё не завершают metadataPath: остаются остальные формы, общий выбор профиля, сокращения и проверка связей. В 474 случаях член и вложенный объект выбираются общей [декларацией](../../../rust/declarations/common/metadata-structural-path.yaml) по словарям и разделителям. Ограничения выбранного варианта сохраняются; это ещё не выбор всех форм metadataPath. Флажки ссылочных объектов не изменены; принято 15/90 common. Изменения находятся в рабочей копии.

Уточнено распознавание первого многосимвольного разделителя; оно проверено
независимой матрицей и повторным e2e на собранном CLI. Это улучшение общего
механизма, новых отметок готовности объектов нет.

Предопределённые значения, пустые ссылки и MainTable проверены на
[39 проекциях e2e](../../../tests/migration/metadata-terminal-path-e2e.json).
Исправлен прежний слишком широкий отбор Table: AdditionalIndex.Table имеет
строковый договор и не переводится. MetadataName переиспользуется без копии
ограничения в новых представлениях. Флажки полного переноса не изменены.
Самостоятельная text-sequence подключена к генератору: ограничения каждого
элемента, перевод словарей и аномалии физического свойства проверяются вместе.
[20 хвостов путей e2e](../../../tests/migration/metadata-object-segments-e2e.json)
прошли оба направления на CLI. Проекция исключает корень и владельца;
композиция начала и хвоста теперь подключена; проверка существования цели
и полный набор форм metadataPath ещё не готовы.
Флажки ссылочных common остаются снятыми; принято 15/90.

Генератор цепочки проверяет границы без повторного прохода по отдельным
элементам и резервирует итоговую строку один раз. Это улучшение общего
механизма; оно не добавляет отметок готовности common.

Фиксированное начало и переменная коллекция сегментов генерируются общим
механизмом. common.metadata-object-chain-path переиспользует словари и
MetadataName; это вспомогательный профиль, не новый завершённый common.
Проверены [20 полных записей путей e2e](../../../tests/migration/metadata-object-chain-path-e2e.json)
на свежем CLI. Затем подключена проверка конечной цели по индексам:
235 корней и 12 детей из cf e2e, 17 путей с проверкой YAML и восстановления XML.
[Происхождение данных](../../../tests/migration/metadata-root-index-inventory.json).
Общие fold/each выражают обход и ограничения свойства без частных обработчиков.
Флажок metadataPath остаётся снятым до всех форм, владельцев и проектной интеграции.


2026-09-12: [14 тестовых договоров кандидатов](../reports/2026-09-12-rules-contracts.md)
прошли на Rust. Это проверка пяти проекций свойств; полные объекты не приняты,
новые флажки не установлены. Счётчик остаётся 16/90 common.

Продолжение проверки кандидатов: 29 случаев, включая пустые состояния,
порядок, повторы и аномалии базового профиля I8nText. Это не завершает
новый объект; флажки и счётчик 16/90 не изменены.

Проверки кандидатов расширены до 46: обычный I8nText, сокращение по имени,
отсутствие свойства внутри Properties и при известном имени. Исправлено
наследование common в генераторе кандидатов. Это ещё не полный владелец;
флажки остаются без изменений, 16/90 common.

Массовое извлечение охватывает 224 набора свойств rules.ts/childRules.ts.
Проверены совместные свойства e2e, включая реквизиты, WebService и WebSocket.
MinMaxValue и три семейства списков подключены к кандидатам; это не приёмка
полных объектов. Флажки без изменений: 16/90 common.

Переносчик подключает также FormattedI8nText. 68 проверок защищают полные
ожидаемые YAML, включая scalar-аномалии и отсутствие атрибута formatted.
Состав и явный xmlOrder 224 правил совпали с TS. Новых принятых объектов нет.

Прошли 74 проверки кандидатов, включая QName вложенных WebService и списки
AdditionalIndex. Для 2995 свойств получены декларации-кандидаты. Полные
владельцы ещё не приняты; флажки без изменений (16/90).

Прошли 79 проверок, включая группы команд с подготовленным индексом.
Исправлена обычная форма Group по 74 значениям e2e; редкий xsi:type сохраняется
как аномалия. 3012 свойств-кандидатов; новые флажки не установлены.

Прошли 85 проверок: добавлены собственные/общие формы и нумераторы с индексами.
3111 свойств-кандидатов не означают готовность полных объектов. Новые флажки
не установлены; счётчик 16/90. Системные перечисления остаются одним пунктом.

Прошли 89 проверок: дополнительно выражены разные значения при отсутствии
XML/YAML у логических свойств форм. 3145 свойств-кандидатов, ещё 2732
вхождения заблокированы. Полные объекты не приняты, флажки без изменений.

Прошли 90 проверок, включая список документов журнала и повторения ссылок.
Полный набор тестов проекта и проверка типов зелёные. Новых принятых объектов
нет: это проекции свойств, счётчик остаётся 16/90.

Прошёл 91 договор, включая «Вводится на основании» и дочернюю таблицу.
3154 свойства-кандидата, 2723 вхождения заблокированы. Флажки без изменений:
полная оболочка, дочерние объекты и внешние файлы ещё требуют приёмки.

Дополнительно перенесён договор сохранения явных значений по умолчанию;
3165 свойств-кандидатов и 91 прошедшая проверка. Новых принятых объектов нет,
счётчик остаётся 16/90; 2712 вхождений ещё заблокированы.

Прошли 98 договоров, включая 39 поддержанных свойств источника Form на
четырёх реальных формах и StringOrNumber. Получены 3247 свойств-кандидатов;
2630 вхождений заблокированы. Полные формы ещё не приняты: флажки и счётчик
16/90 сохраняются до проверки оставшихся свойств, дочерних объектов и ресурсов.

Добавлены четыре проверки второго источника формы (Metadata), всего 102
прошедших договора. Разделение источников проверено; полного переноса формы
это не подтверждает. Новых флажков нет.

Поддержаны пути с пространствами имён: 3318 свойств-кандидатов, 104
прошедших договора, 2559 заблокированных вхождений. Полный Rust-набор зелёный.
Число принятых common по-прежнему 16/90; проекции не заменяют приёмку объектов.

Постоянные числовые границы перенесены для девяти свойств: 3327 кандидатов,
110 прошедших договоров, 2550 блокировок. Новых полностью принятых объектов
нет; бинарные флажки остаются без изменений.

Проверены явный HTTPМетод при XML-default, логические YAML-литералы из common
и строковые defaults конфигурации. Всего 3343 кандидата и 113 прошедших
договоров; 2534 вхождения заблокированы. Полная конфигурация этим не принята,
флажки common остаются 16/90.

Проверка массового переноса: UsePurposes подключён во всех пяти обнаруженных
вхождениях; базовый профиль и профиль с назначением по умолчанию проверены
раздельно. Всего прошёл 121 договор кандидатов. Это не приёмка содержащих их
владельцев; дополнительные флажки не установлены.

Два свойства dateTime получили кандидаты; проверены дата, время и default. Всего 124 сценария. Новые флажки объектов не установлены.


2026-09-13: завершён слой независимых состояний XML-записей/коллекций и YAML-полей/
обычных списков. Полный Rust workspace — 192 теста; после последнего уточнения
служебной привязки повторно прошли 127 договоров кандидатов. Сохранены 3369
кандидатов, 838 фрагментов, 813 проекций и 2508 блокировок. Дополнительных флажков
нет: сборка вложенного элемента, AdditionalIndexes и полные владельцы остаются
непринятыми. Принято по-прежнему **16/90 common**.


2026-09-13: после сборки XML/YAML-состояний владельца прошли полный Rust workspace
(192 теста) и все 127 договоров кандидатов на текущем коде. Проверены сокращения,
аномалии, независимые состояния и сочетание скаляров с коллекцией. Кандидатов
по-прежнему 3369; нового полностью принятого объекта нет. Флажки сохраняются
строго бинарными: **16/90 common**. AdditionalIndexes, Document и DocumentJournal
остаются без флажков до полной приёмки.


### 2026-09-13: состояние вложенной скалярной YAML-записи

`ScalarRecordReader` принимает события общей YAML-последовательности; сборщик
владельца подключает его для вложенной скалярной записи. Отсутствие оболочки,
пустая запись, повторные ключи и теги сохраняют прежние договоры. Для обычного
пути не создаются промежуточные YAML-байты или дерево.

Добавлена одна проверка независимости состояний в conversion-core; существующая
матрица генератора расширена сочетанием скалярного атрибута, вложенной записи и
соседнего поля. Ожидаемый XML задан независимо; источник байтов при приёме
событий пустой. Проверка обязательных полей пустой записи сохранена.
Целевая матрица генератора и проверки YAML прошли. Архитектура Rust и новые
дубли проверены успешно. Все 164 теста двух затронутых пакетов и Clippy для них прошли.

Число полностью принятых common остаётся 16/90. AdditionalIndexes не отмечен:
ссылка на целую декларацию элемента, вложенные коллекции и идентичности ещё
требуют завершения. Самопроверка универсальности: ветвление идёт по форме
представления, частных имён объектов и свойств в общем обработчике нет.


### 2026-09-13: полный договор элемента коллекции — связывание

Ссылка `value.item: {use: row}` позволяет опустить `representations.xml.item`
и `representations.yaml.item` одновременно. Компилятор сохраняет целую
декларацию строки и специализирует её параметры, не копируя поля в описание
коллекции. Схема скалярной записи сохраняет обязательность, значения по
умолчанию и ограничения. Проверены явные параметры и параметры по умолчанию,
неполная пара представлений и запрет неявного представления встроенного типа.
Примеры включены в существующую проверку схемы деклараций.

Это завершение связывания, а не выполнения коллекции. Генерация жизненного
цикла строки, вложенные коллекции и приёмка AdditionalIndexes остаются открыты.
Флажки объектов не изменены: 16/90 common. Полная проверка Rust прошла: 194 теста. Разбор ссылки объединён в
`LinkedType::as_reference`; новых дублей нет. После объединения повторно
прошли 133 теста компилятора и модели, а также Clippy их целей.
Архитектурная проверка Rust, форматирование и `git diff --check` прошли.
# Проверка состояния 13 сентября

Проверены четыре существующих подключения Help/AdditionalIndexes к документу
и журналу, включая внешние XML и ресурсы. Новых полностью принятых объектов
нет; флажки и итог 18/90 не изменяются.

Реестр готовых подключений сформировал два кандидата для 19 вхождений.
Это не новые полностью перенесённые объекты: итог остаётся 18/90,
дополнительные флажки не выставлены. Пять случаев проверяют внешние XML.

### 2026-09-21: вложенные вклады типов

Генератор принимает `forEach` по `TypeDescription.items` внутри владельца и
заимствует имя из соседнего поля; проверены XML и YAML на настоящей декларации.
Это общий механизм подготовки фактов, а не приёмка нового объекта. Флажки не
меняются: граф альтернатив `DefinedType` и потребитель `FillValue` ещё не связаны.

### 2026-09-22: типизированный граф альтернатив

Генератор умеет строить граф из декларативного `contributions.union` и
передавать его как заимствованный вход потребителю. Проверены настоящий
`TypeDescription.items`, цепочка определяемых типов, цикл и обе стороны
преобразования. Полная сборка `MetadataDefinedType` и применение графа в
`FillValue` ещё не выполнены; принято **24/90 common**, флажки не меняются.
Проверка источника графа на неизменённой паре XML/YAML определяемого типа из
e2e подтвердила два одинаковых набора альтернатив; имя YAML получено из
типизированного адреса файла. Это всё ещё не полный владелец: UUID,
InternalInfo и состояния расширения не приняты.
Ограничение `FillValue` теперь читает подготовленные альтернативы через
типизированный вход; переносчик автоматически подаёт индекс всем кандидатам
реквизитов. На неизменённом определяемом типе из e2e отдельно проверены
строковая и числовая ветви и несовместимая ссылка. Это ещё не полный
`DefinedType` или `FillValue`: владельцы, стандартные реквизиты и прочие
профили остаются без приёмки; итог **24/90** и флажки не меняются.
Отсутствующий определяемый тип проверен отдельно: он даёт одну семантическую
аномалию `fact.missing`, без ложной несовместимости значения и без `!xml/raw`.
Полная декларация `MetadataDefinedType` теперь проходит четыре неизменённых
e2e-пары основной конфигурации и расширения в обе стороны. Профиль расширения
генерируется из базовой декларации; `InternalInfo` — из исходного `rules.ts`.
Выбор профиля и подготовка фактов ещё не подключены к рабочему маршруту Rust,
поэтому флажок `appliedObjects/metadataDefinedType` остаётся пустым; сводка
common не меняется: **24/90**. Пройдены 165 проверок корпуса, 133 проверок
подключений, 87 проверок коллекций, `pnpm test`, архитектурные ограничения
и поиск новых дублей.

Подготовка `InternalInfo` для `MetadataDefinedType` теперь получается
генератором из исходного правила и общего образца вкладов, без обработки
этого вида в Rust. Общая операция `nkdk::operation::prepare` готовит факты
один раз для набора преобразований; она проверена на четырёх неизменённых e2e-парах:
обычный объект и расширение, полный и минимальный варианты, оба направления.
Для нормального отсутствия вложенной коллекции общий генератор публикует
пустой граф альтернатив; повреждённую запись не считает готовой.
Выбор декларации и входных сведений для каталога проекта пока выполняется
вызывающим кодом, а не проектным маршрутизатором. Флажок полного переноса
`appliedObjects/metadataDefinedType` остаётся пустым; **24/90 common**.

Источники собственной и базовой идентичности `MetadataDefinedType` теперь
генерируются из XML-путей декларации владельца. `InternalInfo` получает UUID
через подготовленный индекс по имени и компоненту; ручные UUID удалены из
входов рабочего сценария. Общий читатель фактов пропускает посторонние поля
полного XML только при подготовке индекса, оставляя обычное преобразование
строгим. Четыре неизменённые e2e-пары проходят в обе стороны. Проектный
маршрутизатор и полная приёмка владельца остаются открытыми; флажок не меняется.

Общий маршрут проекта читает [декларацию путей и источников](../../../rust/operations/routes.yaml):
по `DefinedTypes/Имя.xml` или `ОпределяемыйТип/Имя.yaml` он выбирает профиль
cf/cfe, имя из адреса и нужные источники фактов. Источники сохраняются одним
YAML-снимком со стабильными именами деклараций в
`.nkdk/facts/<компонент>/<путь объекта>.yaml` внутри корня компонента. Общая
операция обходит объявленные каталоги, готовит результаты до публикации и
записывает ресурсы потоком. Два файла cf и два файла cfe проходят через запись
и повторное открытие созданного YAML-проекта: обратный экспорт не получает
исходный XML, а полные деревья XML совпадают по пространствам имён,
атрибутам, значениям и порядку. Грамматика также проверена на другом
владельце. Аномалия незарегистрированного языка также проходит полный
проектный цикл. [Приёмка](../reports/2026-09-22-defined-type-owner.md)
завершена; флажок `MetadataDefinedType` установлен, итог common — **24/90**.
