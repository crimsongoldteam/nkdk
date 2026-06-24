# MetadataValue Reference Xsi Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop XML round-trip from failing on empty `MetadataValue` nodes such as `<xr:FillValue xsi:type="v8:TypeDescription"/>` by preserving their reference `_xsi:type` when the model value is absent.

**Architecture:** Keep the change inside `packages/core/metadata/commonObjects/metadataValue`. Normal import remains strict, while `forReference` import may keep raw XML for unknown `xsi:type`; export uses that raw reference only when the model value is `undefined`.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers, `round-trip-xml` runner.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`: add focused tests for unknown `xsi:type` behavior in normal and `forReference` modes.
- Modify `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`: add focused tests for reference `_xsi:type` export and priority over `rule.valueType`.
- Modify `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`: add an integration-style property export test for `xr:FillValue xsi:type="v8:TypeDescription"`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`: preserve raw reference XML for unknown typed values only when `context.fromXML.forReference === true`.
- Modify `packages/core/metadata/commonObjects/metadataValue/toXML.ts`: when `value === undefined`, export string `_xsi:type` from `referenceMetadata` before falling back to `exportNilValue` or `rule.valueType[0]`.

## Task 1: Capture Reference Import Behavior

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`

- [ ] **Step 1: Add failing tests for unknown typed XML**

Add these tests after `it("keeps xsi:nil for reference import", ...)` in `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`:

```ts
  it("keeps unknown xsi:type for reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription"/>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toEqual({ "_xsi:type": "v8:TypeDescription" })
  })

  it("throws on unknown xsi:type outside reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription"/>')

    expect(() =>
      importMetadataValueFromXML({
        context: mockContextFromXML(),
        rule: undefined,
        value: xmlValue,
      })
    ).toThrowError("MetadataValue: не распознан тип: v8:TypeDescription")
  })
```

- [ ] **Step 2: Run tests and verify the new reference test fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts -t "unknown xsi:type"
```

Expected: one test fails with `MetadataValue: не распознан тип: v8:TypeDescription`; the strict-mode test passes.

- [ ] **Step 3: Implement minimal reference preservation**

In `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`, change the `!resultedType` branch to:

```ts
  const resultedType: MetadataValueType | undefined = type ?? MetadataValueTypeFromXML(data["_xsi:type"] as MetadataValueTypeXML)
  if (!resultedType) {
    if (context.fromXML.forReference && typeof data["_xsi:type"] === "string") return data as any
    throw new Error(`MetadataValue: не распознан тип: ${data["_xsi:type"]}`)
  }
```

Keep the rest of the function unchanged.

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts -t "unknown xsi:type"
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromXML.ts
git commit -m "fix: :bug: сохранять unknown MetadataValue xsi:type для reference"
```

## Task 2: Export Missing Values From Reference Xsi Type

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`

- [ ] **Step 1: Add failing export tests**

Add these tests after `it("preserves reference xsi:nil for missing value", ...)` in `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`:

```ts
  it("preserves reference xsi:type for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "MetadataValue" },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="v8:TypeDescription"/>')
  })

  it("prefers reference xsi:type over rule valueType for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="v8:TypeDescription"/>')
  })
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/toXML.test.ts -t "reference xsi:type"
```

Expected: the new tests fail because export returns `<Value/>` or `<Value xsi:type="xs:string"/>` instead of the reference type.

- [ ] **Step 3: Add a small helper for reference `_xsi:type`**

In `packages/core/metadata/commonObjects/metadataValue/toXML.ts`, place this helper after `isNilMetadataValueXML`:

```ts
const getReferenceMetadataValueXMLType = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const xsiType = (value as Record<string, unknown>)["_xsi:type"]
  return typeof xsiType === "string" ? xsiType : undefined
}
```

- [ ] **Step 4: Use the helper before existing fallbacks**

In the `if (value === undefined)` block of `exportMetadataValueToXML`, change the branch to:

```ts
  if (value === undefined) {
    if (isNilMetadataValueXML(referenceMetadata)) return { "_xsi:nil": true }
    const referenceXMLType = getReferenceMetadataValueXMLType(referenceMetadata)
    if (referenceXMLType !== undefined) return { "_xsi:type": referenceXMLType }
    if (rule.exportNilValue) return { "_xsi:nil": true }
    if (rule.valueType !== undefined && rule.valueType.length > 0) {
      const firstType = rule.valueType[0]
      const xmlType = MetadataValueTypeToXML[firstType]
      return { "_xsi:type": xmlType }
    }
    return undefined
  }
```

- [ ] **Step 5: Run focused export tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/toXML.test.ts -t "reference xsi:type"
```

Expected: the two new tests pass.

- [ ] **Step 6: Run all MetadataValue XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.ts
git commit -m "fix: :bug: экспортировать empty MetadataValue type из reference"
```

## Task 3: Cover StandardAttribute FillValue And Round-Trip Failure

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`

- [ ] **Step 1: Add focused integration test for `xr:FillValue`**

Add this test near the existing `fillValue` and `maxValue` tests in `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`:

```ts
  it("preserves fillValue reference xsi type for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: StandardAttributeDescriptionRules.properties.fillValue,
      value: undefined,
      referenceMetadata: testImportPropertyFromXML({
        rule: StandardAttributeDescriptionRules.properties.fillValue,
        xmlString: '<xr:FillValue xsi:type="v8:TypeDescription"/>',
        xmlRootTag: "xr:FillValue",
        forReference: true,
      }),
      xmlRootTag: "xr:FillValue",
    })

    expect(result).toBe('<xr:FillValue xsi:type="v8:TypeDescription"/>')
  })
```

- [ ] **Step 2: Run the new integration test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts -t "preserves fillValue reference xsi type for missing value"
```

Expected: the test passes after Tasks 1 and 2.

- [ ] **Step 3: Run the affected test set**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 4: Verify the original round-trip no longer crashes**

Run from repository root:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the command does not stop with `MetadataValue: не распознан тип: v8:TypeDescription`. It may report ordinary diff files; those are separate round-trip problems for later triage.

- [ ] **Step 5: Run full project tests**

If this is a fresh worktree, run Langium generation first:

```bash
pnpm --filter nkdk-language langium:generate
```

Then run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts
git commit -m "test: :white_check_mark: покрыть FillValue reference xsi:type"
```

## Self-Review

- Spec coverage: covered strict import, reference import, missing-value export priority, standard attribute `FillValue`, and round-trip crash verification.
- Placeholder scan: no placeholder steps; every code change and command is explicit.
- Type consistency: plan uses existing `MetadataValue`, `referenceMetadata`, `mockContextFromXML`, `testExportPropertyToXML`, and `testImportPropertyFromXML` names from the current codebase.
