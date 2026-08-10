# StandardAttributes `!xml` Marker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять присутствие полностью дефолтной коллекции `StandardAttributes` как `СтандартныеРеквизиты: !xml` и восстанавливать её без reference XML и configuration index.

**Architecture:** Реестр исключительных XML-значений получает отдельную регистрацию по точному `propertyType`; она разрешает только пустой `!xml` и возвращает нейтральное действие `materializeCollection`. Конкретный модуль `StandardAttributeDescriptions` решает, когда импортировать маркер, а общий преобразователь коллекций по этому действию запускает существующий `completeItemNames` даже для пустого YAML.

**Tech Stack:** TypeScript, Vitest, TypeBox, YAML scalar tags, metadata ruleRuntime.

## Global Constraints

- Новое применение `!xml` разрешено только для свойства точного типа `StandardAttributeDescriptions` и только с пустым payload.
- Отсутствующее свойство не создаёт `StandardAttributes`; обычное отображение сохраняет действующую семантическую обработку.
- `ExtDimension*`, reference-импорт и configuration index не меняют поведение.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule`, `StandardAttributeDescriptionsPropertyRule` и параметры построителей rules.ts.
- Нейтральные слои не содержат проверок конкретного `itemType`, YAML-имени или XML-корня.
- Внешняя схема подсказок не содержит `!xml`; внутренняя validation-схема принимает только пустой маркер.
- Не изменять существующие XML-фикстуры.

---

### Task 1: Регистрация транспортного действия по типу свойства

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `.agents/architecture.md:143-149`

**Interfaces:**
- Produces: `registerExplicitXMLPropertyType({ propertyType, action: "materializeCollection", yamlValue })`.
- Produces: разрешение регистрации с приоритетом существующей пары `itemType + propertyKey`, затем точного `propertyType`.
- Produces: `ExplicitXMLPropertyAction` с вариантом `{ kind: "materializeCollection" }`.
- Produces: `explicitXMLPropertyValidationMode(itemType, propertyKey, propertyType)` для внутренней схемы.

- [ ] **Step 1: Добавить падающий тест внутренней и внешней схемы**

В `toJSONSchemaExplicitXML.test.ts` импортировать регистрацию `StandardAttributeDescriptions`, собрать правило-владельца с этим типом и проверить сразу три границы:

```ts
const rule = {
  itemType: "ExplicitXMLCollectionSchemaProbe",
  properties: {
    standardAttributes: {
      type: "StandardAttributeDescriptions",
      yaml: "СтандартныеРеквизиты",
      xml: "StandardAttributes",
      standartAttributeNames: { LineNumber: "НомерСтроки" },
    },
  },
} as const satisfies MetadataItemRule

expect(validation.Check({ СтандартныеРеквизиты: "!xml" })).toBe(true)
expect(validation.Check({ СтандартныеРеквизиты: "!xml payload" })).toBe(false)
expect(JSON.stringify(externalProperties)).not.toContain("!xml")
```

Для незарегистрированного типа оставить отрицательную проверку `"!xml"`, чтобы регистрация не стала глобальной.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

Expected: FAIL, потому что `registerExplicitXMLPropertyType` ещё не экспортируется и типовая регистрация не участвует в схеме.

- [ ] **Step 3: Реализовать узкую типовую регистрацию**

В `explicitXMLPropertyRegistry.ts` добавить отдельный тип и отдельную карту, не меняя существующий `ExplicitXMLPropertyRegistration`:

```ts
export interface ExplicitXMLPropertyTypeRegistration {
  readonly action: "materializeCollection"
  readonly propertyType: string
  readonly yamlValue: typeof EMPTY_XML_TAG_VALUE
}

export function registerExplicitXMLPropertyType(
  registration: ExplicitXMLPropertyTypeRegistration
): void
```

Расширить параметры `collectExplicitXMLPropertyActions` описанием `type`, искать регистрацию сначала по `itemType + propertyKey`, затем по `propertyRule.type`, и выдавать `materializeCollection` только когда `yamlScalarTagAt(yaml, yamlKey) === "xml"` и `xmlScalarTagPayload(rawValue) === ""`. Конфликт повторных типовых регистраций обрабатывать так же, как существующие регистрации: идентичная регистрация допустима, различная завершается ошибкой.

В `explicitXMLPropertyValidationMode` добавить параметр `propertyType` и вернуть `"empty"` для типового `materializeCollection`. В `toJSONSchema.ts` передать `params.rule.type`, сохранив внешний режим без изменений.

В `registerCollectionRule.ts` расположить согласованную регистрацию рядом с правилом коллекции:

```ts
registerExplicitXMLPropertyType({
  propertyType: "StandardAttributeDescriptions",
  action: "materializeCollection",
  yamlValue: EMPTY_XML_TAG_VALUE,
})
```

- [ ] **Step 4: Обновить архитектурный договор**

В `.agents/architecture.md` зафиксировать, что фиксированное транспортное действие разрешается либо парой `itemType + propertyKey`, либо точным `propertyType`; типовая регистрация не даёт права другим типам и не появляется во внешней схеме подсказок.

- [ ] **Step 5: Запустить целевые тесты и проверку дублей**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts`

Expected: PASS; пустой маркер принят только внутренней схемой, payload и незарегистрированный тип отклонены.

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS без новых дублей.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add .agents/architecture.md \
  packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts \
  packages/core/metadata/ruleRuntime/property/toJSONSchema.ts \
  packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts
git commit -m "feat: :sparkles: разрешить !xml по типу свойства" -m "Типовая регистрация нужна для одной коллекции во множестве владельцев без перечисления itemType и без расширения общих типов rules.ts."
```

---

### Task 2: Импорт полностью дефолтной коллекции в пустой `!xml`

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/types.ts`

**Interfaces:**
- Consumes: типовую регистрацию `StandardAttributeDescriptions` из Task 1.
- Produces: `matchExplicitXMLPropertyTypeFromXML({ propertyType, presentInXML, yamlValue })`, возвращающий регистрацию только для её точного пустого sentinel.
- Produces: `StandardAttributeDescriptionsYAML` как обычное отображение либо `typeof EMPTY_XML_TAG_VALUE` на транспортной границе.

- [ ] **Step 1: Изменить проверки импорта на новый договор**

В `fromXMLToYAML.test.ts` заменить ожидание `{}` для `minimal.xml` и `default.xml` на транспортный маркер и проверить его сериализацию:

```ts
expect(result).toEqual({ СтандартныеРеквизиты: EMPTY_XML_TAG_VALUE })
expect(serializeYAMLDocument(result).text).toContain("СтандартныеРеквизиты: !xml")
```

Добавить отдельные границы через существующий тестовый `MetadataItemRule` с одним свойством `standardAttributes`:

```ts
expect(testPropertyFromXMLToYAML({ rule: itemRule, xml: {} }).yaml).toEqual({})

const referenceContext = mockContextFromXML()
const defaultCollection = {
  StandardAttributes: {
    "xr:StandardAttribute": { _name: "LineNumber" },
  },
}
const referenceResult = testPropertyFromXMLToYAML({
  rule: itemRule,
  xml: defaultCollection,
  context: {
    ...referenceContext,
    fromXML: { ...referenceContext.fromXML, forReference: true },
  },
}).yaml
expect(referenceResult).not.toHaveProperty("СтандартныеРеквизиты")
```

Существующую проверку `accounting-ext-dimensions.xml` оставить неизменной: динамические элементы должны остаться отображением, а не маркером.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts`

Expected: FAIL: дефолтная присутствующая коллекция пока удаляется из YAML.

- [ ] **Step 3: Вернуть sentinel только из конкретного обработчика**

В `fromXMLToYAML.ts` сохранить действующий импорт и очистку канонических пустых записей. После очистки вернуть `EMPTY_XML_TAG_VALUE`, только если одновременно выполнены условия:

```ts
if (params.context.fromXML.forReference) return yaml
if (yaml !== undefined && !Array.isArray(yaml) && Object.keys(yaml).length === 0) {
  return EMPTY_XML_TAG_VALUE
}
```

Отсутствующий XML уже приходит как `undefined` и должен завершаться до создания маркера. Непустые `ExtDimension*` остаются в `yaml`, поэтому также не превращаются в sentinel.

- [ ] **Step 4: Пометить возвращённый sentinel настоящим YAML-тегом**

В `explicitXMLPropertyRegistry.ts` добавить `matchExplicitXMLPropertyTypeFromXML`. В `fromXMLToYAML.ts` общего property runtime вызывать его после прямого преобразования типа, когда известен `yamlValue`; совпавшую регистрацию использовать для `exportedYamlValue` и `markYAMLScalarTag`. Существующее раннее сопоставление по `itemType + propertyKey + xmlValue` сохранить без изменения поведения и дать ему приоритет.

В `types.ts` выразить транспортную форму без изменения предметной модели:

```ts
export type StandardAttributeDescriptionsYAML =
  | Partial<Record<StandartAttributeYAML, StandardAttributeDescriptionYAML>>
  | typeof EMPTY_XML_TAG_VALUE
```

- [ ] **Step 5: Запустить тесты импорта и проверки существующих `!xml`**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/ruleRuntime/property/fromXMLToYAML.test.ts yaml/export.test.ts`

Expected: PASS; сериализатор выводит локальный тег, reference-импорт и динамические измерения не меняются.

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS без новых дублей.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/types.ts \
  packages/core/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts
git commit -m "feat: :sparkles: сохранять дефолтные StandardAttributes в !xml" -m "Пустой маркер различает присутствующую дефолтную коллекцию и отсутствующий XML-блок без снимка конфигурации."
```

---

### Task 3: Материализация канонических элементов из маркера

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `{ kind: "materializeCollection" }` из Task 1.
- Produces: внутренний параметр `materializeCanonicalItems?: true` у `convertMetadataCollectionFromYAMLToXML`; это параметр runtime-функции, не поле rules.ts.
- Produces: диагностируемая ошибка для непустого payload и для пустого списка `completeItemNames`.

- [ ] **Step 1: Добавить падающие проверки экспорта**

В `fromYAMLToXML.test.ts` заменить прежнюю проверку «не восстанавливает пустой канонический стандартный реквизит» на round-trip нового договора:

```ts
expect(imported.yaml).toEqual({ СтандартныеРеквизиты: EMPTY_XML_TAG_VALUE })
expect(serializeYAMLDocument(imported.yaml).text).toContain("СтандартныеРеквизиты: !xml")
expect(exported.xml).toEqual(sourceXML)
```

Добавить экспорт YAML, разобранного именно парсером, чтобы отличить тег от строки. Использовать `itemRule` с каноническими именами `Active` и `LineNumber`:

```ts
const yaml = importFromYAML("СтандартныеРеквизиты: !xml\n")
const exported = testPropertyFromYAMLToXML({ rule: itemRule, yaml })
const items = (exported.xml.StandardAttributes as {
  "xr:StandardAttribute": Array<{ _name: string }>
})["xr:StandardAttribute"]
expect(items.map(({ _name }) => _name)).toEqual(["Active", "LineNumber"])
```

Добавить две отрицательные проверки:

```ts
expect(() => testPropertyFromYAMLToXML({
  rule: itemRule,
  yaml: importFromYAML("СтандартныеРеквизиты: !xml payload\n"),
}))
  .toThrow("СтандартныеРеквизиты допускают только пустой !xml")

const ruleWithoutCanonicalNames = {
  ...itemRule,
  properties: {
    standardAttributes: {
      ...itemRule.properties.standardAttributes,
      standartAttributeNames: {},
    },
  },
} as const satisfies MetadataItemRule
expect(() => testPropertyFromYAMLToXML({
  rule: ruleWithoutCanonicalNames,
  yaml: importFromYAML("СтандартныеРеквизиты: !xml\n"),
}))
  .toThrow("не определены канонические стандартные реквизиты")
```

Существующий тест смыслового изменения должен по-прежнему ожидать полный список `Active`, `LineNumber` без маркера.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`

Expected: FAIL: scalar `!xml` пока не запускает дополнение пустой коллекции.

- [ ] **Step 3: Провести транспортное действие до обработчика коллекции**

В `collectExplicitXMLPropertyActions` для зарегистрированного типа различать:

```ts
{ kind: "materializeCollection" }
{ kind: "invalid", message: `${yamlKey} допускает только пустой !xml` }
```

В `convertPropertiesFromYAMLToXML` для `materializeCollection` передавать в collection runtime пустое отображение вместо scalar и `materializeCanonicalItems: true`. Для `invalid` выбрасывать ошибку в диагностическом контексте текущего YAML-свойства. Никакие XML-имена и конкретные `itemType` в общий runtime не добавлять.

- [ ] **Step 4: Дополнить пустую коллекцию существующими каноническими именами**

В `convertMetadataCollectionFromYAMLToXML` передать новый внутренний флаг в `completeCollectionEntries`. Изменить условие вызова существующего `completeItemNames`:

```ts
const shouldComplete = params.entries.length > 0 || params.materializeCanonicalItems === true
const ruleNames = shouldComplete && params.propertyRule !== undefined && params.source !== undefined
  ? params.descriptor.completeItemNames?.({ source: params.source, propertyRule: params.propertyRule }) ?? []
  : []
```

Если запрос на материализацию есть, а `ruleNames.length === 0`, сформировать подпись из `params.propertyRule?.yaml ?? params.propertyRule?.type ?? "коллекция"` и выбросить ошибку «для свойства … не определены канонические стандартные реквизиты». При наличии имён использовать прежние `{ name, yaml: {} }`, `sparseItems` и `omitDefaultsForSparseItems`, чтобы получить именованные элементы без лишних значений и никогда не вывести пустой `<StandardAttributes/>`. Общий runtime формирует сообщение из переданного правила и не знает конкретного YAML-имени.

- [ ] **Step 5: Запустить целевые тесты и проверку типов**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/ruleRuntime/metadataCollection/fromYAMLToXML.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts`

Expected: PASS; маркер создаёт все канонические элементы, обычное отображение и reference-путь не меняются.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS без новых дублей.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts \
  packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts \
  packages/core/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts
git commit -m "feat: :sparkles: восстанавливать StandardAttributes из !xml" -m "Пустой транспортный маркер запускает completeItemNames даже без элементов YAML и не создаёт пустой XML-контейнер."
```

---

### Task 4: Интеграционный round-trip и полная проверка

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`

**Interfaces:**
- Consumes: импорт и экспорт маркера из Tasks 2-3.
- Produces: интеграционная защита независимого присутствия `StandardAttributes` у каждого владельца.

- [ ] **Step 1: Добавить интеграционную проверку двух владельцев**

В `fromYAMLToXML.test.ts` один раз зарегистрировать тестовую record-коллекцию через `registerMetadataItemCollectionRule`. Её item rule содержит `name` и свойство типа `StandardAttributeDescriptions` с `{ LineNumber: "НомерСтроки" }`; owner rule содержит только эту коллекцию под YAML-ключом `ТабличныеЧасти`. Это использует production-обход вложенных metadata-коллекций без прикладного условия в runtime:

```ts
const tabularSectionRule = {
  itemType: "StandardAttributesTabularSectionProbe",
  properties: {
    name: { type: "string", yaml: "Имя", xml: "Name" },
    standardAttributes: {
      type: "StandardAttributeDescriptions",
      yaml: "СтандартныеРеквизиты",
      xml: "StandardAttributes",
      standartAttributeNames: { LineNumber: "НомерСтроки" },
    },
  },
} as const satisfies MetadataItemRule

const tabularSectionsType = "StandardAttributesTabularSectionsProbe" as PropertyRuleType
registerMetadataItemCollectionRule({
  propertyType: tabularSectionsType,
  itemRule: tabularSectionRule,
  xmlElement: "Item",
  keyField: "name",
  recordYamlKeyFromYAML: ({ name }) => name,
})

const ownerRule = {
  itemType: "StandardAttributesOwnerProbe",
  properties: {
    tabularSections: {
      type: tabularSectionsType,
      yaml: "ТабличныеЧасти",
      xml: "TabularSections",
    },
  },
} as MetadataItemRule
```

Исходный XML задать прямо в тесте:

```ts
const sourceXML = {
  TabularSections: {
    Item: [
      { Name: "СНомеромСтроки", StandardAttributes: {
        "xr:StandardAttribute": { _name: "LineNumber" },
      } },
      { Name: "БезНомераСтроки" },
    ],
  },
}
```

Прогнать `testMetadataItemFromXMLToYAML` и `testMetadataItemFromYAMLToXML` с их стандартными контекстами, не передавая ни reference XML, ни configuration index. Проверить:

```ts
const imported = testMetadataItemFromXMLToYAML({ rule: ownerRule, xml: sourceXML })
const exported = testMetadataItemFromYAMLToXML({ rule: ownerRule, yaml: imported.yaml })
const sections = (imported.yaml as {
  ТабличныеЧасти: Record<string, Record<string, unknown>>
}).ТабличныеЧасти
const firstYaml = sections.СНомеромСтроки
const secondYaml = sections.БезНомераСтроки

expect(firstYaml.СтандартныеРеквизиты).toBe(EMPTY_XML_TAG_VALUE)
expect(secondYaml).not.toHaveProperty("СтандартныеРеквизиты")
expect(exported.xml).toEqual(sourceXML)
```

Это единственный новый интеграционный тест: модульные проверки уже покрывают отдельные ветви.

- [ ] **Step 2: Закрепить validation-договор**

В `toJSONSchema.test.ts` взять реальное правило свойства из `MetadataCatalogRules`, поместить его в минимального владельца и получить схему через `exportPropertiesToJSONSchema`:

```ts
const ownerRule = {
  itemType: "StandardAttributesSchemaProbe",
  properties: {
    standardAttributes: MetadataCatalogRules.properties.standardAttributes,
  },
} as const satisfies MetadataItemRule
const validationProperties = exportPropertiesToJSONSchema({
  context: {
    ...mockContext,
    exportToJSONSchema: {
      mode: "inline",
      refs: new Set<string>(),
      validationPropertyRefs: true,
    },
  },
  rule: ownerRule,
})
const internal = compileValidationSchema(Type.Object(validationProperties))
const external = exportPropertiesToJSONSchema({
  context: {
    ...mockContext,
    exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
  },
  rule: ownerRule,
})

expect(internal.Check({ СтандартныеРеквизиты: "!xml" })).toBe(true)
expect(internal.Check({ СтандартныеРеквизиты: "!xml payload" })).toBe(false)
expect(JSON.stringify(external)).not.toContain('"const":"!xml"')
```

В `yamlFactExtractor.fillValue.test.ts` добавить `СтандартныеРеквизиты: !xml` как отдельный случай и проверить отсутствие semantic diagnostics и обхода дочерних стандартных реквизитов:

```ts
const facts = extractFacts("СтандартныеРеквизиты: !xml\n")
expect(facts.diagnostics.filter(({ path }) => path.startsWith("/СтандартныеРеквизиты"))).toEqual([])
expect(facts.pendingReferences.filter(({ yamlPath }) => yamlPath[0] === "СтандартныеРеквизиты")).toEqual([])
```

- [ ] **Step 3: Запустить связанные проверки пакета**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

Expected: PASS.

Run: `pnpm --filter @nkdk/core type-check`

Expected: PASS.

- [ ] **Step 4: Запустить обязательные проверки всего проекта**

Run: `pnpm test`

Expected: все функциональные проверки PASS. Если ограничитель длительности снова завершит команду с кодом 1 при зелёных assertions, зафиксировать точные времена и не объявлять полную проверку успешной.

Run: `pnpm test:architecture:rules`

Expected: PASS.

Run: `pnpm test:architecture`

Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`

Expected: PASS без новых дублей.

- [ ] **Step 5: Запустить исходный полный round-trip**

Run: `git -C /Users/nikita/git/sed_xml status --short -- cf`

Expected: пустой вывод. Если каталог содержит оставшийся диагностический diff, остановиться и запросить разрешение на его сброс: навык `round-trip-yaml` запрещает самостоятельно очищать исходный XML-каталог.

Run: `env NKDK_XML_REPO=/Users/nikita/git/sed_xml ./.agents/skills/round-trip-yaml/round-trip.sh`

Expected: в YAML для полностью дефолтных коллекций появляется `СтандартныеРеквизиты: !xml`; расхождения `StandardAttributes` в `BusinessProcesses/Исполнение.xml` исчезают. Остальные независимые расхождения, если они есть, перечисляются отдельно и не маскируются этой задачей.

- [ ] **Step 6: Зафиксировать интеграционную защиту**

```bash
git add packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts \
  packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts
git commit -m "test: :white_check_mark: защитить round-trip StandardAttributes" -m "Проверка различает присутствующую и отсутствующую дефолтную коллекцию у соседних табличных частей без reference XML и configuration index."
```

---

## Итоговая сверка

- Полностью дефолтная присутствующая коллекция импортируется как пустой `!xml`.
- Отсутствующая коллекция не создаёт YAML-поле и не восстанавливается автоматически.
- Смысловое изменение остаётся обычным отображением и дополняется каноническими соседями.
- `ExtDimension*` остаются явными элементами отображения.
- Пустой маркер разрешён только точному типу и только внутренней схеме; payload отклоняется.
- Материализация без канонических имён завершается диагностикой и не создаёт пустой XML-контейнер.
- Reference XML и configuration index не требуются для нового round-trip.
