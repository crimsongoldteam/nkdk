import { describe, expect, it } from "vitest"
import { mockСontext } from "../../tests/mockContext"
import { exportSystemEnumerationToPreview } from "./exportToPreview"

describe("exportSystemEnumerationToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, undefined, "TestEnum")

    expect(result).toBeUndefined()
  })

  it("should return SystemEnumerationPreview with correct type and value", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, "Auto", "DynamicListSearchStringViewMode")

    expect(result).toEqual({
      Type: "SystemEnumeration",
      Value: "DynamicListSearchStringViewMode.Auto",
    })
  })
})
