import { describe, expect, it } from "vitest"
import type { PlatformOperationLog, SessionClock, SshShell } from "./runtime"
import { openPlatformCommandSession } from "./sshProtocol"

describe("platform SSH command protocol", () => {
  it("selects JSON, connects to the infobase, and completes a command", async () => {
    const diagnostics: string[] = []
    const operationMessages: string[] = []
    const operationLog = recordingOperationLog(operationMessages)
    const stages: Array<[string, string]> = []
    const shell = scriptedShell([
      "1C:Enterprise 8.3 1C Designer Shell © 1C-Soft LLC 1996-2023\r\ndesigner> ",
      '[\r\n{\r\n"type": "success",\r\n"message": "",\r\n"body": []\r\n}\r\n]',
      '[{"type":"question","message":"User"}]',
      '[{"type":"question","message":"Password"}]',
      '[{"type":"success","message":"Connected"}]',
      '[{"type":"success","message":"Dump complete"}]',
    ])

    const session = await openPlatformCommandSession({
      shell,
      user: "Администратор",
      password: "secret",
      timeoutMs: 60_000,
      diagnostic: (message) => diagnostics.push(message),
      operationLog,
      onStage: async (stage: "protocol-handshake" | "authentication", status: "start" | "ready") => {
        stages.push([stage, status])
      },
    })
    await expect(
      session.run('config dump-config-to-files --dir="xml"', { operationLog })
    ).resolves.toEqual({})

    expect(shell.rawWrites).toEqual([
      "options set --show-prompt=no --output-format=json\n",
      "common connect-ib\n",
      "Администратор\n",
      "secret\n",
      'config dump-config-to-files --dir="xml"\n',
    ])
    expect(JSON.stringify(diagnostics)).not.toContain("secret")
    expect(JSON.stringify(diagnostics)).not.toContain("Администратор")
    expect(stages).toEqual([
      ["protocol-handshake", "start"],
      ["protocol-handshake", "ready"],
      ["authentication", "start"],
      ["authentication", "ready"],
    ])
    expect(operationMessages).toEqual(expect.arrayContaining([
      "command status=start value=options set --show-prompt=no --output-format=json",
      expect.stringMatching(/^command status=ready value=options set --show-prompt=no --output-format=json receivedBytes=\d+ successSeen=true$/u),
      "command status=start value=common connect-ib",
      expect.stringMatching(/^command status=ready value=common connect-ib receivedBytes=\d+ successSeen=true$/u),
      'command status=start value=config dump-config-to-files --dir="xml"',
      expect.stringMatching(/^command status=ready value=config dump-config-to-files --dir="xml" receivedBytes=\d+ successSeen=true$/u),
    ]))
  })

  it("preserves the platform message for a rejected login", async () => {
    const stages: Array<[string, string]> = []
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"error","message":"Неверное имя пользователя или пароль"}]\ndesigner> ',
    ])

    await expect(openPlatformCommandSession({
      shell,
      timeoutMs: 100,
      onStage: async (stage: "protocol-handshake" | "authentication", status: "start" | "ready") => {
        stages.push([stage, status])
      },
    })).rejects.toMatchObject({
      code: "authentication_failed",
      message: "Неверное имя пользователя или пароль",
    })
    expect(stages).toEqual([
      ["protocol-handshake", "start"],
      ["protocol-handshake", "ready"],
      ["authentication", "start"],
    ])
  })

  it("accepts the standalone server UUID prompt without a trailing space", async () => {
    const prompt = "@f8afddba-896a-4c97-b44e-338f8f44bc13>"
    const shell = scriptedShell([
      `1C:Enterprise 8.3 Stand-alone Server © 1C-Soft LLC 1996-2023\r\n${prompt}`,
      '[{"type":"success","message":""}]',
      '[{"type":"success","message":""}]',
    ])

    await expect(openPlatformCommandSession({ shell, timeoutMs: 100 }))
      .resolves.toMatchObject({ isAlive: expect.any(Function) })
    expect(shell.rawWrites).toEqual([
      "options set --show-prompt=no --output-format=json\n",
      "common connect-ib\n",
    ])
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
    expect(error).toMatchObject({
      code: "platform_command_failed",
      commandOutcome: "rejected",
    })
    expect(String(error)).not.toContain("secret")
  })

  it("treats command usage logs followed by an error as a confirmed rejection", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"log","message":"Использование:"},{"type":"error","message":"Неверный формат команды"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({ shell, timeoutMs: 100 })

    await expect(session.run("bad command")).rejects.toMatchObject({
      code: "platform_command_failed",
      message: "Неверный формат команды",
      commandOutcome: "rejected",
    })
  })

  it("writes the structured platform error to the operation log without secrets", async () => {
    const operationMessages: string[] = []
    const operationLog = recordingOperationLog(operationMessages)
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"error","body":{"message":"Некорректный Form.xml","details":"secret"}}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      password: "secret",
      timeoutMs: 100,
    })

    await expect(session.run("config load-files", { operationLog }))
      .rejects.toMatchObject({ code: "platform_command_failed" })
    expect(operationMessages).toContain(
      'command-error {"type":"error","body":{"message":"Некорректный Form.xml","details":"***"}}'
    )
  })

  it.each([
    ["progress", '{"type":"progress","message":"","body":{"message":"Подготовка","percent":33}}'],
    ["database structure", '{"type":"dbstru","body":{"info":"change","message":"Новый объект"}}'],
    ["generation identifier", '{"type":"generation-id","body":"bbb2f569dfa9f5459ea86a0ee852479500000000"}'],
  ])("accepts a %s message before command completion", async (_case, intermediate) => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      `[${intermediate}]`,
      '[{"type":"success","message":"Done"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({ shell, timeoutMs: 100 })

    const pending = session.run("config load-files")
    await Promise.resolve()
    shell.emitNext()
    await expect(pending).resolves.toEqual({})
  })

  it("returns extension properties nested in the success body in platform order", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"success","message":"Done","body":[{"type":"extension-properties","body":{"name":"First"}},{"type":"extension-properties","body":{"name":"Second"}}]}]\ndesigner> ',
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

  it("rejects nested extension properties without a body", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"success","message":"Done","body":[{"type":"extension-properties"}]}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
    })

    await expect(
      session.run("config extensions properties get --all-extensions")
    ).rejects.toMatchObject({ code: "platform_command_failed" })
  })

  it("rejects an unexpected complete response split from the prompt", async () => {
    const clock = controlledClock()
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"unexpected"}]',
      "designer> ",
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
      clock,
    })

    const pending = session.run("bad command", { timeoutMs: 100 })
    await Promise.resolve()
    shell.emitNext()
    clock.expire()

    await expect(pending).rejects.toMatchObject({
      code: "platform_command_failed",
      commandOutcome: "unknown",
    })
  })

  it("marks a shell close after command dispatch as an unknown outcome", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({ shell, timeoutMs: 100 })

    const pending = session.run("config load-config-from-files")
    shell.emitClose()

    await expect(pending).rejects.toMatchObject({
      code: "platform_command_failed",
      commandOutcome: "unknown",
    })
  })

  it("does not send a command when its signal is already aborted", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
    })
    const controller = new AbortController()
    controller.abort()

    const error = await session.run("must-not-run", { signal: controller.signal })
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: "operation_cancelled" })
    expect((error as { commandOutcome?: unknown }).commandOutcome).toBeUndefined()
    expect(shell.rawWrites).not.toContain("must-not-run\n")
  })

  it("does not expose extension records for an invalid success body", async () => {
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
      '[{"type":"success","message":"Connected"}]\ndesigner> ',
      '[{"type":"success","message":"Done"}]\ndesigner> ',
    ])
    const session = await openPlatformCommandSession({
      shell,
      timeoutMs: 100,
    })

    await expect(
      session.run("config extensions properties get --all-extensions")
    ).resolves.toEqual({})
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
    const stages: Array<[string, string]> = []
    const pending = openPlatformCommandSession({
      shell: scriptedShell([]),
      timeoutMs: 100,
      clock,
      onStage: async (stage: "protocol-handshake" | "authentication", status: "start" | "ready") => {
        stages.push([stage, status])
      },
    })

    await Promise.resolve()
    clock.expire()

    await expect(pending).rejects.toMatchObject({ code: "session_timeout" })
    expect(stages).toEqual([["protocol-handshake", "start"]])
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

    await expect(pending).rejects.toMatchObject({
      code: "operation_cancelled",
      commandOutcome: "unknown",
    })
  })

  it("marks a command timeout after dispatch as an unknown outcome", async () => {
    const clock = controlledClock()
    const session = await openPlatformCommandSession({
      shell: scriptedShell([
        "designer> ",
        '[{"type":"success","message":"JSON mode"}]\ndesigner> ',
        '[{"type":"success","message":"Connected"}]\ndesigner> ',
      ]),
      timeoutMs: 100,
      clock,
    })
    clock.resetCounters()

    const pending = session.run("config load-config-from-files", { timeoutMs: 100 })
    clock.expire()

    await expect(pending).rejects.toMatchObject({
      code: "session_timeout",
      commandOutcome: "unknown",
    })
  })

  it("records safe diagnostics when infobase connection times out without a response", async () => {
    const clock = controlledClock()
    const messages: string[] = []
    const shell = scriptedShell([
      "designer> ",
      '[{"type":"success","message":"JSON mode"}]',
    ])
    const operationLog = recordingOperationLog(messages)
    const pending = openPlatformCommandSession({
      shell,
      timeoutMs: 100,
      clock,
      operationLog,
    })
    for (let index = 0; index < 32 && shell.rawWrites.length < 2; index += 1) {
      await Promise.resolve()
    }

    expect(shell.rawWrites).toEqual([
      "options set --show-prompt=no --output-format=json\n",
      "common connect-ib\n",
    ])
    clock.expire()

    await expect(pending).rejects.toMatchObject({ code: "session_timeout" })
    expect(messages).toContain(
      "command-timeout command=common connect-ib timeoutMs=100 receivedBytes=0 shellOpen=true successSeen=false"
    )
  })
})

type ScriptedShell = SshShell & {
  rawWrites: string[]
  emitNext(): void
  emitClose(): void
}

function scriptedShell(chunks: string[], initiallyOpen = true): ScriptedShell {
  let open = initiallyOpen
  let listener: ((chunk: string) => void) | undefined
  let closeListener: (() => void) | undefined
  const remaining = [...chunks]
  const emitNext = () => {
    const chunk = remaining.shift()
    if (chunk !== undefined) queueMicrotask(() => listener?.(chunk))
  }
  return {
    rawWrites: [],
    emitNext,
    emitClose() {
      open = false
      closeListener?.()
    },
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
    onClose(nextListener) {
      closeListener = nextListener
      return () => {
        closeListener = undefined
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

function recordingOperationLog(messages: string[]): PlatformOperationLog {
  return {
    path: "/project/platform.log",
    available: true,
    async append(message) {
      messages.push(message)
      return true
    },
    async process() {
      return true
    },
    sanitize(value) {
      return value
    },
  }
}
