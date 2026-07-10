import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContext } from "../../../tests/mockContext"
import { exportI8nTextToEnterprise } from "./toEnterprise"

const execFileAsync = promisify(execFile)

describe("exportI8nTextToEnterprise", () => {
  it("registers I8nText property type for enterprise-only imports", async () => {
    const script = `
      import "./metadata/commonObjects/i8nText/toEnterprise.ts"
      import { getRegisteredPropertyRuleTypes } from "./metadata/orchestration/property/propertyTypeKeys.ts"

      if (!getRegisteredPropertyRuleTypes().includes("I8nText")) {
        throw new Error("I8nText is not registered")
      }
    `

    await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], { cwd: process.cwd() })
  })

  it.each(i8nTextFixtures)("should export for enterprise: $name", (fixture) => {
    const result = exportI8nTextToEnterprise({ context: mockContext, value: fixture.text })
    expect(result).toEqual(fixture.defaultLanguageYAML)
  })
})
