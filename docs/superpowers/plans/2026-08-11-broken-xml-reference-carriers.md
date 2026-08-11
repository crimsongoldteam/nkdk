# Broken XML Reference Carriers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Импортировать битые `DesignTimeRef`, `MDObjectRef` и локальные ссылки форм как строгие значения `!xml`, точно экспортировать их обратно в XML и исключать только из смысловой проверки ссылок.

**Architecture:** Нейтральный реестр `BrokenXMLReferenceCarrier` входит в состав `MetadataRulesDefinition` и вызывается общим property runtime после обычного XML → YAML и вокруг обычного YAML → XML. Конкретные кодеки живут в `@nkdk/rules`: они распознают XML-форму, помечают только соответствующие scalar-узлы, проверяют payload и восстанавливают исходный XML; validation и обход ссылок спрашивают тот же реестр, не зная конкретных объектов.

**Tech Stack:** TypeScript 7, js-yaml 5, TypeBox 1.3, Vitest 4, pnpm.

## Global Constraints

- `!xml` разрешён только для битых ссылок из `.agents/xml-anomalies.md`.
- Поддерживаются ровно три класса: `DesignTimeRef UUID`, `MDObjectRef UUID` и зарегистрированные локальные ссылки форм.
- Обычные именованные ссылки и значения, восстанавливаемые по индексам, не получают `!xml`.
- Неверный payload `!xml` отклоняется; тег не отключает синтаксическую, структурную и нессылочную validation.
- Схемы подсказок не показывают транспортные варианты; они добавляются только во внутренний validation graph.
- Транспортные значения не попадают в граф ссылок, поиск ссылок и план переименования.
- Не хранить битые ссылки в `.nkdk`-снимке и не читать reference XML для их восстановления.
- Не добавлять частные условия по объектам в `validation`, `project`, `projectState` и другие нейтральные слои.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не изменять существующие XML-фикстуры; новые регрессионные фикстуры копировать из исследованных XML-фрагментов.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base origin/develop`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Нейтральный договор и составление реестра переносчиков

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/testSupport.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/rule-kit.ts`
- Test: `packages/rules/metadata/ruleRuntime/definition/composeMetadataRules.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`

**Interfaces:**
- Produces: `BrokenXMLReferenceCarrierRegistration` с уникальным `name`, ключом `propertyType`, импортным, экспортным и validation-обработчиками.
- Produces: `BrokenXMLReferenceImportResult = { yamlValue: unknown; taggedPaths: readonly YamlPath[] }`.
- Produces: `BrokenXMLReferenceCarrierRegistry` с `normalizeImportedBrokenXMLReferences`, `prepareBrokenXMLReferenceExport`, `patchExportedBrokenXMLReferences`, `brokenXMLReferenceValidationSchema` и `isTransportedBrokenXMLReference`.
- Preserves: конкретные UUID/форматы остаются за пределами `@nkdk/runtime`.

- [ ] **Step 1: Написать падающие тесты составления**

В `composeMetadataRules.test.ts` добавить две регистрации и проверить сохранение порядка:

```ts
const firstCarrier = carrier("first", "MetadataValue")
const secondCarrier = carrier("second", "DataPath")

const composed = composeMetadataRules(
  defineMetadataRules({ ...emptyMetadataRules, brokenXMLReferenceCarriers: [firstCarrier] }),
  defineMetadataRules({ ...emptyMetadataRules, brokenXMLReferenceCarriers: [secondCarrier] }),
)

expect(composed.brokenXMLReferenceCarriers).toEqual([firstCarrier, secondCarrier])
```

В `propertyRuleRegistrySet.test.ts` проверить выбор по `propertyType`, отсутствие
совпадения для другого типа и ошибку двух обработчиков, одновременно принявших
одно значение.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/definition/composeMetadataRules.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts \
  --project unit
```

Expected: FAIL — поля `brokenXMLReferenceCarriers` и методов реестра ещё нет.

- [ ] **Step 3: Описать нейтральный интерфейс**

В новом runtime-файле определить договор без конкретных форматов:

```ts
export interface BrokenXMLReferenceCarrierRegistration {
  readonly name: string
  readonly propertyType: string
  tryImport(params: {
    readonly rule: PropertyRule
    readonly xmlValue: unknown
    readonly yamlValue: unknown
  }): BrokenXMLReferenceImportResult | undefined
  prepareExport(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly isTagged: (path: YamlPath) => boolean
  }): { readonly yamlValue: unknown; readonly transportedPaths: readonly YamlPath[] } | undefined
  patchExportedXML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly xmlValue: unknown
    readonly transportedPaths: readonly YamlPath[]
  }): unknown
  validationSchema(params: {
    readonly base: TSchema
    readonly validationGraph: boolean
  }): TSchema
  matchesTaggedYAML(params: {
    readonly rule: PropertyRule
    readonly yamlValue: unknown
    readonly path: YamlPath
    readonly isTagged: (path: YamlPath) => boolean
  }): boolean
}

export interface BrokenXMLReferenceImportResult {
  readonly yamlValue: unknown
  readonly taggedPaths: readonly YamlPath[]
}
```

Реестр группирует регистрации по `propertyType`. Если одна операция получает
два успешных совпадения, бросать ошибку с именами обеих регистраций — порядок
слоёв не должен молча выбирать семантику.

- [ ] **Step 4: Включить регистрации в определение rules**

Добавить в `MetadataRulesDefinition`:

```ts
readonly brokenXMLReferenceCarriers: readonly BrokenXMLReferenceCarrierRegistration[]
```

В `emptyMetadataRules` задать `[]`, а в `composeMetadataRules` объединять массивы:

```ts
brokenXMLReferenceCarriers: [
  ...result.brokenXMLReferenceCarriers,
  ...layer.brokenXMLReferenceCarriers,
],
```

- [ ] **Step 5: Подключить реестр к property runtime**

В `createPropertyRuleRegistrySet` создать один immutable registry view и
делегировать его методы через `PropertyRuleRegistrySet`. Те же методы добавить в
`PropertyRuleExecution`, чтобы import, export, schema и validation использовали
один собранный экземпляр.

- [ ] **Step 6: Проверить слой**

Run:

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/definition/composeMetadataRules.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts \
  --project unit
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts \
  packages/runtime/metadata/ruleRuntime/definition/contracts.ts \
  packages/runtime/metadata/ruleRuntime/definition/testSupport.ts \
  packages/runtime/metadata/ruleRuntime/definition/composeMetadataRules.ts \
  packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts \
  packages/runtime/metadata/ruleRuntime/property/fn.ts packages/runtime/rule-kit.ts \
  packages/rules/metadata/ruleRuntime/definition/composeMetadataRules.test.ts \
  packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
git commit -m "feat: :sparkles: добавить реестр битых XML-ссылок" \
  -m "Общий runtime получает нейтральный составляемый договор переносчиков без знаний о конкретных объектах и XML-форматах."
```

---

### Task 2: Общие точки XML ↔ YAML и внутренняя JSON Schema

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toJSONSchema.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**
- Consumes: реестр Task 1 через `PropertyRuleExecution`.
- Produces: автоматические scalar-tag marks по относительным путям, включая индексы коллекций.
- Produces: export pipeline `prepareExport → ordinary conversion → patchExportedXML`.
- Produces: transport-схемы только при `validationPropertyRefs: true`.

- [ ] **Step 1: Добавить тест импорта scalar и элемента массива**

Зарегистрировать тестовый переносчик `ReferenceProbe` и проверить:

```ts
expect(yaml).toEqual({ Ссылка: "!xml raw", Ссылки: ["Обычная", "!xml broken"] })
expect(yamlScalarTagAt(yaml, "Ссылка")).toBe("xml")
expect(yamlScalarTagAt(yaml.Ссылки, 0)).toBeUndefined()
expect(yamlScalarTagAt(yaml.Ссылки, 1)).toBe("xml")
```

Отдельный случай с тем же текстом, но несовпавшим XML, должен остаться без
scalar-tag.

- [ ] **Step 2: Добавить тест экспорта и ошибки грамматики**

Проверить, что обычная часть конвертируется штатным обработчиком, после чего
переносчик заменяет только помеченный XML-узел. Для неверного payload ожидать
`YAMLImportError` с путём `Ссылки/1`.

- [ ] **Step 3: Добавить schema-тест**

Тестовый переносчик должен возвращать:

```ts
validationSchema: ({ base, validationGraph }) => validationGraph
  ? Type.Union([base, Type.String({ pattern: "^!xml raw$" })])
  : base
```

Проверить, что внутренняя схема принимает `!xml raw`, отклоняет `!xml other`, а
схема подсказок не содержит `!xml`.

- [ ] **Step 4: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts \
  --project unit
```

Expected: FAIL — pipeline ещё не вызывает новый реестр.

- [ ] **Step 5: Встроить импортный результат**

После вычисления обычного `yamlValue` вызвать
`normalizeImportedBrokenXMLReferences`. Использовать
возвращённый `yamlValue` для `getExportToYAMLResult` и коллектора фактов. После
записи свойства применить пути:

```ts
for (const path of transported.taggedPaths) {
  markScalarAtRelativePath(result, propertyRule.yaml!, path, "xml")
}
```

Пустой путь помечает само свойство; путь `[1]` — второй элемент массива.

- [ ] **Step 6: Встроить экспортный результат**

До `importFromYAML` вызвать `prepareBrokenXMLReferenceExport` и передать
обычному обработчику его `yamlValue`. После `exportToXML` вызвать
`patchExportedBrokenXMLReferences` и только затем
применять default/reference merge. Диагностику переносчика оборачивать
существующим `toYAMLImportError` с точным YAML-путём.

- [ ] **Step 7: Встроить validation-схему**

В `withExplicitXMLValidationValue` после существующего реестра
`ExplicitXMLProperty` применить carrier schema:

```ts
return execution?.brokenXMLReferenceValidationSchema({
  propertyType: params.rule.type,
  rule: params.rule,
  base: schema,
  validationGraph: params.context.exportToJSONSchema?.validationPropertyRefs === true,
}) ?? schema
```

Не добавлять отдельные условия по конкретным типам.

- [ ] **Step 8: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts \
  --project unit
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

```bash
git add packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts \
  packages/runtime/metadata/ruleRuntime/property/toJSONSchema.ts \
  packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  packages/rules/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
git commit -m "feat: :sparkles: провести битые ссылки через XML и YAML" \
  -m "Property runtime применяет зарегистрированный переносчик симметрично при импорте, экспорте и построении внутренней validation-схемы."
```

---

### Task 3: Переносчик `DesignTimeRef UUID`

**Files:**
- Create: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/fromYAML.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Test: `packages/rules/metadata/commonObjects/metadataValue/fromXML.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataValue/fromYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataValue/toXML.test.ts`
- Test: `packages/rules/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Produces: `brokenDesignTimeRefRules` с переносчиком для `propertyType: "MetadataValue"`.
- Grammar: два канонических UUID через точку, без пробелов и дополнительных сегментов.
- Preserves: `!xml DesignTimeRef`, именованные ссылки и обычные MetadataValue.

- [ ] **Step 1: Добавить параметризованные падающие тесты грамматики**

```ts
it.each([
  [UUID_PAIR, true],
  [`${UUID_PAIR}.extra`, false],
  [UUID, false],
  [`${UUID}.${UUID.slice(0, -1)}`, false],
])("распознаёт DesignTimeRef UUID %s: %s", (value, expected) => {
  expect(matchBrokenDesignTimeRef(value)).toBe(expected)
})
```

Добавить XML → YAML ожидание `!xml UUID.UUID` со scalar-tag и YAML → XML
ожидание `{ "_xsi:type": "xr:DesignTimeRef", "#text": UUID_PAIR }`.

- [ ] **Step 2: Добавить регрессии соседних форм**

Проверить, что `<FillValue xsi:type="xr:DesignTimeRef"/>` остаётся
`!xml DesignTimeRef`, а `Catalog.Товары.EmptyRef` остаётся обычной ссылкой.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataValue/fromXML.test.ts \
  metadata/commonObjects/metadataValue/fromYAML.test.ts \
  metadata/commonObjects/metadataValue/toXML.test.ts \
  metadata/importFromXml/fillValueImport.test.ts \
  --project unit
```

Expected: FAIL — UUID-пара ещё не получает tag автоматически.

- [ ] **Step 4: Реализовать и зарегистрировать переносчик**

Использовать одну строгую константу:

```ts
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
export const DESIGN_TIME_REF_UUID_PATTERN = new RegExp(`^${UUID}\\.${UUID}$`, "i")
```

`tryImport` проверяет одновременно `_xsi:type` и `#text`; `prepareExport`
принимает только фактически тегированный scalar; `patchExportedXML` возвращает
типизированный XML. Подключить `brokenDesignTimeRefRules` в `legacyCoreRules`.

- [ ] **Step 5: Сохранить существующий fromYAML путь**

В `MetadataValue.fromYAML` оставить распознавание UUID-пары как `ref`, но
переносчик должен вызываться раньше и проверять scalar-tag. Это позволяет
обычному MetadataValue exporter построить базовый XML, который затем сверяется и
патчится переносчиком.

- [ ] **Step 6: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataValue/fromXML.test.ts \
  metadata/commonObjects/metadataValue/fromYAML.test.ts \
  metadata/commonObjects/metadataValue/toXML.test.ts \
  metadata/importFromXml/fillValueImport.test.ts \
  --project unit
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

```bash
git add packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts \
  packages/rules/metadata/commonObjects/metadataValue/fromYAML.ts \
  packages/rules/metadata/commonObjects/metadataValue/fromXML.test.ts \
  packages/rules/metadata/commonObjects/metadataValue/fromYAML.test.ts \
  packages/rules/metadata/commonObjects/metadataValue/toXML.test.ts \
  packages/rules/metadata/importFromXml/fillValueImport.test.ts \
  packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: переносить битый DesignTimeRef через !xml"
```

---

### Task 4: Переносчик `MDObjectRef UUID` в коллекции ссылок

**Files:**
- Create: `packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/fromYAML.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Test: `packages/rules/metadata/commonObjects/metadataRef/fromXML.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataRef/fromYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataRef/toXML.test.ts`
- Test: `packages/rules/metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.test.ts`

**Interfaces:**
- Produces: `brokenMDObjectRefRules` для элементов `MetadataItemLinks`.
- Grammar: один канонический UUID.
- Preserves: порядок смешанной коллекции и именованные `MDObjectRef`.

- [ ] **Step 1: Добавить падающий тест смешанной коллекции**

```ts
expect(imported).toEqual([
  "Catalog.Товары",
  `!xml ${UUID}`,
  "Document.Заказ",
])
expect(yamlScalarTagAt(imported, 0)).toBeUndefined()
expect(yamlScalarTagAt(imported, 1)).toBe("xml")
```

Обратный тест должен получить три `xr:Item` в том же порядке; только второй
содержит UUID, но все элементы имеют `xsi:type="xr:MDObjectRef"` по обычному
договору `MetadataItemLinks`.

- [ ] **Step 2: Добавить отрицательные границы**

Проверить, что UUID без `xsi:type="xr:MDObjectRef"`, неполный UUID и
именованный `Catalog.Товары` не получают `!xml`. Tagged UUID с лишним символом
должен быть отклонён до экспорта.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataRef/fromXML.test.ts \
  metadata/commonObjects/metadataRef/fromYAML.test.ts \
  metadata/commonObjects/metadataRef/toXML.test.ts \
  metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.test.ts \
  --project unit
```

Expected: FAIL — UUID-элемент не помечается и теряется при fromYAML.

- [ ] **Step 4: Реализовать коллекционный переносчик**

`tryImport` сопоставляет `xmlValue["xr:Item"]` с обычным YAML-массивом и
возвращает `taggedPaths: [[index], ...]`. `prepareExport` заменяет только
помеченные элементы на payload, сохраняя остальные значения и индексы.

В `importMetadataItemLinksFromYAML` не фильтровать зарегистрированный UUID:

```ts
return data.flatMap((item, index) => {
  if (isRegisteredBrokenReferenceItem({ rule, data, index })) {
    return [xmlScalarTagPayload(item)]
  }
  const imported = importMetadataItemLinkFromYAML(context, rule, item, owner)
  return imported === undefined ? [] : [imported]
})
```

- [ ] **Step 5: Зарегистрировать и проверить слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataRef/fromXML.test.ts \
  metadata/commonObjects/metadataRef/fromYAML.test.ts \
  metadata/commonObjects/metadataRef/toXML.test.ts \
  metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.test.ts \
  --project unit
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.ts \
  packages/rules/metadata/commonObjects/metadataRef/fromYAML.ts \
  packages/rules/metadata/commonObjects/metadataRef/fromXML.test.ts \
  packages/rules/metadata/commonObjects/metadataRef/fromYAML.test.ts \
  packages/rules/metadata/commonObjects/metadataRef/toXML.test.ts \
  packages/rules/metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.test.ts \
  packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: переносить битый MDObjectRef через !xml"
```

---

### Task 5: Переносчики локальных ссылок управляемой формы

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/__fixtures__/brokenLocalReferences.xml`
- Modify: `packages/rules/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/propertyTypeRules.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Produces: `brokenLocalFormReferenceRules`.
- Produces: `LOCAL_FORM_REFERENCE_PATTERNS` с отдельной грамматикой для восьми XML-элементов.
- Preserves: смысловые команды, пути данных, группы команд и обычные строки.

- [ ] **Step 1: Закрепить восемь грамматик**

В новом unit-тесте использовать наблюдавшиеся значения:

```ts
it.each([
  ["Command", "3", true],
  ["Command", `0:${UUID}`, true],
  ["CommandName", `1:${UUID}`, true],
  ["Field", `1/0:${UUID}/0:${UUID}`, true],
  ["DataPath", `1/0:${UUID}`, true],
  ["xr:DataPath", `342:${UUID}/15`, true],
  ["CommandGroup", UUID, true],
  ["GroupList", `5:${UUID}`, true],
  ["UserSettingsGroup", `1:${UUID}`, true],
  ["CommandName", "Form.Command.Записать", false],
  ["DataPath", "Объект.Код", false],
  ["CommandGroup", "FormNavigationPanelGoTo", false],
])("%s распознаёт %s: %s", (element, value, expected) => {
  expect(isBrokenLocalFormReference(element, value)).toBe(expected)
})
```

Добавить отрицательные варианты с пробелами, неполным UUID, двойным двоеточием
и лишним сегментом.

- [ ] **Step 2: Добавить падающий round-trip тест формы**

В `__fixtures__/brokenLocalReferences.xml` собрать минимальную управляемую форму,
скопировав по одному фрагменту каждого формата из
`/Users/nikita/git/round-trip-compact`. Проверить, что XML → YAML
ставит `!xml` на всех восьми свойствах, а YAML → XML без reference XML возвращает
исходный текст каждого узла.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  --project unit --project integration
```

Expected: FAIL — технические строки пока экспортируются как обычные либо не
проходят преобразование.

- [ ] **Step 4: Реализовать scalar-регистрации**

Создать неизменяемую таблицу:

```ts
export const LOCAL_FORM_REFERENCE_PATTERNS = {
  Command: new RegExp(`^(?:\\d+|\\d+:${UUID})$`, "i"),
  CommandName: new RegExp(`^\\d+:${UUID}$`, "i"),
  Field: new RegExp(`^\\d+/\\d+:${UUID}(?:/\\d+:${UUID})*$`, "i"),
  DataPath: new RegExp(`^\\d+/\\d+:${UUID}(?:/\\d+:${UUID})*$`, "i"),
  "xr:DataPath": new RegExp(`^\\d+:${UUID}/\\d+$`, "i"),
  CommandGroup: new RegExp(`^${UUID}$`, "i"),
  GroupList: new RegExp(`^\\d+:${UUID}$`, "i"),
  UserSettingsGroup: new RegExp(`^\\d+:${UUID}$`, "i"),
} as const
```

Регистрации ограничивать `propertyType` и фактическим XML-ключом из
property plan. Не регистрировать общий `string` без XML-ключа.

- [ ] **Step 5: Подключить составной `CommandInterface`**

В его fromYAML/toXML использовать тот же codec для полей `Command` и
`CommandGroup`. Не добавлять второй набор regex. Смешанные обычные и
транспортные элементы сохраняют порядок существующей коллекции.

- [ ] **Step 6: Проверить соседние обычные значения**

Расширить существующие тесты ожиданиями, что:

```ts
expect(roundTrip("Form.Command.Записать")).toBe("Form.Command.Записать")
expect(roundTrip("Объект.Код")).toBe("Объект.Код")
expect(roundTrip("FormNavigationPanelGoTo")).toBe("FormNavigationPanelGoTo")
```

- [ ] **Step 7: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/forms/commonObjects/commandInterface/fromYAML.test.ts \
  metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  --project unit --project integration
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

```bash
git add packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts \
  packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  packages/rules/metadata/forms/clientApplicationForm/__fixtures__/brokenLocalReferences.xml \
  packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts \
  packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  packages/rules/metadata/forms/commonObjects/commandInterface/fromYAML.ts \
  packages/rules/metadata/forms/commonObjects/commandInterface/toXML.ts \
  packages/rules/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts \
  packages/rules/metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  packages/rules/metadata/forms/clientApplicationForm/propertyTypeRules.ts \
  packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: переносить битые ссылки формы через !xml"
```

---

### Task 6: Точечное исключение из semantic validation и графа ссылок

**Files:**
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/validation/validationRegistrySet.ts`
- Test: `packages/rules/metadata/validation/structuralReferences.test.ts`
- Test: `packages/rules/metadata/validation/yamlFactExtractor.test.ts`
- Test: `packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Test: `packages/rules/metadata/validation/validateForm.test.ts`
- Test: `packages/rules/metadata/operations/findMetadataReferences.test.ts`

**Interfaces:**
- Consumes: `isTransportedBrokenXMLReference` из общего реестра.
- Produces: отсутствие pending reference/DataPath check только для валидного зарегистрированного scalar.
- Preserves: diagnostics обычной битой ссылки, неверного `!xml` и всех нессылочных правил.

- [ ] **Step 1: Добавить падающие validation-тесты**

Для каждого класса проверить три соседних входа:

```ts
expect(diagnostics(taggedValid)).toEqual([])
expect(diagnostics(ordinaryBroken)).toContainEqual(expect.objectContaining({ source: "structure" }))
expect(diagnostics(taggedInvalid)).toContainEqual(expect.objectContaining({ source: "schema" }))
```

Для формы отдельно проверить, что `ПутьКДанным: !xml 1/0:<UUID>` не создаёт
`DataPathValidationPendingCheck`, а обычный несуществующий `Объект.НетПоля`
продолжает диагностироваться.

- [ ] **Step 2: Добавить тест графа ссылок**

`collectStructuralYamlReferences` и `findMetadataReferences` не должны вернуть
транспортный UUID или локальный payload. В той же фикстуре обычная ссылка должна
остаться в результате, чтобы тест не проходил из-за пустого обхода.

- [ ] **Step 3: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/structuralReferences.test.ts \
  metadata/validation/yamlFactExtractor.test.ts \
  metadata/validation/yamlFactExtractor.fillValue.test.ts \
  metadata/validation/validateForm.test.ts \
  metadata/operations/findMetadataReferences.test.ts \
  --project unit
```

Expected: FAIL — tagged transport всё ещё материализуется как semantic reference
или DataPath check.

- [ ] **Step 4: Исключить transport в общем структурном обходе**

Расширить `StructuralReferenceRuntime` нейтральным запросом:

```ts
readonly isTransportedBrokenXMLReference: (params: {
  readonly rule: StructuralReferencePropertyRule
  readonly parent: unknown
  readonly key: string | number
  readonly value: unknown
  readonly path: readonly (string | number)[]
}) => boolean
```

В `collectObjectReferences` проверять его до `valueFromYAML` и не вызывать
reference handlers для совпавшего scalar. Для коллекций реестр фильтрует только
помеченные индексы; обычные элементы всё ещё обходятся.

- [ ] **Step 5: Исключить локальный DataPath check**

В `collectRuleDataPathChecks` заменить безусловную обработку tagged DataPath:

```ts
if (tagged && runtime?.rules.execution.isTransportedBrokenXMLReference({
  rule,
  yamlValue: rawValue,
  parent: params.owner,
  key: rule.yaml,
  path: [],
})) continue
```

Иной tagged DataPath, используемый для сохранения внутреннего пути, продолжает
существующий путь `nameMode: "internal"`.

- [ ] **Step 6: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/structuralReferences.test.ts \
  metadata/validation/yamlFactExtractor.test.ts \
  metadata/validation/yamlFactExtractor.fillValue.test.ts \
  metadata/validation/validateForm.test.ts \
  metadata/operations/findMetadataReferences.test.ts \
  --project unit
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

```bash
git add packages/runtime/metadata/validation/structuralReferences.ts \
  packages/rules/metadata/validation/structuralReferences.test.ts \
  packages/rules/metadata/validation/yamlFactExtractor.ts \
  packages/rules/metadata/validation/validationRegistrySet.ts \
  packages/rules/metadata/validation/yamlFactExtractor.test.ts \
  packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts \
  packages/rules/metadata/validation/validateForm.test.ts \
  packages/rules/metadata/operations/findMetadataReferences.test.ts
git commit -m "fix: :bug: не валидировать транспортные битые ссылки" \
  -m "Зарегистрированный !xml исключается только из semantic reference checks и графа ссылок; schema и остальные проверки остаются активными."
```

---

### Task 7: Операционный round-trip и финальная проверка договора

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/validation/serializedYamlValidation.integration.test.ts`
- Verify: `.agents/xml-anomalies.md`
- Verify: `docs/superpowers/specs/2026-08-11-broken-xml-reference-carriers-design.md`

**Interfaces:**
- Consumes: все три переносчика и validation Task 1–6.
- Produces: проверенный XML → YAML → XML без reference XML на уровне операций.
- Produces: одинаковый результат validation для импортированного и повторно прочитанного YAML.

- [ ] **Step 1: Добавить падающий импортный сценарий**

В самих тестах собрать временные минимальные XML-каталоги из строк: объект с
`DesignTimeRef UUID`, подсистему с `MDObjectRef UUID` и форму на основе
`clientApplicationForm/__fixtures__/brokenLocalReferences.xml`. Не добавлять
операционные фикстуры сверх файла из Task 5. После второго прохода прочитать YAML
и проверить локальный тег текстом:

```ts
expect(yamlText).toContain(`ЗначениеЗаполнения: !xml ${UUID_PAIR}`)
expect(yamlText).toContain(`- !xml ${UUID}`)
expect(yamlText).toContain(`ИмяКоманды: !xml 1:${UUID}`)
```

- [ ] **Step 2: Добавить падающий экспортный сценарий**

Экспортировать импортированный проект в пустой каталог без reference XML и
сравнить конкретные узлы после повторного XML parse:

```ts
expect(exportedFillValue).toEqual({ "_xsi:type": "xr:DesignTimeRef", "#text": UUID_PAIR })
expect(exportedSubsystemItem).toEqual({ "_xsi:type": "xr:MDObjectRef", "#text": UUID })
expect(exportedCommandName).toBe(`1:${UUID}`)
```

- [ ] **Step 3: Закрепить одинаковую validation сериализованного YAML**

Проверить отсутствие diagnostics для корректных transport-ссылок в
`SerializedYAMLDocument.data` и после `parseMetadataYaml(serialized.text)`, а
также одинаковую schema-ошибку для неверного payload.

- [ ] **Step 4: Запустить интеграционные проверки**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/importFromXml/worker.integration.test.ts \
  metadata/fullSyncToXml/worker.integration.test.ts \
  metadata/validation/serializedYamlValidation.integration.test.ts \
  --project integration
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

- [ ] **Step 5: Сверить реестр аномалий**

Проверить, что каждая регистрация имеет строку в `.agents/xml-anomalies.md`, а
каждая строка про битую ссылку покрыта одним из тестов Task 3–7. Новые места не
добавлять без отдельного согласования.

- [ ] **Step 6: Зафиксировать операционный слой**

```bash
git add packages/rules/metadata/importFromXml/worker.integration.test.ts \
  packages/rules/metadata/fullSyncToXml/worker.integration.test.ts \
  packages/rules/metadata/validation/serializedYamlValidation.integration.test.ts
git commit -m "test: :white_check_mark: закрепить round-trip битых ссылок"
```

- [ ] **Step 7: Выполнить обязательную финальную проверку**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base origin/develop
git diff --check origin/develop...HEAD
```

Expected: все команды завершаются с кодом `0`; архитектурных нарушений и новых
дублей нет.
