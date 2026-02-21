import { describe, expect, it } from "vitest"
import { colorPreviewTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportColorToPreview } from "./toEnterprise"

describe("exportColorToPreview", () => {
  it.each(colorPreviewTestCases)("should handle $name", ({ color, expected }) => {
    const result = exportColorToPreview(mockContext, mockRule, color)

    expect(result).toEqual(expected)
  })
})
