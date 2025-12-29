import { describe, expect, it } from "vitest"
import { allParameters, multiple, necessaryParameters } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportStandardAttributeDescriptionsToXML } from "./exportToXML"

describe("exportStandardAttributeDescriptionsToXML", () => {
  it("should export with default values when data is undefined", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockСontext, undefined, ["PredefinedDataName"])
    const xmlString = xmlExport({ StandardAttributes: result }, false)
    expect(xmlString).toEqual(expectedXml)
  })

  it("should export all parameters", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/allParameters.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockСontext, allParameters, ["PredefinedDataName"])
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export XML with default values if only name is present", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")
    const result = exportStandardAttributeDescriptionsToXML(mockСontext, necessaryParameters, ["PredefinedDataName"])

    const xmlString = xmlExport({ StandardAttributes: result }, false)
    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with multiple values", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/multiple.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockСontext, multiple, ["PredefinedDataName", "Predefined"])
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with default values", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockСontext, [], ["PredefinedDataName"])
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
