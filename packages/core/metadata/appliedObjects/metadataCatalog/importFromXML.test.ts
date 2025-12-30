import { describe, expect, it } from "vitest"
import { full } from "~/tests/fixtures/metadataCatalog/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalogXML } from "./types"
describe("importMetadataCatalogFromXML", () => {
  it("should import all nodes", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/full.xml")

    const result = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)

    expect(result).toEqual(full)
  })
})
