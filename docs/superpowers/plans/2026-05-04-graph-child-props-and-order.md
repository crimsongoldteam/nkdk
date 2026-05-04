# Graph Child Props And Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать дублирование дочерних коллекций в `p_*` свойствах родителя и сохранять порядок дочерних коллекций через `index` на owning-рёбрах.

**Architecture:** `buildGraphFromModel` остаётся источником истины: оно знает `rule.properties` и регистрации типов, поэтому помечает на узле ключи, материализованные через `graphChild`/`buildGraphFromModel`. `flattenItem` получает явный `skipKeys` и больше не угадывает коллекции по кириллице. Порядок дочерних узлов сохраняется при создании owning-рёбер: `graphChild` ставит `index` по порядку массива модели, `applyGraphOps` ставит `index` по порядку `children` в каждой секции.

**Tech Stack:** TypeScript 5.9, Vitest 4, `pnpm --filter @nakidka/core exec vitest run ...`.

---

## File Structure

- Modify `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`: добавить `flattenSkipKeys` в атрибуты узла и метод `addFlattenSkipKeys`.
- Modify `packages/core/metadata/orchestration/buildGraph/flattenItem.ts`: заменить эвристику `isChildCollection` на параметр `skipKeys`.
- Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`: передавать `attrs.flattenSkipKeys` в `flattenItem` и выгружать примитивные атрибуты рёбер, включая `index`.
- Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`: покрыть `skipKeys` и `index` в итоговом `FileGraphData`.
- Modify `packages/core/metadata/orchestration/buildGraphFromModel.ts`: помечать свойства с `graphChild`/`buildGraphFromModel` как `skipKeys`; ставить `index` на рёбра `graphChild`.
- Modify `packages/core/metadata/orchestration/buildGraphFromModel.test.ts` or `importMetadataFileWithGraph.test.ts`: проверить `attributes.Total` без `p_attributes_*` и индексированные owning-рёбра.
- Modify `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`: ставить `index` для `children`, если индекс не задан явно.
- Modify `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`: покрыть `index` для ручных `GraphOps.children`.
- Modify `packages/core/metadata/orchestration/property/fn.ts`: добавить `index?: number` в `GraphOpsChild`.
- Modify `packages/core/metadata/orchestration/buildGraph/types.ts`: `EdgeData.props` уже допускает `number`; изменений не требуется, только использовать существующий тип.

---

### Task 1: `flattenItem` принимает явные `skipKeys`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/flattenItem.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts`

- [ ] **Step 1: Write failing tests for explicit skipKeys**

Append these tests inside `describe("flattenItem", ...)` in `flattenItem.test.ts`:

```ts
  it("пропускает ключи, явно переданные в skipKeys", () => {
    expect(
      flattenItem(
        {
          name: "Документ",
          attributes: {
            Total: "Строка",
          },
          synonym: { items: { ru: "Документ" } },
        },
        { skipKeys: new Set(["attributes"]) },
      ),
    ).toEqual({
      p_name: "Документ",
      p_synonym_items_ru: "Документ",
    })
  })

  it("не пропускает одиночный латинский объект без skipKeys", () => {
    expect(
      flattenItem({
        name: "Документ",
        dimensions: {
          Total: "Строка",
        },
      }),
    ).toEqual({
      p_name: "Документ",
      p_dimensions_Total: "Строка",
    })
  })
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/flattenItem.test.ts
```

Expected: TypeScript/test failure because `flattenItem` does not accept the second argument, or assertion failure because the current heuristic still controls skipping.

- [ ] **Step 3: Implement explicit skipKeys**

Replace the body of `flattenItem.ts` with this shape, preserving existing imports and helper names:

```ts
import { GraphPrimitive } from "./types"

/** Поля JS-модели, которые НЕ попадают в props узла. */
const SKIP_KEYS = new Set(["itemType", "_uuid"])

export interface FlattenItemOptions {
  skipKeys?: ReadonlySet<string>
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype

const isPrimitive = (v: unknown): v is GraphPrimitive =>
  v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"

const isPrimitiveArray = (v: unknown): v is GraphPrimitive[] =>
  Array.isArray(v) && v.every(isPrimitive)

/**
 * Раскладывает поля JS-модели в плоский Record<string, GraphPrimitive | GraphPrimitive[]>:
 * - скаляры -> p_<имя>
 * - plain-объекты сплющиваются по '_' (numberQualifiers.digits -> p_numberQualifiers_digits)
 * - ключи из skipKeys не сплющиваются, потому что уже материализованы графом
 * - массивы примитивов сохраняются под p_<имя>
 * - массивы объектов и пустые массивы выкидываются
 * - itemType и _uuid выкидываются на любом уровне.
 */
export function flattenItem(
  item: unknown,
  options: FlattenItemOptions = {},
): Record<string, GraphPrimitive | GraphPrimitive[]> {
  const result: Record<string, GraphPrimitive | GraphPrimitive[]> = {}
  if (!isPlainObject(item)) return result
  flattenInto(result, "p_", item, options.skipKeys)
  return result
}

function flattenInto(
  out: Record<string, GraphPrimitive | GraphPrimitive[]>,
  prefix: string,
  obj: Record<string, unknown>,
  skipKeys: ReadonlySet<string> | undefined,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (SKIP_KEYS.has(key)) continue
    if (skipKeys?.has(key)) continue
    if (value === undefined) continue

    const fullKey = `${prefix}${key}`

    if (isPrimitive(value)) {
      out[fullKey] = value
      continue
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue
      if (isPrimitiveArray(value)) out[fullKey] = value
      continue
    }

    if (isPlainObject(value)) {
      flattenInto(out, `${fullKey}_`, value, undefined)
    }
  }
}
```

- [ ] **Step 4: Update old heuristic tests**

Remove or rewrite the two tests whose expected behavior depended on automatic child-collection detection:

- `НЕ сплющивает дочерние коллекции — объектные значения`
- `НЕ сплющивает дочерние коллекции — строковые значения (короткая форма)`

Replace them with one test that uses `skipKeys`:

```ts
  it("не сплющивает дочерние коллекции, когда ключ передан явно", () => {
    expect(
      flattenItem(
        {
          name: "Тестовый",
          codeLength: 9,
          synonym: { items: { ru: "Тест", en: "Test" } },
          attributes: {
            "Автор": { name: "Автор", type: "Ссылка", synonym: { items: { ru: "А" } } },
            Total: "Строка",
          },
          standardAttributes: {
            "Владелец": { name: "Владелец", ПроверкаЗаполнения: "Да" },
          },
        },
        { skipKeys: new Set(["attributes", "standardAttributes"]) },
      ),
    ).toEqual({
      p_name: "Тестовый",
      p_codeLength: 9,
      p_synonym_items_ru: "Тест",
      p_synonym_items_en: "Test",
    })
  })
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/flattenItem.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/buildGraph/flattenItem.ts packages/core/metadata/orchestration/buildGraph/flattenItem.test.ts
git commit -m "refactor: :recycle: передавать skipKeys в flattenItem"
```

---

### Task 2: GraphBuilder хранит ключи, исключённые из flattenItem

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Write failing test through `walkGraphToFileData`**

Add this test to `walkGraphToFileData.test.ts`:

```ts
  it("не выгружает в props ключи из flattenSkipKeys узла", () => {
    const g = new GraphBuilder()
    promote(g, "Справочник.К", "К", ["catalog.yaml"], {
      itemType: "MetadataCatalog",
      name: "К",
      attributes: { Total: "Строка" },
      synonym: { items: { ru: "К" } },
    })
    g.addFlattenSkipKeys("Справочник.К", ["attributes"])

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "catalog.yaml")!

    expect(file.nodes[0]?.props).toEqual({
      name: "К",
      filePath: "catalog.yaml",
      p_name: "К",
      p_synonym_items_ru: "К",
    })
  })
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: FAIL because `GraphBuilder` has no `addFlattenSkipKeys`.

- [ ] **Step 3: Add storage to GraphBuilder**

Update `NodeAttributes`:

```ts
export interface NodeAttributes {
  name: string | undefined
  item: unknown
  filePaths: string[]
  flattenSkipKeys: Set<string>
}
```

Update `ensureNode` initial state:

```ts
this.nodesMap.set(id, {
  name: attrs?.name,
  item: attrs?.item,
  filePaths: [],
  flattenSkipKeys: new Set(),
})
```

Add method after `setItem`:

```ts
  /** Помечает поля item, которые не должны попадать в flattenItem props. */
  addFlattenSkipKeys(id: string, keys: Iterable<string>): void {
    const node = this.getNodeAttributes(id)
    for (const key of keys) {
      node.flattenSkipKeys.add(key)
    }
  }
```

- [ ] **Step 4: Pass skipKeys in walkGraphToFileData**

Change node props construction in `walkGraphToFileData.ts`:

```ts
      Object.assign(props, flattenItem(attrs.item, { skipKeys: attrs.flattenSkipKeys }))
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/orchestration/buildGraph/flattenItem.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
git commit -m "feat: :sparkles: хранить skipKeys для props графа"
```

---

### Task 3: buildGraphFromModel помечает graphChild/buildGraphFromModel свойства как skipKeys

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Write failing integration test for graphChild skipKeys**

Add a test to `importMetadataFileWithGraph.test.ts` near existing graph import tests:

```ts
  it("не дублирует graphChild record-коллекцию в props родительского узла", () => {
    const graph = new GraphBuilder()

    importMetadataFileWithGraph({
      filePath: "Документ/Продажа/Свойства.yaml",
      sources: {
        yaml: [
          "Реквизиты:",
          "  Total: Строка",
          "  VAT:",
          "    Тип: Булево",
        ].join("\n"),
      },
      kind: "document",
      name: "Продажа",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const file = walkGraphToFileData(graph).find((f) => f.filePath === "Документ/Продажа/Свойства.yaml")!
    const parent = file.nodes.find((n) => n.id === "Документ.Продажа")!

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_attributes_"))).toBe(false)
  })
```

Imports needed at the top if absent:

```ts
import { walkGraphToFileData } from "./buildGraph/walkGraphToFileData"
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: FAIL because parent props still contain `p_attributes_Total`.

- [ ] **Step 3: Mark skipKeys in buildGraphFromModel**

In `buildGraphFromModel.ts`, after `const propType = propRule.type` and before any `continue`, add marking when a graph-materialized handler exists.

Use this pattern inside the loop:

```ts
    const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")
    const graphChildDef = getTypeRule(propType, "graphChild")
    if (buildGraphFn || graphChildDef) {
      graph.addFlattenSkipKeys(parentNodeId, [key])
    }
```

Then reuse these local constants later in the existing branches instead of declaring them again:

- remove the later `const buildGraphFn = getTypeRule(propType, "buildGraphFromModel")`;
- remove the later `const graphChildDef = getTypeRule(propType, "graphChild")`.

Keep the `extractGraph` branch before `buildGraphFromModel` and do not mark `extractGraph` as skipped; `TypeDescription` must remain mixed.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "fix: :bug: не дублировать graphChild в props"
```

---

### Task 4: graphChild рёбра получают index

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Write failing test for record collection order**

Add this test near the test from Task 3:

```ts
  it("сохраняет порядок graphChild record-коллекции через index на рёбрах", () => {
    const graph = new GraphBuilder()

    importMetadataFileWithGraph({
      filePath: "Документ/Продажа/Свойства.yaml",
      sources: {
        yaml: [
          "Реквизиты:",
          "  First: Строка",
          "  Second: Булево",
          "  Third: Число(10)",
        ].join("\n"),
      },
      kind: "document",
      name: "Продажа",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const edges = [...graph.outEdgeEntries("Документ.Продажа")]
      .filter((edge) => edge.attributes.kind === "ATTRIBUTE")
      .map((edge) => ({
        target: edge.target,
        index: edge.attributes.index,
      }))

    expect(edges).toEqual([
      { target: "Документ.Продажа.Реквизит.First", index: 0 },
      { target: "Документ.Продажа.Реквизит.Second", index: 1 },
      { target: "Документ.Продажа.Реквизит.Third", index: 2 },
    ])
  })
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: FAIL because `edge.attributes.index` is undefined.

- [ ] **Step 3: Add index to graphChild edges**

Change the `graphChild` loop in `buildGraphFromModel.ts`:

```ts
    for (const [index, item] of (modelValue as Array<Record<string, unknown>>).entries()) {
      const idSuffix = item[graphChildDef.idFrom] as string | undefined
      if (!idSuffix) continue

      const childNodeId = graphChildDef.nodeSegment
        ? `${parentNodeId}.${graphChildDef.nodeSegment}.${idSuffix}`
        : `${parentNodeId}.${idSuffix}`
      const itemYamlMap = collectionYamlMap ? findSubmap(collectionYamlMap, idSuffix) : undefined

      graph.ensureNode(childNodeId, { name: idSuffix })
      graph.addFilePath(childNodeId, filePath)
      graph.setItem(childNodeId, item)
      graph.ensureEdge(parentNodeId, childNodeId, graphChildDef.edgeKind, {
        yaml: graphChildDef.edgeYaml,
        index,
      })

      buildGraphFromModel({
        model: item,
        yamlMap: itemYamlMap,
        rule: graphChildDef.itemRule,
        graph,
        parentNodeId: childNodeId,
        filePath,
      })
    }
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "feat: :sparkles: сохранять порядок graphChild рёбер"
```

---

### Task 5: GraphOps.children рёбра получают index и выгружают его в FileGraphData

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Write failing test for applyGraphOps index**

Add to `applyGraphOps.test.ts`:

```ts
  it("ставит index на owning-рёбра children по порядку children", () => {
    const graph = new GraphBuilder()
    graph.ensureNode("P", { name: "P" })

    applyGraphOps(
      {
        children: [
          { idSuffix: "A", name: "A", item: { itemType: "Child", name: "A" } },
          { idSuffix: "B", name: "B", item: { itemType: "Child", name: "B" } },
        ],
      },
      { graph, parentNodeId: "P", filePath: "p.yaml", edgeKind: "VALUE", edgeYaml: "Значение" },
    )

    const edges = [...graph.outEdgeEntries("P")].map((edge) => ({
      target: edge.target,
      index: edge.attributes.index,
    }))

    expect(edges).toEqual([
      { target: "P.A", index: 0 },
      { target: "P.B", index: 1 },
    ])
  })
```

- [ ] **Step 2: Write failing test for FileGraphData edge props**

Add to `walkGraphToFileData.test.ts`:

```ts
  it("выгружает числовой index из атрибутов ребра в props", () => {
    const g = new GraphBuilder()
    promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
    promote(g, "B", "B", ["a.yaml"], { itemType: "Y" })
    g.ensureEdge("A", "B", "ATTRIBUTE", { yaml: "Реквизит", index: 3 })

    const result = walkGraphToFileData(g)
    const file = result.find((f) => f.filePath === "a.yaml")!

    expect(file.edges).toEqual([
      { src: "A", tgt: "B", kind: "ATTRIBUTE", props: { yaml: "Реквизит", index: 3 } },
    ])
  })
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: FAIL because `index` is missing from `applyGraphOps` and `walkGraphToFileData` only emits `yaml`.

- [ ] **Step 4: Add index to GraphOpsChild type**

In `property/fn.ts`, extend `GraphOpsChild`:

```ts
  /** Порядок owning-ребра внутри коллекции. Если не задан, applyGraphOps ставит индекс по порядку children. */
  index?: number
```

Place it after `positionFrom`.

- [ ] **Step 5: Add index in applyGraphOps**

Change the children loop:

```ts
  for (const [index, child] of (ops.children ?? []).entries()) {
```

Change `ensureEdge` attrs:

```ts
    graph.ensureEdge(edgeSource, childNodeId, edgeKind, {
      yaml: edgeYaml,
      index: child.index ?? index,
    })
```

- [ ] **Step 6: Export primitive edge attributes in walkGraphToFileData**

In `walkGraphToFileData.ts`, replace edge props creation with:

```ts
      const edgeProps: Record<string, string | number | boolean | null> = {
        yaml: typeof yamlValue === "string" ? yamlValue : "",
      }
      for (const [key, value] of Object.entries(attributes)) {
        if (key === "kind" || key === "yaml") continue
        if (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          edgeProps[key] = value
        }
      }
```

Do not export `positionFrom`; it is an object and not a FalkorDB primitive.

- [ ] **Step 7: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
git commit -m "feat: :sparkles: сохранять index owning-рёбер"
```

---

### Task 6: StandardAttributeDescriptions сохраняет index и не дублируется в props

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Write failing test for StandardAttributeDescriptions**

Add a test to `importMetadataFileWithGraph.test.ts`:

```ts
  it("сохраняет порядок StandardAttributeDescriptions через index и не дублирует props родителя", () => {
    const graph = new GraphBuilder()

    importMetadataFileWithGraph({
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      sources: {
        yaml: [
          "СтандартныеРеквизиты:",
          "  Владелец:",
          "    ПроверкаЗаполнения: ВыдаватьОшибку",
          "  Родитель:",
          "    ПроверкаЗаполнения: НеПроверять",
        ].join("\n"),
      },
      kind: "catalog",
      name: "Контрагенты",
      graph,
      context: { version: "2.20", defaultLanguage: "ru" },
    })

    const file = walkGraphToFileData(graph).find((f) => f.filePath === "Справочник/Контрагенты/Свойства.yaml")!
    const parent = file.nodes.find((n) => n.id === "Справочник.Контрагенты")!
    const edges = [...graph.outEdgeEntries("Справочник.Контрагенты")]
      .filter((edge) => edge.attributes.kind === "STANDARD_ATTRIBUTE")
      .map((edge) => edge.attributes.index)

    expect(Object.keys(parent.props).some((key) => key.startsWith("p_standardAttributes_"))).toBe(false)
    expect(edges.every((index) => typeof index === "number")).toBe(true)
    expect(edges).toEqual(edges.map((_, index) => index))
  })
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: FAIL if `index` is missing on `STANDARD_ATTRIBUTE` edges or parent props include `p_standardAttributes_*`.

- [ ] **Step 3: Add explicit index in standard attributes builder**

In `standardAttributeDescription/registerCollectionRule.ts`, change:

```ts
  for (const [internalName, russianName] of Object.entries(stdAttrRule.standartAttributeNames)) {
```

to:

```ts
  for (const [index, [internalName, russianName]] of Object.entries(stdAttrRule.standartAttributeNames).entries()) {
```

Add `index` to each child:

```ts
      index,
```

inside `children.push({ ... })`, after `positionFrom`.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "feat: :sparkles: индексировать стандартные реквизиты"
```

---

### Task 7: Fix graph package batch-size regression from review

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Test: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Verify existing failing test**

Run:

```bash
pnpm --filter @nakidka/graph test
```

Expected: FAIL in `tests/operations.test.ts > mergeNodes > режет на батчи по 5000`, because `BATCH_SIZE` is `10`.

- [ ] **Step 2: Restore BATCH_SIZE**

In `operations.ts`, change:

```ts
export const BATCH_SIZE = 10
```

to:

```ts
export const BATCH_SIZE = 5000
```

- [ ] **Step 3: Run graph tests and commit**

Run:

```bash
pnpm --filter @nakidka/graph test
```

Expected: PASS.

Commit:

```bash
git add packages/graph/src/internal/operations.ts
git commit -m "fix: :bug: вернуть размер батча графа"
```

---

### Task 8: Full verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run focused core graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/flattenItem.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/orchestration/buildGraph/internal/applyGraphOps.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run package graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Review git history**

Run:

```bash
git log --oneline -8
git status --short
```

Expected: recent commits correspond to tasks above; working tree is clean.
