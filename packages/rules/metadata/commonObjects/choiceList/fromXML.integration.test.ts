import { describe, expect, it } from "vitest"
import { emptyValueChoiceList, oneItemChoiceList, twoItemsChoiceList } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importChoiceListFromXML } from "./fromXML"
import { ChoiceListXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { xmlFixtureValue as importContentFromXML } from "../../../tests/xmlFixtureValue"

describe("importChoiceListFromXML", () => {
  it("rejects empty entries among repeated choices", () => {
    const xml = '<ChoiceList><xr:Item/><xr:Item><xr:Value xsi:type="FormChoiceListDesTimeValue"/></xr:Item></ChoiceList>'
    expect(() => importChoiceListFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ ChoiceList: ChoiceListXML }>(xml).ChoiceList)).toThrow()
    expect(() => importChoiceListFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toThrow()
  })

  it.each([
    ["oneItem.xml", oneItemChoiceList],
    ["twoItems.xml", twoItemsChoiceList],
    ["empty.xml", emptyValueChoiceList],
  ])("reads structural choice list: %s", (file, expected) => {
    expect(importChoiceListFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, file)))).toEqual(expected)
  })

  it.each(["<ChoiceList/>", "<ChoiceList><xr:Item/></ChoiceList>"])("keeps empty structural choices absent: %s", (xml) => {
    expect(importChoiceListFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toBeUndefined()
  })

  it("should return undefined for undefined input", () => {
    const result = importChoiceListFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import one item choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/oneItem.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceList)
    expect(result).toEqual(oneItemChoiceList)
  })

  it("should import two items choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/twoItems.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceList)
    expect(result).toEqual(twoItemsChoiceList)
  })

  it("should import empty value choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/empty.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceList)
    expect(result).toEqual(emptyValueChoiceList)
  })
})
