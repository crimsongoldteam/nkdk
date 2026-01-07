import { describe, expect, it } from "vitest"
import { fullPopup, minimalPopup } from "~/tests/fixtures/forms/popup/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPopupFromXML } from "./importFromXML"
import { PopupXML } from "./types"

describe("importPopupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPopupFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Popup: PopupXML }>("forms/popup/full.xml")

    const result = importPopupFromXML(mockСontext, xmlData.Popup)

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Popup: PopupXML }>("forms/popup/minimal.xml")

    const result = importPopupFromXML(mockСontext, xmlData.Popup)

    expect(result).toEqual(minimalPopup)
  })
})


