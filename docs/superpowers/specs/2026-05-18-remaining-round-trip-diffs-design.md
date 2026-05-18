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
- Import numeric report form fields as numbers and export them with typed decimal XML.
- Add focused tests for each behavior before implementation changes.

## Non-Goals

- Do not rewrite the full form element naming model.
- Do not change XML fixtures from the external ERP source repository.
- Do not introduce YAML behavior changes while XML round-trip remains under correction.
- Do not add broad string-or-number modeling for report result fields in this pass.

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

### Numeric Report Form Fields

`ReportResult` and `DetailsData` should be modeled as numbers for the numeric XML cases that appear in ERP:

```xml
<ReportResult xsi:type="xs:decimal">3</ReportResult>
<DetailsData xsi:type="xs:decimal">0</DetailsData>
```

The existing `number` type already imports `xs:decimal` XML values as numbers and can export typed XML when `typedXML: true` is set. The form rules for `reportResult` and `detailsData` should therefore use:

```ts
type: "number",
typedXML: true,
```

This intentionally chooses a numeric model over preserving these values as strings with reference-backed XML type metadata.

## Testing Strategy

- Add a focused `StandardAttributeDescriptions` export test with reference order `Active`, `LineNumber`, `RecordType`, then verify exported XML keeps that order even when model changes a standard attribute.
- Add a singleton name test next to the existing `FormCommandBar` reference test: import/export a root `AutoCommandBar` reference with `_name: ""`, expect exported `_name` to remain `""`.
- Add focused `ClientApplicationForm` import/export tests for decimal `ReportResult` and `DetailsData`, expecting model values `3` and `0`, and exported XML with `xsi:type="xs:decimal"`.
- After focused tests pass, run ERP round-trip triage and then full `pnpm test` after regenerating Langium files if needed.

## Risks

- Changing `reportResult` and `detailsData` from `string` to `number` may expose existing fixtures that use textual values for those fields. The implementation should update tests deliberately around the numeric contract chosen here and report any conflicting fixture before broadening the model.
- Standard attribute ordering must only use reference order when reference metadata exists; otherwise newly generated XML should keep the existing deterministic canonical behavior.
- Empty singleton names should be exact reference names, not suffixes, to avoid `endsWith("")` behavior affecting unrelated singleton names.
