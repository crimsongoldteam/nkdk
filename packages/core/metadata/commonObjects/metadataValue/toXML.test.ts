import { describe, expect, it } from "vitest"
import { MetadataCommonAttributeRules } from "~/metadata/appliedObjects/metadataCommonAttribute/rules"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
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

  it("preserves reference xsi:nil for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataCommonAttributeRules.properties.fillValue,
      value: undefined,
      referenceMetadata: { "_xsi:nil": true },
      xmlRootTag: "FillValue",
    })

    expect(result).toBe('<FillValue xsi:nil="true"/>')
  })

  it("exports reference-only xsi:nil when passed as value", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataCommonAttributeRules.properties.fillValue,
      value: { "_xsi:nil": true },
      referenceMetadata: { "_xsi:nil": true },
      xmlRootTag: "FillValue",
    })

    expect(result).toBe('<FillValue xsi:nil="true"/>')
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
