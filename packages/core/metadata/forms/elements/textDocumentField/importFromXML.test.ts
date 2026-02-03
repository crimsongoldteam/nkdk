import { describe, expect, it } from "vitest"
import { fullTextDocumentField, minimalTextDocumentField } from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importTextDocumentFieldFromXML } from "./importFromXML"
import { TextDocumentFieldXML } from "./types"

describe("importTextDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTextDocumentFieldFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: TextDocumentFieldXML }>("forms/textDocumentField/full.xml")

    const result = importTextDocumentFieldFromXML(mockContext, mockRule, xmlData.TextDocumentField)

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: TextDocumentFieldXML }>(
      "forms/textDocumentField/minimal.xml"
    )

    const result = importTextDocumentFieldFromXML(mockContext, mockRule, xmlData.TextDocumentField)

    expect(result).toEqual(minimalTextDocumentField)
  })
})
