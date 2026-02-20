import { describe, expect, it } from "vitest"
import { fullDynamicList, minimalDynamicList } from "~/tests/fixtures/dynamicList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importDynamicListFromXML } from "./fromXML"
import { DynamicListXML } from "./types"

describe("importDynamicListFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDynamicListFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Settings: DynamicListXML }>("dynamicList/full.xml")

    const result = importDynamicListFromXML(mockContext, mockRule, xmlData.Settings)

    expect(result).toEqual(fullDynamicList)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Settings: DynamicListXML }>("dynamicList/minimal.xml")

    const result = importDynamicListFromXML(mockContext, mockRule, xmlData.Settings)

    expect(result).toEqual(minimalDynamicList)
  })
})
