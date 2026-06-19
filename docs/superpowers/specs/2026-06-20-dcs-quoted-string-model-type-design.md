# DCS quoted string model type design

## Context

`round-trip-yaml-fast` now checks `CommonForms/ДинамическийСписок/Ext/Form.xml` and reports one remaining diff. The diff is inside DynamicList DCS settings: YAML keeps string-looking values readable as quoted strings, but after YAML import some nested DCS values lose the "double quoted string" marker and are imported by heuristic as another type.

Examples from the diff:

- `dcscor:value xsi:type="xs:string">123</dcscor:value` becomes `xs:decimal`.
- Some `xs:string` presentation values can be rebuilt as `v8:LocalStringType`.

The source XML type is meaningful here. A quoted YAML scalar should preserve string intent when converted back into the model.

## Decision

Keep the YAML contract unchanged. Ambiguous string values stay as quoted YAML strings, for example:

```yaml
Значение: "123"
```

The model must store the type explicitly after YAML import:

```ts
{ type: "string", value: "123" }
```

The fix should restore the existing `explicitYAMLString` marker for nested DCS values before `MetadataDcsMetadataValue` delegates to `MetadataValue/fromYAML`. This means using the same `asExplicitYAMLStringIfMarked(parent, key, value)` mechanism that ordinary property import already uses, but at the nested DCS collection boundaries where values are currently read directly.

## Scope

In scope:

- Nested DCS settings values, especially `SettingsParameterValue` and collections that pass values into `MetadataDcsMetadataValue`.
- Quoted scalar values inside objects and arrays.
- Keeping compact YAML output where double quotes are enough.
- Regression coverage for DynamicList settings where `xs:string` numeric-looking values must stay `xs:string`.

Out of scope:

- Adding YAML forms such as `{ Тип: "Строка", Значение: "123" }` for this case.
- Changing the general `MetadataValue` YAML contract.
- Restoring types from `referenceMetadata` as a substitute for self-contained YAML import.
- Fixing unrelated DCS ordering or LocalString behavior unless the same marker loss causes it.

## Data Flow

XML import reads `xsi:type="xs:string"` into a tagged model value.

YAML export writes the value as a double-quoted scalar when needed.

YAML import parses the scalar as a normal JavaScript string but records double-quote style on the parent/key. The nested DCS importer must retrieve that mark and pass `explicitYAMLString("123")` to value import.

Model import then produces `{ type: "string", value: "123" }`.

XML export writes `xsi:type="xs:string"` again.

## Testing

Add a failing regression first:

- A focused unit test for nested `SettingsParameterValue` / `MetadataDcsMetadataValue` importing `"123"` as a typed string.
- A round-trip test around DynamicList form settings or the smallest fixture fragment that reproduces the current `xs:string` to `xs:decimal` change.

After implementation:

- Run the focused tests.
- Run `round-trip-yaml-fast /home/nikita/git/round-trip/all` and expect this diff to disappear or shrink to unrelated issues.
- Run `pnpm test` before closing the work.
