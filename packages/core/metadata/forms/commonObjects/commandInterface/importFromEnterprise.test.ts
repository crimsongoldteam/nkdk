import { describe, expect, it } from "vitest"
import { fullCommandInterface, fullCommandInterfaceEnterprise } from "~/tests/fixtures/commandInterface/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommandInterfaceFromEnterprise } from "./importFromEnterprise"

describe("importCommandInterfaceFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const result = importCommandInterfaceFromEnterprise(mockContext, mockRule, fullCommandInterfaceEnterprise)

    expect(result).toEqual(fullCommandInterface)
  })
})
