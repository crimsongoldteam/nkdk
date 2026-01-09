import { describe, expect, it } from "vitest"
import {
  defaultExtendedTooltip,
  otherParentElement,
  parentElement,
  withContentExtendedTooltip,
} from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importExtendedTooltipFromXML } from "./importFromXML"
import { ExtendedTooltipXML } from "./types"

describe("importExtendedTooltipFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importExtendedTooltipFromXML(mockСontext, undefined, parentElement)

    expect(result).toBeUndefined()
  })

  it("should import with content to object", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>(
      "forms/extendedTooltip/withContentExtendedTooltip.xml"
    )

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip, parentElement)

    expect(result).toEqual(withContentExtendedTooltip)
  })

  it("should import minimal to undefined if name is default", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>("forms/extendedTooltip/defaults.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip, parentElement)

    expect(result).toBeUndefined()
  })

  it("should import minimal to object if name is not default", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: ExtendedTooltipXML }>("forms/extendedTooltip/defaults.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.ExtendedTooltip, otherParentElement)

    expect(result).toEqual(defaultExtendedTooltip)
  })
})
