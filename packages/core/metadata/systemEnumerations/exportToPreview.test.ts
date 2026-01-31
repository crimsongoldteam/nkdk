import { describe, expect, it } from "vitest"
import { mockСontext } from "../../tests/mockContext"
import { exportSystemEnumerationToPreview } from "./exportToPreview"

describe("exportSystemEnumerationToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, undefined, "TestEnum")

    expect(result).toBeUndefined()
  })

  it("should return undefined when value is empty string", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, "", "TestEnum")

    expect(result).toBeUndefined()
  })

  it("should return SystemEnumerationPreview when value is provided", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, "TestValue", "TestEnum")

    expect(result).toEqual({
      type: "TestEnum",
      value: "TestValue",
    })
  })

  it("should return SystemEnumerationPreview with correct type and value", () => {
    const result = exportSystemEnumerationToPreview(mockСontext, "Auto", "DynamicListSearchStringViewMode")

    expect(result).toEqual({
      type: "DynamicListSearchStringViewMode",
      value: "Auto",
    })
  })
})
