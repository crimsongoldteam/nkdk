import { describe, expect, it } from "vitest"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importMetadataCatalogFromXML } from "./fromXML"
import { MetadataCatalogXML } from "./types"

describe("importMetadataCatalogFromXML", () => {
  it("should import all nodes", () => {
    const xmlData = readAndParseXMLFixture<{ MetaDataObject: MetadataCatalogXML }>(import.meta.url, "full.xml")

    const result = importMetadataCatalogFromXML(mockContextFromXML(), xmlData.MetaDataObject)

    expect(result).toEqual(full)
  })

  it("should import minimal nodes", () => {
    const xmlData = readAndParseXMLFixture<{ MetaDataObject: MetadataCatalogXML }>(import.meta.url, "minimal.xml")

    const result = importMetadataCatalogFromXML(mockContextFromXML(), xmlData.MetaDataObject)

    expect(result).toEqual(minimal)
  })
})
