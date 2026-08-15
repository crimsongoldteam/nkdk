# Lossless SSH Startup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исключить потерю стартового приглашения командной оболочки между установлением SSH-соединения и запуском протокола, а также различать сбои протокольного рукопожатия и аутентификации.

**Architecture:** Транспорт `ssh2Transport` временно накапливает входные данные только до первого подписчика и асинхронно передаёт их протоколу в исходном порядке. `sshProtocol` сообщает вызывающему коду о начале и завершении двух этапов подключения; агентный и автономный режимы используют эти события для журнала и `details.stage`, не меняя команды загрузки конфигурации.

**Tech Stack:** TypeScript, Node.js `Buffer`, ssh2, Vitest, pnpm.

## Global Constraints

- Работать в `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test` на ветке `codex/partial-sync-resumable-test`.
- Не изменять XML-фикстуры и команды частичной синхронизации.
- Не добавлять повторное накопление данных после перехода транспорта в рабочий режим.
- Ограничить стартовый буфер 64 КиБ в UTF-8; при превышении закрывать поток и SSH-клиент.
- Сохранять порядок данных, включая фрагменты, пришедшие во время опустошения буфера.
- Реальные проверки выполнять на копии контрольной базы; `/Users/nikita/Базы 1С/temp_test/checkpoints/current` не изменять.
- После каждого законченного слоя до его коммита запускать `pnpm duplicates -- --base HEAD`: в этот момент `HEAD` указывает на предыдущий слой.
- Перед завершением выполнить архитектурные и полные тесты согласно `AGENTS.md`; LMDB-тесты запускать вне песочницы.

---

## Task 1: Сделать старт SSH-потока без потерь

**Files:**
- Modify: `packages/platform/src/sessions/ssh2Transport.ts:105-147`
- Test: `packages/platform/src/sessions/ssh2Transport.test.ts:1-129`
- Verify: `packages/platform/src/sessions/sshProtocol.test.ts`

**Interfaces:** Публичные типы `SshTransport` и `SshShell` не меняются. Внутри `createShell` вводятся состояния `buffering | draining | live` и предел `64 * 1024` байта.

- [ ] **Step 1: Зафиксировать потерю данных до подписки тестом**

Добавить в `ssh2Transport.test.ts` тест, который отправляет `designer> ` сразу после получения shell, подписывается позднее и проверяет асинхронную доставку:

```ts
client.stream.emit("data", Buffer.from("designer> "))
const chunks: string[] = []
shell.onData((chunk) => chunks.push(chunk))

expect(chunks).toEqual([])
await Promise.resolve()
expect(chunks).toEqual(["designer> "])
```

- [ ] **Step 2: Добавить тесты договора стартового буфера**

Покрыть в том же файле:

1. Фрагмент, пришедший из обработчика первого фрагмента во время `draining`, доставляется вторым.
2. После первой доставки и отписки новые данные не накапливаются; новый подписчик не получает пропущенный фрагмент.
3. Фрагмент размером `64 * 1024 + 1` байт до подписки завершает stream, уничтожает client и переводит shell в закрытое состояние; последующий `openPlatformCommandSession` немедленно отклоняется с `session_start_failed`.
4. Обработчики закрытия вызываются ровно один раз и при переполнении.
5. Закрытие до первой подписки сразу отражается в `isOpen() === false` и не запускает передачу накопленных данных.

- [ ] **Step 3: Добавить интеграционный тест транспорта и протокола**

Импортировать `openPlatformCommandSession` в `ssh2Transport.test.ts`. Получить реальный `SshShell` от поддельного транспорта, отправить приглашение до запуска протокола, сделать паузу через два `await Promise.resolve()`, затем открыть протокол. После записи `options set --output-format=json` и `common connect-ib` отправить успешные ответы и проверить, что сеанс создан без тайм-аута.

- [ ] **Step 4: Запустить RED-проверку**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/ssh2Transport.test.ts
```

Expected: новые тесты падают — приглашение до подписки отсутствует, переполнение не закрывает соединение.

- [ ] **Step 5: Реализовать конечный автомат доставки**

В `createShell` добавить:

```ts
const MAX_STARTUP_BUFFER_BYTES = 64 * 1024
type DataPhase = "buffering" | "draining" | "live"
let dataPhase: DataPhase = "buffering"
const startupChunks: string[] = []
let startupBytes = 0
```

Обработчик `stream.on("data")` должен:

- в `live` немедленно уведомлять текущих подписчиков;
- в `buffering` и `draining` добавлять строку в хвост и учитывать `Buffer.byteLength(chunk, "utf8")`;
- при превышении предела очищать буфер, один раз отмечать shell закрытым, завершать stream и уничтожать client.

Первый `onData` переводит состояние в `draining` и планирует `queueMicrotask(drainStartup)`. `drainStartup` последовательно извлекает фрагменты, поэтому данные, пришедшие во время вызова подписчика, попадают в хвост; после пустого буфера состояние навсегда становится `live`.

- [ ] **Step 6: Запустить GREEN-проверки слоя**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/ssh2Transport.test.ts src/sessions/sshProtocol.test.ts
pnpm --filter @nkdk/platform exec tsc --noEmit
pnpm duplicates -- --base fc0227bbb
```

Expected: все команды завершаются успешно; новые дубликаты отсутствуют.

- [ ] **Step 7: Закоммитить слой**

```bash
git add packages/platform/src/sessions/ssh2Transport.ts packages/platform/src/sessions/ssh2Transport.test.ts
git commit -m "fix: :bug: сохранять стартовый вывод SSH" \
  -m "Приглашение командной оболочки могло прийти до подписки протокола и терялось, что завершалось ложным тайм-аутом."
```

---

## Task 2: Выделить этапы рукопожатия и аутентификации в протоколе

**Files:**
- Modify: `packages/platform/src/sessions/sshProtocol.ts:36-78`
- Test: `packages/platform/src/sessions/sshProtocol.test.ts:1-75`

**Interfaces:** Добавить экспортируемые типы `PlatformCommandConnectionStage = "protocol-handshake" | "authentication"`, `PlatformCommandConnectionStatus = "start" | "ready"` и необязательный асинхронный параметр `onStage` у `openPlatformCommandSession`.

- [ ] **Step 1: Написать тест последовательности этапов**

Передать в успешный сценарий `onStage`, накопить пары и ожидать:

```ts
expect(stages).toEqual([
  ["protocol-handshake", "start"],
  ["protocol-handshake", "ready"],
  ["authentication", "start"],
  ["authentication", "ready"],
])
```

- [ ] **Step 2: Написать тест границы ошибки**

Создать shell без стартового приглашения с управляемыми часами. После истечения тайм-аута проверить, что зарегистрирован только `protocol-handshake/start`, а `authentication/start` отсутствует. Существующий тест неверного пароля должен дополнительно подтверждать, что ошибка произошла после `authentication/start` и до `authentication/ready`.

- [ ] **Step 3: Запустить RED-проверку**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/sshProtocol.test.ts
```

Expected: TypeScript сообщает об отсутствующем `onStage` либо проверки этапов падают.

- [ ] **Step 4: Реализовать события жизненного цикла подключения**

В `openPlatformCommandSession` вызвать `onStage("protocol-handshake", "start")` **до** создания `PlatformCommandProtocol`: это не позволит микрозадаче транспорта опустошить буфер раньше, чем `waitForPrompt` создаст ожидающий обмен. Затем расположить события так:

```ts
await protocol.waitForPrompt(params.timeoutMs)
await protocol.execute("options set --output-format=json", { timeoutMs: params.timeoutMs })
await params.onStage?.("protocol-handshake", "ready")
await params.onStage?.("authentication", "start")
await connectToInfobase(protocol, params)
await params.onStage?.("authentication", "ready")
```

При любой ошибке сохранить существующее закрытие протокола и исходный `PlatformSessionError`.

- [ ] **Step 5: Запустить GREEN-проверки слоя**

До коммита Task 2 выполнить:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/sshProtocol.test.ts src/sessions/ssh2Transport.test.ts
pnpm --filter @nkdk/platform exec tsc --noEmit
pnpm duplicates -- --base HEAD
```

Expected: все тесты успешны; новых дубликатов нет.

- [ ] **Step 6: Закоммитить слой**

```bash
git add packages/platform/src/sessions/sshProtocol.ts packages/platform/src/sessions/sshProtocol.test.ts
git commit -m "feat: :sparkles: сообщать этап подключения к оболочке" \
  -m "Разделение рукопожатия и подключения к базе позволяет вызывающему коду точно классифицировать сбой."
```

---

## Task 3: Подключить точную диагностику в агентном и автономном режимах

**Files:**
- Modify: `packages/platform/src/sessions/runtime.ts:6-13`
- Modify: `packages/platform/src/sessions/designerAgent.ts:115-155,480-500`
- Test: `packages/platform/src/sessions/designerAgent.test.ts:54-103,930-970`
- Modify: `packages/platform/src/sessions/standaloneServer.ts:220-275`
- Test: `packages/platform/src/sessions/standaloneServer.test.ts:1-170,530-580`

**Interfaces:** Расширить `PlatformFailureStage` значением `protocol-handshake`. Формат результата MCP не меняется: новое значение появляется только в существующем `details.stage` и журнале операции.

- [ ] **Step 1: Обновить поддельные реализации протокола в тестах**

В фикстурах `designerAgent.test.ts` и `standaloneServer.test.ts` вызывать `params.onStage` в той же последовательности, что реальный протокол. Для сценария ошибки предусмотреть явный этап сбоя, чтобы можно было оборвать вызов после `protocol-handshake/start` либо `authentication/start`.

- [ ] **Step 2: Написать тесты агентного режима**

Изменить проверку журнала успешного запуска: он содержит пары `stage=protocol-handshake status=start/ready` и `stage=authentication status=start/ready`, но не содержит пароль. Добавить тест, где `session_timeout` до приглашения возвращает:

```ts
{
  code: "session_timeout",
  details: { stage: "protocol-handshake" },
}
```

Сохранить существующую проверку неверных реквизитов с `details.stage === "authentication"`. Если изменилось число записей журнала, привязать имитацию ошибки журнала к имени этапа, а не к хрупкому порядковому номеру.

- [ ] **Step 3: Написать тесты автономного режима**

Добавить аналогичные проверки журнала и `details.stage` для `openPlatformCommandSession` внутри частичной загрузки автономного сервера. Ошибка после успешного подключения, возникшая уже на `config load-files`, должна по-прежнему иметь этап `configuration-load`.

- [ ] **Step 4: Запустить RED-проверку**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts src/sessions/standaloneServer.test.ts
```

Expected: новые проверки падают, потому что вызывающий код пока считает весь запуск аутентификацией или загрузкой.

- [ ] **Step 5: Реализовать диагностические этапы в агентном режиме**

Добавить `protocol-handshake` в `PlatformFailureStage` и локальные объединения этапов в `designerAgent.ts`. Передать в протокол обработчик:

```ts
onStage: async (stage, status) => {
  failureStage = stage
  await appendAgentLog(params.operationLog, `stage=${stage} status=${status}`)
},
```

Убрать отдельное дублирующее журналирование аутентификации. После успешного открытия командного сеанса вернуть `failureStage` к этапу следующей операции перед её выполнением.

- [ ] **Step 6: Реализовать диагностические этапы в автономном режиме**

В `standaloneServer.ts` хранить текущий `PlatformFailureStage`, передать такой же `onStage`, а после подключения установить `configuration-load`. При записи журнала использовать существующий безопасный механизм `operationLog`; при ошибке сохранить код исходного `PlatformSessionError`, подставив текущий этап в `processFailure`.

- [ ] **Step 7: Запустить GREEN-проверки слоя**

До коммита Task 3 выполнить:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts src/sessions/standaloneServer.test.ts src/sessions/sshProtocol.test.ts src/sessions/ssh2Transport.test.ts
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform exec tsc --noEmit
pnpm duplicates -- --base HEAD
```

Expected: тесты пакета проходят; новых дубликатов нет.

- [ ] **Step 8: Закоммитить слой**

```bash
git add packages/platform/src/sessions/runtime.ts packages/platform/src/sessions/designerAgent.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/standaloneServer.ts packages/platform/src/sessions/standaloneServer.test.ts
git commit -m "fix: :bug: различать сбои запуска командной оболочки" \
  -m "Агентный и автономный режимы должны относить тайм-аут приглашения к протоколу, а отказ входа — к аутентификации."
```

---

## Task 4: Проверить реальные частичные синхронизации без полной матрицы

**Files:**
- Inspect: `e2e/partial-sync/partial-sync.external.test.ts`
- Inspect: `e2e/partial-sync/run.ts`
- Inspect: `.agents/restrictions.md`

- [ ] **Step 1: Подготовить одноразовые копии контрольного состояния**

Создать временный каталог через `mktemp -d`. Отдельно скопировать `base` и `project` из `/Users/nikita/Базы 1С/temp_test/checkpoints/current` для агентного и автономного запусков. Проверить разрешённый режим базы до запуска; исходную контрольную копию не изменять.

- [ ] **Step 2: Проверить два случая в агентном режиме**

Через существующий внешний запуск MCP выполнить:

1. Изменение одного модуля: результат `synchronized`, `mode=designer-agent`, `loadMode=partial`; ZIP содержит модуль и `load.lst`. Повтор без изменений возвращает `unchanged`.
2. Структурное изменение одного справочника: результат `synchronized`, список выбранных объектов ограничен справочником и необходимыми зависимостями. Повтор возвращает `unchanged`.

Сохранить `result.json`, безопасный журнал операции и stderr в одноразовом каталоге.

- [ ] **Step 3: Проверить те же два случая в автономном режиме**

Повторить модульный и структурный сценарии на отдельной копии базы. Ожидать `mode=standalone-server`, успешное обновление конфигурации базы данных после загрузки и `unchanged` при повторе. Не запускать весь набор `partial-sync.external.test.ts`.

- [ ] **Step 4: Выполнить итоговую проверку репозитория**

Сохранить хеш до начала реализации как `fc0227bbb` и выполнить:

```bash
pnpm duplicates -- --base fc0227bbb
pnpm type-check
pnpm test:architecture:rules
pnpm test:architecture
pnpm test
```

Expected: все команды успешны; полная реальная e2e-матрица не запускалась.

- [ ] **Step 5: Проверить итоговые изменения**

```bash
git status --short
git diff fc0227bbb...HEAD --stat
git log --oneline fc0227bbb..HEAD
```

Expected: рабочее дерево чистое; в истории три изолированных коммита реализации поверх спецификации и плана. Если реальная проверка выявила дефект, сначала добавить отдельный падающий тест и исправить его новым коммитом; не изменять контрольную базу вручную.
