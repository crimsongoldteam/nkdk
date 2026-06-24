# Graph Full Update Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить полный `nkdk update-graph` на больших проектах, убрать широкий `MATCH (n {id})` при записи рёбер и добавить видимый прогресс записи.

**Architecture:** Full update снова строит один общий core-граф из source records, включая paired `Форма.nkdk`, чтобы сохранить stub/reference labels. `@nakidka/graph` добавляет общий label `GraphNode` и индекс `GraphNode(id)` для безопасного fallback-поиска. CLI читает project sources через один helper и отображает progress callback из graph package.

**Tech Stack:** TypeScript, Vitest, Commander, FalkorDB Cypher, existing `@nakidka/core`, `@nakidka/graph`, `@nakidka/cli`.

---

## File Structure

- Modify `packages/core/metadata/orchestration/buildGraph/types.ts`: add source-record types shared by full and single-file graph builds.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`: accept source records, keep Map compatibility, pass paired NKDK to form imports, preserve full-graph stub labels.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`: construct a source record and reuse the same source-shape as full build.
- Modify `packages/core/metadata/orchestration/buildGraph/index.ts`: export new source-record types.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`: cover full build with paired `Форма.nkdk`.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`: confirm single-file API still works.
- Create `packages/cli/src/graph/projectSources.ts`: read project files into core source records and normalize changed-file input.
- Create `packages/cli/src/graph/projectSources.test.ts`: cover paired sources, absolute `--file`, deletion cases.
- Modify `packages/cli/src/commands/updateGraph.ts`: use `projectSources.ts`, remove full-update loop over `buildGraphForChangedFile`, add progress printing.
- Modify `packages/graph/src/types.ts`: add `GraphProgress`, `GraphUpdateOptions`.
- Modify `packages/graph/src/index.ts`: export progress/update option types.
- Modify `packages/graph/src/updateGraph.ts`: accept `GraphUpdateOptions`, report phases.
- Modify `packages/graph/src/internal/operations.ts`: add `GraphNode` index/label, fallback lookup labels, batch progress support.
- Modify `packages/graph/tests/updateGraph.test.ts`: cover `GraphNode` label/index/fallback/progress.
- Modify `packages/graph/tests/operations.test.ts`: cover low-level fallback query shape where useful.

## Task 1: Core Source Records For Full Build

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/types.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/index.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts`

- [ ] **Step 1: Add failing full-build paired NKDK test**

Add this test to `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts` inside `describe("buildGraph (формы)", ...)`:

```ts
it("полная сборка учитывает paired Форма.nkdk и сохраняет stub labels", async () => {
  const catalogYaml = "ДлинаКода: 9\n"
  const formYaml = [
    "Элементы:",
    "  ПолеВвода1:",
    "    Ширина: 10",
    "",
  ].join("\n")

  const result = await buildGraph([
    {
      filePath: "Справочник/Товары/Свойства.yaml",
      text: catalogYaml,
    },
    {
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      text: formYaml,
      pairedText: {
        filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk",
        text: "ПолеВвода1(Реквизит): \n",
      },
    },
  ], ctx)

  const yaml = result.find((file) => file.filePath.endsWith("Форма.yaml"))!
  const nkdk = result.find((file) => file.filePath.endsWith("Форма.nkdk"))!
  const stub = result.find((file) => file.filePath === "")

  expect(yaml.declaredNodeIds).toContain("Справочник.Товары.Форма.ФормаСписка")
  expect(nkdk.contributedNodeIds).toContain("Справочник.Товары.Форма.ФормаСписка")
  expect(nkdk.declaredNodeIds?.some((id) => id.includes(".Элемент."))).toBe(true)
  expect(stub?.nodes.every((node) => typeof node.label === "string" && node.label.length > 0)).toBe(true)
})
```

- [ ] **Step 2: Run the failing core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
```

Expected: FAIL because `buildGraph` currently accepts `Map<string, string>` only and does not pass paired NKDK.

- [ ] **Step 3: Add source-record types**

In `packages/core/metadata/orchestration/buildGraph/types.ts`, add below `FileStats`:

```ts
export interface PairedGraphSourceText {
  filePath: string
  text: string
  fileStats?: FileStats
}

export interface ProjectGraphSource {
  filePath: string
  text: string
  fileStats?: FileStats
  pairedText?: PairedGraphSourceText
}

export type ProjectGraphInput = Map<string, string> | readonly ProjectGraphSource[]
```

- [ ] **Step 4: Update `buildGraph` to normalize source records**

In `packages/core/metadata/orchestration/buildGraph/buildGraph.ts`, change imports:

```ts
import type { FileGraphData, ImportContext, ProjectGraphInput, ProjectGraphSource } from "./types"
```

Add helper above `buildGraph`:

```ts
const normalizeGraphSources = (input: ProjectGraphInput): ProjectGraphSource[] => {
  if (input instanceof Map) {
    return Array.from(input.entries()).map(([filePath, text]) => ({ filePath, text }))
  }
  return [...input]
}

const applySourceStats = (
  files: FileGraphData[],
  sources: readonly ProjectGraphSource[],
): FileGraphData[] => {
  const statsByPath = new Map<string, ProjectGraphSource["fileStats"]>()
  for (const source of sources) {
    statsByPath.set(source.filePath, source.fileStats)
    if (source.pairedText) statsByPath.set(source.pairedText.filePath, source.pairedText.fileStats)
  }
  return files.map((file) => {
    const fileStats = statsByPath.get(file.filePath)
    return fileStats ? { ...file, fileStats } : file
  })
}
```

Change signature:

```ts
export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  const sources = normalizeGraphSources(projectFiles)
```

Replace loops over `yamlFiles` with `sources`:

```ts
const formEntries: Array<{
  filePath: string
  yaml: string
  ownerNodeId: string
  name: string
  pairedText?: ProjectGraphSource["pairedText"]
}> = []

for (const source of sources) {
  const parsed = parseFilePath(source.filePath)
  if (!parsed) continue

  if (parsed.kind === "form") {
    formEntries.push({
      filePath: source.filePath,
      yaml: source.text,
      ownerNodeId: parsed.ownerNodeId,
      name: parsed.formName,
      pairedText: source.pairedText,
    })
    continue
  }

  try {
    await importMetadataFileWithGraph({
      filePath: source.filePath,
      sources: { yaml: source.text },
      kind: parsed.kind,
      name: parsed.name,
      graph,
      context: importContext,
    })
  } catch {
    // Молчаливо пропускаем — контракт buildGraph: собрать что понятно.
  }
}

for (const { filePath, yaml, ownerNodeId, name, pairedText } of formEntries) {
  try {
    await importMetadataFileWithGraph({
      filePath,
      sources: { yaml, nkdk: pairedText?.text },
      kind: "form",
      name,
      graph,
      context: importContext,
      ownerNodeId,
      nkdkFilePath: pairedText?.filePath,
    })
  } catch {
    // Молчаливо пропускаем.
  }
}

return applySourceStats(walkGraphToFileData(graph), sources)
```

- [ ] **Step 5: Update `buildGraphForChangedFile` to use source shape**

In `packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts`, import `ProjectGraphSource`:

```ts
import type { FileGraphData, ImportContext, ProjectGraphSource } from "./types"
```

At the start of `buildGraphForChangedFile`, construct:

```ts
const source: ProjectGraphSource = {
  filePath,
  text,
  pairedText,
}
```

Use `source.text` and `source.pairedText` in existing calls:

```ts
sources: { yaml: source.text, nkdk: source.pairedText?.text },
nkdkFilePath: source.pairedText?.filePath,
```

This keeps single-file behavior unchanged while sharing the same source-record vocabulary as full build.

- [ ] **Step 6: Export new source types**

In `packages/core/metadata/orchestration/buildGraph/index.ts`, extend type exports:

```ts
export type {
  EdgeData,
  FileGraphData,
  GraphPrimitive,
  ImportContext,
  NodeData,
  PairedGraphSourceText,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./types"
```

- [ ] **Step 7: Run core buildGraph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/types.ts packages/core/metadata/orchestration/buildGraph/buildGraph.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.ts packages/core/metadata/orchestration/buildGraph/index.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts packages/core/metadata/orchestration/buildGraph/buildGraphForChangedFile.test.ts
git commit -m "feat: :sparkles: собирать полный граф из source records"
```

## Task 2: CLI Project Sources Without Duplication

**Files:**
- Create: `packages/cli/src/graph/projectSources.ts`
- Create: `packages/cli/src/graph/projectSources.test.ts`
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Test: `packages/cli/src/graph/projectSources.test.ts`

- [ ] **Step 1: Write failing CLI source tests**

Create `packages/cli/src/graph/projectSources.test.ts`:

```ts
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readChangedProjectSource, readProjectGraphSources } from "./projectSources"

describe("projectSources", () => {
  it("читает Форма.yaml вместе с paired Форма.nkdk", () => {
    const root = join(process.cwd(), "tmp-project-sources-a")
    mkdirSync(join(root, "Справочник", "Товары", "Формы", "ФормаСписка"), { recursive: true })
    writeFileSync(join(root, "Справочник", "Товары", "Свойства.yaml"), "ДлинаКода: 9\n")
    writeFileSync(join(root, "Справочник", "Товары", "Формы", "ФормаСписка", "Форма.yaml"), "Элементы: {}\n")
    writeFileSync(join(root, "Справочник", "Товары", "Формы", "ФормаСписка", "Форма.nkdk"), "ПолеВвода1(Реквизит): \n")

    const sources = readProjectGraphSources(root)
    const form = sources.find((source) => source.filePath.endsWith("Форма.yaml"))!

    expect(form.pairedText?.filePath).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk")
    expect(form.pairedText?.text).toContain("ПолеВвода1")
    expect(form.fileStats?.size).toBeGreaterThan(0)
    expect(form.pairedText?.fileStats?.size).toBeGreaterThan(0)
  })

  it("нормализует absolute --file и для Форма.nkdk возвращает primary Форма.yaml", () => {
    const root = join(process.cwd(), "tmp-project-sources-b")
    const formDir = join(root, "Справочник", "Товары", "Формы", "ФормаСписка")
    mkdirSync(formDir, { recursive: true })
    writeFileSync(join(formDir, "Форма.yaml"), "Элементы: {}\n")
    writeFileSync(join(formDir, "Форма.nkdk"), "ПолеВвода1(Реквизит): \n")

    const result = readChangedProjectSource(root, join(formDir, "Форма.nkdk"))

    expect(result.deleted).toBe(false)
    expect(result.source?.filePath).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    expect(result.source?.pairedText?.filePath).toBe("Справочник/Товары/Формы/ФормаСписка/Форма.nkdk")
  })

  it("для удалённой Форма.yaml возвращает оба filePath для очистки", () => {
    const root = join(process.cwd(), "tmp-project-sources-c")
    const result = readChangedProjectSource(
      root,
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    )

    expect(result.deleted).toBe(true)
    expect(result.deletedFilePaths).toEqual([
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.nkdk",
    ])
  })
})
```

- [ ] **Step 2: Run failing CLI source tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts
```

Expected: FAIL because `projectSources.ts` does not exist.

- [ ] **Step 3: Implement `projectSources.ts`**

Create `packages/cli/src/graph/projectSources.ts`:

```ts
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import type { ProjectGraphSource } from "@nakidka/core"
import { readFileStats } from "./fileStats"
import {
  absoluteProjectFile,
  normalizeProjectFile,
  pairedFormPath,
  readProjectFileList,
} from "./projectFiles"

export interface ChangedProjectSource {
  deleted: boolean
  source?: ProjectGraphSource
  deletedFilePaths: string[]
}

const normalizeInputFilePath = (projectPath: string, filePath: string): string => {
  const absoluteProjectPath = resolve(projectPath)
  const absoluteFilePath = resolve(filePath)
  return absoluteFilePath.startsWith(absoluteProjectPath)
    ? normalizeProjectFile(absoluteProjectPath, absoluteFilePath)
    : filePath
}

const readSource = (projectPath: string, filePath: string): ProjectGraphSource | undefined => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  if (!existsSync(fullPath)) return undefined

  const paired = pairedFormPath(filePath)
  const pairedFullPath = paired ? absoluteProjectFile(projectPath, paired) : undefined
  const pairedText =
    paired && pairedFullPath && existsSync(pairedFullPath)
      ? {
          filePath: paired,
          text: readFileSync(pairedFullPath, "utf-8"),
          fileStats: readFileStats(pairedFullPath),
        }
      : undefined

  return {
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    fileStats: readFileStats(fullPath),
    pairedText,
  }
}

export const readProjectGraphSources = (projectPath: string): ProjectGraphSource[] => {
  const sources: ProjectGraphSource[] = []
  for (const filePath of readProjectFileList(projectPath)) {
    if (!filePath.endsWith(".yaml")) continue
    const source = readSource(projectPath, filePath)
    if (source) sources.push(source)
  }
  return sources
}

export const readChangedProjectSource = (
  projectPath: string,
  filePath: string,
): ChangedProjectSource => {
  const normalizedFilePath = normalizeInputFilePath(projectPath, filePath)
  const primaryFilePath = normalizedFilePath.endsWith("/Форма.nkdk")
    ? pairedFormPath(normalizedFilePath)
    : normalizedFilePath

  if (!primaryFilePath) {
    return { deleted: true, deletedFilePaths: [normalizedFilePath] }
  }

  const source = readSource(projectPath, primaryFilePath)
  const paired = pairedFormPath(primaryFilePath)
  if (!source) {
    return {
      deleted: true,
      deletedFilePaths: [
        primaryFilePath,
        ...(paired ? [paired] : []),
      ],
    }
  }

  return {
    deleted: false,
    source,
    deletedFilePaths:
      paired && !existsSync(absoluteProjectFile(projectPath, paired)) ? [paired] : [],
  }
}
```

- [ ] **Step 4: Update CLI full and single update to use project sources**

In `packages/cli/src/commands/updateGraph.ts`, replace imports:

```ts
import { buildGraph, buildGraphForChangedFile } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync } from "fs"
import { performance } from "perf_hooks"
import { readProjectFileList } from "../graph/projectFiles"
import { readChangedProjectSource, readProjectGraphSources } from "../graph/projectSources"
```

Replace `updateGraphFile` body with:

```ts
export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  const changed = readChangedProjectSource(projectPath, filePath)
  if (changed.deleted) {
    await writeGraph(changed.deletedFilePaths.map((path) => ({ filePath: path, nodes: [], edges: [] })))
    return
  }

  const graphFiles = await buildGraphForChangedFile({
    projectPath,
    filePath: changed.source!.filePath,
    text: changed.source!.text,
    pairedText: changed.source!.pairedText,
    context: CONTEXT,
  })

  const filesWithStats = graphFiles.map((file) => {
    if (file.filePath === changed.source!.filePath && changed.source!.fileStats) {
      return { ...file, fileStats: changed.source!.fileStats }
    }
    if (changed.source!.pairedText && file.filePath === changed.source!.pairedText.filePath) {
      return { ...file, fileStats: changed.source!.pairedText.fileStats }
    }
    return file
  })

  await writeGraph([
    ...filesWithStats,
    ...changed.deletedFilePaths.map((path) => ({ filePath: path, nodes: [], edges: [] })),
  ])
}
```

Replace `buildProjectGraph` with:

```ts
const buildProjectGraph = async (projectPath: string) => {
  return await buildGraph(readProjectGraphSources(projectPath), CONTEXT)
}
```

Keep the existing `projectFiles = readProjectFileList(projectPath)` in `updateGraph` for the read counter.

- [ ] **Step 5: Run CLI tests and build**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts projectFiles.test.ts fileStats.test.ts
pnpm --filter @nakidka/cli build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/graph/projectSources.ts packages/cli/src/graph/projectSources.test.ts packages/cli/src/commands/updateGraph.ts
git commit -m "feat: :sparkles: читать sources проекта для графа"
```

## Task 3: Add `GraphNode` Label And Indexed Fallback

**Files:**
- Modify: `packages/graph/src/types.ts`
- Modify: `packages/graph/src/index.ts`
- Modify: `packages/graph/src/internal/operations.ts`
- Test: `packages/graph/tests/updateGraph.test.ts`
- Test: `packages/graph/tests/operations.test.ts`

- [ ] **Step 1: Add failing GraphNode tests**

Add to `packages/graph/tests/updateGraph.test.ts`:

```ts
it("создаёт GraphNode index и пишет предметные узлы с общей меткой", async () => {
  await updateGraph([
    {
      filePath: "a.yaml",
      nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
      edges: [],
    },
  ])

  const cypher = queryMock.mock.calls.map((call) => call[0] as string)
  expect(cypher).toContainEqual(expect.stringContaining("CREATE INDEX FOR (n:GraphNode) ON (n.id)"))
  expect(cypher).toContainEqual(expect.stringContaining("MERGE (m:MetadataCatalog:GraphNode {id: n.id})"))
})

it("для неизвестной метки target использует GraphNode fallback", async () => {
  await updateGraph([
    {
      filePath: "a.yaml",
      nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
      edges: [{ src: "A", tgt: "External.Unknown", kind: "TYPE" }],
    },
  ])

  const cypher = queryMock.mock.calls.map((call) => call[0] as string)
  expect(cypher).toContainEqual(expect.stringContaining("MATCH (s:MetadataCatalog {id: e.src}), (t:GraphNode {id: e.tgt})"))
  expect(cypher).not.toContainEqual(expect.stringContaining("MATCH (s:MetadataCatalog {id: e.src}), (t {id: e.tgt})"))
})
```

- [ ] **Step 2: Run failing graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts operations.test.ts
```

Expected: FAIL because `GraphNode` index/label/fallback do not exist.

- [ ] **Step 3: Add graph progress and update option types**

In `packages/graph/src/types.ts`, add:

```ts
export type GraphUpdatePhase =
  | "ensureFileIndexes"
  | "ensureLabelIndexes"
  | "deleteByFiles"
  | "mergeFiles"
  | "mergeNodes"
  | "mergeEdges"
  | "mergeFileLinks"
  | "cleanupOrphanStubs"

export interface GraphProgress {
  phase: GraphUpdatePhase
  done?: number
  total?: number
}

export interface GraphUpdateOptions extends ConnectionOptions {
  onProgress?: (progress: GraphProgress) => void
}
```

In `packages/graph/src/index.ts`, export:

```ts
GraphProgress,
GraphUpdateOptions,
GraphUpdatePhase,
```

- [ ] **Step 4: Implement `GraphNode` index and merge labels**

In `packages/graph/src/internal/operations.ts`, add near constants:

```ts
const GRAPH_NODE_LABEL = "GraphNode"
```

Add helper:

```ts
const cypherLookupLabel = (label: string | undefined): string =>
  cypherLabel(label && label.length > 0 ? label : GRAPH_NODE_LABEL)
```

Change `ensureLabelIndexes`:

```ts
export const ensureLabelIndexes = async (
  conn: GraphConnection,
  labels: readonly string[],
): Promise<void> => {
  await ensureIndex(conn, GRAPH_NODE_LABEL, "id")
  const unique = new Set(labels)
  for (const label of unique) {
    await ensureIndex(conn, label, "id")
  }
}
```

Change `mergeNodes` query:

```ts
`UNWIND ${cypherNodeBatch(batch)} AS n MERGE (m:${label}:${GRAPH_NODE_LABEL} {id: n.id}) SET m += n.props`
```

Change `mergeEdges` query builder:

```ts
`UNWIND ${cypherEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props SET r.filePath = e.filePath`
```

Change `mergeLegacyEdges` the same way:

```ts
`UNWIND ${cypherLegacyEdgeBatch(batch)} AS e MATCH (s${cypherLookupLabel(srcLabel)} {id: e.src}), (t${cypherLookupLabel(tgtLabel)} {id: e.tgt}) MERGE (s)-[r:${kind}]->(t) SET r = e.props`
```

- [ ] **Step 5: Run graph tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts operations.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/types.ts packages/graph/src/index.ts packages/graph/src/internal/operations.ts packages/graph/tests/updateGraph.test.ts packages/graph/tests/operations.test.ts
git commit -m "feat: :sparkles: добавить GraphNode fallback"
```

## Task 4: Add Graph Write Progress

**Files:**
- Modify: `packages/graph/src/internal/operations.ts`
- Modify: `packages/graph/src/updateGraph.ts`
- Test: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Add failing progress test**

Add to `packages/graph/tests/updateGraph.test.ts`:

```ts
it("сообщает progress по фазам записи", async () => {
  const onProgress = vi.fn()
  await updateGraph([
    {
      filePath: "a.yaml",
      nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
      edges: [{ src: "A", tgt: "A", kind: "SELF" }],
    },
  ], { onProgress })

  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "mergeNodes" }))
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "mergeEdges" }))
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ phase: "cleanupOrphanStubs" }))
})
```

- [ ] **Step 2: Run failing progress test**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts
```

Expected: FAIL because `updateGraph` does not accept/report `onProgress`.

- [ ] **Step 3: Add batch progress support**

In `packages/graph/src/internal/operations.ts`, add type:

```ts
import type { EdgeData, FileGraphData, FileStats, GraphProgress, GraphUpdatePhase, NodeData } from "../types"
```

Change `sendBatches` signature:

```ts
const sendBatches = async <T>(
  conn: GraphConnection,
  items: readonly T[],
  buildCypher: (batch: readonly T[]) => string,
  progress?: {
    phase: GraphUpdatePhase
    onProgress?: (progress: GraphProgress) => void
  },
): Promise<void> => {
  const total = Math.ceil(items.length / BATCH_SIZE)
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    await query(conn, buildCypher(items.slice(i, i + BATCH_SIZE)))
    progress?.onProgress?.({ phase: progress.phase, done: Math.min(Math.floor(i / BATCH_SIZE) + 1, total), total })
  }
}
```

Change batch operation signatures:

```ts
export const mergeNodes = async (
  conn: GraphConnection,
  nodes: readonly NodeData[],
  onProgress?: (progress: GraphProgress) => void,
): Promise<void> => {
```

Inside `mergeNodes`, pass:

```ts
{ phase: "mergeNodes", onProgress }
```

Change `mergeEdges`, `mergeFiles`, and `mergeFileLinks` similarly with phases `"mergeEdges"`, `"mergeFiles"`, `"mergeFileLinks"`.

- [ ] **Step 4: Report phase boundaries in `updateGraph`**

In `packages/graph/src/updateGraph.ts`, change import:

```ts
import type { FileGraphData, GraphProgress, GraphUpdateOptions } from "./types"
```

Add helper:

```ts
const reportPhase = async (
  phase: GraphProgress["phase"],
  onProgress: GraphUpdateOptions["onProgress"],
  fn: () => Promise<void>,
): Promise<void> => {
  onProgress?.({ phase, done: 0, total: 1 })
  await fn()
  onProgress?.({ phase, done: 1, total: 1 })
}
```

Change signature:

```ts
export const updateGraph = async (
  files: readonly FileGraphData[],
  opts?: GraphUpdateOptions,
): Promise<void> => {
```

Use `onProgress`:

```ts
const onProgress = opts?.onProgress
```

Wrap non-batch phases:

```ts
await reportPhase("ensureFileIndexes", onProgress, () => ensureFileIndexes(conn))
await reportPhase("ensureLabelIndexes", onProgress, () => ensureLabelIndexes(conn, labels))
await reportPhase("deleteByFiles", onProgress, () => deleteByFiles(conn, filePaths))
await mergeFiles(conn, files, onProgress)
await mergeNodes(conn, allNodes, onProgress)
await mergeEdges(conn, files, labelByNodeId, onProgress)
await mergeFileLinks(conn, files, onProgress)
await reportPhase("cleanupOrphanStubs", onProgress, () => cleanupOrphanStubs(conn, true))
```

- [ ] **Step 5: Run graph progress tests**

Run:

```bash
pnpm --filter @nakidka/graph test -- updateGraph.test.ts operations.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/graph/src/internal/operations.ts packages/graph/src/updateGraph.ts packages/graph/tests/updateGraph.test.ts
git commit -m "feat: :sparkles: показывать прогресс записи графа"
```

## Task 5: CLI Progress Output And Full Update Wiring

**Files:**
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Test: `packages/cli/src/graph/projectSources.test.ts`

- [ ] **Step 1: Add source stats assertion**

In `packages/cli/src/graph/projectSources.test.ts`, extend the first test with:

```ts
expect(sources.every((source) => source.fileStats !== undefined)).toBe(true)
```

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts
```

Expected: PASS if Task 2 source helper already attaches stats.

- [ ] **Step 2: Add progress printer in CLI**

In `packages/cli/src/commands/updateGraph.ts`, add helper below `CONTEXT`:

```ts
const createProgressReporter = () => {
  const startedAtByPhase = new Map<string, number>()
  let lastLine = ""

  return (progress: { phase: string; done?: number; total?: number }): void => {
    if (progress.done === 0) {
      startedAtByPhase.set(progress.phase, performance.now())
      return
    }

    const total = progress.total ?? 1
    const done = progress.done ?? total
    const line = `${progress.phase.padEnd(18)} ${done}/${total}`
    if (line !== lastLine) {
      console.log(line)
      lastLine = line
    }

    if (done === total) {
      const startedAt = startedAtByPhase.get(progress.phase)
      if (startedAt !== undefined) {
        console.log(`${progress.phase.padEnd(18)} done — ${(performance.now() - startedAt).toFixed(1)} мс`)
      }
    }
  }
}
```

- [ ] **Step 3: Use progress reporter for full and single writes**

In `updateGraphFile`, change both `writeGraph` calls:

```ts
await writeGraph(payload, { onProgress: createProgressReporter() })
```

In `updateGraph`, change:

```ts
await writeGraph(graphFiles, { onProgress: createProgressReporter() })
```

Use a local `payload` variable in `updateGraphFile` so deletion and normal update both call `writeGraph` in one place where possible:

```ts
const payload = changed.deleted
  ? changed.deletedFilePaths.map((path) => ({ filePath: path, nodes: [], edges: [] }))
  : [
      ...filesWithStats,
      ...changed.deletedFilePaths.map((path) => ({ filePath: path, nodes: [], edges: [] })),
    ]
await writeGraph(payload, { onProgress: createProgressReporter() })
```

- [ ] **Step 4: Run CLI tests and build**

Run:

```bash
pnpm --filter @nakidka/cli test -- projectSources.test.ts projectFiles.test.ts fileStats.test.ts watchQueue.test.ts
pnpm --filter @nakidka/cli build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/updateGraph.ts packages/cli/src/graph/projectSources.test.ts
git commit -m "feat: :sparkles: печатать прогресс обновления графа"
```

## Task 6: Verification And ERP Performance Check

**Files:**
- No required source changes.
- Optional: update `docs/superpowers/specs/2026-05-04-graph-full-update-performance-design.md` only if measured results materially differ from the expected range.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/graph test
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 2: Run CLI build**

Run:

```bash
pnpm --filter @nakidka/cli build
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS. Existing skipped tests remain skipped.

- [ ] **Step 4: Run type-check and record known graph integration issue if it remains**

Run:

```bash
pnpm type-check
```

Expected: PASS if `testcontainers` is available. If it fails with `tests/integration/setup.ts(1,61): error TS2307: Cannot find module 'testcontainers'`, record it as the existing graph integration dependency issue and do not treat it as caused by this plan.

- [ ] **Step 5: Run ERP performance check**

Run:

```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts update-graph /Users/nikita/git/erp_nkdk
```

Expected:

- command completes;
- output includes progress lines for `mergeNodes` and `mergeEdges`;
- output includes final `buildGraph`, `updateGraph`, and `итого` timings;
- `mergeEdges` does not sit for more than 4 minutes without progress.

Record these values in the task handoff using the measured numbers from the command output:

```text
buildGraph: 29.1 сек
mergeNodes: 52.4 сек
mergeEdges: 71.8 сек
updateGraph: 138.6 сек
total: 168.0 сек
nodes: 385892
edges: 520428
```

- [ ] **Step 6: Commit measured-result docs only if needed**

If the measured full update is outside the `1.5-3 мин` expected range by more than 60 seconds, update `docs/superpowers/specs/2026-05-04-graph-full-update-performance-design.md` with a short "Measured result" subsection:

Use this exact format with the measured values from the run:

```md
## Замер после реализации

На `/Users/nikita/git/erp_nkdk` полный `nkdk update-graph` завершился за 168.0 сек. Основные фазы: `mergeNodes` — 52.4 сек, `mergeEdges` — 71.8 сек.
```

Then commit:

```bash
git add docs/superpowers/specs/2026-05-04-graph-full-update-performance-design.md
git commit -m "docs: :memo: зафиксировать замер обновления графа"
```

If the measurement is inside the expected range, do not create a docs commit.

## Self-Review

Spec coverage:

- Общая сборка проекта для full update: Tasks 1-2.
- Paired `Форма.nkdk` in full update: Tasks 1-2.
- Avoid full/single/watch duplication: Task 2 introduces `projectSources.ts`; Task 1 shares core source-record vocabulary.
- `GraphNode(id)` fallback: Task 3.
- Progress by graph write phases and batches: Tasks 4-5.
- Manual ERP performance verification: Task 6.
- Non-goals preserved: no NKDK grammar changes, no fixes for the 4 ERP warnings, no custom Cypher rule semantic changes.

Completeness scan:

- No incomplete marker text or vague error-handling steps remain.
- Every task has exact file paths, test commands, expected outcomes, and commit commands.

Type consistency:

- `ProjectGraphSource`, `PairedGraphSourceText`, and `ProjectGraphInput` are defined in Task 1 and used consistently in Tasks 1-2.
- `GraphProgress`, `GraphUpdatePhase`, and `GraphUpdateOptions` are defined before progress wiring in Tasks 3-4.
- `GraphNode` is a graph label only for metadata nodes; `File` nodes remain service nodes without `GraphNode`.
