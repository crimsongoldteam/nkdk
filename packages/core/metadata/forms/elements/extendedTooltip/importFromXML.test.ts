import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importExtendedTooltipFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ElementXML }>("forms/extendedTooltip/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.FormDecoration,
      xml: xmlData.ExtendedTooltip,
    })

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
