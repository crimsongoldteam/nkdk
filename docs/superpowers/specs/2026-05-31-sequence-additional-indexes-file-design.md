# Sequence AdditionalIndexes File Design

## Context

Full YAML round-trip for `/home/nikita/git/round-trip/all` deletes:

`Sequences/ПоследовательностьВсеПоля/Ext/AdditionalIndexes.xml`

The XML file exists in the reference, but `Последовательность/ПоследовательностьВсеПоля/Свойства.yaml` does not contain `ДополнительныеИндексы`.
`MetadataSequenceRules` currently describes `additionalIndexes` as an inline XML property under `Properties`, while the real XML stores it as an external file under `Ext/AdditionalIndexes.xml`.

## Decision

Describe `MetadataSequenceRules.properties.additionalIndexes` as an external file:

`filePath: "Ext/AdditionalIndexes.xml"`

This matches the existing pattern used by documents, catalogs, registers, tasks, business processes, and other applied objects with additional indexes.

## Scope

In scope:

- Import sequence additional indexes from `Sequences/<name>/Ext/AdditionalIndexes.xml` into YAML.
- Sync YAML additional indexes back to `Sequences/<name>/Ext/AdditionalIndexes.xml`.
- Add focused coverage for `MetadataSequence` import and sync.

Out of scope:

- Root configuration `ext/*` lowercase paths.
- CRLF to LF normalization.
- Form XML semantic diffs.
- Treating sequence additional indexes as reference-only.

## Data Flow

Import:

`Sequences/<name>/Ext/AdditionalIndexes.xml` -> `ДополнительныеИндексы` in `Свойства.yaml`.

Sync:

`ДополнительныеИндексы` in `Свойства.yaml` -> `Sequences/<name>/Ext/AdditionalIndexes.xml`.

## Testing

Add or update sequence tests so the full fixture with additional indexes verifies:

- YAML includes `ДополнительныеИндексы`.
- XML sync writes `Ext/AdditionalIndexes.xml`.
- The file is not removed by configuration sync manifest pruning.
- The `MetadataSequence` sync fixture includes `Ext/AdditionalIndexes.xml`, so coverage follows the normal fixture import/sync path.

## Risks

Existing tests may need fixture expectations updated because additional indexes will move from ignored/missing behavior into the YAML contract for sequences.
