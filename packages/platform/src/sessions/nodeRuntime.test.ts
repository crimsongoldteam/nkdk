import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import { describe, expect, it, vi } from "vitest"
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
  it("terminates an aborted child after the grace period", async () => {
    vi.useFakeTimers()
    try {
      const runtimeModule = await import("./nodeRuntime") as Record<string, unknown>
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

  it("rejects cancellation when SIGKILL cannot be sent", async () => {
    vi.useFakeTimers()
    try {
      const runtimeModule = await import("./nodeRuntime") as Record<string, unknown>
      const runNodeProcess = runtimeModule["runNodeProcess"] as RunNodeProcess
      const controller = new AbortController()
      const child = controlledChildProcess({ forceKillSucceeds: false })
      let rejection: unknown
      const pending = runNodeProcess(
        "ibcmd",
        ["infobase", "config", "export"],
        { signal: controller.signal, terminationGraceMs: 5_000 },
        () => child.process
      ).catch((caught: unknown) => {
        rejection = caught
      })

      controller.abort()
      await vi.advanceTimersByTimeAsync(5_000)

      expect(rejection).toMatchObject({
        message: "Не удалось принудительно остановить дочерний процесс",
      })
      await pending
    } finally {
      vi.useRealTimers()
    }
  })
})

function controlledChildProcess(
  options: { forceKillSucceeds?: boolean } = {}
): {
  process: TestChildProcess
  signals: NodeJS.Signals[]
} {
  const signals: NodeJS.Signals[] = []
  const events = new EventEmitter()
  const process: TestChildProcess = Object.assign(events, {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    exitCode: null as number | null,
    kill(signal: NodeJS.Signals = "SIGTERM") {
      signals.push(signal)
      if (signal === "SIGKILL") {
        if (options.forceKillSucceeds === false) return false
        process.exitCode = 1
        events.emit("exit", null)
      }
      return true
    },
  })
  return { process, signals }
}
