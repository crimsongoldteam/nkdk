import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportFontToXML } from "./exportToXML"

describe("exportFontToXML", () => {
  it.each(fontEnterpriseFixtures)("should export $name font to XML", ({ font, xml }) => {
    const result = { Font: exportFontToXML(mockContext, font) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(xml)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
