import { describe, expect, it } from "vitest"
import {
  fullCommands,
  fullCommandsEnterprise,
  minimalCommandEnterprise,
  minimalCommands,
} from "~/tests/fixtures/forms/commands/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandsFromEnterprise } from "./importFromEnterprise"

describe("importCommandFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandsFromEnterprise(mockСontext, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from Enterprise", () => {
    const result = importCommandsFromEnterprise(mockСontext, fullCommandsEnterprise)
    expect(result).toEqual(fullCommands)
  })

  it("should import minimal", () => {
    const result = importCommandsFromEnterprise(mockСontext, minimalCommandEnterprise)

    expect(result).toEqual(minimalCommands)
  })
})
