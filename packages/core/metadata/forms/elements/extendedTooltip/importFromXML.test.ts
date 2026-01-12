import { describe, expect, it } from "vitest"
import { withContentExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importExtendedTooltipFromXML } from "./importFromXML"
import { ExtendedTooltipXML } from "./types"

describe("importExtendedTooltipFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importExtendedTooltipFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import with content to object", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>(
      "forms/extendedTooltip/withContentExtendedTooltip.xml"
    )

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip)

    expect(result).toEqual(withContentExtendedTooltip)
  })
})
