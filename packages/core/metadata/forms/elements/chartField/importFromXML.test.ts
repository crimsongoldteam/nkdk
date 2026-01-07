import { describe, expect, it } from "vitest"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChartFieldFromXML } from "./importFromXML"
import { ChartFieldXML } from "./types"

describe("importChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importChartFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ChartField: ChartFieldXML }>("forms/chartField/full.xml")

    const result = importChartFieldFromXML(mockСontext, xmlData.ChartField)

    expect(result).toEqual(fullChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ChartField: ChartFieldXML }>("forms/chartField/minimal.xml")

    const result = importChartFieldFromXML(mockСontext, xmlData.ChartField)

    expect(result).toEqual(minimalChartField)
  })
})
