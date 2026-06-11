# Validation Cache Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Снизить пик памяти и повторную работу полной `validateProject` без изменения правил validation и формата CLI-вывода.

**Architecture:** `ProjectYamlCache` получает явное освобождение успешных YAML-записей. `validateProject` и `ownerCache` отпускают `ParsedYaml` сразу после того, как из него получены diagnostics/model. `ownerCache` больше не запускает schema validation владельца и хранит готовый индекс полей владельца для `resolveDataPath`.

**Tech Stack:** TypeScript, Vitest, `yaml`, TypeBox, существующий validation слой `packages/core/metadata/validation`.

---

## File Structure

- Modify: `packages/core/metadata/validation/projectYamlCache.ts`  
  Add `release(filePath)` to remove successful parsed YAML entries from the cache while keeping read errors cached.
- Modify: `packages/core/metadata/validation/projectYamlCache.test.ts`  
  Cover successful-entry eviction and cached read errors.
- Modify: `packages/core/metadata/validation/validateProject.ts`  
  Release each top-level project file after validation.
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`  
  Remove owner schema validation, drop stored owner `ParsedYaml`, release owner YAML after import, and store `fieldIndex`.
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`  
  Update expectations and add a test proving owner loading does not compile TypeBox schemas.
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`  
  Reuse `owner.fieldIndex` instead of rebuilding it for every path segment.
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts` and `objectFields.test.ts` helpers if the `OwnerMetadata` test shape needs the new `fieldIndex`.
- Modify: `packages/core/metadata/validation/validateForm.ts`  
  Remove schema diagnostics forwarding from owner metadata, because owner schema diagnostics are now owned by the main project-file pass.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`  
  Keep schema compile-count expectations aligned with the new owner behavior.

---

### Task 1: Add Explicit YAML Cache Release

**Files:**
- Modify: `packages/core/metadata/validation/projectYamlCache.ts`
- Modify: `packages/core/metadata/validation/projectYamlCache.test.ts`

- [ ] **Step 1: Write failing cache eviction tests**

Add these tests to `projectYamlCache.test.ts`:

```ts
  it("releases successful entries so large parsed YAML can be collected", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Свойства.yaml")
    writeFileSync(filePath, "Имя: Товары\n")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    cache.release(filePath)
    const second = cache.get(filePath)

    expect(second).not.toBe(first)
    expect(second).toMatchObject({
      filePath,
      parsed: {
        data: { Имя: "Товары" },
      },
    })
    expect(readFileSync).toHaveBeenCalledTimes(2)
  })

  it("keeps read errors cached when released", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "missing.yaml")
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const cache = createProjectYamlCache()

    const first = cache.get(filePath)
    cache.release(filePath)
    const second = cache.get(filePath)

    expect(second).toBe(first)
    expect(second).toMatchObject({ filePath, error: expect.any(Error) })
    expect(readFileSync).toHaveBeenCalledTimes(1)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectYamlCache.test.ts
```

Expected: FAIL because `cache.release` is not defined.

- [ ] **Step 3: Implement `release`**

Change `ProjectYamlCache` and `createProjectYamlCache` in `projectYamlCache.ts`:

```ts
export interface ProjectYamlCache {
  get(filePath: string): ProjectYamlEntry | { filePath: string; error: Error }
  release(filePath: string): void
}
```

Add the method to the returned object:

```ts
    release(filePath) {
      const absolutePath = resolve(filePath)
      const cached = entries.get(absolutePath)
      if (cached === undefined || "error" in cached) return

      entries.delete(absolutePath)
    },
```

- [ ] **Step 4: Run cache tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectYamlCache.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/projectYamlCache.ts packages/core/metadata/validation/projectYamlCache.test.ts
git commit -m "perf: :zap: освобождать YAML-кэш validation"
```

---

### Task 2: Release Top-Level Project Files

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add release to the project loop**

Change the loop in `validateProject.ts`:

```ts
  const diagnostics: Diagnostic[] = []
  for (const file of files) {
    try {
      diagnostics.push(...validateProjectFile({ projectDir, file, cache, context, ownerCache, schemaCache }))
    } finally {
      cache.release(file.absolutePath)
    }
  }
```

- [ ] **Step 2: Run validateProject tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: PASS. The existing `uses one YAML cache for repeated owner reads` test must remain green; it proves behavior still reuses owner data during a run.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/validation/validateProject.ts
git commit -m "perf: :zap: освобождать YAML после проверки файла"
```

---

### Task 3: Remove Owner Schema Validation And Release Owner YAML

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`
- Modify: `packages/core/metadata/validation/validateForm.ts`

- [ ] **Step 1: Write failing owner-cache tests**

In `ownerCache.test.ts`, add `TypeCompiler` import:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
```

Remove the test named `"keeps schema diagnostics on successfully imported owners"` and add this test:

```ts
  it("does not run schema validation while loading owners for DataPath checks", () => {
    const projectDir = createProject()
    writeProperties(projectDir, "Справочник", "Товары", ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"))
    const compile = vi.spyOn(TypeCompiler, "Compile")
    const cache = createOwnerMetadataCache({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })

    const result = cache.get({ kind: "Справочник", name: "Товары" })

    expect(result.status).toBe("ok")
    expect(compile).not.toHaveBeenCalled()
  })
```

- [ ] **Step 2: Run owner-cache tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts
```

Expected: FAIL because `loadOwner` still calls `TypeCompiler.Compile`.

- [ ] **Step 3: Remove owner schema diagnostics from types**

In `ownerCache.ts`, remove these imports:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { validateParsedFile } from "../validateFile"
```

Remove these fields from `OwnerMetadata`:

```ts
  parsed: ParsedYaml
  schemaDiagnostics: Diagnostic[]
```

- [ ] **Step 4: Remove schema validation from `loadOwner`**

Delete this block from `loadOwner`:

```ts
  const schemaDiagnostics = validateParsedFile({
    filePath,
    parsed: entry.parsed,
    schema: TypeCompiler.Compile(spec.exportSchema({ context, mode: "inline" })),
  })
```

Return owner metadata without `parsed` and `schemaDiagnostics`:

```ts
  return {
    status: "ok",
    owner: {
      ref,
      filePath,
      model: imported.model,
      rule: spec.rule,
      spec,
    },
  }
```

- [ ] **Step 5: Release owner YAML after import and unique-name checks**

Wrap the successful YAML-entry path in `loadOwner` with `try/finally`:

```ts
  const entry = yamlCache.get(filePath)
  if ("error" in entry) {
    return {
      status: "not-found",
      diagnostics: [crossFileDiagnostic(filePath, `Не найден файл владельца ${formatOwnerRef(ref)}: ${entry.error.message}`)],
    }
  }

  try {
    const imported = importOwnerModel({ spec, context, parsed: entry.parsed, name: ref.name, filePath, ref })
    if (imported.status === "import-error") return imported

    const uniqueNameDiagnostics = validateUniqueNameScopes({
      filePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: spec.rule,
    })
    if (uniqueNameDiagnostics.length > 0) {
      return { status: "ambiguous", diagnostics: uniqueNameDiagnostics }
    }

    return {
      status: "ok",
      owner: {
        ref,
        filePath,
        model: imported.model,
        rule: spec.rule,
        spec,
      },
    }
  } finally {
    yamlCache.release(filePath)
  }
```

- [ ] **Step 6: Remove owner schema diagnostic forwarding from forms**

In `validateForm.ts`, remove `ownerDiagnostics`, `recordOwnerSchemaDiagnostics`, and `diagnosticKey`. Replace the owner-cache construction with:

```ts
  const ownerCache =
    params.ownerCache ??
    createOwnerMetadataCache({
      projectDir: params.projectDir,
      yamlCache: params.cache,
      context,
    })
```

At the end of `validateForm`, return only the form diagnostics:

```ts
  return dedupeDiagnostics(diagnostics)
```

- [ ] **Step 7: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/dataPath/ownerCache.ts packages/core/metadata/validation/dataPath/ownerCache.test.ts packages/core/metadata/validation/validateForm.ts
git commit -m "perf: :zap: убрать schema validation владельцев"
```

---

### Task 4: Cache Object Field Index On Owner Metadata

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.test.ts`

- [ ] **Step 1: Extend owner metadata with `fieldIndex`**

In `ownerCache.ts`, add imports:

```ts
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./objectFields"
```

Add to `OwnerMetadata`:

```ts
  fieldIndex: ObjectFieldIndex
```

- [ ] **Step 2: Narrow the input type for `buildObjectFieldIndex`**

In `objectFields.ts`, introduce a narrow owner type so the index builder does not require an already-built `fieldIndex`:

```ts
type ObjectFieldIndexOwner = Pick<OwnerMetadata, "ref" | "model" | "rule">
```

Change the function signatures that only need those fields:

```ts
export function buildObjectFieldIndex(owner: ObjectFieldIndexOwner): ObjectFieldIndex {
```

```ts
function addDataCollectionFields(params: { owner: ObjectFieldIndexOwner; fields: Map<string, ObjectField> }): void {
```

```ts
  owner: ObjectFieldIndexOwner
```

for `addStandardAttributeFields`, `buildTabularSectionField`, and `standardAttributeTypeInfo`.

- [ ] **Step 3: Build field index once after model import**

In the successful return in `loadOwner`, construct `owner` before returning:

```ts
    const ownerWithoutIndex = {
      ref,
      filePath,
      model: imported.model,
      rule: spec.rule,
      spec,
    }
    const owner: OwnerMetadata = {
      ...ownerWithoutIndex,
      fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
    }

    return { status: "ok", owner }
```

- [ ] **Step 4: Reuse the cached index in resolver**

In `resolver.ts`, remove `buildObjectFieldIndex` from the import:

```ts
import { validateObjectFieldSegment, type ObjectFieldTableSource } from "./objectFields"
```

Replace:

```ts
    const fieldIndex = buildObjectFieldIndex(ownerResult.owner)
    const field = fieldIndex.fields.get(segment)
```

with:

```ts
    const field = ownerResult.owner.fieldIndex.fields.get(segment)
```

- [ ] **Step 5: Update test helper owners**

In `resolver.test.ts` and `objectFields.test.ts`, update the local `owner(...)` helper to include `fieldIndex`. Import `buildObjectFieldIndex` where needed and return:

```ts
  const rule = params.rule ?? MetadataCatalogRules
  const ownerWithoutIndex = {
    ref: params.ref ?? { kind: "Справочник", name: "Номенклатура" },
    filePath: "/tmp/Свойства.yaml",
    model: params.model ?? { itemType: rule.itemType },
    rule,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule,
      exportSchema: () => ({ type: "object" }) as never,
      importModel: () => undefined,
    },
  }

  return {
    ...ownerWithoutIndex,
    fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
  }
```

- [ ] **Step 6: Run resolver and object field tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts metadata/validation/dataPath/objectFields.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/dataPath/ownerCache.ts packages/core/metadata/validation/dataPath/objectFields.ts packages/core/metadata/validation/dataPath/resolver.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/dataPath/objectFields.test.ts
git commit -m "perf: :zap: кэшировать индекс полей владельца"
```

---

### Task 5: Regression And ERP Validation Check

**Files:**
- Test-only task; no source edits expected.

- [ ] **Step 1: Run focused validation suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: all validation tests pass.

- [ ] **Step 2: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run ERP validation without heap override**

Run:

```bash
/usr/bin/time -v pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validation-cache-optimized.log 2>&1
```

Expected: command exits with status `1` because validation finds diagnostics, not with status `134` OOM. The log should end with:

```text
summary: 38831 error, 36173 warning
```

The exact counts may change only if earlier commits changed validation semantics. For this plan they should stay the same.

- [ ] **Step 4: Compare memory and wall-clock**

Read the timing tail:

```bash
tail -n 35 /tmp/nkdk-validation-cache-optimized.log
```

Expected: `Maximum resident set size` is below the previous OOM run value `2377576 kbytes`, and wall-clock completes without heap override.

- [ ] **Step 5: Commit if tests required small follow-up fixes**

If Task 5 required code or test fixes, commit them:

```bash
git add packages/core/metadata/validation
git commit -m "fix: :bug: стабилизировать оптимизацию validation"
```

If Task 5 only ran checks, do not create an empty commit.

---

## Self-Review

- Spec coverage: YAML cache release is covered by Tasks 1-2; owner schema validation removal is covered by Task 3; object field index reuse is covered by Task 4; verification is covered by Task 5.
- Scope: no parallel validation, no CLI output changes, no DataPath rule changes, no metadata YAML contract changes.
- Type consistency: `ProjectYamlCache.release(filePath)` is introduced before use; `OwnerMetadata.fieldIndex` is introduced before resolver switches to it.
- Risk: dropping owner `schemaDiagnostics` changes only where those diagnostics are produced. They remain produced by `validateProject` when it validates each `Свойства.yaml` as a project file.
