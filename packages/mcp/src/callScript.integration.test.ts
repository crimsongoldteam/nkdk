import { mkdtempSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { describe, expect, it, vi } from "vitest"

const callScript = new URL("../../../.agents/tools/mcp/call.mjs", import.meta.url)
const callScriptModule = await import(callScript.href)
const {
  callMcpToolToCompletion,
  createMcpToolSession,
  operationFailed,
  parseArgs,
  reportServerStderr,
  resolveServerLaunch,
} = callScriptModule

describe("MCP call script", () => {
  it("keeps the CLI usage contract", () => {
    expect(() => parseArgs([])).toThrow("tool name is required")
  })

  it("выбирает исходный или собранный MCP server", () => {
    expect(resolveServerLaunch("source").args).toContain("--import")
    expect(resolveServerLaunch("source").args.at(-1)).toMatch(/packages\/mcp\/src\/server\.ts$/u)
    expect(resolveServerLaunch("compiled").args).toEqual([
      expect.stringMatching(/packages\/mcp\/dist\/bin\/nkdk-mcp$/u),
    ])
    expect(parseArgs(["nkdk.get_schema", "--input", "args.json", "--compiled"]).serverMode).toBe("compiled")
  })

  it("выполняет несколько вызовов через одно MCP-соединение", async () => {
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      callTool: vi.fn().mockResolvedValue({ structuredContent: { ok: true } }),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const transport = { stderr: undefined }
    const session = await createMcpToolSession({
      serverMode: "compiled",
      createClient: () => client,
      createTransport: () => transport,
    })

    await session.call("first", { value: 1 })
    await session.call("second", { value: 2 })
    await session.close()

    expect(client.connect).toHaveBeenCalledTimes(1)
    expect(client.callTool).toHaveBeenCalledTimes(2)
    expect(client.close).toHaveBeenCalledTimes(1)
  })

  it("остаётся подключённым к реальному stdio до terminal результата", async () => {
    const projectDir = "/fixture-project"
    const session = await createMcpToolSession({
      createTransport: () => new StdioClientTransport({
        command: process.execPath,
        args: ["--input-type=module", "--eval", backgroundOperationFixtureServer],
        cwd: import.meta.dirname,
        stderr: "pipe",
      }),
    })

    try {
      await expect(callMcpToolToCompletion(
        session,
        "nkdk.validate_project",
        { projectDir },
        { pollIntervalMs: 5 }
      )).rejects.toThrow(/operation .* succeeded.*core_error/u)
    } finally {
      await session.close()
    }
  })

  it("фиксирует внутренний клиент на MCP 2026-07-28", async () => {
    const client = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const session = await createMcpToolSession({
      createClient: (options: unknown) => {
        expect(options).toEqual({ versionNegotiation: { mode: { pin: "2026-07-28" } } })
        return client
      },
      createTransport: () => ({ stderr: undefined }),
    })

    await session.close()
  })

  it("persists and prints server stderr once when an MCP call fails", async () => {
    const logPath = join(mkdtempSync(join(tmpdir(), "nkdk-mcp-stderr-")), "server.log")
    const written: string[] = []

    await reportServerStderr({
      stderr: "worker root cause\n",
      failed: true,
      debug: false,
      logPath,
      writeStderr: (text: string) => written.push(text),
    })

    expect(await readFile(logPath, "utf8")).toBe("worker root cause\n")
    expect(written).toEqual(["worker root cause\n"])
  })

  it("does not print stderr twice in debug mode", async () => {
    const written: string[] = []

    await reportServerStderr({
      stderr: "already streamed\n",
      failed: true,
      debug: true,
      writeStderr: (text: string) => written.push(text),
    })

    expect(written).toEqual([])
  })

  it("calls MCP tools without the default 60-second timeout", async () => {
    const callToolWithoutPracticalLimit = (
      callScriptModule as Record<string, unknown>
    )["callToolWithoutPracticalLimit"]
    expect(callToolWithoutPracticalLimit).toBeTypeOf("function")
    const client = { callTool: vi.fn().mockResolvedValue({}) }
    const request = { name: "nkdk.import_from_infobase", arguments: {} }

    await (
      callToolWithoutPracticalLimit as (
        clientArgument: typeof client,
        requestArgument: typeof request
      ) => Promise<unknown>
    )(client, request)

    expect(client.callTool).toHaveBeenCalledWith(request, {
      timeout: 2_147_483_647,
    })
  })

  it("не считает project_validation техническим сбоем успешной операции", () => {
    expect(operationFailed({
      ok: true,
      failed: [{ code: "project_validation", name: "cf/a.yaml", message: "invalid" }],
    })).toBe(false)

    expect(operationFailed({
      ok: true,
      failed: [
        { code: "project_validation", name: "cf/a.yaml", message: "invalid" },
        { code: "write", name: "cf/b.yaml", message: "EACCES" },
      ],
    })).toBe(true)
  })
})

const backgroundOperationFixtureServer = `
import { McpServer } from "@modelcontextprotocol/server"
import { serveStdio } from "@modelcontextprotocol/server/stdio"

const result = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload) }],
  structuredContent: payload,
})

serveStdio(() => {
  const server = new McpServer({ name: "call-script-fixture", version: "1.0.0" })
  server.registerTool("nkdk.validate_project", { description: "start" }, async () => result({
    ok: true,
    status: "accepted",
    operationId: "op-1",
    projectDir: "/fixture-project",
  }))
  server.registerTool("nkdk.get_operation", { description: "lookup" }, async () => result({
    ok: true,
    status: "succeeded",
    operationId: "op-1",
    projectDir: "/fixture-project",
    operationKind: "validate_project",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.001Z",
    messages: [],
    result: { ok: false, code: "core_error" },
  }))
  return server
}, { legacy: "serve" })
`
