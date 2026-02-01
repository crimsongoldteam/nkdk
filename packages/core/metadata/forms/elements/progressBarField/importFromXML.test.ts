import { describe, expect, it } from "vitest"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importProgressBarFieldFromXML } from "./importFromXML"
import { ProgressBarFieldXML } from "./types"

describe("importProgressBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importProgressBarFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ProgressBarFieldXML }>("forms/progressBarField/full.xml")

    const result = importProgressBarFieldFromXML(mockContext, xmlData.ProgressBarField)

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ProgressBarField: ProgressBarFieldXML }>("forms/progressBarField/minimal.xml")

    const result = importProgressBarFieldFromXML(mockContext, xmlData.ProgressBarField)

    expect(result).toEqual(minimalProgressBarField)
  })
})
