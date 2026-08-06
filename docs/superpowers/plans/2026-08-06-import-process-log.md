# Import process.log isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исключить сообщения прежних запусков и прежних импортов из диагностики текущего импорта через агент Конфигуратора.

**Architecture:** Новый агент запускается без `-NoTruncate`, поэтому платформа начинает новый `process.log`. Для повторно используемого агента отдельный модуль запоминает идентификатор файла и размер перед командой, а при ошибке возвращает только добавленные байты; если файл заменён или уменьшился, модуль читает его с начала. Автономный режим не изменяется: каждый запуск `ibcmd` уже передаёт текущие `stdout` и `stderr` в уникальный журнал операции.

**Tech Stack:** TypeScript, Node.js `fs/promises`, Vitest, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Краткая ошибка MCP продолжает формироваться из текущей ошибки SSH-протокола; `process.log` служит только подробностью в `platform.log`.
- Живой `process.log` нельзя удалять или обрезать между командами повторно используемого агента.
- Ошибка чтения `process.log` не должна скрывать исходную ошибку платформы.
- Новые зависимости не добавляются.
- Базовая ревизия для проверки дублей: `3ffb201413b43389aebb0ed0a51a3d18cb98b0b6`.

---

## File map

- `packages/platform/src/sessions/commands.ts` — формирует запуск агента без `-NoTruncate`.
- `packages/platform/src/sessions/commands.test.ts` — защищает аргументы запуска агента.
- `packages/platform/src/sessions/processLog.ts` — хранит договор курсора и читает прирост журнала по байтовым границам.
- `packages/platform/src/sessions/processLog.test.ts` — проверяет обычный прирост, уменьшение и замену файла.
- `packages/platform/src/sessions/nodeRuntime.ts` — передаёт файловую реализацию чтения журнала в сессию агента.
- `packages/platform/src/sessions/designerAgent.ts` — фиксирует курсор перед выгрузкой и прикладывает только текущий фрагмент при ошибке.
- `packages/platform/src/sessions/designerAgent.test.ts` — проверяет запуск и диагностику первой и повторной операций.

### Task 1: Очистка журнала при запуске нового агента

**Files:**
- Modify: `packages/platform/src/sessions/commands.ts`
- Test: `packages/platform/src/sessions/commands.test.ts`
- Test: `packages/platform/src/sessions/designerAgent.test.ts`

**Interfaces:**
- Consumes: `buildDesignerAgentLaunch(params): ProcessLaunch`.
- Produces: тот же `ProcessLaunch`, но без аргумента `-NoTruncate`; остальные аргументы и порядок не меняются.

- [ ] **Step 1: Изменить ожидаемый договор в тестах**

В ожидаемом массиве `args` теста `builds a file Designer agent launch without a shell` удалить последнюю строку:

```ts
"-NoTruncate",
```

В ожидаемой строке вызова `spawn` теста `starts once, exports through SSH, and closes gracefully` также удалить окончание ` -NoTruncate`:

```ts
"spawn /opt/1cv8/8.3.27.2214/1cv8 DESIGNER /Sserver\\reference /AgentMode /AgentSSHHostKey /project/.nkdk/platform-sessions/agent/host.key /AgentBaseDir /project/.nkdk /AppAutoCheckVersion- /AgentPort 58248 /Out /project/.nkdk/platform-sessions/agent/process.log cwd=/project/.nkdk",
```

- [ ] **Step 2: Запустить проверки и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/designerAgent.test.ts
```

Expected: FAIL; обе проверки показывают лишний аргумент `-NoTruncate` в фактическом запуске.

- [ ] **Step 3: Удалить `-NoTruncate` из построителя команды**

В `buildDesignerAgentLaunch` оставить окончание массива таким:

```ts
"/Out",
params.logPath,
```

- [ ] **Step 4: Запустить целевые проверки**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/commands.test.ts src/sessions/designerAgent.test.ts
```

Expected: PASS.

- [ ] **Step 5: Проверить дубли и зафиксировать слой**

Run:

```bash
pnpm check:duplicates -- --base 3ffb201413b43389aebb0ed0a51a3d18cb98b0b6
git add packages/platform/src/sessions/commands.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/designerAgent.test.ts
git commit -m "fix: :bug: очищать журнал при запуске агента"
```

Expected: проверка дублей проходит; создан отдельный коммит.

### Task 2: Чтение фрагмента `process.log` по курсору

**Files:**
- Create: `packages/platform/src/sessions/processLog.ts`
- Create: `packages/platform/src/sessions/processLog.test.ts`

**Interfaces:**
- Produces: `ProcessLogCursor = { identity: string; size: number }`.
- Produces: `ProcessLogReader` с методами `capture(path): Promise<ProcessLogCursor>` и `readSince(path, cursor?): Promise<string>`.
- Produces: `createProcessLogReader(fileSystem): ProcessLogReader` и `nodeProcessLogReader: ProcessLogReader`.

- [ ] **Step 1: Написать падающие модульные тесты**

Создать `processLog.test.ts` с памятью, в которой размер считается через `Buffer.byteLength`, а чтение выполняется через `Buffer.subarray`:

```ts
import { describe, expect, it } from "vitest"
import { createProcessLogReader } from "./processLog"

describe("process log reader", () => {
  it("reads only bytes appended after the captured cursor", async () => {
    const source = memorySource("old message\n", "file-1")
    const reader = createProcessLogReader(source.fileSystem)
    const cursor = await reader.capture("process.log")
    source.replace("old message\ncurrent message\n", "file-1")

    await expect(reader.readSince("process.log", cursor)).resolves.toBe("current message\n")
  })

  it.each([
    ["the file shrinks", "file-1", "short\n"],
    ["the file is replaced", "file-2", "replacement message\n"],
  ])("reads the current file from the start when %s", async (_case, identity, current) => {
    const source = memorySource("a sufficiently long previous message\n", "file-1")
    const reader = createProcessLogReader(source.fileSystem)
    const cursor = await reader.capture("process.log")
    source.replace(current, identity)

    await expect(reader.readSince("process.log", cursor)).resolves.toBe(current)
  })
})
```

В этом же файле определить `memorySource`, возвращающий `fileSystem.info()` и `fileSystem.readRange()` с точными байтовыми границами. Для случая замены использовать новое `identity`, а для уменьшения — прежнее.

- [ ] **Step 2: Запустить новый тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/processLog.test.ts
```

Expected: FAIL с ошибкой отсутствующего модуля `./processLog`.

- [ ] **Step 3: Реализовать договор курсора и выбор начала диапазона**

Создать `processLog.ts`:

```ts
import fs from "node:fs"

export type ProcessLogCursor = { identity: string; size: number }

type ProcessLogFileSystem = {
  info(path: string): Promise<ProcessLogCursor>
  readRange(path: string, start: number, length: number): Promise<string>
}

export interface ProcessLogReader {
  capture(path: string): Promise<ProcessLogCursor>
  readSince(path: string, cursor?: ProcessLogCursor): Promise<string>
}

export function createProcessLogReader(fileSystem: ProcessLogFileSystem): ProcessLogReader {
  return {
    capture: (path) => fileSystem.info(path),
    async readSince(path, cursor) {
      const current = await fileSystem.info(path)
      const start = cursor !== undefined &&
        cursor.identity === current.identity &&
        current.size >= cursor.size
        ? cursor.size
        : 0
      return fileSystem.readRange(path, start, current.size - start)
    },
  }
}
```

В этом же модуле создать `nodeProcessLogReader` через `createProcessLogReader`. `info()` строит `identity` из `stats.dev` и `stats.ino`, а `readRange()` открывает файл через `fs.promises.open(path, "r")`, читает не более `length` байт начиная с `start` в цикле до конца диапазона и обязательно закрывает дескриптор в `finally`. Пустой диапазон возвращает пустую строку без выделения буфера.

- [ ] **Step 4: Запустить модульные тесты и проверку типов пакета**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/processLog.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 5: Проверить дубли и зафиксировать слой**

Run:

```bash
pnpm check:duplicates -- --base 3ffb201413b43389aebb0ed0a51a3d18cb98b0b6
git add packages/platform/src/sessions/processLog.ts packages/platform/src/sessions/processLog.test.ts
git commit -m "feat: :sparkles: добавить чтение прироста журнала платформы"
```

Expected: проверка дублей проходит; создан отдельный коммит.

### Task 3: Изоляция диагностики текущей выгрузки агента

**Files:**
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/nodeRuntime.ts`
- Test: `packages/platform/src/sessions/designerAgent.test.ts`

**Interfaces:**
- Consumes: `ProcessLogReader`, `ProcessLogCursor` и `nodeProcessLogReader` из Task 2.
- Produces: `DesignerAgentDependencies.processLogReader: ProcessLogReader`.
- Produces: `agentFailure(..., processLogCursor?: ProcessLogCursor)`, который прикладывает результат `readSince`, а не весь файл.

- [ ] **Step 1: Написать падающую проверку повторно используемой сессии**

Расширить память фикстуры полями `processLog` и `processLogDuringDump`. Перед `throw new Error("dump failed")` дописывать `processLogDuringDump`. Передать в зависимости фикстуры `processLogReader`, созданный через `createProcessLogReader` над памятью: `info()` возвращает постоянный `identity` и `Buffer.byteLength(processLog)`, а `readRange()` возвращает `Buffer.from(processLog).subarray(start, start + length).toString("utf8")`. При `processLogReadFailure: true` оба метода бросают `new Error("read failed secret")`.

Добавить проверку:

```ts
it("excludes an earlier process-log failure from a reused export", async () => {
  const fixture = createFixture({
    dumpFailure: true,
    processLog: "earlier failure\n",
    processLogDuringDump: "current failure\n",
  })
  const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

  await exportError(session, fixture.operationLog)

  const log = fixture.writes.get(fixture.operationLog.path)
  expect(log).toContain("current failure")
  expect(log).not.toContain("earlier failure")
})
```

Существующие проверки первой ошибки авторизации и недоступного журнала сохранить: первая читает весь текущий файл без курсора, вторая подтверждает приоритет исходной ошибки.

- [ ] **Step 2: Запустить проверку и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/designerAgent.test.ts
```

Expected: FAIL; журнал содержит `earlier failure`, потому что `agentFailure` пока читает файл целиком.

- [ ] **Step 3: Внедрить `ProcessLogReader` и фиксировать курсор перед командой**

В `DesignerAgentDependencies` добавить отдельную зависимость для `process.log`; существующий `fileSystem.readFile` сохранить для чтения `agentbasedir.json`:

```ts
processLogReader: ProcessLogReader
```

Непосредственно перед `commandSession.run(buildDumpConfigurationCommand(...))` безопасно получить курсор:

```ts
const processLogCursor = await captureProcessLogCursor(
  processLogPath,
  dependencies.processLogReader
)
```

Где вспомогательная функция не прерывает выгрузку, если журнал ещё не создан или временно недоступен:

```ts
async function captureProcessLogCursor(
  path: string,
  reader: ProcessLogReader
): Promise<ProcessLogCursor | undefined> {
  try {
    return await reader.capture(path)
  } catch {
    return undefined
  }
}
```

Передавать `processLogCursor` во все вызовы `agentFailure`, относящиеся к этой выгрузке, включая отмену и ошибку перемещения. Внутри `agentFailure` заменить полное чтение на:

```ts
const processLog = await dependencies.processLogReader.readSince(
  processLogPath,
  processLogCursor
)
```

Для ошибок запуска и аутентификации курсор не передавать: новый процесс уже запущен без `-NoTruncate`, поэтому читается весь журнал текущего процесса.

В `createNodePlatformSessionManagerDependencies()` передать:

```ts
processLogReader: nodeProcessLogReader,
```

- [ ] **Step 4: Запустить целевые проверки и проверку типов**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/sessions/processLog.test.ts src/sessions/designerAgent.test.ts src/sessions/commands.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS; автономные тесты `standaloneServer.test.ts` не требуют изменений.

- [ ] **Step 5: Проверить дубли и зафиксировать слой**

Run:

```bash
pnpm check:duplicates -- --base 3ffb201413b43389aebb0ed0a51a3d18cb98b0b6
git add packages/platform/src/sessions/designerAgent.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/nodeRuntime.ts
git commit -m "fix: :bug: изолировать журнал текущего импорта"
```

Expected: проверка дублей проходит; создан отдельный коммит.

### Task 4: Итоговая проверка ветки

**Files:**
- Verify only; production-файлы и тесты не изменяются без нового обнаруженного дефекта.

**Interfaces:**
- Consumes: все договоры Tasks 1–3.
- Produces: подтверждение работоспособности всего проекта и отсутствия новых дублей.

- [ ] **Step 1: Запустить обязательные проверки проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 3ffb201413b43389aebb0ed0a51a3d18cb98b0b6
git diff --check 3ffb201413b43389aebb0ed0a51a3d18cb98b0b6..HEAD
git status --short
```

Expected: все команды проходят; `git status --short` не выводит незаписанных изменений.

- [ ] **Step 2: Сверить наблюдаемые договоры**

Проверить по результатам тестов:

```text
новый агент: запуск без -NoTruncate
первая ошибка процесса: весь текущий process.log
повторный импорт: только байты после курсора
уменьшенный или заменённый файл: чтение с начала
недоступный журнал: исходная ошибка сохранена
standalone-server: текущие stdout/stderr ibcmd без изменений
```

Expected: каждый договор защищён конкретной проверкой; дополнительных изменений нет.
