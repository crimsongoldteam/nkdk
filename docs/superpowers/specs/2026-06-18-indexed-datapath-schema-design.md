# Исправление JSON Schema для индексированных DataPath

## Summary

ERP validation показывает 573 ошибки вида `Expected string to match '^(?:...)$'` для `ПутьКДанным`. Подтвержденный паттерн: валидные для платформы и уже поддержанные resolver пути с индексированными сегментами, например `Объект.ДебиторскаяЗадолженность[0].Партнер` и `Товары[0].СуммаСНДС`.

Проблема находится в предварительной JSON Schema: `dataPathSchema` разрешает только сегменты `Имя`, но не `Имя[0]`. Смысловая DataPath-валидация уже умеет нормализовать такие сегменты, поэтому ошибка возникает до нужного слоя проверки.

## Design

Изменить только JSON Schema для `MetadataTargetConstraint.kind === "dataPath"` в `packages/core/metadata/commonObjects/metadataTargets/schema.ts`.

Текущий сегмент пути `METADATA_NAME_PATTERN` заменить на сегмент `METADATA_NAME_PATTERN` с необязательным индексом `[\d+]`. Этот сегмент использовать и для обычного пути, и для variant-пути с `~`.

Примеры допустимых строк после изменения:

- `Список[0].Поле`
- `Объект.Товары[0].Номенклатура`
- `~Список[0].DefaultPicture`
- `~Список[0].Period~Список.Период`

Недопустимые строки остаются недопустимыми:

- `Список[].Поле`
- `Список[abc].Поле`
- `Список[0]..Поле`

## Scope

Меняется только JSON Schema. Не менять:

- `fromYAML` / `toYAML`
- `fromXML` / `toXML`
- XML-фикстуры
- resolver DataPath
- YAML-договор

MetadataTarget regex для объектов и членов не входит в этот шаг. Ошибки вроде `Task.*` / `DocumentNumerator.*` разбираются отдельно.

## Tests

Добавить или обновить тесты в `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`:

- `dataPath` schema принимает `Список[0].Поле`;
- принимает `Объект.Товары[0].Номенклатура`;
- принимает индексированные `~` variant-пути;
- отклоняет пустой индекс и нечисловой индекс.

Добавить интеграционный тест в `metadata/validation/validateForm.test.ts`, чтобы форма с `ПутьКДанным: Объект.Товары[0].Номенклатура` не получала schema-ошибку.

## Verification

Запустить:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Затем ERP validation на `/tmp/round-trip-yaml-validation/erp`.

Ожидаемый результат: группа regex-ошибок `ПутьКДанным` с индексированными сегментами снижается примерно на 573. Смысловые ошибки DataPath, если появятся после прохождения schema, разбираются отдельными шагами.
