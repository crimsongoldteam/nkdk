# Extension Project Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `validateProject({ projectDir })` единственной публичной операцией validation, которая за один проход проверяет `cf` и все `cfe/<ИмяРасширения>` с изолированными представлениями общего графа.

**Architecture:** Core обнаруживает компоненты от корня NKDK-проекта, выполняет общий first pass одним worker pool и складывает компонентно-адресованные факты в одно shared-представление. Second pass выбирает видимость по исходному компоненту: `cf` видит только `cf`, а `cfe/X` — сначала `cfe/X`, затем `cf`; если first pass `cf` непригоден, semantic second pass всех расширений заменяется одной блокирующей диагностикой на расширение.

**Tech Stack:** TypeScript 6, Vitest 4, Piscina, TypeBox, AJV standalone, SharedArrayBuffer, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`; задача реализуется через validation/project/component contracts.
- `packages/core/metadata/orchestration`, `validation` и `project` не должны ветвиться по конкретным `itemType`, именам XML-корней или прикладным каталогам.
- Знание корневых правил компонента получать через `MetadataComponentDescriptor`, а не через проверку конкретных metadata rules.
- Валидация специальных ограничений заимствованных объектов и форм не входит в задачу.
- Валидация `erf` и `epf` не входит в задачу.
- Оптимизация schema validation не входит в задачу; каждый YAML продолжает проверяться внутри полного прохода.
- Диагностики публичного результата адресуются от корня проекта: `cf/...` и `cfe/<ИмяРасширения>/...`.
- Перед завершением обязательно запустить `pnpm test` из корня worktree.

---

## File Structure

Новые файлы:

- `packages/core/metadata/validation/projectComponents.ts` — обнаружение `cf` и непосредственных `cfe`, создание нейтрального контекста компонента.
- `packages/core/metadata/validation/componentVisibility.ts` — единственное правило построения слоёв видимости shared graph.
- `packages/core/metadata/validation/projectValidationGraph.ts` — объединение неизменённых локальных вкладов в компонентные слои общего графа.
- `packages/core/metadata/validation/projectFirstPassReadiness.ts` — вычисление пригодности `cf` и выбор публикуемых first-pass диагностик.
- `packages/core/metadata/validation/projectComponents.test.ts` — тесты обнаружения компонентов.
- `packages/core/metadata/validation/componentVisibility.test.ts` — тесты изоляции слоёв.
- `packages/core/metadata/validation/projectFirstPassReadiness.test.ts` — тесты деградации.

Основные изменяемые файлы:

- `packages/core/metadata/validation/validateProject.ts` — координатор полного проекта.
- `packages/core/metadata/project/preparedYamlProject.ts` — компонентно-адресованные файловые задания.
- `packages/core/metadata/project/preparedYamlProjectWorker.ts` — first/second pass смешанного набора компонентов.
- `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts` — один общий worker pool и shared graph.
- `packages/core/metadata/validation/projectValidationTypes.ts` — компонентная принадлежность фактов.
- `packages/core/metadata/validation/sharedValidationBinaryOwners.ts` — компонентный ключ owner и layered lookup.
- `packages/core/metadata/validation/sharedProjectReferenceIndex.ts` — компонентный ключ ссылки и layered lookup.
- `packages/core/metadata/validation/projectValidationPasses.ts` — раздельный результат schema stage и готовность вклада.
- `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts` и соседние standalone-файлы — схема корня расширения по `itemType`.
- `packages/mcp/src/services/validateProject.ts` — передача корня проекта без предварительного выбора `cf`.
- `.agents/architecture.md` — поток validation всего проекта.

Удаляемые файлы:

- `packages/core/metadata/validation/validateProjectPartial.ts`.
- `packages/core/metadata/validation/projectValidationQueue.ts`.
- `packages/core/metadata/validation/projectValidationQueue.test.ts`.

---

### Task 1: Удалить публичный и worker partial-режим

**Files:**

- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/sharedProjectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/validationSnapshotProvider.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
- Modify: `packages/core/metadata/validation/validationSnapshotProvider.test.ts`
- Delete: `packages/core/metadata/validation/validateProjectPartial.ts`
- Delete: `packages/core/metadata/validation/projectValidationQueue.ts`
- Delete: `packages/core/metadata/validation/projectValidationQueue.test.ts`
- Delete: `packages/core/metadata/validation/validateProjectWorkerBoundary.test.ts`

**Interfaces:**

- Consumes: текущий `validateProject`, full first/second pass и внутренний `validateParsedFile`.
- Produces:

```ts
export interface ValidateProjectParams {
  projectDir: string
  context?: ConfigurationContext
  concurrency?: number
}

export interface ValidationWorkerPoolHandle {
  validateProject(
    params: Omit<ValidateProjectParams, "concurrency">
  ): Promise<ValidateProjectResult>
  close(): Promise<void>
  size(): number
}
```

`ValidationMode`, `runPartialValidation`, `validatePartial` worker messages и dependency-enqueue fallback отсутствуют. `validateParsedFile` остаётся внутренним импортом validation, но больше не экспортируется из `packages/core/index.ts`.

- [ ] **Step 1: Заменить partial-тест публичного handle отрицательным договором типов**

В `validateProject.test.ts` удалить тест `"validates one file through the persistent worker"` и добавить проверку полного сообщения:

```ts
it("does not expose a single-file worker protocol", async () => {
  const run = vi.fn(async (task: PreparedYamlProjectWorkerTask) => {
    if (task.kind === "initValidation") {
      return {
        kind: "initValidationResult" as const,
        formMs: 0,
        propertiesMs: 0,
        totalMs: 0,
      }
    }
    if (task.kind === "validateFirstPass") {
      return {
        kind: "validateFirstPassResult" as const,
        diagnostics: [],
        objectRecords: [],
        objectIndexEntries: [],
        memberIndexEntries: [],
        valueIndexEntries: [],
        pendingReferences: [],
        yamlLifetime: { current: 0, max: 0, parsed: 0, propertyEvents: 0 },
      }
    }
    if (task.kind === "validateSecondPass") {
      return { kind: "validateSecondPassResult" as const, diagnostics: [] }
    }
    throw new Error(`Неожиданное сообщение: ${task.kind}`)
  })
  const handle = createValidationWorkerPoolHandle({
    concurrency: 1,
    createWorkerPool: () => ({ run, destroy: vi.fn(async () => undefined) }),
  })
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")

  await handle.validateProject({ projectDir })

  expect(run.mock.calls.flatMap(([task]) => [task.kind])).not.toContain("validatePartial")
  await handle.close()
})
```

- [ ] **Step 2: Запустить focused-тест и подтвердить старый протокол**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: FAIL на проверке/компиляции, потому что union worker-сообщений ещё содержит `validatePartial`, а handle допускает `filePath`.

- [ ] **Step 3: Удалить `filePath` и ветвления partial из публичной операции**

В `validateProject.ts` оставить только вызов `validateProjectWithPreparedYaml`:

```ts
export async function validateProject(
  params: ValidateProjectParams
): Promise<ValidateProjectResult> {
  return validateProjectWithPreparedYaml({
    ...params,
    concurrency: normalizeValidationConcurrency(params.concurrency),
  })
}
```

В `createValidationWorkerPoolHandle` удалить ветку `projectParams.filePath` и всегда вызывать full pipeline.

- [ ] **Step 4: Удалить partial worker-протокол и файлы очереди**

Удалить:

```ts
{ kind: "validatePartial"; ... }
{ kind: "validatePartialResult"; ... }
PreparedYamlProjectWorkerPool.runPartialValidation
```

Удалить импорт и вызов `validateProjectPartial`, затем удалить три partial-файла из списка Files.

- [ ] **Step 5: Свести reference index к полному режиму**

Удалить параметр `mode`, `resolveProjectFile` и ветку `needsDependency` при отсутствии entry из:

```ts
createProjectReferenceIndex
createSharedProjectReferenceIndex
ValidationSnapshotProvider.referenceIndex
SecondPassPoolParams
```

Отсутствующая запись всегда даёт `reason: "notFound"`. Удалить тесты `"returns needsDependency in partial mode"` и `"creates a partial reference index that can request a dependency"`, сохранив тесты полного разрешения и отсутствующей ссылки.

- [ ] **Step 6: Удалить публичный экспорт одного разобранного файла**

Из `packages/core/index.ts` удалить:

```ts
export { validateParsedFile } from "./metadata/validation/validateFile"
```

Не удалять `validateFile.ts` и его unit-тесты: `projectValidationPasses.ts` продолжает использовать `validateParsedFile` внутри полного first pass.

- [ ] **Step 7: Запустить focused validation-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/validateProject.test.ts \
  metadata/validation/projectReferenceIndex.test.ts \
  metadata/validation/sharedProjectReferenceIndex.test.ts \
  metadata/validation/validationSnapshotProvider.test.ts
```

Expected: PASS; в `rg -n "validatePartial|runPartialValidation|validateProjectPartial" packages/core` нет результатов.

- [ ] **Step 8: Проверить типы core**

Run:

```bash
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 9: Создать коммит**

```bash
git add packages/core
git commit -m "refactor!: :recycle: удалить частичную валидацию" \
  -m "BREAKING CHANGE: validateProject и ValidationWorkerPoolHandle больше не принимают filePath; используйте полный validateProject({ projectDir })."
```

---

### Task 2: Обнаруживать `cf` и все `cfe` через правила компонентов

**Files:**

- Create: `packages/core/metadata/validation/projectComponents.ts`
- Create: `packages/core/metadata/validation/projectComponents.test.ts`
- Modify: `packages/core/metadata/components/descriptor.ts`
- Modify: `packages/core/metadata/resourceTopology/registry.ts`
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`

**Interfaces:**

- Consumes: `ComponentAddress`, `componentPath`, `MetadataComponentDescriptor.rootRule`, зарегистрированные project specs.
- Produces:

```ts
export interface ValidationProjectComponent {
  componentPath: string
  componentDir: string
  kind: "configuration" | "configurationExtension"
  rootRule: MetadataItemRule
  rootSpec: MetadataProjectSpec
  topology: CompiledMetadataResourceTopology
}

export interface ValidationProjectComponentDiscovery {
  components: ValidationProjectComponent[]
  hasConfiguration: boolean
}

export async function discoverValidationProjectComponents(
  projectDir: string
): Promise<ValidationProjectComponentDiscovery>
```

`resources.ts` получает необязательный контекст классификации:

```ts
export interface MetadataProjectResourceContext {
  topology: CompiledMetadataResourceTopology
  rootSpec: MetadataProjectSpec
}
```

Существующие вызовы без контекста продолжают использовать topology основной конфигурации.

- [ ] **Step 1: Написать failing-тест обнаружения нескольких расширений**

В `projectComponents.test.ts` создать временный проект с каталогами `cf`, `cfe/Продажи`, `cfe/Склад`, `erf/Отчёт`, `cfe/not-a-directory.txt` и проверить:

```ts
expect(
  (await discoverValidationProjectComponents(projectDir)).components.map(
    ({ componentPath, kind }) => ({ componentPath, kind })
  )
).toEqual([
  { componentPath: "cf", kind: "configuration" },
  { componentPath: "cfe/Продажи", kind: "configurationExtension" },
  { componentPath: "cfe/Склад", kind: "configurationExtension" },
])
```

Отдельным тестом проект без `cf`, но с `cfe/Продажи`, должен вернуть `hasConfiguration: false` и найденное расширение.

- [ ] **Step 2: Запустить новый тест и увидеть отсутствующий модуль**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectComponents.test.ts
```

Expected: FAIL с ошибкой импорта `./projectComponents`.

- [ ] **Step 3: Добавить безопасный lookup descriptor**

В `components/descriptor.ts` добавить:

```ts
export function findMetadataComponentDescriptor(
  kind: string
): MetadataComponentDescriptor | undefined {
  return descriptorsByKind.get(kind)
}
```

`getMetadataComponentDescriptor` сохранить для мест, где отсутствие descriptor является нарушением договора.

- [ ] **Step 4: Добавить topology для произвольного корневого правила**

В `resourceTopology/registry.ts` реализовать:

```ts
export function compileMetadataResourceTopologyForRootRule(
  rootRule: MetadataItemRule
): CompiledMetadataResourceTopology {
  const specs = getRegisteredProjectSpecs().map((spec) =>
    spec.dir === "" ? { ...spec, rule: rootRule } : spec
  )
  return compileMetadataResourceTopology(
    specs.map((spec) => ({
      ...spec,
      resources: describeProjectSpecResourceTopology(spec),
    }))
  )
}
```

Кэшировать результат по объекту `rootRule` через `WeakMap<MetadataItemRule, CompiledMetadataResourceTopology>`, чтобы все `cfe` одного вида использовали одну topology.

- [ ] **Step 5: Реализовать нейтральное обнаружение компонентов**

`projectComponents.ts` проверяет только адресный договор `cf` и непосредственные дочерние каталоги `cfe`; корневое правило берёт из descriptor:

```ts
const address =
  componentPath === "cf"
    ? ({ kind: "configuration" } as const)
    : ({ kind: "configurationExtension", name } as const)
const descriptor = getMetadataComponentDescriptor(address.kind)
```

`rootSpec` создать с `dir: ""`, `kind: descriptor.kind`, `rule: descriptor.rootRule` и `exportSchema: createMetadataItemProjectSchemaExporter(descriptor.rootRule)`.

- [ ] **Step 6: Научить resources классифицировать корень расширения**

Передавать `MetadataProjectResourceContext` в `classifyMetadataProjectPath`, `discoverMetadataProjectResources` и `resolveMetadataProjectResource`. В `toLegacyResource` для `role === "configuration"` использовать `context.rootSpec`, а не глобальный `configurationMetadataProjectSpec`.

Добавить тест: `Конфигурация.yaml` с extension context получает `owner.spec.rule === MetadataConfigurationExtensionRules`.

- [ ] **Step 7: Добавить component-aware файловые descriptors**

Расширить `PreparedYamlProjectFileDescriptor` и `ValidationProjectFile`:

```ts
interface ComponentFileAddress {
  componentPath: string
  componentDir: string
  rootProjectPath: string
}
```

Для `cf/Справочник/Товары/Свойства.yaml`:

```ts
{
  componentPath: "cf",
  projectPath: "Справочник/Товары/Свойства.yaml",
  rootProjectPath: "cf/Справочник/Товары/Свойства.yaml"
}
```

Добавить `discoverPreparedYamlValidationProjectFiles(projectDir)`, который обходит `discoverValidationProjectComponents`, вызывает component-context discovery и возвращает один отсортированный список.

- [ ] **Step 8: Запустить тесты discovery**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectComponents.test.ts \
  metadata/project/resources.test.ts \
  metadata/validation/projectFiles.test.ts \
  metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 9: Создать коммит**

```bash
git add packages/core/metadata/components \
  packages/core/metadata/resourceTopology \
  packages/core/metadata/project \
  packages/core/metadata/validation
git commit -m "feat: :sparkles: обнаруживать компоненты для validation"
```

---

### Task 3: Компилировать JSON Schema корня расширения

**Files:**

- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Modify: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerSchemaCache.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

**Interfaces:**

- Consumes: `ValidationProjectFile.owner.spec.rule`, `MetadataConfigurationExtensionRules`.
- Produces:

```ts
export interface ValidationSchemaCache {
  form(): CompiledSchema
  properties(rule: MetadataItemRule): CompiledSchema
  compileAll(): ValidationSchemaCacheCompileProfile
}

export interface ProjectValidationStandaloneModule {
  format: "project-validation-ajv-standalone-v2"
  context: ConfigurationContext
  refs?: Record<string, TSchema>
  form: ProjectValidationStandaloneValidator
  byItemType: Record<string, ProjectValidationStandaloneValidator>
}
```

- [ ] **Step 1: Написать failing-тест схемы корня расширения**

В `projectValidationPasses.test.ts` проверить schema cache напрямую:

```ts
const cache = createValidationSchemaCache(mockContext)
const extension = cache.properties(MetadataConfigurationExtensionRules)
const configuration = cache.properties(MetadataConfigurationRules)
const yaml = {
  Имя: "Продажи",
  НазначениеРасширенияКонфигурации: "Адаптация",
}

expect(extension.Check(yaml)).toBe(true)
expect(configuration.Check(yaml)).toBe(false)
```

Schema-hint API `exportJSONSchemaForProjectFile` остаётся component-local и не меняется в этой задаче.

- [ ] **Step 2: Запустить schema-тест**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectValidationStandaloneLoader.test.ts
```

Expected: FAIL: cache/standalone адресует корневую схему по пустому `dir` и выбирает основную конфигурацию.

- [ ] **Step 3: Перевести runtime cache с `dir` на `itemType`**

В `createValidationSchemaCache` заменить `properties(spec)` на `properties(rule)`, ключ:

```ts
const key = rule.itemType
const globalKey = [
  context.version,
  context.defaultLanguage,
  rule.itemType,
].join(":")
```

`compileProjectPropertiesSchema` принимает `MetadataItemRule` и использует `rule.itemType` как root JSON Schema graph.

- [ ] **Step 4: Добавить extension root в standalone schema set**

Сформировать уникальный список rules:

```ts
const propertyRules = uniqueRulesByItemType([
  configurationValidationProjectSpec.rule,
  getMetadataComponentDescriptor("configurationExtension").rootRule,
  ...validationProjectSpecs.map((spec) => spec.rule),
])
```

Вернуть `byItemType`, где ключ — `rule.itemType`. Обновить генератор и loader на формат `project-validation-ajv-standalone-v2`.

- [ ] **Step 5: Обновить first pass на rule-based cache**

В `validateProjectPropertiesFirstPass`:

```ts
schema: params.schemaCache.properties(params.file.owner.spec.rule)
```

В `compileAll` runtime и standalone cache пройти тот же уникальный список rules.

- [ ] **Step 6: Запустить standalone и schema-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/projectValidationStandaloneBuild.test.ts \
  metadata/validation/projectValidationStandaloneLoader.test.ts \
  metadata/validation/projectValidationWorkerSchemaCache.test.ts
```

Expected: PASS; standalone-модуль содержит validator для `MetadataConfigurationExtension`.

- [ ] **Step 7: Собрать core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS; `dist/projectValidationAjvStandalone.js` использует формат v2.

- [ ] **Step 8: Создать коммит**

```bash
git add packages/core/metadata/validation
git commit -m "feat: :sparkles: добавить validation-схему расширения"
```

---

### Task 4: Сделать shared graph компонентно-адресованным

**Files:**

- Create: `packages/core/metadata/validation/componentVisibility.ts`
- Create: `packages/core/metadata/validation/componentVisibility.test.ts`
- Create: `packages/core/metadata/validation/projectValidationGraph.ts`
- Create: `packages/core/metadata/validation/projectValidationGraph.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/sharedProjectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/sharedProjectReferenceIndex.test.ts`
- Modify: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
- Modify: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`

**Interfaces:**

- Consumes: `componentPath` из Task 2 и существующие локальные `ValidationObjectRecord`/reference entries, форматы которых продолжают использоваться import/sync без изменений.
- Produces:

```ts
export interface ValidationGraphContribution
  extends ValidationReferenceIndexEntries {
  objectRecords: ValidationObjectRecord[]
}

export interface ComponentValidationLayer {
  componentPath: string
  contribution: ValidationGraphContribution
}

export interface ProjectValidationGraph {
  layers: readonly ComponentValidationLayer[]
}

export function createProjectValidationGraph(
  layers: readonly ComponentValidationLayer[]
): ProjectValidationGraph

export function validationComponentLayers(
  componentPath: string
): readonly string[]
// cf -> ["cf"]
// cfe/X -> ["cfe/X", "cf"]

export interface SharedProjectValidationGraph {
  reference: SharedProjectReferenceSnapshot
  owners: BinarySharedOwnersSnapshot
}

export function createSharedProjectValidationGraph(
  graph: ProjectValidationGraph
): SharedProjectValidationGraph

export function createOwnerMetadataCacheFromSharedProjectValidationGraph(params: {
  projectDir: string
  componentPath: string
  graph: SharedProjectValidationGraph
}): OwnerMetadataCache
```

`ValidationObjectRecord`, reference entries, pending references и persisted `SharedValidationSnapshot` сохраняют текущий локальный формат. `componentPath` хранится на слое, а при кодировании общего shared graph записывается в каждую owner/reference строку. Это не меняет формат component-local snapshots, используемых import/sync.

- [ ] **Step 1: Написать тесты политики видимости**

В `componentVisibility.test.ts`:

```ts
expect(validationComponentLayers("cf")).toEqual(["cf"])
expect(validationComponentLayers("cfe/Продажи")).toEqual([
  "cfe/Продажи",
  "cf",
])
expect(() => validationComponentLayers("cfe")).toThrow(
  "Недопустимый validation componentPath"
)
```

- [ ] **Step 2: Написать failing-тест layered reference lookup**

В `sharedProjectReferenceIndex.test.ts` собрать `ProjectValidationGraph` с тремя слоями и одним `canonical`:

```ts
[
  layer("cf", [entry("Catalog.Товары", { source: "base" })]),
  layer("cfe/Продажи", [
    entry("Catalog.Товары", { source: "sales" }),
  ]),
  layer("cfe/Склад", [
    entry("Catalog.Товары", { source: "warehouse" }),
  ]),
]
```

Проверить:

- ссылка из `cf` разрешается в `cf`;
- ссылка из `cfe/Продажи` разрешается локально без конфликта с `cf`;
- ссылка из `cfe/Продажи` на canonical, имеющийся только в `cfe/Склад`, возвращает `notFound`;
- две одинаковые записи внутри одного `componentPath` дают conflict.

- [ ] **Step 3: Запустить новые тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/componentVisibility.test.ts \
  metadata/validation/sharedProjectReferenceIndex.test.ts
```

Expected: FAIL: записи shared index не содержат `componentPath`, одинаковые canonical конфликтуют глобально.

- [ ] **Step 4: Реализовать общий граф как набор локальных слоёв**

`createProjectValidationGraph` принимает не более одного слоя с одинаковым `componentPath`, сортирует слои по `componentPath` и копирует массивы contribution:

```ts
const byComponent = new Map<string, ValidationGraphContribution>()
for (const layer of layers) {
  if (byComponent.has(layer.componentPath)) {
    throw new Error(
      `Повторный validation-слой компонента: ${layer.componentPath}`
    )
  }
  byComponent.set(layer.componentPath, cloneValidationContribution(layer.contribution))
}
```

`cloneValidationContribution` копирует массивы, но не меняет элементы. Добавить тест duplicate layer и тест, что изменение исходного массива после создания graph не меняет graph.

- [ ] **Step 5: Реализовать component-qualified reference binary из слоёв**

`createSharedProjectValidationGraph` передаёт reference encoder пары `{ componentPath, entry }`. В encoded key хранить сначала `componentPath`, затем `canonical`. `createSharedProjectReferenceIndex` получает выбранный `componentPath`; lookup последовательно ищет canonical в разрешённых слоях:

```ts
for (const layer of validationComponentLayers(params.componentPath)) {
  const entry = lookupSharedEntry(view, layer, reference.target)
  if (entry !== undefined) return resolveEntry(reference, entry)
}
return notFound(reference)
```

Конфликт вычислять только среди одинаковых `(componentPath, section, canonical)`.

- [ ] **Step 6: Написать failing-тест layered owner lookup**

В `sharedValidationBinaryOwners.test.ts` создать graph layers с одноимёнными owners в `cf`, `cfe/Продажи`, `cfe/Склад`. Проверить, что cache с `componentPath: "cfe/Продажи"` возвращает локальный owner, cache `cf` — базовый, а список owners не включает значения только из соседнего расширения.

- [ ] **Step 7: Кодировать componentPath только в project-level binary owner table**

Не менять `createBinarySharedOwnersSnapshot(ValidationObjectTableSnapshot)` и его формат: он нужен component-local snapshots. Добавить `createBinarySharedProjectOwnersSnapshot(ProjectValidationGraph)`, который использует отдельные `PROJECT_MAGIC`/`PROJECT_VERSION`, добавляет строковый id компонента в owner row и сортирует по ключу:

```ts
[componentPath, ownerKind, ownerName]
```

`createOwnerMetadataCacheFromBinarySharedOwners` остаётся без изменений. Новый `createOwnerMetadataCacheFromSharedProjectValidationGraph` выполняет поиск по `validationComponentLayers(componentPath)`. `listRefs` объединяет слои с локальным приоритетом и удалением повторов.

- [ ] **Step 8: Собрать единый shared graph без изменения локальной object table**

Реализовать:

```ts
export function createSharedProjectValidationGraph(
  graph: ProjectValidationGraph
): SharedProjectValidationGraph {
  return {
    reference: createSharedProjectReferenceSnapshotFromGraph(graph),
    owners: createBinarySharedProjectOwnersSnapshot(graph),
  }
}
```

Не менять `ValidationObjectTable`, `createSharedValidationSnapshot` и persisted snapshot tests. Добавить отдельный round-trip тест project graph, который проверяет количество слоёв, локальный приоритет и изоляцию.

- [ ] **Step 9: Запустить shared graph-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/componentVisibility.test.ts \
  metadata/validation/projectValidationGraph.test.ts \
  metadata/validation/sharedProjectReferenceIndex.test.ts \
  metadata/validation/sharedValidationBinaryOwners.test.ts \
  metadata/validation/sharedValidationSnapshot.test.ts \
  metadata/validation/dataPath/ownerCache.test.ts
```

Expected: PASS.

- [ ] **Step 10: Создать коммит**

```bash
git add packages/core/metadata/validation
git commit -m "feat: :sparkles: изолировать компоненты validation-графа"
```

---

### Task 5: Выполнять общий first pass и вычислять пригодность `cf`

**Files:**

- Create: `packages/core/metadata/validation/projectFirstPassReadiness.ts`
- Create: `packages/core/metadata/validation/projectFirstPassReadiness.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

**Interfaces:**

- Consumes: полный список `PreparedYamlProjectFileDescriptor` из Task 2 и component-scoped contributions из Task 4.
- Produces:

```ts
export interface ValidationFirstPassFileResult {
  componentPath: string
  filePath: string
  rootProjectPath: string
  contributedFacts: boolean
  schemaDiagnostics: Diagnostic[]
}

export interface ComponentFirstPassPoolResult {
  componentPath: string
  contribution: ValidationGraphContribution
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
}

export interface FirstPassPoolResult {
  components: ComponentFirstPassPoolResult[]
  diagnostics: Diagnostic[]
  schemaDiagnostics: Diagnostic[]
  fileResults: ValidationFirstPassFileResult[]
  yamlLifetime: ValidationYamlLifetime
}

export interface ProjectFirstPassReadiness {
  configurationReady: boolean
  blockedExtensionPaths: readonly string[]
  publishedDiagnostics: Diagnostic[]
}

export function evaluateProjectFirstPass(params: {
  hasConfiguration: boolean
  componentPaths: readonly string[]
  firstPass: FirstPassPoolResult
}): ProjectFirstPassReadiness
```

- [ ] **Step 1: Написать failing unit-тест readiness**

Покрыть четыре случая:

```ts
it.each([
  { hasCf: true, cfSchemaErrors: 0, cfContributed: true, ready: true },
  { hasCf: true, cfSchemaErrors: 1, cfContributed: true, ready: false },
  { hasCf: true, cfSchemaErrors: 0, cfContributed: false, ready: false },
  { hasCf: false, cfSchemaErrors: 0, cfContributed: false, ready: false },
])(...)
```

При `ready: false`:

- `blockedExtensionPaths` содержит все `cfe`;
- `publishedDiagnostics` содержит все diagnostics `cf`;
- для `cfe` содержит только `schemaDiagnostics`;
- semantic/first-pass fact diagnostic `cfe` отсутствует.

- [ ] **Step 2: Запустить readiness-тест**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectFirstPassReadiness.test.ts
```

Expected: FAIL с отсутствующим модулем.

- [ ] **Step 3: Разделить schema diagnostics и готовность вклада файла**

В `ProjectValidationFirstPassResult` добавить:

```ts
schemaDiagnostics: Diagnostic[]
contributedFacts: boolean
```

Правила:

- ошибка чтения или YAML syntax: `contributedFacts: false`;
- зарегистрированный структурный validator, после которого возвращается `failedFirstPass`: `false`;
- успешно завершённый extraction: `true`;
- наличие JSON Schema error сохраняет `true`, если extraction состоялся, но всё равно делает `cf` непригодной на уровне `evaluateProjectFirstPass`.

`schemaDiagnostics` содержит только syntax + JSON Schema, а не equal-name, fact или second-pass diagnostics.

- [ ] **Step 4: Возвращать fileResults из worker**

В `runValidationFirstPass` на каждый descriptor добавлять:

```ts
fileResults.push({
  componentPath: file.componentPath,
  filePath: file.absolutePath,
  rootProjectPath: file.rootProjectPath,
  contributedFacts: first.contributedFacts,
  schemaDiagnostics: first.schemaDiagnostics,
})
```

Worker должен разрешать файл через его `componentDir` и resource context, а не через общий корень проекта.

- [ ] **Step 5: Агрегировать смешанные компоненты одним pool**

`runValidationFirstPass` pool принимает `projectDir` как корень NKDK-проекта и общий список descriptors. Round-robin не группирует компоненты специально. Каждый worker группирует локальные вклады по `componentPath` и возвращает `componentResults`; pool сливает одноимённые результаты:

```ts
function mergeComponentFirstPassResults(
  results: readonly ComponentFirstPassPoolResult[]
): ComponentFirstPassPoolResult[] {
  const merged = new Map<string, ComponentFirstPassPoolResult>()
  for (const result of results) {
    const current = merged.get(result.componentPath) ??
      emptyComponentFirstPassResult(result.componentPath)
    merged.set(result.componentPath, {
      componentPath: result.componentPath,
      contribution: mergeGraphContributions(
        current.contribution,
        result.contribution
      ),
      diagnostics: [...current.diagnostics, ...result.diagnostics],
      schemaDiagnostics: [
        ...current.schemaDiagnostics,
        ...result.schemaDiagnostics,
      ],
      fileResults: [...current.fileResults, ...result.fileResults],
    })
  }
  return [...merged.values()].sort((a, b) =>
    a.componentPath.localeCompare(b.componentPath, "ru")
  )
}
```

Общий результат дублирует плоские `diagnostics`, `schemaDiagnostics` и `fileResults` только для координатора; факты остаются в `components[].contribution`.

- [ ] **Step 6: Реализовать evaluateProjectFirstPass**

`configurationReady` вычислять так:

```ts
const cfFiles = firstPass.fileResults.filter(
  ({ componentPath }) => componentPath === "cf"
)
const configurationReady =
  hasConfiguration &&
  cfFiles.length > 0 &&
  cfFiles.every(({ contributedFacts, schemaDiagnostics }) =>
    contributedFacts &&
    !schemaDiagnostics.some(({ severity }) => severity === "error")
  )
```

Дополнительно требовать fileResult для `cf/Конфигурация.yaml`; отсутствие корневого файла делает `configurationReady: false`.

- [ ] **Step 7: Написать интеграционный тест одного чтения**

В `validateProject.test.ts` создать `cf` и два `cfe`, по одному properties YAML в каждом, сбросить read counters и проверить каждый абсолютный путь:

```ts
expect(getProjectValidationReadCountForTests(filePath)).toBe(0)
```

для main process и `validationYamlLifetime.parsed` через worker-boundary test равен числу YAML. Тест гарантирует отсутствие второго чтения при speculative first pass.

- [ ] **Step 8: Запустить first-pass тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/projectFirstPassReadiness.test.ts \
  metadata/project/preparedYamlProjectWorker.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/validation/validateProject.test.ts
```

Expected: PASS для first-pass и readiness сценариев; second-pass extension assertions появятся в Task 6.

- [ ] **Step 9: Создать коммит**

```bash
git add packages/core/metadata/validation \
  packages/core/metadata/project
git commit -m "feat: :sparkles: объединить first pass компонентов"
```

---

### Task 6: Выполнять layered second pass и безопасную деградацию

**Files:**

- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**

- Consumes: `ProjectFirstPassReadiness`, `ProjectValidationGraph` из component contributions и component-scoped worker states.
- Produces:

```ts
export interface SecondPassPoolParams {
  projectDir: string
  context: ConfigurationContext
  graph: ProjectValidationGraph
  blockedComponentPaths: readonly string[]
}
```

`runValidationSecondPass` создаёт один `SharedProjectValidationGraph`. Worker выбирает owner/reference view по `state.file.componentPath`; reference partitions передаются как `{ componentPath, references }`, не изменяя локальный тип `PendingMetadataTargetReference`.

- [ ] **Step 1: Написать failing integration-тест изоляции расширений**

Создать проект:

- `cf` объявляет `Справочник.Базовый`;
- `cfe/Продажи` объявляет локальный `Справочник.Локальный`;
- `cfe/Склад` содержит ссылку на `Справочник.Локальный`.

Проверить:

```ts
expect(messagesFor("cfe/Продажи")).not.toContain("Не найден объект")
expect(messagesFor("cfe/Склад")).toContain(
  'Не найден объект "Справочник.Локальный"'
)
```

Добавить одноимённый объект в `cf` и `cfe/Продажи`; в `cfe/Продажи` он не должен давать конфликт.

- [ ] **Step 2: Написать failing integration-тест DataPath расширения**

В `cf` создать owner с реквизитом, в форме `cfe/Продажи` сослаться на этот `ПутьКДанным`. Ожидание: диагностики DataPath нет. В `cfe/Склад` добавить локальный owner с отличающимся набором полей и проверить локальный приоритет.

- [ ] **Step 3: Запустить integration-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: FAIL: текущий second pass строит один глобальный owner/reference index без компонентного view.

- [ ] **Step 4: Научить worker выбирать view по состоянию**

В `runValidationSecondPass` создать cache views:

```ts
const views = new Map<string, {
  ownerCache: OwnerMetadataCache
  referenceIndex: ProjectReferenceIndex
}>()

function view(componentPath: string) {
  const cached = views.get(componentPath)
  if (cached !== undefined) return cached
  const created = {
    ownerCache: createOwnerMetadataCacheFromSharedProjectValidationGraph({
      projectDir: message.projectDir,
      componentPath,
      graph: message.sharedProjectValidationGraph,
    }),
    referenceIndex: createSharedProjectReferenceIndex({
      projectDir: message.projectDir,
      componentPath,
      snapshot: message.sharedProjectValidationGraph.reference,
      resolveObjectFilePath: (target) =>
        resolveObjectFilePath({
          projectDir: join(message.projectDir, componentPath),
          target,
        }),
    }),
  }
  views.set(componentPath, created)
  return created
}
```

Для каждого state использовать `view(state.file.componentPath)`. Не создавать view соседнего расширения.

- [ ] **Step 5: Фильтровать blocked components**

Перед отправкой second-pass task:

```ts
const blocked = new Set(secondPassParams.blockedComponentPaths)
const pendingReferenceLayers = secondPassParams.graph.layers
  .filter(({ componentPath }) => !blocked.has(componentPath))
  .map(({ componentPath, contribution }) => ({
    componentPath,
    references: contribution.pendingReferences ?? [],
  }))
```

Pool распределяет пары `{ componentPath, reference }` между активными worker, затем снова группирует назначение по componentPath для worker task. Worker использует `view(layer.componentPath).referenceIndex` для каждой группы и пропускает states, чей `state.file.componentPath` заблокирован. `cf` не блокируется: политика относится только к расширениям.

- [ ] **Step 6: Добавить блокирующую диагностику на расширение**

Координатор создаёт ровно одну диагностику:

```ts
{
  filePath: join(projectDir, componentPath, "Конфигурация.yaml"),
  line: 1,
  col: 1,
  severity: "error",
  source: "cross-file",
  message:
    "Семантическая валидация расширения невозможна из-за ошибок базовой конфигурации",
}
```

Если `cf` отсутствует, добавить отдельную structure-диагностику на `cf/Конфигурация.yaml`: `"Базовая конфигурация cf не найдена"`.

- [ ] **Step 7: Написать тесты деградации**

Покрыть:

1. syntax error в `cf` + schema error в `cfe/A`: обе исходные ошибки и одна блокирующая ошибка `cfe/A`, без reference/DataPath ошибок `cfe/A`;
2. JSON Schema error в `cf` с успешно извлечёнными фактами: тот же полный запрет semantic second pass `cfe`;
3. registered first-pass failure `cf`: тот же запрет;
4. битая ссылка `cf`, найденная только в second pass: semantic second pass `cfe` выполняется;
5. битый `cfe/A` не блокирует `cfe/B`;
6. отсутствующая `cf`: schema errors всех `cfe` плюс одна блокирующая ошибка на каждое расширение.

- [ ] **Step 8: Нормализовать диагностики от корня проекта**

Перед dedupe/sort преобразовать абсолютный путь:

```ts
function toRootProjectDiagnostic(
  projectDir: string,
  diagnostic: Diagnostic
): Diagnostic {
  return {
    ...diagnostic,
    filePath: relative(projectDir, resolve(diagnostic.filePath))
      .split(sep)
      .join("/"),
  }
}
```

Проверить, что путь не выходит за `projectDir`; нарушение внутреннего договора должно бросать ошибку, а не возвращать `../`.

- [ ] **Step 9: Запустить core validation-набор**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/validateProject.test.ts \
  metadata/validation/projectMetadataReferences.test.ts \
  metadata/validation/dataPath/resolver.test.ts \
  metadata/validation/sharedProjectReferenceIndex.test.ts \
  metadata/validation/sharedValidationBinaryOwners.test.ts
```

Expected: PASS; пути ожиданий начинаются с `cf/` или `cfe/<Имя>/`.

- [ ] **Step 10: Проверить типы**

Run:

```bash
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 11: Создать коммит**

```bash
git add packages/core/metadata/validation \
  packages/core/metadata/project
git commit -m "feat: :sparkles: валидировать расширения по общему графу"
```

---

### Task 7: Перевести MCP на полный корневой результат

**Files:**

- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/services/validateProject.test.ts`
- Modify: `packages/mcp/src/services/validationHandle.ts`
- Modify: `packages/mcp/src/services/componentResolver.ts`
- Modify: `packages/mcp/src/services/componentResolver.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`

**Interfaces:**

- Consumes:

```ts
validateProject(params: {
  projectDir: string
}): Promise<{ diagnostics: Diagnostic[] }>
```

- Produces: существующий MCP input `{ projectDir }`; output diagnostics уже содержат `cf/...` и `cfe/<Имя>/...`.

- [ ] **Step 1: Переписать failing service-тест на корень проекта**

В первом тесте `validateProject.test.ts` вернуть от mock:

```ts
[
  {
    filePath: "cf/Справочник/Товары/Свойства.yaml",
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message: "Неизвестное поле",
  },
  {
    filePath: "cfe/Продажи/Справочник/Товары/Свойства.yaml",
    line: 1,
    col: 1,
    severity: "error",
    source: "reference",
    message: "Не найдена ссылка",
  },
]
```

Проверить `core.validateProject`:

```ts
expect(core.validateProject).toHaveBeenCalledWith({ projectDir })
```

и оба пути без потери component prefix.

- [ ] **Step 2: Запустить MCP service-тест**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/services/validateProject.test.ts
```

Expected: FAIL: service вызывает core с `componentDir` и обрезает `cf/`.

- [ ] **Step 3: Удалить предварительный resolve `cf`**

В `componentResolver.ts` выделить read-only проверку только корня:

```ts
export function resolveProjectRoot(projectDirInput: string):
  | { ok: true; projectDir: string; nkdkDir: string }
  | { ok: false; error: ToolFailure } {
  const projectDir = resolve(projectDirInput)
  if (!existsSync(projectDir)) {
    return {
      ok: false,
      error: toolError("not_found", "Проект не найден", {
        projectDir: projectDirInput,
      }),
    }
  }
  if (!statSync(projectDir).isDirectory()) {
    return {
      ok: false,
      error: toolError("invalid_arguments", "Путь не является каталогом проекта"),
    }
  }
  return { ok: true, projectDir, nkdkDir: resolve(projectDir, ".nkdk") }
}
```

`resolveComponent` переиспользует `resolveProjectRoot`. `validateYamlProject` вызывает `resolveProjectRoot`, но не требует существования `cf`. Основной вызов:

```ts
const project = resolveProjectRoot(input.projectDir)
if (!project.ok) return project.error
const diagnostics = (
  await handle.validateProject({ projectDir: project.projectDir })
).diagnostics
```

Не использовать `resolveComponent({ componentPath: "cf" })`: отсутствие `cf` является validation-диагностикой полного проекта, а не причиной скрыть schema-проверки найденных расширений.

- [ ] **Step 4: Упростить отображение путей**

Core уже возвращает root-relative path. MCP проверяет, что он относительный и не содержит `..`, нормализует разделители, но не вычисляет relative от `cf`.

```ts
function visibleProjectPath(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/")
  if (isAbsolute(filePath) || normalized.split("/").includes("..")) {
    throw new Error("Core вернул путь диагностики вне NKDK-проекта")
  }
  return normalized
}
```

- [ ] **Step 5: Удалить `filePath?` из dynamic core API**

В `packages/mcp/src/coreApi.ts` обе сигнатуры `validateProject` и handle оставить только с `projectDir`.

- [ ] **Step 6: Запустить MCP-тесты и type-check**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run \
  src/services/validateProject.test.ts \
  src/services/componentResolver.test.ts \
  src/tools/registerTools.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/mcp
git commit -m "feat: :sparkles: возвращать validation всех компонентов"
```

---

### Task 8: Обновить архитектуру и выполнить итоговую проверку

**Files:**

- Modify: `.agents/architecture.md`
- Test: all workspace packages

**Interfaces:**

- Consumes: завершённые публичные договоры Tasks 1–7.
- Produces: согласованная архитектурная документация и полностью проверенная ветка.

- [ ] **Step 1: Обновить раздел «Валидация»**

Зафиксировать в `.agents/architecture.md`:

- discovery `cf` и всех `cfe`;
- componentPath на заданиях и фактах;
- единый shared graph;
- views `cf` и `cfe/X → cf`;
- запрет видимости соседних `cfe`;
- readiness first pass `cf`;
- schema-only деградацию расширений;
- root-relative diagnostics;
- отсутствие отдельной валидации одного файла.

Не менять описание других операций, использующих component-local индексы.

- [ ] **Step 2: Проверить ограничения**

Проверить, что `.agents/restrictions.md` без изменений сохраняет ограничение о специальных правилах заимствованной формы:

```md
Валидация согласованности заимствованной формы расширения с текущей формой
основной конфигурации пока не реализована.
```

- [ ] **Step 3: Проверить отсутствие partial API**

Run:

```bash
rg -n \
  "validateProjectPartial|validatePartial|runPartialValidation|filePath\\?: string" \
  packages/core/metadata/validation \
  packages/core/metadata/project \
  packages/core/index.ts \
  packages/mcp/src/coreApi.ts
```

Expected: no matches. Совпадения `partial` вне validation не относятся к задаче и не изменяются.

- [ ] **Step 4: Запустить форматирование изменённых файлов**

Run:

```bash
pnpm exec prettier --write \
  packages/core/metadata/validation \
  packages/core/metadata/project \
  packages/core/metadata/components \
  packages/core/metadata/resourceTopology \
  packages/mcp/src \
  .agents/architecture.md
```

Expected: exit 0. Проверить `git diff` и не принимать форматирование несвязанных файлов за пределами перечисленных каталогов.

- [ ] **Step 5: Запустить type-check всех затронутых пакетов**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

- [ ] **Step 6: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected:

- `packages/core`: all tests passed;
- `packages/platform`: all tests passed;
- `packages/mcp`: all tests passed;
- process exit code 0.

- [ ] **Step 7: Проверить diff и рабочее дерево**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: нет whitespace errors; изменены только файлы validation/project/component, MCP и `.agents/architecture.md`.

- [ ] **Step 8: Создать итоговый документационный коммит**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: обновить архитектуру validation"
```
