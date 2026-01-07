import { describe, expect, it } from "vitest"
import { fullViewStatusAddition, minimalViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importViewStatusAdditionFromXML } from "./importFromXML"
import { ViewStatusAdditionXML } from "./types"

describe("importViewStatusAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importViewStatusAdditionFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ViewStatusAdditionXML }>(
      "forms/viewStatusAddition/full.xml"
    )

    const result = importViewStatusAdditionFromXML(mockСontext, xmlData.ViewStatusAddition)

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ViewStatusAdditionXML }>(
      "forms/viewStatusAddition/minimal.xml"
    )

    const result = importViewStatusAdditionFromXML(mockСontext, xmlData.ViewStatusAddition)

    expect(result).toEqual(minimalViewStatusAddition)
  })
})

