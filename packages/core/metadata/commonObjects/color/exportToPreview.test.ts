import { describe, expect, it } from "vitest"
import { colorPreviewTestCases } from "~/tests/fixtures/color/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportColorToPreview } from "./exportToPreview"

describe("exportColorToPreview", () => {
  it.each(colorPreviewTestCases)("should handle $name", ({ color, expected }) => {
    const result = exportColorToPreview(mockСontext, color)

    expect(result).toEqual(expected)
  })
})
