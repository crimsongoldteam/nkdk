import { readFileSync } from "fs"
import { join } from "path"
import { assert } from "typia"
import { describe, expect, it, vi } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataCatalogToXML } from "./exportToXML"
import { MetadataCatalogXML } from "./types"
import { simpleCatalog } from "~/tests/fixtures/metadataCatalog/simple"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportMetadataCatalogToXML", () => {
  it("should export metadata catalog to XML", () => {
    const mock = simpleCatalog

    const expectedResult = readFileSync(join(process.cwd(), "tests/fixtures/metadataCatalog/simple.xml"), "utf-8")

    const xmlData = exportMetadataCatalogToXML(mock, mockConfigurationSettings)

    expect(assert<MetadataCatalogXML>(xmlData)).toEqual(xmlData)

    const result = xmlExport({ MetaDataObject: xmlData })

    expect(result).toEqual(expectedResult)
  })
})
