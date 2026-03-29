import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullColumnGroup, minimalColumnGroup } from "~/metadata/forms/elements/columnGroup/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importColumnGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ColumnGroup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ColumnGroup: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ColumnGroup",
      xml: xmlData.ColumnGroup,
    })

    expect(result).toEqual(fullColumnGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ ColumnGroup: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ColumnGroup",
      xml: xmlData.ColumnGroup,
    })

    expect(result).toEqual(minimalColumnGroup)
  })
})
