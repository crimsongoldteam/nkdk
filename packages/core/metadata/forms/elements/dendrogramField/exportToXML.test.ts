import { describe, expect, it } from "vitest"
import { fullDendrogramField, minimalDendrogramField } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportDendrogramFieldToXML } from "./exportToXML"

describe("exportDendrogramFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportDendrogramFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/dendrogramField/full.xml")
    const xmlData = exportDendrogramFieldToXML(mockContext, fullDendrogramField)

    const result = xmlExport({ DendrogramField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/dendrogramField/minimal.xml")
    const xmlData = exportDendrogramFieldToXML(mockContext, minimalDendrogramField)

    const result = xmlExport({ DendrogramField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
