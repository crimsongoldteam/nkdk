# FunctionalOptions Empty Item Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve empty functional option items as explicit empty strings.

**Architecture:** Keep the existing `FunctionalOptionsProperty` collection shape and distinguish an empty `<Item/>` from an absent collection. Represent the empty item as `""` in model and YAML.

**Tech Stack:** TypeScript, Vitest, `FunctionalOptionsProperty`.

---

### Task 1: Add Failing Empty Item Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/toYAML.test.ts`

- [ ] **Step 1: Add XML import/export case**

Use XML:

```xml
<FunctionalOptions>
	<Item/>
</FunctionalOptions>
```

Expected model:

```ts
[""]
```

- [ ] **Step 2: Add YAML import/export case**

Use YAML:

```ts
[""]
```

Expected YAML:

```yaml
ФункциональныеОпции:
  - ""
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/functionalOptionsProperty -t "empty item"`

Expected: FAIL because empty items are skipped or treated as absent.

### Task 2: Preserve Empty Items

**Files:**
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/functionalOptionsProperty/toYAML.ts`

- [ ] **Step 1: Import empty XML item**

When an XML `Item` exists with no text, return:

```ts
""
```

- [ ] **Step 2: Export empty string**

When item is `""`, export:

```ts
{ Item: "" }
```

so XML exporter emits `<Item/>`.

- [ ] **Step 3: Preserve YAML empty string**

Do not filter empty strings in YAML conversion.

- [ ] **Step 4: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/functionalOptionsProperty
git commit -m "fix: :bug: сохранить пустую функциональную опцию"
```

