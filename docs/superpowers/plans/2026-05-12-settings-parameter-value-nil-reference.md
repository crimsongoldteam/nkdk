# SettingsParameterValue Nil Reference Preserve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `<dcscor:value xsi:nil="true"/>` for `SettingsParameterValue` during XML round-trip when the current model has no explicit value.

**Architecture:** Keep the public model unchanged: no new required `value: null` contract. Store nil only in reference imports using a small internal marker, then make `exportParameterValueToDcsXML` consult the matched reference item when `data.value` is absent.

**Tech Stack:** TypeScript, Vitest, project XML property test helpers, existing DCS `SettingsParameterValue` modules.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`: add an internal reference-only marker type field for nil XML.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts`: detect `dcscor:value xsi:nil="true"` during reference import and keep normal import domain-clean.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`: accept reference data recursively, restore nil only when current value is absent, and keep explicit value priority.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`: add nil reference XML fixture data.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`: assert normal import and reference import behavior.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`: assert reference restoration, explicit value priority, and recursive matching.

## Task 1: Capture Current Nil Behavior With Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`

- [ ] **Step 1: Add nil XML fixture data**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`, add:

```ts
export const xmlNilSettingsParameterValue = `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>Текст</dcscor:parameter>
	<dcscor:value xsi:nil="true"/>
</dcscor:item>`

export const nilSettingsParameterValueRule: SettingsParameterValuePropertyRule = {
  type: "SettingsParameterValue",
  valueType: "DesignTimeValue",
  yaml: "Текст",
}

export const nilSettingsParameterValue = {
  use: false,
  parameter: "Текст",
} satisfies SettingsParameterValue
```

- [ ] **Step 2: Add normal import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`, add:

```ts
import {
  nilSettingsParameterValue,
  nilSettingsParameterValueRule,
  xmlNilSettingsParameterValue,
} from "./__fixtures__/data"
```

Add the test:

```ts
  it("imports nil SettingsParameterValue without public value", () => {
    expect(
      testImportPropertyFromXML({
        rule: nilSettingsParameterValueRule,
        xmlRootTag: "dcscor:item",
        xmlString: xmlNilSettingsParameterValue,
      })
    ).toEqual(nilSettingsParameterValue)
  })
```

- [ ] **Step 3: Add reference import test**

Add this test in the same file:

```ts
  it("keeps nil marker only for reference import", () => {
    expect(
      testImportPropertyFromXML({
        rule: nilSettingsParameterValueRule,
        xmlRootTag: "dcscor:item",
        xmlString: xmlNilSettingsParameterValue,
        forReference: true,
      })
    ).toEqual({
      ...nilSettingsParameterValue,
      __referenceNilValue: true,
    })
  })
```

- [ ] **Step 4: Run import tests and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts -t "nil"
```

Expected: FAIL before implementation. Current import calls `importDcsMetadataValueFromDcsXML` for nil and throws or drops the value without the reference marker.

## Task 2: Implement Reference Nil Import

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts`

- [ ] **Step 1: Add the internal reference marker type**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`, extend `ParameterValue`:

```ts
export type ParameterValue = {
  use?: boolean
  parameter: string
  value?: MetadataDcsMetadataValue | MetadataDcsMetadataValue[]
  item?: ParameterValue[]
  __referenceNilValue?: true
}
```

This marker is intentionally not represented in YAML.

- [ ] **Step 2: Add nil detection helper**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts`, add:

```ts
const isNilValueFragment = (fragment: unknown): boolean =>
  typeof fragment === "object" &&
  fragment !== null &&
  !Array.isArray(fragment) &&
  ((fragment as Record<string, unknown>)["_xsi:nil"] === true ||
    (fragment as Record<string, unknown>)["_xsi:nil"] === "true")
```

- [ ] **Step 3: Skip nil values for normal import and mark reference import**

Replace the `valueParts` block with:

```ts
  const nilValuePresent = valueFragments.some(isNilValueFragment)
  const valueParts = valueFragments
    .filter((fragment) => !isNilValueFragment(fragment))
    .map((fragment) => importDcsMetadataValueFromDcsXML(context, dcsRule, { "dcscor:value": fragment }))
  const value: ParameterValue["value"] =
    valueParts.length === 0 ? undefined : valueParts.length === 1 ? valueParts[0] : valueParts
```

Add the marker to `base`:

```ts
    ...(context.fromXML.forReference && nilValuePresent ? { __referenceNilValue: true as const } : {}),
```

- [ ] **Step 4: Run import tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts -t "nil"
```

Expected: PASS.

- [ ] **Step 5: Commit import slice**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts
git commit -m "fix: :bug: сохранять reference nil в DCS ParameterValue"
```

## Task 3: Restore Nil On XML Export

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`

- [ ] **Step 1: Add export tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`, add the same imports:

```ts
import {
  fixtureFormatLocalString,
  nilSettingsParameterValue,
  nilSettingsParameterValueRule,
  xmlNilSettingsParameterValue,
} from "./__fixtures__/data"
```

Add reference restoration test:

```ts
  it("restores nil value from reference when current value is absent", () => {
    const reference = testImportPropertyFromXML({
      rule: nilSettingsParameterValueRule,
      xmlRootTag: "dcscor:item",
      xmlString: xmlNilSettingsParameterValue,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: nilSettingsParameterValueRule,
      value: nilSettingsParameterValue,
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toEqual(xmlNilSettingsParameterValue)
  })
```

Add explicit value priority test:

```ts
  it("exports explicit value instead of reference nil", () => {
    const reference = testImportPropertyFromXML({
      rule: nilSettingsParameterValueRule,
      xmlRootTag: "dcscor:item",
      xmlString: xmlNilSettingsParameterValue,
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule: nilSettingsParameterValueRule,
      value: {
        ...nilSettingsParameterValue,
        value: fixtureFormatLocalString,
      },
      xmlRootTag: "dcscor:item",
      referenceMetadata: reference,
    })

    expect(result).toContain('<dcscor:value xsi:type="v8:LocalStringType">')
    expect(result).not.toContain('xsi:nil="true"')
  })
```

- [ ] **Step 2: Thread reference data into exportParameterValueToDcsXML**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`, extend params:

```ts
  referenceData?: ParameterValue | SettingsParameterValue | undefined
```

Read it:

```ts
  const { context, rule, data, rootSettingsXsi, referenceData } = params
```

- [ ] **Step 3: Add reference matching for children**

Add helper functions above `exportParameterValueToDcsXML`:

```ts
const findReferenceParameterValue = (
  data: ParameterValue | SettingsParameterValue,
  referenceItems: ParameterValue[] | undefined,
  index: number
): ParameterValue | undefined => {
  if (referenceItems === undefined) return undefined

  const sameParameter = referenceItems.filter((referenceItem) => referenceItem.parameter === data.parameter)
  if (sameParameter.length === 1) return sameParameter[0]

  return referenceItems[index] ?? sameParameter[0]
}
```

When exporting children, pass the matched reference:

```ts
  const itemsXml = data.item?.map((child, index) =>
    exportParameterValueToDcsXML({
      context,
      rule,
      data: child,
      referenceData: findReferenceParameterValue(child, referenceData?.item, index),
      rootSettingsXsi: hasSettingsExtension(child),
    })
  )
```

- [ ] **Step 4: Add nil node when current value is absent**

After building `valueNodes`, add:

```ts
  if (valueNodes.length === 0 && data.value === undefined && referenceData?.__referenceNilValue === true) {
    valueNodes.push({ "_xsi:nil": true } as ParameterValueDcsValueFragment)
  }
```

Update `exportSettingsParameterValueToDcsXML` to forward root reference:

```ts
export const exportSettingsParameterValueToDcsXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  data: ParameterValue | SettingsParameterValue,
  referenceData?: ParameterValue | SettingsParameterValue | undefined
): ParameterValueXML | SettingsParameterValueXML =>
  exportParameterValueToDcsXML({
    context,
    rule: rule as unknown as SettingsParameterValuePropertyRule,
    data,
    referenceData,
    rootSettingsXsi: (rule as SettingsParameterValuePropertyRule).exportSettingsXsiType ?? true,
  })
```

- [ ] **Step 5: Run export tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts -t "nil"
```

Expected: PASS.

- [ ] **Step 6: Commit export slice**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
git commit -m "fix: :bug: восстанавливать nil из reference DCS"
```

## Task 4: Verification

**Files:**
- No file changes.

- [ ] **Step 1: Run all parameter value tests**

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue
```

Expected: all parameter value tests PASS.

- [ ] **Step 2: Run full project tests**

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all package test suites PASS.
