import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataSimpleValueToXML, exportMetadataValueToXML } from "./toXML"
import { MetadataValue } from "./types"

describe("exportMetadataValueToXML", () => {
  it("should export string value to XML", () => {
    const data: MetadataValue = {
      type: "string",
      value: "Текстовое значение",
    }

    const expectedResult = readXMLFileAsString("metadataValue/string.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export boolean value to XML", () => {
    const data: MetadataValue = {
      type: "boolean",
      value: true,
    }

    const expectedResult = readXMLFileAsString("metadataValue/boolean.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export decimal value to XML as number", () => {
    const data: MetadataValue = {
      type: "decimal",
      value: 10,
    }

    const expectedResult = readXMLFileAsString("metadataValue/decimal.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it

  it("should export dateTime value to XML", () => {
    const data: MetadataValue = {
      type: "dateTime",
      value: "2025-12-24T12:00:00",
    }

    const expectedResult = readXMLFileAsString("metadataValue/dateTime.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export enum (DesignTimeRef) value to XML", () => {
    const data: MetadataValue = {
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    }

    const expectedResult = readXMLFileAsString("metadataValue/enum.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export catalog (DesignTimeRef) value to XML", () => {
    const data: MetadataValue = {
      type: "ref",
      value: "Catalog.Пользователи.EmptyRef",
    }

    const expectedResult = readXMLFileAsString("metadataValue/catalog.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export fixedArray value to XML", () => {
    const data: MetadataValue = {
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты",
        },
        {
          type: "ref",
          value: "Enum.ТипыСчетов.EnumValue.Расходы",
        },
      ],
    }

    const expectedResult = readXMLFileAsString("metadataValue/fixedArray.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export FormChoiceListDesTimeValue to XML", () => {
    const data: MetadataValue = {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Физическое лицо" } },
      value: {
        type: "string",
        value: "ФЛ",
      },
    }

    const expectedResult = readXMLFileAsString("metadataValue/formChoiceListDesTimeValue.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export metadataRef (xr:MDObjectRef) value to XML", () => {
    const data: MetadataValue = {
      type: "objectRef",
      value: "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения",
    }

    const expectedResult = readXMLFileAsString("metadataValue/metadataRef.xml")

    const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  // it("should export app:ApplicationUsePurpose type to XML", () => {
  //   const data: MetadataValue = {
  //     type: "ApplicationUsePurpose",
  //     value: "PlatformApplication",
  //   }

  //   const expectedResult = readXMLFileAsString("metadataValue/appUsePurpose.xml")

  //   const xmlData = exportMetadataValueToXML(mockContext, mockRule, data)

  //   const result = xmlExport({ Value: xmlData }, false)

  //   expect(result).toEqual(expectedResult)
  // })

  it("should return undefined for undefined input", () => {
    const result = exportMetadataValueToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})

describe("export primitive values to XML", () => {
  it("should export string value to XML", () => {
    const expectedResult = readXMLFileAsString("metadataValue/numberAsString.xml")

    const xmlData = exportMetadataSimpleValueToXML(mockContext, mockRule, 11, "string")

    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
