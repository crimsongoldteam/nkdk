# Planner Drag Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `EnableDrag` and `EnableStartDrag` on `PlannerField` XML/YAML round-trip.

**Architecture:** Remove `runtimeOnly` from the two `PlannerField` properties and keep `toEnterprise: false` so enterprise output remains unchanged.

**Tech Stack:** TypeScript, Vitest, form element rules.

---

### Task 1: Add PlannerField Drag Coverage

**Files:**
- Modify: `packages/core/metadata/forms/elements/plannerField/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/plannerField/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Add XML nodes**

Add to `full.xml`:

```xml
<EnableDrag>true</EnableDrag>
<EnableStartDrag>true</EnableStartDrag>
```

- [ ] **Step 2: Add model fields**

Add to `fullPlannerField`:

```ts
enableDrag: true,
enableStartDrag: true,
```

- [ ] **Step 3: Add YAML fields**

Add to `fullPlannerFieldPartialYAML`:

```ts
РазрешитьПеретаскивание: "Истина",
РазрешитьНачалоПеретаскивания: "Истина",
```

- [ ] **Step 4: Keep enterprise fixture unchanged**

Do not add `EnableDrag` or `EnableStartDrag` to `fullPlannerFieldEnterprise`.

- [ ] **Step 5: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "PlannerField"`

Expected: XML/YAML tests fail on missing fields; enterprise test continues to omit fields.

### Task 2: Remove runtimeOnly

**Files:**
- Modify: `packages/core/metadata/forms/elements/plannerField/rules.ts`

- [ ] **Step 1: Update rule**

Replace:

```ts
enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", runtimeOnly: true },
enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", runtimeOnly: true },
```

with:

```ts
enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", toEnterprise: false },
enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", toEnterprise: false },
```

- [ ] **Step 2: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/forms/elements/plannerField
git commit -m "fix: :bug: сохранить drag свойства PlannerField"
```

