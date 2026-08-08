import type { EventEmitter } from "node:events"

export interface McpWatchWorker {
  readonly stdout: Pick<EventEmitter, "on">
  write(message: string): void
  kill(): void
}

interface McpWatchHostOptions {
  readonly createWorker: () => McpWatchWorker
  readonly writeOutput: (message: string) => void
}

export interface McpWatchHost {
  start(): void
  receive(message: string): void
  reload(): void
}

export function createMcpWatchHost(options: McpWatchHostOptions): McpWatchHost {
  let worker: McpWatchWorker | undefined
  let initialization: Record<string, unknown> | undefined
  let initializedNotification: string | undefined
  let ready = false
  let generation = 0
  const queued: string[] = []

  return {
    start() {
      if (worker !== undefined) return
      startWorker()
    },
    receive(message) {
      const parsed = parseMessage(message)
      if (isInitializeRequest(parsed)) initialization = parsed
      if (isInitializedNotification(parsed)) initializedNotification = message
      if (worker === undefined) startWorker()
      if (!ready && !isInitializeRequest(parsed)) {
        queued.push(message)
        return
      }
      send(message)
    },
    reload() {
      worker?.kill()
      worker = undefined
      ready = false
      startWorker()
    },
  }

  function startWorker(): void {
    generation += 1
    worker = options.createWorker()
    worker.stdout.on("data", onWorkerOutput)
    if (initialization === undefined) {
      ready = true
      drainQueue()
      return
    }
    ready = false
    const request = { ...initialization, id: `nkdk-watch-initialize-${generation}` }
    send(JSON.stringify(request))
  }

  function onWorkerOutput(chunk: unknown): void {
    for (const line of String(chunk).split(/\r?\n/)) {
      if (line.length === 0) continue
      const parsed = parseMessage(line)
      if (parsed?.id === `nkdk-watch-initialize-${generation}`) {
        ready = true
        if (initializedNotification !== undefined) send(initializedNotification)
        drainQueue()
        continue
      }
      options.writeOutput(line)
    }
  }

  function drainQueue(): void {
    for (const message of queued.splice(0)) send(message)
  }

  function send(message: string): void {
    worker?.write(`${message}\n`)
  }
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

function isInitializeRequest(message: Record<string, unknown> | undefined): boolean {
  return message?.method === "initialize" && "id" in message
}

function isInitializedNotification(message: Record<string, unknown> | undefined): boolean {
  return message?.method === "notifications/initialized"
}
