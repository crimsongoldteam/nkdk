# Child File Item Names Design

## Контекст

`round-trip-yaml-fast` падает на `ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства.xml` с ошибкой:

```text
TypeError: Cannot use 'in' operator to search for 'ManagerModule' in ТаблицаВсеСвойства
```

Причина: в корневом XML внешнего источника `ChildObjects/Table` и `ChildObjects/Cube` являются строковыми ссылками на дочерние XML-файлы, а текущие правила `tables` и `cubes` объявлены как коллекции полных объектов. Общий collection importer поэтому пытается разобрать строку `ТаблицаВсеСвойства` правилом `MetadataExternalDataSourceTable`.

Сейчас это обходится функцией `omitStringChildCollectionReferencesFromXML`, которая удаляет строковые ссылки перед импортом. Это неправильная граница ответственности: корневое правило должно само описывать, что в корневом XML хранится список имён, а не полные дочерние объекты.

## Решение

Добавить общий property-тип `ChildFileItemNames` по аналогии с `ChildFormNames` и `ChildTemplateNames`.

Тип отвечает только за XML-представление списка имён в `ChildObjects`:

- `importFromXML`: принимает строку или массив строк и возвращает `string[]`;
- `exportToXML`: пишет `string[]` обратно в одноимённые XML-теги;
- YAML: тип используется как reference-only свойство и не попадает в YAML корневого объекта;
- внешние файлы дочерних объектов остаются ответственностью `childCollections` с `fileItemRule`, `nkdkDir` и `xmlDir`.

Правила `MetadataExternalDataSourceRules` меняются так:

- `tables`: `type: "ChildFileItemNames"`, `xml: "Table"`, `xmlParents: ["ChildObjects"]`;
- `cubes`: `type: "ChildFileItemNames"`, `xml: "Cube"`, `xmlParents: ["ChildObjects"]`;
- `functions` остаётся обычной вложенной коллекцией, потому что функции действительно лежат телом в корневом XML.

Правила `MetadataExternalDataSourceCubeRules` меняются так:

- `dimensionTables`: `type: "ChildFileItemNames"`, `xml: "DimensionTable"`, `xmlParents: ["ChildObjects"]`;
- `dimensions`, `resources`, `commands`, формы и макеты остаются как сейчас.

Полные правила `MetadataExternalDataSourceTableRules`, `MetadataExternalDataSourceCubeRules` и `MetadataExternalDataSourceDimensionTableRules` продолжают использоваться только для отдельных файлов через `fileItemRule`.

## Удаление костыля

`omitStringChildCollectionReferencesFromXML` должен быть удалён полностью.

Места, которые сейчас зависят от него, должны перейти на корректные правила:

- `convertAppliedObjectFromXML`;
- `syncAppliedObjectToXML` reference-импорт;
- `configuration/migrations/collectState`;
- тесты `metadataExternalDataSourceCube`.

После перехода общий импорт корневого XML больше не получает строку там, где ожидается объект, поэтому отдельный фильтр строковых ссылок не нужен.

## Поток данных

Корневой импорт `ExternalDataSource` читает список имён дочерних файлов из `ChildObjects` как `string[]` reference-only данные.

Полный convert/sync путь затем проходит `rule.childCollections`, нормализует список имён через существующий `normalizeFileItemCollectionItems`, читает отдельные XML/YAML дочерних объектов и записывает их в отдельные каталоги.

`round-trip-yaml-fast` читает только один корневой XML-файл. Поэтому он сохраняет имена дочерних file-item объектов через reference-данные, но не пытается читать `Tables/*.xml`, `Cubes/*.xml` или `DimensionTables/*.xml`.

## Проверка

Нужно покрыть:

- `ChildFileItemNames` импортирует `undefined`, строку и массив строк;
- `ChildFileItemNames` экспортирует непустой `string[]`;
- `roundTripYAMLFast` не падает и не даёт diff на корневом `ExternalDataSource` со строковыми `Table` и `Cube`;
- существующие XML round-trip тесты внешнего источника и его дочерних объектов остаются зелёными;
- полный `pnpm test` из корня проходит.

## Границы

Не меняем XML-фикстуры.

Не меняем формат отдельных YAML-файлов таблиц, кубов и таблиц измерений.

Не учим общий collection importer принимать строки как объекты: это расширило бы поведение всех коллекций и могло бы скрывать ошибки в других metadataItem.
