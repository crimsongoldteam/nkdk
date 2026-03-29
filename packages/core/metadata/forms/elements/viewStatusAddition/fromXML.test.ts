import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullViewStatusAddition } from "~/metadata/forms/elements/viewStatusAddition/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "ViewStatusAddition",
}

describe("importViewStatusAdditionFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ViewStatusAddition: any }>(import.meta.url, "full.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFixture<{ ViewStatusAddition: any }>(import.meta.url, "minimal.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ViewStatusAddition,
    })

    expect(result).toBeUndefined()
  })
})
