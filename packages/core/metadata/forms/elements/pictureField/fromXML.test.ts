import { describe, expect, it } from "vitest"
import { CollectionFormElementType, ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullPictureField, minimalPictureField } from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPictureFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.PictureField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PictureField: ElementXML }>("forms/pictureField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.PictureField,
      xml: xmlData.PictureField,
    })

    expect(result).toEqual(fullPictureField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PictureField: ElementXML }>("forms/pictureField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.PictureField,
      xml: xmlData.PictureField,
    })

    expect(result).toEqual(minimalPictureField)
  })
})
