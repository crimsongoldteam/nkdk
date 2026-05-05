import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPages, minimalPages } from "~/tests/fixtures/forms/pages/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPagesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Pages: ElementXML }>("forms/pages/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: xmlData.Pages,
    })

    expect(result).toEqual(fullPages)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Pages: ElementXML }>("forms/pages/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Pages",
      xml: xmlData.Pages,
    })

    expect(result).toEqual(minimalPages)
  })
})
