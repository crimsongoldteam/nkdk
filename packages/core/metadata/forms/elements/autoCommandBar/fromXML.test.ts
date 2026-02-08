import { describe, expect, it } from "vitest"
import { fullAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importAutoCommandBarFromXML } from "./fromXML"

describe("importAutoCommandBarFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: any }>("forms/autoCommandBar/fullForm.xml")

    const result = importAutoCommandBarFromXML(mockContext, mockRule, xmlData.AutoCommandBar)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: any }>("forms/autoCommandBar/minimalForm.xml")

    const result = importAutoCommandBarFromXML(mockContext, mockRule, xmlData.AutoCommandBar)

    expect(result).toBeUndefined()
  })
})
