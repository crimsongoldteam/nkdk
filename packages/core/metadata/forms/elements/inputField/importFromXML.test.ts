import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullInputField, minimalInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importInputFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.InputField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ InputField: ElementXML }>("forms/inputField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.InputField,
      xml: xmlData.InputField,
    })

    expect(result).toEqual(fullInputField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ InputField: ElementXML }>("forms/inputField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.InputField,
      xml: xmlData.InputField,
    })

    expect(result).toEqual(minimalInputField)
  })
})
