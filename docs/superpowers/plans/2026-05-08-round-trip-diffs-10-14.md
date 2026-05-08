# Round-Trip Diffs 10-14 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two approved XML round-trip differences from indexes 10-14: preserve an empty `<ListSettings/>` for `DynamicList`, and preserve the reference `d6p1:Undefined` type marker for `DCSParameter.value` when the model value is missing or explicitly `undefined`.

**Architecture:** Keep the fixes narrow. `DynamicList` uses the existing orchestration-level `requiredXMLParents` mechanism. `DCSParameter` gets a collection-level export wrapper that only patches `dcssch:value` from reference XML for the special `v8:Type` + `*:Undefined` case; `null` and ordinary undefined values continue through the existing export path.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser`, existing `metadata/orchestration` export helpers, pnpm workspace commands.

---

## Boundaries

- [ ] Do not address `DefaultVisible`; that difference is intentionally out of scope.
- [ ] Do not modify existing XML fixtures; add a new focused fixture for empty `ListSettings`.
- [ ] Do not add broad namespace preservation to `MetadataValue` or generic XML export.
- [ ] Do not change XML import behavior.
- [ ] Keep `null` exporting as `xsi:nil`.

---

## File Map

- `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`: declares that `DynamicList` always materializes the `ListSettings` XML parent.
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`: holds the expected model for the new empty-`ListSettings` fixture.
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/emptyListSettings.xml`: new source-of-truth fixture for `<ListSettings/>`.
- `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`: covers import and round-trip for the new fixture.
- `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`: covers direct export for the new fixture.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts`: contains the narrow collection export wrapper for `DCSParameter.value`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/types.ts`: registers the custom `DCSParameters` XML exporter.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`: covers reference `d6p1:Undefined` behavior and guards existing `xsi:nil` behavior.

---

## Task 1: Preserve Empty `ListSettings` For `DynamicList`

**Files:**

- `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/emptyListSettings.xml`
- `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`

### 1. Add The Model Fixture

- [ ] In `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`, add this fixture near `minimalDynamicList`:

```ts
export const emptyListSettingsDynamicList = {
	customQuery: false,
	dynamicDataRead: true,
	itemType: "DynamicList",
	mainTable: "Catalog.Справочник1",
} as const satisfies DynamicList
```

### 2. Add The XML Fixture

- [ ] Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/emptyListSettings.xml`:

```xml
<Settings xsi:type="DynamicList">
	<ManualQuery>false</ManualQuery>
	<DynamicDataRead>true</DynamicDataRead>
	<MainTable>Catalog.Справочник1</MainTable>
	<ListSettings/>
</Settings>
```

### 3. Add Import And Round-Trip Coverage

- [ ] In `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`, extend the fixture import:

```ts
import {
	emptyListSettingsDynamicList,
	fullDynamicList,
	minimalDynamicList,
} from "./__fixtures__/data"
```

- [ ] Add this import test inside the existing `describe("DynamicListFromXML", ...)` block:

```ts
	it("should import empty ListSettings", () => {
		const result = testImportPropertyFromXML({
			rule,
			path: "emptyListSettings.xml",
			xmlRootTag: "Settings",
			importMetaUrl: import.meta.url,
		})

		expect(result).toEqual(emptyListSettingsDynamicList)
	})
```

- [ ] Add this round-trip test in the same file:

```ts
	it("round-trip: emptyListSettings.xml import -> export", () => {
		const { expectedResult, result } = testRoundTripPropertyXML({
			rule,
			path: "emptyListSettings.xml",
			xmlRootTag: "Settings",
			importMetaUrl: import.meta.url,
		})

		expect(result).toEqual(expectedResult)
	})
```

### 4. Add Export Coverage

- [ ] In `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`, extend the fixture import:

```ts
import {
	emptyListSettingsDynamicList,
	fullDynamicList,
	minimalDynamicList,
} from "./__fixtures__/data"
```

- [ ] Add this export test inside the existing `describe("DynamicListToXML", ...)` block:

```ts
	it("should export empty ListSettings", () => {
		const { expectedResult, result } = testExportPropertyToXML({
			rule,
			value: emptyListSettingsDynamicList,
			path: "emptyListSettings.xml",
			xmlRootTag: "Settings",
			importMetaUrl: import.meta.url,
		})

		expect(result).toEqual(expectedResult)
	})
```

### 5. Confirm The Failing Test First

- [ ] Run the focused tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/dynamicList -t "empty ListSettings"
```

- [ ] Expected result before implementation: export or round-trip fails because `<ListSettings/>` is absent from the result XML.

### 6. Implement The Minimal Rule Change

- [ ] In `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`, add `requiredXMLParents` at the top level of `DynamicListRules`:

```ts
export const DynamicListRules = defineMetadataItemRule<DynamicList>({
	itemType: "DynamicList",
	requiredXMLParents: [["ListSettings"]],
	properties: {
```

### 7. Verify The DynamicList Fix

- [ ] Re-run the focused tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/dynamicList -t "empty ListSettings"
```

- [ ] Run the whole `DynamicList` test file set:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/dynamicList
```

- [ ] Expected result: all `DynamicList` tests pass.

### 8. Commit Task 1

- [ ] Stage only the `DynamicList` files:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/rules.ts \
	packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts \
	packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/emptyListSettings.xml \
	packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts \
	packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts
```

- [ ] Commit:

```bash
git commit -m "fix: :bug: сохранить пустой ListSettings в DynamicList"
```

---

## Task 2: Preserve Reference `d6p1:Undefined` For `DCSParameter.value`

**Files:**

- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/types.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`

### 1. Add Focused Tests First

- [ ] In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`, add these helpers near the existing `describe` setup:

```ts
const undefinedTypeReferenceValue = {
	"_xmlns:d6p1": "http://v8.1c.ru/8.2/data/types",
	"_xsi:type": "v8:Type",
	"#text": "d6p1:Undefined",
} as const

const parameterWithoutValue = {
	itemType: "DCSParameter",
	name: "ТипЗначенияКлюча",
	title: { items: { ru: "Тип значения ключа" } },
} as const

const parameterWithUndefinedTypeReference = {
	...parameterWithoutValue,
	value: undefinedTypeReferenceValue,
} as const
```

- [ ] Add the missing-value test:

```ts
	it("exports missing value from reference d6p1 Undefined", () => {
		const result = exportDCSParameters(
			[parameterWithoutValue],
			[parameterWithUndefinedTypeReference],
		)

		expect(result).toContain(
			'<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>',
		)
	})
```

- [ ] Add the explicit-undefined test:

```ts
	it("exports explicit undefined value from reference d6p1 Undefined", () => {
		const result = exportDCSParameters(
			[{ ...parameterWithoutValue, value: undefined }],
			[parameterWithUndefinedTypeReference],
		)

		expect(result).toContain(
			'<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>',
		)
	})
```

- [ ] Keep the existing tests that assert ordinary `undefined` still exports as `xsi:nil`; those protect the narrowness of the fallback.

### 2. Confirm The Failing Test First

- [ ] Run the focused tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts -t "reference d6p1 Undefined"
```

- [ ] Expected result before implementation: the output lacks the namespace-preserving `dcssch:value` from the reference.

### 3. Add A Collection Export Wrapper

- [ ] Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts`:

```ts
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import type { NamedElementXML } from "~/metadata/orchestration/metadataCollection/types"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"

import { DCSParameterRules } from "./rules"
import type { DCSParameter, DCSParameters } from "./types"

type ReferenceUndefinedTypeValueXML = Record<string, unknown> & {
	"#text": string
	"_xsi:type": "v8:Type"
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object"

const getReferenceUndefinedTypeValue = (
	value: unknown,
): ReferenceUndefinedTypeValueXML | undefined => {
	if (!isObject(value) || value["_xsi:type"] !== "v8:Type") {
		return undefined
	}

	const text = value["#text"]
	if (typeof text !== "string") {
		return undefined
	}

	const [prefix, name] = text.split(":")
	if (!prefix || name !== "Undefined") {
		return undefined
	}

	const namespaceKey = `_xmlns:${prefix}`
	if (typeof value[namespaceKey] !== "string") {
		return undefined
	}

	return value as ReferenceUndefinedTypeValueXML
}

const hasMissingValue = (item: DCSParameter): boolean =>
	!Object.prototype.hasOwnProperty.call(item, "value") ||
	item.value === undefined

const findReferenceItem = (
	item: DCSParameter,
	referenceData: DCSParameters | undefined,
): DCSParameter | undefined =>
	referenceData?.find((referenceItem) => referenceItem.name === item.name)

export const exportDCSParametersToXML: ExportToXMLFunctionNew = (params) => {
	const data = params.value as DCSParameters | undefined
	const referenceData = params.referenceMetadata as DCSParameters | undefined
	const inputData =
		data !== undefined && data.length > 0
			? data
			: referenceData !== undefined && referenceData.length > 0
				? referenceData
				: []

	if (inputData.length === 0) {
		return undefined
	}

	const result = inputData.map((item, index) => {
		const referenceItem =
			findReferenceItem(item, referenceData) ?? referenceData?.[index]
		const referenceUndefinedValue = hasMissingValue(item)
			? getReferenceUndefinedTypeValue(referenceItem?.value)
			: undefined
		const referenceForExport =
			referenceUndefinedValue !== undefined && referenceItem !== undefined
				? { ...referenceItem, value: undefined }
				: referenceItem

		const itemXML =
			(exportMetadataItemToXML({
				context: params.context,
				data: item,
				referenceData: referenceForExport,
				rule: DCSParameterRules,
			}) as NamedElementXML | undefined) ?? {}

		if (referenceUndefinedValue !== undefined) {
			itemXML["dcssch:value"] = referenceUndefinedValue
		}

		return itemXML
	})

	return params.rule.xml === "Parameter" ? result : { Parameter: result }
}
```

### 4. Register The Custom Exporter

- [ ] In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/types.ts`, add the import:

```ts
import { exportDCSParametersToXML } from "./toXML"
```

- [ ] Add `toXML` to the collection registration:

```ts
registerMetadataItemCollectionRule({
	propertyType: "DCSParameters",
	itemRule: DCSParameterRules,
	xmlElement: "Parameter",
	keyField: "name",
	toXML: exportDCSParametersToXML,
})
```

### 5. Verify The DCSParameter Fix

- [ ] Re-run the focused tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts -t "reference d6p1 Undefined"
```

- [ ] Run all `DCSParameter` tests:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter
```

- [ ] Expected result: all `DCSParameter` tests pass, including existing `xsi:nil` cases.

### 6. Commit Task 2

- [ ] Stage only the `DCSParameter` files:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts \
	packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/types.ts \
	packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts
```

- [ ] Commit:

```bash
git commit -m "fix: :bug: сохранить reference Undefined в DCSParameter"
```

---

## Task 3: Round-Trip And Full Verification

### 1. Run The Original Round-Trip Slice

- [ ] From `/Users/nikita/git/nakidka-core/.worktrees/round-trip-sequential`, run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 10
```

- [ ] Expected result: indexes 10-14 no longer include the empty `ListSettings` and `d6p1:Undefined` namespace differences. Other unrelated differences may remain outside this approved scope.

### 2. Run Package Tests

- [ ] Run the core package tests:

```bash
pnpm --filter '@nakidka/core' test
```

- [ ] Expected result: all core tests pass.

### 3. Run Full Repository Tests

- [ ] Because this is a fresh worktree, ensure Langium files are generated:

```bash
pnpm --filter nkdk-language langium:generate
```

- [ ] Run the full suite from the worktree root:

```bash
pnpm test
```

- [ ] Expected result: all package tests pass.

### 4. Final Git Check

- [ ] Confirm the worktree has only intentional committed changes:

```bash
git status --short
```

- [ ] If the plan file itself is still uncommitted, stage and commit it separately:

```bash
git add docs/superpowers/plans/2026-05-08-round-trip-diffs-10-14.md
git commit -m "docs: :memo: описать план round-trip 10-14"
```

---

## Notes For Review

- `requiredXMLParents: [["ListSettings"]]` should create the parent only when missing and should not overwrite non-empty `ListSettings` content created by nested properties.
- The `DCSParameter` fallback treats absent `value` and explicit `value: undefined` the same.
- The `DCSParameter` fallback requires all of these reference conditions: `_xsi:type` is `v8:Type`, text is `<prefix>:Undefined`, and `_xmlns:<prefix>` is present.
- `value: null` stays outside the fallback and remains `xsi:nil`.
