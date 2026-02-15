import { describe, expect, it } from "vitest"
import { CollectionFormElementType, ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullTrackBarField, minimalTrackBarField } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importTrackBarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.TrackBarField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ TrackBarField: ElementXML }>("forms/trackBarField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.TrackBarField,
      xml: xmlData.TrackBarField,
    })

    expect(result).toEqual(fullTrackBarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ TrackBarField: ElementXML }>("forms/trackBarField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.TrackBarField,
      xml: xmlData.TrackBarField,
    })

    expect(result).toEqual(minimalTrackBarField)
  })
})
