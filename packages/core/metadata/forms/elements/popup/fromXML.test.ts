import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullPopup, minimalPopup } from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPopupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Popup,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Popup: ElementXML }>("forms/popup/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Popup,
      xml: xmlData.Popup,
    })

    expect(result).toEqual(fullPopup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Popup: ElementXML }>("forms/popup/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Popup,
      xml: xmlData.Popup,
    })

    expect(result).toEqual(minimalPopup)
  })
})
