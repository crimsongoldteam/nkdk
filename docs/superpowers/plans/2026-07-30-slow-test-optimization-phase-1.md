# Slow Test Optimization Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать воспроизводимый реестр 64 медленных тестов, заменить нестабильный разовый бюджет устойчивым профилем и ускорить тест `runBatch` без настоящего таймера.

**Architecture:** Отдельный CLI последовательно запускает Vitest три раза и агрегирует JSON-отчёты по стабильному идентификатору `file + fullName`. Обычный `pnpm test` проверяет поведение без недостоверного ограничения времени, а `pnpm test:profile` строит версионируемый реестр для доказательной оптимизации следующих групп.

**Tech Stack:** Node.js 26, TypeScript, Vitest 4, pnpm.

## Global Constraints

- Исходная выборка содержит ровно 64 теста `packages/core`, превысивших 10 мс хотя бы в одном из трёх исходных прогонов.
- Основная метрика — медиана трёх последовательных прогонов; максимум не является единственным основанием для падения.
- Существующие XML-фикстуры не изменяются.
- Round-trip, XML/YAML fixture-, snapshot-, архитектурные и связанные с issue регрессионные тесты автоматически не удаляются.
- Удаление или объединение требует сохранённого наблюдаемого договора и mutation-результата.
- Профилирование не запускается параллельно с `type-check`.
- Спецификация: `docs/superpowers/specs/2026-07-30-slow-test-optimization-design.md`.

---

### Task 1: Агрегация трёх Vitest-отчётов

**Files:**
- Create: `packages/core/scripts/test-duration-profile.mjs`
- Create: `packages/core/scripts/test-duration-profile.test.ts`

**Interfaces:**
- Consumes: `collectTestDurationProfile(reports, { projectRoot, thresholdMs })`.
- Produces: массив записей `{ id, file, name, durationsMs, medianMs, maxMs, exceedances }`.

- [ ] **Step 1: Написать падающие тесты агрегатора**

```ts
import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import { collectTestDurationProfile } from "./test-duration-profile.mjs"

const report = (root: string, durations: number[]) => ({
  testResults: [{
    name: `${root}/packages/core/example.test.ts`,
    assertionResults: durations.map((duration, index) => ({
      fullName: `example case ${index}`,
      duration,
    })),
  }],
})

describe("test duration profile", () => {
  it("normalizes worktree paths and calculates median, maximum and exceedances", () => {
    const reports = [
      report("/worktree-a", [8]),
      report("/worktree-a", [30]),
      report("/worktree-a", [12]),
    ]
    expect(collectTestDurationProfile(reports, {
      projectRoot: "/worktree-a",
      thresholdMs: 10,
    })).toEqual([{
      id: "packages/core/example.test.ts::example case 0",
      file: "packages/core/example.test.ts",
      name: "example case 0",
      durationsMs: [8, 30, 12],
      medianMs: 12,
      maxMs: 30,
      exceedances: 2,
    }])
  })

  it("keeps the union of tests exceeding the threshold in any run", () => {
    const reports = [
      report("/project", [11, 1]),
      report("/project", [1, 12]),
      report("/project", [1, 1]),
    ]
    expect(collectTestDurationProfile(reports, {
      projectRoot: "/project",
      thresholdMs: 10,
    }).map(({ name }) => name)).toEqual(["example case 0", "example case 1"])
  })

  it("rejects reports with different test identities", () => {
    const reports = [
      report("/project", [11]),
      report("/project", [11, 12]),
      report("/project", [11]),
    ]
    expect(() => collectTestDurationProfile(reports, {
      projectRoot: "/project",
      thresholdMs: 10,
    })).toThrow("Наборы тестов в отчётах различаются")
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/test-duration-profile.test.ts
```

Expected: FAIL, модуль `test-duration-profile.mjs` отсутствует.

- [ ] **Step 3: Реализовать чистый агрегатор**

```js
import { relative } from "node:path"

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function reportTests(report, projectRoot) {
  return new Map(report.testResults.flatMap((suite) =>
    suite.assertionResults.map((test) => {
      const file = relative(projectRoot, suite.name).replace(/\\/gu, "/")
      const id = `${file}::${test.fullName}`
      return [id, {
        id,
        file,
        name: test.fullName,
        durationMs: test.duration ?? 0,
      }]
    })
  ))
}

export function collectTestDurationProfile(reports, options) {
  if (reports.length !== 3) throw new Error("Для профиля нужны ровно три отчёта")
  const runs = reports.map((report) => reportTests(report, options.projectRoot))
  const identities = [...runs[0].keys()].sort()
  for (const run of runs.slice(1)) {
    if (JSON.stringify([...run.keys()].sort()) !== JSON.stringify(identities)) {
      throw new Error("Наборы тестов в отчётах различаются")
    }
  }
  return identities
    .map((id) => {
      const tests = runs.map((run) => run.get(id))
      const durationsMs = tests.map(({ durationMs }) => durationMs)
      return {
        id,
        file: tests[0].file,
        name: tests[0].name,
        durationsMs,
        medianMs: median(durationsMs),
        maxMs: Math.max(...durationsMs),
        exceedances: durationsMs.filter((duration) => duration > options.thresholdMs).length,
      }
    })
    .filter(({ exceedances }) => exceedances > 0)
    .sort((left, right) =>
      right.exceedances - left.exceedances ||
      right.medianMs - left.medianMs ||
      left.id.localeCompare(right.id)
    )
}
```

- [ ] **Step 4: Запустить тест и подтвердить зелёную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/test-duration-profile.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Создать коммит**

```bash
git add packages/core/scripts/test-duration-profile.mjs packages/core/scripts/test-duration-profile.test.ts
git commit -m "test: :white_check_mark: агрегировать профиль длительности"
```

---

### Task 2: Последовательный запуск профиля

**Files:**
- Create: `packages/core/scripts/run-test-duration-profile.mjs`
- Create: `packages/core/scripts/run-test-duration-profile.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `parseProfileArguments(argv)` и `runTestDurationProfile(projectRoot, options, spawn)`.
- Produces: `pnpm test:profile -- --output <файл>` и JSON `{ runs, thresholdMs, tests }`.

- [ ] **Step 1: Написать падающие тесты разбора аргументов**

```ts
import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import { parseProfileArguments } from "./run-test-duration-profile.mjs"

describe("run test duration profile", () => {
  it("uses three runs and a 10 ms threshold", () => {
    expect(parseProfileArguments(["--", "--output", "reports/test-profile/current.json"])).toEqual({
      output: "reports/test-profile/current.json",
      runs: 3,
      thresholdMs: 10,
    })
  })

  it.each([
    [],
    ["--output", "../outside.json"],
    ["--output", "reports/test-profile/current.txt"],
  ])("rejects unsafe arguments: %j", (args) => {
    expect(() => parseProfileArguments(args)).toThrow()
  })
})
```

- [ ] **Step 2: Подтвердить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/run-test-duration-profile.test.ts
```

Expected: FAIL, модуль запуска отсутствует.

- [ ] **Step 3: Реализовать последовательный запуск**

CLI должен:

1. Принимать только JSON-путь внутри `reports/test-profile/`.
2. Последовательно выполнить три команды:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle --sequence.seed=20260730 --reporter=json --outputFile.json=<run-1>
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle --sequence.seed=20260730 --reporter=json --outputFile.json=<run-2>
pnpm --filter @nkdk/core exec vitest run --no-isolate --sequence.shuffle --sequence.seed=20260731 --reporter=json --outputFile.json=<run-3>
```

3. Прочитать отчёты и вызвать `collectTestDurationProfile`.
4. Записать итог атомарно через временный файл и `rename`.
5. Завершиться с кодом 1, если любой Vitest-прогон неуспешен.

Итоговый JSON имеет точную форму:

```json
{
  "version": 1,
  "runs": 3,
  "thresholdMs": 10,
  "seeds": [20260730, 20260730, 20260731],
  "tests": []
}
```

Добавить корневую команду:

```json
"test:profile": "node packages/core/scripts/run-test-duration-profile.mjs"
```

Добавить в `.gitignore`:

```gitignore
reports/test-profile/
```

- [ ] **Step 4: Запустить тесты CLI**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/test-duration-profile.test.ts scripts/run-test-duration-profile.test.ts
```

Expected: PASS.

- [ ] **Step 5: Создать коммит**

```bash
git add package.json .gitignore packages/core/scripts/test-duration-profile.mjs packages/core/scripts/run-test-duration-profile.mjs packages/core/scripts/run-test-duration-profile.test.ts
git commit -m "chore: :wrench: добавить устойчивый профиль тестов"
```

---

### Task 3: Версионируемый исходный реестр

**Files:**
- Create: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Modify: `docs/superpowers/specs/2026-07-30-slow-test-optimization-design.md`

**Interfaces:**
- Consumes: исходные `/private/tmp/nkdk-stryker-profile-core-{1,2,3}.json`, уже использованные для согласованной выборки.
- Produces: неизменяемую выборку из 64 записей и поля решения для следующих этапов.

- [ ] **Step 1: Построить реестр из исходных трёх отчётов**

Run:

```bash
node --input-type=module -e '
import fs from "node:fs";
import { collectTestDurationProfile } from "./packages/core/scripts/test-duration-profile.mjs";
const reports = [1, 2, 3].map((run) =>
  JSON.parse(fs.readFileSync(`/private/tmp/nkdk-stryker-profile-core-${run}.json`, "utf8"))
);
const tests = collectTestDurationProfile(reports, {
  projectRoot: process.cwd(),
  thresholdMs: 10,
}).map((test) => ({
  ...test,
  decision: "unreviewed",
  reason: "",
  remainingContract: "",
  mutationBefore: null,
  mutationAfter: null,
}));
if (tests.length !== 64) throw new Error(`Ожидалось 64 теста, получено ${tests.length}`);
fs.mkdirSync("docs/superpowers/test-performance", { recursive: true });
fs.writeFileSync(
  "docs/superpowers/test-performance/2026-07-30-core-slow-tests.json",
  `${JSON.stringify({ version: 1, runs: 3, thresholdMs: 10, tests }, null, 2)}\n`
);
'
```

Expected: команда завершается успешно и создаёт реестр с 64 записями.

- [ ] **Step 2: Проверить размер и распределение**

Run:

```bash
node -e 'const p=require("./docs/superpowers/test-performance/2026-07-30-core-slow-tests.json"); if(p.tests.length!==64) process.exit(1); console.log(p.tests.length)'
```

Expected: `64`.

- [ ] **Step 3: Создать реестр**

Для каждой записи сохранить измерения и добавить:

```json
{
  "decision": "unreviewed",
  "reason": "",
  "remainingContract": "",
  "mutationBefore": null,
  "mutationAfter": null
}
```

В спецификации сослаться на реестр как на точные границы исходной выборки.

- [ ] **Step 4: Проверить JSON и отсутствие пустых идентификаторов**

Run:

```bash
node -e 'const p=require("./docs/superpowers/test-performance/2026-07-30-core-slow-tests.json"); if(p.tests.length!==64||p.tests.some(t=>!t.id)) process.exit(1)'
```

Expected: exit 0.

- [ ] **Step 5: Создать коммит**

```bash
git add docs/superpowers/test-performance/2026-07-30-core-slow-tests.json docs/superpowers/specs/2026-07-30-slow-test-optimization-design.md
git commit -m "docs: :memo: зафиксировать реестр медленных тестов"
```

---

### Task 4: Удаление нестабильного разового ограничения

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/platform/package.json`
- Modify: `packages/mcp/package.json`
- Modify: `.agents/testing.md`
- Delete: `packages/core/scripts/assert-test-durations.mjs`
- Delete: `packages/core/scripts/assert-test-durations.test.ts`
- Delete: `packages/core/scripts/test-budget-policy.test.ts`

**Interfaces:**
- Consumes: `pnpm test` и новый `pnpm test:profile`.
- Produces: обычный поведенческий прогон без случайного падения; отдельный устойчивый профиль.

- [ ] **Step 1: Проверить текущую привязку разового ограничения**

Run:

```bash
rg -n "assert-test-durations|TEST_DURATION_BUDGET_MS|50 мс" package.json packages .agents
```

Expected: вызовы находятся в трёх package scripts и тестах политики.

- [ ] **Step 2: Удалить вызов из package scripts**

Оставить:

```json
"test": "vitest run ...",
```

с существующими параметрами Vitest и JSON-отчётами, но без
`&& node ../core/scripts/assert-test-durations.mjs ...`.

- [ ] **Step 3: Удалить старый скрипт и его проверки**

Удалить только три файла, перечисленные в разделе Files. Добавить в
`.agents/testing.md`:

```markdown
Разовая длительность отдельного теста не является проверкой качества.
Для решений об оптимизации используй три последовательных прогона:

pnpm test:profile -- --output reports/test-profile/current.json
```

- [ ] **Step 4: Проверить команды**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/test-duration-profile.test.ts scripts/run-test-duration-profile.test.ts
pnpm test
```

Expected: обе команды завершаются с exit 0.

- [ ] **Step 5: Создать коммит**

```bash
git add packages/core/package.json packages/platform/package.json packages/mcp/package.json .agents/testing.md packages/core/scripts
git commit -m "test: :white_check_mark: заменить разовый бюджет профилем"
```

---

### Task 5: Тест ограничения параллелизма без таймера

**Files:**
- Modify: `packages/core/helpers/runBatch.test.ts`
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`

**Interfaces:**
- Consumes: существующий `runBatch(tasks, { concurrency })`.
- Produces: тот же договор `maxRunning <= concurrency` без `setTimeout(5)`.

- [ ] **Step 1: Зафиксировать исходную длительность**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run helpers/runBatch.test.ts --reporter=json --outputFile.json=/private/tmp/run-batch-before.json
```

Expected: тест `не превышает лимит concurrency` занимает около 20 мс или больше.

- [ ] **Step 2: Зафиксировать mutation baseline**

Run:

```bash
pnpm test:mutation -- --report run-batch-before packages/core/helpers/runBatch.ts
```

Expected: отчёт не содержит нестабильных статусов.

- [ ] **Step 3: Заменить таймер управляемыми барьерами**

Создать внутри теста по одному сигналу запуска и освобождения на задачу:

```ts
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const barriers = Array.from({ length: 10 }, () => ({
  started: deferred(),
  release: deferred(),
}))

const tasks = Array.from({ length: 10 }, (_, index) =>
  makeTask({
    name: `task-${index}`,
    run: async () => {
      running++
      maxRunning = Math.max(maxRunning, running)
      barriers[index]!.started.resolve()
      await barriers[index]!.release.promise
      running--
      return index
    },
  })
)

const batch = runBatch(tasks, { concurrency })
for (let offset = 0; offset < barriers.length; offset += concurrency) {
  const wave = barriers.slice(offset, offset + concurrency)
  await Promise.all(wave.map(({ started }) => started.promise))
  expect(running).toBe(wave.length)
  for (const { release } of wave) release.resolve()
}
await batch
expect(maxRunning).toBe(concurrency)
```

- [ ] **Step 4: Проверить договор и длительность**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run helpers/runBatch.test.ts --reporter=json --outputFile.json=/private/tmp/run-batch-after.json
```

Expected: все тесты проходят; целевой тест имеет медиану меньше 10 мс в трёх
последовательных запусках файла.

- [ ] **Step 5: Запустить mutation testing после изменения**

Run:

```bash
pnpm test:mutation -- --report run-batch-after packages/core/helpers/runBatch.ts
pnpm test:mutation:compare -- run-batch-before run-batch-after
```

Expected: ранее обнаруживаемые мутанты не потеряны.

- [ ] **Step 6: Обновить решение реестра и создать коммит**

Для теста `runBatch не превышает лимит concurrency` записать:

```json
{
  "decision": "accelerated",
  "reason": "Настоящий таймер заменён управляемым барьером",
  "remainingContract": "Одновременно выполняется не больше concurrency задач"
}
```

```bash
git add packages/core/helpers/runBatch.test.ts docs/superpowers/test-performance/2026-07-30-core-slow-tests.json
git commit -m "test: :zap: ускорить проверку параллелизма runBatch"
```

---

### Task 6: Проверка этапа и подготовка следующей партии

**Files:**
- Modify: `docs/superpowers/test-performance/2026-07-30-core-slow-tests.json`
- Create: `docs/superpowers/plans/2026-07-30-slow-test-optimization-phase-2.md`

**Interfaces:**
- Consumes: реестр 64 тестов и новый трёхпрогонный профиль.
- Produces: измеренный результат этапа и план файловых тестов со средней длительностью больше 20 мс.

- [ ] **Step 1: Выполнить итоговый профиль этапа**

Run:

```bash
pnpm test:profile -- --output reports/test-profile/phase-1-after.json
```

Expected: профиль успешно построен; тест `runBatch` больше не входит в выборку
либо имеет медиану меньше 10 мс.

- [ ] **Step 2: Проверить весь проект**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: exit 0 для обеих команд.

- [ ] **Step 3: Составить план второй партии**

План второй партии должен перечислить точные тесты с медианой больше 20 мс,
сгруппированные по общему production-маршруту:

- `testSyncAppliedObjectToXML`;
- `convertFromXML` и внешние файлы;
- `failureIntegration`;
- `configurationIndex/fileIO`;
- холодная JSON Schema и worker cache.

Для каждой группы указать production-файлы mutation baseline и отдельный
проверяемый результат.

- [ ] **Step 4: Создать коммит**

```bash
git add docs/superpowers/test-performance/2026-07-30-core-slow-tests.json docs/superpowers/plans/2026-07-30-slow-test-optimization-phase-2.md
git commit -m "docs: :memo: спланировать вторую партию оптимизации"
```
