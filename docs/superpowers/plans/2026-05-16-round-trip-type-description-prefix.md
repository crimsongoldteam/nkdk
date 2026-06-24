# TypeDescription Prefix Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the XML type spelling from reference metadata when the semantic type and namespace match.

**Architecture:** Keep the public model canonical, and store reference XML spelling as reference metadata only. Export should prefer the reference spelling for the same semantic type and namespace, while new models continue to export canonical prefixes.

**Tech Stack:** TypeScript, Vitest, `TypeDescription` import/export.

---

### Task 1: Add Reference Prefix Regression

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`

- [ ] **Step 1: Add import assertion**

Add a test that imports:

```xml
<Type>
	<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>
</Type>
```

Expected model:

```ts
{ type: ["Chart"] }
```

- [ ] **Step 2: Add export-with-reference assertion**

Use `referenceMetadata` imported from the XML above and export the same model:

```ts
const value = { type: ["Chart"] }
```

Expected XML keeps:

```xml
<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/fromXML.test.ts metadata/commonObjects/typeDescription/toXML.test.ts -t "prefix"`

Expected: FAIL on export changing the prefix to canonical spelling.

### Task 2: Preserve Reference XML Spelling

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`

- [ ] **Step 1: Add reference-only metadata marker**

Add a symbol-backed or non-YAML property for source XML type entries:

```ts
export type TypeDescriptionSourceType = {
  value: string
  namespace?: string
}
```

- [ ] **Step 2: Capture XML spelling on reference import**

When importing each `<v8:Type>`, store:

```ts
{ value: "d7p1:Chart", namespace: "http://v8.1c.ru/8.2/data/chart" }
```

only in reference metadata.

- [ ] **Step 3: Reuse spelling on matching export**

Before canonical export, compare current semantic type with reference source entry. If semantic type and namespace match, export the original string and namespace attribute.

- [ ] **Step 4: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription
git commit -m "fix: :bug: сохранить XML-префикс TypeDescription"
```

