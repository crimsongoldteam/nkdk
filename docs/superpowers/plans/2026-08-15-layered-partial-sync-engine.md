# Layered Partial Sync Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить пооперационный partial e2e исполнителем пробных и массовых блоков с состоянием версии 3, измерением стадий и одним постоянным платформенным сеансом.

**Architecture:** Матрица остаётся декларативным источником файловых операций, а `plan.ts` группирует их в слои и блоки. `scenario.ts` исполняет и подтверждает блок целиком; `steps.ts` владеет validation и MCP-синхронизацией, а отдельный отчёт собирает длительности без условий по metadata-типам.

**Tech Stack:** TypeScript, Vitest, MCP stdio, файловая база, существующие `ScenarioFileChange`, checkpoint SHA-256.

## Global Constraints

- Реальный сценарий остаётся ручным и не входит в `pnpm test`, `pnpm test:e2e` или CI.
- Каждый непустой блок выполняет ровно один validation, один `synchronized`, один `unchanged` и одну публикацию контрольной копии.
- Основной MCP- и платформенный сеансы переиспользуются между блоками.
- Формат состояния становится версией 3; версия 2 без `--reset` только отклоняется.
- Контрольная копия остаётся единственной и исключает `.nkdk/platform-sessions` и `.nkdk/tmp`.
- Реальный сценарий не прерывает автономный сервер намеренно: копия работающей файловой базы является только негарантированным резервом.
- Координатор восстановления проверяется быстрым тестом с подменёнными зависимостями, но не включается в реальный external test.
- XML-фикстуры не изменять.
- Автономный режим клиент-серверных баз остаётся запрещён.
- Базовый коммит для проверок дублей этого плана: `83c40f5e4`.

---

### Task 1: Декларативные слои и блоки

**Files:**
- Modify: `e2e/partial-sync/matrix/types.ts`
- Create: `e2e/partial-sync/matrix/layers.ts`
- Modify: `e2e/partial-sync/matrix/index.ts`
- Modify: `e2e/partial-sync/plan.ts`
- Modify: `e2e/partial-sync/plan.test.ts`

**Interfaces:**
- Consumes: существующие `ScenarioOperation` и декларации `roots`, `children`, `forms`.
- Produces: `ScenarioLayer`, `ScenarioBlock`, `buildScenarioPlan(matrix): readonly ScenarioBlock[]`.

- [ ] **Step 1: Написать падающие проверки построения блоков**

Добавить случаи, которые требуют явного представителя, создают `probe` и `bulk`, не создают пустой `bulk` и отклоняют зависимость пробной операции от массовой:

```ts
expect(buildScenarioPlan(matrix)).toMatchObject([
  { key: "roots:create:probe", componentPath: "cf", operations: [{ key: "object:catalog" }] },
  { key: "roots:create:bulk", componentPath: "cf", operations: [{ key: "object:document" }] },
])
expect(() => buildScenarioPlan(invalidProbeMatrix)).toThrow("Пробная операция")
```

- [ ] **Step 2: Запустить целевой тест и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/plan.test.ts`

Expected: FAIL, потому что `ScenarioBlock` и слои ещё не существуют.

- [ ] **Step 3: Добавить типы и начальные слои существующей матрицы**

```ts
export type ScenarioLayer = {
  readonly key: string
  readonly componentPath: "cf" | `cfe/${string}`
  readonly probeOperationKey: string
  readonly operations: readonly ScenarioOperation[]
}

export type ScenarioBlock = {
  readonly key: `${string}:probe` | `${string}:bulk`
  readonly layerKey: string
  readonly componentPath: "cf" | `cfe/${string}`
  readonly operations: readonly ScenarioOperation[]
}
```

В `layers.ts` объявить шесть начальных слоёв: создание корней, детей и форм,
затем удаление форм, детей и корней. Представителями выбрать соответственно
`object:catalog`, `child:catalog:attributes`, `form:catalog`,
`remove:form:task`, `remove:child:task:commands` и
`remove:object:ws-reference`. Эти ключи являются первыми безопасными операциями
соответствующих обратных групп. Сохранить существующий топологический порядок
внутри массовых блоков.

- [ ] **Step 4: Реализовать проверки плана и канонический хэш блоков**

`buildScenarioPlan` должен валидировать уникальность, компонент, представителя,
зависимости и цепочки изменений совпадающих путей. `scenarioPlanHash` получает
готовые блоки и включает ключ слоя, компонент и операции.

- [ ] **Step 5: Запустить тесты плана и матрицы**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/plan.test.ts e2e/partial-sync/matrix.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить дубли и зафиксировать слой**

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/matrix e2e/partial-sync/plan.ts e2e/partial-sync/plan.test.ts
git commit -m "refactor: :recycle: сгруппировать матрицу в блоки"
```

### Task 2: Применение блока к выбранному компоненту

**Files:**
- Modify: `e2e/partial-sync/operation.ts`
- Modify: `e2e/partial-sync/operation.test.ts`

**Interfaces:**
- Consumes: `ScenarioBlock.componentPath`, `ScenarioBlock.operations`.
- Produces: `applyScenarioBlock(projectDir, block): Promise<readonly string[]>`.

- [ ] **Step 1: Добавить проверки компонента и последовательных переходов**

Проверить запись под `cf`, под `cfe/Расширение_All`, два последовательных
изменения одного файла и отказ при выходе из каталога компонента:

```ts
await applyScenarioBlock(projectDir, {
  key: "extension:probe",
  layerKey: "extension",
  componentPath: "cfe/Расширение_All",
  operations: [firstChange, secondChange],
})
expect(await readFile(target, "utf8")).toBe("третье состояние")
```

- [ ] **Step 2: Запустить проверку и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/operation.test.ts`

Expected: FAIL с отсутствующим `applyScenarioBlock`.

- [ ] **Step 3: Сделать корень операции параметризованным**

Изменить внутреннее разрешение пути с жёсткого `cf` на
`join(projectDir, ...componentPath.split("/"))`. `applyScenarioBlock`
последовательно вызывает узкую логику операции, объединяет и сортирует пути,
а ошибка содержит ключи блока и операции. Символические ссылки и `..` остаются
запрещены.

- [ ] **Step 4: Запустить тест и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/operation.test.ts`

Expected: PASS.

```bash
git add e2e/partial-sync/operation.ts e2e/partial-sync/operation.test.ts
git commit -m "refactor: :recycle: применять блок к компоненту"
```

### Task 3: Состояние версии 3 и checkpoint блока

**Files:**
- Modify: `e2e/partial-sync/workspace.ts`
- Modify: `e2e/partial-sync/workspace.test.ts`
- Modify: `e2e/partial-sync/checkpoints.ts`
- Modify: `e2e/partial-sync/checkpoints.test.ts`

**Interfaces:**
- Consumes: стабильный ключ завершённого блока.
- Produces: `ScenarioState` версии 3 с `completedBlock`; `CheckpointPublication.completedBlock`.

- [ ] **Step 1: Написать проверки нового состояния и отказа версии 2**

```ts
expect(await readState(root)).toEqual({
  version: 3,
  scenario: "partial-sync-layered-matrix",
  completedBlock: null,
  checkpoint: null,
  planHash,
})
await expect(openScenarioWorkspace(root, { planHash, reset: false }))
  .rejects.toThrow("Несовместимая версия состояния")
```

Также заменить в checkpoint-тестах `completedOperation` на `completedBlock` и
проверить manifest версии 3.

- [ ] **Step 2: Запустить проверки и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/checkpoints.test.ts`

Expected: FAIL на версии и поле состояния.

- [ ] **Step 3: Реализовать миграционную границу**

Распознавать версии 1 и 2 только для понятного сообщения о несовместимости.
Новое состояние записывать как:

```ts
type ScenarioState = {
  readonly version: 3
  readonly scenario: "partial-sync-layered-matrix"
  readonly completedBlock: string | null
  readonly checkpoint: "checkpoints/current" | null
  readonly planHash: string
}
```

Manifest checkpoint также хранит `completedBlock`; атомарная публикация и
восстановление остаются без изменения.

- [ ] **Step 4: Запустить тесты состояния и checkpoint**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/checkpoints.test.ts`

Expected: PASS.

- [ ] **Step 5: Проверить дубли и зафиксировать изменение**

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/workspace.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/checkpoints.ts e2e/partial-sync/checkpoints.test.ts
git commit -m "feat: :sparkles: возобновлять partial e2e с блока"
```

### Task 4: Координатор блоков

**Files:**
- Modify: `e2e/partial-sync/scenario.ts`
- Modify: `e2e/partial-sync/scenario.test.ts`

**Interfaces:**
- Consumes: `readonly ScenarioBlock[]`, `PartialSyncSteps.executeBlock`.
- Produces: публикацию после целого блока и продолжение с `completedBlock`.

- [ ] **Step 1: Переделать существующие сценарные проверки на блоки**

Проверить продолжение со следующего блока, повтор незавершённого блока,
отсутствие checkpoint при ошибке второй операции массового блока и прогресс по
блокам:

```ts
expect(executedBlockKeys).toEqual(["children:create:bulk", "forms:create:probe"])
expect(publications).toEqual([
  { completedBlock: "children:create:bulk", planHash },
  { completedBlock: "forms:create:probe", planHash },
])
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts`

Expected: FAIL из-за пооперационного интерфейса.

- [ ] **Step 3: Реализовать цикл блоков**

Заменить `executeOperation` на `executeBlock`; вычислять начальный индекс по
`completedBlock`; публиковать checkpoint только после успешного возврата всего
блока. Не перехватывать ошибку для продолжения внутри того же запуска.

- [ ] **Step 4: Запустить сценарные тесты и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts`

Expected: PASS.

```bash
git add e2e/partial-sync/scenario.ts e2e/partial-sync/scenario.test.ts
git commit -m "refactor: :recycle: выполнять partial e2e блоками"
```

### Task 5: Один MCP-цикл и отчёт времени на блок

**Files:**
- Create: `e2e/partial-sync/timing.ts`
- Create: `e2e/partial-sync/timing.test.ts`
- Modify: `e2e/partial-sync/steps.ts`
- Modify: `e2e/partial-sync/steps.test.ts`
- Modify: `e2e/partial-sync/scenario.ts`

**Interfaces:**
- Consumes: `ScenarioBlock`, `applyScenarioBlock`, `now(): number`.
- Produces: `BlockExecutionTiming`, `ScenarioTimingReport`, `logs/timings.json`.

- [ ] **Step 1: Написать проверки вызовов и отчёта**

Проверить, что блок из трёх операций вызывает `applyScenarioBlock` один раз,
validation один раз, sync дважды, а отчёт содержит пять стадий:

```ts
expect(calls.map(([name]) => name)).toEqual([
  "nkdk.validate_project",
  "nkdk.sync_to_infobase",
  "nkdk.sync_to_infobase",
])
expect(report.blocks[0]).toMatchObject({
  blockKey: "roots:create:bulk",
  applyMs: 10,
  validationMs: 20,
  synchronizeMs: 30,
  unchangedMs: 40,
  checkpointMs: 50,
})
```

- [ ] **Step 2: Запустить тесты и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/timing.test.ts`

Expected: FAIL на новом интерфейсе и отчёте.

- [ ] **Step 3: Реализовать `executeBlock` и сбор стадий**

`steps.executeBlock` применяет блок, валидирует проект и синхронизирует
`block.componentPath`. Первый ответ обязан быть `synchronized`, второй —
`unchanged`. Он возвращает четыре длительности; `scenario.ts` добавляет время
checkpoint и передаёт запись в `ScenarioTimingReport`.

`timing.ts` атомарно перезаписывает `logs/timings.json` после каждого блока и
печатает одну строку прогресса. Накопленные журналы MCP остаются отдельными.

- [ ] **Step 4: Запустить целевые тесты**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/timing.test.ts e2e/partial-sync/scenario.test.ts`

Expected: PASS.

- [ ] **Step 5: Проверить дубли и зафиксировать изменение**

Run: `pnpm duplicates -- --base 83c40f5e4`

```bash
git add e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/scenario.ts e2e/partial-sync/timing.ts e2e/partial-sync/timing.test.ts
git commit -m "perf: :zap: синхронизировать матрицу блоками"
```

### Task 6: Базовый импорт и итоговая проверка расширения

**Files:**
- Modify: `e2e/partial-sync/steps.ts`
- Modify: `e2e/partial-sync/steps.test.ts`

**Interfaces:**
- Consumes: существующее загруженное `Расширение_All`.
- Produces: исходный и итоговый импорт `cf` и `cfe/Расширение_All`.

- [ ] **Step 1: Усилить существующий тест порядка MCP-вызовов**

Ожидать импорт обоих компонентов при подготовке и после закрытия основного
сеанса:

```ts
expect(importInputs.map(({ componentPath }) => componentPath)).toEqual([
  "cf",
  "cfe/Расширение_All",
  "cf",
  "cfe/Расширение_All",
])
expect(comparedComponents).toEqual(["cf", "cfe/Расширение_All"])
```

- [ ] **Step 2: Запустить тест и увидеть падение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts`

Expected: FAIL, потому что сейчас импортируется и сравнивается только `cf`.

- [ ] **Step 3: Импортировать и сравнивать два компонента**

В `prepareBaseline` после загрузки базы импортировать `cf`, затем расширение.
В `verifyFinalState` после одного закрытия основного соединения импортировать
оба компонента в проверочный проект и сравнить соответствующие каталоги. В
`finally` закрыть проверочный сеанс один раз.

- [ ] **Step 4: Запустить тест и зафиксировать изменение**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts`

Expected: PASS.

```bash
git add e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts
git commit -m "test: :white_check_mark: сверять расширение в partial e2e"
```

### Task 7: Один реальный сеанс и изолированная проверка восстановления

**Files:**
- Modify: `e2e/partial-sync/partial-sync.external.test.ts`
- Create: `e2e/partial-sync/external-scenario.ts`
- Create: `e2e/partial-sync/external-scenario.test.ts`
- Create: `e2e/partial-sync/recovery-probe.ts`
- Create: `e2e/partial-sync/recovery-probe.test.ts`

**Interfaces:**
- Consumes: `openScenarioMcpSession`, обычный `runPartialSyncScenario` и подменяемые зависимости checkpoint.
- Produces: `runExternalPartialSyncScenario`, который владеет ровно одним сеансом; отдельно — unit-проверку `runScenarioWithRecoveryProbe` без запуска платформы.

- [x] **Step 1: Написать падающий тест единого сеанса**

Тест `external-scenario.test.ts` передаёт поддельную фабрику сеанса и поддельный
`runScenario`, затем проверяет наблюдаемое управление ресурсом: фабрика вызвана
один раз, тот же объект шагов передан сценарию, а `close` выполнен один раз
после успешного сценария и один раз после ошибки:

```ts
await runExternalPartialSyncScenario(params, {
  async openSession() { opened += 1; return fakeSession },
  createSteps({ session }) { receivedSession = session; return fakeSteps },
  async runScenario(input) { receivedSteps = input.steps },
})
expect({ opened, closed, receivedSession, receivedSteps }).toEqual({
  opened: 1,
  closed: 1,
  receivedSession: fakeSession,
  receivedSteps: fakeSteps,
})
```

- [x] **Step 2: Запустить тест и подтвердить отсутствие координатора**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/external-scenario.test.ts`

Expected: FAIL с отсутствующим `runExternalPartialSyncScenario`.

- [x] **Step 3: Реализовать минимального владельца сеанса**

`external-scenario.ts` один раз вызывает `openSession`, создаёт шаги и передаёт
их в `runPartialSyncScenario`. Закрытие находится только в `finally`; повторное
открытие и восстановительная инъекция в этом модуле отсутствуют.

- [x] **Step 4: Сохранить управляемый тест координатора восстановления**

Использовать фейковые сессии и checkpoint-зависимости. Первая попытка должна
завершить блок и выбросить `ExpectedRecoveryProbeInterruption` до публикации;
вторая — вызвать restore, повторить тот же блок и продолжить:

```ts
expect(sessionCloseCount).toBe(2)
expect(executedBlockKeys).toEqual([probeKey, probeKey, nextKey])
expect(restoredStates).toEqual([expect.objectContaining({ completedBlock: previousKey })])
```

- [x] **Step 5: Запустить тест восстановления**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/recovery-probe.test.ts`

Expected: PASS, потому что координатор уже реализован и остаётся отдельной
модульной диагностикой.

- [x] **Step 6: Оставить тестовый координатор двух запусков вне external test**

Обернуть `publishCheckpoint` только для выбранного блока: после успешного
`executeBlock`, но до публикации, завершить первую попытку ожидаемым исключением.
Закрыть первую сессию, заново открыть workspace и вторую сессию, затем вызвать
обычный `runPartialSyncScenario` без инъекции. Не добавлять параметров MCP и не
записывать маркер в checkpoint. Этот координатор используется только
`recovery-probe.test.ts` и не доказывает согласованность копии `1Cv8.1CD`.

- [x] **Step 7: Перевести external test на обычный запуск в одном сеансе**

Удалить импорты `recoveryProbeBlockKey` и `runScenarioWithRecoveryProbe`.
External test передаёт workspace, plan, mode и отчёт в
`runExternalPartialSyncScenario`. Открытие `openScenarioMcpSession`, создание
`createPartialSyncSteps`, вызов `runPartialSyncScenario` и закрытие находятся
в `external-scenario.ts`:

```ts
await runExternalPartialSyncScenario({
  workspace,
  plan,
  planHash,
  mode,
  timingReport: createScenarioTimingReport(workspace.logsDir),
  now: Date.now,
})
```

- [x] **Step 8: Запустить unit/e2e-проверки сценария**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/external-scenario.test.ts e2e/partial-sync/recovery-probe.test.ts e2e/partial-sync/scenario.test.ts`

Expected: PASS; поведенческий тест подтверждает ровно одно открытие и закрытие
сеанса. Компиляцию изменённого external test отдельно подтверждает
`pnpm type-check`.

- [x] **Step 9: Зафиксировать изменение**

```bash
git add e2e/partial-sync/partial-sync.external.test.ts e2e/partial-sync/external-scenario.ts e2e/partial-sync/external-scenario.test.ts e2e/partial-sync/recovery-probe.ts e2e/partial-sync/recovery-probe.test.ts
git commit -m "test: :white_check_mark: сохранить единый сеанс partial e2e"
```

### Task 8: Проверка готового механизма

**Files:**
- Verify only.

**Interfaces:**
- Consumes: все результаты Tasks 1–7.
- Produces: подтверждённый механизм, готовый для расширения каталога операций.

- [ ] **Step 1: Запустить все быстрые partial-sync тесты**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync`

Expected: PASS; реальный `*.external.test.ts` не запускает платформу.

- [ ] **Step 2: Запустить обязательные проверки проекта**

Run: `pnpm type-check`

Run outside sandbox: `pnpm test`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 83c40f5e4`

Expected: все команды завершаются с кодом 0, новых дублей нет.

- [ ] **Step 3: Выполнить реальный автономный сценарий без прерывания**

Run outside sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test' --mode standalone-server --reset
```

Существующая матрица после группировки содержит только шесть слоёв, поэтому
выполнить её полностью. Проверить в `logs/timings.json`, что каждый массовый
блок отправил один ZIP, второй вызов вернул `unchanged`, а последующие блоки
использовали существующее соединение. Не останавливать `ibsrv` между блоками и
не проверять открытие контрольной копии новым сервером.

- [ ] **Step 4: Зафиксировать только необходимые исправления проверки**

Если Step 3 выявил дефект механизма, добавить узкий падающий тест, исправить и
зафиксировать отдельным `fix: :bug:` коммитом. Если дефектов нет, коммит не
создавать.
