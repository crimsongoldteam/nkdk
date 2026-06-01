# Round Trip YAML All Remaining Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать оставшиеся смысловые XML diff в YAML round-trip для `/home/nikita/git/round-trip/all`.

**Architecture:** Каждое расхождение чинится в том месте, где уже живёт соответствующий договор: root configuration external files в правилах конфигурации, `AdditionalIndexes` в правилах последовательности, порядок `ChildObjects` в `childObjects.ts`, `SettingsFragment` в общем типе fragment-настроек, события формы в `clientApplicationForm/rules.ts`. YAML-формат не расширяем, кроме уже согласованных существующих ключей; XML-фикстуры проекта обновляем только для покрытия sync-сценариев.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata orchestration, YAML/XML sync CLI.

---

## File Structure

- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
  - Ответственность: canonical root external file paths for configuration. Change root `Ext/...` paths to lowercase `ext/...`.
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
  - Ответственность: import coverage for root configuration external files from lowercase `ext`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
  - Ответственность: sync coverage for root configuration external files written to lowercase `ext`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`
  - Ответственность: describe sequence `ДополнительныеИндексы` as external `Ext/AdditionalIndexes.xml`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`
  - Ответственность: verify sequence additional indexes import into YAML.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
  - Ответственность: verify sequence additional indexes are written back to `Ext/AdditionalIndexes.xml`.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/data.ts`
  - Ответственность: expected YAML string for sequence sync fixture.
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/Свойства.yaml`
  - Ответственность: YAML fixture used by sync test.
- Modify: `packages/core/metadata/appliedObjects/configuration/childObjects.ts`
  - Ответственность: standard order for root `Configuration.xml` `ChildObjects`.
- Modify: `packages/core/metadata/appliedObjects/configuration/childObjects.test.ts`
  - Ответственность: focused coverage for `WebSocketClient` ordering.
- Modify: `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`
  - Ответственность: preserve reference `xsi:nil` inside typed settings fragments when current YAML has an empty equivalent node.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
  - Ответственность: focused regression for `Settings xsi:type="pl:Planner"` with nested `<pl:value xsi:nil="true"/>`.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil.xml`
  - Ответственность: project XML fixture for nil planner settings.
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Ответственность: known form event mapping for `BeforeExecute`.
- Modify: `packages/core/metadata/appliedObjects/metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml`
  - Ответственность: project XML fixture should match corrected `all` fixture: one `ActivationProcessing`, one `BeforeExecute`.
- Modify or create: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
  - Ответственность: focused import/YAML coverage for `ПередВыполнением`.

## Task 1: Root configuration external files use lowercase `ext`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Write failing import test for lowercase `ext`**

In `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`, find the tests that currently create files under `join(rootInput, "Ext", ...)`. Add this focused test near the existing root external file import tests:

```ts
  it("импортирует корневые внешние файлы конфигурации из lowercase ext", async () => {
    const rootInput = mkdtempSync(join(tmpdir(), "configuration-xml-"))
    const outputDir = mkdtempSync(join(tmpdir(), "configuration-yaml-"))
    fs.copyFileSync(new URL("__fixtures__/Configuration.xml", import.meta.url), join(rootInput, "Configuration.xml"))
    fs.mkdirSync(join(rootInput, "ext"), { recursive: true })
    fs.writeFileSync(join(rootInput, "ext", "ManagedApplicationModule.bsl"), "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n", "utf-8")
    fs.writeFileSync(join(rootInput, "ext", "CommandInterface.xml"), "<CommandInterface/>", "utf-8")

    await convertConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: rootInput,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, "МодульПриложения.bsl"), "utf-8")).toBe(
      "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n"
    )
    expect(fs.readFileSync(join(outputDir, "КомандныйИнтерфейс.xml"), "utf-8")).toContain("<CommandInterface")
  })
```

If this file uses different helper names, adapt only the wrapper call and imports to the existing helpers in the file; keep the assertions and paths exactly lowercase `ext`.

- [ ] **Step 2: Write failing sync test for lowercase `ext` output**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, add a focused test near the existing root external sync tests:

```ts
  it("записывает корневые внешние файлы конфигурации в lowercase ext", async () => {
    const inputDir = mkdtempSync(join(tmpdir(), "configuration-yaml-"))
    const outDir = mkdtempSync(join(tmpdir(), "configuration-xml-"))
    fs.writeFileSync(join(inputDir, "Конфигурация.yaml"), "", "utf-8")
    fs.writeFileSync(join(inputDir, "МодульПриложения.bsl"), "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n", "utf-8")
    fs.writeFileSync(join(inputDir, "КомандныйИнтерфейс.xml"), "<CommandInterface/>", "utf-8")

    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir,
      outputDir: outDir,
    })

    expect(fs.readFileSync(join(outDir, "ext", "ManagedApplicationModule.bsl"), "utf-8")).toBe(
      "Процедура ПриЗапускеСистемы()\nКонецПроцедуры\n"
    )
    expect(fs.readFileSync(join(outDir, "ext", "CommandInterface.xml"), "utf-8")).toContain("<CommandInterface")
    expect(fs.existsSync(join(outDir, "Ext", "ManagedApplicationModule.bsl"))).toBe(false)
    expect(fs.existsSync(join(outDir, "Ext", "CommandInterface.xml"))).toBe(false)
  })
```

If the existing `syncConfigurationToXML` wrapper requires `referenceDir` or `configurationName`, mirror the nearest existing test and keep only these asserted paths.

- [ ] **Step 3: Run focused tests and confirm they fail**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected before implementation: at least one assertion fails because code reads or writes `Ext/...` instead of `ext/...`.

- [ ] **Step 4: Change root configuration external paths**

In `packages/core/metadata/appliedObjects/configuration/rules.ts`, change only root configuration paths from uppercase `Ext` to lowercase `ext`:

```ts
    managedApplicationModule: {
      type: "Module",
      nkdkPath: "МодульПриложения.bsl",
      xmlPath: "ext/ManagedApplicationModule.bsl",
      syncExternalOnly: true,
    },
    sessionModule: {
      type: "Module",
      nkdkPath: "МодульСеанса.bsl",
      xmlPath: "ext/SessionModule.bsl",
      syncExternalOnly: true,
    },
    externalConnectionModule: {
      type: "Module",
      nkdkPath: "МодульВнешнегоСоединения.bsl",
      xmlPath: "ext/ExternalConnectionModule.bsl",
      syncExternalOnly: true,
    },
    ordinaryApplicationModule: {
      type: "Module",
      nkdkPath: "МодульОбычногоПриложения.bsl",
      xmlPath: "ext/OrdinaryApplicationModule.bsl",
      syncExternalOnly: true,
    },
    commandInterface: {
      yaml: "КомандныйИнтерфейс",
      type: "RootCommandInterface",
      filePath: "ext/CommandInterface.xml",
    },
    mainSectionCommandInterface: {
      yaml: "КомандныйИнтерфейсОсновногоРаздела",
      type: "RootCommandInterface",
      filePath: "ext/MainSectionCommandInterface.xml",
    },
    clientApplicationInterface: {
      yaml: "ИнтерфейсКлиентскогоПриложения",
      type: "ClientApplicationInterface",
      filePath: "ext/ClientApplicationInterface.xml",
    },
    homePageWorkArea: {
      yaml: "РабочаяОбластьНачальнойСтраницы",
      type: "HomePageWorkArea",
      filePath: "ext/HomePageWorkArea.xml",
    },
    help: {
      type: "Help",
      filePath: "ext/Help.xml",
      nkdkDir: "Справка",
    },
```

Also change any other root configuration external paths in the same `MetadataConfigurationRules.properties` block that point to `Ext/...`, including `MobileClientSignature.bin`, root pictures, and related external files. Do not change `Ext/...` paths in non-root applied object rules.

- [ ] **Step 5: Update existing configuration tests from `Ext` to `ext`**

In `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts` and `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, update root configuration expectations such as:

```ts
join(rootInput, "Ext", "ClientApplicationInterface.xml")
join(outDir, "Ext", "HomePageWorkArea.xml")
join(outDir, "Ext", "ManagedApplicationModule.bsl")
```

to:

```ts
join(rootInput, "ext", "ClientApplicationInterface.xml")
join(outDir, "ext", "HomePageWorkArea.xml")
join(outDir, "ext", "ManagedApplicationModule.bsl")
```

Keep paths under child objects or applied objects unchanged.

- [ ] **Step 6: Run focused tests and confirm they pass**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit root ext change**

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "fix: :bug: использовать lowercase ext конфигурации"
```

## Task 2: Sequence `AdditionalIndexes.xml` participates in YAML sync

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/Свойства.yaml`

- [ ] **Step 1: Add failing expectations for sequence additional indexes**

In `packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`, after the existing module assertion, add:

```ts
    expect(yaml.result).toContain("ДополнительныеИндексы:")
    expect(yaml.result).toContain("Имя: Индекс1")
    expect(yaml.result).toContain("Таблица: Sequence.ПоследовательностьВсеПоля")
    expect(yaml.result).toContain("ИндексируемыеПоля:\n      - Recorder")
    expect(yaml.result).toContain("ДополнительныеПоля:\n      - Period")
```

In `packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`, change `expectedFiles` from:

```ts
      expectedFiles: ["ПоследовательностьВсеПоля.xml", "ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl"],
```

to:

```ts
      expectedFiles: [
        "ПоследовательностьВсеПоля.xml",
        "ПоследовательностьВсеПоля/Ext/AdditionalIndexes.xml",
        "ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl",
      ],
```

- [ ] **Step 2: Run sequence tests and confirm they fail**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/metadataSequence/convertFromXML.test.ts metadata/appliedObjects/metadataSequence/syncToXML.test.ts
```

Expected before implementation: FAIL because YAML lacks `ДополнительныеИндексы` and sync does not write `Ext/AdditionalIndexes.xml`.

- [ ] **Step 3: Make sequence additional indexes an external file**

In `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`, replace the current rule:

```ts
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      xmlParents: ["Properties"],
    },
```

with:

```ts
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      filePath: "Ext/AdditionalIndexes.xml",
    },
```

- [ ] **Step 4: Update sequence YAML fixtures**

In `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/data.ts`, insert this block after `РежимУправленияБлокировкойДанных: Автоматический`:

```yaml
ДополнительныеИндексы:
  - ДополнительныеПоля:
      - Period
    Имя: Индекс1
    ИндексируемыеПоля:
      - Recorder
    Таблица: Sequence.ПоследовательностьВсеПоля
```

In `packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/Свойства.yaml`, insert the same YAML block after `РежимУправленияБлокировкойДанных: Автоматический`.

- [ ] **Step 5: Run sequence tests and confirm they pass**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/metadataSequence/convertFromXML.test.ts metadata/appliedObjects/metadataSequence/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit sequence additional indexes change**

```bash
git add packages/core/metadata/appliedObjects/metadataSequence/rules.ts packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/data.ts packages/core/metadata/appliedObjects/metadataSequence/__fixtures__/sync/yaml/ПоследовательностьВсеПоля/Свойства.yaml
git commit -m "fix: :bug: синхронизировать индексы последовательности"
```

## Task 3: Configuration `WebSocketClient` order

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/childObjects.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/childObjects.test.ts`

- [ ] **Step 1: Add focused order test**

In `packages/core/metadata/appliedObjects/configuration/childObjects.test.ts`, add this test near the existing `STANDARD_CHILD_OBJECT_TYPE_ORDER` assertions:

```ts
  it("ставит WebSocketClient между WSReference и EventSubscription", () => {
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WSReference")).toBeLessThan(
      STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient")
    )
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient")).toBeLessThan(
      STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("EventSubscription")
    )
  })
```

- [ ] **Step 2: Run focused test and confirm it fails**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/childObjects.test.ts
```

Expected before implementation: FAIL because `WebSocketClient` is currently after `IntegrationService`.

- [ ] **Step 3: Move `WebSocketClient` in standard order**

In `packages/core/metadata/appliedObjects/configuration/childObjects.ts`, change this order:

```ts
  "HTTPService",
  "WSReference",
  "EventSubscription",
```

to:

```ts
  "HTTPService",
  "WSReference",
  "WebSocketClient",
  "EventSubscription",
```

Then remove the existing later `"WebSocketClient"` entry near the end after `"IntegrationService"`.

- [ ] **Step 4: Run focused test and confirm it passes**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/childObjects.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit WebSocket order change**

```bash
git add packages/core/metadata/appliedObjects/configuration/childObjects.ts packages/core/metadata/appliedObjects/configuration/childObjects.test.ts
git commit -m "fix: :bug: сохранить порядок websocket клиентов"
```

## Task 4: Preserve `xsi:nil` inside typed `SettingsFragment` from reference

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil.xml`

- [ ] **Step 1: Add failing export test for planner nil value**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`, add this test near `should export with empty settings`:

```ts
  it("restores nested xsi:nil in planner settings from reference", () => {
    const reference = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "formAttribute/plannerSettingsWithNil.xml",
      forReference: true,
    })

    const value = [
      {
        name: "Планировщик",
        id: "1",
        type: { type: ["Planner"] },
        planner: {
          "pl:value": {},
        },
      },
    ]

    const { result } = testExportPropertyToXML({
      rule: formAttributesRule,
      value,
      referenceMetadata: reference,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "formAttribute/plannerSettingsWithNil.xml",
    })

    expect(result).toContain('<pl:value xsi:nil="true"/>')
  })
```

If the fixture helper path prefix in this test file is `formAttributes/...` rather than `formAttribute/...`, use the exact existing prefix. The fixture file must live next to existing form attribute XML fixtures.

- [ ] **Step 2: Ensure XML fixture has nested planner nil**

Make sure `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil.xml` contains this shape:

```xml
<Attribute name="Планировщик" id="1">
	<Type>
		<v8:Type>pl:Planner</v8:Type>
	</Type>
	<Settings xsi:type="pl:Planner">
		<pl:value xsi:nil="true"/>
	</Settings>
</Attribute>
```

Keep existing namespaces in that fixture; do not remove required namespace declarations.

- [ ] **Step 3: Run focused test and confirm it fails**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected before implementation: FAIL because export produces `<pl:value/>` instead of `<pl:value xsi:nil="true"/>`.

- [ ] **Step 4: Implement reference nil restoration in SettingsFragment**

In `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`, add these helpers above `registerSettingsFragmentType`:

```ts
const isPlainSettingsObject = (value: unknown): value is SettingsFragment =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isNilMarker = (value: unknown): boolean => {
  if (!isPlainSettingsObject(value)) return false
  const nil = value["_xsi:nil"]
  return nil === true || nil === "true"
}

const isEmptySettingsObject = (value: unknown): boolean =>
  isPlainSettingsObject(value) &&
  Object.entries(value).every(([key, nestedValue]) => {
    if (key === "#text" && typeof nestedValue === "string" && nestedValue.trim().length === 0) return true
    return nestedValue === undefined
  })

const restoreReferenceNilMarkers = (value: unknown, reference: unknown): unknown => {
  if (isNilMarker(reference) && (value === undefined || isEmptySettingsObject(value))) {
    return { "_xsi:nil": true }
  }

  if (Array.isArray(value)) {
    const referenceItems = Array.isArray(reference) ? reference : []
    return value.map((item, index) => restoreReferenceNilMarkers(item, referenceItems[index]))
  }

  if (!isPlainSettingsObject(value)) return value

  const referenceObject = isPlainSettingsObject(reference) ? reference : {}
  const result: SettingsFragment = {}

  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = restoreReferenceNilMarkers(nestedValue, referenceObject[key])
  }

  for (const [key, referenceValue] of Object.entries(referenceObject)) {
    if (key in result) continue
    const restored = restoreReferenceNilMarkers(undefined, referenceValue)
    if (restored !== undefined) result[key] = restored
  }

  return result
}
```

Then change the registered `exportToXML` function from:

```ts
  registerTypeRule(propertyType, "exportToXML", (_context, _rule, value: TModel | undefined) => {
    if (value === undefined) return undefined
    return {
      ...canonicalAttributes,
      ...(expandEmptyElements(value) as SettingsFragment),
    }
  })
```

to:

```ts
  registerTypeRule(propertyType, "exportToXML", (_context, _rule, value: TModel | undefined, reference?: TModel) => {
    if (value === undefined) return undefined
    const restoredValue = restoreReferenceNilMarkers(value, reference)
    return {
      ...canonicalAttributes,
      ...(expandEmptyElements(restoredValue) as SettingsFragment),
    }
  })
```

- [ ] **Step 5: Run focused tests and confirm they pass**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit SettingsFragment nil change**

```bash
git add packages/core/metadata/forms/commonObjects/settingsFragment/types.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil.xml
git commit -m "fix: :bug: восстановить nil в настройках формы"
```

## Task 5: Known form event `BeforeExecute`

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml`

- [ ] **Step 1: Correct project task form fixture**

In `packages/core/metadata/appliedObjects/metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml`, remove the stale duplicate line:

```xml
		<Event name="ActivationProcessing">ОбработкаАктивизации</Event>
```

Keep this line:

```xml
		<Event name="ActivationProcessing">ОбработкаАктивации</Event>
```

Keep this line:

```xml
		<Event name="BeforeExecute">ПередВыполнением</Event>
```

- [ ] **Step 2: Add failing YAML export assertion for `ПередВыполнением`**

In `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`, add this assertion to an existing event import test or add a new focused test:

```ts
  it("экспортирует событие BeforeExecute в YAML как ПередВыполнением", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Events>
    <Event name="BeforeExecute">ПередВыполнением</Event>
  </Events>
</Form>`

    const yaml = convertClientApplicationFormXMLToYAMLForTest(xml)

    expect(yaml).toContain("События:\n  ПередВыполнением: ПередВыполнением")
  })
```

If this file already uses a helper with another name, use the existing helper used by nearby assertions around `События`. Do not introduce a new production helper just for the test.

- [ ] **Step 3: Run focused test and confirm it fails**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected before implementation: FAIL because YAML does not contain `ПередВыполнением`.

- [ ] **Step 4: Add known event mapping**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, inside `events.items`, add:

```ts
        beforeExecute: "ПередВыполнением",
```

Place it near other `before...` form events, for example after:

```ts
        beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
```

- [ ] **Step 5: Run focused tests and confirm they pass**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit form event change**

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataTask/__fixtures__/sync/xml/ЗадачаВсеСвойства/Forms/ФормаЗадачи/Ext/Form.xml
git commit -m "fix: :bug: добавить событие ПередВыполнением"
```

## Task 6: Full verification for `/home/nikita/git/round-trip/all`

**Files:**
- No source file changes expected.

- [ ] **Step 1: Run focused package tests for all touched areas**

Run:

```bash
pnpm --dir packages/core test:isolated metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts metadata/appliedObjects/configuration/childObjects.test.ts metadata/appliedObjects/metadataSequence/convertFromXML.test.ts metadata/appliedObjects/metadataSequence/syncToXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run real import for `all` into a clean temporary YAML directory**

Run:

```bash
pnpm --dir packages/cli dev import /home/nikita/git/round-trip/all /tmp/nkdk-roundtrip-all-final-yaml
```

Expected:

```text
Готово: 191 успешно, 0 с ошибкой
```

- [ ] **Step 3: Run real sync for `all` into a clean temporary XML directory**

Run:

```bash
pnpm --dir packages/cli dev sync /tmp/nkdk-roundtrip-all-final-yaml /tmp/nkdk-roundtrip-all-final-xml --reference /home/nikita/git/round-trip/all
```

Expected:

```text
Готово: 191 успешно, 0 с ошибкой
```

- [ ] **Step 4: Compare semantic XML output with normalized line endings**

Run:

```bash
python3 - <<'PY'
from pathlib import Path

src = Path('/home/nikita/git/round-trip/all')
dst = Path('/tmp/nkdk-roundtrip-all-final-xml')
missing = []
extra = []
diffs = []

for p in src.rglob('*'):
    if p.is_dir():
        continue
    rel = p.relative_to(src)
    q = dst / rel
    if not q.exists():
        missing.append(str(rel))
        continue
    a = p.read_bytes().replace(b'\r\n', b'\n')
    b = q.read_bytes().replace(b'\r\n', b'\n')
    if a != b:
        diffs.append(str(rel))

for q in dst.rglob('*'):
    if q.is_dir():
        continue
    rel = q.relative_to(dst)
    if not (src / rel).exists():
        extra.append(str(rel))

print('diffs', len(diffs))
for item in diffs:
    print('DIFF', item)
print('missing', len(missing))
for item in missing:
    print('MISSING', item)
print('extra', len(extra))
for item in extra:
    print('EXTRA', item)
PY
```

Expected after implementation:

```text
diffs 0
missing 0
extra 1
EXTRA .nakidka-migrations.yaml
```

If `.nakidka-migrations.yaml` is considered expected CLI output, leave it. If project policy requires no extra files in XML output, ask before changing migration behavior.

- [ ] **Step 5: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 6: Commit verification-only adjustments if any**

If no files changed during verification, do not create a commit. If test expectation files changed during verification, commit only those files:

```bash
git add <changed-test-or-fixture-files>
git commit -m "test: :white_check_mark: обновить проверки all round-trip"
```

## Self-Review

- Spec coverage:
  - `2026-05-31-root-ext-lowercase-design.md` covered by Task 1.
  - `2026-05-31-sequence-additional-indexes-file-design.md` covered by Task 2.
  - `2026-05-31-configuration-websocket-child-order-design.md` covered by Task 3.
  - `2026-05-31-settings-fragment-reference-nil-design.md` covered by Task 4.
  - `2026-06-01-task-form-events-design.md` covered by Task 5.
- Placeholder scan: no forbidden placeholder wording or unspecified implementation steps remain.
- Type consistency:
  - `beforeExecute` matches the lowercase key produced by `importEventsFromXML`.
  - `filePath: "Ext/AdditionalIndexes.xml"` matches neighboring applied object rules.
  - root `ext/...` changes are limited to `MetadataConfigurationRules`.
  - `restoreReferenceNilMarkers` accepts unknown values and returns XML-ready fragment data before `expandEmptyElements`.
