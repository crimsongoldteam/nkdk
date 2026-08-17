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
  openingReplayId?: string
}

export function createMcpWatchHost(options: McpWatchHostOptions): McpWatchHost {
  let active: WorkerState | undefined
  let successfulOpening: Record<string, unknown> | undefined
  let pendingOpening: Record<string, unknown> | undefined
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
      if (isOpeningRequest(parsed)) pendingOpening = parsed
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
    if (successfulOpening === undefined && pendingOpening === undefined) {
      ready = true
      drainQueue()
      return
    }
    if (successfulOpening === undefined) {
      send(JSON.stringify(pendingOpening))
      return
    }
    state.openingReplayId = internalOpeningId(state.generation)
    const request = { ...successfulOpening, id: state.openingReplayId }
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
      if (state.openingReplayId !== undefined && parsed?.id === state.openingReplayId) {
        state.openingReplayId = undefined
        if (!isSuccessfulOpeningResponse(successfulOpening, parsed)) {
          fail("Не удалось восстановить MCP handshake после обновления")
          return
        }
        ready = true
        drainQueue()
        continue
      }
      let completesPendingOpening = false
      if (pendingOpening !== undefined && parsed !== undefined && parsed.id === pendingOpening.id) {
        if (isSuccessfulOpeningResponse(pendingOpening, parsed)) successfulOpening = pendingOpening
        pendingOpening = undefined
        completesPendingOpening = !ready
      }
      options.writeOutput(line)
      if (completesPendingOpening) {
        ready = true
        drainQueue()
      }
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

function internalOpeningId(generation: number): string {
  return `nkdk-watch-opening-${generation}`
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

function isOpeningRequest(message: Record<string, unknown> | undefined): boolean {
  return (message?.method === "server/discover" || message?.method === "initialize") && "id" in message
}

function isSuccessfulOpeningResponse(
  opening: Record<string, unknown> | undefined,
  response: Record<string, unknown>,
): boolean {
  if (opening === undefined || response.jsonrpc !== "2.0" || "error" in response) return false
  const result = asRecord(response.result)
  return result?.protocolVersion === openingProtocolVersion(opening)
}

function openingProtocolVersion(opening: Record<string, unknown>): unknown {
  const params = asRecord(opening.params)
  if (opening.method === "initialize") return params?.protocolVersion
  return asRecord(params?._meta)?.["io.modelcontextprotocol/protocolVersion"]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
