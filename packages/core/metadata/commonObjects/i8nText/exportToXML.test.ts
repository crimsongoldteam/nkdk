import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "./exportToXML"

describe("exportI8nTextToXML", () => {
  describe("exportI8nTextToXML", () => {
    i8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportI8nTextToXML(mockContext, mockRule, fixture.text)

        const xml = result ? xmlExport({ Title: result }, false) : undefined

        expect(xml).toEqual(fixture.xml)
      })
    })
  })

  describe("exportI8nTextToXMLWithDefaultLanguage", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const result = exportI8nTextToXMLWithDefaultLanguage(mockContext, fixture.text)
      const xml = result ? xmlExport({ Title: result }, false) : undefined
      expect(xml).toEqual(fixture.xml)
    })
  })
})
