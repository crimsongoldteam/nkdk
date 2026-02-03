import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importViewStatusAdditionFromXML } from "./importFromXML"
import { ViewStatusAdditionXML } from "./types"

describe("importViewStatusAdditionFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ViewStatusAdditionXML }>(
      "forms/viewStatusAddition/full.xml"
    )

    const result = importViewStatusAdditionFromXML(mockContext, mockRule, xmlData.ViewStatusAddition)

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ViewStatusAdditionXML }>(
      "forms/viewStatusAddition/minimal.xml"
    )

    const result = importViewStatusAdditionFromXML(mockContext, mockRule, xmlData.ViewStatusAddition)

    expect(result).toBeUndefined()
  })
})
