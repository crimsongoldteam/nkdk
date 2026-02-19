import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  fullFormAttributes,
  minimalFormAttributes,
  multipleFormAttributes,
  tableWithColumnsFormAttribute,
  treeWithColumnFormAttribute,
  withAdditionalColumnFormAttribute,
  withEmptySettingsFormAttribute,
} from "~/tests/fixtures/formAttributes/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormAttributesFromXML } from "./fromXML"
import { FormAttributesXML } from "./types"

describe("importFormAttributesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/full.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/minimal.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/multiple.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(multipleFormAttributes)
  })

  it("should import choice list", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/choiceList.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withEmptySettings.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  // it("should import with dynamic list", () => {
  //   const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withDynamicList.xml")

  //   const result = importFormAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

  //   expect(result).toEqual(withDynamicListFormAttribute)
  // })

  it("should import table with columns", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/tableWithColumns.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(tableWithColumnsFormAttribute)
  })

  it("should import tree with column", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/treeWithColumn.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(treeWithColumnFormAttribute)
  })

  it("should import with additional column", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/additionalColumn.xml")

    const result = importFormAttributesFromXML(mockContext, mockRule, xmlData)

    expect(result).toEqual(withAdditionalColumnFormAttribute)
  })

  // it("should throw error when ConditionalAppearance is present in XML", () => {
  //   const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/conditionalAppearance.xml")

  //   expect(() => importFormAttributesFromXML(mockContext, mockRule, xmlData.Attributes)).toThrowError(
  //     "ConditionalAppearance is not supported"
  //   )
  // })
})
