import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { importMetadataValueFromXML } from "./fromXML"

describe("importMetadataValueFromXML", () => {
  const parseValue = (xml: string): any => {
    const wrapped = `<root>${xml}</root>`
    const parsed = importContentFromXML<{ root: { Value: any } }>(wrapped)
    return parsed.root.Value
  }

  it.each(metadataValueFixtures)("should import $name value from XML", (fixture) => {
    const xmlValue = parseValue(fixture.XML)
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: fixture.rule as any,
      value: xmlValue,
    })

    expect(result).toEqual(fixture.internal)
  })

  it("imports empty xr:ValueList", () => {
    const xmlValue = parseValue('<Value xsi:type="xr:ValueList"/>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toEqual({ type: "valueList" })
  })

  it("imports dcsset:DataCompositionComparisonType", () => {
    const xmlValue = parseValue('<Value xsi:type="dcsset:DataCompositionComparisonType">Equal</Value>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toEqual({ type: "DataCompositionComparisonType", value: "Equal" })
  })

  it("imports xsi:nil as undefined", () => {
    const xmlValue = parseValue('<Value xsi:nil="true"/>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toBeUndefined()
  })

  it("imports string xsi:nil as undefined", () => {
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: { "_xsi:nil": "true" },
    })

    expect(result).toBeUndefined()
  })

  it("keeps xsi:nil for reference import", () => {
    const xmlValue = parseValue('<Value xsi:nil="true"/>') ?? { "_xsi:nil": true }
    const result = importMetadataValueFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toEqual({ "_xsi:nil": true })
  })

  it("keeps unknown xsi:type for reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription"/>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toEqual({ "_xsi:type": "v8:TypeDescription" })
  })

  it("throws on unknown xsi:type with text outside reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription">unexpected</Value>')

    expect(() =>
      importMetadataValueFromXML({
        context: mockContextFromXML(),
        rule: undefined,
        value: xmlValue,
      })
    ).toThrowError("MetadataValue: не распознан тип: v8:TypeDescription")
  })

  it("throws on unknown xsi:type with child nodes outside reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription"><Foo>bar</Foo></Value>')

    expect(() =>
      importMetadataValueFromXML({
        context: mockContextFromXML(),
        rule: undefined,
        value: xmlValue,
      })
    ).toThrowError("MetadataValue: не распознан тип: v8:TypeDescription")
  })

  it("imports empty unknown xsi:type as undefined outside reference import", () => {
    const xmlValue = parseValue('<Value xsi:type="v8:TypeDescription"/>')
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: undefined,
      value: xmlValue,
    })

    expect(result).toBeUndefined()
  })

  describe("строгая валидация valueType", () => {
    it("должен бросить при valueType: [string] и фактическом boolean", () => {
      const xml = '<Value xsi:type="xs:boolean">true</Value>'
      const xmlValue = parseValue(xml)
      expect(() =>
        importMetadataValueFromXML({
          context: mockContextFromXML(),
          rule: { type: "MetadataValue", valueType: ["string"] } as any,
          value: xmlValue,
        })
      ).toThrowError("MetadataValue: ожидались [string], получен boolean в fromXML")
    })

    it("должен бросить при valueType: [string] и фактическом decimal", () => {
      const xml = '<Value xsi:type="xs:decimal">10</Value>'
      const xmlValue = parseValue(xml)
      expect(() =>
        importMetadataValueFromXML({
          context: mockContextFromXML(),
          rule: { type: "MetadataValue", valueType: ["string"] } as any,
          value: xmlValue,
        })
      ).toThrowError("MetadataValue: ожидались [string], получен decimal в fromXML")
    })
  })
})
