import { describe, expect, it } from "vitest"
import { createNkdkMcpHttpHandler } from "./httpServer"

describe("локальный MCP HTTP", () => {
  it.each([
    ["wrong path", request("http://127.0.0.1:3000/other"), 404],
    ["wrong method", request("http://127.0.0.1:3000/mcp", { method: "GET" }), 405],
    ["remote host", request("http://evil.test/mcp", { headers: baseHeaders({ host: "evil.test" }) }), 400],
    ["wrong port", request("http://127.0.0.1:3001/mcp", { headers: baseHeaders({ host: "127.0.0.1:3001" }) }), 400],
    ["remote origin", request("http://127.0.0.1:3000/mcp", { headers: baseHeaders({ origin: "https://evil.test" }) }), 403],
    ["wrong content type", request("http://127.0.0.1:3000/mcp", { headers: baseHeaders({ "content-type": "text/plain" }) }), 415],
  ])("отклоняет %s", async (_name, httpRequest, status) => {
    const handler = createNkdkMcpHttpHandler(3000)
    try {
      expect((await handler.fetch(httpRequest)).status).toBe(status)
    } finally {
      await handler.close()
    }
  })

  it.each([undefined, "http://127.0.0.1:3000", "http://localhost:3000"])(
    "пропускает локальный Origin %s до протокольной проверки",
    async (origin) => {
      const handler = createNkdkMcpHttpHandler(3000)
      const headers = baseHeaders(origin === undefined ? {} : { origin })
      try {
        const response = await handler.fetch(request("http://127.0.0.1:3000/mcp", { headers }))
        expect(response.status).not.toBe(403)
        expect(response.headers.has("access-control-allow-origin")).toBe(false)
      } finally {
        await handler.close()
      }
    },
  )
})

function request(url: string, init: RequestInit = {}): Request {
  const method = init.method ?? "POST"
  return new Request(url, {
    method,
    body: method === "GET" || method === "HEAD" ? undefined : "{}",
    ...init,
    headers: init.headers ?? baseHeaders(),
  })
}

function baseHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    host: "127.0.0.1:3000",
    "content-type": "application/json",
    ...overrides,
  })
}
