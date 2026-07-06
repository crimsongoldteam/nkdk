import { describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { createNkdkMcpServer, shutdownNkdkMcpServer } from "./server"

const closeValidationHandle = vi.hoisted(() => vi.fn())

vi.mock("./services/validationHandle", () => ({
  closeValidationHandle,
}))

describe("MCP server", () => {
  it("creates the NKDK MCP server", () => {
    const server = createNkdkMcpServer()

    expect(server).toBeDefined()
    expect(typeof server.connect).toBe("function")
  })

  it("calls registered tools through the MCP protocol", async () => {
    const server = createNkdkMcpServer()
    const client = new Client({ name: "nkdk-test-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const result = await client.callTool({
        name: "nkdk.get_schema",
        arguments: { target: "InputField", keys: true },
      })

      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toEqual(
        expect.objectContaining({
          ok: true,
          result: expect.objectContaining({
            kind: "keys",
            keys: expect.arrayContaining(["ПутьКДанным"]),
          }),
        }),
      )
    } finally {
      await client.close()
    }
  }, 30_000)

  it("closes validation handle on shutdown", async () => {
    closeValidationHandle.mockResolvedValueOnce(undefined)

    await shutdownNkdkMcpServer()

    expect(closeValidationHandle).toHaveBeenCalledTimes(1)
  })
})
