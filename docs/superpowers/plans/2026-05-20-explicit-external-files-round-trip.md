# Explicit External Files Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve known external XML-side files through XML -> YAML -> XML by describing every supported path in rules and adding all restored files to `XmlSyncManifest`.

**Architecture:** Add a small rules-driven byte-copy helper for explicit external files, then wire it into existing external sync handlers instead of adding a catch-all filesystem mirror. Template, Help, WSReference, form item resources, and nested subsystem files remain separate domains, each covered by focused tests.

**Tech Stack:** TypeScript, Node `fs`, Vitest, existing metadata `rules.ts`, `syncExternalFromXML` / `syncExternalToXML`, `XmlSyncManifest`.

---

## File Structure

- Create: `packages/core/metadata/commonObjects/externalFiles/types.ts`
  - Defines explicit byte-copy file and directory specs used from rules.
- Create: `packages/core/metadata/commonObjects/externalFiles/sync.ts`
  - Copies only rule-described files from XML to YAML and YAML to XML; adds XML outputs to `XmlSyncManifest`.
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Adds optional `externalFiles` to `ModulePropertyRule`, `TemplatePropertyRule`, and `HelpPropertyRule`.
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts`
  - Maps form element external files by element name: `Картинки/<name>.<ext>` and `КартинкиЗначений/<name>.<ext>`.
- Modify tests:
  - `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts`
  - `packages/core/metadata/commonObjects/help/syncExternal.test.ts`
  - `packages/core/metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts`
  - `packages/core/metadata/appliedObjects/metadataWSReference/syncToXML.test.ts`
  - `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
  - `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
  - `packages/core/metadata/appliedObjects/metadataSubsystem/convertFromXML.test.ts`
  - `packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts`

## Task 1: Add Explicit External File Helper

**Files:**
- Create: `packages/core/metadata/commonObjects/externalFiles/types.ts`
- Create: `packages/core/metadata/commonObjects/externalFiles/sync.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Add type definitions**

Create `packages/core/metadata/commonObjects/externalFiles/types.ts`:

```ts
export type ExternalFilePathParams = { name: string; parentName?: string; itemName?: string }

export type ExternalFilePath = string | ((params: ExternalFilePathParams) => string)

export type ExternalFileRule =
  | {
      kind: "file"
      xmlPath: ExternalFilePath
      nkdkPath: ExternalFilePath
    }
  | {
      kind: "directory"
      xmlDir: ExternalFilePath
      nkdkDir: ExternalFilePath
      include: readonly (string | RegExp)[]
    }
```

- [ ] **Step 2: Add helper implementation**

Create `packages/core/metadata/commonObjects/externalFiles/sync.ts`:

```ts
import fs from "fs"
import { dirname, isAbsolute, join, relative, resolve } from "path"
import type { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import type { ExternalFilePath, ExternalFilePathParams, ExternalFileRule } from "./types"

const resolvePath = (path: ExternalFilePath, params: ExternalFilePathParams): string =>
  typeof path === "function" ? path(params) : path

const matches = (name: string, include: readonly (string | RegExp)[]): boolean =>
  include.some((pattern) => typeof pattern === "string" ? pattern === name : pattern.test(name))

const assertInside = (root: string, target: string): boolean => {
  const rel = relative(resolve(root), resolve(target))
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)
}

export async function syncExplicitExternalFilesFromXML(params: {
  rules: readonly ExternalFileRule[] | undefined
  xmlDir: string
  nkdkDir: string
  pathParams: ExternalFilePathParams
}): Promise<void> {
  for (const rule of params.rules ?? []) {
    if (rule.kind === "file") {
      const src = join(params.xmlDir, resolvePath(rule.xmlPath, params.pathParams))
      const dst = join(params.nkdkDir, resolvePath(rule.nkdkPath, params.pathParams))
      if (!assertInside(params.xmlDir, src) || !assertInside(params.nkdkDir, dst) || !fs.existsSync(src)) continue
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      continue
    }

    const srcDir = join(params.xmlDir, resolvePath(rule.xmlDir, params.pathParams))
    const dstDir = join(params.nkdkDir, resolvePath(rule.nkdkDir, params.pathParams))
    if (!assertInside(params.xmlDir, srcDir) || !assertInside(params.nkdkDir, dstDir) || !fs.existsSync(srcDir)) continue
    for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!entry.isFile() || !matches(entry.name, rule.include)) continue
      const src = join(srcDir, entry.name)
      const dst = join(dstDir, entry.name)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
    }
  }
}

export async function syncExplicitExternalFilesToXML(params: {
  rules: readonly ExternalFileRule[] | undefined
  nkdkDir: string
  xmlDir: string
  pathParams: ExternalFilePathParams
  xmlManifest?: XmlSyncManifest
}): Promise<void> {
  for (const rule of params.rules ?? []) {
    if (rule.kind === "file") {
      const src = join(params.nkdkDir, resolvePath(rule.nkdkPath, params.pathParams))
      const dst = join(params.xmlDir, resolvePath(rule.xmlPath, params.pathParams))
      if (!assertInside(params.nkdkDir, src) || !assertInside(params.xmlDir, dst) || !fs.existsSync(src)) continue
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
      continue
    }

    const srcDir = join(params.nkdkDir, resolvePath(rule.nkdkDir, params.pathParams))
    const dstDir = join(params.xmlDir, resolvePath(rule.xmlDir, params.pathParams))
    if (!assertInside(params.nkdkDir, srcDir) || !assertInside(params.xmlDir, dstDir) || !fs.existsSync(srcDir)) continue
    for (const entry of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!entry.isFile() || !matches(entry.name, rule.include)) continue
      const src = join(srcDir, entry.name)
      const dst = join(dstDir, entry.name)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
    }
  }
}
```

- [ ] **Step 3: Extend property rule types**

In `packages/core/metadata/orchestration/property/types.ts`, import `ExternalFileRule`:

```ts
import type { ExternalFileRule } from "~/metadata/commonObjects/externalFiles/types"
```

Add to `ModulePropertyRule`, `TemplatePropertyRule`, and `HelpPropertyRule`:

```ts
  externalFiles?: readonly ExternalFileRule[]
```

- [ ] **Step 4: Run typecheck for core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/externalPicture/syncExternal.test.ts
```

Expected: PASS; this confirms the new imports compile without touching behavior.

- [ ] **Step 5: Commit helper**

Run:

```bash
git add packages/core/metadata/commonObjects/externalFiles packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: описать внешние файлы в rules"
```

## Task 2: Support Template.bin And HTML Template Resources

**Files:**
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts`

- [ ] **Step 1: Add failing child template test**

In `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts`, extend the existing test setup:

```ts
const writeFile = (path: string, content: string | Buffer) => {
  fs.mkdirSync(join(path, ".."), { recursive: true })
  fs.writeFileSync(path, content)
}

writeFile(join(xmlDir, "Отчет", "Templates", "Бинарный.xml"), "<MetaDataObject/>")
writeFile(join(xmlDir, "Отчет", "Templates", "Бинарный", "Ext", "Template.bin"), Buffer.from([0, 1, 2, 255]))
writeFile(join(xmlDir, "Отчет", "Templates", "HTML.xml"), "<MetaDataObject/>")
writeFile(join(xmlDir, "Отчет", "Templates", "HTML", "Ext", "Template", "ru.html"), "<html>ru</html>")
writeFile(join(xmlDir, "Отчет", "Templates", "HTML", "Ext", "Template", "_files", "logo.png"), Buffer.from([137, 80]))
```

Add expectations after `syncChildTemplateNamesFromXML`:

```ts
expect([...fs.readFileSync(join(nkdkDir, "Шаблоны", "Бинарный", "Template.bin"))]).toEqual([0, 1, 2, 255])
expect(fs.readFileSync(join(nkdkDir, "Шаблоны", "HTML", "Template", "ru.html"), "utf-8")).toBe("<html>ru</html>")
expect([...fs.readFileSync(join(nkdkDir, "Шаблоны", "HTML", "Template", "_files", "logo.png"))]).toEqual([137, 80])
```

Add expectations after `syncChildTemplateNamesToXML`:

```ts
expect([...fs.readFileSync(join(outputDir, "Отчет", "Templates", "Бинарный", "Ext", "Template.bin"))]).toEqual([0, 1, 2, 255])
expect(fs.readFileSync(join(outputDir, "Отчет", "Templates", "HTML", "Ext", "Template", "ru.html"), "utf-8")).toBe("<html>ru</html>")
expect([...fs.readFileSync(join(outputDir, "Отчет", "Templates", "HTML", "Ext", "Template", "_files", "logo.png"))]).toEqual([137, 80])
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/childTemplateNames/syncExternal.test.ts
```

Expected: FAIL because `Template.bin` and `Template/*` are not copied.

- [ ] **Step 3: Wire explicit files into child template sync**

In `syncExternalFromXML.ts`, after the existing three `copyIfExists` calls, call:

```ts
await syncExplicitExternalFilesFromXML({
  rules: [
    { kind: "file", xmlPath: ({ name }) => `${name}/Ext/Template.bin`, nkdkPath: "Template.bin" },
    { kind: "directory", xmlDir: ({ name }) => `${name}/Ext/Template`, nkdkDir: "Template", include: [/\\.html$/] },
    { kind: "directory", xmlDir: ({ name }) => `${name}/Ext/Template/_files`, nkdkDir: "Template/_files", include: [/.*/] },
  ],
  xmlDir: templatesDir,
  nkdkDir: templateOutputDir,
  pathParams: { name: templateName },
})
```

In `syncExternalToXML.ts`, after the existing three `copyIfExists` calls, call the matching `syncExplicitExternalFilesToXML` with `xmlDir: templateOutputDir`, `nkdkDir: join(templatesDir, templateName)`, `pathParams: { name: templateName }`, and `xmlManifest`.

- [ ] **Step 4: Add CommonTemplate Template.bin rule support**

In `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`, change `template` to:

```ts
    template: {
      type: "Template",
      nkdkPath: "Template.xml",
      xmlPath: "Ext/Template.xml",
      externalFiles: [{ kind: "file", xmlPath: "Ext/Template.bin", nkdkPath: "Template.bin" }],
      toXML: false,
      fromXML: false,
    },
```

In `module/fromXML.ts` and `module/toXML.ts`, after the main copy succeeds or is skipped, call the explicit helper with `rule.externalFiles`, using the same resolved source roots as the primary module/template copy.

- [ ] **Step 5: Run template tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/childTemplateNames/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit template support**

Run:

```bash
git add packages/core/metadata/commonObjects/module/fromXML.ts packages/core/metadata/commonObjects/module/toXML.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts
git commit -m "feat: :sparkles: сохранить внешние файлы макетов"
```

## Task 3: Support Help Assets And WSReference XSD Files

**Files:**
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/syncExternal.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataWSReference/syncToXML.test.ts`

- [ ] **Step 1: Add failing Help asset test**

In `help/syncExternal.test.ts`, add `_files/logo.png` to the first test XML setup and assert it appears in `nkdkDir/Справка/_files/logo.png`. In the second test, create `nkdkDir/Справка/_files/logo.png` and assert `xmlDir/Ext/Help/_files/logo.png` exists after `syncHelpToXML`.

- [ ] **Step 2: Add Help asset implementation**

In `fromXML.ts`, after copying declared HTML pages, copy explicit directories:

```ts
await syncExplicitExternalFilesFromXML({
  rules: [
    { kind: "directory", xmlDir: `${helpHtmlDir}/_files`, nkdkDir: `${rule.nkdkDir}/_files`, include: [/.*/] },
  ],
  xmlDir,
  nkdkDir,
  pathParams: { name: params.name },
})
```

In `toXML.ts`, after copying HTML pages, call `syncExplicitExternalFilesToXML` with the same paths and `xmlManifest`.

- [ ] **Step 3: Add WSReference XSD rule**

In `metadataWSReference/rules.ts`, change `wsDefinition` to:

```ts
    wsDefinition: {
      type: "Template",
      nkdkPath: "WSDefinition.xml",
      xmlPath: "Ext/WSDefinition.xml",
      externalFiles: [{ kind: "directory", xmlDir: "Ext", nkdkDir: "XSD", include: [/\\.xsd$/] }],
    },
```

Add tests that write `Ext/1.xsd` and assert it round-trips to `XSD/1.xsd` and back to `Ext/1.xsd`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/help/syncExternal.test.ts metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts metadata/appliedObjects/metadataWSReference/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit help and WS support**

Run:

```bash
git add packages/core/metadata/commonObjects/help packages/core/metadata/appliedObjects/metadataWSReference
git commit -m "feat: :sparkles: сохранить ресурсы справки и xsd"
```

## Task 4: Support Form Item Picture Files

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/externalItemFiles.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Add failing form tests**

Add a test with XML files:

```text
Forms/ФормаСписка/Ext/Form/Items/Декорация2/Picture.png
Forms/ФормаСписка/Ext/Form/Items/Статус/ValuesPicture.bmp
```

Expected YAML-side files:

```text
Формы/ФормаСписка/Картинки/Декорация2.png
Формы/ФормаСписка/КартинкиЗначений/Статус.bmp
```

Expected XML-side files after sync:

```text
Forms/ФормаСписка/Ext/Form/Items/Декорация2/Picture.png
Forms/ФормаСписка/Ext/Form/Items/Статус/ValuesPicture.bmp
```

- [ ] **Step 2: Create external item file helper**

Create `externalItemFiles.ts`:

```ts
import fs from "fs"
import { dirname, extname, join } from "path"
import type { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"

const supported = [
  { xmlName: "Picture", nkdkDir: "Картинки" },
  { xmlName: "ValuesPicture", nkdkDir: "КартинкиЗначений" },
] as const

export async function copyFormItemExternalFilesFromXML(params: { formXmlDir: string; formNkdkDir: string }): Promise<void> {
  const itemsDir = join(params.formXmlDir, "Ext", "Form", "Items")
  if (!fs.existsSync(itemsDir)) return
  for (const item of await fs.promises.readdir(itemsDir, { withFileTypes: true })) {
    if (!item.isDirectory()) continue
    for (const spec of supported) {
      const files = (await fs.promises.readdir(join(itemsDir, item.name), { withFileTypes: true })).filter((entry) =>
        entry.isFile() && entry.name.startsWith(`${spec.xmlName}.`)
      )
      for (const file of files) {
        const ext = extname(file.name)
        const src = join(itemsDir, item.name, file.name)
        const dst = join(params.formNkdkDir, spec.nkdkDir, `${item.name}${ext}`)
        await fs.promises.mkdir(dirname(dst), { recursive: true })
        await fs.promises.copyFile(src, dst)
      }
    }
  }
}

export async function copyFormItemExternalFilesToXML(params: { formNkdkDir: string; formXmlDir: string; xmlManifest?: XmlSyncManifest }): Promise<void> {
  for (const spec of supported) {
    const srcDir = join(params.formNkdkDir, spec.nkdkDir)
    if (!fs.existsSync(srcDir)) continue
    for (const file of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!file.isFile()) continue
      const ext = extname(file.name)
      const itemName = file.name.slice(0, -ext.length)
      const dst = join(params.formXmlDir, "Ext", "Form", "Items", itemName, `${spec.xmlName}${ext}`)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(join(srcDir, file.name), dst)
      params.xmlManifest?.addFile(dst)
    }
  }
}
```

- [ ] **Step 3: Wire helper into form conversion**

In `convertFromXML.ts`, after `writeFormToYAML`, call `copyFormItemExternalFilesFromXML` with `formXmlDir: join(inputDir, formName)` and `formNkdkDir: join(outputDir, "Формы", formName)`.

In `syncToXML.ts`, after `writeFormToXML`, call `copyFormItemExternalFilesToXML` with `formNkdkDir: formDir`, `formXmlDir: join(outputDir, "Forms", formName)`, and `xmlManifest`.

- [ ] **Step 4: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit form external files**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "feat: :sparkles: сохранить внешние картинки формы"
```

## Task 5: Support Nested Subsystems Explicitly

**Files:**
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/types.ts`
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts`

- [ ] **Step 1: Add failing nested subsystem tests**

Create tests where XML contains:

```text
Subsystems/Администрирование.xml
Subsystems/Администрирование/Subsystems/НастройкиПрограммы.xml
Subsystems/Администрирование/Subsystems/НастройкиПрограммы/Ext/CommandInterface.xml
```

Assert XML -> YAML creates a nested YAML directory under the parent subsystem and YAML -> XML restores the same paths.

- [ ] **Step 2: Implement recursive child subsystem external sync**

Extend `ChildSubsystemNames` handling so `fromXML` reads nested subsystem XML files listed under `<ChildObjects><Subsystem>...`, writes child subsystem `Свойства.yaml`, and copies its `CommandInterface.xml` through the same `Template` rule used by `MetadataSubsystemRules`.

Extend `toXML` so child subsystem YAML directories under the parent are written back to `Subsystems/<Parent>/Subsystems/<Child>.xml`, and every written file is added to `XmlSyncManifest`.

- [ ] **Step 3: Run subsystem tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataSubsystem/convertFromXML.test.ts metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit nested subsystem support**

Run:

```bash
git add packages/core/metadata/commonObjects/childSubsystemNames packages/core/metadata/appliedObjects/metadataSubsystem
git commit -m "feat: :sparkles: сохранить вложенные подсистемы"
```

## Task 6: Verify Manifest Prune Behavior

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add integration test**

Add a test that builds a small YAML/XML fixture with one object containing `Template.bin`, one form item picture, one help asset, and one WS XSD. Run `syncConfigurationToXML` and assert all files exist in output after prune.

- [ ] **Step 2: Run integration test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS and no expected file is pruned.

- [ ] **Step 3: Run related focused suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/childTemplateNames/syncExternal.test.ts metadata/commonObjects/help/syncExternal.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/appliedObjects/metadataWSReference/convertFromXML.test.ts metadata/appliedObjects/metadataWSReference/syncToXML.test.ts metadata/appliedObjects/metadataSubsystem/convertFromXML.test.ts metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit integration coverage**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: покрыть manifest внешних файлов"
```

## Task 7: Final Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run project-required generation**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: generation succeeds. If no generated files change, continue.

- [ ] **Step 2: Run full test suite**

Run from repo root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run round-trip-yaml diagnostic**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 10
```

Expected: the first triage batch no longer contains deletions for supported external-file classes: `Template.bin`, `Ext/Template/*`, form item `Picture.*` / `ValuesPicture.*`, `Ext/Help/_files/*`, `WSReferences/*/Ext/*.xsd`, or nested subsystem files.

- [ ] **Step 4: Final status**

Run:

```bash
git status --short
```

Expected: no unstaged code changes. XML-repo diffs may remain from the diagnostic run by design of `round-trip-yaml`.

## Self-Review

- Spec coverage: Tasks cover explicit rules-first copying, binary/html template files, form item `Картинки` and `КартинкиЗначений`, help assets, WS XSD, nested subsystems, and manifest prune verification.
- Placeholder scan: No `TBD`, `TODO`, "implement later", or unspecified test steps remain.
- Type consistency: The plan consistently uses `ExternalFileRule`, `externalFiles`, `syncExplicitExternalFilesFromXML`, `syncExplicitExternalFilesToXML`, `XmlSyncManifest`, `Картинки`, and `КартинкиЗначений`.
