import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { createNkdkMcpServer, runServerUntilTransportCloses, shutdownNkdkMcpServer } from "./server"

const closeProjectStateHandle = vi.hoisted(() => vi.fn())
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

vi.mock("./services/projectStateHandle", () => ({
  projectStateHandle: { close: closeProjectStateHandle },
}))

vi.mock("./services/platformSessionHandle", () => ({
  closePlatformSessionManager,
  getPlatformSessionManager: vi.fn(),
}))

vi.mock("@nkdk/platform", () => ({
  listInfobases,
  readProjectSettings: vi.fn(),
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

  it("loads core API lazily without a monorepo-relative runtime import", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./coreApi.ts", import.meta.url), "utf8")
    )

    expect(source).not.toContain("../../core/index.ts")
    expect(source).toContain('from "@nkdk/core"')
    expect(source).toContain('import("@nkdk/core")')
  })

  it("keeps private core as a build-only dependency", async () => {
    const packageJson = (
      await import("../package.json", {
        with: { type: "json" },
      })
    ).default

    expect(packageJson.dependencies).not.toHaveProperty("@nkdk/core")
    expect(packageJson.devDependencies).toHaveProperty("@nkdk/core", "workspace:*")
  })

  it("documents expected publish build outputs", () => {
    const outputs = [
      "dist/bin/nkdk-mcp",
      "dist/bin/preparedYamlProjectWorker.js",
      "dist/bin/importFromXmlWorker.js",
      "dist/bin/fullSyncToXmlWorker.js",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ]

    expect(outputs).toEqual([
      "dist/bin/nkdk-mcp",
      "dist/bin/preparedYamlProjectWorker.js",
      "dist/bin/importFromXmlWorker.js",
      "dist/bin/fullSyncToXmlWorker.js",
      "dist/generateProjectValidationAjvStandalone.js",
      "dist/projectValidationAjvStandalone.js",
    ])
  })

  it("uses package version for MCP server metadata", async () => {
    const { createNkdkMcpServer } = await import("./server")
    const packageJson = await import("../package.json", { with: { type: "json" } })
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./server.ts", import.meta.url), "utf8")
    )

    expect(source).not.toContain('version: "1.0.0"')
    expect(packageJson.default.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(createNkdkMcpServer()).toBeDefined()
  })

  it("closes validation and platform handles on shutdown", async () => {
    closeProjectStateHandle.mockResolvedValueOnce(undefined)
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await shutdownNkdkMcpServer()

    expect(closeProjectStateHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("closes validation and platform handles when the transport closes", async () => {
    closeProjectStateHandle.mockResolvedValueOnce(undefined)
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

    expect(closeProjectStateHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("attempts both shutdown branches when one fails", async () => {
    closeProjectStateHandle.mockRejectedValueOnce(new Error("project state close failed"))
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await expect(shutdownNkdkMcpServer()).rejects.toThrow("project state close failed")

    expect(closeProjectStateHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })
})
