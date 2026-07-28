import { describe, expect, it } from "vitest"
import type { SessionClock, SshShell } from "./runtime"
import { openPlatformCommandSession } from "./sshProtocol"

describe("platform SSH command protocol", () => {
  it("selects JSON, connects to the infobase, and completes a command", async () => {
    const diagnostics: string[] = []
    const shell = scriptedShell([
      "1C:Enterprise 8.3 1C Designer Shell © 1C-Soft LLC 1996-2023\r\ndesigner> ",
      '[\r\n{\r\n"type": "success",\r\n"message": "",\r\n"body": []\r\n}\r\n]designer> ',
      '[{"type":"question","message":"User"}]\ndesigner> ',
      '[{"type":"question","message":"Password"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"success","message":"Dump complete"}]\ndesigner> ',
    ])

    const session = await openPlatformCommandSession({
      shell,
      user: "Администратор",
      password: "secret",
      timeoutMs: 60_000,
      diagnostic: (message) => diagnostics.push(message),
    })
    await expect(
      session.run('config dump-config-to-files --dir="xml"')
    ).resolves.toEqual({ extensionInfo: [] })

    expect(shell.rawWrites).toEqual([
      "options set --output-format=json\n",
      "common connect-ib\n",
      "Администратор\n",
      "secret\n",
      'config dump-config-to-files --dir="xml"\n',
    ])
    expect(JSON.stringify(diagnostics)).not.toContain("secret")
    expect(JSON.stringify(diagnostics)).not.toContain("Администратор")
  })

  it("maps a rejected login to authentication_failed", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"error","message":"Access denied"}]\ndesigner> ',
    ])

    await expect(openPlatformCommandSession({ shell, timeoutMs: 100 })).rejects.toMatchObject({
      code: "authentication_failed",
    })
  })

  it("accepts the standalone server UUID prompt without a trailing space", async () => {
    const prompt = "@f8afddba-896a-4c97-b44e-338f8f44bc13>"
    const shell = scriptedShell([
      `1C:Enterprise 8.3 Stand-alone Server © 1C-Soft LLC 1996-2023\r\n${prompt}`,
      '[{"type":"success","message":""}]',
      '[{"type":"success","message":""}]',
    ])

    await expect(
      openPlatformCommandSession({ shell, timeoutMs: 100 })
    ).resolves.toMatchObject({ isAlive: expect.any(Function) })
  })

  it("maps a command error without leaking its secret values", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"error","message":"secret failure"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      password: "secret",
      timeoutMs: 100,
    })

    const error = await session.run("bad command").catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: "platform_command_failed" })
    expect(String(error)).not.toContain("secret")
  })

  it("returns extension-info bodies in platform order", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"extension-info","body":{"name":"First"}},{"type":"extension-info","body":{"name":"Second"}},{"type":"success","message":"Done"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
    })

    await expect(
      session.run("config extensions properties get --all-extensions")
    ).resolves.toEqual({
      extensionInfo: [{ name: "First" }, { name: "Second" }],
    })
  })

  it("rejects extension-info without a body", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"extension-info"},{"type":"success","message":"Done"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
    })

    await expect(
      session.run("config extensions properties get --all-extensions")
    ).rejects.toMatchObject({ code: "platform_command_failed" })
  })

  it("rejects malformed JSON from the platform", async () => {
    const shell = scriptedShell([
      "designer> ",
      "not-json\ndesigner> ",
    ])

    await expect(openPlatformCommandSession({ shell, timeoutMs: 100 })).rejects.toMatchObject({
      code: "session_start_failed",
    })
  })

  it("rejects a shell that is already closed", async () => {
    const shell = scriptedShell([], false)

    await expect(openPlatformCommandSession({ shell, timeoutMs: 100 })).rejects.toMatchObject({
      code: "session_start_failed",
    })
  })

  it("uses the injected timer and maps expiry to session_timeout", async () => {
    const clock = controlledClock()
    const pending = openPlatformCommandSession({
      shell: scriptedShell([]),
      timeoutMs: 100,
      clock,
    })

    clock.expire()

    await expect(pending).rejects.toMatchObject({ code: "session_timeout" })
  })

  it("does not arm a timer for a platform command", async () => {
    const clock = controlledClock()
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"success","message":"Done"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({ shell, timeoutMs: 100, clock })
    clock.resetCounters()

    await session.run("config dump-config-to-files")

    expect(clock.setCalls()).toBe(0)
  })

  it("cancels a pending platform command", async () => {
    const controller = new AbortController()
    const session = await openPlatformCommandSession({
      shell: scriptedShell([
        "designer> ",
        '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
        '[{"type":"success","message":"Connected"}]\ndesigner> ',
      ]),
      timeoutMs: 100,
    })

    const pending = session.run("config dump-config-to-files", {
      signal: controller.signal,
    })
    controller.abort()

    await expect(pending).rejects.toMatchObject({ code: "operation_cancelled" })
  })
})

type ScriptedShell = SshShell & { rawWrites: string[] }

function scriptedShell(chunks: string[], initiallyOpen = true): ScriptedShell {
  let open = initiallyOpen
  let listener: ((chunk: string) => void) | undefined
  const remaining = [...chunks]
  const emitNext = () => {
    const chunk = remaining.shift()
    if (chunk !== undefined) queueMicrotask(() => listener?.(chunk))
  }
  return {
    rawWrites: [],
    write(value) {
      this.rawWrites.push(value)
      emitNext()
    },
    onData(nextListener) {
      listener = nextListener
      emitNext()
      return () => {
        listener = undefined
      }
    },
    isOpen() {
      return open
    },
    async close() {
      open = false
    },
  }
}

function controlledClock(): SessionClock & {
  expire(): void
  resetCounters(): void
  setCalls(): number
} {
  let callback: (() => void) | undefined
  let setCalls = 0
  return {
    setTimeout(nextCallback) {
      setCalls += 1
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
    resetCounters() {
      setCalls = 0
    },
    setCalls() {
      return setCalls
    },
  }
}
