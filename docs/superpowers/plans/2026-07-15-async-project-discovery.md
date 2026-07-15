# Async Project Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert metadata project discovery to async `fs.promises.readdir` with a hardcoded concurrency limit of `32`.

**Architecture:** `discoverMetadataProjectResources` becomes async and remains the only full-project discovery entrypoint. Single-path helpers stay sync. Callers that enumerate the project are updated to `await`, while prepared YAML project profiling uses `measureAsync` for `Поиск файлов проекта`.

**Tech Stack:** TypeScript, Node.js `fs/promises`, Vitest, existing metadata project discovery and validation-profile tooling.

## Global Constraints

- `discoverMetadataProjectResources` returns `Promise<MetadataProjectResourceRef[]>`.
- `classifyMetadataProjectPath`, `resolveMetadataProjectResource`, and `assertMetadataProjectPathInside` remain sync.
- Directory traversal uses `fs.promises.readdir` with a hardcoded concurrency limit `32`.
- No env/config/autotuning for the limit in this task.
- `include: "yaml"` filters non-`.yaml` files before `classifyMetadataProjectPath`.
- Unknown files remain ignored.
- Directory read errors are propagated.
- Run `pnpm --filter @nkdk/core build`, validation-profile with `--runs 3 --timing`, and full `pnpm test`.

---

## File Structure

- Modify: `packages/core/metadata/project/resources.ts`
  - Replace sync full-project discovery with async discovery.
  - Keep single-file helpers sync.
  - Add private async traversal helpers with concurrency limit `32`.
- Modify: `packages/core/metadata/project/resources.test.ts`
  - Await `discoverMetadataProjectResources` calls.
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
  - Await async discovery through `profiler.measureAsync`.
- Modify: `packages/core/metadata/validation/projectFiles.ts`
  - Make `discoverValidationProjectFiles` async.
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
  - Await `discoverValidationProjectFiles` calls.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Make `validateProjectInProcess` async because full in-process validation uses async discovery.
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
  - Await `discoverValidationProjectFiles`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Make top-level properties discovery async and await it in synchronization.

---

### Task 1: Make Project Discovery Async

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`

**Interfaces:**
- Produces:
  - `discoverMetadataProjectResources(projectDir: string, options?: MetadataProjectResourceDiscoveryOptions): Promise<MetadataProjectResourceRef[]>`
  - private `DISCOVERY_READDIR_CONCURRENCY = 32`

- [ ] **Step 1: Update tests to expect async discovery**

In `packages/core/metadata/project/resources.test.ts`, add `async` to tests that call `discoverMetadataProjectResources` and wrap each call in `await`.

Use these exact replacement patterns:

```ts
it("discovers existing metadata YAML resources", async () => {
  // ...
  const resources = await discoverMetadataProjectResources(projectDir)
})
```

```ts
it("discovers YAML and resource files by default", async () => {
  // ...
  const resources = await discoverMetadataProjectResources(projectDir)
})
```

```ts
it("discovers only YAML project files when include is yaml", async () => {
  // ...
  const resources = await discoverMetadataProjectResources(projectDir, { include: "yaml" })
})
```

```ts
it("discovers properties for every top-level metadata item with YAML directory", async () => {
  // ...
  expect((await discoverMetadataProjectResources(projectDir)).map((file) => file.projectPath)).toEqual(
    dirs.map((dir) => `${dir}/Тест/Свойства.yaml`).sort((left, right) => left.localeCompare(right, "ru"))
  )
})
```

- [ ] **Step 2: Run resource tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle metadata/project/resources.test.ts
```

Expected: FAIL with type/runtime errors because `discoverMetadataProjectResources` is still sync or tests have not all been converted.

- [ ] **Step 3: Change discovery implementation to async**

In `packages/core/metadata/project/resources.ts`, replace:

```ts
import { readdirSync } from "fs"
```

with:

```ts
import { readdir } from "fs/promises"
```

Add near `const PROPERTIES_FILE = "Свойства.yaml"`:

```ts
const DISCOVERY_READDIR_CONCURRENCY = 32
```

Change the function signature:

```ts
export async function discoverMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {}
): Promise<MetadataProjectResourceRef[]> {
```

Inside it, replace:

```ts
for (const filePath of listProjectFiles(projectRoot)) {
  if (include === "yaml" && !filePath.endsWith(".yaml")) continue
```

with:

```ts
for (const filePath of await listProjectFiles(projectRoot, include)) {
```

- [ ] **Step 4: Replace sync traversal helpers**

In `packages/core/metadata/project/resources.ts`, replace `listProjectFiles` and `collectProjectFiles` with:

```ts
async function listProjectFiles(
  projectRoot: string,
  include: MetadataProjectResourceInclude
): Promise<string[]> {
  const files: string[] = []
  const dirs = [projectRoot]
  let active = 0
  let resolveDone!: () => void
  let rejectDone!: (error: unknown) => void
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve
    rejectDone = reject
  })

  const pump = (): void => {
    while (active < DISCOVERY_READDIR_CONCURRENCY && dirs.length > 0) {
      const currentDir = dirs.pop()!
      active++
      readdir(currentDir, { withFileTypes: true }).then(
        (entries) => {
          for (const entry of entries) {
            const entryPath = join(currentDir, entry.name)
            if (entry.isDirectory()) {
              dirs.push(entryPath)
              continue
            }
            if (!entry.isFile()) continue
            if (include === "yaml" && !entryPath.endsWith(".yaml")) continue
            files.push(entryPath)
          }
        },
        (error: unknown) => rejectDone(error)
      ).finally(() => {
        active--
        if (dirs.length === 0 && active === 0) {
          resolveDone()
          return
        }
        pump()
      })
    }
  }

  pump()
  await done
  return files
}
```

- [ ] **Step 5: Run resource tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle metadata/project/resources.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/resources.ts packages/core/metadata/project/resources.test.ts
git commit -m "perf: :zap: ускорить discovery через async readdir"
```

---

### Task 2: Update Project Discovery Consumers

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`

**Interfaces:**
- Consumes: async `discoverMetadataProjectResources`.
- Produces: async `discoverValidationProjectFiles(projectDir: string): Promise<ValidationProjectFile[]>`.

- [ ] **Step 1: Update prepared YAML project discovery profiling**

In `packages/core/metadata/project/preparedYamlProject.ts`, replace:

```ts
const resources = profiler.measure("Подготовка YAML-проекта", "Поиск файлов проекта", {}, () =>
  discoverMetadataProjectResources(projectDir, { include: params.resourceInclude ?? "all" }).filter(
    (resource) => resource.absolutePath !== undefined
  )
)
```

with:

```ts
const resources = await profiler.measureAsync("Подготовка YAML-проекта", "Поиск файлов проекта", {}, async () =>
  (await discoverMetadataProjectResources(projectDir, { include: params.resourceInclude ?? "all" })).filter(
    (resource) => resource.absolutePath !== undefined
  )
)
```

- [ ] **Step 2: Make validation project file discovery async**

In `packages/core/metadata/validation/projectFiles.ts`, change:

```ts
export function discoverValidationProjectFiles(projectDir: string): ValidationProjectFile[] {
  return discoverMetadataProjectResources(projectDir, { include: "yaml" }).flatMap((resource) => {
```

to:

```ts
export async function discoverValidationProjectFiles(projectDir: string): Promise<ValidationProjectFile[]> {
  return (await discoverMetadataProjectResources(projectDir, { include: "yaml" })).flatMap((resource) => {
```

- [ ] **Step 3: Update validation project-file tests**

In `packages/core/metadata/validation/projectFiles.test.ts`, add `async` to tests that call `discoverValidationProjectFiles` and await the result.

Use these forms:

```ts
const files = await discoverValidationProjectFiles(projectDir)
```

```ts
expect((await discoverValidationProjectFiles(projectDir)).map((file) => file.projectPath)).toEqual([...])
```

```ts
await expect(discoverValidationProjectFiles(projectDir)).resolves.toEqual([])
```

- [ ] **Step 4: Update `validateProjectInProcess`**

In `packages/core/metadata/validation/validateProject.ts`, change:

```ts
function validateProjectInProcess(params: ValidateProjectParams): ValidateProjectResult {
```

to:

```ts
async function validateProjectInProcess(params: ValidateProjectParams): Promise<ValidateProjectResult> {
```

Then replace:

```ts
const files =
  params.filePath === undefined
    ? discoverValidationProjectFiles(projectDir)
    : [resolveSingleProjectFile(projectDir, params.filePath)]
```

with:

```ts
const files =
  params.filePath === undefined
    ? await discoverValidationProjectFiles(projectDir)
    : [resolveSingleProjectFile(projectDir, params.filePath)]
```

Existing callers already return or await promises through async paths, so no public `validateProject` signature change is needed.

- [ ] **Step 5: Update operation snapshot**

In `packages/core/metadata/operations/projectSnapshot.ts`, replace:

```ts
for (const resource of discoverValidationProjectFiles(projectDir)) {
```

with:

```ts
for (const resource of await discoverValidationProjectFiles(projectDir)) {
```

- [ ] **Step 6: Update configuration sync resource discovery**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, change:

```ts
function discoverTopLevelPropertiesResources(inputDir: string): MetadataProjectPropertiesYamlRef[] {
```

to:

```ts
async function discoverTopLevelPropertiesResources(inputDir: string): Promise<MetadataProjectPropertiesYamlRef[]> {
```

Then replace:

```ts
return discoverMetadataProjectResources(inputDir).filter(
```

with:

```ts
return (await discoverMetadataProjectResources(inputDir)).filter(
```

And replace:

```ts
for (const resource of discoverTopLevelPropertiesResources(inputDir)) {
```

with:

```ts
for (const resource of await discoverTopLevelPropertiesResources(inputDir)) {
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle metadata/project/preparedYamlProject.test.ts metadata/validation/projectFiles.test.ts metadata/validation/validateProject.test.ts metadata/operations/projectSnapshot.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/operations/projectSnapshot.ts packages/core/metadata/appliedObjects/configuration/syncToXML.ts
git commit -m "perf: :zap: перевести потребителей discovery на async"
```

---

### Task 3: Verify And Profile

**Files:**
- No code changes expected.

**Interfaces:**
- Consumes: async project discovery from Tasks 1-2.
- Produces: measured validation profile and full project verification.

- [ ] **Step 1: Build core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS.

- [ ] **Step 2: Run validation profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 3 --timing
```

Expected: PASS. Record `Cold`, `Warm avg`, `Peak RSS`, and the row `Поиск файлов проекта`.

- [ ] **Step 3: Run all tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Check working tree**

Run:

```bash
git status --short
```

Expected: clean except this plan file if it has not yet been committed.

---

## Self-Review

- Spec coverage: Task 1 implements async `discoverMetadataProjectResources` and the hardcoded limit `32`; Task 2 updates all known consumers from `rg`; Task 3 covers build, profile, and full tests.
- Placeholder scan: no placeholders or deferred implementation notes are present.
- Type consistency: `discoverMetadataProjectResources` and `discoverValidationProjectFiles` both return promises; single-file helpers remain sync.
