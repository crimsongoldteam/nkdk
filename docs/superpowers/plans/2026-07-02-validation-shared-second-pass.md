# Validation Shared Second Pass Implementation Plan

> Historical note: this plan kept a legacy fallback while shared second pass was experimental. The active implementation plan is `2026-07-02-validation-unified-shared-snapshot.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Try replacing full validation second-pass `objectTable` supplement transfer with a SharedArrayBuffer-backed project snapshot, measure the result, and keep the path behind a flag until it is faster than the existing path.

**Architecture:** Extend the existing shared reference index prototype into a `SharedValidationSnapshot` that also contains owner records, field indexes, and file path lookup data. The first implementation stores owner data as UTF-8 JSON inside `SharedArrayBuffer`; this verifies correctness and transfer behavior, but is not the final compact binary owner index.

**Tech Stack:** TypeScript, Node.js `worker_threads`, `SharedArrayBuffer`, Vitest.

---

### Task 1: Shared Owner/Field Snapshot

**Files:**
- Modify: `packages/core/metadata/validation/sharedProjectReferenceIndex.ts`
- Create: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
- Test: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`

- [x] Add tests comparing shared owner lookup with `createOwnerMetadataCacheFromValidationTable`.
- [x] Encode owner keys, file paths, field names, field kinds, type flags, source text, and table/column ranges into a shared JSON owner payload.
- [ ] Replace shared JSON owner payload with compact binary owner/field/file sections.

### Task 2: Shared Owner Cache

**Files:**
- Create: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
- Test: `packages/core/metadata/validation/dataPath/sharedOwnerCache.test.ts`

- [x] Implement `createOwnerMetadataCacheFromSharedValidationSnapshot`.
- [x] Return `OwnerMetadataResult` with `fieldIndex` backed by decoded shared field data.
- [x] Preserve not-found/import-error diagnostics for covered full validation cases.

### Task 3: Worker Second Pass Integration

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`

- [x] Replace second-pass `objectTable` supplement message with `sharedValidationSnapshot` when `NKDK_VALIDATION_SHARED_SECOND_PASS=1`.
- [x] Build owner cache from shared snapshot in workers.
- [x] Keep legacy objectTable supplement fallback by default and for `NKDK_VALIDATION_SHARED_SECOND_PASS=0`.

### Task 4: Verification and Profiling

**Files:**
- Modify tests only if they need new expectations for stats/profile output.

- [x] Run focused shared snapshot and worker tests.
- [x] Run `/Users/nikita/git/nkdk-yaml` validation with shared second pass.
- [x] Run the same validation with `NKDK_VALIDATION_SHARED_SECOND_PASS=0`.
- [ ] Run `pnpm test`.

## Measurement

Shared second pass:

- `summary: 0 error, 0 warning`
- `real 41.41s`
- `secondPassWall=7538.40ms`
- `snapshot=1308.56ms`
- `workerWall=6210.77ms`
- `sharedSnapshotBytes=34543344`
- `sharedOwnerBytes=129265248`

Legacy owner supplement, shared reference index still enabled:

- `summary: 0 error, 0 warning`
- `real 46.04s`
- `secondPassWall=7572.66ms`
- `snapshot=319.54ms`
- `workerWall=7246.51ms`
- `sharedSnapshotBytes=34543344`

Conclusion: wall time for the second pass is effectively unchanged. The shared JSON owner payload removes worker `objectTable` supplements (`supplementRecords=0`, `supplementFilePaths=0`), but building and decoding the 129 MB JSON owner snapshot cancels the transfer win. The next useful step is a compact binary owner/field/file index, not enabling this JSON-backed path by default.
