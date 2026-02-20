import { describe, expect, it } from "vitest"
import { fullFormCommands, fullFormCommandsYAML, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportCommandsToYAML } from "./toYAML"

describe("exportCommandToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandsToYAML(mockContextToYAML, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportCommandsToYAML(mockContextToYAML, mockRule, fullFormCommands)

    expect(result).toEqual(fullFormCommandsYAML)
  })

  it("should export minimal", () => {
    const result = exportCommandsToYAML(mockContextToYAML, mockRule, minimalFormCommands)

    expect(result).toBeUndefined()
  })
})
