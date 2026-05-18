# DCS Ent System Enumeration Round-trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve inferred `ent:*` DCS system enumeration type information through XML import and export.

**Architecture:** Add a typed system-enumeration value shape to `MetadataDcsMetadataSingleValue`. `fromXML` will return that shape only for inferred `ent:*` values under non-system-enumeration rules, and `toXML` will detect that shape before switching on `rule.valueType`.

**Tech Stack:** TypeScript, Vitest, existing DCS metadata value helpers.

---

### File Map

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
  - Add a typed system-enumeration value shape to `MetadataDcsMetadataSingleValue`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
  - Return `{ type: "SystemEnumeration", typeSE, value }` for inferred `ent:*`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
  - Export the typed shape through `exportSystemEnumerationToDcsXML`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
  - Change the inferred fixture expected value to the typed shape.
  - Include the inferred fixture in XML export fixtures.

### Task 1: Add Failing Fixture Expectations

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`

- [ ] **Step 1: Add a typed value alias after `fixtureHorizontalAlign`**

```ts
export const fixtureAccumulationRecordType = {
  type: "SystemEnumeration",
  typeSE: "AccumulationRecordType",
  value: "Expense",
} as const
```

- [ ] **Step 2: Update `inferredAccumulationRecordTypeFixture.value`**

Replace:

```ts
  value: "Expense",
```

with:

```ts
  value: fixtureAccumulationRecordType,
```

- [ ] **Step 3: Add the inferred fixture to export fixtures**

Replace:

```ts
export const dcsMetadataValueXMLFixtures: DcsMetadataValueFixture[] = [
  ...dcsMetadataValueFixtures,
  emptyLocalStringFixture,
  nilFixture,
  primitiveTypeRefFixture,
  primitiveUuidFixture,
]
```

with:

```ts
export const dcsMetadataValueXMLFixtures: DcsMetadataValueFixture[] = [
  ...dcsMetadataValueFixtures,
  emptyLocalStringFixture,
  nilFixture,
  primitiveTypeRefFixture,
  primitiveUuidFixture,
  inferredAccumulationRecordTypeFixture,
]
```

- [ ] **Step 4: Run focused tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: import fails because it returns `"Expense"` instead of typed shape; export fails because the typed shape is not yet supported.

### Task 2: Implement Typed Ent System Enumeration Import And Export

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`

- [ ] **Step 1: Add the typed value to `types.ts`**

Insert before `export type MetadataDcsMetadataSingleValue`:

```ts
export type MetadataDcsSystemEnumerationValue = {
  type: "SystemEnumeration"
  typeSE: keyof SystemEnumerationTypeMap
  value: string
}
```

Add `MetadataDcsSystemEnumerationValue` to the `MetadataDcsMetadataSingleValue` union before `string`.

- [ ] **Step 2: Return typed value for inferred ent system enumeration in `fromXML.ts`**

Replace:

```ts
  const inferredTypeSE = inferEntSystemEnumerationType(xsi)
  if (inferredTypeSE !== undefined) {
    return importSystemEnumerationFromDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: inferredTypeSE } as SystemEnumerationPropertyRule,
      xml as SystemEnumerationDcsValueRootXML
    )
  }
```

with:

```ts
  const inferredTypeSE = inferEntSystemEnumerationType(xsi)
  if (inferredTypeSE !== undefined) {
    const value = importSystemEnumerationFromDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: inferredTypeSE } as SystemEnumerationPropertyRule,
      xml as SystemEnumerationDcsValueRootXML
    )
    return { type: "SystemEnumeration", typeSE: inferredTypeSE, value }
  }
```

- [ ] **Step 3: Add a type guard in `toXML.ts`**

Add `MetadataDcsSystemEnumerationValue` to the type imports from `./types`.

Insert after `isExplicitTextValue`:

```ts
const isDcsSystemEnumerationValue = (
  data: MetadataDcsMetadataValue
): data is MetadataDcsSystemEnumerationValue =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "type" in data &&
  "typeSE" in data &&
  "value" in data &&
  data.type === "SystemEnumeration" &&
  typeof data.value === "string"
```

- [ ] **Step 4: Export typed system enumeration before the `rule.valueType` switch in `toXML.ts`**

Insert after the explicit text branch:

```ts
  if (isDcsSystemEnumerationValue(data)) {
    const out = exportSystemEnumerationToDcsXML(
      context,
      { type: "SystemEnumeration", typeSE: data.typeSE } as SystemEnumerationPropertyRule,
      data.value
    )
    if (!out) {
      throw new Error("DCS MetadataValue: cannot export empty inferred system enumeration")
    }
    return out
  }
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: all DCS metadata value import/export XML tests pass.

### Task 3: Verify And Commit DCS Ent System Enumeration Fix

**Files:**
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`

- [ ] **Step 1: Run the focused tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Check diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected: only typed inferred system enumeration support and fixture expectations changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
git commit -m "fix: :bug: сохранить ent system enumeration в DCS"
```

Expected: commit succeeds.

---

## Self-Review

- Spec coverage: inferred `ent:*` import, export through `exportSystemEnumerationToDcsXML`, explicit `valueType: "SystemEnumeration"` unchanged.
- Placeholder scan: no placeholders remain.
- Type consistency: the typed shape is named `MetadataDcsSystemEnumerationValue` and uses `typeSE` consistently.
