# Task 9 — отчёт проверки снимка конфигурации 1.3

## RED / GREEN

- RED 1: `measure.test.ts` завершился с `1 failed, 3 passed`, потому что
  `measure-configuration-snapshot.mjs` ещё отсутствовал.
- GREEN 1: focused-прогон измерителя завершился с `4 passed`.
- RED 2: документированная команда `pnpm ... -- <path>` передала `--`
  Node-скрипту; valid snapshot завершился с кодом 1.
- GREEN 2: скрипт принимает необязательный CLI-разделитель `--`, после чего
  focused-прогон снова завершился с `4 passed`.
- Deferred minors Task 7: из заглушки координатора удалено устаревшее
  верхнеуровневое `localDependencies`; добавлен проход пустого фрагмента через
  настоящий Piscina worker. Совместный focused-прогон измерителя и import-тестов:
  `37 passed`.
- Полный прогон выявил устаревшие ожидания порядка XML-коллекций и несколько
  потерянных XML-состояний. Общие эвристики по `defaultValueXML` /
  `implicitValueYAML` не добавлялись: состояния сохраняются только явными
  rules или регистрациями конкретных типов.
- Финальный GREEN: `pnpm test` — platform `162 passed`, core `5016 passed`,
  mcp `138 passed`.

## Import `cf/doc`

- Read-only источник:
  `/Users/nikita/git/round-trip-compact/cf/doc`.
- Временный Проект:
  `/private/tmp/nkdk-snapshot-task9-final3.mImYzj`.
- Результат MCP service:

```json
{"ok":true,"componentPath":"cf","succeeded":9937,"failed":[],"warnings":[],"configurationIndexPath":"/private/tmp/nkdk-snapshot-task9-final3.mImYzj/.nkdk/components/cf/configuration-index.bin"}
```

Команда из brief с top-level await не запустилась из-за CJS-режима `tsx -e`.
Импорт выполнен тем же `importFromXml` через ESM-запуск
`node --import tsx/esm --input-type=module`.

## Измерение

Логические payload не складываются с физическими секциями: они показывают
распределение кодируемых полей, а физический блок отдельно и без двойного учёта
покрывает весь файл.

```json
{
  "fileBytes": 57610432,
  "files": {
    "records": 22182,
    "payloadBytes": 266184
  },
  "entities": {
    "records": 250608,
    "basePayloadBytes": 3007296,
    "identitiesPayloadBytes": 1711060,
    "omittedChildrenPayloadBytes": 74932,
    "xmlPayloadBytes": 17832
  },
  "strings": {
    "totalBytes": 48523214,
    "sharedBytes": 1085985,
    "byOwner": {
      "files": 1403416,
      "entityBase": 43888264,
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
      "strings": 49749726,
      "files": 354912,
      "entities": 5817064
    },
    "paddingBytes": 1688394,
    "totalBytes": 57610432
  }
}
```

Доля логических групп от `fileBytes`:

| Группа | Байты | Доля |
|---|---:|---:|
| files | 266 184 | 0,4620% |
| entity base | 3 007 296 | 5,2201% |
| identities | 1 711 060 | 2,9701% |
| omittedChildren | 74 932 | 0,1301% |
| XML | 17 832 | 0,0310% |
| строки | 48 523 214 | 84,2264% |

`sharedBytes` составляет 1 085 985 байт: 1,8850% всего файла и 2,2381%
строкового payload. Строка, принадлежащая нескольким логическим группам,
учитывается только в `sharedBytes`.

Физический инвариант:

```text
48 + 192 + 80 + 16 + 49 749 726 + 354 912 + 5 817 064 + 1 688 394
= 57 610 432
= fileBytes
```

## Инварианты и запрещённые данные

Decoder подтвердил:

```json
{
  "specificationVersion": "1.3",
  "indexGeneration": "1",
  "files": 22182,
  "entities": 250608,
  "withIdentities": 241370,
  "withOmittedChildren": 878,
  "withXml": 8360,
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

## Round-trip

Проверка запускалась в отдельном чистом detached-worktree. Штатный
`.agents/skills/round-trip-yaml/round-trip.sh` не дошёл до round-trip из-за
несовместимости bootstrap с текущим `tsx` (top-level await в CJS, self-import
пакета и `import.meta.resolve`). После временной ESM-совместимой правки копии
скрипта, не перенесённой в рабочую ветку, round-trip дошёл до данных и завершился
на существующем значении источника:

```text
cf/doc
/СтандартныеРеквизиты/PredefinedDataName/ЗначениеЗаполнения
MetadataValue: неподдерживаемый тип для YAML: undefined
```

Исходная XML-выгрузка и рабочая ветка проверки после запуска остались чистыми.

## Активная документация

- `.agents/architecture.md` описывает только `files` и содержательные `entity`,
  привязку worker-фрагмента к одному `targetProjectPath`, замену `entity`
  обработанного файла и атомарную публикацию.
- Validation-, dependency- и address-индексы описаны как временные результаты,
  строящиеся из актуального YAML в каждой операции.
- Из `.agents/restrictions.md` удалено устаревшее ограничение прямой
  неатомарной записи `configuration-index.bin`; ограничения транзакционности
  YAML/XML-каталогов сохранены.
- `.agents/configuration-snapshot.md` не изменялся: mismatch логической
  спецификации 1.3 не обнаружен.

## Проверка старого договора

Точный `rg` из brief не нашёл старых типов или секций снимка. Оставшиеся
совпадения относятся к временным `localIndexes` текущей операции и отрицательным
тестам, которые проверяют отсутствие старых полей в снимке; production-договор
снимка их не содержит.

## Итоговые проверки

- `pnpm type-check`: PASS.
- `pnpm test`: PASS — platform `18 files / 162 tests`, core
  `666 files / 5016 tests`, mcp `24 files / 138 tests`.
- `git diff --check`: PASS.

Статус: код, измерение и полный тестовый прогон завершены; round-trip
заблокирован описанной ошибкой существующих данных после обхода bootstrap.
