import { describe, expect, it } from "vitest"
import { fullUsualGroup, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportUsualGroupToXML } from "./exportToXML"

describe("exportUsualGroupToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsualGroupToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/usualGroup/full.xml")
    const xmlData = exportUsualGroupToXML(mockContext, mockRule, fullUsualGroup)

    const result = xmlExport({ UsualGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/usualGroup/minimal.xml")
    const xmlData = exportUsualGroupToXML(mockContext, mockRule, minimalUsualGroup)

    const result = xmlExport({ UsualGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
