# DCS SettingsParameterValue ent:* YAML Round-Trip Design

## Context

`round-trip-yaml` on `/Users/nikita/git/round-trip/acc` shows a value loss in a dynamic list data parameter:

```xml
<dcscor:item xsi:type="dcsset:SettingsParameterValue">
  <dcscor:use>false</dcscor:use>
  <dcscor:parameter>ВидДвижения</dcscor:parameter>
  <dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
</dcscor:item>
```

After XML -> YAML -> XML, `dcscor:value` is removed. The current code already has a generic DCS YAML representation for system enumeration values:

```yaml
Тип: СистемноеПеречисление
Имя: AccumulationRecordType
Значение: Приход
```

The gap is not a missing XML type or a missing YAML shape. The value is imported from XML as `MetadataDcsSystemEnumerationValue`, but it is used through `SettingsParameterValue` rules such as `valueType: "Field"` in `DynamicList.dataParameters`. The fix must preserve the actual typed DCS value instead of relying on a parameter-specific rule for `ВидДвижения`.

## Decision

Use the existing explicit YAML shape for all DCS system enumeration values that arrive from XML as `ent:*`, regardless of the surrounding `SettingsParameterValue.valueType`, when that `valueType` supports typed values.

Do not add a one-off `parameterRules.ВидДвижения` entry to `DynamicList`. That would fix only the observed fixture and would leave the same class of loss for other `ent:*` values hidden under generic DCS parameter rules.

## Design

`DcsMetadataValue` remains the boundary for typed DCS values. The implementation should make `MetadataDcsSystemEnumerationValue` round-trip through:

1. XML import from `dcscor:value xsi:type="ent:*"`.
2. YAML export as explicit `СистемноеПеречисление`.
3. YAML import back into `MetadataDcsSystemEnumerationValue`.
4. XML export back to the same `ent:*` value.

The behavior should work when the caller rule is at least `Field` or `Primitive`, because these are the generic rules already used for dynamic list data parameters and DCS parameter collections. Existing behavior for `valueType: "SystemEnumeration"` must stay unchanged.

`SettingsParameterValue` should keep using its current full YAML form. For the failing case, the intended YAML fragment is:

```yaml
ВидДвижения:
  Использовать: Ложь
  Значение:
    Тип: СистемноеПеречисление
    Имя: AccumulationRecordType
    Значение: Приход
```

If `SettingsParameterValue` lifts an inner DCS type into its own `Тип` field, it must not accidentally turn `СистемноеПеречисление` into a wrapper type that loses `Имя`. Either keep the full DCS object under `Значение`, or only lift types whose value shape is lossless.

## Tests

Add a focused fixture/test around `SettingsParameterValueCollection` or `DynamicList.dataParameters` with parameter `ВидДвижения`, `use=false`, and `dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value`.

The tests must verify:

- XML import keeps `type: "SystemEnumeration"`, `typeSE: "AccumulationRecordType"`, `value: "Receipt"`.
- YAML export writes the explicit `СистемноеПеречисление` object with `Значение: Приход`.
- YAML import restores the same model.
- XML export writes `<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>`.

After the focused tests pass, run `pnpm test` before closing the issue. Then rerun `round-trip-yaml` on `acc` and confirm that this diff disappears.

## Non-Goals

- Do not add parameter-name-specific rules for `ВидДвижения`.
- Do not change existing XML fixtures as source data.
- Do not introduce a new YAML syntax for system enumerations.
- Do not hide the loss by restoring the value only from reference XML while leaving YAML incomplete.
