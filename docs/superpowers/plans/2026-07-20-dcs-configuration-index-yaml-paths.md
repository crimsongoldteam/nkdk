# DCS Configuration Index YAML Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать адресацию DCS-данных в файле индекса конфигурации по полному YAML-пути, чтобы импорт ERP не падал на конфликтах `Свойство.Поля`, `Свойство.Отбор`, `Свойство.Элементы`.

**Architecture:** В индексный контекст fromXML добавляется режим DCS YAML-path. В этом режиме свойства и элементы коллекций добавляют к текущему адресу YAML-сегменты напрямую: `Отбор`, `Элементы[0]`, `Поле`, без смысловых ключей и без хранения полного XML. Режим включается декларативно через правила DCS-типов, а общий orchestration-слой остаётся независимым от конкретных DCS-объектов.

**Tech Stack:** TypeScript, Vitest, существующий metadata orchestration, `ConfigurationIndexCollector`, XML/YAML правила в `packages/core/metadata/commonObjects/dataCompositionSystem`.

## Global Constraints

- DCS-часть индекса конфигурации адресуется по полному YAML-пути.
- Объектные YAML-свойства добавляют сегмент с именем свойства.
- Элементы YAML-массивов добавляют позиционный сегмент `[0]`, `[1]`, `[2]`.
- Элементы YAML-словарей добавляют сегмент с YAML-ключом.
- Для DCS не пытаемся искать смысловой ключ, если путь уже можно построить по YAML-структуре.
- `UserSettingsID` в DCS не хранится в индексе: он хранится в YAML как UID-строка.
- `uuid` для DCS не предусматривается.
- Не менять XML-фикстуры: они остаются источником истины.
- Не добавлять частные условия по DCS в `metadata/orchestration`, `metadata/validation`, `metadata/project`; общий слой работает через нейтральный договор правила.

---

## File Structure

- Modify: `packages/core/metadata/configurationIndex/logicalAddress.ts`  
  Добавить безопасные helper-функции для YAML-path сегментов индекса: свойство, ключ словаря, индекс массива.

- Modify: `packages/core/metadata/configurationIndex/logicalAddress.test.ts`  
  Покрыть формат адресов `Отбор.Элементы[0].Поле` и валидацию индекса массива.

- Modify: `packages/core/metadata/configurationIndex/collector/context.ts`  
  Добавить флаг режима YAML-path и функции входа в YAML-свойство / YAML-элемент коллекции.

- Modify: `packages/core/metadata/configurationIndex/collector/collectProperty.ts`  
  Принимать уже вычисленный logicalAddress свойства для XML-служебных значений.

- Modify: `packages/core/metadata/orchestration/property/types.ts`  
  Добавить нейтральный параметр правила `configurationIndexAddressing?: "default" | "yamlPath"`.

- Modify: `packages/core/metadata/orchestration/property/fromXML.ts`  
  При входе в свойство использовать YAML-path адресацию, если режим включён текущим правилом или уже активен в контексте.

- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`  
  Передавать режим адресации из регистрации коллекции в `importMetadataItemCollectionFromXML`.

- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXML.ts`  
  Для коллекций в YAML-path режиме адресовать элементы как `[index]` для массивов и как YAML-ключ для словарей.

- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`  
  Проверить, что новая настройка регистрации коллекции прокидывается в импорт и не ломает существующие именованные коллекции.

- Modify: DCS registration/builders files under `packages/core/metadata/commonObjects/dataCompositionSystem/**`  
  Включить `configurationIndexAddressing: "yamlPath"` только в DCS-правилах, где импорт может собирать XML-служебные данные индекса.

- Test: DCS fixture tests in:
  - `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
  - `packages/core/metadata/importFromXml/importConfiguration.test.ts`

---

### Task 1: Add YAML-path logical address helpers

**Files:**
- Modify: `packages/core/metadata/configurationIndex/logicalAddress.ts`
- Test: `packages/core/metadata/configurationIndex/logicalAddress.test.ts`

**Interfaces:**
- Produces:
  - `yamlPropertyUid(parent: string, propertyName: string): string`
  - `yamlKeyUid(parent: string, key: string): string`
  - `yamlIndexUid(parent: string, index: number): string`
- Consumes: existing `address()` and `segment()` validation style from `logicalAddress.ts`.

- [ ] **Step 1: Write failing tests for YAML-path address helpers**

Add these tests to `packages/core/metadata/configurationIndex/logicalAddress.test.ts`:

```ts
import { childUid, configurationUid, indexedUid, metadataItemUid, yamlIndexUid, yamlKeyUid, yamlPropertyUid } from "./logicalAddress"

it("builds DCS YAML-path property and collection addresses", () => {
  const owner = "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор"

  expect(yamlPropertyUid(owner, "Элементы")).toBe(
    "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы"
  )
  expect(yamlIndexUid(yamlPropertyUid(owner, "Элементы"), 0)).toBe(
    "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы[0]"
  )
  expect(yamlPropertyUid(yamlIndexUid(yamlPropertyUid(owner, "Элементы"), 0), "Поле")).toBe(
    "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы[0].Поле"
  )
  expect(yamlKeyUid(yamlPropertyUid(owner, "Параметры"), "Период")).toBe(
    "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Параметры.Период"
  )
})

it("rejects invalid DCS YAML-path array index", () => {
  expect(() => yamlIndexUid("Справочник.Товары", -1)).toThrow("Некорректный индекс logicalAddress")
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/logicalAddress.test.ts --reporter dot
```

Expected: FAIL with TypeScript/runtime error that `yamlIndexUid`, `yamlKeyUid`, or `yamlPropertyUid` is not exported.

- [ ] **Step 3: Implement minimal helpers**

Update `packages/core/metadata/configurationIndex/logicalAddress.ts`:

```ts
export function yamlPropertyUid(parent: string, propertyName: string): string {
  return `${address(parent)}.${segment(propertyName)}`
}

export function yamlKeyUid(parent: string, key: string): string {
  return `${address(parent)}.${segment(key)}`
}

export function yamlIndexUid(parent: string, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error("Некорректный индекс logicalAddress")
  return `${address(parent)}[${index}]`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/logicalAddress.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/configurationIndex/logicalAddress.ts packages/core/metadata/configurationIndex/logicalAddress.test.ts
git commit -m "feat: :sparkles: добавить адреса YAML-пути индекса"
```

---

### Task 2: Add neutral YAML-path mode to configuration index context

**Files:**
- Modify: `packages/core/metadata/configurationIndex/collector/context.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/collectProperty.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Test: `packages/core/metadata/orchestration/property/fromXML.test.ts`

**Interfaces:**
- Consumes:
  - `yamlPropertyUid(parent, propertyName)` from Task 1.
- Produces:
  - `ConfigurationIndexAddressingMode = "default" | "yamlPath"`
  - `configurationIndexAddressing?: ConfigurationIndexAddressingMode` on `PropertyRule`
  - `yamlPathAddressing?: true` in `ConfigurationIndexCollectionContext`
  - `getConfigurationIndexPropertyLogicalAddress(collection, propertyName, mode): string`
  - `runWithConfigurationIndexPropertyContext(context, propertyName, childCollectionUidSegment, run, options?)`
  - `options.configurationIndexAddressing?: ConfigurationIndexAddressingMode`

- [ ] **Step 1: Write failing test for nested YAML-path properties**

Add this test to `packages/core/metadata/orchestration/property/fromXML.test.ts`:

```ts
it("uses direct YAML-path address for XML service data while YAML-path index addressing is active", () => {
  const collector = createConfigurationIndexCollector()
  const context = withConfigurationIndexCollector(createContext(), collector, "Справочник.Товары.Свойство.Отбор")
  const rule = {
    itemType: "FilterLike",
    properties: {
      sourceValue: {
        type: "MetadataValue",
        xml: "SourceValue",
        yaml: "Значение",
        configurationIndexAddressing: "yamlPath",
      },
    },
  } as any

  importPropertiesFromXML({
    context,
    rule,
    xml: { SourceValue: { "_xsi:nil": true } },
  })

  expect(collector.fragment("Форма.yaml").xmlValues).toEqual([
    { logicalAddress: "Справочник.Товары.Свойство.Отбор.Значение", xsiNil: true },
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXML.test.ts --reporter dot
```

Expected: FAIL because `configurationIndexAddressing` is not supported and `xsi:nil` is still collected at `Справочник.Товары.Свойство.Отбор.sourceValue`.

- [ ] **Step 3: Extend types and context**

Update `packages/core/metadata/orchestration/property/types.ts`:

```ts
export type ConfigurationIndexAddressingMode = "default" | "yamlPath"
```

Add to `PropertyRule`:

```ts
configurationIndexAddressing?: ConfigurationIndexAddressingMode
```

Update `packages/core/metadata/configurationIndex/collector/context.ts`:

```ts
import { childUid, yamlPropertyUid } from "../logicalAddress"

export type ConfigurationIndexAddressingMode = "default" | "yamlPath"

export interface ConfigurationIndexCollectionContext {
  readonly collector: ConfigurationIndexCollector
  readonly logicalAddress: string
  readonly xmlNodeLogicalAddress?: string
  readonly childCollectionUidSegment?: string
  readonly yamlPathAddressing?: true
}
```

Add the property-address helper:

```ts
export function getConfigurationIndexPropertyLogicalAddress(
  collection: ConfigurationIndexCollectionContext,
  propertyName: string,
  mode: ConfigurationIndexAddressingMode | undefined
): string {
  const useYamlPath = collection.yamlPathAddressing === true || mode === "yamlPath"
  return useYamlPath
    ? yamlPropertyUid(collection.logicalAddress, propertyName)
    : childUid(collection.logicalAddress, "Свойство", propertyName)
}
```

Change `runWithConfigurationIndexPropertyContext` signature:

```ts
export function runWithConfigurationIndexPropertyContext<T>(
  context: ConfigurationContextFromXML,
  propertyName: string,
  childCollectionUidSegment: string | undefined,
  run: (context: ConfigurationContextFromXML) => T,
  options: { configurationIndexAddressing?: ConfigurationIndexAddressingMode } = {}
): T
```

Inside the function compute:

```ts
const useYamlPath = collection.yamlPathAddressing === true || options.configurationIndexAddressing === "yamlPath"
const propertyAddress = getConfigurationIndexPropertyLogicalAddress(
  collection,
  propertyName,
  options.configurationIndexAddressing
)
```

Then set both `logicalAddress` and `xmlNodeLogicalAddress` to `propertyAddress`:

```ts
context.fromXML.configurationIndex = {
  ...collection,
  logicalAddress: propertyAddress,
  xmlNodeLogicalAddress: propertyAddress,
  ...(useYamlPath ? { yamlPathAddressing: true as const } : {}),
  ...(childCollectionUidSegment === undefined ? {} : { childCollectionUidSegment }),
}
```

- [ ] **Step 4: Pass the mode from property import**

Update the call in `packages/core/metadata/orchestration/property/fromXML.ts`:

```ts
const propertyLogicalAddress =
  indexCollection === undefined
    ? undefined
    : getConfigurationIndexPropertyLogicalAddress(
        indexCollection,
        currentRule.yaml ?? key,
        currentRule.configurationIndexAddressing
      )
```

Pass this address into XML-service collectors:

```ts
collectConfigurationIndexPropertyFromXML({
  context,
  logicalAddress: propertyLogicalAddress,
  propertyKey: key,
  xmlValue,
  rule: currentRule,
  descriptor: getTypeRule(currentRule.type, "configurationIndexValueFromXML"),
})

collectConfigurationIndexImportedValue({
  context,
  logicalAddress: propertyLogicalAddress,
  propertyKey: key,
  importedValue: valueOrDefault,
})
```

Update `packages/core/metadata/configurationIndex/collector/collectProperty.ts`:

```ts
export function collectConfigurationIndexPropertyFromXML(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  xmlValue: unknown
  rule: PropertyRule
  descriptor?: ConfigurationIndexValueFromXMLDescriptor
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return

  const address = params.logicalAddress ?? `${collection.logicalAddress}.${params.propertyKey}`
  // existing body keeps using address
}

export function collectConfigurationIndexImportedValue(params: {
  context: ConfigurationContextFromXML
  logicalAddress?: string
  propertyKey: string
  importedValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || !isRecord(params.importedValue)) return

  const address = params.logicalAddress ?? `${collection.logicalAddress}.${params.propertyKey}`
  // existing body keeps using address
}
```

Then update `runWithConfigurationIndexPropertyContext` call:

```ts
runWithConfigurationIndexPropertyContext(
  context,
  currentRule.yaml ?? key,
  configurationIndexUidSegment,
  (propertyContext) =>
    importPropertyFromXML({
      context: propertyContext,
      rule: currentRule,
      value: xmlValue,
      name: key,
      ownerXmlName,
    }),
  { configurationIndexAddressing: currentRule.configurationIndexAddressing }
)
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXML.test.ts metadata/configurationIndex/logicalAddress.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/configurationIndex/collector/context.ts packages/core/metadata/configurationIndex/collector/collectProperty.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/fromXML.ts packages/core/metadata/orchestration/property/fromXML.test.ts
git commit -m "feat: :sparkles: добавить режим YAML-пути для индекса"
```

---

### Task 3: Address metadata-item collections by YAML path

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXML.ts`
- Test: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`

**Interfaces:**
- Consumes:
  - `yamlIndexUid(parent, index)` from Task 1.
  - `yamlKeyUid(parent, key)` from Task 1.
  - `yamlPathAddressing?: true` from Task 2.
- Produces:
  - Collection option `yamlAsArray?: true` passed to `importMetadataItemCollectionFromXML`.
  - Collection option `configurationIndexAddressing?: ConfigurationIndexAddressingMode` accepted by `registerMetadataItemCollectionRule`.
  - YAML-path collection item address:
    - array: `yamlIndexUid(collection.logicalAddress, index)`
    - record: `yamlKeyUid(collection.logicalAddress, itemName)`

- [ ] **Step 1: Write failing collection test**

Add this test to `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`:

```ts
registerMetadataItemCollectionRule({
  propertyType: "TestYamlPathArrayCollection" as any,
  itemRule: TestCollectionItemRules,
  xmlElement: "Item",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})

const yamlPathArrayRule: PropertyRule = { type: "TestYamlPathArrayCollection" as any, yaml: "Элементы" }

it("addresses YAML-path array collection items by position", () => {
  const collector = createConfigurationIndexCollector()
  const context = withConfigurationIndexCollector(
    mockContextFromXML({ forReference: true }),
    collector,
    "Справочник.Товары.Свойство.Отбор.Элементы"
  )

  const imported = importPropertyFromXML({
    context,
    rule: yamlPathArrayRule,
    value: {
      Item: [{ Name: "Первый", Value: "one" }, { Name: "Второй", Value: "two" }],
    },
  })

  expect(imported).toHaveLength(2)
  expect(collector.fragment("Форма.yaml").xmlNodes.map((node) => node.logicalAddress)).toContain(
    "Справочник.Товары.Свойство.Отбор.Элементы[0]"
  )
  expect(collector.fragment("Форма.yaml").xmlNodes.map((node) => node.logicalAddress)).toContain(
    "Справочник.Товары.Свойство.Отбор.Элементы[1]"
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts --reporter dot
```

Expected: FAIL because `yamlAsArray` is not accepted by `importMetadataItemCollectionFromXML` options or collection items are still addressed by existing default behavior.

- [ ] **Step 3: Extend collection import options**

Update `packages/core/metadata/orchestration/metadataCollection/fromXML.ts` option type:

```ts
options?: {
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}
```

Import YAML helpers:

```ts
import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
```

Update `configurationIndexItemContext`:

```ts
const uidSegment = registeredUidSegment ?? collection.childCollectionUidSegment
const useYamlPath = collection.yamlPathAddressing === true || options?.configurationIndexAddressing === "yamlPath"

if (useYamlPath) {
  if (options?.yamlAsArray === true || itemName === undefined) {
    return withConfigurationIndexLogicalAddress(context, yamlIndexUid(collection.logicalAddress, index))
  }
  return withConfigurationIndexLogicalAddress(context, yamlKeyUid(collection.logicalAddress, itemName))
}

if (uidSegment === undefined) return context
```

Keep the existing named-collection behavior below this block unchanged.

- [ ] **Step 4: Pass `yamlAsArray` and addressing mode from registration**

Update `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`:

```ts
type CollectionRule<Rule extends MetadataItemRule, CollectionType extends PropertyRuleType, XMLKey extends string> = {
  // keep existing fields
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
}

const options = {
  propertyType,
  configurationIndexUidSegment: params.configurationIndexUidSegment,
  configurationIndexAddressing: params.configurationIndexAddressing,
  ...(params.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts metadata/orchestration/property/fromXML.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/metadataCollection/fromXML.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts
git commit -m "feat: :sparkles: адресовать коллекции по YAML-пути"
```

---

### Task 4: Enable YAML-path addressing for DCS rules

**Files:**
- Modify: DCS builder/type files that create rules for:
  - `FilterItem`
  - `ConditionalAppearanceItems`
  - `OrderItemFields`
  - `DataSetFieldFields`
  - `DCSParameters`
  - `AvailableFields`
  - `DcsAvailableValues`
  - `AppearanceFields`
  - `SettingsParameterValueCollection`
  - `StructureItemGroup`
  - `StructureItemGroupCollection`
- Test:
  - `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromXML.test.ts`

**Interfaces:**
- Consumes:
  - `configurationIndexAddressing: "yamlPath"` property rule option from Task 2.
  - `yamlAsArray` collection behavior from Task 3.
- Produces:
  - DCS rules opt into YAML-path addressing declaratively, without DCS checks in orchestration.

- [ ] **Step 1: Write failing DCS filter item index test**

Add to `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`:

```ts
it("writes XML service data for filter items under YAML-path addresses", () => {
  const collector = createConfigurationIndexCollector()
  const context = withConfigurationIndexCollector(
    mockContextFromXML({ forReference: true }),
    collector,
    "Справочник.Товары.Свойство.Отбор"
  )

  importPropertyFromXML({
    context,
    rule: { type: "FilterItem", xml: "dcsset:item", yaml: "Элементы", configurationIndexAddressing: "yamlPath" },
    value: [
      {
        "_xsi:type": "dcsset:FilterItemComparison",
        "dcsset:leftValue": { "_xsi:type": "dcscor:Field", "#text": "Список.Номенклатура" },
      },
      {
        "_xsi:type": "dcsset:FilterItemGroup",
        "dcsset:items": {
          "dcsset:item": {
            "_xsi:type": "dcsset:FilterItemComparison",
            "dcsset:leftValue": { "_xsi:type": "dcscor:Field", "#text": "Список.Количество" },
          },
        },
      },
    ],
    name: "items",
  })

  const fragment = collector.fragment("Форма.yaml")
  expect(fragment.xmlValues.map((value) => value.logicalAddress)).toEqual(
    expect.arrayContaining([
      "Справочник.Товары.Свойство.Отбор.Элементы[0].ЛевоеЗначение",
      "Справочник.Товары.Свойство.Отбор.Элементы[1].Элементы[0].ЛевоеЗначение",
    ])
  )
})
```

The assertion checks the concrete YAML name `ЛевоеЗначение` from `FilterItemComparisonRules`, not only absence of conflict.

- [ ] **Step 2: Run the DCS test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts --reporter dot
```

Expected: FAIL because nested filter items still collect index data at shared addresses.

- [ ] **Step 3: Mark DCS collection/property rules with YAML-path addressing**

Apply these edits where each rule builder or registration exists:

```ts
configurationIndexAddressing: "yamlPath",
```

For direct `registerMetadataItemCollectionRule` registrations that are always DCS arrays, add:

```ts
configurationIndexAddressing: "yamlPath",
```

If `CollectionRule` does not yet accept this field, extend it:

```ts
configurationIndexAddressing?: ConfigurationIndexAddressingMode
```

And pass it into `importMetadataItemCollectionFromXML` options:

```ts
configurationIndexAddressing: params.configurationIndexAddressing,
```

DCS files to inspect and update:

```text
packages/core/metadata/commonObjects/dataCompositionSystem/filter/builders.ts
packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/builders.ts
packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/order/builders.ts
packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/availableFields/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/builders.ts
packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/builders.ts
packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection/types.ts
```

- [ ] **Step 4: Add targeted tests for `Поля` and `Элементы`**

Add one assertion to `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts` that imports two fields and expects addresses:

```ts
expect(fragment.xmlNodes.map((node) => node.logicalAddress)).toEqual(
  expect.arrayContaining([
    expect.stringContaining(".Поля[0]"),
    expect.stringContaining(".Поля[1]"),
  ])
)
```

Add one assertion to `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromXML.test.ts` that imports two conditional appearance items and expects:

```ts
expect(fragment.xmlNodes.map((node) => node.logicalAddress)).toEqual(
  expect.arrayContaining([
    expect.stringContaining(".Элементы[0]"),
    expect.stringContaining(".Элементы[1]"),
  ])
)
```

- [ ] **Step 5: Run targeted DCS tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromXML.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/fromXML.ts packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: включить YAML-пути индекса для DCS"
```

---

### Task 5: Verify ERP import conflicts and regression suite

**Files:**
- Modify: only tests if a missing assertion is discovered.
- Test: CLI import command against `/Users/nikita/git/round-trip/cf/erp` into `/Users/nikita/git/nkdk-yaml/cf`.

**Interfaces:**
- Consumes:
  - All implementation from Tasks 1-4.
- Produces:
  - Evidence that conflicts `Свойство.Поля`, `Свойство.Отбор`, `Свойство.Элементы` are gone or a concrete next conflict family is identified.

- [ ] **Step 1: Run focused type-check**

Run:

```bash
pnpm --filter @nkdk/core run type-check
```

Expected: PASS.

- [ ] **Step 2: Run focused index/import tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex metadata/orchestration/property/fromXML.test.ts metadata/orchestration/metadataCollection/ruleFactory.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromXML.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 3: Run ERP import with four workers and capture time/memory**

Run:

```bash
/usr/bin/time -l pnpm --filter @nkdk/core exec tsx -e 'import { syncConfigurationFromXML } from "./metadata/appliedObjects/configuration/convertFromXML"; const context = { defaultLanguage: "ru", version: "2.20", exportToYAML: { toTyped: false }, fromXML: { forReference: false } }; const result = await syncConfigurationFromXML({ context, inputDir: "/Users/nikita/git/round-trip/cf/erp", outputDir: "/Users/nikita/git/nkdk-yaml/cf", concurrency: 4, transferConcurrency: 4, hashConcurrency: 4, operationId: "erp-dcs-yaml-path-check" }); const firstFailures = result.failed.slice(0, 20).map((failure) => ({ code: failure.code, sourcePath: failure.sourcePath, targetProjectPath: failure.targetProjectPath, message: failure.message })); console.log(JSON.stringify({ succeeded: result.succeeded, failed: result.failed.length, warnings: result.warnings.length, preservedTempRoot: result.preservedTempRoot, firstFailures }, null, 2)); if (result.failed.length > 0) process.exitCode = 1;'
```

Expected:

```text
hasWebServiceConflict: false
hasUserSettingIdConflict: false
```

And no conflicts whose logical address contains:

```text
Свойство.Поля
Свойство.Отбор
Свойство.Элементы
```

If import still fails, copy the first 20 conflict logical addresses into the task notes and classify the next family before changing code.

- [ ] **Step 4: Run full tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Commit verification-only test fixes if any were needed**

If Step 4 required test-only changes, commit them:

```bash
git add packages/core
git commit -m "test: :white_check_mark: покрыть DCS YAML-пути индекса"
```

If no files changed, do not create an empty commit.

---

## Self-Review

- Spec coverage: DCS YAML-path addressing is covered by Tasks 1-4; `UserSettingsID` and `uuid` exclusions are covered by Global Constraints and Task 4; ERP conflict validation is covered by Task 5.
- Placeholder scan: the plan contains no unfinished requirement markers and no open-ended “handle later” steps. The only conditional step is explicit: commit test-only changes only if such changes exist.
- Type consistency: helper names are consistent across tasks: `yamlPropertyUid`, `yamlKeyUid`, `yamlIndexUid`, `configurationIndexAddressing`, `yamlPathAddressing`.
- Scope check: the plan is limited to DCS index address conflicts and does not change YAML format, full XML storage, or remote 1C synchronization.
