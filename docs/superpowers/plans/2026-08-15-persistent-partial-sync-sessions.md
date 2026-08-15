# Persistent Partial Sync Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переиспользовать один MCP-сеанс и один основной платформенный сеанс во всех частичных операциях e2e, включая постоянный автономный процесс `ibsrv`.

**Architecture:** Автономный `PlatformSession` становится владельцем долгоживущих `ibsrv`, SSH и командного протокола и выполняет загрузку, выгрузку и получение расширений через один протокол. Матричный e2e передаёт один `ScenarioMcpSession` во все шаги, создаёт живые контрольные копии после операций и выполняет полную проверочную выгрузку только после закрытия основного платформенного соединения.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, MCP stdio, `ibcmd`, `ibsrv`, SSH-командный протокол платформы, LMDB.

## Global Constraints

- Автономный режим остаётся запрещённым для клиент-серверных баз.
- После каждого принятого ZIP обязательно выполнять `config update-db-cfg --session-terminate="prompt"`.
- `nkdk.close_platform_connection`, отмена, тайм-аут простоя и неизвестный результат обязаны останавливать принадлежащий процесс.
- Подтверждённый отказ пакета не обязан уничтожать исправный сеанс.
- Контрольная копия работающей файловой базы является осознанно ненадёжной и используется только проверочным e2e.
- `.nkdk/platform-sessions` и `.nkdk/tmp` не должны восстанавливаться из контрольной копии.
- Существующие XML-фикстуры не изменять.
- Новые тесты сначала должны падать по причине отсутствующего поведения.
- Базовый коммит проверки дублей: `2af987e2d`.

---

### Task 1: Выделить общие операции staging интерактивного сеанса

**Files:**
- Create: `packages/platform/src/sessions/interactiveSessionFiles.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Test: `packages/platform/src/sessions/designerAgent.test.ts`

**Interfaces:**
- Consumes: `SessionFileSystem`-совместимые `realpath`, `rm`, `rename`, `mkdir`; канонический корень сеанса и каталог `users-data`.
- Produces:
  ```ts
  export type InteractiveSessionFileSystem = Pick<
    SessionFileSystem,
    "mkdir" | "realpath" | "rename" | "rm"
  >

  export function relativeServicePath(userServiceDir: string, path: string): string

  export function checkedOperationOutputDir(
    allowedRoot: string,
    outputDir: string,
    fileSystem: Pick<SessionFileSystem, "realpath">,
  ): Promise<string>

  export function prepareSessionStagingDirectory(
    stagingDir: string,
    fileSystem: Pick<SessionFileSystem, "mkdir" | "rm">,
    failureMessage: string,
  ): Promise<void>

  export function publishSessionStagingDirectory(
    stagingDir: string,
    outputDir: string,
    fileSystem: Pick<SessionFileSystem, "rename" | "rm">,
  ): Promise<void>
  ```

- [ ] **Step 1: Зафиксировать зелёную исходную проверку агента**

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/designerAgent.test.ts
```

Expected: PASS. Эти существующие тесты защищают проверку границ пути, staging и публикацию выгрузки; отдельный тест приватных переходников не добавляется.

- [ ] **Step 2: Перенести операции без изменения поведения**

Создать `interactiveSessionFiles.ts` и перенести в него логику существующих `checkedOutputDir`, `relativeAgentPath`, `prepareStagingDirectory` и `moveStagingDirectory`. Сохранить проверки:

```ts
const resolvedOutput = await fileSystem.realpath(outputDir)
if (!isPathInside(allowedRoot, resolvedOutput)) {
  throw new PlatformSessionError(
    "platform_command_failed",
    "Каталог выгрузки должен находиться внутри разрешённого корня",
  )
}
```

`relativeServicePath` возвращает относительный путь с `/`, пригодный для
интерактивной команды. Оба вызывающих адаптера передают только staging, который
они сами построили внутри `userServiceDir`. Агент передаёт в
`prepareSessionStagingDirectory` прежний текст ошибки без изменения внешней
диагностики.

- [ ] **Step 3: Подключить общий модуль в агенте**

В `designerAgent.ts` заменить четыре локальные функции импортами:

```ts
import {
  checkedOperationOutputDir,
  prepareSessionStagingDirectory,
  publishSessionStagingDirectory,
  relativeServicePath,
} from "./interactiveSessionFiles"
```

Удалить только перенесённые реализации. Не менять команды, порядок очистки и обработку отмены.

- [ ] **Step 4: Проверить отсутствие изменения поведения**

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/designerAgent.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 2af987e2d
```

Expected: все команды PASS, новых дублей нет.

- [ ] **Step 5: Закоммитить слой**

```bash
git add packages/platform/src/sessions/interactiveSessionFiles.ts packages/platform/src/sessions/designerAgent.ts
git commit -m "refactor: :recycle: выделить staging интерактивного сеанса"
```

---

### Task 2: Сделать автономный процесс постоянным

**Files:**
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Test: `packages/platform/src/sessions/manager.test.ts`

**Interfaces:**
- Consumes: функции staging из Task 1; `buildStandaloneLaunch`, `buildDumpConfigurationCommand`, `buildListDesignerExtensionsCommand`, `buildLoadPartialConfigurationCommand`; `PlatformCommandSession`.
- Produces: существующий `createStandaloneServerSession(params, dependencies): Promise<PlatformSession>` с новым жизненным циклом: один `ibsrv` и один SSH-сеанс на весь объект `PlatformSession`.

- [ ] **Step 1: Написать падающий тест двух загрузок**

В `standaloneServer.test.ts` добавить тест, который вызывает загрузку дважды до `close`:

```ts
it("reuses one autonomous process for consecutive partial loads", async () => {
  const fixture = createFixture({ agentEnabled: true })
  const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

  await session.loadPartialConfiguration?.(
    "/project/first.zip",
    ["Catalogs/First/Ext/ObjectModule.bsl"],
    fixture.operationLog,
  )
  await session.loadPartialConfiguration?.(
    "/project/second.zip",
    ["Catalogs/Second.xml"],
    fixture.operationLog,
  )

  expect(fixture.calls.filter((call) => call.startsWith("spawn ibsrv"))).toHaveLength(1)
  expect(fixture.calls.filter((call) => call.startsWith("ssh.connect"))).toHaveLength(1)
  expect(fixture.calls.filter((call) => call.startsWith("shell.run config load-files"))).toHaveLength(2)
  await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })
  expect(fixture.calls).toContain("shell.run common shutdown")
})
```

Production change caught: возврат `stopStandaloneAgent` в `finally` каждой загрузки снова создаст два процесса и тест упадёт.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/standaloneServer.test.ts -t "reuses one autonomous process"
```

Expected: FAIL — зарегистрированы два `spawn ibsrv` и два `ssh.connect` либо первый процесс уже закрыт.

- [ ] **Step 3: Перенести запуск `ibsrv` в жизненный цикл сеанса**

После безопасной записи `config.yaml` один раз:

1. зарезервировать server/SSH порты;
2. создать ключ;
3. записать конфигурацию gateway;
4. запустить `ibsrv`;
5. дождаться `Stand-alone Server ready.`;
6. открыть SSH и `PlatformCommandSession`;
7. сохранить `processHandle`, `commandSession` и `userServiceDir` в замыкании.

Состояние сеанса должно определяться так:

```ts
let closed = false
const runtimeAlive = () => processHandle.isAlive() && commandSession.isAlive()

isAlive() {
  return !closed && runtimeAlive()
}
```

`loadPartialConfiguration` оставляет staging уникальным для пакета, но удаляет из `finally` только staging. Удалить из него остановку процесса и восстановление исходного `config.yaml`.

- [ ] **Step 4: Реализовать единое идемпотентное закрытие**

`close` и `cancel` используют одну функцию:

```ts
const closeSession = async () => {
  if (closed) return { stoppedOwnedProcess: false }
  await stopStandaloneAgent(commandSession, processHandle, dependencies.closeTimeoutMs)
  await dependencies.fileSystem.rm(configPath)
  closed = true
  return { stoppedOwnedProcess: true }
}
```

Если удаление `config.yaml` не удалось после остановки процесса, повторный `close` должен повторить очистку и не запускать процесс заново. Для этого хранить отдельные признаки `runtimeStopped` и `closed`, а не объявлять закрытие до успешной очистки.

- [ ] **Step 5: Получить GREEN для двух загрузок и закрытия**

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/standaloneServer.test.ts -t "reuses one autonomous process|closes|retry closing"
```

Expected: PASS.

- [ ] **Step 6: Написать падающие тесты выгрузки и расширений через тот же SSH**

Заменить старые ожидания отдельных процессов `ibcmd infobase config export` и `extension list` наблюдаемым договором:

```ts
it("exports and lists extensions through the resident autonomous command session", async () => {
  const fixture = createFixture({
    agentEnabled: true,
    extensionInfo: [extensionRecord("First")],
  })
  const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

  await session.loadPartialConfiguration?.(
    "/project/package.zip",
    ["Catalogs/Test.xml"],
    fixture.operationLog,
  )
  await session.exportConfiguration("/project/.nkdk/tmp/export", fixture.operationLog, "omit")
  await expect(session.listExtensions()).resolves.toEqual([extensionInfo("First")])

  expect(fixture.calls.filter((call) => call.startsWith("spawn ibsrv"))).toHaveLength(1)
  expect(fixture.calls).toContainEqual(expect.stringMatching(/^shell\.run config dump-config-to-files /u))
  expect(fixture.calls).toContain("shell.run config extensions properties get --all-extensions")
})

function extensionRecord(name: string) {
  return {
    name,
    version: "",
    active: "yes",
    purpose: "customization",
    "safe-mode": "yes",
    "security-profile-name": "",
    "unsafe-action-protection": "yes",
    "used-in-distributed-infobase": "no",
    scope: "infobase",
    "hash-sum": `${name}-hash`,
  }
}
```

Production changes caught: возврат subprocess-выгрузки или отдельного автономного процесса больше не удовлетворит ожидаемым командам одного SSH-сеанса.

- [ ] **Step 7: Запустить новые тесты и подтвердить RED**

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/standaloneServer.test.ts -t "resident autonomous command session"
```

Expected: FAIL — текущая выгрузка и список расширений выполняются через `processRuntime.run`.

- [ ] **Step 8: Перевести выгрузку и список расширений на SSH**

Для выгрузки использовать общий staging:

```ts
const stagingDir = join(userServiceDir, ".nkdk-export", randomUUID())
const resolvedOutputDir = await checkedOperationOutputDir(
  params.projectDir,
  outputDir,
  dependencies.fileSystem,
)
await prepareSessionStagingDirectory(stagingDir, dependencies.fileSystem)
await commandSession.run(
  buildDumpConfigurationCommand(
    relativeServicePath(userServiceDir, stagingDir),
    unresolvedReferences,
    extensionName,
  ),
  { signal, timeoutMs: dependencies.commandTimeoutMs, operationLog },
)
await publishSessionStagingDirectory(stagingDir, resolvedOutputDir, dependencies.fileSystem)
```

Для списка расширений вызвать `buildListDesignerExtensionsCommand()` и разобрать `result.extensionInfo` через `parseExtensionPropertyRecords`. Удалить неиспользуемые `buildStandaloneConfigExport`, `buildStandaloneListExtensions` и соответствующие тесты построителей.

Расширить `StandaloneServerDependencies.fileSystem` методами `realpath` и `rename`; тестовый переходник должен записывать эти действия и реально моделировать канонический путь.

- [ ] **Step 9: Проверить аварийные пути**

Добавить или обновить случаи:

- подтверждённая ошибка `config load-files` оставляет `session.isAlive() === true`;
- `session_timeout` и `operation_cancelled` приводят `cancel` к остановке процесса;
- смерть `processHandle` делает `isAlive() === false`;
- сбой запуска закрывает уже созданные SSH/process ресурсы;
- `close` второй раз возвращает `stoppedOwnedProcess: false`.

В `manager.test.ts` зафиксировать внешний признак повторного использования:

```ts
it("reuses a healthy autonomous session for consecutive partial loads", async () => {
  const fixture = createFixture()
  const manager = createPlatformSessionManager(fixture.dependencies)
  const params = loadParams({ mode: "standalone-server" })

  await expect(manager.loadPartialConfiguration(params)).resolves.toMatchObject({
    mode: "standalone-server",
    reusedConnection: false,
  })
  await expect(manager.loadPartialConfiguration(params)).resolves.toMatchObject({
    mode: "standalone-server",
    reusedConnection: true,
  })
  expect(fixture.created).toEqual(["/project:standalone-server"])
})
```

Run:
```bash
pnpm --filter @nkdk/platform exec vitest run --project unit src/sessions/standaloneServer.test.ts src/sessions/manager.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 2af987e2d
```

Expected: PASS; менеджер возвращает `reusedConnection: true` для второго автономного вызова и не оставляет активный таймер после отмены.

- [ ] **Step 10: Закоммитить постоянный автономный сеанс**

```bash
git add packages/platform/src/sessions/standaloneServer.ts packages/platform/src/sessions/standaloneServer.test.ts packages/platform/src/sessions/commands.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/manager.test.ts
git commit -m "perf: :zap: переиспользовать автономный сеанс"
```

---

### Task 3: Выполнять матричный e2e через один MCP-сеанс

**Files:**
- Modify: `e2e/partial-sync/mcp-session.ts`
- Modify: `e2e/partial-sync/mcp-session.test.ts`
- Modify: `e2e/partial-sync/steps.ts`
- Modify: `e2e/partial-sync/steps.test.ts`
- Modify: `e2e/partial-sync/scenario.ts`
- Modify: `e2e/partial-sync/scenario.test.ts`
- Modify: `e2e/partial-sync/partial-sync.external.test.ts`

**Interfaces:**
- Consumes: существующий `openScenarioMcpSession` и публичные MCP-инструменты.
- Produces:
  ```ts
  export type ScenarioMcpCallOptions = {
    readonly attemptLogDir?: string
  }

  export type ScenarioMcpSession = {
    call<T>(
      toolName: string,
      input: unknown,
      options?: ScenarioMcpCallOptions,
    ): Promise<T>
    close(): Promise<void>
  }

  export type PartialSyncSteps = {
    prepareBaseline(): Promise<void>
    executeOperation(operation: ScenarioOperation, progress: ScenarioProgress): Promise<void>
    verifyFinalState(): Promise<void>
  }
  ```

- [ ] **Step 1: Написать падающий тест перенаправления журналов одного сеанса**

В `mcp-session.test.ts` открыть один сеанс с исходным каталогом и выполнить два вызова с разными `attemptLogDir`. Проверить, что низкоуровневый сеанс создан и закрыт один раз, а файлы вызовов находятся в указанных каталогах.

```ts
await session.call("nkdk.validate_project", {}, { attemptLogDir: firstDir })
await session.call("nkdk.sync_to_infobase", {}, { attemptLogDir: secondDir })
await session.close()

await expect(readJson(join(firstDir, "001-nkdk.validate_project.request.json")))
  .resolves.toMatchObject({ name: "nkdk.validate_project" })
await expect(readJson(join(secondDir, "002-nkdk.sync_to_infobase.request.json")))
  .resolves.toMatchObject({ name: "nkdk.sync_to_infobase" })
expect(lowLevel.closeCalls).toBe(1)
```

- [ ] **Step 2: Подтвердить RED и реализовать каталог вызова**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/mcp-session.test.ts -t "different attempt log directories"
```

Expected before implementation: FAIL из-за отсутствующего третьего параметра поведения и файлов во втором каталоге.

В `call` выбирать `options?.attemptLogDir ?? params.attemptLogDir`, создавать выбранный каталог перед записью и сохранять глобальный `callNumber`, чтобы имена не сталкивались.

- [ ] **Step 3: Написать падающий тест одного сеанса на весь сценарий**

Изменить fixture `steps.test.ts`: создать один fake `ScenarioMcpSession`, передать его в `createPartialSyncSteps({ workspace, session })`, выполнить две операции и итоговую проверку. Ожидать:

```ts
expect(fixture.openSessionCalls).toBe(1)
const verificationProjectDir = join(fixture.workspace.verificationDir, "current")
expect(fixture.calls.filter(([name]) => name === "nkdk.close_platform_connection"))
  .toEqual([
    ["nkdk.close_platform_connection", { projectDir: fixture.workspace.projectDir }],
    ["nkdk.close_platform_connection", { projectDir: verificationProjectDir }],
  ])
```

Между двумя парами `sync_to_infobase` не должно быть `close_platform_connection` или `import_from_infobase`.

В `scenario.test.ts` ожидать `verify-final` только после последней опубликованной операции; при ошибке операции `verify-final` отсутствует.

- [ ] **Step 4: Запустить тесты и подтвердить RED**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/scenario.test.ts
```

Expected: FAIL — текущие шаги открывают и закрывают MCP/платформенное соединение для каждой операции и проверяют дерево внутри `executeOperation`.

- [ ] **Step 5: Передать готовый сеанс в шаги**

Изменить параметры:

```ts
type CreatePartialSyncStepsParams = {
  readonly workspace: ScenarioWorkspace
  readonly session: ScenarioMcpSession
}
```

Удалить `openMcpSession` из `PartialSyncStepDependencies`. `prepareBaseline` только создаёт базу, записывает настройки и выполняет `importCf` в основной проект. `executeOperation` выполняет изменение, валидацию и `syncAndExpectStable`; он не закрывает платформу и не делает полную выгрузку.

Добавить `verifyFinalState`, который:

1. вызывает `nkdk.close_platform_connection` для основного проекта;
2. подготавливает проект проверки;
3. выполняет `importCf`;
4. сравнивает деревья;
5. в `finally` закрывает проверочное соединение.

Каждый вызов передаёт соответствующий `attemptLogDir`, сохраняя понятную диагностику операции.

- [ ] **Step 6: Открыть MCP-сеанс один раз во внешнем тесте**

В `partial-sync.external.test.ts`:

```ts
const session = await openScenarioMcpSession({
  attemptLogDir: join(workspace.logsDir, `${randomUUID()}-scenario`),
})
try {
  await runPartialSyncScenario({
    workspace,
    plan,
    planHash,
    steps: createPartialSyncSteps({ workspace, session }),
  })
} finally {
  await session.close()
}
```

`runPartialSyncScenario` вызывает `await steps.verifyFinalState()` после цикла, включая случай, когда план уже полностью завершён и была только восстановлена контрольная точка.

- [ ] **Step 7: Получить GREEN и проверить типы**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/mcp-session.test.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/scenario.test.ts
pnpm exec tsc --noEmit -p e2e/tsconfig.json
pnpm duplicates -- --base 2af987e2d
```

Expected: PASS; fake low-level MCP закрыт один раз, а порядок вызовов не содержит промежуточного закрытия.

- [ ] **Step 8: Закоммитить единый MCP-сеанс**

```bash
git add e2e/partial-sync/mcp-session.ts e2e/partial-sync/mcp-session.test.ts e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/scenario.ts e2e/partial-sync/scenario.test.ts e2e/partial-sync/partial-sync.external.test.ts
git commit -m "perf: :zap: переиспользовать MCP-сеанс в e2e"
```

---

### Task 4: Исключить временные сеансы из копии и параметризовать режим

**Files:**
- Modify: `e2e/partial-sync/checkpoints.ts`
- Modify: `e2e/partial-sync/checkpoints.test.ts`
- Modify: `e2e/partial-sync/run.ts`
- Modify: `e2e/partial-sync/run.test.ts`
- Modify: `e2e/partial-sync/steps.ts`
- Modify: `e2e/partial-sync/steps.test.ts`
- Modify: `e2e/partial-sync/partial-sync.external.test.ts`

**Interfaces:**
- Consumes: `PlatformSessionMode` из `@nkdk/platform`, `publishCheckpoint`, `restoreCheckpoint`, `createPartialSyncSteps` из Task 3.
- Produces:
  ```ts
  export type PartialSyncArgs = {
    readonly root: string
    readonly reset: boolean
    readonly mode: "designer-agent" | "standalone-server"
  }

  type CreatePartialSyncStepsParams = {
    readonly workspace: ScenarioWorkspace
    readonly session: ScenarioMcpSession
    readonly mode: "designer-agent" | "standalone-server"
  }
  ```

- [ ] **Step 1: Написать падающий тест исключения временного состояния**

В fixture контрольных точек создать:

```ts
await writeFile(join(
  fixture.workspace.projectDir,
  ".nkdk/platform-sessions/standalone/server-data/lock.pid",
), "123")
await writeFile(join(
  fixture.workspace.projectDir,
  ".nkdk/tmp/sync-to-infobase/attempt/platform.log",
), "temporary")
```

После `publishCheckpoint` проверить отсутствие обоих путей в `current/project`, затем восстановить и проверить, что они не появились в рабочем проекте.

Production changes caught: обычное рекурсивное копирование снова сохранит PID и незавершённую попытку.

- [ ] **Step 2: Подтвердить RED и реализовать очистку временной копии**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/checkpoints.test.ts -t "excludes live platform session state"
```

Expected: FAIL — оба файла присутствуют в контрольной точке.

Сразу после копирования проекта в `temporaryDir` удалить только:

```ts
for (const path of [
  "project/.nkdk/platform-sessions",
  "project/.nkdk/tmp",
]) {
  await dependencies.remove(join(temporaryDir, ...path.split("/")), {
    recursive: true,
    force: true,
  })
}
```

Удаление происходит до `buildManifest`, поэтому manifest и SHA-256 описывают уже очищенную копию. Другие `.nkdk`-данные, включая настройки и индекс конфигурации, сохраняются.

- [ ] **Step 3: Написать падающие тесты аргумента режима**

В `run.test.ts` проверить литеральные результаты:

```ts
expect(parsePartialSyncArgs([
  "--root", "/workspace", "--mode", "designer-agent",
])).toEqual({ root: "/workspace", reset: false, mode: "designer-agent" })

expect(parsePartialSyncArgs([
  "--root", "/workspace",
])).toEqual({ root: "/workspace", reset: false, mode: "standalone-server" })
```

Неизвестный и повторный `--mode` должны отклоняться. `runPartialSyncCli` передаёт `NKDK_PARTIAL_SYNC_MODE` дочернему Vitest.

- [ ] **Step 4: Подтвердить RED и реализовать параметр режима**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/run.test.ts
```

Expected before implementation: FAIL — `--mode` неизвестен и поле отсутствует.

Добавить разбор двух допустимых значений, default `standalone-server` и переменную окружения. В `partial-sync.external.test.ts` проверить значение окружения до запуска.

`writeProjectSettings` принимает mode и пишет точное значение:

```ts
async function writeProjectSettings(
  projectDir: string,
  baseDir: string,
  mode: "designer-agent" | "standalone-server",
): Promise<void> {
  // ...
  `      mode: ${mode}`
}
```

- [ ] **Step 5: Проверить весь слой e2e**

Run:
```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/run.test.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/scenario.test.ts e2e/partial-sync/mcp-session.test.ts
pnpm exec tsc --noEmit -p e2e/tsconfig.json
pnpm duplicates -- --base 2af987e2d
```

Expected: PASS; режим по умолчанию остаётся автономным.

- [ ] **Step 6: Закоммитить копии и параметр режима**

```bash
git add e2e/partial-sync/checkpoints.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/run.ts e2e/partial-sync/run.test.ts e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts e2e/partial-sync/partial-sync.external.test.ts
git commit -m "perf: :zap: ускорить возобновляемый partial e2e"
```

---

### Task 5: Проверить интеграцию и реальные сеансы

**Files:**
- Results: `/private/tmp/nkdk-persistent-session-e2e-agent`
- Results: `/private/tmp/nkdk-persistent-session-e2e-standalone`

**Interfaces:**
- Consumes: `openScenarioMcpSession`, `nkdk.sync_to_infobase`, `nkdk.import_from_infobase`, `nkdk.close_platform_connection`; две изолированные базы в указанных каталогах `/private/tmp`.
- Produces: доказательство `reusedConnection: true`, отсутствия второго `ibsrv`, успешного `synchronized` → `unchanged` и замеры первого/второго пакета.

- [ ] **Step 1: Выполнить полную локальную проверку перед реальными базами**

Run:
```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 2af987e2d
```

Expected: все команды PASS. LMDB-команды выполнять вне песочницы согласно `AGENTS.md`.

- [ ] **Step 2: Запустить два изменения через агентный режим**

Использовать отдельный каталог базы и один MCP-сеанс. Последовательно изменить один `.bsl` и одно свойство существующего объекта. Для каждого вызова сохранить JSON и платформенный журнал.

Проверить литеральные поля первого и второго изменённого пакета:

```json
{
  "ok": true,
  "status": "synchronized",
  "mode": "designer-agent",
  "reusedConnection": true,
  "finalizeStatus": "published"
}
```

Первый пакет может иметь `reusedConnection: false`; второй обязан иметь `true`. После каждого изменённого пакета следующий вызов обязан вернуть `status: "unchanged"`.

- [ ] **Step 3: Запустить два изменения через автономный режим**

Повторить тот же класс изменений в отдельной файловой базе с `mode: standalone-server`. По платформенному журналу и списку процессов подтвердить один запуск `ibsrv`. Второй изменённый пакет обязан вернуть:

```json
{
  "ok": true,
  "status": "synchronized",
  "mode": "standalone-server",
  "reusedConnection": true,
  "finalizeStatus": "published"
}
```

- [ ] **Step 4: Проверить фактическое применение и время**

После двух пакетов вызвать `nkdk.close_platform_connection`, импортировать конфигурацию базы в отдельный проект и сравнить YAML-деревья. Зафиксировать для каждого режима:

- время первого изменённого пакета;
- время второго изменённого пакета;
- время платформенной части;
- время `load-files + update-db-cfg`;
- время повторного `unchanged`.

Критерий: второй изменённый пакет не запускает новый агент/`ibsrv` и становится быстрее минимум на наблюдаемое время запуска сеанса. Это диагностический критерий, а не нестабильный порог автоматического теста.

- [ ] **Step 5: Проверить чистоту результата**

Run:
```bash
git status --short
git diff --check
```

Expected: рабочее дерево чистое. Если реальные проверки потребовали исправления, повторить затронутые целевые и полные проверки, затем создать отдельный коммит:
`fix: :bug: завершить переиспользование сеансов`, добавив только исправленные
файлы Tasks 1–4 и падающий тест, который воспроизводит найденный дефект.
