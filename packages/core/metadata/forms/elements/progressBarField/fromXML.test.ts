import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

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
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ElementXML }>("forms/progressBarField/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ElementXML }>("forms/progressBarField/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(minimalProgressBarField)
  })
})
