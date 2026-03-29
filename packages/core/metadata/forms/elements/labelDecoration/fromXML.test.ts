import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullLabelDecoration, minimalLabelDecoration } from "~/metadata/forms/elements/labelDecoration/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importLabelDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "LabelDecoration",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ LabelDecoration: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "LabelDecoration",
      xml: xmlData.LabelDecoration,
    })

    expect(result).toEqual(fullLabelDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ LabelDecoration: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "LabelDecoration",
      xml: xmlData.LabelDecoration,
    })

    expect(result).toEqual(minimalLabelDecoration)
  })
})
