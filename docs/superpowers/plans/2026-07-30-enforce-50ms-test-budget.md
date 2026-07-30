# Enforce 50 ms Test Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить оставшиеся превышения 50 мс и включить обязательную проверку длительности каждого теста во всех пакетах.

**Architecture:** Смешанные полные сценарии удаляются, а предметные проверки остаются рядом с непосредственными преобразователями. Дорогая подготовка схем и снимков исходников выполняется один раз в `beforeAll`, после чего тесты измеряют только проверяемое поведение. Файловые и конкурентные тесты используют минимальные данные и управляемые обещания без опроса по таймеру.

**Tech Stack:** TypeScript, Vitest 4, Node.js, pnpm.

## Global Constraints

- Каждый отдельный тест должен выполняться не дольше 50 мс.
- Настоящие Piscina worker запрещены в `pnpm test`.
- Существующие XML-фикстуры не изменяются.
- Смешанные тесты настоящего запуска приложения не сохраняются как «интеграционные»: они не являются ни unit, ни e2e.
- Перед завершением обязательно выполнить `pnpm test` из корня.

---

### Task 1: Удалить смешанный short round-trip набор

**Files:**
- Delete: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`
- Test: `packages/core/metadata/importFromXml/prepareYaml.test.ts`
- Test: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**
- Consumes: прямые тесты XML → YAML и YAML → XML.
- Produces: отсутствие четырёх тестов, каждый из которых запускал полный XML → YAML → XML процесс и файловую систему.

- [ ] **Step 1: Зафиксировать существующее предметное покрытие**

Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/appliedObjects/__tests__/syncRoundTrip.test.ts \
  metadata/importFromXml/prepareYaml.test.ts \
  metadata/fullSyncToXml/worker.test.ts
```

Ожидается: PASS; отдельно проверяются преобразования, ошибки разбора и запись задания.

- [ ] **Step 2: Удалить смешанный набор**

Удалить `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts`. Не переносить его проверки в новый полный сценарий.

- [ ] **Step 3: Проверить кластер**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/appliedObjects/__tests__/syncRoundTrip.test.ts \
  metadata/importFromXml/prepareYaml.test.ts \
  metadata/fullSyncToXml/worker.test.ts \
  --reporter=json --outputFile=/private/tmp/nkdk-subject-conversions.json
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-subject-conversions.json --max-ms 50
```

Ожидается: обе команды завершаются с кодом `0`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
git commit -m "test: :fire: удалить смешанный short round-trip"
```

---

### Task 2: Вынести компиляцию JSON Schema из измеряемых тестов

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Modify: `packages/core/metadata/validation/yamlTypeSchemaRegistration.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toEnterprise.test.ts`

**Interfaces:**
- Consumes: Vitest `beforeAll`.
- Produces: готовые schema/validator значения, создаваемые один раз на `describe`; тесты выполняют только `Check`, `Schema` и проверки результата.

- [ ] **Step 1: Добавить тест повторного использования schema cache**

В `projectValidationPasses.test.ts` создать cache в `beforeAll`, вызвать `compileAll()` там и сохранить результат:

```ts
let compiledAll: ReturnType<ReturnType<typeof createValidationSchemaCache>["compileAll"]>

beforeAll(() => {
  sharedSchemaCache = createValidationSchemaCache(mockContext)
  compiledAll = sharedSchemaCache.compileAll()
})

it("compiles all validation schemas before validating files", () => {
  expect(compiledAll.propertiesMs).toBeGreaterThanOrEqual(0)
})
```

Запустить один файл с JSON-отчётом и убедиться, что прежний тест больше не содержит стоимость компиляции.

- [ ] **Step 2: Подготовить schema values в остальных файлах**

В каждом перечисленном файле вынести неизменяемый вызов `export...ToJSONSchema`, `exportJSONSchemaForProjectFile`, `compileRegistered...` или `initValidation` в `beforeAll`. Сохранить результат в типизированной переменной и оставить внутри `it` только конкретный `Check(...)` либо утверждение о фрагменте схемы.

Для табличных `it.each` компилировать одну схему до таблицы:

```ts
let schema: ReturnType<typeof exportMetadataItemToJSONSchema>

beforeAll(() => {
  schema = exportMetadataItemToJSONSchema({ rule: DynamicListRules, context: mockContext })
})
```

Не использовать `beforeEach`: случайный порядок файлов не должен снова переносить компиляцию внутрь теста.

- [ ] **Step 3: Отделить проверки профиля worker от инициализации**

В `preparedYamlProjectWorker.test.ts` добавить `beforeAll`, который один раз выполняет:

```ts
await runPreparedYamlProjectWorkerTask({
  kind: "initValidation",
  workerIndex: 0,
  context: mockContext,
  rulesSnapshot: createValidationRulesSnapshot(mockContext),
})
```

Из трёх профильных тестов удалить повторный `initValidation`; оставить вызов соответствующего pass и проверку строк профиля.

- [ ] **Step 4: Проверить schema-кластер**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts \
  metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts \
  metadata/validation/projectValidationPasses.test.ts \
  metadata/project/preparedYamlProjectWorker.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/schemaRegistry.test.ts \
  metadata/validation/projectValidationStandaloneBuild.test.ts \
  metadata/validation/yamlTypeSchemaRegistration.test.ts \
  metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts \
  metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts \
  metadata/commonObjects/metadataTabularSection/toJSONSchema.test.ts \
  metadata/commonObjects/i8nText/toEnterprise.test.ts \
  --reporter=json --outputFile=/private/tmp/nkdk-schema-tests.json
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-schema-tests.json --max-ms 50
```

Ожидается: код `0`, каждый тест не дольше 50 мс.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata
git commit -m "test: :zap: вынести подготовку схем из тестов"
```

---

### Task 3: Кэшировать регистрации и снимок дерева исходников

**Files:**
- Create: `packages/core/tests/sourceTreeSnapshot.ts`
- Create: `packages/core/tests/sourceTreeSnapshot.test.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/runtimeDependencies.test.ts`
- Modify: `packages/core/metadata/resourceTopology/registry.test.ts`

**Interfaces:**
- Produces:

```ts
export interface SourceTreeFile {
  readonly absolutePath: string
  readonly relativePath: string
  readonly source: string
}

export function readSourceTreeOnce(root: string): readonly SourceTreeFile[]
```

Повторный вызов с тем же абсолютным `root` возвращает тот же замороженный массив.

- [ ] **Step 1: Написать падающий тест кэша**

```ts
it("reads one immutable snapshot per root", () => {
  const first = readSourceTreeOnce(fixtureRoot)
  const second = readSourceTreeOnce(fixtureRoot)
  expect(second).toBe(first)
  expect(Object.isFrozen(first)).toBe(true)
})
```

Запустить `tests/sourceTreeSnapshot.test.ts` и получить ошибку отсутствующего модуля.

- [ ] **Step 2: Реализовать один обход дерева**

`readSourceTreeOnce` рекурсивно читает только `.ts`, пропускает `node_modules`, `.git`, `.worktrees`, `dist`, `coverage`, сортирует по `relativePath`, замораживает элементы и массив, затем сохраняет результат в `Map<string, readonly SourceTreeFile[]>`.

- [ ] **Step 3: Перевести boundary-тесты на снимок**

В `importBoundaries.test.ts` создать снимки для `metadata`, `packages/core` и `packages/mcp` в `beforeAll`. Все `findImportOffenders` и проверки алиасов должны фильтровать уже прочитанные `SourceTreeFile`, не обходить каталоги внутри `it`.

В `runtimeDependencies.test.ts` получить один снимок `metadata` в `beforeAll`; тест фильтрует runtime-файлы и проверяет их сохранённый `source`.

- [ ] **Step 4: Компилировать resource topology один раз**

В `resourceTopology/registry.test.ts` сохранить результат `compileRegisteredMetadataResourceTopology()` в `beforeAll`; каждый тест выбирает нужную декларацию из готового topology.

- [ ] **Step 5: Проверить кластер**

```bash
pnpm --filter @nkdk/core exec vitest run \
  tests/sourceTreeSnapshot.test.ts \
  metadata/importBoundaries.test.ts \
  metadata/runtimeDependencies.test.ts \
  metadata/resourceTopology/registry.test.ts \
  --reporter=json --outputFile=/private/tmp/nkdk-registry-boundary-tests.json
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-registry-boundary-tests.json --max-ms 50
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/tests/sourceTreeSnapshot.ts \
  packages/core/tests/sourceTreeSnapshot.test.ts \
  packages/core/metadata/importBoundaries.test.ts \
  packages/core/metadata/runtimeDependencies.test.ts \
  packages/core/metadata/resourceTopology/registry.test.ts
git commit -m "test: :zap: переиспользовать снимки регистраций и исходников"
```

---

### Task 4: Убрать большие файлы и таймерный опрос из transfer-тестов

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/transferExternalFiles.test.ts`

**Interfaces:**
- Consumes: внедряемые `readFile` и `writeFile`.
- Produces: доказательство потокового пути через шпионы и управляемое обещание без 2 MiB файла и `vi.waitUntil`.

- [ ] **Step 1: Заменить большой файл минимальным**

В тесте потокового пути записать `Buffer.from([1, 2, 3])`. Проверять, что `fs.promises.readFile` не вызван, целевой файл равен исходному и hash совпадает. Размер данных не является частью договора.

- [ ] **Step 2: Заменить `vi.waitUntil` на microtask barrier**

Создать помощник:

```ts
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}
```

После запуска transfer вызвать `await flushMicrotasks()`, проверить `release.length === 2`, освободить два обещания, снова вызвать `flushMicrotasks()`, проверить третье. Не использовать реальные таймеры.

- [ ] **Step 3: Проверить файл**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/transferExternalFiles.test.ts \
  --reporter=json --outputFile=/private/tmp/nkdk-transfer-tests.json
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-transfer-tests.json --max-ms 50
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/fullSyncToXml/transferExternalFiles.test.ts
git commit -m "test: :zap: ускорить проверки передачи файлов"
```

---

### Task 5: Включить бюджет 50 мс во всех пакетах

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/platform/package.json`
- Modify: `packages/mcp/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `packages/core/scripts/assert-test-durations.mjs`.
- Produces: каждый пакет пишет собственный JSON-отчёт и завершает `test` с кодом `1`, если любой тест дольше 50 мс.

- [ ] **Step 1: Снять полный профиль после исправлений**

```bash
pnpm --filter @nkdk/core run test:profile
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-vitest-core.json --max-ms 50
```

Ожидается: код `0`.

- [ ] **Step 2: Добавить отчёт и checker в package scripts**

Для core:

```json
"test": "vitest run --no-isolate --sequence.shuffle --reporter=default --reporter=json --outputFile.json=/private/tmp/nkdk-vitest-core.json && node scripts/assert-test-durations.mjs --report /private/tmp/nkdk-vitest-core.json --max-ms 50"
```

Для platform и mcp использовать уникальные `/private/tmp/nkdk-vitest-platform.json` и `/private/tmp/nkdk-vitest-mcp.json`, а checker вызывать как `node ../core/scripts/assert-test-durations.mjs`.

- [ ] **Step 3: Проверить каждый пакет**

```bash
pnpm --filter @nkdk/core test
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
```

Ожидается: три команды завершаются с кодом `0`; JSON-отчёты созданы.

- [ ] **Step 4: Проверить весь проект**

```bash
pnpm test
```

Ожидается: PASS; ни один тест не превышает 50 мс и guard настоящего Piscina не срабатывает.

- [ ] **Step 5: Commit**

```bash
git add package.json packages/core/package.json packages/platform/package.json packages/mcp/package.json
git commit -m "test: :white_check_mark: ограничить тесты бюджетом 50 мс"
```
