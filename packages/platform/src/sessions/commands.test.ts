import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "./errors"
import {
  buildDesignerAgentLaunch,
  buildDumpConfigurationCommand,
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

  it("quotes a dump directory for the interactive 1C shell", () => {
    expect(buildDumpConfigurationCommand("/project/.nkdk/tmp/op/xml")).toBe(
      'config dump-config-to-files --dir="/project/.nkdk/tmp/op/xml" --format=hierarchical'
    )
    expect(buildDumpConfigurationCommand('/project/a"b')).toContain('--dir="/project/a""b"')
  })

  it.each(["/project/a\nb", "/project/a\0b"])("rejects unsafe interactive values", (path) => {
    expect(() => buildDumpConfigurationCommand(path)).toThrowError(
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
