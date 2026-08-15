import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "./errors"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
  buildListDesignerExtensionsCommand,
  buildLoadPartialConfigurationCommand,
  classifyPartialLoad,
  buildStandaloneConfigInit,
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

  it("does not pass infobase credentials to the Designer process", () => {
    const args = buildDesignerAgentLaunch({
      enterprisePath: "1cv8",
      connection: { type: "file", path: "/bases/demo" },
      hostKeyPath: "/agent/host.key",
      baseDir: "/agent",
      logPath: "/agent/process.log",
      port: 1543,
    }).args
    expect(args).not.toContain(expect.stringMatching(/^\/N/u))
    expect(args).not.toContain(expect.stringMatching(/^\/P/u))
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
    const command = buildDumpConfigurationCommand("/xml", value)

    expect(command.includes("--ignore-unresolved-refs")).toBe(expectedFlag)
  })

  it("selects one extension for interactive export", () => {
    expect(buildDumpConfigurationCommand("/xml", "include", "Расширение_All")).toBe(
      'config dump-config-to-files --dir="/xml" --format=hierarchical --extension="Расширение_All"'
    )
  })

  it("quotes a dump directory for the interactive 1C shell", () => {
    expect(buildDumpConfigurationCommand("/project/.nkdk/tmp/op/xml", "include")).toBe(
      'config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical'
    )
    expect(buildDumpConfigurationCommand('/project/a"b', "include")).toContain('--dir="/project/a""b"')
  })

  it("builds the interactive extension list command", () => {
    expect(buildListDesignerExtensionsCommand()).toBe(
      "config extensions properties get --all-extensions"
    )
  })

  it.each([
    [["Catalogs/Test/Ext/ObjectModule.bsl"], "partial"],
    [["CommonModules/Test/Ext/Module.bsl", "Catalogs/Test/Ext/ObjectModule.bsl"], "partial"],
    [["Catalogs/Test.xml"], "selected"],
    [["Catalogs/Test.xml", "Catalogs/Test/Ext/ObjectModule.bsl"], "selected"],
    [[], "selected"],
  ] as const)("classifies %j as %s load", (loadTargets, expected) => {
    expect(classifyPartialLoad(loadTargets)).toBe(expected)
  })

  it("builds a selected or module-only configuration load command", () => {
    expect(
      buildLoadPartialConfigurationCommand({
        stagingDir: "staging",
        loadMode: "selected",
        updateDumpInfo: true,
      })
    ).toBe(
      'config load-files --dir="staging" --archive="package.zip" --no-check --list-file="staging/load.lst" --update-config-dump-info'
    )
    expect(
      buildLoadPartialConfigurationCommand({
        stagingDir: 'staging"dir',
        loadMode: "partial",
        extensionName: 'Расширение "Тест"',
        updateDumpInfo: true,
      })
    ).toBe(
      'config load-files --dir="staging""dir" --archive="package.zip" --no-check --list-file="staging""dir/load.lst" --partial --update-config-dump-info --extension="Расширение ""Тест"""'
    )
  })

  it.each([
    ["/project/a\nb", undefined],
    ["/project/a\0b", undefined],
    ["/project/xml", "Расширение\nb"],
    ["/project/xml", "Расширение\0b"],
  ])("rejects unsafe interactive values", (path, extensionName) => {
    expect(() => buildDumpConfigurationCommand(path, "include", extensionName)).toThrowError(
      expect.objectContaining<Partial<PlatformSessionError>>({ code: "platform_command_failed" })
    )
  })

  it.each([
    { stagingDir: "staging\0dir", loadMode: "selected" as const },
    { stagingDir: "staging\ndir", loadMode: "selected" as const },
    { stagingDir: "staging\rdir", loadMode: "selected" as const },
    { stagingDir: "staging", loadMode: "selected" as const, extensionName: "Расширение\0" },
    { stagingDir: "staging", loadMode: "selected" as const, extensionName: "Расширение\n" },
    { stagingDir: "staging", loadMode: "selected" as const, extensionName: "Расширение\r" },
  ])("rejects unsafe partial load command values", (params) => {
    expect(() => buildLoadPartialConfigurationCommand(params)).toThrowError(
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
