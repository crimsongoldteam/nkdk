# Round-Trip YAML Fast Shared Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `round-trip-yaml-fast` на общий rules-based обход XML-единиц, чтобы он проверял те же XML-файлы рабочего YAML-контура, включая `filePath`-свойства вроде `CommonForms/<Имя>/Ext/Form.xml`.

**Architecture:** Вынести discovery из `roundTripYAMLFast.ts` в отдельный модуль рядом с текущей проверкой и опереться на `describeMetadataRuleResources()` для `filePath`-ресурсов. `roundTripYAMLFast` останется быстрым in-memory циклом XML -> model -> YAML text -> model -> XML text, но список проверяемых единиц будет формироваться общим правиловым механизмом, а не ручным обходом папок.

**Tech Stack:** TypeScript, Vitest, `packages/core/metadata/orchestration/*`, `packages/core/metadata/project/ruleResources.ts`, XML/YAML import/export helpers.

---

## File Structure

- Create: `packages/core/metadata/appliedObjects/configuration/roundTripXmlDiscovery.ts`
  - Единственная ответственность: вернуть список XML-единиц round-trip из XML-каталога по metadata rules.
  - Типы результата: metadata XML, form XML из `Forms/*/Ext/Form.xml`, external XML из `filePath`.
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
  - Убрать ручной discovery.
  - Использовать `listRoundTripXmlEntries()`.
  - Добавить обработчик `filePathProperty` entry через штатные property import/export функции.
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
  - Добавить failing regression на `CommonForms/<Имя>/Ext/Form.xml`.
  - Обновить ожидания только там, где меняется количество проверенных файлов.
- No change: XML-фикстуры в репозитории.

## Task 1: Add Red Test For Direct `filePath` Common Form XML

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Add helper for common form metadata XML**

Add this helper near existing XML fixture helpers in `roundTripYAMLFast.test.ts`:

```ts
const commonFormMetadataXml = (name: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.19">
  <CommonForm uuid="11111111-1111-1111-1111-111111111111">
    <Properties>
      <Name>${name}</Name>
      <Synonym/>
      <Comment/>
      <UsePurposes>
        <v8:Value>PersonalComputer</v8:Value>
      </UsePurposes>
    </Properties>
  </CommonForm>
</MetaDataObject>
`
```

- [ ] **Step 2: Add a failing test that proves `Ext/Form.xml` is checked**

Add this test in the same `describe("roundTripYAMLFast", ...)` block:

```ts
it("checks direct filePath XML for common forms", async () => {
  await writeProject({
    "Configuration.xml": configurationXml(),
    "CommonForms/ДинамическийСписок.xml": commonFormMetadataXml("ДинамическийСписок"),
    "CommonForms/ДинамическийСписок/Ext/Form.xml": "<BrokenForm>",
  })

  const result = await roundTripYAMLFast(tmpDir)

  expect(result.checked).toBeGreaterThan(1)
  expect(result.errors.map((error) => error.file)).toContain("CommonForms/ДинамическийСписок/Ext/Form.xml")
})
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
FAIL metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
AssertionError: expected [...] to include 'CommonForms/ДинамическийСписок/Ext/Form.xml'
```

- [ ] **Step 4: Commit the red test**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "test: :white_check_mark: зафиксировать обход filePath XML в fast"
```

## Task 2: Extract Current Discovery Without Behavior Change

**Files:**

- Create: `packages/core/metadata/appliedObjects/configuration/roundTripXmlDiscovery.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`

- [ ] **Step 1: Create the discovery module with current entry types**

Create `roundTripXmlDiscovery.ts` with the current discovery code moved out of `roundTripYAMLFast.ts`:

```ts
import { existsSync, readdirSync } from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import { getMetadataItemRules } from "~/metadata/orchestration/metadataItem/registry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export interface RoundTripEntryBase {
  file: string
  xmlFileAbs: string
  itemName: string
  parentName?: string
  ownerStack: string[]
}

export type RoundTripXmlEntry =
  | (RoundTripEntryBase & {
      kind: "metadata"
      rule: MetadataItemRule
    })
  | (RoundTripEntryBase & {
      kind: "form"
      metadataFile: string
      formXmlFile: string
      formsDir: string
      formName: string
    })

const fileExists = (file: string): boolean => existsSync(file)

const listXmlFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".xml"))
    .sort()
}

export const listRoundTripXmlEntries = (inputDir: string): RoundTripXmlEntry[] => {
  const rules = getMetadataItemRules()
  const entries: RoundTripXmlEntry[] = []

  const addFormEntries = (ownerDirAbs: string, ownerFile: string, ownerStack: string[], parentName?: string): void => {
    const formsDir = join(ownerDirAbs, "Forms")
    if (!existsSync(formsDir)) return

    for (const formMetadataFileName of listXmlFiles(formsDir)) {
      const formName = basename(formMetadataFileName, ".xml")
      const formXmlFileAbs = join(formsDir, formName, "Ext", "Form.xml")
      if (!fileExists(formXmlFileAbs)) continue

      entries.push({
        kind: "form",
        file: relative(inputDir, formXmlFileAbs),
        xmlFileAbs: formXmlFileAbs,
        itemName: formName,
        parentName,
        ownerStack,
        metadataFile: join(formsDir, formMetadataFileName),
        formXmlFile: formXmlFileAbs,
        formsDir,
        formName,
      })
    }
  }

  const addMetadataEntryWithChildren = (
    rule: MetadataItemRule,
    xmlFileAbs: string,
    itemName: string,
    ownerStack: string[],
    parentName?: string
  ): void => {
    entries.push({
      kind: "metadata",
      file: relative(inputDir, xmlFileAbs),
      xmlFileAbs,
      itemName,
      parentName,
      ownerStack,
      rule,
    })

    const ownerDirAbs = dirname(xmlFileAbs)
    addFormEntries(ownerDirAbs, xmlFileAbs, ownerStack, itemName)

    for (const child of rule.childCollections ?? []) {
      if (child.storage !== "file-item") continue

      const childRule = rules.find((candidate) => candidate.itemType === child.itemType)
      if (childRule === undefined || childRule.xmlDir === undefined) continue

      const childDirAbs = join(ownerDirAbs, child.xmlDir)
      if (!existsSync(childDirAbs)) continue

      for (const childFileName of listXmlFiles(childDirAbs)) {
        const childName = basename(childFileName, ".xml")
        addMetadataEntryWithChildren(
          childRule,
          join(childDirAbs, childFileName),
          childName,
          [...ownerStack, itemName],
          itemName
        )
      }
    }
  }

  for (const rule of rules) {
    if (rule.itemType === "Configuration" || rule.itemType === "MetadataConfiguration") {
      const configurationXml = join(inputDir, "Configuration.xml")
      if (fileExists(configurationXml)) {
        addMetadataEntryWithChildren(rule, configurationXml, "Configuration", [])
      }
      continue
    }

    if (rule.xmlDir === undefined) continue
    const dirAbs = join(inputDir, rule.xmlDir)
    if (!existsSync(dirAbs)) continue

    for (const fileName of listXmlFiles(dirAbs)) {
      const itemName = basename(fileName, ".xml")
      addMetadataEntryWithChildren(rule, join(dirAbs, fileName), itemName, [])
    }
  }

  return entries
}
```

- [ ] **Step 2: Replace local discovery types/imports in `roundTripYAMLFast.ts`**

In `roundTripYAMLFast.ts`, remove `RoundTripEntryBase`, `RoundTripEntry`, `listXmlFiles`, `addFormEntries`, `addMetadataEntryWithChildren`, and `listRoundTripEntries`.

Add:

```ts
import { listRoundTripXmlEntries, type RoundTripXmlEntry } from "./roundTripXmlDiscovery"
```

Change the loop in `roundTripYAMLFast()`:

```ts
const entries = listRoundTripXmlEntries(inputDir)
```

Keep the existing branch:

```ts
const result = entry.kind === "form" ? roundTripFormOne(entry) : roundTripOne(entry)
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
FAIL metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

The only expected failure is still `checks direct filePath XML for common forms`.

- [ ] **Step 4: Commit extraction**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripXmlDiscovery.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts
git commit -m "refactor: :recycle: вынести обход XML для fast"
```

## Task 3: Add `filePath` Discovery Entries

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripXmlDiscovery.ts`

- [ ] **Step 1: Import resource descriptors and property rule type**

Add imports:

```ts
import { describeMetadataRuleResources } from "~/metadata/project/ruleResources"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
```

- [ ] **Step 2: Extend `RoundTripXmlEntry` with `filePathProperty`**

Replace the `RoundTripXmlEntry` type with:

```ts
export type RoundTripXmlEntry =
  | (RoundTripEntryBase & {
      kind: "metadata"
      rule: MetadataItemRule
    })
  | (RoundTripEntryBase & {
      kind: "form"
      metadataFile: string
      formXmlFile: string
      formsDir: string
      formName: string
    })
  | (RoundTripEntryBase & {
      kind: "filePathProperty"
      ownerRule: MetadataItemRule
      propertyName: string
      propertyRule: PropertyRule
      ownerXmlFileAbs: string
    })
```

- [ ] **Step 3: Add helper that resolves static `filePath` XML**

Add below `listXmlFiles`:

```ts
const isConfigurationRule = (rule: MetadataItemRule): boolean =>
  rule.itemType === "Configuration" || rule.itemType === "MetadataConfiguration"

const resolveFilePathXmlAbs = (params: {
  inputDir: string
  ownerDirAbs: string
  rule: MetadataItemRule
  itemName: string
  filePath: string
}): string => {
  const { inputDir, ownerDirAbs, rule, itemName, filePath } = params
  if (isConfigurationRule(rule)) return join(inputDir, filePath)
  return join(ownerDirAbs, itemName, filePath)
}
```

- [ ] **Step 4: Add filePath entries from rule resources**

Inside `addMetadataEntryWithChildren()`, immediately after `addFormEntries(...)`, add:

```ts
for (const resource of describeMetadataRuleResources(rule)) {
  if (resource.kind !== "xml" || resource.role !== "externalXml") continue
  if (resource.xmlPathKind === "dynamic") continue

  const propertyRule = rule.properties[resource.propertyName]
  if (propertyRule === undefined) continue

  const xmlFileAbs = resolveFilePathXmlAbs({
    inputDir,
    ownerDirAbs,
    rule,
    itemName,
    filePath: resource.xmlPathKind === "static" ? resource.xmlPath : resource.filePath,
  })
  if (!fileExists(xmlFileAbs)) continue

  entries.push({
    kind: "filePathProperty",
    file: relative(inputDir, xmlFileAbs),
    xmlFileAbs,
    itemName,
    parentName,
    ownerStack,
    ownerRule: rule,
    propertyName: resource.propertyName,
    propertyRule,
    ownerXmlFileAbs:
      xmlFileAbs === join(inputDir, "Configuration.xml") ? xmlFileAbs : join(ownerDirAbs, `${itemName}.xml`),
  })
}
```

Then replace `xmlFileAbs === join(inputDir, "Configuration.xml") ? ...` with this clearer expression before `entries.push`:

```ts
const ownerXmlFileAbs = isConfigurationRule(rule)
  ? join(inputDir, "Configuration.xml")
  : join(ownerDirAbs, `${itemName}.xml`)
```

and use:

```ts
        ownerXmlFileAbs,
```

- [ ] **Step 5: Run the focused test and verify TypeScript failures are limited to missing runner**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
FAIL metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

The expected failure at this step is a TypeScript or runtime branch issue in `roundTripYAMLFast.ts`, because `filePathProperty` entries are now emitted but not handled.

## Task 4: Implement `filePathProperty` Round-Trip Runner

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`

- [ ] **Step 1: Add property-level imports**

Add imports:

```ts
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToYAML } from "~/metadata/orchestration/property/toYAML"
import { importPropertyFromYAML } from "~/metadata/orchestration/property/fromYAML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import { metadataTargetOwnerFromRule } from "~/metadata/orchestration/property/metadataTargetString"
```

- [ ] **Step 2: Add a type alias for the new entry**

Add near existing aliases:

```ts
type FilePathPropertyEntry = Extract<RoundTripXmlEntry, { kind: "filePathProperty" }>
```

- [ ] **Step 3: Add helper that imports raw external XML**

Add below `roundTripFormOne()`:

```ts
const importExternalXmlPropertyValue = (entry: FilePathPropertyEntry, xml: string, forReference: boolean): unknown => {
  const raw = importContentFromXML(xml, { preserveXsiNil: true })
  return importPropertyFromXML({
    context: makeContextFromXML(forReference),
    rule: entry.propertyRule,
    value: raw,
    name: entry.propertyName,
    ownerXmlName: entry.itemName,
  })
}
```

- [ ] **Step 4: Add helper that creates owner metadata target context**

Add below the previous helper:

```ts
const withFilePathOwner = (context: ReturnType<typeof makeContext>, entry: FilePathPropertyEntry) => ({
  ...context,
  exportToYAML: context.exportToYAML
    ? {
        ...context.exportToYAML,
        metadataTargetOwners: [
          ...(context.exportToYAML.metadataTargetOwners ?? []),
          { itemType: entry.ownerRule.itemType, name: entry.itemName },
        ],
      }
    : context.exportToYAML,
})
```

- [ ] **Step 5: Add property round-trip function**

Add below `roundTripFormOne()`:

```ts
const roundTripFilePathPropertyOne = (entry: FilePathPropertyEntry): { diff?: string; error?: string } => {
  try {
    const originalXml = readFileSync(entry.xmlFileAbs, "utf8")
    const validation = XMLValidator.validate(originalXml)
    if (validation !== true) {
      return { error: String(validation.err?.msg ?? "invalid XML") }
    }

    const originalModel = importExternalXmlPropertyValue(entry, originalXml, false)
    const referenceModel = importExternalXmlPropertyValue(entry, originalXml, true)

    const yamlContext = withFilePathOwner(makeContext(), entry)
    const yamlObject = exportPropertyToYAML({
      context: yamlContext,
      rule: entry.propertyRule,
      value: originalModel,
      name: entry.itemName,
      owner: metadataTargetOwnerFromRule({
        itemRule: entry.ownerRule,
        name: entry.itemName,
        context: yamlContext,
      }),
    })

    const yamlText = stringify(yamlObject ?? {}, stringifyOptions)
    const yamlAfterText = parse(yamlText)
    const sourceFromYaml = importPropertyFromYAML({
      context: makeContext(),
      rule: entry.propertyRule,
      value: entry.propertyRule.yaml ? yamlAfterText?.[entry.propertyRule.yaml] : undefined,
      yaml: yamlAfterText,
      sourceValue: referenceModel,
      name: entry.itemName,
      owner: metadataTargetOwnerFromRule({
        itemRule: entry.ownerRule,
        name: entry.itemName,
        context: makeContext(),
      }),
    })

    const restoredXml = exportContentToXML(
      exportPropertyToXML({
        context: makeContextWithExportToXML(),
        rule: entry.propertyRule,
        value: sourceFromYaml,
        referenceMetadata: referenceModel,
        metadataItem: { itemType: entry.ownerRule.itemType, name: entry.itemName },
      })
    )

    if (normalizeXmlText(originalXml) === normalizeXmlText(restoredXml)) return {}
    return { diff: createPatch(entry.file, originalXml, restoredXml, "", "", { context: 3 }) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
```

- [ ] **Step 6: Fix owner name parameter if tests show metadata targets are wrong**

If the focused test fails with metadata target owner differences, change `name: entry.itemName` in `exportPropertyToYAML()` and `importPropertyFromYAML()` calls to `name: entry.propertyName`.

Run after this change:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
PASS metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

- [ ] **Step 7: Route the new entry kind**

Replace the current runner branch in `roundTripYAMLFast()` with:

```ts
const result =
  entry.kind === "form"
    ? roundTripFormOne(entry)
    : entry.kind === "filePathProperty"
      ? roundTripFilePathPropertyOne(entry)
      : roundTripOne(entry)
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
PASS metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

- [ ] **Step 9: Commit implementation**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripXmlDiscovery.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "fix: :bug: проверять filePath XML в fast"
```

## Task 5: Verify Against The Real Round-Trip Directory

**Files:**

- No code changes.

- [ ] **Step 1: Run the fast skill script on the external fixture**

Run from repo root:

```bash
.agents/skills/round-trip-yaml-fast/round-trip.sh /home/nikita/git/round-trip
```

Expected:

```text
DIFF_COUNT=1
Diff: CommonForms/ДинамическийСписок/Ext/Form.xml
```

The exact diff body may differ, but the selected file must be `CommonForms/ДинамическийСписок/Ext/Form.xml`.

- [ ] **Step 2: Run the full focused test again**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected:

```text
PASS metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

- [ ] **Step 3: Run project tests before closing**

Run:

```bash
pnpm test
```

Expected:

```text
packages/core test: Test Files ... passed
packages/cli test: Test Files ... passed
```

- [ ] **Step 4: Commit verification-only adjustments if test expectations changed**

If Task 5 Step 2 required updating expectations in tests, run:

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "test: :white_check_mark: обновить ожидания fast discovery"
```

If no files changed after verification, do not create a commit.

## Self-Review

- Spec coverage: план покрывает общий rules-based обход, `Forms/*/Ext/Form.xml`, `filePath` XML, использование shared resource descriptor и проверку на реальном `CommonForms/ДинамическийСписок/Ext/Form.xml`.
- Scope boundary: план не чинит DCS diff и не меняет XML-фикстуры; это отдельная задача после того, как fast начнёт видеть файл.
- Placeholder scan: в плане нет заглушек, пустых “добавить тесты” или шагов без команд проверки.
- Type consistency: новые типы называются `RoundTripXmlEntry` и `filePathProperty`; runner использует те же имена.
