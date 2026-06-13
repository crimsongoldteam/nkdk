import { describe, expect, it } from "vitest"
import { multiple, single } from "~/metadata/commonObjects/metadataValueCollection/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataValueCollectionToXML } from "./toXML"

describe("exportMetadataValueCollectionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataValueCollectionToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataValueCollectionToXML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const expectedXml = readXMLFileAsString("metadataValueCollection/single.xml")

    const result = exportMetadataValueCollectionToXML(mockContext, mockRule, single)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with multiple values", () => {
    const expectedXml = readXMLFileAsString("metadataValueCollection/multiple.xml")

    const result = exportMetadataValueCollectionToXML(mockContext, mockRule, multiple)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
