import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportColorToPreview } from "./exportToPreview"

describe("exportColorToPreview", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportColorToPreview(mockСontext, undefined, "WebColor")

    expect(result).toBeUndefined()
  })

  it("should return undefined when value is empty string", () => {
    const result = exportColorToPreview(mockСontext, "", "WebColor")

    expect(result).toBeUndefined()
  })

  it("should return ColorPreview when value is provided", () => {
    const result = exportColorToPreview(mockСontext, "#FF0000", "WebColor")

    expect(result).toEqual({
      type: "WebColor",
      value: "#FF0000",
    })
  })

  it("should return ColorPreview with correct type and value for WindowsColor", () => {
    const result = exportColorToPreview(mockСontext, "ActiveBorder", "WindowsColor")

    expect(result).toEqual({
      type: "WindowsColor",
      value: "ActiveBorder",
    })
  })

  it("should return ColorPreview with correct type and value for StyleItem", () => {
    const result = exportColorToPreview(mockСontext, "MyStyleItem", "StyleItem")

    expect(result).toEqual({
      type: "StyleItem",
      value: "MyStyleItem",
    })
  })
})
