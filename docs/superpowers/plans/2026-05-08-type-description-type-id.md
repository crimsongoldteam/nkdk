# TypeDescription TypeId Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `v8:TypeId` values in `TypeDescription` through XML, model, and YAML conversions.

**Architecture:** Keep the change local to `packages/core/metadata/commonObjects/typeDescription`. Add `typeId?: string[]` beside the existing mandatory `type: string[]`, extend XML import/export for `v8:TypeId`, and add an explicit YAML object form with `ИдентификаторТипа`.

**Tech Stack:** TypeScript, TypeBox, Vitest, existing `TypeDescription` fixture table.

---

## Baseline

This plan is written in worktree:

```text
/Users/nikita/git/nakidka-core/.worktrees/codex-type-description-type-id
```

Baseline commands already run before writing this plan:

```bash
pnpm install
pnpm --filter nkdk-language langium:generate
pnpm test
```

`pnpm test` currently fails before any implementation changes with two 5 second timeout failures:

- `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
- `packages/core/metadata/appliedObjects/metadataDocumentNumerator/syncToXML.test.ts`

All other reported tests passed (`2745` passed, `13` skipped). Treat those two timeouts as baseline noise unless this task changes them.

## File Structure

- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`
  - Add XML `v8:TypeId`.
  - Add model field `typeId?: string[]`.
  - Extend `TypeDescriptionYAML` to allow `{ ИдентификаторТипа?: string[] }`.
- Modify: `packages/core/metadata/commonObjects/typeDescription/__fixtures__/data.ts`
  - Add one shared table fixture with `type: []`, two `typeId` values, XML `v8:TypeId`, and YAML `ИдентификаторТипа`.
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`
  - Import one or many `v8:TypeId` nodes into `typeId`.
  - Return `undefined` only when both `type` and `typeId` are empty.
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
  - Export `typeId` back to `v8:TypeId`.
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
  - Import `{ ИдентификаторТипа: [...] }`.
  - Treat `{ ИдентификаторТипа: [] }` as `undefined`.
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
  - Export TypeId-only descriptions as `{ ИдентификаторТипа: [...] }`.
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`
  - Add explicit empty TypeId YAML test.

## Task 1: Add Failing TypeId Fixture And YAML Empty Test

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`

- [ ] **Step 1: Add the shared TypeId fixture**

In `packages/core/metadata/commonObjects/typeDescription/__fixtures__/data.ts`, add this object to `typeFixturesTable` after the `DynamicList` fixture and before `//#endregion` for other primitive types:

```typescript
  {
    internal: {
      type: [],
      typeId: ["8c1e3694-da12-44d5-8b1f-d134b89a1282", "6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c"],
    },
    YAML: {
      ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282", "6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c"],
    },
    xml: `<TypeDescription>
	<v8:TypeId>8c1e3694-da12-44d5-8b1f-d134b89a1282</v8:TypeId>
	<v8:TypeId>6b99868d-5f3a-44e2-bb6d-3ad3b5d3198c</v8:TypeId>
</TypeDescription>`,
  },
```

- [ ] **Step 2: Add the empty TypeId YAML test**

In `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`, add this test after the whitespace test:

```typescript
  it("should parse empty type ids as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, { ИдентификаторТипа: [] })
    expect(result).toBeUndefined()
  })
```

- [ ] **Step 3: Run targeted tests and verify they fail for missing TypeId support**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/typeDescription/fromXML.test.ts \
  metadata/commonObjects/typeDescription/toXML.test.ts \
  metadata/commonObjects/typeDescription/fromYAML.test.ts \
  metadata/commonObjects/typeDescription/toYAML.test.ts
```

Expected: FAIL. Acceptable failure signals at this point:

- `TypeDescription` does not know `typeId`;
- YAML object `{ ИдентификаторТипа: [...] }` is not accepted;
- XML import returns `undefined` for TypeId-only XML;
- XML/YAML export cannot serialize `type: []`.

Do not commit after this task because the tests are intentionally red.

## Task 2: Extend Types And XML Conversion

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`

- [ ] **Step 1: Extend XML, model, and YAML types**

In `packages/core/metadata/commonObjects/typeDescription/types.ts`, replace `TypeDescriptionXML` with:

```typescript
export type TypeDescriptionXML = {
  "v8:Type"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:TypeSet"?: TypeDescriptionXMLType | TypeDescriptionXMLType[]
  "v8:TypeId"?: string | string[]
  "v8:StringQualifiers"?: TypeDescriptionXMLStringQualifiers
  "v8:NumberQualifiers"?: TypeDescriptionXMLNumberQualifiers
  "v8:DateQualifiers"?: TypeDescriptionXMLDateQualifiers
}
```

In the same file, add this interface before `TypeDescription`:

```typescript
export interface TypeDescriptionTypeIdYAML {
  ИдентификаторТипа?: string[]
}
```

Replace `TypeDescription` with:

```typescript
export interface TypeDescription {
  type: TypeDescriptionType[]
  typeId?: string[]
  stringQualifiers?: TypeDescriptionStringQualifiers
  numberQualifiers?: TypeDescriptionNumberQualifiers
  dateQualifiers?: TypeDescriptionDateQualifiers
}
```

Replace `TypeDescriptionJSONSchema` and `TypeDescriptionYAML` with:

```typescript
export const TypeDescriptionJSONSchema = Type.Union([
  Type.String(),
  Type.Array(Type.String()),
  Type.Object(
    {
      ИдентификаторТипа: Type.Optional(Type.Array(Type.String())),
    },
    { additionalProperties: false }
  ),
])
export type TypeDescriptionYAML = Static<typeof TypeDescriptionJSONSchema>
```

- [ ] **Step 2: Import `v8:TypeId` from XML**

In `packages/core/metadata/commonObjects/typeDescription/fromXML.ts`, add `const typeId = getTypeIds(xml["v8:TypeId"])` after `const types = extractTypes(xml)`:

```typescript
  const types = extractTypes(xml)
  const typeId = getTypeIds(xml["v8:TypeId"])
  const stringQualifiers = getStringQualifiers(_context, xml["v8:StringQualifiers"])
```

Add `typeId` to `result`:

```typescript
  const result: TypeDescription = {
    type: types,
    ...(typeId !== undefined && { typeId }),
    ...(stringQualifiers !== undefined && { stringQualifiers }),
    ...(numberQualifiers !== undefined && { numberQualifiers }),
    ...(dateQualifiers !== undefined && { dateQualifiers }),
  }
```

Replace the empty check with:

```typescript
  if (result.type.length === 0 && result.typeId === undefined) return undefined
```

Add this helper near `getTypes`:

```typescript
const getTypeIds = (typeId: TypeDescriptionXML["v8:TypeId"]): string[] | undefined => {
  if (typeId === undefined) return undefined

  const typeIds = Array.isArray(typeId) ? typeId : [typeId]
  const nonEmptyTypeIds = typeIds.filter((item) => item.trim() !== "")

  return nonEmptyTypeIds.length > 0 ? nonEmptyTypeIds : undefined
}
```

- [ ] **Step 3: Export `typeId` to XML**

In `packages/core/metadata/commonObjects/typeDescription/toXML.ts`, add `const typeIdXML = getTypeIdXML(typeDescription)` after `const typesXML = getTypesXML(typeDescription)`:

```typescript
  const typesXML = getTypesXML(typeDescription)
  const typeIdXML = getTypeIdXML(typeDescription)

  const result = {
    ...typesXML,
    ...(typeIdXML !== undefined ? { "v8:TypeId": typeIdXML } : undefined),
    ...(numberQualifiers !== undefined ? { "v8:NumberQualifiers": numberQualifiers } : undefined),
```

Add this helper after `getTypesXML`:

```typescript
const getTypeIdXML = (typeDescription: TypeDescription): TypeDescriptionXML["v8:TypeId"] | undefined => {
  if (typeDescription.typeId === undefined || typeDescription.typeId.length === 0) return undefined

  return typeDescription.typeId.length === 1 ? typeDescription.typeId[0] : typeDescription.typeId
}
```

- [ ] **Step 4: Run XML tests and inspect remaining YAML failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/typeDescription/fromXML.test.ts \
  metadata/commonObjects/typeDescription/toXML.test.ts \
  metadata/commonObjects/typeDescription/fromYAML.test.ts \
  metadata/commonObjects/typeDescription/toYAML.test.ts
```

Expected after this task: XML tests pass for `typeId`; YAML tests still fail until Task 3.

Do not commit after this task because YAML support is still incomplete.

## Task 3: Implement YAML Object Form

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`

- [ ] **Step 1: Import the TypeId YAML type**

In `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`, add `TypeDescriptionTypeIdYAML` to the import from `./types`:

```typescript
  TypeDescriptionTypeIdYAML,
  TypeDescriptionYAML,
} from "./types"
```

- [ ] **Step 2: Add a YAML object type guard**

In `fromYAML.ts`, add this helper before `importTypeDescriptionFromYAML`:

```typescript
const isTypeIdYAML = (value: TypeDescriptionYAML): value is TypeDescriptionTypeIdYAML =>
  typeof value === "object" && value !== null && !Array.isArray(value)
```

- [ ] **Step 3: Handle `{ ИдентификаторТипа: [...] }` before string parsing**

In `importTypeDescriptionFromYAML`, after the `value === undefined` guard and before `const types: string[] = []`, add:

```typescript
  if (isTypeIdYAML(value)) {
    const typeId = value.ИдентификаторТипа?.filter((item) => item.trim() !== "")

    if (typeId === undefined || typeId.length === 0) {
      return undefined
    }

    return {
      type: [],
      typeId,
    }
  }
```

- [ ] **Step 4: Export TypeId-only YAML**

In `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`, replace the beginning of `exportTypeDescriptionToYAML` with:

```typescript
export const exportTypeDescriptionToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined
): TypeDescriptionYAML | undefined => {
  if (!typeDescription) {
    return undefined
  }

  const types = typeDescription.type

  if (types.length === 0) {
    if (typeDescription.typeId === undefined || typeDescription.typeId.length === 0) {
      return undefined
    }

    return {
      ИдентификаторТипа: typeDescription.typeId,
    }
  }

  if (types.length > 1) {
    return types.map((type) => formatSingleType(type, typeDescription))
  }

  return formatSingleType(types[0], typeDescription)
}
```

- [ ] **Step 5: Run all TypeDescription conversion tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/typeDescription/fromXML.test.ts \
  metadata/commonObjects/typeDescription/toXML.test.ts \
  metadata/commonObjects/typeDescription/fromYAML.test.ts \
  metadata/commonObjects/typeDescription/toYAML.test.ts
```

Expected: PASS. The fixture counts should increase by one table case in each file, and `fromYAML.test.ts` should also include the new explicit empty TypeId test.

Do not commit yet; run the broader core checks in Task 4 first.

## Task 4: Verify Focused Core Behavior And Commit

**Files:**
- Verify: `packages/core/metadata/commonObjects/typeDescription/*`

- [ ] **Step 1: Run the complete typeDescription test set**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription
```

Expected: PASS.

- [ ] **Step 2: Run core tests once**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: either PASS, or the same two baseline timeout failures in:

- `metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
- `metadata/appliedObjects/metadataDocumentNumerator/syncToXML.test.ts`

If any `typeDescription` test fails, fix it before continuing. If any new non-baseline failure appears, stop and investigate before committing.

- [ ] **Step 3: Review the diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/typeDescription
```

Confirm the diff is limited to:

- `types.ts`
- `__fixtures__/data.ts`
- `fromXML.ts`
- `toXML.ts`
- `fromYAML.ts`
- `toYAML.ts`
- `fromYAML.test.ts`

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add \
  packages/core/metadata/commonObjects/typeDescription/types.ts \
  packages/core/metadata/commonObjects/typeDescription/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/typeDescription/fromXML.ts \
  packages/core/metadata/commonObjects/typeDescription/toXML.ts \
  packages/core/metadata/commonObjects/typeDescription/fromYAML.ts \
  packages/core/metadata/commonObjects/typeDescription/toYAML.ts \
  packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts

git commit -m "fix: :bug: сохранить идентификаторы типов TypeDescription"
```

Expected: commit succeeds on branch `codex/type-description-type-id`.

## Task 5: Final Verification And Handoff

**Files:**
- Verify: repository state

- [ ] **Step 1: Verify branch and status**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
codex/type-description-type-id
```

`git status --short` should be empty.

- [ ] **Step 2: Report verification evidence**

In the handoff, include:

- worktree path: `/Users/nikita/git/nakidka-core/.worktrees/codex-type-description-type-id`;
- branch: `codex/type-description-type-id`;
- targeted TypeDescription tests result;
- `@nakidka/core` test result and whether the two baseline timeout failures remain.

- [ ] **Step 3: Do not run round-trip triage from this plan**

This plan intentionally stops at model/XML/YAML support for `TypeDescription`. The original short round-trip diff involving `DCSParameter.valueType` can be rechecked after this implementation lands.

## Self-Review

- Spec coverage: the plan covers `typeId?: string[]`, XML `v8:TypeId`, YAML `ИдентификаторТипа`, shared fixture table coverage, and the empty YAML object behavior.
- Scope: one subsystem, `TypeDescription`; no unrelated `DCSParameter` reproducer or XML fixture changes.
- Type consistency: all snippets use `typeId`, `TypeDescriptionTypeIdYAML`, and `ИдентификаторТипа` consistently.
- Baseline risk: full project test already has two timeout failures before implementation; the plan records them and requires targeted TypeDescription tests to pass.
