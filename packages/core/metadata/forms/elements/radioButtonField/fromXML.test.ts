import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullRadioButtonField, minimalRadioButtonField } from "~/metadata/forms/elements/radioButtonField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importRadioButtonFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "RadioButtonField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ RadioButtonField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "RadioButtonField",
      xml: xmlData.RadioButtonField,
    })

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ RadioButtonField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "RadioButtonField",
      xml: xmlData.RadioButtonField,
    })

    expect(result).toEqual(minimalRadioButtonField)
  })
})
