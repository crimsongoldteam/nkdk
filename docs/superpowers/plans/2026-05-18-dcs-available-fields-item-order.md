# DCS AvailableFields Item Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve 1C XML order for object-form `AvailableFields` items by exporting `dcsset:use` before `dcsset:field`.

**Architecture:** The model shape stays unchanged: `AvailableFieldItem` already stores `field`, optional `use`, and optional presentation fields. `fromXML` remains order-insensitive; only the local expected XML fixture and `toXML` object construction order change.

**Tech Stack:** TypeScript, Vitest, existing `@nakidka/core` metadata XML round-trip fixtures.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/selected-item.xml`
  - Responsibility: expected XML for object-form `AvailableFields` items.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.ts`
  - Responsibility: export `AvailableFieldItem` values to XML object keys in stable order.

No type changes are needed.

---

### Task 1: Correct Selected Item Fixture Order

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/__fixtures__/selected-item.xml`

- [ ] **Step 1: Move `dcsset:use` before `dcsset:field` in the first object item**

Change the first `dcsset:item` from:

```xml
<dcsset:item>
	<dcsset:field>Документ</dcsset:field>
	<dcsset:use>true</dcsset:use>
	<dcsset:title>
```

to:

```xml
<dcsset:item>
	<dcsset:use>true</dcsset:use>
	<dcsset:field>Документ</dcsset:field>
	<dcsset:title>
```

- [ ] **Step 2: Move `dcsset:use` before `dcsset:field` in the second object item**

Change the second `dcsset:item` from:

```xml
<dcsset:item>
	<dcsset:field>Документ</dcsset:field>
	<dcsset:use>false</dcsset:use>
	<dcsset:lwsTitle>
```

to:

```xml
<dcsset:item>
	<dcsset:use>false</dcsset:use>
	<dcsset:field>Документ</dcsset:field>
	<dcsset:lwsTitle>
```

- [ ] **Step 3: Run focused tests and record the expected red state**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toXML.test.ts
```

Expected:

- `fromXML.test.ts` remains green because import does not depend on child-node order.
- `toXML.test.ts` fails for the selected-item fixture because `toXML.ts` still exports `field` before `use`.

- [ ] **Step 4: Do not commit**

Leave the fixture change unstaged for the next task.

---

### Task 2: Export Object AvailableFields Items In 1C Order

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.test.ts`

- [ ] **Step 1: Update object-form export order**

In `exportItem`, keep the string branch unchanged:

```ts
if (typeof item === "string") return { "dcsset:field": item }
```

For object items, replace the returned object with this order:

```ts
return {
  ...(item.use !== undefined ? { "dcsset:use": item.use } : {}),
  "dcsset:field": item.field,
  ...(item.title !== undefined
    ? { "dcsset:title": exportI8nTextToXML(context, { type: "I8nText" }, item.title) }
    : {}),
  ...(item.lwsTitle !== undefined
    ? { "dcsset:lwsTitle": exportI8nTextToXML(context, { type: "I8nText" }, item.lwsTitle) }
    : {}),
  ...(item.viewMode !== undefined ? { "dcsset:viewMode": item.viewMode } : {}),
}
```

- [ ] **Step 2: Run focused tests and confirm green state**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/availableFields/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toXML.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 3: Inspect the diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/dataCompositionSystem/availableFields
```

Expected:

- `selected-item.xml` has `dcsset:use` before `dcsset:field` in both object-form items.
- `toXML.ts` emits `dcsset:use` before `dcsset:field` only for object-form items.
- No unrelated files changed.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/availableFields
git commit -m "fix: :bug: сохранить порядок AvailableFields"
```

---

## Final Verification

After both tasks and reviews complete, run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/availableFields
```

Expected: the full `availableFields` test directory passes.

Before closing the whole round-trip discrepancy series, run full project verification from the repository root:

```bash
pnpm test
```
