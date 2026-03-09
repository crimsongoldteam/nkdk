import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import { fullAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule = {
  type: "AutoCommandBar",
}

describe("importAutoCommandBarFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: any }>("forms/autoCommandBar/fullForm.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.AutoCommandBar,
    })

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: any }>("forms/autoCommandBar/minimalForm.xml")

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule: rule,
      value: xmlData.AutoCommandBar,
    })

    expect(result).toBeUndefined()
  })
})
