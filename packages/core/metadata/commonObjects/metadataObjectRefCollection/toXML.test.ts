import { describe, expect, it } from "vitest"
import { multiple, single } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { xmlExport } from "../../../xml/export/exporter"
import { exportMetadataObjectRefCollectionToXML } from "./toXML"

describe("exportMetadataObjectRefCollectionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataObjectRefCollectionToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportMetadataObjectRefCollectionToXML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export with single value", () => {
    const expectedXml = readXMLFileAsString("metadataObjectRefCollection/single.xml")

    const result = exportMetadataObjectRefCollectionToXML(mockContext, mockRule, single)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with multiple values", () => {
    const expectedXml = readXMLFileAsString("metadataObjectRefCollection/multiple.xml")

    const result = exportMetadataObjectRefCollectionToXML(mockContext, mockRule, multiple)
    const xmlString = xmlExport({ BasedOn: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
