import { parse } from "yaml"
import { describe, expect, it } from "vitest"
import type { CreatePlatformSessionParams } from "./types"
import {
  createStandaloneServerSession,
  type StandaloneServerDependencies,
} from "./standaloneServer"

describe("standalone server session", () => {
  it("prepares configuration, exports, and closes a local server", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)
    await session.exportConfiguration("/project/.nkdk/tmp/op/xml", "/project/.nkdk/tmp/op/platform.log")
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: true })

    expect(fixture.calls).toEqual([
      "reservePort 127.0.0.1",
      "mkdir /project/.nkdk/platform-sessions/standalone",
      "generateHostKey /project/.nkdk/platform-sessions/standalone/host.key",
      "run ibcmd server config init --database-path=/bases/demo",
      "write /project/.nkdk/platform-sessions/standalone/config.yaml",
      "spawn ibsrv --data /project/.nkdk/platform-sessions/standalone/data --session-data /project/.nkdk/platform-sessions/standalone/session-data --config /project/.nkdk/platform-sessions/standalone/config.yaml",
      "wait-output Stand-alone Server ready. 60000",
      "ssh.connect 127.0.0.1:8338",
      "shell.connect-ib",
      'shell.run config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical',
      "write /project/.nkdk/tmp/op/platform.log",
      "shell.close",
      "process.signal SIGTERM",
      "process.wait 5000",
    ])
    expect(parse(fixture.writes.get("/project/.nkdk/platform-sessions/standalone/config.yaml") ?? "")).toEqual({
      database: { path: "/bases/demo" },
      gates: {
        ssh: {
          admin: {
            address: "localhost",
            port: 8338,
            "host-key": "/project/.nkdk/platform-sessions/standalone/host.key",
          },
        },
      },
      features: {
        "direct-gate": false,
        "http-gate": false,
        "ssh-gate": true,
      },
    })
    expect(fixture.writes.get("/project/.nkdk/tmp/op/platform.log")).not.toContain("secret")
  })

  it.each([
    [{ ibcmdPath: undefined, ibsrvPath: "ibsrv" }, "ibcmd"],
    [{ ibcmdPath: "ibcmd", ibsrvPath: undefined }, "ibsrv"],
  ])("rejects a missing platform component: %s", async (components, expected) => {
    const fixture = createFixture()
    await expect(
      createStandaloneServerSession(
        createParams({
          installation: {
            version: "8.3.27.2214",
            directory: "/opt/1cv8",
            ...components,
          },
        }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "platform_component_missing", message: expect.stringContaining(expected) })
    expect(fixture.calls).toEqual([])
  })

  it("rejects a client-server connection before touching runtime boundaries", async () => {
    const fixture = createFixture()
    await expect(
      createStandaloneServerSession(
        createParams({ settings: { connectionString: 'Srvr="server";Ref="base";' } }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "unsupported_connection" })
    expect(fixture.calls).toEqual([])
  })

  it("maps ibcmd failure and readiness timeout without leaking a process", async () => {
    const initFailure = createFixture({ initExitCode: 1 })
    await expect(
      createStandaloneServerSession(createParams(), initFailure.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(initFailure.calls).not.toContain(expect.stringMatching(/^spawn /))

    const readinessFailure = createFixture({ readinessError: new Error("timeout") })
    await expect(
      createStandaloneServerSession(createParams(), readinessFailure.dependencies)
    ).rejects.toMatchObject({ code: "session_timeout" })
    expect(readinessFailure.calls).toContain("process.kill")
  })

  it("forces only an owned process after graceful shutdown times out", async () => {
    const owned = createFixture({ processWaitResult: false, processOwned: true })
    const ownedSession = await createStandaloneServerSession(createParams(), owned.dependencies)
    await expect(ownedSession.close()).resolves.toEqual({ stoppedOwnedProcess: true })
    expect(owned.calls).toContain("process.signal SIGTERM")
    expect(owned.calls).toContain("process.kill")

    const external = createFixture({ processWaitResult: false, processOwned: false })
    const externalSession = await createStandaloneServerSession(createParams(), external.dependencies)
    await expect(externalSession.close()).resolves.toEqual({ stoppedOwnedProcess: false })
    expect(external.calls).not.toContain(expect.stringMatching(/^process\.(signal|kill)/))
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
      useStandaloneServer: true,
      sessionIdleTimeout: 900,
      ...settings,
    },
    ...rest,
  }
}

function createFixture(
  options: {
    initExitCode?: number
    readinessError?: Error
    processOwned?: boolean
    processWaitResult?: boolean
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  dependencies: StandaloneServerDependencies
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  let alive = true
  const processHandle = {
    owned: options.processOwned ?? true,
    isAlive: () => alive,
    async wait(timeoutMs: number) {
      calls.push(`process.wait ${timeoutMs}`)
      if (options.processWaitResult ?? true) alive = false
      return options.processWaitResult ?? true
    },
    async waitForOutput(value: string, timeoutMs: number) {
      calls.push(`wait-output ${value} ${timeoutMs}`)
      if (options.readinessError !== undefined) throw options.readinessError
    },
    async signal(signal: NodeJS.Signals) {
      calls.push(`process.signal ${signal}`)
    },
    async kill() {
      calls.push("process.kill")
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
          return 8338
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
        async run(command, args) {
          calls.push(`run ${command} ${args.join(" ")}`)
          return {
            stdout: "database:\n  path: /bases/demo\n",
            stderr: "",
            exitCode: options.initExitCode ?? 0,
          }
        },
      },
      async generateHostKey(path) {
        calls.push(`generateHostKey ${path}`)
      },
      sshTransport: {
        async connect({ host, port }) {
          calls.push(`ssh.connect ${host}:${port}`)
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
      platform: "linux",
      startupTimeoutMs: 60_000,
      closeTimeoutMs: 5_000,
    },
  }
}
