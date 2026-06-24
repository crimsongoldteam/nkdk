# Form Attributes Conditional Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `<Attributes><ConditionalAppearance>...</ConditionalAppearance></Attributes>` in client application form XML round-trip, including the case where there are no `<Attribute>` nodes.

**Architecture:** Keep `ClientApplicationForm.attributes` as the existing `FormAttribute[]` array. Add a separate `ClientApplicationFormRules` property, `attributesConditionalAppearance`, mapped through rules to `xmlParents: ["Attributes"]`, so the sibling XML node is represented without reshaping `FormAttributes`. Fix the property-order helper so an XML key that is both a direct property and a parent container imports direct property data before nested properties; this prevents export from overwriting nested `ConditionalAppearance`.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, `fast-xml-parser` XML export helpers.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/helpers.test.ts`
  Adds a focused regression test for direct container properties that also have nested `xmlParents` children.

- Modify `packages/core/metadata/orchestration/property/helpers.ts`
  Adjusts `getOrderedKeysFromXML` traversal so direct properties are ordered before nested children when they share the same XML key.

- Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml`
  A short full-form XML fixture with `<Attributes>` containing only `<ConditionalAppearance>`.

- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
  Adds `conditionalAppearanceWithoutAttributesClientApplicationForm` and loosens the existing `Required<...>` fixture types for the new optional property.

- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
  Adds import coverage for conditional appearance with no attributes.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  Adds export coverage for conditional appearance with no attributes. Existing minimal export test continues to cover `<Attributes/>` with neither attributes nor conditional appearance.

- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  Adds `attributesConditionalAppearance` as a rules-driven form property.

- Modify `packages/core/metadata/forms/clientApplicationForm/types.ts`
  Updates XML typing for `<Attributes>` so `Attribute` is optional and `ConditionalAppearance` is represented.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
  Makes `FormAttributes` import return `[]` when it receives an `<Attributes>` container that has `ConditionalAppearance` but no `Attribute`.

---

### Task 1: Preserve XML Key Order For Direct-Plus-Nested Properties

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`

- [ ] **Step 1: Write the failing helper test**

In `packages/core/metadata/orchestration/property/helpers.test.ts`, widen `createRule` so test rules may declare `xmlParents`:

```ts
const createRule = (
  properties: Record<string, { xml?: string; xmlParents?: string[]; tag?: string; runtimeOnly?: true }>
): any => {
  return {
    // Остальное для этих тестов не важно, используются только свойства
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, rule]) => [
        name,
        {
          type: "string",
          ...rule,
        },
      ])
    ),
  }
}
```

Add this test inside `describe("getOrderedKeysFromXML", () => { ... })` after the existing runtime-only test:

```ts
it("ставит свойство-контейнер перед вложенными свойствами того же XML-узла", () => {
  const rule = createRule({
    attributes: { xml: "Attributes" },
    attributesConditionalAppearance: {
      xml: "ConditionalAppearance",
      xmlParents: ["Attributes"],
    },
  })

  const xml = {
    Attributes: {
      ConditionalAppearance: {
        "dcsset:viewMode": "Normal",
      },
    },
  }

  const result = getOrderedKeysFromXML({
    rule,
    xml,
  })

  expect(result).toEqual(["attributes", "attributesConditionalAppearance"])
})
```

- [ ] **Step 2: Run the helper test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/orchestration/property/helpers.test.ts -t "свойство-контейнер"
```

Expected: FAIL. Current behavior returns `["attributesConditionalAppearance", "attributes"]`, which later makes export write nested data before the container and lose nested XML.

- [ ] **Step 3: Implement the traversal order fix**

In `packages/core/metadata/orchestration/property/helpers.ts`, replace the `for (const k of Object.keys(obj)) { ... }` loop inside `walkXml` with this version:

```ts
for (const k of Object.keys(obj)) {
  const directKey = propsAtPath[k]
  if (directKey !== undefined && !added.has(directKey)) {
    added.add(directKey)
    result.push(directKey)
  }

  if (childContainers.has(k)) {
    const nested = walkXml(obj[k], pathPrefix.concat([k]))
    for (const key of nested) {
      if (!added.has(key)) {
        added.add(key)
        result.push(key)
      }
    }
  }
}
```

This preserves all existing nested-container behavior and adds the missing case: when `k` is both a direct property XML key and a parent container, the direct property is imported first.

- [ ] **Step 4: Run the helper tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/orchestration/property/helpers.test.ts
```

Expected: PASS for all tests in `helpers.test.ts`.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/orchestration/property/helpers.test.ts packages/core/metadata/orchestration/property/helpers.ts
git commit -m "test: preserve direct container XML order"
```

---

### Task 2: Add Client Form Coverage For Conditional Appearance Without Attributes

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Create the short XML fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml` with this exact content. Keep the XML declaration because `xmlExport` emits it for full-form exports.

```xml
﻿<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Attributes>
		<ConditionalAppearance>
			<dcsset:viewMode>Normal</dcsset:viewMode>
		</ConditionalAppearance>
	</Attributes>
</Form>
```

- [ ] **Step 2: Add the expected TS fixture data**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`, change the `fullClientApplicationForm` type annotation:

```ts
export const fullClientApplicationForm: Omit<
  Required<ClientApplicationForm>,
  "uuid" | "formType" | "name" | "attributesConditionalAppearance"
> = {
```

Change the `fullClientApplicationFormYAML` type annotation:

```ts
export const fullClientApplicationFormYAML: Omit<
  Required<ClientApplicationFormYAML>,
  "УсловноеОформлениеРеквизитов"
> = {
```

Add this fixture after `minimalClientApplicationForm`:

```ts
export const conditionalAppearanceWithoutAttributesClientApplicationForm: ClientApplicationForm = {
  ...minimalClientApplicationForm,
  attributesConditionalAppearance: {
    itemType: "ConditionalAppearance",
    viewMode: "Normal",
  },
}
```

- [ ] **Step 3: Add the failing import test**

In `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`, add `conditionalAppearanceWithoutAttributesClientApplicationForm` to the import from `./__fixtures__/data`:

```ts
import {
  conditionalAppearanceWithoutAttributesClientApplicationForm,
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "./__fixtures__/data"
```

Add this test after `it("should import minimal", ...)`:

```ts
it("imports conditional appearance without attributes", () => {
  const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
    import.meta.url,
    "conditionalAppearanceWithoutAttributes.xml"
  )
  const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "minimalMetadata.xml"
  )
  const result = importClientApplicationFormFromXML({
    context: mockContextFromXML(),
    xml: xmlData.Form,
    xmlMetadata: xmlMetadata.MetaDataObject,
  })

  expect(result).toEqual(conditionalAppearanceWithoutAttributesClientApplicationForm)
})
```

- [ ] **Step 4: Add the failing export test**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, add `conditionalAppearanceWithoutAttributesClientApplicationForm` to the import from `./__fixtures__/data`:

```ts
import {
  conditionalAppearanceWithoutAttributesClientApplicationForm,
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "./__fixtures__/data"
```

Add this test after `it("should export minimal", ...)`:

```ts
it("exports conditional appearance without attributes", () => {
  const expectedResult = readXMLFixtureAsString(import.meta.url, "conditionalAppearanceWithoutAttributes.xml")
  const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
    import.meta.url,
    "conditionalAppearanceWithoutAttributes.xml"
  )
  const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "minimalMetadata.xml"
  )
  const referenceForm = importClientApplicationFormFromXML({
    context: mockContextFromXML({ forReference: true }),
    xml: referenceFormXML.Form,
    xmlMetadata: referenceMetadataXML.MetaDataObject,
  })
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: conditionalAppearanceWithoutAttributesClientApplicationForm,
    referenceForm,
  })

  const result = xmlExport({ Form: xmlData })

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 5: Run the client form tests and verify the new cases fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts -t "conditional appearance without attributes"
```

Expected: FAIL. Import should fail because `attributesConditionalAppearance` is not yet in rules and `FormAttributes` treats the conditional-only `<Attributes>` container as an attribute. Export should fail because the model field is not yet serialized.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "test: cover form attributes conditional appearance"
```

---

### Task 3: Wire Conditional Appearance Through Rules

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`

- [ ] **Step 1: Add the form-level rules property**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, add `attributesConditionalAppearance` immediately after the existing `attributes` property:

```ts
    attributesConditionalAppearance: {
      yaml: "УсловноеОформлениеРеквизитов",
      type: "ConditionalAppearance",
      xml: "ConditionalAppearance",
      xmlParents: ["Attributes"],
      tag: FormRulesTags.Form,
    },
```

Do not change the existing `attributes` rule. It must keep `defaultValueXMLEmpty: []` so `<Attributes/>` imports as `attributes: []`.

- [ ] **Step 2: Update the XML type for `<Attributes>`**

In `packages/core/metadata/forms/clientApplicationForm/types.ts`, replace the `Attributes` field in `ClientApplicationFormXML`:

```ts
  Attributes?: {
    Attribute?: FormAttributesXML
    ConditionalAppearance?: Record<string, unknown>
  }
```

This matches both supported shapes:

```xml
<Attributes/>
```

and:

```xml
<Attributes>
	<ConditionalAppearance>
		<dcsset:viewMode>Normal</dcsset:viewMode>
	</ConditionalAppearance>
</Attributes>
```

- [ ] **Step 3: Make `FormAttributes` import conditional-only containers as an empty attributes list**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`, add this helper before `export const importFormAttributesFromXML`:

```ts
const isAttributesContainerWithoutAttributes = (xml: unknown): boolean => {
  if (xml === null || xml === undefined || Array.isArray(xml) || typeof xml !== "object") return false

  const xmlObject = xml as Record<string, unknown>
  return !("Attribute" in xmlObject) && !("_name" in xmlObject) && "ConditionalAppearance" in xmlObject
}
```

Then replace the start of `importFormAttributesFromXML` after `if (!xml) return undefined` with:

```ts
  if (isAttributesContainerWithoutAttributes(xml)) return []

  const xmlAttributes = "Attribute" in xml ? xml.Attribute : xml
```

The complete function start should be:

```ts
export const importFormAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Attribute: FormAttributesXML } | FormAttributeXML | FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  if (isAttributesContainerWithoutAttributes(xml)) return []

  const xmlAttributes = "Attribute" in xml ? xml.Attribute : xml
  const items = Array.isArray(xmlAttributes) ? xmlAttributes : [xmlAttributes]
  const attributes = items.map((item) => importFormAttributeFromXML(context, item as FormAttributeXML))

  return attributes
}
```

- [ ] **Step 4: Run the new client form tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts -t "conditional appearance without attributes"
```

Expected: PASS for both new tests.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/types.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts
git commit -m "feat: preserve form attributes conditional appearance"
```

---

### Task 4: Verify Existing Empty Attributes Behavior And Focused Regression Surface

**Files:**
- Verify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/minimal.xml`
- Verify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Verify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Verify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Verify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
- Verify: `packages/core/metadata/orchestration/property/helpers.test.ts`

- [ ] **Step 1: Run the existing minimal form tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts -t "minimal"
```

Expected: PASS. This verifies the existing `minimal.xml` fixture still round-trips:

```xml
<Attributes/>
```

Expected model shape remains:

```ts
{
  childItems: [],
  commands: [],
  itemType: "ClientApplicationForm",
  attributes: [],
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
}
```

- [ ] **Step 2: Run the form attribute property tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS. This verifies the new `isAttributesContainerWithoutAttributes` guard did not change normal `<Attribute>` root fixture behavior.

- [ ] **Step 3: Run the orchestration helper tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/orchestration/property/helpers.test.ts
```

Expected: PASS. This verifies the shared XML order helper remains compatible with existing `xmlParents` behavior.

- [ ] **Step 4: Run the focused client form files**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: PASS. This verifies:

- existing full form import/export;
- existing minimal `<Attributes/>` import/export;
- new `<Attributes><ConditionalAppearance>...</ConditionalAppearance></Attributes>` import/export without `<Attribute>`;
- existing dynamic list export behavior.

- [ ] **Step 5: Commit final verification marker only if files changed during verification**

If verification required no edits, skip this step. If formatting or small corrections were made, commit them:

```bash
git add packages/core/metadata/orchestration/property/helpers.test.ts packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/conditionalAppearanceWithoutAttributes.xml packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/types.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts
git commit -m "test: verify form conditional appearance round trip"
```

---

## Self-Review

- Spec coverage: The plan preserves the round-trip diff source, implements option B with a separate form field, adds the conditional-only XML fixture, and keeps existing `<Attributes/>` coverage through `minimal.xml`.
- Placeholder scan: No incomplete steps remain; every code-changing step includes concrete code or exact file content.
- Type consistency: The property name is consistently `attributesConditionalAppearance`; XML key is consistently `ConditionalAppearance`; YAML key is consistently `УсловноеОформлениеРеквизитов`.
- Scope check: The plan is one focused subsystem: form attributes conditional appearance. It does not redesign `FormAttributes` or migrate YAML shape beyond the new optional rules field.
