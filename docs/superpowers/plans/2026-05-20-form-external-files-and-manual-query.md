# Form External Files And ManualQuery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `ManualQuery` independently from `.query` files and make form item external files rule-driven, including `HeaderPicture` for direct common forms.

**Architecture:** Keep XML/YAML model conversion in existing rules and orchestration. Add a rule-only external file property type for form item files, make `ClientApplicationForm` external sync run for both child forms and direct `filePath` forms, and remove the `ManualQuery` dependency on external query files.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration registry, `XmlSyncManifest`, `round-trip-yaml`.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`: remove `derivedFrom` from `customQuery`.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`: update expectations so `ПроизвольныйЗапрос` is independent from `.query`.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`: add import coverage for explicit `ПроизвольныйЗапрос: Истина` without relying on a `.query` file.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`: add `ExternalFormItemFile` property rules for `Picture`, `HeaderPicture`, `ValuesPicture`.
- Modify `packages/core/metadata/orchestration/property/types.ts`: add `syncExternalOnly` and `ExternalFormItemFilePropertyRule`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: register `ExternalFormItemFile` as a property rule type.
- Modify `packages/core/metadata/orchestration/property/helpers.ts`: exclude `syncExternalOnly` properties from normal XML/YAML/Enterprise processing and XML ordering.
- Modify `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts`: replace hard-coded specs with rule-derived specs.
- Modify `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`: add `HeaderPicture` XML -> YAML copy coverage.
- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`: add `HeaderPicture` YAML -> XML restore and manifest coverage.
- Modify `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`: register `syncExternalFromXML` and `syncExternalToXML` for direct `ClientApplicationForm` properties.
- Modify `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`: add direct common form external picture and `ManualQuery` sync coverage.

## Task 1: Make ManualQuery Independent From QueryText

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`

- [ ] **Step 1: Update failing YAML export tests**

In `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`, rename `does not export ManualQuery true when queryText is present and collects query file` to `exports ManualQuery true when queryText is present and collects query file`.

Then replace its expectation.

Use this assertion:

```ts
    expect(result).toEqual({
      ДинамическийСписок: {
        ПроизвольныйЗапрос: "Истина",
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.Справочник1",
      },
    })
```

In the same file, add this test after `exports explicit ManualQuery false when queryText is present`:

```ts
  it("exports explicit ManualQuery true when queryText is present", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        customQuery: true,
        dynamicDataRead: true,
        itemType: "DynamicList",
        queryText: queryTextWithManualQueryFalseText,
        mainTable: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ПроизвольныйЗапрос: "Истина",
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
  })
```

In `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`, add this test after `imports explicit ManualQuery false from YAML even when queryText exists in model fixture`:

```ts
  it("imports explicit ManualQuery true from YAML without query file", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ПроизвольныйЗапрос: "Истина",
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      customQuery: true,
      dynamicDataRead: true,
      itemType: "DynamicList",
      mainTable: "Catalog.РеестрПартийЗЕРНО",
    })
  })
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts
```

Expected: `toYAML.test.ts` fails because `ПроизвольныйЗапрос: "Истина"` is still omitted when `customQuery` is true and `queryText` exists.

- [ ] **Step 3: Remove derived ManualQuery behavior**

In `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`, replace the `customQuery` rule with:

```ts
    customQuery: {
      type: "boolean",
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
      order: 1,
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
```

Do not change the `queryText` rule.

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 5: Commit ManualQuery change**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/rules.ts packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts
git commit -m "fix: :bug: отвязать ManualQuery от файла запроса"
```

## Task 2: Add Rule Shape For Form Item External Files

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`

- [ ] **Step 1: Add failing type-level rule usage**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, add these properties near the top of `properties`, after `// #region Form` and before `attributes`:

```ts
    itemPictures: {
      type: "ExternalFormItemFile",
      xml: "Picture",
      yaml: "Картинки",
      syncExternalOnly: true,
    },
    itemHeaderPictures: {
      type: "ExternalFormItemFile",
      xml: "HeaderPicture",
      yaml: "КартинкиШапки",
      syncExternalOnly: true,
    },
    itemValuesPictures: {
      type: "ExternalFormItemFile",
      xml: "ValuesPicture",
      yaml: "КартинкиЗначений",
      syncExternalOnly: true,
    },
```

- [ ] **Step 2: Run type-check and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: TypeScript fails because `ExternalFormItemFile` and `syncExternalOnly` are not accepted by property rule types.

- [ ] **Step 3: Extend BasePropertyRule and PropertyRule union**

In `packages/core/metadata/orchestration/property/types.ts`, add this field to `BasePropertyRule` after `runtimeOnly?: true`:

```ts
  /** Свойство участвует только во внешней синхронизации и не входит в XML/YAML/модель. */
  syncExternalOnly?: true
```

In the same file, add this interface near `HelpPropertyRule`:

```ts
export interface ExternalFormItemFilePropertyRule extends BasePropertyRule {
  type: "ExternalFormItemFile"
  /** Имя файла внутри Ext/Form/Items/<Элемент>, например Picture или HeaderPicture. */
  xml: string
  /** Каталог на YAML-стороне, например Картинки или КартинкиШапки. */
  yaml: string
  syncExternalOnly: true
}
```

In the `PropertyRule` union, add `ExternalFormItemFilePropertyRule` alongside `HelpPropertyRule`.

- [ ] **Step 4: Register property type**

In `packages/core/metadata/orchestration/property/registry.ts`, add the type map entry near `ExternalPicture`:

```ts
  ExternalFormItemFile: {
    item: never
    yaml: never
  }
```

In the exported `PropertyRuleType` mapping near `ExternalPicture`, add:

```ts
  ExternalFormItemFile: "ExternalFormItemFile",
```

- [ ] **Step 5: Exclude syncExternalOnly from normal property processing**

In `packages/core/metadata/orchestration/property/helpers.ts`, update `shouldProcessProperty` so the first checks are:

```ts
  if (rule.runtimeOnly) return false
  if (rule.syncExternalOnly) return false
```

In the same file, update the `propertyEntries` filter in `buildPathStructure`:

```ts
  const propertyEntries = Object.entries(rule.properties).filter(([_key, ruleProp]) => {
    if (ruleProp.runtimeOnly) return false
    if (ruleProp.syncExternalOnly) return false
    if (ruleProp.filePath !== undefined) return false
    return tagFilter === undefined || (ruleProp.tag !== undefined && tagFilter.includes(ruleProp.tag))
  })
```

- [ ] **Step 6: Run type-check and form tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: type-check passes; form conversion tests pass because `syncExternalOnly` rules are ignored by normal conversion.

- [ ] **Step 7: Commit rule shape**

Run:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "feat: :sparkles: добавить правила внешних файлов формы"
```

## Task 3: Make Child Form Picture Sync Rule-Driven

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Add failing HeaderPicture XML -> YAML test**

In `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`, update `копирует внешние картинки элементов формы в YAML-каталоги по имени элемента`.

Add this setup inside the `try` block:

```ts
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "ГруппаСШапкой"), { recursive: true })
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.gif"),
        Buffer.from([7, 8, 9])
      )
```

Add this expectation after the existing picture expectations:

```ts
      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "КартинкиШапки", "ГруппаСШапкой.gif"))]).toEqual([
        7, 8, 9,
      ])
```

- [ ] **Step 2: Add failing HeaderPicture YAML -> XML test**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`, update `восстанавливает внешние картинки элементов формы из YAML и добавляет их в manifest`.

Add this setup before `await syncFormToXML`:

```ts
      fs.mkdirSync(join(tmpInputDir, "Формы", formName, "КартинкиШапки"), { recursive: true })
      fs.writeFileSync(join(tmpInputDir, "Формы", formName, "КартинкиШапки", "ГруппаСШапкой.gif"), Buffer.from([7, 8, 9]))
```

Add this path after `valuesPicturePath`:

```ts
      const headerPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "ГруппаСШапкой",
        "HeaderPicture.gif"
      )
```

Add these expectations after the existing manifest expectations:

```ts
      expect([...fs.readFileSync(headerPicturePath)]).toEqual([7, 8, 9])
      expect(xmlManifest.expectedFiles()).toContain("Forms/ФормаЭлемента/Ext/Form/Items/ГруппаСШапкой/HeaderPicture.gif")
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: tests fail because `HeaderPicture` is not copied.

- [ ] **Step 4: Refactor external item file specs to rules**

Replace the top of `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts` imports and hard-coded specs with:

```ts
import fs from "fs"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "path"
import type { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ClientApplicationFormRules } from "./rules"

type ExternalFormItemFileSpec = {
  xmlName: string
  nkdkDir: string
}

const isExternalFormItemFileRule = (rule: PropertyRule): rule is PropertyRule & {
  type: "ExternalFormItemFile"
  xml: string
  yaml: string
  syncExternalOnly: true
} => {
  return rule.type === "ExternalFormItemFile" && rule.syncExternalOnly === true && rule.xml !== undefined && rule.yaml !== undefined
}

const getExternalItemFileSpecs = (): ExternalFormItemFileSpec[] => {
  return (Object.values(ClientApplicationFormRules.properties) as PropertyRule[])
    .filter(isExternalFormItemFileRule)
    .map((rule) => ({ xmlName: rule.xml, nkdkDir: rule.yaml }))
}
```

In `copyFormItemExternalFilesFromXML`, add:

```ts
  const externalItemFileSpecs = getExternalItemFileSpecs()
```

as the first line of the function body.

In `copyFormItemExternalFilesToXML`, add:

```ts
  const externalItemFileSpecs = getExternalItemFileSpecs()
```

as the first line of the function body.

- [ ] **Step 5: Run tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: tests pass and include `HeaderPicture` copying in both directions.

- [ ] **Step 6: Commit rule-driven child form sync**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
git commit -m "fix: :bug: сохранять HeaderPicture элементов формы"
```

## Task 4: Add External Sync For Direct ClientApplicationForm Properties

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`

- [ ] **Step 1: Add failing common form XML -> YAML external picture test**

In `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`, add this test after `copies common form Module.bsl from XML to YAML`:

```ts
  it("copies common form item external pictures from XML to YAML", async () => {
    const { inputDir, outputDir } = await createCommonFormTempFixture()
    const itemDir = join(inputDir, name, "Ext", "Form", "Items", "ГруппаСШапкой")
    await fs.promises.mkdir(itemDir, { recursive: true })
    await fs.promises.writeFile(join(itemDir, "HeaderPicture.png"), Buffer.from([7, 8, 9]))

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect([...fs.readFileSync(join(outputDir, name, "КартинкиШапки", "ГруппаСШапкой.png"))]).toEqual([7, 8, 9])
  })
```

- [ ] **Step 2: Add failing common form YAML -> XML external picture test**

In the same file, add this test after `keeps common form Module.bsl during YAML to XML sync cleanup`:

```ts
  it("restores common form item external pictures to XML and manifest", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    const { XmlSyncManifest } = await import("~/metadata/appliedObjects/configuration/migrations/xmlManifest")
    const xmlManifest = new XmlSyncManifest(join(outputDir, name))

    await fs.promises.mkdir(join(yamlDir, name, "КартинкиШапки"), { recursive: true })
    await fs.promises.writeFile(join(yamlDir, name, "КартинкиШапки", "ГруппаСШапкой.png"), Buffer.from([7, 8, 9]))

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
      xmlManifest,
    })

    const picturePath = join(outputDir, name, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.png")
    expect([...fs.readFileSync(picturePath)]).toEqual([7, 8, 9])
    expect(xmlManifest.expectedFiles()).toContain("Ext/Form/Items/ГруппаСШапкой/HeaderPicture.png")
  })
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
```

Expected: both new tests fail because direct `ClientApplicationForm` has no external sync handlers.

- [ ] **Step 4: Register direct ClientApplicationForm external sync handlers**

In `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`, add imports:

```ts
import { dirname, join } from "path"
import { copyFormItemExternalFilesFromXML, copyFormItemExternalFilesToXML } from "./externalItemFiles"
```

Add this helper after `exportClientApplicationFormPropertyToXML`:

```ts
const getDirectFormXmlDir = (params: { baseDir: string; rule: { filePath?: string } }): string | undefined => {
  const filePath = params.rule.filePath
  if (filePath === undefined) return undefined
  return join(params.baseDir, dirname(filePath))
}
```

Add this registration after the existing four `registerTypeRule("ClientApplicationForm", ...)` calls:

```ts
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", async (params) => {
  const formXmlDir = getDirectFormXmlDir({ baseDir: params.xmlDir, rule: params.rule })
  if (formXmlDir === undefined) return
  await copyFormItemExternalFilesFromXML({
    formXmlDir,
    formNkdkDir: params.nkdkDir,
  })
})

registerTypeRule("ClientApplicationForm", "syncExternalToXML", async (params) => {
  const formXmlDir = getDirectFormXmlDir({ baseDir: params.xmlDir, rule: params.rule })
  if (formXmlDir === undefined) return
  await copyFormItemExternalFilesToXML({
    formNkdkDir: params.nkdkDir,
    formXmlDir,
    xmlManifest: params.xmlManifest,
  })
})
```

This uses `externalOutputDir` and `externalReferenceDir` already passed by `syncAppliedObjectToXML` for common forms.

- [ ] **Step 5: Run common form tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
```

Expected: common form tests pass, including both direct external picture sync tests.

- [ ] **Step 6: Commit direct form sync**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/propertyRules.ts packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
git commit -m "fix: :bug: синхронизировать внешние файлы общих форм"
```

## Task 5: Add Common Form ManualQuery Sync Coverage

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`

- [ ] **Step 1: Add common form ManualQuery round-trip test**

In `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`, add this test before the final `describe` closing brace:

```ts
  it("keeps ManualQuery true for common form dynamic lists with query text", async () => {
    const { inputDir, outputDir } = await createCommonFormTempFixture()
    const yamlDir = join(outputDir, "yaml")
    const yamlObjectDir = join(yamlDir, name)
    await fs.promises.mkdir(yamlObjectDir, { recursive: true })
    await fs.promises.writeFile(
      join(yamlObjectDir, "Свойства.yaml"),
      [
        "Форма:",
        "  Реквизиты:",
        "    Список:",
        "      Тип: ДинамическийСписок",
        "      ДинамическийСписок:",
        "        ПроизвольныйЗапрос: Истина",
        "        ДинамическоеСчитываниеДанных: Истина",
        "        ОсновнаяТаблица: Catalog.Справочник1",
        "",
      ].join("\n")
    )
    await fs.promises.mkdir(join(yamlDir, name, "ДинамическийСписок"), { recursive: true })
    await fs.promises.writeFile(
      join(yamlDir, name, "ДинамическийСписок", "Список.query"),
      "ВЫБРАТЬ\n\tСправочник1.Ссылка КАК Ссылка\nИЗ\n\tСправочник.Справочник1 КАК Справочник1"
    )

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    const formXml = fs.readFileSync(join(outputDir, name, "Ext", "Form.xml"), "utf-8")
    expect(formXml).toContain("<ManualQuery>true</ManualQuery>")
    expect(formXml).toContain("<QueryText>ВЫБРАТЬ")
  })
```

- [ ] **Step 2: Run common form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
```

Expected: test passes after Task 1 because `ПроизвольныйЗапрос` no longer depends on `.query`.

- [ ] **Step 3: Commit common form ManualQuery coverage**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
git commit -m "test: :white_check_mark: покрыть ManualQuery общей формы"
```

## Task 6: Focused Verification

**Files:**
- No code files changed in this task.

- [ ] **Step 1: Run focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList metadata/forms/clientApplicationForm metadata/appliedObjects/metadataCommonForm
```

Expected: all focused test suites pass.

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: type-check passes.

- [ ] **Step 3: Run round-trip-yaml triage for indexes 6-10**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 6
```

Expected: `ManualQuery true -> false` diffs are gone. `Font ref="0"` may still appear because it is intentionally deferred in `todo.md`.

- [ ] **Step 4: Run round-trip-yaml triage for indexes 11-15**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 11
```

Expected: deleted `Picture.png` and `HeaderPicture.png` diffs for `CommonForms/ВыборВидаДеятельности` are gone.

- [ ] **Step 5: Commit verification notes if tests required plan adjustment**

If implementation required changing the plan itself, run:

```bash
git add docs/superpowers/plans/2026-05-20-form-external-files-and-manual-query.md
git commit -m "docs: :memo: уточнить план внешних файлов форм"
```

If the plan did not change during execution, do not create a documentation-only commit.

## Self-Review

- Spec coverage: `ManualQuery` independence is covered in Task 1 and Task 5. Rule-driven external files are covered in Task 2 and Task 3. Direct `MetadataCommonForm` external sync is covered in Task 4. Verification against round-trip batches is covered in Task 6.
- Placeholder scan: no placeholders remain; each task names exact files, commands, expected results, and concrete code snippets.
- Type consistency: `syncExternalOnly`, `ExternalFormItemFile`, `itemHeaderPictures`, `copyFormItemExternalFilesFromXML`, and `copyFormItemExternalFilesToXML` are introduced before later tasks use them.
