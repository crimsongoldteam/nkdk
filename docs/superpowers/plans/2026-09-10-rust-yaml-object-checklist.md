6 октября: [назначение новых числовых id](../reports/2026-10-06-numbered-identities.md)
выражено общей декларацией и подключено к источникам регистраций элементов.
Проверены новая подсказка целиком, вложенное свойство и независимая коллекция.
Добавлен `reserve`: можно учитывать занятый номер без записи имени объекта;
проверены поздний источник, повторы и независимость областей.
Готов [общий обход сохранённых атрибутов](../reports/2026-10-06-preserved-attribute-reservations.md)
с прямой передачей номеров в индекс; рабочее подключение полной формы остаётся
открытым, флажки объектов не меняются.
[Компиляция профиля резервирования](../reports/2026-10-06-compiled-attribute-reservations.md)
и общий порядок его выполнения готовы. Полная форма и восстановление источников
при повторном открытии ещё не приняты; новых флажков нет.
[Области номеров формы](../reports/2026-10-06-form-number-spaces.md)
объявлены в YAML; исправлено подключение резервирования между пакетами.
Совместная подготовка проверена на четырёх e2e XML основной конфигурации
и расширения, а также отдельном примере параметров. Все 47 проверок индексов
приложения и финальный `pnpm test` прошли.
Флажки не меняются: для полной формы остаются автоматический выбор источников,
сохранённые поправки с контекстом, повторное открытие и приоритет основной формы.

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
Для common это означает полную собственную декларацию, преобразование в обе
стороны, восстановление исходной формы и аномалий, проверку реального
применения и всех собственных дополнительных договоров. Сборка полного
владельца отмечается отдельно; она не повторяет приёмку уже проверенного
common. Та же граница ранее согласована для `FillValue`.

По флажкам принято **56/90 common-каталогов** и **27/27 вложенных частей**. Полный Document ещё не принят; DocumentJournal принят 2026-09-30.
`StandartBeginningDate` и `StandardPeriod` приняты целиком как common:
обе YAML-декларации задают типизированные пути данных; компилятор проверяет
поля, псевдонимы и области доступности и выдаёт статический Rust-поиск.
Проверены реальная форма условного оформления, обычные периоды двух форм,
оба направления без XML-референса, аномалии и выбор внутри `MetadataValue`.
Подключение этих сведений к будущей полной проверке путей проекта относится
к приёмке владельцев, не к повторному переносу common.
`FunctionalOptionsProperty` принят как самостоятельный common:
[проверены реальные вхождения и аномалии](../reports/2026-09-25-functional-options-property-acceptance.md).
Полные владельцы форм остаются отдельными строками.
`ChildSubsystemNames` принят как самостоятельный common после проверки
[существующей пары XML/YAML и граничных форм](../reports/2026-09-23-child-subsystem-names.md).
Полный `MetadataSubsystem` остаётся отдельной строкой владельца.
`MetadataObjectRefCollection` принят отдельно от полного `Catalog`: общая
декларация и декларативное ограничение владельца проверены на старых XML-примерах
и реальных `Owners` из e2e. Порядок, повторы, пустые формы, существование цели,
допустимые корни и аномалии восстанавливаются без XML-референса.
`ChoiceList` принят отдельно от форм-владельцев: [проверены старые XML-примеры,
три формы e2e, пустые состояния, новый YAML и аномалия](../reports/2026-09-25-choice-list-acceptance.md).
Составное перечисление проходит все семь реальных e2e-сценариев, включая собственное
расширение: пустые ссылки на формы и ссылки стандартных реквизитов дают
`null` и восстанавливают XML без референса. Общий договор `yaml.nullWhen`
описан в спецификации. Дополнительно проверены неверное булево значение,
неизвестное системное перечисление, повтор перевода и повтор стандартного
реквизита с сохранением соседних полей. Проектный маршрут проверен на тех же
семи владельцах, создании нового cf/cfe и внешних модулях.
Для `UserVisible` проверены общий механизм атрибута и текста одного XML-элемента,
сокращение ключей и [локальные аномалии значения](../reports/2026-09-25-user-visible-key-table.md).
Кандидаты для всех 46 исходных свойств выпущены; пустые формы проверены,
но рабочая привязка таблицы ролей ещё не принята, флажок пустой.
Для 181 [корневого XML-атрибута](../reports/2026-09-23-root-attributes-and-color.md)
выпущены относительные проекции, включая UUID владельцев; полная сборка
владельцев и их индексов ещё не принята, флажки остаются пустыми.
`Color` принят через общую декларацию и непересекающийся выбор форм; все 192
исходных свойства распознаны как кандидаты. Проверены пять старых XML-форм,
реальные e2e-цвета, индекс элементов стиля, схема и аномалии.
[Отчёт о приёмке](../reports/2026-09-23-color-acceptance.md).
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
Изменяемые числовые свойства восьми владельцев `InputByString` и составного
документа подключены к общему индексу состояний; 54 сценария семейства и четыре
затронутые проекции документа прошли. Это [приёмка подключения](../reports/2026-10-01-stateful-owner-numbers.md),
без новых флажков полного владельца.
Следующее дополнение подключило числовой `Notify` / `!проверять`; корпус
содержит 58 сценариев, включая непомеченную числовую пустоту; полный контроль
значения по основной конфигурации ещё не принят.

Коллекция со ссылкой на целую декларацию строки получила выполнение XML/YAML,
включая вложенные коллекции и аномалии отдельных вхождений. Это общий механизм;
AdditionalIndexes принят после проверки идентичностей, корневого YAML-массива
и внешнего документа. [Отчёт](../reports/2026-09-13-additional-indexes.md).

Дата сверки: 2026-09-29. [Главный план](2026-09-10-rust-yaml-declarations.md) · [Журнал проверок](../reports/2026-09-10-rust-yaml-progress.md).

## Как читать

- `[x]` — объект полностью перенесён и проверен по условиям ниже.
- `[ ]` — объект не завершён. Промежуточные результаты учитываются только в журнале.
- Служебные каталоги включены, чтобы не потерять их обязанности. Для них завершение означает перенос ответственности в общий Rust-механизм, а не обязательное создание отдельной YAML-декларации.

Принятые common-объекты, включая `FillValue`, `StandardAttributeDescription`, `Color`, `Border`, `Font` и `ChoiceList`, отмечены флажками ниже. Enterprise исключён из реализации и условий готовности по решению пользователя. Наличие общего компилятора, синтетического примера или успешного теста отдельного свойства не означает завершение всего объекта. В частности, `common.code-type` — синтетический пример, а не перенесённое системное перечисление.

## Когда ставить галочку

Для предметного объекта должны быть выполнены все условия:

1. Полный договор выражен YAML-декларацией: оба преобразования, проверки, состояния и возможные аномалии. Нет отдельных предметных функций преобразования на Rust или TS.
2. Декларация доступна рабочему Rust-каталогу и проверена через
   декларативную проекцию реального владельца; нет вызова TypeScript для её
   выполнения. Полная сборка владельца отмечается его отдельной строкой.
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
| Общие объекты (common) | 90 | 56 |
| Вложенные части общих объектов | 27 | 27 |
| Прикладные объекты и их вложенные части | 57 | 5 |
| Формы, элементы и общие части форм | 66 | 0 |
| Системные перечисления (весь каталог) | 1 | 1 |

Количество завершённых записей сверено 2026-10-09; состав каталога сверён 2026-09-25 по существующим каталогам с исходниками (тестовые каталоги исключены), реестру 90 common-каталогов и именам таблиц `*ToYAML` системных перечислений. Вложенные части перечислены отдельно: готовность родителя требует готовности его частей. Это количество единиц учёта, а не число независимых типов метаданных.

## Общие объекты (common)

- [ ] [commonObjects/accountingFlag](../../../packages/rules/metadata/commonObjects/accountingFlag)
- [ ] [commonObjects/accumulationRegisterAggregates](../../../packages/rules/metadata/commonObjects/accumulationRegisterAggregates)
- [x] [commonObjects/additionalIndex](../../../packages/rules/metadata/commonObjects/additionalIndex) — 2026-09-13: [декларация](../../../rust/declarations/common/additional-indexes.yaml), [приёмка](../reports/2026-09-13-additional-indexes.md), [e2e](../../../tests/migration/additional-indexes-e2e.json).
- [x] [commonObjects/boolean](../../../packages/rules/metadata/commonObjects/boolean) — 2026-09-10: [декларация](../../../rust/declarations/common/boolean.yaml), [default без сокращения](../../../rust/declarations/probes/boolean-preserved-default.yaml), [общие проверки](../../../rust/crates/compiled-rules/tests/scalars.rs), [e2e](../../../tests/migration/scalar-value-e2e.json). Оба значения, отсутствие, сокращение и сохранение явного default.
- [x] [commonObjects/border](../../../packages/rules/metadata/commonObjects/border) — 2026-09-23: [декларация](../../../rust/declarations/common/border.yaml), [приёмка](../reports/2026-09-23-border-acceptance.md), [проверки](../../../rust/crates/compiled-rules/tests/scalars.rs). Ссылка на элемент стиля, ширина, тип, отсутствие, неверные значения и пустой XML-элемент проверены в обе стороны; 11 свойств стали кандидатами.
- [x] [commonObjects/characteristicsDescription](../../../packages/rules/metadata/commonObjects/characteristicsDescription) — 2026-09-28: [декларация](../../../rust/declarations/common/characteristics-descriptions.yaml), [17 проверок на 10 неизменённых e2e-парах и граничных формах](../../../tools/rules-migration/src/characteristics-check.mjs), [приёмка](../reports/2026-09-28-characteristics-descriptions-acceptance.md). Все 13 свойств в исходных `rules.ts` автоматически подключаются к декларации; те же 17 сценариев теперь проверяют построенную переносчиком проекцию. Полные владельцы принимаются отдельно.
- [x] [commonObjects/childFileItemNames](../../../packages/rules/metadata/commonObjects/childFileItemNames) — четыре XML-имени `Table`, `Cube`, `Recalculation`, `DimensionTable` задаются [декларацией владельца](../../../rust/declarations/probes/child-file-item-names.yaml) поверх [общего списка детей](../../../rust/declarations/common/child-object-names.yaml). [Rust-проверка](../../../rust/crates/compiled-rules/tests/path_lexicons.rs) сверяет неизменённые e2e-источники, сокращение через подготовленные имена, отклонение явно записанного вычисленного списка, оба направления, повторы и порядок. Владельцы принимаются отдельно.
- [x] [commonObjects/childFormNames](../../../packages/rules/metadata/commonObjects/childFormNames) — общий [список имён детей](../../../rust/declarations/common/child-object-names.yaml) уже подключён декларативно к [Document](../../../rust/declarations/fragments/document-child-names.yaml) и [DocumentJournal](../../../rust/declarations/fragments/journal-child-names.yaml). Проверены 11 реальных наборов дочерних объектов, XML → YAML → XML без референса, получение имён из индекса, порядок, повторы и пустой список в [Rust-проверках](../../../rust/crates/compiled-rules/tests/path_lexicons.rs). Привязка остальных владельцев учитывается отдельно при приёмке владельцев.
- [x] [commonObjects/childSubsystemNames](../../../packages/rules/metadata/commonObjects/childSubsystemNames) — [декларация](../../../rust/declarations/common/child-subsystem-names.yaml), [реальная пара подсистемы, повторы, порядок, пустые значения, отсутствие и оба направления](../../../rust/crates/compiled-rules/tests/sequences.rs). Общая коллекция восстанавливает XML без референса и отдельного обработчика.
- [x] [commonObjects/childTemplateNames](../../../packages/rules/metadata/commonObjects/childTemplateNames) — тот же [общий список имён](../../../rust/declarations/common/child-object-names.yaml) и [декларативные маршруты внешних файлов](../../../rust/declarations/fragments/child-template-resources.yaml): `Template.xml`, `Template.txt`, `Template.bin` и остальные вложенные файлы. Проверены 11 реальных наборов детей и [маршруты по существующему e2e-макету в обе стороны](../../../rust/crates/compiled-rules/tests/template_resources.rs). Подключение остальных владельцев проверяется при их отдельной приёмке.
- [x] [commonObjects/choiceForm](../../../packages/rules/metadata/commonObjects/choiceForm) — 2026-09-29: [общая декларация ссылки по типу](../../../rust/declarations/common/type-form-link.generated.yaml), [три сценария на реальных индексах справочника и формы](../../../tools/rules-migration/src/choice-form-cases.mjs), [приёмка](../reports/2026-09-29-choice-form-acceptance.md). Все 47 применений из `rules.ts` распознаются общими декларациями; единственный, составной и отсутствующий тип проверены без XML-референса. Полные владельцы принимаются отдельно.
- [x] [commonObjects/choiceList](../../../packages/rules/metadata/commonObjects/choiceList) — 2026-09-25: [декларация](../../../rust/declarations/common/choice-list.yaml), [Rust-проверки](../../../rust/crates/compiled-rules/tests/choice_list.rs), [приёмка](../reports/2026-09-25-choice-list-acceptance.md). Формы-владельцы принимаются отдельно.
- [ ] [commonObjects/clientApplicationInterface](../../../packages/rules/metadata/commonObjects/clientApplicationInterface)
- [x] [commonObjects/color](../../../packages/rules/metadata/commonObjects/color) — 2026-09-23: [декларация](../../../rust/declarations/common/color.yaml), [отчёт о приёмке](../reports/2026-09-23-color-acceptance.md). Словари, RGB, raw-ссылки, `auto`, индекс типа `StyleItem`, аномалии и оба направления на XML/e2e проверены; 192 свойства стали кандидатами. Полные владельцы учитываются отдельно.
- [x] [commonObjects/commonAttributeContent](../../../packages/rules/metadata/commonObjects/commonAttributeContent) — 2026-09-25: [декларация](../../../rust/declarations/common/common-attribute-content.yaml), [проверки](../../../rust/crates/compiled-rules/tests/common_attribute_content.rs), [приёмка](../reports/2026-09-25-common-attribute-content-acceptance.md). Сборка полного общего реквизита и его вклад в индекс владельца принимаются отдельно.
- [ ] [commonObjects/dataCompositionSystem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem) — [аудит общей регистрации](../reports/2026-10-09-dcs-public-composition.md): публичные библиотеки и подключения проверяются отдельно от всех обязанностей сборки и полных владельцев.
- [x] [commonObjects/dateTime](../../../packages/rules/metadata/commonObjects/dateTime) — 2026-09-10: [дата](../../../rust/declarations/common/date-time.yaml), [типизированная дата](../../../rust/declarations/common/typed-date-time.yaml), [default](../../../rust/declarations/probes/date-time-default.yaml), [26 календарных свойств e2e](../../../tests/migration/calendar-profile-e2e.json). Время как записано, константа при сборке, сокращение и схема.
- [ ] [commonObjects/exchangePlanContent](../../../packages/rules/metadata/commonObjects/exchangePlanContent)
- [x] [commonObjects/externalFile](../../../packages/rules/metadata/commonObjects/externalFile) — 2026-09-13: [декларация](../../../rust/declarations/common/external-file.yaml), [сборки владельцев](../../../rust/declarations/resources), [приёмка](../reports/2026-09-13-external-file.md).
- [x] [commonObjects/externalPicture](../../../packages/rules/metadata/commonObjects/externalPicture) — 2026-09-25: [общий ресурсный договор](../../../rust/declarations/fragments/external-picture-resource.yaml), [привязки общей картинки и конфигурации](../../../rust/declarations/resources/configuration-pictures.yaml), [проверка реальных cf/cfe-файлов](../../../rust/apps/nkdk/tests/resources.rs). Файл описания и содержимое передаются в обе стороны без изменения байтов; отсутствующие файлы не создаются.
- [x] [commonObjects/fieldsList](../../../packages/rules/metadata/commonObjects/fieldsList) — 2026-09-11: [декларация](../../../rust/declarations/common/fields-list.yaml), [readable](../../../rust/declarations/common/fields-list-readable.yaml), [профиль владельца](../../../rust/declarations/probes/fields-list-readable-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [x] [commonObjects/fillValue](../../../packages/rules/metadata/commonObjects/fillValue)
- [x] [commonObjects/font](../../../packages/rules/metadata/commonObjects/font) — 2026-09-24: [декларация](../../../rust/declarations/common/font-reference.yaml), [приёмка](../reports/2026-09-24-font-acceptance.md), [проверки](../../../rust/crates/compiled-rules-font/tests/font.rs). Все 85 исходных свойств стали кандидатами; проверены 28 реальных вхождений, пустая форма, неверные атрибуты и восстановление XML.
- [x] [commonObjects/formattedI8nText](../../../packages/rules/metadata/commonObjects/formattedI8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/formatted-i8n-text.yaml), [приёмка](../reports/2026-09-10-formatted-i8n-acceptance.md).
- [x] [commonObjects/functionalOptionsProperty](../../../packages/rules/metadata/commonObjects/functionalOptionsProperty) — 2026-09-25: [декларация ссылок и пустого элемента](../../../rust/declarations/common/functional-options-property.yaml), [проверка трёх e2e-файлов и аномалий](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-25-functional-options-property-acceptance.md).
- [x] [commonObjects/help](../../../packages/rules/metadata/commonObjects/help) — 2026-09-12: [декларация](../../../rust/declarations/fragments/help.yaml), [владельцы](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [группа файлов](../../../rust/apps/nkdk/tests/resources.rs).
- [ ] [commonObjects/homePageWorkArea](../../../packages/rules/metadata/commonObjects/homePageWorkArea)
- [x] [commonObjects/i8nText](../../../packages/rules/metadata/commonObjects/i8nText) — 2026-09-10; [декларация](../../../rust/declarations/common/i8n-text.yaml), [приёмка и проверки](../reports/2026-09-10-i8n-acceptance.md).
- [x] [commonObjects/indexField](../../../packages/rules/metadata/commonObjects/indexField) — 2026-09-11: [декларация](../../../rust/declarations/common/index-field.yaml), [профиль AdditionalFields](../../../rust/declarations/probes/index-field-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [x] [commonObjects/inputByStringFields](../../../packages/rules/metadata/commonObjects/inputByStringFields) — 2026-10-02: [приёмка рабочего подключения](../reports/2026-10-02-input-by-string-working-consumers.md). Все восемь потребителей и восемь сочетаний с именем предварительно компилируются из YAML; 31 рабочий договор, 24 реальные CF/CFE и изменение текущего YAML после удаления XML проверены. Реквизиты, состояния и числовые значения основы готовятся общим механизмом. Полные владельцы принимаются отдельно.
- [ ] [commonObjects/internalInfo](../../../packages/rules/metadata/commonObjects/internalInfo) — все 45 исходных применений имеют [50 e2e-проверок](../reports/2026-09-29-internal-info-branches.md) XML ↔ YAML, включая вложенных владельцев, три ветви, повторы и аномалию `GeneratedType`; новый определяемый тип cf/cfe получает устойчивые UUID из деклараций и подготовленной основной конфигурации. Для Enum теперь также выводятся декларации UUID владельца и трёх внутренних типов, проверенные на e2e XML; полный маршрут нового Enum ещё не собран. Создание остальных видов владельцев и отклонения XML ещё не приняты. `PropertyState` относится к владельцам расширений и учитывается при их приёмке.
- [ ] [commonObjects/metadataAttribute](../../../packages/rules/metadata/commonObjects/metadataAttribute)
- [x] [commonObjects/metadataCommand](../../../packages/rules/metadata/commonObjects/metadataCommand) — 2026-09-27: [декларации свойств и коллекции](../../../rust/declarations/objects/metadata-command-rows.yaml), [пять команд cf/cfe, состояния, UUID и аномалии](../../../rust/crates/probe-command-collections/tests/collections.rs), [внешние модули в файловой операции Rust](../../../rust/apps/nkdk/tests/resources.rs), [приёмка](../reports/2026-09-27-metadata-command-acceptance.md). Полные владельцы документа и журнала принимаются отдельно.
- [x] [commonObjects/metadataCommandGroup](../../../packages/rules/metadata/commonObjects/metadataCommandGroup) — 2026-09-25: [декларация системной и пользовательской группы](../../../rust/declarations/common/metadata-command-group.yaml), [11 неизменённых XML/YAML-пар](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [приёмка](../reports/2026-09-25-metadata-command-group-acceptance.md).
- [x] [commonObjects/metadataDocumentJournalColumn](../../../packages/rules/metadata/commonObjects/metadataDocumentJournalColumn) — 2026-09-27: [сгенерированные из rules.ts строка и коллекция](../../../rust/declarations/objects/metadata-journal-column-rows.yaml), [cf и два вида cfe, обратимость, UUID, ссылки и аномалия](../../../rust/crates/probe-journal-columns/tests/columns.rs), [приёмка](../reports/2026-09-27-journal-column-acceptance.md). Проектная операция полного журнала принимается отдельно.
- [ ] [commonObjects/metadataExternalDataSourceCube](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCube)
- [ ] [commonObjects/metadataExternalDataSourceCubeDimension](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeDimension)
- [ ] [commonObjects/metadataExternalDataSourceCubeResource](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeResource)
- [ ] [commonObjects/metadataExternalDataSourceDimensionTable](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceDimensionTable)
- [ ] [commonObjects/metadataExternalDataSourceField](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceField)
- [ ] [commonObjects/metadataExternalDataSourceFunction](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceFunction) — все три функции неизменённого e2e-источника прошли самостоятельное XML → YAML → XML и подготовку UUID общим индексом; полное подключение владельца ещё не принято.
- [ ] [commonObjects/metadataExternalDataSourceTable](../../../packages/rules/metadata/commonObjects/metadataExternalDataSourceTable)
- [x] [commonObjects/metadataField](../../../packages/rules/metadata/commonObjects/metadataField) — [декларация списка](../../../rust/declarations/common/metadata-fields.yaml), [цепочка поля](../../../rust/declarations/common/metadata-field-segments.yaml), [сокращение по владельцу](../../../rust/declarations/common/owner-metadata-fields.yaml), [16 неизменённых e2e-пар, пустые контейнеры, повторы и аномалии](../../../rust/crates/compiled-rules/tests/sequences.rs). Обычная и сокращённая формы обратимы без XML-референса.
- [ ] [commonObjects/metadataHTTPServiceMethod](../../../packages/rules/metadata/commonObjects/metadataHTTPServiceMethod)
- [ ] [commonObjects/metadataHTTPServiceURLTemplate](../../../packages/rules/metadata/commonObjects/metadataHTTPServiceURLTemplate)
- [ ] [commonObjects/metadataIntegrationServiceChannel](../../../packages/rules/metadata/commonObjects/metadataIntegrationServiceChannel)
- [x] [commonObjects/metadataName](../../../packages/rules/metadata/commonObjects/metadataName) — 2026-09-10: [декларация](../../../rust/declarations/common/metadata-name.yaml), [773 имени e2e](../../../tests/migration/metadata-name-e2e.json), [проверки аномалий](../../../rust/crates/compiled-rules/tests/scalars.rs), [структурная схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [x] [commonObjects/metadataObjectRefCollection](../../../packages/rules/metadata/commonObjects/metadataObjectRefCollection) — [общая декларация](../../../rust/declarations/common/metadata-object-ref-collection.yaml), [ограничение владельца](../../../rust/declarations/probes/metadata-object-ref-collection.yaml), [старые и e2e-примеры](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [приёмка](../reports/2026-09-25-metadata-object-ref-collection-acceptance.md).
- [ ] [commonObjects/metadataPath](../../../packages/rules/metadata/commonObjects/metadataPath)
- [ ] [commonObjects/metadataRef](../../../packages/rules/metadata/commonObjects/metadataRef) — [146 адресных договоров, в том числе 94 уникальные ссылки списка и 3 одиночные ссылки из e2e](../reports/2026-09-28-metadata-ref-e2e-matrix.md); UUID, пустое значение, краткие и смешанные ссылки и многоуровневые пути проверены. Распознаются все 34 неограниченные ссылки на корневой объект; [все 168 ссылок на членов](../../../tools/rules-migration/src/metadata-ref-coverage.mjs) стали кандидатами при передаче пространства имён. `Размещение` функциональной опции проверено на двух реальных XML, но существование выбранной цели ещё не проверяется проектным индексом. `СоставФункциональнойОпции` автоматически получает кандидатную декларацию из `rules.ts`: полный список из 84 элементов и пустой `Content` проходят преобразование; допуск точных путей выводится из `metadataTarget`, вложенная подсистема и существование каждого её звена проверены на кандидатной проекции по пробному индексу. Оба свойства `ClientApplicationForm.settingsStorage` получают одну декларацию из `rules.ts`; три формы ссылки и существование целей проверены в кандидатной Rust-проекции. Восемь `InputByStringFields` проверены отдельно на кандидатных e2e-парах; полное подключение владельцев ещё требуется. Заполненная и пустая ссылка на форму стандартного реквизита также проверены с пространством имён `xr`. Для двух свойств измерения куба нет реального заполненного XML. Реквизит и команда документа проверены по индексу, полученному декларациями коллекций из настоящего XML; полная кандидатная проверка проходит пять сценариев. Остальные виды членов, фильтры и проектное подключение остаются для полной приёмки.
- [ ] [commonObjects/metadataRegisterAttribute](../../../packages/rules/metadata/commonObjects/metadataRegisterAttribute)
- [ ] [commonObjects/metadataRegisterDimension](../../../packages/rules/metadata/commonObjects/metadataRegisterDimension)
- [ ] [commonObjects/metadataRegisterField](../../../packages/rules/metadata/commonObjects/metadataRegisterField)
- [ ] [commonObjects/metadataRegisterResource](../../../packages/rules/metadata/commonObjects/metadataRegisterResource)
- [ ] [commonObjects/metadataSequenceDimension](../../../packages/rules/metadata/commonObjects/metadataSequenceDimension)
- [x] [commonObjects/metadataTabularSection](../../../packages/rules/metadata/commonObjects/metadataTabularSection) — 2026-09-29: [сгенерированные YAML-декларации десяти владельцев](../../../rust/declarations/candidates/tabular-sections.generated.yaml), [21 e2e-сценарий](../../../tests/migration/tabular-section-family-operation.json), [аномалия и вложенные реквизиты](../../../tests/migration/document-attributes-operation.json), [приёмка](../reports/2026-09-29-tabular-section-ten-owners.md). Проверены `cf`/`cfe`, минимальная форма, пустой синоним, стандартные и вложенные реквизиты, UUID, InternalInfo, неверное число и обратное восстановление XML без референса. Полные владельцы принимаются отдельно.
- [ ] [commonObjects/metadataTargetProjectResolvers](../../../packages/rules/metadata/commonObjects/metadataTargetProjectResolvers)
- [ ] [commonObjects/metadataTargets](../../../packages/rules/metadata/commonObjects/metadataTargets)
- [ ] [commonObjects/metadataTaskAddressingAttribute](../../../packages/rules/metadata/commonObjects/metadataTaskAddressingAttribute)
- [x] [commonObjects/metadataValue](../../../packages/rules/metadata/commonObjects/metadataValue) — 2026-09-21: [рекурсивная декларация](../../../rust/declarations/common/metadata-value.yaml), [879 неизменённых XML-вхождений и 17 выбранных скалярных/пустых случаев](../../../tests/migration/metadata-value-e2e.json), [оба направления, составы, рекурсия и аномалии](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md). Точные числа, календарные значения, ссылки, списки, FixedArray и FormChoiceList исполняются общим Rust-компилятором; неизвестная XML-форма сохраняется как выведенная аномалия.
- [ ] [commonObjects/metadataWebServiceOperation](../../../packages/rules/metadata/commonObjects/metadataWebServiceOperation)
- [x] [commonObjects/minMaxValue](../../../packages/rules/metadata/commonObjects/minMaxValue) — 2026-09-10: [decimal](../../../rust/declarations/common/min-max-value.yaml), [строковый XML с запятой](../../../rust/declarations/common/min-max-value-text.yaml), [проверки профилей](../../../rust/crates/compiled-rules/tests/scalars.rs), [1934 свойства e2e](../../../tests/migration/min-max-value-e2e.json). Пустой nil владельца и отсутствие различаются; числа точные.
- [x] [commonObjects/mobileDeviceCommandBarContent](../../../packages/rules/metadata/commonObjects/mobileDeviceCommandBarContent) — 2026-09-25: [декларация с повторным использованием ChoiceList](../../../rust/declarations/common/mobile-device-command-bar-content.yaml), [проверки](../../../rust/crates/compiled-rules/tests/mobile_device_command_bar_content.rs), [приёмка](../reports/2026-09-25-mobile-device-command-bar-content-acceptance.md). Полные формы-владельцы принимаются отдельно.
- [x] [commonObjects/module](../../../packages/rules/metadata/commonObjects/module) — 2026-09-25: [общие ресурсные маршруты](../../../rust/declarations/fragments/module-resource.yaml) покрывают `.bsl`/`.bin`, модули конфигурации, объектов, форм и команд; [e2e-проверка файлов](../../../rust/apps/nkdk/tests/resources.rs) и [сопровождающих файлов шаблонов](../../../rust/crates/compiled-rules/tests/template_resources.rs) проходит в обе стороны. Одновременные альтернативы сохраняются с диагностикой общего механизма.
- [x] [commonObjects/number](../../../packages/rules/metadata/commonObjects/number) — 2026-09-10: [точное число](../../../rust/declarations/common/number.yaml), [тип decimal](../../../rust/declarations/common/typed-number.yaml), [тип string с точкой](../../../rust/declarations/common/number-as-text.yaml), [границы](../../../rust/declarations/probes/numeric-bound.yaml), [общие проверки](../../../rust/crates/compiled-rules/tests/scalars.rs), [e2e](../../../tests/migration/typed-scalar-value-e2e.json). Ограничения, условный максимум, default и исходная лексика.
- [x] [commonObjects/picture](../../../packages/rules/metadata/commonObjects/picture) — 2026-09-25: [декларация](../../../rust/declarations/common/picture.yaml), [13 Rust-проверок, включая все 154 вхождения e2e](../../../rust/crates/compiled-rules-picture/tests/picture.rs), [приёмка](../reports/2026-09-25-picture-acceptance.md). Обычные и расширенные ссылки, файл, прозрачность, пиксель, отсутствие и аномалии проходят оба направления без XML-референса; Enterprise не входит в цель переноса.
- [ ] [commonObjects/predefined](../../../packages/rules/metadata/commonObjects/predefined) — [автоматическое подключение контекста пяти файловых профилей](../reports/2026-10-04-predefined-generated-owner-context.md) проверено; полные рабочие маршруты владельцев ещё не приняты.
- [x] [commonObjects/predefinedCode](../../../packages/rules/metadata/commonObjects/predefinedCode) — 2026-09-10: [декларация](../../../rust/declarations/common/predefined-code.yaml), [e2e семейства](../../../tests/migration/scalar-choice-e2e.json), [оба профиля и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [ ] [commonObjects/predefinedItem](../../../packages/rules/metadata/commonObjects/predefinedItem)
- [ ] [commonObjects/rootCommandInterface](../../../packages/rules/metadata/commonObjects/rootCommandInterface)
- [x] [commonObjects/standardAttributeDescription](../../../packages/rules/metadata/commonObjects/standardAttributeDescription) — 2026-09-23: одна рабочая YAML-декларация для 14 семейств и 22 видов владельцев; полная запись из 27 свойств, профили имён и `FillValue`, пустые формы, ссылки и аномалии проверены XML → YAML → XML без референса. [Рабочая декларация](../../../rust/declarations/candidates/standard-attributes.generated.yaml) · [14 e2e-семейств](../../../rust/crates/compiled-rules/tests/standard_attributes.rs) · [приёмка](../reports/2026-09-22-standard-attribute-names.md).
- [x] [commonObjects/standardPeriod](../../../packages/rules/metadata/commonObjects/standardPeriod) — [единая декларация значения и путей](../../../rust/declarations/common/standard-period.yaml), [типизированная и обычная XML-форма на неизменённых e2e-файлах](../../../rust/crates/compiled-rules/tests/calendar_records.rs), [выбор в `MetadataValue`](../../../rust/crates/compiled-rules/tests/sequences.rs). Тип, псевдоним, члены, русские имена и доступность в условном фильтре выпускаются в Rust без частного обработчика.
- [ ] [commonObjects/standardTabularSectionDescription](../../../packages/rules/metadata/commonObjects/standardTabularSectionDescription)
- [x] [commonObjects/standartBeginningDate](../../../packages/rules/metadata/commonObjects/standartBeginningDate) — [единая декларация значения и путей](../../../rust/declarations/common/standard-beginning-date.yaml), [пять значений реальной e2e-формы, оба направления, аномалии и статические пути](../../../rust/crates/compiled-rules/tests/calendar_records.rs), [выбор в `MetadataValue`](../../../rust/crates/compiled-rules/tests/sequences.rs).
- [x] [commonObjects/string](../../../packages/rules/metadata/commonObjects/string) — 2026-09-13: [декларация](../../../rust/declarations/common/string.yaml), [матрица и 51 значение e2e](../../../rust/crates/compiled-rules/tests/scalars.rs), [приёмка и границы](../reports/2026-09-13-ready-common-package.md).
- [x] [commonObjects/stringOrNumber](../../../packages/rules/metadata/commonObjects/stringOrNumber) — 2026-09-10: [декларация](../../../rust/declarations/common/string-or-number.yaml), [e2e семейства](../../../tests/migration/scalar-choice-e2e.json), [оба профиля и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs).
- [x] [commonObjects/styleItemValue](../../../packages/rules/metadata/commonObjects/styleItemValue) — 2026-09-25: [декларация](../../../rust/declarations/common/style-item-value.yaml), [проверка на неизменённых e2e-примерах](../../../rust/crates/compiled-rules/tests/scalars.rs) и [приёмка](../reports/2026-09-25-style-item-value-acceptance.md). `Color`, `Font`, `Border`, неизвестный тип, отсутствие, пустое значение и неверные вложенные значения восстанавливаются без отдельного обработчика; полная сборка владельца учитывается отдельно.
- [x] [commonObjects/typeDescription](../../../packages/rules/metadata/commonObjects/typeDescription) — 2026-09-19: [декларации](../../../rust/declarations/common/type-description.yaml), [202 уникальных случая из 1125 неизменённых XML](../../../tests/migration/type-description-e2e.json), [оба направления, ограничения, значения по умолчанию и YAML-only](../../../rust/crates/compiled-rules/tests/type_description.rs), [договор и приёмка](../reports/2026-09-14-type-description-contract.md). Переносчик распознаёт 96/96 применений; полный каталог кандидатов компилируется без предметного Rust.
- [x] [commonObjects/typeLink](../../../packages/rules/metadata/commonObjects/typeLink) — 2026-09-19: [декларация](../../../rust/declarations/common/type-link.yaml), [89 реальных путей](../../../tests/migration/type-link-e2e.json), [обычная, типизированная, пустая и DCS-формы](../../../rust/crates/compiled-rules/tests/path_lexicons.rs), [договор и приёмка](../reports/2026-09-14-type-description-contract.md). Переносчик распознаёт 46/46 применений; порядок, повторы и аномалии сохраняются общими механизмами.
- [x] [commonObjects/usePurposes](../../../packages/rules/metadata/commonObjects/usePurposes) — 2026-09-11: [декларация](../../../rust/declarations/common/use-purposes.yaml), [профиль default](../../../rust/declarations/probes/use-purposes-default.yaml), [оба направления и аномалии](../../../rust/crates/compiled-rules/tests/sequences.rs), [175 свойств e2e](../../../tests/migration/use-purposes-e2e.json). Сокращения точных списков, сохранение порядка/повторов и неизвестных значений; ограничения и аномалии без предметного Rust.
- [x] [commonObjects/userSettingsID](../../../packages/rules/metadata/commonObjects/userSettingsID) — 2026-09-25: [декларация выбора логического значения и UUID](../../../rust/declarations/common/user-settings-id.yaml), [профиль свойства и проверка](../../../rust/crates/compiled-rules/tests/scalars.rs). `Истина`/`Ложь` и UUID из e2e-формы проходят оба направления, включая экспорт из YAML без XML-образца; отсутствие, пустой XML-элемент и неподходящий текст различаются общей регистрацией аномалии.
- [x] [commonObjects/userVisible](../../../packages/rules/metadata/commonObjects/userVisible) — 2026-09-25: [декларация](../../../rust/declarations/common/user-visible.yaml), [реальные XML-формы, YAML без референса и аномалии ролей](../../../rust/crates/compiled-rules/tests/sequences.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-25-user-visible-acceptance.md). Полные владельцы форм принимаются отдельно.
- [x] [commonObjects/uuid](../../../packages/rules/metadata/commonObjects/uuid) — 2026-09-25: [приёмка](../reports/2026-09-25-uuid-acceptance.md); декларативное восстановление и вклад в индекс, стабильный экспорт, пустой и отсутствующий атрибут. Подготовка идентичности и полные владельцы проверяются отдельно.
- [x] [commonObjects/webSocketClientHeaders](../../../packages/rules/metadata/commonObjects/webSocketClientHeaders) — 2026-09-10: [декларация](../../../rust/declarations/common/web-socket-client-headers.yaml), [профиль владельца](../../../rust/declarations/probes/web-socket-client-headers-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [x] [commonObjects/wsDefinitionSchemas](../../../packages/rules/metadata/commonObjects/wsDefinitionSchemas) — 2026-10-02: [файловая декларация](../../../rust/declarations/resources/ws-definition-schemas.yaml), [приёмка и границы корпуса](../reports/2026-10-02-ws-definition-schemas.md). Оба направления сохраняют полные имена и байты текущих файлов; полный WSReference принимается отдельно.
- [x] [commonObjects/xDTOPackages](../../../packages/rules/metadata/commonObjects/xDTOPackages) — 2026-09-10: [декларация](../../../rust/declarations/common/xdto-packages.yaml), [профиль владельца](../../../rust/declarations/probes/xdto-packages-default.yaml), [проверки](../../../rust/crates/compiled-rules/tests/sequences.rs), [e2e](../../../tests/migration/text-collections-e2e.json).
- [x] [commonObjects/xdtoTypeName](../../../packages/rules/metadata/commonObjects/xdtoTypeName) — декларация `common/xdto-type-name.yaml`, общий QName по URI и локальному имени; XML ↔ YAML, схема, валидация, вывод аномалий; 8 реальных свойств: `tests/migration/xdto-type-name-e2e.json`, независимые проверки QName в core/compiler/compiled-rules.
- [ ] [commonObjects/xmlRoot](../../../packages/rules/metadata/commonObjects/xmlRoot) — 2026-10-02: [вычисляемые оболочки, QName и оставшиеся границы приёмки](../reports/2026-10-02-xml-root-qname-preservation.md).
- [x] [commonObjects/сhoiceParameterLinks](../../../packages/rules/metadata/commonObjects/сhoiceParameterLinks) — 2026-09-21: [декларация](../../../rust/declarations/common/choice-parameter-links.yaml), [274 реальных вхождения](../../../tests/migration/choice-parameters-e2e.json), [оба направления и пустые состояния](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md).
- [x] [commonObjects/сhoiceParameters](../../../packages/rules/metadata/commonObjects/сhoiceParameters) — 2026-09-21: [декларация](../../../rust/declarations/common/choice-parameters.yaml), [281 реальное вхождение](../../../tests/migration/choice-parameters-e2e.json), [словарь значений и рекурсивный MetadataValue](../../../rust/crates/compiled-rules/tests/sequences.rs), [приёмка](../reports/2026-09-20-recursive-value-runtime.md).

## Вложенные части общих объектов

- [x] [commonObjects/dataCompositionSystem/appearanceFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields) — 2026-10-08: [декларация всех 12 параметров](../../../rust/declarations/common/appearance-fields.generated.yaml), [оба направления, пустые состояния, короткие формы и аномалии](../../../tests/migration/proposals/appearance-strings/collection-cases.mjs), [приёмка](../reports/2026-10-07-appearance-field-profiles.md). 44 договора всех размещений и словарей, 37 договоров через опубликованный Rust-каталог; матрица старой валидации перенесена. Фактический kind поля берётся из декларации владельца. Полные владельцы и общая цель 10× принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/availableFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields) — 2026-09-25: [декларации короткой и полной форм списка](../../../rust/declarations/common/dcs-available-fields.yaml), [исходные XML, e2e, новый YAML и локальные аномалии](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-25-dcs-available-fields-acceptance.md). Полные владельцы СКД и форм принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/availableValues](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues) — 2026-09-25: [декларации строки и списка](../../../rust/declarations/common/dcs-available-values.yaml), [исходные XML-примеры, новый YAML и локальная аномалия](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [приёмка](../reports/2026-09-25-dcs-available-values-acceptance.md). Полный DCS-владелец принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/calculatedField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedField) — 2026-10-09: все девять свойств автоматически собраны из `rules.ts`; рабочий реестр, оба направления, оформление, доступные значения, аномалии и схема проверены. [Приёмка](../reports/2026-10-09-calculated-fields.md).
- [x] [commonObjects/dataCompositionSystem/calculatedFieldOrderExpression](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression) — 2026-09-25: [декларации элемента и коллекции](../../../rust/declarations/common/calculated-field-order-expressions.yaml), [пара e2e-элементов, отсутствие направления и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-25-calculated-field-order-expressions-acceptance.md). `CalculatedField` и DCS принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/calculatedFieldUseRestriction](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFieldUseRestriction) — 2026-09-25: [декларация четырёх boolean](../../../rust/declarations/common/calculated-field-use-restriction.yaml), [три реальных XML-вхождения и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-25-calculated-field-use-restriction-acceptance.md). Родительская DCS и формы принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/calculatedFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/calculatedFields) — 2026-10-09: автоматическая сборка коллекции из регистрации; соседи, повторы, порядок и экспорт без XML-референса проверены через рабочий реестр. [Приёмка](../reports/2026-10-09-calculated-fields.md).
- [x] [commonObjects/dataCompositionSystem/conditionalAppearance](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearance) — 2026-10-09: все четыре свойства и вложенные элементы; [полная приёмка](../reports/2026-10-09-dcs-filter-appearance-acceptance.md).
- [x] [commonObjects/dataCompositionSystem/conditionalAppearanceItem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem) — 2026-10-09: все 18 свойств, коллекция, пустые контейнеры и локальные аномалии; [полная приёмка](../reports/2026-10-09-dcs-filter-appearance-acceptance.md).
- [x] [commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField) — 2026-10-09: все 15 свойств и три вида автоматически собраны из rules.ts; оба направления, доступные значения, оформление, отсутствие вида, аномалии и порядок приняты в 12 случаях. [Рабочая декларация](../../../rust/declarations/probes/data-set-fields-working.generated.yaml), [приёмка](../reports/2026-10-09-dcs-data-set-field.md). Полная схема СКД принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/dcsLocalStringType](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType) — 2026-09-25: [декларация выбора](../../../rust/declarations/common/dcs-local-string-type.yaml), [реальные XML-формы, обратное преобразование и аномалии](../../../rust/crates/compiled-rules/tests/dcs_fields.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-25-dcs-local-string-type-acceptance.md). Полные владельцы СКД принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/dcsMetadataValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue) — 2026-10-09: девять профилей, все 17 исходных XML-примеров и дополнительные границы проверены в [21 Rust-сценарии](../../../tests/migration/dcs-metadata-values-working.json). Пустота, nil, UUID, форматированный текст, неверные значения и лишний параметр выбора восстанавливаются без потерь; выбор common автоматизирован в переносчике. [Приёмка](../reports/2026-10-09-dcs-values-parameters.md). Полные владельцы принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/dcsParameter](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dcsParameter) — 2026-10-09: все 12 свойств автоматически перенесены из rules.ts; [14 строгих Rust-сценариев](../../../tests/migration/dynamic-list-parameters-working.json) проверяют восемь реальных параметров, всю коллекцию, повторы, соседей и локальные аномалии с рабочими источниками фактов. [Приёмка](../reports/2026-10-09-dcs-values-parameters.md). Полная форма и адресация индекса yamlPath при сборке владельца принимаются отдельно. [Общая запись и повторное использование в коллекции](../reports/2026-10-09-dcs-public-record-reuse.md).
- [x] [commonObjects/dataCompositionSystem/dscMetadataTypedValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue) — 2026-10-09: [единая декларация](../../../rust/declarations/common/dcs-metadata-typed-value.yaml), [22 проверки](../../../tests/migration/dcs-metadata-typed-values-working.json) и [приёмка](../reports/2026-10-09-dcs-values-parameters.md). Обычные и составные значения, ссылки, отсутствие, `{}`/`xsi:nil`, `Undefined`, порядок, повторы и локальные аномалии проверены в Rust; рабочий перенос `DcsMetadataTypedValue` автоматически выбирает эту декларацию. Полные владельцы принимаются отдельно.

Для этого пакета актуальна [проверка от 2026-10-09](../reports/2026-10-09-dcs-values-parameters.md):
Все три common пакета приняты: typedValue — 22 случая, значения — 21 случай,
параметры — 14 строгих случаев. Рабочие проверки опубликованы и воспроизводимы.
Общий итог по флажкам разделов: **56/90 common**, **27/27 вложенных частей**.
Предыдущая текстовая сводка смешивала разделы; поле набора данных относится к вложенным частям.
- [x] [commonObjects/dataCompositionSystem/filter](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filter) — 2026-10-09: все пять свойств, доступные поля, пустота и аномалии; [полная приёмка](../reports/2026-10-09-dcs-filter-appearance-acceptance.md).
- [x] [commonObjects/dataCompositionSystem/filterItem](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem) — 2026-10-09: девять свойств сравнения, восемь свойств группы, рекурсия и повторы; служебный parent учтён отдельно; [полная приёмка](../reports/2026-10-09-dcs-filter-appearance-acceptance.md).
- [x] [commonObjects/dataCompositionSystem/filterItem/fields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/fields) — 2026-09-27: `DcsField` покрыт [общей декларацией поля](../../../rust/declarations/common/dcs-metadata-value.yaml), `DcsBoolean` — [декларацией типизированной строки](../../../rust/declarations/common/dcs-filter-boolean.yaml). [Rust-проверки](../../../rust/crates/compiled-rules/tests/dcs_fields.rs) используют неизменённые e2e-примеры, проверяют XML → YAML → XML без образца, строковые `true`/`false`, неверное значение и XML-тип как аномалии. Полный `FilterItem` принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/order](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/order) — 2026-09-26: [декларация всех четырёх свойств](../../../rust/declarations/common/dcs-order.yaml), [старые фикстуры, восемь реальных порядков формы и аномалия](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [приёмка](../reports/2026-09-26-dcs-order-acceptance.md). Полные владельцы форм и СКД принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/orderItemFields](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/orderItemFields) — 2026-09-26: [декларации поля, варианта «Авто» и упорядоченной коллекции](../../../rust/declarations/common/dcs-order-item-fields.yaml), [исходная фикстура, реальная e2e-форма, новый YAML и аномалии](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [приёмка](../reports/2026-09-26-dcs-order-item-fields-acceptance.md). `Order` принят отдельной строкой.
- [x] [commonObjects/dataCompositionSystem/parameterValue](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/parameterValue) — 2026-10-09: [полная декларация](../../../rust/declarations/common/dcs-parameter-value.yaml), [30 рабочих случаев](../../../tests/migration/settings-parameter-values-working.json), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка и замеры](../reports/2026-10-08-shared-aot-value-bodies.md). Все девять профилей и вложенные значения приняты через рабочий Rust-каталог; полные владельцы принимаются отдельно.
- [x] [commonObjects/dataCompositionSystem/settingsParameterValueCollection](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection) — 2026-10-09: [полная декларация](../../../rust/declarations/common/dcs-settings-parameter-value-collection.yaml), [рабочее подключение](../../../rust/declarations/probes/settings-parameter-values-working.generated.yaml), [30 независимых случаев](../../../tests/migration/settings-parameter-values-working.json), [приёмка](../reports/2026-10-08-shared-aot-value-bodies.md). Оба режима Field/Primitive, ключи, повторы, порядок, nil/отсутствие, обычные и расширенные дети приняты; рабочие пакеты в пределах 16 МиБ. Полный СКД принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/structureItemGroup](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup) — 2026-09-26: [декларация линейной цепочки](../../../rust/declarations/common/structure-item-group.yaml), [старая XML-фикстура, три цепочки e2e, экспорт без референса и аномалии](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [приёмка](../reports/2026-09-26-structure-item-group-acceptance.md). Владелец СКД принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/structureItemGroup/collection](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection) — 2026-09-26: [декларация выбора и последовательности](../../../rust/declarations/common/group-item-collection.yaml), [смешанный порядок, e2e, коллизия и аномалия](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-26-group-item-collection-acceptance.md). Полный StructureItemGroup принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto) — 2026-09-26: [декларация двух состояний](../../../rust/declarations/common/group-item-auto.yaml), [реальная e2e-форма и аномалии](../../../rust/crates/compiled-rules/tests/scalars.rs), [приёмка](../reports/2026-09-26-group-item-auto-acceptance.md). Коллекция группировок принимается отдельно.
- [x] [commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField](../../../packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField) — 2026-09-26: [декларация всех шести свойств и обратимого сокращения](../../../rust/declarations/common/group-item-field.yaml), [исходные фикстуры, реальная e2e-форма, нестандартные значения и аномалия](../../../rust/crates/compiled-rules/tests/dcs_lists.rs), [схема](../../../rust/crates/rule-compiler/tests/schema.rs), [приёмка](../reports/2026-09-26-group-item-field-acceptance.md). Коллекция группировок принята отдельной строкой.
- [x] [commonObjects/metadataValue/fixedArray](../../../packages/rules/metadata/commonObjects/metadataValue/fixedArray) — 2026-09-21: входит в [единую рекурсивную декларацию](../../../rust/declarations/common/metadata-value.yaml); один и несколько элементов, вложенные значения, `xsi:nil`, порядок и аномалии проверены в [приёмке](../reports/2026-09-20-recursive-value-runtime.md).
- [x] [commonObjects/metadataValue/formChoiceList](../../../packages/rules/metadata/commonObjects/metadataValue/formChoiceList) — 2026-09-21: входит в [единую рекурсивную декларацию](../../../rust/declarations/common/metadata-value.yaml); представление I8nText, вложенное значение, пустые состояния и обратное преобразование проверены в [приёмке](../reports/2026-09-20-recursive-value-runtime.md).

## Прикладные объекты и их вложенные части

- [ ] [appliedObjects/configuration](../../../packages/rules/metadata/appliedObjects/configuration)
- [ ] [appliedObjects/configuration/migrations](../../../packages/rules/metadata/appliedObjects/configuration/migrations)
- [ ] [appliedObjects/configurationExtension](../../../packages/rules/metadata/appliedObjects/configurationExtension)
- [ ] [appliedObjects/dataPathCommon](../../../packages/rules/metadata/appliedObjects/dataPathCommon)
- [ ] [appliedObjects/metadataAccountingRegister](../../../packages/rules/metadata/appliedObjects/metadataAccountingRegister)
- [ ] [appliedObjects/metadataAccumulationRegister](../../../packages/rules/metadata/appliedObjects/metadataAccumulationRegister)
- [x] [appliedObjects/metadataBot](../../../packages/rules/metadata/appliedObjects/metadataBot) — [полная приёмка 2026-10-05](../reports/2026-10-05-command-module-bot-owners.md)
- [ ] [appliedObjects/metadataBusinessProcess](../../../packages/rules/metadata/appliedObjects/metadataBusinessProcess)
- [ ] [appliedObjects/metadataCalculationRegister](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister)
- [ ] [appliedObjects/metadataCalculationRegister/recalculation](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation)
- [ ] [appliedObjects/metadataCalculationRegister/recalculation/dimension](../../../packages/rules/metadata/appliedObjects/metadataCalculationRegister/recalculation/dimension)
- [ ] [appliedObjects/metadataCatalog](../../../packages/rules/metadata/appliedObjects/metadataCatalog)
- [ ] [appliedObjects/metadataChartOfAccounts](../../../packages/rules/metadata/appliedObjects/metadataChartOfAccounts)
- [ ] [appliedObjects/metadataChartOfAccounts/predefined](../../../packages/rules/metadata/appliedObjects/metadataChartOfAccounts/predefined)
- [ ] [appliedObjects/metadataChartOfCalculationTypes](../../../packages/rules/metadata/appliedObjects/metadataChartOfCalculationTypes)
- [ ] [appliedObjects/metadataChartOfCharacteristicTypes](../../../packages/rules/metadata/appliedObjects/metadataChartOfCharacteristicTypes) — [сборка 65/65 свойств, общая история состояний и обычный TypeDescription; пробное вложение 6/6](../reports/2026-10-04-characteristic-owner-base-state.md); полная приёмка ещё не выполнена.
- [ ] [appliedObjects/metadataCommand](../../../packages/rules/metadata/appliedObjects/metadataCommand)
- [x] [appliedObjects/metadataCommandGroup](../../../packages/rules/metadata/appliedObjects/metadataCommandGroup) — [полная приёмка 2026-10-05](../reports/2026-10-05-command-module-bot-owners.md)
- [ ] [appliedObjects/metadataCommonAttribute](../../../packages/rules/metadata/appliedObjects/metadataCommonAttribute)
- [ ] [appliedObjects/metadataCommonCommand](../../../packages/rules/metadata/appliedObjects/metadataCommonCommand)
- [ ] [appliedObjects/metadataCommonForm](../../../packages/rules/metadata/appliedObjects/metadataCommonForm)
- [x] [appliedObjects/metadataCommonModule](../../../packages/rules/metadata/appliedObjects/metadataCommonModule) — [полная приёмка 2026-10-05](../reports/2026-10-05-command-module-bot-owners.md)
- [ ] [appliedObjects/metadataCommonPicture](../../../packages/rules/metadata/appliedObjects/metadataCommonPicture)
- [x] [appliedObjects/metadataCommonTemplate](../../../packages/rules/metadata/appliedObjects/metadataCommonTemplate) — [полная приёмка 2026-10-06](../reports/2026-10-06-role-template-owners.md)
- [ ] [appliedObjects/metadataConstant](../../../packages/rules/metadata/appliedObjects/metadataConstant)
- [ ] [appliedObjects/metadataDataProcessor](../../../packages/rules/metadata/appliedObjects/metadataDataProcessor)
- [x] [appliedObjects/metadataDefinedType](../../../packages/rules/metadata/appliedObjects/metadataDefinedType) — 2026-09-22: [декларации](../../../rust/declarations/objects/defined-type.yaml), [проектные e2e-проверки](../../../rust/apps/nkdk/tests/facts.rs), [приёмка](../reports/2026-09-22-defined-type-owner.md). 2026-09-29: дополнительно проверено создание нового собственного и заимствованного объекта расширения, повторный экспорт без основной конфигурации и импорт.
- [ ] [appliedObjects/metadataDocument](../../../packages/rules/metadata/appliedObjects/metadataDocument)
- [x] [appliedObjects/metadataDocumentJournal](../../../packages/rules/metadata/appliedObjects/metadataDocumentJournal) — 2026-09-30: [полная декларативная сборка](../../../rust/declarations/objects/journal.generated.yaml), [проектная операция](../../../rust/operations/journal.routes.generated.yaml), [приёмка](../reports/2026-09-30-document-journal-owner.md). Генератор сверяет все 24 свойства и порядок с `rules.ts`; e2e `cf` и `cfe` проверяют YAML, XML после повторного открытия, внешние файлы, новый журнал с устойчивыми UUID и аномалию неверного значения. Графы, команды и источники фактов подключены без частных обработчиков журнала в нейтральном Rust.
- [x] [appliedObjects/metadataDocumentNumerator](../../../packages/rules/metadata/appliedObjects/metadataDocumentNumerator) — 2026-10-01: [полная рабочая сборка](../reports/2026-10-01-numerator-production.md). Все исходные свойства, пять XML CF и четыре CFE, собственные/заимствованные объекты, UUID, состояния расширения, текущие значения YAML основы и отдельная валидация. Новые YAML создают объект без XML-референса; повторный экспорт сохраняет UUID и связь с основой. Преобразования предварительно скомпилированы в отдельный пакет с общим договором каталога.
- [x] [appliedObjects/metadataEnumeration](../../../packages/rules/metadata/appliedObjects/metadataEnumeration) — 2026-09-29: [полная сборка](../reports/2026-09-14-enumeration-owner-assembly.md). Все 26 свойств, списки форм/макетов, `InternalInfo`, UUID, версия XML, состояние расширения, команды, значения и стандартные реквизиты входят в одну декларацию. Проектная операция проводит все семь XML/YAML-пар e2e в обе стороны без XML-референса, создаёт нового владельца cf/cfe с устойчивыми UUID и сохраняет внешние модули менеджера, команды и формы. Неверные скаляры и повторы вложенных данных проверены вместе с соседними полями.
- [x] **MetadataEnumerationValueRules — значение перечисления** — 2026-09-14: полная дочерняя коллекция в рабочей операции Rust, cf/cfe, контекст владельца, режимы совместимости, аномалии и экспорт без референса. [Декларации](../../../rust/declarations/objects/enumeration-values.generated.yaml) · [Машинные случаи](../../../tests/migration/enum-values-operation.json) · [Приёмка](../reports/2026-09-14-enum-value-real.md). Родительское перечисление также принято 2026-09-29.
- [x] [appliedObjects/metadataEventSubscription](../../../packages/rules/metadata/appliedObjects/metadataEventSubscription) — [полная приёмка 2026-10-05](../reports/2026-10-05-parameter-event-owners.md)
- [ ] [appliedObjects/metadataExchangePlan](../../../packages/rules/metadata/appliedObjects/metadataExchangePlan)
- [ ] [appliedObjects/metadataExternalDataSource](../../../packages/rules/metadata/appliedObjects/metadataExternalDataSource)
- [ ] [appliedObjects/metadataFilterCriterion](../../../packages/rules/metadata/appliedObjects/metadataFilterCriterion)
- [ ] [appliedObjects/metadataFunctionalOption](../../../packages/rules/metadata/appliedObjects/metadataFunctionalOption)
- [x] [appliedObjects/metadataFunctionalOptionsParameter](../../../packages/rules/metadata/appliedObjects/metadataFunctionalOptionsParameter) — [полная приёмка 2026-10-05](../reports/2026-10-05-parameter-event-owners.md)
- [ ] [appliedObjects/metadataHTTPService](../../../packages/rules/metadata/appliedObjects/metadataHTTPService)
- [ ] [appliedObjects/metadataInformationRegister](../../../packages/rules/metadata/appliedObjects/metadataInformationRegister)
- [ ] [appliedObjects/metadataIntegrationService](../../../packages/rules/metadata/appliedObjects/metadataIntegrationService)
- [ ] [appliedObjects/metadataInterface](../../../packages/rules/metadata/appliedObjects/metadataInterface)
- [x] [appliedObjects/metadataLanguage](../../../packages/rules/metadata/appliedObjects/metadataLanguage)
- [ ] [appliedObjects/metadataReport](../../../packages/rules/metadata/appliedObjects/metadataReport)
- [x] [appliedObjects/metadataRole](../../../packages/rules/metadata/appliedObjects/metadataRole) — [полная приёмка 2026-10-06](../reports/2026-10-06-role-template-owners.md)
- [ ] [appliedObjects/metadataScheduledJob](../../../packages/rules/metadata/appliedObjects/metadataScheduledJob)
- [ ] [appliedObjects/metadataSequence](../../../packages/rules/metadata/appliedObjects/metadataSequence)
- [x] [appliedObjects/metadataSessionParameter](../../../packages/rules/metadata/appliedObjects/metadataSessionParameter) — [полная приёмка 2026-10-05](../reports/2026-10-05-parameter-event-owners.md)
- [ ] [appliedObjects/metadataSettingsStorage](../../../packages/rules/metadata/appliedObjects/metadataSettingsStorage)
- [x] [appliedObjects/metadataStyle](../../../packages/rules/metadata/appliedObjects/metadataStyle)
- [x] [appliedObjects/metadataStyleItem](../../../packages/rules/metadata/appliedObjects/metadataStyleItem)
- [ ] [appliedObjects/metadataSubsystem](../../../packages/rules/metadata/appliedObjects/metadataSubsystem)
- [ ] [appliedObjects/metadataTask](../../../packages/rules/metadata/appliedObjects/metadataTask)
- [ ] [appliedObjects/metadataWSReference](../../../packages/rules/metadata/appliedObjects/metadataWSReference)
- [ ] [appliedObjects/metadataWebService](../../../packages/rules/metadata/appliedObjects/metadataWebService)
- [x] [appliedObjects/metadataWebSocketClient](../../../packages/rules/metadata/appliedObjects/metadataWebSocketClient)
- [x] [appliedObjects/metadataXDTOPackage](../../../packages/rules/metadata/appliedObjects/metadataXDTOPackage)

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
- [ ] [forms/commonObjects/event](../../../packages/rules/metadata/forms/commonObjects/event) — [договор преобразования и оставшаяся полная приёмка](../reports/2026-10-06-events-declaration.md); собственные регистрации ссылок и проекции основной формы ещё не приняты
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

Автоматический перенос распознаёт 31/31 свойство реквизита документа; четыре
последних свойства проверены на сгенерированном Rust-коде вместе с прежними
e2e-проекциями. Это ещё не полное правило реквизита, не его коллекция у
документа и не проектный round-trip. Поэтому флажок
`appliedObjects/metadataDocument` остаётся пустым, common — **24/90**.
[Проверенные границы](../reports/2026-09-22-document-attribute-candidates.md).

Составной владелец реквизитов теперь правильно переносит входы вложенного
значения: на реальном cf-примере поле
`BinaryDataStorageLocationUseField` сохраняется читаемым и XML восстанавливается
без референса. Общая проверка вложенной коллекции добавлена в Rust-компилятор.
Это не закрывает полный документ и `commonObjects/fillValue`: проверка
совместимости есть, но неявные значения и стандартные реквизиты ещё не приняты.
Оба флажка остаются пустыми; итог common — **24/90**.

Для `FillValue` добавлен общий типизированный конструктор варианта декларации;
он проверен отдельно на точном числовом нуле. На реальном
XML выявлено важное различие: отсутствующий YAML у нестрокового реквизита
восстанавливает `xsi:nil`, поэтому явные ноль и начальная дата остаются явными,
иначе исходный XML нельзя восстановить. Профиль `common.fill-value-profile`
сокращает однозначную пустую строку и передаётся переносчиком вместе с соседним
типом без частной ветки в Rust-компиляторе. 40 независимых случаев `FillValue`
прошли XML → YAML → XML и Clippy; общий набор 169 договоров тоже прошёл.
Стандартные реквизиты и e2e-проекции всех типов реквизитов ещё не приняты.
Полные владельцы проверяются отдельно в их строках. Флажок не меняется:
**24/90 common**. [Проверенный объём](../reports/2026-09-22-fill-value-default-profile.md).

Новая e2e-матрица прошла для всех 10 применимых обычных видов реквизитов.
У ресурса куба свойства `FillValue` нет: ошибочное наследование удалено,
аномалия и `!xml/raw` не нужны. Стандартные реквизиты проверены на явной
ссылке, `xsi:nil` и вычисляемой пустой ссылке `Owner`, включая её отключение
в расширении. Дополнительно 17 случаев проверили запрет явного значения,
тип, длину, список владельцев и различие одного владельца от нескольких.
Политики теперь статически извлекаются из общих объявлений и объявления
владельца, а параметры — из e2e XML; проверены 22 случая для справочника и
документа. Декларативный фрагмент составлен с полем имени и находится в
рабочем каталоге Rust. Маршруты владельцев к нему ещё не подключены.
На этом промежуточном этапе флажок оставался пустым: **24/90 common**.

Приёмка общего `FillValue` завершена по согласованной отдельной границе:
декларации обычного значения и стандартного реквизита находятся в рабочем
Rust-каталоге. Совместный прогон 66 случаев из неизменённых e2e-основ охватил
94 свойства, все 10 применимых видов обычных реквизитов и политики
стандартных реквизитов; XML → YAML → XML без референса и Clippy прошли.
Полный `pnpm test`, проверка типов, архитектуры и новых дублей также прошли.
Маршруты полных владельцев принимаются в их собственных строках, поэтому
`commonObjects/fillValue` отмечен завершённым, а общий итог теперь **25/90
common**. [Доказательства и граница](../reports/2026-09-22-fill-value-default-profile.md).


2026-10-01: подготовленный индекс состояний заменил повторные обходы
в проверочном преобразовании; переносчик объявляет его вклады для состояний
перечисления и журнала. Полная интеграция владельцев ещё не принята,
поэтому новые флажки не поставлены.
[Проверки и границы](../reports/2026-10-01-prepared-state-index.md).


2026-10-01: кандидатные числовые свойства InputByString дополнены сравнением
с основной конфигурацией, предупреждениями «проверять» и разрешёнными
изменениями. Реестр содержит 62 сценария; полный перенос владельцев и всех
18 числовых регистраций этим блоком не принимается. Флажки не меняются.
Подробности: [отчёт](../reports/2026-10-01-stateful-owner-numbers.md).


2026-10-01: все четыре числовых поля плана счетов включены в кандидатную
декларацию автоматически по исходным состояниям. Кандидатный числовой
маршрут покрывает 16/18 регистраций; остаются корректировка периода регистра
бухгалтерии и длина номера нумератора документов. Полные владельцы остаются
отдельной приёмкой, флажки не меняются. Следующий шаг — общий числовой
фрагмент для владельцев без InputByString, затем базовые отсутствия/умолчания
и рабочий проектный маршрут.


2026-10-01: кандидатный числовой маршрут подключил 18/18 исходных регистраций.
Регистр бухгалтерии и нумератор используют тот же числовой фрагмент, что
владельцы InputByString; обычные границы чисел также перенесены. Общий итог
полных объектов и флажки не меняются. Следующие обязательные договоры:
условные границы от соседнего свойства (NumberType → максимум 38), допустимые
режимы по версии совместимости, базовые отсутствия/умолчания и рабочая
интеграция проекта. Проверочное семейство numeric-owners содержит шесть
примеров из неизменённых e2e XML/YAML, а общий реестр двух семейств — 68 случаев.


2026-10-01: условные числовые границы подключены вместе с соседними
перечислениями для шести владельцев (пять разных словарей). Состояния чисел
и перечислений объявляются одним шаблоном; новый объект не требует отдельного
Rust-обработчика. Источник переключателя: локальное значение, затем основа
заимствованного объекта; собственное отсутствие использует исходное умолчание.
Нумератор проверен на 38/39 при числовом типе, 50 при строковом типе и на
отсутствующем локальном типе с получением Number из основы. Неверный XML
сохраняется как автоматически выведенная аномалия; соседний тип остаётся читаемым.
Семейство numeric-owners содержит восемь сценариев; вместе с InputByString
реестр содержит 70 сценариев. Проверены все пять словарей переключателя.
Флажки полного переноса не меняются: следующие обязательные договоры —
режимы по версии совместимости, отсутствие/умолчание свойства в основе и
рабочее подключение проекта. [Подробности](../reports/2026-10-01-stateful-owner-numbers.md).


2026-10-01: версионные ограничения пометок заимствованных чисел и соседних
перечислений перенесены из исходных propertyState-профилей и дельт.
Версия проверочного компонента читается из Configuration.xml; 8.3.14/8.3.15,
8.3.7/8.3.8 и DontUse проверяются независимо. Недопустимое состояние сохраняется
явно вместе с автоматически выведенной аномалией числа, без потери XML.
Числовой набор теперь содержит девять сценариев, общий реестр — 71.
Флажки полного переноса не меняются. Далее — доступность свойств собственных
объектов, базовые отсутствия/умолчания и рабочий проектный маршрут.
[Договор и проверки](../reports/2026-10-01-state-compatibility.md).


2026-10-01: закрыт договор недопустимых пометок у собственных числовых
свойств; проверены оба режима у регистра бухгалтерии и нумератора.
Отсутствующее число в основе даёт base.property.missing при проверке YAML;
XML сохраняется общей аномалией вместе с явным состоянием и восстанавливается
без референса. Добавлены два производных сценария без изменения XML-фикстур.
Числовой набор — 11 сценариев, вместе с InputByString — 73. Флажки полной
приёмки не меняются. Далее: отсутствие базового переключателя типа числа
и проектное подключение контекста.
[Подробности проверки](../reports/2026-10-01-state-compatibility.md).


2026-10-01: зависимая числовая граница больше не пропускается молча, если
тип отсутствует и локально, и в основе заимствованного объекта. Обычный YAML
получает base.context.missing; XML сохраняется как автоматически выведенная
аномалия с явной историей и обратным восстановлением. Явный локальный тип
по-прежнему имеет приоритет; граница 38/39 проверяется и без базового типа.
Числовой реестр — 13 сценариев, общий с InputByString — 75. Флажки не меняются.
Следующий результат — полная сборка выбранного владельца перед добавлением
его проектного маршрута; маршрут частичного владельца недопустим.
[Договор и проверки](../reports/2026-10-01-base-number-context.md).

2026-10-01: у нумератора проверены все скалярные состояния, включая
ДопустимуюДлинуНомера, ПериодичностьНомера и КонтрольУникальности.
Полная сборка и проектный маршрут ещё не приняты; флажок остаётся пустым.
[Проверенный договор](../reports/2026-10-01-stateful-owner-scalars.md).

2026-10-01: нумератор целиком проверен в XML ↔ YAML для трёх существующих
e2e-объектов, уведомления основы и повторов истории. До подключения проекта
и полного межфайлового контроля флажок не ставится.
[Проверки](../reports/2026-10-01-complete-document-numerator.md).

2026-10-01: сравнение перечислений и boolean нумератора с основой реализовано
из исходных правил. Контроль даёт ошибку, уведомление — предупреждение,
разрешённое изменение принимается; проверены совпадение и отсутствие
свойства. Полный исходный YAML обнаруживает оба реальных расхождения.
Проверочное представление автоматически получается из полной декларации;
межфайловая проверка выполняется отдельной стадией, не прерывая чтение XML.
Приняты 20 сценариев numeric-owners (вместе с InputByString — 82), 12 проверок
Node и 10 contributions. Полный pnpm test, Clippy, архитектура и дубли прошли.
Флажок владельца пуст: проектный маршрут и создание ещё не подключены.
[Результат и границы](../reports/2026-10-01-owner-base-scalar-validation.md).

2026-10-01: источник полного нумератора сохраняет UUID и принадлежность
в снимке фактов. Собственный/Заимствованный берутся из существующего
перечисления, отсутствие XML-элемента трактуется по исходному умолчанию.
Следующий шаг — общий выбор профиля по снимку и подключение полного
маршрута. Сам маршрут ещё не реализован; флажок не меняется.

2026-10-01: общий маршрут выбирает профиль и входы таблицей select по снимку
фактов. Проверены обе стороны и сохранена совместимость прежних маршрутов.
Исправлена общая совместимость текстовых ключей подготовленных enum-индексов;
рабочий каталог снова собирается. Проектные факты — 31 проверка, contributions
— 11. Дубли новых тестов устранены. Нумератор ещё не подключён: следующим
шагом факты основы адресуются по её UUID, затем собирается полный маршрут
с созданием и отдельной проектной валидацией. Флажок владельца остаётся пустым.
[Проверенный механизм и границы](../reports/2026-10-01-project-profile-selection.md).

2026-10-01: факты чисел полного нумератора больше не получают подставной
UUID расширения: используется UUID настоящей основы. Декларация разрешает
адрес через индекс связи, а состояния остаются привязаны к текущему UUID.
После падающей регрессии приняты все 20 Rust-сценариев и 13 проверок Node;
источников фактов — 27. Далее: полный рабочий маршрут, отдельная проектная
валидация и создание нового объекта. Флажок владельца не меняется.

2026-10-01: источник принадлежности нумератора создаётся из YAML по связи
с основой, без исходного XML. Общий optional в шаблоне пропускает только
необязательное поле, сохраняет источник и не скрывает повреждённые снимки.
Усиленный пример отсутствующего boolean исправлен: соседнее свойство основы
не теряется. Реестр — 23 Rust-сценария и 30 источников (с InputByString — 85),
Node — 13, проектные операции — 32. Рабочий маршрут и флажок ещё не приняты:
нужно подключение каталога, проектной проверки и чтение актуальных базовых
YAML-значений вместо сохранённых изменяемых значений снимков.
[Договор и границы](../reports/2026-10-01-numerator-creation-facts.md).


2026-10-01: доступно чтение текущего YAML локальных и внешних источников
фактов. Изменённые значения проверены в подготовленном индексе; старые
снимки не подменяют удалённые файлы. Это предпосылка полного нумератора,
а не приёмка владельца: его флажок не меняется.
[Проверка и оставшееся подключение](../reports/2026-10-01-current-yaml-facts.md).

2026-10-01: первичная YAML-проекция числовых, булевых и перечисляемых
фактов основы нумератора составляется из параметров rules.ts. Добавлены
реальный YAML основы, изменение boolean без импорта XML и восстановление
всех умолчаний из пустого YAML. Сбор фактов выделяет объявленные поля;
полная проверка владельца сохраняет прежнюю строгость. Нумератор ещё
не принят: требуется рабочее подключение UUID/основы, проверки и создания.


2026-10-01: общая операция поддерживает UUID внешнего источника из снимка,
явные наборы основной конфигурации `fromBase`, отдельные декларативные
проверки и подготовку идентификатора нового файла до чтения его зависимостей.
38 проектных проверок прошли. Маршрут полного нумератора генерируется
из деклараций, но пока хранится в кандидатном каталоге: рабочее подключение
даёт 35 686 210 байт Rust при лимите 33 554 432. Флажок нумератора не изменён.
Следующий шаг — общий договор регистраций/индексов для разделения пакетов,
затем рабочий round-trip и создание собственных/заимствованных файлов.


2026-10-01: полная рабочая сборка нумератора принята. Проверки проекта —
39/39, общий договор раздельной генерации — 13/13, проверки генерации — 6/6.
Clippy, архитектура Rust/rules/TypeScript, поиск новых дублей и полный
`pnpm test` завершились успешно. XML-фикстуры не менялись. Нумератор
отмечен целиком; сводка прикладных объектов теперь 5/57 (включает ранее
принятые определяемый тип, журнал, перечисление и значение перечисления).
Общие объекты остаются 54/90. [Приёмка](../reports/2026-10-01-numerator-production.md).


2026-10-02: рабочий пакет источников InputByString дополнен восемью
сохранёнными состояниями и восемью текущими числовыми проекциями. Генератор
даёт 48 источников и 56 маршрутов; проверяется реальная матрица 24 владельцев.
[Приёмка источников](../reports/2026-10-02-input-by-string-numeric-sources.md)
фиксируется отдельно от потребителя и полного владельца. Флажок common
не изменён: остаются подключение потребителя и полный двусторонний договор.


Приёмка пакета источников завершена: приложение 54/54, генератор 12/12
и --check, Clippy, type-check, архитектура Rust/rules/TypeScript, дубли
и полный pnpm test прошли. Проверены сохранённые состояния и все базовые
числовые проекции 24 реальных объектов, а также изменение YAML основы.
Это закрывает источники, а не InputByStringFields целиком; флажок и
сводка common 54/90 не изменены. Следующим принимается потребитель.

XMLRoot, рабочая привязка оболочки: проверены 29 файлов AdditionalIndexes,
четыре отклонения отдельного файла и восемь отклонений журнала CF/CFE.
Сохраняются неизвестные атрибуты, пространства имён, изменённая и отсутствующая
версия. Отклонения постоянных атрибутов больше не прерывают подготовку фактов.
[Результат и оставшиеся границы](../reports/2026-10-02-xml-root-working-file-envelope.md).
Флажок XMLRoot остаётся пустым до общей приёмки; счётчик common не изменён.

Повторная проверка общих коллекций: все 26 сценариев проходят после общего
исправления XML-порядка и восстановления декларативного перевода пути
ChoiceParameterLinks. [Проверки и причины](../reports/2026-10-02-common-collection-regressions.md).
Новые флажки не добавляются: защищены ранее принятые договоры.


XMLRoot, приёмка содержимого вычисляемого файла (2026-10-02): проверочная
декларация Predefined.xml справочника покрывает реальный простой файл,
вложенную группу с соседним элементом, сокращение UUID через индекс,
экспорт без XML-референса и сохранение неверного булева значения.
[Отчёт и границы](../reports/2026-10-02-predefined-catalog-file.md).
Прочие виды содержимого и расширения ещё не приняты; XMLRoot-флажок
не изменён, common остаётся 56/90.


XMLRoot, характеристика (2026-10-02): два исходных e2e/cf-файла
`Predefined.xml` и вложенный пример проверены той же рекурсивной декларацией
с постоянным параметром. Пустые типы групп и обычные типы восстанавливаются
без лишних аномалий; отклонения оболочки сохраняют QName.
Флажок XMLRoot остаётся пустым до общей приёмки, common — 56/90.


XMLRoot, виды расчёта (2026-10-02): реальный Predefined.xml с тремя коллекциями ссылок, булевым полем, UUID и экспортом без референса. Повторы, пустая коллекция и неверная ссылка включены в матрицу. [Границы приёмки](../reports/2026-10-02-predefined-calculation-file.md). Расширения, планы счетов и полное подключение ещё впереди. XMLRoot остаётся без флажка, common56/90.

XMLRoot, счета (2026-10-02): проверены все поля реального Predefined.xml,
вложенные признаки учёта и виды субконто, вложенный счёт с UUID по индексу,
экспорт без референса и аномалии с сохранением соседних строк.
[Границы приёмки](../reports/2026-10-02-predefined-account-file.md).
Рабочая проектная привязка и расширения не закрыты; XMLRoot остаётся пустым,
common56/90.

XMLRoot, состояния отдельных записей расширения (2026-10-02): реальные
CFE-записи AdoptedNotify и AdoptedCheck, в том числе вложенная, проверены
через общий выбор записи и тег `!проверять`. Собственные записи не выводят
ExtensionState; содержимое используется из общего фрагмента без копирования.
Это ещё не приёмка файла расширения: именованная рекурсивная коллекция и
рабочая привязка владельца остаются. Флажок XMLRoot пустой, common56/90.

XMLRoot, общий интерфейс составных записей (2026-10-02): исправлены
признаки присутствия и аннотаций поля; XML-поправка учитывается при решении,
можно ли сокращать поле в ключ коллекции. Матрица проверяет корректный,
отсутствующий и неверный атрибут, чтение сохранённого YAML, соседнее поле
и обратное восстановление XML. Новых принятых объектов нет: XMLRoot
остаётся без флажка, common56/90. Именованная коллекция вариантов впереди.

XMLRoot, файл расширения (2026-10-02): весь реальный Predefined.xml прошёл
декларативное преобразование, вложенность, UUID, состояния и независимый
обратный экспорт; повреждённая вложенная запись, атрибут имени и повторы
сохраняются как аномалии. Оболочка автоматически генерируется из rules.ts.
[Границы](../reports/2026-10-02-predefined-extension-file.md): остаётся
рабочая проектная привязка владельца. Флажок XMLRoot пустой, common56/90.

XMLRoot, автоматическая привязка владельца (2026-10-02): переносчик выводит
фрагменты внешнего файла для четырёх типов и расширения из rules.ts.
Совместная проверка настоящего XML справочника расширения и Predefined.xml
прошла, включая несогласованную принадлежность с автоматическим сохранением
аномалий. Индекс пока не собирается проектом: UUID остаются явными.
XMLRoot остаётся без флажка, common56/90.
[Подключение и границы](../reports/2026-10-02-predefined-owner-attachment.md).

XMLRoot, рекурсивный индекс (2026-10-03): общий механизм сбора вкладов строк
проверен на трёх уровнях вложенности, соседней строке и неполном UUID.
Это ещё не сбор индекса настоящих Predefined рабочим проектом. Флажок XMLRoot
остаётся пустым; common56/90. [Результат и ограничения](../reports/2026-10-03-recursive-identity-facts.md).

XMLRoot, исходный индекс (2026-10-03): справочники, характеристики, счета и
виды расчёта получают UUID из настоящих Predefined.xml общим механизмом
подготовки. Расширение также прошло отдельный файл с исходным индексом.
Подготовка индекса через подключение владельца расширения также проверена,
включая восстановление двух XML без исходных документов. Рабочие проектные
маршруты ещё не приняты. Флажок XMLRoot остаётся
пустым; common56/90. [Границы](../reports/2026-10-03-predefined-source-identity-index.md).

2026-10-03: потоковая подготовка прикреплённого Predefined.xml получила проверку загрузки один раз и освобождения документа после вклада. Общий загрузчик подключён к рабочему проектному пути; проверка компиляции приложения прошла. Приёмка полного маршрута владельцев и сохранения индекса между отдельными операциями остаётся отдельной работой, поэтому флажки Predefined/XMLRoot не изменены.

2026-10-03: сохраняемый источник CFE проверен до появления индекса импорта:
YAML источника содержит UUID явно, а основной YAML их сокращает. Новое
поколение фактов собирается только из сохранённого YAML; оба XML
восстанавливаются без исходных документов и старого индекса. Проверка
присоединённого владельца прошла1/1 (270,89с). Запись источника и обычное
преобразование используют разные API; специальных ветвей Predefined нет.
Далее — расписание подготовки из сохраняемого YAML-источника и его рабочая
регистрация в маршрутах. Прямой вклад источника не считается приёмкой
проектного расписания, и XMLRoot пока не отмечается.

2026-10-03: подготовка сохраняемого источника выполнена через общее расписание.
SourceKind различает обычные данные и сохраняемый смысловой YAML на границе
операции. У сохраняемого источника исключается собственная индексная
зависимость; внешние зависимости и обычные циклы остаются. Настоящий CFE
восстановил новое поколение UUID без ручного словаря и прямого contribute:
проверка1/1 (232,74с). Общая матрица1/1 проверила также неполный источник,
отсутствующий внешний контекст и неверное направление до загрузки.
Рабочая композиция приложения подключена; её проверка ещё выполняется.
Флажок XMLRoot и56/90 common не меняются: полные маршруты владельцев
и сохранение файлов между отдельными запусками остаются отдельной приёмкой.

2026-10-03: последняя поведенческая проверка рабочего приложения не принята:
запись Rust-архива завершилась ошибкой нехватки места до запуска тестов.
После освобождения устаревших собственных результатов сборки повторная
матрица четырёх семейств обнаружила исчезновение уже созданных зависимостей
во время компиляции. До подтверждения окончания параллельной очистки
Rust-запуски приостановлены. Это не доказательство ошибки преобразований
и не основание считать их проверенными. Матрица переносчика файловых
оболочек прошла15/15; форматирование и поиск новых дублей прошли.
Новые журналы сохраняются в рабочем дереве, а не в /tmp.
Полная приёмка владельцев, XMLRoot и Predefined остаётся незавершённой;
флажки common56/90 не меняются.

2026-10-03: повтор после освобождения диска прошёл: существующая матрица
четырёх обычных семейств Predefined — GREEN1/1 (199,96с; первоначальная
пересборка зависимостей4м03с). Сохранённый YAML создан без прежнего индекса;
новое поколение подготовлено через общее потоковое расписание, восстановление
проверено по неизменным исходным XML и независимому ожидаемому YAML.
Включены вложенные группы, типы характеристик, счета и ссылки видов расчёта.
Число функций тестов не увеличивалось. Рабочие facts/resources приложения
запущены отдельно; их результата ещё нет. Флажки полной приёмки не меняются.

2026-10-03: рабочий повтор GREEN: facts45/45 (57,58с) и resources11/11
(1,97с), включая самостоятельный экспорт после открытия сохранённого YAML.
Холодная сборка приложения после очистки31м46с — это отдельный показатель,
не скорость преобразований. Ошибок исчезновения файлов больше не было;
поиск новых дублей также прошёл. Проверка разделения Predefined UUID основы
и расширения добавлена в существующий CFE-тест и выполняется следующей;
полные маршруты пяти владельцев пока не приняты, флажки остаются прежними.

2026-10-03: разделение контекста компонентов подтверждено RED→GREEN.
Совместная подготовка настоящих файлов основы и расширения сначала дала
fact.ambiguous для Группа2 (336,50с). В проверочной декларации владельца
добавлена обычная входная область component; существующее concat связывает
owner с component/Справочник.Name. Основной источник получает область cf.
Повтор прошёл1/1 (371,22с), включая прежние отдельные операции и восстановление
из сохранённого YAML. Компилятор и common-декларации содержимого не менялись,
новых тестовых функций не добавлено. Поиск дублей и форматирование прошли.
Перед рабочей регистрацией тот же уникальный ключ должен быть выведен
переносчиком для всех владельцев; полная приёмка пока не отмечается.

04.10: у плана видов характеристик TypeDescription включён в общую историю
состояний: постоянные9/9 сценариев CF/CFE, сокращение и сохранение порядка,
совместимость и аномалии. Флажок владельца пустой: MultiState вложенных
реквизитов и полная привязка контекста/маршрутов ещё не приняты. Common56/90.

04.10: общий сборщик состояний записей подключён также к полной декларации
плана видов характеристик. TypeDescription не дублируется обычным полем,
ограничения версии и история общие. Синтаксис и связи каталога прошли;
полная CF/CFE-приёмка с вложенными группами ещё впереди. Флажок пустой.

04.10: для групповых состояний вложенных реквизитов готова общая структурная
группировка без копирования строк; ядро92/92. Преобразование MultiState ещё
не принято: требуется подключение деклараций и проверка XML↔YAML.
Флажки владельца и common56/90 не изменены.

04.10: `firstBy` подключён к генерации Rust для заимствованных входов и
объявленных коллекций; первые физические вхождения сохраняются без копирования
строк. Проверены повторы, вложенный вид, вычисляемые текстовые ключи и точные
числа. Общая привязка элементов используется также проверкой единственного
вхождения. Это не приёмка MultiState: плоская запись групп и XML↔YAML двух
реальных реквизитов ещё не подключены; флажки common56/90 и владельца прежние.

04.10: пометки элементов (`itemTag`) подключены к скомпилированным коллекциям
скаляров и записей. Нативная матрица проверяет обе стороны преобразования,
повторы, вложенные QName и восстановление аномалий. Это часть общего механизма,
а не завершение MultiState: все флажки прежние, common56/90.

04.10: проверены и исправлены коллизии пометок при сокращении вложенного
списка и совместная работа пометки записи с `!xml/raw` её поля. Усилены
существующие матрицы, исходные XML-фикстуры не менялись. Новых завершённых
объектов по этому исправлению нет; common56/90, MultiState ещё открыт.

04.10: общий вывод строк объявленной коллекции подключён также как интерфейс
объединения групп, с проверкой пустоты и сохранения конверта. Флажок
MultiState остаётся пустым: проекция полного common и реальные пары впереди.


04.10: полная проекция TypeDescription передаёт общий интерфейс выдачи
элементов с квалификаторами и входами. Матрица проверяет строку, дату,
булево, последовательный вывод групп и сохранение границы XML-конверта.
Это не завершает MultiState: скомпилированная сборка групп и две реальные
e2e-пары ещё не приняты. Флажки остаются без изменений (common56/90).


04.10: содержимое CheckValue/ExtendValue двух реальных реквизитов прошло
контрольный экспорт через полный TypeDescription; плоский вывод совпал
по структуре и пометкам с существующим YAML. Это проверка содержимого,
полная приёмка MultiState и новые флажки остаются открытыми.

04.10: для MultiState добавлены общая компилируемая группировка и отдельный
common групп TypeDescription, включая вложенную оболочку свойства. Флажок
не меняется до проверки полного контекста реквизита и всех согласованных
условий присутствия. Вспомогательный common не считается новым завершённым
объектом исходного перечня.

04.10: нативная приёмка целых групп и вложенного Type прошла на двух реальных
парах, включая аномалии, повторы и пустой NotifyValue. Новые дубли устранены.
Флажки прежние: подключение выбора обычный/MultiState к полному реквизиту и
его контексту остаётся обязательным перед приёмкой владельца.

04.10: передача входов common через обёртку состояния и общий выбор списка
по входному режиму расширены. Полная интеграция вложенного реквизита с историей
ещё не принята; новых флажков по этому проверочному договору не ставим.

04.10: режим обычный/MultiState получается из индекса истории; проверены
две реальные пары Type + PropertyState, обратная подготовка индекса из YAML
и изоляция по владельцу/свойству. Нативная матрица3/3 с Clippy прошла.
Полная автоматическая сборка реквизита ещё не принята; common56/90,
флажки прежние. Новый столбец частичной готовности не вводится.

04.10: автоматическая сборка вложенного реквизита доводит33/33 обычных свойства
до генерации Rust, включая UUID. Сокращённая история двух реальных MultiState
примеров восстанавливается из YAML без отдельного ключа состояний. Это не
полная приёмка расширения со всеми свойствами и контекстом основной
конфигурации; common56/90 и флажки владельцев прежние.


04.10: сборщик исходных правил автоматически выбирает подключение Type/MultiState
по YAML-договору common. Полная приёмка реквизита остаётся открытой: соседние
FillValue/ChoiceForm должны получать общую смысловую проекцию типа. Защита
от потерянной зависимости добавлена; флажки и common56/90 прежние.

04.10: общий доступ к вложенным смысловым записям по ссылке и привязки входов
выражениями проверяются отдельно от конкретного реквизита. Полная интеграция
FillValue/ChoiceForm и контекста расширения ещё открыта; common56/90 и флажки
владельцев прежние.

04.10: общий обход объединённых списков и поиск исходной строки без копирования
проверены также при передаче между декларациями и восстановлении XML-префикса.
Это подготовка смысловой проекции типа, не приёмка целого реквизита;
common56/90 и все флажки остаются прежними.

04.10: проверка наличия смыслового поля защищает отсутствие и пустоту при
передаче заимствованной записи. Это общий договор; приёмка реквизита не
завершена, новых флажков нет.

04.10: полная декларация реквизита с33/33 зарегистрированными свойствами
собирается с состояниями Type и смысловыми привязками FillValue/ChoiceForm.
Существующая матрица проверяет связывание и генерацию. Полный нативный e2e
и контекст основной конфигурации ещё не приняты; common56/90 и флажки прежние.


04.10: нативная полная декларация реквизита проверена на четырёх целых
CF-фикстурах; независимый YAML, UUID/родитель, обратный XML и аномалия
PasswordMode сохранены. Состояния остальных свойств и основной конфигурации
ещё не приняты; флажки прежние, common56/90.


04.10: подключена общая связь реквизита с основной конфигурацией. Существующая
декларация base-reference-state теперь допускает связь, зарегистрированную в
политике состояний, даже без отдельного свойства rules.ts. Исходные 33
регистрации не дополнены вымышленным свойством. Контекст (принадлежность,
UUID основного реквизита, PropertyState) извлекается из неизменных XML.
Нативная матрица проверяет четыре целых реквизита CF и два выбранных договора
CFE (связь + смешанный тип), оба направления и экспорт без референса.
Полная приёмка реквизита расширения ещё не выполнена; флажок не ставится.

Следующий шаг Format уточнён экспериментом: последовательность переводов
внутри записи состояния требует общего пути для проекции коллекции и её
проверок. Смена выбора YAML сама по себе не решает проблему: сначала
отклоняется внешняя форма присутствия, затем проверки коллекции требуют
собственного хранилища строк. Экспериментальные изменения этого пути
отменены; обхода через частный обработчик, raw или пропуск проверок нет.


04.10, завершён блок контекста реквизита: нативно проверены восемь целых
реквизитов (четыре CF, четыре CFE) и две проекции связи/смешанных состояний.
Полная декларация по-прежнему содержит 33/33 исходные регистрации, служебная
связь не объявляется дополнительным перенесённым свойством. Через все уровни
compose передаются принадлежность и компонент; из индексов восстанавливаются
UUID реквизита, его родителя и основного реквизита. Пропущенные свойства
заимствованного объекта остаются пропущенными; пустой InternalInfo сохраняется
по общему договору связи. История предшествует Properties, у унаследованной
связи место после комментария; порядок определяется данными переноса.

Исправлен общий генератор: пустая/nil XML-форма распознаётся по всем объявленным
веткам, а экспорт выбирает действующую ветку по контексту. Это устраняет ложные
аномалии MinValue/MaxValue при добавлении условной ветки missing. Прежние
канонические ветки и условие сокращения FillValue сохраняются. YAML сравнивается
по значениям и тегам без зависимости от порядка ключей mapping; порядок
sequence строгий. И ожидаемый, и фактически импортированный YAML отдельно
проверяются против исходного XML, затем выполняется экспорт без референса.

Итог: compiler 200/200 (family 106.98 с, generate 39.77 с), переносчик 215/215,
Clippy compiler all-targets -Dwarnings 5.48 с, архитектура rules 66/66,
проверка зависимостей, rustfmt/diff-check и поиск дублей зелёные. Один ранее
игнорируемый тест размера остаётся игнорируемым. Фикстуры не изменены.
Полная приёмка объекта ещё требует состояний Format и включения в рабочую
сборку владельцев: отдельные примеры не закрывают эти требования. Флажок не
поставлен; следующим идёт общий путь коллекции переводов внутри проекции.

Примечание 2026-10-04: исправлены общая генерация проверок строк без внешнего
ключа и пересечение ссылок на состояния нескольких свойств. Флажки объектов
не изменены: состояния Format и рабочая сборка владельца ещё не приняты.


2026-10-05: состояния Format приняты в нативной матрице полной декларации
MetadataCatalogAttributeRules: восемь реальных CF/CFE, две проекции и шесть
производных вариантов пометок. Все 33 исходные регистрации сохраняются.
Общий путь проекции словаря проверяется отдельно с дополнительными булевым
и текстовым полями; это не новый объект 1С. Флажок полного реквизита остаётся
пустым: рабочая сборка владельца и проектная подготовка его входов ещё
не приняты. Количество принятых common этим блоком не изменяется.

2026-10-05: добавлена [воспроизводимая генерация полного реквизита](../reports/2026-10-05-catalog-attribute-source-operation.md)
из rules.ts; нативная проверка использует общий сборщик. Машинный отчёт
различает обычные значения plain и свойства, требующие истории состояний;
прежнее утверждение о четырёх недостающих неявных состояниях исправлено
по исходному TS и XML. Изолированное тело укладывается в 16 МиБ после
исправления обычных свойств; перед подключением нужно определить его место в рабочих пакетах
и выполнить проектную приёмку. Флажки не изменены.

Проверены 24 нативных случая полной декларации реквизита, включая отсутствие
и пустые plain-поля. Флажки не изменены: рабочее подключение не принято.

2026-10-05: полная декларация реквизита включена в `compiled-rules-bodies-3`,
независимые источники UUID, истории и связи с основой — в
`compiled-rules-members-2`. Размеры обоих пакетов укладываются в прежние пределы.
Через общую рабочую границу прошли 16 случаев из прежней общей матрицы;
отдельная проверочная
проекция не включена в рабочий каталог. Все шесть поставщиков индексов
сохраняются автоматически при композиции. Флажок MetadataCatalogAttributeRules
не изменён: подключение к коллекции и файловому маршруту владельца, текущий
YAML основы, отдельная валидация и создание без референса ещё не приняты.

2026-10-05: полная декларация реквизита проверена внутри именованной коллекции:
восемь реальных элементов и четыре списка с соседями в двух порядках, включая
аномалии и обратное восстановление. Привязки строятся по композиции и регистрации;
проверено переименование входов. Флажок MetadataCatalogAttributeRules остаётся
пустым до полной файловой и проектной приёмки, включая поставщиков индексов
полного владельца и текущий YAML основы.

2026-10-05: переносчик создаёт три независимых источника фактов из полного
XML каталога. UUID владельца читается из XML, вручную не передаётся. Матрица
коллекции прошла 12 случаев CF/CFE, отсутствие UUID и неверный корень проверены.
Флажок полного реквизита остаётся пустым до файловой и проектной приёмки.

Декларация полной коллекции теперь сохраняется командой переноса и проверяется
через --check; флажок не изменён. Подготовка фактов через сохранённый YAML
проверена отдельно от ещё не принятого актуального YAML основы.

2026-10-05: dependent defaults и условный числовой максимум перенесены общими
выражениями. Справочник с коллекцией реквизитов: сборщик 47/69, ещё 22 свойства;
приёмка всего объекта не завершена, флажки не менялись.


2026-10-05: иерархические defaults, ограниченные коллекции ссылок и шесть
текстовых свойств с пустым XML-default выражаются общими декларациями.
Сборка MetadataCatalogRules с реквизитами: 57/69, ещё 12 свойств и роль owners;
проверены 11 случаев defaults, три ссылок и 16 текстов. Полная файловая
и проектная приёмка не завершена; флажки объектов остаются пустыми.


2026-10-05: сборка справочника теперь автоматически подключает готовые вложения
и покрывает 64/69 свойств. Остаются пять свойств, роль owners и полная файловая/
проектная приёмка; флажок справочника остаётся пустым. Совместное подключение
внутренних сведений, имён форм/макетов и внешних файлов проверено двумя
скомпилированными сценариями. Выполнение файловых действий с модулем менеджера
не считается принятым только по наличию его декларации.

2026-10-05: сборщик справочника автоматически подключает InputByString к одной
истории; охват 65/69. Проверены связанные примеры основы, расширения и отсутствия
зависимых полей. Флажок справочника не меняется: оставшиеся четыре свойства,
состояния соседних полей и полная файловая операция ещё требуют приёмки.

2026-10-05: стандартные реквизиты подключены общим сборщиком; ручной дубль
у характеристик удалён. Два связанных нативных сценария проходят без референса.
Справочник: 66/69 подключённых свойств, остаются tabularSections, predefined,
objectModule; флажок полной приёмки владельца остаётся снятым.


### 2026-10-05: автоматическое подключение табличных частей

Сборка из регистрации `rules.ts` подключает готовую декларацию табличной
части по проверенной связи коллекции. UUID и имя родителя берутся из полей
собранного объекта; UUID, имя и полное имя элемента — из строки коллекции.
Источники внутренних типов, внутренних значений, собственных UUID, корней
и форм закреплены в договоре сборки, а не выбираются по форме ключа индекса.
Непроверенные параметры оставляют свойство неподключённым; явное подключение
имеет приоритет и не создаёт второй экземпляр коллекции.

Подготовка индексов разрешена только корню операции. Это правило действует
также для фрагментов, перенесённых из декларации файлового владельца.
Вложенные фрагменты получают готовые индексы через декларативные связи.
Специализированных преобразователей в Rust или условий по типу справочника
в общем исполнителе не добавлено.

Текущее подключение справочника: **67/69** свойств; остаются `predefined`
и `objectModule`. Это охват сборки, а не приёмка полного владельца: флажок
справочника остаётся снятым. Расширения коллекций и оставшиеся состояния
свойств проходят отдельную приёмку.

Проверка блока: 222/222 проверки инструмента переноса; коллекция и исходная
отдельная табличная часть прошли оба направления без референса и `!xml`.
Исправлен общий приоритет присутствия над вариантами значения: пустая
`ФормаВыбора` реквизита остаётся отсутствующим значением YAML, как в эталоне.
XML-фикстуры и независимые ожидания не изменены. Архитектурная проверка Rust
пройдена; новых дублей относительно `91a01277` нет. Полный `pnpm test` не
запускался; полная приёмка справочника остаётся открытой.
Уточнение 2026-10-05: сборщик справочника подключает **69/69** исходных свойств,
включая предопределённые элементы и модуль объекта. Флажок остаётся снятым:
состояния, расширения и полная операция ещё не приняты. Охват свойств не
подменяет приёмку целого владельца.

### 2026-10-05: оставшиеся скалярные состояния справочника

Общий сборщик автоматически подключает `hierarchical`, `hierarchyType` и
`codeAllowedLength` к единой истории состояний. Условия присутствия и значения
по умолчанию берутся из проверенной исходной регистрации; смысловые обращения
к полям получают представление значения, а проверка наличия остаётся проверкой
целого поля. Обычное значение заимствованного объекта остаётся явным; помеченное
значение сокращается существующим договором (`!проверять`). Сборка истории общая
для прежнего и нового способов подключения; второго XML-пути истории нет.

Приёмка: четыре сценария Rust в обоих направлениях без XML-референса и `!xml`,
включая пометку состояния и соседние свойства. XML-фикстуры не изменены. Новых
условий по типу метаданных в Rust не добавлено. Поддержка сокращения в переносчике
ограничена проверенным исходным условием заимствования; неизвестные конструкции
остаются неподдержанными, а не превращаются в аномалии.

Охват справочника остаётся 69/69; флажок полной приёмки снят. Следующие проверки:
смысловое состояние предопределённых элементов, состояния разделов модулей,
факты владельцев, расширения и полная операция. Полный `pnpm test` не запускался.

### 2026-10-05: исправление прежних сценариев плана видов характеристик

Сокращение обычного скалярного значения сравнивает полный вариант значения,
включая скрытое состояние, а не только его короткую запись YAML. Условия
сокращения и восстановления используют одинаковое дерево условий; общий
построитель применяется и к прежнему подключению, и к новому сборщику.
Исправление выражено данными декларации, без нового частного обработчика Rust.

Выделение части e2e-фикстуры не должно создавать пустой XML-контейнер, если
исходный контейнер содержал только исключённые из этой проверки дочерние узлы.
Для выделенной истории используется `omitEmptyStateProjection`; настоящая
пустота исходного контейнера сохраняется. Старые способы подготовки примеров,
которые добавляют синтетические строки состояний, остаются совместимыми.
XML-фикстуры и независимые значения YAML не изменены.

Девять прежних сценариев подключены к общему выбранному запуску коллекций.
Источники выделенной истории имеют собственные имена, чтобы их контекст не
смешивался с исходными полными читателями фактов. Дополнительных функций
проверок для каждого свойства не создаётся. Полная приёмка владельца остаётся
отдельной: расширения внешних файлов, состояния разделов и факты владельцев
ещё не закрыты; флажок не ставится за исправление отдельных сценариев.


### 2026-10-05: секции состояний внешних ресурсов

Подключён общий построитель `ownerStateSections`: он автоматически получает
имена и режимы из проверенной исходной регистрации, создаёт секции «Изменять»
и «Проверять» и связывает их с единой историей. Канонические строки
восстанавливаются из секций; порядок и повторы сохраняются явной историей.
Готовность состояния отмечается в отчёте только для реально подключённого
свойства. Частных обработчиков в Rust не добавлено.

Расширен общий договор коллекций записей: вложенные условия над элементами
работают через заимствованный просмотр; нарушение ограничения всей коллекции
сохраняется автоматически существующими пометками аномалий. Для коллекций
без ограничений дополнительного хранилища пометок нет. Проверочные примеры
добавлены данными в существующий запуск, без новых функций для каждого поля.

Покрыты модули справочника, настоящая команда и пакет XDTO из e2e, режим Notify,
неканоническая история, повторы, неизвестные имена и конфликт режимов.
Исправлен отбор проверочных источников фактов: сценарий без индексов больше
не расширяет набор поставщиков остальных сценариев. Иначе выбранная небольшая
проверка могла генерировать более 100 МБ Rust; ограничитель остановил её до
компиляции. Это исправление не меняет выполнение конвертера.

Следующая часть: подготовка фактов внешних ресурсов, включая неявный Control
по наличию файла, и подключение этих фактов к полной операции владельца.
Затем — расширения и полная cf/cfe-приёмка. Флажки владельцев не изменены;
охват справочника 69/69 не означает полную приёмку. Весь `pnpm test` не запускался.


Итог проверки секций: 23 сценария Rust пройдены вместе — 11 сценариев
состояний и секций, девять прежних сценариев плана видов характеристик и три
прежних сценария коллекций записей. Проверены оба направления без XML-референса,
восстановление аномалий и отклонение лишних пометок. 222/222 проверки переносчика,
Clippy компилятора, архитектура Rust, формат Rust 2024, воспроизводимость
генерации и поиск новых дублей пройдены. Выбранная сборка заняла 2 мин 18 с;
это время проверочного пакета, не измерение производительности конвертера.


### 2026-10-05: подключение смыслового состояния внешней коллекции

`ownerSemanticStates` автоматически связывает присутствие смысловой коллекции
с общей историей Extended. Условие заимствования и допустимые версии берутся
из исходной регистрации; новых частных обработчиков Rust нет. Компилятор
использует одну локальную форму внешнего значения для преобразования и
заимствования контекста. Отсутствие необязательного файла больше не создаёт
пустую коллекцию; пустой существующий файл остаётся явным пустым значением.

Проверены обычный справочник с заполненным файлом и реальный владелец расширения
с двумя вариациями внешнего файла: пустым и отсутствующим. Эти вариации проверяют
смысловое состояние владельца; все состояния дочерних предопределённых элементов
и весь расширенный владелец ими не принимаются. Флажки остаются снятыми.

Уточнён следующий договор: неявный Control по наличию файла — факт проверки
расширения, а не добавляемая строка XML. Подготовка таких фактов и повторная
проверка наличия при экспорте ещё нужны; сохранённый список импорта недостаточен.
Шесть файловых профилей и прежняя сборка плана видов характеристик обновлены
генераторами. XML-фикстуры не изменялись. Полный `pnpm test` не запускался.


Приёмка блока: 26 сценариев Rust в общем запуске и 222/222 проверки переносчика
пройдены. Clippy компилятора, архитектура Rust, формат, воспроизводимость
генерации и поиск новых дублей пройдены. Отчёты обновлены: 238 независимых
сценариев, 417 деклараций; 160 готовых подключений, 6 заблокированных.
Флажки полной приёмки владельцев не изменены.


2026-10-05: общий файловый источник и обновление файловых фактов перед экспортом
проверены отдельно. Снятые флажки владельцев остаются снятыми: автоматическое
подключение фактов секционных свойств и полная приёмка ещё нужны. Подробнее —
раздел «Текущие факты внешних файлов» в основном плане.
Переносчик получил 55 пар файловых путей для 37 владельцев; 18 владельцев
с вычисляемыми путями находятся в отчёте блокировок. Это подготовка подключений,
флажков полной приёмки она не меняет.


2026-10-05: отчёт внешних файлов уточнён до конкретного свойства и параметра.
Общий сборщик поддерживает фрагменты истории без обычных свойств; проверена
команда документа. Флажки объектов не изменены: вычисляемые пути и полная
операция команды пока не приняты.


2026-10-05: принят общий договор потоковых отпечатков файлов и декларативного
сравнения режимов через подготовленный индекс. Полная операция владельца
с настоящими UUID и базовыми фактами пока не принята; флажки не изменены.


2026-10-05: проверки файлов с исследованными постоянными путями автоматически
подключаются к составной декларации владельца. На состояниях XDTO проверены
режимы и отсутствие синтезированного XML Control; факты основы прочитаны из e2e.
Подготовка отпечатков через настоящий маршрут привязывает их к UUID и сохраняет
привязку при переименовании. Полная файловая операция и создание нового объекта
пока не приняты; флажки полной готовности объектов не изменены.


2026-10-05: проверены создание и сохранение UUID, свежие файловые факты основы
и настоящая операция импорт/экспорт с копированием файлов на минимальной
декларации идентичности. Это проверка общего подключения; ни один дополнительный
флажок полного объекта не выставлен. Полная декларация XDTO и все её зависимости
ещё должны пройти совместную приёмку.


2026-10-05: все свойства XDTO теперь автоматически включаются в полную
декларацию, включая Namespace с состояниями и файл пакета. Полная декларация
прошла проверку реальной e2e-фикстуры в Rust в обе стороны с сохранением
значений, UUID и порядка. Флажок владельца пока не выставлен: полноценный
файловый маршрут с автоматически подготовленным контекстом ещё не принят.


2026-10-05: полная файловая декларация XDTO прошла все шесть e2e-фикстур
основной конфигурации и расширения. Контекст, идентичности, история и сведения
о файлах собираются автоматически; проверены новый объект и повторный экспорт.
Декларация и маршрут сохраняются воспроизводимо. Флажок XDTO остаётся снятым
до подключения сохранённой операции к штатному каталогу приложения и его проверки.
Промежуточных флажков не добавлено.

Входная точка XDTO зарегистрирована в штатном пакете и проверяется по сохранённой
декларации. Флажок остаётся пустым: общая сборка приложения требует уменьшения
генерации `compiled-rules-bodies-3`, превышающей установленный предел.

2026-10-05: XDTO полностью принят и отмечен одним флажком. Полная YAML-декларация
и файловые маршруты автоматически получаются из `rules.ts` и подключены к
штатному приложению. Проверены все шесть XML-пакетов CF/CFE, внешние файлы,
отсутствующий файл расширения, создание объекта, устойчивый UUID и полный
экспорт проекта после удаления исходного XML. Общие проверки приложения,
компилятора, архитектуры и новых дублей прошли; остальные флажки не менялись.
[Договор и результаты](../reports/2026-10-05-catalog-attribute-source-operation.md#2026-10-05--полная-приёмка-файловой-операции-xdto).


2026-10-06: завершён общий блок контекста файловых детей: текущие имена,
порядок, маршруты макетов и независимые индексы внутренних типов.
SettingsStorage остаётся с пустым флажком до полной файловой операции с формами
и проверки штатного приложения; промежуточный статус не введён.
[Договор и результаты](../reports/2026-10-06-child-context-and-internal-types.md).

Обновление 2026-10-06: [параметры формы](../reports/2026-10-06-form-parameters.md)
проверены 12 AOT-сценариями, в том числе внутри настоящих форм CF/CFE.
Флажки FormParameter, форм и SettingsStorage остаются пустыми: требуется
рабочее подключение полного содержимого и файловой операции. Дополнительных
статусов готовности нет.

2026-10-06: исправлено автоматическое восстановление явно присутствующих
сокращаемых скаляров; постоянный defaultValue распознаётся общим переносчиком.
[Проверки и оставшиеся условия панели](../reports/2026-10-06-scalar-fallbacks-and-presence.md).
Флажки AutoCommandBar, форм и SettingsStorage остаются пустыми.

2026-10-06: [источник регистраций элементов](../reports/2026-10-06-form-element-registrations.md)
автоматически охватывает 7 регистраций и 81 связь. Это структурный отчёт,
не приёмка объектов: новые флажки не поставлены. Сохраняются требования
к декларации имени/id, вложенным коллекциям и рабочему подключению.

2026-10-06: [договор имени/id](../reports/2026-10-06-element-identity.md)
исполняется в Rust и автоматически записывается для семи регистраций;
19 AOT-сценариев прошли. Полные панели и формы по-прежнему без флажка:
нужно рабочее подключение, нумерация новых элементов и дочерние коллекции.
Аудит семи видов CommandBarChildItems не вводит промежуточных статусов.

### 2026-10-06: сборщик singleton-элементов

Дополнение: ExtendedTooltip имеет полный автоматический охват исходных
сериализуемых свойств и четыре проверки всего XML/YAML-тела, включая e2e.
[Подробности и оставшиеся условия](../reports/2026-10-06-tooltip-assembly.md).
Флажок не ставится до автоматического подключения к владельцам, проверки
сокращённой пустой подсказки и назначения id новому элементу. Частичных
флажков не добавлено; в отчёте сборки отдельно учитывается единственный
не сериализуемый `runtimeOnly`-тип.

Автоматически собраны имя/id и 93 обычных свойства семи регистраций; 15 свойств
остаются неподдержанными. Проверено совместное преобразование панели и сохранение
соседей при аномалии. [Отчёт](../reports/2026-10-06-element-assembly.md).
Флажки элементов и полной формы остаются пустыми: дочерняя коллекция,
обработчики событий и полный рабочий маршрут ещё не приняты.


6 октября: расширено прямое создание значений по умолчанию для обычных,
вложенных и собранных из фрагментов записей. Это общий механизм компилятора;
флажки объектов не меняются. Полное подключение ExtendedTooltip к 41 свойству
остаётся отдельным условием приёмки.

6 октября, продолжение: конструктор поддерживает поля-коллекции записей,
скалярные/текстовые варианты и сохранение привязанного контекста словаря.
Это общий механизм; приёмка полного Tooltip и его 41 подключения ещё не
завершена, поэтому новых флажков нет.


06 октября, продолжение Tooltip: общее создание самостоятельных текстовых
шаблонов поддерживает необязательные и сокращённые поля с исходным контекстом.
Добавлены независимые проверки своего/чужого имени и недопустимого противоречия
при восстановлении. Это возможность общего механизма; флажок Tooltip пока
не ставится, подключение 41 свойства остаётся в плане.


06.10 — общий механизм создания сложных значений расширен до структурных
вариантов, смыслового отсутствия и зависимостей соседних полей.
[Матрица 34 случаев](../reports/2026-10-06-record-default-construction.md)
включает настоящий Font; это проверка механизма, флажки объектов не меняются.

06.10 — проверены сокращение пустого обычного/составного отображения
и восстановление XML-аномалии относительно значения по умолчанию.
Матрица общего механизма расширена до 40 случаев, включая коллекции.
Окончательный вариант сокращает отображение в одном проходе писателя.
Tooltip остаётся без флажка до полной приёмки подключения 41 свойства.


6 октября, автоматическое подключение подсказок: все 41 исходных свойства
перегенерированы со ссылкой на полное относительное тело, восстановлением
пропущенного YAML и выведенными привязками контекста. Восемь ограниченных
Rust-сценариев прошли, включая два исходных договора свойства; общий механизм
проверен 44 случаями. Это не полная приёмка формы: назначение новых id и
проектный маршрут остаются в плане. Флажок остаётся пустым до полной приёмки.
Те же восемь сценариев прошли через общий рабочий каталог вместе с 17
сценариями Events; разделение пакетов сохранило прежний предел размера кода.

06.10 — источники занятых номеров подключены к общему файловому маршруту
через `observe: attributes`. Проверены сохранение/повторное чтение без исходного
XML, привязка к другому имени владельца и пустой новый объект; проверка
оркестратора использует настоящий XML CommandBar. Полное тело формы, колонковые
адреса и приоритет основной формы ещё не приняты; флажки объектов не меняются.
[Договор и проверки](../reports/2026-10-06-form-number-spaces.md).

06.10 — общий источник поддерживает фактический контекст родителей
сохранённого фрагмента и его снимка. Проверены исходная фикстура
`formAttribute/mixedColumns.xml`, переключение области и неверная вложенность.
Полный владелец формы ещё не передаёт этот путь автоматически; флажки
не меняются. Адреса обычных/дополнительных колонок и позиционные случаи
зафиксированы для следующего блока.


2026-10-06: доступно общее предварительно компилируемое выражение
`logicalAddress` для именованных и позиционных частей адреса. Это общий
механизм, а не полная приёмка `FormAttribute`: автоматическое получение исходной
позиции и подключение текущей/основной формы пока не закрыты. Флажки не изменены.


2026-10-06: исходная позиция последовательности доступна через `forEach.index`
до отбора вкладов; проверены обычная и дополнительная колонка из неизменной
XML-фикстуры. Контекст владельца сохраняет текстовые, булевы и точные числовые
значения. Полный `FormAttribute` ещё не принят: флажки объектов не изменены.


Проверка блока позиций и типизированного контекста завершена: полный обычный
`pnpm test`, все 240 проверок переноса, архитектурные проверки и поиск новых
дублей прошли. Ограничения времени и XML-фикстуры не менялись. Rust: 109
проверок ядра, 32 вкладов, 84 связывания, 55 разбора; Clippy прошёл.
Исправлено удержание реестров завершённых TS-тестов; причина колебаний времени
этим исправлением не считается доказанной. Полная форма ещё не принята,
флажки объектов не изменены. Следующий шаг — уникальное имя или исходная
позиция колонки, с однократной подготовкой для каждой исходной коллекции.


2026-10-06: выбор уникального имени/исходной позиции работает общим
предварительно компилируемым `one`. Проверены повтор до отбора строки, пустое
имя и обычная/вложенная/единственная коллекция; исходная mixedColumns.xml
проверяется также с именованными адресами. Полная форма ещё не принята,
флажки объектов не изменены; общий набор проверок блока выполняется.


Итог блока подготовки уникальности: полный обычный `pnpm test`, Rust
(33 проверки вкладов, 84 связывания, 55 разбора), Clippy всех целей,
архитектура, форматирование и поиск новых дублей прошли. Дополнительный
случай той же матрицы проверил ключ через настоящую декларацию common.string.
XML-фикстуры и лимиты тестов не менялись. Флажки полной приёмки объектов
не изменены: остаются все группы дополнительных колонок, приоритет основной
и текущей формы и полноценный файловый маршрут владельца.


2026-10-06: общий YAML-источник идентификаторов охватывает обычные колонки
и все дополнительные группы. Проверены независимые повторы, отсутствие и
пустота, повтор контейнера и неверная вложенная запись. Это подготовка
индекса; FormAttribute полностью ещё не принят, флажки не изменены.


Блок источника групп проверен: Rust (34 вклада, 84 связывания, 55 разбора),
Clippy всех целей, архитектура, дубли и полный обычный pnpm test прошли.
Флажки полной приёмки не меняются. Следующий результат — приоритет основной
и текущей формы с подключением полного файлового владельца.


2026-10-06: добавлена подготовка приоритета текущих/основных реквизитов.
Общий `allocate.phase` сохраняет порядок выбранного этапа при любом порядке
чтения источников; без этапа старое поведение не меняется. YAML-источники
form-attribute-number-sources.yaml выбирают текущий реквизит, резервируют
перекрытый ID основы и выделяют номера только основы от 1000001. Условия
скалярных вкладов используют общий компилятор выражений, без частного
обработчика формы. Проверить оба направления, оба порядка файлов,
непрочитанный текущий источник, конфликты и старые договоры. Флажки полного
переноса не меняются: остаётся подключение этих источников к коллекциям
и полному файловому владельцу формы.


Блок приоритета проверен: 110 Rust-проверок ядра, 36 вкладов, 85 связывания
и 55 разбора прошли; Clippy всех целей, архитектура Rust, поиск новых дублей,
форматирование и полный pnpm test прошли. Дополнительно проверено совместное
связывание новых источников с настоящими источниками колонок и номеров
реквизитов/команд/параметров. Общий наблюдатель всех пространств проверяется
отдельно: ему нужен также распределитель элементов формы.
Следующий шаг — подключить источники к коллекциям и полному файлу формы.
Подготовка должна обходить строки уже разобранного файла, без отдельных
чтений XML, сериализации промежуточного контекста и источника на каждый
реквизит. Флажки полной приёмки объектов пока не меняются.


2026-10-06: добавлен form-attribute-file-sources.yaml — подготовка реквизитов
текущей формы и основы из полного XML-файла через коллекции. Матрица использует
неизменённый Form.xml расширения и отдельный синтетический пример: общий адрес
с разными ID, новые записи без ID, пустые и повторяющиеся имена. Проверяются
XML и сохранённая YAML-проекция, оба порядка источников; число загрузок зависит
от двух источников, а не от количества реквизитов. Не заявляется единственный
разбор: пока текущая форма и основа используют две проекции общего файла.

В общем чтении проекций коллекций исправлена фильтрация: учитываются объявленные
атрибуты, включая фиксированные, и пути дочерних полей; остальные поля полного
объекта не делают проекцию недоступной. Обычное преобразование и его сохранение
аномалий не изменены. Имена, совпадения и порядковые адреса определяются YAML.
Полная форма не принята: остаются вложенные колонки в этом файловом источнике,
занятые исторические ID вне живых строк, фиксированные ID и публичный маршрут.
Флажки полной приёмки не изменяются. Общие регрессии и дубли проверяются ниже.


Проверки файлового источника прошли: 37 вкладов, 85 связывания и 55 разбора;
расширенный пример вложенного XML-атрибута также прошёл. Clippy всех целей
с запретом предупреждений, архитектура Rust, проверка новых дублей и полный
обычный pnpm test прошли. XML-фикстуры, пороги, baseline и старые сценарии
не менялись. Следующий шаг — встроить вложенные колонки с тем же каноническим
адресом родительского реквизита, включая пустые/повторяющиеся имена; не
создавать строковые копии полного контекста или отдельный источник на строку.
Флажки полной готовности FormAttribute и формы не изменены.


2026-10-06: добавлена позиция элемента `{collectionPosition: true}` для
декларативных привязок входов. Она сохраняется через передачу контекста,
а вложенный список получает собственную позицию. Подстановка входа
родителя сохраняет его исходную область, без дополнительного поля данных
и без отдельного обработчика форм. Матрица проверяет обычный список,
вложенные списки, сброс позиции у соседних родителей, XML-проекцию для
подготовки фактов, экспорт нового YAML и восстановление аномального XML.

Файловое подключение вложенных колонок пока не завершено: позиция обеспечивает
только общий контекст. Следом требуется передать тот же выбор уникального
имени/позиции родителя и проверить текущие/основные колонки вместе из полного
файла, включая все дополнительные группы. Затем — исторические и фиксированные
ID и публичный маршрут. Флажки полной готовности объектов не изменяются.
Сохранение вложенного XML через общий проверенный raw не считается доказательством
минимальной области аномалии или полноценного смыслового индекса.


2026-10-06: файловый источник текущих колонок подключён через
`form-column-file-sources.yaml`. Индекс `metadata.form-attribute-address-modes`
сохраняет выбор уникального имени или позиции отдельно для текущей формы
и основы. Вложенная привязка получает этот выбор вместе с позицией реквизита;
она не придумывает собственный адрес родителя.

Проверены неизменённый mixedColumns.xml внутри полного файлового контейнера,
обычные и дополнительные колонки, экранирование точки, пустые и повторяющиеся
имена родителей. XML и сохранённая YAML-проекция дают одинаковые индексы;
источник колонок можно указать первым — зависимости определяют порядок работы.
Используются три файловые проекции, без отдельной загрузки на каждый реквизит.
Единственный разбор XML не заявляется. Отсутствие коллекции разрешается
только её явным договором; неверный корень и повтор контейнера остаются ошибками
подготовки индекса. Общая проекция рекурсивно оставляет объявленные поля,
обычное преобразование с сохранением аномалий не заменяется этой проекцией.

Следующий шаг — выбор текущих/основных колонок, резервирование перекрытых ID,
пустые/повторяющиеся имена дополнительных групп; далее исторические и
фиксированные ID и публичный маршрут. Полная форма и FormAttribute ещё
не приняты, флажки остаются пустыми.


2026-10-06: текущие и основные колонки теперь подключены четырьмя файловыми
проекциями. Общая декларация данных строк используется обычным источником
и отдельными декларативными профилями приоритета; дополнительного обработчика
колонок в Rust нет. Текущие колонки публикуют собственный индекс наличия,
основные читают его: совпавший адрес сохраняет текущий ID, а ID основы остаётся
занят. Колонка только основы сохраняет свой ID. Отдельный индекс колонок
предотвращает круговую зависимость с подготовкой видов адресов реквизитов.

Матрица проверяет XML и YAML-проекции, оба порядка источников, настоящие
mixedColumns, именованные и позиционные родители и дополнительную группу
у родителя без имени. В усиленном примере заняты номера 1–8, перекрытый ID
основы равен 9: новый реквизит получает 10. Это непосредственно проверяет,
что перекрытый ID не освобождается. Число загрузок — четыре на полный файл,
а не число реквизитов; единственный разбор XML пока не заявляется.

Это приёмка выбора существующих ID и резервирования. Новые колонки без ID,
порядок выделения свежих номеров по дереву, пустые/повторяющиеся названия
дополнительных групп, исторические и фиксированные ID и публичный маршрут
остаются следующими задачами. Полная форма и FormAttribute не принимаются;
флажки полной готовности не меняются.


2026-10-06: добавлен общий файловый источник дерева реквизитов и колонок
`form-attribute-tree-sources.yaml`. Две предварительные проекции определяют
вид адресов родителей; два источника дерева затем собирают реквизит, его
обычные и дополнительные колонки, следующий реквизит. Смысловая запись
общая, вклад в индекс находится во фрагменте, а элемент коллекции использует
его через составную декларацию. Ограничения языка не ослаблены, Rust-компилятор
для этого блока не менялся.

Матрица проверяет новые строки без ID: реквизит A получает 1, его колонки 2
и 3, реквизит B получает 4, его колонка 5. Основа сохраняет существующие ID,
включая занятие перекрытых значений; новые строки только основы получают
1 000 001, 1 000 002 и 1 000 003 в том же порядке дерева. Проверены оба
направления подготовки, оба порядка источников, неизменённый mixedColumns.xml,
именованные и позиционные родители. Ожидания записаны независимо от генератора.
Число загрузок остаётся четыре на файл; единственный разбор не заявляется.

Полная форма и FormAttribute ещё не приняты. Остаются позиционные адреса
пустых/повторяющихся дополнительных групп, исторические ID вне живых строк,
фиксированные ID и публичный маршрут преобразования. Флажки не меняются.


Уточнение того же блока: дополнительные группы с пустым `table` получают
позиционные адреса `[0]`, `[1]` и т. д. через общий `collectionPosition`.
Сначала расширенная матрица падала с `identity.address`: прежнее выражение
пыталось создать пустой именованный сегмент. После изменения только YAML
проходят две пустые группы текущей формы, совпавшие позиции основы с другими
ID и третья группа только основы. Проверка выполняется в обоих направлениях
и при обратном порядке источников. Непустые повторяющиеся `table` пока не
приняты: для них необходимо учитывать все соседние группы, а не только
собственное имя. Остальные границы полной приёмки формы остаются прежними.


Проверки блока: полный набор 39 договоров вкладов прошёл; затем прошла
усиленная матрица пустых групп. Clippy всех целей, архитектура Rust, проверка
новых дублей и полный `pnpm test` завершились успешно. Пропуски существующих
тестов и предупреждения о целевом времени 10 мс не изменялись; пороги и baseline
не ослаблены. Полная приёмка формы этим не подтверждается.


2026-10-06: для дополнительных групп введён декларативный выбор адреса
`form-additional-group-mode-sources.yaml`: уникальное непустое `table`
использует имя; пустое или повторяющееся — исходную позицию. Подсчёт соседних
имён выполняет существующий общий механизм `one` с подготовленной таблицей,
без повторного сканирования всех соседей для каждой строки. Ключ включает
компонент, владельца, текущую форму/основу и канонического родителя; одинаковое
имя в другом реквизите не считается дублем. В Rust нет проверки имени формы,
реквизита или группы.

Индекс вида адресов подготавливается после видов адресов реквизитов, затем
его потребляет общий источник дерева. Группы входят в запись родителя через
`compose`; ограничение на сериализуемые значения/фрагменты не ослаблено.
Промежуточный маршрут теперь имеет шесть файловых проекций вместо четырёх.
Это осознанная цена независимой подготовки, а не оптимизация производительности:
единственный разбор XML и окончательная скорость полного маршрута остаются
отдельными условиями приёмки. Число загрузок не зависит от числа реквизитов.

Расширена существующая матрица, без новых функций тестов: повторяющиеся D,
уникальный сосед G, независимый D другого реквизита, текущие/основные строки
с различными ID, новые строки основы, оба направления и обратный порядок
источников. Первоначальная проверка обнаружила отсутствующий позиционный
адрес. Также обнаружен общий дефект подготовки: явно разрешённое отсутствие
коллекции ошибочно считалось недоступным контейнером. Исправлена проверка
по декларативному договору; отсутствие обязательной коллекции и повтор
контейнера всё ещё делают индекс недоступным. Эта граница защищена отдельными
случаями в существующем общем тесте.

Полная форма и FormAttribute ещё не приняты: остаются исторические ID вне
живых строк, фиксированные ID и публичный маршрут. Флажки не меняются.


Дополнительно проверено резервирование истории формы существующим
`metadata.form-id-reservations`: старый XML и сохранённый снимок занятости
включаются в общий порядок подготовки. Удалённый реквизит, его колонка и
непрозрачные узлы занимают номера 1–8; новый реквизит получает 9, его колонка
10. Исторические имена не публикуются как живые записи. Номер команды 9,
параметра 10 и элемента 11 не занимают пространство реквизитов; история
другого владельца не мешает номерам 1 и 2. Проверены оба порядка источников,
XML и восстановление сохранённого снимка для YAML. Дополнительная загрузка
истории обоснована отдельным сохранённым источником; шесть живых проекций
не превратились в единственный разбор.

Это приёмка участия сохранённой истории в подготовке чисел, а не завершение
автоматического сохранения/загрузки истории проекта или публичной формы.
Минимальный поставщик пространства элементов в тестовом каталоге служит
только для связывания настоящего договора четырёх пространств номеров;
полнота правил элементов этим не заявляется. Следующие границы: рабочее
хранилище истории, фиксированные ID и публичное преобразование формы.
Флажки полной готовности не меняются.


Итоговые проверки: 39 договоров вкладов прошли после исправления общего
механизма отсутствия; усиленная матрица сохранённой истории также прошла.
Clippy всех целей, архитектурные ограничения Rust, проверка новых дублей,
форматирование и полный `pnpm test` завершились успешно. Существующие
пропуски и предупреждения о целевом времени не изменялись.

Уточнение границ следующего блока: фиксированный ID `-1` старый код задаёт
автоматической командной панели в пространстве элементов. Его значение уже
описано в `form-element-identities.generated.yaml`; это не недостающий
обработчик реквизитов. Проверку его полной сборки относим к элементам/форме,
а не используем как искусственную зависимость отдельной приёмки реквизитов.
Рабочее сохранение истории проекта и публичное преобразование ещё открыты.


2026-10-06: сохранение истории и шести источников дерева проверено рабочим
маршрутом `nkdk::project`, без нового хранилища. Общий маршрут уже умел
сохранять и загружать снимки занятости: прежнее описание «нужно реализовать
сохранение» было слишком широким. Расширена существующая интеграционная
матрица настоящими источниками видов адресов и дерева реквизитов/колонок.
На неизменённом CommonForms/CommandBar/Ext/Form.xml проверены захват семи
снимков, сохранение, удаление исходных ресурсов, повторное открытие и привязка
числовых индексов к переименованному владельцу. Старые ключи владельца не
публикуются. Через тот же каталог проходят импорт и экспорт проекта, а новый
владелец получает пустые источники по явным шаблонам.

Это рабочая проверка подготовки/хранения источников с уже принятым простым
владельцем; публичная декларация всей формы здесь не подменяется простым
владельцем. Следующая граница — чтение живого YAML формы, согласование его
именованных коллекций с источниками и полная сборка свойств. Флажки формы,
реквизита и подсказки остаются пустыми. Утверждение о единственном разборе XML
или выполнении цели 10× не делается.

Все 48 договоров подготовки индексов приложения прошли (39,26 с).
Первая пересборка общего каталога заняла 9 мин 22 с; измерить окончательный
пик памяти этим запуском не удалось: `/usr/bin/time -l` получил отказ sandbox
на `sysctl` после успешного теста. Отдельные наблюдения rustc были около
3,2 ГиБ и 0,9 ГиБ, это не итоговый максимум. Обычный повторный запуск набора
завершился с кодом 0. Скорость полной сборки ещё не соответствует желаемому
результату «несколько минут» и не отмечается как исправленная.


2026-10-06: исправлена подготовка вложенных источников индексов из полного YAML
по структуре декларации. Проверены списки, именованные рекурсивные коллекции,
повторы и пометки аномалий. Это общий механизм, а не полная приёмка FormAttribute
или формы; флажки объектов остаются без изменений.


2026-10-07: [общий заголовок реквизита формы и колонки](../reports/2026-10-07-form-attribute-titles.md) автоматически переносится в один YAML-фрагмент. Шесть проверок, включая два неизменённых XML-поддерева, прошли узкую Rust-проверку и Clippy. Это договор свойства; флажки полной приёмки объектов не изменены. Следующий блок — имя/id и полная сборка колонки.


2026-10-07: полная строка колонки (8 свойств FormAttributeColumnRules) проверена
в Rust на двух неизменных Column и шести случаях восстановления идентичности.
Восстановление id — выражение YAML-профиля, без частного обработчика в Rust.
Обёртка коллекции проверочная; FormAttribute и полная форма ещё не приняты,
флажки объектов не изменены.


2026-10-07, продолжение: массовый переносчик выпускает общую декларацию строки
колонки, сохраняя блокировки обоих владельцев. В Rust дополнительно проверены
настоящая группа дополнительных колонок и целый Columns из mixedColumns.xml
с обычными и дополнительными колонками вместе. Это проверка части владельца,
а не всего formAttribute; его флажок остаётся снятым.


2026-10-07, живые запросы: проверена обычная публичная структура YAML формы
для обоих видов колонок, сохранение прежних номеров и назначение новых
с учётом резервов. Пустые/повторяющиеся имена таблиц восстановлены в проверочном
каталоге. Маршруты основной команды и полный formAttribute ещё не приняты;
флажки полного объекта остаются снятыми.


2026-10-07: публичный YAML колонок и индекс порядка групп проверены вместе,
включая сохранённую аномалию повторной таблицы (19 случаев). Флажки объектов
не изменены: файловый маршрут, история, номера реквизитов и полный FormAttribute
пока не прошли совместную приёмку.


2026-10-07: совместные запросы номеров реквизитов и колонок проверены
в 27 случаях; id реквизита подключён к массовой генерации проверяемым профилем.
Это приёмка ограниченной нумерации и связи id, флажки полного объекта не меняются.
Далее: общий режим адресации повторных реквизитов для живого YAML, полный
FormAttribute (включая шесть Settings), файловый маршрут и история.


2026-10-07: источник режима адресации повторных реквизитов подключён к
публичным запросам номеров и дополнительным группам; проверены обе позиции
и одинаковые таблицы в разных реквизитах (31 случай). Флажки не меняются.
Далее — шесть Settings, полный FormAttribute и файловая история. Отдельная
задача проверочного корпуса: восстановить поставщик metadata.forms для
старой группы document-journal.json; она уже была неполной до этого изменения.


### 2026-10-07: восстановлен проверочный блок документа и журнала

Поставщик `metadata.forms` теперь читает реальные строки сохранённого
`metadata-root-index-inventory.json` с проверкой хешей неизменных XML-файлов.
Общая декларация поставщика вынесена в `probes/metadata-form-index.yaml`;
прежняя копия в `metadata-ref-cases.mjs` удалена. В индекс корней включены
четыре семейства регистров, на которые ссылаются движения документа.

Обнаружено и исправлено ошибочное подключение формы выбора: параметр `owner`
у `common.document-choice-form` означает имя документа без `Document.`.
Автоматический перенос привязывает его к `containingOwnerName`, а общий
`owner` остальных ссылок сохраняет полный путь. Проверка подключения сначала
падала, затем прошла. Компилятор и общий Rust runtime не изменялись.

Группа document-journal теперь проверяет 57 свойств (45 документа и 12 журнала)
на четырёх прежних e2e-примерах. Значение 48 в старом файле группы устарело
после расширения проекций; критерий обновлён по фактическому списку полей,
без удаления каких-либо полей. Для пустого Characteristics обновлено только
ранее согласованное независимое ожидание сохранения `!xml/raw`; само XML
не изменено и общая проверка равенства YAML не ослаблена.

Проверены оба направления и round-trip без XML-референса: 4/4,
ограниченная сборка 11,90 с, Clippy 9,15 с. Это проекции Properties,
не полная приёмка документа/журнала или формы; флажки не меняются.
59 проверок переносчика, Rust-архитектура и проверка дублей прошли.
После последних изменений повторный полный `pnpm test` завершился
с кодом 0; прошли все 241 проверки переносчика. Повторная проверка
31 сценария колонок и Clippy прошли; новых дублей нет.


2026-10-07: перенос одинаковых скалярных defaults расширен на явно заданный
равный `defaultValueXML`. Общий переносчик проверяет равенство всех трёх
значений; разные defaults остаются заблокированными. Декларативные договоры
присутствия XML не меняются: отсутствие элемента и явное false различаются
общим механизмом аномалий. Обычный false сокращается, true остаётся в YAML.

Это автоматически разблокировало DynamicList.customQuery и
PredefinedItem.isFolder: 4837 распознанных свойств, 1039 блокировок
(было 4835/1041). Никаких частных обработчиков Rust не добавлено.
15 сценариев scalar-fallbacks прошли на Rust, включая minimal.xml и
customQuery.xml динамического списка и отсутствие ManualQuery. Ожидание
аномалии отсутствующего узла использует существующую XML-границу
`ManualQuery: !xml/raw` с `$xml: null`; YAML-свойство без значения не создаётся.
241 проверка переносчика прошла, новых дублей нет. Флажки полной приёмки
DynamicList, FormAttribute и других владельцев не изменены.

Проверка этого блока завершена: повторный полный `pnpm test` — код 0;
241 проверка переносчика и 15 Rust-сценариев прошли; Rust-архитектура
и проверка новых дублей прошли. Журнал полного запуска:
`/tmp/nkdk-dynamic-default-full-test.log`.


2026-10-07: зависимость `DynamicListRules.keyFields` перенесена в
`common.dynamic-list-key-fields` и проверена шестью Rust-сценариями.
Пустая строка отличается от отсутствующего списка; порядок, повторы и
аномальные атрибуты сохраняются. Флажки полных владельцев не изменены.
[Результаты и оставшиеся ограничения](../reports/2026-10-07-form-attribute-settings.md).
Следом остаются остальные зависимости Settings и исправление обнаруженной
прежней ошибки диагностики пересекающихся путей в `generate_collection`.


2026-10-07: исправлена область условий вложенной записи и повторная проверка
владения XML-путями. Прошли 103 целевые проверки Rust; полная большая матрица
ещё проверяется. [Подробности](../reports/2026-10-07-record-condition-scope.md).
Флажки приёмки владельцев не изменены.


2026-10-07, уточнение: у FormattedI8nText снят флажок полной приёмки.
1536 сочетаний round-trip проходят, но пустая YAML-запись ошибочно принимается
валидатором; ожидание ошибки сохранено. Это не частичный флажок и не отмена
исторического отчёта — текущая приёмка требует устранить выявленное расхождение.
[Диагностика](../reports/2026-10-07-record-condition-scope.md).

2026-10-07: флажок FormattedI8nText возвращён. Исправление ограничения
пустого текста подтверждено 9 focused-сценариями и полным generate_collection
(включая 1536 сочетаний и Clippy). Историческая заметка о снятии флажка
выше описывает уже устранённую регрессию.


2026-10-07: подключено DynamicListRules.order через таблицу исходных имён
`profiles/common-aliases.json`: Order ссылается на существующую common.dcs-order.
Декларация и Rust-обработчики не копируются; маршруты, входы и контроль
неизвестных параметров проходят прежний общий путь. Проверка соответствия
сначала воспроизвела отсутствие подключения, после изменения прошла.
Семейство dynamic-list-settings расширено полным order из неизменённого
full.xml и отсутствующим order: всего 8 сценариев прошло на Rust. Текстовое
представление использует согласованный !xml/string для xsi:type=xs:string;
это различие со старым TS-ожиданием закреплено в спецификации выбора вариантов.
Каталог: 4838 свойств-кандидатов, 1038 блокировок. Флажки полного DynamicList
и FormAttribute не меняются: остаются остальные зависимости Settings.


2026-10-07: добавлен узкий запуск всей коллекции Settings.parameters и
повторов. Проверка выявила потерю смысловых строк и неверную квалификацию
обычного текста как QName; приёмка остаётся незавершённой, флажки не менялись.
Подробности: docs/superpowers/reports/2026-10-07-settings-parameters-whole.md.
Следующий шаг — исправление общей проекции выбора, затем повторная проверка
коллекции. Это не повод создавать обработчик DCSParameter в Rust.


2026-10-07: исправлено выделение XML-фрагментов в общем ядре и коллекциях.
Флажки Settings/DynamicList/FormAttribute остаются снятыми: приёмка parameters
пока выявляет ошибочные raw-пометки при смешении текста и QName.

2026-10-09: [граница DynamicList](../reports/2026-10-09-dynamic-list-owner-boundary.md)
проверена на 13 сценариях: пять булевых свойств вместе, QName владельца,
порядок и аномалии. Флажок полного DynamicList остаётся снятым: основная
таблица и текст запроса во внешнем файле ещё не приняты. Итоговые флажки
common и вложенных объектов этим блоком не меняются.

2026-10-09: [составные ссылки на основную таблицу](../reports/2026-10-09-data-table-text-sequences.md)
подключаются из rules.ts автоматически. Табличные части, вложенные объекты,
виртуальные таблицы и неверные ссылки с читаемым соседом проверены в общей
матрице DynamicList. Проверка существования цели по проектным индексам и
полный внешний запрос ещё не приняты; флажки прежние, common56/90.

2026-10-09: currentUserSettingsKey переносится автоматически в YAML без
XML-маршрута. Значение, отсутствие и пустая строка проверены вместе с булевым
соседом; runtimeOnly settingsComposer явно учтён как исключение сериализации.
Флажок полного DynamicList снят до внешнего QueryText и полной приёмки;
common56/90. [План](2026-10-09-dynamic-list-yaml-only.md).


2026-10-09: файловое размещение QueryText автоматически переносится из
stringRule.externalFile. Два реальных запроса проверяются по неизменному
Form.xml и независимым .query; подготовлено37 сценариев DynamicList.
Основной YAML не содержит ключа QueryText, пустой файл сохраняется.
Флажок полного DynamicList остаётся снятым до сборки fields,
calculatedFields и parameters вместе с остальными свойствами.
Common56/90; эта возможность языка не добавляет отдельный common-объект.
[План](2026-10-09-external-text-fields.md).


2026-10-09: файловый договор QueryText принят: 37 сценариев DynamicList,
оба AOT-пути, реальные независимые запросы, пустые файлы, правка текста,
аномалии, бюджеты, архитектура, дубли и полный pnpm test прошли.
Обычный путь не получил дополнительного IO; две release-серии не подтвердили
устойчивого замедления. [Приёмка и границы](../reports/2026-10-09-external-text-fields.md).
Флажок полного DynamicList не изменён: остаётся общая сборка fields,
calculatedFields и parameters. Common56/90; правила ресурса/общая возможность
языка не учитываются как ещё один перенесённый объект.

2026-10-09: fields, calculatedFields и parameters подключены к общей
декларативной сборке вместе с ManualQuery и внешним QueryText. Пройдены
три нативных сценария: совместная работа, отсутствие коллекций и неверное
значение с сохранением соседей. Полный DynamicList остаётся без флажка:
не завершены остальные свойства и обязанности операции по адресам YAML.
Common56/90; [отчёт](../reports/2026-10-09-dynamic-list-collection-composition.md).

Общая проектная приёмка этого блока не завершена: pnpm test останавливается
на временных лимитах прежних TS-проверок rules. Функциональные проверки
коллекций Rust, отдельные unit и integration прошли; никаких общих
флажков завершённого перехода из-за этого не добавлено.

2026-10-09: устранено ограничение генератора проверочных примеров на
вложенные XML-пути. Это поддержка массового переноса и обновление отчётов,
а не приёмка нового common или полного владельца: флажки56/90 не изменены.

Заключительная приёмка коллекций DynamicList: полный pnpm test прошёл
с прежними лимитами, включая unit, native LMDB и integration rules.
Приёмка блока завершена; полный DynamicList по-прежнему без флажка.

2026-10-09: весь сохраняемый DynamicList (21 свойство) собран в одной
декларации и проверен3 нативными примерами, включая все ListSettings,
внешний запрос, аномалию и точное восстановление XML. Полный pnpm test
прошёл. Флажок полного DynamicList не поставлен: значение ещё должно
публиковаться как common и подключаться к владельцу с8 требованиями
адресации по YAML. Число принятых common56/90 не изменено.


2026-10-10: common.dynamic-list опубликован из всех21 сохраняемых свойств;
переносчик автоматически подключает FormAttributeRules.dynamicList и parentName.
Три реальных примера прошли свежую AOT-генерацию: полный, минимальный,
повреждённый сосед. Внешний QueryText передаётся через вложенные записи;
связанные группы остаются читаемыми, форма XML восстанавливается.
Целевые Rust-тесты, переносчик, публикация, Clippy, архитектура, дубли и
полный pnpm test прошли. Флажок всего DynamicList остаётся снятым:
восемь проектных требований адресации ещё не приняты. Common56/90 без изменений.
[План](2026-10-09-dynamic-list-common-publication.md),
[результат](../reports/2026-10-09-dynamic-list-common-publication.md).


2026-10-10: уточнён остаток DynamicList: служебные адреса распространяются
на всё поддерево, включая сокращённые записи и XML-next. Готовые Rust-адреса
переиспользуются; новый [договор](../specs/2026-10-10-nested-yaml-addressing-design.md)
ожидает согласования. Это не приёмка механизма и не изменение флажков56/90.


2026-10-10: добавлены19 проверок правок YAML на трёх реальных DynamicList:
каждая из восьми границ изменяется отдельно, строго проверяются остальные узлы
XML, внешние документы, UUID и повреждённый сосед. Общий запускатель сохраняет
число сценариев46; отдельные тестовые функции для свойств не размножены.
Нативные проверки, переносчик71, публикация, архитектура, дубли и полный pnpm test
прошли. Автоматическая передача адреса к потребителям снимков ещё впереди;
флажки56/90 остаются прежними. [Результат](../reports/2026-10-10-nested-yaml-addressing-edits.md).

2026-10-10: общий договор адресов усилен селектором фактического YAML-поля
при сборке и сохранением скрытого состояния во внутреннем снимке; обычная
и общая AOT-сборка проверены. Это ещё не приёмка полной операции DynamicList:
флажок остаётся снятым, число принятых common —56/90.

2026-10-10: свежая AOT-приёмка трёх DynamicList/19 правок и общий договор
восстановления снимков прошли, полный pnpm test и поиск дублей0 прошли.
Полная операция и замер полного экспорта остаются; флажки56/90 не изменены.
[Проверки и замеры](../reports/2026-10-10-nested-address-snapshots.md).

Уточнение2026-10-10: независимый полный YAML из e2e добавлен в договор
экспорта; полный импорт/экспорт замерены без заметной регрессии.
Остаток относится к полной операции и идентичности, а не отсутствию
эталона экспорта. Флажки56/90 сохраняются.

2026-10-10: снимки вложенного состояния дополнительно защищают сокращаемые
поля, одинаковые ключи, повторное открытие и правку соседа. Нейтральная новая
идентичность проверена через OperationIdentity; полная проектная операция
ещё не принята. Проверки зелёные, common56/90, флажки прежние.
[Результат и границы полной сборки](../reports/2026-10-10-nested-address-snapshots.md).

2026-10-10: обе коллекции колонок FormAttribute подключаются по параметрам
rules.ts к готовым декларациям;2 нативных сценария защищают независимый экспорт,
аномалию ID и правку типа. Полная сборка владельца ещё не принята, common56/90.
[Результат](../reports/2026-10-10-nested-address-snapshots.md).
