# Parallel Stepwise 1C E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельный возобновляемый e2e-профиль, который выполняет существующую матрицу по одной операции, параллельно проверяет `designer-agent` и `standalone-server`, сохраняет `.dt` после каждого успешного шага и формирует общий отчёт.

**Architecture:** Один координатор готовит неизменяемый эталон из существующих XML-фикстур, после чего ограниченный пул запускает независимый сценарий для каждого режима. Каждый сценарий использует собственную базу, проект и MCP-процесс, выполняет шаги последовательно и публикует только проверенные `.dt`; координатор агрегирует завершённые события в JSON и Markdown.

**Tech Stack:** TypeScript 5, Node.js 26.4, Vitest, MCP stdio, `@nkdk/platform`, `ibcmd` 1С 8.3.27, LMDB, YAML/XML-фикстуры.

**Spec:** `docs/superpowers/specs/2026-09-03-stepwise-extension-platform-e2e-design.md`

## Global Constraints

- Первый этап использует только существующую матрицу `e2e/partial-sync`; новые предметные случаи и XML-фикстуры не добавляются.
- XML-фикстуры не изменяются и остаются источником истины.
- Старый `test:partial-sync` сохраняет прежнее поведение; новый профиль получает отдельную команду и не входит в обычный `pnpm test`.
- Настоящие операции выполняются через отдельный скомпилированный MCP-процесс каждого сценария; прямые вызовы сервисов MCP не считаются e2e.
- Шаги одного сценария последовательны; независимые режимы могут работать одновременно.
- Контрольная точка публикуется только после проверки повторного импорта и `unchanged`.
- Проверочная выгрузка не меняет снимок и ожидание исходного проекта.
- Рабочие базы пользователя и `sed_nkdk` не используются.
- Обычные `*.test.ts` не обращаются к файловой системе, процессам или 1С; проверки настоящих адаптеров имеют суффикс `*.integration.test.ts` либо выполняются внешним профилем.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base origin/develop`; перед завершением обязательны `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Пооперационный план существующей матрицы

**Files:**
- Create: `e2e/partial-sync/stepwise-plan.ts`
- Create: `e2e/partial-sync/stepwise-plan.test.ts`

**Interfaces:**
- Consumes: `buildScenarioPlan(matrix)` и существующие `ScenarioMatrix`, `ScenarioOperation`, `ScenarioComponentPath`.
- Produces: `ScenarioStep`, `buildStepwisePlan(matrix): readonly ScenarioStep[]`, `stepwisePlanHash(steps): string`.

- [ ] **Step 1: Write the failing plan tests**

```ts
import { expect, it } from "vitest"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan } from "./plan"
import { buildStepwisePlan, stepwisePlanHash } from "./stepwise-plan"

it("разворачивает каждый существующий operation в отдельный шаг", () => {
  const blocks = buildScenarioPlan(partialSyncMatrix)
  const steps = buildStepwisePlan(partialSyncMatrix)
  expect(steps.map(({ operation }) => operation.key))
    .toEqual(blocks.flatMap(({ operations }) => operations.map(({ key }) => key)))
  expect(new Set(steps.map(({ key }) => key)).size).toBe(steps.length)
})

it("хэш зависит от полного содержания шага", () => {
  const steps = buildStepwisePlan(partialSyncMatrix)
  expect(stepwisePlanHash(steps)).toMatch(/^[a-f0-9]{64}$/u)
  expect(stepwisePlanHash(steps)).not.toBe(stepwisePlanHash(steps.slice(1)))
})
```

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-plan.test.ts`
Expected: FAIL because `./stepwise-plan` does not exist.

- [ ] **Step 3: Implement the operation-level plan**

```ts
export type ScenarioStep = {
  readonly key: string
  readonly layerKey: string
  readonly componentPath: ScenarioComponentPath
  readonly operation: ScenarioOperation
}

export function buildStepwisePlan(matrix: ScenarioMatrix): readonly ScenarioStep[] {
  return buildScenarioPlan(matrix).flatMap((block) => block.operations.map((operation) => ({
    key: `${block.layerKey}:${operation.key}`,
    layerKey: block.layerKey,
    componentPath: block.componentPath,
    operation,
  })))
}

export function stepwisePlanHash(steps: readonly ScenarioStep[]): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(steps))).digest("hex")
}
```

Keep canonicalization local and deterministic for `Uint8Array`, arrays, sorted object keys, and omitted `undefined`, matching the existing plan contract without changing `buildScenarioPlan`.

- [ ] **Step 4: Run focused tests and duplicate check**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-plan.test.ts e2e/partial-sync/plan.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 5: Commit**

```text
test: :white_check_mark: добавить пооперационный план e2e
```

### Task 2: Рабочие каталоги и ограничения параллельности

**Files:**
- Create: `e2e/partial-sync/stepwise-workspace.ts`
- Create: `e2e/partial-sync/stepwise-workspace.test.ts`
- Create: `e2e/partial-sync/concurrency.ts`
- Create: `e2e/partial-sync/concurrency.test.ts`

**Interfaces:**
- Consumes: абсолютный корень запуска, идентификатор сценария и настройки `number | "auto"`.
- Produces: `StepwiseRunWorkspace`, `ScenarioRunWorkspace`, `openStepwiseRunWorkspace`, `resolveConcurrency`, `runWithConcurrency`.

- [ ] **Step 1: Write failing workspace ownership tests**

```ts
it("выделяет каждому режиму непересекающиеся каталоги", async () => {
  const run = await openStepwiseRunWorkspace("C:/tmp/nkdk-stepwise", io)
  expect(run.scenario("designer-agent").root)
    .not.toBe(run.scenario("standalone-server").root)
  expect(run.baselineDir).not.toContain("scenarios")
})

it("отвергает корень репозитория, home и символическую ссылку", async () => {
  await expect(openStepwiseRunWorkspace(repositoryRoot, io)).rejects.toThrow()
})
```

Use an in-memory `io` fake in this unit test; keep real path checks in `stepwise-workspace.integration.test.ts` only if the adapter itself needs coverage.

- [ ] **Step 2: Write failing concurrency tests**

```ts
it("auto ограничивает число процессов двумя", () => {
  expect(resolveConcurrency({ total: "auto", designerAgent: "auto", standaloneServer: "auto" }, {
    cpuCount: 32, availableMemoryBytes: 64 * 1024 ** 3,
  })).toEqual({ total: 2, designerAgent: 2, standaloneServer: 2 })
})

it("продолжает очередь после ошибки одного задания", async () => {
  const result = await runWithConcurrency(["a", "b", "c"], 2, async (key) => {
    if (key === "a") throw new Error("planned")
    return key
  })
  expect(result.map(({ status }) => status)).toEqual(["failed", "succeeded", "succeeded"])
})
```

- [ ] **Step 3: Run tests and verify missing modules**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-workspace.test.ts e2e/partial-sync/concurrency.test.ts`
Expected: FAIL because both modules are absent.

- [ ] **Step 4: Implement focused workspace and pool modules**

```ts
export type ConcurrencySetting = number | "auto"
export type ResolvedConcurrency = {
  readonly total: number
  readonly designerAgent: number
  readonly standaloneServer: number
}

export type SettledJob<R> =
  | { readonly status: "succeeded"; readonly value: R }
  | { readonly status: "failed"; readonly error: Error }

export async function runWithConcurrency<T, R>(
  jobs: readonly T[], limit: number, run: (job: T) => Promise<R>,
): Promise<readonly SettledJob<R>[]> // result order equals input order
```

The workspace owns only `baseline`, `scenarios`, `reports`, and `run-state.json`; validate all resolved deletion targets under the requested absolute root. Scenario directories are `scenarios/designer-agent/existing-partial-sync` and `scenarios/standalone-server/existing-partial-sync`.

- [ ] **Step 5: Run focused tests and duplicate check**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-workspace.test.ts e2e/partial-sync/concurrency.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 6: Commit**

```text
test: :white_check_mark: изолировать параллельные сценарии e2e
```

### Task 3: Штатный архив информационной базы

**Files:**
- Create: `e2e/partial-sync/infobase-archive.ts`
- Create: `e2e/partial-sync/infobase-archive.test.ts`

**Interfaces:**
- Consumes: найденный `ibcmd`, каталоги тестовой базы и данных, путь `.dt`, callback закрытия принадлежащего сценарию платформенного соединения.
- Produces: `InfobaseArchiveStore.dump(params): Promise<ArchiveTiming>` и `restore(params): Promise<ArchiveTiming>`.

- [ ] **Step 1: Write failing command-contract tests**

```ts
it("закрывает соединение и выгружает базу во временный dt", async () => {
  const calls: string[] = []
  const store = createInfobaseArchiveStore({
    closeConnection: async () => { calls.push("close") },
    runIbcmd: async (args) => {
      calls.push(args.join(" "))
      return { exitCode: 0, stdout: "ok", stderr: "" }
    },
    move: async () => { calls.push("publish") },
  })
  await store.dump({ baseDir: "C:/run/base", dataDir: "C:/run/data", archivePath: "C:/run/step.dt" })
  expect(calls).toEqual([
    "close",
    "infobase dump --database-path=C:/run/base --data=C:/run/data C:/run/step.dt.tmp",
    "publish",
  ])
})

it("восстанавливает базу с force и требует новое соединение", async () => {
  const outcome = await store.restore({
    baseDir: "C:/run/base", dataDir: "C:/run/data", archivePath: "C:/run/step.dt",
  })
  expect(outcome.requiresReconnect).toBe(true)
})
```

- [ ] **Step 2: Run test and verify missing module**

Run: `pnpm exec vitest run e2e/partial-sync/infobase-archive.test.ts`
Expected: FAIL because `./infobase-archive` does not exist.

- [ ] **Step 3: Implement the ibcmd boundary**

```ts
export type ArchiveTiming = {
  readonly elapsedMs: number
  readonly sizeBytes: number
  readonly requiresReconnect: boolean
}

export type InfobaseArchiveStore = {
  dump(params: ArchiveParams): Promise<ArchiveTiming>
  restore(params: ArchiveParams): Promise<ArchiveTiming>
}
```

Resolve 1С through `findPlatform`, require 8.3.27 and `ibcmdPath`, use `spawn` with `shell: false`, capture stdout/stderr into the attempt log, and publish a dump by same-directory rename only after exit code zero and a non-empty file. The separate MCP process owns the live platform connection, so closing it through `nkdk.close_platform_connection` is necessary before external `ibcmd`; restoration always requires a fresh connection.

- [ ] **Step 4: Run focused tests and existing fixture tests**

Run: `pnpm exec vitest run e2e/partial-sync/infobase-archive.test.ts e2e/partial-sync/platform-fixture.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 5: Commit**

```text
test: :white_check_mark: добавить dt-контрольные точки e2e
```

### Task 4: Неизменяемый начальный эталон

**Files:**
- Create: `e2e/partial-sync/baseline.ts`
- Create: `e2e/partial-sync/baseline.test.ts`
- Create: `e2e/partial-sync/project-settings.ts`
- Modify: `e2e/partial-sync/steps.ts`

**Interfaces:**
- Consumes: `prepareInfobaseFixture`, `openScenarioMcpSession`, `InfobaseArchiveStore`, пути существующих фикстур и сборочный идентификатор NKDK.
- Produces: `prepareOrReuseBaseline(params): Promise<BaselineReference>`, `writeProjectSettings(projectDir, baseDir, mode)`.

- [ ] **Step 1: Write failing baseline publication tests**

```ts
it("публикует эталон только после загрузки, импорта, валидации и dump", async () => {
  const fixture = baselineFixture()
  const baseline = await prepareOrReuseBaseline(fixture.params, fixture.dependencies)
  expect(fixture.calls).toEqual([
    "prepare-infobase", "open-mcp", "import-cf", "import-cfe",
    "validate", "close-mcp", "dump", "publish",
  ])
  expect(baseline.manifest.compatibilityHash).toMatch(/^[a-f0-9]{64}$/u)
})

it("не принимает эталон другой платформы или изменённых фикстур", async () => {
  const fixture = baselineFixture({ storedPlatformVersion: "8.3.27.1" })
  await prepareOrReuseBaseline(fixture.params, fixture.dependencies)
  expect(fixture.calls).toContain("prepare-infobase")
})
```

- [ ] **Step 2: Run test and verify missing module**

Run: `pnpm exec vitest run e2e/partial-sync/baseline.test.ts`
Expected: FAIL because `./baseline` does not exist.

- [ ] **Step 3: Extract project settings without changing old behavior**

Move the current `writeProjectSettings` implementation from `steps.ts` into `project-settings.ts`, export it, and keep the exact YAML and mode contract. Update `steps.test.ts` to prove existing baseline preparation calls it unchanged.

- [ ] **Step 4: Implement baseline manifest and atomic publication**

```ts
export type BaselineManifest = {
  readonly version: 1
  readonly compatibilityHash: string
  readonly fixtureHashes: { readonly cf: string; readonly cfe: string }
  readonly platformVersion: string
  readonly nkdkBuildId: string
  readonly archiveSha256: string
  readonly projectSha256: string
}

export type BaselineReference = {
  readonly archivePath: string
  readonly projectDir: string
  readonly manifest: BaselineManifest
}
```

Build in a sibling temporary directory, use the first enabled mode only for the baseline MCP import (`designer-agent` when enabled, otherwise `standalone-server`), remove `.nkdk/platform-sessions`, `.nkdk/tmp` and live LMDB/process state from the published project, verify all hashes, then rename the complete directory to `baseline/current`. Never accept a partial directory.

- [ ] **Step 5: Run baseline and old-step tests**

Run: `pnpm exec vitest run e2e/partial-sync/baseline.test.ts e2e/partial-sync/steps.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 6: Commit**

```text
test: :white_check_mark: подготовить общий эталон e2e
```

### Task 5: Состояние сценария, публикация шага и восстановление

**Files:**
- Create: `e2e/partial-sync/stepwise-state.ts`
- Create: `e2e/partial-sync/stepwise-state.test.ts`
- Create: `e2e/partial-sync/stepwise-checkpoint.ts`
- Create: `e2e/partial-sync/stepwise-checkpoint.test.ts`

**Interfaces:**
- Consumes: `BaselineReference`, `ScenarioStep[]`, `InfobaseArchiveStore`, `applyScenarioBlock` и `writeProjectSettings`.
- Produces: `StepwiseScenarioState`, `read/writeStepwiseState`, `publishStepCheckpoint`, `restoreStepCheckpoint`.

- [ ] **Step 1: Write failing state and checkpoint tests**

```ts
it("не продвигает state при ошибке dump или публикации", async () => {
  const fixture = checkpointFixture({ dumpError: new Error("planned") })
  await expect(publishStepCheckpoint(fixture.params, fixture.dependencies)).rejects.toThrow("planned")
  expect(fixture.writtenStates).toEqual([])
})

it("восстанавливает dt и воспроизводит YAML только до завершённого шага", async () => {
  const fixture = checkpointFixture({ completedStepIndex: 1 })
  await restoreStepCheckpoint(fixture.params, fixture.dependencies)
  expect(fixture.appliedStepKeys).toEqual(fixture.steps.slice(0, 2).map(({ key }) => key))
  expect(fixture.calls).toContain("restore-dt")
  expect(fixture.calls).toContain("rewrite-settings")
})
```

- [ ] **Step 2: Run tests and verify missing modules**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-state.test.ts e2e/partial-sync/stepwise-checkpoint.test.ts`
Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement versioned state and atomic writes**

```ts
export type StepwiseScenarioState = {
  readonly version: 1
  readonly scenario: "existing-partial-sync"
  readonly mode: "designer-agent" | "standalone-server"
  readonly compatibilityHash: string
  readonly planHash: string
  readonly completedStepKey: string | null
  readonly completedStepIndex: number
  readonly attempt: number
  readonly checkpoint: "checkpoint/current.dt" | null
}
```

Validate key, index, mode and hashes together; recover `state.json.tmp` only when it contains a complete recognized state. Reject foreign and incompatible state rather than resetting silently.

- [ ] **Step 4: Implement checkpoint publication and deterministic replay**

Dump to a temporary `.dt`, verify its SHA-256, write a temporary manifest containing `stepKey`, `stepIndex`, `planHash`, `expectedProjectHash`, `archiveSha256`, and only then switch both checkpoint and state. On restore, reset the scenario project from the baseline project, apply each `ScenarioStep.operation` through a one-operation `ScenarioBlock`, rewrite settings for the scenario base/mode, restore `.dt`, and start later connections lazily.

- [ ] **Step 5: Run focused tests and duplicate check**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-state.test.ts e2e/partial-sync/stepwise-checkpoint.test.ts e2e/partial-sync/operation.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 6: Commit**

```text
test: :white_check_mark: сделать шаги e2e возобновляемыми
```

### Task 6: Полная проверка результата каждого существующего шага

**Files:**
- Create: `e2e/partial-sync/stepwise-steps.ts`
- Create: `e2e/partial-sync/stepwise-steps.test.ts`
- Modify: `e2e/partial-sync/steps.ts`

**Interfaces:**
- Consumes: `ScenarioStep`, `ScenarioMcpSession`, существующие сравнение деревьев, валидацию, импорт и синхронизацию.
- Produces: `StepwiseSteps.execute(step, progress): Promise<StepExecutionResult>` и переиспользуемые экспортированные helpers из `steps.ts` без дублирования MCP-договора.

- [ ] **Step 1: Write the failing stage-order test**

```ts
it("подтверждает каждый шаг повторным импортом до checkpoint", async () => {
  const fixture = stepwiseStepsFixture()
  await fixture.steps.execute(fixture.step, { index: 1, total: 1 })
  expect(fixture.calls).toEqual([
    "apply", "validate-source", "sync:synchronized", "import-verification",
    "validate-verification", "compare-component", "sync:unchanged",
  ])
})

it("не принимает повторный импорт как новое ожидание", async () => {
  const fixture = stepwiseStepsFixture({ comparisonEqual: false })
  await expect(fixture.steps.execute(fixture.step, { index: 1, total: 1 }))
    .rejects.toThrow("compare")
  expect(fixture.sourceWritesAfterApply).toBe(0)
})
```

- [ ] **Step 2: Run test and verify missing module**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-steps.test.ts`
Expected: FAIL because `./stepwise-steps` does not exist.

- [ ] **Step 3: Extract shared MCP assertions from old steps**

Export focused functions `importComponent`, `expectSuccessfulValidation`, `syncAndExpectStatus`, `closePlatformConnection`, and `prepareVerificationProject` from `steps.ts`. Preserve old call order and tests; do not introduce a second sync implementation.

- [ ] **Step 4: Implement stepwise verification**

```ts
export type StepExecutionResult = {
  readonly stepKey: string
  readonly stageTimings: Readonly<Record<
    "apply" | "validation" | "sync" | "verificationImport" |
    "verificationValidation" | "comparison" | "unchanged", number
  >>
  readonly attemptLogDir: string
}
```

Use a fresh verification directory per attempt. Import the changed component; when it is `cfe`, seed the verification project with the immutable baseline `cf` before importing the extension. Compare the complete affected component with the source project using existing semantic XML and normalized YAML/text modes. Always close the verification connection in `finally`.

- [ ] **Step 5: Run new and existing step tests**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-steps.test.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/mcp-session.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 6: Commit**

```text
test: :white_check_mark: проверять каждый шаг e2e через 1С
```

### Task 7: Последовательный сценарий и общий отчёт

**Files:**
- Create: `e2e/partial-sync/stepwise-scenario.ts`
- Create: `e2e/partial-sync/stepwise-scenario.test.ts`
- Create: `e2e/partial-sync/stepwise-report.ts`
- Create: `e2e/partial-sync/stepwise-report.test.ts`

**Interfaces:**
- Consumes: восстановленный scenario workspace, `ScenarioStep[]`, `StepwiseSteps`, checkpoint store and completed events.
- Produces: `runStepwiseScenario(params): Promise<ScenarioResult>`, `createStepwiseReportStore(reportDir)`.

- [ ] **Step 1: Write failing recovery and failure-isolation tests**

```ts
it("начинает со следующего шага после восстановления", async () => {
  const fixture = scenarioFixture({ completedStepIndex: 0 })
  const result = await runStepwiseScenario(fixture.params, fixture.dependencies)
  expect(fixture.executed).toEqual(fixture.steps.slice(1).map(({ key }) => key))
  expect(result.status).toBe("succeeded")
})

it("не публикует checkpoint упавшего шага", async () => {
  const fixture = scenarioFixture({ failStepIndex: 1 })
  const result = await runStepwiseScenario(fixture.params, fixture.dependencies)
  expect(result.status).toBe("failed")
  expect(fixture.published).toEqual([fixture.steps[0].key])
})
```

- [ ] **Step 2: Write failing atomic report tests**

```ts
it("группирует одинаковые шаги по режимам и сохраняет историю попыток", async () => {
  await store.record(designerEvent)
  await store.record(serverEvent)
  const report = await store.read()
  expect(report.scenarios["existing-partial-sync"].modes).toEqual({
    "designer-agent": expect.any(Object),
    "standalone-server": expect.any(Object),
  })
  expect(report.scenarios["existing-partial-sync"].modes["designer-agent"].attempts).toHaveLength(1)
})
```

- [ ] **Step 3: Run tests and verify missing modules**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-scenario.test.ts e2e/partial-sync/stepwise-report.test.ts`
Expected: FAIL because the new modules do not exist.

- [ ] **Step 4: Implement sequential scenario execution**

Return a terminal result instead of throwing a subject failure so the coordinator can continue other scenarios. Infrastructure failure before ownership is established may still reject. Record `started`, every stage, `checkpoint-published`, and terminal `succeeded|failed|interrupted`; keep the full causal message and relative attempt-log path.

- [ ] **Step 5: Implement single-writer JSON and Markdown reports**

```ts
export type ScenarioResult = {
  readonly id: string
  readonly mode: "designer-agent" | "standalone-server"
  readonly status: "succeeded" | "failed" | "interrupted"
  readonly completedSteps: number
  readonly totalSteps: number
  readonly durationMs: number
  readonly failure?: { readonly category: FailureCategory; readonly message: string }
}
```

Serialize all `record` calls through one promise chain, write `report.json.tmp` and `report.md.tmp`, then rename each. Store paths relative to the run root and distinguish `validation`, `platform`, `verification-diff`, `mcp-transport`, and `infrastructure` failures.

- [ ] **Step 6: Run focused tests and duplicate check**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-scenario.test.ts e2e/partial-sync/stepwise-report.test.ts`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 7: Commit**

```text
test: :white_check_mark: собрать отчёт пошагового e2e
```

### Task 8: Параллельный координатор и отдельная команда запуска

**Files:**
- Create: `e2e/partial-sync/stepwise-run.ts`
- Create: `e2e/partial-sync/stepwise-run.test.ts`
- Modify: `package.json`
- Modify: `e2e/partial-sync/vitest.config.ts` only if a dedicated external entry is retained; prefer the direct coordinator CLI.

**Interfaces:**
- Consumes: CLI arguments, baseline builder, `runWithConcurrency`, both scenario modes, stepwise plan and report store.
- Produces: `parseStepwiseArgs`, `runStepwiseCli`, script `test:partial-sync:stepwise`.

- [ ] **Step 1: Write failing CLI tests**

```ts
it("по умолчанию планирует оба режима с auto", () => {
  expect(parseStepwiseArgs(["--root", "C:/run"])).toMatchObject({
    root: "C:/run",
    reset: false,
    concurrency: { total: "auto", designerAgent: "auto", standaloneServer: "auto" },
    modes: ["designer-agent", "standalone-server"],
  })
})

it("соблюдает общий и режимные пределы и не отменяет парный сценарий", async () => {
  const fixture = coordinatorFixture({ designerResult: "failed", serverResult: "succeeded" })
  const result = await runStepwiseCli(fixture.argv, fixture.dependencies)
  expect(fixture.maxRunning).toBeLessThanOrEqual(2)
  expect(result.scenarios.map(({ status }) => status)).toEqual(["failed", "succeeded"])
})
```

- [ ] **Step 2: Run test and verify missing module**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-run.test.ts`
Expected: FAIL because `./stepwise-run` does not exist.

- [ ] **Step 3: Implement the coordinator**

Accept `--root`, `--reset`, numeric or `auto` values for `--workers`, `--designer-workers` and `--standalone-workers`, and repeatable `--mode`. Reject duplicates, zero total workers, relative roots and unknown arguments. Prepare/reuse the baseline before entering the pool, create jobs in stable mode order, open a new compiled MCP session inside each job, and close it in `finally`.

- [ ] **Step 4: Wire a separate package script**

```json
{
  "scripts": {
    "test:partial-sync:stepwise": "pnpm --filter @nkdk/mcp build && tsx e2e/partial-sync/stepwise-run.ts"
  }
}
```

The command exits non-zero after all scheduled scenarios finish when at least one terminal result is not `succeeded`. It prints the absolute JSON and Markdown report paths.

- [ ] **Step 5: Run coordinator, old CLI, and architecture tests**

Run: `pnpm exec vitest run e2e/partial-sync/stepwise-run.test.ts e2e/partial-sync/run.test.ts e2e/partial-sync/external-scenario.test.ts`
Expected: PASS.

Run: `pnpm test:architecture:rules && pnpm test:architecture`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 6: Commit**

```text
test: :white_check_mark: запускать режимы 1С параллельно
```

### Task 9: Полная проверка и первый реальный отчёт

**Files:**
- Modify only files required to fix defects demonstrated by the new tests; do not change XML fixtures or accepted expectations.
- Produce outside git: `C:\git\nkdk\.tmp-stepwise-engine-e2e\reports\report.json`, `C:\git\nkdk\.tmp-stepwise-engine-e2e\reports\report.md`, scenario logs and `.dt` checkpoints.

**Interfaces:**
- Consumes: completed stepwise engine and existing partial-sync matrix.
- Produces: verified branch and first real report for both modes.

- [ ] **Step 1: Run all non-platform checks**

Run: `pnpm type-check`
Expected: PASS.

Run: `pnpm test`
Expected: PASS in all workspace packages.

Run: `pnpm test:architecture:rules`
Expected: PASS.

Run: `pnpm test:architecture`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

- [ ] **Step 2: Run the real stepwise profile outside the sandbox**

Run: `pnpm test:partial-sync:stepwise -- --root C:\git\nkdk\.tmp-stepwise-engine-e2e --reset --workers 2`
Expected: the baseline is built once; both modes are scheduled independently; every existing operation reaches a terminal step result; both report files are created. A subject failure may make the command non-zero but must not suppress the other mode or its report.

- [ ] **Step 3: Triage demonstrated defects without changing fixtures**

For every failing step, classify the report category and reproduce the defect at the narrowest stable layer. Add a failing regression test there, implement the smallest correction, run its focused checks, then repeat only the failed stepwise scenario from its last `.dt`. If a correction requires a product decision absent from the spec, stop and ask instead of weakening the assertion.

- [ ] **Step 4: Repeat complete verification after corrections**

Run: `pnpm type-check && pnpm test && pnpm test:architecture:rules && pnpm test:architecture`
Expected: PASS.

Run: `pnpm duplicates -- --base origin/develop`
Expected: no new duplication violation.

Run: `pnpm test:partial-sync:stepwise -- --root C:\git\nkdk\.tmp-stepwise-engine-e2e --workers 2`
Expected: resumes incomplete scenarios, both modes finish successfully, and the report contains durations and zero failed/incomplete steps.

- [ ] **Step 5: Commit any verified corrections and final integration**

Use one focused Conventional Commit with gitmoji per independently reviewed correction. If no correction is necessary, commit only any remaining coordinator integration with:

```text
test: :white_check_mark: завершить пошаговый e2e 1С
```
