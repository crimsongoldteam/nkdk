import { createServer, type Server as HttpServer } from "node:http"
import { createMcpHandler, type McpHttpHandler, type McpServerFactory } from "@modelcontextprotocol/server"
import { toNodeHandler } from "@modelcontextprotocol/node"
import { createNkdkMcpServer } from "./mcpServer"

const LOOPBACK_HOST = "127.0.0.1"

export function createNkdkMcpHttpHandler(
  port: number,
  factory: McpServerFactory = createNkdkMcpServer,
): McpHttpHandler {
  const mcp = createMcpHandler(factory, { legacy: "reject" })
  return {
    fetch: async (request, options) => {
      const rejection = validateLocalRequest(request, port)
      return rejection ?? mcp.fetch(request, options)
    },
    close: mcp.close,
    notify: mcp.notify,
    bus: mcp.bus,
  }
}

export async function runHttpServer(options: {
  readonly port: number
  readonly onerror?: (error: Error) => void
}): Promise<{ readonly address: string; close(): Promise<void> }> {
  const handler = createNkdkMcpHttpHandler(options.port)
  const nodeHandler = toNodeHandler(handler, { onerror: options.onerror })
  const server = createServer((request, response) => {
    void nodeHandler(request, response).catch((error: unknown) => {
      options.onerror?.(asError(error))
      if (!response.headersSent) response.writeHead(500)
      response.end()
    })
  })

  try {
    await listen(server, options.port)
  } catch (error) {
    await handler.close()
    throw error
  }

  let closing: Promise<void> | undefined
  return {
    address: `http://${LOOPBACK_HOST}:${options.port}/mcp`,
    close() {
      closing ??= closeHttp(server, handler)
      return closing
    },
  }
}

function validateLocalRequest(request: Request, port: number): Response | undefined {
  const url = new URL(request.url)
  if (url.pathname !== "/mcp") return new Response("Not Found", { status: 404 })
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 })

  const allowedAuthorities = new Set([`${LOOPBACK_HOST}:${port}`, `localhost:${port}`])
  const host = request.headers.get("host")?.toLowerCase()
  if (host === null || host === undefined || !allowedAuthorities.has(host)) {
    return new Response("Invalid Host", { status: 400 })
  }

  const origin = request.headers.get("origin")
  if (origin !== null && !isAllowedOrigin(origin, allowedAuthorities)) {
    return new Response("Forbidden Origin", { status: 403 })
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
  if (contentType !== "application/json") return new Response("Unsupported Media Type", { status: 415 })
  return undefined
}

function isAllowedOrigin(origin: string, allowedAuthorities: ReadonlySet<string>): boolean {
  try {
    const url = new URL(origin)
    return url.protocol === "http:"
      && url.pathname === "/"
      && url.search === ""
      && url.hash === ""
      && allowedAuthorities.has(url.host.toLowerCase())
  } catch {
    return false
  }
}

function listen(server: HttpServer, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening)
      reject(error)
    }
    const onListening = () => {
      server.off("error", onError)
      resolve()
    }
    server.once("error", onError)
    server.once("listening", onListening)
    server.listen(port, LOOPBACK_HOST)
  })
}

async function closeHttp(server: HttpServer, handler: McpHttpHandler): Promise<void> {
  const results = await Promise.allSettled([
    handler.close(),
    new Promise<void>((resolve, reject) => {
      server.close((error) => error === undefined ? resolve() : reject(error))
      server.closeIdleConnections()
    }),
  ])
  const rejected = results.find((result) => result.status === "rejected")
  if (rejected?.status === "rejected") throw rejected.reason
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
