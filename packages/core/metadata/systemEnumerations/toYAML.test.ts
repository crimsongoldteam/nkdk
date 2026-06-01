import { describe, expect, it } from "vitest"
import * as SE from "~/metadata/systemEnumerations/types"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportSystemEnumerationToYAML, exportSystemEnumerationToYAMLDeprecated } from "./toYAML"

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

  it("exports known compatibility mode with future values enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "Version8_3_27")

    expect(result).toBe("Версия8_3_27")
  })

  it("exports unknown compatibility mode as is when future values are enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "Version8_3_28")

    expect(result).toBe("Version8_3_28")
  })

  it("exports empty unknown compatibility mode as is when future values are enabled", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
      implicitValueYAML: undefined,
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "")

    expect(result).toBe("")
  })

  it("does not export unknown values for closed enumerations", () => {
    const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
      type: "SystemEnumeration",
      typeSE: "CompatibilityMode",
    }

    const result = exportSystemEnumerationToYAML(mockContext, rule, "Version8_3_28")

    expect(result).toBeUndefined()
  })
})
