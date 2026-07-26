# Infobase Import and Platform Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить MCP-импорт основной конфигурации из файловой или клиент-серверной информационной базы 1С через переиспользуемый сеанс агента Конфигуратора или offline-режим `ibcmd`.

**Architecture:** `@nkdk/platform` инкапсулирует поиск приложений 1С, настройки проекта, SSH-сеанс агента для `File` и `Srvr`/`Ref`, команды offline-режима `ibcmd` для обоих видов баз и кеш сеансов. `@nkdk/core` получает только нейтральную стратегию `copy | move` для внешних файлов, а `@nkdk/mcp` создаёт временную XML-выгрузку, вызывает существующий XML → YAML импорт и публикует импорт и закрытие сеансов.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Zod 4, `ssh2`, `yaml`, MCP SDK, pnpm workspace.

**Execution status:** Tasks 1–10 are implemented through commit `8b91ffc8b`.
Execution resumes at Task 11, which corrects the connection-mode matrix after
clarifying the scope of the documented `--server` limitation.

## Global Constraints

- Поддерживается только платформа `8.3.27`; выбирается самый новый найденный build.
- Поддерживаются строки подключения 1С `File="...";` и `Srvr="...";Ref="...";`; web-базы отклоняются.
- Агентный режим поддерживает `File` и `Srvr`/`Ref`; `dump-config-to-files` вызывается без `--server`, потому что только этот параметр игнорируется агентом файловой базы.
- `useStandaloneServer: true` поддерживает `File` и `Srvr`/`Ref` через offline-режим `ibcmd`; для клиент-серверной базы обязательны параметры СУБД.
- `ibsrv` не запускается: адаптер кеширует подготовленный `config.yaml`, а каждую выгрузку выполняет отдельным `ibcmd`.
- Основная конфигурация импортируется только в отсутствующий или пустой компонент `cf`.
- Временная выгрузка находится в `.nkdk/tmp/import-from-infobase/<operation-id>/xml`.
- Обычный XML-импорт по умолчанию копирует внешние файлы; импорт из базы передаёт `externalFileTransfer: "move"`.
- `sessionIdleTimeout` — положительное целое число секунд, значение по умолчанию `900`.
- Один канонический `projectDir` имеет не более одного соединения; операции одного проекта последовательны, разных проектов независимы.
- Пароль хранится открытым текстом только в `.nkdk/project.yaml`, но никогда не попадает в журнал, ошибку или MCP-ответ.
- На Unix `.nkdk/project.yaml` получает режим `0600`; `.nkdk/.gitignore` игнорирует всё содержимое `.nkdk`, кроме себя.
- Процесс можно завершать только при `ownedProcess: true`.
- Все тесты новой функциональности подменяют файловую систему, процессы, SSH, порты, часы и таймеры; они не создают каталоги, не открывают порты и не запускают 1С.
- Существующие XML-фикстуры не изменяются.

---

## File Map

### `@nkdk/core`

- `packages/core/metadata/importFromXml/types.ts` — публичный тип `ExternalFileTransfer`.
- `packages/core/metadata/importFromXml/transfer.ts` — безопасная передача XML-файлов через `copyFile` или `rename`.
- `packages/core/metadata/importFromXml/transfer.test.ts` — только замоканные проверки обеих стратегий и защиты путей.
- `packages/core/metadata/importFromXml/importConfiguration.ts` — передача выбранной стратегии координатору.
- `packages/core/metadata/importFromXml/importConfiguration.test.ts` — проверка значения по умолчанию и явного `move`.
- `packages/core/metadata/importFromXml/index.ts`, `packages/core/index.ts` — экспорт типа.

### `@nkdk/platform`

- `packages/platform/src/sessions/types.ts` — публичные параметры и результаты менеджера, внутренний договор сеанса.
- `packages/platform/src/sessions/errors.ts` — стабильные коды и `PlatformSessionError`.
- `packages/platform/src/settings/projectSettings.ts` — проверка, чтение и безопасная запись `.nkdk/project.yaml`.
- `packages/platform/src/settings/projectSettings.test.ts` — замоканные сценарии настроек.
- `packages/platform/src/platform/findPlatform.ts`, `findPlatform.test.ts` — поиск `ibsrv` рядом с `1cv8` и `ibcmd`.
- `packages/platform/src/sessions/commands.ts`, `commands.test.ts` — чистые построители команд для Windows/Linux/macOS.
- `packages/platform/src/sessions/runtime.ts` — границы файлов, процессов, портов, SSH, часов и таймеров.
- `packages/platform/src/sessions/sshProtocol.ts`, `sshProtocol.test.ts` — общий интерактивный договор команд 1С.
- `packages/platform/src/sessions/ssh2Transport.ts` — производственный транспорт поверх `ssh2`.
- `packages/platform/src/sessions/designerAgent.ts`, `designerAgent.test.ts` — запуск и остановка агента Конфигуратора.
- `packages/platform/src/sessions/standaloneServer.ts`, `standaloneServer.test.ts` — подготовка `config.yaml` и выгрузка файловой или клиент-серверной базы через `ibcmd`.
- `packages/platform/src/sessions/manager.ts`, `manager.test.ts` — кеш, очереди, экспорт и закрытие соединений.
- `packages/platform/index.ts` — публичный API менеджера и настроек.
- `packages/platform/package.json`, `pnpm-lock.yaml` — зависимости `ssh2`, `yaml` и типы `@types/ssh2`.

### `@nkdk/mcp`

- `packages/mcp/src/contracts/importFromInfobase.ts`, `importFromInfobase.test.ts` — Zod-договор импорта.
- `packages/mcp/src/contracts/platformConnections.ts`, `platformConnections.test.ts` — договоры закрытия.
- `packages/mcp/src/contracts/common.ts`, `common.test.ts` — новые стабильные коды ошибок.
- `packages/mcp/src/services/platformSessionHandle.ts`, `platformSessionHandle.test.ts` — один менеджер на MCP-процесс.
- `packages/mcp/src/services/importFromInfobase.ts`, `importFromInfobase.test.ts` — оркестрация экспорт → импорт → настройки → очистка.
- `packages/mcp/src/services/platformConnections.ts`, `platformConnections.test.ts` — сервисы закрытия одного и всех соединений.
- `packages/mcp/src/coreApi.ts` — параметр `externalFileTransfer`.
- `packages/mcp/src/tools/registerTools.ts`, `registerTools.test.ts` — регистрация трёх MCP-инструментов.
- `packages/mcp/src/server.ts`, `server.test.ts` — закрытие менеджера при остановке MCP.
- `packages/mcp/scripts/build.mjs`, `packages/mcp/scripts/smoke-packed.mjs` — упаковка и smoke-проверка нового runtime.
- `packages/mcp/package.json`, `pnpm-lock.yaml` — прямые runtime-зависимости `ssh2` и `yaml` для опубликованного ESM-пакета.
- `packages/mcp/README.md` — краткое описание публичных инструментов и настроек.

---

### Task 1: External-file transfer strategy in `@nkdk/core`

**Files:**
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/transfer.ts`
- Modify: `packages/core/metadata/importFromXml/transfer.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/index.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Produces: `type ExternalFileTransfer = "copy" | "move"`.
- Produces: `ImportConfigurationFromXmlParams.externalFileTransfer?: ExternalFileTransfer`.
- Produces: `transferXmlImportExternalFiles({ projectDir, files, concurrency, transfer })`.
- Preserves: omitted `externalFileTransfer` behaves exactly as `"copy"`.

- [ ] **Step 1: Replace real-filesystem transfer tests with failing mocked tests**

Remove `mkdtemp`, `writeFile`, `symlink`, and cleanup code from `transfer.test.ts`. Extend the recording operations with `rename` and express both transfer modes through calls:

```ts
it.each([
  ["copy", "copyFile /xml/Модуль.bsl -> /project/Модуль.bsl"],
  ["move", "rename /xml/Модуль.bsl -> /project/Модуль.bsl"],
] as const)("uses %s for XML-owned files", async (transfer, expected) => {
  const calls: string[] = []
  await transferXmlImportExternalFiles(
    {
      projectDir: "/project",
      files: [workerFile("Конфигурация.yaml"), externalFile("Модуль.bsl")],
      concurrency: 1,
      transfer,
    },
    recordingFileOperations(calls),
  )
  expect(calls).toContain(expected)
})
```

Keep traversal and symlink protection covered through controlled `realpath` return values rather than actual symlinks.

- [ ] **Step 2: Add a failing coordinator test for default `copy` and explicit `move`**

```ts
it.each([
  [undefined, "copy"],
  ["move", "move"],
] as const)("passes transfer strategy %s", async (externalFileTransfer, expected) => {
  const dependencies = fakeDependencies({ calls: [] })
  await importConfigurationFromXml(
    { ...createParams(), ...(externalFileTransfer ? { externalFileTransfer } : {}) },
    dependencies,
  )
  expect(dependencies.transferExternalFiles).toHaveBeenCalledWith(
    expect.objectContaining({ transfer: expected }),
  )
})
```

- [ ] **Step 3: Run the focused tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/transfer.test.ts metadata/importFromXml/importConfiguration.test.ts
```

Expected: FAIL because `ExternalFileTransfer`, `rename`, `transfer`, and `transferExternalFiles` do not exist.

- [ ] **Step 4: Implement the neutral strategy**

Add:

```ts
export type ExternalFileTransfer = "copy" | "move"
```

Change the file-operation boundary to:

```ts
interface ImportTransferFileOperations {
  realpath(path: string): Promise<string>
  mkdir(path: string): Promise<void>
  copyFile(source: string, target: string): Promise<void>
  rename(source: string, target: string): Promise<void>
}
```

Use one selected operation after the existing path checks:

```ts
const transferFile =
  params.transfer === "move"
    ? fileOperations.rename
    : fileOperations.copyFile
await transferFile(prepared.file.sourcePath, prepared.targetPath)
```

Rename the coordinator dependency from `copyExternalFiles` to `transferExternalFiles`, pass `params.externalFileTransfer ?? "copy"`, and retain `copyExternalConcurrency` to avoid an unrelated public rename.

- [ ] **Step 5: Export the type and run package verification**

Run:

```bash
pnpm --filter @nkdk/core test
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/importFromXml packages/core/index.ts
git commit -m "feat: :sparkles: добавить перенос внешних файлов импорта"
```

---

### Task 2: Platform contracts, errors, and project settings

**Files:**
- Create: `packages/platform/src/sessions/types.ts`
- Create: `packages/platform/src/sessions/errors.ts`
- Create: `packages/platform/src/settings/projectSettings.ts`
- Create: `packages/platform/src/settings/projectSettings.test.ts`
- Modify: `packages/platform/index.ts`
- Modify: `packages/platform/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `PlatformConnectionSettings`, `ExportConfigurationParams`, `ExportConfigurationResult`.
- Produces: `CloseConnectionResult`, `CloseAllConnectionsResult`, `PlatformSessionManager`.
- Produces: `readProjectSettings(projectDir, dependencies?)` and `writeProjectSettings({ projectDir, infobase }, dependencies?)`.
- Produces: `PlatformSessionError` with stable `PlatformSessionErrorCode`.

- [ ] **Step 1: Write failing settings tests using a mocked filesystem**

Define the injected boundary:

```ts
export interface ProjectSettingsFileSystem {
  readFile(path: string): Promise<string>
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
  chmod(path: string, mode: number): Promise<void>
}
```

Test these exact cases without touching disk:

```ts
expect(parseProjectSettings(`
version: 1
infobase:
  connectionString: 'File="/bases/test";'
`)).toEqual({
  version: 1,
  infobase: {
    connectionString: 'File="/bases/test";',
    useStandaloneServer: false,
    sessionIdleTimeout: 900,
  },
})
```

Also assert rejection of unknown versions, web/unknown connections,
non-integer or non-positive timeout, incomplete/unknown `database`, missing
`database` for standalone `Srvr`/`Ref`, and `database` supplied for `File`.
For writing, assert calls for `.nkdk/.gitignore`, `.nkdk/project.yaml`, and
`chmod(..., 0o600)` on Unix; assert neither infobase nor database password
appears in thrown messages.

- [ ] **Step 2: Run settings tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/settings/projectSettings.test.ts
```

Expected: FAIL because the settings module does not exist.

- [ ] **Step 3: Define the session contracts and stable errors**

Use these exact public types:

```ts
export type PlatformSessionMode = "designer-agent" | "standalone-server"

export type PlatformConnectionSettings = {
  connectionString: string
  user?: string
  password?: string
  database?: {
    dbms: "MSSQLServer" | "PostgreSQL" | "IBMDB2" | "OracleDatabase"
    server: string
    name: string
    user: string
    password?: string
  }
  useStandaloneServer?: boolean
  sessionIdleTimeout?: number
}

export type ExportConfigurationParams = PlatformConnectionSettings & {
  projectDir: string
  outputDir: string
  logPath: string
}

export type ExportConfigurationResult = {
  mode: PlatformSessionMode
  reusedConnection: boolean
}

export type CloseConnectionResult = {
  closed: boolean
  stoppedOwnedProcess: boolean
}

export type CloseAllConnectionsResult = {
  closedCount: number
  stoppedOwnedProcesses: number
}

export type ProjectSettings = {
  version: 1
  infobase: Required<
    Pick<PlatformConnectionSettings, "connectionString" | "useStandaloneServer" | "sessionIdleTimeout">
  > &
    Pick<PlatformConnectionSettings, "user" | "password" | "database">
}

export interface PlatformSession {
  mode: PlatformSessionMode
  ownedProcess: boolean
  exportConfiguration(outputDir: string, operationLogPath: string): Promise<void>
  isAlive(): boolean
  close(): Promise<{ stoppedOwnedProcess: boolean }>
}

export type CreatePlatformSessionParams = {
  projectDir: string
  sessionDir: string
  installation: PlatformInstallation
  settings: Required<
    Pick<PlatformConnectionSettings, "connectionString" | "useStandaloneServer" | "sessionIdleTimeout">
  > &
    Pick<PlatformConnectionSettings, "user" | "password" | "database">
}
```

`PlatformSessionErrorCode` contains exactly:

```ts
type PlatformSessionErrorCode =
  | "platform_not_found"
  | "platform_component_missing"
  | "unsupported_connection"
  | "invalid_project_settings"
  | "authentication_failed"
  | "session_start_failed"
  | "session_timeout"
  | "platform_command_failed"
```

- [ ] **Step 4: Implement parsing and writing**

Use `yaml` to parse/stringify. Normalize omitted values to `false` and `900`; preserve the original 1C connection string and optional credentials. Write:

```text
.nkdk/.gitignore:
*
!.gitignore
```

and write `.nkdk/project.yaml` with mode `0600`, followed by `chmod(0o600)` when `os !== "win32"`. Convert schema and YAML errors into `PlatformSessionError("invalid_project_settings", safeMessage)` without serializing the parsed settings.

Use these exact signatures:

```ts
export async function readProjectSettings(
  projectDir: string,
  dependencies?: ProjectSettingsDependencies,
): Promise<ProjectSettings | undefined>

export async function writeProjectSettings(
  params: { projectDir: string; infobase: PlatformConnectionSettings },
  dependencies?: ProjectSettingsDependencies,
): Promise<{ settingsPath: string }>
```

- [ ] **Step 5: Add dependencies and export the API**

Add `yaml` to `packages/platform/package.json` dependencies. Export the types, error class, `readProjectSettings`, and `writeProjectSettings` from `packages/platform/index.ts`.

- [ ] **Step 6: Run package verification**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/platform pnpm-lock.yaml
git commit -m "feat: :sparkles: добавить настройки соединения с платформой"
```

---

### Task 3: Platform discovery and pure command builders

**Files:**
- Modify: `packages/platform/src/platform/findPlatform.ts`
- Modify: `packages/platform/src/platform/findPlatform.test.ts`
- Create: `packages/platform/src/sessions/commands.ts`
- Create: `packages/platform/src/sessions/commands.test.ts`

**Interfaces:**
- Consumes: `PlatformConnectionSettings`, existing `InfobaseConnection`.
- Produces: `PlatformInstallation.ibsrvPath?: string`.
- Produces: `buildDesignerAgentLaunch()`, `buildStandaloneConfigInit()`, `buildStandaloneLaunch()`, `buildDumpConfigurationCommand()`.

- [ ] **Step 1: Add failing `ibsrv` discovery tests**

Extend the existing platform fixture with executable and non-executable `ibsrv` files. Assert the selected installation can independently report all three paths:

```ts
expect(await findPlatformWithRuntime(runtime)).toEqual({
  version: "8.3.27.2214",
  directory: "/opt/1cv8/x86_64/8.3.27.2214",
  enterprisePath: "/opt/1cv8/x86_64/8.3.27.2214/1cv8",
  ibcmdPath: "/opt/1cv8/x86_64/8.3.27.2214/ibcmd",
  ibsrvPath: "/opt/1cv8/x86_64/8.3.27.2214/ibsrv",
})
```

- [ ] **Step 2: Add failing table-driven command tests**

Cover `win32`, `linux`, and `darwin`, including spaces and quotes in paths. Assert arrays, never shell strings:

```ts
expect(buildDesignerAgentLaunch({
  enterprisePath: "/opt/1cv8/8.3.27.2214/1cv8",
  connection: { type: "file", path: "/bases/demo" },
  hostKeyPath: "/project/.nkdk/platform/agent/host.key",
  baseDir: "/project/.nkdk/platform/agent",
  logPath: "/project/.nkdk/platform/agent/process.log",
  port: 58248,
})).toEqual({
  command: "/opt/1cv8/8.3.27.2214/1cv8",
  args: [
    "DESIGNER",
    "/F/bases/demo",
    "/AgentMode",
    "/AgentSSHHostKey",
    "/project/.nkdk/platform/agent/host.key",
    "/AgentBaseDir",
    "/project/.nkdk/platform/agent",
    "/AppAutoCheckVersion-",
    "/AgentPort",
    "58248",
    "/Out",
    "/project/.nkdk/platform/agent/process.log",
    "-NoTruncate",
  ],
})
```

Server connection must become `/Sserver\\reference`. Dump must be:

```ts
expect(buildDumpConfigurationCommand("/project/.nkdk/tmp/op/xml"))
  .toBe('config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical')
```

Standalone init and launch:

```ts
["server", "config", "init", "--database-path=/bases/demo"]
["--data", dataDir, "--session-data", sessionDataDir, "--config", configPath]
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/platform/findPlatform.test.ts src/sessions/commands.test.ts
```

Expected: FAIL because `ibsrvPath` and the builders do not exist.

- [ ] **Step 4: Implement discovery and builders**

Search `ibsrv.exe` under `bin` on Windows and `ibsrv`, then `bin/ibsrv`, on
Unix. Reuse existing executable validation. Parse connection strings with the
existing `parseConnection`; throw `unsupported_connection` only for
web/unknown connections.

Escape command values for the 1C interactive shell by doubling embedded `"` and reject NUL/newline characters. Keep process arguments as arrays so no shell interpolation occurs.

- [ ] **Step 5: Run package verification and commit**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

```bash
git add packages/platform/src/platform packages/platform/src/sessions
git commit -m "feat: :sparkles: подготовить команды запуска платформы"
```

---

### Task 4: Shared SSH protocol

**Files:**
- Create: `packages/platform/src/sessions/runtime.ts`
- Create: `packages/platform/src/sessions/sshProtocol.ts`
- Create: `packages/platform/src/sessions/sshProtocol.test.ts`
- Create: `packages/platform/src/sessions/ssh2Transport.ts`
- Modify: `packages/platform/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `SshTransport`, `SshShell`, `OwnedProcess`, `SessionClock`, `SessionFileSystem`.
- Produces: `openPlatformCommandSession(params): Promise<PlatformCommandSession>`.
- Produces: `PlatformCommandSession.run(command)`, `isAlive()`, and `close()`.
- Consumes later: Designer and standalone adapters receive these boundaries through dependencies.

- [ ] **Step 1: Write failing protocol tests with a scripted shell**

The scripted shell returns chunks and records writes. Cover:

```ts
it("selects JSON, connects to the infobase, and completes a command", async () => {
  const shell = scriptedShell([
    'designer> ',
    '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
    '[{"type":"question","message":"User"}]\ndesigner> ',
    '[{"type":"question","message":"Password"}]\ndesigner> ',
    '[{"type":"success","message":"Connected"}]\ndesigner> ',
    '[{"type":"success","message":"Dump complete"}]\ndesigner> ',
  ])
  const session = await openPlatformCommandSession({
    shell,
    user: "Администратор",
    password: "secret",
    timeoutMs: 60_000,
  })
  await expect(session.run("config dump-config-to-files --dir=\"xml\"")).resolves.toBeUndefined()
  expect(shell.rawWrites).toContain("secret\n")
  expect(JSON.stringify(shell.diagnostics)).not.toContain("secret")
})
```

The secret answer is sent once, but the recording boundary keeps raw protocol writes separate from diagnostics. Add cases for authentication error, unexpected JSON, command error, closed shell, and fake-timer timeout.

- [ ] **Step 2: Run the protocol test and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/sshProtocol.test.ts
```

Expected: FAIL because the runtime and protocol modules do not exist.

- [ ] **Step 3: Implement narrow runtime boundaries**

Define:

```ts
export interface SshShell {
  write(value: string): void
  onData(listener: (chunk: string) => void): () => void
  isOpen(): boolean
  close(): Promise<void>
}

export interface PlatformCommandSession {
  run(command: string): Promise<void>
  isAlive(): boolean
  close(): Promise<void>
}
```

Process and timer boundaries expose only operations used by the adapters: `spawn`, `run`, `reservePort`, `setTimeout`, `clearTimeout`, `mkdir`, `writeFile`, `readFile`, `rm`, and `realpath`.

- [ ] **Step 4: Implement the JSON command state machine**

Open one interactive shell; wait for the prompt; issue `options set --output-format=json`; issue `common connect-ib`; answer only recognized user/password questions. Complete each command only on terminal `success`, `error`, or `cancel` JSON messages followed by the prompt.

Map login rejection to `authentication_failed`, timeout to `session_timeout`, transport/startup failures to `session_start_failed`, and command errors to `platform_command_failed`. Redact the exact user/password values from every generated message.

- [ ] **Step 5: Add the production `ssh2` adapter**

Add `ssh2` to dependencies and `@types/ssh2` to devDependencies. `ssh2Transport.ts` wraps `Client.connect()` with `host: "127.0.0.1"`, `authHandler: [{ type: "none", username: "" }]`, the reserved port, and the configured readiness timeout. It requests an interactive shell, exposes string chunks through `SshShell`, and treats `close`, `end`, and `error` as a dead session. Host verification accepts only the locally launched endpoint; do not expose a remote-host option.

- [ ] **Step 6: Run package verification and commit**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

```bash
git add packages/platform pnpm-lock.yaml
git commit -m "feat: :sparkles: добавить SSH-сеанс команд платформы"
```

---

### Task 5: Designer agent session adapter

**Files:**
- Create: `packages/platform/src/sessions/designerAgent.ts`
- Create: `packages/platform/src/sessions/designerAgent.test.ts`

**Interfaces:**
- Consumes: `PlatformInstallation`, command builders, `SshTransport`, process/files/port/clock boundaries.
- Produces: internal `createDesignerAgentSession(params): Promise<PlatformSession>`.

- [ ] **Step 1: Write failing adapter tests with all boundaries mocked**

Cover file and client-server connections on all three operating systems.
Assert that both use the same SSH lifecycle and `dump-config-to-files` without
`--server`. The main lifecycle test asserts this order:

```ts
expect(calls).toEqual([
  "reservePort 127.0.0.1",
  "mkdir /project/.nkdk/platform-sessions/agent",
  "spawn /opt/1cv8/8.3.27.2214/1cv8 DESIGNER ...",
  "ssh.connect 127.0.0.1:58248",
  "shell.connect-ib",
  "read /project/.nkdk/agentbasedir.json",
  "shell.run config dump-config-to-files --dir=\".nkdk-export\" --format=hierarchical",
  "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml",
])
```

Add cases for missing `enterprisePath`, process exit before SSH, retry until ready, startup timeout, graceful `disconnect-ib` + `shutdown`, and forced termination after close timeout. Assert forced termination is never requested when `ownedProcess` is false.

- [ ] **Step 2: Run the adapter test and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts
```

Expected: FAIL because `createDesignerAgentSession` does not exist.

- [ ] **Step 3: Implement startup and health checks**

Require `enterprisePath`, reserve a loopback port, create the session base directory through the injected filesystem, spawn without a shell, and retry SSH connection until ready or timeout. Keep the exact returned child handle as proof of ownership.

`isAlive()` is true only when both the owned process and command session are
alive. `/AgentBaseDir` is the project `.nkdk` directory; the process `/Out` log
lives in `sessionDir/process.log`, so successful deletion of an operation
directory does not remove a file used by a cached process.
`exportConfiguration(outputDir, operationLogPath)` verifies that `outputDir`
is inside `.nkdk`, reads the empty SSH user's service directory from
`agentbasedir.json`, exports to an owned staging directory inside that service
directory, and renames the staging directory to `outputDir`. A partial dump is
also moved after a command failure. Only redacted diagnostics are written to
the operation log.

- [ ] **Step 4: Implement safe close**

Close sequence; each graceful command is bounded by `closeTimeoutMs`:

```ts
await commandSession.run("common disconnect-ib")
await commandSession.run("common shutdown")
await commandSession.close()
await ownedProcess.wait(closeTimeoutMs)
```

Treat disconnect/shutdown errors as cleanup diagnostics, continue closing SSH, and call `ownedProcess.kill()` only after wait timeout and only when ownership is true. Return whether the owned process was stopped.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

```bash
git add packages/platform/src/sessions/designerAgent.ts packages/platform/src/sessions/designerAgent.test.ts
git commit -m "feat: :sparkles: добавить сеанс агента Конфигуратора"
```

---

### Task 6: Standalone `ibcmd` session adapter

**Files:**
- Create: `packages/platform/src/sessions/standaloneServer.ts`
- Create: `packages/platform/src/sessions/standaloneServer.test.ts`

**Interfaces:**
- Consumes: file or server connection, optional `database`, `ibcmdPath`, command builders and mocked process/filesystem boundaries.
- Produces: internal `createStandaloneServerSession(params): Promise<PlatformSession>`.

- [ ] **Step 1: Write failing adapter tests with all boundaries mocked**

Assert the happy-path call order:

```ts
expect(calls).toEqual([
  "mkdir /project/.nkdk/platform-sessions/standalone",
  "run ibcmd server config init --database-path=/bases/demo",
  "write config.yaml",
  "run ibcmd infobase config export --config=... /project/.nkdk/tmp/op/xml",
  "write platform.log",
])
```

Assert that the generated `config.yaml` is reused and optional infobase
user/password arguments are passed only when present. Cover `File` through
`--database-path`; cover `Srvr`/`Ref` through the required `database` fields and
the `--dbms`, `--database-server`, `--database-name`, `--database-user` and
optional `--database-password` arguments. Initialization/export failures map
to stable errors. Closing the cached session returns
`stoppedOwnedProcess: false`.

- [ ] **Step 2: Run the adapter test and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/standaloneServer.test.ts
```

Expected: FAIL before the adapter follows the `ibcmd export` contract.

- [ ] **Step 3: Implement configuration preparation**

For `connection.type === "file"`, capture stdout from:

```ts
run(ibcmdPath, ["server", "config", "init", `--database-path=${connection.path}`])
```

Write the returned YAML as `config.yaml` through the injected filesystem.

For `connection.type === "server"`, require `settings.database` and initialize
the same file with the DBMS arguments. The `Srvr`/`Ref` values remain the
public 1C address but are not treated as DBMS coordinates.

- [ ] **Step 4: Implement export and close**

Export with:

```ts
run(ibcmdPath, [
  "infobase", "config", "export",
  `--config=${configPath}`,
  outputDir,
])
```

Do not start `ibsrv`: it keeps an exclusive lock on the file infobase and
prevents `ibcmd export`. Treat a zero exit code as success and write a safe
operation log. The cached session keeps only `config.yaml`; close marks it
inactive and stops no process.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/standaloneServer.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

```bash
git add packages/platform/src/sessions/standaloneServer.ts packages/platform/src/sessions/standaloneServer.test.ts
git commit -m "feat: :sparkles: добавить сеанс автономного сервера"
```

---

### Task 7: Platform session manager

**Files:**
- Create: `packages/platform/src/sessions/manager.ts`
- Create: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Consumes: both session factories, platform discovery, canonical path, clock/timer boundaries.
- Produces:

```ts
export function createPlatformSessionManager(
  dependencies?: PlatformSessionManagerDependencies,
): PlatformSessionManager
```

`PlatformSessionManagerDependencies` is:

```ts
export interface PlatformSessionManagerDependencies {
  canonicalizeProjectDir(projectDir: string): Promise<string>
  findPlatform(): Promise<PlatformInstallation | undefined>
  createDesignerSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  createStandaloneSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  setTimer(callback: () => void, timeoutMs: number): unknown
  clearTimer(timer: unknown): void
}
```

- Produces public methods:

```ts
exportConfiguration(params: ExportConfigurationParams): Promise<ExportConfigurationResult>
closeConnection(projectDir: string): Promise<CloseConnectionResult>
closeAllConnections(): Promise<CloseAllConnectionsResult>
```

- [ ] **Step 1: Write failing cache and queue tests**

Use deferred promises and fake timers. Cover:

```ts
it("reuses one healthy matching session", async () => {
  await manager.exportConfiguration(params)
  await expect(manager.exportConfiguration(params)).resolves.toMatchObject({
    mode: "designer-agent",
    reusedConnection: true,
  })
  expect(createDesignerSession).toHaveBeenCalledTimes(1)
})
```

Also cover replacement when connection string, user, password, or mode changes; replacement of dead sessions; serialization for the same canonical project; concurrency for different projects; idle timeout reset after each operation; no timeout during an operation; and queue recovery after rejection.

- [ ] **Step 2: Add failing close tests**

Assert:

```ts
await expect(manager.closeConnection("/project")).resolves.toEqual({
  closed: true,
  stoppedOwnedProcess: true,
})
await expect(manager.closeAllConnections()).resolves.toEqual({
  closedCount: 2,
  stoppedOwnedProcesses: 2,
})
```

Also assert absent project returns both booleans false and that one close failure does not prevent closing other projects.

- [ ] **Step 3: Run manager tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts
```

Expected: FAIL because the manager does not exist.

- [ ] **Step 4: Implement canonical-key queues and fingerprints**

Canonicalize `projectDir` before accessing maps. Build a private fingerprint from normalized connection string, user, password, and selected mode. Never stringify the fingerprint.

Implement a per-key promise tail that converts the previous rejection to completion before starting the next item:

```ts
const previous = queues.get(key) ?? Promise.resolve()
const result = previous.catch(() => undefined).then(operation)
queues.set(key, result.then(() => undefined, () => undefined))
return result
```

- [ ] **Step 5: Implement session creation, reuse, and idle close**

On export: cancel idle timer, validate/reuse or close/create the session, run export, then start a new timer for `sessionIdleTimeout * 1000` in `finally`. Do not start the timer while another queued operation exists.

Pass both `params.outputDir` and `params.logPath` to `session.exportConfiguration`. Discover platform only while creating a new session. Select designer when `useStandaloneServer !== true`; otherwise select standalone. Throw the stable missing-component error before any spawn.

- [ ] **Step 6: Implement explicit closing and exports**

Close operations use the same per-project queue. `closeAllConnections` takes a stable snapshot of keys, closes each independently with `Promise.allSettled`, counts successful closures/stopped processes, clears timers and maps, and does not expose credentials in aggregate errors.

Export manager types and factory from `packages/platform/index.ts`; do not export concrete adapter classes.

- [ ] **Step 7: Run platform verification and commit**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

```bash
git add packages/platform
git commit -m "feat: :sparkles: добавить менеджер соединений платформы"
```

---

### Task 8: MCP import from infobase

**Files:**
- Create: `packages/mcp/src/contracts/importFromInfobase.ts`
- Create: `packages/mcp/src/contracts/importFromInfobase.test.ts`
- Create: `packages/mcp/src/services/platformSessionHandle.ts`
- Create: `packages/mcp/src/services/platformSessionHandle.test.ts`
- Create: `packages/mcp/src/services/importFromInfobase.ts`
- Create: `packages/mcp/src/services/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/contracts/common.ts`
- Modify: `packages/mcp/src/contracts/common.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`

**Interfaces:**
- Consumes: `PlatformSessionManager.exportConfiguration`, `writeProjectSettings`, core `syncConfigurationFromXML`.
- Produces: `ImportFromInfobaseInput`, `ImportFromInfobasePayload`, `importFromInfobase()`.
- Produces: process-lifetime `getPlatformSessionManager()` and `closePlatformSessionManager()`.

- [ ] **Step 1: Write failing Zod contract tests**

Use the exact input:

```ts
{
  projectDir: "/project",
  connectionString: 'File="/bases/demo";',
  user: "Администратор",
  password: "secret",
  useStandaloneServer: false,
  sessionIdleTimeout: 900,
  allowWrite: true,
}
```

Assert positive integer timeout and strict rejection of extra fields. Success output contains `succeeded`, `failed`, `warnings`, optional `configurationIndexPath`, `settingsPath`, `mode`, `reusedConnection`, and optional `temporaryDirectory` when object failures preserve the dump.

Also accept `database` for `Srvr`/`Ref + useStandaloneServer: true` with the
same strict DBMS shape as `PlatformConnectionSettings`; require it for this
combination and reject it for `File`.

- [ ] **Step 2: Write failing orchestration tests with no real filesystem**

Inject:

```ts
interface ImportFromInfobaseDependencies {
  platformManager: Pick<PlatformSessionManager, "exportConfiguration">
  importXml: CoreApi["syncConfigurationFromXML"]
  writeSettings: typeof writeProjectSettings
  resolveTarget: typeof resolveComponent
  assertTargetEmpty: typeof assertImportTargetEmpty
  fs: { mkdir(path: string): Promise<void>; rm(path: string): Promise<void> }
  operationId(): string
}
```

Assert `allowWrite !== true` produces `confirmation_required` and zero dependency calls. Happy path order:

```ts
expect(calls).toEqual([
  "resolveTarget /project cf",
  "assertTargetEmpty /project/cf",
  "mkdir /project/.nkdk/tmp/import-from-infobase/op-1/xml",
  "exportConfiguration",
  "syncConfigurationFromXML move",
  "writeProjectSettings",
  "rm /project/.nkdk/tmp/import-from-infobase/op-1",
])
```

Assert `externalFileTransfer: "move"` explicitly. On platform throw or core throw, return its stable error and `details.temporaryDirectory`; do not save settings or remove the operation directory. When core returns `failed.length > 0`, return `ok: true` with `temporaryDirectory`, keep the directory, and do not save settings.

Verify password is absent from every returned value using `expect(JSON.stringify(result)).not.toContain("secret")`.

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/services/importFromInfobase.test.ts src/services/platformSessionHandle.test.ts
```

Expected: FAIL because the contracts and services do not exist and core API lacks `externalFileTransfer`.

- [ ] **Step 4: Extend stable MCP errors and core API**

Add all eight platform error codes to `errorCodeSchema`. Extend the `syncConfigurationFromXML` parameter with:

```ts
externalFileTransfer?: "copy" | "move"
```

Keep existing `core_error` behavior for unrelated exceptions.

- [ ] **Step 5: Implement the lifetime handle**

Lazily create exactly one manager:

```ts
let handle: PlatformSessionManager | undefined

export function getPlatformSessionManager(): PlatformSessionManager {
  return (handle ??= createPlatformSessionManager())
}

export async function closePlatformSessionManager(): Promise<CloseAllConnectionsResult> {
  if (handle === undefined) return { closedCount: 0, stoppedOwnedProcesses: 0 }
  const current = handle
  handle = undefined
  return current.closeAllConnections()
}
```

Allow a test-only factory injection/reset without exporting it from the package root.

- [ ] **Step 6: Implement import orchestration**

Resolve only `cf`; do not accept `componentPath`. Create the operation path from `operationId()`. Pass the operation XML directory and `platform.log` to the manager. Invoke core with the same configuration context as `import_from_xml`, plus `externalFileTransfer: "move"`.

Write settings only when `failed.length === 0`; then remove the operation directory. Map `PlatformSessionError.code` directly; map other throws to `core_error`. Include only the temporary path, never settings/credentials, in error details.

- [ ] **Step 7: Run MCP focused verification and commit**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/services/importFromInfobase.test.ts src/services/platformSessionHandle.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

```bash
git add packages/mcp/src
git commit -m "feat: :sparkles: добавить импорт из информационной базы"
```

---

### Task 9: MCP close tools, registration, and shutdown

**Files:**
- Create: `packages/mcp/src/contracts/platformConnections.ts`
- Create: `packages/mcp/src/contracts/platformConnections.test.ts`
- Create: `packages/mcp/src/services/platformConnections.ts`
- Create: `packages/mcp/src/services/platformConnections.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/server.ts`
- Modify: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Produces: `closePlatformConnection({ projectDir })`.
- Produces: `closeAllPlatformConnections()`.
- Registers: `nkdk.import_from_infobase`, `nkdk.close_platform_connection`, `nkdk.close_all_platform_connections`.
- Extends shutdown: validation handle and all platform connections are closed.

- [ ] **Step 1: Write failing close-service and contract tests**

Use mocked manager methods:

```ts
await expect(closePlatformConnection(
  { projectDir: "/project" },
  { manager: fakeManager },
)).resolves.toEqual({
  ok: true,
  closed: true,
  stoppedOwnedProcess: true,
})
```

Assert close-all input shape is `{}` and success is:

```ts
{ ok: true, closedCount: 2, stoppedOwnedProcesses: 2 }
```

No close operation accepts or requires `allowWrite`.

- [ ] **Step 2: Extend failing registration and shutdown tests**

Add the three tool names in this order immediately after `nkdk.import_from_xml`:

```ts
"nkdk.import_from_infobase",
"nkdk.close_platform_connection",
"nkdk.close_all_platform_connections",
```

Mock `closePlatformSessionManager` in `server.test.ts` and assert both it and `closeValidationHandle` are attempted during shutdown, even if one rejects.

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/platformConnections.test.ts src/services/platformConnections.test.ts src/tools/registerTools.test.ts src/server.test.ts
```

Expected: FAIL because close contracts/services and registrations do not exist.

- [ ] **Step 4: Implement close services and tool registration**

Services delegate to the process-lifetime manager and map unexpected exceptions to `core_error`. Register:

```ts
server.registerTool("nkdk.import_from_infobase", ...)
server.registerTool("nkdk.close_platform_connection", ...)
server.registerTool("nkdk.close_all_platform_connections", ...)
```

Descriptions must state that import writes only with `allowWrite=true`, targets only empty `cf`, and may start 1C; close descriptions must say they only stop processes owned by the current MCP process.

- [ ] **Step 5: Implement complete shutdown**

Use `Promise.allSettled` so both cleanup branches run:

```ts
const results = await Promise.allSettled([
  closeValidationHandle(),
  closePlatformSessionManager(),
])
const rejected = results.find((result) => result.status === "rejected")
if (rejected?.status === "rejected") throw rejected.reason
```

- [ ] **Step 6: Run MCP verification and commit**

Run:

```bash
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

```bash
git add packages/mcp/src
git commit -m "feat: :sparkles: опубликовать управление соединениями платформы"
```

---

### Task 10: Packaging, documentation, and full verification

**Files:**
- Modify: `packages/mcp/scripts/smoke-packed.mjs`
- Modify: `packages/mcp/README.md`

**Interfaces:**
- Verifies: packed MCP can load the bundled platform integration and expose all three tools.
- Documents: `.nkdk/project.yaml`, timeout seconds, complete mode matrix,
  client-server DBMS settings, and explicit close tools.

- [ ] **Step 1: Add packed smoke assertions**

Extend the packed smoke client to list/call non-mutating schemas and assert these names:

```ts
expect(toolNames).toEqual(expect.arrayContaining([
  "nkdk.import_from_infobase",
  "nkdk.close_platform_connection",
  "nkdk.close_all_platform_connections",
]))
```

Call `nkdk.import_from_infobase` without `allowWrite`; assert `confirmation_required` and therefore no platform process starts. Call both close tools and assert zero/false success on an empty manager.

- [ ] **Step 2: Run build/smoke with the new assertions**

Run:

```bash
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: PASS. `ssh2` and `yaml` are direct runtime dependencies of `@nkdk/mcp`
and are listed in `packages/mcp/scripts/build.mjs` `external`. They contain
CommonJS dynamic `require` calls that cannot be reliably embedded into the main
ESM executable; `npm install` places them next to the packed MCP. `node-ssh` is
not used because it is only a Promise wrapper over the same `ssh2` dependency.

- [ ] **Step 3: Document the public behavior**

Add README rows for the three MCP tools. Include this settings example:

```yaml
version: 1
infobase:
  connectionString: 'Srvr="server";Ref="base";'
  user: Администратор
  password: secret
  useStandaloneServer: true
  sessionIdleTimeout: 900
  database:
    dbms: PostgreSQL
    server: db.example.local
    name: production
    user: dbuser
    password: dbsecret
```

State: timeout is seconds; both modes support `File` and `Srvr`/`Ref`;
standalone `Srvr`/`Ref` additionally requires `database`; both passwords are
plaintext; `.nkdk` must not be committed; failed import preserves its
temporary path.

- [ ] **Step 4: Run focused package checks**

Run:

```bash
pnpm --filter @nkdk/core test
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Run the mandatory full test suite**

Run:

```bash
pnpm test
```

Expected: all workspace package tests PASS.

- [ ] **Step 6: Verify no test creates platform-import directories or leaks secrets**

Run:

```bash
rg -n "mkdtemp|tmpdir\\(|createTempDir|secret" \
  packages/platform/src/sessions \
  packages/platform/src/settings \
  packages/mcp/src/services/importFromInfobase.test.ts \
  packages/mcp/src/services/platformConnections.test.ts
```

Expected: no temporary-directory helpers; occurrences of `secret` exist only as test input/assertion and are never present in expected logs, errors, or payloads.

- [ ] **Step 7: Commit**

```bash
git add packages/mcp/scripts packages/mcp/README.md pnpm-lock.yaml
git commit -m "docs: :memo: описать импорт из базы через MCP"
```

- [ ] **Step 8: Review the completed branch**

Use `superpowers:requesting-code-review`, resolve findings, then re-run `pnpm test` and `pnpm type-check` before declaring implementation complete.

---

### Task 11: Complete the File/Srvr matrix in both platform modes

**Files:**
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/settings/projectSettings.ts`
- Modify: `packages/platform/src/settings/projectSettings.test.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/services/importFromInfobase.ts`
- Modify: `packages/mcp/src/services/importFromInfobase.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `README.md`
- Modify: `packages/mcp/README.md`

**Interfaces:**
- `PlatformConnectionSettings.database?: DatabaseConnectionSettings`.
- `ImportFromInfobaseInput.database?: DatabaseConnectionSettings`.
- Agent mode accepts both `File` and `Srvr`/`Ref`.
- Offline `ibcmd` mode accepts both, requiring `database` only for
  `Srvr`/`Ref`.

- [x] **Step 1: Add failing settings and MCP contract tests**

Using only mocked boundaries, cover:

- strict parsing and round-trip writing of `database`;
- all four supported DBMS values;
- missing/incomplete `database` for standalone `Srvr`/`Ref`;
- rejection of `database` for `File`;
- propagation of `database` from MCP input to the manager and saved settings;
- absence of both passwords from validation errors and MCP results.

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/settings/projectSettings.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/services/importFromInfobase.test.ts
```

Expected: FAIL because `database` is not in the contracts.

- [x] **Step 2: Implement the shared database settings contract**

Add:

```ts
type DatabaseConnectionSettings = {
  dbms: "MSSQLServer" | "PostgreSQL" | "IBMDB2" | "OracleDatabase"
  server: string
  name: string
  user: string
  password?: string
}
```

Normalize it once in `@nkdk/platform`; reject empty strings and NUL/CR/LF.
Include it in the private session fingerprint without serializing credentials.
Mirror the strict shape in the MCP Zod input and pass it unchanged through the
service.

- [x] **Step 3: Add failing Designer File tests**

Replace the rejection test with a `File` lifecycle test. Assert `/F<path>`,
the same pinned SSH key, and a dump command without `--server`.

Set `/AgentBaseDir` to `<projectDir>/.nkdk`. For an operation output such as
`<projectDir>/.nkdk/tmp/import-from-infobase/op-1/xml`, assert the interactive
command receives the owned staging path `.nkdk-export` inside the service
directory from `agentbasedir.json`, then assert the staging directory is
renamed to the operation output. Reject an unsafe service mapping or output
path outside `.nkdk`.

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts src/sessions/commands.test.ts
```

Expected: FAIL because the adapter currently rejects `File` and passes an
absolute output path.

- [x] **Step 4: Implement Designer support for both connection types**

Allow `connection.type === "file" || connection.type === "server"`. Preserve
the existing process ownership, SSH fingerprint verification and retry
behavior. Resolve the service directory from `agentbasedir.json`, stage the
dump inside it, then rename the result to the canonical operation output.
Bound graceful close commands by `closeTimeoutMs`.

- [x] **Step 5: Add failing standalone client-server tests**

Assert the exact `ibcmd server config init` arguments:

```ts
[
  "server", "config", "init",
  "--dbms=PostgreSQL",
  "--database-server=db.example.local",
  "--database-name=production",
  "--database-user=dbuser",
  "--database-password=dbsecret",
]
```

Cover an omitted database password, missing settings, invalid connection
types, timeouts, safe errors and normal export through the generated
`config.yaml`.

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/standaloneServer.test.ts
```

Expected: FAIL because the adapter currently accepts only `File`.

- [x] **Step 6: Implement standalone support for both connection types**

Keep the existing file branch. Add a server branch that builds `config init`
from `database`; do not derive DBMS coordinates from `Srvr`/`Ref`. Validate the
returned YAML before writing it, retain the 30-minute timeout, and keep
infobase `user`/`password` only on `infobase config export`.

- [x] **Step 7: Update architecture and public documentation**

Correct the meaning of `--server`; document the complete 2×2 matrix,
`agentbasedir.json` and staging transfer, the nested `database` object,
plaintext password limitations, and required settings for standalone
client-server access.
Regenerate `packages/mcp/README.md` through the normal build.

- [x] **Step 8: Run focused and real verification**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
pnpm type-check
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
```

Use the real MCP tool on `File="/Users/nikita/Базы 1С/all";` in both
`useStandaloneServer: false` and `true`, each with a new empty project. Assert
non-empty successful imports and close both connections. Client-server
execution remains mocked until credentials for a real test base are supplied.

- [x] **Step 9: Run mandatory full verification and commit**

Run `pnpm test`, `git diff --check`, and `git status --short`. Use
`superpowers:requesting-code-review`, resolve all Critical/Important findings,
then re-run `pnpm test` and `pnpm type-check`.

Commit with the project `commit` skill.
