# NKDK MCP

Metadata tools одного MCP-процесса используют один лениво создаваемый `ProjectStateService`. Рабочее состояние всего проекта (`cf` и все `cfe/<Имя>`) находится в общих двоичных буферах; восстанавливаемый снимок атомарно сохраняется в `projectDir/.nkdk/cache/project-state.bin` за нейтральными договорами core.

## Большие результаты diagnostics

`validate_project`, `rebuild_project_cache`, `import_from_xml`, `sync_to_xml`, `rename_item` и `find_references` возвращают общий набор полей:

- `summary`: полное число ошибок и предупреждений, а также число показанных и скрытых записей;
- `diagnostics`: не более 100 первых записей общим объёмом не более 512 КиБ;
- `truncated`: признак наличия полного отчёта;
- `report`: ссылка на JSONL-файл полного результата, если предел превышен.

Полный отчёт атомарно публикуется в `projectDir/.nkdk/reports`. Каждая строка содержит одну diagnostic либо ссылку; прежний отчёт той же операции удаляется только после успешной публикации нового. Текст MCP-ответа содержит краткую сводку и ссылку на ресурс, но не повторяет `structuredContent`.

## Validation и `ignoreValidationErrors`

`nkdk.validate_project` принимает ровно корень проекта:

```json
{ "projectDir": "/path/to/project" }
```

Ключа отдельного файла или компонента у validation нет. Инструмент всегда актуализирует и проверяет весь проект.

Параметр `ignoreValidationErrors` поддерживают только следующие операции:

- `nkdk.sync_to_xml`: обязательны `projectDir` и `xmlDir`; необязательны `componentPath` (по умолчанию `cf`), `concurrency`, `allowWrite` и `ignoreValidationErrors`;
- `nkdk.find_references`: обязательны `projectDir` и `metadataRef`; необязательны `componentPath` (по умолчанию `cf`) и `ignoreValidationErrors`;
- `nkdk.rename_item`: обязательны `projectDir`, `metadataRef` и `newName`; необязательны `componentPath` (по умолчанию `cf`), `allowWrite` и `ignoreValidationErrors`.

Например:

```json
{
  "projectDir": "/path/to/project",
  "componentPath": "cf",
  "metadataRef": "Справочник.Товары",
  "ignoreValidationErrors": true
}
```

Значение `true` разрешает продолжить действие при обычных error-diagnostics, но не пропускает актуализацию или validation и не скрывает diagnostics. Техническая ошибка блокирует действие при любом значении. Переименование проверяет проект и до, и после записи.

`nkdk.sync_to_xml` планирует операцию при `allowWrite`, отличном от `true`, и формирует XML при `allowWrite: true`. Он всегда обрабатывает полный выбранный компонент; частичная синхронизация изменившихся файлов не реализована.

## Сброс и перестроение

`nkdk.reset_project_cache` принимает только `projectDir` и обязательное подтверждение записи:

```json
{ "projectDir": "/path/to/project", "allowWrite": true }
```

Инструмент возвращает `{ "ok": true, "reset": true }`, закрывает состояние проекта в памяти и удаляет только `.nkdk/cache/project-state.bin`. Validation не запускается; YAML и файл индекса конфигурации не изменяются.

`nkdk.rebuild_project_cache` имеет тот же строгий вход:

```json
{ "projectDir": "/path/to/project", "allowWrite": true }
```

Он строит отдельное полное состояние, выполняет validation и после успешной технической фиксации атомарно заменяет активное состояние и дисковый снимок. Успешный ответ содержит `ok: true`, общие поля ограниченной выдачи diagnostics и статистику `hashedFiles`, `parsedYamlFiles`, `changedFiles`, `deletedFiles`; обычные diagnostics не отменяют перестроение.
