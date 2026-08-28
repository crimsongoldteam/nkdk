# Client-server Standalone Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разрешить импорт конфигурации и получение списка расширений клиент-серверной базы через автономный сервер, не разрешая частичную загрузку в эту базу.

**Architecture:** `createStandaloneServerSession` выбирает существующий `databasePath` для файловой базы и существующий блок `database` для клиент-серверной. Читающие методы сеанса остаются общими, а запись защищается на двух границах: менеджер отклоняет вызов до поиска платформы, уже созданный автономный сеанс — до подготовки ZIP.

**Tech Stack:** TypeScript 7, Vitest 4, Node.js 26, `ibcmd`/`ibsrv` платформы 1С 8.3.27, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-08-29-client-server-standalone-import-design.md`

## Global Constraints

- Поддерживаются только читающие операции: импорт основной конфигурации или одного расширения и получение списка расширений.
- Частичная загрузка через `standalone-server` для `Srvr`/`Ref` остаётся запрещённой и не должна запускать платформу.
- Формат `.nkdk/project.yaml` не меняется; `infobase.database` остаётся единственным источником параметров СУБД.
- Поддерживаемые СУБД не меняются: `MSSQLServer`, `PostgreSQL`, `IBMDB2`, `OracleDatabase`.
- Для MSSQL отсутствие `database.user` и `database.password` означает авторизацию ОС; для остальных СУБД действует существующая проверка пользователя.
- Пароли пользователя информационной базы и СУБД не должны попадать в пользовательские ошибки и журнал.
- Новые unit-тесты используют только фейки из существующих `standaloneServer.test.ts` и `manager.test.ts`; сеть, процессы, файловая система и СУБД не вызываются.
- Базовый коммит для проверки дублей: `a93a394d1` (`origin/develop` на момент создания worktree).

## File Structure

- `packages/platform/src/sessions/standaloneServer.ts` — выбор параметров `ibcmd` по виду подключения и защитный запрет записи в уже открытом клиент-серверном сеансе.
- `packages/platform/src/sessions/standaloneServer.test.ts` — договор создания читающего клиент-серверного автономного сеанса, обязательность `database` и локальный запрет записи.
- `packages/platform/src/sessions/manager.ts` — ранняя граница запрета клиент-серверной автономной загрузки до поиска платформы.
- `packages/platform/src/sessions/manager.test.ts` — проверка раннего отказа без создания сеанса.
- `packages/platform/src/sessions/commands.test.ts` — существующие договоры аргументов PostgreSQL и MSSQL; изменять только если целевые тесты выявят расхождение.
- `README.md` и `packages/mcp/README.md` — одинаковое публичное описание возможностей и актуальный пример `.nkdk/project.yaml`.
- `docs/superpowers/specs/2026-08-29-client-server-standalone-import-design.md` и этот план — согласованный договор и порядок реализации.

---

### Task 1: Читающий автономный сеанс клиент-серверной базы

**Files:**
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts:296-318`
- Modify: `packages/platform/src/sessions/standaloneServer.ts:64-84`
- Verify: `packages/platform/src/sessions/commands.test.ts:73-153`

**Interfaces:**
- Consumes: `parseConnection(connectionString): InfobaseConnection`, `buildStandaloneConfigInit({ ibcmdPath, database })` и существующий `NormalizedPlatformConnectionSettings.database`.
- Produces: `createStandaloneServerSession(...)` принимает `File` и `Srvr`/`Ref`; для серверного подключения возвращает тот же `PlatformSession`, что и для файлового.

- [ ] **Step 1: Заменить тест общего запрета серверной базы на падающий тест читающего сеанса PostgreSQL**

Использовать существующую фикстуру и проверить одним сценарием границу создания сеанса и обе разрешённые операции:

```ts
it("opens a client-server database for read operations", async () => {
  const fixture = createFixture()
  const params = createParams({
    settings: {
      connectionString: 'Srvr="cluster";Ref="base";',
      database: {
        dbms: "PostgreSQL",
        server: "database-server",
        name: "base",
        user: "dbuser",
        password: "database-secret",
      },
    },
  })

  const session = await createStandaloneServerSession(params, fixture.dependencies)
  await session.exportConfiguration(
    "/project/.nkdk/tmp/op/xml",
    fixture.operationLog,
    "include",
  )
  await expect(session.listExtensions()).resolves.toEqual([])
  await session.close()

  expect(fixture.calls).toContain(
    "run ibcmd server config init --dbms=PostgreSQL "
      + "--database-server=database-server --database-name=base "
      + "--database-user=dbuser --database-password=database-secret timeout=1800000",
  )
  expect(fixture.calls.some((call) => call.startsWith("spawn ibsrv"))).toBe(true)
  expect(fixture.calls.some((call) => call.includes("dump-config-to-files"))).toBe(true)
  expect(fixture.calls).toContain(
    "shell.run config extensions properties get --all-extensions",
  )
  expect(fixture.operationLogText).not.toContain("database-secret")
})
```

- [ ] **Step 2: Добавить падающий тест обязательного блока `database`**

```ts
it("rejects a client-server database without DBMS settings before runtime", async () => {
  const fixture = createFixture()

  await expect(createStandaloneServerSession(
    createParams({
      settings: { connectionString: 'Srvr="cluster";Ref="base";' },
    }),
    fixture.dependencies,
  )).rejects.toMatchObject({
    code: "unsupported_connection",
    message: expect.stringContaining("параметры СУБД"),
  })
  expect(fixture.calls).toEqual([])
})
```

- [ ] **Step 3: Запустить целевой тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/standaloneServer.test.ts
```

Expected: первый новый тест падает с прежней ошибкой `unsupported_connection`; второй тест падает из-за прежнего общего сообщения без указания параметров СУБД.

- [ ] **Step 4: Реализовать минимальный выбор параметров инициализации**

Заменить общий запрет серверного подключения и файловую сборку `init` на явное ветвление:

```ts
const connection = parseConnection(params.settings.connectionString)
const init = (() => {
  if (connection.type === "file") {
    return buildStandaloneConfigInit({
      ibcmdPath,
      databasePath: connection.path,
    })
  }
  if (connection.type === "server") {
    if (params.settings.database === undefined) {
      throw new PlatformSessionError(
        "unsupported_connection",
        "Для автономного сервера клиент-серверной базы нужны параметры СУБД",
      )
    }
    return buildStandaloneConfigInit({
      ibcmdPath,
      database: params.settings.database,
    })
  }
  throw new PlatformSessionError(
    "unsupported_connection",
    "Автономный режим поддерживает только файловые и клиент-серверные информационные базы",
  )
})()
```

Оставить проверку `ibsrvPath` до первой операции файловой системы. Не менять `buildStandaloneConfigInit`: его PostgreSQL- и MSSQL-договоры уже покрыты в `commands.test.ts`.

- [ ] **Step 5: Запустить тесты сеансов платформы**

Run:

```bash
pnpm --filter @nkdk/platform test:sessions
```

Expected: PASS, включая существующие тесты PostgreSQL с учётными данными и MSSQL с авторизацией ОС в `commands.test.ts`.

- [ ] **Step 6: Проверить новые дубли после законченного слоя**

Run:

```bash
pnpm duplicates -- --base a93a394d1
```

Expected: PASS, новых поддерживаемых дублей нет.

- [ ] **Step 7: Зафиксировать читающий клиент-серверный сеанс**

```bash
git add packages/platform/src/sessions/standaloneServer.ts \
  packages/platform/src/sessions/standaloneServer.test.ts
git commit -m "feat: :sparkles: разрешить автономный импорт серверной базы"
```

---

### Task 2: Двойная граница запрета частичной загрузки

**Files:**
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts:93-166,296-335`
- Modify: `packages/platform/src/sessions/standaloneServer.ts:317-341`
- Modify: `packages/platform/src/sessions/manager.test.ts:103-166,492-513`
- Modify: `packages/platform/src/sessions/manager.ts:75-116`

**Interfaces:**
- Consumes: сохранённый `connection` внутри `createStandaloneServerSession` и вход `LoadPartialConfigurationParams` менеджера.
- Produces: оба пути возвращают `PlatformSessionError` с кодом `unsupported_connection` и сообщением `Автономный режим пока поддерживает клиент-серверные информационные базы только для импорта`.

- [ ] **Step 1: Добавить падающий тест защитной проверки уже открытого сеанса**

```ts
it("rejects a partial load through an opened client-server session", async () => {
  const fixture = createFixture()
  const session = await createStandaloneServerSession(
    createParams({
      settings: {
        connectionString: 'Srvr="cluster";Ref="base";',
        database: {
          dbms: "PostgreSQL",
          server: "database-server",
          name: "base",
          user: "dbuser",
        },
      },
    }),
    fixture.dependencies,
  )

  await expect(session.loadPartialConfiguration?.(
    "/project/package.zip",
    ["Catalogs/Test.xml"],
    fixture.operationLog,
  )).rejects.toMatchObject({
    code: "unsupported_connection",
    message: expect.stringContaining("только для импорта"),
  })
  expect(fixture.calls.some((call) => call.includes(".nkdk-load"))).toBe(false)
  expect(fixture.calls.some((call) => call.includes("config load-files"))).toBe(false)
  await session.close()
})
```

- [ ] **Step 2: Добавить падающий тест раннего отказа менеджера**

```ts
it("rejects a standalone client-server partial load before platform discovery", async () => {
  const fixture = createFixture()
  const manager = createPlatformSessionManager(fixture.dependencies)

  await expect(manager.loadPartialConfiguration(loadParams({
    mode: "standalone-server",
    connectionString: 'Srvr="cluster";Ref="base";',
    database: {
      dbms: "PostgreSQL",
      server: "database-server",
      name: "base",
      user: "dbuser",
    },
  }))).rejects.toMatchObject({
    code: "unsupported_connection",
    message: expect.stringContaining("только для импорта"),
  })

  expect(fixture.findPlatformCalls).toBe(0)
  expect(fixture.created).toEqual([])
})
```

- [ ] **Step 3: Запустить два целевых файла и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run \
  src/sessions/standaloneServer.test.ts \
  src/sessions/manager.test.ts
```

Expected: прямой вызов выполняет `config load-files`, а менеджер создаёт автономный сеанс вместо раннего отказа.

- [ ] **Step 4: Добавить защитную проверку в автономный сеанс**

В начале `loadPartialConfiguration`, до проверки состояния и создания staging-каталога, добавить:

```ts
if (connection.type === "server") {
  throw new PlatformSessionError(
    "unsupported_connection",
    "Автономный режим пока поддерживает клиент-серверные информационные базы только для импорта",
  )
}
```

- [ ] **Step 5: Добавить раннюю проверку в менеджер**

В начале `loadPartialConfiguration`, до `openOperationLog`, добавить:

```ts
if (
  params.mode === "standalone-server"
  && parseConnection(params.connectionString).type === "server"
) {
  throw new PlatformSessionError(
    "unsupported_connection",
    "Автономный режим пока поддерживает клиент-серверные информационные базы только для импорта",
  )
}
```

Не менять файловый `standalone-server` и любой `designer-agent`.

- [ ] **Step 6: Запустить тесты сеансов платформы**

Run:

```bash
pnpm --filter @nkdk/platform test:sessions
```

Expected: PASS; существующие тесты последовательных автономных загрузок файловой базы остаются зелёными.

- [ ] **Step 7: Запустить проверку типов платформенного пакета**

Run:

```bash
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 8: Проверить новые дубли после законченного слоя**

Run:

```bash
pnpm duplicates -- --base a93a394d1
```

Expected: PASS. Если одинаковые блоки создания ошибки будут признаны новым дублем, вынести фабрику `clientServerStandaloneLoadUnsupported()` в `sessions/errors.ts` и использовать её в обеих границах, не изменяя публичный код и сообщение.

- [ ] **Step 9: Зафиксировать запрет записи**

```bash
git add packages/platform/src/sessions/standaloneServer.ts \
  packages/platform/src/sessions/standaloneServer.test.ts \
  packages/platform/src/sessions/manager.ts \
  packages/platform/src/sessions/manager.test.ts
git commit -m "fix: :bug: запретить автономную загрузку серверной базы"
```

---

### Task 3: Публичная документация MCP

**Files:**
- Modify: `README.md:89-117`
- Modify: `packages/mcp/README.md:89-117`
- Add: `docs/superpowers/specs/2026-08-29-client-server-standalone-import-design.md`
- Add: `docs/superpowers/plans/2026-08-29-client-server-standalone-import.md`

**Interfaces:**
- Consumes: фактическая схема `projectSettingsStructuralSchema` с `operations.import.mode`.
- Produces: одинаковое описание в корневом README и README пакета MCP.

- [ ] **Step 1: Обновить описание границ операций в обоих README**

Заменить абзацы возможностей на точный договор:

```md
`nkdk.import_from_infobase` поддерживает платформу `8.3.27` и импортирует `cf`
либо одно расширение `cfe/<Имя>` в отсутствующий или пустой компонент. Агентный
и автономный режимы работают с файловыми и клиент-серверными базами; для
клиент-серверного автономного режима нужны параметры СУБД в `database`.

`nkdk.sync_to_infobase` передаёт ZIP только с изменёнными файлами и поддерживает
основную конфигурацию `cf` и расширения `cfe/<Имя>`. Автономная частичная
загрузка разрешена только для файловых баз; для клиент-серверной базы используйте
`designer-agent`.
```

- [ ] **Step 2: Исправить пример настроек в обоих README по фактической схеме**

Удалить устаревшие `version` и `useStandaloneServer`; добавить существующий блок:

```yaml
infobase:
  connectionString: 'Srvr="cluster";Ref="production";'
  user: Администратор
  password: secret
  sessionIdleTimeout: 900
  database:
    dbms: PostgreSQL
    server: db.example.local
    name: production
    user: dbuser
    password: dbsecret
  operations:
    import:
      mode: standalone-server
      unresolvedReferences: include
```

В следующем абзаце заменить условие `useStandaloneServer: true` на
`operations.import.mode: standalone-server`.

- [ ] **Step 3: Проверить синхронность двух README**

Run:

```bash
diff -u README.md packages/mcp/README.md
```

Expected: команда не выводит различий и завершается с кодом 0.

- [ ] **Step 4: Проверить документацию на устаревший ключ**

Run:

```bash
rg -n "useStandaloneServer|Автономный режим временно разрешён только" \
  README.md packages/mcp/README.md
```

Expected: совпадений нет.

- [ ] **Step 5: Проверить новые дубли после законченного слоя**

Run:

```bash
pnpm duplicates -- --base a93a394d1
```

Expected: PASS; README не входит в поддерживаемые программные файлы проверки.

- [ ] **Step 6: Зафиксировать документацию**

```bash
git add README.md packages/mcp/README.md \
  docs/superpowers/specs/2026-08-29-client-server-standalone-import-design.md \
  docs/superpowers/plans/2026-08-29-client-server-standalone-import.md
git commit -m "docs: :memo: описать автономный импорт серверной базы"
```

---

### Task 4: Итоговая проверка

**Files:**
- Verify only: all files changed by Tasks 1-3

**Interfaces:**
- Consumes: три завершённых слоя реализации.
- Produces: подтверждённая готовность ветки к просмотру; новых production-интерфейсов нет.

- [ ] **Step 1: Запустить проверку типов всего проекта**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Запустить полный набор тестов вне песочницы**

Run:

```bash
pnpm test
```

Expected: PASS; opt-in `importFromInfobase.integration.test.ts` может остаться пропущенным без настроенной реальной базы.

- [ ] **Step 3: Запустить самопроверку архитектурных правил**

Run:

```bash
pnpm test:architecture:rules
```

Expected: PASS.

- [ ] **Step 4: Запустить архитектурную проверку**

Run:

```bash
pnpm test:architecture
```

Expected: PASS; baseline dependency-cruiser не изменяется.

- [ ] **Step 5: Выполнить итоговую проверку дублей**

Run:

```bash
pnpm duplicates -- --base a93a394d1
```

Expected: PASS.

- [ ] **Step 6: Проверить состав ветки и отсутствие случайных файлов**

Run:

```bash
git status --short
git diff --check a93a394d1...HEAD
git diff --stat a93a394d1...HEAD
```

Expected: рабочее дерево чистое; `diff --check` не сообщает ошибок; изменение ограничено файлами из плана и документами планирования.

- [ ] **Step 7: Подготовить отчёт о тестах**

В итоговом сообщении перечислить:

- заменённый тест общего запрета на тест читающего клиент-серверного сеанса;
- новый тест обязательности `database`;
- новый тест защитного запрета записи в открытом сеансе;
- новый тест раннего отказа менеджера;
- сохранённые существующие проверки PostgreSQL, MSSQL, файлового автономного режима и агентного режима;
- результаты `type-check`, полного `pnpm test`, архитектурных проверок и проверки дублей.

Реальную клиент-серверную проверку не считать автоматической частью готовности без предоставленной тестовой СУБД; явно указать это ограничение в отчёте.
