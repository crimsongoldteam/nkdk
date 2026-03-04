import { describe, expect, it } from "vitest"
import { I8nTextPropertyRule } from "~/metadata/metadataFactory/properties/types"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext } from "~/tests/mockContext"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "./toYAML"

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

  describe("exportI8nTextDefaultToYAML", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToYAML(mockContext, fixture.text)
      expect(result).toEqual(fixture.defaultLanguageYAML)
    })
  })
})
