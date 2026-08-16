import { Client, StreamableHTTPClientTransport, type FetchLike } from "@modelcontextprotocol/client"
import { afterEach, describe, expect, it } from "vitest"
import { createNkdkMcpHttpHandler } from "./httpServer"

const port = 3000
const endpoint = new URL(`http://127.0.0.1:${port}/mcp`)
const open: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.allSettled(open.splice(0).map(async (close) => close()))
})

describe("modern-only MCP HTTP", () => {
  it("обслуживает MCP 2026-07-28 stateless-запросами", async () => {
    const handler = createNkdkMcpHttpHandler(port)
    open.push(handler.close)
    const client = new Client(
      { name: "nkdk-http-test", version: "1.0.0" },
      { versionNegotiation: { mode: { pin: "2026-07-28" } } },
    )
    open.push(async () => client.close())
    const transport = new StreamableHTTPClientTransport(endpoint, { fetch: inProcessFetch(handler.fetch) })

    await client.connect(transport)

    expect(client.getProtocolEra()).toBe("modern")
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28")

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.list_infobases")
    expect(tools).toMatchObject({ ttlMs: 0, cacheScope: "private" })

    const readOnly = await client.callTool({ name: "nkdk.list_infobases", arguments: {} })
    expect(readOnly.isError).not.toBe(true)

    const confirmation = await client.callTool({
      name: "nkdk.import_from_infobase",
      arguments: { projectDir: "/project" },
    })
    expect(confirmation.structuredContent).toMatchObject({ ok: false, code: "confirmation_required" })

    const resource = await client.readResource({ uri: "nkdk://guides/config-edit-yaml" })
    expect(resource).toMatchObject({ ttlMs: 0, cacheScope: "private" })
    expect(resource.contents[0]).toMatchObject({ uri: "nkdk://guides/config-edit-yaml" })

    const prompt = await client.getPrompt({ name: "nkdk_config_edit_yaml" })
    expect(prompt.messages[0]?.role).toBe("user")
  })

  it("возвращает протокольную ошибку при конфликте standard MCP headers", async () => {
    const handler = createNkdkMcpHttpHandler(port)
    open.push(handler.close)
    const response = await handler.fetch(new Request(endpoint, {
      method: "POST",
      headers: {
        host: `127.0.0.1:${port}`,
        "content-type": "application/json",
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": "tools/list",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "server/discover",
        params: {
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientInfo": { name: "header-test", version: "1" },
            "io.modelcontextprotocol/clientCapabilities": {},
          },
        },
      }),
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: expect.any(Number) } })
  })
})

function inProcessFetch(fetchHandler: (request: Request) => Promise<Response>): FetchLike {
  return async (input, init) => {
    const request = new Request(input, init)
    const headers = new Headers(request.headers)
    headers.set("host", `${endpoint.hostname}:${endpoint.port}`)
    return fetchHandler(new Request(request, { headers }))
  }
}
