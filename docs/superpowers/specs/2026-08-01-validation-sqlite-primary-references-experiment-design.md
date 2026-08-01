# Эксперимент основного reference-хранилища validation в SQLite

## Цель

Проверить, ускорится ли SQLite-режим, если база `:memory:` становится единственным представлением reference-индексов и pending references первого прохода, а не параллельной BLOB-копией существующего shared graph.

Эксперимент включается только скрытым флагом `NKDK_VALIDATION_SQLITE_REFERENCES_EXPERIMENT=1`. Обычная validation и публичные договоры не меняются.

## Границы

В SQLite переносятся:

- object/member/value index entries;
- pending metadata references;
- сведения, необходимые для `notFound`, `conflict` и существующих reference-фильтров.

В существующем представлении пока остаются:

- `objectRecords`, `ownerFacts` и field indexes, необходимые для owner cache;
- form `pendingChecks` и проверка `ПутьКДанным`;
- schema- и локальные diagnostics первого прохода.

Из `objectRecords`, возвращаемых экспериментальным first pass, удаляются встроенные object/member/value entries и pending references. Из состояния properties-файла удаляются pending references. Поэтому reference-данные не дублируются в shared graph и не участвуют в обычной reference-проверке второго прохода.

Хэши, постоянный кэш на диске, частичная validation и изменение MCP-команд в эксперимент не входят.

## Хранилище

Один отдельный SQLite worker владеет `DatabaseSync(":memory:")` и одной транзакцией первого прохода.

Таблицы:

- `components(id, path)`;
- `files(id, component_id, project_path)` с уникальным путём проекта;
- `reference_entries(id, file_id, kind, canonical, result_status, result_diagnostics, member_depth, field_kind, type_kinds, type_source, has_defined_types, style_item_type)`;
- `pending_references(id, file_id, kind, canonical, display_target, constraint_kind, filters, yaml_path)`.

Пути и `componentPath` хранятся один раз через внешние ключи. Полные `target`, `objectRecords`, полные вклады и повторяющиеся массивы индексов в BLOB не сохраняются. JSON допускается только для коротких массивов `filters`, `type_kinds`, `yaml_path` и редких diagnostics ошибочной index entry.

Validation worker передают плоские строки примитивных значений ограниченными пачками. `v8.serialize` для reference-данных не используется. SQLite worker вставляет строки подготовленными запросами и подтверждает пачку только после синхронной вставки. Одновременно у producer остаётся не более двух неподтверждённых пачек.

## Разрешение ссылок

После `COMMIT` SQLite worker одним массовым запросом сопоставляет pending references с entries по `kind + canonical`.

Видимость компонентов:

- ссылка `cf` видит только `cf`;
- ссылка `cfe/<имя>` сначала видит своё расширение, затем `cf`;
- соседние расширения не видны.

Запрос выбирает минимальный доступный приоритет слоя. Ноль кандидатов означает `notFound`, один — разрешённую запись, больше одного на выбранном уровне — `conflict`; при локальном конфликте fallback в `cf` не выполняется.

SQLite worker читает результат курсором крупными пачками. Для разрешённой записи он применяет существующую семантику `directMember`, `hasType`, `stringIndexedAttribute`, `inputByStringField` и `styleItemType` к нормализованным полям. Диагностики формируются в JS прежними сообщениями и координатами. Отдельного SQL-запроса на каждую ссылку нет.

В эксперименте эта reference-проверка выполняется одним SQLite worker. Возможная параллельная обработка фильтров несколькими worker остаётся отдельной гипотезой и не входит в первый замер.

## Интеграция с validation

First pass возвращает обычные component layers без reference entries и pending references, но с `objectRecords`, очищенными от встроенных reference-массивов. Существующий shared graph продолжает обслуживать owner cache и form `pendingChecks`.

Обычный second pass запускается с отключённой metadata-reference validation и выполняет только оставшиеся проверки. Diagnostics SQLite reference-pass добавляются перед общей дедупликацией и сортировкой. Итоговый `ValidateProjectResult` не меняется.

При любой ошибке записи, `COMMIT`, SQL-разрешения или проверки счётчиков вся экспериментальная validation завершается ошибкой; частичный результат не публикуется. База закрывается после операции и на диск не сохраняется.

## Измерение

Используется только свежесобранный compiled standalone runner на `/Users/nikita/git/nkdk-yaml`, concurrency `4`, отдельный процесс на каждый запуск.

Сначала выполняется один baseline и один experimental smoke. Если совпадают итоговые diagnostics и процесс завершается без OOM, выполняются ещё по два запуска каждого режима.

Сравниваются:

- first-pass wall time;
- время SQL reference-pass;
- полное elapsed;
- Peak RSS;
- количество и размер строк SQLite;
- количество `notFound`, `conflict`, filter failures и успешных ссылок;
- итоговые diagnostics.

Гипотеза подтверждена, если средний first pass экспериментального режима не медленнее baseline более чем на 10%, все три `quick_check` возвращают `ok`, а diagnostics всех шести запусков совпадают.

## Ограничение результата

Эксперимент отвечает только на вопрос о reference-части validation. Даже успешный результат не выбирает окончательную схему постоянного кэша, периодичность backup или хранение хэшей проекта.
