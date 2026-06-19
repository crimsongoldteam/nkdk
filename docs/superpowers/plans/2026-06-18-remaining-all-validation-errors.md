# Remaining `all` Validation Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать 4 оставшиеся ошибки `all` validation без изменения XML/YAML round-trip.

**Architecture:** Изменение делится на два узких validation-only слоя. `OwnerMetadataCache` и `ProjectMetadataResolver` получают поддержку `ВнешнийИсточникДанных` и прямых `Функция.*`; `validateForm` получает узкий bypass для служебного `1/0:<uuid>` только в контексте `InputField` с множественным редактированием.

**Tech Stack:** TypeScript, Vitest, TypeBox/YAML validation helpers, metadata validation layer.

---

### Task 1: ExternalDataSource Owner And Function Member

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/types.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Add failing owner-cache test**

Add `["ВнешнийИсточникДанных", "ВнешнийИсточникДанных"]` to the owner directory mapping test table in `ownerCache.test.ts`.

- [ ] **Step 2: Add failing member resolver tests**

Add positive and negative tests in `projectMetadataResolver.test.ts`:

```ts
it("resolves external data source functions from child function files", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", "Синоним: Продажи")
  writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Функции/Получить/Свойства.yaml", "Синоним: Получить")
  const resolver = createResolver(projectDir)

  expect(resolver.resolveMember({ target: memberTarget("ВнешнийИсточникДанных.Продажи.Функция.Получить") })).toMatchObject({
    ok: true,
    filePath: join(projectDir, "ВнешнийИсточникДанных", "Продажи", "Функции", "Получить", "Свойства.yaml"),
    details: { kind: "Function", name: "Получить", item: "Получить" },
  })
})

it("keeps missing external data source functions as reference diagnostics", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "ВнешнийИсточникДанных/Продажи/Свойства.yaml", "Синоним: Продажи")
  const resolver = createResolver(projectDir)

  expect(resolver.resolveMember({ target: memberTarget("ВнешнийИсточникДанных.Продажи.Функция.НетТакой") })).toMatchObject({
    ok: false,
    diagnostics: [expect.objectContaining({ message: 'Не найден член "ВнешнийИсточникДанных.Продажи.Функция.НетТакой": нет сегмента "НетТакой"' })],
  })
})
```

- [ ] **Step 3: Implement owner kind**

Add `"ВнешнийИсточникДанных"` to `KnownOwnerTypeKind` and `ownerDirByRefKind`.

- [ ] **Step 4: Implement function fallback**

Add `resolveChildFunctionFile` in `projectMetadataResolver.ts`, parallel to form/template fallback, checking `Функции/<name>/Свойства.yaml`.

- [ ] **Step 5: Run targeted tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts metadata/validation/projectMetadataResolver.test.ts
```

Expected: both files pass.

### Task 2: Opaque Multiple-Value DataPath

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.ts`
- Modify: `packages/core/metadata/validation/validateForm.ts`
- Modify: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Add failing form tests**

Add tests in `validateForm.test.ts`:

```ts
it("accepts opaque multiple-value data path for extended input fields", () => {
  const project = createFormProject([
    "Элементы:",
    "  Реквизит1:",
    "    Вид: ПолеВвода",
    "    РасширенноеРедактированиеМножественныхЗначений: Истина",
    "    ПутьКДанным: 1/0:796f500f-c364-45d1-bce6-9e7e8e15b664",
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникОбъект.Тест",
    "    ОсновнойРеквизит: Истина",
  ])

  expect(messages(runValidateForm(project))).not.toContain(
    'ПутьКДанным "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664": неизвестный корень "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"',
  )
})

it("keeps opaque data path invalid without extended multiple-value editing", () => {
  const project = createFormProject([
    "Элементы:",
    "  Реквизит1:",
    "    Вид: ПолеВвода",
    "    ПутьКДанным: 1/0:796f500f-c364-45d1-bce6-9e7e8e15b664",
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникОбъект.Тест",
    "    ОсновнойРеквизит: Истина",
  ])

  expect(messages(runValidateForm(project))).toContain(
    'ПутьКДанным "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664": неизвестный корень "1/0:796f500f-c364-45d1-bce6-9e7e8e15b664"',
  )
})
```

- [ ] **Step 2: Carry context from traversal**

Extend `FormDataPathOccurrence` with `hasMultipleValuesExtendedEdit?: boolean`, populated from owner model key `multipleValuesExtendedEdit`.

- [ ] **Step 3: Skip resolver for accepted opaque token**

In `validateForm.ts`, before `resolveDataPath`, return no diagnostics for the strict opaque token only when `elementType === "InputField"`, `rule.yaml === "ПутьКДанным"` and `hasMultipleValuesExtendedEdit === true`.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Expected: tests pass.

### Task 3: Verification

**Files:**
- No additional files.

- [ ] **Step 1: Run combined targeted suite**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts metadata/validation/projectMetadataResolver.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run `all` validation**

Run current `all` validation against `/tmp/round-trip-yaml-validation/current/all`.

Expected: `0 error`; warnings may remain.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.
