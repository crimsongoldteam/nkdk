# Color Auto Reference Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve XML-only `auto` color tags during XML -> model -> YAML -> model -> XML round-trip without exposing `auto` in YAML or JSON Schema.

**Architecture:** Keep `Color.fromXML("auto") -> undefined`. Add a shared XML export fallback in `packages/core/metadata/orchestration/property/toXML.ts` that restores raw `"auto"` only when the current model omits a `Color` property and the reference model proves that the XML tag existed. Form element tests cover the real imported reference shape for `Button` and the current failing `Popup.backColor` path.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, existing round-trip-yaml skill.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/toXML.ts`
  - Add a small helper that detects "reference XML had a color tag, but imported reference value is `undefined`".
  - Use it inside `exportPropertiesToXML` before calling the registered `Color` exporter.
  - Keep the helper generic: no imports from `forms/*` or applied-object modules.
- Modify `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts`
  - Replace hand-built `{ type: "Absolute", value: "auto" }` reference state with a reference imported through `importPropertiesFromXML(... forReference: true ...)`.
- Create `packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts`
  - Reproduce the current `Popup.backColor` loss using the same real reference path.
- Run targeted tests, then `round-trip-yaml` triage on `/Users/nikita/git/round-trip/acc`, then `pnpm test`.

## Task 1: Reproduce Real Reference Auto Color For Button

**Files:**
- Modify: `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts`

- [ ] **Step 1: Replace hand-built auto reference with imported reference helper**

In `packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts`, update imports:

```ts
import { describe, expect, it } from "vitest"
import { importPropertiesFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { ButtonRules } from "./rules"
import type { Button } from "./types"
```

Replace the existing `exportButton` helper and add `importReferenceButton` below `baseButton`:

```ts
function importReferenceButton(xml: Record<string, unknown>): Button {
  const imported = importPropertiesFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: ButtonRules,
    xml,
  })

  return {
    itemType: "Button",
    ...(imported === undefined ? {} : imported),
  } as Button
}

function exportButton(params: { button: Button; referenceButton?: Button }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.button,
    referenceMetadata: params.referenceButton,
    rule: ButtonRules,
  }) as Record<string, unknown>
}
```

Replace the first and third tests so their `referenceButton` comes from XML import:

```ts
  it("restores BackColor auto when model omits backColor and reference XML has auto", () => {
    const result = exportButton({
      button: baseButton,
      referenceButton: importReferenceButton({
        _name: "КнопкаСформировать",
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("auto")
  })
```

```ts
  it("exports model color instead of reference auto", () => {
    const result = exportButton({
      button: {
        ...baseButton,
        backColor: {
          type: "WebColor",
          value: "Red",
        },
      },
      referenceButton: importReferenceButton({
        _name: "КнопкаСформировать",
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("web:Red")
  })
```

- [ ] **Step 2: Run the button test and confirm the real-reference regression**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts
```

Expected: the first test fails because `result.BackColor` is `undefined`, while the "does not invent" and "model color wins" tests pass.

## Task 2: Add Popup Regression Coverage

**Files:**
- Create: `packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts`

- [ ] **Step 1: Create the failing Popup test**

Create `packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importPropertiesFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { PopupRules } from "./rules"
import type { Popup } from "./types"

const basePopup = {
  itemType: "Popup",
  name: "ВидВладельцаЭЦП",
  width: 22,
  childItems: [],
} satisfies Popup

function importReferencePopup(xml: Record<string, unknown>): Popup {
  const imported = importPropertiesFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: PopupRules,
    xml,
  })

  return {
    itemType: "Popup",
    ...(imported === undefined ? {} : imported),
  } as Popup
}

function exportPopup(params: { popup: Popup; referencePopup?: Popup }): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.popup,
    referenceMetadata: params.referencePopup,
    rule: PopupRules,
  }) as Record<string, unknown>
}

describe("Popup auto color preservation from reference XML", () => {
  it("restores BackColor auto when model omits backColor and reference XML has auto", () => {
    const result = exportPopup({
      popup: basePopup,
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("auto")
  })

  it("does not invent BackColor auto without reference XML key", () => {
    const result = exportPopup({
      popup: basePopup,
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
      }),
    })

    expect(result.BackColor).toBeUndefined()
  })

  it("exports model color instead of reference auto", () => {
    const result = exportPopup({
      popup: {
        ...basePopup,
        backColor: {
          type: "WebColor",
          value: "Red",
        },
      },
      referencePopup: importReferencePopup({
        _name: "ВидВладельцаЭЦП",
        Width: 22,
        BackColor: "auto",
      }),
    })

    expect(result.BackColor).toBe("web:Red")
  })
})
```

- [ ] **Step 2: Run the Popup test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts
```

Expected: the first test fails because `result.BackColor` is `undefined`; the second and third tests pass.

## Task 3: Implement Shared Color Auto Fallback

**Files:**
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`

- [ ] **Step 1: Add a generic helper in `toXML.ts`**

In `packages/core/metadata/orchestration/property/toXML.ts`, add this helper near the other local helper functions, before `isDefaultValue`:

```ts
const shouldRestoreReferenceAutoColor = (params: {
  rule: PropertyRule
  metadataHasOwnKey: boolean
  referenceMetadata: unknown
  referenceValue: unknown
  propertyKey: string
}): boolean => {
  const { rule, metadataHasOwnKey, referenceMetadata, referenceValue, propertyKey } = params

  if (rule.type !== "Color") return false
  if (metadataHasOwnKey) return false
  if (referenceValue !== undefined) return false
  if (referenceMetadata === undefined || referenceMetadata === null || typeof referenceMetadata !== "object") return false

  const sourceKeys = (referenceMetadata as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
  if (sourceKeys === undefined || sourceKeys === null || typeof sourceKeys !== "object") return false

  return Object.prototype.hasOwnProperty.call(sourceKeys, propertyKey)
}
```

- [ ] **Step 2: Use the helper inside `exportPropertiesToXML`**

Replace this block:

```ts
      const exportedValue = exportPropertyToXML({
        context: currentContext,
        rule: ruleProp,
        value: valueToExport,
        referenceMetadata: referenceValue,
        metadataItem: metadata,
      })
```

with:

```ts
      const exportedValue = shouldRestoreReferenceAutoColor({
        rule: ruleProp,
        metadataHasOwnKey,
        referenceMetadata,
        referenceValue,
        propertyKey: key,
      })
        ? "auto"
        : exportPropertyToXML({
            context: currentContext,
            rule: ruleProp,
            value: valueToExport,
            referenceMetadata: referenceValue,
            metadataItem: metadata,
          })
```

This keeps current explicit model values dominant because `metadataHasOwnKey === true` disables the fallback.

- [ ] **Step 3: Run the focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts
```

Expected: all tests pass.

## Task 4: Guard Existing Color Contracts

**Files:**
- No code changes expected.

- [ ] **Step 1: Run existing color contract tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/color/fromXML.test.ts packages/core/metadata/commonObjects/color/toJSONSchema.test.ts
```

Expected: all tests pass. This confirms `Color.fromXML("auto")` still returns `undefined` and JSON Schema still rejects YAML value `"auto"`.

- [ ] **Step 2: Run orchestration helper tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/property/helpers.test.ts
```

Expected: all tests pass. This confirms `preserveFromReferenceXML` behavior was not broadened.

## Task 5: Verify Round-Trip Diff

**Files:**
- No code changes expected.

- [ ] **Step 1: Run YAML round-trip triage on acc**

Run from `/Users/nikita/git/nkdk/.worktrees/codex-form-choice-list-fixed-array-yaml`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/acc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- The command reports the CLI path inside `.worktrees/codex-form-choice-list-fixed-array-yaml`, not the main checkout.
- The diff for `DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml` no longer removes:

```xml
<BackColor>auto</BackColor>
```

- Remaining diffs, if any, are the unrelated known diffs such as `ExtendedTooltip <Type>Label</Type>` and `v8:LocalStringType` / `xs:string`.

## Task 6: Full Verification And Commit

**Files:**
- Modified files from Tasks 1-3.

- [ ] **Step 1: Run full project tests**

Run from `/Users/nikita/git/nkdk/.worktrees/codex-form-choice-list-fixed-array-yaml`:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Inspect changed files**

Run:

```bash
git status --short
git diff -- packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts
```

Expected:

- Only the planned files changed, plus this plan file if it has not already been committed.
- No XML fixtures changed.
- No `rules.ts` changes were made for `backColor`.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/forms/elements/button/preserveAutoColorFromReferenceXML.test.ts packages/core/metadata/forms/elements/popup/preserveAutoColorFromReferenceXML.test.ts
git commit -m "fix: :bug: восстанавливать auto цвета из reference"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: Task 3 implements the shared fallback; Tasks 1 and 2 cover real imported reference state and `Popup.backColor`; Task 4 guards YAML/Schema constraints; Task 5 verifies the `acc` round-trip diff.
- Placeholder scan: no TBD/TODO/placeholders remain.
- Type consistency: all test helpers use existing `Button`, `Popup`, `ButtonRules`, `PopupRules`, `importPropertiesFromXML`, `exportPropertiesToXML`, `mockContextFromXML`, and `mockContextToXML`.
