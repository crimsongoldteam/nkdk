import { describe, expect, it } from "vitest"
import { fullPages, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPagesFromXML } from "./importFromXML"
import { PagesXML } from "./types"

describe("importPagesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPagesFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Pages: PagesXML }>("forms/pages/full.xml")

    const result = importPagesFromXML(mockContext, mockRule, xmlData.Pages)

    expect(result).toEqual(fullPages)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Pages: PagesXML }>("forms/pages/minimal.xml")

    const result = importPagesFromXML(mockContext, mockRule, xmlData.Pages)

    expect(result).toEqual(minimalPages)
  })
})
