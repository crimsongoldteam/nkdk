# TypeDescription ConditionalAppearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support `ConditionalAppearance` as a valid `TypeDescription` type and preserve its XML namespace prefix from reference.

**Architecture:** Extend `TypeDescriptionRules` with the known `entext` type mapping. Reuse the TypeDescription prefix preservation behavior when available.

**Tech Stack:** TypeScript, Vitest, `TypeDescription`.

---

### Task 1: Add ConditionalAppearance Type Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`

- [ ] **Step 1: Add import XML**

Use:

```xml
<Type>
	<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>
</Type>
```

Expected model:

```ts
{ type: ["ConditionalAppearance"] }
```

- [ ] **Step 2: Add export-with-reference case**

Export the same model with reference metadata and expect `d7p1:ConditionalAppearance`.

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription -t "ConditionalAppearance"`

Expected: FAIL because the type is unsupported or canonicalized incorrectly.

### Task 2: Add TypeDescription Mapping

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/rules.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`

- [ ] **Step 1: Add type mapping**

Add the semantic type:

```ts
ConditionalAppearance: {
  xmlType: "ConditionalAppearance",
  namespace: "http://v8.1c.ru/8.3/data/entext",
}
```

- [ ] **Step 2: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription
git commit -m "fix: :bug: добавить ConditionalAppearance в TypeDescription"
```

