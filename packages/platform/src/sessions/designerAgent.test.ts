import { describe, expect, it } from "vitest"
import type { CreatePlatformSessionParams } from "./types"
import {
  createDesignerAgentSession,
  type DesignerAgentDependencies,
} from "./designerAgent"

describe("Designer agent session", () => {
  it("starts once, exports through SSH, and closes gracefully", async () => {
    const fixture = createFixture()
    const session = await createDesignerAgentSession(createParams(), fixture.dependencies)
    await session.exportConfiguration("/project/.nkdk/tmp/op/xml", "/project/.nkdk/tmp/op/platform.log")
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })

    expect(fixture.calls).toEqual([
      "reservePort 127.0.0.1",
      "mkdir /project/.nkdk/platform-sessions/agent",
      "generateHostKey /project/.nkdk/platform-sessions/agent/host.key",
      "spawn /opt/1cv8/8.3.27.2214/1cv8 DESIGNER /Sserver\\reference /AgentMode /AgentSSHHostKey /project/.nkdk/platform-sessions/agent/host.key /AgentBaseDir /project/.nkdk/platform-sessions/agent /AppAutoCheckVersion- /AgentPort 58248 /Out /project/.nkdk/platform-sessions/agent/process.log -NoTruncate",
      "ssh.connect 127.0.0.1:58248 fingerprint",
      "shell.connect-ib",
      'shell.run config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical',
      "write /project/.nkdk/tmp/op/platform.log",
      "shell.run common disconnect-ib",
      "shell.run common shutdown",
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

  it("rejects file mode because the platform ignores XML dump commands there", async () => {
    const fixture = createFixture()

    await expect(
      createDesignerAgentSession(
        createParams({ settings: { connectionString: 'File="/bases/demo";' } }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "unsupported_connection" })
    expect(fixture.calls).toEqual([])
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

    await expect(createDesignerAgentSession(createParams(), fixture.dependencies)).rejects.toMatchObject({
      code: "session_start_failed",
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
})

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
      useStandaloneServer: false,
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
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  dependencies: DesignerAgentDependencies
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  let alive = options.processAlive ?? true
  let now = 0
  let connectFailures = options.connectFailures ?? 0
  let killFailures = options.killFailures ?? 0
  const processHandle = {
    owned: options.processOwned ?? true,
    isAlive: () => alive,
    async wait(timeoutMs: number) {
      calls.push(`process.wait ${timeoutMs}`)
      if (options.processWaitResult ?? true) alive = false
      return options.processWaitResult ?? true
    },
    async waitForOutput() {},
    async kill() {
      calls.push("process.kill")
      if (killFailures > 0) {
        killFailures -= 1
        throw new Error("kill failed")
      }
      alive = false
    },
  }
  const commandSession = {
    async run(command: string) {
      calls.push(`shell.run ${command}`)
    },
    isAlive: () => true,
    async close() {
      calls.push("shell.close")
    },
  }
  return {
    calls,
    writes,
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
      retryDelayMs: 100,
      closeTimeoutMs: 5_000,
    },
  }
}
