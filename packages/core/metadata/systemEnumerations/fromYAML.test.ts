import { describe, expect, it } from "vitest"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
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

  it("imports known compatibility mode with future values enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "Версия8_3_27",
    })

    expect(result).toBe("Version8_3_27")
  })

  it("imports unknown compatibility mode as is when future values are enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "Version8_3_28",
    })

    expect(result).toBe("Version8_3_28")
  })

  it("imports empty unknown compatibility mode as is when future values are enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "",
    })

    expect(result).toBe("")
  })

  it("does not import unknown values for closed enumerations", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = importSystemEnumerationFromYAML({
      context: mockContext,
      rule,
      value: "Version8_3_28",
    })

    expect(result).toBeUndefined()
  })
})
