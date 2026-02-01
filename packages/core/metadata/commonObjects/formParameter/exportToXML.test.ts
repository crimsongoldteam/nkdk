import { describe, expect, it } from "vitest"
import { fullFormParameters } from "~/tests/fixtures/formParameter/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormParametersToXML } from "./exportToXML"

describe("exportFormParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFormParametersToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export form parameters correctly", () => {
    const expectedResult = readXMLFileAsString("formParameter/full.xml")
    const xmlData = exportFormParametersToXML(mockContext, fullFormParameters)
    const result = xmlExport({ Parameter: xmlData }, false)
    expect(result).toEqual(expectedResult.trim())
  })
})
