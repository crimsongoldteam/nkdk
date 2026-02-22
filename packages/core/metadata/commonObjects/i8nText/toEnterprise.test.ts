import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext } from "~/tests/mockContext"
import { exportI8nTextToEnterprise } from "./toEnterprise"

describe("exportI8nTextToEnterprise", () => {
  it.each(i8nTextFixtures)("should export for enterprise: $name", (fixture) => {
    const result = exportI8nTextToEnterprise({ context: mockContext, value: fixture.text })
    expect(result).toEqual(fixture.defaultLanguageYAML)
  })
})
