import { describe, expect, it } from "vitest"
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
      "/project/.nkdk/tmp/op/platform.log",
      controller.signal
    )
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: false })

    expect(fixture.calls).toEqual([
      "mkdir /project/.nkdk/platform-sessions/standalone",
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml",
      "run ibcmd server config init --database-path=/bases/demo timeout=1800000",
      "write /project/.nkdk/platform-sessions/standalone/config.yaml mode=384",
      "chmod /project/.nkdk/platform-sessions/standalone/config.yaml mode=384",
      "run ibcmd infobase config export --password=secret --config=/project/.nkdk/platform-sessions/standalone/config.yaml /project/.nkdk/tmp/op/xml timeout=undefined signal=true grace=5000",
      "write /project/.nkdk/tmp/op/platform.log",
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml",
    ])
    expect(fixture.writes.get("/project/.nkdk/platform-sessions/standalone/config.yaml")).toBe(
      "database:\n  path: /bases/demo\n"
    )
    expect(fixture.writes.get("/project/.nkdk/tmp/op/platform.log")).not.toContain("secret")
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

  it("prepares an offline client-server configuration from database credentials", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(
      createParams({
        settings: {
          connectionString: 'Srvr="cluster";Ref="production";',
          database: {
            dbms: "PostgreSQL",
            server: "db.example.local",
            name: "production",
            user: "dbuser",
            password: "dbsecret",
          },
        },
      }),
      fixture.dependencies
    )
    await session.exportConfiguration(
      "/project/.nkdk/tmp/op/xml",
      "/project/.nkdk/tmp/op/platform.log"
    )

    expect(fixture.calls).toContain(
      "run ibcmd server config init --dbms=PostgreSQL --database-server=db.example.local --database-name=production --database-user=dbuser --database-password=dbsecret timeout=1800000"
    )
    expect(fixture.calls).toContain(
      "run ibcmd infobase config export --password=secret --config=/project/.nkdk/platform-sessions/standalone/config.yaml /project/.nkdk/tmp/op/xml timeout=undefined signal=false grace=5000"
    )
  })

  it("rejects a client-server connection without database credentials", async () => {
    const fixture = createFixture()

    await expect(
      createStandaloneServerSession(
        createParams({ settings: { connectionString: 'Srvr="server";Ref="base";' } }),
        fixture.dependencies
      )
    ).rejects.toMatchObject({ code: "invalid_project_settings" })
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

  it("maps ibcmd initialization and export failures", async () => {
    const initFailure = createFixture({ initExitCode: 1 })
    await expect(
      createStandaloneServerSession(createParams(), initFailure.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    expect(initFailure.calls).toContain(
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml"
    )
    const exportFailure = createFixture({ exportExitCode: 1 })
    const session = await createStandaloneServerSession(createParams(), exportFailure.dependencies)
    await expect(session.exportConfiguration("/xml", "/log")).rejects.toMatchObject({
      code: "platform_command_failed",
    })
  })

  it("maps an ibcmd initialization timeout", async () => {
    const initTimeout = createFixture({ initTimedOut: true })
    await expect(
      createStandaloneServerSession(createParams(), initTimeout.dependencies)
    ).rejects.toMatchObject({ code: "session_timeout" })
  })

  it("maps an aborted ibcmd export to operation_cancelled", async () => {
    const fixture = createFixture({ exportCancelled: true })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await expect(session.exportConfiguration("/xml", "/log")).rejects.toMatchObject({
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

  it("closes the cached ibcmd session without stopping a process", async () => {
    const fixture = createFixture()
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    expect(session.isAlive()).toBe(true)
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: false })
    expect(session.isAlive()).toBe(false)
    expect(fixture.calls).toContain(
      "rm /project/.nkdk/platform-sessions/standalone/config.yaml"
    )
  })

  it("can retry closing when removing the private config fails", async () => {
    const fixture = createFixture({ rmFailureCall: 2 })
    const session = await createStandaloneServerSession(createParams(), fixture.dependencies)

    await expect(session.close()).rejects.toThrow("rm failed")
    expect(session.isAlive()).toBe(true)
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: false })
    expect(fixture.calls.filter((call) => call.startsWith("rm "))).toHaveLength(3)
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
    initStdout?: string
    initTimedOut?: boolean
    exportExitCode?: number
    exportCancelled?: boolean
    rmFailureCall?: number
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  dependencies: StandaloneServerDependencies
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  let rmCalls = 0
  return {
    calls,
    writes,
    dependencies: {
      fileSystem: {
        async mkdir(path) {
          calls.push(`mkdir ${path}`)
        },
        async writeFile(path, content, writeOptions) {
          calls.push(
            `write ${path}${writeOptions?.mode === undefined ? "" : ` mode=${writeOptions.mode}`}`
          )
          writes.set(path, content)
        },
        async chmod(path, mode) {
          calls.push(`chmod ${path} mode=${mode}`)
        },
        async rm(path) {
          calls.push(`rm ${path}`)
          rmCalls += 1
          if (rmCalls === options.rmFailureCall) {
            throw new Error("rm failed")
          }
        },
      },
      processRuntime: {
        async run(command, args, runOptions) {
          calls.push(
            [
              `run ${command} ${args.join(" ")}`,
              `timeout=${runOptions?.timeoutMs}`,
              ...(args.includes("export")
                ? [
                    `signal=${runOptions?.signal instanceof AbortSignal}`,
                    `grace=${runOptions?.terminationGraceMs}`,
                  ]
                : []),
            ].join(" ")
          )
          const isExport = args.includes("export")
          return {
            stdout: isExport
              ? "[INFO] Export complete\n"
              : (options.initStdout ?? "database:\n  path: /bases/demo\n"),
            stderr: "",
            exitCode: isExport ? (options.exportExitCode ?? 0) : (options.initExitCode ?? 0),
            timedOut: isExport ? false : (options.initTimedOut ?? false),
            cancelled: isExport ? (options.exportCancelled ?? false) : false,
          }
        },
      },
      commandTimeoutMs: 1_800_000,
      closeTimeoutMs: 5_000,
      platform: "darwin",
    },
  }
}
