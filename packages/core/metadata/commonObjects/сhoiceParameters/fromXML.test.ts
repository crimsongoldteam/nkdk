import { describe, expect, it } from "vitest"
import {
  enumChoiceParameter,
  fixedArrayChoiceParameter,
  fixedArrayWithNilChoiceParameters,
  formBooleanChoiceParameter,
  emptyFormChoiceParametersYAML,
  formEnumChoiceParameter,
  multipleChoiceParameters,
  nilChoiceParameters,
  singleChoiceParameter,
  stringChoiceParameter,
  withoutOneValueChoiceParameter,
} from "./__fixtures__/data"
import { mockContext, mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { xmlExport } from "../../../xml/export/exporter"
import { exportToYAML } from "../../../yaml/export"
import { importFromYAML } from "../../../yaml/import"
import { importChoiceParametersFromYAML } from "./fromYAML"
import { importChoiceParametersFromXML } from "./fromXML"
import { exportChoiceParametersToXML } from "./toXML"
import { exportChoiceParametersToYAML } from "./toYAML"
import { ChoiceParametersXML, ChoiceParametersYAML } from "./types"

describe("importChoiceParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import choice parameters with single parameter correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "single.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(singleChoiceParameter)
  })

  it("should import choice parameters with multiple parameters correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "multiple.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(multipleChoiceParameters)
  })

  it("should import choice parameters with enum value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "enum.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(enumChoiceParameter)
  })

  it("should import choice parameters with fixedArray value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "fixedArray.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(fixedArrayChoiceParameter)
  })

  it("imports fixedArrayWithNil", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "fixedArrayWithNil.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(fixedArrayWithNilChoiceParameters)
  })

  it("should import choice parameters with string value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "string.xml")

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
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "form/enum.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toEqual(formEnumChoiceParameter)
  })

  it("preserves empty FormChoiceListDesTimeValue through YAML", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "form/empty.xml")

    const imported = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)
    const yamlObject = exportChoiceParametersToYAML(mockContext, mockRule, imported)
    const yamlText = exportToYAML(yamlObject)
    const reparsedYaml = importFromYAML<ChoiceParametersYAML>(yamlText)
    const importedFromYaml = importChoiceParametersFromYAML(mockContext, mockRule, reparsedYaml)
    const exportedXML = exportChoiceParametersToXML(mockContext, mockRule, importedFromYaml)
    const result = xmlExport({ ChoiceParameters: exportedXML }, false)

    expect(yamlObject).toEqual(emptyFormChoiceParametersYAML)
    expect(result).toContain('<app:value xsi:type="FormChoiceListDesTimeValue">')
    expect(result).toContain("<Presentation/>")
    expect(result).toContain('<Value xsi:nil="true"/>')
  })

  it("should import choice parameters with nil value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(import.meta.url, "nil.xml")

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toStrictEqual(nilChoiceParameters)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("should import choice parameters with without value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "withoutValue.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toStrictEqual(nilChoiceParameters)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
  })

  it("should import choice parameters without one value correctly", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "withoutOneValue.xml"
    )

    const result = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)

    expect(result).toStrictEqual(withoutOneValueChoiceParameter)
    expect(Object.prototype.hasOwnProperty.call(result?.[0], "value")).toBe(false)
    expect(result?.[1]?.value).toEqual(withoutOneValueChoiceParameter[1].value)
  })
})
