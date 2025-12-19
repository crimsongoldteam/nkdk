import { readFileSync } from "fs"
import { join } from "path"
import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { simpleCatalog } from "~/tests/fixtures/metadataCatalog/simple"
import { withAttributesCatalog } from "~/tests/fixtures/metadataCatalog/withAttributes"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalogXML } from "./types"

describe("importMetadataCatalogFromXML", () => {
  it("should import metadata catalog from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataCatalog/simple.xml"), "utf-8")

    const expectedResult = simpleCatalog

    const xmlData = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(xml)

    expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(xmlData.MetaDataObject, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should import metadata catalog with attributes from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataCatalog/withAttributes.xml"), "utf-8")

    const expectedResult = withAttributesCatalog

    const xmlData = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(xml)

    expect(assertEquals<MetadataCatalogXML>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(xmlData.MetaDataObject, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
