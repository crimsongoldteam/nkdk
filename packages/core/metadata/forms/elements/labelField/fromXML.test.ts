import { describe, expect, it } from "vitest"
import { CollectionFormElementType, ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullLabelField, minimalLabelField } from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importLabelFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.LabelField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ LabelField: ElementXML }>("forms/labelField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.LabelField,
      xml: xmlData.LabelField,
    })

    expect(result).toEqual(fullLabelField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ LabelField: ElementXML }>("forms/labelField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.LabelField,
      xml: xmlData.LabelField,
    })

    expect(result).toEqual(minimalLabelField)
  })
})
