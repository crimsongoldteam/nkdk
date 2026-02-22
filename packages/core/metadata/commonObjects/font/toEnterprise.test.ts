import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { exportFontToEnterprise } from "./toEnterprise"

describe("exportFontToEnterprise", () => {
  it.each(fontYAMLFixtures)("should export $name font to Enterprise", ({ font, preview }) => {
    const result = exportFontToEnterprise({ value: font })

    expect(result).toEqual(preview)
  })
})
