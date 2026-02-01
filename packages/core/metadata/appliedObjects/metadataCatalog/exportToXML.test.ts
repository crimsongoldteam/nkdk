import { describe, expect, it, vi } from "vitest"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataCatalogToXML, MetadataCatalogContext } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

const mockMetadataCatalogContext: MetadataCatalogContext = {
  ...mockContext,
  context: {
    forms: [],
    templates: [],
    parentName: "Контрагенты",
  },
}

describe("exportMetadataCatalogToXML", () => {
  it("should export all nodes", () => {
    const expectedResult = readXMLFileAsString("metadataCatalog/full.xml")

    const xmlData = exportMetadataCatalogToXML(mockMetadataCatalogContext, full)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults nodes", () => {
    const mock = minimal

    const expectedResult = readXMLFileAsString("metadataCatalog/defaults.xml")

    const xmlData = exportMetadataCatalogToXML(mockMetadataCatalogContext, mock)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })
})
