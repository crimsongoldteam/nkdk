import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule = {
  type: "ViewStatusAddition",
}

describe("importViewStatusAdditionFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: any }>("forms/viewStatusAddition/full.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: any }>("forms/viewStatusAddition/minimal.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ViewStatusAddition,
    })

    expect(result).toBeUndefined()
  })
})
