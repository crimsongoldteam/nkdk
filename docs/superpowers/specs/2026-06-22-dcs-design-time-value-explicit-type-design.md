# DCS DesignTimeValue Explicit YAML Type

## Context

Round-trip YAML for `SettingsParameterValue` with `valueType: DesignTimeValue` loses XML shape for `ConditionalAppearance.Текст`.
The same YAML scalar can mean several XML forms:

- `xs:string` — plain string.
- `v8:LocalStringType` — localized string.
- `v8:LocalFormattedStringType` — localized formatted string.
- `dcscor:Field` — data composition field.
- `xsi:nil="true"` — absent value.

The current double-quoted YAML string marker is not enough to choose between those forms safely.

## Decision

Use an explicit YAML value type for all non-plain `DesignTimeValue` forms in `SettingsParameterValue`.
Plain `xs:string` is the default when `Тип` is absent.

Examples:

```yaml
Текст:
  Значение: Все полномочия
```

means `xs:string`.

```yaml
Текст:
  Тип: МногоязычнаяСтрока
  Значение: "1"
```

means `v8:LocalStringType`.

```yaml
Текст:
  Тип: МногоязычнаяФорматированнаяСтрока
  Значение: Многоязычная форматированная строка
```

means `v8:LocalFormattedStringType`.

```yaml
Текст:
  Тип: Поле
  Значение: Реквизит1
```

means `dcscor:Field`.

For `xsi:nil="true"`, YAML keeps the parameter wrapper but omits `Значение`.

```yaml
Текст:
  Использовать: Ложь
```

## Data Flow

On XML import, `SettingsParameterValue` should preserve the concrete DCS value shape in the model.
On YAML export, `DesignTimeValue` should emit `Тип` for localized, formatted localized, and field values.
On YAML import, `Тип` should select the model/XML form deterministically.
When `Тип` is absent, import treats `Значение` as a plain `xs:string`.

Reference XML may still be used for ordering and nil restoration, but not for guessing the value kind when YAML provides `Тип`.

## Error Handling

Invalid combinations should fail early:

- `Тип` without a required `Значение`, except nil represented by omitted `Значение`.
- unsupported `Тип`;
- `Тип: Поле` with a non-string `Значение`;
- localized variants with a value shape that cannot be imported as localized text.

## Testing

Add focused tests for `SettingsParameterValue` `DesignTimeValue`:

- exports and imports default `xs:string` without `Тип`;
- exports and imports `МногоязычнаяСтрока`;
- exports and imports `МногоязычнаяФорматированнаяСтрока`;
- exports and imports `Поле`;
- keeps `xsi:nil="true"` as wrapper without `Значение`;
- covers the three observed round-trip diffs where `v8:LocalStringType` became `xs:string`.

Run the full `pnpm test` before closing the implementation.
