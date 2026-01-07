import { describe, expect, it } from "vitest"
import { fullFormItemAddition, minimalFormItemAddition } from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormItemAdditionFromXML } from "./importFromXML"
import { FormItemAdditionXML } from "./types"

describe("importFormItemAdditionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormItemAdditionFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormItemAddition: FormItemAdditionXML }>("forms/formItemAddition/full.xml")

    const result = importFormItemAdditionFromXML(mockСontext, xmlData.FormItemAddition)

    expect(result).toEqual(fullFormItemAddition)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormItemAddition: FormItemAdditionXML }>("forms/formItemAddition/minimal.xml")

    const result = importFormItemAdditionFromXML(mockСontext, xmlData.FormItemAddition)

    expect(result).toEqual(minimalFormItemAddition)
  })
})

