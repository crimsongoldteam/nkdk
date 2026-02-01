import { describe, expect, it } from "vitest"
import { fullInputField, minimalInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importInputFieldFromXML } from "./importFromXML"
import { InputFieldXML } from "./types"

describe("importInputFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importInputFieldFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ InputField: InputFieldXML }>("forms/inputField/full.xml")

    const result = importInputFieldFromXML(mockContext, xmlData.InputField)

    expect(result).toEqual(fullInputField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ InputField: InputFieldXML }>("forms/inputField/minimal.xml")

    const result = importInputFieldFromXML(mockContext, xmlData.InputField)

    expect(result).toEqual(minimalInputField)
  })
})
