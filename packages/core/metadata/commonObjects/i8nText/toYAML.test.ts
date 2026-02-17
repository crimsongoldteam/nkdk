import { describe, expect, it } from "vitest"
import { I8nTextPropertyRule } from "~/metadata/metadataFactory/properties/types"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext } from "~/tests/mockContext"
import { exportI8nTextDefaultToEnterprise, exportI8nTextToYAML } from "./toYAML"

const contextWithExportToYAML = {
  ...mockContext,
  exportToYAML: { toTyped: false },
}

describe("exportI8nTextToEnterprise", () => {
  describe("exportI8nTextToEnterprise", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const rule: I8nTextPropertyRule<any> = { type: "I8nText" }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.enterpriseFull)
    })
  })

  describe("exportI8nTextOtherToEnterprise", () => {
    it.each(i8nTextFixtures)("should export other: $name", (fixture) => {
      const rule: I8nTextPropertyRule<any> = { type: "I8nText", yamlPartialOthers: true }

      const result = exportI8nTextToYAML({ context: contextWithExportToYAML, rule, value: fixture.text })
      expect(result).toEqual(fixture.enterpriseOtherLanguages)
    })
  })

  describe("exportI8nTextDefaultToEnterprise", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToEnterprise(mockContext, fixture.text)
      expect(result).toEqual(fixture.enterpriseDefaultLanguage)
    })
  })
})
