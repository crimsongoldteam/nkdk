# Loader-Style GRAPH.BULK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace exact-schema bulk blobs with loader-style streaming `GRAPH.BULK` tokens that use union schemas and `NULL` placeholders for absent properties.

**Architecture:** Keep the existing direct `GRAPH.BULK` replace path and writer, but change blob construction. `encoder.ts` gains `NULL` value support and typed signatures, new `stream.ts` builds large node/edge tokens per label/relation type with limit-based flushing, and `replaceGraphBulk.ts` uses the streaming builder instead of eager exact-schema `encodeNodeBlobs` / `encodeEdgeBlobs`.

**Tech Stack:** TypeScript, Vitest, FalkorDB `GRAPH.BULK`, existing `@nakidka/graph` bulk modules.

---

## File Structure

- Modify `packages/graph/src/bulk/encoder.ts`: add `BulkPropertyType.Null` encoding, export property type signatures, and keep existing exact-schema helpers for focused unit coverage.
- Create `packages/graph/src/bulk/stream.ts`: union-schema bucketing and loader-style token flushing.
- Modify `packages/graph/src/bulk/write.ts`: rename limit concepts from blob to token internally and expose command stats.
- Modify `packages/graph/src/bulk/replaceGraphBulk.ts`: build commands through `stream.ts`; map public `maxBulkBlobBytes` to token limit.
- Modify `packages/graph/tests/bulk/encoder.test.ts`: cover `NULL`.
- Create `packages/graph/tests/bulk/stream.test.ts`: cover optional properties, type conflicts, and flush limits.
- Modify `packages/graph/tests/bulk/write.test.ts`: keep concurrency tests and add stats assertions.
- Modify `packages/graph/tests/integration/updateGraph.integration.test.ts`: assert optional missing properties read as `null` after bulk replace.

---

## Task 1: Encode `NULL` Values

**Files:**
- Modify: `packages/graph/src/bulk/encoder.ts`
- Modify: `packages/graph/tests/bulk/encoder.test.ts`

- [ ] **Step 1: Write failing encoder test**

Append to `packages/graph/tests/bulk/encoder.test.ts`:

```ts
it("кодирует отсутствующее свойство как GRAPH.BULK NULL", () => {
  expect([...encodeBulkValue(null).values()]).toEqual([BulkPropertyType.Null])
})
```

The existing import block already imports `encodeBulkValue` and `BulkPropertyType`; no new import is required for this test.

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: FAIL because `BulkValue` does not include `null` and `encodeBulkValue` does not handle it.

- [ ] **Step 3: Implement null encoding and reusable signatures**

Modify `packages/graph/src/bulk/encoder.ts`:

```ts
export type BulkScalar = GraphPrimitive
export type BulkNonNullScalar = Exclude<GraphPrimitive, null>
export type BulkValue = BulkScalar | BulkNonNullScalar[]
export type BulkProperties = Record<string, BulkValue>

const arrayElementKind = (values: readonly BulkNonNullScalar[]): string => {
  const kinds = new Set(values.map((value) => typeof value))
  if (kinds.size !== 1) throw new Error("GRAPH.BULK arrays must contain values of one primitive type")
  return [...kinds][0]!
}

export const bulkValueSignature = (value: BulkValue): string => {
  if (value === null) return "null"
  if (Array.isArray(value)) return `array:${typeof value[0]}`
  if (typeof value === "number") return Number.isSafeInteger(value) ? "long" : "double"
  return typeof value
}
```

Update `normalizeBulkProperties` so it still removes `null` from source props for current non-stream callers:

```ts
const values = value.filter((item): item is BulkNonNullScalar => item !== null)
```

Update `encodeBulkValue`:

```ts
export const encodeBulkValue = (value: BulkValue): Buffer => {
  if (value === null) return typeByte(BulkPropertyType.Null)
  // existing array / boolean / number / string branches stay below
}
```

Update existing internal `valueSignature` usages to call `bulkValueSignature`.

- [ ] **Step 4: Run test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/encoder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/encoder.ts packages/graph/tests/bulk/encoder.test.ts
git commit -m "feat: :sparkles: кодировать null в GRAPH.BULK"
```

---

## Task 2: Build Loader-Style Streaming Tokens

**Files:**
- Create: `packages/graph/src/bulk/stream.ts`
- Test: `packages/graph/tests/bulk/stream.test.ts`

- [ ] **Step 1: Write failing stream tests**

Create `packages/graph/tests/bulk/stream.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { BulkPropertyType } from "../../src/bulk/encoder"
import { buildBulkTokenCommands } from "../../src/bulk/stream"
import type { BulkEdgeGroup, BulkNodeGroup } from "../../src/bulk/plan"

const readPropertyCount = (buffer: Buffer, name: string): number =>
  buffer.readUInt32LE(Buffer.byteLength(name) + 1)

describe("bulk stream", () => {
  it("объединяет optional свойства в один node token и кодирует пропуски как NULL", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", name: "A", enabled: true } },
          { id: 1, logicalId: "B", props: { id: "B", name: "B" } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.nodeCount).toBe(2)
    expect(commands[0]!.blobs).toHaveLength(1)
    expect(stats.nodeBlobs).toBe(1)
    expect(readPropertyCount(commands[0]!.blobs[0]!.buffer, "MetadataCatalog")).toBe(3)
    expect([...commands[0]!.blobs[0]!.buffer.values()]).toContain(BulkPropertyType.Null)
  })

  it("разбивает только конфликтующие типы одного свойства", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "1", optional: "x" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.blobs).toHaveLength(2)
    expect(stats.nodeBlobs).toBe(2)
  })

  it("сбрасывает token до превышения maxTokenBytes", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", text: "x".repeat(40) } },
          { id: 1, logicalId: "B", props: { id: "B", text: "y".repeat(40) } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 80,
      maxCommandBytes: 4096,
    })

    expect(commands[0]!.blobs).toHaveLength(2)
    expect(stats.nodeBlobs).toBe(2)
  })

  it("кодирует edge token с union-схемой свойств", () => {
    const edgeGroups: BulkEdgeGroup[] = [
      {
        kind: "VALUE",
        edges: [
          { src: 0, tgt: 1, props: { yaml: "Реквизит" } },
          { src: 1, tgt: 0, props: { index: 2 } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups: [], edgeGroups }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.edgeCount).toBe(2)
    expect(commands[0]!.blobs).toHaveLength(1)
    expect(stats.edgeBlobs).toBe(1)
    expect(readPropertyCount(commands[0]!.blobs[0]!.buffer, "VALUE")).toBe(2)
    expect([...commands[0]!.blobs[0]!.buffer.values()]).toContain(BulkPropertyType.Null)
  })
})
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts
```

Expected: FAIL because `bulk/stream` does not exist.

- [ ] **Step 3: Implement stream builder**

Create `packages/graph/src/bulk/stream.ts`:

```ts
import { bulkValueSignature, encodeBulkHeader, encodeBulkValue, type BulkProperties, type BulkValue } from "./encoder"
import type { BulkCommand, BulkWriteBlob } from "./write"
import type { BulkEdgeGroup, BulkEdgeRecord, BulkNodeGroup, BulkNodeRecord } from "./plan"

export interface BulkTokenLimits {
  maxTokenBytes: number
  maxCommandBytes: number
}

export interface BulkTokenStats {
  commands: number
  nodeBlobs: number
  edgeBlobs: number
  totalBytes: number
}

export interface BulkTokenBuildResult {
  commands: BulkCommand[]
  stats: BulkTokenStats
}

type EntityKind = "node" | "edge"
type RecordWithProps = BulkNodeRecord | BulkEdgeRecord

interface SchemaBucket<T extends RecordWithProps> {
  propertyNames: string[]
  records: T[]
}

const DEFAULT_LIMITS: BulkTokenLimits = {
  maxTokenBytes: 64_000_000,
  maxCommandBytes: 64_000_000,
}

const commandBytes = (command: BulkCommand): number =>
  command.blobs.reduce((sum, blob) => sum + blob.buffer.byteLength, 0)

const propertyTypeKey = (props: BulkProperties, propertyNames: readonly string[]): string =>
  propertyNames
    .map((name) => {
      const value = props[name]
      return value === undefined || value === null ? `${name}:missing` : `${name}:${bulkValueSignature(value)}`
    })
    .join("|")

const nonNullPropertyNames = (records: readonly RecordWithProps[]): string[] =>
  [...new Set(records.flatMap((record) =>
    Object.entries(record.props)
      .filter(([, value]) => value !== null)
      .map(([name]) => name),
  ))].sort((a, b) => a.localeCompare(b))

const bucketByConflictingTypes = <T extends RecordWithProps>(records: readonly T[]): SchemaBucket<T>[] => {
  const propertyNames = nonNullPropertyNames(records)
  const buckets = new Map<string, T[]>()

  for (const record of records) {
    const key = propertyTypeKey(record.props, propertyNames)
      .replace(/:missing/g, ":*")
    const bucket = buckets.get(key)
    if (bucket === undefined) buckets.set(key, [record])
    else bucket.push(record)
  }

  return [...buckets.values()].map((bucketRecords) => ({
    records: bucketRecords,
    propertyNames: nonNullPropertyNames(bucketRecords),
  }))
}

const encodeNodeRecord = (record: BulkNodeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat(propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)))

const uint64 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigUInt64LE(BigInt(value), 0)
  return buffer
}

const encodeEdgeRecord = (record: BulkEdgeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    uint64(record.src),
    uint64(record.tgt),
    ...propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)),
  ])

const createEmptyCommand = (begin: boolean): BulkCommand => ({
  begin,
  nodeCount: 0,
  edgeCount: 0,
  blobs: [],
})

export const buildBulkTokenCommands = (
  input: { nodeGroups: readonly BulkNodeGroup[]; edgeGroups: readonly BulkEdgeGroup[] },
  limits: Partial<BulkTokenLimits> = {},
): BulkTokenBuildResult => {
  const effective = { ...DEFAULT_LIMITS, ...limits }
  const commands: BulkCommand[] = []
  const stats: BulkTokenStats = { commands: 0, nodeBlobs: 0, edgeBlobs: 0, totalBytes: 0 }
  let current = createEmptyCommand(true)

  const flushCommand = (): void => {
    if (current.blobs.length === 0) return
    commands.push(current)
    current = createEmptyCommand(false)
  }

  const appendBlob = (blob: BulkWriteBlob): void => {
    if (blob.buffer.byteLength > effective.maxTokenBytes) {
      throw new Error(`GRAPH.BULK token ${blob.name} is ${blob.buffer.byteLength} bytes, limit is ${effective.maxTokenBytes} bytes`)
    }
    if (current.blobs.length > 0 && commandBytes(current) + blob.buffer.byteLength > effective.maxCommandBytes) {
      flushCommand()
    }
    current.blobs.push(blob)
    stats.totalBytes += blob.buffer.byteLength
    if (blob.kind === "node") {
      current.nodeCount += blob.count
      stats.nodeBlobs += 1
    } else {
      current.edgeCount += blob.count
      stats.edgeBlobs += 1
    }
  }

  const appendRecords = <T extends RecordWithProps>(
    kind: EntityKind,
    name: string,
    records: readonly T[],
    encode: (record: T, propertyNames: readonly string[]) => Buffer,
  ): void => {
    for (const bucket of bucketByConflictingTypes(records)) {
      let rows: Buffer[] = []
      let tokenBytes = encodeBulkHeader(name, bucket.propertyNames).byteLength

      const flushToken = (): void => {
        if (rows.length === 0) return
        const header = encodeBulkHeader(name, bucket.propertyNames)
        appendBlob({ kind, name, count: rows.length, buffer: Buffer.concat([header, ...rows]) })
        rows = []
        tokenBytes = header.byteLength
      }

      for (const record of bucket.records) {
        const row = encode(record, bucket.propertyNames)
        if (rows.length > 0 && tokenBytes + row.byteLength > effective.maxTokenBytes) flushToken()
        rows.push(row)
        tokenBytes += row.byteLength
      }
      flushToken()
    }
  }

  for (const group of input.nodeGroups) {
    appendRecords("node", group.label, group.nodes, encodeNodeRecord)
  }
  for (const group of input.edgeGroups) {
    appendRecords("edge", group.kind, group.edges, encodeEdgeRecord)
  }
  flushCommand()
  stats.commands = commands.length
  return { commands, stats }
}
```

- [ ] **Step 4: Run stream tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/stream.ts packages/graph/tests/bulk/stream.test.ts
git commit -m "feat: :sparkles: строить loader-style bulk tokens"
```

---

## Task 3: Wire Streaming Builder Into Bulk Replace

**Files:**
- Modify: `packages/graph/src/bulk/replaceGraphBulk.ts`
- Modify: `packages/graph/src/bulk/write.ts`
- Modify: `packages/graph/tests/bulk/write.test.ts`
- Modify: `packages/graph/tests/updateGraph.test.ts`

- [ ] **Step 1: Add writer stats test**

Append to `packages/graph/tests/bulk/write.test.ts`:

```ts
it("возвращает статистику отправленных команд", async () => {
  const result = await writeBulkCommands(
    {} as GraphConnection,
    [{
      begin: true,
      nodeCount: 2,
      edgeCount: 0,
      blobs: [{ kind: "node", name: "A", count: 2, buffer: Buffer.from("xx") }],
    }],
  )

  expect(result).toEqual({ commands: 1, nodeBlobs: 1, edgeBlobs: 0, totalBytes: 2 })
})
```

- [ ] **Step 2: Run writer test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/write.test.ts
```

Expected: FAIL because `writeBulkCommands` returns `void`.

- [ ] **Step 3: Return stats from writer**

Modify `packages/graph/src/bulk/write.ts`:

```ts
export interface BulkWriteStats {
  commands: number
  nodeBlobs: number
  edgeBlobs: number
  totalBytes: number
}
```

Change signature:

```ts
export const writeBulkCommands = async (
  conn: GraphConnection,
  commands: readonly BulkCommand[],
  opts: BulkWriteOptions = {},
): Promise<BulkWriteStats> => {
```

Before sending:

```ts
const stats: BulkWriteStats = {
  commands: commands.length,
  nodeBlobs: commands.reduce((sum, command) => sum + command.blobs.filter((blob) => blob.kind === "node").length, 0),
  edgeBlobs: commands.reduce((sum, command) => sum + command.blobs.filter((blob) => blob.kind === "edge").length, 0),
  totalBytes: commands.reduce((sum, command) => sum + command.blobs.reduce((inner, blob) => inner + blob.buffer.byteLength, 0), 0),
}
```

At the end:

```ts
return stats
```

- [ ] **Step 4: Replace eager blobs in replaceGraphBulk**

Modify `packages/graph/src/bulk/replaceGraphBulk.ts` imports:

```ts
import { buildBulkTokenCommands } from "./stream"
```

Remove imports:

```ts
import { encodeEdgeBlobs, encodeNodeBlobs } from "./encoder"
import { buildBulkCommands } from "./write"
```

Replace node/edge blob construction with:

```ts
const { commands, stats } = buildBulkTokenCommands({
  nodeGroups: plan.nodeGroups,
  edgeGroups: plan.edgeGroups,
}, {
  maxTokenBytes: opts.maxBlobBytes,
  maxCommandBytes: opts.maxCommandBytes,
})

if (process.env["DEBUG"]) {
  console.log(`bulkCommands      ${stats.commands}`)
  console.log(`bulkNodeBlobs     ${stats.nodeBlobs}`)
  console.log(`bulkEdgeBlobs     ${stats.edgeBlobs}`)
  console.log(`bulkBytes         ${stats.totalBytes}`)
}
```

Keep:

```ts
await report("bulkWrite", opts.onProgress, async () => {
  await writeBulkCommands(conn, commands)
  await query(conn, "MATCH (n) WHERE n.id IS NOT NULL AND NOT n:File SET n:GraphNode")
})
```

- [ ] **Step 5: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/bulk/encoder.test.ts tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/graph/src/bulk/replaceGraphBulk.ts packages/graph/src/bulk/write.ts packages/graph/tests/bulk/write.test.ts packages/graph/tests/updateGraph.test.ts
git commit -m "perf: :zap: подключить loader-style bulk tokens"
```

---

## Task 4: Integration Equivalence for Optional Properties

**Files:**
- Modify: `packages/graph/tests/integration/updateGraph.integration.test.ts`

- [ ] **Step 1: Strengthen integration expectations**

In `packages/graph/tests/integration/updateGraph.integration.test.ts`, in the replace snapshot test, ensure the fixture includes:

```ts
{ id: "A", label: "MetadataCatalog", props: { name: "A", p_hierarchical: true, p_ratio: 1.5 } },
{ id: "B", label: "MetadataAttribute", props: { name: "B", p_values: ["x", "y"] } },
```

Ensure `readSnapshot` returns:

```ts
n.p_hierarchical AS p_hierarchical,
n.p_values AS p_values,
n.p_ratio AS p_ratio
```

Expected nodes:

```ts
[
  { id: "A", labels: ["GraphNode", "MetadataCatalog"], name: "A", p_hierarchical: true, p_values: null, p_ratio: 1.5 },
  { id: "B", labels: ["GraphNode", "MetadataAttribute"], name: "B", p_hierarchical: null, p_values: ["x", "y"], p_ratio: null },
]
```

- [ ] **Step 2: Run integration test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS. This confirms `NULL` placeholders behave like absent properties in result projection.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/graph/tests/integration/updateGraph.integration.test.ts
git commit -m "test: :white_check_mark: проверить optional bulk свойства"
```

---

## Task 5: Verification and ERP Measurement

**Files:**
- No source changes expected.

- [ ] **Step 1: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/bulk/encoder.test.ts tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run focused integration test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS.

- [ ] **Step 4: Ensure ERP YAML project exists**

Run:

```bash
test -d /private/tmp/erp_nkdk && du -sh /private/tmp/erp_nkdk
```

Expected: directory exists and is around `2.2G`.

- [ ] **Step 5: Start clean FalkorDB**

Run:

```bash
docker run -d --rm --name nkdk-falkordb-bulk-measure -p 6379:6379 falkordb/falkordb:latest
```

Expected: container id.

- [ ] **Step 6: Measure loader-style bulk path**

Run:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Expected output includes:

```text
bulkCommands      <number>
bulkNodeBlobs     <number>
bulkEdgeBlobs     <number>
bulkBytes         <number>
bulkWrite         done — ... мс
чтение файлов    — ... мс — 16808 шт.
buildGraph       — ... мс — узлов ..., рёбер ...
updateGraph      — ... мс
итого            — ... мс
```

Success criteria:

- `bulkNodeBlobs + bulkEdgeBlobs < 3274`;
- total time is below previous direct bulk attempts;
- target time is below current Cypher replace baseline around `312s`.

- [ ] **Step 7: Verify counts**

Run:

```bash
docker exec nkdk-falkordb-bulk-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH (n) RETURN count(n)" --compact
docker exec nkdk-falkordb-bulk-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH ()-[r]->() RETURN count(r)" --compact
```

Expected counts match CLI output for created graph. For `/private/tmp/erp_nkdk`, use graph name `nkdk_dba85d4fb493`.

- [ ] **Step 8: Stop FalkorDB**

Run:

```bash
docker stop nkdk-falkordb-bulk-measure
```

Expected: `nkdk-falkordb-bulk-measure`.

---

## Self-Review Notes

- Spec coverage: union schema, `NULL` placeholders, token limits, command writer, integration equivalence, and ERP measurement are all covered.
- Type consistency: `maxBulkBlobBytes` remains public and maps to `maxTokenBytes`; internal types use token naming.
- Scope: this plan implements loader-style streaming tokens only. Sparse-label bucketing is excluded from this pass and must be designed separately after measurement.
