# Nested MetadataValue Quoted String YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve double-quoted string semantics for nested `MetadataValue` YAML values so `"2"` round-trips as `xs:string`, not `xs:decimal`.

**Architecture:** Keep YAML style tracking in the existing YAML layer and add a tiny metadata-domain helper around `asExplicitYAMLStringIfMarked`. Apply it only at manual nested `MetadataValue` import boundaries where the parent/key are still available.

**Tech Stack:** TypeScript, Vitest, pnpm, existing `yaml/import.ts` double-quoted scalar marker support, existing metadata common object importers.

---

## File Structure

- Create `packages/core/metadata/commonObjects/metadataValue/explicitYAMLString.ts`
  - Owns the domain-named helper for restoring a double-quoted YAML scalar before passing it to `MetadataValue` import.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
  - Restores marker for nested `data.Значение`.
- Inspect, and modify only if the new test fails: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`
  - Locks existing array item behavior; restores marker for array items only if a failing parsed-YAML test proves it is needed.
- Test `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
  - Covers real YAML text where `Значение: "2"` must import as string.
- Test `packages/core/metadata/commonObjects/choiceList/fromYAML.test.ts`
  - Covers full choice list YAML text with quoted string and plain number.
- Test `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts`
  - Locks current string item behavior and documents whether quoted numeric array items remain plain command names.

Do not modify XML fixtures.

## Task 1: Add failing FormChoiceList YAML parser test

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`

- [ ] **Step 1: Add imports for real YAML parsing**

Add this import near the existing imports:

```ts
import { importFromYAML } from "~/yaml/import"
```

- [ ] **Step 2: Add the failing test**

Append this test inside `describe("importFormChoiceListFromYAML", () => { ... })`:

```ts
  it("imports double-quoted numeric string value from parsed YAML as string", () => {
    const yaml = importFromYAML<MetadataFormChoiceListValueYAML>(
      [
        "Представление: 2 знака",
        'Значение: "2"',
      ].join("\n")
    )

    const result = importFormChoiceListFromYAML(mockContext, yaml)

    expect(result.value).toEqual({
      type: "string",
      value: "2",
    })
  })
```

- [ ] **Step 3: Run the targeted test and verify RED**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
```

Expected: FAIL. The new test should show `result.value` as `{ type: "decimal", value: 2 }`.

- [ ] **Step 4: Commit the failing test**

```bash
git add packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать quoted string в FormChoiceList"
```

## Task 2: Implement the nested MetadataValue helper and fix FormChoiceList

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataValue/explicitYAMLString.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`

- [ ] **Step 1: Create the helper file**

Create `packages/core/metadata/commonObjects/metadataValue/explicitYAMLString.ts`:

```ts
import { YAMLStyleKey, asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"

export const restoreExplicitMetadataValueYAMLString = (
  parent: unknown,
  key: YAMLStyleKey,
  value: unknown
): unknown => asExplicitYAMLStringIfMarked(parent, key, value)
```

- [ ] **Step 2: Import the helper in FormChoiceList**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`, add:

```ts
import { restoreExplicitMetadataValueYAMLString } from "../explicitYAMLString"
```

- [ ] **Step 3: Restore marker before nested MetadataValue import**

Replace this line in `importFormChoiceListFromYAML`:

```ts
        importChoiceListValueFromYAML(context, data.Значение))
```

with:

```ts
        importChoiceListValueFromYAML(
          context,
          restoreExplicitMetadataValueYAMLString(data, "Значение", data.Значение) as MetadataFormChoiceListValueYAML["Значение"]
        ))
```

Keep the surrounding `data.Значение === undefined ? undefined : (...)` structure unchanged.

- [ ] **Step 4: Run the targeted test and verify GREEN**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the FormChoiceList fix**

```bash
git add packages/core/metadata/commonObjects/metadataValue/explicitYAMLString.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
git commit -m "fix: :bug: сохранить quoted string в FormChoiceList"
```

## Task 3: Add ChoiceList integration coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/choiceList/fromYAML.test.ts`

- [ ] **Step 1: Add import for real YAML parsing**

Add this import near the existing imports:

```ts
import { importFromYAML } from "~/yaml/import"
```

- [ ] **Step 2: Add integration test for quoted string and plain number**

Append this test inside `describe("importChoiceListFromYAML", () => { ... })`:

```ts
  it("preserves quoted numeric strings and plain numbers from parsed YAML", () => {
    const yaml = importFromYAML([
      "- Представление: 2 знака",
      '  Значение: "2"',
      "- Представление: 3",
      "  Значение: 3",
    ].join("\n"))

    const result = importChoiceListFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "2 знака" } },
        value: { type: "string", value: "2" },
      },
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "3" } },
        value: { type: "decimal", value: 3 },
      },
    ])
  })
```

- [ ] **Step 3: Run ChoiceList tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/choiceList/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run ChoiceList XML export tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/choiceList/toXML.test.ts
```

Expected: PASS. This confirms the restored model still exports through the existing XML path.

- [ ] **Step 5: Commit integration coverage**

```bash
git add packages/core/metadata/commonObjects/choiceList/fromYAML.test.ts
git commit -m "test: :white_check_mark: покрыть quoted string в ChoiceList"
```

## Task 4: Audit MobileDeviceCommandBarContent behavior

**Files:**
- Modify: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts`
- Modify only if the failing test proves it is needed: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`

- [ ] **Step 1: Add import for real YAML parsing**

Add this import near the existing imports:

```ts
import { importFromYAML } from "~/yaml/import"
```

- [ ] **Step 2: Add behavior-locking tests**

Append these tests inside `describe("importMobileDeviceCommandBarContentFromYAML", () => { ... })`:

```ts
  it("keeps quoted numeric command bar item as plain string", () => {
    const yaml = importFromYAML<unknown[]>('- "2"')

    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([{ type: "string", value: "2" }])
  })

  it("keeps plain numeric command bar item delegated to MetadataValue", () => {
    const yaml = importFromYAML<unknown[]>("- 2")

    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([{ type: "decimal", value: 2 }])
  })
```

- [ ] **Step 3: Run MobileDeviceCommandBarContent tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
```

Expected: PASS. If the first test fails, continue to Step 4. If it passes, skip Step 4 and commit only the tests.

- [ ] **Step 4: Apply helper only to non-string delegated array items if needed**

If Step 3 fails because a quoted scalar string is incorrectly delegated or parsed, modify `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts` to make the array item normalization explicit:

```ts
import { restoreExplicitMetadataValueYAMLString } from "../metadataValue/explicitYAMLString"
```

Replace the `.map((item) => ... )` block with:

```ts
    .map((item, index) => {
      const value = restoreExplicitMetadataValueYAMLString(yaml, index, item)
      return typeof value === "string"
        ? { type: "string" as const, value }
        : importMetadataValueFromYAML(context, { type: "MetadataValue" }, value)
    })
```

- [ ] **Step 5: Re-run MobileDeviceCommandBarContent tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the audit**

If only tests changed:

```bash
git add packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать quoted string в мобильной панели"
```

If implementation also changed:

```bash
git add packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
git commit -m "fix: :bug: сохранить quoted string в мобильной панели"
```

## Task 5: Audit DCS MetadataValue manual imports without broad changes

**Files:**
- Inspect: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Test only if a concrete failing case is found: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`

- [ ] **Step 1: Inspect direct MetadataValue import branches**

Open `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts` and inspect only branches that call:

```ts
importMetadataValueFromYAML(context, undefined, data as any)
```

Expected classification:

- `Field`: strings are normally field paths or literals; do not force marker unless a real parsed YAML quoted string reaches `MetadataValue`.
- `DesignTimeValue`: explicit quoted strings are already detected with `isExplicitYAMLString(data)`.
- `Primitive`: parsed quoted strings can matter, but this importer receives a direct value from the property layer, which already restores marker for `MetadataDcsMetadataValue` with `DesignTimeValue` in `property/fromYAML.ts` and DCS `parameterValue/fromYAML.ts`.

- [ ] **Step 2: Add no code if no concrete failing path exists**

If no direct parent/key is available at the DCS layer and existing callers already restore marker before entering it, do not change DCS code. Record this in the final task summary.

- [ ] **Step 3: If a concrete failing path is found, add a failing test first**

Only if inspection finds a caller that passes parsed YAML into `importDcsMetadataValueFromYAML` with parent/key still available, add a test like this to the relevant test file:

```ts
import { importFromYAML } from "~/yaml/import"

it("imports quoted primitive numeric string as string", () => {
  const yaml = importFromYAML<Record<string, unknown>>('Значение: "2"')

  const result = importDcsMetadataValueFromYAML(
    mockContext,
    { type: "MetadataDcsMetadataValue", valueType: "Primitive" },
    yaml.Значение as never
  )

  expect(result).toEqual({ type: "string", value: "2" })
})
```

Expected before implementation: FAIL with decimal. If this test cannot fairly restore marker because the function lacks parent/key, do not add it; the correct fix belongs to the caller.

- [ ] **Step 4: Run DCS tests if modified**

Run only if Step 3 added a test or code:

```bash
pnpm --dir packages/core test metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts
```

Expected: PASS after any corresponding implementation.

- [ ] **Step 5: Commit only if DCS files changed**

If DCS files changed:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts
git commit -m "fix: :bug: сохранить quoted string в DCS MetadataValue"
```

If no DCS files changed, make no commit for this task.

## Task 6: Final verification and round-trip check

**Files:**
- No code changes expected.

- [ ] **Step 1: Run focused common object tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts metadata/commonObjects/choiceList/fromYAML.test.ts metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run broader metadata value tests**

Run:

```bash
pnpm --dir packages/core test metadata/commonObjects/metadataValue
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Commit any remaining verification-only updates**

If there are no file changes:

```bash
git status --short
```

Expected: no output.

If there are intentional remaining test/code changes from earlier tasks, commit the known files before round-trip:

```bash
git add packages/core/metadata/commonObjects/metadataValue/explicitYAMLString.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/choiceList/fromYAML.test.ts packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts
git commit -m "fix: :bug: сохранить quoted string во вложенных MetadataValue"
```

If `git add` reports that an optional file does not exist or was not modified, remove that path from the command and retry with only files that exist and are intentionally changed.

- [ ] **Step 5: Run round-trip-yaml after the implementation commit**

Run from repository root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected:

- `XML -> YAML`: `16022 успешно, 0 с ошибкой` for the `acc` catalog, or the current catalog count if fixtures changed independently.
- `YAML -> временный XML`: `16022 успешно, 0 с ошибкой`.
- The selected first diff is no longer the `ChoiceList` change from `xs:string` to `xs:decimal` in `Catalogs/Валюты/Forms/ПараметрыПрописиВалюты_en/Ext/Form.xml`.

If the same diff remains, stop and inspect whether `FormChoiceList` imports from parsed YAML actually receives `ExplicitYAMLString`.

- [ ] **Step 6: Final status**

Run:

```bash
git status --short
```

Expected for `nkdk`: no output. The external XML repo may contain round-trip diagnostic diffs; do not reset it unless the user asks.
