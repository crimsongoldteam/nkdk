import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullCommandBar, minimalCommandBar } from "~/metadata/forms/elements/commandBar/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importCommandBarFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CommandBar",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ CommandBar: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CommandBar",
      xml: xmlData.CommandBar,
    })

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ CommandBar: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CommandBar",
      xml: xmlData.CommandBar,
    })

    expect(result).toEqual(minimalCommandBar)
  })
})
