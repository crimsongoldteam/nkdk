# Mock Worker Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить запуск настоящего Piscina из `pnpm test`, заменить worker-зависимые проверки быстрыми unit-тестами и довести каждый затронутый test case до 50 мс.

**Architecture:** Тестовый setup подменяет только конструктор Piscina на запрещающий, сохраняя остальные экспорты пакета. Координаторы получают управляемые mock thread pool через существующие фабрики зависимостей, а предметные функции worker проверяются непосредственно в текущем процессе. Тесты, проверяющие лишь настоящий запуск Piscina, удаляются без переноса.

**Tech Stack:** TypeScript, Vitest 4.1.9, Piscina, pnpm, JSON reporter Vitest.

## Global Constraints

- Каждый затронутый тест в `pnpm test` выполняется не дольше 50 мс.
- Ни один тест в `pnpm test` не запускает настоящий Piscina worker.
- Production-путь создания worker не меняет поведение.
- Существующие XML-фикстуры не изменяются.
- Предметный результат не подменяется mock-ответом: он проверяется прямым unit-тестом ближайшей предметной функции.
- Тесты настоящего запуска worker удаляются и не переносятся в отдельный набор.
- Общие metadata-слои не получают условий по `itemType`, именам XML-корней или конкретным applied objects.

---

### Task 1: Запретить настоящий Piscina в unit-тестах

**Files:**
- Create: `packages/core/tests/forbidRealPiscina.ts`
- Create: `packages/core/tests/forbidRealPiscina.test.ts`
- Modify: `packages/core/vitest.config.ts`

**Interfaces:**
- Produces: `ForbiddenPiscina` — тестовый класс, конструктор которого всегда бросает ошибку.
- Produces: setup-модуль, сохраняющий named exports `piscina`, но заменяющий default export.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest"
import { ForbiddenPiscina } from "./forbidRealPiscina"

describe("unit-test Piscina guard", () => {
  it("rejects construction of a physical worker pool", () => {
    expect(() => new ForbiddenPiscina()).toThrow(
      "Настоящий Piscina запрещён в pnpm test"
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/forbidRealPiscina.test.ts
```

Expected: FAIL because `packages/core/tests/forbidRealPiscina.ts` does not exist.

- [ ] **Step 3: Implement the guard and register it before metadata setup**

```ts
import { vi } from "vitest"

export class ForbiddenPiscina {
  constructor() {
    throw new Error(
      "Настоящий Piscina запрещён в pnpm test; передайте mock worker pool"
    )
  }
}

vi.mock("piscina", async (importOriginal) => {
  const original = await importOriginal<typeof import("piscina")>()
  return { ...original, default: ForbiddenPiscina }
})
```

Change `setupFiles` in `packages/core/vitest.config.ts` to:

```ts
setupFiles: [
  resolve(__dirname, "./tests/forbidRealPiscina"),
  resolve(__dirname, "./tests/setupTests"),
],
```

- [ ] **Step 4: Run the guard test and one existing direct worker test**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  tests/forbidRealPiscina.test.ts \
  metadata/importFromXml/worker.test.ts
```

Expected: PASS; named exports `transferableSymbol` and `valueSymbol` remain available to the direct worker test.

- [ ] **Step 5: Commit**

```bash
git add packages/core/tests/forbidRealPiscina.ts \
  packages/core/tests/forbidRealPiscina.test.ts \
  packages/core/vitest.config.ts
git commit -m "test: :white_check_mark: запретить Piscina в unit-тестах"
```

---

### Task 2: Добавить общий mock физического worker pool

**Files:**
- Create: `packages/core/tests/mockWorkerThreadPool.ts`
- Create: `packages/core/tests/mockWorkerThreadPool.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Produces:

```ts
export interface MockWorkerThreadPoolFactory<TCommand, TResult> {
  readonly factory: () => {
    run(command: TCommand): Promise<TResult>
    destroy(): Promise<void>
  }
  commands(workerIndex: number): readonly TCommand[]
  created(): number
  destroyCalls(workerIndex: number): number
}

export function createMockWorkerThreadPoolFactory<TCommand, TResult>(
  run: (command: TCommand, workerIndex: number) => TResult | Promise<TResult>
): MockWorkerThreadPoolFactory<TCommand, TResult>
```

- [ ] **Step 1: Write failing tests for command recording and lifecycle**

```ts
it("records commands separately for each mock physical worker", async () => {
  const pools = createMockWorkerThreadPoolFactory(async (command: string) =>
    command.toUpperCase()
  )
  const first = pools.factory()
  const second = pools.factory()

  await expect(first.run("one")).resolves.toBe("ONE")
  await expect(second.run("two")).resolves.toBe("TWO")
  await first.destroy()

  expect(pools.commands(0)).toEqual(["one"])
  expect(pools.commands(1)).toEqual(["two"])
  expect(pools.created()).toBe(2)
  expect(pools.destroyCalls(0)).toBe(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/mockWorkerThreadPool.test.ts
```

Expected: FAIL because the helper is not defined.

- [ ] **Step 3: Implement the typed helper**

Implement one closure-owned record per `factory()` call. `commands()` returns a copy; an unknown worker index returns `[]`. `destroy()` is idempotent and increments the recorded count only on the first call.

```ts
export function createMockWorkerThreadPoolFactory<TCommand, TResult>(
  handler: (command: TCommand, workerIndex: number) =>
    TResult | Promise<TResult>
): MockWorkerThreadPoolFactory<TCommand, TResult> {
  const records: Array<{ commands: TCommand[]; destroyed: boolean }> = []
  return {
    factory() {
      const workerIndex = records.length
      const record = { commands: [], destroyed: false }
      records.push(record)
      return {
        async run(command) {
          record.commands.push(command)
          return handler(command, workerIndex)
        },
        async destroy() {
          record.destroyed = true
        },
      }
    },
    commands(workerIndex) {
      return [...(records[workerIndex]?.commands ?? [])]
    },
    created() {
      return records.length
    },
    destroyCalls(workerIndex) {
      return records[workerIndex]?.destroyed === true ? 1 : 0
    },
  }
}
```

- [ ] **Step 4: Replace duplicated fake physical pools**

Use the helper in pool protocol tests. Preserve protocol-specific assertions by narrowing `command.kind` inside each handler. Do not replace direct tests of `runImportWorkerCommand`, `runFullXmlSyncWorkerCommand`, or `runPreparedYamlProjectWorkerTask`.

- [ ] **Step 5: Run pool protocol tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  tests/mockWorkerThreadPool.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/fullSyncToXml/workerPool.test.ts \
  metadata/project/preparedYamlProject.test.ts
```

Expected: protocol tests pass without constructing the forbidden Piscina class.

- [ ] **Step 6: Commit**

```bash
git add packages/core/tests/mockWorkerThreadPool.ts \
  packages/core/tests/mockWorkerThreadPool.test.ts \
  packages/core/metadata/importFromXml/workerPool.test.ts \
  packages/core/metadata/fullSyncToXml/workerPool.test.ts \
  packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "test: :white_check_mark: унифицировать mock worker pool"
```

---

### Task 3: Удалить тест настоящего XML-import worker

**Files:**
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Test: `packages/core/metadata/importFromXml/worker.test.ts`
- Test: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Consumes: `createMockWorkerThreadPoolFactory` from Task 2.
- Produces: XML-import pool tests, проверяющие только протокол и жизненный цикл на mock transport.

- [ ] **Step 1: Record the existing coverage before deletion**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/importConfiguration.test.ts \
  --reporter=json \
  --outputFile=/private/tmp/nkdk-import-coverage.json
```

Expected: PASS. Confirm that direct worker tests cover fragment data and coordinator tests cover propagation of first/second pass results.

- [ ] **Step 2: Delete only the physical Piscina test**

Remove the test named:

```text
XML import worker pool passes a real fragment buffer through Piscina when started outside the core package
```

Also remove imports and `process.chdir` setup used only by that test. Do not add a skipped replacement.

- [ ] **Step 3: Run the import pool, direct worker, and coordinator tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/workerPool.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/importConfiguration.test.ts
```

Expected: PASS; the Piscina guard does not fire.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/importFromXml/workerPool.test.ts
git commit -m "test: :white_check_mark: удалить проверку запуска XML worker"
```

---

### Task 4: Перевести prepared YAML и validation тесты на тестовый transport

**Files:**
- Create: `packages/core/tests/preparedYamlWorkerTestPool.ts`
- Create: `packages/core/tests/preparedYamlWorkerTestPool.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`
- Modify: `packages/core/metadata/project/componentState/indexes.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

**Interfaces:**
- Consumes: `createMockWorkerThreadPoolFactory` from Task 2.
- Produces:

```ts
export function createPreparedYamlWorkerTestPool(): {
  readonly pool: PreparedYamlProjectWorkerPool
  close(): Promise<void>
}
```

The helper uses mock physical pools whose `run` delegates preparation commands
to the already imported `runPreparedYamlProjectWorkerTask` in the current
process. Validation commands do not use this helper: the real worker isolates
module state, while direct calls would incorrectly share it. Coordinator
validation tests therefore use scripted mock responses; subject validation
stays in `projectValidationPasses.test.ts`, `validateFile.test.ts` and
`validateForm.test.ts`.

- [ ] **Step 1: Write a failing helper test**

```ts
it("prepares one YAML file without constructing Piscina", async () => {
  const projectDir = createTempProject({
    "Справочник/Товары/Свойства.yaml": "Реквизиты: {}\n",
  })
  const testPool = createPreparedYamlWorkerTestPool()
  try {
    const result = await prepareYamlProjectWithPool({
      projectDir,
      context: mockContext,
      pool: testPool.pool,
    })
    expect(result.ok).toBe(true)
  } finally {
    await testPool.close()
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/preparedYamlWorkerTestPool.test.ts
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the in-process transport substitute**

Create `PreparedWorkerPool` instances through `createMockWorkerThreadPoolFactory` and delegate each command to:

```ts
import runPreparedYamlProjectWorkerTask from
  "../metadata/project/preparedYamlProjectWorker"
```

Create the public pool with:

```ts
createPreparedYamlProjectWorkerPool({
  concurrency: 1,
  createWorkerPool: mockPools.factory,
})
```

Do not compile schemas or initialize additional worker counts in the helper unless a test explicitly requests them.

- [ ] **Step 4: Inject the test pool into worker-dependent tests**

- Replace top-level `createPreparedYamlProjectWorkerPool({ concurrency: 1 })` with `createPreparedYamlWorkerTestPool()`.
- Pass `createWorkerPool: mockPools.factory` to tests that exercise concurrency 2 or 4.
- Replace broad `validateProject.test.ts` scenarios with coordinator tests using
  scripted `initValidation`, `validateFirstPass` and `validateSecondPass`
  responses.
- Delete validation semantics duplicated by `projectValidationPasses.test.ts`,
  `validateFile.test.ts`, `validateForm.test.ts` and
  `projectFirstPassReadiness.test.ts`.
- Pass `createWorkerPool` to `buildColdComponentIndexes` tests.
- Preserve direct worker behavior in `preparedYamlProjectWorker.test.ts`; it must not import the pool helper.

- [ ] **Step 5: Run the migrated cluster with JSON timings**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  tests/preparedYamlWorkerTestPool.test.ts \
  metadata/project/preparedYamlProject.test.ts \
  metadata/project/componentState/indexes.test.ts \
  metadata/validation/validateProject.test.ts \
  --reporter=json \
  --outputFile=/private/tmp/nkdk-prepared-worker-tests.json
```

Expected: PASS; no test case in the report exceeds 50 ms. If a subject-logic test still exceeds 50 ms, split its fixture by owner/file and keep one behavior per test instead of raising the budget.

- [ ] **Step 6: Commit**

```bash
git add packages/core/tests/preparedYamlWorkerTestPool.ts \
  packages/core/tests/preparedYamlWorkerTestPool.test.ts \
  packages/core/metadata/project/preparedYamlProject.test.ts \
  packages/core/metadata/project/componentState/indexes.test.ts \
  packages/core/metadata/validation/validateProject.test.ts
git commit -m "test: :white_check_mark: подменить prepared YAML worker"
```

---

### Task 5: Перевести metadata operations на подготовленные снимки

**Files:**
- Modify: `packages/core/metadata/operations/projectSnapshot.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Test: `packages/core/metadata/operations/references.test.ts`
- Test: `packages/core/metadata/operations/dataPathReferences.test.ts`

**Interfaces:**
- Consumes: `createPreparedYamlWorkerTestPool` from Task 4.
- Produces: тесты координаторов операций, не создающие production worker pool.

- [ ] **Step 1: Add a failing coordinator test with a prepared project**

For each public operation, construct the smallest `PreparedYamlProject` containing the target and one referencing item. Inject it through the existing prepared pool seam; do not rebuild a full configuration fixture.

Example result fixture:

```ts
const prepared: PreparedYamlProjectResult = {
  ok: true,
  project: {
    projectDir,
    files: [],
    resourceFiles: [],
    metadataIndex: { declarations: [] },
    workers: [{
      workerIndex: 0,
      dependencyIndex: { dependencies: [] },
      yamlFiles: [targetFile, referenceFile],
    }],
  },
}
```

The failing assertion must describe the public result, for example:

```ts
expect(result).toMatchObject({
  ok: false,
  code: "references_found",
  blockedReferences: [
    expect.objectContaining({ sourceProjectPath: referenceProjectPath }),
  ],
})
```

- [ ] **Step 2: Run the three operation files and confirm the forbidden pool is reached**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/operations/projectSnapshot.test.ts \
  metadata/operations/renameItem.test.ts \
  metadata/operations/findMetadataReferences.test.ts
```

Expected before migration: FAIL with `Настоящий Piscina запрещён в pnpm test`.

- [ ] **Step 3: Replace worker-backed fixture preparation**

- `projectSnapshot.test.ts`: inject a mock `ValidationWorkerPoolHandle` returning the required diagnostics; test `buildMetadataOperationSnapshotFromPreparedProject` separately for YAML import.
- `renameItem.test.ts` and `findMetadataReferences.test.ts`: use a `PreparedYamlProjectWorkerPool` whose `run` returns the explicit prepared fixture.
- Move assertions about structural and DataPath rewriting to the existing pure-module tests named above.
- Delete repeated `beforeAll`/`afterAll` pools and their close hooks.

- [ ] **Step 4: Run migrated tests with timings**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/operations/projectSnapshot.test.ts \
  metadata/operations/renameItem.test.ts \
  metadata/operations/findMetadataReferences.test.ts \
  metadata/operations/references.test.ts \
  metadata/operations/dataPathReferences.test.ts \
  --reporter=json \
  --outputFile=/private/tmp/nkdk-operation-tests.json
```

Expected: PASS; each test case is at most 50 ms.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/operations/projectSnapshot.test.ts \
  packages/core/metadata/operations/renameItem.test.ts \
  packages/core/metadata/operations/findMetadataReferences.test.ts \
  packages/core/metadata/operations/references.test.ts \
  packages/core/metadata/operations/dataPathReferences.test.ts
git commit -m "test: :white_check_mark: изолировать metadata operations от worker"
```

---

### Task 6: Разделить full XML sync на предметные и координаторные тесты

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/testHelpers.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Delete: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Delete: `packages/core/metadata/fullSyncToXml/determinism.test.ts`
- Delete: `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts`

**Interfaces:**
- Consumes: mock physical pool helper from Task 2.
- Produces: `createMockFullSyncDependencies(overrides)` returning `FullXmlSyncCoordinatorDependencies` with explicit structure, snapshot, hashes, indexes, plan and worker result.

```ts
export function createMockFullSyncDependencies(
  overrides?: Partial<FullXmlSyncCoordinatorDependencies>
): FullXmlSyncCoordinatorDependencies
```

- [ ] **Step 1: Map every integration assertion to a target unit**

Create a checklist in the commit description while implementing:

- coordinator sequencing, diagnostics, index write → `syncConfiguration.test.ts`;
- assignment execution, fragment merge, XML writes → `worker.test.ts`;
- BaseForm composition and adopted metadata → direct component profile/composition tests;
- deterministic sorting in the resulting index → unit test of `buildFullXmlSyncConfigurationIndex`, exported with a test-oriented neutral name if currently private.

Do not delete an integration assertion until its target test exists and fails without the corresponding production behavior.

- [ ] **Step 2: Add failing coordinator tests with explicit mock results**

Use a pool object whose `execute()` returns:

```ts
{
  diagnostics: [],
  warnings: [],
  writtenFiles: [{ assignmentId: "catalog", targetXmlPath: "Catalogs/A.xml" }],
  expectedOutputs: [{ assignmentId: "catalog", targetXmlPath: "Catalogs/A.xml" }],
  fragmentData: { identities: [], xmlNodes: [], xmlValues: [] },
}
```

Assert only coordinator behavior: confirmed state, pool initialization, diagnostics, file validation and index write.

- [ ] **Step 3: Move BaseForm and deterministic output assertions to direct tests**

Call `runFullXmlSyncWorkerCommand` or the nearest exported composition function directly in the current process. Use one assignment and the smallest YAML input needed for each behavior. Reset worker state in `afterEach`.

- [ ] **Step 4: Remove direct worker execution from full-sync test helpers**

Replace `createDirectFullSyncDependencies()` with `createMockFullSyncDependencies()`. The helper must not import:

```ts
runFullXmlSyncWorkerCommand
resetFullXmlSyncWorkerStateForTests
createFullXmlSyncWorkerPool
```

- [ ] **Step 5: Delete the three broad integration files**

Delete only after the mapping from Step 1 is complete. Do not create replacement “integration” tests with mock outputs.

- [ ] **Step 6: Run the full-sync cluster with timings**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/syncConfiguration.test.ts \
  metadata/fullSyncToXml/worker.test.ts \
  metadata/fullSyncToXml/workerPool.test.ts \
  --reporter=json \
  --outputFile=/private/tmp/nkdk-full-sync-unit-tests.json
```

Expected: PASS; each test case is at most 50 ms.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/fullSyncToXml
git commit -m "test: :white_check_mark: разделить full XML sync проверки"
```

---

### Task 7: Удалить worker из applied import/sync тестов

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/importSync.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Test: `packages/core/metadata/importFromXml/worker.test.ts`
- Test: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**
- Consumes: direct subject functions and mock coordinator dependencies from Tasks 3–6.
- Produces: applied-object tests that verify one conversion boundary without a worker lifecycle.

- [ ] **Step 1: Inventory assertions in each broad fixture test**

Classify each assertion as:

```text
subject conversion | coordinator behavior | filesystem transfer | worker transport
```

Delete `worker transport` assertions. Move `coordinator behavior` to coordinator tests. Keep one applied-object conversion per test, calling its rules/converter directly.

- [ ] **Step 2: Write direct failing tests for uncovered conversions**

Examples:

- configuration root XML → `Конфигурация.yaml`: call the root import capability directly;
- applied object XML → YAML: call `prepareImportYaml` for one assignment;
- child form external XML → YAML: call the registered external property handler directly;
- YAML → XML: call the applied object `toXML`/worker assignment function directly with a prepared index.

Each new test uses only the fixture files required by that conversion. Existing XML fixtures remain unchanged.

- [ ] **Step 3: Remove file-scoped real pool handles**

Remove:

```ts
createXmlImportWorkerPoolHandle({ concurrency: 1 })
createPreparedYamlProjectWorkerPool({ concurrency: 1 })
```

and their `afterAll(close)` hooks. Coordinator tests use mocks; subject tests call direct functions.

- [ ] **Step 4: Run the applied cluster with timings**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/appliedObjects/__tests__/importSync.test.ts \
  metadata/appliedObjects/configuration/convertFromXML.test.ts \
  metadata/appliedObjects/configuration/syncToXML.test.ts \
  metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts \
  metadata/importFromXml/importConfigurationExtension.test.ts \
  --reporter=json \
  --outputFile=/private/tmp/nkdk-applied-worker-tests.json
```

Expected: PASS; each test case is at most 50 ms and the Piscina guard does not fire.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects \
  packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts \
  packages/core/metadata/importFromXml/importConfigurationExtension.test.ts \
  packages/core/metadata/importFromXml/worker.test.ts \
  packages/core/metadata/fullSyncToXml/worker.test.ts
git commit -m "test: :white_check_mark: убрать worker из applied проверок"
```

---

### Task 8: Подтвердить отсутствие Piscina и сформировать следующий профиль

**Files:**
- Create: `packages/core/scripts/assert-test-durations.mjs`
- Create: `packages/core/scripts/assert-test-durations.test.ts`
- Modify: `packages/core/package.json`

**Interfaces:**
- Produces:

```text
node packages/core/scripts/assert-test-durations.mjs \
  --report <json> --max-ms 50 [--files-from <text-file>]
```

Exit code `1` при нарушениях; вывод отсортирован по убыванию длительности.

- [ ] **Step 1: Write a failing parser test**

Extract the pure function into the `.mjs` module:

```js
export function findSlowTests(report, maxMs) {
  return report.testResults
    .flatMap((suite) =>
      suite.assertionResults.map((test) => ({
        file: suite.name,
        name: test.fullName,
        duration: test.duration ?? 0,
      }))
    )
    .filter((test) => test.duration > maxMs)
    .sort((left, right) => right.duration - left.duration)
}
```

Test strict boundary behavior: `50` passes, `50.01` fails.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/assert-test-durations.test.ts
```

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement the CLI**

Validate `--report` and positive `--max-ms`. Print one line per violation:

```text
123.45ms packages/core/path/file.test.ts > suite > test
```

Use `process.exitCode = 1`; do not throw after printing the full list.

- [ ] **Step 4: Add a temporary package command for profiling**

Add:

```json
"test:profile": "vitest run --no-isolate --sequence.shuffle --reporter=json --outputFile=/private/tmp/nkdk-vitest-core.json"
```

Do not yet make the 50 ms checker part of `pnpm test`: non-worker delays are handled by the next implementation plan.

- [ ] **Step 5: Run the complete core profile and verify the Piscina guard**

Run:

```bash
pnpm --filter @nkdk/core run test:profile
node packages/core/scripts/assert-test-durations.mjs \
  --report /private/tmp/nkdk-vitest-core.json \
  --max-ms 50
```

Expected:

- Vitest completes without `Настоящий Piscina запрещён в pnpm test`.
- No migrated worker-dependent test exceeds 50 ms.
- The checker exits `1` only for the remaining schema, filesystem, timer, MCP or platform candidates not covered by this plan.

- [ ] **Step 6: Save the remaining violations for the next plan**

Create the next implementation plan from the fresh report, grouped into:

```text
schema/registry initialization
filesystem fixture size
timer/process tests
remaining subject conversions
```

The next plan ends by adding the 50 ms checker to all package `test` commands.

- [ ] **Step 7: Run the project tests**

Run:

```bash
pnpm test
```

Expected: PASS. The global 50 ms gate is not enabled yet, but no real Piscina is constructed.

- [ ] **Step 8: Commit**

```bash
git add packages/core/scripts/assert-test-durations.mjs \
  packages/core/scripts/assert-test-durations.test.ts \
  packages/core/package.json
git commit -m "test: :white_check_mark: измерять бюджет отдельных тестов"
```
