import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "@nkdk/platform"
import {
  listInfobaseExtensions,
  type ListInfobaseExtensionsDependencies,
} from "./listInfobaseExtensions"

const extension = {
  name: "Patch",
  version: "",
  active: true,
  purpose: "patch" as const,
  safeMode: false,
  securityProfileName: "",
  unsafeActionProtection: true,
  usedInDistributedInfobase: false,
  scope: "infobase" as const,
  hashSum: "hash",
}

describe("list infobase extensions service", () => {
  it("reads project settings and passes them with cancellation to the manager", async () => {
    const fixture = createFixture()
    const controller = new AbortController()

    await expect(
      listInfobaseExtensions(
        { projectDir: "/project" },
        fixture.dependencies,
        controller.signal
      )
    ).resolves.toEqual({
      ok: true,
      extensions: [extension],
      mode: "standalone-server",
      reusedConnection: true,
    })
    expect(fixture.readProjectDirs).toEqual(["/project"])
    expect(fixture.managerParams).toEqual([
      {
        projectDir: "/project",
        connectionString: 'File="/bases/demo";',
        user: "Admin",
        password: "secret",
        useStandaloneServer: true,
        sessionIdleTimeout: 900,
        signal: controller.signal,
      },
    ])
  })

  it("returns invalid_project_settings when project settings are absent", async () => {
    const fixture = createFixture({ settingsAbsent: true })

    await expect(
      listInfobaseExtensions(
        { projectDir: "/project" },
        fixture.dependencies
      )
    ).resolves.toEqual({
      ok: false,
      code: "invalid_project_settings",
      message: "Не найдены настройки подключения проекта",
    })
    expect(fixture.managerParams).toEqual([])
  })

  it.each([
    "platform_not_found",
    "platform_component_missing",
    "unsupported_connection",
    "invalid_project_settings",
    "authentication_failed",
    "session_start_failed",
    "session_timeout",
    "platform_command_failed",
    "operation_cancelled",
  ] as const)("preserves platform code without exposing its message: %s", async (code) => {
    const fixture = createFixture({
      managerError: new PlatformSessionError(code, "secret database-secret"),
    })

    const result = await listInfobaseExtensions(
      { projectDir: "/project" },
      fixture.dependencies
    )

    expect(result).toEqual({
      ok: false,
      code,
      message: `Операция платформы завершилась с ошибкой: ${code}`,
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })

  it("maps an unexpected error to a safe common error", async () => {
    const fixture = createFixture({
      managerError: new Error("secret failure"),
    })

    await expect(
      listInfobaseExtensions(
        { projectDir: "/project" },
        fixture.dependencies
      )
    ).resolves.toEqual({
      ok: false,
      code: "core_error",
      message: "Не удалось получить список расширений информационной базы",
    })
  })
})

function createFixture(
  options: {
    settingsAbsent?: boolean
    managerError?: Error
  } = {}
): {
  readProjectDirs: string[]
  managerParams: Array<Record<string, unknown>>
  dependencies: ListInfobaseExtensionsDependencies
} {
  const readProjectDirs: string[] = []
  const managerParams: Array<Record<string, unknown>> = []
  return {
    readProjectDirs,
    managerParams,
    dependencies: {
      async readSettings(projectDir) {
        readProjectDirs.push(projectDir)
        if (options.settingsAbsent) return undefined
        return {
          version: 1,
          infobase: {
            connectionString: 'File="/bases/demo";',
            user: "Admin",
            password: "secret",
            useStandaloneServer: true,
            sessionIdleTimeout: 900,
          },
        }
      },
      platformManager: {
        async listExtensions(params) {
          managerParams.push(params)
          if (options.managerError !== undefined) throw options.managerError
          return {
            extensions: [extension],
            mode: "standalone-server",
            reusedConnection: true,
          }
        },
      },
    },
  }
}
