# FilterItem rightValue Array JSON Schema Design

## Problem

ERP validation still reports `Expected union value` for 61 DCS filter comparison items whose YAML line starts with `ЛевоеЗначение: .…`.

The field path itself is valid. The failing shape is a comparison item with `ВидСравнения: ВСписке` and array-shaped `ПравоеЗначение`:

```yaml
- ЛевоеЗначение: .Состояние
  ВидСравнения: ВСписке
  ПравоеЗначение:
    - "'Согласовано'"
    - "'Не согласовано'"
```

Existing XML/YAML import and export already support array `rightValue` for `FilterItemComparison`. The gap is only in JSON Schema: `ПравоеЗначение` is validated as a single `DcsMetadataTypedValue`, so an array is rejected.

## Goals

- Accept existing platform YAML where `FilterItemComparison.ПравоеЗначение` is an array.
- Keep YAML and XML output unchanged.
- Keep `ЛевоеЗначение: .…` behavior unchanged.
- Keep the change local to `FilterItemComparison` validation.

## Non-Goals

- Do not change shared `DcsMetadataTypedValueJSONSchema` to always accept arrays.
- Do not add warnings for these platform forms.
- Do not normalize or rewrite YAML.
- Do not change XML fixtures.
- Do not solve the remaining non-`ЛевоеЗначение` union groups in this change.

## Design

Override the JSON Schema for `FilterItemComparison.rightValue` when building `FilterItem` schema.

The override schema should accept either:

- a single `DcsMetadataTypedValueJSONSchema`;
- an array of `DcsMetadataTypedValueJSONSchema` items.

This mirrors the existing model shape and the existing XML/YAML round-trip support for `InList` filter comparisons without broadening every `DcsMetadataTypedValue` consumer in the project.

## Validation Examples

These shapes should pass:

```yaml
- ЛевоеЗначение: .Состояние
  ВидСравнения: ВСписке
  ПравоеЗначение:
    - "'Согласовано'"
    - "'Не согласовано'"
```

```yaml
- ЛевоеЗначение: .Объект.ВНА.СпособНачисленияАмортизацииМСФО
  ВидСравнения: ВСписке
  ПравоеЗначение:
    - Перечисление.СпособыНачисленияАмортизацииВНА.Линейный
    - Перечисление.СпособыНачисленияАмортизацииВНА.УменьшаемогоОстатка
```

Existing scalar forms should continue to pass:

```yaml
- ЛевоеЗначение: .Просрочен
  ПравоеЗначение: Истина
```

```yaml
- ЛевоеЗначение: .ЗастрахованныеЛица.РезультатПроверки
  ПравоеЗначение: 4
```

## Tests

Add focused tests in `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`:

- accepts `ВСписке` with string array `ПравоеЗначение`;
- accepts `ВСписке` with enumeration-reference string array `ПравоеЗначение`;
- keeps accepting scalar `ПравоеЗначение`.

After implementation, rerun ERP validation and confirm that the `ЛевоеЗначение: .…` group drops from 61 to 0. Other union groups may remain.

## Implementation Notes

The likely implementation point is `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`.

Use `createFilterItemSchemaContext` with a property schema override for the right-value property type rather than changing the shared `DcsMetadataTypedValueJSONSchema`.

If the current override mechanism cannot target only `rightValue`, add a small local schema builder for `FilterItemComparisonRules` in `filterItem/toJSONSchema.ts` while preserving the same schemas for the rest of the item.
