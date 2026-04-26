# Унификация тестов прикладных объектов метаданных

**Дата:** 2026-04-26
**Статус:** дизайн согласован

## Контекст и проблема

В `packages/core/metadata/appliedObjects/` для каждого прикладного объекта (Catalog, Document, Sequence, DocumentNumerator, Command, Enumeration) есть набор тестов:

- `fromXML.test.ts` — импорт XML-фикстуры → данные + round-trip обратно в XML
- `toXML.test.ts` — экспорт данных в XML, сравнение с фикстурой
- `fromYAML.test.ts` — round-trip YAML → данные
- `toYAML.test.ts` — данные → YAML
- `syncToXML.test.ts` — sync YAML→XML с проверкой набора файлов
- `convertFromXML.test.ts` — convert XML→YAML с проверкой набора файлов

`fromXML` и `toXML` практически идентичны между объектами: меняются `Rule`, фикстуры (`full.xml`, `minimal.xml`, иногда `withNumerator.xml`) и тип данных. То же — для simple round-trip `fromYAML`/`toYAML`. `syncToXML`/`convertFromXML` отличаются только списком ожидаемых файлов и путями фикстур.

В `packages/core/tests/property/` уже сложился паттерн «тонкие helper'ы, возвращающие данные; `describe`/`it`/`expect` остаются в вызывающем тесте» для аналогичных по природе тестов на правила свойств. Цель — применить тот же паттерн к прикладным объектам.

## Границы

В работу включается:

- Унификация существующих тестов у объектов **Catalog, Document, Sequence, DocumentNumerator**.
- Создание helper-модуля `packages/core/tests/appliedObject/`.
- Удаление текущего `syncToXML.test.ts` у Document (round-trip XML→YAML→XML) и замена на стандартный шаблон.
- Приведение структуры `__fixtures__/sync/` Document'а к виду Catalog'а (`xml/`, `nkdk/`).
- Обновление шаблонов в `.claude/skills/_shared/metadata/io-tests.md` и `tests.md`.

В работу **не включается**:

- Дотягивание coverage у Command (нет YAML/sync) и Enumeration (нет XML/sync) — отдельная задача с генерацией новых фикстур.
- Унификация YAML-API прикладных объектов (`importMetadataCatalogFromYAML` vs `importMetadataDocumentFromYAML` и т.п.).
- Вынос граф-тестов Catalog'а из `fromYAML.test.ts` в отдельный файл — техдолг до момента унификации YAML-API.
- Изменение XML-фикстур (правило проекта — XML-фикстуры источник истины, не править).

## Архитектура

### Расположение и состав

Новый модуль `packages/core/tests/appliedObject/` по аналогии с `tests/property/`. Каждая публичная функция в своём файле.

```
packages/core/tests/appliedObject/
  importAppliedObjectFromXML.ts
  exportAppliedObjectToXML.ts
  runSyncToXML.ts
  runConvertFromXML.ts
  index.ts
```

YAML-helper'ы (`importAppliedObjectFromYAML`, `exportAppliedObjectToYAML`) **не создаются** — они были бы тонкими обёртками без выигрыша в читаемости, потому что у каждого прикладного объекта своя пара функций (`importMetadataCatalogFromYAML(ctx, value, name)`, `importMetadataDocumentFromYAML(ctx, value)`). Тесты YAML остаются на прямых вызовах. Это решение фиксируется явно — пересмотреть после унификации YAML-API.

### Стиль API

Все helper'ы возвращают данные / `{ result, expected }`. `describe`/`it`/`expect` пишутся в вызывающих тест-файлах.

### Сигнатуры

#### `importAppliedObjectFromXML`

```ts
type Params = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string                // имя файла, напр. "full.xml"
  forReference?: boolean         // default false
}

export const importAppliedObjectFromXML = <T>(params: Params): T | undefined
```

Внутри: `readAndParseXMLFixture<{ MetaDataObject }>` → `importMetadataItemFromXML`.

#### `exportAppliedObjectToXML`

```ts
type Params<T> = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  data: T
  referenceData?: T              // если не передан — импортируется из fixture с forReference=true
}

export const exportAppliedObjectToXML = <T>(params: Params<T>): {
  result: string
  expected: string
}
```

Возвращает оба значения, чтобы вызывающий код был `expect(result).toEqual(expected)` без повторного чтения фикстуры.

#### `runSyncToXML`

```ts
type Params = {
  rule: MetadataItemRule
  name: string                   // имя экземпляра, напр. "СправочникCоВсемиОбъектами"
  importMetaUrl: string
  fixturesSubdir?: string        // default "__fixtures__/sync"
  expectedFiles: string[]        // относительные пути от referenceDir / outputDir
}

export const runSyncToXML = async (params: Params): Promise<{
  outputDir: string
  comparisons: Array<{ path: string; result: string; expected: string }>
}>
```

Поведение:
1. Создаёт уникальный `outputDir` через `fs.mkdtempSync(os.tmpdir(), "applied-sync-")`. Это снимает проблему flaky-тестов из-за общего `out/` при параллельном vitest (см. memory `project_configuration_tests_flaky.md`).
2. Запускает `syncAppliedObjectToXML` с `inputDir = <fixturesDir>/nkdk`, `referenceDir = <fixturesDir>/xml`, `outputDir`.
3. Для каждого пути из `expectedFiles` читает `referenceDir/<path>` и `outputDir/<path>`, складывает в `comparisons`.
4. Тест-файл итерирует `comparisons` и делает `expect(result, path).toBe(expected)`.

#### `runConvertFromXML`

```ts
type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string        // default "__fixtures__/sync"
  expectedYAML: string           // содержимое Свойства.yaml (из data.ts)
  expectedFiles?: string[]       // дополнительные файлы (модули, html, ...) относительно inputDir / outputDir/<name>/
}

export const runConvertFromXML = async (params: Params): Promise<{
  outputDir: string
  yaml: { result: string; expected: string }
  comparisons: Array<{ path: string; result: string; expected: string }>
}>
```

Симметрично `runSyncToXML`. `Свойства.yaml` всегда вынесен отдельно, потому что его ожидаемое значение — строка из `data.ts`, а не файл из reference.

### Использование в тесте (пример Catalog `fromXML.test.ts`)

```ts
import { describe, expect, it } from "vitest"
import { importAppliedObjectFromXML, exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog } from "./types"

describe("import MetadataCatalog from XML", () => {
  it("should import full", () => {
    expect(
      importAppliedObjectFromXML<MetadataCatalog>({
        rule: MetadataCatalogRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      importAppliedObjectFromXML<MetadataCatalog>({
        rule: MetadataCatalogRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = importAppliedObjectFromXML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

Для `syncToXML.test.ts`:

```ts
it("читает Catalog из YAML и записывает XML в outputDir", async () => {
  const { comparisons } = await runSyncToXML({
    rule: MetadataCatalogRules,
    name: "СправочникCоВсемиОбъектами",
    importMetaUrl: import.meta.url,
    expectedFiles: [
      "СправочникCоВсемиОбъектами.xml",
      "Ext/Predefined.xml",
      "Ext/AdditionalIndexes.xml",
      "Ext/ObjectModule.bsl",
      "Ext/ManagerModule.bsl",
      "Ext/Help.xml",
      "Ext/Help/ru.html",
      "Commands/КомандаОбъекта/Ext/CommandModule.bsl",
    ],
  })
  for (const { path, result, expected } of comparisons) {
    expect(result, path).toBe(expected)
  }
})
```

## План миграции

Порядок выбран так, чтобы каждый объект мигрировался отдельным коммитом и проект оставался зелёным.

1. **Создать helper'ы и `index.ts`** — `packages/core/tests/appliedObject/`.
2. **Catalog** — мигрировать все 6 тестов. Граф-блок в `fromYAML.test.ts` остаётся нетронутым; общий round-trip переписывается через прямой вызов YAML-функций (без helper'а). Помечается `// TODO: вынести граф-тесты в отдельный файл при унификации YAML-API`.
3. **Document** — мигрировать `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts`. Удалить текущий `syncToXML.test.ts` (round-trip XML→YAML→XML). Перестроить `__fixtures__/sync/`:
   - текущий вид: `__fixtures__/sync/<имя>/Ext/...`
   - целевой: `__fixtures__/sync/{xml/<имя>.xml, xml/<имя>/Ext/..., nkdk/<имя>/Свойства.yaml, data.ts}`
   - XML-фикстуры **только перекладываются**, не правятся.
   - `nkdk/Свойства.yaml` и `data.ts` генерируются из работающего `convertFromXML.test.ts`.
   - Миграцию `convertFromXML.test.ts` и нового `syncToXML.test.ts` делать одним коммитом, чтобы не получить промежуточно красное состояние.
4. **Sequence** — мигрировать существующее (`toYAML.test.ts` отсутствует, не дотягиваем).
5. **DocumentNumerator** — все 6 тестов есть, прямая миграция.
6. **Удалить мёртвый `__fixtures__/sync/out/`** — в каждом объекте, после перехода helper'а на `mkdtempSync`.
7. **Обновить шаблоны скиллов:**
   - `.claude/skills/_shared/metadata/io-tests.md` — шаблоны `convertFromXML.test.ts` / `syncToXML.test.ts` на helper'ах.
   - `.claude/skills/_shared/metadata/tests.md` — шаблоны `fromXML.test.ts` / `toXML.test.ts` / `fromYAML.test.ts` / `toYAML.test.ts` на helper'ах.

## Тестирование

`pnpm test` из корня после каждого этапа. Все существующие assertion'ы сохраняются 1:1 — миграция не должна ослаблять покрытие.

## Риски

1. **YAML helper'ы тонкие** — отказ от них в этой задаче зафиксирован сознательно. После унификации YAML-API (`importMetadataAppliedObjectFromYAML` через rule) к идее можно вернуться.
2. **Document `__fixtures__/sync/` перетряска** — самый рискованный пункт миграции. Митигация: один коммит на оба теста Document'а.
3. **Граф-тесты Catalog YAML** — остаются как есть, технический долг.
4. **Command/Enumeration не покрываются** — выпали из границ работы. Дотянуть отдельной задачей с генерацией новых фикстур.

## Решения, зафиксированные в обсуждении

- Стиль API — тонкие helper'ы как в `tests/property/`, не фабрика describe-блоков.
- Список ожидаемых файлов для sync/convert — параметром, helper итерирует.
- Граф-тесты YAML и round-trip XML→YAML→XML Document'а — соответственно остаются и удаляются.
- Catalog первым в миграции как референсный объект.
