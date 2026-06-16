# Удаление graph-среза

## Контекст

В репозитории есть отдельный пакет `packages/graph` для записи graph-модели в FalkorDB. Сейчас он используется CLI-командами `update-graph` и `watch`, а `packages/core` содержит отдельный слой построения graph-модели: `metadata/graphImport`, `metadata/orchestration/buildGraph*`, `importMetadataFileWithGraph`, `buildGraphFromModel` и набор `graphFromModel`-регистраций.

Graph-направление больше не нужно. Сохранение только типов graph-модели в `core` не требуется.

## Решение

Полностью удалить graph-срез из репозитория:

- удалить пакет `packages/graph`;
- удалить CLI-команды `update-graph` и `watch`, их вспомогательные модули и тесты;
- удалить graph-слой из `packages/core`, включая публичные экспорты graph API;
- убрать зависимости, path alias и lockfile-записи, связанные с `@nakidka/graph`, `falkordb` и `testcontainers`;
- сохранить обычные XML/YAML/валидационные возможности проекта без изменений.

## Границы

Входит в работу:

- `packages/graph/**`;
- `packages/cli/src/commands/updateGraph*`, `packages/cli/src/commands/watch*`, `packages/cli/src/graph/**` только если модуль обслуживает исключительно graph-команды;
- graph-экспорты из `packages/core/index.ts`;
- graph-связанные поля в общих типах контекста;
- `packages/core/metadata/graphImport/**`;
- `packages/core/metadata/orchestration/buildGraph/**`;
- `packages/core/metadata/orchestration/importMetadataFileWithGraph*`;
- `packages/core/metadata/orchestration/buildGraphFromModel*`;
- файлы `graphFromModel.ts` и их тесты, если они обслуживают только удаляемый graph-срез;
- зависимости и настройки workspace.

Не входит в работу:

- изменение XML-фикстур;
- изменение fromXML/toXML/fromYAML/toYAML-правил ради попутной чистки;
- переосмысление YAML-контракта;
- удаление файлов, где слово `graph` является частью предметного имени 1С, например `graphicalSchemaField` или `geographicalSchemaField`.

## Архитектура после удаления

`packages/core` остаётся библиотекой импорта, экспорта, YAML/XML round-trip, схем и валидации. В orchestration не остаётся отдельного пути построения graph-модели и состояния `GraphBuilder`.

`packages/cli` больше не предоставляет команды, которым нужна внешняя graph-БД. Команды `import`, `sync`, `short-round-trip-test`, `schema`, `validate`, `rename`, `delete`, `generate-migration` продолжают работать.

## Ошибки и совместимость

Это намеренно несовместимое изменение для пользователей `nkdk update-graph`, `nkdk watch` и публичных API `buildGraph` / `buildGraphForChangedFile` / `importMetadataFileWithGraph`. Миграции внутри кода нет: эти возможности считаются удалёнными.

При удалении важно не оставить полу-живые заглушки команд: отсутствующая команда должна быть видна через обычный список команд CLI, а не падать во время выполнения.

## Проверка

Минимальная проверка реализации:

- `pnpm test` из корня;
- поиск по репозиторию на остаточные ссылки `@nakidka/graph`, `packages/graph`, `falkordb`, `testcontainers`, `buildGraph`, `GraphBuilder`, `importMetadataFileWithGraph`;
- ручная проверка, что совпадения `graphicalSchemaField` и `geographicalSchemaField` не относятся к удаляемому срезу.
