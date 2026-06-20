# DCS Local String Type Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve DCS `xs:string` values across XML -> YAML -> XML when they share YAML scalar syntax with `v8:LocalStringType`.

**Architecture:** Reuse the existing typed DCS value path instead of adding a new preservation flag. `FilterItemComparison.presentation` should use the same `FilterItemPresentationValue` type already used by `FilterItemGroup`, and the generic YAML property import boundary should restore double-quoted scalar markers for direct `SettingsParameterValue` properties.

**Tech Stack:** TypeScript, Vitest, nkdk metadata orchestration, YAML explicit-string markers, DCS metadata value import/export rules.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`
  - Adds a focused XML import regression for `dcsset:presentation xsi:type="xs:string"` on `FilterItemComparison`.

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts`
  - Changes only `FilterItemComparisonRules.properties.presentation.type` from `DcsLocalStringType` to `FilterItemPresentationValue`.

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
  - Adds a focused YAML import regression that parses YAML through the real text importer so `"6678"` carries the double-quoted scalar marker.

- Modify `packages/core/metadata/orchestration/property/fromYAML.ts`
  - Extends the existing `asExplicitYAMLStringIfMarked` boundary from direct `MetadataValue` properties to direct `SettingsParameterValue` properties.

No XML fixtures should be changed.

## Task 1: Preserve xs:string Presentation In FilterItemComparison

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts`

- [ ] **Step 1: Confirm metadata guidance**

Read the required metadata docs before touching `packages/core/metadata/**`:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,220p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: the docs confirm that XML fixtures are source of truth, YAML round-trip fixes must be covered by tests, and existing rules/patterns should be preferred.

- [ ] **Step 2: Write the failing XML import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`, add this test immediately after `imports FilterItemComparison from XML`:

```ts
  it("preserves xs:string presentation as typed string", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:item",
      xmlString: `<dcsset:item
        xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings"
        xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:type="dcsset:FilterItemComparison">
        <dcsset:left xsi:type="dcscor:Field">Ссылка.Реквизит1</dcsset:left>
        <dcsset:comparisonType>Equal</dcsset:comparisonType>
        <dcsset:right xsi:type="dcscor:Field">ПараметрыДанных.Параметр1</dcsset:right>
        <dcsset:presentation xsi:type="xs:string">Английское</dcsset:presentation>
      </dcsset:item>`,
    })

    expect(result).toEqual([
      {
        itemType: "FilterItemComparison",
        leftValue: { type: "Field", value: "Ссылка.Реквизит1" },
        rightValue: { type: "Field", value: "ПараметрыДанных.Параметр1" },
        presentation: { type: "string", value: "Английское" },
      },
    ])
  })
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts --no-isolate
```

Expected: one test fails. The failure should show that current `presentation` is received as:

```ts
{
  items: {
    ru: "Английское",
  },
}
```

If the test passes, stop and inspect whether `FilterItemComparisonRules.presentation` has already been changed.

- [ ] **Step 4: Implement the minimal rule change**

In `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts`, change only this property:

```ts
    presentation: {
      type: "FilterItemPresentationValue",
      xml: "dcsset:presentation",
      yaml: "Представление",
      order: 5,
    },
```

Do not change `userSettingPresentation`; it remains `DcsLocalStringType`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts --no-isolate
```

Expected: all tests in `filterItem/fromXML.test.ts` pass.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts
git commit -m "fix: :bug: сохранить тип представления отбора DCS"
```

Expected: commit succeeds with only these two files.

## Task 2: Preserve Double-Quoted SettingsParameterValue Scalars

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`

- [ ] **Step 1: Write the failing YAML import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`, add imports:

```ts
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
```

Inside `describe("import Appearance from YAML", () => {`, add the helper before the first test:

```ts
  const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))
```

Add this test immediately after `imports explicit field value for text appearance`:

```ts
  it("imports double-quoted numeric-looking text appearance as string value", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: parseViaYamlText({
        Текст: "6678",
      }),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          type: "string",
          value: "6678",
        },
      },
    })
  })
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts --no-isolate
```

Expected: one test fails. The failure should show that current `Текст.value` is received as:

```ts
{
  items: {
    ru: "6678",
  },
}
```

If the test passes, stop and inspect whether `packages/core/metadata/orchestration/property/fromYAML.ts` already restores markers for `SettingsParameterValue`.

- [ ] **Step 3: Implement the generic import boundary change**

In `packages/core/metadata/orchestration/property/fromYAML.ts`, replace:

```ts
    const valueForImport =
      yamlKey && curRule.type === "MetadataValue"
        ? asExplicitYAMLStringIfMarked(yaml, yamlKey as string, yamlValue)
        : yamlValue
```

with:

```ts
    const shouldRestoreExplicitYAMLString =
      yamlKey && (curRule.type === "MetadataValue" || curRule.type === "SettingsParameterValue")
    const valueForImport = shouldRestoreExplicitYAMLString
      ? asExplicitYAMLStringIfMarked(yaml, yamlKey as string, yamlValue)
      : yamlValue
```

Do not change `SettingsParameterValueCollection`; it already restores markers for dynamic parameter keys in its own importer.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts --no-isolate
```

Expected: all tests in `appearanceFields/fromYAML.test.ts` pass.

- [ ] **Step 5: Run both focused regression suites**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts --no-isolate
```

Expected: both test files pass.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts packages/core/metadata/orchestration/property/fromYAML.ts
git commit -m "fix: :bug: сохранить строки параметров DCS из кавычек"
```

Expected: commit succeeds with only these two files.

## Task 3: Verify The Original Round-Trip Diff Is Gone

**Files:**
- No source edits.

- [ ] **Step 1: Run the fast round-trip check**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts round-trip-yaml-fast /home/nikita/git/round-trip/all
```

Expected:

```text
=== ROUND_TRIP_YAML_FAST ===
checked: 334
diffs: 0
errors: 0
=== DIFF_COUNT ===
0
```

If the command fails with `listen EPERM ... /tmp/tsx-1000/...pipe`, rerun the same command with escalated permissions. This is a local sandbox limitation of `tsx`, not a project failure.

- [ ] **Step 2: If diffs remain, inspect only the reported diff**

Run this only if Step 1 reports `diffs` greater than zero:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts round-trip-yaml-fast /home/nikita/git/round-trip/all
```

Expected: use the printed `=== DIFF ===` section to confirm whether the remaining diff is still about `xs:string -> v8:LocalStringType`.

If the remaining diff is a different metadata item or different XML construct, stop and report it instead of expanding this fix.

- [ ] **Step 3: Commit no files**

Run:

```bash
git status --short --branch
```

Expected: no unstaged or staged files. If verification produced no file changes, do not create a commit for this task.

## Task 4: Run Full Project Verification

**Files:**
- No source edits.

- [ ] **Step 1: Run project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all recursive package tests pass, including `packages/core` and `packages/cli`.

- [ ] **Step 2: Run whitespace diff check**

Run:

```bash
git diff --check
```

Expected: no output and exit code `0`.

- [ ] **Step 3: Confirm final git status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree, with the branch ahead by the new implementation commits.

## Self-Review

- Spec coverage: Task 1 covers `FilterItemComparison.presentation`; Task 2 covers `AppearanceFields.Текст`; Task 3 covers the original `round-trip-yaml-fast` acceptance criterion; Task 4 covers required full verification.
- Placeholder scan: this plan contains exact files, exact code snippets, exact commands, and expected outcomes.
- Type consistency: `FilterItemPresentationValue`, `SettingsParameterValue`, `MetadataValue`, `asExplicitYAMLStringIfMarked`, `exportToYAML`, and `importFromYAML` match existing project symbols.
