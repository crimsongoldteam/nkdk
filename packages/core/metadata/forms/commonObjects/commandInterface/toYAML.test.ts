import { describe, expect, it } from "vitest"
import { fullCommandInterface, fullCommandInterfaceYAML } from "~/tests/fixtures/commandInterface/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandInterfaceToYAML } from "./toYAML"

describe("exportCommandInterfaceToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, {
      NavigationPanel: [],
      CommandBar: [],
      itemType: "CommandInterface",
    })

    expect(result).toBeUndefined()
  })

  it("should export full command interface", () => {
    const result = exportCommandInterfaceToYAML(mockContext, mockRule, fullCommandInterface)

    expect(result).toEqual(fullCommandInterfaceYAML)
  })
})
