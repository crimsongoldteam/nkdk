# Перенос MCP-контракта компонентов

## Цель

Перенести механизм подключения компонентов из ветки `codex/component-mcp-contract` на текущий `develop`, где уже появились новые import/sync-пути, `configurationIndex` и обновленные validation refs.

MCP должен работать с корнем NKDK-проекта, внутри которого лежат компоненты 1С:

```text
projectDir/
  .nkdk/
  cf/
  cfe/<ИмяРасширения>/
  erf/<ИмяОтчета>/
  epf/<ИмяОбработки>/
```

`cf` - основная конфигурация. `cfe/*`, `erf/*` и `epf/*` - дополнительные компоненты. Если `componentPath` не передан, MCP-операции работают с `cf`.

## Согласованные решения

- `projectDir` в MCP означает корень проекта, а не каталог одного YAML-представления.
- `.nkdk` находится только в корне проекта: `projectDir/.nkdk`. У компонентов не должно быть собственных `.nkdk`; первый импорт может создать служебные файлы только в корневом `.nkdk`.
- `componentPath` - относительный путь компонента внутри проекта: `cf`, `cfe/<Имя>`, `erf/<Имя>`, `epf/<Имя>`.
- `componentPath` необязателен и по умолчанию равен `cf`, включая пишущие операции.
- `import_from_xml` импортирует один XML-компонент из `xmlDir` в один YAML-компонент `projectDir/componentPath`.
- `sync_to_xml` синхронизирует один YAML-компонент `projectDir/componentPath` в один XML-каталог `xmlDir`.
- Для `import_from_xml` и `sync_to_xml` `xmlDir` не является `xmlRootDir/componentPath`; это уже каталог XML-выгрузки или XML-результата конкретного компонента.
- При импорте из XML целевой каталог компонента должен отсутствовать или быть пустым. Импорт не должен дописывать поверх непустого компонента.
- Старый низкоуровневый MCP-договор с `yamlDir` не сохраняется.
- Core-операции на первом этапе продолжают принимать каталог одного metadata-проекта. Знание о `cf/cfe/erf/epf` живет в `packages/mcp`.
- Правки из старой ветки переносятся по смысловым блокам, а не прямым merge, потому что текущий `develop` изменил import/sync/validation-пути.

## Два механизма импорта

### Текущий механизм: готовая XML-выгрузка компонента

Пользователь или агент указывает готовую XML-выгрузку одного компонента:

```ts
{
  projectDir: string
  componentPath?: string
  xmlDir: string
  allowWrite?: boolean
}
```

MCP разрешает `projectDir + componentPath` в `componentDir` и вызывает текущий core import:

```text
xmlDir -> projectDir/(componentPath ?? "cf")
```

Этот механизм реализуется сейчас. Он не подключается к 1С, не выгружает базу во временный каталог и не импортирует набор компонентов за один вызов.

### Будущий механизм: импорт из базы

Пользователь называет базу. NKDK подключается к 1С, выгружает основную конфигурацию и связанные компоненты во временный структурированный XML-корень:

```text
xmlRootDir/
  cf/
  cfe/<ИмяРасширения>/
  erf/<ИмяОтчета>/
  epf/<ИмяОбработки>/
```

Затем NKDK импортирует нужные компоненты из этого временного XML-корня в проект. Этот режим пока не реализуется, но должен быть описан в `.agents/architecture.md` как целевая архитектура, чтобы текущий MCP-контракт не противоречил будущему подключению к базе.

## MCP-контракты

### `nkdk.import_from_xml`

```ts
{
  projectDir: string
  componentPath?: string
  xmlDir: string
  allowWrite?: boolean
}
```

Поведение:

1. Разрешить `projectDir` как корень проекта.
2. Разрешить `componentPath ?? "cf"` как каталог компонента.
3. Проверить, что служебный каталог `.nkdk` не находится внутри выбранного компонента; новые служебные файлы писать только в `projectDir/.nkdk`.
4. Если `allowWrite=true`, создать каталог компонента при необходимости.
5. Перед записью проверить, что каталог компонента пустой.
6. Вызвать core import с `inputDir=xmlDir` и `outputDir=componentDir`.
7. Вернуть текущие поля результата `develop`: `succeeded`, `failed`, `warnings`, `configurationIndexPath`, `preservedTempRoot`.

Если `allowWrite` не передан, операция возвращает `confirmation_required` и не создает каталог компонента.

### `nkdk.sync_to_xml`

```ts
{
  projectDir: string
  componentPath?: string
  xmlDir: string
  baseId?: string
  concurrency?: number
  allowWrite?: boolean
}
```

Поведение:

1. Разрешить `projectDir + (componentPath ?? "cf")` в `componentDir`.
2. Вызвать текущий core sync с `yamlDir=componentDir` и `xmlDir`.
3. Сохранить текущие параметры и результат `develop`: `baseId`, `concurrency`, `configurationIndexPath`, `warnings`, `failed`.

`sync_to_xml` работает с одним компонентом. Он не синхронизирует все компоненты проекта за один вызов и не строит `xmlRootDir/componentPath`.

### `nkdk.init_sync_state`

```ts
{
  projectDir: string
  componentPath?: string
  xmlDir: string
  allowWrite?: boolean
}
```

Операция создает состояние XML-синхронизации для выбранного компонента: `yamlDir=componentDir`, `xmlDir=xmlDir`.

### `nkdk.describe_project_structure`

```ts
{
  projectDir: string
  componentPath?: string
  structurePath?: string
  depth?: number
}
```

`structurePath` - путь по структуре хранения внутри компонента. Он заменяет старый `directoryPath`.

### `nkdk.get_schema`

```ts
{
  projectDir: string
  componentPath?: string
  metadataRef?: string
  structurePath?: string
  format?: "summary" | "jsonSchema"
  mode?: "externalRefs" | "inline"
  keys?: true | string
  required?: boolean
  search?: string
  exact?: boolean
}
```

В запросе должен быть указан ровно один источник схемы:

- `metadataRef` - логическая metadata-цель или имя схемы;
- `structurePath` - путь YAML-файла внутри выбранного компонента.

### `nkdk.validate_project`

```ts
{
  projectDir: string
}
```

На первом этапе операция валидирует только `projectDir/cf`. Валидация всех компонентов проекта и маркировка диагностик по `componentPath` остаются отдельным дизайном.

### `nkdk.rename_item` и `nkdk.find_references`

```ts
{
  projectDir: string
  componentPath?: string
  metadataRef: string
}
```

`rename_item` дополнительно принимает `newName` и `allowWrite`. MCP передает в core `projectDir=componentDir` и `path=metadataRef`.

## Component resolver

В `packages/mcp/src/services/componentResolver.ts` появляется единая граница:

- нормализует `projectDir`;
- подставляет `componentPath ?? "cf"`;
- запрещает абсолютный `componentPath` и выход через `..`;
- разрешает только корни `cf`, `cfe`, `erf`, `epf`;
- проверяет наличие корня проекта;
- запрещает служебный каталог `.nkdk` внутри компонента;
- направляет служебные файлы проекта в `projectDir/.nkdk`;
- проверяет наличие `cf`;
- возвращает `componentDir`;
- для импорта умеет создать отсутствующий каталог компонента, но только после `allowWrite=true`;
- для импорта проверяет, что целевой каталог компонента пустой перед записью.

`resolveStructurePath` отдельно нормализует путь внутри компонента и запрещает выход за пределы компонента.

## Архитектура и ограничения проекта

В будущий план реализации входят отдельные правки:

- `.agents/architecture.md`: разделить импорт из готовой XML-выгрузки компонента и будущий импорт из базы через временный `xmlRootDir`.
- `.agents/architecture.md`: уточнить, что `Корень проекта` для компонентного MCP содержит `.nkdk`, `cf`, `cfe`, `erf`, `epf`.
- `.agents/restrictions.md`: зафиксировать, что текущие MCP XML-операции не подключаются к 1С и не обрабатывают все компоненты проекта за один вызов.
- `.agents/restrictions.md`: зафиксировать, что импорт из XML требует пустой целевой каталог компонента.
- `.agents/restrictions.md`: зафиксировать, что `.nkdk` должен создаваться и использоваться в корне проекта, а не внутри компонента.

## Стратегия переноса старой ветки

Переносить:

- `componentResolver` и его тесты почти целиком;
- MCP-контракты `projectDir + componentPath`, но с учетом текущих параметров `develop`;
- сервисы `describe_project_structure`, `get_schema`, `validate_project`, `import_from_xml`, `sync_to_xml`, `init_sync_state`, `rename_item`, `find_references` как адаптеры к `componentDir`;
- README, guides, prompts и описания tools после фактического обновления контрактов.

Не переносить напрямую:

- core/cli type-check fix из `027339191`;
- правки в `packages/core/metadata/orchestration`, `packages/core/metadata/validation`, `packages/core/metadata/project`, если текущий type-check и тесты не требуют их заново;
- спецификацию YAML-заимствований расширений как часть этого переноса. Она остается отдельным следующим дизайном.

## Проверка

Минимальная проверка реализации:

- unit-тесты `componentResolver`;
- тесты MCP-контрактов на новые входные поля;
- тесты `import_from_xml` на пустой и непустой компонент;
- тесты `sync_to_xml` на сохранение `baseId`, `concurrency` и формата диагностик `develop`;
- тесты `get_schema` на `metadataRef` и `structurePath`;
- тесты `rename_item` и `find_references` на передачу `metadataRef` как `path` в core;
- `pnpm --filter @nkdk/mcp test`;
- перед закрытием задачи - `pnpm test` из корня проекта.
