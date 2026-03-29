import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullAutoCommandBar } from "~/metadata/forms/elements/autoCommandBar/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "AutoCommandBar",
}

describe("importAutoCommandBarFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ AutoCommandBar: any }>(import.meta.url, "fullForm.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.AutoCommandBar,
    })

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ AutoCommandBar: any }>(import.meta.url, "minimalForm.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.AutoCommandBar,
    })

    expect(result).toBeUndefined()
  })
})
