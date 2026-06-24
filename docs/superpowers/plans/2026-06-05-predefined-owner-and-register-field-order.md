# Predefined Owner And Register Field Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix YAML -> XML without reference so CHT predefined items keep owner context, accounting register `Dimension/Resource` fields use 1C-compatible order, and external data source cube `Dimension/Resource` does not export fields that 1C rejects for cubes.

**Architecture:** Keep the existing rule-based orchestration. Pass the current applied-object model as owner metadata when exporting external `filePath` properties, and add only local `order` values for accounting-specific register fields.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata `rules.ts` and orchestration helpers.

---

## File Structure

- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
  - Responsibility: export applied objects and their external `filePath` XML files. This is where external file export currently loses owner metadata.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
  - Responsibility: integration-style tests for applied-object sync. Add a regression test for owner context passed to external `filePath` exports.
- Modify `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`
  - Responsibility: rules for register dimensions. Add local XML order for accounting-only fields.
- Modify `packages/core/metadata/commonObjects/metadataRegisterDimension/toXML.test.ts`
  - Responsibility: XML export tests for register dimensions. Add a no-reference order regression test with accounting parent context.
- Modify `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`
  - Responsibility: rules for register resources. Add local XML order for accounting-only fields.
- Modify `packages/core/metadata/commonObjects/metadataRegisterResource/toXML.test.ts`
  - Responsibility: XML export tests for register resources. Add a no-reference order regression test with accounting parent context.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`
  - Responsibility: rules for external data source cube dimensions. Keep only the cube dimension XML field set observed in source XML.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`
  - Responsibility: rules for external data source cube resources. Keep only the cube resource XML field set observed in source XML.
- Modify focused tests for external data source cube dimension/resource rules.
  - Responsibility: prevent YAML -> XML without reference from adding shared register/attribute fields to cube children.
- Do not modify `/home/nikita/git/round-trip/**`.

## Task 1: Preserve Owner Context For External `filePath` XML

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`

- [ ] **Step 1: Add imports for the regression test**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`, add:

```ts
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
```

- [ ] **Step 2: Write the failing external Predefined owner test**

Append this test to `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`:

```ts
describe("syncAppliedObjectToXML — (з) owner context для filePath", () => {
  it("передаёт владельца во внешний Predefined.xml ПВХ без reference", async () => {
    const inputDir = join(tmpDir, "input")
    const outputDir = join(tmpDir, "output")
    const objectName = "ВидыСубконто"

    fs.mkdirSync(join(inputDir, objectName), { recursive: true })
    fs.writeFileSync(
      join(inputDir, objectName, "Свойства.yaml"),
      [
        "ТипЗначения:",
        "  - Строка(10)",
        "Предопределенные:",
        "  СубкнтоОдно:",
        '    Код: "000000001"',
        "    Наименование: Субкнто1",
        "    ТипЗначения: Строка(10)",
        "",
      ].join("\n"),
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule: MetadataChartOfCharacteristicTypesRules,
      context: mockContextToXML(),
      inputDir,
      name: objectName,
      outputDir,
    })

    const result = fs.readFileSync(join(outputDir, objectName, "Ext", "Predefined.xml"), "utf-8")
    expect(result).toContain('xsi:type="PlanOfCharacteristicKindPredefinedItems"')
    expect(result).not.toContain('xsi:type="CatalogPredefinedItems"')
    expect(result).toContain("<Type>")
    expect(result).toContain("<v8:Type>xs:string</v8:Type>")
    expect(result).toContain("<v8:Length>10</v8:Length>")
  })
})
```

- [ ] **Step 3: Run the focused test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/orchestration/appliedObject/syncToXML.test.ts -t "owner context"
```

Expected: FAIL. The output `Predefined.xml` contains `CatalogPredefinedItems`, or misses `<Type>`.

- [ ] **Step 4: Pass owner metadata into external file export**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, find the `exportPropertyToXML` call in the loop that writes `propRule.filePath` external files:

```ts
    const xmlFileObj = exportPropertyToXML({
      context: contextWithForms,
      rule: propRule as PropertyRule,
      value: valueToExport,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
```

Change it to:

```ts
    const xmlFileObj = exportPropertyToXML({
      context: contextWithForms,
      rule: propRule as PropertyRule,
      value: valueToExport,
      metadataItem: model,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
```

- [ ] **Step 5: Run the focused test and verify pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/orchestration/appliedObject/syncToXML.test.ts -t "owner context"
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts
git commit -m "fix: :bug: передать владельца внешним XML"
```

## Task 2: Order Accounting Register Dimension Fields

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`

- [ ] **Step 1: Write the failing no-reference order test**

Append this test to `packages/core/metadata/commonObjects/metadataRegisterDimension/toXML.test.ts`:

```ts
  it("exports accounting fields before common tail without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      itemsTree: [
        {
          itemType: "MetadataAccountingRegister",
          name: "РегистрБухгалтерииВсеСвойстваОбороты",
          path: "MetadataAccountingRegister.РегистрБухгалтерииВсеСвойстваОбороты",
        },
      ],
      value: [
        {
          itemType: "MetadataRegisterDimension",
          name: "ИзмерениеВсеСвойства",
          type: { type: ["boolean"] },
          choiceHistoryOnInput: "DontUse",
          balance: false,
          accountingFlag: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
          denyIncompleteValues: false,
          indexing: "DontIndex",
          fullTextSearch: "DontUse",
        },
      ],
      xmlRootTag: "Dimension",
      referenceMetadata: undefined,
    })

    expect(result).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>false<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<DenyIncompleteValues>false<\/DenyIncompleteValues>[\s\S]*<Indexing>DontIndex<\/Indexing>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterDimension/toXML.test.ts -t "accounting fields"
```

Expected: FAIL because `Balance` and `AccountingFlag` appear after `FullTextSearch`.

- [ ] **Step 3: Add local order for dimension accounting fields**

In `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`, update only these properties:

```ts
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 26,
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 26,
    },
```

Keep `denyIncompleteValues.order` as `26`. Stable property insertion order in `MetadataRegisterDimensionRules` then produces:

```text
balance -> accountingFlag -> denyIncompleteValues
```

- [ ] **Step 4: Run the focused test and verify pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterDimension/toXML.test.ts -t "accounting fields"
```

Expected: PASS.

- [ ] **Step 5: Run the full dimension XML test file**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterDimension/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts packages/core/metadata/commonObjects/metadataRegisterDimension/toXML.test.ts
git commit -m "fix: :bug: упорядочить поля измерений регистра"
```

## Task 3: Order Accounting Register Resource Fields

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`

- [ ] **Step 1: Write the failing no-reference order test**

Append this test to `packages/core/metadata/commonObjects/metadataRegisterResource/toXML.test.ts`:

```ts
  it("exports accounting fields before full text search without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      itemsTree: [
        {
          itemType: "MetadataAccountingRegister",
          name: "РегистрБухгалтерииВсеСвойстваОбороты",
          path: "MetadataAccountingRegister.РегистрБухгалтерииВсеСвойстваОбороты",
        },
      ],
      value: [
        {
          itemType: "MetadataRegisterResource",
          name: "РесурсВсеСвойства",
          type: { type: ["number"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
          choiceHistoryOnInput: "DontUse",
          balance: true,
          accountingFlag: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
          extDimensionAccountingFlag:
            "ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоВсеСвойства",
          fullTextSearch: "DontUse",
        },
      ],
      xmlRootTag: "Resource",
      referenceMetadata: undefined,
    })

    expect(result).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>true<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<ExtDimensionAccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.ExtDimensionAccountingFlag\.ПризнакУчетаСубконтоВсеСвойства<\/ExtDimensionAccountingFlag>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterResource/toXML.test.ts -t "accounting fields"
```

Expected: FAIL because `FullTextSearch` appears before `Balance`.

- [ ] **Step 3: Add local order for resource accounting fields**

In `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`, update only these properties:

```ts
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 26,
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 26,
    },
    extDimensionAccountingFlag: {
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 26,
    },
```

`fullTextSearch.order` remains `28`, so accounting resource fields are emitted before it.

- [ ] **Step 4: Run the focused test and verify pass**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterResource/toXML.test.ts -t "accounting fields"
```

Expected: PASS.

- [ ] **Step 5: Run the full resource XML test file**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataRegisterResource/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts packages/core/metadata/commonObjects/metadataRegisterResource/toXML.test.ts
git commit -m "fix: :bug: упорядочить поля ресурсов регистра"
```

## Task 4: Remove Shared Register/Attribute Fields From External Data Source Cube Children

**Confirmed root cause:**
- Source `/home/nikita/git/round-trip/all` loads into 1C without warnings.
- Generated YAML -> XML without reference emits extra fields in `/tmp/round-trip-yaml-1c-xml/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml`.
- Removing those extra fields from only that generated file makes `ibcmd infobase config import` load without `Wrong property ... Dimension/Resource` warnings.
- Accounting register `Dimension/Resource` is not the source of the remaining warnings.

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`
- Modify focused tests for these two common objects.

- [ ] **Step 1: Add no-reference regression tests for cube dimension/resource**

Tests must prove that exporting `ExternalDataSource.Cube.Dimension` does not write:

```text
Balance
BaseDimension
DataHistory
DenyIncompleteValues
FullTextSearch
Indexing
MainFilter
Master
TypeReductionMode
UseInTotals
```

Tests must prove that exporting `ExternalDataSource.Cube.Resource` does not write:

```text
Balance
ChoiceFoldersAndItems
ChoiceHistoryOnInput
CreateOnInput
DataHistory
FillChecking
FillFromFillingValue
FullTextSearch
Indexing
```

- [ ] **Step 2: Split cube dimension/resource rules from shared register/attribute rules**

Do not blacklist fields at the final XML string level. The cube child rules must describe the actual cube XML model.

Use the source XML as the field-set reference:

```text
/home/nikita/git/round-trip/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml
```

Allowed cube dimension fields are the fields present under source `<Cube>/<Properties>/<Dimension>/<Properties>`.

Allowed cube resource fields are the fields present under source `<Cube>/<Properties>/<Resource>/<Properties>`.

- [ ] **Step 3: Verify by focused tests**

Run focused tests for external data source cube dimension/resource.

Expected: no generated XML contains the rejected fields above for cube children.

## Task 5: Verify YAML -> XML -> 1C Diagnostics On `all`

**Files:**
- No code edits in this task.

- [ ] **Step 1: Run focused regression suite**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/orchestration/appliedObject/syncToXML.test.ts metadata/commonObjects/metadataRegisterDimension/toXML.test.ts metadata/commonObjects/metadataRegisterResource/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 3: Run round-trip-yaml-1c diagnostic on all**

Run from repository root:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected:

- `nkdk import` succeeds.
- `nkdk sync` succeeds.
- The 1C log no longer contains:

```text
Type of predefined characteristic type does not match the type of chart of characteristic types
Wrong property of metadata object. Property Balance is not one of metadata object Dimension
Wrong property of metadata object. Property Balance is not one of metadata object Resource
```

If the run still fails because `/home/nikita/git/round-trip/all/CommonForms/ДинамическийСписок/Ext/Form.xml` has invalid data path `СОсновнойТаблицей.ЭтоГруппа`, record that as the known external blocker from the spec and keep the generated XML/log paths in the final report.

- [ ] **Step 4: Inspect generated XML snippets**

Run:

```bash
sed -n '1,80p' /tmp/round-trip-yaml-1c-xml/all/ChartsOfCharacteristicTypes/ВидыСубконто/Ext/Predefined.xml
sed -n '520,560p' /tmp/round-trip-yaml-1c-xml/all/AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml
sed -n '640,660p' /tmp/round-trip-yaml-1c-xml/all/AccountingRegisters/РегистрБухгалтерииВсеСвойстваОбороты.xml
```

Expected:

```text
xsi:type="PlanOfCharacteristicKindPredefinedItems"
<Type>
ChoiceHistoryOnInput -> Balance -> AccountingFlag -> DenyIncompleteValues
ChoiceHistoryOnInput -> Balance -> AccountingFlag -> ExtDimensionAccountingFlag -> FullTextSearch
```

- [ ] **Step 5: Finish verification bookkeeping**

If Task 5 does not require code edits, do not create an empty commit. If Task 5 reveals a new defect, stop and write down:

- exact failing command;
- generated XML path;
- 1C log excerpt;
- whether the defect is from generated XML or from the source `/home/nikita/git/round-trip/all` set.

## Self-Review

- Spec coverage: Task 1 covers external `Predefined.xml` owner context and CHT `<Type>` export; Tasks 2-3 cover `Dimension/Resource` accounting field order; Task 4 covers external data source cube `Dimension/Resource` field sets; Task 5 covers focused tests, full tests, and `round-trip-yaml-1c`.
- Placeholder scan: no `TBD`, no open-ended “write tests”, and every code-changing step includes exact snippets.
- Type consistency: property names match existing register rules: `balance`, `accountingFlag`, `extDimensionAccountingFlag`, `denyIncompleteValues`, `fullTextSearch`; cube rules must keep their own XML field set instead of reusing register/attribute-only fields.
