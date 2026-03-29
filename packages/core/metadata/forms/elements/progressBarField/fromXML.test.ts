import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullProgressBarField, minimalProgressBarField } from "~/metadata/forms/elements/progressBarField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importProgressBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ProgressBarField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ProgressBarField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ ProgressBarField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(minimalProgressBarField)
  })
})
