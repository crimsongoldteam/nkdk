# MinMax Decimal Comma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import `xs:string` min/max decimal values with comma and export them back with comma.

**Architecture:** Keep model values numeric. Preserve XML scalar kind through the existing `MinMaxValue` reference marker so `xs:string` values export with comma while `xs:decimal` values keep dot.

**Tech Stack:** TypeScript, Vitest, `MinMaxValue`.

---

### Task 1: Add Decimal Comma Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts`

- [ ] **Step 1: Add import case**

Use XML:

```xml
<MinValue xsi:type="xs:string">0,005</MinValue>
```

Expected model value:

```ts
0.005
```

- [ ] **Step 2: Add export case**

Export a value carrying `xs:string` reference marker and expect:

```xml
<MinValue xsi:type="xs:string">0,005</MinValue>
```

- [ ] **Step 3: Add decimal-dot control case**

Export `xs:decimal` and expect:

```xml
<MinValue xsi:type="xs:decimal">0.005</MinValue>
```

- [ ] **Step 4: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/minMaxValue -t "comma"`

Expected: FAIL because comma is not preserved.

### Task 2: Implement Comma Formatting

**Files:**
- Modify: `packages/core/metadata/commonObjects/minMaxValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/minMaxValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/minMaxValue/types.ts`

- [ ] **Step 1: Parse comma on import**

When `xsi:type` is `xs:string`, parse:

```ts
Number(text.replace(",", "."))
```

and attach `xs:string` to the boxed reference marker.

- [ ] **Step 2: Export comma for marked xs:string**

Use:

```ts
String(value).replace(".", ",")
```

only for `xs:string` values with fractional part.

- [ ] **Step 3: Keep integers stable**

For `1`, export:

```xml
<MinValue xsi:type="xs:string">1</MinValue>
```

- [ ] **Step 4: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/minMaxValue
git commit -m "fix: :bug: сохранить запятую в MinMaxValue"
```

