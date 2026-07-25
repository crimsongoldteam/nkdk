import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "./__fixtures__/legacy/data"
import { mockContext } from "../../../tests/mockContext"
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

    it("exports explicit empty text when empty XML must be preserved", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", preserveEmptyXML: true }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        value: { items: {} },
      })

      expect(result).toBe("")
    })

    it("omits empty text without empty XML preservation", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText" }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        value: { items: {} },
      })

      expect(result).toBeUndefined()
    })
  })

  describe("excludeIfEqualNameYAML", () => {
    it("does not copy translations when default language differs from the name", () => {
      const rule: I8nTextPropertyRule = { type: "I8nText", excludeIfEqualNameYAML: true }
      const items = { ru: "Пользовательский заголовок", en: "Custom title" }

      const result = exportI8nTextToYAML({
        context: contextWithExportToYAML,
        rule,
        name: "ОценкаОтправлена",
        value: { items },
      })

      expect(result).toBe(items)
    })

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
