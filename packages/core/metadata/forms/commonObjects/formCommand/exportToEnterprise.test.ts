import { describe, expect, it } from "vitest"
import { fullFormCommands, fullFormCommandsEnterprise, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportCommandsToEnterprise } from "./exportToEnterprise"

describe("exportCommandToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandsToEnterprise(mockContextToYAML, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportCommandsToEnterprise(mockContextToYAML, mockRule, fullFormCommands)

    expect(result).toEqual(fullFormCommandsEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandsToEnterprise(mockContextToYAML, mockRule, minimalFormCommands)

    expect(result).toBeUndefined()
  })
})
