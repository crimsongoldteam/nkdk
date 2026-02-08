import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullPictureDecoration, minimalPictureDecoration } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPictureDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.PictureDecoration,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: ElementXML }>("forms/pictureDecoration/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.PictureDecoration,
      xml: xmlData.PictureDecoration,
    })

    expect(result).toEqual(fullPictureDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: ElementXML }>("forms/pictureDecoration/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.PictureDecoration,
      xml: xmlData.PictureDecoration,
    })

    expect(result).toEqual(minimalPictureDecoration)
  })
})
