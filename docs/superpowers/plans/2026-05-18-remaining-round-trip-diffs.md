# Remaining Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining ERP round-trip diffs for standard attribute order, empty singleton names, and reference-typed report form fields.

**Architecture:** Keep XML reference metadata as the preservation boundary. Make three narrow changes: reference order for `StandardAttributeDescriptions`, exact empty names for singleton references, and reference-backed XML typing for report form fields.

**Tech Stack:** TypeScript, Vitest, `round-trip-xml`, metadata rules, form element orchestration.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`: add a focused reference-order export test.
- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`: preserve `referenceMetadata` item order when exporting standard attributes.
- Modify `packages/core/metadata/forms/elements/singletonNameReference.test.ts`: add a focused empty-name singleton reference test.
- Modify `packages/core/metadata/orchestration/formElement/singletonName.ts`: treat empty XML singleton names as exact reference names.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`: add focused decimal import assertions.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`: add focused decimal export assertions.
- Create `packages/core/metadata/commonObjects/stringOrNumber/fromXML.ts`: import numeric typed XML as numbers and plain XML as strings.
- Create `packages/core/metadata/commonObjects/stringOrNumber/toXML.ts`: export numbers with the XML type preserved from reference metadata, and strings as plain text.
- Create `packages/core/metadata/commonObjects/stringOrNumber/types.ts`: define the model/YAML type as `string | number`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: register `StringOrNumber` as a property type.
- Modify `packages/core/metadata/orchestration/property/types.ts`: allow `StringOrNumber` rules.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`: change `reportResult` and `detailsData` to `StringOrNumber`.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`: update report form type aliases to `string | number` only if TypeScript requires it after the rule change.

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

### Task 3: Import ReportResult And DetailsData With Reference XML Type

**Files:**
- Create: `packages/core/metadata/commonObjects/stringOrNumber/types.ts`
- Create: `packages/core/metadata/commonObjects/stringOrNumber/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/stringOrNumber/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`

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
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: {
          ReportResult: { "_xsi:type": "xs:decimal", "#text": "3" },
          DetailsData: { "_xsi:type": "xs:decimal", "#text": "0" },
        },
        xmlMetadata: { Form: { Properties: {} } },
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: {
          itemType: "ClientApplicationForm",
          reportResult: 3,
          detailsData: 0,
          childItems: [],
          commands: [],
        },
        referenceForm,
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

- [ ] **Step 4: Add the StringOrNumber type files**

Create `packages/core/metadata/commonObjects/stringOrNumber/types.ts`:

```ts
import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const StringOrNumberJSONSchema = Type.Union([Type.String(), Type.Number()])

export type StringOrNumber = string | number
export type StringOrNumberYAML = Static<typeof StringOrNumberJSONSchema>

export interface StringOrNumberPropertyRule extends BasePropertyRule {
  type: "StringOrNumber"
}

export type StringOrNumberReference = {
  value: StringOrNumber
  xsiType?: string
}
```

Create `packages/core/metadata/commonObjects/stringOrNumber/fromXML.ts`:

```ts
import { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { StringOrNumber, StringOrNumberReference } from "./types"

const NUMERIC_XSI_TYPES = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type StringOrNumberXML =
  | string
  | number
  | { "#text"?: string | number; "_xsi:type"?: string }
  | undefined

export const importStringOrNumberFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: StringOrNumberXML
): StringOrNumber | StringOrNumberReference | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null) {
    const text = value["#text"]
    const xsiType = value["_xsi:type"]
    if (text === undefined || text === "") return undefined
    const importedValue = typeof xsiType === "string" && NUMERIC_XSI_TYPES.has(xsiType)
      ? Number(text)
      : String(text)
    return context.fromXML.forReference && typeof xsiType === "string"
      ? { value: importedValue, xsiType }
      : importedValue
  }

  return typeof value === "number" ? value : value.toString()
}

registerTypeRule("StringOrNumber", "importFromXML", importStringOrNumberFromXML)
```

Create `packages/core/metadata/commonObjects/stringOrNumber/toXML.ts`:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StringOrNumber, StringOrNumberReference } from "./types"

const isReference = (value: unknown): value is StringOrNumberReference =>
  typeof value === "object" && value !== null && "value" in value

export const exportStringOrNumberToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: StringOrNumber | StringOrNumberReference | undefined,
  referenceMetadata?: StringOrNumber | StringOrNumberReference
): string | number | { "_xsi:type": string; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const actualValue = isReference(value) ? value.value : value
  const reference = isReference(referenceMetadata) ? referenceMetadata : undefined

  if (typeof actualValue === "number" && reference?.xsiType) {
    return { "_xsi:type": reference.xsiType, "#text": String(actualValue) }
  }

  return actualValue
}

registerTypeRule("StringOrNumber", "exportToXML", exportStringOrNumberToXML)
```

- [ ] **Step 5: Register StringOrNumber in property typing**

In `packages/core/metadata/orchestration/property/registry.ts`, import the type near the primitive imports:

```ts
import { StringOrNumber, StringOrNumberYAML } from "~/metadata/commonObjects/stringOrNumber/types"
```

Add this entry to `PropertyTypeRegistry` near `string` and `number`:

```ts
  StringOrNumber: {
    item: StringOrNumber
    enterprise: StringOrNumber
    yaml: StringOrNumberYAML
  }
```

Add this entry to `PropertyRuleTypeKeys` near `string` and `number`:

```ts
  StringOrNumber: "StringOrNumber",
```

In `packages/core/metadata/orchestration/property/types.ts`, import:

```ts
import { StringOrNumberPropertyRule } from "~/metadata/commonObjects/stringOrNumber/types"
```

Then add `| StringOrNumberPropertyRule` to the `PropertyRule` union next to `NumberPropertyRule`.

- [ ] **Step 6: Change report form field rules to StringOrNumber**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, replace the `reportResult` and `detailsData` rules with:

```ts
    reportResult: {
      yaml: "РезультатОтчета",
      xml: "ReportResult",
      type: "StringOrNumber",
      tag: FormRulesTags.Form,
    },
    detailsData: {
      yaml: "ДанныеРасшифровки",
      xml: "DetailsData",
      type: "StringOrNumber",
      tag: FormRulesTags.Form,
    },
```

- [ ] **Step 7: Update local report form type aliases only if TypeScript requires it**

If TypeScript reports that the local report form aliases conflict with the new rules, update the `ReportFormClientApplicationForm` and `ReportFormClientApplicationFormYAML` aliases to use `string | number` for these two fields:

```ts
type ReportFormClientApplicationForm = ClientApplicationForm & {
  reportResult: string | number
  detailsData: string | number
  reportFormType: "Main"
  variantAppearance: string
  autoShowState: "Auto"
  customSettingsFolder: string
  reportResultViewMode: "Auto"
  viewModeApplicationOnSetReportResult: "Auto"
}

type ReportFormClientApplicationFormYAML = ClientApplicationFormYAML & {
  РезультатОтчета: string | number
  ДанныеРасшифровки: string | number
  ТипФормыОтчета: "Основная"
  ПредставлениеВарианта: string
  ГруппаПользовательскихНастроек: string
}
```

Do not rewrite existing textual `reportFormClientApplicationForm` expected values. Textual `reportForm.xml` must continue importing as strings and exporting without `xsi:type`.

- [ ] **Step 8: Run the focused decimal tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm -t "decimal report result"
```

Expected: PASS.

- [ ] **Step 9: Run client application form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm
```

Expected: PASS, including existing textual `reportForm.xml`.

- [ ] **Step 10: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/stringOrNumber packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts
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
