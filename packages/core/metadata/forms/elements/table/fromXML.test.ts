import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullTable, minimalTable } from "~/metadata/forms/elements/table/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importTableFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Table",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Table: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Table",
      xml: xmlData.Table,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ Table: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Table",
      xml: xmlData.Table,
    })

    expect(result).toEqual(minimalTable)
  })
})
