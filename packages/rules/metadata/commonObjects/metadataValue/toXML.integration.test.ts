import { describe, expect, it } from "vitest"
import { MetadataCommonAttributeRules } from "../../appliedObjects/metadataCommonAttribute/rules"
import { metadataValueFixtures } from "./__fixtures__/data"
import { MetadataPrimitiveValueHandler, primitiveValueHandlers } from "./handlers"
import { MetadataPrimitiveValueType } from "./types"
import { mockContext } from "../../../tests/mockContext"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { xmlExport } from "@nkdk/runtime"
import { exportMetadataValueToXML } from "./toXML"
import { createYAMLPropertySource } from "../../ruleRuntime/property/fromYAMLToXML"

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

  it("exports ent:AccountType", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue" },
      value: { type: "AccountType", value: "ActivePassive" } as any,
    })
    const result = xmlExport({ Value: xmlData }, false)

    expect(result).toEqual('<Value xsi:type="ent:AccountType">ActivePassive</Value>')
  })

  it("preserves reference xsi:nil outside FillValue", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:nil": true },
    })

    expect(xmlExport({ Value: xmlData }, false)).toBe('<Value xsi:nil="true"/>')
  })

  it("preserves reference xsi:type for missing value", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue" },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
    })

    expect(xmlExport({ Value: xmlData }, false)).toBe('<Value xsi:type="v8:TypeDescription"/>')
  })

  it("prefers reference xsi:type over rule valueType for missing value", () => {
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
    })

    expect(xmlExport({ Value: xmlData }, false)).toBe('<Value xsi:type="v8:TypeDescription"/>')
  })

  it("ignores reference xsi:type for canonical non-string FillValue", () => {
    const source = createYAMLPropertySource({
      yaml: { Тип: "Булево" },
      rule: {
        itemType: "MetadataValueFillValueProbe",
        properties: { type: { type: "TypeDescription", yaml: "Тип" } },
      },
    })
    const xmlData = exportMetadataValueToXML({
      context: mockContext,
      rule: { type: "MetadataValue", exportNilValue: true },
      value: undefined,
      propertyKey: "fillValue",
      source,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
    })

    expect(xmlExport({ FillValue: xmlData }, false)).toBe('<FillValue xsi:nil="true"/>')
  })

  it("exports reference-only xsi:nil when passed as value", () => {
    const { result } = testAtomicToXML({
      rule: MetadataCommonAttributeRules.properties.fillValue,
      value: { "_xsi:nil": true },
      referenceMetadata: { "_xsi:nil": true },
      xmlRootTag: "FillValue",
    })

    expect(result).toBe('<FillValue xsi:nil="true"/>')
  })

  it("preserves parsed reference xsi:nil when passed as value", () => {
    const { result } = testAtomicToXML({
      rule: MetadataCommonAttributeRules.properties.fillValue,
      value: { "_xsi:nil": "true" },
      referenceMetadata: { "_xsi:nil": "true" },
      xmlRootTag: "FillValue",
    })

    expect(result).toBe('<FillValue xsi:nil="true"/>')
  })

  it("reports missing primitive toXML handler", () => {
    const handlers = primitiveValueHandlers as Partial<
      Record<MetadataPrimitiveValueType, MetadataPrimitiveValueHandler>
    >
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
