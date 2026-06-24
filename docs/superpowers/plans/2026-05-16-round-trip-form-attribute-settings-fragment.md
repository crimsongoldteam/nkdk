# Form Attribute Settings Fragment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `GanttChart` form attribute settings and `xsi:nil` inside raw settings fragments.

**Architecture:** Add `GanttChart` as another `SettingsFragment` type, routed through `formAttribute/settings.ts`. Keep nil preservation local to settings fragments so unrelated metadata import behavior does not change.

**Tech Stack:** TypeScript, Vitest, form attribute settings fragments.

---

### Task 1: Add GanttChart Settings Fixture

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/ganttChart/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/ganttChartSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/ganttChartSettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create:

```xml
<Attribute name="ДиаграммаГанта" id="1">
	<Type>
		<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:GanttChart</v8:Type>
	</Type>
	<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:GanttChart">
		<d4p1:chart/>
	</Settings>
</Attribute>
```

- [ ] **Step 2: Add model fixture**

Expected model:

```ts
{
  itemType: "FormAttribute",
  name: "ДиаграммаГанта",
  type: { type: ["GanttChart"] },
  title: { items: { ru: "" } },
  columns: [],
  ganttChart: { "d4p1:chart": undefined },
}
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "ganttChartSettings"`

Expected: FAIL because `GanttChart` is not imported as typed settings.

### Task 2: Register GanttChart Settings Fragment

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/ganttChart/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`

- [ ] **Step 1: Add fragment type**

Use:

```ts
registerSettingsFragmentType<GanttChart>({
  propertyType: "GanttChart",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/chart",
    "_xsi:type": "d4p1:GanttChart",
  },
  matchXsiType: (xsiType) => xsiType === "d4p1:GanttChart" || xsiType.endsWith(":GanttChart"),
})
```

- [ ] **Step 2: Route in formAttribute settings**

Detect `:GanttChart` and import/export the `ganttChart` property.

- [ ] **Step 3: Verify Gantt green**

Run the same Vitest command from Task 1. Expected: PASS.

### Task 3: Preserve xsi:nil Inside SettingsFragment

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.xml`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettings.ts`

- [ ] **Step 1: Add nil XML to planner fixture**

Add:

```xml
<pl:item>
	<pl:value xsi:nil="true"/>
	<pl:text>Встреча</pl:text>
</pl:item>
```

- [ ] **Step 2: Add model marker**

Expected model branch:

```ts
"pl:value": { "_xsi:nil": true },
"pl:text": "Встреча",
```

- [ ] **Step 3: Implement nil normalization**

Inside `normalizeImportedFragment`, keep objects with `_xsi:nil` as:

```ts
{ "_xsi:nil": true }
```

Inside export expansion, emit that marker unchanged.

- [ ] **Step 4: Verify green**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "Settings"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/commonObjects
git commit -m "fix: :bug: сохранить Settings GanttChart"
```

