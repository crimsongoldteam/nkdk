# DCS FilterItem Reference Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `userSettingID` and compact `userSettingPresentation` XML for nested DCS `FilterItemComparison` after YAML round-trip.

**Architecture:** Keep YAML clean: it stores `ИспользоватьПользовательскуюНастройку: Истина`, not GUIDs or XML shape. Fix the common `FilterItem.toXML` reference matcher so it finds an unambiguous reference item and passes it into existing property export; `UserSettingsID.toXML` and `DcsLocalStringType.toXML` already restore the XML details when reference reaches them.

**Tech Stack:** TypeScript, Vitest, metadata rules/property orchestration, XML/YAML round-trip scripts.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts`
  - Add failing coverage for ambiguous reference matching and `xs:string` presentation restoration.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.ts`
  - Replace first-match reference lookup with safe candidate selection.
  - Normalize DCS field values for matching only.
  - Use `rightValue` as a tie-breaker when needed.
- Read before edits: `.agents/knowledge/metadata/INDEX.md`, `.agents/knowledge/metadata/sources-of-truth.md`, `.agents/knowledge/metadata/round-trip-cycle.md`, `.agents/knowledge/metadata/yaml-contract.md`
  - Required by repository metadata rules.
- Do not modify XML fixtures.

---

### Task 1: Add Red Tests For Reference Matching

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts`

- [ ] **Step 1: Add a typed test helper near the existing `guidA/guidB` constants**

Add this helper inside `describe("semantic reference matching", () => { ... })`, after `guidB`:

```ts
const asReferenceUserSettingID = (value: string): FilterItemComparison["userSettingID"] =>
  value as FilterItemComparison["userSettingID"]
```

- [ ] **Step 2: Replace existing `as any` GUID casts in this block**

Change:

```ts
const refA: FilterItemComparison = { ...itemA, userSettingID: guidA as any }
const refB: FilterItemComparison = { ...itemB, userSettingID: guidB as any }
```

to:

```ts
const refA: FilterItemComparison = { ...itemA, userSettingID: asReferenceUserSettingID(guidA) }
const refB: FilterItemComparison = { ...itemB, userSettingID: asReferenceUserSettingID(guidB) }
```

- [ ] **Step 3: Add a failing ambiguity test**

Add this test inside `describe("semantic reference matching", () => { ... })`:

```ts
it("FilterItemComparison: не подставляет GUID при неоднозначном совпадении", () => {
  const current: FilterItemComparison = {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "ТипОплаты" },
    comparisonType: "Equal",
    userSettingID: true,
  }

  const firstReference: FilterItemComparison = {
    ...current,
    rightValue: { type: "string", value: "Наличные" },
    userSettingID: asReferenceUserSettingID(guidA),
  }
  const secondReference: FilterItemComparison = {
    ...current,
    rightValue: { type: "string", value: "Безналичные" },
    userSettingID: asReferenceUserSettingID(guidB),
  }

  const { result } = testExportPropertyToXML({
    rule,
    value: [current],
    xmlRootTag: "dcsset:item",
    referenceMetadata: [firstReference, secondReference],
  })

  expect(result).not.toContain(guidA)
  expect(result).not.toContain(guidB)
})
```

- [ ] **Step 4: Add coverage for `userSettingPresentation` xs:string restoration**

Add this test inside the same `describe` block:

```ts
it("FilterItemComparison: сохраняет xs:string userSettingPresentation из reference", () => {
  const guid = "eeeeeeee-0000-0000-0000-000000000005"
  const current: FilterItemComparison = {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "ТипОплаты" },
    comparisonType: "Equal",
    userSettingID: true,
    userSettingPresentation: { items: { ru: "Способ оплаты" } },
  }
  const reference: FilterItemComparison = {
    ...current,
    userSettingID: asReferenceUserSettingID(guid),
    userSettingPresentation: "Способ оплаты",
  }

  const { result } = testExportPropertyToXML({
    rule,
    value: [current],
    xmlRootTag: "dcsset:item",
    referenceMetadata: [reference],
  })

  expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
  expect(result).toContain(
    `<dcsset:userSettingPresentation xsi:type="xs:string">Способ оплаты</dcsset:userSettingPresentation>`
  )
  expect(result).not.toContain(`xsi:type="v8:LocalStringType"`)
})
```

- [ ] **Step 5: Run the focused test and confirm it fails for the ambiguity case**

Run:

```bash
pnpm --dir packages/core vitest run --no-isolate --sequence.shuffle packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
```

Expected: FAIL on `FilterItemComparison: не подставляет GUID при неоднозначном совпадении`, because current code takes the first matching reference item.

---

### Task 2: Make Reference Matching Safe And Deterministic

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.ts`

- [ ] **Step 1: Replace the comparison match helpers**

Replace:

```ts
const filterItemComparisonMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({ leftValue: item.leftValue, comparisonType: item.comparisonType })

const filterItemGroupMatchKey = (item: FilterItemGroup): string => String(item.groupType ?? "")
```

with:

```ts
const normalizeFilterItemMatchValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeFilterItemMatchValue)
  if (value === null || typeof value !== "object") return value

  const record = value as Record<string, unknown>
  if (record.type === "Field" && typeof record.value === "string") {
    return { ...record, value: record.value.startsWith(".") ? record.value.slice(1) : record.value }
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, itemValue]) => [key, normalizeFilterItemMatchValue(itemValue)])
  )
}

const filterItemComparisonBaseMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({
    leftValue: normalizeFilterItemMatchValue(item.leftValue),
    comparisonType: item.comparisonType,
  })

const filterItemComparisonStrictMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({
    leftValue: normalizeFilterItemMatchValue(item.leftValue),
    comparisonType: item.comparisonType,
    rightValue: normalizeFilterItemMatchValue(item.rightValue),
  })

const filterItemGroupMatchKey = (item: FilterItemGroup): string => String(item.groupType ?? "")
```

- [ ] **Step 2: Add an exact-one helper**

Add below the match key helpers:

```ts
const findOnlyIndex = (indices: number[]): number | undefined => (indices.length === 1 ? indices[0] : undefined)
```

- [ ] **Step 3: Replace `findReferenceFilterItem` with candidate-based matching**

Replace the whole `findReferenceFilterItem` function with:

```ts
const findReferenceFilterItem = (
  item: FilterItem[number],
  referenceItems: FilterItem,
  usedIndices: Set<number>
): FilterItem[number] | undefined => {
  const candidateIndices: number[] = []

  for (let i = 0; i < referenceItems.length; i++) {
    if (usedIndices.has(i)) continue
    const refItem = referenceItems[i]
    if (item.itemType !== refItem.itemType) continue

    if (
      item.itemType === "FilterItemComparison" &&
      refItem.itemType === "FilterItemComparison" &&
      filterItemComparisonBaseMatchKey(item) === filterItemComparisonBaseMatchKey(refItem)
    ) {
      candidateIndices.push(i)
      continue
    }

    if (
      item.itemType === "FilterItemGroup" &&
      refItem.itemType === "FilterItemGroup" &&
      filterItemGroupMatchKey(item) === filterItemGroupMatchKey(refItem)
    ) {
      candidateIndices.push(i)
    }
  }

  const onlyCandidateIndex = findOnlyIndex(candidateIndices)
  if (onlyCandidateIndex !== undefined) {
    usedIndices.add(onlyCandidateIndex)
    return referenceItems[onlyCandidateIndex]
  }

  if (item.itemType !== "FilterItemComparison") return undefined

  const strictCandidateIndices = candidateIndices.filter((index) => {
    const refItem = referenceItems[index]
    return (
      refItem.itemType === "FilterItemComparison" &&
      filterItemComparisonStrictMatchKey(item) === filterItemComparisonStrictMatchKey(refItem)
    )
  })

  const onlyStrictCandidateIndex = findOnlyIndex(strictCandidateIndices)
  if (onlyStrictCandidateIndex === undefined) return undefined

  usedIndices.add(onlyStrictCandidateIndex)
  return referenceItems[onlyStrictCandidateIndex]
}
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
pnpm --dir packages/core vitest run --no-isolate --sequence.shuffle packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
```

Expected: PASS.

---

### Task 3: Verify Nested FilterItem Round-Trip Behavior

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts`

- [ ] **Step 1: Add a nested group test**

Add this test inside `describe("semantic reference matching", () => { ... })`:

```ts
it("FilterItemGroup: передает reference во вложенный FilterItemComparison", () => {
  const guid = "ffffffff-0000-0000-0000-000000000006"
  const currentNested: FilterItemComparison = {
    itemType: "FilterItemComparison",
    leftValue: { type: "Field", value: "Контрагент" },
    comparisonType: "Equal",
    userSettingID: true,
    userSettingPresentation: { items: { ru: "Контрагент" } },
  }
  const referenceNested: FilterItemComparison = {
    ...currentNested,
    userSettingID: asReferenceUserSettingID(guid),
    userSettingPresentation: "Контрагент",
  }
  const currentGroup: FilterItemGroup = {
    itemType: "FilterItemGroup",
    groupType: "AndGroup",
    items: [currentNested],
  }
  const referenceGroup: FilterItemGroup = {
    itemType: "FilterItemGroup",
    groupType: "AndGroup",
    items: [referenceNested],
  }

  const { result } = testExportPropertyToXML({
    rule,
    value: [currentGroup],
    xmlRootTag: "dcsset:item",
    referenceMetadata: [referenceGroup],
  })

  expect(result).toContain(`<dcsset:userSettingID>${guid}</dcsset:userSettingID>`)
  expect(result).toContain(
    `<dcsset:userSettingPresentation xsi:type="xs:string">Контрагент</dcsset:userSettingPresentation>`
  )
})
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
pnpm --dir packages/core vitest run --no-isolate --sequence.shuffle packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
git commit -m "fix: :bug: восстановить reference для FilterItem"
```

Expected: commit succeeds.

---

### Task 4: Full Verification And Round-Trip

**Files:**
- No code edits expected.
- External XML repository from `.env` may become dirty after `round-trip-yaml`; keep that diff for analysis unless the user explicitly asks to clean it.

- [ ] **Step 1: Run the full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Run YAML round-trip diagnostics**

Run from repository root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previous DCS filter diff no longer removes nested `dcsset:userSettingID` and no longer expands the matched `dcsset:userSettingPresentation xsi:type="xs:string"` into `v8:LocalStringType`.

- [ ] **Step 3: If the XML repository has only expected diagnostic changes, report them**

Run in the XML repository shown by the round-trip script:

```bash
git status --short
```

Expected: any remaining files are round-trip diagnostic diffs, not changes in `nkdk`.

- [ ] **Step 4: Confirm `nkdk` working tree state**

Run:

```bash
git status --short
```

Expected: clean, except for intentionally uncommitted plan/spec files if execution started before committing them.

