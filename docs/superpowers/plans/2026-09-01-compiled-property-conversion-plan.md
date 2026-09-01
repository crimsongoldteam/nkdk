# Compiled Property Conversion Plan Implementation Plan

> **Для исполнителя:** реализовать план последовательно в текущей сессии через
> `executing-plans-with-review`; реализацию выполняет основной исполнитель, а
> отдельный агент подключается только для итоговой независимой проверки.

**Goal:** Ускорить XML → YAML и YAML → XML за счёт одного скомпилированного плана свойства на runtime, затем проверить отдельную пользу прямых преобразователей `SystemEnumeration`, `boolean`, `string` и `number`.

**Architecture:** `PropertyRuleExecutor` владеет `WeakMap<MetadataItemRule, CompiledPropertyPlan>` и пересобирает запись только при изменении revision реестра. Один план содержит общие записи свойств, готовый порядок YAML → XML, XML import views и ссылки на все операции обоих направлений; предметные типы остаются в `@nkdk/rules`. Прямые преобразователи являются необязательным вторым слоем: обычный путь остаётся полным резервным вариантом, а неускорившие кандидаты удаляются.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, compiled MCP stdio, Piscina workers, import-profile, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-01-compiled-property-conversion-plan-design.md`

## Global Constraints

- Comparison base: `be4708d9438dfb1d5955900c881923938e7c016a`.
- Один `CompiledPropertyPlan` обслуживает XML → YAML и YAML → XML в одном `PropertyRuleExecutor`.
- Нейтральный `@nkdk/runtime` не содержит условий по именам `SystemEnumeration`, `boolean`, `string` или `number`.
- План не хранит XML/YAML-деревья, значения объектов, reference XML, контексты заданий, collectors или configuration index.
- Defaults, reference XML, configuration index, audit, journal rollback, metadata targets, annotations, diagnostics и deferred-финализация сохраняют прежний договор.
- XML-фикстуры, публичные XML/YAML и классы `!xml` не меняются.
- Каждый программный слой начинается с падающего теста.
- Измерения выполняются compiled MCP через `.agents/skills/import-profile/import-profile.mjs` на `/Users/nikita/git/round-trip-compact/cf/doc`.
- Подробное профилирование включается только через `NKDK_PROFILE=1`; обычный импорт не получает измерительных вызовов на каждое свойство.
- После каждого завершённого слоя выполняется `pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a`.
- ERP round-trip не входит в реализацию этого плана.

---

### Task 1: Симметричный профиль XML → YAML и исходные измерения

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `.agents/skills/import-profile/import-profile.mjs`
- Modify: `.agents/skills/import-profile/import-profile.test.mjs`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: существующие `DirectImportProfile`, `ValidationProfiler` и формат `[nkdk-profile-step]`.
- Produces: `createDirectImportProfile(options)`, `DirectImportPropertyTypeProfile`, `propertyTypeProfiling`, `propertyTypeProfiles` и `fromXmlPropertyTypes` в результате import-profile.

- [ ] **Step 1: Написать падающий тест профиля всего свойства XML → YAML**

Расширить существующий тест `fromXMLToYAML.test.ts`, чтобы профиль считал inclusive/exclusive время внешнего и вложенного свойства, а выключенный профиль типов оставлял таблицу пустой:

```ts
const profile = createDirectImportProfile({ propertyTypes: true })
importPropertiesFromXMLToYAML({
  context,
  rule: ownerRule,
  sources: [{ context, xml: { Flag: "true" } }],
  yamlPath: [],
  rulePath: [],
  collector: createLocalIndexesCollector(),
  execution,
  profile,
})

expect(profile.propertyTypeProfiles.boolean).toMatchObject({ propertyCount: 1 })
expect(profile.propertyTypeProfiles.boolean!.inclusiveMs).toBeGreaterThanOrEqual(
  profile.propertyTypeProfiles.boolean!.exclusiveMs,
)
```

В `import-profile.test.mjs` добавить строки `XML в YAML PropertyRule exclusive` и проверить сводку:

```js
assert.deepEqual(result.runs[0].fromXmlPropertyTypes, [
  { propertyType: "boolean", propertyCount: 12, inclusiveMs: 4, exclusiveMs: 3 },
])
```

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts
node --test .agents/skills/import-profile/import-profile.test.mjs
```

Expected: FAIL — в `DirectImportProfile` нет `propertyTypeProfiles`, а результат runner не содержит `fromXmlPropertyTypes`.

- [ ] **Step 3: Добавить профиль типов без стоимости в обычном режиме**

В `importYamlTypes.ts` ввести:

```ts
export interface DirectImportPropertyTypeProfile {
  propertyCount: number
  inclusiveMs: number
  exclusiveMs: number
}

export interface DirectImportProfile {
  readonly propertyTypeProfiling: boolean
  propertyTypeProfiles: Record<string, DirectImportPropertyTypeProfile>
  propertyCount: number
  directCount: number
  legacyCount: number
  exportedCount: number
  planningMs: number
  xmlTraversalMs: number
  configurationIndexMs: number
  directInclusiveMs: number
  legacyFromXmlMs: number
  yamlExportMs: number
  defaultMs: number
  outputMs: number
  collectorMs: number
  directByType: Map<string, { count: number; timeMs: number }>
  legacyByType: Map<string, { count: number; timeMs: number }>
}

export const createDirectImportProfile = (
  options: { readonly propertyTypes?: boolean } = {},
): DirectImportProfile => ({
  propertyTypeProfiling: options.propertyTypes === true,
  propertyTypeProfiles: {},
  propertyCount: 0,
  directCount: 0,
  legacyCount: 0,
  exportedCount: 0,
  planningMs: 0,
  xmlTraversalMs: 0,
  configurationIndexMs: 0,
  directInclusiveMs: 0,
  legacyFromXmlMs: 0,
  yamlExportMs: 0,
  defaultMs: 0,
  outputMs: 0,
  collectorMs: 0,
  directByType: new Map(),
  legacyByType: new Map(),
})
```

В `fromXMLToYAML.ts` оборачивать `importMatch` стеком кадров только при
`profile.propertyTypeProfiling === true`. Алгоритм буквально повторяет
`beginPropertyTypeProfile`/`finishPropertyTypeProfile` из YAML → XML: время
вложенного кадра вычитается из exclusive родителя.

Удалить локальную `createDirectImportProfile` из `prepareYaml.ts`. При
`profiler === undefined` передавать в runtime `profile: undefined`, чтобы
обычный импорт вообще не выполнял `performance.now()` для свойств. При наличии
`ValidationProfiler` вызывать общую фабрику с `{ propertyTypes: true }`, а
`recordDirectImportProfile` записывает строки:

```text
step:    XML в YAML PropertyRule inclusive
substep: <propertyType>
step:    XML в YAML PropertyRule exclusive
substep: <propertyType>
```

- [ ] **Step 4: Добавить сводку import-profile**

В `import-profile.mjs` реализовать `summarizeFromXmlPropertyTypes(steps)` по
тому же договору, что `summarizeToXmlPropertyTypes`, и включить результат в
каждый `run`:

```js
fromXmlPropertyTypes: summarizeFromXmlPropertyTypes(steps),
```

- [ ] **Step 5: Запустить целевые тесты и type-check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts
node --test .agents/skills/import-profile/import-profile.test.mjs
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать исходные измерения `doc`**

Run:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /Users/nikita/git/nkdk-yaml/cf \
  --runs 4 --json > /private/tmp/nkdk-compiled-plan-baseline.json
```

Expected: четыре успешных прогона, `errors: 0`, одинаковое число warnings,
`toXmlPropertyTypes` и `fromXmlPropertyTypes` заполнены. Первый прогон считается
cold, следующие три образуют исходную warm-серию.

- [ ] **Step 7: Проверить дубли и закоммитить измерительный слой**

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
git add packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts \
  packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/rules/metadata/importFromXml/prepareYaml.ts \
  packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  .agents/skills/import-profile/import-profile.mjs \
  .agents/skills/import-profile/import-profile.test.mjs
git commit -m "perf: :zap: измерить XML-преобразование по типам"
```

### Task 2: Единый план в `PropertyRuleExecutor`

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleExecutor.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/xmlImportPlan.ts`
- Modify: `packages/runtime/rule-kit.ts`
- Create: `packages/rules/metadata/ruleRuntime/property/compiledPropertyPlan.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/xmlImportPlan.test.ts`

**Interfaces:**
- Consumes: `MetadataItemRule`, `PropertyRuleRegistrySet.revision()`, `getTypeRule`, `getYAMLToXMLPlan` и XML traversal compiler.
- Produces: `PropertyRuleExecution.propertyPlan(rule): CompiledPropertyPlan`, `CompiledProperty`, `CompiledPropertyOperations` и `CompiledPropertyPlan.xmlImportView(...)`.

- [ ] **Step 1: Написать падающий тест одного плана на executor**

Создать `compiledPropertyPlan.test.ts`:

```ts
it("кэширует оба направления в одном плане и инвалидирует revision", () => {
  const firstImport = vi.fn((_, __, value) => value)
  const registries = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: { Sample: { importFromXML: firstImport } },
  }))
  const execution = createPropertyRuleExecutor(registries)
  const rule = ownerValueRule("Sample") as MetadataItemRule

  const first = execution.propertyPlan(rule)
  expect(execution.propertyPlan(rule)).toBe(first)
  expect(first.yamlToXMLOrder.map(({ propertyKey }) => propertyKey)).toEqual(["value"])
  expect(first.xmlImportView({ includeAllTags: true }).entriesByPropertyKey.get("value"))
    .toBe(first.propertiesByKey.get("value"))
  expect(first.propertiesByKey.get("value")?.operations.importFromXML).toBe(firstImport)

  registries.registerTypeRule("Sample", "importFromXML", () => "second")
  const second = execution.propertyPlan(rule)
  expect(second).not.toBe(first)
  expect(second.registryRevision).toBe(first.registryRevision + 1)
})
```

Добавить тест двух executor с одним объектом rule: планы и обработчики не
разделяются. Проверить точный набор верхнеуровневых ключей плана:

```ts
expect(Object.keys(first).sort()).toEqual([
  "properties",
  "propertiesByKey",
  "registryRevision",
  "rule",
  "xmlImportView",
  "yamlToXMLOrder",
].sort())
```

В плане нет `xml`, `yaml`, `context`, `referenceXML`, `collector` или
`configurationIndex`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/compiledPropertyPlan.test.ts
```

Expected: FAIL — `propertyPlan` и `CompiledPropertyPlan` отсутствуют.

- [ ] **Step 3: Определить единый договор плана**

В `compiledPropertyPlan.ts` ввести:

```ts
export const compiledPropertyOperationNames = [
  "importFromXML",
  "importFromXMLToYAML",
  "exportToXML",
  "importFromYAML",
  "exportToYAML",
  "metadataTargetOccurrences",
  "fileChildNamesDescriptor",
  "configurationIndexValueFromXML",
  "collectConfigurationIndexFromXML",
  "xmlImportPropertyBehavior",
  "nestedItemIdentity",
  "nestedItemRule",
  "resolveNestedImportXMLSources",
  "finalizeImportedYAML",
  "requiresImportedYAMLFinalization",
  "finalizeExportedXML",
  "yamlToXMLNestedRule",
  "yamlScalarTagPolicy",
] as const

export type CompiledPropertyOperations = {
  readonly [Operation in (typeof compiledPropertyOperationNames)[number]]:
    importExportFunction<Operation>
}

export interface CompiledProperty {
  readonly propertyKey: string
  readonly rule: PropertyRule
  readonly yamlKey: string | undefined
  readonly xmlPath: readonly string[]
  readonly operations: CompiledPropertyOperations
  readonly flags: {
    readonly requiresYAMLToXMLEvaluation: boolean
    readonly reserveNestedItemWhenAbsent: boolean
    readonly dependentImportProperty: boolean
    readonly runtimeOnly: boolean
    readonly syncExternalOnly: boolean
    readonly externalFile: boolean
    readonly repeatableXMLNodes: boolean
    readonly nestedItemsOwnXMLNode: boolean
  }
}

export interface CompiledPropertyPlan {
  readonly rule: MetadataItemRule
  readonly registryRevision: number
  readonly properties: readonly CompiledProperty[]
  readonly propertiesByKey: ReadonlyMap<string, CompiledProperty>
  readonly yamlToXMLOrder: readonly CompiledProperty[]
  xmlImportView(params: {
    readonly tags?: readonly string[]
    readonly includeAllTags: boolean
  }): XMLImportPlan<CompiledProperty>
}
```

`compilePropertyPlan` принимает только нейтральные функции `getTypeRule` и
`isDependentImportProperty`; конкретные типы в модуле запрещены.

Каждую операцию разрешать через обёртку, которая при ошибке добавляет
`itemType`, `propertyKey`, `propertyRule.type` и имя операции. В падающем тесте
зарегистрировать операцию, бросающую `new Error("probe")`, и проверить полное
сообщение компиляции до начала преобразования объекта.

- [ ] **Step 4: Реализовать кэш на владельце runtime**

Добавить в `PropertyRuleExecution` метод:

```ts
propertyPlan(rule: MetadataItemRule): CompiledPropertyPlan
```

В `createPropertyRuleExecutor` создать:

```ts
const plans = new WeakMap<MetadataItemRule, CompiledPropertyPlan>()

function propertyPlan(rule: MetadataItemRule): CompiledPropertyPlan {
  const revision = registries.revision()
  const cached = plans.get(rule)
  if (cached?.registryRevision === revision) return cached
  const compiled = compilePropertyPlan({
    rule,
    registryRevision: revision,
    getTypeRule: registries.getTypeRule,
    isDependentImportProperty: registries.isDependentImportProperty,
  })
  plans.set(rule, compiled)
  return compiled
}
```

Сначала полностью собрать и заморозить `compiled`, затем публиковать его в
`WeakMap`.

- [ ] **Step 5: Сделать XML view частью общего плана**

Обобщить `XMLImportPlan` и `XMLImportPlanEntry` параметром entry. Компилятор
XML view получает `readonly CompiledProperty[]`, использует их `rule`,
`propertyKey` и canonical XML key, а `entriesByPropertyKey` возвращает те же
объекты `CompiledProperty`. Внутри `CompiledPropertyPlan` хранить `Map` views по
отсортированному набору tags. `getXMLImportPlan({rule,...})` сохранить только
как совместимый публичный структурный helper, но удалить из рабочего
execution-пути. Unit-тесты рабочего пути перевести на
`execution.propertyPlan(rule).xmlImportView(...)`.

- [ ] **Step 6: Запустить тесты плана и XML traversal**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/compiledPropertyPlan.test.ts \
  metadata/ruleRuntime/property/xmlImportPlan.test.ts \
  metadata/ruleRuntime/property/fromYAMLToXMLPlan.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS; canonical, aliases, xmlParents, repeats, ambiguity и tags
сохраняют старые результаты.

- [ ] **Step 7: Проверить дубли и закоммитить план**

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
git add packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts \
  packages/runtime/metadata/ruleRuntime/property/propertyRuleExecutor.ts \
  packages/runtime/metadata/ruleRuntime/property/fn.ts \
  packages/runtime/metadata/ruleRuntime/property/xmlImportPlan.ts \
  packages/runtime/rule-kit.ts \
  packages/rules/metadata/ruleRuntime/property/compiledPropertyPlan.test.ts \
  packages/rules/metadata/ruleRuntime/property/xmlImportPlan.test.ts
git commit -m "perf: :zap: скомпилировать единый план свойств"
```

### Task 3: Перевести YAML → XML на готовый план

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`

**Interfaces:**
- Consumes: `PropertyRuleExecution.propertyPlan(rule)` и `CompiledProperty.operations` из Task 2.
- Produces: YAML → XML без `getOrderedKeysToXML`, создаваемого для каждого объекта `planByKey` и повторных обращений к реестру; `source.has` вычисляется один раз общей оркестрацией свойства.

- [ ] **Step 1: Написать падающий тест отсутствия повторной подготовки**

В `propertyRuleRegistrySet.test.ts` создать реестр с `vi.fn` вокруг
`getTypeRule`, дважды преобразовать разные YAML одним executor и проверить, что
второй объект не увеличил число обращений к реестру:

```ts
const first = convertPropertiesFromYAMLToXML(params({ Значение: "one" }, execution))
const lookupsAfterFirst = getTypeRule.mock.calls.length
const second = convertPropertiesFromYAMLToXML(params({ Значение: "two" }, execution))

expect(first.outputs.get("main")).toEqual({ Value: "one" })
expect(second.outputs.get("main")).toEqual({ Value: "two" })
expect(getTypeRule).toHaveBeenCalledTimes(lookupsAfterFirst)
```

В `fromYAMLToXML.test.ts` передать `YAMLPropertySource` со счётчиком и проверить,
что общая ветвящаяся логика вызывает `has(propertyKey)` один раз для обычного
скалярного свойства.

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
```

Expected: FAIL — второй объект выполняет новые lookups, `has` вызывается
несколько раз.

- [ ] **Step 3: Использовать готовый порядок и операции**

В начале `convertPropertiesFromYAMLToXML` получить:

```ts
const plan = params.execution?.propertyPlan(params.rule)
const orderedProperties = plan?.yamlToXMLOrder ?? legacyYAMLToXMLProperties(params.rule)
```

Рабочий worker всегда передаёт executor; резервный путь нужен только для
публичных вызовов без execution и сохраняет старое поведение.

В этом же файле определить резервный helper:

```ts
function legacyYAMLToXMLProperties(rule: MetadataItemRule): readonly YAMLToXMLPlannedProperty[] {
  const planByKey = new Map(
    getYAMLToXMLPlan(rule).properties.map((planned) => [planned.propertyKey, planned]),
  )
  return getOrderedKeysToXML({ rule })
    .map((propertyKey) => planByKey.get(propertyKey))
    .filter((planned): planned is YAMLToXMLPlannedProperty => planned !== undefined)
}
```

Цикл проходит сразу по `CompiledProperty`. Удалить локальные `orderedKeys`,
`planByKey` и `typeRule`. Использовать `planned.operations.exportToXML`,
`yamlToXMLNestedRule`, `nestedItemIdentity`, `yamlScalarTagPolicy`,
`importFromYAML`, `finalizeExportedXML` и
`configurationIndexValueFromXML`.

- [ ] **Step 4: Передать готовые операции атомарным helper**

Расширить внутренние параметры, не добавляя полей в `PropertyRule`:

```ts
interface AtomicFromYAMLParams {
  readonly handler?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  readonly scalarTagPolicy?: YAMLScalarTagPolicy
  readonly occurrenceHandler?: MetadataTargetOccurrencesFunction
  readonly execution?: PropertyRuleExecution
  readonly context: ConfigurationContext
  readonly rule: PropertyRule
  readonly value: unknown
  readonly referenceValue?: unknown
  readonly yaml?: unknown
  readonly annotations?: XmlAnomalyAnnotations
  readonly name?: string
  readonly owner?: MetadataTargetOwner
  readonly restoreExcludedEqualName?: boolean
}
```

`callAtomicFromXML` получает готовый `handler`; `callAtomicFromYAML` не вызывает
реестр, если передана скомпилированная запись;
`identityReferenceFromConfigurationIndex` получает готовый descriptor.
Публичные вызовы без скомпилированной записи сохраняют прежние обращения к
реестру в резервном пути.

- [ ] **Step 5: Кэшировать наличие свойства на одну итерацию**

После выбора `CompiledProperty` вычислить:

```ts
const sourceHasProperty = source.has(planned.propertyKey)
```

Передать boolean в общие helper и заменить повторные вызовы общей функции.
Вызовы `source.has` внутри предметного `toXML(source, context)` не запрещаются и
не входят в этот счётчик.

- [ ] **Step 6: Запустить unit, integration и type-check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/configurationIndex/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS.

- [ ] **Step 7: Проверить дубли и закоммитить YAML → XML**

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts \
  packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
git commit -m "perf: :zap: переиспользовать план YAML в XML"
```

### Task 4: Перевести XML → YAML на тот же план

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toYAML.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`

**Interfaces:**
- Consumes: `CompiledPropertyPlan.xmlImportView` и `CompiledProperty.operations`.
- Produces: XML → YAML без повторных обращений к реестру в importMatch и XML traversal callbacks.

- [ ] **Step 1: Написать падающий тест повторных XML → YAML lookup**

Дважды вызвать `importPropertiesFromXMLToYAML` с одним executor и rule, но
разными XML. После первого вызова сохранить число обращений к registry:

```ts
expect(importYaml({ Value: "one" }, execution)).toMatchObject({ Значение: "one" })
const lookupsAfterFirst = getTypeRule.mock.calls.length
expect(importYaml({ Value: "two" }, execution)).toMatchObject({ Значение: "two" })
expect(getTypeRule).toHaveBeenCalledTimes(lookupsAfterFirst)
```

Отдельный случай с collection и repeated XML доказывает отсутствие обращений к реестру из
`isRepeatable` и `nestedItemsOwnNode` при втором объекте.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
```

Expected: FAIL — второй объект снова обращается к реестру.

- [ ] **Step 3: Получать XML view общего плана**

Заменить создание source plan на:

```ts
const propertyPlan = params.execution?.propertyPlan(rule)
const plan = propertyPlan?.xmlImportView({ tags: source.tags, includeAllTags })
  ?? getXMLImportPlan({ rule, tags: source.tags, includeAllTags })
```

`importMatch` получает `CompiledProperty` непосредственно из match. Удалить
локальный `typeRule` для пути с execution.

- [ ] **Step 4: Заменить все операции на ссылки записи**

Использовать compiled operations для:

```text
yamlToXMLNestedRule
configurationIndexValueFromXML
collectConfigurationIndexFromXML
nestedItemRule
importFromXMLToYAML
resolveNestedImportXMLSources
xmlImportPropertyBehavior
finalizeImportedYAML
requiresImportedYAMLFinalization
fileChildNamesDescriptor
```

`dependentImportProperty` берётся из `CompiledProperty.flags`. В XML traversal
callbacks используются готовые `repeatableXMLNodes` и
`nestedItemsOwnXMLNode`; они вычисляются один раз из `yamlToXMLNestedRule`,
`fileChildNamesDescriptor`, `xmlImportPropertyBehavior` и canonical XML key.

- [ ] **Step 5: Передать готовые fromXML/toYAML handlers**

`importPropertyFromXML` получает необязательный `handler` и не вызывает
`execution.fromXML`, если он передан. `exportPropertyValueBeforeMetadataTargetsToYAML`,
`exportPropertyMetadataTargetsToYAML` и `getExportToYAMLResult` получают
готовые `exportToYAML`, `metadataTargetOccurrences` и
`xmlImportPropertyBehavior`. Прежние вызовы без скомпилированной записи
сохраняют обращения к реестру как резервный путь.

- [ ] **Step 6: Запустить unit, integration и type-check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/ruleRuntime/property/xmlImportPlan.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/configurationIndex/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS; audit rollback, defaults, индекс и YAML ordering не меняются.

- [ ] **Step 7: Проверить дубли и закоммитить XML → YAML**

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
git add packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromXML.ts \
  packages/runtime/metadata/ruleRuntime/property/toYAML.ts \
  packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
git commit -m "perf: :zap: переиспользовать план XML в YAML"
```

### Task 5: Проверить эффект единого плана на `doc`

**Files:**
- Изменений рабочего кода не ожидается.
- Temporary results: `/private/tmp/nkdk-compiled-plan-layer-a.json`

**Interfaces:**
- Consumes: исходные измерения Task 1 и оба направления Tasks 3–4.
- Produces: решение продолжать к прямым преобразователям только после доказанной корректности слоя А.

- [ ] **Step 1: Запустить целевые наборы правил без профилировщика**

```bash
pnpm --filter @nkdk/runtime test:isolated
pnpm --filter @nkdk/rules test:isolated
```

Expected: PASS.

- [ ] **Step 2: Измерить четыре compiled-MCP прогона**

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /Users/nikita/git/nkdk-yaml/cf \
  --runs 4 --json > /private/tmp/nkdk-compiled-plan-layer-a.json
```

Expected: `errors: 0`, warnings совпадают с исходным измерением, заполнены оба
массива типов, Peak RSS/Heap не выше исходного разброса.

- [ ] **Step 3: Сравнить исходную и новую warm-серии**

Run:

```bash
pnpm --filter @nkdk/rules exec tsx -e '
import { readFileSync } from "node:fs";
for (const file of process.argv.slice(1)) {
  const data=JSON.parse(readFileSync(file,"utf8"));
  const warm=data.runs.slice(1).map((run)=>run.elapsedMs).sort((a,b)=>a-b);
  console.log(file, {median:warm[1], min:warm[0], max:warm[2], rss:data.peakRssMiB, heap:data.peakHeapMiB});
}' /private/tmp/nkdk-compiled-plan-baseline.json /private/tmp/nkdk-compiled-plan-layer-a.json
```

Expected: нет ухудшения выше исходного warm-разброса. Если направление или
память ухудшились, остановить исполнение, локализовать причину по rows и
исправить Tasks 2–4 до Task 6.

- [ ] **Step 4: Проверить чистоту worktree**

Run: `git status --short`

Expected: пустой вывод; результаты профиля находятся только в `/private/tmp`.

### Task 6: Прямые атомарные преобразователи частых типов

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/property/atomicConversion.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts`
- Create: `packages/rules/metadata/commonObjects/boolean/atomicConversion.ts`
- Create: `packages/rules/metadata/commonObjects/string/atomicConversion.ts`
- Create: `packages/rules/metadata/commonObjects/number/atomicConversion.ts`
- Create: `packages/rules/metadata/systemEnumerations/atomicConversion.ts`
- Create: `packages/rules/metadata/systemEnumerations/tables.ts`
- Modify: `packages/rules/metadata/systemEnumerations/fromYAML.ts`
- Modify: `packages/rules/metadata/systemEnumerations/toYAML.ts`
- Modify: `packages/rules/metadata/systemEnumerations/xmlAliases.ts`
- Modify: `.agents/skills/import-profile/import-profile.mjs`
- Modify: `.agents/skills/import-profile/import-profile.test.mjs`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/systemEnumerations/roundTrip.integration.test.ts`
- Create: `packages/rules/metadata/commonObjects/boolean/atomicConversion.test.ts`
- Create: `packages/rules/metadata/commonObjects/string/atomicConversion.test.ts`
- Create: `packages/rules/metadata/commonObjects/number/atomicConversion.test.ts`
- Create: `packages/rules/metadata/systemEnumerations/atomicConversion.test.ts`

**Interfaces:**
- Consumes: скомпилированная запись из Tasks 2–4 и прежние атомарные обработчики.
- Produces: type operation `compileAtomicConversion`, `CompiledAtomicConversion`, счётчики `fusedAtomicCount`/`fusedAtomicByType`; обычный путь остаётся резервным.

- [ ] **Step 1: Написать падающие differential tests договора**

В runtime-тестах зарегистрировать тестовую фабрику:

```ts
definePropertyTypeRule("FastScalar", "compileAtomicConversion", ({ rule }) => ({
  fromXMLToYAML: ({ value }) => ({
    metadataValue: Number(value),
    representationValue: `yaml:${value}`,
  }),
  fromYAMLToXML: ({ value }) => ({
    metadataValue: Number(value),
    representationValue: `xml:${value}`,
  }),
}))
```

Проверить:

- обычное явное значение использует fused path и совпадает с legacy output;
- отсутствующее, явно пустое, default/implicit, YAML scalar tag,
  reference XML, metadata-target и динамический `toXML` используют обычный путь;
- ошибка fused handler получает тот же YAML/rule path;
- выключенный профиль не выполняет per-property timing.

В правилах добавить таблицы эквивалентности:

```ts
const context = mockContextFromXML()
const booleanRule = { type: "boolean", yaml: "Значение", xml: "Value" } as const
const checkBoxTypeRule: SystemEnumerationPropertyRule<"CheckBoxType"> = {
  type: "SystemEnumeration",
  typeSE: "CheckBoxType",
  yaml: "Вид",
  xml: "Type",
}

it.each([
  ["true", true, "Истина"],
  ["false", false, "Ложь"],
])("объединяет boolean XML → YAML", (xml, metadata, yaml) => {
  const direct = compileBooleanAtomicConversion({ rule: booleanRule })
    .fromXMLToYAML!({ context, value: xml })
  expect(direct).toEqual({ metadataValue: metadata, representationValue: yaml })
  expect(direct.representationValue).toBe(
    exportBooleanToYAML(context, booleanRule, importBooleanFromXML(context, booleanRule, xml)),
  )
})

it.each([
  ["Switcher", "Switch", "Выключатель"],
  ["CheckBox", "CheckBox", "Флажок"],
])("объединяет CheckBoxType", (xml, metadata, yaml) => {
  const direct = compileSystemEnumerationAtomicConversion({ rule: checkBoxTypeRule })
    .fromXMLToYAML!({ context, value: xml })
  expect(direct).toEqual({ metadataValue: metadata, representationValue: yaml })
  const imported = importSystemEnumerationFromXML(context, checkBoxTypeRule, xml)
  expect(direct.representationValue).toBe(
    exportSystemEnumerationToYAML(context, checkBoxTypeRule, imported),
  )
})
```

Для `number` покрыть `typedXML: true`, `xs:string`, число и `#text`; для
`string` — plain scalar и object `#text`. Особые случаи должны доказать
переход на резервный путь, а не дублировать общую логику в типе.
Для всех четырёх типов сравнить оба направления, а для ошибочного YAML — класс,
сообщение и путь ошибки прямого и обычного вариантов.

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/commonObjects/boolean/atomicConversion.test.ts \
  metadata/commonObjects/string/atomicConversion.test.ts \
  metadata/commonObjects/number/atomicConversion.test.ts \
  metadata/systemEnumerations/atomicConversion.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/systemEnumerations/roundTrip.integration.test.ts
```

Expected: FAIL — операция и fused path отсутствуют.

- [ ] **Step 3: Добавить нейтральный договор фабрики**

В `atomicConversion.ts` определить:

```ts
export interface AtomicConversionResult<Representation = unknown> {
  readonly metadataValue: unknown
  readonly representationValue: Representation
}

export interface CompiledAtomicConversion {
  readonly fromXMLToYAML?: (params: {
    readonly context: ConfigurationContextFromXML
    readonly value: unknown
  }) => AtomicConversionResult
  readonly fromYAMLToXML?: (params: {
    readonly context: ConfigurationContextWithExportToXML
    readonly value: unknown
  }) => AtomicConversionResult
}

export type CompileAtomicConversionFunction = (params: {
  readonly rule: PropertyRule
}) => CompiledAtomicConversion
```

Добавить `compileAtomicConversion` в `TypeRulesOperations`, `TypeRule`,
`importExportFunction` и типизированный registry. Фабрика вызывается один раз
из `compilePropertyPlan`; никаких имен конкретных типов runtime не знает.

- [ ] **Step 4: Реализовать строгую допустимость прямого пути**

В `atomicConversion.ts` экспортировать две функции:

```ts
canUseAtomicFromXMLToYAML(compiled, invocation): boolean
canUseAtomicFromYAMLToXML(compiled, invocation): boolean
```

Обе требуют явное значение, отличное от `undefined`, `null` и пустого XML,
отсутствие `metadataTargetOccurrences` и отсутствие значения из reference XML.
Прямой обработчик вызывается только вместо соседней пары предметных операций:
общая оркестрация до него уже выбрала текущее значение, а после него по-прежнему
выполняет индекс, audit, запись результата и diagnostics.

YAML → XML дополнительно требует `scalarTag === undefined`,
`typeof rule.toXML !== "function"`, `evaluateWhenYAMLMissing !== true`,
`exportNilValue !== true`, `excludeIfEqualNameYAML !== true`, отсутствие
`namespace` и отсутствие собственных полей `defaultValue`, `defaultValueXML`,
`defaultValueXMLRaw`, `defaultValueXMLEmpty`, `defaultValueAdoptedXML`,
`implicitValueXML`, `implicitValueYAML`, `preserveEmptyXML`,
`preserveUnknownReferenceXML`, `preserveExplicitDefaultXML` и
`omitNonImplicitReferenceXMLWhenYAMLMissing`.

XML → YAML дополнительно требует `presentInXML === true`,
`context.fromXML.forReference !== true` и отсутствие того же набора default,
implicit и preserve-полей. При любом неизвестном режиме функция возвращает
`false`.

Fused result используется только внутри этой доказанной обычной ветви. Общий
код по-прежнему выполняет index/audit/output; в остальных случаях вызываются
кэшированные legacy handlers.

- [ ] **Step 5: Последовательно зарегистрировать четыре предметных фабрики**

`boolean`, `string` и `number` связывают чистые существующие преобразования в
одну функцию без runtime branching по типу. `number` замыкает `typedXML` из
конкретного rule.

`SystemEnumeration` при компиляции получает таблицы:

```ts
const fromYAML = systemEnumerationTable(rule.typeSE, "FromYAML")
const toYAML = systemEnumerationTable(rule.typeSE, "ToYAML")
const aliases = systemEnumerationAliases(rule.typeSE)
```

После компиляции вызов не строит `${typeSE}FromYAML`/`${typeSE}ToYAML` и не
ищет таблицу заново.

Кандидатов добавлять строго по одному в порядке `SystemEnumeration`, `boolean`,
`string`, `number`. После тестов каждого кандидата выполнить отдельную серию
Step 8, сравнить её с состоянием до кандидата и либо оставить кандидата, либо
удалить его код и регистрацию до перехода к следующему. Поэтому изменение
времени каждого типа не смешивается с остальными кандидатами.

- [ ] **Step 6: Добавить профиль покрытия fused path**

В оба профиля добавить:

```ts
fusedAtomicCount: number
fusedAtomicByType: Record<string, { count: number; timeMs: number }>
```

Timing выполняется только при подробном профиле типов. Import-profile сводит
строки обоих направлений, чтобы по одному `doc`-прогону были видны count/time
каждого из четырёх кандидатов.

- [ ] **Step 7: Запустить differential, integration и type-check**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project unit \
  metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  metadata/commonObjects/boolean/atomicConversion.test.ts \
  metadata/commonObjects/string/atomicConversion.test.ts \
  metadata/commonObjects/number/atomicConversion.test.ts \
  metadata/systemEnumerations/atomicConversion.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/systemEnumerations/roundTrip.integration.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: PASS; особые случаи показывают переход на резервный путь.

- [ ] **Step 8: Измерить каждого прямого преобразователя отдельно**

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /Users/nikita/git/nkdk-yaml/cf \
  --runs 4 --json > /private/tmp/nkdk-compiled-plan-layer-b-system-enumeration.json
```

Повторить команду после добавления каждого следующего кандидата, меняя суффикс
на `boolean`, `string` и `number`. Первый кандидат сравнивается с
`/private/tmp/nkdk-compiled-plan-layer-a.json`, каждый следующий — с последней
серией, в которой сохранены только уже доказавшие пользу кандидаты; дополнительно
каждую серию сравнить со слоем А.

Для кандидата использовать его count/time в обоих направлениях. Он сохраняется,
если медианное время уменьшается больше разброса трёх warm-прогонов и общее
направление не ухудшается. Кандидат с нулевым покрытием или без измеримого
выигрыша удалить вместе с регистрацией и тестом прямой ветки; дифференциальные
тесты обычного поведения типа сохранить. После удаления повторить тесты Step 7,
чтобы следующий кандидат сравнивался с чистым сохранённым состоянием.

- [ ] **Step 9: Проверить дубли и закоммитить только полезные кандидаты**

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
git add packages/runtime/metadata/ruleRuntime/property/atomicConversion.ts \
  packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts \
  packages/runtime/metadata/ruleRuntime/property/fn.ts \
  packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts \
  packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts \
  packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts \
  packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts \
  packages/runtime/rule-kit.ts \
  packages/rules/metadata/commonObjects/boolean/atomicConversion.ts \
  packages/rules/metadata/commonObjects/boolean/atomicConversion.test.ts \
  packages/rules/metadata/commonObjects/string/atomicConversion.ts \
  packages/rules/metadata/commonObjects/string/atomicConversion.test.ts \
  packages/rules/metadata/commonObjects/number/atomicConversion.ts \
  packages/rules/metadata/commonObjects/number/atomicConversion.test.ts \
  packages/rules/metadata/systemEnumerations/atomicConversion.ts \
  packages/rules/metadata/systemEnumerations/atomicConversion.test.ts \
  packages/rules/metadata/systemEnumerations/tables.ts \
  packages/rules/metadata/systemEnumerations/fromYAML.ts \
  packages/rules/metadata/systemEnumerations/toYAML.ts \
  packages/rules/metadata/systemEnumerations/xmlAliases.ts \
  packages/rules/metadata/systemEnumerations/roundTrip.integration.test.ts \
  packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts \
  packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts \
  .agents/skills/import-profile/import-profile.mjs \
  .agents/skills/import-profile/import-profile.test.mjs
git commit -m "perf: :zap: объединить частые преобразования свойств"
```

Если не сохранён ни один кандидат, удалить `compileAtomicConversion` и весь
неиспользуемый слой, не создавать пустой коммит и зафиксировать результат
измерения в итоговом отчёте задачи.

### Task 7: Полная проверка и `doc` round-trip

**Files:**
- Modify only if a verification exposes a specification mismatch.
- Temporary results: `/private/tmp/nkdk-compiled-plan-final.json` and round-trip temp report.

**Interfaces:**
- Consumes: полный diff после Tasks 1–6.
- Produces: проверенный результат для независимого conformance review.

- [ ] **Step 1: Запустить окончательный compiled профиль**

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /Users/nikita/git/nkdk-yaml/cf \
  --runs 4 --json > /private/tmp/nkdk-compiled-plan-final.json
```

Expected: `errors: 0`, warnings и число результатов совпадают с исходным измерением;
warm median обоих направлений не хуже исходного разброса; Peak RSS/Heap не
выше исходного разброса.

- [ ] **Step 2: Запустить YAML round-trip `doc`**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: import и sync завершаются terminal success; нет новых
semantic/triage diff относительно исходного `doc`.

- [ ] **Step 3: Запустить обязательные проверки проекта**

Run вне песочницы из корня worktree:

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все команды завершаются с exit code 0.

- [ ] **Step 4: Проверить область полного diff**

```bash
git status --short
git diff --stat be4708d9438dfb1d5955900c881923938e7c016a
git log --oneline be4708d9438dfb1d5955900c881923938e7c016a..HEAD
```

Expected: нет случайных файлов и изменений XML-фикстур; все изменения относятся
к плану, профилю или проверкам.

- [ ] **Step 5: Закоммитить только исправления финальной проверки**

Если Step 1–4 потребовали изменения кода, повторить затронутые проверки,
выполнить duplicates и создать отдельный точный commit. Если изменений нет,
коммит не создавать.

### Task 8: Независимая проверка соответствия

**Files:**
- No implementation changes by reviewer.

**Interfaces:**
- Consumes: spec, этот plan, base SHA, полный committed/staged/unstaged/untracked diff worktree и результаты Task 7.
- Produces: `VERDICT: APPROVED` или `VERDICT: CHANGES_REQUIRED` по договору `executing-plans-with-review`.

- [ ] **Step 1: Передать полный результат одному независимому reviewer**

Reviewer получает буквально:

```text
Spec: /Users/nikita/git/nkdk/.worktrees/import-messagepack-design/docs/superpowers/specs/2026-09-01-compiled-property-conversion-plan-design.md
Plan: /Users/nikita/git/nkdk/.worktrees/import-messagepack-design/docs/superpowers/plans/2026-09-01-compiled-property-conversion-plan.md
Base: be4708d9438dfb1d5955900c881923938e7c016a
Worktree: /Users/nikita/git/nkdk/.worktrees/import-messagepack-design
Review every commit, staged/unstaged change and implementation-related untracked file since Base. Do not edit files.
```

- [ ] **Step 2: Закрыть все findings**

При `CHANGES_REQUIRED` основной исполнитель исправляет каждое замечание,
повторяет затронутые проверки и отправляет тому же reviewer новый полный diff.
Reviewer не исправляет код. Цикл продолжается до `APPROVED`.

- [ ] **Step 3: Выполнить финальные проверки неизменённого одобренного дерева**

После `APPROVED` повторить:

```bash
pnpm test
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
pnpm test:architecture:rules
pnpm test:architecture
git status --short
```

Если проверка изменила файл, одобрение недействительно: вернуть полный результат
тому же reviewer. Завершать ветку разрешено только для точного одобренного
дерева.
