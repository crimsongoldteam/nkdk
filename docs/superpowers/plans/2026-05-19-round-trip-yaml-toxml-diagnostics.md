# Round Trip YAML toXML Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace opaque `Cannot read properties of undefined (reading 'toXML')` failures in `round-trip-yaml` with explicit errors that name the missing `toXML` handler type and nearby rule context.

**Architecture:** Keep the fix at the two narrow registry lookups that can currently return `undefined`: `DcsMetadataTypedValueRegistry[modelValue.type]` and `primitiveValueHandlers[value.type]`. Do not change XML fixtures, YAML format, object synchronization, or add new metadata conversion rules.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers, `round-trip-yaml` skill script.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
  Adds a focused regression test for an unknown runtime DCS typed value.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`
  Adds a guard before calling the DCS registry handler.
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`
  Adds a focused regression test for a missing primitive `MetadataValue` handler.
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`
  Adds a guard before calling the primitive value handler.

## Preconditions

- Work from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-errors`.
- Keep `/Users/nikita/git/round-trip-source/acc` clean before and after `round-trip-yaml`.
- Metadata docs were already read for this work; if starting in a fresh session, read `.agents/knowledge/metadata/INDEX.md` and the documents it points to before editing `packages/core/metadata/**`.

### Task 1: Add DCS Missing Handler Regression Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`

- [ ] **Step 1: Add the failing test**

Add this test inside `describe("export DcsMetadataTypedValue to XML", () => { ... })`, near the existing negative tests:

```ts
  it("reports missing toXML handler for unknown runtime typed value", () => {
    expect(() =>
      testExportPropertyToXML({
        rule,
        value: { type: "UnknownDcsTypedValue", value: "x" },
        xmlRootTag: "value",
      })
    ).toThrow(
      "DcsMetadataTypedValue: отсутствует toXML-обработчик для типа UnknownDcsTypedValue (rule.type: DcsMetadataTypedValue)"
    )
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: FAIL. The failure should still be the opaque `Cannot read properties of undefined (reading 'toXML')`, proving the test captures the current bug.

### Task 2: Guard DCS Registry Lookup

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`

- [ ] **Step 1: Replace the direct registry call**

In `exportSingle`, replace:

```ts
  const modelValue = value as DcsMetadataTypedValue
  return DcsMetadataTypedValueRegistry[modelValue.type].toXML({ context, rule, item: modelValue })
```

with:

```ts
  const modelValue = value as DcsMetadataTypedValue
  const handler = DcsMetadataTypedValueRegistry[modelValue.type]
  if (handler === undefined) {
    throw new Error(
      `DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ${modelValue.type} (rule.type: ${rule.type})`
    )
  }
  return handler.toXML({ context, rule, item: modelValue })
```

- [ ] **Step 2: Run the DCS test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: PASS for all tests in `toXML.test.ts`.

- [ ] **Step 3: Commit the DCS diagnostic guard**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts
git commit -m "test: :white_check_mark: диагностировать DCS toXML-обработчик"
```

### Task 3: Add MetadataValue Missing Handler Regression Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`

- [ ] **Step 1: Update imports**

Replace the current imports at the top:

```ts
import { MetadataCommonAttributeRules } from "~/metadata/appliedObjects/metadataCommonAttribute/rules"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
```

with:

```ts
import { MetadataCommonAttributeRules } from "~/metadata/appliedObjects/metadataCommonAttribute/rules"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { MetadataPrimitiveValueHandler, primitiveValueHandlers } from "~/metadata/commonObjects/metadataValue/handlers"
import { MetadataPrimitiveValueType } from "~/metadata/commonObjects/metadataValue/types"
```

- [ ] **Step 2: Add the failing test**

Add this test inside `describe("exportMetadataValueToXML", () => { ... })`, near the existing negative validation tests:

```ts
  it("reports missing primitive toXML handler", () => {
    const handlers = primitiveValueHandlers as Partial<Record<MetadataPrimitiveValueType, MetadataPrimitiveValueHandler>>
    const originalHandler = handlers.DataCompositionComparisonType
    delete handlers.DataCompositionComparisonType

    try {
      expect(() =>
        exportMetadataValueToXML({
          context: mockContext,
          rule: { type: "MetadataValue" },
          value: { type: "DataCompositionComparisonType", value: "Equal" } as any,
        })
      ).toThrow(
        "MetadataValue: отсутствует toXML-обработчик для типа DataCompositionComparisonType (rule.type: MetadataValue)"
      )
    } finally {
      handlers.DataCompositionComparisonType = originalHandler
    }
  })
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/toXML.test.ts
```

Expected: FAIL. The failure should still be `Cannot read properties of undefined (reading 'toXML')`.

### Task 4: Guard MetadataValue Primitive Handler Lookup

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`

- [ ] **Step 1: Replace the direct primitive handler call**

In `exportMetadataValueToXML`, replace:

```ts
  const handler = primitiveValueHandlers[value.type as MetadataPrimitiveValueType]
  return handler.toXML(value)
```

with:

```ts
  const handler = primitiveValueHandlers[value.type as MetadataPrimitiveValueType]
  if (handler === undefined) {
    throw new Error(`MetadataValue: отсутствует toXML-обработчик для типа ${value.type} (rule.type: ${rule.type})`)
  }
  return handler.toXML(value)
```

- [ ] **Step 2: Run the MetadataValue test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/metadataValue/toXML.test.ts
```

Expected: PASS for all tests in `toXML.test.ts`.

- [ ] **Step 3: Commit the MetadataValue diagnostic guard**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.ts
git commit -m "test: :white_check_mark: диагностировать MetadataValue toXML-обработчик"
```

### Task 5: Run Round Trip YAML and Capture the Next Concrete Error

**Files:**
- No code changes expected.
- External XML worktree to restore after the run if needed: `/Users/nikita/git/round-trip-source/acc`

- [ ] **Step 1: Verify local worktree status**

Run:

```bash
git status --short
```

Expected: clean output.

- [ ] **Step 2: Verify source XML status**

Run from `/Users/nikita/git/round-trip-source`:

```bash
git status --short acc
```

Expected: clean output.

- [ ] **Step 3: Run round-trip-yaml**

Run from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-errors`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: `XML -> YAML` remains successful. `YAML -> XML` should still fail, but at least one of the previous `Cannot read properties of undefined (reading 'toXML')` messages should now include the missing handler type and `rule.type`.

- [ ] **Step 4: Restore external XML worktree if the run changed it**

Run from `/Users/nikita/git/round-trip-source`:

```bash
git restore acc
git status --short acc
```

Expected: clean output.

- [ ] **Step 5: Report the new concrete error**

In the final response, include the exact new error line from `round-trip-yaml`, for example:

```text
✖ MetadataCatalog "...": DcsMetadataTypedValue: отсутствует toXML-обработчик для типа <type> (rule.type: DcsMetadataTypedValue)
```

Do not fix that newly revealed missing handler in this plan.

## Self-Review

- Spec coverage: Task 1 and Task 2 cover `DcsMetadataTypedValueRegistry[modelValue.type].toXML`; Task 3 and Task 4 cover `primitiveValueHandlers[value.type].toXML`; Task 5 covers running `round-trip-yaml` to reveal the next concrete type.
- Placeholder scan: no `TBD`, `TODO`, "similar to", or unspecified validation steps remain.
- Type consistency: error strings, imported type names, and function names match the existing files inspected before writing this plan.
