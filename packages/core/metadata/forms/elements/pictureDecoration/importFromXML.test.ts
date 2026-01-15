import { describe, expect, it } from "vitest"
import { fullPictureDecoration, minimalPictureDecoration } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureDecorationFromXML } from "./importFromXML"
import { PictureDecorationXML } from "./types"

describe("importPictureDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPictureDecorationFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: PictureDecorationXML }>("forms/pictureDecoration/full.xml")

    const result = importPictureDecorationFromXML(mockСontext, xmlData.PictureDecoration)

    expect(result).toEqual(fullPictureDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PictureDecoration: PictureDecorationXML }>(
      "forms/pictureDecoration/minimal.xml"
    )

    const result = importPictureDecorationFromXML(mockСontext, xmlData.PictureDecoration)

    expect(result).toEqual(minimalPictureDecoration)
  })
})
