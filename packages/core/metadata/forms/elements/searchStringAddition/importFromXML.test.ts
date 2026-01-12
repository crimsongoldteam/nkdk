import { describe, expect, it } from "vitest"
import { fullSearchStringAddition, minimalSearchStringAddition } from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importSearchStringAdditionFromXML } from "./importFromXML"
import { SearchStringAdditionXML } from "./types"

describe("importSearchStringAdditionFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
      "forms/searchStringAddition/full.xml"
    )

    const result = importSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

    expect(result).toEqual(fullSearchStringAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
      "forms/searchStringAddition/minimal.xml"
    )

    const result = importSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

    expect(result).toEqual(minimalSearchStringAddition)
  })
})
