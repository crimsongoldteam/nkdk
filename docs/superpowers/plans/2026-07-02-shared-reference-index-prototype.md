# Shared Reference Index Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an experimental SharedArrayBuffer-backed reference index for full project validation to reduce worker snapshot copying.

**Architecture:** Build a compact read-only index from object/member/value entries in the main thread, pass only a SharedArrayBuffer descriptor to workers, and keep pending references partitioned as normal messages. The old JS snapshot path remains available for partial validation and fallback.

**Tech Stack:** TypeScript, Node.js worker_threads, SharedArrayBuffer, Vitest.

---

### Task 1: Shared Index Module

**Files:**
- Create: `packages/core/metadata/validation/sharedProjectReferenceIndex.ts`
- Test: `packages/core/metadata/validation/sharedProjectReferenceIndex.test.ts`

- [ ] Write tests that compare shared index lookup/filter behavior with the existing reference index for object, member, value, conflict, and member filters.
- [ ] Implement a compact binary format with a shared byte buffer, sorted entries, string offsets, section kind, conflict flag, and compact filter details.
- [ ] Expose `createSharedProjectReferenceSnapshot` and `createSharedProjectReferenceIndex`.

### Task 2: Worker Integration

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`

- [ ] Add `sharedReferenceSnapshot` to the second pass worker message.
- [ ] In full validation second pass, build the shared snapshot once in the pool and send the descriptor to each worker.
- [ ] In worker second pass, prefer shared index when present; otherwise use the existing JS snapshot path.
- [ ] Keep old `referenceSnapshot` path for partial/fallback behavior.

### Task 3: Verification

**Files:**
- Modify as needed only if tests reveal integration gaps.

- [ ] Run the focused shared index tests and watch them fail before implementation.
- [ ] Run focused validation tests after implementation.
- [ ] Run `/Users/nikita/git/nkdk-yaml` validation with profile and compare `secondPassWall`.
- [ ] Run full `pnpm test`.
