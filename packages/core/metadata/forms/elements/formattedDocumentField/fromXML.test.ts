import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/metadata/forms/elements/formattedDocumentField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importFormattedDocumentFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "FormattedDocumentField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ FormattedDocumentField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "FormattedDocumentField",
      xml: xmlData.FormattedDocumentField,
    })

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormattedDocumentField: ElementXML }>(
      "forms/formattedDocumentField/minimal.xml"
    )

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "FormattedDocumentField",
      xml: xmlData.FormattedDocumentField,
    })

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
