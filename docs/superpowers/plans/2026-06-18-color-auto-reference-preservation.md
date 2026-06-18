# Color Auto Reference Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop importing XML `auto` as a YAML color while preserving existing `<BackColor>auto</BackColor>` from reference XML on export.

**Architecture:** Treat `auto` as an XML/reference-only value at the shared `Color` import boundary. The model stores no color for XML `auto`; existing `referenceMetadata` export logic restores the XML tag when the YAML/model omits the field and the reference had it.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, metadata orchestration rules, pnpm workspace.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/color/fromXML.ts`: add the single import rule that maps XML `auto` to `undefined`.
- Modify `packages/core/metadata/commonObjects/color/fromXML.test.ts`: prove XML `auto` is not represented in the model.
- Modify `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`: pin that YAML/schema still rejects `auto`.
- Create `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts`: prove form button export restores `BackColor: auto` only from reference and lets a real model color override it.
- Use existing `packages/core/metadata/forms/elements/button/rules.ts`: no rule changes expected; `backColor` is already a regular `Color`.
- Use existing `packages/core/metadata/orchestration/property/toXML.ts` and `packages/core/metadata/forms/elements/orchestration/toXML.ts`: no implementation changes expected; tests cover the current reference behavior.

## Prerequisites

- [ ] **Step 1: Confirm metadata instructions are loaded**

Read these files before changing `packages/core/metadata/**`:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,240p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: commands print the metadata source-of-truth, YAML, and round-trip rules. Do not edit XML fixtures.

## Task 1: Pin Color Import And Schema Behavior

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`

- [ ] **Step 1: Add failing import test**

Add this test after the existing `undefined input` test in `packages/core/metadata/commonObjects/color/fromXML.test.ts`:

```ts
  it("should return undefined for XML auto color", () => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, "auto")

    expect(result).toBeUndefined()
  })
```

- [ ] **Step 2: Add schema rejection test**

Add this test at the end of `describe("ColorJSONSchema", ...)` in `packages/core/metadata/commonObjects/color/toJSONSchema.test.ts`:

```ts
  it("rejects XML auto color", () => {
    expect(errorsFor("auto")).toEqual([": Expected union value"])
  })
```

- [ ] **Step 3: Run focused tests and verify the import test fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  metadata/commonObjects/color/fromXML.test.ts \
  metadata/commonObjects/color/toJSONSchema.test.ts
```

Expected: `fromXML.test.ts` fails because `importColorFromXML(..., "auto")` currently returns `{ type: "Absolute", value: "auto" }`. The schema test should already pass.

## Task 2: Drop XML Auto At The Color Import Boundary

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/fromXML.ts`

- [ ] **Step 1: Implement minimal import behavior**

Change the first guard in `packages/core/metadata/commonObjects/color/fromXML.ts` from:

```ts
  if (!xml) return undefined
```

to:

```ts
  if (!xml || xml === "auto") return undefined
```

- [ ] **Step 2: Run focused color tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  metadata/commonObjects/color/fromXML.test.ts \
  metadata/commonObjects/color/toJSONSchema.test.ts
```

Expected: both test files pass. Existing tests for raw refs, prefixed colors, and absolute colors remain green.

- [ ] **Step 3: Commit the color boundary change**

Stage and commit only these files:

```bash
git add \
  packages/core/metadata/commonObjects/color/fromXML.ts \
  packages/core/metadata/commonObjects/color/fromXML.test.ts \
  packages/core/metadata/commonObjects/color/toJSONSchema.test.ts
git commit -m "fix: :bug: не импортировать auto как цвет"
```

Expected: commit succeeds. If `.git` write access requires approval, request it for `git add`/`git commit`.

## Task 3: Prove Form Button Reference Preservation

**Files:**
- Create: `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts`

- [ ] **Step 1: Add button reference tests**

Create `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { mockContextToXML } from "~/tests/mockContext"
import { ButtonRules } from "./rules"
import type { Button } from "./types"

const baseButton = {
  itemType: "Button",
  name: "КнопкаСформировать",
  type: "UsualButton",
  defaultButton: true,
  skipOnInput: false,
  commandName: "Form.Command.Сформировать",
} satisfies Button

function exportButton(params: { button: Button; referenceButton?: Button }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.button,
    referenceMetadata: params.referenceButton,
    rule: ButtonRules,
  }) as Record<string, unknown>
}

describe("Button auto color preservation from reference XML", () => {
  it("restores BackColor auto when model omits backColor and reference has auto", () => {
    const result = exportButton({
      button: baseButton,
      referenceButton: {
        ...baseButton,
        backColor: {
          type: "Absolute",
          value: "auto",
        },
      },
    })

    expect(result.BackColor).toBe("auto")
  })

  it("does not invent BackColor auto without reference", () => {
    const result = exportButton({
      button: baseButton,
    })

    expect(result.BackColor).toBeUndefined()
  })

  it("exports model color instead of reference auto", () => {
    const result = exportButton({
      button: {
        ...baseButton,
        backColor: {
          type: "WebColor",
          value: "Red",
        },
      },
      referenceButton: {
        ...baseButton,
        backColor: {
          type: "Absolute",
          value: "auto",
        },
      },
    })

    expect(result.BackColor).toBe("web:Red")
  })
})
```

- [ ] **Step 2: Run button reference tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts
```

Expected: all three tests pass. This confirms no implementation is needed in form button rules or orchestration.

- [ ] **Step 3: Commit the reference preservation test**

Stage and commit only the new test:

```bash
git add packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts
git commit -m "test: :white_check_mark: проверить сохранение auto цвета"
```

Expected: commit succeeds. If `.git` write access requires approval, request it for `git add`/`git commit`.

## Task 4: Verify ERP Import And Validation

**Files:**
- External input: `/home/nikita/git/round-trip/erp`
- External output: `/home/nikita/git/temp-yaml`

- [ ] **Step 1: Re-import ERP to temp YAML**

Run the project import command used in this repository for XML-to-YAML import:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: import finishes without hanging and updates `/home/nikita/git/temp-yaml`. This writes outside the repository, so request approval if the sandbox blocks it.

- [ ] **Step 2: Confirm the specific YAML no longer contains auto**

Run:

```bash
rg -n "ЦветФона:\\s*auto" /home/nikita/git/temp-yaml/Отчет/ДвиженияНастраиваемойОтчетности/Формы/ФормаОтчета/Форма.yaml
```

Expected: no matches and exit code `1`. Inspect the nearby button if needed:

```bash
sed -n '24,36p' /home/nikita/git/temp-yaml/Отчет/ДвиженияНастраиваемойОтчетности/Формы/ФормаОтчета/Форма.yaml
```

Expected: `КнопкаСформировать` is present and has no `ЦветФона: auto` key.

- [ ] **Step 3: Validate the affected file**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts validate /home/nikita/git/temp-yaml \
  --file Отчет/ДвиженияНастраиваемойОтчетности/Формы/ФормаОтчета/Форма.yaml
```

Expected: validation reports no errors for this file. The previous `ЦветФона: auto` union error is gone.

- [ ] **Step 4: If full validation is stable, run it and group remaining errors**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts validate /home/nikita/git/temp-yaml
```

Expected: validation completes. If it hangs again, stop the command, record that full validation did not produce a final summary, and keep the focused file validation as the evidence for this fix.

## Task 5: Full Project Verification

**Files:**
- No code changes.

- [ ] **Step 1: Run all tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Check final git status**

Run:

```bash
git status --short
```

Expected: only intentional files are changed, or the tree is clean after commits.

- [ ] **Step 3: Final summary**

Report:

- commit hashes created for the implementation;
- focused test commands and `pnpm test` result;
- whether `/home/nikita/git/temp-yaml/.../Форма.yaml` no longer contains `ЦветФона: auto`;
- whether full validation completed or hung.

## Self-Review

- Spec coverage: XML `auto` becomes absent from model in Task 2; schema remains strict in Task 1; reference restoration, no-reference omission, and model override are covered in Task 3; ERP re-import and validation are covered in Task 4.
- Placeholder scan: no deferred work, generic instructions, or unnamed tests remain.
- Type consistency: the plan uses existing `Button`, `ButtonRules`, `Color` shapes, `exportPropertiesToXML`, and `mockContextToXML` signatures observed in the codebase.
