# Metadata Attribute Allowed Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make YAML schema validation use one shared allowed type list for ordinary metadata attributes, including document attributes, tabular section attributes, and chart-of-characteristic-types attributes.

**Architecture:** Keep the allowed type contract in `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, because it belongs to the shared `MetadataAttribute` domain. Rename `CATALOG_ATTRIBUTE_ALLOWED_TYPES` to `METADATA_ATTRIBUTE_ALLOWED_TYPES`, apply it to all ordinary `MetadataAttribute` rule variants, and do not add `*Ссылка` YAML aliases to `TypeDescription`.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, pnpm workspace.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`: rename the shared allowed type list and attach it to `MetadataAttributeRules`, `MetadataCatalogAttributeRules`, `MetadataDocumentAttributeRules`, and `MetadataTabularSectionAttributeRules`.
- Modify `packages/core/metadata/validation/projectFileSchema.test.ts`: replace the old broad document-attribute expectation with strict schema tests for catalog, document, tabular section, chart-of-characteristic-types, and chart-of-characteristic-types tabular section attributes.
- Modify `packages/core/metadata/validation/validateProject.test.ts`: add integration-level validation tests proving `СправочникСсылка.*` is rejected before `sync`.
- Use existing helpers only. Do not change `packages/core/metadata/commonObjects/typeDescription/allowedTypes.ts`; `СправочникСсылка.*` must stay unsupported in YAML schema.

## Task 1: Add Failing Schema Tests

**Files:**
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`

- [ ] **Step 1: Replace the broad document test with strict ordinary-attribute schema tests**

In `packages/core/metadata/validation/projectFileSchema.test.ts`, replace the whole test named `"keeps document attribute TypeDescription broad in the first version"` with this block:

```ts
  it.each([
    {
      label: "catalog attribute",
      filePath: "Справочник/Товары/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "document attribute",
      filePath: "Документ/Заказ/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "document tabular section attribute",
      filePath: "Документ/Заказ/Свойства.yaml",
      validText: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ].join("\n"),
      invalidText: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: СправочникСсылка.Номенклатура",
      ].join("\n"),
    },
    {
      label: "chart of characteristic types attribute",
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      validText: ["Реквизиты:", "  Контрагент:", "    Тип: Справочник.Контрагенты"].join("\n"),
      invalidText: ["Реквизиты:", "  Контрагент:", "    Тип: СправочникСсылка.Контрагенты"].join("\n"),
    },
    {
      label: "chart of characteristic types tabular section attribute",
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      validText: [
        "ТабличныеЧасти:",
        "  Значения:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ].join("\n"),
      invalidText: [
        "ТабличныеЧасти:",
        "  Значения:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: СправочникСсылка.Номенклатура",
      ].join("\n"),
    },
  ])("validates allowed TypeDescription values for $label", ({ filePath, validText, invalidText }) => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath,
        mode: "inline",
      })
    )

    expect(validateFile({ filePath, schema, text: validText })).toEqual([])
    expect(validateFile({ filePath, schema, text: invalidText })).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: ["Реквизиты:", "  Неверный:", "    Тип: НесуществующийТип"].join("\n"),
      })
    ).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: ["Реквизиты:", "  Таблица:", "    Тип:", "      - Строка", "      - ХранилищеЗначения"].join("\n"),
      })
    ).not.toEqual([])
    expect(
      validateFile({
        filePath,
        schema,
        text: [
          "Реквизиты:",
          "  Идентификатор:",
          "    Тип:",
          "      ИдентификаторТипа:",
          "        - 8c1e3694-da12-44d5-8b1f-d134b89a1282",
        ].join("\n"),
      })
    ).not.toEqual([])
  })
```

Keep the existing `"validates catalog attribute TypeDescription with catalog-specific restrictions"` test for now. It overlaps, but it protects the current catalog behavior while this task is still red.

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: FAIL. The new cases for document attributes, tabular section attributes, and chart-of-characteristic-types attributes will accept `СправочникСсылка.*` or `НесуществующийТип` because their `TypeDescription` rules are still broad.

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "test: 🧪 зафиксировать типы реквизитов"
```

## Task 2: Apply Shared Allowed Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`

- [ ] **Step 1: Rename the constant**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, rename:

```ts
export const CATALOG_ATTRIBUTE_ALLOWED_TYPES = [
```

to:

```ts
export const METADATA_ATTRIBUTE_ALLOWED_TYPES = [
```

Do not change the array contents.

- [ ] **Step 2: Apply the shared list to all ordinary attribute rules**

In the same file, update `MetadataAttributeRules`, `MetadataCatalogAttributeRules`, `MetadataDocumentAttributeRules`, and `MetadataTabularSectionAttributeRules`.

The relevant sections should look like this after the edit:

```ts
export const MetadataAttributeRules = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: attributeExternalMetadata,
  properties: {
    ...commonAttributeProperties,
    type: {
      ...commonAttributeProperties.type,
      allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES,
    },
    ...fillProperties,
    use: systemEnumerationRule({
```

```ts
export const MetadataCatalogAttributeRules = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: attributeExternalMetadata,
  properties: {
    ...commonAttributeProperties,
    type: {
      ...commonAttributeProperties.type,
      allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES,
    },
    ...fillProperties,
    use: systemEnumerationRule({
```

```ts
export const MetadataDocumentAttributeRules = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: attributeExternalMetadata,
  properties: {
    ...commonAttributeProperties,
    type: {
      ...commonAttributeProperties.type,
      allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES,
    },
    ...fillProperties,
    ...binaryDataStorageLocationUseFieldProperty,
  },
} as const satisfies MetadataItemRule
```

```ts
export const MetadataTabularSectionAttributeRules = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: attributeExternalMetadata,
  properties: {
    ...commonAttributeProperties,
    type: {
      ...commonAttributeProperties.type,
      allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES,
    },
    ...fillProperties,
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 3: Search for the old name**

Run:

```bash
rg "CATALOG_ATTRIBUTE_ALLOWED_TYPES" packages/core
```

Expected: no matches.

- [ ] **Step 4: Run the schema test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit the implementation**

```bash
git add packages/core/metadata/commonObjects/metadataAttribute/rules.ts
git commit -m "fix: 🐛 ограничить типы реквизитов"
```

## Task 3: Add Project Validation Coverage and Verify Real Export

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Runtime check: `/Users/nikita/git/test-yaml`

- [ ] **Step 1: Add project validation tests for canonical and non-canonical link type names**

In `packages/core/metadata/validation/validateProject.test.ts`, add these tests near the existing document `implicitValueYAML` validation tests:

```ts
  it("rejects non-canonical document attribute reference type names", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: СправочникСсылка.Контрагенты",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: СправочникСсылка.Номенклатура",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
          path: "/Реквизиты/Контрагент/Тип",
          source: "structure",
          severity: "error",
        }),
        expect.objectContaining({
          filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
          path: "/ТабличныеЧасти/Товары/Реквизиты/Номенклатура/Тип",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })

  it("accepts canonical document attribute reference type names", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: Справочник.Контрагенты",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: Справочник.Номенклатура",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects non-canonical chart of characteristic types attribute reference type names", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml", [
      "Реквизиты:",
      "  Контрагент:",
      "    Тип: СправочникСсылка.Контрагенты",
      "ТабличныеЧасти:",
      "  Значения:",
      "    Реквизиты:",
      "      Номенклатура:",
      "        Тип: СправочникСсылка.Номенклатура",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "ПланВидовХарактеристик/ВидыСубконто/Свойства.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "ПланВидовХарактеристик", "ВидыСубконто", "Свойства.yaml"),
          path: "/Реквизиты/Контрагент/Тип",
          source: "structure",
          severity: "error",
        }),
        expect.objectContaining({
          filePath: join(projectDir, "ПланВидовХарактеристик", "ВидыСубконто", "Свойства.yaml"),
          path: "/ТабличныеЧасти/Значения/Реквизиты/Номенклатура/Тип",
          source: "structure",
          severity: "error",
        }),
      ])
    )
  })
```

- [ ] **Step 2: Run project validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run focused schema and project validation tests together**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 4: Commit validation coverage**

```bash
git add packages/core/metadata/validation/validateProject.test.ts
git commit -m "test: 🧪 проверить типы реквизитов проекта"
```

- [ ] **Step 5: Run full test suite**

Run from `/Users/nikita/git/nkdk/.worktrees/implicit-value-yaml-schema`:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 6: Run validation on the real YAML project**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /Users/nikita/git/test-yaml
```

Expected: non-zero exit because `/Users/nikita/git/test-yaml` still contains existing YAML violations. The diagnostics must include structure errors for `СправочникСсылка.*` under `Документ/ПоступлениеТоваровУслуг/Свойства.yaml`; the previous `sync` failure should now be visible at validation time.

- [ ] **Step 7: Run export to confirm it still stops on invalid source YAML**

Run:

```bash
pnpm --filter @nakidka/cli dev sync /Users/nikita/git/test-yaml /Users/nikita/git/test-xml
```

Expected: if `sync` does not run validation internally, it may still fail with `Type СправочникСсылка.Контрагенты not found in TypeDescriptionRules`. Record the observed output in the final report. Do not change `/Users/nikita/git/test-yaml` or `/Users/nikita/git/test-xml` as part of this plan.

## Self-Review

- Spec coverage: The plan covers the no-alias decision, the constant rename, application to document/tabular section/PVH attributes, schema tests, project validation tests, and full `pnpm test`.
- Placeholder scan: No placeholder tasks remain; every code change step includes exact code or exact commands.
- Type consistency: The plan uses the final constant name `METADATA_ATTRIBUTE_ALLOWED_TYPES` everywhere after the rename and keeps canonical YAML type names as `Справочник.*`.
