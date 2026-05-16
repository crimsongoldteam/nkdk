# ColumnGroup HeaderFormat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve localized `HeaderFormat` on `ColumnGroup`.

**Architecture:** Change `headerFormat` from plain string to `I8nText`, matching XML `LocalStringType`. Keep YAML key `ФорматШапки`.

**Tech Stack:** TypeScript, Vitest, form element rules.

---

### Task 1: Add LocalString Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/columnGroup/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/columnGroup/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Add XML node**

Add:

```xml
<HeaderFormat>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>ЧЦ=15; ЧДЦ=2</v8:content>
	</v8:item>
</HeaderFormat>
```

- [ ] **Step 2: Add model expectation**

Add:

```ts
headerFormat: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "ColumnGroup"`

Expected: FAIL because `headerFormat` is typed as `string`.

### Task 2: Change Rule To I8nText

**Files:**
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/types.ts`

- [ ] **Step 1: Update rule**

Replace:

```ts
headerFormat: { yaml: "ФорматШапки", type: "string" }
```

with:

```ts
headerFormat: { yaml: "ФорматШапки", type: "I8nText" }
```

- [ ] **Step 2: Verify green**

Run XML and YAML form element tests filtered by `ColumnGroup`. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/forms/elements/columnGroup
git commit -m "fix: :bug: сохранить формат шапки группы колонок"
```

