# Skip invalid duplicate FormAttribute columns

## Context

The ERP round-trip diff for
`Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml`
shows five additional columns under the same `AdditionalColumns table` with the
same `name="Реквизит1"`.

During export, all repeated columns receive `id="1"` instead of preserving
`id="1"`, `id="2"`, `id="3"`, `id="4"`, `id="5"`.

## Decision

Treat this as an invalid source configuration, not as a supported round-trip
case.

The project should not add model behavior or reference-matching logic to support
multiple sibling form-attribute columns with the same name in one column
collection. Such XML is outside the expected form model contract.

## Consequences

- Do not create a reproducer for this diff.
- Do not change `FormAttribute` import/export behavior for this case.
- When triaging this batch, mark this diff as skipped because the source XML has
  invalid duplicate column names.
- Continue with the next round-trip discrepancy.

## Follow-up

If the same pattern appears in a valid platform export where duplicate names are
expected, revisit this decision with a new fixture from that source. Until then,
the safer behavior is to keep the model strict and avoid broadening reference
matching for an invalid configuration.
