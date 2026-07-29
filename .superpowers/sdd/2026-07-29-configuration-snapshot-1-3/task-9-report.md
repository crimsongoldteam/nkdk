# Task 9 — отчёт проверки снимка конфигурации 1.3

## Исправления по review

- Общая нормализация `canonicalSnapshot13XML` удалена. `Event` и обычные
  `xr:StandardAttribute` больше не сортируются в `canonicalXML.ts`.
- Порядок событий результата sync явно проверяется по исходному YAML до
  локального семантического сравнения со старым reference XML. Отрицательный
  тест подтверждает, что перестановка событий не маскируется.
- Единственная нормализация `xr:StandardAttribute` ограничена
  `ExtDimension(Type)N` в тестах accounting register. Порядок остальных
  стандартных реквизитов сравнивается точно; отдельный тест ожидает
  rules-order `RecordType`, `Active`, `LineNumber`.
- Физически присутствующий `ExtDimension(Type)N` сохраняет пустой YAML-маркер,
  даже если его атрибуты и дочерние поля схлопнулись в значения по умолчанию.
- `exportNilValue: true` считается каноническим `xsi:nil`: снимок не сохраняет
  лишнюю entity, а exporter восстанавливает nil без reference XML. При
  существующем reference физическое отсутствие узла сохраняется.
- Единственный `componentPath` учитывается владельцем `container`; `sharedBytes`
  содержит только строки с несколькими логическими владельцами.
- XML-фикстуры не изменялись.

## RED / GREEN

- После удаления общей сортировки RED: один direct round-trip
  `metadataAccountingRegister/full.xml` на порядке `ExtDimension(Type)N` и
  шесть sync-сравнений на порядке `Event`.
- GREEN порядка: 10 файлов / 165 тестов; отрицательный тест помощника
  сравнения формы — 1/1.
- RED сохранения данных: четыре точных сбоя — потерянный
  `ExtDimensionType1`, лишняя entity для `exportNilValue`, отсутствие
  `container` и неверная сумма строк.
- GREEN сохранения данных: 3 файла / 61 тест.
- Полный прогон выявил отсутствующий вызов exporter для канонического nil без
  reference XML. После отдельного RED добавлена положительная проверка
  exporter; focused-прогон property/DynamicList/collector — 100/100.
- Граница DCS-параметра с reference другого имени уточнена: чужой
  `d6p1:Undefined` не переносится, канонический exporter создаёт `xsi:nil`.
  Итоговый focused-прогон — 4 файла / 116 тестов.
- Финальный `pnpm test`: platform `162 passed`, core `5019 passed`, mcp
  `138 passed`.

## Import `cf/doc`

- Read-only источник:
  `/Users/nikita/git/round-trip-compact/cf/doc`.
- Финальный временный Проект:
  `/private/tmp/nkdk-snapshot-task9-review-final.rdfRmI`.
- Результат MCP service:

```json
{"ok":true,"componentPath":"cf","succeeded":9937,"failed":[],"warnings":[],"configurationIndexPath":"/private/tmp/nkdk-snapshot-task9-review-final.rdfRmI/.nkdk/components/cf/configuration-index.bin"}
```

Импорт выполнен через тот же `importFromXml` с ESM-запуском
`node --import tsx/esm --input-type=module`, потому что документированный
`tsx -e` использует несовместимый CJS-режим для top-level await.

## Измерение

Логические payload не складываются с физическими секциями: они показывают
распределение кодируемых полей, а физический блок отдельно и без двойного учёта
покрывает весь файл.

```json
{
  "fileBytes": 57545376,
  "files": {
    "records": 22182,
    "payloadBytes": 266184
  },
  "entities": {
    "records": 250320,
    "basePayloadBytes": 3003840,
    "identitiesPayloadBytes": 1711060,
    "omittedChildrenPayloadBytes": 74932,
    "xmlPayloadBytes": 17832
  },
  "strings": {
    "totalBytes": 48464887,
    "sharedBytes": 1085983,
    "byOwner": {
      "container": 2,
      "files": 1403416,
      "entityBase": 43829937,
      "identities": 1652534,
      "omittedChildren": 491338,
      "xml": 1677
    }
  },
  "physical": {
    "headerBytes": 48,
    "directoryBytes": 192,
    "checksumBytes": 80,
    "sectionPayloadBytes": {
      "snapshot": 16,
      "strings": 49690247,
      "files": 354912,
      "entities": 5812456
    },
    "paddingBytes": 1687425,
    "totalBytes": 57545376
  }
}
```

Доля логических групп от `fileBytes`:

| Группа | Байты | Доля |
|---|---:|---:|
| files | 266 184 | 0,4626% |
| entity base | 3 003 840 | 5,2200% |
| identities | 1 711 060 | 2,9734% |
| omittedChildren | 74 932 | 0,1302% |
| XML | 17 832 | 0,0310% |
| строки | 48 464 887 | 84,2203% |

`sharedBytes` составляет 1 085 983 байта: 1,8872% всего файла и 2,2408%
строкового payload. Уникальный `componentPath` `cf` занимает 2 байта в
`byOwner.container` и не входит в shared.

Физический инвариант:

```text
48 + 192 + 80 + 16 + 49 690 247 + 354 912 + 5 812 456 + 1 687 425
= 57 545 376
= fileBytes
```

## Инварианты и запрещённые данные

Decoder подтвердил:

```json
{
  "specificationVersion": "1.3",
  "indexGeneration": "1",
  "files": 22182,
  "entities": 250320,
  "withIdentities": 241370,
  "withOmittedChildren": 878,
  "withXml": 8072,
  "meaningfulPayload": true,
  "sourceProjectPathsExist": true,
  "omittedChildrenKinds": ["names", "typedNames"],
  "topLevelKeys": ["componentPath", "entities", "files", "indexGeneration", "specificationVersion"],
  "sectionTypes": [1, 2, 3, 4],
  "forbiddenFields": []
}
```

В снимке нет `present`, общего order, aliases, `excludedEqualName`,
`userSettingsId`, validation, dependencies, `localDependencies` и отдельного
logical-address списка. Физически присутствуют только `SNAPSHOT`, `STRINGS`,
`FILES`, `ENTITIES`.

## Точный штатный round-trip

Команда из brief запускалась дословно в отдельном чистом detached-worktree
`/private/tmp/nkdk-task9-review-verify` на `b22a1f7ca`; XML-репозиторий
`/Users/nikita/git/round-trip-compact` до и после запусков был чист. Скрипт не
изменялся.

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-xml/round-trip.sh
```

Первый необработанный результат до установки зависимостей, exit 254:

```text
=== round-trip.sh ===
XML репо:    /Users/nikita/git/round-trip-compact
XML каталог: /Users/nikita/git/round-trip-compact/cf/doc
runner:      @nkdk/core shortRoundTripXML
mode:        single
all configs: 0
diff index:  1

[restore] Откат XML-репо к HEAD...
[round-trip] Запуск shortRoundTripXML: /Users/nikita/git/round-trip-compact/cf/doc
undefined
/private/tmp/nkdk-task9-review-verify/packages/core:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "tsx" not found
```

После `pnpm install --offline --frozen-lockfile` verify-worktree остался чист.
Повтор той же команды дошёл до штатного runner и завершился exit 1. Полный
необработанный результат:

```text
=== round-trip.sh ===
XML репо:    /Users/nikita/git/round-trip-compact
XML каталог: /Users/nikita/git/round-trip-compact/cf/doc
runner:      @nkdk/core shortRoundTripXML
mode:        single
all configs: 0
diff index:  1

[restore] Откат XML-репо к HEAD...
[round-trip] Запуск shortRoundTripXML: /Users/nikita/git/round-trip-compact/cf/doc
node:internal/process/promises:324
    triggerUncaughtException(err, true /* fromPromise */);
    ^

Error: Transform failed with 1 error:
/eval.ts:1:48: ERROR: Top-level await is currently not supported with the "cjs" output format
    at failureErrorWithLog (/private/tmp/nkdk-task9-review-verify/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js:1748:15)
    at /private/tmp/nkdk-task9-review-verify/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js:1017:50
    at responseCallbacks.<computed> (/private/tmp/nkdk-task9-review-verify/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js:884:9)
    at handleIncomingPacket (/private/tmp/nkdk-task9-review-verify/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js:939:12)
    at Socket.readFromStdout (/private/tmp/nkdk-task9-review-verify/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js:862:7)
    at Socket.emit (node:events:509:20)
    at addChunk (node:internal/streams/readable:568:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:519:3)
    at Readable.push (node:internal/streams/readable:399:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23) {
  errors: [
    {
      detail: undefined,
      id: '',
      location: {
        column: 48,
        file: '/eval.ts',
        length: 5,
        line: 1,
        lineText: 'import { shortRoundTripXML } from "@nkdk/core"; await shortRoundTripXML({ inputDir: process.argv[1], outputDir: process.argv[1] })',
        namespace: '',
        suggestion: ''
      },
      notes: [],
      pluginName: '',
      text: 'Top-level await is currently not supported with the "cjs" output format'
    }
  ],
  warnings: []
}

Node.js v26.4.0
undefined
/private/tmp/nkdk-task9-review-verify/packages/core:
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx -e import { shortRoundTripXML } from "@nkdk/core"; await shortRoundTripXML({ inputDir: process.argv[1], outputDir: process.argv[1] }) /Users/nikita/git/round-trip-compact/cf/doc
```

Штатный сценарий не дошёл до данных или diff: это bootstrap error
`tsx -e`/CJS. Временная правка скрипта не применялась и результат обходного
сценария за штатный round-trip не выдаётся.

## Активная документация и старый договор

- `.agents/architecture.md` описывает только `files` и содержательные `entity`,
  привязку worker-фрагмента к одному `targetProjectPath`, замену `entity`
  обработанного файла и атомарную публикацию.
- Validation-, dependency- и address-индексы описаны как временные результаты,
  строящиеся из актуального YAML в каждой операции.
- Из `.agents/restrictions.md` удалено устаревшее ограничение прямой
  неатомарной записи `configuration-index.bin`; ограничения транзакционности
  YAML/XML-каталогов сохранены.
- Точный `rg` из brief находит только временные `localIndexes` текущей операции,
  required identity и отрицательные тесты старых полей. Production-договор
  снимка старых секций и полей не содержит.

## Итоговые проверки

- `pnpm type-check`: PASS.
- focused порядка: `165 passed`; отрицательная проверка порядка: `1 passed`.
- focused ExtDimension/exportNil/container: `61 passed`.
- focused exporter/DCS после полного прогона: `116 passed`.
- `pnpm test`: PASS — platform `18 files / 162 tests`, core
  `667 files / 5019 tests`, mcp `24 files / 138 tests`.
- `git diff --check`: PASS.

Статус: все замечания review исправлены; импорт, измерение, инварианты,
type-check и полный тестовый прогон завершены. Поддержанный round-trip
честно заблокирован bootstrap-ошибкой штатного скрипта до доступа к данным.

## Финальная волна branch review

- `ConfigurationChildObjects` читает реальную последовательность parser
  metadata `childOrder` и передаёт экспортёру `xmlOrderedChildren`. Настоящий
  XML round-trip без нормализации сохраняет межтиповое чередование
  `Catalog/Document/Catalog`.
- Полный sync фильтрует прежние `entity` по текущему `files`: удаление YAML и
  связанных внешних файлов успешно удаляет их состояние из снимка и повышает
  `indexGeneration` ровно до следующего значения.
- `rename` зафиксирован как commit point атомарной публикации. Ошибки записи,
  file fsync, close и rename до него остаются ошибками с очисткой собственного
  temp; directory open/fsync/close после него являются необязательным усилением
  надёжности и не сообщают ложный откат уже заменённого файла.
- Два отдельных теста seed доказывают влияние байтов снимка при одинаковом
  поколении и влияние следующего `indexGeneration` при одинаковых байтах,
  адресе и виде значения.
- Проверка порядка событий формы сопоставляет группы по structural owner path,
  а элементы группы — по XML event name и `callType`; одинаковые обработчики
  разных владельцев больше не скрывают перестановку.
- `ConfigurationIndexBinding` и его публичный export удалены: поиск по
  production-коду подтвердил отсутствие потребителей. Логический договор 1.3
  и активная архитектура не изменились, поэтому `.agents` не требовали правок.

RED/GREEN:

- `ConfigurationChildObjects`: RED 1/7, GREEN 7/7.
- Удаление YAML при sync: RED 1/3, GREEN 3/3.
- Ошибка directory fsync после rename: RED 1/7, GREEN 7/7.
- Owner-scoped Event-группы: RED 1/2, GREEN 2/2.
- Объединённый focused-набор: 7 файлов / 42 теста.
- Расширенный `configurationIndex + fullSyncToXml + formSyncXML`: 33 файла /
  227 тестов.
- `pnpm type-check`: PASS.
- Финальный `pnpm test`: platform `18 файлов / 162 теста`, core
  `667 файлов / 5025 тестов`, mcp `24 файла / 138 тестов`; падений нет.
