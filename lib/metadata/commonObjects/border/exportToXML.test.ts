import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/lib"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportBorderToXML } from "./exportToXML"
import { importBorderFromXML } from "./importFromXML"
import { Border, BorderXML } from "./types"

describe("exportBorderToXML", () => {
  it("should export border by ref", () => {
    const mockBorder: Border = {
      ref: "style:ControlBorder",
    }

    const expectedResult = `<Border ref="style:ControlBorder"/>`

    const result = { Border: exportBorderToXML(mockcontext, mockBorder) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export border with width and style", () => {
    const mockBorder: Border = {
      width: 1,
      controlBorderType: "Indented",
    }

    const expectedResult = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const result = { Border: exportBorderToXML(mockcontext, mockBorder) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBorderToXML(mockcontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import border by ref correctly (round-trip)", () => {
    const originalXml = `<Border ref="style:ControlBorder"/>`

    const xml = xmlImport<{ Border: BorderXML }>(originalXml)
    const imported = importBorderFromXML(mockcontext, xml.Border)
    const exported = exportBorderToXML(mockcontext, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import border with width and style correctly (round-trip)", () => {
    const originalXml = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const xml = xmlImport<{ Border: BorderXML }>(originalXml)
    const imported = importBorderFromXML(mockcontext, xml.Border)
    const exported = exportBorderToXML(mockcontext, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
