import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFontToPreview } from "./exportToPreview"

describe("exportFontToPreview", () => {
  it.each(fontEnterpriseFixtures)("should export $name font to Preview", ({ font, preview }) => {
    const result = exportFontToPreview(mockСontext, font)

    expect(result).toEqual(preview)
  })
})
