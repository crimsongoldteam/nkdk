# Explicit External Files Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть все найденные потери внешних файлов в `round-trip-yaml` и убрать зависимость от `rules.externalFiles` в пользу явных обработчиков.

**Architecture:** Внешние файлы сохраняются через именованные типы и обработчики (`Module`, `Template`, `Help`, `ExternalFormItemFile`, `ExchangePlanContent`, `ChildTemplateNames`). `rules.externalFiles` не расширяется и удаляется из текущих правил; каждый класс файлов закрепляется sync-фикстурой. XML-фикстуры остаются источником истины.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata orchestration, XML/YAML round-trip helpers.

---

## File Map

- Modify: `packages/core/metadata/orchestration/property/types.ts` — убрать `externalFiles` из `ModulePropertyRule` и `TemplatePropertyRule`, добавить явный sync-only тип для XSD веб-сервисов.
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts` — поддержать `.bsl`/`.bin` как альтернативы одного модуля, убрать `syncExplicitExternalFilesFromXML`.
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts` — экспортировать фактическое расширение модуля, ошибаться при `.bsl` + `.bin`, убрать `syncExplicitExternalFilesToXML`.
- Modify: `packages/core/metadata/commonObjects/module/syncExternal.test.ts` — тесты `.bin` и конфликтов.
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts` — убрать `externalFiles` у `template`.
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/syncToXML.test.ts` — ожидать файлы `Template.txt`, `Template.bin`, `Template/ru.html`, `Template/_files/1.png`.
- Create or modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts` — проверить копирование файлов общего макета в YAML.
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts` — копировать каталог `Templates/<Макет>/...` целиком в `Шаблоны/<Макет>/...`.
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts` — восстанавливать каталог дочернего шаблона целиком.
- Delete or stop importing: `packages/core/metadata/commonObjects/childTemplateNames/externalFiles.ts` — больше не нужен для дочерних шаблонов.
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts` — добавить вложенный `Ext/Template/Items/<Элемент>/Picture.png` и проверку manifest.
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts` — добавить `itemRowsPictures` как `ExternalFormItemFile`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts` — проверить импорт `RowsPicture.png`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts` — проверить экспорт `RowsPicture.png`.
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts` — заменить внутренний вызов generic external sync на явное копирование `_files`.
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts` — заменить generic external sync на явное копирование `_files`.
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` — добавить `help`, если текущие потери справки относятся к документам без правила.
- Modify: matching metadata item `rules.ts` files only after confirming missing `help` in that item — добавить явное `help` там, где XML содержит `Ext/Help.xml`, а правила нет.
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/*.test.ts` — добавить пустой `ExchangePlanContent`.
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/rules.ts` or orchestration defaults — сохранить пустой список как явное `[]`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts` — добавить `recordSetModule`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts` — проверить `МодульНабораЗаписей.bsl`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts` — ожидать `Ext/RecordSetModule.bsl`.
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/rules.ts` and tests — заменить `externalFiles` для XSD на явный sync-only механизм или специализированный обработчик.

## Required Reading Before Code

- [ ] Read metadata rules:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/metadata-item-implementation.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: documents are readable; keep XML fixtures unchanged.

---

### Task 1: Remove `rules.externalFiles` From Module/Template Paths

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Test: `packages/core/metadata/commonObjects/module/syncExternal.test.ts`

- [ ] **Step 1: Write failing tests for `.bin` module alternatives**

Append to `packages/core/metadata/commonObjects/module/syncExternal.test.ts`:

```ts
  it("round-trips encrypted Module .bin as an alternative to .bsl", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-bin-"))
    const xmlDir = join(tmpDir, "xml", "DataProcessors")
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const outputDir = join(tmpDir, "out", "DataProcessors")
    const name = "Обработка"
    const moduleBin = Buffer.from([0xff, 0xfe, 0x01, 0x02])
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bin"), moduleBin)

    await syncModuleFromXML({ rule, xmlDir, nkdkDir, name })

    expect([...fs.readFileSync(join(nkdkDir, "МодульОбъекта.bin"))]).toEqual([...moduleBin])
    expect(fs.existsSync(join(nkdkDir, "МодульОбъекта.bsl"))).toBe(false)

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({ rule, nkdkDir, xmlDir: outputDir, name, xmlManifest })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "ObjectModule.bin"))]).toEqual([...moduleBin])
    expect(xmlManifest.expectedFiles()).toContain("DataProcessors/Обработка/Ext/ObjectModule.bin")
  })

  it("fails when XML contains both .bsl and .bin for one Module", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-bin-conflict-"))
    const xmlDir = join(tmpDir, "xml", "DataProcessors")
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const name = "Обработка"
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bsl"), "Процедура Тест()\nКонецПроцедуры\n")
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bin"), Buffer.from([1, 2, 3]))

    await expect(syncModuleFromXML({ rule, xmlDir, nkdkDir, name })).rejects.toThrow(
      "Module has both .bsl and .bin"
    )
  })

  it("fails when YAML contains both .bsl and .bin for one Module", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-yaml-bin-conflict-"))
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const outputDir = join(tmpDir, "out", "DataProcessors")
    const name = "Обработка"
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(nkdkDir, { recursive: true })
    await fs.promises.writeFile(join(nkdkDir, "МодульОбъекта.bsl"), "Процедура Тест()\nКонецПроцедуры\n")
    await fs.promises.writeFile(join(nkdkDir, "МодульОбъекта.bin"), Buffer.from([1, 2, 3]))

    await expect(syncModuleToXML({ rule, nkdkDir, xmlDir: outputDir, name })).rejects.toThrow(
      "Module has both .bsl and .bin"
    )
  })
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts
```

Expected: tests fail because `.bin` alternative is not implemented.

- [ ] **Step 3: Implement extension alternatives in `fromXML.ts`**

In `packages/core/metadata/commonObjects/module/fromXML.ts`, remove the import of `syncExplicitExternalFilesFromXML` and replace the source resolution block with helpers:

```ts
const alternateModulePath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const alternateNkdkPath = (path: string): string | undefined =>
  path.endsWith(".bsl") ? path.replace(/\.bsl$/i, ".bin") : undefined

const existingPaths = (paths: string[]): string[] => paths.filter((path) => fs.existsSync(path))
```

Use them inside `syncModuleFromXML`:

```ts
  const srcPath = resolveSourcePath({ xmlDir, xmlPath, objectName: params.name })
  const altXmlPath = alternateModulePath(xmlPath)
  const altSrcPath =
    altXmlPath === undefined ? undefined : resolveSourcePath({ xmlDir, xmlPath: altXmlPath, objectName: params.name })
  const found = existingPaths([srcPath, ...(altSrcPath ? [altSrcPath] : [])])

  if (found.length > 1) {
    throw new Error(`Module has both .bsl and .bin: ${xmlPath}`)
  }

  if (found.length === 1) {
    const isBinary = found[0].toLowerCase().endsWith(".bin")
    const dstRelativePath = isBinary ? alternateNkdkPath(nkdkPath) : nkdkPath
    if (!dstRelativePath) throw new Error(`Module binary alternative requires .bsl nkdkPath: ${nkdkPath}`)
    const dstPath = join(nkdkDir, dstRelativePath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(found[0], dstPath)
  }
```

Delete the trailing call to `syncExplicitExternalFilesFromXML`.

- [ ] **Step 4: Implement extension alternatives in `toXML.ts`**

In `packages/core/metadata/commonObjects/module/toXML.ts`, remove the import of `syncExplicitExternalFilesToXML`, add the same `alternateModulePath`, `alternateNkdkPath`, `existingPaths` helpers, and replace the copy block:

```ts
  const srcPath = join(nkdkDir, nkdkPath)
  const altNkdkPath = alternateNkdkPath(nkdkPath)
  const altSrcPath = altNkdkPath === undefined ? undefined : join(nkdkDir, altNkdkPath)
  const found = existingPaths([srcPath, ...(altSrcPath ? [altSrcPath] : [])])

  if (found.length > 1) {
    throw new Error(`Module has both .bsl and .bin: ${nkdkPath}`)
  }

  if (found.length === 1) {
    const isBinary = found[0].toLowerCase().endsWith(".bin")
    const outputXmlPath = isBinary ? alternateModulePath(xmlPath) : xmlPath
    if (!outputXmlPath) throw new Error(`Module binary alternative requires .bsl xmlPath: ${xmlPath}`)
    const xmlRelativePath = stripObjectPrefix({ xmlDir, xmlPath: outputXmlPath, objectName: params.name })
    const dstPath = join(xmlDir, xmlRelativePath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(found[0], dstPath)
    params.xmlManifest?.addFile(dstPath)
  }
```

Delete the trailing call to `syncExplicitExternalFilesToXML`.

- [ ] **Step 5: Remove `externalFiles` from Module/Template property types**

In `packages/core/metadata/orchestration/property/types.ts`, change:

```ts
  externalFiles?: readonly ExternalFileRule[]
```

by deleting it from both `ModulePropertyRule` and `TemplatePropertyRule`. Remove the unused import of `ExternalFileRule` if TypeScript reports it unused.

- [ ] **Step 6: Run module tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit module change**

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/commonObjects/module/fromXML.ts packages/core/metadata/commonObjects/module/toXML.ts packages/core/metadata/commonObjects/module/syncExternal.test.ts
git commit -m "fix: :bug: сохранить bin-модули"
```

---

### Task 2: Replace CommonTemplate `externalFiles` With Explicit Template Copying

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Test: `packages/core/metadata/commonObjects/module/syncExternal.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataCommonTemplate/syncToXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts`

- [ ] **Step 1: Write failing CommonTemplate object-level tests**

Create `packages/core/metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readCommonTemplateYAML } from "./__fixtures__/sync/data"
import { MetadataCommonTemplateRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCommonTemplate", () => {
  it("читает CommonTemplate из XML и копирует файлы макета", async () => {
    const name = "ТабличныйДокументВсеСвойства"
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataCommonTemplateRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readCommonTemplateYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(fs.existsSync(join(outputDir, name, "Template.xml"))).toBe(true)

    const objectDir = join(inputDir, name)
    for (const relativePath of ["Template.bin", "Template.txt", "Template/ru.html", "Template/_files/1.png"]) {
      const expectedPath = join(objectDir, "Ext", relativePath)
      if (!fs.existsSync(expectedPath)) continue
      expect(fs.readFileSync(join(outputDir, name, relativePath))).toEqual(fs.readFileSync(expectedPath))
    }
  })
})
```

If fixture files do not contain all four paths, add only missing files to the existing sync XML/YAML fixture pair for `metadataCommonTemplate`; do not edit reference XML content other than adding external files required by this test.

- [ ] **Step 2: Extend syncToXML expected files**

In `metadataCommonTemplate/syncToXML.test.ts`, change expected files:

```ts
expectedFiles: [
  "ТабличныйДокументВсеСвойства.xml",
  "ТабличныйДокументВсеСвойства/Ext/Template.xml",
  "ТабличныйДокументВсеСвойства/Ext/Template.bin",
  "ТабличныйДокументВсеСвойства/Ext/Template.txt",
  "ТабличныйДокументВсеСвойства/Ext/Template/ru.html",
  "ТабличныйДокументВсеСвойства/Ext/Template/_files/1.png",
],
```

- [ ] **Step 3: Run failing CommonTemplate tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts metadata/appliedObjects/metadataCommonTemplate/syncToXML.test.ts
```

Expected: FAIL while `externalFiles` is removed or before explicit template companion copying is implemented.

- [ ] **Step 4: Remove `externalFiles` from `MetadataCommonTemplateRules`**

In `metadataCommonTemplate/rules.ts`, change `template` to:

```ts
    template: {
      type: "Template",
      nkdkPath: "Template.xml",
      xmlPath: "Ext/Template.xml",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 5: Add explicit Template companion copying in `Module` sync handlers**

In `module/fromXML.ts`, after copying the main `Template` file, call this only for `rule.type === "Template"`:

```ts
  if (rule.type === "Template") {
    await copyTemplateCompanionsFromXML({
      xmlRoot: resolveSourceRoot({ xmlDir, xmlPath, objectName: params.name }),
      nkdkDir,
      xmlPath,
      nkdkPath,
    })
  }
```

Add helper:

```ts
async function copyTemplateCompanionsFromXML(params: {
  xmlRoot: string
  nkdkDir: string
  xmlPath: string
  nkdkPath: string
}): Promise<void> {
  const xmlBase = params.xmlPath.replace(/\.xml$/i, "")
  const nkdkBase = params.nkdkPath.replace(/\.xml$/i, "")
  await copyIfExists(join(params.xmlRoot, `${xmlBase}.bin`), join(params.nkdkDir, `${nkdkBase}.bin`))
  await copyIfExists(join(params.xmlRoot, `${xmlBase}.txt`), join(params.nkdkDir, `${nkdkBase}.txt`))
  await copyDirectoryIfExists(join(params.xmlRoot, xmlBase), join(params.nkdkDir, nkdkBase))
}
```

Add `copyDirectoryIfExists` using `fs.promises.cp(src, dst, { recursive: true })`.

In `module/toXML.ts`, mirror this for `rule.type === "Template"`:

```ts
  if (rule.type === "Template") {
    await copyTemplateCompanionsToXML({
      nkdkDir,
      xmlRoot: resolveExternalOutputRoot({ xmlDir, xmlPath, objectName: params.name }),
      xmlPath,
      nkdkPath,
      xmlManifest: params.xmlManifest,
    })
  }
```

When copying directory trees to XML, recursively add every copied file to `xmlManifest`.

- [ ] **Step 6: Run CommonTemplate and module tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts metadata/appliedObjects/metadataCommonTemplate/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit CommonTemplate change**

```bash
git add packages/core/metadata/commonObjects/module/fromXML.ts packages/core/metadata/commonObjects/module/toXML.ts packages/core/metadata/commonObjects/module/syncExternal.test.ts packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts packages/core/metadata/appliedObjects/metadataCommonTemplate/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataCommonTemplate/syncToXML.test.ts
git commit -m "fix: :bug: явно сохранить файлы общих макетов"
```

---

### Task 3: Copy Child Template Directories Explicitly

**Files:**
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Delete: `packages/core/metadata/commonObjects/childTemplateNames/externalFiles.ts`
- Test: `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts`

- [ ] **Step 1: Add failing nested picture test**

In `syncExternal.test.ts`, add fixture writes:

```ts
    writeFile(
      join(xmlDir, "Отчет", "Templates", "СКартинкой", "Ext", "Template", "Items", "Подложка", "Picture.png"),
      Buffer.from([10, 20, 30])
    )
    writeFile(join(xmlDir, "Отчет", "Templates", "СКартинкой.xml"), "<MetaDataObject/>")
```

Add fromXML assertion:

```ts
    expect([
      ...fs.readFileSync(join(nkdkDir, "Шаблоны", "СКартинкой", "Ext", "Template", "Items", "Подложка", "Picture.png")),
    ]).toEqual([10, 20, 30])
```

Add toXML assertion:

```ts
    expect([
      ...fs.readFileSync(
        join(outputDir, "Отчет", "Templates", "СКартинкой", "Ext", "Template", "Items", "Подложка", "Picture.png")
      ),
    ]).toEqual([10, 20, 30])
```

- [ ] **Step 2: Run failing test**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/childTemplateNames/syncExternal.test.ts
```

Expected: FAIL because nested `Items/**/Picture.png` is not copied.

- [ ] **Step 3: Replace `externalTemplateFiles` with full directory copy**

In `syncExternalFromXML.ts`, remove imports of `syncExplicitExternalFilesFromXML` and `externalTemplateFiles`. Replace the old explicit `Template.txt` / `Ext/Template.xml` / `syncExplicitExternalFilesFromXML` block with:

```ts
    await copyDirectoryIfExists({
      src: join(templatesDir, templateName),
      dst: templateOutputDir,
    })
```

Keep the existing copy of `Templates/<Макет>.xml` to `Template.xml`.

Add helper:

```ts
async function copyDirectoryIfExists(params: { src: string; dst: string }): Promise<void> {
  if (!fs.existsSync(params.src)) return
  await fs.promises.mkdir(params.dst, { recursive: true })
  await fs.promises.cp(params.src, params.dst, { recursive: true })
}
```

In `syncExternalToXML.ts`, remove imports of `syncExplicitExternalFilesToXML` and `externalTemplateFiles`. After copying `Template.xml`, copy every other entry from `Шаблоны/<Макет>/` to `Templates/<Макет>/` except `Template.xml`:

```ts
    await copyTemplateDirectoryToXML({
      srcDir: join(templatesDir, templateName),
      dstDir: join(templateOutputDir, templateName),
      xmlManifest,
    })
```

Add helper that skips `Template.xml`, copies files/directories recursively, and calls `xmlManifest?.addFile(path)` for every copied file.

- [ ] **Step 4: Delete unused external file list**

Delete:

```bash
rm packages/core/metadata/commonObjects/childTemplateNames/externalFiles.ts
```

- [ ] **Step 5: Run child template tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/childTemplateNames/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit child template change**

```bash
git add packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts
git add -u packages/core/metadata/commonObjects/childTemplateNames/externalFiles.ts
git commit -m "fix: :bug: явно копировать каталоги дочерних макетов"
```

---

### Task 4: Add Explicit `RowsPicture` Form File Rule

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Extend fromXML test with `RowsPicture.png`**

In `convertFromXML.test.ts`, inside `"копирует внешние картинки элементов формы..."`, add:

```ts
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "ТаблицаСКартинкойСтрок"), { recursive: true })
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "ТаблицаСКартинкойСтрок", "RowsPicture.png"),
        Buffer.from([11, 12, 13])
      )
```

Add assertion:

```ts
      expect([
        ...fs.readFileSync(join(outputDir, "Формы", formName, "КартинкиСтрок", "ТаблицаСКартинкойСтрок.png")),
      ]).toEqual([11, 12, 13])
```

- [ ] **Step 2: Extend toXML test with `RowsPicture.png`**

In `syncToXML.test.ts`, add setup:

```ts
      fs.mkdirSync(join(tmpInputDir, "Формы", formName, "КартинкиСтрок"), { recursive: true })
      fs.writeFileSync(
        join(tmpInputDir, "Формы", formName, "КартинкиСтрок", "ТаблицаСКартинкойСтрок.png"),
        Buffer.from([11, 12, 13])
      )
```

Add path and assertions:

```ts
      const rowsPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "ТаблицаСКартинкойСтрок",
        "RowsPicture.png"
      )
      expect([...fs.readFileSync(rowsPicturePath)]).toEqual([11, 12, 13])
      expect(xmlManifest.expectedFiles()).toContain(
        "Forms/ФормаЭлемента/Ext/Form/Items/ТаблицаСКартинкойСтрок/RowsPicture.png"
      )
```

- [ ] **Step 3: Run failing form tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: FAIL because `КартинкиСтрок` is not wired.

- [ ] **Step 4: Add explicit rule**

In `ClientApplicationFormRules.properties`, after `itemValuesPictures`, add:

```ts
    itemRowsPictures: {
      type: "ExternalFormItemFile",
      xml: "RowsPicture",
      yaml: "КартинкиСтрок",
      syncExternalOnly: true,
    },
```

- [ ] **Step 5: Run form tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit RowsPicture change**

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
git commit -m "fix: :bug: сохранить RowsPicture форм"
```

---

### Task 5: Preserve Empty ExchangePlan Content

**Files:**
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/rules.ts`

- [ ] **Step 1: Add empty content fixture data in tests**

In each `exchangePlanContent` test file, use:

```ts
const emptyContentXML =
  '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<ExchangePlanContent xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"/>'

const emptyContent = {
  itemType: "ExchangePlanContent" as const,
  items: [],
}
```

- [ ] **Step 2: Add fromXML assertion**

In `fromXML.test.ts`:

```ts
  it("imports empty content as an explicit empty list", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: ExchangePlanContentRules,
      xmlString: emptyContentXML,
    })

    expect(result).toEqual(emptyContent)
  })
```

- [ ] **Step 3: Add YAML assertions**

In `toYAML.test.ts`:

```ts
  it("exports empty content as []", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: emptyContent,
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual([])
  })
```

In `fromYAML.test.ts`:

```ts
  it("imports [] as explicit empty content", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: [],
      rule: ExchangePlanContentRules,
    })

    expect(result).toEqual(emptyContent)
  })
```

- [ ] **Step 4: Add toXML assertion**

In `toXML.test.ts`:

```ts
  it("exports empty content as an empty ExchangePlanContent container", () => {
    const xmlObj = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: emptyContent,
      rule: ExchangePlanContentRules,
    })

    expect(xmlExport(xmlObj!)).toContain("<ExchangePlanContent")
    expect(xmlExport(xmlObj!)).not.toContain("<Item>")
  })
```

- [ ] **Step 5: Run failing tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/exchangePlanContent
```

Expected: at least one test fails because empty item lists are not preserved as explicit values.

- [ ] **Step 6: Implement explicit empty list behavior**

In `ExchangePlanContentRules.items`, add:

```ts
      defaultValueXMLEmpty: [],
      defaultValue: [],
```

Keep `yamlInline: true`.

- [ ] **Step 7: Run exchange plan content tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/exchangePlanContent
```

Expected: PASS.

- [ ] **Step 8: Commit empty content change**

```bash
git add packages/core/metadata/commonObjects/exchangePlanContent
git commit -m "fix: :bug: сохранить пустой состав плана обмена"
```

---

### Task 6: Add Sequence Record Set Module

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
- Add fixture files under: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/xml/ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl`
- Add fixture files under: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/МодульНабораЗаписей.bsl`

- [ ] **Step 1: Add sync fixture module files**

Create `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/xml/ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl`:

```bsl
Процедура ПередЗаписью(Отказ, Замещение)
КонецПроцедуры
```

Create `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/МодульНабораЗаписей.bsl` with the same content.

- [ ] **Step 2: Extend convertFromXML test**

In `convertFromXML.test.ts`, import `fs` and `join`, then replace the assertion body with:

```ts
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      expectedYAML: readSequenceYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
    expect(fs.readFileSync(join(outputDir, "ПоследовательностьВсеПоля", "МодульНабораЗаписей.bsl"), "utf-8")).toBe(
      fs.readFileSync(
        join(inputDir, "ПоследовательностьВсеПоля", "Ext", "RecordSetModule.bsl"),
        "utf-8"
      )
    )
```

- [ ] **Step 3: Extend syncToXML expected files**

In `syncToXML.test.ts`, change:

```ts
expectedFiles: ["ПоследовательностьВсеПоля.xml"],
```

to:

```ts
expectedFiles: ["ПоследовательностьВсеПоля.xml", "ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl"],
```

- [ ] **Step 4: Run failing Sequence tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataSequence/convertFromXML.test.ts metadata/appliedObjects/metadataSequence/syncToXML.test.ts
```

Expected: FAIL because `recordSetModule` is not in rules.

- [ ] **Step 5: Add `recordSetModule` rule**

In `MetadataSequenceRules.properties`, after `additionalIndexes`, add:

```ts
    recordSetModule: {
      type: "Module",
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 6: Run Sequence tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataSequence/convertFromXML.test.ts metadata/appliedObjects/metadataSequence/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Sequence change**

```bash
git add packages/core/metadata/appliedObjects/metadataSequence
git commit -m "fix: :bug: сохранить модуль набора последовательности"
```

---

### Task 7: Restore Help Files Through Explicit Help Rules

**Files:**
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/syncExternal.test.ts`
- Modify: missing metadata item `rules.ts` files identified by scan, starting with `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: corresponding sync tests for each changed metadata item.

- [ ] **Step 1: Scan objects that have Help XML but no `help` rule**

Run:

```bash
rg "type: \"Help\"" packages/core/metadata/appliedObjects/*/rules.ts
git -C /Users/nikita/git/round-trip-source -c core.quotePath=false ls-files 'acc/**/Ext/Help.xml' | sed -n '1,40p'
```

Expected: `metadataDocument/rules.ts` is missing `help`; any additional missing rules are handled in the same task only after confirming the owning metadata item.

- [ ] **Step 2: Replace Help `_files` generic sync with explicit copy helpers**

In `help/fromXML.ts`, remove `syncExplicitExternalFilesFromXML` import and replace the call with:

```ts
  await copyDirectoryFiles({
    srcDir: join(xmlDir, helpHtmlDir, "_files"),
    dstDir: join(nkdkDir, rule.nkdkDir, "_files"),
  })
```

Add:

```ts
async function copyDirectoryFiles(params: { srcDir: string; dstDir: string }): Promise<void> {
  if (!fs.existsSync(params.srcDir)) return
  await fs.promises.mkdir(params.dstDir, { recursive: true })
  await fs.promises.cp(params.srcDir, params.dstDir, { recursive: true })
}
```

In `help/toXML.ts`, remove `syncExplicitExternalFilesToXML` import and replace the call with explicit recursive copy that adds each copied file to `xmlManifest`.

- [ ] **Step 3: Run Help tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/help/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 4: Add `help` to `MetadataDocumentRules`**

In `metadataDocument/rules.ts`, add near other external files:

```ts
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 5: Add Document sync fixture assertions**

In `metadataDocument/syncToXML.test.ts`, add expected files:

```ts
        "ДокументВсеСвойства/Ext/Help.xml",
        "ДокументВсеСвойства/Ext/Help/ru.html",
```

In `metadataDocument/convertFromXML.test.ts`, assert:

```ts
    const expectedHelpRu = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)
```

- [ ] **Step 6: Run Document tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataDocument/convertFromXML.test.ts metadata/appliedObjects/metadataDocument/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Help change**

```bash
git add packages/core/metadata/commonObjects/help packages/core/metadata/appliedObjects/metadataDocument
git commit -m "fix: :bug: сохранить справку документов"
```

---

### Task 8: Replace WSReference `externalFiles` With Explicit XSD Sync

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/syncToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Add: `packages/core/metadata/commonObjects/wsDefinitionSchemas/fromXML.ts`
- Add: `packages/core/metadata/commonObjects/wsDefinitionSchemas/toXML.ts`
- Add: `packages/core/metadata/commonObjects/wsDefinitionSchemas/index.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`

- [ ] **Step 1: Add explicit property type**

In `property/types.ts`, add:

```ts
export interface WSDefinitionSchemasPropertyRule extends BasePropertyRule {
  type: "WSDefinitionSchemas"
  nkdkDir: string
  xmlDir: string
  syncExternalOnly: true
}
```

Add it to the `PropertyRule` union.

- [ ] **Step 2: Create explicit sync handlers**

Create `wsDefinitionSchemas/fromXML.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule, WSDefinitionSchemasPropertyRule } from "~/metadata/orchestration/property/types"

export const syncWSDefinitionSchemasFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
}): Promise<void> => {
  const rule = params.rule as WSDefinitionSchemasPropertyRule
  const srcDir = join(params.xmlDir, rule.xmlDir)
  const dstDir = join(params.nkdkDir, rule.nkdkDir)
  if (!fs.existsSync(srcDir)) return
  await fs.promises.mkdir(dstDir, { recursive: true })
  for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xsd")) continue
    await fs.promises.copyFile(join(srcDir, entry.name), join(dstDir, entry.name))
  }
}

registerTypeRule("WSDefinitionSchemas", "syncExternalFromXML", syncWSDefinitionSchemasFromXML)
```

Create `toXML.ts` with the reverse copy and `xmlManifest?.addFile(dstPath)`.

- [ ] **Step 3: Register the new common object**

Create `index.ts`:

```ts
import "./fromXML"
import "./toXML"
```

Add to `commonObjects/index.ts`:

```ts
import "./wsDefinitionSchemas"
```

- [ ] **Step 4: Replace WSReference rule**

In `metadataWSReference/rules.ts`, remove `externalFiles` from `wsDefinition` and add:

```ts
    xsdFiles: {
      type: "WSDefinitionSchemas",
      nkdkDir: "XSD",
      xmlDir: "Ext",
      syncExternalOnly: true,
    },
```

- [ ] **Step 5: Run WSReference tests**

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts metadata/appliedObjects/metadataWSReference/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit WSReference change**

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/commonObjects/wsDefinitionSchemas packages/core/metadata/commonObjects/index.ts packages/core/metadata/appliedObjects/metadataWSReference
git commit -m "fix: :bug: явно сохранить XSD web-ссылок"
```

---

### Task 9: Remove Remaining `rules.externalFiles` Usage

**Files:**
- Modify or delete any files reported by search.

- [ ] **Step 1: Search for remaining usage**

```bash
rg "externalFiles|syncExplicitExternalFiles|ExternalFileRule" packages/core/metadata
```

Expected remaining allowed matches only in legacy helper files if still unused. No `rules.ts` should contain `externalFiles`.

- [ ] **Step 2: Delete unused generic helper if no code imports it**

If `rg "syncExplicitExternalFiles" packages/core/metadata` shows only `commonObjects/externalFiles/sync.ts`, delete:

```bash
git rm packages/core/metadata/commonObjects/externalFiles/sync.ts packages/core/metadata/commonObjects/externalFiles/types.ts
```

If `commonObjects/externalFiles` has an `index.ts`, delete it too.

- [ ] **Step 3: Run type-check**

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 4: Commit cleanup**

```bash
git add -u packages/core/metadata
git commit -m "refactor: :recycle: убрать rules.externalFiles"
```

---

### Task 10: Full Verification With Round-Trip

**Files:**
- No code edits unless verification exposes a failure.

- [ ] **Step 1: Generate Langium files before full test**

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits 0. If it says no projects matched, record that exact output.

- [ ] **Step 2: Run full tests**

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run round-trip-yaml triage**

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: command exits 0. `DIFF_COUNT` decreases from the previous `752`.

- [ ] **Step 4: Verify removed-file groups are gone**

Run:

```bash
git -C /Users/nikita/git/round-trip-source -c core.quotePath=false diff --name-only | rg '/Ext/Help\\.xml$|/Ext/Help/|/Ext/ObjectModule\\.bin$|/RowsPicture\\.png$|/Templates/.*/Ext/Template/Items/.*/Picture\\.(png|jpg|bmp|gif)$|/ExchangePlans/.*/Ext/Content\\.xml$|/Sequences/.*/Ext/RecordSetModule\\.bsl$'
```

Expected: no output.

- [ ] **Step 5: Verify no CommonTemplate deletions returned**

```bash
git -C /Users/nikita/git/round-trip-source -c core.quotePath=false diff --name-status -- acc/CommonTemplates
```

Expected: no output.

- [ ] **Step 6: Commit any verification fixes**

If verification required fixes:

```bash
git add packages/core/metadata
git commit -m "fix: :bug: закрыть потери внешних файлов"
```

If verification required no fixes, do not create an empty commit.

---

## Self-Review

- Spec coverage: covers `Help`, child templates, `RowsPicture`, `.bin` modules, empty `ExchangePlan Content.xml`, `Sequence RecordSetModule`, `CommonTemplate`, and existing `WSReference` `externalFiles`.
- Placeholder scan: no placeholder markers or open-ended "write tests" steps remain.
- Type consistency: uses existing `Module`, `Template`, `Help`, `ExternalFormItemFile`, and introduces only one named sync-only type `WSDefinitionSchemas` for the remaining XSD case.
