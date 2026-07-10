import { describe, expect, it } from "vitest"
import { multipleCommandSet, singleCommandSet } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../../tests/mockContext"
import { readXMLFileAsString } from "../../../../tests/readAndParseXMLFile"
import { xmlExport } from "../../../../xml/export/exporter"
import { exportCommandSetToXML } from "./toXML"

describe("exportCommandSetToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandSetToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single command set", () => {
    const expectedResult = readXMLFileAsString("forms/commandSet/single.xml")
    const xmlData = exportCommandSetToXML(mockContext, mockRule, singleCommandSet)

    const result = xmlExport({ CommandSet: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple command sets", () => {
    const expectedResult = readXMLFileAsString("forms/commandSet/multiple.xml")
    const xmlData = exportCommandSetToXML(mockContext, mockRule, multipleCommandSet)

    const result = xmlExport({ CommandSet: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
