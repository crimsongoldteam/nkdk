import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportI8nTextToPreview } from "./exportToPreview"

describe("exportI8nTextToPreview", () => {
  it.each(i8nTextFixtures)("should export for preview: $name", (fixture) => {
    const result = exportI8nTextToPreview(mockContext, mockRule, fixture.text)
    expect(result).toEqual(fixture.defaultLanguageYAML)
  })
})
