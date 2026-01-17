import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormattedI8nTextToXML } from "./exportToXML"

describe("exportFormattedI8nTextToXML", () => {
  formattedI8nTextFixtures.forEach((fixture) => {
    it(`should export: ${fixture.name}`, () => {
      const result = exportFormattedI8nTextToXML(mockСontext, fixture.text)

      const xml = result ? xmlExport({ Title: result }, false) : undefined

      expect(xml).toEqual(fixture.xml)
    })
  })
})
