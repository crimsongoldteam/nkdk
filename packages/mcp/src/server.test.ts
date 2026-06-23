import { describe, expect, it } from "vitest"
import { createNkdkMcpServer } from "./server"

describe("MCP server", () => {
  it("creates the NKDK MCP server", () => {
    const server = createNkdkMcpServer()

    expect(server).toBeDefined()
    expect(typeof server.connect).toBe("function")
  })
})
