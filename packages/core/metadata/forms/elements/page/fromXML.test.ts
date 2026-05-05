import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPageFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Page: ElementXML }>("forms/page/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: xmlData.Page,
    })

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Page: ElementXML }>("forms/page/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Page",
      xml: xmlData.Page,
    })

    expect(result).toEqual(minimalPage)
  })
})
