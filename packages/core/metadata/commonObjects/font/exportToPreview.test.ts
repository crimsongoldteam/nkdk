import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFontToPreview } from "./exportToPreview"

describe("exportFontToPreview", () => {
  it.each(fontYAMLFixtures)("should export $name font to Preview", ({ font, preview }) => {
    const result = exportFontToPreview(mockContext, mockRule, font)

    expect(result).toEqual(preview)
  })
})
