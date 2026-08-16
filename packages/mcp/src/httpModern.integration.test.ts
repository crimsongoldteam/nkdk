import { Client, StreamableHTTPClientTransport, type FetchLike } from "@modelcontextprotocol/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createNkdkMcpHttpHandler } from "./httpServer"

const port = 3000
const endpoint = new URL(`http://127.0.0.1:${port}/mcp`)
const handler = createNkdkMcpHttpHandler(port)
let client: Client
let readOnlyResult: Awaited<ReturnType<Client["callTool"]>>
let confirmationResult: Awaited<ReturnType<Client["callTool"]>>

beforeAll(async () => {
  client = new Client(
    { name: "nkdk-http-test", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  )
  await client.connect(new StreamableHTTPClientTransport(endpoint, { fetch: inProcessFetch(handler.fetch) }))
  readOnlyResult = await client.callTool({ name: "nkdk.list_infobases", arguments: {} })
  confirmationResult = await client.callTool({
    name: "nkdk.import_from_infobase",
    arguments: { projectDir: "/project" },
  })
})

afterAll(async () => {
  await Promise.allSettled([client.close(), handler.close()])
})

describe("modern-only MCP HTTP", () => {
  it("обслуживает MCP 2026-07-28 stateless-запросами", async () => {
    expect(client.getProtocolEra()).toBe("modern")
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28")

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toContain("nkdk.list_infobases")
    expect(tools).toMatchObject({ ttlMs: 0, cacheScope: "private" })
  })

  it("вызывает read-only tool", () => {
    expect(readOnlyResult.isError).not.toBe(true)
  })

  it("требует подтверждение записи", () => {
    expect(confirmationResult.structuredContent).toMatchObject({ ok: false, code: "confirmation_required" })
  })

  it("читает resource с безопасными cache hints", async () => {
    const resource = await client.readResource({ uri: "nkdk://guides/config-edit-yaml" })
    expect(resource).toMatchObject({ ttlMs: 0, cacheScope: "private" })
    expect(resource.contents[0]).toMatchObject({ uri: "nkdk://guides/config-edit-yaml" })
  })

  it("получает prompt", async () => {
    const prompt = await client.getPrompt({ name: "nkdk_config_edit_yaml" })
    expect(prompt.messages[0]?.role).toBe("user")
  })

  it("возвращает протокольную ошибку при конфликте standard MCP headers", async () => {
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
