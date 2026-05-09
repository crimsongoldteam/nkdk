# CalculatedField Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `dcssch:appearance` inside `CalculatedField` during XML -> model -> XML and YAML conversion.

**Architecture:** Reuse the existing declarative `AppearanceFields` item instead of adding custom XML handling. `CalculatedFieldRules` owns the new `appearance` property, so `DynamicList` keeps using its existing `CalculatedFields` array without extra logic.

**Tech Stack:** TypeScript, Vitest, declarative metadata `rules.ts`, existing XML/YAML test helpers.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`
  - Add `appearance` as `type: "AppearanceFields"`, `xml: "dcssch:appearance"`, `yaml: "Оформление"`.
  - Keep XML order by placing it after `title` and shifting following `order` values.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`
  - Add `appearanceCalculatedField` and `appearanceCalculatedFieldYAML`.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/appearance.xml`
  - Minimal `CalculatedField` with `dcssch:appearance` and `ЦветТекста`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/fromXML.test.ts`
  - Add import test for `appearance.xml`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/toXML.test.ts`
  - Add export test for `appearance.xml`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAML.test.ts`
  - Add YAML import test for `Оформление`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/toYAML.test.ts`
  - Add YAML export test for `Оформление`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`
  - Add `dcssch:appearance` to the second `CalculatedField`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
  - Add matching `appearance` to `multipleCalculatedFieldsDynamicList`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`
  - Extend expected `ВычисляемыеПоля` YAML array with `Оформление`.

## Tasks

### Task 1: CalculatedField Failing Fixtures And Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/appearance.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/toYAML.test.ts`

- [ ] **Step 1: Add the CalculatedField appearance TS/YAML fixture**

Append these exports to `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`:

```ts
export const appearanceCalculatedField = {
  itemType: "CalculatedField",
  dataPath: "ОбщееСостояниеПодключения",
  expression: "",
  title: { items: { ru: "Настройки" } },
  appearance: {
    itemType: "AppearanceFields",
    ЦветТекста: {
      parameter: "ЦветТекста",
      value: { type: "Absolute", value: "#1C55AE" },
    },
  },
} as const satisfies CalculatedField

export const appearanceCalculatedFieldYAML = {
  ПутьКДанным: "ОбщееСостояниеПодключения",
  Выражение: "",
  Заголовок: "Настройки",
  Оформление: {
    ЦветТекста: "#1C55AE",
  },
} as const satisfies CalculatedFieldYAML
```

- [ ] **Step 2: Create the XML fixture**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/appearance.xml`:

```xml
<CalculatedField>
	<dcssch:dataPath>ОбщееСостояниеПодключения</dcssch:dataPath>
	<dcssch:expression/>
	<dcssch:title xsi:type="v8:LocalStringType">
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Настройки</v8:content>
		</v8:item>
	</dcssch:title>
	<dcssch:appearance>
		<dcscor:item xsi:type="dcsset:SettingsParameterValue">
			<dcscor:parameter>ЦветТекста</dcscor:parameter>
			<dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value>
		</dcscor:item>
	</dcssch:appearance>
</CalculatedField>
```

- [ ] **Step 3: Add XML import/export tests**

Update imports in `fromXML.test.ts` and `toXML.test.ts` to include `appearanceCalculatedField`, then add:

```ts
it("imports appearance.xml", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "appearance.xml",
    xmlRootTag: "CalculatedField",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(appearanceCalculatedField)
})
```

```ts
it("exports appearance.xml", () => {
  const { result, expectedResult } = testExportPropertyToXML({
    rule: { type: "CalculatedField" },
    value: appearanceCalculatedField,
    xmlRootTag: "CalculatedField",
    path: "appearance.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 4: Add YAML import/export tests**

Update imports in `fromYAML.test.ts` and `toYAML.test.ts` to include `appearanceCalculatedField` and `appearanceCalculatedFieldYAML`, then add:

```ts
it("imports appearance YAML", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "CalculatedField" },
    value: appearanceCalculatedFieldYAML,
  })

  expect(result).toEqual(appearanceCalculatedField)
})
```

```ts
it("exports appearance YAML", () => {
  const result = testExportPropertyToYAML({
    rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
    value: appearanceCalculatedField,
  })

  expect(result).toEqual({ ВычисляемоеПоле: appearanceCalculatedFieldYAML })
})
```

- [ ] **Step 5: Run focused CalculatedField tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/calculatedField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toYAML.test.ts
```

Expected: failure because `CalculatedFieldRules` does not define `appearance`, so XML/YAML imports omit `appearance` and exports omit `dcssch:appearance`.

### Task 2: CalculatedField Rule Implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`

- [ ] **Step 1: Add the declarative appearance rule**

Change `CalculatedFieldRules.properties` so the section after `title` is:

```ts
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    },
    appearance: {
      type: "AppearanceFields",
      xml: "dcssch:appearance",
      yaml: "Оформление",
      order: 4,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 5,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 6,
    },
    orderExpressions: {
      type: "CalculatedFieldOrderExpression",
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
      order: 7,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 8,
    },
```

- [ ] **Step 2: Run focused CalculatedField tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/calculatedField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toYAML.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit the focused rule change**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField
git commit -m "fix: :bug: сохранить оформление CalculatedField"
```

Expected: commit succeeds with only CalculatedField rule and fixture/test files.

### Task 3: DynamicList Regression Fixture

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`

- [ ] **Step 1: Add appearance to the second DynamicList CalculatedField XML fixture**

In `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`, add this block after the second `dcssch:title` and before `</CalculatedField>`:

```xml
		<dcssch:appearance>
			<dcscor:item xsi:type="dcsset:SettingsParameterValue">
				<dcscor:parameter>ЦветТекста</dcscor:parameter>
				<dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value>
			</dcscor:item>
		</dcssch:appearance>
```

- [ ] **Step 2: Add matching appearance to the DynamicList TS fixture**

In `multipleCalculatedFieldsDynamicList`, add `appearance` to the second calculated field:

```ts
      appearance: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
          value: { type: "Absolute", value: "#1C55AE" },
        },
      },
```

- [ ] **Step 3: Extend the DynamicList YAML expectation**

In `toYAML.test.ts`, extend the second expected item in `exports calculatedFields as YAML array`:

```ts
      {
        ПутьКДанным: "ОбщееСостояниеПодключения",
        Выражение: "",
        Заголовок: "Настройки",
        Оформление: {
          ЦветТекста: "#1C55AE",
        },
      },
```

- [ ] **Step 4: Run focused DynamicList tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: all tests pass, including `imports multiple CalculatedField nodes`, `exports multiple CalculatedField nodes`, and `exports calculatedFields as YAML array`.

- [ ] **Step 5: Commit the DynamicList regression coverage**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList
git commit -m "test: :test_tube: покрыть оформление CalculatedField в DynamicList"
```

Expected: commit succeeds with only DynamicList fixture/test changes.

### Task 4: Full Verification And Round-Trip

**Files:**
- No source files.
- Reads external XML dump from `/Users/nikita/git/round-trip-source/trade`.

- [ ] **Step 1: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: command exits with code 0 and no TypeScript errors.

- [ ] **Step 2: Run full repository tests**

Run:

```bash
pnpm test
```

Expected: graph, language, core, and cli package tests pass. In this worktree, Langium files were already generated earlier; if the command reports missing generated Langium files, run `pnpm --filter nkdk-language langium:generate` and repeat `pnpm test`.

- [ ] **Step 3: Run short round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 30
```

Expected: the previous `Catalogs/ТСПИоТ/Forms/ФормаСписка/Ext/Form.xml` diff no longer shows removal of:

```xml
<dcssch:appearance>
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>ЦветТекста</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">#1C55AE</dcscor:value>
  </dcscor:item>
</dcssch:appearance>
```

Remaining diffs, if any, should be the already known English service-name differences.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: `nakidka-core` is clean after commits. The external XML dump `/Users/nikita/git/round-trip-source` may be dirty from round-trip output and should not be cleaned unless the user asks.

## Self-Review

- Spec coverage: the plan adds `CalculatedFieldRules.appearance`, covers XML/YAML conversion, updates the DynamicList regression fixture, and verifies the real round-trip case.
- Placeholder scan: no forbidden placeholder tokens or unspecified implementation steps remain.
- Type consistency: property name is consistently `appearance`; XML tag is `dcssch:appearance`; YAML key is `Оформление`; the color fixture uses existing `AppearanceFields` shape with `Absolute`.
