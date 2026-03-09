import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule = {
  type: "ExtendedTooltip",
}

describe("importExtendedTooltipFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: any }>("forms/extendedTooltip/full.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: any }>("forms/extendedTooltip/defaults.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toBeUndefined()
  })
})
