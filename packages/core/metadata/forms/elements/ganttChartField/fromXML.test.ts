import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullGanttChartField, minimalGanttChartField } from "~/metadata/forms/elements/ganttChartField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importGanttChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GanttChartField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ GanttChartField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GanttChartField",
      xml: xmlData.GanttChartField,
    })

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ GanttChartField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "GanttChartField",
      xml: xmlData.GanttChartField,
    })

    expect(result).toEqual(minimalGanttChartField)
  })
})
