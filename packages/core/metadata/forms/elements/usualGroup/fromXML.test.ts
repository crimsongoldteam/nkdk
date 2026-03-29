import { describe, expect, it } from "vitest"
import { ElementXML } from "~/metadata/orchestration"
import { importElementFromXML } from "~/metadata/orchestration/formElement/fromXML"
import { fullUsualGroup, minimalUsualGroup } from "~/metadata/forms/elements/usualGroup/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importUsualGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "UsualGroup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ UsualGroup: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "UsualGroup",
      xml: xmlData.UsualGroup,
    })

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ UsualGroup: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "UsualGroup",
      xml: xmlData.UsualGroup,
    })

    expect(result).toEqual(minimalUsualGroup)
  })
})
