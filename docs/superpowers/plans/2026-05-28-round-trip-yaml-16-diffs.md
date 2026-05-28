# Round-trip YAML 16 Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать согласованные round-trip-yaml расхождения, сохранив XML как источник истины и не меняя общую логику там, где расхождение признано ошибкой конкретной конфигурации.

**Architecture:** План разбит на независимые серии: диагностика `--all-configs`, локальная правка `Synonym` в коллекциях регистров, новый списочный формат `RootCommandInterface`, YAML-модель корневых `Ext/*`, known anomaly для ошибочных дублей кнопок и DCS `dateTime`. Каждая серия начинается с узкого красного теста, затем минимальная реализация, focused проверка и отдельный коммит.

**Tech Stack:** TypeScript, Vitest, pnpm, bash, существующий orchestration/rules.ts слой metadata, `.agents/skills/round-trip-yaml/round-trip.sh`.

---

## Scope Check

Spec покрывает несколько независимых причин. Их можно реализовать как один цикл работ на одной ветке, но только отдельными задачами и коммитами: каждая задача должна оставлять проект в рабочем состоянии и иметь собственные focused tests.

## File Structure

- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
  - Ответственность: сохранять diff-текст per-config до следующего `git restore`; фильтровать единственный известный допустимый diff по ошибочным дублям `ЕстьКЭП`/`НетКЭП`.
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/register.ts`
  - Ответственность: не удалять `source`-пустой `Synonym` у ресурсов регистров.
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/register.ts`
  - Ответственность: не удалять `source`-пустой `Synonym` у измерений регистров.
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`
  - Ответственность: зафиксировать корректное сохранение пустого `Synonym` для collection YAML.
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/types.ts`
  - Ответственность: заменить command visibility/placement YAML-формат с map на list entry types, сохранив внутреннюю модель удобной для XML.
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`
  - Ответственность: импорт/экспорт XML/YAML списков команд, merge с reference по индексу для повторов.
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/*.test.ts`
  - Ответственность: покрыть повторяющиеся `Command name="0"` и неизменность `xr:Common`.
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
  - Ответственность: подключить корневые `Help`, `Logo`, `StandaloneConfigurationContent` к YAML-модели корня.
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
  - Ответственность: проверить XML -> YAML для корневых `Ext/*`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
  - Ответственность: проверить YAML -> XML для корневых `Ext/*`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`
  - Ответственность: дать DCS `dateTime` собственный YAML import/export путь без переинтерпретации через общий `MetadataValue`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`
  - Ответственность: зафиксировать `01.01.0001 00:00:00` как `dateTime`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
  - Ответственность: зафиксировать XML `xsi:type="xs:dateTime"` для DCS даты.

---

### Task 1: Fix `round-trip-yaml --all-configs` Stored Diffs

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Write a failing shell smoke test manually**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 3 --start-index 1 >/private/tmp/rt-yaml-all-before.txt
rg -n "^diff --git|^=== TRIAGE_DIFF ===|^FILE:" /private/tmp/rt-yaml-all-before.txt
```

Expected before fix: some early `TRIAGE_DIFF` sections have `FILE:` but no following `diff --git` body because later configs restored the XML repo.

- [ ] **Step 2: Add stored diff arrays**

In `.agents/skills/round-trip-yaml/round-trip.sh`, near the existing arrays:

```bash
DIFF_FILES=()
DIFF_FILE_DIRS=()
DIFF_FILE_YAML_DIRS=()
DIFF_TEXTS=()
```

When collecting `CURRENT_DIFF_FILES`, append diff text immediately:

```bash
for diff_file in "${CURRENT_DIFF_FILES[@]}"; do
  diff_text="$(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --relative -- "${diff_file}")"
  DIFF_FILES+=("${diff_file}")
  DIFF_FILE_DIRS+=("${RUN_XML_DIR}")
  DIFF_FILE_YAML_DIRS+=("${RUN_YAML_DIR}")
  DIFF_TEXTS+=("${diff_text}")
done
```

- [ ] **Step 3: Print stored diff text**

Change `emit_single_diff` and `emit_triage_diff` signatures to receive stored text:

```bash
emit_single_diff() {
  local index="$1"
  local file="$2"
  local active_dir="$3"
  local yaml_dir="$4"
  local diff_text="$5"
  ...
  echo "=== FULL_DIFF ==="
  printf '%s\n' "${diff_text}"
}
```

```bash
emit_triage_diff() {
  local index="$1"
  local file="$2"
  local active_dir="$3"
  local yaml_dir="$4"
  local diff_text="$5"
  ...
  echo "--- DIFF ---"
  printf '%s\n' "${diff_text}"
}
```

At call sites, pass `DIFF_TEXTS[$((index - 1))]`.

- [ ] **Step 4: Verify all-config output keeps diff bodies**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 3 --start-index 1 >/private/tmp/rt-yaml-all-after.txt
rg -n "^diff --git|^=== TRIAGE_DIFF ===|^FILE:" /private/tmp/rt-yaml-all-after.txt
```

Expected: every printed triage diff in the requested range contains a `diff --git` body.

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh
git commit -m "fix: :bug: сохранять diff в round-trip-yaml all-configs"
```

---

### Task 2: Preserve Empty Register Field Synonyms From Source

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/register.ts`

- [ ] **Step 1: Write failing tests for resource and dimension collections**

Append to `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`:

```ts
import { MetadataRegisterResourceRules } from "../metadataRegisterResource/rules"
import "../metadataRegisterResource/register"

it("keeps empty source synonym for full YAML register resource collection", () => {
  const result = importPropertyFromYAML({
    context: mockContext,
    rule: { type: "MetadataRegisterResources" },
    value: {
      Содержание: {
        Тип: "Строка(100)",
      },
    },
    sourceValue: [
      {
        itemType: MetadataRegisterResourceRules.itemType,
        name: "Содержание",
        synonym: { items: {} },
      },
    ],
  })

  expect(result).toEqual([
    expect.objectContaining({
      itemType: MetadataRegisterResourceRules.itemType,
      name: "Содержание",
      synonym: { items: {} },
      type: expect.objectContaining({
        type: ["string"],
        stringQualifiers: expect.objectContaining({ length: 100 }),
      }),
    }),
  ])
})

it("keeps empty source synonym for full YAML register dimension collection", () => {
  const result = importPropertyFromYAML({
    context: mockContext,
    rule: { type: "MetadataRegisterDimensions" },
    value: {
      Организация: {
        Тип: "СправочникСсылка.Организации",
      },
    },
    sourceValue: [
      {
        itemType: MetadataRegisterDimensionRules.itemType,
        name: "Организация",
        synonym: { items: {} },
      },
    ],
  })

  expect(result).toEqual([
    expect.objectContaining({
      itemType: MetadataRegisterDimensionRules.itemType,
      name: "Организация",
      synonym: { items: {} },
    }),
  ])
})
```

- [ ] **Step 2: Run focused red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRegisterField/fromYAML.test.ts
```

Expected: the two new tests fail because `synonym` is missing.

- [ ] **Step 3: Remove the drop helper from register collections**

In `metadataRegisterResource/register.ts`, remove `dropImplicitEmptySynonym` and return imported properties directly:

```ts
return {
  ...properties,
  name,
}
```

Make the same change in `metadataRegisterDimension/register.ts`.

- [ ] **Step 4: Update the existing short YAML expectation**

In `metadataRegisterField/fromYAML.test.ts`, the current test `keeps empty source synonym for short YAML register dimension collection` intentionally expects `not.toHaveProperty("synonym")`. Change it to:

```ts
expect(result[0]).toHaveProperty("synonym", { items: {} })
```

- [ ] **Step 5: Run focused green**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRegisterField/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRegisterResource/register.ts packages/core/metadata/commonObjects/metadataRegisterDimension/register.ts
git commit -m "fix: :bug: сохранить пустой Synonym полей регистров"
```

---

### Task 3: Convert Root Command Interface Command Maps To Lists

**Files:**
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/types.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/toXML.test.ts`

- [ ] **Step 1: Add red tests for duplicate command visibility and placement**

In `fromXML.test.ts`, add:

```ts
it("imports duplicate command names as separate command visibility entries", () => {
  const result = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString: `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <CommandsVisibility>
    <Command name="0"><Visibility><xr:Common>false</xr:Common></Visibility></Command>
    <Command name="0"><Visibility><xr:Common>true</xr:Common></Visibility></Command>
  </CommandsVisibility>
  <CommandsPlacement>
    <Command name="0"><CommandGroup>NavigationPanelImportant</CommandGroup><Placement>Manual</Placement></Command>
    <Command name="0"><CommandGroup>ActionsPanelTools</CommandGroup><Placement>Auto</Placement></Command>
  </CommandsPlacement>
</CommandInterface>`,
  })

  expect(result?.commandsVisibility).toEqual([
    { command: "0", visibility: { common: false } },
    { command: "0", visibility: { common: true } },
  ])
  expect(result?.commandsPlacement).toEqual([
    { command: "0", commandGroup: "NavigationPanelImportant", placement: "Manual" },
    { command: "0", commandGroup: "ActionsPanelTools", placement: "Auto" },
  ])
})
```

- [ ] **Step 2: Add YAML red tests for list format**

In `toYAML.test.ts`, add:

```ts
it("exports duplicate command names as YAML lists", () => {
  const result = exportMetadataItemToYAML({
    context: mockContext,
    rule: RootCommandInterfaceRules,
    data: {
      itemType: "RootCommandInterface",
      commandsVisibility: [
        { command: "0", visibility: { common: false } },
        { command: "0", visibility: { common: true } },
      ],
      commandsPlacement: [
        { command: "0", commandGroup: "NavigationPanelImportant", placement: "Manual" },
        { command: "0", commandGroup: "ActionsPanelTools", placement: "Auto" },
      ],
    },
  })

  expect(result?.ВидимостьКоманд).toEqual([
    { Команда: "0", Общее: "Ложь" },
    { Команда: "0", Общее: "Истина" },
  ])
  expect(result?.РазмещениеКоманд).toEqual([
    { Команда: "0", ГруппаКоманд: "ПанельНавигацииВажное", Размещение: "Вручную" },
    { Команда: "0", ГруппаКоманд: "ПанельДействийСервис", Размещение: "Авто" },
  ])
})
```

- [ ] **Step 3: Update types from maps to lists**

In `types.ts`, replace command map aliases with list aliases:

```ts
export interface CommandInterfaceVisibilityItem {
  command: string
  visibility: CommandInterfaceVisibility
}

export type CommandInterfaceVisibilityMap = CommandInterfaceVisibilityItem[]

export interface CommandInterfacePlacementItem {
  command: string
  commandGroup?: CommandInterfaceCommandGroup
  placement?: CommandInterfacePlacement
}

export type CommandInterfacePlacementMap = CommandInterfacePlacementItem[]
```

Update YAML types:

```ts
export type CommandInterfaceVisibilityMapYAML = Array<{
  Команда: string
  Общее?: StringboolYAML
  Роли?: Record<string, StringboolYAML>
}>

export type CommandInterfacePlacementMapYAML = Array<{
  Команда: string
  ГруппаКоманд?: string
  Размещение?: string
}>
```

Update JSON schemas from `Type.Record(...)` to `Type.Array(Type.Object(...))`.

- [ ] **Step 4: Update XML import/export in `register.ts`**

Change `importVisibilityMapFromXML` to push list entries:

```ts
const result: CommandInterfaceVisibilityMap = []
for (const item of toArray(xml[itemKey])) {
  const name = getXMLName(item)
  const visibility = importVisibilityFromXML(context, item)
  if (name !== undefined && visibility !== undefined) result.push({ command: name, visibility })
}
return result.length > 0 ? result : undefined
```

Change `exportVisibilityMapToXML` to map list entries:

```ts
const items = visibilityMap.map(({ command, visibility }, index) => {
  const referenceItem = findReferenceXMLItemByNameAndIndex({ referenceMetadata, itemKey, name: command, index })
  ...
  return mergeXMLItemWithReference({
    referenceItem,
    name: command,
    knownValues: { Visibility: visibilityXML },
  }) as CommandInterfaceVisibilityXML
})
```

Add helper:

```ts
const findReferenceXMLItemByNameAndIndex = (params: {
  referenceMetadata: unknown
  itemKey: "Command" | "Subsystem"
  name: string
  index: number
}): Record<string, unknown> | undefined => {
  const raw = getReferenceRawXML(params.referenceMetadata)
  return toArray(raw?.[params.itemKey])
    .filter(isRecord)
    .filter((item) => getXMLName(item) === params.name)[params.index]
}
```

Make the same list conversion for placement.

- [ ] **Step 5: Update YAML import/export in `register.ts`**

For visibility YAML:

```ts
const result: CommandInterfaceVisibilityMap = []
for (const entry of yaml) {
  const item: CommandInterfaceVisibility = {}
  const common = importBooleanFromYAML(context, undefined, entry.Общее)
  if (common !== undefined) item.common = common
  ...
  if (Object.keys(item).length > 0) result.push({ command: entry.Команда, visibility: item })
}
return result.length > 0 ? result : undefined
```

For export:

```ts
return value.map(({ command, visibility }) => ({
  Команда: command,
  Общее: exportBooleanToYAML(context, undefined, visibility.common),
  Роли: exportRolesToYAML(context, visibility.roles),
}))
```

For placement:

```ts
return yaml.map((entry) => ({
  command: entry.Команда,
  commandGroup: entry.ГруппаКоманд !== undefined ? commandGroupFromYAML(entry.ГруппаКоманд) : undefined,
  placement: entry.Размещение !== undefined ? placementValueFromYAML(entry.Размещение) : undefined,
}))
```

- [ ] **Step 6: Update existing expectations**

Existing tests that expect:

```ts
commandsVisibility: {
  "Catalog.СправочникПолный.Command.ПоУмолчанию": { common: false }
}
```

should expect:

```ts
commandsVisibility: [
  {
    command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
    visibility: expect.objectContaining({ common: false }),
  },
]
```

Existing YAML expectations should use list entries:

```ts
ВидимостьКоманд: [
  {
    Команда: "Catalog.СправочникПолный.Command.ПоУмолчанию",
    Общее: "Ложь",
    Роли: {
      Администратор: "Ложь",
      РольВсеСвойства: "Истина",
    },
  },
]
```

- [ ] **Step 7: Run focused root command interface tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/rootCommandInterface
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/rootCommandInterface
git commit -m "fix: :bug: сохранить повторы RootCommandInterface"
```

---

### Task 4: Model Root Configuration External Files

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Extend existing XML -> YAML external files test**

In `convertFromXML.test.ts`, inside `сохраняет простые корневые внешние файлы конфигурации`, add source files:

```ts
fs.mkdirSync(join(rootInput, "Ext", "Help"), { recursive: true })
fs.mkdirSync(join(rootInput, "Ext", "Logo"), { recursive: true })
fs.writeFileSync(
  join(rootInput, "Ext", "Help.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>ru</Page>\n</Help>`,
  "utf-8"
)
fs.writeFileSync(join(rootInput, "Ext", "Help", "ru.html"), "<html>root help</html>", "utf-8")
fs.writeFileSync(join(rootInput, "Ext", "Logo.xml"), "<Logo/>", "utf-8")
fs.writeFileSync(join(rootInput, "Ext", "Logo", "Picture.png"), Buffer.from([137, 80, 78, 71]))
fs.writeFileSync(join(rootInput, "Ext", "StandaloneConfigurationContent.bin"), Buffer.from([1, 2, 3, 4]))
```

Add assertions:

```ts
expect(fs.readFileSync(join(rootOutput, "Справка", "ru.html"), "utf-8")).toBe("<html>root help</html>")
expect(fs.readFileSync(join(rootOutput, "Логотип", "Logo.xml"), "utf-8")).toBe("<Logo/>")
expect([...fs.readFileSync(join(rootOutput, "Логотип", "Picture.png"))]).toEqual([137, 80, 78, 71])
expect([...fs.readFileSync(join(rootOutput, "СодержимоеАвтономнойКонфигурации.bin"))]).toEqual([1, 2, 3, 4])
```

- [ ] **Step 2: Extend existing YAML -> XML external files test**

In `syncToXML.test.ts`, inside `сохраняет простые корневые внешние файлы конфигурации в XML`, add YAML files:

```ts
fs.mkdirSync(join(yamlDir, "Справка"), { recursive: true })
fs.mkdirSync(join(yamlDir, "Логотип"), { recursive: true })
fs.writeFileSync(join(yamlDir, "Справка", "ru.html"), "<html>root help</html>", "utf-8")
fs.writeFileSync(join(yamlDir, "Логотип", "Logo.xml"), "<Logo/>", "utf-8")
fs.writeFileSync(join(yamlDir, "Логотип", "Picture.png"), Buffer.from([137, 80, 78, 71]))
fs.writeFileSync(join(yamlDir, "СодержимоеАвтономнойКонфигурации.bin"), Buffer.from([1, 2, 3, 4]))
```

Add assertions:

```ts
expect(fs.readFileSync(join(outputDir, "Ext", "Help.xml"), "utf-8")).toContain("<Page>ru</Page>")
expect(fs.readFileSync(join(outputDir, "Ext", "Help", "ru.html"), "utf-8")).toBe("<html>root help</html>")
expect(fs.readFileSync(join(outputDir, "Ext", "Logo.xml"), "utf-8")).toBe("<Logo/>")
expect([...fs.readFileSync(join(outputDir, "Ext", "Logo", "Picture.png"))]).toEqual([137, 80, 78, 71])
expect([...fs.readFileSync(join(outputDir, "Ext", "StandaloneConfigurationContent.bin"))]).toEqual([1, 2, 3, 4])
```

- [ ] **Step 3: Run focused red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: failures for missing root `Справка`, `Логотип`, and `СодержимоеАвтономнойКонфигурации.bin`.

- [ ] **Step 4: Add root rules**

In `MetadataConfigurationRules.properties`, after `homePageWorkArea`, add:

```ts
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    },
    logo: {
      type: "ExternalPicture",
      nkdkDir: "Логотип",
      xmlPath: "Ext/Logo.xml",
      payloadXmlDir: "Ext/Logo",
      syncExternalOnly: true,
    },
    standaloneConfigurationContent: {
      type: "ExternalFile",
      nkdkPath: "СодержимоеАвтономнойКонфигурации.bin",
      xmlPath: "Ext/StandaloneConfigurationContent.bin",
      syncExternalOnly: true,
    },
```

- [ ] **Step 5: Run focused green**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "fix: :bug: синхронизировать корневые Ext файлы"
```

---

### Task 5: Keep DCS `dateTime` Owned By `DcsMetadataTypedValue`

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`

- [ ] **Step 1: Add red YAML import test**

Append to `fromYAML.test.ts`:

```ts
it("imports beginning date string as dateTime, not Field", () => {
  expect(
    testImportPropertyFromYAML({
      rule,
      value: "01.01.0001 00:00:00",
    })
  ).toEqual({ type: "dateTime", value: "0001-01-01T00:00:00" })
})
```

- [ ] **Step 2: Add XML export test**

Append to `toXML.test.ts`:

```ts
it("exports beginning date as xs:dateTime", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: { type: "dateTime", value: "0001-01-01T00:00:00" },
    xmlRootTag: "value",
  })

  expect(result).toEqual('<value xsi:type="xs:dateTime">0001-01-01T00:00:00</value>')
})
```

- [ ] **Step 3: Run focused red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: import test fails by producing `Field` or another non-dateTime value.

- [ ] **Step 4: Implement direct dateTime YAML conversion**

In `rules.ts`, add helpers near `PrimitiveDcsType`:

```ts
const yamlDateTimeToXMLDateTime = (value: string): string => {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/)
  if (!match) throw new Error(`DcsMetadataTypedValue YAML: invalid dateTime ${value}`)
  const [, day, month, year, hour = "00", minute = "00", second = "00"] = match
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

const xmlDateTimeToYAMLDateTime = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return value
  const [, year, month, day, hour, minute, second] = match
  return `${day}.${month}.${year} ${hour}:${minute}:${second}`
}
```

Change `dateTime` registry item:

```ts
  dateTime: {
    detect: ({ yaml }) => isStringYAML(yaml) && /^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/.test(yaml),
    fromYAML: ({ yaml }) => ({
      type: "dateTime",
      value: yamlDateTimeToXMLDateTime(String(yaml)),
    }),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "dateTime"),
    toYAML: ({ item }) => xmlDateTimeToYAMLDateTime((item as Extract<DcsMetadataTypedValue, { type: "dateTime" }>).value),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "dateTime"),
  },
```

- [ ] **Step 5: Run focused green**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
git commit -m "fix: :bug: сохранить DCS dateTime при YAML импорте"
```

---

### Task 6: Filter Known Invalid Duplicate Buttons In Diagnostics

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Add known acceptable diff helper**

In `.agents/skills/round-trip-yaml/round-trip.sh`, after `preserve_reference_only_files`, add:

```bash
is_known_acceptable_yaml_diff() {
  local diff_file="$1"
  local diff_text="$2"

  if [ "${diff_file}" != "DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml" ]; then
    return 1
  fi

  printf '%s\n' "${diff_text}" | grep -q '<Button name="ЕстьКЭП" id="1314">' || return 1
  printf '%s\n' "${diff_text}" | grep -q '<Button name="НетКЭП" id="1316">' || return 1
  printf '%s\n' "${diff_text}" | grep -q '^+' && return 1
  return 0
}
```

- [ ] **Step 2: Use helper while collecting diffs**

In the loop from Task 1, before appending arrays:

```bash
diff_text="$(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --relative -- "${diff_file}")"
if is_known_acceptable_yaml_diff "${diff_file}" "${diff_text}"; then
  echo "[diff] Пропущен известный допустимый diff ошибочных дублей кнопок: ${diff_file}"
  continue
fi
DIFF_FILES+=("${diff_file}")
...
```

- [ ] **Step 3: Run small diagnostic**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/small ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200 >/private/tmp/rt-yaml-small-after-known-buttons.txt
rg -n "МастерФормированияЗаявкиНаПодключениеУпрощенное|ЕстьКЭП|НетКЭП" /private/tmp/rt-yaml-small-after-known-buttons.txt
```

Expected: no triage diff for the known duplicate button removal. If the file still appears, inspect whether unrelated hunks exist; do not suppress unrelated hunks.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh
git commit -m "fix: :bug: пропустить известный diff дублей кнопок"
```

---

### Task 7: Verification Across Round-trip YAML Configs

**Files:**
- No planned code changes.

- [ ] **Step 1: Run focused unit suites**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRegisterField/fromYAML.test.ts metadata/commonObjects/rootCommandInterface metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected: PASS.

- [ ] **Step 2: Run per-config diagnostics**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/doc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200 >/private/tmp/rt-yaml-doc-final.txt
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200 >/private/tmp/rt-yaml-erp-final.txt
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/small ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200 >/private/tmp/rt-yaml-small-final.txt
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200 >/private/tmp/rt-yaml-trade-final.txt
```

Expected: resolved groups no longer appear. If new diffs appear, record them separately; do not fold new unrelated causes into this plan.

- [ ] **Step 3: Run all-config diagnostic**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 200 >/private/tmp/rt-yaml-all-final.txt
rg -n "^=== DIFF_COUNT ===|^diff --git|^FILE:" /private/tmp/rt-yaml-all-final.txt
```

Expected: printed diffs have bodies; accepted duplicate button diff is absent.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Commit any verification-only doc update if needed**

If implementation notes were added to the plan, commit them:

```bash
git add docs/superpowers/plans/2026-05-28-round-trip-yaml-16-diffs.md
git commit -m "docs: :memo: обновить план round-trip-yaml проверок"
```

If no files changed, skip this step.

---

## Self-Review

- Spec coverage:
  - 1, 2, 6 covered by Task 2.
  - 3, 4, 7, 8 covered by Task 3.
  - 5, 10, 11, 12, 13, 15 covered by Task 4.
  - 9 covered by Task 6.
  - 14 covered by Task 5.
  - 16 covered by Task 1.
- Placeholder scan: no forbidden placeholder patterns.
- Type consistency: command visibility/placement list type is named through existing `CommandInterfaceVisibilityMap`/`CommandInterfacePlacementMap` aliases to keep rule names stable while YAML shape changes.
- Scope check: tasks are independent and can be committed separately.
