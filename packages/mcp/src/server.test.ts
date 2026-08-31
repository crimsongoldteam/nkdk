import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { createNkdkMcpServer, main } from "./server"
import { createNkdkMcpServerWithDependencies } from "./mcpServer"

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
const closeBackgroundOperations = vi.hoisted(() => vi.fn(async () => undefined))
const closeMetadataRuntime = vi.hoisted(() => vi.fn(async () => undefined))
const closePlatformSessionManager = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock("./backgroundOperationHandle", () => ({
  backgroundOperationHandle: {
    get: vi.fn(),
    close: closeBackgroundOperations,
  },
}))

vi.mock("./metadataRuntimeHandle", () => ({
  metadataRuntimeHandle: {
    get: vi.fn(),
    close: closeMetadataRuntime,
  },
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

  it("closes background operations during process shutdown", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
    const previousExitCode = process.exitCode
    try {
      await main(["--unknown-option"], "server.js")
      expect(closeBackgroundOperations).toHaveBeenCalledOnce()
      expect(closeMetadataRuntime).toHaveBeenCalledOnce()
      expect(closePlatformSessionManager).toHaveBeenCalledOnce()
    } finally {
      process.exitCode = previousExitCode
      stderr.mockRestore()
    }
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

  it("shares a background operation between MCP server instances", async () => {
    const snapshot = {
      ok: true as const,
      status: "running" as const,
      operationId: "shared-operation",
      operationKind: "validate_project" as const,
      projectDir: "/project",
      createdAt: "2026-08-31T00:00:00.000Z",
      updatedAt: "2026-08-31T00:00:01.000Z",
      messages: [],
    }
    const manager = {
      async start() {
        return {
          ok: true as const,
          status: "accepted" as const,
          operationId: snapshot.operationId,
          operationKind: snapshot.operationKind,
          projectDir: snapshot.projectDir,
        }
      },
      async get() { return snapshot },
      async cancel() { return snapshot },
      async close() {},
    }
    const dependencies = {
      backgroundOperations: {
        async get() { return manager },
        async close() {},
      },
    }

    const accepted = await callInMemoryTool(
      createNkdkMcpServerWithDependencies(dependencies),
      "nkdk.validate_project",
      { projectDir: "/project" },
    )
    const observed = await callInMemoryTool(
      createNkdkMcpServerWithDependencies(dependencies),
      "nkdk.get_operation",
      { projectDir: "/project", operationId: snapshot.operationId },
    )

    expect(accepted.structuredContent).toMatchObject({ status: "accepted", operationId: snapshot.operationId })
    expect(observed.structuredContent).toEqual(snapshot)
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

async function callInMemoryTool(
  server: ReturnType<typeof createNkdkMcpServer>,
  name: string,
  args: Record<string, unknown>,
) {
  const client = new Client({ name: "nkdk-background-test", version: "1.0.0" })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  try {
    return await client.callTool({ name, arguments: args })
  } finally {
    await client.close()
  }
}
