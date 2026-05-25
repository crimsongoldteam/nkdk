# Graph Label Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse graph labels at the `buildGraph` model level into `FormElement`, `MetadataObject`, and `GraphStub`, and remove `GraphNode` from newly written graphs.

**Architecture:** Add one small classifier in `packages/core` and make `walkGraphToFileData` normalize raw `itemType` into the persisted graph label plus `props.kind`. Then update `packages/graph` so writes and lookups rely on actual labels from the model and use `GraphStub` only for unknown endpoints. Finally update tests and measure the ERP bulk path.

**Tech Stack:** TypeScript, Vitest, FalkorDB, existing `@nakidka/core` buildGraph pipeline, existing `@nakidka/graph` write/bulk paths.

---

## File Structure

- Create `packages/core/metadata/orchestration/buildGraph/labelConsolidation.ts`
  - Owns the runtime label classification rules.
  - Exports `consolidateGraphLabel(rawItemType, hasFilePath)` and constants for `FORM_ELEMENT_LABEL`, `METADATA_OBJECT_LABEL`, `GRAPH_STUB_LABEL`.
- Create `packages/core/metadata/orchestration/buildGraph/labelConsolidation.test.ts`
  - Covers form elements, top-level metadata objects, excluded metadata children, unknown diagnostic nodes, and stubs.
- Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
  - Uses the classifier and writes `props.kind` for consolidated labels.
- Modify focused core graph tests:
  - `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`
  - `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
  - targeted graphFromModel tests that assert concrete labels.
- Modify `packages/graph/src/internal/operations.ts`
  - Stop adding `GraphNode` in `createNodes`/`mergeNodes`.
  - Change unknown lookup fallback from `GraphNode` to `GraphStub`.
  - Stop forcing `GraphNode(id)` index.
- Modify `packages/graph/src/bulk/plan.ts`
  - Use `GraphStub` for fallback nodes.
- Modify `packages/graph/src/bulk/replaceGraphBulk.ts`
  - Remove the mass `SET n:GraphNode` query.
- Modify graph tests:
  - `packages/graph/tests/operations.test.ts`
  - `packages/graph/tests/updateGraph.test.ts`
  - `packages/graph/tests/bulk/plan.test.ts`
  - `packages/graph/tests/integration/updateGraph.integration.test.ts`

---

### Task 1: Add Label Classifier In Core

**Files:**
- Create: `packages/core/metadata/orchestration/buildGraph/labelConsolidation.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/labelConsolidation.test.ts`

- [ ] **Step 1: Write failing classifier tests**

Create `packages/core/metadata/orchestration/buildGraph/labelConsolidation.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  consolidateGraphLabel,
  FORM_ELEMENT_LABEL,
  GRAPH_STUB_LABEL,
  METADATA_OBJECT_LABEL,
} from "./labelConsolidation"

describe("labelConsolidation", () => {
  it("maps form elements to FormElement and keeps raw kind", () => {
    expect(consolidateGraphLabel("InputField", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "InputField",
    })
    expect(consolidateGraphLabel("TableInputField", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "TableInputField",
    })
    expect(consolidateGraphLabel("AutoCommandBar", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "AutoCommandBar",
    })
  })

  it("maps top-level metadata objects to MetadataObject and keeps raw kind", () => {
    expect(consolidateGraphLabel("MetadataCatalog", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataCatalog",
    })
    expect(consolidateGraphLabel("MetadataDocument", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataDocument",
    })
    expect(consolidateGraphLabel("MetadataInformationRegister", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataInformationRegister",
    })
  })

  it("does not consolidate metadata child/common object labels in this pass", () => {
    expect(consolidateGraphLabel("MetadataAttribute", true)).toEqual({
      label: "MetadataAttribute",
    })
    expect(consolidateGraphLabel("MetadataTabularSection", true)).toEqual({
      label: "MetadataTabularSection",
    })
    expect(consolidateGraphLabel("MetadataRegisterResource", true)).toEqual({
      label: "MetadataRegisterResource",
    })
    expect(consolidateGraphLabel("FormAttribute", true)).toEqual({
      label: "FormAttribute",
    })
  })

  it("uses GraphStub for nodes without concrete type and file path", () => {
    expect(consolidateGraphLabel(undefined, false)).toEqual({
      label: GRAPH_STUB_LABEL,
    })
  })

  it("keeps Unknown as a diagnostic label for typed file nodes without itemType", () => {
    expect(consolidateGraphLabel(undefined, true)).toEqual({
      label: "Unknown",
    })
  })
})
```

- [ ] **Step 2: Run classifier tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/labelConsolidation.test.ts
```

Expected: FAIL because `labelConsolidation.ts` does not exist.

- [ ] **Step 3: Implement classifier**

Create `packages/core/metadata/orchestration/buildGraph/labelConsolidation.ts`:

```ts
export const FORM_ELEMENT_LABEL = "FormElement"
export const METADATA_OBJECT_LABEL = "MetadataObject"
export const GRAPH_STUB_LABEL = "GraphStub"
const UNKNOWN_LABEL = "Unknown"

export interface ConsolidatedGraphLabel {
  label: string
  kind?: string
}

const FORM_ELEMENT_TYPES = new Set([
  "AutoCommandBar",
  "Button",
  "ButtonGroup",
  "CalendarField",
  "ChartField",
  "CheckBoxField",
  "ColumnGroup",
  "CommandBar",
  "CommandBarButton",
  "ContextMenu",
  "ExtendedTooltip",
  "FormattedDocumentField",
  "GanttChartField",
  "GraphicalSchemaField",
  "HTMLDocumentField",
  "InputField",
  "LabelDecoration",
  "LabelField",
  "Page",
  "Pages",
  "PDFDocumentField",
  "PictureDecoration",
  "PictureField",
  "Popup",
  "ProgressBarField",
  "RadioButtonField",
  "SearchControlAddition",
  "SearchStringAddition",
  "SingleSearchControlAddition",
  "SingleSearchStringAddition",
  "SingleViewStatusAddition",
  "SpreadSheetDocumentField",
  "Table",
  "TableCheckBoxField",
  "TableInputField",
  "TableLabelField",
  "TablePictureField",
  "TextDocumentField",
  "TrackBarField",
  "UsualGroup",
])

const METADATA_OBJECT_TYPES = new Set([
  "MetadataAccountingRegister",
  "MetadataAccumulationRegister",
  "MetadataBot",
  "MetadataBusinessProcess",
  "MetadataCalculationRegister",
  "MetadataCatalog",
  "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes",
  "MetadataChartOfCharacteristicTypes",
  "MetadataCommand",
  "MetadataCommandGroup",
  "MetadataCommonAttribute",
  "MetadataCommonForm",
  "MetadataCommonPicture",
  "MetadataCommonTemplate",
  "MetadataConstant",
  "MetadataDataProcessor",
  "MetadataDefinedType",
  "MetadataDocument",
  "MetadataDocumentJournal",
  "MetadataDocumentNumerator",
  "MetadataEnumeration",
  "MetadataEventSubscription",
  "MetadataExchangePlan",
  "MetadataFilterCriterion",
  "MetadataFunctionalOption",
  "MetadataFunctionalOptionsParameter",
  "MetadataHTTPService",
  "MetadataInformationRegister",
  "MetadataIntegrationService",
  "MetadataLanguage",
  "MetadataReport",
  "MetadataRole",
  "MetadataScheduledJob",
  "MetadataSequence",
  "MetadataSessionParameter",
  "MetadataSettingsStorage",
  "MetadataStyle",
  "MetadataSubsystem",
  "MetadataTask",
  "MetadataWebService",
  "MetadataWSReference",
])

export const consolidateGraphLabel = (
  rawItemType: string | undefined,
  hasFilePath: boolean,
): ConsolidatedGraphLabel => {
  if (rawItemType === undefined) {
    return { label: hasFilePath ? UNKNOWN_LABEL : GRAPH_STUB_LABEL }
  }
  if (FORM_ELEMENT_TYPES.has(rawItemType)) return { label: FORM_ELEMENT_LABEL, kind: rawItemType }
  if (METADATA_OBJECT_TYPES.has(rawItemType)) return { label: METADATA_OBJECT_LABEL, kind: rawItemType }
  return { label: rawItemType }
}
```

- [ ] **Step 4: Verify classifier tests pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/labelConsolidation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add packages/core/metadata/orchestration/buildGraph/labelConsolidation.ts packages/core/metadata/orchestration/buildGraph/labelConsolidation.test.ts
git commit -m "feat: :sparkles: добавить классификацию labels графа"
```

---

### Task 2: Apply Consolidation In `walkGraphToFileData`

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
- Modify targeted tests that assert concrete form/metadata labels:
  - `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`

- [ ] **Step 1: Add failing tests for normalized labels**

In `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`, add tests near existing label tests:

```ts
it("схлопывает верхнеуровневый metadata object в MetadataObject и сохраняет kind", () => {
  const graph = new GraphBuilder()
  graph.ensureNode("Справочник.Товары", {
    name: "Товары",
    item: { itemType: "MetadataCatalog", name: "Товары" },
  })
  graph.addFilePath("Справочник.Товары", "Catalogs/Товары.yaml")

  const [file] = walkGraphToFileData(graph)

  expect(file?.nodes).toEqual([
    expect.objectContaining({
      id: "Справочник.Товары",
      label: "MetadataObject",
      props: expect.objectContaining({ kind: "MetadataCatalog", name: "Товары" }),
    }),
  ])
})

it("схлопывает элементы формы в FormElement и сохраняет kind", () => {
  const graph = new GraphBuilder()
  graph.ensureNode("Форма.Элемент.Поле", {
    name: "Поле",
    item: { itemType: "InputField", name: "Поле" },
  })
  graph.addFilePath("Форма.Элемент.Поле", "Forms/Форма.yaml")

  const [file] = walkGraphToFileData(graph)

  expect(file?.nodes).toEqual([
    expect.objectContaining({
      id: "Форма.Элемент.Поле",
      label: "FormElement",
      props: expect.objectContaining({ kind: "InputField", name: "Поле" }),
    }),
  ])
})

it("оставляет исключенные дочерние metadata labels без схлопывания", () => {
  const graph = new GraphBuilder()
  graph.ensureNode("Справочник.Товары.Реквизит.Код", {
    name: "Код",
    item: { itemType: "MetadataAttribute", name: "Код" },
  })
  graph.addFilePath("Справочник.Товары.Реквизит.Код", "Catalogs/Товары.yaml")

  const [file] = walkGraphToFileData(graph)

  expect(file?.nodes).toEqual([
    expect.objectContaining({
      id: "Справочник.Товары.Реквизит.Код",
      label: "MetadataAttribute",
      props: expect.objectContaining({ name: "Код" }),
    }),
  ])
  expect(file?.nodes[0]?.props).not.toHaveProperty("kind")
})

it("пишет GraphStub для узла без itemType и filePath", () => {
  const graph = new GraphBuilder()
  graph.ensureNode("Внешний.Узел")

  const [file] = walkGraphToFileData(graph)

  expect(file?.filePath).toBe("")
  expect(file?.nodes).toEqual([
    expect.objectContaining({
      id: "Внешний.Узел",
      label: "GraphStub",
      props: {},
    }),
  ])
})
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: FAIL because labels are still raw item types and stubs are still `Unknown`.

- [ ] **Step 3: Implement normalization in `walkGraphToFileData`**

Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`:

```ts
import { consolidateGraphLabel } from "./labelConsolidation"
```

Replace the current label derivation block:

```ts
const item = attrs.item as Record<string, unknown> | undefined
const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
const label = itemType ?? UNKNOWN_LABEL
```

with:

```ts
const item = attrs.item as Record<string, unknown> | undefined
const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
const consolidated = consolidateGraphLabel(itemType, filePath !== STUB_SEGMENT)
if (consolidated.kind !== undefined) props.kind = consolidated.kind
const label = consolidated.label
```

Remove the old `UNKNOWN_LABEL` constant from this file if it becomes unused.

- [ ] **Step 4: Update existing core label assertions**

Update tests that assert raw labels:

In `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
expect(root!.label).toBe("MetadataObject")
expect(root!.props.kind).toBe("MetadataCatalog")
```

For form nodes:

```ts
expect(formNode!.label).toBe("FormElement")
expect(formNode!.props.kind).toBe("ClientApplicationForm")
```

In `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`, if the asserted node is a `FormAttribute`, keep it unchanged:

```ts
expect(attrNode?.label).toBe("FormAttribute")
```

In `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts` and `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`, keep `ChoiceParameter` and `ChoiceParameterLink` unchanged because they are non-goals.

- [ ] **Step 5: Verify core graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/walkGraphToFileData.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts metadata/commonObjects/typeDescription/graphFromModel.test.ts metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
git commit -m "feat: :sparkles: схлопывать labels в buildGraph"
```

---

### Task 3: Remove `GraphNode` From Non-Bulk Graph Writes

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`
- Modify: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Write failing graph-operation assertions**

Update `packages/graph/tests/operations.test.ts` expectations:

```ts
expect(catalogCall[0]).toContain("MERGE (m:MetadataObject {id: n.id}) SET m += n.props")
expect(catalogCall[0]).not.toContain(":GraphNode")
```

Replace the test named `не дублирует GraphNode label при merge узла GraphNode` with:

```ts
it("не добавляет GraphNode label при merge узла", async () => {
  await mergeNodes(conn, [
    { id: "A", label: "MetadataObject", props: { kind: "MetadataCatalog", name: "A" } },
  ])

  const cypher = queryMock.mock.calls[0]?.[0] as string
  expect(cypher).toContain("MERGE (m:MetadataObject {id: n.id}) SET m += n.props")
  expect(cypher).not.toContain("GraphNode")
})
```

Update fallback tests:

```ts
expect(cypher).toContain("MATCH (s:MetadataObject {id: e.src}), (t:GraphStub {id: e.tgt})")
expect(cypher).toContain("MATCH (s:GraphStub {id: e.src}), (t:GraphStub {id: e.tgt})")
```

Update `ensureLabelIndexes` tests:

```ts
expect(queries).not.toContain("CREATE INDEX FOR (n:GraphNode) ON (n.id)")
expect(queries).not.toContain("CREATE INDEX FOR (n:GraphStub) ON (n.id)")
```

Add a separate explicit stub-index assertion:

```ts
queryMock.mockClear()
await ensureLabelIndexes(conn, ["GraphStub", "MetadataObject"])
const stubQueries = queryMock.mock.calls.map((call) => call[0] as string)
expect(stubQueries).toContain("CREATE INDEX FOR (n:GraphStub) ON (n.id)")
expect(stubQueries).toContain("CREATE INDEX FOR (n:MetadataObject) ON (n.id)")
```

- [ ] **Step 2: Run graph operation tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/operations.test.ts tests/updateGraph.test.ts
```

Expected: FAIL because `operations.ts` still emits `GraphNode`.

- [ ] **Step 3: Update `operations.ts` constants and merge labels**

In `packages/graph/src/internal/operations.ts`, replace:

```ts
const GRAPH_NODE_LABEL = "GraphNode"
```

with:

```ts
const GRAPH_STUB_LABEL = "GraphStub"
```

Replace:

```ts
const cypherLookupLabel = (label: string | undefined): string =>
  cypherLabel(label && label.length > 0 ? label : GRAPH_NODE_LABEL)

const cypherMergeLabels = (label: string): string => {
  const labels = [label, GRAPH_NODE_LABEL].filter((value, index, all) =>
    value.length > 0 && all.indexOf(value) === index
  )
  return labels.map(cypherLabel).join("")
}
```

with:

```ts
const cypherLookupLabel = (label: string | undefined): string =>
  cypherLabel(label && label.length > 0 ? label : GRAPH_STUB_LABEL)

const cypherMergeLabel = (label: string): string =>
  cypherLabel(label.length > 0 ? label : GRAPH_STUB_LABEL)
```

Update `mergeNodes` and `createNodes`:

```ts
`UNWIND ${cypherNodeBatch(batch)} AS n MERGE (m${cypherMergeLabel(label)} {id: n.id}) SET m += n.props`
```

```ts
`UNWIND ${cypherNodeBatch(batch)} AS n CREATE (m${cypherMergeLabel(label)} {id: n.id}) SET m += n.props`
```

Update file-link queries from `n:GraphNode` to `n:GraphStub` only for unknown fallback is not enough because file links point to known subject nodes too. Replace those query builders with label-aware grouping:

```ts
const nodeLabelFor = (labelByNodeId: ReadonlyMap<string, string> | undefined, nodeId: string): string =>
  labelByNodeId?.get(nodeId) ?? GRAPH_STUB_LABEL
```

Then change `mergeFileLinks` and `createFileLinks` signatures to accept `labelByNodeId?: ReadonlyMap<string, string>`, group declared/contributed links by `nodeLabelFor`, and build:

```ts
`UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n${cypherLookupLabel(nodeLabel)} {id: link.nodeId}) MERGE (f)-[:DECLARES]->(n)`
```

and the equivalent `CREATE` query.

Update `ensureLabelIndexes`:

```ts
const unique = new Set(labels)
for (const label of unique) {
  await ensureIndex(conn, label.length > 0 ? label : GRAPH_STUB_LABEL, "id")
}
```

Do not force `GraphStub` unless it appears in `labels`.

- [ ] **Step 4: Pass label maps from `updateGraph.ts`**

Modify `packages/graph/src/updateGraph.ts`:

```ts
await createFileLinks(conn, filesToMerge, labelByNodeId, onProgress)
```

and:

```ts
await mergeFileLinks(conn, filesToMerge, labelByNodeId, onProgress)
```

Also include stub labels in `labels` for index creation when they are present in payload:

```ts
const labels = filesToMerge.flatMap((file) => file.nodes.map((n) => n.label))
```

not just `allNodes` if future code adds non-`nodes` labels.

- [ ] **Step 5: Verify graph unit tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/operations.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add packages/graph/src/internal/operations.ts packages/graph/src/updateGraph.ts packages/graph/tests/operations.test.ts packages/graph/tests/updateGraph.test.ts
git commit -m "feat: :sparkles: убрать GraphNode из write-пути графа"
```

---

### Task 4: Update Bulk Plan And Remove Mass Label Mutation

**Files:**
- Modify: `packages/graph/src/bulk/plan.ts`
- Modify: `packages/graph/src/bulk/replaceGraphBulk.ts`
- Modify: `packages/graph/tests/bulk/plan.test.ts`
- Modify: `packages/graph/tests/updateGraph.test.ts`
- Modify: `packages/graph/tests/bulk/stream.test.ts` if expected labels appear in snapshots.

- [ ] **Step 1: Update failing bulk tests**

In `packages/graph/tests/bulk/plan.test.ts`, change expected stub label:

```ts
expect(plan.nodeGroups.map((group) => [group.label, group.nodes.map((node) => node.id)])).toEqual([
  ["File", [0]],
  ["MetadataObject", [1]],
  ["GraphStub", [2]],
])
```

Use input node:

```ts
nodes: [{ id: "A", label: "MetadataObject", props: { kind: "MetadataCatalog", name: "A" } }],
```

In `packages/graph/tests/updateGraph.test.ts`, strengthen bulk replace test:

```ts
expect(cypher).not.toContainEqual(expect.stringContaining("SET n:GraphNode"))
expect(cypher).not.toContainEqual(expect.stringContaining("GraphNode"))
```

- [ ] **Step 2: Run bulk tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/plan.test.ts tests/bulk/stream.test.ts tests/updateGraph.test.ts
```

Expected: FAIL because `createBulkPlan` still creates `GraphNode` stubs and `replaceGraphBulk` still runs mass `SET`.

- [ ] **Step 3: Update bulk plan**

In `packages/graph/src/bulk/plan.ts`, replace:

```ts
const ensureStub = (logicalId: string): number => addNode("GraphNode", logicalId, {})
```

with:

```ts
const ensureStub = (logicalId: string): number => addNode("GraphStub", logicalId, {})
```

- [ ] **Step 4: Remove mass GraphNode SET**

In `packages/graph/src/bulk/replaceGraphBulk.ts`, replace:

```ts
await report("bulkWrite", opts.onProgress, async () => {
  await writeBulkCommands(conn, commands)
  await query(conn, "MATCH (n) WHERE n.id IS NOT NULL AND NOT n:File SET n:GraphNode")
})
```

with:

```ts
await report("bulkWrite", opts.onProgress, async () => {
  await writeBulkCommands(conn, commands)
})
```

Remove the now-unused `query` import from this file.

- [ ] **Step 5: Verify bulk tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/plan.test.ts tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/bulk/encoder.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add packages/graph/src/bulk/plan.ts packages/graph/src/bulk/replaceGraphBulk.ts packages/graph/tests/bulk/plan.test.ts packages/graph/tests/updateGraph.test.ts packages/graph/tests/bulk/stream.test.ts
git commit -m "feat: :sparkles: убрать GraphNode из bulk replace"
```

---

### Task 5: Update Integration Snapshots For The New Model

**Files:**
- Modify: `packages/graph/tests/integration/updateGraph.integration.test.ts`
- Modify any focused core integration tests that still query `GraphNode`.

- [ ] **Step 1: Update snapshot queries**

In `packages/graph/tests/integration/updateGraph.integration.test.ts`, update `readSnapshot`:

```ts
const nodes = await g.query<{
  id: string
  labels: string[]
  kind: string | null
  name: string | null
  p_hierarchical: boolean | null
  p_values: string[] | null
  p_ratio: number | null
}>(
  [
    "MATCH (n)",
    "WHERE n:MetadataObject OR n:FormElement OR n:GraphStub OR n:MetadataAttribute",
    "RETURN n.id AS id, labels(n) AS labels, n.kind AS kind, n.name AS name, n.p_hierarchical AS p_hierarchical, n.p_values AS p_values, n.p_ratio AS p_ratio",
    "ORDER BY id",
  ].join(" "),
)
```

Update relationship snapshot queries:

```ts
"MATCH (src)-[value:VALUE]->(tgt)"
```

and:

```ts
"MATCH (file:File)-[:DECLARES]->(node)"
```

The edge topology is what matters; the endpoint labels are covered in the node snapshot.

- [ ] **Step 2: Update expected snapshot**

Replace expected nodes:

```ts
nodes: [
  { id: "A", labels: ["MetadataObject"], kind: "MetadataCatalog", name: "A", p_hierarchical: true, p_values: null, p_ratio: 1.5 },
  { id: "B", labels: ["MetadataAttribute"], kind: null, name: "B", p_hierarchical: null, p_values: ["x", "y"], p_ratio: null },
],
```

Do not expect `GraphNode` in any labels array.

- [ ] **Step 3: Run integration replace test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS. If Docker/Testcontainers is unavailable, record the failure and run unit coverage before continuing.

- [ ] **Step 4: Run graph package tests**

Run:

```bash
pnpm --filter @nakidka/graph test
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

Run:

```bash
git add packages/graph/tests/integration/updateGraph.integration.test.ts
git commit -m "test: :white_check_mark: обновить снимки новой graph-модели"
```

---

### Task 6: Full Verification And ERP Measurement

**Files:**
- No source files expected.
- Read-only diagnostics may use `/private/tmp` scripts.

- [ ] **Step 1: Generate Langium files if the package exists**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected in this worktree may be:

```text
No projects matched the filters
```

If so, record it and continue because this repository state has no `nkdk-language` workspace package.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Measure ERP label counts before writing**

Run the existing temporary diagnostic or create a fresh one under `/private/tmp`:

```bash
pnpm --filter @nakidka/cli exec tsx /private/tmp/nkdk-label-counts.ts /private/tmp/erp_nkdk
```

Expected after consolidation:

- no `GraphNode`;
- `FormElement` is present;
- `MetadataObject` is present;
- `GraphStub` may be present;
- top-level labels such as `MetadataCatalog` and form labels such as `InputField` are absent from the node group list.

- [ ] **Step 4: Run clean FalkorDB ERP bulk measurement**

Start a temporary container:

```bash
docker run -d --name nkdk-falkordb-label-consolidation-measure -p 6379:6379 falkordb/falkordb:latest
```

Run:

```bash
/usr/bin/time -p env DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Expected:

- `bulkWrite` completes;
- debug output has no hidden mass `SET n:GraphNode`;
- total write time is much closer to the sum of `GRAPH.BULK` commands plus index creation.

Stop and remove the container:

```bash
docker stop nkdk-falkordb-label-consolidation-measure
docker rm nkdk-falkordb-label-consolidation-measure
```

- [ ] **Step 5: Commit final verification notes if source changed**

If Task 6 reveals only documentation corrections, commit them:

```bash
git add docs/superpowers/plans/2026-05-25-graph-label-consolidation.md
git commit -m "docs: :memo: уточнить план схлопывания labels"
```

If no files changed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Coarse labels at `buildGraph` level: Task 1 and Task 2.
- `FormElement + kind`: Task 1 and Task 2.
- `MetadataObject + kind`: Task 1 and Task 2.
- Non-goal labels unchanged: Task 1 and Task 2 tests.
- Remove `GraphNode`: Task 3, Task 4, Task 5.
- `GraphStub` fallback: Task 1, Task 3, Task 4.
- Bulk mass `SET` removal: Task 4.
- Integration and performance verification: Task 5 and Task 6.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified implementation steps.
- Commands and expected outcomes are explicit.

Type consistency:

- `kind` is the reserved property for original graph type.
- Coarse labels are `FormElement`, `MetadataObject`, `GraphStub`.
- The plan consistently uses `GraphStub` rather than keeping `GraphNode` for new writes.
