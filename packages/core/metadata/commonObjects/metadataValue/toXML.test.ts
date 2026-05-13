import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataValueToXML } from "./toXML"

describe("exportMetadataValueToXML", () => {
  it.each(metadataValueFixtures)("should export $name to XML", ({ rule, internal, XML }) => {
    const xmlData = exportMetadataValueToXML({ context: mockContext, rule, value: internal as any })
    const result = xmlExport({ Value: xmlData }, false)
    expect(result).toEqual(XML)
  })

  it("exports empty xr:ValueList", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue" },
      value: { type: "valueList" } as any,
    })
    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual('<Value xsi:type="xr:ValueList"/>')
  })

  it("exports dcsset:DataCompositionComparisonType", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue" },
      value: { type: "DataCompositionComparisonType", value: "Equal" } as any,
    })
    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual('<Value xsi:type="dcsset:DataCompositionComparisonType">Equal</Value>')
  })

  describe("строгая валидация valueType", () => {
    it("должен бросить при valueType: [string] и фактическом boolean", () => {
      expect(() =>
        exportMetadataValueToXML({
          context: mockContext,
          rule: { type: "MetadataValue", valueType: ["string"] },
          value: { type: "boolean", value: true },
        })
      ).toThrowError("MetadataValue: ожидались [string], получен boolean в toXML")
    })

    it("должен бросить при valueType: [string] и фактическом decimal", () => {
      expect(() =>
        exportMetadataValueToXML({
          context: mockContext,
          rule: { type: "MetadataValue", valueType: ["string"] },
          value: { type: "decimal", value: 10 },
        })
      ).toThrowError("MetadataValue: ожидались [string], получен decimal в toXML")
    })
  })
})
