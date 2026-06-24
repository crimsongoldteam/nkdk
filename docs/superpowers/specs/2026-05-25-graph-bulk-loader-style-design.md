# Loader-Style GRAPH.BULK Design

## Context

Current direct `--replace --bulk` uses `GRAPH.BULK`, but it creates a separate blob for every exact property schema. On ERP this produced `32742` blobs and `bulkWrite` stayed slower than the existing Cypher replace path even after command pipelining.

The installed `falkordb-bulk-loader` behaves differently:

- each input node label or relation type has one header/schema at a time;
- missing values are encoded as `Type.NULL = 0`;
- a token is flushed only when `max_token_size` or `max_buffer_size` would be exceeded;
- up to 5 `GRAPH.BULK` commands can be in flight.

## Goal

Make our direct `GRAPH.BULK` path closer to `falkordb-bulk-loader` by building large streaming tokens per label/relation type instead of splitting by exact property set.

## Non-Goals

- Do not introduce CSV files.
- Do not call the Python loader from product code.
- Do not change the non-bulk `--replace` path.
- Do not relax typed property encoding for values we already know how to encode.

## Design

### Schema Model

For every node label and every relation type, build a union schema:

- property names are sorted deterministically;
- a property keeps its observed bulk type when all non-null values have the same type;
- if a property has incompatible non-null types, split only that label/relation type into multiple schema buckets by conflicting property type signature;
- absent or null values are encoded as `BulkPropertyType.Null`.

This preserves type safety while eliminating fragmentation caused only by optional fields.

### Streaming Token Builder

Replace eager `encodeNodeBlobs` / `encodeEdgeBlobs` grouping with a loader-style builder:

- start a token with `encodeBulkHeader(name, propertyNames)`;
- append records one by one;
- before appending, check whether the record would exceed `maxTokenBytes` or `maxCommandBytes`;
- flush the current token into the command builder when a limit would be exceeded;
- continue with the same schema header for the next token.

For edges, each record starts with 8-byte unsigned source and target numeric IDs, followed by encoded properties.

### Command Writer

Keep the current `GRAPH.BULK` command shape:

```text
GRAPH.BULK graph [BEGIN] nodeCount edgeCount nodeBlobCount edgeBlobCount ...nodeBlobs ...edgeBlobs
```

Keep concurrency at 5, matching the loader's current queue depth.

Default limits:

- `maxTokenBytes`: `64_000_000`, mirroring loader `max_token_size=64MB`;
- `maxCommandBytes`: `64_000_000`, mirroring loader `max_buffer_size=64MB`;
- `maxBlobBytes` is replaced by `maxTokenBytes` in bulk internals;
- the existing public `maxBulkBlobBytes` option maps to `maxTokenBytes` for compatibility.

### Progress and Measurement

Keep existing phases:

- `bulkPlan`
- `bulkWrite`

Add debug-only counters inside `bulkWrite` output if existing debug plumbing is available:

- number of commands;
- number of node blobs;
- number of edge blobs;
- total binary bytes.

The ERP success target is not just correctness. It should reduce blob count by at least one order of magnitude compared with `32742` and complete faster than the current `--replace` baseline around `312s`.

## Tests

Unit tests:

- optional properties in the same label produce one blob/token with `Null` encoded for missing values;
- conflicting property types still split into separate schema buckets;
- large token builder flushes before exceeding token limit;
- writer keeps at most 5 commands in flight.

Integration test:

- compare normal replace, create replace, and bulk replace on a small graph with optional properties, arrays, strings, booleans, integers, doubles, file links, and edges.

Measurement:

- run ERP `update-graph /private/tmp/erp_nkdk --replace --bulk` on a clean FalkorDB container;
- verify node and relation counts after completion;
- compare timing against previous replace and official loader experiments.

## Risks

- FalkorDB may preserve explicit `NULL` differently from Cypher `SET +=` with missing properties. The integration test must assert the query result for missing optional properties.
- Very wide union schemas can increase bytes per row. The first implementation accepts this trade-off and measures it explicitly before adding sparse-label bucketing.
- Parallel `GRAPH.BULK` commands may still be serialized internally by FalkorDB. This is acceptable; the main expected gain is fewer and larger tokens, not only pipelining.
