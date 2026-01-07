import { describe, expect, it } from "vitest"
import { fullGanttChartField, minimalGanttChartField } from "~/tests/fixtures/forms/ganttChartField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importGanttChartFieldFromXML } from "./importFromXML"
import { GanttChartFieldXML } from "./types"

describe("importGanttChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGanttChartFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GanttChartField: GanttChartFieldXML }>("forms/ganttChartField/full.xml")

    const result = importGanttChartFieldFromXML(mockСontext, xmlData.GanttChartField)

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GanttChartField: GanttChartFieldXML }>("forms/ganttChartField/minimal.xml")

    const result = importGanttChartFieldFromXML(mockСontext, xmlData.GanttChartField)

    expect(result).toEqual(minimalGanttChartField)
  })
})

