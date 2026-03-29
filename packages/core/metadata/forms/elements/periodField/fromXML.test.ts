import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPeriodField, minimalPeriodField } from "~/metadata/forms/elements/periodField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPeriodFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PeriodField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ PeriodField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PeriodField",
      xml: xmlData.PeriodField,
    })

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ PeriodField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PeriodField",
      xml: xmlData.PeriodField,
    })

    expect(result).toEqual(minimalPeriodField)
  })
})
