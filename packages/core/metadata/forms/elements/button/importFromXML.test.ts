import { describe, expect, it } from "vitest"
import { CollectionFormElementType, ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importButtonFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Button,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Button: any }>("forms/button/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Button,
      xml: xmlData.Button,
    })

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Button: ElementXML }>("forms/button/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Button,
      xml: xmlData.Button,
    })

    expect(result).toEqual(minimalButton)
  })
})
