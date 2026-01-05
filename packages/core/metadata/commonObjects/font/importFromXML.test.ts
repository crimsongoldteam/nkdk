import { describe, expect, it } from "vitest"
import {
  normalFullFont,
  normalMinimalFont,
  styleFullFont,
  styleMinimalFont,
  systemFullFont,
  systemMinimalFont,
} from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFontFromXML } from "./importFromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import normal minimal font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/normalMinimal.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(normalMinimalFont)
  })

  it("should import system minimal font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/systemMinimal.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(systemMinimalFont)
  })

  it("should import style minimal font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/styleMinimal.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(styleMinimalFont)
  })

  it("should import normal full font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/normalFull.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(normalFullFont)
  })

  it("should import style full font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/styleFull.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(styleFullFont)
  })

  it("should import system full font from XML", () => {
    const xmlData = readAndParseXMLFile<{ Font: FontXML }>("font/systemFull.xml")
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(systemFullFont)
  })
})
