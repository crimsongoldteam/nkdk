import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importStandardAttributeDescriptionFromXML, importStandardAttributeDescriptionsFromXML } from "./importFromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "./types"

describe("importStandardAttributeDescriptionFromXML", () => {
  it("should import with single value", () => {
    const xml = readAndParseXMLFile<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(
      "standartAttribute/singleImport.xml"
    )

    const expectedResult: StandardAttributeDescription = {
      fillChecking: "ShowError",
      name: "PredefinedDataName",
    }

    const result = importStandardAttributeDescriptionFromXML(mockСontext, xml["xr:StandardAttribute"])
    expect(result).toEqual(expectedResult)
  })

  it("should return undefined when all values are defaults", () => {
    const xml = readAndParseXMLFile<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(
      "standartAttribute/default.xml"
    )

    const result = importStandardAttributeDescriptionFromXML(mockСontext, xml["xr:StandardAttribute"])
    expect(result).toBeUndefined()
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ "xr:StandardAttribute": StandardAttributeDescriptionsXML }>(
      "standartAttribute/multiple.xml"
    )

    const expectedResult: StandardAttributeDescriptions = [
      {
        fillChecking: "ShowError",
        name: "PredefinedDataName",
        synonym: { items: { ru: "Какой-то синоним" } },
      },
      {
        name: "Predefined",
        synonym: { items: { ru: "Другой какой-то синоним" } },
      },
    ]

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml["xr:StandardAttribute"])
    expect(result).toEqual(expectedResult)
  })

  it("should import with multiple default values to undefined", () => {
    const xml = readAndParseXMLFile<{ "xr:StandardAttribute": StandardAttributeDescriptionsXML }>(
      "standartAttribute/multipleDefault.xml"
    )

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xml["xr:StandardAttribute"])
    expect(result).toBeUndefined()
  })
})
