import { describe, expect, it, vi } from "vitest"
import { simpleCatalog } from "~/tests/fixtures/metadataCatalog/simple"
import { withAttributesCatalog } from "~/tests/fixtures/metadataCatalog/withAttributes"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataCatalogToXML } from "./exportToXML"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalogXML } from "./types"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportMetadataCatalogToXML", () => {
  it("should export metadata catalog to XML", () => {
    const mock = simpleCatalog

    const expectedResult = readXMLFileAsString("metadataCatalog/simple.xml")

    const xmlData = exportMetadataCatalogToXML(mockСontext, mock)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata catalog with attributes to XML", () => {
    const mock = withAttributesCatalog

    const expectedResult = readXMLFileAsString("metadataCatalog/withAttributes.xml")

    const xmlData = exportMetadataCatalogToXML(mockСontext, mock)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })
})

describe("importMetadataCatalogFromXML - exportMetadataCatalogToXML roundtrip", () => {
  it("should roundtrip metadata catalog from XML to XML", () => {
    const originalXML = readXMLFileAsString("metadataCatalog/simple.xml")
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/simple.xml")

    const importedCatalog = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)
    expect(importedCatalog).toBeDefined()

    const exportedXMLData = exportMetadataCatalogToXML(mockСontext, importedCatalog!)
    const exportedXML = xmlExport({ MetaDataObject: exportedXMLData })

    expect(exportedXML).toEqual(originalXML)
  })

  it("should roundtrip metadata catalog with attributes from XML to XML", () => {
    const originalXML = readXMLFileAsString("metadataCatalog/withAttributes.xml")
    const xmlData = readAndParseXMLFile<{ MetaDataObject: MetadataCatalogXML }>("metadataCatalog/withAttributes.xml")

    const importedCatalog = importMetadataCatalogFromXML(mockСontext, xmlData.MetaDataObject)
    expect(importedCatalog).toBeDefined()

    const exportedXMLData = exportMetadataCatalogToXML(mockСontext, importedCatalog!)
    const exportedXML = xmlExport({ MetaDataObject: exportedXMLData })

    expect(exportedXML).toEqual(originalXML)
  })
})
