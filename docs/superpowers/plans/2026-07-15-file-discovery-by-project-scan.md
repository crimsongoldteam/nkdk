# File Discovery By Project Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace metadata project discovery with one filesystem scan that classifies real project files and supports a YAML-only mode for validation.

**Architecture:** `discoverMetadataProjectResources` will scan actual files under the YAML project root, call `classifyMetadataProjectPath(projectPath)` for each relevant file, then filter by `include: "all" | "yaml"`. Validation will request YAML-only discovery through `prepareYamlProjectWithPool`, while synchronization and general operations keep the default all-files behavior.

**Tech Stack:** TypeScript, Node.js `fs`/`path`, Vitest, existing `rules.ts`-based project resource classification.

## Global Constraints

- Keep `rules.ts` semantics as the source of project structure by continuing to use `classifyMetadataProjectPath`.
- Do not read YAML during discovery.
- Unknown files are ignored, not reported as diagnostics.
- `include: "all"` is the default and must keep synchronization/resource-file compatibility.
- `include: "yaml"` is used by validation and must not return modules, images, templates, or other non-YAML resource files.
- Recursive `Свойства.yaml` must be found through the common scan, not through a separate second traversal.
- Before closing the implementation, run `pnpm test` from the repository root.

---

## File Structure

- Modify: `packages/core/metadata/project/resources.ts`
  - Add `MetadataProjectResourceInclude`.
  - Replace candidate-path discovery with recursive project file scanning.
  - Keep `classifyMetadataProjectPath`, `resolveMetadataProjectResource`, and path safety behavior.
- Modify: `packages/core/metadata/project/resources.test.ts`
  - Add tests for `include: "yaml"`, `include: "all"`, unknown files, and recursive `Свойства.yaml`.
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
  - Add `resourceInclude?: MetadataProjectResourceInclude` to `prepareYamlProject` and `prepareYamlProjectWithPool`.
  - Pass the option to `discoverMetadataProjectResources`.
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`
  - Add a test proving YAML-only preparation excludes `resourceFiles`.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Pass `resourceInclude: "yaml"` when validation prepares the YAML project.
- Modify: `packages/core/metadata/validation/projectFiles.ts`
  - Pass `include: "yaml"` to the helper that returns validation project files.

---

### Task 1: Add Discovery Include Tests

**Files:**
- Modify: `packages/core/metadata/project/resources.test.ts`

**Interfaces:**
- Consumes: existing `discoverMetadataProjectResources(projectDir)`.
- Produces: failing tests for `discoverMetadataProjectResources(projectDir, { include: "yaml" })` and the default all-files mode.

- [ ] **Step 1: Add resource and YAML-only discovery tests**

Add these tests inside `describe("metadata project resources", () => { ... })` after `discovers existing metadata YAML resources`:

```ts
  it("discovers YAML and resource files by default", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/МодульМенеджера.bsl")
    touchProjectFile(projectDir, "Справочник/Товары/ignored.txt")

    const resources = discoverMetadataProjectResources(projectDir)

    expect(resources.map((file) => file.projectPath)).toEqual([
      "Справочник/Товары/МодульМенеджера.bsl",
      "Справочник/Товары/Свойства.yaml",
    ])
    expect(resources.map((file) => file.kind)).toEqual(["resource", "yaml"])
  })

  it("discovers only YAML project files when include is yaml", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/МодульМенеджера.bsl")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")

    const resources = discoverMetadataProjectResources(projectDir, { include: "yaml" })

    expect(resources.map((file) => file.projectPath)).toEqual([
      "Конфигурация.yaml",
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
    ])
    expect(resources.every((file) => file.kind === "yaml")).toBe(true)
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/core test -- packages/core/metadata/project/resources.test.ts
```

Expected: FAIL because `discoverMetadataProjectResources` does not accept the second argument yet.

- [ ] **Step 3: Do not change implementation in this task**

Leave the implementation for Task 2.

---

### Task 2: Replace Candidate Discovery With Project Scan

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`

**Interfaces:**
- Consumes: `classifyMetadataProjectPath(projectPath: string): MetadataProjectResourceRef | undefined`.
- Produces:
  - `export type MetadataProjectResourceInclude = "all" | "yaml"`
  - `export interface MetadataProjectResourceDiscoveryOptions { include?: MetadataProjectResourceInclude }`
  - `discoverMetadataProjectResources(projectDir: string, options?: MetadataProjectResourceDiscoveryOptions): MetadataProjectResourceRef[]`

- [ ] **Step 1: Add the new discovery option types**

In `packages/core/metadata/project/resources.ts`, add after `export type MetadataProjectResourceKind = "yaml" | "resource"`:

```ts
export type MetadataProjectResourceInclude = "all" | "yaml"

export interface MetadataProjectResourceDiscoveryOptions {
  include?: MetadataProjectResourceInclude
}
```

- [ ] **Step 2: Replace `discoverMetadataProjectResources` implementation**

Replace the whole current `discoverMetadataProjectResources` function with:

```ts
export function discoverMetadataProjectResources(
  projectDir: string,
  options: MetadataProjectResourceDiscoveryOptions = {}
): MetadataProjectResourceRef[] {
  const projectRoot = resolve(projectDir)
  const include = options.include ?? "all"
  const resources: MetadataProjectResourceRef[] = []

  for (const filePath of listProjectFiles(projectRoot)) {
    if (include === "yaml" && !filePath.endsWith(".yaml")) continue

    const projectPath = toProjectSeparators(relative(projectRoot, filePath))
    const resource = classifyMetadataProjectPath(projectPath)
    if (!resource) continue
    if (include === "yaml" && resource.kind !== "yaml") continue

    resources.push({ ...resource, absolutePath: filePath })
  }

  return resources.sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}
```

- [ ] **Step 3: Add a recursive file scanner**

Add this helper near the bottom of `resources.ts`, before `toProjectSeparators`:

```ts
function listProjectFiles(projectRoot: string): string[] {
  const files: string[] = []
  collectProjectFiles(projectRoot, files)
  return files
}

function collectProjectFiles(currentDir: string, files: string[]): void {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      collectProjectFiles(entryPath, files)
      continue
    }
    if (entry.isFile()) files.push(entryPath)
  }
}
```

- [ ] **Step 4: Remove obsolete candidate-discovery helpers**

Delete these functions from `resources.ts` because discovery no longer enumerates expected paths:

```ts
collectExistingProjectResource
collectExistingDescriptorResources
collectExistingResourcePattern
collectNestedRecursivePropertyResources
collectNestedRecursivePropertyResourcesFromDir
isExistingDirectory
isExistingFile
```

Also remove unused imports and values:

```ts
existsSync
statSync
metadataProjectSpecs
describeMetadataRuleProjectResources // keep only if still needed by classifyMetadataProjectPath
```

Keep imports that are still used by classification:

```ts
import { readdirSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import { describeMetadataRuleProjectResources, matchProjectPattern } from "./ruleResources"
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm --filter @nkdk/core test -- packages/core/metadata/project/resources.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit only the discovery implementation and resource tests:

```bash
git add packages/core/metadata/project/resources.ts packages/core/metadata/project/resources.test.ts
git commit -m "perf: :zap: ускорить поиск файлов проекта"
```

---

### Task 3: Add YAML-Only Preparation Option

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Consumes: `MetadataProjectResourceInclude` and `discoverMetadataProjectResources(projectDir, options)`.
- Produces: `resourceInclude?: MetadataProjectResourceInclude` on `prepareYamlProject` and `prepareYamlProjectWithPool`.

- [ ] **Step 1: Write the failing preparation test**

In `packages/core/metadata/project/preparedYamlProject.test.ts`, add this test after `returns resource file descriptions without reading resource content`:

```ts
  it("can prepare only YAML project files for validation", async () => {
    const projectDir = createProject()
    writeFileSync(join(projectDir, "Справочник", "Товары", "МодульМенеджера.bsl"), "Процедура Тест()\nКонецПроцедуры\n")

    const result = await prepareYamlProject({
      projectDir,
      context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
      concurrency: 1,
      includeYamlData: false,
      resourceInclude: "yaml",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    expect(result.project.files.map((file) => file.projectPath)).toEqual(["Справочник/Товары/Свойства.yaml"])
    expect(result.project.resourceFiles).toEqual([])
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/core test -- packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because `resourceInclude` is not part of `prepareYamlProject` params yet.

- [ ] **Step 3: Add `resourceInclude` to preparation signatures**

In `packages/core/metadata/project/preparedYamlProject.ts`, update the import:

```ts
import { discoverMetadataProjectResources, type MetadataProjectResourceInclude } from "./resources"
```

Update both parameter objects:

```ts
export async function prepareYamlProject(params: {
  projectDir: string
  context: ConfigurationContext
  concurrency?: number
  includeYamlData?: boolean
  resourceInclude?: MetadataProjectResourceInclude
}): Promise<PreparedYamlProjectResult> {
```

```ts
export async function prepareYamlProjectWithPool(params: {
  projectDir: string
  context: ConfigurationContext
  pool: PreparedYamlProjectWorkerPool
  includeYamlData?: boolean
  resourceInclude?: MetadataProjectResourceInclude
}): Promise<PreparedYamlProjectResult> {
```

- [ ] **Step 4: Pass the option to discovery**

In `prepareYamlProjectWithPool`, replace:

```ts
discoverMetadataProjectResources(projectDir).filter((resource) => resource.absolutePath !== undefined)
```

with:

```ts
discoverMetadataProjectResources(projectDir, { include: params.resourceInclude ?? "all" }).filter(
  (resource) => resource.absolutePath !== undefined
)
```

- [ ] **Step 5: Run the focused preparation test**

Run:

```bash
pnpm --filter @nkdk/core test -- packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: добавить yaml-фильтр подготовки проекта"
```

---

### Task 4: Use YAML-Only Discovery In Validation Paths

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`

**Interfaces:**
- Consumes: `prepareYamlProjectWithPool({ resourceInclude: "yaml" })`.
- Produces: validation preparation that does not discover non-YAML resource files.

- [ ] **Step 1: Update full validation preparation**

In `packages/core/metadata/validation/validateProject.ts`, replace:

```ts
const prepared = await prepareYamlProjectWithPool({ projectDir, context, pool, includeYamlData: false })
```

with:

```ts
const prepared = await prepareYamlProjectWithPool({
  projectDir,
  context,
  pool,
  includeYamlData: false,
  resourceInclude: "yaml",
})
```

- [ ] **Step 2: Update validation project-file helper**

In `packages/core/metadata/validation/projectFiles.ts`, replace the discovery call with:

```ts
  return discoverMetadataProjectResources(projectDir, { include: "yaml" }).flatMap((resource) => {
```

- [ ] **Step 3: Run focused validation tests**

Run:

```bash
pnpm --filter @nkdk/core test -- packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectFiles.ts
git commit -m "perf: :zap: ограничить discovery validation yaml-файлами"
```

---

### Task 5: Verify Compatibility And Profile

**Files:**
- No code changes expected.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified behavior and measured profile for `/Users/nikita/git/nkdk-yaml`.

- [ ] **Step 1: Build core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS.

- [ ] **Step 2: Run validation profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected: PASS and the table still contains `Поиск файлов проекта`. Record the new time for that row in the final implementation report.

- [ ] **Step 3: Run all tests**

Run from `/Users/nikita/git/nkdk/.worktrees/yaml-common-mechanism-spec`:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Check working tree**

Run:

```bash
git status --short
```

Expected: no unexpected unstaged files. If Task 5 changed no files, do not commit.

---

## Self-Review

- Spec coverage: Task 2 implements one filesystem scan and keeps `classifyMetadataProjectPath`; Task 3 adds the public preparation option; Task 4 applies YAML-only discovery to validation; Task 5 runs build, profile, and full tests.
- Placeholder scan: no `TODO`, `TBD`, or undefined implementation placeholders are used.
- Type consistency: `MetadataProjectResourceInclude`, `MetadataProjectResourceDiscoveryOptions`, and `resourceInclude` names are consistent across tasks.
