import { EventEmitter } from "node:events"
import { describe, expect, it } from "vitest"
import { createMcpWatchHost } from "./watchHost"

const discover = {
  jsonrpc: "2.0",
  id: 1,
  method: "server/discover",
  params: {
    _meta: {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": { name: "test", version: "1" },
      "io.modelcontextprotocol/clientCapabilities": {},
    },
  },
}

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  },
}

describe("MCP watch host", () => {
  it("повторяет только успешный discover и сохраняет порядок очереди", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)

    harness.host.reload()
    harness.host.receive(request(2, "tools/list"))
    harness.host.receive(request(3, "prompts/list"))

    expect(harness.workers[1]!.written).toHaveLength(1)
    expect(JSON.parse(harness.workers[1]!.written[0]!)).toMatchObject({
      method: "server/discover",
      id: "nkdk-watch-opening-2",
    })

    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      result: { supportedVersions: ["2026-07-28"] },
    })

    expect(harness.workers[1]!.written.slice(1).map((line) => JSON.parse(line).id)).toEqual([2, 3])
    expect(harness.output).toEqual([JSON.stringify(discoverResponse(1))])
  })

  it("повторяет успешный legacy initialize и сохраняет порядок очереди", () => {
    const harness = createHarness()
    completeInitialInitialize(harness)

    harness.host.reload()
    harness.host.receive(request(2, "tools/list"))

    expect(JSON.parse(harness.workers[1]!.written[0]!)).toMatchObject({
      method: "initialize",
      id: "nkdk-watch-opening-2",
    })

    harness.workers[1]!.respond(openingResponse("nkdk-watch-opening-2", "2025-06-18"))

    expectLegacyQueueReleased(harness)
  })

  it("повторяет незавершённый initialize после reload", () => {
    const harness = createHarness()
    harness.host.start()
    harness.host.receive(JSON.stringify(initialize))

    harness.host.reload()
    harness.host.receive(request(2, "tools/list"))

    expect(harness.workers[1]!.written.map((line) => JSON.parse(line))).toEqual([initialize])

    harness.workers[1]!.respond(openingResponse(1, "2025-06-18"))

    expectLegacyQueueReleased(harness)
  })

  it("не перехватывает клиентский id после восстановления handshake", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()
    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      result: { supportedVersions: ["2026-07-28"] },
    })

    harness.host.receive(JSON.stringify({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      method: "tools/list",
    }))
    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      result: { tools: [] },
    })

    expect(harness.output.at(-1)).toBe('{"jsonrpc":"2.0","id":"nkdk-watch-opening-2","result":{"tools":[]}}')
  })

  it("не повторяет неуспешный discover", () => {
    const harness = createHarness()
    harness.host.start()
    harness.host.receive(JSON.stringify(discover))
    harness.workers[0]!.respond({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: "bad" } })

    harness.host.reload()

    expect(harness.workers[1]!.written).toEqual([])
  })

  it("сохраняет успешный незавершённый discover после reload", () => {
    const harness = createHarness()
    harness.host.start()
    harness.host.receive(JSON.stringify(discover))

    harness.host.reload()
    expect(harness.workers[1]!.written.map((line) => JSON.parse(line))).toEqual([discover])
    harness.workers[1]!.respond(discoverResponse(1))

    harness.host.reload()

    expect(JSON.parse(harness.workers[2]!.written[0]!)).toMatchObject({
      method: "server/discover",
      id: "nkdk-watch-opening-3",
    })
  })

  it("явно завершает соединение при ошибке discover нового worker", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()

    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      error: { code: -32603, message: "worker failed" },
    })

    expect(harness.fatal).toEqual(["Не удалось восстановить MCP handshake после обновления"])
  })

  it("не выпускает очередь после malformed discover-ответа нового worker", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()
    harness.host.receive(request(2, "tools/list"))

    harness.workers[1]!.respond({ jsonrpc: "2.0", id: "nkdk-watch-opening-2" })

    expect(harness.workers[1]!.written).toHaveLength(1)
    expect(harness.fatal).toEqual(["Не удалось восстановить MCP handshake после обновления"])
  })

  it("завершает соединение при несовместимой версии восстановленного handshake", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()

    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-opening-2",
      result: { supportedVersions: ["2027-01-01"] },
    })

    expect(harness.fatal).toEqual(["Не удалось восстановить MCP handshake после обновления"])
  })

  it("завершает соединение при неразбираемом ответе восстановленного handshake", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()

    harness.workers[1]!.respondRaw("{broken\n")

    expect(harness.fatal).toEqual(["Не удалось восстановить MCP handshake после обновления"])
  })

  it("явно завершает соединение при выходе нового worker", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()

    harness.workers[1]!.exit()

    expect(harness.fatal).toEqual(["MCP worker завершился во время watch-подключения"])
  })

  it("закрывает активный worker без ложной fatal-ошибки", () => {
    const harness = createHarness()
    harness.host.start()

    harness.host.close()
    harness.workers[0]!.exit()
    harness.host.close()

    expect(harness.workers[0]!.killCount).toBe(1)
    expect(harness.fatal).toEqual([])
  })
})

function createHarness() {
  const workers: FakeWorker[] = []
  const output: string[] = []
  const fatal: string[] = []
  const host = createMcpWatchHost({
    createWorker() {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker
    },
    writeOutput(message) {
      output.push(message)
    },
    onFatal(message) {
      fatal.push(message)
    },
  })
  return { workers, output, fatal, host }
}

function completeInitialDiscover(harness: ReturnType<typeof createHarness>): void {
  harness.host.start()
  harness.host.receive(JSON.stringify(discover))
  harness.workers[0]!.respond(discoverResponse(1))
}

function completeInitialInitialize(harness: ReturnType<typeof createHarness>): void {
  harness.host.start()
  harness.host.receive(JSON.stringify(initialize))
  harness.workers[0]!.respond({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18" } })
}

function request(id: number, method: string): string {
  return JSON.stringify({ jsonrpc: "2.0", id, method, params: { _meta: discover.params._meta } })
}

function openingResponse(id: number | string, protocolVersion: string): Record<string, unknown> {
  return { jsonrpc: "2.0", id, result: { protocolVersion } }
}

function discoverResponse(id: number | string): Record<string, unknown> {
  return { jsonrpc: "2.0", id, result: { supportedVersions: ["2026-07-28"] } }
}

function expectLegacyQueueReleased(harness: ReturnType<typeof createHarness>): void {
  expect(harness.workers[1]!.written.slice(1).map((line) => JSON.parse(line).id)).toEqual([2])
  expect(harness.output).toEqual([JSON.stringify(openingResponse(1, "2025-06-18"))])
}

class FakeWorker {
  readonly stdout = new EventEmitter()
  readonly written: string[] = []
  readonly exits: Array<() => void> = []
  killCount = 0

  write(message: string): void {
    this.written.push(message.trimEnd())
  }

  respond(message: unknown): void {
    this.stdout.emit("data", `${JSON.stringify(message)}\n`)
  }

  respondRaw(message: string): void {
    this.stdout.emit("data", message)
  }

  onExit(listener: () => void): void {
    this.exits.push(listener)
  }

  exit(): void {
    for (const listener of this.exits) listener()
  }

  kill(): void {
    this.killCount += 1
  }
}
