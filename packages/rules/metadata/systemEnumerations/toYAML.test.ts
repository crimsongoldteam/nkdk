import { describe, expect, it } from "vitest"
import * as SE from "./types"
import { SystemEnumerationPropertyRule } from "./types"
import { mockContext, mockRule } from "../../tests/mockContext"
import { exportSystemEnumerationToYAML, exportSystemEnumerationToYAMLDeprecated } from "./toYAML"

export const invalidImplicitSystemEnumerationValueTypeCheck: SystemEnumerationPropertyRule<"ChildFormItemsGroup"> = {
  type: "SystemEnumeration",
  typeSE: "ChildFormItemsGroup",
  // @ts-expect-error implicitValueYAML accepts only internal system enumeration values.
  implicitValueYAML: "ПроизвольнаяСтрока",
}

export const invalidDefaultSystemEnumerationValueTypeCheck: SystemEnumerationPropertyRule<"ChildFormItemsGroup"> = {
  type: "SystemEnumeration",
  typeSE: "ChildFormItemsGroup",
  // @ts-expect-error defaultValueXML accepts only internal system enumeration values.
  defaultValueXML: "ПроизвольнаяСтрока",
}

describe("exportSystemEnumerationToYAML", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = exportSystemEnumerationToYAMLDeprecated(
      mockContext,
      mockRule,
      mockValue,
      SE.ChildFormItemsGroupToYAML
    )

    expect(result).toBe(expectedResult)
  })

  it("exports known compatibility mode", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "Version8_3_27")

    expect(result).toBe("Версия8_3_27")
  })

  it("does not export unknown values", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "UnknownCompatibilityMode")

    expect(result).toBeUndefined()
  })
})
