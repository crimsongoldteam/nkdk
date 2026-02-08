import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromXML, importPropertyFromXML, PropertyRule } from "~/metadata/metadataFactory"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule<any> = {
  type: "ExtendedTooltip",
}

describe("importExtendedTooltipFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: any }>("forms/extendedTooltip/full.xml")

    const result = importPropertyFromXML({
      context: mockContext,
      rule: rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: any }>("forms/extendedTooltip/defaults.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.ExtendedTooltip,
      xml: xmlData.ExtendedTooltip,
    })

    expect(result).toBeUndefined()
  })
})
