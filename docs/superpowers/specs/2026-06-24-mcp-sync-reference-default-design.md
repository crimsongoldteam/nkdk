# MCP sync reference default design

## Цель

Для MCP tool `nkdk.sync_to_xml` каталог reference должен совпадать с каталогом XML, если пользователь не указал reference явно.

Это сохраняет ожидаемое поведение синхронизации: при записи YAML обратно в XML генератор получает текущую XML-выгрузку как reference и может сохранять порядок, UUID, внешние файлы и прочие данные, которые не описаны явно в YAML.

## Границы

Входит:

- только MCP tool `nkdk.sync_to_xml`;
- сохранение `referenceDir` необязательным во входном договоре MCP;
- вычисление эффективного `referenceDir` внутри MCP service перед вызовом core;
- тесты на умолчание и на явное значение `referenceDir`.

Не входит:

- изменение CLI-команды `nkdk sync`;
- изменение `@nakidka/core`;
- изменение XML-фикстур;
- изменение схемы входа так, чтобы `referenceDir` стал обязательным.

## Дизайн

Контракт `packages/mcp/src/contracts/syncToXml.ts` оставляет `referenceDir` необязательным:

```ts
referenceDir: z.string().min(1).optional()
```

Сервис `packages/mcp/src/services/syncToXml.ts` перед вызовом `syncConfigurationToXML` вычисляет:

```ts
const referenceDir = input.referenceDir ?? input.xmlDir
```

Затем core всегда получает `referenceDir`.

Если пользователь явно передал `referenceDir`, используется он. Если не передал, используется `xmlDir`. Сообщение `confirmation_required` продолжает отражать исходный ввод пользователя, поэтому `details.referenceDir` может быть `undefined`.

## Поток данных

1. MCP client вызывает `nkdk.sync_to_xml` с `yamlDir`, `xmlDir`, необязательным `referenceDir` и `allowWrite`.
2. Если `allowWrite !== true`, сервис возвращает `confirmation_required` без вызова core.
3. Если запись разрешена, сервис вычисляет эффективный `referenceDir`.
4. Сервис вызывает `syncConfigurationToXML` с `inputDir: yamlDir`, `outputDir: xmlDir`, `referenceDir`.
5. Успехи и ошибки core преобразуются в текущий JSON-ответ MCP.

## Ошибки

Новых типов ошибок не требуется.

Пустой `referenceDir` по-прежнему отсекается входной схемой, если параметр передан. При отсутствии `referenceDir` сервис использует непустой `xmlDir`, который уже обязателен схемой.

## Проверка

Тесты `packages/mcp/src/services/syncToXml.test.ts` должны покрывать:

- без `referenceDir` core вызывается с `referenceDir: xmlDir`;
- с явным `referenceDir` core вызывается с явным значением;
- без `allowWrite` core не вызывается, существующее поведение сохраняется.
