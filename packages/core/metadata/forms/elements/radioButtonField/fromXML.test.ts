import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullRadioButtonField, minimalRadioButtonField } from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importRadioButtonFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.RadioButtonField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ RadioButtonField: ElementXML }>("forms/radioButtonField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.RadioButtonField,
      xml: xmlData.RadioButtonField,
    })

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ RadioButtonField: ElementXML }>("forms/radioButtonField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.RadioButtonField,
      xml: xmlData.RadioButtonField,
    })

    expect(result).toEqual(minimalRadioButtonField)
  })
})
