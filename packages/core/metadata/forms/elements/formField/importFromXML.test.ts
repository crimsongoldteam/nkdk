import { describe, expect, it } from "vitest"
import { fullFormField, minimalFormField } from "~/tests/fixtures/forms/formField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormFieldFromXML } from "./importFromXML"
import { FormFieldXML } from "./types"

describe("importFormFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormField: FormFieldXML }>("forms/formField/full.xml")

    const result = importFormFieldFromXML(mockСontext, xmlData.FormField)

    expect(result).toEqual(fullFormField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormField: FormFieldXML }>("forms/formField/minimal.xml")

    const result = importFormFieldFromXML(mockСontext, xmlData.FormField)

    expect(result).toEqual(minimalFormField)
  })
})

