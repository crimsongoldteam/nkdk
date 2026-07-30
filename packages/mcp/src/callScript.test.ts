import { mkdtempSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

const callScript = new URL("../../../.agents/tools/mcp/call.mjs", import.meta.url)
const callScriptModule = await import(callScript.href)
const { parseArgs, reportServerStderr } = callScriptModule

describe("MCP call script", () => {
  it("keeps the CLI usage contract", () => {
    expect(() => parseArgs([])).toThrow("tool name is required")
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

    expect(client.callTool).toHaveBeenCalledWith(request, undefined, {
      timeout: 2_147_483_647,
    })
  })
})
