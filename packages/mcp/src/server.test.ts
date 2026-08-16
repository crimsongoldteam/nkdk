import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { createNkdkMcpServer } from "./server"

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

vi.mock("./services/platformSessionHandle", () => ({
  closePlatformSessionManager: vi.fn(),
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

})
