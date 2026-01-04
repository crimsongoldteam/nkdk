import { describe, expect, it } from "vitest"
import {
  enumChoiceParameter,
  fixedArrayChoiceParameter,
  formBooleanChoiceParameter,
  formEnumChoiceParameter,
  multipleChoiceParameters,
  singleChoiceParameter,
  stringChoiceParameter,
  withoutOneValueChoiceParameter,
  withoutValueChoiceParameter,
} from "~/tests/fixtures/choiceParameters/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceParametersToXML } from "./exportToXML"

describe("exportChoiceParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export choice parameters with single parameter correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/single.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, singleChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with multiple parameters correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/multiple.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, multipleChoiceParameters)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, enumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with fixedArray value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/fixedArray.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, fixedArrayChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/string.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, stringChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form boolean value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/form/boolean.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, formBooleanChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form enum value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/form/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, formEnumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters without value", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/withoutValue.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, withoutValueChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult.trim())
  })

  it("should export choice parameters without one value", () => {
    const expectedResult = readXMLFileAsString("choiceParameters/withoutOneValue.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, withoutOneValueChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult.trim())
  })
})
