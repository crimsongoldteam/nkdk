# List Infobase Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить публичный MCP-инструмент `nkdk.list_infobase_extensions`, который читает подключение из `.nkdk/project.yaml` и возвращает единый типизированный список расширений через агент Конфигуратора или offline-режим `ibcmd`.

**Architecture:** `@nkdk/mcp` отвечает только за чтение настроек и публичный договор. `PlatformSessionManager` переиспользует существующий жизненный цикл сеанса, а адаптеры `designer-agent` и `standalone-server` выполняют разные команды и нормализуют их ответы в общий `ConfigurationExtensionInfo[]`.

**Tech Stack:** TypeScript 6, Node.js, Vitest 4, Zod 4, MCP SDK, SSH-протокол агента Конфигуратора, `ibcmd` 8.3.27.

## Global Constraints

- Вход MCP содержит только непустой `projectDir`; параметры подключения читаются только из `.nkdk/project.yaml`.
- Поддерживаются `designer-agent` и `standalone-server`, а также допустимые текущими настройками подключения `File` и `Srvr`/`Ref`.
- Публичный элемент списка содержит `name`, `version`, `active`, `purpose`, `safeMode`, `securityProfileName`, `unsafeActionProtection`, `usedInDistributedInfobase`, `scope`, `hashSum`.
- Порядок платформы сохраняется; пустой список является успехом; частичный список не возвращается.
- Области данных и значения разделителей не задаются.
- Операция ничего не записывает и не требует `allowWrite`.
- Сырые ответы, команды, `stdout`, `stderr` и секреты не входят в MCP-результат.
- Автоматические тесты полностью мокированы и не запускают 1С.
- `.agents/architecture.md` обновляется в рамках реализации.

---

### Task 1: Типизированный договор и строгий разбор свойств расширений

**Files:**
- Create: `packages/platform/src/extensions/types.ts`
- Create: `packages/platform/src/extensions/parse.ts`
- Create: `packages/platform/src/extensions/parse.test.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Produces:

```ts
export type ConfigurationExtensionPurpose = "customization" | "add-on" | "patch"
export type ConfigurationExtensionScope = "infobase" | "data-separation"

export type ConfigurationExtensionInfo = {
  name: string
  version: string
  active: boolean
  purpose: ConfigurationExtensionPurpose
  safeMode: boolean
  securityProfileName: string
  unsafeActionProtection: boolean
  usedInDistributedInfobase: boolean
  scope: ConfigurationExtensionScope
  hashSum: string
}

export function parseExtensionPropertyRecords(
  records: readonly unknown[]
): ConfigurationExtensionInfo[]

export function parseIbcmdExtensionList(
  source: string
): ConfigurationExtensionInfo[]
```

- [ ] **Step 1: Написать падающие тесты общего нормализатора**

В `parse.test.ts` задать полный ответ с платформенными ключами и проверить точный результат:

```ts
const raw = {
  name: "Patch",
  version: "",
  active: "yes",
  purpose: "patch",
  "safe-mode": "no",
  "security-profile-name": "",
  "unsafe-action-protection": "yes",
  "used-in-distributed-infobase": "no",
  scope: "infobase",
  "hash-sum": "+0jilJURdR/U2I/ncgzahEAQU4Y=",
}

expect(parseExtensionPropertyRecords([raw])).toEqual([{
  name: "Patch",
  version: "",
  active: true,
  purpose: "patch",
  safeMode: false,
  securityProfileName: "",
  unsafeActionProtection: true,
  usedInDistributedInfobase: false,
  scope: "infobase",
  hashSum: "+0jilJURdR/U2I/ncgzahEAQU4Y=",
}])
```

Добавить отдельные проверки пустого массива, сохранения порядка,
`customization`/`add-on`, `data-separation`, логических значений агента,
текстовых `yes`/`no` от `ibcmd`, неизвестного поля, отсутствующего поля,
некорректного значения, назначения и области.

- [ ] **Step 2: Запустить тест нормализатора и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/extensions/parse.test.ts
```

Expected: FAIL из-за отсутствующих модулей `types.ts` и `parse.ts`.

- [ ] **Step 3: Реализовать общий строгий нормализатор**

В `parse.ts` проверять, что запись является обычным объектом и содержит ровно десять разрешённых ключей. Вынести небольшие функции:

```ts
function requiredString(record: Record<string, unknown>, key: string): string
function yesNo(record: Record<string, unknown>, key: string): boolean
function enumValue<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<T>
): T
```

Любое нарушение преобразовывать в:

```ts
new PlatformSessionError(
  "platform_command_failed",
  "Платформа вернула некорректные свойства расширения"
)
```

Не включать исходное значение в текст ошибки.

- [ ] **Step 4: Написать падающие тесты табличного вывода `ibcmd`**

Использовать мок фактической формы 8.3.27:

```text
name                         : "TestExtension"
version                      :
active                       : yes
purpose                      : customization
safe-mode                    : yes
security-profile-name        :
unsafe-action-protection     : yes
used-in-distributed-infobase : no
scope                        : infobase
hash-sum                     : "+0jilJURdR/U2I/ncgzahEAQU4Y="
```

Проверить одну и две записи, пустой/пробельный вывод, сохранение двоеточия внутри строкового значения, повреждённую строку без `:`, повторный ключ и неизвестный ключ.

- [ ] **Step 5: Реализовать разбор `ibcmd`**

Разделять записи пустой строкой, а строку свойства — по первому `:`. Удалять выравнивающие пробелы. Значения в двойных кавычках разбирать как JSON-строки, пустое значение превращать в `""`, остальные оставлять строками для общего нормализатора. Затем вызывать `parseExtensionPropertyRecords`.

- [ ] **Step 6: Экспортировать публичные типы и прогнать тесты**

В `packages/platform/index.ts` экспортировать три типа сведений и обе функции разбора не экспортировать.

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/extensions/parse.test.ts
pnpm --filter @nkdk/platform run type-check
```

Expected: PASS.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/platform/src/extensions packages/platform/index.ts
git commit -m "feat: :sparkles: типизировать свойства расширений базы"
```

---

### Task 2: Содержательные ответы SSH-протокола

**Files:**
- Modify: `packages/platform/src/sessions/runtime.ts`
- Modify: `packages/platform/src/sessions/sshProtocol.ts`
- Modify: `packages/platform/src/sessions/sshProtocol.test.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`

**Interfaces:**
- Consumes: платформенное сообщение `type: "success"` с массивом записей
  `type: "extension-properties"` в `body`.
- Produces:

```ts
export type PlatformCommandResult = {
  extensionInfo: unknown[]
}

export interface PlatformCommandSession {
  run(
    command: string,
    options?: { signal?: AbortSignal }
  ): Promise<PlatformCommandResult>
  // остальные методы без изменений
}
```

- [ ] **Step 1: Написать падающие тесты захвата `extension-properties`**

В `sshProtocol.test.ts` вернуть две записи внутри `body` завершающего
`success`:

```json
[
  {
    "type":"success",
    "message":"Done",
    "body":[
      {"type":"extension-properties","body":{"name":"First"}},
      {"type":"extension-properties","body":{"name":"Second"}}
    ]
  }
]
```

Ожидать:

```ts
await expect(session.run("config extensions properties get --all-extensions"))
  .resolves.toEqual({
    extensionInfo: [{ name: "First" }, { name: "Second" }],
  })
```

Добавить тесты пустого результата, нескольких JSON-порций до `success`, отсутствующего `body` и неожиданного типа сообщения. Последние два случая должны давать `platform_command_failed` без содержимого ответа.

- [ ] **Step 2: Запустить тест протокола и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/sshProtocol.test.ts
```

Expected: FAIL, потому что `run()` возвращает `void` и не извлекает
`extension-properties` из `success.body`.

- [ ] **Step 3: Реализовать накопление содержательного ответа**

Добавить в `PendingExchange` массив `extensionInfo`. При сообщении `success`
обойти его массив `body`, у каждой записи `extension-properties` потребовать
собственное `body` и добавить только его. Затем завершать обмен значением:

```ts
{ extensionInfo: [...pending.extensionInfo] }
```

`question`, `error`, `cancel`, таймер и `AbortSignal` оставить с текущей
семантикой. Тексты сообщений платформы не сохранять.

- [ ] **Step 4: Обновить существующие ожидания и моки**

Заменить ожидание `resolves.toBeUndefined()` на
`resolves.toEqual({ extensionInfo: [] })`. В моках `commandSession.run` из
`designerAgent.test.ts` после обычной команды возвращать
`{ extensionInfo: [] }`; ветки ошибок и зависания не менять.

- [ ] **Step 5: Прогнать протокол, агентный адаптер и проверку типов**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run \
  src/sessions/sshProtocol.test.ts \
  src/sessions/designerAgent.test.ts
pnpm --filter @nkdk/platform run type-check
```

Expected: PASS.

- [ ] **Step 6: Создать коммит**

```bash
git add packages/platform/src/sessions/runtime.ts \
  packages/platform/src/sessions/sshProtocol.ts \
  packages/platform/src/sessions/sshProtocol.test.ts \
  packages/platform/src/sessions/designerAgent.test.ts
git commit -m "feat: :sparkles: получать данные команд агента 1С"
```

---

### Task 3: Получение расширений в обоих адаптерах платформы

**Files:**
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`

**Interfaces:**
- Consumes:
  - `parseExtensionPropertyRecords(records)`
  - `parseIbcmdExtensionList(stdout)`
- Produces:

```ts
export interface PlatformSession {
  // существующие поля
  listExtensions(signal?: AbortSignal): Promise<ConfigurationExtensionInfo[]>
}

export function buildListDesignerExtensionsCommand(): string

export function buildStandaloneListExtensions(params: {
  ibcmdPath: string
  configPath: string
  user?: string
  password?: string
}): ProcessLaunch
```

- [ ] **Step 1: Написать падающие тесты построителей команд**

Ожидать:

```ts
expect(buildListDesignerExtensionsCommand()).toBe(
  "config extensions properties get --all-extensions"
)

expect(buildStandaloneListExtensions({
  ibcmdPath: "ibcmd",
  configPath: "/session/config.yaml",
  user: "Admin",
  password: "secret",
})).toEqual({
  command: "ibcmd",
  args: [
    "infobase", "config", "extension", "list",
    "--user=Admin",
    "--password=secret",
    "--config=/session/config.yaml",
  ],
})
```

Отдельно проверить отсутствие необязательных `--user` и `--password`.

- [ ] **Step 2: Запустить тест построителей и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts
```

Expected: FAIL из-за отсутствующих функций.

- [ ] **Step 3: Реализовать построители команд**

Использовать только массив аргументов для `ibcmd`; не применять shell и не
включать команду или пароль в диагностику.

- [ ] **Step 4: Написать падающие тесты `designer-agent`**

Расширить фикстуру параметром `extensionInfo?: unknown[]`. Проверить:

```ts
await expect(session.listExtensions()).resolves.toEqual(expectedExtensions)
expect(fixture.calls).toContain(
  "shell.run config extensions properties get --all-extensions"
)
```

Добавить пустой список, ошибку строгого разбора, закрытый сеанс и передачу
`AbortSignal`.

- [ ] **Step 5: Реализовать `designer-agent.listExtensions`**

Проверить `closed`, выполнить команду через `commandSession.run(command,
{ signal })` и передать `result.extensionInfo` в
`parseExtensionPropertyRecords`. Не добавлять файловых операций и журнал.

- [ ] **Step 6: Написать падающие тесты `standalone-server`**

Расширить мок `processRuntime.run`, чтобы команда с `extension` возвращала
табличный `listStdout`. Проверить полный/пустой список, точные аргументы,
`commandTimeoutMs`, `AbortSignal`, `terminationGraceMs`, ненулевой код,
`timedOut`, `cancelled`, повреждённый вывод и закрытый сеанс.

- [ ] **Step 7: Реализовать `standalone-server.listExtensions`**

Перед запуском проверить `signal?.aborted` и закрытый сеанс. Вызвать
`processRuntime.run` с:

```ts
{
  timeoutMs: dependencies.commandTimeoutMs,
  signal,
  terminationGraceMs: dependencies.closeTimeoutMs,
}
```

`timedOut` преобразовать в `session_timeout`, `cancelled` — в
`operation_cancelled`, ненулевой код — в `platform_command_failed`. При успехе
вызвать `parseIbcmdExtensionList(stdout)`. `stderr` в исключение не включать.

- [ ] **Step 8: Прогнать тесты адаптеров и проверку типов**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run \
  src/sessions/commands.test.ts \
  src/sessions/designerAgent.test.ts \
  src/sessions/standaloneServer.test.ts
pnpm --filter @nkdk/platform run type-check
```

Expected: PASS.

- [ ] **Step 9: Создать коммит**

```bash
git add packages/platform/src/sessions
git commit -m "feat: :sparkles: читать расширения в обоих режимах 1С"
```

---

### Task 4: Общий жизненный цикл операции в менеджере сеансов

**Files:**
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/platform/index.ts`
- Modify: `packages/mcp/src/services/platformSessionHandle.test.ts`
- Modify: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Produces:

```ts
export type ListConfigurationExtensionsParams =
  PlatformConnectionSettings & {
    projectDir: string
    signal?: AbortSignal
  }

export type ListConfigurationExtensionsResult = {
  extensions: ConfigurationExtensionInfo[]
  mode: PlatformSessionMode
  reusedConnection: boolean
}

export interface PlatformSessionManager {
  exportConfiguration(params: ExportConfigurationParams): Promise<ExportConfigurationResult>
  listExtensions(
    params: ListConfigurationExtensionsParams
  ): Promise<ListConfigurationExtensionsResult>
  // close methods без изменений
}
```

- [ ] **Step 1: Написать падающие тесты менеджера**

Расширить `FakeSession` методом `listExtensions` и счётчиком вызовов. Проверить:

- первый список создаёт сеанс и возвращает `reusedConnection: false`;
- список после экспорта с тем же отпечатком использует тот же сеанс и возвращает
  `reusedConnection: true`;
- список и экспорт одного проекта выполняются последовательно;
- другой проект выполняется независимо;
- список повторно запускает таймер простоя;
- изменение режима, пользователя, пароля или СУБД заменяет сеанс;
- отмена вызывает `cancel`, удаляет сеанс и не запускает таймер;
- обычная ошибка сохраняет живой сеанс для повтора.

Основное ожидание:

```ts
await expect(manager.listExtensions(listParams())).resolves.toEqual({
  extensions: expectedExtensions,
  mode: "designer-agent",
  reusedConnection: false,
})
```

- [ ] **Step 2: Запустить тест менеджера и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts
```

Expected: FAIL, потому что `PlatformSessionManager.listExtensions` отсутствует.

- [ ] **Step 3: Выделить внутренний исполнитель операции над сеансом**

В `manager.ts` создать внутреннюю функцию:

```ts
async function withSession<T>(params: {
  projectDir: string
  settings: PlatformConnectionSettings
  signal?: AbortSignal
  run(session: PlatformSession): Promise<T>
}): Promise<{
  value: T
  mode: PlatformSessionMode
  reusedConnection: boolean
}>
```

Перенести в неё существующие очередь, отпечаток, замену сеанса, отмену и таймер.
`exportConfiguration` до входа в `withSession` отдельно канонизирует
`outputDir`, затем передаёт только предметный вызов `session.exportConfiguration`.
Сохранить текущее поведение всех экспортных тестов.

- [ ] **Step 4: Реализовать `listExtensions`**

Нормализовать настройки тем же `normalizePlatformConnectionSettings`, вызвать:

```ts
withSession({
  projectDir: params.projectDir,
  settings: params,
  signal: params.signal,
  run: (session) => session.listExtensions(params.signal),
})
```

Преобразовать внутренний `value` в публичное поле `extensions`.

- [ ] **Step 5: Обновить экспорты и моки менеджера**

Экспортировать новые типы из `packages/platform/index.ts`. Добавить
`listExtensions` в фабрики менеджера в
`platformSessionHandle.test.ts` и мок `@nkdk/platform` в `server.test.ts`, не
меняя поведение существующих тестов.

- [ ] **Step 6: Прогнать тесты менеджера и затронутых потребителей**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/manager.test.ts
pnpm --filter @nkdk/platform run type-check
pnpm --filter @nkdk/mcp exec vitest run \
  src/services/platformSessionHandle.test.ts \
  src/server.test.ts
pnpm --filter @nkdk/mcp run type-check
```

Expected: PASS.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/platform/src/sessions \
  packages/platform/index.ts \
  packages/mcp/src/services/platformSessionHandle.test.ts \
  packages/mcp/src/server.test.ts
git commit -m "refactor: :recycle: обобщить операции сеанса платформы"
```

---

### Task 5: Публичный MCP-договор и сервис

**Files:**
- Create: `packages/mcp/src/contracts/listInfobaseExtensions.ts`
- Create: `packages/mcp/src/contracts/listInfobaseExtensions.test.ts`
- Create: `packages/mcp/src/services/listInfobaseExtensions.ts`
- Create: `packages/mcp/src/services/listInfobaseExtensions.test.ts`

**Interfaces:**
- Consumes:
  - `readProjectSettings(projectDir)`
  - `PlatformSessionManager.listExtensions(params)`
- Produces:

```ts
export const listInfobaseExtensionsInputShape = {
  projectDir: z.string().min(1),
}

export type ListInfobaseExtensionsInput = {
  projectDir: string
}

export async function listInfobaseExtensions(
  input: ListInfobaseExtensionsInput,
  dependencies?: ListInfobaseExtensionsDependencies,
  signal?: AbortSignal
): Promise<ListInfobaseExtensionsPayload>
```

- [ ] **Step 1: Написать падающие тесты Zod-договора**

Проверить непустой `projectDir`, запрет лишних полей и полный успешный ответ:

```ts
{
  ok: true,
  extensions: [expectedExtension],
  mode: "standalone-server",
  reusedConnection: true,
}
```

Проверить пустой список и общий ошибочный ответ.

- [ ] **Step 2: Реализовать строгий MCP-договор**

Создать строгую схему элемента со всеми десятью полями. Для `purpose`, `scope`
и `mode` использовать `z.enum`, для признаков — `z.boolean`. Выход сделать
объединением строгого успеха и `toolErrorOutputShape`.

- [ ] **Step 3: Написать падающие тесты сервиса**

С моками `readSettings` и `platformManager.listExtensions` проверить:

- настройки прочитаны по `projectDir`;
- в менеджер переданы `projectDir`, все поля `settings.infobase` и тот же
  `AbortSignal`;
- успешный полный и пустой список возвращаются без изменений;
- отсутствие файла настроек даёт `invalid_project_settings`;
- каждый `PlatformSessionError` сохраняет свой код, но не исходное сообщение;
- неизвестная ошибка даёт `core_error`;
- пароли базы и СУБД отсутствуют в сериализованном результате.

- [ ] **Step 4: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run \
  src/contracts/listInfobaseExtensions.test.ts \
  src/services/listInfobaseExtensions.test.ts
```

Expected: FAIL из-за отсутствующих договора и сервиса.

- [ ] **Step 5: Реализовать сервис**

Использовать зависимости:

```ts
export interface ListInfobaseExtensionsDependencies {
  readSettings: typeof readProjectSettings
  platformManager: Pick<PlatformSessionManager, "listExtensions">
}
```

Если `readSettings` вернул `undefined`, вернуть:

```ts
toolError(
  "invalid_project_settings",
  "Не найдены настройки подключения проекта"
)
```

При `PlatformSessionError` сохранить только `caught.code`, а сообщение заменить
на `Операция платформы завершилась с ошибкой: <code>`. Для остальных ошибок
вернуть `core_error` и `Не удалось получить список расширений информационной
базы`.

- [ ] **Step 6: Прогнать новые тесты и проверку типов**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run \
  src/contracts/listInfobaseExtensions.test.ts \
  src/services/listInfobaseExtensions.test.ts
pnpm --filter @nkdk/mcp run type-check
```

Expected: PASS.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/mcp/src/contracts/listInfobaseExtensions* \
  packages/mcp/src/services/listInfobaseExtensions*
git commit -m "feat: :sparkles: добавить сервис списка расширений базы"
```

---

### Task 6: Регистрация MCP-инструмента и пакетный smoke-тест

**Files:**
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `packages/mcp/scripts/smoke-packed.mjs`

**Interfaces:**
- Consumes:
  - `listInfobaseExtensionsInputShape`
  - `listInfobaseExtensions(input, dependencies?, signal?)`
- Produces: публичный инструмент `nkdk.list_infobase_extensions`.

- [ ] **Step 1: Написать падающий тест регистрации**

Добавить имя после `nkdk.list_infobases` и проверить описание:

```ts
expect(description).toContain(".nkdk/project.yaml")
expect(description).toContain("Не изменяет")
expect(description).toContain("агент")
expect(description).toContain("ibcmd")
```

Добавить фабрику обработчика по образцу импорта и тест, что MCP
`extra.signal` передан сервису третьим аргументом.

- [ ] **Step 2: Запустить тест регистрации и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run src/tools/registerTools.test.ts
```

Expected: FAIL, потому что инструмент не зарегистрирован.

- [ ] **Step 3: Зарегистрировать инструмент**

Добавить:

```ts
server.registerTool(
  "nkdk.list_infobase_extensions",
  {
    title: "List 1C infobase extensions",
    description:
      "Читает настройки подключения из .nkdk/project.yaml и возвращает свойства расширений через агент 1С или offline-режим ibcmd. Не изменяет проект и базу.",
    inputSchema: listInfobaseExtensionsInputShape,
  },
  createListInfobaseExtensionsHandler()
)
```

Фабрика обработчика должна передавать `extra.signal` аналогично
`createImportFromInfobaseHandler`.

- [ ] **Step 4: Добавить проверку через MCP-протокол**

В `server.test.ts` мокировать сервис/менеджер так, чтобы вызов нового
инструмента с временным `projectDir` возвращал контролируемый пустой список, не
запуская платформу. Проверить `structuredContent` и отсутствие `isError`.

- [ ] **Step 5: Обновить пакетный smoke-тест**

Добавить `nkdk.list_infobase_extensions` в проверку списка инструментов.
Не вызывать его в упакованном процессе: smoke-каталог намеренно не содержит
настроек, а поведение сервиса уже покрыто мокированным MCP-тестом.

- [ ] **Step 6: Прогнать MCP-тесты, сборку и smoke**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run \
  src/tools/registerTools.test.ts \
  src/server.test.ts
pnpm --filter @nkdk/mcp run type-check
pnpm --filter @nkdk/mcp run test:packed
```

Expected: PASS; упакованный сервер содержит новый инструмент.

- [ ] **Step 7: Создать коммит**

```bash
git add packages/mcp/src/tools \
  packages/mcp/src/server.test.ts \
  packages/mcp/scripts/smoke-packed.mjs
git commit -m "feat: :sparkles: опубликовать список расширений через MCP"
```

---

### Task 7: Архитектурное описание и полная проверка

**Files:**
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-07-29-list-infobase-extensions-design.md` (уже уточнён по фактическому выводу `ibcmd`)

**Interfaces:**
- Consumes: окончательные имена типов, методов и MCP-инструмента из Tasks 1–6.
- Produces: актуальное нормативное описание операции и её результатов.

- [ ] **Step 1: Добавить операцию в оглавление и раздел операций**

После «Получение списка баз» добавить «Получение списка расширений
информационной базы» и указать публичный MCP-инструмент
`nkdk.list_infobase_extensions`.

Таблица должна содержать четыре действия:

1. чтение `.nkdk/project.yaml` и проверку сохранённых настроек;
2. получение/переиспользование сеанса платформы по общей очереди проекта;
3. чтение свойств: одна команда
   `config extensions properties get --all-extensions` для агента либо одна
   `ibcmd infobase config extension list` для offline-режима;
4. строгую нормализацию и атомарное формирование результата с `mode` и
   `reusedConnection`.

Явно зафиксировать отсутствие разделителей, записи и частичного результата.

- [ ] **Step 2: Добавить артефакты**

В таблицу артефактов добавить:

- `Параметры получения списка расширений` — корень проекта и необязательный
  `AbortSignal`, без подключения и `allowWrite`;
- `Сырые свойства расширений базы` — внутренние ответы выбранного адаптера без
  публичного доступа;
- `Сведения о расширении базы` — десять нормализованных полей;
- `Список расширений базы` — упорядоченный атомарный список;
- `Результат получения списка расширений` — список, режим и признак
  переиспользования.

Сослаться на существующие `Настройки проекта`, `Установка платформы` и `Сеанс
платформы`, не создавать их дубликаты.

- [ ] **Step 3: Проверить согласованность документации**

Run:

```bash
rg -n "list_infobase_extensions|Получение списка расширений|Список расширений базы" \
  .agents/architecture.md \
  docs/superpowers/specs/2026-07-29-list-infobase-extensions-design.md
git diff --check
```

Expected: инструмент, операция и артефакты присутствуют; ошибок пробелов нет.

- [ ] **Step 4: Запустить целевые проверки типов и тесты**

Run:

```bash
pnpm --filter @nkdk/platform run type-check
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp run type-check
pnpm --filter @nkdk/mcp test
```

Expected: PASS.

- [ ] **Step 5: Запустить полный набор проекта**

Run:

```bash
pnpm test
```

Expected: все пакеты PASS. Исходная база сравнения: platform — 17 файлов/127
тестов, core — 659 файлов/4936 тестов, MCP — 22 файла/109 тестов; итоговые
счётчики platform и MCP должны вырасти только за счёт новых тестов.

- [ ] **Step 6: Создать документирующий коммит**

```bash
git add .agents/architecture.md \
  docs/superpowers/specs/2026-07-29-list-infobase-extensions-design.md
git commit -m "docs: :memo: описать получение расширений из базы"
```

- [ ] **Step 7: Проверить чистоту рабочего дерева**

Run:

```bash
git status --short
git log --oneline --decorate -7
```

Expected: рабочее дерево чистое, семь тематических коммитов видны в текущей
ветке.
