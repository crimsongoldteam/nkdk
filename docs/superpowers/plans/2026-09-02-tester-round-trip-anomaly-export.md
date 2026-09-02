# Tester Round-Trip Anomaly Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить два падения синхронизации Tester и общий экспорт raw для элементов формы с различающимися `itemType` и `xmlTag`.

**Architecture:** Runtime разрешает неразрешимый UUID только по точной семантической аннотации его YAML-вхождения, не ослабляя обычную проверку metadata-ссылок. Предметное правило `TableInputField` задаёт подтверждённый XML-порядок, а нейтральный full-sync использует физический `xmlTag` только на границе сопоставления raw с уже экспортированным элементом.

**Tech Stack:** TypeScript 7, Vitest, NKDK metadata rule runtime, XML anomaly runtime, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-02-tester-round-trip-anomaly-export-design.md`

## Global Constraints

- База сравнения: `0c879181b23384cfa868d63d0765f455d021f3eb`.
- Не изменять существующие XML-фикстуры.
- Не добавлять новые применения `!xml/raw`, `!xml/invalid` или `!xml/important`.
- UUID без точной семантической аннотации продолжает считаться ошибкой.
- Не добавлять частные проверки `itemType` в runtime и full-sync.
- Не расширять `BasePropertyRule`, `PropertyRule` или параметры построителей правил.
- После каждого законченного слоя выполнять проверку новых дублей относительно базы.
- Полные LMDB-зависимые проверки и round-trip запускать вне песочницы.

---

### Task 1: Точная семантическая аннотация metadata-ссылки

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/tests/directConversion.ts`
- Modify: `packages/rules/metadata/commonObjects/rootCommandInterface/fromYAMLToXML.integration.test.ts`

**Interfaces:**
- Consumes: `MetadataTargetOccurrence.location`, исходное YAML-дерево и `XmlAnomalyAnnotations`.
- Produces: политика `allowUnresolvedUuid`, принимающая либо `true` для контрольного экспорта, либо функцию `(occurrence) => boolean` для точного YAML-вхождения.
- Preserves: действующий безусловный режим `isXmlImportControlExportContext(context)` и ошибку для UUID без тега.

- [x] **Step 1: Write the failing tagged UUID test**

Расширить `testMetadataItemFromYAMLToXML` параметром:

```ts
annotations?: XmlAnomalyAnnotations
```

и передать его в `convertMetadataItemFromYAMLToXML`. В тесте
`RootCommandInterface YAML → XML` разобрать YAML:

```yaml
ПорядокПодсистем:
  - !xml/invalid 12345678-1234-4234-9234-123456789abc
```

Передать `parsed.data` и `parsed.annotations` в прямой экспорт и проверить
`<Subsystem>12345678-1234-4234-9234-123456789abc</Subsystem>`. Существующий
тест `отклоняет UUID вместо ссылки на подсистему` оставить без изменения как
отрицательную границу.

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/commonObjects/rootCommandInterface/fromYAMLToXML.integration.test.ts
```

Expected: новый тест падает с сообщением о неизвестной metadata-ссылке; старый
тест без тега проходит.

- [x] **Step 3: Add occurrence-specific unresolved UUID policy**

В `metadataTargetOccurrences.ts` заменить булев параметр на объединение:

```ts
readonly allowUnresolvedUuid?:
  | boolean
  | ((occurrence: MetadataTargetOccurrence) => boolean)
```

Перед выбросом ошибки вычислять:

```ts
const allowUnresolvedUuid =
  params.allowUnresolvedUuid === true ||
  (typeof params.allowUnresolvedUuid === "function" &&
    params.allowUnresolvedUuid(occurrence))
if (allowUnresolvedUuid && isMDObjectRefUuid(text)) continue
```

- [x] **Step 4: Connect annotations without cloning them**

В оба вызова `importMetadataTargetsFromYAML` — fused и обычный — передать
`yaml` и `annotations`. Расширить локальные параметры функции и сформировать
политику:

```ts
allowUnresolvedUuid: isXmlImportControlExportContext(params.context)
  ? true
  : (occurrence) => isAcceptedSemanticOccurrence({
      yaml: params.yaml,
      annotations: params.annotations,
      occurrence,
    })
```

`isAcceptedSemanticOccurrence`:

- для `location.kind === "value"` находит родителя по
  `location.path.slice(0, -1)` и читает `annotations.at(parent, key)`;
- для `location.kind === "key"` находит отображение по `location.path` и читает
  `annotations.keyAt(parent, location.key)`;
- возвращает `true` только для `invalid` и `important`;
- при отсутствующем YAML, annotations, родителе или ключе возвращает `false`.

Клон `prepared` по-прежнему содержит только изменяемое значение и runtime
metadata; таблица аннотаций остаётся связана с исходным YAML.

- [x] **Step 5: Run focused tests and type-check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/commonObjects/rootCommandInterface/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
```

Expected: tagged UUID exports unchanged, untagged UUID is rejected, type-check
and duplicate check pass.

- [x] **Step 6: Commit the layer**

```bash
git add packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/rules/tests/directConversion.ts packages/rules/metadata/commonObjects/rootCommandInterface/fromYAMLToXML.integration.test.ts
git commit -m "fix(runtime): учитывать принятые metadata-ссылки"
```

### Task 2: Канонический порядок TableInputField

**Files:**
- Modify: `packages/rules/metadata/forms/elements/__tests__/roundTrip.integration.test.ts`
- Modify: `packages/rules/metadata/forms/elements/inputField/rules.ts`

**Interfaces:**
- Consumes: `TableInputFieldRules.xmlOrder`.
- Produces: XML нового табличного поля, где `FixingInTable` предшествует
  `CellHyperlink`.
- Preserves: обычный `InputFieldRules` и правила остальных табличных полей.

- [x] **Step 1: Write the failing canonical-order test**

В существующий `describe("элементы формы XML → YAML → XML")` добавить отдельный
случай, который экспортирует `TableInputField` без reference XML:

```ts
const result = testMetadataItemFromYAMLToXML({
  rule: TableInputFieldRules,
  name: "Колонка",
  yaml: {
    ФиксацияВТаблице: "Право",
    ГиперссылкаЯчейки: "Истина",
  },
}).xml
const xml = xmlExport({ InputField: result }, false)
expect(xml.indexOf("<FixingInTable>")).toBeLessThan(
  xml.indexOf("<CellHyperlink>"),
)
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/forms/elements/__tests__/roundTrip.integration.test.ts -t "выгружает фиксацию"
```

Expected: новый тест показывает обратный текущий порядок.

- [x] **Step 3: Correct the declarative order**

В `TableInputFieldRules.xmlOrder` заменить:

```ts
"cellHyperlink",
"fixingInTable",
```

на:

```ts
"fixingInTable",
"cellHyperlink",
```

Не менять `InputFieldRules` и XML-фикстуры.

- [x] **Step 4: Run focused tests and duplicate check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/forms/elements/__tests__/roundTrip.integration.test.ts -t "выгружает фиксацию"
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
```

Expected: новый порядок, type-check и проверка дублей проходят. Полный набор
element round-trip повторно выполняется в общей проверке репозитория.

- [x] **Step 5: Commit the layer**

```bash
git add packages/rules/metadata/forms/elements/__tests__/roundTrip.integration.test.ts packages/rules/metadata/forms/elements/inputField/rules.ts
git commit -m "fix(forms): исправить порядок свойств табличного поля"
```

### Task 3: Raw текущего элемента по физическому xmlTag

**Files:**
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`

**Interfaces:**
- Consumes: необязательный существующий `xmlTag` правила элемента формы.
- Produces: нейтральная функция `physicalItemTag(rule)`, возвращающая `xmlTag`
  либо `itemType`.
- Preserves: `$item` только для текущего экспортного claim и одиночного
  публичного сегмента; неизвестный сегмент не становится текущим элементом.

- [x] **Step 1: Write the failing full-serialization test**

В `xmlAnomalyAssignment.integration.test.ts` экспортировать форму:

```yaml
Элементы:
  Таблица:
    Вид: ТаблицаФормы
    Элементы:
      Колонка:
        Вид: ПолеВвода
        ФиксацияВТаблице: Право
        ГиперссылкаЯчейки: Истина
        "@Form\InputField": !xml/raw
          $xml:
            "#order": [FixingInTable, CellHyperlink, ContextMenu, ExtendedTooltip]
```

Проверить через `parseXmlDocumentWithSaxes`, что внутри `Table/ChildItems`
существует ровно один `InputField`, у него нет дочернего `InputField`, а порядок
элементов начинается с `FixingInTable` и `CellHyperlink`.

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
```

Expected: подготовка или сборка XML падает на пути `InputField\InputField` либо
на `#order` с пустым содержимым.

- [x] **Step 3: Resolve the physical current-item tag**

Рядом с `rawBoundary` добавить нейтральный переходник:

```ts
function physicalItemTag(rule: MetadataItemRule | undefined): string | undefined {
  if (rule === undefined) return undefined
  if ("xmlTag" in rule && typeof rule.xmlTag === "string") return rule.xmlTag
  return rule.itemType
}
```

В `claimsCurrentItem` сравнивать единственный публичный сегмент с
`physicalItemTag(params.rule)`. Остальные условия `exportClaimId`,
`property === undefined` и длины пути оставить без изменений.

- [x] **Step 4: Run focused tests and duplicate check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
```

Expected: новый тест сериализует одну колонку, остальные raw-тесты проходят,
новых дублей нет.

- [x] **Step 5: Commit the layer**

```bash
git add packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts
git commit -m "fix(xml): применять raw к физическому тегу элемента"
```

### Task 4: Необязательное пространство имён dcssch

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/namespaces.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: корневой XML формы и существующие collector/export runtime
  configuration index.
- Produces: состояние `present`/`absent` по дочернему logicalAddress формы.
- Preserves: полный набор пространств имён у новой формы без записи в индексе.

- [x] **Step 1: Write the failing namespace round-trip test**

Импортировать форму без `_xmlns:dcssch` через `createDirectRoundTripContexts`,
экспортировать полученный YAML без reference XML и проверить отсутствие
`_xmlns:dcssch`. Отдельно закрепить, что присутствующее объявление сохраняется.

- [x] **Step 2: Run the test to verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts -t "пространство имён dcssch"
```

Expected: форма без объявления получает `_xmlns:dcssch` при экспорте.

- [x] **Step 3: Store and restore namespace presence**

В конкретном адаптере формы вычислять адрес через
`childUid(logicalAddress, "XMLNamespace", "dcssch")`. На импорте записывать
`present` либо `absent`; на экспорте читать состояние, переносить его в новый
collector и исключать объявление только для `absent`. Если записи нет,
использовать прежний полный набор пространств имён.

- [x] **Step 4: Run focused tests, type-check and duplicate check**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts -t "пространство имён dcssch"
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
```

- [x] **Step 5: Commit the layer**

```bash
git add packages/rules/metadata/forms/clientApplicationForm/namespaces.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
git commit -m "fix(forms): сохранять необязательное пространство имён"
```

### Task 5: Общая проверка и Tester round-trip

**Files:**
- Verify: все изменения после `0c879181b23384cfa868d63d0765f455d021f3eb`
- Verify: `/Users/nikita/git/round-trip-compact/cf/Tester_1_0_10_34_setup1c`

**Interfaces:**
- Consumes: свежая сборка MCP из текущего worktree.
- Produces: подтверждённый XML → YAML → XML без ошибок и расхождений.

- [x] **Step 1: Run all targeted regressions together**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/commonObjects/rootCommandInterface/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/forms/elements/__tests__/roundTrip.integration.test.ts -t "выгружает фиксацию"
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
```

- [x] **Step 2: Run repository checks**

```bash
pnpm type-check
pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
pnpm test:architecture:rules
pnpm test:architecture
pnpm test
```

`pnpm test` запускать вне песочницы. Если сработает исходная нестабильная
проверка длительности, зафиксировать отдельно список пройденных assertions,
повторить прогон и не скрывать базовое расхождение.

- [x] **Step 3: Run Tester round-trip with the worktree MCP**

Сначала убедиться, что XML-репозиторий чист:

```bash
git -C /Users/nikita/git/round-trip-compact status --short
```

Затем из корня worktree выполнить вне песочницы:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Tester_1_0_10_34_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: import и sync завершаются успешно, итоговый `git diff --no-index` не
обнаруживает XML-расхождений.

- [x] **Step 4: Final diff inventory**

```bash
git status --short
git diff --stat 0c879181b23384cfa868d63d0765f455d021f3eb
git diff 0c879181b23384cfa868d63d0765f455d021f3eb
```

Проверить, что в diff входят только спецификация, план, три исправления и их
регрессионные тесты.

- [ ] **Step 5: Independent conformance review**

Передать независимому reviewer:

- спецификацию `docs/superpowers/specs/2026-09-02-tester-round-trip-anomaly-export-design.md`;
- этот план;
- базу `0c879181b23384cfa868d63d0765f455d021f3eb`;
- worktree `/Users/nikita/git/nkdk/.worktrees/tester-round-trip-fixes`.

Reviewer проверяет весь committed, staged, unstaged и относящийся к реализации
untracked diff. При `CHANGES_REQUIRED` исправить все замечания, повторить
затронутые проверки и вернуть тому же reviewer полный обновлённый diff до
`APPROVED`.
