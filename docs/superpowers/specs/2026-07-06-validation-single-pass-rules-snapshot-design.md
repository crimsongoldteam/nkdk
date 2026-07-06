# Validation single-pass rules snapshot design

## Контекст

В текущей ветке валидация уже получила важные доработки: `validationSnapshotProvider`, shared reference/owner snapshots, бинарный owner snapshot, schema/AJV-оптимизации и worker-проходы через общий снимок. Эти изменения нужно сохранить.

Проблема остаётся в первом проходе. Worker читает YAML, проверяет schema, затем строит metadata/form model через `fromYAML` и сохраняет часть состояния до второго прохода. Для большого проекта это тянет лишний граф кода и удерживает лишние данные. В соседних worktree уже есть полезные идеи: compact state, `pendingReferences`, `pendingChecks`, очистка worker state и лёгкая validation-регистрация. Их нужно перенести осознанно, без отката текущих доработок `dev`.

Целевой режим: каждый YAML-файл читается и парсится один раз, модель metadata и модель формы в worker-е не строятся.

## Цель

Перевести validation worker на прямой обход `parsed.data` по JSON-совместимым снимкам правил:

- schema validation остаётся через `schemaSnapshot`;
- извлечение фактов выполняется через новый `rulesSnapshot`;
- worker не импортирует `fromYAML` и не строит модель;
- после обработки файла worker хранит только компактные факты и отложенные проверки;
- финальное разрешение ссылок и `ПутьКДанным` идёт по общему индексу без повторного чтения YAML;
- в конце реализации обязательно проверить `validate` на `/Users/nikita/git/nkdk-yaml`.

## Не входит в первый этап

- Изменение пользовательского YAML-формата.
- Удаление полной metadata-регистрации из главного процесса.
- Полный отказ от текущих shared snapshots.
- Build-time генерация standalone-валидаторов.
- Одновременная замена всего schema graph builder, если для первого переноса достаточно совместимого `schemaSnapshot`.

## Архитектура

Главный процесс остаётся местом, где допустима полная metadata-регистрация. Он строит `schemaSnapshot` и `rulesSnapshot`, затем передаёт их worker-ам.

Worker становится тонким исполнителем:

1. читает YAML-файл;
2. парсит YAML;
3. проверяет `parsed.data` по схеме из `schemaSnapshot`;
4. обходит `parsed.data` по плану из `rulesSnapshot`;
5. извлекает declared index entries, owner facts, `pendingReferences` и `pendingChecks`;
6. освобождает YAML-текст и parsed-данные файла.

После первого обхода главный поток объединяет факты в общий индекс и создаёт текущие shared snapshots. Затем worker-ы разрешают компактные `pendingReferences` и `pendingChecks` по этому индексу. Это вторая фаза вычислений, но не второе чтение YAML.

## rulesSnapshot

`rulesSnapshot` - JSON-совместимый план обхода YAML без функций и без импортов предметной области. Он строится в главном процессе из текущих `rules.ts`, project specs и регистраций.

Снимок должен описывать:

- соответствие каталога проекта и типа metadata-объекта;
- путь к имени объекта;
- коллекции, которые объявляют members: реквизиты, табличные части, измерения, ресурсы, формы, команды, макеты и другие адресуемые сущности;
- вложенные коллекции, например реквизиты табличной части;
- поля `metadataTarget` и их ограничения;
- поля `TypeDescription`;
- правила уникальности имён;
- правила `excludeIfEqualName`;
- данные владельца для `ПутьКДанным`;
- обход форм: реквизиты, элементы, колонки, дополнительные колонки, контекст таблицы и поля `ПутьКДанным`.

Worker не должен содержать частные условия по `itemType`, XML-корням, папкам вроде `Формы`/`Макеты` или типам вроде `ChildFormNames`. Такие знания должны попадать в worker только как данные `rulesSnapshot`.

## Факты первого прохода

Первый проход по файлу возвращает компактный результат:

- `diagnostics` первого уровня: syntax/schema/локальные YAML-ошибки;
- `objectIndexEntries`;
- `memberIndexEntries`;
- `valueIndexEntries`;
- owner facts для dataPath resolver-а;
- `pendingReferences`;
- `pendingChecks`.

`pendingReferences` хранят только данные, нужные для будущей проверки ссылки: `filePath`, YAML-путь, canonical key, target и constraint.

`pendingChecks` хранят только данные для отложенных проверок, например `ПутьКДанным`: `filePath`, YAML-путь, owner key, form key или другой компактный контекст, проверяемое значение и политику проверки.

Запрещено сохранять после файла:

- YAML-текст;
- полный `parsed`;
- metadata model;
- form model;
- богатые owner records с model;
- field index, который можно представить компактными owner facts.

## Совместимость с текущей веткой

Нужно сохранить текущие элементы `dev`:

- `validationSnapshotProvider`;
- shared reference snapshot;
- shared/binary owner snapshot;
- текущий путь worker second pass через shared snapshots;
- schema/AJV-доработки;
- существующий внешний контракт `validateProject`;
- CLI-команду `validate`.

Из worktree `validation-declared-index-entries` переносить только совместимые идеи и куски:

- форму `ProjectValidationFileState` без `parsed/model/formState`;
- `pendingReferences` в state properties;
- `pendingChecks` для forms;
- очистку worker state после второго прохода;
- `ownerDataPathInfo` или аналогичный компактный owner facts слой;
- `registerValidationMetadata`, если он не тянет лишние full imports и не конфликтует с текущей регистрацией.

Из worktree `validation-no-from-yaml-design` использовать как источник направления:

- `schemaSnapshot + rulesSnapshot`;
- worker без `fromYAML`;
- прямой обход `parsed.data`;
- границу, где главный процесс строит JSON-снимки из полной регистрации.

## Ошибки и диагностика

Syntax- и schema-ошибки продолжают использовать точные координаты из текущего YAML parser/schema validation.

Отложенные ошибки ссылок и `ПутьКДанным` должны указывать стабильное место: YAML-путь, canonical key или другой путь из `rulesSnapshot`. Точные `line:col` для этих ошибок желательны, но не являются блокирующим требованием первого этапа, если текущий диагностический уровень сохраняет понятный файл и путь.

Если `rulesSnapshot` не описывает нужный обход, worker должен выдавать диагностируемую внутреннюю ошибку разработки или тест должен падать. Нельзя молча добавлять частное условие в worker.

## Тестирование и проверка

Минимальная проверка:

- unit-тесты для JSON-совместимости `rulesSnapshot`: `structuredClone` и `JSON.stringify`;
- unit-тесты extractor-а на properties-файлах: object/member entries, metadata targets, unique names, `excludeIfEqualName`;
- unit-тесты extractor-а на формах: form member entry, реквизиты формы, `ПутьКДанным`, таблицы и вложенные элементы;
- существующие `packages/core/metadata/validation/*` тесты;
- CLI-тесты `validate`;
- полный `pnpm test` перед закрытием работы;
- ручная проверка `validate` на `/Users/nikita/git/nkdk-yaml`.

Для `/Users/nikita/git/nkdk-yaml` нужно зафиксировать:

- команда завершилась без падения процесса;
- число diagnostics;
- при возможности сравнение diagnostics с текущей веткой до изменения;
- профиль памяти/времени под `NKDK_VALIDATION_PROFILE=1`, если это не делает проверку чрезмерно долгой.

## Критерии успеха

- Worker не импортирует `fromYAML` для validation-прохода.
- Worker не строит metadata/form model.
- Каждый YAML-файл читается и парсится один раз за запуск validation.
- После обработки файла в worker остаются только компактные facts/checks.
- Текущие shared snapshots из `dev` продолжают использоваться.
- Существующие validation diagnostics не деградируют массово.
- `pnpm test` проходит.
- `validate /Users/nikita/git/nkdk-yaml` работает и даёт понятный результат.

## Открытые вопросы для плана реализации

- Делать ли `rulesSnapshot` сразу полным для всех metadata-объектов или начать с совместимого слоя, который покрывает текущие validation-тесты и затем расширяется.
- Нужен ли отдельный compact binary format для facts первого прохода сразу, или достаточно JSON-совместимого snapshot до измерений.
- Как именно версионировать `rulesSnapshot` для долгоживущего MCP worker-а.
- Какие диагностики считать допустимо изменёнными при первом переходе, если YAML-путь сохранён, а `line:col` пока менее точный.
