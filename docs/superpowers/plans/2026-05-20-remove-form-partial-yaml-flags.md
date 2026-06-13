# Remove Form Partial YAML Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make form YAML self-sufficient by removing the remaining `toPartialYAML: false` flags from form element rules.

**Architecture:** Keep the existing rule-based metadata orchestration. Add narrow regression tests around `AutoCommandBar.autofill=false` and a guard that no form element rule still uses `toPartialYAML: false`; then remove the flags and update YAML expectations. Do not add custom fromXML/toXML/fromYAML/toYAML handlers.

**Tech Stack:** TypeScript, Vitest, pnpm, existing `rules.ts` metadata orchestration.

---

## File Structure

Read before implementation:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/knowledge/metadata/yaml-contract.md`
- `.agents/knowledge/metadata/round-trip-cycle.md`
- `docs/superpowers/specs/2026-05-20-remove-form-partial-yaml-flags-design.md`

Modify:

- `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`  
  Adds the focused failing export test for `AutoCommandBar.autofill=false`.
- `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`  
  Adds the focused import test that proves `Автозаполнение: Ложь` restores `autofill=false` without source.
- `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`  
  Adds a repository guard against active `toPartialYAML: false` in form element rules.
- `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`  
  Removes `toPartialYAML: false` from `autofill`; adds `implicitValueYAML: true` so `Истина` stays implicit and `Ложь` is explicit.
- `packages/core/metadata/forms/elements/columnGroup/rules.ts`  
  Removes `toPartialYAML: false` from `group`.
- `packages/core/metadata/forms/elements/inputField/rules.ts`  
  Removes `toPartialYAML: false` from `dataPath`.
- `packages/core/metadata/forms/elements/checkBoxField/rules.ts`  
  Removes `toPartialYAML: false` from `dataPath`.
- `packages/core/metadata/forms/elements/labelField/rules.ts`  
  Removes `toPartialYAML: false` from `dataPath`.
- `packages/core/metadata/forms/elements/pictureField/rules.ts`  
  Removes `toPartialYAML: false` from `dataPath` and stale commented YAML exclusions nearby.
- `packages/core/metadata/forms/elements/usualGroup/rules.ts`  
  Removes `toPartialYAML: false` from `group` and `showTitle`; adds `implicitValueYAML: true` to `showTitle`.
- Fixture data files under `packages/core/metadata/forms/elements/*/__fixtures__/data.ts`  
  Update expected partial YAML objects where newly visible fields now appear.
- Fixture data files under `packages/core/metadata/forms/clientApplicationForm/__fixtures__/*.ts`  
  Update expected full form YAML if `Автозаполнение: Ложь` now appears in existing fixtures.

Do not modify XML fixtures.

## Task 1: Add Focused Regression Tests

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

- [ ] **Step 1: Add failing export test for `AutoCommandBar.autofill=false`**

Append this test inside `describe("exportClientApplicationFormToYAML", ...)` in `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`:

```ts
  it("exports disabled auto command bar autofill to YAML", () => {
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      commands: [],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: false,
        childItems: [],
      },
      childItems: [],
    }

    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, form)

    expect(yaml).toEqual({
      КоманднаяПанель: {
        Автозаполнение: "Ложь",
      },
    })
  })
```

- [ ] **Step 2: Add failing import test for `Автозаполнение: Ложь` without source**

Append this test inside `describe("importClientApplicationFormFromYAML", ...)` in `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`:

```ts
  it("imports disabled auto command bar autofill without source", () => {
    const data: ClientApplicationFormYAML = {
      КоманднаяПанель: {
        Автозаполнение: "Ложь",
      },
    }

    const result = importClientApplicationFormFromYAML(mockContext, data)

    expect(result.autoCommandBar).toEqual({
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [],
    })
  })
```

- [ ] **Step 3: Run focused form tests and verify the export test fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --no-isolate
```

Expected: `exports disabled auto command bar autofill to YAML` fails because `КоманднаяПанель` is omitted or lacks `Автозаполнение`.

## Task 2: Add a Guard Against New Form `toPartialYAML` Flags

**Files:**

- Modify: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add failing guard test**

Add these imports at the top of `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`:

```ts
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
```

Append this test at the bottom of the same file:

```ts
describe("form element rules", () => {
  it("do not hide fields from partial YAML", () => {
    const elementsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const ruleFiles = collectRuleFiles(elementsRoot)
    const offenders = ruleFiles.flatMap((file) => {
      const content = fs.readFileSync(file, "utf8")
      return content.includes("toPartialYAML: false") ? [path.relative(elementsRoot, file)] : []
    })

    expect(offenders).toEqual([])
  })
})

function collectRuleFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectRuleFiles(fullPath)
    return entry.name === "rules.ts" ? [fullPath] : []
  })
}
```

- [ ] **Step 2: Run guard test and verify it fails with the known files**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toYAML.test.ts --no-isolate
```

Expected: FAIL. The failure lists rule files that still contain `toPartialYAML: false`, including `autoCommandBar/rules.ts`, `inputField/rules.ts`, and `usualGroup/rules.ts`.

## Task 3: Remove `toPartialYAML: false` From Rules

**Files:**

- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/labelField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pictureField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`

- [ ] **Step 1: Update `AutoCommandBarRules.autofill`**

In `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`, replace:

```ts
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      toPartialYAML: false,
      required: true,
    },
```

with:

```ts
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      implicitValueYAML: true,
      required: true,
    },
```

- [ ] **Step 2: Update `ColumnGroupRules.group`**

In `packages/core/metadata/forms/elements/columnGroup/rules.ts`, replace:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      toPartialYAML: false,
      required: true,
      implicitValueYAML: "Horizontal",
    },
```

with:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      required: true,
      implicitValueYAML: "Horizontal",
    },
```

- [ ] **Step 3: Update field `dataPath` rules**

Remove only the `toPartialYAML: false` line from each `dataPath` property:

```ts
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "string",
    },
```

Apply that shape to:

- `packages/core/metadata/forms/elements/inputField/rules.ts`
- `packages/core/metadata/forms/elements/labelField/rules.ts`

For `packages/core/metadata/forms/elements/checkBoxField/rules.ts`, keep the boolean default type:

```ts
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "boolean",
    },
```

For `packages/core/metadata/forms/elements/pictureField/rules.ts`, keep the picture default type and remove stale commented exclusions nearby:

```ts
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "Picture",
    },
```

- [ ] **Step 4: Update `UsualGroupRules.group` and `showTitle`**

In `packages/core/metadata/forms/elements/usualGroup/rules.ts`, replace the `group` property with:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      defaultValue: "HorizontalIfPossible",
      required: true,
      implicitValueYAML: "HorizontalIfPossible",
    },
```

Replace the `showTitle` property with:

```ts
    showTitle: {
      yaml: "ОтображатьЗаголовок",
      type: "boolean",
      defaultValue: true,
      implicitValueYAML: true,
    },
```

- [ ] **Step 5: Run guard test and verify flag removal**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toYAML.test.ts --no-isolate
```

Expected: the guard no longer reports `toPartialYAML: false`. Other assertions may still fail because expected YAML fixtures have not been updated yet.

## Task 4: Update YAML Expectations

**Files:**

- Modify: `packages/core/metadata/forms/elements/autoCommandBar/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/labelField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/__fixtures__/data.ts`
- Modify only if tests require it: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify only if tests require it: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`

- [ ] **Step 1: Run YAML tests to collect exact fixture failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --no-isolate
```

Expected: FAIL with object diffs showing newly exported YAML keys.

- [ ] **Step 2: Update `AutoCommandBar` expected YAML**

In `packages/core/metadata/forms/elements/autoCommandBar/__fixtures__/data.ts`, replace:

```ts
export const fullAutoExportCommandBarYAML: AutoCommandBarYAML = {
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}
```

with:

```ts
export const fullAutoExportCommandBarYAML: AutoCommandBarYAML = {
  Автозаполнение: "Ложь",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}
```

- [ ] **Step 3: Update field `ПутьКДанным` expectations**

For each full non-table and table fixture whose model contains `dataPath`, add the expected YAML key:

```ts
ПутьКДанным: "Объект.ПолеВвода",
```

Use the actual `dataPath` value from the model object in the same fixture file. Apply this to:

- `fullInputFieldPartialYAML`
- `fullTableInputFieldPartialYAML`
- `fullCheckBoxFieldPartialYAML`
- `fullTableCheckBoxFieldPartialYAML`
- `fullLabelFieldPartialYAML`
- `fullTableLabelFieldPartialYAML`
- `fullPictureFieldPartialYAML`
- `fullTablePictureFieldPartialYAML`

If a failure shows a different exact path, use the path from the model, not a guessed value.

- [ ] **Step 4: Update group expectations**

In `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`, add `Группировка` or `ОтображатьЗаголовок` only where the test diff shows a non-default exported value. Do not add `ОтображатьЗаголовок: "Истина"` because `implicitValueYAML: true` should omit it.

In `packages/core/metadata/forms/elements/columnGroup/__fixtures__/data.ts`, add `Группировка` only where the test diff shows the model value is not the YAML default.

- [ ] **Step 5: Update form YAML expectations if needed**

If `metadata/forms/clientApplicationForm/toYAML.test.ts` fails after the focused tests pass, update only the expected YAML files named by the diff. For a form auto command bar with `autofill=false`, use:

```ts
КоманднаяПанель: {
  Автозаполнение: "Ложь",
  Элементы: {
    // existing items
  },
}
```

For `autofill=true`, do not add `Автозаполнение: "Истина"`; `implicitValueYAML: true` should keep it implicit.

- [ ] **Step 6: Run YAML tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Verify Round-trip and Commit

**Files:**

- No additional source files expected.

- [ ] **Step 1: Verify no active `toPartialYAML: false` remains in metadata**

Run:

```bash
rg -n "toPartialYAML:\\s*false" packages/core/metadata -g '*.ts'
```

Expected: no active rule matches. If only comments remain, remove the stale comments and run the command again.

- [ ] **Step 2: Run focused form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run YAML round-trip triage**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- import and sync both finish with `0 с ошибкой`;
- first diffs no longer include removal of `<Autofill>false</Autofill>` from `AutoCommandBar`;
- `ChoiceParameters` diffs may remain because they are a separate planned issue.

- [ ] **Step 4: Run full project tests before declaring the issue complete**

Run:

```bash
pnpm test
```

Expected: PASS. If this is too slow for the current checkpoint, report that it has not been run yet and do not claim the whole issue is complete.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git status --short
git add packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts packages/core/metadata/forms/elements/autoCommandBar/rules.ts packages/core/metadata/forms/elements/columnGroup/rules.ts packages/core/metadata/forms/elements/inputField/rules.ts packages/core/metadata/forms/elements/checkBoxField/rules.ts packages/core/metadata/forms/elements/labelField/rules.ts packages/core/metadata/forms/elements/pictureField/rules.ts packages/core/metadata/forms/elements/usualGroup/rules.ts packages/core/metadata/forms/elements/autoCommandBar/__fixtures__/data.ts packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts packages/core/metadata/forms/elements/checkBoxField/__fixtures__/data.ts packages/core/metadata/forms/elements/labelField/__fixtures__/data.ts packages/core/metadata/forms/elements/pictureField/__fixtures__/data.ts packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts packages/core/metadata/forms/elements/columnGroup/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts
git commit -m "fix: :bug: раскрыть поля partial YAML форм"
```

Expected: commit succeeds. If a listed optional fixture was not changed, remove it from `git add` and retry.

## Self-Review

- Spec coverage: the plan removes all active `toPartialYAML: false` flags from form element rules, preserves XML fixtures, avoids custom conversion handlers, and keeps `ChoiceParameters` out of scope.
- Placeholder scan: no unfinished placeholders or unspecified implementation steps remain.
- Type consistency: all referenced property names match current rules: `autofill`, `dataPath`, `group`, `showTitle`, `Автозаполнение`, `ПутьКДанным`, `Группировка`, `ОтображатьЗаголовок`.
