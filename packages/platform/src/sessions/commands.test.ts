import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "./errors"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
  buildStandaloneConfigExport,
  buildStandaloneConfigInit,
  buildStandaloneListExtensions,
  buildStandaloneLaunch,
} from "./commands"

describe("platform session commands", () => {
  it.each([
    ["/opt/1cv8/8.3.27.2214/1cv8", "/bases/demo"],
    ["/Applications/1C Enterprise/1cv8", "/Users/test/Base with spaces"],
    ["C:\\Program Files\\1cv8.exe", "C:\\Базы 1С\\demo"],
  ])("builds a file Designer agent launch without a shell: %s", (enterprisePath, databasePath) => {
    expect(
      buildDesignerAgentLaunch({
        enterprisePath,
        connection: { type: "file", path: databasePath },
        hostKeyPath: "/project/.nkdk/platform-sessions/agent/host.key",
        baseDir: "/project/.nkdk/platform/agent",
        logPath: "/project/.nkdk/platform/agent/process.log",
        port: 58248,
      })
    ).toEqual({
      command: enterprisePath,
      args: [
        "DESIGNER",
        `/F${databasePath}`,
        "/AgentMode",
        "/AgentSSHHostKey",
        "/project/.nkdk/platform-sessions/agent/host.key",
        "/AgentBaseDir",
        "/project/.nkdk/platform/agent",
        "/AppAutoCheckVersion-",
        "/AgentPort",
        "58248",
        "/Out",
        "/project/.nkdk/platform/agent/process.log",
        "-NoTruncate",
      ],
    })
  })

  it("builds a client-server Designer connection", () => {
    expect(
      buildDesignerAgentLaunch({
        enterprisePath: "1cv8",
        connection: { type: "server", server: "server", reference: "reference" },
        hostKeyPath: "/agent/host.key",
        baseDir: "/agent",
        logPath: "/agent/process.log",
        port: 1543,
      }).args[1]
    ).toBe("/Sserver\\reference")
  })

  it("builds standalone process arguments as arrays", () => {
    expect(buildStandaloneConfigInit({ ibcmdPath: "ibcmd", databasePath: "/bases/demo" })).toEqual({
      command: "ibcmd",
      args: ["server", "config", "init", "--database-path=/bases/demo"],
    })
    expect(
      buildStandaloneLaunch({
        ibsrvPath: "ibsrv",
        dataDir: "/session/data",
        sessionDataDir: "/session/runtime",
        configPath: "/session/config.yaml",
      })
    ).toEqual({
      command: "ibsrv",
      args: [
        "--data",
        "/session/data",
        "--session-data",
        "/session/runtime",
        "--config",
        "/session/config.yaml",
      ],
    })
  })

  it("builds offline client-server ibcmd arguments without a shell", () => {
    expect(
      buildStandaloneConfigInit({
        ibcmdPath: "ibcmd",
        database: {
          dbms: "PostgreSQL",
          server: "db.example.local",
          name: "production",
          user: "dbuser",
          password: "dbsecret",
        },
      })
    ).toEqual({
      command: "ibcmd",
      args: [
        "server",
        "config",
        "init",
        "--dbms=PostgreSQL",
        "--database-server=db.example.local",
        "--database-name=production",
        "--database-user=dbuser",
        "--database-password=dbsecret",
      ],
    })
  })

  it("omits an absent database password from ibcmd arguments", () => {
    expect(
      buildStandaloneConfigInit({
        ibcmdPath: "ibcmd",
        database: {
          dbms: "PostgreSQL",
          server: "db.example.local",
          name: "production",
          user: "dbuser",
        },
      }).args
    ).not.toContain(expect.stringContaining("--database-password"))
  })

  it("omits MSSQL credentials when OS authentication is selected", () => {
    const args = buildStandaloneConfigInit({
      ibcmdPath: "ibcmd",
      database: {
        dbms: "MSSQLServer",
        server: "db.example.local",
        name: "production",
      },
    }).args

    expect(args).not.toContain(expect.stringContaining("--database-user"))
    expect(args).not.toContain(expect.stringContaining("--database-password"))
  })

  it.each([
    ["include", false],
    ["omit", true],
  ] as const)("maps unresolved references %s", (value, expectedFlag) => {
    const designer = buildDumpConfigurationCommand("/xml", value)
    const standalone = buildStandaloneConfigExport({
      ibcmdPath: "ibcmd",
      configPath: "/session/config.yaml",
      outputDir: "/xml",
      unresolvedReferences: value,
    }).args

    expect(designer.includes("--ignore-unresolved-refs")).toBe(expectedFlag)
    expect(standalone.includes("--ignore-unresolved-refs")).toBe(expectedFlag)
  })

  it("quotes a dump directory for the interactive 1C shell", () => {
    expect(buildDumpConfigurationCommand("/project/.nkdk/tmp/op/xml", "include")).toBe(
      'config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical'
    )
    expect(buildDumpConfigurationCommand('/project/a"b', "include")).toContain('--dir="/project/a""b"')
  })

  it("builds list extension commands for both platform modes", () => {
    expect(buildListDesignerExtensionsCommand()).toBe(
      "config extensions properties get --all-extensions"
    )
    expect(
      buildStandaloneListExtensions({
        ibcmdPath: "ibcmd",
        configPath: "/session/config.yaml",
        user: "Admin",
        password: "secret",
      })
    ).toEqual({
      command: "ibcmd",
      args: [
        "infobase",
        "config",
        "extension",
        "list",
        "--user=Admin",
        "--password=secret",
        "--config=/session/config.yaml",
      ],
    })
  })

  it("omits absent infobase credentials from extension list arguments", () => {
    expect(
      buildStandaloneListExtensions({
        ibcmdPath: "ibcmd",
        configPath: "/session/config.yaml",
      }).args
    ).toEqual([
      "infobase",
      "config",
      "extension",
      "list",
      "--config=/session/config.yaml",
    ])
  })

  it.each(["/project/a\nb", "/project/a\0b"])("rejects unsafe interactive values", (path) => {
    expect(() => buildDumpConfigurationCommand(path, "include")).toThrowError(
      expect.objectContaining<Partial<PlatformSessionError>>({ code: "platform_command_failed" })
    )
  })

  it("rejects web and unknown connections", () => {
    const common = {
      enterprisePath: "1cv8",
      hostKeyPath: "/agent/host.key",
      baseDir: "/agent",
      logPath: "/agent/process.log",
      port: 1543,
    }
    expect(() =>
      buildDesignerAgentLaunch({ ...common, connection: { type: "web", url: "https://example.test" } })
    ).toThrowError(expect.objectContaining<Partial<PlatformSessionError>>({ code: "unsupported_connection" }))
    expect(() =>
      buildDesignerAgentLaunch({ ...common, connection: { type: "unknown", raw: "x" } })
    ).toThrowError(expect.objectContaining<Partial<PlatformSessionError>>({ code: "unsupported_connection" }))
  })
})
