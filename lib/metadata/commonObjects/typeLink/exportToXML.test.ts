import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportTypeLinkToXML } from "./exportToXML"
import { importTypeLinkFromXML } from "./importFromXML"
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

    const result = { TypeLink: exportTypeLinkToXML(mockConfigurationSettings, mockTypeLink) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportTypeLinkToXML(mockConfigurationSettings, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import type link correctly (round-trip)", () => {
    const originalXml = `<TypeLink>
\t<xr:DataPath>Ссылка</xr:DataPath>
\t<xr:LinkItem>0</xr:LinkItem>
</TypeLink>`

    const xml = xmlImport<{ TypeLink: TypeLinkXML }>(originalXml)
    const imported = importTypeLinkFromXML(mockConfigurationSettings, xml.TypeLink)
    const exported = exportTypeLinkToXML(mockConfigurationSettings, imported)
    const resultXml = xmlExport({ TypeLink: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
