# Declarative Import — Top-Level Applied Object Kinds

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подключить Document, DocumentNumerator, Sequence к CLI-команде `import` (XML→YAML) и `sync` (YAML→XML) декларативно: добавление нового корневого типа = одно поле `xmlDir` в правиле + одна строка в реестре, без правок walker'а.

**Architecture:** Расширяем `MetadataItemRule` опциональным полем `xmlDir`, выносим список корневых правил в новый модуль `topLevelRules.ts`, перепишем циклы в `appliedObjects/configuration/{convertFromXML,syncToXML}.ts` так, чтобы они итерировались по этому реестру. YAML-папка выводится из существующего `itemTypePrefix`. Формы остаются специальным случаем для Catalog (вне границ задачи — целевое решение через PropertyRule, см. memory `project_forms_as_property_rule.md`).

**Tech Stack:** TypeScript, vitest, pnpm workspaces. Спека: `docs/superpowers/specs/2026-04-25-declarative-import-top-level-kinds-design.md`.

---

## Файловая структура

**Создаются:**
- `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts` — реестр корневых `MetadataItemRule`.

**Меняются:**
- `packages/core/metadata/orchestration/property/types.ts` — добавление поля `xmlDir`.
- `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — `xmlDir: "Catalogs"`.
- `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` — `xmlDir: "Documents"`.
- `packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts` — `xmlDir: "DocumentNumerators"`.
- `packages/core/metadata/appliedObjects/metadataSequence/rules.ts` — `xmlDir: "Sequences"`.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` — обход по реестру + расширение `kind` в `ConfigurationSyncResult`.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` — симметрично.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts` — дополнить фикстуру и тесты.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` — дополнить фикстуру и тесты.
- `packages/core/tests/fixtures/sync/syncConfiguration/xml/Documents/ДокументПоУмолчанию.xml` — копия `metadataDocument/__fixtures__/minimal.xml`.
- `packages/core/tests/fixtures/sync/syncConfiguration/xml/DocumentNumerators/НумераторПоУмолчанию.xml` — копия `metadataDocumentNumerator/__fixtures__/minimal.xml`.
- `packages/core/tests/fixtures/sync/syncConfiguration/xml/Sequences/ПоследовательностьПоУмолчанию.xml` — копия `metadataSequence/__fixtures__/minimal.xml`.

---

## Task 1: Smoke-test `convertAppliedObjectFromXML` для Document и Sequence

**Зачем:** у `MetadataDocumentRules` **нет** свойства `xmlRoot` (в отличие от Catalog/DocumentNumerator/Sequence) — обёртка `<Document>` зашита в `xmlParents` каждого свойства. Перед массовым включением убеждаемся, что путь `convertAppliedObjectFromXML(MetadataDocumentRules)` рабочий. То же для Sequence — для него тоже нет интеграционного теста на этом уровне.

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts`

- [ ] **Step 1.1: Прочитать существующий тест**

Run: `cat packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts`
Цель: понять формат теста для `MetadataDocumentNumeratorRules`, повторить его для Document и Sequence.

- [ ] **Step 1.2: Добавить failing-тесты для Document и Sequence**

В `packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts` добавить два новых блока `it(...)` рядом с существующим тестом для DocumentNumerator. Каждый тест:
1. Читает minimal.xml из соответствующего `__fixtures__/`.
2. Вызывает `convertAppliedObjectFromXML` с правилом и tmp `outputDir`.
3. Утверждает, что `outputDir/<itemTypePrefix>/<name>/Свойства.yaml` создан и содержит непустой YAML с ключом `Имя:` равным имени из XML.

Пример (Document, дополнить по паттерну DocumentNumerator-теста):

```ts
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
// ...
it("convertAppliedObjectFromXML работает для Document (xmlParents-обёртка вместо XMLRoot)", async () => {
  const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "doc-import-"))
  await convertAppliedObjectFromXML({
    rule: MetadataDocumentRules,
    context: mockContextFromXML(),
    inputDir: join(__dirname, "../../appliedObjects/metadataDocument/__fixtures__"),
    name: "minimal",
    outputDir: tmpDir,
  })
  const yamlPath = join(tmpDir, "minimal", "Свойства.yaml")
  expect(fs.existsSync(yamlPath)).toBe(true)
  expect(fs.readFileSync(yamlPath, "utf-8")).toContain("Имя: ДокументПоУмолчанию")
})
```

(Sequence — аналогично, ожидаемое имя `ПоследовательностьПоУмолчанию`.)

- [ ] **Step 1.3: Запустить тесты, убедиться что они **проходят** (или зафиксировать падение)**

Run: `pnpm --filter @nakidka/core test convertFromXML.test`
Ожидание: оба новых теста зелёные. Если красные — это означает, что правило само не готово; **остановиться и поднять с пользователем** (это меняет границы задачи).

- [ ] **Step 1.4: Коммит**

```bash
git add packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts
git commit -m "test: :white_check_mark: smoke-тест convertAppliedObjectFromXML для Document и Sequence"
```

---

## Task 2: Поле `xmlDir` в типе `MetadataItemRule`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts:307-356`

- [ ] **Step 2.1: Добавить поле `xmlDir` в интерфейс**

В `packages/core/metadata/orchestration/property/types.ts` в `interface MetadataItemRule` (около строки 307) рядом с `itemTypePrefix?: string` добавить:

```ts
  /**
   * Имя XML-папки в дампе конфигурации (например "Catalogs", "Documents", "DocumentNumerators", "Sequences").
   * Если задано — правило считается корневым и участвует в обходе configuration walker'а.
   * Если не задано — правило внутреннее (Command, Predefined и т.п.).
   */
  xmlDir?: string
```

- [ ] **Step 2.2: Прогнать тесты — убедиться что ничего не упало**

Run: `pnpm test`
Ожидание: всё зелёное (поле опциональное, никто его пока не использует).

- [ ] **Step 2.3: Коммит**

```bash
git add packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: добавить опциональное поле xmlDir в MetadataItemRule"
```

---

## Task 3: Прописать `xmlDir` в правилах четырёх типов

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — у `MetadataCatalogRules` (около `itemTypePrefix: "Справочник"`).
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` — у `MetadataDocumentRules`.
- Modify: `packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts` — у `MetadataDocumentNumeratorRules`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts` — у `MetadataSequenceRules`.

- [ ] **Step 3.1: Добавить `xmlDir` в `MetadataCatalogRules`**

В `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` рядом с `itemTypePrefix: "Справочник"`:
```ts
  itemTypePrefix: "Справочник",
  xmlDir: "Catalogs",
```

- [ ] **Step 3.2: Добавить `xmlDir` в `MetadataDocumentRules`**

В `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` рядом с `itemTypePrefix: "Документ"`:
```ts
  itemTypePrefix: "Документ",
  xmlDir: "Documents",
```

- [ ] **Step 3.3: Добавить `xmlDir` в `MetadataDocumentNumeratorRules`**

В `packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts` рядом с `itemTypePrefix: "Нумератор"`:
```ts
  itemTypePrefix: "Нумератор",
  xmlDir: "DocumentNumerators",
```

- [ ] **Step 3.4: Добавить `xmlDir` в `MetadataSequenceRules`**

В `packages/core/metadata/appliedObjects/metadataSequence/rules.ts` рядом с `itemTypePrefix: "Последовательность"`:
```ts
  itemTypePrefix: "Последовательность",
  xmlDir: "Sequences",
```

- [ ] **Step 3.5: Прогнать тесты**

Run: `pnpm test`
Ожидание: всё зелёное (поле пока не читается).

- [ ] **Step 3.6: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/rules.ts \
        packages/core/metadata/appliedObjects/metadataDocument/rules.ts \
        packages/core/metadata/appliedObjects/metadataDocumentNumerator/rules.ts \
        packages/core/metadata/appliedObjects/metadataSequence/rules.ts
git commit -m "feat: :sparkles: задекларировать xmlDir для Catalog/Document/DocumentNumerator/Sequence"
```

---

## Task 4: Реестр корневых правил `topLevelRules.ts`

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`

- [ ] **Step 4.1: Создать модуль**

Содержимое `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"

/**
 * Реестр корневых прикладных объектов, которые обходит configuration walker
 * (`syncConfigurationFromXML`/`syncConfigurationToXML`). Добавление нового
 * корневого типа = одна строка тут + поле `xmlDir` в правиле.
 */
export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataSequenceRules,
]
```

- [ ] **Step 4.2: Прогнать тесты — модуль никем не импортируется, тесты должны быть зелёные**

Run: `pnpm test`
Ожидание: всё зелёное.

- [ ] **Step 4.3: Коммит**

```bash
git add packages/core/metadata/appliedObjects/configuration/topLevelRules.ts
git commit -m "feat: :sparkles: реестр корневых правил TopLevelMetadataItemRules"
```

---

## Task 5: Добавить XML-фикстуры для Document/DocumentNumerator/Sequence в общую фикстуру `syncConfiguration`

**Files:**
- Create: `packages/core/tests/fixtures/sync/syncConfiguration/xml/Documents/ДокументПоУмолчанию.xml`
- Create: `packages/core/tests/fixtures/sync/syncConfiguration/xml/DocumentNumerators/НумераторПоУмолчанию.xml`
- Create: `packages/core/tests/fixtures/sync/syncConfiguration/xml/Sequences/ПоследовательностьПоУмолчанию.xml`

- [ ] **Step 5.1: Скопировать минимальные XML-фикстуры**

```bash
mkdir -p packages/core/tests/fixtures/sync/syncConfiguration/xml/Documents \
         packages/core/tests/fixtures/sync/syncConfiguration/xml/DocumentNumerators \
         packages/core/tests/fixtures/sync/syncConfiguration/xml/Sequences

cp packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/minimal.xml \
   packages/core/tests/fixtures/sync/syncConfiguration/xml/Documents/ДокументПоУмолчанию.xml

cp packages/core/metadata/appliedObjects/metadataDocumentNumerator/__fixtures__/minimal.xml \
   packages/core/tests/fixtures/sync/syncConfiguration/xml/DocumentNumerators/НумераторПоУмолчанию.xml

cp packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/minimal.xml \
   packages/core/tests/fixtures/sync/syncConfiguration/xml/Sequences/ПоследовательностьПоУмолчанию.xml
```

- [ ] **Step 5.2: Прогнать существующие тесты — убедиться что они не сломались**

Run: `pnpm --filter @nakidka/core test syncConfiguration`
Ожидание: существующие тесты для Catalog зелёные. Walker сейчас новые папки игнорирует (хардкод на Catalogs).

- [ ] **Step 5.3: Коммит**

```bash
git add packages/core/tests/fixtures/sync/syncConfiguration/xml/Documents \
        packages/core/tests/fixtures/sync/syncConfiguration/xml/DocumentNumerators \
        packages/core/tests/fixtures/sync/syncConfiguration/xml/Sequences
git commit -m "test: :white_check_mark: фикстуры Document/DocumentNumerator/Sequence в syncConfiguration"
```

---

## Task 6: Failing-тест для нового поведения `syncConfigurationFromXML`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`

- [ ] **Step 6.1: Дописать новый `it(...)` блок в существующий describe**

В `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts` после существующего теста добавить:

```ts
  it("импортирует Document, DocumentNumerator и Sequence в соответствующие YAML-папки", async () => {
    fs.mkdirSync(outputDir, { recursive: true })

    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir,
      outputDir,
    })

    const documentYaml = fs.readFileSync(
      join(outputDir, "Документ", "ДокументПоУмолчанию", "Свойства.yaml"),
      "utf-8"
    )
    expect(documentYaml).toContain("Имя: ДокументПоУмолчанию")

    const numeratorYaml = fs.readFileSync(
      join(outputDir, "Нумератор", "НумераторПоУмолчанию", "Свойства.yaml"),
      "utf-8"
    )
    expect(numeratorYaml).toContain("Имя: НумераторПоУмолчанию")

    const sequenceYaml = fs.readFileSync(
      join(outputDir, "Последовательность", "ПоследовательностьПоУмолчанию", "Свойства.yaml"),
      "utf-8"
    )
    expect(sequenceYaml).toContain("Имя: ПоследовательностьПоУмолчанию")
  })
```

- [ ] **Step 6.2: Запустить тест — убедиться, что **падает** на отсутствующих файлах**

Run: `pnpm --filter @nakidka/core test convertFromXML.test`
Ожидание: новый тест **красный** (`ENOENT` на `Документ/...`), существующий — зелёный.

- [ ] **Step 6.3: Коммит (red)**

```bash
git add packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "test: :white_check_mark: failing-тест на импорт Document/Numerator/Sequence в syncConfigurationFromXML"
```

---

## Task 7: Переписать `syncConfigurationFromXML` на обход `TopLevelMetadataItemRules`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`

- [ ] **Step 7.1 объединён со Step 7.2 (полная замена файла) — пропустить.**

- [ ] **Step 7.2: Заменить тело walker'а на обход реестра**

Полная новая реализация файла `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` (импорт `MetadataCatalogRules` удаляется — больше не нужен):

```ts
import fs from "fs"
import { basename, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

const IO_CONCURRENCY = 64

export type ConfigurationSyncResult = {
  succeeded: number
  failed: Array<{
    kind: string
    name: string
    parent?: string
    error: Error
  }>
}

export const syncConfigurationFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  outputDir: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  // Discovery + tasks по всем корневым типам из реестра
  const tasks: BatchTask<void>[] = []

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    if (rule.itemTypePrefix === undefined) continue

    const xmlDirAbs = join(inputDir, rule.xmlDir)
    const yamlDirAbs = join(outputDir, rule.itemTypePrefix)
    if (!fs.existsSync(xmlDirAbs)) continue

    const entries = await fs.promises.readdir(xmlDirAbs, { withFileTypes: true })
    const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

    // Формы обрабатываем только если у правила есть свойство типа "ChildFormNames"
    const hasForms = Object.values(rule.properties).some((p) => p.type === "ChildFormNames")

    const formDiscoveries = await Promise.all(
      xmlFiles.map(async (entry) => {
        const name = basename(entry.name, ".xml")
        if (!hasForms) return { name, formsDir: "", formNames: [] }
        const formsDir = join(xmlDirAbs, name, "Forms")
        if (!fs.existsSync(formsDir)) return { name, formsDir, formNames: [] }
        const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
        const formNames = formEntries
          .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
          .map((e) => basename(e.name, ".xml"))
        return { name, formsDir, formNames }
      }),
    )

    for (const { name, formsDir, formNames } of formDiscoveries) {
      tasks.push({
        kind: rule.itemType,
        name,
        run: () =>
          convertAppliedObjectFromXML({
            rule,
            context,
            inputDir: xmlDirAbs,
            name,
            outputDir: yamlDirAbs,
          }),
      })
      for (const formName of formNames) {
        tasks.push({
          kind: "form",
          name: formName,
          parent: name,
          run: () =>
            convertFormFromXML({
              context,
              inputDir: formsDir,
              formName,
              outputDir: join(yamlDirAbs, name),
            }),
        })
      }
    }
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  return {
    succeeded: batchResult.succeeded,
    failed: batchResult.failed.map((f) => ({
      kind: f.kind,
      name: f.name,
      parent: f.parent,
      error: f.error,
    })),
  }
}
```

Удалить старые импорты `MetadataCatalogRules` (теперь не нужен в этом файле). Импорт `convertFormFromXML` оставить.

- [ ] **Step 7.3: Запустить тесты — убедиться что зелёные**

Run: `pnpm --filter @nakidka/core test convertFromXML.test`
Ожидание: и существующий тест (Catalog + Form) и новый (Document/Numerator/Sequence) — **зелёные**.

- [ ] **Step 7.4: Прогнать все тесты пакета core**

Run: `pnpm --filter @nakidka/core test`
Ожидание: всё зелёное (никаких регрессий).

- [ ] **Step 7.5: Коммит (green)**

```bash
git add packages/core/metadata/appliedObjects/configuration/convertFromXML.ts
git commit -m "refactor: :recycle: syncConfigurationFromXML обходит TopLevelMetadataItemRules"
```

---

## Task 8: Failing-тест для нового поведения `syncConfigurationToXML`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 8.1: Подготовить YAML-вход для нового теста через round-trip**

Стратегия: round-trip — сначала прогон `syncConfigurationFromXML` через временный `outputDir`, потом тот же YAML подаём в `syncConfigurationToXML`, ожидаем тот же XML на выходе.

В `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` добавить второй `it(...)`:

```ts
В шапке файла дополнить импорты (добавить `mockContextFromXML` в уже существующий импорт `~/tests/mockContext`, а также новый импорт `syncConfigurationFromXML`):

```ts
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { syncConfigurationFromXML } from "./convertFromXML"
```

Внутри describe — новый блок:

```ts
  it("round-trip Document/DocumentNumerator/Sequence: XML → YAML → XML возвращает исходный XML", async () => {
    const tmpYamlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_yaml")
    const tmpXmlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_xml")
    if (fs.existsSync(tmpYamlDir)) fs.rmSync(tmpYamlDir, { recursive: true })
    if (fs.existsSync(tmpXmlDir)) fs.rmSync(tmpXmlDir, { recursive: true })
    fs.mkdirSync(tmpYamlDir, { recursive: true })
    fs.mkdirSync(tmpXmlDir, { recursive: true })

    // 1. XML → YAML
    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: referenceDir,
      outputDir: tmpYamlDir,
    })

    // 2. YAML → XML
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: tmpYamlDir,
      outputDir: tmpXmlDir,
      referenceDir,
    })

    for (const [xmlSubdir, fileName] of [
      ["Documents", "ДокументПоУмолчанию.xml"],
      ["DocumentNumerators", "НумераторПоУмолчанию.xml"],
      ["Sequences", "ПоследовательностьПоУмолчанию.xml"],
    ] as const) {
      const expected = readXMLFileAsString(join("sync/syncConfiguration/xml", xmlSubdir, fileName))
      const actual = readXMLFileAsString(join("sync/syncConfiguration/_tmp_xml", xmlSubdir, fileName))
      expect(actual, `mismatch in ${xmlSubdir}/${fileName}`).toBe(expected)
    }

    fs.rmSync(tmpYamlDir, { recursive: true })
    fs.rmSync(tmpXmlDir, { recursive: true })
  })
```

- [ ] **Step 8.2: Запустить тест — убедиться, что **падает** (Documents/Numerators/Sequences пока не обрабатываются `syncConfigurationToXML`)**

Run: `pnpm --filter @nakidka/core test syncToXML.test`
Ожидание: новый тест **красный** (`ENOENT` на `_tmp_xml/Documents/...`), существующий — зелёный.

- [ ] **Step 8.3: Коммит (red)**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: failing round-trip тест для Document/Numerator/Sequence в syncConfigurationToXML"
```

---

## Task 9: Переписать `syncConfigurationToXML` на обход `TopLevelMetadataItemRules`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`

- [ ] **Step 9.1: Заменить тело walker'а на обход реестра**

В `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` полностью заменить реализацию `syncConfigurationToXML`:

```ts
import fs from "fs"
import { join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { ConfigurationSyncResult } from "./convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

const IO_CONCURRENCY = 64

export const syncConfigurationToXML = async (params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  const tasks: BatchTask<void>[] = []

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    if (rule.itemTypePrefix === undefined) continue

    const yamlDirAbs = join(inputDir, rule.itemTypePrefix)
    const xmlOutputDir = join(outputDir, rule.xmlDir)
    const xmlReferenceDir = join(referenceDir, rule.xmlDir)
    if (!fs.existsSync(yamlDirAbs)) continue

    const entries = await fs.promises.readdir(yamlDirAbs, { withFileTypes: true })
    const itemDirs = entries.filter((e) => e.isDirectory())

    const hasForms = Object.values(rule.properties).some((p) => p.type === "ChildFormNames")

    const discoveries = await Promise.all(
      itemDirs.map(async (entry) => {
        const name = entry.name
        const propertiesPath = join(yamlDirAbs, name, "Свойства.yaml")
        if (!fs.existsSync(propertiesPath)) return null

        if (!hasForms) return { name, formNames: [] as string[] }

        const formsDir = join(yamlDirAbs, name, "Формы")
        if (!fs.existsSync(formsDir)) return { name, formNames: [] as string[] }

        const formEntries = await fs.promises.readdir(formsDir, { withFileTypes: true })
        const formNames = formEntries
          .filter((e) => e.isDirectory())
          .filter((e) => {
            const formYamlPath = join(formsDir, e.name, "Форма.yaml")
            const formNkdkPath = join(formsDir, e.name, "Форма.nkdk")
            return fs.existsSync(formYamlPath) && fs.existsSync(formNkdkPath)
          })
          .map((e) => e.name)
        return { name, formNames }
      }),
    )

    for (const discovery of discoveries) {
      if (discovery === null) continue
      const { name, formNames } = discovery

      tasks.push({
        kind: rule.itemType,
        name,
        run: () =>
          syncAppliedObjectToXML({
            rule,
            context: { ...context, exportToXML: { ...context.exportToXML } },
            inputDir: yamlDirAbs,
            name,
            outputDir: xmlOutputDir,
            referenceDir: xmlReferenceDir,
          }),
      })

      const itemPath = join(yamlDirAbs, name)
      const formOutputDir = join(xmlOutputDir, name)
      const formReferenceDir = join(xmlReferenceDir, name, "Forms")

      for (const formName of formNames) {
        tasks.push({
          kind: "form",
          name: formName,
          parent: name,
          run: () =>
            syncFormToXML({
              context,
              inputDir: itemPath,
              formName,
              outputDir: formOutputDir,
              referenceDir: formReferenceDir,
            }),
        })
      }
    }
  }

  const batchResult = await runBatch(tasks, { concurrency: IO_CONCURRENCY })

  return {
    succeeded: batchResult.succeeded,
    failed: batchResult.failed.map((f) => ({
      kind: f.kind,
      name: f.name,
      parent: f.parent,
      error: f.error,
    })),
  }
}
```

(Удалить импорт `MetadataCatalogRules`, удалить узкий каст `kind as "catalog" | "form"`.)

- [ ] **Step 9.2: Запустить тесты**

Run: `pnpm --filter @nakidka/core test syncToXML.test`
Ожидание: и существующий (Catalog round-trip), и новый (Document/Numerator/Sequence round-trip) — **зелёные**.

- [ ] **Step 9.3: Прогнать все тесты пакета core**

Run: `pnpm --filter @nakidka/core test`
Ожидание: всё зелёное.

- [ ] **Step 9.4: Коммит (green)**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts
git commit -m "refactor: :recycle: syncConfigurationToXML обходит TopLevelMetadataItemRules"
```

---

## Task 10: Полный прогон `pnpm test` и ручная проверка CLI

**Files:** —

- [ ] **Step 10.1: Прогнать всю свиту**

Run: `pnpm test` (из корня репо)
Ожидание: все тесты зелёные во всех пакетах.

- [ ] **Step 10.2: Ручной прогон импорта на trade-дампе**

Run:
```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts import \
  /Users/nikita/git/round-trip-source/trade \
  /Users/nikita/git/erp_nkdk \
  > /tmp/import_out.log 2> /tmp/import_err.log; echo EXIT=$?
```

Проверить:
- В `/tmp/import_out.log` число `Готово: N успешно` **больше**, чем 1437 (предыдущий прогон) — за счёт Document/DocumentNumerator/Sequence объектов.
- `ls /Users/nikita/git/erp_nkdk/Документ` — непустой (документы создались).
- `ls /Users/nikita/git/erp_nkdk/Нумератор` — непустой.
- `ls /Users/nikita/git/erp_nkdk/Последовательность` — непустой.
- В `/tmp/import_err.log` нет новых **типов** ошибок относительно прежнего прогона (старые формовые ошибки `Unknown group: Horizontal` могут остаться, но не должны умножиться по новым категориям).

- [ ] **Step 10.3: Зафиксировать наблюдаемые цифры**

Записать в комментарий PR / отчёт:
- Сколько объектов добавилось (`Готово: N` до vs после).
- Сколько ошибок (`M с ошибкой`) — изменилось/осталось/выросло.
- Если выросло — приложить `sort | uniq -c | sort -rn` по `/tmp/import_err.log` для категоризации.

- [ ] **Step 10.4: Финальный коммит, если что-то ещё подкручивалось**

Если по итогам ручной проверки никаких изменений в коде не понадобилось — этот шаг пропускается.

---

## Завершение

- [ ] **Step 11: Sanity-pass всей цепочки**

Run: `pnpm test && git log --oneline origin/develop..HEAD`
Ожидание: все тесты зелёные, в логе видна последовательность коммитов из задач 1–9.

- [ ] **Step 12: PR**

Создать PR в `develop` со ссылкой на спеку и план, с краткой выжимкой результатов из Step 10.3 в описании.
