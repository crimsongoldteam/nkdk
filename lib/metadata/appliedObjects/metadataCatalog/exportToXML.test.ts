import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { simpleCatalog } from "~/lib/tests/fixtures/metadataCatalog/simple"
import { withAttributesCatalog } from "~/lib/tests/fixtures/metadataCatalog/withAttributes"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataCatalogToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportMetadataCatalogToXML", () => {
  it("should export metadata catalog to XML", () => {
    const mock = simpleCatalog

    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/metadataCatalog/simple.xml"), "utf-8")

    const xmlData = exportMetadataCatalogToXML(mock, mockConfigurationSettings)

    // expect(assertEquals<MetadataCatalogXML>(xmlData)).toEqual(xmlData)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })

  it("should export metadata catalog with attributes to XML", () => {
    const mock = withAttributesCatalog

    const expectedResult = readFileSync(
      join(process.cwd(), "tests/fixtures/metadataCatalog/withAttributes.xml"),
      "utf-8"
    )

    const xmlData = exportMetadataCatalogToXML(mock, mockConfigurationSettings)

    // expect(assertEquals<MetadataCatalogXML>(xmlData)).toEqual(xmlData)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })
})
