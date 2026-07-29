# Task 8: замена entity изменённых файлов при sync

## Результат

- `mergeConfigurationIndexFragments` сохраняет `targetProjectPath` даже у
  пустого фрагмента: такой путь удаляет прежнее состояние обработанного файла.
- Worker pool передаёт координатору
  `MergedConfigurationSnapshotFragments`, а успешное задание всегда завершает
  collector вызовом `fragment(sourceProjectPath)`.
- `replaceSnapshotEntities` целиком удаляет прежние entity обработанных файлов,
  добавляет новые, отклоняет глобальный конфликт `logicalAddress` и сортирует
  результат по UTF-8.
- После успешной проверки результата координатор публикует чистый снимок 1.3:
  поколение увеличивается ровно на 1, `files` берутся из текущих хэшей,
  неизменённые entity сохраняются.
- Старые persisted-секции (`binding`, `localIndexes`, validation,
  dependencies, отдельные logical addresses) в новый снимок не переносятся.
- Профиль расширения проецирует текущие canonical metadata target из холодного
  индекса в проектные logicalAddress worker. Это устраняет разрыв
  `Catalog.…Attribute.…` / `Справочник.…Реквизит.…` без сохранения aliases.
- Оставшиеся потребители удалённого API collector/reader переведены на
  `setIdentity`, `setXmlFlag`, `setXmlValue`, `entity` и `xml`.

## Проверяемое поведение

- пустой фрагмент удаляет все прежние entity соответствующего YAML-файла;
- entity неизменённого внешнего файла переносится без изменения;
- старые entity обработанного YAML-файла исчезают;
- конфликт с entity неизменённого файла не вызывает `writeIndex`;
- ошибки worker, переноса файлов и проверки результата сохраняют прежние байты;
- параллелизм 1 и 2 даёт одинаковые байты `configuration-index.bin`;
- успешная синхронизация публикует поколение `previous + 1`.

## RED

Первый цикл:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/configurationIndex/fragment.test.ts \
  metadata/fullSyncToXml/syncConfiguration.test.ts

FAIL:
- пустой fragment терял sourceProjectPath;
- replaceSnapshotEntities отсутствовал.
```

Регрессия профиля расширения:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  -t "adopts a new current address"

1 failed: adoptedUuids был пуст для canonical current address и проектного
snapshot entity.
```

## GREEN

Основной набор Task 8:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/fullSyncToXml \
  metadata/resourceTopology/contracts.test.ts

Test Files  19 passed (19)
Tests       83 passed (83)
```

Потребители мигрированного collector/reader API:

```text
Test Files  29 passed (29)
Tests       632 passed (632)
```

Профиль и интеграция расширения:

```text
Test Files  2 passed (2)
Tests       11 passed (11)
```

## TypeScript

```text
pnpm --filter @nkdk/core type-check

exit code: 0
```

Полный `pnpm test` по указанию координатора оставлен Task 9, где он является
отдельным обязательным шагом.

## Самопроверка

- `git diff --check` — без ошибок.
- XML-фикстуры не изменялись.
- Существующий untracked
  `packages/core/metadata/appliedObjects/configuration/__fixtures__/_partial_xml_tmp/`
  не изменялся и не включается в коммит.
- Compatibility aliases и удалённые persisted-поля не добавлялись.

## Fix round 1: точные nested paths ExternalDataSource

Проверка замечания показала разрыв на смешанной цепочке canonical address:
общий member constraint понимал `Field`/`Command`, но не предшествующие им
object-path сегменты `Table`, `Cube` и `DimensionTable`. Поэтому, например,
`ExternalDataSource.Источник.Table.Таблица.Field.Поле` не проецировался в
`ВнешнийИсточникДанных.Источник.Таблица.Таблица.Поле.Поле`, и профиль не
находил UUID сохранённой worker entity.

Исправление вынесено в нейтральный helper `metadataTargets`:

- exact object paths покрывают `Table`, `Cube`, `Cube.DimensionTable` и
  `Function`;
- exact member paths покрывают поля и команды таблиц, поля dimension table,
  измерения, ресурсы и команды кубов;
- после exact paths остаются общие object/member/value constraints;
- fullSync-профиль не содержит перечня applied itemType или частных ветвлений;
- canonical entity и persisted aliases для поиска не требуются.

RED:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  -t "projects exact nested address"

Tests  6 failed | 7 skipped
```

GREEN:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  metadata/fullSyncToXml/configurationExtensionIntegration.test.ts

Test Files  2 passed (2)
Tests       17 passed (17)
```

Целевой набор Task 8 после добавления шести регрессий:

```text
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/fullSyncToXml \
  metadata/resourceTopology/contracts.test.ts

Test Files  19 passed (19)
Tests       89 passed (89)
```

```text
pnpm --filter @nkdk/core type-check

exit code: 0
```
