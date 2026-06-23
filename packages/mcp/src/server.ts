#!/usr/bin/env node
import { resolve } from "path"
import { pathToFileURL } from "url"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

export function createNkdkMcpServer(): McpServer {
  return new McpServer({
    name: "nkdk-mcp",
    version: "1.0.0",
  })
}

export async function runStdioServer(): Promise<void> {
  const server = createNkdkMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

function isMainEntrypoint(): boolean {
  const entrypoint = process.argv[1]
  return entrypoint !== undefined && import.meta.url === pathToFileURL(resolve(entrypoint)).href
}

if (isMainEntrypoint()) {
  runStdioServer().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}
