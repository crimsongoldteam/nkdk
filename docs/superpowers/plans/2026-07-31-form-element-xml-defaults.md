# Form Element XML Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить XML-defaults элементов формы без reference XML для флагов перетаскивания, `CheckBoxType` и контекстного `Representation`.

**Architecture:** Общая orchestration получает нейтральный договор `implicitValueXML`, описывающий значение отсутствующего XML-тега. Частная XML-семантика остаётся в `rules.ts`: таблица объявляет два флага присутствия и отсутствие безусловного default у `Representation`, а флажок условно создаёт `CheckBoxType=Auto` по соседнему YAML-свойству.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm 10, rules.ts, fast-xml-parser.

## Global Constraints

- Не читать reference XML и не сохранять присутствие этих свойств в снимке конфигурации.
- Общая orchestration не знает про `Table`, `CheckBoxField`, имена XML-тегов и типы источников таблицы.
- Не добавлять частные `fromXML`/`toXML`/`fromYAML`/`toYAML`; использовать нейтральный договор и `rules.ts`.
- Не изменять существующие XML-фикстуры.
- `implicitValueXML` и `defaultValueXML` нельзя задавать одновременно.
- Для `Table.Representation` не вычислять default по `ValueTable`, `ValueTree` или `DynamicList`.
- Перед завершением выполнить mutation testing изменённых production-файлов, `pnpm type-check` и полный `pnpm test`.

---

### Task 1: Нейтральный договор `implicitValueXML`

**Files:**

- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/xmlImportPlan.ts`
- Test: `packages/core/metadata/orchestration/property/xmlImportPlan.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Test: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Test: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Test: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`

**Interfaces:**

- Produces: `BasePropertyRule.implicitValueXML?: unknown` — модельное значение, представленное отсутствием XML-узла.
- Consumes: существующий `BasePropertyRule.implicitValueYAML`, включая вычисляемое значение `DefaultValueFunction`.
- Invariant: при равенстве итогового модельного значения `implicitValueXML` XML-узел не записывается.

- [ ] **Step 0: Обновить изолированную ветку до актуального develop**

Текущая ветка создана до добавления обязательных mutation-команд. При чистом рабочем дереве включить актуальный `develop` и обновить зависимости:

```bash
git merge develop
pnpm install --frozen-lockfile
```

Проверить наличие `test:mutation` и исходный зелёный набор:

```bash
rg -n '"test:mutation"' package.json
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/xmlImportPlan.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: команды mutation доступны, исходные тесты проходят до добавления новых случаев.

- [ ] **Step 1: Расширить проверку плана XML-импорта падающим случаем**

В тестовое правило `xmlImportPlan.test.ts` добавить свойство:

```ts
implicit: { type: "string", xml: "Implicit", implicitValueXML: "xml-implicit" },
```

и изменить ожидание списка синтезируемых свойств:

```ts
expect(first.defaults.map(({ propertyKey }) => propertyKey)).toEqual(["fallback", "implicit"])
```

- [ ] **Step 2: Добавить падающую матрицу XML → YAML**

В `fromXMLToYAML.test.ts` расширить существующие проверки одиночного свойства следующими случаями без reference:

```ts
const property = {
  type: "string",
  xml: "Value",
  yaml: "Значение",
  implicitValueYAML: "yaml-default",
  implicitValueXML: "xml-implicit",
}

it.each([
  ["явное YAML-default", { Value: "yaml-default" }, {}],
  ["отсутствующий XML", {}, { Значение: "xml-implicit" }],
  ["явное отличающееся значение", { Value: "explicit" }, { Значение: "explicit" }],
])("импортирует implicitValueXML: %s", (_name, xml, expected) => {
  expect(runSingleProperty(property, xml)).toEqual(expected)
})
```

- [ ] **Step 3: Добавить падающую матрицу YAML → XML**

В `fromYAMLToXML.test.ts` использовать то же правило и проверить экспорт без reference:

```ts
it.each([
  ["отсутствующий YAML", {}, { Value: "yaml-default" }],
  ["явный XML-implicit", { Значение: "xml-implicit" }, {}],
  ["явное отличающееся значение", { Значение: "explicit" }, { Value: "explicit" }],
])("экспортирует implicitValueXML: %s", (_name, yaml, expected) => {
  const result = convertPropertiesFromYAMLToXML({
    context: context(),
    yaml,
    rule: testRule({ value: property }),
    outputs: [{ key: "owner" }],
  })
  expect(result.outputs.get("owner")).toEqual(expected)
})
```

- [ ] **Step 4: Запустить новые проверки и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/xmlImportPlan.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: проверки отсутствующего XML и YAML падают, потому что `implicitValueXML` ещё не участвует в планировании и преобразовании.

- [ ] **Step 5: Добавить поле в базовый договор rules.ts**

В `BasePropertyRule` рядом с `implicitValueYAML` добавить:

```ts
/** Значение, подразумеваемое отсутствием XML-тега; при выгрузке не пишется явно. */
implicitValueXML?: unknown
```

- [ ] **Step 6: Научить XML-импорт посещать отсутствующее свойство**

В `compileXMLImportPlan` включать в `defaults` как `defaultValue`, так и `implicitValueXML`:

```ts
const needsAbsentXMLImport =
  Object.prototype.hasOwnProperty.call(propertyRule, "defaultValue") ||
  Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueXML")

if (needsAbsentXMLImport && shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" })) {
  defaults.push(entry)
}
```

В `importMatch` до вызова обработчика типа подставлять модельное XML-значение только для отсутствующего узла:

```ts
if (!presentInXML && Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueXML")) {
  xmlValue = propertyRule.implicitValueXML
}
```

Явный пустой XML-узел продолжает обрабатываться существующими договорами `defaultValueXMLEmpty` и `preserveEmptyXML`.

- [ ] **Step 7: Научить YAML-экспорт вычислять обе стороны договора**

В `requiresYAMLToXMLEvaluation` добавить наличие `implicitValueXML`, чтобы отсутствующий YAML не пропускался ранними ветками. В проверке `sparseYAML` также не выполнять `continue`, когда свойство требует такой оценки.

При отсутствии YAML-ключа и наличии `implicitValueXML` передавать в `callAtomicFromYAML` значение `implicitValueYAML`; если оно является функцией, вызвать её с тем же набором `{ context, name, operation: "importFromYAML", yaml }`, что используется для `defaultValue`.

В `callAtomicToXML` до обработчика типа исключать значение, совпавшее с XML-implicit:

```ts
if (
  Object.prototype.hasOwnProperty.call(rule, "implicitValueXML") &&
  value === rule.implicitValueXML
) {
  return undefined
}
```

- [ ] **Step 8: Запретить конфликт двух XML-договоров**

В `implicitValueYAMLContract.test.ts` добавить рекурсивный сбор путей правил, одновременно содержащих `implicitValueXML` и `defaultValueXML`, и архитектурную проверку:

```ts
it("does not combine implicitValueXML with defaultValueXML", () => {
  const conflicts = collectRules().flatMap(({ exportName, rule }) =>
    collectConflictingXMLDefaults(rule, exportName)
  )
  expect(conflicts).toEqual([])
})
```

Обход `childCollections` должен повторять структуру существующих `collectMissingImplicitValueYAML*`.

- [ ] **Step 9: Запустить целевые тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/xmlImportPlan.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS.

- [ ] **Step 10: Зафиксировать общий механизм**

```bash
git add \
  packages/core/metadata/orchestration/property/types.ts \
  packages/core/metadata/orchestration/property/xmlImportPlan.ts \
  packages/core/metadata/orchestration/property/xmlImportPlan.test.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "feat: :sparkles: добавить implicitValueXML в rules.ts"
```

### Task 2: XML-флаги перетаскивания таблицы

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`

**Interfaces:**

- Consumes: `BasePropertyRule.implicitValueXML` из Task 1.
- Produces: симметричный no-reference round-trip для `EnableStartDrag` и `EnableDrag`.

- [ ] **Step 1: Добавить падающую проверку двух флагов таблицы**

В `elements/__tests__/fromXMLToYAML.test.ts` импортировать `TableRules` и добавить `it.each` для пар:

```ts
[
  ["EnableStartDrag", "РазрешитьНачалоПеретаскивания"],
  ["EnableDrag", "РазрешитьПеретаскивание"],
]
```

Для каждой пары проверить два no-reference цикла:

```ts
// Явный XML true исключается из YAML и восстанавливается как true.
const explicit = testMetadataItemFromXMLToYAML({
  rule: TableRules,
  xml: { _name: "Таблица", [xmlKey]: true },
  name: "Таблица",
}).yaml as Record<string, unknown>
expect(explicit).not.toHaveProperty(yamlKey)
expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml: explicit, name: "Таблица" }).xml)
  .toHaveProperty(xmlKey, true)

// Отсутствующий XML становится явным YAML false и снова не создаёт тег.
const implicit = testMetadataItemFromXMLToYAML({
  rule: TableRules,
  xml: { _name: "Таблица" },
  name: "Таблица",
}).yaml as Record<string, unknown>
expect(implicit).toHaveProperty(yamlKey, "Ложь")
expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml: implicit, name: "Таблица" }).xml)
  .not.toHaveProperty(xmlKey)
```

- [ ] **Step 2: Запустить проверку и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: FAIL — явный `true` не восстанавливается без reference, а отсутствующий XML не становится YAML `Ложь`.

- [ ] **Step 3: Объявить асимметричные defaults в TableRules**

Импортировать `booleanRule` и заменить два литеральных правила:

```ts
enableDrag: booleanRule({
  yaml: "РазрешитьПеретаскивание",
  implicitValueYAML: true,
  implicitValueXML: false,
}),
enableStartDrag: booleanRule({
  yaml: "РазрешитьНачалоПеретаскивания",
  implicitValueYAML: true,
  implicitValueXML: false,
}),
```

В архитектурной проверке defaults таблицы дополнительно проверить для обоих свойств `implicitValueXML === false`.

- [ ] **Step 4: Запустить проверки таблицы и договора defaults**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS, включая существующие XML-фикстуры без их изменения.

- [ ] **Step 5: Зафиксировать XML-флаги таблицы**

```bash
git add \
  packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: восстановить XML-флаги перетаскивания"
```

### Task 3: Контекстное `Table.Representation`

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`

**Interfaces:**

- Produces: явные `List`, `Tree`, `HierarchicalList` сохраняются; отсутствие свойства остаётся отсутствием.
- Invariant: правило не читает тип источника таблицы и не использует `implicitValueXML`.

- [ ] **Step 1: Добавить падающую no-reference матрицу Representation**

В тест элементов добавить проверки:

```ts
it.each([
  ["явный List", { _name: "Таблица", Representation: "List", DataPath: "Дерево" }, "Список", "List"],
  ["явный Tree", { _name: "Таблица", Representation: "Tree", DataPath: "Таблица" }, "Дерево", "Tree"],
])("сохраняет Representation: %s", (_name, xml, yamlValue, xmlValue) => {
  const yaml = testMetadataItemFromXMLToYAML({ rule: TableRules, xml, name: "Таблица" }).yaml
  expect(yaml).toHaveProperty("Отображение", yamlValue)
  expect(testMetadataItemFromYAMLToXML({ rule: TableRules, yaml, name: "Таблица" }).xml)
    .toHaveProperty("Representation", xmlValue)
})
```

Отдельно проверить `{ _name: "Таблица" }`: в YAML нет `Отображение`, в XML после экспорта без reference нет `Representation`.

- [ ] **Step 2: Запустить тест и подтвердить потерю List**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: случай `List` падает, потому что текущее `implicitValueYAML: "List"` удаляет явное значение.

- [ ] **Step 3: Удалить безусловный default и объявить решение явно**

В `TableRules.representation` заменить `implicitValueYAML`:

```ts
representation: {
  yaml: "Отображение",
  type: "SystemEnumeration",
  typeSE: "TableRepresentation",
  noImplicitValueYAML: true,
},
```

В `implicitValueYAMLContract.test.ts` удалить `representation: "List"` из `expectedImplicitValues` таблицы и добавить `"representation"` в `expectedNoImplicitValueYAML`.

- [ ] **Step 4: Запустить тесты Representation и defaults**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS; `List` сохраняется даже при `DataPath: "Дерево"`, а отсутствие тега не создаёт значение.

- [ ] **Step 5: Зафиксировать контекстное представление**

```bash
git add \
  packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: сохранять явное Representation таблицы"
```

### Task 4: Условный XML-default `CheckBoxType`

**Files:**

- Modify: `packages/core/metadata/forms/elements/checkBoxField/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/tests/knownXMLDefaults.ts`

**Interfaces:**

- Produces: отсутствующий `ВидФлажка` создаёт `CheckBoxType=Auto`, кроме YAML с присутствующим `ТриСостояния`.
- Consumes: `YAMLPropertySource.has(propertyKey)`; условие не сравнивает сырое YAML-значение с boolean.

- [ ] **Step 1: Добавить падающую матрицу для обоих видов поля**

Импортировать `CheckBoxFieldRules` и `TableCheckBoxFieldRules`. Для каждого правила проверить экспорт без reference:

```ts
it.each([CheckBoxFieldRules, TableCheckBoxFieldRules])(
  "$itemType восстанавливает CheckBoxType по ThreeState",
  (rule) => {
    expect(testMetadataItemFromYAMLToXML({ rule, yaml: {}, name: "Флажок" }).xml)
      .toHaveProperty("CheckBoxType", "Auto")

    const threeState = testMetadataItemFromYAMLToXML({
      rule,
      yaml: { ТриСостояния: "Истина" },
      name: "Флажок",
    }).xml
    expect(threeState).toHaveProperty("ThreeState", true)
    expect(threeState).not.toHaveProperty("CheckBoxType")

    expect(testMetadataItemFromYAMLToXML({
      rule,
      yaml: { ВидФлажка: "Выключатель" },
      name: "Флажок",
    }).xml).toHaveProperty("CheckBoxType", "Switch")
  }
)
```

- [ ] **Step 2: Запустить тест и подтвердить падение Auto**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: обычный флажок без `ВидФлажка` не получает `CheckBoxType=Auto`.

- [ ] **Step 3: Описать условный default общим правилом флажка**

В `CheckBoxFieldCommonRulesProperties.checkBoxType` добавить:

```ts
defaultValueXML: "Auto",
toXML: (source) => !source.has("threeState"),
```

Условие автоматически применяется к `CheckBoxFieldRules` и `TableCheckBoxFieldRules`; отдельных правил для двух элементов не создавать.

- [ ] **Step 4: Канонизировать известный default в ожиданиях существующих фикстур**

В `knownXMLDefaults.ts` включить новую функцию в цепочку:

```ts
export function withKnownXMLDefaults(xml: string): string {
  return withIncludeHelpInContents(withAttributeFillValue(withCheckBoxType(withTableDefaults(xml))))
}
```

`withCheckBoxType` должна обходить блоки `<CheckBoxField>...</CheckBoxField>`, оставлять без изменений блоки с существующим `CheckBoxType` или `<ThreeState>true</ThreeState>` и для остальных вставлять `<CheckBoxType>Auto</CheckBoxType>` перед первым более поздним по `xmlOrder` узлом (`ContextMenu`, `ExtendedTooltip`, `Events`) либо перед закрывающим `CheckBoxField`. Исходные XML-файлы не изменять.

- [ ] **Step 5: Запустить все тесты элементов формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: PASS для новых случаев и существующих XML-фикстур.

- [ ] **Step 6: Зафиксировать условный default флажка**

```bash
git add \
  packages/core/metadata/forms/elements/checkBoxField/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/tests/knownXMLDefaults.ts
git commit -m "fix: :bug: восстановить XML-default CheckBoxType"
```

### Task 5: Проверка мутациями и полный round-trip

**Files:**

- Verify: все production- и test-файлы Tasks 1–4
- Diagnose: `/Users/nikita/git/round-trip/cf/doc`

**Interfaces:**

- Consumes: завершённые и закоммиченные Tasks 1–4.
- Produces: подтверждение целевых договоров, отсутствие регрессий и новый список оставшихся XML-расхождений.

- [ ] **Step 1: Запустить целевой набор ещё раз**

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/orchestration/property/xmlImportPlan.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Зафиксировать mutation baseline изменённых production-файлов**

```bash
pnpm test:mutation -- --report before \
  --tests packages/core/metadata/orchestration/property/xmlImportPlan.test.ts,packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts,packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts,packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts,packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/xmlImportPlan.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.ts \
  packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/checkBoxField/rules.ts
```

Expected: отчёт без `Timeout`, `RuntimeError` и `CompileError`.

- [ ] **Step 3: Проверить уникальность новых тестов**

По `killedBy` и `coveredBy` убедиться, что:

- общая матрица обнаруживает удаление любой ветки `implicitValueXML`;
- тесты таблицы обнаруживают удаление каждого частного поля rules.ts;
- тест `Representation` обнаруживает возврат `implicitValueYAML: "List"`;
- тест флажка обнаруживает удаление `defaultValueXML` и инверсию условия `source.has("threeState")`.

Объединить только полностью дублирующие проверки; round-trip и XML-фикстурные тесты не удалять.

- [ ] **Step 4: Повторить mutation testing и сравнить результаты**

```bash
pnpm test:mutation -- --report after \
  --tests packages/core/metadata/orchestration/property/xmlImportPlan.test.ts,packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts,packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts,packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts,packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/xmlImportPlan.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.ts \
  packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/checkBoxField/rules.ts
pnpm test:mutation:compare -- before after
```

Expected: сравнение не показывает потерянных обнаруживаемых мутантов.

- [ ] **Step 5: Выполнить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
```

Expected: обе команды завершаются успешно.

- [ ] **Step 6: Убедиться, что рабочее дерево NKDK чистое**

```bash
git status --short
```

Expected: вывода нет. Если mutation-проверка потребовала усиления тестов, сначала зафиксировать их отдельным `test: :white_check_mark:` коммитом.

- [ ] **Step 7: Запустить полный YAML round-trip каталога doc**

Скрипт сам выполняет `git restore .` в XML-репозитории перед запуском и оставляет полученные diff для диагностики:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- отсутствуют удаления 1 041 `EnableDrag=true`;
- отсутствуют удаления `EnableStartDrag=true`;
- отсутствуют удаления 1 198 `Representation=List`;
- обычные флажки получают `CheckBoxType=Auto`, а трёхсостояния не получают лишний тег;
- оставшиеся diff относятся к другим ранее выявленным группам.

- [ ] **Step 8: Сохранить итоговую диагностику**

Записать количества оставшихся XML diff-файлов и отдельно проверить поиском diff, что четыре целевые категории отсутствуют. XML-репозиторий после диагностики не откатывать: diff является результатом round-trip.
