import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullTextDocumentField, minimalTextDocumentField } from "~/metadata/forms/elements/textDocumentField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importTextDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TextDocumentField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ TextDocumentField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TextDocumentField",
      xml: xmlData.TextDocumentField,
    })

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ TextDocumentField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "TextDocumentField",
      xml: xmlData.TextDocumentField,
    })

    expect(result).toEqual(minimalTextDocumentField)
  })
})
