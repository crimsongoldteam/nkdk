import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullGanttChartField, minimalGanttChartField } from "~/tests/fixtures/forms/ganttChartField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importGanttChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.GanttChartField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ GanttChartField: ElementXML }>("forms/ganttChartField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.GanttChartField,
      xml: xmlData.GanttChartField,
    })

    expect(result).toEqual(fullGanttChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ GanttChartField: ElementXML }>("forms/ganttChartField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.GanttChartField,
      xml: xmlData.GanttChartField,
    })

    expect(result).toEqual(minimalGanttChartField)
  })
})
