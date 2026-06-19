# round-trip-yaml-fast design

## Цель

Добавить быстрый диагностический путь `round-trip-yaml-fast` для поиска расхождений в metadata round-trip:

```text
XML -> модель -> YAML-текст -> модель -> XML
```

Текущий `round-trip-yaml` остаётся строгой полной проверкой через файловый YAML-проект, временный XML-каталог, замену активного XML-каталога и `git diff`. Новый быстрый путь нужен для ежедневной диагностики правил metadata/YAML, когда важно быстро найти первый diff или triage-пачку без полного файлового цикла.

## Не-цели

- Не заменять полный `.agents/skills/round-trip-yaml/round-trip.sh`.
- Не проверять содержимое внешних файлов: `.bsl`, `.txt`, `.bin`, `.png` и похожих.
- Не проверять потерю файлов, которая проявляется только при полном YAML-проекте и замене XML-каталога.
- Не применять миграции YAML-проекта.
- Не писать временный XML-каталог и не изменять XML-репо.
- Не запускать 1С/`ibcmd`.

## Пользовательский вход

Добавляется CLI-команда:

```bash
nkdk round-trip-yaml-fast <xml-dir>
```

Команда выводит машинно-читаемые блоки с найденными diff'ами. Поверх неё добавляется skill:

```text
.agents/skills/round-trip-yaml-fast/
  SKILL.md
  round-trip.sh
```

Skill-скрипт читает `.env`, использует `NKDK_XML_REPO` и `NKDK_XML_DIR`, поддерживает single и triage режимы по образцу полного `round-trip-yaml`, но не требует чистого XML-репо и не оставляет diff'ы в нём.

## Ядро проверки

Для каждого поддержанного metadata XML-файла быстрый путь делает один файловый read и один XML parse. После этого используются две модели из одного parsed XML:

1. обычная модель для экспорта в YAML;
2. reference-модель через `fromXML.forReference: true` для source/reference при обратном импорте и экспорте XML.

Пайплайн одного объекта:

```text
read XML text
parse XML
importMetadataItemFromXML(parsed, normalContext) -> model
importMetadataItemFromXML(parsed, referenceContext) -> referenceModel
exportMetadataItemToYAML(model) -> yamlObject
exportToYAML(yamlObject) -> yamlText
importFromYAML(yamlText) -> yamlObjectFromText
importMetadataItemFromYAML(yamlObjectFromText, source=referenceModel) -> modelFromYAML
exportMetadataItemToXML(modelFromYAML, referenceData=referenceModel) -> xmlObject
xmlExport(xmlObject) -> xmlText
diff(originalXmlText, xmlText)
```

YAML обязательно проходит через текст. Это проверяет сериализацию YAML, кавычки, пустые значения и восстановление типов после `importFromYAML`.

## Архитектурные границы

Изменения в core должны быть точечными. Не нужно вводить виртуальную файловую систему и протаскивать её через `syncConfigurationFromXML` или `syncConfigurationToXML`.

Новый диагностический модуль может жить рядом с существующим configuration/applied-object кодом и использовать уже чистые преобразователи:

- `importMetadataItemFromXML`;
- `exportMetadataItemToYAML`;
- `importMetadataItemFromYAML`;
- `exportMetadataItemToXML`;
- `exportToYAML` / `importFromYAML`;
- `xmlExport`.

Файловая часть ограничена обходом XML-каталогов, чтением исходного XML и построением diff-отчёта. Основные файловые sync-функции остаются без изменений.

## Обход metadata

Первая версия поддерживает те же верхнеуровневые каталоги, которые уже используются в диагностике:

- `Catalogs`;
- `Documents`;
- `DocumentNumerators`;
- `Sequences`;
- `Enums`.

Команда должна опираться на зарегистрированные `TopLevelMetadataItemRules`, а не на ручную таблицу преобразований. Если у правила нет `xmlDir` или `itemTypePrefix`, оно пропускается.

Файловые дочерние metadata-объекты можно добавлять после основного прохода отдельным расширением. Первая версия фокусируется на верхнеуровневых XML-файлах, чтобы не затянуть в быстрый путь внешние файлы и сложную структуру полного sync.

## Reference/source

Reference-модель строится из того же parsed XML, что и обычная модель. Это важно по двум причинам:

- XML читается и парсится один раз;
- `exportMetadataItemToXML` получает исходные raw XML-данные, порядок и reference-only атрибуты через уже существующий механизм `forReference`.

Для `importMetadataItemFromYAML` source берётся из reference-модели. Это приближает быстрый путь к поведению полного `sync`, где YAML-значения восстанавливаются с учётом reference.

## Diff

CLI не должен менять исходный XML-каталог. Diff строится между исходной XML-строкой и сгенерированной XML-строкой в памяти.

Формат результата должен быть удобен для skill-оболочки:

```text
=== DIFF ===
INDEX: <1-based index>
FILE: <relative XML path>
XML_FILE_ABS: <absolute path>
--- DIFF ---
<unified diff>
```

Для чистого результата:

```text
=== Round-trip fast чистый: диффов нет ===
```

## Skill-оболочка

`.agents/skills/round-trip-yaml-fast/round-trip.sh` отвечает за удобство диагностики:

- читает `.env`;
- определяет активные XML-каталоги;
- вызывает `nkdk round-trip-yaml-fast`;
- поддерживает `--diff-index`;
- поддерживает `--triage --batch-size N --start-index K`;
- в single-режиме показывает один полный diff;
- в triage-режиме показывает пачку diff'ов.

В отличие от полного `round-trip-yaml`, fast-скрипт не делает `git restore`, не очищает YAML-каталог, не заменяет XML-каталог и не требует чистого XML-репо.

## Ошибки и ограничения

Если XML-файл не поддерживается правилом, команда должна пропустить его или отчитаться как unsupported без падения всего прохода.

Если один объект падает на import/export, команда должна сохранить ошибку с путём файла и продолжить обработку остальных объектов, если это triage/full scan. В single-режиме допустимо остановиться на первой ошибке, если diff ещё не найден.

Отчёт обязан явно писать, что fast-режим не проверяет внешние файлы и не заменяет полный файловый `round-trip-yaml`.

## Проверка готовности

- Добавлена CLI-команда `round-trip-yaml-fast`.
- Добавлен core-модуль быстрого in-memory round-trip без изменений основных sync-функций.
- YAML проходит через `exportToYAML` и `importFromYAML` как текст.
- XML читается один раз на объект, parsed XML используется для normal и reference моделей.
- Добавлен skill `round-trip-yaml-fast` с single и triage режимами.
- Есть тесты на чистый проход и на diff после YAML-текстового round-trip.
- Полный `pnpm test` проходит перед закрытием задачи.
