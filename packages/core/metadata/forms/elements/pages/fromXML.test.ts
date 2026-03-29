import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPages, minimalPages } from "~/metadata/forms/elements/pages/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPagesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Pages: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: xmlData.Pages,
    })

    expect(result).toEqual(fullPages)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Pages: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: xmlData.Pages,
    })

    expect(result).toEqual(minimalPages)
  })
})
