import { describe, expect, it } from "vitest"
import { multipleCharacteristics } from "~/tests/fixtures/characteristicsDescription/multiple"
import { singleCharacteristic } from "~/tests/fixtures/characteristicsDescription/single"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCharacteristicsDescriptionsToXML } from "./toXML"

describe("exportCharacteristicsDescriptionToXML", () => {
  it("should export single characteristic", () => {
    const mockData = singleCharacteristic

    const expectedXml = readXMLFileAsString("characteristicsDescription/simple.xml")

    const result = exportCharacteristicsDescriptionsToXML(mockContext, mockRule, mockData)
    const xmlString = xmlExport({ Characteristics: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export multiple characteristics", () => {
    const mockData = multipleCharacteristics

    const expectedXml = readXMLFileAsString("characteristicsDescription/multiple.xml")

    const result = exportCharacteristicsDescriptionsToXML(mockContext, mockRule, mockData)
    const xmlString = xmlExport({ Characteristics: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
