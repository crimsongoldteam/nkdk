# MetadataAttribute Empty Synonym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `<Synonym/>` for `MetadataAttribute` when the synonym is explicitly empty in XML.

**Architecture:** Add an opt-in XML behavior to `I8nTextPropertyRule` instead of changing all `I8nText` fields globally. `I8nText.toXML` will collapse empty values only when the new option is enabled, and `MetadataAttribute.synonym` will be the first rule to opt in.

**Tech Stack:** TypeScript, Vitest, existing metadata `rules.ts`, `testImportPropertyFromXML`, `testExportPropertyToXML`.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/i8nText/types.ts`
  - Add the opt-in rule flag `emptyAsRawXML?: true`.
- Modify `packages/core/metadata/commonObjects/i8nText/fromXML.ts`
  - Import an explicit empty XML node as `{ items: {} }` only when `emptyAsRawXML` is enabled.
- Modify `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`
  - Add coverage for opt-in empty XML import.
- Modify `packages/core/metadata/commonObjects/i8nText/toXML.ts`
  - If `emptyAsRawXML` is enabled and `isEmptyI8nText(context, data)` is true, return `{}` so the surrounding XML exporter writes an empty tag.
- Modify `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
  - Add tests that prove the new flag collapses empty text and default behavior remains unchanged.
- Modify `packages/core/metadata/orchestration/property/fromXML.ts`
  - Apply `defaultValueXMLEmpty` before invoking the type importer, so explicit empty XML nodes are not overwritten by normal `defaultValue`.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
  - Add `defaultValueXMLEmpty: { items: {} }` and `emptyAsRawXML: true` to `synonym`.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts`
  - Add import coverage for `<Synonym/>`.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`
  - Add export coverage for `synonym: { items: {} }` and keep non-empty synonym behavior covered by existing round-trip fixtures.

No existing XML fixtures should be changed.

### Task 1: Add Failing I8nText Export Tests

**Files:**

- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`

- [ ] **Step 1: Add focused tests for the new option and the default behavior**

In `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`, add these tests inside `describe("exportI8nTextToXML", () => { ... })`, after the existing fixture loop and before `describe("exportI8nTextToXMLWithDefaultLanguage", ...)`:

```ts
it("exports empty default-language item by default", () => {
  const result = exportI8nTextToXML(mockContext, mockRule, { items: { ru: "" } })
  const xml = result ? xmlExport({ Title: result }, false) : undefined

  expect(xml).toEqual(
    "<Title>\n" +
      "\t<v8:item>\n" +
      "\t\t<v8:lang>ru</v8:lang>\n" +
      "\t\t<v8:content/>\n" +
      "\t</v8:item>\n" +
      "</Title>"
  )
})

it("exports empty text as raw XML when rule opts in", () => {
  const result = exportI8nTextToXML(mockContext, { ...mockRule, emptyAsRawXML: true }, { items: { ru: "" } })
  const xml = result ? xmlExport({ Title: result }, false) : undefined

  expect(xml).toEqual("<Title/>")
})
```

- [ ] **Step 2: Run the focused test and verify only the opt-in test fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/i8nText/toXML.test.ts
```

Expected:

- The default-behavior test passes.
- The opt-in test fails because `emptyAsRawXML` does not exist yet and the XML still contains `v8:item`.

### Task 2: Implement the I8nText Opt-in Flag

**Files:**

- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.ts`
- Test: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`

- [ ] **Step 1: Add the flag to the rule type**

In `packages/core/metadata/commonObjects/i8nText/types.ts`, change this block:

```ts
  yamlPartialOthers?: true
  skipEmptyToXML?: true
```

to:

```ts
  yamlPartialOthers?: true
  skipEmptyToXML?: true
  /** Выгружать полностью пустой I8nText как пустой XML-тег. */
  emptyAsRawXML?: true
```

- [ ] **Step 2: Implement opt-in empty export**

In `packages/core/metadata/commonObjects/i8nText/toXML.ts`, change:

```ts
if (narrowRule.skipEmptyToXML && isEmptyI8nText(context, data)) {
  return undefined
}
```

to:

```ts
if (isEmptyI8nText(context, data)) {
  if (narrowRule.skipEmptyToXML) {
    return undefined
  }
  if (narrowRule.emptyAsRawXML) {
    return {}
  }
}
```

Do not change `exportI8nTextToXMLWithDefaultLanguage`.

- [ ] **Step 3: Add opt-in import coverage**

In `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`, add:

```ts
it("imports empty XML tag as empty text when rule opts in", () => {
  const result = importI8nTextFromXML(mockContextFromXML(), { ...mockRule, emptyAsRawXML: true }, {})

  expect(result).toEqual({ items: {} })
})
```

- [ ] **Step 4: Implement opt-in empty import**

In `packages/core/metadata/commonObjects/i8nText/fromXML.ts`, cast `_rule` to `I8nTextPropertyRule` and return `{ items: {} }` for an object without `v8:item` only when `emptyAsRawXML` is enabled.

The relevant branch should be:

```ts
const narrowRule = _rule as I8nTextPropertyRule

if (xml === "") return narrowRule.emptyAsRawXML ? { items: {} } : undefined
if (!xml) return undefined

if (!xml["v8:item"]) return narrowRule.emptyAsRawXML ? { items: {} } : undefined
```

- [ ] **Step 5: Run the focused I8nText test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/i8nText/fromXML.test.ts metadata/commonObjects/i8nText/toXML.test.ts
```

Expected:

- All `i8nText/toXML.test.ts` tests pass.
- All `i8nText/fromXML.test.ts` tests pass.
- The opt-in test writes `<Title/>`.
- The default-behavior test still writes a `v8:item`.

### Task 3: Add Failing MetadataAttribute Synonym Tests

**Files:**

- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`

- [ ] **Step 1: Add import coverage for explicit empty Synonym**

In `packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts`, inside `describe("import MetadataAttributes from XML", () => { ... })`, add this test before `it("should return undefined when data is undefined", ...)`:

```ts
it("imports explicit empty Synonym as empty i18n text", () => {
  const result = testImportPropertyFromXML({
    rule,
    xmlRootTag: "Attribute",
    xmlString:
      '<Attribute uuid="39425133-94f9-40f6-a821-f6cd6b64fde1">' +
      "<Properties>" +
      "<Name>ПравилаОтправкиДокументов</Name>" +
      "<Synonym/>" +
      "<Comment/>" +
      "<Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>0</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type>" +
      "</Properties>" +
      "</Attribute>",
  })

  expect(result).toEqual([
    {
      itemType: "MetadataAttribute",
      name: "ПравилаОтправкиДокументов",
      synonym: { items: {} },
      type: { type: ["string"], stringQualifiers: { length: 0, allowedLength: "Variable" } },
      fillValue: { type: "string", value: "" },
    },
  ])
})
```

- [ ] **Step 2: Add export coverage for empty Synonym**

In `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`, inside `describe("export MetadataAttributes to XML", () => { ... })`, add this test before `it("should export empty string when data is undefined", ...)`:

```ts
it("exports explicit empty Synonym as empty XML tag", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: [
      {
        itemType: "MetadataAttribute",
        name: "ПравилаОтправкиДокументов",
        synonym: { items: {} },
        type: { type: ["string"], stringQualifiers: { length: 0, allowedLength: "Variable" } },
        fillValue: { type: "string", value: "" },
      },
    ],
    xmlRootTag: "Attribute",
    referenceMetadata: undefined,
  })

  expect(result).toContain("<Synonym/>")
  expect(result).not.toContain("<v8:item>")
})
```

- [ ] **Step 3: Run metadataAttribute XML tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataAttribute/fromXML.test.ts metadata/commonObjects/metadataAttribute/toXML.test.ts
```

Expected:

- The import test fails because `<Synonym/>` still imports as the old default `{ items: { ru: "" } }`.
- The export test fails because empty synonym still writes `v8:item` or because the rule has not opted into empty raw XML yet.

### Task 4: Enable the Behavior for MetadataAttribute.synonym

**Files:**

- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXML.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`

- [ ] **Step 1: Add empty XML defaults and opt-in flag to the synonym rule**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, change the `synonym` rule from:

```ts
    xmlParents: ["Properties"],
    order: 2,
    defaultValueXMLRaw: "",
```

to:

```ts
    xmlParents: ["Properties"],
    order: 2,
    defaultValueXMLEmpty: { items: {} },
    defaultValueXMLRaw: "",
    emptyAsRawXML: true,
```

Do not change the existing `defaultValue` function.

- [ ] **Step 2: Apply defaultValueXMLEmpty before normal defaultValue**

In `packages/core/metadata/orchestration/property/fromXML.ts`, ensure `defaultValueXMLEmpty` is applied before `importPropertyFromXML`, because `importPropertyFromXML` applies normal `defaultValue` when a type importer returns `undefined`.

The value block should follow this shape:

```ts
let value
if (xmlValue === undefined && "defaultValueXMLEmpty" in currentRule && isXMLKeyPresent(key, xml, currentRule)) {
  value = (currentRule as any).defaultValueXMLEmpty
} else {
  value =
    shouldImportForReference || currentRule.fromXML !== false
      ? importPropertyFromXML({
          context,
          rule: currentRule,
          value: xmlValue,
          name: key,
          ownerXmlName,
        })
      : undefined
}
```

- [ ] **Step 3: Run metadataAttribute XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataAttribute/fromXML.test.ts metadata/commonObjects/metadataAttribute/toXML.test.ts
```

Expected:

- All metadataAttribute fromXML/toXML tests pass.
- The new import test returns `synonym: { items: {} }`.
- The new export test writes `<Synonym/>` and no `v8:item`.

- [ ] **Step 4: Run I8nText tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/i8nText/fromXML.test.ts metadata/commonObjects/i8nText/toXML.test.ts
```

Expected:

- All tests pass.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/i8nText/types.ts packages/core/metadata/commonObjects/i8nText/fromXML.ts packages/core/metadata/commonObjects/i8nText/fromXML.test.ts packages/core/metadata/commonObjects/i8nText/toXML.ts packages/core/metadata/commonObjects/i8nText/toXML.test.ts packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/commonObjects/metadataAttribute/fromXML.test.ts packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts packages/core/metadata/orchestration/property/fromXML.ts
git commit -m "fix: :bug: сохранить пустой Synonym реквизита"
```

### Task 5: Wider Verification

**Files:**

- Test: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/*.test.ts`
- Test: project root test suite

- [ ] **Step 1: Run focused I8nText and metadataAttribute tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/i8nText/fromXML.test.ts metadata/commonObjects/i8nText/toXML.test.ts metadata/commonObjects/metadataAttribute/fromXML.test.ts metadata/commonObjects/metadataAttribute/toXML.test.ts
```

Expected:

- All selected test files pass.

- [ ] **Step 2: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected:

- All workspace package tests pass.
- `git status --short` remains empty after removing any test-generated output directories if they appear.

### Task 6: Optional Round-trip Confirmation

**Files:**

- No source files.
- External XML source: `/Users/nikita/git/round-trip-source/acc`.

- [ ] **Step 1: Run triage after implementation**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected:

- The first four `ExchangePlans/*/Attribute/Synonym` diffs no longer appear.
- If the script now stops at the already-handled form event diff or a later diff, capture that output for the next analysis step.

- [ ] **Step 2: If the Synonym diff remains, inspect one active XML file**

Run:

```bash
rg -n "<Name>ПравилаОтправкиДокументов</Name>|<Synonym" /Users/nikita/git/round-trip-source/acc/ExchangePlans/СинхронизацияДанныхЧерезУниверсальныйФормат.xml
```

Expected:

- The source keeps `<Synonym/>`.
- If round-trip output still expands it to `v8:item`, stop and inspect whether the exported node uses `MetadataAttributeRules.properties.synonym` or another attribute-like rule.
