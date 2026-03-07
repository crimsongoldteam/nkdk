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
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAttributesToXML } from "./toXML"

describe("exportFormAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToXML(mockContextToXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("formAttributes/full.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, fullFormAttributes)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("formAttributes/minimal.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, minimalFormAttributes)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes", () => {
    const expectedResult = readXMLFileAsString("formAttributes/multiple.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, multipleFormAttributes)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice list", () => {
    const expectedResult = readXMLFileAsString("formAttributes/choiceList.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, choiceListFormAttribute)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with empty settings", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withEmptySettings.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, withEmptySettingsFormAttribute)

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

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, tableWithColumnsFormAttribute)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export tree with column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/treeWithColumn.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, treeWithColumnFormAttribute)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with additional column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/additionalColumn.xml")

    const xmlData = exportFormAttributesToXML(mockContextToXML(), mockRule, withAdditionalColumnFormAttribute)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })
})
