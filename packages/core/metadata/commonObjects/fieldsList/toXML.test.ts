import { describe, expect, it } from "vitest"
import { fullFieldsList } from "~/metadata/commonObjects/fieldsList/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFieldsListToXML } from "./toXML"

describe("exportFieldsListToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFieldsListToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("fieldsList/full.xml")

    const xmlData = exportFieldsListToXML(mockContext, mockRule, fullFieldsList)

    const result = xmlExport({ UseAlways: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
