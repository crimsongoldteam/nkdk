import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext } from "~/tests/mockContext"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "./toYAML"
import { I8nTextPropertyRule } from "./types"

const contextWithExportToYAML = {
  ...mockContext,
  exportToYAML: { toTyped: false },
}

describe("exportI8nTextToYAML", () => {
  describe("exportI8nTextToYAML", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const rule: I8nTextPropertyRule = { type: "I8nText" }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.fullYAML)
    })
  })

  describe("exportI8nTextOtherToYAML", () => {
    it.each(i8nTextFixtures)("should export other: $name", (fixture) => {
      const rule: I8nTextPropertyRule = { type: "I8nText", yamlPartialOthers: true }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.otherLanguagesYAML)
    })
  })

  describe("excludeIfEqualNameYAML", () => {
    it("keeps non-default languages when default language equals the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items: { ru: "Оценка отправлена", en: "Rating sent" } },
      })

      expect(result).toEqual({ en: "Rating sent" })
    })
  })

  describe("exportI8nTextDefaultToYAML", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToYAML(mockContext, fixture.text)
      expect(result).toEqual(fixture.defaultLanguageYAML)
    })
  })
})
