import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../../tests/mockContext"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { dcsMetadataValueXMLFixtures } from "./__fixtures__/data"
import { exportDcsMetadataValueToXML } from "./toXML"

describe("export MetadataDcsMetadataValue to XML", () => {
  it.each(dcsMetadataValueXMLFixtures)("exports $title", (fixture) => {
    const { result, expectedResult } = testAtomicToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "dcscor:value",
      importMetaUrl: import.meta.url,
      path: fixture.xml,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports explicit DesignTimeValue field as dcscor:Field", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        { type: "Field", value: "СписокФайлов.ФормаРСВ_Представление" }
      )
    ).toEqual({
      "_xsi:type": "dcscor:Field",
      "#text": "СписокФайлов.ФормаРСВ_Представление",
    })
  })

  it("exports LocalFormattedStringType DesignTimeValue", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        {
          type: "LocalFormattedStringType",
          value: {
            formatted: true,
            items: { ru: "Многоязычная форматированная строка" },
          },
        }
      )
    ).toEqual({
      "_xsi:type": "v8:LocalFormattedStringType",
      "v8:lws": {
        "v8:item": [
          {
            "v8:lang": "ru",
            "v8:content": "Многоязычная форматированная строка",
          },
        ],
      },
      "v8:formatted": true,
    })
  })

  it("exports Field value dateTime as xs:dateTime", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
        { type: "dateTime", value: "0001-01-01T00:00:00" }
      )
    ).toEqual({
      "_xsi:type": "xs:dateTime",
      "#text": "0001-01-01T00:00:00",
    })
  })

  it("exports preserved empty LocalStringType as empty typed XML", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        { items: {} }
      )
    ).toEqual({
      "_xsi:type": "v8:LocalStringType",
    })
  })

  it("does not treat LocalStringType with extra fields as empty typed XML", () => {
    const value = { items: {}, extra: true }

    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value
      )
    ).toEqual({
      "_xsi:type": "v8:LocalStringType",
      "v8:item": [],
    })
  })
})
