import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { mcpSourceLaunch } from "./mcpSourceTestLaunch"

let client: Client

beforeAll(async () => {
  client = await connectModernClient()
})

afterAll(async () => {
  await client.close()
})

describe("modern-only MCP stdio", () => {
  it("обслуживает MCP 2026-07-28", () => {
    expect(client.getProtocolEra()).toBe("modern")
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28")
    expect(client.getDiscoverResult()).toBeDefined()
  })
})

async function connectModernClient(): Promise<Client> {
  const connected = new Client(
    { name: "nkdk-stdio-test", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  )
  await connected.connect(new StdioClientTransport({
    ...mcpSourceLaunch,
    stderr: "pipe",
  }))
  return connected
}
