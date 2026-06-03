# Sync YAML -> XML without reference

## Цель

`sync` из YAML в XML должен поддерживать режим без reference для всех объектов и внешних файлов, которые сейчас используют reference-данные. В этом режиме отсутствие `referenceDir` означает пустой эталон, а не чтение из `outputDir`.

Критерий успеха текущей итерации: runner `round-trip-yaml-1c` на YAML без reference не останавливается на ошибках `ENOENT` во время `sync` и доходит до этапа запуска `ibcmd`. Ошибки загрузки `ibcmd` остаются отдельным слоем диагностики.

## Контракт

- Если `referenceDir` не передан, sync работает как экспорт новой конфигурации из YAML.
- Reference-модель, reference-внешние файлы, reference-формы, reference-подсистемы и `ConfigDumpInfo.xml` считаются отсутствующими.
- `outputDir` используется только для записи XML и состояния миграций, но не как неявный источник reference.
- Если `referenceDir` передан явно, текущее поведение round-trip с сохранением `_uuid`, порядка и неподдержанных XML-файлов сохраняется.
- Если `referenceDir` передан явно, но файла внутри него нет, конкретный файл считается отсутствующим reference; это не должно падать из-за `ENOENT`.

## Архитектура

Главное изменение в семантике должно быть сделано на границах sync-оркестраторов:

- `configuration/syncToXML.ts` не должен подставлять `outputDir` в `referenceDir`. Для миграций и структурного сравнения отсутствие reference даёт пустое XML-состояние.
- `appliedObject/syncToXML.ts` не должен подставлять `outputDir` в `referenceDir` и `externalReferenceDir`. Все чтения reference-модели и `filePath`-reference должны быть условными.
- `forms/clientApplicationForm/syncToXML.ts` без `referenceDir` должен передавать `referenceForm = undefined`, а не читать форму из будущего каталога записи.
- Дочерние sync-обработчики (`ChildFormNames`, `ChildSubsystemNames`, childCollections, preserve reference child files) должны прокидывать `undefined` как отсутствие reference, а не строить путь от `xmlDir`.
- `configDumpInfo/sync.ts` должен уметь создать `ConfigDumpInfo.xml` без reference, используя YAML-состояние и текущую модель миграций.

Правка не должна добавлять специальных знаний о формах или прикладных объектах в универсальное ядро `orchestration`. Контракт "reference может отсутствовать" передаётся через уже существующие параметры и условные чтения.

## Поток данных

1. Runner импортирует XML в YAML.
2. Runner запускает sync YAML -> XML без `referenceDir`.
3. `syncConfigurationToXML` строит YAML-состояние и пустое reference-состояние.
4. Для каждого объекта sync читает `Свойства.yaml`, импортирует модель без source/reference, генерирует XML с новыми reference-only значениями там, где они нужны.
5. Внешние файлы, формы, дочерние подсистемы и filePath-свойства пишутся только из YAML-модели. Неподдержанные файлы из reference не копируются, потому что reference отсутствует.
6. После успешного sync runner переходит к `ibcmd infobase config import`.

## Ошибки

Ошибки `ENOENT` из-за отсутствующих reference XML-файлов считаются дефектом sync-режима без reference.

Ошибки чтения YAML, некорректной модели, конфликтов миграций при явно переданном reference и ошибки `ibcmd` не маскируются. Runner должен выводить их как есть, чтобы их можно было разбирать отдельно.

## Проверка

Добавить точечные тесты:

- sync формы без `referenceDir` создаёт metadata XML и `Ext/Form.xml` без `ENOENT`;
- sync дочерних форм объекта без `referenceDir` доходит до записи форм;
- sync прикладного объекта без `referenceDir` не читает основной XML из `outputDir`;
- sync дочерних подсистем без `referenceDir` не строит reference от `xmlDir`;
- sync configuration без `referenceDir` использует пустое reference-состояние и не пытается копировать неподдержанные файлы из reference.

Проверить вручную runner на `/home/nikita/git/round-trip/all`: ожидаемый результат этой итерации — стадия sync завершается без 28 `ENOENT` по формам и выполнение доходит до `ibcmd`.
