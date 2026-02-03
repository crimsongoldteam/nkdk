import { describe, expect, it } from "vitest"
import { fullUsualGroup, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importUsualGroupFromXML } from "./importFromXML"
import { UsualGroupXML } from "./types"

describe("importUsualGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUsualGroupFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ UsualGroup: UsualGroupXML }>("forms/usualGroup/full.xml")

    const result = importUsualGroupFromXML(mockContext, mockRule, xmlData.UsualGroup)

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ UsualGroup: UsualGroupXML }>("forms/usualGroup/minimal.xml")

    const result = importUsualGroupFromXML(mockContext, mockRule, xmlData.UsualGroup)

    expect(result).toEqual(minimalUsualGroup)
  })
})
