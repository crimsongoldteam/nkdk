import { describe, expect, it } from "vitest"
import { absoluteColor, styleColor, webColor, winColor } from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importColorFromXML } from "./importFromXML"
import { ColorXML } from "./types"

describe("importColorFromXML", () => {
  it("should import absolute color from XML", () => {
    const xmlData = readAndParseXMLFile<{ Color: ColorXML }>("color/absolute.xml")
    const result = importColorFromXML(mockСontext, xmlData.Color)

    expect(result).toEqual(absoluteColor)
  })

  it("should import Windows color from XML", () => {
    const xmlData = readAndParseXMLFile<{ Color: ColorXML }>("color/win.xml")
    const result = importColorFromXML(mockСontext, xmlData.Color)

    expect(result).toEqual(winColor)
  })

  it("should import Web color from XML", () => {
    const xmlData = readAndParseXMLFile<{ Color: ColorXML }>("color/web.xml")
    const result = importColorFromXML(mockСontext, xmlData.Color)

    expect(result).toEqual(webColor)
  })

  it("should import style color from XML", () => {
    const xmlData = readAndParseXMLFile<{ Color: ColorXML }>("color/style.xml")
    const result = importColorFromXML(mockСontext, xmlData.Color)

    expect(result).toEqual(styleColor)
  })

  it("should return undefined for undefined input", () => {
    const result = importColorFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
