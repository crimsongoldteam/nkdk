import { describe, expect, it } from "vitest"
import { StandardAttributeDescriptionPropertyRule } from "~/metadata/metadataFactory"
import { all, minimal, multiple } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportStandardAttributeDescriptionsToXML } from "./toXML"

describe("exportStandardAttributeDescriptionsToXML", () => {
  it("should export with default values when data is undefined", () => {
    const rule: StandardAttributeDescriptionPropertyRule<any> = {
      type: "StandardAttributeDescription",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockContext, rule, undefined)
    const xmlString = xmlExport({ StandardAttributes: result }, false)
    expect(xmlString).toEqual(expectedXml)
  })

  it("should export all parameters", () => {
    const rule: StandardAttributeDescriptionPropertyRule<any> = {
      type: "StandardAttributeDescription",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const expectedXml = readXMLFileAsString("standartAttributeDescription/all.xml")

    const result = exportStandardAttributeDescriptionsToXML(mockContext, rule, all)
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export XML with default values if only name is present", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")
    const rule: StandardAttributeDescriptionPropertyRule<any> = {
      type: "StandardAttributeDescription",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const result = exportStandardAttributeDescriptionsToXML(mockContext, rule, minimal)

    const xmlString = xmlExport({ StandardAttributes: result }, false)
    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with multiple values", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/multiple.xml")

    const rule: StandardAttributeDescriptionPropertyRule<any> = {
      type: "StandardAttributeDescription",
      standartAttributeNames: ["PredefinedDataName", "Predefined"],
    }
    const result = exportStandardAttributeDescriptionsToXML(mockContext, rule, multiple)
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export with default values", () => {
    const expectedXml = readXMLFileAsString("standartAttributeDescription/default.xml")

    const rule: StandardAttributeDescriptionPropertyRule<any> = {
      type: "StandardAttributeDescription",
      standartAttributeNames: ["PredefinedDataName"],
    }
    const result = exportStandardAttributeDescriptionsToXML(mockContext, rule, undefined)
    const xmlString = xmlExport({ StandardAttributes: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
