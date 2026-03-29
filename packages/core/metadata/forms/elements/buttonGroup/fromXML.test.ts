import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullButtonGroup, minimalButtonGroup } from "~/metadata/forms/elements/buttonGroup/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importButtonGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ButtonGroup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ButtonGroup: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ButtonGroup",
      xml: xmlData.ButtonGroup,
    })

    expect(result).toEqual(fullButtonGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ ButtonGroup: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ButtonGroup",
      xml: xmlData.ButtonGroup,
    })

    expect(result).toEqual(minimalButtonGroup)
  })
})
