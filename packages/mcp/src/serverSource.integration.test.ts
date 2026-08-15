import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { createNkdkMcpServer } from "./server"

describe("MCP server source contracts", () => {
  it("loads core API lazily without a monorepo-relative runtime import", async () => {
    const [coreApiSource, runtimeHandleSource] = await Promise.all([
      readFile(new URL("./coreApi.ts", import.meta.url), "utf8"),
      readFile(new URL("./metadataRuntimeHandle.ts", import.meta.url), "utf8"),
    ])

    expect(coreApiSource).not.toContain("../../rules/index.ts")
    expect(coreApiSource).toContain('from "@nkdk/runtime"')
    expect(coreApiSource).not.toContain('from "@nkdk/rules"')
    expect(coreApiSource).not.toContain('import("@nkdk/rules")')
    expect(runtimeHandleSource).toContain('import("@nkdk/rules")')
  })

  it("uses package version for MCP server metadata", async () => {
    const packageJson = await import("../package.json", { with: { type: "json" } })
    const source = await readFile(new URL("./server.ts", import.meta.url), "utf8")

    expect(source).not.toContain('version: "1.0.0"')
    expect(packageJson.default.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(createNkdkMcpServer()).toBeDefined()
  })
})
