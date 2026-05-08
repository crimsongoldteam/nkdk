# Incremental Graph Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `nkdk watch` and `nkdk update-graph --file` so graph updates are driven by changed files, with `File` nodes as the source of truth for synchronization state and ownership.

**Architecture:** `@nakidka/graph` owns persistence semantics: `File` nodes, `DECLARES`, `CONTRIBUTES`, and relationship cleanup. `@nakidka/core` owns pure graph segment construction from one project file or a full file map. `@nakidka/cli` owns filesystem scanning, path normalization, watch queues, and command wiring.

**Tech Stack:** TypeScript, Vitest, Commander, FalkorDB Cypher, `yaml`, `chokidar`.

---

## File Structure

- Modify `packages/graph/src/types.ts`: extend `FileGraphData` with file stats and ownership fields; add `GraphFileRecord`.
- Modify `packages/graph/src/index.ts`: export new graph file listing API.
- Modify `packages/graph/src/updateGraph.ts`: call File-node operations instead of `props.filePath` deletion.
- Modify `packages/graph/src/internal/operations.ts`: add `File` index, file upsert, `DECLARES`/`CONTRIBUTES` merge, file-owned cleanup, edge ownership by relationship `filePath`.
- Create `packages/graph/src/getGraphFiles.ts`: read `(:File)` records for watcher startup comparison.
- Modify `packages/graph/tests/updateGraph.test.ts`: lock File-node write/delete semantics.
- Create `packages/graph/tests/getGraphFiles.test.ts`: lock `getGraphFiles` connection and result mapping.
- Modify `packages/core/metadata/orchestration/buildGraph/types.ts`: mirror `FileGraphData` shape from graph package.
- Modify `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`: distinguish declared and contributed file paths.
- Modify `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`: stop writing `props.filePath`, produce `declaredNodeIds` and `contributedNodeIds`.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`: export path parsing and add single-file build entrypoint.
- Create `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`: pure API for one changed file plus optional paired form source.
- Create `packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts`: reusable NKDK parser for form graph building.
- Modify `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`: parse optional `sources.nkdk`, set YAML vs NKDK ownership for form root and visual elements.
- Modify `packages/core/metadata/orchestration/buildGraph/*.test.ts`: update assertions for File-node ownership and changed-file behavior.
- Modify `packages/cli/package.json`: add explicit `chokidar` dependency.
- Modify `packages/cli/src/cli.ts`: add `nkdk watch` and `update-graph --file`.
- Modify `packages/cli/src/commands/updateGraph.ts`: split full update and file update.
- Create `packages/cli/src/commands/watch.ts`: long-running watcher entrypoint.
- Create `packages/cli/src/graph/projectFiles.ts`: scan supported project files, normalize paths, pair `Форма.yaml` and `Форма.nkdk`.
- Create `packages/cli/src/graph/watchQueue.ts`: debounce and serialize graph update tasks.
- Create `packages/cli/src/graph/fileStats.ts`: stat files and compare with `GraphFileRecord`.
- Create `packages/cli/src/graph/projectFiles.test.ts`, `watchQueue.test.ts`, `fileStats.test.ts`: CLI behavior tests.

## Task 1: Extend Graph API Types

**Files:**
- Modify: `packages/graph/src/types.ts`
- Modify: `packages/graph/src/index.ts`
- Test: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Write the failing type-level and runtime test**

Add this test to `packages/graph/tests/updateGraph.test.ts` inside `describe("updateGraph", ...)`:

```ts
it("создаёт File-узел и служебные связи для declared/contributed узлов", async () => {
  const files: FileGraphData[] = [
    {
      filePath: "Справочник/Товары/Свойства.yaml",
      fileStats: { mtimeMs: 10, size: 20, updatedAt: 30 },
      nodes: [
        { id: "Справочник.Товары", label: "MetadataCatalog", props: { name: "Товары" } },
        { id: "Справочник.Товары.Форма.ФормаСписка", label: "ClientApplicationForm", props: { name: "ФормаСписка" } },
      ],
      edges: [
        { src: "Справочник.Товары", tgt: "Справочник.Товары.Форма.ФормаСписка", kind: "FORM", props: { yaml: "Форма" } },
      ],
      declaredNodeIds: ["Справочник.Товары"],
      contributedNodeIds: ["Справочник.Товары.Форма.ФормаСписка"],
    },
  ]

  await updateGraph(files)

  const cypher = queryMock.mock.calls.map((c) => c[0] as string)
  expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:File) ON (n.path)"))
  expect(cypher).toContainEqual(expect.stringContaining("MERGE (f:File {path: file.path})"))
  expect(cypher).toContainEqual(expect.stringContaining("MERGE (f)-[:DECLARES]->(n)"))
  expect(cypher).toContainEqual(expect.stringContaining("MERGE (f)-[:CONTRIBUTES]->(n)"))
  expect(cypher).toContainEqual(expect.stringContaining("SET r.filePath = e.filePath"))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts
```

Expected: FAIL with TypeScript errors for unknown `fileStats`, `declaredNodeIds`, `contributedNodeIds`, or missing Cypher fragments.

- [ ] **Step 3: Extend graph package types**

Change `packages/graph/src/types.ts` to include these additions:

```ts
export interface FileStats {
  mtimeMs: number
  size: number
  updatedAt: number
}

export interface GraphFileRecord extends FileStats {
  path: string
}

export interface FileGraphData {
  /** Относительный путь файла-источника в YAML-проекте. */
  filePath: string
  /** Состояние файла на диске для watcher-сравнения. */
  fileStats?: FileStats
  nodes: NodeData[]
  edges: EdgeData[]
  /** Узлы, жизненным циклом которых владеет filePath. */
  declaredNodeIds?: string[]
  /** Узлы, на которые filePath влияет, но которыми не владеет. */
  contributedNodeIds?: string[]
}
```

Keep `NodeData` and `EdgeData` unchanged.

- [ ] **Step 4: Export graph file types**

Update `packages/graph/src/index.ts` type exports:

```ts
export type {
  ConnectionOptions,
  EdgeData,
  FileGraphData,
  FileStats,
  GraphFileRecord,
  GraphPrimitive,
  NodeData,
} from "./types"
```

- [ ] **Step 5: Run type-focused graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts
```

Expected: FAIL only because implementation does not yet create File indexes/nodes/links.

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/types.ts packages/graph/src/index.ts packages/graph/tests/updateGraph.test.ts
git commit -m "feat: :sparkles: расширить типы файлов графа"
```

## Task 2: Implement File Nodes And Ownership In `@nakidka/graph`

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/src/updateGraph.ts`
- Test: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Add failing deletion tests**

Add these tests to `packages/graph/tests/updateGraph.test.ts`:

```ts
it("удаляет старые DECLARES/CONTRIBUTES перед новой записью файла", async () => {
  await updateGraph([{ filePath: "a.yaml", nodes: [], edges: [] }])

  const cypher = queryMock.mock.calls.map((c) => c[0] as string)
  expect(cypher).toContainEqual(expect.stringContaining("MATCH (f:File) WHERE f.path IN $filePaths"))
  expect(cypher).toContainEqual(expect.stringContaining("[oldRel:DECLARES|CONTRIBUTES]"))
  expect(cypher).toContainEqual(expect.stringContaining("DELETE oldRel"))
  expect(cypher).toContainEqual(expect.stringContaining("DETACH DELETE f"))
})

it("не считает DECLARES и CONTRIBUTES предметными входящими рёбрами", async () => {
  await updateGraph([{ filePath: "a.yaml", nodes: [], edges: [] }])

  const cypher = queryMock.mock.calls.map((c) => c[0] as string)
  expect(cypher).toContainEqual(expect.stringContaining("type(r) <> 'DECLARES'"))
  expect(cypher).toContainEqual(expect.stringContaining("type(r) <> 'CONTRIBUTES'"))
})
```

- [ ] **Step 2: Run failing graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts
```

Expected: FAIL because `operations.ts` still deletes by `n.filePath`.

- [ ] **Step 3: Add File operation helpers**

In `packages/graph/src/internal/operations.ts`, extend imports:

```ts
import type { EdgeData, FileGraphData, FileStats, NodeData } from "../types"
```

Add helpers near `cypherEdgeBatch`:

```ts
const nowStats = (): FileStats => ({
  mtimeMs: 0,
  size: 0,
  updatedAt: Date.now(),
})

const filePayload = (file: FileGraphData): { path: string; stats: FileStats } => ({
  path: file.filePath,
  stats: file.fileStats ?? nowStats(),
})

const cypherFileBatch = (files: readonly { path: string; stats: FileStats }[]): string =>
  `[${files
    .map(
      (file) =>
        `{path:${cypherString(file.path)},mtimeMs:${file.stats.mtimeMs},size:${file.stats.size},updatedAt:${file.stats.updatedAt}}`,
    )
    .join(",")}]`

const cypherLinkBatch = (links: readonly { filePath: string; nodeId: string }[]): string =>
  `[${links
    .map((link) => `{filePath:${cypherString(link.filePath)},nodeId:${cypherString(link.nodeId)}}`)
    .join(",")}]`
```

Add operation functions:

```ts
export const ensureFileIndexes = async (conn: GraphConnection): Promise<void> => {
  await ensureIndex(conn, "File", "path")
}

export const deleteByFiles = async (
  conn: GraphConnection,
  filePaths: readonly string[],
): Promise<void> => {
  if (filePaths.length === 0) return
  const params = { filePaths: [...filePaths] }

  await query(
    conn,
    [
      "MATCH (f:File) WHERE f.path IN $filePaths",
      "OPTIONAL MATCH (f)-[:DECLARES]->(n)",
      "WITH f, collect(n) AS oldNodes",
      "OPTIONAL MATCH (f)-[oldRel:DECLARES|CONTRIBUTES]->()",
      "DELETE oldRel",
      "WITH f, oldNodes",
      "UNWIND oldNodes AS n",
      "OPTIONAL MATCH (:File)-[:DECLARES]->(n)",
      "WITH f, n, count(*) AS owners",
      "OPTIONAL MATCH ()-[r]->(n)",
      "WHERE type(r) <> 'DECLARES' AND type(r) <> 'CONTRIBUTES'",
      "WITH f, n, owners, count(r) AS subjectIncoming",
      "OPTIONAL MATCH (n)-[out]->()",
      "WHERE type(out) <> 'DECLARES' AND type(out) <> 'CONTRIBUTES'",
      "DELETE out",
      "WITH f, n, owners, subjectIncoming",
      "FOREACH (_ IN CASE WHEN owners = 0 AND subjectIncoming > 0 THEN [1] ELSE [] END | SET n = {id: n.id})",
      "FOREACH (_ IN CASE WHEN owners = 0 AND subjectIncoming = 0 THEN [1] ELSE [] END | DETACH DELETE n)",
      "WITH DISTINCT f",
      "DETACH DELETE f",
    ].join(" "),
    params,
  )

  await query(
    conn,
    "MATCH ()-[r]->() WHERE r.filePath IN $filePaths DELETE r",
    params,
  )
}

export const mergeFiles = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
): Promise<void> => {
  const payload = files.map(filePayload)
  if (payload.length === 0) return
  await sendBatches(
    conn,
    payload,
    (batch) =>
      `UNWIND ${cypherFileBatch(batch)} AS file MERGE (f:File {path: file.path}) SET f.mtimeMs = file.mtimeMs, f.size = file.size, f.updatedAt = file.updatedAt`,
  )
}

export const mergeFileLinks = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
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

  await sendBatches(
    conn,
    declared,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n {id: link.nodeId}) MERGE (f)-[:DECLARES]->(n)`,
  )
  await sendBatches(
    conn,
    contributed,
    (batch) =>
      `UNWIND ${cypherLinkBatch(batch)} AS link MATCH (f:File {path: link.filePath}), (n {id: link.nodeId}) MERGE (f)-[:CONTRIBUTES]->(n)`,
  )
}
```

- [ ] **Step 4: Add relationship file ownership**

Change `mergeEdges` signature in `packages/graph/src/internal/operations.ts`:

```ts
export const mergeEdges = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  labelByNodeId?: ReadonlyMap<string, string>,
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
  for (const [groupKey, group] of byKindAndLabels) {
    const [kind, srcLabel, tgtLabel] = groupKey.split("\u0000") as [string, string, string]
    const payload = group.map((e) => ({
      src: e.src,
      tgt: e.tgt,
      filePath: e.filePath,
      props: e.props ?? {},
    }))
    await sendBatches(
      conn,
      payload,
      (batch) =>
        `UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLabel(srcLabel || undefined)} {id: e.src}), (t${cypherLabel(tgtLabel || undefined)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`,
    )
  }
}
```

Update `cypherEdgeBatch` to include `filePath`:

```ts
const cypherEdgeBatch = (
  edges: readonly { src: string; tgt: string; filePath: string; props: NonNullable<EdgeData["props"]> }[],
): string =>
  `[${edges
    .map(
      (edge) =>
        `{src:${cypherString(edge.src)},tgt:${cypherString(edge.tgt)},filePath:${cypherString(edge.filePath)},props:${cypherProps(sanitizeProps(edge.props))}}`,
    )
    .join(",")}]`
```

- [ ] **Step 5: Update `updateGraph` orchestration**

Change `packages/graph/src/updateGraph.ts` imports and body:

```ts
import {
  cleanupOrphanStubs,
  deleteByFiles,
  ensureFileIndexes,
  ensureLabelIndexes,
  mergeEdges,
  mergeFileLinks,
  mergeFiles,
  mergeNodes,
} from "./internal/operations"
```

Replace the operation sequence:

```ts
await ensureFileIndexes(conn)
await ensureLabelIndexes(conn, labels)
await deleteByFiles(conn, filePaths)
await mergeFiles(conn, files)
await mergeNodes(conn, allNodes)
await mergeEdges(conn, files, labelByNodeId)
await mergeFileLinks(conn, files)
await cleanupOrphanStubs(conn)
```

- [ ] **Step 6: Update orphan cleanup**

Replace `cleanupOrphanStubs` query:

```ts
export const cleanupOrphanStubs = async (conn: GraphConnection): Promise<void> => {
  await query(
    conn,
    [
      "MATCH (n)",
      "WHERE NOT (:File)-[:DECLARES]->(n)",
      "OPTIONAL MATCH ()-[r]->(n)",
      "WHERE type(r) <> 'DECLARES' AND type(r) <> 'CONTRIBUTES'",
      "WITH n, count(r) AS subjectIncoming",
      "WHERE subjectIncoming = 0",
      "DETACH DELETE n",
    ].join(" "),
  )
}
```

- [ ] **Step 7: Run graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/src/updateGraph.ts packages/graph/tests/updateGraph.test.ts
git commit -m "feat: :sparkles: хранить владельцев файлов в графе"
```

## Task 3: Add `getGraphFiles`

**Files:**
- Create: `packages/graph/src/getGraphFiles.ts`
- Modify: `packages/graph/src/index.ts`
- Test: `packages/graph/tests/getGraphFiles.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/graph/tests/getGraphFiles.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const queryMock = vi.fn()
const selectGraphMock = vi.fn()
const connectMock = vi.fn()
const closeMock = vi.fn()

vi.mock("falkordb", () => ({
  FalkorDB: { connect: (opts?: unknown) => connectMock(opts) },
}))

import { getGraphFiles } from "../src/getGraphFiles"

beforeEach(() => {
  queryMock.mockReset().mockResolvedValue({
    data: [
      { path: "a.yaml", mtimeMs: 1, size: 2, updatedAt: 3 },
      { path: "b.yaml", mtimeMs: 4, size: 5, updatedAt: 6 },
    ],
  })
  selectGraphMock.mockReset().mockReturnValue({ query: queryMock })
  closeMock.mockReset().mockResolvedValue(undefined)
  connectMock.mockReset().mockResolvedValue({ selectGraph: selectGraphMock, close: closeMock })
})

describe("getGraphFiles", () => {
  it("читает File-узлы и закрывает соединение", async () => {
    const result = await getGraphFiles({ graphName: "g" })

    expect(selectGraphMock).toHaveBeenCalledWith("g")
    expect(queryMock).toHaveBeenCalledWith(
      "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt",
      undefined,
    )
    expect(result).toEqual([
      { path: "a.yaml", mtimeMs: 1, size: 2, updatedAt: 3 },
      { path: "b.yaml", mtimeMs: 4, size: 5, updatedAt: 6 },
    ])
    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph test -- getGraphFiles.test.ts
```

Expected: FAIL because `getGraphFiles.ts` does not exist.

- [ ] **Step 3: Implement `getGraphFiles`**

Create `packages/graph/src/getGraphFiles.ts`:

```ts
import { close, connect, query } from "./internal/connection"
import type { ConnectionOptions, GraphFileRecord } from "./types"

export const getGraphFiles = async (
  opts?: ConnectionOptions,
): Promise<GraphFileRecord[]> => {
  const conn = await connect(opts)
  try {
    const reply = await query(
      conn,
      "MATCH (f:File) RETURN f.path AS path, f.mtimeMs AS mtimeMs, f.size AS size, f.updatedAt AS updatedAt",
    ) as { data?: GraphFileRecord[] }
    return reply.data ?? []
  } finally {
    await close(conn)
  }
}
```

- [ ] **Step 4: Export API**

Add to `packages/graph/src/index.ts`:

```ts
export { getGraphFiles } from "./getGraphFiles"
```

- [ ] **Step 5: Run graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- getGraphFiles.test.ts updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/getGraphFiles.ts packages/graph/src/index.ts packages/graph/tests/getGraphFiles.test.ts
git commit -m "feat: :sparkles: читать файлы графа"
```

## Task 4: Carry File Ownership Through Core Graph Data

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/types.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`

- [ ] **Step 1: Update failing tests for no node `props.filePath`**

In `packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts`, change the first grouping assertion to:

```ts
expect(fileA.nodes).toEqual([
  {
    id: "Справочник.К",
    label: "MetadataCatalog",
    props: { name: "К", p_codeLength: 9 },
  },
])
expect(fileA.declaredNodeIds).toEqual(["Справочник.К"])
```

Change the stub assertion to:

```ts
const stubSegment = result.find((f) => f.filePath === "")!
expect(stubSegment.nodes).toEqual([
  { id: "B", label: "Unknown", props: { name: "B" } },
])
expect(stubSegment.declaredNodeIds).toEqual([])
```

Replace the test `"узлы с двумя filePaths попадают..."` with:

```ts
it("contributed filePath попадает в contributedNodeIds без дублирования узла", () => {
  const g = new GraphBuilder()
  promote(g, "Справочник.К.Форма.Ф", "Ф", ["yaml.yaml"], {
    itemType: "ClientApplicationForm",
    name: "Ф",
  })
  g.addContributedFilePath("Справочник.К.Форма.Ф", "nkdk.nkdk")

  const result = walkGraphToFileData(g)
  const yaml = result.find((f) => f.filePath === "yaml.yaml")!
  const nkdk = result.find((f) => f.filePath === "nkdk.nkdk")!

  expect(yaml.declaredNodeIds).toEqual(["Справочник.К.Форма.Ф"])
  expect(nkdk.nodes).toEqual([])
  expect(nkdk.contributedNodeIds).toEqual(["Справочник.К.Форма.Ф"])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: FAIL because `filePath` still appears in node props and `addContributedFilePath` does not exist.

- [ ] **Step 3: Extend core `FileGraphData`**

In `packages/core/metadata/orchestration/buildGraph/types.ts`, add:

```ts
export interface FileStats {
  mtimeMs: number
  size: number
  updatedAt: number
}
```

Change `FileGraphData`:

```ts
export interface FileGraphData {
  filePath: string
  fileStats?: FileStats
  nodes: NodeData[]
  edges: EdgeData[]
  declaredNodeIds?: string[]
  contributedNodeIds?: string[]
}
```

- [ ] **Step 4: Add contributed paths to `GraphBuilder`**

In `packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts`, change `NodeAttributes`:

```ts
export interface NodeAttributes {
  name: string | undefined
  item: unknown
  filePaths: string[]
  contributedFilePaths: string[]
  flattenSkipKeys: Set<string>
}
```

Initialize the field in `ensureNode`:

```ts
contributedFilePaths: [],
```

Add method:

```ts
addContributedFilePath(id: string, filePath: string): void {
  const node = this.getNodeAttributes(id)
  if (!node.contributedFilePaths.includes(filePath)) {
    node.contributedFilePaths.push(filePath)
  }
}
```

- [ ] **Step 5: Update `walkGraphToFileData`**

Replace segment type:

```ts
type Segment = {
  nodes: NodeData[]
  edges: EdgeData[]
  declaredNodeIds: string[]
  contributedNodeIds: string[]
}
```

Change `ensureSegment`:

```ts
const segmentByFilePath = new Map<string, Segment>()
const ensureSegment = (filePath: string) => {
  let seg = segmentByFilePath.get(filePath)
  if (!seg) {
    seg = { nodes: [], edges: [], declaredNodeIds: [], contributedNodeIds: [] }
    segmentByFilePath.set(filePath, seg)
  }
  return seg
}
```

In the node loop, remove:

```ts
if (filePath !== STUB_SEGMENT) props.filePath = filePath
```

Add declaration/contribution tracking:

```ts
for (const filePath of filePaths) {
  const props: NodeData["props"] = {}
  if (attrs.name !== undefined) props.name = attrs.name
  Object.assign(props, flattenItem(attrs.item, { skipKeys: attrs.flattenSkipKeys }))

  const item = attrs.item as Record<string, unknown> | undefined
  const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
  const label = itemType ?? UNKNOWN_LABEL

  const segment = ensureSegment(filePath)
  segment.nodes.push({ id: nodeId, label, props })
  if (filePath !== STUB_SEGMENT) segment.declaredNodeIds.push(nodeId)
}

for (const filePath of attrs.contributedFilePaths) {
  ensureSegment(filePath).contributedNodeIds.push(nodeId)
}
```

In final mapping:

```ts
return Array.from(segmentByFilePath.entries()).map(([filePath, seg]) => ({
  filePath,
  nodes: seg.nodes,
  edges: seg.edges,
  declaredNodeIds: seg.declaredNodeIds,
  contributedNodeIds: seg.contributedNodeIds,
}))
```

- [ ] **Step 6: Run core walk tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/types.ts packages/core/metadata/orchestration/buildGraph/internal/GraphBuilder.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.ts packages/core/metadata/orchestration/buildGraph/walkGraphToFileData.test.ts
git commit -m "feat: :sparkles: передавать владельцев файлов из core"
```

## Task 5: Add Single-File Graph Build API

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Create: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/index.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildGraphForChangedFile } from "./buildGraphForChangedFile"
import type { ImportContext } from "./types"

const ctx: ImportContext = { version: "2.20", defaultLanguage: "ru" }

describe("buildGraphForChangedFile", () => {
  it("строит сегмент одного Свойства.yaml", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/project",
      filePath: "Справочник/Товары/Свойства.yaml",
      text: "ДлинаКода: 9\n",
      context: ctx,
    })

    expect(result).toHaveLength(1)
    expect(result[0]!.filePath).toBe("Справочник/Товары/Свойства.yaml")
    expect(result[0]!.declaredNodeIds).toContain("Справочник.Товары")
  })

  it("строит сегмент Форма.yaml с ownerNodeId из пути", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/project",
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      text: "Реквизиты: {}\n",
      context: ctx,
    })

    const form = result[0]!.nodes.find((node) => node.id === "Справочник.Товары.Форма.ФормаСписка")
    expect(form?.label).toBe("ClientApplicationForm")
    expect(result[0]!.declaredNodeIds).toContain("Справочник.Товары.Форма.ФормаСписка")
  })

  it("игнорирует неподдержанный путь", () => {
    const result = buildGraphForChangedFile({
      projectPath: "/project",
      filePath: "README.md",
      text: "# x\n",
      context: ctx,
    })
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Export path parsing from `buildGraph.ts`**

In `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`, export the parsed path interfaces and `parseFilePath`:

```ts
export interface ParsedItemPath {
  kind: MetadataKind
  name: string
}

export interface ParsedFormPath {
  kind: "form"
  ownerNodeId: string
  formName: string
}

export function parseFilePath(filePath: string): ParsedItemPath | ParsedFormPath | undefined {
  ...
}
```

Remove the old non-exported interface declarations to keep one definition.

- [ ] **Step 4: Implement `buildGraphForChangedFile`**

Create `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`:

```ts
import { GraphBuilder } from "./internal/GraphBuilder"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import type { ConfigurationContext } from "~/metadata/context/types"
import { walkGraphToFileData } from "./walkGraphToFileData"
import { parseFilePath } from "./buildGraph"
import type { FileGraphData, ImportContext } from "./types"

export interface BuildGraphForChangedFileParams {
  projectPath: string
  filePath: string
  text: string
  context: ImportContext
  pairedText?: {
    filePath: string
    text: string
  }
}

export function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): FileGraphData[] {
  const parsed = parseFilePath(params.filePath)
  if (!parsed) return []

  const graph = new GraphBuilder()
  const context = params.context as ConfigurationContext

  if (parsed.kind === "form") {
    const nkdk =
      params.pairedText?.filePath.endsWith(".nkdk") === true
        ? params.pairedText.text
        : undefined
    importMetadataFileWithGraph({
      filePath: params.filePath,
      nkdkFilePath: params.pairedText?.filePath,
      sources: { yaml: params.text, nkdk },
      kind: "form",
      name: parsed.formName,
      graph,
      context,
      ownerNodeId: parsed.ownerNodeId,
    })
    return walkGraphToFileData(graph).filter((file) => file.filePath !== "")
  }

  importMetadataFileWithGraph({
    filePath: params.filePath,
    sources: { yaml: params.text },
    kind: parsed.kind,
    name: parsed.name,
    graph,
    context,
  })
  return walkGraphToFileData(graph).filter((file) => file.filePath !== "")
}
```

- [ ] **Step 5: Export the API**

In `packages/core/metadata/orchestration/buildGraph/index.ts`, add:

```ts
export { buildGraphForChangedFile, type BuildGraphForChangedFileParams } from "./buildGraphForChangedFile"
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS after updating existing `buildGraph.test.ts` assertions that expected `props.filePath`.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/buildGraph.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts packages/core/metadata/orchestration/buildGraph/index.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "feat: :sparkles: строить граф для одного файла"
```

## Task 6: Parse NKDK And Split Form Ownership

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`

- [ ] **Step 1: Add failing form ownership tests**

Add to `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`:

```ts
it("для Форма.nkdk объявляет визуальные элементы и contributes в корень формы", () => {
  const result = buildGraphForChangedFile({
    projectPath: "/project",
    filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    text: [
      "Элементы:",
      "  ПолеВвода1:",
      "    Ширина: 10",
      "",
    ].join("\n"),
    pairedText: {
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk",
      text: "ПолеВвода1(Реквизит): \n",
    },
    context: ctx,
  })

  const nkdk = result.find((file) => file.filePath.endsWith("Форма.nkdk"))
  expect(nkdk?.contributedNodeIds).toContain("Справочник.Товары.Форма.ФормаСписка")
  expect(nkdk?.declaredNodeIds?.some((id) => id.includes(".Элемент."))).toBe(true)
})
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
```

Expected: FAIL because `sources.nkdk` is ignored.

- [ ] **Step 3: Extract reusable NKDK parser**

Create `packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts`:

```ts
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFromFromNKDK } from "./fromNKDK"
import type { ClientApplicationForm } from "./types"

let parseHelperCached: ReturnType<typeof parseHelper<NkdkForm>> | null = null

function getNkdkParse(): ReturnType<typeof parseHelper<NkdkForm>> {
  if (!parseHelperCached) {
    const services = createNkdkServices(EmptyFileSystem)
    parseHelperCached = parseHelper<NkdkForm>(services.Nkdk)
  }
  return parseHelperCached
}

export async function parseClientApplicationFormFromNKDK(
  context: ConfigurationContext,
  nkdkText: string,
): Promise<ClientApplicationForm | undefined> {
  const parsed = await getNkdkParse()(nkdkText)
  if (!parsed || parsed.parseResult.parserErrors.length > 0) return undefined
  return importClientApplicationFromFromNKDK({
    context,
    value: parsed.parseResult.value,
  })
}
```

- [ ] **Step 4: Make form graph import async**

Change `importMetadataFileWithGraph` return type to `Promise<ImportMetadataFileResult | undefined>` and update call sites in `buildGraph.ts` and `buildGraphForChangedFile.ts` to `await`.

Use this pattern in `buildGraph.ts`:

```ts
await importMetadataFileWithGraph({
  filePath,
  sources: { yaml: yamlText },
  kind: parsed.kind,
  name: parsed.name,
  graph,
  context: importContext,
})
```

Change `buildGraph` and `buildGraphForChangedFile` to async:

```ts
export async function buildGraph(
  yamlFiles: Map<string, string>,
  context: ImportContext,
): Promise<FileGraphData[]> {
  ...
}
```

Update CLI callers in later tasks; until then run only core tests that compile this path.

- [ ] **Step 5: Apply YAML/NKDK ownership in form import**

In `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`, import:

```ts
import { parseClientApplicationFormFromNKDK } from "~/metadata/forms/clientApplicationForm/parseNKDK"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
```

In the `kind === "form"` branch:

```ts
const parsed = parseMetadataYaml(sources.yaml)
const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined
const importContext: ConfigurationContext = { ...context, graph }

const nkdkModel = sources.nkdk
  ? await parseClientApplicationFormFromNKDK(importContext, sources.nkdk)
  : { itemType: "ClientApplicationForm", childItems: [], commands: [] }

const model = importClientApplicationFormFromYAML(
  importContext,
  parsed.data as never,
  nkdkModel as never,
)

graph.setItem(formNodeId, { ...model, childItems: [], autoCommandBar: undefined })
graph.addFilePath(formNodeId, filePath)
if (nkdkFilePath) graph.addContributedFilePath(formNodeId, nkdkFilePath)

buildGraphFromModel({
  model: model as Record<string, unknown>,
  yamlMap,
  rule: ClientApplicationFormRules as never,
  graph,
  parentNodeId: formNodeId,
  filePath,
})

if (nkdkFilePath) {
  for (const nodeId of graph.nodes()) {
    if (nodeId.startsWith(`${formNodeId}.Элемент.`)) {
      graph.removeFilePath(nodeId, filePath)
      graph.addFilePath(nodeId, nkdkFilePath)
    }
  }
}
```

This preserves YAML ownership for root/form metadata and moves visual element ownership to `Форма.nkdk`.

- [ ] **Step 6: Run form graph tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts
```

Expected: PASS after updating old tests that expected the form root to store two file paths.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm/parseNKDK.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.ts packages/core/metadata/orchestration/buildGraph/buildGraph.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
git commit -m "feat: :sparkles: разделить владельцев формы и nkdk"
```

## Task 7: Add CLI File Scanning And File Update

**Files:**
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Create: `packages/cli/src/graph/projectFiles.ts`
- Create: `packages/cli/src/graph/fileStats.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/graph/projectFiles.test.ts`
- Test: `packages/cli/src/graph/fileStats.test.ts`

- [ ] **Step 1: Write path and stats tests**

Create `packages/cli/src/graph/projectFiles.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { normalizeProjectFile, pairedFormPath } from "./projectFiles"

describe("projectFiles", () => {
  it("нормализует абсолютный путь к относительному project filePath", () => {
    expect(
      normalizeProjectFile(
        "/repo/project",
        "/repo/project/Справочник/Товары/Свойства.yaml",
      ),
    ).toBe("Справочник/Товары/Свойства.yaml")
  })

  it("находит пару Форма.yaml для Форма.nkdk", () => {
    expect(
      pairedFormPath("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk"),
    ).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
  })
})
```

Create `packages/cli/src/graph/fileStats.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { hasFileChanged } from "./fileStats"

describe("fileStats", () => {
  it("считает файл изменённым при отличии mtimeMs или size", () => {
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 2 })).toBe(false)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 9, size: 2 })).toBe(true)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 9 })).toBe(true)
  })
})
```

- [ ] **Step 2: Run failing CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectFiles.test.ts fileStats.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement project file helpers**

Create `packages/cli/src/graph/projectFiles.ts`:

```ts
import { existsSync, readdirSync } from "fs"
import { join, relative, sep } from "path"

const OWNER_DIRS = ["Справочник", "Документ", "Перечисление"] as const

export function normalizeProjectFile(projectPath: string, path: string): string {
  return relative(projectPath, path).split(sep).join("/")
}

export function absoluteProjectFile(projectPath: string, filePath: string): string {
  return join(projectPath, ...filePath.split("/"))
}

export function pairedFormPath(filePath: string): string | undefined {
  if (filePath.endsWith("/Форма.nkdk")) {
    return filePath.slice(0, -"Форма.nkdk".length) + "Форма.yaml"
  }
  if (filePath.endsWith("/Форма.yaml")) {
    return filePath.slice(0, -"Форма.yaml".length) + "Форма.nkdk"
  }
  return undefined
}

export function isSupportedProjectFile(filePath: string): boolean {
  return (
    OWNER_DIRS.some((dir) => filePath.startsWith(`${dir}/`)) &&
    (filePath.endsWith("/Свойства.yaml") ||
      filePath.endsWith("/Форма.yaml") ||
      filePath.endsWith("/Форма.nkdk"))
  )
}

export function readProjectFileList(projectPath: string): string[] {
  const result: string[] = []
  for (const ownerDir of OWNER_DIRS) {
    const ownerRoot = join(projectPath, ownerDir)
    if (!existsSync(ownerRoot)) continue
    for (const entry of readdirSync(ownerRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const objectRoot = join(ownerRoot, entry.name)
      const props = join(objectRoot, "Свойства.yaml")
      if (existsSync(props)) result.push(normalizeProjectFile(projectPath, props))

      const formsRoot = join(objectRoot, "Формы")
      if (!existsSync(formsRoot)) continue
      for (const formEntry of readdirSync(formsRoot, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue
        const formRoot = join(formsRoot, formEntry.name)
        for (const fileName of ["Форма.yaml", "Форма.nkdk"] as const) {
          const fullPath = join(formRoot, fileName)
          if (existsSync(fullPath)) result.push(normalizeProjectFile(projectPath, fullPath))
        }
      }
    }
  }
  return result.sort()
}
```

- [ ] **Step 4: Implement stats helpers**

Create `packages/cli/src/graph/fileStats.ts`:

```ts
import { statSync } from "fs"
import type { FileStats, GraphFileRecord } from "@nakidka/graph"

export function readFileStats(fullPath: string): FileStats {
  const stat = statSync(fullPath)
  return {
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    updatedAt: Date.now(),
  }
}

export function hasFileChanged(
  record: GraphFileRecord | undefined,
  stats: Pick<FileStats, "mtimeMs" | "size">,
): boolean {
  if (!record) return true
  return record.mtimeMs !== stats.mtimeMs || record.size !== stats.size
}
```

- [ ] **Step 5: Add file update command logic**

In `packages/cli/src/commands/updateGraph.ts`, keep full update but add:

```ts
import { buildGraph, buildGraphForChangedFile } from "@nakidka/core"
import { readFileSync, existsSync } from "fs"
import { absoluteProjectFile, pairedFormPath } from "../graph/projectFiles"
import { readFileStats } from "../graph/fileStats"
```

Add function:

```ts
export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  if (!existsSync(fullPath)) {
    await writeGraph([{ filePath, nodes: [], edges: [] }])
    return
  }

  const paired = pairedFormPath(filePath)
  const pairedFullPath = paired ? absoluteProjectFile(projectPath, paired) : undefined
  const pairedText = paired && pairedFullPath && existsSync(pairedFullPath)
    ? { filePath: paired, text: readFileSync(pairedFullPath, "utf-8") }
    : undefined

  const graphFiles = await buildGraphForChangedFile({
    projectPath,
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    pairedText,
    context: CONTEXT,
  })
  const stats = readFileStats(fullPath)
  await writeGraph(graphFiles.map((file) => ({ ...file, fileStats: stats })))
}
```

Change full update call:

```ts
const graphFiles = await buildGraph(yamlFiles, CONTEXT)
```

- [ ] **Step 6: Wire `update-graph --file`**

In `packages/cli/src/cli.ts`, change command registration:

```ts
program
  .command("update-graph")
  .description("Обновить граф метаданных в FalkorDB по YAML-проекту")
  .argument("<path>", "путь к корню YAML-проекта")
  .option("--file <filePath>", "обновить только один файл проекта")
  .action((projectPath: string, opts: { file?: string }) => {
    run(() => opts.file ? updateGraphFile(projectPath, opts.file) : updateGraph(projectPath))
  })
```

- [ ] **Step 7: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectFiles.test.ts fileStats.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/commands/updateGraph.ts packages/cli/src/cli.ts packages/cli/src/graph/projectFiles.ts packages/cli/src/graph/fileStats.ts packages/cli/src/graph/projectFiles.test.ts packages/cli/src/graph/fileStats.test.ts
git commit -m "feat: :sparkles: обновлять граф по одному файлу"
```

## Task 8: Add `nkdk watch`

**Files:**
- Modify: `packages/cli/package.json`
- Create: `packages/cli/src/graph/watchQueue.ts`
- Create: `packages/cli/src/commands/watch.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/graph/watchQueue.test.ts`

- [ ] **Step 1: Add explicit chokidar dependency**

Run:

```bash
pnpm --filter @nakidka/cli add chokidar@3.6.0
```

Expected: `packages/cli/package.json` contains `"chokidar": "3.6.0"` or compatible `^3.6.0`, and `pnpm-lock.yaml` remains consistent.

- [ ] **Step 2: Write failing queue tests**

Create `packages/cli/src/graph/watchQueue.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"
import { createWatchQueue } from "./watchQueue"

describe("createWatchQueue", () => {
  it("схлопывает повторы и выполняет задачи последовательно", async () => {
    vi.useFakeTimers()
    const calls: string[] = []
    const queue = createWatchQueue({
      debounceMs: 50,
      runTask: async (filePath) => {
        calls.push(filePath)
      },
    })

    queue.enqueue("a.yaml")
    queue.enqueue("a.yaml")
    queue.enqueue("b.yaml")

    await vi.advanceTimersByTimeAsync(60)
    await vi.runAllTimersAsync()

    expect(calls).toEqual(["a.yaml", "b.yaml"])
    vi.useRealTimers()
  })
})
```

- [ ] **Step 3: Run failing queue test**

Run:

```bash
pnpm --filter @nakidka/cli test -- watchQueue.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 4: Implement watch queue**

Create `packages/cli/src/graph/watchQueue.ts`:

```ts
export interface WatchQueueOptions {
  debounceMs: number
  runTask: (filePath: string) => Promise<void>
}

export interface WatchQueue {
  enqueue: (filePath: string) => void
  drain: () => Promise<void>
}

export function createWatchQueue(options: WatchQueueOptions): WatchQueue {
  const pending = new Set<string>()
  let timer: NodeJS.Timeout | undefined
  let running = Promise.resolve()

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const batch = [...pending]
      pending.clear()
      running = running.then(async () => {
        for (const filePath of batch) {
          await options.runTask(filePath)
        }
      })
    }, options.debounceMs)
  }

  return {
    enqueue(filePath: string): void {
      pending.add(filePath)
      schedule()
    },
    async drain(): Promise<void> {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      const batch = [...pending]
      pending.clear()
      running = running.then(async () => {
        for (const filePath of batch) {
          await options.runTask(filePath)
        }
      })
      await running
    },
  }
}
```

- [ ] **Step 5: Implement watch command**

Create `packages/cli/src/commands/watch.ts`:

```ts
import { getGraphFiles } from "@nakidka/graph"
import chokidar from "chokidar"
import { existsSync } from "fs"
import { absoluteProjectFile, isSupportedProjectFile, normalizeProjectFile, pairedFormPath, readProjectFileList } from "../graph/projectFiles"
import { hasFileChanged, readFileStats } from "../graph/fileStats"
import { createWatchQueue } from "../graph/watchQueue"
import { updateGraphFile } from "./updateGraph"

export async function watch(projectPath: string): Promise<void> {
  const graphFiles = await getGraphFiles()
  const graphFileByPath = new Map(graphFiles.map((file) => [file.path, file]))
  const diskFiles = readProjectFileList(projectPath)
  const diskFileSet = new Set(diskFiles)

  for (const filePath of diskFiles) {
    const fullPath = absoluteProjectFile(projectPath, filePath)
    const stats = readFileStats(fullPath)
    if (hasFileChanged(graphFileByPath.get(filePath), stats)) {
      await updateGraphFile(projectPath, filePath)
    }
  }

  for (const file of graphFiles) {
    if (!diskFileSet.has(file.path)) {
      await updateGraphFile(projectPath, file.path)
      const paired = pairedFormPath(file.path)
      if (file.path.endsWith("/Форма.yaml") && paired) {
        await updateGraphFile(projectPath, paired)
      }
    }
  }

  const queue = createWatchQueue({
    debounceMs: 150,
    runTask: async (filePath) => {
      await updateGraphFile(projectPath, filePath)
      const paired = pairedFormPath(filePath)
      if (filePath.endsWith("/Форма.yaml") && paired) {
        await updateGraphFile(projectPath, paired)
      }
    },
  })

  const watcher = chokidar.watch([
    `${projectPath}/**/Свойства.yaml`,
    `${projectPath}/**/Форма.yaml`,
    `${projectPath}/**/Форма.nkdk`,
  ], { ignoreInitial: true })

  watcher.on("add", (path) => {
    const filePath = normalizeProjectFile(projectPath, path)
    if (isSupportedProjectFile(filePath)) queue.enqueue(filePath)
  })
  watcher.on("change", (path) => {
    const filePath = normalizeProjectFile(projectPath, path)
    if (isSupportedProjectFile(filePath)) queue.enqueue(filePath)
  })
  watcher.on("unlink", (path) => {
    const filePath = normalizeProjectFile(projectPath, path)
    if (!isSupportedProjectFile(filePath)) return
    queue.enqueue(filePath)
    const paired = pairedFormPath(filePath)
    if (filePath.endsWith("/Форма.yaml") && paired) queue.enqueue(paired)
  })

  process.once("SIGINT", () => {
    void queue.drain().finally(() => {
      void watcher.close().then(() => process.exit(0))
    })
  })
}
```

- [ ] **Step 6: Wire `nkdk watch`**

In `packages/cli/src/cli.ts`, import:

```ts
import { watch } from "./commands/watch"
```

Add command:

```ts
program
  .command("watch")
  .description("Следить за YAML/NKDK-проектом и инкрементально обновлять граф")
  .argument("<path>", "путь к корню YAML-проекта")
  .action((projectPath: string) => {
    run(() => watch(projectPath))
  })
```

- [ ] **Step 7: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- watchQueue.test.ts projectFiles.test.ts fileStats.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/cli/package.json pnpm-lock.yaml packages/cli/src/commands/watch.ts packages/cli/src/cli.ts packages/cli/src/graph/watchQueue.ts packages/cli/src/graph/watchQueue.test.ts
git commit -m "feat: :sparkles: добавить nkdk watch"
```

## Task 9: Full Verification And Documentation Sync

**Files:**
- Modify: `.agents/architecture-orchestration.md`

- [ ] **Step 1: Run focused package tests**

Run:

```bash
pnpm --filter @nakidka/graph test
pnpm --filter @nakidka/core test -- metadata/orchestration/buildGraph
pnpm --filter @nakidka/cli test
```

Expected: all selected tests PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Update architecture document**

Add this section to `.agents/architecture-orchestration.md` under "Граф связей метаданных":

```md
### Владение графовыми узлами файлами

Графовые узлы не хранят `filePath` в props. Владение задаётся в `FileGraphData.declaredNodeIds` и в FalkorDB хранится как `(:File)-[:DECLARES]->(node)`. Влияющий файл, который не владеет жизненным циклом узла, задаётся через `contributedNodeIds` и хранится как `(:File)-[:CONTRIBUTES]->(node)`.

Для форм `Форма.yaml` является обязательным владельцем корня `ClientApplicationForm` и YAML-частей формы. `Форма.nkdk` владеет визуальными элементами формы и contributes в корневой узел формы.
```

- [ ] **Step 5: Commit verification docs**

```bash
git add .agents/architecture-orchestration.md
git commit -m "docs: :memo: уточнить архитектуру владения графом"
```

## Self-Review

Spec coverage:
- `File` nodes, `DECLARES`, `CONTRIBUTES`: Tasks 1-3.
- Node ownership and removal semantics: Tasks 2, 4, 6.
- `buildGraphForChangedFile`: Task 5.
- `Форма.yaml` mandatory owner and `Форма.nkdk` visual owner: Task 6.
- `update-graph --file`: Task 7.
- `nkdk watch`, startup comparison, debounce, serialized writes: Task 8.
- Tests and full `pnpm test`: Task 9.

Placeholder scan:
- Red-flag placeholder scan passed.
- Each code-changing task includes concrete code snippets and exact commands.

Type consistency:
- `FileStats`, `GraphFileRecord`, `declaredNodeIds`, `contributedNodeIds` are introduced before use.
- `getGraphFiles` returns `GraphFileRecord[]`, which CLI `watch` consumes.
- Core and graph `FileGraphData` fields match.
