import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importTypeDescriptionFromXML } from "./importFromXML"
import { TypeDescription, TypeDescriptionXML } from "./types"

describe("importTypeDescriptionFromXML", () => {
  it("should import string type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/stringType.xml")

    const mockResult: TypeDescription = {
      type: ["string"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import number type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/numberType.xml")

    const mockResult: TypeDescription = {
      type: ["decimal"],
      numberQualifiers: {
        digits: 10,
        fractionDigits: 2,
        allowedSign: "Nonnegative",
      },
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import date type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/dateTimeType.xml")

    const mockResult: TypeDescription = {
      type: ["dateTime"],
      dateQualifiers: { dateFractions: "Date" },
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import complex type from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/complexType.xml")

    const mockResult: TypeDescription = {
      type: ["boolean", "EnumRef.Статусы"],
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import three types from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/threeTypes.xml")

    const mockResult: TypeDescription = {
      type: ["CatalogRef.Сотрудники", "CatalogRef.Контрагенты", "CatalogRef.Пользователи"],
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import SpreadsheetDocument from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>(
      "typeDescription/spreadsheetDocumentType.xml"
    )

    const mockResult: TypeDescription = {
      type: ["SpreadsheetDocument"],
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })

  it("should import type set from XML", () => {
    const xmlData = readAndParseXMLFile<{ TypeDescription?: TypeDescriptionXML }>("typeDescription/typeSet.xml")

    const mockResult: TypeDescription = {
      type: ["Characteristic.ДополнительныеРеквизитыИСведения"],
    }

    // expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(mockcontext, xmlData.TypeDescription)

    expect(result).toEqual(mockResult)
  })
})
