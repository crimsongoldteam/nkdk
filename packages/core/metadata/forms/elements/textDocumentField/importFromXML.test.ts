import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullTextDocumentField, minimalTextDocumentField } from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importTextDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.TextDocumentField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: ElementXML }>("forms/textDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.TextDocumentField,
      xml: xmlData.TextDocumentField,
    })

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ TextDocumentField: ElementXML }>("forms/textDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.TextDocumentField,
      xml: xmlData.TextDocumentField,
    })

    expect(result).toEqual(minimalTextDocumentField)
  })
})
