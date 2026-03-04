import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullLabelDecoration, minimalLabelDecoration } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importLabelDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "LabelDecoration",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ LabelDecoration: ElementXML }>("forms/labelDecoration/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "LabelDecoration",
      xml: xmlData.LabelDecoration,
    })

    expect(result).toEqual(fullLabelDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ LabelDecoration: ElementXML }>("forms/labelDecoration/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "LabelDecoration",
      xml: xmlData.LabelDecoration,
    })

    expect(result).toEqual(minimalLabelDecoration)
  })
})
