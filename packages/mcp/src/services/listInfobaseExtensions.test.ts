import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "@nkdk/platform"
import { listInfobaseExtensions, type ListInfobaseExtensionsDependencies } from "./listInfobaseExtensions"

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
  it("passes validated project settings and the operation mode to the manager", async () => {
    const fixture = createFixture()
    const controller = new AbortController()
    await expect(listInfobaseExtensions(
      { projectDir: "/project" },
      fixture.dependencies,
      controller.signal
    )).resolves.toEqual({
      ok: true,
      extensions: [extension],
      mode: "standalone-server",
      reusedConnection: true,
    })
    expect(fixture.managerParams).toEqual([{
      projectDir: "/project",
      connectionString: 'File="/bases/demo";',
      user: "Admin",
      password: "secret",
      sessionIdleTimeout: 900,
      mode: "standalone-server",
      signal: controller.signal,
    }])
  })

  it.each([
    ["missing", "project_settings_required"],
    ["invalid", "invalid_project_settings"],
  ] as const)("returns the shared %s settings result", async (status, code) => {
    const fixture = createFixture({ status })
    const result = await listInfobaseExtensions({ projectDir: "/project" }, fixture.dependencies)
    expect(result).toMatchObject({
      ok: false,
      code,
      details: {
        settingsPath: "/project/.nkdk/project.yaml",
        schema: { uri: "nkdk://project-settings/schema/v1", format: "application/schema+json" },
      },
    })
    expect(fixture.managerParams).toEqual([])
  })

  it("keeps platform errors safe", async () => {
    const fixture = createFixture({
      managerError: new PlatformSessionError("authentication_failed", "secret failure"),
    })
    const result = await listInfobaseExtensions({ projectDir: "/project" }, fixture.dependencies)
    expect(result).toEqual({
      ok: false,
      code: "authentication_failed",
      message: "Операция платформы завершилась с ошибкой: authentication_failed",
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })
})

function createFixture(options: {
  status?: "ready" | "missing" | "invalid"
  managerError?: Error
} = {}) {
  const managerParams: Array<Record<string, unknown>> = []
  const dependencies: ListInfobaseExtensionsDependencies = {
    async readSettings(projectDir) {
      const common = { projectDir, settingsPath: `${projectDir}/.nkdk/project.yaml` }
      if (options.status === "missing") return { status: "missing", ...common }
      if (options.status === "invalid") {
        return {
          status: "invalid",
          ...common,
          diagnostics: [{ code: "required", path: "infobase.connectionString", message: "Поле не задано" }],
        }
      }
      return {
        status: "ready",
        ...common,
        settings: {
          infobase: {
            connectionString: 'File="/bases/demo";',
            user: "Admin",
            password: "secret",
            sessionIdleTimeout: 900,
            operations: {
              import: { mode: "standalone-server", unresolvedReferences: "include" },
            },
          },
        },
      }
    },
    platformManager: {
      async listExtensions(params) {
        managerParams.push(params)
        if (options.managerError !== undefined) throw options.managerError
        return { extensions: [extension], mode: "standalone-server", reusedConnection: true }
      },
    },
  }
  return { managerParams, dependencies }
}
