import { describe, expect, it } from "vitest"
import { multipleAttributes } from "~/tests/fixtures/metadataAttribute/multiple"
import { singleAttributes } from "~/tests/fixtures/metadataAttribute/single"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should import single attribute from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/single.xml")
    const expectedResult = singleAttributes

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple attributes from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML[] }>("metadataAttribute/multiple.xml")
    const expectedResult = multipleAttributes

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(expectedResult)
  })
})
