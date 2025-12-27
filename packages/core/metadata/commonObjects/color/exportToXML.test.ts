import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { xmlExport } from "~/packages/core/xml/export/exporter"
import { xmlImport } from "~/packages/core/xml/import/importer"
import { exportColorToXML } from "./exportToXML"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"

describe("exportColorToXML", () => {
  it("should export color to XML", () => {
    const expectedResult = `<Color>style:NegativeTextColor</Color>`

    const mockColor: Color = "style:NegativeTextColor"

    const result = { Color: exportColorToXML(mockСontext, mockColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import color correctly (round-trip)", () => {
    const originalXml = `<Color>style:NegativeTextColor</Color>`

    const xml = xmlImport<{ Color: ColorXML }>(originalXml)
    const imported = importColorFromXML(mockСontext, xml.Color)
    const exported = exportColorToXML(mockСontext, imported)
    const resultXml = xmlExport({ Color: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
