import { describe, expect, it } from "vitest"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataCatalogFromXML } from "./fromXML"
import { MetadataCatalogXML } from "./types"

describe("importMetadataCatalogFromXML", () => {
  it("should import all nodes", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/full.xml")

    const result = importMetadataCatalogFromXML(mockContext, xmlData.MetaDataObject)

    expect(result).toEqual(full)
  })

  it("should import minimal nodes", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/minimal.xml")

    const result = importMetadataCatalogFromXML(mockContext, xmlData.MetaDataObject)

    expect(result).toEqual(minimal)
  })

  it("should import defaults nodes", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/defaults.xml")

    const result = importMetadataCatalogFromXML(mockContext, xmlData.MetaDataObject)

    expect(result).toEqual(minimal)
  })
})
