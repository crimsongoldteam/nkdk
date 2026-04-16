import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importMetadataCatalogFromXML } from "./fromXML"
import type { MetadataCatalogXML } from "./types"
import { exportMetadataCatalogToXML } from "./toXML"

const mockMetadataCatalogContext: ConfigurationContextWithExportToXML = {
  ...mockContextToXML(),
  context: {
    forms: [],
    templates: [],
    parentName: "СправочникПолный",
  },
}

describe("exportMetadataCatalogToXML", () => {
  it("should export all nodes", () => {
    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: full,
      referenceData: undefined,
    })

    const result = xmlExport({ MetaDataObject: xmlData })
    const parsed = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(result)
    const roundTrip = importMetadataCatalogFromXML(mockContextFromXML(), parsed.MetaDataObject)

    expect(roundTrip).toEqual(full)
  })

  it("should export defaults nodes", () => {
    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: minimal,
      referenceData: undefined,
    })

    const result = xmlExport({ MetaDataObject: xmlData })
    const parsed = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(result)
    const roundTrip = importMetadataCatalogFromXML(mockContextFromXML(), parsed.MetaDataObject)

    expect(roundTrip).toEqual(minimal)
  })
})
