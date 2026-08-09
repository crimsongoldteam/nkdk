# Rule Runtime And Metadata Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переименовать `metadata/orchestration` в `metadata/ruleRuntime` и последовательно закрепить направленные границы metadata-слоёв и workspace-пакетов через dependency-cruiser.

**Architecture:** Изменение выполняется от механического переименования к нижним договорам, адаптерам и composition roots. Каждый этап сначала устраняет обратные импорты, затем включает запрещающее правило без baseline; полный граф учитывает runtime-, type-only и транзитивные зависимости.

**Tech Stack:** TypeScript 7, Node.js 26, pnpm 10, Vitest 4, dependency-cruiser 18, Node test runner.

## Global Constraints

- Исходный коммит реализации: `84bece0d0f`.
- Не изменять существующие XML-фикстуры.
- Не изменять XML-, YAML-, JSON Schema- и runtime-поведение.
- Не изменять публичный API `@nkdk/core` и `@nkdk/platform`.
- Не добавлять новые поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять совместимый каталог `metadata/orchestration`.
- Не переписывать исторические документы в `docs/superpowers` и сохранённые отчёты производительности.
- Не расширять baseline dependency-cruiser; каждое новое правило включается только после устранения текущего долга.
- Каждый task завершается рабочим коммитом и проверкой `pnpm duplicates -- --base 84bece0d0f`.
- Исходный `pnpm test` выполняет 5 759 функциональных тестов, но падает на временных лимитах; новые функциональные падения недопустимы.

---

### Task 1: Переименовать orchestration в ruleRuntime

**Files:**
- Move: `packages/core/metadata/orchestration/**` → `packages/core/metadata/ruleRuntime/**`
- Modify: `packages/core/**/*.ts`
- Modify: `tools/dependency-cruiser/**/*.mjs`
- Modify: `.dependency-cruiser.mjs`
- Modify: `AGENTS.md`
- Modify: `.agents/skills/_shared/metadata/rules.md`
- Modify: `.agents/skills/_shared/metadata/tests.md`
- Create: `tools/dependency-cruiser/test/rule-runtime-rename.test.mjs`

**Interfaces:**
- Produces: действующий внутренний путь `packages/core/metadata/ruleRuntime`.
- Preserves: все существующие экспорты из `ruleRuntime/index.ts` и публичные экспорты `packages/core/index.ts`.

- [ ] **Step 1: Добавить падающую проверку имени слоя**

```js
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import test from "node:test"

test("metadata rule runtime uses the ruleRuntime path", () => {
  assert.equal(existsSync("packages/core/metadata/orchestration"), false)
  assert.equal(existsSync("packages/core/metadata/ruleRuntime"), true)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/rule-runtime-rename.test.mjs`

Expected: FAIL — старый каталог существует, новый отсутствует.

- [ ] **Step 3: Перенести каталог и обновить действующие ссылки**

Run: `git mv packages/core/metadata/orchestration packages/core/metadata/ruleRuntime`

Обновить `orchestration` → `ruleRuntime` только в production-коде, тестах, dependency-cruiser, `AGENTS.md` и `.agents`. Не менять `docs/superpowers/**` и файлы отчётов.

Обязательные изменения конфигурации:

```js
export const neutralProductionPattern =
  "^packages/core/metadata/(?:ruleRuntime|validation|project|standardMembers)/"
```

- [ ] **Step 4: Проверить отсутствие действующего старого пути**

Run: `rg -n "orchestration" AGENTS.md .agents packages tools .dependency-cruiser.mjs --glob '!**/dist/**'`

Expected: нет ссылок, обозначающих старый каталог или слой.

- [ ] **Step 5: Проверить типы, архитектуру и распознавание rename**

Run: `pnpm type-check`

Run: `pnpm test:architecture:rules && pnpm test:architecture`

Run: `git diff --find-renames --summary | rg 'rename packages/core/metadata/\{orchestration => ruleRuntime\}'`

Expected: все команды PASS; Git показывает перемещения как rename.

- [ ] **Step 6: Выполнить полную проверку и зафиксировать переименование**

Run: `pnpm test`

Expected: 5 759 функциональных тестов проходят; допустима только известная ошибка временных лимитов.

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add AGENTS.md .agents .dependency-cruiser.mjs packages tools/dependency-cruiser
git commit -m "refactor: :recycle: переименовать orchestration в rule runtime"
```

---

### Task 2: Обобщить транзитивные правила dependency-cruiser

**Files:**
- Create: `tools/dependency-cruiser/src/reachability-rules.mjs`
- Modify: `tools/dependency-cruiser/src/reachability.mjs`
- Modify: `tools/dependency-cruiser/src/cruise-result.mjs`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/fixture.config.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/example/contracts/direct.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/example/core/transitive.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/example/adapters/runtime.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/example/adapters/types.ts`

**Interfaces:**
- Produces: `findReachabilityViolations(result, rules)` и `addReachabilityViolations(result, rules, knownViolations)`.
- Produces: `ReachabilityRule = { name, severity, fromPatterns, fromNotPatterns?, toPatterns, toNotPatterns?, comment }` в форме JSDoc typedef.
- Preserves: имя `neutral-not-reach-implementations` и формат baseline.

- [ ] **Step 1: Добавить падающие синтетические случаи зон**

```ts
// contracts/direct.ts
import type { AdapterValue } from "../adapters/types"
export type ContractValue = AdapterValue

// core/transitive.ts
export { runtimeValue } from "../adapters/runtime"

// adapters/runtime.ts
export const runtimeValue = 1

// adapters/types.ts
export interface AdapterValue { readonly value: string }
```

В `architecture-rules.test.mjs` ожидать нарушения `example-core-not-reach-adapters` для direct type-only и transitive runtime путей.

- [ ] **Step 2: Подтвердить, что общий механизм отсутствует**

Run: `pnpm test:architecture:rules`

Expected: FAIL — новые zone-нарушения не формируются.

- [ ] **Step 3: Описать правила независимо от обхода графа**

```js
export const metadataImplementationReachabilityRule = {
  name: "neutral-not-reach-implementations",
  severity: "error",
  comment: "Нейтральный metadata-слой не знает конкретные реализации.",
  fromPatterns: [neutralProductionPattern],
  toPatterns: implementationTargetPatterns,
}
```

`reachability.mjs` должен построить обратный индекс один раз на правило, восстановить `via`, применить optional negative patterns и исключить test-модули с обеих сторон.

- [ ] **Step 4: Подключить обобщённый анализ без изменения результата проекта**

В `analyzeCruiseResult` вызывать `addReachabilityViolations` с массивом активных правил. Сохранить сортировку по `from`, `to`, `rule.name` и смягчение baseline по паре `from + rule.name`.

- [ ] **Step 5: Проверить синтетический и настоящий граф**

Run: `pnpm test:architecture:rules && pnpm test:architecture`

Expected: PASS, 0 нарушений настоящего графа.

- [ ] **Step 6: Зафиксировать общий механизм графовых зон**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add tools/dependency-cruiser
git commit -m "refactor: :recycle: обобщить транзитивные правила графа"
```

---

### Task 3: Закрепить межпакетную матрицу

**Files:**
- Modify: `tools/dependency-cruiser/src/common-rules.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/index.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/platform/index.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/platform/src/runtime.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/mcp/src/allowed.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/mcp/src/core-deep.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/forbidden-mcp.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/platform/src/forbidden-core.ts`

**Interfaces:**
- Produces rules: `core-not-reach-workspace-apps`, `platform-is-independent`, `mcp-no-workspace-deep-imports`.
- Allows: MCP → `packages/core/index.ts` и `packages/platform/index.ts`.

- [ ] **Step 1: Добавить падающие fixture-проверки направлений**

```js
assert.deepEqual(namesFor("packages/mcp/src/core-deep.ts"), new Set(["mcp-no-workspace-deep-imports"]))
assert.deepEqual(namesFor("packages/core/forbidden-mcp.ts"), new Set(["core-not-reach-workspace-apps"]))
assert.deepEqual(namesFor("packages/platform/src/forbidden-core.ts"), new Set(["platform-is-independent"]))
assert.deepEqual(namesFor("packages/mcp/src/allowed.ts"), new Set())
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `pnpm test:architecture:rules`

Expected: FAIL — новые имена правил отсутствуют.

- [ ] **Step 3: Добавить правила пакетов**

Использовать resolved path, а не `dependencyTypes`, чтобы workspace aliases из tsconfig тоже проверялись:

```js
{
  name: "mcp-no-workspace-deep-imports",
  severity: "error",
  from: { path: "^packages/mcp/src/", pathNot: testModulePattern },
  to: { path: "^packages/(?:core|platform)/(?!index\\.ts$)" },
}
```

Добавить точные запреты:

```js
{
  name: "core-not-reach-workspace-apps",
  severity: "error",
  from: { path: "^packages/core/", pathNot: testModulePattern },
  to: { path: "^packages/(?:mcp|platform)/" },
},
{
  name: "platform-is-independent",
  severity: "error",
  from: { path: "^packages/platform/", pathNot: testModulePattern },
  to: { path: "^packages/(?:core|mcp)/" },
}
```

Не запрещать `@nkdk/core` и `@nkdk/platform` как devDependency MCP: они встраиваются esbuild.

- [ ] **Step 4: Проверить настоящий граф и зафиксировать матрицу**

Run: `pnpm test:architecture:rules && pnpm test:architecture`

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add tools/dependency-cruiser
git commit -m "chore: :wrench: закрепить межпакетные границы"
```

---

### Task 4: Сделать diagnostics листовым договором

**Files:**
- Modify: `packages/core/metadata/diagnostics/binaryBatch.ts`
- Modify: `packages/core/metadata/diagnostics/collection.ts`
- Modify: `packages/core/metadata/diagnostics/collection.test.ts`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/diagnostics/forbidden.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/validation/types.ts`

**Interfaces:**
- Consumes: `Diagnostic`, `DiagnosticSeverity`, `DiagnosticSource`, `MetadataDiagnostic` из `diagnostics/types.ts`.
- Produces rule: `diagnostics-not-reach-validation`.
- Preserves: реэкспорты тех же типов из `validation/types.ts`.

- [ ] **Step 1: Добавить падающую графовую проверку diagnostics**

```ts
// fixtures/.../diagnostics/forbidden.ts
export type { MetadataDiagnostic } from "../validation/types"
```

Ожидать `diagnostics-not-reach-validation`.

- [ ] **Step 2: Перевести внутренние импорты на владельца типов**

```ts
import type {
  DiagnosticSource,
  DiagnosticSeverity,
  MetadataDiagnostic,
} from "./types"
```

В `collection.ts` и `collection.test.ts` импортировать `MetadataDiagnostic` из `./types`.

- [ ] **Step 3: Включить транзитивный запрет и проверить границу**

Добавить reachability rule с `fromPatterns: ["^packages/core/metadata/diagnostics/"]` и `toPatterns: ["^packages/core/metadata/validation/"]`.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/diagnostics --no-isolate`

Run: `pnpm test:architecture:rules && pnpm test:architecture`

Expected: PASS.

- [ ] **Step 4: Зафиксировать листовой diagnostics**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata/diagnostics tools/dependency-cruiser
git commit -m "refactor: :recycle: отделить договор diagnostics"
```

---

### Task 5: Разделить ядро и адаптеры resourceTopology

**Files:**
- Create directory: `packages/core/metadata/resourceTopology/core/`
- Create directory: `packages/core/metadata/resourceTopology/adapters/`
- Move to core: `types.ts`, `compiler.ts`, `patterns.ts`, `pathIndex.ts`, `projectProjection.ts`, `xmlExportProjection.ts`, `xmlImportProjection.ts`, `providerRegistry.ts`
- Move to core: `compiler.test.ts`, `projectProjection.test.ts`, `providerRegistry.test.ts`, `xmlExportProjection.test.ts`, `xmlImportProjection.test.ts`.
- Keep at resourceTopology root: `changeImpact.test.ts`, `contracts.test.ts` as cross-boundary behavior tests.
- Move: `registry.test.ts` → `adapters/registeredRules.test.ts`
- Move: `registry.ts` → `adapters/registeredRules.ts`
- Move: `capabilities.ts` → `adapters/capabilities.ts`
- Move: `metadataProvider.ts` → `adapters/metadataProvider.ts`
- Move: `metadataTargetOwner.ts` → `adapters/metadataTargetOwner.ts`
- Modify: all imports under `packages/core/metadata/**`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`

**Interfaces:**
- Core produces: `compileMetadataResourceTopology`, topology types, project/XML projections and provider registry port.
- Adapter produces: `compileRegisteredMetadataResourceTopology`, `compileMetadataResourceTopologyForRootRule`, capability registries and metadata provider.
- Produces rule: `resource-topology-core-is-leaf`.

- [ ] **Step 1: Расширить архитектурный тест будущей структуры**

```js
for (const file of ["compiler.ts", "types.ts", "projectProjection.ts", "providerRegistry.ts"]) {
  const source = readFileSync(`packages/core/metadata/resourceTopology/core/${file}`, "utf8")
  assert.doesNotMatch(source, /\.\.\/(?:adapters|ruleRuntime|project|configurationIndex)\//u)
}
```

Run: `node --test tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`

Expected: FAIL — каталог `core` ещё не существует.

- [ ] **Step 2: Перенести чистые модули и их тесты в core**

Исправить только относительные импорты. `core` не должен импортировать `PropertyRule`, `PreparedYamlFile`, configuration index или project registry.

- [ ] **Step 3: Перенести связывающие модули в adapters**

`adapters/registeredRules.ts` читает rule type registry и project definition registry. `adapters/capabilities.ts` остаётся владельцем runtime-регистраций возможностей. Все конкретные регистрации импортируют adapter path явно.

- [ ] **Step 4: Включить транзитивное правило листового ядра**

```js
{
  name: "resource-topology-core-is-leaf",
  severity: "error",
  fromPatterns: ["^packages/core/metadata/resourceTopology/core/"],
  toPatterns: [
    "^packages/core/metadata/(?:ruleRuntime|project|configurationIndex|resourceTopology/adapters)/",
  ],
}
```

- [ ] **Step 5: Проверить topology и полный граф**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology --no-isolate`

Run: `pnpm type-check && pnpm test:architecture:rules && pnpm test:architecture`

Expected: PASS.

- [ ] **Step 6: Зафиксировать границу resourceTopology**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata tools/dependency-cruiser
git commit -m "refactor: :recycle: отделить ядро resource topology"
```

---

### Task 6: Выделить нижнее определение YAML-проекта

**Files:**
- Create directory: `packages/core/metadata/projectDefinition/`
- Create: `packages/core/metadata/projectDefinition/projectSpecContracts.ts`
- Move from `metadata/project`: `path.ts`, `resources.ts`, `specs.ts`, `projectSpecHelpers.ts`, `projectSpecRegistry.ts`, `schemaRegistry.ts`, `componentIndexFacts.ts`, `localIndexes.ts`, `preparedYamlContracts.ts`, `preparedYamlDescriptor.ts`
- Move beside their owners: `path.test.ts`, `resources.test.ts`, `specs.test.ts`, `projectSpecRegistry.test.ts`, `schemaRegistry.test.ts`, `localIndexes.test.ts`.
- Modify: imports in `packages/core/index.ts`, `metadata/project/**`, `metadata/validation/**`, `metadata/projectState/**`, `metadata/operations/**`, `metadata/importFromXml/**`, `metadata/fullSyncToXml/**`, concrete registration modules.
- Modify: `.agents/architecture.md`

**Interfaces:**
- Produces lower layer `projectDefinition` for path normalization, project specs, resources, schema registry, local facts and prepared YAML descriptors.
- `projectSpecContracts.ts` owns `RegisteredProjectSpec` and `ProjectSpecNesting`; the mutable map remains isolated in `projectSpecRegistry.ts`.
- Leaves in `project`: file preparation, worker coordination, sync state and component state scenarios.
- Preserves public exports by updating `packages/core/index.ts` to the new owner paths.

- [ ] **Step 1: Добавить падающую проверку ответственности project**

В `packages/core/metadata/importBoundaries.test.ts` добавить:

```ts
it("project coordination does not own shared project definitions", () => {
  for (const file of ["path.ts", "resources.ts", "specs.ts", "projectSpecRegistry.ts", "schemaRegistry.ts"]) {
    expect(existsSync(join(METADATA_DIR, "project", file))).toBe(false)
    expect(existsSync(join(METADATA_DIR, "projectDefinition", file))).toBe(true)
  }
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts --no-isolate`

Expected: FAIL.

- [ ] **Step 3: Перенести leaf-договоры и реестры**

Использовать `git mv` для каждого файла и его теста. Из `projectSpecRegistry.ts` вынести интерфейсы `RegisteredProjectSpec` и `ProjectSpecNesting` в `projectSpecContracts.ts`; `specs.ts` и `projectSpecHelpers.ts` импортируют договор, а не mutable registry. Внутри `projectDefinition` зависимости допускаются на `ruleRuntime`, `resourceTopology/core`, `resourceTopology/adapters`, `context`, `components` и внешние библиотеки, но не на `project`, `validation`, `projectState`, `workerPool`.

- [ ] **Step 4: Обновить потребителей и публичные экспорты**

Пример целевого импорта validation:

```ts
import { parseProjectPath, projectPathFromFileSystem } from "../projectDefinition/path"
import type { PreparedYamlFile } from "../projectDefinition/preparedYamlContracts"
```

`validation/projectSpecs.ts` реэкспортирует из `projectDefinition/specs`, сохраняя текущие validation-имена.

- [ ] **Step 5: Проверить project definition и потребителей**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectDefinition metadata/project metadata/validation --no-isolate`

Run: `pnpm type-check && pnpm test:architecture`

Expected: PASS.

- [ ] **Step 6: Зафиксировать нижнее определение проекта**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core .agents/architecture.md
git commit -m "refactor: :recycle: выделить определение YAML-проекта"
```

---

### Task 7: Запретить validation зависеть от project

**Files:**
- Modify: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/metadata/validation/projectComponents.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/projectState/projectFiles.ts`
- Modify: `packages/core/metadata/register.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.test.ts`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/validation/forbidden-project.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/project/runtime.ts`

**Interfaces:**
- Produces rule: `validation-not-reach-project`; его цели включают coordinator-каталог и mutable project spec registry.
- Allows: `project -> validation` and both layers → `projectDefinition`.
- Changes internal registration port to `registerValidationMetadata(projectSpecs: readonly RegisteredProjectSpec[]): void`; validation receives a snapshot and does not read the mutable project spec registry.
- Keeps `assertCoreMetadataRegistered` in project-facing coordinators before they enter validation.

- [ ] **Step 1: Добавить падающий синтетический случай**

```ts
// validation/forbidden-project.ts
export { projectRuntime } from "../project/runtime"
```

Ожидать `validation-not-reach-project`.

- [ ] **Step 2: Передать validation снимок project specs**

В `registerValidationMetadata.ts` удалить импорт `getRegisteredProjectSpecs`, импортировать только `RegisteredProjectSpec` из `projectDefinition/projectSpecContracts` и принимать specs параметром:

```ts
export function registerValidationMetadata(projectSpecs: readonly RegisteredProjectSpec[]): void {
  if (registered) return
  registered = true
  registerOwnerFactCollectors(projectSpecs)
}
```

`metadata/register.ts` и `project/preparedYamlProjectWorker.ts` получают снимок через `getRegisteredProjectSpecs()` и передают его вниз. Тесты validation передают явно подготовленный снимок.

- [ ] **Step 3: Вернуть проверку готовности владельцам сценария**

Удалить `assertCoreMetadataRegistered` из `validation/projectComponents.ts`. В `projectState/projectFiles.ts` вызывать его перед `discoverValidationProjectComponents`; project worker уже проверяет регистрацию при получении снимка. Наблюдаемый текст ошибки о незарегистрированной metadata сохраняется.

- [ ] **Step 4: Проверить отсутствие реальных обратных импортов**

Run: `rg -n 'from "\.\./(?:\.\./)?project/' packages/core/metadata/validation --glob '*.ts' --glob '!*.test.ts'`

Run: `rg -n 'projectDefinition/projectSpecRegistry' packages/core/metadata/validation --glob '*.ts' --glob '!*.test.ts'`

Expected: обе команды пусты. Непустой результат блокирует включение правила: переименование пути или реэкспорт mutable registry не считается устранением зависимости.

- [ ] **Step 5: Включить транзитивный запрет**

```js
{
  name: "validation-not-reach-project",
  severity: "error",
  fromPatterns: ["^packages/core/metadata/validation/"],
  toPatterns: [
    "^packages/core/metadata/project/",
    "^packages/core/metadata/projectDefinition/projectSpecRegistry\\.ts$",
  ],
}
```

- [ ] **Step 6: Проверить границу и зафиксировать направление**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation metadata/project/preparedYamlProjectWorker.test.ts metadata/projectState/projectFiles.test.ts --no-isolate`

Run: `pnpm test:architecture:rules && pnpm test:architecture && pnpm type-check`

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata tools/dependency-cruiser
git commit -m "refactor: :recycle: направить project к validation"
```

---

### Task 8: Выделить composition roots

**Files:**
- Create: `packages/core/metadata/composition/coreMetadata.ts`
- Create: `packages/core/metadata/composition/projectState.ts`
- Create: `packages/core/metadata/composition/workerOperations.ts`
- Move logic from: `packages/core/metadata/register.ts`
- Move logic from: `packages/core/metadata/projectState/createDefaultService.ts`
- Move logic from: `packages/core/metadata/workerPool/registerOperations.ts`
- Move: `packages/core/metadata/register.test.ts` → `packages/core/metadata/composition/coreMetadata.test.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Modify: worker entrypoints under `metadata/workerPool`, `metadata/importFromXml`, `metadata/fullSyncToXml`
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/ruleRuntime/forbidden-composition.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/composition/runtime.ts`

**Interfaces:**
- Produces: `registerCoreMetadata`, `createDefaultProjectStateService`, `openProjectStateReadSession`, `registerMetadataWorkerOperations` from `metadata/composition`.
- Allows composition imports only from `packages/core/index.ts` and actual worker entrypoints.
- Produces rule: `metadata-core-not-reach-composition`.

- [ ] **Step 1: Добавить падающую проверку единой точки сборки**

```ts
it("composition roots own runtime assembly", () => {
  expect(existsSync(join(METADATA_DIR, "register.ts"))).toBe(false)
  expect(existsSync(join(METADATA_DIR, "projectState", "createDefaultService.ts"))).toBe(false)
  expect(existsSync(join(METADATA_DIR, "workerPool", "registerOperations.ts"))).toBe(false)
})
```

- [ ] **Step 2: Перенести три composition-модуля**

Сохранить сигнатуры функций без изменений. `coreMetadata.ts` собирает common objects, forms, applied objects, validation adapters и topology provider. `projectState.ts` связывает store, validation dependency resolver и worker pool. `workerOperations.ts` регистрирует validation/import/full-sync/query handlers.

- [ ] **Step 3: Обновить только разрешённые точки входа**

```ts
// packages/core/index.ts
import { registerCoreMetadata } from "./metadata/composition/coreMetadata"
export { createDefaultProjectStateService as createProjectStateService } from "./metadata/composition/projectState"
```

Worker entrypoints импортируют composition напрямую; обычные service/core-модули получают зависимости параметрами.

- [ ] **Step 4: Включить запрет достижимости composition**

Использовать правило:

```js
{
  name: "metadata-core-not-reach-composition",
  severity: "error",
  fromPatterns: ["^packages/core/metadata/(?!composition/)"],
  fromNotPatterns: [
    "^packages/core/metadata/workerPool/(?:worker|preparedYamlProjectEntry)\\.ts$",
    "^packages/core/metadata/(?:importFromXml|fullSyncToXml)/worker\\.ts$",
  ],
  toPatterns: ["^packages/core/metadata/composition/"],
}
```

- [ ] **Step 5: Проверить регистрацию и workers**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/composition/coreMetadata.test.ts metadata/projectState/service.test.ts metadata/workerPool --no-isolate`

Run: `pnpm type-check && pnpm test:architecture:rules && pnpm test:architecture`

Expected: PASS.

- [ ] **Step 6: Зафиксировать composition roots**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core tools/dependency-cruiser
git commit -m "refactor: :recycle: выделить composition roots"
```

---

### Task 9: Устранить обратные зависимости systemEnumerations и forms

**Files:**
- Move: `appliedObjects/configuration/mobileApplicationPermissionsEnumerations.ts` → `systemEnumerations/mobileApplicationPermissions.ts`
- Modify: `systemEnumerations/types.ts`, `fromYAML.ts`, `toYAML.ts`, `fromXML.ts`
- Modify: `forms/elements/calendarField/rules.ts`
- Modify: configuration rules and tests importing mobile permission tables.
- Modify: `commonObjects/index.ts`
- Modify: `forms/index.ts`

**Interfaces:**
- System enumeration tables are owned by `systemEnumerations`.
- System enumeration converters consume `PropertyRule` from `ruleRuntime/property/types`, never form rules.
- Forms register their own dynamic-list implementation.

- [ ] **Step 1: Добавить архитектурные ожидания**

В `importBoundaries.test.ts` проверить отсутствие production-импортов `systemEnumerations -> forms|appliedObjects` и `commonObjects/index.ts -> forms` через извлечение module specifiers.

- [ ] **Step 2: Подтвердить исходное падение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts --no-isolate`

Expected: FAIL на пяти существующих направлениях.

- [ ] **Step 3: Перенести mobile permission tables вниз**

Сохранить имена экспортов `RequiredMobileApplicationPermissions*`, `RequiredMobileApplicationPermissionMessages*`, `MobileApplicationFunctionalities*`. Обновить configuration imports на `../../systemEnumerations/mobileApplicationPermissions`.

- [ ] **Step 4: Отвязать system enumeration conversion от CalendarField**

```ts
import type { PropertyRule } from "../ruleRuntime/property/types"
```

Удалить реэкспорт `PropertyRule` из `calendarField/rules.ts`, если он больше не имеет потребителей.

- [ ] **Step 5: Перенести dynamic-list side-effect import во forms**

Удалить `import "../forms/commonObjects/dynamicList/types"` из `commonObjects/index.ts`; добавить эквивалентный импорт в `forms/index.ts` рядом с регистрацией других form common objects.

- [ ] **Step 6: Проверить перечисления, формы и зафиксировать направление**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/systemEnumerations metadata/appliedObjects/configuration metadata/forms/elements/calendarField --no-isolate`

Run: `pnpm type-check && pnpm test:architecture`

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: направить зависимости перечислений"
```

---

### Task 10: Устранить commonObjects -> forms

**Files:**
- Move: `commonObjects/childFormNames/resourceTopology.ts` → `forms/clientApplicationForm/childFormNamesResourceAdapter.ts`
- Move: `commonObjects/childFormNames/syncExternalFromXML.ts` → `forms/clientApplicationForm/childFormNamesImportAdapter.ts`
- Modify: `commonObjects/childFormNames/index/register/types` consumers.
- Modify: `forms/clientApplicationForm/register.ts`
- Move: `commonObjects/childFormNames/syncExternalFromXML.test.ts` → `forms/clientApplicationForm/childFormNamesImportAdapter.test.ts`
- Keep: `commonObjects/childFormNames/fromXML.test.ts`, `toXML.test.ts` beside the neutral conversion code.

**Interfaces:**
- `commonObjects/childFormNames` owns only property rule declarations and neutral types.
- Form adapters own `ClientApplicationFormRules`, XML form conversion, help/module copying and topology declarations.
- Adapter registration occurs from `forms/clientApplicationForm/register.ts`.

- [ ] **Step 1: Добавить падающую проверку leaf-свойства ChildFormNames**

```ts
it("ChildFormNames core does not import forms", () => {
  for (const file of productionFiles(join(METADATA_DIR, "commonObjects", "childFormNames"))) {
    expect(readFileSync(file, "utf8")).not.toMatch(/\.\.\/\.\.\/forms\//)
  }
})
```

- [ ] **Step 2: Перенести topology- и XML-адаптеры к форме**

Сохранить существующие registration IDs: `ChildFormNames`, `ClientApplicationFormHelp`. Не менять пути `Формы`, `Forms`, `Модуль.bsl` и `Справка`.

- [ ] **Step 3: Подключить адаптеры из form registration**

`forms/clientApplicationForm/register.ts` импортирует оба адаптера как side effects после объявления `ClientApplicationFormRules`.

- [ ] **Step 4: Проверить form import/full sync и зафиксировать изменение**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/childFormNames metadata/forms/clientApplicationForm metadata/fullSyncToXml/baseFormSource.test.ts --no-isolate`

Run: `pnpm type-check && pnpm test:architecture`

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: перенести адаптеры дочерних форм"
```

---

### Task 11: Устранить commonObjects -> appliedObjects

**Files:**
- Move: `commonObjects/recalculation/**` → `appliedObjects/metadataCalculationRegister/recalculation/**`
- Modify: `appliedObjects/metadataCalculationRegister/rules.ts` and registration.
- Move: `appliedObjects/metadataCommand/rules.ts` → `commonObjects/metadataCommand/rules.ts`
- Modify: `appliedObjects/metadataCommand/register.ts`
- Modify: `commonObjects/metadataExternalDataSourceCube/rules.ts`
- Modify: `commonObjects/metadataExternalDataSourceDimensionTable/rules.ts`
- Modify: `commonObjects/metadataExternalDataSourceTable/rules.ts`
- Move schema registration for `MetadataCommand` from `commonObjects/schemaRegister.ts` to `appliedObjects/metadataCommand/register.ts`.

**Interfaces:**
- `commonObjects/metadataCommand/rules.ts` owns the existing exact `MetadataCommandRules` value without applied-object registration.
- `appliedObjects/metadataCommand/register.ts` registers that common rule as the applied `MetadataCommand` collection.
- External data source command rules derive their owner-specific command module path from the same exact rule value.
- Recalculation belongs to `metadataCalculationRegister` and may consume its dimension rule directly.

- [ ] **Step 1: Добавить failing cases для обратных импортов**

В `importBoundaries.test.ts` ожидать, что production `commonObjects` не импортирует `appliedObjects`.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts --no-isolate`

Expected: FAIL на recalculation, MetadataCommand и schema registration.

- [ ] **Step 2: Перенести Recalculation к владельцу**

Перенести builders, rules, registration и тесты. В `metadataCalculationRegister/rules.ts` использовать локальный `RecalculationRules`; удалить регистрацию из `commonObjects/index.ts`.

- [ ] **Step 3: Перенести точное правило MetadataCommand вниз**

```ts
// appliedObjects/metadataCommand/register.ts
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
```

Перенести существующий `rules.ts` без расширения его типа. ExternalDataSource variants продолжают делать spread `MetadataCommandRules` и заменять только `commandModule.xmlPath`; это сохраняет строгий вывод типов по literal rule.

- [ ] **Step 4: Перенести регистрацию схемы к applied MetadataCommand**

`commonObjects/schemaRegister.ts` больше не импортирует applied rules. `appliedObjects/metadataCommand/register.ts` вызывает `registerProjectJSONSchema("MetadataCommand", ...)` рядом с collection registration.

- [ ] **Step 5: Проверить затронутые rules и round-trip**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/metadataCommand metadata/appliedObjects/metadataCalculationRegister metadata/commonObjects/metadataExternalDataSourceCube metadata/commonObjects/metadataExternalDataSourceDimensionTable metadata/commonObjects/metadataExternalDataSourceTable --no-isolate`

Run: `pnpm type-check && pnpm test:architecture`

- [ ] **Step 6: Зафиксировать направление concrete-слоёв**

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: убрать обратные concrete-зависимости"
```

---

### Task 12: Включить concrete-матрицу и удалить дублирующие regex-проверки

**Files:**
- Modify: `tools/dependency-cruiser/src/metadata-rules.mjs`
- Modify: `tools/dependency-cruiser/test/architecture-rules.test.mjs`
- Delete: `tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`
- Delete: `tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`
- Delete: `tools/dependency-cruiser/test/worker-pool-cycle-boundary.test.mjs`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `AGENTS.md`
- Modify: `.agents/architecture.md`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/systemEnumerations/forbidden-forms.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/commonObjects/forbidden-applied.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/commonObjects/transitive-forms.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/helpers/form-bridge.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/forms/forbidden-applied.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/forms/runtime.ts`
- Create: `tools/dependency-cruiser/fixtures/packages/core/metadata/appliedObjects/runtime.ts`

**Interfaces:**
- Produces direct/reachability rules for:
  - `systemEnumerations !-> forms|appliedObjects`;
  - `commonObjects !-> forms|appliedObjects`;
  - `forms !-> appliedObjects`;
  - lower zones `!-> composition`.
- Produces graph replacements for the deleted source-text tests:
  - `resource-topology-core-is-leaf` from Task 5;
  - `project-state-contracts-are-leaf`;
  - `project-state-service-does-not-compose`;
  - `worker-pool-types-are-leaf`.
- Preserves explicit composition exception `appliedObjects/configuration/topLevelRules.ts` for sibling applied-object rules.

- [ ] **Step 1: Добавить синтетические нарушения каждого направления**

```ts
// systemEnumerations/forbidden-forms.ts
export { formRuntime } from "../forms/runtime"

// commonObjects/forbidden-applied.ts
export { appliedRuntime } from "../appliedObjects/runtime"

// commonObjects/transitive-forms.ts
export { formRuntime } from "../helpers/form-bridge"

// helpers/form-bridge.ts
export { formRuntime } from "../forms/runtime"

// forms/forbidden-applied.ts
export { appliedRuntime } from "../appliedObjects/runtime"
```

В `architecture-rules.test.mjs` проверять точные имена правил для прямых и транзитивного путей.

- [ ] **Step 2: Включить матрицу без baseline**

```js
const layerReachabilityRule = (name, from, targets) => ({
  name,
  severity: "error",
  comment: `Слой ${from} не достигает более конкретных реализаций.`,
  fromPatterns: [`^packages/core/metadata/${from}/`],
  toPatterns: [`^packages/core/metadata/(?:${targets.join("|")})/`],
})

export const concreteLayerReachabilityRules = [
  layerReachabilityRule("system-enumerations-stay-lower", "systemEnumerations", ["forms", "appliedObjects"]),
  layerReachabilityRule("common-objects-stay-lower", "commonObjects", ["forms", "appliedObjects"]),
  layerReachabilityRule("forms-stay-lower", "forms", ["appliedObjects"]),
]
```

Добавить правила:

```js
const localLeafRules = [
  {
    name: "project-state-contracts-are-leaf",
    fromPatterns: ["^packages/core/metadata/projectState/contracts/"],
    toPatterns: [
      "^packages/core/metadata/projectState/(?:binary|fileUpdate|readSession|service|store)",
      "^packages/core/metadata/validation/",
    ],
  },
  {
    name: "project-state-service-does-not-compose",
    fromPatterns: ["^packages/core/metadata/projectState/service\\.ts$"],
    toPatterns: [
      "^packages/core/metadata/project/preparedYamlProjectWorkerPool\\.ts$",
      "^packages/core/metadata/workerPool/handle\\.ts$",
    ],
  },
  {
    name: "worker-pool-types-are-leaf",
    fromPatterns: ["^packages/core/metadata/workerPool/types\\.ts$"],
    toPatterns: ["^packages/core/metadata/(?:project|fullSyncToXml|importFromXml)/"],
  },
].map((rule) => ({ ...rule, severity: "error", comment: "Нижний договор не достигает реализации." }))
```

Общий reachability analyzer исключает test modules; широких разрешений не добавлять.

- [ ] **Step 3: Удалить только проверки, полностью покрытые графом**

Удалить три перечисленных test-файла только после зелёных синтетических проверок заменяющих правил. Сохранить `quick-boundary-fixes.test.mjs` и проверки структуры полей, отсутствия runtime-регистрации в `types.ts`, конкретных символов и обязательного местоположения файлов: эти договоры полный граф не выражает.

- [ ] **Step 4: Обновить действующую архитектурную документацию**

В `AGENTS.md` заменить перечень нейтральных слоёв на их новые имена и добавить направление concrete-матрицы. В `.agents/architecture.md` описать `projectDefinition`, `resourceTopology/core|adapters` и composition roots без изменения таблиц операций.

- [ ] **Step 5: Выполнить полную итоговую проверку**

Run: `pnpm type-check`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Expected: 0 нарушений границ, 0 циклов, baseline границ отсутствует.

Run: `pnpm test`

Expected: 5 759 функциональных тестов проходят; только исходные временные лимиты могут завершить команду с ошибкой.

Run: `pnpm duplicates -- --base 84bece0d0f && git diff --check`

- [ ] **Step 6: Зафиксировать итоговую матрицу**

```bash
git add AGENTS.md .agents packages/core/metadata tools/dependency-cruiser
git commit -m "chore: :wrench: закрепить направленные metadata-границы"
```

---

## Final Verification

- [ ] Run: `rg -n "orchestration" AGENTS.md .agents packages tools .dependency-cruiser.mjs --glob '!**/dist/**'`
  Expected: старый слой и путь не упоминаются.
- [ ] Run: `pnpm type-check`
  Expected: PASS.
- [ ] Run: `pnpm test:architecture:rules && pnpm test:architecture`
  Expected: 0 нарушений, 0 циклов.
- [ ] Run: `pnpm test`
  Expected: нет новых функциональных падений относительно исходных 5 759 зелёных тестов.
- [ ] Run: `pnpm duplicates -- --base 84bece0d0f`
  Expected: новых дублей нет.
- [ ] Run: `git diff 84bece0d0f --check`
  Expected: ошибок форматирования нет.
