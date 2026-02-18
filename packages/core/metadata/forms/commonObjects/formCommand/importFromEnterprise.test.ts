import { describe, expect, it } from "vitest"
import {
  fullFormCommands,
  fullFormCommandsEnterprise,
  minimalFormCommandEnterprise,
  minimalFormCommands,
} from "~/tests/fixtures/forms/commands/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandsFromEnterprise } from "./importFromEnterprise"

describe("importCommandFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandsFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from Enterprise", () => {
    const result = importCommandsFromEnterprise(mockContext, mockRule, fullFormCommandsEnterprise)
    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal", () => {
    const result = importCommandsFromEnterprise(mockContext, mockRule, minimalFormCommandEnterprise)

    expect(result).toEqual(minimalFormCommands)
  })
})
