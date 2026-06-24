# Accounting Register Standard Attributes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve explicitly present standard attributes, including accounting register `ExtDimension1..50`, during XML round-trip.

**Architecture:** Keep the behavior inside `StandardAttributeDescriptions` so all applied objects use the same reference-aware list logic. Export should prefer attributes present in the reference or current model/YAML; without a reference it may use the canonical full list from the rule.

**Tech Stack:** TypeScript, Vitest, metadata `rules.ts`, `StandardAttributeDescriptions`.

---

### Task 1: Add XML Coverage For Explicit Standard Attributes

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/standardAttributeDescription/__fixtures__/accounting-ext-dimensions.xml`
- Test: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`

- [ ] **Step 1: Write the failing fixture**

Add a fixture object with explicit `ExtDimension1`, `ExtDimensionType1`, `ExtDimension50`, and `ExtDimensionType50` entries:

```ts
export const accountingExtDimensions = [
  { itemType: "StandardAttributeDescription", name: "ExtDimension1" },
  { itemType: "StandardAttributeDescription", name: "ExtDimensionType1" },
  { itemType: "StandardAttributeDescription", name: "ExtDimension50" },
  { itemType: "StandardAttributeDescription", name: "ExtDimensionType50" },
] satisfies StandardAttributeDescriptions
```

- [ ] **Step 2: Add XML fixture**

Create `accounting-ext-dimensions.xml`:

```xml
<StandardAttributes>
	<xr:StandardAttribute name="ExtDimension1"/>
	<xr:StandardAttribute name="ExtDimensionType1"/>
	<xr:StandardAttribute name="ExtDimension50"/>
	<xr:StandardAttribute name="ExtDimensionType50"/>
</StandardAttributes>
```

- [ ] **Step 3: Add import/export tests**

Add tests using the existing `StandardAttributeDescriptions` property rule:

```ts
const accountingRule = {
  type: "StandardAttributeDescriptions",
  standartAttributeNames: {},
} satisfies PropertyRule
```

- [ ] **Step 4: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXML.test.ts metadata/commonObjects/standardAttributeDescription/toXML.test.ts -t "ExtDimension"`

Expected: FAIL because export currently omits or invents attributes not present in the source set.

### Task 2: Implement Reference-Aware Export

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/types.ts`

- [ ] **Step 1: Preserve explicit names from reference and model**

In export, build the output name list from:

```ts
const referenceNames = referenceMetadata?.map((item) => item.name) ?? []
const modelNames = value?.map((item) => item.name) ?? []
const names = Array.from(new Set([...referenceNames, ...modelNames]))
```

If `names.length === 0`, fall back to `Object.keys(rule.standartAttributeNames ?? {})`.

- [ ] **Step 2: Keep item payloads by name**

When creating each exported item, use the model item first, then reference item:

```ts
const item = valueByName.get(name) ?? referenceByName.get(name) ?? { itemType: "StandardAttributeDescription", name }
```

- [ ] **Step 3: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription
git commit -m "fix: :bug: сохранить стандартные реквизиты"
```

### Task 3: Add Applied Object Regression

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Test: `packages/core/metadata/appliedObjects/metadataAccountingRegister/fromXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataAccountingRegister/toXML.test.ts`

- [ ] **Step 1: Confirm accounting names include dimensions 1..50**

Ensure `MetadataAccountingRegisterStandardAttributeNames` contains generated keys:

```ts
Object.fromEntries(
  Array.from({ length: 50 }, (_, index) => {
    const number = index + 1
    return [
      [`ExtDimension${number}`, `Субконто${number}`],
      [`ExtDimensionType${number}`, `ВидСубконто${number}`],
    ]
  }).flat()
)
```

- [ ] **Step 2: Run accounting register tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataAccountingRegister -t "standard"`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataAccountingRegister packages/core/metadata/commonObjects/standardAttributeDescription
git commit -m "fix: :bug: добавить субконто стандартных реквизитов"
```

