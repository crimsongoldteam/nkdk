# ViewStatusAddition Singleton Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split ordinary `ViewStatusAddition` from generated `SingleViewStatusAddition` so XML identity and source are preserved.

**Architecture:** Mirror the existing `SearchStringAddition` and `SearchControlAddition` pattern. The ordinary element has `name` and YAML `Источник`; the single variant derives name and source from `Table` or `PDFDocumentField`.

**Tech Stack:** TypeScript, Vitest, form element orchestration.

---

### Task 1: Add Failing Non-Canonical Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/nonCanonical.xml`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Add XML fixture**

Create:

```xml
<ViewStatusAddition name="ТаблицаЭПСостояниеПросмотра" id="10">
	<AdditionSource>
		<Item>Подписи</Item>
		<Type>ViewStatusRepresentation</Type>
	</AdditionSource>
	<ContextMenu name="ТаблицаЭПСостояниеПросмотраКонтекстноеМеню" id="11"/>
	<ExtendedTooltip name="ТаблицаЭПСостояниеПросмотраРасширеннаяПодсказка" id="12"/>
</ViewStatusAddition>
```

- [ ] **Step 2: Add ordinary model**

Add:

```ts
export const nonCanonicalViewStatusAddition = {
  itemType: "ViewStatusAddition",
  name: "ТаблицаЭПСостояниеПросмотра",
  additionSource: "Подписи",
  contextMenu: { itemType: "ContextMenu", childItems: [] },
  extendedTooltip: { itemType: "ExtendedTooltip" },
} satisfies ViewStatusAddition
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "ViewStatusAddition"`

Expected: FAIL because current rule treats all view status additions as single elements.

### Task 2: Introduce SingleViewStatusAddition

**Files:**
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/types.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pdfDocumentField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/graphFromModel.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/types.ts`

- [ ] **Step 1: Split rules**

Create `SingleViewStatusAdditionRules`:

```ts
export const SingleViewStatusAdditionRules = {
  itemType: "SingleViewStatusAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "ViewStatusRepresentation",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  },
} as const satisfies ElementRule
```

- [ ] **Step 2: Make ordinary rule explicit**

Add to `ViewStatusAdditionRules`:

```ts
name: { type: "string", xml: "_name", required: true },
additionSource: {
  yaml: "Источник",
  type: "TableAdditionalSource",
  additionalSourceType: "ViewStatusRepresentation",
},
```

- [ ] **Step 3: Update table and PDF properties**

Use:

```ts
type: "SingleViewStatusAddition",
xml: "ViewStatusAddition",
```

- [ ] **Step 4: Update singleton graph handler**

Register `SingleViewStatusAddition` with `getViewStatusAdditionName`.

- [ ] **Step 5: Verify green**

Run form element XML and YAML tests filtered by `ViewStatusAddition`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/elements/viewStatusAddition packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/pdfDocumentField/rules.ts packages/core/metadata/forms/elements/graphFromModel.ts packages/core/metadata/forms/commonObjects/childItems/types.ts
git commit -m "fix: :bug: разделить single ViewStatusAddition"
```

