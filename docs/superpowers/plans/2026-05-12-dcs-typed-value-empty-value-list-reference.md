# DCS Typed Value Empty ValueList Reference Preserve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import and export empty `v8:ValueListType` in `DcsMetadataTypedValue` without introducing a full editable value-list model.

**Architecture:** Add a narrow internal `EmptyValueList` variant to `DcsMetadataTypedValue`. The importer accepts only the empty platform shape with blank `v8:valueType`, `v8:lastId = -1`, and no items; the exporter writes the same XML shape.

**Tech Stack:** TypeScript, Vitest, existing DCS typed value registry, existing XML property test helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`: add `EmptyValueList` model and XML union member.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`: register `EmptyValueList` and map `v8:ValueListType`.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/emptyValueList.xml`: required XML fixture for the real failing shape.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`: include `emptyValueList` fixture in XML tests only.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`: import from the XML fixture.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`: export back to the XML fixture.

## Task 1: Add XML Fixture And Failing Tests

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/emptyValueList.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/emptyValueList.xml`:

```xml
<value xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">-1</v8:lastId>
</value>
```

- [ ] **Step 2: Add a model fixture**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts`, add this export after the `DcsMetadataTypedValueFixture` type:

```ts
export const emptyValueListTypedValue: DcsMetadataTypedValue = {
  type: "EmptyValueList",
}
```

Do not add this item to `dcsMetadataTypedValueFixtures`, because that array also drives YAML tests and the spec does not add YAML support.

- [ ] **Step 3: Add fromXML test for the XML fixture**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`, change the import:

```ts
import { dcsMetadataTypedValueFixtures, emptyValueListTypedValue } from "./__fixtures__/data"
```

Add:

```ts
  it("imports empty ValueListType", () => {
    expect(
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        path: "emptyValueList.xml",
        importMetaUrl: import.meta.url,
      })
    ).toEqual(emptyValueListTypedValue)
  })
```

- [ ] **Step 4: Add toXML test for the XML fixture**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`, change the import:

```ts
import { dcsMetadataTypedValueFixtures, emptyValueListTypedValue } from "./__fixtures__/data"
```

Add:

```ts
  it("exports empty ValueListType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: emptyValueListTypedValue,
      xmlRootTag: "value",
      path: "emptyValueList.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 5: Run tests and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts -t "empty ValueListType"
```

Expected: FAIL because `EmptyValueList` is not in the type union and `v8:ValueListType` is unsupported.

## Task 2: Add EmptyValueList Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`

- [ ] **Step 1: Extend the model union**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`, add this union member:

```ts
  | {
      type: "EmptyValueList"
    }
```

- [ ] **Step 2: Extend XML union**

Add this XML member to `DcsMetadataTypedValueXML`:

```ts
  | {
      "_xsi:type": "v8:ValueListType"
      "v8:valueType"?: Record<string, never>
      "v8:lastId"?: {
        "_xsi:type": "xs:decimal"
        "#text"?: string
      }
    }
```

- [ ] **Step 3: Run type checking for core tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts -t "empty ValueListType"
```

Expected: tests still FAIL at runtime until registry support is added; TypeScript should accept the fixture model.

## Task 3: Add Registry Support

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`

- [ ] **Step 1: Add helper functions**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`, add below `xmlText`:

```ts
const isEmptyRecord = (value: unknown): boolean =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0

const isEmptyValueType = (value: unknown): boolean => value === undefined || isEmptyRecord(value)

const assertEmptyValueListXML = (xml: DcsMetadataTypedValueXML): void => {
  const raw = xml as Record<string, unknown>
  const valueType = raw["v8:valueType"]
  const lastId = raw["v8:lastId"]
  const items = raw["v8:item"]
  const availableValues = raw["v8:availableValues"]

  const lastIdText =
    typeof lastId === "object" && lastId !== null ? String((lastId as Record<string, unknown>)["#text"]) : undefined
  const lastIdType =
    typeof lastId === "object" && lastId !== null
      ? String((lastId as Record<string, unknown>)["_xsi:type"])
      : undefined

  if (!isEmptyValueType(valueType) || lastIdText !== "-1" || lastIdType !== "xs:decimal") {
    throw new Error("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  }
  if (items !== undefined || availableValues !== undefined) {
    throw new Error("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  }
}
```

- [ ] **Step 2: Register EmptyValueList**

Add this item to `DcsMetadataTypedValueRegistry`:

```ts
  EmptyValueList: {
    detect: () => false,
    fromYAML: () => {
      throw new Error("DcsMetadataTypedValue YAML: EmptyValueList is XML-only")
    },
    fromXML: ({ xml }) => {
      assertEmptyValueListXML(xml)
      return { type: "EmptyValueList" }
    },
    toYAML: () => {
      throw new Error("DcsMetadataTypedValue YAML: EmptyValueList is XML-only")
    },
    toXML: () => ({
      "_xsi:type": "v8:ValueListType",
      "v8:valueType": {},
      "v8:lastId": {
        "_xsi:type": "xs:decimal",
        "#text": "-1",
      },
    }),
  },
```

- [ ] **Step 3: Map XML type**

In `DcsMetadataTypedValueTypeFromXML`, add:

```ts
    case "v8:ValueListType":
      return "EmptyValueList"
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts -t "empty ValueListType"
```

Expected: PASS.

- [ ] **Step 5: Commit XML support slice**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/data.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/__fixtures__/emptyValueList.xml packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
git commit -m "fix: :bug: сохранить пустой ValueListType в DCS"
```

## Task 4: Guard Non-Empty ValueListType

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`

- [ ] **Step 1: Add a rejection test for non-empty ValueListType**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`, add:

```ts
  it("rejects non-empty ValueListType", () => {
    expect(() =>
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        xmlString: `<value xsi:type="v8:ValueListType">
	<v8:valueType/>
	<v8:lastId xsi:type="xs:decimal">0</v8:lastId>
	<v8:item>
		<v8:id>0</v8:id>
	</v8:item>
</value>`,
      })
    ).toThrow("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  })
```

- [ ] **Step 2: Run the rejection test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts -t "rejects non-empty ValueListType"
```

Expected: PASS.

- [ ] **Step 3: Commit guard test**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts
git commit -m "test: :white_check_mark: зафиксировать границы ValueListType"
```

## Task 5: Verification

**Files:**
- No file changes.

- [ ] **Step 1: Run all typed value tests**

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected: all typed value tests PASS.

- [ ] **Step 2: Run the full test suite**

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all package test suites PASS.
