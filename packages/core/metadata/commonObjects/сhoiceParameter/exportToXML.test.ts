import { describe, expect, it } from "vitest"
import {
  enumChoiceParameter,
  fixedArrayChoiceParameter,
  formBooleanChoiceParameter,
  formEnumChoiceParameter,
  multipleChoiceParameters,
  singleChoiceParameter,
  stringChoiceParameter,
} from "~/tests/fixtures/choiceParameter/data"
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
    const expectedResult = readXMLFileAsString("choiceParameter/single.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, singleChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with multiple parameters correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/multiple.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, multipleChoiceParameters)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, enumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with fixedArray value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/fixedArray.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, fixedArrayChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/string.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, stringChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form boolean value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/form/boolean.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, formBooleanChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form enum value correctly", () => {
    const expectedResult = readXMLFileAsString("choiceParameter/form/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, formEnumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
