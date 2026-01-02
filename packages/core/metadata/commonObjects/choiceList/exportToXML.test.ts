import { describe, expect, it } from "vitest"
import { oneItemChoiceList, twoItemsChoiceList } from "~/tests/fixtures/choiceList/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChoiceListToXML } from "./exportToXML"

describe("exportChoiceListToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceListToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export one item choice list", () => {
    const result = exportChoiceListToXML(mockСontext, oneItemChoiceList)
    const expectedResult = readXMLFileAsString("choiceList/oneItem.xml")

    const xmlData = xmlExport({ ChoiceList: result }, false)
    expect(xmlData).toEqual(expectedResult)
  })

  it("should export two items choice list", () => {
    const result = exportChoiceListToXML(mockСontext, twoItemsChoiceList)
    const xmlData = readXMLFileAsString("choiceList/twoItems.xml")
    const xmlString = xmlExport({ ChoiceList: result }, false)
    expect(xmlString).toEqual(xmlData)
  })
})
