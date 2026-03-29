import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPictureDecoration, minimalPictureDecoration } from "~/metadata/forms/elements/pictureDecoration/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPictureDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PictureDecoration",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ PictureDecoration: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PictureDecoration",
      xml: xmlData.PictureDecoration,
    })

    expect(result).toEqual(fullPictureDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ PictureDecoration: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PictureDecoration",
      xml: xmlData.PictureDecoration,
    })

    expect(result).toEqual(minimalPictureDecoration)
  })
})
