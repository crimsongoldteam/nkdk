import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullSearchStringAddition, minimalSearchStringAddition } from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importSearchStringAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchStringAddition,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SearchStringAddition: ElementXML }>("forms/searchStringAddition/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchStringAddition,
      xml: xmlData.SearchStringAddition,
    })

    expect(result).toEqual(fullSearchStringAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SearchStringAddition: ElementXML }>("forms/searchStringAddition/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchStringAddition,
      xml: xmlData.SearchStringAddition,
    })

    expect(result).toEqual(minimalSearchStringAddition)
  })
})
