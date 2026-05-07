# Table DCS Composer Fields Reproducer

## Context

Short round-trip diff 3 shows that form table XML nodes can lose DCS composer table fields during XML -> model -> XML conversion. The immediate examples are two table fixtures:

- `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.xml`
- `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.xml`

Both fixtures should become first-class form element fixtures and run through the shared element test mechanism.

## Design

Add three optional properties to `TableRules`:

- `autofill`: XML `Autofill`, YAML `АвтозаполнениеКолонок`, type `boolean`.
- `viewMode`: XML `ViewMode`, YAML `РежимОтображения`, type `SystemEnumeration`, `typeSE: "DataCompositionSettingsViewMode"`.
- `settingsNamedItemDetailedRepresentation`: XML `SettingsNamedItemDetailedRepresentation`, YAML `ПодробноеОтображениеИменованныхЭлементовНастройки`, type `boolean`.

Use simple model names for the first two fields because they match XML and the user explicitly chose that shape. Use a longer model name for `SettingsNamedItemDetailedRepresentation` to preserve the XML meaning without abbreviation.

## Fixtures

Create `dcsComposerFilter.ts` and `dcsComposerSettings.ts` next to the XML files. Each file exports a `Table` model and a `TablePartialYAML` value.

`dcsComposerFilter` covers the three new fields with `Autofill=true`, `ViewMode=QuickAccess`, and `SettingsNamedItemDetailedRepresentation=false`.

`dcsComposerSettings` is a separate table fixture for the nearby DCS composer settings table. It should include supported table properties and YAML expectations, but it does not need to force the three new fields if they are absent from its XML.

## Tests

Register both fixtures in `packages/core/metadata/forms/elements/__tests__/fixtures.ts` under the `Table` region. Use the existing shared element tests for XML and YAML:

- `fromXML.test.ts`
- `toXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`

Do not add local `fromXML.test.ts` or `toXML.test.ts` files for `table`, because form elements are tested centrally.

## Existing Full Fixture

Do not add these DCS-specific fields to the existing `fullTable` fixture. If TypeScript requires the `fullTable` required-field assertion to mention the new properties, exclude them from that assertion only. The new fields are covered by the two focused DCS composer fixtures instead.

## Out Of Scope

This design does not change fromXML/toXML/fromYAML/toYAML implementation files directly. Behavior changes should come through `TableRules`.
