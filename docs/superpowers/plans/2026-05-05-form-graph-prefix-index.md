# Form Graph Prefix Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить полный `update-graph` для больших проектов, убрав глобальные обходы всего `GraphBuilder` после импорта каждой формы.

**Architecture:** `GraphBuilder` хранит два новых внутренних индекса: узлы по точечным префиксам id и входящие рёбра по target. `importMetadataFileWithGraph` для `Форма.nkdk` получает только визуальные элементы текущей формы и только рёбра, которые касаются этих узлов. Формат `FileGraphData` и внешнее поведение graph payload не меняются.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, внутренний `GraphBuilder`, `buildGraph`.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
  - Добавить `nodesByPrefix` и `inEdgesByTarget`.
  - Добавить методы `nodesWithPrefix(prefix)` и `edgeEntriesTouching(nodeIds)`.
  - Обновить `ensureNode` и `ensureEdge`, чтобы индексы поддерживались при добавлении.
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`
  - Зафиксировать поведение новых методов и отсутствие дублей в рёбрах.
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
  - Заменить два глобальных цикла `for (const nodeId of graph.nodes())` на выборочный обход.
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
  - Добавить регрессионный тест, что импорт формы с `nkdk` не использует полный `graph.nodes()` для перепривязки.
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
  - Усилить существующий тест: проверить, что рёбра визуального элемента попадают в сегмент `Форма.nkdk`.

---

### Task 1: GraphBuilder Prefix And Incoming Edge Indexes

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`

- [ ] **Step 1: Add failing tests for `nodesWithPrefix`**

Append this test inside `describe("GraphBuilder: nodes()", ...)` in `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`:

```ts
  it("nodesWithPrefix возвращает узлы с заданным префиксом в порядке вставки", () => {
    const g = new GraphBuilder()
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Элемент.Группа")
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Элемент.Поле")
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Реквизит.Поле")
    g.ensureNode("Справочник.Товары.Форма.ДругаяФорма.Элемент.Поле")

    expect([
      ...g.nodesWithPrefix("Справочник.Товары.Форма.ФормаСписка.Элемент."),
    ]).toEqual([
      "Справочник.Товары.Форма.ФормаСписка.Элемент.Группа",
      "Справочник.Товары.Форма.ФормаСписка.Элемент.Поле",
    ])
  })

  it("nodesWithPrefix не считает похожий сегмент подходящим префиксом", () => {
    const g = new GraphBuilder()
    g.ensureNode("Root.Элемент.A")
    g.ensureNode("Root.Элемент2.B")

    expect([...g.nodesWithPrefix("Root.Элемент.")]).toEqual(["Root.Элемент.A"])
  })
```

- [ ] **Step 2: Add failing tests for `edgeEntriesTouching`**

Append this test inside `describe("GraphBuilder: ensureEdge / outEdgeEntries", ...)` in `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts`:

```ts
  it("edgeEntriesTouching возвращает входящие и исходящие рёбра без дублей", () => {
    const g = new GraphBuilder()
    for (const nodeId of ["A", "B", "C", "D"]) {
      g.ensureNode(nodeId)
    }
    g.ensureEdge("A", "B", "AB", { yaml: "ab" })
    g.ensureEdge("C", "A", "CA", { yaml: "ca" })
    g.ensureEdge("B", "D", "BD", { yaml: "bd" })
    g.ensureEdge("C", "D", "CD", { yaml: "cd" })

    const edges = [...g.edgeEntriesTouching(["A", "B"])]
    expect(edges).toHaveLength(3)
    expect(edges.map((edge) => [edge.source, edge.target, edge.attributes.kind])).toEqual([
      ["A", "B", "AB"],
      ["C", "A", "CA"],
      ["B", "D", "BD"],
    ])
  })
```

- [ ] **Step 3: Run GraphBuilder tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
```

Expected: FAIL with TypeScript/runtime errors that `nodesWithPrefix` and `edgeEntriesTouching` do not exist.

- [ ] **Step 4: Implement indexes and methods in GraphBuilder**

In `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`, update the class fields near the existing edge indexes:

```ts
  private readonly nodesByPrefix = new Map<string, string[]>()
  private readonly inEdgesByTarget = new Map<string, EdgeRecord[]>()
```

Add this private helper before `hasNode`:

```ts
  private indexNodePrefixes(id: string): void {
    let dotIndex = id.indexOf(".")
    while (dotIndex !== -1) {
      const prefix = id.slice(0, dotIndex + 1)
      const nodes = this.nodesByPrefix.get(prefix)
      if (nodes) {
        nodes.push(id)
      } else {
        this.nodesByPrefix.set(prefix, [id])
      }
      dotIndex = id.indexOf(".", dotIndex + 1)
    }

    const exact = this.nodesByPrefix.get(id)
    if (exact) {
      exact.push(id)
    } else {
      this.nodesByPrefix.set(id, [id])
    }
  }
```

Update `ensureNode` so it indexes a new node exactly once:

```ts
  ensureNode(id: string, attrs?: Partial<Pick<NodeAttributes, "name" | "item">>): void {
    if (this.nodesMap.has(id)) return
    this.nodesMap.set(id, {
      name: attrs?.name,
      item: attrs?.item,
      filePaths: [],
      contributedFilePaths: [],
      flattenSkipKeys: new Set(),
    })
    this.indexNodePrefixes(id)
  }
```

In `ensureEdge`, after updating `outEdgesBySource`, also update `inEdgesByTarget`:

```ts
    const inEdges = this.inEdgesByTarget.get(tgt)
    if (inEdges) {
      inEdges.push(edge)
    } else {
      this.inEdgesByTarget.set(tgt, [edge])
    }
```

Add these public methods near `outEdgeEntries`:

```ts
  /** Возвращает id узлов с заданным префиксом в порядке вставки узлов. */
  *nodesWithPrefix(prefix: string): Iterable<string> {
    yield* (this.nodesByPrefix.get(prefix) ?? [])
  }

  /**
   * Возвращает рёбра, где source или target входит в nodeIds.
   * Если ребро подходит и как исходящее, и как входящее, оно возвращается один раз.
   */
  *edgeEntriesTouching(
    nodeIds: Iterable<string>,
  ): Iterable<{ source: string; target: string; attributes: EdgeAttributes }> {
    const seen = new Set<EdgeRecord>()
    for (const nodeId of nodeIds) {
      for (const edge of this.outEdgesBySource.get(nodeId) ?? []) {
        if (seen.has(edge)) continue
        seen.add(edge)
        yield { source: edge.src, target: edge.tgt, attributes: edge.attrs }
      }
      for (const edge of this.inEdgesByTarget.get(nodeId) ?? []) {
        if (seen.has(edge)) continue
        seen.add(edge)
        yield { source: edge.src, target: edge.tgt, attributes: edge.attrs }
      }
    }
  }
```

- [ ] **Step 5: Run GraphBuilder tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts
git commit -m "perf: :zap: добавить выборочный обход GraphBuilder"
```

---

### Task 2: Use Selective Traversal For Form NKDK Ownership

**Files:**
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Add failing regression test that full node scan is not used for form relinking**

Append this test inside `describe("importMetadataFileWithGraph — form", ...)` in `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`:

```ts
  it("не обходит все узлы графа при перепривязке визуальных элементов к nkdk", async () => {
    const graph = new GraphBuilder()
    graph.ensureNode("Справочник.Другой.Форма.ФормаСписка.Элемент.Чужой")

    const nodesSpy = vi.spyOn(graph, "nodes")

    await importMetadataFileWithGraph({
      filePath: YAML_PATH,
      nkdkFilePath: NKDK_PATH,
      sources: {
        yaml: [
          "Элементы:",
          "  ПолеВвода1:",
          "    Ширина: 10",
          "",
        ].join("\n"),
        nkdk: "ПолеВвода1(Реквизит): \n",
      },
      kind: "form",
      name: "ФормаСписка",
      graph,
      context: baseContext,
      ownerNodeId: OWNER_NODE_ID,
    })

    expect(nodesSpy).not.toHaveBeenCalled()
  })
```

If `vi` is not imported at the top of the file, change the first import from Vitest to:

```ts
import { describe, expect, it, vi } from "vitest"
```

- [ ] **Step 2: Run the regression test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: FAIL because `importMetadataFileWithGraph` currently calls `graph.nodes()` during form `nkdk` relinking.

- [ ] **Step 3: Replace global scans in form import**

In `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`, replace the whole block:

```ts
    if (nkdkFilePath) {
      const visualPrefix = `${formNodeId}.Элемент.`
      for (const nodeId of graph.nodes()) {
        if (nodeId.startsWith(visualPrefix)) {
          graph.removeFilePath(nodeId, filePath)
          graph.addFilePath(nodeId, nkdkFilePath)
        }
      }

      for (const nodeId of graph.nodes()) {
        for (const { target, attributes } of graph.outEdgeEntries(nodeId)) {
          if (nodeId.startsWith(visualPrefix) || target.startsWith(visualPrefix)) {
            graph.ensureEdge(nodeId, target, attributes.kind, { filePath: nkdkFilePath })
          }
        }
      }
    }
```

with:

```ts
    if (nkdkFilePath) {
      const visualPrefix = `${formNodeId}.Элемент.`
      const visualNodeIds = [...graph.nodesWithPrefix(visualPrefix)]

      for (const nodeId of visualNodeIds) {
        graph.removeFilePath(nodeId, filePath)
        graph.addFilePath(nodeId, nkdkFilePath)
      }

      for (const { source, target, attributes } of graph.edgeEntriesTouching(visualNodeIds)) {
        graph.ensureEdge(source, target, attributes.kind, { filePath: nkdkFilePath })
      }
    }
```

- [ ] **Step 4: Run importMetadataFileWithGraph tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/metadata/orchestration/importMetadataFileWithGraph.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git commit -m "perf: :zap: ускорить перепривязку элементов формы"
```

---

### Task 3: Preserve BuildGraph Payload Semantics

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`

- [ ] **Step 1: Strengthen buildGraph form payload test**

In `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`, inside test `"полная сборка учитывает paired Форма.nkdk и сохраняет stub labels"`, after:

```ts
    expect(nkdk.declaredNodeIds?.some((id) => id.includes(".Элемент."))).toBe(true)
```

add:

```ts
    expect(nkdk.edges.some((edge) => edge.src.includes(".Элемент.") || edge.tgt.includes(".Элемент."))).toBe(true)
    expect(yaml.edges.some((edge) => edge.src.includes(".Элемент.") || edge.tgt.includes(".Элемент."))).toBe(false)
```

- [ ] **Step 2: Run buildGraph tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS. This test should already pass after Task 2; if it fails, inspect whether `edgeEntriesTouching` missed incoming edges.

- [ ] **Step 3: Run focused core graph tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/internal/GraphBuilder.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 3**

```bash
git add packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "test: :white_check_mark: закрепить nkdk-рёбра формы"
```

---

### Task 4: Measure And Run Full Verification

**Files:**
- No source files expected.

- [ ] **Step 1: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all `packages/*`.

- [ ] **Step 2: Run update-graph smoke check on erp_nkdk**

Run:

```bash
pnpm --filter @nakidka/cli dev -- update-graph /Users/nikita/git/erp_nkdk
```

Expected:

- command reaches final timing output;
- `buildGraph` time is visibly lower than the previous multi-minute run; if it again
  runs for more than 5 minutes before printing final timings, stop and re-profile before
  making further changes;
- Chevrotain ambiguity warnings may still appear, because parser grammar ambiguity is outside this task.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -4
```

Expected:

- working tree is clean;
- the last commits correspond to Task 1, Task 2, Task 3, and this plan/spec history.

---

## Self-Review

- Spec coverage: `nodesWithPrefix`, incoming edge index, `edgeEntriesTouching`, selective form relinking, unchanged payload semantics, and verification are covered by Tasks 1-4.
- Placeholder scan: no placeholders or open-ended implementation steps remain.
- Type consistency: method names are consistently `nodesWithPrefix(prefix)` and `edgeEntriesTouching(nodeIds)`; edge entries consistently use `source`, `target`, and `attributes`.
