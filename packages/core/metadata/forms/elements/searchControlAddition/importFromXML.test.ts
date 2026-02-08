import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullSearchControlAddition, minimalSearchControlAddition } from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importSearchControlAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchControlAddition,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ SearchControlAddition: ElementXML }>("forms/searchControlAddition/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchControlAddition,
      xml: xmlData.SearchControlAddition,
    })

    expect(result).toEqual(fullSearchControlAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ SearchControlAddition: ElementXML }>("forms/searchControlAddition/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.SearchControlAddition,
      xml: xmlData.SearchControlAddition,
    })

    expect(result).toEqual(minimalSearchControlAddition)
  })
})
