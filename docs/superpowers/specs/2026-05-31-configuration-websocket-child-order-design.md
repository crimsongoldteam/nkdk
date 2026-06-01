# Дизайн: порядок WebSocketClient в Configuration ChildObjects

## Контекст

В полном YAML round-trip осталось расхождение в `Configuration.xml`.

В исходном XML `WebSocketClient` находится сразу после `WSReference`:

```xml
<HTTPService>HTTPСервисПоУмолчанию</HTTPService>
<WSReference>WSСсылкаВсеСвойства</WSReference>
<WSReference>WSСсылкаПоУмолчанию</WSReference>
<WebSocketClient>WebSocketКлиентПоУмолчанию</WebSocketClient>
<WebSocketClient>WebSocketКлиентВсеСвойства</WebSocketClient>
<EventSubscription>ПодпискаНаСобытиеВсеСвойства</EventSubscription>
```

Сейчас sync строит `ChildObjects` по `STANDARD_CHILD_OBJECT_TYPE_ORDER`, где `WebSocketClient` стоит в конце, после `IntegrationService`.
Из-за этого он переносится вниз блока `ChildObjects`.

## Решение

Переставить `WebSocketClient` в стандартном порядке типов:

```ts
"HTTPService",
"WSReference",
"WebSocketClient",
"EventSubscription",
```

То есть `WebSocketClient` должен идти между `WSReference` и `EventSubscription`.

## Границы

Входит:

- изменить `STANDARD_CHILD_OBJECT_TYPE_ORDER` в `packages/core/metadata/appliedObjects/configuration/childObjects.ts`;
- сохранить порядок имён внутри самого типа из reference, как сейчас.

Не входит:

- менять YAML-формат;
- хранить `ChildObjects` в YAML;
- менять порядок остальных типов.

## Фикстуры

Обязательно добавить/обновить проектную sync-фикстуру для конфигурации:

- reference `Configuration.xml` должен содержать `WebSocketClient` между `WSReference` и `EventSubscription`;
- YAML-проект должен содержать оба WebSocket-клиента как обычные объекты;
- ожидаемый sync-результат должен сохранять тот же порядок в `ChildObjects`.

Если текущая fixture `all` используется как источник для round-trip, достаточно проверить, что после правки `Configuration.xml` больше не даёт diff по переносу `WebSocketClient`.

## Проверка

Точечно:

```sh
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/childObjects.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Реальный сценарий:

```sh
pnpm --dir packages/cli dev sync /home/nikita/git/temp-yaml /tmp/nkdk-configuration-websocket-order --reference /home/nikita/git/round-trip/all
```

Ожидание: в `Configuration.xml` блоки `WebSocketClient` остаются между `WSReference` и `EventSubscription`.
