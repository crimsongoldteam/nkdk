import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importBorderFromXML } from "./fromXML"
import { exportBorderToXML } from "./toXML"
import { Border, BorderXML } from "./types"

describe("exportBorderToXML", () => {
  it("should export border by ref", () => {
    const mockBorder: Border = {
      ref: "style:ControlBorder",
    }

    const expectedResult = `<Border ref="style:ControlBorder"/>`

    const result = { Border: exportBorderToXML(mockContext, mockRule, mockBorder) }
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

    const result = { Border: exportBorderToXML(mockContext, mockRule, mockBorder) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBorderToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import border by ref correctly (round-trip)", () => {
    const originalXml = `<Border ref="style:ControlBorder"/>`

    const xml = importContentFromXML<{ Border: BorderXML }>(originalXml)
    const imported = importBorderFromXML(mockContext, mockRule, xml.Border)
    const exported = exportBorderToXML(mockContext, mockRule, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import border with width and style correctly (round-trip)", () => {
    const originalXml = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const xml = importContentFromXML<{ Border: BorderXML }>(originalXml)
    const imported = importBorderFromXML(mockContext, mockRule, xml.Border)
    const exported = exportBorderToXML(mockContext, mockRule, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
