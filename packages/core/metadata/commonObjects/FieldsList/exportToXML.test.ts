import { describe, expect, it } from "vitest"
import { fullFieldsList } from "~/tests/fixtures/fieldsList/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFieldsListToXML } from "./exportToXML"

describe("exportFieldsListToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFieldsListToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("fieldsList/full.xml")

    const xmlData = exportFieldsListToXML(mockСontext, fullFieldsList)

    const result = xmlExport({ UseAlways: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
