import { describe, expect, it } from "vitest"
import { fullPictureDecoration, minimalPictureDecoration } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureDecorationFromXML } from "./importFromXML"
import { PictureDecorationXML } from "./types"

describe("importPictureDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPictureDecorationFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: PictureDecorationXML }>("forms/pictureDecoration/full.xml")

    const result = importPictureDecorationFromXML(mockContext, xmlData.PictureDecoration)

    expect(result).toEqual(fullPictureDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: PictureDecorationXML }>(
      "forms/pictureDecoration/minimal.xml"
    )

    const result = importPictureDecorationFromXML(mockContext, xmlData.PictureDecoration)

    expect(result).toEqual(minimalPictureDecoration)
  })
})
