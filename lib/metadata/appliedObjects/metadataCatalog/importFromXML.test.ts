import { describe, expect, it } from "vitest"
import { simpleCatalog } from "~/lib/tests/fixtures/metadataCatalog/simple"
import { withAttributesCatalog } from "~/lib/tests/fixtures/metadataCatalog/withAttributes"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalogXML } from "./types"

describe("importMetadataCatalogFromXML", () => {
  it("should import metadata catalog from XML", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/simple.xml")

    const expectedResult = simpleCatalog

    // expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(mockConfigurationSettings, xmlData.MetaDataObject)

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata catalog with attributes from XML", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/withAttributes.xml")

    const expectedResult = withAttributesCatalog

    // expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(mockConfigurationSettings, xmlData.MetaDataObject)

    expect(result).toEqual(expectedResult)
  })
})
