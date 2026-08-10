# Оптимизация длительности тестов core — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обеспечить устойчивое прохождение исходных бюджетов `@nkdk/core`: не более 3 с setup пакета и не более 1 с на test file без изменения лимитов и потери договоров.

**Architecture:** Отделить обязательную тестовую инфраструктуру от полной композиции метаданных и сделать зависимости тестов явными. Затем заменить повторные полные построения JSON Schema ближайшими экспортёрами, разделить договоры import worker и ускорить подтверждённую профилем стадию импорта расширения.

**Tech Stack:** TypeScript, Node.js, pnpm, Vitest 4, TypeBox, lifecycle reporter.

## Global Constraints

- Не менять `TEST_PACKAGE_SETUP_LIMIT_MS = 3_000` и `TEST_FILE_LIMIT_MS = 1_000`.
- Не добавлять коэффициент macOS и не использовать `CI=true` в итоговой проверке.
- Не изменять XML-фикстуры и не уменьшать смысловое покрытие.
- Не переносить дорогую работу между lifecycle-стадиями ради отчёта.
- Не изменять production-регистрацию без отдельного RED.
- После каждого слоя запускать `pnpm duplicates -- --base 0d550245a`.

---

### Task 1: Сделать полную регистрацию явной зависимостью тестов

**Files:**

- Modify: `packages/core/vitest.config.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Reuse: `packages/core/tests/registerCoreMetadata.ts`

**Interfaces:**

- Consumes: side-effect module `tests/registerCoreMetadata.ts`.
- Produces: `setupFiles` только с `forbidRealPiscina` и `setupTests`; предметные регистрации приходят из конкретных metadata-модулей теста, а не из глобального setup.

- [ ] **Step 1: Добавить RED архитектурного договора**

В `importBoundaries.test.ts` добавить:

```ts
it("не загружает полную композицию через setupFiles", () => {
  const source = readFileSync(join(import.meta.dirname, "../vitest.config.ts"), "utf8")
  const setupBlocks = source.match(/setupFiles:\s*\[[\s\S]*?\]/gu)?.join("\n") ?? ""
  expect(setupBlocks).not.toContain("tests/registerCoreMetadata")
})
```

- [ ] **Step 2: Проверить RED**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts`

Expected: FAIL из-за setup проекта `core-metadata`.

- [ ] **Step 3: Удалить регистрацию из setup**

В `vitest.config.ts` оставить:

```ts
setupFiles: [forbiddenPiscinaSetup, lightweightSetup]
```

- [ ] **Step 4: Проверить отсутствие неявных зависимостей**

Run: `pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle --sequence.seed=20260730`

Expected: функциональный PASS, потому что конкретные metadata-модули регистрируют собственные правила. Если появляются функциональные падения, восстановить setup и остановить слой: предположение дизайна об изоляции неверно, а список явных зависимостей должен быть отдельно согласован вместо массового добавления импорта.

- [ ] **Step 5: Проверить два порядка и setup**

Run:

```bash
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260731
```

Expected: все проверки PASS; setup меньше 3 000 мс.

- [ ] **Step 6: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 0d550245a
git add packages/core/vitest.config.ts packages/core/metadata/importBoundaries.test.ts packages/core
git commit -m "test: :white_check_mark: изолировать регистрацию метаданных"
```

---

### Task 2: Сузить проверку DynamicList schema

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts`
- Reuse: `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`
- Reuse: `packages/core/metadata/ruleRuntime/property/toJSONSchema.ts`

**Interfaces:**

- Consumes: `exportPropertyToJSONSchema` и `DynamicListRules.properties.keyFields`.
- Produces: договор `ПоляКлюча: string | string[]` без полной DynamicList schema.

- [ ] **Step 1: Зафиксировать RED бюджета**

Run: `node packages/core/scripts/run-test-duration-check.mjs -- metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts`

Expected: FAIL по пределу файла 1 000 мс.

- [ ] **Step 2: Перейти к ближайшему экспортёру**

Удалить `beforeAll`, `dynamicListSchema` и `exportMetadataItemToJSONSchema`. Импортировать `exportPropertyToJSONSchema` и `./types`, затем заменить проверку схемы:

```ts
const schema = exportPropertyToJSONSchema({
  context: mockContext,
  rule: DynamicListRules.properties.keyFields,
  value: undefined,
})
const json = JSON.stringify(schema)
expect(json).toContain('"type":"string"')
expect(json).toContain('"type":"array"')
expect(json).toContain('"items":{"type":"string"}')
expect(json).not.toContain('"items":{"type":"number"}')
```

- [ ] **Step 3: Проверить GREEN, дубли и закоммитить**

```bash
node packages/core/scripts/run-test-duration-check.mjs -- metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts
pnpm duplicates -- --base 0d550245a
git add packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts
git commit -m "test: :white_check_mark: сузить проверку DynamicList schema"
```

Expected: PASS, файл меньше 1 000 мс.

---

### Task 3: Лениво строить validation schema

**Files:**

- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Create: `packages/core/metadata/validation/schemaRegistry.formGraph.test.ts`
- Create: `packages/core/metadata/validation/schemaRegistry.validationGraph.test.ts`
- Create: `packages/core/metadata/validation/projectFileSchema.validation.test.ts`
- Test: `packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**

- Consumes: `exportJSONSchemaGraph`, `exportJSONSchemaForSchemaName`, `exportPropertyToJSONSchema`, `compileValidationSchema`.
- Produces: по одному сфокусированному файлу для `externalRefs`, `validationPropertyRefs`, маршрутизации файлов проекта и TypeDescription validation.

- [ ] **Step 1: Зафиксировать RED двух файлов**

Run: `node packages/core/scripts/run-test-duration-check.mjs -- metadata/validation/schemaRegistry.test.ts metadata/validation/projectFileSchema.test.ts`

Expected: оба файла превышают 1 000 мс.

- [ ] **Step 2: Отделить validation-договоры projectFileSchema**

Перенести тесты, использующие `compiledInlineSchemas`, в `projectFileSchema.validation.test.ts`. В исходном файле оставить классификацию пути, выбор schema, ошибки пути и один договор `formSchemaGraph`. В обоих файлах заменить общий `beforeAll` ленивыми функциями с локальными Map-кэшами. Не вызывать `compiled.Check(undefined)` только ради прогрева.

```ts
function compiledInlineSchema(filePath: typeof inlineSchemaPaths[number]) {
  const cached = compiledInlineSchemas.get(filePath)
  if (cached !== undefined) return cached
  const compiled = compileValidationSchema(inlineSchema(filePath))
  compiledInlineSchemas.set(filePath, compiled)
  return compiled
}
```

- [ ] **Step 3: Разделить два полных графа schemaRegistry**

Перенести договоры `clientApplicationFormGraph()` в `schemaRegistry.formGraph.test.ts`, а договоры `commonFormValidationGraph()` — в `schemaRegistry.validationGraph.test.ts`. В исходном файле оставить именованные schema и реестр. Каждый новый файл строит ровно один полный граф ленивой функцией; общий `beforeAll` удалить. `configurationSchema` заменить ленивой функцией и не прогревать семь schema заранее.

- [ ] **Step 4: Оставить один полный договор `!xml`**

В `schemaRegistry.test.ts` сохранить одну проверку inline `ПутьКДанным` в validation graph. Форму допустимого `!xml` продолжать проверять через `exportPropertyToJSONSchema` в `toJSONSchemaExplicitXML.test.ts`.

- [ ] **Step 5: Проверить GREEN, дубли и закоммитить**

```bash
node packages/core/scripts/run-test-duration-check.mjs -- metadata/validation/schemaRegistry.test.ts metadata/validation/schemaRegistry.formGraph.test.ts metadata/validation/schemaRegistry.validationGraph.test.ts metadata/validation/projectFileSchema.test.ts metadata/validation/projectFileSchema.validation.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
pnpm duplicates -- --base 0d550245a
git add packages/core/metadata/validation/schemaRegistry*.test.ts packages/core/metadata/validation/projectFileSchema*.test.ts packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
git commit -m "test: :white_check_mark: лениво строить validation schema"
```

Expected: каждый файл меньше 1 000 мс.

---

### Task 4: Разделить договоры import worker

**Files:**

- Modify/Delete: `packages/core/metadata/importFromXml/worker.test.ts`
- Create: `packages/core/metadata/importFromXml/workerFirstPass.test.ts`
- Create: `packages/core/metadata/importFromXml/workerSecondPass.test.ts`
- Create: `packages/core/metadata/importFromXml/workerDataPath.test.ts`
- Create: `packages/core/metadata/importFromXml/tests/workerTestContext.ts`

**Interfaces:**

- Produces: `createImportWorkerTestContext()` с `initializeWorker`, `createTempDir`, `reset`, `close`.
- Consumes: `runImportWorkerCommand`, `resetImportWorkerStateForTests`, `createValidationRulesSnapshot`.

- [ ] **Step 1: Зафиксировать RED исходного файла**

Run: `node packages/core/scripts/run-test-duration-check.mjs -- metadata/importFromXml/worker.test.ts`

Expected: FAIL, 1,2–1,4 с.

- [ ] **Step 2: Выделить управляемый контекст**

Контекст владеет временными каталогами и state stores, не запускает настоящие worker threads и использует:

```ts
const fastValidationSchemaCache = {
  form: () => validSchema,
  properties: () => validSchema,
  compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
} satisfies ValidationSchemaCache
```

`reset()` сбрасывает worker state и удаляет временные каталоги; `close()` закрывает stores.

- [ ] **Step 3: Разнести сценарии**

- `workerFirstPass.test.ts`: изоляция YAML, сериализация, ранняя запись, ошибки и profiling первого прохода.
- `workerSecondPass.test.ts`: ready YAML, snapshot/read token, ошибки записи и profiling второго прохода.
- `workerDataPath.test.ts`: совместимые, несовместимые и неразрешённые `ПутьКДанным`.

Общий контекст не хранит готовый предметный результат между файлами. После переноса удалить пустой `worker.test.ts`.

- [ ] **Step 4: Проверить GREEN и отсутствие механического обхода**

Run: `node packages/core/scripts/run-test-duration-check.mjs -- metadata/importFromXml/workerFirstPass.test.ts metadata/importFromXml/workerSecondPass.test.ts metadata/importFromXml/workerDataPath.test.ts`

Expected: число перенесённых проверок совпадает с исходным; каждый файл меньше 1 000 мс; суммарное test time не выросло более чем на 10%.

- [ ] **Step 5: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 0d550245a
git add packages/core/metadata/importFromXml/worker*.test.ts packages/core/metadata/importFromXml/tests/workerTestContext.ts
git commit -m "test: :white_check_mark: разделить договоры import worker"
```

---

### Task 5: Ускорить сквозной импорт расширения

**Files:**

- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Reuse: `packages/core/tests/xmlImportWorkerTestPool.ts`
- Reuse: `packages/core/tests/preparedYamlWorkerTestPool.ts`

**Interfaces:**

- Consumes: `importConfigurationFromXml` и существующие тестовые pool factories.
- Produces: прежний сквозной результат импорта расширения менее чем за 1 000 мс.

- [ ] **Step 1: Зафиксировать RED и профиль**

```bash
env DEBUG=1 pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/importConfigurationExtension.test.ts 2> /private/tmp/nkdk-extension-import-profile.log
node packages/core/scripts/run-test-duration-check.mjs -- metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: функциональный PASS, бюджетный FAIL; профиль разделяет refresh, worker-проходы, публикацию и чтение snapshot.

- [ ] **Step 2: Убрать повторную подготовку фикстуры**

Базовые YAML-файлы и модифицированный XML-каталог подготовить один раз в `beforeAll`. В измеряемом `importExtension()` оставить один вызов публичного API; не выполнять повторные `fs.cpSync` и текстовые замены.

- [ ] **Step 3: Переиспользовать инфраструктурную инициализацию**

Сохранить один `xmlImportWorkerPoolHandle` и один `projectState` на файл. Допускается прогрев только пустой инфраструктурной операции; нельзя прогревать предметные schema или готовый импорт.

- [ ] **Step 4: Проверить GREEN, дубли и закоммитить**

```bash
node packages/core/scripts/run-test-duration-check.mjs -- metadata/importFromXml/importConfigurationExtension.test.ts
pnpm duplicates -- --base 0d550245a
git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: ускорить импорт расширения"
```

Expected: прежние diagnostics, YAML и snapshot PASS; файл меньше 1 000 мс.

---

### Task 6: Подтвердить устойчивый общий бюджет

**Files:**

- Create: `docs/superpowers/results/2026-08-10-test-duration-optimization.md`

**Interfaces:**

- Produces: отчёт трёх core-прогонов и полного `pnpm test`.

- [ ] **Step 1: Выполнить три package-прогона**

Запустить duration checker с seed `20260730`, повторно `20260730`, затем `20260731`:

```bash
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
```

Expected: все проверки PASS; setup меньше 3 000 мс; каждый файл меньше 1 000 мс во всех прогонах.

- [ ] **Step 2: Выполнить обязательные проверки**

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 0d550245a
```

Expected: все команды возвращают 0 без `CI=true`.

- [ ] **Step 3: Записать результат**

В отчёте указать исходные 42,92–49,22 с и setup 6,46–8,97 с, три итоговых результата, полный `pnpm test`, новое время пяти медленных файлов и неизменность лимитов.

- [ ] **Step 4: Закоммитить отчёт**

```bash
git add docs/superpowers/results/2026-08-10-test-duration-optimization.md
git commit -m "perf: :zap: подтвердить бюджет тестов core"
```
