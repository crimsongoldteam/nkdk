# DCS Auto Color YAML Design

## Context

ERP validation still reports `Expected union value` for some form conditional appearance YAML.
The repeating color cases are DCS `SettingsParameterValue` entries such as:

```yaml
Оформление:
  ЦветТекста: auto
```

and:

```yaml
Оформление:
  ЦветФона:
    Использовать: Ложь
    Значение: auto
```

In source XML these values are real platform nodes:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:parameter>ЦветТекста</dcscor:parameter>
  <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
</dcscor:item>
```

For disabled parameters XML also keeps the technical color value:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:use>false</dcscor:use>
  <dcscor:parameter>ЦветФона</dcscor:parameter>
  <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
</dcscor:item>
```

`auto` is not a user-selectable color. It is a platform default color marker for DCS appearance parameters.

## Evidence

A scan of `/home/nikita/git/round-trip` for DCS color `SettingsParameterValue` nodes found no missing or empty `dcscor:value` for color parameters:

- `ЦветТекста`: `7201` values, `missing=0`, `empty=0`, `auto=230`.
- `ЦветФона`: `1705` values, `missing=0`, `empty=0`, `auto=130`.
- Other `v8ui:Color` DCS parameters also had `missing=0`, `empty=0`.

This means XML output can always restore `auto` for color parameters when YAML omits the value.

## Goal

Hide technical `auto` color values from YAML for DCS appearance colors while preserving XML round-trip.

The YAML contract for color DCS `SettingsParameterValue` is:

```yaml
Оформление:
  ЦветТекста:
```

This means the parameter is present and enabled. The color value is omitted in YAML and restored as `auto` in XML.

For a disabled color parameter:

```yaml
Оформление:
  ЦветФона:
    Использовать: Ложь
```

This means the parameter is present and disabled. The color value is omitted in YAML and still restored as `auto` in XML.

## Non-Goals

- Do not add `auto` to the general `Color` schema.
- Do not make `auto` selectable for ordinary form element colors.
- Do not change non-color `SettingsParameterValue` behavior.
- Do not change XML fixtures as part of the design.
- Do not normalize unrelated union validation errors in this change.

## Architecture

The behavior belongs to DCS parameter value import/export and JSON Schema, not to the shared `Color` type.

`AppearanceFields` rules identify known color DCS parameters. The implementation should treat color `SettingsParameterValue` entries specially only in that context.

The shared color schema remains strict: style colors, web/windows colors, raw refs, absolute colors, and style item refs only.

## Data Flow

### XML to YAML

When importing a DCS `SettingsParameterValue` whose parameter value type is color:

1. If XML value is `v8ui:Color` with text `auto`, keep the parameter item.
2. Do not export `Значение: auto` to YAML.
3. If the parameter is enabled, export the YAML key with an empty value.
4. If the parameter is disabled, export only `Использовать: Ложь`.

### YAML to XML

When exporting a color DCS `SettingsParameterValue`:

1. If YAML contains the parameter key with no value, create an enabled parameter item.
2. If YAML contains only `Использовать: Ложь`, create a disabled parameter item.
3. If the model has no explicit color value, write `dcscor:value xsi:type="v8ui:Color"` with text `auto`.
4. If the model has an explicit color value, keep the existing color export behavior.

## Validation

JSON Schema should accept empty YAML values only for color DCS `SettingsParameterValue` entries in the DCS appearance context.

These examples are valid:

```yaml
Оформление:
  ЦветТекста:
```

```yaml
Оформление:
  ЦветФона:
    Использовать: Ложь
```

These examples should not become generally valid colors:

```yaml
ЦветТекста: auto
```

```yaml
Цвет: auto
```

Existing behavior for non-color `SettingsParameterValue` entries stays unchanged.

## Error Handling

Validation should not warn about omitted values for known color DCS parameters, because the omission is the intended YAML syntax for platform `auto`.

Invalid non-color empty parameters should keep current behavior.

## Testing

Focused tests should cover:

- XML `v8ui:Color auto` exports to YAML as an empty color parameter.
- Disabled XML color parameter with `auto` exports to YAML without `Значение`.
- YAML empty color parameter imports as an enabled parameter.
- YAML disabled color parameter without value imports as disabled.
- XML export restores `v8ui:Color auto` when the color DCS parameter has no explicit value.
- JSON Schema accepts the new color-parameter syntax.
- JSON Schema does not add `auto` as a normal color.
- Non-color `SettingsParameterValue` behavior remains unchanged.
