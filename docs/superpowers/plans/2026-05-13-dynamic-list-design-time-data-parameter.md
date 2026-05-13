# DynamicList DesignTimeValue Data Parameter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `dcscor:DesignTimeValue` values inside `DynamicList.dataParameters` during XML round-trip without keying behavior by the concrete field name.

**Architecture:** Add an explicit DCS value marker for `dcscor:DesignTimeValue` strings while keeping existing `Field` strings compatible. XML import records `DesignTimeValue` when `xsi:type` says so; XML export checks that marker before falling back to the rule's default `valueType`. YAML keeps its compact string form and restores `DesignTimeValue` through the existing metadata value path detector.

**Tech Stack:** TypeScript, Vitest, existing metadata rules/orchestration helpers, `fast-xml-parser` test helpers.

---

## File Structure

- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`: add explicit model types for DCS text values that must preserve XML `xsi:type`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`: import `dcscor:DesignTimeValue` as an explicit typed DCS value.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`: export explicit DCS typed values before applying the rule default.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`: restore `DesignTimeValue` from compact YAML strings when the existing metadata value path detector recognizes them.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`: emit explicit DCS typed values as compact YAML strings.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`: add one reusable fixture for a `DesignTimeValue` under a `Field` default.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-ref.xml`: XML fixture for the DCS value type.
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`: add a DynamicList model fixture for the real failing shape.
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/designTimeDataParameters.xml`: XML fixture reproducing the round-trip diff.
- `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`: add one XML round-trip test for the DynamicList fixture.

---

### Task 1: Add Failing DCS Value Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-ref.xml`
- Existing tests exercised: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
- Existing tests exercised: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`
- Existing tests exercised: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
- Existing tests exercised: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`

- [ ] **Step 1: Create the DCS XML fixture**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-ref.xml`:

```xml
<dcscor:value xsi:type="dcscor:DesignTimeValue">Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ</dcscor:value>
```

- [ ] **Step 2: Add the fixture data**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`, add this constant after `fixtureFieldPath`:

```ts
export const fixtureDesignTimeRefPath = "Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ"
```

In the same file, add this object before `primitiveTypeRefFixture`:

```ts
const designTimeRefUnderFieldDefaultFixture: DcsMetadataValueFixture = {
  id: "designTimeRefUnderFieldDefault",
  title: "DesignTimeValue under Field default",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
  value: {
    type: "DesignTimeValue",
    value: fixtureDesignTimeRefPath,
  },
  yaml: fixtureDesignTimeRefPath,
  xml: "design-time-ref.xml",
}
```

In the same file, include the fixture in both fixture arrays:

```ts
export const dcsMetadataValueFixtures: DcsMetadataValueFixture[] = [
  {
    id: "color",
    title: "Color",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "value" },
    value: fixtureColorWebRed,
    yaml: yamlColorWebRed,
    xml: "color.xml",
  },
  {
    id: "field",
    title: "Field",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
    value: fixtureFieldPath,
    yaml: yamlFieldPath,
    xml: "field.xml",
  },
  designTimeRefUnderFieldDefaultFixture,
]

export const dcsMetadataValueXMLFixtures: DcsMetadataValueFixture[] = [
  ...dcsMetadataValueFixtures,
  primitiveTypeRefFixture,
  primitiveUuidFixture,
]
```

Do not replace the whole array with the abbreviated snippet above. Insert only the single
`designTimeRefUnderFieldDefaultFixture` entry immediately after the existing `field` fixture,
leaving every following fixture object unchanged.

- [ ] **Step 3: Run the DCS value tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected before implementation:

```text
FAIL metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts
FAIL metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

The failure should show that `dcscor:DesignTimeValue` is not preserved as the expected `{ type: "DesignTimeValue", value: ... }` model and/or exports as `dcscor:Field`.

---

### Task 2: Add Failing DynamicList Round-Trip Test

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/designTimeDataParameters.xml`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`

- [ ] **Step 1: Create the DynamicList XML fixture**

Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/designTimeDataParameters.xml`:

```xml
<Settings xsi:type="DynamicList">
	<ListSettings>
		<dcsset:dataParameters>
			<dcscor:item xsi:type="dcsset:SettingsParameterValue">
				<dcscor:use>false</dcscor:use>
				<dcscor:parameter>УведомленияЕГРЮЛ</dcscor:parameter>
				<dcscor:value xsi:type="dcscor:DesignTimeValue">Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ</dcscor:value>
				<dcscor:value xsi:type="dcscor:DesignTimeValue">Перечисление.СтраницыЖурналаОтчетность.Уведомления</dcscor:value>
			</dcscor:item>
		</dcsset:dataParameters>
	</ListSettings>
</Settings>
```

- [ ] **Step 2: Add the DynamicList model fixture**

In `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`, add this export after `queryText`:

```ts
export const designTimeDataParametersDynamicList = {
  customQuery: false,
  dataParameters: {
    itemType: "SettingsParameterValueCollection",
    parameters: {
      УведомленияЕГРЮЛ: {
        parameter: "УведомленияЕГРЮЛ",
        use: false,
        value: [
          {
            type: "DesignTimeValue",
            value: "Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ",
          },
          {
            type: "DesignTimeValue",
            value: "Перечисление.СтраницыЖурналаОтчетность.Уведомления",
          },
        ],
      },
    },
  },
  itemType: "DynamicList",
} as const satisfies DynamicList
```

- [ ] **Step 3: Add the DynamicList round-trip test**

In `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`, add `designTimeDataParametersDynamicList` to the existing fixture import:

```ts
import {
  designTimeDataParametersDynamicList,
  emptyListSettingsDynamicList,
  fullDynamicList,
  keyFieldDynamicList,
  minimalDynamicList,
  multipleCalculatedFieldsDynamicList,
  queryTextWithManualQueryFalseDynamicList,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
```

Add this test near the other round-trip tests:

```ts
  it("round-trip: designTimeDataParameters.xml import -> export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "designTimeDataParameters.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(imported).toEqual(designTimeDataParametersDynamicList)

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "designTimeDataParameters.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 4: Run the DynamicList test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts -t "designTimeDataParameters"
```

Expected before implementation:

```text
FAIL metadata/forms/commonObjects/dynamicList/fromXML.test.ts
```

The failure should show that the imported model does not match the explicit `DesignTimeValue` values or that export writes `dcscor:Field`.

---

### Task 3: Preserve Explicit DCS DesignTimeValue

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`

- [ ] **Step 1: Add explicit DCS value types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`, add these types before `export type MetadataDcsMetadataValue =`:

```ts
export type MetadataDcsFieldValue = {
  type: "Field"
  value: string
}

export type MetadataDcsDesignTimeValue = {
  type: "DesignTimeValue"
  value: string
}

export type MetadataDcsExplicitTextValue = MetadataDcsFieldValue | MetadataDcsDesignTimeValue
```

Add `MetadataDcsExplicitTextValue` to the `MetadataDcsMetadataValue` union:

```ts
export type MetadataDcsMetadataValue =
  | null
  | Color
  | MetadataField
  | MetadataDcsExplicitTextValue
  | ChoiceParameter
  | I8nText
  | MetadataValue
  | TypeLink
  | ChoiceParameterLinks
  | Font
  | string
```

- [ ] **Step 2: Import DesignTimeValue from XML as an explicit value**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`, update the type import:

```ts
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsDesignTimeValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueDcsRootXML,
} from "./types"
```

Add this helper near `hasSystemEnumeration`:

```ts
const importExplicitDesignTimeValue = (root: unknown): MetadataDcsDesignTimeValue => ({
  type: "DesignTimeValue",
  value: textNode(root as string | { "#text"?: string }),
})
```

Replace the current `dcscor:DesignTimeValue` branch:

```ts
  if (xsi === "dcscor:DesignTimeValue") {
    return importExplicitDesignTimeValue(root)
  }
```

Leave the `dcscor:Field` branch returning a plain string for compatibility:

```ts
  if (xsi === "dcscor:Field") {
    return textNode(root as string | { "#text"?: string })
  }
```

- [ ] **Step 3: Export explicit DCS text values before rule defaults**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`, update the type import:

```ts
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsDesignTimeValue,
  MetadataDcsExplicitTextValue,
  MetadataDcsFieldValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueDcsRootXML,
} from "./types"
```

Add these helpers before `export const exportDcsMetadataValueToDcsXML`:

```ts
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isExplicitDcsTextValue = (value: unknown): value is MetadataDcsExplicitTextValue =>
  isRecord(value) &&
  (value.type === "Field" || value.type === "DesignTimeValue") &&
  typeof value.value === "string"

const exportExplicitDcsTextValue = (
  value: MetadataDcsFieldValue | MetadataDcsDesignTimeValue
): MetadataDcsMetadataValueDcsRootXML => ({
  "dcscor:value": {
    "_xsi:type": value.type === "DesignTimeValue" ? "dcscor:DesignTimeValue" : "dcscor:Field",
    "#text": value.value,
  },
})
```

At the top of `exportDcsMetadataValueToDcsXML`, immediately after `const { context, rule, data } = params`, add:

```ts
  if (isExplicitDcsTextValue(data)) {
    return exportExplicitDcsTextValue(data)
  }
```

- [ ] **Step 4: Restore DesignTimeValue from compact YAML strings**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, add this import:

```ts
import { importMetadataValueStringFromYAML } from "~/metadata/commonObjects/metadataPath/fromYAML"
```

Add this helper before `export const importDcsMetadataValueFromYAML`:

```ts
const importFieldOrDesignTimeValueFromYAML = (
  context: ConfigurationContext,
  data: MetadataDcsMetadataValueYAML
): MetadataDcsMetadataValue | undefined => {
  if (typeof data !== "string") {
    return importMetadataFieldFromYAML(context, undefined, data as any)!
  }

  if (!data.startsWith(".") && importMetadataValueStringFromYAML(context, undefined, data) !== undefined) {
    return {
      type: "DesignTimeValue",
      value: data,
    }
  }

  return importMetadataFieldFromYAML(context, undefined, data as any)!
}
```

Replace the `"Field"` case:

```ts
    case "Field":
      return importFieldOrDesignTimeValueFromYAML(context, data)
```

- [ ] **Step 5: Export explicit DCS text values to compact YAML**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`, add this import:

```ts
import {
  exportMetadataFieldStringToYAML,
  exportMetadataValueStringToYAML,
} from "~/metadata/commonObjects/metadataPath/toYAML"
```

Update the type import:

```ts
import {
  DcsMetadataValuePropertyRule,
  MetadataDcsExplicitTextValue,
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
} from "./types"
```

Add these helpers before `export const exportDcsMetadataValueToYAML`:

```ts
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isExplicitDcsTextValue = (value: unknown): value is MetadataDcsExplicitTextValue =>
  isRecord(value) &&
  (value.type === "Field" || value.type === "DesignTimeValue") &&
  typeof value.value === "string"

const exportExplicitDcsTextValueToYAML = (
  context: ConfigurationContext,
  data: MetadataDcsExplicitTextValue
): MetadataDcsMetadataValueYAML =>
  data.type === "DesignTimeValue"
    ? ((exportMetadataValueStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML)
    : ((exportMetadataFieldStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML)
```

At the top of `exportDcsMetadataValueToYAML`, immediately after the `undefined` and `null` checks, add:

```ts
  if (isExplicitDcsTextValue(data)) {
    return exportExplicitDcsTextValueToYAML(context, data)
  }
```

- [ ] **Step 6: Run the DCS value tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected:

```text
Test Files  4 passed
```

---

### Task 4: Verify DynamicList Round-Trip

**Files:**
- Existing tests: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- Existing tests: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`

- [ ] **Step 1: Run the focused DynamicList reproducer**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts -t "designTimeDataParameters"
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 2: Run the full DynamicList suite**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/dynamicList
```

Expected:

```text
Test Files  <N> passed
0 failed
```

---

### Task 5: Full Verification and Commit

**Files:**
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-ref.xml`
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/designTimeDataParameters.xml`
- `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`

- [ ] **Step 1: Run the full project test suite**

Run from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-sequential-fixes`:

```bash
pnpm test
```

Expected:

```text
packages/graph test: Done
packages/language test: Done
packages/core test: Done
packages/cli test: Done
```

There must be `0 failed`. Skipped tests are acceptable if they match the baseline.

- [ ] **Step 2: Review the diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue packages/core/metadata/forms/commonObjects/dynamicList
```

Expected review points:

- No `parameterRules` entry for `УведомленияЕГРЮЛ`.
- No new hand-written `fromXML`/`toXML` module.
- `dcscor:DesignTimeValue` is preserved by explicit value shape, not by field name.
- Existing `dcscor:Field` fixtures still pass.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue packages/core/metadata/forms/commonObjects/dynamicList
git commit -m "fix: :bug: сохранить DesignTimeValue в dataParameters"
```

Expected:

```text
[codex/round-trip-sequential-fixes <hash>] fix: :bug: сохранить DesignTimeValue в dataParameters
```
