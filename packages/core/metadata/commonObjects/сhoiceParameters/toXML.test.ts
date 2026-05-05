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
} from "~/metadata/commonObjects/сhoiceParameters/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceParametersToXML } from "./toXML"

describe("exportChoiceParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export choice parameters with single parameter correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "single.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, singleChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with multiple parameters correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "multiple.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, multipleChoiceParameters)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "enum.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, enumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with fixedArray value correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "fixedArray.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, fixedArrayChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "string.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, stringChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form boolean value correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "form/boolean.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, formBooleanChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form enum value correctly", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "form/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, formEnumChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters without value", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "withoutValue.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, withoutValueChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult.trim())
  })

  it("should export choice parameters without one value", () => {
    const expectedResult = readXMLFixtureAsString(import.meta.url, "withoutOneValue.xml")

    const xmlData = exportChoiceParametersToXML(mockContext, mockRule, withoutOneValueChoiceParameter)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult.trim())
  })
})
