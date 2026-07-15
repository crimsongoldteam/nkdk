# Validation Profile Stage Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `validation-profile --timing` print one hierarchical table that explains validation time and memory by stage, including preparation substeps.

**Architecture:** Core emits strict profiling records only when `NKDK_VALIDATION_TIMING=1`. The profile script parses those records and aggregates them into a single table with project wall time, main-thread time, worker min/avg/max/sum, process RSS, and worker RSS. Worker startup and validation-worker initialization are reported separately and do not count toward `Итого validation`.

**Tech Stack:** TypeScript, Node.js `performance.now()`, `process.memoryUsage()`, Piscina, Vitest, `.agents/skills/validation-profile/validation-profile.mjs`.

## Global Constraints

- Ответы и пользовательские сообщения на русском языке.
- Не менять XML-фикстуры.
- Не возвращать построение YAML-позиций или сохранение исходного YAML-текста в `Worker данные YAML`.
- Основная таблица `Шаги validation` считается для уже созданного и инициализированного worker pool.
- Создание worker pool, запуск потоков, загрузка worker-модуля, первичная инициализация validation worker и одноразовая компиляция схем выводятся только в блоке `Инициализация`.
- `Запуск worker` не должен попадать в `Итого validation`.
- Подшаги в таблице выводятся строками с префиксом `-`.
- Если данных для колонки нет, выводится `-`, а не `0`.

---

### Task 1: Strict Profile Records

**Files:**
- Create: `packages/core/metadata/validation/profile.ts`
- Test: `packages/core/metadata/validation/profile.test.ts`

**Interfaces:**
- Produces: `createValidationProfiler(scope: ValidationProfileScope): ValidationProfiler`
- Produces: `[validation-step]` stderr records when `NKDK_VALIDATION_TIMING=1`
- Record fields: `step`, `substep`, `scope`, `worker`, `items`, `time`, `rssStart`, `rssEnd`, `rssPeak`, `heapStart`, `heapEnd`, `heapPeak`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/validation/profile.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"
import { createValidationProfiler } from "./profile"

describe("validation profile", () => {
  it("records main-thread measurements with time and memory", () => {
    const profiler = createValidationProfiler({ scope: "main" })

    const result = profiler.measure("Подготовка YAML-проекта", "Поиск файлов проекта", { items: 2 }, () => 42)

    expect(result).toBe(42)
    expect(profiler.records()).toEqual([
      expect.objectContaining({
        step: "Подготовка YAML-проекта",
        substep: "Поиск файлов проекта",
        scope: "main",
        items: 2,
        timeMs: expect.any(Number),
        rssStartMiB: expect.any(Number),
        rssEndMiB: expect.any(Number),
        rssPeakMiB: expect.any(Number),
        heapStartMiB: expect.any(Number),
        heapEndMiB: expect.any(Number),
        heapPeakMiB: expect.any(Number),
      }),
    ])
  })

  it("prints strict worker records only when timing is enabled", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_VALIDATION_TIMING"]
    process.env["NKDK_VALIDATION_TIMING"] = "1"
    try {
      const profiler = createValidationProfiler({ scope: "worker", workerIndex: 3 })
      profiler.measure("Подготовка YAML-проекта", "Разбор YAML", { items: 5 }, () => undefined)
      profiler.flush()
    } finally {
      if (previous === undefined) delete process.env["NKDK_VALIDATION_TIMING"]
      else process.env["NKDK_VALIDATION_TIMING"] = previous
      error.mockRestore()
    }

    const line = String(error.mock.calls[0]?.[0] ?? "")
    expect(line).toContain("[validation-step]")
    expect(line).toContain("step=Подготовка YAML-проекта")
    expect(line).toContain("substep=Разбор YAML")
    expect(line).toContain("scope=worker")
    expect(line).toContain("worker=3")
    expect(line).toContain("items=5")
    expect(line).toMatch(/time=\d+\.\d+ms/)
    expect(line).toMatch(/rssPeak=\d+\.\d+MiB/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts
```

Expected: FAIL with missing `./profile`.

- [ ] **Step 3: Implement the profiler**

Create `packages/core/metadata/validation/profile.ts`:

```ts
import { performance } from "node:perf_hooks"

export type ValidationProfileScope = { scope: "main" } | { scope: "worker"; workerIndex: number }

export interface ValidationProfileRecord {
  step: string
  substep: string
  scope: "main" | "worker"
  workerIndex?: number
  items?: number
  timeMs: number
  rssStartMiB: number
  rssEndMiB: number
  rssPeakMiB: number
  heapStartMiB: number
  heapEndMiB: number
  heapPeakMiB: number
}

export interface ValidationProfiler {
  measure<T>(step: string, substep: string, params: { items?: number }, fn: () => T): T
  records(): ValidationProfileRecord[]
  flush(): void
}

export function createValidationProfiler(scope: ValidationProfileScope): ValidationProfiler {
  const records: ValidationProfileRecord[] = []

  return {
    measure(step, substep, params, fn) {
      const start = process.memoryUsage()
      const startedAt = performance.now()
      try {
        return fn()
      } finally {
        const end = process.memoryUsage()
        const timeMs = performance.now() - startedAt
        records.push({
          step,
          substep,
          scope: scope.scope,
          ...(scope.scope === "worker" ? { workerIndex: scope.workerIndex } : {}),
          ...(params.items === undefined ? {} : { items: params.items }),
          timeMs,
          rssStartMiB: bytesToMiB(start.rss),
          rssEndMiB: bytesToMiB(end.rss),
          rssPeakMiB: bytesToMiB(Math.max(start.rss, end.rss)),
          heapStartMiB: bytesToMiB(start.heapUsed),
          heapEndMiB: bytesToMiB(end.heapUsed),
          heapPeakMiB: bytesToMiB(Math.max(start.heapUsed, end.heapUsed)),
        })
      }
    },
    records() {
      return [...records]
    },
    flush() {
      if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return
      for (const record of records) console.error(formatValidationProfileRecord(record))
    },
  }
}

function formatValidationProfileRecord(record: ValidationProfileRecord): string {
  return [
    "[validation-step]",
    `step=${record.step}`,
    `substep=${record.substep}`,
    `scope=${record.scope}`,
    record.workerIndex === undefined ? undefined : `worker=${record.workerIndex}`,
    record.items === undefined ? undefined : `items=${record.items}`,
    `time=${record.timeMs.toFixed(2)}ms`,
    `rssStart=${record.rssStartMiB.toFixed(1)}MiB`,
    `rssEnd=${record.rssEndMiB.toFixed(1)}MiB`,
    `rssPeak=${record.rssPeakMiB.toFixed(1)}MiB`,
    `heapStart=${record.heapStartMiB.toFixed(1)}MiB`,
    `heapEnd=${record.heapEndMiB.toFixed(1)}MiB`,
    `heapPeak=${record.heapPeakMiB.toFixed(1)}MiB`,
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ")
}

function bytesToMiB(value: number): number {
  return value / 1024 / 1024
}
```

- [ ] **Step 4: Run the test**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts
```

Expected: PASS.

---

### Task 2: Preparation Stage Instrumentation

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Test: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Emits main records:
  - `Подготовка YAML-проекта / Поиск файлов проекта`
  - `Подготовка YAML-проекта / Классификация файлов проекта`
  - `Подготовка YAML-проекта / Классификация прочих файлов проекта`
  - `Подготовка YAML-проекта / Разбиение по worker`
  - `Подготовка YAML-проекта / Сбор правил структуры проекта`
  - `Подготовка YAML-проекта / Обмен с worker и получение результата`
  - `Подготовка YAML-проекта / Слияние индекса объявлений`
  - `Подготовка YAML-проекта / Перераспределение индекса обращений`
- Emits worker records:
  - `Подготовка YAML-проекта / Чтение YAML`
  - `Подготовка YAML-проекта / Разбор YAML`
  - `Подготовка YAML-проекта / Извлечение локальных индексов`
  - `Подготовка YAML-проекта / Сохранение worker данных YAML`

- [ ] **Step 1: Add failing preparation profile test**

Modify imports in `preparedYamlProject.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
```

Add test:

```ts
it(
  "emits detailed preparation profile records",
  async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const previous = process.env["NKDK_VALIDATION_TIMING"]
    process.env["NKDK_VALIDATION_TIMING"] = "1"
    try {
      const projectDir = createProject()
      const result = await prepareYamlProject({
        projectDir,
        context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
        concurrency: 1,
      })

      expect(result.ok).toBe(true)
    } finally {
      if (previous === undefined) delete process.env["NKDK_VALIDATION_TIMING"]
      else process.env["NKDK_VALIDATION_TIMING"] = previous
      error.mockRestore()
    }

    const lines = error.mock.calls.map(([line]) => String(line))
    expect(lines.some((line) => line.includes("[validation-step]") && line.includes("substep=Поиск файлов проекта"))).toBe(true)
    expect(lines.some((line) => line.includes("[validation-step]") && line.includes("substep=Классификация файлов проекта"))).toBe(true)
    expect(lines.some((line) => line.includes("[validation-step]") && line.includes("substep=Обмен с worker и получение результата"))).toBe(true)
    expect(lines.some((line) => line.includes("[validation-step]") && line.includes("substep=Чтение YAML"))).toBe(true)
    expect(lines.some((line) => line.includes("[validation-step]") && line.includes("substep=Разбор YAML"))).toBe(true)
  },
  testTimeout
)
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts -t "emits detailed preparation profile records"
```

Expected: FAIL because no `[validation-step]` records are emitted.

- [ ] **Step 3: Instrument project discovery and classification**

In `preparedYamlProject.ts`, import:

```ts
import { createValidationProfiler } from "../validation/profile"
```

Inside `prepareYamlProjectWithPool`, create profiler and wrap discovery/classification:

```ts
const profiler = createValidationProfiler({ scope: "main" })
const projectDir = resolve(params.projectDir)
const resources = profiler.measure("Подготовка YAML-проекта", "Поиск файлов проекта", {}, () =>
  discoverMetadataProjectResources(projectDir).filter((resource) => resource.absolutePath !== undefined)
)
const files = profiler.measure("Подготовка YAML-проекта", "Классификация файлов проекта", { items: resources.length }, () =>
  resources
    .filter((resource) => resource.kind === "yaml")
    .map(
      (resource): PreparedYamlProjectFileDescriptor => ({
        projectPath: resource.projectPath,
        filePath: resource.absolutePath!,
        role: resource.role,
        owner: { dir: resource.owner.dir, name: resource.owner.name },
        itemType:
          resource.owner.spec.rule.metadataTargetOwner?.kind === "self"
            ? resource.owner.spec.rule.metadataTargetOwner.root
            : (resource.owner.spec.rule.itemTypePrefix ?? resource.owner.spec.rule.itemType),
      })
    )
)
const resourceFiles = profiler.measure(
  "Подготовка YAML-проекта",
  "Классификация прочих файлов проекта",
  { items: resources.length },
  () =>
    resources
      .filter((resource) => resource.kind !== "yaml")
      .map(
        (resource): PreparedYamlProjectResourceDescriptor => ({
          projectPath: resource.projectPath,
          filePath: resource.absolutePath!,
          owner: { dir: resource.owner.dir, name: resource.owner.name },
          role: resource.role,
          propertyType: resource.source.kind === "property" ? resource.source.propertyType : undefined,
        })
      )
)
const prepared = await profiler.measure("Подготовка YAML-проекта", "Обмен с worker и получение результата", { items: files.length }, () =>
  params.pool.run({ projectDir, context: params.context, files })
)
profiler.flush()
```

- [ ] **Step 4: Instrument worker pool merge and partition**

In `preparedYamlProjectWorkerPool.ts`, import `createValidationProfiler` and wrap:

```ts
const profiler = createValidationProfiler({ scope: "main" })
const partitions = profiler.measure("Подготовка YAML-проекта", "Разбиение по worker", { items: runParams.files.length }, () =>
  partitionRoundRobin(runParams.files, params.concurrency)
)
const itemTypeByYamlDir = profiler.measure("Подготовка YAML-проекта", "Сбор правил структуры проекта", { items: runParams.files.length }, () =>
  Object.fromEntries(runParams.files.map((file) => [file.owner.dir, file.itemType]).filter(([dir]) => dir.length > 0))
)
const results = await Promise.all(/* existing worker run code */)
const mergedDeclarations = profiler.measure("Подготовка YAML-проекта", "Слияние индекса объявлений", { items: results.length }, () =>
  mergePreparedMetadataDeclarationsForTests(results.flatMap((result) => result.metadataIndex.declarations))
)
const workers = profiler.measure("Подготовка YAML-проекта", "Перераспределение индекса обращений", { items: results.length }, () =>
  redistributeDependenciesBySourceFile(results.flatMap((result) => result.workers))
)
profiler.flush()
```

- [ ] **Step 5: Instrument worker preparation internals**

In `preparedYamlProjectWorker.ts`, replace preparation aggregate-only timing with profiler records:

```ts
const profiler = createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })
const text = profiler.measure("Подготовка YAML-проекта", "Чтение YAML", { items: 1 }, () =>
  readFileSync(file.filePath, "utf8")
)
const parsed = profiler.measure("Подготовка YAML-проекта", "Разбор YAML", { items: 1 }, () =>
  parseMetadataYamlData(text)
)
profiler.measure("Подготовка YAML-проекта", "Извлечение локальных индексов", { items: 1 }, () => {
  declarations.push(...extractDeclarations(file))
  dependencies.push(...extractDependencies({ file, data: parsed.data, itemTypeByYamlDir: message.itemTypeByYamlDir }))
})
profiler.measure("Подготовка YAML-проекта", "Сохранение worker данных YAML", { items: 1 }, () => {
  yamlFiles.push({
    projectPath: file.projectPath,
    filePath: file.filePath,
    role: file.role,
    owner: file.owner,
    data: parsed.data,
    syntaxDiagnostics: parsed.syntaxErrors.map((error) => ({
      filePath: file.filePath,
      line: error.line,
      col: error.col,
      severity: "error",
      source: "syntax",
      message: error.message,
    })),
  })
})
```

Call `profiler.flush()` once before returning `prepareResult`.

- [ ] **Step 6: Run preparation tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

---

### Task 3: Validation Stage Instrumentation

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

**Interfaces:**
- Emits main records:
  - `Проверка по схеме / Ожидание worker first pass`
  - `Обобщение индексов / Слияние first pass`
  - `Обобщение индексов / Снимок object table`
  - `Проверка зависимостей / Ожидание worker second pass`
  - `Завершение validation / Сортировка и дедупликация диагностик`
- Emits worker records:
  - `Проверка по схеме / Worker first pass`
  - `Проверка зависимостей / Построение контекста worker`
  - `Проверка зависимостей / Проверка ссылок`
  - `Проверка зависимостей / Worker second pass`
- Emits initialization records separately:
  - `Инициализация / Инициализация validation worker`
  - `Инициализация / Компиляция схем`

- [ ] **Step 1: Add failing validation profile test**

Add to `validateProject.test.ts`:

```ts
it("emits detailed validation profile records", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
  const previous = process.env["NKDK_VALIDATION_TIMING"]
  process.env["NKDK_VALIDATION_TIMING"] = "1"
  try {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")

    await validateProject({ projectDir, context: mockContext, concurrency: 1 })
  } finally {
    if (previous === undefined) delete process.env["NKDK_VALIDATION_TIMING"]
    else process.env["NKDK_VALIDATION_TIMING"] = previous
    error.mockRestore()
  }

  const lines = error.mock.calls.map(([line]) => String(line))
  expect(lines.some((line) => line.includes("step=Проверка по схеме"))).toBe(true)
  expect(lines.some((line) => line.includes("step=Обобщение индексов"))).toBe(true)
  expect(lines.some((line) => line.includes("step=Проверка зависимостей"))).toBe(true)
  expect(lines.some((line) => line.includes("step=Завершение validation"))).toBe(true)
})
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts -t "emits detailed validation profile records"
```

Expected: FAIL.

- [ ] **Step 3: Instrument coordinator validation**

In `validateProjectWithPreparedYaml`, create two profilers:

```ts
const profiler = createValidationProfiler({ scope: "main" })
const initializationProfiler = createValidationProfiler({ scope: "main" })
```

Wrap init separately:

```ts
const startProfile = await initializationProfiler.measure("Инициализация", "Инициализация validation worker", { items: params.concurrency }, () =>
  pool.initValidation(context)
)
initializationProfiler.measure("Инициализация", "Компиляция схем", { items: params.concurrency }, () => undefined)
initializationProfiler.flush()
```

Wrap validation stages:

```ts
const first = await profiler.measure("Проверка по схеме", "Ожидание worker first pass", { items: fileCount }, () =>
  pool.runValidationFirstPass({ projectDir, context })
)
const objectTable = profiler.measure("Обобщение индексов", "Слияние first pass", { items: first.objectRecords.length }, () => {
  const table = createValidationObjectTable()
  table.mergeRecords(first.objectRecords)
  table.mergeReferenceIndexEntries(first)
  return table
})
const objectTableSnapshot = profiler.measure("Обобщение индексов", "Снимок object table", { items: first.pendingReferences.length }, () =>
  objectTable.snapshot()
)
const second = await profiler.measure("Проверка зависимостей", "Ожидание worker second pass", { items: fileCount }, () =>
  pool.runValidationSecondPass({ projectDir, context, mode: "full", objectTable: objectTableSnapshot })
)
const diagnostics = profiler.measure("Завершение validation", "Сортировка и дедупликация диагностик", { items: first.diagnostics.length + second.diagnostics.length }, () =>
  sortDiagnostics(dedupeDiagnostics([...first.diagnostics, ...second.diagnostics]))
)
profiler.flush()
```

- [ ] **Step 4: Instrument worker validation**

In `preparedYamlProjectWorker.ts`, use `createValidationProfiler({ scope: "worker", workerIndex: message.workerIndex })`.

Wrap first pass per file:

```ts
const first = profiler.measure("Проверка по схеме", "Worker first pass", { items: 1 }, () =>
  validateProjectFileFirstPass({ /* existing params */ })
)
```

Wrap second pass:

```ts
const ownerCache = profiler.measure("Проверка зависимостей", "Построение контекста worker", { items: preparedYamlFiles.size }, () =>
  createOwnerMetadataCacheFromSharedValidationSnapshot({ /* existing params */ })
)
const referenceResult = profiler.measure("Проверка зависимостей", "Проверка ссылок", { items: message.pendingReferences.length }, () =>
  validatePendingReferencesWithIndex({ index: referenceIndex, references: message.pendingReferences })
)
const second = profiler.measure("Проверка зависимостей", "Worker second pass", { items: 1 }, () =>
  validateProjectFileSecondPass({ /* existing params */ })
)
```

Flush after each worker command returns.

- [ ] **Step 5: Run validation tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

---

### Task 4: validation-profile Table Output

**Files:**
- Modify: `.agents/skills/validation-profile/validation-profile.mjs`
- Test: profile command against `/Users/nikita/git/nkdk-yaml`

**Interfaces:**
- Consumes `[validation-step]` lines.
- Produces:
  - optional `Инициализация` table;
  - one `Шаги validation` table;
  - JSON with parsed `timing.steps`.

- [ ] **Step 1: Parse strict records**

Modify `runTimingPass`:

```js
const allLines = spawned.stderr.split(/\r?\n/).filter(Boolean)
const rawLines = allLines.filter((line) => line.startsWith("[validation] "))
const stepLines = allLines.filter((line) => line.startsWith("[validation-step] "))
return {
  orchestration: rawLines.filter((line) => line.includes(" orchestration ")).map(parseTimingLine),
  prepare: rawLines.filter((line) => line.includes(" prepare ")).map(parseTimingLine),
  firstPass: rawLines.filter((line) => line.includes(" first pass ")).map(parseTimingLine),
  secondPass: rawLines.filter((line) => line.includes(" second pass ")).map(parseTimingLine),
  steps: stepLines.map(parseValidationStepLine),
  rawLines: [...rawLines, ...stepLines],
}
```

Add `parseValidationStepLine`:

```js
function parseValidationStepLine(line) {
  const result = { raw: line }
  for (const token of line.split(" ").slice(1)) {
    const eq = token.indexOf("=")
    if (eq === -1) continue
    const key = token.slice(0, eq)
    const value = token.slice(eq + 1)
    if (value.endsWith("ms")) result[key] = Number(value.slice(0, -2))
    else if (value.endsWith("MiB")) result[key] = Number(value.slice(0, -3))
    else if (/^\d+$/.test(value)) result[key] = Number(value)
    else result[key] = value
  }
  return result
}
```

- [ ] **Step 2: Aggregate rows**

Add:

```js
function aggregateRows(steps) {
  const groups = new Map()
  for (const step of steps) {
    if (step.step === "Инициализация") continue
    const key = `${step.step}\u0000${step.substep}`
    const list = groups.get(key) ?? []
    list.push(step)
    groups.set(key, list)
  }
  return [...groups.values()].map(toTableRow)
}

function toTableRow(records) {
  const first = records[0]
  const main = records.filter((record) => record.scope === "main")
  const workers = records.filter((record) => record.scope === "worker")
  return {
    step: first.substep === "Итого" ? first.step : `- ${first.substep}`,
    projectMs: main.length > 0 ? sum(main, "time") : max(workers, "time"),
    mainMs: sumOrUndefined(main, "time"),
    workerMinMs: minOrUndefined(workers, "time"),
    workerAvgMs: avgOrUndefined(workers, "time"),
    workerMaxMs: maxOrUndefined(workers, "time"),
    workerSumMs: sumOrUndefined(workers, "time"),
    processRssMaxMiB: maxOrUndefined(main, "rssPeak"),
    workerRssMinMiB: minOrUndefined(workers, "rssPeak"),
    workerRssAvgMiB: avgOrUndefined(workers, "rssPeak"),
    workerRssMaxMiB: maxOrUndefined(workers, "rssPeak"),
  }
}
```

- [ ] **Step 3: Print initialization and validation tables**

Replace current `Шаги:` output with:

```js
if (result.timing?.steps?.length > 0) {
  printInitializationTable(result.timing.steps)
  printValidationStageTable(result.timing.steps)
} else {
  printLegacyTimingRows(result)
}
```

The table headers must exactly match the spec:

```text
| Шаг | Общее время | Главный поток | Worker min | Worker avg | Worker max | Worker sum | RSS процесса max | RSS worker min | RSS worker avg | RSS worker max |
```

- [ ] **Step 4: Run profile script**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected: output contains `Инициализация:` and `Шаги validation:` tables. `Запуск worker` is absent from `Шаги validation`.

---

### Task 5: Verification

**Files:**
- No new files.

**Interfaces:**
- Verifies code, build, and profile output.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 2: Build core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS and `packages/core/dist/preparedYamlProjectWorker.js` exists.

- [ ] **Step 3: Run profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected:
- table includes preparation substeps;
- table includes `Обмен с worker и получение результата`;
- table does not include `Запуск worker` in `Шаги validation`;
- diagnostics may remain `3` while clean parsing intentionally ignores quoted-string style.

- [ ] **Step 4: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

