import { describe, expect, it } from "vitest"
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
import { mockContext, mockContextFromXML, mockRule } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importBorderFromXML } from "./fromXML"
import { exportBorderToXML } from "./toXML"
import { Border, BorderXML } from "./types"

describe("exportBorderToXML", () => {
  it("should export border by ref", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const result = { Border: exportBorderToXML(mockContext, mockRule, fixture!.border) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(fixture!.xml)
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
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const xml = importContentFromXML<{ Border: BorderXML }>(fixture!.xml!)
    const imported = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)
    const exported = exportBorderToXML(mockContext, mockRule, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(fixture!.xml)
  })

  it("should export and import border with width and style correctly (round-trip)", () => {
    const originalXml = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const xml = importContentFromXML<{ Border: BorderXML }>(originalXml)
    const imported = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)
    const exported = exportBorderToXML(mockContext, mockRule, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
