# DCS OrderItemAuto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `dcsset:OrderItemAuto` entries in DCS order settings.

**Architecture:** Extend the order item union with a dedicated auto item. Keep field order items unchanged; YAML should use a compact explicit auto marker.

**Tech Stack:** TypeScript, Vitest, DCS order rules.

---

### Task 1: Add Failing Auto Item Fixture

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/data.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/order/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/order/toXML.test.ts`

- [ ] **Step 1: Add XML auto item**

Add to the order XML:

```xml
<dcsset:item xsi:type="dcsset:OrderItemAuto"/>
```

- [ ] **Step 2: Add model value**

Add:

```ts
{ itemType: "OrderItemAuto" }
```

inside the order `items` array.

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/order/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/order/toXML.test.ts -t "auto"`

Expected: FAIL because the auto item is not represented.

### Task 2: Implement OrderItemAuto

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/toYAML.ts`

- [ ] **Step 1: Extend model union**

Add:

```ts
export type OrderItemAuto = { itemType: "OrderItemAuto" }
export type OrderItem = OrderItemField | OrderItemAuto
```

- [ ] **Step 2: Import XML auto item**

Map `xsi:type="dcsset:OrderItemAuto"` to:

```ts
{ itemType: "OrderItemAuto" }
```

- [ ] **Step 3: Export XML auto item**

Export:

```ts
{ "_xsi:type": "dcsset:OrderItemAuto" }
```

- [ ] **Step 4: Add YAML marker**

Use this YAML shape:

```yaml
- Авто
```

or the existing project convention for singleton enum-like markers if one already exists in DCS code.

- [ ] **Step 5: Verify green**

Run XML tests first, then YAML tests:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/order/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/order/toXML.test.ts -t "auto"
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/order/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/order/toYAML.test.ts -t "auto"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/order
git commit -m "fix: :bug: сохранить автоэлемент порядка DCS"
```

