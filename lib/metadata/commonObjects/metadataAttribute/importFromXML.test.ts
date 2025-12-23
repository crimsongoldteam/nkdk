import { describe, expect, it } from "vitest"
import { multipleAttributes } from "~/lib/tests/fixtures/metadataAttribute/multiple"
import { singleAttribute } from "~/lib/tests/fixtures/metadataAttribute/single"
import { mockСontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should import single attribute from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/single.xml")
    const expectedResult = singleAttribute

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple attributes from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML[] }>("metadataAttribute/multiple.xml")
    const expectedResult = multipleAttributes

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(expectedResult)
  })

  it("should ignore nil min value", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/withMinValue.xml")
    const expectedResult = singleAttribute

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(expectedResult)
  })
})
