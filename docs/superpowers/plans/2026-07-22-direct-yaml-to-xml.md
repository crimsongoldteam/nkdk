# Direct YAML to XML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести синхронизацию, переименование и поиск ссылок на единый прямой обход YAML → XML без metadata-модели и удалить прежнюю общую оркестрацию `fromYAML`/`toXML`.

**Architecture:** Общий YAML-ориентированный обход читает каждый набор `rules.ts` один раз, последовательно вызывает только атомарные обработчики конкретного типа и направляет результат в один или несколько XML-файлов. Переименование и поиск ссылок используют тот же курсор правил непосредственно над разобранным YAML; metadata-модель и совместимые переходники отсутствуют.

**Tech Stack:** TypeScript 6, Vitest 4, TypeBox, pnpm workspace, существующие XML/YAML import/export и configuration index.

## Global Constraints

- Существующие XML-фикстуры являются источником истины и не изменяются.
- Каждый YAML-объект проходит один основной обход `rules.ts`.
- Полная, частичная и форменная синхронизация не создают metadata-модель.
- Переименование и поиск ссылок не создают metadata-модель.
- Запасной путь через metadata-модель запрещён.
- В общих metadata-слоях запрещены частные условия по `itemType`, именам XML-корней и конкретным прикладным объектам.
- Общие property-level операции `fromYAML` и `toXML` должны быть удалены; сохраняются только атомарные обработчики конкретных типов.
- Форматы YAML, XML и файла индекса конфигурации не меняются.
- Перед завершением обязательно выполнить `pnpm test` из корня вортри.

---

## Карта файлов и обязанностей

- `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts` — договор прямого обхода, источника YAML, XML-приёмников и вложенных правил.
- `packages/core/metadata/orchestration/property/fromYAMLToXMLPlan.ts` — кэшируемый план properties без данных конкретного объекта.
- `packages/core/metadata/orchestration/property/fromYAMLToXML.ts` — единственная общая оркестрация одного набора properties.
- `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.ts` — корни metadata-item, XMLRoot и inline YAML.
- `packages/core/metadata/orchestration/metadataCollection/fromYAMLToXML.ts` — массивы и записи вложенных metadata-item.
- `packages/core/metadata/forms/elements/orchestration/fromYAMLToXML.ts` — выбор правил полиморфных элементов формы без модели.
- `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts` — одновременное формирование описания формы и `Ext/Form.xml`.
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — только чтение задания, запуск прямого преобразования и запись подготовленных результатов.
- `packages/core/metadata/appliedObjects/configuration/rootIO.ts` — прямой YAML → `Configuration.xml`.
- `packages/core/metadata/operations/projectSnapshot.ts` — снимок из разобранного YAML без поля `model`.
- `packages/core/metadata/operations/targetResolver.ts` — навигация по YAML и `operationTarget`.
- `packages/core/metadata/operations/references.ts` — структурные ссылки над YAML.
- `packages/core/metadata/operations/dataPathReferences.ts` — переиспользование прямого YAML-обхода `ПутьКДанным`.
- `packages/core/metadata/validation/dataPath/formYamlTraversal.ts` — общий сбор индекса формы и появлений `ПутьКДанным` из YAML.
- `.agents/architecture.md` — итоговый архитектурный договор.

---

### Task 1: Договор и кэшируемый план прямого обхода

**Files:**

- Create: `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts`
- Create: `packages/core/metadata/orchestration/property/fromYAMLToXMLPlan.ts`
- Create: `packages/core/metadata/orchestration/property/fromYAMLToXMLPlan.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`

**Interfaces:**

- Produces: `YAMLPropertySource`, `YAMLToXMLOutputRequest`, `YAMLToXMLNestedRule`, `YAMLToXMLTraversal`, `getYAMLToXMLPlan(rule)`.
- Consumes: `MetadataItemRule`, `PropertyRule`, `YamlRuleCursor`, существующий реестр правил типов.

- [ ] **Step 1: Write the failing plan-cache test**

```ts
import { describe, expect, it } from "vitest"
import { getYAMLToXMLPlan } from "./fromYAMLToXMLPlan"

describe("getYAMLToXMLPlan", () => {
  it("кэширует YAML/XML-адреса properties отдельно от данных объекта", () => {
    const rule = {
      itemType: "TestItem",
      properties: {
        title: { type: "string", yaml: "Заголовок", xml: "Title" },
        value: { type: "string", yaml: "Значение", xmlParents: ["Properties"] },
      },
    } as const

    const first = getYAMLToXMLPlan(rule as never)
    const second = getYAMLToXMLPlan(rule as never)

    expect(first).toBe(second)
    expect(first.properties.map((item) => [item.propertyKey, item.yamlKey, item.xmlPath])).toEqual([
      ["title", "Заголовок", ["Title"]],
      ["value", "Значение", ["Properties", "Value"]],
    ])
  })
})
```

- [ ] **Step 2: Run the focused test and verify the missing-module failure**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXMLPlan.test.ts`

Expected: FAIL because `./fromYAMLToXMLPlan` does not exist.

- [ ] **Step 3: Define the direct traversal contracts**

```ts
export interface YAMLPropertySource {
  readonly itemName?: string
  has(propertyKey: string): boolean
  raw(propertyKey: string): unknown
  yamlKey(propertyKey: string): string | undefined
}

export interface YAMLToXMLOutputRequest {
  readonly key: string
  readonly tags?: readonly string[]
  readonly referenceXML?: Record<string, unknown>
}

export type YAMLToXMLExternalWrite =
  | { readonly kind: "copy"; readonly sourcePath: string; readonly targetPath: string }
  | { readonly kind: "xml"; readonly targetPath: string; readonly value: Record<string, unknown> }
  | { readonly kind: "handler"; run(): Promise<void> }

export interface YAMLToXMLResult {
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
}

export type YAMLToXMLNestedRule =
  | { readonly kind: "item"; readonly itemRule: MetadataItemRule }
  | {
      readonly kind: "collection"
      readonly itemRule: MetadataItemRule
      readonly yamlShape: "array" | "record"
      readonly xmlElement?: string
      readonly keyField?: string
      readonly nameFromYAMLKey?: (yamlKey: string) => string
      readonly configurationIndexUidSegment?: string
      readonly configurationIndexAddressing?: ConfigurationIndexAddressingMode
    }
  | {
      readonly kind: "polymorphicRecord"
      resolveItemRule(params: { yaml: Record<string, unknown>; name: string }): MetadataItemRule
    }

export interface YAMLToXMLTraversal extends YamlRuleCursor {
  readonly source: YAMLPropertySource
}
```

Add the registry operation `yamlToXMLNestedRule` to `TypeRule`, `TypeRulesOperations`, the registry union, and the conditional return type of `getTypeRule`.

- [ ] **Step 4: Implement the immutable cached plan**

```ts
const plans = new WeakMap<MetadataItemRule, YAMLToXMLPlan>()

export function getYAMLToXMLPlan(rule: MetadataItemRule): YAMLToXMLPlan {
  const cached = plans.get(rule)
  if (cached !== undefined) return cached

  const plan = Object.freeze({
    rule,
    properties: Object.freeze(
      Object.entries(rule.properties).map(([propertyKey, propertyRule]) =>
        Object.freeze({
          propertyKey,
          propertyRule,
          yamlKey: propertyRule.yaml,
          xmlPath: Object.freeze([...(propertyRule.xmlParents ?? []), propertyRule.xml ?? capitalize(propertyKey)]),
        })
      )
    ),
  })
  plans.set(rule, plan)
  return plan
}
```

- [ ] **Step 5: Run the focused test**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXMLPlan.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 6: Commit the contracts**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/orchestration/index.ts
git commit -m "refactor: :recycle: добавить договор прямого YAML в XML"
```

---

### Task 2: Единое атомарное преобразование свойства

**Files:**

- Create: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Create: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.ts`

**Interfaces:**

- Consumes: `getYAMLToXMLPlan`, атомарные `importFromYAML`/`exportToXML`, configuration index.
- Produces: `convertPropertiesFromYAMLToXML(params): YAMLToXMLResult` и нейтральный `YAMLPropertySource` для условий.

- [ ] **Step 1: Write a failing test for handler order and value lifetime**

```ts
it("сразу передаёт атомарный результат fromYAML в toXML", () => {
  const calls: string[] = []
  registerTypeRule("TestAtomic" as never, "importFromYAML", ({ value }) => {
    calls.push(`from:${String(value)}`)
    return Number(value)
  })
  registerTypeRule("TestAtomic" as never, "exportToXML", ({ value }) => {
    calls.push(`to:${String(value)}`)
    return `xml:${String(value)}`
  })

  const result = convertPropertiesFromYAMLToXML({
    context: contextWithExportToXML(),
    yaml: { Значение: "42" },
    rule: testRule({ value: { type: "TestAtomic", yaml: "Значение", xml: "Value" } }),
    outputs: [{ key: "owner" }],
  })

  expect(calls).toEqual(["from:42", "to:42"])
  expect(result.outputs.get("owner")).toEqual({ Value: "xml:42" })
})
```

Add cases in the same file for `defaultValue`, `defaultValueXML`, `defaultValueXMLRaw`, `preserveFromReferenceXML`, `xmlAliases`, `xmlParents`, explicit YAML strings, and diagnostics containing the YAML key.

- [ ] **Step 2: Run the focused test and verify the missing-function failure**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts`

Expected: FAIL because `convertPropertiesFromYAMLToXML` is not exported.

- [ ] **Step 3: Implement the source over raw YAML**

```ts
function createYAMLPropertySource(params: {
  yaml: unknown
  rule: MetadataItemRule
  itemName?: string
}): YAMLPropertySource {
  const yaml = asRecord(params.yaml)
  return {
    itemName: params.itemName,
    has(propertyKey) {
      const yamlKey = params.rule.properties[propertyKey]?.yaml
      return typeof yamlKey === "string" && yaml !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)
    },
    raw(propertyKey) {
      const yamlKey = params.rule.properties[propertyKey]?.yaml
      return typeof yamlKey === "string" ? yaml?.[yamlKey] : undefined
    },
    yamlKey(propertyKey) {
      return params.rule.properties[propertyKey]?.yaml
    },
  }
}
```

- [ ] **Step 4: Implement one ordered properties loop**

```ts
export function convertPropertiesFromYAMLToXML(params: ConvertPropertiesFromYAMLToXMLParams): YAMLToXMLResult {
  const source = createYAMLPropertySource({ yaml: params.yaml, rule: params.rule, itemName: params.name })
  const outputs = createOutputs(params.outputs)
  const ordered = orderYAMLToXMLProperties({ context: params.context, plan: getYAMLToXMLPlan(params.rule), outputs })

  for (const planned of ordered) {
    if (!shouldConvertYAMLProperty({ source, rule: planned.propertyRule, context: params.context })) continue
    const imported = importAtomicYAMLValue({ context: params.context, source, planned, name: params.name })
    const exported = exportAtomicXMLValue({ context: params.context, source, planned, value: imported })
    writePropertyToMatchingOutputs({ outputs, planned, exported, context: params.context })
  }

  finishRequiredXMLParents(outputs)
  return { outputs: outputMap(outputs), externalWrites: [] }
}
```

Move default handling, namespace wrapping, raw empty values, XML alias selection and index recording from the old generic functions into private helpers of this new module. Do not call `importPropertyFromYAML` or `exportPropertyToXML`.

Export two one-value helpers for composite atomic types and metadata-operations:

```ts
export function callAtomicFromYAML(params: AtomicFromYAMLParams): unknown
export function callAtomicToXML(params: AtomicToXMLParams): unknown
```

Both helpers perform only arity dispatch and value-level default/reference handling. They must not accept `MetadataItemRule`, iterate properties or create an object for sibling values.

- [ ] **Step 5: Change conditional rules to consume raw YAML source**

```ts
export type YAMLToXMLCondition = (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) => boolean

// PropertyRule
toXML?: false | YAMLToXMLCondition
```

Keep `ExportToXMLFunctionNew` atomic, but replace its `metadataItem` parameter with `source: YAMLPropertySource`. Type-specific handlers may read only `source.raw(...)`, `source.has(...)`, and `source.itemName`.

Support both existing atomic signatures explicitly while they are registered:

```ts
const imported =
  importHandler === undefined
    ? rawValue
    : importHandler.length === 1
      ? (importHandler as ImportFromYAMLFunctionNew)({
          context,
          rule,
          value: rawValue,
          yaml,
          source: referenceValue,
          name,
          owner,
        })
      : (importHandler as ImportFromYAMLFunction)(context, rule, rawValue, referenceValue)
```

Apply the same arity dispatch to `ExportToXMLFunction` and `ExportToXMLFunctionNew`; the new signature receives `source` instead of `metadataItem`.

- [ ] **Step 6: Run direct property and helper tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/property/helpers.test.ts metadata/configurationIndex/referenceView.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit atomic conversion**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/configurationIndex/referenceView.ts
git commit -m "feat: :sparkles: преобразовывать YAML-свойства прямо в XML"
```

---

### Task 3: Вложенные metadata-item и обычные коллекции

**Files:**

- Create: `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.ts`
- Create: `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.test.ts`
- Create: `packages/core/metadata/orchestration/metadataCollection/fromYAMLToXML.ts`
- Create: `packages/core/metadata/orchestration/metadataCollection/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`

**Interfaces:**

- Consumes: `YAMLToXMLNestedRule`, `convertPropertiesFromYAMLToXML`.
- Produces: `convertMetadataItemFromYAMLToXML` и `convertMetadataCollectionFromYAMLToXML`.

- [ ] **Step 1: Write failing item and collection tests**

```ts
it("рекурсивно преобразует YAML-запись коллекции без массива моделей", () => {
  const result = convertMetadataCollectionFromYAMLToXML({
    context: contextWithExportToXML(),
    yaml: { Первый: { Значение: "A" }, Второй: { Значение: "B" } },
    descriptor: {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      xmlElement: "Item",
    },
    outputs: [{ key: "owner" }],
  })

  expect(result.outputs.get("owner")).toEqual({
    Item: [
      { Name: "Первый", Value: "A" },
      { Name: "Второй", Value: "B" },
    ],
  })
})
```

Add a second test for `yamlShape: "array"`, key-field matching against raw reference XML, and logical addresses from `configurationIndexUidSegment`.

- [ ] **Step 2: Run the tests and verify missing converters**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataItem/fromYAMLToXML.test.ts metadata/orchestration/metadataCollection/fromYAMLToXML.test.ts`

Expected: FAIL because both direct converters are missing.

- [ ] **Step 3: Register declarative nested descriptors**

```ts
registerTypeRule(propertyType, "yamlToXMLNestedRule", {
  kind: "item",
  itemRule,
})
```

For `registerMetadataItemCollectionRule`, register:

```ts
registerTypeRule(propertyType, "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule,
  yamlShape: params.yamlAsArray === true ? "array" : "record",
  xmlElement: params.xmlElement,
  keyField: typeof params.keyField === "string" ? params.keyField : undefined,
  nameFromYAMLKey: params.nameFromYAMLKey,
  configurationIndexUidSegment: params.configurationIndexUidSegment,
  configurationIndexAddressing: params.configurationIndexAddressing,
})
```

- [ ] **Step 4: Implement direct metadata-item roots**

`convertMetadataItemFromYAMLToXML` must normalize `yamlInline`, invoke the properties converter once, add `itemType` only to the traversal context, apply `xsiType`, and wrap `XMLRoot` directly around every requested output. It must merge unknown raw reference XML after generation without constructing reference metadata.

```ts
export function convertMetadataItemFromYAMLToXML(params: ConvertMetadataItemFromYAMLToXMLParams): YAMLToXMLResult {
  const yaml = normalizeInlineYAML(params.yaml, params.rule)
  const converted = convertPropertiesFromYAMLToXML({
    context: params.context,
    yaml,
    rule: params.rule,
    name: params.name,
    outputs: params.outputs,
  })
  return wrapMetadataItemOutputs({ converted, rule: params.rule, yaml, name: params.name })
}
```

- [ ] **Step 5: Implement direct collection recursion**

For an array, recurse in source order and address items by YAML index unless a registered key field is present. For a record, recurse in `Object.entries` order and pass the record key as `name`; do not create `{ name, itemType }` objects.

- [ ] **Step 6: Make the property converter prefer nested descriptors**

Before looking up atomic handlers, query `yamlToXMLNestedRule`. If present, recurse and return the nested XML value. The old model-producing handlers remain temporarily registered but must not be called by the new path.

- [ ] **Step 7: Run nested conversion tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataItem/fromYAMLToXML.test.ts metadata/orchestration/metadataCollection/fromYAMLToXML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit nested conversion**

```bash
git add packages/core/metadata/orchestration/metadataItem packages/core/metadata/orchestration/metadataCollection packages/core/metadata/orchestration/property
git commit -m "feat: :sparkles: преобразовывать вложенный YAML прямо в XML"
```

---

### Task 4: Особые коллекции и зависимости между свойствами

**Files:**

- Modify: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataIntegrationServiceChannel/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataSequenceDimension/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/register.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/core/metadata/commonObjects/standardTabularSectionDescription/register.ts`
- Modify: `packages/core/metadata/commonObjects/accountingFlag/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/internalInfo/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/core/metadata/forms/commonObjects/elementId/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Test: existing `fromYAML.test.ts`, `toXML.test.ts`, and `syncToXML.test.ts` beside these modules.

**Interfaces:**

- Consumes: nested descriptors and `YAMLPropertySource` from Tasks 1–3.
- Produces: no custom collection callback that constructs a model; all cross-property checks read raw YAML.

- [ ] **Step 1: Add a boundary test for model-backed collection callbacks**

In `packages/core/metadata/importBoundaries.test.ts`, add source checks that fail when collection registrations pass `fromYAML` or a `toXML` callback importing `exportMetadataCollectionToXML`.

```ts
expect(source).not.toMatch(/fromYAML:\s*(?:import|createImport)/)
expect(source).not.toContain("exportMetadataCollectionToXML")
```

- [ ] **Step 2: Run the boundary test and verify it reports the current registrations**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts`

Expected: FAIL and list at least `metadataAttribute/register.ts` and `standardAttributeDescription/registerCollectionRule.ts`.

- [ ] **Step 3: Express special collection shapes declaratively**

Extend `YAMLToXMLNestedRule` only with concrete data needed by the current registrations: record-key conversion, array key field, XML wrapper and an optional atomic item discriminator. Replace custom collection-wide `fromYAML`/`toXML` callbacks in every file listed above with these descriptor fields. Keep a custom atomic handler only when it transforms one leaf value rather than walking an item rule.

- [ ] **Step 4: Replace model predicates with raw YAML predicates**

```ts
const hasExplicitProperty =
  (propertyKey: string) =>
  (source: YAMLPropertySource): boolean =>
    source.has(propertyKey)

const isTurnoverAccumulationRegister = (source: YAMLPropertySource): boolean => source.raw("registerType") === "Обороты"
```

Apply the same rule to register fields, dimensions, resources and external data source cube properties. Predicates must not call an atomic conversion of a sibling and must not cache converted sibling values.

Change `standartAttributeNamesXML` and type-specific `ExportToXMLFunctionNew` implementations to receive `YAMLPropertySource`. `InternalInfo`, `ElementId` and client application interface panels read the required item name or sibling collection through this source; no handler may accept a model-shaped object.

- [ ] **Step 5: Run focused common-object tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute metadata/commonObjects/metadataRegisterField metadata/commonObjects/standardAttributeDescription metadata/commonObjects/metadataHTTPServiceMethod metadata/appliedObjects/metadataAccumulationRegister`

Expected: PASS.

- [ ] **Step 6: Run the boundary test again**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit declarative special cases**

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/appliedObjects/metadataAccumulationRegister packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: описать вложенный YAML декларативно"
```

---

### Task 5: Составные commonObjects без общей оркестрации

**Files:**

- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/registerCollectionRule.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/dcscorItemsXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/recalculation/register.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/core/metadata/commonObjects/styleItemValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/styleItemValue/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`

**Interfaces:**

- Consumes: nested descriptors and direct atomic dispatch.
- Produces: no production module outside the new direct engine calls a deleted generic property/item/collection function.

- [ ] **Step 1: Add a production-source inventory test**

Extend `packages/core/metadata/importBoundaries.test.ts` to scan non-test TypeScript files and report every import or call of a forbidden generic symbol. Keep test files out of this first assertion so production migration is reviewed separately from test migration.

```ts
const forbiddenProductionCalls = [
  "importPropertiesFromYAML",
  "exportPropertiesToXML",
  "importPropertyFromYAML",
  "exportPropertyToXML",
  "importMetadataItemFromYAML",
  "exportMetadataItemToXML",
  "exportMetadataCollectionToXML",
]
```

- [ ] **Step 2: Run the inventory test and verify the listed composite modules fail**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts`

Expected: FAIL with the production files listed in this task.

- [ ] **Step 3: Replace rules-object composition with nested descriptors**

For DCS items and collections that currently call metadata-item/collection orchestration, register their item rules and shapes through `yamlToXMLNestedRule`. Preserve polymorphic selection by registering a `polymorphicRecord` resolver that reads the existing YAML discriminator. Do not keep wrapper functions whose only body calls a generic metadata-item converter.

- [ ] **Step 4: Replace compound-leaf generic calls with concrete handler dispatch**

`StyleItemValue`, form attribute settings and similar compound leaves may invoke the registered handlers for `Border`, `Color`, `Font` and other concrete child types directly:

```ts
const handler = getTypeRule(childRule.type, "importFromYAML")
if (handler === undefined) return rawValue
return callAtomicFromYAML({ handler, context, rule: childRule, value: rawValue })
```

The shared `callAtomicFromYAML`/`callAtomicToXML` helpers live beside `fromYAMLToXML.ts`, accept one value, and never recurse through `MetadataItemRule.properties`.

- [ ] **Step 5: Remove redundant enumeration and recalculation registrations**

Keep schema and atomic `toYAML` registrations needed by XML → YAML. Remove collection-wide model import/XML export registrations now supplied by the nested descriptor. Preserve custom XML wrapper names and record keys in descriptor data.

- [ ] **Step 6: Run focused DCS, form common-object and boundary tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem metadata/commonObjects/styleItemValue metadata/forms/commonObjects/formAttribute metadata/forms/commonObjects/formCommand metadata/importBoundaries.test.ts`

Expected: PASS and the production-source forbidden-symbol list is empty outside files scheduled for deletion in Task 12.

- [ ] **Step 7: Commit composite common objects**

```bash
git add packages/core/metadata/appliedObjects packages/core/metadata/commonObjects packages/core/metadata/forms/commonObjects packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: убрать модельный обход commonObjects"
```

---

### Task 6: Формы и элементы формы одним обходом

**Files:**

- Create: `packages/core/metadata/forms/elements/orchestration/fromYAMLToXML.ts`
- Create: `packages/core/metadata/forms/elements/orchestration/fromYAMLToXML.test.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`

**Interfaces:**

- Consumes: multi-output `convertPropertiesFromYAMLToXML`, element-rule registry.
- Produces: `convertClientApplicationFormFromYAMLToXML` returning `metadataXML`, `formXML`, external writes and index fragment data.

- [ ] **Step 1: Write a failing one-pass form test**

```ts
it("одним обходом формирует описание и содержимое формы", () => {
  const visits: string[] = []
  const result = convertClientApplicationFormFromYAMLToXML({
    context: contextWithExportToXML({ onProperty: (path) => visits.push(path.join(".")) }),
    yaml: fixtureClientApplicationFormYAML,
    name: "ФормаЭлемента",
  })

  expect(result.metadataXML.Form.Properties).toBeDefined()
  expect(result.formXML.Items).toBeDefined()
  expect(new Set(visits).size).toBe(visits.length)
})
```

- [ ] **Step 2: Run the test and verify the converter is missing**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

Expected: FAIL because the direct form converter does not exist.

- [ ] **Step 3: Register polymorphic element descriptors**

For collectable elements, resolve `Вид` plus table context to an `ElementRule`. For singleton elements, register an item descriptor with the existing name style. The descriptor returns rules only; it must not call `importSingleElementFromYAML` or `exportSingleElementToXML`.

```ts
registerTypeRule(propertyType, "yamlToXMLNestedRule", {
  kind: "item",
  itemRule: elementRule,
})
```

- [ ] **Step 4: Replace numbering state with XML-only state**

Change the numbering entry from model/reference elements to:

```ts
type ToXMLContextElement = {
  referenceId?: string
  xmlElement: ElementXMLWithoutId
  numberingScope?: unknown
}
```

Read `referenceId` from raw reference XML or configuration index. `setIdsToElements` must use only this value and the generated XML node.

- [ ] **Step 5: Build both form outputs in one call**

```ts
const converted = convertPropertiesFromYAMLToXML({
  context,
  yaml,
  rule: ClientApplicationFormRules,
  name,
  outputs: [
    { key: "metadata", tags: [FormRulesTags.Metadata], referenceXML: referenceMetadataXML },
    { key: "form", tags: [FormRulesTags.Form], referenceXML: referenceFormXML },
  ],
})
```

After the loop, add fixed namespaces, version, UUID and root wrappers. Build the compact form attribute index lazily from `Реквизиты` through `createFormDataPathIndexCollector`; do not traverse all form rules before conversion.

- [ ] **Step 6: Route `syncFormToXML` and `writePreparedFormToXML` through the direct converter**

Both entry points must parse YAML once, pass raw references, write the two returned XML values, then execute returned external writes. Remove calls to form-level `fromYAML` and `toXML` from this file.

- [ ] **Step 7: Run form regression tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm metadata/forms/elements metadata/forms/commonObjects/childItems`

Expected: PASS with unchanged XML fixtures.

- [ ] **Step 8: Commit direct forms**

```bash
git add packages/core/metadata/forms packages/core/metadata/context/types.ts packages/core/metadata/validation/dataPath/formYamlIndex.ts
git commit -m "feat: :sparkles: формировать XML формы одним обходом"
```

---

### Task 7: Прикладные объекты, вложенные файлы и частичная синхронизация

**Files:**

- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/metadataItemOwnerContext.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/core/metadata/orchestration/xmlWriteManifest.ts`

**Interfaces:**

- Consumes: direct metadata-item and form converters.
- Produces: один `YAMLToXMLResult` с owner XML и внешними действиями для полной и частичной синхронизации.

- [ ] **Step 1: Write a failing no-model synchronization test**

Mock the legacy model constructors to throw and run `syncAppliedObjectAreaToXML` for `owner`, `externalFile`, and `all`.

```ts
vi.mock("../metadataItem/fromYAML", () => ({
  importMetadataItemFromYAML: () => {
    throw new Error("legacy model path called")
  },
}))
```

Assert that every area still writes its expected fixture and never throws `legacy model path called`.

- [ ] **Step 2: Run partial synchronization tests and verify the legacy call**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/appliedObject/syncToXML.partial.test.ts metadata/orchestration/appliedObject/syncPreparedToXML.test.ts`

Expected: FAIL with `legacy model path called`.

- [ ] **Step 3: Populate external work in the traversal result**

When the property loop visits `externalFile`, `filePath`, `syncExternalOnly`, or a file child descriptor, append the corresponding `YAMLToXMLExternalWrite` action defined in Task 1 immediately. Do not add another `Object.entries(rule.properties)` loop after conversion.

- [ ] **Step 4: Rewrite applied-object synchronization as orchestration only**

The function must:

1. read the prepared or on-disk YAML;
2. read raw reference XML only for requested routes;
3. call `convertMetadataItemFromYAMLToXML` once;
4. write the selected owner output;
5. execute returned external writes;
6. record files in `XmlWriteManifest`.

Delete model enrichment helpers such as `addFileItemChildCollectionsFromYAML`, `addFileChildCollectionReferenceNames`, and model-based `expectedNames`. Replace expected file-child names with directory discovery already provided by `listYAMLFileItemNames`.

- [ ] **Step 5: Preserve partial-route behavior**

Filter outputs before conversion using `AppliedObjectXmlAreaRequest`. For `externalFile`, include only the matching route but still provide the raw owner YAML source required by its atomic handler. For `owner`, do not execute external writes.

- [ ] **Step 6: Run applied-object tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration/appliedObject metadata/appliedObjects --passWithNoTests`

Expected: PASS; generated XML remains byte-equivalent where existing tests compare text.

- [ ] **Step 7: Commit applied-object synchronization**

```bash
git add packages/core/metadata/orchestration/appliedObject packages/core/metadata/orchestration/property packages/core/metadata/appliedObjects
git commit -m "refactor: :recycle: синхронизировать объекты прямо из YAML"
```

---

### Task 8: Конфигурация и полный worker-путь

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/determinism.test.ts`

**Interfaces:**

- Consumes: direct configuration, applied-object and form converters.
- Produces: full and incremental synchronization without calls to model-level YAML import/XML export.

- [ ] **Step 1: Write a failing prepared-configuration test**

```ts
it("пишет Configuration.xml прямо из PreparedYamlFile", () => {
  const result = writePreparedConfigurationToXML({
    context,
    outputDir,
    preparedYamlFile: preparedConfigurationYAML,
    childObjects: { Catalogs: ["Контрагенты"] },
  })

  expect(result).toBeUndefined()
  expect(readFileSync(join(outputDir, "Configuration.xml"), "utf8")).toBe(referenceConfigurationXML)
})
```

Mock `readConfigurationFromYAML` to throw so the test proves that no configuration model is built.

- [ ] **Step 2: Run configuration tests and verify the legacy call**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/rootXML.test.ts metadata/fullSyncToXml/writeAssignment.test.ts`

Expected: FAIL because `writePreparedConfigurationToXML` still calls `readConfigurationFromYAML`.

- [ ] **Step 3: Convert configuration YAML directly**

Call `convertMetadataItemFromYAMLToXML` with `MetadataConfigurationRules`, raw YAML and raw/index reference. Insert `ChildObjects` into the returned configuration root after the single property traversal; child object names come from assignment discovery, not a model.

- [ ] **Step 4: Route every full-sync assignment through direct converters**

Keep the existing assignment roles, index runtime and output validation. Change only `writeConfigurationAssignmentXML`, `writeFormAssignmentXML`, and `writePropertiesAssignmentXML` so each passes `PreparedYamlFile.data` directly to the corresponding converter. `writeFullXmlSyncAssignment` must continue returning the collector fragment after all outputs are written.

- [ ] **Step 5: Route incremental configuration synchronization through the same path**

Remove configuration-model remapping. Pass raw reference XML/index and requested area to the same converter used by full synchronization.

- [ ] **Step 6: Run full synchronization tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration metadata/fullSyncToXml`

Expected: PASS, including determinism, worker failure handling, external transfer and unchanged fixtures.

- [ ] **Step 7: Commit the worker path**

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/fullSyncToXml
git commit -m "refactor: :recycle: перевести полную синхронизацию на YAML"
```

---

### Task 9: YAML-снимок и разрешение целей metadata-операций

**Files:**

- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.test.ts`
- Modify: `packages/core/metadata/operations/targetResolver.ts`
- Modify: `packages/core/metadata/operations/targetResolver.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Delete: `packages/core/metadata/operations/yamlModelIO.ts`
- Delete: `packages/core/metadata/operations/yamlModelIO.test.ts`
- Create: `packages/core/metadata/operations/yamlIO.ts`
- Create: `packages/core/metadata/operations/yamlIO.test.ts`

**Interfaces:**

- Consumes: `ParsedYaml`, `MetadataItemRule`, `operationTarget`, вложенные descriptors.
- Produces: `OperationSnapshotItem.yaml`, `ResolvedMetadataOperationPath.yamlNode`, прямую сериализацию изменённого YAML.

- [ ] **Step 1: Write failing snapshot and nested-target tests**

```ts
expect(snapshot.items[0]).toMatchObject({
  yaml: { Реквизиты: { Код: { Тип: "Строка" } } },
})
expect(snapshot.items[0]).not.toHaveProperty("model")
```

For `targetResolver`, assert that resolving `Справочник.Товары.Реквизит.Код` returns the exact object stored at `yaml.Реквизиты.Код` and the parent YAML record used to rename its key.

- [ ] **Step 2: Run operation snapshot tests and verify they still expose `model`**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/operations/projectSnapshot.test.ts metadata/operations/targetResolver.test.ts`

Expected: FAIL because current items contain `model`, not `yaml`.

- [ ] **Step 3: Remove model construction from snapshots**

```ts
export interface OperationSnapshotItem {
  resource: ValidationProjectFile
  filePath: string
  projectPath: string
  ownerDirPath: string
  parsed: ParsedYaml
  yaml: Record<string, unknown>
  rule: MetadataItemRule
  kind: ValidationProjectFile["kind"]
}
```

Validate only that parsed data is a YAML object. Keep schema/syntax diagnostics from project preparation; do not invoke a type handler.

- [ ] **Step 4: Navigate YAML keys instead of model property names**

For every `operationTarget`, obtain `propertyRule.yaml`, then select the named child from the YAML record or array according to its nested descriptor. Return both the selected YAML node and a mutation closure:

```ts
rename(nextName: string): void {
  renameRecordKeyPreservingOrder(parentRecord, currentName, nextName)
}
```

For top-level and file items, retain the current filesystem plan. Do not inject `name` or `itemType` into YAML.

- [ ] **Step 5: Serialize modified YAML directly**

```ts
export function exportOperationItemToYamlText(item: OperationSnapshotItem): string {
  return exportToYAML(item.yaml)
}
```

Update `renameItem.ts` to call the resolver mutation closure and serialize only touched items.

- [ ] **Step 6: Run rename and target tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/operations/projectSnapshot.test.ts metadata/operations/targetResolver.test.ts metadata/operations/renameItem.test.ts metadata/operations/yamlIO.test.ts`

Expected: PASS with unchanged plan/apply and migration expectations.

- [ ] **Step 7: Commit YAML-native target resolution**

```bash
git add packages/core/metadata/operations
git commit -m "refactor: :recycle: разрешать metadata-цели прямо в YAML"
```

---

### Task 10: Структурные ссылки и `ПутьКДанным` непосредственно в YAML

**Files:**

- Modify: `packages/core/metadata/operations/references.ts`
- Modify: `packages/core/metadata/operations/references.test.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.test.ts`
- Create: `packages/core/metadata/validation/dataPath/formYamlTraversal.ts`
- Create: `packages/core/metadata/validation/dataPath/formYamlTraversal.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/project/projectSpecHelpers.ts`
- Modify: `packages/core/metadata/project/specs.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`
- Modify: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
- Modify: `packages/core/metadata/project/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationQueue.test.ts`

**Interfaces:**

- Consumes: `OperationSnapshotItem.yaml`, `YamlRuleCursor`, атомарные type handlers, validation facts.
- Produces: `collectFormDataPathOccurrencesFromYAML`, `buildFormDataPathIndexFromYAML`, owner cache без `importModel`.

- [ ] **Step 1: Write failing direct-YAML reference tests**

```ts
const item = operationItem({
  yaml: { Владелец: "Справочник.Родители" },
  rule: metadataItemLinkTestRule,
})
const result = collectStructuralReferencesForItem({ item, parsed: item.parsed })

expect(result).toMatchObject({
  ok: true,
  references: [{ yamlPath: ["Владелец"], canonical: "Catalog.Родители" }],
})
```

Add a mutation assertion that `setCanonical("Catalog.НовыеРодители")` changes `item.yaml.Владелец` through atomic `fromYAML`/`toYAML`, not a model field.

- [ ] **Step 2: Write failing direct form DataPath tests**

Test nested table elements expressed with YAML `Вид`, `Элементы` and `ПутьКДанным`. Assert returned occurrences contain the same YAML paths as validation and setters mutate the raw YAML strings.

- [ ] **Step 3: Run reference tests and verify model assumptions fail**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/operations/references.test.ts metadata/operations/dataPathReferences.test.ts metadata/validation/dataPath/formYamlTraversal.test.ts`

Expected: FAIL because references and form traversal currently read model property names.

- [ ] **Step 4: Traverse structural references by YAML key**

For each planned property, read `record[propertyRule.yaml]`. When a `structuralReferences` handler needs a typed leaf, call its registered atomic `importFromYAML` directly. Its setter calls the registered atomic `exportToYAML` directly and writes the YAML key. For nested descriptors, recurse using record keys, array indexes, or the polymorphic element rule.

- [ ] **Step 5: Extract reusable form YAML traversal from validation**

Move the current private YAML logic from `yamlFactExtractor.ts` into:

```ts
export function buildFormDataPathIndexFromYAML(params: { filePath: string; parsed: ParsedYaml }): FormDataPathIndex

export function collectFormDataPathOccurrencesFromYAML(params: {
  filePath: string
  parsed: ParsedYaml
  rule: MetadataItemRule
}): FormDataPathYAMLOccurrence[]
```

Validation uses the first function and maps the second function to pending checks. Metadata-operations use both functions and retain each occurrence setter for rename.

- [ ] **Step 6: Remove `importModel` from project specifications and owner cache**

Delete `RegisteredProjectSpec.importModel` and `createGenericProjectImportModel`. Build owner facts with `extractValidationOwnerYamlFacts`, the rules snapshot and `createLocalIndexesCollector`. Unique-name checks must use the existing YAML checks from `yamlFactExtractor`, not `validateUniqueNameScopes(model)`.

- [ ] **Step 7: Run operation and validation tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/operations metadata/validation/dataPath metadata/validation/yamlFactExtractor.test.ts metadata/project`

Expected: PASS; search remains read-only and rename changes the same YAML paths as before.

- [ ] **Step 8: Commit YAML-native references**

```bash
git add packages/core/metadata/operations packages/core/metadata/validation packages/core/metadata/project
git commit -m "refactor: :recycle: обрабатывать ссылки прямо в YAML"
```

---

### Task 11: Миграции конфигурации без YAML-модели

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/types.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`

**Interfaces:**

- Consumes: YAML-ориентированные operation targets и факты владельца.
- Produces: тот же `StructuralState` из YAML без `importMetadataItemFromYAML`.

- [ ] **Step 1: Write a failing YAML-state test with the legacy importer disabled**

Mock `importMetadataItemFromYAML` to throw, then collect state for an object containing attributes, tabular sections, dimensions and resources. Assert the same canonical structural paths as the XML-side collector.

- [ ] **Step 2: Run the migration test and verify the legacy call**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/migrations/collectState.test.ts`

Expected: FAIL with the mocked legacy error.

- [ ] **Step 3: Build structural nodes from YAML facts**

Walk the top-level rule with the common YAML cursor. Use `operationTarget.targetKind` to classify named collections and their YAML record keys; recurse into tabular-section attributes through the registered nested descriptor. Emit `StructuralNode` immediately and never assemble `{ name, itemType }` records.

- [ ] **Step 4: Run migration tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/migrations`

Expected: PASS and YAML/XML structural states remain equivalent.

- [ ] **Step 5: Commit direct migration state**

```bash
git add packages/core/metadata/appliedObjects/configuration/migrations packages/core/metadata/validation/yamlFactExtractor.ts
git commit -m "refactor: :recycle: собирать состояние миграций из YAML"
```

---

### Task 12: Удаление прежней общей оркестрации

**Files:**

- Delete: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Delete: `packages/core/metadata/orchestration/property/fromYAML.test.ts`
- Delete: `packages/core/metadata/orchestration/property/toXML.ts`
- Delete: `packages/core/metadata/orchestration/metadataItem/fromYAML.ts`
- Delete: `packages/core/metadata/orchestration/metadataItem/toXML.ts`
- Delete: `packages/core/metadata/orchestration/metadataItem/registerImportFromYAML.ts`
- Delete: `packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts`
- Delete: `packages/core/metadata/orchestration/metadataCollection/fromYAML.ts`
- Delete: `packages/core/metadata/orchestration/metadataCollection/toXML.ts`
- Delete: `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`
- Delete: `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`
- Delete: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Delete: `packages/core/metadata/forms/elements/orchestration/fromYAML.ts`
- Delete: `packages/core/metadata/forms/elements/orchestration/toXML.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAML.test.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/tests/appliedObject/importAppliedObjectFromYAML.ts`
- Modify: `packages/core/tests/appliedObject/exportAppliedObjectToXML.ts`

**Interfaces:**

- Consumes: all direct paths from Tasks 1–11.
- Produces: compile-time and source-boundary proof that only atom-specific `fromYAML`/`toXML` remain.

- [ ] **Step 1: Strengthen the boundary test before deletion**

```ts
const forbiddenSymbols = [
  "importPropertiesFromYAML",
  "exportPropertiesToXML",
  "importPropertyFromYAML",
  "exportPropertyToXML",
  "importMetadataItemFromYAML",
  "exportMetadataItemToXML",
  "importMetadataItemCollectionFromYAMLAsArray",
  "importMetadataItemCollectionFromYAMLAsRecord",
  "exportMetadataCollectionToXML",
]

for (const symbol of forbiddenSymbols) {
  expect(allMetadataSources).not.toContain(symbol)
}
```

Also assert that sync and operations source files do not contain a `model` field, `modelStub`, or imports from deleted modules.

- [ ] **Step 2: Run the boundary test and capture all remaining consumers**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts`

Expected: FAIL with a finite list of tests/helpers or registrations not migrated in earlier tasks.

- [ ] **Step 3: Move legitimate atomic tests to atom-specific handlers**

Tests that only verify `I8nText`, enumerations, references, dates or other leaves must call the registered concrete handler through `getTypeRule(type, "importFromYAML")` or `getTypeRule(type, "exportToXML")`. Tests of rules-objects move to `fromYAMLToXML.test.ts`, metadata-item, collection or form direct tests.

- [ ] **Step 4: Remove model-backed registrations**

`registerMetadataItemRule` and `registerMetadataItemCollectionRule` must register schema, XML → YAML, YAML → XML nested descriptor and atomic YAML export required by reverse operations. They must not register model-producing `importFromYAML` or model-consuming `exportToXML` for a rules-object or collection.

- [ ] **Step 5: Delete the legacy files and exports**

Remove the files listed above, their barrel exports and unused types such as model-based `ExportToXMLFunctionNew.metadataItem`. Preserve type-specific `fromYAML.ts`/`toXML.ts` files that transform a single atomic value and do not recurse through `MetadataItemRule.properties`.

- [ ] **Step 6: Verify no forbidden symbol remains**

Run:

```bash
rg -n "importPropertiesFromYAML|exportPropertiesToXML|importPropertyFromYAML|exportPropertyToXML|importMetadataItemFromYAML|exportMetadataItemToXML|importMetadataItemCollectionFromYAMLAs(Array|Record)|exportMetadataCollectionToXML" packages/core
```

Expected: no output.

- [ ] **Step 7: Run type checking and orchestration tests**

Run: `pnpm --filter @nakidka/core exec tsc --noEmit`

Expected: exit 0.

Run: `pnpm --filter @nakidka/core exec vitest run metadata/orchestration metadata/importBoundaries.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit the breaking internal cleanup**

```bash
git add packages/core
git commit -m "refactor!: :recycle: удалить модельную YAML/XML-оркестрацию" -m "BREAKING CHANGE: общие property-level API fromYAML и toXML удалены; используйте прямой fromYAMLToXML или атомарные обработчики типа."
```

---

### Task 13: Архитектура, профиль и полная проверка

**Files:**

- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`
- Modify: `docs/superpowers/specs/2026-07-22-direct-yaml-to-xml-design.md` only if implementation reveals a factual mismatch.

**Interfaces:**

- Consumes: completed direct implementation.
- Produces: documented one-pass contract, profile evidence and green repository test suite.

- [ ] **Step 1: Add an observable traversal profile**

Extend the existing full-sync assignment profile with counters returned by direct conversion:

```ts
interface YAMLToXMLProfile {
  propertyCount: number
  nestedItemCount: number
  atomicFromYAMLCount: number
  atomicToXMLCount: number
  rulesPassCount: 1
}
```

The focused test must assert `rulesPassCount === 1` for owner, form and configuration assignments and must assert that no property path is visited twice in one YAML object.

- [ ] **Step 2: Run the profile-focused tests**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/fullSyncToXml/writeAssignment.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts`

Expected: PASS.

- [ ] **Step 3: Update architecture tables**

In `.agents/architecture.md` change «Построение и запись XML» to state that worker directly reads YAML by `rules.ts`, creates all XML outputs in one traversal, invokes type-specific atomic `fromYAML`/`toXML`, and never creates a metadata-model. Remove synchronization, rename and reference search from «Построение модели». Add the direct traversal result to the artifact table only if it crosses a module or worker boundary; do not document a private temporary object as an artifact.

Remove any restriction in `.agents/restrictions.md` that says synchronization requires a model. Keep the existing restrictions about non-transactional output and non-empty target directories unchanged.

- [ ] **Step 4: Run formatting and static checks**

Run: `pnpm exec prettier --check .agents/architecture.md .agents/restrictions.md docs/superpowers/specs/2026-07-22-direct-yaml-to-xml-design.md packages/core/metadata`

Expected: all matched files use Prettier formatting.

Run: `pnpm --filter @nakidka/core exec tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Run the complete repository suite**

Run: `pnpm test`

Expected: every package passes; the baseline before implementation was 845 test files and 5634 tests.

- [ ] **Step 6: Inspect final boundaries and worktree state**

Run:

```bash
rg -n "importPropertiesFromYAML|exportPropertiesToXML|importPropertyFromYAML|exportPropertyToXML|importMetadataItemFromYAML|exportMetadataItemToXML" packages/core
git diff --check
git status --short
```

Expected: the symbol search is empty, `git diff --check` is silent, and status contains only intended implementation/documentation changes.

- [ ] **Step 7: Commit architecture and verification coverage**

```bash
git add .agents packages/core docs/superpowers/specs/2026-07-22-direct-yaml-to-xml-design.md
git commit -m "docs: :memo: закрепить прямую синхронизацию YAML в XML"
```
