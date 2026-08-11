# Rules and Runtime Package Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить private-пакет `@nkdk/core` на `@nkdk/rules` и `@nkdk/runtime` с единственной production-зависимостью `rules → runtime`, без изменения XML/YAML-поведения.

**Architecture:** Сначала внутри `packages/core` заменить side-effect registration и module-level registry на структурированный `MetadataRulesDefinition` и экземплярные таблицы. Затем создать сгруппированный `MetadataRuntime`, перевести MCP и worker на явную композицию и только после зелёного внутреннего графа физически перенести нейтральный код в runtime, а конкретные definitions и adapters — в rules.

**Tech Stack:** TypeScript 7, pnpm workspaces, Vitest 4, esbuild, Piscina, dependency-cruiser, jscpd.

## Global Constraints

- Перед выполнением создать отдельный implementation-worktree от актуального `origin/develop`; ветки `develop` и `main` не изменять.
- Использовать `superpowers:test-driven-development` для каждого изменения поведения и `superpowers:verification-before-completion` перед каждым коммитом.
- Не менять существующие XML-фикстуры и XML/YAML-семантику.
- Не добавлять новые fromXML/toXML/fromYAML/toYAML rules и новые применения `!xml`.
- Не добавлять `id`, `apiVersion`, `revision`, hash, worker handshake, предварительный validator rules, публичный `runtime/testing` или совместимый `@nkdk/core`.
- Не добавлять в имена пакетов, публичный API и новую документацию название внешней платформы.
- Не добавлять семантический анализатор строк и условий runtime: это отдельная будущая задача.
- Не добавлять Turborepo и не исправлять несвязанные тестовые падения.
- Не изменять dependency-cruiser baseline.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base $(git merge-base HEAD origin/develop)`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test:architecture:rules`, `pnpm test:architecture`, duplicate-check и полный `pnpm test`.
- Сообщения коммитов оформлять на русском языке по Conventional Commits с gitmoji.
- До Task 9 старый global-путь регистрации остаётся неизменным и обслуживает production. Tasks 3–8 строят новый экземплярный путь рядом, но не записывают в оба пути и не подключают его частично. В Task 9 MCP и workers переключаются на новый путь атомарно, после чего старые globals удаляются в том же коммите.

---

### Task 1: Зафиксировать исходный договор и запрет обратной зависимости

**Files:**
- Create: `tools/dependency-cruiser/test/package-rules-runtime-boundary.test.mjs`
- Modify: `tools/dependency-cruiser/src/reachability-rules.mjs`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Inspect: `packages/mcp/src/coreApi.ts`
- Inspect: `packages/core/index.ts`
- Inspect: `packages/core/metadata/composition/coreMetadata.ts`

**Interfaces:**
- Consumes: текущий `neutralProductionPattern` и `metadataReachabilityRules`.
- Produces: архитектурные правила `runtimeDoesNotReachRules`, `rulesUsesRuntimeExportsOnly`, `packageCompositionRootOnlyInMcp`; сохранённый base commit для всех duplicate-check.

- [ ] **Step 1: Измерить baseline в подготовленном implementation-worktree**

Run:

```powershell
git rev-parse HEAD
pnpm type-check
pnpm test:architecture:rules
pnpm test:architecture
pnpm test
```

Expected: сохранить hash `HEAD` в журнале выполнения; все команды проходят. Если полный тест имеет исходное падение, остановить выполнение и сообщить его до изменений.

- [ ] **Step 2: Написать падающий архитектурный тест конечной границы**

```js
import test from "node:test"
import assert from "node:assert/strict"
import { metadataReachabilityRules } from "../src/reachability-rules.mjs"

test("runtime cannot reach rules and rules cannot use runtime internals", () => {
  const names = new Set(metadataReachabilityRules.map(({ name }) => name))
  assert.ok(names.has("runtime-does-not-reach-rules"))
  assert.ok(names.has("rules-does-not-reach-runtime-internals"))
})
```

- [ ] **Step 3: Запустить тест и подтвердить падение**

Run: `node --test tools/dependency-cruiser/test/package-rules-runtime-boundary.test.mjs`

Expected: FAIL, потому что новые правила ещё не определены.

- [ ] **Step 4: Добавить правила, допускающие отсутствующие до Task 10 каталоги**

Добавить правила с путями `^packages/runtime/` и `^packages/rules/`; до физического переноса они не находят модулей, но тестируют окончательный договор. Запретить direct и type-only достижимость runtime → rules и imports rules → `packages/runtime/**`, кроме `@nkdk/runtime`, `/rule-kit` и `/worker` после появления package imports.

- [ ] **Step 5: Запустить самопроверку архитектурных правил**

Run:

```powershell
node --test tools/dependency-cruiser/test/package-rules-runtime-boundary.test.mjs
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: PASS; существующий baseline не изменён.

- [ ] **Step 6: Проверить дубли и создать коммит**

```powershell
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
git add tools/dependency-cruiser
git commit -m "test: :white_check_mark: зафиксировать границу rules и runtime"
```

### Task 2: Ввести структурированное определение rules

**Files:**
- Create: `packages/core/metadata/ruleRuntime/definition/contracts.ts`
- Create: `packages/core/metadata/ruleRuntime/definition/defineMetadataRules.ts`
- Create: `packages/core/metadata/ruleRuntime/definition/composeMetadataRules.ts`
- Create: `packages/core/metadata/ruleRuntime/definition/composeMetadataRules.test.ts`
- Create: `packages/core/metadata/ruleRuntime/definition/testSupport.ts`
- Modify: `packages/core/metadata/ruleRuntime/index.ts`

**Interfaces:**
- Consumes: существующие handler-типы из `property/fn.ts`, `property/types.ts`, `projectDefinition/projectSpecContracts.ts`, `components/descriptor.ts`, `workerPool/operationRegistry.ts`.
- Produces: `MetadataRulesDefinition`, `defineMetadataRules(definition)`, `composeMetadataRules(...layers)`.

- [ ] **Step 1: Написать падающий тест композиции**

```ts
import { describe, expect, it } from "vitest"
import { composeMetadataRules, defineMetadataRules, emptyMetadataRules } from "."

describe("metadata rules definition", () => {
  it("replaces keyed entries with the later layer and appends ordered entries", () => {
    const first = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "First", properties: {} } },
      validation: [{ kind: "test", id: "first" }],
    })
    const second = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "Second", properties: {} } },
      validation: [{ kind: "test", id: "second" }],
    })

    const result = composeMetadataRules(first, second)

    expect(result.metadataItems.Item?.itemType).toBe("Second")
    expect(result.validation.map(({ id }) => id)).toEqual(["first", "second"])
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/definition/composeMetadataRules.test.ts --project unit`

Expected: FAIL с ошибкой отсутствующего модуля.

- [ ] **Step 3: Реализовать договор без compiler и validation**

`MetadataRulesDefinition` содержит именованные таблицы `propertyTypes`, `metadataItems`, `formElements`, `systemEnumerations`, `schemas`, `projectSpecs` и упорядоченные массивы `resourceTopology`, `validation`, `dataPaths`, `references`, `components`, `imports`, `synchronization`, `operations`, `workerOperations`. Для ещё не мигрированных категорий определить узкий registration descriptor вокруг существующей сигнатуры handler; не использовать `unknown` как общий контейнер.

```ts
export function defineMetadataRules(
  definition: MetadataRulesDefinition,
): MetadataRulesDefinition {
  return definition
}

export function composeMetadataRules(
  ...layers: readonly MetadataRulesDefinition[]
): MetadataRulesDefinition {
  return layers.reduce((result, layer) => ({
    propertyTypes: { ...result.propertyTypes, ...layer.propertyTypes },
    metadataItems: { ...result.metadataItems, ...layer.metadataItems },
    formElements: { ...result.formElements, ...layer.formElements },
    systemEnumerations: { ...result.systemEnumerations, ...layer.systemEnumerations },
    schemas: { ...result.schemas, ...layer.schemas },
    projectSpecs: { ...result.projectSpecs, ...layer.projectSpecs },
    resourceTopology: [...result.resourceTopology, ...layer.resourceTopology],
    validation: [...result.validation, ...layer.validation],
    dataPaths: [...result.dataPaths, ...layer.dataPaths],
    references: [...result.references, ...layer.references],
    components: [...result.components, ...layer.components],
    imports: [...result.imports, ...layer.imports],
    synchronization: [...result.synchronization, ...layer.synchronization],
    operations: [...result.operations, ...layer.operations],
    workerOperations: [...result.workerOperations, ...layer.workerOperations],
  }), emptyMetadataRules)
}
```

`testSupport.ts` остаётся внутренним файлом пакета и экспортирует
`emptyMetadataRules` и `metadataItemRule(itemType)`. Он не реэкспортируется из
`core/index.ts` и позднее перемещается вместе с runtime-тестами, не создавая
публичный `runtime/testing`.

- [ ] **Step 4: Проверить тест и типы**

Run:

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/definition/composeMetadataRules.test.ts --project unit
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 5: Проверить дубли и создать коммит**

```powershell
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
git add packages/core/metadata/ruleRuntime
git commit -m "feat: :sparkles: определить структурированный набор rules"
```

### Task 3: Сделать property registries экземплярными

**Files:**
- Create: `packages/core/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Create: `packages/core/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/propertyItemRuleDeclarations.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/systemEnumerationRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/indexValueFromYAMLRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/metadataTargetOwnerRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromXML.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toYAML.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/contracts.ts`

**Interfaces:**
- Consumes: `MetadataRulesDefinition.propertyTypes` и `systemEnumerations`.
- Produces: `createPropertyRuleRegistrySet(definition): PropertyRuleRegistrySet`; lookup-методы `getTypeRule`, `resolvePropertyItemRule`, `getSystemEnumeration`, explicit XML/dependent/index/owner lookups как методы экземпляра.

- [ ] **Step 1: Написать тест изоляции двух наборов**

```ts
it("keeps identical property keys isolated between registry sets", () => {
  const firstHandler = () => "first"
  const secondHandler = () => "second"
  const first = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: { Sample: { exportToYAML: firstHandler } },
  }))
  const second = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: { Sample: { exportToYAML: secondHandler } },
  }))

  expect(first.getTypeRule("Sample", "exportToYAML")).toBe(firstHandler)
  expect(second.getTypeRule("Sample", "exportToYAML")).toBe(secondHandler)
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts --project unit`

Expected: FAIL: фабрика отсутствует.

- [ ] **Step 3: Реализовать экземплярный набор и связанный с ним исполнитель property rules**

Перенести таблицы из перечисленных registry-файлов в один объект состояния. Создать `createPropertyRuleExecutor(registries)`, который возвращает связанные с этим экземпляром операции fromXML/fromYAML/toXML/toYAML/toJSONSchema. Непубличные функции преобразований получают `PropertyRuleRegistrySet` первым параметром; `ConfigurationContext` не хранит функции registry и остаётся сериализуемым.

```ts
export interface PropertyRuleRegistrySet {
  getTypeRule<O extends TypeRulesOperations>(type: PropertyRuleType, operation: O): importExportFunction<O> | undefined
  resolvePropertyItemRule(rule: PropertyWithItemRule): CollectionItemRule["itemRule"] | undefined
  getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined
}

export function createPropertyRuleRegistrySet(
  definition: Pick<MetadataRulesDefinition, "propertyTypes" | "systemEnumerations">,
): PropertyRuleRegistrySet {
  const typeRules = new Map(Object.entries(definition.propertyTypes))
  const enumerations = new Map(Object.entries(definition.systemEnumerations))
  return createPropertyRuleRegistryLookups(typeRules, enumerations)
}
```

- [ ] **Step 4: Подготовить связанные с экземпляром lookup и executor**

Run: `rg -n "getTypeRule|registerTypeRule|getSystemEnumeration|registerSystemEnumeration|registerExplicitXMLProperty|registerDependent|registerIndexValueFromYAML|registerMetadataTargetOwner" packages/core/metadata -g '*.ts'`

Expected after edits: новый код не импортирует старые register/clear/snapshot функции. Production остаётся на старом пути до атомарного переключения в Task 9.

- [ ] **Step 5: Зафиксировать список legacy API для удаления в Task 9**

Добавить локальные тесты нового `PropertyRuleRegistrySet`. Module-level `Map`, `clearTypeRulesRegistry`, snapshot/restore и их существующие тесты пока не менять: они удаляются только одновременно с переключением всех production-потребителей в Task 9.

- [ ] **Step 6: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/property metadata/ruleRuntime/metadataItem metadata/ruleRuntime/metadataCollection
pnpm --filter @nkdk/core type-check
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; новые registry-тесты не требуют очистки глобального состояния.

- [ ] **Step 7: Создать коммит**

```powershell
git add packages/core/metadata/ruleRuntime packages/core/metadata/validation packages/core/metadata/projectDefinition
git commit -m "refactor: :recycle: изолировать property registries"
```

### Task 4: Сделать item, form, schema и project registries экземплярными

**Files:**
- Create: `packages/core/metadata/ruleRuntime/ruleRegistrySet.ts`
- Create: `packages/core/metadata/ruleRuntime/ruleRegistrySet.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataItem/augmenterRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataItem/importedYamlFinalizerRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/formElement/registry.ts`
- Modify: `packages/core/metadata/ruleRuntime/formElement/ruleRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/ruleRuntime/metadataTarget/standardMemberAliases.ts`
- Modify: `packages/core/metadata/standardMembers/declarations.ts`
- Modify: `packages/core/metadata/projectDefinition/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/projectDefinition/schemaRegistry.ts`
- Modify: `packages/core/metadata/projectDefinition/specs.ts`
- Modify: `packages/core/metadata/resourceTopology/core/providerRegistry.ts`
- Modify: `packages/core/metadata/resourceTopology/core/compiler.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/contracts.ts`

**Interfaces:**
- Consumes: property registry set из Task 3 и секции metadataItems, formElements, schemas, projectSpecs, resourceTopology.
- Produces: `RuleRegistrySet` с bound lookups для metadata item, form, schema, standard members, project specs и topology.

- [ ] **Step 1: Написать тест изоляции полного нижнего набора**

```ts
it("does not share item, form, schema, project or topology entries", () => {
  const first = createRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    metadataItems: { Item: metadataItemRule("first") },
  }))
  const second = createRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    metadataItems: { Item: metadataItemRule("second") },
  }))

  expect(first.metadataItems.get("Item")?.itemType).toBe("first")
  expect(second.metadataItems.get("Item")?.itemType).toBe("second")
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/ruleRegistrySet.test.ts --project unit`

Expected: FAIL: `createRuleRegistrySet` отсутствует.

- [ ] **Step 3: Реализовать `RuleRegistrySet` и перенести кэши topology**

Topology cache хранить внутри set и вычислять лениво по переданному provider. Старые `registeredProvider`, `cachedTopology`, project/schema maps и test-reset globals оставить без изменений до Task 9.

- [ ] **Step 4: Подготовить связанные lookup-сервисы**

Создать связанные сервисы для schema export, project discovery, metadata/form conversion и resource projections. Не добавлять registry в сериализуемый `ConfigurationContext`; новый путь пока вызывают только локальные тесты, а production переключается в Task 9.

- [ ] **Step 5: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime metadata/projectDefinition metadata/resourceTopology
pnpm --filter @nkdk/core type-check
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; два новых набора не разделяют кэши и значения. Legacy reset API остаются до Task 9.

- [ ] **Step 6: Создать коммит**

```powershell
git add packages/core/metadata/ruleRuntime packages/core/metadata/projectDefinition packages/core/metadata/resourceTopology packages/core/metadata/standardMembers
git commit -m "refactor: :recycle: изолировать project и schema registries"
```

### Task 5: Сделать validation, data path и references экземплярными

**Files:**
- Create: `packages/core/metadata/validation/validationRegistrySet.ts`
- Create: `packages/core/metadata/validation/validationRegistrySet.test.ts`
- Modify: `packages/core/metadata/validation/yamlValueValidationRegistry.ts`
- Modify: `packages/core/metadata/validation/formValidationRegistry.ts`
- Modify: `packages/core/metadata/validation/formDataPathProjectionRegistry.ts`
- Modify: `packages/core/metadata/validation/formStructureProjectionRegistry.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndexRegistry.ts`
- Modify: `packages/core/metadata/validation/dataPath/registry.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerKindRegistry.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/testSupport.ts`

**Interfaces:**
- Consumes: `RuleRegistrySet` из Task 4 и секции validation, dataPaths, references.
- Produces: `ValidationRegistrySet`; bound `createValidationServices(ruleRegistries, validationRegistries)`.

- [ ] **Step 1: Написать тест двух validation registries**

```ts
it("uses validators and reference resolvers from its own definition", async () => {
  const first = createValidationRegistrySet(rulesWithLocalYamlValidator("first"))
  const second = createValidationRegistrySet(rulesWithLocalYamlValidator("second"))

  await expect(first.validateLocalValue({ propertyType: "Sample", value: "value" })).resolves.toEqual("first")
  await expect(second.validateLocalValue({ propertyType: "Sample", value: "value" })).resolves.toEqual("second")
})
```

В `testSupport.ts` определить `rulesWithLocalYamlValidator(result)` через
`defineMetadataRules({...emptyMetadataRules, validation: [{ kind:
"localYamlValue", propertyType: "Sample", validate: async () => result }]})`.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation/validationRegistrySet.test.ts --project core-metadata`

Expected: FAIL: фабрика отсутствует.

- [ ] **Step 3: Перенести validation maps в экземпляр**

Создать таблицы из definition; `rulesSnapshot` только читает registries и больше не вызывает `registerTypeRule`. Owner-fact collectors становятся явными validation descriptors при сборке `metadataRules`.

- [ ] **Step 4: Проверить новый путь без snapshot/restore**

Добавить локальные тесты нового validation-пути без snapshot/restore. Существующие production и legacy-тесты не переключать до Task 9.

- [ ] **Step 5: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/validation --project core-metadata
pnpm --filter @nkdk/core type-check
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; новый validation registry не изменяет definition и не зависит от legacy register-функций.

- [ ] **Step 6: Создать коммит**

```powershell
git add packages/core/metadata/validation packages/core/metadata/ruleRuntime
git commit -m "refactor: :recycle: изолировать validation registries"
```

### Task 6: Сделать component и operation registries экземплярными

**Files:**
- Create: `packages/core/metadata/operations/operationRegistrySet.ts`
- Create: `packages/core/metadata/operations/operationRegistrySet.test.ts`
- Modify: `packages/core/metadata/components/descriptor.ts`
- Modify: `packages/core/metadata/importFromXml/componentDescriptor.ts`
- Modify: `packages/core/metadata/importFromXml/validationContribution.ts`
- Modify: `packages/core/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/core/metadata/workerPool/operationRegistry.ts`
- Modify: `packages/core/metadata/workerPool/worker.ts`
- Modify: `packages/core/metadata/composition/workerOperations.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/contracts.ts`
- Modify: `packages/core/metadata/ruleRuntime/definition/testSupport.ts`

**Interfaces:**
- Consumes: components, imports, synchronization, operations и workerOperations definitions.
- Produces: `OperationRegistrySet`; `createMetadataWorkerHandler(registries)` без global registrations.

- [ ] **Step 1: Написать тест изоляции component и worker operation**

```ts
it("runs the worker operation from the owning registry", async () => {
  const first = createOperationRegistrySet(rulesWithProbeWorker("first"))
  const second = createOperationRegistrySet(rulesWithProbeWorker("second"))
  const state = {} as MetadataWorkerPersistentState

  await expect(first.worker.run({ kind: "probe", value: "x" }, state)).resolves.toMatchObject({ value: "first" })
  await expect(second.worker.run({ kind: "probe", value: "x" }, state)).resolves.toMatchObject({ value: "second" })
})
```

В `testSupport.ts` определить `rulesWithProbeWorker(value)` как definition с
одним `workerOperations` descriptor `probe`. Тест использует то же узкое
приведение пустого state, что существующий `operationRegistry.test.ts`; в
production новое приведение не добавляется.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/operations/operationRegistrySet.test.ts --project core-metadata`

Expected: FAIL: registry set отсутствует.

- [ ] **Step 3: Реализовать registry set и descriptors**

Перенести `descriptorsByKind`, worker handlers/reset handlers, import contributions и sync profiles в экземпляр. Повтор ключа сохраняет поведение текущей категории: где сейчас регистрация бросает ошибку, конструктор экземпляра бросает тот же обычный `Error`; где используется `Map.set`, поздняя definition заменяет раннюю.

- [ ] **Step 4: Перевести worker dispatcher**

```ts
export function createMetadataWorkerHandler(registries: OperationRegistrySet) {
  return async (command: MetadataWorkerOperationCommand) =>
    registries.worker.run(command, workerState)
}
```

Подготовить handler, принимающий registries явно. Существующий `worker.ts` продолжает старый запуск до атомарного переключения в Task 9.

- [ ] **Step 5: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/components metadata/importFromXml metadata/fullSyncToXml metadata/workerPool --project core-metadata
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; новый dispatcher изолирован. Legacy maps и reset API остаются до Task 9.

- [ ] **Step 6: Создать коммит**

```powershell
git add packages/core/metadata/components packages/core/metadata/importFromXml packages/core/metadata/fullSyncToXml packages/core/metadata/operations packages/core/metadata/workerPool packages/core/metadata/composition
git commit -m "refactor: :recycle: изолировать operation registries"
```

### Task 7: Собрать `metadataRules` без side effects

**Files:**
- Create: `packages/core/metadata/composition/metadataRules.ts`
- Create: `packages/core/metadata/composition/metadataRules.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/index.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Modify: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/metadata/composition/coreMetadata.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/tests/registerCoreMetadata.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/directRoundTrip.test.ts`
- Test: `packages/core/metadata/projectDefinition/specs.test.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`

**Interfaces:**
- Consumes: экземплярные definition categories из Tasks 2–6.
- Produces: единственный `metadataRules`; импорт `core/index.ts` не меняет состояние.

- [ ] **Step 1: Написать тест отсутствия side effects и полноты композиции**

```ts
it("exports one explicit metadata definition without invoking register functions", async () => {
  vi.resetModules()
  const register = vi.fn()
  vi.doMock("../commonObjects/register", () => ({ registerCommonObjects: register }))

  const { metadataRules } = await import("./metadataRules")

  expect(register).not.toHaveBeenCalled()
  expect(Object.keys(metadataRules.projectSpecs).length).toBeGreaterThan(0)
  expect(Object.keys(metadataRules.propertyTypes).length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/composition/metadataRules.test.ts --project unit`

Expected: FAIL: `metadataRules` отсутствует либо импорт вызывает старую регистрацию.

- [ ] **Step 3: Заменить регистраторы definitions**

Каждый конкретный модуль экспортирует immutable section или `defineMetadataRules({...emptyMetadataRules, section})`. Индексы только импортируют и передают эти значения в `composeMetadataRules(commonObjectsRules, formRules, appliedObjectRules, validationAdapters)`; они не вызывают register и не полагаются на top-level import ради side effect.

- [ ] **Step 4: Удалить старый bootstrap**

Удалить `registerCoreMetadata`, `coreMetadataRegistered`, `registerMetadataLayers`, test setup регистрации и побочный вызов из `packages/core/index.ts`. Временно экспортировать `metadataRules` из core до физического разделения.

- [ ] **Step 5: Проверить поведение на существующих границах**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/__tests__/directRoundTrip.test.ts metadata/projectDefinition/specs.test.ts metadata/validation/projectFileSchema.test.ts --project core-metadata
pnpm --filter @nkdk/core type-check
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; XML fixtures не изменены; `rg -n "registerCoreMetadata|registerMetadataLayers" packages/core` не находит production-кода.

- [ ] **Step 6: Создать коммит**

```powershell
git add packages/core
git commit -m "refactor: :recycle: собрать metadataRules без side effects"
```

### Task 8: Ввести экземплярный `MetadataRuntime`

**Files:**
- Create: `packages/core/metadata/runtime/contracts.ts`
- Create: `packages/core/metadata/runtime/createMetadataRuntime.ts`
- Create: `packages/core/metadata/runtime/createMetadataRuntime.test.ts`
- Create: `packages/core/metadata/runtime/index.ts`
- Modify: `packages/core/metadata/composition/projectState.ts`
- Modify: `packages/core/metadata/project/validateProject.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Consumes: `MetadataRulesDefinition`, `MetadataWorkerManifest`, registry sets Tasks 3–6.
- Produces: синхронный `createMetadataRuntime({ rules, workers }): MetadataRuntime`; groups `projects`, `schemas`, `validation`, `import`, `sync`, `metadata`; идемпотентный `close()`.

- [ ] **Step 1: Написать lifecycle-тест двух runtime**

```ts
it("isolates rules and owns project state lifecycle", async () => {
  const workers = {
    preparedYamlProject: new URL("file:///test/prepared.js"),
    importFromXml: new URL("file:///test/import.js"),
    fullSyncToXml: new URL("file:///test/sync.js"),
    generic: new URL("file:///test/generic.js"),
  }
  const first = createMetadataRuntime({ rules: emptyMetadataRules, workers })
  const second = createMetadataRuntime({ rules: emptyMetadataRules, workers })
  const state = first.projects.createState()

  await expect(second.validation.validateProject({ projectDir: "test", projectState: state })).rejects.toThrow("другому runtime")

  await first.close()
  await first.close()
  await expect(state.rebuild({ projectDir: "test" })).rejects.toThrow("закрыт")
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/runtime/createMetadataRuntime.test.ts --project unit`

Expected: FAIL: runtime factory отсутствует.

- [ ] **Step 3: Реализовать синхронную фабрику и группы**

```ts
export function createMetadataRuntime(options: CreateMetadataRuntimeOptions): MetadataRuntime {
  const ruleRegistries = createRuleRegistrySet(options.rules)
  const validationRegistries = createValidationRegistrySet(options.rules)
  const operationRegistries = createOperationRegistrySet(options.rules)
  const resources = new RuntimeResourceOwner()
  return createBoundMetadataRuntime({
    rules: ruleRegistries,
    validation: validationRegistries,
    operations: operationRegistries,
    workers: options.workers,
    resources,
  })
}
```

Worker manifest обязателен, pool создаются лениво соответствующими сервисами. Runtime маркирует созданный state закрытым symbol владельца; foreign state и closed runtime дают обычный `Error` с понятным сообщением.

- [ ] **Step 4: Связать высокоуровневые операции**

Группы покрывают только production-вызовы MCP: project path/state/structure, schema export/summary, project validation, XML import, sync plan/write/state, rename и references. Существующие result/diagnostic contracts не менять.

- [ ] **Step 5: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/runtime metadata/project metadata/projectState metadata/importFromXml metadata/fullSyncToXml metadata/operations --project core-metadata
pnpm --filter @nkdk/core type-check
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS.

- [ ] **Step 6: Создать коммит**

```powershell
git add packages/core
git commit -m "feat: :sparkles: добавить экземплярный metadata runtime"
```

### Task 9: Перевести MCP и worker на явную композицию

**Files:**
- Create: `packages/mcp/src/metadataRuntimeHandle.ts`
- Create: `packages/mcp/src/metadataRuntimeHandle.test.ts`
- Create: `packages/mcp/src/metadataWorkerManifest.ts`
- Create: `packages/core/metadata/composition/workers/preparedYamlProject.ts`
- Create: `packages/core/metadata/composition/workers/importFromXml.ts`
- Create: `packages/core/metadata/composition/workers/fullSyncToXml.ts`
- Create: `packages/core/metadata/composition/workers/generic.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/projectStateHandle.ts`
- Modify: `packages/mcp/src/server.ts`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `packages/core/package.json`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/workerPool/worker.ts`
- Modify: legacy registry-файлы из Tasks 3–6 и их reset/snapshot-тесты

**Interfaces:**
- Consumes: `metadataRules`, `createMetadataRuntime`, official worker entrypoint.
- Produces: lazy `MetadataRuntimeHandle.get()/close()`; MCP worker manifest с URL файлов в `dist/bin`.

- [ ] **Step 1: Написать тест ленивого singleton и закрытия**

```ts
it("creates one runtime lazily and closes it once", async () => {
  const runtime = { close: vi.fn(async () => undefined) }
  const create = vi.fn(() => runtime)
  const handle = createMetadataRuntimeHandle(async () => ({ create }))

  expect(create).not.toHaveBeenCalled()
  expect(await handle.get()).toBe(await handle.get())
  expect(create).toHaveBeenCalledOnce()
  await handle.close()
  await handle.close()
  expect(runtime.close).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/metadataRuntimeHandle.test.ts`

Expected: FAIL: handle отсутствует.

- [ ] **Step 3: Реализовать MCP handle и обновить services**

Заменить `loadCoreApi()` и `projectStateHandle` на `metadataRuntimeHandle`. Services получают соответствующую capability group. `shutdownNkdkMcpServer()` закрывает runtime и platform manager через `Promise.allSettled`.

- [ ] **Step 3а: Атомарно переключить production и удалить legacy globals**

Перевести все production-потребители lookup/dispatcher на связанные сервисы нового runtime. В том же изменении удалить module-level registry maps, side-effect `register...`, `clear...ForTests`, snapshot/restore и тесты старого пути. Не оставлять совместимый singleton, dual-write или временный fallback.

- [ ] **Step 4: Сделать rules-owned worker entrypoint**

Каждый entrypoint импортирует `metadataRules`, создаёт локальные registry sets и передаёт их нейтральной worker-фабрике. Никаких `register...()` и side-effect loader/register `.mjs` не остаётся.

- [ ] **Step 5: Изменить MCP build**

Пока физические пакеты не созданы, entrypoints импортируются из официального временного export `@nkdk/core/workers/*`; в Task 11 эти specifier механически меняются на `@nkdk/rules/workers/*`. Выходные имена `preparedYamlProjectWorker.js`, `importFromXmlWorker.js`, `fullSyncToXmlWorker.js`, `worker.js` сохраняются.

- [ ] **Step 6: Зафиксировать отсутствие retry после crash**

Расширить существующие `importFromXml/workerPool.test.ts` и `fullSyncToXml/workerPool.test.ts`: текущая операция rejected, worker уничтожены один раз, повтор `run` той же операции не запускается; новый верхнеуровневый вызов создаёт новый pool.

- [ ] **Step 7: Выполнить целевые проверки**

```powershell
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/workerPool.test.ts metadata/fullSyncToXml/workerPool.test.ts --project core-metadata
pnpm type-check
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; built MCP не содержит source paths `packages/core/metadata/**`.

- [ ] **Step 8: Создать коммит**

```powershell
git add packages/mcp packages/core
git commit -m "refactor: :recycle: связать MCP с metadata runtime"
```

### Task 10: Создать `@nkdk/runtime` и перенести нейтральный код

**Files:**
- Create: `packages/runtime/package.json`
- Create: `packages/runtime/tsconfig.json`
- Create: `packages/runtime/tsconfig.declarations.json`
- Create: `packages/runtime/vitest.config.ts`
- Create: `packages/runtime/index.ts`
- Create: `packages/runtime/rule-kit.ts`
- Create: `packages/runtime/worker.ts`
- Move: `packages/core/helpers/**` → `packages/runtime/helpers/**`
- Move: `packages/core/xml/**` → `packages/runtime/xml/**`
- Move: `packages/core/yaml/**` → `packages/runtime/yaml/**`
- Move: `packages/core/metadata/ruleRuntime/**` → `packages/runtime/metadata/ruleRuntime/**`
- Move: `packages/core/metadata/runtime/**` → `packages/runtime/metadata/runtime/**`
- Move: `packages/core/metadata/binary/**` → `packages/runtime/metadata/binary/**`
- Move: `packages/core/metadata/components/**` → `packages/runtime/metadata/components/**`
- Move: `packages/core/metadata/configurationIndex/**` → `packages/runtime/metadata/configurationIndex/**`
- Move: `packages/core/metadata/context/**` → `packages/runtime/metadata/context/**`
- Move: `packages/core/metadata/diagnostics/**` → `packages/runtime/metadata/diagnostics/**`
- Move: `packages/core/metadata/helpers/**` → `packages/runtime/metadata/helpers/**`
- Move: `packages/core/metadata/partialSyncToXml/**` → `packages/runtime/metadata/partialSyncToXml/**`
- Move: `packages/core/metadata/projectDefinition/**` → `packages/runtime/metadata/projectDefinition/**`
- Move: `packages/core/metadata/projectState/**` → `packages/runtime/metadata/projectState/**`
- Move: `packages/core/metadata/workerPool/**` → `packages/runtime/metadata/workerPool/**`
- Move: `packages/core/metadata/resourceTopology/core/**` → `packages/runtime/metadata/resourceTopology/core/**`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.build.json`

**Interfaces:**
- Consumes: чистые neutral zones после Tasks 3–9.
- Produces: private package exports `.`, `./rule-kit`, `./worker`; runtime package не зависит от core/rules.

- [ ] **Step 1: Написать package contract-тест до переноса**

Create `packages/runtime/packageExports.test.ts`:

```ts
it("exposes only root, rule-kit and worker", async () => {
  const manifest = await import("./package.json", { with: { type: "json" } })
  expect(Object.keys(manifest.default.exports)).toEqual([".", "./rule-kit", "./worker"])
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm exec vitest run packages/runtime/packageExports.test.ts`

Expected: FAIL: package отсутствует.

- [ ] **Step 3: Создать package shell и выполнить `git mv` нейтральных зон**

В `package.json` установить `"name": "@nkdk/runtime"`, `"private": true`, explicit exports без wildcard. Перенести только перечисленные целые зоны; split-каталоги project/validation/operations/import/sync остаются в core до Step 4.

- [ ] **Step 4: Перенести нейтральные исполнители split-каталогов**

Перенести project contracts/executors, validation registry sets/executors, operations registry/executors, importFromXml и fullSyncToXml infrastructure после удаления их concrete imports. Concrete descriptors остаются в core и импортируют `@nkdk/runtime/rule-kit`.

Разделить `packages/core/tests`: generic worker pool/context/binary helpers
перенести в `packages/runtime/tests`, а helpers конкретных round-trip и fixtures
оставить до Task 11. Тест перемещается вместе с production-файлом, который он
проверяет; XML fixtures не редактируются.

- [ ] **Step 5: Исправить imports через public boundary**

Код, который останется rules, импортирует runtime только как `@nkdk/runtime/rule-kit`, `@nkdk/runtime/worker` или корень. Внутри runtime используются относительные imports; запретить `@nkdk/runtime/internal/*`.

- [ ] **Step 6: Проверить package и архитектуру**

```powershell
pnpm install
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/runtime test
pnpm --filter @nkdk/runtime exec tsc -p tsconfig.declarations.json
if (rg -n "@nkdk/rules" packages/runtime/dist-types) { throw "runtime declarations reference rules" }
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: команды TypeScript/Vitest/architecture проходят; `rg` не выводит
совпадений, то есть `.d.ts` runtime не ссылаются на rules;
`pnpm why @nkdk/core --filter @nkdk/runtime` не показывает dependency. После
проверки разрешить абсолютные пути `packages/runtime` и
`packages/runtime/dist-types`, убедиться, что второй расположен непосредственно
внутри первого, и только затем удалить временный каталог командой
`Remove-Item -LiteralPath $resolvedDeclarationDir -Recurse -Force`.

- [ ] **Step 7: Создать коммит**

```powershell
git add packages/runtime packages/core pnpm-lock.yaml tsconfig.build.json
git commit -m "refactor: :recycle: выделить private-пакет runtime"
```

### Task 11: Создать `@nkdk/rules` и перенести definitions

**Files:**
- Create: `packages/rules/package.json`
- Create: `packages/rules/tsconfig.json`
- Create: `packages/rules/vitest.config.ts`
- Create: `packages/rules/index.ts`
- Create: `packages/rules/packageExports.test.ts`
- Move: `packages/core/metadata/commonObjects/**` → `packages/rules/metadata/commonObjects/**`
- Move: `packages/core/metadata/forms/**` → `packages/rules/metadata/forms/**`
- Move: `packages/core/metadata/appliedObjects/**` → `packages/rules/metadata/appliedObjects/**`
- Move: `packages/core/metadata/systemEnumerations/**` → `packages/rules/metadata/systemEnumerations/**`
- Move: `packages/core/metadata/standardMembers/**` → `packages/rules/metadata/standardMembers/**`
- Move: `packages/core/metadata/resourceTopology/adapters/**` → `packages/rules/metadata/resourceTopology/adapters/**`
- Move: `packages/core/metadata/composition/metadataRules.ts` → `packages/rules/metadataRules.ts`
- Move: `packages/core/metadata/composition/workers/**` → `packages/rules/workers/**`
- Move: оставшиеся concrete test helpers из `packages/core/tests/**` → `packages/rules/tests/**`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.build.json`

**Interfaces:**
- Consumes: `@nkdk/runtime/rule-kit` и `@nkdk/runtime/worker`.
- Produces: root export `metadataRules`; named exports `./workers/prepared-yaml`, `./workers/import`, `./workers/sync`, `./workers/generic`.

- [ ] **Step 1: Написать exports contract-тест**

```ts
it("exports metadataRules without registering or starting workers", async () => {
  const module = await import("./index")
  expect(Object.keys(module)).toEqual(["metadataRules"])
  expect(module.metadataRules).toEqual(expect.any(Object))
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm exec vitest run packages/rules/packageExports.test.ts`

Expected: FAIL: package отсутствует.

- [ ] **Step 3: Создать package и перенести concrete zones**

`package.json`: `"name": "@nkdk/rules"`, `"private": true`, dependency `"@nkdk/runtime": "workspace:*"`; exports только root и четыре именованных worker subpath.

- [ ] **Step 4: Перенести оставшиеся concrete adapters из split-каталогов**

Перенести concrete project specs, validation/data-path/reference contributions, component/import/sync/operation descriptors из core в rules. Их neutral registry/executor counterparts уже находятся в runtime. Если файл одновременно выполняет обе роли, разделить его на `descriptor.ts` в rules и executor с узким context в runtime.

Перенести относящиеся к rules fixture wizard и измерительные scripts в
`packages/rules/scripts`; общие test-duration/duplicate runners перенести в
корневой `scripts` в Task 12. Не вызывать scripts соседнего пакета.

- [ ] **Step 5: Перевести MCP worker build на rules exports**

Заменить временные `@nkdk/core/workers/*` на `@nkdk/rules/workers/*`; MCP продолжает выпускать worker рядом с `dist/bin/nkdk-mcp` и формирует пути manifest относительно `import.meta.url`.

- [ ] **Step 6: Выполнить rules boundary tests**

```powershell
pnpm install
pnpm --filter @nkdk/rules type-check
pnpm --filter @nkdk/rules test
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
```

Expected: PASS; `rg -n "@nkdk/runtime/internal|packages/runtime|packages/rules" packages/rules packages/mcp/scripts` не находит deep paths.

- [ ] **Step 7: Создать коммит**

```powershell
git add packages/rules packages/runtime packages/core packages/mcp pnpm-lock.yaml tsconfig.build.json
git commit -m "refactor: :recycle: выделить private-пакет rules"
```

### Task 12: Удалить `@nkdk/core` и завершить миграцию

**Files:**
- Delete: `packages/core/**`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/*.ts`
- Modify: `packages/mcp/package.json`
- Modify: `packages/mcp/vitest.config.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.build.json`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/src/reachability-rules.mjs`
- Modify: `tools/dependency-cruiser/test/package-rules-runtime-boundary.test.mjs`

**Interfaces:**
- Consumes: production-ready `@nkdk/runtime` и `@nkdk/rules`.
- Produces: workspace без `@nkdk/core`; MCP использует capability groups runtime напрямую.

- [ ] **Step 1: Написать падающий migration-test**

Добавить в `packages/mcp/src/server.test.ts`:

```ts
it("does not reference the removed core package", async () => {
  const sources = [
    readFileSync(new URL("./coreApi.ts", import.meta.url), "utf8"),
    readFileSync(new URL("./server.ts", import.meta.url), "utf8"),
  ].join("\n")
  expect(sources).not.toContain("@nkdk/core")
  expect(sources).toContain("@nkdk/runtime")
  expect(sources).toContain("@nkdk/rules")
})
```

Добавить в начало теста `import { readFileSync } from "node:fs"`.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts`

Expected: FAIL: MCP ещё содержит `@nkdk/core`.

- [ ] **Step 3: Перевести MCP contracts и удалить core**

Удалить ручной `CoreApi` cast и dynamic import core. Типы results/diagnostics/project structure импортировать из `@nkdk/runtime`; `metadataRules` — из `@nkdk/rules`. После `rg -n "@nkdk/core|packages/core" packages tools scripts -g '*.{ts,mjs,json}'` удалить оставшиеся ссылки и каталог core через проверенный `git rm`.

- [ ] **Step 4: Перенести общие test scripts**

Если MCP/rules/runtime ещё ссылаются на `packages/core/scripts/run-test-duration-check.mjs`, перенести общий runner в `scripts/run-test-duration-check.mjs` и обновить package scripts. Ни один пакет не запускает script соседнего пакета относительным путём.

- [ ] **Step 5: Усилить окончательные архитектурные правила**

Теперь каталоги существуют: тестировать actual graph, runtime → rules direct/type/transitive, rules imports вне трёх runtime exports, отсутствие wildcard exports и отсутствие composition imports из обычных модулей.

- [ ] **Step 6: Выполнить полный набор проверок**

```powershell
pnpm install
pnpm type-check
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base $(git merge-base HEAD origin/develop)
pnpm test
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
git diff --check
```

Expected: все команды PASS; `git status --short` не показывает XML fixtures; dependency-cruiser сообщает 0 нарушений и 0 циклов без изменения baseline.

- [ ] **Step 7: Проверить критерии спеки вручную**

Run:

```powershell
Test-Path packages/core
rg -n "@nkdk/core|registerCoreMetadata|clear.*RegistryForTests|snapshot.*RegistryForTests|restore.*RegistryForTests|@nkdk/runtime/internal" packages tools -g '*.{ts,mjs,json}'
git diff --name-only $(git merge-base HEAD origin/develop)..HEAD -- 'packages/**/__fixtures__/*.xml'
```

Expected: `Test-Path` возвращает `False`; оба `rg`/XML diff не выводят совпадений.

- [ ] **Step 8: Создать финальный коммит**

```powershell
git add -A
git commit -m "refactor!: :recycle: заменить core пакетами rules и runtime" -m "BREAKING CHANGE: @nkdk/core удалён. MCP и workspace-потребители используют @nkdk/runtime и @nkdk/rules."
```

- [ ] **Step 9: Запросить code review перед PR**

Использовать `superpowers:requesting-code-review`, устранить замечания через `superpowers:receiving-code-review`, затем повторить полный набор Step 6. Не запускать PR-цикл при любом падении.

---

## Передача работы на другой компьютер — состояние на 11 августа 2026

Этот раздел является оперативным журналом выполнения. При расхождении между
галочками в исходном плане и этим разделом ориентироваться на фактический Git и
результаты команд ниже: исходные галочки намеренно не переписывались задним
числом.

### Где находится работа

- Ветка: `codex/rules-runtime-split`.
- Удалённая ветка: `origin/codex/rules-runtime-split` после публикации
  handoff-коммита.
- Актуальная база: `origin/develop` на
  `27bf980f24bbc1d329f2c2ea0e0231080382799c`.
- Функциональная вершина до этого handoff-раздела:
  `fc6224b9cf9a093fee68f6fa5d275ab61091878d`.
- На момент записи ветка не отставала от `origin/develop` и содержала 44
  собственных коммита. Handoff-коммит добавляется поверх них.
- Рабочий каталог в исходной сессии:
  `C:\git\nkdk\.worktrees\rrsplit`. На другом компьютере этот путь не имеет
  значения; нужна именно удалённая ветка.

Команды для начала работы на новом компьютере:

```powershell
git fetch origin develop codex/rules-runtime-split
git switch --track origin/codex/rules-runtime-split
pnpm install --frozen-lockfile
git status --short
git rev-list --left-right --count origin/develop...HEAD
```

Ожидания после переключения:

- `git status --short` ничего не выводит;
- первая цифра `rev-list` равна `0`, если `develop` после этой записи не
  продвинулся;
- если `origin/develop` продвинулся, сначала влить его обычным merge в эту
  ветку, не выполнять rebase уже опубликованной истории и повторить все
  обязательные проверки.

### Что фактически реализовано

1. Исходный `@nkdk/core` физически разделён:

   - `packages/runtime` — нейтральные договоры и механизмы;
   - `packages/rules` — определения правил, конкретные обработчики и точки
     запуска worker;
   - `packages/core` отсутствует.

2. Направление production-зависимости закреплено как
   `@nkdk/rules → @nkdk/runtime`:

   - runtime не импортирует rules ни напрямую, ни через типы, ни транзитивно;
   - rules использует только разрешённые package exports runtime;
   - MCP является верхней точкой сборки и загружает оба пакета;
   - dependency-cruiser сообщает 0 нарушений границ и 0 циклов без baseline.

3. Публичная граница пакетов ограничена:

   - `@nkdk/runtime`;
   - `@nkdk/runtime/rule-kit`;
   - `@nkdk/runtime/worker`;
   - корень `@nkdk/rules` с `metadataRules`;
   - четыре именованные worker-точки `@nkdk/rules/workers/*`.

   Wildcard `internal/*` и deep imports между пакетами не добавлялись.

4. Создан структурированный `MetadataRulesDefinition`. В него перенесены или
   явно собраны:

   - property types и обработчики;
   - metadata item и form element rules;
   - project specs;
   - JSON Schema и property refs;
   - metadata components;
   - import/synchronization descriptors;
   - validation, project reference и DataPath contributions;
   - operation augmenters;
   - resource topology provider.

5. Для нового пути созданы экземплярные наборы реестров:

   - `RuleRegistrySet`;
   - `ValidationRegistrySet`;
   - `OperationRegistrySet`;
   - property registry set;
   - контекстный schema runtime.

   `RuleRegistrySet` теперь также владеет `components`; обнаружение компонентов
   и файлов проекта умеет получать этот экземпляр явно.

6. MCP переведён на ленивый `MetadataRuntimeHandle`:

   - runtime создаётся один раз при первом обращении;
   - `metadataRules` передаётся в `createMetadataRuntime` явно;
   - worker URL передаются обязательным manifest;
   - `runtime.close()` закрывает созданные project state;
   - MCP больше не импортирует удалённый core-пакет.

7. `ProjectState` принадлежит конкретному runtime:

   - runtime проверяет владение перед validation/import/sync/operations;
   - state другого runtime отклоняется;
   - конкретная фабрика полного `ProjectState` передаётся в
     `createMetadataRuntime` из `metadata/composition`;
   - внутренний runtime не импортирует слой composition, что отдельно проверяет
     dependency-cruiser;
   - обнаружение project files получает экземпляр `RuleRegistrySet`, а не
     проверяет старый глобальный флаг.

8. Общие тестовые скрипты вынесены из пакета в корневой `scripts/`:

   - `assert-test-durations.mjs`;
   - `run-test-duration-check.mjs`;
   - `test-file-lifecycle-reporter.mjs`.

   Ограничения длительности сейчас являются сообщениями, а не причиной падения
   всего прогона. Предупреждения `Цель 10ms превышена` в зелёном `pnpm test`
   ожидаемы и не означают ошибку этого разделения.

9. Исправлена обязательная Windows-команда архитектурных тестов. Было:

   ```text
   node --test 'tools/dependency-cruiser/test/*.test.mjs'
   ```

   Одинарные кавычки на Windows попадали в аргумент буквально, поэтому команда
   ложно завершалась успешно с `0 tests`. Теперь `pnpm
   test:architecture:rules` действительно выполняет 66 тестов.

### Последние найденные production-ошибки и их причины

Эти ошибки обнаружил не unit-тест, а расширенный packed smoke. Важно сохранить
этот контекст, чтобы не вернуть дефекты при удалении legacy-пути.

#### 1. Worker не видел описание metadata-компонента

Симптом:

```text
Не найдено описание metadata-компонента: configurationExtension
```

Причина: обычные статические imports worker-модулей выполнялись раньше тела
rules-owned entrypoint. Validation cache создавался до загрузки правил внутри
нового worker isolate.

Текущее исправление находится в:

- `packages/rules/metadata/composition/workers/generic.ts`;
- `packages/rules/metadata/composition/workers/preparedYamlProject.ts`;
- `packages/rules/metadata/composition/workers/importFromXml.ts`;
- `packages/rules/metadata/composition/workers/fullSyncToXml.ts`.

Сначала выполняется явная инициализация правил, после неё нужный worker-модуль
загружается динамическим import. При окончательном удалении legacy globals
порядок всё равно должен сохраниться: entrypoint сначала создаёт локальные
registry sets из `metadataRules`, затем создаёт обработчик worker.

#### 2. `ProjectState` не имел обработчика файлов

Симптом:

```text
ProjectState refresh processFiles is not configured
```

Причина: `createMetadataRuntime` вызывал низкоуровневый
`createProjectStateService` только с generic worker pool. Этого достаточно для
простых unit-тестов владения, но недостаточно для настоящего refresh: отсутствуют
writer, read session, dependency validator и prepared-YAML executor.

Исправление: конкретная фабрика `createDefaultProjectStateService` передаётся
из `metadata/composition/metadataRules.ts` через обязательную зависимость
`CreateMetadataRuntimeOptions.createProjectStateService`. Не импортировать её
обратно из внутреннего runtime: такой импорт нарушает
`metadata-core-not-reach-composition`.

#### 3. Main process всё ещё ожидал старую регистрацию при поиске файлов

Симптом:

```text
Metadata не зарегистрирована перед операцией validation/projectComponents
```

Причина: `projectState/projectFiles.ts` вызывал
`assertCoreMetadataRegistered()`, а `validation/projectComponents.ts` читал
глобальный component descriptor.

Исправление:

- `RuleRegistrySet` получил экземплярную таблицу `components`;
- `discoverValidationProjectComponents` может принимать registry set;
- `discoverProjectStateValidationFileBatches` передаёт его дальше;
- `ProjectState` получает связанную функцию discovery от конкретного runtime.

Не возвращать fallback на глобальную регистрацию в этом новом пути.

### Packed smoke, который нельзя ослаблять

`packages/mcp/scripts/smoke-packed.mjs` теперь:

1. собирает MCP и все worker;
2. создаёт настоящий npm tarball;
3. устанавливает tarball во временный пустой каталог;
4. запускает установленный `nkdk-mcp` через stdio;
5. проверяет регистрацию инструментов;
6. вызывает `nkdk.get_schema`;
7. копирует небольшой YAML-проект из rules fixtures;
8. вызывает настоящий `nkdk.validate_project`, включая `ProjectState` и worker;
9. проверяет защиту операций записи и закрытие соединений.

Именно шаг 8 нашёл три ошибки выше. Не заменять его проверкой только сборки или
моками. Временная переменная `NKDK_PACKED_SMOKE_DEBUG` и печать stack trace были
удалены после исправления; в production-коде их нет.

### Что проверено на функциональной вершине `fc6224b9c`

Успешно выполнены:

```powershell
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm --filter @nkdk/mcp type-check
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 27bf980f24bbc1d329f2c2ea0e0231080382799c
pnpm --filter @nkdk/mcp smoke:packed
git diff --check
```

Фактические существенные результаты:

- полный `pnpm test` завершился с кодом 0 во всех пакетах;
- 66 тестов правил dependency-cruiser прошли;
- dependency-cruiser: 0 нарушений границ, 0 циклов, baseline не менялся;
- новых дублей относительно base commit нет;
- packed MCP успешно выполнил schema и validation сценарии;
- type-check runtime, rules и MCP прошёл;
- worktree перед handoff-коммитом был чистым.

После любого нового merge из `origin/develop` или изменения production-кода
повторить весь набор, а не только целевые тесты.

### ВАЖНО: строгая спека ещё не выполнена полностью

Нельзя объявлять реализацию завершённой или открывать PR только потому, что все
команды выше зелёные. Физическое разделение пакетов и направленность зависимостей
готовы, но Task 9 Step 3а/4 и следующие критерии строгой спеки ещё не закрыты:

- все таблицы rules должны быть экземплярными;
- два runtime с пересекающимися ключами не должны видеть данные друг друга;
- production lookup не должен работать без ссылки на runtime, bound service или
  execution context;
- `registerCoreMetadata()` и старые module-level registry maps должны быть
  удалены;
- `clear...ForTests`, `snapshot...ForTests`, `restore...ForTests` старого пути и
  обслуживающие их тесты должны быть удалены;
- worker entrypoint должен создавать локальные registry sets из
  `metadataRules`, а не вызывать legacy bootstrap.

На текущей вершине ещё существуют:

- `packages/rules/metadata/composition/coreMetadata.ts`;
- вызовы `registerCoreMetadata()` в четырёх официальных worker entrypoints;
- `packages/rules/metadata/workerPool/preparedYamlProjectEntry.ts` со старой
  инициализацией;
- module-level registries в rule runtime, validation, project definition,
  components, import и synchronization;
- тестовая настройка `packages/rules/tests/registerCoreMetadata`;
- множество legacy-тестов, использующих snapshot/restore/clear.

Контрольная команда намеренно возвращает совпадения и тем самым показывает
незавершённый слой:

```powershell
rg -n "registerCoreMetadata|clear.*RegistryForTests|snapshot.*RegistryForTests|restore.*RegistryForTests" packages/rules packages/runtime -g "*.ts"
```

Не исправлять это переименованием функций или исключением файлов из проверки.
Нужно удалить состояние и перевести потребителей на экземплярный путь.

### Почему нельзя просто удалить `coreMetadata.ts`

Часть production-операций пока читает старые lookup-функции напрямую. Простое
удаление bootstrap приведёт к поздним ошибкам вроде отсутствующего component,
property type, project spec, import descriptor или sync profile. Особенно это
касается worker-кода, потому что каждый worker является отдельным isolate и не
наследует состояние main process.

Также функции правил нельзя передать worker через structured clone. Правильный
договор остаётся таким:

1. rules-пакет владеет worker entrypoint;
2. entrypoint статически импортирует `metadataRules`;
3. внутри isolate из definitions создаются локальные registry sets;
4. эти экземпляры передаются нейтральной worker-фабрике;
5. main process передаёт только URL worker и сериализуемые команды.

Не добавлять hash/handshake: это было явно исключено из первой версии.

### Рекомендуемый следующий слой

Продолжить Task 9, не начинать новую физическую перестановку каталогов.

1. Составить production-only список чтений legacy registries, исключив
   `*.test.ts`, `*.bench.ts` и test setup. Начать с:

   ```powershell
   rg -n "registerCoreMetadata" packages/rules/metadata -g "*.ts" -g "!*.test.ts" -g "!*.bench.ts"
   rg -n "getRegistered|resolve.*Profile|find.*Descriptor|Registry" packages/rules/metadata -g "*.ts" -g "!*.test.ts" -g "!*.bench.ts"
   ```

2. Разделить потребителей по атомарным категориям:

   - property/metadata item/form element execution;
   - project specs, components и topology;
   - validation/reference/DataPath;
   - import descriptors;
   - synchronization profiles;
   - operation augmenters;
   - worker persistent state и command operations.

3. Для каждой категории использовать уже существующий экземплярный registry set
   или добавить узкий bound service. Не вводить второй singleton и не записывать
   одновременно в legacy и новый реестр.

4. Перевести все чтения и записи категории одним законченным слоем, добавить
   тест двух runtime с одинаковым ключом и разным поведением, затем удалить
   legacy Map и test reset этой категории.

5. После каждого слоя выполнять:

   ```powershell
   pnpm --filter @nkdk/rules type-check
   pnpm --filter @nkdk/rules test
   pnpm test:architecture
   pnpm duplicates -- --base 27bf980f24bbc1d329f2c2ea0e0231080382799c
   ```

6. После перевода всех main-process потребителей заменить четыре worker
   entrypoint на фабрики, получающие локальные registry sets, и удалить
   `composition/coreMetadata.ts` вместе со старым setup.

7. Расширить packed smoke реальным import/sync сценарием, если это можно сделать
   на существующих неизменённых fixtures без внешнего процесса. Validation
   сценарий сохранить в любом случае.

8. Только после пустого контрольного `rg`, теста двух независимых runtime и
   полного набора проверок перейти к code review и PR.

### Архитектурные запреты, которые уже ловили реальные ошибки

- `@nkdk/runtime` никогда не импортирует `@nkdk/rules`.
- Внутренние metadata-модули не импортируют `metadata/composition`.
- Конкретная сборка выполняется только в composition roots.
- Rules не использует `@nkdk/runtime/internal/*` и исходные пути соседнего
  пакета.
- MCP и его build не обращаются к `packages/rules/**` или
  `packages/runtime/**`; только к package exports.
- Worker URL всегда передаётся manifest, worker pool создаётся лениво.
- Не передавать функции rules через structured clone.
- Не добавлять fallback на глобальный реестр в новом runtime-пути.
- Не обновлять dependency-cruiser baseline ради прохождения проверки.
- Не менять существующие XML-фикстуры, XML/YAML-семантику и не добавлять `!xml`.

### Полезные файлы для входа в контекст

Читать в таком порядке:

1. `docs/superpowers/specs/2026-08-10-rules-runtime-package-split-design.md` —
   утверждённый договор.
2. Этот план и данный handoff-раздел.
3. `packages/runtime/metadataRuntime.ts` — публичные contracts/factory.
4. `packages/rules/metadata/composition/metadataRules.ts` — definitions и
   concrete composition.
5. `packages/rules/metadata/runtime/createMetadataRuntime.ts` — текущая сборка
   capability groups и владение state.
6. `packages/runtime/metadata/ruleRuntime/ruleRegistrySet.ts` — экземплярный
   основной registry set.
7. `packages/rules/metadata/composition/metadataExecutionContext.ts` — явная
   граница execution context без process-default registry.
8. `packages/rules/metadata/composition/workers/*.ts` — worker entrypoints с
   локальными registry sets.
9. `packages/mcp/src/metadataRuntimeHandle.ts` и
   `packages/mcp/src/metadataWorkerManifest.ts` — верхняя сборка.
10. `packages/mcp/scripts/smoke-packed.mjs` — наиболее ценная интеграционная
    проверка готовой упаковки.
11. `tools/dependency-cruiser/src/metadata-rules.mjs` и
    `tools/dependency-cruiser/test/package-rules-runtime-boundary.test.mjs` —
    формальные ограничения границы.

### Ключевые коммиты для изучения истории

- `92091feb9` — упрощённый договор rules/runtime.
- `d9141a0e4` — единый подробный план.
- `a0018a52f` — исходные архитектурные ограничения.
- `ffe496150` — `MetadataRulesDefinition`.
- `5cc39c128` — экземплярные property registries.
- `a1c9c5562` — project/schema registries.
- `7619c0379` — validation registries.
- `ec32dfaad` — operation registries.
- `f3b5714dc` — основа metadata runtime.
- `c22b3a359` — MCP и экземплярный runtime.
- `fbe5892b3` — нижний runtime-слой.
- `2bf146178` — исполнитель правил в runtime.
- `85a275751` — нейтральная validation-механика.
- `116276970` — DataPath-механика в runtime.
- `ac4b9bffa` — пакет rules.
- `f7be1f2df` — физическая граница пакетов и обязательные проверки.
- `fc6224b9c` — packed validation, worker initialization и экземплярное project
  discovery.

### Чего не делать при продолжении

- Не возвращать `registerCoreMetadata()` или другой process-global bootstrap.
- Не скрывать совпадения контрольного `rg` исключениями или переименованиями.
- Не переносить оставшиеся файлы только по названию каталога; делить по
  ответственности и направлению зависимости.
- Не возвращать `@nkdk/core` как совместимый фасад.
- Не добавлять Turborepo, удалённый кэш, plugin API, версии definitions,
  handshake или новую иерархию ошибок в эту ветку.
- Не менять XML fixtures даже для упрощения теста.
- Не делать force-push опубликованной ветки.
- Не открывать PR до полного удаления legacy globals, независимости двух
  runtime и повторного code review.

### Что сделано по замечаниям

- Ветка обновлена с `origin/develop` merge-коммитом без переписывания истории;
  работа ведётся в отдельном worktree.
- Production validation, references и DataPath переведены на экземплярные
  `RuleRegistrySet`/`ValidationRegistrySet`/`DataPathRegistrySet`; module-level
  таблицы, legacy adapters и test reset/snapshot API удалены.
- Worker entrypoints создают локальные наборы registry и выполняются внутри
  явного execution context; старый `registerCoreMetadata()` и пять его вызовов,
  bootstrap/setup-файлы и side-effect registrations удалены.
- Импорт XML, full sync, prepared YAML validation и generic worker используют
  связанные с runtime операции; imported YAML finalizer, form projections,
  resource capabilities, component descriptors и standard members включены в
  `metadataRules` как явные contributions.
- Удалены оставшиеся legacy fallback для dependent items; контрольный поиск по
  `registerCoreMetadata` и `clear/snapshot/restore *RegistryForTests` пуст.
- Property item rules, JSON Schema definitions, system enumerations,
  metadata target owners и form element rules собираются в экземплярных
  registry sets; process-global fallback и legacy schema registration удалены.
- Import/full-sync worker state принадлежит отдельным command runner, а
  официальные entrypoints явно импортируют `metadataRules` и создают локальные
  registry sets. Тест подтверждает изоляцию двух worker runner.
- Удалены process-default `RuleRegistrySet`, `PropertyRuleRegistrySet`,
  `ValidationRegistrySet`, `DataPathRegistrySet` и `OperationRegistrySet`;
  production и тесты выполняются внутри явного `AsyncLocalStorage` context.
  Unit/core-metadata тесты запускаются с `--no-isolate`: test runner создаёт
  отдельный execution context на файл и повторно входит в него перед каждым
  тестом, поэтому порядок файлов не возвращает process-global состояние.
- Проверены типы `@nkdk/runtime` и `@nkdk/rules`. Unit/core-metadata набор без
  изоляции и отдельный integration-набор проходят без функциональных падений.
  Обычные тесты имеют жёсткий предел 50ms, а восемь сценариев с полной сборкой
  metadata, worker или файловым вводом-выводом выделены в отдельный
  integration-проект с изоляцией и пределом 100ms. Import worker использует переданный
  `persistentValidationState.rulesSnapshot` вместо повторной сборки.
- Диагностический `measure-validation-schemas.mjs` переведён на явный
  `metadataRules` execution context; итоговый контрольный поиск по
  `registerCoreMetadata`, `@nkdk/core`, `@nkdk/runtime/internal` и legacy
  reset/snapshot/restore API пуст.
- `pnpm duplicates -- --base 27bf980f24bbc1d329f2c2ea0e0231080382799c`
  не находит новых дублей.
- E2E переведён со снятого `registerCoreMetadata()` и прямых внутренних вызовов
  на публичный `MetadataRuntime`. Публичные операции входят в принадлежащие
  runtime registry-контексты; validation schema cache сохраняет допустимые
  исключительные `!xml`-значения, а ресурс куба внешнего источника помечен как
  `ownerChild`, поэтому required-поля заимствованного ресурса проверяются с
  политикой extension overlay.
- После исправлений повторно прошли `pnpm test`, `pnpm test:e2e`, полный
  type-check, обе архитектурные проверки и контроль новых дублей.
