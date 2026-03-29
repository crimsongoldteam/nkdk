import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPage, minimalPage } from "~/metadata/forms/elements/page/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPageFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Page: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: xmlData.Page,
    })

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Page: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: xmlData.Page,
    })

    expect(result).toEqual(minimalPage)
  })
})
