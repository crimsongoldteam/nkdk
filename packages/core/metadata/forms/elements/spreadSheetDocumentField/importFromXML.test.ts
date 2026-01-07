import { describe, expect, it } from "vitest"
import { fullSpreadSheetDocumentField, minimalSpreadSheetDocumentField } from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importSpreadSheetDocumentFieldFromXML } from "./importFromXML"
import { SpreadSheetDocumentFieldXML } from "./types"

describe("importSpreadSheetDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importSpreadSheetDocumentFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SpreadSheetDocumentField: SpreadSheetDocumentFieldXML }>(
      "forms/spreadSheetDocumentField/full.xml"
    )

    const result = importSpreadSheetDocumentFieldFromXML(mockСontext, xmlData.SpreadSheetDocumentField)

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SpreadSheetDocumentField: SpreadSheetDocumentFieldXML }>(
      "forms/spreadSheetDocumentField/minimal.xml"
    )

    const result = importSpreadSheetDocumentFieldFromXML(mockСontext, xmlData.SpreadSheetDocumentField)

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})

