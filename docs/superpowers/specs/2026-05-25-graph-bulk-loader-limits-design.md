# GRAPH.BULK Loader-Style Limits Design

## Problem

The current direct `GRAPH.BULK` builder no longer creates thousands of node blobs after node-id remapping, but the ERP measurement still produced one very large command:

```text
bulkCommands      1
bulkNodeBlobs     82
bulkEdgeBlobs     36
bulkBytes         485456298
```

This differs from `falkordb-bulk-loader`. The loader enforces command-level limits while building tokens:

- `max_buffer_size`: default `64_000_000` bytes per `GRAPH.BULK` query;
- `max_token_size`: default `64_000_000` bytes per binary token;
- `max_token_count`: default `1024` binary tokens per query.

Our `stream.ts` also has a bug: `{ ...DEFAULT_LIMITS, ...limits }` lets `undefined` overwrite defaults, so an omitted `maxCommandBytes` disables the intended command split.

## Goal

Make our direct bulk path match the loader's command sizing behavior closely enough for a fair performance comparison.

Success criteria:

- Omitted limits use defaults instead of becoming `undefined`.
- Default command and token byte limits are `64_000_000`.
- Commands also split on token count, default `1024`.
- `DEBUG=1` ERP measurement produces multiple commands instead of one `~485MB` command.
- Existing remap correctness and integration behavior remain unchanged.

## Design

Extend `BulkTokenLimits` in `packages/graph/src/bulk/stream.ts`:

```ts
export interface BulkTokenLimits {
  maxTokenBytes: number
  maxCommandBytes: number
  maxTokenCount: number
}
```

Use loader-style defaults:

```ts
const DEFAULT_LIMITS: BulkTokenLimits = {
  maxTokenBytes: 64_000_000,
  maxCommandBytes: 64_000_000,
  maxTokenCount: 1024,
}
```

Build `effective` with nullish coalescing instead of object spread:

```ts
const effective = {
  maxTokenBytes: limits.maxTokenBytes ?? DEFAULT_LIMITS.maxTokenBytes,
  maxCommandBytes: limits.maxCommandBytes ?? DEFAULT_LIMITS.maxCommandBytes,
  maxTokenCount: limits.maxTokenCount ?? DEFAULT_LIMITS.maxTokenCount,
}
```

In `appendBlob`, flush before appending when adding the next blob would exceed:

- `maxCommandBytes`;
- `maxTokenCount`.

Keep the existing hard failure if a single blob exceeds `maxTokenBytes` or `maxCommandBytes`.

`writeBulkCommands` remains sequential. This preserves `GRAPH.BULK` ordering after node-id remap.

## Non-Goals

- Do not introduce a full `QueryBuffer` class yet.
- Do not change schema bucketing.
- Do not change CLI flags in this pass.
- Do not change edge remap logic.

## Verification

Add unit coverage in `packages/graph/tests/bulk/stream.test.ts`:

- default limits still split large commands when caller passes `undefined`;
- `maxTokenCount` splits commands even when byte limits are large.

Run:

```bash
pnpm --filter @nakidka/graph exec vitest run tests/bulk/stream.test.ts tests/bulk/write.test.ts tests/bulk/encoder.test.ts
pnpm --filter @nakidka/graph exec vitest run --config vitest.integration.config.ts tests/integration/updateGraph.integration.test.ts -t "replace-режим"
pnpm test
```

Then rerun ERP:

```bash
DEBUG=1 pnpm --filter @nakidka/cli dev update-graph /private/tmp/erp_nkdk --replace --bulk
```

Compare against the previous measurement:

- `bulkCommands` should be greater than `1`;
- `bulkNodeBlobs` should stay around `82`;
- `bulkEdgeBlobs` should stay around `36`;
- `bulkWrite` should complete or at least behave better than the one-command `485MB` run.
