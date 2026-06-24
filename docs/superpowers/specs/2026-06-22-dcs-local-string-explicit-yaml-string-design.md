# DCS LocalStringType Explicit YAML String

## Context

Round-trip YAML still changes one `ConditionalAppearance.Текст` value:

```diff
<v8:lang>ru</v8:lang>
+<v8:lang>value</v8:lang>
```

The XML shape is already preserved as `xsi:type="v8:LocalStringType"`. The remaining
loss is the language key inside the localized string.

The intermediate YAML is valid and explicit:

```yaml
Текст:
  Использовать: Ложь
  Тип: МногоязычнаяСтрока
  Значение: "1"
```

The quoted scalar `"1"` is imported as an internal `ExplicitYAMLString` wrapper so
other metadata values can distinguish string `"1"` from number `1`. For
`Тип: МногоязычнаяСтрока`, that wrapper is then passed to `I8nText` import as if it
were a language map. `I8nText` sees `{ value: "1" }` and exports language `value`.

## Decision

Handle this at the explicit DCS text-value boundary.

When importing `MetadataDcsMetadataValue` with:

```yaml
Тип: МногоязычнаяСтрока
Значение: ...
```

unwrap `ExplicitYAMLString` from `Значение` before calling `importI8nTextFromYAML`.
After unwrapping, `"1"` is a normal scalar and imports as the default language
`ru`.

Do not change generic `I8nText.fromYAML` in this task. The observed bug is caused
by the DCS explicit type adapter passing a YAML quoting marker into a localized
string importer.

## Data Flow

XML import keeps:

```ts
{ items: { ru: "1" } }
```

YAML export keeps the explicit DCS type:

```yaml
Тип: МногоязычнаяСтрока
Значение: "1"
```

YAML import unwraps only the scalar marker under `Значение` and reconstructs:

```ts
{ items: { ru: "1" } }
```

XML export then writes:

```xml
<v8:lang>ru</v8:lang>
<v8:content>1</v8:content>
```

## Error Handling

Existing validation for explicit DCS text values remains:

- unsupported `Тип` still fails;
- invalid localized-string YAML still fails through the localized text importer;
- plain `DesignTimeValue` without `Тип` still uses the existing `xs:string`
  behavior.

## Testing

Add focused tests for DCS `DesignTimeValue`:

- `Тип: МногоязычнаяСтрока` with quoted numeric-looking scalar imports as
  `{ items: { ru: "1" } }`;
- `AppearanceFields.Текст` YAML with `Использовать: Ложь`,
  `Тип: МногоязычнаяСтрока`, `Значение: "1"` exports XML with
  `<v8:lang>ru</v8:lang>`;
- the real round-trip YAML diff for
  `DataProcessors/СопоставлениеДанныхЕГАИС/Forms/СопоставлениеНоменклатуры/Ext/Form.xml`
  no longer appears.

Run `pnpm test` before closing the implementation.
