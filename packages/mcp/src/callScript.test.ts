import { execFile } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const callScript = new URL("../../../.agents/tools/mcp/call.mjs", import.meta.url)
const { reportServerStderr } = await import(callScript.href)

describe("MCP call script", () => {
  it("keeps the CLI usage contract", async () => {
    await expect(execFileAsync(process.execPath, [fileURLToPath(callScript)])).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining("tool name is required"),
    })
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
})
