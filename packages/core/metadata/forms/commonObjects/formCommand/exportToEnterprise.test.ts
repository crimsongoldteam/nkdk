import { describe, expect, it } from "vitest"
import { fullFormCommands, fullFormCommandsEnterprise, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandsToEnterprise } from "./exportToEnterprise"

describe("exportCommandToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandsToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportCommandsToEnterprise(mockContext, mockRule, fullFormCommands)

    expect(result).toEqual(fullFormCommandsEnterprise)
  })

  it("should export minimal", () => {
    const result = exportCommandsToEnterprise(mockContext, mockRule, minimalFormCommands)

    expect(result).toBeUndefined()
  })
})
