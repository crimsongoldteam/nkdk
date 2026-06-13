import { execFileSync } from "child_process"
import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/metadata/commonObjects/i8nText/__fixtures__/legacy/data"
import { mockContext } from "~/tests/mockContext"
import { exportI8nTextToEnterprise } from "./toEnterprise"

describe("exportI8nTextToEnterprise", () => {
  it("registers I8nText property type for enterprise-only imports", () => {
    const script = `
      import "~/metadata/commonObjects/i8nText/toEnterprise"
      import { getRegisteredPropertyRuleTypes } from "~/metadata/orchestration/property/propertyTypeKeys"

      if (!getRegisteredPropertyRuleTypes().includes("I8nText")) {
        throw new Error("I8nText is not registered")
      }
    `

    expect(() => execFileSync("node", ["--import", "tsx", "-e", script], { cwd: process.cwd() })).not.toThrow()
  })

  it.each(i8nTextFixtures)("should export for enterprise: $name", (fixture) => {
    const result = exportI8nTextToEnterprise({ context: mockContext, value: fixture.text })
    expect(result).toEqual(fixture.defaultLanguageYAML)
  })
})
