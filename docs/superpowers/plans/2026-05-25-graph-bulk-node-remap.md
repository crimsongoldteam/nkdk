# GRAPH.BULK Node Remap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder node bulk tokens for stronger schema grouping while remapping edge endpoints to the final `GRAPH.BULK` node ordinals.

**Architecture:** Keep `createBulkPlan` unchanged and implement remapping inside `stream.ts`. Node token construction assigns new bulk ids in final emission order, then edge token construction encodes remapped `src` and `tgt` ids.

**Tech Stack:** TypeScript, Vitest, FalkorDB `GRAPH.BULK`, existing `@nakidka/graph` bulk modules.

---

## File Structure

- Modify `packages/graph/src/bulk/stream.ts`: allow node buckets to merge compatible records across the whole group, assign `plan id -> bulk id`, and encode edges with remapped endpoints.
- Modify `packages/graph/tests/bulk/stream.test.ts`: replace the previous order-preservation expectation with remap expectations and add a missing-remap error test.
- No changes to `packages/graph/src/bulk/plan.ts`: `BulkNodeRecord.id`, `BulkEdgeRecord.src`, and `BulkEdgeRecord.tgt` remain plan ids.
- No changes to `packages/graph/src/bulk/replaceGraphBulk.ts`: it already calls `buildBulkTokenCommands`.

---

## Task 1: Specify Remapped Node Order

**Files:**
- Modify: `packages/graph/tests/bulk/stream.test.ts`

- [ ] **Step 1: Replace the order-preservation test with a remap-aware test**

In `packages/graph/tests/bulk/stream.test.ts`, replace:

```ts
  it("сохраняет порядок записей при конфликтующих buckets", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "one" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
          { id: 2, logicalId: "C", props: { id: "C", value: "three" } },
        ],
      },
    ]

    const { commands } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    const blobs = commands[0]!.blobs
    expect(blobs).toHaveLength(3)
    expect(blobs.map((blob) => blob.buffer.toString("utf8").includes("A\0"))).toEqual([true, false, false])
    expect(blobs.map((blob) => blob.buffer.toString("utf8").includes("B\0"))).toEqual([false, true, false])
    expect(blobs.map((blob) => blob.buffer.toString("utf8").includes("C\0"))).toEqual([false, false, true])
  })
```

with:

```ts
const readUInt64 = (buffer: Buffer, offset: number): number =>
  Number(buffer.readBigUInt64LE(offset))

const rowOffset = (buffer: Buffer, name: string, propertyNames: readonly string[]): number =>
  Buffer.byteLength(name) + 1 + 4 + propertyNames.reduce((sum, propertyName) => sum + Buffer.byteLength(propertyName) + 1, 0)

  it("переупорядочивает compatible node buckets и remap-ит edge endpoints", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "one" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
          { id: 2, logicalId: "C", props: { id: "C", value: "three" } },
        ],
      },
    ]
    const edgeGroups: BulkEdgeGroup[] = [
      { kind: "VALUE", edges: [{ src: 1, tgt: 2, props: {} }] },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
    })

    const nodeBlobs = commands[0]!.blobs.filter((blob) => blob.kind === "node")
    const edgeBlob = commands[0]!.blobs.find((blob) => blob.kind === "edge")!
    expect(nodeBlobs).toHaveLength(2)
    expect(nodeBlobs[0]!.buffer.toString("utf8")).toContain("A\0")
    expect(nodeBlobs[0]!.buffer.toString("utf8")).toContain("C\0")
    expect(nodeBlobs[1]!.buffer.toString("utf8")).toContain("B\0")
    expect(stats.nodeBlobs).toBe(2)

    const edgeRowOffset = rowOffset(edgeBlob.buffer, "VALUE", [])
    expect(readUInt64(edgeBlob.buffer, edgeRowOffset)).toBe(2)
    expect(readUInt64(edgeBlob.buffer, edgeRowOffset + 8)).toBe(1)
  })
```

- [ ] **Step 2: Run the stream test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts
```

Expected: FAIL because the current implementation preserves `A, B, C` order and produces `3` node blobs, so the new test expects remapped ids that do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add packages/graph/tests/bulk/stream.test.ts
git commit -m "test: :white_check_mark: описать remap bulk node id"
```

---

## Task 2: Implement Node Id Remap

**Files:**
- Modify: `packages/graph/src/bulk/stream.ts`
- Modify: `packages/graph/tests/bulk/stream.test.ts`

- [ ] **Step 1: Add a missing-remap test**

Append this test to `packages/graph/tests/bulk/stream.test.ts` inside `describe("bulk stream", () => { ... })`:

```ts
  it("падает, если edge endpoint не имеет bulk remap", () => {
    const edgeGroups: BulkEdgeGroup[] = [
      { kind: "VALUE", edges: [{ src: 0, tgt: 1, props: {} }] },
    ]

    expect(() =>
      buildBulkTokenCommands({ nodeGroups: [], edgeGroups }, {
        maxTokenBytes: 1024,
        maxCommandBytes: 4096,
      }),
    ).toThrow("Missing GRAPH.BULK node id remap for edge endpoint: 0")
  })
```

- [ ] **Step 2: Run the stream test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts
```

Expected: FAIL because edge encoding currently uses plan ids directly and does not validate remap.

- [ ] **Step 3: Change node bucketing back to compatible grouping**

In `packages/graph/src/bulk/stream.ts`, replace the current sequential `bucketByConflictingTypes` with compatible-bucket grouping:

```ts
const bucketByConflictingTypes = <T extends RecordWithProps>(records: readonly T[]): SchemaBucket<T>[] => {
  const buckets: SchemaBucket<T>[] = []

  for (const record of records) {
    const entries = propertyTypeEntries(record.props)
    const bucket = buckets.find((candidate) => canAddToBucket(candidate, entries))
    if (bucket !== undefined) {
      addToBucket(bucket, record, entries)
      continue
    }

    const typesByProperty = new Map(entries)
    buckets.push({
      propertyNames: [...typesByProperty.keys()].sort((a, b) => a.localeCompare(b)),
      typesByProperty,
      records: [record],
    })
  }

  return buckets
}
```

- [ ] **Step 4: Add remap-aware edge encoding types**

In `packages/graph/src/bulk/stream.ts`, replace:

```ts
const encodeEdgeRecord = (record: BulkEdgeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    uint64(record.src),
    uint64(record.tgt),
    ...propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)),
  ])
```

with:

```ts
interface RemappedEdgeRecord extends BulkEdgeRecord {
  bulkSrc: number
  bulkTgt: number
}

const encodeEdgeRecord = (record: RemappedEdgeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    uint64(record.bulkSrc),
    uint64(record.bulkTgt),
    ...propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)),
  ])
```

- [ ] **Step 5: Assign bulk ids while appending node rows**

In `buildBulkTokenCommands`, after:

```ts
  let current = createEmptyCommand(true)
```

add:

```ts
  const nodeIdRemap = new Map<number, number>()
  let nextBulkNodeId = 0
```

Then add a helper before `appendRecords`:

```ts
  const encodeNodeRecordWithRemap = (record: BulkNodeRecord, propertyNames: readonly string[]): Buffer => {
    nodeIdRemap.set(record.id, nextBulkNodeId)
    nextBulkNodeId += 1
    return encodeNodeRecord(record, propertyNames)
  }
```

Change the node append loop from:

```ts
  for (const group of input.nodeGroups) {
    appendRecords("node", group.label, group.nodes, encodeNodeRecord)
  }
```

to:

```ts
  for (const group of input.nodeGroups) {
    appendRecords("node", group.label, group.nodes, encodeNodeRecordWithRemap)
  }
```

- [ ] **Step 6: Remap edges before encoding**

In `buildBulkTokenCommands`, add this helper before the edge append loop:

```ts
  const remapEdge = (edge: BulkEdgeRecord): RemappedEdgeRecord => {
    const bulkSrc = nodeIdRemap.get(edge.src)
    if (bulkSrc === undefined) throw new Error(`Missing GRAPH.BULK node id remap for edge endpoint: ${edge.src}`)
    const bulkTgt = nodeIdRemap.get(edge.tgt)
    if (bulkTgt === undefined) throw new Error(`Missing GRAPH.BULK node id remap for edge endpoint: ${edge.tgt}`)
    return { ...edge, bulkSrc, bulkTgt }
  }
```

Change the edge append loop from:

```ts
  for (const group of input.edgeGroups) {
    appendRecords("edge", group.kind, group.edges, encodeEdgeRecord)
  }
```

to:

```ts
  for (const group of input.edgeGroups) {
    appendRecords("edge", group.kind, group.edges.map(remapEdge), encodeEdgeRecord)
  }
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts tests/bulk/encoder.test.ts tests/bulk/write.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit implementation**

Run:

```bash
git add packages/graph/src/bulk/stream.ts packages/graph/tests/bulk/stream.test.ts
git commit -m "perf: :zap: remap bulk node ids"
```

---

## Task 3: Verify Replace Behavior and Measure ERP

**Files:**
- No source changes expected.

- [ ] **Step 1: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --no-isolate --sequence.shuffle tests/bulk/encoder.test.ts tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/updateGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run integration replace test**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Start clean FalkorDB**

Run:

```bash
docker run -d --rm --name nkdk-falkordb-bulk-remap-measure -p 6379:6379 falkordb/falkordb:latest
```

Expected: container id.

- [ ] **Step 5: Measure ERP bulk replace**

Run:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Expected: output includes `bulkCommands`, `bulkNodeBlobs`, `bulkEdgeBlobs`, `bulkBytes`, and a completed `bulkWrite done` line. Record the printed values. `bulkNodeBlobs` must be lower than the previous remap-free measurement of `4055`.

Stop the run if `bulkWrite` exceeds 312 seconds without completing, and record the last printed bulk statistics.

- [ ] **Step 6: Verify counts if the run completes**

Run:

```bash
docker exec nkdk-falkordb-bulk-remap-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH (n) RETURN count(n)" --compact
docker exec nkdk-falkordb-bulk-remap-measure redis-cli GRAPH.QUERY nkdk_dba85d4fb493 "MATCH ()-[r]->() RETURN count(r)" --compact
```

Expected: counts match CLI output for the created graph.

- [ ] **Step 7: Stop FalkorDB**

Run:

```bash
docker stop nkdk-falkordb-bulk-remap-measure
```

Expected: `nkdk-falkordb-bulk-remap-measure`.

---

## Self-Review Notes

- Spec coverage: the plan covers node reorder, remap assignment, edge endpoint remap, missing-remap errors, tests, integration verification, and ERP measurement.
- Type consistency: `BulkNodeRecord.id` and `BulkEdgeRecord.src/tgt` remain plan ids; `RemappedEdgeRecord.bulkSrc/bulkTgt` are the only bulk ids used by edge encoding.
- Scope: this plan does not change `createBulkPlan`, public options, Cypher fallback paths, or writer concurrency.
