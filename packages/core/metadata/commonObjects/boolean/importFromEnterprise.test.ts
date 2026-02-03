import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importBooleanFromEnterprise } from "./importFromEnterprise"

describe("importBooleanFromEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = importBooleanFromEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = importBooleanFromEnterprise(mockContext, mockRule, "Истина")

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = importBooleanFromEnterprise(mockContext, mockRule, "Ложь")

    expect(result).toBe(false)
  })
})
