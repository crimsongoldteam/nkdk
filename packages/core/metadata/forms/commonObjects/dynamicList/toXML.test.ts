import { describe, expect, it } from "vitest"
import { fullDynamicList, minimalDynamicList } from "~/tests/fixtures/dynamicList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportDynamicListToXML } from "./toXML"

describe("exportDynamicListToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportDynamicListToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("dynamicList/full.xml")

    const xmlData = exportDynamicListToXML(mockContext, mockRule, fullDynamicList)

    const result = xmlExport({ Settings: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("dynamicList/minimal.xml")

    const xmlData = exportDynamicListToXML(mockContext, mockRule, minimalDynamicList)

    const result = xmlExport({ Settings: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
