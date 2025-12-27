import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceParametersToXML } from "./exportToXML"
import { ChoiceParameters } from "./types"

describe("exportChoiceParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParametersToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export choice parameters with single parameter correctly", () => {
    const data: ChoiceParameters = [
      {
        name: "Отбор.ВАрхиве",
        value: {
          type: "boolean",
          value: false,
        },
      },
    ]

    const expectedResult = readXMLFileAsString("choiceParameter/single.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with multiple parameters correctly", () => {
    const data: ChoiceParameters = [
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

    const expectedResult = readXMLFileAsString("choiceParameter/multiple.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with enum value correctly", () => {
    const data: ChoiceParameters = [
      {
        name: "Отбор.ТипСчета",
        value: {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы",
        },
      },
    ]

    const expectedResult = readXMLFileAsString("choiceParameter/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with fixedArray value correctly", () => {
    const data: ChoiceParameters = [
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

    const expectedResult = readXMLFileAsString("choiceParameter/fixedArray.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with string value correctly", () => {
    const data: ChoiceParameters = [
      {
        name: "Дополнительно.ТипВладельца",
        value: {
          type: "string",
          value: "ЗаказПокупателя",
        },
      },
    ]

    const expectedResult = readXMLFileAsString("choiceParameter/string.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form boolean value correctly", () => {
    const data: ChoiceParameters = [
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

    const expectedResult = readXMLFileAsString("choiceParameter/form/boolean.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice parameters with form enum value correctly", () => {
    const data: ChoiceParameters = [
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

    const expectedResult = readXMLFileAsString("choiceParameter/form/enum.xml")

    const xmlData = exportChoiceParametersToXML(mockСontext, data)
    const result = xmlExport({ ChoiceParameters: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
