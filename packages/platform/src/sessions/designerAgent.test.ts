import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "./errors"
import type { PlatformOperationLog } from "./operationLog"
import type { CreatePlatformSessionParams } from "./types"
import {
  createDesignerAgentSession,
  type DesignerAgentDependencies,
} from "./designerAgent"

describe("Designer agent session", () => {
  it("starts once, exports through SSH, and closes gracefully", async () => {
    const fixture = createFixture()
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)
    await session.exportConfiguration("/project/.nkdk/tmp/op/xml", fixture.operationLog, "omit")
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })

    expect(fixture.calls).toEqual([
      "reservePort 127.0.0.1",
      "mkdir /project/.nkdk/platform-sessions/agent",
      "generateHostKey /project/.nkdk/platform-sessions/agent/host.key",
      "spawn /opt/1cv8/8.3.27.2214/1cv8 DESIGNER /Sserver\\reference /AgentMode /AgentSSHHostKey /project/.nkdk/platform-sessions/agent/host.key /AgentBaseDir /project/.nkdk /AppAutoCheckVersion- /AgentPort 58248 /Out /project/.nkdk/platform-sessions/agent/process.log -NoTruncate",
      "ssh.connect 127.0.0.1:58248 fingerprint",
      "shell.connect-ib",
      "read /project/.nkdk/agentbasedir.json",
      "write /project/.nkdk/tmp/op/platform.log",
      "rm /project/.nkdk/0/.nkdk-export",
      "mkdir /project/.nkdk/0/.nkdk-export",
      'shell.run config dump-config-to-files --dir=".nkdk-export" --format=hierarchical --ignore-unresolved-refs',
      "rm /project/.nkdk/tmp/op/xml",
      "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml",
      "write /project/.nkdk/tmp/op/platform.log",
      "shell.run common disconnect-ib",
      "sleep 5000",
      "shell.run common shutdown",
      "sleep 5000",
      "shell.close",
      "process.wait 5000",
    ])
    expect(fixture.writes.get("/project/.nkdk/tmp/op/platform.log")).not.toContain("secret")
  })

  it("builds a server connection argument without a shell", async () => {
    const fixture = createFixture()
    await createDesignerAgentSession(createParams(), fixture.dependencies)

    expect(fixture.calls.find((call) => call.startsWith("spawn "))).toContain(
      "/Sserver\\reference"
    )
  })

  it("logs the safe launch and authentication stages", async () => {
    const fixture = createFixture()

    await createDesignerAgentSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    )

    const text = fixture.writes.get(fixture.operationLog.path)
    expect(text).toContain("stage=session-start")
    expect(text).toContain("authentication=credentials")
    expect(text).toContain("stage=authentication")
    expect(text).toContain("1cv8 DESIGNER")
    expect(text).not.toContain("secret")
  })

  it("preserves an authentication failure and appends the safe process log", async () => {
    const fixture = createFixture({
      openCommandError: new PlatformSessionError("authentication_failed", "Access denied secret"),
      processLog: "authentication detail secret",
    })

    const error = await createDesignerAgentSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    ).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      code: "authentication_failed",
      message: "Access denied ***",
      details: {
        stage: "authentication",
        mode: "designer-agent",
        logPath: fixture.operationLog.path,
      },
    })
    expect(fixture.writes.get(fixture.operationLog.path)).toContain("authentication detail ***")
  })

  it("exports a file connection relative to AgentBaseDir without --server", async () => {
    const fixture = createFixture()

    const session = await createDesignerAgentSession(
      createParams({ settings: { connectionString: 'File="/bases/demo";' } }),
      fixture.dependencies
    )
    await session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "include"
    )

    expect(fixture.calls.find((call) => call.startsWith("spawn "))).toContain(
      "DESIGNER /F/bases/demo"
    )
    expect(fixture.calls).toContain(
      'shell.run config dump-config-to-files --dir=".nkdk-export" --format=hierarchical'
    )
    expect(fixture.calls.some((call) => call.includes("--server"))).toBe(false)
  })

  it("lists and normalizes extensions through one agent command", async () => {
    const fixture = createFixture({
      extensionInfo: [extensionRecord("First"), extensionRecord("Second")],
    })
    const session = await createDesignerAgentSession(
      createParams(),
      fixture.dependencies
    )

    await expect(session.listExtensions()).resolves.toEqual([
      extensionInfo("First"),
      extensionInfo("Second"),
    ])
    expect(fixture.calls).toContain(
      "shell.run config extensions properties get --all-extensions"
    )
    expect(fixture.calls).toContain("shell.run-options timeout=1800000")
  })

  it("rejects a success response without an extension-properties body", async () => {
    const fixture = createFixture({
      extensionResponseComplete: false,
    })
    const session = await createDesignerAgentSession(
      createParams(),
      fixture.dependencies
    )

    await expect(session.listExtensions()).rejects.toMatchObject({
      code: "platform_command_failed",
    })
  })

  it("returns an empty list and passes cancellation to the agent command", async () => {
    const fixture = createFixture()
    const session = await createDesignerAgentSession(
      createParams(),
      fixture.dependencies
    )
    const controller = new AbortController()

    await expect(session.listExtensions(controller.signal)).resolves.toEqual([])
    expect(fixture.calls).toContain("shell.run-options signal=true")
  })

  it("preserves a timeout from the agent extension command", async () => {
    const fixture = createFixture({
      extensionListError: new PlatformSessionError(
        "session_timeout",
        "timed out"
      ),
    })
    const session = await createDesignerAgentSession(
      createParams(),
      fixture.dependencies
    )

    await expect(session.listExtensions()).rejects.toMatchObject({
      code: "session_timeout",
    })
  })

  it("rejects malformed extension properties returned by the agent", async () => {
    const fixture = createFixture({
      extensionInfo: [{ name: "SecretMalformedExtension" }],
    })
    const session = await createDesignerAgentSession(
      createParams(),
      fixture.dependencies
    )

    const error = await session.listExtensions().catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: "platform_command_failed" })
    expect(String(error)).not.toContain("SecretMalformedExtension")
  })

  it("moves a partial dump and preserves safe platform diagnostics after a command failure", async () => {
    const fixture = createFixture({ dumpFailure: true, processLog: "process detail secret" })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    const error = await exportError(session, fixture.operationLog)
    expectAgentExportFailure(error, fixture.operationLog.path)

    expect(fixture.calls).toContain("rm /project/.nkdk/tmp/op/xml")
    expect(fixture.calls).toContain(
      "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml"
    )
    expect(fixture.writes.get(fixture.operationLog.path)).toContain("process detail ***")
    expect(fixture.writes.get(fixture.operationLog.path)).not.toContain("secret")
  })

  it("retains the platform failure when the process log cannot be read", async () => {
    const fixture = createFixture({ dumpFailure: true, processLogReadFailure: true })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    const error = await exportError(session, fixture.operationLog)
    expectAgentExportFailure(error, fixture.operationLog.path)
  })

  it("writes a reused session export only to the current operation log", async () => {
    const fixture = createFixture()
    const firstLog = fixture.operationLog
    const secondLog = fixture.createOperationLog("/project/.nkdk/tmp/op-2/platform.log")
    const session = await createDesignerAgentSession(
      createParams({ operationLog: firstLog }),
      fixture.dependencies
    )

    await session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      secondLog,
      "include"
    )

    expect(fixture.writes.get(secondLog.path)).toContain("configuration-export")
    expect(fixture.writes.get(firstLog.path)).not.toContain("configuration-export")
  })

  it("rejects an export outside AgentBaseDir", async () => {
    const fixture = createFixture()
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    await expect(
      session.exportConfiguration("/outside/xml", fixture.operationLog, "include")
    ).rejects.toMatchObject({ code: "platform_command_failed" })
    expect(fixture.calls.some((call) => call.includes("dump-config-to-files"))).toBe(false)
  })

  it("rejects an unsafe agent user service directory", async () => {
    const fixture = createFixture({
      agentBaseConfig: JSON.stringify({
        usersInfo: [{ name: "", dir: "../outside" }],
      }),
    })

    await expect(
      createDesignerAgentSession(createParams(), fixture.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(fixture.calls).toContain("process.kill")
  })

  it("rejects an agent user service symlink that resolves outside AgentBaseDir", async () => {
    const fixture = createFixture({
      agentBaseConfig: JSON.stringify({
        usersInfo: [{ name: "", dir: "linked-user" }],
      }),
      realpaths: {
        "/project/.nkdk/linked-user": "/outside/user",
      },
    })

    await expect(
      createDesignerAgentSession(createParams(), fixture.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(fixture.calls).toContain("process.kill")
  })

  it("rejects AgentBaseDir when .nkdk resolves outside the project", async () => {
    const fixture = createFixture({
      realpaths: {
        "/project/.nkdk": "/outside/nkdk",
        "/project/.nkdk/0": "/outside/nkdk/0",
      },
    })

    await expect(
      createDesignerAgentSession(createParams(), fixture.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(fixture.calls).toContain("process.kill")
  })

  it("rejects an output symlink that resolves outside AgentBaseDir", async () => {
    const fixture = createFixture({
      realpaths: {
        "/project/.nkdk/tmp/op/xml": "/outside/xml",
      },
    })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    await expect(
      session.exportConfiguration(
        "/project/.nkdk/tmp/op/xml",
        fixture.operationLog,
        "include"
      )
    ).rejects.toMatchObject({ code: "platform_command_failed" })
    expect(fixture.calls.some((call) => call.startsWith("rm "))).toBe(false)
  })

  it("rejects a platform installation without 1cv8", async () => {
    const fixture = createFixture()

    await expect(
      createDesignerAgentSession(
        createParams({ installation: { version: "8.3.27.2214", directory: "/opt/1cv8" } }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "platform_component_missing" })
    expect(fixture.calls).toEqual([])
  })

  it("does not connect when the owned process exits during startup", async () => {
    const fixture = createFixture({ processAlive: false })

    await expect(createDesignerAgentSession(
      createParams({ operationLog: fixture.operationLog }),
      fixture.dependencies
    )).rejects.toMatchObject({
      code: "session_start_failed",
      details: { stage: "session-start", mode: "designer-agent" },
    })
    expect(fixture.calls).not.toContain("ssh.connect 127.0.0.1:58248 fingerprint")
  })

  it("retries a refused local SSH connection", async () => {
    const fixture = createFixture({ connectFailures: 1 })

    await createDesignerAgentSession(createParams(), fixture.dependencies)

    expect(fixture.calls.filter((call) => call.startsWith("ssh.connect"))).toHaveLength(2)
    expect(fixture.calls).toContain("sleep 100")
  })

  it("stops retrying at the startup deadline", async () => {
    const fixture = createFixture({ connectFailures: Number.POSITIVE_INFINITY })

    await expect(createDesignerAgentSession(createParams(), fixture.dependencies)).rejects.toMatchObject({
      code: "session_timeout",
    })
  })

  it("forces only an owned process after the graceful close timeout", async () => {
    const owned = createFixture({ processWaitResult: false, processOwned: true })
    const ownedSession = await createDesignerAgentSession(createParams(), owned.dependencies)
    await expect(ownedSession.close()).resolves.toEqual({ stoppedOwnedProcess: true })
    expect(owned.calls).toContain("process.kill")

    const external = createFixture({ processWaitResult: false, processOwned: false })
    const externalSession = await createDesignerAgentSession(createParams(), external.dependencies)
    await expect(externalSession.close()).resolves.toEqual({ stoppedOwnedProcess: false })
    expect(external.calls).not.toContain("process.kill")
  })

  it("can retry closing when forced process termination fails", async () => {
    const fixture = createFixture({ processWaitResult: false, killFailures: 1 })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    await expect(session.close()).rejects.toThrow("kill failed")
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })
    expect(fixture.calls.filter((call) => call === "process.kill")).toHaveLength(2)
  })

  it("limits a hanging graceful cleanup command by the close timeout", async () => {
    const fixture = createFixture({
      cleanupCommandsHang: true,
      processWaitResult: false,
    })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)

    const closing = session.close()
    await fixture.cleanupStarted
    expect(fixture.calls).toContain("sleep 5000")
    await expect(closing).resolves.toEqual({ stoppedOwnedProcess: true })

    expect(fixture.calls).toContain("shell.close")
    expect(fixture.calls).toContain("process.kill")
  })

  it("cancels a pending export and terminates the owned process", async () => {
    const fixture = createFixture({
      dumpWaitsForAbort: true,
      processWaitResult: false,
    })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)
    const controller = new AbortController()

    const exporting = session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "include",
      controller.signal
    )
    const exportResult = expect(exporting).rejects.toMatchObject({
      code: "operation_cancelled",
    })
    await fixture.dumpStarted
    expect(fixture.calls).toContain(
      'shell.run config dump-config-to-files --dir=".nkdk-export" --format=hierarchical'
    )
    controller.abort()

    await exportResult

    expect(fixture.calls).toContain("shell.close")
    expect(fixture.calls).toContain("process.signal SIGTERM")
    expect(
      fixture.calls.filter((call) => call === "process.wait 5000")
    ).toHaveLength(2)
    expect(fixture.calls).toContain("process.kill SIGKILL")
    expect(fixture.calls.indexOf("process.signal SIGTERM")).toBeLessThan(
      fixture.calls.indexOf(
        "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml"
      )
    )
  })

  it("preserves cancellation when stopping needs a retry", async () => {
    const fixture = createFixture({
      dumpWaitsForAbort: true,
      processWaitResult: false,
      signalFailures: 1,
    })
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)
    const controller = new AbortController()

    const exporting = session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      fixture.operationLog,
      "include",
      controller.signal
    )
    const exportResult = expect(exporting).rejects.toMatchObject({
      code: "operation_cancelled",
    })
    await fixture.dumpStarted
    expect(fixture.calls).toContain(
      'shell.run config dump-config-to-files --dir=".nkdk-export" --format=hierarchical'
    )
    controller.abort()

    await exportResult
    expect(fixture.calls).not.toContain(
      "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml"
    )

    await expect(session.cancel()).resolves.toEqual({
      stoppedOwnedProcess: true,
    })
    expect(
      fixture.calls.filter((call) => call === "process.signal SIGTERM")
    ).toHaveLength(2)
    expect(fixture.calls).toContain(
      "rename /project/.nkdk/0/.nkdk-export /project/.nkdk/tmp/op/xml"
    )
  })
})

async function exportError(
  session: Awaited<ReturnType<typeof createDesignerAgentSession>>,
  operationLog: PlatformOperationLog
): Promise<unknown> {
  return session.exportConfiguration(
    "/project/.nkdk/tmp/op/xml",
    operationLog,
    "include"
  ).catch((caught: unknown) => caught)
}

function expectAgentExportFailure(error: unknown, logPath: string): void {
  expect(error).toMatchObject({
    code: "platform_command_failed",
    message: "dump failed",
    details: {
      stage: "configuration-export",
      mode: "designer-agent",
      logPath,
    },
  })
}

function createParams(
  overrides: Partial<Omit<CreatePlatformSessionParams, "settings">> & {
    settings?: Partial<CreatePlatformSessionParams["settings"]>
  } = {}
): CreatePlatformSessionParams {
  const { settings, ...rest } = overrides
  return {
    projectDir: "/project",
    sessionDir: "/project/.nkdk/platform-sessions/agent",
    installation: {
      version: "8.3.27.2214",
      directory: "/opt/1cv8/8.3.27.2214",
      enterprisePath: "/opt/1cv8/8.3.27.2214/1cv8",
    },
    settings: {
      connectionString: 'Srvr="server";Ref="reference";',
      password: "secret",
      sessionIdleTimeout: 900,
      ...settings,
    },
    ...rest,
  }
}

function createFixture(
  options: {
    processAlive?: boolean
    processOwned?: boolean
    processWaitResult?: boolean
    connectFailures?: number
    killFailures?: number
    signalFailures?: number
    cleanupCommandsHang?: boolean
    dumpWaitsForAbort?: boolean
    agentBaseConfig?: string
    dumpFailure?: boolean
    realpaths?: Record<string, string>
    extensionInfo?: unknown[]
    extensionResponseComplete?: boolean
    extensionListError?: Error
    processLog?: string
    processLogReadFailure?: boolean
    openCommandError?: Error
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  cleanupStarted: Promise<void>
  dumpStarted: Promise<void>
  operationLog: PlatformOperationLog
  createOperationLog(path: string): PlatformOperationLog
  dependencies: DesignerAgentDependencies
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  const createOperationLog = (path: string): PlatformOperationLog => ({
    path,
    available: true,
    async append(message) {
      calls.push(`write ${path}`)
      const safeMessage = this.sanitize(message)
      writes.set(path, `${writes.get(path) ?? ""}${safeMessage}\n`)
      return true
    },
    async process(stage, launch) {
      return this.append(`stage=${stage} command=${launch.command} ${launch.args.join(" ")}`)
    },
    sanitize: (value) => value.replaceAll("secret", "***"),
  })
  const operationLog = createOperationLog("/project/.nkdk/tmp/op/platform.log")
  let alive = options.processAlive ?? true
  let now = 0
  let connectFailures = options.connectFailures ?? 0
  let killFailures = options.killFailures ?? 0
  let signalFailures = options.signalFailures ?? 0
  const { promise: cleanupStarted, resolve: resolveCleanupStarted } = Promise.withResolvers<void>()
  const { promise: dumpStarted, resolve: resolveDumpStarted } = Promise.withResolvers<void>()
  const processHandle = {
    owned: options.processOwned ?? true,
    isAlive: () => alive,
    async wait(timeoutMs: number) {
      calls.push(`process.wait ${timeoutMs}`)
      if (options.processWaitResult ?? true) alive = false
      return options.processWaitResult ?? true
    },
    async waitForOutput() {},
    async signal(signal: NodeJS.Signals) {
      calls.push(`process.signal ${signal}`)
      if (signalFailures > 0) {
        signalFailures -= 1
        throw new Error("signal failed")
      }
    },
    async kill(signal?: NodeJS.Signals) {
      calls.push(signal === undefined ? "process.kill" : `process.kill ${signal}`)
      if (killFailures > 0) {
        killFailures -= 1
        throw new Error("kill failed")
      }
      alive = false
    },
  }
  const commandSession = {
    async run(
      command: string,
      runOptions?: { signal?: AbortSignal; timeoutMs?: number }
    ) {
      calls.push(`shell.run ${command}`)
      if (command.startsWith("common ")) resolveCleanupStarted()
      if (command.startsWith("config dump-config-to-files")) resolveDumpStarted()
      if (runOptions?.timeoutMs !== undefined) {
        calls.push(`shell.run-options timeout=${runOptions.timeoutMs}`)
      }
      if (runOptions?.signal !== undefined) {
        calls.push("shell.run-options signal=true")
      }
      if (
        options.extensionListError !== undefined &&
        command.includes("extensions properties get")
      ) {
        throw options.extensionListError
      }
      if (options.dumpFailure === true && command.startsWith("config ")) {
        throw new Error("dump failed")
      }
      if (options.dumpWaitsForAbort === true && command.startsWith("config ")) {
        if (runOptions?.signal === undefined) throw new Error("signal missing")
        await new Promise<void>((_resolve, reject) => {
          runOptions.signal?.addEventListener(
            "abort",
            () =>
              reject(
                new PlatformSessionError(
                  "operation_cancelled",
                  "operation cancelled"
                )
              ),
            { once: true }
          )
        })
      }
      if (options.cleanupCommandsHang === true && command.startsWith("common ")) {
        await new Promise<void>(() => undefined)
      }
      if (!command.includes("extensions properties get")) return {}
      return options.extensionResponseComplete === false
        ? {}
        : { extensionInfo: options.extensionInfo ?? [] }
    },
    isAlive: () => true,
    async close() {
      calls.push("shell.close")
    },
  }
  return {
    calls,
    writes,
    operationLog,
    createOperationLog,
    cleanupStarted,
    dumpStarted,
    dependencies: {
      portRuntime: {
        async reservePort(host) {
          calls.push(`reservePort ${host}`)
          return 58248
        },
      },
      fileSystem: {
        async mkdir(path) {
          calls.push(`mkdir ${path}`)
        },
        async readFile(path) {
          calls.push(`read ${path}`)
          if (path.endsWith("/process.log")) {
            if (options.processLogReadFailure === true) throw new Error("read failed secret")
            return options.processLog ?? ""
          }
          return (
            options.agentBaseConfig ??
            JSON.stringify({ usersInfo: [{ name: "", dir: "0" }] })
          )
        },
        async realpath(path) {
          return options.realpaths?.[path] ?? path
        },
        async rm(path) {
          calls.push(`rm ${path}`)
        },
        async rename(from, to) {
          calls.push(`rename ${from} ${to}`)
        },
        async writeFile(path, content) {
          calls.push(`write ${path}`)
          writes.set(path, content)
        },
      },
      processRuntime: {
        spawn(command, args) {
          calls.push(`spawn ${command} ${args.join(" ")}`)
          return processHandle
        },
      },
      async generateHostKey(path) {
        calls.push(`generateHostKey ${path}`)
        return "fingerprint"
      },
      sshTransport: {
        async connect({ host, port, expectedHostKeyHash }) {
          calls.push(`ssh.connect ${host}:${port} ${expectedHostKeyHash}`)
          if (connectFailures > 0) {
            connectFailures -= 1
            throw new Error("refused")
          }
          return {
            write() {},
            onData() {
              return () => undefined
            },
            isOpen: () => true,
            async close() {},
          }
        },
      },
      async openCommandSession() {
        calls.push("shell.connect-ib")
        if (options.openCommandError !== undefined) throw options.openCommandError
        return commandSession
      },
      clock: {
        now: () => now,
        async sleep(timeoutMs) {
          calls.push(`sleep ${timeoutMs}`)
          now += timeoutMs
        },
      },
      startupTimeoutMs: 200,
      commandTimeoutMs: 30 * 60 * 1000,
      retryDelayMs: 100,
      closeTimeoutMs: 5_000,
    },
  }
}

function extensionRecord(name: string) {
  return {
    name,
    version: "",
    active: "yes",
    purpose: "customization",
    "safe-mode": "yes",
    "security-profile-name": "",
    "unsafe-action-protection": "yes",
    "used-in-distributed-infobase": "no",
    scope: "infobase",
    "hash-sum": `${name}-hash`,
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
