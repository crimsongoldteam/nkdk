import { describe, expect, it } from "vitest"
import { McpCliUsageError, parseMcpCli } from "./cli"

describe("MCP CLI", () => {
  it.each([
    [[], { mode: "stdio", watch: false, worker: false }],
    [["--watch"], { mode: "stdio", watch: true, worker: false }],
    [["--worker"], { mode: "stdio", watch: false, worker: true }],
    [["--http"], { mode: "http", port: 3000 }],
    [["--http", "--port", "3210"], { mode: "http", port: 3210 }],
    [["--port", "3210", "--http"], { mode: "http", port: 3210 }],
  ] as const)("разбирает %j", (argv, expected) => {
    expect(parseMcpCli([...argv])).toEqual(expected)
  })

  it.each([
    ["unknown", ["--unknown"]],
    ["repeated http", ["--http", "--http"]],
    ["repeated watch", ["--watch", "--watch"]],
    ["repeated port", ["--http", "--port", "3000", "--port", "3001"]],
    ["port without HTTP", ["--port", "3000"]],
    ["missing port", ["--http", "--port"]],
    ["zero port", ["--http", "--port", "0"]],
    ["large port", ["--http", "--port", "65536"]],
    ["fractional port", ["--http", "--port", "3.5"]],
    ["negative port", ["--http", "--port", "-1"]],
    ["HTTP watch", ["--http", "--watch"]],
    ["worker watch", ["--worker", "--watch"]],
    ["worker HTTP", ["--worker", "--http"]],
  ])("отклоняет %s", (_name, argv) => {
    expect(() => parseMcpCli(argv)).toThrow(McpCliUsageError)
    try {
      parseMcpCli(argv)
    } catch (error) {
      expect(error).toMatchObject({ exitCode: 2 })
    }
  })
})
