# Remaining Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining ERP round-trip diffs for standard attribute order, empty singleton names, and typed decimal report form fields.

**Architecture:** Keep XML reference metadata as the preservation boundary. Make three narrow changes: reference order for `StandardAttributeDescriptions`, exact empty names for singleton references, and numeric typed XML rules for report form fields.

**Tech Stack:** TypeScript, Vitest, `round-trip-xml`, metadata rules, form element orchestration.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`: add a focused reference-order export test.
- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`: preserve `referenceMetadata` item order when exporting standard attributes.
- Modify `packages/core/metadata/forms/elements/singletonNameReference.test.ts`: add a focused empty-name singleton reference test.
- Modify `packages/core/metadata/orchestration/formElement/singletonName.ts`: treat empty XML singleton names as exact reference names.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`: add focused decimal import assertions.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`: add focused decimal export assertions.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`: change `reportResult` and `detailsData` to typed number XML fields.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`: update report form type aliases only if TypeScript requires it after the rule change.

Do not change XML fixtures in `/Users/nikita/git/round-trip-source`.

---

### Task 1: Preserve StandardAttribute Reference Order

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`

- [ ] **Step 1: Add the failing reference-order test**

In `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`, add this test inside `describe("exportStandardAttributeDescriptionsToXML", () => { ... })`:

```ts
  it("keeps reference order when exporting standard attributes", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: {
        RecordType: "ВидДвижения",
        Active: "Активность",
        LineNumber: "НомерСтроки",
      },
    }
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlString: `
        <StandardAttributes>
          <xr:StandardAttribute name="Active">
            <xr:Comment>existing active comment</xr:Comment>
          </xr:StandardAttribute>
          <xr:StandardAttribute name="LineNumber"/>
          <xr:StandardAttribute name="RecordType"/>
        </StandardAttributes>
      `,
      xmlRootTag: "StandardAttributes",
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: [{ itemType: "StandardAttributeDescription", name: "Active", comment: "changed" }],
      referenceMetadata,
      xmlRootTag: "StandardAttributes",
    })

    expect(result.indexOf('name="Active"')).toBeLessThan(result.indexOf('name="LineNumber"'))
    expect(result.indexOf('name="LineNumber"')).toBeLessThan(result.indexOf('name="RecordType"'))
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/standardAttributeDescription -t "keeps reference order"
```

Expected: FAIL because `RecordType` is exported before `Active` or `LineNumber`.

- [ ] **Step 3: Preserve reference order in export**

In `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`, replace the `names` construction in `exportStandardAttributeDescriptionsToXML` with this version:

```ts
  const names =
    referenceNames.length > 0
      ? [...referenceNames, ...modelNames.filter((name) => !referenceNames.includes(name))]
      : Array.from(new Set(!isGroupChanged ? modelNames : [...canonicalNames, ...modelNames]))
```

Keep the rest of the function unchanged.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/standardAttributeDescription -t "keeps reference order"
```

Expected: PASS.

- [ ] **Step 5: Run the standard attribute test file**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/standardAttributeDescription
```

Expected: PASS for all `standardAttributeDescription` tests.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts
git commit -m "fix: :bug: сохранить порядок стандартных реквизитов"
```

---

### Task 2: Preserve Empty Singleton Reference Names

**Files:**
- Modify: `packages/core/metadata/forms/elements/singletonNameReference.test.ts`
- Modify: `packages/core/metadata/orchestration/formElement/singletonName.ts`

- [ ] **Step 1: Add the failing empty-name singleton test**

In `packages/core/metadata/forms/elements/singletonNameReference.test.ts`, add this test next to `keeps root AutoCommandBar FormCommandBar name`:

```ts
  it("keeps root AutoCommandBar empty reference name", () => {
    const rule = { type: "AutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "",
      _id: "-1",
    })

    const result = exportWithReference({
      context: mockContextToXML(),
      rule,
      value: { itemType: "AutoCommandBar", childItems: [] },
      reference,
    })

    expect(result._name).toBe("")
    expect(result._id).toBe("-1")
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements/singletonNameReference.test.ts -t "empty reference name"
```

Expected: FAIL because the exported name is `ФормаКоманднаяПанель`.

- [ ] **Step 3: Recognize empty singleton names as exact reference names**

In `packages/core/metadata/orchestration/formElement/singletonName.ts`, update `getModeFromXML` after the `xmlName === undefined` guard:

```ts
  if (xmlName === "") return { kind: "exact", name: "" }
```

The beginning of the function should look like this:

```ts
const getModeFromXML = (params: {
  xmlName: string | undefined
  ownerXmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): ReferenceNameMode | undefined => {
  const { xmlName, ownerXmlName, nameStyle } = params
  if (xmlName === undefined || nameStyle === undefined) return undefined
  if (xmlName === "") return { kind: "exact", name: "" }

  const suffixes = [...nameStyle.referenceSuffixes].sort((left, right) => right.length - left.length)
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements/singletonNameReference.test.ts -t "empty reference name"
```

Expected: PASS.

- [ ] **Step 5: Run singleton name tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements/singletonNameReference.test.ts metadata/orchestration/formElement/singletonName.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/forms/elements/singletonNameReference.test.ts packages/core/metadata/orchestration/formElement/singletonName.ts
git commit -m "fix: :bug: сохранить пустое имя singleton"
```

---

### Task 3: Import ReportResult And DetailsData As Typed Numbers

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`

- [ ] **Step 1: Add the failing decimal import test**

In `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`, add this test inside `describe("importClientApplicationFormFromXML", () => { ... })`:

```ts
  it("imports decimal report result fields as numbers", () => {
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: {
        ReportResult: { "_xsi:type": "xs:decimal", "#text": "3" },
        DetailsData: { "_xsi:type": "xs:decimal", "#text": "0" },
      },
      xmlMetadata: { Form: { Properties: {} } },
    })

    expect(result.reportResult).toBe(3)
    expect(result.detailsData).toBe(0)
  })
```

- [ ] **Step 2: Add the failing decimal export test**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, add this test inside `describe("exportClientApplicationFormToXML", () => { ... })`:

```ts
    it("exports decimal report result fields with xsi type", () => {
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: {
          itemType: "ClientApplicationForm",
          reportResult: 3,
          detailsData: 0,
          childItems: [],
          commands: [],
        },
        referenceForm: undefined,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toContain('<ReportResult xsi:type="xs:decimal">3</ReportResult>')
      expect(result).toContain('<DetailsData xsi:type="xs:decimal">0</DetailsData>')
    })
```

- [ ] **Step 3: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm -t "decimal report result"
```

Expected: FAIL. Import currently returns strings or untyped values, and export currently omits `xsi:type`.

- [ ] **Step 4: Change report form field rules to typed numbers**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, replace the `reportResult` and `detailsData` rules with:

```ts
    reportResult: {
      yaml: "РезультатОтчета",
      xml: "ReportResult",
      type: "number",
      typedXML: true,
      tag: FormRulesTags.Form,
    },
    detailsData: {
      yaml: "ДанныеРасшифровки",
      xml: "DetailsData",
      type: "number",
      typedXML: true,
      tag: FormRulesTags.Form,
    },
```

- [ ] **Step 5: Update local report form type aliases only if TypeScript requires it**

If TypeScript reports that the local report form aliases conflict with the new rules, update the `ReportFormClientApplicationForm` and `ReportFormClientApplicationFormYAML` aliases to use numbers for these two fields:

```ts
type ReportFormClientApplicationForm = ClientApplicationForm & {
  reportResult: number
  detailsData: number
  reportFormType: "Main"
  variantAppearance: string
  autoShowState: "Auto"
  customSettingsFolder: string
  reportResultViewMode: "Auto"
  viewModeApplicationOnSetReportResult: "Auto"
}

type ReportFormClientApplicationFormYAML = ClientApplicationFormYAML & {
  РезультатОтчета: number
  ДанныеРасшифровки: number
  ТипФормыОтчета: "Основная"
  ПредставлениеВарианта: string
  ГруппаПользовательскихНастроек: string
}
```

Do not rewrite existing textual `reportFormClientApplicationForm` expected values to invented numbers. If the existing `reportForm.xml` fixture fails because it contains textual `ReportResult` or `DetailsData`, stop after Step 7 and report the exact conflict.

- [ ] **Step 6: Run the focused decimal tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm -t "decimal report result"
```

Expected: PASS.

- [ ] **Step 7: Run client application form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm
```

Expected: PASS. If a test fails because an existing XML fixture contains textual `ReportResult` or `DetailsData`, stop and report the exact fixture path and failing assertion before broadening the model.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts
git commit -m "fix: :bug: импортировать поля отчета числами"
```

---

### Task 4: Verify ERP Round-Trip And Full Test Suite

**Files:**
- No code files.

- [ ] **Step 1: Run ERP round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 10 --start-index 1
```

Expected: no `RecordType` order diff, no `AutoCommandBar name=""` diff, and no `ReportResult` / `DetailsData` `xsi:type` diff. The known invalid duplicate `FormAttribute AdditionalColumns name="Реквизит1"` may still appear only as `SKIPPED_INVALID_DIFF`.

- [ ] **Step 2: Regenerate Langium files before the full suite**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`.

- [ ] **Step 3: Run the full project tests**

Run:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short --branch
```

Expected: branch is `codex/round-trip-diffs`; only intentional generated changes, if any, are present. If Langium generation changed files, inspect them before committing.

- [ ] **Step 5: Commit verification-only generated changes if present**

If `git status --short` shows generated Langium files changed, run:

```bash
git add packages/language
git commit -m "chore: :wrench: обновить сгенерированные Langium-файлы"
```

Expected: commit succeeds. If no files changed, skip this step.
