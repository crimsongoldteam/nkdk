# MCP Persistent Validation Piscina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `nkdk.validate_project` in MCP reuse one long-lived validation worker pool managed by Piscina.

**Architecture:** Core exposes an explicit reusable validation pool handle while preserving the current one-shot `validateProject(...)` behavior for CLI and existing callers. MCP owns one lazy singleton handle for the server process and closes it during server shutdown. Piscina replaces manual `worker_threads` message handling, while worker-local project state is still cleared after each validation run.

**Tech Stack:** TypeScript, Piscina, MCP stdio server, Vitest, existing `@nakidka/core` validation snapshots.

---

### Task 1: Add Piscina dependency and worker task entrypoint

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add Piscina to core dependencies**

Run:

```bash
pnpm --filter @nakidka/core add piscina
```

Expected: `packages/core/package.json` includes `"piscina"` in `dependencies`, and `pnpm-lock.yaml` is updated.

- [ ] **Step 2: Convert validation worker to a Piscina-compatible task**

In `packages/core/metadata/validation/projectValidationWorker.ts`, remove the direct `parentPort` listener and export:

```ts
export type ValidationWorkerTask = Omit<ValidationWorkerMessage, "id">

export default function runValidationWorkerTask(message: ValidationWorkerTask): WorkerResponseWithoutId {
  if (message.kind === "init") return { kind: "initResult", ...runInit(message) }
  if (message.kind === "firstPass") return { kind: "firstPassResult", ...runFirstPass(message) }
  return { kind: "secondPassResult", ...runSecondPass(message) }
}
```

Keep `registerValidationMetadata()` at module top level. Keep `workerStateStatsForTests()` unchanged for direct unit tests.

- [ ] **Step 3: Run focused worker tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: tests may fail until Task 2 rewrites the pool; no syntax/type errors should come from `projectValidationWorker.ts`.

### Task 2: Replace manual worker pool with Piscina and reusable lifecycle

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Replace `Worker` storage with Piscina**

In `projectValidationWorkerPool.ts`, import Piscina:

```ts
import Piscina from "piscina"
```

Create the pool with `minThreads` and `maxThreads` equal to `concurrency`. Use the existing worker file path resolution and TypeScript loader logic for `execArgv`.

- [ ] **Step 2: Keep the public pool interface stable**

Keep:

```ts
export interface ProjectValidationWorkerPool {
  start(context: ConfigurationContext): Promise<ProjectValidationWorkerPoolStartProfile>
  close(): Promise<void>
  size(): number
  runFirstPass(params: FirstPassPoolParams): Promise<FirstPassPoolResult>
  runSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
}
```

Change implementation so `start(context)` creates Piscina only once, computes one `rulesSnapshot`, and sends `concurrency` `init` tasks. A second `start(context)` call on the same pool must be cheap and must not recompile schemas.

- [ ] **Step 3: Preserve worker partition ownership**

Because Piscina does not expose stable worker objects to caller code, store assigned file paths by partition index instead of by `Worker` object:

```ts
const assignedFilePathsByPartition = new Map<number, string[]>()
```

Pass `partitionIndex` through `firstPass` and `secondPass` tasks if needed to keep state on the same Piscina thread. If Piscina cannot guarantee worker affinity by plain `pool.run`, use one Piscina pool per partition with `minThreads: 1`, `maxThreads: 1`; expose them as one logical pool. This preserves the current requirement that second pass reads the `workerState` produced by the same partition's first pass.

- [ ] **Step 4: Add reuse guard test**

In `projectValidationWorkerPool.test.ts`, add a test that creates a pool, calls `start(context)` twice, and asserts the second call does not compile schemas again. The assertion can use a new `startProfile.reused` boolean or an injected test hook if needed.

- [ ] **Step 5: Run focused pool tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: all pool tests pass.

### Task 3: Expose a reusable core validation handle

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/index.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add handle API**

In `validateProject.ts`, export:

```ts
export interface ValidationWorkerPoolHandle {
  validateProject(params: Omit<ValidateProjectParams, "concurrency">): Promise<ValidateProjectResult>
  close(): Promise<void>
  size(): number
}

export function createValidationWorkerPoolHandle(params: { concurrency?: number } = {}): ValidationWorkerPoolHandle
```

The handle owns one `ProjectValidationWorkerPool`. Its `validateProject` method follows the full-project worker path when possible, and falls back to in-process validation for `filePath` or small projects.

- [ ] **Step 2: Preserve one-shot `validateProject(...)`**

Keep `validateProject(params)` as the current API. Internally it can create a temporary handle for the worker path and close it in `finally`, or call a shared helper.

- [ ] **Step 3: Export the handle from core**

In `packages/core/index.ts`, export `createValidationWorkerPoolHandle` and `ValidationWorkerPoolHandle`.

- [ ] **Step 4: Test handle reuse**

Add a test in `validateProject.test.ts` that creates a handle with `concurrency: 2`, validates a full fixture project twice, closes the handle, and asserts both results match one-shot `validateProject({ concurrency: 2 })`.

- [ ] **Step 5: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: all selected tests pass.

### Task 4: Make MCP own one shared validation handle

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Create: `packages/mcp/src/services/validationHandle.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/server.ts`
- Test: `packages/mcp/src/services/validateProject.test.ts`
- Test: `packages/mcp/src/server.test.ts`

- [ ] **Step 1: Extend MCP core API type**

Add to `CoreApi`:

```ts
createValidationWorkerPoolHandle(params?: { concurrency?: number }): {
  validateProject(params: { projectDir: string; filePath?: string }): Promise<{ diagnostics: Diagnostic[] }>
  close(): Promise<void>
  size(): number
}
```

- [ ] **Step 2: Add lazy singleton service**

Create `packages/mcp/src/services/validationHandle.ts`:

```ts
import { loadCoreApi } from "../coreApi"

let handlePromise:
  | Promise<ReturnType<Awaited<ReturnType<typeof loadCoreApi>>["createValidationWorkerPoolHandle"]>>
  | undefined

export async function getValidationHandle() {
  if (handlePromise === undefined) {
    handlePromise = loadCoreApi().then((core) => core.createValidationWorkerPoolHandle())
  }
  return handlePromise
}

export async function closeValidationHandle(): Promise<void> {
  const handle = await handlePromise
  handlePromise = undefined
  await handle?.close()
}

export function resetValidationHandleForTests(): void {
  handlePromise = undefined
}
```

Adjust typing if TypeScript needs a named local interface.

- [ ] **Step 3: Use the handle in validation service**

In `validateProject.ts`, replace `core.validateProject(...)` for normal validation with:

```ts
const handle = await getValidationHandle()
const diagnostics = (await handle.validateProject({
  projectDir,
  ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
})).diagnostics
```

Keep `loadCoreApi()` in the catch block for `ProjectFileSchemaError` checks.

- [ ] **Step 4: Close handle from MCP server**

In `server.ts`, import `closeValidationHandle`. Add a small exported shutdown helper:

```ts
export async function shutdownNkdkMcpServer(): Promise<void> {
  await closeValidationHandle()
}
```

Call it from process signal handlers and from `runStdioServer()` when server exits normally.

- [ ] **Step 5: Test MCP reuse and shutdown**

In `validateProject.test.ts`, mock `createValidationWorkerPoolHandle`, call `validateYamlProject` twice, and assert the factory was called once and `handle.validateProject` twice.

In `server.test.ts`, assert `shutdownNkdkMcpServer()` calls `closeValidationHandle()`.

- [ ] **Step 6: Run MCP tests**

Run:

```bash
pnpm --filter @nakidka/mcp exec vitest run src/services/validateProject.test.ts src/server.test.ts
```

Expected: selected MCP tests pass.

### Task 5: Verify behavior and measure MCP validation

**Files:**
- No code files expected.

- [ ] **Step 1: Run validation test suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: all validation tests pass.

- [ ] **Step 2: Run MCP test suite**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: all MCP tests pass.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 4: Measure MCP validation twice in one server**

Run a small MCP stdio client that calls `nkdk.validate_project` twice against `/Users/nikita/git/nkdk-yaml` with request timeout above 60 seconds.

Expected: both calls return `4006 error, 0 warning`; the second call should avoid worker startup/schema compilation cost and should be faster than the first.

- [ ] **Step 5: Commit implementation**

Commit with:

```bash
git add packages/core packages/mcp package.json pnpm-lock.yaml docs/superpowers/plans/2026-07-06-mcp-persistent-validation-piscina.md
git commit -m "perf: :zap: переиспользовать validation pool в MCP"
```
