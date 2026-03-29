import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullChartField, minimalChartField } from "~/metadata/forms/elements/chartField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ChartField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ChartField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ChartField",
      xml: xmlData.ChartField,
    })

    expect(result).toEqual(fullChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ ChartField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ChartField",
      xml: xmlData.ChartField,
    })

    expect(result).toEqual(minimalChartField)
  })
})
