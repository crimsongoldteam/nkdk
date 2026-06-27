# implicitValueYAML Inventory Design

## Goal

Find metadata rules where `implicitValueYAML` should be reviewed for `boolean` and `SystemEnumeration` properties, then give the team a working Google Sheets inventory for triage.

Target spreadsheet:
https://docs.google.com/spreadsheets/d/1wShpcoPxHR4ZO3SsxlzNue2jfN9BeZZjrJH9n5mxz08/edit

## Scope

The inventory scans `packages/core/metadata/**/rules.ts` and selects property-rule object literals where:

- `type` is `"boolean"` or `"SystemEnumeration"`;
- `implicitValueYAML` is absent;
- nested helper objects such as `metadataTarget.filters` are excluded because they are not metadata property rules.

The first pass does not change TypeScript rules and does not infer platform defaults when no local default is present.

## Spreadsheet Shape

The main sheet is `К заполнению`.

Columns:

- source location: `Зона`, `Файл`, `Строка`, `Путь правила`, `Поле`;
- rule identity: `Тип`, `typeSE`, `YAML`, `XML`;
- known defaults and flags: `defaultValueXML`, `defaultValueYAML`, `toYAML`, `fromYAML`, `toEnterprise`;
- triage fields: `Статус`, `Кандидат implicitValueYAML`, `Источник кандидата`, `Решение`, `Комментарий`.

The sheet has a frozen header row and a filter over the table.

The `Сводка` sheet stores aggregate counts by area, type, status, and whether a candidate value can be copied from an existing default.

## Candidate Rules

If `defaultValueYAML` is present, it becomes the candidate `implicitValueYAML` value.

If `defaultValueYAML` is absent and `defaultValueXML` is present, `defaultValueXML` becomes a candidate, but still needs review because YAML representation can differ for some values.

If neither default exists, the row remains without a candidate and must be checked against the usual metadata sources: current `minimal.xml`, XSD/XDTO default, then direct neighbors.

Rows with `toYAML: false`, `fromYAML: false`, or `toEnterprise: false` are not auto-approved. They are marked for a separate decision because hidden or runtime-only fields may not need YAML filtering in the same way.

## Current Findings

The table contains 422 rows requiring review:

- `appliedObjects`: 56;
- `commonObjects`: 38;
- `forms`: 328.

By type:

- `boolean`: 277;
- `SystemEnumeration`: 145.

There are 73 rows with an initial candidate from an existing default and 349 rows without a candidate.

## Next Step

Use the spreadsheet as the review queue. The recommended first implementation batch is rows with `Источник кандидата = defaultValueXML` or `defaultValueYAML`, excluding rows marked `скрыто, проверить` and `runtime-only, проверить`.
