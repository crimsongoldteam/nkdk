import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullViewStatusAddition, minimalViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importViewStatusAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ElementXML }>("forms/viewStatusAddition/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      xml: xmlData.ViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ViewStatusAddition: ElementXML }>("forms/viewStatusAddition/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      xml: xmlData.ViewStatusAddition,
    })

    expect(result).toEqual(minimalViewStatusAddition)
  })
})
