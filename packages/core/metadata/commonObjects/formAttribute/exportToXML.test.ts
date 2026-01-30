import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  fullFormAttributes,
  minimalFormAttributes,
  multipleFormAttributes,
  tableWithColumnsFormAttribute,
  treeWithColumnFormAttribute,
  withAdditionalColumnFormAttribute,
  withDynamicListFormAttribute,
  withEmptySettingsFormAttribute,
} from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAttributesToXML } from "./exportToXML"

describe("exportFormAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("formAttributes/full.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, fullFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("formAttributes/minimal.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, minimalFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes", () => {
    const expectedResult = readXMLFileAsString("formAttributes/multiple.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, multipleFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice list", () => {
    const expectedResult = readXMLFileAsString("formAttributes/choiceList.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, choiceListFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with empty settings", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withEmptySettings.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, withEmptySettingsFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with dynamic list", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withDynamicList.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, withDynamicListFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export table with columns", () => {
    const expectedResult = readXMLFileAsString("formAttributes/tableWithColumns.xml")
    mockСontext.context = {}

    const xmlData = exportFormAttributesToXML(mockСontext, tableWithColumnsFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export tree with column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/treeWithColumn.xml")
    mockСontext.context = {}

    const xmlData = exportFormAttributesToXML(mockСontext, treeWithColumnFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with additional column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/additionalColumn.xml")
    mockСontext.context = {}

    const xmlData = exportFormAttributesToXML(mockСontext, withAdditionalColumnFormAttribute)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
