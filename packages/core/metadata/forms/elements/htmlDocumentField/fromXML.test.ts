import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

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
    const xmlData = readAndParseXMLFile<{ HTMLDocumentField: ElementXML }>("forms/htmlDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "HTMLDocumentField",
      xml: xmlData.HTMLDocumentField,
    })

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ HTMLDocumentField: ElementXML }>("forms/htmlDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "HTMLDocumentField",
      xml: xmlData.HTMLDocumentField,
    })

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
