import { describe, expect, it } from "vitest"
import { fullColumnGroup, minimalColumnGroup } from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportColumnGroupToXML } from "./exportToXML"

describe("exportColumnGroupToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportColumnGroupToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/columnGroup/full.xml")
    const xmlData = exportColumnGroupToXML(mockContext, mockRule, fullColumnGroup)

    const result = xmlExport({ ColumnGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/columnGroup/minimal.xml")
    const xmlData = exportColumnGroupToXML(mockContext, mockRule, minimalColumnGroup)

    const result = xmlExport({ ColumnGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
