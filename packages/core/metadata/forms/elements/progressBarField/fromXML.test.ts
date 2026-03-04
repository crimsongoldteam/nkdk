import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importProgressBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "ProgressBarField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ElementXML }>("forms/progressBarField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ElementXML }>("forms/progressBarField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ProgressBarField",
      xml: xmlData.ProgressBarField,
    })

    expect(result).toEqual(minimalProgressBarField)
  })
})
