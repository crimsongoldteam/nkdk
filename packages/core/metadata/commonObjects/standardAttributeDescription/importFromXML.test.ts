import { describe, expect, it } from "vitest"
import { allParameters, multiple } from "~/tests/fixtures/standartAttributeDescription/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importStandardAttributeDescriptionsFromXML } from "./importFromXML"
import { StandardAttributeDescriptionsXML } from "./types"

describe("importStandardAttributeDescriptionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importStandardAttributeDescriptionsFromXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import all parameters", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/allParameters.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml.StandardAttributes)
    expect(result).toEqual(allParameters)
  })

  it("should return undefined when only name is present", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/necessaryParameters.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml.StandardAttributes)
    expect(result).toBeUndefined()
  })

  it("should return undefined when all values are defaults", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/default.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml.StandardAttributes)
    expect(result).toBeUndefined()
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
      "standartAttributeDescription/multiple.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml.StandardAttributes)
    expect(result).toEqual(multiple)
  })

  // it("should import with multiple default values to undefined", () => {
  //   const xml = readAndParseXMLFile<{ StandardAttributes: StandardAttributeDescriptionsXML }>(
  //     "standartAttributeDescription/multipleDefault.xml"
  //   )

  //   const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml["xr:StandardAttribute"])
  //   expect(result).toBeUndefined()
  // })
})
