import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importChartFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "ChartField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ChartField: ElementXML }>("forms/chartField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ChartField",
      xml: xmlData.ChartField,
    })

    expect(result).toEqual(fullChartField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ChartField: ElementXML }>("forms/chartField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ChartField",
      xml: xmlData.ChartField,
    })

    expect(result).toEqual(minimalChartField)
  })
})
