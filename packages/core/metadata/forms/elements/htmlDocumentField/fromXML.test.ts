import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/metadata/forms/elements/htmlDocumentField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importHtmlDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "HTMLDocumentField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ HTMLDocumentField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "HTMLDocumentField",
      xml: xmlData.HTMLDocumentField,
    })

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ HTMLDocumentField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "HTMLDocumentField",
      xml: xmlData.HTMLDocumentField,
    })

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
