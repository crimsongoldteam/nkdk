import { describe, expect, it } from "vitest"
import { fullLabelDecoration, minimalLabelDecoration } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importLabelDecorationFromXML } from "./importFromXML"
import { LabelDecorationXML } from "./types"

describe("importLabelDecorationFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importLabelDecorationFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ LabelDecoration: LabelDecorationXML }>("forms/labelDecoration/full.xml")

    const result = importLabelDecorationFromXML(mockСontext, xmlData.LabelDecoration)

    expect(result).toEqual(fullLabelDecoration)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ LabelDecoration: LabelDecorationXML }>("forms/labelDecoration/minimal.xml")

    const result = importLabelDecorationFromXML(mockСontext, xmlData.LabelDecoration)

    expect(result).toEqual(minimalLabelDecoration)
  })
})
