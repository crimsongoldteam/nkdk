import { describe, expect, it } from "vitest"
import { fullInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { InputFieldXML } from "./types"
import { importInputFieldFromXML } from "./importFromXML"

describe("importInputFieldFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ InputField: InputFieldXML }>("forms/inputField/full.xml")

    const result = importInputFieldFromXML(mockСontext, xmlData.InputField)

    expect(result).toEqual(fullInputField)
  })
})
