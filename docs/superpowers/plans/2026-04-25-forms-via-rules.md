# Экспорт/импорт форм через rules.ts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести обработку файлов клиентских форм с особой ветки в `configuration/{syncToXML,convertFromXML}.ts` на стандартный механизм `syncExternalToXML`/`syncExternalFromXML`, регистрируемый по типу `ChildFormNames`.

**Architecture:** Расширяем сигнатуру хуков `syncExternalToXML`/`syncExternalFromXML` полями `name: string` и `referenceDir?: string`. Регистрируем новые обработчики на типе `ChildFormNames`, которые внутри вызывают существующие `syncFormToXML`/`convertFormFromXML`. Из `configuration/*.ts` удаляем особую ветку «форм» и индивидуальные `BatchTask` `kind: "form"` — формы становятся последовательными внутри задачи объекта.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, существующая инфраструктура `orchestration/property/registry`.

**Спецификация:** `docs/superpowers/specs/2026-04-25-forms-via-rules-design.md`

---

## File Structure

**Создаются:**
- `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts` — регистрация хука экспорта.
- `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts` — тест экспорта форм.
- `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts` — регистрация хука импорта.
- `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts` — тест импорта форм.

**Модифицируются:**
- `packages/core/metadata/orchestration/property/fn.ts` — расширить сигнатуры `SyncExternalToXMLFunction` / `SyncExternalFromXMLFunction`.
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — передавать `name` и `referenceDir` в `syncFn`.
- `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts` — передавать `name` в `syncFn`.
- `packages/core/metadata/commonObjects/index.ts` — добавить импорты новых модулей.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` — удалить ветку `hasForms` и прямые вызовы `syncFormToXML`.
- `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` — удалить ветку `hasForms` и прямые вызовы `convertFormFromXML`.
- `.claude/architecture-orchestration.md` — добавить раздел про `ChildFormNames`.

---

## Task 1: Расширить сигнатуру хуков и обновить вызывателей в оркестраторе

Это атомарный рефакторинг типов: сигнатуры расширяются и одновременно все три точки вызова обновляются. Промежуточных коммитов нет, потому что код не компилируется на полпути.

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts:122-140`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts:79-100`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts:45-67`

- [ ] **Step 1: Расширить `SyncExternalToXMLFunction` и `SyncExternalFromXMLFunction`**

В `packages/core/metadata/orchestration/property/fn.ts` заменить два type-определения (строки ~122–140) на:

```ts
/**
 * Хендлер для свойств, хранящих значение во внешних файлах (Help.xml, .bsl, формы).
 * Вызывается оркестратором в сторону nkdk — читает XML-сторону и пишет nkdk-сторону.
 * xmlDir и nkdkDir — директории конкретного объекта метаданных (родитель объекта).
 * name — имя самого объекта метаданных, нужно для построения путей к подресурсам объекта (Forms/, Templates/).
 * itemName задаётся при обходе дочерних коллекций (например, команд с функциональными путями).
 */
export type SyncExternalFromXMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name: string
  itemName?: string
}) => Promise<void>

/**
 * Хендлер для свойств, хранящих значение во внешних файлах (Help.xml, .bsl, формы).
 * Вызывается оркестратором в сторону XML — читает nkdk-сторону и пишет XML-сторону.
 * referenceDir — родитель эталонной директории объекта; используется для round-trip в свойствах,
 * которые читают эталонный XML (например, формы). Опциональное поле.
 */
export type SyncExternalToXMLFunction = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string
  referenceDir?: string
  itemName?: string
}) => Promise<void>
```

- [ ] **Step 2: Обновить вызовы `syncFn` в `appliedObject/syncToXML.ts`**

В файле `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` найти два места вызова `syncFn`:

Первый — строки ~79–83 (цикл по `rule.properties`):

```ts
for (const [, propRule] of Object.entries(rule.properties)) {
  const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
  if (!syncFn) continue
  await syncFn({ context: contextWithForms, rule: propRule, nkdkDir, xmlDir: outputDir })
}
```

заменить на:

```ts
for (const [, propRule] of Object.entries(rule.properties)) {
  const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
  if (!syncFn) continue
  await syncFn({ context: contextWithForms, rule: propRule, nkdkDir, xmlDir: outputDir, name, referenceDir })
}
```

Второй — строки ~94–98 (цикл по `childCollections`):

```ts
for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
  const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
  if (!syncFn) continue
  await syncFn({ context: contextWithForms, rule: itemPropRule, nkdkDir, xmlDir: outputDir, itemName })
}
```

заменить на:

```ts
for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
  const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
  if (!syncFn) continue
  await syncFn({ context: contextWithForms, rule: itemPropRule, nkdkDir, xmlDir: outputDir, name, referenceDir, itemName })
}
```

- [ ] **Step 3: Обновить вызовы `syncFn` в `appliedObject/convertFromXML.ts`**

В файле `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts` найти два места вызова `syncFn`:

Первый — строки ~47–51:

```ts
for (const [, propRule] of Object.entries(rule.properties)) {
  const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
  if (!syncFn) continue
  await syncFn({ context, rule: propRule, xmlDir: inputDir, nkdkDir })
}
```

заменить на:

```ts
for (const [, propRule] of Object.entries(rule.properties)) {
  const syncFn = getTypeRule(propRule.type, "syncExternalFromXML")
  if (!syncFn) continue
  await syncFn({ context, rule: propRule, xmlDir: inputDir, nkdkDir, name })
}
```

Второй — строки ~62–66:

```ts
for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
  const syncFn = getTypeRule(itemPropRule.type, "syncExternalFromXML")
  if (!syncFn) continue
  await syncFn({ context, rule: itemPropRule, xmlDir: inputDir, nkdkDir, itemName })
}
```

заменить на:

```ts
for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
  const syncFn = getTypeRule(itemPropRule.type, "syncExternalFromXML")
  if (!syncFn) continue
  await syncFn({ context, rule: itemPropRule, xmlDir: inputDir, nkdkDir, name, itemName })
}
```

- [ ] **Step 4: Прогнать тесты оркестратора**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/orchestration/appliedObject
```

Expected: PASS. Существующие хуки `Module`/`Help`/`Template` (`syncModuleToXML`, `syncHelpToXML`/`FromXML`) принимают параметры через деструктуризацию и не используют новые поля → совместимы.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts \
        packages/core/metadata/orchestration/appliedObject/syncToXML.ts \
        packages/core/metadata/orchestration/appliedObject/convertFromXML.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: расширить сигнатуру syncExternalTo/FromXML полями name и referenceDir

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TDD — `syncChildFormNamesToXML`

Хук, который сканирует папку `Формы/` объекта и для каждой формы вызывает существующий `syncFormToXML`.

**Files:**
- Create: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Test: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts:104-108`

- [ ] **Step 1: Написать failing test**

Создать `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import "~/metadata"

describe("syncChildFormNamesToXML (через syncAppliedObjectToXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/nkdk/Справочники")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_out")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает Forms/<form>.xml и Forms/<form>/Ext/Form.xml для каталога", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const formMetadataPath = join(outputDir, name, "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(outputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")

    expect(fs.existsSync(formMetadataPath), `expected ${formMetadataPath}`).toBe(true)
    expect(fs.existsSync(formXmlPath), `expected ${formXmlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
```

Expected: FAIL — файлы форм не создаются (хук ещё не зарегистрирован, оркестратор пропускает свойство `forms`).

- [ ] **Step 3: Реализовать хук**

Создать `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { syncFormToXML } from "~/metadata/forms/clientApplicationForm/syncToXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalToXMLFunction } from "~/metadata/orchestration/property/fn"
import type { ChildFormNamesPropertyRule } from "./types"

/**
 * Сканирует папку форм объекта (`<nkdkDir>/<folderName>`) и для каждой подпапки
 * с `Форма.yaml` + `Форма.nkdk` вызывает `syncFormToXML`. Формы обрабатываются
 * последовательно внутри объекта.
 */
export const syncChildFormNamesToXML: SyncExternalToXMLFunction = async (params) => {
  const { context, rule: rawRule, nkdkDir, xmlDir, name, referenceDir } = params
  const rule = rawRule as ChildFormNamesPropertyRule

  const formsDir = join(nkdkDir, rule.folderName)
  if (!fs.existsSync(formsDir)) return

  const entries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = entries
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const yamlPath = join(formsDir, e.name, "Форма.yaml")
      const nkdkPath = join(formsDir, e.name, "Форма.nkdk")
      return fs.existsSync(yamlPath) && fs.existsSync(nkdkPath)
    })
    .map((e) => e.name)

  const formOutputDir = join(xmlDir, name)
  const formReferenceDir = referenceDir ? join(referenceDir, name, "Forms") : undefined

  for (const formName of formNames) {
    await syncFormToXML({
      context,
      inputDir: nkdkDir,
      formName,
      outputDir: formOutputDir,
      referenceDir: formReferenceDir,
    })
  }
}

registerTypeRule("ChildFormNames", "syncExternalToXML", syncChildFormNamesToXML)
```

- [ ] **Step 4: Зарегистрировать новый модуль в index**

В `packages/core/metadata/commonObjects/index.ts` найти блок:

```ts
import "./childFormNames/fromXML"
import "./childFormNames/toXML"
```

(строки ~104–105) и добавить под ним:

```ts
import "./childFormNames/syncExternalToXML"
```

- [ ] **Step 5: Запустить тест — должен пройти**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts \
        packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts \
        packages/core/metadata/commonObjects/index.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: хук syncExternalToXML для типа ChildFormNames

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TDD — `syncChildFormNamesFromXML`

Симметричный хук импорта.

**Files:**
- Create: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`
- Test: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`

- [ ] **Step 1: Написать failing test**

Создать `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import "~/metadata"

describe("syncChildFormNamesFromXML (через convertAppliedObjectFromXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_in")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает Формы/<form>/Форма.yaml и Форма.nkdk для каталога", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    const yamlPath = join(outputDir, name, "Формы", "ФормаЭлемента", "Форма.yaml")
    const nkdkPath = join(outputDir, name, "Формы", "ФормаЭлемента", "Форма.nkdk")

    expect(fs.existsSync(yamlPath), `expected ${yamlPath}`).toBe(true)
    expect(fs.existsSync(nkdkPath), `expected ${nkdkPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts
```

Expected: FAIL — файлы форм не создаются.

- [ ] **Step 3: Реализовать хук**

Создать `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`:

```ts
import fs from "fs"
import { basename, join } from "path"
import { convertFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { SyncExternalFromXMLFunction } from "~/metadata/orchestration/property/fn"

/**
 * Сканирует `<xmlDir>/<name>/Forms/*.xml` и для каждого вызывает `convertFormFromXML`.
 * Формы обрабатываются последовательно внутри объекта.
 */
export const syncChildFormNamesFromXML: SyncExternalFromXMLFunction = async (params) => {
  const { context, xmlDir, nkdkDir, name } = params

  const formsDir = join(xmlDir, name, "Forms")
  if (!fs.existsSync(formsDir)) return

  const entries = await fs.promises.readdir(formsDir, { withFileTypes: true })
  const formNames = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
    .map((e) => basename(e.name, ".xml"))

  for (const formName of formNames) {
    await convertFormFromXML({
      context,
      inputDir: formsDir,
      formName,
      outputDir: nkdkDir,
    })
  }
}

registerTypeRule("ChildFormNames", "syncExternalFromXML", syncChildFormNamesFromXML)
```

- [ ] **Step 4: Зарегистрировать новый модуль в index**

В `packages/core/metadata/commonObjects/index.ts` под уже добавленным импортом `syncExternalToXML` добавить:

```ts
import "./childFormNames/syncExternalFromXML"
```

- [ ] **Step 5: Запустить тест — должен пройти**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts \
        packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts \
        packages/core/metadata/commonObjects/index.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: хук syncExternalFromXML для типа ChildFormNames

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Удалить ветку «форм» из `configuration/syncToXML.ts`

После регистрации хука особая ветка избыточна — формы обрабатываются автоматически через `syncAppliedObjectToXML`.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`

- [ ] **Step 1: Заменить тело `syncConfigurationToXML` на унифицированный цикл**

Заменить файл `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` целиком на:

```ts
import fs from "fs"
import { join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { ConfigurationSyncResult } from "./convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

// TODO: вынести в настройки расширения
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

    for (const entry of itemDirs) {
      const name = entry.name
      const propertiesPath = join(yamlDirAbs, name, "Свойства.yaml")
      if (!fs.existsSync(propertiesPath)) continue
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

Изменения относительно прежнего файла:
- удалён импорт `syncFormToXML`;
- удалена проверка `hasForms` и связанная ветка с `discoveries`/`formNames`/`formOutputDir`/`formReferenceDir`;
- удалена постановка `BatchTask` `kind: "form"`.

- [ ] **Step 2: Прогнать тест configuration**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS. Существующий тест проверяет наличие `Forms/ФормаЭлемента.xml` и `Forms/ФормаЭлемента/Ext/Form.xml` в результате — они должны создаваться через новый путь (хук, зарегистрированный в Task 2).

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: убрать ветку обработки форм из syncConfigurationToXML

Формы теперь обрабатываются автоматически через хук syncExternalToXML
типа ChildFormNames внутри syncAppliedObjectToXML.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Удалить ветку «форм» из `configuration/convertFromXML.ts`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`

- [ ] **Step 1: Заменить тело `syncConfigurationFromXML` на унифицированный цикл**

Заменить файл `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts` целиком на:

```ts
import fs from "fs"
import { basename, join } from "path"
import { BatchTask, runBatch } from "~/helpers/runBatch"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { TopLevelMetadataItemRules } from "./topLevelRules"

// TODO: вынести в настройки расширения
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
  /**
   * Путь к корню XML-выгрузки конфигурации
   */
  inputDir: string
  /**
   * Путь к корню YAML-проекта
   */
  outputDir: string
}): Promise<ConfigurationSyncResult> => {
  const { context, inputDir, outputDir } = params

  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [] }
  }

  const tasks: BatchTask<void>[] = []

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    if (rule.itemTypePrefix === undefined) continue

    const xmlDirAbs = join(inputDir, rule.xmlDir)
    const yamlDirAbs = join(outputDir, rule.itemTypePrefix)
    if (!fs.existsSync(xmlDirAbs)) continue

    const entries = await fs.promises.readdir(xmlDirAbs, { withFileTypes: true })
    const xmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"))

    for (const entry of xmlFiles) {
      const name = basename(entry.name, ".xml")
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

Изменения относительно прежнего файла:
- удалён импорт `convertFormFromXML`;
- удалена проверка `hasForms` и ветка `formDiscoveries`;
- удалена постановка `BatchTask` `kind: "form"`.

- [ ] **Step 2: Прогнать тест configuration**

```bash
pnpm --filter "@nakidka/core" test packages/core/metadata/appliedObjects/configuration
```

Expected: PASS. Round-trip тест `XML → YAML → XML` должен по-прежнему создавать YAML формы (через новый хук в `convertAppliedObjectFromXML`) и потом восстанавливать XML формы (через хук в `syncAppliedObjectToXML`).

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/convertFromXML.ts
git commit -m "$(cat <<'EOF'
refactor: :recycle: убрать ветку обработки форм из syncConfigurationFromXML

Формы теперь обрабатываются автоматически через хук syncExternalFromXML
типа ChildFormNames внутри convertAppliedObjectFromXML.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Обновить архитектурный документ

**Files:**
- Modify: `.claude/architecture-orchestration.md`

- [ ] **Step 1: Добавить раздел про `ChildFormNames`**

В файл `.claude/architecture-orchestration.md` после раздела «Свойства с `filePath`» (перед разделом «Флаг `yamlInline`») добавить:

```markdown
## Свойства с типом `ChildFormNames`

Свойство правила с типом `ChildFormNames` совмещает две роли:

1. **Сериализация в основной XML.** Даёт тег `<ChildObjects><Form>…</Form></ChildObjects>` в XML объекта. Реализация — обработчик `exportToXML`, зарегистрированный на типе.

2. **Синхронизация файлов форм.** Обработчики `syncExternalToXML`/`syncExternalFromXML`, зарегистрированные на типе, сканируют папку `nkdkDir/<folderName>` (на nkdk-стороне) или `xmlDir/<name>/Forms/` (на XML-стороне) и для каждой формы делегируют работу `syncFormToXML` / `convertFormFromXML`. Формы внутри одного объекта обрабатываются **последовательно**.

Сигнатура `SyncExternalToXMLFunction` / `SyncExternalFromXMLFunction` включает поля `name: string` (имя объекта) и `referenceDir?: string` (родитель эталонной директории объекта, для round-trip). Эти поля заполняет `appliedObject/syncToXML.ts` / `appliedObject/convertFromXML.ts`. Хуки `Module`/`Help`/`Template` их игнорируют.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/architecture-orchestration.md
git commit -m "$(cat <<'EOF'
docs: :memo: раздел про ChildFormNames в architecture-orchestration

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Финальная валидация

**Files:** —

- [ ] **Step 1: Прогнать весь тестовый набор**

```bash
pnpm test
```

Expected: все тесты зелёные. Если есть падения — диагностировать и поправить точечно. Особое внимание:
- `packages/core/metadata/appliedObjects/configuration/*.test.ts` — должны видеть формы в результате round-trip;
- `packages/core/metadata/orchestration/appliedObject/*.test.ts` — должны проходить (новые поля `name`/`referenceDir` опциональны для существующих хуков);
- `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts` — не затрагивается, должен пройти.

- [ ] **Step 2: Финальный статус**

```bash
git log --oneline origin/develop..HEAD
git status
```

Ожидается 6 новых коммитов (Tasks 1–6) и чистый рабочий каталог по добавленным изменениям. Готово.

---

## Self-Review

**Spec coverage:**
- Расширение сигнатур → Task 1 ✓
- Удаление веток `hasForms` из `configuration/*.ts` → Tasks 4, 5 ✓
- Новый хук `syncExternalToXML` для `ChildFormNames` → Task 2 ✓
- Новый хук `syncExternalFromXML` для `ChildFormNames` → Task 3 ✓
- Регистрация в `commonObjects/index.ts` → Tasks 2, 3 (steps 4) ✓
- Обновление `.claude/architecture-orchestration.md` → Task 6 ✓
- Тесты для новых хуков → Tasks 2, 3 ✓
- Финальный `pnpm test` → Task 7 ✓
- Принимаемая регрессия (последовательная обработка, ошибки под `kind` объекта) → следует из удаления `kind: "form"` задач в Tasks 4, 5; явных тестов на гранулярность ошибок в спеке не требовалось

**Placeholder scan:** «TBD»/«TODO в плане»/«similar to»/«fill in» отсутствуют. Все шаги содержат конкретный код или конкретные команды с ожидаемым выходом.

**Type consistency:** Имена `syncChildFormNamesToXML` / `syncChildFormNamesFromXML`, поля `name` / `referenceDir`, тип `ChildFormNamesPropertyRule` — согласованы между задачами и спецификацией.
