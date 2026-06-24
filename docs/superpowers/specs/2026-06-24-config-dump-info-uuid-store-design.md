# ConfigDumpInfo UUID Store Design

## Цель

Исправить генерацию `ConfigDumpInfo.xml` при YAML -> XML sync: для новых metadata-объектов и их управляемых дочерних элементов `id` в `ConfigDumpInfo` должен совпадать с UUID, записанным в XML объекта.

## Контекст

Сейчас `ConfigDumpInfo` строится отдельным шагом после успешного экспорта объектов. Для существующих объектов данные берутся из reference `ConfigDumpInfo.xml`, а для новых `buildConfigDumpInfo` генерирует отдельные UUID. Из-за этого UUID в XML объекта и `id` в `ConfigDumpInfo.xml` расходятся.

В контексте экспорта уже есть хранилище `context.exportToXML.configDumpInfo`, но оно фактически не используется как источник UUID для итогового `ConfigDumpInfo`.

## Решения

- Использовать один механизм сбора UUID: `context.exportToXML.configDumpInfo`.
- Не добавлять параллельные карты UUID и не перечитывать записанный XML ради сбора UUID.
- Для существующих и переименованных объектов приоритет остаётся у reference `ConfigDumpInfo.xml`.
- Для новых управляемых узлов UUID должен попадать в `context.exportToXML.configDumpInfo` в момент экспорта XML.
- `buildConfigDumpInfo` не должен генерировать `id` для нового управляемого узла, если этот UUID отсутствует в хранилище; отсутствие считается ошибкой.
- `configVersion` не собирается во время UUID-экспорта: для reference-записей он переносится из reference, для новых корневых записей генерируется в `buildConfigDumpInfo`.

## Хранилище

Хранилище остаётся текущего типа `ConfigDumpInfo`:

```ts
Map<
  string,
  {
    id: string
    configVersion: string
    children: Map<string, string>
  }
>
```

Ключи хранятся сразу в dumpinfo-формате, например `Catalog.Номенклатура` и `Catalog.Номенклатура.Attribute.Артикул`. Корневой UUID пишется в `entry.id`, UUID дочерних элементов пишутся в `entry.children`.

Для новых записей `configVersion` в хранилище можно оставлять пустой строкой. Финальное значение задаёт построитель `ConfigDumpInfo`.

## Архитектура

Нужен небольшой служебный слой вокруг текущего `uuid`-экспорта, а не новый сборщик:

1. Перед экспортом объекта sync-код знает текущий объект, его migration path и reference path.
2. Во время экспорта свойства `uuid` определяется итоговый UUID: значение модели, reference XML или новый UUID.
3. Этот же итоговый UUID записывается в `context.exportToXML.configDumpInfo` по dumpinfo-имени текущего объекта или дочернего элемента.
4. После экспорта всех объектов `syncConfigDumpInfoToXML` получает уже заполненное хранилище и передаёт его в `buildConfigDumpInfo`.
5. `buildConfigDumpInfo` совмещает reference `ConfigDumpInfo`, migration remap и накопленные UUID, затем формирует итоговую карту для записи XML.

## Адресация

Для записи UUID нужно определить, относится текущее свойство `uuid` к корневому объекту или к дочернему управляемому элементу.

Корневой объект определяется через текущий metadata item в `itemsTree` и правило верхнего объекта. Дочерний элемент определяется через текущий `metadataItem`, его правило и ближайший владелец в `itemsTree`.

Поддерживаемые управляемые дочерние элементы должны соответствовать уже поддержанным сегментам `ConfigDumpInfo`:

- `Attribute`
- `AddressingAttribute`
- `TabularSection`
- `Dimension`
- `Resource`

Неподдерживаемые элементы, например формы и команды, не должны записываться этим механизмом как управляемые узлы. Для них сохраняется текущее поведение переноса внешних reference-записей.

## Поток Данных

Для существующего объекта:

1. Reference XML даёт UUID при экспорте объекта.
2. UUID записывается в XML.
3. Этот же UUID записывается в `context.exportToXML.configDumpInfo` через тот же механизм, что и UUID новых объектов.
4. `buildConfigDumpInfo` всё равно выбирает reference `ConfigDumpInfo` как приоритетный источник `id` и `configVersion`.

Для нового объекта:

1. Reference-записи нет.
2. `uuid`-экспорт генерирует новый UUID.
3. Новый UUID записывается в XML и в `context.exportToXML.configDumpInfo`.
4. `buildConfigDumpInfo` берёт `id` из хранилища и генерирует новый `configVersion`.

Для переименованного объекта:

1. Migration remap связывает текущий путь с reference-путём.
2. UUID и `configVersion` берутся из reference `ConfigDumpInfo`.
3. Имя записи и имена managed-children меняются на текущие dumpinfo-имена.

## Ошибки

Если `yamlState` содержит новый управляемый узел, для которого нет reference-записи и нет UUID в `context.exportToXML.configDumpInfo`, sync должен завершиться ошибкой `configDumpInfo`. Это защищает от скрытой повторной генерации UUID и от рассинхронизации XML с `ConfigDumpInfo`.

Если UUID нельзя адресовать в dumpinfo-имя, механизм не должен молча писать некорректную запись. Для неподдерживаемых managed-сегментов ошибка должна быть явной.

## Тестирование

Нужны проверки на двух уровнях:

- Юнит-тест `buildConfigDumpInfo`: новый объект и новый реквизит получают `id` из переданного хранилища, а не из собственного генератора.
- Юнит-тест `buildConfigDumpInfo`: новый управляемый узел без UUID в хранилище падает с понятной ошибкой.
- Интеграционный тест `syncConfigurationToXML`: новый справочник с реквизитом получает одинаковые UUID в объектном XML и `ConfigDumpInfo.xml`.
- Интеграционный тест `syncConfigurationToXML`: переименование продолжает переносить `id/configVersion` из reference `ConfigDumpInfo`.
- При необходимости отдельный тест для табличной части, измерения или ресурса, чтобы покрыть не только обычный реквизит.

Перед закрытием задачи нужно запустить focused-тесты по `configDumpInfo` и `syncConfigurationToXML`, затем общий `pnpm test`.

## Вне Границ

- Не хранить UUID в YAML-модели.
- Не менять XML-фикстуры как источник истины.
- Не добавлять второй постоянный формат для UUID-сбора.
- Не менять поведение форм, команд и других внешних entries, кроме сохранения существующего переноса reference-записей.
