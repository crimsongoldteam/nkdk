import { describe, expect, it } from "vitest"
import { fullFieldsList } from "~/tests/fixtures/fieldsList/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFieldsListToXML } from "./exportToXML"

describe("exportFieldsListToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFieldsListToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("fieldsList/full.xml")

    const xmlData = exportFieldsListToXML(mockContext, fullFieldsList)

    const result = xmlExport({ UseAlways: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
