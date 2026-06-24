# Form CommonObjects Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure form XML import always registers shared `commonObjects` handlers so `Title` values become model `I8nText` before NKDK export.

**Architecture:** The fix belongs at the form entrypoint, not in `buttonGroup/toNKDK`. `clientApplicationForm/convertFromXML.ts` should explicitly import `~/metadata/commonObjects` for side-effect registration before using rule-driven XML import.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata rule registry, form XML/YAML/NKDK conversion.

---

### Task 1: Add Regression Test For Form Title Import

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/knowledge/metadata/sources-of-truth.md`
- Read: `.agents/knowledge/metadata/round-trip-cycle.md`

- [ ] **Step 1: Read required metadata guidance**

Run:

```bash
sed -n '1,200p' .agents/knowledge/metadata/INDEX.md
sed -n '1,160p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,180p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: The documents confirm that existing XML fixtures are the source of truth and must not be edited.

- [ ] **Step 2: Write the failing test**

In `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`, change the first import from Vitest:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
```

Add this test inside the existing `describe("import from XML string", callback)` block in `convertFromXML.test.ts`:

```ts
  it("registers commonObjects before reading form title from XML", async () => {
    vi.resetModules()

    const { clearElementRulesRegistry } = await import("~/metadata/forms")
    const { clearTypeRulesRegistry } = await import("~/metadata/orchestration/formElement/factory")

    clearElementRulesRegistry()
    clearTypeRulesRegistry()

    await import("~/metadata/systemEnumerations")
    await import("~/metadata/forms/commonObjects/index")
    await import("~/metadata/forms/elements")

    const { readFormFromXML } = await import("./convertFromXML")
    const { mockContextFromXML } = await import("~/tests/mockContext")

    const form = readFormFromXML({
      context: mockContextFromXML(),
      inputDir: "/Users/nikita/git/round-trip-source/acc/Catalogs/КонтактныеЛица/Forms",
      formName: "ФормаВыбораЛидов",
    })

    const buttonGroup = findElementByName(form.childItems, "ГруппаСтандартныеКоманды")

    expect(buttonGroup).toMatchObject({
      itemType: "ButtonGroup",
      title: { items: { ru: "Стандартные команды" } },
    })
  })
```

Add this helper at the bottom of the file:

```ts
const findElementByName = (items: Array<{ name: string; childItems?: unknown[] }>, name: string): unknown => {
  for (const item of items) {
    if (item.name === name) return item

    if (Array.isArray(item.childItems)) {
      const found = findElementByName(item.childItems as Array<{ name: string; childItems?: unknown[] }>, name)
      if (found !== undefined) return found
    }
  }

  return undefined
}
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected before implementation: the new test fails because `title` is still the raw XML object with `"v8:item"` instead of `{ items: { ru: "Стандартные команды" } }`.

- [ ] **Step 4: Commit the failing test**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
git commit -m "✅ test: зафиксировать импорт заголовка формы"
```

Expected: A commit containing only the regression test.

### Task 2: Register CommonObjects At Form XML Entry Point

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`

- [ ] **Step 1: Add the registration import**

At the top of `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`, add the side-effect import before other metadata conversion imports:

```ts
import "~/metadata/commonObjects"
```

The beginning of the file should become:

```ts
import fs from "fs"
import { join } from "path"
import "~/metadata/commonObjects"
import { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "~/metadata/context/types"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
```

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: the new test passes, and the existing tests in `convertFromXML.test.ts` remain green.

- [ ] **Step 3: Re-run the representative XML import**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import "./metadata/forms/commonObjects/index"; import "./metadata/forms/elements"; import { convertFormFromXML } from "./metadata/forms/clientApplicationForm/convertFromXML"; void (async()=>{ const context={ defaultLanguage:"ru", version:"2.20", exportToYAML:{toTyped:false}, fromXML:{forReference:false} } as any; await convertFormFromXML({ context, inputDir:"/Users/nikita/git/round-trip-source/acc/Catalogs/КонтактныеЛица/Forms", formName:"ФормаВыбораЛидов", outputDir:"/private/tmp/nkdk-rt-debug/forms" }); console.log("ok") })()'
```

Expected: the command no longer fails with `Cannot read properties of undefined (reading 'ru')`. If it reaches another independent `round-trip-yaml` error, record that error without widening this fix.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts
git commit -m "🐛 fix: регистрировать commonObjects при импорте форм"
```

Expected: A commit containing only the implementation import.

### Task 3: Full Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: generation succeeds. If generated files change, inspect them and include them only if they are real output of the command.

- [ ] **Step 2: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short --branch
```

Expected: the branch is clean after commits, or only expected generated files remain and have been intentionally handled.

- [ ] **Step 4: Summarize the next independent error**

If the representative import in Task 2 reaches a new error, capture:

```text
<error message>
<top 3 stack frames>
```

Do not fix that new error in this plan.
