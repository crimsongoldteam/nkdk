# GRAPH.BULK Loader-Style Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make direct `GRAPH.BULK` command sizing match `falkordb-bulk-loader` defaults so large ERP imports are split into bounded commands.

**Architecture:** Keep the current node-id remap and token builder. Change only limit defaults/effective limit resolution and add command splitting by token count.

**Tech Stack:** TypeScript, Vitest, FalkorDB `GRAPH.BULK`, existing `@nakidka/graph` bulk modules.

---

## File Structure

- Modify `packages/graph/src/bulk/stream.ts`: add `maxTokenCount`, use loader-style decimal byte defaults, and use nullish coalescing for effective limits.
- Modify `packages/graph/tests/bulk/stream.test.ts`: add tests for undefined limit fallback and token-count command splitting.
- No changes to `write.ts`: it already sends commands sequentially.
- No changes to CLI flags in this pass.

---

## Task 1: Loader-Style Bulk Limits

**Files:**
- Modify: `packages/graph/src/bulk/stream.ts`
- Modify: `packages/graph/tests/bulk/stream.test.ts`

- [ ] **Step 1: Add failing tests for default fallback and token count**

Append these tests inside `describe("bulk stream", () => { ... })` in `packages/graph/tests/bulk/stream.test.ts`:

```ts
  it("использует default maxCommandBytes, если caller передал undefined", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", text: "x".repeat(40_000_000) } },
          { id: 1, logicalId: "B", props: { id: "B", text: "y".repeat(40_000_000) } },
        ],
      },
    ]

    const { commands } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: undefined,
      maxCommandBytes: undefined,
    })

    expect(commands.length).toBeGreaterThan(1)
  })

  it("сбрасывает command до превышения maxTokenCount", () => {
    const nodeGroups: BulkNodeGroup[] = [
      {
        label: "MetadataCatalog",
        nodes: [
          { id: 0, logicalId: "A", props: { id: "A", value: "one" } },
          { id: 1, logicalId: "B", props: { id: "B", value: 1 } },
          { id: 2, logicalId: "C", props: { id: "C", flag: true } },
        ],
      },
    ]

    const { commands, stats } = buildBulkTokenCommands({ nodeGroups, edgeGroups: [] }, {
      maxTokenBytes: 1024,
      maxCommandBytes: 4096,
      maxTokenCount: 2,
    })

    expect(stats.nodeBlobs).toBe(3)
    expect(commands).toHaveLength(2)
    expect(commands[0]!.blobs).toHaveLength(1)
    expect(commands[1]!.blobs).toHaveLength(2)
  })
```

- [ ] **Step 2: Run stream tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts
```

Expected: FAIL. The first new test fails because `undefined` overwrites defaults. The second new test fails because `maxTokenCount` does not exist yet.

- [ ] **Step 3: Implement loader-style limits in `stream.ts`**

In `packages/graph/src/bulk/stream.ts`, change `BulkTokenLimits` from:

```ts
export interface BulkTokenLimits {
  maxTokenBytes: number
  maxCommandBytes: number
}
```

to:

```ts
export interface BulkTokenLimits {
  maxTokenBytes: number
  maxCommandBytes: number
  maxTokenCount: number
}
```

Change defaults from:

```ts
const DEFAULT_LIMITS: BulkTokenLimits = {
  maxTokenBytes: 64 * 1024 * 1024,
  maxCommandBytes: 64 * 1024 * 1024,
}
```

to:

```ts
const DEFAULT_LIMITS: BulkTokenLimits = {
  maxTokenBytes: 64_000_000,
  maxCommandBytes: 64_000_000,
  maxTokenCount: 1024,
}
```

Change effective limit construction from:

```ts
const effective = { ...DEFAULT_LIMITS, ...limits }
```

to:

```ts
const effective = {
  maxTokenBytes: limits.maxTokenBytes ?? DEFAULT_LIMITS.maxTokenBytes,
  maxCommandBytes: limits.maxCommandBytes ?? DEFAULT_LIMITS.maxCommandBytes,
  maxTokenCount: limits.maxTokenCount ?? DEFAULT_LIMITS.maxTokenCount,
}
```

In `appendBlob`, change:

```ts
if (current.blobs.length > 0 && commandBytes(current) + blob.buffer.byteLength > effective.maxCommandBytes) {
  flushCommand()
}
```

to:

```ts
if (
  current.blobs.length > 0
  && (
    commandBytes(current) + blob.buffer.byteLength >= effective.maxCommandBytes
    || current.blobs.length + 1 >= effective.maxTokenCount
  )
) {
  flushCommand()
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/bulk/encoder.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/graph/src/bulk/stream.ts packages/graph/tests/bulk/stream.test.ts
git commit -m "fix: :bug: применять loader-style bulk limits"
```

---

## Task 2: Verify and Measure

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
docker run -d --rm --name nkdk-falkordb-bulk-limits-measure -p 6379:6379 falkordb/falkordb:latest
```

Expected: container id.

- [ ] **Step 5: Measure ERP bulk replace**

Run:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Expected:

- `bulkCommands` is greater than `1`;
- `bulkNodeBlobs` stays around `82`;
- `bulkEdgeBlobs` stays around `36`;
- `bulkWrite` completes or behaves better than the one-command `485MB` run.

Stop the run if `bulkWrite` exceeds 312 seconds without completing, and record the printed stats.

- [ ] **Step 6: Stop FalkorDB**

Run:

```bash
docker stop nkdk-falkordb-bulk-limits-measure
```

Expected: `nkdk-falkordb-bulk-limits-measure`.

---

## Self-Review Notes

- Spec coverage: the plan covers default fallback, decimal byte limits, token-count splitting, tests, and ERP measurement.
- Type consistency: `BulkTokenLimits.maxTokenCount` is optional to callers through `Partial<BulkTokenLimits>`, so existing call sites remain valid.
- Scope: no QueryBuffer class, CLI flag, schema bucketing, edge remap, or writer behavior changes are included.
