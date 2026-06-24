# Metadata Module Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `Module.bsl`, `ObjectModule.bsl`, `ManagerModule.bsl`, `RecordSetModule.bsl`, and `CommandModule.bsl` files during XML -> YAML -> XML round-trip for common forms, documents, and information registers.

**Architecture:** Use existing declarative `Module` property rules and existing `Module.syncExternalFromXML` / `Module.syncExternalToXML` handlers. Do not add custom copy logic to form or applied-object orchestrators. Tests prove the full sync path because the production failure happens after manifest cleanup.

**Tech Stack:** TypeScript, Vitest, existing metadata `rules.ts`, existing applied-object sync helpers, `round-trip-yaml`.

---

## File Structure

- Modify `packages/core/metadata/appliedObjects/metadataCommonForm/rules.ts`
  - Add `module` property with `type: "Module"`, `nkdkPath: "Модуль.bsl"`, and `xmlPath: "Ext/Form/Module.bsl"`.
- Modify `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`
  - Add direct import/sync tests with temporary module files because the existing XML fixture has no common form module.
- Modify `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
  - Import `MetadataCommandRules`.
  - Add document `objectModule` and `managerModule` properties.
  - Add document-specific command item rule and `childCollections`.
- Modify `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts`
  - Extend existing import test to assert object, manager, and command module copying.
- Modify `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts`
  - Extend sync test expected files to assert module restoration after manifest cleanup.
- Create `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульОбъекта.bsl`
  - YAML-side copy of existing XML fixture `Ext/ObjectModule.bsl`.
- Create `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульМенеджера.bsl`
  - YAML-side copy of existing XML fixture `Ext/ManagerModule.bsl`.
- Create `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/Команды/Команда1.bsl`
  - YAML-side copy of existing XML fixture `Commands/Команда1/Ext/CommandModule.bsl`.
- Modify `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
  - Add `recordSetModule` and `managerModule` properties.
- Modify `packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts`
  - Add direct import test with temporary object-level module files because the existing XML fixture lacks these two files.
- Modify `packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts`
  - Add direct sync test with temporary YAML/reference module files because the existing fixture lacks these two files.

## Task 1: Common Form Tests

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`

- [ ] **Step 1: Write failing tests for common form module import and sync**

Replace imports at the top of `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts` with:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it, vi } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { MetadataCommonFormRules } from "./rules"
```

Add helpers below `normalizeLineEndings`:

```ts
const name = "КонстантаВсеСвойства"

const createCommonFormTempFixture = async () => {
  const testDir = dirname(fileURLToPath(import.meta.url))
  const fixturesDir = join(testDir, "__fixtures__", "sync")
  const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "common-form-module-"))
  const inputDir = join(tmpDir, "xml")
  const yamlDir = join(tmpDir, "yaml")
  const outputDir = join(tmpDir, "out")
  const moduleText = "Процедура ПриСозданииНаСервере(Отказ, СтандартнаяОбработка)\nКонецПроцедуры\n"

  await fs.promises.cp(join(fixturesDir, "xml"), inputDir, { recursive: true })
  await fs.promises.cp(join(fixturesDir, "yaml"), yamlDir, { recursive: true })
  await fs.promises.mkdir(join(inputDir, name, "Ext", "Form"), { recursive: true })
  await fs.promises.writeFile(join(inputDir, name, "Ext", "Form", "Module.bsl"), moduleText)
  await fs.promises.writeFile(join(yamlDir, name, "Модуль.bsl"), moduleText)

  return { inputDir, yamlDir, outputDir, moduleText }
}
```

Add two tests inside the existing `describe` block:

```ts
  it("copies common form Module.bsl from XML to YAML", async () => {
    const { inputDir, outputDir, moduleText } = await createCommonFormTempFixture()

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(moduleText)
  })

  it("keeps common form Module.bsl during YAML to XML sync cleanup", async () => {
    const { inputDir, yamlDir, outputDir, moduleText } = await createCommonFormTempFixture()

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

    expect(fs.readFileSync(join(outputDir, name, "Ext", "Form", "Module.bsl"), "utf-8")).toBe(moduleText)
  })
```

- [ ] **Step 2: Run common form tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
```

Expected: the new tests fail because `Модуль.bsl` and `Ext/Form/Module.bsl` are not copied yet.

## Task 2: Common Form Rule

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/rules.ts`
- Test: `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`

- [ ] **Step 1: Add common form module rule**

In `MetadataCommonFormRules.properties`, add this property after `form`:

```ts
    module: {
      type: "Module",
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Form/Module.bsl",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 2: Run common form tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
```

Expected: all `metadataCommonForm/syncToXML.test.ts` tests pass.

- [ ] **Step 3: Commit common form module support**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataCommonForm/rules.ts packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts
git commit -m "fix: :bug: сохранять модуль общей формы"
```

## Task 3: Document Tests And YAML Module Fixtures

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульОбъекта.bsl`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульМенеджера.bsl`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/Команды/Команда1.bsl`

- [ ] **Step 1: Create YAML-side BSL fixtures by copying XML source-of-truth files**

Run:

```bash
mkdir -p packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/Команды
cp packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/xml/ДокументВсеСвойства/Ext/ObjectModule.bsl packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульОбъекта.bsl
cp packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/xml/ДокументВсеСвойства/Ext/ManagerModule.bsl packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульМенеджера.bsl
cp packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/xml/ДокументВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/Команды/Команда1.bsl
```

Expected: three YAML-side `.bsl` files are created byte-for-byte from existing XML fixtures. Do not edit XML fixtures.

- [ ] **Step 2: Extend document import test**

Replace `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts` with:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readDocumentYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocument", () => {
  const name = "ДокументВсеСвойства"

  it("читает Document из XML и пишет Свойства.yaml + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDocumentYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    const expectedObjectModule = fs.readFileSync(join(objectDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedCommandModule = fs.readFileSync(
      join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)
  })
})
```

- [ ] **Step 3: Extend document sync test**

Replace `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDocument", () => {
  it("читает Document из YAML и записывает XML + связанные модули", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentRules,
      name: "ДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ДокументВсеСвойства.xml",
        "ДокументВсеСвойства/Ext/AdditionalIndexes.xml",
        "ДокументВсеСвойства/Ext/ObjectModule.bsl",
        "ДокументВсеСвойства/Ext/ManagerModule.bsl",
        "ДокументВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
```

- [ ] **Step 4: Run document tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts
```

Expected: tests fail because document object, manager, and command modules are not wired through `MetadataDocumentRules` yet.

## Task 4: Document Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Test: `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts`

- [ ] **Step 1: Import command rules**

Add this import near the top of `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`:

```ts
import { MetadataCommandRules } from "../metadataCommand/rules"
```

- [ ] **Step 2: Add document command item rule**

Add this constant after `MetadataDocumentStandardAttributeNames`:

```ts
const MetadataDocumentCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name }: { name: string }) => `Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 3: Add document object and manager module properties**

In `MetadataDocumentRules.properties`, add these properties after `commands`:

```ts
    objectModule: {
      type: "Module",
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: "Ext/ObjectModule.bsl",
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 4: Register document child command traversal**

Add `childCollections` next to existing top-level rule options near `requiredXMLParents`:

```ts
  childCollections: [{ propertyKey: "commands", itemRule: MetadataDocumentCommandRules }],
```

The end of `MetadataDocumentRules` should contain:

```ts
  requiredXMLParents: [["ChildObjects"]],
  childCollections: [{ propertyKey: "commands", itemRule: MetadataDocumentCommandRules }],
  graphTerminals: ["ПустаяСсылка"],
} as const satisfies MetadataItemRule
```

- [ ] **Step 5: Run document tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts
```

Expected: both document tests pass.

- [ ] **Step 6: Commit document module support**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульОбъекта.bsl packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/МодульМенеджера.bsl packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/sync/yaml/ДокументВсеСвойства/Команды/Команда1.bsl
git commit -m "fix: :bug: сохранять модули документа"
```

## Task 5: Information Register Tests

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts`

- [ ] **Step 1: Extend information register import test with temporary object modules**

Replace the import block in `packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts` with:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { mockContextFromXML } from "~/tests/mockContext"
import { readInformationRegisterYAML } from "./__fixtures__/sync/data"
import { MetadataInformationRegisterRules } from "./rules"
```

Add this test inside the existing `describe` block:

```ts
  it("читает object-level модули регистра сведений из XML во временной фикстуре", async () => {
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixturesDir = join(testDir, "__fixtures__", "sync")
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "information-register-modules-"))
    const fixtureDir = join(tmpDir, "sync")
    const inputDir = join(fixtureDir, "xml")
    const outputDir = join(tmpDir, "out")
    const managerModule = "Процедура ОбработкаПолученияДанныхВыбора(ДанныеВыбора, Параметры, СтандартнаяОбработка)\nКонецПроцедуры\n"
    const recordSetModule = "Процедура ПередЗаписью(Отказ, Замещение)\nКонецПроцедуры\n"

    await fs.promises.cp(fixturesDir, fixtureDir, { recursive: true })
    await fs.promises.mkdir(join(inputDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(inputDir, name, "Ext", "ManagerModule.bsl"), managerModule)
    await fs.promises.writeFile(join(inputDir, name, "Ext", "RecordSetModule.bsl"), recordSetModule)

    await convertAppliedObjectFromXML({
      rule: MetadataInformationRegisterRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(managerModule)
    expect(fs.readFileSync(join(outputDir, name, "МодульНабораЗаписей.bsl"), "utf-8")).toBe(recordSetModule)
  })
```

- [ ] **Step 2: Extend information register sync test with temporary object modules**

Add these imports to `packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts`:

```ts
import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
```

Add this test inside the existing `describe` block:

```ts
  it("восстанавливает object-level модули регистра сведений при YAML to XML sync", async () => {
    const name = "РегистрСведенийВсеСвойстваНезависимый"
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixturesDir = join(testDir, "__fixtures__", "sync")
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "information-register-sync-modules-"))
    const inputDir = join(tmpDir, "yaml")
    const referenceDir = join(tmpDir, "xml")
    const outputDir = join(tmpDir, "out")
    const managerModule = "Процедура ОбработкаПолученияДанныхВыбора(ДанныеВыбора, Параметры, СтандартнаяОбработка)\nКонецПроцедуры\n"
    const recordSetModule = "Процедура ПередЗаписью(Отказ, Замещение)\nКонецПроцедуры\n"

    await fs.promises.cp(join(fixturesDir, "yaml"), inputDir, { recursive: true })
    await fs.promises.cp(join(fixturesDir, "xml"), referenceDir, { recursive: true })
    await fs.promises.writeFile(join(inputDir, name, "МодульМенеджера.bsl"), managerModule)
    await fs.promises.writeFile(join(inputDir, name, "МодульНабораЗаписей.bsl"), recordSetModule)
    await fs.promises.mkdir(join(referenceDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(referenceDir, name, "Ext", "ManagerModule.bsl"), managerModule)
    await fs.promises.writeFile(join(referenceDir, name, "Ext", "RecordSetModule.bsl"), recordSetModule)

    await syncAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(referenceDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "ManagerModule.bsl"), "utf-8")).toBe(managerModule)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "RecordSetModule.bsl"), "utf-8")).toBe(recordSetModule)
  })
```

- [ ] **Step 3: Run information register tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts
```

Expected: the new object-level module tests fail because `managerModule` and `recordSetModule` are not declared in `MetadataInformationRegisterRules` yet.

## Task 6: Information Register Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- Test: `packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts`

- [ ] **Step 1: Add information register object-level module rules**

In `MetadataInformationRegisterRules.properties`, add these properties after `commands`:

```ts
    recordSetModule: {
      type: "Module",
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 2: Run information register tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts
```

Expected: both information register test files pass.

- [ ] **Step 3: Commit information register module support**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts
git commit -m "fix: :bug: сохранять модули регистра сведений"
```

## Task 7: Focused Verification And Round-Trip Check

**Files:**
- No code changes expected.

- [ ] **Step 1: Run focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts packages/core/metadata/appliedObjects/metadataInformationRegister/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataInformationRegister/syncToXML.test.ts packages/core/metadata/commonObjects/module/syncExternal.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run type-check and record existing unrelated failures if they remain**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: either pass, or fail on the known existing form/type fixture errors unrelated to module rules. If it fails, copy the first few error filenames into the final report.

- [ ] **Step 3: Run YAML round-trip triage**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 6
```

Expected: the previous `CommonForms/.../Ext/Form/Module.bsl` deletion entries disappear from the 6-10 batch. Document and information-register module deletions should also be reduced or move below this batch if the same repository sample includes those objects.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended source, test, YAML-side `.bsl` fixture, and plan files are changed.

- [ ] **Step 5: Commit plan file if it was not committed before implementation**

Run:

```bash
git add docs/superpowers/plans/2026-05-20-metadata-module-rules.md
git commit -m "docs: :memo: описать план сохранения модулей"
```

Skip this commit only if the plan file was already committed before execution began.

## Self-Review

- Spec coverage: common form module rule, document object/manager/command modules, information register manager/record-set modules, focused sync tests, and `round-trip-yaml` verification are all covered.
- Placeholder scan: every code-changing step includes exact snippets or exact copy commands.
- Type consistency: rule keys match the agreed names: `module`, `objectModule`, `managerModule`, `recordSetModule`, and `commandModule`.
