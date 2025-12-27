import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { readAndParseXMLFile } from "~/packages/core/tests/readAndParseXMLFile"
import { importChoiceParametersFromXML } from "./importFromXML"
import { ChoiceParameters, ChoiceParametersXML } from "./types"

describe("importChoiceParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceParametersFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import choice parameters with single parameter correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/single.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Отбор.ВАрхиве",
        value: {
          type: "boolean",
          value: false,
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with multiple parameters correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/multiple.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Отбор.ВАрхиве",
        value: {
          type: "boolean",
          value: false,
        },
      },
      {
        name: "Отбор.Недействителен",
        value: {
          type: "boolean",
          value: false,
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with enum value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/enum.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Отбор.ТипСчета",
        value: {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы",
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with fixedArray value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/fixedArray.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Отбор.ТипСтруктурнойЕдиницы",
        value: {
          type: "fixedArray",
          value: [
            {
              type: "ref",
              value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Склад",
            },
            {
              type: "ref",
              value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Розница",
            },
            {
              type: "ref",
              value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.РозницаСуммовойУчет",
            },
          ],
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with string value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/string.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Дополнительно.ТипВладельца",
        value: {
          type: "string",
          value: "ЗаказПокупателя",
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with form boolean value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/form/boolean.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "БезПроизводныхЗначений",
        value: {
          type: "formChoiceListDesTimeValue",
          value: {
            type: "boolean",
            value: true,
          },
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })

  it("should import choice parameters with form enum value correctly", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceParameters: ChoiceParametersXML }>("choiceParameter/form/enum.xml")
    const expectedResult: ChoiceParameters = [
      {
        name: "Отбор.ТипСчета",
        value: {
          type: "formChoiceListDesTimeValue",
          value: {
            type: "ref",
            value: "Enum.ТипыСчетов.EnumValue.НераспределеннаяПрибыль",
          },
        },
      },
    ]

    const result = importChoiceParametersFromXML(mockСontext, xmlData.ChoiceParameters)

    expect(result).toEqual(expectedResult)
  })
})
