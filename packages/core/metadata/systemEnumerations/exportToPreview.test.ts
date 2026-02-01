import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { exportSystemEnumerationToPreview } from "./exportToPreview"

describe("exportSystemEnumerationToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportSystemEnumerationToPreview(mockContext, undefined, "TestEnum")

    expect(result).toBeUndefined()
  })

  it("should return SystemEnumerationPreview with correct type and value", () => {
    const result = exportSystemEnumerationToPreview(mockContext, "Auto", "DynamicListSearchStringViewMode")

    expect(result).toEqual({
      Type: "SystemEnumeration",
      Value: "DynamicListSearchStringViewMode.Auto",
    })
  })
})
