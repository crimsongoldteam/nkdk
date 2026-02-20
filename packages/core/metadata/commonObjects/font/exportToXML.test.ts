import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportFontToXML } from "./exportToXML"

describe("exportFontToXML", () => {
  it.each(fontYAMLFixtures)("should export $name font to XML", ({ font, xml }) => {
    const result = { Font: exportFontToXML(mockContext, mockRule, font) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(xml)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
