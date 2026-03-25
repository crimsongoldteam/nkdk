import { describe, expect, it } from "vitest"
import { fullDynamicList, minimalDynamicList } from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importDynamicListFromXML } from "./fromXML"
import { DynamicListXML } from "./types"

describe("importDynamicListFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDynamicListFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Settings: DynamicListXML }>("dynamicList/full.xml")

    const result = importDynamicListFromXML(mockContextFromXML(), mockRule, xmlData.Settings)

    expect(result).toEqual(fullDynamicList)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Settings: DynamicListXML }>("dynamicList/minimal.xml")

    const result = importDynamicListFromXML(mockContextFromXML(), mockRule, xmlData.Settings)

    expect(result).toEqual(minimalDynamicList)
  })
})
