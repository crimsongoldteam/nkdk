import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import {
  createNkdkMcpServer,
  runServerUntilTransportCloses,
  shutdownNkdkMcpServer,
} from "./server"

const closeValidationHandle = vi.hoisted(() => vi.fn())
const closePlatformSessionManager = vi.hoisted(() => vi.fn())
const listInfobases = vi.hoisted(() =>
  vi.fn(async () => ({
    tree: [],
    sources: [],
    warnings: [],
  })),
)

vi.mock("./services/validationHandle", () => ({
  closeValidationHandle,
}))

vi.mock("./services/platformSessionHandle", () => ({
  closePlatformSessionManager,
  getPlatformSessionManager: vi.fn(),
}))

vi.mock("@nkdk/platform", () => ({
  listInfobases,
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

  it("calls registered tools through the MCP protocol", async () => {
    const server = createNkdkMcpServer()
    const client = new Client({ name: "nkdk-test-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const result = await client.callTool({
        name: "nkdk.get_schema",
        arguments: { projectDir: process.cwd(), metadataRef: "InputField", keys: true },
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

  it("loads core API without a monorepo-relative runtime import", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./coreApi.ts", import.meta.url), "utf8"),
    )

    expect(source).not.toContain("../../core/index.ts")
    expect(source).toContain('from "@nkdk/core"')
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
      fs.readFile(new URL("./server.ts", import.meta.url), "utf8"),
    )

    expect(source).not.toContain('version: "1.0.0"')
    expect(packageJson.default.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(createNkdkMcpServer()).toBeDefined()
  })

  it("closes validation and platform handles on shutdown", async () => {
    closeValidationHandle.mockResolvedValueOnce(undefined)
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await shutdownNkdkMcpServer()

    expect(closeValidationHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("closes validation and platform handles when the transport closes", async () => {
    closeValidationHandle.mockResolvedValueOnce(undefined)
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

    expect(closeValidationHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })

  it("attempts both shutdown branches when one fails", async () => {
    closeValidationHandle.mockRejectedValueOnce(new Error("validation close failed"))
    closePlatformSessionManager.mockResolvedValueOnce({
      closedCount: 0,
      stoppedOwnedProcesses: 0,
    })

    await expect(shutdownNkdkMcpServer()).rejects.toThrow("validation close failed")

    expect(closeValidationHandle).toHaveBeenCalledTimes(1)
    expect(closePlatformSessionManager).toHaveBeenCalledTimes(1)
  })
})
