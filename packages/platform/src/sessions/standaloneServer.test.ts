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
    await expect(session.close()).resolves.toEqual({ stoppedOwnedProcess: false })

    expect(fixture.calls).toEqual([
      "mkdir /project/.nkdk/platform-sessions/standalone",
      "run ibcmd server config init --database-path=/bases/demo timeout=1800000",
      "write /project/.nkdk/platform-sessions/standalone/config.yaml",
      "run ibcmd infobase config export --password=secret --config=/project/.nkdk/platform-sessions/standalone/config.yaml /project/.nkdk/tmp/op/xml timeout=1800000",
      "write /project/.nkdk/tmp/op/platform.log",
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

  it("maps ibcmd initialization and export failures", async () => {
    const initFailure = createFixture({ initExitCode: 1 })
    await expect(
      createStandaloneServerSession(createParams(), initFailure.dependencies)
    ).rejects.toMatchObject({ code: "session_start_failed" })
    const exportFailure = createFixture({ exportExitCode: 1 })
    const session = await createStandaloneServerSession(createParams(), exportFailure.dependencies)
    await expect(session.exportConfiguration("/xml", "/log")).rejects.toMatchObject({
      code: "platform_command_failed",
    })
  })

  it("maps ibcmd initialization and export timeouts", async () => {
    const initTimeout = createFixture({ initTimedOut: true })
    await expect(
      createStandaloneServerSession(createParams(), initTimeout.dependencies)
    ).rejects.toMatchObject({ code: "session_timeout" })

    const exportTimeout = createFixture({ exportTimedOut: true })
    const session = await createStandaloneServerSession(createParams(), exportTimeout.dependencies)
    await expect(session.exportConfiguration("/xml", "/log")).rejects.toMatchObject({
      code: "session_timeout",
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
    exportTimedOut?: boolean
  } = {}
): {
  calls: string[]
  writes: Map<string, string>
  dependencies: StandaloneServerDependencies
} {
  const calls: string[] = []
  const writes = new Map<string, string>()
  return {
    calls,
    writes,
    dependencies: {
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
        async run(command, args, runOptions) {
          calls.push(`run ${command} ${args.join(" ")} timeout=${runOptions?.timeoutMs}`)
          const isExport = args.includes("export")
          return {
            stdout: isExport
              ? "[INFO] Export complete\n"
              : (options.initStdout ?? "database:\n  path: /bases/demo\n"),
            stderr: "",
            exitCode: isExport ? (options.exportExitCode ?? 0) : (options.initExitCode ?? 0),
            timedOut: isExport
              ? (options.exportTimedOut ?? false)
              : (options.initTimedOut ?? false),
          }
        },
      },
      commandTimeoutMs: 1_800_000,
    },
  }
}
