# Декларативное подключение корневых типов в `import` (XML → YAML)

**Дата:** 2026-04-25
**Статус:** утверждён

## Контекст

CLI-команда `import` (`packages/cli/src/commands/import.ts`) вызывает `syncConfigurationFromXML` (`packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`), которая жёстко обрабатывает **только** раздел `Catalogs` исходного XML-дампа и его формы. При этом в `packages/core/metadata/appliedObjects/` уже реализованы правила для Document, DocumentNumerator, Sequence (и Enumeration), а соответствующие разделы в дампе конфигурации (`Documents/`, `DocumentNumerators/`, `Sequences/`) не импортируются — данные теряются.

Симметричная задача `syncConfigurationToXML` (YAML → XML) страдает тем же ограничением.

Прогон `pnpm --filter @nakidka/cli exec tsx src/cli.ts import /Users/nikita/git/round-trip-source/trade /Users/nikita/git/erp_nkdk` подтвердил: импорт обходит только справочники (1437 объектов и форм), всё остальное игнорируется.

## Цель

Сделать так, чтобы добавление нового корневого прикладного объекта в импорт/синхронизацию требовало **только** добавления XML-папки в декларации правила и одной строки в реестре корневых типов — без правок самих walker-функций.

В рамках этой задачи подключаем три новых корневых типа: **Document**, **DocumentNumerator**, **Sequence** (Catalog уже работает).

## Не в границах задачи

- **Формы Document / DocumentNumerator / Sequence.** Целевая архитектура — вынести формы в отдельный PropertyRule по образцу `packages/core/metadata/commonObjects/predefined` (со своим типом, регистрацией через `registerMetadataItemRule` и подключением через `filePath`/`folderPath`). До этой миграции обработка форм остаётся специальным случаем для Catalog. Document/DocumentNumerator/Sequence в этой задаче подключаются **без форм** — только тело объекта.
- **Enumeration.** Подключение откладывается до следующего тикета.
- **Прочие корневые разделы дампа** (Reports, InformationRegisters, Constants, …) — для них в `appliedObjects/` ещё нет правил.
- **CLI** (`packages/cli/src/commands/import.ts`, `sync.ts`) — не меняется: эти команды уже только зовут `syncConfigurationFromXML`/`syncConfigurationToXML`.

## Архитектура

### Расширение `MetadataItemRule`

В тип `MetadataItemRule` (`packages/core/metadata/orchestration/property/types.ts`) добавляется одно опциональное поле:

```ts
xmlDir?: string  // имя XML-папки в дампе конфигурации
```

YAML-папка **не** добавляется отдельным полем — она равна существующему `itemTypePrefix`, который уже совпадает с именем YAML-папки (`Справочник`, `Документ`, `Нумератор`, `Последовательность`).

Семантика: если у правила задано `xmlDir`, оно считается **корневым** и может участвовать в обходе configuration walker'а. Без `xmlDir` правило — внутреннее (Command, Predefined, …).

Изменения в правилах:

| Правило | Добавляется |
|---|---|
| `MetadataCatalogRules` | `xmlDir: "Catalogs"` |
| `MetadataDocumentRules` | `xmlDir: "Documents"` |
| `MetadataDocumentNumeratorRules` | `xmlDir: "DocumentNumerators"` |
| `MetadataSequenceRules` | `xmlDir: "Sequences"` |

### Реестр корневых типов

Новый модуль `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"

export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataSequenceRules,
]
```

Добавление нового корневого типа в будущем = одна строка в этом массиве + `xmlDir` в его правиле.

### Walker `configuration/convertFromXML.ts`

Существующий двухфазный паттерн (discovery → batch tasks → `runBatch`) сохраняется. Меняется только внешний цикл — он проходит по `TopLevelMetadataItemRules` вместо хардкода `Catalogs`:

```ts
for (const rule of TopLevelMetadataItemRules) {
  if (rule.xmlDir === undefined) continue
  const xmlDirAbs = join(inputDir, rule.xmlDir)
  const yamlDirAbs = join(outputDir, rule.itemTypePrefix)
  if (!fs.existsSync(xmlDirAbs)) continue   // в дампе нет такого раздела — пропускаем

  // discovery: список .xml-файлов в xmlDirAbs
  // для каждого: task convertAppliedObjectFromXML(rule, ...)
  // для форм: только если в rule.properties есть свойство с типом "ChildFormNames" (= Catalog)
}
```

Поведение для Catalog по байтам совпадает с текущим (тесты `convertFromXML.test.ts` проходят без изменений — кроме тех, где сравнивается явное поведение walker'а).

### Walker `configuration/syncToXML.ts`

Симметрично: внешний цикл по `TopLevelMetadataItemRules`, для каждого `inputDir/<rule.itemTypePrefix>` → `outputDir/<rule.xmlDir>` и опциональный `referenceDir/<rule.xmlDir>`. Формы — только если у rule есть свойство типа `ChildFormNames`.

### Тип `ConfigurationSyncResult`

Поле `failed[].kind` расширяется со `"catalog" | "form"` до `string`. CLI уже выводит его без проверки значения, никаких клиентских правок не требуется.

## Тесты

1. **`appliedObjects/configuration/convertFromXML.test.ts`** — расширяется фикстурой, в которой помимо `Catalogs/` есть `Documents/`, `DocumentNumerators/`, `Sequences/` (минимальные XML, по 1 объекту каждого типа). Проверяется:
   - все четыре типа импортируются в `Справочник/`, `Документ/`, `Нумератор/`, `Последовательность/` соответственно;
   - результат `succeeded` корректно подсчитывает все объекты;
   - формы документов **не** обрабатываются (тест явно не ждёт их в результате).
2. **`appliedObjects/configuration/syncToXML.test.ts`** — симметрично: фикстура с YAML-проектом, содержащим все четыре типа; проверка обратного round-trip.
3. **Тест на пропуск отсутствующих разделов**: дамп без `Sequences/` — walker не падает, `succeeded > 0`, `failed` не содержит ошибок про несуществующий путь.

## План валидации

1. `pnpm test` из корня — все тесты зелёные.
2. Ручной прогон CLI: `pnpm --filter @nakidka/cli exec tsx src/cli.ts import /Users/nikita/git/round-trip-source/trade /Users/nikita/git/erp_nkdk` — счётчик `Готово: N успешно, M с ошибкой` должен заметно вырасти за счёт Document/DocumentNumerator/Sequence; число «формовых» ошибок не должно увеличиться (формы Document не подключаем).
3. Симметричный прогон `sync` (YAML → XML) — без регрессий по сравнению с текущим поведением для Catalog.

## Риски

- **Имена YAML-папок.** Опираемся на инвариант «yamlDir = itemTypePrefix». Сейчас он держится для всех четырёх типов; если в будущем появится тип, для которого `itemTypePrefix` (отображаемый префикс типа объекта) и желаемое имя YAML-папки разойдутся, потребуется явное поле `yamlDir`. Это изменение совместимо: добавим опциональное поле и зафолбэкним на `itemTypePrefix`.
- **Расширение `kind` в `ConfigurationSyncResult`.** Существующие потребители результата (если есть, кроме CLI) могут полагаться на узкий union `"catalog" | "form"`. Грепом по репозиторию проверим, что таких потребителей нет.
- **Пропуск отсутствующих разделов.** В тестах для конкретных типов фикстуры могут не содержать всех четырёх папок — walker должен корректно их пропускать (это уже было так для отсутствующего `Catalogs/`).

## Файлы, которые меняются

- `packages/core/metadata/orchestration/property/types.ts` — добавление поля `xmlDir`.
- `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — `xmlDir: "Catalogs"`.
- `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` — `xmlDir: "Documents"`.
- `packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts` — `xmlDir: "DocumentNumerators"`.
- `packages/core/metadata/appliedObjects/metadataSequence/rules.ts` — `xmlDir: "Sequences"`.
- `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts` — **новый** файл с реестром.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` — обход по реестру.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` — обход по реестру.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts` — расширение фикстуры.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` — расширение фикстуры.
