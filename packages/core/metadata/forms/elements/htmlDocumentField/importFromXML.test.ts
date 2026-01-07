import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importHTMLDocumentFieldFromXML } from "./importFromXML"
import { HTMLDocumentFieldXML } from "./types"

describe("importHtmlDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importHTMLDocumentFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: HTMLDocumentFieldXML }>("forms/htmlDocumentField/full.xml")

    const result = importHTMLDocumentFieldFromXML(mockСontext, xmlData.HtmlDocumentField)

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: HTMLDocumentFieldXML }>(
      "forms/htmlDocumentField/minimal.xml"
    )

    const result = importHTMLDocumentFieldFromXML(mockСontext, xmlData.HtmlDocumentField)

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})
