import { describe, expect, it } from "vitest"
import {
  fullFormAttributes,
  minimalFormAttributes,
  multipleFormAttributes,
  withMainAttributeFormAttribute,
  withStoredDataFormAttribute,
} from "~/tests/fixtures/formAttributes/data"
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
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/full.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/minimal.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import defaults", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/defaults.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/multiple.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(multipleFormAttributes)
  })

  it("should import with main attribute", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/withMainAttribute.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(withMainAttributeFormAttribute)
  })

  it("should import with stored data", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/withStoredData.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual(withStoredDataFormAttribute)
  })

  it("should ignore ConditionalAppearance from XML", () => {
    const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/conditionalAppearance.xml")

    const result = importFormAttributesFromXML(mockСontext, xmlData.Attributes)

    expect(result).toEqual([])
  })
})
