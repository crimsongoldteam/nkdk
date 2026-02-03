import { describe, expect, it } from "vitest"
import { fullRadioButtonField, minimalRadioButtonField } from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importRadioButtonFieldFromXML } from "./importFromXML"
import { RadioButtonFieldXML } from "./types"

describe("importRadioButtonFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importRadioButtonFieldFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ RadioButtonField: RadioButtonFieldXML }>("forms/radioButtonField/full.xml")

    const result = importRadioButtonFieldFromXML(mockContext, mockRule, xmlData.RadioButtonField)

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ RadioButtonField: RadioButtonFieldXML }>("forms/radioButtonField/minimal.xml")

    const result = importRadioButtonFieldFromXML(mockContext, mockRule, xmlData.RadioButtonField)

    expect(result).toEqual(minimalRadioButtonField)
  })
})
