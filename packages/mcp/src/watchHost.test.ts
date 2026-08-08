import { EventEmitter } from "node:events"
import { describe, expect, it } from "vitest"
import { createMcpWatchHost } from "./watchHost"

describe("MCP watch host", () => {
  it("keeps the client channel while a reloaded worker is initialized", async () => {
    const workers: FakeWorker[] = []
    const output: string[] = []
    const host = createMcpWatchHost({
      createWorker() {
        const worker = new FakeWorker()
        workers.push(worker)
        return worker
      },
      writeOutput(message) {
        output.push(message)
      },
    })

    host.start()
    host.receive('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}')
    workers[0]!.respond({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "nkdk", version: "1" } } })
    host.receive('{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}')

    host.reload()
    host.receive('{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"nkdk.list_infobases","arguments":{}}}')

    expect(workers).toHaveLength(2)
    expect(workers[1]!.written).toHaveLength(1)

    workers[1]!.respond({ jsonrpc: "2.0", id: "nkdk-watch-initialize-2", result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "nkdk", version: "1" } } })

    expect(workers[1]!.written).toHaveLength(3)
    workers[1]!.respond({ jsonrpc: "2.0", id: 2, result: { content: [{ type: "text", text: "ok" }] } })

    expect(output).toEqual([
      '{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{},"serverInfo":{"name":"nkdk","version":"1"}}}',
      '{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"ok"}]}}',
    ])
  })
})

class FakeWorker {
  readonly stdout = new EventEmitter()
  readonly written: string[] = []

  write(message: string): void {
    this.written.push(message)
  }

  respond(message: unknown): void {
    this.stdout.emit("data", `${JSON.stringify(message)}\n`)
  }

  kill(): void {}
}
