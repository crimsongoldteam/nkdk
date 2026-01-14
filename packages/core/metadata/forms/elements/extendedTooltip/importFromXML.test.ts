import { describe, expect, it } from "vitest"
import { fullExtendedTooltip } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importExtendedTooltipFromXML } from "./importFromXML"
import { ExtendedTooltipXML } from "./types"

describe("importExtendedTooltipFromXML", () => {
  // it("should return undefined when data is undefined", () => {
  //   const result = importExtendedTooltipFromXML(mockСontext, undefined)

  //   expect(result).toBeUndefined()
  // })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>("forms/extendedTooltip/full.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip)

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should import minimal to undefined", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>("forms/extendedTooltip/defaults.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip)

    expect(result).toBeUndefined()
  })
})
