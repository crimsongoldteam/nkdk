# DataPath YAML Standard Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make YAML `DataPath` values use YAML names for standard реквизиты, while XML import/export keeps converting to and from platform internal names.

**Architecture:** Keep the existing `DataPath` formatter as the single conversion point. Add an explicit alias policy to the data-path resolver: internal mode may resolve platform names such as `LineNumber`, YAML mode must resolve only YAML names such as `НомерСтроки`.

**Tech Stack:** TypeScript, Vitest, existing metadata rules/orchestration, existing `DataPath` resolver and formatter.

## Global Constraints

- Do not change existing XML fixtures.
- Do not add new fromXML/toXML/fromYAML/toYAML rules unless strictly needed; prefer existing `rules.ts` and type-rule hooks.
- Keep common metadata layers neutral: no private conditions by concrete metadata type, folder name, or concrete rules object.
- English standard реквизиты are allowed only at XML/internal boundaries, not as valid YAML `DataPath` names.
- Do not add a special diagnostic for English names; let normal unknown field/column diagnostics report them.
- Before closing the issue, run `pnpm test` from `/Users/nikita/git/nkdk`.

---

## File Structure

- Modify `packages/core/metadata/validation/dataPath/objectFields.ts`
  - Add an explicit `DataPathNameMode`-like parameter to object field lookup so standard реквизит aliases are used only in internal mode.
- Modify `packages/core/metadata/validation/dataPath/coreResolver.ts`
  - Pass `params.nameMode` into object-field and table-column resolution.
  - Make table-column alias resolution conditional: `LineNumber -> НомерСтроки` is allowed in internal mode and forbidden in YAML mode.
- Modify `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
  - Add direct formatter coverage for `Объект.Товары.LineNumber -> Объект.Товары.НомерСтроки`.
- Modify `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`
  - Add direct formatter coverage for `Объект.Товары.НомерСтроки -> Объект.Товары.LineNumber`.
  - Add direct formatter coverage that `Объект.Товары.LineNumber` is unchanged when importing from YAML.
- Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
  - Add form export coverage for table child item `dataPath: "Объект.Товары.LineNumber"` becoming `ПутьКДанным: "Объект.Товары.НомерСтроки"`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
  - Add form import coverage for `ПутьКДанным: "Объект.Товары.НомерСтроки"` becoming internal `dataPath: "Объект.Товары.LineNumber"`.
- Modify `packages/core/metadata/validation/validateForm.test.ts`
  - Replace the existing acceptance test for `LineNumber` with a rejection test.
  - Add an acceptance test for `НомерСтроки`.

---

### Task 1: Formatter Round-Trip For Tabular Section Row Number

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`

**Interfaces:**
- Consumes: `exportDataPathStandardMembersToYAML(context, value): unknown`
- Consumes: `importDataPathStandardMembersFromYAML(context, value): unknown`
- Produces: tests documenting the intended XML/internal boundary conversion before resolver behavior changes.

- [ ] **Step 1: Add tabular section standard attribute to the toYAML test context**

In `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`, change the generated catalog YAML in `catalogProjectDir()` from:

```ts
writeFileSync(join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
```

to:

```ts
writeFileSync(
  join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"),
  [
    "Имя: Контрагенты",
    "ТабличныеЧасти:",
    "  Товары:",
    "    Реквизиты:",
    "      Количество:",
    "        Тип: Число",
    "",
  ].join("\n"),
  "utf-8"
)
```

- [ ] **Step 2: Add failing export test for table row number**

In `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`, add this test inside `describe("exportDataPathStandardMembersToYAML", () => { ... })` after `exports direct standard attribute of current object`:

```ts
test("exports tabular section row number standard attribute", () => {
  expect(exportDataPathStandardMembersToYAML(catalogContext(), "Объект.Товары.LineNumber")).toBe(
    "Объект.Товары.НомерСтроки"
  )
})
```

- [ ] **Step 3: Run export test and verify current behavior**

Run:

```bash
pnpm --filter @nkdk/core test -- metadataPath/toYAML.test.ts
```

Expected before implementation: the new test fails if the current formatter does not convert `LineNumber` for tabular sections.

- [ ] **Step 4: Add tabular section standard attribute to the fromYAML test context**

In `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`, change the generated catalog YAML in `catalogProjectDir()` from:

```ts
writeFileSync(join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
```

to:

```ts
writeFileSync(
  join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"),
  [
    "Имя: Контрагенты",
    "ТабличныеЧасти:",
    "  Товары:",
    "    Реквизиты:",
    "      Количество:",
    "        Тип: Число",
    "",
  ].join("\n"),
  "utf-8"
)
```

- [ ] **Step 5: Add import tests for YAML and English spelling**

In `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`, add these tests inside `describe("importDataPathStandardMembersFromYAML", () => { ... })` after `imports direct standard attribute of current object`:

```ts
test("imports tabular section row number standard attribute", () => {
  expect(importDataPathStandardMembersFromYAML(catalogContext(), "Объект.Товары.НомерСтроки")).toBe(
    "Объект.Товары.LineNumber"
  )
})

test("does not accept internal tabular section row number as YAML spelling", () => {
  expect(importDataPathStandardMembersFromYAML(catalogContext(), "Объект.Товары.LineNumber")).toBe(
    "Объект.Товары.LineNumber"
  )
})
```

- [ ] **Step 6: Run import test and verify current behavior**

Run:

```bash
pnpm --filter @nkdk/core test -- metadataPath/fromYAML.test.ts
```

Expected before implementation: the `НомерСтроки` conversion should pass or expose a missing table-column mapping; the `LineNumber` YAML spelling test should fail if YAML mode still accepts internal aliases.

- [ ] **Step 7: Commit tests for formatter behavior**

```bash
git add packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать YAML-имена DataPath"
```

---

### Task 2: Make Standard Attribute Aliases Mode-Aware

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Test: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`

**Interfaces:**
- Consumes: `ResolveDataPathCoreParams.nameMode: "internal" | "yaml"`
- Produces: `resolveObjectFieldSegment({ index, segment, nameMode })`
- Produces: `resolveTableColumnSource({ columns, segment, nameMode })`

- [ ] **Step 1: Update object field resolver signature**

In `packages/core/metadata/validation/dataPath/objectFields.ts`, change `resolveObjectFieldSegment` signature and alias lookup from:

```ts
export function resolveObjectFieldSegment(params: {
  index: ObjectFieldIndex
  segment: string
}): ObjectField | undefined {
  const direct = params.index.fields.get(params.segment)
  if (direct !== undefined) return direct

  const alias =
    params.index.standardAttributeAliases.get(params.segment) ?? standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.index.fields.get(alias)
  return undefined
}
```

to:

```ts
export function resolveObjectFieldSegment(params: {
  index: ObjectFieldIndex
  segment: string
  nameMode: "internal" | "yaml"
}): ObjectField | undefined {
  const direct = params.index.fields.get(params.segment)
  if (direct !== undefined) return direct
  if (params.nameMode === "yaml") return undefined

  const alias =
    params.index.standardAttributeAliases.get(params.segment) ?? standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.index.fields.get(alias)
  return undefined
}
```

- [ ] **Step 2: Pass name mode at the first object-field call site**

In `packages/core/metadata/validation/dataPath/coreResolver.ts`, change:

```ts
const field = resolveObjectFieldSegment({ index: resolvedOwner.fieldIndex, segment: lookupSegment })
```

to:

```ts
const field = resolveObjectFieldSegment({
  index: resolvedOwner.fieldIndex,
  segment: lookupSegment,
  nameMode: params.nameMode,
})
```

- [ ] **Step 3: Pass name mode at the registered column helper call site**

In `packages/core/metadata/validation/dataPath/coreResolver.ts`, change:

```ts
const field =
  ownerResult?.status === "ok"
    ? resolveObjectFieldSegment({ index: ownerResult.owner.fieldIndex, segment: params.segment })
    : undefined
```

to:

```ts
const field =
  ownerResult?.status === "ok"
    ? resolveObjectFieldSegment({
        index: ownerResult.owner.fieldIndex,
        segment: params.segment,
        nameMode: params.params.nameMode,
      })
    : undefined
```

- [ ] **Step 4: Make table-column aliases mode-aware**

In `packages/core/metadata/validation/dataPath/coreResolver.ts`, change the `resolveTableColumnSource` signature and implementation from:

```ts
function resolveTableColumnSource(params: {
  columns: FormDataPathTableSource["columns"] | ObjectFieldTableSource["columns"] | undefined
  segment: string
}): TableColumnSource | undefined {
  if (params.columns === undefined) return undefined

  const direct = params.columns.get(params.segment)
  if (direct !== undefined) return direct

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.columns.get(alias)
  return undefined
}
```

to:

```ts
function resolveTableColumnSource(params: {
  columns: FormDataPathTableSource["columns"] | ObjectFieldTableSource["columns"] | undefined
  segment: string
  nameMode: DataPathNameMode
}): TableColumnSource | undefined {
  if (params.columns === undefined) return undefined

  const direct = params.columns.get(params.segment)
  if (direct !== undefined) return direct
  if (params.nameMode === "yaml") return undefined

  const alias = standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.columns.get(alias)
  return undefined
}
```

- [ ] **Step 5: Pass name mode at both table-column lookup call sites**

In `packages/core/metadata/validation/dataPath/coreResolver.ts`, change:

```ts
resolveTableColumnSource({ columns: tableSource.columns, segment: lookupSegment }) ??
resolveTableColumnSource({
  columns: params.params.index.additionalColumnsByTablePath.get(normalizedTablePath),
  segment: lookupSegment,
}) ??
registeredColumnResult.column
```

to:

```ts
resolveTableColumnSource({
  columns: tableSource.columns,
  segment: lookupSegment,
  nameMode: params.params.nameMode,
}) ??
resolveTableColumnSource({
  columns: params.params.index.additionalColumnsByTablePath.get(normalizedTablePath),
  segment: lookupSegment,
  nameMode: params.params.nameMode,
}) ??
registeredColumnResult.column
```

- [ ] **Step 6: Fix TypeScript errors from other call sites**

Search:

```bash
rg "resolveObjectFieldSegment\\(|resolveTableColumnSource\\(" packages/core/metadata/validation/dataPath -n
```

For each remaining `resolveObjectFieldSegment` call, pass the surrounding `nameMode`. In tests that directly call `resolveObjectFieldSegment`, use `nameMode: "internal"` when they expect alias behavior and `nameMode: "yaml"` when they expect YAML-only behavior.

- [ ] **Step 7: Run focused formatter tests**

Run:

```bash
pnpm --filter @nkdk/core test -- metadataPath/toYAML.test.ts metadataPath/fromYAML.test.ts
```

Expected: both tests pass.

- [ ] **Step 8: Commit resolver alias policy**

```bash
git add packages/core/metadata/validation/dataPath/objectFields.ts packages/core/metadata/validation/dataPath/coreResolver.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
git commit -m "fix: :bug: запретить internal-имена DataPath в YAML"
```

---

### Task 3: Form Import And Export Regression Tests

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

**Interfaces:**
- Consumes: `exportClientApplicationFormToYAML(context, form): FormYAMLExportResult`
- Consumes: `importClientApplicationFormFromYAML(context, yaml): ClientApplicationForm`
- Produces: regression coverage for form-level rule orchestration.

- [ ] **Step 1: Add form export regression test**

In `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`, add this test after `exports object standard member data paths to YAML spelling`:

```ts
it("exports tabular section row number data paths to YAML spelling", () => {
  const form: ClientApplicationForm = {
    itemType: "ClientApplicationForm",
    attributes: [{ itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Товары"] }, columns: [] }],
    childItems: [{ itemType: "LabelField", name: "НомерСтроки", dataPath: "Объект.Состав.LineNumber" }],
  }

  const { yaml } = exportClientApplicationFormToYAML(contextWithProjectDir(), form)

  expect(yaml?.Элементы?.НомерСтроки).toMatchObject({ ПутьКДанным: "Объект.Состав.НомерСтроки" })
})
```

- [ ] **Step 2: Extend the existing project helper for form export test**

In `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`, change the existing `contextWithProjectDir()` helper from:

```ts
function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
  return {
    ...mockContextToYAML,
    exportToYAML: {
      ...mockContextToYAML.exportToYAML!,
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
```

to:

```ts
function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(
    join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
    [
      "Имя: Товары",
      "ТабличныеЧасти:",
      "  Состав:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
      "",
    ].join("\n"),
    "utf-8"
  )
  return {
    ...mockContextToYAML,
    exportToYAML: {
      ...mockContextToYAML.exportToYAML!,
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
```

- [ ] **Step 3: Run form export test and verify failure or pass**

Run:

```bash
pnpm --filter @nkdk/core test -- clientApplicationForm/toYAML.test.ts
```

Expected: pass after Task 2. If it fails, the failure points to missing `formAttributes` or project owner context in `exportClientApplicationFormToYAML`.

- [ ] **Step 4: Add form import regression test**

In `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`, add this test near other `importClientApplicationFormFromYAML` focused tests:

```ts
it("imports tabular section row number data paths from YAML spelling", () => {
  const form = importClientApplicationFormFromYAML(contextWithProjectDir(), {
    Реквизиты: {
      Объект: {
        Тип: "СправочникОбъект.Товары",
      },
    },
    Элементы: {
      НомерСтроки: {
        Вид: "ПолеНадписи",
        ПутьКДанным: "Объект.Состав.НомерСтроки",
      },
    },
  })

  expect(form.childItems).toContainEqual(
    expect.objectContaining({
      itemType: "LabelField",
      name: "НомерСтроки",
      dataPath: "Объект.Состав.LineNumber",
    })
  )
})
```

- [ ] **Step 5: Extend the existing project helper for form import test**

In `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`, change the existing `contextWithProjectDir()` helper from:

```ts
function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
  return {
    ...mockContext,
    importFromYAML: {
      ...(mockContext.importFromYAML ?? {}),
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
```

to:

```ts
function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(
    join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
    [
      "Имя: Товары",
      "ТабличныеЧасти:",
      "  Состав:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
      "",
    ].join("\n"),
    "utf-8"
  )
  return {
    ...mockContext,
    importFromYAML: {
      ...(mockContext.importFromYAML ?? {}),
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
```

- [ ] **Step 6: Run form import test**

Run:

```bash
pnpm --filter @nkdk/core test -- clientApplicationForm/fromYAML.test.ts
```

Expected: pass after Task 2.

- [ ] **Step 7: Commit form regression tests**

```bash
git add packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts
git commit -m "test: :white_check_mark: покрыть DataPath форм"
```

---

### Task 4: Validation Rejects Internal Standard Names In YAML

**Files:**
- Modify: `packages/core/metadata/validation/validateForm.test.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Consumes: YAML validation path `resolveDataPath(... nameMode: "yaml")`
- Produces: tests proving `Объект.Товары.LineNumber` is invalid YAML while `Объект.Товары.НомерСтроки` is valid.

- [ ] **Step 1: Replace the old validation acceptance test**

In `packages/core/metadata/validation/validateForm.test.ts`, replace the test named:

```ts
it("accepts LineNumber as an alias for the tabular section YAML row number column", () => {
```

with:

```ts
it("rejects internal LineNumber spelling in YAML data paths", () => {
  const project = createProject({
    ownerDir: "Документ",
    ownerName: "Заказ",
    owner: [
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: Справочник.Номенклатура",
    ],
    form: [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Документ.Заказ",
      "Элементы:",
      "  НомерСтроки:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Товары.LineNumber",
    ],
  })

  expect(messages(runValidateForm(project))).toEqual([
    'ПутьКДанным "Объект.Товары.LineNumber": неизвестная колонка "LineNumber"',
  ])
})
```

- [ ] **Step 2: Add positive validation test for YAML spelling**

In the same `describe` block, add this test immediately after the rejection test:

```ts
it("accepts YAML row number spelling in data paths", () => {
  const project = createProject({
    ownerDir: "Документ",
    ownerName: "Заказ",
    owner: [
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: Справочник.Номенклатура",
    ],
    form: [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Документ.Заказ",
      "Элементы:",
      "  НомерСтроки:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Товары.НомерСтроки",
    ],
  })

  expect(runValidateForm(project)).toEqual([])
})
```

- [ ] **Step 3: Update direct resolver test expectations**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, find:

```ts
it("resolves LineNumber as an alias for the YAML row number column", () => {
```

Rename it to:

```ts
it("resolves LineNumber only in internal mode", () => {
```

Replace the test body with a direct `resolveDataPathCore({ nameMode: "internal", ... })` assertion, because the local `resolve(...)` helper calls the YAML validation wrapper:

```ts
const result = resolveDataPathCore({
  value: "Объект.Товары.LineNumber",
  nameMode: "internal",
  index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
  ownerCache: ownerCache([
    owner({
      ref: { kind: "Документ", name: "Заказ" },
      rule: MetadataDocumentRules,
      model: {
        itemType: "MetadataDocument",
        tabularSections: [
          {
            itemType: "MetadataTabularSection",
            name: "Товары",
            attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
          },
        ],
      },
    }),
  ]),
})

expect(result).toMatchObject({
  status: "ok",
  target: {
    value: "Объект.Товары.LineNumber",
    segments: ["Объект", "Товары", "LineNumber"],
    source: { kind: "tableColumn", table: "Товары", name: "НомерСтроки" },
  },
  replacements: [{ segmentIndex: 2, from: "LineNumber", to: "НомерСтроки", reason: "standardMember" }],
})
```

- [ ] **Step 4: Add direct resolver YAML-mode rejection test**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, add:

```ts
it("rejects LineNumber in YAML mode", () => {
  const result = resolveDataPathCore({
    value: "Объект.Товары.LineNumber",
    nameMode: "yaml",
    index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
    ownerCache: ownerCache([
      owner({
        ref: { kind: "Документ", name: "Заказ" },
        rule: MetadataDocumentRules,
        model: {
          itemType: "MetadataDocument",
          tabularSections: [
            {
              itemType: "MetadataTabularSection",
              name: "Товары",
              attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
            },
          ],
        },
      }),
    ]),
  })

  expect(result).toMatchObject({
    status: "error",
    issues: [
      {
        code: "unknown_column",
        message: 'ПутьКДанным "Объект.Товары.LineNumber": неизвестная колонка "LineNumber"',
      },
    ],
  })
})
```

- [ ] **Step 5: Run validation-focused tests**

Run:

```bash
pnpm --filter @nkdk/core test -- validateForm.test.ts dataPath/resolver.test.ts
```

Expected: both test files pass.

- [ ] **Step 6: Commit validation behavior**

```bash
git add packages/core/metadata/validation/validateForm.test.ts packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/dataPath/objectFields.ts packages/core/metadata/validation/dataPath/coreResolver.ts
git commit -m "fix: :bug: валидировать DataPath в YAML-именах"
```

---

### Task 5: Project Import And Validation Check

**Files:**
- No source files expected.
- Uses generated YAML project `/Users/nikita/git/nkdk-yaml`.

**Interfaces:**
- Consumes: CLI command `pnpm --filter @nkdk/cli dev import <xml-dir> <yaml-dir>`
- Consumes: CLI command `pnpm --filter @nkdk/cli dev validate <yaml-dir>`
- Produces: manual verification that ERP import no longer leaves English standard names in YAML `DataPath`.

- [ ] **Step 1: Rebuild or type-check before CLI smoke**

Run:

```bash
pnpm --filter @nkdk/core test -- metadataPath/toYAML.test.ts metadataPath/fromYAML.test.ts clientApplicationForm/toYAML.test.ts clientApplicationForm/fromYAML.test.ts validateForm.test.ts dataPath/resolver.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Import ERP XML into YAML**

If `/Users/nikita/git/nkdk-yaml` contains user changes that must be preserved, stop and ask before overwriting. Otherwise run:

```bash
pnpm --filter @nkdk/cli dev import /Users/nikita/git/round-trip/erp /Users/nikita/git/nkdk-yaml
```

Expected: import completes without throwing.

- [ ] **Step 3: Check that YAML DataPath values no longer contain `.LineNumber`**

Run:

```bash
rg 'ПутьКДанным[^\\n]*LineNumber|ПутьКДаннымПодвала[^\\n]*LineNumber|ПутьКДаннымЗаголовка[^\\n]*LineNumber' /Users/nikita/git/nkdk-yaml
```

Expected: no matches.

If matches remain, inspect one file and trace whether that property is declared as `DataPath` in its `rules.ts`. If it is a `DataPath`, fix the export context. If it is not a `DataPath`, leave it for a separate metadata-target conversion task.

- [ ] **Step 4: Run validation on imported YAML**

Run:

```bash
pnpm --filter @nkdk/cli dev validate /Users/nikita/git/nkdk-yaml
```

Expected: `LineNumber` errors are gone. Other known errors may remain:

- empty `ЦветТекста` / `ЦветФона` in conditional appearance;
- string `"[Авто]"` in `ДинамическийСписок.Порядок.Элементы`.

- [ ] **Step 5: Run full project test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit verification-related source changes**

If Task 5 required source changes, commit them:

```bash
git add packages/core
git commit -m "fix: :bug: исправить импорт стандартных DataPath"
```

If Task 5 required no source changes, do not create an empty commit.

---

## Self-Review

- Spec coverage: covered XML -> YAML conversion, YAML -> XML conversion, YAML validation rejection, no special diagnostic, and regression checks for `/Users/nikita/git/round-trip/erp` to `/Users/nikita/git/nkdk-yaml`.
- Placeholder scan: no placeholder or open-ended implementation steps remain.
- Type consistency: the plan consistently uses `nameMode: "internal" | "yaml"`, `exportDataPathStandardMembersToYAML`, `importDataPathStandardMembersFromYAML`, `resolveDataPathCore`, and existing form import/export APIs.
