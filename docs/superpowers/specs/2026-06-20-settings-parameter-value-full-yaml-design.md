# SettingsParameterValue full YAML form design

## Context

Full metadata round-trip stops during `nkdk sync` for three objects:

- `MetadataDataProcessor "ДокументооборотСКонтролирующимиОрганами"`;
- `MetadataInformationRegister "ОчередьЧековККТ"`;
- `MetadataCatalog "ОписиИсходящихДокументовВНалоговыеОрганы"`.

The visible error is:

```text
value.startsWith is not a function
```

The stack points to `Color.fromYAML`, called through DCS `SettingsParameterValue` in
`AppearanceFields` (`ЦветФона` / `ЦветТекста`). The root cause is broader than color: YAML for
`SettingsParameterValue` currently has both compact and expanded forms, and the import boundary can
pass the expanded wrapper object into the value-specific importer instead of passing only the value.

Example of the ambiguous compact form:

```yaml
ЦветТекста: "#FF0000"
```

Example of the expanded form that carries `SettingsParameterValue` fields:

```yaml
ЦветТекста:
  Использовать: Ложь
  Значение: "#FF0000"
```

The type-specific importer (`Color`, `Font`, `Primitive`, `DesignTimeValue`, and others) should not
know about `SettingsParameterValue` wrappers. Only `SettingsParameterValue.fromYAML` should decide
whether a YAML node is the full parameter form or a raw value.

## Decision

Make the full object form the canonical YAML output for every property with
`type: "SettingsParameterValue"`.

Canonical output, even when only a value exists:

```yaml
ЛюбойПараметр:
  Значение: <значение>
```

When parameter metadata exists, it is written next to `Значение`:

```yaml
ЛюбойПараметр:
  Использовать: Ложь
  Значение: <значение>
  Элементы:
    - Значение: <вложенное значение>
  РежимОтображения: БыстрыйДоступ
```

`fromYAML` keeps backward compatibility with the compact form, but treats the full form as primary.
The full form is recognized at the `SettingsParameterValue` boundary and normalized before delegating
to the value-specific importer.

## Architecture

`SettingsParameterValue` remains the owner of its wrapper fields:

- `Использовать`;
- `Значение`;
- `Элементы`;
- `РежимОтображения`;
- `ИдентификаторПользовательскойНастройки`;
- `ПредставлениеПользовательскойНастройки`.

The importer should split an input node into two parts:

1. parameter wrapper metadata (`use`, nested items, view mode, user-setting fields);
2. raw value passed to `MetadataDcsMetadataValue` according to `valueType`.

The value-specific importers stay focused on their own value contracts. For example, `Color.fromYAML`
continues to receive only a color scalar such as `"#FF0000"` or `ЭлементСтиля.ЦветОшибки`, not the
object `{ Использовать, Значение }`.

Object values inside `Значение` remain valid. For example, a DCS value such as:

```yaml
Текст:
  Значение:
    Тип: Поле
    Значение: Сертификаты.СертификатПредставление
```

means the outer object is the `SettingsParameterValue` wrapper, and the inner object is the DCS
value. The importer must not flatten the inner value object.

## Data Flow

Export:

1. The model contains a `SettingsParameterValue`.
2. `SettingsParameterValue.toYAML` always creates an object.
3. If the model has `value`, the exported value goes under `Значение`.
4. If the model has `use: false`, nested items, or user-setting fields, they are added next to
   `Значение`.
5. YAML no longer emits compact `Параметр: <значение>` for this property type.

Import:

1. `SettingsParameterValue.fromYAML` receives either full or legacy compact YAML.
2. Full form is detected by wrapper fields such as `Использовать`, `Элементы`,
   `РежимОтображения`, user-setting fields, or by `Значение` when the object is not a known
   value-specific shape such as `{ Тип, Значение }`.
3. For full form, only the content of `Значение` is passed into `MetadataDcsMetadataValue`.
4. For legacy compact form, including object values such as `{ Тип, Значение }`, the whole node is
   treated as the raw value.
5. `use`, nested `item`, view mode, and user-setting fields are restored on the resulting model.

## Error Handling

Invalid full forms should fail at the `SettingsParameterValue` boundary with a message that points to
the wrapper shape, not with a type-specific JavaScript error like `value.startsWith is not a
function`.

The implementation should avoid broad object flattening. A nested object under `Значение` may be a
valid DCS value and must be passed through unchanged.

## Compatibility

In scope:

- keep reading existing compact YAML for `SettingsParameterValue`;
- export all `SettingsParameterValue` properties in full form;
- apply the rule to every `SettingsParameterValue` property, not only DCS colors;
- keep existing XML behavior and XML fixtures unchanged.

Out of scope:

- changing YAML for ordinary properties that are not `SettingsParameterValue`;
- teaching `Color`, `Font`, or other value-specific importers to parse wrapper objects;
- changing `MetadataValue` YAML contract;
- editing existing XML fixtures.

## Tests

Add focused regression coverage before implementation:

1. `SettingsParameterValue.fromYAML`
   - imports full form `{ Значение: "#FF0000" }` for `valueType: "Color"`;
   - imports full form `{ Использовать: "Ложь", Значение: "#FF0000" }` and preserves `use: false`;
   - imports full form where `Значение` is an object DCS value, without flattening the inner object;
   - still imports legacy compact scalar form.

2. `SettingsParameterValue.toYAML`
   - exports every `SettingsParameterValue` as an object with `Значение`;
   - preserves `Использовать: Ложь`, nested `Элементы`, and user-setting fields.

3. Integration around `AppearanceFields`
   - imports and exports `ЦветФона` / `ЦветТекста` in full form;
   - verifies `Color.fromYAML` never receives the wrapper object.

Verification after implementation:

- run the focused tests;
- run `pnpm test` from the repository root;
- rerun `round-trip-yaml` on the failing XML configuration and confirm `nkdk sync` no longer stops on
  `value.startsWith is not a function`.

## Acceptance criteria

- `SettingsParameterValue` YAML output is always full object form.
- Legacy compact `SettingsParameterValue` YAML remains readable.
- The three observed `nkdk sync` failures no longer occur.
- Value-specific importers remain wrapper-agnostic.
- XML fixtures stay unchanged.
