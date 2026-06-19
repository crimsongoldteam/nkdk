# round-trip-yaml-fast: полное покрытие форм и file-item объектов

## Цель

`round-trip-yaml-fast` должен быстро проверять тот же набор XML-единиц, который определяется штатной структурой metadata rules:

- top-level metadataItem XML;
- дочерние file-item XML из `childCollections` с `fileItemRule`, например `Tables/*.xml`, `Cubes/*.xml`, `DimensionTables/*.xml`;
- все формы `Forms/<Форма>/Ext/Form.xml` для top-level и вложенных file-item объектов;
- metadata XML формы `Forms/<Форма>.xml`, потому что форма round-trip состоит из пары `Forms/<Форма>.xml` и `Forms/<Форма>/Ext/Form.xml`.

Fast-проверка не должна запускать полный `nkdk import` и писать YAML-файлы. Общим источником правды с `nkdk import` должны быть `MetadataItemRule.childCollections`, `fileItemRule`, `xmlDir` и `ChildFormNames`.

## Архитектура

В `roundTripYAMLFast` нужен отдельный рекурсивный сборщик входов. Он стартует от `Configuration.xml` и `TopLevelMetadataItemRules`, затем для каждого найденного metadata item:

1. добавляет текущий XML как `metadata` entry;
2. проверяет свойства rule на `ChildFormNames` и добавляет формы из соответствующего `Forms` каталога;
3. проходит по `rule.childCollections`;
4. для коллекций с `fileItemRule` и `xmlDir` вычисляет путь тем же способом, что import/sync: через `resolveChildCollectionDir` и правила `xmlDir`;
5. если дочерний XML существует, добавляет его как отдельный `metadata` entry и рекурсивно обходит его rule.

Сборщик не должен использовать общий glob по всем XML. Это сохранит диагностику управляемой: проверяются только XML, для которых есть правило и штатный путь в структуре metadata.

## Data Flow

Для top-level XML сохраняется текущий цикл:

`XML text -> parsed XML -> model -> YAML text -> model -> XML text -> diff`

Для дочерних file-item XML используется тот же цикл, но с `fileItemRule` и корректным `parentName`. Данные дочерних file-item не должны требовать предварительного полного import родителя в YAML-файлы.

Для формы сохраняется текущий форменный цикл:

`readFormFromXML -> exportClientApplicationFormToYAML -> importClientApplicationFormFromYAML -> exportFormMetadataToXML/exportClientApplicationFormToXML -> diff`

При обходе вложенных file-item форм `formsDir` должен указывать на `.../<file-item>/Forms`, а `parentName` должен соответствовать владельцу формы.

## Ошибки и вывод

Ошибки отдельных entries продолжают попадать в `result.errors`, не прерывая проверку всего каталога.

CLI уже печатает:

- `checked`;
- `diffs`;
- `errors`;
- `DIFF_COUNT`.

Обёртка `.agents/skills/round-trip-yaml-fast/round-trip.sh` должна дополнительно выводить `checked`, чтобы чистый быстрый результат был проверяемым по объёму.

## Тестирование

Нужны точечные тесты `roundTripYAMLFast`:

- top-level объект с формой остаётся покрытым;
- внешний источник данных с `Tables`/`Cubes` добавляет дочерние file-item XML как отдельные entries;
- вложенные формы `Tables/<name>/Forms/<form>/Ext/Form.xml` и `Cubes/<name>/Forms/<form>/Ext/Form.xml` попадают в проверку;
- ещё один уровень вложенности `Cubes/<name>/DimensionTables/<name>.xml` покрывается рекурсией;
- shell wrapper выводит `checked`.

Итоговая проверка перед закрытием задачи:

- точечный `vitest` для `roundTripYAMLFast`;
- запуск `/.agents/skills/round-trip-yaml-fast/round-trip.sh`;
- `pnpm test` из корня.
