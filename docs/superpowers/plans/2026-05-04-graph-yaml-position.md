# Graph YAML Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Передавать позицию YAML-ссылок в граф как три примитивных свойства рёбер: `positionFromOffset`, `positionFromLine`, `positionFromColumn`.

**Architecture:** Внутри `packages/core/metadata/orchestration/` позиция остаётся объектом `positionFrom`, но расширяется строкой и столбцом через `yaml.LineCounter`. На границе `walkGraphToFileData` объект разворачивается в плоские свойства `EdgeData.props`, чтобы контракт `@nakidka/graph` продолжал принимать только примитивы.

**Tech Stack:** TypeScript, `yaml` (`LineCounter`, YAML AST), Vitest, `GraphBuilder`, `FileGraphData`.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/property/position.ts`
  - Ответственность: общий расчёт координат YAML AST (`offset`, `line`, `column`) для значения свойства и элемента массива.
- Create: `packages/core/metadata/orchestration/property/position.test.ts`
  - Ответственность: модульные тесты расчёта координат без построения графа.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Ответственность: типы `GraphOps*` и параметры кастомных graph-обработчиков.
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
  - Ответственность: проброс `LineCounter` и использование полной позиции для обычных reference-свойств.
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
  - Ответственность: передача `parsed.lineCounter` в `buildGraphFromModel` для прикладных объектов и форм.
- Modify: `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts`
  - Ответственность: позиции ссылок в YAML-массивах `MetadataFields`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
  - Ответственность: позиции ссылок в `MetadataValue`, включая `fixedArray`.
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
  - Ответственность: разворачивание `positionFrom` в примитивные свойства рёбер.
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
  - Ответственность: интеграционная проверка полной позиции на внутренних рёбрах.
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`
  - Ответственность: проверка финального формата `FileGraphData`.

## Task 1: YAML Position Helpers

**Files:**
- Create: `packages/core/metadata/orchestration/property/position.test.ts`
- Modify: `packages/core/metadata/orchestration/property/position.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/metadata/orchestration/property/position.test.ts`:

```ts
import { isMap, isSeq } from "yaml"
import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { computeSeqItemPosition, computeValuePosition } from "./position"

describe("YAML source positions", () => {
  it("computeValuePosition возвращает offset, line и column значения свойства", () => {
    const parsed = parseMetadataYaml(`
Тип: Справочник.Контрагенты
`)
    const yamlMap = parsed.doc.contents

    expect(isMap(yamlMap)).toBe(true)
    if (!isMap(yamlMap)) return

    const position = computeValuePosition(yamlMap, "Тип", parsed.lineCounter)

    expect(position).toEqual({
      offset: 6,
      line: 2,
      column: 6,
    })
  })

  it("computeSeqItemPosition возвращает координаты конкретного элемента массива", () => {
    const parsed = parseMetadataYaml(`
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
`)
    const yamlMap = parsed.doc.contents

    expect(isMap(yamlMap)).toBe(true)
    if (!isMap(yamlMap)) return

    const pair = yamlMap.items.find((item) => item && "key" in item)
    const seq = pair && "value" in pair ? pair.value : undefined

    expect(isSeq(seq)).toBe(true)
    if (!isSeq(seq)) return

    expect(computeSeqItemPosition(seq, 0, parsed.lineCounter)).toEqual({
      offset: 19,
      line: 3,
      column: 5,
    })
    expect(computeSeqItemPosition(seq, 1, parsed.lineCounter)).toEqual({
      offset: 48,
      line: 4,
      column: 5,
    })
  })
})
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/position.test.ts --run
```

Expected: FAIL because `computeSeqItemPosition` does not exist and `computeValuePosition` still returns only `{ offset }`.

- [ ] **Step 3: Implement position helpers**

Modify `packages/core/metadata/orchestration/property/position.ts`:

```ts
import { isMap, isPair, isScalar, LineCounter, YAMLMap, YAMLSeq } from "yaml"

export interface SourcePosition {
  offset: number
  line: number
  column: number
  length?: number
}

function positionFromOffset(
  offset: number | undefined,
  lineCounter: LineCounter,
  length?: number,
): SourcePosition | undefined {
  if (offset === undefined) return undefined
  const pos = lineCounter.linePos(offset)
  return {
    offset,
    line: pos.line,
    column: pos.col,
    ...(length !== undefined ? { length } : {}),
  }
}

export function findSubmap(yamlMap: YAMLMap | undefined, key: string | undefined): YAMLMap | undefined {
  if (!yamlMap || !key) return undefined
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isMap(pair.value)) return undefined
  return pair.value
}

export function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

export function findSeqItemOffset(yamlSeq: YAMLSeq, index: number): number | undefined {
  const item = yamlSeq.items[index]
  if (item === undefined || item === null) return undefined
  const range = (item as { range?: number[] }).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return range[0]
}

export function computeSeqItemPosition(
  yamlSeq: YAMLSeq,
  index: number,
  lineCounter: LineCounter,
): SourcePosition | undefined {
  return positionFromOffset(findSeqItemOffset(yamlSeq, index), lineCounter)
}

export function computeValuePosition(
  yamlMap: YAMLMap,
  key: string,
  lineCounter: LineCounter,
): SourcePosition | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair)) return undefined
  const value = pair.value
  if (!value || typeof value !== "object") return undefined
  const range = (value as { range?: number[] }).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return positionFromOffset(range[0], lineCounter)
}
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/position.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/property/position.ts packages/core/metadata/orchestration/property/position.test.ts
git commit -m "feat: :sparkles: добавить координаты YAML-позиций"
```

## Task 2: LineCounter Through BuildGraphFromModel

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Write the failing scalar integration assertion**

Add this test to `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`:

```ts
it("сохраняет line и column для одиночной YAML-ссылки", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: { yaml: `
Реквизиты:
  Контрагент:
    Тип: Справочник.Контрагенты
` },
    kind: "catalog",
    name: "Товары",
    graph,
    context: baseContext,
  })

  const attrNodeId = "Справочник.Товары.Реквизит.Контрагент"
  const outEdges = [...graph.outEdgeEntries(attrNodeId)]
  const typeEdges = outEdges.filter((e) => e.attributes.kind === "TYPE")

  expect(typeEdges).toHaveLength(1)
  expect(typeEdges[0].attributes.positionFrom).toEqual({
    offset: 35,
    line: 4,
    column: 10,
  })
})
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts --run
```

Expected: FAIL because `positionFrom` still has only `offset`.

- [ ] **Step 3: Extend graph operation types**

Modify `packages/core/metadata/orchestration/property/fn.ts`:

```ts
import { LineCounter, YAMLMap } from "yaml"
import { SourcePosition } from "./position"
```

Change `BuildGraphFromModelFunction` params to include `lineCounter`:

```ts
export type BuildGraphFromModelFunction = (params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  lineCounter: LineCounter | undefined
  propRule: PropertyRule
  /** Дополнительный контекст, пробрасываемый в кастомные обработчики (например, formNodeId). */
  extra?: Record<string, unknown>
}) => GraphOps | GraphOps[] | undefined | void
```

Change all `positionFrom?: { offset: number; length?: number }` declarations in this file to:

```ts
positionFrom?: SourcePosition
```

Add `lineCounter` to `GraphOpsRecurse`:

```ts
export interface GraphOpsRecurse {
  model: Record<string, unknown>
  yamlMap?: YAMLMap
  lineCounter?: LineCounter
  rule: MetadataItemRule
  parentNodeId: string
  extra?: Record<string, unknown>
}
```

- [ ] **Step 4: Pass LineCounter through buildGraphFromModel**

Modify `packages/core/metadata/orchestration/buildGraphFromModel.ts`:

```ts
import { LineCounter } from "yaml"
```

Add `lineCounter` to `ApplyBuildGraphResultContext`:

```ts
export interface ApplyBuildGraphResultContext {
  graph: GraphBuilder
  parentNodeId: string
  filePath: string
  propType: string
  lineCounter?: LineCounter
  extra?: Record<string, unknown>
}
```

Pass it through recurse:

```ts
buildGraphFromModel({
  model: recurse.model,
  yamlMap: recurse.yamlMap,
  lineCounter: recurse.lineCounter ?? ctx.lineCounter,
  rule: recurse.rule,
  graph: ctx.graph,
  parentNodeId: recurse.parentNodeId,
  filePath: ctx.filePath,
  extra: recurse.extra ?? ctx.extra,
})
```

Add `lineCounter` to `buildGraphFromModel` params:

```ts
export function buildGraphFromModel(params: {
  model: Record<string, unknown>
  yamlMap: ReturnType<typeof findSubmap>
  lineCounter?: LineCounter
  rule: MetadataItemRule
  graph: GraphBuilder
  parentNodeId: string
  filePath: string
  extra?: Record<string, unknown>
}): void {
  const { model, yamlMap, lineCounter, rule, graph, parentNodeId, filePath, extra } = params
```

Change ordinary reference position calculation:

```ts
const position =
  yamlKey && yamlMap && lineCounter
    ? computeValuePosition(yamlMap, yamlKey, lineCounter)
    : undefined
```

Pass `lineCounter` into custom handlers:

```ts
const result = buildGraphFn({
  model: model[key],
  parentNodeId,
  filePath,
  yamlMap,
  lineCounter,
  propRule,
  extra,
})
```

Pass `lineCounter` into recursive graphChild calls:

```ts
buildGraphFromModel({
  model: item,
  yamlMap: itemYamlMap,
  lineCounter,
  rule: graphChildDef.itemRule,
  graph,
  parentNodeId: childNodeId,
  filePath,
})
```

Pass `lineCounter` into `applyBuildGraphResult`:

```ts
applyBuildGraphResult(result, { graph, parentNodeId, filePath, propType, lineCounter, extra })
```

- [ ] **Step 5: Pass parsed.lineCounter from importMetadataFileWithGraph**

Modify both `buildGraphFromModel` calls in `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`:

```ts
buildGraphFromModel({
  model: model as Record<string, unknown>,
  yamlMap,
  lineCounter: parsed.lineCounter,
  rule: ClientApplicationFormRules as never,
  graph,
  parentNodeId: formNodeId,
  filePath,
})
```

and:

```ts
buildGraphFromModel({
  model: model as unknown as Record<string, unknown>,
  yamlMap,
  lineCounter: parsed.lineCounter,
  rule: entry.rule as never,
  graph,
  parentNodeId: itemNodeId,
  filePath,
})
```

- [ ] **Step 6: Run the integration tests to verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts --run
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "feat: :sparkles: пробросить LineCounter в построение графа"
```

## Task 3: Array Element Positions In Custom Graph Handlers

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
- Modify: `packages/core/metadata/orchestration/property/extractReferenceFromPath.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Add array assertions**

Modify the test `добавляет N рёбер kind Объект с разными позициями для массива Движения` in `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts` by replacing its position assertions with:

```ts
const positions = objEdges.map((e) => e.attributes.positionFrom)
expect(positions).toEqual([
  { offset: 15, line: 3, column: 5 },
  { offset: 43, line: 4, column: 5 },
])
```

Modify the test `fixedArray из N ref → N рёбер kind Значение с разными позициями` in the same file by replacing its position assertions with:

```ts
const positions = valEdges.map((e) => e.attributes.positionFrom)
expect(positions).toEqual([
  { offset: 58, line: 5, column: 9 },
  { offset: 107, line: 6, column: 9 },
])
```

In `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`, add this test to `describe("importMetadataFileWithGraph — MetadataItemLinks (document)", ...)` or a nearby graph-position describe block:

```ts
it("MetadataFields массив сохраняет line и column конкретного элемента", () => {
  const graph = new GraphBuilder()
  importMetadataFileWithGraph({
    filePath: FILE_PATH,
    sources: { yaml: `
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
` },
    kind: "catalog",
    name: "Товары",
    graph,
    context: baseContext,
  })

  const outEdges = [...graph.outEdgeEntries("Справочник.Товары")]
  const fieldEdges = outEdges.filter((e) => e.attributes.kind === "FIELD")

  expect(fieldEdges.map((e) => e.attributes.positionFrom)).toEqual([
    { offset: 19, line: 3, column: 5 },
    { offset: 48, line: 4, column: 5 },
  ])
})
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts --run
```

Expected: FAIL because custom handlers still use `findSeqItemOffset` and create `{ offset }`.

- [ ] **Step 3: Update extractReferenceFromPath type**

Modify `packages/core/metadata/orchestration/property/extractReferenceFromPath.ts`:

```ts
import { SourcePosition } from "./position"
```

Change the signature:

```ts
export function extractReferenceFromPath(
  path: string,
  position?: SourcePosition,
): GraphOpsReference | undefined {
```

- [ ] **Step 4: Update MetadataFields array positions**

Modify `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts`:

```ts
import { computeSeqItemPosition } from "~/metadata/orchestration/property/position"
```

Remove `findSeqItemOffset` from imports.

Change params:

```ts
const buildMetadataFieldsGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  lineCounter,
  propRule,
}): GraphOps | undefined => {
```

Change per-element position:

```ts
const position =
  yamlSeq && lineCounter ? computeSeqItemPosition(yamlSeq, index, lineCounter) : undefined
return extractReferenceFromPath(field, position)
```

- [ ] **Step 5: Update MetadataValue positions**

Modify `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`:

```ts
import {
  computeSeqItemPosition,
  computeValuePosition,
  findSubmap,
  SourcePosition,
} from "~/metadata/orchestration/property/position"
```

Remove `findSeqItemOffset` from imports.

Change `extractSingleValueRef` signature:

```ts
export function extractSingleValueRef(
  value: MetadataTypedValue,
  position?: SourcePosition,
): { ref: GraphOpsReference; kind: string; yaml: string } | undefined {
```

Change `buildMetadataValueGraph` params:

```ts
export const buildMetadataValueGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  lineCounter,
  propRule,
}): GraphOps[] | undefined => {
```

Change fixed array position:

```ts
const position =
  yamlSeq && lineCounter ? computeSeqItemPosition(yamlSeq, index, lineCounter) : undefined
```

Change inner position type and calculations:

```ts
let innerPosition: SourcePosition | undefined
if (yamlMap && propRule.yaml && lineCounter) {
  const innerMap = findSubmap(yamlMap, propRule.yaml)
  if (innerMap) {
    innerPosition = computeValuePosition(innerMap, "Значение", lineCounter)
  } else {
    innerPosition = computeValuePosition(yamlMap, propRule.yaml, lineCounter)
  }
}
```

Change ordinary value position:

```ts
const position =
  yamlMap && propRule.yaml && lineCounter
    ? computeValuePosition(yamlMap, propRule.yaml, lineCounter)
    : undefined
```

- [ ] **Step 6: Run the integration tests to verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/importMetadataFileWithGraph.test.ts --run
```

Expected: PASS.

- [ ] **Step 7: Run focused graph extraction tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataField/graphFromModel.test.ts metadata/commonObjects/metadataValue/graphFromModel.test.ts --run
```

Expected: PASS. Existing tests that assert only `offset` should continue to pass because `positionFrom.offset` remains present.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataField/graphFromModel.ts packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts packages/core/metadata/orchestration/property/extractReferenceFromPath.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "feat: :sparkles: сохранить координаты элементов YAML-массивов"
```

## Task 4: Flatten Position Into FileGraphData Edge Props

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Write the failing FileGraphData test**

Add this test to `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`:

```ts
it("разворачивает positionFrom в примитивные props ребра", () => {
  const g = new GraphBuilder()
  promote(g, "A", "A", ["a.yaml"], { itemType: "X" })
  promote(g, "B", "B", ["a.yaml"], { itemType: "Y" })
  g.ensureEdge("A", "B", "VALUE", {
    yaml: "Значение",
    positionFrom: { offset: 42, line: 7, column: 11 },
  })

  const result = walkGraphToFileData(g)
  const file = result.find((f) => f.filePath === "a.yaml")!

  expect(file.edges).toEqual([
    {
      src: "A",
      tgt: "B",
      kind: "VALUE",
      props: {
        yaml: "Значение",
        positionFromOffset: 42,
        positionFromLine: 7,
        positionFromColumn: 11,
      },
    },
  ])
})
```

- [ ] **Step 2: Run the FileGraphData tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts --run
```

Expected: FAIL because `positionFrom` is still ignored as a nested object.

- [ ] **Step 3: Implement position flattening**

Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`:

```ts
function addPositionFromProps(
  props: Record<string, string | number | boolean | null>,
  positionFrom: unknown,
): void {
  if (positionFrom === null || typeof positionFrom !== "object") return
  const position = positionFrom as Record<string, unknown>
  if (typeof position.offset === "number") props.positionFromOffset = position.offset
  if (typeof position.line === "number") props.positionFromLine = position.line
  if (typeof position.column === "number") props.positionFromColumn = position.column
}
```

In the edge loop, call it and skip the nested object:

```ts
addPositionFromProps(edgeProps, attributes.positionFrom)
for (const [key, value] of Object.entries(attributes)) {
  if (key === "kind" || key === "yaml" || key === "positionFrom") continue
  if (isEdgePrimitive(value)) edgeProps[key] = value
}
```

- [ ] **Step 4: Run the FileGraphData tests to verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
git commit -m "feat: :sparkles: выгружать позиции YAML-ссылок в граф"
```

## Task 5: Type Check And Full Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS. If TypeScript reports call sites still using the old `computeValuePosition(yamlMap, key)` signature, update those calls to pass `lineCounter` when available or return `undefined` when not available.

- [ ] **Step 2: Run focused core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/position.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/commonObjects/metadataField/graphFromModel.test.ts metadata/commonObjects/metadataValue/graphFromModel.test.ts --run
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests PASS.

- [ ] **Step 4: Commit any verification-only fixes**

If Step 1-3 required small fixes, commit them:

```bash
git add packages/core/metadata/orchestration packages/core/metadata/commonObjects
git commit -m "fix: :bug: стабилизировать координаты YAML-позиций"
```

If there were no fixes after Task 4, do not create an empty commit.

## Self-Review

- Spec coverage: Task 1 covers `offset`, `line`, `column`; Task 2 covers `LineCounter` flow; Task 3 covers YAML arrays; Task 4 covers primitive graph props; Task 5 covers required full `pnpm test`.
- Placeholder scan: no placeholders or vague implementation steps remain.
- Type consistency: the plan uses one shared `SourcePosition` type with `offset`, `line`, `column`, optional `length`; every caller that computes positions receives `LineCounter`.
