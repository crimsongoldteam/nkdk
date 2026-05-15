# Report Form Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve report form properties such as report result view mode, result element, drilldown data, variant presentation, user settings group, and auto-show state.

**Architecture:** Keep these fields on the report form metadata rules, not on generic form elements. Use existing form metadata import/export paths and add XML-first coverage before YAML.

**Tech Stack:** TypeScript, Vitest, metadata form rules.

---

### Task 1: Add XML Reproducer For Report Form Properties

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/report-form-properties.xml`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/report-form-properties.ts`
- Test: `packages/core/metadata/appliedObjects/metadataReport/fromXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataReport/toXML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create a report form XML fixture containing:

```xml
<ReportResult>Результат</ReportResult>
<ReportResultViewMode>Auto</ReportResultViewMode>
<ViewModeApplicationOnSetReportResult>Auto</ViewModeApplicationOnSetReportResult>
<DrillDownData>ДанныеРасшифровки</DrillDownData>
<VariantPresentation>ДанныеРасшифровки</VariantPresentation>
<UserSettingsGroup>КомпоновщикНастроекПользовательскиеНастройки</UserSettingsGroup>
<AutoShowState>true</AutoShowState>
```

- [ ] **Step 2: Add TS fixture**

The expected model should contain:

```ts
reportResult: "Результат",
reportResultViewMode: "Auto",
viewModeApplicationOnSetReportResult: "Auto",
drillDownData: "ДанныеРасшифровки",
variantPresentation: "ДанныеРасшифровки",
userSettingsGroup: "КомпоновщикНастроекПользовательскиеНастройки",
autoShowState: true,
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataReport/fromXML.test.ts metadata/appliedObjects/metadataReport/toXML.test.ts -t "report form properties"`

Expected: FAIL because fields are missing from rules.

### Task 2: Add Report Form Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/types.ts`

- [ ] **Step 1: Add properties to the report form rule**

Add these properties with the XML names shown:

```ts
reportResult: { yaml: "РезультатОтчета", xml: "ReportResult", type: "string" },
reportResultViewMode: { yaml: "РежимОтображенияРезультата", xml: "ReportResultViewMode", type: "SystemEnumeration", typeSE: "ReportResultViewMode" },
viewModeApplicationOnSetReportResult: { yaml: "ПрименениеРежимаОтображенияПриУстановкеРезультата", xml: "ViewModeApplicationOnSetReportResult", type: "SystemEnumeration", typeSE: "ReportResultViewModeApplication" },
drillDownData: { yaml: "ДанныеРасшифровки", xml: "DrillDownData", type: "string" },
variantPresentation: { yaml: "ПредставлениеВарианта", xml: "VariantPresentation", type: "string" },
userSettingsGroup: { yaml: "ГруппаПользовательскихНастроек", xml: "UserSettingsGroup", type: "string" },
autoShowState: { yaml: "АвтоОтображатьСостояние", xml: "AutoShowState", type: "boolean" },
```

- [ ] **Step 2: Add missing system enumerations**

If `ReportResultViewMode` or `ReportResultViewModeApplication` is absent from `packages/core/metadata/systemEnumerations/types.ts`, add only the values observed in XML:

```ts
export const ReportResultViewModeToYAML = { Auto: "Авто" } as const
export const ReportResultViewModeFromYAML = { Авто: "Auto" } as const
```

- [ ] **Step 3: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataReport packages/core/metadata/systemEnumerations/types.ts
git commit -m "fix: :bug: сохранить свойства формы отчета"
```

