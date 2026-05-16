# ViewStatusAddition Visible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `Visible` on `ViewStatusAddition` through XML and YAML round-trip.

**Architecture:** Add a normal boolean property to `ViewStatusAdditionRules` and expose the matching YAML key. This is local to `viewStatusAddition`.

**Tech Stack:** TypeScript, Vitest, form element fixture tests.

---

### Task 1: Add Failing Form Element Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add XML node to the fixture**

Add this node to `full.xml` near `Enabled`:

```xml
<Visible>false</Visible>
```

- [ ] **Step 2: Add model and YAML expectations**

Add to `fullViewStatusAddition`:

```ts
visible: false,
```

Add to `fullViewStatusAdditionYAML`:

```ts
Видимость: "Ложь",
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "ViewStatusAddition"`

Expected: FAIL on missing `visible` in import/export.

### Task 2: Add Rule And Type Support

**Files:**
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/types.ts`

- [ ] **Step 1: Add rule property**

Add:

```ts
visible: { yaml: "Видимость", type: "boolean" },
```

- [ ] **Step 2: Add YAML type field**

Add to `ViewStatusAdditionYAML`:

```ts
Видимость?: StringboolYAML
```

- [ ] **Step 3: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/forms/elements/viewStatusAddition
git commit -m "fix: :bug: сохранить видимость ViewStatusAddition"
```

