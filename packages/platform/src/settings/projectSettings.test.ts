import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "../sessions/errors"
import {
  normalizePlatformConnectionSettings,
  parseProjectSettings,
  readProjectSettings,
  writeProjectSettings,
  type ProjectSettingsFileSystem,
} from "./projectSettings"

describe("project platform settings", () => {
  it("applies defaults and permits a file connection without a user", () => {
    expect(
      parseProjectSettings(`
version: 1
infobase:
  connectionString: 'File="/Users/nikita/Базы 1С/all";'
`)
    ).toEqual({
      version: 1,
      infobase: {
        connectionString: 'File="/Users/nikita/Базы 1С/all";',
        useStandaloneServer: false,
        sessionIdleTimeout: 900,
      },
    })
  })

  it("accepts database credentials for an offline client-server connection", () => {
    expect(
      parseProjectSettings(`
version: 1
infobase:
  connectionString: 'Srvr="cluster";Ref="production";'
  useStandaloneServer: true
  database:
    dbms: PostgreSQL
    server: db.example.local
    name: production
    user: dbuser
    password: dbsecret
`)
    ).toEqual({
      version: 1,
      infobase: {
        connectionString: 'Srvr="cluster";Ref="production";',
        useStandaloneServer: true,
        sessionIdleTimeout: 900,
        database: {
          dbms: "PostgreSQL",
          server: "db.example.local",
          name: "production",
          user: "dbuser",
          password: "dbsecret",
        },
      },
    })
  })

  it.each(["MSSQLServer", "PostgreSQL", "IBMDB2", "OracleDatabase"] as const)(
    "accepts the supported %s DBMS",
    (dbms) => {
      expect(
        normalizePlatformConnectionSettings({
          connectionString: 'Srvr="cluster";Ref="production";',
          useStandaloneServer: true,
          database: {
            dbms,
            server: "db",
            name: "base",
            user: "dbuser",
          },
        }).database?.dbms
      ).toBe(dbms)
    }
  )

  it.each([
    ["version: 2\ninfobase:\n  connectionString: 'File=\"/bases/test\";'", "version"],
    ["version: 1\ninfobase:\n  connectionString: 'ws=\"https://example.test\";'", "connection"],
    ["version: 1\ninfobase:\n  connectionString: 'Foo=\"bar\";'", "connection"],
    ["version: 1\ninfobase:\n  connectionString: 'File=\"/bases/test\";'\n  sessionIdleTimeout: 0", "timeout"],
    ["version: 1\ninfobase:\n  connectionString: 'File=\"/bases/test\";'\n  sessionIdleTimeout: 1.5", "timeout"],
    [
      "version: 1\ninfobase:\n  connectionString: 'Srvr=\"server\";Ref=\"base\";'\n  useStandaloneServer: true",
      "standalone server connection without database credentials",
    ],
    [
      "version: 1\ninfobase:\n  connectionString: 'File=\"/bases/test\";'\n  database:\n    dbms: PostgreSQL\n    server: db\n    name: base\n    user: dbuser",
      "database credentials for a file connection",
    ],
    [
      "version: 1\ninfobase:\n  connectionString: 'Srvr=\"server\";Ref=\"base\";'\n  database:\n    dbms: Unsupported\n    server: db\n    name: base\n    user: dbuser",
      "DBMS",
    ],
    [
      "version: 1\ninfobase:\n  connectionString: 'Srvr=\"server\";Ref=\"base\";'\n  database:\n    dbms: PostgreSQL\n    server: db\n    name: base\n    user: dbuser\n    passwrod: secret",
      "unknown database field",
    ],
  ])("rejects invalid %s settings without exposing values", (source) => {
    expect(() => parseProjectSettings(source)).toThrowError(
      expect.objectContaining<Partial<PlatformSessionError>>({ code: "invalid_project_settings" })
    )
  })

  it("returns undefined when the settings file does not exist", async () => {
    const fileSystem = recordingFileSystem([], {
      readError: Object.assign(new Error("missing"), { code: "ENOENT" }),
    })

    await expect(readProjectSettings("/project", { fileSystem, platform: "linux" })).resolves.toBeUndefined()
  })

  it("writes ignored project settings with private Unix permissions", async () => {
    const calls: string[] = []
    const writes = new Map<string, string>()
    const fileSystem = recordingFileSystem(calls, { writes })

    await expect(
      writeProjectSettings(
        {
          projectDir: "/project",
          infobase: {
            connectionString: 'File="/Users/nikita/Базы 1С/all";',
            sessionIdleTimeout: 120,
          },
        },
        { fileSystem, platform: "darwin" }
      )
    ).resolves.toEqual({ settingsPath: "/project/.nkdk/project.yaml" })

    expect(calls).toEqual([
      "mkdir /project/.nkdk",
      "write /project/.nkdk/.gitignore",
      "write /project/.nkdk/project.yaml mode=384",
      "chmod /project/.nkdk/project.yaml mode=384",
    ])
    expect(writes.get("/project/.nkdk/.gitignore")).toBe("*\n!.gitignore\n")
    expect(parseProjectSettings(writes.get("/project/.nkdk/project.yaml") ?? "")).toEqual({
      version: 1,
      infobase: {
        connectionString: 'File="/Users/nikita/Базы 1С/all";',
        useStandaloneServer: false,
        sessionIdleTimeout: 120,
      },
    })
  })

  it("never exposes a password through validation or write errors", async () => {
    const password = "secret-password"
    const fileSystem = recordingFileSystem([], { writeError: new Error(`write failed: ${password}`) })

    await expect(
      writeProjectSettings(
        {
          projectDir: "/project",
          infobase: {
            connectionString: 'File="/bases/test";',
            password,
          },
        },
        { fileSystem, platform: "linux" }
      )
    ).rejects.not.toThrow(password)
  })

  it("never exposes a database password through validation errors", () => {
    const password = "database-secret"

    expect(() =>
      normalizePlatformConnectionSettings({
        connectionString: 'File="/bases/test";',
        database: {
          dbms: "PostgreSQL",
          server: "db",
          name: "base",
          user: "dbuser",
          password,
        },
      })
    ).toThrowError(expect.not.stringContaining(password))
  })

  it.each([
    ["user", "admin\ncommon shutdown"],
    ["password", "secret\rcommon shutdown"],
    ["password", "secret\0common shutdown"],
  ])("rejects control characters in %s", (field, value) => {
    expect(() =>
      normalizePlatformConnectionSettings({
        connectionString: 'Srvr="server";Ref="base";',
        [field]: value,
      })
    ).toThrowError(
      expect.objectContaining<Partial<PlatformSessionError>>({
        code: "invalid_project_settings",
      })
    )
  })

  it.each([
    ["server", ""],
    ["name", "base\n--database-password=exposed"],
    ["user", "dbuser\0--database-name=other"],
    ["password", "secret\r--database-user=other"],
  ])("rejects an invalid database %s", (field, value) => {
    expect(() =>
      normalizePlatformConnectionSettings({
        connectionString: 'Srvr="server";Ref="base";',
        useStandaloneServer: true,
        database: {
          dbms: "PostgreSQL",
          server: "db",
          name: "base",
          user: "dbuser",
          [field]: value,
        },
      })
    ).toThrowError(
      expect.objectContaining<Partial<PlatformSessionError>>({
        code: "invalid_project_settings",
      })
    )
  })
})

function recordingFileSystem(
  calls: string[],
  options: {
    writes?: Map<string, string>
    readError?: Error
    writeError?: Error
  } = {}
): ProjectSettingsFileSystem {
  return {
    async readFile(): Promise<string> {
      if (options.readError !== undefined) throw options.readError
      return ""
    },
    async mkdir(path): Promise<void> {
      calls.push(`mkdir ${path}`)
    },
    async writeFile(path, content, writeOptions): Promise<void> {
      calls.push(`write ${path}${writeOptions?.mode === undefined ? "" : ` mode=${writeOptions.mode}`}`)
      options.writes?.set(path, content)
      if (options.writeError !== undefined) throw options.writeError
    },
    async chmod(path, mode): Promise<void> {
      calls.push(`chmod ${path} mode=${mode}`)
    },
  }
}
