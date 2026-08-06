import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { recordedPath } from "../testing/recordedPath"
import {
  parseProjectSettingsYaml,
  readProjectSettings,
  validateProjectSettings,
  type ProjectSettingsFileSystem,
} from "./projectSettings"

const fileInfobase = {
  connectionString: 'File="/bases/demo";',
  operations: { import: { mode: "designer-agent" } },
}

const settingsWithDefaults = validateProjectSettings(parseProjectSettingsYaml(`
infobase:
  connectionString: 'File="/bases/demo";'
  operations:
    import:
      mode: designer-agent
`))

describe("project settings validation", () => {
  it("applies import defaults", () => {
    expect(settingsWithDefaults).toEqual({
      ok: true,
      settings: {
        infobase: {
          connectionString: 'File="/bases/demo";',
          sessionIdleTimeout: 900,
          operations: {
            import: {
              mode: "designer-agent",
              unresolvedReferences: "include",
            },
          },
        },
      },
    })
  })

  it.each([
    ["version", { version: 1, infobase: fileInfobase }, "version"],
    ["legacy mode", { infobase: { ...fileInfobase, useStandaloneServer: true } }, "infobase.useStandaloneServer"],
    ["missing mode", { infobase: { connectionString: 'File="/bases/demo";', operations: { import: {} } } }, "infobase.operations.import.mode"],
  ])("rejects %s", (_name, value, path) => {
    expectInvalidSettingsAt(value, path)
  })

  it("permits MSSQL OS authentication for a standalone server", () => {
    expect(validateProjectSettings({
      infobase: {
        connectionString: 'Srvr="cluster";Ref="base";',
        database: { dbms: "MSSQLServer", server: "db", name: "base" },
        operations: { import: { mode: "standalone-server" } },
      },
    })).toMatchObject({ ok: true })
  })

  it.each([
    [
      "PostgreSQL without credentials",
      {
        infobase: {
          connectionString: 'Srvr="cluster";Ref="base";',
          database: { dbms: "PostgreSQL", server: "db", name: "base" },
          operations: { import: { mode: "standalone-server" } },
        },
      },
      "infobase.database.user",
    ],
    [
      "a password without a user",
      {
        infobase: {
          connectionString: 'Srvr="cluster";Ref="base";',
          database: { dbms: "MSSQLServer", server: "db", name: "base", password: "db-password" },
          operations: { import: { mode: "standalone-server" } },
        },
      },
      "infobase.database.user",
    ],
    [
      "database settings for a file infobase",
      {
        infobase: {
          ...fileInfobase,
          database: { dbms: "PostgreSQL", server: "db", name: "base", user: "dbuser" },
        },
      },
      "infobase.database",
    ],
    [
      "a standalone server database without DBMS settings",
      {
        infobase: {
          connectionString: 'Srvr="cluster";Ref="base";',
          operations: { import: { mode: "standalone-server" } },
        },
      },
      "infobase.database",
    ],
  ])("rejects %s", (_name, value, path) => {
    expectInvalidSettingsAt(value, path)
  })
})

function expectInvalidSettingsAt(value: unknown, path: string): void {
  expect(validateProjectSettings(value)).toMatchObject({
    ok: false,
    diagnostics: expect.arrayContaining([expect.objectContaining({ code: expect.any(String), path })]),
  })
}

describe("project settings file", () => {
  it("canonicalizes, secures and reads the settings file in order", async () => {
    const calls: string[] = []
    const fileSystem = recordingFileSystem(calls, { source: validSource })

    await expect(readProjectSettings("/alias", { fileSystem, platform: "darwin" })).resolves.toMatchObject({
      status: "ready",
      projectDir: "/project",
      settingsPath: join("/project", ".nkdk", "project.yaml"),
    })
    expect(calls).toEqual([
      "realpath /alias",
      "chmod /project/.nkdk/project.yaml mode=384",
      "read /project/.nkdk/project.yaml",
    ])
  })

  it("returns missing when the settings file does not exist", async () => {
    const missing = Object.assign(new Error("missing secret"), { code: "ENOENT" })
    const result = await readProjectSettings("/project", {
      fileSystem: recordingFileSystem([], { chmodError: missing }),
      platform: "linux",
    })
    expect(result).toEqual({
      status: "missing",
      projectDir: "/project",
      settingsPath: join("/project", ".nkdk", "project.yaml"),
    })
  })

  it.each([
    ["invalid YAML", { source: "infobase: [" }],
    ["invalid structure", { source: "infobase: {}" }],
    ["chmod failure", { chmodError: new Error("permission secret") }],
  ])("returns safe diagnostics for %s", async (_name, options) => {
    const result = await readProjectSettings("/project", {
      fileSystem: recordingFileSystem([], options),
      platform: "linux",
    })
    expect(result).toMatchObject({
      status: "invalid",
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: expect.any(String), path: expect.any(String), message: expect.any(String) }),
      ]),
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })

  it("uses the root path for invalid YAML", async () => {
    const result = await readProjectSettings("/project", {
      fileSystem: recordingFileSystem([], { source: "infobase: [" }),
      platform: "win32",
    })
    expect(result).toMatchObject({
      status: "invalid",
      diagnostics: [expect.objectContaining({ path: "$" })],
    })
  })

  it("does not change ACL on Windows", async () => {
    const calls: string[] = []
    await readProjectSettings("/project", {
      fileSystem: recordingFileSystem(calls, { source: validSource }),
      platform: "win32",
    })
    expect(calls).toEqual([
      "realpath /project",
      "read /project/.nkdk/project.yaml",
    ])
  })
})

const validSource = `
infobase:
  connectionString: 'File="/bases/demo";'
  operations:
    import:
      mode: designer-agent
`

function recordingFileSystem(
  calls: string[],
  options: { source?: string; chmodError?: Error } = {}
): ProjectSettingsFileSystem {
  return {
    async realpath(path) {
      calls.push(`realpath ${recordedPath(path)}`)
      return path === "/alias" ? "/project" : path
    },
    async chmod(path, mode) {
      calls.push(`chmod ${recordedPath(path)} mode=${mode}`)
      if (options.chmodError !== undefined) throw options.chmodError
    },
    async readFile(path) {
      calls.push(`read ${recordedPath(path)}`)
      return options.source ?? validSource
    },
  }
}
