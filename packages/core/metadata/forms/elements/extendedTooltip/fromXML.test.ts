import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullExtendedTooltip } from "~/metadata/forms/elements/extendedTooltip/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "ExtendedTooltip",
}

describe("importExtendedTooltipFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ ExtendedTooltip: any }>(import.meta.url, "full.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFixture<{ ExtendedTooltip: any }>(import.meta.url, "defaults.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toBeUndefined()
  })
})
