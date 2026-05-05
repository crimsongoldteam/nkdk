import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importCheckBoxFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CheckBoxField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CheckBoxField: ElementXML }>("forms/checkBoxField/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CheckBoxField",
      xml: xmlData.CheckBoxField,
    })

    expect(result).toEqual(fullCheckBoxField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CheckBoxField: ElementXML }>("forms/checkBoxField/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CheckBoxField",
      xml: xmlData.CheckBoxField,
    })

    expect(result).toEqual(minimalCheckBoxField)
  })
})
