import { describe, expect, it } from "vitest"
import { MetadataCommonAttributeRules } from "~/metadata/appliedObjects/metadataCommonAttribute/rules"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { MetadataPrimitiveValueHandler, primitiveValueHandlers } from "~/metadata/commonObjects/metadataValue/handlers"
import { MetadataPrimitiveValueType } from "~/metadata/commonObjects/metadataValue/types"
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

  it("preserves reference xsi:type for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "MetadataValue" },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="v8:TypeDescription"/>')
  })

  it("prefers reference xsi:type over rule valueType for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="v8:TypeDescription"/>')
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

  it("reports missing primitive toXML handler", () => {
    const handlers = primitiveValueHandlers as Partial<Record<MetadataPrimitiveValueType, MetadataPrimitiveValueHandler>>
    const originalHandler = handlers.DataCompositionComparisonType
    delete handlers.DataCompositionComparisonType

    try {
      expect(() =>
        exportMetadataValueToXML({
          context: mockContext,
          rule: { type: "MetadataValue" },
          value: { type: "DataCompositionComparisonType", value: "Equal" } as any,
        })
      ).toThrow(
        "MetadataValue: отсутствует toXML-обработчик для типа DataCompositionComparisonType (rule.type: MetadataValue)"
      )
    } finally {
      handlers.DataCompositionComparisonType = originalHandler
    }
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
