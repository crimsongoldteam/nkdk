# NKDK MCP design

## Цель

Создать первый MCP-интерфейс NKDK как основной продукт для ИИ-агентов. MCP должен заменить CLI как агентный интерфейс, но не зависеть от `@nakidka/cli`: все операции первой версии вызывают `@nakidka/core` напрямую.

Первая версия поставляется как локальный stdio-сервер. HTTP/SSE и удалённый запуск не входят в границы задачи.

## Границы первой версии

Входит:

- пакет `packages/mcp`;
- локальный MCP stdio-сервер;
- tools: `nkdk.get_schema`, `nkdk.validate_project`, `nkdk.import_from_xml`, `nkdk.sync_to_xml`;
- prompts/resources для поставочных агентных сценариев;
- JSON-договоры входа и выхода для всех tools;
- запись файлов в `import_from_xml` и `sync_to_xml` только при `allowWrite: true`.

Не входит:

- HTTP/SSE transport;
- `inspect_project`;
- `rename_item`, `delete_item`, `generate_migration`;
- высокоуровневый write-tool для редактирования YAML;
- поставка старого каталога `/skills/**`;
- зависимость от `@nakidka/cli` или запуск CLI как подпроцесса.

## Архитектура

Пакет `packages/mcp` содержит тонкий MCP-слой и внутренний service layer:

```text
packages/mcp/
  package.json
  src/
    server.ts
    tools/
      getSchema.ts
      validateProject.ts
      importFromXml.ts
      syncToXml.ts
    services/
      getSchema.ts
      validateProject.ts
      importFromXml.ts
      syncToXml.ts
    contracts/
      common.ts
      getSchema.ts
      validateProject.ts
      importFromXml.ts
      syncToXml.ts
    guides/
      config-edit-yaml.md
      config-import-from-xml.md
      config-sync-to-xml.md
      config-validate-yaml.md
    prompts/
      configEditYaml.ts
      configImportFromXml.ts
      configSyncToXml.ts
      configValidateYaml.ts
```

`tools/*` отвечают только за MCP-регистрацию, проверку входных аргументов и возврат `structuredContent`. `services/*` вызывают `@nakidka/core` и формируют стабильный JSON-результат. Такой слой можно тестировать без MCP-протокола и позже перенести в `@nakidka/core/operations`, если CLI будет удалён окончательно.

## Tools

### `nkdk.get_schema`

JSON-аналог текущей команды `nkdk schema`.

Вход:

```ts
{
  target: string
  projectDir?: string
  format?: "summary" | "jsonSchema"
  mode?: "externalRefs" | "inline"
  keys?: true | string
  required?: boolean
  search?: string
  exact?: boolean
}
```

Правила совместимости повторяют CLI:

- `mode: "inline"` разрешён только при `format: "jsonSchema"`;
- `format: "jsonSchema"` несовместим с `keys`, `required`, `search`, `exact`;
- `required` несовместим с `search`;
- `exact` разрешён только вместе с `search`;
- пустой `search` считается ошибкой входа.

Выход:

```ts
{
  ok: true
  target: string
  format: "summary" | "jsonSchema"
  result:
    | { kind: "keys"; keys: string[] }
    | { kind: "summary"; summary: SchemaSummary | null }
    | { kind: "jsonSchema"; schema: unknown }
}
```

### `nkdk.validate_project`

Проверяет YAML-проект или один YAML-файл проекта через `validateProject` из `@nakidka/core`.

Вход:

```ts
{
  projectDir: string
  filePath?: string
}
```

Выход:

```ts
{
  ok: true
  diagnostics: Array<{
    filePath: string
    line: number
    col: number
    severity: "error" | "warning"
    message: string
  }>
  summary: {
    errors: number
    warnings: number
  }
}
```

### `nkdk.import_from_xml`

Импортирует XML-выгрузку 1С в YAML-проект через `syncConfigurationFromXML`.

Вход:

```ts
{
  xmlDir: string
  yamlDir: string
  allowWrite?: boolean
}
```

Если `allowWrite !== true`, tool не пишет файлы и возвращает структурированную ошибку `confirmation_required`.

Контекст первой версии захардкожен как в текущем CLI:

```ts
{
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
  fromXML: { forReference: false }
}
```

Выход при успешном запуске:

```ts
{
  ok: true
  succeeded: number
  failed: Array<{
    kind: string
    name: string
    parent?: string
    message: string
  }>
}
```

`ok: true` означает, что операция была выполнена. Наличие `failed` показывает частичные ошибки импорта.

### `nkdk.sync_to_xml`

Синхронизирует YAML-проект в XML-выгрузку через `syncConfigurationToXML`.

Вход:

```ts
{
  yamlDir: string
  xmlDir: string
  referenceDir?: string
  allowWrite?: boolean
}
```

Если `allowWrite !== true`, tool не пишет файлы и возвращает структурированную ошибку `confirmation_required`.

Контекст первой версии захардкожен как в текущем CLI:

```ts
{
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
  exportToXML: {
    itemsTree: [],
    configDumpInfo: new Map(),
    version: "2.20",
    context: {
      forms: [],
      templates: [],
      parentName: "",
      metadataForNumbering: []
    }
  }
}
```

Выход:

```ts
{
  ok: true
  succeeded: number
  failed: Array<{
    kind: string
    name: string
    parent?: string
    message: string
  }>
}
```

## Prompts и resources

Единственный источник правды для агентных инструкций первой версии — `packages/mcp/src/guides/**` и `packages/mcp/src/prompts/**`. Старый каталог `/skills/**` удаляется из поставки и не поддерживается как параллельный источник инструкций.

Сценарии первой версии:

```text
resource: nkdk://guides/config-edit-yaml
prompt: nkdk_config_edit_yaml

resource: nkdk://guides/config-import-from-xml
prompt: nkdk_config_import_from_xml

resource: nkdk://guides/config-sync-to-xml
prompt: nkdk_config_sync_to_xml

resource: nkdk://guides/config-validate-yaml
prompt: nkdk_config_validate_yaml
```

`nkdk_config_edit_yaml` покрывает не только добавление новых объектов, но и изменение существующих YAML-файлов по схеме. Переименование и удаление не входят в этот сценарий первой версии.

Высокоуровневый `edit_yaml` tool не создаётся: агент читает guide/prompt, получает схему через `nkdk.get_schema`, меняет YAML своими файловыми средствами и проверяет результат через `nkdk.validate_project`.

## Ошибки и JSON-договор

Основной договор результата — `structuredContent` и `outputSchema`. `content` содержит тот же JSON строкой только для совместимости MCP-клиентов, без отдельного человекочитаемого текста.

Ошибки бизнес-логики возвращаются как tool execution result:

```ts
{
  ok: false
  code:
    | "confirmation_required"
    | "invalid_arguments"
    | "not_found"
    | "core_error"
  message: string
  details?: unknown
}
```

JSON-RPC protocol errors используются только для ошибок уровня MCP-протокола: неизвестный tool, невалидная форма вызова или внутренняя авария сервера до запуска tool.

## Безопасность записи

`import_from_xml` и `sync_to_xml` не пишут файлы без `allowWrite: true`. Дополнительный флаг вроде `allowDirtyTarget` не вводится в первой версии.

Проверки «похож ли каталог на XML/YAML-проект», «есть ли незавершённые изменения», «можно ли писать поверх непустого каталога» остаются в prompt/resource-инструкциях. Агент должен выполнить эти проверки доступными ему файловыми и git-инструментами до вызова write-tool.

## Тестирование

Сервисный слой тестируется напрямую:

- `getSchema` повторяет режимы CLI `schema` и ошибки несовместимых параметров;
- `validateProject` возвращает структурированные diagnostics и summary;
- `importFromXml` и `syncToXml` не вызывают core при отсутствии `allowWrite: true`;
- `importFromXml` и `syncToXml` преобразуют `failed` из core в стабильную JSON-форму.

MCP-слой тестируется отдельно:

- сервер регистрирует 4 tools;
- сервер регистрирует 4 prompts и 4 resources;
- каждый tool имеет `inputSchema` и `outputSchema`;
- успешные результаты возвращаются в `structuredContent`;
- `content` содержит сериализованный JSON того же результата.

## Будущее расширение

После первой версии можно добавить:

- `inspect_project` как безопасный диагностический tool;
- миграционный двухшаговый сценарий вместо интерактивного CLI `generate_migration`: `detect_migration_conflicts` и `write_migration`;
- перенос service layer из `packages/mcp` в `@nakidka/core/operations`;
- HTTP/SSE transport после отдельного проектирования безопасности.
