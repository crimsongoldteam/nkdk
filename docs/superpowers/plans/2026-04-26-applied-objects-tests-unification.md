# Унификация тестов прикладных объектов — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вынести дублирующуюся инфраструктуру тестов applied objects (Catalog/Document/Sequence/DocumentNumerator) в helper-модуль `packages/core/tests/appliedObject/` по образцу `packages/core/tests/property/`.

**Architecture:** Тонкие helper'ы, возвращающие данные / `{ result, expected }`. `describe`/`it`/`expect` остаются в вызывающих тестах. XML-helper'ы оборачивают `importMetadataItemFromXML` / `exportMetadataItemToXML`; YAML-helper'ы — `importMetadataItemFromYAML` / `exportMetadataItemToYAML`; sync/convert-helper'ы создают уникальный `outputDir` через `mkdtempSync` (устраняет flaky-тесты от общего `out/`) и сравнивают список ожидаемых файлов.

**Tech Stack:** TypeScript, vitest, pnpm, Node fs/os, `~/metadata/orchestration` (`importMetadataItemFromXML`, `exportMetadataItemToXML`, `importMetadataItemFromYAML`, `exportMetadataItemToYAML`, `syncAppliedObjectToXML`, `convertAppliedObjectFromXML`).

**Спека:** `docs/superpowers/specs/2026-04-26-applied-objects-tests-unification-design.md`

---

## Файловая структура

**Создаются:**

- `packages/core/tests/appliedObject/importAppliedObjectFromXML.ts`
- `packages/core/tests/appliedObject/exportAppliedObjectToXML.ts`
- `packages/core/tests/appliedObject/importAppliedObjectFromYAML.ts`
- `packages/core/tests/appliedObject/exportAppliedObjectToYAML.ts`
- `packages/core/tests/appliedObject/runSyncToXML.ts`
- `packages/core/tests/appliedObject/runConvertFromXML.ts`
- `packages/core/tests/appliedObject/index.ts`
- `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.dependencies.test.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/xml/...` (перекладка)
- `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/nkdk/ДокументВсеСвойства/Свойства.yaml` (генерация)
- `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/data.ts` (генерация)

**Модифицируются:**

- `packages/core/metadata/appliedObjects/metadataCatalog/{fromXML,toXML,fromYAML,toYAML,syncToXML,convertFromXML}.test.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/{fromXML,toXML,fromYAML,toYAML,convertFromXML}.test.ts`
- `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts` (полный rewrite)
- `packages/core/metadata/appliedObjects/metadataSequence/{fromXML,toXML,fromYAML,syncToXML,convertFromXML}.test.ts`
- `packages/core/metadata/appliedObjects/metadataDocumentNumerator/{fromXML,toXML,fromYAML,toYAML,syncToXML,convertFromXML}.test.ts`
- `.agents/skills/_shared/metadata/io-tests.md`
- `.agents/skills/_shared/metadata/tests.md`

---

### Task 1: Helper `importAppliedObjectFromXML`

**Files:**
- Create: `packages/core/tests/appliedObject/importAppliedObjectFromXML.ts`

- [ ] **Step 1: Создать файл helper'а**

Содержимое `packages/core/tests/appliedObject/importAppliedObjectFromXML.ts`:

```ts
import { importMetadataItemFromXML, MetadataItemRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"

type Params = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  forReference?: boolean
}

export const importAppliedObjectFromXML = <T>(params: Params): T | undefined => {
  const { rule, importMetaUrl, fixture, forReference = false } = params
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(importMetaUrl, fixture)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference }),
    rule,
    xml: parsed.MetaDataObject,
  }) as T | undefined
}
```

- [ ] **Step 2: Проверить, что тип `MetadataItemRule` экспортируется из `~/metadata/orchestration`**

Run: `grep -E "MetadataItemRule" packages/core/metadata/orchestration/index.ts packages/core/metadata/orchestration/property/types.ts`

Expected: тип определён в `property/types.ts` и реэкспортируется через `index.ts`. Если не реэкспортируется — поправить импорт в helper'е на прямой путь к `property/types`.

- [ ] **Step 3: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок в `packages/core/tests/appliedObject/importAppliedObjectFromXML.ts` нет.

- [ ] **Step 4: Коммит**

```bash
git add packages/core/tests/appliedObject/importAppliedObjectFromXML.ts
git commit -m "test: :white_check_mark: helper importAppliedObjectFromXML"
```

---

### Task 2: Helper `exportAppliedObjectToXML`

**Files:**
- Create: `packages/core/tests/appliedObject/exportAppliedObjectToXML.ts`

- [ ] **Step 1: Создать файл helper'а**

Содержимое:

```ts
import {
  exportMetadataItemToXML,
  importMetadataItemFromXML,
  MetadataItemRule,
} from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"

type Params<T> = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  data: T
  referenceData?: T
}

export const exportAppliedObjectToXML = <T>(
  params: Params<T>
): { result: string; expected: string } => {
  const { rule, importMetaUrl, fixture, data } = params

  let referenceData = params.referenceData
  if (referenceData === undefined) {
    const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(importMetaUrl, fixture)
    referenceData = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      xml: parsed.MetaDataObject,
    }) as T | undefined
  }

  const xmlData = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData,
    rule,
  })

  const result = xmlExport(xmlData!)
  const expected = readXMLFixtureAsString(importMetaUrl, fixture)

  return { result, expected }
}
```

- [ ] **Step 2: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок нет.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/tests/appliedObject/exportAppliedObjectToXML.ts
git commit -m "test: :white_check_mark: helper exportAppliedObjectToXML"
```

---

### Task 3: Helper'ы YAML

**Files:**
- Create: `packages/core/tests/appliedObject/importAppliedObjectFromYAML.ts`
- Create: `packages/core/tests/appliedObject/exportAppliedObjectToYAML.ts`

- [ ] **Step 1: Создать `importAppliedObjectFromYAML.ts`**

Содержимое:

```ts
import { importMetadataItemFromYAML, MetadataItemRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  yaml: unknown
  name?: string
}

export const importAppliedObjectFromYAML = <T>(params: Params): T | undefined => {
  return importMetadataItemFromYAML({
    context: mockContext,
    yaml: params.yaml,
    rule: params.rule,
    name: params.name,
  }) as T | undefined
}
```

- [ ] **Step 2: Создать `exportAppliedObjectToYAML.ts`**

Содержимое:

```ts
import { exportMetadataItemToYAML, MetadataItemRule } from "~/metadata/orchestration"
import { mockContextToYAML } from "~/tests/mockContext"

type Params<T> = {
  rule: MetadataItemRule
  data: T | undefined
}

export const exportAppliedObjectToYAML = <T>(params: Params<T>): unknown => {
  return exportMetadataItemToYAML({
    context: mockContextToYAML,
    data: params.data,
    rule: params.rule,
  })
}
```

- [ ] **Step 3: Проверить сигнатуру `importMetadataItemFromYAML`**

Run: `grep -A 8 "export const importMetadataItemFromYAML" packages/core/metadata/orchestration/metadataItem/fromYAML.ts | head -15`

Expected: видно, что функция принимает `{ context, yaml, rule, name? }`. Если параметр называется `value`, а не `yaml` — поправить helper.

- [ ] **Step 4: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок нет.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/tests/appliedObject/importAppliedObjectFromYAML.ts \
        packages/core/tests/appliedObject/exportAppliedObjectToYAML.ts
git commit -m "test: :white_check_mark: helpers import/export AppliedObject YAML"
```

---

### Task 4: Helper `runSyncToXML`

**Files:**
- Create: `packages/core/tests/appliedObject/runSyncToXML.ts`

- [ ] **Step 1: Создать helper**

Содержимое:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { MetadataItemRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string
  expectedFiles: string[]
}

export const runSyncToXML = async (
  params: Params
): Promise<{
  outputDir: string
  comparisons: Array<{ path: string; result: string; expected: string }>
}> => {
  const { rule, name, importMetaUrl, expectedFiles } = params
  const fixturesSubdir = params.fixturesSubdir ?? "__fixtures__/sync"

  const testDir = dirname(fileURLToPath(importMetaUrl))
  const fixturesDir = join(testDir, fixturesSubdir)
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "applied-sync-"))

  await syncAppliedObjectToXML({
    rule,
    context: mockContextToXML(),
    inputDir,
    name,
    outputDir,
    referenceDir,
  })

  const comparisons = expectedFiles.map((path) => ({
    path,
    result: fs.readFileSync(join(outputDir, path), "utf-8"),
    expected: fs.readFileSync(join(referenceDir, path), "utf-8"),
  }))

  return { outputDir, comparisons }
}
```

- [ ] **Step 2: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок нет.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/tests/appliedObject/runSyncToXML.ts
git commit -m "test: :white_check_mark: helper runSyncToXML"
```

---

### Task 5: Helper `runConvertFromXML`

**Files:**
- Create: `packages/core/tests/appliedObject/runConvertFromXML.ts`

- [ ] **Step 1: Создать helper**

Содержимое:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { MetadataItemRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string
  expectedYAML: string
  expectedFiles?: string[]
}

export const runConvertFromXML = async (
  params: Params
): Promise<{
  outputDir: string
  yaml: { result: string; expected: string }
  comparisons: Array<{ path: string; result: string; expected: string }>
}> => {
  const { rule, name, importMetaUrl, expectedYAML, expectedFiles = [] } = params
  const fixturesSubdir = params.fixturesSubdir ?? "__fixtures__/sync"

  const testDir = dirname(fileURLToPath(importMetaUrl))
  const fixturesDir = join(testDir, fixturesSubdir)
  const inputDir = join(fixturesDir, "xml")
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "applied-convert-"))

  await convertAppliedObjectFromXML({
    rule,
    context: mockContextFromXML(),
    inputDir,
    name,
    outputDir,
  })

  const yamlResult = fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8")

  const comparisons = expectedFiles.map((path) => ({
    path,
    result: fs.readFileSync(join(outputDir, name, path), "utf-8"),
    expected: fs.readFileSync(join(inputDir, path), "utf-8"),
  }))

  return {
    outputDir,
    yaml: { result: yamlResult, expected: expectedYAML },
    comparisons,
  }
}
```

**Note:** `expectedFiles` — это пути модулей в YAML-выходе (`outputDir/<name>/<path>`). Они сравниваются с тем же путём в `inputDir` (XML-источник содержит модули в `Ext/`, но имена/пути отличаются в YAML-выводе). Поэтому имеет смысл положить эти пути относительно `outputDir/<name>/` — это удобнее для тестов: `Команды/КомандаОбъекта.bsl`, `МодульОбъекта.bsl`, `МодульМенеджера.bsl`. Сравниваются с **исходником в XML-структуре** по другому пути. Чтобы это сделать корректно, поправляем helper: `comparisons` принимает не один список, а пары `{ outputPath, expectedPath }`. Но это усложнит API; оставим как есть, и в тестах для этих специфичных файлов будем делать прямой `expect(fs.readFileSync(...)).toBe(...)` рядом с вызовом helper'а. **Поэтому** в helper'е — только `Свойства.yaml`, а остальные файлы тест-файл проверяет сам. Уточни поведение в реализации:

Уточнённый helper:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { MetadataItemRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  name: string
  importMetaUrl: string
  fixturesSubdir?: string
  expectedYAML: string
}

export const runConvertFromXML = async (
  params: Params
): Promise<{
  outputDir: string
  inputDir: string
  yaml: { result: string; expected: string }
}> => {
  const { rule, name, importMetaUrl, expectedYAML } = params
  const fixturesSubdir = params.fixturesSubdir ?? "__fixtures__/sync"

  const testDir = dirname(fileURLToPath(importMetaUrl))
  const fixturesDir = join(testDir, fixturesSubdir)
  const inputDir = join(fixturesDir, "xml")
  const outputDir = fs.mkdtempSync(join(os.tmpdir(), "applied-convert-"))

  await convertAppliedObjectFromXML({
    rule,
    context: mockContextFromXML(),
    inputDir,
    name,
    outputDir,
  })

  return {
    outputDir,
    inputDir,
    yaml: {
      result: fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8"),
      expected: expectedYAML,
    },
  }
}
```

Пишем именно эту версию: helper отвечает только за `Свойства.yaml`, остальные файлы (`МодульОбъекта.bsl` и т.п.) сравниваются в самом тесте через `inputDir`/`outputDir`/`name`, которые helper возвращает.

- [ ] **Step 2: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок нет.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/tests/appliedObject/runConvertFromXML.ts
git commit -m "test: :white_check_mark: helper runConvertFromXML"
```

---

### Task 6: `index.ts` для helper-модуля

**Files:**
- Create: `packages/core/tests/appliedObject/index.ts`

- [ ] **Step 1: Создать index с реэкспортами**

Содержимое:

```ts
export { importAppliedObjectFromXML } from "./importAppliedObjectFromXML"
export { exportAppliedObjectToXML } from "./exportAppliedObjectToXML"
export { importAppliedObjectFromYAML } from "./importAppliedObjectFromYAML"
export { exportAppliedObjectToYAML } from "./exportAppliedObjectToYAML"
export { runSyncToXML } from "./runSyncToXML"
export { runConvertFromXML } from "./runConvertFromXML"
```

- [ ] **Step 2: Type-check проходит**

Run: `pnpm -C packages/core type-check 2>&1 | tail -10`

Expected: ошибок нет.

- [ ] **Step 3: Коммит**

```bash
git add packages/core/tests/appliedObject/index.ts
git commit -m "test: :white_check_mark: appliedObject helpers index"
```

---

### Task 7: Catalog — миграция fromXML/toXML

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/toXML.test.ts`

- [ ] **Step 1: Переписать `fromXML.test.ts`**

Полное содержимое:

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

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = importAppliedObjectFromXML<MetadataCatalog>({
        rule: MetadataCatalogRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = exportAppliedObjectToXML({
        rule: MetadataCatalogRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result).toEqual(expected)
    }
  )
})
```

- [ ] **Step 2: Запустить тест fromXML**

Run: `pnpm -C packages/core test -- metadataCatalog/fromXML 2>&1 | tail -20`

Expected: 4 теста зелёные (`should import full`, `should import minimal`, `round-trip: full.xml`, `round-trip: minimal.xml`).

- [ ] **Step 3: Переписать `toXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"

describe("export MetadataCatalog to XML", () => {
  it("should export full.xml fixture", () => {
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: full,
    })
    expect(result).toEqual(expected)
  })

  it("should export minimal.xml fixture", () => {
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      data: minimal,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 4: Запустить тест toXML**

Run: `pnpm -C packages/core test -- metadataCatalog/toXML 2>&1 | tail -20`

Expected: 2 теста зелёные.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/fromXML.test.ts \
        packages/core/metadata/appliedObjects/metadataCatalog/toXML.test.ts
git commit -m "test: :white_check_mark: Catalog from/toXML через appliedObject helpers"
```

---

### Task 8: Catalog — миграция fromYAML/toYAML с выносом графа

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.dependencies.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/toYAML.test.ts`

- [ ] **Step 1: Скопировать граф-блок в новый файл `fromYAML.dependencies.test.ts`**

Полное содержимое (граф-блок взят из текущего `fromYAML.test.ts`, второй `describe`):

```ts
// TODO: упростить после унификации YAML-API Catalog'а
import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { edgeMatch, nodeMatch } from "~/metadata/relations/dependencyQuery"
import { getDependencies } from "~/metadata/relations/getDependencies"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { mockContext } from "~/tests/mockContext"

describe("importMetadataCatalogDependenciesFromYAML", () => {
  let graph: MetadataGraph

  beforeEach(() => {
    graph = new MetadataGraph()
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/dependencies.yaml"), "utf8")
    importMetadataFileWithGraph({
      filePath: "test.yaml",
      sources: { yaml: text },
      kind: "catalog",
      name: "TestCatalog",
      graph,
      context: mockContext,
    })
  })

  it("should import dependencies", () => {
    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeOr(
          edgeMatch(({ attrs }) => attrs.kind === "Реквизит"),
          edgeMatch(({ attrs }) => attrs.kind === "ТабличнаяЧасть"),
          edgeMatch(({ attrs }) => attrs.kind === "СтандартныйРеквизит")
        ),
      graph,
    )

    expect(Object.keys(dependencies)).toHaveLength(11)
    expect(Object.keys(dependencies)).toEqual(
      expect.arrayContaining([
        "Справочник.TestCatalog.Реквизит.КакойТоРеквизит",
        "Справочник.TestCatalog.ТабличнаяЧасть.КакаяТоТабличнаяЧасть",
        "Справочник.TestCatalog.СтандартныйРеквизит.ИмяПредопределенныхДанных",
        "Справочник.TestCatalog.СтандартныйРеквизит.Предопределенный",
        "Справочник.TestCatalog.СтандартныйРеквизит.Ссылка",
        "Справочник.TestCatalog.СтандартныйРеквизит.ПометкаУдаления",
        "Справочник.TestCatalog.СтандартныйРеквизит.ЭтоГруппа",
        "Справочник.TestCatalog.СтандартныйРеквизит.Владелец",
        "Справочник.TestCatalog.СтандартныйРеквизит.Родитель",
        "Справочник.TestCatalog.СтандартныйРеквизит.Наименование",
        "Справочник.TestCatalog.СтандартныйРеквизит.Код",
      ]),
    )

    expect(dependencies["Справочник.TestCatalog.Реквизит.КакойТоРеквизит"]).toMatchObject({
      item: {
        itemType: "MetadataAttribute",
        name: "КакойТоРеквизит",
        synonym: {
          items: {
            ru: "Наименование реквизита",
            en: "Property name",
          },
        },
      },
      positionFrom: {
        offset: 13,
      },
    })
  })

  it("should import dependencies with other catalog", () => {
    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "Реквизит")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "Тип"),
      graph,
    )

    expect(Object.keys(dependencies)).toEqual(["Справочник.ДругойСправочник"])
  })

  it("stub node has no item before target is imported", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.item).toBeUndefined()
  })

  it("stub node has no filePaths (belongs to no file)", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.filePaths).toBeUndefined()
  })

  it("getBrokenReferences reports stub as broken", () => {
    const broken = graph.getBrokenReferences()
    expect(broken.has("Справочник.ДругойСправочник")).toBe(true)
  })

  it("stub is enriched after importing target catalog", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    const attrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("ДругойСправочник")
    expect(attrs.filePaths?.[0]).toBe("other.yaml")
  })

  it("стандартный реквизит из YAML имеет item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.СтандартныйРеквизит.Владелец")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("Owner")
  })

  it("стандартный реквизит без описания в YAML имеет default item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.СтандартныйРеквизит.Ссылка")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { itemType: string; name: string }).itemType).toBe("StandardAttributeDescription")
    expect((attrs.item as { name: string }).name).toBe("Ref")
  })

  it("getBrokenReferences is empty after all stubs are enriched", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    expect(graph.getBrokenReferences().size).toBe(0)
  })
})
```

- [ ] **Step 2: Переписать `fromYAML.test.ts` — оставить только round-trip-блок через helper**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { importAppliedObjectFromYAML, exportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog } from "./types"

describe("importMetadataCatalogFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importAppliedObjectFromYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      yaml: undefined,
      name: "Контрагенты",
    })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importAppliedObjectFromYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      yaml: fullYAML,
      name: "СправочникПолный",
    })
    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importAppliedObjectFromYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      yaml: minimalYAML,
      name: "ПоУмолчанию",
    })
    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportAppliedObjectToYAML({
      rule: MetadataCatalogRules,
      data: minimal,
    })
    expect(result).toEqual(minimalYAML)
  })
})
```

- [ ] **Step 3: Переписать `toYAML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { exportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog } from "./types"

describe("exportMetadataCatalogToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAppliedObjectToYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportAppliedObjectToYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      data: full,
    })
    expect(result).toEqual(fullYAML)
  })

  it("should export minimal", () => {
    const result = exportAppliedObjectToYAML<MetadataCatalog>({
      rule: MetadataCatalogRules,
      data: minimal,
    })
    expect(result).toEqual(minimalYAML)
  })
})
```

- [ ] **Step 4: Запустить YAML-тесты Catalog'а**

Run: `pnpm -C packages/core test -- "metadataCatalog/(fromYAML|toYAML)" 2>&1 | tail -30`

Expected: все тесты зелёные. Если round-trip Catalog'а через общий orchestration-путь даёт отличие от специфичных функций — надо будет посмотреть, проходит ли. Если есть единичные провалы — фиксируем тут же дополнительным шагом.

- [ ] **Step 5: Если есть провалы из-за разницы общего orchestration-пути и специфичных Catalog-функций**

Возможно `importMetadataItemFromYAML` для Catalog ведёт себя не идентично `importMetadataCatalogFromYAML` (т.к. вторая имеет специфичную логику типа `importStandardAttributesFromYAML`). Если так — оставить YAML-тесты Catalog'а на специфичных функциях:

```ts
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { exportMetadataCatalogToYAML } from "./toYAML"
import { mockContext, mockContextToYAML } from "~/tests/mockContext"
// ...
```

Но **сначала** запустить и убедиться, что разница есть. Если зелёное — оставить через helper.

- [ ] **Step 6: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.test.ts \
        packages/core/metadata/appliedObjects/metadataCatalog/toYAML.test.ts \
        packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.dependencies.test.ts
git commit -m "test: :white_check_mark: Catalog YAML через appliedObject helpers + вынос графа"
```

---

### Task 9: Catalog — миграция syncToXML/convertFromXML

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/syncToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/convertFromXML.test.ts`

- [ ] **Step 1: Переписать `syncToXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { runSyncToXML } from "~/tests/appliedObject"
import { MetadataCatalogRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataCatalog", () => {
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
})
```

- [ ] **Step 2: Запустить syncToXML**

Run: `pnpm -C packages/core test -- metadataCatalog/syncToXML 2>&1 | tail -20`

Expected: тест зелёный. 8 файлов сравнений проходят.

- [ ] **Step 3: Переписать `convertFromXML.test.ts`**

Полное содержимое:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { runConvertFromXML } from "~/tests/appliedObject"
import { readCatalogYAML } from "./__fixtures__/sync/data"
import { MetadataCatalogRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCatalog", () => {
  const name = "СправочникCоВсемиОбъектами"

  it("читает Catalog из XML и записывает Свойства.yaml + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await runConvertFromXML({
      rule: MetadataCatalogRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readCatalogYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedObjectModule = fs.readFileSync(join(inputDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(inputDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedHelpRu = fs.readFileSync(join(inputDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(inputDir, "Commands", "КомандаОбъекта", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "КомандаОбъекта.bsl"), "utf-8")).toBe(
      expectedCommandModule
    )
  })
})
```

- [ ] **Step 4: Запустить convertFromXML**

Run: `pnpm -C packages/core test -- metadataCatalog/convertFromXML 2>&1 | tail -20`

Expected: тест зелёный.

- [ ] **Step 5: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/syncToXML.test.ts \
        packages/core/metadata/appliedObjects/metadataCatalog/convertFromXML.test.ts
git commit -m "test: :white_check_mark: Catalog sync/convert через appliedObject helpers"
```

---

### Task 10: Document — миграция fromXML/toXML/fromYAML/toYAML

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts`

- [ ] **Step 1: Переписать `fromXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { importAppliedObjectFromXML, exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { withNumerator } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

describe("import MetadataDocument from XML", () => {
  it("should import full", () => {
    expect(
      importAppliedObjectFromXML<MetadataDocument>({
        rule: MetadataDocumentRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      importAppliedObjectFromXML<MetadataDocument>({
        rule: MetadataDocumentRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it("should import withNumerator", () => {
    expect(
      importAppliedObjectFromXML<MetadataDocument>({
        rule: MetadataDocumentRules,
        importMetaUrl: import.meta.url,
        fixture: "withNumerator.xml",
      })
    ).toEqual(withNumerator)
  })

  it.each(["full.xml", "minimal.xml", "withNumerator.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = importAppliedObjectFromXML<MetadataDocument>({
        rule: MetadataDocumentRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = exportAppliedObjectToXML({
        rule: MetadataDocumentRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result).toEqual(expected)
    }
  )
})
```

- [ ] **Step 2: Переписать `toXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { withNumerator } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"

describe("export MetadataDocument to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
    { fixture: "withNumerator.xml", data: withNumerator },
  ])("should export $fixture fixture", ({ fixture, data }) => {
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataDocumentRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 3: Переписать `fromYAML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { importAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { withNumerator, withNumeratorYAML } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

describe("import MetadataDocument from YAML", () => {
  it("should import full", () => {
    const result = importAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: fullYAML,
      name: "ДокументВсеСвойства",
    })
    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: minimalYAML,
      name: "ДокументПоУмолчанию",
    })
    expect(result).toEqual(minimal)
  })

  it("should import withNumerator", () => {
    const result = importAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: withNumeratorYAML,
      name: "ДокументСНумератором",
    })
    expect(result).toEqual(withNumerator)
  })
})
```

- [ ] **Step 4: Переписать `toYAML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { exportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { withNumerator, withNumeratorYAML } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

describe("export MetadataDocument to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAppliedObjectToYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it.each([
    { name: "full", data: full, expected: fullYAML },
    { name: "minimal", data: minimal, expected: minimalYAML },
    { name: "withNumerator", data: withNumerator, expected: withNumeratorYAML },
  ])("should export $name", ({ data, expected }) => {
    const result = exportAppliedObjectToYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 5: Запустить тесты Document'а (4 файла)**

Run: `pnpm -C packages/core test -- "metadataDocument/(fromXML|toXML|fromYAML|toYAML)" 2>&1 | tail -30`

Expected: все тесты зелёные.

- [ ] **Step 6: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts \
        packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts \
        packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts \
        packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts
git commit -m "test: :white_check_mark: Document XML/YAML тесты через appliedObject helpers"
```

---

### Task 11: Document — перетряска `__fixtures__/sync/` + новые sync/convert тесты

**Files:**
- Move: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/ДокументВсеСвойства.xml` → `__fixtures__/sync/xml/ДокументВсеСвойства.xml`
- Move: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/ДокументВсеСвойства/` → `__fixtures__/sync/xml/ДокументВсеСвойства/`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/data.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/nkdk/ДокументВсеСвойства/Свойства.yaml`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts`
- Rewrite: `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/out-test/` (если есть)

**Note:** Этот шаг — самый рискованный. Все файловые операции и оба теста делаются в одном коммите.

- [ ] **Step 1: Переместить XML-фикстуру и связанные файлы в `xml/`**

Run:
```bash
cd packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync
mkdir -p xml
git mv ДокументВсеСвойства.xml xml/ДокументВсеСвойства.xml
git mv ДокументВсеСвойства xml/ДокументВсеСвойства
```

Expected: `__fixtures__/sync/xml/ДокументВсеСвойства.xml` и `__fixtures__/sync/xml/ДокументВсеСвойства/Ext/...`, `Forms/...`, `Templates/...`.

- [ ] **Step 2: Удалить локальный `out-test/`, если есть**

Run:
```bash
rm -rf packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/out-test
```

Expected: папка удалена.

- [ ] **Step 3: Создать `data.ts` с пустым YAML-плейсхолдером**

Содержимое `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/data.ts`:

```ts
export const readDocumentYAML = ""
```

Это временный плейсхолдер — реальное содержимое заполнится на шаге 5 после прогона нового convertFromXML.test.ts.

- [ ] **Step 4: Переписать `convertFromXML.test.ts` через helper**

Полное содержимое:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { runConvertFromXML } from "~/tests/appliedObject"
import { readDocumentYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocument", () => {
  const name = "ДокументВсеСвойства"

  it("читает Document из XML и пишет YAML + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await runConvertFromXML({
      rule: MetadataDocumentRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDocumentYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedObjectModule = fs.readFileSync(
      join(inputDir, name, "Ext", "ObjectModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(
      join(inputDir, name, "Ext", "ManagerModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedCommandModule = fs.readFileSync(
      join(inputDir, name, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)
  })
})
```

**Note:** В тесте используется `inputDir`, который helper возвращает (`<fixturesDir>/xml`). Поэтому `Ext/ObjectModule.bsl` и т.п. ищутся в `xml/<имя>/Ext/...`.

- [ ] **Step 5: Запустить convertFromXML, забрать `Свойства.yaml` из tmp-папки**

Тест должен **упасть** на `expect(yaml.result).toBe(yaml.expected)`, потому что `readDocumentYAML` пуст. В выводе vitest будет diff — реальный YAML против пустого. Скопируй фактический результат.

Run: `pnpm -C packages/core test -- metadataDocument/convertFromXML 2>&1 | tail -50`

Expected: тест fails. В diff видно, что фактический YAML — некоторая многострочная строка; именно её надо положить в `data.ts`.

Альтернатива: добавить временную строку перед `expect`, выводящую `yaml.result` через `console.log(JSON.stringify(yaml.result))`, прогнать раз, потом убрать. Или сразу прочитать файл из `outputDir` — но `outputDir` — `tmpdir`, прочитать сложнее.

Самый прямолинейный способ — прочитать diff из вывода теста.

- [ ] **Step 6: Положить фактический YAML в `data.ts`**

Содержимое `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/data.ts`:

```ts
export const readDocumentYAML = `<актуальная YAML-строка из шага 5>`
```

Используй template-literal с обратными кавычками, чтобы сохранить многострочный YAML без эскейпов.

- [ ] **Step 7: Создать `nkdk/ДокументВсеСвойства/Свойства.yaml` с тем же содержимым**

Это будет вход для syncToXML. Тот же YAML, что положен в `data.ts`.

Run:
```bash
mkdir -p packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/nkdk/ДокументВсеСвойства
```

Затем создать файл `nkdk/ДокументВсеСвойства/Свойства.yaml` с содержимым YAML (копия из `data.ts`, но без TS-обёртки — чистый YAML).

- [ ] **Step 8: Запустить convertFromXML — теперь зелёный**

Run: `pnpm -C packages/core test -- metadataDocument/convertFromXML 2>&1 | tail -20`

Expected: тест зелёный.

- [ ] **Step 9: Полностью переписать `syncToXML.test.ts` (удалить старый round-trip XML→YAML→XML)**

Полное содержимое (заменить полностью):

```ts
import { describe, expect, it } from "vitest"
import { runSyncToXML } from "~/tests/appliedObject"
import { MetadataDocumentRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataDocument", () => {
  it("читает Document из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await runSyncToXML({
      rule: MetadataDocumentRules,
      name: "ДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ДокументВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
```

- [ ] **Step 10: Запустить syncToXML**

Run: `pnpm -C packages/core test -- metadataDocument/syncToXML 2>&1 | tail -30`

Expected: тест зелёный. Если не зелёный — посмотреть diff между `xml/ДокументВсеСвойства.xml` и тем, что синтезирует sync. Возможные причины: `Свойства.yaml` в `nkdk/` отличается от того, что генерирует convertFromXML; или в YAML нужно что-то донастроить (например, не хватает дополнительных файлов в `nkdk/<имя>/`, например модулей).

Если sync требует модули в `nkdk/<имя>/МодульОбъекта.bsl` и т.п. — скопировать их из `xml/<имя>/Ext/<...>.bsl` под русскими именами:

```bash
cp xml/ДокументВсеСвойства/Ext/ObjectModule.bsl nkdk/ДокументВсеСвойства/МодульОбъекта.bsl
cp xml/ДокументВсеСвойства/Ext/ManagerModule.bsl nkdk/ДокументВсеСвойства/МодульМенеджера.bsl
mkdir -p nkdk/ДокументВсеСвойства/Команды
cp xml/ДокументВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl nkdk/ДокументВсеСвойства/Команды/Команда1.bsl
```

Конкретный набор сверить с тем, что у Catalog в `nkdk/СправочникCоВсемиОбъектами/`.

- [ ] **Step 11: Прогнать `pnpm test` целиком**

Run: `pnpm test 2>&1 | tail -30`

Expected: все тесты зелёные. Если что-то осыпалось — фиксируй немедленно.

- [ ] **Step 12: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync \
        packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts \
        packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts
git commit -m "test: :white_check_mark: Document sync/convert через helpers + перетряска fixtures"
```

---

### Task 12: Sequence — миграция

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/fromYAML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`

- [ ] **Step 1: Переписать `fromXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { importAppliedObjectFromXML, exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataSequenceRules } from "./rules"
import { MetadataSequence } from "./types"

describe("import MetadataSequence from XML", () => {
  it("should import full", () => {
    expect(
      importAppliedObjectFromXML<MetadataSequence>({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      importAppliedObjectFromXML<MetadataSequence>({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = importAppliedObjectFromXML<MetadataSequence>({
      rule: MetadataSequenceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataSequenceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(result).toEqual(expected)
  })
})
```

**Note:** Если у Sequence только одна фикстура (`full.xml`) — посмотри `__fixtures__/`, упроси шаг.

- [ ] **Step 2: Переписать `toXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { exportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataSequenceRules } from "./rules"

describe("export MetadataSequence to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
  ])("should export $fixture", ({ fixture, data }) => {
    const { result, expected } = exportAppliedObjectToXML({
      rule: MetadataSequenceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 3: Переписать `fromYAML.test.ts`**

Прочитай текущий `metadataSequence/fromYAML.test.ts` и адаптируй по образцу Document'а: импорт через `importAppliedObjectFromYAML`, name и yaml-фикстуры берутся из `__fixtures__/full.ts`/`minimal.ts`.

- [ ] **Step 4: Переписать `syncToXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { runSyncToXML } from "~/tests/appliedObject"
import { MetadataSequenceRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataSequence", () => {
  it("читает Sequence из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await runSyncToXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПоследовательностьВсеПоля.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
```

- [ ] **Step 5: Переписать `convertFromXML.test.ts`**

Полное содержимое:

```ts
import { describe, expect, it } from "vitest"
import { runConvertFromXML } from "~/tests/appliedObject"
import { readSequenceYAML } from "./__fixtures__/sync/data"
import { MetadataSequenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSequence", () => {
  it("читает Sequence из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await runConvertFromXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      expectedYAML: readSequenceYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
```

- [ ] **Step 6: Запустить тесты Sequence**

Run: `pnpm -C packages/core test -- metadataSequence 2>&1 | tail -30`

Expected: все тесты зелёные.

- [ ] **Step 7: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataSequence/
git commit -m "test: :white_check_mark: Sequence тесты через appliedObject helpers"
```

---

### Task 13: DocumentNumerator — миграция

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocumentNumerator/{fromXML,toXML,fromYAML,toYAML,syncToXML,convertFromXML}.test.ts`

- [ ] **Step 1: Прочитать существующие тесты Numerator'а**

Run: `ls packages/core/metadata/appliedObjects/metadataDocumentNumerator/__fixtures__/`

Expected: видно, какие фикстуры есть (`full.ts`, `full.xml`, `minimal.ts`, `minimal.xml`, `sync/`).

- [ ] **Step 2: Переписать `fromXML.test.ts`** по образцу Sequence (Task 12 Step 1), заменив тип на `MetadataDocumentNumerator` и rule на `MetadataDocumentNumeratorRules`.

- [ ] **Step 3: Переписать `toXML.test.ts`** по образцу Sequence (Task 12 Step 2).

- [ ] **Step 4: Переписать `fromYAML.test.ts`** по образцу Document (Task 10 Step 3), используя имена экземпляров из существующего теста.

- [ ] **Step 5: Переписать `toYAML.test.ts`** по образцу Document (Task 10 Step 4).

- [ ] **Step 6: Переписать `syncToXML.test.ts`** — посмотреть, какие файлы текущий тест проверяет, передать их в `expectedFiles`.

- [ ] **Step 7: Переписать `convertFromXML.test.ts`** по образцу Sequence (Task 12 Step 5).

- [ ] **Step 8: Запустить тесты Numerator'а**

Run: `pnpm -C packages/core test -- metadataDocumentNumerator 2>&1 | tail -30`

Expected: все тесты зелёные.

- [ ] **Step 9: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocumentNumerator/
git commit -m "test: :white_check_mark: DocumentNumerator тесты через appliedObject helpers"
```

---

### Task 14: Удалить локальные `__fixtures__/sync/out/`

**Files:**
- Delete: `packages/core/metadata/appliedObjects/{metadataCatalog,metadataDocument,metadataSequence,metadataDocumentNumerator}/__fixtures__/sync/out/`

- [ ] **Step 1: Проверить, что `.gitignore` уже игнорирует `out/`**

Run: `grep -E "^out/?$" .gitignore`

Expected: вывод содержит `out/`. Если нет — добавь строку `out/` в `.gitignore`.

- [ ] **Step 2: Удалить локальные out-папки**

Run:
```bash
find packages/core/metadata/appliedObjects -type d -name out -path "*/sync/out" -exec rm -rf {} + 2>/dev/null
find packages/core/metadata/appliedObjects -type d -name out-test -path "*/sync/out-test" -exec rm -rf {} + 2>/dev/null
```

Expected: команды без ошибок.

- [ ] **Step 3: Проверить, что в git нет ни одного файла под `sync/out/`**

Run: `git ls-files packages/core/metadata/appliedObjects | grep -E "sync/out(-test)?/" || echo "clean"`

Expected: вывод `clean` (если строки есть — значит их закоммитили в обход `.gitignore`; нужно `git rm -r` и закоммитить отдельно).

- [ ] **Step 4: Если шаг 3 показал файлы**

Run:
```bash
git rm -r packages/core/metadata/appliedObjects/<нужный_объект>/__fixtures__/sync/out
git rm -r packages/core/metadata/appliedObjects/<нужный_объект>/__fixtures__/sync/out-test
git commit -m "chore: :wastebasket: убрать локальные sync/out из git"
```

---

### Task 15: Обновить шаблон `_shared/metadata/io-tests.md`

**Files:**
- Modify: `.agents/skills/_shared/metadata/io-tests.md`

- [ ] **Step 1: Заменить шаблон `convertFromXML.test.ts`**

Открой `.agents/skills/_shared/metadata/io-tests.md`. Найди раздел `## Шаблон convertFromXML.test.ts` и замени его блок кода на:

````markdown
```typescript
import { describe, expect, it } from "vitest"
import { runConvertFromXML } from "~/tests/appliedObject"
import { read<Name>YAML } from "./__fixtures__/sync/data"
import { <MetadataName>Rules } from "./rules"

describe("convertAppliedObjectFromXML — <MetadataName>", () => {
  it("читает <ТипОбъекта> из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await runConvertFromXML({
      rule: <MetadataName>Rules,
      name: "<ИмяЭкземпляра>",
      importMetaUrl: import.meta.url,
      expectedYAML: read<Name>YAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
```
````

- [ ] **Step 2: Заменить шаблон `syncToXML.test.ts`**

Найди раздел `## Шаблон syncToXML.test.ts`, замени блок кода на:

````markdown
```typescript
import { describe, expect, it } from "vitest"
import { runSyncToXML } from "~/tests/appliedObject"
import { <MetadataName>Rules } from "./rules"

describe("syncAppliedObjectToXML — <MetadataName>", () => {
  it("читает <ТипОбъекта> из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await runSyncToXML({
      rule: <MetadataName>Rules,
      name: "<ИмяЭкземпляра>",
      importMetaUrl: import.meta.url,
      expectedFiles: ["<ИмяЭкземпляра>.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
```
````

- [ ] **Step 3: Обновить раздел «Заполнение данных фикстур»**

Заменить упоминания `out/` на упоминание `tmpdir`-папки, а раздел «Если прикладной объект не имеет YAML-свойств» оставить как есть.

Найти строку «Заполни так: запусти `convertFromXML.test.ts`, скопируй вывод из `out/<Имя>/Свойства.yaml`.» и заменить на:

> Заполни так: запусти `convertFromXML.test.ts` с пустым `read<Name>YAML`, скопируй фактический YAML из vitest-diff в `data.ts` и в `nkdk/<Имя>/Свойства.yaml`.

- [ ] **Step 4: Удалить раздел про `out/` чистку**

Найти строку про `out/` чистку («`out/` создаётся тестом динамически — в репозитории её не коммитить...») и заменить на:

> Helper'ы `runSyncToXML` / `runConvertFromXML` создают output в `tmpdir` через `mkdtempSync` — никаких `out/` папок в `__fixtures__/sync/` не создаётся.

- [ ] **Step 5: Коммит**

```bash
git add .agents/skills/_shared/metadata/io-tests.md
git commit -m "docs: :memo: обновить шаблон io-tests под appliedObject helpers"
```

---

### Task 16: Обновить шаблон `_shared/metadata/tests.md`

**Files:**
- Modify: `.agents/skills/_shared/metadata/tests.md`

- [ ] **Step 1: Прочитать текущий шаблон**

Run: `cat .agents/skills/_shared/metadata/tests.md`

Expected: видны шаблоны `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts`.

- [ ] **Step 2: Заменить шаблон `fromXML.test.ts`**

Использовать как референс актуальный `metadataCatalog/fromXML.test.ts` после Task 7. Имя/тип объекта — плейсхолдеры `<MetadataName>` / `<имя_фикстур>` (`full.xml`/`minimal.xml`).

- [ ] **Step 3: Заменить шаблон `toXML.test.ts`** аналогично, ссылаясь на `metadataCatalog/toXML.test.ts`.

- [ ] **Step 4: Заменить шаблон `fromYAML.test.ts`** ссылаясь на `metadataDocument/fromYAML.test.ts` (общий orchestration-путь — типичный кейс для нового объекта).

- [ ] **Step 5: Заменить шаблон `toYAML.test.ts`** ссылаясь на `metadataDocument/toYAML.test.ts`.

- [ ] **Step 6: Если в файле упоминаются `mockContext` / `mockContextToYAML` для прямых вызовов — указать, что они нужны только для специфичных функций (как Catalog), для остальных — helper'ы**

- [ ] **Step 7: Коммит**

```bash
git add .agents/skills/_shared/metadata/tests.md
git commit -m "docs: :memo: обновить шаблон tests под appliedObject helpers"
```

---

### Task 17: Финальная проверка

- [ ] **Step 1: Прогнать весь тест-сьют**

Run: `pnpm test 2>&1 | tail -30`

Expected: все пакеты зелёные. Особенно — `packages/core`.

- [ ] **Step 2: Проверить отсутствие осиротевших импортов**

Run: `grep -rE "import.*from.*(readAndParseXMLFixture|readXMLFixtureAsString)" packages/core/metadata/appliedObjects/ --include="*.test.ts" | grep -v "fromYAML.dependencies"`

Expected: пустой вывод (после миграции прямых импортов `readAndParseXMLFixture`/`readXMLFixtureAsString` в test-файлах applied object'ов остаться не должно — всё через helper'ы; исключение — `fromYAML.dependencies.test.ts`, если там используется напрямую).

- [ ] **Step 3: Type-check всего пакета**

Run: `pnpm -C packages/core type-check 2>&1 | tail -20`

Expected: ошибок нет.

- [ ] **Step 4: Финальный коммит, если что-то поправлялось точечно**

Если на Step 1-3 ничего править не пришлось — задача выполнена, коммит не нужен.

---

## Self-review notes

- Все типы согласованы: `MetadataItemRule` используется единообразно во всех helper'ах.
- Все имена функций совпадают между задачами: `importAppliedObjectFromXML`, `exportAppliedObjectToXML`, `importAppliedObjectFromYAML`, `exportAppliedObjectToYAML`, `runSyncToXML`, `runConvertFromXML`.
- Спека покрыта:
  - Helper-модуль (Tasks 1–6).
  - Catalog миграция всех 6 тестов + вынос графа (Tasks 7–9).
  - Document миграция включая удаление round-trip syncToXML и перетряску fixtures (Tasks 10–11).
  - Sequence миграция (Task 12).
  - DocumentNumerator миграция (Task 13).
  - Удаление локальных `out/` (Task 14).
  - Обновление шаблонов скиллов (Tasks 15–16).
  - Финальная проверка (Task 17).
- Риск Catalog YAML round-trip через общий orchestration-путь (Task 8 Step 5) — есть запасной путь возврата на специфичные функции.
- Риск Document fixture-перетряски (Task 11) — минимизирован: один коммит, явные шаги, vitest-diff используется как источник истины для `Свойства.yaml`.
