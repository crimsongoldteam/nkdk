# GRAPH.BULK Replace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit `update-graph --replace --bulk` path that writes a full FalkorDB graph through direct binary `GRAPH.BULK` commands without intermediate CSV files.

**Architecture:** Keep the current Cypher `--replace` path as a fallback and add a separate bulk path under `packages/graph/src/bulk/`. The bulk path builds a deterministic in-memory plan from `FileGraphData`, encodes typed binary blobs, sends incremental `GRAPH.BULK` commands within Redis limits, and creates indexes after loading.

**Tech Stack:** TypeScript, Vitest, FalkorDB `GRAPH.BULK`, existing `falkordb` client, `@nakidka/graph`, `@nakidka/cli`.

---

## File Structure

- Create `packages/graph/src/bulk/encoder.ts`: binary value/header/record encoding for `GRAPH.BULK`.
- Create `packages/graph/src/bulk/plan.ts`: convert `FileGraphData[]` into deterministic node/edge groups with numeric IDs.
- Create `packages/graph/src/bulk/write.ts`: split blobs/commands by byte limits and send `GRAPH.BULK`.
- Create `packages/graph/src/bulk/replaceGraphBulk.ts`: orchestration for validation, graph reset/delete, bulk write, and index creation.
- Modify `packages/graph/src/internal/connection.ts`: expose a narrow `rawCommand` helper for binary Redis commands.
- Modify `packages/graph/src/types.ts`: add `bulk?: boolean`, bulk limits, and progress phases.
- Modify `packages/graph/src/updateGraph.ts`: route `replace && bulk` to `replaceGraphBulk`.
- Modify `packages/graph/src/index.ts`: export only public types already flowing through `types.ts`; do not export low-level bulk helpers.
- Create tests:
  - `packages/graph/tests/bulk/encoder.test.ts`
  - `packages/graph/tests/bulk/plan.test.ts`
  - `packages/graph/tests/bulk/write.test.ts`
- Modify existing tests:
  - `packages/graph/tests/updateGraph.test.ts`
  - `packages/graph/tests/integration/updateGraph.integration.test.ts`
  - `packages/cli/src/commands/updateGraph.test.ts`
  - `packages/cli/src/cli.test.ts` only if command parsing is covered there; otherwise do not create one.
- Modify CLI:
  - `packages/cli/src/cli.ts`
  - `packages/cli/src/commands/updateGraph.ts`

---

## Task 1: Bulk Encoder

**Files:**
- Create: `packages/graph/src/bulk/encoder.ts`
- Test: `packages/graph/tests/bulk/encoder.test.ts`

- [ ] **Step 1: Write failing tests for primitive binary values**

Create `packages/graph/tests/bulk/encoder.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  BulkPropertyType,
  encodeBulkHeader,
  encodeBulkValue,
  normalizeBulkProperties,
} from "../../src/bulk/encoder"

const bytes = (buffer: Buffer): number[] => [...buffer.values()]

describe("bulk encoder", () => {
  it("кодирует boolean, long, double и string в GRAPH.BULK формат", () => {
    expect(bytes(encodeBulkValue(true))).toEqual([BulkPropertyType.Bool, 1])

    const long = encodeBulkValue(42)
    expect(long.readUInt8(0)).toBe(BulkPropertyType.Long)
    expect(long.readBigInt64LE(1)).toBe(42n)

    const double = encodeBulkValue(1.5)
    expect(double.readUInt8(0)).toBe(BulkPropertyType.Double)
    expect(double.readDoubleLE(1)).toBe(1.5)

    expect(encodeBulkValue("абв").subarray(0, 1).readUInt8(0)).toBe(BulkPropertyType.String)
    expect(encodeBulkValue("абв").subarray(1).toString("utf8")).toBe("абв\0")
  })

  it("кодирует массивы одного типа и пропускает null-значения при нормализации", () => {
    expect(normalizeBulkProperties({ a: null, b: [null], c: ["x", null, "y"] })).toEqual({
      c: ["x", "y"],
    })

    const encoded = encodeBulkValue(["x", "y"])
    expect(encoded.readUInt8(0)).toBe(BulkPropertyType.Array)
    expect(encoded.readBigInt64LE(1)).toBe(2n)
    expect(encoded.subarray(9).includes(0)).toBe(true)
  })

  it("создаёт header с именем сущности и именами свойств", () => {
    const encoded = encodeBulkHeader("MetadataCatalog", ["id", "name"])
    expect(encoded.toString("utf8")).toContain("MetadataCatalog\0")
    expect(encoded.toString("utf8")).toContain("id\0")
    expect(encoded.toString("utf8")).toContain("name\0")
    expect(encoded.readUInt32LE(Buffer.byteLength("MetadataCatalog") + 1)).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: FAIL because `../../src/bulk/encoder` does not exist.

- [ ] **Step 3: Implement minimal encoder**

Create `packages/graph/src/bulk/encoder.ts`:

```ts
import type { GraphPrimitive } from "../types"

export enum BulkPropertyType {
  Null = 0,
  Bool = 1,
  Double = 2,
  String = 3,
  Long = 4,
  Array = 5,
}

export type BulkScalar = Exclude<GraphPrimitive, null>
export type BulkValue = BulkScalar | BulkScalar[]
export type BulkProperties = Record<string, BulkValue>

const nulString = (value: string): Buffer => Buffer.from(`${value}\0`, "utf8")

const uint32 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeUInt32LE(value, 0)
  return buffer
}

const int64 = (value: bigint): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigInt64LE(value, 0)
  return buffer
}

const double64 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeDoubleLE(value, 0)
  return buffer
}

const typeByte = (type: BulkPropertyType): Buffer => Buffer.from([type])

const assertFiniteNumber = (value: number): void => {
  if (!Number.isFinite(value)) throw new Error(`Cannot encode non-finite bulk number: ${value}`)
}

const arrayElementKind = (values: readonly BulkScalar[]): string => {
  const kinds = new Set(values.map((value) => typeof value))
  if (kinds.size !== 1) throw new Error("GRAPH.BULK arrays must contain values of one primitive type")
  return [...kinds][0]!
}

export const normalizeBulkProperties = (
  props: Record<string, GraphPrimitive | GraphPrimitive[]>,
): BulkProperties => {
  const result: BulkProperties = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === null) continue
    if (Array.isArray(value)) {
      const values = value.filter((item): item is BulkScalar => item !== null)
      if (values.length === 0) continue
      arrayElementKind(values)
      result[key] = values
      continue
    }
    result[key] = value
  }
  return result
}

export const encodeBulkValue = (value: BulkValue): Buffer => {
  if (Array.isArray(value)) {
    const parts = [typeByte(BulkPropertyType.Array), int64(BigInt(value.length))]
    for (const item of value) {
      parts.push(encodeBulkValue(item))
    }
    return Buffer.concat(parts)
  }

  if (typeof value === "boolean") {
    return Buffer.concat([typeByte(BulkPropertyType.Bool), Buffer.from([value ? 1 : 0])])
  }

  if (typeof value === "number") {
    assertFiniteNumber(value)
    if (Number.isSafeInteger(value)) {
      return Buffer.concat([typeByte(BulkPropertyType.Long), int64(BigInt(value))])
    }
    return Buffer.concat([typeByte(BulkPropertyType.Double), double64(value)])
  }

  return Buffer.concat([typeByte(BulkPropertyType.String), nulString(value)])
}

export const encodeBulkHeader = (name: string, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    nulString(name),
    uint32(propertyNames.length),
    ...propertyNames.map(nulString),
  ])
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/encoder.ts packages/graph/tests/bulk/encoder.test.ts
git commit -m "feat: :sparkles: добавить encoder GRAPH.BULK"
```

---

## Task 2: Bulk Plan

**Files:**
- Create: `packages/graph/src/bulk/plan.ts`
- Test: `packages/graph/tests/bulk/plan.test.ts`

- [ ] **Step 1: Write failing tests for planning nodes, stubs, file links, and edges**

Create `packages/graph/tests/bulk/plan.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createBulkPlan } from "../../src/bulk/plan"
import type { FileGraphData } from "../../src/types"

describe("bulk plan", () => {
  it("назначает стабильные numeric IDs для File, предметных узлов и stub-узлов", () => {
    const files: FileGraphData[] = [
      {
        filePath: "a.yaml",
        fileStats: { mtimeMs: 1, size: 2, updatedAt: 3 },
        nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
        edges: [{ src: "A", tgt: "Missing", kind: "VALUE", props: { index: 1 } }],
        declaredNodeIds: ["A"],
        contributedNodeIds: ["Missing"],
      },
    ]

    const plan = createBulkPlan(files)

    expect(plan.nodeCount).toBe(3)
    expect(plan.edgeCount).toBe(3)
    expect(plan.nodeIdByLogicalId).toEqual(new Map([
      ["a.yaml", 0],
      ["A", 1],
      ["Missing", 2],
    ]))
    expect(plan.nodeGroups.map((group) => [group.label, group.nodes.map((node) => node.id)])).toEqual([
      ["File", [0]],
      ["MetadataCatalog", [1]],
      ["GraphNode", [2]],
    ])
    expect(plan.edgeGroups.map((group) => [group.kind, group.edges.map((edge) => [edge.src, edge.tgt])])).toEqual([
      ["VALUE", [[1, 2]]],
      ["DECLARES", [[0, 1]]],
      ["CONTRIBUTES", [[0, 2]]],
    ])
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/plan.test.ts
```

Expected: FAIL because `../../src/bulk/plan` does not exist.

- [ ] **Step 3: Implement minimal planner**

Create `packages/graph/src/bulk/plan.ts`:

```ts
import type { EdgeData, FileGraphData, GraphPrimitive, NodeData } from "../types"
import { normalizeBulkProperties, type BulkProperties } from "./encoder"

export interface BulkNodeRecord {
  id: number
  logicalId: string
  props: BulkProperties
}

export interface BulkEdgeRecord {
  src: number
  tgt: number
  props: BulkProperties
}

export interface BulkNodeGroup {
  label: string
  nodes: BulkNodeRecord[]
}

export interface BulkEdgeGroup {
  kind: string
  edges: BulkEdgeRecord[]
}

export interface BulkPlan {
  nodeCount: number
  edgeCount: number
  labels: string[]
  nodeIdByLogicalId: Map<string, number>
  nodeGroups: BulkNodeGroup[]
  edgeGroups: BulkEdgeGroup[]
}

const groupPush = <T>(map: Map<string, T[]>, key: string, value: T): void => {
  const group = map.get(key)
  if (group === undefined) map.set(key, [value])
  else group.push(value)
}

const fileProps = (file: FileGraphData): Record<string, GraphPrimitive> => {
  const stats = file.fileStats ?? { mtimeMs: 0, size: 0, updatedAt: Date.now() }
  return {
    path: file.filePath,
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    updatedAt: stats.updatedAt,
  }
}

const edgeProps = (file: FileGraphData, edge: EdgeData): Record<string, GraphPrimitive> => ({
  ...(edge.props ?? {}),
  filePath: file.filePath,
})

export const createBulkPlan = (files: readonly FileGraphData[]): BulkPlan => {
  const nodeIdByLogicalId = new Map<string, number>()
  const nodeGroups = new Map<string, BulkNodeRecord[]>()
  const edgeGroups = new Map<string, BulkEdgeRecord[]>()
  const labels: string[] = []
  let nextNodeId = 0

  const addNode = (label: string, logicalId: string, props: Record<string, GraphPrimitive | GraphPrimitive[]>): number => {
    const existing = nodeIdByLogicalId.get(logicalId)
    if (existing !== undefined) return existing
    const id = nextNodeId++
    nodeIdByLogicalId.set(logicalId, id)
    if (!nodeGroups.has(label)) labels.push(label)
    groupPush(nodeGroups, label, { id, logicalId, props: normalizeBulkProperties({ id: logicalId, ...props }) })
    return id
  }

  const ensureStub = (logicalId: string): number => addNode("GraphNode", logicalId, {})

  for (const file of files) {
    addNode("File", file.filePath, fileProps(file))
    for (const node of file.nodes) {
      addNode(node.label, node.id, node.props)
    }
  }

  for (const file of files) {
    const fileNodeId = nodeIdByLogicalId.get(file.filePath)
    if (fileNodeId === undefined) throw new Error(`Missing File node in bulk plan: ${file.filePath}`)

    for (const edge of file.edges) {
      const src = nodeIdByLogicalId.get(edge.src) ?? ensureStub(edge.src)
      const tgt = nodeIdByLogicalId.get(edge.tgt) ?? ensureStub(edge.tgt)
      groupPush(edgeGroups, edge.kind, { src, tgt, props: normalizeBulkProperties(edgeProps(file, edge)) })
    }

    for (const nodeId of file.declaredNodeIds ?? file.nodes.map((node: NodeData) => node.id)) {
      const tgt = nodeIdByLogicalId.get(nodeId) ?? ensureStub(nodeId)
      groupPush(edgeGroups, "DECLARES", { src: fileNodeId, tgt, props: {} })
    }

    for (const nodeId of file.contributedNodeIds ?? []) {
      const tgt = nodeIdByLogicalId.get(nodeId) ?? ensureStub(nodeId)
      groupPush(edgeGroups, "CONTRIBUTES", { src: fileNodeId, tgt, props: {} })
    }
  }

  const nodeGroupList = labels.map((label) => ({ label, nodes: nodeGroups.get(label) ?? [] }))
  const edgeGroupList = [...edgeGroups.entries()].map(([kind, edges]) => ({ kind, edges }))

  return {
    nodeCount: nodeGroupList.reduce((sum, group) => sum + group.nodes.length, 0),
    edgeCount: edgeGroupList.reduce((sum, group) => sum + group.edges.length, 0),
    labels,
    nodeIdByLogicalId,
    nodeGroups: nodeGroupList,
    edgeGroups: edgeGroupList,
  }
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/plan.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/plan.ts packages/graph/tests/bulk/plan.test.ts
git commit -m "feat: :sparkles: построить bulk-план графа"
```

---

## Task 3: Blob Encoding With Schema Groups

**Files:**
- Modify: `packages/graph/src/bulk/encoder.ts`
- Modify: `packages/graph/tests/bulk/encoder.test.ts`

- [ ] **Step 1: Write failing tests for node and edge blobs**

Append to `packages/graph/tests/bulk/encoder.test.ts`:

```ts
import { encodeEdgeBlobs, encodeNodeBlobs } from "../../src/bulk/encoder"

describe("bulk blob encoder", () => {
  it("кодирует node blob с header и свойствами в стабильном порядке", () => {
    const blobs = encodeNodeBlobs("MetadataCatalog", [
      { id: 0, logicalId: "A", props: { id: "A", name: "A", enabled: true } },
      { id: 1, logicalId: "B", props: { id: "B", name: "B", enabled: false } },
    ])

    expect(blobs).toHaveLength(1)
    expect(blobs[0]!.count).toBe(2)
    expect(blobs[0]!.buffer.toString("utf8")).toContain("MetadataCatalog\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("enabled\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("id\0")
    expect(blobs[0]!.buffer.toString("utf8")).toContain("name\0")
  })

  it("разбивает blob при конфликте типов одного свойства", () => {
    const blobs = encodeNodeBlobs("MetadataCatalog", [
      { id: 0, logicalId: "A", props: { id: "A", value: "1" } },
      { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
    ])

    expect(blobs).toHaveLength(2)
    expect(blobs.map((blob) => blob.count)).toEqual([1, 1])
  })

  it("кодирует edge blob с source и target numeric IDs", () => {
    const blobs = encodeEdgeBlobs("VALUE", [
      { src: 0, tgt: 1, props: { yaml: "Реквизит", index: 2 } },
    ])

    expect(blobs).toHaveLength(1)
    const buffer = blobs[0]!.buffer
    const headerEnd = buffer.indexOf("yaml\0", "utf8") + Buffer.byteLength("yaml\0")
    expect(buffer.readBigUInt64LE(headerEnd)).toBe(0n)
    expect(buffer.readBigUInt64LE(headerEnd + 8)).toBe(1n)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: FAIL because `encodeNodeBlobs` and `encodeEdgeBlobs` are missing.

- [ ] **Step 3: Implement blob encoding**

Add to `packages/graph/src/bulk/encoder.ts`:

```ts
export interface EncodedBulkBlob {
  name: string
  count: number
  buffer: Buffer
}

interface NodeLike {
  props: BulkProperties
}

interface EdgeLike {
  src: number
  tgt: number
  props: BulkProperties
}

const uint64 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigUInt64LE(BigInt(value), 0)
  return buffer
}

const valueSignature = (value: BulkValue): string => {
  if (Array.isArray(value)) return `array:${typeof value[0]}`
  if (typeof value === "number") return Number.isSafeInteger(value) ? "long" : "double"
  return typeof value
}

const schemaKey = (props: BulkProperties): string =>
  Object.entries(props)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${valueSignature(value)}`)
    .join("|")

const propertyNamesFor = (props: BulkProperties): string[] =>
  Object.keys(props).sort((a, b) => a.localeCompare(b))

const groupBySchema = <T extends NodeLike | EdgeLike>(records: readonly T[]): T[][] => {
  const groups = new Map<string, T[]>()
  for (const record of records) {
    const key = schemaKey(record.props)
    const group = groups.get(key)
    if (group === undefined) groups.set(key, [record])
    else group.push(record)
  }
  return [...groups.values()]
}

export const encodeNodeBlobs = (label: string, nodes: readonly NodeLike[]): EncodedBulkBlob[] =>
  groupBySchema(nodes).map((group) => {
    const propertyNames = propertyNamesFor(group[0]?.props ?? {})
    const records = group.map((node) =>
      Buffer.concat(propertyNames.map((name) => encodeBulkValue(node.props[name]!))),
    )
    return {
      name: label,
      count: group.length,
      buffer: Buffer.concat([encodeBulkHeader(label, propertyNames), ...records]),
    }
  })

export const encodeEdgeBlobs = (kind: string, edges: readonly EdgeLike[]): EncodedBulkBlob[] =>
  groupBySchema(edges).map((group) => {
    const propertyNames = propertyNamesFor(group[0]?.props ?? {})
    const records = group.map((edge) =>
      Buffer.concat([
        uint64(edge.src),
        uint64(edge.tgt),
        ...propertyNames.map((name) => encodeBulkValue(edge.props[name]!)),
      ]),
    )
    return {
      name: kind,
      count: group.length,
      buffer: Buffer.concat([encodeBulkHeader(kind, propertyNames), ...records]),
    }
  })
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/encoder.ts packages/graph/tests/bulk/encoder.test.ts
git commit -m "feat: :sparkles: кодировать GRAPH.BULK blobs"
```

---

## Task 4: Bulk Command Writer

**Files:**
- Create: `packages/graph/src/bulk/write.ts`
- Modify: `packages/graph/src/internal/connection.ts`
- Test: `packages/graph/tests/bulk/write.test.ts`

- [ ] **Step 1: Write failing tests for command splitting**

Create `packages/graph/tests/bulk/write.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const rawCommandMock = vi.fn()

vi.mock("../../src/internal/connection", () => ({
  graphNameOf: () => "g",
  rawCommand: rawCommandMock,
}))

import { buildBulkCommands, writeBulkCommands } from "../../src/bulk/write"
import type { GraphConnection } from "../../src/internal/connection"

describe("bulk write", () => {
  beforeEach(() => {
    rawCommandMock.mockReset()
    rawCommandMock.mockResolvedValue("ok")
  })

  it("строит BEGIN-команду и последующие команды без BEGIN", () => {
    const commands = buildBulkCommands(
      [
        { kind: "node" as const, name: "A", count: 2, buffer: Buffer.alloc(30) },
        { kind: "edge" as const, name: "R", count: 3, buffer: Buffer.alloc(30) },
      ],
      { maxCommandBytes: 80, maxBlobBytes: 64 },
    )

    expect(commands).toHaveLength(2)
    expect(commands[0]!.begin).toBe(true)
    expect(commands[0]!.nodeCount).toBe(2)
    expect(commands[0]!.edgeCount).toBe(0)
    expect(commands[1]!.begin).toBe(false)
    expect(commands[1]!.nodeCount).toBe(0)
    expect(commands[1]!.edgeCount).toBe(3)
  })

  it("падает, если один blob превышает maxBlobBytes", () => {
    expect(() =>
      buildBulkCommands(
        [{ kind: "node" as const, name: "A", count: 1, buffer: Buffer.alloc(65) }],
        { maxCommandBytes: 100, maxBlobBytes: 64 },
      ),
    ).toThrow("GRAPH.BULK blob A is 65 bytes, limit is 64 bytes")
  })

  it("отправляет GRAPH.BULK через rawCommand", async () => {
    await writeBulkCommands(
      {} as GraphConnection,
      [{ begin: true, nodeCount: 1, edgeCount: 0, blobs: [Buffer.from("x")] }],
    )

    expect(rawCommandMock).toHaveBeenCalledWith({} as GraphConnection, [
      "GRAPH.BULK",
      "g",
      "BEGIN",
      "1",
      "0",
      Buffer.from("x"),
    ])
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/write.test.ts
```

Expected: FAIL because `bulk/write` and `rawCommand` support do not exist.

- [ ] **Step 3: Add rawCommand to connection**

Modify `packages/graph/src/internal/connection.ts`:

```ts
type InternalGraphConnection = {
  client: Awaited<ReturnType<typeof FalkorDB.connect>>
  graph: ReturnType<Awaited<ReturnType<typeof FalkorDB.connect>>["selectGraph"]>
  graphName: string
}
```

Change `connect` return:

```ts
return asExternal({ client, graph, graphName })
```

Add:

```ts
export type RawGraphCommandArg = string | Buffer

export const graphNameOf = (conn: GraphConnection): string => asInternal(conn).graphName

export const rawCommand = async (
  conn: GraphConnection,
  args: readonly RawGraphCommandArg[],
): Promise<unknown> => {
  const client = asInternal(conn).client as unknown as {
    executeCommand?: (args: readonly RawGraphCommandArg[]) => Promise<unknown>
    sendCommand?: (args: readonly RawGraphCommandArg[]) => Promise<unknown>
  }
  if (typeof client.executeCommand === "function") return await client.executeCommand(args)
  if (typeof client.sendCommand === "function") return await client.sendCommand(args)
  throw new Error("FalkorDB client does not expose raw command execution")
}
```

- [ ] **Step 4: Implement bulk writer**

Create `packages/graph/src/bulk/write.ts`:

```ts
import { graphNameOf, rawCommand } from "../internal/connection"
import type { GraphConnection } from "../internal/connection"

export interface BulkWriteLimits {
  maxBlobBytes: number
  maxCommandBytes: number
}

export interface BulkWriteBlob {
  kind: "node" | "edge"
  name: string
  count: number
  buffer: Buffer
}

export interface BulkCommand {
  begin: boolean
  nodeCount: number
  edgeCount: number
  blobs: Buffer[]
}

const DEFAULT_LIMITS: BulkWriteLimits = {
  maxBlobBytes: 256 * 1024 * 1024,
  maxCommandBytes: 768 * 1024 * 1024,
}

const commandBytes = (command: BulkCommand): number =>
  command.blobs.reduce((sum, blob) => sum + blob.byteLength, 0)

export const buildBulkCommands = (
  blobs: readonly BulkWriteBlob[],
  limits: Partial<BulkWriteLimits> = {},
): BulkCommand[] => {
  const effective = { ...DEFAULT_LIMITS, ...limits }
  const commands: BulkCommand[] = []
  let current: BulkCommand = { begin: true, nodeCount: 0, edgeCount: 0, blobs: [] }

  const flush = (): void => {
    if (current.blobs.length === 0) return
    commands.push(current)
    current = { begin: false, nodeCount: 0, edgeCount: 0, blobs: [] }
  }

  for (const blob of blobs) {
    if (blob.buffer.byteLength > effective.maxBlobBytes) {
      throw new Error(`GRAPH.BULK blob ${blob.name} is ${blob.buffer.byteLength} bytes, limit is ${effective.maxBlobBytes} bytes`)
    }
    if (current.blobs.length > 0 && commandBytes(current) + blob.buffer.byteLength > effective.maxCommandBytes) {
      flush()
    }
    current.blobs.push(blob.buffer)
    if (blob.kind === "node") current.nodeCount += blob.count
    else current.edgeCount += blob.count
  }
  flush()
  return commands
}

export const writeBulkCommands = async (
  conn: GraphConnection,
  commands: readonly BulkCommand[],
): Promise<void> => {
  const graphName = graphNameOf(conn)
  for (const command of commands) {
    const args = [
      "GRAPH.BULK",
      graphName,
      ...(command.begin ? ["BEGIN"] : []),
      String(command.nodeCount),
      String(command.edgeCount),
      ...command.blobs,
    ]
    await rawCommand(conn, args)
  }
}
```

- [ ] **Step 5: Run tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/write.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/graph/src/internal/connection.ts packages/graph/src/bulk/write.ts packages/graph/tests/bulk/write.test.ts
git commit -m "feat: :sparkles: отправлять GRAPH.BULK команды"
```

---

## Task 5: Bulk Replace Orchestration

**Files:**
- Create: `packages/graph/src/bulk/replaceGraphBulk.ts`
- Modify: `packages/graph/src/types.ts`
- Modify: `packages/graph/src/updateGraph.ts`
- Test: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Write failing updateGraph routing test**

Near the existing mocks in `packages/graph/tests/updateGraph.test.ts`, add:

```ts
const executeCommandMock = vi.fn()
```

Reset it in the existing `beforeEach`, and expose it from the mocked FalkorDB client returned by `connectMock`:

```ts
executeCommandMock.mockReset().mockResolvedValue("OK")
connectMock
  .mockReset()
  .mockResolvedValue({ selectGraph: selectGraphMock, executeCommand: executeCommandMock, close: closeMock })
```

Append to `packages/graph/tests/updateGraph.test.ts`:

```ts
it("replace + bulk использует GRAPH.BULK путь без createEdges", async () => {
  const files: FileGraphData[] = [
    {
      filePath: "a.yaml",
      nodes: [{ id: "A", label: "MetadataCatalog", props: { name: "A" } }],
      edges: [],
    },
  ]

  await updateGraph(files, { graphName: "test", replace: true, bulk: true })

  const cypher = queryMock.mock.calls.map((call) => call[0] as string)
  expect(executeCommandMock).toHaveBeenCalledWith(expect.arrayContaining(["GRAPH.BULK", "test", "BEGIN"]))
  expect(cypher).not.toContainEqual(expect.stringContaining("CREATE (m:MetadataCatalog"))
  expect(cypher).not.toContainEqual(expect.stringContaining("CREATE (f:File"))
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/updateGraph.test.ts
```

Expected: FAIL because `bulk` is not in `GraphUpdateOptions` and routing does not exist.

- [ ] **Step 3: Add types and phases**

Modify `packages/graph/src/types.ts`:

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
  | "bulkPlan"
  | "bulkWrite"
  | "cleanupOrphanStubs"

export interface GraphUpdateOptions extends ConnectionOptions {
  onProgress?: (progress: GraphProgress) => void
  /** Полная замена графа: reset + CREATE-путь без инкрементального delete/MERGE. */
  replace?: boolean
  /** Экспериментальный replace-путь через прямой GRAPH.BULK binary import. */
  bulk?: boolean
  /** Максимальный размер одного GRAPH.BULK blob. По умолчанию 256MB, максимум FalkorDB 512MB. */
  maxBulkBlobBytes?: number
  /** Максимальный размер одной GRAPH.BULK команды. По умолчанию 768MB. */
  maxBulkCommandBytes?: number
}
```

- [ ] **Step 4: Implement replaceGraphBulk orchestration**

Create `packages/graph/src/bulk/replaceGraphBulk.ts`:

```ts
import { ensureFileIndexes, ensureLabelIndexes, resetGraph, validateReplacePayload } from "../internal/operations"
import type { GraphConnection } from "../internal/connection"
import type { FileGraphData, GraphProgress } from "../types"
import { encodeEdgeBlobs, encodeNodeBlobs } from "./encoder"
import { createBulkPlan } from "./plan"
import { buildBulkCommands, writeBulkCommands } from "./write"

interface BulkReplaceOptions {
  maxBlobBytes?: number
  maxCommandBytes?: number
  onProgress?: (progress: GraphProgress) => void
}

const report = async (
  phase: GraphProgress["phase"],
  onProgress: ((progress: GraphProgress) => void) | undefined,
  fn: () => Promise<void>,
): Promise<void> => {
  onProgress?.({ phase, done: 0, total: 1 })
  await fn()
  onProgress?.({ phase, done: 1, total: 1 })
}

export const replaceGraphBulk = async (
  conn: GraphConnection,
  files: readonly FileGraphData[],
  opts: BulkReplaceOptions = {},
): Promise<void> => {
  validateReplacePayload(files)
  let plan = createBulkPlan(files)
  await report("resetGraph", opts.onProgress, () => resetGraph(conn))
  await report("bulkPlan", opts.onProgress, async () => {
    plan = createBulkPlan(files)
  })

  const nodeBlobs = plan.nodeGroups.flatMap((group) =>
    encodeNodeBlobs(group.label, group.nodes).map((blob) => ({ kind: "node" as const, ...blob })),
  )
  const edgeBlobs = plan.edgeGroups.flatMap((group) =>
    encodeEdgeBlobs(group.kind, group.edges).map((blob) => ({ kind: "edge" as const, ...blob })),
  )
  const commands = buildBulkCommands([...nodeBlobs, ...edgeBlobs], {
    maxBlobBytes: opts.maxBlobBytes,
    maxCommandBytes: opts.maxCommandBytes,
  })

  await report("bulkWrite", opts.onProgress, () => writeBulkCommands(conn, commands))
  await report("ensureFileIndexes", opts.onProgress, () => ensureFileIndexes(conn))
  await report("ensureLabelIndexes", opts.onProgress, () => ensureLabelIndexes(conn, plan.labels))
}
```

- [ ] **Step 5: Route updateGraph to bulk path**

Modify `packages/graph/src/updateGraph.ts`:

```ts
import { replaceGraphBulk } from "./bulk/replaceGraphBulk"
```

Inside `if (opts?.replace === true)`:

```ts
if (opts.bulk === true) {
  await replaceGraphBulk(conn, filesToMerge, {
    onProgress,
    maxBlobBytes: opts.maxBulkBlobBytes,
    maxCommandBytes: opts.maxBulkCommandBytes,
  })
  return
}
await replaceGraph(conn, filesToMerge, labels, labelByNodeId, onProgress)
return
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/bulk/encoder.test.ts tests/bulk/plan.test.ts tests/bulk/write.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/graph/src/types.ts packages/graph/src/updateGraph.ts packages/graph/src/bulk/replaceGraphBulk.ts packages/graph/tests/updateGraph.test.ts
git commit -m "feat: :sparkles: подключить bulk replace-путь"
```

---

## Task 6: CLI Flag

**Files:**
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/commands/updateGraph.ts`
- Test: `packages/cli/src/commands/updateGraph.test.ts`

- [ ] **Step 1: Write failing CLI command test**

Append to `packages/cli/src/commands/updateGraph.test.ts`:

```ts
it("передаёт bulk: true вместе с replace", async () => {
  const projectPath = createProject()
  writeFileSync(join(projectPath, "a.yaml"), "x: y")
  mocks.buildGraph.mockResolvedValue([{ filePath: "a.yaml", nodes: [], edges: [] }])

  await updateGraph(projectPath, { replace: true, bulk: true })

  expect(mocks.writeGraph).toHaveBeenCalledWith(
    expect.any(Array),
    expect.objectContaining({ graphName: expect.any(String), replace: true, bulk: true }),
  )
})
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: FAIL because `UpdateGraphCommandOptions` has no `bulk`.

- [ ] **Step 3: Add bulk option to command layer**

Modify `packages/cli/src/commands/updateGraph.ts`:

```ts
export interface UpdateGraphCommandOptions {
  replace?: boolean
  bulk?: boolean
}
```

In the `replace` call:

```ts
await writeGraph(graphFiles, {
  ...graphOptions,
  replace: true,
  bulk: opts.bulk === true,
  onProgress: createProgressReporter(),
})
```

- [ ] **Step 4: Add CLI flag**

Modify `packages/cli/src/cli.ts`:

```ts
.option("--bulk", "использовать экспериментальный GRAPH.BULK replace-путь; требует --replace")
.action((projectPath: string, opts: { file?: string; replace?: boolean; bulk?: boolean }) => {
  run(() => opts.file
    ? updateGraphFile(projectPath, opts.file)
    : updateGraph(projectPath, { replace: opts.replace === true, bulk: opts.bulk === true }))
})
```

Reject `--bulk` without `--replace` in `updateGraph` before reading project files:

```ts
if (opts.bulk === true && opts.replace !== true) {
  console.error(chalk.red("--bulk можно использовать только вместе с --replace"))
  process.exit(1)
}
```

- [ ] **Step 5: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/cli/src/cli.ts packages/cli/src/commands/updateGraph.ts packages/cli/src/commands/updateGraph.test.ts
git commit -m "feat: :sparkles: добавить флаг bulk для графа"
```

---

## Task 7: Integration Test

**Files:**
- Modify: `packages/graph/tests/integration/updateGraph.integration.test.ts`

- [ ] **Step 1: Extend existing replace snapshot test**

In `packages/graph/tests/integration/updateGraph.integration.test.ts`, inside `"replace-режим создаёт тот же маленький граф..."`, after `replaceSnapshot`, add a third run:

```ts
    await withGraph(
      async (g) => {
        await g.query("MATCH (n) DETACH DELETE n")
      },
      opts(),
    )

    await updateGraph(files, {
      ...opts(),
      replace: true,
      bulk: true,
      maxBulkBlobBytes: 1024,
      maxBulkCommandBytes: 4096,
    })
    const bulkSnapshot = await readSnapshot()

    expect(bulkSnapshot).toEqual(normalSnapshot)
```

Also extend `files` with one typed array and one floating-point property:

```ts
{ id: "B", label: "MetadataAttribute", props: { name: "B", p_values: ["x", "y"], p_ratio: 1.5 } }
```

Extend expected `nodes` projection in `readSnapshot` to return `p_values` and `p_ratio`, and expected object accordingly.

- [ ] **Step 2: Run integration test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/graph/tests/integration/updateGraph.integration.test.ts
git commit -m "test: :white_check_mark: проверить GRAPH.BULK replace"
```

---

## Task 8: Verification and ERP Measurement

**Files:**
- No source changes expected. If measurement notes are recorded, modify `docs/superpowers/specs/2026-05-25-graph-bulk-replace-design.md` or create a short result note only after asking the user.

- [ ] **Step 1: Run graph unit tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/bulk/encoder.test.ts tests/bulk/plan.test.ts tests/bulk/write.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run CLI tests**

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

Expected: PASS. If `pnpm test` fails in unrelated pre-existing integration behavior, document exact failing test and continue only after confirming it is unrelated.

- [ ] **Step 4: Run focused integration test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS.

- [ ] **Step 5: Ensure ERP YAML project exists**

Run:

```bash
test -d /private/tmp/erp_nkdk && du -sh /private/tmp/erp_nkdk
```

Expected: directory exists and is around `2.2G`. If it is missing, regenerate it:

```bash
pnpm --filter @nakidka/cli dev import /Users/nikita/git/round-trip-source/erp /private/tmp/erp_nkdk
```

Expected import output: `Готово: ... успешно, 0 с ошибкой`.

- [ ] **Step 6: Start clean FalkorDB**

Run:

```bash
docker run -d --rm --name nkdk-falkordb-bulk-measure -p 6379:6379 falkordb/falkordb:latest
```

Expected: container id.

- [ ] **Step 7: Measure direct bulk path**

Run:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Expected: output includes `bulkPlan`, `bulkWrite`, `ensureLabelIndexes`, then final timing lines:

```text
чтение файлов    — ... мс — 16808 шт.
buildGraph       — ... мс — узлов ..., рёбер ...
updateGraph      — ... мс
итого            — ... мс
```

Target: total close to `70-90 с`, and clearly below current `312.4 с`.

- [ ] **Step 8: Verify counts**

Run:

```bash
docker exec nkdk-falkordb-bulk-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH (n) RETURN count(n)" --compact
docker exec nkdk-falkordb-bulk-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH ()-[r]->() RETURN count(r)" --compact
```

Expected counts should match the direct bulk graph counts from implementation output. If the graph name differs, use the graph name printed by the CLI/project helper.

- [ ] **Step 9: Stop FalkorDB**

Run:

```bash
docker stop nkdk-falkordb-bulk-measure
```

Expected: `nkdk-falkordb-bulk-measure`.

- [ ] **Step 10: Commit if measurement docs changed**

If documentation was updated:

```bash
git add docs/superpowers/specs/2026-05-25-graph-bulk-replace-design.md
git commit -m "docs: :memo: зафиксировать замер GRAPH.BULK"
```

If no files changed, do not commit.

---

## Self-Review Notes

- Spec coverage: the plan covers typed encoding, plan construction, incremental command limits, indexes, CLI flag, integration equivalence, and ERP measurement.
- The plan intentionally keeps diagnostic scripts out of product implementation. They are currently untracked and should be deleted or ignored before final PR if not needed.
- The implementation must verify actual raw command support in the installed `falkordb` npm client during Task 4. If neither `executeCommand` nor `sendCommand` exists, adapt `rawCommand` to the underlying Redis client exposed by the library and cover that adapter with a unit test.
