# Infobase Import Settings and Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `nkdk.import_from_infobase` на обязательный `.nkdk/project.yaml`, опубликовать его JSON Schema и возвращать краткую безопасную ошибку платформы со ссылкой на подробный локальный журнал.

**Architecture:** `@nkdk/platform` владеет структурным договором настроек, смысловой проверкой, выбором режима конкретной операции и безопасным журналом платформы. Адаптеры агента Конфигуратора и `ibcmd` приводят разные команды и ответы к единому `PlatformSessionError`, а `@nkdk/mcp` только организует импорт, публикует схему и превращает локальный путь журнала в `resource_link`.

**Tech Stack:** TypeScript 7, Zod 4 и JSON Schema, YAML 2, MCP SDK 1.30, Vitest 4, процессы `1cv8`/`ibcmd` платформы 1С 8.3.27.*.

## Global Constraints

- Вход `nkdk.import_from_infobase` содержит только `projectDir` и необязательный `allowWrite`; параметры подключения из MCP удаляются.
- `.nkdk/project.yaml` не содержит поля версии и не поддерживает старое поле `useStandaloneServer`; миграции старого формата нет.
- Настройки импорта находятся в `infobase.operations.import`: обязательный `mode` и `unresolvedReferences` со значением по умолчанию `include`.
- Поддерживаемые режимы: `designer-agent` и `standalone-server`; автоматического перехода между ними нет.
- `unresolvedReferences: omit` добавляет `--ignore-unresolved-refs`, а `include` не добавляет ключ.
- Число потоков, архив, расширения, частичная выгрузка и синхронизация с информационной базой не входят в реализацию.
- `nkdk://project-settings/schema/v1` является единственным MCP-ресурсом схемы; отдельный инструмент и шаблоны не создаются.
- Пароли пользователь вносит вручную; NKDK не создаёт и не переписывает `.nkdk/project.yaml`.
- На Unix существующий `.nkdk/project.yaml` получает права `0600` до чтения; на Windows ACL не изменяются.
- Краткая ошибка содержит первую непустую очищенную строку платформы длиной не более 500 символов; подробности доступны только через очищенный `platform.log`.
- В `structuredContent` и MCP-тексте запрещены команда, `stdout`, `stderr` и пароли.
- Временный каталог удаляется после полного успеха и сохраняется при платформенной либо частичной XML → YAML ошибке.
- Код и тексты из `v8runner`, `unica` и `1C-ibcmd-runner` не копируются.
- `@nkdk/core`, существующие XML-фикстуры и `.agents/architecture.md` не изменяются; расхождение последнего с новым договором перечисляется в итоговом отчёте.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base 90eb79f7d`; перед завершением обязательны `pnpm type-check`, `pnpm test` и `pnpm test:architecture`.
- Локальная база и её учётные данные используются только через переменные окружения необязательного интеграционного теста и не записываются в Git или диагностический вывод.

---

## File Structure

### `@nkdk/platform`

- `packages/platform/src/settings/projectSettingsSchema.ts` — единственный структурный договор Zod, описания полей, четыре безопасных примера и JSON Schema.
- `packages/platform/src/settings/projectSettings.ts` — синтаксический разбор YAML, смысловая проверка подключения, структурированные diagnostics и безопасное чтение файла.
- `packages/platform/src/sessions/operationLog.ts` — очистка секретов, краткое сообщение, безопасное представление команды и журнал одной операции.
- `packages/platform/src/sessions/errors.ts` — коды, этапы и ссылочные подробности платформенной ошибки.
- `packages/platform/src/sessions/types.ts` — нормализованные настройки, параметры операции и интерфейсы сеанса.
- `packages/platform/src/sessions/commands.ts` — аргументы двух механизмов выгрузки, включая `--ignore-unresolved-refs`.
- `packages/platform/src/sessions/manager.ts` — явный режим операции, жизненный цикл журнала и декорирование ошибок поиска/создания сеанса.
- `packages/platform/src/sessions/standaloneServer.ts` — выполнение и протоколирование `ibcmd`.
- `packages/platform/src/sessions/designerAgent.ts` — выполнение и протоколирование агента и перенос `/Out`-журнала.
- `packages/platform/src/sessions/sshProtocol.ts` — сохранение фактического сообщения ошибки JSON-протокола вместо общего текста.
- `packages/platform/src/sessions/runtime.ts`, `packages/platform/src/sessions/nodeRuntime.ts` — минимальная файловая граница для дописывания журнала.
- `packages/platform/index.ts`, `packages/platform/package.json`, `pnpm-lock.yaml` — публичные экспорты и зависимость Zod.

### `@nkdk/mcp`

- `packages/mcp/src/contracts/importFromInfobase.ts` — минимальный вход и типизированные результаты ошибок настроек/платформы.
- `packages/mcp/src/contracts/common.ts` — новый код `project_settings_required` и обобщённое представление именованного `resource_link`.
- `packages/mcp/src/resources/projectSettingsSchema.ts` — регистрационные сведения MCP-ресурса без собственной копии схемы.
- `packages/mcp/src/tools/registerTools.ts` — регистрация ресурса, уточнённое описание импорта и специальное представление результата.
- `packages/mcp/src/services/importFromInfobase.ts` — порядок «разрешение записи → настройки → цель → платформа → XML → YAML».
- `packages/mcp/src/services/listInfobaseExtensions.ts` — применение того же результата чтения настроек без собственной проверки.
- `packages/mcp/src/services/importFromInfobase.integration.test.ts` — необязательная реальная проверка файловой базы без встроенных путей и секретов.

---

### Task 1: Новый договор и общая проверка настроек проекта

**Files:**
- Create: `packages/platform/src/settings/projectSettingsSchema.ts`
- Modify: `packages/platform/src/settings/projectSettings.ts`
- Modify: `packages/platform/src/settings/projectSettings.test.ts`
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/index.ts`
- Modify: `packages/platform/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `ProjectSettings`, `ProjectSettingsDiagnostic`, `ProjectSettingsValidationResult`, `ProjectSettingsReadResult`.
- Produces: `parseProjectSettingsYaml(source)`, `validateProjectSettings(value)`, `readProjectSettings(projectDir)`.
- Produces: `PROJECT_SETTINGS_SCHEMA_URI` and `projectSettingsJsonSchema` from the same Zod schema used at runtime.
- Removes: `parseProjectSettings`, `writeProjectSettings`, `version` and `useStandaloneServer`.

- [ ] **Step 1: Add Zod to `@nkdk/platform`**

Run:

```bash
pnpm --filter @nkdk/platform add zod@^4.0.0
```

Expected: `packages/platform/package.json` and `pnpm-lock.yaml` contain the existing workspace Zod 4 line without unrelated upgrades.

- [ ] **Step 2: Replace the settings tests with failing observable contracts**

Keep equivalence classes in `it.each` and assert these representative cases:

```ts
const ready = validateProjectSettings(parseProjectSettingsYaml(`
infobase:
  connectionString: 'File="/bases/demo";'
  operations:
    import:
      mode: designer-agent
`))

expect(ready).toEqual({
  ok: true,
  settings: {
    infobase: {
      connectionString: 'File="/bases/demo";',
      sessionIdleTimeout: 900,
      operations: {
        import: {
          mode: "designer-agent",
          unresolvedReferences: "include",
        },
      },
    },
  },
})
```

Add narrow tests for:

```ts
const fileInfobase = {
  connectionString: 'File="/bases/demo";',
  operations: { import: { mode: "designer-agent" } },
}
expect(validateProjectSettings({ version: 1, infobase: fileInfobase })).toMatchObject({ ok: false })
expect(validateProjectSettings({ infobase: { ...fileInfobase, useStandaloneServer: true } })).toMatchObject({ ok: false })
expect(validateProjectSettings({
  infobase: {
    connectionString: 'Srvr="cluster";Ref="base";',
    database: { dbms: "MSSQLServer", server: "db", name: "base" },
    operations: { import: { mode: "standalone-server" } },
  },
})).toMatchObject({ ok: true })
expect(validateProjectSettings({
  infobase: {
    connectionString: 'Srvr="cluster";Ref="base";',
    database: { dbms: "PostgreSQL", server: "db", name: "base" },
    operations: { import: { mode: "standalone-server" } },
  },
})).toMatchObject({ ok: false })
expect(validateProjectSettings({
  infobase: {
    connectionString: 'Srvr="cluster";Ref="base";',
    database: { dbms: "MSSQLServer", server: "db", name: "base", password: "db-password" },
    operations: { import: { mode: "standalone-server" } },
  },
})).toMatchObject({ ok: false })
expect(validateProjectSettings({
  infobase: {
    ...fileInfobase,
    database: { dbms: "PostgreSQL", server: "db", name: "base", user: "dbuser" },
  },
})).toMatchObject({ ok: false })
expect(validateProjectSettings({
  infobase: {
    connectionString: 'Srvr="cluster";Ref="base";',
    operations: { import: { mode: "standalone-server" } },
  },
})).toMatchObject({ ok: false })
```

Assert diagnostics as `{ code, path, message }`, including paths `infobase.operations.import.mode`, `infobase.database.user` and `$` for invalid YAML.

For the file boundary assert the order and results:

```ts
expect(calls).toEqual([
  "realpath /project",
  "chmod /project/.nkdk/project.yaml mode=384",
  "read /project/.nkdk/project.yaml",
])
expect(result).toMatchObject({ status: "ready", projectDir: "/project" })
```

Cover `missing`, invalid syntax, invalid structure, chmod failure on Unix and no chmod on Windows.

- [ ] **Step 3: Run the focused test and verify failure**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/settings/projectSettings.test.ts
```

Expected: FAIL because the new result types, schema and split functions do not exist.

- [ ] **Step 4: Define the final settings types and structural schema**

Use these public shapes in `sessions/types.ts`:

```ts
export type UnresolvedReferencesMode = "include" | "omit"

export type InfobaseImportSettings = {
  mode: PlatformSessionMode
  unresolvedReferences: UnresolvedReferencesMode
}

export type DatabaseConnectionSettings = {
  dbms: DatabaseManagementSystem
  server: string
  name: string
  user?: string
  password?: string
}

export type NormalizedPlatformConnectionSettings = {
  connectionString: string
  user?: string
  password?: string
  sessionIdleTimeout: number
  database?: DatabaseConnectionSettings
}

export type ProjectSettings = {
  infobase: NormalizedPlatformConnectionSettings & {
    operations: { import: InfobaseImportSettings }
  }
}
```

Define strict Zod objects with Russian `.describe(...)`, defaults `900` and `include`, four secret-free examples, and:

```ts
export const PROJECT_SETTINGS_SCHEMA_URI = "nkdk://project-settings/schema/v1"
export const projectSettingsJsonSchema = {
  ...z.toJSONSchema(projectSettingsStructuralSchema),
  $id: PROJECT_SETTINGS_SCHEMA_URI,
  examples: projectSettingsExamples,
}
```

The four examples are fixed as:

1. `File="/bases/demo";`, `designer-agent`, no user/password/database;
2. `File="/bases/demo";`, `standalone-server`, no user/password/database;
3. `Srvr="cluster";Ref="base";`, `standalone-server`, PostgreSQL `db/dbuser`, with both password fields omitted;
4. `Srvr="cluster";Ref="base";`, `standalone-server`, MSSQLServer `db/base`, with DBMS user/password omitted to select OS authentication.

Do not encode `parseConnection` or DBMS-dependent credentials twice in JSON Schema; keep those checks in `validateProjectSettings` and translate Zod issues into stable diagnostics.

- [ ] **Step 5: Implement parsing, validation and secure reading**

Use discriminated results:

```ts
export type ProjectSettingsValidationResult =
  | { ok: true; settings: ProjectSettings }
  | { ok: false; diagnostics: ProjectSettingsDiagnostic[] }

export type ProjectSettingsReadResult =
  | { status: "ready"; projectDir: string; settingsPath: string; settings: ProjectSettings }
  | { status: "missing"; projectDir: string; settingsPath: string }
  | { status: "invalid"; projectDir: string; settingsPath: string; diagnostics: ProjectSettingsDiagnostic[] }
```

`parseProjectSettingsYaml` may throw only an internal typed syntax error; `readProjectSettings` converts it into `status: "invalid"`. On Unix call `chmod(0o600)` before `readFile`; `ENOENT` from chmod/read becomes `missing`, and every other permission/read error becomes a diagnostic without embedding filesystem error text or secrets.

- [ ] **Step 6: Export the new contract and remove the writer**

Remove `writeProjectSettings` and legacy exports from `packages/platform/index.ts`. Export the schema URI, JSON Schema, functions and result types required by MCP.

- [ ] **Step 7: Run the focused tests, type-check and duplicate check**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/settings/projectSettings.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS; no new duplicate block.

- [ ] **Step 8: Commit the settings layer**

```bash
git add packages/platform/package.json packages/platform/index.ts packages/platform/src/settings packages/platform/src/sessions/types.ts pnpm-lock.yaml
git commit -m "feat!: :sparkles: изменить формат настроек платформы" -m "BREAKING CHANGE: удалены version и useStandaloneServer; режим импорта задаётся в infobase.operations.import.mode."
```

---

### Task 2: Явный режим операции и настройка неразрешённых ссылок

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
- Consumes: `PlatformSessionMode`, `UnresolvedReferencesMode`, `NormalizedPlatformConnectionSettings` from Task 1.
- Produces: `ExportConfigurationParams.mode`, `.unresolvedReferences`; `ListConfigurationExtensionsParams.mode`.
- Produces: command builders that receive a semantic `unresolvedReferences`, never a raw arbitrary flag.

- [ ] **Step 1: Add failing command tests for both values and both adapters**

```ts
it.each([
  ["include", false],
  ["omit", true],
] as const)("maps unresolved references %s", (value, expectedFlag) => {
  const designer = buildDumpConfigurationCommand("/xml", value)
  const standalone = buildStandaloneConfigExport({
    ibcmdPath: "ibcmd",
    configPath: "/session/config.yaml",
    outputDir: "/xml",
    unresolvedReferences: value,
  }).args
  expect(designer.includes("--ignore-unresolved-refs")).toBe(expectedFlag)
  expect(standalone.includes("--ignore-unresolved-refs")).toBe(expectedFlag)
})
```

Add a DBMS command test proving that absent MSSQL `database.user` and `database.password` omit both arguments.

- [ ] **Step 2: Add failing manager tests for explicit per-call mode**

Call `exportConfiguration` twice for one project with different `mode` values and assert that the incompatible cached session closes and the requested adapter opens. Assert that changing only `unresolvedReferences` reuses the same live session because it is an export option, not a connection fingerprint.

- [ ] **Step 3: Run the focused tests and verify failure**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/manager.test.ts
```

Expected: FAIL because the manager still derives mode from `useStandaloneServer` and builders have no semantic option.

- [ ] **Step 4: Change the manager and session interfaces**

Define:

```ts
export type ExportConfigurationParams = NormalizedPlatformConnectionSettings & {
  projectDir: string
  outputDir: string
  logPath: string
  mode: PlatformSessionMode
  unresolvedReferences: UnresolvedReferencesMode
  signal?: AbortSignal
}

export type ListConfigurationExtensionsParams = NormalizedPlatformConnectionSettings & {
  projectDir: string
  mode: PlatformSessionMode
  signal?: AbortSignal
}
```

Pass `params.mode` into `withSession`; delete every derivation from `useStandaloneServer`. Keep mode in `SessionFingerprint`, and pass `unresolvedReferences` only to `session.exportConfiguration`.

- [ ] **Step 5: Map semantic options in command builders**

Append `--ignore-unresolved-refs` only for `omit`. Preserve `--format=hierarchical` for the agent and the new temporary directory for `ibcmd`. Omit `--database-user` and `--database-password` when MSSQL OS authentication is selected.

- [ ] **Step 6: Adapt both sessions and their narrow tests**

Change the session method to:

```ts
exportConfiguration(
  outputDir: string,
  operationLogPath: string,
  unresolvedReferences: UnresolvedReferencesMode,
  signal?: AbortSignal,
): Promise<void>
```

Update existing fixtures rather than adding permutation-only tests.

- [ ] **Step 7: Run the platform layer and duplicate check**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/manager.test.ts src/sessions/designerAgent.test.ts src/sessions/standaloneServer.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/platform/src/sessions
git commit -m "feat: :sparkles: настраивать выгрузку по операции"
```

---

### Task 3: Безопасный журнал и подробности платформенной ошибки

**Files:**
- Create: `packages/platform/src/sessions/operationLog.ts`
- Create: `packages/platform/src/sessions/operationLog.test.ts`
- Modify: `packages/platform/src/sessions/errors.ts`
- Modify: `packages/platform/src/sessions/runtime.ts`
- Modify: `packages/platform/src/sessions/nodeRuntime.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Produces: `PlatformFailureStage`, `PlatformFailureDetails`, `PlatformOperationLog`.
- Produces: `createPlatformOperationLog`, `concisePlatformMessage`, `platformFailure`.
- Consumed by Tasks 4–7; it has no knowledge of MCP.

- [ ] **Step 1: Write failing sanitizer and lifecycle tests**

Cover literal secrets and argument forms:

```ts
expect(redactPlatformText(
  "ibcmd --password secret --database-password=db-secret /P pwd",
  ["secret", "db-secret", "pwd"],
)).toBe("ibcmd --password *** --database-password=*** /P ***")
```

Cover concise text:

```ts
expect(concisePlatformMessage("\n first failure \nsecond", "fallback"))
  .toBe("first failure")
expect(concisePlatformMessage("x".repeat(600), "fallback")).toHaveLength(500)
expect(concisePlatformMessage("", "fallback")).toBe("fallback")
```

Use an in-memory filesystem to assert initial write mode `0o600`, chronological UTF-8 events, safe command, exit code, flags, stdout/stderr, and that an append failure marks the log unavailable.

- [ ] **Step 2: Run the new test and verify failure**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/operationLog.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Define error details without storing raw output**

```ts
export type PlatformFailureStage =
  | "platform-discovery"
  | "session-start"
  | "authentication"
  | "configuration-export"
  | "platform-log"

export type PlatformFailureDetails = {
  stage: PlatformFailureStage
  mode?: PlatformSessionMode
  logPath?: string
}
```

Extend `PlatformSessionError` with `details?: PlatformFailureDetails` while preserving ordinary `ErrorOptions.cause`. Do not add stdout, stderr or command fields.

- [ ] **Step 4: Implement an append-only operation log**

Use this boundary:

```ts
export interface PlatformOperationLog {
  readonly path: string
  readonly available: boolean
  append(message: string): Promise<boolean>
  process(stage: PlatformFailureStage, launch: ProcessLaunch, result: ProcessRunResult): Promise<boolean>
  sanitize(value: string): string
}
```

`createPlatformOperationLog` creates/truncates once with mode `0o600`, chmods on Unix, and accepts injected `now()` for deterministic timestamps. `append` catches its own filesystem failure, changes `available` to false and returns `false`.

`platformFailure` must:

1. choose and sanitize the concise platform text;
2. try to append the final event;
3. include `logPath` only while the log is available;
4. preserve the source code/stage if logging also failed;
5. append «Журнал операции записать не удалось» to the message when no link can be returned.

- [ ] **Step 5: Add `appendFile` to the runtime boundary and Node implementation**

Use `fs.promises.appendFile`; do not rebuild the whole file on every event.

- [ ] **Step 6: Run focused tests, type-check and duplicate check**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/operationLog.test.ts src/sessions/nodeRuntime.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/platform/index.ts packages/platform/src/sessions
git commit -m "feat: :sparkles: добавить безопасный журнал платформы"
```

---

### Task 4: Диагностика менеджера и `ibcmd`

**Files:**
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/nodeRuntime.ts`

**Interfaces:**
- Consumes: operation log and `platformFailure` from Task 3.
- Produces: a per-export log created before platform discovery and passed into a newly created or reused session.
- Keeps: public manager input `logPath`; MCP does not construct log internals.

- [ ] **Step 1: Add failing manager tests for log creation and stages**

Inject `createOperationLog` into manager dependencies. Assert:

```ts
expect(events).toEqual(expect.arrayContaining([
  expect.stringContaining("mode=standalone-server"),
  expect.stringContaining("platform-discovery"),
  expect.stringContaining("reused=false"),
]))
```

Cover missing platform/component with `details.stage === "platform-discovery"`, selected mode, and `logPath`. Cover initial log creation failure as `stage: "platform-log"` without `logPath` and without calling `findPlatform`.

- [ ] **Step 2: Add failing `ibcmd` tests for complete safe process records**

For init and export failures return stdout/stderr containing both passwords, then assert:

```ts
expect(error).toMatchObject({
  code: "platform_command_failed",
  message: "Access denied",
  details: {
    stage: "configuration-export",
    mode: "standalone-server",
    logPath: "/project/.nkdk/tmp/op/platform.log",
  },
})
expect(operationLogText).toContain("exitCode=1")
expect(operationLogText).not.toContain("secret")
expect(operationLogText).not.toContain("database-secret")
```

Cover cancellation, timeout, a thrown process error, and a successful process followed by log append failure.

- [ ] **Step 3: Run focused tests and verify failure**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts src/sessions/standaloneServer.test.ts
```

Expected: FAIL because current code replaces platform output with general messages and overwrites the log.

- [ ] **Step 4: Create the log at the manager boundary**

At the beginning of `exportConfiguration`, construct the log with `params.password` and `params.database?.password`, then write selected mode, connection kind and authentication kinds without user names. Pass the current operation log through `withSession`, `createSession` and `session.exportConfiguration`; never cache it inside `CachedSession`.

Replace the intermediate Task 2 session signature with the final internal one:

```ts
exportConfiguration(
  outputDir: string,
  operationLog: PlatformOperationLog,
  unresolvedReferences: UnresolvedReferencesMode,
  signal?: AbortSignal,
): Promise<void>
```

The public manager input continues to accept `logPath`; only `@nkdk/platform` constructs `PlatformOperationLog`.

For a reused session, log `reused=true`. For a new session, write discovery and `session-start` events before/after the action.

- [ ] **Step 5: Record every `ibcmd` process and preserve its message**

For `server config init` and `infobase config export`:

```ts
await operationLog.process(stage, command, result)
```

Use stderr first, then stdout, when selecting the concise platform message. Map init to `session-start`, export to `configuration-export`, and keep existing cancellation/timeout codes. If a command succeeded but its required log record failed, throw `platform_command_failed` with `stage: "platform-log"`.

- [ ] **Step 6: Run focused tests, type-check and duplicate check**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts src/sessions/standaloneServer.test.ts
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/platform/src/sessions
git commit -m "feat: :sparkles: диагностировать выгрузку через ibcmd"
```

---

### Task 5: Диагностика агента Конфигуратора

**Files:**
- Modify: `packages/platform/src/sessions/sshProtocol.ts`
- Modify: `packages/platform/src/sessions/sshProtocol.test.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/runtime.ts`

**Interfaces:**
- Consumes: per-operation log from Task 4.
- Produces: `PlatformCommandSession.run(..., { operationLog })` and platform-provided error messages.

- [ ] **Step 1: Add a failing JSON-protocol error test**

Feed the protocol an error response such as:

```json
[{"type":"error","message":"Неверное имя пользователя или пароль"}]
```

Assert that `openPlatformCommandSession` rejects with code `authentication_failed` and exactly that message after sanitization, rather than «Платформа отклонила подключение».

- [ ] **Step 2: Add failing agent log tests**

Cover:

- launch command and chosen authentication kind without passwords;
- `authentication` and `configuration-export` stages;
- command failure preserving the platform text;
- copying readable `process.log` (`/Out`) into the operation log on failure;
- retaining the original platform error if `/Out` cannot be read;
- no secret in the operation log or error message;
- a reused session writing to the new operation log, not the previous one.

- [ ] **Step 3: Run focused tests and verify failure**

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/sshProtocol.test.ts src/sessions/designerAgent.test.ts
```

Expected: FAIL because the protocol discards error messages and the adapter writes only one success line.

- [ ] **Step 4: Preserve messages at the protocol boundary**

Implement a small extractor that accepts only string `message` or string `body`; otherwise use the existing stable fallback. Pass the operation log with each exchange so reused sessions do not retain the logger from their creation operation. Keep question handling for user/password unchanged and never write answers to diagnostics.

- [ ] **Step 5: Instrument agent launch and export**

Use the safe command renderer for the `1cv8` launch. On startup/authentication/export failure, attempt to read the child `process.log`, sanitize it and append it. Attach `session-start`, `authentication` or `configuration-export` and `designer-agent` to the final `PlatformSessionError`.

Replace direct `writeFile(operationLogPath, ...)` with append events. Apply the Task 3 precedence rule when log writing and platform execution fail together.

- [ ] **Step 6: Run the full platform layer and duplicate check**

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/platform/src/sessions
git commit -m "feat: :sparkles: диагностировать выгрузку через агент"
```

---

### Task 6: MCP-ресурс схемы и представление ссылок

**Files:**
- Create: `packages/mcp/src/resources/projectSettingsSchema.ts`
- Create: `packages/mcp/src/resources/projectSettingsSchema.test.ts`
- Modify: `packages/mcp/src/contracts/common.ts`
- Modify: `packages/mcp/src/contracts/common.test.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.ts`
- Modify: `packages/mcp/src/contracts/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Consumes: `PROJECT_SETTINGS_SCHEMA_URI`, `projectSettingsJsonSchema` from Task 1.
- Produces: resource registration and `importFromInfobaseToolResult(payload)`.
- Produces: `project_settings_required` and typed `details.schema`/`details.log`.

- [ ] **Step 1: Replace the input contract tests**

```ts
const inputSchema = z.strictObject(importFromInfobaseInputShape)
expect(inputSchema.parse({ projectDir: "/project", allowWrite: true }))
  .toEqual({ projectDir: "/project", allowWrite: true })

for (const forbidden of ["connectionString", "user", "password", "database", "useStandaloneServer"]) {
  expect(inputSchema.safeParse({ projectDir: "/project", [forbidden]: "x" }).success).toBe(false)
}
```

Add output parsing cases for `project_settings_required`, `invalid_project_settings` diagnostics, and a platform error with `{ stage, mode, log }`.

- [ ] **Step 2: Add failing MCP resource protocol tests**

Through `Client` and `InMemoryTransport`, assert that `resources/list` includes one entry with the exact URI `nkdk://project-settings/schema/v1` and `application/schema+json`, and `resources/read` returns the exported JSON Schema. Validate all four examples through the runtime validator.

- [ ] **Step 3: Add failing presentation tests**

```ts
expect(importFromInfobaseToolResult(platformFailure).content).toEqual([
  { type: "text", text: "Access denied" },
  {
    type: "resource_link",
    uri: "file:///project/.nkdk/tmp/import-from-infobase/op-1/platform.log",
    name: "Журнал импорта из информационной базы",
    mimeType: "text/plain",
  },
])
```

Add the corresponding «Схема настроек проекта» link and prove that no resource link is emitted when the log path is absent.

- [ ] **Step 4: Run focused tests and verify failure**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/importFromInfobase.test.ts src/resources/projectSettingsSchema.test.ts src/tools/registerTools.test.ts src/server.test.ts
```

Expected: FAIL because the old tool still accepts connection fields and the resource is not registered.

- [ ] **Step 5: Register the resource without duplicating the schema**

`projectSettingsSchema.ts` only imports the platform constants and exports registration metadata. `registerNkdkCapabilities` registers it before guide resources. Do not add `get_project_settings_schema`.

- [ ] **Step 6: Generalize named resource presentation**

Change `jsonToolResult` presentation to accept:

```ts
type ToolResourcePresentation = {
  uri: string
  name: string
  mimeType: string
}
```

Keep validation report behavior unchanged. `importFromInfobaseToolResult` inspects only typed structured details and selects the schema or log resource; it never reads platform output.

- [ ] **Step 7: Register the minimal tool contract**

Add `outputSchema`, update the Russian description to say that the user must first create `.nkdk/project.yaml`, and register the handler through `importFromInfobaseToolResult`.

- [ ] **Step 8: Run the MCP contract layer and duplicate check**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/common.test.ts src/contracts/importFromInfobase.test.ts src/resources/projectSettingsSchema.test.ts src/tools/registerTools.test.ts src/server.test.ts
pnpm --filter @nkdk/mcp type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/mcp/src/contracts packages/mcp/src/resources packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts packages/mcp/src/server.test.ts
git commit -m "feat: :sparkles: опубликовать схему настроек MCP"
```

---

### Task 7: Поток импорта только из настроек проекта

**Files:**
- Modify: `packages/mcp/src/services/importFromInfobase.ts`
- Modify: `packages/mcp/src/services/importFromInfobase.test.ts`
- Modify: `packages/mcp/src/services/listInfobaseExtensions.ts`
- Modify: `packages/mcp/src/services/listInfobaseExtensions.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`

**Interfaces:**
- Consumes: `readProjectSettings` result from Task 1 and manager parameters from Task 2.
- Produces: settings/schema errors before any target or platform action.
- Removes: every call to `writeProjectSettings` and every connection value from MCP input.

- [ ] **Step 1: Rewrite the service fixture around read results**

The success fixture starts with:

```ts
readSettings: async () => ({
  status: "ready",
  projectDir: "/project",
  settingsPath: "/project/.nkdk/project.yaml",
  settings: {
    infobase: {
      connectionString: 'File="/bases/demo";',
      user: "Администратор",
      password: "secret",
      sessionIdleTimeout: 900,
      operations: {
        import: {
          mode: "designer-agent",
          unresolvedReferences: "include",
        },
      },
    },
  },
})
```

Delete `writeSettings`, `writtenSettings` and all assertions about writing the file.

- [ ] **Step 2: Add failing order and result tests**

Assert the successful call sequence:

```ts
expect(calls).toEqual([
  "readProjectSettings /project",
  "resolveTarget /project cf",
  "assertTargetEmpty /project/cf",
  "mkdir /project/.nkdk/tmp/import-from-infobase/op-1/xml",
  "exportConfiguration",
  "syncConfigurationFromXML move",
  "rm /project/.nkdk/tmp/import-from-infobase/op-1",
])
```

Add cases:

- `missing` → `project_settings_required`, schema details, no target/platform call;
- `invalid` → diagnostics and schema details, no target/platform call;
- platform error → original sanitized `message`, stage/mode, `file:` log URI and preserved temp directory;
- platform error without `logPath` → no link details;
- full success → `settingsPath` from read result and no settings write;
- partial XML → YAML failure → existing successful partial payload and preserved temp directory;
- cancellation before and after export.

- [ ] **Step 3: Run focused tests and verify failure**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/services/importFromInfobase.test.ts src/services/listInfobaseExtensions.test.ts src/tools/registerTools.test.ts
```

Expected: FAIL because the service still reads connection fields from input and writes project settings after success.

- [ ] **Step 4: Implement the approved order**

After `allowWrite`, call `readProjectSettings(input.projectDir)`. Return settings errors immediately. Only `status: "ready"` may resolve/check `cf` and create the temporary directory.

Pass to the manager:

```ts
const { operations, ...connection } = read.settings.infobase
await platformManager.exportConfiguration({
  projectDir: read.projectDir,
  outputDir: xmlDirectory,
  logPath,
  ...connection,
  mode: operations.import.mode,
  unresolvedReferences: operations.import.unresolvedReferences,
  signal,
})
```

On `PlatformSessionError`, preserve its cleaned message and convert only `details.logPath` with `pathToFileURL`. Unexpected errors keep the stable NKDK message.

- [ ] **Step 5: Reuse the same settings result in extension listing**

For the existing extension operation, use `operations.import.mode` as the current read-side platform mode and pass only normalized connection fields. Return the same missing/invalid settings codes; do not recreate validation locally.

- [ ] **Step 6: Run the complete changed packages and duplicate check**

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/platform type-check
pnpm --filter @nkdk/mcp type-check
pnpm duplicates -- --base 90eb79f7d
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/mcp/src/services packages/mcp/src/tools/registerTools.test.ts
git commit -m "feat!: :sparkles: читать настройки импорта из проекта" -m "BREAKING CHANGE: import_from_infobase больше не принимает параметры подключения; подготовьте .nkdk/project.yaml по MCP-схеме."
```

---

### Task 8: Реальная интеграционная проверка и полная приёмка

**Files:**
- Create: `packages/mcp/src/services/importFromInfobase.integration.test.ts`
- Verify only: all files changed in Tasks 1–7

**Interfaces:**
- Consumes: `NKDK_TEST_INFOBASE_PATH`, `NKDK_TEST_INFOBASE_USER`, `NKDK_TEST_INFOBASE_PASSWORD`, `NKDK_TEST_INFOBASE_MODES`.
- Produces: an opt-in, skipped-by-default test of the actual installed 1C platform and a file base.

- [ ] **Step 1: Add an opt-in test with no embedded local data**

Gate the suite:

```ts
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { stringify } from "yaml"
import { afterEach, describe, expect, it } from "vitest"
import { importFromInfobase } from "./importFromInfobase"
import { closePlatformSessionManager } from "./platformSessionHandle"

const requiredVariables = [
  "NKDK_TEST_INFOBASE_PATH",
  "NKDK_TEST_INFOBASE_USER",
  "NKDK_TEST_INFOBASE_PASSWORD",
] as const
const hasInfobase = requiredVariables.every((name) => process.env[name] !== undefined)
const describeInfobase = hasInfobase ? describe : describe.skip
const modes = (process.env["NKDK_TEST_INFOBASE_MODES"] ?? "designer-agent")
  .split(",")
  .map((mode) => mode.trim())
  .filter((mode): mode is "designer-agent" | "standalone-server" =>
    mode === "designer-agent" || mode === "standalone-server"
  )

describeInfobase("real infobase import", () => {
  const temporaryProjects: string[] = []
  afterEach(async () => {
    await closePlatformSessionManager()
    await Promise.all(temporaryProjects.splice(0).map((path) => rm(path, { recursive: true, force: true })))
  })

  it.each(modes)("imports through %s", async (mode) => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-infobase-import-"))
    temporaryProjects.push(projectDir)
    const settingsDir = join(projectDir, ".nkdk")
    await mkdir(settingsDir, { recursive: true })
    await writeFile(join(settingsDir, "project.yaml"), stringify({
      infobase: {
        connectionString: `File="${requiredEnv("NKDK_TEST_INFOBASE_PATH")}";`,
        user: requiredEnv("NKDK_TEST_INFOBASE_USER"),
        password: requiredEnv("NKDK_TEST_INFOBASE_PASSWORD"),
        operations: { import: { mode, unresolvedReferences: "include" } },
      },
    }), { mode: 0o600 })

    const result = await importFromInfobase({ projectDir, allowWrite: true })

    expect(result).toMatchObject({ ok: true, mode, failed: [] })
    expect((await stat(join(projectDir, "cf"))).isDirectory()).toBe(true)
    expect(JSON.stringify(result)).not.toContain(requiredEnv("NKDK_TEST_INFOBASE_PASSWORD"))
  }, 30 * 60 * 1000)

  it("returns a safe error and log for a wrong password", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "nkdk-infobase-error-"))
    temporaryProjects.push(projectDir)
    const settingsDir = join(projectDir, ".nkdk")
    await mkdir(settingsDir, { recursive: true })
    await writeFile(join(settingsDir, "project.yaml"), stringify({
      infobase: {
        connectionString: `File="${requiredEnv("NKDK_TEST_INFOBASE_PATH")}";`,
        user: requiredEnv("NKDK_TEST_INFOBASE_USER"),
        password: "__nkdk_wrong_password__",
        operations: { import: { mode: "designer-agent", unresolvedReferences: "include" } },
      },
    }), { mode: 0o600 })

    const result = await importFromInfobase({ projectDir, allowWrite: true })
    expect(result).toMatchObject({ ok: false, details: { stage: "authentication" } })
    if (result.ok || !isLogDetails(result.details)) throw new Error("expected platform log")
    const log = await readFile(fileURLToPath(result.details.log.uri), "utf8")
    expect(log).not.toContain("__nkdk_wrong_password__")
  }, 30 * 60 * 1000)
})

function requiredEnv(name: typeof requiredVariables[number]): string {
  const value = process.env[name]
  if (value === undefined) throw new Error(`${name} is required`)
  return value
}

function isLogDetails(value: unknown): value is { log: { uri: string } } {
  return typeof value === "object"
    && value !== null
    && "log" in value
    && typeof value.log === "object"
    && value.log !== null
    && "uri" in value.log
    && typeof value.log.uri === "string"
}
```

Run selected modes sequentially, never in parallel. Assert success, non-empty `cf`, returned mode and absence of both passwords from serialized MCP output. Add one wrong-infobase-password case that asserts a short error plus an existing `platform.log` containing no supplied password.

- [ ] **Step 2: Run unit tests first**

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
```

Expected: PASS; real test is skipped when variables are absent.

- [ ] **Step 3: Run the supplied file base through both modes**

Set the four variables only in the local shell. Use the supplied path, user and password without placing their literal values in this file or a command saved in Git. Ensure the file base is closed in other 1C processes before the standalone run.

```bash
pnpm --filter @nkdk/mcp exec vitest run src/services/importFromInfobase.integration.test.ts --testTimeout=1800000
```

Expected: the valid credential cases pass for `designer-agent` and `standalone-server`; the wrong-password case returns a concise sanitized error and readable log. If the local platform cannot run one mode, record the exact safe reason rather than weakening the test.

- [ ] **Step 4: Run complete repository verification**

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm duplicates -- --base 90eb79f7d
```

Expected: all commands PASS and no new duplicate block.

- [ ] **Step 5: Review security and test inventory**

Run:

```bash
rg -n -F "$NKDK_TEST_INFOBASE_PATH" packages --glob '!**/*.test.ts'
rg -n -F "$NKDK_TEST_INFOBASE_PASSWORD" packages --glob '!**/*.test.ts'
git diff 90eb79f7d --check
git status --short
```

Expected: no supplied local path or password in committed production/docs files; only deliberate synthetic test secrets may occur in test sources. In the final report enumerate every added/expanded test and its unique protected contract, and report that `.agents/architecture.md` still describes the previous import input/settings flow.

- [ ] **Step 6: Commit the integration test**

```bash
git add packages/mcp/src/services/importFromInfobase.integration.test.ts
git commit -m "test: :white_check_mark: добавить проверку импорта из базы"
```
