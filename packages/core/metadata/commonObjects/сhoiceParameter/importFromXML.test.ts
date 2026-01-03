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
} from "~/tests/fixtures/choiceParameter/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChoiceParametersFromXML } from "./importFromXML"
import { ChoiceParametersXML } from "./types"

describe("importChoiceParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import choice parameters with single parameter correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/single.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import choice parameters with multiple parameters correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/multiple.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/enum.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with fixedArray value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/fixedArray.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("should import choice parameters with string value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/string.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(stringChoiceParameter)
  })

  it("should import choice parameters with form boolean value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/form/boolean.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(formBooleanChoiceParameter)
  })

  it("should import choice parameters with form enum value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/form/enum.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(formEnumChoiceParameter)
  })

  it("should import choice parameters with nil value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/nil.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(nilChoiceParameters)
  })

  it("should import choice parameters with without value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/withoutValue.xml")

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(nilChoiceParameters)
  })
})
