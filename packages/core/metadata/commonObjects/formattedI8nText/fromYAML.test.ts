import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext } from "~/tests/mockContext"
import { importFormattedI8nTextFromYAML } from "./fromYAML"
import { FormattedI8nTextPropertyRule } from "./types"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
  yamlFormatted: "FormattedTitle",
} as unknown as FormattedI8nTextPropertyRule

describe("importFormattedI8nTextFromYAML", () => {
  describe("importFormattedI8nTextFromYAML", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: fixture.textYAML,
        yaml: fixture.formattedTextYAML ? { FormattedTitle: fixture.formattedTextYAML } : undefined,
      })
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importFormattedI8nTextCombinedFromYAML", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: fixture.textYAML,
        yaml: fixture.formattedTextYAML ? { FormattedTitle: fixture.formattedTextYAML } : undefined,
        source: fixture.textFromStructure,
      })
      expect(result).toEqual(fixture.text)
    })
  })
})
