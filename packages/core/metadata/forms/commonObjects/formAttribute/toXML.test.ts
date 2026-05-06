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
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { setIdsToElements } from "../../clientApplicationForm/toXML"
import { attributeAnyType } from "./__fixtures__/attributeAnyType"
import { columnAnyType } from "./__fixtures__/columnAnyType"
import { tableWithColumns } from "./__fixtures__/tableWithColumns"
import { treeWithColumn } from "./__fixtures__/treeWithColumn"
import { twoTables } from "./__fixtures__/twoTables"
import { exportFormAttributesToXML } from "./toXML"

const formAttributesRule = { type: "FormAttributes", xml: "Attribute" } as const

describe("exportFormAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToXML(mockContextToXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("formAttributes/full.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, fullFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("formAttributes/minimal.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, minimalFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes", () => {
    const expectedResult = readXMLFileAsString("formAttributes/multiple.xml")
    const context = mockContextToXML()

    const xmlData = exportFormAttributesToXML(context, mockRule, multipleFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice list", () => {
    const expectedResult = readXMLFileAsString("formAttributes/choiceList.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, choiceListFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with empty settings", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withEmptySettings.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, withEmptySettingsFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export without type", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withoutType.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, withoutTypeFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  // it("should export with dynamic list", () => {
  //   const expectedResult = readXMLFileAsString("formAttributes/withDynamicList.xml")

  //   const xmlData = exportFormAttributesToXML(mockContext, mockRule, withDynamicListFormAttribute)

  //   const result = xmlExport(xmlData!, false)

  //   expect(result).toEqual(expectedResult)
  // })

  it("should export table with columns", () => {
    const expectedResult = readXMLFileAsString("formAttributes/tableWithColumns.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, tableWithColumnsFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export tree with column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/treeWithColumn.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, treeWithColumnFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with additional column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/additionalColumn.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, withAdditionalColumnFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("export tableWithColumns", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: tableWithColumns,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "tableWithColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export treeWithColumn", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: treeWithColumn,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "treeWithColumn.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export twoTables", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: twoTables,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "twoTables.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export attributeAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: attributeAnyType,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "attributeAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export columnAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: columnAnyType,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "columnAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
