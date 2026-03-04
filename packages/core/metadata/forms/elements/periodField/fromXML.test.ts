import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPeriodFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "PeriodField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PeriodField: ElementXML }>("forms/periodField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "PeriodField",
      xml: xmlData.PeriodField,
    })

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PeriodField: ElementXML }>("forms/periodField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "PeriodField",
      xml: xmlData.PeriodField,
    })

    expect(result).toEqual(minimalPeriodField)
  })
})
