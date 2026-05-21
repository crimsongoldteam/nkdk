# DCS SettingsParameterValue Explicit Type YAML

## Problem

YAML round-trip loses the explicit DCS value type inside expanded `SettingsParameterValue`.

Source XML contains values like:

```xml
<dcscor:value xsi:type="dcscor:Field">ВидОбразования</dcscor:value>
```

YAML preserves the intended meaning:

```yaml
Текст:
  Тип: Поле
  Значение: ВидОбразования
```

During YAML import, `parameterValue/fromYAML.ts` treats the outer object as expanded SPV shape and passes only `Значение` to `importDcsMetadataValueFromYAML`. The nested `Тип: Поле` is no longer visible, so `DesignTimeValue` import interprets the plain string as `I8nText` and sync writes `xsi:type="v8:LocalStringType"`.

The same root cause appears in:

- `CommonForms/ВыборФайловСведенийФизическихЛиц/Ext/Form.xml`
- `CommonForms/ФизическиеЛицаОбразованиеКвалификация/Ext/Form.xml`

## Decision

Keep the current YAML structure. It is readable and already carries the required type information.

Fix import at the SPV boundary: when expanded `SettingsParameterValue` has `Значение` shaped as an explicit DCS text value, pass that whole object to `importDcsMetadataValueFromYAML`, not only its inner scalar.

Explicit DCS text value means an object with `Тип` and `Значение`, currently recognized by `dcsMetadataValue/fromYAML.ts` for:

- `Тип: Поле`
- `Тип: ЗначениеВремениПроектирования`

The recognition stays owned by `dcsMetadataValue/fromYAML.ts`; `parameterValue/fromYAML.ts` only preserves the object boundary so the downstream importer can make the semantic decision.

## Alternatives Considered

### A. Preserve explicit DCS object at SPV boundary

Recommended. This is the smallest behavioral change and keeps the DCS value interpretation in the existing DCS importer.

### B. Rebuild `{ type: "Field", value }` directly in `parameterValue/fromYAML.ts`

Rejected because it duplicates DCS value semantics in the parameter importer.

### C. Change the YAML format

Rejected because the YAML format already represents the value correctly. The loss happens during import.

## Implementation Shape

Add a small helper in `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`:

- detect expanded SPV objects;
- when `Значение` is an object containing both `Тип` and `Значение`, use that object as the raw DCS value;
- keep existing behavior for scalars, arrays, nil-like values, fonts, child elements, and settings fields.

No XML fixtures should change.

## Tests

Add focused YAML import coverage for a `SettingsParameterValue` whose value is:

```yaml
Значение:
  Тип: Поле
  Значение: ВидОбразования
```

Expected model value:

```ts
{ type: "Field", value: "ВидОбразования" }
```

Also cover the sibling explicit value:

```yaml
Значение:
  Тип: ЗначениеВремениПроектирования
  Значение: Перечисление.ЧтоТо
```

Expected model value:

```ts
{ type: "DesignTimeValue", value: "Перечисление.ЧтоТо" }
```

Verification should include a targeted test run first, then YAML round-trip triage for the affected batch.

## Scope

This task does not address the other three diffs from the batch:

- single-language `FormChoiceListDesTimeValue/Presentation`;
- `FormattedI8nText` partial default-language reconstruction;
- missing `CommonTemplates/.../Ext/Template.txt`.

They will be handled as separate sequential tasks.
