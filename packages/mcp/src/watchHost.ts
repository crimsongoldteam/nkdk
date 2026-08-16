import type { EventEmitter } from "node:events"

export interface McpWatchWorker {
  readonly stdout: Pick<EventEmitter, "on">
  write(message: string): void
  onExit(listener: () => void): void
  kill(): void
}

interface McpWatchHostOptions {
  readonly createWorker: () => McpWatchWorker
  readonly writeOutput: (message: string) => void
  readonly onFatal: (message: string) => void
}

export interface McpWatchHost {
  start(): void
  receive(message: string): void
  reload(): void
  close(): void
}

type WorkerState = {
  readonly worker: McpWatchWorker
  readonly generation: number
  buffer: string
}

export function createMcpWatchHost(options: McpWatchHostOptions): McpWatchHost {
  let active: WorkerState | undefined
  let successfulDiscover: Record<string, unknown> | undefined
  let pendingDiscover: Record<string, unknown> | undefined
  let ready = false
  let failed = false
  let closed = false
  let generation = 0
  const queued: string[] = []

  return {
    start() {
      if (active !== undefined || failed || closed) return
      startWorker()
    },
    receive(message) {
      if (failed || closed) return
      const parsed = parseMessage(message)
      if (isDiscoverRequest(parsed)) pendingDiscover = parsed
      if (active === undefined) startWorker()
      if (!ready) {
        queued.push(message)
        return
      }
      send(message)
    },
    reload() {
      if (failed || closed) return
      const previous = active
      active = undefined
      ready = false
      previous?.worker.kill()
      startWorker()
    },
    close() {
      if (closed) return
      closed = true
      const current = active
      active = undefined
      ready = false
      queued.length = 0
      current?.worker.kill()
    },
  }

  function startWorker(): void {
    generation += 1
    const state: WorkerState = {
      worker: options.createWorker(),
      generation,
      buffer: "",
    }
    active = state
    state.worker.stdout.on("data", (chunk) => onWorkerOutput(state, chunk))
    state.worker.onExit(() => {
      if (active === state) fail("MCP worker завершился во время watch-подключения")
    })
    if (successfulDiscover === undefined) {
      ready = true
      drainQueue()
      return
    }
    const request = { ...successfulDiscover, id: internalDiscoverId(state.generation) }
    send(JSON.stringify(request))
  }

  function onWorkerOutput(state: WorkerState, chunk: unknown): void {
    if (active !== state || failed) return
    state.buffer += String(chunk)
    const lines = state.buffer.split(/\r?\n/u)
    state.buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (line.length === 0) continue
      const parsed = parseMessage(line)
      if (parsed?.id === internalDiscoverId(state.generation)) {
        if ("error" in parsed) {
          fail("Не удалось восстановить server/discover после обновления")
          return
        }
        ready = true
        drainQueue()
        continue
      }
      if (pendingDiscover !== undefined && parsed !== undefined && parsed.id === pendingDiscover.id) {
        if (!("error" in parsed) && "result" in parsed) successfulDiscover = pendingDiscover
        pendingDiscover = undefined
      }
      options.writeOutput(line)
    }
  }

  function drainQueue(): void {
    for (const message of queued.splice(0)) send(message)
  }

  function send(message: string): void {
    active?.worker.write(`${message}\n`)
  }

  function fail(message: string): void {
    if (failed) return
    failed = true
    const current = active
    active = undefined
    ready = false
    queued.length = 0
    current?.worker.kill()
    options.onFatal(message)
  }
}

function internalDiscoverId(generation: number): string {
  return `nkdk-watch-discover-${generation}`
}

function parseMessage(message: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(message)
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function isDiscoverRequest(message: Record<string, unknown> | undefined): boolean {
  return message?.method === "server/discover" && "id" in message
}
