# Fast Graph Replace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fast full-replace graph update path that writes an empty FalkorDB graph with `CREATE` operations instead of the current incremental `MERGE` path.

**Architecture:** Keep the existing incremental `updateGraph(files)` behavior unchanged. Add `replace?: boolean` to graph update options; when true, `updateGraph` resets the graph, validates duplicate file/node/link keys in memory, creates indexes, then calls `createFiles`, `createNodes`, `createEdges`, and `createFileLinks`. The CLI exposes this as `nkdk update-graph <path> --replace` and passes the option through only for full graph rebuilds.

**Tech Stack:** TypeScript, Vitest, FalkorDB Cypher, `pnpm`, existing `@nakidka/graph` and `@nakidka/cli` packages.

---

## File Structure

- Modify `packages/graph/src/types.ts`: add `replace?: boolean` to `GraphUpdateOptions`.
- Modify `packages/graph/src/internal/operations.ts`: add duplicate validation helpers and `createFiles`, `createNodes`, `createEdges`, `createFileLinks`.
- Modify `packages/graph/src/updateGraph.ts`: branch to the replace path when `opts?.replace === true`.
- Modify `packages/graph/tests/operations.test.ts`: add unit tests for the new `CREATE` operations and validation.
- Modify `packages/graph/tests/updateGraph.test.ts`: add orchestration tests for `replace`.
- Modify `packages/graph/tests/integration/updateGraph.integration.test.ts`: prove normal full update and replace update produce equivalent small graph data.
- Modify `packages/cli/src/cli.ts`: add `--replace` to the `update-graph` command.
- Modify `packages/cli/src/commands/updateGraph.ts`: accept `replace` in full update and pass it to `@nakidka/graph`.
- Modify `packages/cli/src/commands/updateGraph.test.ts`: cover `--replace` command behavior at command function level.

## Task 1: Add Graph Option And Replace Orchestration Tests

**Files:**
- Modify: `packages/graph/src/types.ts`
- Modify: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Add failing tests for replace orchestration**

Append these tests inside `describe("updateGraph", () => { ... })` in `packages/graph/tests/updateGraph.test.ts`, before the existing `"прокидывает ConnectionOptions в connect"` test:

```ts
  it("replace-режим очищает граф и пишет через CREATE без delete/cleanup", async () => {
    await updateGraph([
      {
        filePath: "a.yaml",
        fileStats: { mtimeMs: 10, size: 20, updatedAt: 30 },
        nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
        edges: [{ src: "A", tgt: "A", kind: "SELF", props: { yaml: "Сам" } }],
        declaredNodeIds: ["A"],
      },
    ], { replace: true })

    const cypher = queryMock.mock.calls.map((c) => c[0] as string)
    expect(cypher[0]).toBe("MATCH (n) DETACH DELETE n")
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f:File {path: file.path"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (m:MetadataCatalog:GraphNode {id: n.id}"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (s)-[r:SELF"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f)-[:DECLARES]->(n)"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MATCH (f:File) WHERE f.path IN $filePaths"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MERGE (f:File {path: file.path})"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MERGE (m:MetadataCatalog"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MERGE (s)-[r:SELF]->(t)"))
    expect(cypher).not.toContainEqual(expect.stringContaining("WHERE NOT (:File)-[:DECLARES]->(n)"))
  })

  it("replace-режим сообщает progress по create-фазам", async () => {
    const onProgress = vi.fn()
    await updateGraph([
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A" } },
          { id: "B", label: "ClientApplicationForm", props: { name: "B" } },
        ],
        edges: [{ src: "A", tgt: "B", kind: "FORM" }],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["B"],
      },
    ], { replace: true, onProgress })

    const phases = onProgress.mock.calls.map(([progress]) => progress.phase)
    expect(phases).toContain("resetGraph")
    expect(phases).toContain("createFiles")
    expect(phases).toContain("createNodes")
    expect(phases).toContain("createEdges")
    expect(phases).toContain("createFileLinks")
    expect(phases).not.toContain("deleteByFiles")
    expect(phases).not.toContain("mergeNodes")
    expect(phases).not.toContain("cleanupOrphanStubs")
  })
```

- [ ] **Step 2: Run graph orchestration tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/updateGraph.test.ts
```

Expected: TypeScript or assertion failure because `replace` is not in `GraphUpdateOptions`, `create*` phases do not exist, and `updateGraph` still uses `MERGE`.

- [ ] **Step 3: Add replace option type and create phase names**

In `packages/graph/src/types.ts`, change `GraphUpdatePhase` and `GraphUpdateOptions` to:

```ts
export type GraphUpdatePhase =
  | "resetGraph"
  | "ensureFileIndexes"
  | "ensureLabelIndexes"
  | "deleteByFiles"
  | "mergeFiles"
  | "mergeNodes"
  | "mergeEdges"
  | "mergeFileLinks"
  | "createFiles"
  | "createNodes"
  | "createEdges"
  | "createFileLinks"
  | "cleanupOrphanStubs"

export interface GraphProgress {
  phase: GraphUpdatePhase
  done?: number
  total?: number
}

export interface GraphUpdateOptions extends ConnectionOptions {
  onProgress?: (progress: GraphProgress) => void
  /** Полная замена графа: reset + CREATE-путь без инкрементального delete/MERGE. */
  replace?: boolean
}
```

- [ ] **Step 4: Run graph orchestration tests and keep the useful failure**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/updateGraph.test.ts
```

Expected: tests still fail because runtime behavior has not been implemented; type errors about `replace` and phase names should be gone.

- [ ] **Step 5: Commit the type and failing tests**

Run:

```bash
git add packages/graph/src/types.ts packages/graph/tests/updateGraph.test.ts
git commit -m "test: :white_check_mark: описать replace-режим графа"
```

## Task 2: Add Create Operations And Duplicate Validation

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Add failing operation tests**

Update the import in `packages/graph/tests/operations.test.ts`:

```ts
import {
  createEdges,
  createFileLinks,
  createFiles,
  createNodes,
  deleteByFilePaths,
  cleanupOrphanStubs,
  ensureLabelIndexes,
  mergeNodes,
  mergeEdges,
  validateReplacePayload,
} from "../src/internal/operations"
import type { NodeData, EdgeData, FileGraphData } from "../src/types"
```

Append these tests before `describe("deleteByFilePaths", () => { ... })`:

```ts
describe("createFiles", () => {
  it("пишет File-узлы через CREATE", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      { filePath: "a.yaml", fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 }, nodes: [], edges: [] },
    ]

    await createFiles(conn, files)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (f:File {path: file.path")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (f:File")
  })
})

describe("createNodes", () => {
  it("пишет предметные узлы через CREATE с GraphNode label", async () => {
    const conn = await connect()
    const nodes: NodeData[] = [
      { id: "A", label: "MetadataCatalog", props: { name: "A" } },
    ]

    await createNodes(conn, nodes)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (m:MetadataCatalog:GraphNode {id: n.id}")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (m:")
  })
})

describe("createEdges", () => {
  it("пишет предметные рёбра через CREATE и сохраняет filePath", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Значение" } }],
      },
    ]

    await createEdges(conn, files, new Map([["A", "MetadataCatalog"], ["B", "MetadataAttribute"]]))

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toContain("MATCH (s:MetadataCatalog {id: e.src}), (t:MetadataAttribute {id: e.tgt})")
    expect(queryMock.mock.calls[0][0]).toContain("CREATE (s)-[r:VALUE")
    expect(queryMock.mock.calls[0][0]).toContain("SET r.filePath = e.filePath")
    expect(queryMock.mock.calls[0][0]).not.toContain("MERGE (s)-[r:VALUE")
  })
})

describe("createFileLinks", () => {
  it("пишет DECLARES и CONTRIBUTES через CREATE", async () => {
    const conn = await connect()
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [{ id: "A", label: "MetadataCatalog", props: {} }],
        edges: [],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["B"],
      },
    ]

    await createFileLinks(conn, files)

    const cypher = queryMock.mock.calls.map((call) => call[0] as string)
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f)-[:DECLARES]->(n)"))
    expect(cypher).toContainEqual(expect.stringContaining("CREATE (f)-[:CONTRIBUTES]->(n)"))
    expect(cypher).not.toContainEqual(expect.stringContaining("MERGE (f)-[:DECLARES]->(n)"))
  })
})

describe("validateReplacePayload", () => {
  it("падает на повторяющемся filePath", () => {
    const files: FileGraphData[] = [
      { filePath: "a.yaml", nodes: [], edges: [] },
      { filePath: "a.yaml", nodes: [], edges: [] },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate File.path in replace payload: a.yaml")
  })

  it("падает на повторяющемся node id", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [
          { id: "A", label: "MetadataCatalog", props: {} },
          { id: "A", label: "MetadataAttribute", props: {} },
        ],
        edges: [],
      },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate Node.id in replace payload: A")
  })

  it("падает на повторяющейся DECLARES-связи", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        nodes: [{ id: "A", label: "MetadataCatalog", props: {} }],
        edges: [],
        declaredNodeIds: ["A", "A"],
      },
    ]

    expect(() => validateReplacePayload(files)).toThrow("Duplicate DECLARES link in replace payload: a.yaml -> A")
  })
})
```

- [ ] **Step 2: Run operation tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/operations.test.ts
```

Expected: failures because `createFiles`, `createNodes`, `createEdges`, `createFileLinks`, and `validateReplacePayload` are not exported.

- [ ] **Step 3: Add validation helper**

In `packages/graph/src/internal/operations.ts`, after `filePayload`, add:

```ts
const assertUnique = (seen: Set<string>, key: string, message: string): void => {
  if (seen.has(key)) throw new Error(message)
  seen.add(key)
}

export const validateReplacePayload = (files: readonly FileGraphData[]): void => {
  const filePaths = new Set<string>()
  const nodeIds = new Set<string>()
  const declaredLinks = new Set<string>()
  const contributedLinks = new Set<string>()

  for (const file of files) {
    assertUnique(filePaths, file.filePath, `Duplicate File.path in replace payload: ${file.filePath}`)

    for (const node of file.nodes) {
      assertUnique(nodeIds, node.id, `Duplicate Node.id in replace payload: ${node.id}`)
    }

    for (const nodeId of file.declaredNodeIds ?? file.nodes.map((node) => node.id)) {
      const key = `${file.filePath}\u0000${nodeId}`
      assertUnique(declaredLinks, key, `Duplicate DECLARES link in replace payload: ${file.filePath} -> ${nodeId}`)
    }

    for (const nodeId of file.contributedNodeIds ?? []) {
      const key = `${file.filePath}\u0000${nodeId}`
      assertUnique(contributedLinks, key, `Duplicate CONTRIBUTES link in replace payload: ${file.filePath} -> ${nodeId}`)
    }
  }
}
```

- [ ] **Step 4: Add create operations**

In `packages/graph/src/internal/operations.ts`, add these exports next to the matching merge operations:

```ts
export const createFiles = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const payload = files.map(filePayload)
  if (payload.length === 0) return
  await sendBatches(
    conn,
    payload,
    (batch) =>
      `UNWIND ${cypherFileBatch(batch)} AS file CREATE (f:File {path: file.path, mtimeMs: file.mtimeMs, size: file.size, updatedAt: file.updatedAt})`,
    { phase: "createFiles", onProgress, total: batchCount(payload.length), state: { done: 0 } },
  )
}

export const createNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  if (nodes.length === 0) return
  const byLabel = groupBy(nodes, (n) => n.label)
  const groups = Array.from(byLabel.entries()).map(([label, group]) => ({
    label,
    payload: group.map((n) => ({ id: n.id, props: n.props })),
  }))
  const progress = {
    phase: "createNodes" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { label, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherNodeBatch(batch)} AS n CREATE (m${cypherMergeLabels(label)} {id: n.id}) SET m += n.props`,
      progress,
    )
  }
}

export const createEdges = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  labelByNodeId?: ReadonlyMap<string, string>,
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const edges = files.flatMap((file) =>
    file.edges.map((edge) => ({ ...edge, filePath: file.filePath })),
  )
  if (edges.length === 0) return
  const byKindAndLabels = groupBy(
    edges,
    (e) =>
      `${e.kind}\u0000${labelByNodeId?.get(e.src) ?? ""}\u0000${labelByNodeId?.get(e.tgt) ?? ""}`,
  )
  const groups = Array.from(byKindAndLabels.entries()).map(([groupKey, group]) => {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    return {
      kind,
      srcLabel,
      tgtLabel,
      payload: group.map((e) => ({
        src: e.src,
        tgt: e.tgt,
        filePath: e.filePath,
        props: e.props ?? {},
      })),
    }
  })
  const progress = {
    phase: "createEdges" as const,
    onProgress,
    total: groups.reduce((sum, group) => sum + batchCount(group.payload.length), 0),
    state: { done: 0 },
  }
  for (const { kind, srcLabel, tgtLabel, payload } of groups) {
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) CREATE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`,
      progress,
    )
  }
}

export const createFileLinks = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
  const declared = files.flatMap((file) =>
    (file.declaredNodeIds ?? file.nodes.map((node) => node.id)).map((nodeId) => ({
      filePath: file.filePath,
      nodeId,
    })),
  )
  const contributed = files.flatMap((file) =>
    (file.contributedNodeIds ?? []).map((nodeId) => ({ filePath: file.filePath, nodeId })),
  )
  const progress = {
    phase: "createFileLinks" as const,
    onProgress,
    total: batchCount(declared.length) + batchCount(contributed.length),
    state: { done: 0 },
  }

  await sendBatches(
    conn,
    declared,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) CREATE (f)-[:DECLARES]->(n)`,
    progress,
  )
  await sendBatches(
    conn,
    contributed,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n:GraphNode {id: link.nodeId}) CREATE (f)-[:CONTRIBUTES]->(n)`,
    progress,
  )
}
```

- [ ] **Step 5: Run operation tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/operations.test.ts
```

Expected: PASS for all operation tests.

- [ ] **Step 6: Commit create operations**

Run:

```bash
git add packages/graph/src/internal/operations.ts packages/graph/tests/operations.test.ts
git commit -m "perf: :zap: добавить create-операции графа"
```

## Task 3: Wire Replace Path In Graph Package

**Files:**
- Modify: `packages/graph/src/updateGraph.ts`
- Modify: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Import create operations**

In `packages/graph/src/updateGraph.ts`, change the operation import to include the new functions:

```ts
import {
  cleanupOrphanStubs,
  createEdges,
  createFileLinks,
  createFiles,
  createNodes,
  deleteByFiles,
  ensureFileIndexes,
  ensureLabelIndexes,
  mergeEdges,
  mergeFileLinks,
  mergeFiles,
  mergeNodes,
  resetGraph,
  validateReplacePayload,
} from "./internal/operations"
```

- [ ] **Step 2: Add replace helper**

In `packages/graph/src/updateGraph.ts`, before `export const updateGraph`, add:

```ts
const replaceGraph = async (
  conn: Awaited<ReturnType<typeof connect>>,
  filesToMerge: readonly FileGraphData[],
  allNodes: readonly FileGraphData[number]["nodes"][number][],
  labelByNodeId: ReadonlyMap<string, string>,
  labels: readonly string[],
  onProgress: ((progress: GraphProgress) => void) | undefined,
): Promise<void> => {
  validateReplacePayload(filesToMerge)
  await reportPhase("resetGraph", onProgress, () => resetGraph(conn))
  await reportPhase("ensureFileIndexes", onProgress, () => ensureFileIndexes(conn))
  await reportPhase("ensureLabelIndexes", onProgress, () => ensureLabelIndexes(conn, labels))
  await createFiles(conn, filesToMerge, onProgress)
  await createNodes(conn, allNodes, onProgress)
  await createEdges(conn, filesToMerge, labelByNodeId, onProgress)
  await createFileLinks(conn, filesToMerge, onProgress)
}
```

If TypeScript dislikes `FileGraphData[number]["nodes"][number]`, add `NodeData` to the type import and use this version:

```ts
import type { FileGraphData, GraphProgress, GraphUpdateOptions, GraphUpdatePhase, NodeData } from "./types"
```

```ts
const replaceGraph = async (
  conn: Awaited<ReturnType<typeof connect>>,
  filesToMerge: readonly FileGraphData[],
  allNodes: readonly NodeData[],
  labelByNodeId: ReadonlyMap<string, string>,
  labels: readonly string[],
  onProgress: ((progress: GraphProgress) => void) | undefined,
): Promise<void> => {
  validateReplacePayload(filesToMerge)
  await reportPhase("resetGraph", onProgress, () => resetGraph(conn))
  await reportPhase("ensureFileIndexes", onProgress, () => ensureFileIndexes(conn))
  await reportPhase("ensureLabelIndexes", onProgress, () => ensureLabelIndexes(conn, labels))
  await createFiles(conn, filesToMerge, onProgress)
  await createNodes(conn, allNodes, onProgress)
  await createEdges(conn, filesToMerge, labelByNodeId, onProgress)
  await createFileLinks(conn, filesToMerge, onProgress)
}
```

- [ ] **Step 3: Branch inside updateGraph**

Inside `try { ... }` in `updateGraph`, after the existing `files.length === 0` block and before the incremental path, add:

```ts
    if (opts?.replace === true) {
      await replaceGraph(conn, filesToMerge, allNodes, labelByNodeId, labels, onProgress)
      return
    }
```

- [ ] **Step 4: Run graph orchestration tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/updateGraph.test.ts
```

Expected: PASS for `tests/updateGraph.test.ts`.

- [ ] **Step 5: Commit graph wiring**

Run:

```bash
git add packages/graph/src/updateGraph.ts packages/graph/tests/updateGraph.test.ts
git commit -m "perf: :zap: включить replace-путь графа"
```

## Task 4: Add Replace Integration Coverage

**Files:**
- Modify: `packages/graph/tests/integration/updateGraph.integration.test.ts`

- [ ] **Step 1: Add failing integration test**

Append this test inside `describe("updateGraph (integration)", () => { ... })`:

```ts
  it("replace-режим создаёт тот же маленький граф, что и обычный полный путь", async () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
        nodes: [
          { id: "A", label: "MetadataCatalog", props: { name: "A", p_hierarchical: true } },
          { id: "B", label: "MetadataAttribute", props: { name: "B" } },
        ],
        edges: [{ src: "A", tgt: "B", kind: "VALUE", props: { yaml: "Реквизит" } }],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["B"],
      },
    ]

    await updateGraph(files, opts())
    const normalRows = await withGraph(
      async (g) =>
        await g.query<{ files: number; nodes: number; values: number; declares: number; contributes: number }>(
          [
            "MATCH (f:File)",
            "WITH count(f) AS files",
            "MATCH (n:GraphNode)",
            "WITH files, count(n) AS nodes",
            "MATCH ()-[value:VALUE]->()",
            "WITH files, nodes, count(value) AS values",
            "MATCH (:File)-[declares:DECLARES]->()",
            "WITH files, nodes, values, count(declares) AS declares",
            "MATCH (:File)-[contributes:CONTRIBUTES]->()",
            "RETURN files, nodes, values, declares, count(contributes) AS contributes",
          ].join(" "),
        ),
      opts(),
    )

    await updateGraph(files, { ...opts(), replace: true })
    const replaceRows = await withGraph(
      async (g) =>
        await g.query<{ files: number; nodes: number; values: number; declares: number; contributes: number }>(
          [
            "MATCH (f:File)",
            "WITH count(f) AS files",
            "MATCH (n:GraphNode)",
            "WITH files, count(n) AS nodes",
            "MATCH ()-[value:VALUE]->()",
            "WITH files, nodes, count(value) AS values",
            "MATCH (:File)-[declares:DECLARES]->()",
            "WITH files, nodes, values, count(declares) AS declares",
            "MATCH (:File)-[contributes:CONTRIBUTES]->()",
            "RETURN files, nodes, values, declares, count(contributes) AS contributes",
          ].join(" "),
        ),
      opts(),
    )

    expect(replaceRows).toEqual(normalRows)
    expect(replaceRows[0]).toEqual({ files: 1, nodes: 2, values: 1, declares: 1, contributes: 1 })
  })
```

- [ ] **Step 2: Run integration test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts
```

Expected: PASS if FalkorDB test container starts successfully.

- [ ] **Step 3: Commit integration coverage**

Run:

```bash
git add packages/graph/tests/integration/updateGraph.integration.test.ts
git commit -m "test: :white_check_mark: проверить replace-граф интеграционно"
```

## Task 5: Expose Replace In CLI Command Layer

**Files:**
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Modify: `packages/cli/src/commands/updateGraph.test.ts`

- [ ] **Step 1: Add failing CLI command test**

In `packages/cli/src/commands/updateGraph.test.ts`, append this test inside `describe("updateGraph command", () => { ... })`:

```ts
  it("полный updateGraph с replace пишет граф одним replace-вызовом", async () => {
    const projectPath = createProject()
    const yamlPath = "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
    writeProjectFile(projectPath, yamlPath, "Элементы: {}\n")

    await updateGraph(projectPath, { replace: true })

    const graphName = projectGraphName(projectPath)
    expect(mocks.buildGraph).toHaveBeenCalledOnce()
    expect(mocks.writeGraph).toHaveBeenCalledOnce()
    expect(mocks.writeGraph).toHaveBeenCalledWith(
      [graphFile(yamlPath)],
      expect.objectContaining({ graphName, replace: true }),
    )
  })
```

- [ ] **Step 2: Run CLI command test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: TypeScript failure because `updateGraph(projectPath, { replace: true })` is not supported.

- [ ] **Step 3: Add CLI command option type and pass-through**

In `packages/cli/src/commands/updateGraph.ts`, add a type near `createGraphOptions`:

```ts
interface UpdateGraphCommandOptions {
  replace?: boolean
}
```

Change the full update function signature and write path:

```ts
export const updateGraph = async (
  projectPath: string,
  opts: UpdateGraphCommandOptions = {},
): Promise<void> => {
  const absoluteProjectPath = resolve(projectPath)
  if (!existsSync(absoluteProjectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()
  const tReadStart = performance.now()
  const projectFiles = readProjectFileList(absoluteProjectPath)
  const sources = readProjectGraphSources(absoluteProjectPath)
  const tRead = performance.now() - tReadStart

  const tBuildStart = performance.now()
  const graphFiles = attachStubEdgesToOwners(await buildPayload(sources, []))
  const tBuild = performance.now() - tBuildStart

  const tWriteStart = performance.now()
  const graphOptions = createGraphOptions(absoluteProjectPath)
  if (opts.replace === true) {
    await writeGraph(graphFiles, { ...graphOptions, replace: true, onProgress: createProgressReporter() })
  } else {
    await writeGraph([], graphOptions)
    await writeGraph(graphFiles, { ...graphOptions, onProgress: createProgressReporter() })
  }
  const tWrite = performance.now() - tWriteStart

  const totalNodes = graphFiles.reduce((sum, file) => sum + file.nodes.length, 0)
  const totalEdges = graphFiles.reduce((sum, file) => sum + file.edges.length, 0)
  const tTotal = performance.now() - tStart

  console.log(`чтение файлов    — ${tRead.toFixed(1)} мс — ${projectFiles.length} шт.`)
  console.log(`buildGraph       — ${tBuild.toFixed(1)} мс — узлов ${totalNodes}, рёбер ${totalEdges}`)
  console.log(`updateGraph      — ${tWrite.toFixed(1)} мс`)
  console.log(`итого            — ${tTotal.toFixed(1)} мс`)
}
```

- [ ] **Step 4: Run CLI command tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: PASS for command tests.

- [ ] **Step 5: Commit CLI command layer**

Run:

```bash
git add packages/cli/src/commands/updateGraph.ts packages/cli/src/commands/updateGraph.test.ts
git commit -m "perf: :zap: передать replace в update-graph"
```

## Task 6: Add CLI Flag

**Files:**
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Add CLI flag implementation**

In `packages/cli/src/cli.ts`, replace the `update-graph` command block with:

```ts
program
  .command("update-graph")
  .description("Обновить граф метаданных в FalkorDB по YAML-проекту")
  .argument("<path>", "путь к корню YAML-проекта")
  .option("--file <filePath>", "обновить только один файл проекта")
  .option("--replace", "полностью заменить граф быстрым CREATE-путём")
  .action((projectPath: string, opts: { file?: string; replace?: boolean }) => {
    run(() => opts.file ? updateGraphFile(projectPath, opts.file) : updateGraph(projectPath, { replace: opts.replace === true }))
  })
```

- [ ] **Step 2: Verify CLI help contains the flag**

Run:

```bash
pnpm --filter @nakidka/cli dev update-graph --help
```

Expected output includes:

```text
--replace
```

- [ ] **Step 3: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit CLI flag**

Run:

```bash
git add packages/cli/src/cli.ts
git commit -m "feat: :sparkles: добавить флаг replace для графа"
```

## Task 7: Final Verification And ERP Measurement

**Files:**
- No planned source edits.

- [ ] **Step 1: Run graph unit tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- tests/operations.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run CLI command tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS. Current clean baseline in this worktree before implementation was `3828` tests passed and `5` skipped.

- [ ] **Step 4: Measure full replace graph import on ERP project**

Run:

```bash
pnpm --filter @nakidka/cli dev update-graph /Users/nikita/git/erp_nkdk --replace
```

Expected: command completes successfully and prints timing lines:

```text
чтение файлов    — ...
buildGraph       — ...
updateGraph      — ...
итого            — ...
```

Compare `updateGraph` time with the previous baseline: about `273990.1 мс`. The replace path should reduce this phase noticeably.

- [ ] **Step 5: Commit final measurement note if code comments or docs changed**

If no files changed during measurement, do not commit. If a small measurement note is added to the spec or plan, run:

```bash
git add docs/superpowers/specs/2026-05-25-fast-graph-replace-design.md docs/superpowers/plans/2026-05-25-fast-graph-replace.md
git commit -m "docs: :memo: обновить замер replace-графа"
```

## Self-Review

- Spec coverage: `replace` option, `CREATE` operations, duplicate validation, CLI flag, integration coverage, and ERP timing measurement are covered by Tasks 1-7.
- Placeholder scan: no forbidden placeholder markers or open implementation gaps remain.
- Type consistency: the plan uses `replace?: boolean`, `createFiles`, `createNodes`, `createEdges`, `createFileLinks`, `validateReplacePayload`, and create phase names consistently across graph and CLI tasks.
