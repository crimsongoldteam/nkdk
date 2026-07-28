import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "@nkdk/platform"
import { importFromInfobase, type ImportFromInfobaseDependencies } from "./importFromInfobase"

describe("import from infobase", () => {
  it("requires explicit write confirmation before any dependency call", async () => {
    const fixture = createFixture()

    const result = await importFromInfobase(
      {
        projectDir: "/project",
        connectionString: 'File="/bases/demo";',
      },
      fixture.dependencies
    )

    expect(result).toMatchObject({ ok: false, code: "confirmation_required" })
    expect(fixture.calls).toEqual([])
  })

  it("exports into .nkdk, moves external files, saves settings, and removes a successful dump", async () => {
    const fixture = createFixture()

    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(fixture.calls).toEqual([
      "resolveTarget /project cf",
      "assertTargetEmpty /project/cf",
      "mkdir /project/.nkdk/tmp/import-from-infobase/op-1/xml",
      "exportConfiguration",
      "syncConfigurationFromXML move",
      "writeProjectSettings",
      "rm /project/.nkdk/tmp/import-from-infobase/op-1",
    ])
    expect(result).toEqual({
      ok: true,
      succeeded: 2,
      failed: [],
      warnings: [],
      configurationIndexPath: "/project/.nkdk/configuration-index/default.bin",
      settingsPath: "/project/.nkdk/project.yaml",
      mode: "designer-agent",
      reusedConnection: false,
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })

  it("passes database credentials to the platform and project settings", async () => {
    const fixture = createFixture()
    const database = {
      dbms: "PostgreSQL" as const,
      server: "db.example.local",
      name: "production",
      user: "dbuser",
      password: "dbsecret",
    }

    await importFromInfobase(
      {
        ...input(),
        connectionString: 'Srvr="cluster";Ref="production";',
        useStandaloneServer: true,
        database,
      },
      fixture.dependencies
    )

    expect(fixture.exportedSettings).toMatchObject({ database })
    expect(fixture.writtenSettings).toMatchObject({ infobase: { database } })
  })

  it("preserves the dump and does not save settings after object failures", async () => {
    const fixture = createFixture({
      importResult: {
        succeeded: 1,
        failed: [
          {
            severity: "error",
            code: "xml_failed",
            message: "failed",
            targetProjectPath: "Catalogs/Test.xml",
          },
        ],
        warnings: [],
      },
    })

    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(result).toMatchObject({
      ok: true,
      failed: [{ kind: "xml_failed", name: "Catalogs/Test.xml", message: "failed" }],
      temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1",
    })
    expect(fixture.calls).not.toContain("writeProjectSettings")
    expect(fixture.calls).not.toContain(expect.stringMatching(/^rm /))
  })

  it.each([
    [
      new PlatformSessionError("platform_not_found", "secret platform failure"),
      "platform_not_found",
    ],
    [new Error("secret core failure"), "core_error"],
  ] as const)("returns a safe error and preserves the dump: %s", async (failure, code) => {
    const fixture = createFixture({ exportError: failure })

    const result = await importFromInfobase(input(), fixture.dependencies)

    expect(result).toMatchObject({
      ok: false,
      code,
      details: { temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1" },
    })
    expect(JSON.stringify(result)).not.toContain("secret")
    expect(fixture.calls).not.toContain("writeProjectSettings")
    expect(fixture.calls).not.toContain(expect.stringMatching(/^rm /))
  })

  it("does not expose infobase or database passwords in an error result", async () => {
    const fixture = createFixture({
      exportError: new PlatformSessionError(
        "session_start_failed",
        "secret database-secret"
      ),
    })

    const result = await importFromInfobase(
      {
        ...input(),
        connectionString: 'Srvr="cluster";Ref="production";',
        useStandaloneServer: true,
        database: {
          dbms: "PostgreSQL",
          server: "db",
          name: "base",
          user: "dbuser",
          password: "database-secret",
        },
      },
      fixture.dependencies
    )

    expect(JSON.stringify(result)).not.toContain("secret")
    expect(JSON.stringify(result)).not.toContain("database-secret")
  })
})

function input() {
  return {
    projectDir: "/project",
    connectionString: 'File="/bases/demo";',
    user: "Администратор",
    password: "secret",
    useStandaloneServer: false,
    sessionIdleTimeout: 900,
    allowWrite: true,
  }
}

function createFixture(
  options: {
    exportError?: Error
    importResult?: {
      succeeded: number
      failed: Array<{
        severity: "error"
        code: string
        message: string
        targetProjectPath: string
      }>
      warnings: []
    }
  } = {}
): {
  calls: string[]
  exportedSettings: Record<string, unknown>
  writtenSettings: Record<string, unknown>
  dependencies: ImportFromInfobaseDependencies
} {
  const calls: string[] = []
  const exportedSettings: Record<string, unknown> = {}
  const writtenSettings: Record<string, unknown> = {}
  return {
    calls,
    exportedSettings,
    writtenSettings,
    dependencies: {
      platformManager: {
        async exportConfiguration(params) {
          calls.push("exportConfiguration")
          Object.assign(exportedSettings, params)
          if (options.exportError !== undefined) throw options.exportError
          return { mode: "designer-agent", reusedConnection: false }
        },
      },
      async importXml(params) {
        calls.push(`syncConfigurationFromXML ${params.externalFileTransfer}`)
        return (
          options.importResult ?? {
            succeeded: 2,
            failed: [],
            warnings: [],
            configurationIndexPath: "/project/.nkdk/configuration-index/default.bin",
          }
        )
      },
      async writeSettings(params) {
        calls.push("writeProjectSettings")
        Object.assign(writtenSettings, params)
        return { settingsPath: "/project/.nkdk/project.yaml" }
      },
      resolveTarget({ projectDir, componentPath }) {
        calls.push(`resolveTarget ${projectDir} ${componentPath ?? "cf"}`)
        return {
          ok: true as const,
          projectDir,
          componentDir: `${projectDir}/cf`,
          componentPath: "cf",
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
    },
  }
}
