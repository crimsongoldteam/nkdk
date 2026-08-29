# Diagnostic Project Path Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Формировать переносимый `projectPath` отсутствующего владельца непосредственно в Core, не пропуская абсолютный путь файловой системы в публичные diagnostics.

**Architecture:** `ownerCache` продолжает использовать абсолютный путь только для чтения YAML и внутренних сведений найденного владельца. Для project-state validation отдельная чистая функция строит проверенный путь из `componentPath` и ссылки владельца; MCP сохраняет строгую проверку и не исправляет пути Core.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm workspace, `@nkdk/runtime` project-path boundary.

**Spec:** `docs/superpowers/specs/2026-08-29-diagnostic-project-path-contract-design.md`

## Global Constraints

- `fileSystemPath` остаётся абсолютным нативным путём только для файловых операций.
- Публичная диагностика Core использует только проверенный `projectPath` с `/`.
- Пути основной конфигурации начинаются с `cf/`, расширений — с `cfe/<Имя>/`.
- `validateProject` и двоичная коллекция diagnostics не получают преобразующий слой.
- MCP не нормализует абсолютные пути Core и продолжает отклонять нарушение договора.
- Существующие XML-фикстуры не изменяются.
- Базовая ревизия для проверки новых дублей: `3225e4ede`.

---

### Task 1: Чистое формирование пути отсутствующего владельца

**Files:**
- Create: `packages/rules/metadata/validation/dataPath/ownerCache.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/ownerCache.ts`

**Interfaces:**
- Consumes: `parseProjectPath(input: string): string`, `getDataPathOwnerKind(kind: string)` и `OwnerTypeRef`.
- Produces: `ownerMetadataProjectPath(componentPath: string, ref: OwnerTypeRef): string`.

- [ ] **Step 1: Write the failing unit test**

```ts
import { describe, expect, it } from "vitest"
import { ownerMetadataProjectPath } from "./ownerCache"

describe("ownerMetadataProjectPath", () => {
  it.each([
    ["cf", "cf/Документ/Продажа/Свойства.yaml"],
    ["cfe/дкз", "cfe/дкз/Документ/Продажа/Свойства.yaml"],
  ])("builds a project path for %s", (componentPath, expected) => {
    expect(ownerMetadataProjectPath(componentPath, { kind: "ДокументОбъект", name: "Продажа" }))
      .toBe(expected)
  })

  it("rejects a component path outside the project", () => {
    expect(() => ownerMetadataProjectPath("../cf", { kind: "Документ", name: "Продажа" }))
      .toThrow("Путь находится вне NKDK-проекта")
  })
})
```

- [ ] **Step 2: Run the unit test and verify the missing export failure**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/validation/dataPath/ownerCache.test.ts
```

Expected: FAIL because `ownerMetadataProjectPath` is not exported.

- [ ] **Step 3: Implement the minimal project-path builder**

Add the project-path boundary import and function to `ownerCache.ts`:

```ts
import { parseProjectPath } from "../../projectDefinition/path"

export function ownerMetadataProjectPath(componentPath: string, ref: OwnerTypeRef): string {
  const ownerKind = getDataPathOwnerKind(ref.kind)
  const segments = [
    componentPath,
    ownerKind?.projectDir ?? ref.kind,
    ...(ref.name ? [ref.name] : []),
    "Свойства.yaml",
  ]
  return parseProjectPath(segments.join("/"))
}
```

- [ ] **Step 4: Run the unit test and verify it passes**

Run the command from Step 2.

Expected: PASS for `cf`, `cfe/дкз`, the `ДокументОбъект` alias and the outside-project rejection.

- [ ] **Step 5: Commit the isolated path contract**

```bash
git add packages/rules/metadata/validation/dataPath/ownerCache.ts packages/rules/metadata/validation/dataPath/ownerCache.test.ts
git commit -m "fix: :bug: формировать путь диагностики владельца"
```

### Task 2: Передача готового projectPath в diagnostics владельца

**Files:**
- Modify: `packages/rules/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/rules/metadata/validation/dataPath/ownerCache.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/tests/layeredOwnerMetadataCache.ts`

**Interfaces:**
- Consumes: `ownerMetadataProjectPath(componentPath, ref)` from Task 1.
- Produces: `ownerMetadataNotFound({ filePath, ref })`; `createOwnerMetadataCacheFromValidationTable({ projectDir, componentPath, table })`; `ownerMetadataFromFacts({ projectDir, componentPath, ref, facts, fieldIndex })`.

- [ ] **Step 1: Write the failing project-state regression test**

Add one table-driven test next to `проверяет одинакового владельца компонента один раз`:

```ts
it.each([
  ["cf", "cf/Документ/Продажа/Свойства.yaml"],
  ["cfe/дкз", "cfe/дкз/Документ/Продажа/Свойства.yaml"],
])("возвращает projectPath отсутствующего владельца для %s", (componentPath, filePath) => {
  const diagnostics = validateProjectStateOwnerBatch({
    projectDir: "/project",
    checks: [{
      requestId: "missing-owner",
      componentPath,
      owner: { kind: "Документ", name: "Продажа" },
    }],
    queryPort: {
      readOwners: () => [{ requestId: "missing-owner", status: "missing" }],
    },
  })

  expect(diagnostics).toEqual([expect.objectContaining({
    filePath,
    source: "cross-file",
    message: "Не найден владелец Документ.Продажа",
  })])
})
```

- [ ] **Step 2: Run the regression test and verify the absolute-path failure**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/validation/projectStateDependencyValidation.test.ts
```

Expected: FAIL because the actual paths start with `/project/` (or `C:\...` on Windows).

- [ ] **Step 3: Make diagnostic location explicit in ownerCache**

Change `ownerMetadataNotFound` so the caller supplies the diagnostic path:

```ts
export function ownerMetadataNotFound(params: {
  filePath: string
  ref: OwnerTypeRef
}): Extract<OwnerMetadataResult, { status: "not-found" }> {
  return {
    status: "not-found",
    diagnostics: [crossFileDiagnostic(params.filePath, ownerNotFoundMessage(params.ref))],
  }
}
```

Require `componentPath` in `createOwnerMetadataCacheFromValidationTable`, pass it to `loadOwnerFromValidationTable`, and use:

```ts
return ownerMetadataNotFound({
  filePath: ownerMetadataProjectPath(params.componentPath, params.ref),
  ref: params.ref,
})
```

Keep `loadOwner` filesystem diagnostics unchanged: it is the local file-reading cache and still uses `ownerFilePath(...)`.

- [ ] **Step 4: Use project paths at every project-state owner boundary**

In `projectStateDependencyValidation.ts`, replace each project-state call with:

```ts
ownerMetadataNotFound({
  filePath: ownerMetadataProjectPath(componentPath, ref),
  ref,
})
```

Pass `componentPath` to `ownerMetadataFromFacts`. Inside `ownerMetadataFromFacts`, retain the absolute `filePath` for `ValidationOwnerFacts`, but use `ownerMetadataProjectPath(componentPath, ref)` if an unsupported owner kind creates an `import-error` diagnostic.

Update all `createOwnerMetadataCacheFromValidationTable` callers with the known component:

```ts
createOwnerMetadataCacheFromValidationTable({ projectDir, componentPath, table })
```

The affected callers are `ownerCache.integration.test.ts`, `projectStateDependencyValidation.test.ts` and `tests/layeredOwnerMetadataCache.ts`.

- [ ] **Step 5: Strengthen the owner-cache integration assertion**

For an empty validation table, assert both components without filesystem access:

```ts
it.each([
  ["cf", "cf/Справочник/Товары/Свойства.yaml"],
  ["cfe/дкз", "cfe/дкз/Справочник/Товары/Свойства.yaml"],
])("returns a missing-owner project path for %s", (componentPath, filePath) => {
  const cache = createOwnerMetadataCacheFromValidationTable({
    projectDir: `/project/${componentPath}`,
    componentPath,
    table: createValidationObjectTable(),
  })

  expect(cache.get({ kind: "Справочник", name: "Товары" })).toMatchObject({
    status: "not-found",
    diagnostics: [{ filePath, source: "cross-file" }],
  })
})
```

- [ ] **Step 6: Run focused rules tests**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/validation/dataPath/ownerCache.test.ts metadata/validation/projectStateDependencyValidation.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/validation/dataPath/ownerCache.integration.test.ts
```

Expected: all selected tests PASS; the existing graph/project-state parity test remains equal.

- [ ] **Step 7: Check type consistency and new duplicates**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm check:duplicates -- --base 3225e4ede
```

Expected: both commands exit with code 0 and no new duplicate blocks are reported.

- [ ] **Step 8: Commit the source-generation fix**

```bash
git add packages/rules/metadata/validation/dataPath/ownerCache.ts packages/rules/metadata/validation/dataPath/ownerCache.integration.test.ts packages/rules/metadata/validation/projectStateDependencyValidation.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts packages/rules/tests/layeredOwnerMetadataCache.ts
git commit -m "fix: :bug: не выпускать абсолютные пути диагностик"
```

### Task 3: Полная проверка публичного договора

**Files:**
- Verify: `packages/mcp/src/services/validateProject.integration.test.ts`
- Verify: all packages and architecture boundaries.

**Interfaces:**
- Consumes: project-relative Core diagnostics from Tasks 1–2.
- Produces: подтверждённый договор — MCP принимает `cf/...` и `cfe/...`, но отклоняет абсолютный путь Core.

- [ ] **Step 1: Verify the existing MCP acceptance and rejection contracts**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --project integration src/services/validateProject.integration.test.ts
```

Expected: the existing valid root-relative cases PASS, and `rejects core diagnostic path outside project` continues to PASS without MCP changes.

- [ ] **Step 2: Run complete repository verification outside the sandbox where LMDB requires it**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 3225e4ede
```

Expected: every command exits with code 0; all package tests pass; dependency-cruiser reports no new violation; no new duplicate blocks are reported.

- [ ] **Step 3: Inspect the final change set**

Run:

```bash
git status --short
git diff 3225e4ede --check
git log --oneline 3225e4ede..HEAD
```

Expected: only the plan and the intended source/test files differ from the specification baseline; `git diff --check` produces no output.
