import { describe, expect, it } from "vitest"
import { fullTextDocumentField, minimalTextDocumentField } from "~/tests/fixtures/forms/textDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importTextDocumentFieldFromXML } from "./importFromXML"
import { TextDocumentFieldXML } from "./types"

describe("importTextDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTextDocumentFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: TextDocumentFieldXML }>("forms/textDocumentField/full.xml")

    const result = importTextDocumentFieldFromXML(mockСontext, xmlData.TextDocumentField)

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: TextDocumentFieldXML }>("forms/textDocumentField/minimal.xml")

    const result = importTextDocumentFieldFromXML(mockСontext, xmlData.TextDocumentField)

    expect(result).toEqual(minimalTextDocumentField)
  })
})

