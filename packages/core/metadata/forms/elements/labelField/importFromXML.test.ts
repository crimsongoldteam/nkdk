import { describe, expect, it } from "vitest"
import { fullLabelField, minimalLabelField } from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importLabelFieldFromXML } from "./importFromXML"
import { LabelFieldXML } from "./types"

describe("importLabelFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importLabelFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ LabelField: LabelFieldXML }>("forms/labelField/full.xml")

    const result = importLabelFieldFromXML(mockContext, xmlData.LabelField)

    expect(result).toEqual(fullLabelField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ LabelField: LabelFieldXML }>("forms/labelField/minimal.xml")

    const result = importLabelFieldFromXML(mockContext, xmlData.LabelField)

    expect(result).toEqual(minimalLabelField)
  })
})
