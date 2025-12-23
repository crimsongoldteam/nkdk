import { describe, expect, it, vi } from "vitest"
import { multipleAttributes } from "~/lib/tests/fixtures/metadataAttribute/multiple"
import { singleAttribute } from "~/lib/tests/fixtures/metadataAttribute/single"
import { mockcontext } from "~/lib/tests/mockContext"
import { readXMLFileAsString } from "~/lib/tests/readAndParseXMLFile"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataAttributesToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "8f93c5cf-a2f6-4d79-ab40-83f36042b478"),
}))

describe("exportMetadataAttributesToXML", () => {
  it("should export single attribute to XML", () => {
    const expectedResult = readXMLFileAsString("metadataAttribute/single.xml")

    const xmlData = exportMetadataAttributesToXML(mockcontext, singleAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes to XML", () => {
    const expectedResult = readXMLFileAsString("metadataAttribute/multiple.xml")

    const xmlData = exportMetadataAttributesToXML(mockcontext, multipleAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
