import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import {
  complexTypeDescription,
  dateTypeDescription,
  numberNonNegativeTypeDescription,
  spreadsheetDocumentTypeDescription,
  stringUnlimitedTypeDescriptionWithoutQualifiers,
  stringVariableTypeDescription,
  threeTypesTypeDescription,
  typeSetTypeDescription,
} from "../../../tests/fixtures/typeDescription/data"
import { importTypeDescriptionFromXML } from "./importFromXML"
import { TypeDescriptionXML } from "./types"

describe("importTypeDescriptionFromXML", () => {
  it("should import undefined type description from XML", () => {
    const result = importTypeDescriptionFromXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import string type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/stringType.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(stringVariableTypeDescription)
  })

  it("should import unlimited string type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/stringUnlimited.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(stringUnlimitedTypeDescriptionWithoutQualifiers)
  })

  it("should import number type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/numberType.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(numberNonNegativeTypeDescription)
  })

  it("should import date type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/dateTimeType.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(dateTypeDescription)
  })

  it("should import complex type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/complexType.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(complexTypeDescription)
  })

  it("should import three types from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/threeTypes.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(threeTypesTypeDescription)
  })

  it("should import SpreadsheetDocument from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>(
      "typeDescription/spreadsheetDocumentType.xml"
    )

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(spreadsheetDocumentTypeDescription)
  })

  it("should import type set from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/typeSet.xml")

    const result = importTypeDescriptionFromXML(mockСontext, xmlData.TypeDescription)

    expect(result).toEqual(typeSetTypeDescription)
  })
})
