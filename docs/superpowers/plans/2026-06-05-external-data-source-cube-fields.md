# External Data Source Cube Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop YAML -> XML without reference from adding non-cube `Dimension/Resource` fields to external data source cubes, removing 1C warnings `Wrong property ... Dimension/Resource`.

**Architecture:** Keep the existing rule-based metadata orchestration. Do not post-process XML strings; instead, make `MetadataExternalDataSourceCubeDimensionRules` and `MetadataExternalDataSourceCubeResourceRules` describe the real cube field set. Fields that are shared with other object kinds but absent from cube XML must not be emitted from defaults; if they are ever present in imported YAML, they may still round-trip through `toXML: hasOwnMetadataProperty(...)`.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata `rules.ts`, existing `testExportPropertyToXML` helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts`
  - Responsibility: XML tests for cube dimensions. Add no-reference export regression for fields that `ibcmd` rejects on cube dimensions.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`
  - Responsibility: rules for cube dimensions. Prevent non-cube defaults from being exported without reference.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts`
  - Responsibility: XML tests for cube resources. Add no-reference export regression for fields that `ibcmd` rejects on cube resources.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`
  - Responsibility: rules for cube resources. Prevent non-cube defaults from being exported without reference.
- Do not modify `/home/nikita/git/round-trip/**`.

## Context

Control checks already performed:

- Source `/home/nikita/git/round-trip/all` loads into a fresh 1C file base without warnings.
- Generated YAML -> XML without reference emits extra fields in:

```text
/tmp/round-trip-yaml-1c-xml/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml
```

- Removing only the extra cube `Dimension/Resource` fields from that generated file makes `ibcmd infobase config import` load without `Wrong property ... Dimension/Resource` warnings.
- Search in `/home/nikita/git/round-trip/*/ExternalDataSources` does not find these non-cube fields in real external data source cube `Dimension/Resource` XML:

```text
BaseDimension
UseInTotals
MainFilter
TypeReductionMode
Balance
DataHistory
Indexing
FullTextSearch
```

## Task 1: Add Cube Dimension No-Reference Regression

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts`

- [ ] **Step 1: Add the failing dimension test**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts`, append this test inside `describe("MetadataExternalDataSourceCubeDimension XML", () => { ... })`:

```ts
  it("does not export non-cube dimension defaults without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        name: "ИзмерениеКуба",
        type: { type: ["string"] },
      },
      xmlRootTag: "Dimension",
      referenceMetadata: undefined,
    })

    expect(result).not.toContain("<Balance>")
    expect(result).not.toContain("<BaseDimension>")
    expect(result).not.toContain("<DataHistory>")
    expect(result).not.toContain("<DenyIncompleteValues>")
    expect(result).not.toContain("<FullTextSearch>")
    expect(result).not.toContain("<Indexing>")
    expect(result).not.toContain("<MainFilter>")
    expect(result).not.toContain("<Master>")
    expect(result).not.toContain("<TypeReductionMode>")
    expect(result).not.toContain("<UseInTotals>")
  })
```

- [ ] **Step 2: Run the dimension test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts -t "non-cube dimension defaults"
```

Expected: FAIL because the exported XML contains at least `<Balance>`, `<BaseDimension>`, `<DataHistory>`, `<DenyIncompleteValues>`, `<FullTextSearch>`, `<Indexing>`, `<MainFilter>`, `<Master>`, `<TypeReductionMode>`, or `<UseInTotals>`.

## Task 2: Fix Cube Dimension Defaults

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`
- Test: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts`

- [ ] **Step 1: Gate non-cube dimension fields by actual metadata presence**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`, update only these property rules by adding `toXML: hasOwnMetadataProperty("<propertyKey>")`:

```ts
    denyIncompleteValues: {
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: hasOwnMetadataProperty("denyIncompleteValues"),
    },
    baseDimension: {
      yaml: "БазовоеИзмерение",
      xml: "BaseDimension",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: hasOwnMetadataProperty("baseDimension"),
    },
    useInTotals: {
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: hasOwnMetadataProperty("useInTotals"),
    },
    master: {
      yaml: "Ведущее",
      xml: "Master",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: hasOwnMetadataProperty("master"),
    },
    mainFilter: {
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: hasOwnMetadataProperty("mainFilter"),
    },
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: hasOwnMetadataProperty("balance"),
    },
    typeReductionMode: {
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      type: "SystemEnumeration",
      typeSE: "TypeReductionMode",
      xmlParents: propertiesParents,
      defaultValueXML: "TransformValues",
      defaultValueYAML: "TransformValues",
      toXML: hasOwnMetadataProperty("typeReductionMode"),
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
      xmlParents: propertiesParents,
      defaultValueXML: "DontIndex",
      defaultValueYAML: "DontIndex",
      toXML: hasOwnMetadataProperty("indexing"),
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
      toXML: hasOwnMetadataProperty("fullTextSearch"),
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
      toXML: hasOwnMetadataProperty("dataHistory"),
    },
```

Do not add `toXML` gates to dimension fields that exist in source cube XML, such as `FillFromFillingValue`, `FillChecking`, `ChoiceFoldersAndItems`, `CreateOnInput`, `ChoiceHistoryOnInput`, `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `ChoiceForm`, and `LinkByType`.

- [ ] **Step 2: Run the dimension tests and verify pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit dimension fix**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts
git commit -m "fix: :bug: не выгружать лишние поля измерений куба"
```

## Task 3: Add Cube Resource No-Reference Regression

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts`

- [ ] **Step 1: Add the failing resource test**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts`, append this test inside `describe("MetadataExternalDataSourceCubeResource XML", () => { ... })`:

```ts
  it("does not export non-cube resource defaults without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        name: "РесурсКуба",
        type: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
        nameInDataSource: "ResourceInDataSource",
      },
      xmlRootTag: "Resource",
      referenceMetadata: undefined,
    })

    expect(result).not.toContain("<Balance>")
    expect(result).not.toContain("<ChoiceFoldersAndItems>")
    expect(result).not.toContain("<ChoiceHistoryOnInput>")
    expect(result).not.toContain("<CreateOnInput>")
    expect(result).not.toContain("<DataHistory>")
    expect(result).not.toContain("<FillChecking>")
    expect(result).not.toContain("<FillFromFillingValue>")
    expect(result).not.toContain("<FullTextSearch>")
    expect(result).not.toContain("<Indexing>")
  })
```

- [ ] **Step 2: Run the resource test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts -t "non-cube resource defaults"
```

Expected: FAIL because the exported XML contains at least `<Balance>`, `<ChoiceFoldersAndItems>`, `<ChoiceHistoryOnInput>`, `<CreateOnInput>`, `<DataHistory>`, `<FillChecking>`, `<FillFromFillingValue>`, `<FullTextSearch>`, or `<Indexing>`.

## Task 4: Fix Cube Resource Defaults

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`
- Test: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts`

- [ ] **Step 1: Gate inherited resource fields that do not exist in source cube resource XML**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`, add overrides after `...externalDataSourceFieldBaseProperties` and before the existing `minValue` override:

```ts
    fillFromFillingValue: {
      ...externalDataSourceFieldBaseProperties.fillFromFillingValue,
      toXML: hasOwnMetadataProperty("fillFromFillingValue"),
    },
    fillChecking: {
      ...externalDataSourceFieldBaseProperties.fillChecking,
      toXML: hasOwnMetadataProperty("fillChecking"),
    },
    createOnInput: {
      ...externalDataSourceFieldBaseProperties.createOnInput,
      toXML: hasOwnMetadataProperty("createOnInput"),
    },
    choiceHistoryOnInput: {
      ...externalDataSourceFieldBaseProperties.choiceHistoryOnInput,
      toXML: hasOwnMetadataProperty("choiceHistoryOnInput"),
    },
```

- [ ] **Step 2: Gate resource-specific fields that do not exist in source cube resource XML**

In the same file, update these existing property rules:

```ts
    choiceFoldersAndItems: {
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Items",
      defaultValueYAML: "Items",
      toXML: hasOwnMetadataProperty("choiceFoldersAndItems"),
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
      toXML: hasOwnMetadataProperty("fullTextSearch"),
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
      xmlParents: propertiesParents,
      defaultValueXML: "DontIndex",
      defaultValueYAML: "DontIndex",
      toXML: hasOwnMetadataProperty("indexing"),
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
      toXML: hasOwnMetadataProperty("dataHistory"),
    },
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: hasOwnMetadataProperty("balance"),
    },
```

Do not gate resource fields that exist in source cube resource XML and are required for correct export, such as `ChoiceParameterLinks`, `ChoiceParameters`, `QuickChoice`, `ChoiceForm`, `ExtendedEdit`, and `NameInDataSource`.

- [ ] **Step 3: Run the resource tests and verify pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit resource fix**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts
git commit -m "fix: :bug: не выгружать лишние поля ресурсов куба"
```

## Task 5: Verify Round-Trip And 1C Loading

**Files:**
- No planned code edits.

- [ ] **Step 1: Run focused cube tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataExternalDataSourceCubeDimension/fromXML.test.ts metadata/commonObjects/metadataExternalDataSourceCubeResource/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run external data source tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/metadataExternalDataSource
```

Expected: PASS.

- [ ] **Step 3: Run project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Run YAML -> XML -> 1C diagnostic on `all`**

Run from repository root:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected:

```text
=== Загрузка в 1С прошла успешно ===
```

The 1C log `/tmp/round-trip-yaml-1c-ibcmd.log` must not contain:

```text
Wrong property of metadata object. Property Balance is not one of metadata object Dimension
Wrong property of metadata object. Property Balance is not one of metadata object Resource
Wrong property of metadata object. Property DataHistory is not one of metadata object Dimension
Wrong property of metadata object. Property DataHistory is not one of metadata object Resource
```

- [ ] **Step 5: Inspect generated cube XML**

Run:

```bash
rg "<(Balance|BaseDimension|DataHistory|DenyIncompleteValues|FullTextSearch|Indexing|MainFilter|Master|TypeReductionMode|UseInTotals)>" /tmp/round-trip-yaml-1c-xml/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml -n
```

Expected: no matches.

- [ ] **Step 6: Inspect generated cube resource XML**

Run:

```bash
sed -n '173,253p' /tmp/round-trip-yaml-1c-xml/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml
```

Expected: inside `<Resource>` blocks there are no `Balance`, `ChoiceFoldersAndItems`, `ChoiceHistoryOnInput`, `CreateOnInput`, `DataHistory`, `FillChecking`, `FillFromFillingValue`, `FullTextSearch`, or `Indexing` tags.

- [ ] **Step 7: Commit verification note if needed**

If no files changed during verification, do not create an empty commit. If the plan document is updated with new diagnostic facts, run:

```bash
git add docs/superpowers/plans/2026-06-05-external-data-source-cube-fields.md
git commit -m "docs: :memo: уточнить проверку полей куба внешнего источника"
```

## Self-Review

- Spec coverage: Task 1-2 cover `Cube.Dimension` rejected fields; Task 3-4 cover `Cube.Resource` rejected fields; Task 5 covers focused tests, broader external data source tests, full project tests, and `round-trip-yaml-1c` verification.
- Placeholder scan: no placeholder markers, no open-ended "write tests", and every code-changing step includes exact snippets.
- Type consistency: property keys match current rules: `denyIncompleteValues`, `baseDimension`, `useInTotals`, `master`, `mainFilter`, `balance`, `typeReductionMode`, `indexing`, `fullTextSearch`, `dataHistory`, `fillFromFillingValue`, `fillChecking`, `createOnInput`, `choiceHistoryOnInput`, `choiceFoldersAndItems`.
