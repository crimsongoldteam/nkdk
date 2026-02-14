import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importHtmlDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.HTMLDocumentField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: ElementXML }>("forms/htmlDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.HTMLDocumentField,
      xml: xmlData.HtmlDocumentField,
    })

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: ElementXML }>("forms/htmlDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.HTMLDocumentField,
      xml: xmlData.HtmlDocumentField,
    })

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
