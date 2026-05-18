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

Do not keep this diff in the normal actionable triage queue. Add an explicit
known-invalid list for the `round-trip-xml` runner, for example:

```text
.agents/skills/round-trip-xml/known-invalid-diffs.tsv
```

Suggested record format:

```text
erp	Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml	invalid duplicate FormAttribute AdditionalColumns name="Реквизит1"
```

The first column identifies the XML configuration directory relative to
`NKDK_XML_REPO`, the second column is the diff path relative to that directory,
and the third column is a human-readable reason.

This keeps the skip auditable and avoids silently hiding unexpected diffs.

## Consequences

- Do not create a reproducer for this diff.
- Do not change `FormAttribute` import/export behavior for this case.
- In `round-trip.sh --triage`, exclude known-invalid records from the actionable
  diff count and triage range.
- Print skipped known-invalid records in a separate block with their reason.
- Continue with the next round-trip discrepancy as if this diff were not in the
  actionable queue.

## Runner behavior

After short round-trip collects changed files, the runner should classify each
diff as either actionable or known-invalid:

- actionable diffs keep the current `TRIAGE_DIFF` output shape;
- known-invalid diffs are not selectable by `--diff-index` and do not consume
  `--start-index` / `--batch-size` slots;
- known-invalid diffs are emitted as `SKIPPED_INVALID_DIFF` entries so the user
  can see that the file was intentionally ignored.

Example output block:

```text
=== SKIPPED_INVALID_DIFF ===
ACTIVE_XML_DIR: /Users/nikita/git/round-trip-source/erp
FILE: Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml
REASON: invalid duplicate FormAttribute AdditionalColumns name="Реквизит1"
```

The runner should still leave the XML repository dirty after the run, because
the diff exists physically. The skip only affects triage and single-diff
selection.

## Follow-up

If the same pattern appears in a valid platform export where duplicate names are
expected, revisit this decision with a new fixture from that source. Until then,
the safer behavior is to keep the model strict and avoid broadening reference
matching for an invalid configuration.
