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
