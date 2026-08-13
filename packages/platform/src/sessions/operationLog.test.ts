import { describe, expect, it } from "vitest"
import {
  recordPartialSyncDeliveryPhase,
  concisePlatformMessage,
  createPlatformOperationLog,
  platformFailure,
  redactPlatformText,
  type PlatformOperationLogFileSystem,
} from "./operationLog"
import { PlatformSessionError } from "./errors"

describe("platform operation log", () => {
  it("дописывает фазу доставки в существующий журнал", async () => {
    const fixture = createFixture()

    await recordPartialSyncDeliveryPhase(
      { path: "/operation/platform.log", phase: "applied" },
      fixture.dependencies,
    )

    expect(fixture.calls).toContain("append /operation/platform.log")
  })
  it("redacts explicit secrets and common password arguments", () => {
    expect(redactPlatformText(
      "ibcmd --password secret --database-password=db-secret /P pwd",
      ["secret", "db-secret", "pwd"]
    )).toBe("ibcmd --password *** --database-password=*** /P ***")
    expect(redactPlatformText("--password hidden --database-password=hidden-db /P hidden-pwd", []))
      .toBe("--password *** --database-password=*** /P ***")
    expect(redactPlatformText("1cv8 /Pjoined-password", []))
      .toBe("1cv8 /P***")
    expect(redactPlatformText("1cv8 /Out /private/tmp/platform.log", []))
      .toBe("1cv8 /Out /private/tmp/platform.log")
  })

  it("selects one bounded non-empty platform message", () => {
    expect(concisePlatformMessage("\n first failure \nsecond", "fallback"))
      .toBe("first failure")
    expect(concisePlatformMessage("x".repeat(600), "fallback")).toHaveLength(500)
    expect(concisePlatformMessage("", "fallback")).toBe("fallback")
  })

  it("creates a private append-only chronological log with safe process details", async () => {
    const fixture = createFixture()
    const log = await createPlatformOperationLog(
      { path: "/operation/platform.log", secrets: ["secret", "db-secret"] },
      fixture.dependencies
    )
    await log.append("selected mode=standalone-server")
    await log.process(
      "configuration-export",
      {
        command: "ibcmd",
        args: ["infobase", "config", "export", "--password=secret"],
      },
      {
        exitCode: 1,
        stdout: "stdout db-secret",
        stderr: "stderr secret",
        timedOut: true,
        cancelled: false,
        terminationFailed: true,
      }
    )

    expect(fixture.calls.slice(0, 2)).toEqual([
      "write /operation/platform.log mode=384",
      "chmod /operation/platform.log mode=384",
    ])
    expect(fixture.text).toContain("2026-08-06T10:00:00.000Z")
    expect(fixture.text.indexOf("selected mode")).toBeLessThan(fixture.text.indexOf("configuration-export"))
    expect(fixture.text).toContain("exitCode=1")
    expect(fixture.text).toContain("timedOut=true")
    expect(fixture.text).toContain("cancelled=false")
    expect(fixture.text).toContain("terminationFailed=true")
    expect(fixture.text).toContain("stdout ***")
    expect(fixture.text).toContain("stderr ***")
    expect(fixture.text).not.toContain("secret")
    expect(fixture.text).not.toContain("db-secret")
    expect(log.available).toBe(true)
  })

  it("does not chmod the log on Windows", async () => {
    const fixture = createFixture({ platform: "win32" })
    await createPlatformOperationLog({ path: "/operation/platform.log", secrets: [] }, fixture.dependencies)
    expect(fixture.calls).toEqual(["write /operation/platform.log mode=384"])
  })

  it("marks the log unavailable after an append failure", async () => {
    const fixture = createFixture({ appendFails: true })
    const log = await createPlatformOperationLog(
      { path: "/operation/platform.log", secrets: [] },
      fixture.dependencies
    )

    await expect(log.append("event")).resolves.toBe(false)
    await expect(log.append("ignored event")).resolves.toBe(false)
    expect(log.available).toBe(false)
    expect(fixture.calls.filter((call) => call.startsWith("append "))).toHaveLength(1)
  })

  it("returns a safe platform error with a log link while logging works", async () => {
    const fixture = createFixture()
    const log = await createPlatformOperationLog(
      { path: "/operation/platform.log", secrets: ["secret"] },
      fixture.dependencies
    )

    const error = await platformFailure({
      code: "authentication_failed",
      stage: "authentication",
      mode: "designer-agent",
      log,
      platformText: "\nAccess denied secret\nmore details",
      fallbackMessage: "Не удалось выполнить вход",
    })

    expect(error).toMatchObject({
      code: "authentication_failed",
      message: "Access denied ***",
      details: {
        stage: "authentication",
        mode: "designer-agent",
        logPath: "/operation/platform.log",
      },
    })
    expect(JSON.stringify(error.details)).not.toContain("secret")
  })

  it("preserves the source failure when the final log append fails", async () => {
    const fixture = createFixture({ appendFails: true })
    const log = await createPlatformOperationLog(
      { path: "/operation/platform.log", secrets: [] },
      fixture.dependencies
    )

    const error = await platformFailure({
      code: "session_timeout",
      stage: "configuration-export",
      mode: "standalone-server",
      log,
      platformText: "Timed out",
      fallbackMessage: "Истекло время выгрузки",
    })

    expect(error).toMatchObject({
      code: "session_timeout",
      message: "Timed out. Журнал операции записать не удалось",
      details: {
        stage: "configuration-export",
        mode: "standalone-server",
      },
    })
    expect(error.details).not.toHaveProperty("logPath")
  })

  it("preserves the structured command outcome while adding failure details", async () => {
    const fixture = createFixture()
    const log = await createPlatformOperationLog(
      { path: "/operation/platform.log", secrets: [] },
      fixture.dependencies
    )
    const cause = new PlatformSessionError(
      "session_timeout",
      "Timed out",
      { commandOutcome: "unknown" }
    )

    const error = await platformFailure({
      code: cause.code,
      stage: "configuration-export",
      mode: "designer-agent",
      log,
      platformText: cause.message,
      fallbackMessage: "Истекло время выгрузки",
      cause,
    })

    expect(error).toMatchObject({
      commandOutcome: "unknown",
      details: {
        stage: "configuration-export",
        mode: "designer-agent",
        logPath: "/operation/platform.log",
      },
    })
  })
})

function createFixture(options: { platform?: NodeJS.Platform; appendFails?: boolean } = {}) {
  const calls: string[] = []
  let text = ""
  const fileSystem: PlatformOperationLogFileSystem = {
    async writeFile(path, content, writeOptions) {
      calls.push(`write ${path} mode=${writeOptions?.mode}`)
      text = content
    },
    async chmod(path, mode) {
      calls.push(`chmod ${path} mode=${mode}`)
    },
    async appendFile(path, content) {
      calls.push(`append ${path}`)
      if (options.appendFails === true) throw new Error("append secret")
      text += content
    },
  }
  let second = 0
  return {
    calls,
    get text() {
      return text
    },
    dependencies: {
      fileSystem,
      platform: options.platform ?? "darwin",
      now: () => new Date(Date.UTC(2026, 7, 6, 10, 0, second++)),
    },
  }
}
