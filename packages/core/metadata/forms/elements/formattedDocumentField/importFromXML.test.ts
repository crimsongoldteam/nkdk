import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importFormattedDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.FormattedDocumentField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormattedDocumentField: ElementXML }>("forms/formattedDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.FormattedDocumentField,
      xml: xmlData.FormattedDocumentField,
    })

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormattedDocumentField: ElementXML }>(
      "forms/formattedDocumentField/minimal.xml"
    )

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.FormattedDocumentField,
      xml: xmlData.FormattedDocumentField,
    })

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
