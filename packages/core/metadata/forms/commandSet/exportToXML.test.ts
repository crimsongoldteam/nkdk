import { describe, expect, it } from "vitest"
import { multipleCommandSet, singleCommandSet } from "~/tests/fixtures/forms/commandSet/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandSetToXML } from "./exportToXML"

describe("exportCommandSetToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandSetToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single command set", () => {
    const expectedResult = readXMLFileAsString("forms/commandSet/single.xml")
    const xmlData = exportCommandSetToXML(mockСontext, singleCommandSet)

    const result = xmlExport({ CommandSet: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple command sets", () => {
    const expectedResult = readXMLFileAsString("forms/commandSet/multiple.xml")
    const xmlData = exportCommandSetToXML(mockСontext, multipleCommandSet)

    const result = xmlExport({ CommandSet: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
