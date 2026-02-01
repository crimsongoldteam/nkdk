import { describe, expect, it } from "vitest"
import { fullPictureField, minimalPictureField } from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureFieldFromXML } from "./importFromXML"
import { PictureFieldXML } from "./types"

describe("importPictureFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPictureFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PictureField: PictureFieldXML }>("forms/pictureField/full.xml")

    const result = importPictureFieldFromXML(mockContext, xmlData.PictureField)

    expect(result).toEqual(fullPictureField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PictureField: PictureFieldXML }>("forms/pictureField/minimal.xml")

    const result = importPictureFieldFromXML(mockContext, xmlData.PictureField)

    expect(result).toEqual(minimalPictureField)
  })
})
