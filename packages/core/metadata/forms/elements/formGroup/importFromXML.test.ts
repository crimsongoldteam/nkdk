import { describe, expect, it } from "vitest"
import { fullFormGroup, minimalFormGroup } from "~/tests/fixtures/forms/formGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormGroupFromXML } from "./importFromXML"
import { FormGroupXML } from "./types"

describe("importFormGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormGroupFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormGroup: FormGroupXML }>("forms/formGroup/full.xml")

    const result = importFormGroupFromXML(mockСontext, xmlData.FormGroup)

    expect(result).toEqual(fullFormGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormGroup: FormGroupXML }>("forms/formGroup/minimal.xml")

    const result = importFormGroupFromXML(mockСontext, xmlData.FormGroup)

    expect(result).toEqual(minimalFormGroup)
  })
})

