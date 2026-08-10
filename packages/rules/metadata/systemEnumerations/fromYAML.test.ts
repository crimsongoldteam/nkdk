import { describe, expect, it } from "vitest"
import { SystemEnumerationPropertyRule } from "./types"
import { mockContext, mockRule } from "../../tests/mockContext"
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

  it("imports known compatibility mode", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "Версия8_3_27",
    })

    expect(result).toBe("Version8_3_27")
  })

  it("does not import unknown values", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "UnknownCompatibilityMode",
    })

    expect(result).toBeUndefined()
  })
})
