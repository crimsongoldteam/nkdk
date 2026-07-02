import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importBooleanFromYAML } from "./fromYAML"

describe("importBooleanFromYAML", () => {
  it("should return undefined when value is undefined", () => {
    const result = importBooleanFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = importBooleanFromYAML(mockContext, mockRule, "Истина")

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = importBooleanFromYAML(mockContext, mockRule, "Ложь")

    expect(result).toBe(false)
  })
})
