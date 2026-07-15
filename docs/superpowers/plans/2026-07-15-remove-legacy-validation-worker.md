# Remove Legacy Validation Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить старый full-project validation worker и перестать запускать полную validation внутри `renameMetadataItem` и `findMetadataReferences`.

**Architecture:** Full validation проекта остается на `preparedYamlProjectWorker`. Операции переименования и поиска ссылок используют `prepareYamlProject` и текущий snapshot с переходным построением `Metadata-модель`, но больше не запускают `validateProject`. Общие типы результатов validation-фаз выносятся из удаляемого старого worker pool в нейтральный файл.

**Tech Stack:** TypeScript, Vitest, pnpm, esbuild, Piscina, текущий `preparedYamlProjectWorker`.

## Global Constraints

- Ответы и commit-сообщения пишутся на русском языке.
- Не изменять XML-фикстуры.
- Общие metadata-слои не должны знать про конкретные metadata-объекты, папки или частные itemType.
- Не вводить общий helper вокруг `Metadata-модель`, например `prepareMetadataOperationContext`.
- Не менять single-file validation: `validateProject({ filePath })` остается отдельным режимом.
- `renameMetadataItem` и `findMetadataReferences` больше не запускают полную validation.
- Ошибки подготовки YAML-проекта остаются фатальными для операций.
- Перед закрытием задачи выполнить `pnpm test` из корня worktree.

---

## File Structure

- `packages/core/metadata/validation/validationWorkerPoolTypes.ts`  
  Новый нейтральный файл с типами `FirstPassPoolResult`, `SecondPassPoolParams`, `SecondPassPoolResult`, `ValidationWorkerPoolStartProfile`.

- `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`  
  Импортирует типы validation-фаз из нового нейтрального файла, а не из старого `projectValidationWorkerPool.ts`.

- `packages/core/metadata/validation/validateProject.ts`  
  Импортирует новый тип `ValidationWorkerPoolStartProfile` для публичного handle и prepared-worker оркестрации.

- `packages/core/metadata/operations/renameItem.ts`  
  Убирает вызов `validateProject` и строит snapshot без `requireValidProject`.

- `packages/core/metadata/operations/findMetadataReferences.ts`  
  Убирает вызов `validateProject` и строит snapshot без `requireValidProject`.

- `packages/core/metadata/operations/renameItem.test.ts`  
  Закрепляет, что операция больше не блокируется полной validation зависимостей.

- `packages/core/metadata/operations/findMetadataReferences.test.ts`  
  Закрепляет, что поиск ссылок больше не блокируется полной validation зависимостей, но синтаксическая ошибка YAML остается ошибкой подготовки.

- `packages/core/metadata/validation/projectValidationWorker.ts`  
  Удаляется.

- `packages/core/metadata/validation/projectValidationWorkerPool.ts`  
  Удаляется.

- `packages/core/metadata/validation/projectValidationWorker.test.ts`  
  Удаляется.

- `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`  
  Удаляется.

- `packages/core/metadata/validation/projectValidationWorker.imports.test.ts`  
  Удаляется.

- `packages/core/scripts/build.mjs`  
  Больше не собирает `dist/projectValidationWorker.js`.

- `packages/mcp/scripts/build.mjs`  
  Больше не собирает `dist/projectValidationWorker.js`.

- `packages/mcp/src/server.test.ts`  
  Обновляет список ожидаемых publish outputs.

- `.agents/architecture.md`  
  Для `Переименование` и `Поиск ссылок` убирает флажки со шагов `Проверка по схеме` и `Проверка зависимостей`.

---

### Task 1: Вынести общие типы validation-фаз

**Files:**
- Create: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface FirstPassPoolResult
  export interface SecondPassPoolParams
  export interface SecondPassPoolResult
  export interface ValidationWorkerPoolStartProfile
  ```
- Consumes existing validation types from:
  ```ts
  ./projectMetadataReferences
  ./projectValidationTypes
  ./types
  ```

- [ ] **Step 1: Write the neutral type file**

Create `packages/core/metadata/validation/validationWorkerPoolTypes.ts`:

```ts
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectMetadataReferences"
import type { ValidationMode, ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import type { Diagnostic } from "./types"

export interface FirstPassPoolResult {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

export interface SecondPassPoolParams {
  projectDir: string
  context: import("../context/types").ConfigurationContext
  mode: ValidationMode
  objectTable: ValidationObjectTableSnapshot
}

export interface SecondPassPoolResult {
  diagnostics: Diagnostic[]
}

export interface ValidationWorkerPoolStartProfile {
  workerInitMs: number
  schemaCompileMs: number
  formSchemaMs: number
  propertiesSchemaMs: number
  rulesSnapshotBytes: number
  reused?: boolean
}
```

- [ ] **Step 2: Update prepared worker pool imports**

In `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`, replace:

```ts
import type {
  FirstPassPoolResult,
  ProjectValidationWorkerPoolStartProfile,
  SecondPassPoolParams,
  SecondPassPoolResult,
} from "../validation/projectValidationWorkerPool"
```

with:

```ts
import type {
  FirstPassPoolResult,
  SecondPassPoolParams,
  SecondPassPoolResult,
  ValidationWorkerPoolStartProfile,
} from "../validation/validationWorkerPoolTypes"
```

Then replace every `ProjectValidationWorkerPoolStartProfile` in this file with `ValidationWorkerPoolStartProfile`.

- [ ] **Step 3: Update validateProject imports**

In `packages/core/metadata/validation/validateProject.ts`, add:

```ts
import type { ValidationWorkerPoolStartProfile } from "./validationWorkerPoolTypes"
```

Use this type if `validateProject.ts` needs an explicit start profile type. Do not import anything from `projectValidationWorkerPool.ts`.

- [ ] **Step 4: Verify no prepared path imports the old pool**

Run:

```bash
rg -n "from \"../validation/projectValidationWorkerPool\"|ProjectValidationWorkerPoolStartProfile" packages/core/metadata/project packages/core/metadata/validation
```

Expected: no matches in prepared worker or `validateProject.ts`. Matches in the old `projectValidationWorkerPool.ts` itself are acceptable until Task 3 deletes it.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/validationWorkerPoolTypes.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/validation/validateProject.ts
git commit -m "refactor: :recycle: вынести типы validation worker"
```

---

### Task 2: Убрать полную validation из metadata-операций

**Files:**
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`

**Interfaces:**
- Consumes:
  ```ts
  prepareYamlProject({ projectDir, context })
  buildMetadataOperationSnapshotFromPreparedProject({ project, context, requireValidProject: false })
  ```
- Produces unchanged public functions:
  ```ts
  renameMetadataItem(params: RenameMetadataItemParams): Promise<MetadataOperationResult>
  findMetadataReferences(params: FindMetadataReferencesParams): Promise<MetadataOperationResult>
  ```

- [ ] **Step 1: Replace existing validation-first rename test**

In `packages/core/metadata/operations/renameItem.test.ts`, replace the test named:

```ts
it("returns validation_failed before invalid_name when project has validation errors", async () => {
```

with:

```ts
it("does not run full validation before checking the requested rename", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
    "Реквизиты:",
    "  СсылкаНаНеизвестный:",
    "    Тип: Справочник.Неизвестный",
  ])

  const result = await renameMetadataItem({
    projectDir,
    path: "Справочник.Товары",
    newName: "Некорректное имя",
  })

  expect(result).toMatchObject({ ok: false, code: "invalid_name" })
  expect(existsSync(join(projectDir, "Миграции"))).toBe(false)
})
```

- [ ] **Step 2: Replace existing validation-first references test**

In `packages/core/metadata/operations/findMetadataReferences.test.ts`, replace the test named:

```ts
it("returns validation_failed before looking for references", async () => {
```

with:

```ts
it("does not run full validation before looking for references", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Синоним: Товары"])
  writeProjectFile(projectDir, "Справочник/Заказы/Свойства.yaml", [
    "Реквизиты:",
    "  СсылкаНаНеизвестный:",
    "    Тип: Справочник.Неизвестный",
  ])

  const result = await findMetadataReferences({
    projectDir,
    path: "Справочник.Товары",
  })

  expect(result).toMatchObject({ ok: true, mode: "plan", blockedReferences: [] })
})
```

- [ ] **Step 3: Add a preparation error test for references**

Add this test to `packages/core/metadata/operations/findMetadataReferences.test.ts` near the new validation test:

```ts
it("still fails on YAML preparation errors", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Синоним: ["])

  const result = await findMetadataReferences({
    projectDir,
    path: "Справочник.Товары",
  })

  expect(result).toMatchObject({ ok: false, code: "validation_failed" })
})
```

- [ ] **Step 4: Run tests to verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/operations/renameItem.test.ts metadata/operations/findMetadataReferences.test.ts
```

Expected: FAIL because both operations still call `validateProject` before their own logic.

- [ ] **Step 5: Remove validation imports and calls**

In `packages/core/metadata/operations/renameItem.ts`, delete:

```ts
import { validateProject } from "../validation/validateProject"
```

Delete this block from `renameMetadataItem`:

```ts
  const validation = await validateProject({ projectDir: params.projectDir, context, concurrency: 1 })
  const errors = validation.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
  if (errors.length > 0) return validationFailure("YAML-проект содержит ошибки validation", errors)
```

Change:

```ts
    requireValidProject: true,
```

to:

```ts
    requireValidProject: false,
```

In `packages/core/metadata/operations/findMetadataReferences.ts`, make the same three changes: remove the `validateProject` import, delete the validation block, and pass `requireValidProject: false`.

- [ ] **Step 6: Run operation tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/operations/renameItem.test.ts metadata/operations/findMetadataReferences.test.ts
```

Expected: PASS.

- [ ] **Step 7: Verify no operation still calls validateProject**

Run:

```bash
rg -n "validateProject\\(" packages/core/metadata/operations
```

Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/operations/renameItem.ts packages/core/metadata/operations/findMetadataReferences.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/findMetadataReferences.test.ts
git commit -m "refactor: :recycle: не валидировать metadata-операции"
```

---

### Task 3: Удалить старый validation worker путь

**Files:**
- Delete: `packages/core/metadata/validation/projectValidationWorker.ts`
- Delete: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Delete: `packages/core/metadata/validation/projectValidationWorker.test.ts`
- Delete: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
- Delete: `packages/core/metadata/validation/projectValidationWorker.imports.test.ts`
- Modify: `packages/core/scripts/build.mjs`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Consumes:
  ```ts
  preparedYamlProjectWorker.ts
  validationWorkerPoolTypes.ts
  projectValidationWorkerSchemaCache.ts
  projectValidationWorkerRegister.mjs
  projectValidationWorkerLoader.mjs
  ```
- Produces: no `projectValidationWorker.js` build output.

- [ ] **Step 1: Update MCP publish output test first**

In `packages/mcp/src/server.test.ts`, change:

```ts
    const outputs = [
      "dist/bin/nkdk-mcp",
      "dist/projectValidationWorker.js",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ]

    expect(outputs).toEqual([
      "dist/bin/nkdk-mcp",
      "dist/projectValidationWorker.js",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ])
```

to:

```ts
    const outputs = [
      "dist/bin/nkdk-mcp",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ]

    expect(outputs).toEqual([
      "dist/bin/nkdk-mcp",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ])
```

- [ ] **Step 2: Run MCP test to verify RED**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts
```

Expected: PASS by itself because this is a documentation-style test. The build scripts still need cleanup in the next steps.

- [ ] **Step 3: Remove legacy worker build from core build**

In `packages/core/scripts/build.mjs`, delete this esbuild block:

```ts
await esbuild.build({
  ...commonOptions,
  entryPoints: ["metadata/validation/projectValidationWorker.ts"],
  outfile: new URL("projectValidationWorker.js", outdir).pathname,
})
```

- [ ] **Step 4: Remove legacy worker build from MCP build**

In `packages/mcp/scripts/build.mjs`, delete this esbuild block:

```ts
await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/validation/projectValidationWorker.ts")],
  outfile: join(distDir, "projectValidationWorker.js"),
})
```

- [ ] **Step 5: Delete old worker files and tests**

Delete:

```bash
packages/core/metadata/validation/projectValidationWorker.ts
packages/core/metadata/validation/projectValidationWorkerPool.ts
packages/core/metadata/validation/projectValidationWorker.test.ts
packages/core/metadata/validation/projectValidationWorkerPool.test.ts
packages/core/metadata/validation/projectValidationWorker.imports.test.ts
```

Use `apply_patch` delete hunks or `git rm` for these exact files.

- [ ] **Step 6: Verify no production imports old worker path**

Run:

```bash
rg -n "projectValidationWorkerPool|projectValidationWorker\\.ts|projectValidationWorker\\.js|createProjectValidationWorkerPool|ValidationWorkerTask" packages/core packages/mcp packages/cli
```

Expected matches may remain only in:

```text
packages/core/metadata/validation/projectValidationWorkerSchemaCache.ts
packages/core/metadata/validation/projectValidationWorkerRegister.mjs
packages/core/metadata/validation/projectValidationWorkerLoader.mjs
packages/core/metadata/project/preparedYamlProjectWorkerPool.ts
packages/core/metadata/project/preparedYamlProjectWorker.ts
```

If the search shows imports of deleted files or build expectations for `projectValidationWorker.js`, remove them.

- [ ] **Step 7: Run focused validation and MCP tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts metadata/validation/projectValidationWorkerSchemaCache.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run build scripts**

Run:

```bash
pnpm --filter @nkdk/core run build
pnpm --filter @nkdk/mcp run build
```

Expected: PASS. `packages/core/dist/projectValidationWorker.js` and `packages/mcp/dist/projectValidationWorker.js` are not produced.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/validation packages/core/scripts/build.mjs packages/mcp/scripts/build.mjs packages/mcp/src/server.test.ts
git commit -m "refactor: :recycle: удалить старый validation worker"
```

---

### Task 4: Синхронизировать архитектуру

**Files:**
- Modify: `.agents/architecture.md`

**Interfaces:**
- Consumes current operation matrix.
- Produces updated matrix where `Переименование` and `Поиск ссылок` do not use `Проверка по схеме` or `Проверка зависимостей`.

- [ ] **Step 1: Update operation matrix**

In `.agents/architecture.md`, update rows:

```md
| Переименование | ✓ |  |  |  |  |  | ✓ | ✓ | ✓ |  |  |  |  |  | ✓ |  | ✓ |
| Поиск ссылок | ✓ |  |  |  |  |  | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |
```

to:

```md
| Переименование | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |  |  | ✓ |  | ✓ |
| Поиск ссылок | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |  |  |  |  |  |
```

- [ ] **Step 2: Add a short note below the operation table**

Add after the operation matrix:

```md
Переименование и поиск ссылок временно используют `Построение модели`, но не запускают шаги validation. Полная validation остается отдельной операцией.
```

- [ ] **Step 3: Verify architecture wording**

Run:

```bash
rg -n "Переименование|Поиск ссылок|Проверка по схеме|Проверка зависимостей|Полная validation" .agents/architecture.md docs/superpowers/specs/2026-07-15-remove-legacy-validation-worker-design.md
```

Expected: architecture and spec both state that rename/reference search do not run validation steps.

- [ ] **Step 4: Commit**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: уточнить validation metadata-операций"
```

---

### Task 5: Full verification

**Files:**
- No planned edits. If verification exposes stale references, fix the owning file and include it in the final commit.

**Interfaces:**
- Consumes all previous tasks.
- Produces a clean branch with full tests passing.

- [ ] **Step 1: Search for stale names**

Run:

```bash
rg -n "projectValidationWorkerPool|createProjectValidationWorkerPool|ProjectValidationWorkerPool|ValidationWorkerTask|dist/projectValidationWorker\\.js|delete_item|deleteMetadataItem" packages/core packages/mcp packages/cli .agents docs/superpowers/specs/2026-07-15-remove-legacy-validation-worker-design.md docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md
```

Expected:

- no old validation worker pool references;
- no build-output expectation for `dist/projectValidationWorker.js`;
- no current-doc references to `delete_item` or `deleteMetadataItem` in the checked current specs.

- [ ] **Step 2: Run full tests**

Run:

```bash
pnpm test
```

Expected: PASS for core, mcp, and cli.

- [ ] **Step 3: Check worktree**

Run:

```bash
git status --short --branch
```

Expected: only intentional changes are present, or the tree is clean after commits.

- [ ] **Step 4: Commit verification fixes if needed**

If Step 1 or Step 2 required any fixes, commit them:

```bash
git add <fixed-files>
git commit -m "test: :white_check_mark: закрепить удаление старого worker"
```

If no fixes were needed and the tree is clean, do not create an empty commit.

---

## Self-Review

- Spec coverage: Task 1 removes the type dependency on the old pool; Task 2 removes full validation from operations; Task 3 deletes old worker compatibility and build outputs; Task 4 updates architecture; Task 5 performs stale-reference and full-test verification.
- Placeholder scan: no TBD/TODO placeholders; every task has exact files, commands, and expected outcomes.
- Type consistency: `ValidationWorkerPoolStartProfile`, `FirstPassPoolResult`, `SecondPassPoolParams`, and `SecondPassPoolResult` are introduced before downstream imports are updated.
