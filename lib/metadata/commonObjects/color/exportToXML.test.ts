import { expect, it, describe } from "vitest"
import { exportColorToXML } from "./exportToXML"
import { importColorFromXML } from "./importFromXML"
import { Color, ColorXML } from "./types"
import { xmlExport } from "~/lib/xml/export/exporter"
import { xmlImport } from "~/lib/xml/import/importer"

describe("exportColorToXML", () => {
  it("should export color to XML", () => {
    const expectedResult = `<Color>style:NegativeTextColor</Color>`

    const mockColor: Color = "style:NegativeTextColor"

    const result = { Color: exportColorToXML(mockColor) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import color correctly (round-trip)", () => {
    const originalXml = `<Color>style:NegativeTextColor</Color>`

    const xml = xmlImport<{ Color: ColorXML }>(originalXml)
    const imported = importColorFromXML(xml.Color)
    const exported = exportColorToXML(imported)
    const resultXml = xmlExport({ Color: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
