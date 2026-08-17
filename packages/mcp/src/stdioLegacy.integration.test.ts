import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { mcpSourceLaunch } from "./mcpSourceTestLaunch"

let client: Client

beforeAll(async () => {
  client = new Client(
    { name: "nkdk-legacy-stdio-test", version: "1.0.0" },
    {
      supportedProtocolVersions: ["2025-06-18"],
      versionNegotiation: { mode: "legacy" },
    },
  )
  await client.connect(new StdioClientTransport({ ...mcpSourceLaunch, stderr: "pipe" }))
})

afterAll(async () => {
  await client.close()
})

describe("MCP stdio legacy compatibility", () => {
  it("обслуживает Codex-протокол 2025-06-18", async () => {
    expect(client.getProtocolEra()).toBe("legacy")
    expect(client.getNegotiatedProtocolVersion()).toBe("2025-06-18")

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.list_infobases")
  })
})
