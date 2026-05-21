# Remove yamlPartialOthers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the obsolete `yamlPartialOthers` YAML feature while keeping `excludeIfEqualNameYAML` as the name-based multilingual shortening mechanism.

**Architecture:** `I8nText` remains the single owner of full language-map export and name-based exclusion. `FormattedI8nText` delegates language export to `I8nText` without pre-filtering languages. Form element rules no longer request partial language export.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, `round-trip-yaml` diagnostic skill.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`  
  Remove the `yamlPartialOthers` rule property.
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.ts`  
  Delete the partial-language branch and helper; keep `excludeIfEqualNameYAML`.
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`  
  Remove partial-language tests; add explicit coverage for `excludeIfEqualNameYAML` with `{ ru, en }`.
- Modify: `packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts`  
  Add explicit import coverage for `excludeIfEqualNameYAML` restoring the default language from the object name.
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/types.ts`  
  Remove the `yamlPartialOthers` rule property.
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts`  
  Delete pre-filtering and deprecated partial helper.
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`  
  Remove partial-helper tests and import.
- Modify: form element rules containing `yamlPartialOthers: true`:  
  `packages/core/metadata/forms/elements/labelDecoration/rules.ts`,  
  `packages/core/metadata/forms/elements/table/rules.ts`,  
  `packages/core/metadata/forms/elements/button/rules.ts`,  
  `packages/core/metadata/forms/elements/formGroup/rules.ts`,  
  `packages/core/metadata/forms/elements/pictureDecoration/rules.ts`,  
  `packages/core/metadata/forms/elements/formField/rules.ts`.
- Modify: fixtures/tests that still expect hidden default-language titles after the rules change, found by the test run or `rg yamlPartialOthers`.

---

### Task 1: Lock In `excludeIfEqualNameYAML` Multilingual Behavior

**Files:**
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts`

- [ ] **Step 1: Add export coverage for bilingual name-based shortening**

In `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`, add this test inside `describe("exportI8nTextToYAML", ...)`:

```ts
  describe("excludeIfEqualNameYAML", () => {
    it("keeps non-default languages when default language equals the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items: { ru: "Оценка отправлена", en: "Rating sent" } },
      })

      expect(result).toEqual({ en: "Rating sent" })
    })
  })
```

- [ ] **Step 2: Add import coverage for restoring the omitted default language**

In `packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts`, import `I8nTextPropertyRule` and add:

```ts
import { I8nTextPropertyRule } from "./types"
```

Then add this test inside `describe("importI8nTextFromYAML", ...)`:

```ts
  describe("excludeIfEqualNameYAML", () => {
    it("restores default language from the name and preserves non-default languages", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = importI8nTextFromYAML({
        context: mockContext,
        rule,
        name: "ОценкаОтправлена",
        value: { en: "Rating sent" },
      })

      expect(result).toEqual({
        items: {
          ru: "Оценка отправлена",
          en: "Rating sent",
        },
      })
    })
  })
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/i8nText/toYAML.test.ts packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts
```

Expected: PASS. These tests document existing desired behavior before deleting `yamlPartialOthers`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/i8nText/toYAML.test.ts packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts
git commit -m "test: :white_check_mark: закрепить excludeIfEqualNameYAML"
```

---

### Task 2: Remove `yamlPartialOthers` From `I8nText`

**Files:**
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`

- [ ] **Step 1: Remove the rule property from the type**

In `packages/core/metadata/commonObjects/i8nText/types.ts`, change:

```ts
export interface I8nTextPropertyRule extends Omit<BasePropertyRule, "defaultValue"> {
  type: "I8nText"
  yamlPartialOthers?: true
  skipEmptyToXML?: true
```

to:

```ts
export interface I8nTextPropertyRule extends Omit<BasePropertyRule, "defaultValue"> {
  type: "I8nText"
  skipEmptyToXML?: true
```

- [ ] **Step 2: Remove the partial export branch**

In `packages/core/metadata/commonObjects/i8nText/toYAML.ts`, replace the top of `exportI8nTextToYAML`:

```ts
  const i8nRule = rule as I8nTextPropertyRule
  const toTyped = context.exportToYAML?.toTyped
  const yamlPartialOthers = toTyped ? undefined : i8nRule.yamlPartialOthers

  const textClean = getTextWithoutName({ context, rule: i8nRule, text, name })

  if (yamlPartialOthers) {
    return exportI8nTextOtherToYAML(context, textClean)
  }

  return exportFullI8nTextToYAML(context, textClean)
```

with:

```ts
  const i8nRule = rule as I8nTextPropertyRule
  const textClean = getTextWithoutName({ context, rule: i8nRule, text, name })

  return exportFullI8nTextToYAML(context, textClean)
```

- [ ] **Step 3: Delete the unused helper**

Remove this whole function from `packages/core/metadata/commonObjects/i8nText/toYAML.ts`:

```ts
const exportI8nTextOtherToYAML = (
  context: ConfigurationContext,
  text: I8nText | undefined
): I8nTextYAML | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  return exportFullI8nTextToYAML(context, { items: filtredItems })
}
```

- [ ] **Step 4: Remove obsolete partial tests**

In `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`, delete:

```ts
  describe("exportI8nTextOtherToYAML", () => {
    it.each(i8nTextFixtures)("should export other: $name", (fixture) => {
      const rule: I8nTextPropertyRule = { type: "I8nText", yamlPartialOthers: true }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.otherLanguagesYAML)
    })
  })
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/i8nText/toYAML.test.ts packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/i8nText/types.ts packages/core/metadata/commonObjects/i8nText/toYAML.ts packages/core/metadata/commonObjects/i8nText/toYAML.test.ts
git commit -m "fix: :bug: удалить yamlPartialOthers из I8nText"
```

---

### Task 3: Remove `yamlPartialOthers` From `FormattedI8nText`

**Files:**
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/types.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`

- [ ] **Step 1: Remove the rule property from the type**

In `packages/core/metadata/commonObjects/formattedI8nText/types.ts`, change:

```ts
export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}
```

to:

```ts
export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  xmlWithDefaultLanguage?: true
}
```

- [ ] **Step 2: Stop filtering the default language before export**

In `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts`, replace:

```ts
  const formattedRule = rule as FormattedI8nTextPropertyRule

  const filtredText: FormattedI8nText = formattedRule.yamlPartialOthers
    ? {
        formatted: text.formatted,
        items: Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== context.defaultLanguage)),
      }
    : text

  return exportToYAML(context, formattedRule, filtredText) as {
```

with:

```ts
  const formattedRule = rule as FormattedI8nTextPropertyRule

  return exportToYAML(context, formattedRule, text) as {
```

- [ ] **Step 3: Delete deprecated partial helper**

In `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts`, delete the exported function:

```ts
export const exportFormattedI8nTextOtherToYAML = <Key extends string, FormattedKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule,
  text: FormattedI8nText | undefined,
  key: Key,
  formattedKey: FormattedKey
): { [K in Key | FormattedKey]?: FormattedI8nTextYAML } => {
  if (!text) return {}

  const defaultLanguage = context.defaultLanguage

  const filtredItems = Object.fromEntries(Object.entries(text.items).filter(([lang]) => lang !== defaultLanguage))

  const filtrdText: FormattedI8nText = { formatted: text.formatted, items: filtredItems }

  return exportFormattedI8nTextToYAMLDeprecated(context, { type: "I8nText" }, filtrdText, key, formattedKey)
}
```

- [ ] **Step 4: Remove obsolete test imports and partial-helper tests**

In `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`, change:

```ts
import {
  exportFormattedI8nTextDefaultToYAML,
  exportFormattedI8nTextOtherToYAML,
  exportFormattedI8nTextToYAML,
} from "./toYAML"
```

to:

```ts
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
```

Then delete the whole `describe("exportFormattedI8nTextOtherToYAML", ...)` block.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/formattedI8nText/types.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts
git commit -m "fix: :bug: удалить yamlPartialOthers из FormattedI8nText"
```

---

### Task 4: Remove `yamlPartialOthers` From Form Rules And Fixtures

**Files:**
- Modify: `packages/core/metadata/forms/elements/labelDecoration/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`
- Modify: `packages/core/metadata/forms/elements/formGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pictureDecoration/rules.ts`
- Modify: `packages/core/metadata/forms/elements/formField/rules.ts`
- Modify as test output requires: form element fixture files under `packages/core/metadata/forms/elements/**/__fixtures__/data.ts`

- [ ] **Step 1: Remove active rule flags**

Delete each `yamlPartialOthers: true` property from the six rules listed above. For example, in `packages/core/metadata/forms/elements/labelDecoration/rules.ts`, change:

```ts
    title: {
      yaml: "Заголовок",
      type: "FormattedI8nText",
      yamlFormatted: "ФорматированныйЗаголовок",
      yamlPartialOthers: true,
    },
```

to:

```ts
    title: {
      yaml: "Заголовок",
      type: "FormattedI8nText",
      yamlFormatted: "ФорматированныйЗаголовок",
    },
```

Apply the same removal in the remaining files.

- [ ] **Step 2: Remove obsolete comments that describe hidden titles**

Search:

```bash
rg -n "yamlPartialOthers|Заголовок absent" packages/core/metadata/forms packages/core/metadata/commonObjects
```

Delete or rewrite comments that say title is absent because of `yamlPartialOthers`. Do not change XML fixtures.

- [ ] **Step 3: Run form YAML tests and collect expected fixture updates**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/forms/elements packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected before fixture updates: FAIL only in expectations that still assume default-language titles are hidden.

- [ ] **Step 4: Update YAML fixtures to include default-language titles where the model contains them**

For each failed YAML fixture, add the now-exported `Заголовок` value. Use the model fixture as the source. Example shape for multilingual formatted title:

```ts
Заголовок: { ru: "Вам нравится приложение?", en: "Do you like the app?" }
```

For a Russian-only title, keep compact YAML:

```ts
Заголовок: "Заголовок элемента"
```

Do not add synthetic languages that are absent from the model fixture.

- [ ] **Step 5: Re-run form YAML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/forms/elements packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Confirm no code references remain**

Run:

```bash
rg -n "yamlPartialOthers|exportI8nTextOtherToYAML|exportFormattedI8nTextOtherToYAML" packages/core
```

Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/forms/elements packages/core/metadata/commonObjects
git commit -m "fix: :bug: удалить yamlPartialOthers из правил форм"
```

---

### Task 5: Verify YAML Round-Trip Diff

**Files:**
- No source edits expected.
- Diagnostic output touches `/Users/nikita/git/round-trip-source`; leave it dirty after triage, per `round-trip-yaml` skill.

- [ ] **Step 1: Run all focused metadata tests touched by this plan**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/i8nText/toYAML.test.ts packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts packages/core/metadata/forms/elements packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run YAML round-trip triage for the current batch**

Run from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-triage`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: the `CommonForms/ОценитьПриложение/Ext/Form.xml` diff no longer removes `ru` from `LabelDecoration/Title` because `yamlPartialOthers` is gone. If the attribute title still shows only `en` in YAML because `ru` equals the attribute name, XML reconstruction should include the restored `ru` item through `excludeIfEqualNameYAML`.

- [ ] **Step 3: Commit verification-only fixture/test adjustments if any were needed**

If Step 2 reveals a missing test expectation but no behavior change, commit only the test adjustment:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: уточнить YAML заголовки форм"
```

If Step 2 reveals new behavior code changes, go back to the relevant earlier task and add a focused failing test before changing code.

- [ ] **Step 4: Leave full project verification for branch completion**

Do not run full `pnpm test` as part of this diagnostic plan unless closing the overall issue/branch. Before closing the branch, run:

```bash
pnpm test
```

Expected: all package tests pass.

---

## Self-Review

- Spec coverage: the plan removes `yamlPartialOthers` from types, exporters, rules, and tests; it preserves and tests bilingual `excludeIfEqualNameYAML`.
- Placeholder scan: no placeholder steps remain; each command and expected result is explicit.
- Type consistency: property names match the current code: `yamlPartialOthers`, `excludeIfEqualNameYAML`, `exportI8nTextToYAML`, `exportFormattedI8nTextToYAML`.
