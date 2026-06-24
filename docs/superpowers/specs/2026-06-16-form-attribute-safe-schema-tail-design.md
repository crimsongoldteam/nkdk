# Form Attribute Safe Schema Tail Design

## Context

After accepting form attribute `Колонки` and `ДополнительныеКолонки`, ERP YAML validation still reports `60` `Unexpected property` diagnostics.

The remaining diagnostics are not one uniform case. The largest safe group is:

- `ТабличныйДокумент`: 15 diagnostics.
- `ПоляКлюча`: 12 diagnostics on scalar values, plus 6 diagnostics on list items.
- `ДиаграммаГанта`: 8 diagnostics.
- `Диаграмма`: 8 diagnostics.

Together these account for `49` of `60` remaining diagnostics.

The first three keys are already present in the form attribute YAML contract through `FormAttributeRules` and `FormAttributeYAML`:

- `Диаграмма`
- `ДиаграммаГанта`
- `ТабличныйДокумент`

They are also emitted by the current XML to YAML conversion. The validation failure is therefore a JSON Schema gap, not a request to change the YAML shape.

`ПоляКлюча` is already represented in `DynamicListRules` as `DynamicListKeyFields`, and XML import normalizes it as a string or string array. The missing part is JSON Schema support for that helper type.

The other `11` diagnostics involve separate DCS-related shapes such as `ПараметрыДанных` and `ДоступныеЗначения`. They should be handled separately to avoid weakening unrelated schemas.

## Goal

Remove the `49` safe `Unexpected property` diagnostics from generated ERP YAML validation.

Success criteria:

- `FormAttribute` JSON Schema accepts `Диаграмма`.
- `FormAttribute` JSON Schema accepts `ДиаграммаГанта`.
- `FormAttribute` JSON Schema accepts `ТабличныйДокумент`.
- `DynamicList` JSON Schema accepts `ПоляКлюча` as a string and as a list of strings.
- ERP YAML validation `Unexpected property` count drops by the safe group size, while unrelated diagnostics remain visible.

## Non-Goals

- Do not change XML fixtures.
- Do not change generated YAML.
- Do not make `FormAttribute` or `DynamicList` schemas broadly permissive.
- Do not fix `ПараметрыДанных`, `ДоступныеЗначения`, `ПутьКДанным`, or metadataTarget diagnostics in this step.
- Do not enable XML import/export for `Диаграмма`, `ДиаграммаГанта`, or `ТабличныйДокумент`; the current task is validation only.

## Design

Use targeted JSON Schema additions.

For `FormAttribute`, extend the existing local schema customization in `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`. The extension should add strict optional schemas for:

- `Диаграмма`
- `ДиаграммаГанта`
- `ТабличныйДокумент`

The schemas should match the current YAML representation of these settings. If the underlying settings types already have registered JSON Schema exporters, reuse them. If they do not, add narrow exporters for their existing YAML scalar or raw XML-string shape instead of allowing arbitrary objects.

For `ПоляКлюча`, register a JSON Schema exporter for `DynamicListKeyFields`. It should accept:

- a single string;
- an array of strings.

This matches current import behavior and the observed ERP YAML.

## Error Handling

Unsupported fields inside accepted settings objects should still fail validation.

Invalid `ПоляКлюча` values, such as numbers, objects, or arrays containing non-strings, should fail validation.

The schema should continue to reject unrelated unknown keys in form attributes and dynamic list settings.

## Testing

Add focused schema tests before implementation:

- `FormAttribute` schema accepts a `ТабличныйДокумент` setting.
- `FormAttribute` schema accepts a `Диаграмма` setting.
- `FormAttribute` schema accepts a `ДиаграммаГанта` setting.
- `DynamicList` schema accepts `ПоляКлюча: Ссылка`.
- `DynamicList` schema accepts `ПоляКлюча: [Ссылка, Организация]`.
- `DynamicList` schema rejects non-string key fields.

Run focused tests:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Then re-run ERP YAML validation against `/tmp/round-trip-yaml-validation/erp` and compare:

```text
before this step:
Unexpected property: 60
summary: 19302 error, 35577 warning
```

Expected result: `Unexpected property` decreases by `49`, from `60` to `11`. Any remaining `Unexpected property` diagnostics should belong to the excluded DCS-related group.

## Risks

The main risk is accepting too much by using loose object schemas for raw settings payloads. Keep schemas as narrow as the existing YAML contract allows.

Another risk is mixing DCS `ПараметрыДанных` fixes into this step. That would make the validation result harder to interpret, so those diagnostics stay out of scope.
