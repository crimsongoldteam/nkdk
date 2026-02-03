import { describe, expect, it } from "vitest"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCheckBoxFieldFromXML } from "./importFromXML"
import { CheckBoxFieldXML } from "./types"

describe("importCheckBoxFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCheckBoxFieldFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CheckBoxField: CheckBoxFieldXML }>("forms/checkBoxField/full.xml")

    const result = importCheckBoxFieldFromXML(mockContext, mockRule, xmlData.CheckBoxField)

    expect(result).toEqual(fullCheckBoxField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CheckBoxField: CheckBoxFieldXML }>("forms/checkBoxField/minimal.xml")

    const result = importCheckBoxFieldFromXML(mockContext, mockRule, xmlData.CheckBoxField)

    expect(result).toEqual(minimalCheckBoxField)
  })
})
