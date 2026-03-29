import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPopup, minimalPopup } from "~/metadata/forms/elements/popup/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPopupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Popup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Popup: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Popup",
      xml: xmlData.Popup,
    })

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Popup: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Popup",
      xml: xmlData.Popup,
    })

    expect(result).toEqual(minimalPopup)
  })
})
