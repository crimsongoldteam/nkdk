import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { createNkdkMcpServer, runServerUntilTransportCloses, shutdownNkdkMcpServer } from "./server"

const closeMetadataRuntimeHandle = vi.hoisted(() => vi.fn())
const closePlatformSessionManager = vi.hoisted(() => vi.fn())
const listInfobases = vi.hoisted(() =>
  vi.fn(async () => ({
    tree: [],
    sources: [],
    warnings: [],
  }))
)
const listInfobaseExtensions = vi.hoisted(() =>
  vi.fn(async () => ({
    ok: true,
    extensions: [],
    mode: "designer-agent",
    reusedConnection: false,
  }))
)

vi.mock("./metadataRuntimeHandle", () => ({
  metadataRuntimeHandle: { close: closeMetadataRuntimeHandle },
}))

vi.mock("./services/platformSessionHandle", () => ({
  closePlatformSessionManager,
  getPlatformSessionManager: vi.fn(),
}))

vi.mock("@nkdk/platform", () => ({
  listInfobases,
  readProjectSettings: vi.fn(),
  PROJECT_SETTINGS_SCHEMA_URI: "nkdk://project-settings/schema/v1",
  projectSettingsJsonSchema: { type: "object", examples: [] },
}))

vi.mock("./services/listInfobaseExtensions", () => ({
  listInfobaseExtensions,
}))

describe("MCP server", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates the NKDK MCP server", () => {
    const server = createNkdkMcpServer()

    expect(server).toBeDefined()
    expect(typeof server.connect).toBe("function")
  })

  it("returns the infobase tree through the MCP protocol", async () => {
    const server = createNkdkMcpServer()
    const client = new Client({ name: "nkdk-test-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const result = await client.callTool({
        name: "nkdk.list_infobases",
        arguments: {},
      })

      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toEqual({
        ok: true,
        tree: [],
        sources: [],
        warnings: [],
      })
      expect(listInfobases).toHaveBeenCalled()
    } finally {
      await client.close()
    }
  })

  it("returns infobase extensions through the MCP protocol", async () => {
    const server = createNkdkMcpServer()
    const client = new Client({ name: "nkdk-test-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const result = await client.callTool({
        name: "nkdk.list_infobase_extensions",
        arguments: { projectDir: "/project" },
      })

      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toEqual({
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
      })
      expect(listInfobaseExtensions).toHaveBeenCalledWith(
        { projectDir: "/project" },
        undefined,
        expect.any(AbortSignal)
      )
    } finally {
      await client.close()
    }
  })

  it("rejects extra infobase extension connection arguments through MCP", async () => {
    const server = createNkdkMcpServer()
    const client = new Client({ name: "nkdk-test-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const result = await client.callTool({
        name: "nkdk.list_infobase_extensions",
        arguments: { projectDir: "/project", user: "Admin" },
      })

      expect(result.isError).toBe(true)
      expect(listInfobaseExtensions).not.toHaveBeenCalled()
    } finally {
      await client.close()
    }
  })

  it("keeps rules and runtime as build-only dependencies", async () => {
    const packageJson = (
      await import("../package.json", {
        with: { type: "json" },
      })
    ).default

    expect(packageJson.dependencies).not.toHaveProperty("@nkdk/rules")
    expect(packageJson.devDependencies).toHaveProperty("@nkdk/rules", "workspace:*")
    expect(packageJson.dependencies).not.toHaveProperty("@nkdk/runtime")
    expect(packageJson.devDependencies).toHaveProperty("@nkdk/runtime", "workspace:*")
  })

  it("declares binary project-state runtime dependencies", async () => {
    const packageJson = (
      await import("../package.json", {
        with: { type: "json" },
      })
    ).default

    expect(packageJson.dependencies).toHaveProperty("structurae", "4.0.2")
  })

  it("closes validation and platform handles on shutdown", async () => {
    closeMetadataRuntimeHandle.mockResolvedValueOnce(undefined)
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await shutdownNkdkMcpServer()

    expect(closeMetadataRuntimeHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("closes validation and platform handles when the transport closes", async () => {
    closeMetadataRuntimeHandle.mockResolvedValueOnce(undefined)
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 1,
      stoppedOwnedProcesses: 1,
    })
    const transport: { onclose?: () => void } = {}
    const server = {
      async connect() {
        queueMicrotask(() => transport.onclose?.())
      },
    }

    await runServerUntilTransportCloses(server, transport)

    expect(closeMetadataRuntimeHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("attempts both shutdown branches when one fails", async () => {
    closeMetadataRuntimeHandle.mockRejectedValueOnce(new Error("metadata runtime close failed"))
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await expect(shutdownNkdkMcpServer()).rejects.toThrow("metadata runtime close failed")

    expect(closeMetadataRuntimeHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })
})
