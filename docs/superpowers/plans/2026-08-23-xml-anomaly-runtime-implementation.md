# XML Anomaly Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить все прежние частные XML-аномалии единым механизмом `!xml/raw`, `!xml/invalid` и `!xml/important`, который сохраняет импортируемый XML, не пропускает аномальные данные в обычную валидацию и одинаково восстанавливает их при полной и частичной синхронизации.

**Architecture:** Нейтральный `XmlAnomalyRuntime` компилируется рядом с `RuleRegistrySet`, оборачивает существующие PropertyRule и ведёт аудит нормализованного XML-дерева. Импорт выполняется в три прохода: смысловой рабочий индекс, доказательство обратимости и окончательный смысловой индекс, затем классификация и единственная запись YAML. Полная и частичная синхронизация используют один адаптер: смысловые теги снимаются перед обычным экспортом, а raw-фрагменты объединяются с полученным XML после него.

**Tech Stack:** TypeScript 7, Vitest, `js-yaml`, `saxes`, TypeBox, Piscina, LMDB/projectState, `@node-rs/xxhash`.

**Spec:** [2026-08-23-common-types-xml-anomaly-framework-design.md](../specs/2026-08-23-common-types-xml-anomaly-framework-design.md)

## Global Constraints

- Выполнять задачи по TDD: сначала падающий тест, затем минимальная реализация, затем переработка без изменения поведения.
- Не изменять существующие XML-фикстуры: они являются источником истины. Для дополнительных форм XML создавать строки непосредственно в тестах или добавлять только новые фикстуры.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей common-типов. Частные решения регистрировать только через отдельный реестр `xmlAnomalies`.
- Не добавлять в нейтральные слои условия по `itemType`, XML-корням и папкам проекта. Конкретные регистрации принадлежат `packages/rules/metadata/**`.
- Не поддерживать прежние `!xml/present`, `!xml/absent`, `!xml/name`, `!xml/type`, `!xml/value`, `!xml/reference`, `!xml/language` и `!xml/duplicate`: после окончательного переключения они являются синтаксической ошибкой YAML.
- Не создавать мигратор старого YAML. Повторный импорт исходного XML является единственным переходом на новый формат.
- Разработчик явно разрешил обновить `.agents/architecture.md` после реализации. Обновлять его только в Task 12, когда фактическая архитектура уже подтверждена тестами и финальным устройством кода.
- После каждого законченного слоя запускать `pnpm duplicates -- --base c0cf08c81` и не принимать новые дубли без локального устранения.
- Для каждого коммита использовать навык `commit`; сообщения ниже задают ожидаемый смысл, но перед коммитом должны быть проверены по фактическому diff.

---

## Task 1: Ввести единую таблицу YAML-аннотаций

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
    _future: x
    "#text": "42"
  !xml/invalid Код: { Тип: Строка }
  !xml/invalid/2 Код: { Тип: Число }
  ```

  Проверить, что смысловые данные не содержат объектов-обёрток, оба ключа `Код` не теряются, а парсер возвращает отдельную таблицу аннотаций. Проверить ошибки `/1`, первого `/2`, пропуска номера и raw на ключе. Проверку important-регистрации выполняет Task 10, а окончательный отказ от прежних `!xml/*` — атомарное переключение Task 11.

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
  }

  export interface XmlAnomalyAnnotations {
    root(): XmlAnomalyAnnotation | undefined
    at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined
    keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined
    entries(): Iterable<XmlAnomalyAnnotationEntry>
    copy(source: object, target: object): void
  }
  ```

  Для повторных ключей до `js-yaml.load` заменять каждый тегированный ключ внутренним уникальным ключом. В таблице хранить его логическое имя и номер; наружу предоставить `xmlAnnotatedMappingEntries`, возвращающий логические ключи в исходном порядке. Служебные ключи не должны попадать в сериализованный YAML.

- [ ] **Step 4: Протащить таблицу через разбор и сериализацию**

  Добавить `annotations` в `ParsedYaml`, `ParsedYamlData` и `SerializedYAMLDocument`. Сделать второй параметр `serializeYAMLDocument(source, annotations?)` необязательным, чтобы обычные вызовы не менялись. До атомарного переключения Task 11 прежние XML-теги продолжают читать существующие функции; новый код их не создаёт и не преобразует. Property-state теги `!проверять` и `!изменять` оставить отдельным механизмом.

- [ ] **Step 5: Проверить точный повторный разбор**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/xmlAnomalyAnnotations.test.ts yaml/jsYamlParser.test.ts yaml/parseMetadataYaml.test.ts yaml/export.test.ts`

  Expected: PASS; `parse -> serialize -> parse` сохраняет вид, номера и порядок всех новых аннотаций.

- [ ] **Step 6: Проверить слой и зафиксировать его**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить таблицу XML-аннотаций YAML`

---

## Task 2: Разбирать XML без потери структуры

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

  Покрыть scalar, `null`, `_`-атрибуты, `#text`, `#name`, `#order`, массив повторных детей, полный путь `Properties\\Future`, терминалы `#attributes` и `#order`. Проверить отказ при XML-декларации/DOCTYPE внутри свойства, пересечении с обычным выводом, повторной записи пути, неверном порядке и перекрывающихся raw-границах.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/rawCodec.test.ts xml/structure/merge.test.ts xml/structure/compare.test.ts`

  Expected: тесты падают, потому что общих функций raw-декодирования, сравнения и слияния ещё нет.

- [ ] **Step 3: Реализовать нормализованный фрагмент**

  ```ts
  export type XmlRawValue =
    | string
    | null
    | readonly XmlRawValue[]
    | Readonly<Record<string, XmlRawValue>>

  export interface XmlRawFragment {
    readonly nodes: readonly XmlElementNode[]
    readonly suppressOrdinaryOutput: boolean
  }
  ```

  `decodeXmlRawValue` принимает только договорённые YAML-формы и возвращает нормализованные узлы. `null` означает явное отсутствие известного XML-места и разрешён только как корневой payload. YAML number и boolean запрещены: XML-текст вроде `01`, `true` и `null` хранится строкой. Не принимать raw на ключе.

- [ ] **Step 4: Реализовать структурное сравнение и слияние**

  Сравнение возвращает минимальные несовпадающие пути и использует хэши для равных поддеревьев. Слияние работает через журнал занятых путей и сначала проверяет все операции, затем применяет их; частично изменённый XML при ошибке недопустим.

- [ ] **Step 5: Проверить кодек**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/rawCodec.test.ts xml/structure/merge.test.ts xml/structure/compare.test.ts xml/export/exporter.test.ts`

  Expected: PASS.

- [ ] **Step 6: Проверить слой и зафиксировать его**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить общий raw-кодек XML`

---

## Task 4: Скомпилировать `XmlAnomalyRuntime` рядом с rules

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

- [ ] **Step 1: Описать три вида частных регистраций**

  Падающими тестами проверить компактный raw-генератор, обязательный important и скрытое внешнее имя singleton. Проверить конфликт двух регистраций одной границы и отсутствие concrete-условий внутри runtime.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/definition/composeMetadataRules.test.ts metadata/ruleRuntime/ruleRegistrySet.test.ts`

  Expected: тесты падают из-за отсутствия `xmlAnomalies` в definition и `RuleRegistrySet`.

- [ ] **Step 3: Реализовать отдельный вклад композиции**

  ```ts
  export type XmlAnomalyRegistration =
    | XmlCompactRawRegistration
    | XmlImportantRegistration
    | XmlHiddenSingletonNameRegistration

  export type XmlAnomalyBoundary =
    | { readonly propertyType: string }
    | { readonly itemType: string; readonly propertyKey: string }
  ```

  `MetadataRulesDefinition.xmlAnomalies` является массивом вкладов. Компилятор строит карты по типу свойства и паре `itemType/propertyKey`, проверяет неоднозначность при создании `RuleRegistrySet` и возвращает `registry.xmlAnomalies`. Не добавлять новые поля в PropertyRule.

- [ ] **Step 4: Проверить детерминированность компактного raw**

  Runtime дважды вызывает генератор на одном замороженном наборе входов и сравнивает структурные хэши. Несовпадение блокирует сборку rules. Все входы генератора перечислены регистрацией и извлекаются через существующий путь PropertyRule.

- [ ] **Step 5: Проверить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/registry.test.ts metadata/ruleRuntime/xmlAnomaly/runtime.test.ts metadata/ruleRuntime/definition/composeMetadataRules.test.ts metadata/ruleRuntime/ruleRegistrySet.test.ts`

  Expected: PASS.

- [ ] **Step 6: Проверить типы, дубли и зафиксировать**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(runtime): ✨ добавить реестр XML-аномалий`

---

## Task 5: Аудировать владение XML и изолировать сбой PropertyRule

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

  Отдельными тестами зафиксировать canonical вместе с alias, два singleton, неизвестный ребёнок и неизвестный атрибут. Они должны остаться разными результатами аудита до классификации, а не общей ошибкой assignment.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts metadata/ruleRuntime/xmlAnomaly/attempt.test.ts metadata/ruleRuntime/property/xmlImportPlan.test.ts metadata/ruleRuntime/property/fromXMLToYAML.test.ts metadata/configurationIndex/collector/writer.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(runtime): ♻️ сделать XML-import свойств транзакционным`

---

## Task 6: Сохранять повторы именованных коллекций и неизвестные XML-пути

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

  Для трёх реквизитов с именем `Код` ожидать обычный первый ключ, затем `!xml/invalid Код`, затем `!xml/invalid/2 Код`. Для двух одновременно невалидных имён `1Код` сохранять тот же адресный ряд: отдельный класс ошибки в ключ не кодируется.

- [ ] **Step 2: Зафиксировать неизвестные многоуровневые части**

  Проверить результат вида:

  ```yaml
  Properties\Future: !xml/raw
    _mode: x
    "#text": "42"
  Properties\Future\#attributes: !xml/raw
    _extra: y
  ```

  `Properties` не появляется отдельным смысловым свойством YAML. Иерархия относится только к XML-узлам; атрибуты находятся лишь в конечном `#attributes`.

- [ ] **Step 3: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/xmlAnomaly/yamlProjection.test.ts metadata/ruleRuntime/metadataCollection/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataCollection/fromYAMLToXML.test.ts metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataItem/fromYAMLToXML.test.ts`

  Expected: `Object.fromEntries` теряет повторы, а неизвестные пути не проецируются.

- [ ] **Step 4: Использовать общий адаптер отображений**

  До сворачивания коллекции передавать все элементы в `projectNamedXmlCollection`; на чтении YAML использовать `xmlAnnotatedMappingEntries`. Обычный ключ остаётся первым каноническим item, а номера относятся только к дублям. Не вводить `#order` там, где порядок уже задаётся порядком YAML mapping.

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

  Проверить, что invalid/important передают payload обычному `fromYAML/toXML`, expanded raw вставляет фрагмент, `!xml/raw null` подавляет обычный default, пустой raw вызывает ровно один компактный генератор, скрытое `Имя: !xml/raw` меняет внешнее XML-имя. Один и тот же YAML должен дать структурно одинаковый XML в full и partial sync.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/fullSyncToXml/prepareAssignment.integration.test.ts metadata/fullSyncToXml/writeAssignment.integration.test.ts metadata/partialSyncToXml/finalizePartialXmlSyncPackage.integration.test.ts`

  Expected: текущий экспорт знает только прежние частные теги и не умеет объединять общий raw.

- [ ] **Step 3: Сохранять аннотации подготовленного YAML**

  `PreparedYamlFile` хранит `ParsedYaml`, а не только `.data`, либо явно хранит пару `{ data, annotations }`. Не восстанавливать теги повторным поиском текста. Перед обычной сборкой assignment runtime создаёт смысловой вид без raw-границ; invalid/important остаются обычными значениями.

- [ ] **Step 4: Применять raw после обычного экспорта**

  `PreparedXMLDocument` получает план raw-вставок. После завершения всех deferred XML `writeAssignment` вызывает общий `mergeXmlRawFragments` и только затем `xmlExport`. Ошибка договора тега или коллизия блокирует запись всего assignment.

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

## Task 8: Выполнять контрольный экспорт один раз на assignment

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

  Проверить: точный boolean/string/number остаётся обычным YAML; `01`, неизвестный `xsi:type`, лишний ребёнок и default/presence mismatch локализуются в raw; понятное, но недопустимое значение пока остаётся смысловым кандидатом. Счётчик обязан показать один обычный YAML → XML экспорт на assignment независимо от числа PropertyRule.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/prepareYaml.integration.test.ts metadata/importFromXml/worker.integration.test.ts`

  Expected: контрольного экспорта и локализации различий нет.

- [ ] **Step 3: Сохранить компактный аудит между проходами**

  В worker Map хранить смысловой YAML, таблицу аннотаций, хэши XML-границ, координаты и пути исходных файлов. Не удерживать полное структурное дерево после первого прохода. Расширенный raw извлекать повторным чтением только соответствующего исходного XML-файла.

- [ ] **Step 4: Выполнить обычный экспорт без исходного XML**

  Использовать тот же `prepareAssignment/writeAssignment` runtime в режиме in-memory proof, но отключить raw fallback и reference snapshot. Сравнить полученное дерево с аудит-хэшами; поднимать несовпавшую границу по одному уровню, не поглощая независимые соседние аннотации.

- [ ] **Step 5: Ограничить попытки доказательства**

  Для каждой границы разрешить конечное число подъёмов, равное глубине её скомпилированного пути. Повторное несовпадение после выбора родителя является фатальной ошибкой runtime, а не новым циклом.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/importFromXml/anomalyProof.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/prepareYaml.integration.test.ts metadata/importFromXml/worker.integration.test.ts`

  Expected: PASS; счётчик контрольного экспорта равен числу успешных assignments.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(rules): ✨ доказать обратимость XML при импорте`

---

## Task 9: Разделить import на три worker-прохода и два барьера индекса

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

- [ ] **Step 1: Зафиксировать автомат состояний**

  Ожидаемая последовательность:

  ```text
  firstPass -> commitWorkingIndex -> secondPass
  -> commitSemanticIndex -> classifyImportedIssues -> thirdPass
  -> finalize
  ```

  Проверить запрет раннего третьего прохода, поздних записей в предыдущую фазу, повторного barrier, потерянного assignment и любого неразрешённого pending.

- [ ] **Step 2: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts metadata/projectState/importSession.integration.test.ts`

  Expected: pool и import session имеют только два прохода и один общий индексный барьер.

- [ ] **Step 3: Добавить нейтральный второй барьер projectState**

  `commitSemanticIndex()` ждёт записи второго прохода, фиксирует доказанные смысловые вклады и выдаёт read token. После него начинается отдельная final update для окончательных хэшей, локального состояния и файлов. ProjectState не знает про XML-теги: координатор передаёт ему только обычные вклады и получает структурированные результаты проверок.

- [ ] **Step 4: Разделить обязанности worker**

  Первый проход импортирует и публикует рабочие факты. Второй завершает deferred, выполняет контрольный экспорт, выбирает raw и публикует окончательные смысловые факты без записи YAML. Третий принимает готовые решения invalid/important, проверяет договор аннотаций, сериализует и пишет YAML ровно один раз.

- [ ] **Step 5: Сделать отказ атомарным**

  Любая ошибка любой фазы вызывает существующий rollback candidate project state, удаление временного вывода и сброс worker state. Нельзя публиковать рабочий или смысловой промежуточный индекс как окончательное состояние.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts metadata/projectState/importSession.integration.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(rules): ♻️ разделить XML-import на три прохода`

---

## Task 10: Классифицировать ошибки как invalid/important и изменить валидацию

**Files:**

- Create: `packages/runtime/metadata/validation/xmlAnomalyBoundary.ts`
- Create: `packages/runtime/metadata/validation/xmlAnomalyBoundary.test.ts`
- Create: `packages/rules/metadata/importFromXml/classifyImportedIssues.ts`
- Create: `packages/rules/metadata/importFromXml/classifyImportedIssues.test.ts`
- Create: `packages/rules/metadata/validation/xmlAnomalyContract.ts`
- Create: `packages/rules/metadata/validation/xmlAnomalyContract.integration.test.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.ts`
- Modify: `packages/runtime/metadata/validation/validateFile.test.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/metadata/importFromXml/serializedYamlValidation.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.ts`

- [ ] **Step 1: Ввести внутреннюю структурированную ошибку**

  Падающими тестами зафиксировать, что внутренний результат содержит `yamlPath`, код и признак `semantic | infrastructure`, а публичный `Diagnostic` остаётся прежним. Только semantic-ошибка импортированного значения может стать invalid/important; сбой валидатора, повреждённый индекс и unresolved pending остаются фатальными.

- [ ] **Step 2: Зафиксировать подавление и необходимость тега**

  Проверить четыре случая: ошибочное значение без тега даёт обычную ошибку; то же импортированное значение с invalid не даёт внутренней ошибки; корректное значение с invalid/important/raw даёт `xml/anomaly-tag-unnecessary`; неверный important даёт `xml/important-not-registered` или `xml/important-required`. Диагностики внутри аномальной границы не должны вычисляться и выводиться.

- [ ] **Step 3: Подтвердить падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/importFromXml/classifyImportedIssues.test.ts metadata/validation/projectStateDependencyValidation.test.ts`

  Expected: validation знает прежние частные теги и выдаёт диагностики вместо классификационных решений.

- [ ] **Step 4: Классифицировать после окончательного индекса**

  Координатор группирует structured issues по project path и YAML-границе. По умолчанию создаётся invalid; important выбирается только при точном совпадении с регистрацией. Повторы коллекций уже invalid по адресу и не требуют important. Решения передаются соответствующему worker третьего прохода.

- [ ] **Step 5: Проверять договор самих тегов отдельно**

  `xmlAnomalyContract` проверяет место, payload, нумерацию, регистрацию important, восстановимость и необходимость. Для raw выполняется изолированный экспорт/повторный импорт границы; для invalid/important тег временно снимается. Пробные внутренние диагностики наружу не выходят и YAML автоматически не меняют.

- [ ] **Step 6: Запустить слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/validation/xmlAnomalyBoundary.test.ts metadata/validation/validateFile.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/importFromXml/classifyImportedIssues.test.ts metadata/validation/projectStateDependencyValidation.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/xmlAnomalyContract.integration.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить и зафиксировать**

  Run: `pnpm type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `feat(rules): ✨ классифицировать импортированные XML-ошибки`

---

## Task 11: Перенести известные случаи и удалить прежний механизм

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

- [ ] **Step 1: Получить механический перечень прежнего механизма**

  Run: `rg -l 'xml/(present|absent|name|type|value|reference|language|duplicate)|explicitXMLPropert|brokenXMLReference|markYAMLMappingKeyTag|XML_ANOMALY_TAGS' packages/runtime packages/rules`

  Сохранить вывод в рабочей заметке задачи и распределить каждый production-файл: удалить ветвь, заменить общей регистрацией либо оставить обычным смысловым rules.ts. Не считать задачу законченной, пока повторный `rg` не показывает production-использований прежних тегов и реестров.

- [ ] **Step 2: Переклассифицировать регрессионный корпус**

  На существующих XML-фикстурах проверить минимум: `HeaderHorizontalAlign=Auto`, `SystemEnumeration Switch`, RowFilter `xsi:nil`, I8nText с повторным языком, metadataItem с синтаксически корректной, но несуществующей целью, broken reference, explicit empty/default, нестандартное singleton-имя и повтор реквизитов.

- [ ] **Step 3: Зарегистрировать только действительно частные решения**

  RowFilter и другие однозначные компактные формы получают `compactRaw`; случаи с явно согласованной ценностью получают `important`; внешнее имя singleton получает `hiddenSingletonName`. Все остальные ошибки классифицируются общим runtime без специальных кодов.

- [ ] **Step 4: Удалить прежние теги одним переключением**

  Удалить старые definition-поля, registry methods, emitters, validators и schema types. `scalarTags.ts` после переключения содержит property-state теги, но не прежние XML-теги; новые XML-аннотации обслуживаются только `xmlAnomalyAnnotations.ts`. Старый тег в YAML должен давать syntax error.

- [ ] **Step 5: Обновить тесты, не меняя XML-фикстуры**

  Ожидания YAML заменить на raw/invalid/important. Тесты, проверявшие частный emitter, перенести на общий import/control-export/full-sync путь. Добавить отрицательный тест, что старые теги не читаются.

- [ ] **Step 6: Проверить отсутствие старого production-кода**

  Run: `rg -n 'xml/(present|absent|name|type|value|reference|language|duplicate)|explicitXMLPropert|brokenXMLReference|markYAMLMappingKeyTag' packages/runtime packages/rules --glob '!**/*.test.ts' --glob '!**/*.md'`

  Expected: нет совпадений.

- [ ] **Step 7: Запустить пакетные тесты**

  Run: `pnpm --filter @nkdk/runtime test`

  Run outside sandbox: `pnpm --filter @nkdk/rules test`

  Expected: PASS.

- [ ] **Step 8: Проверить и зафиксировать атомарный переход**

  Run: `pnpm type-check`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Commit: `refactor(rules): ♻️ заменить частные XML-аномалии общим runtime`

---

## Task 12: Проверить семейства common-типов, rules и производительность

**Files:**

- Create: `packages/rules/metadata/xmlAnomalies/commonFamilies.integration.test.ts`
- Create: `packages/rules/metadata/xmlAnomalies/rulesMutation.integration.test.ts`
- Create: `packages/rules/metadata/xmlAnomalies/synchronization.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md` only to correct discrepancies discovered by implementation, without changing approved behavior

- [ ] **Step 1: Сделать матрицу представителей 92 регистраций**

  Использовать семейства спецификации, а не 92 копии одинакового теста: scalar (bool/string/number/SE), composite (I8nText/type description), sequence, named map, nested rules.ts и infrastructure. Для каждого мутировать presence/default, текст, attribute, child, повтор, неизвестный путь, invalid context и сбой преобразователя.

- [ ] **Step 2: Проверить общие инварианты**

  Для каждой мутации утверждать одно из трёх: обычный YAML точно восстанавливает XML; импорт выдаёт минимальный raw; импорт выдаёт обратимый invalid/important. Потеря XML, обычная диагностика внутри корректного тега и неразрешённый кандидат запрещены.

- [ ] **Step 3: Проверить rules.ts на нескольких уровнях**

  Покрыть неизвестные и повторные свойства у корня, внутри `Properties`, внутри nested common object и внутри именованной коллекции. Полный путь raw должен восстанавливаться одинаково независимо от глубины.

- [ ] **Step 4: Проверить round-trip и обе синхронизации**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/xmlAnomalies/commonFamilies.integration.test.ts metadata/xmlAnomalies/rulesMutation.integration.test.ts metadata/xmlAnomalies/synchronization.integration.test.ts`

  Run: `env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh`

  Expected: тесты PASS; новые расхождения либо восстановлены тегами, либо являются перечисленными фатальными ограничениями первой версии.

- [ ] **Step 5: Измерить стоимость импорта**

  Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip/cf/erp /Users/nikita/git/nkdk-yaml/cf --runs 1 --json`

  Проверить профильные счётчики: один control export на успешный assignment; повторный разбор XML только для файлов с expanded raw; отсутствие цикла по 1839 PropertyRule с отдельным round-trip.

- [ ] **Step 6: Полная проверка перед завершением**

  Использовать `superpowers:verification-before-completion`.

  Run: `pnpm type-check`

  Run outside sandbox: `pnpm test`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Run: `pnpm duplicates -- --base c0cf08c81`

  Expected: все команды PASS; baseline dependency-cruiser не изменён.

- [ ] **Step 7: Сверить спецификацию и обновить архитектурный документ**

  Исправить в спецификации только фактические названия интерфейсов или ограничения, если реализация вынужденно отличается. В `.agents/architecture.md` заменить описание прежних частных тегов и двухпроходного импорта фактическим устройством общего `XmlAnomalyRuntime`, трёх проходов, двух индексных барьеров и общего восстановления при full/partial sync. Не добавлять в архитектурный документ неподтверждённые будущие решения.

- [ ] **Step 8: Зафиксировать окончательную проверку**

  Commit: `test(rules): ✅ проверить общий runtime XML-аномалий`
