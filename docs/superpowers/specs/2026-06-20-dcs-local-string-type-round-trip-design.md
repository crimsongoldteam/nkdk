# DCS xs:string vs LocalStringType YAML round-trip

## Context

`round-trip-yaml-fast /home/nikita/git/round-trip/all` now leaves one diff in
`CommonForms/ДинамическийСписок/Ext/Form.xml`. The visible symptom is that some DCS text values
that came from XML as `xsi:type="xs:string"` are exported back as `xsi:type="v8:LocalStringType"`.

This is separate from the already fixed numeric-looking string case for `Маска`: there the type was
lost because `"123"` was parsed as a decimal. Here the YAML value is a string, but the XML flavor of
that string is lost on the way through the model.

## Observed cases

1. `FilterItemComparison.presentation`

   Source XML:

   ```xml
   <dcsset:presentation xsi:type="xs:string">Английское</dcsset:presentation>
   ```

   Current model imports it as an `I8nText` shape, so XML export emits
   `v8:LocalStringType`.

2. `AppearanceFields.Текст`

   Source XML:

   ```xml
   <dcscor:parameter>Текст</dcscor:parameter>
   <dcscor:value xsi:type="xs:string">6678</dcscor:value>
   ```

   YAML contains:

   ```yaml
   Текст: "6678"
   ```

   The double-quoted scalar marker is present on the parsed YAML object, but it is not restored when
   `AppearanceFields` passes the property value into `SettingsParameterValue`. The value therefore
   reaches `MetadataDcsMetadataValue` as a normal string and is interpreted as `I8nText`.

## Design

Use the existing typed DCS value mechanisms instead of adding a new preservation flag.

### Filter item presentation

Change only `FilterItemComparisonRules.presentation` from `DcsLocalStringType` to
`FilterItemPresentationValue`.

`FilterItemPresentationValue` is already used by `FilterItemGroup` for the same XML/YAML field
shape and delegates to `MetadataDcsMetadataValue` with `valueType: "DesignTimeValue"`. That gives the
model enough information to represent both:

- `xs:string` as `{ type: "string", value: "..." }`;
- `v8:LocalStringType` as `I8nText`.

The YAML form stays compact: both values still serialize as a plain scalar when possible.

### SettingsParameterValue from YAML

Extend the generic YAML property import boundary so that double-quoted scalar markers are restored
for `SettingsParameterValue`, not only for `MetadataValue`.

The intended rule is:

- when a YAML property is marked as double-quoted and the target property type is
  `SettingsParameterValue`, pass `explicitYAMLString(value)` into that type rule;
- keep all other property types unchanged;
- keep nested collection behavior as-is, because `SettingsParameterValueCollection` already restores
  markers for its own dynamic parameter keys.

This keeps `AppearanceFields.Текст: "6678"` as an explicit string value and lets existing
`MetadataDcsMetadataValue` logic export it back as `xs:string`.

## Out of scope

- Do not change XML fixtures.
- Do not add a new `preserveExplicitDefaultXML`-style flag.
- Do not change YAML syntax for these fields.
- Do not broaden all `DcsLocalStringType` fields blindly; only the confirmed `FilterItemComparison`
  presentation field moves to the existing DCS presentation type.

## Tests

Add failing tests before implementation:

1. `filterItem/fromXML.test.ts`
   - import a `FilterItemComparison` with `dcsset:presentation xsi:type="xs:string"`;
   - expect `presentation` to be `{ type: "string", value: "Английское" }`.

2. `appearanceFields/fromYAML.test.ts`
   - parse YAML through the real YAML text cycle so `"6678"` is marked as double-quoted;
   - import `Текст: "6678"`;
   - expect `Текст.value` to be `{ type: "string", value: "6678" }`.

Verification after implementation:

- run the two focused tests;
- run `round-trip-yaml-fast /home/nikita/git/round-trip/all`;
- run `pnpm test` from the repository root before closing the issue.

## Acceptance criteria

- `round-trip-yaml-fast /home/nikita/git/round-trip/all` reports `diffs: 0` for this case.
- Existing compact YAML for DCS text presentations remains unchanged.
- `xs:string` and `v8:LocalStringType` remain distinguishable in the model where XML needs that
  distinction.
