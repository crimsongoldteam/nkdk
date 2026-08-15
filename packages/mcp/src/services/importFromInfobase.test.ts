import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "@nkdk/platform"
import { importFromInfobase, type ImportFromInfobaseDependencies } from "./importFromInfobase"

const temporaryDirectory = join("/project", ".nkdk", "tmp", "import-from-infobase", "op-1")
const platformLogPath = join(temporaryDirectory, "platform.log")

describe("import from infobase", () => {
  it("requires explicit write confirmation before reading settings", async () => {
    const fixture = createFixture()
    const result = await importFromInfobase({
      projectDir: "/project",
      componentPath: "cfe/Расширение",
    }, fixture.dependencies)
    expect(result).toMatchObject({
      ok: false,
      code: "confirmation_required",
      details: { componentPath: "cfe/Расширение" },
    })
    expect(fixture.calls).toEqual([])
  })

  it("reads settings before resolving the target and removes a successful dump", async () => {
    const fixture = createFixture()
    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(fixture.calls).toEqual([
      "readProjectSettings /project",
      "resolveTarget /project cf",
      "assertTargetEmpty /project/cf",
      `mkdir ${join(temporaryDirectory, "xml")}`,
      "exportConfiguration",
      "syncConfigurationFromXML move",
      `rm ${temporaryDirectory}`,
    ])
    expect(result).toEqual({
      ok: true,
      succeeded: 2,
      failed: [],
      warnings: [],
      configurationIndexPath: "/project/.nkdk/components/default/configuration-index.lmdb",
      settingsPath: "/project/.nkdk/project.yaml",
      mode: "designer-agent",
      reusedConnection: false,
    })
    expect(fixture.exportedSettings).toMatchObject({
      connectionString: 'File="/bases/demo";',
      user: "Администратор",
      password: "secret",
      sessionIdleTimeout: 900,
      mode: "designer-agent",
      unresolvedReferences: "include",
    })
    expect(fixture.exportedSettings).not.toHaveProperty("operations")
  })

  it("exports and imports the selected extension", async () => {
    const fixture = createFixture()
    await importFromInfobase({
      ...input(),
      componentPath: "cfe/Расширение_All",
    }, fixture.dependencies)

    expect(fixture.calls).toContain("resolveTarget /project cfe/Расширение_All")
    expect(fixture.exportedSettings).toMatchObject({ extensionName: "Расширение_All" })
    expect(fixture.importedOutputDirs).toEqual(["/project/cfe/Расширение_All"])
  })

  it.each([
    [
      "missing",
      {
        status: "missing" as const,
        projectDir: "/project",
        settingsPath: "/project/.nkdk/project.yaml",
      },
      "project_settings_required",
    ],
    [
      "invalid",
      {
        status: "invalid" as const,
        projectDir: "/project",
        settingsPath: "/project/.nkdk/project.yaml",
        diagnostics: [{ code: "required", path: "infobase.connectionString", message: "Поле не задано" }],
      },
      "invalid_project_settings",
    ],
  ])("returns %s settings diagnostics before touching the target", async (_name, settingsResult, code) => {
    const fixture = createFixture({ settingsResult })
    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(result).toMatchObject({
      ok: false,
      code,
      details: {
        settingsPath: "/project/.nkdk/project.yaml",
        schema: { uri: "nkdk://project-settings/schema/v1", format: "application/schema+json" },
      },
    })
    expect(fixture.calls).toEqual(["readProjectSettings /project"])
  })

  it("preserves platform text, stage, mode, log URI and the temporary directory", async () => {
    const fixture = createFixture({
      exportError: new PlatformSessionError("authentication_failed", "Access denied", {
        details: {
          stage: "authentication",
          mode: "designer-agent",
          logPath: platformLogPath,
        },
      }),
    })

    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(result).toEqual({
      ok: false,
      code: "authentication_failed",
      message: "Access denied",
      details: {
        temporaryDirectory,
        stage: "authentication",
        mode: "designer-agent",
        log: {
          uri: pathToFileURL(platformLogPath).href,
          format: "text/plain",
        },
      },
    })
  })

  it("omits log details when the platform log is unavailable", async () => {
    const fixture = createFixture({
      exportError: new PlatformSessionError("platform_command_failed", "Журнал недоступен", {
        details: { stage: "platform-log", mode: "designer-agent" },
      }),
    })
    const result = await importFromInfobase(input(), fixture.dependencies)
    expect(result).toMatchObject({
      ok: false,
      message: "Журнал недоступен",
      details: { stage: "platform-log", mode: "designer-agent" },
    })
    expect(result.details).not.toHaveProperty("log")
  })

  it("keeps a partial XML import and its temporary directory", async () => {
    const fixture = createFixture({
      importResult: {
        succeeded: 1,
        failed: [{
          severity: "error",
          code: "xml_failed",
          message: "failed",
          targetProjectPath: "Catalogs/Test.xml",
        }],
        warnings: [],
      },
    })
    const result = await importFromInfobase(input(), fixture.dependencies)
    expect(result).toMatchObject({
      ok: true,
      failed: [expect.objectContaining({ code: "xml_failed" })],
      temporaryDirectory,
    })
    expect(fixture.calls).not.toContain(expect.stringMatching(/^rm /u))
  })

  it("passes cancellation to the platform and stops before XML import", async () => {
    const controller = new AbortController()
    const fixture = createFixture({ afterExport: () => controller.abort() })
    const result = await importFromInfobase(input(), fixture.dependencies, controller.signal)
    expect(fixture.exportedSettings["signal"]).toBe(controller.signal)
    expect(result).toMatchObject({ ok: false, code: "operation_cancelled" })
    expect(fixture.calls).not.toContain("syncConfigurationFromXML move")
  })

  it("maps an unexpected error to a stable message without deleting the dump", async () => {
    const fixture = createFixture({ exportError: new Error("secret failure") })
    const result = await importFromInfobase(input(), fixture.dependencies)
    expect(result).toMatchObject({
      ok: false,
      code: "core_error",
      message: "Не удалось импортировать конфигурацию из информационной базы",
      details: { temporaryDirectory },
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })
})

function input() {
  return { projectDir: "/project", allowWrite: true as const }
}

const readySettings = {
  status: "ready" as const,
  projectDir: "/project",
  settingsPath: "/project/.nkdk/project.yaml",
  settings: {
    infobase: {
      connectionString: 'File="/bases/demo";',
      user: "Администратор",
      password: "secret",
      sessionIdleTimeout: 900,
      operations: {
        import: { mode: "designer-agent" as const, unresolvedReferences: "include" as const },
      },
    },
  },
}

function createFixture(options: {
  settingsResult?: Awaited<ReturnType<ImportFromInfobaseDependencies["readSettings"]>>
  exportError?: Error
  afterExport?: () => void
  importResult?: {
    succeeded: number
    failed: Array<{ severity: "error"; code: string; message: string; targetProjectPath: string }>
    warnings: []
  }
} = {}) {
  const calls: string[] = []
  const exportedSettings: Record<string, unknown> = {}
  const importedOutputDirs: string[] = []
  const dependencies: ImportFromInfobaseDependencies = {
    async readSettings(projectDir) {
      calls.push(`readProjectSettings ${projectDir}`)
      return options.settingsResult ?? readySettings
    },
    platformManager: {
      async exportConfiguration(params) {
        calls.push("exportConfiguration")
        Object.assign(exportedSettings, params)
        if (options.exportError !== undefined) throw options.exportError
        options.afterExport?.()
        return { mode: "designer-agent", reusedConnection: false }
      },
    },
    async importXml(params) {
      calls.push(`syncConfigurationFromXML ${params.externalFileTransfer}`)
      importedOutputDirs.push(params.outputDir)
      return options.importResult ?? {
        succeeded: 2,
        failed: [],
        warnings: [],
        configurationIndexPath: "/project/.nkdk/components/default/configuration-index.lmdb",
      }
    },
    resolveTarget({ projectDir, componentPath }) {
      calls.push(`resolveTarget ${projectDir} ${componentPath ?? "cf"}`)
      const selectedComponentPath = componentPath ?? "cf"
      return {
        ok: true,
        projectDir,
        componentDir: `${projectDir}/${selectedComponentPath}`,
        componentPath: selectedComponentPath,
        nkdkDir: `${projectDir}/.nkdk`,
      }
    },
    assertTargetEmpty(componentDir) {
      calls.push(`assertTargetEmpty ${componentDir}`)
      return undefined
    },
    fs: {
      async mkdir(path) {
        calls.push(`mkdir ${path}`)
      },
      async rm(path) {
        calls.push(`rm ${path}`)
      },
    },
    operationId: () => "op-1",
  }
  return { calls, exportedSettings, importedOutputDirs, dependencies }
}
