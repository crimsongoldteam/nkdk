import { describe, expect, it } from "vitest"
import { emptyValueChoiceList, oneItemChoiceList, twoItemsChoiceList } from "~/tests/fixtures/choiceList/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceListToXML } from "./exportToXML"

describe("exportChoiceListToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export one item choice list", () => {
    const result = exportChoiceListToXML(mockContext, oneItemChoiceList)
    const expectedResult = readXMLFileAsString("choiceList/oneItem.xml")

    const xmlData = xmlExport({ ChoiceList: result }, false)
    expect(xmlData).toEqual(expectedResult)
  })

  it("should export two items choice list", () => {
    const result = exportChoiceListToXML(mockContext, twoItemsChoiceList)
    const xmlData = readXMLFileAsString("choiceList/twoItems.xml")
    const xmlString = xmlExport({ ChoiceList: result }, false)
    expect(xmlString).toEqual(xmlData)
  })

  it("should export empty value choice list", () => {
    const result = exportChoiceListToXML(mockContext, emptyValueChoiceList)
    const expectedResult = readXMLFileAsString("choiceList/empty.xml")

    const xmlData = xmlExport({ ChoiceList: result }, false)
    expect(xmlData).toEqual(expectedResult)
  })
})
