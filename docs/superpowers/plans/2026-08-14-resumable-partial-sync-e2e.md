# Возобновляемая проверка частичной синхронизации — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельно запускаемый сценарий, который через публичный MCP проверяет добавление справочника и его реквизита в файловой информационной базе и продолжает работу с последней проверенной копии после сбоя.

**Architecture:** Публичный `nkdk.import_from_infobase` получает выбор `cf` или одного `cfe`; платформенный сеанс выгружает выбранный компонент штатной командой. В `e2e/partial-sync` отдельные модули владеют MCP stdio-сеансом, подготовкой базы, безопасным состоянием/контрольными точками и этапами сценария. Реальный Vitest-файл запускается только через обёртку `pnpm test:partial-sync -- --root <каталог>` и исключён из общих тестов.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, MCP SDK, YAML, файловая база, агент Конфигуратора.

## Global Constraints

- Все изменения выполнять в `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test` на ветке `codex/partial-sync-resumable-test`.
- База для ручного запуска: `/Users/nikita/Базы 1С/temp_test`; путь передавать только как один аргумент `--root`.
- Не изменять существующие XML-фикстуры.
- Проверяемые import, validation и partial sync выполнять только через настоящий MCP stdio-сервер.
- Прямые команды платформы разрешены только для создания/первичной загрузки тестовой базы; прямой доступ к файловой системе — только для подготовки и контрольных точек.
- Не добавлять `!xml`, новые правила fromXML/toXML/fromYAML/toYAML или поля общих типов правил.
- Реальный сценарий не включать в `pnpm test`, `pnpm test:e2e` или CI.
- Production-код писать только после правильно падающего теста; после каждого слоя запускать `pnpm duplicates -- --base 39310b80d`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и повторную проверку дублей.
- Исходный `pnpm test` функционально прошёл 213 тестов `@nkdk/platform`, но один запуск остановился на нестабильном лимите длительности 65 мс; не считать одиночный замер регрессией без трёх прогонов профиля.

---

## Структура файлов

- `packages/platform/src/sessions/types.ts` — передаёт имя выбранного расширения через публичный договор платформенного экспорта.
- `packages/platform/src/sessions/commands.ts` — строит команды выгрузки `cf` или расширения без shell.
- `packages/platform/src/sessions/manager.ts` — передаёт выбор компонента в конкретный сеанс.
- `packages/platform/src/sessions/designerAgent.ts` — выгружает выбранное расширение через агентный режим.
- `packages/platform/src/sessions/standaloneServer.ts` — сохраняет тот же договор для offline-режима.
- Соседние `*.test.ts` в `packages/platform/src/sessions` — защищают команды и передачу параметра.
- `packages/mcp/src/contracts/configurationComponentPath.ts` — единая строгая схема `cf | cfe/<Имя>` для import/sync.
- `packages/mcp/src/contracts/importFromInfobase.ts` и тест — добавляют `componentPath` во вход MCP.
- `packages/mcp/src/contracts/syncToInfobase.ts` — переиспользует общую схему без изменения поведения.
- `packages/mcp/src/services/importFromInfobase.ts` и тест — выбирают цель, имя расширения и XML → YAML импорт.
- `packages/mcp/src/tools/registerTools.ts` и тест — публикуют обновлённое описание инструмента.
- `e2e/partial-sync/workspace.ts` и тест — проверяют корень, состояние и безопасные управляемые пути.
- `e2e/partial-sync/checkpoints.ts` и тест — публикуют, проверяют и восстанавливают полные контрольные точки.
- `e2e/partial-sync/mcp-session.ts` и тест — вызывают настоящий MCP stdio-сервер и сохраняют запросы, ответы и stderr.
- `e2e/partial-sync/platform-fixture.ts` и тест — создают и первоначально заполняют файловую базу.
- `e2e/partial-sync/scenario.ts` и тест — координируют три идемпотентных этапа через зависимости.
- `e2e/partial-sync/steps.ts` и тест — выполняют реальные MCP-вызовы, изменения YAML и сравнения.
- `e2e/partial-sync/run.ts` и тест — разбирают `--root` и запускают отдельный Vitest-процесс.
- `e2e/partial-sync/partial-sync.external.test.ts` — единственный тест, требующий установленную платформу.
- `e2e/partial-sync/vitest.config.ts` — включает только внешний сценарий.
- `e2e/vitest.config.ts` — явно исключает внешний сценарий.
- `package.json` — добавляет `test:partial-sync`.

---

### Task 1: Выгрузка выбранного расширения платформенным сеансом

**Files:**
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`

**Interfaces:**
- Produces: `ExportConfigurationParams.extensionName?: string`.
- Produces: `PlatformSession.exportConfiguration(outputDir, log, unresolvedReferences, signal?, extensionName?)`.
- Produces: `buildDumpConfigurationCommand(outputDir, unresolvedReferences, extensionName?)`.
- Produces: `buildStandaloneConfigExport({... extensionName?: string})`.

- [ ] **Step 1: Расширить существующий тест построителей команд**

Добавить один случай, который одновременно защищает оба режима:

```ts
it("выбирает одно расширение при выгрузке в обоих режимах", () => {
  expect(buildDumpConfigurationCommand("/xml", "include", "Расширение_All"))
    .toBe('config dump-config-to-files --dir="/xml" --format=hierarchical --extension="Расширение_All"')
  expect(buildStandaloneConfigExport({
    ibcmdPath: "ibcmd",
    configPath: "/session/config.yaml",
    outputDir: "/xml",
    unresolvedReferences: "include",
    extensionName: "Расширение_All",
  }).args).toContain("--extension=Расширение_All")
})
```

Дополнить существующий `it.each` небезопасным именем расширения для интерактивной команды.

- [ ] **Step 2: Запустить тест команд и увидеть ожидаемое падение типов/ожидания**

Run: `pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts`

Expected: FAIL, потому что построители ещё не принимают `extensionName`.

- [ ] **Step 3: Минимально расширить построители и типы**

Использовать существующее экранирование `interactiveValue`:

```ts
export function buildDumpConfigurationCommand(
  outputDir: string,
  unresolvedReferences: UnresolvedReferencesMode,
  extensionName?: string,
): string {
  return [
    `config dump-config-to-files --dir="${interactiveValue(outputDir)}"`,
    "--format=hierarchical",
    ...(unresolvedReferences === "omit" ? ["--ignore-unresolved-refs"] : []),
    ...(extensionName === undefined
      ? []
      : [`--extension="${interactiveValue(extensionName)}"`]),
  ].join(" ")
}
```

В `buildStandaloneConfigExport` добавить `--extension=<имя>` как отдельный аргумент массива. В `types.ts` добавить необязательное поле и последний необязательный позиционный параметр сеанса, сохранив все прежние вызовы совместимыми.

- [ ] **Step 4: Проверить передачу параметра через manager и оба адаптера**

Усилить существующие тесты так, чтобы `manager.exportConfiguration({... extensionName: "Расширение_All" })` привёл к:

```ts
session.exportConfiguration(
  "/xml",
  expect.anything(),
  "include",
  undefined,
  "Расширение_All",
)
```

В тестах адаптеров проверить итоговую SSH-команду и аргументы `ibcmd`.

- [ ] **Step 5: Запустить весь слой платформы**

Run: `pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/manager.test.ts src/sessions/designerAgent.test.ts src/sessions/standaloneServer.test.ts`

Expected: PASS.

- [ ] **Step 6: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base 39310b80d
git add packages/platform/src/sessions
git commit -m "feat: :sparkles: выгружать выбранное расширение"
```

---

### Task 2: Импорт `cfe` через публичный MCP

**Files:**
- Create: `packages/mcp/src/contracts/configurationComponentPath.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/contracts/syncToInfobase.ts`
- Modify: `packages/mcp/src/services/importFromInfobase.ts`
- Modify: `packages/mcp/src/services/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`

**Interfaces:**
- Produces: `configurationComponentPathSchema` for `cf | cfe/<Имя>`.
- Produces: `ImportFromInfobaseInput.componentPath?: "cf" | `cfe/${string}``.
- Consumes: `ExportConfigurationParams.extensionName` from Task 1.

- [ ] **Step 1: Написать падающие проверки контракта и сервиса**

Контракт должен принимать компонент и отклонять выход из каталога:

```ts
expect(inputSchema.parse({
  projectDir: "/project",
  componentPath: "cfe/Расширение_All",
  allowWrite: true,
})).toMatchObject({ componentPath: "cfe/Расширение_All" })
expect(inputSchema.safeParse({ projectDir: "/project", componentPath: "cfe/.." }).success)
  .toBe(false)
```

Сервисный тест должен ожидать:

```ts
expect(fixture.calls).toContain("resolveTarget /project cfe/Расширение_All")
expect(fixture.exportedSettings).toMatchObject({ extensionName: "Расширение_All" })
expect(fixture.importedOutputDir).toBe("/project/cfe/Расширение_All")
```

- [ ] **Step 2: Запустить целевые тесты и подтвердить RED**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/services/importFromInfobase.test.ts src/tools/registerTools.test.ts`

Expected: FAIL на неизвестном `componentPath` и отсутствии `extensionName`.

- [ ] **Step 3: Реализовать общую схему и выбор компонента**

Создать схему:

```ts
export const configurationComponentPathSchema = z.string().refine(
  (value): value is "cf" | `cfe/${string}` =>
    value === "cf" || /^cfe\/[^/\\.][^/\\]*$/u.test(value),
  "Ожидался путь cf или cfe/<Имя>",
)
```

В сервисе определить компонент до проверки пустоты:

```ts
const requestedComponentPath = input.componentPath ?? "cf"
const component = dependencies.resolveTarget({
  projectDir: settingsRead.projectDir,
  componentPath: requestedComponentPath,
  createIfMissing: true,
})
const extensionName = component.componentPath === "cf"
  ? undefined
  : component.componentPath.slice("cfe/".length)
```

Передать `extensionName` в `exportConfiguration`, а `component.componentDir` — в `importXml.outputDir`. Для `syncToInfobase` заменить локальную копию схемы импортом общей.

- [ ] **Step 4: Обновить публичное описание инструмента**

Описание должно явно говорить: значение по умолчанию `cf`, расширение выбирается через `cfe/<Имя>`, цель отсутствует или пуста, `cf` импортируется первым.

- [ ] **Step 5: Запустить MCP-тесты и проверки типов**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/contracts/syncToInfobase.test.ts src/services/importFromInfobase.test.ts src/tools/registerTools.test.ts
pnpm --filter @nkdk/mcp exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base 39310b80d
git add packages/mcp/src/contracts packages/mcp/src/services/importFromInfobase.ts packages/mcp/src/services/importFromInfobase.test.ts packages/mcp/src/tools
git commit -m "feat: :sparkles: импортировать расширение из базы"
```

---

### Task 3: Безопасный каталог сценария и контрольные точки

**Files:**
- Create: `e2e/partial-sync/workspace.ts`
- Create: `e2e/partial-sync/workspace.test.ts`
- Create: `e2e/partial-sync/checkpoints.ts`
- Create: `e2e/partial-sync/checkpoints.test.ts`

**Interfaces:**
- Produces: `StageId = "01-baseline" | "02-catalog" | "03-attribute"`.
- Produces: `ScenarioState { version: 1; scenario: "partial-sync-catalog-attribute"; completedStage: StageId | null; checkpoint: string | null }`.
- Produces: `openScenarioWorkspace(root: string): Promise<ScenarioWorkspace>`.
- Produces: `publishCheckpoint(workspace, stage): Promise<ScenarioState>`.
- Produces: `restoreCheckpoint(workspace, state): Promise<void>`.

- [ ] **Step 1: Написать тесты безопасности корня**

Проверить одним `it.each`, что отклоняются относительный путь, `/`, домашний каталог, корень репозитория, чужой непустой каталог и symlink. Отдельный тест должен принять пустой каталог и создать начальное состояние:

```ts
expect(await readState(root)).toEqual({
  version: 1,
  scenario: "partial-sync-catalog-attribute",
  completedStage: null,
  checkpoint: null,
})
```

- [ ] **Step 2: Запустить workspace-тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать канонические пути и атомарный state**

`ScenarioWorkspace` должен содержать абсолютные `root`, `baseDir`, `dataDir`, `projectDir`, `checkpointsDir`, `verificationDir`, `logsDir`, `statePath`. Начальное состояние писать как `state.json.tmp` → `rename`, не следовать symlink и никогда не очищать неизвестный корень.

- [ ] **Step 4: Написать падающие тесты контрольных точек**

Проверить три самостоятельных договора на временном дереве:

```ts
it("публикует base и project только после проверки manifest", async () => {
  const fixture = await checkpointFixture()
  await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "base")
  await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "project")

  const state = await publishCheckpoint(fixture.workspace, "01-baseline")

  expect(state.completedStage).toBe("01-baseline")
  await expect(readFile(join(
    fixture.workspace.checkpointsDir,
    "01-baseline/manifest.json",
  ), "utf8")).resolves.toContain("base/1Cv8.1CD")
})

it("не меняет state при ошибке копирования", async () => {
  const fixture = await checkpointFixture({ failCopy: true })
  const before = await readFile(fixture.workspace.statePath, "utf8")

  await expect(publishCheckpoint(fixture.workspace, "01-baseline", fixture.dependencies))
    .rejects.toThrow("planned copy failure")

  await expect(readFile(fixture.workspace.statePath, "utf8")).resolves.toBe(before)
})

it("восстанавливает обе рабочие копии из последней точки", async () => {
  const fixture = await checkpointFixture()
  await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "saved base")
  await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "saved project")
  const state = await publishCheckpoint(fixture.workspace, "01-baseline")
  await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "broken base")
  await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "broken project")

  await restoreCheckpoint(fixture.workspace, state)

  await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
    .resolves.toBe("saved base")
  await expect(readFile(join(fixture.workspace.projectDir, "cf.yaml"), "utf8"))
    .resolves.toBe("saved project")
})
```

`checkpointFixture()` создаёт через `mkdtemp` безопасный workspace и возвращает
реальные зависимости по умолчанию; вариант `failCopy` заменяет только функцию
копирования на `async () => { throw new Error("planned copy failure") }`.

Дополнительно испортить один файл checkpoint и ожидать отказ по SHA-256 без изменения рабочих каталогов.

- [ ] **Step 5: Реализовать manifest и восстановление**

Manifest хранит только переносимые пути и хэши:

```ts
interface CheckpointManifest {
  readonly version: 1
  readonly stage: StageId
  readonly files: Readonly<Record<`base/${string}` | `project/${string}`, string>>
}
```

Обходить каталоги в стабильном порядке, отклонять symlink, считать SHA-256 сырых байтов. Сначала копировать в `checkpoints/.<stage>-<uuid>.tmp`, проверить manifest, переименовать, затем атомарно заменить `state.json`. При восстановлении сначала проверить всю точку, подготовить временные рабочие копии и лишь потом заменить управляемые каталоги.

- [ ] **Step 6: Запустить тесты слоя и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/checkpoints.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/workspace.ts e2e/partial-sync/workspace.test.ts e2e/partial-sync/checkpoints.ts e2e/partial-sync/checkpoints.test.ts
git commit -m "test: :white_check_mark: сохранять контрольные точки sync"
```

---

### Task 4: MCP stdio-сеанс сценария

**Files:**
- Create: `e2e/partial-sync/mcp-session.ts`
- Create: `e2e/partial-sync/mcp-session.test.ts`

**Interfaces:**
- Produces: `ScenarioMcpSession.call<T>(toolName: string, input: unknown): Promise<T>`.
- Produces: `ScenarioMcpSession.close(): Promise<void>`.
- Produces: `openScenarioMcpSession({ attemptLogDir }): Promise<ScenarioMcpSession>`.
- Consumes: `.agents/tools/mcp/call.mjs#createMcpToolSession`.

- [ ] **Step 1: Написать тест наблюдаемого протокола и журналов**

С подменённым низкоуровневым сеансом выполнить два вызова и проверить файлы:

```text
logs/<attempt>/001-nkdk.validate_project.request.json
logs/<attempt>/001-nkdk.validate_project.response.json
logs/<attempt>/001-nkdk.validate_project.server.stderr.log
```

Ответ `{ ok: false, code, message }` и MCP `isError` должны приводить к исключению с названием инструмента и путём response, но без потери исходного JSON.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/mcp-session.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать тонкую обёртку над существующим MCP-клиентом**

Загрузить `createMcpToolSession` динамически по URL, чтобы не копировать запуск MCP SDK. Обёртка не должна импортировать сервисы MCP. Перед каждым вызовом писать request; после ответа — полный result и structured payload; stderr забирать после каждого вызова и при закрытии.

- [ ] **Step 4: Проверить тест и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/mcp-session.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/mcp-session.ts e2e/partial-sync/mcp-session.test.ts
git commit -m "test: :white_check_mark: добавить MCP-сеанс partial sync"
```

---

### Task 5: Первичная подготовка файловой базы

**Files:**
- Create: `e2e/partial-sync/platform-fixture.ts`
- Create: `e2e/partial-sync/platform-fixture.test.ts`

**Interfaces:**
- Produces: `prepareInfobaseFixture({ baseDir, dataDir, logsDir, cfXmlDir, extensionXmlDir, extensionName }): Promise<void>`.
- Consumes: `findPlatform()` из `@nkdk/platform`, но не внутренние сеансы.

- [ ] **Step 1: Написать падающий тест массива аргументов с пробелами**

Подменить поиск платформы и запуск процесса, передать `/Users/nikita/Базы 1С/temp_test/base`, затем проверить три последовательные операции: создание базы, полная загрузка `cf`, полная загрузка `Расширение_All`. Каждый запуск получает `command` и `args[]`, shell не используется.

Ключевые аргументы должны оставаться отдельными элементами:

```ts
expect(create.args).toContain('File="/Users/nikita/Базы 1С/temp_test/base";')
expect(loadExtension.args).toEqual(expect.arrayContaining([
  "/LoadConfigFromFiles",
  extensionXmlDir,
  "/Extension",
  "Расширение_All",
]))
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/platform-fixture.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать подготовку и безопасную диагностику**

Найти `enterprisePath`, потребовать версию `8.3.27`, запускать batch-команды с отдельным `/Out` на каждый шаг. При ненулевом коде вернуть ошибку с именем шага и путём журнала. Удалять незавершённые `base/` и `data/` разрешено только вызывающему координатору до первой контрольной точки.

- [ ] **Step 4: Покрыть отсутствие компонента и сбой второго шага**

Один `it.each` должен проверить `platform_not_found`, отсутствие `enterprisePath` и ненулевой exit code без запуска последующих команд.

- [ ] **Step 5: Запустить тесты и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/platform-fixture.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/platform-fixture.ts e2e/partial-sync/platform-fixture.test.ts
git commit -m "test: :white_check_mark: подготовить базу partial sync"
```

---

### Task 6: Возобновляемый координатор этапов

**Files:**
- Create: `e2e/partial-sync/scenario.ts`
- Create: `e2e/partial-sync/scenario.test.ts`

**Interfaces:**
- Produces: `ScenarioStages { baseline(); catalog(); attribute() }`.
- Produces: `runPartialSyncScenario(workspace, stages, dependencies?): Promise<void>`.
- Consumes: `ScenarioState`, `restoreCheckpoint`, `publishCheckpoint`.
- Consumes: три зависимости этапов `baseline`, `catalog`, `attribute`.

- [ ] **Step 1: Написать таблицу переходов**

Один параметризованный тест защищает все состояния:

```ts
it.each([
  [null, ["baseline", "catalog", "attribute"]],
  ["01-baseline", ["catalog", "attribute"]],
  ["02-catalog", ["attribute"]],
  ["03-attribute", []],
] as const)("продолжает после %s", async (completedStage, expected) => {
  const calls: string[] = []
  const stages = {
    async baseline() { calls.push("baseline") },
    async catalog() { calls.push("catalog") },
    async attribute() { calls.push("attribute") },
  }
  const dependencies = {
    async readState() {
      return scenarioState(completedStage)
    },
    async restoreCheckpoint() {
      calls.push("restore")
    },
    async publishCheckpoint(_workspace: ScenarioWorkspace, stage: StageId) {
      calls.push(`publish:${stage}`)
      return scenarioState(stage)
    },
  }

  await runPartialSyncScenario(workspace, stages, dependencies)

  expect(calls.filter((call) => !call.startsWith("publish:") && call !== "restore"))
    .toEqual(expected)
})
```

`scenarioState(stage)` строит валидное состояние версии 1, а `workspace` —
обычный тестовый `ScenarioWorkspace`; оба помощника объявить в этом же тесте.

Каждый выполненный этап должен немедленно публиковать соответствующую точку. До старта следующего этапа активная база и проект должны быть восстановлены из последней точки.

- [ ] **Step 2: Добавить тест сбоя между этапами**

Искусственно уронить `catalog`, убедиться, что состояние осталось
`01-baseline`; второй запуск начинает с восстановления `01-baseline` и снова
вызывает `catalog`, не повторяя `baseline`.

- [ ] **Step 3: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts`

Expected: FAIL, координатор отсутствует.

- [ ] **Step 4: Реализовать минимальный координатор без платформенных деталей**

Хранить декларативную таблицу:

```ts
const stages = [
  { id: "01-baseline", run: dependencies.baseline },
  { id: "02-catalog", run: dependencies.catalog },
  { id: "03-attribute", run: dependencies.attribute },
] as const
```

Координатор читает state, восстанавливает точку, выбирает хвост массива, вызывает этап и публикует его точку. Он не знает имён MCP-инструментов и YAML-полей.

- [ ] **Step 5: Запустить тесты и создать коммит**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/scenario.test.ts
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/scenario.ts e2e/partial-sync/scenario.test.ts
git commit -m "test: :white_check_mark: возобновлять этапы partial sync"
```

---

### Task 7: Реальные этапы через публичный MCP

**Files:**
- Create: `e2e/partial-sync/steps.ts`
- Create: `e2e/partial-sync/steps.test.ts`

**Interfaces:**
- Produces: `createPartialSyncSteps(params): ScenarioStages`.
- Consumes: `prepareInfobaseFixture`, `openScenarioMcpSession`, `compareFileTrees`.

- [ ] **Step 1: Написать тест базового этапа с подменённым MCP-сеансом**

Ожидать строгий порядок публичных вызовов:

```ts
expect(calls).toEqual([
  ["nkdk.list_infobase_extensions", { projectDir }],
  ["nkdk.import_from_infobase", { projectDir, componentPath: "cf", allowWrite: true }],
  ["nkdk.import_from_infobase", {
    projectDir,
    componentPath: "cfe/Расширение_All",
    allowWrite: true,
  }],
  ["nkdk.close_platform_connection", { projectDir }],
])
```

Проверить, что `.nkdk/project.yaml` содержит файловую строку подключения и `operations.import.mode: designer-agent`, а сравнение вызывается отдельно для `cf` и расширения.

- [ ] **Step 2: Написать тесты двух изменений**

После этапа справочника файл должен быть ровно:

```yaml
Синоним: Проверка частичной синхронизации
```

После этапа реквизита:

```yaml
Синоним: Проверка частичной синхронизации
Реквизиты:
  ТестоваяСтрока:
    Тип: Строка(20)
```

Для каждого этапа ожидать `validate_project`, первый `sync_to_infobase` со
`synchronized`, второй с `unchanged`, два импорта в чистый verification-проект
и две успешные сверки. Ошибка validation или различие деревьев должно оборвать
этап до публикации точки.

- [ ] **Step 3: Запустить тесты и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/steps.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 4: Реализовать общие помощники без дублирования этапов**

Выделить внутри модуля:

```ts
async function importComponents(session, projectDir): Promise<void>
async function expectSuccessfulValidation(session, projectDir): Promise<void>
async function syncAndExpectStable(session, projectDir): Promise<void>
async function verifyComponents(params): Promise<void>
```

Каждый verification-проект пересоздавать пустым, записывать только настройки,
импортировать сначала `cf`, затем расширение. Сравнивать `verification/<stage>/cf`
с рабочим `project/cf`, а расширение — с
`e2e/fixtures/nkdk/cfe/Расширение_All`.

- [ ] **Step 5: Запустить все обычные e2e-тесты и создать коммит**

```bash
pnpm test:e2e
pnpm duplicates -- --base 39310b80d
git add e2e/partial-sync/steps.ts e2e/partial-sync/steps.test.ts
git commit -m "test: :white_check_mark: проверить два шага partial sync"
```

---

### Task 8: Отдельная команда реального сценария

**Files:**
- Create: `e2e/partial-sync/run.ts`
- Create: `e2e/partial-sync/run.test.ts`
- Create: `e2e/partial-sync/partial-sync.external.test.ts`
- Create: `e2e/partial-sync/vitest.config.ts`
- Modify: `e2e/vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: CLI `pnpm test:partial-sync -- --root <absolute-directory>`.
- Produces: env `NKDK_PARTIAL_SYNC_ROOT` только для дочернего Vitest.

- [ ] **Step 1: Написать тест разбора CLI и пути с пробелами**

```ts
expect(parsePartialSyncArgs([
  "--root",
  "/Users/nikita/Базы 1С/temp_test",
])).toEqual({ root: "/Users/nikita/Базы 1С/temp_test" })
```

Проверить отсутствие/повтор `--root`, относительный путь и неизвестный аргумент.
Подменённый запуск дочернего процесса должен получить путь только через env, а
не как опцию Vitest.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/run.test.ts`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать обёртку и внешний тест**

`run.ts` разрешает `vitest/package.json` через `createRequire`, запускает
`vitest.mjs run --config e2e/partial-sync/vitest.config.ts` через
`process.execPath`, наследует stdio и передаёт `NKDK_PARTIAL_SYNC_ROOT`.

Внешний тест не использует `describe.skip`:

```ts
it("синхронизирует справочник и реквизит с продолжением", async () => {
  const root = process.env["NKDK_PARTIAL_SYNC_ROOT"]
  if (root === undefined) throw new Error("NKDK_PARTIAL_SYNC_ROOT не задан")
  const workspace = await openScenarioWorkspace(root)
  await runPartialSyncScenario(workspace, createPartialSyncSteps({ workspace }))
}, 60 * 60 * 1000)
```

- [ ] **Step 4: Изолировать внешний файл от общих тестов**

В отдельной конфигурации включить только
`e2e/partial-sync/partial-sync.external.test.ts`. В общей добавить этот путь в
`exclude`. В `package.json`:

```json
"test:partial-sync": "tsx e2e/partial-sync/run.ts"
```

- [ ] **Step 5: Доказать изоляцию без запуска внешнего сценария**

```bash
pnpm exec vitest run --config e2e/vitest.config.ts e2e/partial-sync/run.test.ts
pnpm test:e2e
pnpm type-check
```

Expected: обычные e2e проходят; вывод не содержит
`синхронизирует справочник и реквизит с продолжением`.

Не запускать `pnpm test:partial-sync` в этой задаче без отдельного решения о
ручном прогоне.

- [ ] **Step 6: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base 39310b80d
git add package.json e2e/vitest.config.ts e2e/partial-sync
git commit -m "test: :white_check_mark: добавить отдельный partial sync"
```

---

### Task 9: Итоговая проверка и передача

**Files:**
- Verify only.

**Interfaces:**
- Consumes: все договоры Tasks 1–8.

- [ ] **Step 1: Запустить точечные проверки изменённых слоёв**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/manager.test.ts src/sessions/designerAgent.test.ts src/sessions/standaloneServer.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/contracts/syncToInfobase.test.ts src/services/importFromInfobase.test.ts src/tools/registerTools.test.ts
pnpm test:e2e
```

Expected: PASS.

- [ ] **Step 2: Запустить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 39310b80d
```

Expected: PASS. Если одиночный лимит длительности снова нестабилен при
функционально зелёных тестах, выполнить три прогона
`pnpm test:profile -- --output reports/test-profile/current.json` и сообщить
медиану вместо изменения теста под случайный замер.

- [ ] **Step 3: Проверить рабочее дерево и документацию запуска**

Run: `git status --short && git log --oneline 39310b80d..HEAD`

Expected: только согласованные изменения, понятная последовательность
коммитов, внешний каталог `/Users/nikita/Базы 1С/temp_test` не создан и не
изменён.

- [ ] **Step 4: Сообщить итоговые тестовые договоры**

В итоговом ответе перечислить:

- расширенные тесты платформенных команд и `import_from_infobase`;
- новые unit-тесты безопасности, контрольных точек, MCP-сеанса, подготовки,
  переходов, этапов и CLI;
- новый внешний сценарий и причину его исключения из общих e2e;
- факт, что ручной внешний запуск не выполнялся;
- точную команду будущего запуска:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test'
```
