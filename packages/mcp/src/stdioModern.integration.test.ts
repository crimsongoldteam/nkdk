import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { afterEach, describe, expect, it } from "vitest"

const require = createRequire(import.meta.url)
const entrypoint = fileURLToPath(new URL("./server.ts", import.meta.url))
const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const tsxLoader = require.resolve("tsx")
const openClients: Client[] = []

afterEach(async () => {
  await Promise.allSettled(openClients.splice(0).map(async (client) => client.close()))
})

describe("modern-only MCP stdio", () => {
  it("обслуживает MCP 2026-07-28 через единый набор возможностей", async () => {
    const client = new Client(
      { name: "nkdk-stdio-test", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } },
    )
    openClients.push(client)
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", tsxLoader, entrypoint],
      cwd: packageRoot,
      stderr: "pipe",
    })

    await client.connect(transport)

    expect(client.getProtocolEra()).toBe("modern")
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28")
    expect(client.getDiscoverResult()).toBeDefined()

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.get_schema")

    const schema = await client.callTool({
      name: "nkdk.get_schema",
      arguments: {
        projectDir: packageRoot,
        metadataRef: "InputField",
      },
    })
    expect(schema.isError).not.toBe(true)

    const resource = await client.readResource({ uri: "nkdk://guides/config-edit-yaml" })
    expect(resource.contents[0]).toMatchObject({ uri: "nkdk://guides/config-edit-yaml", mimeType: "text/markdown" })

    const prompt = await client.getPrompt({ name: "nkdk_config_edit_yaml" })
    expect(prompt.messages[0]?.role).toBe("user")
  })

  it("отклоняет legacy initialize без fallback", async () => {
    const child = spawn(process.execPath, ["--import", tsxLoader, entrypoint], {
      cwd: packageRoot,
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

      const response = JSON.parse(await readLine(child.stdout)) as Record<string, unknown>
      expect(response).toHaveProperty("error")
      expect(response).not.toHaveProperty("result")
    } finally {
      child.stdin.end()
      child.kill()
    }
  })
})

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
