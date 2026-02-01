import { describe, expect, it } from "vitest"
import { multiple, single } from "~/tests/fixtures/metadataValueCollection/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataValueCollectionToXML } from "./exportToXML"

describe("exportMetadataValueCollectionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataValueCollectionToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataValueCollectionToXML(mockContext, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const expectedXml = readXMLFileAsString("metadataValueCollection/single.xml")

    const result = exportMetadataValueCollectionToXML(mockContext, single)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with multiple values", () => {
    const expectedXml = readXMLFileAsString("metadataValueCollection/multiple.xml")

    const result = exportMetadataValueCollectionToXML(mockContext, multiple)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
