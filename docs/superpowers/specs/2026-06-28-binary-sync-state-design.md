# Binary Sync State Design

## Context

Incremental XML sync is still slow even when only one YAML file changes.
The latest ERP profiling on `/Users/nikita/git/nkdk-yaml` and `/Users/nikita/git/round-trip/erp` showed:

- read `.nkdk-sync.yaml`: `0.049s`
- `YAML.parse` for `.nkdk-sync.yaml`: `66.563s`
- hash all YAML project files: `21.718s`
- diff and plan: `0.045s`
- sync one owner XML area: `0.019s`
- write new sync state to a temporary directory: `0.388s`

The current state file is `18.86 MB` and contains `121463` entries.
The main bottleneck is parsing a large YAML mapping, not XML generation.

## Goal

Replace the YAML sync state storage with a faster format for repeated incremental sync.
The target is to make state reading close to sequential file read plus a simple buffer walk, reducing the current `~66s` parse cost to well below one second on the ERP state file.

## Non-Goals

- Do not change the YAML project model.
- Do not change file discovery or hashing in this stage.
- Do not introduce `mtime` or size-based hash skipping yet.
- Do not optimize XML owner export in this stage; it is not the current bottleneck.
- Do not keep long-term compatibility with arbitrary legacy hash formats.

## Format Decision

Use a binary state file, `.nkdk-sync.bin`, as the primary state format.

Binary layout:

```text
magic: 8 bytes = NKDKSYNC
version: uint16 little-endian = 1
entryCount: uint32 little-endian

entry repeated entryCount times:
  pathByteLength: uint32 little-endian
  path: UTF-8 bytes, normalized project path with /
  hash64: uint64 little-endian, raw XXH3-64 value
```

The in-memory representation may remain `Record<string, string>` initially to keep the implementation small.
If profiling shows string hash conversion is still visible, move to an internal `Record<string, bigint>` or `Map<string, bigint>` later.

## Why Not SQLite

SQLite is useful when the state must support selective updates, queries, transactions, or very large random-access datasets.
The current sync algorithm does a full project scan and compares every current hash with the previous state, so it needs a full state read anyway.

For this workload, SQLite adds costs that do not buy much yet:

- opening the database and stepping through rows
- schema and migration handling
- dependency/runtime decisions for Node
- extra failure modes around locked database files
- less transparent state files for debugging

A compact binary file is faster for the current access pattern: one sequential read, one linear parse, one sequential write.
SQLite can be reconsidered when the algorithm stops hashing every file and starts updating state entries selectively.

## Read Strategy

`readXmlSyncState(xmlDir)` should prefer `.nkdk-sync.bin`.
If the binary file is missing, it may read the legacy `.nkdk-sync.yaml` once.
After the next successful sync or `init-sync-state`, `writeXmlSyncState` writes the binary file.

Legacy YAML fallback is only a migration path.
It is acceptable for the first run after upgrading to still pay the YAML parse cost.

## Write Strategy

`writeXmlSyncState(xmlDir, state)` writes `.nkdk-sync.bin`.
The old `.nkdk-sync.yaml` should not be updated by default after migration.

Sorting behavior:

- the binary writer should preserve deterministic path ordering by sorting paths before writing
- the reader should not sort; the file is already deterministic
- `diffSyncState` can keep its current sorting for stable diagnostics

## Error Handling

The binary reader must validate:

- magic header
- supported version
- buffer bounds for every variable-length path
- entry count not exceeding what the buffer can contain
- valid UTF-8 path decoding through Node's buffer decoder

On invalid binary state, fail with a clear error mentioning `.nkdk-sync.bin`.
Do not silently fall back to YAML when a binary file exists but is invalid, because that can hide corruption.

## Testing

Add unit tests for:

- writing and reading `.nkdk-sync.bin`
- preserving paths with Cyrillic characters and `/` separators
- reading legacy `.nkdk-sync.yaml` when binary state is absent
- preferring binary state when both files exist
- rejecting invalid magic/version/truncated entry data
- keeping `diffSyncState` behavior unchanged

Add a larger synthetic performance-oriented test or script, not a strict timing unit test, for `100000+` entries to verify the binary reader is linear and avoids YAML parsing.

## Performance Verification

After implementation, measure on ERP:

- reading state only
- full `sync` with one changed file
- `init-sync-state`

Expected result:

- state read should drop from `~66s` to well below `1s`
- full one-file incremental sync should move closer to `hash all` time, currently about `22s`, plus small overhead
- `init-sync-state` should not regress

## Risks

- Binary files are less inspectable than YAML. Mitigation: keep a small debug helper or document a one-liner/parser for dumping entries if needed.
- The initial implementation may still convert raw `uint64` hashes into hex strings for the existing API. That is acceptable if the parser time is dominated by YAML today.
- First-run migration still pays YAML parse cost. That is acceptable once; future runs use binary.
- A corrupted binary file should fail loudly rather than risk syncing from a stale YAML fallback.

## Self-Review

- No placeholders remain.
- The design answers the SQLite question explicitly.
- Scope is limited to sync state storage format.
- Later `mtime`/size optimization is kept out of this stage.
