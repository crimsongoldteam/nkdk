import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "./__fixtures__/data"
import { MetadataPrimitiveValueHandler, primitiveValueHandlers } from "./handlers"
import { MetadataPrimitiveValueType } from "./types"
import { mockContext, mockContextToXML } from "../../../tests/mockContext"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { testPropertyYamlRoundTrip } from "../../../tests/directConversion"
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

  it("exports a UUID DesignTimeRef without index resolution", () => {
    const uuidReference = "11111111-1111-4111-8111-111111111111.22222222-2222-4222-8222-222222222222"

    const xmlData = exportMetadataValueToXML({
      context: mockContextToXML(),
      rule: { type: "MetadataValue" },
      value: { type: "ref", value: uuidReference },
    })

    expect(xmlExport({ Value: xmlData }, false))
      .toBe(`<Value xsi:type="xr:DesignTimeRef">${uuidReference}</Value>`)
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

  it("does not restore reference xsi:nil outside FillValue", () => {
    const { result } = testAtomicToXML({
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:nil": true },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="xs:string"/>')
  })

  it("does not restore reference xsi:type for missing value", () => {
    const { result } = testAtomicToXML({
      rule: { type: "MetadataValue" },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe("")
  })

  it("uses the rule valueType rather than reference xsi:type for missing value", () => {
    const { result } = testAtomicToXML({
      rule: { type: "MetadataValue", valueType: ["string"] },
      value: undefined,
      referenceMetadata: { "_xsi:type": "v8:TypeDescription" },
      xmlRootTag: "Value",
    })

    expect(result).toBe('<Value xsi:type="xs:string"/>')
  })

  it.each(['xsi:nil="true"', 'xsi:type="v8:TypeDescription"'])("preserves empty %s through serialized YAML", (attributes) => {
    const sourceXML = `<Root><Value ${attributes}/></Root>`
    const result = testPropertyYamlRoundTrip({ sourceXML, rule: {
      type: "MetadataValue", xml: "Value", yaml: "Значение",
    } })
    expect(result.yamlText).toContain("!xml/raw")
    expect(result.result.replace(/>\s+</g, "><").replace(/^\ufeff?<\?xml[^>]+>\s*/, "")).toBe(sourceXML)
  })

  it("exports canonical non-string FillValue without a previous XML value", () => {
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
    })

    expect(xmlExport({ FillValue: xmlData }, false)).toBe('<FillValue xsi:nil="true"/>')
  })

  it.each([{ "_xsi:nil": true }, { "_xsi:nil": "true" }, { "_xsi:type": "v8:Null" }])(
    "does not accept XML-shaped objects as semantic values: %j", (value) => {
      expect(() => testAtomicToXML({
        rule: { type: "MetadataValue" }, value, xmlRootTag: "Value",
      })).toThrow("неподдерживаемый тип")
    },
  )

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
