import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "./errors"
import { redactPlatformText, type PlatformOperationLog } from "./operationLog"
import { extensionPropertyRecord } from "../testing/extensionFixture"
import { recordedArgument, recordedPath } from "../testing/recordedPath"
import { simulatePlatformConnectionStages } from "../testing/platformConnectionStages"
import type { CreatePlatformSessionParams } from "./types"
import {
  createStandaloneServerSession,
  type StandaloneServerDependencies,
} from "./standaloneServer"

describe("standalone server session", () => {
  it("prepares configuration, exports, and closes a local server", async () => {
    const fixture = createFixture()
    const controller = new AbortController()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)
    await session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "omit",
      controller.signal
    )
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })

    expect(fixture.calls.filter((call) => call.startsWith("spawn ibsrv"))).toHaveLength(1)
    expect(fixture.calls.filter((call) => call.startsWith("ssh.connect"))).toHaveLength(1)
    expect(fixture.calls).toContainEqual(
      expect.stringContaining(
        "shell.run config dump-config-to-files --dir=\".nkdk-export/"
      )
    )
    expect(fixture.calls).toContain("shell.run common shutdown")
    expect(fixture.operationLogText).not.toContain("secret")
  })

  it("rejects a missing ibcmd", async () => {
    const fixture = createFixture()
    await expect(
      createStandaloneServerSession(
        createParams({
          installation: {
            version: "8.3.27.2214",
            directory: "/opt/1cv8",
          },
        }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "platform_component_missing", message: expect.stringContaining("ibcmd") })
    expect(fixture.calls).toEqual([])
  })

  it("exports only the selected extension", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "include",
      undefined,
      "Расширение_All"
    )

    expect(fixture.calls).toContainEqual(
      expect.stringMatching(
        /^shell\.run config dump-config-to-files .*--extension="Расширение_All"$/u
      )
    )
  })

  it("lists and normalizes extensions with one interactive command", async () => {
    const fixture = createFixture({
      extensionInfo: [extensionPropertyRecord("First"), extensionPropertyRecord("Second")],
    })
    const controller = new AbortController()
    const session = await createStandaloneServerSession(
      createParams(),
      fixture.dependencies
    )

    await expect(
      session.listExtensions(controller.signal)
    ).resolves.toEqual([
      extensionInfo("First"),
      extensionInfo("Second"),
    ])
    expect(fixture.calls).toContain(
      "shell.run config extensions properties get --all-extensions"
    )
  })

  it("loads selected metadata through the standalone server SSH gateway", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    )

    await expect(session.loadPartialConfiguration?.(
      "/project/package.zip",
      ["Catalogs/Справочник/Ext/ObjectModule.bsl"],
      fixture.operationLog
    )).resolves.toEqual({ warnings: [], loadMode: "partial" })

    expect(fixture.calls).toContain("spawn ibsrv --data /project/.nkdk/platform-sessions/standalone/server-data --session-data /project/.nkdk/platform-sessions/standalone/session-data --config /project/.nkdk/platform-sessions/standalone/config.yaml cwd=/project/.nkdk/platform-sessions/standalone")
    expect(fixture.calls).toContain("process.waitForOutput Stand-alone Server ready. timeout=60000")
    expect(fixture.calls).toContain("ssh.connect 127.0.0.1:8429 fingerprint")
    const loadCall = fixture.calls.find((call) => call.startsWith("shell.run config load-files"))
    expect(loadCall).toContain('--list-file=".nkdk-load/')
    expect(loadCall).toContain('/load.lst"')
    expect(fixture.calls.some((call) => call.includes("--update-config-dump-info"))).toBe(false)
    expect(loadCall).toContain("--partial")
    expect(fixture.calls).toContain('shell.run config update-db-cfg --session-terminate="prompt"')
    expect(fixture.operationLogText).toContain("stage=protocol-handshake status=start")
    expect(fixture.operationLogText).toContain("stage=protocol-handshake status=ready")
    expect(fixture.operationLogText).toContain("stage=authentication status=start")
    expect(fixture.operationLogText).toContain("stage=authentication status=ready")
  })

  it("reuses one autonomous process for consecutive partial loads", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await session.loadPartialConfiguration?.(
      "/project/first.zip",
      ["Catalogs/First/Ext/ObjectModule.bsl"],
      fixture.operationLog,
    )
    await session.loadPartialConfiguration?.(
      "/project/second.zip",
      ["Catalogs/Second.xml"],
      fixture.operationLog,
    )

    expect(fixture.calls.filter((call) => call.startsWith("spawn ibsrv"))).toHaveLength(1)
    expect(fixture.calls.filter((call) => call.startsWith("ssh.connect"))).toHaveLength(1)
    expect(
      fixture.calls.filter((call) => call.startsWith("shell.run config load-files"))
    ).toHaveLength(2)
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })
    expect(fixture.calls).toContain("shell.run common shutdown")
  })

  it("exports and lists extensions through the resident autonomous command session", async () => {
    const fixture = createFixture({
      extensionInfo: [extensionPropertyRecord("First")],
    })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await session.loadPartialConfiguration?.(
      "/project/package.zip",
      ["Catalogs/Test.xml"],
      fixture.operationLog,
    )
    await session.exportConfiguration(
      "/project/.nkdk/tmp/export",
      fixture.operationLog,
      "omit",
    )
    await expect(session.listExtensions()).resolves.toEqual([extensionInfo("First")])

    expect(fixture.calls.filter((call) => call.startsWith("spawn ibsrv"))).toHaveLength(1)
    expect(fixture.calls).toContainEqual(
      expect.stringMatching(/^shell\.run config dump-config-to-files /u)
    )
    expect(fixture.calls).toContain(
      "shell.run config extensions properties get --all-extensions"
    )
  })

  it("omits --partial for a selected structural load", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await expect(session.loadPartialConfiguration?.(
      "/project/package.zip",
      ["Catalogs/Справочник.xml"],
      fixture.operationLog,
    )).resolves.toEqual({ warnings: [], loadMode: "selected" })

    const loadCall = fixture.calls.find((call) => call.startsWith("shell.run config load-files"))
    expect(loadCall).not.toContain("--partial")
    expect(fixture.calls).toContain('shell.run config update-db-cfg --session-terminate="prompt"')
  })

  it.each([
    [
      "initial prompt timeout",
      "protocol-handshake",
      new PlatformSessionError("session_timeout", "Prompt timeout secret"),
      "session_timeout",
    ],
    [
      "rejected login",
      "authentication",
      new PlatformSessionError("authentication_failed", "Access denied secret"),
      "authentication_failed",
    ],
  ] as const)("classifies %s at the exact connection stage", async (
    _case,
    openCommandErrorStage,
    openCommandError,
    code,
  ) => {
    const fixture = createFixture({
      openCommandError,
      openCommandErrorStage,
    })
    const error = await createStandaloneServerSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    ).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      code,
      details: {
        stage: openCommandErrorStage,
        mode: "standalone-server",
        logPath: fixture.operationLog.path,
      },
    })
    expect(String(error)).not.toContain("secret")
  })

  it("keeps a load command failure at the configuration load stage", async () => {
    const fixture = createFixture({
      loadCommandError: new PlatformSessionError("platform_command_failed", "Load failed secret"),
    })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    const error = await session.loadPartialConfiguration?.(
      "/project/package.zip",
      ["Catalogs/Справочник.xml"],
      fixture.operationLog,
    ).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      code: "platform_command_failed",
      details: { stage: "configuration-load" },
    })
    expect(session.isAlive()).toBe(true)
  })

  it.each(["session_timeout", "operation_cancelled"] as const)(
    "stops the resident process after %s cancellation",
    async (code) => {
      const fixture = createFixture({
        loadCommandError: new PlatformSessionError(code, "stopped"),
      })
      const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

      await expect(session.loadPartialConfiguration?.(
        "/project/package.zip",
        ["Catalogs/Справочник.xml"],
        fixture.operationLog,
      )).rejects.toMatchObject({ code })
      await expect(session.cancel()).resolves.toEqual({ stoppedOwnedProcess: true })

      expect(session.isAlive()).toBe(false)
      expect(fixture.calls).toContain("shell.run common shutdown")
    }
  )

  it("reports a dead autonomous process as a dead session", async () => {
    const fixture = createFixture({ processDiesAfterStart: true })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    expect(session.isAlive()).toBe(false)
  })

  it("removes the private config when the autonomous process cannot start", async () => {
    const fixture = createFixture({ spawnError: new Error("spawn failed") })

    await expect(
      createStandaloneServerSession(createParams(), fixture.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(fixture.calls.filter((call) =>
      call === "rm /project/.nkdk/platform-sessions/standalone/config.yaml"
    )).toHaveLength(2)
  })

  it.each([
    ["timeout", { listCommandError: new PlatformSessionError("session_timeout", "secret") }, "session_timeout"],
    ["cancellation", { listCommandError: new PlatformSessionError("operation_cancelled", "secret") }, "operation_cancelled"],
    ["failure", { listCommandError: new PlatformSessionError("platform_command_failed", "secret") }, "platform_command_failed"],
    ["malformed output", { extensionInfo: [{ malformed: "secret" }] }, "platform_command_failed"],
  ] as const)("maps extension list %s", async (_case, options, code) => {
    const fixture = createFixture(options)
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)
    const error = await session.listExtensions().catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code })
    expect(String(error)).not.toContain("secret")
  })

  it("rejects a client-server connection before touching runtime boundaries", async () => {
    const fixture = createFixture()

    const error = await createStandaloneServerSession(
      createParams({
        settings: {
          connectionString: 'Srvr="server";Ref="base";',
          database: {
            dbms: "PostgreSQL",
            server: "database-server",
            name: "base",
          },
        },
      }),
      fixture.dependencies,
    ).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      code: "unsupported_connection",
      message: expect.stringContaining("клиент-сервер"),
    })
    expect(fixture.calls).toEqual([])
  })

  it("rejects an unsupported connection before touching runtime boundaries", async () => {
    const fixture = createFixture()

    await expect(
      createStandaloneServerSession(
        createParams({ settings: { connectionString: 'ws="https://example.test";' } }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "unsupported_connection" })
    expect(fixture.calls).toEqual([])
  })

  it("maps ibcmd initialization and interactive export failures", async () => {
    const initFailure = createFixture({ initExitCode: 1 })
    await expect(
      createStandaloneServerSession(createParams(), initFailure.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(initFailure.calls).toContain(
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml"
    )
    const exportFailure = createFixture({
      exportCommandError: new PlatformSessionError(
        "platform_command_failed",
        "Export failed"
      ),
    })
    const session = await createStandaloneServerSession(createParams(), exportFailure.dependencies)
    await expect(session.exportConfiguration("/project/.nkdk/tmp/op/xml", exportFailure.operationLog, "include")).rejects.toMatchObject({
      code: "platform_command_failed",
    })
  })

  it("returns a concise export error and writes safe details", async () => {
    const fixture = createFixture({
      exportCommandError: new PlatformSessionError(
        "platform_command_failed",
        "Access denied secret\nmore details"
      ),
    })
    const session = await createStandaloneServerSession(
      createParams({ settings: { database: undefined } }),
      fixture.dependencies
    )

    const error = await exportError(session, fixture.operationLog)

    expectSafeProcessFailure(error, fixture.operationLogText, {
      code: "platform_command_failed",
      message: "Access denied ***",
      stage: "configuration-export",
    })
  })

  it("returns a concise initialization error and logs it without credentials", async () => {
    const fixture = createFixture({
      initExitCode: 1,
      initStdout: "secondary database-secret",
      initStderr: "Database access denied secret\nmore details",
    })

    const error = await createStandaloneServerSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    ).catch((caught: unknown) => caught)

    expectSafeProcessFailure(error, fixture.operationLogText, {
      code: "session_start_failed",
      message: "Database access denied ***",
      stage: "session-start",
    })
  })

  it.each([
    ["cancellation", { exportCommandError: new PlatformSessionError("operation_cancelled", "cancelled") }, "operation_cancelled"],
    ["timeout", { exportCommandError: new PlatformSessionError("session_timeout", "timeout") }, "session_timeout"],
    ["thrown command error", { exportCommandError: new Error("failed") }, "platform_command_failed"],
  ] as const)("preserves %s diagnostics", async (_name, options, code) => {
    const fixture = createFixture(options)
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    const error = await exportError(session, fixture.operationLog)

    expect(error).toMatchObject({
      code,
      details: {
        stage: "configuration-export",
        mode: "standalone-server",
      },
    })
  })

  it("reports when an export failure cannot be appended to the log", async () => {
    const fixture = createFixture({
      logAppendFails: true,
      exportCommandError: new Error("failed"),
    })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    const error = await exportError(session, fixture.operationLog)

    expect(error).toMatchObject({
      code: "platform_command_failed",
      details: { stage: "configuration-export", mode: "standalone-server" },
    })
    expect(error).toMatchObject({ details: expect.not.objectContaining({ logPath: expect.anything() }) })
  })

  it("maps an ibcmd initialization timeout", async () => {
    const initTimeout = createFixture({ initTimedOut: true })
    await expect(
      createStandaloneServerSession(createParams(), initTimeout.dependencies)
    ).rejects.toMatchObject({ code: "session_timeout" })
  })

  it("maps an aborted interactive export to operation_cancelled", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)
    const controller = new AbortController()
    controller.abort()

    await expect(session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "include",
      controller.signal
    )).rejects.toMatchObject({
      code: "operation_cancelled",
    })
  })

  it("rejects an invalid configuration returned by ibcmd", async () => {
    const fixture = createFixture({ initStdout: "not: [valid" })

    await expect(
      createStandaloneServerSession(createParams(), fixture.dependencies)
    ).rejects.toMatchObject({
      code: "session_start_failed",
      message: expect.stringContaining("некорректную конфигурацию"),
    })
    expect(
      fixture.writes.has("/project/.nkdk/platform-sessions/standalone/config.yaml")
    ).toBe(false)
  })

  it("closes the resident autonomous process", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    expect(session.isAlive()).toBe(true)
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })
    expect(session.isAlive()).toBe(false)
    expect(fixture.calls).toContain(
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml"
    )
  })

  it("can retry closing when removing the private config fails", async () => {
    const fixture = createFixture({ rmFailureCall: 2 })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await expect(session.close()).rejects.toThrow("rm failed")
    expect(session.isAlive()).toBe(false)
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: false })
    expect(fixture.calls.filter((call) => call.startsWith("rm "))).toHaveLength(3)
  })
})

async function exportError(
  session: Awaited<ReturnType<typeof createStandaloneServerSession>>,
  operationLog: PlatformOperationLog
): Promise<unknown> {
  return session.exportConfiguration(
    "/project/.nkdk/tmp/op/xml",
    operationLog,
    "include"
  )
    .catch((caught: unknown) => caught)
}

function expectSafeProcessFailure(
  error: unknown,
  operationLogText: string,
  expected: { code: string; message: string; stage: string }
): void {
  expect(error).toMatchObject({
    code: expected.code,
    message: expected.message,
    details: {
      stage: expected.stage,
      mode: "standalone-server",
      logPath: "/project/.nkdk/tmp/op/platform.log",
    },
  })
  if (expected.stage === "session-start") {
    expect(operationLogText).toContain("exitCode=1")
  }
  expect(operationLogText).not.toContain("secret")
  expect(operationLogText).not.toContain("database-secret")
}

function createParams(
  overrides: Partial<Omit<CreatePlatformSessionParams, "settings">> & {
    settings?: Partial<CreatePlatformSessionParams["settings"]>
  } = {}
): CreatePlatformSessionParams {
  const { settings, ...rest } = overrides
  return {
    projectDir: "/project",
    sessionDir: "/project/.nkdk/platform-sessions/standalone",
    installation: {
      version: "8.3.27.2214",
      directory: "/opt/1cv8/8.3.27.2214",
      ibcmdPath: "ibcmd",
      ibsrvPath: "ibsrv",
    },
    settings: {
      connectionString: 'File="/bases/demo";',
      password: "secret",
      sessionIdleTimeout: 900,
      ...settings,
    },
    ...rest,
  }
}

function createFixture(
  options: {
    initExitCode?: number
    initStdout?: string
    initStderr?: string
    initTimedOut?: boolean
    rmFailureCall?: number
    logAppendFails?: boolean
    openCommandError?: PlatformSessionError
    openCommandErrorStage?: "protocol-handshake" | "authentication"
    loadCommandError?: PlatformSessionError
    exportCommandError?: unknown
    listCommandError?: unknown
    extensionInfo?: readonly unknown[]
    processDiesAfterStart?: boolean
    spawnError?: Error
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  dependencies: StandaloneServerDependencies
  operationLog: PlatformOperationLog
  readonly operationLogText: string
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  let rmCalls = 0
  let nextPort = 8427
  let operationLogText = ""
  let logAvailable = true
  const operationLog: PlatformOperationLog = {
    path: "/project/.nkdk/tmp/op/platform.log",
    get available() {
      return logAvailable
    },
    async append(message) {
      if (!logAvailable) return false
      if (options.logAppendFails === true) {
        logAvailable = false
        return false
      }
      operationLogText += `${redactPlatformText(message, ["secret", "database-secret"])}\n`
      return true
    },
    async process(stage, launch, result) {
      return this.append([
        `stage=${stage}`,
        `command=${launch.command} ${launch.args.join(" ")}`,
        `exitCode=${result.exitCode}`,
        `stdout=${result.stdout}`,
        `stderr=${result.stderr}`,
      ].join("\n"))
    },
    sanitize(value) {
      return redactPlatformText(value, ["secret", "database-secret"])
    },
  }
  return {
    calls,
    writes,
    operationLog,
    get operationLogText() {
      return operationLogText
    },
    dependencies: {
      fileSystem: {
        async mkdir(path) {
          calls.push(`mkdir ${recordedPath(path)}`)
        },
        async copyFile(from, to) {
          calls.push(`copy ${recordedPath(from)} ${recordedPath(to)}`)
        },
        async writeFile(path, content, writeOptions) {
          const recorded = recordedPath(path)
          calls.push(
            `write ${recorded}${writeOptions?.mode === undefined ? "" : ` mode=${writeOptions.mode}`}`
          )
          writes.set(recorded, content)
        },
        async chmod(path, mode) {
          calls.push(`chmod ${recordedPath(path)} mode=${mode}`)
        },
        async realpath(path) {
          calls.push(`realpath ${recordedPath(path)}`)
          return path
        },
        async rename(from, to) {
          calls.push(`rename ${recordedPath(from)} ${recordedPath(to)}`)
        },
        async rm(path) {
          calls.push(`rm ${recordedPath(path)}`)
          rmCalls += 1
          if (rmCalls === options.rmFailureCall) {
            throw new Error("rm failed")
          }
        },
      },
      processRuntime: {
        spawn(command, args, spawnOptions) {
          calls.push(`spawn ${recordedPath(command)} ${args.map(recordedArgument).join(" ")} cwd=${recordedPath(spawnOptions?.cwd ?? "")}`)
          if (options.spawnError !== undefined) throw options.spawnError
          return {
            owned: true,
            isAlive: () => options.processDiesAfterStart !== true,
            async wait() {
              calls.push("process.wait")
              return true
            },
            async waitForOutput(value, timeoutMs) {
              calls.push(`process.waitForOutput ${value} timeout=${timeoutMs}`)
            },
            async kill() {
              calls.push("process.kill")
            },
          }
        },
        async run(command, args, runOptions) {
          calls.push(
            [
              `run ${recordedPath(command)} ${args.map(recordedArgument).join(" ")}`,
              `timeout=${runOptions?.timeoutMs}`,
            ].join(" ")
          )
          return {
            stdout: options.initStdout ?? "database:\n  path: /bases/demo\n",
            stderr: options.initStderr ?? "",
            exitCode: options.initExitCode ?? 0,
            timedOut: options.initTimedOut ?? false,
            cancelled: false,
            terminationFailed: false,
          }
        },
      },
      portRuntime: {
        async reservePort() {
          nextPort += 1
          return nextPort
        },
      },
      async generateHostKey(path) {
        calls.push(`host-key ${recordedPath(path)}`)
        return "fingerprint"
      },
      sshTransport: {
        async connect(params) {
          calls.push(`ssh.connect ${params.host}:${params.port} ${params.expectedHostKeyHash}`)
          const noop = () => undefined
          return {
            write: noop,
            onData: () => noop,
            onClose: () => noop,
            isOpen: () => true,
            close: async () => undefined,
          }
        },
      },
      async openCommandSession(params) {
        await simulatePlatformConnectionStages(
          params.onStage,
          options.openCommandError === undefined
            ? undefined
            : {
                stage: options.openCommandErrorStage ?? "authentication",
                error: options.openCommandError,
              }
        )
        return {
          async run(command, commandOptions) {
            calls.push(`shell.run ${command}`)
            if (commandOptions?.signal?.aborted === true) {
              throw new PlatformSessionError(
                "operation_cancelled",
                "Операция платформы отменена"
              )
            }
            if (command.startsWith("config load-files")
              && options.loadCommandError !== undefined) {
              throw options.loadCommandError
            }
            if (command.startsWith("config dump-config-to-files")
              && options.exportCommandError !== undefined) {
              throw options.exportCommandError
            }
            if (command === "config extensions properties get --all-extensions"
              && options.listCommandError !== undefined) {
              throw options.listCommandError
            }
            return command === "config extensions properties get --all-extensions"
              ? { extensionInfo: [...(options.extensionInfo ?? [])] }
              : {}
          },
          isAlive: () => true,
          async close() {
            calls.push("shell.close")
          },
        }
      },
      startupTimeoutMs: 60_000,
      commandTimeoutMs: 1_800_000,
      closeTimeoutMs: 5_000,
      platform: "darwin",
    },
  }
}

function extensionInfo(name: string) {
  return {
    name,
    version: "",
    active: true,
    purpose: "customization",
    safeMode: true,
    securityProfileName: "",
    unsafeActionProtection: true,
    usedInDistributedInfobase: false,
    scope: "infobase",
    hashSum: `${name}-hash`,
  }
}
