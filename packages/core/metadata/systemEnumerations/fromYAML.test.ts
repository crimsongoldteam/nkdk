import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importSystemEnumerationFromYAML } from "./fromYAML"

describe("importSystemEnumerationFromYAML", () => {
  it("should parse from enterprise to normal", () => {
    const mockValue = "Вертикальная"
    const expectedResult = "Vertical"

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule: { type: "SystemEnumeration", typeSE: "ChildFormItemsGroup" },
      value: mockValue,
    })

    expect(result).toBe(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule: mockRule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
