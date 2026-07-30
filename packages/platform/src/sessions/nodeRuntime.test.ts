import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import { beforeAll, describe, expect, it, vi } from "vitest"
import type { ProcessRunOptions, ProcessRunResult } from "./runtime"

type TestChildProcess = EventEmitter & {
  stdout: PassThrough
  stderr: PassThrough
  exitCode: number | null
  kill(signal?: NodeJS.Signals): boolean
}

type RunNodeProcess = (
  command: string,
  args: readonly string[],
  options: ProcessRunOptions,
  spawn: () => TestChildProcess
) => Promise<ProcessRunResult>

describe("node process runtime", () => {
  let runtimeModule: Record<string, unknown>

  beforeAll(async () => {
    runtimeModule = await import("./nodeRuntime") as Record<string, unknown>
  })

  it("terminates an aborted child after the grace period", async () => {
    vi.useFakeTimers()
    try {
      const runNodeProcess = runtimeModule["runNodeProcess"]
      expect(runNodeProcess).toBeTypeOf("function")

      const controller = new AbortController()
      const child = controlledChildProcess()
      const pending = (runNodeProcess as RunNodeProcess)(
        "ibcmd",
        ["infobase", "config", "export"],
        { signal: controller.signal, terminationGraceMs: 5_000 },
        () => child.process
      )

      controller.abort()
      expect(child.signals).toEqual(["SIGTERM"])

      await vi.advanceTimersByTimeAsync(5_000)
      expect(child.signals).toEqual(["SIGTERM", "SIGKILL"])

      await expect(pending).resolves.toMatchObject({ cancelled: true })
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps control until exit when SIGKILL cannot be sent", async () => {
    vi.useFakeTimers()
    try {
      const runNodeProcess = runtimeModule["runNodeProcess"] as RunNodeProcess
      const controller = new AbortController()
      const child = controlledChildProcess({ forceKillSucceeds: false })
      const pending = runNodeProcess(
        "ibcmd",
        ["infobase", "config", "export"],
        { signal: controller.signal, terminationGraceMs: 5_000 },
        () => child.process
      )
      const resolved = vi.fn()
      void pending.then(resolved)

      controller.abort()
      await vi.advanceTimersByTimeAsync(5_000)

      expect(resolved).not.toHaveBeenCalled()

      child.exit(1)
      await expect(pending).resolves.toMatchObject({
        cancelled: true,
        terminationFailed: true,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it("tries SIGKILL when SIGTERM throws", async () => {
    vi.useFakeTimers()
    try {
      const runNodeProcess = runtimeModule["runNodeProcess"] as RunNodeProcess
      const controller = new AbortController()
      const child = controlledChildProcess({ termKillThrows: true })
      const pending = runNodeProcess(
        "ibcmd",
        ["infobase", "config", "export"],
        { signal: controller.signal, terminationGraceMs: 5_000 },
        () => child.process
      )

      controller.abort()
      await vi.advanceTimersByTimeAsync(5_000)

      expect(child.signals).toEqual(["SIGTERM", "SIGKILL"])
      await expect(pending).resolves.toMatchObject({ cancelled: true })
    } finally {
      vi.useRealTimers()
    }
  })

  it("reports a failed signal for a still running owned process", async () => {
    const wrapOwnedProcess = runtimeModule["wrapOwnedProcess"]
    expect(wrapOwnedProcess).toBeTypeOf("function")
    const child = controlledChildProcess({ forceKillSucceeds: false })
    const owned = (wrapOwnedProcess as (child: unknown) => {
      kill(signal?: NodeJS.Signals): Promise<void>
    })(child.process)

    await expect(owned.kill("SIGKILL")).rejects.toThrow(
      "Не удалось отправить SIGKILL"
    )
  })
})

function controlledChildProcess(
  options: {
    forceKillSucceeds?: boolean
    termKillThrows?: boolean
  } = {}
): {
  process: TestChildProcess
  signals: NodeJS.Signals[]
  exit(code: number): void
} {
  const signals: NodeJS.Signals[] = []
  const events = new EventEmitter()
  const process: TestChildProcess = Object.assign(events, {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    exitCode: null as number | null,
    kill(signal: NodeJS.Signals = "SIGTERM") {
      signals.push(signal)
      if (signal === "SIGTERM" && options.termKillThrows === true) {
        throw new Error("term failed")
      }
      if (signal === "SIGKILL") {
        if (options.forceKillSucceeds === false) return false
        process.exitCode = 1
        events.emit("exit", null)
      }
      return true
    },
  })
  return {
    process,
    signals,
    exit(code) {
      process.exitCode = code
      events.emit("exit", code)
    },
  }
}
