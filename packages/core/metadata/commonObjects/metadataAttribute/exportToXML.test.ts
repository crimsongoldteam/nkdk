import { describe, expect, it, vi } from "vitest"
import {
  fullMetadataAttributes,
  minimalMetadataAttributes,
  withMinValueMetadataAttribute,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataAttributesToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe("exportMetadataAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("metadataAttribute/full.xml")

    const xmlData = exportMetadataAttributesToXML(mockContext, mockRule, fullMetadataAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("metadataAttribute/defaults.xml")

    const xmlData = exportMetadataAttributesToXML(mockContext, mockRule, minimalMetadataAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with min value", () => {
    const expectedResult = readXMLFileAsString("metadataAttribute/withMinValue.xml")

    const xmlData = exportMetadataAttributesToXML(mockContext, mockRule, withMinValueMetadataAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
