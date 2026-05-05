import { describe, expect, it } from "vitest"
import { all, multiple } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importStandardAttributeDescriptionsFromXML } from "./fromXML"
import { StandardAttributeDescriptionsXML } from "./types"

describe("importStandardAttributeDescriptionsFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importStandardAttributeDescriptionsFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import all parameters", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/all.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockContextFromXML(), mockRule, xml.StandardAttributes)
    expect(result).toEqual(all)
  })

  it("should return undefined when only name is present", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/minimal.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockContextFromXML(), mockRule, xml.StandardAttributes)
    expect(result).toBeUndefined()
  })

  it("should return undefined when all values are defaults", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/default.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockContextFromXML(), mockRule, xml.StandardAttributes)
    expect(result).toBeUndefined()
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/multiple.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockContextFromXML(), mockRule, xml.StandardAttributes)
    expect(result).toEqual(multiple)
  })
})
