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
  withoutTypeFormAttribute,
} from "~/tests/fixtures/formAttributes/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { attributeAnyType } from "./__fixtures__/attributeAnyType"
import { chartSettings } from "./__fixtures__/chartSettings"
import { columnAnyType } from "./__fixtures__/columnAnyType"
import { mixedColumns } from "./__fixtures__/mixedColumns"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
import { tableWithColumns } from "./__fixtures__/tableWithColumns"
import { treeWithColumn } from "./__fixtures__/treeWithColumn"
import { twoTables } from "./__fixtures__/twoTables"
import { importFormAttributesFromXML } from "./fromXML"
import { FormAttributesXML } from "./types"

const formAttributesRule = { type: "FormAttributes", xml: "Attribute" } as const

describe("importFormAttributesFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/full.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(fullFormAttributes)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/minimal.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(minimalFormAttributes)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/multiple.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(multipleFormAttributes)
  })

  it("should import choice list", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/choiceList.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(choiceListFormAttribute)
  })

  it("should import with empty settings", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withEmptySettings.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(withEmptySettingsFormAttribute)
  })

  it("should import without type", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withoutType.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(withoutTypeFormAttribute)
  })

  // it("should import with dynamic list", () => {
  //   const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withDynamicList.xml")

  //   const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData.Attribute)

  //   expect(result).toEqual(withDynamicListFormAttribute)
  // })

  it("should import table with columns", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/tableWithColumns.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(tableWithColumnsFormAttribute)
  })

  it("should import tree with column", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/treeWithColumn.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(treeWithColumnFormAttribute)
  })

  it("should import with additional column", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/additionalColumn.xml")

    const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual(withAdditionalColumnFormAttribute)
  })

  it("import tableWithColumns", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "tableWithColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(tableWithColumns)
  })

  it("import treeWithColumn", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "treeWithColumn.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(treeWithColumn)
  })

  it("import twoTables", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "twoTables.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(twoTables)
  })

  it("import mixedColumns", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "mixedColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(mixedColumns)
  })

  it("import attributeAnyType", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "attributeAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(attributeAnyType)
  })

  it("import columnAnyType", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "columnAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(columnAnyType)
  })

  it("import chartSettings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "chartSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(chartSettings)
  })

  it("import spreadsheetDocumentSettings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "spreadsheetDocumentSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(spreadsheetDocumentSettings)
  })

  // it("should throw error when ConditionalAppearance is present in XML", () => {
  //   const xmlData = readAndParseXMLFile<{ Attributes: FormAttributesXML }>("formAttributes/conditionalAppearance.xml")

  //   expect(() => importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData.Attributes)).toThrowError(
  //     "ConditionalAppearance is not supported"
  //   )
  // })
})
