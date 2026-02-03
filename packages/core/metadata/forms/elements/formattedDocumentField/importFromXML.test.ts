import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormattedDocumentFieldFromXML } from "./importFromXML"
import { FormattedDocumentFieldXML } from "./types"

describe("importFormattedDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormattedDocumentFieldFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormattedDocumentField: FormattedDocumentFieldXML }>(
      "forms/formattedDocumentField/full.xml"
    )

    const result = importFormattedDocumentFieldFromXML(mockContext, mockRule, xmlData.FormattedDocumentField)

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormattedDocumentField: FormattedDocumentFieldXML }>(
      "forms/formattedDocumentField/minimal.xml"
    )

    const result = importFormattedDocumentFieldFromXML(mockContext, mockRule, xmlData.FormattedDocumentField)

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
