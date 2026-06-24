# FixedArray Nil Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `v8:Value xsi:nil="true"` entries inside `MetadataValue` FixedArray as `undefined` in TS/YAML and round-trip them back to XML.

**Architecture:** Keep nil support scoped to FixedArray elements. Extend the FixedArray value array to `Array<MetadataTypedValue | undefined>`, teach XML/YAML import/export to preserve `undefined`, and skip undefined values in graph extraction.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON schema, existing `MetadataValue` XML/YAML handlers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataValue/types.ts`
  - Allow `undefined` inside `MetadataFixedArrayValue.value`.
  - Allow `undefined` in FixedArray YAML JSON schema.
- Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromXML.ts`
  - Import `v8:Value xsi:nil="true"` as `undefined`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.ts`
  - Export `undefined` array items as `{ "_xsi:nil": true }`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
  - Preserve `undefined` and treat YAML parser `null` as `undefined`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
  - Export undefined array items as `undefined`.
- Modify `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
  - Skip undefined FixedArray items when extracting reference edges.
- Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
  - Add fixture with a nil element between two references.
- Modify fixedArray tests:
  - `fromXML.test.ts`
  - `toXML.test.ts`
  - `fromYAML.test.ts`
  - `toYAML.test.ts`
- Add choice parameter fixtures/tests:
  - `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/fixedArrayWithNil.xml`
  - `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/toXML.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`

## Task 1: FixedArray XML Nil

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.test.ts`

- [ ] **Step 1: Add fixture data**

In `fixedArray/__fixtures__/data.ts`, add:

```ts
export const refsWithNilFixedArray: MetadataFixedArrayValue = {
  type: "fixedArray",
  value: [
    { type: "ref", value: "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
    undefined,
    { type: "ref", value: "Enum.ХозяйственныеОперации.EmptyRef" },
  ],
}

export const refsWithNilFixedArrayXML = `<Value xsi:type="v8:FixedArray">
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту</v8:Value>
	<v8:Value xsi:nil="true"/>
	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EmptyRef</v8:Value>
</Value>`
```

- [ ] **Step 2: Add failing XML tests**

In `fixedArray/fromXML.test.ts`, import the fixture and add:

```ts
it("should import fixed array with nil element", () => {
  const result = importFixedArrayFromXML(mockContextFromXML(), parseXML(refsWithNilFixedArrayXML))
  expect(result).toEqual(refsWithNilFixedArray)
})
```

In `fixedArray/toXML.test.ts`, import the fixture and add:

```ts
it("should export fixed array with nil element and round-trip via XML", () => {
  const xmlNode = exportFixedArrayToXML(mockContext, refsWithNilFixedArray)
  const reimported = importFixedArrayFromXML(mockContextFromXML(), xmlNode)
  expect(reimported).toEqual(refsWithNilFixedArray)
  expect(xmlNode["v8:Value"]).toEqual([
    { "_xsi:type": "xr:DesignTimeRef", "#text": "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
    { "_xsi:nil": true },
    { "_xsi:type": "xr:DesignTimeRef", "#text": "Enum.ХозяйственныеОперации.EmptyRef" },
  ])
})
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/fixedArray -t "nil element"
```

Expected: FAIL because `undefined` is not allowed or because nil import calls `importMetadataValueFromXML` and returns a non-nil value.

- [ ] **Step 4: Update FixedArray types**

In `packages/core/metadata/commonObjects/metadataValue/types.ts`, change:

```ts
export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: MetadataTypedValue[]
}
```

to:

```ts
export interface MetadataFixedArrayValue {
  type: "fixedArray"
  value: Array<MetadataTypedValue | undefined>
}
```

Change FixedArray YAML schema from:

```ts
export const MetadataFixedArrayValueJSONSchema = Type.Array(MetadataSingleValueJSONSchema)
```

to:

```ts
export const MetadataFixedArrayValueJSONSchema = Type.Array(
  Type.Union([MetadataSingleValueJSONSchema, Type.Undefined()])
)
```

- [ ] **Step 5: Implement XML nil handling**

In `fixedArray/fromXML.ts`, replace the `values.map` expression with:

```ts
value: values.map((v) => {
  if (v !== null && typeof v === "object" && (v as { "_xsi:nil"?: unknown })["_xsi:nil"] === true) {
    return undefined
  }
  return importMetadataValueFromXML({ context, rule: undefined, value: v })!
}),
```

In `fixedArray/toXML.ts`, replace `values` creation with:

```ts
const values = data.value.map((v) => {
  if (v === undefined) return { "_xsi:nil": true }
  return exportMetadataValueToXML({ context, rule, value: v as MetadataTypedValue })
})
```

- [ ] **Step 6: Run XML tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/fixedArray -t "nil element|two refs|single string"
```

Expected: PASS.

- [ ] **Step 7: Commit XML changes**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/fixedArray
git commit -m "fix: :bug: сохранить nil в FixedArray XML"
```

## Task 2: FixedArray YAML Undefined

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.test.ts`

- [ ] **Step 1: Add YAML fixture**

In `fixedArray/__fixtures__/data.ts`, add:

```ts
export const refsWithNilFixedArrayYAML: MetadataFixedArrayValueYAML = [
  "Перечисление.ХозяйственныеОперации.РеализацияКлиенту",
  undefined,
  "Перечисление.ХозяйственныеОперации.ПустаяСсылка",
]
```

- [ ] **Step 2: Add failing YAML tests**

In `fixedArray/fromYAML.test.ts`, add:

```ts
it("should import fixed array with undefined YAML element", () => {
  const result = importFixedArrayFromYAML(mockContext, refsWithNilFixedArrayYAML)
  expect(result).toEqual(refsWithNilFixedArray)
})

it("should import YAML null as undefined inside fixed array", () => {
  const result = importFixedArrayFromYAML(mockContext, [
    "Перечисление.ХозяйственныеОперации.РеализацияКлиенту",
    null,
    "Перечисление.ХозяйственныеОперации.ПустаяСсылка",
  ] as unknown as MetadataFixedArrayValueYAML)

  expect(result).toEqual(refsWithNilFixedArray)
})
```

In `fixedArray/toYAML.test.ts`, add:

```ts
it("should export fixed array with undefined YAML element", () => {
  const result = exportFixedArrayToYAML(mockContext, refsWithNilFixedArray)
  expect(result).toEqual(refsWithNilFixedArrayYAML)
})
```

- [ ] **Step 3: Run YAML tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/fixedArray -t "undefined YAML|YAML null"
```

Expected: FAIL because YAML import/export does not preserve undefined inside arrays.

- [ ] **Step 4: Implement YAML undefined handling**

In `fixedArray/fromYAML.ts`, replace the body with:

```ts
export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAML
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v) => {
    if (v === undefined || v === null) return undefined
    return importMetadataValueFromYAML(context, undefined, v)!
  }),
})
```

In `fixedArray/toYAML.ts`, replace the mapper with:

```ts
data.value.map((v) => {
  if (v === undefined) return undefined
  return exportMetadataValueToYAML(context, undefined, v as MetadataTypedValue)!
}) as MetadataFixedArrayValueYAML
```

- [ ] **Step 5: Run YAML tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/fixedArray -t "undefined YAML|YAML null"
```

Expected: PASS.

- [ ] **Step 6: Commit YAML changes**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/fixedArray packages/core/metadata/commonObjects/metadataValue/types.ts
git commit -m "fix: :bug: сохранить undefined в FixedArray YAML"
```

## Task 3: ChoiceParameters FixedArray Fixture

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/fixedArrayWithNil.xml`
- Modify: choice parameter XML/YAML tests.

- [ ] **Step 1: Add the choice parameter XML fixture**

Create `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/fixedArrayWithNil.xml`:

```xml
<ChoiceParameter>
	<Name>Состояния</Name>
	<Value xsi:type="v8:FixedArray">
		<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту</v8:Value>
		<v8:Value xsi:nil="true"/>
		<v8:Value xsi:type="xr:DesignTimeRef">Enum.ХозяйственныеОперации.EmptyRef</v8:Value>
	</Value>
</ChoiceParameter>
```

- [ ] **Step 2: Add TS and YAML fixture data**

In `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`, add new exports without modifying existing XML-backed fixtures:

```ts
export const fixedArrayWithNilChoiceParameter = {
  itemType: "ChoiceParameter",
  name: "Состояния",
  value: refsWithNilFixedArray,
} satisfies ChoiceParameter

export const fixedArrayWithNilChoiceParameterYAML = {
  Имя: "Состояния",
  Значение: refsWithNilFixedArrayYAML,
} satisfies ChoiceParameterYAML
```

- [ ] **Step 3: Add XML/YAML tests**

In `fromXML.test.ts`, add:

```ts
it("imports fixedArrayWithNil", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "fixedArrayWithNil.xml",
    xmlRootTag: "ChoiceParameter",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(fixedArrayWithNilChoiceParameter)
})
```

In `toXML.test.ts`, add:

```ts
it("exports fixedArrayWithNil", () => {
  const { expectedResult, result } = testExportPropertyToXML({
    rule,
    value: fixedArrayWithNilChoiceParameter,
    xmlRootTag: "ChoiceParameter",
    path: "fixedArrayWithNil.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})
```

In `fromYAML.test.ts`, add:

```ts
it("imports fixedArrayWithNil YAML", () => {
  const result = importPropertyFromYAML(mockContext, rule, fixedArrayWithNilChoiceParameterYAML)

  expect(result).toEqual(fixedArrayWithNilChoiceParameter)
})
```

In `toYAML.test.ts`, add:

```ts
it("exports fixedArrayWithNil YAML", () => {
  const result = exportPropertyToYAML(mockContext, rule, fixedArrayWithNilChoiceParameter)

  expect(result).toEqual(fixedArrayWithNilChoiceParameterYAML)
})
```

- [ ] **Step 4: Run choice parameter tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/сhoiceParameters -t "fixedArrayWithNil"
```

Expected: PASS.

- [ ] **Step 5: Commit choice parameter fixture**

Run:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters packages/core/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data.ts
git commit -m "test: :white_check_mark: покрыть nil в ChoiceParameters"
```

## Task 4: Graph Extraction Skip

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts`

- [ ] **Step 1: Add graph regression test**

In `graphFromModel.test.ts`, add a test that passes a FixedArray with `undefined` between two refs and expects only two references:

```ts
it("skips undefined FixedArray items while building graph references", () => {
  const result = buildMetadataValueGraph({
    model: {
      type: "fixedArray",
      value: [
        { type: "ref", value: "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
        undefined,
        { type: "ref", value: "Enum.ХозяйственныеОперации.EmptyRef" },
      ],
    },
    propRule: { type: "MetadataValue", yaml: "Значение" },
  } as Parameters<typeof buildMetadataValueGraph>[0])

  expect(result?.flatMap((section) => section.references)).toHaveLength(2)
})
```

- [ ] **Step 2: Run graph test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/graphFromModel.test.ts -t "undefined FixedArray"
```

Expected: FAIL because `extractSingleValueRef` receives `undefined`.

- [ ] **Step 3: Skip undefined items**

In `graphFromModel.ts`, change the FixedArray loop:

```ts
items.forEach((item, index) => {
  if (item === undefined) return
  const position =
    yamlSeq && lineCounter ? computeSeqItemPosition(yamlSeq, index, lineCounter) : undefined
  const extracted = extractSingleValueRef(item, position)
  if (!extracted) return
  const { ref, kind, yaml } = extracted
  let bucket = refsByKind.get(kind)
  if (!bucket) {
    bucket = { yaml, refs: [] }
    refsByKind.set(kind, bucket)
  }
  bucket.refs.push(ref)
})
```

- [ ] **Step 4: Run graph test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue/graphFromModel.test.ts -t "undefined FixedArray"
```

Expected: PASS.

- [ ] **Step 5: Commit graph fix**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts
git commit -m "fix: :bug: пропустить nil FixedArray в графе"
```

## Task 5: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Generate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataValue metadata/commonObjects/сhoiceParameters
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.
