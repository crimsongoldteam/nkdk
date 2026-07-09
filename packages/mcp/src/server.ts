#!/usr/bin/env node
import { resolve } from "path"
import { pathToFileURL } from "url"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerNkdkCapabilities } from "./tools/registerTools"
import { closeValidationHandle } from "./services/validationHandle"

declare const __NKDK_MCP_VERSION__: string | undefined

const MCP_SERVER_VERSION =
  typeof __NKDK_MCP_VERSION__ === "string" && __NKDK_MCP_VERSION__.length > 0 ? __NKDK_MCP_VERSION__ : "0.0.0-dev"

export function createNkdkMcpServer(): McpServer {
  const server = new McpServer({
    name: "nkdk-mcp",
    version: MCP_SERVER_VERSION,
  })
  registerNkdkCapabilities(server)
  return server
}

export async function runStdioServer(): Promise<void> {
  const server = createNkdkMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function shutdownNkdkMcpServer(): Promise<void> {
  await closeValidationHandle()
}

function isMainEntrypoint(): boolean {
  const entrypoint = process.argv[1]
  return entrypoint !== undefined && import.meta.url === pathToFileURL(resolve(entrypoint)).href
}

if (isMainEntrypoint()) {
  installShutdownHooks()
  runStdioServer().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}

function installShutdownHooks(): void {
  const shutdown = async () => {
    try {
      await shutdownNkdkMcpServer()
    } finally {
      process.exit()
    }
  }

  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
}
