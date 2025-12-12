import { expect, it, describe } from "vitest"
import { exportTypeLinkToXML } from "./exportToXML"
import { importTypeLinkFromXML } from "./importFromXML"
import { xmlExport, xmlImport } from "~/lib"
import { TypeLink, TypeLinkXML } from "./types"

describe("exportTypeLinkToXML", () => {
  it("should export type link to XML", () => {
    const mockTypeLink: TypeLink = {
      dataPath: "Ссылка",
      linkItem: 0,
    }

    const expectedResult = `<TypeLink>
\t<xr:DataPath>Ссылка</xr:DataPath>
\t<xr:LinkItem>0</xr:LinkItem>
</TypeLink>`

    const result = { TypeLink: exportTypeLinkToXML(mockTypeLink) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportTypeLinkToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import type link correctly (round-trip)", () => {
    const originalXml = `<TypeLink>
\t<xr:DataPath>Ссылка</xr:DataPath>
\t<xr:LinkItem>0</xr:LinkItem>
</TypeLink>`

    const xml = xmlImport<{ TypeLink: TypeLinkXML }>(originalXml)
    const imported = importTypeLinkFromXML(xml.TypeLink)
    const exported = exportTypeLinkToXML(imported)
    const resultXml = xmlExport({ TypeLink: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
