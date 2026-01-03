import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import {
  complexTypeDescription,
  dateTypeDescription,
  definedTypeDescription,
  numberNonNegativeTypeDescription,
  stringUnlimitedTypeDescriptionWithoutQualifiers,
  stringVariableTypeDescription,
} from "../../../tests/fixtures/typeDescription/data"
import { exportTypeDescriptionToXML } from "./exportToXML"

describe("exportTypeDescriptionToXML", () => {
  //#region Undefined
  it("should export undefined type description to XML", () => {
    const result = exportTypeDescriptionToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })
  //#endregion

  //#region String
  it("should export string type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/stringType.xml")

    const result = exportTypeDescriptionToXML(mockСontext, stringVariableTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export unlimited string type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/stringUnlimited.xml")

    const result = exportTypeDescriptionToXML(mockСontext, stringUnlimitedTypeDescriptionWithoutQualifiers)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
  //#endregion

  //#region Number
  it("should export number type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/numberType.xml")

    const result = exportTypeDescriptionToXML(mockСontext, numberNonNegativeTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
  //#endregion

  //#region Date
  it("should export date type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/dateTimeType.xml")

    const result = exportTypeDescriptionToXML(mockСontext, dateTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
  //#endregion

  //#region Complex
  it("should export complex type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/complexType.xml")

    const result = exportTypeDescriptionToXML(mockСontext, complexTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
  //#endregion

  //#region Defined
  it("should export defined type to XML", () => {
    const expectedXml = readXMLFileAsString("typeDescription/definedType.xml")

    const result = exportTypeDescriptionToXML(mockСontext, definedTypeDescription)
    const xmlString = xmlExport({ TypeDescription: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
  //#endregion
})
