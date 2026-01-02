import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { exportPictureToXML } from "./exportToXML"
import { importPictureFromXML } from "./importFromXML"
import { Picture, PictureXML } from "./types"
describe("exportPictureToXML", () => {
  it("should export standard picture to XML", () => {
    const mockPicture: Picture = {
      ref: "BusinessProcess",
      type: "StandardPicture",
      loadTransparent: true,
    }

    const expectedResult = `<Picture>
\t<xr:Ref>StdPicture.BusinessProcess</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const result = { Picture: exportPictureToXML(mockСontext, mockPicture) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export common picture to XML", () => {
    const mockPicture: Picture = {
      ref: "ОбщаяКартинка1",
      type: "CommonPicture",
      loadTransparent: true,
    }

    const expectedResult = `<Picture>
\t<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const result = { Picture: exportPictureToXML(mockСontext, mockPicture) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportPictureToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import standard picture correctly (round-trip)", () => {
    const originalXml = `<Picture>
\t<xr:Ref>StdPicture.BusinessProcess</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const xml = importContentFromXML<{ Picture: PictureXML }>(originalXml)
    const imported = importPictureFromXML(mockСontext, xml.Picture)
    const exported = exportPictureToXML(mockСontext, imported)
    const resultXml = xmlExport({ Picture: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import common picture correctly (round-trip)", () => {
    const originalXml = `<Picture>
\t<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const xml = importContentFromXML<{ Picture: PictureXML }>(originalXml)
    const imported = importPictureFromXML(mockСontext, xml.Picture)
    const exported = exportPictureToXML(mockСontext, imported)
    const resultXml = xmlExport({ Picture: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
