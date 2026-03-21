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

  it.each(metadataValueFixtures)("should import $name value with type from XML", (fixture) => {
    const xmlValue = parseValue(fixture.XML)
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: fixture.ruleWithType as any,
      value: xmlValue,
    })

    expect(result).toEqual(fixture.internalWithType)
  })

  it.each(metadataValueFixtures)("should import $name value from XML", (fixture) => {
    const xmlValue = parseValue(fixture.XML)
    const result = importMetadataValueFromXML({
      context: mockContextFromXML(),
      rule: fixture.rule as any,
      value: xmlValue,
    })

    expect(result).toEqual(fixture.internal)
  })
})
