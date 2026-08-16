import { spawn } from "node:child_process"
import { beforeAll, describe, expect, it } from "vitest"
import { mcpSourceLaunch } from "./mcpSourceTestLaunch"

let legacyResponse: Record<string, unknown>

beforeAll(async () => {
  legacyResponse = await requestLegacyInitialize()
})

describe("modern-only MCP stdio", () => {
  it("отклоняет legacy initialize без fallback", () => {
    expect(legacyResponse).toHaveProperty("error")
    expect(legacyResponse).not.toHaveProperty("result")
  })
})

async function requestLegacyInitialize(): Promise<Record<string, unknown>> {
  const child = spawn(mcpSourceLaunch.command, [...mcpSourceLaunch.args], {
    cwd: mcpSourceLaunch.cwd,
    stdio: ["pipe", "pipe", "pipe"],
  })
  try {
    child.stdin.write(`${JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "legacy-test", version: "1.0.0" },
      },
    })}\n`)
    return JSON.parse(await readLine(child.stdout)) as Record<string, unknown>
  } finally {
    child.stdin.end()
    child.kill()
  }
}

function readLine(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ""
    const timeout = setTimeout(() => finish(new Error("MCP stdio response timeout")), 5_000)
    const onData = (chunk: unknown) => {
      buffer += String(chunk)
      const newline = buffer.indexOf("\n")
      if (newline >= 0) finish(undefined, buffer.slice(0, newline))
    }
    const onEnd = () => finish(new Error("MCP stdio closed before response"))
    const finish = (error?: Error, line?: string) => {
      clearTimeout(timeout)
      stream.removeListener("data", onData)
      stream.removeListener("end", onEnd)
      if (error !== undefined) reject(error)
      else resolve(line ?? "")
    }
    stream.on("data", onData)
    stream.once("end", onEnd)
  })
}
