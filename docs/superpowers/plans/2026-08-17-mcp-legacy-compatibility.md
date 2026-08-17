# MCP Legacy Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вернуть `@nkdk/mcp` совместимость со всеми legacy-версиями MCP SDK v2 через stdio, HTTP и watch, сохранив modern-протокол `2026-07-28`.

**Architecture:** Использовать встроенную dual-era маршрутизацию SDK: `legacy: "serve"` для stdio и `legacy: "stateless"` для HTTP. Watch-host хранит успешный открывающий запрос (`initialize` или `server/discover`) и повторяет его после reload до освобождения очереди.

**Tech Stack:** TypeScript 7, Vitest 4, `@modelcontextprotocol/server` 2.0.0, `@modelcontextprotocol/client` 2.0.0, Node.js 26, pnpm 10.

## Global Constraints

- Поддержать весь legacy-набор версий MCP SDK v2, включая Codex-версию `2025-06-18`.
- Сохранить modern-договор `2026-07-28`, единый `/mcp` и единую фабрику `createNkdkMcpServer`.
- Не добавлять зависимости, параметры CLI, отдельный legacy endpoint или ветвление бизнес-обработчиков по версии.
- Не изменять существующие XML-фикстуры.
- Следовать `.agents/testing.md`: сначала падающий тест, затем минимальная реализация; process/network проверки остаются integration-тестами.
- Базовая ревизия для duplicate-проверок: `75e10f274f9fed898b91e1989489bb9c87060698`.
- На базовой ревизии функциональные тесты `@nkdk/platform` проходят (`244/244`), но контроль длительности setup нестабилен и дважды превысил лимит (5,2 с и 3,1 с).

---

### Task 1: Legacy stdio handshake

**Files:**
- Rename: `packages/mcp/src/stdioLegacyRejection.integration.test.ts` → `packages/mcp/src/stdioLegacy.integration.test.ts`
- Modify: `packages/mcp/src/server.ts`

**Interfaces:**
- Consumes: `createNkdkMcpServer(): McpServer`, `serveStdio(factory, options)` и `mcpSourceLaunch`.
- Produces: `runStdioServer(onerror?): StdioServerHandle`, принимающий modern `server/discover` и legacy `initialize`.

- [ ] **Step 1: Заменить тест отказа на падающий тест legacy-клиента**

Переименовать файл и заменить его содержимое:

```ts
import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { mcpSourceLaunch } from "./mcpSourceTestLaunch"

let client: Client

beforeAll(async () => {
  client = new Client(
    { name: "nkdk-legacy-stdio-test", version: "1.0.0" },
    {
      supportedProtocolVersions: ["2025-06-18"],
      versionNegotiation: { mode: "legacy" },
    },
  )
  await client.connect(new StdioClientTransport({ ...mcpSourceLaunch, stderr: "pipe" }))
})

afterAll(async () => {
  await client.close()
})

describe("MCP stdio legacy compatibility", () => {
  it("обслуживает Codex-протокол 2025-06-18", async () => {
    expect(client.getProtocolEra()).toBe("legacy")
    expect(client.getNegotiatedProtocolVersion()).toBe("2025-06-18")

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.list_infobases")
  })
})
```

- [ ] **Step 2: Проверить RED**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --maxWorkers=1 --project integration src/stdioLegacy.integration.test.ts
```

Expected: FAIL при `client.connect` с `Unsupported protocol version`, потому что `runStdioServer` задаёт `legacy: "reject"`.

- [ ] **Step 3: Включить встроенную stdio-совместимость**

В `runStdioServer` заменить только posture SDK:

```ts
export function runStdioServer(onerror?: (error: Error) => void): StdioServerHandle {
  return serveStdio(createNkdkMcpServer, { legacy: "serve", onerror })
}
```

- [ ] **Step 4: Проверить GREEN и modern-регрессию**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --maxWorkers=1 --project integration src/stdioLegacy.integration.test.ts src/stdioModern.integration.test.ts
```

Expected: 2 test files pass; legacy negotiates `2025-06-18`, modern negotiates `2026-07-28`.

- [ ] **Step 5: Проверить типы и новые дубли**

Run:

```bash
pnpm --filter @nkdk/mcp type-check
pnpm duplicates -- --base 75e10f274f9fed898b91e1989489bb9c87060698
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 6: Закоммитить stdio-слой**

```bash
git add packages/mcp/src/server.ts packages/mcp/src/stdioLegacy.integration.test.ts packages/mcp/src/stdioLegacyRejection.integration.test.ts
git commit -m "feat: :sparkles: вернуть legacy MCP через stdio"
```

---

### Task 2: Legacy HTTP на существующем endpoint

**Files:**
- Create: `packages/mcp/src/httpLegacy.integration.test.ts`
- Modify: `packages/mcp/src/httpServer.ts`

**Interfaces:**
- Consumes: `createNkdkMcpHttpHandler(port, factory?)`, `StreamableHTTPClientTransport`, локальную Host-проверку `/mcp`.
- Produces: один `McpHttpHandler`, обслуживающий modern-запросы и legacy stateless-запросы.

- [ ] **Step 1: Написать падающий HTTP integration-тест**

Создать файл:

```ts
import { Client, StreamableHTTPClientTransport, type FetchLike } from "@modelcontextprotocol/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createNkdkMcpHttpHandler } from "./httpServer"

const port = 3000
const endpoint = new URL(`http://127.0.0.1:${port}/mcp`)
const handler = createNkdkMcpHttpHandler(port)
let client: Client

beforeAll(async () => {
  client = new Client(
    { name: "nkdk-legacy-http-test", version: "1.0.0" },
    {
      supportedProtocolVersions: ["2025-06-18"],
      versionNegotiation: { mode: "legacy" },
    },
  )
  await client.connect(new StreamableHTTPClientTransport(endpoint, { fetch: inProcessFetch(handler.fetch) }))
})

afterAll(async () => {
  await Promise.allSettled([client.close(), handler.close()])
})

describe("MCP HTTP legacy compatibility", () => {
  it("обслуживает Codex-протокол 2025-06-18 stateless-запросами", async () => {
    expect(client.getProtocolEra()).toBe("legacy")
    expect(client.getNegotiatedProtocolVersion()).toBe("2025-06-18")

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.list_infobases")
  })
})

function inProcessFetch(fetchHandler: (request: Request) => Promise<Response>): FetchLike {
  return async (input, init) => {
    const request = new Request(input, init)
    const headers = new Headers(request.headers)
    headers.set("host", `${endpoint.hostname}:${endpoint.port}`)
    return fetchHandler(new Request(request, { headers }))
  }
}
```

- [ ] **Step 2: Проверить RED**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --maxWorkers=1 --project integration src/httpLegacy.integration.test.ts
```

Expected: FAIL при `client.connect` с unsupported protocol response, потому что HTTP-handler задаёт `legacy: "reject"`.

- [ ] **Step 3: Включить встроенный HTTP fallback**

Изменить создание MCP-handler:

```ts
const mcp = createMcpHandler(factory, { legacy: "stateless" })
```

Не менять `validateLocalRequest`: legacy и modern продолжают проходить одинаковую защиту Host, Origin, path и Content-Type.

- [ ] **Step 4: Проверить GREEN, modern HTTP и защитный обработчик**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --maxWorkers=1 --project integration src/httpLegacy.integration.test.ts src/httpModern.integration.test.ts src/httpServer.integration.test.ts
```

Expected: 3 test files pass; оба семейства протокола работают на `/mcp`, защитные статусы не меняются.

- [ ] **Step 5: Проверить типы и дубли**

Run:

```bash
pnpm --filter @nkdk/mcp type-check
pnpm duplicates -- --base 75e10f274f9fed898b91e1989489bb9c87060698
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 6: Закоммитить HTTP-слой**

```bash
git add packages/mcp/src/httpServer.ts packages/mcp/src/httpLegacy.integration.test.ts
git commit -m "feat: :sparkles: вернуть legacy MCP через HTTP"
```

---

### Task 3: Восстановление legacy handshake в watch-mode

**Files:**
- Modify: `packages/mcp/src/watchHost.test.ts`
- Modify: `packages/mcp/src/watchHost.ts`

**Interfaces:**
- Consumes: JSON-RPC opening request с методом `initialize` или `server/discover`, `McpWatchWorker`.
- Produces: `createMcpWatchHost(options): McpWatchHost`, который сохраняет успешный opening request и восстанавливает выбранную era после reload.

- [ ] **Step 1: Добавить падающий unit-тест legacy reload**

Рядом с `discover` добавить:

```ts
const initialize = {
  jsonrpc: "2.0",
  id: 10,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "legacy-test", version: "1" },
  },
}
```

Добавить тест:

```ts
it("повторяет успешный initialize и удерживает очередь до ответа нового worker", () => {
  const harness = createHarness()
  harness.host.start()
  harness.host.receive(JSON.stringify(initialize))
  harness.workers[0]!.respond({
    jsonrpc: "2.0",
    id: 10,
    result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "nkdk", version: "1" } },
  })

  harness.host.reload()
  harness.host.receive(JSON.stringify({ jsonrpc: "2.0", id: 11, method: "tools/list", params: {} }))

  expect(harness.workers[1]!.written).toHaveLength(1)
  expect(JSON.parse(harness.workers[1]!.written[0]!)).toMatchObject({
    method: "initialize",
    id: "nkdk-watch-opening-2",
  })

  harness.workers[1]!.respond({
    jsonrpc: "2.0",
    id: "nkdk-watch-opening-2",
    result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "nkdk", version: "1" } },
  })

  expect(JSON.parse(harness.workers[1]!.written[1]!)).toMatchObject({ id: 11, method: "tools/list" })
})
```

Одновременно заменить в существующих discover-ожиданиях внутренний id на `nkdk-watch-opening-2` и текст fatal-ошибки на `Не удалось восстановить MCP handshake после обновления`. Это задаёт единый наблюдаемый договор для обеих era.

- [ ] **Step 2: Проверить RED**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --project unit src/watchHost.test.ts
```

Expected: новый legacy-тест FAIL — новый worker не получает `initialize`; discover-тесты с новым общим id также FAIL.

- [ ] **Step 3: Обобщить сохранение opening request**

В `watchHost.ts` выполнить механическую замену состояния и маршрутизации:

```ts
let successfulOpening: Record<string, unknown> | undefined
let pendingOpening: Record<string, unknown> | undefined
```

В `receive`:

```ts
const parsed = parseMessage(message)
if (isOpeningRequest(parsed)) pendingOpening = parsed
```

В `startWorker`:

```ts
if (successfulOpening === undefined) {
  ready = true
  drainQueue()
  return
}
const request = { ...successfulOpening, id: internalOpeningId(state.generation) }
send(JSON.stringify(request))
```

В `onWorkerOutput`:

```ts
if (parsed?.id === internalOpeningId(state.generation)) {
  if ("error" in parsed || !("result" in parsed)) {
    fail("Не удалось восстановить MCP handshake после обновления")
    return
  }
  ready = true
  drainQueue()
  continue
}
if (pendingOpening !== undefined && parsed !== undefined && parsed.id === pendingOpening.id) {
  if (!("error" in parsed) && "result" in parsed) successfulOpening = pendingOpening
  pendingOpening = undefined
}
```

Заменить helpers:

```ts
function internalOpeningId(generation: number): string {
  return `nkdk-watch-opening-${generation}`
}

function isOpeningRequest(message: Record<string, unknown> | undefined): boolean {
  return (message?.method === "server/discover" || message?.method === "initialize") && "id" in message
}
```

- [ ] **Step 4: Проверить GREEN**

Run:

```bash
pnpm --filter @nkdk/mcp exec vitest run --project unit src/watchHost.test.ts
```

Expected: все watch-host тесты проходят, включая modern и legacy reload.

- [ ] **Step 5: Проверить пакет и дубли**

Run:

```bash
pnpm --filter @nkdk/mcp type-check
pnpm --filter @nkdk/mcp test:isolated
pnpm duplicates -- --base 75e10f274f9fed898b91e1989489bb9c87060698
```

Expected: команды завершаются с кодом 0.

- [ ] **Step 6: Закоммитить watch-слой**

```bash
git add packages/mcp/src/watchHost.ts packages/mcp/src/watchHost.test.ts
git commit -m "fix: :bug: восстанавливать legacy handshake в watch"
```

---

### Task 4: Packed smoke и публичная документация

**Files:**
- Modify: `packages/mcp/scripts/smoke-packed.mjs`
- Modify: `README.md`
- Modify: `packages/mcp/README.md`

**Interfaces:**
- Consumes: собранный `dist/bin/nkdk-mcp`, `Client`, `StdioClientTransport`, `StreamableHTTPClientTransport`.
- Produces: packed smoke, проверяющий modern и legacy транспорты опубликованного пакета; документацию dual-era подключения.

- [ ] **Step 1: Расширить packed smoke legacy-клиентами**

Рядом с `modernClientOptions` добавить:

```js
const legacyClientOptions = {
  supportedProtocolVersions: ["2025-06-18"],
  versionNegotiation: { mode: "legacy" },
}
```

После закрытия основного modern stdio-клиента добавить отдельную минимальную проверку того же packed entrypoint:

```js
const legacyStdioClient = new Client(
  { name: "nkdk-packed-legacy-stdio-smoke", version: "1.0.0" },
  legacyClientOptions,
)
await legacyStdioClient.connect(new StdioClientTransport({ command, args: commandArgs }))
try {
  const tools = await legacyStdioClient.listTools()
  if (!tools.tools.some((tool) => tool.name === "nkdk.get_schema")) {
    throw new Error("packed legacy stdio server did not register nkdk.get_schema")
  }
} finally {
  await legacyStdioClient.close()
}
```

Внутри уже запущенного HTTP-процесса после modern HTTP-клиента добавить:

```js
const legacyHttpClient = new Client(
  { name: "nkdk-packed-legacy-http-smoke", version: "1.0.0" },
  legacyClientOptions,
)
await legacyHttpClient.connect(new StreamableHTTPClientTransport(new URL(endpoint)))
try {
  const tools = await legacyHttpClient.listTools()
  if (!tools.tools.some((tool) => tool.name === "nkdk.get_schema")) {
    throw new Error("packed legacy HTTP server did not register nkdk.get_schema")
  }
} finally {
  await legacyHttpClient.close()
}
```

- [ ] **Step 2: Обновить оба README одним договором**

В `README.md` и `packages/mcp/README.md` заменить modern-only предупреждение на:

```md
Сервер поддерживает modern MCP `2026-07-28` и legacy-версии, доступные в MCP SDK v2, включая `2025-06-18`, которую использует Codex. Клиент может подключаться через modern-handshake `server/discover` или legacy-handshake `initialize`; отдельная конфигурация и отдельный endpoint для legacy не требуются.
```

Сохранить существующие примеры stdio и HTTP запуска.

- [ ] **Step 3: Собрать пакет и выполнить packed smoke**

Run:

```bash
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: build и все modern/legacy smoke-проверки stdio и HTTP проходят.

- [ ] **Step 4: Проверить документацию и дубли**

Run:

```bash
git diff --check
pnpm duplicates -- --base 75e10f274f9fed898b91e1989489bb9c87060698
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 5: Закоммитить smoke и документацию**

```bash
git add packages/mcp/scripts/smoke-packed.mjs README.md packages/mcp/README.md
git commit -m "test: :white_check_mark: проверить legacy MCP в пакете" -m "Документировать единый dual-era режим для stdio и HTTP."
```

---

### Task 5: Полная проверка решения

**Files:**
- Verify only: весь worktree

**Interfaces:**
- Consumes: результаты Tasks 1–4.
- Produces: проверенный набор коммитов, готовый к review/PR; production-файлы на этом шаге не меняются.

- [ ] **Step 1: Выполнить полную пакетную проверку MCP**

Run:

```bash
pnpm --filter @nkdk/mcp type-check
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: все четыре команды проходят; integration-тесты подтверждают `2025-06-18` и `2026-07-28`.

- [ ] **Step 2: Выполнить архитектурные проверки**

Run:

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: обе команды завершаются с кодом 0; baseline dependency-cruiser не изменяется.

- [ ] **Step 3: Выполнить полную проверку проекта**

Run вне песочницы:

```bash
pnpm test
```

Expected: все функциональные тесты проходят. Если завершение блокирует только ранее воспроизведённый baseline-лимит длительности `@nkdk/platform`, сохранить полный вывод и явно отделить его от результатов MCP; не объявлять весь проект зелёным.

- [ ] **Step 4: Выполнить финальную duplicate-проверку**

Run:

```bash
pnpm duplicates -- --base 75e10f274f9fed898b91e1989489bb9c87060698
```

Expected: новых дублей нет.

- [ ] **Step 5: Проверить историю и чистоту worktree**

Run:

```bash
git status --short
git log --oneline 75e10f274f9fed898b91e1989489bb9c87060698..HEAD
```

Expected: worktree чист; история содержит спецификацию и четыре законченных слоя реализации.
