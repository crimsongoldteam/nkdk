# Table DynamicList Cypher Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить экспорт `Table.Period` и `Table.TopLevelParent`, чтобы они появлялись в XML, когда `Table.dataPath` указывает на реквизит формы простого типа `DynamicList`.

**Architecture:** `TableRules` использует `cypherPredicate`, но запрос должен читать текущую графовую модель форм: `FORM_ATTRIBUTE` и property `p_type_type`, а не старую связку `ATTRIBUTE` + `VALUE_TYPE`. Element-тесты не поднимают FalkorDB: существующая `dynamicList`-фикстура передаёт `contextAttributes`, а `testExportElementToXML` собирает из них `CypherCache` с тем же ключом запроса, который использует `TableRules`.

**Tech Stack:** TypeScript 5.9, vitest 4, pnpm, `@nakidka/core`, XML helpers проекта, `round-trip-xml`.

---

## Файловая структура

**Модифицируем:**

- `packages/core/metadata/forms/elements/table/rules.ts` — заменить Cypher-запрос у `period` и `topLevelParent` на запрос по `FORM_ATTRIBUTE` и `p_type_type`.
- `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts` — закрепить новый ключ кеша и поведение для `dataPath: "Список"` / `"Список.Поле"`.
- `packages/core/tests/element/exportElementToXML.ts` — обновить мок `CypherCache` для `contextAttributes`, чтобы он соответствовал новому запросу.
- `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts` — закрепить инвариант: простой тип `DynamicList` хранится в props узла и не требует `VALUE_TYPE`-ребра.

**Не создаём:**

- отдельный round-trip reproducer полной формы;
- тестовую FalkorDB для form-элементов;
- новые правила `fromXML/toXML/fromYAML/toYAML`.

---

### Task 1: Обновить unit-тесты `Table` под новую графовую модель

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Заменить содержимое теста на проверки нового Cypher-ключа**

В `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts` заменить файл целиком:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules } from "./rules"
import type { Table } from "./types"

const dynamicListQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'

function exportTableWithRows(table: Table, rows: Record<string, unknown>[] | undefined): Record<string, unknown> {
  const context = mockContextToXML()

  if (rows !== undefined) {
    const cache = new CypherCache()
    cache.set(dynamicListQuery, rows)
    context.exportToXML!.cypherCache = cache
  }

  return exportPropertiesToXML({
    context,
    metadata: table,
    rule: TableRules,
  }) as Record<string, unknown>
}

describe("Table CypherPredicate — period и topLevelParent", () => {
  it("экспортирует period и topLevelParent, когда dataPath равен имени DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список",
        id: undefined,
      },
      [{ name: "Список" }],
    )

    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("экспортирует period и topLevelParent, когда dataPath начинается с имени DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [{ name: "Список" }],
    )

    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда dataPath НЕ указывает на DynamicList-реквизит", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [{ name: "ДругойРеквизит" }],
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш пуст", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      [],
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })

  it("НЕ экспортирует period и topLevelParent, когда кеш отсутствует в контексте", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Список.Колонка",
        id: undefined,
      },
      undefined,
    )

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он красный**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: `FAIL`; первые два теста не находят строки в `CypherCache`, потому что `TableRules` пока использует старый Cypher-запрос.

- [ ] **Step 3: Commit красного теста**

```bash
git add packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "test: ✅ закрепить Cypher-условие Table для DynamicList"
```

---

### Task 2: Обновить `TableRules` на `FORM_ATTRIBUTE` и `p_type_type`

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Добавить общий текст запроса в `rules.ts`**

В `packages/core/metadata/forms/elements/table/rules.ts` после импортов добавить константу:

```ts
const dynamicListFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'
```

- [ ] **Step 2: Заменить запрос у `period`**

В свойстве `period.toXML` заменить старый `query`:

```ts
query: "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
```

на:

```ts
query: dynamicListFormAttributeQuery,
```

- [ ] **Step 3: Заменить запрос у `topLevelParent`**

В свойстве `topLevelParent.toXML` заменить старый `query`:

```ts
query: "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name",
```

на:

```ts
query: dynamicListFormAttributeQuery,
```

- [ ] **Step 4: Запустить unit-тест `Table`**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: `PASS`; 5 тестов зелёные.

- [ ] **Step 5: Commit реализации правила**

```bash
git add packages/core/metadata/forms/elements/table/rules.ts
git commit -m "fix: 🐛 читать DynamicList-реквизиты формы из графовых props"
```

---

### Task 3: Обновить мок `CypherCache` в element-тестах

**Files:**

- Modify: `packages/core/tests/element/exportElementToXML.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Запустить существующий element-тест `dynamicList` и убедиться, что он красный**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toXML.test.ts -t "Table dynamicList"
```

Expected: `FAIL`; `dynamicList.xml` ожидает `Period` и `TopLevelParent`, но helper кладёт строки в кеш под старым ключом запроса.

- [ ] **Step 2: Обновить текст запроса в helper**

В `packages/core/tests/element/exportElementToXML.ts` заменить:

```ts
const dynamicListQuery =
  "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:FormAttribute)-[:VALUE_TYPE]->(:Type {name: 'DynamicList'}) RETURN a.name AS name"
```

на:

```ts
const dynamicListQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'
```

Фильтрация `contextAttributes` остаётся прежней:

```ts
const rows = contextAttributes
  .filter(
    (attr) =>
      attr.itemType === "FormAttribute" &&
      Array.isArray(attr.type?.type) &&
      attr.type.type.includes("DynamicList")
  )
  .map((attr) => ({ name: attr.name }))
```

- [ ] **Step 3: Перезапустить element-тест `dynamicList`**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toXML.test.ts -t "Table dynamicList"
```

Expected: `PASS`; XML для `dynamicList` содержит `Period` и `TopLevelParent`.

- [ ] **Step 4: Запустить все XML export-тесты form-элементов**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toXML.test.ts
```

Expected: `PASS`; regressions в form-элементах нет.

- [ ] **Step 5: Commit обновления helper**

```bash
git add packages/core/tests/element/exportElementToXML.ts
git commit -m "test: ✅ обновить мок CypherCache для DynamicList таблицы"
```

---

### Task 4: Закрепить инвариант `TypeDescription` для простого `DynamicList`

**Files:**

- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`

- [ ] **Step 1: Добавить импорт `walkGraphToFileData`**

В `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts` после импорта `GraphBuilder` добавить:

```ts
import { walkGraphToFileData } from "~/metadata/orchestration/buildGraph/walkGraphToFileData"
```

- [ ] **Step 2: Добавить unit-тест для `extractTypeDescriptionGraph`**

В `describe("extractTypeDescriptionGraph", () => { ... })` после теста `"примитив без точки (string) → undefined"` добавить:

```ts
it("простой тип DynamicList → undefined", () => {
  const model: TypeDescription = { type: ["DynamicList"] }
  expect(extractTypeDescriptionGraph(model)).toBeUndefined()
})
```

- [ ] **Step 3: Добавить интеграционный тест для props узла формы**

В конец `describe("extractTypeDescriptionGraph — интеграция с importMetadataFileWithGraph", () => { ... })` добавить тест перед закрывающей `})`:

```ts
it("реквизит формы с Тип: DynamicList хранит тип в props и не создаёт VALUE_TYPE-ребро", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: {
      yaml: `
Реквизиты:
  Список:
    Тип: DynamicList
`,
    },
    kind: "form",
    name: "ФормаВыбора",
    graph,
    context: baseContext,
    ownerNodeId: "Справочник.Товары",
  })

  const attrNodeId = "Справочник.Товары.Форма.ФормаВыбора.Реквизит.Список"
  expect(graph.hasNode(attrNodeId)).toBe(true)

  const valueTypeEdges = [...graph.outEdgeEntries(attrNodeId)].filter(
    (e) => e.attributes.kind === "VALUE_TYPE"
  )
  expect(valueTypeEdges).toHaveLength(0)

  const fileGraphData = walkGraphToFileData(graph)
  const segment = fileGraphData.find((item) => item.declaredNodeIds.includes(attrNodeId))
  const attrNode = segment?.nodes.find((node) => node.id === attrNodeId)

  expect(attrNode?.label).toBe("FormAttribute")
  expect(attrNode?.props.p_type_type).toEqual(["DynamicList"])
})
```

- [ ] **Step 4: Запустить тесты `TypeDescription`**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: `PASS`; простой `DynamicList` не создаёт ссылочных рёбер и остаётся в props.

- [ ] **Step 5: Commit графового инварианта**

```bash
git add packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
git commit -m "test: ✅ закрепить простой DynamicList в props графа"
```

---

### Task 5: Финальная проверка и short round-trip

**Files:**

- Verify: `packages/core/metadata/forms/elements/table/rules.ts`
- Verify: `packages/core/tests/element/exportElementToXML.ts`
- Verify: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Verify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`

- [ ] **Step 1: Запустить узкие тесты одним набором**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: `PASS`; unit, element XML export и графовый инвариант зелёные.

- [ ] **Step 2: Запустить short round-trip**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: один из двух успешных вариантов:

- вывод содержит `=== Round-trip чистый ===`;
- или `FIRST_DIFF_FILE` указывает на другой diff, а старый diff `Catalogs/АктыОтбораПробЗЕРНО/Forms/ФормаВыбора/Ext/Form.xml` больше не показывает потерю `Period` и `TopLevelParent`.

Если команда падает на доступе к `/Users/nikita/git/round-trip-source`, повторить её с разрешением на запуск вне песочницы, потому что скрипт делает `git restore .` в XML-репозитории.

- [ ] **Step 3: Запустить полный проектный тест**

Run:

```bash
pnpm test
```

Expected: `PASS`; все пакеты `packages/*` зелёные.

- [ ] **Step 4: Проверить итоговый diff**

Run:

```bash
git diff --stat
```

Expected: изменены только файлы из этого плана:

```text
packages/core/metadata/forms/elements/table/rules.ts
packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
packages/core/tests/element/exportElementToXML.ts
packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

- [ ] **Step 5: Финальный commit**

Если после Task 1–4 остались только проверочные правки или форматирование, зафиксировать их:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts \
        packages/core/metadata/forms/elements/table/cypherPredicate.test.ts \
        packages/core/tests/element/exportElementToXML.ts \
        packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
git commit -m "fix: 🐛 восстановить Period для DynamicList таблиц"
```

Если рабочее дерево чистое, этот шаг пропустить.
