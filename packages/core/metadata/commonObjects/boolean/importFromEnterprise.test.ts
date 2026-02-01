import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importBooleanFromEnterprise } from "./importFromEnterprise"

describe("importBooleanFromEnterprise", () => {
  it("should return undefined when value is undefined", () => {
    const result = importBooleanFromEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = importBooleanFromEnterprise(mockContext, "Истина")

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = importBooleanFromEnterprise(mockContext, "Ложь")

    expect(result).toBe(false)
  })
})
