import { describe, expect, it } from "vitest"
import { fullSearchControlAddition, minimalSearchControlAddition } from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importSearchControlAdditionFromXML } from "./importFromXML"
import { SearchControlAdditionXML } from "./types"

describe("importSearchControlAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importSearchControlAdditionFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
      "forms/searchControlAddition/full.xml"
    )

    const result = importSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

    expect(result).toEqual(fullSearchControlAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
      "forms/searchControlAddition/minimal.xml"
    )

    const result = importSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

    expect(result).toEqual(minimalSearchControlAddition)
  })
})

