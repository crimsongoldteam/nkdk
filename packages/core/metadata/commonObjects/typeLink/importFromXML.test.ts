import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import xmlImport from "~/xml/import/importer"
import { importTypeLinkFromXML } from "./importFromXML"
import { TypeLink, TypeLinkXML } from "./types"

describe("importTypeLinkFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import TypeLink with numeric LinkItem", () => {
    const xmlData = readXMLFileAsString("typeLink/withNumericLinkItem.xml").trimEnd()

    const expectedResult: TypeLink = {
      dataPath: "Реквизит1",
      linkItem: 1,
    }

    const xml = xmlImport<{ TypeLink: TypeLinkXML }>(xmlData)

    const result = importTypeLinkFromXML(mockСontext, xml.TypeLink)

    expect(result).toEqual(expectedResult)
  })
})
