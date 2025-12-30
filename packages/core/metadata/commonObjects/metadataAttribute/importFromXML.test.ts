import { describe, expect, it } from "vitest"
import { full } from "~/tests/fixtures/metadataAttribute/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/full.xml")

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(full)
  })

  // it("should import multiple attributes from XML", () => {
  //   const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML[] }>("metadataAttribute/multiple.xml")
  //   const expectedResult = multipleAttributes

  //   const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

  //   expect(result).toEqual(expectedResult)
  // })
})
