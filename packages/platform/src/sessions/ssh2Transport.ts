import { Client, type ClientChannel, type ConnectConfig } from "ssh2"
import { PlatformSessionError } from "./errors"
import {
  systemSessionClock,
  type SessionClock,
  type SshShell,
  type SshTransport,
} from "./runtime"

type LoopbackConnectConfig = {
  host: "127.0.0.1"
  port: number
  readyTimeout: number
  authHandler: Array<{ type: "none"; username: "" }>
  hostVerifier: () => boolean
}

export interface Ssh2ShellStream {
  write(value: string): void
  on(event: "data" | "error" | "close" | "end", listener: (value?: unknown) => void): Ssh2ShellStream
  end(): void
}

export interface Ssh2ClientLike {
  on(event: "ready" | "error" | "close" | "end", listener: (value?: unknown) => void): Ssh2ClientLike
  connect(config: LoopbackConnectConfig): void
  shell(callback: (error: Error | undefined, stream?: Ssh2ShellStream) => void): void
  end(): void
  destroy(): void
}

export function createSsh2Transport(
  dependencies: {
    createClient?: () => Ssh2ClientLike
    clock?: SessionClock
  } = {}
): SshTransport {
  const createClient = dependencies.createClient ?? createNativeClient
  const clock = dependencies.clock ?? systemSessionClock
  return {
    async connect(params) {
      if (params.host !== "127.0.0.1") {
        throw new PlatformSessionError("session_start_failed", "SSH доступен только через loopback")
      }
      const client = createClient()
      return new Promise<SshShell>((resolve, reject) => {
        let settled = false
        const timer = clock.setTimeout(() => {
          if (settled) return
          settled = true
          client.destroy()
          reject(new PlatformSessionError("session_start_failed", "Не удалось открыть локальный SSH-сеанс"))
        }, params.timeoutMs)
        const rejectStartup = () => {
          if (settled) return
          settled = true
          clock.clearTimeout(timer)
          client.destroy()
          reject(new PlatformSessionError("session_start_failed", "Не удалось открыть локальный SSH-сеанс"))
        }
        client
          .on("error", rejectStartup)
          .on("close", rejectStartup)
          .on("end", rejectStartup)
          .on("ready", () => {
            client.shell((error, stream) => {
              if (error !== undefined || stream === undefined) {
                rejectStartup()
                return
              }
              if (settled) {
                stream.end()
                return
              }
              settled = true
              clock.clearTimeout(timer)
              resolve(createShell(client, stream))
            })
          })
        client.connect({
          host: "127.0.0.1",
          port: params.port,
          readyTimeout: params.timeoutMs,
          authHandler: [{ type: "none", username: "" }],
          hostVerifier: () => true,
        })
      })
    },
  }
}

function createShell(client: Ssh2ClientLike, stream: Ssh2ShellStream): SshShell {
  let open = true
  const dataListeners = new Set<(chunk: string) => void>()
  const markClosed = () => {
    open = false
  }
  stream
    .on("data", (value) => {
      const chunk = Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "")
      for (const listener of dataListeners) listener(chunk)
    })
    .on("error", markClosed)
    .on("close", markClosed)
    .on("end", markClosed)
  client.on("error", markClosed).on("close", markClosed).on("end", markClosed)

  return {
    write(value) {
      if (!open) throw new PlatformSessionError("session_start_failed", "SSH-сеанс платформы закрыт")
      stream.write(value)
    },
    onData(listener) {
      dataListeners.add(listener)
      return () => dataListeners.delete(listener)
    },
    isOpen() {
      return open
    },
    async close() {
      if (!open) return
      open = false
      stream.end()
      client.end()
    },
  }
}

function createNativeClient(): Ssh2ClientLike {
  const client = new Client()
  const wrapped: Ssh2ClientLike = {
    on(event, listener) {
      if (event === "ready") client.on(event, () => listener())
      else if (event === "error") client.on(event, (error) => listener(error))
      else if (event === "close") client.on(event, () => listener())
      else client.on("end", () => listener())
      return wrapped
    },
    connect(config) {
      const nativeConfig: ConnectConfig = config
      client.connect(nativeConfig)
    },
    shell(callback) {
      client.shell((error, stream) => {
        callback(error ?? undefined, stream === undefined ? undefined : wrapNativeStream(stream))
      })
    },
    end() {
      client.end()
    },
    destroy() {
      client.destroy()
    },
  }
  return wrapped
}

function wrapNativeStream(stream: ClientChannel): Ssh2ShellStream {
  const wrapped: Ssh2ShellStream = {
    write(value) {
      stream.write(value)
    },
    on(event, listener) {
      if (event === "data") stream.on(event, (value: Buffer) => listener(value))
      else if (event === "error") stream.on(event, (error: Error) => listener(error))
      else if (event === "close") stream.on(event, () => listener())
      else stream.on("end", () => listener())
      return wrapped
    },
    end() {
      stream.end()
    },
  }
  return wrapped
}
