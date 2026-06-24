# Configuration Root Ext YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать YAML round-trip для согласованных корневых `Ext/*` файлов конфигурации и не трогать ещё не согласованное расхождение `Synonym`.

**Architecture:** Сначала расширяем существующие внешние sync-типы (`Module`, `ExternalFile`, `ExternalPicture`), чтобы они умели работать у корневой конфигурации без имени объекта. Затем подключаем простые внешние файлы в `MetadataConfigurationRules`. После этого добавляем rule-driven типы для трех XML-объектов: `ClientApplicationInterface`, `CommandInterface`, `HomePageWorkArea`.

**Tech Stack:** TypeScript, Vitest, rule-driven metadata orchestration, `pnpm --filter @nakidka/core exec vitest`, `.agents/skills/round-trip-yaml/round-trip.sh`.

---

## Scope

Входит:

- `Ext/ManagedApplicationModule.bsl`, `Ext/SessionModule.bsl`, `Ext/ExternalConnectionModule.bsl`, `Ext/OrdinaryApplicationModule.bsl`;
- `Ext/MobileClientSignature.bin`;
- `Ext/MainSectionPicture.xml`, `Ext/MainSectionPicture/*`;
- `Ext/Splash.xml`, `Ext/Splash/*`;
- `Ext/ClientApplicationInterface.xml`;
- `Ext/CommandInterface.xml`;
- `Ext/MainSectionCommandInterface.xml`;
- `Ext/HomePageWorkArea.xml`;
- `Ext/CommandInterface.xml` у подсистем.

Не входит:

- `ConfigDumpInfo.xml`;
- `Ext/ParentConfigurations.bin`, потому что он уже оформлен как reference-only файл в `round-trip-yaml`;
- `Ext/Logo.xml`, `Ext/MobileClientSign*`, `ApplicationModule`, пока по ним нет подтвержденного текущего diff;
- расхождение `InformationRegisters/*` по пустому `Synonym`.

## File Structure

- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts` - уже умеет читать root-файлы; оставить как источник поведения.
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts` - убрать требование `name` для простых строковых путей и писать root-файл прямо в `xmlDir`.
- Modify: `packages/core/metadata/commonObjects/module/syncExternal.test.ts` - добавить root module regression.
- Modify: `packages/core/metadata/commonObjects/externalFile/toXML.ts` - разрешить root external file без `name`.
- Create: `packages/core/metadata/commonObjects/externalFile/syncExternal.test.ts` - покрыть root `MobileClientSignature.bin`.
- Modify: `packages/core/metadata/commonObjects/externalPicture/toXML.ts` - разрешить root picture без `name`.
- Modify: `packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts` - покрыть root `ExtPicture`.
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts` - добавить свойства корневых модулей, картинки, подпись и XML-объекты.
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts` - проверить выгрузку корневых внешних файлов в YAML-проект.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` - проверить восстановление корневых внешних файлов в XML.
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/*` - rule-driven тип для `ClientApplicationInterface.xml`.
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/*` - общий тип для root/subsystem `CommandInterface.xml`, отдельно от form `CommandInterface`.
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/*` - rule-driven тип для `HomePageWorkArea.xml`.
- Modify: `packages/core/metadata/orchestration/property/types.ts` and role/reference conversion files found by `rg "Role\\.|MetadataItemLink|MetadataItemLinks"` - add `roleReferenceYAML`.

### Task 1: Root External Sync Primitives

**Files:**
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/syncExternal.test.ts`
- Modify: `packages/core/metadata/commonObjects/externalFile/toXML.ts`
- Create: `packages/core/metadata/commonObjects/externalFile/syncExternal.test.ts`
- Modify: `packages/core/metadata/commonObjects/externalPicture/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts`

- [ ] **Step 1: Write failing tests for root `Module`, `ExternalFile`, and `ExternalPicture`**

Add to `packages/core/metadata/commonObjects/module/syncExternal.test.ts`:

```ts
it("writes root configuration module without object name", async () => {
  const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "root-module-"))
  const nkdkDir = join(tmpDir, "yaml")
  const xmlDir = join(tmpDir, "out")
  const rule = {
    type: "Module" as const,
    nkdkPath: "МодульСеанса.bsl",
    xmlPath: "Ext/SessionModule.bsl",
  }

  await fs.promises.mkdir(nkdkDir, { recursive: true })
  await fs.promises.writeFile(join(nkdkDir, "МодульСеанса.bsl"), "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n")

  const xmlManifest = new XmlSyncManifest(xmlDir)
  await syncModuleToXML({ rule, nkdkDir, xmlDir, xmlManifest })

  expect(fs.readFileSync(join(xmlDir, "Ext", "SessionModule.bsl"), "utf-8")).toBe(
    "Процедура ПриНачалеСеанса()\nКонецПроцедуры\n"
  )
  expect(xmlManifest.expectedFiles()).toContain("Ext/SessionModule.bsl")
})
```

Create `packages/core/metadata/commonObjects/externalFile/syncExternal.test.ts`:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { syncExternalFileFromXML } from "./fromXML"
import { syncExternalFileToXML } from "./toXML"

describe("ExternalFile sync", () => {
  it("round-trips root configuration external file without object name", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "root-external-file-"))
    const xmlDir = join(tmpDir, "xml")
    const nkdkDir = join(tmpDir, "yaml")
    const outDir = join(tmpDir, "out")
    const rule = {
      type: "ExternalFile" as const,
      nkdkPath: "ПодписьМобильногоКлиента.bin",
      xmlPath: "Ext/MobileClientSignature.bin",
      syncExternalOnly: true,
    }
    const bytes = Buffer.from([0xff, 0x00, 0x7f, 0x42])

    await fs.promises.mkdir(join(xmlDir, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, "Ext", "MobileClientSignature.bin"), bytes)

    await syncExternalFileFromXML({ rule, xmlDir, nkdkDir })
    expect([...fs.readFileSync(join(nkdkDir, "ПодписьМобильногоКлиента.bin"))]).toEqual([...bytes])

    const xmlManifest = new XmlSyncManifest(outDir)
    await syncExternalFileToXML({ rule, nkdkDir, xmlDir: outDir, xmlManifest })
    expect([...fs.readFileSync(join(outDir, "Ext", "MobileClientSignature.bin"))]).toEqual([...bytes])
    expect(xmlManifest.expectedFiles()).toContain("Ext/MobileClientSignature.bin")
  })
})
```

Add to `packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts`:

```ts
it("copies root Picture.xml and payload without object name", async () => {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
  const xmlDir = join(tmpRoot, "xml")
  const nkdkDir = join(tmpRoot, "nkdk")
  const outDir = join(tmpRoot, "out")
  const rootRule = {
    type: "ExternalPicture" as const,
    nkdkDir: "Заставка",
    xmlPath: "Ext/Splash.xml",
    payloadXmlDir: "Ext/Splash",
  }

  fs.mkdirSync(join(xmlDir, "Ext", "Splash"), { recursive: true })
  fs.writeFileSync(join(xmlDir, "Ext", "Splash.xml"), "<ExtPicture/>")
  fs.writeFileSync(join(xmlDir, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))

  await syncExternalPictureFromXML({ rule: rootRule, xmlDir, nkdkDir })
  expect(fs.readFileSync(join(nkdkDir, "Заставка", "Splash.xml"), "utf-8")).toBe("<ExtPicture/>")
  expect([...fs.readFileSync(join(nkdkDir, "Заставка", "Picture.png"))]).toEqual([137, 80, 78, 71])

  const xmlManifest = new XmlSyncManifest(outDir)
  await syncExternalPictureToXML({ rule: rootRule, nkdkDir, xmlDir: outDir, xmlManifest })
  expect(fs.readFileSync(join(outDir, "Ext", "Splash.xml"), "utf-8")).toBe("<ExtPicture/>")
  expect([...fs.readFileSync(join(outDir, "Ext", "Splash", "Picture.png"))]).toEqual([137, 80, 78, 71])
  expect(xmlManifest.expectedFiles()).toEqual(expect.arrayContaining(["Ext/Splash.xml", "Ext/Splash/Picture.png"]))
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/module/syncExternal.test.ts metadata/commonObjects/externalFile/syncExternal.test.ts metadata/commonObjects/externalPicture/syncExternal.test.ts
```

Expected: root `toXML` tests fail because current `ExternalFile`, `ExternalPicture`, and `Module` `toXML` paths require `name` or force object directory.

- [ ] **Step 3: Implement root-aware `toXML` helpers**

In `packages/core/metadata/commonObjects/externalFile/toXML.ts`, replace the early return and object dir calculation with:

```ts
  const rule = params.rule as ExternalFilePropertyRule
  const srcPath = join(params.nkdkDir, rule.nkdkPath)
  if (!fs.existsSync(srcPath)) return

  const objectXmlDir = params.name
    ? basename(params.xmlDir) === params.name
      ? params.xmlDir
      : join(params.xmlDir, params.name)
    : params.xmlDir
  const dstPath = join(objectXmlDir, rule.xmlPath)
```

In `packages/core/metadata/commonObjects/externalPicture/toXML.ts`, change the resolver to accept optional `objectName`:

```ts
const resolveObjectXmlDir = (params: { xmlDir: string; objectName?: string }): string => {
  const { xmlDir, objectName } = params
  if (!objectName) return xmlDir
  return basename(xmlDir) === objectName ? xmlDir : join(xmlDir, objectName)
}
```

and call:

```ts
const objectXmlDir = resolveObjectXmlDir({ xmlDir: params.xmlDir, objectName: params.name })
```

In `packages/core/metadata/commonObjects/module/toXML.ts`, keep the existing `needsName` guard only for functional paths:

```ts
  const name = itemName ?? params.name
  const needsName = typeof rawXmlPath === "function" || typeof rawNkdkPath === "function"
  if (needsName && !name) return
```

Do not add a generic `if (!params.name) return`.

- [ ] **Step 4: Run primitive tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/module/syncExternal.test.ts metadata/commonObjects/externalFile/syncExternal.test.ts metadata/commonObjects/externalPicture/syncExternal.test.ts
```

Expected: all tests pass.

Commit:

```bash
git add packages/core/metadata/commonObjects/module/toXML.ts packages/core/metadata/commonObjects/module/syncExternal.test.ts packages/core/metadata/commonObjects/externalFile/toXML.ts packages/core/metadata/commonObjects/externalFile/syncExternal.test.ts packages/core/metadata/commonObjects/externalPicture/toXML.ts packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts
git commit -m "fix: support root external configuration files"
```

### Task 2: Root Modules, Pictures, and Mobile Signature Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Write configuration sync tests for simple root external files**

In `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`, add a test that prepares a minimal XML configuration directory with:

```text
Configuration.xml
Ext/ManagedApplicationModule.bsl
Ext/SessionModule.bsl
Ext/ExternalConnectionModule.bsl
Ext/OrdinaryApplicationModule.bsl
Ext/MobileClientSignature.bin
Ext/MainSectionPicture.xml
Ext/MainSectionPicture/Picture.svg
Ext/Splash.xml
Ext/Splash/Picture.png
```

Expected YAML files:

```text
МодульПриложения.bsl
МодульСеанса.bsl
МодульВнешнегоСоединения.bsl
МодульОбычногоПриложения.bsl
ПодписьМобильногоКлиента.bin
КартинкаОсновногоРаздела/MainSectionPicture.xml
КартинкаОсновногоРаздела/Picture.svg
Заставка/Splash.xml
Заставка/Picture.png
```

Use byte checks for binary files:

```ts
expect([...fs.readFileSync(join(outputDir, "ПодписьМобильногоКлиента.bin"))]).toEqual([0, 1, 2, 255])
expect([...fs.readFileSync(join(outputDir, "Заставка", "Picture.png"))]).toEqual([137, 80, 78, 71])
```

In `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, add the inverse test and assert:

```ts
expect(fs.readFileSync(join(outputDir, "Ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(managedApplicationModule)
expect(fs.readFileSync(join(outputDir, "Ext", "SessionModule.bsl"), "utf-8")).toBe(sessionModule)
expect(fs.readFileSync(join(outputDir, "Ext", "ExternalConnectionModule.bsl"), "utf-8")).toBe(externalConnectionModule)
expect(fs.readFileSync(join(outputDir, "Ext", "OrdinaryApplicationModule.bsl"), "utf-8")).toBe(ordinaryApplicationModule)
expect([...fs.readFileSync(join(outputDir, "Ext", "MobileClientSignature.bin"))]).toEqual([0, 1, 2, 255])
expect([...fs.readFileSync(join(outputDir, "Ext", "Splash", "Picture.png"))]).toEqual([137, 80, 78, 71])
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: new files are missing because `MetadataConfigurationRules` does not declare these external properties yet.

- [ ] **Step 3: Add simple external properties to `MetadataConfigurationRules`**

In `packages/core/metadata/appliedObjects/configuration/rules.ts`, add these properties after the ordinary scalar configuration properties and before child collections:

```ts
    managedApplicationModule: {
      type: "Module",
      nkdkPath: "МодульПриложения.bsl",
      xmlPath: "Ext/ManagedApplicationModule.bsl",
      syncExternalOnly: true,
    },
    sessionModule: {
      type: "Module",
      nkdkPath: "МодульСеанса.bsl",
      xmlPath: "Ext/SessionModule.bsl",
      syncExternalOnly: true,
    },
    externalConnectionModule: {
      type: "Module",
      nkdkPath: "МодульВнешнегоСоединения.bsl",
      xmlPath: "Ext/ExternalConnectionModule.bsl",
      syncExternalOnly: true,
    },
    ordinaryApplicationModule: {
      type: "Module",
      nkdkPath: "МодульОбычногоПриложения.bsl",
      xmlPath: "Ext/OrdinaryApplicationModule.bsl",
      syncExternalOnly: true,
    },
    mobileClientSignature: {
      type: "ExternalFile",
      nkdkPath: "ПодписьМобильногоКлиента.bin",
      xmlPath: "Ext/MobileClientSignature.bin",
      syncExternalOnly: true,
    },
    mainSectionPicture: {
      type: "ExternalPicture",
      nkdkDir: "КартинкаОсновногоРаздела",
      xmlPath: "Ext/MainSectionPicture.xml",
      payloadXmlDir: "Ext/MainSectionPicture",
      syncExternalOnly: true,
    },
    splash: {
      type: "ExternalPicture",
      nkdkDir: "Заставка",
      xmlPath: "Ext/Splash.xml",
      payloadXmlDir: "Ext/Splash",
      syncExternalOnly: true,
    },
```

If TypeScript rejects `syncExternalOnly` on `Module` or `ExternalPicture`, extend the corresponding property rule type to include `syncExternalOnly?: true`. Do not emit these properties into `Конфигурация.yaml`.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/module/syncExternal.test.ts metadata/commonObjects/externalFile/syncExternal.test.ts metadata/commonObjects/externalPicture/syncExternal.test.ts metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: all tests pass.

Commit:

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/commonObjects
git commit -m "feat: preserve root configuration external files"
```

### Task 3: Role Reference YAML Output Mode

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: metadata item link conversion files found by `rg -n "MetadataItemLink|MetadataItemLinks|Role\\." packages/core/metadata/commonObjects packages/core/metadata/orchestration -g '*.ts'`
- Test: nearest existing tests for metadata item links, plus new focused tests if none exist.

- [ ] **Step 1: Locate the reference conversion implementation**

Run:

```bash
rg -n "MetadataItemLink|MetadataItemLinks|Role\\.|roleReferenceYAML" packages/core/metadata/commonObjects packages/core/metadata/orchestration -g '*.ts'
```

Expected: find the rule type definition and the converter that turns `Role.Администратор` into YAML and back.

- [ ] **Step 2: Write failing tests for `roleReferenceYAML: "name"`**

Add tests near the converter found in Step 1:

```ts
it("exports role references without Role prefix when rule asks for name form", () => {
  const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

  expect(exportMetadataItemLinkToYAML({ context: mockContext, rule, value: "Role.Администратор" })).toBe(
    "Администратор"
  )
})

it("imports short role references back to full Role reference when rule asks for name form", () => {
  const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

  expect(importMetadataItemLinkFromYAML({ context: mockContext, rule, value: "Администратор" })).toBe(
    "Role.Администратор"
  )
  expect(importMetadataItemLinkFromYAML({ context: mockContext, rule, value: "Role.Администратор" })).toBe(
    "Role.Администратор"
  )
})

it("keeps non-role references unchanged in short role mode", () => {
  const rule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const

  expect(exportMetadataItemLinkToYAML({ context: mockContext, rule, value: "CommonForm.НачалоРаботы" })).toBe(
    "CommonForm.НачалоРаботы"
  )
  expect(importMetadataItemLinkFromYAML({ context: mockContext, rule, value: "CommonForm.НачалоРаботы" })).toBe(
    "CommonForm.НачалоРаботы"
  )
})
```

Use the actual function names from the located converter; keep the assertions unchanged.

- [ ] **Step 3: Implement the rule option**

In `packages/core/metadata/orchestration/property/types.ts`, add:

```ts
  roleReferenceYAML?: "full" | "name"
```

In the reference converter, implement:

```ts
const toRoleYAML = (rule: { roleReferenceYAML?: "full" | "name" }, value: string): string => {
  if (rule.roleReferenceYAML !== "name") return value
  return value.startsWith("Role.") ? value.slice("Role.".length) : value
}

const fromRoleYAML = (rule: { roleReferenceYAML?: "full" | "name" }, value: string): string => {
  if (rule.roleReferenceYAML !== "name") return value
  if (value.startsWith("Role.")) return value
  if (value.includes(".")) return value
  return `Role.${value}`
}
```

Apply it only to properties whose rule explicitly sets `roleReferenceYAML: "name"`. Existing objects must keep the full form by default.

- [ ] **Step 4: Run tests and commit**

Run the located reference tests plus:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/commandInterface/fromYAML.test.ts metadata/forms/commonObjects/commandInterface/toYAML.test.ts
```

Expected: all tests pass; existing form command interface YAML remains unchanged.

Commit:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata
git commit -m "feat: add role reference yaml mode"
```

### Task 4: Root CommandInterface Type

**Files:**
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/types.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/rules.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/rootCommandInterface/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: subsystem rules file found by `rg -n "commandInterface.*Template|CommandInterface.xml|Subsystem" packages/core/metadata/appliedObjects -g 'rules.ts'`

- [ ] **Step 1: Write focused fixture tests**

Use source XML files:

```text
/Users/nikita/git/roundTripElements/ext/CommandInterface.xml
/Users/nikita/git/roundTripElements/ext/MainSectionCommandInterface.xml
/Users/nikita/git/roundTripElements/Subsystems/ПодсистемаВсеСвойства/Ext/CommandInterface.xml
```

Tests must assert these YAML fragments:

```yaml
ВидимостьПодсистем:
  Подсистема.Продажи:
    Общее: Ложь
    Роли:
      Администратор: Ложь
ПорядокПодсистем:
  - Подсистема.Продажи
ВидимостьКоманд:
  Catalog.Товары.StandardCommand.OpenList:
    Общее: Истина
РазмещениеКоманд:
  Catalog.Товары.StandardCommand.OpenList:
    ГруппаКоманд: ПанельНавигацииОбычное
    Размещение: Вручную
ПорядокКоманд:
  - Команда: Catalog.Товары.StandardCommand.OpenList
    ГруппаКоманд: ПанельНавигацииОбычное
ПорядокГрупп:
  - ПанельНавигацииОбычное
```

Also assert that values like `0:<uuid>` remain exactly the same string in YAML and XML.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/rootCommandInterface
```

Expected: tests fail because the type does not exist.

- [ ] **Step 3: Implement `RootCommandInterfaceRules`**

Create `packages/core/metadata/commonObjects/rootCommandInterface/rules.ts` with rules for:

```ts
export const RootCommandInterfaceRules = {
  itemType: "RootCommandInterface",
  properties: {
    commandsVisibility: { yaml: "ВидимостьКоманд", xml: "CommandsVisibility", type: "CommandInterfaceVisibilityMap" },
    commandsPlacement: { yaml: "РазмещениеКоманд", xml: "CommandsPlacement", type: "CommandInterfacePlacementMap" },
    commandsOrder: { yaml: "ПорядокКоманд", xml: "CommandsOrder", type: "CommandInterfaceOrder" },
    subsystemsVisibility: {
      yaml: "ВидимостьПодсистем",
      xml: "SubsystemsVisibility",
      type: "CommandInterfaceVisibilityMap",
    },
    subsystemsOrder: { yaml: "ПорядокПодсистем", xml: "SubsystemsOrder", type: "MetadataItemLinks" },
    groupsOrder: { yaml: "ПорядокГрупп", xml: "GroupsOrder", type: "MetadataItemLinks" },
  },
} as const satisfies MetadataItemRule
```

Register helper property types in `register.ts`:

- visibility object: `Общее` + `Роли`, with `roleReferenceYAML: "name"`;
- placement enum: `Auto` -> `Авто`, `Manual` -> `Вручную`;
- standard command groups: `NavigationPanelOrdinary` -> `ПанельНавигацииОбычное` and the other mappings from the spec;
- unknown strings pass through unchanged.

- [ ] **Step 4: Wire root and subsystem rules**

In `MetadataConfigurationRules`, add:

```ts
    commandInterface: {
      yaml: "КомандныйИнтерфейс",
      type: "RootCommandInterface",
      filePath: "Ext/CommandInterface.xml",
    },
    mainSectionCommandInterface: {
      yaml: "КомандныйИнтерфейсОсновногоРаздела",
      type: "RootCommandInterface",
      filePath: "Ext/MainSectionCommandInterface.xml",
    },
```

In subsystem rules, replace the current disabled `Template` command interface with:

```ts
    commandInterface: {
      yaml: "КомандныйИнтерфейс",
      type: "RootCommandInterface",
      filePath: "Ext/CommandInterface.xml",
    },
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/rootCommandInterface metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: root and subsystem command interface XML round-trip and YAML conversion pass.

Commit:

```bash
git add packages/core/metadata/commonObjects/rootCommandInterface packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects
git commit -m "feat: add root command interface yaml"
```

### Task 5: ClientApplicationInterface Type

**Files:**
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/types.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/rules.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/register.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`

- [ ] **Step 1: Write tests from fixture and clean default**

Use:

```text
/Users/nikita/git/roundTripElements/ext/ClientApplicationInterface.xml
/Users/nikita/git/round-trip-source/doc/Ext/ClientApplicationInterface.xml
/Users/nikita/git/clean_cf
```

Assert YAML contains:

```yaml
ИнтерфейсКлиентскогоПриложения:
  Верх:
    - Панель: ПанельФункцийТекущегоРаздела
    - Панель: ПанельОткрытых
    - Панель: СтандартнаяПанель
  Лево:
    - Панель: ПанельИстории
  Низ:
    - Панель: ПанельРазделов
```

Assert expanded panel form when `height`, `name`, `uuid`, or `spr` is present:

```yaml
- Панель:
    Имя: ПанельИстории
    Высота: 1
    Представление: КартинкаСлеваИТекст
```

Assert no `id` appears in YAML.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/clientApplicationInterface
```

Expected: tests fail because the type does not exist.

- [ ] **Step 3: Implement parser and serializer**

Create standard panel mapping in `register.ts`:

```ts
const standardPanelsByUuid = {
  "b553047f-c9aa-4157-978d-448ecad24248": "ПанельИстории",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3": "ПанельРазделов",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99": "ПанельФункцийТекущегоРаздела",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75": "ПанельОткрытых",
  "b2735bd3-d822-4430-ba59-c9e869693b24": "ПанельИзбранного",
  "00000000-0000-0000-0000-000000000000": "СтандартнаяПанель",
} as const
```

Rules and converters must:

- map `top`, `left`, `right`, `bottom` to `Верх`, `Лево`, `Право`, `Низ`;
- map `group` to `Группа: { Элементы: [...] }`;
- map panel `uuid` to standard name, unknown UUID to `UUID`;
- preserve XML `name` as `Имя`;
- restore `id` from reference by structural position; generate UUID for new nodes;
- use `panelDef.spr` as `Представление`;
- recreate default empty `panelDef` entries for used standard panels when no reference exists.

- [ ] **Step 4: Wire configuration rule**

In `MetadataConfigurationRules`, add:

```ts
    clientApplicationInterface: {
      yaml: "ИнтерфейсКлиентскогоПриложения",
      type: "ClientApplicationInterface",
      filePath: "Ext/ClientApplicationInterface.xml",
    },
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/clientApplicationInterface metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: XML/YAML tests pass and clean configuration does not create `Ext/ClientApplicationInterface.xml`.

Commit:

```bash
git add packages/core/metadata/commonObjects/clientApplicationInterface packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration
git commit -m "feat: add client application interface yaml"
```

### Task 6: HomePageWorkArea Type

**Files:**
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/types.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/rules.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/register.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/homePageWorkArea/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`

- [ ] **Step 1: Write tests from fixture and clean default**

Use:

```text
/Users/nikita/git/roundTripElements/ext/HomePageWorkArea.xml
/Users/nikita/git/round-trip-source/acc/Ext/HomePageWorkArea.xml
/Users/nikita/git/clean_cf
```

Assert YAML contains:

```yaml
РабочаяОбластьНачальнойСтраницы:
  ШаблонРабочейОбласти: ДвеКолонкиПеременнойШирины
  ЛеваяКолонка:
    - Форма: CommonForm.НачалоРаботы
      Высота: 100
      Видимость:
        Общее: Истина
        Роли:
          Администратор: Ложь
  ПраваяКолонка:
    - Форма: DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр
      Высота: 10
      Видимость:
        Общее: Ложь
  ОтображениеКомандногоИнтерфейса: Верх
```

Assert YAML import accepts both `Администратор` and `Role.Администратор`, and XML output writes `Role.Администратор`.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/homePageWorkArea
```

Expected: tests fail because the type does not exist.

- [ ] **Step 3: Implement rules and enums**

Create enum maps:

```ts
const workingAreaTemplateToYAML = {
  OneColumn: "ОднаКолонка",
  TwoColumnsEqualWidth: "ДвеКолонкиРавнойШирины",
  TwoColumnsVariableWidth: "ДвеКолонкиПеременнойШирины",
} as const

const maCommandInterfaceDisplaysToYAML = {
  Top: "Верх",
  Bottom: "Низ",
  None: "Нет",
} as const
```

Rules and converters must:

- map `Column` to `Колонка`;
- map `LeftColumn` and `RightColumn` to `ЛеваяКолонка` and `ПраваяКолонка`;
- preserve reference column kind when YAML does not force another kind;
- map item fields `Form`, `Height`, `Visibility` to `Форма`, `Высота`, `Видимость`;
- reuse `roleReferenceYAML: "name"` for visibility roles;
- pass unknown enum strings through unchanged.

- [ ] **Step 4: Wire configuration rule**

In `MetadataConfigurationRules`, add:

```ts
    homePageWorkArea: {
      yaml: "РабочаяОбластьНачальнойСтраницы",
      type: "HomePageWorkArea",
      filePath: "Ext/HomePageWorkArea.xml",
    },
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/homePageWorkArea metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: XML/YAML tests pass and clean configuration does not create `Ext/HomePageWorkArea.xml`.

Commit:

```bash
git add packages/core/metadata/commonObjects/homePageWorkArea packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration
git commit -m "feat: add home page work area yaml"
```

### Task 7: Full Round-Trip Verification

**Files:**
- No planned source edits unless verification exposes a defect inside the implemented scope.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/module/syncExternal.test.ts metadata/commonObjects/externalFile/syncExternal.test.ts metadata/commonObjects/externalPicture/syncExternal.test.ts metadata/commonObjects/rootCommandInterface metadata/commonObjects/clientApplicationInterface metadata/commonObjects/homePageWorkArea metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run `round-trip-yaml` for `acc`**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20 --start-index 1
```

Expected:

- `ConfigDumpInfo.xml` may still appear and remains out of scope;
- no deletion diffs for `Ext/ClientApplicationInterface.xml`;
- no deletion diffs for `Ext/CommandInterface.xml`;
- no deletion diffs for `Ext/ExternalConnectionModule.bsl`, `Ext/ManagedApplicationModule.bsl`, `Ext/OrdinaryApplicationModule.bsl`, `Ext/SessionModule.bsl`;
- no deletion diffs for `Ext/HomePageWorkArea.xml`;
- no deletion diffs for `Ext/MainSectionPicture.xml`, `Ext/MainSectionPicture/Picture.svg`, `Ext/Splash.xml`, `Ext/Splash/Picture.png`;
- no deletion diff for `Ext/MobileClientSignature.bin`;
- no diff for `Ext/ParentConfigurations.bin`.

- [ ] **Step 3: Run `round-trip-yaml` for `doc`**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/doc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20 --start-index 1
```

Expected:

- `ConfigDumpInfo.xml` may still appear and remains out of scope;
- previously covered root `Ext/*` deletions are gone;
- if `InformationRegisters/*` `Synonym` diffs remain, record them as the next separate brainstorming item.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Commit verification notes if tests required doc updates**

If no docs changed, skip this commit. If implementation revealed a needed clarification in specs, update only the affected spec and commit:

```bash
git add docs/superpowers/specs
git commit -m "docs: clarify root ext yaml behavior"
```

## Self-Review

- Spec coverage: client application interface, command interface, root modules, home page work area, root pictures, mobile client signature, and ParentConfigurations exclusion are each covered by at least one task.
- Placeholder scan: no `TBD`, `TODO`, or unspecified "write tests" steps remain; each test step names expected files or exact assertions.
- Type consistency: the plan uses `RootCommandInterface`, `ClientApplicationInterface`, and `HomePageWorkArea` as new common object type names consistently.
- Scope check: the plan intentionally excludes `ConfigDumpInfo.xml`, `ParentConfigurations.bin` model storage, `Logo`, `MobileClientSign`, `ApplicationModule`, and register `Synonym` diffs.
