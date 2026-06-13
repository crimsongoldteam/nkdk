import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportFormattedI8nTextToEnterprise } from "./toEnterprise"

describe("export FormattedI8nText to Enterprise", () => {
  it.each(formattedI8nTextFixtures)("should export for enterprise: $name", (fixture) => {
    const result = exportFormattedI8nTextToEnterprise({ context: mockContext, value: fixture.text })
    expect(result).toEqual(fixture.defaultLanguageYAML)
  })
})
