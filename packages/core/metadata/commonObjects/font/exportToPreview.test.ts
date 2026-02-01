import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockContext } from "~/tests/mockContext"
import { exportFontToPreview } from "./exportToPreview"

describe("exportFontToPreview", () => {
  it.each(fontEnterpriseFixtures)("should export $name font to Preview", ({ font, preview }) => {
    const result = exportFontToPreview(mockContext, font)

    expect(result).toEqual(preview)
  })
})
