# ConfigDumpInfo в XML-экспорте

Дата: 2026-05-28

## Цель

`ConfigDumpInfo.xml` не должен храниться в YAML-проекте. При этом полный round-trip не должен удалять этот файл, а XML-экспорт должен обновлять его под текущее состояние YAML: добавлять новые объекты и подчинённые элементы, сохранять идентификаторы существующих записей и учитывать переименования.

## Источники

- `/Users/nikita/git/1c_res/xcf_dump_info.xsdconfig_root.res` - XSD для `ConfigDumpInfo.xml`.
- `/Users/nikita/git/1c_res/model.xdtobackend_root.res` - XDTO-модель того же пространства имён.
- `/Users/nikita/git/clean_cf/ConfigDumpInfo.xml` - пустая конфигурация с `<ConfigVersions/>`.
- `/Users/nikita/git/roundTripElements/ConfigDumpInfo.xml` - полный набор типовых записей.
- `/Users/nikita/git/roundTripElements/ext/ConfigDumpInfo.xml` - пример `ConfigDumpInfo.xml` внутри расширения.
- `packages/core/metadata/appliedObjects/configDumpInfo/*` - текущие `fromXML`/`toXML` и тип `ConfigDumpInfo`.
- `packages/core/metadata/appliedObjects/configuration/migrations/*` - текущая карта переименований `currentPath -> referencePath`.

## Решение

Добавить служебный слой `ConfigDumpInfo` на этапе `syncConfigurationToXML`. Файл не участвует в `syncConfigurationFromXML`, не экспортируется в YAML и не становится metadataItem. Это отдельный XML-результат, который строится из reference-файла, текущего YAML-состояния и результата применения миграций.

Для существующей записи берём `id` и `configVersion` из `referenceDir/ConfigDumpInfo.xml`. Для новой записи генерируем:

- `id` - UUID;
- `configVersion` - 40 hex-символов, как в реальных выгрузках 1С.

`ConfigDumpInfo.xml` записывается в `outputDir/ConfigDumpInfo.xml` после успешного построения XML-моделей и добавляется в список ожидаемых файлов, хотя текущая очистка метаданных корень XML не удаляет.

## Переименования

Файл `ConfigDumpInfo.xml` хранит только имена формата 1С:

```text
Catalog.Номенклатура.Attribute.Артикул
Catalog.Номенклатура.TabularSection.Состав.Attribute.Количество
```

Русские пути вида `Справочник.Номенклатура.Реквизит.Артикул` используются только внутри переходника к существующим миграциям. Алгоритм:

1. Для текущего YAML-элемента строится внутренний миграционный путь.
2. По `referencePathByCurrentPath` ищется старый путь.
3. Старый и текущий пути переводятся в имена `ConfigDumpInfo`.
4. Если старая запись есть в reference-карте, её `id/configVersion` переносятся на новое имя.
5. Если старой записи нет, создаётся новая запись.

Так переименование объекта или реквизита сохраняет старый `id`, но в итоговый XML попадает только новое имя 1С.

## Границы Первой Версии

В первой версии экспорт обновляет записи для элементов, которые уже представлены в текущем структурном состоянии и миграциях:

- верхнеуровневые объекты из `TopLevelMetadataItemRules`;
- `Attribute`;
- `AddressingAttribute`;
- `TabularSection`;
- реквизиты табличных частей;
- `Dimension`;
- `Resource`.

Существующие записи reference-файла для внешних XML/BSL-частей, форм, команд, макетов, справки и других версионируемых файлов сохраняются, если их владелец остаётся в целевой конфигурации и запись не противоречит переименованному пути. Новые записи для таких внешних файлов отдельно не выводятся в этой задаче.

Удалённые объекты и их дочерние записи не попадают в итоговый `ConfigDumpInfo.xml`. Если объект переименован, старая запись не дублируется: она переносится под новое имя.

## Поток Данных

`syncConfigurationToXML` уже вычисляет:

- `referenceState` из XML;
- `yamlState` из YAML;
- `migrationResult.referencePathByCurrentPath`;
- набор успешных задач экспорта.

После успешного экспорта метаданных добавляется шаг `writeConfigDumpInfoToXML`:

1. Прочитать `referenceDir/ConfigDumpInfo.xml`, если он есть.
2. Если файла нет, начать с пустой карты.
3. Построить список целевых `ConfigDumpInfo`-имён из `yamlState`.
4. Для каждого целевого имени найти reference-запись через карту миграций.
5. Сохранить существующие `id/configVersion` или сгенерировать новые.
6. Сохранить допустимые reference-записи для внешних частей живых владельцев.
7. Записать `ConfigDumpInfo.xml` с корнем `ConfigDumpInfo`, `format="Hierarchical"` и `version` из контекста.

Пустая конфигурация должна давать валидный XML с `<ConfigVersions/>`, как в `/Users/nikita/git/clean_cf/ConfigDumpInfo.xml`.

## Ошибки

Если `referenceDir/ConfigDumpInfo.xml` отсутствует, это не ошибка: файл строится с нуля.

Если reference-файл есть, но не парсится как `ConfigDumpInfo`, `syncConfigurationToXML` возвращает ошибку в общей модели `ConfigurationSyncResult`, чтобы пользователь не получил частично недостоверный XML.

Если для типа из `yamlState` нет соответствия имени 1С, экспорт должен упасть с явной ошибкой. Молчаливый пропуск поддержанного YAML-объекта опаснее, потому что ломает инкрементальную выгрузку.

## Тестирование

Нужны точечные тесты:

- импорт пустого `<ConfigVersions/>` и обратный экспорт без `Metadata`;
- `syncConfigurationToXML` не удаляет `ConfigDumpInfo.xml`;
- новый объект получает новую запись с UUID и 40-hex `configVersion`;
- новый реквизит существующего объекта добавляется как дочерний `Metadata`;
- переименование объекта сохраняет `id/configVersion` старой записи и пишет новое имя;
- переименование реквизита сохраняет старый `id`;
- удалённый объект и его дочерние записи исчезают;
- существующие внешние записи живого владельца сохраняются из reference-файла.

После точечных тестов нужно запустить `round-trip-yaml` на конфигурации, где `ConfigDumpInfo.xml` сейчас остаётся среди первых diff'ов, и затем обязательный `pnpm test` из корня перед закрытием задачи.
