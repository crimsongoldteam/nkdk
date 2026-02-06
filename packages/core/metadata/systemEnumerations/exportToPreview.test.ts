import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../tests/mockContext"
import { exportSystemEnumerationDeprecatedToPreview } from "./exportToPreview"

describe("exportSystemEnumerationToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportSystemEnumerationDeprecatedToPreview(mockContext, mockRule, undefined, "TestEnum")

    expect(result).toBeUndefined()
  })

  it("should return SystemEnumerationPreview with correct type and value", () => {
    const result = exportSystemEnumerationDeprecatedToPreview(
      mockContext,
      mockRule,
      "Auto",
      "DynamicListSearchStringViewMode"
    )

    expect(result).toEqual({
      Type: "SystemEnumeration",
      Value: "DynamicListSearchStringViewMode.Auto",
    })
  })
})
