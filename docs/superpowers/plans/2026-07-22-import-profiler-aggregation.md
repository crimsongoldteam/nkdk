# Import Profiler Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сократить журнал профилирования XML-импорта до одной итоговой записи на подэтап и worker вместо записи на каждый файл.

**Architecture:** Общий профилировщик получит необязательный режим агрегации при накоплении записей. Оба прохода import worker включат этот режим, а главный процесс, валидация и остальные операции сохранят текущее поведение.

**Tech Stack:** TypeScript, Vitest, Node.js `process.memoryUsage`, существующий формат `[nkdk-profile-step]`.

## Global Constraints

- Группировать по операции, этапу, подэтапу, области выполнения и номеру worker.
- Складывать время, количество элементов и байты.
- Сохранять начальную память первой записи, конечную память последней записи и максимумы всех записей.
- Сохранять порядок первого появления подэтапов.
- Не менять формат строки `[nkdk-profile-step]`.
- Не менять поведение главного процесса, валидации и других операций.
- Не изменять существующие XML-фикстуры.

---

### Task 1: Необязательная агрегация общего профилировщика

**Files:**
- Modify: `packages/core/metadata/validation/profile.ts`
- Test: `packages/core/metadata/validation/profile.test.ts`

**Interfaces:**
- Consumes: существующие `ValidationProfileRecord`, `ValidationProfiler` и `createOperationProfiler`.
- Produces: `createOperationProfiler(options: { operation: string; scope: ValidationProfileScope; aggregate?: boolean }): ValidationProfiler`.

- [ ] **Step 1: Write the failing aggregation test**

Добавить тест, который дважды измеряет один подэтап и один раз другой, затем проверяет количество, порядок и объединённые поля:

```ts
it("aggregates repeated records by substep when requested", () => {
  const profiler = createOperationProfiler({
    operation: "import-from-xml",
    scope: { scope: "worker", workerIndex: 2 },
    aggregate: true,
  })

  profiler.record("Подготовка импорта конфигурации", "Чтение XML", {
    items: 2,
    bytes: 10,
    timeMs: 4,
  })
  profiler.record("Подготовка импорта конфигурации", "Парсинг XML", {
    items: 1,
    bytes: 10,
    timeMs: 3,
  })
  profiler.record("Подготовка импорта конфигурации", "Чтение XML", {
    items: 3,
    bytes: 20,
    timeMs: 6,
  })

  expect(profiler.records()).toEqual([
    expect.objectContaining({ substep: "Чтение XML", items: 5, bytes: 30, timeMs: 10 }),
    expect.objectContaining({ substep: "Парсинг XML", items: 1, bytes: 10, timeMs: 3 }),
  ])
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts
```

Expected: FAIL because `aggregate` is not accepted and repeated records are returned separately.

- [ ] **Step 3: Implement aggregation while records are accumulated**

Расширить параметры фабрики и направить `measure`, `measureAsync` и `record` через общий накопитель:

```ts
export function createOperationProfiler(options: {
  operation: string
  scope: ValidationProfileScope
  aggregate?: boolean
}): ValidationProfiler {
  const records: ValidationProfileRecord[] = []
  const aggregatedByKey = new Map<string, ValidationProfileRecord>()

  function append(record: ValidationProfileRecord): void {
    if (options.aggregate !== true) {
      records.push(record)
      return
    }
    const key = `${record.operation}\u0000${record.step}\u0000${record.substep}\u0000${record.scope}\u0000${record.workerIndex ?? ""}`
    const current = aggregatedByKey.get(key)
    if (current === undefined) {
      records.push(record)
      aggregatedByKey.set(key, record)
      return
    }
    mergeProfileRecord(current, record)
  }
```

Реализовать `mergeProfileRecord(current, next)` со следующими присваиваниями:

```ts
current.timeMs += next.timeMs
current.items = sumOptional(current.items, next.items)
current.bytes = sumOptional(current.bytes, next.bytes)
current.rssEndMiB = next.rssEndMiB
current.heapEndMiB = next.heapEndMiB
current.rssPeakMiB = Math.max(current.rssPeakMiB, next.rssPeakMiB)
current.heapPeakMiB = Math.max(current.heapPeakMiB, next.heapPeakMiB)
```

Начальные значения памяти не изменять. Необязательное поле оставлять `undefined`, только если оно отсутствовало во всех объединённых записях.

- [ ] **Step 4: Verify the profiler tests are GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts
```

Expected: PASS; существующий тест неагрегированного режима также проходит без изменений.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/validation/profile.ts packages/core/metadata/validation/profile.test.ts
git commit -m "feat: :sparkles: добавить агрегацию записей профиля"
```

---

### Task 2: Агрегированный профиль import worker

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Test: `packages/core/metadata/importFromXml/worker.test.ts`

**Interfaces:**
- Consumes: `createOperationProfiler(..., aggregate: true)` из Task 1.
- Produces: не более одной строки каждого подэтапа на worker в первом проходе и не более одной строки каждого подэтапа на worker во втором проходе.

- [ ] **Step 1: Write the failing worker output test**

Изменить существующий тест профиля так, чтобы первый проход получил два задания с разными `id` и путями, а затем проверить точное число строк повторяющихся подэтапов:

```ts
const first = expectFirstPass(
  await runImportWorkerCommand({
    kind: "firstPass",
    assignments: [
      catalogAssignment({ id: "catalog-1", targetProjectPath: "Справочник/Товары.yaml" }),
      catalogAssignment({ id: "catalog-2", targetProjectPath: "Справочник/Услуги.yaml" }),
    ],
  })
)

const readLines = lines.filter((line) => line.includes('substep="Чтение XML"'))
expect(readLines).toHaveLength(1)
expect(readLines[0]).toContain("items=2")
expect(lines.filter((line) => line.includes('substep="Сериализация YAML"'))).toHaveLength(1)
```

Сохранить проверки наличия остальных подэтапов и отсутствия старых модельных этапов.

- [ ] **Step 2: Run the worker test and verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts
```

Expected: FAIL because first pass emits two `Чтение XML` records and second pass emits two `Сериализация YAML` records.

- [ ] **Step 3: Enable aggregation for both worker passes**

В `runFirstPass` и `runSecondPass` создать профилировщик одинаково:

```ts
const profiler = createOperationProfiler({
  operation: "import-from-xml",
  scope: { scope: "worker", workerIndex: state.workerIndex },
  aggregate: true,
})
```

Не включать `aggregate` в `importConfigurationFromXml`: координатор уже создаёт одну запись на архитектурный подэтап.

- [ ] **Step 4: Verify import and profile tests are GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/profile.test.ts metadata/importFromXml/worker.test.ts metadata/importFromXml/importConfiguration.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: все тесты PASS, TypeScript завершается без ошибок.

- [ ] **Step 5: Run repository verification**

Run:

```bash
pnpm test
git diff --check
```

Expected: все пакеты и тесты PASS; проверка пробелов не выводит ошибок.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/worker.test.ts
git commit -m "perf: :zap: сократить журнал профиля XML-импорта"
```

---

### Task 3: Контрольный профиль ERP

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: `.agents/skills/import-profile/import-profile.mjs`, XML-каталог `/Users/nikita/git/round-trip/cf/erp`, пустой YAML-каталог `/Users/nikita/git/nkdk-yaml/cf`.
- Produces: итоговую таблицу этапов без строк на каждый файл.

- [ ] **Step 1: Empty the target directory**

Удалить только содержимое `/Users/nikita/git/nkdk-yaml/cf`, сохранив сам каталог.

- [ ] **Step 2: Run one ERP profile**

Run:

```bash
node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip/cf/erp /Users/nikita/git/nkdk-yaml/cf --runs 1
```

Expected: `38455` successful assignments, `0` errors, `0` warnings, четыре worker и компактная таблица этапов.

- [ ] **Step 3: Verify output completeness and log compactness**

Run:

```bash
find /Users/nikita/git/nkdk-yaml/cf -type f | wc -l
du -sh /Users/nikita/git/nkdk-yaml/cf
```

Expected: около `121464` файлов и около `9.2G`; профиль содержит количество строк порядка числа подэтапов, а не числа импортируемых файлов.

- [ ] **Step 4: Report benchmark without committing generated output**

Показать пользователю полное время, пиковый RSS и таблицу этапов. Не добавлять `/Users/nikita/git/nkdk-yaml/cf` или результаты замера в git.
