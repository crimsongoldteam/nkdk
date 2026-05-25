# TypeDescription Reference Props Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать ссылочные элементы `TypeDescription.type` из `p_*` свойств узла, сохранив их как `TYPE`-ребра.

**Architecture:** `extractTypeDescriptionGraph` остаётся источником `TYPE`-рёбер и получает общий предикат ссылочного типа. `GraphBuilder` хранит точечные преобразователи `item` перед `flattenItem`, а `walkGraphToFileData` применяет их при выгрузке свойств узла. `TypeDescription` регистрирует такой преобразователь для свойства, из которого уже извлечены ссылки.

**Tech Stack:** TypeScript, Vitest, существующий metadata graph слой (`GraphBuilder`, `buildGraphFromModel`, `walkGraphToFileData`, `TypeDescription` rules).

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts`
  - Вынести распознавание ссылочного элемента типа в экспортируемую функцию.
  - Добавить обработчик, который удаляет из `TypeDescription.type` только ссылочные элементы.
- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`
  - Зафиксировать контракт для `EnumRef`, смешанного типа, `DynamicList` и qualifiers.
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
  - Добавить хранение преобразователей `item` для узла.
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`
  - Покрыть добавление преобразователей.
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
  - Применять преобразователи перед `flattenItem`.
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`
  - Покрыть, что преобразователь влияет только на props и не меняет исходный `item`.
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
  - При успешном `extractGraph` попросить типовой обработчик добавить преобразователь к родительскому узлу.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Расширить `GraphOps` полем преобразователей `item` перед выгрузкой props.

## Task 1: GraphBuilder Item Transformers

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `GraphBuilder.test.ts` near the `addFlattenSkipKeys` block:

```ts
describe("GraphBuilder: item flatten transforms", () => {
  it("addItemFlattenTransform добавляет преобразователи в порядке регистрации", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")

    const first = (item: unknown): unknown =>
      item && typeof item === "object" ? { ...(item as Record<string, unknown>), first: true } : item
    const second = (item: unknown): unknown =>
      item && typeof item === "object" ? { ...(item as Record<string, unknown>), second: true } : item

    g.addItemFlattenTransform("X", first)
    g.addItemFlattenTransform("X", second)

    expect(g.getNodeAttributes("X").itemFlattenTransforms).toEqual([first, second])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
```

Expected: FAIL because `itemFlattenTransforms` and `addItemFlattenTransform` do not exist.

- [ ] **Step 3: Implement minimal GraphBuilder support**

In `GraphBuilder.ts`, add a type alias and field:

```ts
export type ItemFlattenTransform = (item: unknown) => unknown

export interface NodeAttributes {
  name: string | undefined
  item: unknown
  filePaths: string[]
  contributedFilePaths: string[]
  flattenSkipKeys: Set<string>
  itemFlattenTransforms: ItemFlattenTransform[]
}
```

In `ensureNode`, initialize the new field:

```ts
this.nodesMap.set(id, {
  name: attrs?.name,
  item: attrs?.item,
  filePaths: [],
  contributedFilePaths: [],
  flattenSkipKeys: new Set(),
  itemFlattenTransforms: [],
})
```

Add the method near `addFlattenSkipKeys`:

```ts
/** Добавляет преобразователь item перед flattenItem props. */
addItemFlattenTransform(id: string, transform: ItemFlattenTransform): void {
  const node = this.getNodeAttributes(id)
  node.itemFlattenTransforms.push(transform)
}
```

Update the first `ensureNode создаёт узел` expectation in `GraphBuilder.test.ts` to include:

```ts
itemFlattenTransforms: [],
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
```

Expected: PASS.

## Task 2: Apply Item Transformers During File Data Export

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `walkGraphToFileData.test.ts`:

```ts
it("применяет itemFlattenTransforms перед flattenItem и не меняет исходный item", () => {
  const g = new GraphBuilder()
  const item = {
    itemType: "MetadataAttribute",
    name: "Статус",
    type: { type: ["string", "EnumRef.Статусы"] },
  }
  promote(g, "Catalog.Организации.Attribute.Статус", "Статус", ["catalog.yaml"], item)
  g.addItemFlattenTransform("Catalog.Организации.Attribute.Статус", (source) => {
    const record = source as typeof item
    return {
      ...record,
      type: { ...record.type, type: ["string"] },
    }
  })

  const result = walkGraphToFileData(g)
  const file = result.find((f) => f.filePath === "catalog.yaml")!

  expect(file.nodes[0]?.props).toEqual({
    name: "Статус",
    p_name: "Статус",
    p_type_type: ["string"],
  })
  expect(g.getNodeAttributes("Catalog.Организации.Attribute.Статус").item).toBe(item)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: FAIL because `walkGraphToFileData` ignores `itemFlattenTransforms`.

- [ ] **Step 3: Implement transformer application**

In `walkGraphToFileData.ts`, add:

```ts
function applyItemFlattenTransforms(item: unknown, transforms: readonly ((item: unknown) => unknown)[]): unknown {
  return transforms.reduce((current, transform) => transform(current), item)
}
```

Change the props assignment block:

```ts
const flattenedItem = applyItemFlattenTransforms(attrs.item, attrs.itemFlattenTransforms)
Object.assign(props, flattenItem(flattenedItem, { skipKeys: attrs.flattenSkipKeys }))
```

Keep label calculation based on the original `attrs.item`, so transformers cannot accidentally change graph labels.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: PASS.

## Task 3: TypeDescription Reference Filter

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`

- [ ] **Step 1: Write focused predicate and transform tests**

Add imports and tests in `graphFromModel.test.ts`:

```ts
import {
  extractTypeDescriptionGraph,
  filterTypeDescriptionGraphProps,
  isGraphReferenceTypeDescriptionItem,
} from "./graphFromModel"
```

Add to `describe("extractTypeDescriptionGraph", ...)`:

```ts
it.each([
  ["CatalogRef.Товары", true],
  ["EnumRef.Статус", true],
  ["DefinedType.МойТип", true],
  ["string", false],
  ["DynamicList", false],
  ["ReportObject.Отчёт", false],
  ["НеизвестныйТип.X", false],
])("isGraphReferenceTypeDescriptionItem(%s) → %s", (type, expected) => {
  expect(isGraphReferenceTypeDescriptionItem(type)).toBe(expected)
})

it("filterTypeDescriptionGraphProps удаляет только ссылочные элементы type", () => {
  const model: TypeDescription = {
    type: ["string", "CatalogRef.Контрагенты", "DynamicList", "EnumRef.Статус"],
    stringQualifiers: { length: 120, allowedLength: "Variable" },
  }

  expect(filterTypeDescriptionGraphProps(model)).toEqual({
    type: ["string", "DynamicList"],
    stringQualifiers: { length: 120, allowedLength: "Variable" },
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement predicate and filter**

In `graphFromModel.ts`, replace the local inline logic in `extractTypeDescriptionGraph` with:

```ts
export function isGraphReferenceTypeDescriptionItem(type: string): boolean {
  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return false
  const baseType = type.substring(0, dotIndex)
  const rule = getTypeDescriptionRule(baseType)
  return Boolean(rule?.modifier && rule.modifier !== "alwaysType")
}

export function filterTypeDescriptionGraphProps(model: unknown): unknown {
  const typeDescription = model as TypeDescription | undefined
  if (!typeDescription || !Array.isArray(typeDescription.type)) return model

  const type = typeDescription.type.filter((item) => !isGraphReferenceTypeDescriptionItem(item))
  return { ...typeDescription, type }
}
```

Then in `extractTypeDescriptionGraph`, use the predicate:

```ts
for (const type of typeDescription.type) {
  if (!isGraphReferenceTypeDescriptionItem(type)) continue
  const dotIndex = type.indexOf(".")
  const baseType = type.substring(0, dotIndex)
  const detailType = type.substring(dotIndex + 1)
  const targetNodeId = canonicalizeMetadataTypeGraphPath(`${baseType}.${detailType}`)
  references.push({
    id: targetNodeId,
    name: detailType,
    positionFrom: position,
    edgeProps: baseType.endsWith("Object")
      ? { typeKind: "object" }
      : baseType.endsWith("Ref")
        ? { typeKind: "ref" }
        : undefined,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: existing extract tests and new filter tests PASS.

## Task 4: Wire TypeDescription Filter Into Graph Import

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`

- [ ] **Step 1: Extend GraphOps type**

In `packages/core/metadata/orchestration/property/fn.ts`, add an optional field to `GraphOps`:

```ts
export interface GraphOps {
  children?: GraphOpsChild[]
  references?: GraphOpsReference[]
  /** Reference-рёбра, цель которых нужно резолвить через resolveFormLocalPath. */
  formLocalReferences?: GraphOpsFormLocalReference[]
  /** Преобразователи item перед flattenItem props текущего parent-узла. */
  itemFlattenTransforms?: Array<(item: unknown) => unknown>
  /** Рекурсивные задачи: оркестратор пройдёт по правилу для каждой подмодели после применения локальных ops. */
  recurse?: GraphOpsRecurse[]
  /** ASCII-метка ребра. Передаётся в applyGraphOps оркестратором, когда BuildGraphFromModelFunction возвращает GraphOps вместо мутации graph. */
  edgeKind?: string
  /** Русский YAML-ключ ребра. Передаётся в applyGraphOps. */
  edgeYaml?: string
}
```

- [ ] **Step 2: Add failing integration tests**

In `graphFromModel.test.ts`, replace the old expectation that currently allows `p_type_type` for only `DynamicList` with additional cases:

```ts
it("реквизит с Тип: Перечисление.X создаёт TYPE-ребро и не сохраняет ссылочный тип в props", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: {
      yaml: `
Реквизиты:
  Статус:
    Тип: Перечисление.СтатусыОрганизацийПодразделений
`,
    },
    kind: "catalog",
    name: "Организации",
    graph,
    context: baseContext,
  })

  const attrNodeId = "Catalog.Организации.Attribute.Статус"
  const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter((e) => e.attributes.kind === "TYPE")
  expect(typeEdges).toHaveLength(1)
  expect(typeEdges[0].target).toBe("Enum.СтатусыОрганизацийПодразделений")

  const fileGraphData = walkGraphToFileData(graph)
  const segment = fileGraphData.find((item) => item.declaredNodeIds?.includes(attrNodeId))
  const attrNode = segment?.nodes.find((node) => node.id === attrNodeId)

  expect(attrNode?.props.p_type_type).toBeUndefined()
})

it("смешанный TypeDescription сохраняет только нессылочные type props", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: {
      yaml: `
Реквизиты:
  Контакт:
    Тип:
      - Строка
      - Справочник.Контрагенты
`,
    },
    kind: "catalog",
    name: "Организации",
    graph,
    context: baseContext,
  })

  const attrNodeId = "Catalog.Организации.Attribute.Контакт"
  const typeEdges = [...graph.outEdgeEntries(attrNodeId)].filter((e) => e.attributes.kind === "TYPE")
  expect(typeEdges).toHaveLength(1)
  expect(typeEdges[0].target).toBe("Catalog.Контрагенты")

  const fileGraphData = walkGraphToFileData(graph)
  const segment = fileGraphData.find((item) => item.declaredNodeIds?.includes(attrNodeId))
  const attrNode = segment?.nodes.find((node) => node.id === attrNodeId)

  expect(attrNode?.props.p_type_type).toEqual(["string"])
})
```

Keep the existing `DynamicList` integration test and add qualifier coverage:

```ts
it("TypeDescription qualifiers сохраняются после удаления ссылочного type", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: {
      yaml: `
Реквизиты:
  Код:
    Тип:
      - Строка(20)
      - Справочник.Контрагенты
`,
    },
    kind: "catalog",
    name: "Организации",
    graph,
    context: baseContext,
  })

  const attrNodeId = "Catalog.Организации.Attribute.Код"
  const fileGraphData = walkGraphToFileData(graph)
  const segment = fileGraphData.find((item) => item.declaredNodeIds?.includes(attrNodeId))
  const attrNode = segment?.nodes.find((node) => node.id === attrNodeId)

  expect(attrNode?.props.p_type_type).toEqual(["string"])
  expect(attrNode?.props.p_type_stringQualifiers_length).toBe(20)
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: FAIL because `p_type_type` still contains linked values.

- [ ] **Step 4: Register the TypeDescription transform in GraphOps**

In `graphFromModel.ts`, return the transform together with references:

```ts
if (references.length === 0) return undefined
return { references, itemFlattenTransforms: [filterTypeDescriptionGraphProps] }
```

- [ ] **Step 5: Apply GraphOps transforms in the shared result path**

In `buildGraphFromModel.ts`, update `applyBuildGraphResult`:

```ts
for (const transform of section.itemFlattenTransforms ?? []) {
  ctx.graph.addItemFlattenTransform(ctx.parentNodeId, transform)
}
```

Place this before `if (hasOps)` so a transform is registered even if a future GraphOps section returns no child/reference operations.

Update `hasBuildGraphResult`:

```ts
Boolean(section.itemFlattenTransforms?.length)
```

inside the `some` condition.

- [ ] **Step 6: Apply GraphOps transforms in the extractGraph path**

In the `extractGraph` branch of `buildGraphFromModel.ts`, register transforms from `ops` before `applyGraphOps`:

```ts
for (const transform of ops.itemFlattenTransforms ?? []) {
  graph.addItemFlattenTransform(parentNodeId, transform)
}
```

Place this after `const ops = extractGraphFn(modelValue, position)` and inside `if (ops)`, before `applyGraphOps(ops, ...)`.

- [ ] **Step 7: Run integration tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: PASS; linked `TypeDescription.type` values are absent from props, primitive values remain.

## Task 5: Focused Regression Suite

**Files:**
- Test: files modified in Tasks 1-4

- [ ] **Step 1: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Commit implementation**

Use the project commit style:

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts \
  packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts \
  packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts \
  packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts \
  packages/core/metadata/orchestration/buildGraphFromModel.ts \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts \
  packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
git commit -m "fix: :bug: убрать ссылочные типы TypeDescription из props графа"
```
