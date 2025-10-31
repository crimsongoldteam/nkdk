import { expect, it, describe } from "vitest"
import { exportColorToXML } from "./exportToXML"
import { importColorFromXML } from "./importFromXML"
import { TColor, TColorXML, ZColorXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportColorToXML", () => {
  it("should export color to XML", () => {
    const expectedResult = `<Color>style:NegativeTextColor</Color>`

    const mockColor: TColor = "style:NegativeTextColor"

    const result = { Color: exportColorToXML(mockColor) }
    const xmlString = xmlExport(result, z.object({ Color: ZColorXML }), false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportColorToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import color correctly (round-trip)", () => {
    const originalXml = `<Color>style:NegativeTextColor</Color>`

    const xml = xmlImport<{ Color: TColorXML }>(originalXml, z.object({ Color: ZColorXML }))
    const imported = importColorFromXML(xml.Color)
    const exported = exportColorToXML(imported)
    const resultXml = xmlExport({ Color: exported }, z.object({ Color: ZColorXML }), false)

    expect(resultXml).toEqual(originalXml)
  })
})
