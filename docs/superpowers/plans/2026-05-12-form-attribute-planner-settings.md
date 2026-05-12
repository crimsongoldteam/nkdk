# FormAttribute Planner Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `FormAttribute.Settings` with `xsi:type="pl:Planner"` through XML, TS model, and YAML round-trip.

**Architecture:** Reuse the existing `SettingsFragment` mechanism already used by `Chart` and `SpreadsheetDocument`. Add `Planner` as one more typed settings fragment, then extend `FormAttribute` dispatch so `Settings` is imported into `planner` and exported back with the canonical planner wrapper.

**Tech Stack:** TypeScript, Vitest, fast-xml-parser project XML helpers, existing metadata orchestration rules.

---

## File Structure

- Create `packages/core/metadata/forms/commonObjects/planner/types.ts`: registers the `Planner` settings fragment type and exports `Planner`, `PlannerXML`, `PlannerYAML`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`: adds `PlannerXML`, `PlannerYAML`, `planner` YAML key, and allows `Settings?: PlannerXML`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`: dispatches `pl:Planner` on import/export using `importPropertyFromXML` and `exportPropertyToXML`.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.xml`: focused XML fixture with one planner attribute.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.ts`: expected model for the XML fixture.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`: adds focused XML import test.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`: adds focused XML export test.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`: adds focused YAML import test.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`: adds focused YAML export test.

## Task 1: XML Import Test And Planner Type

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Create: `packages/core/metadata/forms/commonObjects/planner/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`

- [ ] **Step 1: Write the failing XML fixture**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.xml`:

```xml
<Attribute name="Канбан" id="1">
	<Type>
		<v8:Type xmlns:pl="http://v8.1c.ru/8.3/data/planner">pl:Planner</v8:Type>
	</Type>
	<Settings xmlns:pl="http://v8.1c.ru/8.3/data/planner" xsi:type="pl:Planner">
		<pl:itemsCurId>1</pl:itemsCurId>
		<pl:periodsCurId>2</pl:periodsCurId>
		<pl:resourcesCurId>3</pl:resourcesCurId>
	</Settings>
</Attribute>
```

- [ ] **Step 2: Write the expected TS fixture**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.ts`:

```ts
import type { FormAttributes } from "../types"

export const plannerSettings = [
  {
    itemType: "FormAttribute",
    name: "Канбан",
    type: { type: ["Planner"] },
    columns: [],
    planner: {
      "pl:itemsCurId": "1",
      "pl:periodsCurId": "2",
      "pl:resourcesCurId": "3",
    },
  },
] satisfies FormAttributes
```

- [ ] **Step 3: Add the failing import test**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`, add the import:

```ts
import { plannerSettings } from "./__fixtures__/plannerSettings"
```

Add the test near `chartSettings` and `spreadsheetDocumentSettings`:

```ts
  it("import plannerSettings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "plannerSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(plannerSettings)
  })
```

- [ ] **Step 4: Run the XML import test and confirm the failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts -t "import plannerSettings"
```

Expected: FAIL because `planner` is not imported; current code returns no typed planner settings.

- [ ] **Step 5: Add the Planner settings fragment type**

Create `packages/core/metadata/forms/commonObjects/planner/types.ts`:

```ts
import { registerSettingsFragmentType } from "~/metadata/forms/commonObjects/settingsFragment/types"
import type {
  SettingsFragment,
  SettingsFragmentXML,
  SettingsFragmentYAML,
} from "~/metadata/forms/commonObjects/settingsFragment/types"

export type Planner = SettingsFragment
export type PlannerXML = SettingsFragmentXML
export type PlannerYAML = SettingsFragmentYAML

registerSettingsFragmentType<Planner>({
  propertyType: "Planner",
  canonicalAttributes: {
    "_xmlns:pl": "http://v8.1c.ru/8.3/data/planner",
    "_xsi:type": "pl:Planner",
  },
  matchXsiType: (xsiType) => xsiType === "pl:Planner" || xsiType.endsWith(":Planner"),
})
```

- [ ] **Step 6: Extend FormAttribute types**

In `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`, add the import:

```ts
import { PlannerXML, PlannerYAML } from "~/metadata/forms/commonObjects/planner/types"
```

Update the `Settings` union:

```ts
  Settings?: SettingsTypeDescriptionXML | DynamicListXML | ChartXML | SpreadsheetDocumentXML | PlannerXML
```

Add the YAML key:

```ts
  Планировщик?: PlannerYAML
```

- [ ] **Step 7: Extend typed settings dispatch**

In `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`, add the rule:

```ts
const plannerSettingsRule = {
  type: "Planner",
  xml: "Settings",
  yaml: "Планировщик",
} as const satisfies PropertyRule
```

Update the typed settings pick:

```ts
type TypedFormAttributeSettings = Pick<FormAttribute, "chart" | "spreadsheetDocument" | "planner">
```

Add the import branch after `SpreadsheetDocument`:

```ts
  if (xsiType === "pl:Planner" || xsiType?.endsWith(":Planner")) {
    const planner = importPropertyFromXML({
      context,
      rule: plannerSettingsRule,
      value: settings,
      name: "planner",
    }) as FormAttribute["planner"] | undefined

    return planner === undefined ? {} : { planner }
  }
```

Add the export branch after `spreadsheetDocument`:

```ts
  const planner = exportPropertyToXML({
    context,
    rule: plannerSettingsRule,
    value: data.planner,
  }) as FormAttributeXML["Settings"] | undefined

  if (planner !== undefined) return planner
```

- [ ] **Step 8: Run the XML import test and confirm it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts -t "import plannerSettings"
```

Expected: PASS.

- [ ] **Step 9: Commit the XML import slice**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/types.ts packages/core/metadata/forms/commonObjects/formAttribute/settings.ts packages/core/metadata/forms/commonObjects/planner/types.ts
git commit -m "feat: :sparkles: добавить импорт Planner Settings формы"
```

## Task 2: XML Export Test

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add the export test**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`, add:

```ts
import { plannerSettings } from "./__fixtures__/plannerSettings"
```

Add the test near `export chartSettings`:

```ts
  it("export plannerSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: plannerSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "plannerSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 2: Run the XML export test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "export plannerSettings"
```

Expected: PASS. If it fails with a `v8:TypeDescription` settings node, check that `exportTypedFormAttributeSettingsToXML` receives `data.planner` and returns before the fallback settings logic.

- [ ] **Step 3: Commit the XML export slice**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
git commit -m "test: :white_check_mark: покрыть экспорт Planner Settings формы"
```

## Task 3: YAML Tests

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`

- [ ] **Step 1: Add YAML fixture constants to fromYAML test**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`, add:

```ts
import { plannerSettings } from "./__fixtures__/plannerSettings"
```

Add this constant near the existing settings YAML constants:

```ts
const plannerSettingsYAML = {
  Канбан: {
    Тип: "Планировщик",
    Планировщик: `<pl:itemsCurId>1</pl:itemsCurId>
<pl:periodsCurId>2</pl:periodsCurId>
<pl:resourcesCurId>3</pl:resourcesCurId>`,
  },
}
```

Add the test:

```ts
  it("should import plannerSettings", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, plannerSettingsYAML)

    expect(result).toEqual(plannerSettings)
  })
```

- [ ] **Step 2: Run the YAML import test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts -t "plannerSettings"
```

Expected: PASS.

- [ ] **Step 3: Add YAML fixture constants to toYAML test**

In `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`, add:

```ts
import { plannerSettings } from "./__fixtures__/plannerSettings"
```

Add the same constant:

```ts
const plannerSettingsYAML = {
  Канбан: {
    Тип: "Планировщик",
    Планировщик: `<pl:itemsCurId>1</pl:itemsCurId>
<pl:periodsCurId>2</pl:periodsCurId>
<pl:resourcesCurId>3</pl:resourcesCurId>`,
  },
}
```

Add the test:

```ts
  it("should export plannerSettings", () => {
    const result = exportFormAttributesToYAML(context, mockRule, plannerSettings)

    expect(result).toEqual(plannerSettingsYAML)
  })
```

- [ ] **Step 4: Run the YAML export test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts -t "plannerSettings"
```

Expected: PASS.

- [ ] **Step 5: Commit the YAML slice**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts
git commit -m "test: :white_check_mark: покрыть YAML Planner Settings формы"
```

## Task 4: Verification

**Files:**
- No file changes.

- [ ] **Step 1: Run focused FormAttribute tests**

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts
```

Expected: all selected tests PASS.

- [ ] **Step 2: Run the full test suite**

In this worktree, run Langium generation first if it has not already been run after creating the worktree:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all package test suites PASS.

