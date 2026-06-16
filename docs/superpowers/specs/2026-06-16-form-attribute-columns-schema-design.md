# Form Attribute Columns Schema Design

## Context

ERP YAML validation reports `5534` `Unexpected property` diagnostics. All sampled diagnostics are in `Форма.yaml` files under form `Реквизиты`.

The recurring shape is already part of the YAML contract:

```yaml
Реквизиты:
  Таблица:
    Тип: ТаблицаЗначений
    Колонки:
      Колонка:
        Тип: Строка
```

and:

```yaml
Реквизиты:
  Объект:
    Тип: ДокументОбъект.АвансовыйОтчет
    ДополнительныеКолонки:
      Объект.Товары:
        Колонка:
          Тип: Строка
```

The model and YAML import/export code already support these fields:

- `packages/core/metadata/forms/commonObjects/formAttribute/types.ts` includes `Колонки` and `ДополнительныеКолонки`.
- `fromYAML.ts` imports both fields manually because it needs reference/source-aware behavior.
- `toYAML.ts` exports both fields through registered type rules.
- `rules.ts` marks `columns` and `additionalColumns` with `fromYAML: false`, so generic schema export omits them from `FormAttribute`.

This makes generated YAML valid for the converter but invalid for the new YAML validator.

## Goal

Make YAML validation accept form attribute columns that are already supported by the form attribute YAML contract.

Success criteria:

- `FormAttribute` JSON Schema accepts `Колонки`.
- `FormAttribute` JSON Schema accepts `ДополнительныеКолонки`.
- The validation command reports fewer `Unexpected property` diagnostics on generated ERP YAML.
- Existing import/export behavior for form attributes stays unchanged.

## Non-Goals

- Do not change XML fixtures.
- Do not change the YAML shape.
- Do not change `ПутьКДанным` validation.
- Do not fix metadataTarget diagnostics for form references.
- Do not remove `fromYAML: false` from `columns` or `additionalColumns` unless implementation proves the schema-only path impossible.

## Design

Implement a schema-only fix in `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`.

`exportFormAttributesToJSONSchema` should keep returning a record of `FormAttribute` schemas. The per-attribute schema should be based on `exportMetadataItemToJSONSchema(FormAttributeRules)`, then explicitly extended with:

- `Колонки`: schema produced by the registered `FormAttributeColumns` JSON Schema exporter.
- `ДополнительныеКолонки`: a record keyed by table path, where each value uses the same `FormAttributeColumns` schema.

This keeps the generic rules untouched and makes the exception local to the type that already has custom YAML import/export logic.

The column schema itself should continue to come from `FormAttributeColumnRules`. This keeps validation for column fields strict: `Заголовок`, `Тип`, `Просмотр`, `Редактирование`, `ПроверкаЗаполнения`, and `ФункциональныеОпции` remain checked.

## Error Handling

If a column object contains an unsupported key, validation should still report `Unexpected property` for that column.

If `ДополнительныеКолонки` has a non-object table value, validation should report a schema error.

If `Колонки` or `ДополнительныеКолонки` are absent, existing form attribute YAML remains valid.

## Testing

Add focused tests around `exportFormAttributesToJSONSchema`:

- accepts a form attribute with `Колонки`;
- accepts a form attribute with `ДополнительныеКолонки`;
- rejects an unsupported key inside a column object.

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Then re-run ERP YAML validation:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm -s --dir /home/codexwsl/nkdk/packages/cli exec tsx src/cli.ts validate /tmp/round-trip-yaml-validation/erp'
```

Compare the new `Unexpected property` count with the baseline:

```text
Unexpected property: 5534
summary: 24776 error, 35577 warning
```

## Risks

The main risk is accidentally weakening form attribute validation too much. The implementation should avoid broad `additionalProperties: true` and should reuse strict `FormAttributeColumn` schemas.

Another risk is creating recursion through nested column `Колонки`. The current YAML type allows nested `Колонки` on `FormAttributeColumnYAML`, but the schema generated from `FormAttributeColumnRules` does not intentionally model recursive columns. The first fix should only validate top-level form attribute `Колонки` and `ДополнительныеКолонки`, because that matches the observed ERP diagnostics and avoids introducing recursive schema complexity.
