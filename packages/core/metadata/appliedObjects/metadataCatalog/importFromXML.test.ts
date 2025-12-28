import { describe, expect, it } from "vitest"
import { simpleCatalog } from "~/tests/fixtures/metadataCatalog/simple"
import { withAttributesCatalog, withCommands } from "~/tests/fixtures/metadataCatalog/withAttributes"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalogXML } from "./types"
describe("importMetadataCatalogFromXML", () => {
  it("should import metadata catalog from XML", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/simple.xml")

    const expectedResult = simpleCatalog

    // expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata catalog with attributes from XML", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/withAttributes.xml")

    const expectedResult = withAttributesCatalog

    // expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata catalog with commands from XML", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/withCommands.xml")

    const result = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)

    expect(result).toEqual(withCommands)
  })
})
