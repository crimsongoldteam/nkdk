# Form Elements Page And SearchStringAddition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `Page.ChildItemsWidth` and `SearchStringAddition` width limit properties through XML and YAML round-trips.

**Architecture:** Keep the changes declarative in existing `rules.ts` files. Update the centralized form-elements fixtures so XML, YAML, model, and enterprise expectations stay synchronized.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, centralized `packages/core/metadata/forms/elements/__tests__` fixture runner.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/page/rules.ts`: add XML mapping for existing `slaveItemsWidth`.
- Modify `packages/core/metadata/forms/elements/page/__fixtures__/full.xml`: add `ChildItemsWidth`.
- Modify `packages/core/metadata/forms/elements/page/__fixtures__/data.ts`: add model, YAML, and enterprise expectations for `slaveItemsWidth`.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`: add `autoMaxWidth` and `maxWidth`.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/types.ts`: add YAML fields for the two new properties.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml`: add XML nodes for the two new properties.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml`: add the same XML nodes for single-element coverage.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`: add model and YAML expectations for the two new properties.

## Task 1: Page ChildItemsWidth

**Files:**
- Modify: `packages/core/metadata/forms/elements/page/rules.ts`
- Modify: `packages/core/metadata/forms/elements/page/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/page/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Write the failing fixture expectation**

In `packages/core/metadata/forms/elements/page/__fixtures__/full.xml`, add `ChildItemsWidth` near the other child layout properties, after `HorizontalAlign` and before `VerticalAlign`:

```xml
	<HorizontalAlign>Right</HorizontalAlign>
	<ChildItemsWidth>LeftNarrowest</ChildItemsWidth>
	<VerticalAlign>Bottom</VerticalAlign>
```

In `packages/core/metadata/forms/elements/page/__fixtures__/data.ts`, change `fullPage` so `slaveItemsWidth` is no longer omitted from the required model type:

```ts
export const fullPage: RequiredFieldsElement<
  Omit<Page, "showTitle" | "childItemsVerticalAlign" | "verticalScrollOnReduceSize">
> = {
```

Then add the model field near the other child layout fields:

```ts
  childItemsHorizontalAlign: "Right",
  slaveItemsWidth: "LeftNarrowest",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
```

Add the YAML expectation to `fullPagePartialYAML` near `ГоризонтальноеПоложениеПодчиненных`:

```ts
  ГоризонтальноеПоложениеПодчиненных: "Право",
  ШиринаПодчиненныхЭлементов: "ЛевыйОченьУзкий",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
```

Update `fullPageEnterprise` so `SlaveItemsWidth` is no longer omitted:

```ts
} satisfies Required<
  Omit<PageEnterprise, "ChildItemsVerticalAlign" | "ShowTitle" | "VerticalScrollOnReduceSize">
>
```

Add the enterprise expectation near `ChildItemsHorizontalAlign`:

```ts
  ChildItemsHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Right",
  },
  SlaveItemsWidth: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsWidth.LeftNarrowest",
  },
```

- [ ] **Step 2: Run the narrow tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected before implementation:

- `Page > all fields` fails in `fromXML.test.ts` because imported model lacks `slaveItemsWidth`.
- `Page > all fields` fails in `toXML.test.ts` because exported XML lacks `ChildItemsWidth`.
- YAML tests may fail because `PageRules.slaveItemsWidth` already has YAML mapping but the XML rule is still missing; if YAML passes, continue.

- [ ] **Step 3: Implement the rule mapping**

In `packages/core/metadata/forms/elements/page/rules.ts`, add `xml: "ChildItemsWidth"` to `slaveItemsWidth`:

```ts
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
    },
```

- [ ] **Step 4: Run the narrow tests and verify Page passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected:

- `Page > all fields` passes in XML and YAML tests.
- Existing failures, if any, should only relate to `SearchStringAddition` after Task 2 fixture changes.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/elements/page/rules.ts packages/core/metadata/forms/elements/page/__fixtures__/full.xml packages/core/metadata/forms/elements/page/__fixtures__/data.ts
git commit -m "fix: :bug: сохранить ширину подчинённых Page"
```

## Task 2: SearchStringAddition AutoMaxWidth And MaxWidth

**Files:**
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/types.ts`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Write the failing fixture expectation**

In both XML fixtures:

- `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml`
- `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml`

add `AutoMaxWidth` and `MaxWidth`. Put them before `Width` so the size-related fields stay grouped:

```xml
	<Visible>true</Visible>
	<AutoMaxWidth>false</AutoMaxWidth>
	<MaxWidth>20</MaxWidth>
	<Width>300</Width>
```

In `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`, add the fields to `fullSingleSearchStringAddition` near `width`:

```ts
  visible: true,
  autoMaxWidth: false,
  maxWidth: 20,
  width: 300,
```

Add the YAML expectation to `fullSingleSearchStringAdditionYAML` near the width fields:

```ts
  РастягиватьПоГоризонтали: "Истина",
  АвтоМаксимальнаяШирина: "Ложь",
  МаксимальнаяШирина: 20,
  ЦветРамки: "Черный",
```

- [ ] **Step 2: Run the narrow tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected before implementation:

- `SearchStringAddition > all fields` fails in `fromXML.test.ts` because imported model lacks `autoMaxWidth` and `maxWidth`.
- `SearchStringAddition > all fields` fails in `toXML.test.ts` because exported XML lacks `AutoMaxWidth` and `MaxWidth`.
- YAML tests fail or TypeScript reports missing YAML fields until `types.ts` and `rules.ts` are updated.

- [ ] **Step 3: Implement the rule properties**

In `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`, add the two properties to local `commonProperties`. Place `autoMaxWidth` near `horizontalStretch`, and `maxWidth` near `width`:

```ts
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
  width: { yaml: "Ширина", type: "number" },
```

- [ ] **Step 4: Update the manual YAML interfaces**

In `packages/core/metadata/forms/elements/searchStringAddition/types.ts`, add the two optional YAML fields to `SearchStringAdditionYAML`:

```ts
  РастягиватьПоГоризонтали?: StringboolYAML
  АвтоМаксимальнаяШирина?: StringboolYAML
  МаксимальнаяШирина?: number
  ЦветРамки?: ColorYAML
```

`SingleSearchStringAdditionYAML` extends this interface, so no separate field list is needed there.

- [ ] **Step 5: Run the narrow tests and verify SearchStringAddition passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected:

- `SearchStringAddition > all fields` passes in XML and YAML tests.
- The four test files pass completely.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/forms/elements/searchStringAddition/rules.ts packages/core/metadata/forms/elements/searchStringAddition/types.ts packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts
git commit -m "fix: :bug: сохранить размеры SearchStringAddition"
```

## Task 3: Final Verification

**Files:**
- Verify: `packages/core/metadata/forms/elements/page/rules.ts`
- Verify: `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
- Verify: `packages/core/metadata/forms/elements/page/__fixtures__/data.ts`
- Verify: `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`

- [ ] **Step 1: Regenerate Langium files if needed**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected:

```text
Langium generator finished successfully
```

- [ ] **Step 2: Run the focused form-elements tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts
```

Expected:

```text
Test Files  5 passed
```

- [ ] **Step 3: Run the full project test suite**

Run from repo root:

```bash
pnpm test
```

Expected:

```text
0 failures
```

- [ ] **Step 4: Commit any verification-only fixture adjustments**

If Step 2 or Step 3 required fixture order adjustments only, commit them:

```bash
git add packages/core/metadata/forms/elements/page/__fixtures__/full.xml packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/full.xml packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/fullSingle.xml
git commit -m "test: :white_check_mark: уточнить фикстуры элементов формы"
```

If there are no changes after verification, skip this commit.

## Self-Review

- Spec coverage: Task 1 covers `Page.ChildItemsWidth`; Task 2 covers `SearchStringAddition` XML, YAML, and model fields; Task 3 covers focused and full verification.
- Placeholder scan: no unresolved implementation notes or incomplete sections.
- Type consistency: `slaveItemsWidth`, `autoMaxWidth`, `maxWidth`, `ШиринаПодчиненныхЭлементов`, `АвтоМаксимальнаяШирина`, and `МаксимальнаяШирина` match the existing naming style and rule conventions.
