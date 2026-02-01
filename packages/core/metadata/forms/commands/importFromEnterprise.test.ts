import { describe, expect, it } from "vitest"
import {
  fullCommands,
  fullCommandsEnterprise,
  minimalCommandEnterprise,
  minimalCommands,
} from "~/tests/fixtures/forms/commands/data"
import { mockContext } from "~/tests/mockContext"
import { importCommandsFromEnterprise } from "./importFromEnterprise"

describe("importCommandFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandsFromEnterprise(mockContext, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from Enterprise", () => {
    const result = importCommandsFromEnterprise(mockContext, fullCommandsEnterprise)
    expect(result).toEqual(fullCommands)
  })

  it("should import minimal", () => {
    const result = importCommandsFromEnterprise(mockContext, minimalCommandEnterprise)

    expect(result).toEqual(minimalCommands)
  })
})
