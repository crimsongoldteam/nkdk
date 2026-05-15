# Round-trip: Report Form Properties

## Context

Short XML round-trip on `/Users/nikita/git/round-trip-source/acc` found a diff in:

- `DataProcessors/ОбщиеОбъектыРеглОтчетности/Forms/УведомлениеОбИзмененияхВФормеОтчета/Ext/Form.xml`
- active XML directory: `/Users/nikita/git/round-trip-source/acc`

The generated XML loses four root form nodes:

```diff
-<ReportFormType>Main</ReportFormType>
-<AutoShowState>Auto</AutoShowState>
-<ReportResultViewMode>Auto</ReportResultViewMode>
-<ViewModeApplicationOnSetReportResult>Auto</ViewModeApplicationOnSetReportResult>
<AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
```

`ClientApplicationFormRules` has no rules for these properties. The corresponding system enumerations already exist in `packages/core/metadata/systemEnumerations/types.ts`.

## Source Check

Local `hlp/1/FileStorage/objects` does not contain direct property pages for these four names.

Resource/XDTO files confirm these are report-form-specific form properties:

- `/Users/nikita/git/1c_res/model.xdtomngbase_root.res`
  - `ReportFormType`
  - `AutoShowState`
  - `ReportResultViewMode`
  - `ViewModeApplicationOnSetReportResult`
- `/Users/nikita/git/1c_res/model.xdtoconfig_root.res`
  - lower-case mobile/config counterparts:
    `reportFormType`, `reportResultViewMode`, `viewModeApplicationOnSetReportResult`
- `/Users/nikita/git/1c_res/logform.xsdmngcore_root.res`
  - `ReportFormType` simple type
- `/Users/nikita/git/1c_res/enums.xsdenums_root.res`
  - `AutoShowStateMode`
  - `ReportResultViewMode`
  - `ViewModeApplicationOnSetReportResult`

The source `model.xdtomngbase_root.res` places these properties near other form-level report data:

```xml
<property name="ReportResult" type="d3p1:LFEDataPath" lowerBound="0"/>
<property name="DetailsData" type="d3p1:LFEDataPath" lowerBound="0"/>
<property xmlns:d4p1="http://v8.1c.ru/8.2/managed-application/logform" name="ReportFormType" type="d4p1:ReportFormType" lowerBound="0"/>
<property name="VariantAppearance" type="d3p1:LFEDataPath" lowerBound="0"/>
<property xmlns:d4p1="http://v8.1c.ru/8.1/data/enterprise" name="AutoShowState" type="d4p1:AutoShowStateMode" lowerBound="0"/>
<property name="CustomSettingsFolder" type="d3p1:FormItemRef" lowerBound="0"/>
<property xmlns:d4p1="http://v8.1c.ru/8.1/data/enterprise" name="ReportResultViewMode" type="d4p1:ReportResultViewMode" lowerBound="0"/>
<property xmlns:d4p1="http://v8.1c.ru/8.1/data/enterprise" name="ViewModeApplicationOnSetReportResult" type="d4p1:ViewModeApplicationOnSetReportResult" lowerBound="0"/>
```

## Decision

Add these four properties to `ClientApplicationFormRules` as a separate report-form property block, not mixed into unrelated generic form settings.

They are still represented by the generic `ClientApplicationForm` item type, because the current form subsystem does not split report forms into a separate metadata item.

## Proposed Approach

Add a dedicated section in `packages/core/metadata/forms/clientApplicationForm/rules.ts`, near `customSettingsFolder` and other root form properties:

```ts
// #region Report Form
reportFormType: {
  yaml: "ТипФормыОтчета",
  xml: "ReportFormType",
  type: "SystemEnumeration",
  typeSE: "ReportFormType",
  tag: FormRulesTags.Form,
},
autoShowState: {
  yaml: "АвтоОтображениеСостояния",
  xml: "AutoShowState",
  type: "SystemEnumeration",
  typeSE: "AutoShowStateMode",
  tag: FormRulesTags.Form,
},
reportResultViewMode: {
  yaml: "РежимПросмотраРезультатаОтчета",
  xml: "ReportResultViewMode",
  type: "SystemEnumeration",
  typeSE: "ReportResultViewMode",
  tag: FormRulesTags.Form,
},
viewModeApplicationOnSetReportResult: {
  yaml: "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета",
  xml: "ViewModeApplicationOnSetReportResult",
  type: "SystemEnumeration",
  typeSE: "ViewModeApplicationOnSetReportResult",
  tag: FormRulesTags.Form,
},
// #endregion
```

No XML defaults should be added at this stage. The diff is loss of explicit source XML nodes, and adding defaults could create new output in forms that do not have these report-form properties.

## Tests To Add Later

1. Client application form XML round-trip fixture or focused XML test:
   - source contains the four report-form nodes;
   - export preserves them in the same root form area.

2. YAML test, if this layer already covers root form YAML fields:
   - the four Russian YAML keys map to the expected internal enum values.

## Non-goals

- Do not introduce a separate report form metadata item in this pass.
- Do not add defaults for these properties.
- Do not implement the fix as part of this brainstorming pass.
