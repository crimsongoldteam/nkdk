import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportFontToXML } from "./exportToXML"

describe("exportFontToXML", () => {
  it.each(fontEnterpriseFixtures)("should export $name font to XML", ({ font, xml }) => {
    const result = { Font: exportFontToXML(mockСontext, font) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(xml)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
