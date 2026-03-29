import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullButton, minimalButton } from "~/metadata/forms/elements/button/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importButtonFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Button",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Button: any }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Button",
      xml: xmlData.Button,
    })

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Button: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Button",
      xml: xmlData.Button,
    })

    expect(result).toEqual(minimalButton)
  })
})
