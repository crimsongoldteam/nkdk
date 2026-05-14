# Round-Trip XML Next 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the accepted short round-trip XML differences for `UserVisible`, DCS `attributeUseRestriction`, and empty form `ExtendedPresentation`.

**Architecture:** Keep fixes local to existing metadata rules and type handlers. Do not introduce new shared abstractions: `UserVisible` keeps a canonical platform reference string, `attributeUseRestriction` reuses `CalculatedFieldUseRestriction`, and form `ExtendedPresentation` uses existing empty XML defaults.

**Tech Stack:** TypeScript, Vitest, pnpm, existing `packages/core/metadata` orchestration rules.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/userVisible/fromXML.ts`: preserve `xr:Value` `_name` exactly.
- Modify `packages/core/metadata/commonObjects/userVisible/toXML.ts`: export `_name` exactly from `item.name`.
- Modify `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`: preserve YAML keys exactly.
- Modify `packages/core/metadata/commonObjects/userVisible/toYAML.ts`: existing output already uses `item.name`; keep it and add coverage.
- Modify `packages/core/tests/fixtures/userVisible/withMultipleValues.ts`: update model fixture names to match XML canonical names.
- Modify `packages/core/tests/fixtures/userVisible/withSingleValue.ts`: update model fixture name to match XML canonical name.
- Modify `packages/core/metadata/commonObjects/userVisible/fromXML.test.ts`: add UUID preservation coverage.
- Modify `packages/core/metadata/commonObjects/userVisible/toXML.test.ts`: add UUID preservation coverage.
- Modify `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`: expect `Role.*` keys to remain `Role.*`.
- Modify `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`: cover canonical `Role.*` keys and UUID keys.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`: change `attributeUseRestriction` type.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`: add inline XML round-trip for `attributeUseRestriction`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts`: add YAML import coverage for `attributeUseRestriction`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts`: add YAML export coverage for `attributeUseRestriction`.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`: add empty XML defaults for `extendedPresentation`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`: verify empty metadata `ExtendedPresentation` imports as empty `I8nText`.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`: verify reference-only empty `ExtendedPresentation` is preserved and absent references still omit it.

Before editing `packages/core/metadata/**`, read these project rules in the implementation session:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,220p' .agents/knowledge/metadata/metadata-item-implementation.md
sed -n '1,220p' .agents/knowledge/metadata/registries.md
```

## Task 1: Preserve UserVisible Reference Names

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`
- Modify: `packages/core/tests/fixtures/userVisible/withMultipleValues.ts`
- Modify: `packages/core/tests/fixtures/userVisible/withSingleValue.ts`
- Test: `packages/core/metadata/commonObjects/userVisible/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/userVisible/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`

- [ ] **Step 1: Update UserVisible model fixtures to canonical XML names**

In `packages/core/tests/fixtures/userVisible/withMultipleValues.ts`, replace the exported object with:

```ts
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"

export const withMultipleValuesUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Role.Администратор",
      value: true,
    },
    {
      name: "Role.Пользователь",
      value: false,
    },
  ],
}
```

In `packages/core/tests/fixtures/userVisible/withSingleValue.ts`, replace the exported object with:

```ts
import { UserVisible } from "~/metadata/commonObjects/userVisible/types"

export const withSingleValueUserVisible: UserVisible = {
  common: true,
  values: [
    {
      name: "Role.Менеджер",
      value: true,
    },
  ],
}
```

- [ ] **Step 2: Add a failing XML import test for mixed Role and UUID names**

Append this test to `describe("importUserVisibleFromXML", ...)` in `packages/core/metadata/commonObjects/userVisible/fromXML.test.ts`:

```ts
  it("preserves Role-prefixed names and UUID names exactly", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Common": "false",
      "xr:Value": [
        { _name: "Role.ПолныеПрава", "#text": "true" },
        { _name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", "#text": "true" },
      ],
    })

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    })
  })
```

- [ ] **Step 3: Add a failing XML export test for mixed Role and UUID names**

Append this test to `describe("exportUserVisibleToXML", ...)` in `packages/core/metadata/commonObjects/userVisible/toXML.test.ts`:

```ts
  it("exports Role-prefixed names and UUID names exactly", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    }

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(`<UserVisible>
	<xr:Common>false</xr:Common>
	<xr:Value name="Role.ПолныеПрава">true</xr:Value>
	<xr:Value name="b1d9c8b4-d05c-45c7-8db2-abc84e597700">true</xr:Value>
</UserVisible>`)
  })
```

- [ ] **Step 4: Update YAML import tests to preserve technical keys**

In `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`, change both expected arrays from:

```ts
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
```

to:

```ts
      values: [
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
```

Then append this UUID test:

```ts
  it("preserves UUID YAML keys", () => {
    const mock = {
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Истина" as const,
    }

    const result = importUserVisibleFromYAMLDeprecated(mockContext, mockRule, mock, undefined)

    expect(result).toEqual({
      common: true,
      values: [{ name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }],
    })
  })
```

- [ ] **Step 5: Update YAML export tests to use canonical keys**

In `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`, change both test input values from:

```ts
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
```

to:

```ts
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
```

Change both expected YAML maps from:

```ts
        Администратор: "Истина",
        Пользователь: "Ложь",
```

to:

```ts
        "Role.Администратор": "Истина",
        "Role.Пользователь": "Ложь",
```

Then append this UUID test:

```ts
  it("preserves UUID YAML keys", () => {
    const use: UserVisible = {
      common: true,
      values: [{ name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }],
    }

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

    expect(result).toEqual({
      РазрешитьИспользование: {
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Истина",
      },
    })
  })
```

- [ ] **Step 6: Run UserVisible tests and verify they fail for the expected reason**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible
```

Expected: tests fail because implementation strips `Role.` on import/YAML import and adds `Role.` on XML export.

- [ ] **Step 7: Implement minimal UserVisible preservation**

In `packages/core/metadata/commonObjects/userVisible/fromXML.ts`, replace:

```ts
        name: item["_name"].replace(/^Role\./, ""),
```

with:

```ts
        name: item["_name"],
```

In `packages/core/metadata/commonObjects/userVisible/toXML.ts`, replace:

```ts
      _name: `Role.${item.name}`,
```

with:

```ts
      _name: item.name,
```

In `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`, replace both occurrences of:

```ts
    const name = key.replace(/^Role\./, "")
```

with:

```ts
    const name = key
```

No change is needed in `packages/core/metadata/commonObjects/userVisible/toYAML.ts` because it already uses `values[item.name]`.

- [ ] **Step 8: Run UserVisible tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible
```

Expected: all `userVisible` tests pass.

- [ ] **Step 9: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/userVisible/fromXML.ts packages/core/metadata/commonObjects/userVisible/toXML.ts packages/core/metadata/commonObjects/userVisible/fromYAML.ts packages/core/metadata/commonObjects/userVisible/toYAML.test.ts packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts packages/core/metadata/commonObjects/userVisible/fromXML.test.ts packages/core/metadata/commonObjects/userVisible/toXML.test.ts packages/core/tests/fixtures/userVisible/withMultipleValues.ts packages/core/tests/fixtures/userVisible/withSingleValue.ts
git commit -m "fix: :bug: сохранить имена UserVisible"
```

## Task 2: Preserve DCS attributeUseRestriction

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts`

- [ ] **Step 1: Add a failing XML round-trip test for attributeUseRestriction**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`, add this constant after `xmlWithStringTitle`:

```ts
const xmlWithAttributeUseRestriction = `<Field xsi:type="dcssch:DataSetFieldField">
	<dcssch:dataPath>МЧД</dcssch:dataPath>
	<dcssch:field>МЧД</dcssch:field>
	<dcssch:attributeUseRestriction>
		<dcssch:field>true</dcssch:field>
		<dcssch:condition>true</dcssch:condition>
		<dcssch:group>true</dcssch:group>
		<dcssch:order>true</dcssch:order>
	</dcssch:attributeUseRestriction>
</Field>`
```

Append this test to `describe("import DataCompositionSchemaDataSetField from XML", ...)`:

```ts
  it("round-trips attributeUseRestriction", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithAttributeUseRestriction,
      xmlRootTag: "Field",
    })

    expect(result).toEqual({
      itemType: "DataCompositionSchemaDataSetField",
      kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
      dataPath: "МЧД",
      field: "МЧД",
      attributeUseRestriction: {
        itemType: "CalculatedFieldUseRestriction",
        field: true,
        condition: true,
        group: true,
        order: true,
      },
    })

    const exported = exportDataCompositionSchemaDataSetField(result)

    expect(exported).toEqual(xmlWithAttributeUseRestriction)
  })
```

- [ ] **Step 2: Add failing YAML import coverage**

Append this test to `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts`:

```ts
  it("imports attribute use restriction", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "МЧД",
        Поле: "МЧД",
        ОграничениеИспользованияРеквизитов: {
          Поле: "Истина",
          Условие: "Истина",
          Группировка: "Истина",
          Порядок: "Истина",
        },
      },
    })

    expect(result).toEqual({
      itemType: "DataCompositionSchemaDataSetField",
      kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
      dataPath: "МЧД",
      field: "МЧД",
      attributeUseRestriction: {
        itemType: "CalculatedFieldUseRestriction",
        field: true,
        condition: true,
        group: true,
        order: true,
      },
    })
  })
```

- [ ] **Step 3: Add failing YAML export coverage**

Append this test to `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts`:

```ts
  it("exports attribute use restriction", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: {
        itemType: "DataCompositionSchemaDataSetField",
        kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        dataPath: "МЧД",
        field: "МЧД",
        attributeUseRestriction: {
          itemType: "CalculatedFieldUseRestriction",
          field: true,
          condition: true,
          group: true,
          order: true,
        },
      },
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "МЧД",
        Поле: "МЧД",
        ОграничениеИспользованияРеквизитов: {
          Поле: "Истина",
          Условие: "Истина",
          Группировка: "Истина",
          Порядок: "Истина",
        },
      },
    })
  })
```

- [ ] **Step 4: Run DataCompositionSchemaDataSetField tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected: new tests fail because `attributeUseRestriction` is currently handled as `string`.

- [ ] **Step 5: Implement the rule change**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`, replace:

```ts
    attributeUseRestriction: {
      type: "string",
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      toXML: isField,
      order: 6,
    },
```

with:

```ts
    attributeUseRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      toXML: isField,
      order: 6,
    },
```

- [ ] **Step 6: Run DataCompositionSchemaDataSetField tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected: all `dataCompositionSchemaDataSetField` tests pass.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts
git commit -m "fix: :bug: сохранить attributeUseRestriction"
```

## Task 3: Preserve Empty Form ExtendedPresentation From Reference

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Add a failing import test for empty ExtendedPresentation**

In `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`, append this test to `describe("importClientApplicationFormFromXML", ...)`:

```ts
  it("imports explicit empty ExtendedPresentation from metadata XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    xmlMetadata.MetaDataObject.Form.Properties.ExtendedPresentation = ""

    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result.extendedPresentation).toEqual({ items: {} })
  })
```

- [ ] **Step 2: Add a failing export test for reference-only empty ExtendedPresentation**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, append this test inside `describe("exportFormMetadataToXML", ...)`:

```ts
    it("preserves empty ExtendedPresentation when it exists in reference metadata", () => {
      const minimalFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
      const minimalMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      minimalMetadataXML.MetaDataObject.Form.Properties.ExtendedPresentation = ""
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: minimalFormXML.Form,
        xmlMetadata: minimalMetadataXML.MetaDataObject,
      })

      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm,
        name: "Минимальная",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toContain("\n\t\t\t<ExtendedPresentation/>")
    })
```

- [ ] **Step 3: Add an explicit absence assertion for metadata without reference tag**

In the existing `it("should export minimal", ...)` test inside `describe("exportFormMetadataToXML", ...)`, add this assertion after `expect(result).toEqual(expectedResult)`:

```ts
      expect(result).not.toContain("<ExtendedPresentation")
```

- [ ] **Step 4: Run ClientApplicationForm tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm
```

Expected: the new empty `ExtendedPresentation` tests fail because the rule does not keep empty `I8nText` XML nodes yet.

- [ ] **Step 5: Implement empty XML defaults for form extendedPresentation**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, replace:

```ts
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      type: "I8nText",
      tag: FormRulesTags.Metadata,
      xml: "ExtendedPresentation",
      xmlParents: ["Form", "Properties"],
    },
```

with:

```ts
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      type: "I8nText",
      tag: FormRulesTags.Metadata,
      xml: "ExtendedPresentation",
      xmlParents: ["Form", "Properties"],
      defaultValueXMLEmpty: { items: {} },
      defaultValueXMLRaw: "",
    },
```

- [ ] **Step 6: Run ClientApplicationForm tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm
```

Expected: all `clientApplicationForm` tests pass.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "fix: :bug: сохранить пустой ExtendedPresentation"
```

## Task 4: Verify Integrated Round-Trip Fixes

**Files:**
- No code files changed in this task.

- [ ] **Step 1: Run focused metadata tests for all changed areas**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField metadata/forms/clientApplicationForm
```

Expected: all focused tests pass.

- [ ] **Step 2: Run full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: full project test suite passes.

- [ ] **Step 3: Run short round-trip triage again**

Run from repository root:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the previously accepted diffs are gone or replaced by the next unresolved differences. The run may still stop on unrelated `Type FillChecking not found in TypeDescriptionRules`; if it does, record the exact error and use focused tests as the verification for these three fixes.

- [ ] **Step 4: Commit verification notes only if files changed**

Run:

```bash
git status --short
```

Expected: no uncommitted code changes remain. If generated files changed unexpectedly, inspect them and do not commit unrelated output.

## Self-Review

- Spec coverage: Task 1 covers `UserVisible` XML and YAML name preservation; Task 2 covers DCS `attributeUseRestriction`; Task 3 covers empty form `ExtendedPresentation`; Task 4 covers focused and full verification.
- Placeholder scan: the plan contains no placeholder markers, no deferred implementation step, and each code-changing step includes the exact code to add or replace.
- Type consistency: property names match existing code: `extendedPresentation`, `attributeUseRestriction`, `CalculatedFieldUseRestriction`, `defaultValueXMLEmpty`, `defaultValueXMLRaw`, `UserVisibleValue.name`.
