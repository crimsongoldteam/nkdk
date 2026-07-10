# Validation Second Pass Worker Context Design

## Problem

Full parallel validation of `/Users/nikita/git/nkdk-yaml` is now correct, but still takes about 53 seconds on a warm run.

The last measured clean run:

```text
summary: 0 error, 0 warning
real 52.89
user 174.58
sys 31.45
```

Earlier validation timing showed that the main remaining cost is inside the two validation passes:

```text
first pass: 30.79 s
second pass: 36.64 s
```

Worker startup is not the bottleneck. File discovery is also not the main bottleneck. The next optimization should focus on the second pass and on repeated preparation and transfer of worker-side validation state.

## Goal

Speed up full project validation without changing diagnostics.

The change must be narrow:

- Optimize only full validation with workers.
- Keep `concurrency: 1` behavior unchanged.
- Keep CLI output and diagnostic format unchanged.
- Do not add metadata-object-specific conditions to common validation layers.
- Keep the optimization measurable with before and after timings.

## Non-goals

- Do not introduce incremental validation in this step.
- Do not change YAML parsing semantics.
- Do not change validation rules or schema export.
- Do not redesign `ValidationObjectTable` owner lookup.
- Do not change public API beyond internal timing instrumentation if needed for measurement.

## Current Flow

Full validation with workers currently works in two phases:

1. The main thread discovers supported YAML files.
2. Worker threads run first pass for their assigned files.
3. The main thread merges object records into `ValidationObjectTable`.
4. The main thread sends a table snapshot to every worker.
5. Each worker restores the table and runs second pass for its assigned files.

Inside the second pass, every worker needs a read-only validation context:

- restored `ValidationObjectTable`;
- `ProjectYamlCache`;
- `OwnerMetadataCache`;
- `ProjectMetadataResolver`.

Today the main thread sends the full merged table snapshot to every worker. Each worker already produced and kept first-pass state for its own files, but it still receives its own object records back from the main thread and restores them again as part of the full snapshot.

This means the large model-bearing object table is cloned across the worker boundary more than needed. With four workers, each worker receives nearly the same full table, including records it already built locally during first pass.

## Design

Introduce a retained worker-side validation context.

During first pass, each worker will build and retain a local `ValidationObjectTable` for the files assigned to that worker:

```ts
interface WorkerValidationState {
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  localTable: ValidationObjectTable
  localObjectRecordFilePaths: Set<string>
}
```

The first-pass response still returns object records to the main thread so the main thread can build the global table and preserve existing orchestration.

During second pass, the main thread sends each worker a supplement snapshot instead of the full table:

- records and file paths produced by other workers;
- global file paths not already present in that worker's local table.

The worker then prepares a second-pass context by merging the supplement into its retained local table:

```ts
interface WorkerSecondPassContext {
  table: ValidationObjectTable
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
  metadataResolver: ProjectMetadataResolver
}
```

`runSecondPass` will be split into small units:

- `createWorkerSecondPassContext(message)` merges the supplement and prepares the read-only context.
- `validateWorkerSecondPassFiles(context, filePaths)` iterates file states and runs `validateProjectFileSecondPass`.
- `createWorkerTableSupplement(globalSnapshot, workerLocalPaths)` prepares the minimal per-worker snapshot in the main thread.

This keeps behavior the same, but avoids sending and restoring each worker's own model records back to itself.

Add lightweight internal timing around worker second pass:

- context preparation time;
- supplement size for each worker;
- per-worker file validation time;
- number of files handled by each worker.

The timing should be available only through existing debug or measurement paths, not in normal CLI output.

## Follow-up Optimization Candidates

After the context boundary is explicit, use measurements to choose the next step.

If context preparation is still expensive, optimize snapshot restoration:

- avoid copying or normalizing the same large arrays more than needed;
- store snapshot data in maps that match worker lookup patterns;
- precompute file path sets in the snapshot.

If file validation is expensive, optimize resolver/cache behavior:

- avoid repeated fallback YAML reads for files already known from first pass;
- memoize repeated metadata target resolutions inside one worker second pass;
- cache owner lookups by normalized owner key.

If worker load is uneven, optimize file assignment separately:

- partition files by estimated cost instead of simple round-robin;
- use file size and kind as the initial cost estimate.

These are separate follow-up changes. The current design prepares the code so the next optimization is driven by measurements instead of guessing.

## Error Handling

No new user-facing diagnostics are introduced.

If context preparation fails, the worker should return the same worker error path used today. If a file state is missing in a worker, current behavior is preserved: that file is skipped because the worker did not produce first-pass state for it.

## Testing

Add focused tests for the split:

- worker first pass retains local table records;
- second pass receives a supplement and still resolves objects from local and remote records;
- worker second pass preserves existing behavior when a file has no state;
- full validation with `concurrency: 2` returns the same diagnostics as `concurrency: 1`.

Run:

```text
pnpm test
```

Measure full validation of `/Users/nikita/git/nkdk-yaml` before and after the change with the same command and a warmed filesystem cache:

```text
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

The implementation is successful only if diagnostics remain clean and the timing data explains whether this step improved total time or identifies the next bottleneck.
