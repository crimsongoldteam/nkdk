import { describe, expect, it } from "vitest"
import { fullFormDecoration, minimalFormDecoration } from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormDecorationFromXML } from "./importFromXML"
import { FormDecorationXML } from "./types"

describe("importFormDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormDecorationFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ FormDecoration: FormDecorationXML }>("forms/formDecoration/full.xml")

    const result = importFormDecorationFromXML(mockСontext, xmlData.FormDecoration)

    expect(result).toEqual(fullFormDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ FormDecoration: FormDecorationXML }>("forms/formDecoration/minimal.xml")

    const result = importFormDecorationFromXML(mockСontext, xmlData.FormDecoration)

    expect(result).toEqual(minimalFormDecoration)
  })
})

