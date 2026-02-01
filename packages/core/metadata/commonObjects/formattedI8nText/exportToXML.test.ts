import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormattedI8nTextToXML, exportFormattedI8nTextToXMLWithDefaultLanguage } from "./exportToXML"

describe("exportFormattedI8nTextToXML", () => {
  describe("exportFormattedI8nTextToXML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextToXML(mockContext, fixture.text)

        const xml = result ? xmlExport({ Title: result }, false) : undefined

        expect(xml).toEqual(fixture.xml)
      })
    })
  })
  describe("exportFormattedI8nTextToXMLWithDefaultLanguage", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextToXMLWithDefaultLanguage(mockContext, fixture.text)
        const xml = result ? xmlExport({ Title: result }, false) : undefined
        expect(xml).toEqual(fixture.xml)
      })
    })
  })
})
