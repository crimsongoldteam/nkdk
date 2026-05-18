# Round-trip Next Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the blocking `short-round-trip-test` crash and the next XML round-trip diffs documented in `docs/superpowers/specs/2026-05-18-round-trip-next-diffs-design.md`.

**Architecture:** Keep the fixes in the existing rule-driven metadata layer. Prefer narrow `rules.ts` and fixture updates over custom import/export code. Preserve opaque XML fragments through existing reference and settings-fragment mechanisms.

**Tech Stack:** TypeScript, Vitest, `pnpm`, rule-driven metadata orchestration, XML fixtures.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`: add a reproducer for a changed standard attribute whose model omits `fillValue`, while reference has `xr:FillValue xsi:type="v8:TypeDescription"`.
- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`: ensure standard attribute export treats missing `fillValue` as `undefined` and lets `MetadataValue.toXML` preserve `referenceMetadata`.
- Modify `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`: apply empty raw XML `Synonym` behavior to tabular sections.
- Modify `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/full.xml`: keep top-level tabular section `Synonym` empty to cover the behavior.
- Modify `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/data.ts`: expect `synonym: { items: {} }` for that fixture.
- Create `packages/core/metadata/forms/commonObjects/flowchartContext/types.ts`: register `FlowchartContextType` as an opaque settings fragment.
- Modify `packages/core/metadata/forms/commonObjects/index.ts`: import the new flowchart context registration.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`: add `flowchartContext` on XML `Settings`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`: include `FlowchartContextXML/YAML`.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.xml`: fixture with `Settings xsi:type="d4p1:FlowchartContextType"`.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.ts`: expected model.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts` and `toXML.test.ts`: add import/export tests.
- Modify `packages/core/metadata/forms/elements/inputField/rules.ts`: change `autoFillHint.xml` from `SpecialTextInputMode` to `AutofillHint`.
- Modify `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml` and `fullTable.xml`: add `<AutofillHint>FullName</AutofillHint>` beside existing `<SpecialTextInputMode>Email</SpecialTextInputMode>`.
- Modify `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`: expect `autoFillHint: "FullName"` and keep `specialTextInputMode: "Email"`.

## Task 1: Preserve Standard Attribute `fillValue` From Reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `describe("export StandardAttributeDescriptions to XML", ...)` in `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`, near the existing `fillValue` reference tests:

```ts
it("preserves fillValue reference xsi type when another field is changed", () => {
  const rule: PropertyRule = {
    type: "StandardAttributeDescriptions",
    standartAttributeNames: { ValueType: "ТипЗначения" },
  }
  const referenceMetadata = testImportPropertyFromXML({
    rule,
    xmlString: `
      <StandardAttributes>
        <xr:StandardAttribute name="ValueType">
          <xr:LinkByType/>
          <xr:Comment/>
          <xr:FillValue xsi:type="v8:TypeDescription"/>
        </xr:StandardAttribute>
      </StandardAttributes>
    `,
    xmlRootTag: "StandardAttributes",
    forReference: true,
  })

  const { result } = testExportPropertyToXML({
    rule,
    value: [
      {
        itemType: "StandardAttributeDescription",
        name: "ValueType",
        comment: "changed",
      },
    ],
    referenceMetadata,
    xmlRootTag: "StandardAttributes",
  })

  expect(result).toContain('<xr:Comment>changed</xr:Comment>')
  expect(result).toContain('<xr:FillValue xsi:type="v8:TypeDescription"/>')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/standardAttributeDescription/toXML.test.ts -t "preserves fillValue reference xsi type when another field is changed"
```

Expected: FAIL with `MetadataValue: неподдерживаемый тип для экспорта в XML: undefined`.

- [ ] **Step 3: Implement the minimal fix**

In `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`, replace this block:

```ts
const itemWithFillValue = Object.prototype.hasOwnProperty.call(item, "fillValue")
  ? item
  : { ...item, fillValue: undefined }
return (
  exportMetadataItemToXML({
    context: p.context,
    data: itemWithFillValue,
    referenceData: referenceByName.get(internalName),
    rule: StandardAttributeDescriptionRules,
  }) ?? { _name: internalName }
)
```

with:

```ts
const referenceData = referenceByName.get(internalName)
const referenceFillValue =
  referenceData !== undefined &&
  Object.prototype.hasOwnProperty.call(referenceData, "fillValue") &&
  referenceData.fillValue !== undefined

const itemWithFillValue =
  Object.prototype.hasOwnProperty.call(item, "fillValue") && !referenceFillValue
    ? item
    : { ...item, fillValue: undefined }

return (
  exportMetadataItemToXML({
    context: p.context,
    data: itemWithFillValue,
    referenceData,
    rule: StandardAttributeDescriptionRules,
  }) ?? { _name: internalName }
)
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/standardAttributeDescription/toXML.test.ts -t "preserves fillValue reference xsi type when another field is changed"
```

Expected: PASS.

- [ ] **Step 5: Run the local standard attribute test file**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/standardAttributeDescription
```

Expected: all tests in that directory pass.

## Task 2: Preserve Empty Tabular Section `Synonym`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/full.xml`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/data.ts`
- Test: `packages/core/metadata/commonObjects/metadataTabularSection/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTabularSection/toXML.test.ts`

- [ ] **Step 1: Write the failing fixture expectation**

In `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/full.xml`, replace the top-level tabular section synonym:

```xml
<Synonym>
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>Синоним</v8:content>
  </v8:item>
</Synonym>
```

with:

```xml
<Synonym/>
```

In `packages/core/metadata/commonObjects/metadataTabularSection/__fixtures__/data.ts`, update `fullFromXML[0].synonym` from:

```ts
synonym: { items: { ru: "Синоним" } },
```

to:

```ts
synonym: { items: {} },
```

- [ ] **Step 2: Run import/export tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataTabularSection/fromXML.test.ts metadata/commonObjects/metadataTabularSection/toXML.test.ts -t "full"
```

Expected: FAIL before the rules fix. The import side should produce a default synonym from the tabular section name, or export should emit non-empty synonym XML.

- [ ] **Step 3: Implement the rule fix**

In `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`, replace the `synonym` property in `commonTabularSectionProperties` with:

```ts
synonym: {
  yaml: "Синоним",
  xml: "Synonym",
  type: "I8nText",
  excludeIfEqualNameYAML: true,
  xmlParents: propertiesParents,
  defaultValueXMLRaw: "",
  defaultValueXMLEmpty: { items: {} },
  emptyAsRawXML: true,
  defaultValue: ({
    context,
    name,
    operation,
  }: {
    context: ConfigurationContext
    name?: string
    operation?: string
  }) =>
    operation === "importFromYAML" && name
      ? addDefaultLanguageNameToSynonym(context, undefined, name)
      : { items: { [context.defaultLanguage]: "" } },
  order: 2,
},
```

- [ ] **Step 4: Run tabular section XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataTabularSection/fromXML.test.ts metadata/commonObjects/metadataTabularSection/toXML.test.ts
```

Expected: PASS.

## Task 3: Add `FlowchartContextType` Settings Fragment

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/flowchartContext/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add fixture and expected model**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.xml`:

```xml
<Attribute name="Схема" id="3">
	<Type>
		<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/graphscheme">d5p1:FlowchartContextType</v8:Type>
	</Type>
	<SavedData>true</SavedData>
	<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/graphscheme" xsi:type="d4p1:FlowchartContextType">
		<d4p1:backColor>style:FieldBackColor</d4p1:backColor>
		<d4p1:enableGrid>true</d4p1:enableGrid>
		<d4p1:drawGridMode>Lines</d4p1:drawGridMode>
		<d4p1:gridHorizontalStep>20</d4p1:gridHorizontalStep>
		<d4p1:gridVerticalStep>20</d4p1:gridVerticalStep>
		<d4p1:bpUUID>00000000-0000-0000-0000-000000000000</d4p1:bpUUID>
		<d4p1:useOutput>Auto</d4p1:useOutput>
		<d4p1:printPropItem>
			<d4p1:key>6</d4p1:key>
			<d4p1:val>10</d4p1:val>
		</d4p1:printPropItem>
	</Settings>
</Attribute>
```

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/flowchartContextSettings.ts`:

```ts
import type { FormAttributes } from "../types"

export const flowchartContextSettings = [
  {
    itemType: "FormAttribute",
    name: "Схема",
    id: "3",
    type: { type: ["FlowchartContextType"] },
    storedData: true,
    flowchartContext: {
      "d4p1:backColor": "style:FieldBackColor",
      "d4p1:enableGrid": true,
      "d4p1:drawGridMode": "Lines",
      "d4p1:gridHorizontalStep": 20,
      "d4p1:gridVerticalStep": 20,
      "d4p1:bpUUID": "00000000-0000-0000-0000-000000000000",
      "d4p1:useOutput": "Auto",
      "d4p1:printPropItem": {
        "d4p1:key": 6,
        "d4p1:val": 10,
      },
    },
  },
] satisfies FormAttributes
```

- [ ] **Step 2: Add failing tests**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`, import the fixture:

```ts
import { flowchartContextSettings } from "./__fixtures__/flowchartContextSettings"
```

Add this test:

```ts
it("import flowchartContextSettings", () => {
  const result = testImportPropertyFromXML({
    rule: formAttributesRule,
    path: "flowchartContextSettings.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(flowchartContextSettings)
})
```

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`, import the same fixture and add:

```ts
it("export flowchartContextSettings", () => {
  const { result, expectedResult } = testExportPropertyToXML({
    rule: formAttributesRule,
    value: flowchartContextSettings,
    path: "flowchartContextSettings.xml",
    importMetaUrl: import.meta.url,
    xmlRootTag: "Attribute",
  })

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 3: Run the new tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "flowchartContextSettings"
```

Expected: FAIL because `flowchartContext` is not registered or exported yet.

- [ ] **Step 4: Register the settings fragment**

Create `packages/core/metadata/forms/commonObjects/flowchartContext/types.ts`:

```ts
import { registerSettingsFragmentType } from "~/metadata/forms/commonObjects/settingsFragment/types"
import type {
  SettingsFragment,
  SettingsFragmentXML,
  SettingsFragmentYAML,
} from "~/metadata/forms/commonObjects/settingsFragment/types"

export type FlowchartContext = SettingsFragment
export type FlowchartContextXML = SettingsFragmentXML
export type FlowchartContextYAML = SettingsFragmentYAML

registerSettingsFragmentType<FlowchartContext>({
  propertyType: "FlowchartContext",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/graphscheme",
    "_xsi:type": "d4p1:FlowchartContextType",
  },
  matchXsiType: (xsiType) => xsiType === "d4p1:FlowchartContextType" || xsiType.endsWith(":FlowchartContextType"),
})
```

In `packages/core/metadata/forms/commonObjects/index.ts`, add:

```ts
import "./flowchartContext/types"
```

- [ ] **Step 5: Register the property type**

In `packages/core/metadata/orchestration/property/registry.ts`, add `FlowchartContext` in the same places as `Chart`, `GanttChart`, `Planner`, and `SpreadsheetDocument`: import the type, add it to `PropertyTypeRegistry`, and add the string literal to `PropertyRuleTypeKeys`.

Use the existing entries as the exact pattern:

```ts
FlowchartContext: {
  item: FlowchartContext
  xml: FlowchartContextXML
  yaml: FlowchartContextYAML
}
```

and:

```ts
FlowchartContext: "FlowchartContext",
```

- [ ] **Step 6: Wire it into form attributes**

In `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`, add near `chart`, `ganttChart`, `spreadsheetDocument`, and `planner`:

```ts
flowchartContext: {
  type: "FlowchartContext",
  xml: "Settings",
  yaml: "ГрафическаяСхема",
},
```

In `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`, import:

```ts
import {
  FlowchartContextXML,
  FlowchartContextYAML,
} from "~/metadata/forms/commonObjects/flowchartContext/types"
```

Extend `FormAttributeXML["Settings"]`:

```ts
Settings?:
  | SettingsTypeDescriptionXML
  | DynamicListXML
  | ChartXML
  | GanttChartXML
  | FlowchartContextXML
  | SpreadsheetDocumentXML
  | PlannerXML
```

Extend `FormAttributeYAML`:

```ts
ГрафическаяСхема?: FlowchartContextYAML
```

- [ ] **Step 7: Run form attribute tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "flowchartContextSettings"
```

Expected: PASS.

Then run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute
```

Expected: PASS.

## Task 4: Split `AutofillHint` From `SpecialTextInputMode`

**Files:**
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`

- [ ] **Step 1: Update XML fixtures to expose the bug**

In `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml`, after:

```xml
<SpecialTextInputMode>Email</SpecialTextInputMode>
```

add:

```xml
<AutofillHint>FullName</AutofillHint>
```

Make the same change in `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`.

In `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`, update `fullInputField.autoFillHint` from:

```ts
autoFillHint: "Email",
```

to:

```ts
autoFillHint: "FullName",
```

Update the second full table input field model the same way, keeping:

```ts
specialTextInputMode: "Email",
```

- [ ] **Step 2: Run the focused element tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "full input field|full table input field"
```

Expected: FAIL because `autoFillHint` still reads from `SpecialTextInputMode` and export does not emit `AutofillHint`.

- [ ] **Step 3: Fix the rule**

In `packages/core/metadata/forms/elements/inputField/rules.ts`, change:

```ts
xml: "SpecialTextInputMode",
```

inside `autoFillHint` to:

```ts
xml: "AutofillHint",
```

Do not change `specialTextInputMode`.

- [ ] **Step 4: Run the focused element tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "full input field|full table input field"
```

Expected: PASS.

- [ ] **Step 5: Run all form element XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts
```

Expected: PASS.

## Task 5: Verify Short Round-trip Batch

**Files:**
- No code files.

- [ ] **Step 1: Ensure XML source repo is reset**

Run:

```bash
git -C /Users/nikita/git/round-trip-source restore .
```

Expected: no output.

- [ ] **Step 2: Re-run the same triage batch**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 6
```

Expected: no crash on `ChartsOfCharacteristicTypes/ВидыДоступа`. The previously documented diffs for `FlowchartContextType`, empty tabular-section `Synonym`, and `AutofillHint` should not appear in the next output.

- [ ] **Step 3: Run the targeted test groups**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/standardAttributeDescription metadata/commonObjects/metadataTabularSection metadata/forms/commonObjects/formAttribute metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full project verification**

Run:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: PASS. Existing Chevrotain ambiguity warning in `metadata/appliedObjects/metadataReport/syncToXML.test.ts` may still appear.

## Self-review

- Spec coverage: all four clusters from the spec are covered by Tasks 1-4, and Task 5 verifies the original round-trip path.
- Placeholder scan: no unresolved placeholders are required for implementation; all new snippets include concrete paths and expected commands.
- Type consistency: `FlowchartContext`, `FlowchartContextXML`, and `FlowchartContextYAML` are introduced before being referenced by `FormAttribute` types and rules.
