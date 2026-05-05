import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import importContentFromXML from "~/xml/import/importer"
import { importTypeLinkFromXML } from "./fromXML"
import { TypeLink, TypeLinkXML } from "./types"

describe("importTypeLinkFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import TypeLink with numeric LinkItem", () => {
    const xmlData = readXMLFileAsString("typeLink/withNumericLinkItem.xml").trimEnd()

    const expectedResult: TypeLink = {
      dataPath: "AccountingRegister.Международный.StandardAttribute.Account",
      linkItem: 1,
    }

    const xml = importContentFromXML<{ TypeLink: TypeLinkXML }>(xmlData)

    const result = importTypeLinkFromXML(mockContextFromXML(), mockRule, xml.TypeLink)

    expect(result).toEqual(expectedResult)
  })
})
