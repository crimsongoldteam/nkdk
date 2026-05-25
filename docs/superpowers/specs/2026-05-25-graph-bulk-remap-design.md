# GRAPH.BULK Node Remap Design

## Problem

The current loader-style `GRAPH.BULK` path preserves node record order inside each label so edge `src` and `tgt` ids remain valid. This protects correctness, but it prevents aggressive grouping of compatible node schemas.

On the ERP measurement this produced:

- `bulkCommands`: `1`
- `bulkNodeBlobs`: `4055`
- `bulkEdgeBlobs`: `36`
- `bulkBytes`: `460162054`

The number of blobs is much lower than the previous exact-schema path, but still too high, and `bulkWrite` did not finish faster than the previous Cypher baseline.

## Goal

Allow node tokens to be reordered for better schema grouping while preserving correct edge endpoints.

Success criteria:

- Node blobs decrease materially compared with `4055`.
- Edge endpoints remain correct after node reordering.
- Existing public `BulkPlan` shape stays unchanged.
- Existing replace and bulk integration behavior stays equivalent.

## Design

`stream.ts` will distinguish two ids:

- plan node id: `BulkNodeRecord.id`, assigned by `createBulkPlan`;
- bulk node id: the actual ordinal position of a node record in the final `GRAPH.BULK` node stream.

Node token construction may group compatible records across the whole label instead of preserving the original plan order. When a node record is appended to a token, the builder assigns the next `bulkId` and records:

```ts
nodeIdRemap.set(record.id, bulkId)
```

Edge token construction runs only after all node tokens are built. Before encoding each edge record, it resolves:

```ts
const src = nodeIdRemap.get(edge.src)
const tgt = nodeIdRemap.get(edge.tgt)
```

If either side is missing, bulk command construction fails with a clear error. This indicates an invalid bulk plan, because every edge endpoint should point to a node created in the same bulk stream.

## Grouping Strategy

Node records can return to an earlier compatible bucket. For example:

```text
A value:string
B value:number
C value:string
```

can become:

```text
node blob 1: A, C
node blob 2: B
```

The remap makes this safe:

```text
plan id A -> bulk id 0
plan id C -> bulk id 1
plan id B -> bulk id 2
```

Edges are encoded with bulk ids, not plan ids.

Edge record order does not need the same reordering for correctness. Edge tokens may keep the current grouping strategy, but must encode remapped endpoints.

## Components

### `stream.ts`

Add an internal node remap during `buildBulkTokenCommands`.

Refactor node append flow so the remap is assigned exactly when the final node row order is known. The simplest shape is:

- build node buckets;
- append node rows bucket by bucket;
- assign `bulkId` in append order;
- store `nodeIdRemap`;
- build edge tokens using remapped endpoints.

### Tests

Add focused tests in `packages/graph/tests/bulk/stream.test.ts`:

- reordered compatible node buckets reduce blobs for `A:string, B:number, C:string`;
- edge `src/tgt` bytes point to remapped bulk ids, not original plan ids;
- missing remap for an edge endpoint throws a clear error;
- existing optional-property `NULL` tests remain.

Keep the existing integration replace test as the end-to-end equivalence check.

## Error Handling

If an edge endpoint is missing in `nodeIdRemap`, throw:

```text
Missing GRAPH.BULK node id remap for edge endpoint: <id>
```

The error should happen before sending any `GRAPH.BULK` command.

## Non-Goals

- Do not change `createBulkPlan` public behavior.
- Do not change `BulkNodeRecord.id` assignment.
- Do not add a second ordered/unordered mode.
- Do not change Cypher fallback paths.

## Verification

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts tests/bulk/encoder.test.ts tests/bulk/write.test.ts
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
pnpm test
```

Then measure ERP again:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Compare:

- `bulkNodeBlobs` against `4055`;
- `bulkEdgeBlobs` against `36`;
- `bulkWrite` time against the previous unfinished run and the `~312s` Cypher baseline.
