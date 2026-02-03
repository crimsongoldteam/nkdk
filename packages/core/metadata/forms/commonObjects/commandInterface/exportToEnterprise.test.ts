import { describe, expect, it } from "vitest"
import { fullCommandInterface, fullCommandInterfaceEnterprise } from "~/tests/fixtures/commandInterface/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandInterfaceToEnterprise } from "./exportToEnterprise"

describe("exportCommandInterfaceToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandInterfaceToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty", () => {
    const result = exportCommandInterfaceToEnterprise(mockContext, mockRule, {
      NavigationPanel: [],
      CommandBar: [],
    })

    expect(result).toBeUndefined()
  })

  it("should export full command interface", () => {
    const result = exportCommandInterfaceToEnterprise(mockContext, mockRule, fullCommandInterface)

    expect(result).toEqual(fullCommandInterfaceEnterprise)
  })
})
