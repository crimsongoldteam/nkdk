import { describe, expect, it } from "vitest"
import { emptyValueChoiceList, oneItemChoiceList, twoItemsChoiceList } from "~/tests/fixtures/choiceList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importChoiceListFromXML } from "./fromXML"
import { ChoiceListXML } from "./types"

describe("importChoiceListFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceListFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import one item choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/oneItem.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContext, mockRule, xmlData.ChoiceList)
    expect(result).toEqual(oneItemChoiceList)
  })

  it("should import two items choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/twoItems.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContext, mockRule, xmlData.ChoiceList)
    expect(result).toEqual(twoItemsChoiceList)
  })

  it("should import empty value choice list", () => {
    const xmlData = readAndParseXMLFile<{ ChoiceList: ChoiceListXML }>("choiceList/empty.xml") as {
      ChoiceList: ChoiceListXML
    }
    const result = importChoiceListFromXML(mockContext, mockRule, xmlData.ChoiceList)
    expect(result).toEqual(emptyValueChoiceList)
  })
})
