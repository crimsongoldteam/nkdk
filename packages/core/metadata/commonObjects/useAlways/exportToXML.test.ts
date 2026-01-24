import { describe, expect, it } from "vitest"
import { fullUseAlways } from "~/tests/fixtures/useAlways/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportUseAlwaysToXML } from "./exportToXML"

describe("exportUseAlwaysToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportUseAlwaysToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("useAlways/full.xml")

    const xmlData = exportUseAlwaysToXML(mockСontext, fullUseAlways)

    const result = xmlExport({ UseAlways: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
