import { McpServer } from "@modelcontextprotocol/server"
import { registerNkdkCapabilities } from "./tools/registerTools"

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
