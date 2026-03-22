import { describe, expect, it } from "vitest"
import {
  enumChoiceParameter,
  fixedArrayChoiceParameter,
  formBooleanChoiceParameter,
  formEnumChoiceParameter,
  multipleChoiceParameters,
  nilChoiceParameters,
  singleChoiceParameter,
  stringChoiceParameter,
  withoutOneValueChoiceParameter,
} from "~/metadata/commonObjects/сhoiceParameters/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { importChoiceParametersFromXML } from "./fromXML"
import { ChoiceParametersXML } from "./types"

describe("importChoiceParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import choice parameters with single parameter correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "single.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import choice parameters with multiple parameters correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "multiple.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "enum.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with fixedArray value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "fixedArray.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with string value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "string.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with form boolean value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "form/boolean.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(formBooleanChoiceParameter)
  })

  it("should import choice parameters with form enum value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "form/enum.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(formEnumChoiceParameter)
  })

  it("should import choice parameters with nil value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "nil.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters with without value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "withoutValue.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters without one value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "withoutOneValue.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(withoutOneValueChoiceParameter)
  })
})
