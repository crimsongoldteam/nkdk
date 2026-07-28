# Выгрузка конфигурации без ограничения времени — план реализации

> **Для агентных исполнителей:** ОБЯЗАТЕЛЬНЫЙ ПОДНАВЫК: используйте
> `superpowers:subagent-driven-development` (рекомендуется) или
> `superpowers:executing-plans`, выполняя задачи по порядку. Шаги отмечаются
> флажками `- [ ]`.

**Цель:** снять ограничение времени с выгрузки конфигурации через агент
Конфигуратора и `ibcmd`, сохранив ограничение запуска и гарантированно
останавливая принадлежащий nkdk процесс при отмене MCP-запроса.

**Архитектура:** сигнал отмены MCP передаётся через сервис импорта и менеджер
сеансов к конкретному платформенному сеансу. SSH-протокол разделяет короткие
обмены запуска с тайм-аутом и долгую команду без тайм-аута; процессный runtime
разделяет тайм-аут подготовки `ibcmd` и отменяемую выгрузку без предельного
времени. Отменённый сеанс закрывается, удаляется из кэша и не
переиспользуется.

**Стек:** TypeScript 6, Node.js 26, Vitest 4, MCP SDK 1.29, `ssh2`.

## Общие ограничения

- Платформенная выгрузка не имеет ограничения времени.
- Запуск агента и SSH-подключение ограничены 60 секундами.
- Подготовка `config.yaml` через `ibcmd` сохраняет существующий тайм-аут
  30 минут.
- При отмене принадлежащий nkdk процесс получает `SIGTERM`, затем `SIGKILL`
  через 5 секунд, если не завершился.
- Временный каталог операции сохраняется при отмене.
- Публичный безопасный код отмены — `operation_cancelled`.
- Пароли и необработанный вывод платформы не попадают в ответ MCP.
- Существующие XML-фикстуры не изменяются.

---

### Задача 1: Публичные договоры отменяемой платформенной операции

**Файлы:**

- Изменить: `packages/platform/src/sessions/errors.ts`
- Изменить: `packages/platform/src/sessions/runtime.ts`
- Изменить: `packages/platform/src/sessions/types.ts`
- Изменить: `packages/mcp/src/contracts/common.ts`
- Тест: `packages/mcp/src/contracts/common.test.ts`

**Интерфейсы:**

- Производит: `PlatformSessionErrorCode` и `ToolErrorCode` со значением
  `"operation_cancelled"`.
- Производит:
  `PlatformCommandSession.run(command, options?: { signal?: AbortSignal })`.
- Производит:
  `PlatformSession.exportConfiguration(outputDir, logPath, signal?)`.
- Производит: `ExportConfigurationParams.signal?: AbortSignal`.
- Производит:

```ts
type ProcessRunOptions = {
  timeoutMs?: number
  signal?: AbortSignal
  terminationGraceMs?: number
}

type ProcessRunResult = {
  stdout: string
  stderr: string
  exitCode: number
  timedOut?: boolean
  cancelled?: boolean
}
```

- [ ] **Шаг 1: добавить падающую проверку публичного кода отмены**

В `packages/mcp/src/contracts/common.test.ts` добавить
`"operation_cancelled"` в таблицу стабильных платформенных кодов.

- [ ] **Шаг 2: запустить проверку и увидеть RED**

Команда:

```sh
pnpm --filter @nkdk/mcp test -- src/contracts/common.test.ts
```

Ожидание: тест падает, потому что `errorCodeSchema` отвергает
`operation_cancelled`.

- [ ] **Шаг 3: минимально расширить договоры**

Добавить код в обе схемы ошибок и изменить типы runtime/сеансов ровно на
сигнатуры из раздела «Интерфейсы». Реализации временно могут не собираться до
следующих задач; новых настроек проекта не добавлять.

- [ ] **Шаг 4: запустить контрактный тест**

Команда:

```sh
pnpm --filter @nkdk/mcp test -- src/contracts/common.test.ts
```

Ожидание: PASS.

- [ ] **Шаг 5: создать коммит**

```sh
git add packages/platform/src/sessions/errors.ts \
  packages/platform/src/sessions/runtime.ts \
  packages/platform/src/sessions/types.ts \
  packages/mcp/src/contracts/common.ts \
  packages/mcp/src/contracts/common.test.ts
git commit -m "feat: :sparkles: добавить договор отмены платформенной операции"
```

---

### Задача 2: Долгая SSH-команда без тайм-аута

**Файлы:**

- Изменить: `packages/platform/src/sessions/sshProtocol.ts`
- Тест: `packages/platform/src/sessions/sshProtocol.test.ts`

**Интерфейсы:**

- Потребляет:
  `PlatformCommandSession.run(command, { signal?: AbortSignal })`.
- Производит внутренний обмен с независимыми параметрами:

```ts
type ExchangeOptions = {
  timeoutMs?: number
  signal?: AbortSignal
}
```

- [ ] **Шаг 1: написать падающие тесты SSH-протокола**

Добавить две проверки:

```ts
it("does not arm a timer for a platform command", async () => {
  const clock = controlledClock()
  const shell = scriptedShell([
    "designer> ",
    '[{"type":"success","message":"JSON mode"}]\\ndesigner> ',
    '[{"type":"success","message":"Connected"}]\\ndesigner> ',
    '[{"type":"success","message":"Done"}]\\ndesigner> ',
  ])
  const session = await openPlatformCommandSession({ shell, timeoutMs: 100, clock })
  clock.resetCounters()

  await session.run("config dump-config-to-files")

  expect(clock.setCalls()).toBe(0)
})

it("cancels a pending platform command", async () => {
  const controller = new AbortController()
  const session = await openPlatformCommandSession({
    shell: scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\\ndesigner> ',
    ]),
    timeoutMs: 100,
  })

  const pending = session.run("config dump-config-to-files", {
    signal: controller.signal,
  })
  controller.abort()

  await expect(pending).rejects.toMatchObject({ code: "operation_cancelled" })
})
```

Дополнить `controlledClock` счётчиком установленных таймеров. Существующий
тест запуска должен по-прежнему доказывать `session_timeout`.

- [ ] **Шаг 2: запустить тест и увидеть RED**

```sh
pnpm --filter @nkdk/platform test -- src/sessions/sshProtocol.test.ts
```

Ожидание: первый тест видит таймер команды, второй не получает
`operation_cancelled`.

- [ ] **Шаг 3: разделить запуск и командный обмен**

Передавать `timeoutMs` в `beginExchange` только для начального приглашения,
выбора JSON и `connect-ib`. Для `run` не создавать таймер; вместо него
подписаться на `signal.abort`. В единой функции очистки удалять как таймер,
так и слушатель отмены при успехе, ошибке или закрытии SSH.

- [ ] **Шаг 4: запустить тест SSH-протокола**

```sh
pnpm --filter @nkdk/platform test -- src/sessions/sshProtocol.test.ts
```

Ожидание: PASS, включая сохранённый тайм-аут запуска.

- [ ] **Шаг 5: создать коммит**

```sh
git add packages/platform/src/sessions/sshProtocol.ts \
  packages/platform/src/sessions/sshProtocol.test.ts
git commit -m "feat: :sparkles: сделать SSH-выгрузку отменяемой"
```

---

### Задача 3: Отмена дочернего процесса `ibcmd`

**Файлы:**

- Изменить: `packages/platform/src/sessions/nodeRuntime.ts`
- Создать: `packages/platform/src/sessions/nodeRuntime.test.ts`
- Изменить: `packages/platform/src/sessions/standaloneServer.ts`
- Тест: `packages/platform/src/sessions/standaloneServer.test.ts`

**Интерфейсы:**

- Потребляет: `ProcessRunOptions` и `ProcessRunResult` из задачи 1.
- Производит экспортируемый для теста `nodeProcessRuntime`.
- Производит экспортируемую `runNodeProcess(command, args, options, spawn)`
  с внедряемой границей `spawn` для проверки сигналов без настоящего
  зависшего процесса.
- `StandaloneServerDependencies` получает `closeTimeoutMs`.

- [ ] **Шаг 1: написать падающий тест сигналов дочернему процессу**

В `nodeRuntime.test.ts` внедрить управляемый fake `ChildProcess`, который не
завершается после `SIGTERM`, использовать поддельные таймеры Vitest и
проверить:

```ts
it("terminates an aborted child after the grace period", async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  const child = controlledChildProcess()
  const pending = runNodeProcess(
    "ibcmd",
    ["infobase", "config", "export"],
    { signal: controller.signal, terminationGraceMs: 5_000 },
    () => child
  )

  controller.abort()
  expect(child.signals).toEqual(["SIGTERM"])
  await vi.advanceTimersByTimeAsync(5_000)
  expect(child.signals).toEqual(["SIGTERM", "SIGKILL"])
  child.exit(1)

  await expect(pending).resolves.toMatchObject({ cancelled: true })
})
```

Тест должен завершаться сам; зависший дочерний процесс считается ошибкой.

- [ ] **Шаг 2: обновить падающие тесты автономного сеанса**

В `standaloneServer.test.ts` зафиксировать:

- подготовка вызывается с `timeoutMs: 1_800_000`;
- экспорт вызывается без `timeoutMs`, с переданным `signal` и
  `terminationGraceMs: 5_000`;
- результат runtime `{ cancelled: true }` преобразуется в
  `PlatformSessionError("operation_cancelled")`;
- прежний тест тайм-аута экспорта удаляется, тайм-аут подготовки остаётся.

- [ ] **Шаг 3: запустить оба теста и увидеть RED**

```sh
pnpm --filter @nkdk/platform test -- \
  src/sessions/nodeRuntime.test.ts \
  src/sessions/standaloneServer.test.ts
```

Ожидание: runtime не реагирует на `AbortSignal`, а экспорт всё ещё получает
30-минутный тайм-аут.

- [ ] **Шаг 4: реализовать отменяемый process runtime**

При `signal.abort`:

1. отметить запуск отменённым;
2. отправить `SIGTERM`;
3. поставить отдельный таймер `terminationGraceMs`;
4. отправить `SIGKILL`, если процесс ещё не завершён;
5. удалить слушатель и оба таймера после `exit`/`error`.

Таймер обычного ограничения создавать только при наличии `timeoutMs`.
Предварительно отменённый сигнал не должен запускать процесс.

- [ ] **Шаг 5: снять тайм-аут только с экспорта `ibcmd`**

Подготовку оставить с `commandTimeoutMs`. В
`session.exportConfiguration(..., signal)` вызвать runtime так:

```ts
const exported = await dependencies.processRuntime.run(
  command.command,
  command.args,
  {
    signal,
    terminationGraceMs: dependencies.closeTimeoutMs,
  }
)
```

`exported.cancelled === true` преобразовать в безопасный
`operation_cancelled`.

- [ ] **Шаг 6: запустить тесты runtime и автономного сеанса**

```sh
pnpm --filter @nkdk/platform test -- \
  src/sessions/nodeRuntime.test.ts \
  src/sessions/standaloneServer.test.ts
```

Ожидание: PASS.

- [ ] **Шаг 7: создать коммит**

```sh
git add packages/platform/src/sessions/nodeRuntime.ts \
  packages/platform/src/sessions/nodeRuntime.test.ts \
  packages/platform/src/sessions/standaloneServer.ts \
  packages/platform/src/sessions/standaloneServer.test.ts
git commit -m "feat: :sparkles: отменять долгую выгрузку ibcmd"
```

---

### Задача 4: Остановка агента и удаление отменённого сеанса

**Файлы:**

- Изменить: `packages/platform/src/sessions/designerAgent.ts`
- Тест: `packages/platform/src/sessions/designerAgent.test.ts`
- Изменить: `packages/platform/src/sessions/manager.ts`
- Тест: `packages/platform/src/sessions/manager.test.ts`
- Изменить: `packages/platform/src/sessions/nodeRuntime.ts`

**Интерфейсы:**

- Потребляет: `exportConfiguration(..., signal)`.
- Производит:
  `PlatformSession.cancel(): Promise<{ stoppedOwnedProcess: boolean }>`.
- Производит менеджер, который удаляет отменённый сеанс из кэша до
  следующего вызова.

- [ ] **Шаг 1: написать падающий тест отмены агента**

Расширить fixture поддержкой `process.signal`. Проверить порядок:

```ts
const controller = new AbortController()
const pending = session.exportConfiguration("/xml", "/log", controller.signal)
controller.abort()

await expect(pending).rejects.toMatchObject({ code: "operation_cancelled" })
await session.cancel()

expect(fixture.calls).toContain("shell.close")
expect(fixture.calls).toContain("process.signal SIGTERM")
expect(fixture.calls).toContain("process.wait 5000")
expect(fixture.calls).toContain("process.kill SIGKILL")
```

Fixture команды выгрузки должна ожидать отмену, а `process.wait` — вернуть
`false`, чтобы доказать принудительное завершение.

- [ ] **Шаг 2: написать падающий тест менеджера**

Запустить отменяемую выгрузку, вызвать `controller.abort()`, затем повторить
экспорт того же проекта. Проверить:

```ts
expect(fixture.sessions[0]?.cancelCalls).toBe(1)
expect(fixture.created).toHaveLength(2)
expect(fixture.activeTimers()).toEqual([900_000])
```

Первый отменённый сеанс не получает таймер простоя и не переиспользуется.

- [ ] **Шаг 3: запустить тесты и увидеть RED**

```sh
pnpm --filter @nkdk/platform test -- \
  src/sessions/designerAgent.test.ts \
  src/sessions/manager.test.ts
```

Ожидание: сигнал не передаётся, `cancel` отсутствует, менеджер сохраняет
сеанс.

- [ ] **Шаг 4: реализовать отмену агента**

Передать сигнал в `commandSession.run`. При `session.cancel()`:

1. закрыть SSH-сеанс без команд `disconnect-ib`/`shutdown`;
2. если процесс принадлежит nkdk и жив, отправить `SIGTERM`;
3. ждать `closeTimeoutMs`;
4. при необходимости вызвать `kill("SIGKILL")`;
5. пометить сеанс закрытым только после успешной остановки.

Обычный `close()` сохранить без изменения поведения.

- [ ] **Шаг 5: инвалидировать отменённый сеанс в менеджере**

Проверять предварительно отменённый сигнал до создания/переиспользования
сеанса. При `operation_cancelled` вызвать `cached.session.cancel()`, удалить
точно этот экземпляр из `sessions`, не ставить таймер простоя и повторно
выбросить исходную ошибку отмены.

- [ ] **Шаг 6: запустить тесты агента и менеджера**

```sh
pnpm --filter @nkdk/platform test -- \
  src/sessions/designerAgent.test.ts \
  src/sessions/manager.test.ts
```

Ожидание: PASS.

- [ ] **Шаг 7: создать коммит**

```sh
git add packages/platform/src/sessions/designerAgent.ts \
  packages/platform/src/sessions/designerAgent.test.ts \
  packages/platform/src/sessions/manager.ts \
  packages/platform/src/sessions/manager.test.ts \
  packages/platform/src/sessions/nodeRuntime.ts
git commit -m "feat: :sparkles: останавливать отменённый агент 1С"
```

---

### Задача 5: Передача отмены из MCP и длительное ожидание helper

**Файлы:**

- Изменить: `packages/mcp/src/services/importFromInfobase.ts`
- Тест: `packages/mcp/src/services/importFromInfobase.test.ts`
- Изменить: `packages/mcp/src/tools/registerTools.ts`
- Тест: `packages/mcp/src/tools/registerTools.test.ts`
- Изменить: `.agents/tools/mcp/call.mjs`
- Тест: `packages/mcp/src/callScript.test.ts`
- Изменить: `README.md`

**Интерфейсы:**

- Производит:

```ts
importFromInfobase(
  input: ImportFromInfobaseInput,
  dependencies?: ImportFromInfobaseDependencies,
  signal?: AbortSignal
): Promise<ImportFromInfobasePayload>
```

- Производит:
  `export const MCP_CALL_TIMEOUT_MS = 2_147_483_647`.

- [ ] **Шаг 1: написать падающий тест сервиса импорта**

Передать сигнал третьим аргументом, настроить fixture платформы на
`PlatformSessionError("operation_cancelled")` и проверить:

```ts
expect(fixture.exportedSettings.signal).toBe(controller.signal)
expect(result).toMatchObject({
  ok: false,
  code: "operation_cancelled",
  details: {
    temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1",
  },
})
expect(JSON.stringify(result)).not.toContain("secret")
```

Добавить проверку уже отменённого сигнала между выгрузкой и XML → YAML:
`syncConfigurationFromXML` не вызывается.

- [ ] **Шаг 2: написать падающий тест регистрации MCP**

Получить handler зарегистрированного `nkdk.import_from_infobase`, вызвать
его с `{ signal: controller.signal }`. В `registerTools.ts` выделить и
экспортировать фабрику
`createImportFromInfobaseHandler(service = importFromInfobase)`, а в тесте
передать `vi.fn()` как `service` и проверить третий аргумент вызова.

- [ ] **Шаг 3: написать падающий тест helper**

В `callScript.test.ts` импортировать `MCP_CALL_TIMEOUT_MS` и проверить:

```ts
expect(MCP_CALL_TIMEOUT_MS).toBe(2_147_483_647)
```

Также вызвать экспортируемую функцию
`callToolWithoutPracticalLimit(client, request)` с mock-клиентом и проверить
точный вызов:

```ts
expect(client.callTool).toHaveBeenCalledWith(
  request,
  undefined,
  { timeout: MCP_CALL_TIMEOUT_MS }
)
```

- [ ] **Шаг 4: запустить MCP-тесты и увидеть RED**

```sh
pnpm --filter @nkdk/mcp test -- \
  src/services/importFromInfobase.test.ts \
  src/tools/registerTools.test.ts \
  src/callScript.test.ts
```

Ожидание: сигнал теряется, код отмены отсутствует в результате, helper
использует стандартные 60 секунд.

- [ ] **Шаг 5: реализовать передачу сигнала**

Обработчик инструмента принимает второй аргумент `extra` и вызывает:

```ts
jsonToolResult(await importFromInfobase(input, undefined, extra.signal))
```

Сервис передаёт сигнал в `exportConfiguration`, проверяет
`signal?.throwIfAborted()` перед XML → YAML и отображает отмену в безопасный
`operation_cancelled`.

- [ ] **Шаг 6: увеличить ожидание локального helper**

Вызвать:

```js
client.callTool(request, undefined, { timeout: MCP_CALL_TIMEOUT_MS })
```

Не использовать `Infinity` или `Number.MAX_SAFE_INTEGER`: Node.js сокращает
переполненный таймер до 1 мс.

- [ ] **Шаг 7: обновить README**

В разделе импорта из информационной базы явно указать:

- выгрузка не имеет предельного времени;
- отмена запроса останавливает принадлежащий nkdk процесс;
- внешнему MCP-клиенту может требоваться собственная настройка длительного
  ожидания.

- [ ] **Шаг 8: запустить MCP-тесты**

```sh
pnpm --filter @nkdk/mcp test -- \
  src/services/importFromInfobase.test.ts \
  src/tools/registerTools.test.ts \
  src/callScript.test.ts
```

Ожидание: PASS.

- [ ] **Шаг 9: создать коммит**

```sh
git add packages/mcp/src/services/importFromInfobase.ts \
  packages/mcp/src/services/importFromInfobase.test.ts \
  packages/mcp/src/tools/registerTools.ts \
  packages/mcp/src/tools/registerTools.test.ts \
  packages/mcp/src/callScript.test.ts \
  .agents/tools/mcp/call.mjs README.md
git commit -m "feat: :sparkles: передавать отмену импорта из MCP"
```

---

### Задача 6: Полная и реальная проверка

**Файлы:**

- Изменять только при обнаружении подтверждённого дефекта в предыдущих
  задачах.

**Интерфейсы:**

- Потребляет: законченный `nkdk.import_from_infobase`.
- Производит: подтверждение тестами и двумя реальными импортами.

- [ ] **Шаг 1: проверить типы**

```sh
pnpm type-check
```

Ожидание: exit 0.

- [ ] **Шаг 2: запустить полный набор тестов**

```sh
pnpm test
```

Ожидание: все пакеты `packages/*` зелёные.

- [ ] **Шаг 3: проверить автономный режим на реальной базе**

Через настоящий локальный MCP вызвать `nkdk.import_from_infobase`:

```json
{
  "projectDir": "/Users/nikita/git/temp-unbounded-standalone",
  "connectionString": "File=\"/Users/nikita/Базы 1С/all\";",
  "useStandaloneServer": true,
  "allowWrite": true
}
```

Ожидание: `ok: true`, `mode: "standalone-server"`, `failed: []`.
Затем вызвать `nkdk.validate_project`; ожидание — 0 ошибок и предупреждений.

- [ ] **Шаг 4: проверить агент Конфигуратора на реальной базе**

Через настоящий локальный MCP вызвать `nkdk.import_from_infobase`:

```json
{
  "projectDir": "/Users/nikita/git/temp-unbounded-agent",
  "connectionString": "File=\"/Users/nikita/Базы 1С/all\";",
  "useStandaloneServer": false,
  "allowWrite": true
}
```

Ожидание: `ok: true`, `mode: "designer-agent"`, `failed: []`.
Затем вызвать `nkdk.validate_project`; ожидание — 0 ошибок и предупреждений.

- [ ] **Шаг 5: сравнить результаты режимов**

```sh
diff -qr \
  /Users/nikita/git/temp-unbounded-standalone/cf \
  /Users/nikita/git/temp-unbounded-agent/cf
```

Ожидание: exit 0, различий нет.

- [ ] **Шаг 6: проверить чистоту и итоговые коммиты**

```sh
git status --short
git log -6 --oneline
```

Ожидание: рабочее дерево чистое; в истории присутствуют отдельные коммиты
договора, SSH, `ibcmd`, агента и MCP.
