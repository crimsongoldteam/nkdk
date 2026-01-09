import { describe, expect, it } from "vitest"
import { fullFormDecoration, minimalFormDecoration } from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importExtendedTooltipFromXML } from "./importFromXML"
import { ExtendedTooltipXML } from "./types"

describe("importExtendedTooltipFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importExtendedTooltipFromXML(mockСontext, undefined, "ParentElement")

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormDecoration: ExtendedTooltipXML }>("forms/formDecoration/full.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.FormDecoration, "ParentElement")

    expect(result).toEqual(fullFormDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormDecoration: ExtendedTooltipXML }>("forms/formDecoration/minimal.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.FormDecoration, "ParentElement")

    expect(result).toEqual(minimalFormDecoration)
  })

  it("should set elementType to FormDecoration", () => {
    const xmlData = readAndParseXMLFile<{ FormDecoration: ExtendedTooltipXML }>("forms/formDecoration/minimal.xml")

    const result = importExtendedTooltipFromXML(mockСontext, xmlData.FormDecoration, "ParentElement")

    expect(result?.elementType).toBe(fullFormDecoration.elementType)
  })
})
