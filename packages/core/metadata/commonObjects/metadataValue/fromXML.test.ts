import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataValueFromXML, importMetadataValueFromXMLAsPrimitive } from "./fromXML"
import { MetadataSimpleValueXML, MetadataValue, MetadataValueXML } from "./types"

describe("importMetadataValueFromXML", () => {
  it("should import string value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/string.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "string",
      value: "Текстовое значение",
    })
  })

  it("should import boolean value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/boolean.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "boolean",
      value: true,
    })
  })

  it("should import decimal value from XML as number", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/decimal.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "decimal",
      value: 10,
    })
  })

  it("should import decimal zero value from XML as number", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/decimalZero.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "decimal",
      value: 0,
    })
  })

  it("should import dateTime value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/dateTime.xml")
    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "dateTime",
      value: "2025-12-24T12:00:00",
    })
  })

  it("should import enum (DesignTimeRef) value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/enum.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "ref",
      value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
    })
  })

  it("should import catalog (DesignTimeRef) value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/catalog.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "ref",
      value: "Catalog.Пользователи.EmptyRef",
    })
  })

  it("should import empty ref value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/emptyRef.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toBeUndefined()
  })

  it("should import fixedArray value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/fixedArray.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
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
    })
  })

  it("should import FormChoiceListDesTimeValue from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/formChoiceListDesTimeValue.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual({
      type: "formChoiceListDesTimeValue",
      presentation: {
        items: {
          ru: "Физическое лицо",
        },
      },
      value: {
        type: "string",
        value: "ФЛ",
      },
    })
  })

  it("should return string for unsupported types (xr:MDObjectRef)", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/metadataRef.xml")

    const expectedResult: MetadataValue = {
      type: "objectRef",
      value: "ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения",
    }

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toEqual(expectedResult)
  })

  // it("should return string for app:ApplicationUsePurpose type", () => {
  //   const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/appUsePurpose.xml")

  //   const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

  //   expect(result).toEqual({
  //     type: "ApplicationUsePurpose",
  //     value: "PlatformApplication",
  //   })
  // })

  it("should return undefined for undefined input", () => {
    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for empty string input", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataValueXML }>("metadataValue/emptyString.xml")

    const result = importMetadataValueFromXML(mockContextFromXML(), mockRule, xmlData.Value)

    expect(result).toBeUndefined()
  })
})

describe("importMetadataSimpleValueFromXML", () => {
  it("should import string value from XML", () => {
    const xmlData = readAndParseXMLFile<{ Value: MetadataSimpleValueXML }>("metadataValue/numberAsString.xml")

    const result = importMetadataValueFromXMLAsPrimitive(mockContextFromXML(), mockRule, xmlData.Value, "decimal")

    expect(result).toEqual(11)
  })
})
