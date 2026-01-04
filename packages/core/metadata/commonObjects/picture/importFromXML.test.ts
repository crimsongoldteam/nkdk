import { describe, expect, it } from "vitest"
import {
  commonPicture,
  coommomPictureWithoutTransparent,
  standardPicture,
  standardPictureWithoutTransparent,
} from "~/tests/fixtures/picture/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureFromXML } from "./importFromXML"
import { PictureXML } from "./types"

describe("importPictureFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importPictureFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import standard picture", () => {
    const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>("picture/standart.xml")
    const result = importPictureFromXML(mockСontext, xmlData.Picture)

    expect(result).toEqual(standardPicture)
  })

  it("should import common picture", () => {
    const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>("picture/common.xml")
    const result = importPictureFromXML(mockСontext, xmlData.Picture)

    expect(result).toEqual(commonPicture)
  })

  it("should import common picture without transparent", () => {
    const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>("picture/commonWithoutTransparent.xml")
    const result = importPictureFromXML(mockСontext, xmlData.Picture)

    expect(result).toEqual(coommomPictureWithoutTransparent)
  })

  it("should import standard picture without transparent", () => {
    const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>("picture/standartWithoutTransparent.xml")
    const result = importPictureFromXML(mockСontext, xmlData.Picture)

    expect(result).toEqual(standardPictureWithoutTransparent)
  })
})
