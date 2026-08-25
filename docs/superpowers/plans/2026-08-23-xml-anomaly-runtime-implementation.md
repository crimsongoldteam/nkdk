# XML Anomaly Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить все прежние частные XML-аномалии единым механизмом `!xml/raw`, `!xml/invalid` и `!xml/important`, который сохраняет импортируемый XML, не пропускает аномальные данные в обычную валидацию и одинаково восстанавливает их при полной и частичной синхронизации.

**Architecture:** Нейтральный `XmlAnomalyRuntime` компилируется рядом с `RuleRegistrySet`, оборачивает существующие PropertyRule и ведёт аудит нормализованного XML-дерева. Импорт выполняется в три worker-прохода: черновой смысловой YAML, внутренняя таблица адресуемых вхождений и рабочий индекс; терпимый контрольный экспорт и минимальные raw-границы; окончательный индекс, общая валидация, `invalid`/`important` и единственная запись YAML. Raw является самодостаточным контейнером с проверяемым `$значение` и обязательной явной XML-поправкой `$xml`; пустых raw и генераторов нет. Полная и частичная синхронизация сначала экспортируют `$значение` обычным правилом, затем применяют `$xml`.

**Tech Stack:** TypeScript 7, Vitest, `js-yaml`, `saxes`, TypeBox, Piscina, LMDB/projectState, `@node-rs/xxhash`.

**Spec:** [2026-08-23-common-types-xml-anomaly-framework-design.md](../specs/2026-08-23-common-types-xml-anomaly-framework-design.md)

**Состояние реализации:** Tasks 1–18 выполнены. Импорт разделён на три
worker-прохода с двумя барьерами индекса; контрольный экспорт использует
потоковые хэши корней и строит полные XML-деревья только для несовпавших
заданий. Структурированные ошибки общей валидации превращаются в
`invalid`/`important` в третьем проходе. Прежний механизм XML-аномалий удалён
без слоя совместимости. Tasks 14–17 уточняют проверку смысловых тегов:
подтверждённая граница больше не проверяется повторно, а лишний тег определяется
только после последней применимой проверки. Task 18 завершает адресацию raw для
нескольких XML-документов одного YAML и удаляет `#attributes` из публичного
договора.

## Global Constraints

- Выполнять задачи по TDD: сначала падающий тест, затем минимальная реализация, затем переработка без изменения поведения.
- Не изменять существующие XML-фикстуры: они являются источником истины. Для дополнительных форм XML создавать строки непосредственно в тестах или добавлять только новые фикстуры.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей common-типов. В отдельном реестре `xmlAnomalies` оставлять только явно согласованные классы important; raw-генераторы запрещены.
- Не добавлять в нейтральные слои условия по `itemType`, XML-корням и папкам проекта. Конкретные регистрации принадлежат `packages/rules/metadata/**`.
- Не поддерживать прежние `!xml/present`, `!xml/absent`, `!xml/name`, `!xml/type`, `!xml/value`, `!xml/reference`, `!xml/language` и `!xml/duplicate`: после окончательного переключения они являются синтаксической ошибкой YAML.
- Не создавать мигратор старого YAML. Повторный импорт исходного XML является единственным переходом на новый формат.
- Разработчик явно разрешил обновить `.agents/architecture.md` после реализации. Обновлять его только в Task 13, когда фактическая архитектура уже подтверждена тестами и финальным устройством кода.
- После каждого законченного слоя запускать `pnpm duplicates -- --base c0cf08c81` и не принимать новые дубли без локального устранения.
- Для каждого коммита использовать навык `commit`; сообщения ниже задают ожидаемый смысл, но перед коммитом должны быть проверены по фактическому diff.

---

## Task 1: Ввести единую таблицу YAML-аннотаций

**Статус:** реализовано; целевой raw-контейнер и запрет корневого/пустого raw покрыты Task 9.

**Files:**

- Create: `packages/runtime/yaml/xmlAnomalyAnnotations.ts`
- Create: `packages/runtime/yaml/xmlAnomalyAnnotations.test.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/parseMetadataYaml.ts`
- Modify: `packages/runtime/yaml/parseMetadataYaml.test.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/export.test.ts`
- Modify: `packages/runtime/index.ts`

- [ ] **Step 1: Зафиксировать договор аннотаций падающими тестами**

  Покрыть значения любого YAML-вида, корень документа и ключи именованных коллекций:

  ```yaml
  Флаг: !xml/invalid true
  Объект: !xml/raw
    $значение: 42
    $xml:
      _future: x
      "#text": "42"
  !xml/invalid Код: { Тип: Строка }
  !xml/invalid/2 Код: { Тип: Число }
  ```

  Проверить, что смысловые данные не содержат объектов-обёрток, оба ключа `Код` не теряются, а парсер возвращает отдельную таблицу аннотаций. Проверить ошибки `/1`, первого `/2`, пропуска номера, raw на ключе и raw на корне объекта метаданных. Последние два случая обязаны завершаться ошибкой договора. Проверку important-регистрации выполняет Task 11, а окончательный отказ от прежних `!xml/*` — атомарное переключение Task 12.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/xmlAnomalyAnnotations.test.ts yaml/jsYamlParser.test.ts yaml/parseMetadataYaml.test.ts yaml/export.test.ts`

  Expected: тесты падают, потому что `ParsedYaml` не содержит `annotations`, контейнерные теги не поддерживаются, а повторные логические ключи схлопываются.

- [ ] **Step 3: Реализовать нейтральную модель аннотаций**

  Основной публичный договор:

  ```ts
  export type XmlAnomalyKind = "raw" | "invalid" | "important"

  export interface XmlAnomalyAnnotation {
    readonly kind: XmlAnomalyKind
    readonly occurrence: number
    readonly target: "root" | "value" | "key"
    readonly logicalKey?: string
    readonly xml?: XmlPatchValue
    readonly hasSemanticValue?: boolean
  }

  export interface XmlAnomalyAnnotations {
    root(): XmlAnomalyAnnotation | undefined
    at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined
    keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined
    entries(): Iterable<XmlAnomalyAnnotationEntry>
    copy(source: object, target: object): void
  }
  ```

  Для raw парсер проверяет контейнер, помещает `$значение` в смысловые данные, а `$xml` и признак наличия смыслового значения — в аннотацию. Если `$значение` отсутствует, ключ всё равно остаётся адресуемым со значением `undefined`. Сериализатор выполняет обратное преобразование. Для повторных ключей до `js-yaml.load` заменять каждый тегированный ключ внутренним уникальным ключом. В таблице хранить его логическое имя и номер; наружу предоставить `xmlAnnotatedMappingEntries`, возвращающий логические ключи в исходном порядке.

- [ ] **Step 4: Протащить таблицу через разбор и сериализацию**

  Добавить `annotations` в `ParsedYaml`, `ParsedYamlData` и `SerializedYAMLDocument`. Сделать второй параметр `serializeYAMLDocument(source, annotations?)` необязательным, чтобы обычные вызовы не менялись. До атомарного переключения Task 12 прежние XML-теги продолжают читать существующие функции; новый код их не создаёт и не преобразует. Property-state теги `!проверять` и `!изменять` оставить отдельным механизмом.

- [ ] **Step 5: Проверить точный повторный разбор**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/xmlAnomalyAnnotations.test.ts yaml/jsYamlParser.test.ts yaml/parseMetadataYaml.test.ts yaml/export.test.ts`

  Expected: PASS; `parse -> serialize -> parse` сохраняет вид, номера и порядок всех новых аннотаций.

- [ ] **Step 6: Проверить слой и зафиксировать его**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить таблицу XML-аннотаций YAML`

---

## Task 2: Разбирать XML без потери структуры

**Статус:** реализовано и соответствует спецификации.

**Files:**

- Create: `packages/runtime/xml/import/document.ts`
- Create: `packages/runtime/xml/import/document.test.ts`
- Create: `packages/runtime/xml/structure/hash.ts`
- Create: `packages/runtime/xml/structure/hash.test.ts`
- Modify: `packages/runtime/xml/import/contracts.ts`
- Modify: `packages/runtime/xml/import/saxesParser.ts`
- Create: `packages/runtime/xml/import/saxesParser.test.ts`
- Modify: `packages/runtime/xml/import/importer.ts`
- Modify: `packages/runtime/index.ts`

- [ ] **Step 1: Описать структурный документ тестами**

  Проверить отдельные узлы для повторов, порядок атрибутов и детей, пустой элемент, `xsi:nil`, текст, CDATA, alias/canonical одновременно, координаты исходника и стабильный хэш:

  ```xml
  <Root b="2" a="1"><Value/><Value>2</Value><Future x="y"/></Root>
  ```

  Совместимое объектное представление должно остаться прежним для существующих обработчиков, но каждый `Value` обязан иметь отдельный `nodeId` и путь с номером вхождения.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/import/document.test.ts xml/import/saxesParser.test.ts xml/structure/hash.test.ts`

  Expected: тесты падают, потому что текущий парсер хранит только свёрнутый объект и теряет идентичность повторных узлов.

- [ ] **Step 3: Добавить новый результат парсера**

  Реализовать договор:

  ```ts
  export interface XmlDocument {
    readonly roots: readonly XmlElementNode[]
    readonly compatibility: Readonly<Record<string, unknown>>
    readonly sourceLength: number
  }

  export interface XmlElementNode {
    readonly id: number
    readonly name: string
    readonly occurrence: number
    readonly attributes: readonly XmlAttributeNode[]
    readonly content: readonly XmlContentNode[]
    readonly span: { readonly start: number; readonly end: number }
    readonly structuralHash: bigint
  }
  ```

  `parseXmlDocumentWithSaxes` строит оба представления за один SAX-проход. Существующий `parseXmlWithSaxes` делегирует ему и возвращает только `compatibility`, поэтому 92 обработчика не переписываются.

- [ ] **Step 4: Вычислять хэш без XML-сериализации**

  Хэшировать имя, упорядоченные атрибуты, тип и содержимое каждого дочернего узла через `xxh3`. Не включать номера `nodeId` и координаты, чтобы одинаковые структуры имели одинаковый хэш.

- [ ] **Step 5: Проверить совместимость и новый договор**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/import/document.test.ts xml/import/saxesParser.test.ts xml/structure/hash.test.ts`

  Expected: PASS; все прежние тесты `parseXmlWithSaxes` остаются зелёными.

- [ ] **Step 6: Проверить слой и зафиксировать его**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ сохранить структурное XML-дерево при импорте`

---

## Task 3: Добавить общий raw-кодек и защищённое объединение XML

**Статус:** реализовано; кодек, сравнение и объединение используют рекурсивную `$xml`-поправку из Task 9.

**Files:**

- Create: `packages/runtime/xml/structure/rawCodec.ts`
- Create: `packages/runtime/xml/structure/rawCodec.test.ts`
- Create: `packages/runtime/xml/structure/merge.ts`
- Create: `packages/runtime/xml/structure/merge.test.ts`
- Create: `packages/runtime/xml/structure/compare.ts`
- Create: `packages/runtime/xml/structure/compare.test.ts`
- Modify: `packages/runtime/xml/export/exporter.ts`
- Modify: `packages/runtime/index.ts`

- [ ] **Step 1: Зафиксировать полный raw-договор тестами**

  Покрыть обязательный контейнер `{ $значение?, $xml }`, `$xml: null`,
  рекурсивные добавление/замену/удаление, `_`-атрибуты, `#text`, `#name`,
  `#order`, массив повторных детей, полный путь `Properties\\Future`, селектор
  дополнительного документа `@Form\\Future` и корневой селектор `@`.
  Проверить отказ для `#attributes`, отдельного пути `Properties\\#order`,
  пустого raw, отсутствующего
  `$xml`, неизвестного `$...`-поля, XML-декларации/DOCTYPE, повторной записи
  пути, неверного порядка и перекрывающихся raw-границ. Окончательная миграция
  существующей реализации на этот договор выполняется в Task 18.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/rawCodec.test.ts xml/structure/merge.test.ts xml/structure/compare.test.ts`

  Expected: тесты падают, потому что общих функций raw-декодирования, сравнения и слияния ещё нет.

- [ ] **Step 3: Реализовать нормализованный фрагмент**

  ```ts
  export type XmlPatchValue =
    | string
    | null
    | readonly XmlPatchValue[]
    | Readonly<Record<string, XmlPatchValue>>

  export interface XmlRawEnvelope {
    readonly semanticValue?: unknown
    readonly xml: XmlPatchValue
  }
  ```

  `decodeXmlRawEnvelope` отделяет `$значение` от `$xml`. При наличии `$значение` XML является поправкой к обычному экспорту; без него — полным деревом границы. `null` в корне `$xml` удаляет всю границу, во вложенном mapping — соответствующую XML-часть. YAML number и boolean внутри `$xml` запрещены. Не принимать raw на ключе и не поддерживать генератор без явного `$xml`.

- [ ] **Step 4: Реализовать структурное сравнение и слияние**

  Сравнение возвращает минимальную поправку `$xml`: отсутствующий ключ ничего не меняет, null удаляет, scalar/sequence заменяют, mapping применяется рекурсивно. Применение работает через журнал занятых путей и сначала проверяет все операции; частично изменённый XML при ошибке недопустим.

- [ ] **Step 5: Проверить кодек**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/rawCodec.test.ts xml/structure/merge.test.ts xml/structure/compare.test.ts xml/export/exporter.test.ts`

  Expected: PASS.

- [ ] **Step 6: Проверить слой и зафиксировать его**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить общий raw-кодек XML`

---

## Task 4: Скомпилировать `XmlAnomalyRuntime` рядом с rules

**Статус:** реализовано; отменённые `compactRaw` и `hiddenSingletonName` удалены в Task 9.

**Files:**

- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/contracts.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/registry.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/registry.test.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/runtime.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/runtime.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts`
- Create: `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/testSupport.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/ruleRegistrySet.ts`
- Create: `packages/runtime/metadata/ruleRuntime/ruleRegistrySet.test.ts`
- Modify: `packages/runtime/index.ts`

- [ ] **Step 1: Оставить только регистрацию important**

  Удалить `compactRaw` и `hiddenSingletonName` из contracts, registry и runtime вместе с тестами генераторов. Падающими тестами проверить обязательный important, конфликт двух регистраций одной границы и отсутствие concrete-условий внутри runtime. Raw и внешнее имя не требуют частной регистрации: они самодостаточно выражены `$xml` и `#name`.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/definition/composeMetadataRules.test.ts metadata/ruleRuntime/ruleRegistrySet.test.ts`

  Expected: тесты падают из-за отсутствия `xmlAnomalies` в definition и `RuleRegistrySet`.

- [ ] **Step 3: Реализовать отдельный вклад композиции**

  ```ts
  export type XmlAnomalyRegistration = XmlImportantRegistration

  export type XmlAnomalyBoundary =
    | { readonly propertyType: string }
    | { readonly itemType: string; readonly propertyKey: string }
  ```

  `MetadataRulesDefinition.xmlAnomalies` является массивом вкладов. Компилятор строит карты по типу свойства и паре `itemType/propertyKey`, проверяет неоднозначность при создании `RuleRegistrySet` и возвращает `registry.xmlAnomalies`. Не добавлять новые поля в PropertyRule.

- [ ] **Step 4: Проверить отсутствие скрытого восстановления raw**

  Тестом запретить `compactRaw`, пустой raw и обращение экспорта raw к source XML, reference snapshot либо специальному генератору. Всё восстановление обязано определяться `$значение` и `$xml`.

- [ ] **Step 5: Проверить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/definition/composeMetadataRules.test.ts metadata/ruleRuntime/ruleRegistrySet.test.ts`

  Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить реестр XML-аномалий`

---

## Task 5: Аудировать владение XML и изолировать сбой PropertyRule

**Статус:** реализовано и соответствует спецификации.

**Files:**

- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/attempt.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/attempt.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/xmlImportPlan.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/xmlImportPlan.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`
- Modify: `packages/runtime/metadata/projectDefinition/localIndexes.ts`
- Modify: `packages/runtime/metadata/configurationIndex/collector/writer.ts`
- Modify: `packages/runtime/metadata/configurationIndex/collector/writer.test.ts`

- [ ] **Step 1: Описать состояния узла и контрольную точку**

  Проверить состояния `unclaimed`, `claimed`, `ambiguous`, `duplicate`, `unknown`, а также откат записей configuration index, local facts, deferred и dependent collectors при исключении PropertyRule. Успешная единственная попытка должна добавлять только O(1) служебных записей.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts metadata/ruleRuntime/xmlAnomaly/attempt.test.ts metadata/ruleRuntime/property/xmlImportPlan.test.ts metadata/ruleRuntime/property/fromXMLToYAML.test.ts metadata/configurationIndex/collector/writer.test.ts`

  Expected: повторный singleton сейчас схлопывается, а исключение преобразователя прерывает всё задание после уже записанных побочных эффектов.

- [ ] **Step 3: Перевести `XMLImportPlan` на структурные узлы**

  План сопоставляет PropertyRule с `XmlElementNode`, но передаёт старому обработчику его `compatibilityValue`. Каждый фактически прочитанный узел заявляется в `XmlImportAuditSession`; отсутствие свойства продолжает обрабатываться через существующие default/implicit правила.

- [ ] **Step 4: Добавить транзакционные коллекторы**

  Добавить нейтральный журнал операций `beginAttempt/commit/rollback` к фабрикам коллекторов, а не к их публичным предметным методам. Для уже существующих буферов коллекций использовать тот же адаптер. Исключение PropertyRule создаёт raw-кандидат минимальной границы и не оставляет индексных фактов.

- [ ] **Step 5: Проверить alias, повторы и неизвестные узлы**

  Отдельными тестами зафиксировать canonical вместе с alias, два singleton, неизвестный ребёнок и неизвестный атрибут. Они должны остаться разными результатами аудита до классификации, а не общей ошибкой задания.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts metadata/ruleRuntime/xmlAnomaly/attempt.test.ts metadata/ruleRuntime/property/xmlImportPlan.test.ts metadata/ruleRuntime/property/fromXMLToYAML.test.ts metadata/configurationIndex/collector/writer.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(runtime): ♻️ сделать XML-import свойств транзакционным`

---

## Task 6: Сохранять повторы именованных коллекций и неизвестные XML-пути

**Статус:** реализована основа; повторы и XML-пути работают, окончательные
селекторы документов и отказ от `#attributes` выполняются в Task 18, а invalid
назначается поздней валидацией.

**Files:**

- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.ts`
- Create: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataCollection/fromXMLToYAML.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataItem/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataItem/fromYAMLToXML.test.ts`

- [ ] **Step 1: Зафиксировать проекцию дублей**

  Для трёх реквизитов с именем `Код` до валидации ожидать три внутренних вхождения с одним `logicalKey` и номерами `0`, `1`, `2`, без публичных тегов. Ни один item не должен попасть в `Object.fromEntries`. После структурной валидации и окончательной проекции ожидать обычный первый ключ, затем `!xml/invalid Код`, затем `!xml/invalid/2 Код`. Для двух одновременно невалидных имён `1Код` сохранять тот же адресный ряд: отдельный класс ошибки в ключ не кодируется.

- [ ] **Step 2: Зафиксировать неизвестные многоуровневые части**

  Проверить результат вида:

  ```yaml
  Properties\Future: !xml/raw
    $xml:
      _mode: x
      _extra: y
      "#text": "42"
  ```

  `Properties` не появляется отдельным смысловым свойством YAML. Иерархия относится только к XML-узлам. У служебного ключа нет `$значение`: обязательный `$xml` хранит всё дерево ближайшей неизвестной границы, включая её атрибуты, текст и детей.

- [ ] **Step 3: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts metadata/ruleRuntime/metadataCollection/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataCollection/fromYAMLToXML.test.ts metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataItem/fromYAMLToXML.test.ts`

  Expected: `Object.fromEntries` теряет повторы, а неизвестные пути не проецируются.

- [ ] **Step 4: Использовать общий адаптер отображений**

  До сворачивания коллекции передавать все элементы в `projectNamedXmlCollection` и сохранять внутреннюю последовательность `{ logicalKey, occurrence, value, source }`; на чтении окончательного YAML использовать `xmlAnnotatedMappingEntries`. Обычный ключ остаётся первым каноническим item, а номера относятся только к дублям. `projectNamedXmlCollection` не назначает invalid: решение и финальную проекцию выполняет структурный валидатор в Task 11. Не вводить `#order` там, где порядок уже задаётся порядком YAML mapping.

- [ ] **Step 5: Проецировать остаток аудита на ближайшего владельца**

  Строить полные пути из `XmlImportAuditSession`, проверять отсутствие пересечений с известными PropertyRule и добавлять raw в таблицу аннотаций значения. Если минимальная граница неустойчива, поднимать её до первого устойчивого object/collection; пересекающиеся raw блокируют импорт.

- [ ] **Step 6: Проверить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts metadata/ruleRuntime/metadataCollection/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataCollection/fromYAMLToXML.test.ts metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataItem/fromYAMLToXML.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ сохранять дубли и неизвестные XML-пути`

---

## Task 7: Встроить единое восстановление в полную и частичную синхронизацию

**Статус:** реализовано; полная и частичная синхронизация выполняют обычный экспорт `$значение` с последующим применением `$xml`.

**Files:**

- Create: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Create: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/project/prepareYamlFiles.ts`
- Modify: `packages/rules/metadata/project/prepareYamlFiles.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/types.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/prepareAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/writeAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

- [ ] **Step 1: Написать общие сценарии экспорта**

  Проверить, что invalid/important передают значение обычному `fromYAML/toXML`; raw с `$значение` сначала экспортирует его, затем рекурсивно применяет `$xml`; `$xml: null` подавляет обычный default; raw без `$значение` создаёт полное дерево; `$xml.#name` меняет внешнее имя. Пустой raw и отсутствующий `$xml` отклоняются. Один и тот же YAML должен дать структурно одинаковый XML в full и partial sync.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/fullSyncToXml/prepareAssignment.integration.test.ts metadata/fullSyncToXml/writeAssignment.integration.test.ts metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

  Expected: текущий экспорт знает только прежние частные теги и не умеет объединять общий raw.

- [ ] **Step 3: Сохранять аннотации подготовленного YAML**

  `PreparedYamlFile` хранит `ParsedYaml`, а не только `.data`, либо явно хранит пару `{ data, annotations }`. Не восстанавливать теги повторным поиском текста. Перед обычной сборкой задания runtime заменяет raw-контейнеры их `$значение`; границы без `$значение` исключаются из обычного экспорта. Invalid/important остаются обычными значениями.

- [ ] **Step 4: Применять raw после обычного экспорта**

  `PreparedXMLDocument` получает план XML-поправок. После завершения всех deferred XML `writeAssignment` рекурсивно применяет `$xml`: null удаляет, scalar/sequence заменяют, mapping изменяет только перечисленные части. Для raw без `$значение` `$xml` создаёт полную границу. Ошибка договора или коллизия блокирует запись всего задания.

- [ ] **Step 5: Подтвердить общий путь partial sync**

  Не добавлять отдельный raw-механизм в `partialSyncToXml`: он уже использует full-sync worker с output `memory`. Тест должен доказывать, что обе ветви проходят через `xmlAnomalyAssignment`.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/fullSyncToXml/prepareAssignment.integration.test.ts metadata/fullSyncToXml/writeAssignment.integration.test.ts metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(rules): ✨ унифицировать экспорт XML-аномалий`

---

## Task 8: Выполнять терпимый контрольный экспорт один раз на задание

**Статус:** реализовано. Первый проход сохраняет только потоковые хэши корней. Контрольный экспорт сначала сравнивается по таким же хэшам; полный адресный разбор, повторный импорт, аудит владения и повторное чтение источника выполняются только для несовпавшего задания. Подробные YAML и аннотации заменяют черновые вместе с аудитом, поэтому неизвестный XML не теряется. Родитель с независимо принадлежащими дочерними границами сравнивается по собственной оболочке и не поглощает дочернее различие.

**Files:**

- Create: `packages/rules/metadata/importFromXml/controlExport.ts`
- Create: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Create: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Create: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/types.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

- [ ] **Step 1: Зафиксировать доказательство обратимости**

  Проверить: точный boolean/string/number остаётся обычным YAML; `01`, неизвестный `xsi:type`, лишний ребёнок и default/presence mismatch локализуются в raw; понятное, но недопустимое значение пока остаётся смысловым кандидатом. Сбой экспорта одного свойства не должен скрывать независимых соседей. Счётчик обязан показать один обычный YAML → XML экспорт на задание независимо от числа PropertyRule.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/prepareYaml.integration.test.ts metadata/importFromXml/worker.integration.test.ts`

  Expected: контрольного экспорта и локализации различий нет.

- [ ] **Step 3: Сохранить аудит между проходами**

  В worker Map хранить смысловой YAML, таблицу аннотаций, потоковые хэши корней и пути исходных файлов. Не строить и не удерживать полное структурное дерево в первом проходе. Явную минимальную поправку `$xml` извлекать повторным чтением только соответствующего исходного XML-файла после несовпадения корневых хэшей.

- [ ] **Step 4: Выполнить обычный экспорт без исходного XML**

  Использовать тот же `prepareAssignment/writeAssignment` runtime в режиме доказательства в памяти, но отключить raw и reference snapshot. Сначала сериализовать результат в памяти и потоково вычислить хэши корней без полного дерева. Только при несовпадении построить адресное дерево и изолируемые границы, затем создать минимальную `$xml`-поправку. При понятном значении сохранить его как `$значение`; при полностью непонятной границе сохранить полное дерево без `$значение`. Поднимать границу по одному уровню, не поглощая независимо принадлежащие дочерние свойства и соседние аннотации.

- [ ] **Step 5: Ограничить попытки доказательства**

  Для каждой границы разрешить конечное число подъёмов, равное глубине её скомпилированного пути. Повторное несовпадение после выбора родителя является фатальной ошибкой runtime, а не новым циклом.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/anomalyProof.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/prepareYaml.integration.test.ts metadata/importFromXml/worker.integration.test.ts`

  Expected: PASS; счётчик контрольного экспорта равен числу успешных заданий.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(rules): ✨ доказать обратимость XML при импорте`

---

## Task 9: Перевести работающую основу на окончательный raw-договор

**Статус:** реализовано; окончательный raw-договор используется импортом и обеими синхронизациями, прежняя совместимость удалена.

**Files:**

- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.test.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/export.test.ts`
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/xml/structure/rawCodec.ts`
- Modify: `packages/runtime/xml/structure/rawCodec.test.ts`
- Modify: `packages/runtime/xml/structure/compare.ts`
- Modify: `packages/runtime/xml/structure/compare.test.ts`
- Modify: `packages/runtime/xml/structure/merge.ts`
- Modify: `packages/runtime/xml/structure/merge.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/contracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/registry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/registry.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/runtime.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/runtime.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

- [ ] **Step 1: Зафиксировать публичный YAML-договор**

  Падающими тестами покрыть raw со смысловым значением и без него:

  ```yaml
  Количество: !xml/raw
    $значение: 1
    $xml:
      "#text": "01"
  Properties\Future: !xml/raw
    $xml:
      _mode: new
      "#text": "42"
  ```

  После разбора `Количество` равно числу `1`, а аннотация хранит `$xml` и `hasSemanticValue: true`. Служебный XML-путь остаётся адресуемым со значением `undefined` и `hasSemanticValue: false`. Сериализация точно восстанавливает оба контейнера. Отдельно ожидать ошибку для пустого raw, raw без `$xml`, неизвестного `$...`-ключа, raw на ключе и raw на корне metadata item.

- [ ] **Step 2: Подтвердить падение договора**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/xmlAnomalyAnnotations.test.ts yaml/jsYamlParser.test.ts yaml/export.test.ts xml/structure/rawCodec.test.ts xml/structure/compare.test.ts xml/structure/merge.test.ts metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts`

  Expected: тесты падают, потому что аннотация не хранит `$xml`, raw-payload ещё заменяет смысловое значение, а runtime принимает `compactRaw` и `hiddenSingletonName`.

- [ ] **Step 3: Отделить смысловое значение от XML-поправки**

  Расширить `XmlAnomalyAnnotation` полями `xml?: XmlPatchValue` и `hasSemanticValue?: boolean`. Парсер помещает `$значение` в обычное YAML-дерево, а `$xml` — только в таблицу аннотаций. Сериализатор выполняет обратную проекцию. Удалить обработку `!xml/raw` как свободного scalar/mapping/sequence payload; остальные старые `!xml/*` до Task 12 не трогать.

- [ ] **Step 4: Перевести кодек на рекурсивную поправку**

  Ввести `decodeXmlRawEnvelope`, который проверяет только `{$значение?, $xml}`. При наличии `$значение` сравнение строит минимальную `$xml`-поправку к обычному экспорту; без `$значение` `$xml` кодирует полное дерево границы. Применение поправки сначала проверяет все операции, затем атомарно выполняет добавление, замену и удаление по правилам спецификации.

- [ ] **Step 5: Удалить скрытое восстановление XML**

  В `XmlAnomalyRegistration` оставить только `XmlImportantRegistration`. Удалить `XmlCompactRaw*`, `XmlHiddenSingletonNameRegistration`, `generateCompactRaw`, `allowsHiddenSingletonName`, кэш генераторов и их входы. Нестандартное внешнее имя singleton выражать только через `$xml."#name"`; пустой raw-генератор не заменять новым скрытым механизмом.

- [ ] **Step 6: Перевести проекцию и доказательство импорта**

  `projectXmlAuditRemainder` создаёт служебный ключ полного XML-пути и помещает полное дерево ближайшей неизвестной границы в `annotation.xml`, не в смысловое YAML-значение. `proveXmlAnomalyBoundaries` для понятной границы сохраняет смысл и минимальную поправку; для непонятной — полное XML-дерево без смысла. Корневой raw и пересечение с независимым PropertyRule остаются фатальными.

- [ ] **Step 7: Перевести полный и частичный экспорт**

  При `hasSemanticValue: true` передавать смысловое значение обычному fromYAML/toXML, а после экспорта применять `annotation.xml`. При `hasSemanticValue: false` не запускать PropertyRule для значения, но сохранять адрес и применять полный `$xml`. Одинаковую сборку документа использовать в full sync, partial sync и контрольном экспорте.

- [ ] **Step 8: Запустить переходный слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/xmlAnomalyAnnotations.test.ts yaml/jsYamlParser.test.ts yaml/export.test.ts xml/structure/rawCodec.test.ts xml/structure/compare.test.ts xml/structure/merge.test.ts metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/anomalyProof.test.ts metadata/importFromXml/controlExport.integration.test.ts metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

  Expected: PASS; в тестах и production-коде нет пустого raw, корневого raw, `compactRaw`, `hiddenSingletonName` и raw-payload без `$xml`.

- [ ] **Step 9: Проверить и зафиксировать переход**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(runtime): ♻️ перевести raw на явную XML-поправку`

---

## Task 10: Разделить import на три worker-прохода и два барьера индекса

**Статус:** реализовано. Первый проход строит рабочий индекс, второй доказывает
обратимость и публикует смысловой индекс, третий применяет решения валидатора и
единственный раз записывает YAML. Переходы защищены двумя барьерами projectState.

**Files:**

- Modify: `packages/rules/metadata/importFromXml/types.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/importSession.ts`
- Modify: `packages/rules/metadata/projectState/importSession.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/contracts/readToken.ts`

- [x] **Step 1: Зафиксировать автомат состояний**

  Ожидаемая последовательность:

  ```text
  firstPass -> commitWorkingIndex -> proofPass
  -> commitSemanticIndex -> validateImportedProject -> finalPass
  -> finalProofForChangedRaw -> finalize
  ```

  Проверить запрет раннего третьего прохода, поздних записей в предыдущую фазу, повторного барьера, потерянного задания и любого неразрешённого pending.

- [x] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts metadata/projectState/importSession.integration.test.ts`

  Expected: pool и import session имеют только два прохода и один общий индексный барьер.

- [x] **Step 3: Добавить нейтральный второй барьер projectState**

  `commitSemanticIndex()` ждёт записи второго прохода, фиксирует доказанные смысловые вклады и выдаёт read token. После него начинается отдельная final update для окончательных хэшей, локального состояния и файлов. ProjectState не знает про XML-теги: координатор передаёт ему только обычные вклады и получает структурированные результаты проверок.

- [x] **Step 4: Разделить обязанности worker**

  Первый проход импортирует черновой смысловой YAML, карту владения и публикует рабочие факты. До схлопывания mapping он сохраняет повторные ключи как внутренние адресуемые вхождения, а для отсутствующих ожидаемых свойств резервирует targets `missing`; публичных invalid/important ещё нет. Второй проход завершает deferred, выполняет терпимый контрольный экспорт, выбирает минимальные raw-границы и публикует окончательные смысловые факты без записи YAML. Третий принимает решения invalid/important общей валидации, проецирует таблицу в окончательные YAML-ключи и пустые значения, переносит наличие тегов в уже построенные отложенные ссылки и проверки, затем сериализует и пишет YAML ровно один раз. Локальная валидация и построение индексов в третьем проходе не повторяются; меняются только аннотации, признаки тегов в окончательном состоянии и хэш файла.

  Именованный item с raw внутри не исчезает из структурного индекса. Его ключ, вид и адрес публикуются как обычные факты; неизвестными считаются только данные под raw. Если raw поднят до всего значения item, запрещено строить внутренние факты из payload, но само наличие именованного item сохраняется.

- [x] **Step 5: Сделать отказ атомарным**

  Любая ошибка любой фазы вызывает существующий rollback candidate project state, удаление временного вывода и сброс worker state. Нельзя публиковать рабочий или смысловой промежуточный индекс как окончательное состояние.

- [x] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts metadata/projectState/importSession.integration.test.ts`

  Expected: PASS.

- [x] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(rules): ♻️ разделить XML-import на три прохода`

---

## Task 11: Классифицировать ошибки как invalid/important и изменить валидацию

**Статус:** реализовано. `ValidationIssue` сохраняет код, вид и адрес ошибки без
разбора текста сообщения; общий обход rules.ts и TypeBox формирует решения,
которые третий проход проецирует в `invalid`/`important`.

**Files:**

- Create: `packages/runtime/metadata/validation/validationIssue.ts`
- Create: `packages/runtime/metadata/validation/validationIssue.test.ts`
- Create: `packages/runtime/metadata/validation/xmlAnomalyBoundary.ts`
- Create: `packages/runtime/metadata/validation/xmlAnomalyBoundary.test.ts`
- Create: `packages/rules/metadata/importFromXml/classifyImportedIssues.ts`
- Create: `packages/rules/metadata/importFromXml/classifyImportedIssues.test.ts`
- Create: `packages/rules/metadata/validation/xmlAnomalyContract.ts`
- Create: `packages/rules/metadata/validation/xmlAnomalyContract.integration.test.ts`
- Create: `packages/rules/metadata/validation/metadataRuleValidator.ts`
- Create: `packages/rules/metadata/validation/metadataRuleValidator.test.ts`
- Modify: `packages/runtime/metadata/validation/validationSchema.ts`
- Modify: `packages/runtime/metadata/validation/typeboxValidationCompiler.ts`
- Modify: `packages/rules/metadata/validation/typeboxValidationCompiler.test.ts`
- Modify: `packages/runtime/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/metadata/importFromXml/serializedYamlValidation.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.ts`

- [x] **Step 1: Ввести внутреннюю структурированную ошибку**

  В `validationIssue.ts` определить `ValidationIssue` с `code`, `kind: "semantic" | "infrastructure"`, обязательным `target`, необязательными `relatedPaths` и структурированными `params`. Target является объединением обычного `path`, отсутствующего `missing` и конкретного `occurrence` повторного mapping-ключа. Падающими тестами зафиксировать, что классификация не меняется при замене текста сообщения. Публичный `Diagnostic` остаётся прежним и создаётся из issue только на внешней границе. Только semantic-ошибка импортированного значения может стать invalid/important; сбой валидатора, повреждённый индекс и unresolved pending остаются фатальными.

- [x] **Step 2: Ввести общий валидатор по rules.ts**

  На основе `metadataRuleYamlTraversal` добавить единый обход смыслового YAML по MetadataItemRule и PropertyRule. Он проверяет обязательные и неизвестные свойства, выбирает nested rule для объектов и коллекций и вызывает локальную TypeBox-проверку конкретного значения. Для скаляра проверяется всё значение; для объекта или коллекции локальная проверка не должна рекурсивно проверять детей — их состав и схемы обходит сам валидатор. Проверки PropertyRule компилировать один раз при сборке среды метаданных и переиспользовать между файлами. Не компилировать цельную изменённую схему для каждого файла или сочетания raw.

  Перед обработкой свойства читать `XmlAnomalyAnnotations`: raw с `$значение` проверять и обходить как обычное смысловое значение, полностью исключая только `$xml`; raw без `$значение` считать присутствующим, но не проверять предметно. Invalid/important внутри `$значение` проверять обычным правилом. Неизвестный путь под raw пропускать только при подтверждённом договоре XML-границы, обычный неизвестный ключ возвращать как структурированную ошибку.

  Падающими тестами проверить: boolean в `$значение` проверяется; `$xml` не проверяется; raw без `$значение` удовлетворяет required, но не создаёт предметных фактов; invalid внутри `$значение` подтверждается; соседнее свойство всё равно проверяется; TypeBox родителя не заходит в `$xml`; неизвестный обычный ключ ошибочен, а подтверждённая неизвестная raw-граница не проверяется; компиляции зависят от числа разных PropertyRule, а не от числа файлов и raw-значений.

- [x] **Step 3: Сохранить структурированные ошибки TypeBox**

  Для каждой локальной ошибки TypeBox без разбора `message` перенести `keyword` в код `schema.<keyword>`, путь свойства и локальный `instancePath` объединить в `target.path`, а `params` сохранить целиком. `required` связывать с заранее созданным target `missing`; `propertyNames` и `uniqueItems` разворачивать в отдельные адресуемые issue по сведениям `params`. Проверку `additionalProperties` выполняет структурный обход rules.ts, потому что только он различает обычный неизвестный ключ и подтверждённую raw-границу. `schemaPath` использовать только для внутренней привязки к правилу.

  Падающими тестами проверить `type`, `maxLength`, `enum`, отсутствующее свойство, неверное имя ключа, повторы массива и две независимые ошибки одного файла. Для `anyOf`/`oneOf` с дискриминатором ожидать ошибки только выбранной nested rule ветви. Отдельно доказать, что изменение `Locale` и текста `message` не меняет ни код, ни пути, ни параметры.

- [x] **Step 4: Зафиксировать подавление и необходимость тега**

  Проверить: ошибочное значение без тега даёт обычную ошибку; то же импортированное значение с invalid вычисляет ту же внутреннюю ошибку на точно совпавшем target, но не выводит её повторно; несколько semantic issue одного target требуют один тег, пока остаётся хотя бы одна из них; корректное значение с invalid/important даёт `xml/anomaly-tag-unnecessary`; неверный important даёт `xml/important-not-registered` или `xml/important-required`. Родительский тег не подавляет issue дочернего target. Межполевой валидатор обязан явно назначить target и relatedPaths. Raw с `$значение` участвует во всех этих проверках, raw без него пропускает только зависимые предметные проверки.

- [x] **Step 5: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/validation/validationIssue.test.ts metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/validation/metadataRuleValidator.test.ts metadata/validation/typeboxValidationCompiler.test.ts metadata/importFromXml/classifyImportedIssues.test.ts metadata/validation/projectStateDependencyValidation.test.ts`

  Expected: общего обхода rules.ts ещё нет, публичный `Diagnostic` теряет `keyword` и `params`, а остальные проверки выдают диагностики вместо классификационных решений.

- [x] **Step 6: Классифицировать после окончательного индекса**

  После `commitSemanticIndex()` координатор запускает те же правила валидации, что обычная проверка проекта, и группирует `ValidationIssue` по project path и явно назначенному target. TypeBox, resolver, проверки ссылок, уникальности, повторов и межполевые правила обязаны возвращать issue до форматирования текста. Структурный валидатор читает внутреннюю таблицу вхождений: target `occurrence` превращает первый дубль в `!xml/invalid`, следующие — в `/2`, `/3`; target `missing` превращается в пустой `!xml/invalid`, если доказательство экспорта не выбрало raw null. По умолчанию создаётся invalid; important выбирается только при точном совпадении с регистрацией. Common-импортёры не повторяют JSON Schema, resolver, отборы ссылок и межполевые ограничения. Решения передаются соответствующему worker третьего прохода.

- [x] **Step 7: Проверять договор самих тегов отдельно**

  `xmlAnomalyContract` проверяет место, контейнер, нумерацию, регистрацию important, восстановимость и необходимость. Для invalid/important тег временно снимается и запускается та же проверка значения. Raw обязан содержать `$xml`; `$значение`, если оно есть, проходит обычную проверку, а `$xml` — только форматную и экспортную. Завершающий экспорт изменённых границ обязан доказать, что без `$xml` различие остаётся, а после поправки XML структурно равен исходному. Пустой raw, неизвестное `$...`-поле и избыточная поправка дают ошибку договора.

- [x] **Step 8: Запустить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/validation/validationIssue.test.ts metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/validation/metadataRuleValidator.test.ts metadata/validation/typeboxValidationCompiler.test.ts metadata/importFromXml/classifyImportedIssues.test.ts metadata/validation/projectStateDependencyValidation.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/xmlAnomalyContract.integration.test.ts`

  Expected: PASS.

- [x] **Step 9: Проверить и зафиксировать**

  Run: `pnpm type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(rules): ✨ классифицировать импортированные XML-ошибки`

---

## Task 12: Перенести известные случаи и удалить прежний механизм

**Статус:** реализовано. Прежние XML-теги и реестры удалены из production-кода.
Отдельный `xmlAnomalies/register.ts` не создан: явно согласованных классов
`important` пока нет, поэтому пустой реестр не нужен.

**Files:**

- Create: `packages/rules/metadata/xmlAnomalies/register.ts`
- Create: `packages/rules/metadata/xmlAnomalies/register.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `packages/rules/metadata/forms/elements/table/explicitRowFilter.ts`
- Modify: `packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/explicitXMLDefaults.ts`
- Modify/Delete: каждый production-, support- и fixture-файл, возвращённый точной инвентаризационной командой Step 1; тесты из того же вывода обновляются в Step 5, а Step 6 машинно проверяет остаток вне тестов
- Delete: `packages/runtime/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Delete: `packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleExecutor.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/testSupport.ts`
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Delete: `packages/runtime/yaml/mappingKeyTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/index.ts`

- [x] **Step 1: Получить механический перечень прежнего механизма**

  Run: `rg -l 'xml/(present|absent|name|type|value|reference|language|duplicate)|explicitXMLPropert|brokenXMLReference|markYAMLMappingKeyTag|XML_ANOMALY_TAGS' packages/runtime packages/rules`

  Сохранить вывод в рабочей заметке задачи и распределить каждый production-файл: удалить ветвь, заменить общей регистрацией либо оставить обычным смысловым rules.ts. Не считать задачу законченной, пока повторный `rg` не показывает production-использований прежних тегов и реестров.

- [x] **Step 2: Переклассифицировать регрессионный корпус**

  На существующих XML-фикстурах проверить минимум: `HeaderHorizontalAlign=Auto`, `SystemEnumeration Switch`, RowFilter `xsi:nil`, I8nText с повторным языком, metadataItem с синтаксически корректной, но несуществующей целью, broken reference, explicit empty/default, нестандартное singleton-имя и повтор реквизитов.

- [x] **Step 3: Оставить только действительно частные решения**

  RowFilter, HeaderHorizontalAlign, контекстные коллекции и внешнее имя singleton получают явный `$xml` без регистраций `compactRaw` и `hiddenSingletonName`. В реестре остаются только случаи с явно согласованной ценностью `important`. Все остальные ошибки классифицируются общим runtime без специальных кодов.

- [x] **Step 4: Удалить прежние теги одним переключением**

  Удалить старые definition-поля, registry methods, emitters, validators и schema types. `scalarTags.ts` после переключения содержит property-state теги, но не прежние XML-теги; новые XML-аннотации обслуживаются только `xmlAnomalyAnnotations.ts`. Старый тег в YAML должен давать syntax error.

- [x] **Step 5: Обновить тесты, не меняя XML-фикстуры**

  Ожидания YAML заменить на raw/invalid/important. Тесты, проверявшие частный emitter, перенести на общий import/control-export/full-sync путь. Добавить отрицательный тест, что старые теги не читаются.

- [x] **Step 6: Проверить отсутствие старого production-кода**

  Run: `rg -n 'xml/(present|absent|name|type|value|reference|language|duplicate)|explicitXMLPropert|brokenXMLReference|markYAMLMappingKeyTag' packages/runtime packages/rules --glob '!**/*.test.ts' --glob '!**/*.md'`

  Expected: нет совпадений.

- [x] **Step 7: Запустить пакетные тесты**

  Run: `pnpm --filter @nkdk/runtime test`

  Run outside sandbox: `pnpm --filter @nkdk/rules test`

  Expected: PASS.

- [x] **Step 8: Проверить и зафиксировать атомарный переход**

  Run: `pnpm type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(rules): ♻️ заменить частные XML-аномалии общим runtime`

---

## Task 13: Проверить семейства common-типов, rules и производительность

**Статус:** реализовано и проверено на компактной базе `cf/doc`. Полный
round-trip отделяет восстанавливаемые XML-различия от уже известных
невалидных значений и неподдерживаемых внешних файлов; профиль подтверждает
ограниченную память worker и отсутствие прежнего неограниченного роста.

**Files:**

- Create: `packages/rules/metadata/xmlAnomalies/commonFamilies.integration.test.ts`
- Create: `packages/rules/metadata/xmlAnomalies/rulesMutation.integration.test.ts`
- Create: `packages/rules/metadata/xmlAnomalies/synchronization.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md` only to correct discrepancies discovered by implementation, without changing approved behavior

- [x] **Step 1: Сделать матрицу представителей 92 регистраций**

  Использовать семейства спецификации, а не 92 копии одинакового теста: scalar (bool/string/number/SE), composite (I8nText/type description), sequence, named map, nested rules.ts и infrastructure. Для каждого мутировать presence/default, текст, attribute, child, повтор, неизвестный путь, invalid context и сбой преобразователя.

- [x] **Step 2: Проверить общие инварианты**

  Для каждой мутации утверждать одно из трёх: обычный YAML точно восстанавливает XML; импорт выдаёт минимальный raw внутри распознанного объекта; импорт выдаёт обратимый invalid/important. Потеря XML, обычная диагностика внутри корректного тега и неразрешённый кандидат запрещены. Неизвестный XML-root, неизвестный metadata item type и попытка raw на всём объекте или файле должны давать явную фатальную ошибку.

- [x] **Step 3: Проверить rules.ts на нескольких уровнях**

  Покрыть неизвестные и повторные свойства у корня, внутри `Properties`, внутри nested common object и внутри именованной коллекции. Полный путь raw должен восстанавливаться одинаково независимо от глубины.

- [x] **Step 4: Проверить round-trip и обе синхронизации**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/xmlAnomalies/commonFamilies.integration.test.ts metadata/xmlAnomalies/rulesMutation.integration.test.ts metadata/xmlAnomalies/synchronization.integration.test.ts`

  Run: `env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh`

  Expected: тесты PASS; новые расхождения либо восстановлены тегами, либо являются перечисленными фатальными ограничениями первой версии.

- [x] **Step 5: Измерить стоимость импорта**

  Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-import-profile-doc-yaml --runs 1 --json`

  Проверить профильные счётчики: один контрольный экспорт на успешное задание; дополнительная проверка только изменённых raw-границ; повторный разбор XML только для файлов с `$xml`; отсутствие цикла по 1839 PropertyRule с отдельным round-trip.

  Фактический результат на `cf/doc`: 9937 успешно обработанных заданий,
  178,5 с, пиковый RSS 3253,7 МиБ и пиковая куча worker 699,5 МиБ.
  Предыдущий успешный вариант удерживал 4419,6 МиБ RSS, а вариант без
  ограничений и компактного первого прохода превышал 8 ГиБ.

- [x] **Step 6: Полная проверка перед завершением**

  Использовать `superpowers:verification-before-completion`.

  Run: `pnpm type-check`

  Run outside sandbox: `pnpm test`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Expected: все команды PASS; baseline dependency-cruiser не изменён.

- [x] **Step 7: Сверить спецификацию и обновить архитектурный документ**

  Исправить в спецификации только фактические названия интерфейсов или ограничения, если реализация вынужденно отличается. В `.agents/architecture.md` заменить описание прежних частных тегов и двухпроходного импорта фактическим устройством общего `XmlAnomalyRuntime`, трёх проходов, двух индексных барьеров и общего восстановления при full/partial sync. Не добавлять в архитектурный документ неподтверждённые будущие решения.

- [x] **Step 8: Зафиксировать окончательную проверку**

  Commit: `test(rules): ✅ проверить общий runtime XML-аномалий`

---

## Task 14: Возвращать состояние каждой смысловой XML-границы

**Files:**

- Modify: `packages/runtime/metadata/validation/xmlAnomalyBoundary.ts`
- Modify: `packages/runtime/metadata/validation/xmlAnomalyBoundary.test.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.test.ts`

**Interfaces:**

- Consumes: `ValidationIssueTarget`, `validationIssueTargetKey()` и существующий
  обход `semanticAnomalyBoundaries()`.
- Produces:

  ```ts
  export type XmlAnomalyValidationState = "pending" | "accepted"

  export interface XmlAnomalyBoundaryState {
    readonly annotation: "invalid" | "important"
    readonly target: ValidationIssueTarget
    readonly state: XmlAnomalyValidationState
  }

  export interface ParsedXmlAnomalyEvaluation {
    readonly diagnostics: Diagnostic[]
    readonly issues: ValidationIssue[]
    readonly boundaries: readonly XmlAnomalyBoundaryState[]
  }
  ```

  `evaluateParsedXmlAnomalyBoundaries()` возвращает `ParsedXmlAnomalyEvaluation`.
  Граница имеет состояние `accepted`, если на её точном `ValidationIssueTarget`
  найдена хотя бы одна смысловая ошибка. Граница имеет состояние `pending`, если
  точной ошибки ещё нет, но `deferUnnecessaryFor(target)` вернул `true`. Если
  отсрочки нет, состояние не возвращается и создаётся
  `xml/anomaly-tag-unnecessary`. Ошибки синтаксиса, чтения файлов и другие
  инфраструктурные ошибки не подтверждают границу.

- [x] **Step 1: Написать падающие модульные тесты состояний**

  В `xmlAnomalyBoundary.test.ts` проверить следующую таблицу:

  ```ts
  it.each([
    { issues: [semanticIssue(target)], deferUnnecessary: false, state: "accepted" },
    { issues: [], deferUnnecessary: true, state: "pending" },
  ] as const)("возвращает состояние $state", ({ issues, deferUnnecessary, state }) => {
    const result = evaluateXmlAnomalyBoundary({
      annotation: "invalid",
      target,
      issues,
      importantRegistered: false,
      deferUnnecessary,
    })
    expect(result.state).toBe(state)
  })
  ```

  Отдельно проверить: инфраструктурная ошибка на том же пути оставляет границу
  `pending`, а при `deferUnnecessary: false` создаёт только
  `xml/anomaly-tag-unnecessary`.

- [x] **Step 2: Убедиться, что тесты падают по ожидаемой причине**

  Run: `pnpm --filter @nkdk/runtime exec vitest run metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Expected: FAIL, потому что `state` и `boundaries` ещё отсутствуют.

- [x] **Step 3: Добавить состояния без повторного обхода YAML**

  Расширить существующий результат, не создавая второй обход дерева:

  ```ts
  export interface XmlAnomalyBoundaryEvaluation {
    readonly accepted: readonly ValidationIssue[]
    readonly visible: readonly ValidationIssue[]
    readonly contract: readonly ValidationIssue[]
    readonly state?: XmlAnomalyValidationState
  }

  const state = accepted.length > 0
    ? "accepted"
    : params.deferUnnecessary === true
      ? "pending"
      : undefined
  return { accepted, visible, contract, ...(state === undefined ? {} : { state }) }
  ```

  В `evaluateParsedXmlAnomalyBoundaries()` добавлять запись в `boundaries`
  непосредственно в уже существующем цикле. Проверки регистрации `important` и
  правильности самого тега остаются в `contract` и никогда не подавляются.

- [x] **Step 4: Проверить точное совпадение границ**

  В `validateFile.test.ts` создать две соседние границы, ошибку только у первой и
  отсрочку только у второй. Ожидать `accepted` у первой, `pending` у второй; ошибка
  родителя или соседнего значения не должна подтверждать ни одну из них.

- [x] **Step 5: Запустить проверки слоя runtime**

  Run: `pnpm --filter @nkdk/runtime exec vitest run metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base 573d812bc`

  Expected: PASS; новых повторов нет.

- [x] **Step 6: Зафиксировать состояние границы**

  Commit: `feat(runtime): ✨ вернуть состояние XML-границы`

---

## Task 15: Сохранить pending и accepted в projectState

**Files:**

- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.integration.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/formYamlTraversal.ts`
- Modify: `packages/runtime/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/runtime/metadata/validation/projectReferenceIndex.test.ts`
- Modify: `packages/rules/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/rules/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/rules/metadata/projectState/storeContract.ts`
- Modify: `packages/rules/metadata/projectState/fileUpdate.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/fragment.ts`
- Modify: `packages/rules/metadata/projectState/binary/fragment.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/rules/metadata/projectState/binary/format.ts`
- Modify: `packages/rules/metadata/projectState/binary/format.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/testData.ts`

**Interfaces:**

- Consumes: `ParsedXmlAnomalyEvaluation.boundaries` из Task 14.
- Produces единое состояние для ссылок и отложенных проверок. Используется
  `XmlAnomalyValidationState` из Task 14, второй тип с теми же значениями не
  создаётся:

  ```ts
  export interface ProjectStatePendingReference {
    // существующие поля без изменений
    readonly xmlAnomaly?: XmlAnomalyValidationState
  }
  ```

  В вариантах `dataPath` и `fillValue` у
  `ProjectStatePendingDependencyCheck` поле `tagged: boolean` заменяется на
  `xmlAnomaly?: XmlAnomalyValidationState`. Такое же поле заменяет `tagged` в
  runtime-типе `PendingMetadataTargetReference`. Поле отражает не просто наличие тега:
  `pending` означает, что локальная проверка не нашла ошибку и нужна следующая
  применимая проверка; `accepted` означает, что ошибка уже доказана и повторная
  смысловая проверка запрещена.

- [x] **Step 1: Написать падающие тесты извлечения и переноса состояния**

  В `yamlFactExtractor.integration.test.ts` и
  `yamlFactExtractor.fillValue.test.ts` проверить, что ссылка, `dataPath` или
  `fillValue` с `invalid`/`important` сначала извлекаются как `pending`, а
  обычное значение не содержит `xmlAnomaly`:

  ```ts
  expect(facts.pendingReferences).toContainEqual(
    expect.objectContaining({ yamlPath: ["Источник"], xmlAnomaly: "pending" }),
  )
  ```

  В `projectValidationPasses.integration.test.ts` проверить два пути: локальная
  смысловая ошибка обновляет `pending` до `accepted`, а правильная локально
  ссылка, зависящая от общего индекса проекта, остаётся `pending`.

- [x] **Step 2: Убедиться, что тест падает из-за прежнего `tagged`**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/yamlFactExtractor.integration.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/projectValidationPasses.integration.test.ts`

  Expected: FAIL: факты ещё содержат `tagged`, а не состояние границы.

- [x] **Step 3: Назначать состояние после локальной проверки**

  `yamlFactExtractor` назначает `xmlAnomaly: "pending"` только при точном
  `invalid`/`important` на `yamlPath`. В `projectValidationPasses.ts` после
  `evaluateParsedXmlAnomalyBoundaries()`
  построить таблицу по `validationIssueTargetKey(boundary.target)`. Затем одной
  функцией заменить только совпадающие `pendingReferences` и `pendingChecks`:

  ```ts
  function applyXmlAnomalyStates<T extends {
    readonly yamlPath: readonly (string | number)[]
    readonly xmlAnomaly?: XmlAnomalyValidationState
  }>(entries: readonly T[], boundaries: readonly XmlAnomalyBoundaryState[]): T[]
  ```

  Не извлекать состояние повторным чтением тегов. `yamlFactExtractor` продолжает
  создавать адресуемые факты и индексы для всех трёх вариантов: без тега,
  `pending`, `accepted`.

- [x] **Step 4: Написать падающий тест двоичного round-trip всех состояний**

  В `fragment.test.ts` записать и прочитать три ссылки и три проверки:

  ```ts
  const states = [undefined, "pending", "accepted"] as const
  expect(createTypedProjectStateReader(snapshot).pendingReferences(0)
    .map(({ xmlAnomaly }) => xmlAnomaly)).toEqual(states)
  expect(createTypedProjectStateReader(snapshot).pendingChecks(0)
    .map(({ xmlAnomaly }) => xmlAnomaly)).toEqual(states)
  ```

  Отдельно проверить сохранение `propertyStateMode` вместе с каждым состоянием.

- [x] **Step 5: Обновить компактное кодирование projectState**

  Для ссылки использовать младшие два бита `flags`: `0` — состояния нет, `1` —
  `pending`, `2` — `accepted`; режим свойства перенести в биты 2–3. Допустимый
  диапазон `flags` становится `0..14`. Для `dataPath` использовать `reserved`:
  `0`, `1`, `2` с тем же смыслом. Для полезной нагрузки `fillValue` заменить
  `tagged: boolean` на `xmlAnomaly?: XmlAnomalyValidationState` и увеличить версию
  этой полезной нагрузки до `2`.

  ```ts
  function encodeXmlAnomalyState(state: XmlAnomalyValidationState | undefined): 0 | 1 | 2
  function decodeXmlAnomalyState(value: number): XmlAnomalyValidationState | undefined
  ```

  Не увеличивать размер записей и не создавать отдельную таблицу. Неизвестные
  значения `3` и неизвестные биты должны завершать чтение явной ошибкой.

- [x] **Step 6: Обновить версию двоичного снимка**

  В `format.ts` установить:

  ```ts
  export const PROJECT_STATE_FORMAT_VERSION = Object.freeze({ major: 0, minor: 7, patch: 0 })
  ```

  Совместимость со снимком `0.6.0` не нужна: это внутренний кэш, который должен
  быть перестроен.

- [x] **Step 7: Запустить тесты projectState и проверку типов**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/readSession.test.ts metadata/validation/yamlFactExtractor.integration.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/projectValidationPasses.integration.test.ts`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 573d812bc`

  Expected: PASS; размер двоичных записей не изменился; новых повторов нет.

- [x] **Step 8: Зафиксировать перенос состояния**

  Commit: `feat(rules): ✨ сохранить состояние XML-границы в projectState`

---

## Task 16: Прекращать смысловые проверки подтверждённой границы

**Files:**

- Modify: `packages/rules/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/rules/metadata/projectState/binary/diagnosticBatches.ts`
- Create: `packages/rules/metadata/projectState/binary/diagnosticBatches.test.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPendingChecks.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`
- Modify: `packages/rules/metadata/project/validateProject.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/contracts.test.ts`
- Modify: `packages/rules/metadata/projectState/importSession.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/service.integration.test.ts`

**Interfaces:**

- Consumes: `XmlAnomalyValidationState` из Tasks 14–15.
- Produces общий результат смыслового этапа:

  ```ts
  export interface ProjectStateXmlAnomalyBoundary {
    readonly componentPath: string
    readonly projectPath: string
    readonly yamlPath: ProjectStateYamlPath
  }

  export interface ProjectStateSemanticValidationResult {
    readonly diagnostics: readonly Diagnostic[]
    readonly acceptedXmlAnomalies: readonly ProjectStateXmlAnomalyBoundary[]
  }
  ```

  `validateReferences()` и `validateDependencies()` в
  `ProjectStateDependencyValidator` возвращают
  `ProjectStateSemanticValidationResult`. Остальные проверки пока сохраняют
  прежний результат `readonly Diagnostic[]`, потому что их факты не несут
  `xmlAnomaly`. Ключ границы состоит из `componentPath`, `projectPath` и полного
  `yamlPath`; текст сообщения в ключ не входит.

- [x] **Step 1: Написать падающие тесты прекращения проверок**

  В `projectStateDependencyValidation.test.ts` добавить четыре наблюдаемых
  случая с поддельным `queryPort` и счётчиками вызовов:

  ```ts
  expect(resolveTargetsCalls).toBe(0) // accepted-ссылка не проверялась
  expect(readDependencyInputsCalls).toBe(0) // accepted-проверка не выполнялась
  ```

  Для `pending` проверить:

  - сломанная ссылка подавляет свою диагностику и возвращает границу в
    `acceptedXmlAnomalies`;
  - правильная ссылка не подтверждает тег;
  - ошибка `dataPath` подтверждает тег и не публикуется;
  - обычная запись без `xmlAnomaly` по-прежнему публикует все свои ошибки.

  В `projectValidationPasses.integration.test.ts` повторить три главных случая
  для проверки проекта без двоичного projectState: локально `accepted` не
  попадает во второй проход; ошибка ссылки подтверждает `pending` и прекращает
  проверку того же пути; полностью правильный путь получает одну ошибку лишнего
  тега только в конце второго прохода.

- [x] **Step 2: Убедиться, что тесты показывают нынешнее повторное поведение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/projectStateDependencyValidation.test.ts`

  Expected: FAIL: `accepted` ещё отправляется в `queryPort`, а `pending` либо
  создаёт локальное сообщение о лишнем теге, либо не сообщает подтверждённую
  границу вызывающему коду.

- [x] **Step 3: Возвращать решение отдельно от диагностик**

  В обработчиках ссылок и зависимостей:

  ```ts
  if (entry.reference.xmlAnomaly === "accepted") continue
  if (entry.reference.xmlAnomaly === "pending" && problems.length > 0) {
    acceptedXmlAnomalies.push(boundaryFromReference(entry))
    continue
  }
  diagnostics.push(...problems)
  ```

  Внутри одного обработчика проверки границ выполнять волнами: в одну пакетную
  операцию входит не более одной ещё не выполненной проверки каждой `pending`-
  границы и все обычные записи. После ответа подтверждённая граница удаляется из
  следующей волны. Так несколько проверок не превращаются в отдельные запросы,
  но ни одна последующая проверка подтверждённой границы не запускается.

  Для зависимостей применять то же правило по `entry.check.xmlAnomaly`. Не
  создавать `xml/anomaly-tag-unnecessary` внутри отдельного обработчика: он не
  знает, осталась ли ещё применимая проверка для этой же YAML-границы.

  `validateSecondPassReferences()` в `projectValidationPasses.ts` возвращает тот
  же смысловой результат. `validateProjectFileSecondPass()` сначала проверяет
  ссылки, исключает подтверждённые пути из `pendingChecks`, затем проверяет
  оставшиеся зависимости и только после этого объявляет оставшиеся `pending`-
  границы лишними. Поэтому обычная проверка проекта и проверка двоичного
  projectState используют одинаковый порядок.

- [x] **Step 4: Написать падающий тест общего порядка этапов**

  В `diagnosticBatches.test.ts` собрать один снимок, где одна `pending`-граница
  представлена ссылкой и зависимой проверкой:

  ```ts
  expect(messages(result)).not.toContain("Тег XML-аномалии лишний: значение не содержит ошибки")
  expect(validateDependenciesReceivedBoundary).toBe(false)
  ```

  Ссылка должна найти ошибку первой. Обработчик зависимостей не должен получить
  уже подтверждённую границу. Вторым тестом сделать ссылку правильной, а
  зависимость ошибочной — тег подтверждает второй этап. Третьим тестом сделать
  обе проверки правильными — в конце появляется ровно одно сообщение о лишнем
  теге. Две технические проверки с одним `yamlPath` считаются одной границей.

- [x] **Step 5: Ввести единый последовательный распорядитель границ**

  В `validateSnapshotDependencyDiagnostics()` сохранить пакетную обработку, но
  выполнять смысловые группы в фиксированном порядке:

  1. ссылки;
  2. `dataPath` и `fillValue` только для ещё не подтверждённых границ;
  3. одно `xml/anomaly-tag-unnecessary` для каждой оставшейся `pending`-границы.

  ```ts
  const accepted = new Set<string>()
  const referenceResult = dependencyValidator.validateReferences(...)
  addAccepted(accepted, referenceResult.acceptedXmlAnomalies)
  const dependencyResult = dependencyValidator.validateDependencies({
    ...params,
    checks: dependencies.filter((entry) => !accepted.has(boundaryKey(entry))),
  })
  addAccepted(accepted, dependencyResult.acceptedXmlAnomalies)
  ```

  Для очереди однотипных проверок использовать общий помощник, который берёт по
  одной записи каждой границы за волну:

  ```ts
  function validatePendingInWaves<T>(params: {
    readonly checks: readonly T[]
    readonly boundary: (check: T) => ProjectStateXmlAnomalyBoundary | undefined
    readonly validate: (checks: readonly T[]) => ProjectStateSemanticValidationResult
  }): ProjectStateSemanticValidationResult
  ```

  Обычные записи без `xmlAnomaly` отправляются в первую волну все сразу и не
  участвуют в прекращении сбора ошибок. Для `pending` следующая запись того же
  ключа берётся только если предыдущая волна не вернула этот ключ в
  `acceptedXmlAnomalies`.

  Записи `accepted` исключать до вызова первого обработчика. Записи без тега не
  фильтровать и не прекращать для них сбор ошибок. Ошибки готовности проекта,
  синтаксиса, чтения и договора тегов всегда публиковать: они не подтверждают и
  не отменяют смысловую границу.

- [x] **Step 6: Удалить прежнее локальное решение о лишнем теге**

  `validatePendingChecks()` возвращает диагностические ошибки обычных записей и
  подтверждённые границы записей с тегом, но не создаёт сообщение о лишнем теге.
  Единственное место такого сообщения после этой задачи — конец
  `validateSnapshotDependencyDiagnostics()` и локальная проверка границы, для
  которой нет отложенных фактов.

- [x] **Step 7: Запустить целевые и смежные тесты**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/projectState/binary/diagnosticBatches.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/validation/projectValidationPendingChecks.test.ts metadata/validation/projectValidationPasses.integration.test.ts`

  Run: `pnpm --filter @nkdk/runtime exec vitest run metadata/validation/projectReferenceIndex.test.ts`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 573d812bc`

  Expected: PASS; подтверждённые границы не вызывают чтения зависимостей; обычные
  записи по-прежнему возвращают полный набор ошибок.

- [x] **Step 8: Зафиксировать единый порядок проверки**

  Commit: `fix(rules): 🐛 прекратить проверку подтверждённых XML-границ`

---

## Task 17: Связать решения импорта с окончательным состоянием и проверить cf/doc

**Files:**

- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/runtime/metadata/validation/structuralYamlValue.ts`
- Modify: `packages/runtime/metadata/validation/typeboxValidationCompiler.ts`
- Modify: `packages/runtime/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/runtime/metadata/validation/validationIssue.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.ts`
- Modify: соответствующие тесты runtime
- Modify: `docs/superpowers/plans/2026-08-23-xml-anomaly-runtime-implementation.md`

**Interfaces:**

- Consumes: `XmlAnomalyValidationState = "accepted"` из Task 15 и прекращение
  проверок из Task 16.
- Produces: третий проход импорта повторно использует построенный индекс, а
  решения импорта сразу записывает как `accepted`; он не запускает локальный
  валидатор ещё раз и не превращает уже доказанную аномалию в «лишний тег».

- [x] **Step 1: Написать падающий тест отсутствия повторной локальной проверки**

  В `worker.integration.test.ts` подсчитать запуски схемы для двух задач и
  ожидать три запуска вместо четырёх: два в первом проходе и один после
  появления новых решений второго прохода.

- [x] **Step 2: Получить ожидаемое падение и внести ограниченную правку**

  Тест сначала получил `4` вместо `3`. `worker.ts` был изменён так, чтобы третий
  проход использовал уже построенный индекс, переносил решения в факты и
  вычислял окончательный хэш без полного повторения локальной проверки.

- [x] **Step 3: Перевести временные признаки на окончательное состояние**

  В `applyImportedDecisionsToFinalState()` заменить установку `tagged: "xml"` и
  `tagged: true` на одно состояние:

  ```ts
  const acceptedPaths = decisions.map(({ target }) => target.path)
  // для точного совпадения yamlPath:
  { ...entry, xmlAnomaly: "accepted" as const }
  ```

  Не менять факты соседних свойств и не расширять XML-границу. `raw` продолжает
  исключать только собственное значение, а распознанный именованный объект
  остаётся в индексах.

- [x] **Step 4: Проверить импорт и снимок после третьего прохода**

  Дополнить тест ожиданиями:

  ```ts
  expect(finalState.pendingReferences).toContainEqual(
    expect.objectContaining({ yamlPath: ["Источник"], xmlAnomaly: "accepted" }),
  )
  expect(schemaRuns).toBe(3)
  expect(indexBuilds).toBe(2)
  ```

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/worker.integration.test.ts`

  Expected: все тесты PASS.

- [x] **Step 5: Проверить компактную эталонную базу**

  Run outside sandbox:

  `env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/doc ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1`

  Expected: прежние 176 сообщений «Тег XML-аномалии лишний» отсутствуют. Любое
  оставшееся различие должно содержать точный XML/YAML-путь и отдельно
  классифицироваться как восстановленное `raw`, подтверждённое
  `invalid`/`important` либо фактическое ограничение из спецификации.

  Фактическая проверка выполнена доступным сценарием `round-trip-yaml` на
  `/Users/nikita/git/round-trip-compact/cf/doc`: импортировал 9937 заданий с 14
  ранее известными предупреждениями преобразования `DataPath`; сообщений о
  лишнем теге нет. Синхронизация дошла до 100 ранее зафиксированных ограничений
  `raw` и `#order`, поэтому сравнение итоговых XML-файлов в этой задаче не
  выполнялось. Проверка выявила и устранила две общие причины ложных сообщений:
  повторы логических YAML-ключей и неоднозначные ошибки внутренних ветвей
  TypeBox union.

- [x] **Step 6: Проверить время и память импорта**

  Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-import-profile-doc-yaml --runs 1 --json`

  Сравнить с последним зафиксированным профилем Task 13: 178,5 с, RSS 3253,7
  МиБ, куча worker 699,5 МиБ. Новая реализация не должна создавать проход по
  YAML для каждой границы, отдельную таблицу projectState или индивидуальный
  запрос к индексу; рост пикового RSS более чем на 10% требует исследования до
  завершения задачи.

  Фактический результат: 184,6 с, RSS 3143,6 МиБ, куча worker 616,2 МиБ. По
  сравнению с Task 13 RSS уменьшился на 3,4%, куча worker — на 11,9%; порог
  роста памяти не превышен.

- [x] **Step 7: Выполнить полную проверку проекта**

  Использовать `superpowers:verification-before-completion`.

  Run: `pnpm type-check`

  Run outside sandbox: `pnpm test`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Run: `pnpm duplicates -- --base 573d812bc`

  Expected: все команды PASS; baseline dependency-cruiser и XML-фикстуры не
  изменены; новых повторов нет.

- [x] **Step 8: Провести ревью по спецификации и плану**

  Использовать `superpowers:requesting-code-review`. Проверить отдельно:

  - `raw` исключает только собственную границу;
  - `accepted` остаётся в индексах, поиске, переименовании и экспорте;
  - `accepted` не поступает ни в одну последующую смысловую проверку;
  - `pending` получает ровно одно итоговое решение;
  - правила самого тега и инфраструктурные ошибки не подавляются;
  - обычный YAML без тега продолжает собирать все ошибки.

  Если код расходится со спецификацией или `.agents/architecture.md`, сначала
  исправить код. Архитектурный документ не изменять молча: расхождение сообщить
  разработчику.

- [x] **Step 9: Зафиксировать завершение механизма**

  Commit: `fix(rules): 🐛 завершить проверку XML-аномалий при импорте`

---

## Task 18: Адресовать дополнительные XML-документы и убрать `#attributes`

**Статус:** реализовано; полный `cf/doc` проходит XML → YAML → XML без различий.
Завершающая проверка всего проекта выполняется в шаге 13.

**Files:**

- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/prepareAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/resourceTopology/core/compiler.test.ts`
- Modify: `packages/runtime/xml/import/document.ts`
- Modify: `packages/runtime/xml/import/document.test.ts`
- Modify: `packages/runtime/xml/structure/hash.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts`
- Create: `packages/rules/metadata/importFromXml/controlComposition.ts`
- Create: `packages/rules/metadata/resourceTopology/core/fileBackedMemberPath.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/sharedMetadata.ts`
- Modify: `packages/runtime/xml/import/saxesParser.ts`
- Modify: `packages/runtime/xml/structure/compare.ts`
- Modify: `packages/runtime/yaml/locationIndex.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

Дополнительные файлы выявлены при проверке реального `cf/doc`: они отвечают за
единый состав файловых дочерних элементов, освобождение подробного XML-аудита,
нормализацию XML, структурированные ошибки синхронизации и ограничение числа
рабочих линий. Частных условий по виду объекта в нейтральные слои не добавлено.

- [x] **Step 1: Зафиксировать окончательную грамматику путей тестами**

  Покрыть четыре формы:

  ```yaml
  Properties\Future: !xml/raw
    $xml: { "#text": "42" }
  '@Form\Future': !xml/raw
    $xml: { "#text": "42" }
  '@AdditionalIndexes\Future': !xml/raw
    $xml: { "#text": "42" }
  '@': !xml/raw
    $xml: { _future: x }
  Properties: !xml/raw
    $xml: { "#order": [Name, Future] }
  ```

  Первая форма относится к основному XML-документу. `@Form` и
  `@AdditionalIndexes` выбирают дополнительные документы, зарегистрированные
  топологией как `Ext/Form.xml` и `Ext/AdditionalIndexes.xml`. Одиночный `@`
  выбирает корень основного документа. В публичном YAML запретить `@Ext/`,
  расширение `.xml`, абсолютный путь, `#attributes` и отдельный путь
  `Properties\\#order`: объединённый порядок находится внутри `$xml` самого
  родителя.

- [x] **Step 2: Проверять краткие имена документов при компиляции топологии**

  Для каждого YAML-задания вычислять краткое имя дополнительного XML-документа
  из имени файла без `.xml`. Основной документ не получает имени. Два
  дополнительных документа одного задания с одинаковым кратким именем должны
  завершать компиляцию топологии явной ошибкой; молча выбирать один нельзя.

- [x] **Step 3: Не терять источник неизвестного узла при импорте**

  `anomalyProof` уже знает `sourcePath` и роль XML-документа. До создания
  публичной аннотации сопоставлять их с XML-документом текущего задания. Для
  основного документа оставлять обычный путь, для дополнительного добавлять
  `@ИмяДокумента`. Не записывать файловый путь в `XmlAnomalyAnnotation` и не
  определять документ по содержимому `$xml`.

- [x] **Step 4: Хранить атрибуты и порядок в raw самого элемента**

  Неизвестный атрибут `custom` узла `Properties` проецировать так:

  ```yaml
  Properties: !xml/raw
    $xml:
      _custom: x
  ```

  Для значимого порядка известных и неизвестных атрибутов `$xml` содержит весь
  упорядоченный набор `_...`-ключей. Для атрибута корневого элемента использовать
  путь `@`. Удалить создание и чтение `#attributes` из публичной YAML-грамматики;
  старый формат не поддерживать и не мигрировать. Внутренняя координата
  XML-сравнения может называть группу атрибутов `#attributes`, но она не должна
  попадать в YAML. Объединённый порядок известных и неизвестных детей хранить
  как `$xml.#order` raw родительского пути; отдельный служебный ключ XML-пути
  `#order` запретить.

- [x] **Step 5: Исключить форматирование XML из сравнения**

  До вычисления структурного хэша, аудита и raw-проекции удалять текстовые узлы,
  состоящие только из пробелов, табуляций и переводов строк, если у родителя
  есть дочерние XML-элементы. Не создавать для них `#text`, `#order` и raw.
  Текст листового элемента сохранять точно: `<FillValue>         </FillValue>`
  обязан оставить девять пробелов. Непробельный mixed content также не
  удалять. Покрыть обе стороны одним тестом нормализованного дерева и хэша.

- [x] **Step 5а: Не распознавать служебные `Item` только по имени**

  Для предварительного raw повторного узла наложить сохранённую XML-поправку на
  обычный экспорт. Если результат не изменился, узел уже восстановлен Rules и
  отдельный raw не нужен. Если результат изменился, сохранить минимальную
  поправку. Покрыть отдельно обычный `xr:Item`, который Rules восстанавливает,
  и действительно неизвестный `<Item>`.

- [x] **Step 6: Восстанавливать обязательные системные коллекции из Rules**

  Если коллекционный тип зарегистрировал `completeItemNames`, дополнять им
  существующую YAML-коллекцию. При отсутствующем компактном YAML-свойстве
  создавать коллекцию только когда PropertyRule явно содержит
  `evaluateWhenYAMLMissing: true`; это отличает обязательную системную
  коллекцию от действительно отсутствующей без сохранения XML-состояния в
  снимке. Пустые канонические items должны создаваться обычным Rules-экспортом.
  На реальном договоре перечисления
  отсутствие `СтандартныеРеквизиты` в YAML обязано восстановить `Order` и
  `Ref` в `StandardAttributes` без raw. Не добавлять эти пустые ключи в YAML и
  не вводить частное условие по `MetadataEnumeration`.

- [x] **Step 7: Разрешать документ при полной и частичной синхронизации**

  До применения `$xml` разрешать `@ИмяДокумента` через скомпилированную
  топологию задания. Известное свойство с `filePath` продолжает выбирать свой
  документ через Rules и не получает служебный префикс. Неизвестное имя,
  неоднозначное имя и попытка направить raw во внешний копируемый файл должны
  блокировать экспорт точной ошибкой договора.

- [x] **Step 8: Покрыть реальные семейства**

  Добавить проверки как минимум для формы (`@Form`), конфигурации
  (`@CommandInterface`), прикладного объекта (`@AdditionalIndexes`) и корневого
  атрибута основного XML. Отдельно подтвердить, что `Template.xml` остаётся
  внешним копируемым файлом и не использует raw до появления смыслового
  преобразования макетов.

- [x] **Step 9: Проверить реализацию**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts yaml/xmlAnomalyAnnotations.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/resourceTopology/core/compiler.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/anomalyProof.test.ts metadata/fullSyncToXml/prepareAssignment.integration.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts`

  Run: `pnpm type-check`

  Run outside sandbox: `pnpm test`

  Run: `pnpm duplicates -- --base 573d812bc`

  Expected: все проверки PASS; публичный YAML не содержит `#attributes`,
  отдельного пути `#order`, `Ext/` или `.xml` в селекторе документа; raw точно
  восстанавливает исходный XML-документ и не скрывает соседние смысловые
  свойства. Форматирующие отступы не создают raw, а leaf-строки из пробелов
  сохраняются. Default-only `StandardAttributes` перечислений восстанавливается
  Rules без raw.

- [x] **Step 10: Удалять недоказанные предварительные raw**

  Контрольный экспорт должен возвращать смысловую проекцию, фактически
  переданную обычным Rules. При точном совпадении исходного и экспортированного
  XML заменить ею черновые данные и аннотации, чтобы предварительный raw не
  переживал доказательство без основания. При несовпадении строить подробные
  границы от той же проекции.

- [x] **Step 11: Закрыть неоднозначности вложенной адресации**

  Связывать скрытое свойство Rules без `yamlKey` по его `propertyKey`, но
  разрешать его присутствие в публичном YAML только с аномальным тегом.
  Вложенный `#order` оставлять на XML-родителе и не поднимать к корню документа.
  В YAML-индексе строку `Ключ: !xml/raw` считать началом вложенного контейнера,
  чтобы пустой mapping внутри `$значение` оставался `{}`.

- [x] **Step 12: Ограничить память полного импорта**

  После контрольного сравнения конкретного файла немедленно освобождать его
  подробную карту исходного XML. Ограничить штатное значение параллелизма
  импорта и сценария round-trip двумя рабочими линиями, сохранив возможность
  явной настройки. Проверить профилировщиком на `cf/doc`: импорт завершается,
  ошибок нет, измеренный пик RSS не превышает 2,7 ГиБ.

  Фактически штатный сценарий использует две рабочие линии. Подробные XML-карты
  освобождаются после каждого задания; полный `cf/doc` завершается без прежнего
  неограниченного роста памяти. На заключительном прогоне RSS стабилизировался
  примерно на 2,0 ГиБ при установленном пределе 2,7 ГиБ.

- [x] **Step 13: Завершить проверку и сверку с договором**

  Повторно выполнить полный round-trip `cf/doc`, целевые тесты runtime/rules,
  проверку типов, `pnpm duplicates -- --base 49b727d503`, архитектурные тесты и
  `pnpm test`. После этого сверить фактические изменения с этой задачей и
  спецификацией; найденные расхождения исправить до завершения работы.

  Фактический round-trip уменьшенного `cf/doc` завершён сообщением
  `Round-trip чистый: диффов нет`. Дополнительно закрыты: файловые дочерние
  элементы в общей composition, явное `$xml: null`, сохранение двойных кавычек
  строк и отделение неизвестных подробных raw от предварительных кандидатов
  известных Rules-узлов. Повторные `Item` теперь распознаются по результату
  обычного экспорта, а не по одному имени: восстановленный Rules узел не создаёт
  raw, неизвестный узел не теряется. `CI=true pnpm test`, проверка типов, поиск новых
  дублей и обе архитектурные проверки прошли. Обычный локальный `pnpm test`
  подтвердил все 4311 проверок, но завершился на пороге времени существующего
  `clientApplicationForm/toJSONSchema.test.ts`: 1,52 с при лимите 1 с. Тот же
  файл на исходной ветке занимает 1,68 с, поэтому это не регрессия задачи;
  штатный допуск CI принимает результат.
