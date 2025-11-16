import { expect, it, describe } from "vitest"
import { exportPictureToXML } from "./exportToXML"
import { importPictureFromXML } from "./importFromXML"
import { TPicture, TPictureXML, ZPictureXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportPictureToXML", () => {
  it("should export standard picture to XML", () => {
    const mockPicture: TPicture = {
      ref: "BusinessProcess",
      type: "StandardPicture",
      loadTransparent: true,
    }

    const expectedResult = `<Picture>
\t<xr:Ref>StdPicture.BusinessProcess</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const result = { Picture: exportPictureToXML(mockPicture) }
    const xmlString = xmlExport(
      result,
      z.object({ Picture: ZPictureXML }),
      false
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export common picture to XML", () => {
    const mockPicture: TPicture = {
      ref: "ОбщаяКартинка1",
      type: "CommonPicture",
      loadTransparent: true,
    }

    const expectedResult = `<Picture>
\t<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const result = { Picture: exportPictureToXML(mockPicture) }
    const xmlString = xmlExport(
      result,
      z.object({ Picture: ZPictureXML }),
      false
    )

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportPictureToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import standard picture correctly (round-trip)", () => {
    const originalXml = `<Picture>
\t<xr:Ref>StdPicture.BusinessProcess</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const xml = xmlImport<{ Picture: TPictureXML }>(
      originalXml,
      z.object({ Picture: ZPictureXML })
    )
    const imported = importPictureFromXML(xml.Picture)
    const exported = exportPictureToXML(imported)
    const resultXml = xmlExport(
      { Picture: exported },
      z.object({ Picture: ZPictureXML }),
      false
    )

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import common picture correctly (round-trip)", () => {
    const originalXml = `<Picture>
\t<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref>
\t<xr:LoadTransparent>true</xr:LoadTransparent>
</Picture>`

    const xml = xmlImport<{ Picture: TPictureXML }>(
      originalXml,
      z.object({ Picture: ZPictureXML })
    )
    const imported = importPictureFromXML(xml.Picture)
    const exported = exportPictureToXML(imported)
    const resultXml = xmlExport(
      { Picture: exported },
      z.object({ Picture: ZPictureXML }),
      false
    )

    expect(resultXml).toEqual(originalXml)
  })
})
