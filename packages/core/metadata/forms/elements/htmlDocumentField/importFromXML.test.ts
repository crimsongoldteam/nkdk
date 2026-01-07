import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importHtmlDocumentFieldFromXML } from "./importFromXML"
import { HtmlDocumentFieldXML } from "./types"

describe("importHtmlDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importHtmlDocumentFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: HtmlDocumentFieldXML }>("forms/htmlDocumentField/full.xml")

    const result = importHtmlDocumentFieldFromXML(mockСontext, xmlData.HtmlDocumentField)

    expect(result).toEqual(fullHtmlDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ HtmlDocumentField: HtmlDocumentFieldXML }>("forms/htmlDocumentField/minimal.xml")

    const result = importHtmlDocumentFieldFromXML(mockСontext, xmlData.HtmlDocumentField)

    expect(result).toEqual(minimalHtmlDocumentField)
  })
})

