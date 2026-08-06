import { describe, expect, it } from "vitest"
import type { SessionClock } from "./runtime"
import {
  createSsh2Transport,
  type Ssh2ClientLike,
  type Ssh2ShellStream,
} from "./ssh2Transport"

describe("ssh2 loopback transport", () => {
  it("opens an authenticated interactive shell only on loopback", async () => {
    const client = fakeClient()
    const transport = createSsh2Transport({ createClient: () => client })
    const pending = transport.connect({
      host: "127.0.0.1",
      port: 58248,
      timeoutMs: 1_000,
      expectedHostKeyHash: "trusted",
      user: "Администратор",
      password: "secret",
    })

    expect(client.connectConfig).toMatchObject({
      host: "127.0.0.1",
      port: 58248,
      readyTimeout: 1_000,
      username: "Администратор",
      password: "secret",
      hostHash: "sha256",
    })
    expect(client.connectConfig?.["hostVerifier"]?.("trusted")).toBe(true)
    expect(client.connectConfig?.["hostVerifier"]?.("attacker")).toBe(false)
    client.emit("ready")
    const shell = await pending
    expect(client.shellWindow).toBe(false)
    const chunks: string[] = []
    shell.onData((chunk) => chunks.push(chunk))
    client.stream.emit("data", Buffer.from("designer> "))

    expect(chunks).toEqual(["designer> "])
    expect(shell.isOpen()).toBe(true)
    shell.write("common connect-ib\n")
    expect(client.stream.writes).toEqual(["common connect-ib\n"])

    await shell.close()
    expect(client.stream.ended).toBe(true)
    expect(client.ended).toBe(true)
    expect(shell.isOpen()).toBe(false)
  })

  it("uses the injected timeout and destroys an unready client", async () => {
    const client = fakeClient()
    const clock = controlledClock()
    const pending = createSsh2Transport({ createClient: () => client, clock }).connect({
      host: "127.0.0.1",
      port: 58248,
      timeoutMs: 100,
      expectedHostKeyHash: "trusted",
    })

    clock.expire()

    await expect(pending).rejects.toMatchObject({ code: "session_start_failed" })
    expect(client.destroyed).toBe(true)
  })

  it("reports rejected SSH credentials as an authentication failure", async () => {
    const client = fakeClient()
    const pending = createSsh2Transport({ createClient: () => client }).connect({
      host: "127.0.0.1",
      port: 58248,
      timeoutMs: 1_000,
      expectedHostKeyHash: "trusted",
      user: "Администратор",
      password: "wrong",
    })

    client.emit("error", { level: "client-authentication" })

    await expect(pending).rejects.toMatchObject({ code: "authentication_failed" })
    expect(client.destroyed).toBe(true)
  })
})

type FakeStream = Ssh2ShellStream & {
  writes: string[]
  ended: boolean
  emit(event: string, value?: unknown): void
}

type FakeClient = Ssh2ClientLike & {
  connectConfig?: {
    hostVerifier?: (fingerprint: string) => boolean
    [key: string]: unknown
  }
  shellWindow?: false
  stream: FakeStream
  ended: boolean
  destroyed: boolean
  emit(event: string, value?: unknown): void
}

function fakeClient(): FakeClient {
  const clientListeners = new Map<string, Array<(value?: unknown) => void>>()
  const streamListeners = new Map<string, Array<(value?: unknown) => void>>()
  const stream: FakeStream = {
    writes: [],
    ended: false,
    write(value) {
      this.writes.push(value)
    },
    on(event, listener) {
      const listeners = streamListeners.get(event) ?? []
      listeners.push(listener)
      streamListeners.set(event, listeners)
      return this
    },
    end() {
      this.ended = true
      this.emit("close")
    },
    emit(event, value) {
      for (const listener of streamListeners.get(event) ?? []) listener(value)
    },
  }
  return {
    stream,
    ended: false,
    destroyed: false,
    on(event, listener) {
      const listeners = clientListeners.get(event) ?? []
      listeners.push(listener)
      clientListeners.set(event, listeners)
      return this
    },
    connect(config) {
      this.connectConfig = config
    },
    shell(window, callback) {
      this.shellWindow = window
      callback(undefined, stream)
    },
    end() {
      this.ended = true
    },
    destroy() {
      this.destroyed = true
    },
    emit(event, value) {
      for (const listener of clientListeners.get(event) ?? []) listener(value)
    },
  }
}

function controlledClock(): SessionClock & { expire(): void } {
  let callback: (() => void) | undefined
  return {
    setTimeout(nextCallback) {
      callback = nextCallback
      return nextCallback
    },
    clearTimeout() {
      callback = undefined
    },
    expire() {
      const current = callback
      callback = undefined
      current?.()
    },
  }
}
