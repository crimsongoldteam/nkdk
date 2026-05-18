# Remaining Round-Trip Diffs Design

## Context

ERP short round-trip now completes without synchronization errors, but still reports 9 actionable XML diffs after skipping the known invalid duplicate `FormAttribute AdditionalColumns name="Реквизит1"` case.

The remaining diffs are three behavioral clusters:

- `AccountingRegisters/МеждународныйБезКорреспонденции.xml`: `RecordType` moves inside `StandardAttributes`.
- Report form XML files: root `AutoCommandBar name=""` is exported as `name="ФормаКоманднаяПанель"`.
- `Reports/ДвиженияНастраиваемойОтчетности/Forms/ФормаОтчета/Ext/Form.xml`: `ReportResult` and `DetailsData` lose `xsi:type="xs:decimal"`.

Existing XML sources and project XML fixtures remain sources of truth. Implementation must not modify source XML files in `/Users/nikita/git/round-trip-source`.

## Goals

- Preserve reference XML ordering for standard attributes during XML export.
- Preserve empty singleton XML names from reference metadata.
- Import numeric report form fields as numbers and export them with XML type taken from reference metadata.
- Add focused tests for each behavior before implementation changes.

## Non-Goals

- Do not rewrite the full form element naming model.
- Do not change XML fixtures from the external ERP source repository.
- Do not introduce YAML behavior changes while XML round-trip remains under correction.
- Do not force all report result fields to `number`; existing textual XML values must keep round-trip behavior.

## Design

### StandardAttributes Reference Order

`StandardAttributeDescriptions.toXML` should use `referenceMetadata` as the primary ordering source when a reference exists.

The exported name list should be built as:

1. names from `referenceMetadata`, in their original reference order;
2. model-only names that are not present in the reference, appended after reference names.

The current canonical order remains useful when no reference exists. That keeps generated output deterministic for new exports, while avoiding churn in round-trip exports that already have source XML order.

The concrete ERP diff is `RecordType`: source XML keeps it near `LineNumber`, but current export moves it according to canonical accounting register order. After the change, the reference order wins and `RecordType` stays where it came from.

### Empty Singleton Names

Singleton form elements already preserve reference naming modes, including non-Russian suffixes such as `FormCommandBar`.

That same rule should cover empty XML names. If a singleton is imported from reference XML with `_name === ""`, the reference name mode should be stored as an exact name:

```ts
{ kind: "exact", name: "" }
```

During export, `applyReferenceNameMode` already returns exact names unchanged. The missing behavior is recognizing empty string names as valid exact reference names instead of treating them as no match.

This should fix report forms where root `AutoCommandBar name="" id="-1"` currently exports as `name="ФормаКоманднаяПанель"`.

### Reference-Typed Report Form Fields

`ReportResult` and `DetailsData` can appear as typed decimal XML in ERP:

```xml
<ReportResult xsi:type="xs:decimal">3</ReportResult>
<DetailsData xsi:type="xs:decimal">0</DetailsData>
```

They can also appear as plain textual XML in existing fixtures:

```xml
<ReportResult>Результат</ReportResult>
<DetailsData>ДанныеРасшифровки</DetailsData>
```

The model should therefore use `string | number` semantics for these two fields:

- XML with numeric `xsi:type` such as `xs:decimal` imports as `number`.
- Plain textual XML imports as `string`.
- Export uses the reference XML type as the source of truth. If the reference value had `xsi:type="xs:decimal"` and the model value is numeric, export keeps `xsi:type="xs:decimal"`.
- If the reference value was plain text, export remains plain text without adding a numeric `xsi:type`.

This preserves both source XML shapes while still representing typed numeric ERP values as numbers in the model.

## Testing Strategy

- Add a focused `StandardAttributeDescriptions` export test with reference order `Active`, `LineNumber`, `RecordType`, then verify exported XML keeps that order even when model changes a standard attribute.
- Add a singleton name test next to the existing `FormCommandBar` reference test: import/export a root `AutoCommandBar` reference with `_name: ""`, expect exported `_name` to remain `""`.
- Add focused `ClientApplicationForm` import/export tests for decimal `ReportResult` and `DetailsData`, expecting model values `3` and `0`, and exported XML with `xsi:type="xs:decimal"` when the reference has that type.
- Keep existing textual `reportForm.xml` import/export tests green: text values remain strings and export without decimal `xsi:type`.
- After focused tests pass, run ERP round-trip triage and then full `pnpm test` after regenerating Langium files if needed.

## Risks

- The implementation needs a small reference-aware XML type or equivalent mechanism because primitive `number` values cannot carry the original `xsi:type` by themselves. Keep that mechanism scoped to these report form fields unless another existing rule already provides the same behavior.
- Standard attribute ordering must only use reference order when reference metadata exists; otherwise newly generated XML should keep the existing deterministic canonical behavior.
- Empty singleton names should be exact reference names, not suffixes, to avoid `endsWith("")` behavior affecting unrelated singleton names.
