import { expect, it, describe } from "vitest"
import { exportTypeLinkToXML } from "./exportToXML"
import { importTypeLinkFromXML } from "./importFromXML"
import { TTypeLink, TTypeLinkXML, ZTypeLinkXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportTypeLinkToXML", () => {
  it("should export type link to XML", () => {
    const mockTypeLink: TTypeLink = {
      dataPath: "Ссылка",
      linkItem: 0,
    }

    const expectedResult = `<TypeLink xr:DataPath="Ссылка" xr:LinkItem="0"/>`

    const result = { TypeLink: exportTypeLinkToXML(mockTypeLink) }
    const xmlString = xmlExport(result, z.object({ TypeLink: ZTypeLinkXML }), false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportTypeLinkToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import type link correctly (round-trip)", () => {
    const originalXml = `<TypeLink xr:DataPath="Ссылка" xr:LinkItem="0"/>`

    const xml = xmlImport<{ TypeLink: TTypeLinkXML }>(originalXml, z.object({ TypeLink: ZTypeLinkXML }))
    const imported = importTypeLinkFromXML(xml.TypeLink)
    const exported = exportTypeLinkToXML(imported)
    const resultXml = xmlExport({ TypeLink: exported }, z.object({ TypeLink: ZTypeLinkXML }), false)

    expect(resultXml).toEqual(originalXml)
  })
})

