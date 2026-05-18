import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { typedI8nTextRule, typedI8nTextValue } from "./__fixtures__/data"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "./toXML"

describe("exportI8nTextToXML", () => {
  describe("exportI8nTextToXML", () => {
    i8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportI8nTextToXML(mockContext, mockRule, fixture.text)

        const xml = result ? xmlExport({ Title: result }, false) : undefined

        expect(xml).toEqual(fixture.xml)
      })
    })

    it("exports empty default-language item by default", () => {
      const result = exportI8nTextToXML(mockContext, mockRule, { items: { ru: "" } })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual(
        "<Title>\n" +
          "\t<v8:item>\n" +
          "\t\t<v8:lang>ru</v8:lang>\n" +
          "\t\t<v8:content/>\n" +
          "\t</v8:item>\n" +
          "</Title>"
      )
    })

    it("exports empty text as raw XML when rule opts in", () => {
      const result = exportI8nTextToXML(mockContext, { ...mockRule, emptyAsRawXML: true }, { items: { ru: "" } })
      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual("<Title/>")
    })
  })

  describe("exportI8nTextToXMLWithDefaultLanguage", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const result = exportI8nTextToXMLWithDefaultLanguage(mockContext, mockRule, fixture.text)
      const xml = result ? xmlExport({ Title: result }, false) : undefined
      expect(xml).toEqual(fixture.xml)
    })
  })

  describe("typedXML", () => {
    it("выгружает v8:LocalStringType с xsi:type", () => {
      const { result, expectedResult } = testExportPropertyToXML({
        rule: typedI8nTextRule,
        value: typedI8nTextValue,
        xmlRootTag: "Title",
        path: "typed.xml",
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    })
  })
})
