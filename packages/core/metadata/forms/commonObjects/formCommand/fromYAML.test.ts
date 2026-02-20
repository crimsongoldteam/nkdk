import { describe, expect, it } from "vitest"
import {
  fullFormCommands,
  fullFormCommandsYAML,
  minimalFormCommandYAML,
  minimalFormCommands,
} from "~/tests/fixtures/forms/commands/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandsFromYAML } from "./fromYAML"

describe("importCommandFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from YAML", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, fullFormCommandsYAML)
    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal", () => {
    const result = importCommandsFromYAML(mockContext, mockRule, minimalFormCommandYAML)

    expect(result).toEqual(minimalFormCommands)
  })
})
