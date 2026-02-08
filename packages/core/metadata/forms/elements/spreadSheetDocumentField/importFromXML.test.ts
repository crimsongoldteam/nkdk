import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullSpreadSheetDocumentField, minimalSpreadSheetDocumentField } from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importSpreadSheetDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SpreadSheetDocumentField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SpreadSheetDocumentField: ElementXML }>("forms/spreadSheetDocumentField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SpreadSheetDocumentField,
      xml: xmlData.SpreadSheetDocumentField,
    })

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SpreadSheetDocumentField: ElementXML }>("forms/spreadSheetDocumentField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SpreadSheetDocumentField,
      xml: xmlData.SpreadSheetDocumentField,
    })

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})
