import { describe, expect, it } from "vitest"
import { fullFormAttributes, minimalFormAttributes, multipleFormAttributes } from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormAttributesFromXML } from "./importFromXML"
import { FormAttributesXML } from "./types"

describe("importFormAttributesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/full.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/minimal.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/multiple.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(multipleFormAttributes)
  })

  // it("should throw error when ConditionalAppearance is present in XML", () => {
  //   const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/conditionalAppearance.xml")

  //   expect(() => importFormAttributesFromXML(mockСontext, xmlData.Attributes)).toThrowError(
  //     "ConditionalAppearance is not supported"
  //   )
  // })
})
