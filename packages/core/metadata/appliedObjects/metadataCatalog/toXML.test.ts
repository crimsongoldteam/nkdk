import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataCatalogToXML } from "./toXML"

const mockMetadataCatalogContext: ConfigurationContextWithExportToXML = {
  ...mockContextToXML(),
  context: {
    forms: [],
    templates: [],
    parentName: "Контрагенты",
  },
}

describe("exportMetadataCatalogToXML", () => {
  it("should export all nodes", () => {
    const expectedResult = readXMLFileAsString("metadataCatalog/full.xml")

    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: full,
      referenceData: undefined,
    })

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults nodes", () => {
    const mock = minimal

    const expectedResult = readXMLFileAsString("metadataCatalog/defaults.xml")

    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: mock,
      referenceData: undefined,
    })

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })
})
