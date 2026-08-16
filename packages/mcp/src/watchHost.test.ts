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
      id: "nkdk-watch-discover-2",
    })

    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-discover-2",
      result: { protocolVersion: "2026-07-28" },
    })

    expect(harness.workers[1]!.written.slice(1).map((line) => JSON.parse(line).id)).toEqual([2, 3])
    expect(harness.output).toEqual([
      '{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2026-07-28"}}',
    ])
  })

  it("не повторяет неуспешный discover", () => {
    const harness = createHarness()
    harness.host.start()
    harness.host.receive(JSON.stringify(discover))
    harness.workers[0]!.respond({ jsonrpc: "2.0", id: 1, error: { code: -32602, message: "bad" } })

    harness.host.reload()

    expect(harness.workers[1]!.written).toEqual([])
  })

  it("явно завершает соединение при ошибке discover нового worker", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()

    harness.workers[1]!.respond({
      jsonrpc: "2.0",
      id: "nkdk-watch-discover-2",
      error: { code: -32603, message: "worker failed" },
    })

    expect(harness.fatal).toEqual(["Не удалось восстановить server/discover после обновления"])
  })

  it("не выпускает очередь после malformed discover-ответа нового worker", () => {
    const harness = createHarness()
    completeInitialDiscover(harness)
    harness.host.reload()
    harness.host.receive(request(2, "tools/list"))

    harness.workers[1]!.respond({ jsonrpc: "2.0", id: "nkdk-watch-discover-2" })

    expect(harness.workers[1]!.written).toHaveLength(1)
    expect(harness.fatal).toEqual(["Не удалось восстановить server/discover после обновления"])
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
  harness.workers[0]!.respond({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2026-07-28" } })
}

function request(id: number, method: string): string {
  return JSON.stringify({ jsonrpc: "2.0", id, method, params: { _meta: discover.params._meta } })
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
