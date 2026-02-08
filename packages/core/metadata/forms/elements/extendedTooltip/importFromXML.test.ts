import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importExtendedTooltipFromXML } from "./fromXML"

describe("importExtendedTooltipFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ElementXML }>("forms/extendedTooltip/full.xml")

    const result = importExtendedTooltipFromXML(mockContext, mockRule, xmlData.ExtendedTooltip)

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ElementXML }>("forms/extendedTooltip/defaults.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.FormDecoration,
      xml: xmlData.ExtendedTooltip,
    })

    expect(result).toBeUndefined()
  })
})
