import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "./version"

describe("NKDK_CORE_VERSION", () => {
  it("uses the deterministic development fallback", () => {
    expect(NKDK_CORE_VERSION).toBe("0.0.0-dev")
  })

  it("injects the core package version into core and MCP builds", () => {
    const coreBuild = readFileSync(join(process.cwd(), "scripts/build.mjs"), "utf-8")
    const mcpBuild = readFileSync(join(process.cwd(), "../mcp/scripts/build.mjs"), "utf-8")

    expect(coreBuild).toContain("__NKDK_CORE_VERSION__: JSON.stringify(corePackageJson.version)")
    expect(mcpBuild).toContain("__NKDK_CORE_VERSION__: JSON.stringify(corePackageJson.version)")
    expect(mcpBuild).toContain("__NKDK_MCP_VERSION__: JSON.stringify(packageJson.version)")
  })
})
