import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readXMLFileAsString } from "~/lib/tests/readAndParseXMLFile"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportTypeDescriptionToXML } from "./exportToXML"
import { TypeDescription } from "./types"

describe("exportTypeDescriptionToXML", () => {
  it("should export string type to XML", () => {
    const mockTypeDescription: TypeDescription = {
      type: ["string"],
      stringQualifiers: {
        length: 10,
        allowedLength: "Variable",
      },
    }

    const expectedXml = readXMLFileAsString("typeDescription/stringType.xml")

    const result = exportTypeDescriptionToXML(mockConfigurationSettings, mockTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export number type to XML", () => {
    const mockTypeDescription: TypeDescription = {
      type: ["decimal"],
      numberQualifiers: {
        digits: 10,
        fractionDigits: 2,
        allowedSign: "Nonnegative",
      },
    }

    const expectedXml = readXMLFileAsString("typeDescription/numberType.xml")

    const result = exportTypeDescriptionToXML(mockConfigurationSettings, mockTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export date type to XML", () => {
    const mockTypeDescription: TypeDescription = {
      type: ["dateTime"],
      dateQualifiers: {
        dateFractions: "Date",
      },
    }

    const expectedXml = readXMLFileAsString("typeDescription/dateTimeType.xml")

    const result = exportTypeDescriptionToXML(mockConfigurationSettings, mockTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export complex type to XML", () => {
    const mockTypeDescription: TypeDescription = {
      type: ["boolean", "EnumRef.Статусы"],
    }

    const expectedXml = readXMLFileAsString("typeDescription/complexType.xml")

    const result = exportTypeDescriptionToXML(mockConfigurationSettings, mockTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
