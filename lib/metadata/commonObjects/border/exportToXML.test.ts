import { expect, it, describe } from "vitest"
import { exportBorderToXML } from "./exportToXML"
import { importBorderFromXML } from "./importFromXML"
import { TBorder, TBorderXML, ZBorderXML } from "./types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportBorderToXML", () => {
  it("should export border by ref", () => {
    const mockBorder: TBorder = {
      ref: "style:ControlBorder",
    }

    const expectedResult = `<Border ref="style:ControlBorder"/>`

    const result = { Border: exportBorderToXML(mockBorder) }
    const xmlString = xmlExport(result, z.object({ Border: ZBorderXML }), false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export border with width and style", () => {
    const mockBorder: TBorder = {
      width: 1,
      controlBorderType: SE.ZControlBorderType.enum.Indented,
    }

    const expectedResult = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const result = { Border: exportBorderToXML(mockBorder) }
    const xmlString = xmlExport(result, z.object({ Border: ZBorderXML }), false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportBorderToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import border by ref correctly (round-trip)", () => {
    const originalXml = `<Border ref="style:ControlBorder"/>`

    const xml = xmlImport<{ Border: TBorderXML }>(originalXml, z.object({ Border: ZBorderXML }))
    const imported = importBorderFromXML(xml.Border)
    const exported = exportBorderToXML(imported)
    const resultXml = xmlExport({ Border: exported }, z.object({ Border: ZBorderXML }), false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import border with width and style correctly (round-trip)", () => {
    const originalXml = `<Border width="1">
	<v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
</Border>`

    const xml = xmlImport<{ Border: TBorderXML }>(originalXml, z.object({ Border: ZBorderXML }))
    const imported = importBorderFromXML(xml.Border)
    const exported = exportBorderToXML(imported)
    const resultXml = xmlExport({ Border: exported }, z.object({ Border: ZBorderXML }), false)

    expect(resultXml).toEqual(originalXml)
  })
})

